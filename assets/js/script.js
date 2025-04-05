// === CONFIG ===
const CONFIG = {
  KLY_TOKEN: "0x2e4fEB2Fe668c8Ebe84f19e6c8fE8Cf8131B4E52",
  STAKING_CONTRACT: "0xa8380b1311B9316dbf87D5110E8CC35BcB835056",
  CHAIN_ID: 56
};

// === ABIs ===
const KLY_ABI = [
  {
    constant: true,
    inputs: [{ name: "account", type: "address" }],
    name: "balanceOf",
    outputs: [{ name: "", type: "uint256" }],
    type: "function"
  },
  {
    constant: true,
    inputs: [],
    name: "totalSupply",
    outputs: [{ name: "", type: "uint256" }],
    type: "function"
  },
  {
    constant: true,
    inputs: [],
    name: "decimals",
    outputs: [{ name: "", type: "uint8" }],
    type: "function"
  },
  {
    constant: false,
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" }
    ],
    name: "approve",
    outputs: [{ name: "", type: "bool" }],
    type: "function"
  }
];

const STAKING_ABI = [
  {
    constant: false,
    inputs: [{ name: "amount", type: "uint256" }],
    name: "stake",
    outputs: [],
    type: "function"
  },
  {
    constant: false,
    inputs: [],
    name: "claimRewards",
    outputs: [],
    type: "function"
  },
  {
    constant: false,
    inputs: [],
    name: "withdraw",
    outputs: [],
    type: "function"
  }
];

// === GLOBALS ===
let provider, signer, wallet;
let web3, accounts = [];
let klyTokenContract, stakingContract;

// === Wallet Connection ===
async function connectWallet() {
  try {
    if (!window.ethereum) throw new Error("Please install MetaMask.");

    provider = new ethers.BrowserProvider(window.ethereum);
    await provider.send("eth_requestAccounts", []);
    signer = await provider.getSigner();
    wallet = await signer.getAddress();

    // Init web3 for compatibility
    web3 = new Web3(window.ethereum);
    accounts = await web3.eth.getAccounts();

    // Validate chain
    const chainId = await web3.eth.getChainId();
    if (chainId !== CONFIG.CHAIN_ID) {
      throw new Error(`Please switch to BNB Chain (ChainID: ${CONFIG.CHAIN_ID})`);
    }

    // Shorten address display
    const shortAddr = `${wallet.substring(0, 6)}...${wallet.slice(-4)}`;
    document.getElementById("connectWallet").innerText = "Wallet Connected";
    document.getElementById("walletAddress").innerText = shortAddr;

    // Load contracts
    klyTokenContract = new web3.eth.Contract(KLY_ABI, CONFIG.KLY_TOKEN);
    stakingContract = new web3.eth.Contract(STAKING_ABI, CONFIG.STAKING_CONTRACT);

    // Load Token Stats
    loadKLYTokenStats();
    updateStats();
  } catch (err) {
    console.error("Wallet Connect Error:", err);
    alert(err.message);
  }
}

// === Token Display ===
async function loadKLYTokenStats() {
  try {
    const kly = new ethers.Contract(CONFIG.KLY_TOKEN, KLY_ABI, signer);
    const [decimals, balanceRaw, supplyRaw] = await Promise.all([
      kly.decimals(),
      kly.balanceOf(wallet),
      kly.totalSupply()
    ]);

    const balance = ethers.formatUnits(balanceRaw, decimals);
    const supply = ethers.formatUnits(supplyRaw, decimals);

    document.getElementById("userKLY").innerText = parseFloat(balance).toFixed(2);
    document.getElementById("totalKLY").innerText = parseFloat(supply).toLocaleString();
  } catch (err) {
    console.error("KLY Token Stat Error:", err);
  }
}

// === Staking ===
async function stakeTokens() {
  const amount = document.getElementById("stakeAmount").value;
  if (!amount || isNaN(amount)) return alert("Invalid amount");
  const weiAmount = web3.utils.toWei(amount, "ether");

  try {
    await klyTokenContract.methods.approve(CONFIG.STAKING_CONTRACT, weiAmount).send({ from: accounts[0] });
    await stakingContract.methods.stake(weiAmount).send({ from: accounts[0] });
    updateStats();
    alert("Staked successfully!");
  } catch (err) {
    console.error("Staking Error:", err);
    alert(err.message);
  }
}

async function claimRewards() {
  try {
    await stakingContract.methods.claimRewards().send({ from: accounts[0] });
    updateStats();
    alert("Rewards claimed!");
  } catch (err) {
    console.error("Claim Error:", err);
    alert(err.message);
  }
}

async function withdrawTokens() {
  try {
    await stakingContract.methods.withdraw().send({ from: accounts[0] });
    updateStats();
    alert("Withdrawal complete!");
  } catch (err) {
    console.error("Withdraw Error:", err);
    alert(err.message);
  }
}

// === Token Stats (Web3 fallback for legacy display) ===
async function updateStats() {
  try {
    const [supply, balance] = await Promise.all([
      klyTokenContract.methods.totalSupply().call(),
      klyTokenContract.methods.balanceOf(accounts[0]).call()
    ]);

    document.getElementById("klyTotalSupply").innerText = web3.utils.fromWei(supply, "ether");
    document.getElementById("klyWalletBalance").innerText = web3.utils.fromWei(balance, "ether");
  } catch (err) {
    console.error("Update Stats Error:", err);
  }
}

// === Access Check for Course (500 KLY)
async function verifyAccess() {
  try {
    const kly = new web3.eth.Contract(KLY_ABI, CONFIG.KLY_TOKEN);
    const balance = await kly.methods.balanceOf(accounts[0]).call();
    const balanceEth = web3.utils.fromWei(balance, "ether");

    if (parseFloat(balanceEth) >= 500) {
      document.getElementById("accessStatus").textContent = `Access granted: ${balanceEth} KLY`;
    } else {
      document.getElementById("accessStatus").textContent = `Access denied: Only ${balanceEth} KLY`;
    }
  } catch (err) {
    console.error("Access Check Error:", err);
  }
}

// === Launch Simulation ===
function launchToken() {
  const name = document.getElementById("tokenName").value;
  const symbol = document.getElementById("tokenSymbol").value;
  const supply = document.getElementById("initialSupply").value;
  const status = document.getElementById("launchStatus");

  if (!name || !symbol || !supply) return alert("Fill all fields");
  status.textContent = "Launching token...";
  setTimeout(() => {
    status.textContent = `${name} (${symbol}) launched with ${supply} tokens!`;
  }, 2000);
}

// === Event Bindings ===
window.addEventListener("DOMContentLoaded", () => {
  document.getElementById("connectWallet")?.addEventListener("click", connectWallet);
  document.getElementById("stakeButton")?.addEventListener("click", stakeTokens);
  document.getElementById("claimButton")?.addEventListener("click", claimRewards);
  document.getElementById("withdrawButton")?.addEventListener("click", withdrawTokens);
  document.getElementById("launchTokenBtn")?.addEventListener("click", launchToken);
  document.getElementById("verifyAccess")?.addEventListener("click", verifyAccess);
});
