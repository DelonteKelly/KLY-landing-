
const { ThirdwebSDK } = thirdweb;

// ============== CONFIGURATION ==============
const CONFIG = {
  chain: {
    chainId: 56, // Binance Smart Chain
    rpc: ["https://bsc-dataseed.binance.org/"],
    nativeCurrency: {
      name: "BNB",
      symbol: "BNB",
      decimals: 18,
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
    if (!window.ethereum) {
      showStatus("Please install MetaMask or another Web3 wallet", true);
      return;
    }

    state.sdk = new ThirdwebSDK(CONFIG.chain);
    setupEventListeners();

    if (window.ethereum.selectedAddress) {
      await connectWallet();
    }

    console.log("DApp initialized successfully");
  } catch (error) {
    console.error("Initialization error:", error);
    showStatus("Failed to initialize DApp", true);
  }
}

// ============== UI UPDATES ==============
function createStatusElement() {
  let statusEl = document.getElementById("transaction-status");
  if (!statusEl) {
    statusEl = document.createElement("div");
    statusEl.id = "transaction-status";
    statusEl.style.position = "fixed";
    statusEl.style.bottom = "20px";
    statusEl.style.left = "50%";
    statusEl.style.transform = "translateX(-50%)";
    statusEl.style.padding = "10px 20px";
    statusEl.style.borderRadius = "5px";
    statusEl.style.zIndex = "1000";
    statusEl.style.transition = "all 0.3s ease";
    document.body.appendChild(statusEl);
  }
  return statusEl;
}

function showStatus(message, isError = false) {
  const statusEl = createStatusElement();
  statusEl.textContent = message;
  statusEl.style.backgroundColor = isError ? "#ff4444" : "#4CAF50";
  statusEl.style.color = "white";
  statusEl.style.opacity = "1";

  setTimeout(() => {
    statusEl.style.opacity = "0";
  }, 5000);
}

// ============== START THE APP ==============
document.addEventListener("DOMContentLoaded", initApp);
