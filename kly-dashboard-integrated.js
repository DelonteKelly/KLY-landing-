
import { ethers } from "https://cdn.jsdelivr.net/npm/ethers@5.7.2/dist/ethers.esm.min.js";

// Addresses
const KLY_TOKEN = "0x2e4fEB2Fe668c8Ebe84f19e6c8fE8Cf8131B4E52";
const STAKING_CONTRACT = "0x25548Ba29a0071F30E4bDCd98Ea72F79341b07a1";
const DAO_CONTRACT = "0x796Bce7F95662774243177D1F546eBA0B3465579";
const BSC_API_KEY = "3GA78IZXNIRMUYZ7KF2HRF9N9YZJJY95K2";

// ABIs
const ERC20_ABI = [
  { name: "balanceOf", type: "function", stateMutability: "view", inputs: [{ name: "account", type: "address" }], outputs: [{ type: "uint256" }] },
  { name: "decimals", type: "function", stateMutability: "view", inputs: [], outputs: [{ type: "uint8" }] },
  { name: "totalSupply", type: "function", stateMutability: "view", inputs: [], outputs: [{ type: "uint256" }] },
  { name: "approve", type: "function", stateMutability: "nonpayable", inputs: [{ name: "spender", type: "address" }, { name: "amount", type: "uint256" }], outputs: [{ type: "bool" }] }
];

const STAKING_ABI = [
  { name: "getStakeInfo", type: "function", stateMutability: "view", inputs: [{ name: "", type: "address" }], outputs: [{ name: "staked", type: "uint256" }, { name: "timestamp", type: "uint256" }] },
  { name: "getTotalStakedSupply", type: "function", stateMutability: "view", inputs: [], outputs: [{ type: "uint256" }] },
  { name: "stake", type: "function", stateMutability: "nonpayable", inputs: [{ name: "amount", type: "uint256" }], outputs: [] },
  { name: "withdraw", type: "function", stateMutability: "nonpayable", inputs: [{ name: "amount", type: "uint256" }], outputs: [] },
  { name: "claim", type: "function", stateMutability: "nonpayable", inputs: [], outputs: [] }
];

// State
let provider, signer, wallet;

async function connectWallet() {
  if (!window.ethereum) {
    alert("MetaMask is not installed.");
    return;
  }
  provider = new ethers.providers.Web3Provider(window.ethereum);
  await provider.send("eth_requestAccounts", []);
  signer = provider.getSigner();
  wallet = await signer.getAddress();

  const network = await provider.getNetwork();
  if (network.chainId !== 56) {
    try {
      await window.ethereum.request({ method: "wallet_switchEthereumChain", params: [{ chainId: "0x38" }] });
    } catch (err) {
      if (err.code === 4902) {
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
      } else {
        throw err;
      }
    }
  }

  document.getElementById("walletAddress").textContent = wallet.slice(0, 6) + "..." + wallet.slice(-4);
  document.getElementById("walletAddress").style.display = "block";
  document.getElementById("connectWallet").textContent = "Connected";
  document.getElementById("accessStatus").textContent = "Wallet: Connected";

  await updateDashboardStats();
}

async function getKLYBalance() {
  const contract = new ethers.Contract(KLY_TOKEN, ERC20_ABI, provider);
  const dec = await contract.decimals();
  const bal = await contract.balanceOf(wallet);
  return parseFloat(ethers.utils.formatUnits(bal, dec));
}

async function getTotalSupply() {
  const contract = new ethers.Contract(KLY_TOKEN, ERC20_ABI, provider);
  const dec = await contract.decimals();
  const supply = await contract.totalSupply();
  return parseFloat(ethers.utils.formatUnits(supply, dec));
}

async function getUserStaked() {
  const contract = new ethers.Contract(STAKING_CONTRACT, STAKING_ABI, provider);
  const info = await contract.getStakeInfo(wallet);
  return parseFloat(ethers.utils.formatUnits(info.staked, 18));
}

async function getTotalStaked() {
  const contract = new ethers.Contract(STAKING_CONTRACT, STAKING_ABI, provider);
  const total = await contract.getTotalStakedSupply();
  return parseFloat(ethers.utils.formatUnits(total, 18));
}

async function updateDashboardStats() {
  const [bal, supply, staked, totalStaked] = await Promise.all([
    getKLYBalance(),
    getTotalSupply(),
    getUserStaked(),
    getTotalStaked()
  ]);
  document.getElementById("userBalance").textContent = bal.toFixed(2) + " KLY";
  document.getElementById("totalSupply").textContent = supply.toLocaleString();
  document.getElementById("totalSupplyStat").textContent = supply.toLocaleString();
  document.getElementById("stakedAmountStat").textContent = totalStaked.toLocaleString();
}

async function stakeKLY(amount) {
  const amt = ethers.utils.parseEther(amount.toString());
  const kly = new ethers.Contract(KLY_TOKEN, ERC20_ABI, signer);
  const staking = new ethers.Contract(STAKING_CONTRACT, STAKING_ABI, signer);

  await (await kly.approve(STAKING_CONTRACT, amt)).wait();
  await (await staking.stake(amt)).wait();

  alert("Staked successfully");
  await updateDashboardStats();
}

async function withdrawKLY(amount) {
  const amt = ethers.utils.parseEther(amount.toString());
  const staking = new ethers.Contract(STAKING_CONTRACT, STAKING_ABI, signer);
  await (await staking.withdraw(amt)).wait();
  alert("Withdrawn successfully");
  await updateDashboardStats();
}

async function claimRewards() {
  const staking = new ethers.Contract(STAKING_CONTRACT, STAKING_ABI, signer);
  await (await staking.claim()).wait();
  alert("Rewards claimed");
  await updateDashboardStats();
}

// Export to global scope
window.connectWallet = connectWallet;
window.stakeKLY = stakeKLY;
window.withdrawKLY = withdrawKLY;
window.claimRewards = claimRewards;

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("connectWallet").addEventListener("click", connectWallet);
  document.getElementById("refreshData").addEventListener("click", updateDashboardStats);
});

