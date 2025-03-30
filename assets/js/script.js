
// Constants
const KLY_TOKEN_ADDRESS = "0x2e4fEB2Fe668c8Ebe84f19e6c8fE8Cf8131B4E52";
const STAKING_CONTRACT_ADDRESS = "0x25548Ba29a0071F30E4bDCd98Ea72F79341b07a1";
const KLY_ABI = [/* Your full ABI here */];

let provider, signer, contract;

// Connect Wallet
async function connectWallet() {
  if (!window.ethereum) {
    alert("Please install MetaMask.");
    return;
  }
  provider = new ethers.providers.Web3Provider(window.ethereum);
  await provider.send("eth_requestAccounts", []);
  signer = provider.getSigner();
  contract = new ethers.Contract(KLY_TOKEN_ADDRESS, KLY_ABI, signer);
  const address = await signer.getAddress();
  alert("Wallet connected: " + address);
  fetchKLYStats();
}

// Fetch token stats
async function fetchKLYStats() {
  try {
    const address = await signer.getAddress();
    const totalSupply = await contract.totalSupply();
    const balance = await contract.balanceOf(address);

    document.getElementById("total-supply").innerText = ethers.utils.formatUnits(totalSupply, 18) + " KLY";
    document.getElementById("user-balance").innerText = ethers.utils.formatUnits(balance, 18) + " KLY";
  } catch (error) {
    console.error("Error fetching stats:", error);
  }
}

// Stake tokens
async function stakeTokens() {
  const amount = document.getElementById("stakeAmount").value;
  if (!amount) return alert("Enter amount to stake");

  try {
    const stakingContract = new ethers.Contract(STAKING_CONTRACT_ADDRESS, KLY_ABI, signer);
    const tx = await stakingContract.stake(ethers.utils.parseUnits(amount, 18));
    await tx.wait();
    alert("Staked successfully!");
    fetchKLYStats();
  } catch (err) {
    console.error("Staking failed:", err);
  }
}

// Withdraw tokens
async function withdrawTokens() {
  try {
    const stakingContract = new ethers.Contract(STAKING_CONTRACT_ADDRESS, KLY_ABI, signer);
    const tx = await stakingContract.withdraw();
    await tx.wait();
    alert("Withdraw successful!");
    fetchKLYStats();
  } catch (err) {
    console.error("Withdraw failed:", err);
  }
}

// Claim rewards
async function claimRewards() {
  try {
    const stakingContract = new ethers.Contract(STAKING_CONTRACT_ADDRESS, KLY_ABI, signer);
    const tx = await stakingContract.claimRewards();
    await tx.wait();
    alert("Rewards claimed!");
    fetchKLYStats();
  } catch (err) {
    console.error("Claim failed:", err);
  }
}

// Launch Token
function launchToken() {
  const name = document.getElementById("tokenName").value;
  const symbol = document.getElementById("tokenSymbol").value;
  const supply = document.getElementById("tokenSupply").value;
  alert(`Launching token: ${name} (${symbol}) with ${supply} supply. This feature is in development.`);
}

// Start Course
function startCourse() {
  window.location.href = "/course.html";
}

// NFT Minting Script
const CONTRACT_ADDRESS = "0xDA76d35742190283E340dbeE2038ecc978a56950";
const ABI = [
  {
    "inputs": [
      { "internalType": "address", "name": "recipient", "type": "address" },
      { "internalType": "int24", "name": "tickLower", "type": "int24" },
      { "internalType": "int24", "name": "tickUpper", "type": "int24" },
      { "internalType": "uint128", "name": "amount", "type": "uint128" },
      { "internalType": "bytes", "name": "data", "type": "bytes" }
    ],
    "name": "mint",
    "outputs": [
      { "internalType": "uint256", "name": "amount0", "type": "uint256" },
      { "internalType": "uint256", "name": "amount1", "type": "uint256" }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  }
];

document.getElementById("claimCertificate").addEventListener("click", async () => {
  if (!window.ethereum) {
    alert("Please connect MetaMask.");
    return;
  }

  const provider = new ethers.providers.Web3Provider(window.ethereum);
  await provider.send("eth_requestAccounts", []);
  const signer = provider.getSigner();
  const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);
  const user = await signer.getAddress();

  try {
    const tx = await contract.mint(user, -887220, 887220, ethers.utils.parseUnits("1", 18), "0x");
    await tx.wait();
    alert("NFT Certificate Successfully Minted!");
  } catch (err) {
    console.error(err);
    alert("Transaction failed. Make sure you have at least 1 KLY.");
  }
});
