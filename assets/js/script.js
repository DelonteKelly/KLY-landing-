// Initialize Thirdweb SDK for Binance Smart Chain
const thirdweb = new ThirdwebSDK("binance");

// Your contract addresses
const KLY_TOKEN_ADDRESS = "0x2e4fEB2Fe668c8Ebe84f19e6c8fE8Cf8131B4E52";
const STAKING_CONTRACT_ADDRESS = "0x25548Ba29a0071F30E4bDCd98Ea72F79341b07a1";

let connectedWallet;
let tokenContract;
let stakingContract;

// Connect Wallet
async function connectWallet() {
  if (!window.ethereum) {
    alert("MetaMask not detected.");
    return;
  }
  // Example to fetch total supply and user balance
async function fetchKLYStats() {
  if (!window.ethereum) return;

  const provider = new ethers.providers.Web3Provider(window.ethereum);
  const contract = new ethers.Contract(KLY_TOKEN_ADDRESS, KLY_ABI, provider);

  const [supply, address] = await Promise.all([
    contract.totalSupply(),
    provider.getSigner().getAddress()
  ]);

  const balance = await contract.balanceOf(address);

  document.getElementById("total-supply").innerText = ethers.utils.formatUnits(supply, 18) + " KLY";
  document.getElementById("user-balance").innerText = ethers.utils.formatUnits(balance, 18) + " KLY";
}

  try {
    const wallet = await thirdweb.wallet.connect("injected");
    connectedWallet = wallet;

    const address = await wallet.getAddress();
    document.getElementById("user-balance").innerText = "Loading...";

    tokenContract = await thirdweb.getContract(KLY_TOKEN_ADDRESS, "token");
    stakingContract = await thirdweb.getContract(STAKING_CONTRACT_ADDRESS);

    // Load token supply & user balance
    const total = await tokenContract.totalSupply();
    const balance = await tokenContract.balanceOf(address);

    document.getElementById("total-supply").innerText = total.displayValue;
    document.getElementById("user-balance").innerText = balance.displayValue;

    alert("Wallet connected: " + address);
  } catch (error) {
    alert("Wallet connection failed");
    console.error(error);
  }
}

// Stake Tokens
async function stakeTokens() {
  const amount = document.getElementById("stakeAmount").value;
  if (!amount || isNaN(amount)) {
    alert("Please enter a valid amount to stake.");
    return;
  }

  try {
    await stakingContract.call("stake", [amount]);
    alert("Stake successful!");
  } catch (err) {
    alert("Stake failed.");
    console.error(err);
  }
}

// Withdraw Tokens
async function withdrawTokens() {
  try {
    await stakingContract.call("withdraw");
    alert("Withdraw successful!");
  } catch (err) {
    alert("Withdraw failed.");
    console.error(err);
  }
}

// Claim Rewards
async function claimRewards() {
  try {
    await stakingContract.call("claimRewards");
    alert("Rewards claimed!");
  } catch (err) {
    alert("Claim failed.");
    console.error(err);
  }
}

// Start Course
function startCourse() {
  window.location.href = "/course.html";
}

// Launch Token (Placeholder for now)
function launchToken() {
  const name = document.getElementById("tokenName").value;
  const symbol = document.getElementById("tokenSymbol").value;
  const supply = document.getElementById("tokenSupply").value;
  alert(`Launching Token: ${name} (${symbol}) with supply of ${supply}`);
}

// Smooth scroll
function scrollToSection(id) {
  const section = document.getElementById(id);
  if (section) {
    section.scrollIntoView({ behavior: "smooth" });
  }
}
