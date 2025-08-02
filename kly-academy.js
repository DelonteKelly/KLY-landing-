<script type="module">
import { ethers } from "./ethers.min.js";
import Web3Modal from "./web3modal.js";
import WalletConnectProvider from "@walletconnect/web3-provider";

// Constants
const KLY_TOKEN_ADDRESS = "0x2e4fEB2Fe668c8Ebe84f19e6c8fE8Cf8131B4E52";
const NFT_CONTRACT_ADDRESS = "0xc1a2E9A475779EfD04247EA473638717E26cd5C5";
const BSC_CHAIN_ID = 56;
const REQUIRED_KLY = 100;

const KLY_TOKEN_ABI = [
    "function balanceOf(address) view returns (uint256)",
    "function decimals() view returns (uint8)"
];

const NFT_CONTRACT_ABI = [
    "function mintTo(address to, string uri)"
];

// State management
const state = {
    provider: null,
    web3Modal: null,
    signer: null,
    userAddress: null,
    network: null,
    klyBalance: 0,
    completedModules: []
};

// DOM Elements
const elements = {
    connectSection: document.getElementById('connect-section'),
    appContent: document.getElementById('app-content'),
    connectBtn: document.getElementById('connect-btn'),
    walletStatus: document.getElementById('wallet-status'),
    walletAddress: document.getElementById('wallet-address'),
    userAvatar: document.getElementById('user-avatar'),
    progressBar: document.getElementById('progress'),
    mintStatus: document.getElementById('mint-status'),
    progressText: document.getElementById('progress-text'),
    mintBtn: document.getElementById('mint-btn')
};

// Network configuration
const BSC_NETWORK = {
    chainId: '0x38',
    chainName: 'Binance Smart Chain',
    nativeCurrency: {
        name: 'BNB',
        symbol: 'BNB',
        decimals: 18
    },
    rpcUrls: ['https://bsc-dataseed.binance.org/'],
    blockExplorerUrls: ['https://bscscan.com']
};

// Initialize Web3Modal
async function initWeb3Modal() {
    try {
        const providerOptions = {
            walletconnect: {
                package: WalletConnectProvider,
                options: {
                    rpc: {
                        56: "https://bsc-dataseed.binance.org/",
                        1: "https://mainnet.infura.io/v3/YOUR_INFURA_KEY"
                    },
                    chainId: BSC_CHAIN_ID
                }
            }
        };

        state.web3Modal = new Web3Modal({
            cacheProvider: true,
            providerOptions,
            theme: "dark"
        });

        console.log("Web3Modal initialized successfully");
        return true;
    } catch (err) {
        console.error("Web3Modal initialization failed:", err);
        showNotification("Wallet system initialization failed", "error");
        return false;
    }
}

// Connect wallet handler
export async function connectWallet() {
    if (!elements.connectBtn) return;

    try {
        setButtonLoading(elements.connectBtn, "Connecting...");

        // Try direct connection first (MetaMask, etc.)
        if (window.ethereum) {
            console.log("Attempting direct connection with window.ethereum");
            await handleInjectedProvider();
        } 
        // Fallback to Web3Modal
        else {
            console.log("Falling back to Web3Modal");
            if (!state.web3Modal && !await initWeb3Modal()) return;
            
            const instance = await state.web3Modal.connect();
            state.provider = new ethers.providers.Web3Provider(instance);
        }

        // Complete connection setup
        await completeConnection();
        
    } catch (err) {
        handleConnectionError(err);
    }
}

// Handle injected provider (MetaMask, etc.)
async function handleInjectedProvider() {
    state.provider = new ethers.providers.Web3Provider(window.ethereum, "any");
    
    // Request account access
    await window.ethereum.request({ method: 'eth_requestAccounts' });
    
    // Set up event listeners
    window.ethereum.on('chainChanged', handleChainChanged);
    window.ethereum.on('accountsChanged', handleAccountsChanged);
}

// Complete the connection process
async function completeConnection() {
    state.signer = state.provider.getSigner();
    state.userAddress = await state.signer.getAddress();
    state.network = await state.provider.getNetwork();
    
    console.log("Connected address:", state.userAddress);
    console.log("Connected network:", state.network);

    updateConnectionUI();
    
    // Check if we're on the correct network
    if (state.network.chainId !== BSC_CHAIN_ID) {
        handleWrongNetwork();
        return;
    }

    // Check token balance
    await checkTokenBalance();
}

// Update UI after connection
function updateConnectionUI() {
    elements.walletAddress.textContent = `${state.userAddress.slice(0, 6)}...${state.userAddress.slice(-4)}`;
    elements.userAvatar.textContent = state.userAddress.slice(2, 4).toUpperCase();
    elements.walletStatus.innerHTML = '<i class="fas fa-check-circle"></i> Connected';
    setButtonSuccess(elements.connectBtn, "Connected");
}

// Handle wrong network
function handleWrongNetwork() {
    elements.walletStatus.innerHTML = `
        <div style="color: orange; text-align: center;">
            <i class="fas fa-exclamation-triangle"></i> Switch to BNB Chain
            <button onclick="addBscNetwork()" class="btn">Add BSC</button>
        </div>`;
    resetConnectButton();
}

// Check user's KLY token balance
async function checkTokenBalance() {
    try {
        const token = new ethers.Contract(KLY_TOKEN_ADDRESS, KLY_TOKEN_ABI, state.provider);
        const [balance, decimals] = await Promise.all([
            token.balanceOf(state.userAddress),
            token.decimals()
        ]);
        
        state.klyBalance = parseFloat(ethers.utils.formatUnits(balance, decimals));
        console.log("KLY balance:", state.klyBalance);

        if (state.klyBalance >= REQUIRED_KLY) {
            elements.connectSection.style.display = 'none';
            elements.appContent.style.display = 'block';
            showNotification("Wallet connected successfully", "success");
        } else {
            showInsufficientBalance();
        }
    } catch (err) {
        console.error("Balance check failed:", err);
        showNotification("Failed to check token balance", "error");
    }
}

// Show insufficient balance message
function showInsufficientBalance() {
    elements.walletStatus.innerHTML = `
        <div style="color: red; text-align: center;">
            Insufficient KLY (${state.klyBalance.toFixed(2)}/${REQUIRED_KLY})
            <a href="https://pancakeswap.finance/swap?outputCurrency=${KLY_TOKEN_ADDRESS}" 
               target="_blank" class="btn">Buy KLY</a>
        </div>`;
}

// Handle connection errors
function handleConnectionError(err) {
    console.error("Connection error:", err);
    
    let errorMessage = `Connection failed: ${err.message}`;
    if (err.code === 4001) {
        errorMessage = "Connection rejected by user";
    } else if (err.code === -32002) {
        errorMessage = "Connection request already pending";
    }
    
    showNotification(errorMessage, "error");
    elements.walletStatus.innerHTML = `
        <div style="color: red; text-align: center;">
            <i class="fas fa-times-circle"></i> Connection failed
        </div>`;
    resetConnectButton();
}

// Add BSC network handler
export async function addBscNetwork() {
    try {
        await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [BSC_NETWORK]
        });
        showNotification("BSC network added", "success");
        setTimeout(() => location.reload(), 2000);
    } catch (err) {
        console.error("Failed to add BSC network:", err);
        showNotification("Failed to add BSC network: " + err.message, "error");
    }
}

// Handle chain changes
function handleChainChanged(chainId) {
    console.log("Chain changed:", chainId);
    window.location.reload();
}

// Handle account changes
function handleAccountsChanged(accounts) {
    console.log("Account changed:", accounts);
    if (accounts.length === 0) {
        disconnectWallet();
    } else {
        window.location.reload();
    }
}

// Disconnect wallet
export function disconnectWallet() {
    if (state.web3Modal?.clearCachedProvider) {
        state.web3Modal.clearCachedProvider();
    }
    
    // Reset state
    state.provider = null;
    state.signer = null;
    state.userAddress = null;
    state.network = null;
    state.klyBalance = 0;
    
    // Reset UI
    elements.connectSection.style.display = 'block';
    elements.appContent.style.display = 'none';
    resetConnectButton();
    showNotification("Wallet disconnected", "success");
}

// UI Helper functions
function setButtonLoading(button, text) {
    button.innerHTML = `<i class="fas fa-spinner fa-spin"></i> ${text}`;
    button.disabled = true;
}

function setButtonSuccess(button, text) {
    button.innerHTML = `<i class="fas fa-check-circle"></i> ${text}`;
    button.disabled = false;
}

function resetConnectButton() {
    elements.connectBtn.innerHTML = '<i class="fas fa-wallet"></i> Connect Wallet';
    elements.connectBtn.disabled = false;
}

// Notification system
function showNotification(message, type = "info") {
    const notif = document.createElement('div');
    notif.className = `notification ${type}`;
    notif.innerHTML = `
        <div class="message">${message}</div>
        <button onclick="this.parentElement.remove()">✕</button>`;
    document.body.appendChild(notif);
    setTimeout(() => notif.remove(), 5000);
}

// Initialize the application
window.addEventListener('load', async () => {
    try {
        // Initialize Web3Modal
        if (!await initWeb3Modal()) return;
        
        // Auto-connect if cached provider exists
        if (state.web3Modal.cachedProvider) {
            console.log("Found cached provider, attempting auto-connect");
            await connectWallet();
        }
        
        // Initialize your modules
        showModule("module1");
    } catch (err) {
        console.error("Initialization error:", err);
        showNotification("App initialization failed", "error");
    }
});

// Make functions available globally
window.connectWallet = connectWallet;
window.addBscNetwork = addBscNetwork;
window.disconnectWallet = disconnectWallet;
window.showModule = showModule;
window.mintCertificate = mintCertificate;
</script>
