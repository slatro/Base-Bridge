// js/web3.js
const BASE_MAINNET = 8453;
const BASE_SEPOLIA = 84532;
const TARGET_CHAIN = BASE_SEPOLIA;
const TARGET_CHAIN_HEX = "0x" + TARGET_CHAIN.toString(16);

let provider;
let signer;
let userAddress = null;

// Replace these with your actual deployed contract addresses on Base Sepolia/Mainnet
const BB_TOKEN_ADDRESS = "0x0000000000000000000000000000000000000001"; 
const NFT_CONTRACT_ADDRESS = "0x0000000000000000000000000000000000000002";

// DOM
const btnConnect = document.getElementById("btn-connect-wallet");
const btnSwitch = document.getElementById("btn-switch-network");
const viewConnect = document.getElementById("onchain-connect-view");
const viewDetails = document.getElementById("onchain-details-view");

const userProfileArea = document.getElementById("user-profile-area");
const currentUserName = document.getElementById("current-user-name");
const currentUserAvatar = document.getElementById("current-user-avatar");
const btnProfileSettings = document.getElementById("btn-profile-settings");
const btnDisconnect = document.getElementById("btn-disconnect-wallet");
const inputUsername = document.getElementById("username-input");
const btnSaveProfile = document.getElementById("btn-save-profile");
const avatarGrid = document.getElementById("avatar-grid");

const AVATAR_COLORS = [
  '#111111', '#e11d48', '#0891b2', '#f59e0b', '#8b5cf6', '#10b981', '#ec4899', '#3b82f6', '#f43f5e', '#84cc16',
  '#14b8a6', '#6366f1', '#a855f7', '#d946ef', '#f97316', '#64748b', '#000000', '#ffffff', '#7dd3fc', '#fef08a'
];
let selectedAvatar = localStorage.getItem('bb_v1_avatar') || '#111111';
let currentUsername = localStorage.getItem('bb_v1_username') || 'Player';

function getAvatarSVG(color) {
  return `data:image/svg+xml;utf8,<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><circle cx="50" cy="50" r="40" fill="%23${color.replace('#','')}"/><circle cx="35" cy="45" r="5" fill="%23fff"/><circle cx="65" cy="45" r="5" fill="%23fff"/></svg>`;
}

function updateProfileUI() {
  if (currentUserName) currentUserName.innerText = currentUsername;
  if (currentUserAvatar) currentUserAvatar.style.background = `url('${getAvatarSVG(selectedAvatar)}') no-repeat center/contain`;
}

function initProfileModal() {
  if (!avatarGrid) return;
  avatarGrid.innerHTML = '';
  AVATAR_COLORS.forEach(color => {
    const div = document.createElement('div');
    div.style.width = '40px'; div.style.height = '40px'; div.style.borderRadius = '50%';
    div.style.cursor = 'pointer'; div.style.background = `url('${getAvatarSVG(color)}') no-repeat center/contain`;
    div.style.border = selectedAvatar === color ? '3px solid #00ff88' : '3px solid transparent';
    div.onclick = () => {
      selectedAvatar = color;
      Array.from(avatarGrid.children).forEach(c => c.style.border = '3px solid transparent');
      div.style.border = '3px solid #00ff88';
    };
    avatarGrid.appendChild(div);
  });
  inputUsername.value = currentUsername;
}

const lblNetwork = document.getElementById("network-status");
const lblAddress = document.getElementById("wallet-address");
const lblBest = document.getElementById("onchain-best");
const lblRefs = document.getElementById("onchain-refs");

const refInput = document.getElementById("ref-link-input");
const btnCopyRef = document.getElementById("btn-copy-ref");
const refText = document.getElementById("referred-by-text");

async function initWeb3() {
  await new Promise(r => setTimeout(r, 200));

  const provider = window.ethereum;
  const isDisconnected = localStorage.getItem('bb_v1_disconnected') === 'true';

  if (provider) {
    btnConnect.innerText = "CONNECT WALLET";
    
    if (!isDisconnected) {
      try {
        const accounts = await provider.request({ method: "eth_accounts" });
        if (accounts && accounts.length > 0) {
          await handleConnect(accounts[0]);
        }
      } catch (e) { }
    }

    provider.on('accountsChanged', async (accounts) => {
      if (accounts && accounts.length > 0) {
        localStorage.removeItem('bb_v1_disconnected');
        await handleConnect(accounts[0]);
      } else {
        handleDisconnect();
      }
    });
    provider.on('chainChanged', () => window.location.reload());
  } else {
    btnConnect.innerText = "INSTALL WALLET";
  }

  btnConnect.addEventListener("click", async () => {
    if (!provider) {
      window.open("https://metamask.io/download/", "_blank");
      return;
    }
    try {
      const accounts = await provider.request({ method: "eth_requestAccounts" });
      if (accounts && accounts.length > 0) {
        localStorage.removeItem('bb_v1_disconnected');
        await handleConnect(accounts[0]);
      }
    } catch (error) {
      console.error(error);
    }
  });

  if(btnSwitch) btnSwitch.addEventListener("click", switchNetwork);
  if(btnCopyRef) btnCopyRef.addEventListener("click", copyRef);
  if(btnDisconnect) btnDisconnect.addEventListener("click", handleDisconnect);
  
  if(btnProfileSettings) btnProfileSettings.addEventListener("click", () => {
    initProfileModal();
    document.getElementById('modal-backdrop').classList.remove('hidden');
    document.getElementById('modal-profile').classList.remove('hidden');
  });
  if(btnSaveProfile) btnSaveProfile.addEventListener("click", () => {
    let name = inputUsername.value.trim();
    if(name.length > 0) {
      currentUsername = name;
      localStorage.setItem('bb_v1_username', currentUsername);
    }
    localStorage.setItem('bb_v1_avatar', selectedAvatar);
    updateProfileUI();
    window.closeModals();
  });
  
  checkURLReferral();
  initDailyReward();
  updateProfileUI();
}

function checkURLReferral() {
  const urlParams = new URLSearchParams(window.location.search);
  const ref = urlParams.get('ref');
  if (ref && typeof ethers !== 'undefined' && ethers.isAddress(ref)) {
    localStorage.setItem('bb_v1_referrer', ref);
  }
  const savedRef = localStorage.getItem('bb_v1_referrer');
  if (savedRef) {
    refText.classList.remove("hidden");
    refText.querySelector("span").innerText = `${savedRef.slice(0, 6)}...${savedRef.slice(-4)}`;
  }
}

async function handleConnect(account) {
  userAddress = account;
  window.userAddress = userAddress; // GLOBAL EXPORT
  
  const shortAddr = `${userAddress.slice(0, 6)}...${userAddress.slice(-4)}`;
  
  viewConnect.classList.add("hidden");
  viewDetails.classList.remove("hidden");
  
  lblAddress.innerText = shortAddr;
  if (userProfileArea) userProfileArea.style.display = 'flex';
  
  refInput.value = `${window.location.origin}${window.location.pathname}?ref=${userAddress}`;
  lblBest.innerText = localStorage.getItem('bb_v1_best') || "0";
  
  await checkNetwork();
}

async function handleDisconnect() {
  userAddress = null;
  window.userAddress = null; // GLOBAL EXPORT
  
  if (window.ethereum) {
    try {
      await window.ethereum.request({
        method: "wallet_revokePermissions",
        params: [{ eth_accounts: {} }]
      });
    } catch (error) {
      console.log("wallet_revokePermissions not supported or failed", error);
    }
  }
  
  localStorage.setItem('bb_v1_disconnected', 'true');
  
  if (viewConnect) viewConnect.classList.remove("hidden");
  if (viewDetails) viewDetails.classList.add("hidden");
  if (userProfileArea) userProfileArea.style.display = 'none';
}

async function checkNetwork() {
  const provider = window.ethereum;
  if (!provider) return;
  const chainIdHex = await provider.request({ method: 'eth_chainId' });
  const chainId = parseInt(chainIdHex, 16);
  
  if (chainId !== 8453 && chainId !== 84532) {
    lblNetwork.innerText = "Wrong Network";
    lblNetwork.style.color = "#ff2a7a";
    btnSwitch.innerText = "Switch to Base";
    btnSwitch.classList.remove("hidden");
  } else {
    lblNetwork.innerText = chainId === 8453 ? "Base Mainnet" : "Base Sepolia";
    lblNetwork.style.color = "#00ff88";
    btnSwitch.classList.add("hidden");
  }
}

async function switchNetwork() {
  const provider = window.ethereum;
  if (!provider) return;
  try {
    await provider.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: TARGET_CHAIN_HEX }] });
  } catch (e) {
    try {
      await provider.request({
        method: 'wallet_addEthereumChain',
        params: [{
          chainId: TARGET_CHAIN_HEX,
          chainName: 'Base Sepolia',
          rpcUrls: ['https://sepolia.base.org'],
          nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
          blockExplorerUrls: ['https://sepolia.basescan.org/']
        }]
      });
    } catch (addError) {
      console.error("Failed to switch/add network:", addError);
    }
  }
}

function copyRef() {
  refInput.select();
  document.execCommand("copy");
  btnCopyRef.innerText = "Copied!";
  setTimeout(() => btnCopyRef.innerText = "Copy Link", 2000);
}

// Daily Reward Logic (Strict Fix via Epoch)
function initDailyReward() {
  const btnClaim = document.getElementById("btn-claim-daily");
  const lastClaimStr = localStorage.getItem("bb_v1_last_claim_v3");
  
  const now = new Date().getTime();
  const oneDay = 24 * 60 * 60 * 1000;

  // Strict check: IF it exists AND it's a valid number AND the difference is less than 24 hours
  if (lastClaimStr && !isNaN(parseInt(lastClaimStr)) && (now - parseInt(lastClaimStr)) < oneDay) {
    btnClaim.innerText = "CLAIMED ✓";
    btnClaim.disabled = true;
  } else {
    btnClaim.innerText = "CLAIM REWARD";
    btnClaim.disabled = false;
  }

  // Remove old listeners to prevent stacking
  const newBtn = btnClaim.cloneNode(true);
  btnClaim.parentNode.replaceChild(newBtn, btnClaim);

  newBtn.addEventListener("click", async () => {
    if (!window.userAddress) {
      showInfoModal('Wallet Required', 'You must connect your wallet to claim daily rewards!');
      return;
    }
    if(newBtn.disabled) return;
    
    const success = await window.claimBBTokensOnchain(50);
    if (!success) return; // Wait for transaction to be approved
    
    let coins = parseInt(localStorage.getItem('bb_v1_coins') || '0');
    coins += 50; 
    localStorage.setItem('bb_v1_coins', coins);
    document.getElementById('ui-coins').innerText = coins;
    
    // Save current epoch
    localStorage.setItem("bb_v1_last_claim_v3", new Date().getTime().toString());
    newBtn.innerText = "CLAIMED ✓";
    newBtn.disabled = true;
    
    showInfoModal("Reward Claimed!", "You received 50 BB Tokens onchain. Come back tomorrow for more!");
  });
}

window.claimBBTokensOnchain = async function(amount) {
  if (!window.userAddress) return false;
  const provider = window.ethereum;
  if (!provider) return false;

  try {
    // Generate contract call data for: function claim(uint256 amount)
    const tokenAbi = ["function claim(uint256 amount) public"];
    const iface = new ethers.Interface(tokenAbi);
    const parsedAmount = ethers.parseUnits(amount.toString(), 18);
    const data = iface.encodeFunctionData("claim", [parsedAmount]);

    const tx = {
      from: window.userAddress,
      to: BB_TOKEN_ADDRESS,
      value: '0x0',
      data: data
    };
    
    await provider.request({
      method: 'eth_sendTransaction',
      params: [tx],
    });
    return true;
  } catch (error) {
    console.error("BB Claim failed:", error);
    return false;
  }
};

// SVG Achievement Icons
const ACH_SVG = {
  play: `data:image/svg+xml;utf8,<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><circle cx="50" cy="50" r="45" fill="%2300e5ff"/><path d="M40 30 L70 50 L40 70 Z" fill="%23111"/></svg>`,
  star: `data:image/svg+xml;utf8,<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><path d="M50 10 L60 40 L90 40 L65 60 L75 90 L50 70 L25 90 L35 60 L10 40 L40 40 Z" fill="%23facc15"/></svg>`,
  bridge: `data:image/svg+xml;utf8,<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><rect x="10" y="70" width="20" height="30" fill="%234ade80"/><rect x="70" y="70" width="20" height="30" fill="%234ade80"/><rect x="10" y="60" width="80" height="10" fill="%23fff"/></svg>`,
  skin: `data:image/svg+xml;utf8,<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><circle cx="50" cy="50" r="40" fill="%23ff2a7a"/><circle cx="35" cy="45" r="5" fill="%23fff"/><circle cx="65" cy="45" r="5" fill="%23fff"/></svg>`,
  world: `data:image/svg+xml;utf8,<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><circle cx="50" cy="50" r="45" fill="%2300d2ff"/><path d="M10 50 Q30 20 50 50 T90 50" fill="none" stroke="%23fff" stroke-width="5"/></svg>`,
  gear: `data:image/svg+xml;utf8,<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><circle cx="50" cy="50" r="40" fill="%2300ff88"/><circle cx="50" cy="50" r="15" fill="%23111"/></svg>`,
  sword: `data:image/svg+xml;utf8,<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><rect x="45" y="10" width="10" height="60" fill="%2394a3b8"/><rect x="30" y="65" width="40" height="10" fill="%23facc15"/><rect x="45" y="75" width="10" height="20" fill="%23451a03"/></svg>`,
  glasses: `data:image/svg+xml;utf8,<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><rect x="20" y="40" width="25" height="15" fill="%23111"/><rect x="55" y="40" width="25" height="15" fill="%23111"/><path d="M45 45 L55 45" stroke="%23fff" stroke-width="3"/></svg>`,
  gold: `data:image/svg+xml;utf8,<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><circle cx="50" cy="50" r="45" fill="%23eab308"/><circle cx="50" cy="50" r="35" fill="%23fef08a"/></svg>`,
  space: `data:image/svg+xml;utf8,<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><circle cx="50" cy="50" r="45" fill="%230f172a"/><circle cx="30" cy="30" r="5" fill="%23fff"/><circle cx="70" cy="60" r="3" fill="%23fff"/></svg>`,
  cal: `data:image/svg+xml;utf8,<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><rect x="15" y="30" width="70" height="60" rx="5" fill="%23fff"/><rect x="15" y="20" width="70" height="20" rx="5" fill="%23ff2a7a"/></svg>`
};

window.mintNFT = async function(nftName) {
  if (!window.userAddress) {
    showInfoModal('Wallet Required', 'You must connect your wallet to mint this NFT!');
    return;
  }
  
  const provider = window.ethereum;
  if (!provider) return;

  try {
    // Generate contract call data for: function mint(string name)
    const nftAbi = ["function mint(string memory name) public"];
    const iface = new ethers.Interface(nftAbi);
    const data = iface.encodeFunctionData("mint", [nftName]);

    const tx = {
      from: window.userAddress,
      to: NFT_CONTRACT_ADDRESS,
      value: '0x0',
      data: data
    };
    
    await provider.request({
      method: 'eth_sendTransaction',
      params: [tx],
    });
    
    showInfoModal('Success!', `Successfully minted ${nftName} on Base Network!`);
  } catch (error) {
    console.error(error);
  }
};

// Ensure closeModals is truly global
window.closeModals = function() {
  document.getElementById('modal-backdrop').classList.add('hidden');
  document.getElementById('modal-info').classList.add('hidden');
  document.getElementById('modal-achievements').classList.add('hidden');
  document.getElementById('modal-shop').classList.add('hidden');
  document.getElementById('modal-equip-shop').classList.add('hidden');
  const profileModal = document.getElementById('modal-profile');
  if (profileModal) profileModal.classList.add('hidden');
};

window.showInfoModal = function(title, desc) {
  document.getElementById('modal-info-title').innerText = title;
  document.getElementById('modal-info-desc').innerText = desc;
  document.getElementById('modal-backdrop').classList.remove('hidden');
  document.getElementById('modal-info').classList.remove('hidden');
  document.getElementById('modal-achievements').classList.add('hidden');
  document.getElementById('modal-shop').classList.add('hidden');
  document.getElementById('modal-equip-shop').classList.add('hidden');
};

window.addEventListener('load', initWeb3);
