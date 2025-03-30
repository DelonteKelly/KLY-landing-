import { ethers } from "https://cdn.ethers.io/lib/ethers-5.2.esm.min.js";

// ----------- CONFIG -------------
const KLY_TOKEN_ADDRESS = "0x2e4fEB2Fe668c8Ebe84f19e6c8fE8Cf8131B4E52";
const STAKING_CONTRACT_ADDRESS = "0x25548Ba29a0071F30E4bDCd98Ea72F79341b07a1";
const USDT_TOKEN_ADDRESS = "0x55d398326f99059fF775485246999027B3197955";
const ROUTER_ADDRESS = "0xD99D1c33F9fC3444f8101754aBC46c52416550D1"; // Pancake V3 Test Router

// ----------- ABIs ---------------
const KLY_ABI = [...]; // Insert full ABI here
const STAKING_ABI = [...]; // Insert full ABI here
const ROUTER_ABI = [...]; // Insert PancakeRouter ABI here

// ----------- Functions ----------
async function connectWallet() {
    if (!window.ethereum) return alert("Please install MetaMask");
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    await provider.send("eth_requestAccounts", []);
    const signer = provider.getSigner();
    return { provider, signer, address: await signer.getAddress() };
}

async function loadTokenStats() {
    const { provider, address } = await connectWallet();
    const contract = new ethers.Contract(KLY_TOKEN_ADDRESS, KLY_ABI, provider);
    const [totalSupply, balance] = await Promise.all([
        contract.totalSupply(),
        contract.balanceOf(address)
    ]);
    document.getElementById("total-supply").innerText = ethers.utils.formatUnits(totalSupply, 18) + " KLY";
    document.getElementById("user-balance").innerText = ethers.utils.formatUnits(balance, 18) + " KLY";
}

async function stakeTokens() {
    const { provider, signer, address } = await connectWallet();
    const amount = document.getElementById("stake-amount").value;
    const token = new ethers.Contract(KLY_TOKEN_ADDRESS, KLY_ABI, signer);
    const staking = new ethers.Contract(STAKING_CONTRACT_ADDRESS, STAKING_ABI, signer);

    const amountWei = ethers.utils.parseUnits(amount, 18);
    await token.approve(STAKING_CONTRACT_ADDRESS, amountWei);
    await staking.stake(amountWei);
    alert("Staked successfully!");
}

async function withdrawTokens() {
    const { signer } = await connectWallet();
    const staking = new ethers.Contract(STAKING_CONTRACT_ADDRESS, STAKING_ABI, signer);
    await staking.withdraw();
    alert("Withdrawn successfully!");
}

async function claimRewards() {
    const { signer } = await connectWallet();
    const staking = new ethers.Contract(STAKING_CONTRACT_ADDRESS, STAKING_ABI, signer);
    await staking.claimRewards();
    alert("Rewards claimed!");
}

async function launchToken() {
    const name = document.getElementById("token-name").value;
    const symbol = document.getElementById("token-symbol").value;
    const supply = document.getElementById("token-supply").value;
    // Hook to Thirdweb launch code or your factory logic
    alert(`Launching ${name} (${symbol}) with ${supply} supply`);
}

async function addLiquidity() {
    const { signer } = await connectWallet();
    const router = new ethers.Contract(ROUTER_ADDRESS, ROUTER_ABI, signer);
    const tokenA = new ethers.Contract(KLY_TOKEN_ADDRESS, KLY_ABI, signer);
    const tokenB = new ethers.Contract(USDT_TOKEN_ADDRESS, KLY_ABI, signer);

    const klyAmount = document.getElementById("kly-amount").value;
    const usdtAmount = document.getElementById("usdt-amount").value;
    const klyWei = ethers.utils.parseUnits(klyAmount, 18);
    const usdtWei = ethers.utils.parseUnits(usdtAmount, 18);

    await tokenA.approve(ROUTER_ADDRESS, klyWei);
    await tokenB.approve(ROUTER_ADDRESS, usdtWei);

    await router.addLiquidity(
        KLY_TOKEN_ADDRESS,
        USDT_TOKEN_ADDRESS,
        klyWei,
        usdtWei,
        0,
        0,
        await signer.getAddress(),
        Math.floor(Date.now() / 1000) + 60
    );

    alert("Liquidity added successfully!");
}

async function removeLiquidity() {
    // Implement logic if you have LP token ID or NFT
    alert("Remove liquidity coming soon");
}

// Auto-load on connect
window.addEventListener('load', loadTokenStats);

// Bind buttons
document.getElementById("stake-btn").onclick = stakeTokens;
document.getElementById("withdraw-btn").onclick = withdrawTokens;
document.getElementById("claim-btn").onclick = claimRewards;
document.getElementById("launch-btn").onclick = launchToken;
document.getElementById("add-liquidity-btn").onclick = addLiquidity;
document.getElementById("remove-liquidity-btn").onclick = removeLiquidity;
