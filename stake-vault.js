<script type="module">
import { ethers } from "./ethers.min.js";
import Web3Modal from "./web3modal.js";
import WalletConnectProvider from "@walletconnect/web3-provider";

// Constants
const KLY_TOKEN_ADDRESS = "0x2e4fEB2Fe668c8Ebe84f19e6c8fE8Cf8131B4E52";
const STAKING_CONTRACT_ADDRESS = "0x7bBa73C25cf5384b58DBA280eCB49c9749437823";
const BSC_CHAIN_ID = 56;

const KLY_TOKEN_ABI = [
    "function balanceOf(address) view returns (uint256)",
    "function decimals() view returns (uint8)",
    "function approve(address spender, uint256 amount) returns (bool)"
];

const STAKING_ABI = [
    "function stake(uint256 amount)",
    "function withdraw(uint256 amount)",
    "function claimRewards()",
    "function getStakedBalance(address user) view returns (uint256)",
    "function getPendingRewards(address user) view returns (uint256)"
];

// State
const state = {
    provider: null,
    web3Modal: null,
    signer: null,
    userAddress: null,
    klyBalance: 0,
    stakedBalance: 0,
    pendingRewards: 0
};

// DOM Elements
const elements = {
    connectBtn: document.getElementById('connect-btn'),
    walletAddress: document.getElementById('wallet-address'),
    walletBalance: document.getElementById('wallet-balance'),
    stakedAmount: document.getElementById('staked-amount'),
    rewardAmount: document.getElementById('reward-amount'),
    stakeSlider: document.getElementById('stake-slider'),
    stakeButton: document.getElementById('stake-button'),
    claimButton: document.getElementById('claim-button'),
    withdrawButton: document.getElementById('withdraw-button'),
    statusMessage: document.getElementById('status-message')
};

// Initialize Web3Modal
async function initWeb3Modal() {
    const providerOptions = {
        walletconnect: {
            package: WalletConnectProvider,
            options: {
                rpc: { 56: "https://bsc-dataseed.binance.org/" },
                chainId: BSC_CHAIN_ID
            }
        }
    };

    state.web3Modal = new Web3Modal({
        cacheProvider: true,
        providerOptions,
        theme: "dark"
    });
}

// Connect Wallet
export async function connectWallet() {
    try {
        setButtonLoading(elements.connectBtn, "Connecting...");
        
        if (!state.web3Modal) await initWeb3Modal();
        const instance = await state.web3Modal.connect();
        state.provider = new ethers.providers.Web3Provider(instance);
        state.signer = state.provider.getSigner();
        state.userAddress = await state.signer.getAddress();

        // Update UI
        elements.walletAddress.textContent = `${state.userAddress.slice(0, 6)}...${state.userAddress.slice(-4)}`;
        setButtonSuccess(elements.connectBtn, "Connected");

        // Check network
        const network = await state.provider.getNetwork();
        if (network.chainId !== BSC_CHAIN_ID) {
            showNotification("Please switch to BSC Mainnet", "warning");
            return;
        }

        // Load balances
        await loadBalances();
        
    } catch (err) {
        console.error("Connection error:", err);
        showNotification(`Connection failed: ${err.message}`, "error");
        resetConnectButton();
    }
}
document.getElementById("stake-button").innerHTML = '<i class="fas fa-lock"></i> STAKE TOKENS';
document.getElementById("stake-button").onclick = stakeTokens;

// Load token and staking balances
async function loadBalances() {
    try {
        // Initialize contracts
        const klyToken = new ethers.Contract(KLY_TOKEN_ADDRESS, KLY_TOKEN_ABI, state.provider);
        const stakingContract = new ethers.Contract(STAKING_CONTRACT_ADDRESS, STAKING_ABI, state.provider);
        
        // Get decimals for formatting
        const decimals = await klyToken.decimals();
        
        // Fetch all balances in parallel
        const [balance, staked, rewards] = await Promise.all([
            klyToken.balanceOf(state.userAddress),
            stakingContract.getStakedBalance(state.userAddress),
            stakingContract.getPendingRewards(state.userAddress)
        ]);
        
        // Update state
        state.klyBalance = parseFloat(ethers.utils.formatUnits(balance, decimals));
        state.stakedBalance = parseFloat(ethers.utils.formatUnits(staked, decimals));
        state.pendingRewards = parseFloat(ethers.utils.formatUnits(rewards, decimals));
        
        // Update UI
        updateBalanceUI();
        
    } catch (err) {
        console.error("Failed to load balances:", err);
        showNotification("Failed to load balance information", "error");
    }
}

// Update balance displays
function updateBalanceUI() {
    elements.walletBalance.textContent = state.klyBalance.toFixed(2);
    elements.stakedAmount.textContent = state.stakedBalance.toFixed(2);
    elements.rewardAmount.textContent = state.pendingRewards.toFixed(2);
    
    // Enable/disable buttons based on balances
    elements.claimButton.disabled = state.pendingRewards <= 0;
    elements.withdrawButton.disabled = state.stakedBalance <= 0;
}

// Stake tokens
export async function stakeTokens() {
    try {
        if (!state.signer) {
            showNotification("Please connect wallet first", "error");
            return;
        }
        
       const percentage = parseFloat(elements.stakeSlider.value);
const amount = (percentage / 100) * state.klyBalance;
        if (amount <= 0 || amount > state.klyBalance) {
            showNotification("Invalid stake amount", "error");
            return;
        }
        
        setButtonLoading(elements.stakeButton, "Staking...");
        
        const klyToken = new ethers.Contract(KLY_TOKEN_ADDRESS, KLY_TOKEN_ABI, state.signer);
        const stakingContract = new ethers.Contract(STAKING_CONTRACT_ADDRESS, STAKING_ABI, state.signer);
        
        // Convert to wei
        const amountWei = ethers.utils.parseUnits(amount.toString(), await klyToken.decimals());
        
        // First approve then stake
        const approveTx = await klyToken.approve(STAKING_CONTRACT_ADDRESS, amountWei);
        await approveTx.wait();
        
        const stakeTx = await stakingContract.stake(amountWei);
        await stakeTx.wait();
        
        showNotification("Tokens staked successfully!", "success");
        await loadBalances(); // Refresh balances
        
    } catch (err) {
        console.error("Staking failed:", err);
        showNotification(`Staking failed: ${err.message}`, "error");
    } finally {
        resetStakeButton();
    }
}

// Claim rewards
export async function claimRewards() {
    try {
        setButtonLoading(elements.claimButton, "Claiming...");
        
        const stakingContract = new ethers.Contract(STAKING_CONTRACT_ADDRESS, STAKING_ABI, state.signer);
        const tx = await stakingContract.claimRewards();
        await tx.wait();
        
        showNotification("Rewards claimed successfully!", "success");
        await loadBalances();
        
    } catch (err) {
        console.error("Claim failed:", err);
        showNotification(`Claim failed: ${err.message}`, "error");
    } finally {
        elements.claimButton.disabled = state.pendingRewards <= 0;
        elements.claimButton.innerHTML = '<i class="fas fa-gift"></i> CLAIM';
    }
}

// Withdraw staked tokens
export async function withdrawStake() {
    try {
        setButtonLoading(elements.withdrawButton, "Withdrawing...");
        
        const stakingContract = new ethers.Contract(STAKING_CONTRACT_ADDRESS, STAKING_ABI, state.signer);
        const amountWei = ethers.utils.parseUnits(state.stakedBalance.toString(), 18);
        const tx = await stakingContract.withdraw(amountWei);
        await tx.wait();
        
        showNotification("Withdrawal successful!", "success");
        await loadBalances();
        
    } catch (err) {
        console.error("Withdrawal failed:", err);
        showNotification(`Withdrawal failed: ${err.message}`, "error");
    } finally {
        elements.withdrawButton.disabled = state.stakedBalance <= 0;
        elements.withdrawButton.innerHTML = '<i class="fas fa-wallet"></i> WITHDRAW';
    }
}

// UI Helpers
function setButtonLoading(button, text) {
    button.innerHTML = `<i class="fas fa-spinner fa-spin"></i> ${text}`;
    button.disabled = true;
}

function setButtonSuccess(button, text) {
    button.innerHTML = `<i class="fas fa-check-circle"></i> ${text}`;
    button.disabled = false;
}

function resetConnectButton() {
    elements.connectBtn.innerHTML = '<i class="fas fa-wallet"></i> Connect Wallet';
    elements.connectBtn.disabled = false;
}

function resetStakeButton() {
    elements.stakeButton.innerHTML = '<i class="fas fa-lock"></i> STAKE TOKENS';
    elements.stakeButton.disabled = false;
}

function showNotification(message, type = "info") {
    elements.statusMessage.textContent = message;
    elements.statusMessage.style.color = type === "error" ? "#ff2d7b" : 
                                       type === "success" ? "#00ff88" : "#00f0ff";
    setTimeout(() => elements.statusMessage.textContent = "", 5000);
}

// Initialize
window.addEventListener('load', async () => {
    await initWeb3Modal();
    if (state.web3Modal.cachedProvider) {
        await connectWallet();
    }
    
    // Set up slider event
    elements.stakeSlider.addEventListener('input', () => {
        const value = elements.stakeSlider.value;
        elements.stakeButton.disabled = value <= 0 || parseFloat(value) > state.klyBalance;
    });
});

// Global exports
window.connectWallet = connectWallet;
window.stakeTokens = stakeTokens;
window.claimRewards = claimRewards;
window.withdrawStake = withdrawStake;
</script>
