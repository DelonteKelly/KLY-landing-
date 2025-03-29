// ----------- CONFIG ----------- //
const KLY_TOKEN_ADDRESS = "0x2e4fEB2Fe668c8Ebe84f19e6c8fE8Cf8131B4E52";
const USDT_TOKEN_ADDRESS = "PUT_USDT_TOKEN_ADDRESS_HERE";
const STAKING_CONTRACT_ADDRESS = "0x25548Ba29a0071F30E4bDCd98Ea72F79341b07a1";
const ROUTER_ADDRESS = "0xD99D1c33F9fC3444f8101754aBC46c52416550D1"; // PancakeSwap V3 Testnet (replace if Mainnet)

// ----------- ABIs ----------- //
const ERC20_ABI = [
  "function approve(address spender, uint256 amount) public returns (bool)",
  "function allowance(address owner, address spender) public view returns (uint256)",
  "function balanceOf(address account) external view returns (uint256)",
  "function decimals() view returns (uint8)"
];

const PANCAKE_ROUTER_ABI = [
  "function addLiquidity(address tokenA, address tokenB,uint amountADesired,uint amountBDesired,uint amountAMin,uint amountBMin,address to,uint deadline) external returns (uint amountA,uint amountB,uint liquidity)"
];

let provider, signer, klyToken, usdtToken, stakingContract;

// ----------- Connect Wallet ----------- //
async function connectWallet() {
  if (!window.ethereum) {
    alert("Please install MetaMask.");
    return;
  }

  provider = new ethers.providers.Web3Provider(window.ethereum);
  await provider.send("eth_requestAccounts", []);
  signer = provider.getSigner();

  klyToken = new ethers.Contract(KLY_TOKEN_ADDRESS, ERC20_ABI, signer);
  usdtToken = new ethers.Contract(USDT_TOKEN_ADDRESS, ERC20_ABI, signer);
  stakingContract = new ethers.Contract(STAKING_CONTRACT_ADDRESS, [
    "function stake(uint256 amount) public",
    "function withdraw() public",
    "function claimRewards() public",
    "function getStakeInfo(address user) public view returns (uint256 staked, uint256 rewards)"
  ], signer);

  const userAddress = await signer.getAddress();
  document.getElementById("user-balance").innerText = "Loading...";
  document.getElementById("wallet-address").innerText = userAddress;

  fetchKLYStats();
}

// ----------- Load KLY Stats ----------- //
async function fetchKLYStats() {
  const user = await signer.getAddress();

  const [supply, balance, stakeInfo] = await Promise.all([
    klyToken.totalSupply(),
    klyToken.balanceOf(user),
    stakingContract.getStakeInfo(user)
  ]);

  document.getElementById("total-supply").innerText = ethers.utils.formatUnits(supply, 18) + " KLY";
  document.getElementById("user-balance").innerText = ethers.utils.formatUnits(balance, 18) + " KLY";
  document.getElementById("stakedBalance").innerText = ethers.utils.formatUnits(stakeInfo[0], 18);
  document.getElementById("rewardBalance").innerText = ethers.utils.formatUnits(stakeInfo[1], 18);
}

// ----------- Staking Actions ----------- //
async function stakeTokens() {
  const amount = document.getElementById("stakeAmount").value;
  if (!amount) return alert("Enter amount.");

  const parsed = ethers.utils.parseUnits(amount, 18);
  await klyToken.approve(STAKING_CONTRACT_ADDRESS, parsed);
  await stakingContract.stake(parsed);
  alert("Staked successfully.");
  fetchKLYStats();
}

async function withdrawTokens() {
  await stakingContract.withdraw();
  alert("Withdrawn.");
  fetchKLYStats();
}

async function claimRewards() {
  await stakingContract.claimRewards();
  alert("Rewards claimed.");
  fetchKLYStats();
}

// ----------- Launch Token Placeholder ----------- //
function launchToken() {
  const name = document.getElementById("tokenName").value;
  const symbol = document.getElementById("tokenSymbol").value;
  const supply = document.getElementById("tokenSupply").value;
  alert(`Launching Token: ${name} (${symbol}) with ${supply} supply`);
}

// ----------- Start Course ----------- //
function startCourse() {
  window.location.href = "/course.html";
}

// ----------- Add Liquidity ----------- //
async function addLiquidity() {
  const klyAmount = document.getElementById("klyAmount").value;
  const usdtAmount = document.getElementById("usdtAmount").value;

  if (!klyAmount || !usdtAmount) return alert("Enter amounts.");

  const parsedKLY = ethers.utils.parseUnits(klyAmount, 18);
  const parsedUSDT = ethers.utils.parseUnits(usdtAmount, 18);

  const router = new ethers.Contract(ROUTER_ADDRESS, PANCAKE_ROUTER_ABI, signer);
  const user = await signer.getAddress();

  await klyToken.approve(ROUTER_ADDRESS, parsedKLY);
  await usdtToken.approve(ROUTER_ADDRESS, parsedUSDT);

  await router.addLiquidity(
    KLY_TOKEN_ADDRESS,
    USDT_TOKEN_ADDRESS,
    parsedKLY,
    parsedUSDT,
    0,
    0,
    user,
    Math.floor(Date.now() / 1000) + 600
  );

  alert("Liquidity added to PancakeSwap!");
}
