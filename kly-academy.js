<!-- ✅ Make sure these are loaded in your <head> -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/ethers/5.7.2/ethers.umd.min.js"></script>
<script src="https://unpkg.com/web3modal@1.9.12/dist/index.js"></script>
<script src="https://unpkg.com/@walletconnect/web3-provider@1.8.0/dist/umd/index.min.js"></script>

<!-- ✅ Main Logic -->
<script>
const KLY_TOKEN_ADDRESS = "0x2e4fEB2Fe668c8Ebe84f19e6c8fE8Cf8131B4E52";
 const NFT_CONTRACT_ADDRESS = "0xDA76d35742190283E340dbeE2038ecc978a56950"
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

function createParticles() {
  const container = document.getElementById('particles');
  const count = window.innerWidth < 768 ? 20 : 50;
  for (let i = 0; i < count; i++) {
    const p = document.createElement('div');
    p.className = 'particle';
    p.style.width = p.style.height = `${Math.random() * 5 + 2}px`;
    p.style.left = `${Math.random() * 100}%`;
    p.style.top = `${Math.random() * 100}%`;
    p.style.opacity = Math.random() * 0.3 + 0.1;
    p.style.background = `hsl(${Math.random() * 60 + 200}, 100%, 70%)`;
    p.style.animationDuration = `${Math.random() * 20 + 10}s`;
    p.style.animationDelay = `-${Math.random() * 10}s`;
    container.appendChild(p);
  }
}

async function initWeb3Modal() {
  web3Modal = new window.Web3Modal.default({
    cacheProvider: false,
    providerOptions: {
      walletconnect: {
        package: window.WalletConnectProvider.default,
        options: {
          rpc: { [BSC_CHAIN_ID]: BSC_RPC },
          chainId: BSC_CHAIN_ID
        }
      }
    },
    theme: "dark"
  });
}

async function connectWallet() {
  try {
    connectBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Connecting...';

    const instance = await web3Modal.connect();
    provider = new ethers.providers.Web3Provider(instance);
    signer = provider.getSigner();
    userAddress = await signer.getAddress();

    instance.on?.("accountsChanged", () => window.location.reload());
    instance.on?.("chainChanged", () => window.location.reload());

    walletAddress.textContent = `${userAddress.slice(0, 6)}...${userAddress.slice(-4)}`;
    userAvatar.textContent = userAddress.slice(2, 4).toUpperCase();

    const net = await provider.getNetwork();
    if (net.chainId !== BSC_CHAIN_ID) return showNetworkWarning();

    const token = new ethers.Contract(KLY_TOKEN_ADDRESS, KLY_TOKEN_ABI, provider);
    const [balance, decimals] = await Promise.all([
      token.balanceOf(userAddress),
      token.decimals()
    ]);

    const kly = parseFloat(ethers.utils.formatUnits(balance, decimals));
    if (kly < 100) return showLowBalance(kly);

    connectSection.style.display = 'none';
    appContent.style.display = 'block';
    showNotification("Wallet connected", "success");
    updateProgress();
  } catch (e) {
    showNotification(`Connect error: ${e.message}`, "error");
    walletStatus.innerHTML = `<div style="color: var(--danger); text-align:center;">${e.message}</div>`;
  } finally {
    connectBtn.innerHTML = '<i class="fas fa-wallet"></i> Connect Wallet';
  }
}

function showNetworkWarning() {
  walletStatus.innerHTML = `
    <div style="color: orange; text-align: center;">
      <i class="fas fa-exclamation-triangle"></i> Switch to BNB Chain
      <button onclick="addBscNetwork()" class="btn">Add BSC</button>
    </div>`;
}

function showLowBalance(kly) {
  walletStatus.innerHTML = `
    <div style="color: red; text-align: center;">
      Insufficient KLY (${kly.toFixed(2)}/100)
      <a href="https://pancakeswap.finance/swap?outputCurrency=${KLY_TOKEN_ADDRESS}" class="btn" target="_blank">Buy KLY</a>
    </div>`;
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
    showNotification("BSC added", "success");
    setTimeout(() => location.reload(), 2000);
  } catch (err) {
    showNotification("Failed to add BSC: " + err.message, "error");
  }
}

function disconnectWallet() {
  web3Modal?.clearCachedProvider();
  connectSection.style.display = 'block';
  appContent.style.display = 'none';
  showNotification("Wallet disconnected", "success");
}

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
    mintStatus.innerHTML = `<div style="color: red;">Error: ${err.message}</div>`;
    mintBtn.disabled = false;
    mintBtn.innerHTML = '<i class="fas fa-certificate"></i> Try Again';
    mintBtn.classList.remove('pulse');
  }
}

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

window.addEventListener('load', async () => {
  createParticles();
  await initWeb3Modal();
  if (web3Modal.cachedProvider) await connectWallet();
  showModule("module1");
});

window.connectWallet = connectWallet;
window.disconnectWallet = disconnectWallet;
window.mintCertificate = mintCertificate;
window.showModule = showModule;
window.addBscNetwork = addBscNetwork;
</script>
