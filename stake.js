window.addEventListener("DOMContentLoaded", () => {
  const CONFIG = {
    KLY_TOKEN: "0x2e4fEB2Fe668c8Ebe84f19e6c8fE8Cf8131B4E52",
    STAKING_CONTRACT: "0xa8380b1311B9316dbf87D5110E8CC35BcB835056",
    CHAIN_ID: 56
  };

  let web3;
  let accounts = [];
  let klyTokenContract;
  let stakingContract;

  const connectBtn = document.getElementById("connectWallet");
  const walletDisplay = document.getElementById("walletAddress");
  const stakeAmountInput = document.getElementById("stakeAmount");
  const stakeBtn = document.getElementById("stakeButton");
  const claimBtn = document.getElementById("claimButton");
  const withdrawBtn = document.getElementById("withdrawButton");
  const statusEl = document.getElementById("transactionStatus");

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

  async function connectWallet() {
    if (!window.ethereum) return showStatus("MetaMask not detected", true);
    web3 = new Web3(window.ethereum);
    accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
    klyTokenContract = new web3.eth.Contract(tokenABI, CONFIG.KLY_TOKEN);
    stakingContract = new web3.eth.Contract(stakingABI, CONFIG.STAKING_CONTRACT);

    const short = `${accounts[0].slice(0, 6)}...${accounts[0].slice(-4)}`;
    walletDisplay.textContent = `Connected: ${short}`;
    connectBtn.textContent = short;

    setupListeners();
  }

  async function stakeTokens() {
    const amount = stakeAmountInput.value;
    if (!amount || parseFloat(amount) <= 0) return showStatus("Enter valid amount", true);
    const amountWei = web3.utils.toWei(amount, "ether");

    try {
      showStatus("Approving...");
      await klyTokenContract.methods.approve(CONFIG.STAKING_CONTRACT, amountWei).send({ from: accounts[0] });

      showStatus("Staking...");
      await stakingContract.methods.stake(amountWei).send({ from: accounts[0] });

      showStatus("Staked!");
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
    } catch (err) {
      showStatus("Claim failed", true);
    }
  }

  async function withdrawTokens() {
    try {
      showStatus("Withdrawing...");
      await stakingContract.methods.withdraw().send({ from: accounts[0] });
      showStatus("Withdrawn!");
    } catch (err) {
      showStatus("Withdraw failed", true);
    }
  }

  function setupListeners() {
    stakeBtn.onclick = stakeTokens;
    claimBtn.onclick = claimRewards;
    withdrawBtn.onclick = withdrawTokens;

    window.ethereum.on("accountsChanged", () => {
      window.location.reload();
    });

    window.ethereum.on("chainChanged", () => {
      window.location.reload();
    });
  }

  function showStatus(message, isError = false) {
    statusEl.textContent = message;
    statusEl.style.color = isError ? "red" : "#00ffe0";
    statusEl.style.display = "block";
    setTimeout(() => statusEl.style.display = "none", 4000);
  }

  connectBtn.onclick = connectWallet;
});
