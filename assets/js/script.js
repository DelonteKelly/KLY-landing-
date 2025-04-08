<!-- At the bottom of your HTML -->
<script src="https://cdn.jsdelivr.net/npm/ethers@6.6.4/dist/ethers.umd.min.js"></script>
<script>
  const KLY_TOKEN = "0x2e4fEB2Fe668c8Ebe84f19e6c8fE8Cf8131B4E52";
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
    }
  ];

  let provider, signer, walletAddress;

  async function connectWallet() {
    if (!window.ethereum) {
      alert("MetaMask not detected.");
      return;
    }

    try {
      provider = new ethers.BrowserProvider(window.ethereum);
      await provider.send("eth_requestAccounts", []);
      signer = await provider.getSigner();
      walletAddress = await signer.getAddress();

      document.getElementById("walletConnection").innerText = "Wallet Connected";
      document.getElementById("walletConnection").style.color = "lime";
      document.getElementById("walletAddress").innerText =
        walletAddress.slice(0, 6) + "..." + walletAddress.slice(-4);

      updateKLYDashboard();
    } catch (err) {
      console.error("Wallet connect error:", err);
      document.getElementById("walletConnection").innerText = "Connection Failed";
      document.getElementById("walletConnection").style.color = "red";
    }
  }

  async function updateKLYDashboard() {
    try {
      const contract = new ethers.Contract(KLY_TOKEN, KLY_ABI, provider);
      const [supply, balance] = await Promise.all([
        contract.totalSupply(),
        contract.balanceOf(walletAddress)
      ]);

      document.getElementById("klyTotalSupply").innerText =
        ethers.formatEther(supply) + " KLY";
      document.getElementById("klyWalletBalance").innerText =
        ethers.formatEther(balance) + " KLY";
    } catch (err) {
      console.error("Update error:", err);
    }
  }

  window.addEventListener("DOMContentLoaded", () => {
    document.getElementById("connectWallet")?.addEventListener("click", connectWallet);
  });
</script>
