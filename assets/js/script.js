// Contract Addresses
const CONFIG = {
  KLY_TOKEN: "0x2e4fEB2Fe668c8Ebe84f19e6c8fE8Cf8131B4E52",
  STAKING_CONTRACT: "0x25548Ba29a0071F30E4bDCd98Ea72F79341b07a1",
  CHAIN_ID: 56, // Binance Smart Chain
  RPC_URL: "https://bsc-dataseed.binance.org/"
};

// Application State
let web3;
let accounts = [];
let klyTokenContract;
let stakingContract;

// Initialize the application
async function initApp() {
  if (window.ethereum) {
    web3 = new Web3(window.ethereum);
    try {
      // Request account access
      accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      updateWalletStatus();
      
      // Initialize contracts
      await initContracts();
      
      // Load token data
      await updateTokenData();
      
      // Set up event listeners
      setupEventListeners();
      
    } catch (error) {
      showStatus("User denied account access", true);
    }
  } else {
    showStatus("Please install MetaMask!", true);
  }
}

// Initialize smart contracts
async function initContracts() {
  // KLY Token Contract ABI (simplified)
  const tokenABI = [
    {
      "constant": true,
      "inputs": [],
      "name": "totalSupply",
      "outputs": [{"name": "", "type": "uint256"}],
      "type": "function"
    },
    {
      "constant": true,
      "inputs": [{"name": "owner", "type": "address"}],
      "name": "balanceOf",
      "outputs": [{"name": "", "type": "uint256"}],
      "type": "function"
    },
    {
      "constant": false,
      "inputs": [
        {"name": "spender", "type": "address"},
        {"name": "amount", "type": "uint256"}
      ],
      "name": "approve",
      "outputs": [{"name": "", "type": "bool"}],
      "type": "function"
    }
  ];
  
  // Staking Contract ABI (simplified)
  const stakingABI = [
    {
      "constant": false,
      "inputs": [{"name": "amount", "type": "uint256"}],
      "name": "stake",
      "outputs": [],
      "type": "function"
    },
    {
      "constant": false,
      "inputs": [],
      "name": "withdraw",
      "outputs": [],
      "type": "function"
    },
    {
      "constant": false,
      "inputs": [],
      "name": "claimRewards",
      "outputs": [],
      "type": "function"
    }
  ];
  
  klyTokenContract = new web3.eth.Contract(tokenABI, CONFIG.KLY_TOKEN);
  stakingContract = new web3.eth.Contract(stakingABI, CONFIG.STAKING_CONTRACT);
}

// Update wallet connection status
function updateWalletStatus() {
  const walletBtn = document.getElementById('connectWallet');
  if (accounts.length > 0) {
    const shortAddress = `${accounts[0].substring(0, 6)}...${accounts[0].substring(38)}`;
    walletBtn.textContent = shortAddress;
    walletBtn.classList.add('connected');
  } else {
    walletBtn.textContent = 'Connect Wallet';
    walletBtn.classList.remove('connected');
  }
}

// Update token data on the dashboard
async function updateTokenData() {
  if (accounts.length === 0) return;
  
  try {
    const totalSupply = await klyTokenContract.methods.totalSupply().call();
    const userBalance = await klyTokenContract.methods.balanceOf(accounts[0]).call();
    
    document.getElementById('totalSupply').textContent = formatNumber(totalSupply);
    document.getElementById('userBalance').textContent = formatNumber(userBalance);
  } catch (error) {
    console.error("Error updating token data:", error);
    showStatus("Failed to load token data", true);
  }
}

// Stake tokens
async function stakeTokens() {
  const amount = document.getElementById('stakeAmount').value;
  if (!amount || amount <= 0) {
    showStatus("Please enter a valid amount", true);
    return;
  }
  
  try {
    showStatus("Approving tokens...");
    const amountWei = web3.utils.toWei(amount, 'ether');
    
    // Approve staking contract to spend tokens
    await klyTokenContract.methods.approve(CONFIG.STAKING_CONTRACT, amountWei)
      .send({ from: accounts[0] });
    
    showStatus("Staking tokens...");
    await stakingContract.methods.stake(amountWei)
      .send({ from: accounts[0] });
    
    showStatus("Tokens staked successfully!");
    await updateTokenData();
    document.getElementById('stakeAmount').value = '';
  } catch (error) {
    console.error("Staking error:", error);
    showStatus("Staking failed", true);
  }
}

// Claim rewards
async function claimRewards() {
  try {
    showStatus("Claiming rewards...");
    await stakingContract.methods.claimRewards()
      .send({ from: accounts[0] });
    
    showStatus("Rewards claimed successfully!");
    await updateTokenData();
  } catch (error) {
    console.error("Claim error:", error);
    showStatus("Claim failed", true);
  }
}

// Withdraw tokens
async function withdrawTokens() {
  try {
    showStatus("Withdrawing tokens...");
    await stakingContract.methods.withdraw()
      .send({ from: accounts[0] });
    
    showStatus("Tokens withdrawn successfully!");
    await updateTokenData();
  } catch (error) {
    console.error("Withdrawal error:", error);
    showStatus("Withdrawal failed", true);
  }
}

// Launch new token
async function launchToken() {
  const name = document.getElementById('tokenName').value.trim();
  const symbol = document.getElementById('tokenSymbol').value.trim();
  const supply = document.getElementById('tokenSupply').value.trim();
  
  if (!name || !symbol || !supply || supply <= 0) {
    showStatus("Please fill all fields with valid values", true);
    return;
  }
  
  try {
    showStatus("Launching token... (This may take a while)");
    
    // In a real implementation, you would deploy a contract here
    // This is a simplified example
    const supplyWei = web3.utils.toWei(supply, 'ether');
    
    // Simulate deployment delay
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    showStatus(`Token "${name}" (${symbol}) launched successfully!`);
    
    // Clear form
    document.getElementById('tokenName').value = '';
    document.getElementById('tokenSymbol').value = '';
    document.getElementById('tokenSupply').value = '';
  } catch (error) {
    console.error("Token launch error:", error);
    showStatus("Token launch failed", true);
  }
}

// Start course
function startCourse() {
  if (accounts.length === 0) {
    showStatus("Please connect your wallet first", true);
    return;
  }
  window.location.href = "/course.html";
}

// Show status message
function showStatus(message, isError = false) {
  const statusEl = document.getElementById('transactionStatus');
  statusEl.textContent = message;
  statusEl.className = isError ? 'error show' : 'show';
  
  setTimeout(() => {
    statusEl.className = '';
  }, 5000);
}

// Format number with commas
function formatNumber(num) {
  return parseFloat(num).toLocaleString('en-US');
}

// Set up event listeners
function setupEventListeners() {
  document.getElementById('connectWallet').addEventListener('click', initApp);
  document.getElementById('stakeButton').addEventListener('click', stakeTokens);
  document.getElementById('claimButton').addEventListener('click', claimRewards);
  document.getElementById('withdrawButton').addEventListener('click', withdrawTokens);
  document.getElementById('launchToken').addEventListener('click', launchToken);
  document.getElementById('startCourse').addEventListener('click', startCourse);
}

// Initialize when page loads
window.addEventListener('load', () => {
  if (window.ethereum) {
    window.ethereum.on('accountsChanged', (newAccounts) => {
      accounts = newAccounts;
      updateWalletStatus();
      updateTokenData();
    });
    
    window.ethereum.on('chainChanged', () => {
      window.location.reload();
    });
  }
  
  initApp();
});
