<script>
const KLY_TOKEN_ADDRESS = "0x2e4fEB2Fe668c8Ebe84f19e6c8fE8Cf8131B4E52";
const NFT_CONTRACT_ADDRESS = "0xDA76d35742190283E340dbeE2038ecc978a56950";
const NFT_URI = "ipfs://bafybeihkmkaf2mgx7xkrnkhmzd2uvhr6ddgj6z3vkqcgnvlaa3z7x263r4";
const BSC_RPC = "https://bsc-dataseed.binance.org/";
const BSC_CHAIN_ID = 56;

const KLY_TOKEN_ABI = [
  "function balanceOf(address) view returns (uint256)",
  "function decimals() view returns (uint8)"
];
const NFT_CONTRACT_ABI = [
  "function mintTo(address to, string uri)"
];

let provider, web3Modal, signer, userAddress;
let completedModules = JSON.parse(localStorage.getItem('completedModules') || '[]');

const connectSection = document.getElementById('connect-section');
const appContent = document.getElementById('app-content');
const connectBtn = document.getElementById('connect-btn');
const walletStatus = document.getElementById('wallet-status');
const walletAddress = document.getElementById('wallet-address');
const userAvatar = document.getElementById('user-avatar');
const progressBar = document.getElementById('progress-bar');
const progressText = document.getElementById('progress-text');
const mintBtn = document.getElementById('mint-btn');
const mintStatus = document.getElementById('mint-status');

// Initialize Web3Modal
async function initWeb3Modal() {
  web3Modal = new Web3Modal({
    cacheProvider: true,
    providerOptions: {
      walletconnect: {
        package: WalletConnectProvider,
        options: {
          rpc: {
            56: BSC_RPC,
            1: "https://mainnet.infura.io/v3/YOUR_INFURA_KEY"
          },
          chainId: BSC_CHAIN_ID
        }
      },
      injected: {
        package: null,
        display: {
          name: "Browser Wallet",
          description: "Connect with your browser wallet (MetaMask, etc)"
        }
      }
    },
    theme: "dark"
  });
}

// Connect Wallet Function
async function connectWallet() {
  try {
    connectBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Connecting...';
    walletStatus.innerHTML = '';

    const instance = await web3Modal.connect();
    provider = new ethers.providers.Web3Provider(instance);
    
    if (!provider) {
      throw new Error("Failed to initialize provider");
    }

    signer = provider.getSigner();
    userAddress = await signer.getAddress();

    // Set up event listeners
    if (instance.on) {
      instance.on("accountsChanged", () => window.location.reload());
      instance.on("chainChanged", () => window.location.reload());
      instance.on("disconnect", () => disconnectWallet());
    }

    // Display wallet info
    walletAddress.textContent = `${userAddress.slice(0, 6)}...${userAddress.slice(-4)}`;
    userAvatar.textContent = userAddress.slice(2, 4).toUpperCase();

    // Check network
    const net = await provider.getNetwork();
    if (net.chainId !== BSC_CHAIN_ID) {
      return showNetworkWarning();
    }

    // Check token balance
    const token = new ethers.Contract(KLY_TOKEN_ADDRESS, KLY_TOKEN_ABI, provider);
    const [balance, decimals] = await Promise.all([
      token.balanceOf(userAddress),
      token.decimals()
    ]);

    const kly = parseFloat(ethers.utils.formatUnits(balance, decimals));
    if (kly < 100) {
      return showLowBalance(kly);
    }

    // Success
    connectSection.style.display = 'none';
    appContent.style.display = 'block';
    showNotification("Wallet connected successfully", "success");
    updateProgress();

  } catch (e) {
    console.error("Connection error:", e);
    let errorMsg = e.message;
    
    // Handle specific errors
    if (e.code === 4001) {
      errorMsg = "Connection rejected by user";
    } else if (e.code === -32002) {
      errorMsg = "Connection request already pending";
    } else if (!window.ethereum) {
      errorMsg = "No Ethereum provider found. Install MetaMask or another wallet.";
    }

    showNotification(`Connection failed: ${errorMsg}`, "error");
    walletStatus.innerHTML = `
      <div style="color: var(--danger); text-align:center;">
        <i class="fas fa-exclamation-circle"></i> ${errorMsg}
      </div>`;
  } finally {
    connectBtn.innerHTML = '<i class="fas fa-wallet"></i> Connect Wallet';
  }
}

// Network Switching Functions
async function switchToBscNetwork() {
  try {
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: '0x38' }] // BSC chain ID in hex
    });
    showNotification("Switched to BSC", "success");
    setTimeout(() => location.reload(), 1000);
  } catch (switchError) {
    if (switchError.code === 4902) {
      await addBscNetwork();
    } else {
      showNotification("Failed to switch network: " + switchError.message, "error");
    }
  }
}

async function addBscNetwork() {
  try {
    await window.ethereum.request({
      method: 'wallet_addEthereumChain',
      params: [{
        chainId: '0x38',
        chainName: 'Binance Smart Chain',
        nativeCurrency: { name: 'BNB', symbol: 'BNB', decimals: 18 },
        rpcUrls: [BSC_RPC],
        blockExplorerUrls: ['https://bscscan.com']
      }]
    });
    showNotification("BSC added successfully", "success");
    setTimeout(() => location.reload(), 2000);
  } catch (err) {
    showNotification("Failed to add BSC: " + err.message, "error");
  }
}

function showNetworkWarning() {
  walletStatus.innerHTML = `
    <div style="color: var(--warning); text-align: center; margin-top: 1rem;">
      <i class="fas fa-exclamation-triangle"></i> Please switch to BNB Chain
      <div style="margin-top: 0.5rem;">
        <button onclick="switchToBscNetwork()" class="btn btn-sm" style="margin-right: 0.5rem;">
          Switch Network
        </button>
        <button onclick="addBscNetwork()" class="btn btn-outline btn-sm">
          Add BSC
        </button>
      </div>
    </div>`;
}

function showLowBalance(kly) {
  walletStatus.innerHTML = `
    <div style="color: var(--danger); text-align: center;">
      <i class="fas fa-exclamation-circle"></i> Insufficient KLY (${kly.toFixed(2)}/100)
      <div style="margin-top: 0.5rem;">
        <a href="https://pancakeswap.finance/swap?outputCurrency=${KLY_TOKEN_ADDRESS}" 
           class="btn btn-sm" 
           target="_blank">
          Buy KLY
        </a>
      </div>
    </div>`;
}

// Disconnect Wallet
function disconnectWallet() {
  web3Modal?.clearCachedProvider();
  connectSection.style.display = 'block';
  appContent.style.display = 'none';
  showNotification("Wallet disconnected", "success");
}

// Module Navigation
function showModule(id) {
  document.querySelectorAll('.module').forEach(m => m.style.display = 'none');
  const mod = document.getElementById(id);
  if (!mod) return;
  mod.style.display = 'block';
  mod.classList.add('animate__fadeIn');
  mod.scrollIntoView({ behavior: 'smooth' });

  document.querySelectorAll('.menu-item').forEach(el => {
    el.classList.remove('active');
    const icon = el.querySelector('i');
    if (icon) icon.className = 'far fa-circle';
  });

  const item = document.querySelector(`.menu-item[onclick="showModule('${id}')"]`);
  if (item) {
    item.classList.add('active');
    const icon = item.querySelector('i');
    if (icon) icon.className = 'fas fa-check-circle';
  }

  if (!completedModules.includes(id)) {
    completedModules.push(id);
    localStorage.setItem('completedModules', JSON.stringify(completedModules));
    updateProgress();
  }
}

// Progress Tracking
function updateProgress() {
  const total = 5;
  const done = completedModules.length;
  const percent = (done / total) * 100;

  progressBar.style.width = `${percent}%`;
  progressText.textContent = `${done}/${total}`;

  if (done === total) {
    mintBtn.disabled = false;
    mintBtn.innerHTML = '<i class="fas fa-certificate"></i> Mint NFT Certificate';
    mintBtn.classList.add('pulse');
  }
}

// NFT Minting
async function mintCertificate() {
  if (!signer) return showNotification("Connect wallet first", "error");

  try {
    mintBtn.disabled = true;
    mintBtn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Minting...`;

    const nft = new ethers.Contract(NFT_CONTRACT_ADDRESS, NFT_CONTRACT_ABI, signer);
    const gasEstimate = await nft.estimateGas.mintTo(userAddress, NFT_URI);
    const tx = await nft.mintTo(userAddress, NFT_URI, {
      gasLimit: gasEstimate.mul(120).div(100)
    });

    mintStatus.innerHTML = `
      <div style="color: var(--accent); text-align: center;">
        <i class="fas fa-spinner fa-spin"></i> Confirming...
        <div><a href="https://bscscan.com/tx/${tx.hash}" target="_blank" style="color: var(--accent)">View on BscScan</a></div>
      </div>`;

    await tx.wait();

    mintStatus.innerHTML = `<div style="color: var(--success); text-align: center;"><i class="fas fa-check-circle"></i> NFT Minted!</div>`;
    mintBtn.style.display = 'none';
    launchConfetti();
    showNotification("NFT Certificate minted successfully!", "success");
  } catch (err) {
    showNotification(`Minting failed: ${err.message}`, "error");
    mintStatus.innerHTML = `<div style="color: var(--danger);">Error: ${err.message}</div>`;
    mintBtn.disabled = false;
    mintBtn.innerHTML = '<i class="fas fa-certificate"></i> Try Again';
    mintBtn.classList.remove('pulse');
  }
}

// UI Helpers
function showNotification(msg, type = "info") {
  const notif = document.createElement('div');
  notif.className = `notification ${type}`;
  notif.innerHTML = `
    <div class="notification-icon"><i class="fas fa-${type === 'error' ? 'times' : type === 'success' ? 'check' : 'info'}-circle"></i></div>
    <div class="notification-content">
      <div class="notification-title">${type[0].toUpperCase() + type.slice(1)}</div>
      <div class="notification-message">${msg}</div>
    </div>
    <button class="notification-close" onclick="this.parentElement.remove()"><i class="fas fa-times"></i></button>`;
  document.body.appendChild(notif);
  setTimeout(() => notif.remove(), 5000);
}

function launchConfetti() {
  if (typeof confetti === "function") {
    confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
    setTimeout(() => {
      confetti({ particleCount: 100, angle: 60, spread: 55, origin: { x: 0, y: 0.7 } });
      confetti({ particleCount: 100, angle: 120, spread: 55, origin: { x: 1, y: 0.7 } });
    }, 300);
  }
}

// Initialize
window.addEventListener('load', async () => {
  await initWeb3Modal();
  if (web3Modal.cachedProvider) await connectWallet();
  showModule("module1");
});

// Make functions available globally
window.connectWallet = connectWallet;
window.disconnectWallet = disconnectWallet;
window.mintCertificate = mintCertificate;
window.showModule = showModule;
window.switchToBscNetwork = switchToBscNetwork;
window.addBscNetwork = addBscNetwork;
</script>
