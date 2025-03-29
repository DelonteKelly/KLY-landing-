// Initialize Thirdweb SDK on Binance Smart Chain
const thirdweb = new ThirdwebSDK("binance");

// Define contract addresses
const KLY_TOKEN_ADDRESS = "0x2e4fEB2Fe668c8Ebe84f19e6c8fE8Cf8131B4E52"; // KLY Token
const STAKING_CONTRACT_ADDRESS = "0x25548Ba29a0071F30E4bDCd98Ea72F79341b07a1"; // STAKEN Contract

let connectedWallet;
let tokenContract;
let stakingContract;

// Connect wallet
async function connectWallet() {
  try {
    const wallet = await thirdweb.wallet.connect();
    connectedWallet = wallet;
    document.getElementById("wallet-address").innerText = wallet.address;
    await initContracts();
    await loadDashboard();
  } catch (error) {
    console.error("Wallet connection failed:", error);
    alert("Failed to connect wallet.");
  }
}

// Initialize contracts
async function initContracts() {
  tokenContract = await thirdweb.getToken(KLY_TOKEN_ADDRESS);
  stakingContract = await thirdweb.getContract(STAKING_CONTRACT_ADDRESS, "custom");
}

// Load token dashboard data
async function loadDashboard() {
  try {
    const supply = await tokenContract.totalSupply();
    const balance = await tokenContract.balanceOf(connectedWallet.address);
    const stakeInfo = await stakingContract.call("getStakeInfo", [connectedWallet.address]);

    document.getElementById("total-supply").innerText = `${supply.displayValue} KLY`;
    document.getElementById("user-balance").innerText = `${balance.displayValue} KLY`;
    document.getElementById("stakedBalance").innerText = `${stakeInfo[0]} KLY`;
    document.getElementById("rewardBalance").innerText = `${stakeInfo[1]} KLY`;
  } catch (error) {
    console.error("Error loading dashboard:", error);
  }
}

// Stake tokens
async function stakeTokens() {
  try {
    const amount = document.getElementById("stakeAmount").value;
    if (!amount || isNaN(amount)) return alert("Enter a valid amount to stake.");
    await tokenContract.setAllowance(STAKING_CONTRACT_ADDRESS, amount);
    await stakingContract.call("stake", [amount]);
    alert("Staked successfully!");
    await loadDashboard();
  } catch (error) {
    console.error("Staking failed:", error);
    alert("Staking failed. See console for details.");
  }
}

// Withdraw staked tokens
async function withdrawTokens() {
  try {
    await stakingContract.call("withdraw");
    alert("Withdrawn successfully!");
    await loadDashboard();
  } catch (error) {
    console.error("Withdraw failed:", error);
    alert("Withdraw failed.");
  }
}

// Claim staking rewards
async function claimRewards() {
  try {
    await stakingContract.call("claimRewards");
    alert("Rewards claimed!");
    await loadDashboard();
  } catch (error) {
    console.error("Claim failed:", error);
    alert("Claim failed.");
  }
}

// Start course
function startCourse() {
  window.location.href = "course.html";
}

// Handle token launch
document.getElementById("launch-form").addEventListener("submit", async function (e) {
  e.preventDefault();
  const name = document.getElementById("tokenName").value;
  const symbol = document.getElementById("tokenSymbol").value;
  const supply = document.getElementById("tokenSupply").value;

  if (!name || !symbol || !supply || isNaN(supply)) {
    return alert("Please complete all fields with valid data.");
  }

  if (parseFloat(supply) < 10000) {
    return alert("Minimum total supply is 10,000 KLY.");
  }

  try {
    const deployed = await thirdweb.deployer.deployToken({
      name,
      symbol,
      primary_sale_recipient: connectedWallet.address,
      total_supply: supply.toString(),
    });

    const newToken = await thirdweb.getToken(deployed);
    const treasuryAmount = (parseFloat(supply) * 0.05).toString();
    const KLY_TREASURY = KLY_TOKEN_ADDRESS;

    await newToken.transfer(KLY_TREASURY, treasuryAmount);

    alert(`Token deployed at: ${deployed}\n5% sent to KLY Treasury.`);
    console.log("New token deployed:", deployed);
  } catch (error) {
    console.error("Token launch failed:", error);
    alert("Token launch failed.");
  }
});
