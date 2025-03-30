// Constants
const KLY_TOKEN_ADDRESS = "0x2e4fEB2Fe668c8Ebe84f19e6c8fE8Cf8131B4E52";
const NFT_CONTRACT_ADDRESS = "0xDA76d35742190283E340dbeE2038ecc978a56950";

const KLY_ABI = [
  {
    "constant": true,
    "inputs": [],
    "name": "totalSupply",
    "outputs": [{ "name": "", "type": "uint256" }],
    "type": "function",
  },
  {
    "constant": true,
    "inputs": [{ "name": "_owner", "type": "address" }],
    "name": "balanceOf",
    "outputs": [{ "name": "balance", "type": "uint256" }],
    "type": "function",
  }
];

// NFT Mint ABI
const NFT_ABI = [
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

let provider, signer, klyContract;

// Connect Wallet
async function connectWallet() {
  if (!window.ethereum) {
    alert("MetaMask not found. Please install it.");
    return;
  }

  provider = new ethers.providers.Web3Provider(window.ethereum);
  await provider.send("eth_requestAccounts", []);
  signer = provider.getSigner();
  klyContract = new ethers.Contract(KLY_TOKEN_ADDRESS, KLY_ABI, signer);

  const address = await signer.getAddress();
  alert("Wallet connected: " + address);
  fetchKLYStats();
}

// Fetch Token Stats
async function fetchKLYStats() {
  try {
    const address = await signer.getAddress();
    const totalSupply = await klyContract.totalSupply();
    const balance = await klyContract.balanceOf(address);

    document.getElementById("total-supply").innerText =
      ethers.utils.formatUnits(totalSupply, 18) + " KLY";
    document.getElementById("user-balance").innerText =
      ethers.utils.formatUnits(balance, 18) + " KLY";
  } catch (err) {
    console.error("Error fetching stats:", err);
  }
}

// Start Course
function startCourse() {
  window.location.href = "/course.html";
}

// Mint Certificate NFT
async function claimCertificateNFT() {
  if (!window.ethereum) {
    alert("Please install MetaMask.");
    return;
  }

  try {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    await provider.send("eth_requestAccounts", []);
    const signer = provider.getSigner();
    const user = await signer.getAddress();

    const certificateContract = new ethers.Contract(NFT_CONTRACT_ADDRESS, NFT_ABI, signer);
    const tx = await certificateContract.mint(user, -887220, 887220, ethers.utils.parseUnits("1", 18), "0x");
    await tx.wait();

    alert("Success! NFT Certificate Minted.");
  } catch (err) {
    console.error("Minting failed:", err);
    alert("Minting failed. Ensure you have at least 1 KLY.");
  }
}

// Event Listeners
document.getElementById("connectWallet")?.addEventListener("click", connectWallet);
document.getElementById("claimCertificate")?.addEventListener("click", claimCertificateNFT);
document.getElementById("startCourseBtn")?.addEventListener("click", startCourse);
