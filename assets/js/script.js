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
    if (!window.ethereum) return alert("MetaMask required.");

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
      console.error("Stats load error", e);
    }
  }

  async function stakeTokens() {
    const amount = stakeAmountInput.value;
    if (!amount || parseFloat(amount) <= 0) return;
    const amountWei = web3.utils.toWei(amount, "ether");

    await klyTokenContract.methods.approve(CONFIG.STAKING_CONTRACT, amountWei).send({ from: accounts[0] });
    await stakingContract.methods.stake(amountWei).send({ from: accounts[0] });
    updateStats();
  }

  async function claimRewards() {
    await stakingContract.methods.claimRewards().send({ from: accounts[0] });
    updateStats();
  }

  async function withdrawTokens() {
    await stakingContract.methods.withdraw().send({ from: accounts[0] });
    updateStats();
  }

  async function launchToken() {
    const name = document.getElementById("tokenName").value;
    const symbol = document.getElementById("tokenSymbol").value;
    const supply = document.getElementById("initialSupply").value;
    if (!name || !symbol || !supply) return (launchStatus.textContent = "Please fill out all fields.");

    // Simulate launch for now
    launchStatus.textContent = `Launching ${name} (${symbol}) with ${supply} tokens... (mocked)`;
  }

  function setupListeners() {
    window.ethereum.on("accountsChanged", (acc) => {
      accounts = acc;
      updateWalletDisplay();
      updateStats();
    });
    window.ethereum.on("chainChanged", () => window.location.reload());
  }
});
window.addEventListener("DOMContentLoaded", () => {
  document.getElementById("connectWallet").onclick = init;
});
