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

// WALLET CONNECTION
async function connectWallet() {
  try {
    if (!window.ethereum) {
      alert("Please install MetaMask or another Ethereum wallet to continue.");
      return;
    }

    // Request account access
    provider = new ethers.providers.Web3Provider(window.ethereum);
    await provider.send("eth_requestAccounts", []);
    signer = provider.getSigner();
    wallet = await signer.getAddress();

    // Update UI
    document.getElementById("walletAddress").textContent = 
      wallet.slice(0, 6) + "..." + wallet.slice(-4);
    document.getElementById("walletAddress").style.display = "inline-block";
    document.getElementById("accessStatus").textContent = "Wallet: Connected";
    document.getElementById("dashboardStats").style.display = "block";
    document.getElementById("refreshData").style.display = "inline-block";

    // Set up event listeners for account/chain changes
    window.ethereum.on('accountsChanged', (accounts) => {
      if (accounts.length === 0) {
        // Wallet disconnected
        document.getElementById("walletAddress").style.display = "none";
        document.getElementById("accessStatus").textContent = "Wallet: Not Connected";
      } else {
        // Account changed
        window.location.reload();
      }
    });

    window.ethereum.on('chainChanged', () => {
      window.location.reload();
    });

    // Load initial data
    await updateDashboardStats();

    return wallet;
  } catch (error) {
    console.error("Wallet connection failed:", error);
    document.getElementById("accessStatus").textContent = "Connection Error";
    throw error;
  }
}

// TOKEN FUNCTIONS
async function getKLYBalance() {
  try {
    const contract = new ethers.Contract(KLY_ADDRESS, KLY_ABI, provider);
    const decimals = await contract.decimals();
    const balance = await contract.balanceOf(wallet);
    return parseFloat(ethers.utils.formatUnits(balance, decimals));
  } catch (error) {
    console.error("Failed to get KLY balance:", error);
    return 0;
  }
}

async function getKLYTotalSupply() {
  try {
    const contract = new ethers.Contract(KLY_ADDRESS, KLY_ABI, provider);
    const decimals = await contract.decimals();
    const supply = await contract.totalSupply();
    return parseFloat(ethers.utils.formatUnits(supply, decimals));
  } catch (error) {
    console.error("Failed to get total supply:", error);
    return 0;
  }
}

// DASHBOARD UPDATES
async function updateDashboardStats() {
  try {
    if (!wallet) {
      console.warn("Wallet not connected");
      return;
    }

    const [balance, supply] = await Promise.all([
      getKLYBalance(),
      getKLYTotalSupply()
    ]);

    console.log("Wallet Address:", wallet);
    console.log("KLY Balance:", balance);
    console.log("Total Supply:", supply);

    document.getElementById("userBalance").textContent = balance.toFixed(2) + " KLY";
    document.getElementById("totalSupply").textContent = supply.toLocaleString();
    document.getElementById("totalSupplyStat").textContent = supply.toLocaleString();
  } catch (error) {
    console.error("Failed to update dashboard:", error);
    document.getElementById("userBalance").textContent = "Error";
    document.getElementById("totalSupply").textContent = "Error";
  }
}
// STAKING CONTRACT CONFIG
const STAKING_ABI = [
  {
    name: "getStakeInfo",
    inputs: [{ name: "", type: "address" }],
    outputs: [{ name: "staked", type: "uint256" }, { name: "timestamp", type: "uint256" }],
    stateMutability: "view",
    type: "function"
  },
  {
    name: "getRewardInfo",
    inputs: [{ name: "", type: "address" }],
    outputs: [{ type: "uint256" }],
    stateMutability: "view",
    type: "function"
  },
  {
    name: "getTotalStakedSupply",
    inputs: [],
    outputs: [{ type: "uint256" }],
    stateMutability: "view",
    type: "function"
  },
  {
    name: "stake",
    inputs: [{ name: "amount", type: "uint256" }],
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    name: "withdraw",
    inputs: [{ name: "amount", type: "uint256" }],
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    name: "claim",
    inputs: [],
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  }
];

// STAKING FUNCTIONS
async function getStakingStats() {
  const contract = new ethers.Contract(STAKING_CONTRACT, STAKING_ABI, provider);
  const stakeInfo = await contract.getStakeInfo(wallet);
  const rewardInfo = await contract.getRewardInfo(wallet);
  const totalStaked = await contract.getTotalStakedSupply();

  return {
    staked: ethers.utils.formatEther(stakeInfo.staked),
    rewards: ethers.utils.formatEther(rewardInfo),
    totalStaked: ethers.utils.formatEther(totalStaked)
  };
}

async function stakeKLY(amount) {
  const kly = new ethers.Contract(KLY_ADDRESS, KLY_ABI, signer);
  const staking = new ethers.Contract(STAKING_CONTRACT, STAKING_ABI, signer);
  const parsed = ethers.utils.parseEther(amount);

  await kly.approve(STAKING_CONTRACT, parsed);
  const tx = await staking.stake(parsed);
  await tx.wait();
  return "Staked successfully!";
}

async function withdrawKLY(amount) {
  const staking = new ethers.Contract(STAKING_CONTRACT, STAKING_ABI, signer);
  const parsed = ethers.utils.parseEther(amount);
  const tx = await staking.withdraw(parsed);
  await tx.wait();
  return "Withdrawal successful!";
}

async function claimRewards() {
  const staking = new ethers.Contract(STAKING_CONTRACT, STAKING_ABI, signer);
  const tx = await staking.claim();
  await tx.wait();
  return "Rewards claimed!";
}

// Optional: Hook into UI buttons
document.getElementById("stakeBtn")?.addEventListener("click", async () => {
  const amount = document.getElementById("stakeAmount").value;
  const result = await stakeKLY(amount);
  alert(result);
});

document.getElementById("withdrawBtn")?.addEventListener("click", async () => {
  const amount = document.getElementById("withdrawAmount").value;
  const result = await withdrawKLY(amount);
  alert(result);
});

document.getElementById("claimBtn")?.addEventListener("click", async () => {
  const result = await claimRewards();
  alert(result);
});

const DAO_ABI = [
  {
    name: "getAllProposals",
    type: "function",
    inputs: [],
    outputs: [{
      type: "tuple[]",
      components: [
        { name: "proposalId", type: "uint256" },
        { name: "description", type: "string" },
        { name: "votesFor", type: "uint256" },
        { name: "votesAgainst", type: "uint256" },
        { name: "votesAbstain", type: "uint256" },
        { name: "executed", type: "bool" }
      ]
    }],
    stateMutability: "view"
  },
  {
    name: "propose",
    type: "function",
    inputs: [{ name: "description", type: "string" }],
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    name: "castVote",
    type: "function",
    inputs: [
      { name: "proposalId", type: "uint256" },
      { name: "vote", type: "uint8" } // 0 = Against, 1 = For, 2 = Abstain
    ],
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    name: "execute",
    type: "function",
    inputs: [{ name: "proposalId", type: "uint256" }],
    outputs: [],
    stateMutability: "nonpayable"
  }
];

// DAO FUNCTIONS
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

async function voteOnProposal(proposalId, vote) {
  const dao = new ethers.Contract(DAO_CONTRACT, DAO_ABI, signer);
  const tx = await dao.castVote(proposalId, vote);
  await tx.wait();
  return "Vote cast";
}

async function executeProposal(proposalId) {
  const dao = new ethers.Contract(DAO_CONTRACT, DAO_ABI, signer);
  const tx = await dao.execute(proposalId);
  await tx.wait();
  return "Proposal executed";
}

// INITIALIZATION
window.addEventListener("DOMContentLoaded", async () => {
  // Set up button event listeners
  document.getElementById("connectWallet").addEventListener("click", connectWallet);
  document.getElementById("refreshData").addEventListener("click", updateDashboardStats);

  // Auto-connect if wallet is already connected
  if (window.ethereum && window.ethereum.selectedAddress) {
    try {
      await connectWallet();
    } catch (error) {
      console.error("Auto-connect failed:", error);
    }
  }
});

// Make functions available globally for debugging
window.connectWallet = connectWallet;
window.updateDashboardStats = updateDashboardStats;
window.stakeKLY = stakeKLY;
window.withdrawKLY = withdrawKLY;
window.claimRewards = claimRewards;
window.getProposals = getProposals;
window.createProposal = createProposal;
window.voteOnProposal = voteOnProposal;
window.executeProposal = executeProposal;
