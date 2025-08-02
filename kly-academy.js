<script type="module">
import { ethers } from "./ethers.min.js";
import Web3Modal from "./web3modal.js";
import WalletConnectProvider from "@walletconnect/web3-provider";

// Constants
const KLY_TOKEN_ADDRESS = "0x2e4fEB2Fe668c8Ebe84f19e6c8fE8Cf8131B4E52";
const NFT_CONTRACT_ADDRESS = "0xc1a2E9A475779EfD04247EA473638717E26cd5C5";

const KLY_TOKEN_ABI = [
  "function balanceOf(address) view returns (uint256)",
  "function decimals() view returns (uint8)"
];

const NFT_CONTRACT_ABI = [
  "function mintTo(address to, string uri)"
];

// State
let provider, web3Modal, signer, userAddress;
let completedModules = [];

// DOM Elements
const connectSection = document.getElementById('connect-section');
const appContent = document.getElementById('app-content');
const connectBtn = document.getElementById('connect-btn');
const walletStatus = document.getElementById('wallet-status');
const walletAddress = document.getElementById('wallet-address');
const userAvatar = document.getElementById('user-avatar');
const progressBar = document.getElementById('progress');
const mintStatus = document.getElementById('mint-status');
const progressText = document.getElementById('progress-text');
const mintBtn = document.getElementById('mint-btn');

// Enhanced Wallet Connection
async function initWeb3Modal() {
  try {
    const providerOptions = {
      walletconnect: {
        package: WalletConnectProvider,
        options: {
          rpc: { 
            56: "https://bsc-dataseed.binance.org/",
            1: "https://mainnet.infura.io/v3/YOUR_INFURA_KEY" // Fallback
          },
          chainId: 56
        }
      }
    };

    web3Modal = new Web3Modal({
      cacheProvider: true,
      providerOptions,
      theme: "dark"
    });
    
    console.log("Web3Modal initialized successfully");
  } catch (err) {
    console.error("Web3Modal init error:", err);
    showNotification("Wallet system initialization failed", "error");
  }
}

export async function connectWallet() {
  if (!connectBtn) return;
  
  try {
    connectBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Connecting...';
    connectBtn.disabled = true;

    // First try direct connection with MetaMask/extension
    if (window.ethereum) {
      console.log("Attempting direct connection with window.ethereum");
      provider = new ethers.providers.Web3Provider(window.ethereum, "any");
      await window.ethereum.request({ method: 'eth_requestAccounts' });
    } 
    // Fallback to Web3Modal
    else {
      console.log("Falling back to Web3Modal");
      if (!web3Modal) await initWeb3Modal();
      const instance = await web3Modal.connect();
      provider = new ethers.providers.Web3Provider(instance);
    }

    // Common connection flow
    signer = provider.getSigner();
    userAddress = await signer.getAddress();
    console.log("Connected address:", userAddress);

    // UI updates
    walletAddress.textContent = `${userAddress.slice(0, 6)}...${userAddress.slice(-4)}`;
    userAvatar.textContent = userAddress.slice(2, 4).toUpperCase();
    walletStatus.innerHTML = '<i class="fas fa-check-circle"></i> Connected';

    // Network check
    const network = await provider.getNetwork();
    console.log("Connected network:", network);
    
    if (network.chainId !== 56) {
      walletStatus.innerHTML = `
        <div style="color: orange; text-align: center;">
          <i class="fas fa-exclamation-triangle"></i> Switch to BNB Chain
          <button onclick="addBscNetwork()" class="btn">Add BSC</button>
        </div>`;
      connectBtn.innerHTML = '<i class="fas fa-wallet"></i> Connect Wallet';
      connectBtn.disabled = false;
      return;
    }

    // Token balance check
    const token = new ethers.Contract(KLY_TOKEN_ADDRESS, KLY_TOKEN_ABI, provider);
    const [balance, decimals] = await Promise.all([
      token.balanceOf(userAddress),
      token.decimals()
    ]);
    
    const kly = parseFloat(ethers.utils.formatUnits(balance, decimals));
    console.log("KLY balance:", kly);

    if (kly >= 100) {
      connectSection.style.display = 'none';
      appContent.style.display = 'block';
      showNotification("Wallet connected successfully", "success");
    } else {
      walletStatus.innerHTML = `
        <div style="color: red; text-align: center;">
          Insufficient KLY (${kly.toFixed(2)}/100)
          <a href="https://pancakeswap.finance/swap?outputCurrency=${KLY_TOKEN_ADDRESS}" 
             target="_blank" class="btn">Buy KLY</a>
        </div>`;
    }

    connectBtn.innerHTML = '<i class="fas fa-wallet"></i> Connected';
    updateProgress();
  } catch (err) {
    console.error("Connection error:", err);
    showNotification(`Connection failed: ${err.message}`, "error");
    walletStatus.innerHTML = `
      <div style="color: red; text-align: center;">
        <i class="fas fa-times-circle"></i> Connection failed
      </div>`;
    connectBtn.innerHTML = '<i class="fas fa-wallet"></i> Connect Wallet';
    connectBtn.disabled = false;
    
    // Special handling for common errors
    if (err.code === 4001) {
      showNotification("Connection rejected by user", "warning");
    } else if (err.code === -32002) {
      showNotification("Connection request already pending", "info");
    }
  }
}

// Rest of your existing functions (addBscNetwork, showModule, updateProgress, etc.)
// ... keep all other functions exactly as you had them ...

// Initialize with better error handling
window.addEventListener('load', async () => {
  try {
    createParticles();
    await initWeb3Modal();
    
    // Auto-connect if cached provider exists
    if (web3Modal?.cachedProvider) {
      console.log("Found cached provider, attempting auto-connect");
      await connectWallet();
    }
    
    showModule("module1");
  } catch (err) {
    console.error("Initialization error:", err);
    showNotification("App initialization failed", "error");
  }
});

// Make functions available globally for HTML onclick attributes
window.connectWallet = connectWallet;
window.addBscNetwork = addBscNetwork;
window.disconnectWallet = disconnectWallet;
window.showModule = showModule;
window.mintCertificate = mintCertificate;
</script>
