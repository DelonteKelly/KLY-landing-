const CONFIG = {
  KLY_TOKEN: "0x2e4fEB2Fe668c8Ebe84f19e6c8fE8Cf8131B4E52",
  STAKING_CONTRACT: "0xa8380b1311B9316dbf87D5110E8CC35BcB835056",
  CHAIN_ID: 56
};

let web3;
let accounts = [];
let klyTokenContract;
let stakingContract;

const connectBtn = document.getElementById('connectWallet');
const totalSupplyEl = document.getElementById('totalSupply');
const userBalanceEl = document.getElementById('userBalance');
const stakeBtn = document.getElementById('stakeButton');
const claimBtn = document.getElementById('claimButton');
const withdrawBtn = document.getElementById('withdrawButton');
const stakeAmountInput = document.getElementById('stakeAmount');
const statusEl = document.getElementById('transactionStatus');

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
    "constant": false,
    "inputs": [
      { "name": "spender", "type": "address" },
      { "name": "amount", "type": "uint256" }
    ],
    "name": "approve",
    "outputs": [{ "name": "", "type": "bool" }],
    "type": "function"
  }
];

const stakingABI = [
  {
    "constant": false,
    "inputs": [{ "name": "amount", "type": "uint256" }],
    "name": "stake",
    "outputs": [],
    "type": "function"
  },
  {
    "constant": false,
    "inputs": [],
    "name": "claimRewards",
    "outputs": [],
    "type": "function"
  },
  {
    "constant": false,
    "inputs": [],
    "name": "withdraw",
    "outputs": [],
    "type": "function"
  }
];

async function initApp() {
  if (window.ethereum) {
    web3 = new Web3(window.ethereum);
    try {
      accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      await switchToBSC();
      await loadContracts();
      updateWalletDisplay();
      updateTokenData();
      setupListeners();
    } catch (err) {
      showStatus("Wallet connection failed", true);
    }
  } else {
    showStatus("Please install MetaMask!", true);
  }
}

async function switchToBSC() {
  try {
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: '0x38' }]
    });
  } catch (e) {
    if (e.code === 4902) {
      await window.ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [{
          chainId: '0x38',
          chainName: 'BNB Smart Chain',
          nativeCurrency: { name: 'BNB', symbol: 'BNB', decimals: 18 },
          rpcUrls: ['https://bsc-dataseed.binance.org/'],
          blockExplorerUrls: ['https://bscscan.com']
        }]
      });
    }
  }
}

async function loadContracts() {
  klyTokenContract = new web3.eth.Contract(tokenABI, CONFIG.KLY_TOKEN);
  stakingContract = new web3.eth.Contract(stakingABI, CONFIG.STAKING_CONTRACT);
}

function updateWalletDisplay() {
  const shortAddr = `${accounts[0].slice(0, 6)}...${accounts[0].slice(-4)}`;
  connectBtn.textContent = shortAddr;
  connectBtn.classList.add('connected');
}

async function updateTokenData() {
  try {
    const [supply, balance] = await Promise.all([
      klyTokenContract.methods.totalSupply().call(),
      klyTokenContract.methods.balanceOf(accounts[0]).call()
    ]);
    totalSupplyEl.textContent = parseFloat(web3.utils.fromWei(supply)).toLocaleString() + " KLY";
    userBalanceEl.textContent = parseFloat(web3.utils.fromWei(balance)).toLocaleString() + " KLY";
  } catch (err) {
    showStatus("Failed to load token data", true);
  }
}

async function stakeTokens() {
  const amount = stakeAmountInput.value;
  if (!amount || parseFloat(amount) <= 0) return showStatus("Enter valid amount", true);
  const amountWei = web3.utils.toWei(amount, 'ether');

  try {
    showStatus("Approving tokens...");
    await klyTokenContract.methods.approve(CONFIG.STAKING_CONTRACT, amountWei)
      .send({ from: accounts[0] });

    showStatus("Staking...");
    await stakingContract.methods.stake(amountWei)
      .send({ from: accounts[0] });

    showStatus("Staked successfully!");
    updateTokenData();
    stakeAmountInput.value = "";
  } catch (err) {
    showStatus("Stake failed", true);
    console.error(err);
  }
}

async function claimRewards() {
  try {
    showStatus("Claiming rewards...");
    await stakingContract.methods.claimRewards().send({ from: accounts[0] });
    showStatus("Rewards claimed!");
    updateTokenData();
  } catch (err) {
    showStatus("Claim failed", true);
  }
}

async function withdrawTokens() {
  try {
    showStatus("Withdrawing...");
    await stakingContract.methods.withdraw().send({ from: accounts[0] });
    showStatus("Withdrawal complete!");
    updateTokenData();
  } catch (err) {
    showStatus("Withdraw failed", true);
  }
}

function setupListeners() {
  connectBtn.onclick = async () => {
    if (!window.ethereum) return showStatus("MetaMask not detected", true);
    if (accounts.length === 0) await initApp();
  };

  stakeBtn.onclick = stakeTokens;
  claimBtn.onclick = claimRewards;
  withdrawBtn.onclick = withdrawTokens;

  window.ethereum.on('accountsChanged', (newAcc) => {
    accounts = newAcc;
    updateWalletDisplay();
    updateTokenData();
  });

  window.ethereum.on('chainChanged', () => window.location.reload());
}

function showStatus(message, isError = false) {
  statusEl.textContent = message;
  statusEl.className = isError ? 'error show' : 'show';
  statusEl.style.display = 'block';
  setTimeout(() => {
    statusEl.style.display = 'none';
  }, 4000);
}

window.addEventListener('load', initApp);
