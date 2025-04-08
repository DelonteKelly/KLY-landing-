
import { BrowserProvider, Contract, formatUnits } from "https://cdn.jsdelivr.net/npm/ethers@6.6.4/+esm";

const KLY_ADDRESS = "0x2e4fEB2Fe668c8Ebe84f19e6c8fE8Cf8131B4E52";
const KLY_ABI = [
  {
    constant: true,
    inputs: [{ name: "account", type: "address" }],
    name: "balanceOf",
    outputs: [{ name: "", type: "uint256" }],
    type: "function"
  },
  {
    constant: true,
    inputs: [],
    name: "totalSupply",
    outputs: [{ name: "", type: "uint256" }],
    type: "function"
  },
  {
    constant: true,
    inputs: [],
    name: "decimals",
    outputs: [{ name: "", type: "uint8" }],
    type: "function"
  }
];

let provider, signer, wallet;

export async function connectWallet() {
  try {
    if (!window.ethereum) {
      alert("MetaMask is not installed.");
      return;
    }

    provider = new BrowserProvider(window.ethereum);
    await provider.send("eth_requestAccounts", []);
    signer = await provider.getSigner();
    wallet = await signer.getAddress();

    document.querySelectorAll("[data-connect]").forEach(btn => {
      btn.innerText = "Wallet Connected";
    });

    document.querySelectorAll(".walletAddress").forEach(el => {
      el.innerText = wallet.slice(0, 6) + "..." + wallet.slice(-4);
    });

    loadKLYTokenStats();
  } catch (err) {
    console.error("Wallet connection error:", err);
    alert("Failed to connect wallet.");
  }
}

async function loadKLYTokenStats() {
  try {
    const contract = new Contract(KLY_ADDRESS, KLY_ABI, provider);
    const [decimals, userBal, totalSup] = await Promise.all([
      contract.decimals(),
      contract.balanceOf(wallet),
      contract.totalSupply()
    ]);

    const userBalance = formatUnits(userBal, decimals);
    const totalSupply = formatUnits(totalSup, decimals);

    document.querySelectorAll("#klyWalletBalance").forEach(el => {
      el.innerText = parseFloat(userBalance).toFixed(2) + " KLY";
    });

    document.querySelectorAll("#klyTotalSupply").forEach(el => {
      el.innerText = parseFloat(totalSupply).toLocaleString() + " KLY";
    });
  } catch (err) {
    console.error("Failed to load token stats:", err);
  }
}

// Bind to all buttons on load
window.addEventListener("DOMContentLoaded", () => {
  const connectButtons = document.querySelectorAll("[data-connect]");
  connectButtons.forEach(btn => {
    btn.addEventListener("click", connectWallet);
  });
});
