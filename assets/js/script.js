const { ThirdwebSDK } = thirdweb;

const CONFIG = {
  chain: {
    chainId: 56,
    rpc: ["https://bsc-dataseed.binance.org/"],
    nativeCurrency: { name: "BNB", symbol: "BNB", decimals: 18 },
    slug: "binance",
  },
  contracts: {
    KLY_TOKEN: "0x2e4fEB2Fe668c8Ebe84f19e6c8fE8Cf8131B4E52",
    STAKING: "0x25548Ba29a0071F30E4bDCd98Ea72F79341b07a1",
  },
  gasOptions: { gasLimit: 300000 },
};

const state = {
  sdk: null,
  wallet: null,
  contracts: { token: null, staking: null },
};

async function initApp() {
  if (!window.ethereum) {
    showStatus("Install MetaMask", true);
    return;
  }

  state.sdk = new ThirdwebSDK(CONFIG.chain);
  setupEventListeners();

  if (window.ethereum.selectedAddress) await connectWallet();
}

async function connectWallet() {
  try {
    state.wallet = await state.sdk.wallet.connect("injected");
    const address = await state.wallet.getAddress();

    state.contracts.token = await state.sdk.getContract(CONFIG.contracts.KLY_TOKEN, "token");
    state.contracts.staking = await state.sdk.getContract(CONFIG.contracts.STAKING);

    document.getElementById("connectWallet").textContent = shortenAddress(address);
    document.getElementById("connectWallet").classList.add("connected");

    updateTokenInfo();
    showStatus(`Connected: ${shortenAddress(address)}`);
  } catch (err) {
    console.error(err);
    showStatus("Wallet connection failed", true);
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
    console.error(err);
    showStatus("Stake failed", true);
  }
}

async function claimRewards() {
  try {
    await state.contracts.staking.call("claimRewards", [], CONFIG.gasOptions);
    showStatus("Rewards claimed!");
    updateTokenInfo();
  } catch (err) {
    console.error(err);
    showStatus("Claim failed", true);
  }
}

async function withdrawTokens() {
  try {
    await state.contracts.staking.call("withdraw", [], CONFIG.gasOptions);
    showStatus("Withdraw successful!");
    updateTokenInfo();
  } catch (err) {
    console.error(err);
    showStatus("Withdraw failed", true);
  }
}

async function launchToken() {
  const name = document.getElementById("tokenName").value;
  const symbol = document.getElementById("tokenSymbol").value;
  const supply = document.getElementById("tokenSupply").value;

  if (!name || !symbol || parseFloat(supply) <= 0) {
    return showStatus("Invalid token details", true);
  }

  try {
    const token = await state.sdk.deployer.deployToken({
      name,
      symbol,
      primary_sale_recipient: await state.wallet.getAddress(),
      initial_supply: supply,
    });
    showStatus(`Launched ${name} (${symbol})`);
  } catch (err) {
    console.error(err);
    showStatus("Launch failed", true);
  }
}

async function updateTokenInfo() {
  try {
    const address = await state.wallet.getAddress();
    const [totalSupply, balance] = await Promise.all([
      state.contracts.token.totalSupply(),
      state.contracts.token.balanceOf(address),
    ]);
    document.getElementById("total-supply").textContent = totalSupply.displayValue;
    document.getElementById("user-balance").textContent = balance.displayValue;
  } catch (err) {
    console.error("Info error:", err);
  }
}

function showStatus(message, isError = false) {
  let status = document.getElementById("transaction-status");
  if (!status) {
    status = document.createElement("div");
    status.id = "transaction-status";
    document.body.appendChild(status);
  }

  status.textContent = message;
  status.style.position = "fixed";
  status.style.bottom = "20px";
  status.style.left = "50%";
  status.style.transform = "translateX(-50%)";
  status.style.backgroundColor = isError ? "#ff4444" : "#4CAF50";
  status.style.padding = "12px 24px";
  status.style.borderRadius = "6px";
  status.style.color = "#fff";
  status.style.zIndex = 1000;

  setTimeout(() => status.remove(), 4000);
}

function shortenAddress(addr) {
  return addr.slice(0, 6) + "..." + addr.slice(-4);
}

function setupEventListeners() {
  document.getElementById("connectWallet").onclick = connectWallet;
  document.getElementById("stakeButton").onclick = stakeTokens;
  document.getElementById("claimButton").onclick = claimRewards;
  document.getElementById("withdrawButton").onclick = withdrawTokens;
  document.getElementById("launchToken").onclick = launchToken;
  document.getElementById("startCourse").onclick = () => location.href = "/course.html";
}

document.addEventListener("DOMContentLoaded", initApp);
