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
    provider = new ethers.BrowserProvider(window.ethereum);
    await provider.send("eth_requestAccounts", []);
    signer = await provider.getSigner();
    wallet = await signer.getAddress();
    sdk = ThirdwebSDK.fromSigner(signer, "binance");

    document.getElementById("walletAddress")?.innerText = `Connected: ${wallet}`;
    document.getElementById("connectWallet").innerText = "Wallet Connected";

    updateKLYDashboard();
  } catch (err) {
    console.error("Wallet connection failed:", err);
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

// === Verify Course Access (>= 500 KLY) ===
async function verifyAccess() {
  try {
    const web3 = new Web3(window.ethereum);
    const kly = new web3.eth.Contract(KLY_ABI, CONFIG.KLY_TOKEN);
    const balance = await kly.methods.balanceOf(wallet).call();
    const balanceEth = web3.utils.fromWei(balance, "ether");

    if (parseFloat(balanceEth) >= 500) {
      document.getElementById("accessStatus").innerText = "Access granted.";
      document.getElementById("courseContent")?.classList.remove("hidden");
    } else {
      document.getElementById("accessStatus").innerText = "You need at least 500 KLY to access this course.";
    }
  } catch (err) {
    console.error("Access check failed:", err);
  }
}

// === Mint NFT Certificate ===
async function mintCertificate() {
  try {
    const nft = await sdk.getContract(CONFIG.NFT_CONTRACT);
    await nft.call("mint", [
      wallet,
      -276330,
      276330,
      1,
      "0x"
    ]);
    document.getElementById("mintStatus").innerText = "NFT Certificate Minted!";
  } catch (err) {
    console.error("Minting failed:", err);
    document.getElementById("mintStatus").innerText = "Minting failed.";
  }
}

// === Bind Events ===
window.addEventListener("DOMContentLoaded", () => {
  document.getElementById("connectWallet")?.addEventListener("click", connectWallet);
  document.getElementById("verifyAccess")?.addEventListener("click", verifyAccess);
  document.getElementById("mintCertificate")?.addEventListener("click", mintCertificate);
});
</script>
