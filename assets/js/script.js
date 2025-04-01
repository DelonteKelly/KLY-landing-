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
  const totalSupplyEl = document.getElementById("totalSupply");
  const userBalanceEl = document.getElementById("userBalance");
  const stakeAmountInput = document.getElementById("stakeAmount");
  const stakeBtn = document.getElementById("stakeButton");
  const claimBtn = document.getElementById("claimButton");
  const withdrawBtn = document.getElementById("withdrawButton");
  const statusEl = document.getElementById("transactionStatus");
  const startCourseBtn = document.getElementById("startCourseBtn");

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
  if (startCourseBtn) startCourseBtn.onclick = () => window.location.href = "course.html";

  async function init() {
    if (!window.ethereum) {
      showStatus("MetaMask is not installed.", true);
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
  }

  async function updateStats() {
    try {
      const [supply, balance] = await Promise.all([
        klyTokenContract.methods.totalSupply().call(),
        klyTokenContract.methods.balanceOf(accounts[0]).call()
      ]);
      totalSupplyEl.textContent = parseFloat(web3.utils.fromWei(supply)).toLocaleString() + " KLY";
      userBalanceEl.textContent = parseFloat(web3.utils.fromWei(balance)).toLocaleString() + " KLY";
    } catch (e) {
      showStatus("Failed to load token stats", true);
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
      console.error(err);
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
    const nftABI = [
  {
    "inputs": [
      { "internalType": "address", "name": "to", "type": "address" },
      { "internalType": "int24", "name": "tickLower", "type": "int24" },
      { "internalType": "int24", "name": "tickUpper", "type": "int24" },
      { "internalType": "uint128", "name": "amount", "type": "uint128" },
      { "internalType": "bytes", "name": "data", "type": "bytes" }
    ],
    "name": "mint",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
];
  }
});
const claimBtnEl = document.getElementById("claimCertificateBtn");

if (claimBtnEl) {
  claimBtnEl.addEventListener("click", async () => {
    if (typeof window.ethereum === "undefined") {
      alert("Please install MetaMask to continue.");
      return;
    }

    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const accounts = await provider.send("eth_requestAccounts", []);
      const user = accounts[0];

      const contractAddress = "0xDA76d35742190283E340dbeE2038ecc978a56950"; // Replace if needed
      const contractABI = [
        {
          "inputs": [
            { "internalType": "address", "name": "to", "type": "address" },
            { "internalType": "int24", "name": "tickLower", "type": "int24" },
            { "internalType": "int24", "name": "tickUpper", "type": "int24" },
            { "internalType": "uint128", "name": "amount", "type": "uint128" },
            { "internalType": "bytes", "name": "data", "type": "bytes" }
          ],
          "name": "mint",
          "outputs": [],
          "stateMutability": "nonpayable",
          "type": "function"
        }
      ];

      const signer = provider.getSigner();
      const nftContract = new ethers.Contract(contractAddress, contractABI, signer);

      const tickLower = 0;
      const tickUpper = 0;
      const amount = ethers.utils.parseEther("1"); // 1 KLY

      const tx = await nftContract.mint(user, tickLower, tickUpper, amount, data, {
  gasLimit: 300000
});
      alert("NFT Certificate Minted Successfully!");
    } catch (err) {
      console.error(err);
      alert("Minting failed. Check your wallet and try again.");
    }
  });
}
