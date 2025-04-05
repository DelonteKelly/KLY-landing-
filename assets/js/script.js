
import { ThirdwebSDK } from "https://cdn.skypack.dev/@thirdweb-dev/sdk";
import { ethers } from "https://cdn.jsdelivr.net/npm/ethers@6.6.4/+esm";

// === Config ===
const klyTokenAddress = "0x2e4fEB2Fe668c8Ebe84f19e6c8fE8Cf8131B4E52";
const nftContractAddress = "0xDA76d35742190283E340dbeE2038ecc978a56950";

const KLY_ABI = [
  {
    constant: true,
    inputs: [{ name: "account", type: "address" }],
    name: "balanceOf",
    outputs: [{ name: "", type: "uint256" }],
    type: "function"
  },
  {
    constant: true,
    inputs: [],
    name: "totalSupply",
    outputs: [{ name: "", type: "uint256" }],
    type: "function"
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

    // Display connected address
    document.getElementById("accessStatus").innerText = `Wallet connected: ${wallet}`;
    document.getElementById("connectWalletBtn").innerText = "Wallet Connected";

    // Update token dashboard
    updateKLYDashboard();
  } catch (err) {
    console.error("Wallet connection failed:", err);
    alert("Wallet connection failed.");
  }
}

// === Update Token Dashboard ===
async function updateKLYDashboard() {
  try {
    const web3 = new Web3(window.ethereum);
    const kly = new web3.eth.Contract(KLY_ABI, klyTokenAddress);

    const [supply, balance] = await Promise.all([
      kly.methods.totalSupply().call(),
      kly.methods.balanceOf(wallet).call()
    ]);

    const supplyEth = web3.utils.fromWei(supply, "ether");
    const balanceEth = web3.utils.fromWei(balance, "ether");

    document.getElementById("klyTotalSupply").innerText = `${Number(supplyEth).toLocaleString()} KLY`;
    document.getElementById("klyWalletBalance").innerText = `${Number(balanceEth).toLocaleString()} KLY`;
  } catch (err) {
    console.error("Dashboard update failed:", err);
  }
}

// === Verify Course Access (500 KLY) ===
async function verifyAccess() {
  try {
    const web3 = new Web3(window.ethereum);
    const kly = new web3.eth.Contract(KLY_ABI, klyTokenAddress);
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
    document.getElementById("accessStatus").innerText = "Access check error.";
  }
}

// === Mint NFT Certificate ===
async function mintCertificate() {
  try {
    if (!wallet || !sdk) return alert("Connect wallet first");
    document.getElementById("mintStatus").innerText = "Minting...";

    const nft = await sdk.getContract(nftContractAddress);
    await nft.call("mint", [
      wallet,        // recipient
      -276330,       // tickLower
      276330,        // tickUpper
      1,             // amount
      "0x"           // data
    ]);

    document.getElementById("mintStatus").innerText = "NFT Certificate Minted!";
  } catch (err) {
    console.error("Minting failed:", err);
    document.getElementById("mintStatus").innerText = "Minting failed.";
  }
}

// === Event Listeners ===
window.addEventListener("DOMContentLoaded", () => {
  document.getElementById("connectWalletBtn")?.addEventListener("click", connectWallet);
  document.getElementById("verifyAccess")?.addEventListener("click", verifyAccess);
  document.getElementById("mintCertificate")?.addEventListener("click", mintCertificate);

  // Optional: Unlock mint section after course completion
  document.getElementById("completeCourseBtn")?.addEventListener("click", () => {
    document.getElementById("mintSection")?.classList.remove("hidden");
  });
});
