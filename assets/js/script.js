const CONFIG = {
  KLY_TOKEN: "0x2e4fEB2Fe668c8Ebe84f19e6c8fE8Cf8131B4E52",
  STAKING_CONTRACT: "0xa8380b1311B9316dbf87D5110E8CC35BcB835056",
  CHAIN_ID: 56 // Binance Smart Chain
};

let web3;
let accounts = [];
let klyTokenContract;
let stakingContract;

// ABI definitions (simplified for common functions)
const tokenABI = [
  { 
    constant: true, 
    inputs: [], 
    name: "totalSupply", 
    outputs: [{ name: "", type: "uint256" }], 
    type: "function" 
  },
  { 
    constant: true, 
    inputs: [{ name: "account", type: "address" }], 
    name: "balanceOf", 
    outputs: [{ name: "", type: "uint256" }], 
    type: "function" 
  },
  { 
    constant: false, 
    inputs: [
      { name: "spender", type: "address" }, 
      { name: "amount", type: "uint256" }
    ], 
    name: "approve", 
    outputs: [{ name: "", type: "bool" }], 
    type: "function" 
  }
];

const stakingABI = [
  { 
    constant: false, 
    inputs: [{ name: "amount", type: "uint256" }], 
    name: "stake", 
    outputs: [], 
    type: "function" 
  },
  { 
    constant: false, 
    inputs: [], 
    name: "claimRewards", 
    outputs: [], 
    type: "function" 
  },
  { 
    constant: false, 
    inputs: [], 
    name: "withdraw", 
    outputs: [], 
    type: "function" 
  }
];

// Initialize when DOM is loaded
window.addEventListener("DOMContentLoaded", () => {
  // DOM elements
  const connectBtn = document.getElementById("connectWallet");
  const walletSpan = document.getElementById("walletAddress");
  const totalSupplyEl = document.getElementById("klyTotalSupply");
  const userBalanceEl = document.getElementById("klyWalletBalance");
  const stakeBtn = document.getElementById("stakeButton");
  const claimBtn = document.getElementById("claimButton");
  const withdrawBtn = document.getElementById("withdrawButton");
  const stakeAmountInput = document.getElementById("stakeAmount");
  const launchBtn = document.getElementById("launchTokenBtn");
  const launchStatus = document.getElementById("launchStatus");

  // Event listeners
  if (connectBtn) connectBtn.addEventListener("click", init);
  if (stakeBtn) stakeBtn.addEventListener("click", stakeTokens);
  if (claimBtn) claimBtn.addEventListener("click", claimRewards);
  if (withdrawBtn) withdrawBtn.addEventListener("click", withdrawTokens);
  if (launchBtn) launchBtn.addEventListener("click", launchToken);

  // Initialize Web3 and connect wallet
  async function init() {
    try {
      if (!window.ethereum) {
        throw new Error("MetaMask is not installed. Please install it to continue.");
      }

      web3 = new Web3(window.ethereum);
      
      // Check if already connected
      accounts = await web3.eth.getAccounts();
      if (accounts.length === 0) {
        accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
      }

      // Verify chain ID
      const chainId = await web3.eth.getChainId();
      if (chainId !== CONFIG.CHAIN_ID) {
        throw new Error(`Please switch to Binance Smart Chain (ChainID: ${CONFIG.CHAIN_ID})`);
      }

      // Initialize contracts
      klyTokenContract = new web3.eth.Contract(tokenABI, CONFIG.KLY_TOKEN);
      stakingContract = new web3.eth.Contract(stakingABI, CONFIG.STAKING_CONTRACT);

      // Update UI
      const shortAddress = `${accounts[0].substring(0, 6)}...${accounts[0].substring(38)}`;
      if (connectBtn) connectBtn.textContent = shortAddress;
      if (walletSpan) walletSpan.textContent = shortAddress;

      await updateStats();
    } catch (error) {
      console.error("Initialization error:", error);
      alert(error.message);
    }
  }

  // Update token statistics
  async function updateStats() {
    try {
      if (!accounts.length) return;

      const [supply, balance] = await Promise.all([
        klyTokenContract.methods.totalSupply().call(),
        klyTokenContract.methods.balanceOf(accounts[0]).call()
      ]);

      if (totalSupplyEl) {
        totalSupplyEl.textContent = web3.utils.fromWei(supply, "ether");
      }
      if (userBalanceEl) {
        userBalanceEl.textContent = web3.utils.fromWei(balance, "ether");
      }
    } catch (error) {
      console.error("Error updating stats:", error);
    }
  }

  // Stake tokens function
  async function stakeTokens() {
    try {
      if (!accounts.length) {
        alert("Please connect your wallet first");
        return;
      }

      const amount = stakeAmountInput.value;
      if (!amount || isNaN(amount) || parseFloat(amount) <= 0) {
        alert("Please enter a valid amount");
        return;
      }

      const amountWei = web3.utils.toWei(amount, "ether");

      // First approve the staking contract to spend tokens
      await klyTokenContract.methods
        .approve(CONFIG.STAKING_CONTRACT, amountWei)
        .send({ from: accounts[0] });

      // Then stake the tokens
      await stakingContract.methods
        .stake(amountWei)
        .send({ from: accounts[0] });

      await updateStats();
      alert("Tokens staked successfully!");
    } catch (error) {
      console.error("Staking error:", error);
      alert("Staking failed: " + error.message);
    }
  }

  // Claim rewards function
  async function claimRewards() {
    try {
      if (!accounts.length) {
        alert("Please connect your wallet first");
        return;
      }

      await stakingContract.methods
        .claimRewards()
        .send({ from: accounts[0] });

      await updateStats();
      alert("Rewards claimed successfully!");
    } catch (error) {
      console.error("Claim error:", error);
      alert("Claim failed: " + error.message);
    }
  }

  // Withdraw tokens function
  async function withdrawTokens() {
    try {
      if (!accounts.length) {
        alert("Please connect your wallet first");
        return;
      }

      await stakingContract.methods
        .withdraw()
        .send({ from: accounts[0] });

      await updateStats();
      alert("Tokens withdrawn successfully!");
    } catch (error) {
      console.error("Withdrawal error:", error);
      alert("Withdrawal failed: " + error.message);
    }
  }

  // Token launch function (simulated)
  async function launchToken() {
    try {
      const name = document.getElementById("tokenName").value.trim();
      const symbol = document.getElementById("tokenSymbol").value.trim();
      const supply = document.getElementById("initialSupply").value.trim();

      if (!name || !symbol || !supply) {
        throw new Error("Please fill out all fields");
      }

      if (isNaN(supply) || parseFloat(supply) <= 0) {
        throw new Error("Please enter a valid supply amount");
      }

      if (launchStatus) {
        launchStatus.textContent = `Launching ${name} (${symbol}) with ${supply} tokens... (simulated)`;
        // Simulate async operation
        setTimeout(() => {
          launchStatus.textContent = `Token ${name} launched successfully!`;
        }, 2000);
      }
    } catch (error) {
      console.error("Launch error:", error);
      if (launchStatus) {
        launchStatus.textContent = error.message;
      }
    }
  }
});
