<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>KLY Token Platform</title>
  
  <!-- Web3.js for interacting with Ethereum-based contracts -->
  <script src="https://cdn.jsdelivr.net/npm/web3@1.8.2/dist/web3.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/ethers@5.7.2/dist/ethers.umd.min.js"></script>
</head>
<body>
  <!-- Wallet Connect & Course Access UI -->
  <button id="verifyAccessBtn">Verify KLY Access</button>
  <div id="lockedMessage" style="margin-top: 1rem; color: #ff0066;"></div>

  <!-- Course Content Section -->
  <div id="courseContent" style="display:none;">
    <h2>Course Content</h2>
    <p>Welcome to the course!</p>
    <button id="completeCourseBtn" class="action-btn">Complete Course</button>
  </div>

  <!-- Mint NFT Section -->
  <div id="mintSection" style="display:none;">
    <button id="mintNFTBtn" class="action-btn">Claim Your NFT Certification</button>
    <p id="mintStatus"></p>
  </div>

  <script>
    let web3;
    let accounts;
    let klyTokenContract;

    // Define configuration variables
    const CONFIG = {
      KLY_TOKEN: "0x2e4fEB2Fe668c8Ebe84f19e6c8fE8Cf8131B4E52", // KLY token contract address
      REQUIRED_KLY: "500", // Minimum KLY required to access the course
      NFT_CONTRACT_ADDRESS: "0x90517fa3d053e2dcdbd422848afa76f0da2ca54e", // NFT contract address for minting
    };

    // Initialize Web3 and contract
    window.addEventListener("DOMContentLoaded", async () => {
      if (!window.ethereum) {
        alert("MetaMask is not installed.");
        return;
      }

      web3 = new Web3(window.ethereum);
      accounts = await window.ethereum.request({ method: "eth_requestAccounts" });

      // KLY Token ABI for balance check
      const tokenABI = [
        {
          constant: true,
          inputs: [{ name: "account", type: "address" }],
          name: "balanceOf",
          outputs: [{ name: "", type: "uint256" }],
          type: "function"
        }
      ];

      // Initialize KLY Token Contract
      klyTokenContract = new web3.eth.Contract(tokenABI, CONFIG.KLY_TOKEN);

      // Verify Access Button Logic
      document.getElementById("verifyAccessBtn").addEventListener("click", async () => {
        const account = accounts[0];
        const balance = await klyTokenContract.methods.balanceOf(account).call();

        const balanceKLY = web3.utils.fromWei(balance);
        const required = web3.utils.toWei(CONFIG.REQUIRED_KLY, "ether");

        if (parseFloat(balance) >= parseFloat(required)) {
          document.getElementById("courseContent").style.display = "block";
          document.getElementById("lockedMessage").textContent = "";
          document.getElementById("verifyAccessBtn").style.display = "none";
        } else {
          document.getElementById("lockedMessage").textContent =
            `Access denied: You need at least ${CONFIG.REQUIRED_KLY} KLY. You have ${balanceKLY} KLY.`;
        }
      });

      // Complete Course Button Logic
      const completeCourseBtn = document.getElementById("completeCourseBtn");
      const mintSection = document.getElementById("mintSection");

      if (localStorage.getItem("courseComplete") === "true") {
        completeCourseBtn.style.display = "none";
        mintSection.style.display = "block";
      }

      completeCourseBtn?.addEventListener("click", () => {
        localStorage.setItem("courseComplete", "true");
        completeCourseBtn.style.display = "none";
        mintSection.style.display = "block";
      });

      // Mint NFT Logic
      const mintNFTBtn = document.getElementById("mintNFTBtn");
      const mintStatus = document.getElementById("mintStatus");

      mintNFTBtn?.addEventListener("click", async () => {
        mintStatus.textContent = "Minting NFT...";
        try {
          const wallet = await web3.currentProvider;
          const signer = web3.eth.accounts.privateKeyToAccount(wallet);

          // Using ethers.js to interact with the contract
          const nftContract = new ethers.Contract(CONFIG.NFT_CONTRACT_ADDRESS, [
            "function claim(uint256 quantity) public", // Claim function in NFT contract
          ], signer);

          const tx = await nftContract.claim(1); // Mint 1 NFT
          await tx.wait();

          mintStatus.textContent = "✅ NFT Minted!";
        } catch (err) {
          console.error("Mint Failed:", err);
          mintStatus.textContent = "❌ Mint failed: " + (err?.message || "Unknown error");
        }
      });
    });
  </script>
</body>
</html>
