const sdk = new ThirdwebSDK("binance");
const KLY_TOKEN_ADDRESS = "0x2e4fEB2Fe668c8Ebe84f19e6c8fE8Cf8131B4E52";
const STAKING_CONTRACT_ADDRESS = "0x25548Ba29a0071F30E4bDCd98Ea72F79341b07a1";

let connectedWallet;
let tokenContract;
let stakingContract;

window.onload = async () => {
  document.getElementById("connectWallet").onclick = connectWallet;
  document.getElementById("stakeButton").onclick = stakeTokens;
  document.getElementById("withdrawButton").onclick = withdrawTokens;
  document.getElementById("claimButton").onclick = claimRewards;
  document.getElementById("startCourse").onclick = () => window.location.href = "/course.html";
  document.getElementById("launchToken").onclick = launchToken;
};

async function connectWallet() {
  try {
    const wallet = await sdk.wallet.connect("injected");
    connectedWallet = wallet;
    const address = await wallet.getAddress();

    tokenContract = await sdk.getContract(KLY_TOKEN_ADDRESS, "token");
    stakingContract = await sdk.getContract(STAKING_CONTRACT_ADDRESS);

    const total = await tokenContract.totalSupply();
    const balance = await tokenContract.balanceOf(address);

    document.getElementById("total-supply").innerText = total.displayValue;
    document.getElementById("user-balance").innerText = balance.displayValue;

    alert("Wallet connected: " + address);
  } catch (err) {
    console.error(err);
    alert("Wallet connection failed");
  }
}

async function stakeTokens() {
  const amount = document.getElementById("stakeAmount").value;
  if (!amount || isNaN(amount)) return alert("Enter a valid amount.");

  try {
    await stakingContract.call("stake", [amount]);
    alert("Staked successfully.");
  } catch (err) {
    console.error(err);
    alert("Stake failed.");
  }
}

async function withdrawTokens() {
  try {
    await stakingContract.call("withdraw");
    alert("Withdraw successful.");
  } catch (err) {
    console.error(err);
    alert("Withdraw failed.");
  }
}

async function claimRewards() {
  try {
    await stakingContract.call("claimRewards");
    alert("Rewards claimed.");
  } catch (err) {
    console.error(err);
    alert("Claim failed.");
  }
}

async function launchToken() {
  const name = document.getElementById("tokenName").value;
  const symbol = document.getElementById("tokenSymbol").value;
  const supply = document.getElementById("tokenSupply").value;

  if (!name || !symbol || !supply) return alert("Fill in all fields.");

  try {
    alert(`Token Created:\nName: ${name}\nSymbol: ${symbol}\nSupply: ${supply}`);
    // You can implement deploy logic here later
  } catch (err) {
    console.error(err);
    alert("Token launch failed.");
  }
}
