<script type="module">
  import { ethers } from "https://cdn.jsdelivr.net/npm/ethers@5.7.2/dist/ethers.esm.min.js";

  // Contract addresses
  const KLY_TOKEN = "0x2e4fEB2Fe668c8Ebe84f19e6c8fE8Cf8131B4E52";
  const STAKING_CONTRACT = "0x25548Ba29a0071F30E4bDCd98Ea72F79341b07a1";
  const DAO_CONTRACT = "0x796Bce7F95662774243177D1F546eBA0B3465579";
  const BSC_API_KEY = "3GA78IZXNIRMUYZ7KF2HRF9N9YZJJY95K2";

  // Contract ABIs
  const ERC20_ABI = [
    { name: "balanceOf", type: "function", stateMutability: "view", inputs: [{ name: "account", type: "address" }], outputs: [{ type: "uint256" }] },
    { name: "decimals", type: "function", stateMutability: "view", inputs: [], outputs: [{ type: "uint8" }] },
    { name: "totalSupply", type: "function", stateMutability: "view", inputs: [], outputs: [{ type: "uint256" }] },
    { name: "approve", type: "function", stateMutability: "nonpayable", inputs: [{ name: "spender", type: "address" }, { name: "amount", type: "uint256" }], outputs: [{ type: "bool" }] }
  ];

  const STAKING_ABI = [
    { name: "getStakeInfo", type: "function", stateMutability: "view", inputs: [{ name: "", type: "address" }], outputs: [{ name: "staked", type: "uint256" }, { name: "timestamp", type: "uint256" }] },
    { name: "getRewardInfo", type: "function", stateMutability: "view", inputs: [{ name: "", type: "address" }], outputs: [{ type: "uint256" }] },
    { name: "getTotalStakedSupply", type: "function", stateMutability: "view", inputs: [], outputs: [{ type: "uint256" }] },
    { name: "stake", type: "function", stateMutability: "nonpayable", inputs: [{ name: "amount", type: "uint256" }], outputs: [] },
    { name: "withdraw", type: "function", stateMutability: "nonpayable", inputs: [{ name: "amount", type: "uint256" }], outputs: [] },
    { name: "claim", type: "function", stateMutability: "nonpayable", inputs: [], outputs: [] }
  ];

  const DAO_ABI = [
    { name: "getAllProposals", type: "function", stateMutability: "view", inputs: [], outputs: [{ type: "tuple[]", components: [
      { name: "proposalId", type: "uint256" },
      { name: "description", type: "string" },
      { name: "votesFor", type: "uint256" },
      { name: "votesAgainst", type: "uint256" },
      { name: "votesAbstain", type: "uint256" },
      { name: "executed", type: "bool" }
    ] }] },
    { name: "propose", type: "function", stateMutability: "nonpayable", inputs: [{ name: "description", type: "string" }], outputs: [] },
    { name: "castVote", type: "function", stateMutability: "nonpayable", inputs: [{ name: "proposalId", type: "uint256" }, { name: "vote", type: "uint8" }], outputs: [] },
    { name: "execute", type: "function", stateMutability: "nonpayable", inputs: [{ name: "proposalId", type: "uint256" }], outputs: [] }
  ];

  let provider, signer, wallet;

  // Wallet connection function with BSC network check
  async function connectWallet() {
    if (!window.ethereum) {
      alert("MetaMask not detected. Please install MetaMask from https://metamask.io/");
      return;
    }

    try {
      // Request account access
      provider = new ethers.providers.Web3Provider(window.ethereum);
      await provider.send("eth_requestAccounts", []);
      signer = provider.getSigner();
      wallet = await signer.getAddress();

      // Check if connected to BSC Mainnet (chainId 56)
      const network = await provider.getNetwork();
      if (network.chainId !== 56) {
        try {
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: '0x38' }], // 56 in hex
          });
        } catch (switchError) {
          // If network not added, prompt to add it
          if (switchError.code === 4902) {
            await window.ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [{
                chainId: '0x38',
                chainName: 'Binance Smart Chain',
                nativeCurrency: {
                  name: 'BNB',
                  symbol: 'bnb',
                  decimals: 18
                },
                rpcUrls: ['https://bsc-dataseed.binance.org/'],
                blockExplorerUrls: ['https://bscscan.com']
              }]
            });
          } else {
            throw switchError;
          }
        }
      }

      // Update UI
      document.getElementById("walletAddress").textContent = 
        `${wallet.slice(0, 6)}...${wallet.slice(-4)}`;
      document.getElementById("walletAddress").style.display = "block";
      document.getElementById("accessStatus").textContent = "Wallet: Connected";
      document.getElementById("connectWallet").textContent = "Connected";
      document.getElementById("dashboardStats").style.display = "block";
      document.getElementById("refreshData").style.display = "inline-block";

      // Show welcome popup
      document.getElementById("welcomePopup").style.display = "flex";

      // Listen for account changes
      window.ethereum.on('accountsChanged', (accounts) => {
        if (accounts.length === 0) {
          // Wallet disconnected
          disconnectWallet();
        } else {
          // Account changed
          wallet = accounts[0];
          updateUI();
        }
      });

      // Listen for chain changes
      window.ethereum.on('chainChanged', () => {
        window.location.reload();
      });

      // Load initial data
      await updateDashboardStats();
      await fetchKLYHolderCount();
      await fetchLPData();

    } catch (err) {
      console.error("Wallet connection error:", err);
      alert(`Wallet connection failed: ${err.message}`);
      if (err.code === 4001) {
        alert("Please connect your wallet to continue");
      }
    }
  }

  function closePopup() {
    document.getElementById("welcomePopup").style.display = "none";
  }

  function disconnectWallet() {
    // Reset UI
    document.getElementById("walletAddress").style.display = "none";
    document.getElementById("accessStatus").textContent = "Wallet: Not Connected";
    document.getElementById("connectWallet").textContent = "Connect Wallet";
    document.getElementById("dashboardStats").style.display = "none";
    document.getElementById("refreshData").style.display = "none";
    
    // Reset wallet data
    document.getElementById("userBalance").textContent = "-";
    document.getElementById("totalSupply").textContent = "-";
    document.getElementById("totalSupplyStat").textContent = "-";
    document.getElementById("stakedAmountStat").textContent = "-";
    document.getElementById("holdersStat").textContent = "-";
    
    wallet = null;
    signer = null;
    provider = null;
  }

  // Token balance functions
  async function getKLYBalance() {
    const kly = new ethers.Contract(KLY_TOKEN, ERC20_ABI, provider);
    const dec = await kly.decimals();
    const bal = await kly.balanceOf(wallet);
    return parseFloat(ethers.utils.formatUnits(bal, dec));
  }

  async function getKLYTotalSupply() {
    const kly = new ethers.Contract(KLY_TOKEN, ERC20_ABI, provider);
    const dec = await kly.decimals();
    const supply = await kly.totalSupply();
    return parseFloat(ethers.utils.formatUnits(supply, dec));
  }

  async function getStakedBalance() {
    const staking = new ethers.Contract(STAKING_CONTRACT, STAKING_ABI, provider);
    const info = await staking.getStakeInfo(wallet);
    return parseFloat(ethers.utils.formatUnits(info.staked, 18)); // Assuming 18 decimals
  }

  async function getTotalStaked() {
    const staking = new ethers.Contract(STAKING_CONTRACT, STAKING_ABI, provider);
    const total = await staking.getTotalStakedSupply();
    return parseFloat(ethers.utils.formatUnits(total, 18));
  }

  // Update dashboard stats
  async function updateDashboardStats() {
    try {
      const [bal, supply, staked, totalStaked] = await Promise.all([
        getKLYBalance(),
        getKLYTotalSupply(),
        getStakedBalance(),
        getTotalStaked()
      ]);
      
      document.getElementById("userBalance").textContent = bal.toFixed(2) + " KLY";
      document.getElementById("totalSupply").textContent = supply.toLocaleString();
      document.getElementById("totalSupplyStat").textContent = supply.toLocaleString();
      document.getElementById("stakedAmountStat").textContent = totalStaked.toLocaleString();
      
    } catch (err) {
      console.error("Failed to update dashboard:", err);
      alert("Failed to load token data. Please try again.");
    }
  }

  // Fetch token holder count from BSCScan
  async function fetchKLYHolderCount() {
    try {
      const res = await fetch(`https://api.bscscan.com/api?module=token&action=tokeninfo&contractaddress=${KLY_TOKEN}&apikey=${BSC_API_KEY}`);
      const data = await res.json();
      const holders = data.result?.[0]?.holders ?? "N/A";
      document.getElementById("holdersStat").textContent = holders.toLocaleString();
    } catch (e) {
      console.error("Holder count error:", e);
      document.getElementById("holdersStat").textContent = "Error";
    }
  }

  // Fetch LP data (mock - replace with actual implementation)
  async function fetchLPData() {
    try {
      // This is a mock implementation - replace with actual LP data fetching
      const mockData = [
        { wallet: "0x3F...1A4b", balance: "125,421.42", percentage: "12.5%" },
        { wallet: "0x7C...9E2d", balance: "98,765.00", percentage: "9.8%" },
        { wallet: "0x2A...4F6e", balance: "75,321.11", percentage: "7.5%" },
        { wallet: "0x5B...8C3a", balance: "50,123.45", percentage: "5.0%" }
      ];
      
      const tableBody = document.getElementById("lpTableBody");
      tableBody.innerHTML = "";
      
      mockData.forEach(holder => {
        const row = document.createElement("tr");
        row.innerHTML = `
          <td>${holder.wallet}</td>
          <td>${holder.balance}</td>
          <td>${holder.percentage}</td>
        `;
        tableBody.appendChild(row);
      });
      
    } catch (err) {
      console.error("Failed to fetch LP data:", err);
      document.getElementById("lpTableBody").innerHTML = `<tr><td colspan="3">Error loading data</td></tr>`;
    }
  }

  // Staking functions
  async function stakeKLY(amount) {
    if (!wallet) {
      alert("Please connect your wallet first");
      return;
    }
    
    try {
      const amt = ethers.utils.parseEther(amount.toString());
      const kly = new ethers.Contract(KLY_TOKEN, ERC20_ABI, signer);
      const stake = new ethers.Contract(STAKING_CONTRACT, STAKING_ABI, signer);
      
      // First approve the staking contract to spend tokens
      const approveTx = await kly.approve(STAKING_CONTRACT, amt);
      await approveTx.wait();
      
      // Then stake the tokens
      const stakeTx = await stake.stake(amt);
      await stakeTx.wait();
      
      alert("Successfully staked " + amount + " KLY!");
      await updateDashboardStats();
      
    } catch (err) {
      console.error("Staking error:", err);
      alert("Failed to stake tokens: " + err.message);
    }
  }

  async function withdrawKLY(amount) {
    if (!wallet) {
      alert("Please connect your wallet first");
      return;
    }
    
    try {
      const amt = ethers.utils.parseEther(amount.toString());
      const stake = new ethers.Contract(STAKING_CONTRACT, STAKING_ABI, signer);
      
      const tx = await stake.withdraw(amt);
      await tx.wait();
      
      alert("Successfully withdrawn " + amount + " KLY!");
      await updateDashboardStats();
      
    } catch (err) {
      console.error("Withdrawal error:", err);
      alert("Failed to withdraw tokens: " + err.message);
    }
  }

  async function claimRewards() {
    if (!wallet) {
      alert("Please connect your wallet first");
      return;
    }
    
    try {
      const stake = new ethers.Contract(STAKING_CONTRACT, STAKING_ABI, signer);
      const tx = await stake.claim();
      await tx.wait();
      
      alert("Rewards claimed successfully!");
      await updateDashboardStats();
      
    } catch (err) {
      console.error("Reward claim error:", err);
      alert("Failed to claim rewards: " + err.message);
    }
  }

  // DAO functions
  async function createProposal(description) {
    if (!wallet) {
      alert("Please connect your wallet first");
      return;
    }
    
    try {
      const dao = new ethers.Contract(DAO_CONTRACT, DAO_ABI, signer);
      const tx = await dao.propose(description);
      await tx.wait();
      
      alert("Proposal created successfully!");
      
    } catch (err) {
      console.error("Proposal creation error:", err);
      alert("Failed to create proposal: " + err.message);
    }
  }

  async function voteOnProposal(id, voteType) {
    if (!wallet) {
      alert("Please connect your wallet first");
      return;
    }
    
    try {
      const dao = new ethers.Contract(DAO_CONTRACT, DAO_ABI, signer);
      const tx = await dao.castVote(id, voteType);
      await tx.wait();
      
      alert("Vote submitted successfully!");
      
    } catch (err) {
      console.error("Voting error:", err);
      alert("Failed to submit vote: " + err.message);
    }
  }

  // Initialize event listeners
  window.addEventListener("DOMContentLoaded", () => {
    // Wallet connection
    document.getElementById("connectWallet")?.addEventListener("click", connectWallet);
    
    // Dashboard controls
    document.getElementById("refreshData")?.addEventListener("click", updateDashboardStats);
    
    // Auto-connect if wallet already connected
    if (window.ethereum?.selectedAddress) {
      connectWallet();
    }
  });

  // Make functions available globally
  window.connectWallet = connectWallet;
  window.closePopup = closePopup;
  window.stakeKLY = stakeKLY;
  window.withdrawKLY = withdrawKLY;
  window.claimRewards = claimRewards;
  window.createProposal = createProposal;
  window.voteOnProposal = voteOnProposal;
</script>
