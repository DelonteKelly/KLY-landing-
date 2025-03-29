// Initialize Thirdweb SDK for Binance Smart Chain
const thirdweb = new ThirdwebSDK("binance");

// Contract addresses
const KLY_TOKEN_ADDRESS = "0x2e4fEB2Fe668c8Ebe84f19e6c8fE8Cf8131B4E52";
const STAKING_CONTRACT_ADDRESS = "0x25548Ba29a0071F30E4bDCd98Ea72F79341b07a1";

let connectedWallet;
let tokenContract;
let stakingContract;

// Connect MetaMask wallet
async function connectWallet() {
  try {
    const wallet = await thirdweb.wallet.connect("injected");
    connectedWallet = wallet;

    const address = await wallet.getAddress();
    document.getElementById("wallet-address").innerText = address;

    tokenContract = await thirdweb.getContract(KLY_TOKEN_ADDRESS);
    stakingContract = await thirdweb.getContract(STAKING_CONTRACT_ADDRESS);

    loadDashboard();
  } catch (err) {
    console.error("Wallet connection failed:", err);
  }
}

// Load dashboard info
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
    console.error("Dashboard loading failed:", err);
  }
}

// Stake tokens
async function stakeTokens() {
  const amount = document.getElementById("stakeAmount").value;
  if (!amount || !stakingContract) return alert("Enter an amount and connect your wallet.");

  try {
    await tokenContract.erc20.setAllowance(STAKING_CONTRACT_ADDRESS, amount);
    await stakingContract.call("stake", [amount]);
    alert("Tokens staked!");
    loadDashboard();
  } catch (err) {
    console.error("Stake failed:", err);
    alert("Stake failed.");
  }
}

// Withdraw tokens
async function withdrawTokens() {
  try {
    await stakingContract.call("withdraw");
    alert("Tokens withdrawn!");
    loadDashboard();
  } catch (err) {
    console.error("Withdraw failed:", err);
    alert("Withdraw failed.");
  }
}

// Claim rewards
async function claimRewards() {
  try {
    await stakingContract.call("claimRewards");
    alert("Rewards claimed!");
    loadDashboard();
  } catch (err) {
    console.error("Claim failed:", err);
    alert("Claim failed.");
  }
}

// Placeholder for course access
function startCourse() {
  alert("Course feature coming soon!");
}

// Wait for DOM before binding event listeners
window.addEventListener("DOMContentLoaded", () => {
  const launchForm = document.getElementById("launch-form");
  if (launchForm) {
    launchForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const name = document.getElementById("tokenName").value;
      const symbol = document.getElementById("tokenSymbol").value;
      const supply = document.getElementById("tokenSupply").value;
      alert(`Launching ${name} (${symbol}) with ${supply} supply. Feature coming soon!`);
    });
  }
});
