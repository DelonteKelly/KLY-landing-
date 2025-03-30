import { ThirdwebSDK } from "@thirdweb-dev/sdk";

// ============== CONFIGURATION ==============
const CONFIG = {
  chain: "binance",
  contracts: {
    KLY_TOKEN: "0x2e4fEB2Fe668c8Ebe84f19e6c8fE8Cf8131B4E52",
    STAKING: "0x25548Ba29a0071F30E4bDCd98Ea72F79341b07a1"
  },
  gasOptions: {
    gasLimit: 300000
  }
};

// ============== STATE MANAGEMENT ==============
const state = {
  sdk: null,
  wallet: null,
  contracts: {
    token: null,
    staking: null
  },
  transactionInProgress: false
};

// ============== INITIALIZATION ==============
async function initApp() {
  try {
    // Initialize Thirdweb SDK
    state.sdk = new ThirdwebSDK(CONFIG.chain);
    
    // Set up event listeners
    setupEventListeners();
    
    // Check if wallet is already connected
    if (window.ethereum?.selectedAddress) {
      await connectWallet();
    }
    
    console.log("DApp initialized successfully");
  } catch (error) {
    console.error("Initialization error:", error);
    showStatus("Failed to initialize DApp", true);
  }
}

// ============== WALLET CONNECTION ==============
async function connectWallet() {
  if (state.transactionInProgress) return;
  
  try {
    setLoadingState(true);
    showStatus("Connecting wallet...");
    
    if (!window.ethereum) {
      throw new Error("Please install MetaMask or another Web3 wallet");
    }
    
    // Connect wallet
    state.wallet = await state.sdk.wallet.connect("injected");
    const address = await state.wallet.getAddress();
    
    // Initialize contracts
    state.contracts.token = await state.sdk.getContract(
      CONFIG.contracts.KLY_TOKEN, 
      "token"
    );
    
    state.contracts.staking = await state.sdk.getContract(
      CONFIG.contracts.STAKING
    );
    
    // Update UI
    updateWalletInfo(address);
    updateTokenInfo();
    
    showStatus(`Connected: ${shortenAddress(address)}`);
    console.log("Wallet connected:", address);
  } catch (error) {
    console.error("Wallet connection failed:", error);
    showStatus(`Connection failed: ${error.message}`, true);
  } finally {
    setLoadingState(false);
  }
}

// ============== STAKING FUNCTIONS ==============
async function stakeTokens() {
  if (state.transactionInProgress || !state.wallet) {
    showStatus("Please connect wallet first", true);
    return;
  }
  
  const amountInput = document.getElementById("stakeAmount");
  const amount = amountInput.value;
  
  if (!validateInput(amount, "stake amount") || parseFloat(amount) <= 0) {
    showStatus("Please enter a valid amount to stake", true);
    amountInput.focus();
    return;
  }
  
  try {
    setLoadingState(true);
    showStatus("Approving tokens for staking...");
    
    // Approve staking contract to spend tokens
    const approveTx = await state.contracts.token.setAllowance(
      CONFIG.contracts.STAKING,
      amount
    );
    console.log("Approval tx:", approveTx);
    
    showStatus("Staking tokens...");
    
    // Execute stake
    const stakeTx = await state.contracts.staking.call(
      "stake", 
      [amount],
      CONFIG.gasOptions
    );
    console.log("Stake tx:", stakeTx);
    
    showStatus(`${amount} KLY tokens staked successfully!`);
    updateTokenInfo();
    amountInput.value = ""; // Clear input after staking
  } catch (error) {
    console.error("Staking failed:", error);
    showStatus(`Staking error: ${error.message}`, true);
  } finally {
    setLoadingState(false);
  }
}

async function withdrawTokens() {
  if (state.transactionInProgress || !state.wallet) {
    showStatus("Please connect wallet first", true);
    return;
  }
  
  try {
    setLoadingState(true);
    showStatus("Withdrawing tokens...");
    
    const tx = await state.contracts.staking.call(
      "withdraw",
      [],
      CONFIG.gasOptions
    );
    console.log("Withdraw tx:", tx);
    
    showStatus("Tokens withdrawn successfully!");
    updateTokenInfo();
  } catch (error) {
    console.error("Withdrawal failed:", error);
    showStatus(`Withdrawal error: ${error.message}`, true);
  } finally {
    setLoadingState(false);
  }
}

async function claimRewards() {
  if (state.transactionInProgress || !state.wallet) {
    showStatus("Please connect wallet first", true);
    return;
  }
  
  try {
    setLoadingState(true);
    showStatus("Claiming rewards...");
    
    const tx = await state.contracts.staking.call(
      "claimRewards",
      [],
      CONFIG.gasOptions
    );
    console.log("Claim tx:", tx);
    
    showStatus("Rewards claimed successfully!");
    updateTokenInfo();
  } catch (error) {
    console.error("Claim failed:", error);
    showStatus(`Claim error: ${error.message}`, true);
  } finally {
    setLoadingState(false);
  }
}

// ============== TOKEN LAUNCH ==============
async function launchToken() {
  if (state.transactionInProgress || !state.wallet) {
    showStatus("Please connect wallet first", true);
    return;
  }
  
  const nameInput = document.getElementById("tokenName");
  const symbolInput = document.getElementById("tokenSymbol");
  const supplyInput = document.getElementById("tokenSupply");
  
  const name = nameInput.value.trim();
  const symbol = symbolInput.value.trim();
  const supply = supplyInput.value.trim();
  
  if (!validateInput(name, "token name")) {
    nameInput.focus();
    return;
  }
  
  if (!validateInput(symbol, "token symbol")) {
    symbolInput.focus();
    return;
  }
  
  if (!validateInput(supply, "token supply") || parseFloat(supply) <= 0) {
    supplyInput.focus();
    return;
  }
  
  try {
    setLoadingState(true);
    showStatus("Launching new token...");
    
    const token = await state.sdk.deployer.deployToken({
      name,
      symbol,
      primary_sale_recipient: await state.wallet.getAddress(),
      initial_supply: supply
    });
    
    showStatus(`Token "${name}" (${symbol}) launched successfully!`);
    console.log("Token deployed:", token);
    
    // Clear form
    nameInput.value = "";
    symbolInput.value = "";
    supplyInput.value = "";
  } catch (error) {
    console.error("Token launch failed:", error);
    showStatus(`Launch failed: ${error.message}`, true);
  } finally {
    setLoadingState(false);
  }
}

// ============== UI UPDATES ==============
async function updateTokenInfo() {
  if (!state.wallet) return;
  
  try {
    const address = await state.wallet.getAddress();
    const [totalSupply, balance] = await Promise.all([
      state.contracts.token.totalSupply(),
      state.contracts.token.balanceOf(address)
    ]);
    
    document.getElementById("total-supply").textContent = 
      formatNumber(totalSupply.displayValue);
    document.getElementById("user-balance").textContent = 
      formatNumber(balance.displayValue);
  } catch (error) {
    console.error("Failed to update token info:", error);
    showStatus("Failed to update token info", true);
  }
}

function updateWalletInfo(address) {
  const walletBtn = document.getElementById("connectWallet");
  walletBtn.textContent = shortenAddress(address);
  walletBtn.classList.add("connected");
}

// ============== HELPER FUNCTIONS ==============
function setupEventListeners() {
  document.getElementById("connectWallet").onclick = connectWallet;
  document.getElementById("stakeButton").onclick = stakeTokens;
  document.getElementById("withdrawButton").onclick = withdrawTokens;
  document.getElementById("claimButton").onclick = claimRewards;
  document.getElementById("launchToken").onclick = launchToken;
  
  // Course button (non-web3 action)
  document.getElementById("startCourse").onclick = () => {
    window.location.href = "/course.html";
  };
}

function setLoadingState(isLoading) {
  state.transactionInProgress = isLoading;
  const buttons = document.querySelectorAll("button");
  buttons.forEach(btn => {
    if (btn.id !== "startCourse") {
      btn.disabled = isLoading;
    }
  });
  
  document.body.style.cursor = isLoading ? "wait" : "default";
}

function showStatus(message, isError = false) {
  // Create status element if it doesn't exist
  let statusEl = document.getElementById("transaction-status");
  if (!statusEl) {
    statusEl = document.createElement("div");
    statusEl.id = "transaction-status";
    document.body.appendChild(statusEl);
  }
  
  statusEl.textContent = message;
  statusEl.className = isError ? "status-error" : "status-success";
  
  // Auto-hide after 5 seconds
  setTimeout(() => {
    statusEl.textContent = "";
  }, 5000);
}

function validateInput(value, fieldName) {
  if (!value || value.trim() === "") {
    showStatus(`Please enter a valid ${fieldName}`, true);
    return false;
  }
  return true;
}

function shortenAddress(address) {
  return address ? `${address.substring(0, 6)}...${address.substring(address.length - 4)}` : "";
}

function formatNumber(num) {
  return parseFloat(num).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

// ============== START THE APP ==============
window.addEventListener("DOMContentLoaded", initApp);
