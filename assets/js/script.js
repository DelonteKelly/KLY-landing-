<script type="module">
import { ThirdwebSDK } from "https://cdn.skypack.dev/@thirdweb-dev/sdk";
import { ethers } from "https://cdn.jsdelivr.net/npm/ethers@6.6.4/+esm";

const CONFIG = {
  KLY_TOKEN: "0x2e4fEB2Fe668c8Ebe84f19e6c8fE8Cf8131B4E52",
  NFT_CONTRACT: "0xDA76d35742190283E340dbeE2038ecc978a56950",
  CHAIN_ID: 56
};

const KLY_ABI = [
  {
    "constant": true,
    "inputs": [{ "name": "account", "type": "address" }],
    "name": "balanceOf",
    "outputs": [{ "name": "", "type": "uint256" }],
    "type": "function"
  },
  {
    "constant": true,
    "inputs": [],
    "name": "totalSupply",
    "outputs": [{ "name": "", "type": "uint256" }],
    "type": "function"
  }
];

let provider, signer, sdk, wallet;

// === Connect Wallet ===
async function connectWallet() {
  try {
    if (!window.ethereum) throw new Error("MetaMask not found");
    
    provider = new ethers.BrowserProvider(window.ethereum);
    await provider.send("eth_requestAccounts", []);
    signer = await provider.getSigner();
    wallet = await signer.getAddress();

    const shortWallet = `${wallet.slice(0, 6)}...${wallet.slice(-4)}`;
    document.getElementById("walletConnection").innerText = "Wallet Connected";
    document.getElementById("walletConnection").style.color = "lime";
    document.getElementById("walletAddress").innerText = shortWallet;

    loadKLYTokenStats();
  } catch (err) {
    console.error("Wallet Connect Error:", err);
    document.getElementById("walletConnection").innerText = "Connection Failed";
    document.getElementById("walletConnection").style.color = "red";
  }
}


// === Update Dashboard ===
async function updateKLYDashboard() {
  try {
    const web3 = new Web3(window.ethereum);
    const kly = new web3.eth.Contract(KLY_ABI, CONFIG.KLY_TOKEN);

    const [supply, balance] = await Promise.all([
      kly.methods.totalSupply().call(),
      kly.methods.balanceOf(wallet).call()
    ]);

    const supplyEth = web3.utils.fromWei(supply, "ether");
    const balanceEth = web3.utils.fromWei(balance, "ether");

    document.getElementById("klyTotalSupply").innerText = `${Number(supplyEth).toLocaleString()} KLY`;
    document.getElementById("klyWalletBalance").innerText = `${Number(balanceEth).toLocaleString()} KLY`;
  } catch (err) {
    console.error("Update Stats Error:", err);
  }
}
// === Bind Events ===
window.addEventListener("DOMContentLoaded", () => {
  document.getElementById("connectWallet")?.addEventListener("click", connectWallet);
</script>
