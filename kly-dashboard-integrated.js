<script type="module">
  import { ethers } from "https://cdn.jsdelivr.net/npm/ethers@5.7.2/dist/ethers.esm.min.js";

  const KLY_TOKEN = "0x2e4fEB2Fe668c8Ebe84f19e6c8fE8Cf8131B4E52";
  const STAKING_CONTRACT = "0x25548Ba29a0071F30E4bDCd98Ea72F79341b07a1";
  const DAO_CONTRACT = "0x796Bce7F95662774243177D1F546eBA0B3465579";
  const BSC_API_KEY = "3GA78IZXNIRMUYZ7KF2HRF9N9YZJJY95K2";

  const ERC20_ABI = [
    { name: "balanceOf", type: "function", stateMutability: "view", inputs: [{ name: "account", type: "address" }], outputs: [{ type: "uint256" }] },
    { name: "decimals", type: "function", stateMutability: "view", inputs: [], outputs: [{ type: "uint8" }] },
    { name: "totalSupply", type: "function", stateMutability: "view", inputs: [], outputs: [{ type: "uint256" }] },
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
    if (!window.ethereum) return alert("MetaMask not detected.");
    provider = new ethers.providers.Web3Provider(window.ethereum);
    await provider.send("eth_requestAccounts", []);
    signer = provider.getSigner();
    wallet = await signer.getAddress();

    const shortWallet = wallet.slice(0, 6) + "..." + wallet.slice(-4);
    document.getElementById("walletStatus").textContent = "Wallet: Connected";
    document.getElementById("walletAddress").textContent = shortWallet;
    document.getElementById("accessStatus")?.textContent = "Wallet: Connected";

    await updateDashboardStats();
    await fetchKLYHolderCount();
  }

  async function getKLYBalance() {
    const kly = new ethers.Contract(KLY_TOKEN, ERC20_ABI, provider);
    const dec = await kly.decimals();
    const bal = await kly.balanceOf(wallet);
    return parseFloat(ethers.utils.formatUnits(bal, dec));
  }

  async function getKLYTotalSupply() {
    const kly = new ethers.Contract(KLY_TOKEN, ERC20_ABI, provider);
    const dec = await kly.decimals();
    const supply = await kly.totalSupply();
    return parseFloat(ethers.utils.formatUnits(supply, dec));
  }

  async function updateDashboardStats() {
    const [bal, supply] = await Promise.all([getKLYBalance(), getKLYTotalSupply()]);
    document.getElementById("userBalance").textContent = bal.toFixed(2) + " KLY";
    document.getElementById("totalSupply").textContent = supply.toLocaleString();
    document.getElementById("totalSupplyStat")?.textContent = supply.toLocaleString();
  }

  async function fetchKLYHolderCount() {
    try {
      const res = await fetch(`https://api.bscscan.com/api?module=token&action=tokeninfo&contractaddress=${KLY_TOKEN}&apikey=${BSC_API_KEY}`);
      const data = await res.json();
      const holders = data.result?.[0]?.holders ?? "N/A";
      document.getElementById("holdersStat").textContent = holders.toLocaleString();
    } catch (e) {
      console.error("Holder count error:", e);
    }
  }

  // ===== Staking =====
  async function stakeKLY(amount) {
    const amt = ethers.utils.parseEther(amount);
    const kly = new ethers.Contract(KLY_TOKEN, ERC20_ABI, signer);
    const stake = new ethers.Contract(STAKING_CONTRACT, STAKING_ABI, signer);
    await kly.approve(STAKING_CONTRACT, amt);
    const tx = await stake.stake(amt);
    await tx.wait();
    alert("KLY staked!");
  }

  async function withdrawKLY(amount) {
    const amt = ethers.utils.parseEther(amount);
    const stake = new ethers.Contract(STAKING_CONTRACT, STAKING_ABI, signer);
    const tx = await stake.withdraw(amt);
    await tx.wait();
    alert("KLY withdrawn!");
  }

  async function claimRewards() {
    const stake = new ethers.Contract(STAKING_CONTRACT, STAKING_ABI, signer);
    const tx = await stake.claim();
    await tx.wait();
    alert("Rewards claimed!");
  }

  // ===== DAO =====
  async function createProposal(description) {
    const dao = new ethers.Contract(DAO_CONTRACT, DAO_ABI, signer);
    const tx = await dao.propose(description);
    await tx.wait();
    alert("Proposal submitted.");
  }

  async function voteOnProposal(id, voteType) {
    const dao = new ethers.Contract(DAO_CONTRACT, DAO_ABI, signer);
    const tx = await dao.castVote(id, voteType);
    await tx.wait();
    alert("Vote submitted.");
  }

  async function executeProposal(id) {
    const dao = new ethers.Contract(DAO_CONTRACT, DAO_ABI, signer);
    const tx = await dao.execute(id);
    await tx.wait();
    alert("Proposal executed.");
  }

  // ===== UI Bindings =====
  window.addEventListener("DOMContentLoaded", () => {
    document.getElementById("connectWallet")?.addEventListener("click", connectWallet);
    document.getElementById("refreshData")?.addEventListener("click", updateDashboardStats);
    document.getElementById("stakeBtn")?.addEventListener("click", () => stakeKLY(document.getElementById("stakeAmount").value));
    document.getElementById("withdrawBtn")?.addEventListener("click", () => withdrawKLY(document.getElementById("withdrawAmount").value));
    document.getElementById("claimBtn")?.addEventListener("click", claimRewards);

    document.getElementById("submitProposal")?.addEventListener("click", async () => {
      const desc = document.getElementById("proposalDesc")?.value.trim();
      if (!desc) return alert("Enter proposal description");
      await createProposal(desc);
      document.getElementById("proposalDesc").value = "";
    });

    document.querySelectorAll(".vote-yes").forEach((btn, i) =>
      btn.addEventListener("click", () => voteOnProposal(i + 1, 1))
    );
    document.querySelectorAll(".vote-no").forEach((btn, i) =>
      btn.addEventListener("click", () => voteOnProposal(i + 1, 0))
    );
    document.querySelectorAll(".execute-proposal").forEach((btn) =>
      btn.addEventListener("click", () => executeProposal(parseInt(btn.dataset.id)))
    );

    if (window.ethereum?.selectedAddress) connectWallet();
  });
</script>
