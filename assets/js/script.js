<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>KLY Legacy Course</title>
  <link rel="stylesheet" href="assets/css/style.css" />
  <script src="https://cdn.jsdelivr.net/npm/web3@1.8.2/dist/web3.min.js"></script>
</head>
<body>

  <!-- Access Verification -->
  <button id="verifyAccessBtn">Verify KLY Access</button>
  <div id="lockedMessage" style="margin-top: 1rem; color: #ff0066;"></div>

  <!-- Course Content -->
  <div id="courseContent" style="display:none;">
    <h1>KLY Legacy Course</h1>
    <p>Welcome to the course!</p>
    <button id="completeCourseBtn" class="action-btn" style="display:none;">Complete Course</button>
  </div>

  <!-- Mint Section -->
  <div id="mintSection" style="display:none;">
    <button id="mintNFTBtn" class="action-btn">Claim Your NFT Certification</button>
    <p id="mintStatus"></p>
  </div>

<script>
  const CONFIG = {
    KLY_TOKEN: "0x2e4fEB2Fe668c8Ebe84f19e6c8fE8Cf8131B4E52",
    REQUIRED_KLY: "500", // Human-readable, will convert to wei
    NFT_CONTRACT_ADDRESS: "0x90517fa3d053e2dcdbd422848afa76f0da2ca54e"
  };

  let web3;
  let accounts;
  let klyTokenContract;
  let nftContract;

  // Token ABI
  const tokenABI = [
    {
      constant: true,
      inputs: [{ name: "account", type: "address" }],
      name: "balanceOf",
      outputs: [{ name: "", type: "uint256" }],
      type: "function"
    }
  ];

  // NFT ABI (basic mint)
  const nftABI = [
    {
      constant: false,
      inputs: [{ name: "to", type: "address" }],
      name: "mint",
      outputs: [],
      type: "function"
    }
  ];

  window.addEventListener("DOMContentLoaded", async () => {
    if (window.ethereum) {
      web3 = new Web3(window.ethereum);
      await ethereum.request({ method: "eth_requestAccounts" });
      accounts = await web3.eth.getAccounts();

      // Load Contracts
      klyTokenContract = new web3.eth.Contract(tokenABI, CONFIG.KLY_TOKEN);
      nftContract = new web3.eth.Contract(nftABI, CONFIG.NFT_CONTRACT_ADDRESS);

      // Setup event listeners
      setupUIActions();
    } else {
      alert("Please install MetaMask to use this application.");
    }
  });

  function setupUIActions() {
    // Verify Access
    document.getElementById("verifyAccessBtn").addEventListener("click", async () => {
      try {
        const balance = await klyTokenContract.methods.balanceOf(accounts[0]).call();
        const required = web3.utils.toWei(CONFIG.REQUIRED_KLY, "ether");

        console.log("KLY Balance (wei):", balance);
        console.log("Required KLY (wei):", required);

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
        document.getElementById("lockedMessage").textContent =
          "Error verifying access. Please try again.";
      }
    });

    // Complete Course
    document.getElementById("completeCourseBtn").addEventListener("click", () => {
      localStorage.setItem("courseComplete", "true");
      document.getElementById("completeCourseBtn").style.display = "none";
      document.getElementById("mintSection").style.display = "block";
    });

    // Mint NFT
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
</script>
    // Complete Course
    document.getElementById("completeCourseBtn").addEventListener("click", () => {
      localStorage.setItem("courseComplete", "true");
      document.getElementById("completeCourseBtn").style.display = "none";
      document.getElementById("mintSection").style.display = "block";
    });

    // Mint NFT
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

// Token Launch Logic
<script type="module">
  import { ThirdwebSDK } from "https://cdn.skypack.dev/@thirdweb-dev/sdk";
  import { ethers } from "https://cdn.skypack.dev/ethers";

  const chain = "binance"; // or "binance-testnet"
  const treasuryWallet = "0x2e4fEB2Fe668c8Ebe84f19e6c8fE8Cf8131B4E52"; // Your KLY treasury

  let sdk;

  async function connectWallet() {
    if (!window.ethereum) {
      alert("Please install MetaMask.");
      return;
    }
    const provider = new ethers.BrowserProvider(window.ethereum);
    await provider.send("eth_requestAccounts", []);
    const signer = await provider.getSigner();
    sdk = new ThirdwebSDK(signer, chain);
    console.log("Wallet connected");
  }

  window.addEventListener("load", connectWallet);

  document.getElementById("launchBtn").addEventListener("click", async (e) => {
    e.preventDefault();

    const name = document.getElementById("token-name").value;
    const symbol = document.getElementById("token-symbol").value;
    const supply = document.getElementById("initial-supply").value;

    if (!name || !symbol || !supply) {
      alert("Please fill all fields.");
      return;
    }

    try {
      const token = await sdk.deployer.deployToken({
        name,
        symbol,
        primary_sale_recipient: treasuryWallet,
        platform_fee_basis_points: 0,
        platform_fee_recipient: treasuryWallet,
        total_supply: supply.toString(),
      });

      document.getElementById("launch-status").innerText =
        `✅ Token launched at: ${token}`;
    } catch (err) {
      console.error(err);
      document.getElementById("launch-status").innerText =
        "❌ Token launch failed.";
    }
  });
</script>
