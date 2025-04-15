
import { ethers } from "https://cdn.jsdelivr.net/npm/ethers@5.7.2/dist/ethers.esm.min.js";

// Contract addresses
const KLY_TOKEN = "0x2e4fEB2Fe668c8Ebe84f19e6c8fE8Cf8131B4E52";
const STAKING_CONTRACT = "0x25548Ba29a0071F30E4bDCd98Ea72F79341b07a1";
const DAO_CONTRACT = "0x796Bce7F95662774243177D1F546eBA0B3465579";
const BSC_API_KEY = "3GA78IZXNIRMUYZ7KF2HRF9N9YZJJY95K2";

// Contract ABIs
const ERC20_ABI = [
  { name: "balanceOf", type: "function", stateMutability: "view", inputs: [{ name: "account", type: "address" }], outputs: [{ type: "uint256" }] },
  { name: "decimals", type: "function", stateMutability: "view", inputs: [], outputs: [{ type: "uint8" }] },
  { name: "totalSupply", type: "function", stateMutability: "view", inputs: [], outputs: [{ type: "uint256" }] },
  { name: "approve", type: "function", stateMutability: "nonpayable", inputs: [{ name: "spender", type: "address" }, { name: "amount", type: "uint256" }], outputs: [{ type: "bool" }] }
];

const STAKING_ABI = [
  { name: "getStakeInfo", type: "function", stateMutability: "view", inputs: [{ name: "", type: "address" }], outputs: [{ name: "staked", type: "uint256" }, { name: "timestamp", type: "uint256" }] },
  { name: "getTotalStakedSupply", type: "function", stateMutability: "view", inputs: [], outputs: [{ type: "uint256" }] },
  { name: "stake", type: "function", stateMutability: "nonpayable", inputs: [{ name: "amount", type: "uint256" }], outputs: [] },
  { name: "withdraw", type: "function", stateMutability: "nonpayable", inputs: [{ name: "amount", type: "uint256" }], outputs: [] },
  { name: "claim", type: "function", stateMutability: "nonpayable", inputs: [], outputs: [] }
];

// State management
let provider, signer, wallet;

// UI Elements
const elements = {
  walletAddress: document.getElementById("walletAddress"),
  connectButton: document.getElementById("connectWallet"),
  accessStatus: document.getElementById("accessStatus"),
  userBalance: document.getElementById("userBalance"),
  totalSupply: document.getElementById("totalSupply"),
  totalSupplyStat: document.getElementById("totalSupplyStat"),
  stakedAmountStat: document.getElementById("stakedAmountStat"),
  holdersStat: document.getElementById("holdersStat"),
  dashboardStats: document.getElementById("dashboardStats"),
  refreshButton: document.getElementById("refreshData"),
  stakeButton: document.getElementById("stakeBtn"),
  withdrawButton: document.getElementById("withdrawBtn"),
  claimButton: document.getElementById("claimBtn")
};

// Notification system
function showNotification(message, type = "info") {
  const notification = document.createElement("div");
  notification.className = `notification ${type}`;
  notification.textContent = message;
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.classList.add("fade-out");
    setTimeout(() => notification.remove(), 500);
  }, 3000);
}

// Wallet connection
async function connectWallet() {
  try {
    if (!window.ethereum) {
      throw new Error("MetaMask not detected. Please install MetaMask from https://metamask.io/");
    }

    // Initialize provider
    provider = new ethers.providers.Web3Provider(window.ethereum);
    
    // Request accounts
    await provider.send("eth_requestAccounts", []);
    signer = provider.getSigner();
    wallet = await signer.getAddress();

    // Check and switch network
    await checkNetwork();

    // Update UI
    updateUI();
    setupWalletListeners();
    
    // Load initial data
    await loadDashboardData();
    
    // Show welcome
    showNotification("Wallet connected successfully!", "success");

  } catch (err) {
    console.error("Wallet connection error:", err);
    showNotification(`Connection failed: ${err.message}`, "error");
  }
}

// Network verification
async function checkNetwork() {
  const network = await provider.getNetwork();
  if (network.chainId !== 56) { // BSC Mainnet
    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: "0x38" }] // BSC chainId in hex
      });
    } catch (switchError) {
      // This error code indicates that the chain has not been added to MetaMask
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: "wallet_addEthereumChain",
            params: [{
              chainId: "0x38",
              chainName: "BNB Smart Chain",
              nativeCurrency: {
                name: "BNB",
                symbol: "BNB",
                decimals: 18
              },
              rpcUrls: ["https://bsc-dataseed.binance.org/"],
              blockExplorerUrls: ["https://bscscan.com"]
            }]
          });
        } catch (addError) {
          throw new Error("Failed to add BSC network to wallet");
        }
      } else {
        throw new Error("Failed to switch to BSC network");
      }
    }
  }
}

// Wallet event listeners
function setupWalletListeners() {
  window.ethereum.on('accountsChanged', (accounts) => {
    if (accounts.length === 0) {
      // Wallet disconnected
      disconnectWallet();
    } else {
      // Account changed
      wallet = accounts[0];
      updateUI();
      loadDashboardData();
    }
  });

  window.ethereum.on('chainChanged', () => {
    window.location.reload();
  });
}

// Disconnect handler
function disconnectWallet() {
  // Reset state
  provider = null;
  signer = null;
  wallet = null;
  
  // Update UI
  elements.walletAddress.style.display = "none";
  elements.connectButton.textContent = "Connect Wallet";
  elements.accessStatus.textContent = "Wallet: Not Connected";
  elements.dashboardStats.style.display = "none";
  
  // Reset displayed values
  elements.userBalance.textContent = "-";
  elements.totalSupply.textContent = "-";
  elements.totalSupplyStat.textContent = "-";
  elements.stakedAmountStat.textContent = "-";
  elements.holdersStat.textContent = "-";
  
  showNotification("Wallet disconnected", "info");
}

// UI Update
function updateUI() {
  elements.walletAddress.textContent = `${wallet.slice(0, 6)}...${wallet.slice(-4)}`;
  elements.walletAddress.style.display = "block";
  elements.connectButton.textContent = "Connected";
  elements.accessStatus.textContent = "Wallet: Connected";
  elements.dashboardStats.style.display = "block";
  elements.refreshButton.style.display = "inline-block";
}

// Data fetching
async function loadDashboardData() {
  try {
    // Show loading states
    elements.refreshButton.disabled = true;
    elements.dashboardStats.classList.add("loading");
    
    // Fetch all data in parallel
    const [balance, supply, staked, totalStaked, holders] = await Promise.all([
      getKLYBalance(),
      getTotalSupply(),
      getUserStaked(),
      getTotalStaked(),
      fetchHolderCount()
    ]);
    
    // Update UI
    elements.userBalance.textContent = `${balance.toFixed(2)} KLY`;
    elements.totalSupply.textContent = supply.toLocaleString();
    elements.totalSupplyStat.textContent = supply.toLocaleString();
    elements.stakedAmountStat.textContent = totalStaked.toLocaleString();
    elements.holdersStat.textContent = holders.toLocaleString();
    
  } catch (err) {
    console.error("Dashboard data error:", err);
    showNotification("Failed to load dashboard data", "error");
  } finally {
    elements.refreshButton.disabled = false;
    elements.dashboardStats.classList.remove("loading");
  }
}

// Contract interactions
async function getKLYBalance() {
  const contract = new ethers.Contract(KLY_TOKEN, ERC20_ABI, provider);
  const decimals = await contract.decimals();
  const balance = await contract.balanceOf(wallet);
  return parseFloat(ethers.utils.formatUnits(balance, decimals));
}

async function getTotalSupply() {
  const contract = new ethers.Contract(KLY_TOKEN, ERC20_ABI, provider);
  const decimals = await contract.decimals();
  const supply = await contract.totalSupply();
  return parseFloat(ethers.utils.formatUnits(supply, decimals));
}

async function getUserStaked() {
  const contract = new ethers.Contract(STAKING_CONTRACT, STAKING_ABI, provider);
  const info = await contract.getStakeInfo(wallet);
  return parseFloat(ethers.utils.formatUnits(info.staked, 18));
}

async function getTotalStaked() {
  const contract = new ethers.Contract(STAKING_CONTRACT, STAKING_ABI, provider);
  const total = await contract.getTotalStakedSupply();
  return parseFloat(ethers.utils.formatUnits(total, 18));
}

async function fetchHolderCount() {
  try {
    const response = await fetch(
      `https://api.bscscan.com/api?module=token&action=tokeninfo&contractaddress=${KLY_TOKEN}&apikey=${BSC_API_KEY}`
    );
    const data = await response.json();
    return data.result?.[0]?.holders ?? 0;
  } catch (err) {
    console.error("Holder count error:", err);
    return 0;
  }
}

// Staking functions
async function stakeKLY(amount) {
  if (!wallet) {
    showNotification("Please connect your wallet first", "error");
    return;
  }

  try {
    const parsedAmount = ethers.utils.parseEther(amount.toString());
    const klyContract = new ethers.Contract(KLY_TOKEN, ERC20_ABI, signer);
    const stakingContract = new ethers.Contract(STAKING_CONTRACT, STAKING_ABI, signer);

    // Show loading state
    elements.stakeButton.disabled = true;
    elements.stakeButton.textContent = "Processing...";
    
    // Approve first
    showNotification("Approving token transfer...", "info");
    const approveTx = await klyContract.approve(STAKING_CONTRACT, parsedAmount);
    await approveTx.wait();
    
    // Then stake
    showNotification("Staking tokens...", "info");
    const stakeTx = await stakingContract.stake(parsedAmount);
    await stakeTx.wait();

    // Update and notify
    await loadDashboardData();
    showNotification(`${amount} KLY staked successfully!`, "success");
    
  } catch (err) {
    console.error("Staking error:", err);
    showNotification(`Staking failed: ${err.message}`, "error");
  } finally {
    elements.stakeButton.disabled = false;
    elements.stakeButton.textContent = "Stake";
  }
}

async function withdrawKLY(amount) {
  if (!wallet) {
    showNotification("Please connect your wallet first", "error");
    return;
  }

  try {
    const parsedAmount = ethers.utils.parseEther(amount.toString());
    const stakingContract = new ethers.Contract(STAKING_CONTRACT, STAKING_ABI, signer);

    // Show loading state
    elements.withdrawButton.disabled = true;
    elements.withdrawButton.textContent = "Processing...";
    
    showNotification("Processing withdrawal...", "info");
    const tx = await stakingContract.withdraw(parsedAmount);
    await tx.wait();

    // Update and notify
    await loadDashboardData();
    showNotification(`${amount} KLY withdrawn successfully!`, "success");
    
  } catch (err) {
    console.error("Withdrawal error:", err);
    showNotification(`Withdrawal failed: ${err.message}`, "error");
  } finally {
    elements.withdrawButton.disabled = false;
    elements.withdrawButton.textContent = "Withdraw";
  }
}

async function claimRewards() {
  if (!wallet) {
    showNotification("Please connect your wallet first", "error");
    return;
  }

  try {
    const stakingContract = new ethers.Contract(STAKING_CONTRACT, STAKING_ABI, signer);

    // Show loading state
    elements.claimButton.disabled = true;
    elements.claimButton.textContent = "Processing...";
    
    showNotification("Claiming rewards...", "info");
    const tx = await stakingContract.claim();
    await tx.wait();

    // Update and notify
    await loadDashboardData();
    showNotification("Rewards claimed successfully!", "success");
    
  } catch (err) {
    console.error("Claim error:", err);
    showNotification(`Claim failed: ${err.message}`, "error");
  } finally {
    elements.claimButton.disabled = false;
    elements.claimButton.textContent = "Claim Rewards";
  }
}

// Initialize
document.addEventListener("DOMContentLoaded", () => {
  // Event listeners
  elements.connectButton.addEventListener("click", connectWallet);
  elements.refreshButton.addEventListener("click", loadDashboardData);
  
  // Auto-connect if wallet already connected
  if (window.ethereum?.selectedAddress) {
    connectWallet();
  }
});

// Make functions available globally
window.connectWallet = connectWallet;
window.stakeKLY = stakeKLY;
window.withdrawKLY = withdrawKLY;
window.claimRewards = claimRewards;
