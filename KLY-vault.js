<script type="module">
// ==============================
// 🔗 Config & Setup
// ==============================
import { ethers } from 'https://cdn.jsdelivr.net/npm/ethers@5.7.2/dist/ethers.esm.min.js';

const contractAddress = "0xDA76d35742190283E340dbeE2038ecc978a56950";
const contractABI = [
  {
    inputs: [{ internalType: "address", name: "owner", type: "address" }],
    name: "balanceOf",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function"
  }
];

let userAddress;

// ==============================
// 🔌 Wallet Connection
// ==============================
async function connectWallet() {
  if (!window.ethereum) {
    alert("MetaMask not found. Please install it.");
    return;
  }

  try {
    const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
    userAddress = accounts[0];

    const shortened = `${userAddress.slice(0, 6)}...${userAddress.slice(-4)}`;
    document.getElementById('connectWalletBtn').classList.add('hidden');
    document.getElementById('walletAddress').textContent = shortened;
    document.getElementById('walletAddress').classList.remove('hidden');
  } catch (err) {
    console.error("Wallet connect error:", err);
  }
}

// ==============================
// 🧿 NFT Access Gate
// ==============================
async function checkNFTAccess() {
  if (!userAddress) {
    alert("Connect your wallet first.");
    return;
  }

  try {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    const contract = new ethers.Contract(contractAddress, contractABI, signer);
    const balance = await contract.balanceOf(userAddress);

    if (balance.gt(0)) {
      unlockVault();
    } else {
      alert("Access denied. You don’t hold the Key of Ascension NFT.");
    }
  } catch (error) {
    console.error("Contract interaction failed:", error);
    alert("There was an error checking your NFT access.");
  }
}

function unlockVault() {
  document.getElementById('vaultItems').style.display = 'grid';
  document.querySelector('.door-overlay').style.display = 'none';
  setTimeout(() => {
    document.getElementById('vaultItems').scrollIntoView({ behavior: 'smooth' });
  }, 500);
}

// ==============================
// ✨ Golden Particles Animation
// ==============================
function generateParticles(count = 50) {
  const particlesContainer = document.getElementById('particles');
  for (let i = 0; i < count; i++) {
    const p = document.createElement('div');
    p.classList.add('particle');
    const size = Math.random() * 5 + 1;
    p.style.width = `${size}px`;
    p.style.height = `${size}px`;
    p.style.left = `${Math.random() * 100}%`;
    p.style.top = `${Math.random() * 100}%`;
    p.style.animationDelay = `${Math.random() * 5}s`;
    p.style.animationDuration = `${Math.random() * 10 + 10}s`;
    particlesContainer.appendChild(p);
  }

  const particles = document.querySelectorAll('.particle');
  particles.forEach(p => {
    setInterval(() => {
      const moveX = (Math.random() - 0.5) * 20;
      const moveY = (Math.random() - 0.5) * 20;
      p.style.transform = `translate(${moveX}px, ${moveY}px)`;
      p.style.opacity = Math.random() * 0.5 + 0.3;
    }, 2000);
  });
}

// ==============================
// 🌌 Three.js Scene Setup
// ==============================
function initThreeJS() {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  const renderer = new THREE.WebGLRenderer({
    canvas: document.getElementById('threejs-canvas'),
    alpha: true
  });
  renderer.setSize(window.innerWidth, window.innerHeight);

  const geometry = new THREE.TorusKnotGeometry(10, 3, 100, 16);
  const material = new THREE.MeshBasicMaterial({
    color: 0xD4AF37,
    wireframe: true,
    transparent: true,
    opacity: 0.3
  });
  const knot = new THREE.Mesh(geometry, material);
  scene.add(knot);

  camera.position.z = 30;

  function animate() {
    requestAnimationFrame(animate);
    knot.rotation.x += 0.001;
    knot.rotation.y += 0.002;
    renderer.render(scene, camera);
  }

  animate();

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });
}

// ==============================
// 🎮 Bind Events
// ==============================
function bindEvents() {
  document.getElementById('connectWalletBtn')?.addEventListener('click', connectWallet);
  document.getElementById('unlockBtn')?.addEventListener('click', checkNFTAccess);
}

// ==============================
// 🚀 Init
// ==============================
window.addEventListener('DOMContentLoaded', () => {
  generateParticles();
  initThreeJS();
  bindEvents();
});
</script>
