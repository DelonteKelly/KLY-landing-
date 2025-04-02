<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>KLY Staking DApp</title>
  <script src="https://cdn.jsdelivr.net/npm/web3@1.8.2/dist/web3.min.js"></script>
  <script src="https://sdk.vercel.thirdweb.com/thirdweb/latest/thirdweb.umd.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/ethers@5.7.2/dist/ethers.umd.min.js"></script>
</head>
<body>

<section id="launchTokenSection" class="section">
  <h2 class="section-title">Launch Your Own Token</h2>
  <p>Fill in your token details to deploy instantly on BNB Smart Chain.</p>
  <input type="text" id="tokenName" placeholder="Token Name" />
  <input type="text" id="tokenSymbol" placeholder="Token Symbol" />
  <input type="number" id="tokenSupply" placeholder="Total Supply" />
  <button id="launchTokenBtn" class="action-btn">Launch My Token</button>
</section>

<script>
  const CONFIG = {
    KLY_TOKEN: "0x2e4fEB2Fe668c8Ebe84f19e6c8fE8Cf8131B4E52",
    STAKING_CONTRACT: "0xa8380b1311B9316dbf87D5110E8CC35BcB835056",
    CHAIN_ID: 56
  };

  let web3;
  let accounts = [];
  let klyTokenContract;
  let stakingContract;

  const tokenABI = [
    { constant: true, inputs: [], name: "totalSupply", outputs: [{ name: "", type: "uint256" }], type: "function" },
    { constant: true, inputs: [{ name: "account", type: "address" }], name: "balanceOf", outputs: [{ name: "", type: "uint256" }], type: "function" },
    { constant: false, inputs: [{ name: "spender", type: "address" }, { name: "amount", type: "uint256" }], name: "approve", outputs: [{ name: "", type: "bool" }], type: "function" }
  ];

  const stakingABI = [
    { constant: false, inputs: [{ name: "amount", type: "uint256" }], name: "stake", outputs: [], type: "function" },
    { constant: false, inputs: [], name: "claimRewards", outputs: [], type: "function" },
    { constant: false, inputs: [], name: "withdraw", outputs: [], type: "function" }
  ];

  window.addEventListener("DOMContentLoaded", () => {
    const connectBtn = document.getElementById("connectWallet");
    const stakeBtn = document.getElementById("stakeButton");
    const claimBtn = document.getElementById("claimButton");
    const withdrawBtn = document.getElementById("withdrawButton");

    if (connectBtn) connectBtn.onclick = init;
    if (stakeBtn) stakeBtn.onclick = stakeTokens;
    if (claimBtn) claimBtn.onclick = claimRewards;
    if (withdrawBtn) withdrawBtn.onclick = withdrawTokens;

    const client = new thirdweb.ThirdwebSDK("binance");

    const launchBtn = document.getElementById("launchTokenBtn");
    if (launchBtn) {
      launchBtn.addEventListener("click", async () => {
        const name = document.getElementById("tokenName").value.trim();
        const symbol = document.getElementById("tokenSymbol").value.trim();
        const supply = document.getElementById("tokenSupply").value.trim();

        if (!name || !symbol || !supply || isNaN(supply) || Number(supply) <= 0) {
          alert("Please enter valid token information.");
          return;
        }

        try {
          const wallet = await thirdweb.connect("injected");
          const signer = await wallet.getSigner();

          const deployedToken = await client.deployer.deployToken({
            name,
            symbol,
            total_supply: supply,
            primary_sale_recipient: signer.address,
            platform_fee_basis_points: 500,
            platform_fee_recipient: signer.address // Use wallet address instead of token contract
          });

          alert("Token Launched Successfully!\\n\\nAddress:\\n" + deployedToken);
        } catch (err) {
          console.error("Token launch failed:", err);
          alert("Token launch failed. Check console and wallet.");
        }
      });
    }
  });

  async function init() {
    if (!window.ethereum) {
      alert("MetaMask is not installed.");
      return;
    }

    web3 = new Web3(window.ethereum);
    accounts = await window.ethereum.request({ method: "eth_requestAccounts" });

    await switchToBSC();

    klyTokenContract = new web3.eth.Contract(tokenABI, CONFIG.KLY_TOKEN);
    stakingContract = new web3.eth.Contract(stakingABI, CONFIG.STAKING_CONTRACT);

    document.getElementById("connectWallet").textContent = \`\${accounts[0].slice(0, 6)}...\${accounts[0].slice(-4)}\`;
  }

  async function switchToBSC() {
    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: "0x38" }]
      });
    } catch (e) {
      if (e.code === 4902) {
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
      }
    }
  }

  async function stakeTokens() {
    const stakeAmountInput = document.getElementById("stakeAmount");
    const amount = stakeAmountInput.value;
    if (!amount || parseFloat(amount) <= 0) return alert("Enter a valid amount");
    const amountWei = web3.utils.toWei(amount, "ether");

    try {
      await klyTokenContract.methods.approve(CONFIG.STAKING_CONTRACT, amountWei).send({ from: accounts[0] });
      await stakingContract.methods.stake(amountWei).send({ from: accounts[0] });
      alert("Staked successfully!");
    } catch (err) {
      console.error(err);
      alert("Stake failed");
    }
  }

  async function claimRewards() {
    try {
      await stakingContract.methods.claimRewards().send({ from: accounts[0] });
      alert("Rewards claimed!");
    } catch (err) {
      console.error(err);
      alert("Claim failed");
    }
  }

  async function withdrawTokens() {
    try {
      await stakingContract.methods.withdraw().send({ from: accounts[0] });
      alert("Withdrawn successfully!");
    } catch (err) {
      console.error(err);
      alert("Withdraw failed");
    }
  }

  document.getElementById("verifyAccessBtn")?.addEventListener("click", async () => {
    const requiredAmount = "500";
    const tokenAddress = CONFIG.KLY_TOKEN;

    try {
      const wallet = await thirdweb.connect("injected");
      const address = await wallet.getAddress();

      const sdk = new thirdweb.ThirdwebSDK(wallet, "binance");
      const token = await sdk.getToken(tokenAddress);
      const balance = await token.balanceOf(address);

      const required = ethers.utils.parseUnits(requiredAmount, 18);

      if (balance.gte(required)) {
        document.getElementById("courseContent").style.display = "block";
        document.getElementById("verifyAccessBtn").style.display = "none";
        document.getElementById("lockedMessage").textContent = "";
      } else {
        document.getElementById("lockedMessage").textContent =
          \`Access denied: You need at least \${requiredAmount} KLY. Your balance is \${ethers.utils.formatUnits(balance, 18)}.\`;
      }
    } catch (err) {
      console.error("Access check failed:", err);
      document.getElementById("lockedMessage").textContent =
        "Error verifying access. Make sure your wallet is connected and try again.";
    }
  });
</script>

</body>
</html>
