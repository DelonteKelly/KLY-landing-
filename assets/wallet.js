import { BrowserProvider, Contract, formatUnits } from "https://cdn.jsdelivr.net/npm/ethers@6.7.0/+esm";

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
  },
  {
    constant: true,
    inputs: [],
    name: "symbol",
    outputs: [{ name: "", type: "string" }],
    type: "function"
  }
];

let provider, signer, wallet;

export async function connectWallet() {
  try {
    if (!window.ethereum) throw new Error("MetaMask not installed");
    
    provider = new BrowserProvider(window.ethereum);
    const accounts = await provider.send("eth_requestAccounts", []);
    if (!accounts || accounts.length === 0) throw new Error("No accounts found");
    
    signer = await provider.getSigner();
    wallet = await signer.getAddress();
    
    return wallet;
  } catch (error) {
    console.error("Wallet connection failed:", error);
    throw error;
  }
}

export async function getKLYBalance() {
  if (!provider || !wallet) throw new Error("Wallet not connected");
  
  try {
    const contract = new Contract(KLY_ADDRESS, KLY_ABI, provider);
    const [decimals, balance] = await Promise.all([
      contract.decimals(),
      contract.balanceOf(wallet)
    ]);
    return parseFloat(formatUnits(balance, decimals));
  } catch (error) {
    console.error("Failed to get balance:", error);
    throw error;
  }
}

export async function getKLYTotalSupply() {
  if (!provider) throw new Error("Provider not initialized");
  
  try {
    const contract = new Contract(KLY_ADDRESS, KLY_ABI, provider);
    const [decimals, supply] = await Promise.all([
      contract.decimals(),
      contract.totalSupply()
    ]);
    return parseFloat(formatUnits(supply, decimals));
  } catch (error) {
    console.error("Failed to get total supply:", error);
    throw error;
  }
}

// Additional helper function
export async function getKLYSymbol() {
  const contract = new Contract(KLY_ADDRESS, KLY_ABI, provider);
  return await contract.symbol();
}
