const connectBtn = document.getElementById("connectWallet");
const walletAddressEl = document.getElementById("walletAddress");
const accessStatus = document.getElementById("accessStatus");
const dashboard = document.getElementById("dashboardStats");
const refreshBtn = document.getElementById("refreshData");

const KLY_TOKEN_ADDRESS = "0x2e4fEB2Fe668c8Ebe84f19e6c8fE8Cf8131B4E52";
const STAKING_CONTRACT = "0x25548Ba29a0071F30E4bDCd98Ea72F79341b07a1";
const BSC_API_KEY = "3GA78IZXNIRMUYZ7KF2HRF9N9YZJJY95K2";
let provider, signer, address, sdk;

async function connectWallet() {
  if (!window.ethereum) {
    accessStatus.textContent = "MetaMask not found!";
    return;
  }

  try {
    provider = new ethers.providers.Web3Provider(window.ethereum);
    await provider.send("eth_requestAccounts", []);
    signer = provider.getSigner();
    address = await signer.getAddress();

    const network = await provider.getNetwork();
    if (network.chainId !== 56) await switchToBSC();

    sdk = new thirdweb.ThirdwebSDK(signer, {
      clientId: BSC_API_KEY,
      chain: "binance"
    });

    walletAddressEl.textContent = address.slice(0, 6) + "..." + address.slice(-4);
    walletAddressEl.style.display = "inline-block";
    accessStatus.textContent = "Wallet: Connected";
    dashboard.style.display = "block";
    refreshBtn.style.display = "inline-block";

    await fetchDashboardStats();

  } catch (err) {
    console.error("Wallet connection error:", err);
    accessStatus.textContent = "Connection failed";
  }
}

async function switchToBSC() {
  try {
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: "0x38" }]
    });
  } catch (switchError) {
    if (switchError.code === 4902) {
      await window.ethereum.request({
        method: "wallet_addEthereumChain",
        params: [{
          chainId: "0x38",
          chainName: "Binance Smart Chain",
          rpcUrls: ["https://bsc-dataseed.binance.org/"],
          nativeCurrency: { name: "BNB", symbol: "BNB", decimals: 18 },
          blockExplorerUrls: ["https://bscscan.com"]
        }]
      });
    } else {
      throw new Error("User rejected network switch.");
    }
  }
}

async function fetchDashboardStats() {
  try {
    const klyAbi = [
      { constant: true, inputs: [{ name: "owner", type: "address" }], name: "balanceOf", outputs: [{ name: "", type: "uint256" }], type: "function" },
      { constant: true, inputs: [], name: "totalSupply", outputs: [{ name: "", type: "uint256" }], type: "function" }
    ];

    const klyContract = new ethers.Contract(KLY_TOKEN_ADDRESS, klyAbi, provider);
    const rawBalance = await klyContract.balanceOf(address);
    const totalSupply = await klyContract.totalSupply();

    const staking = await sdk.getContract(STAKING_CONTRACT);
    const stakeInfo = await staking.call("getStakeInfo", [address]);
    const rewards = await staking.call("getRewardInfo", [address]);
    const totalStaked = await staking.call("getTotalStakedSupply");

    document.getElementById("userBalance").textContent = ethers.utils.formatEther(rawBalance);
    document.getElementById("userStaked").textContent = ethers.utils.formatEther(stakeInfo[0]);
    document.getElementById("userRewards").textContent = ethers.utils.formatEther(rewards.toString());
    document.getElementById("votingPower").textContent = ethers.utils.formatEther(rawBalance);
    document.getElementById("totalSupply").textContent = parseFloat(ethers.utils.formatEther(totalSupply)).toFixed(2);
    document.getElementById("stakedAmount").textContent = ethers.utils.formatEther(totalStaked);

    await fetchTokenHolders();

  } catch (err) {
    console.error("Failed to load dashboard stats:", err);
  }
}

async function fetchTokenHolders() {
  try {
    const response = await fetch(`https://api.bscscan.com/api?module=token&action=tokenholdercount&contractaddress=${KLY_TOKEN_ADDRESS}&apikey=${BSC_API_KEY}`);
    const data = await response.json();
    if (data.status === "1") {
      document.getElementById("holders").textContent = data.result;
    } else {
      document.getElementById("holders").textContent = "Unavailable";
    }
  } catch (err) {
    console.error("Error fetching token holders:", err);
    document.getElementById("holders").textContent = "Error";
  }
}

connectBtn.addEventListener("click", connectWallet);
refreshBtn.addEventListener("click", fetchDashboardStats);
