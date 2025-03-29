
// ------------ CONFIG ------------
const KLY_TOKEN_ADDRESS = "0x2e4fEB2Fe668c8Ebe84f19e6c8fE8Cf8131B4E52";
const USDT_TOKEN_ADDRESS = "PUT_YOUR_USDT_ADDRESS_HERE"; // Replace with actual USDT token address
const STAKING_CONTRACT_ADDRESS = "0x25548Ba29a0071F30E4bDCd98Ea72F79341b07a1";
const ROUTER_ADDRESS = "0xD99D1c33F9fC3444f8101754aBC46c52416550D1"; // PancakeSwap V3 testnet router

// ------------ ABIs ------------
const KLY_ABI = [ /* full verified ABI of KLY contract */ ];
const STAKING_ABI = [ /* ABI for staking contract */ ];
const ROUTER_ABI = [ /* PancakeSwap V3 Router ABI snippet used */ ];

// ------------ Connect Wallet ------------
async function connectWallet() {
  if (!window.ethereum) {
    alert("Please install MetaMask!");
    return;
  }
  await ethereum.request({ method: "eth_requestAccounts" });
  window.provider = new ethers.providers.Web3Provider(window.ethereum);
  window.signer = provider.getSigner();
  window.userAddress = await signer.getAddress();
}

// ------------ Token Dashboard ------------
async function loadKLYStats() {
  const contract = new ethers.Contract(KLY_TOKEN_ADDRESS, KLY_ABI, provider);
  const supply = await contract.totalSupply();
  const balance = await contract.balanceOf(userAddress);
  document.getElementById("total-supply").innerText = ethers.utils.formatUnits(supply, 18);
  document.getElementById("wallet-balance").innerText = ethers.utils.formatUnits(balance, 18);
}

// ------------ Staking Logic ------------
async function stakeKLY() {
  const amount = ethers.utils.parseUnits(document.getElementById("stake-amount").value, 18);
  const kly = new ethers.Contract(KLY_TOKEN_ADDRESS, KLY_ABI, signer);
  const staking = new ethers.Contract(STAKING_CONTRACT_ADDRESS, STAKING_ABI, signer);
  await kly.approve(STAKING_CONTRACT_ADDRESS, amount);
  await staking.stake(amount);
}

async function withdrawKLY() {
  const staking = new ethers.Contract(STAKING_CONTRACT_ADDRESS, STAKING_ABI, signer);
  await staking.withdraw();
}

async function claimKLY() {
  const staking = new ethers.Contract(STAKING_CONTRACT_ADDRESS, STAKING_ABI, signer);
  await staking.claim();
}

async function loadStakingData() {
  const staking = new ethers.Contract(STAKING_CONTRACT_ADDRESS, STAKING_ABI, provider);
  const userInfo = await staking.getStakeInfo(userAddress);
  document.getElementById("staked-balance").innerText = ethers.utils.formatUnits(userInfo[0], 18);
  document.getElementById("rewards-earned").innerText = ethers.utils.formatUnits(userInfo[1], 18);
}

// ------------ Token Launchpad ------------
async function launchToken() {
  const name = document.getElementById("token-name").value;
  const symbol = document.getElementById("token-symbol").value;
  const supply = ethers.utils.parseUnits(document.getElementById("token-supply").value, 18);
  const factory = new thirdweb.SDK(signer);
  const deployedToken = await factory.deployer.deployToken({
    name, symbol, initialSupply: supply.toString(),
    primary_sale_recipient: userAddress,
    platform_fee_recipient: "0x2e4fEB2Fe668c8Ebe84f19e6c8fE8Cf8131B4E52", // KLY Treasury
    platform_fee_basis_points: 500
  });
  alert("Token launched: " + deployedToken.address);
}

// ------------ PancakeSwap Liquidity Pool (Add/Remove) ------------
async function addLiquidity() {
  const router = new ethers.Contract(ROUTER_ADDRESS, ROUTER_ABI, signer);
  const kly = new ethers.Contract(KLY_TOKEN_ADDRESS, KLY_ABI, signer);
  const usdt = new ethers.Contract(USDT_TOKEN_ADDRESS, KLY_ABI, signer); // Same ERC20 ABI

  const klyAmount = ethers.utils.parseUnits(document.getElementById("add-kly").value, 18);
  const usdtAmount = ethers.utils.parseUnits(document.getElementById("add-usdt").value, 18);

  await kly.approve(ROUTER_ADDRESS, klyAmount);
  await usdt.approve(ROUTER_ADDRESS, usdtAmount);

  await router.addLiquidity(
    KLY_TOKEN_ADDRESS,
    USDT_TOKEN_ADDRESS,
    klyAmount,
    usdtAmount,
    0,
    0,
    userAddress,
    Math.floor(Date.now() / 1000) + 60
  );
}

async function removeLiquidity() {
  const router = new ethers.Contract(ROUTER_ADDRESS, ROUTER_ABI, signer);
  // assume LP token contract address and ABI are loaded
  const lp = new ethers.Contract("LP_TOKEN_ADDRESS_HERE", KLY_ABI, signer);
  const liquidity = await lp.balanceOf(userAddress);
  await lp.approve(ROUTER_ADDRESS, liquidity);
  await router.removeLiquidity(
    KLY_TOKEN_ADDRESS,
    USDT_TOKEN_ADDRESS,
    liquidity,
    0,
    0,
    userAddress,
    Math.floor(Date.now() / 1000) + 60
  );
}

// ------------ Init ------------
window.onload = async () => {
  await connectWallet();
  await loadKLYStats();
  await loadStakingData();
};

