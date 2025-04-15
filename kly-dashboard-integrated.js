<script type="module">
  import { ethers } from "https://cdn.jsdelivr.net/npm/ethers@5.7.2/dist/ethers.esm.min.js";

  // ========== Contract Addresses ==========
  const KLY_TOKEN = "0x2e4fEB2Fe668c8Ebe84f19e6c8fE8Cf8131B4E52";
  const USDT_TOKEN = "0x55d398326f99059fF775485246999027B3197955";
  const STAKING_CONTRACT = "0x25548Ba29a0071F30E4bDCd98Ea72F79341b07a1";
  const DAO_CONTRACT = "0x796Bce7F95662774243177D1F546eBA0B3465579";
  const NFT_URI = "ipfs://bafybeihkmkaf2mgx7xkrnkhmzd2uvhr6ddgj6z3vkqcgnvlaa3z7x263r4";
  const BSC_API_KEY = "3GA78IZXNIRMUYZ7KF2HRF9N9YZJJY95K2";

  // ========== ABI Definitions ==========
  const ERC20_ABI = [
    { name: "balanceOf", type: "function", stateMutability: "view", inputs: [{ name: "owner", type: "address" }], outputs: [{ type: "uint256" }] },
    { name: "decimals", type: "function", stateMutability: "view", inputs: [], outputs: [{ type: "uint8" }] },
    { name: "symbol", type: "function", stateMutability: "view", inputs: [], outputs: [{ type: "string" }] },
    { name: "approve", type: "function", stateMutability: "nonpayable", inputs: [{ name: "spender", type: "address" }, { name: "amount", type: "uint256" }], outputs: [{ type: "bool" }] }
  ];

  const STAKING_ABI = [
    { name: "getStakeInfo", type: "function", stateMutability: "view", inputs: [{ name: "", type: "address" }], outputs: [{ name: "staked", type: "uint256" }, { name: "timestamp", type: "uint256" }] },
    { name: "getRewardInfo", type: "function", stateMutability: "view", inputs: [{ name: "", type: "address" }], outputs: [{ type: "uint256" }] },
    { name: "getTotalStakedSupply", type: "function", stateMutability: "view", inputs: [], outputs: [{ type: "uint256" }] },
    { name: "stake", type: "function", stateMutability: "nonpayable", inputs: [{ name: "amount", type: "uint256" }], outputs: [] },
    { name: "withdraw", type: "function", stateMutability: "nonpayable", inputs: [{ name: "amount", type: "uint256" }], outputs: [] },
    { name: "claim", type: "function", stateMutability: "nonpayable", inputs: [], outputs: [] }
  ];

  const DAO_ABI = [
    { name: "getAllProposals", type: "function", stateMutability: "view", inputs: [], outputs: [{ type: "tuple[]", components: [ 
      { name: "proposalId", type: "uint256" }, 
      { name: "description", type: "string" }, 
      { name: "votesFor", type: "uint256" }, 
      { name: "votesAgainst", type: "uint256" }, 
      { name: "votesAbstain", type: "uint256" }, 
      { name: "executed", type: "bool" } 
    ] }] },
    { name: "propose", type: "function", stateMutability: "nonpayable", inputs: [{ name: "description", type: "string" }], outputs: [] },
    { name: "castVote", type: "function", stateMutability: "nonpayable", inputs: [{ name: "proposalId", type: "uint256" }, { name: "vote", type: "uint8" }], outputs: [] },
    { name: "execute", type: "function", stateMutability: "nonpayable", inputs: [{ name: "proposalId", type: "uint256" }], outputs: [] }
  ];

  let provider, signer, wallet;

  async function connectWallet() {
    if (!window.ethereum) {
      alert("Please install MetaMask to use this feature.");
      return;
    }

    provider = new ethers.providers.Web3Provider(window.ethereum);
    await provider.send("eth_requestAccounts", []);
    signer = provider.getSigner();
    wallet = await signer.getAddress();

    document.getElementById("walletAddress").textContent = wallet.slice(0, 6) + "..." + wallet.slice(-4);
    document.getElementById("walletStatus").textContent = "Wallet: Connected";

    await updateDashboardStats();
    await fetchKLYHolderCount();
  }

  async function getKLYBalance() {
    const contract = new ethers.Contract(KLY_TOKEN, ERC20_ABI, provider);
    const decimals = await contract.decimals();
    const balance = await contract.balanceOf(wallet);
    return parseFloat(ethers.utils.formatUnits(balance, decimals));
  }

  async function getKLYTotalSupply() {
    const contract = new ethers.Contract(KLY_TOKEN, ERC20_ABI, provider);
    const decimals = await contract.decimals();
    const supply = await contract.totalSupply();
    return parseFloat(ethers.utils.formatUnits(supply, decimals));
  }

  async function updateDashboardStats() {
    const [balance, supply] = await Promise.all([getKLYBalance(), getKLYTotalSupply()]);
    document.getElementById("userBalance").textContent = balance.toFixed(2) + " KLY";
    document.getElementById("totalSupply").textContent = supply.toLocaleString();
  }

  async function fetchKLYHolderCount() {
    try {
      const res = await fetch(`https://api.bscscan.com/api?module=token&action=tokeninfo&contractaddress=${KLY_TOKEN}&apikey=${BSC_API_KEY}`);
      const data = await res.json();
      const holders = data.result?.[0]?.holders ?? "N/A";
      document.getElementById("holdersStat").textContent = holders.toLocaleString();
    } catch (error) {
      console.error("Error fetching holder count:", error);
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("connectWallet")?.addEventListener("click", connectWallet);

    if (window.ethereum?.selectedAddress) {
      connectWallet();
    }
  });
</script>
