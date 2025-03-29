
const thirdweb = new ThirdwebSDK("binance");

const KLY_TOKEN_ADDRESS = "0x2e4fEB2Fe668c8Ebe84f19e6c8fE8Cf8131B4E52";
const STAKING_CONTRACT_ADDRESS = "0x25548Ba29a0071F30E4bDCd98Ea72F79341b07a1";

let connectedWallet;
let tokenContract;
let stakingContract;

// Connect MetaMask wallet
async function connectWallet() {
  try {
    const wallet = await thirdweb.wallet.connect("injected"); // MetaMask
    connectedWallet = wallet;
    document.getElementById("wallet-address").innerText = await wallet.getAddress();

    tokenContract = await thirdweb.getContract(KLY_TOKEN_ADDRESS);
    stakingContract = await thirdweb.getContract(STAKING_CONTRACT_ADDRESS);

    loadDashboard();
  } catch (err) {
    console.error("Wallet connection failed:", err);
  }
}

// Load Token & Staking Info
async function loadDashboard() {
  try {
    const address = await connectedWallet.getAddress();

    const balance = await tokenContract.erc20.balanceOf(address);
    const supply = await tokenContract.erc20.totalSupply();
    const stakeInfo = await stakingContract.call("getStakeInfo", [address]);

    document.getElementById("user-balance").innerText = balance.displayValue;
    document.getElementById("total-supply").innerText = supply.displayValue;
    document.getElementById("stakedBalance").innerText = stakeInfo[0].toString();
    document.getElementById("rewardBalance").innerText = stakeInfo[1].toString();
  } catch (err) {
    console.error("Error loading dashboard:", err);
  }
}

// Stake Tokens
async function stakeTokens() {
  const amount = document.getElementById("stakeAmount").value;
  if (!amount || !stakingContract) return alert("Enter amount and connect wallet");

  try {
    await tokenContract.erc20.setAllowance(STAKING_CONTRACT_ADDRESS, amount);
    await stakingContract.call("stake", [amount]);
    alert("Tokens staked!");
    loadDashboard();
  } catch (err) {
    console.error("Stake failed:", err);
  }
}

// Withdraw Tokens
async function withdrawTokens() {
  try {
    await stakingContract.call("withdraw");
    alert("Tokens withdrawn!");
    loadDashboard();
  } catch (err) {
    console.error("Withdraw failed:", err);
  }
}

// Claim Rewards
async function claimRewards() {
  try {
    await stakingContract.call("claimRewards");
    alert("Rewards claimed!");
    loadDashboard();
  } catch (err) {
    console.error("Claim failed:", err);
  }
}

// Start Course (placeholder)
function startCourse() {
  alert("Course access feature coming soon!");
}

// Launch Token (placeholder)
document.getElementById("launch-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const name = document.getElementById("tokenName").value;
  const symbol = document.getElementById("tokenSymbol").value;
  const supply = document.getElementById("tokenSupply").value;
  alert(`Launching ${name} (${symbol}) with ${supply} supply. Feature coming soon!`);
});
