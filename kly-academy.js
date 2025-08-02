<script type="module">
import { ethers } from "./ethers.min.js"; // Make sure ethers is available locally or via CDN
import Web3Modal from "./web3modal.js";
import WalletConnectProvider from "@walletconnect/web3-provider";

const KLY_TOKEN_ADDRESS = "0x2e4fEB2Fe668c8Ebe84f19e6c8fE8Cf8131B4E52";
const NFT_CONTRACT_ADDRESS = "0xc1a2E9A475779EfD04247EA473638717E26cd5C5";

const KLY_TOKEN_ABI = [
  "function balanceOf(address) view returns (uint256)",
  "function decimals() view returns (uint8)"
];

const NFT_CONTRACT_ABI = [
  "function mintTo(address to, string uri)"
];

let provider, web3Modal, signer, userAddress;
let completedModules = [];

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

function createParticles() {
  const particlesContainer = document.getElementById('particles');
  if (!particlesContainer) return;

  const particleCount = window.innerWidth < 768 ? 20 : 50;

  for (let i = 0; i < particleCount; i++) {
    const particle = document.createElement('div');
    particle.className = 'particle';

    const size = Math.random() * 5 + 2;
    const posX = Math.random() * 100;
    const posY = Math.random() * 100;
    const opacity = Math.random() * 0.3 + 0.1;
    const animationDuration = Math.random() * 20 + 10;
    const animationDelay = Math.random() * 10;
    const color = `hsl(${Math.random() * 60 + 200}, 100%, 70%)`;

    particle.style.width = `${size}px`;
    particle.style.height = `${size}px`;
    particle.style.left = `${posX}%`;
    particle.style.top = `${posY}%`;
    particle.style.opacity = opacity;
    particle.style.background = color;
    particle.style.animationDuration = `${animationDuration}s`;
    particle.style.animationDelay = `-${animationDelay}s`;

    particlesContainer.appendChild(particle);
  }
}

async function initWeb3Modal() {
  const providerOptions = {
    walletconnect: {
      package: WalletConnectProvider,
      options: {
        rpc: { 56: "https://bsc-dataseed.binance.org/" },
        chainId: 56
      }
    }
  };

  web3Modal = new Web3Modal({
    cacheProvider: true,
    providerOptions,
    theme: "dark"
  });
}

export async function connectWallet() {
  try {
    if (!web3Modal) await initWeb3Modal();

    connectBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Connecting...';

    const instance = await web3Modal.connect();
    provider = new ethers.providers.Web3Provider(instance);
    signer = provider.getSigner();
    userAddress = await signer.getAddress();

    walletAddress.textContent = `${userAddress.slice(0, 6)}...${userAddress.slice(-4)}`;
    userAvatar.textContent = userAddress.slice(2, 4).toUpperCase();

    const network = await provider.getNetwork();
    if (network.chainId !== 56) {
      walletStatus.innerHTML = `
        <div style="color: orange; text-align: center;">
          <i class="fas fa-exclamation-triangle"></i> Switch to BNB Chain
          <button onclick="addBscNetwork()" class="btn">Add BSC</button>
        </div>`;
      return;
    }

    const token = new ethers.Contract(KLY_TOKEN_ADDRESS, KLY_TOKEN_ABI, provider);
    const balance = await token.balanceOf(userAddress);
    const decimals = await token.decimals();
    const kly = parseFloat(ethers.utils.formatUnits(balance, decimals));

    if (kly >= 100) {
      connectSection.style.display = 'none';
      appContent.style.display = 'block';
      showNotification("Wallet connected", "success");
      updateProgress();
    } else {
      walletStatus.innerHTML = `
        <div style="color: red; text-align: center;">
          Insufficient KLY (${kly.toFixed(2)}/100)
          <a href="https://pancakeswap.finance/swap?outputCurrency=${KLY_TOKEN_ADDRESS}" class="btn">Buy KLY</a>
        </div>`;
    }
  } catch (err) {
    showNotification(`Connect error: ${err.message}`, "error");
    connectBtn.innerHTML = '<i class="fas fa-wallet"></i> Connect Wallet';
  }
}

export async function addBscNetwork() {
  try {
    await window.ethereum.request({
      method: 'wallet_addEthereumChain',
      params: [{
        chainId: '0x38',
        chainName: 'Binance Smart Chain',
        nativeCurrency: { name: 'BNB', symbol: 'BNB', decimals: 18 },
        rpcUrls: ['https://bsc-dataseed.binance.org/'],
        blockExplorerUrls: ['https://bscscan.com']
      }]
    });
    showNotification("BSC added", "success");
    setTimeout(() => location.reload(), 2000);
  } catch (err) {
    showNotification("Failed to add BSC: " + err.message, "error");
  }
}

export function disconnectWallet() {
  if (web3Modal?.clearCachedProvider) web3Modal.clearCachedProvider();
  connectSection.style.display = 'block';
  appContent.style.display = 'none';
  showNotification("Wallet disconnected", "success");
}

export function showModule(id) {
  document.querySelectorAll('.module').forEach(m => m.style.display = 'none');
  const target = document.getElementById(id);
  if (!target) return;
  target.style.display = 'block';
  target.classList.add('animate__fadeIn');
  target.scrollIntoView({ behavior: 'smooth', block: 'start' });

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
    updateProgress();
  }
}

function updateProgress() {
  const total = 5;
  const done = completedModules.length;
  const percent = (done / total) * 100;

  if (progressBar) progressBar.style.width = `${percent}%`;
  if (progressText) progressText.textContent = `${done}/${total}`;

  if (done === total && mintBtn) {
    mintBtn.disabled = false;
    mintBtn.innerHTML = '<i class="fas fa-certificate"></i> Mint NFT Certificate';
    mintBtn.classList.add('pulse');
  }
}

export async function mintCertificate() {
  if (!signer) return showNotification("Connect wallet first", "error");

  try {
    mintBtn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Minting...`;
    mintBtn.disabled = true;

    const contract = new ethers.Contract(NFT_CONTRACT_ADDRESS, NFT_CONTRACT_ABI, signer);
    const gasEstimate = await contract.estimateGas.mintTo(userAddress, "ipfs://bafybeihkmkaf2mgx7xkrnkhmzd2uvhr6ddgj6z3vkqcgnvlaa3z7x263r4");
    const tx = await contract.mintTo(
      userAddress,
      "ipfs://bafybeihkmkaf2mgx7xkrnkhmzd2uvhr6ddgj6z3vkqcgnvlaa3z7x263r4",
      { gasLimit: gasEstimate.mul(120).div(100) }
    );

    mintStatus.innerHTML = `<div><i class="fas fa-spinner fa-spin"></i> Confirming on chain...</div>`;
    await tx.wait();
    mintStatus.innerHTML = `<div style="color: green;"><i class="fas fa-check-circle"></i> NFT Minted!</div>`;
    mintBtn.style.display = 'none';
    launchConfetti();
  } catch (err) {
    showNotification("Mint failed: " + err.message, "error");
    mintStatus.innerHTML = `<div style="color: red;">Error: ${err.message}</div>`;
    mintBtn.innerHTML = 'Try Again';
    mintBtn.disabled = false;
  }
}

function showNotification(message, type = "info") {
  const notif = document.createElement('div');
  notif.className = `notification ${type}`;
  notif.innerHTML = `
    <div class="message">${message}</div>
    <button onclick="this.parentElement.remove()">✕</button>`;
  document.body.appendChild(notif);
  setTimeout(() => notif.remove(), 5000);
}

function launchConfetti() {
  if (typeof confetti === "function") {
    confetti({ particleCount: 150, spread: 60, origin: { y: 0.6 } });
  }
}

window.addEventListener('load', async () => {
  createParticles();
  await initWeb3Modal();
  if (web3Modal.cachedProvider) await connectWallet();
  showModule("module1");
});
</script>
