// wallet.js
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
  if (!window.ethereum) throw new Error("MetaMask not installed");

  provider = new BrowserProvider(window.ethereum);
  await provider.send("eth_requestAccounts", []);
  signer = await provider.getSigner();
  wallet = await signer.getAddress();

  return wallet;
}

export async function getKLYBalance() {
  const contract = new Contract(KLY_ADDRESS, KLY_ABI, provider);
  const decimals = await contract.decimals();
  const balance = await contract.balanceOf(wallet);
  return parseFloat(formatUnits(balance, decimals));
}

export async function getKLYTotalSupply() {
  const contract = new Contract(KLY_ADDRESS, KLY_ABI, provider);
  const decimals = await contract.decimals();
  const supply = await contract.totalSupply();
  return parseFloat(formatUnits(supply, decimals));
}
