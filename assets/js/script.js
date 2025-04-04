// script.js

const CONFIG = {
  KLY_TOKEN: "0x2e4fEB2Fe668c8Ebe84f19e6c8fE8Cf8131B4E52",
  REQUIRED_KLY: "500",
  NFT_CONTRACT_ADDRESS: "0x90517fa3d053e2dcdbd422848afa76f0da2ca54e"
};

const tokenABI = [
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
    name: "decimals",
    outputs: [{ name: "", type: "uint8" }],
    type: "function"
  }
];

const nftABI = [
  {
    constant: false,
    inputs: [{ name: "to", type: "address" }],
    name: "mint",
    outputs: [],
    type: "function"
  }
];

let web3, accounts, wallet, klyTokenContract, nftContract;

async function connectWallet() {
  if (!window.ethereum) return alert("MetaMask is not installed.");
  web3 = new Web3(window.ethereum);
  await ethereum.request({ method: "eth_requestAccounts" });
  accounts = await web3.eth.getAccounts();
  wallet = accounts[0];

  document.getElementById("connectWallet").textContent = wallet.slice(0, 6) + "..." + wallet.slice(-4);
  document.getElementById("walletAddress").textContent = "Connected";

  klyTokenContract = new web3.eth.Contract(tokenABI, CONFIG.KLY_TOKEN);
  nftContract = new web3.eth.Contract(nftABI, CONFIG.NFT_CONTRACT_ADDRESS);

  loadTokenStats();
  setupCourseActions();
}

async function loadTokenStats() {
  const decimals = await klyTokenContract.methods.decimals().call();
  const supply = await klyTokenContract.methods.totalSupply().call();
  const balance = await klyTokenContract.methods.balanceOf(wallet).call();

  document.getElementById("klyTotalSupply").textContent = (supply / 10 ** decimals).toLocaleString() + " KLY";
  document.getElementById("klyWalletBalance").textContent = (balance / 10 ** decimals).toLocaleString() + " KLY";
}

function setupCourseActions() {
  const verifyBtn = document.getElementById("verifyAccessBtn");
  if (verifyBtn) {
    verifyBtn.addEventListener("click", async () => {
      try {
        const balance = await klyTokenContract.methods.balanceOf(wallet).call();
        const required = web3.utils.toWei(CONFIG.REQUIRED_KLY, "ether");

        if (BigInt(balance) >= BigInt(required)) {
          document.getElementById("courseContent").style.display = "block";
          verifyBtn.style.display = "none";
          document.getElementById("lockedMessage").textContent = "";
          document.getElementById("completeCourseBtn").style.display = "inline-block";
        } else {
          const formatted = web3.utils.fromWei(balance);
          document.getElementById("lockedMessage").textContent = `Access denied. You need ${CONFIG.REQUIRED_KLY} KLY. You have ${formatted} KLY.`;
        }
      } catch (err) {
        console.error("Verification failed:", err);
        document.getElementById("lockedMessage").textContent = "Verification error. Try again.";
      }
    });

    document.getElementById("completeCourseBtn").addEventListener("click", () => {
      localStorage.setItem("courseComplete", "true");
      document.getElementById("mintSection").style.display = "block";
      document.getElementById("completeCourseBtn").style.display = "none";
    });

    document.getElementById("mintCertificate").addEventListener("click", async () => {
      try {
        document.getElementById("mintStatus").textContent = "Minting...";
        await nftContract.methods.mint(wallet).send({ from: wallet });
        document.getElementById("mintStatus").textContent = "✅ NFT Minted!";
      } catch (err) {
        console.error("Mint failed:", err);
        document.getElementById("mintStatus").textContent = "❌ Mint failed: " + (err?.message || "Unknown error");
      }
    });
  }
}

// Auto-init if already connected
window.addEventListener("load", async () => {
  if (window.ethereum) {
    const connectedAccounts = await ethereum.request({ method: "eth_accounts" });
    if (connectedAccounts.length > 0) {
      connectWallet();
    }
  }

  const connectBtn = document.getElementById("connectWallet");
  if (connectBtn) connectBtn.addEventListener("click", connectWallet);
});
