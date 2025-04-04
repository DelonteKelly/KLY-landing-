<!-- Load libraries -->
<script src="https://cdn.jsdelivr.net/npm/web3@1.7.5/dist/web3.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/ethers@6.6.4/dist/ethers.umd.min.js"></script>
<script src="https://cdn.skypack.dev/@thirdweb-dev/sdk@latest"></script>

<!-- Fix wallet + launch logic -->
<script>
  const CONFIG = {
    KLY_TOKEN: "0x2e4fEB2Fe668c8Ebe84f19e6c8fE8Cf8131B4E52",
    TREASURY: "0x2e4fEB2Fe668c8Ebe84f19e6c8fE8Cf8131B4E52"
  };

  let sdk, signer, wallet;

  async function connectWallet() {
    if (!window.ethereum) {
      alert("Please install MetaMask.");
      return;
    }

    const provider = new ethers.BrowserProvider(window.ethereum);
    await provider.send("eth_requestAccounts", []);
    signer = await provider.getSigner();
    wallet = await signer.getAddress();

    sdk = new thirdweb.ThirdwebSDK(signer);

    document.getElementById("walletAddress").textContent = wallet.slice(0, 6) + "..." + wallet.slice(-4);
  }

  async function init() {
    if (!window.ethereum) return;

    const provider = new ethers.BrowserProvider(window.ethereum);
    const accounts = await provider.send("eth_accounts", []);
    if (accounts.length > 0) {
      signer = await provider.getSigner();
      wallet = await signer.getAddress();
      sdk = new thirdweb.ThirdwebSDK(signer);
      document.getElementById("walletAddress").textContent = wallet.slice(0, 6) + "..." + wallet.slice(-4);
    }

    const connectBtn = document.getElementById("connectWallet");
    if (connectBtn) connectBtn.addEventListener("click", connectWallet);

    const launchBtn = document.getElementById("launchTokenBtn");
    if (launchBtn) launchBtn.addEventListener("click", launchToken);
  }

  async function launchToken() {
    const name = document.getElementById("tokenName").value;
    const symbol = document.getElementById("tokenSymbol").value;
    const supply = document.getElementById("initialSupply").value;
    const status = document.getElementById("launchStatus");

    if (!name || !symbol || !supply) {
      status.textContent = "Please fill all fields.";
      return;
    }

    const web3 = new Web3(window.ethereum);
    const kly = new web3.eth.Contract(
      [{ "constant": true, "inputs": [{ "name": "account", "type": "address" }], "name": "balanceOf", "outputs": [{ "name": "", "type": "uint256" }], "type": "function" }],
      CONFIG.KLY_TOKEN
    );

    const balance = await kly.methods.balanceOf(wallet).call();
    const required = web3.utils.toWei("10000", "ether");

    if (BigInt(balance) < BigInt(required)) {
      status.textContent = "Insufficient KLY balance.";
      return;
    }

    try {
      status.textContent = "Launching token...";
      const deployed = await sdk.deployer.deployToken({
        name,
        symbol,
        primary_sale_recipient: wallet,
        total_supply: ethers.parseUnits(supply.toString(), 18).toString()
      });

      const newToken = new web3.eth.Contract(
        [{ "constant": false, "inputs": [{ "name": "recipient", "type": "address" }, { "name": "amount", "type": "uint256" }], "name": "transfer", "outputs": [], "type": "function" }],
        deployed
      );

      const treasuryAmount = web3.utils.toWei((supply * 0.05).toString(), "ether");
      await newToken.methods.transfer(CONFIG.TREASURY, treasuryAmount).send({ from: wallet });

      status.innerHTML = `✅ Token launched at <a href="https://bscscan.com/token/${deployed}" target="_blank">${deployed}</a>`;
    } catch (err) {
      console.error("Launch failed:", err);
      status.textContent = "❌ Token launch failed. See console.";
    }
  }

  window.addEventListener("load", init);
</script>
