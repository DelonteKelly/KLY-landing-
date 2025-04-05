
// === CONFIGURATION ===
const CONFIG = {
  KLY_TOKEN: "0x2e4fEB2Fe668c8Ebe84f19e6c8fE8Cf8131B4E52",
  NFT_CONTRACT_ADDRESS: "0xDA76d35742190283E340dbeE2038ecc978a56950",
  CHAIN_ID: 56, // BNB Smart Chain
  REQUIRED_KLY: 500
};

const KLY_ABI = [
  { constant: true, inputs: [], name: "totalSupply", outputs: [{ name: "", type: "uint256" }], type: "function" },
  { constant: true, inputs: [{ name: "account", type: "address" }], name: "balanceOf", outputs: [{ name: "", type: "uint256" }], type: "function" }
];

let provider, signer, wallet;

// === Connect Wallet & Load Data ===
async function connectWallet() {
  if (!window.ethereum) return alert("MetaMask is required.");
  try {
    provider = new ethers.BrowserProvider(window.ethereum);
    await provider.send("eth_requestAccounts", []);
    signer = await provider.getSigner();
    wallet = await signer.getAddress();

    document.getElementById("connectWallet").innerText = "Wallet Connected";
    document.getElementById("walletAddress").innerText = wallet;

    loadTokenStats();
  } catch (err) {
    console.error("Wallet connection error:", err);
  }
}

// === Load Token Stats ===
async function loadTokenStats() {
  try {
    const contract = new ethers.Contract(CONFIG.KLY_TOKEN, KLY_ABI, signer);
    const [supplyRaw, balanceRaw] = await Promise.all([
      contract.totalSupply(),
      contract.balanceOf(wallet)
    ]);
    const decimals = 18;
    const total = ethers.formatUnits(supplyRaw, decimals);
    const balance = ethers.formatUnits(balanceRaw, decimals);

    document.getElementById("totalKLY").innerText = parseFloat(total).toLocaleString();
    document.getElementById("userKLY").innerText = parseFloat(balance).toFixed(2);
  } catch (err) {
    console.error("Token stat error:", err);
  }
}

// === Verify Access (500 KLY minimum) ===
async function verifyAccess() {
  try {
    const contract = new ethers.Contract(CONFIG.KLY_TOKEN, KLY_ABI, signer);
    const balance = await contract.balanceOf(wallet);
    const formatted = parseFloat(ethers.formatUnits(balance, 18));

    if (formatted >= CONFIG.REQUIRED_KLY) {
      document.getElementById("accessStatus").innerText = `Access granted: ${formatted} KLY`;
      document.getElementById("completeCourseBtn").style.display = "block";
    } else {
      document.getElementById("accessStatus").innerText = `Access denied: You hold ${formatted} KLY`;
    }
  } catch (err) {
    console.error("Access check failed:", err);
  }
}

// === NFT Minting ===
document.getElementById("mintCertificate").onclick = async () => {
  try {
    if (!wallet) return alert("Connect wallet first.");
    document.getElementById("mintStatus").innerText = "Minting in progress...";

    const sdk = new thirdweb.ThirdwebSDK("binance", { signer });
    const nftContract = await sdk.getContract(CONFIG.NFT_CONTRACT_ADDRESS);

    await nftContract.call("mint", [
      wallet,
      -60000,
      60000,
      100000,
      "0x"
    ]);

    document.getElementById("mintStatus").innerText = "NFT Certificate minted successfully!";
  } catch (err) {
    console.error("Mint error:", err);
    document.getElementById("mintStatus").innerText = "Mint failed. See console.";
  }
};

// === Event Bindings ===
window.addEventListener("DOMContentLoaded", () => {
  document.getElementById("connectWallet")?.addEventListener("click", connectWallet);
  document.getElementById("verifyAccess")?.addEventListener("click", verifyAccess);
});
