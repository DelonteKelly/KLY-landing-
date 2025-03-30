
const KLY_TOKEN_ADDRESS = "0x2e4fEB2Fe668c8Ebe84f19e6c8fE8Cf8131B4E52";
const STAKING_CONTRACT_ADDRESS = "0x25548Ba29a0071F30E4bDCd98Ea72F79341b07a1";
const KLY_ABI = [{"inputs":[],"stateMutability":"nonpayable","type":"constructor"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"owner","type":"address"},{"indexed":true,"internalType":"int24","name":"tickLower","type":"int24"},{"indexed":true,"internalType":"int24","name":"tickUpper","type":"int24"},{"indexed":false,"internalType":"uint128","name":"amount","type":"uint128"},{"indexed":false,"internalType":"uint256","name":"amount0","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"amount1","type":"uint256"}],"name":"Burn","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"owner","type":"address"},{"indexed":false,"internalType":"address","name":"recipient","type":"address"},{"indexed":true,"internalType":"int24","name":"tickLower","type":"int24"},{"indexed":true,"internalType":"int24","name":"tickUpper","type":"int24"},{"indexed":false,"internalType":"uint128","name":"amount0","type":"uint128"},{"indexed":false,"internalType":"uint128","name":"amount1","type":"uint128"}],"name":"Collect","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"sender","type":"address"},{"indexed":true,"internalType":"address","name":"recipient","type":"address"},{"indexed":false,"internalType":"uint128","name":"amount0","type":"uint128"},{"indexed":false,"internalType":"uint128","name":"amount1","type":"uint128"}],"name":"CollectProtocol","type":"event"}];

let provider, signer, contract;

document.getElementById("connectWallet").addEventListener("click", connectWallet);

async function connectWallet() {
  if (!window.ethereum) {
    alert("Please install MetaMask.");
    return;
  }
  provider = new ethers.providers.Web3Provider(window.ethereum);
  await provider.send("eth_requestAccounts", []);
  signer = provider.getSigner();
  contract = new ethers.Contract(KLY_TOKEN_ADDRESS, KLY_ABI, signer);
  const address = await signer.getAddress();
  alert("Wallet connected: " + address);
  fetchKLYStats();
}

async function fetchKLYStats() {
  try {
    const totalSupply = await contract.totalSupply();
    const balance = await contract.balanceOf(await signer.getAddress());
    document.getElementById("total-supply").innerText = ethers.utils.formatUnits(totalSupply, 18) + " KLY";
    document.getElementById("user-balance").innerText = ethers.utils.formatUnits(balance, 18) + " KLY";
  } catch (error) {
    console.error("Error fetching stats:", error);
  }
}

async function stakeTokens() {
  const amount = document.getElementById("stakeAmount").value;
  if (!amount) return alert("Enter amount to stake");
  try {
    const stakingContract = new ethers.Contract(STAKING_CONTRACT_ADDRESS, KLY_ABI, signer);
    const tx = await stakingContract.stake(ethers.utils.parseUnits(amount, 18));
    await tx.wait();
    alert("Staked successfully!");
    fetchKLYStats();
  } catch (err) {
    console.error("Staking failed:", err);
  }
}

async function withdrawTokens() {
  try {
    const stakingContract = new ethers.Contract(STAKING_CONTRACT_ADDRESS, KLY_ABI, signer);
    const tx = await stakingContract.withdraw();
    await tx.wait();
    alert("Withdraw successful!");
    fetchKLYStats();
  } catch (err) {
    console.error("Withdraw failed:", err);
  }
}

async function claimRewards() {
  try {
    const stakingContract = new ethers.Contract(STAKING_CONTRACT_ADDRESS, KLY_ABI, signer);
    const tx = await stakingContract.claimRewards();
    await tx.wait();
    alert("Rewards claimed!");
    fetchKLYStats();
  } catch (err) {
    console.error("Claim failed:", err);
  }
}

function launchToken() {
  const name = document.getElementById("tokenName").value;
  const symbol = document.getElementById("tokenSymbol").value;
  const supply = document.getElementById("tokenSupply").value;
  alert(`Launching token: ${name} (${symbol}) with ${supply} supply.`);
}

document.getElementById("claimCertificate").addEventListener("click", async () => {
  const CONTRACT_ADDRESS = "0xDA76d35742190283E340dbeE2038ecc978a56950";
  const ABI = [
    {
      "inputs": [
        { "internalType": "address", "name": "recipient", "type": "address" },
        { "internalType": "int24", "name": "tickLower", "type": "int24" },
        { "internalType": "int24", "name": "tickUpper", "type": "int24" },
        { "internalType": "uint128", "name": "amount", "type": "uint128" },
        { "internalType": "bytes", "name": "data", "type": "bytes" }
      ],
      "name": "mint",
      "outputs": [
        { "internalType": "uint256", "name": "amount0", "type": "uint256" },
        { "internalType": "uint256", "name": "amount1", "type": "uint256" }
      ],
      "stateMutability": "nonpayable",
      "type": "function"
    }
  ];

  try {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    await provider.send("eth_requestAccounts", []);
    const signer = provider.getSigner();
    const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);
    const user = await signer.getAddress();
    const tx = await contract.mint(user, -887220, 887220, ethers.utils.parseUnits("1", 18), "0x");
    await tx.wait();
    alert("NFT Certificate Successfully Minted!");
  } catch (err) {
    console.error(err);
    alert("Transaction failed. Make sure you have at least 1 KLY.");
  }
});
