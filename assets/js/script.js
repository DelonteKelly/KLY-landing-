import { ThirdwebSDK } from "@thirdweb-dev/sdk";

const sdk = new ThirdwebSDK("binance");

const KLY_TOKEN_ADDRESS = "0x2e4fEB2Fe668c8Ebe84f19e6c8fE8Cf8131B4E52";
const STAKING_CONTRACT_ADDRESS = "0x25548Ba29a0071F30E4bDCd98Ea72F79341b07a1";

let connectedWallet;
let tokenContract;
let stakingContract;

window.addEventListener("DOMContentLoaded", async () => {
  document.getElementById("connectWallet").onclick = connectWallet;
  document.getElementById("stakeButton").onclick = stakeTokens;
  document.getElementById("withdrawButton").onclick = withdrawTokens;
  document.getElementById("claimButton").onclick = claimRewards;
  document.getElementById("startCourse").onclick = () => window.location.href = "/course.html";
  document.getElementById("launchToken").onclick = launchToken;
});

async function connectWallet() {
  if (!window.ethereum) {
    alert("MetaMask not installed.");
    return;
  }

  try {
    connectedWallet = await sdk.wallet.connect("injected");
    const address = await connectedWallet.getAddress();

    tokenContract = await sdk.getContract(KLY_TOKEN_ADDRESS, "token");
    stakingContract = await sdk.getContract(STAKING_CONTRACT_ADDRESS);

    const total = await tokenContract.totalSupply();
    const balance = await tokenContract.balanceOf(address);

    document.getElementById("total-supply").innerText = total.displayValue;
    document.getElementById("user-balance").innerText = balance.displayValue;

    alert("Wallet connected: " + address);
  } catch (err) {
    alert("Wallet connection failed.");
    console.error(err);
  }
}

async function stakeTokens() {
  const amount = document.getElementById("stakeAmount").value;
  if (!amount || isNaN(amount)) return alert("Enter a valid amount.");

  try {
    await stakingContract.call("stake", [amount]);
    alert("Staked successfully.");
  } catch (err) {
    alert("Stake failed.");
    console.error(err);
  }
}

async function withdrawTokens() {
  try {
    await stakingContract.call("withdraw");
    alert("Withdraw successful.");
  } catch (err) {
    alert("Withdraw failed.");
    console.error(err);
  }
}

async function claimRewards() {
  try {
    await stakingContract.call("claimRewards");
    alert("Rewards claimed.");
  } catch (err) {
    alert("Claim failed.");
    console.error(err);
  }
}

function launchToken() {
  const name = document.getElementById("tokenName").value;
  const symbol = document.getElementById("tokenSymbol").value;
  const supply = document.getElementById("tokenSupply").value;

  if (!name || !symbol || !supply) return alert("Fill in all fields.");

  alert(`Launching Token: ${name} (${symbol}) with supply of ${supply}`);
}
