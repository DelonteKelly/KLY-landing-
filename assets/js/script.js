import { ThirdwebSDK } from "https://cdn.skypack.dev/@thirdweb-dev/sdk";

const thirdweb = new ThirdwebSDK("binance");

const KLY_TOKEN_ADDRESS = "0x2e4fEB2Fe668c8Ebe84f19e6c8fE8Cf8131B4E52";
const STAKING_CONTRACT_ADDRESS = "0x25548Ba29a0071F30E4bDCd98Ea72F79341b07a1";

let connectedWallet;
let tokenContract;
let stakingContract;

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

async function withdrawTokens() {
  try {
    await stakingContract.call("withdraw");
    alert("Withdraw successful!");
  } catch (err) {
    alert("Withdraw failed.");
    console.error(err);
  }
}

async function claimRewards() {
  try {
    await stakingContract.call("claimRewards");
    alert("Rewards claimed!");
  } catch (err) {
    alert("Claim failed.");
    console.error(err);
  }
}

function startCourse() {
  window.location.href = "/course.html";
}

function launchToken() {
  const name = document.getElementById("tokenName").value;
  const symbol = document.getElementById("tokenSymbol").value;
  const supply = document.getElementById("tokenSupply").value;
  alert(`Launching Token: ${name} (${symbol}) with supply of ${supply}`);
}

// Attach event listeners
window.onload = () => {
  document.getElementById("connectWallet").onclick = connectWallet;
  document.getElementById("stakeButton").onclick = stakeTokens;
  document.getElementById("withdrawButton").onclick = withdrawTokens;
  document.getElementById("claimButton").onclick = claimRewards;
  document.getElementById("startCourse").onclick = startCourse;
  document.getElementById("launchToken").onclick = launchToken;
};
