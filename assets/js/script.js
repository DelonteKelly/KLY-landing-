// Thirdweb SDK instance
const { ThirdwebSDK } = thirdweb;

// Application configuration
const CONFIG = {
  chain: {
    chainId: 56, // Binance Smart Chain
    rpc: ["https://bsc-dataseed.binance.org/"],
    nativeCurrency: { 
      name: "BNB", 
      symbol: "BNB", 
      decimals: 18 
    },
    slug: "binance"
  },
  contracts: {
    KLY_TOKEN: "0x2e4fEB2Fe668c8Ebe84f19e6c8fE8Cf8131B4E52",
    STAKING: "0x25548Ba29a0071F30E4bDCd98Ea72F79341b07a1"
  },
  gasOptions: { 
    gasLimit: 300000 
  }
};

// Application state
const state = {
  sdk: null,
  wallet: null,
  contracts: { 
    token: null, 
    staking: null 
  },
  transactionInProgress: false
};

/**
 * Initialize the application
 */
async function initApp() {
  if (!window.ethereum) {
    return showStatus("Please install MetaMask or a Web3 wallet", true);
  }

  try {
    state.sdk = new ThirdwebSDK(CONFIG.chain);
    setupEventListeners();
    
    if (window.ethereum.selectedAddress) {
      await connectWallet();
    }
  } catch (error) {
    console.error("Initialization error:", error);
    showStatus("Failed to initialize application", true);
  }
}

/**
 * Connect wallet handler
 */
async function connectWallet() {
  if (state.transactionInProgress) return;
  
  try {
    setLoadingState(true);
    showStatus("Connecting wallet...");

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

    updateWalletInfo(address);
    updateTokenInfo();
    showStatus(`Connected: ${shortenAddress(address)}`);
  } catch (error) {
    console.error("Wallet connection error:", error);
    showStatus("Failed to connect wallet", true);
  } finally {
    setLoadingState(false);
  }
}

/**
 * Stake tokens handler
 */
async function stakeTokens() {
  if (!validateWallet()) return;

  const amountInput = document.getElementById("stakeAmount");
  const amount = amountInput.value;

  if (!validateAmount(amount)) {
    showStatus("Please enter a valid amount to stake", true);
    return amountInput.focus();
  }

  try {
    setLoadingState(true);
    showStatus("Approving tokens...");

    await state.contracts.token.setAllowance(
      CONFIG.contracts.STAKING, 
      amount
    );

    showStatus("Staking tokens...");
    await state.contracts.staking.call(
      "stake", 
      [amount], 
      CONFIG.gasOptions
    );

    showStatus(`Successfully staked ${amount} KLY`);
    amountInput.value = "";
    updateTokenInfo();
  } catch (error) {
    console.error("Staking error:", error);
    showStatus("Staking failed", true);
  } finally {
    setLoadingState(false);
  }
}

/**
 * Claim rewards handler
 */
async function claimRewards() {
  if (!validateWallet()) return;

  try {
    setLoadingState(true);
    showStatus("Claiming rewards...");

    await state.contracts.staking.call(
      "claimRewards", 
      [], 
      CONFIG.gasOptions
    );

    showStatus("Rewards claimed successfully!");
    updateTokenInfo();
  } catch (error) {
    console.error("Claim error:", error);
    showStatus("Failed to claim rewards", true);
  } finally {
    setLoadingState(false);
  }
}

/**
 * Withdraw tokens handler
 */
async function withdrawTokens() {
  if (!validateWallet()) return;

  try {
    setLoadingState(true);
    showStatus("Withdrawing tokens...");

    await state.contracts.staking.call(
      "withdraw", 
      [], 
      CONFIG.gasOptions
    );

    showStatus("Tokens withdrawn successfully!");
    updateTokenInfo();
  } catch (error) {
    console.error("Withdrawal error:", error);
    showStatus("Withdrawal failed", true);
  } finally {
    setLoadingState(false);
  }
}

/**
 * Token launch handler
 */
async function launchToken() {
  if (!validateWallet()) return;

  const name = document.getElementById("tokenName").value.trim();
  const symbol = document.getElementById("tokenSymbol").value.trim();
  const supply = document.getElementById("tokenSupply").value.trim();

  if (!validateTokenDetails(name, symbol, supply)) {
    return showStatus("Please enter valid token details", true);
  }

  try {
    setLoadingState(true);
    showStatus("Launching token...");

    const token = await state.sdk.deployer.deployToken({
      name,
      symbol,
      primary_sale_recipient: await state.wallet.getAddress(),
      initial_supply: supply
    });

    showStatus(`Token "${name}" (${symbol}) launched!`);
    console.log("Token address:", token.address);
    
    // Clear form
    document.getElementById("tokenName").value = "";
    document.getElementById("tokenSymbol").value = "";
    document.getElementById("tokenSupply").value = "";
  } catch (error) {
    console.error("Launch error:", error);
    showStatus("Token launch failed", true);
  } finally {
    setLoadingState(false);
  }
}

/**
 * Update token information display
 */
async function updateTokenInfo() {
  if (!state.wallet) return;

  try {
    const address = await state.wallet.getAddress();
    const [supply, balance] = await Promise.all([
      state.contracts.token.totalSupply(),
      state.contracts.token.balanceOf(address)
    ]);

    document.getElementById("total-supply").textContent = formatNumber(supply.displayValue);
    document.getElementById("user-balance").textContent = formatNumber(balance.displayValue);
  } catch (error) {
    console.error("Token info error:", error);
  }
}

/**
 * Set up event listeners
 */
function setupEventListeners() {
  document.getElementById("connectWallet").onclick = connectWallet;
  document.getElementById("stakeButton").onclick = stakeTokens;
  document.getElementById("claimButton").onclick = claimRewards;
  document.getElementById("withdrawButton").onclick = withdrawTokens;
  document.getElementById("launchToken").onclick = launchToken;

  // Updated Start Course button logic
  document.getElementById("startCourse").onclick = async () => {
    if (!state.wallet) {
      try {
        await connectWallet();
      } catch (error) {
        showStatus("Please connect your wallet to access the course", true);
        return;
      }
    }

    if (state.wallet) {
      window.location.href = "/course.html";
    } else {
      showStatus("Please connect your wallet to access the course", true);
    }
  };
}

/**
 * Update wallet connection UI
 */
function updateWalletInfo(address) {
  const btn = document.getElementById("connectWallet");
  btn.textContent = shortenAddress(address);
  btn.classList.add("connected");
}

/**
 * Show status message
 */
function showStatus(message, isError = false) {
  const statusEl = document.getElementById("transaction-status") || 
    createStatusElement();
  
  statusEl.textContent = message;
  statusEl.className = isError ? "status-error" : "status-success";
  
  setTimeout(() => {
    statusEl.textContent = "";
  }, 5000);
}

/**
 * Create status element if it doesn't exist
 */
function createStatusElement() {
  const el = document.createElement("div");
  el.id = "transaction-status";
  document.body.appendChild(el);
  return el;
}

/**
 * Set loading state for buttons
 */
function setLoadingState(isLoading) {
  state.transactionInProgress = isLoading;
  document.querySelectorAll("button").forEach(btn => {
    if (btn.id !== "startCourse") {
      btn.disabled = isLoading;
    }
  });
}

/**
 * Validate wallet connection
 */
function validateWallet() {
  if (!state.wallet) {
    showStatus("Please connect your wallet first", true);
    return false;
  }
  return true;
}

/**
 * Validate stake amount
 */
function validateAmount(amount) {
  return amount && parseFloat(amount) > 0;
}

/**
 * Validate token details
 */
function validateTokenDetails(name, symbol, supply) {
  return name && symbol && supply && parseFloat(supply) > 0;
}

/**
 * Format number with 2 decimal places
 */
function formatNumber(num) {
  return parseFloat(num).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

/**
 * Shorten Ethereum address
 */
function shortenAddress(address) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

// Initialize app when DOM is loaded
document.addEventListener("DOMContentLoaded", initApp);
