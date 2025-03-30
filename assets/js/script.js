// Constants
const KLY_TOKEN_ADDRESS = "0x2e4fEB2Fe668c8Ebe84f19e6c8fE8Cf8131B4E52";
const STAKING_CONTRACT_ADDRESS = "0x25548Ba29a0071F30E4bDCd98Ea72F79341b07a1";
const NFT_CONTRACT_ADDRESS = "0xDA76d35742190283E340dbeE2038ecc978a56950";

const KLY_ABI = [/* your full KLY ABI here */];
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

let provider, signer, contract;

window.onload = () => {
  // Button bindings
  const connectBtn = document.getElementById("connectWallet");
  if (connectBtn) connectBtn.addEventListener("click", connectWallet);

  const stakeBtn = document.querySelector('[onclick="stakeTokens()"]');
  if (stakeBtn) stakeBtn.addEventListener("click", stakeTokens);

  const claimBtn = document.querySelector('[onclick="claimRewards()"]');
  if (claimBtn) claimBtn.addEventListener("click", claimRewards);

  const withdrawBtn = document.querySelector('[onclick="withdrawTokens()"]');
  if (withdrawBtn) withdrawBtn.addEventListener("click", withdrawTokens);

  const launchBtn = document.querySelector('[onclick="launchToken()"]');
  if (launchBtn) launchBtn.addEventListener("click", launchToken);

  const nftBtn = document.getElementById("claimCertificate");
  if (nftBtn) nftBtn.addEventListener("click", mintNFTCertificate);
};

// Connect Wallet
async function connectWallet() {
  if (!window.ethereum) return alert("Please install MetaMask.");
  provider = new ethers.providers.Web3Provider(window.ethereum);
  await provider.send("eth_requestAccounts", []);
  signer = provider.getSigner();
  contract = new ethers.Contract(KLY_TOKEN_ADDRESS, KLY_ABI, signer);
  const address = await signer.getAddress();
  alert("Wallet connected: " + address);
  fetchKLYStats();
}

// Token Stats
async function fetchKLYStats() {
  try {
    const address = await signer.getAddress();
    const totalSupply = await contract.totalSupply();
    const balance = await contract.balanceOf(address);

    document.getElementById("totalSupply").innerText = ethers.utils.formatUnits(totalSupply, 18) + " KLY";
    document.getElementById("userBalance").innerText = ethers.utils.formatUnits(balance, 18) + " KLY";
  } catch (error) {
    console.error("Error fetching stats:", error);
  }
}

// Stake
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

// Claim Rewards
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

// Withdraw
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

// Launch Token (placeholder)
function launchToken() {
  const name = document.getElementById("tokenName").value;
  const symbol = document.getElementById("tokenSymbol").value;
  const supply = document.getElementById("tokenSupply").value;
  alert(`Launching token: ${name} (${symbol}) with ${supply} supply. Coming soon.`);
}

// Mint NFT
async function mintNFTCertificate() {
  if (!window.ethereum) return alert("Please connect MetaMask.");

  const provider = new ethers.providers.Web3Provider(window.ethereum);
  await provider.send("eth_requestAccounts", []);
  const signer = provider.getSigner();
  const contract = new ethers.Contract(NFT_CONTRACT_ADDRESS, NFT_ABI, signer);
  const user = await signer.getAddress();

  try {
    const tx = await contract.mint(user, -887220, 887220, ethers.utils.parseUnits("1", 18), "0x");
    await tx.wait();
    alert("NFT Certificate Successfully Minted!");
  } catch (err) {
    console.error(err);
    alert("Transaction failed. Make sure you have at least 1 KLY.");
  }
}
