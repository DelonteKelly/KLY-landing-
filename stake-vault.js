// ===========================
// 🔗 Contract Setup
// ===========================
<script>
const ethers = window.ethers;
let provider, signer, userAddress;
let tokenContract, stakingContract;
let isWalletConnected = false;

const stakingAddress = "0x7bBa73C25cf5384b58DBA280eCB49c9749437823";
const tokenAddress = "0x2e4fEB2Fe668c8Ebe84f19e6c8fE8Cf8131B4E52";

// DOM Elements
const stakeButton = document.getElementById('stake-button');
const claimButton = document.getElementById('claim-button');
const withdrawButton = document.getElementById('withdraw-button');
const walletBalance = document.getElementById('wallet-balance');
const stakedAmount = document.getElementById('staked-amount');
const rewardAmount = document.getElementById('reward-amount');
const statusMessage = document.getElementById('status-message');
const stakeSlider = document.getElementById('stake-slider');
const apyDisplay = document.getElementById('apy-display');

// ABIs
const tokenABI = [ /* ... */ ];
const stakingABI = [ /* ... */ ];

// ===========================
// 🔌 Wallet Connection
// ===========================
async function connectWallet() {
  try {
    if (!window.ethereum) throw new Error("Install MetaMask");

    provider = new ethers.providers.Web3Provider(window.ethereum);
    await provider.send("eth_requestAccounts", []);
    signer = provider.getSigner();
    userAddress = await signer.getAddress();

    tokenContract = new ethers.Contract(tokenAddress, tokenABI, signer);
    stakingContract = new ethers.Contract(stakingAddress, stakingABI, signer);

    isWalletConnected = true;
    await updateBalances();

    statusMessage.textContent = "Wallet connected!";
    activateVault(3000);
    showConfettiEffect();

    setTimeout(() => (statusMessage.textContent = ""), 3000);
  } catch (error) {
    console.error("Wallet connection error:", error);
    statusMessage.textContent = error.message || "Connection failed";
  }
}

// ===========================
// 🧮 Staking Logic
// ===========================
async function handleStake() {
  if (!isWalletConnected) return connectWallet();
  const value = stakeSlider.value.toString();
  const amountWei = ethers.utils.parseUnits(value, 18);

  try {
    stakeButton.disabled = true;
    statusMessage.textContent = "Approving tokens...";

    const allowance = await tokenContract.allowance(userAddress, stakingAddress);
    if (allowance.lt(amountWei)) {
      const approveTx = await tokenContract.approve(stakingAddress, amountWei);
      await approveTx.wait();
    }

    animateTokenTransfer(value);
    activateVault(3000);
    pulseVaultGlow();
    scaleVaultOrb();

    statusMessage.textContent = "Staking...";
    const tx = await stakingContract.stake(amountWei);
    await tx.wait();

    statusMessage.textContent = "Staking successful!";
    await updateBalances();
    showConfettiEffect();
  } catch (error) {
    console.error("Staking error:", error);
    statusMessage.textContent = error?.data?.message || error.message || "Stake failed";
  } finally {
    stakeButton.disabled = false;
    setTimeout(() => (statusMessage.textContent = ""), 3000);
  }
}

async function handleClaim() {
  if (!isWalletConnected) return connectWallet();
  try {
    claimButton.disabled = true;
    statusMessage.textContent = "Claiming rewards...";

    activateVault(3000);
    pulseVaultGlow();
    scaleVaultOrb();

    const tx = await stakingContract.claimRewards();
    await tx.wait();
    await updateBalances();

    statusMessage.textContent = "Rewards claimed!";
    showConfettiEffect();
    animateTokenTransfer(rewardAmount.textContent);
  } catch (error) {
    console.error("Claim error:", error);
    statusMessage.textContent = error?.data?.message || error.message || "Claim failed";
  } finally {
    claimButton.disabled = false;
    setTimeout(() => (statusMessage.textContent = ""), 3000);
  }
}

async function handleWithdraw() {
  if (!isWalletConnected) return connectWallet();
  try {
    withdrawButton.disabled = true;
    statusMessage.textContent = "Withdrawing stake...";

    activateVault(3000);
    pulseVaultGlow();
    scaleVaultOrb();

    const tx = await stakingContract.withdrawStake();
    await tx.wait();
    await updateBalances();

    statusMessage.textContent = "Stake withdrawn!";
    showConfettiEffect();
  } catch (error) {
    console.error("Withdraw error:", error);
    statusMessage.textContent = error?.data?.message || error.message || "Withdraw failed";
  } finally {
    withdrawButton.disabled = false;
    setTimeout(() => (statusMessage.textContent = ""), 3000);
  }
}

// ===========================
// 🎛️ UI Updates
// ===========================
async function updateBalances() {
  if (!isWalletConnected) return;
  try {
    const balance = await tokenContract.balanceOf(userAddress);
    const staked = await stakingContract.stakedBalance(userAddress);
    const rewards = await stakingContract.calculateRewards(userAddress);

    walletBalance.textContent = ethers.utils.formatUnits(balance, 18);
    stakedAmount.textContent = ethers.utils.formatUnits(staked, 18);
    rewardAmount.textContent = ethers.utils.formatUnits(rewards, 18);
    stakeSlider.max = parseFloat(ethers.utils.formatUnits(balance, 18));
  } catch (error) {
    console.error("Error fetching balances:", error);
    statusMessage.textContent = "Error fetching balances";
  }
}

function updateStakeAmount() {
  const value = stakeSlider.value;
  document.querySelector('.stake-amount span:first-child').textContent = value;
  const baseAPY = 12.5;
  const bonus = value / 100 * 5;
  apyDisplay.textContent = (baseAPY + bonus).toFixed(2) + "%";
}

// ===========================
// 🌌 Three.js Vault Scene
// ===========================
let scene, camera, renderer, vault, particles, rings = [], isVaultActive = false;

function initThreeJS() {
  scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x001d3d, 0.1);
  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.z = 5;

  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(window.innerWidth / 2, window.innerHeight);
  renderer.setClearColor(0x000000, 0);
  document.getElementById('canvas-container').appendChild(renderer.domElement);

  const geometry = new THREE.SphereGeometry(1, 64, 64);
  const material = new THREE.MeshPhongMaterial({
    color: 0xffd700,
    emissive: 0xffa500,
    emissiveIntensity: 0.2,
    shininess: 50,
    transparent: true,
    opacity: 0.95,
  });
  vault = new THREE.Mesh(geometry, material);
  scene.add(vault);

  const innerLight = new THREE.PointLight(0xffa500, 2, 3);
  vault.add(innerLight);

  createEnergyRings();
  createParticleField(500);

  scene.add(new THREE.AmbientLight(0x404040, 0.5));
  const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
  directionalLight.position.set(5, 5, 5);
  scene.add(directionalLight);
  const pointLight = new THREE.PointLight(0xffd700, 1, 10);
  pointLight.position.set(0, 0, 2);
  scene.add(pointLight);

  window.addEventListener('resize', onWindowResize);
  animateScene();
}

function createEnergyRings() {
  const ringGeometry = new THREE.TorusGeometry(1.5, 0.05, 16, 100);
  const ringMaterial = new THREE.MeshPhongMaterial({
    color: 0xffd700,
    emissive: 0xffa500,
    emissiveIntensity: 0.5,
    opacity: 0.8,
    transparent: true
  });
  for (let i = 0; i < 3; i++) {
    const ring = new THREE.Mesh(ringGeometry, ringMaterial.clone());
    ring.rotation.x = Math.PI / 2;
    ring.rotation.y = (Math.PI / 3) * i;
    ring.userData = {
      speed: 0.01 + Math.random() * 0.02,
      direction: Math.random() > 0.5 ? 1 : -1
    };
    scene.add(ring);
    rings.push(ring);
  }
}

function createParticleField(count) {
  const geo = new THREE.BufferGeometry();
  const posArray = new Float32Array(count * 3);
  for (let i = 0; i < count * 3; i++) posArray[i] = (Math.random() - 0.5) * 20;
  geo.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
  const mat = new THREE.PointsMaterial({
    color: 0xffd700,
    size: 0.1,
    transparent: true,
    opacity: 0.8,
    blending: THREE.AdditiveBlending
  });
  particles = new THREE.Points(geo, mat);
  scene.add(particles);
}

function onWindowResize() {
  camera.aspect = (window.innerWidth / 2) / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth / 2, window.innerHeight);
}

function animateScene() {
  requestAnimationFrame(animateScene);
  vault.rotation.x += 0.002;
  vault.rotation.y += 0.003;
  if (isVaultActive) {
    const pulse = 1 + Math.sin(Date.now() * 0.005) * 0.05;
    vault.scale.set(pulse, pulse, pulse);
  }
  rings.forEach(r => r.rotation.z += r.userData.speed * r.userData.direction);
  renderer.render(scene, camera);
}

// ===========================
// ✨ Vault Visual Effects
// ===========================
function activateVault(duration = 2000) {
  isVaultActive = true;
  gsap.to(vault.children[0], { intensity: 5, duration: 0.5 });
  rings.forEach(r => gsap.to(r.material, { opacity: 1, emissiveIntensity: 1, duration: 0.5 }));
  setTimeout(deactivateVault, duration);
}

function deactivateVault() {
  isVaultActive = false;
  gsap.to(vault.children[0], { intensity: 2, duration: 1 });
  rings.forEach(r => gsap.to(r.material, { opacity: 0.8, emissiveIntensity: 0.5, duration: 1 }));
  gsap.to(vault.scale, { x: 1, y: 1, z: 1, duration: 1, ease: "elastic.out(1, 0.3)" });
}

function pulseVaultGlow() {
  gsap.to(vault.material, {
    emissiveIntensity: 0.8,
    duration: 0.3,
    yoyo: true,
    repeat: 1
  });
}

function scaleVaultOrb() {
  gsap.to(vault.scale, {
    x: 1.3, y: 1.3, z: 1.3,
    duration: 0.25,
    yoyo: true,
    repeat: 1,
    ease: "power2.inOut"
  });
}

// ===========================
// 🪙 Token & Confetti Effects
// ===========================
function animateTokenTransfer(amount) {
  const buttonRect = stakeButton.getBoundingClientRect();
  const canvasRect = document.getElementById('canvas-container').getBoundingClientRect();
  const tokenCount = Math.min(20, Math.max(5, Math.floor(amount / 10)));

  for (let i = 0; i < tokenCount; i++) {
    const token = document.createElement('div');
    token.className = 'token';
    document.body.appendChild(token);
    const startX = buttonRect.left + Math.random() * 30;
    const startY = buttonRect.top + Math.random() * 30;
    const endX = canvasRect.left + canvasRect.width / 2 + Math.random() * 100;
    const endY = canvasRect.top + canvasRect.height / 2 + Math.random() * 100;

    gsap.set(token, { x: startX, y: startY, opacity: 0, scale: 0.5 });
    gsap.to(token, {
      x: endX, y: endY, opacity: 1, scale: 1,
      duration: 0.5, delay: i * 0.1,
      onStart: () => (token.style.opacity = 1)
    });
    gsap.to(token, {
      opacity: 0, scale: 0.5,
      duration: 0.3, delay: i * 0.1 + 0.5,
      onComplete: () => document.body.removeChild(token)
    });
  }
}

function showConfettiEffect() {
  const colors = ['#ffd700', '#ffa500', '#ffffff', '#ff6347'];
  for (let i = 0; i < 100; i++) {
    const confetti = document.createElement('div');
    confetti.className = 'confetti';
    confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
    document.body.appendChild(confetti);

    const startX = Math.random() * window.innerWidth;
    const rotation = Math.random() * 360;
    const size = Math.random() * 10 + 5;

    gsap.set(confetti, {
      x: startX, y: -10, rotation, width: size + 'px', height: size + 'px', opacity: 0
    });

    gsap.to(confetti, {
      y: window.innerHeight + 10,
      opacity: 1,
      rotation: rotation + 360,
      duration: 2 + Math.random() * 3,
      delay: Math.random() * 0.5,
      onComplete: () => document.body.removeChild(confetti)
    });
  }
}

// ===========================
// 🎮 Event Binding
// ===========================
function bindEvents() {
  document.getElementById('connect-wallet-button')?.addEventListener('click', connectWallet);
  stakeButton?.addEventListener('click', () => isWalletConnected ? handleStake() : connectWallet());
  claimButton?.addEventListener('click', handleClaim);
  withdrawButton?.addEventListener('click', handleWithdraw);
  stakeSlider?.addEventListener('input', updateStakeAmount);
}

// ===========================
// 🚀 Initialization
// ===========================
window.addEventListener("load", () => {
  initThreeJS();
  updateStakeAmount();
  bindEvents();
});
</script>
