// Initialize Thirdweb SDK
const sdk = new thirdweb.ThirdwebSDK("binance");

// KLY Token + Staking Contracts
const klyTokenAddress = "0x2e4fEB2Fe668c8Ebe84f19e6c8fE8Cf8131B4E52";
const stakingContractAddress = "0x25548Ba29a0071F30E4bDCd98Ea72F79341b07a1";

let walletAddress = "";
let token, staking;

// Connect Wallet
async function connectWallet() {
  const wallet = await thirdweb.connectWallet("injected");
  walletAddress = await wallet.getAddress();
  document.getElementById("wallet-address").innerText = walletAddress;

  token = await sdk.getToken(klyTokenAddress);
  staking = await sdk.getContract(stakingContractAddress);

  loadDashboard();
}

// Load Token Stats
async function loadDashboard() {
  const totalSupply = await token.totalSupply();
  const balance = await token.balanceOf(walletAddress);
  const staked = await staking.erc20.getStakeInfo(walletAddress);

  document.getElementById("total-supply").innerText = `${totalSupply.displayValue} KLY`;
  document.getElementById("user-balance").innerText = `${balance.displayValue} KLY`;
  document.getElementById("stakedBalance").innerText = `${staked.stakedAmount.displayValue}`;
  document.getElementById("rewardBalance").innerText = `${staked.rewards.displayValue}`;
}

// Stake Tokens
async function stakeTokens() {
  const amount = document.getElementById("stakeAmount").value;
  await token.setAllowance(stakingContractAddress, amount);
  await staking.erc20.stake(amount);
  loadDashboard();
}

// Withdraw Stake
async function withdrawTokens() {
  await staking.erc20.withdraw();
  loadDashboard();
}

// Claim Rewards
async function claimRewards() {
  await staking.erc20.claimRewards();
  loadDashboard();
}

// Launch New Token
document.getElementById("launch-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const name = document.getElementById("tokenName").value;
  const symbol = document.getElementById("tokenSymbol").value;
  const supply = document.getElementById("tokenSupply").value;

  const deployed = await sdk.deployer.deployToken({
    name,
    symbol,
    primary_sale_recipient: walletAddress,
    total_supply: supply,
  });

  // Send 5% to KLY treasury
  const treasury = "0x2e4fEB2Fe668c8Ebe84f19e6c8fE8Cf8131B4E52";
  const newToken = await sdk.getToken(deployed);
  const fivePercent = (parseFloat(supply) * 0.05).toString();
  await newToken.transfer(treasury, fivePercent);

  alert("Token Deployed Successfully!");
});

// Start Course (placeholder)
function startCourse() {
  window.location.href = "course.html";
}
