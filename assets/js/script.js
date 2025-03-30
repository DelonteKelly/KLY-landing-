const KLY_TOKEN_ADDRESS = "0x2e4fEB2Fe668c8Ebe84f19e6c8fE8Cf8131B4E52";
const NFT_CONTRACT_ADDRESS = "0xDA76d35742190283E340dbeE2038ecc978a56950";

let provider;
let signer;
let userAddress;

async function connectWallet() {
  if (window.ethereum) {
    provider = new ethers.providers.Web3Provider(window.ethereum);
    await provider.send("eth_requestAccounts", []);
    signer = provider.getSigner();
    userAddress = await signer.getAddress();
    document.getElementById("connectWallet").innerText = "Wallet Connected";
    loadTokenStats();
  } else {
    alert("MetaMask is not installed.");
  }
}

async function loadTokenStats() {
  const abi = [
    "function totalSupply() view returns (uint256)",
    "function balanceOf(address) view returns (uint256)"
  ];
  const token = new ethers.Contract(KLY_TOKEN_ADDRESS, abi, provider);

  const supply = await token.totalSupply();
  const balance = await token.balanceOf(userAddress);

  document.querySelector("p:nth-of-type(1)").innerText = `Total Supply: ${ethers.utils.formatUnits(supply, 18)} KLY`;
  document.querySelector("p:nth-of-type(2)").innerText = `Your Balance: ${ethers.utils.formatUnits(balance, 18)} KLY`;
}

function startCourse() {
  window.location.href = "/course/index.html"; // update with your actual course path
}

async function claimNFT() {
  if (!signer) return alert("Connect your wallet first");

  const nftAbi = [
    "function mint(address to, int24 tickLower, int24 tickUpper, uint256 amount, bytes calldata data)"
  ];
  const nft = new ethers.Contract(NFT_CONTRACT_ADDRESS, nftAbi, signer);

  try {
    const tx = await nft.mint(userAddress, -276330, 276330, ethers.utils.parseUnits("1", 18), "0x");
    await tx.wait();
    alert("NFT Certificate minted successfully!");
  } catch (err) {
    console.error(err);
    alert("Minting failed. You may already have the certificate or lack funds.");
  }
}

document.getElementById("connectWallet").addEventListener("click", connectWallet);
