<script>
    // Contract addresses and ABIs
    const KLY_TOKEN_ADDRESS = "0x2e4fEB2Fe668c8Ebe84f19e6c8fE8Cf8131B4E52";
    const NFT_CONTRACT_ADDRESS = "0xc1a2E9A475779EfD04247EA473638717E26cd5C5";
    const KLY_TOKEN_ABI = [
      "function balanceOf(address) view returns (uint256)",
      "function decimals() view returns (uint8)"
    ];
const NFT_CONTRACT_ABI = [
  "function mintTo(address to, string uri)"
];

    // Global variables
    let provider, web3Modal, signer, userAddress;
    let completedModules = [];
    
    // DOM elements
    const connectSection = document.getElementById('connect-section');
    const appContent = document.getElementById('app-content');
    const connectBtn = document.getElementById('connect-btn');
    const walletStatus = document.getElementById('wallet-status');
    const walletAddress = document.getElementById('wallet-address');
    const userAvatar = document.getElementById('user-avatar');
    const progressBar = document.getElementById('progress-bar');
    const progressText = document.getElementById('progress-text');
    const mintBtn = document.getElementById('mint-btn');
    const mintStatus = document.getElementById('mint-status');

    // Create floating particles
    function createParticles() {
      const particlesContainer = document.getElementById('particles');
      if (!particlesContainer) return;
      
      const particleCount = window.innerWidth < 768 ? 20 : 50;
      
      for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        
        // Random properties
        const size = Math.random() * 5 + 2;
        const posX = Math.random() * 100;
        const posY = Math.random() * 100;
        const opacity = Math.random() * 0.3 + 0.1;
        const animationDuration = Math.random() * 20 + 10;
        const animationDelay = Math.random() * 10;
        const color = `hsl(${Math.random() * 60 + 200}, 100%, 70%)`;
        
        // Apply styles
        particle.style.width = `${size}px`;
        particle.style.height = `${size}px`;
        particle.style.left = `${posX}%`;
        particle.style.top = `${posY}%`;
        particle.style.opacity = opacity;
        particle.style.background = color;
        particle.style.animationDuration = `${animationDuration}s`;
        particle.style.animationDelay = `-${animationDelay}s`;
        
        particlesContainer.appendChild(particle);
      }
    }

    // Initialize Web3Modal
    async function initWeb3Modal() {
      if (!window.Web3Modal || !window.WalletConnectProvider) {
        console.error("Web3Modal or WalletConnectProvider not loaded");
        return;
      }
      
      const providerOptions = {
        walletconnect: {
          package: window.WalletConnectProvider.default,
          options: {
            rpc: {
              56: "https://bsc-dataseed.binance.org/" 
            },
            chainId: 56
          }
        }
      };
      
      web3Modal = new window.Web3Modal.default({
        cacheProvider: true,
        providerOptions,
        theme: {
          background: "var(--darker)",
          main: "var(--light)",
          secondary: "var(--light)",
          border: "var(--glass-border)",
          hover: "var(--primary)"
        }
      });
    }

    // Connect wallet
    async function connectWallet() {
      try {
        if (!web3Modal) {
          await initWeb3Modal();
        }
        
        connectBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Connecting...';
        
        const instance = await web3Modal.connect();
        provider = new ethers.providers.Web3Provider(instance);
        signer = provider.getSigner();
        userAddress = await signer.getAddress();
        
        // Update UI
        const shortAddress = `${userAddress.substring(0, 6)}...${userAddress.substring(38)}`;
        walletAddress.textContent = shortAddress;
        userAvatar.textContent = userAddress.substring(2, 4).toUpperCase();
        
        // Check network
        const network = await provider.getNetwork();
        if (network.chainId !== 56) {
          showNotification("Please switch to BNB Chain", "warning");
          walletStatus.innerHTML = `
            <div style="color: var(--warning); text-align: center;">
              <i class="fas fa-exclamation-triangle"></i> Switch to BNB Chain to continue
              <div style="margin-top: 1rem;">
                <button onclick="addBscNetwork()" class="btn btn-primary btn-sm">
                  <i class="fas fa-network-wired"></i> Add BSC Network
                </button>
              </div>
            </div>
          `;
          return;
        }
        
        // Check KLY balance
        const klyContract = new ethers.Contract(KLY_TOKEN_ADDRESS, KLY_TOKEN_ABI, provider);
        const balance = await klyContract.balanceOf(userAddress);
        const decimals = await klyContract.decimals();
        const klyBalance = parseFloat(ethers.utils.formatUnits(balance, decimals));
        
        if (klyBalance >= 100) {
          // Success - show app content
          connectSection.style.display = 'none';
          appContent.style.display = 'block';
          showNotification("Wallet connected successfully", "success");
          
          // Initialize course progress
          updateProgress();
        } else {
          walletStatus.innerHTML = `
            <div style="color: var(--danger); text-align: center;">
              <i class="fas fa-exclamation-circle"></i> Insufficient KLY balance (${klyBalance.toFixed(2)}/100 required)
              <div style="margin-top: 1rem;">
                <a href="https://pancakeswap.finance/swap?outputCurrency=${KLY_TOKEN_ADDRESS}" 
                   target="_blank" 
                   class="btn btn-primary btn-sm">
                  <i class="fas fa-exchange-alt"></i> Buy KLY on PancakeSwap
                </a>
              </div>
            </div>
          `;
        }
      } catch (error) {
        console.error("Connection error:", error);
        showNotification(`Connection failed: ${error.message}`, "error");
        walletStatus.innerHTML = `
          <div style="color: var(--danger); text-align: center;">
            <i class="fas fa-times-circle"></i> Error: ${error.message}
          </div>
        `;
      } finally {
        connectBtn.innerHTML = '<i class="fas fa-wallet"></i> Connect Wallet';
      }
    }
    
    // Add BSC Network
    async function addBscNetwork() {
      try {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [{
            chainId: '0x38',
            chainName: 'Binance Smart Chain',
            nativeCurrency: {
              name: 'BNB',
              symbol: 'BNB',
              decimals: 18
            },
            rpcUrls: ['https://bsc-dataseed.binance.org/'],
            blockExplorerUrls: ['https://bscscan.com']
          }]
        });
        showNotification("BNB Chain added successfully", "success");
        setTimeout(() => window.location.reload(), 2000);
      } catch (error) {
        showNotification(`Failed to add BSC network: ${error.message}`, "error");
      }
    }
    
    // Disconnect wallet
    async function disconnectWallet() {
      if (web3Modal && web3Modal.clearCachedProvider) {
        await web3Modal.clearCachedProvider();
      }
      connectSection.style.display = 'block';
      appContent.style.display = 'none';
      showNotification("Wallet disconnected", "success");
    }
    
    // Show module with smooth scrolling
    function showModule(moduleId) {
      // Hide all modules
      document.querySelectorAll('.module').forEach(el => {
        el.style.display = 'none';
      });
      
      // Show selected module
      const module = document.getElementById(moduleId);
      if (!module) return;
      
      module.style.display = 'block';
      module.classList.add('animate__animated', 'animate__fadeIn');
      
      // Scroll to top of the module
      module.scrollIntoView({ behavior: 'smooth', block: 'start' });
      
      // Update active menu item
      document.querySelectorAll('.menu-item').forEach(el => {
        el.classList.remove('active');
        const icon = el.querySelector('.menu-icon i');
        if (icon) {
          icon.className = icon.className.replace('fas fa-check-circle', 'far fa-circle');
        }
      });
      
      const activeItem = document.querySelector(`.menu-item[onclick="showModule('${moduleId}')"]`);
      if (activeItem) {
        activeItem.classList.add('active');
        const icon = activeItem.querySelector('.menu-icon i');
        if (icon) {
          icon.className = 'fas fa-check-circle';
        }
      }
      
      // Mark module as completed if not already
      if (!completedModules.includes(moduleId)) {
        completedModules.push(moduleId);
        updateProgress();
      }
    }
    
    // Update progress bar
    function updateProgress() {
      const totalModules = 5;
      const completed = completedModules.length;
      const percentage = (completed / totalModules) * 100;
      
      if (progressBar) progressBar.style.width = `${percentage}%`;
      if (progressText) progressText.textContent = `${completed}/${totalModules}`;
      
      // Enable mint button if all modules completed
      if (completed === totalModules && mintBtn) {
        mintBtn.innerHTML = '<i class="fas fa-certificate"></i> Mint NFT Certificate';
        mintBtn.disabled = false;
        mintBtn.classList.add('pulse');
      }
    }
    
    // Mint certificate
  async function mintCertificate() {
  if (!signer) {
    showNotification("Please connect your wallet first", "error");
    return;
  }

  try {
    mintBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
    mintBtn.disabled = true;

    const nftContract = new ethers.Contract(NFT_CONTRACT_ADDRESS, NFT_CONTRACT_ABI, signer);

    // Safely estimate gas
    let gasLimit;
    try {
      const gasEstimate = await nftContract.estimateGas.mintTo(
        userAddress,
        "ipfs://bafybeihkmkaf2mgx7xkrnkhmzd2uvhr6ddgj6z3vkqcgnvlaa3z7x263r4"
      );
      gasLimit = gasEstimate.mul(120).div(100); // add 20% buffer
    } catch (err) {
      console.warn("Gas estimate failed, using fallback:", err.message);
      gasLimit = 300000; // fallback gas limit
    }

    const tx = await nftContract.mintTo(
      userAddress,
      "ipfs://bafybeihkmkaf2mgx7xkrnkhmzd2uvhr6ddgj6z3vkqcgnvlaa3z7x263r4",
      { gasLimit }
    );

    if (mintStatus) {
      mintStatus.innerHTML = `
        <div style="color: var(--accent); text-align: center;">
          <i class="fas fa-spinner fa-spin"></i> Transaction submitted...
          <div style="margin-top: 0.5rem;">
            <a href="https://bscscan.com/tx/${tx.hash}" target="_blank" style="color: var(--accent)">
              <i class="fas fa-external-link-alt"></i> View on BscScan
            </a>
          </div>
        </div>
      `;
    }

    await tx.wait();

    if (mintStatus) {
      mintStatus.innerHTML = `
        <div style="color: var(--success); text-align: center;">
          <i class="fas fa-check-circle"></i> Certificate minted successfully!
        </div>
      `;
    }
    if (mintBtn) mintBtn.style.display = 'none';

    launchConfetti();
    showNotification("NFT Certificate minted successfully!", "success");

    document.querySelectorAll('.menu-item').forEach(item => {
      const icon = item.querySelector('.menu-icon i');
      if (icon) icon.className = 'fas fa-check-circle';
    });

  } catch (error) {
    console.error("Minting error:", error);
    showNotification(`Minting failed: ${error.message}`, "error");

    if (mintStatus) {
      mintStatus.innerHTML = `
        <div style="color: var(--danger); text-align: center;">
          <i class="fas fa-times-circle"></i> Error: ${error.message}
        </div>
      `;
    }

    if (mintBtn) {
      mintBtn.innerHTML = '<i class="fas fa-certificate"></i> Try Again';
      mintBtn.disabled = false;
    }
  }
}
    // Show notification
    function showNotification(message, type = 'info', title = '') {
      const existing = document.querySelector('.notification');
      if (existing) existing.remove();
      
      const notification = document.createElement('div');
      notification.className = `notification ${type}`;
      
      let icon = '';
      switch(type) {
        case 'success': 
          icon = '<i class="fas fa-check-circle notification-icon"></i>';
          title = title || 'Success';
          break;
        case 'error': 
          icon = '<i class="fas fa-times-circle notification-icon"></i>';
          title = title || 'Error';
          break;
        case 'warning': 
          icon = '<i class="fas fa-exclamation-triangle notification-icon"></i>';
          title = title || 'Warning';
          break;
        default: 
          icon = '<i class="fas fa-info-circle notification-icon"></i>';
          title = title || 'Info';
      }
      
      notification.innerHTML = `
        ${icon}
        <div class="notification-content">
          <div class="notification-title">${title}</div>
          <div class="notification-message">${message}</div>
        </div>
        <button class="notification-close" onclick="this.parentElement.remove()">
          <i class="fas fa-times"></i>
        </button>
      `;
      
      document.body.appendChild(notification);
      
      setTimeout(() => {
        notification.style.opacity = '0';
        setTimeout(() => notification.remove(), 300);
      }, 5000);
    }
    
    // Launch confetti
    function launchConfetti() {
      if (typeof confetti === 'function') {
        // Main burst
        confetti({
          particleCount: 150,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#6C4DF6', '#FF7D05', '#00E0FF'],
          scalar: 1.2
        });
        
        // Additional bursts
        setTimeout(() => {
          confetti({
            particleCount: 100,
            angle: 60,
            spread: 55,
            origin: { x: 0, y: 0.7 },
            colors: ['#6C4DF6', '#FF7D05', '#00E0FF']
          });
          
          confetti({
            particleCount: 100,
            angle: 120,
            spread: 55,
            origin: { x: 1, y: 0.7 },
            colors: ['#6C4DF6', '#FF7D05', '#00E0FF']
          });
        }, 300);
      }
    }
    
    // Initialize app
    window.addEventListener('load', async () => {
      createParticles();
      await initWeb3Modal();
      
      // Check if wallet is already connected
      if (web3Modal && web3Modal.cachedProvider) {
        await connectWallet();
      }
      
      // Show first module by default
      showModule('module1');
    });
    
    // Expose functions to global scope
    window.connectWallet = connectWallet;
    window.disconnectWallet = disconnectWallet;
    window.mintCertificate = mintCertificate;
    window.showModule = showModule;
    window.addBscNetwork = addBscNetwork;
</script>
