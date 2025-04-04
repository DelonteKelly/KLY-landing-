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
    REQUIRED_KLY: "500",
    NFT_CONTRACT_ADDRESS: "0x90517fa3d053e2dcdbd422848afa76f0da2ca54e"
  };

  let web3;
  let accounts;
  let klyTokenContract;
  let nftContract;

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

  window.addEventListener("DOMContentLoaded", async () => {
    if (window.ethereum) {
      web3 = new Web3(window.ethereum);
      await ethereum.request({ method: "eth_requestAccounts" });
      accounts = await web3.eth.getAccounts();

      klyTokenContract = new web3.eth.Contract(tokenABI, CONFIG.KLY_TOKEN);
      nftContract = new web3.eth.Contract(nftABI, CONFIG.NFT_CONTRACT_ADDRESS);

      setupUIActions();
    } else {
      alert("Please install MetaMask to use this application.");
    }
  });

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
        document.getElementById("lockedMessage").textContent =
          "Error verifying access. Please try again.";
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
</script>
<script src="https://cdn.jsdelivr.net/npm/web3@1.8.2/dist/web3.min.js"></script>
<script>
  const klyTokenAddress = "0x2e4fEB2Fe668c8Ebe84f19e6c8fE8Cf8131B4E52";
  const tokenABI = [
    {
      "constant": true,
      "inputs": [],
      "name": "totalSupply",
      "outputs": [{ "name": "", "type": "uint256" }],
      "type": "function"
    },
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
      "name": "decimals",
      "outputs": [{ "name": "", "type": "uint8" }],
      "type": "function"
    }
  ];

  async function loadTokenStats() {
    if (window.ethereum) {
      const web3 = new Web3(window.ethereum);
      await window.ethereum.request({ method: 'eth_requestAccounts' });
      const accounts = await web3.eth.getAccounts();
      const token = new web3.eth.Contract(tokenABI, klyTokenAddress);

      const decimals = await token.methods.decimals().call();
      const supply = await token.methods.totalSupply().call();
      const balance = await token.methods.balanceOf(accounts[0]).call();

      const formattedSupply = (supply / 10 ** decimals).toLocaleString();
      const formattedBalance = (balance / 10 ** decimals).toLocaleString();

      document.getElementById("klyTotalSupply").textContent = formattedSupply + " KLY";
      document.getElementById("klyWalletBalance").textContent = formattedBalance + " KLY";
    }
  }

  window.addEventListener("load", loadTokenStats);
</script>
