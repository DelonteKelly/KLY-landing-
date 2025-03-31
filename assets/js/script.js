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
  gasOptions: { gasLimit: 300000 }
};

const state = {
  sdk: null,
  wallet: null,
  contracts: { token: null, staking: null },
  transactionInProgress: false
};

async function initApp() {
  if (!window.ethereum) return showStatus("Install MetaMask", true);

  state.sdk = new ThirdwebSDK(CONFIG.chain);
  setupEventListeners();

  if (window.ethereum.selectedAddress) {
    await connectWallet();
  }

  document.querySelectorAll('.card').forEach(card => {
    setTimeout(() => card.classList.add('visible'), 200);
  });
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
    showStatus("Connection Failed", true);
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
  } catch {
    showStatus("Stake failed", true);
  }
}

async function claimRewards() {
  try {
    await state.contracts.staking.call("claimRewards", [], CONFIG.gasOptions);
    showStatus("Rewards claimed!");
    updateTokenInfo();
  } catch {
    showStatus("Claim failed", true);
  }
}

async function withdrawTokens() {
  try {
    await state.contracts.staking.call("withdraw", [], CONFIG.gasOptions);
    showStatus("Withdrawn!");
    updateTokenInfo();
  } catch {
    showStatus("Withdraw failed", true);
  }
}

async function launchToken() {
  const name = document.getElementById("tokenName").value.trim();
  const symbol = document.getElementById("tokenSymbol").value.trim();
  const supply = document.getElementById("tokenSupply").value.trim();

  if (!name || !symbol || parseFloat(supply) <= 0) {
    return showStatus("Invalid token info", true);
  }

  try {
    const token = await state.sdk.deployer.deployToken({
      name,
      symbol,
      primary_sale_recipient: await state.wallet.getAddress(),
      initial_supply: supply
    });
    showStatus(`Launched: ${name} (${symbol})`);
    console.log("Token address:", token.address);
  } catch {
    showStatus("Launch failed", true);
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
    console.error("Update failed", err);
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
  let el = document.getElementById("transaction-status");
  if (!el) {
    el = document.createElement("div");
    el.id = "transaction-status";
    document.body.appendChild(el);
  }

  el.textContent = message;
  el.style.position = "fixed";
  el.style.bottom = "20px";
  el.style.left = "50%";
  el.style.transform = "translateX(-50%)";
  el.style.padding = "12px 24px";
  el.style.backgroundColor = isError ? "#ff4444" : "#4CAF50";
  el.style.color = "#fff";
  el.style.borderRadius = "6px";
  el.style.zIndex = 1000;

  setTimeout(() => el.remove(), 5000);
}

function shortenAddress(addr) {
  return addr.slice(0, 6) + "..." + addr.slice(-4);
}

document.addEventListener("DOMContentLoaded", initApp);
