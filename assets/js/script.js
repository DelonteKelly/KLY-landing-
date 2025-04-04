<!-- Load libraries -->
<script src="https://cdn.jsdelivr.net/npm/web3@1.7.5/dist/web3.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/ethers@5.7.2/dist/ethers.umd.min.js"></script>
<script src="assets/js/script.js"></script>
<!-- Fix wallet + launch logic -->
const CONFIG = {
  KLY_TOKEN: "0x2e4fEB2Fe668c8Ebe84f19e6c8fE8Cf8131B4E52",
  STAKING_CONTRACT: "0xa8380b1311B9316dbf87D5110E8CC35BcB835056",
  CHAIN_ID: 56
};

let web3;
let accounts = [];
let klyTokenContract;
let stakingContract;

window.addEventListener("DOMContentLoaded", () => {
  const connectBtn = document.getElementById("connectWallet");
  const walletSpan = document.getElementById("walletAddress");
  const totalSupplyEl = document.getElementById("klyTotalSupply");
  const userBalanceEl = document.getElementById("klyWalletBalance");
  const stakeAmountInput = document.getElementById("stakeAmount");
  const stakeBtn = document.getElementById("stakeButton");
  const claimBtn = document.getElementById("claimButton");
  const withdrawBtn = document.getElementById("withdrawButton");
  const statusEl = document.getElementById("transactionStatus");
  const launchBtn = document.getElementById("launchTokenBtn");
  const launchStatus = document.getElementById("launchStatus");

  const tokenABI = [
    { constant: true, inputs: [], name: "totalSupply", outputs: [{ name: "", type: "uint256" }], type: "function" },
    { constant: true, inputs: [{ name: "account", type: "address" }], name: "balanceOf", outputs: [{ name: "", type: "uint256" }], type: "function" },
    { constant: false, inputs: [{ name: "spender", type: "address" }, { name: "amount", type: "uint256" }], name: "approve", outputs: [{ name: "", type: "bool" }], type: "function" }
  ];

  const stakingABI = [
    { constant: false, inputs: [{ name: "amount", type: "uint256" }], name: "stake", outputs: [], type: "function" },
    { constant: false, inputs: [], name: "claimRewards", outputs: [], type: "function" },
    { constant: false, inputs: [], name: "withdraw", outputs: [], type: "function" }
  ];

  if (connectBtn) connectBtn.onclick = init;
  if (stakeBtn) stakeBtn.onclick = stakeTokens;
  if (claimBtn) claimBtn.onclick = claimRewards;
  if (withdrawBtn) withdrawBtn.onclick = withdrawTokens;
  if (launchBtn) launchBtn.onclick = launchToken;

  async function init() {
    if (!window.ethereum) {
      alert("Please install MetaMask.");
      return;
    }

    web3 = new Web3(window.ethereum);
    accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
    await switchToBSC();

    klyTokenContract = new web3.eth.Contract(tokenABI, CONFIG.KLY_TOKEN);
    stakingContract = new web3.eth.Contract(stakingABI, CONFIG.STAKING_CONTRACT);

    updateWalletDisplay();
    updateStats();
    setupListeners();
  }

  async function switchToBSC() {
    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: "0x38" }]
      });
    } catch (e) {
      if (e.code === 4902) {
        await window.ethereum.request({
          method: "wallet_addEthereumChain",
          params: [{
            chainId: "0x38",
            chainName: "BNB Smart Chain",
            nativeCurrency: { name: "BNB", symbol: "BNB", decimals: 18 },
            rpcUrls: ["https://bsc-dataseed.binance.org/"],
            blockExplorerUrls: ["https://bscscan.com"]
          }]
        });
      }
    }
  }

  function updateWalletDisplay() {
    const short = `${accounts[0].slice(0, 6)}...${accounts[0].slice(-4)}`;
    connectBtn.textContent = short;
    connectBtn.classList.add("connected");
    if (walletSpan) walletSpan.textContent = short;
  }

  async function updateStats() {
    try {
      const [supply, balance] = await Promise.all([
        klyTokenContract.methods.totalSupply().call(),
        klyTokenContract.methods.balanceOf(accounts[0]).call()
      ]);
      totalSupplyEl.textContent = web3.utils.fromWei(supply, "ether");
      userBalanceEl.textContent = web3.utils.fromWei(balance, "ether");
    } catch (e) {
      showStatus("Error loading stats", true);
    }
  }

  async function stakeTokens() {
    const amount = stakeAmountInput.value;
    if (!amount || parseFloat(amount) <= 0) return showStatus("Enter a valid amount", true);
    const amountWei = web3.utils.toWei(amount, "ether");

    try {
      showStatus("Approving...");
      await klyTokenContract.methods.approve(CONFIG.STAKING_CONTRACT, amountWei).send({ from: accounts[0] });

      showStatus("Staking...");
      await stakingContract.methods.stake(amountWei).send({ from: accounts[0] });

      showStatus("Staked successfully!");
      stakeAmountInput.value = "";
      updateStats();
    } catch (err) {
      showStatus("Stake failed", true);
    }
  }

  async function claimRewards() {
    try {
      showStatus("Claiming rewards...");
      await stakingContract.methods.claimRewards().send({ from: accounts[0] });
      showStatus("Rewards claimed!");
      updateStats();
    } catch (err) {
      showStatus("Claim failed", true);
    }
  }

  async function withdrawTokens() {
    try {
      showStatus("Withdrawing...");
      await stakingContract.methods.withdraw().send({ from: accounts[0] });
      showStatus("Withdrawn successfully!");
      updateStats();
    } catch (err) {
      showStatus("Withdraw failed", true);
    }
  }

  async function launchToken() {
    const name = document.getElementById("tokenName").value;
    const symbol = document.getElementById("tokenSymbol").value;
    const supply = document.getElementById("initialSupply").value;

    if (!name || !symbol || !supply) {
      return (launchStatus.textContent = "All fields are required.");
    }

    // Replace this with your actual contract logic
    launchStatus.textContent = `Launch simulated: ${name} (${symbol}) with ${supply} tokens.`;
  }

  function setupListeners() {
    window.ethereum.on("accountsChanged", (acc) => {
      accounts = acc;
      updateWalletDisplay();
      updateStats();
    });

    window.ethereum.on("chainChanged", () => window.location.reload());
  }

  function showStatus(message, isError = false) {
    if (!statusEl) return;
    statusEl.textContent = message;
    statusEl.style.display = "block";
    statusEl.style.background = isError ? "#ff4d4d" : "#00ffe0";
    statusEl.style.color = isError ? "white" : "black";
    setTimeout(() => {
      statusEl.style.display = "none";
    }, 4000);
  }
});
