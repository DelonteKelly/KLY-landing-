// KLY Dashboard + DAO + Staking Integrated JS

const KLY_ADDRESS = "0x2e4fEB2Fe668c8Ebe84f19e6c8fE8Cf8131B4E52";
const STAKING_CONTRACT = "0x25548Ba29a0071F30E4bDCd98Ea72F79341b07a1";
const NFT_CONTRACT = "0xc1a2E9A475779EfD04247EA473638717E26cd5C5";
const DAO_CONTRACT = "0x796Bce7F95662774243177D1F546eBA0B3465579";
const NFT_URI = "ipfs://bafybeihkmkaf2mgx7xkrnkhmzd2uvhr6ddgj6z3vkqcgnvlaa3z7x263r4";

let provider, signer, wallet;

const KLY_ABI = [
  {
    name: "balanceOf",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ type: "uint256" }],
    stateMutability: "view",
    type: "function"
  },
  {
    name: "totalSupply",
    inputs: [],
    outputs: [{ type: "uint256" }],
    stateMutability: "view",
    type: "function"
  },
  {
    name: "decimals",
    inputs: [],
    outputs: [{ type: "uint8" }],
    stateMutability: "view",
    type: "function"
  },
  {
    name: "symbol",
    inputs: [],
    outputs: [{ type: "string" }],
    stateMutability: "view",
    type: "function"
  },
  {
    name: "approve",
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" }
    ],
    outputs: [{ type: "bool" }],
    stateMutability: "nonpayable",
    type: "function"
  }
];

const NFT_ABI = [
  { name: "mintTo", inputs: [{ name: "_to", type: "address" }, { name: "_uri", type: "string" }], outputs: [{ type: "uint256" }], type: "function", stateMutability: "nonpayable" },
  { name: "balanceOf", inputs: [{ name: "owner", type: "address" }], outputs: [{ type: "uint256" }], type: "function", stateMutability: "view" }
];

const STAKING_ABI = [
  { name: "getStakeInfo", inputs: [{ name: "", type: "address" }], outputs: [{ name: "staked", type: "uint256" }, { name: "timestamp", type: "uint256" }], stateMutability: "view", type: "function" },
  { name: "getRewardInfo", inputs: [{ name: "", type: "address" }], outputs: [{ type: "uint256" }], stateMutability: "view", type: "function" },
  { name: "getTotalStakedSupply", inputs: [], outputs: [{ type: "uint256" }], stateMutability: "view", type: "function" },
  { name: "stake", inputs: [{ name: "amount", type: "uint256" }], outputs: [], stateMutability: "nonpayable", type: "function" },
  { name: "withdraw", inputs: [{ name: "amount", type: "uint256" }], outputs: [], stateMutability: "nonpayable", type: "function" },
  { name: "claim", inputs: [], outputs: [], stateMutability: "nonpayable", type: "function" }
];

const DAO_ABI = [
  { name: "getAllProposals", inputs: [], outputs: [{ type: "tuple[]", components: [
    { name: "proposalId", type: "uint256" },
    { name: "description", type: "string" },
    { name: "votesFor", type: "uint256" },
    { name: "votesAgainst", type: "uint256" },
    { name: "votesAbstain", type: "uint256" },
    { name: "executed", type: "bool" }
  ] }], type: "function", stateMutability: "view" },
  { name: "propose", inputs: [{ name: "description", type: "string" }], outputs: [], type: "function" },
  { name: "castVote", inputs: [{ name: "proposalId", type: "uint256" }, { name: "vote", type: "uint8" }], outputs: [], type: "function" },
  { name: "execute", inputs: [{ name: "proposalId", type: "uint256" }], outputs: [], type: "function" }
];

// WALLET
async function connectWallet() {
  if (!window.ethereum) return alert("MetaMask required.");

  provider = new ethers.providers.Web3Provider(window.ethereum);
  await provider.send("eth_requestAccounts", []);
  signer = provider.getSigner();
  wallet = await signer.getAddress();

  // Handle account and network changes
  window.ethereum.on('accountsChanged', () => {
    window.location.reload(); // Reconnect wallet on account change
  });

  window.ethereum.on('chainChanged', () => {
    window.location.reload(); // Reconnect on network change
  });

  // Update UI
  document.getElementById("walletAddress").textContent = wallet.slice(0, 6) + "..." + wallet.slice(-4);
  document.getElementById("walletAddress").style.display = "inline-block";
  document.getElementById("accessStatus").textContent = "Wallet: Connected";
  document.getElementById("dashboardStats").style.display = "block";
  document.getElementById("refreshData").style.display = "inline-block";

  updateDashboardStats();

  return wallet;
}

// TOKEN STATS
async function getKLYBalance() {
  const contract = new ethers.Contract(KLY_ADDRESS, KLY_ABI, provider);
  const decimals = await contract.decimals();
  const balance = await contract.balanceOf(wallet);
  return parseFloat(ethers.utils.formatUnits(balance, decimals));
}

async function getKLYTotalSupply() {
  const contract = new ethers.Contract(KLY_ADDRESS, KLY_ABI, provider);
  const decimals = await contract.decimals();
  const supply = await contract.totalSupply();
  return parseFloat(ethers.utils.formatUnits(supply, decimals));
}

// NFT
// Update Mint Supply Stats
async function updateMintStats() {
  if (!contract) return;

  try {
    const claimed = await contract.totalClaimedSupply();
    const minted = claimed.toNumber();
    const remaining = MAX_SUPPLY - minted;

    document.getElementById("mintedCount").textContent = minted;
    document.getElementById("remainingCount").textContent = remaining;
  } catch (err) {
    console.error("Failed to fetch mint stats:", err);
    setStatus("Unable to fetch mint data.", "status-error");
  }
}

// Mint Genesis NFT
async function mintGenesisNFT() {
  if (!contract || !wallet) return setStatus("Connect your wallet first.", "status-error");

  try {
    setStatus("Minting your Genesis NFT...", "status-processing");

    const balance = await contract.balanceOf(wallet);
    if (balance.gt(0)) {
      return setStatus("You already minted this NFT.", "status-error");
    }

    const tx = await contract.claim(1);
    await tx.wait();

    setStatus("Mint successful! Check your wallet.", "status-success");
    await updateMintStats();
  } catch (err) {
    console.error("Mint failed:", err);
    setStatus("Mint failed. Try again.", "status-error");
  }
}

// Status UI Helper
function setStatus(message, cssClass = "status-default") {
  const box = document.getElementById("status");
  const text = document.getElementById("statusText");
  if (box && text) {
    box.className = cssClass;
    text.textContent = message;
  }
}

// Auto-connect
window.addEventListener("DOMContentLoaded", async () => {
  document.getElementById("connectBtn")?.addEventListener("click", connectWallet);
  document.getElementById("mintBtn")?.addEventListener("click", mintGenesisNFT);

  if (window.ethereum) {
    const accounts = await window.ethereum.request({ method: "eth_accounts" });
    if (accounts.length > 0) {
      await connectWallet();
    }
  }
});


// STAKING
async function getStakingStats() {
  const staking = new ethers.Contract(STAKING_CONTRACT, STAKING_ABI, provider);
  const info = await staking.getStakeInfo(wallet);
  const rewards = await staking.getRewardInfo(wallet);
  const total = await staking.getTotalStakedSupply();
  return {
    staked: ethers.utils.formatEther(info.staked),
    rewards: ethers.utils.formatEther(rewards),
    totalStaked: ethers.utils.formatEther(total)
  };
}

async function stakeKLY(amount) {
  const token = new ethers.Contract(KLY_ADDRESS, KLY_ABI, signer);
  const staking = new ethers.Contract(STAKING_CONTRACT, STAKING_ABI, signer);
  const parsed = ethers.utils.parseEther(amount);
  await token.approve(STAKING_CONTRACT, parsed);
  const tx = await staking.stake(parsed);
  await tx.wait();
  return "Staked successfully";
}

async function withdrawKLY(amount) {
  const staking = new ethers.Contract(STAKING_CONTRACT, STAKING_ABI, signer);
  const parsed = ethers.utils.parseEther(amount);
  const tx = await staking.withdraw(parsed);
  await tx.wait();
  return "Withdraw successful";
}

async function claimRewards() {
  const staking = new ethers.Contract(STAKING_CONTRACT, STAKING_ABI, signer);
  const tx = await staking.claim();
  await tx.wait();
  return "Rewards claimed";
}

// DAO
async function getProposals() {
  const dao = new ethers.Contract(DAO_CONTRACT, DAO_ABI, provider);
  return await dao.getAllProposals();
}

async function createProposal(description) {
  const dao = new ethers.Contract(DAO_CONTRACT, DAO_ABI, signer);
  const tx = await dao.propose(description);
  await tx.wait();
  return "Proposal created";
}

async function voteOnProposal(id, vote) {
  const dao = new ethers.Contract(DAO_CONTRACT, DAO_ABI, signer);
  const tx = await dao.castVote(id, vote); // 0=Against, 1=For, 2=Abstain
  await tx.wait();
  return "Vote cast";
}

async function executeProposal(id) {
  const dao = new ethers.Contract(DAO_CONTRACT, DAO_ABI, signer);
  const tx = await dao.execute(id);
  await tx.wait();
  return "Proposal executed";
}

async function updateDashboardStats() {
  try {
    if (!wallet) {
      console.warn("Wallet address is undefined.");
      return;
    }

    const [balance, supply] = await Promise.all([
      getKLYBalance(),
      getKLYTotalSupply()
    ]);

    // Update the DOM
    document.getElementById("userBalance").textContent = balance.toFixed(2) + " KLY";
    document.getElementById("totalSupply").textContent = supply.toLocaleString();

  } catch (err) {
    console.error("Failed to update dashboard stats:", err);
    document.getElementById("userBalance").textContent = "Error";
    document.getElementById("totalSupply").textContent = "Error";
  }
}

    console.log("Wallet Address:", wallet);
    console.log("KLY Balance:", balance);
    console.log("Total Supply:", supply);

    document.getElementById("userBalance").textContent = balance.toFixed(2) + " KLY";
    document.getElementById("totalSupply").textContent = supply.toFixed(2);
  } catch (err) {
    console.error("Failed to update dashboard stats:", err);
  }
}

// AUTO CONNECT
window.addEventListener("load", async () => {
  if (window.ethereum && window.ethereum.selectedAddress) {
    await connectWallet();
  }
});

// BUTTON HOOKS
document.getElementById("connectWallet").addEventListener("click", connectWallet);
document.getElementById("refreshData").addEventListener("click", updateDashboardStats);

// GLOBAL EXPORT
window.connectWallet = connectWallet;
window.getKLYBalance = getKLYBalance;
window.getKLYTotalSupply = getKLYTotalSupply;
window.mintGenesisNFT = mintGenesisNFT;
window.getStakingStats = getStakingStats;
window.stakeKLY = stakeKLY;
window.withdrawKLY = withdrawKLY;
window.claimRewards = claimRewards;
window.getProposals = getProposals;
window.createProposal = createProposal;
window.voteOnProposal = voteOnProposal;
window.executeProposal = executeProposal;
window.updateDashboardStats = updateDashboardStats;
