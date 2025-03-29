
// ---------------- CONFIG ----------------
const KLY_TOKEN_ADDRESS = "0x2e4fEB2Fe668c8Ebe84f19e6c8fE8Cf8131B4E52";
const USDT_TOKEN_ADDRESS = "PUT_USDT_ADDRESS_HERE";
const STAKING_CONTRACT_ADDRESS = "0x25548Ba29a0071F30E4bDCd98Ea72F79341b07a1";
const ROUTER_ADDRESS = "0xD99D1c33F9fC3444f8101754aBC46c52416550D1"; // PancakeSwap Router for BSC Testnet

// ---------------- ABIs ----------------
const KLY_ABI = [/* Full ABI omitted for brevity */];
const STAKING_ABI = [/* STAKEN ABI here */];
const ROUTER_ABI = [/* PancakeSwap V2 Router ABI */];

// ---------------- INIT ----------------
async function initApp() {
  if (typeof window.ethereum === "undefined") {
    alert("Please install MetaMask to use this feature.");
    return;
  }

  const provider = new ethers.providers.Web3Provider(window.ethereum);
  await provider.send("eth_requestAccounts", []);
  const signer = provider.getSigner();
  const userAddress = await signer.getAddress();

  // Display token info
  const klyContract = new ethers.Contract(KLY_TOKEN_ADDRESS, KLY_ABI, provider);
  const supply = await klyContract.totalSupply();
  const balance = await klyContract.balanceOf(userAddress);
  document.getElementById("total-supply").innerText = ethers.utils.formatUnits(supply, 18);
  document.getElementById("user-balance").innerText = ethers.utils.formatUnits(balance, 18);

  // Store for reuse
  window.kly = { provider, signer, userAddress, klyContract };
}

// ---------------- STAKING ----------------
async function stakeKLY(amount) {
  const { signer } = window.kly;
  const contract = new ethers.Contract(STAKING_CONTRACT_ADDRESS, STAKING_ABI, signer);
  const klyContract = new ethers.Contract(KLY_TOKEN_ADDRESS, KLY_ABI, signer);
  const amt = ethers.utils.parseUnits(amount, 18);
  await klyContract.approve(STAKING_CONTRACT_ADDRESS, amt);
  await contract.stake(amt);
  alert("Staked!");
}

async function claimKLY() {
  const { signer } = window.kly;
  const contract = new ethers.Contract(STAKING_CONTRACT_ADDRESS, STAKING_ABI, signer);
  await contract.claim();
  alert("Rewards claimed!");
}

async function withdrawKLY() {
  const { signer } = window.kly;
  const contract = new ethers.Contract(STAKING_CONTRACT_ADDRESS, STAKING_ABI, signer);
  await contract.withdraw();
  alert("Withdrawn!");
}

// ---------------- LIQUIDITY ----------------
async function addLiquidity(klyAmount, usdtAmount) {
  const { signer } = window.kly;
  const router = new ethers.Contract(ROUTER_ADDRESS, ROUTER_ABI, signer);
  const kly = new ethers.Contract(KLY_TOKEN_ADDRESS, KLY_ABI, signer);
  const usdt = new ethers.Contract(USDT_TOKEN_ADDRESS, KLY_ABI, signer);

  const klyAmt = ethers.utils.parseUnits(klyAmount, 18);
  const usdtAmt = ethers.utils.parseUnits(usdtAmount, 18);

  await kly.approve(ROUTER_ADDRESS, klyAmt);
  await usdt.approve(ROUTER_ADDRESS, usdtAmt);

  const deadline = Math.floor(Date.now() / 1000) + 60 * 10;
  await router.addLiquidity(
    KLY_TOKEN_ADDRESS,
    USDT_TOKEN_ADDRESS,
    klyAmt,
    usdtAmt,
    0,
    0,
    window.kly.userAddress,
    deadline
  );
  alert("Liquidity added!");
}
