const connectBtn = document.getElementById("connectWallet");
const walletStatus = document.getElementById("walletStatus");
const walletAddress = document.getElementById("walletAddress");
const tokenBalance = document.getElementById("tokenBalance");

const CONFIG = {
  KLY_TOKEN: "0x2e4fEB2Fe668c8Ebe84f19e6c8fE8Cf8131B4E52"
};

const tokenABI = [
  {
    constant: true,
    inputs: [{ name: "account", type: "address" }],
    name: "balanceOf",
    outputs: [{ name: "", type: "uint256" }],
    type: "function"
  }
];

let web3;
let account;

connectBtn.onclick = async () => {
  if (typeof window.ethereum === "undefined") {
    alert("MetaMask not detected. Please install MetaMask.");
    return;
  }

  web3 = new Web3(window.ethereum);
  try {
    const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
    account = accounts[0];
    walletStatus.textContent = "Connected";
    walletAddress.innerHTML = `Wallet: <b>${account}</b>`;
    await loadTokenBalance();
  } catch (error) {
    walletStatus.textContent = "Connection failed";
    console.error(error);
  }
};

async function loadTokenBalance() {
  const tokenContract = new web3.eth.Contract(tokenABI, CONFIG.KLY_TOKEN);
  const balance = await tokenContract.methods.balanceOf(account).call();
  const readable = web3.utils.fromWei(balance);
  tokenBalance.innerHTML = `KLY Balance: <b>${readable} KLY</b>`;
}
