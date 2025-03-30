// Constants
const KLY_TOKEN_ADDRESS = "0x2e4fEB2Fe668c8Ebe84f19e6c8fE8Cf8131B4E52";
const STAKING_CONTRACT_ADDRESS = "0x25548Ba29a0071F30E4bDCd98Ea72F79341b07a1";
const NFT_CONTRACT_ADDRESS = "0xDA76d35742190283E340dbeE2038ecc978a56950";

// INSERTED KLY TOKEN ABI
const KLY_ABI = [
  {
    "constant": true,
    "inputs": [],
    "name": "totalSupply",
    "outputs": [{ "name": "", "type": "uint256" }],
    "type": "function",
  },
  {
    "constant": true,
    "inputs": [{ "name": "_owner", "type": "address" }],
    "name": "balanceOf",
    "outputs": [{ "name": "balance", "type": "uint256" }],
    "type": "function",
  },
  {
    "inputs": [{ "name": "amount", "type": "uint256" }],
    "name": "stake",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function",
  },
  {
    "inputs": [],
    "name": "withdraw",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function",
  },
  {
    "inputs": [],
    "name": "claimRewards",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function",
  },
];

// NFT Mint ABI
const NFT_ABI = [
  {
    "inputs": [
      { "internalType": "address", "name": "recipient", "type": "address" },
      { "internalType": "int24", "name": "tickLower", "type": "int24" },
      { "internalType": "int24", "name": "tickUpper", "type": "int24" },
      { "internalType": "uint128", "name": "amount", "type": "uint128" },
      { "internalType": "bytes", "name": "data", "type": "bytes" },
    ],
    "name": "mint",
    "outputs": [
      { "internalType": "uint256", "name": "amount0", "type": "uint256" },
      { "internalType": "uint256", "name": "amount1", "type": "uint256" },
    ],
    "stateMutability": "nonpayable",
    "type": "function",
  },
];

let provider, signer, contract;

// Connect Wallet
async function connectWallet() {
  if (!window.ethereum) {
    alert("Please install MetaMask.");
    return;
  }
  provider = new ethers.providers.Web3Provider(window.ethereum);
  await provider.send("eth_requestAccounts", []);
  signer = provider.getSigner();
  contract = new ethers.Contract(KLY_TOKEN_ADDRESS, KLY_ABI, signer);

  const address = await signer.getAddress();
  console.log("Wallet connected:", address);
  alert("Wallet connected: " + address);
  fetchKLYStats();
}

document.getElementById("connectWallet").addEventListener("click", connectWallet);

// Fetch KLY Token Stats
async function fetchKLYStats() {
  try {
    const address = await signer.getAddress();
    const totalSupply = await contract.totalSupply();
    const balance = await contract.balanceOf(address);

    document.getElementById("total-supply").innerText =
      ethers.utils.formatUnits(totalSupply, 18) + " KLY";
    document.getElementById("user-balance").innerText =
      ethers.utils.formatUnits(balance, 18) + " KLY";
  } catch (error) {
    console.error("Error fetching stats:", error);
  }
}
// ====== STAKING FUNCTIONS ======

const STAKING_CONTRACT_ADDRESS = "0x25548Ba29a0071F30E4bDCd98Ea72F79341b07a1";
const STAKING_ABI = [
  {
    "inputs": [{"internalType":"uint256","name":"amount","type":"uint256"}],
    "name":"stake",
    "outputs":[],
    "stateMutability":"nonpayable",
    "type":"function"
  },
  {
    "inputs":[],
    "name":"claimRewards",
    "outputs":[],
    "stateMutability":"nonpayable",
    "type":"function"
  },
  {
    "inputs":[],
    "name":"withdraw",
    "outputs":[],
    "stateMutability":"nonpayable",
    "type":"function"
  },
  {
    "inputs":[{"internalType":"address","name":"user","type":"address"}],
    "name":"getStakeInfo",
    "outputs":[
      {"internalType":"uint256","name":"staked","type":"uint256"},
      {"internalType":"uint256","name":"rewards","type":"uint256"}
    ],
    "stateMutability":"view",
    "type":"function"
  }
];

// Stake KLY
async function stakeTokens() {
  const amount = document.getElementById("stakeAmount").value;
  if (!amount) return alert("Enter amount to stake");

  try {
    const stakingContract = new ethers.Contract(STAKING_CONTRACT_ADDRESS, STAKING_ABI, signer);
    const parsedAmount = ethers.utils.parseUnits(amount, 18);

    const approveTx = await contract.approve(STAKING_CONTRACT_ADDRESS, parsedAmount);
    await approveTx.wait();

    const tx = await stakingContract.stake(parsedAmount);
    await tx.wait();

    alert("Staked successfully!");
    updateStakingInfo();
  } catch (err) {
    console.error("Staking failed:", err);
    alert("Staking failed. See console.");
  }
}

// Claim Rewards
async function claimRewards() {
  try {
    const stakingContract = new ethers.Contract(STAKING_CONTRACT_ADDRESS, STAKING_ABI, signer);
    const tx = await stakingContract.claimRewards();
    await tx.wait();

    alert("Rewards claimed!");
    updateStakingInfo();
  } catch (err) {
    console.error("Claim failed:", err);
    alert("Failed to claim rewards.");
  }
}

// Withdraw Staked Tokens
async function withdrawTokens() {
  try {
    const stakingContract = new ethers.Contract(STAKING_CONTRACT_ADDRESS, STAKING_ABI, signer);
    const tx = await stakingContract.withdraw();
    await tx.wait();

    alert("Withdraw successful!");
    updateStakingInfo();
  } catch (err) {
    console.error("Withdraw failed:", err);
    alert("Failed to withdraw.");
  }
}

// Update staked + rewards info
async function updateStakingInfo() {
  try {
    const stakingContract = new ethers.Contract(STAKING_CONTRACT_ADDRESS, STAKING_ABI, signer);
    const user = await signer.getAddress();
    const [staked, rewards] = await stakingContract.getStakeInfo(user);

    document.getElementById("stakedBalance").innerText = ethers.utils.formatUnits(staked, 18) + " KLY";
    document.getElementById("rewardBalance").innerText = ethers.utils.formatUnits(rewards, 18) + " KLY";
  } catch (err) {
    console.error("Error fetching staking info:", err);
  }
}

// ========== LIBERTY POOL (PancakeSwap V3) ==========

// Liberty Pool Constants
const KLY_ADDRESS = "0x2e4fEB2Fe668c8Ebe84f19e6c8fE8Cf8131B4E52";
const USDT_ADDRESS = "0x55d398326f99059fF775485246999027B3197955"; // Mainnet USDT
const V3_ROUTER_ADDRESS = "0x2D99ABD9008Dc933ff5c0CD271B88309593aB921"; // PancakeSwap V3 router
const V3_ROUTER_ABI = [
  {
    "inputs": [
      { "internalType": "address", "name": "token0", "type": "address" },
      { "internalType": "address", "name": "token1", "type": "address" },
      { "internalType": "uint24", "name": "fee", "type": "uint24" },
      { "internalType": "address", "name": "recipient", "type": "address" },
      { "internalType": "uint256", "name": "amount0Desired", "type": "uint256" },
      { "internalType": "uint256", "name": "amount1Desired", "type": "uint256" },
      { "internalType": "uint256", "name": "amount0Min", "type": "uint256" },
      { "internalType": "uint256", "name": "amount1Min", "type": "uint256" },
      { "internalType": "uint160", "name": "sqrtPriceLimitX96", "type": "uint160" }
    ],
    "name": "addLiquidity",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "removeLiquidity",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
];

// Add Liquidity
async function addLiquidity() {
  const klyAmount = document.getElementById("klyAmount").value;
  const usdtAmount = document.getElementById("usdtAmount").value;
  if (!klyAmount || !usdtAmount) return alert("Enter KLY and USDT amounts.");

  try {
    const kly = new ethers.Contract(KLY_ADDRESS, KLY_ABI, signer);
    const usdt = new ethers.Contract(USDT_ADDRESS, KLY_ABI, signer); // USDT uses same ERC20 ABI for approve
    const router = new ethers.Contract(V3_ROUTER_ADDRESS, V3_ROUTER_ABI, signer);

    const klyParsed = ethers.utils.parseUnits(klyAmount, 18);
    const usdtParsed = ethers.utils.parseUnits(usdtAmount, 18);

    await kly.approve(V3_ROUTER_ADDRESS, klyParsed);
    await usdt.approve(V3_ROUTER_ADDRESS, usdtParsed);

    const tx = await router.addLiquidity(
      KLY_ADDRESS,
      USDT_ADDRESS,
      100, // fee tier (0.01%)
      await signer.getAddress(),
      klyParsed,
      usdtParsed,
      0,
      0,
      0
    );

    await tx.wait();
    alert("Liquidity added successfully!");
  } catch (err) {
    console.error("Add liquidity failed:", err);
    alert("Add liquidity failed.");
  }
}

// Remove Liquidity (placeholder for logic — will vary based on LP NFT handling)
async function removeLiquidity() {
  alert("Remove liquidity feature coming soon. LP tokens are NFT-based and need custom logic.");
}

// Course Button Redirect
function startCourse() {
  window.location.href = "/course.html";
}

// ================== NFT CERTIFICATE MINTING ==================

const CERTIFICATE_CONTRACT_ADDRESS = "0xDA76d35742190283E340dbeE2038ecc978a56950";
const CERTIFICATE_ABI = [
  {
    "inputs": [
      { "internalType": "address", "name": "recipient", "type": "address" },
      { "internalType": "int24", "name": "tickLower", "type": "int24" },
      { "internalType": "int24", "name": "tickUpper", "type": "int24" },
      { "internalType": "uint128", "name": "amount", "type": "uint128" },
      { "internalType": "bytes", "name": "data", "type": "bytes" }
    ],
    "name": "mint",
    "outputs": [
      { "internalType": "uint256", "name": "amount0", "type": "uint256" },
      { "internalType": "uint256", "name": "amount1", "type": "uint256" }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  }
];

async function claimCertificateNFT() {
  if (!window.ethereum) {
    alert("Please install MetaMask.");
    return;
  }

  try {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    await provider.send("eth_requestAccounts", []);
    const signer = provider.getSigner();
    const user = await signer.getAddress();

    const certificateContract = new ethers.Contract(CERTIFICATE_CONTRACT_ADDRESS, CERTIFICATE_ABI, signer);
    const tx = await certificateContract.mint(user, -887220, 887220, ethers.utils.parseUnits("1", 18), "0x");
    await tx.wait();

    alert("Success! NFT Certificate Minted.");
  } catch (err) {
    console.error("Minting failed:", err);
    alert("Minting failed. Ensure you have at least 1 KLY in your wallet.");
  }
}
