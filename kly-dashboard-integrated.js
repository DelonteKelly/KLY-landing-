
// KLY Dashboard Integrated JS
// Dependencies: ethers v5 + MetaMask

// Constants
const KLY_ADDRESS = "0x2e4fEB2Fe668c8Ebe84f19e6c8fE8Cf8131B4E52";
const STAKING_CONTRACT = "0x25548Ba29a0071F30E4bDCd98Ea72F79341b07a1";
const NFT_CONTRACT = "0xc1a2E9A475779EfD04247EA473638717E26cd5C5";
const NFT_URI = "ipfs://bafybeihkmkaf2mgx7xkrnkhmzd2uvhr6ddgj6z3vkqcgnvlaa3z7x263r4";

// ABIs
const KLY_ABI = [
  { constant: true, inputs: [{ name: "account", type: "address" }], name: "balanceOf", outputs: [{ name: "", type: "uint256" }], type: "function" },
  { constant: true, inputs: [], name: "totalSupply", outputs: [{ name: "", type: "uint256" }], type: "function" },
  { constant: true, inputs: [], name: "decimals", outputs: [{ name: "", type: "uint8" }], type: "function" },
  { constant: true, inputs: [], name: "symbol", outputs: [{ name: "", type: "string" }], type: "function" }
];

const NFT_ABI = [
  { "inputs": [{ "internalType": "address", "name": "_to", "type": "address" }, { "internalType": "string", "name": "_uri", "type": "string" }], "name": "mintTo", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "nonpayable", "type": "function" },
  { "inputs": [{ "internalType": "address", "name": "owner", "type": "address" }], "name": "balanceOf", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" }
];

const STAKING_ABI = [
  { "inputs": [{ "internalType": "address", "name": "", "type": "address" }], "name": "getStakeInfo", "outputs": [{ "internalType": "uint256", "name": "staked", "type": "uint256" }, { "internalType": "uint256", "name": "timestamp", "type": "uint256" }], "stateMutability": "view", "type": "function" },
  { "inputs": [{ "internalType": "address", "name": "", "type": "address" }], "name": "getRewardInfo", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" },
  { "inputs": [], "name": "getTotalStakedSupply", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" }
];

// Global Variables
let provider, signer, wallet;

// Wallet Connection
async function connectWallet() {
  if (!window.ethereum) return alert("Please install MetaMask");

  provider = new ethers.providers.Web3Provider(window.ethereum);
  await provider.send("eth_requestAccounts", []);
  signer = provider.getSigner();
  wallet = await signer.getAddress();
  return wallet;
}

// Get KLY Token Balance
async function getKLYBalance() {
  const contract = new ethers.Contract(KLY_ADDRESS, KLY_ABI, provider);
  const decimals = await contract.decimals();
  const balance = await contract.balanceOf(wallet);
  return parseFloat(ethers.utils.formatUnits(balance, decimals));
}

// Get KLY Total Supply
async function getKLYTotalSupply() {
  const contract = new ethers.Contract(KLY_ADDRESS, KLY_ABI, provider);
  const decimals = await contract.decimals();
  const supply = await contract.totalSupply();
  return parseFloat(ethers.utils.formatUnits(supply, decimals));
}

// Mint Genesis NFT
async function mintGenesisNFT() {
  const contract = new ethers.Contract(NFT_CONTRACT, NFT_ABI, signer);
  const owned = await contract.balanceOf(wallet);
  if (owned.toString() !== "0") return "Already minted";

  const tx = await contract.mintTo(wallet, NFT_URI);
  await tx.wait();
  return "Mint successful";
}

// Get Staking Stats
async function getStakingStats() {
  const staking = new ethers.Contract(STAKING_CONTRACT, STAKING_ABI, provider);
  const info = await staking.getStakeInfo(wallet);
  const rewards = await staking.getRewardInfo(wallet);
  const total = await staking.getTotalStakedSupply();
  return {
    staked: ethers.utils.formatEther(info.staked),
    rewards: ethers.utils.formatEther(rewards),
    totalStaked: ethers.utils.formatEther(total)
  };
}

// Expose globally
window.connectWallet = connectWallet;
window.getKLYBalance = getKLYBalance;
window.getKLYTotalSupply = getKLYTotalSupply;
window.mintGenesisNFT = mintGenesisNFT;
window.getStakingStats = getStakingStats;
