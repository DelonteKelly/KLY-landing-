<script type="module">
  import { ethers } from "https://cdn.jsdelivr.net/npm/ethers@5.7.2/dist/ethers.esm.min.js";

  // ========== Contract Addresses ==========
  const LP_CONTRACT = "0x0898d22c288eb2cb07c0e75f83f250e7cd97ccbe";
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

  // ========== Wallet Connection ==========
  async function connectWallet() {
    if (!window.ethereum) {
      alert("Please install MetaMask to use this feature.");
      return;
    }

    provider = new ethers.providers.Web3Provider(window.ethereum);
    await provider.send("eth_requestAccounts", []);
    signer = provider.getSigner();
    wallet = await signer.getAddress();

    // Update UI elements
    document.getElementById("walletAddressDisplay").textContent = wallet.slice(0, 6) + "..." + wallet.slice(-4);
    document.getElementById("walletStatus").textContent = "Wallet: Connected";
    document.getElementById("walletAddress").textContent = wallet.slice(0, 6) + "..." + wallet.slice(-4);
    document.getElementById("walletAddress").style.display = "inline-block";
    document.getElementById("accessStatus").textContent = "Wallet: Connected";
    document.getElementById("dashboardStats").style.display = "block";
    document.getElementById("refreshData").style.display = "inline-block";

    // Update all data
    await Promise.all([
      updateLiquidityUI(),
      updateDashboardStats(),
      fetchKLYHolderCount()
    ]);

    // Set up event listeners
    window.ethereum.on("accountsChanged", () => window.location.reload());
    window.ethereum.on("chainChanged", () => window.location.reload());
  }

  // ========== Liquidity Management ==========
  async function getTokenBalance(tokenAddress) {
    const contract = new ethers.Contract(tokenAddress, ERC20_ABI, provider);
    const decimals = await contract.decimals();
    const rawBalance = await contract.balanceOf(wallet);
    return parseFloat(ethers.utils.formatUnits(rawBalance, decimals));
  }

  async function updateLiquidityUI() {
    const [kly, usdt, lp] = await Promise.all([
      getTokenBalance(KLY_TOKEN),
      getTokenBalance(USDT_TOKEN),
      getTokenBalance(LP_CONTRACT)
    ]);

    document.getElementById("klyBalance").textContent = kly.toFixed(2);
    document.getElementById("usdtBalance").textContent = usdt.toFixed(2);
    document.getElementById("lpBalance").textContent = lp.toFixed(2);

    document.getElementById("yourLiquidity").textContent = (kly + usdt).toFixed(2);
    document.getElementById("yourLPTokens").textContent = lp.toFixed(2);
    document.getElementById("poolShare").textContent = ((lp / (kly + usdt + lp)) * 100).toFixed(2);
    document.getElementById("unclaimedFees").textContent = "0.00"; // Placeholder until claim function is live
  }

  // ========== Token Stats ==========
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
    document.getElementById("totalSupplyStat").textContent = supply.toLocaleString();
  }

  // ========== Holders Count ==========
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

  // ========== Staking ==========
  async function getStakingStats() {
    const contract = new ethers.Contract(STAKING_CONTRACT, STAKING_ABI, provider);
    const info = await contract.getStakeInfo(wallet);
    const rewards = await contract.getRewardInfo(wallet);
    const total = await contract.getTotalStakedSupply();
    return {
      staked: ethers.utils.formatEther(info.staked),
      rewards: ethers.utils.formatEther(rewards),
      totalStaked: ethers.utils.formatEther(total)
    };
  }

  async function stakeKLY(amount) {
    const kly = new ethers.Contract(KLY_TOKEN, ERC20_ABI, signer);
    const staking = new ethers.Contract(STAKING_CONTRACT, STAKING_ABI, signer);
    const parsed = ethers.utils.parseEther(amount);
    await kly.approve(STAKING_CONTRACT, parsed);
    const tx = await staking.stake(parsed);
    await tx.wait();
    alert("KLY staked successfully!");
    await updateDashboardStats();
  }

  async function withdrawKLY(amount) {
    const staking = new ethers.Contract(STAKING_CONTRACT, STAKING_ABI, signer);
    const parsed = ethers.utils.parseEther(amount);
    const tx = await staking.withdraw(parsed);
    await tx.wait();
    alert("Withdrawal successful!");
    await updateDashboardStats();
  }

  async function claimRewards() {
    const staking = new ethers.Contract(STAKING_CONTRACT, STAKING_ABI, signer);
    const tx = await staking.claim();
    await tx.wait();
    alert("Rewards claimed!");
    await updateDashboardStats();
  }

  // ========== DAO ==========
  async function getProposals() {
    const dao = new ethers.Contract(DAO_CONTRACT, DAO_ABI, provider);
    return await dao.getAllProposals();
  }

  async function createProposal(description) {
    const dao = new ethers.Contract(DAO_CONTRACT, DAO_ABI, signer);
    const tx = await dao.propose(description);
    await tx.wait();
    alert("Proposal submitted.");
  }

  async function voteOnProposal(proposalId, voteType) {
    const dao = new ethers.Contract(DAO_CONTRACT, DAO_ABI, signer);
    const tx = await dao.castVote(proposalId, voteType);
    await tx.wait();
    alert("Vote recorded.");
  }

  async function executeProposal(proposalId) {
    const dao = new ethers.Contract(DAO_CONTRACT, DAO_ABI, signer);
    const tx = await dao.execute(proposalId);
    await tx.wait();
    alert("Proposal executed.");
  }

  // ========== UI Initialization ==========
  document.addEventListener("DOMContentLoaded", async () => {
    // Wallet connection
    document.getElementById("connectWallet")?.addEventListener("click", connectWallet);
    document.getElementById("connectWallet2")?.addEventListener("click", connectWallet);
    document.getElementById("refreshData")?.addEventListener("click", async () => {
      await Promise.all([
        updateDashboardStats(),
        updateLiquidityUI()
      ]);
    });

    // Staking buttons
    document.getElementById("stakeBtn")?.addEventListener("click", () => stakeKLY(document.getElementById("stakeAmount").value));
    document.getElementById("withdrawBtn")?.addEventListener("click", () => withdrawKLY(document.getElementById("withdrawAmount").value));
    document.getElementById("claimBtn")?.addEventListener("click", claimRewards);

    // Liquidity buttons
    document.querySelector(".add-button")?.addEventListener("click", () => {
      alert("This would initiate an Add Liquidity transaction via PancakeSwap router.");
    });

    document.querySelector(".remove-button")?.addEventListener("click", () => {
      alert("This would initiate a Remove Liquidity transaction.");
    });

    document.querySelector(".claim-button")?.addEventListener("click", () => {
      alert("Claiming fees will be available in the next update.");
    });

    // Slippage button logic
    const slippageOptions = document.querySelectorAll(".slippage-option");
    slippageOptions.forEach((btn) => {
      btn.addEventListener("click", function () {
        slippageOptions.forEach(b => b.classList.remove("active"));
        this.classList.add("active");
        document.querySelector(".custom-slippage").value = this.textContent.replace('%', '');
      });
    });

    document.querySelector(".custom-slippage")?.addEventListener("input", function () {
      slippageOptions.forEach(opt => opt.classList.remove("active"));
    });

    // DAO Voting Buttons
    document.querySelectorAll(".vote-yes").forEach((btn, index) => {
      btn.addEventListener("click", async () => {
        if (!signer) {
          alert("Please connect your wallet first.");
          return;
        }
        try {
          await voteOnProposal(index + 1, 1); // 1 = Yes
          alert("✅ Your YES vote has been submitted.");
        } catch (err) {
          console.error("Vote YES error:", err);
          alert("Error submitting YES vote.");
        }
      });
    });

    document.querySelectorAll(".vote-no").forEach((btn, index) => {
      btn.addEventListener("click", async () => {
        if (!signer) {
          alert("Please connect your wallet first.");
          return;
        }
        try {
          await voteOnProposal(index + 1, 0); // 0 = No
          alert("❌ Your NO vote has been submitted.");
        } catch (err) {
          console.error("Vote NO error:", err);
          alert("Error submitting NO vote.");
        }
      });
    });

    // DAO Execute Proposal Buttons
    document.querySelectorAll(".execute-proposal").forEach((btn) => {
      btn.addEventListener("click", async () => {
        if (!signer) {
          alert("Please connect your wallet first.");
          return;
        }
        const proposalId = parseInt(btn.dataset.id);
        try {
          await executeProposal(proposalId);
          alert("⚡ Proposal executed successfully.");
        } catch (err) {
          console.error("Execution error:", err);
          alert("Error executing proposal.");
        }
      });
    });

    // DAO Proposal Submission
    document.getElementById("submitProposal")?.addEventListener("click", async () => {
      if (!signer) {
        alert("Please connect your wallet first.");
        return;
      }

      const desc = document.getElementById("proposalDesc")?.value.trim();
      if (!desc) {
        alert("Please enter a proposal description.");
        return;
      }

      try {
        await createProposal(desc);
        alert("✅ Proposal submitted to the DAO!");
        document.getElementById("proposalDesc").value = "";
      } catch (err) {
        console.error("Submission error:", err);
        alert("Failed to submit proposal.");
      }
    });

    // Auto-connect if wallet already connected
    if (window.ethereum?.selectedAddress) {
      await connectWallet();
    }
  });

  // ========== Global Access for Dev Tools ==========
  window.KLY = {
    connectWallet,
    getKLYBalance,
    getKLYTotalSupply,
    updateDashboardStats,
    stakeKLY,
    withdrawKLY,
    claimRewards,
    getProposals,
    createProposal,
    voteOnProposal,
    executeProposal,
    updateLiquidityUI,
    getTokenBalance
  };
</script>
