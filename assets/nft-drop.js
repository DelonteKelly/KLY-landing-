 import { ThirdwebSDK } from "https://cdn.skypack.dev/@thirdweb-dev/sdk";
  import { ethers } from "https://cdn.skypack.dev/ethers";

  let sdk;
  let walletAddress;

  const connectBtn = document.getElementById("connectBtn");
  const mintBtn = document.getElementById("mintBtn");
  const statusText = document.getElementById("statusText");
  const badgeOwned = document.getElementById("badgeOwned");
  const walletDisplay = document.getElementById("walletDisplay");

  // BSC Mainnet configuration
  const BSC_CHAIN_ID = 56;
  const BSC_RPC_URL = "https://bsc-dataseed.binance.org/";
  const CONTRACT_ADDRESS = "0xc1a2E9A475779EfD04247EA473638717E26cd5C5";

  async function connectWallet() {
    console.log("Connect Wallet clicked");

    if (!window.ethereum) {
      alert("MetaMask not found. Please install MetaMask.");
      return;
    }

    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const { chainId } = await provider.getNetwork();
      
      // Check if already on BSC Mainnet
      if (chainId !== BSC_CHAIN_ID) {
        await switchToBSCNetwork();
      }

      await provider.send("eth_requestAccounts", []);
      const signer = provider.getSigner();
      walletAddress = await signer.getAddress();
      
      // Initialize SDK with BSC Mainnet
      sdk = ThirdwebSDK.fromSigner(signer, "binance");
      
      walletDisplay.innerText = `Wallet: ${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`;
      console.log("Wallet connected:", walletAddress);

      await updateNFTStats();
      mintBtn.disabled = false;
    } catch (err) {
      console.error("Wallet connection error:", err);
      statusText.innerText = `Error: ${err.message || err}`;
    }
  }

  async function switchToBSCNetwork() {
    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: `0x${BSC_CHAIN_ID.toString(16)}` }],
      });
    } catch (switchError) {
      // If network not added, add it
      if (switchError.code === 4902) {
        await window.ethereum.request({
          method: "wallet_addEthereumChain",
          params: [{
            chainId: `0x${BSC_CHAIN_ID.toString(16)}`,
            chainName: "Binance Smart Chain Mainnet",
            nativeCurrency: {
              name: "BNB",
              symbol: "bnb",
              decimals: 18
            },
            rpcUrls: [BSC_RPC_URL],
            blockExplorerUrls: ["https://bscscan.com/"]
          }]
        });
      } else {
        throw switchError;
      }
    }
  }

  async function updateNFTStats() {
    try {
      if (!sdk) return;

      const nft = await sdk.getContract(CONTRACT_ADDRESS, "nft-drop");
      const [claimed, total] = await Promise.all([
        nft.totalClaimedSupply(),
        nft.totalSupply()
      ]);

      document.getElementById("mintedCount").innerText = claimed.toString();
      document.getElementById("totalSupply").innerText = total.toString();
      document.getElementById("remainingCount").innerText = total.sub(claimed).toString();
    } catch (err) {
      console.error("Update stats error:", err);
      statusText.innerText = "Failed to load NFT stats";
    }
  }

  async function mintNFT() {
    try {
      mintBtn.disabled = true;
      statusText.innerText = "Minting...";

      if (!sdk) {
        await connectWallet();
      }

      const nft = await sdk.getContract(CONTRACT_ADDRESS, "nft-drop");
      const tx = await nft.claim(1);

      statusText.innerHTML = `✅ Minted! <a href="https://bscscan.com/tx/${tx.receipt.transactionHash}" target="_blank">View TX</a>`;
      badgeOwned.style.display = "block";
      await updateNFTStats();
    } catch (err) {
      console.error("Mint error:", err);
      statusText.innerText = `Mint failed: ${err.message || err}`;
    } finally {
      mintBtn.disabled = false;
    }
  }

  connectBtn.addEventListener("click", connectWallet);
  mintBtn.addEventListener("click", mintNFT);

  // Auto-connect if already connected
  if (window.ethereum?.selectedAddress) {
    connectWallet();
  }
    
