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

let web3;
let accounts;
let klyTokenContract;
let nftContract;

async function connectWalletAndInit() {
  if (!window.ethereum) {
    alert("Please install MetaMask to use this feature.");
    return;
  }

  web3 = new Web3(window.ethereum);
  await ethereum.request({ method: "eth_requestAccounts" });
  accounts = await web3.eth.getAccounts();

  klyTokenContract = new web3.eth.Contract(tokenABI, CONFIG.KLY_TOKEN);
  nftContract = new web3.eth.Contract(nftABI, CONFIG.NFT_CONTRACT_ADDRESS);

  setupUIActions();
}

function setupUIActions() {
  document.getElementById("verifyAccessBtn").addEventListener("click", async () => {
    try {
      const balance = await klyTokenContract.methods.balanceOf(accounts[0]).call();
      const required = web3.utils.toWei(CONFIG.REQUIRED_KLY, "ether");

      if (BigInt(balance) >= BigInt(required)) {
        document.getElementById("courseContent").style.display = "block";
        document.getElementById("verifyAccessBtn").style.display = "none";
        document.getElementById("lockedMessage").textContent = "";
        document.getElementById("completeCourseBtn").style.display = "inline-block";
      } else {
        const formatted = web3.utils.fromWei(balance);
        document.getElementById("lockedMessage").textContent =
          `Access denied: You need at least ${CONFIG.REQUIRED_KLY} KLY. You have ${formatted} KLY.`;
      }
    } catch (err) {
      console.error("Error verifying access:", err);
      document.getElementById("lockedMessage").textContent = "Error verifying access. Please try again.";
    }
  });

  document.getElementById("completeCourseBtn").addEventListener("click", () => {
    localStorage.setItem("courseComplete", "true");
    document.getElementById("completeCourseBtn").style.display = "none";
    document.getElementById("mintSection").style.display = "block";
  });

  document.getElementById("mintNFTBtn").addEventListener("click", async () => {
    try {
      document.getElementById("mintStatus").textContent = "Minting NFT...";
      await nftContract.methods.mint(accounts[0]).send({ from: accounts[0] });
      document.getElementById("mintStatus").textContent = "✅ NFT Minted!";
    } catch (err) {
      console.error("Mint Failed:", err);
      document.getElementById("mintStatus").textContent =
        "❌ Mint failed: " + (err?.message || "Unknown error");
    }
  });
}

// Auto-load and setup
window.addEventListener("DOMContentLoaded", connectWalletAndInit);
