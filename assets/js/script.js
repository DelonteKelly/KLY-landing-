// Initialize Thirdweb SDK for Binance Smart Chain
const thirdweb = new ThirdwebSDK("binance");

// Your contract addresses
const KLY_TOKEN_ADDRESS = "0x2e4fEB2Fe668c8Ebe84f19e6c8fE8Cf8131B4E52";
const STAKING_CONTRACT_ADDRESS = "0x25548Ba29a0071F30E4bDCd98Ea72F79341b07a1";

let connectedWallet;
let tokenContract;
let stakingContract;

// Connect Wallet
async function connectWallet() {
  if (!window.ethereum) {
    alert("MetaMask not detected.");
    return;
  }

  try {
    const wallet = await thirdweb.wallet.connect("injected");
    connectedWallet = wallet;

    const address = await wallet.getAddress();
    document.getElementById("user-balance").innerText = "Loading...";

    tokenContract = await thirdweb.getContract(KLY_TOKEN_ADDRESS, "token");
    stakingContract = await thirdweb.getContract(STAKING_CONTRACT_ADDRESS);

    const total = await tokenContract.totalSupply();
    const balance = await tokenContract.balanceOf(address);

    document.getElementById("total-supply").innerText = total.displayValue;
    document.getElementById("user-balance").innerText = balance.displayValue;

    alert("Wallet connected: " + address);
  } catch (error) {
    alert("Wallet connection failed");
    console.error(error);
  }
}

// Stake Tokens
async function stakeTokens() {
  const amount = document.getElementById("stakeAmount").value;
  if (!amount || isNaN(amount)) {
    alert("Please enter a valid amount to stake.");
    return;
  }

  try {
    await stakingContract.call("stake", [amount]);
    alert("Stake successful!");
  } catch (err) {
    alert("Stake failed.");
    console.error(err);
  }
}

// Withdraw Tokens
async function withdrawTokens() {
  try {
    await stakingContract.call("withdraw");
    alert("Withdraw successful!");
  } catch (err) {
    alert("Withdraw failed.");
    console.error(err);
  }
}

// Claim Rewards
async function claimRewards() {
  try {
    await stakingContract.call("claimRewards");
    alert("Rewards claimed!");
  } catch (err) {
    alert("Claim failed.");
    console.error(err);
  }
}

// Start Course
function startCourse() {
  window.location.href = "/course.html";
}

// Launch Token (Placeholder for now)
function launchToken() {
  const name = document.getElementById("tokenName").value;
  const symbol = document.getElementById("tokenSymbol").value;
  const supply = document.getElementById("tokenSupply").value;
  alert(`Launching Token: ${name} (${symbol}) with supply of ${supply}`);
}
async function launchToken() {
  const name = document.getElementById("tokenName").value;
  const symbol = document.getElementById("tokenSymbol").value;
  const supply = document.getElementById("tokenSupply").value;

  if (!name || !symbol || !supply) {
    alert("Please fill in all fields.");
    return;
  }

  try {
    const deployed = await thirdweb.deployer.deployToken({
      name,
      symbol,
      primary_sale_recipient: await connectedWallet.getAddress(),
      platform_fee_basis_points: 0,
      platform_fee_recipient: "0x0000000000000000000000000000000000000000",
      total_supply: supply,
    });

    console.log("Token deployed at:", deployed.address);
    alert(`Success! Token deployed at: ${deployed.address}`);
  } catch (err) {
    console.error("Token deployment failed:", err);
    alert("Token deployment failed. See console for details.");
  }
}

// Attach event listeners after DOM loads
window.addEventListener("DOMContentLoaded", () => {
  document.getElementById("connectWallet").addEventListener("click", connectWallet);
  document.getElementById("stakeButton").addEventListener("click", stakeTokens);
  document.getElementById("withdrawButton").addEventListener("click", withdrawTokens);
  document.getElementById("claimButton").addEventListener("click", claimRewards);
  document.getElementById("startCourse").addEventListener("click", startCourse);
  document.getElementById("launchToken").addEventListener("click", launchToken);
});
