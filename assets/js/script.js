const { ThirdwebSDK } = thirdweb;

const CONFIG = {
  chain: {
    chainId: 56,
    rpc: ["https://bsc-dataseed.binance.org/"],
    nativeCurrency: {
      name: "BNB",
      symbol: "BNB",
      decimals: 18
    },
    slug: "binance"
  },
  contracts: {
    KLY_TOKEN: "0x2e4fEB2Fe668c8Ebe84f19e6c8fE8Cf8131B4E52",
    STAKING: "0x25548Ba29a0071F30E4bDCd98Ea72F79341b07a1"
  },
  gasOptions: {
    gasLimit: 300000
  }
};

const state = {
  sdk: null,
  wallet: null,
  contracts: {
    token: null,
    staking: null
  },
  transactionInProgress: false
};

async function initApp() {
  try {
    if (!window.ethereum) {
      showStatus("Please install MetaMask", true);
      return;
    }

    state.sdk = new ThirdwebSDK(CONFIG.chain);
    setupEventListeners();

    if (window.ethereum.selectedAddress) {
      await connectWallet();
    }

    console.log("DApp initialized.");
  } catch (err) {
    console.error("Init error:", err);
    showStatus("DApp failed to load", true);
  }
}

async function connectWallet() {
  try {
    state.wallet = await state.sdk.wallet.connect("injected");
    const address = await state.wallet.getAddress();

    state.contracts.token = await state.sdk.getContract(CONFIG.contracts.KLY_TOKEN, "token");
    state.contracts.staking = await state.sdk.getContract(CONFIG.contracts.STAKING);

    updateWalletInfo(address);
    updateTokenInfo();

    showStatus(`Connected: ${shortenAddress(address)}`);
  } catch (err) {
    console.error("Wallet error:", err);
    showStatus("Failed to connect wallet", true);
  }
}

async function stakeTokens() {
  const amount = document.getElementById("stakeAmount").value;
  if (!amount || parseFloat(amount) <= 0) return showStatus("Enter amount", true);

  try {
    await state.contracts.token.setAllowance(CONFIG.contracts.STAKING, amount);
    await state.contracts.staking.call("stake", [amount], CONFIG.gasOptions);
    showStatus(`Staked ${amount} KLY`);
    updateTokenInfo();
  } catch (err) {
    console.error("Stake error:", err);
    showStatus("Staking failed", true);
  }
}

async function claimRewards() {
  try {
    await state.contracts.staking.call("claimRewards", [], CONFIG.gasOptions);
    showStatus("Rewards claimed!");
    updateTokenInfo();
  } catch (err) {
    console.error("Claim error:", err);
    showStatus("Claim failed", true);
  }
}

async function withdrawTokens() {
  try {
    await state.contracts.staking.call("withdraw", [], CONFIG.gasOptions);
    showStatus("Tokens withdrawn!");
    updateTokenInfo();
  } catch (err) {
    console.error("Withdraw error:", err);
    showStatus("Withdraw failed", true);
  }
}

async function launchToken() {
  const name = document.getElementById("tokenName").value.trim();
  const symbol = document.getElementById("tokenSymbol").value.trim();
  const supply = document.getElementById("tokenSupply").value.trim();

  if (!name || !symbol || parseFloat(supply) <= 0) {
    return showStatus("Enter valid token details", true);
  }

  try {
    const token = await state.sdk.deployer.deployToken({
      name,
      symbol,
      primary_sale_recipient: await state.wallet.getAddress(),
      initial_supply: supply
    });

    showStatus(`Launched: ${name} (${symbol})`);
    console.log("Token deployed at:", token.address);
  } catch (err) {
    console.error("Launch error:", err);
    showStatus("Token launch failed", true);
  }
}

async function updateTokenInfo() {
  try {
    const addr = await state.wallet.getAddress();
    const [totalSupply, balance] = await Promise.all([
      state.contracts.token.totalSupply(),
      state.contracts.token.balanceOf(addr)
    ]);
    document.getElementById("total-supply").textContent = totalSupply.displayValue;
    document.getElementById("user-balance").textContent = balance.displayValue;
  } catch (err) {
    console.error("Update error:", err);
  }
}

function updateWalletInfo(address) {
  const btn = document.getElementById("connectWallet");
  btn.textContent = shortenAddress(address);
  btn.classList.add("connected");
}

function setupEventListeners() {
  document.getElementById("connectWallet").onclick = connectWallet;
  document.getElementById("stakeButton").onclick = stakeTokens;
  document.getElementById("claimButton").onclick = claimRewards;
  document.getElementById("withdrawButton").onclick = withdrawTokens;
  document.getElementById("launchToken").onclick = launchToken;
  document.getElementById("startCourse").onclick = () => {
    window.location.href = "/course.html";
  };
}

function showStatus(message, isError = false) {
  let statusEl = document.getElementById("transaction-status");
  if (!statusEl) {
    statusEl = document.createElement("div");
    statusEl.id = "transaction-status";
    document.body.appendChild(statusEl);
  }

  statusEl.textContent = message;
  statusEl.style.position = "fixed";
  statusEl.style.bottom = "20px";
  statusEl.style.left = "50%";
  statusEl.style.transform = "translateX(-50%)";
  statusEl.style.padding = "12px 24px";
  statusEl.style.backgroundColor = isError ? "#ff4444" : "#4CAF50";
  statusEl.style.color = "#fff";
  statusEl.style.borderRadius = "6px";
  statusEl.style.zIndex = 1000;

  setTimeout(() => {
    statusEl.remove();
  }, 5000);
}

function shortenAddress(addr) {
  return addr.slice(0, 6) + "..." + addr.slice(-4);
}

document.addEventListener("DOMContentLoaded", initApp);
