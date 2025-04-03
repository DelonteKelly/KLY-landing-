<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>KLY Token Launcher</title>
</head>
<body style="font-family: sans-serif; padding: 2rem; background: #0a0a0a; color: white;">
  <h1>KLY Token Launcher</h1>
  <input id="token-name" placeholder="Token Name" style="display:block; margin: 10px 0;" />
  <input id="token-symbol" placeholder="Token Symbol" style="display:block; margin: 10px 0;" />
  <input id="initial-supply" type="number" placeholder="Initial Supply" style="display:block; margin: 10px 0;" />
  <button id="launchBtn">Launch Token</button>
  <p id="launch-status" style="margin-top: 1rem;"></p>

  <script type="module">
    import { ThirdwebSDK } from "https://cdn.skypack.dev/@thirdweb-dev/sdk";
    import { ethers } from "https://cdn.skypack.dev/ethers";

    const chain = "binance";
    const treasuryWallet = "0x2e4fEB2Fe668c8Ebe84f19e6c8fE8Cf8131B4E52";
    let sdk;

    async function connectWallet() {
      try {
        if (!window.ethereum) {
          alert("Please install MetaMask.");
          return;
        }

        const provider = new ethers.BrowserProvider(window.ethereum);
        await provider.send("eth_requestAccounts", []);
        const signer = await provider.getSigner();

        sdk = new ThirdwebSDK(signer, chain);
        console.log("Wallet connected, SDK ready.");
      } catch (err) {
        console.error("Wallet connection failed", err);
        alert("Failed to connect wallet.");
      }
    }

    async function launchToken() {
      const name = document.getElementById("token-name").value;
      const symbol = document.getElementById("token-symbol").value;
      const supply = document.getElementById("initial-supply").value;

      if (!name || !symbol || !supply) {
        alert("Please fill all fields.");
        return;
      }

      try {
        document.getElementById("launch-status").textContent = "Launching token...";
        const tokenAddress = await sdk.deployer.deployToken({
          name,
          symbol,
          primary_sale_recipient: treasuryWallet,
          total_supply: supply.toString()
        });

        document.getElementById("launch-status").textContent = `✅ Token launched at: ${tokenAddress}`;
      } catch (err) {
        console.error("Launch failed", err);
        document.getElementById("launch-status").textContent = "❌ Token launch failed.";
      }
    }

    window.addEventListener("DOMContentLoaded", async () => {
      await connectWallet();
      document.getElementById("launchBtn").addEventListener("click", launchToken);
    });
  </script>
</body>
</html>
