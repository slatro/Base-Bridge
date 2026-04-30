// js/web3.js
const BASE_MAINNET = 8453;
const BASE_SEPOLIA = 84532;
const TARGET_CHAIN = BASE_MAINNET;
const TARGET_CHAIN_HEX = "0x" + TARGET_CHAIN.toString(16);

let provider;
let signer;
let userAddress = null;

// Replace these with your actual deployed contract addresses on Base Sepolia/Mainnet
const BB_TOKEN_ADDRESS = "0x0000000000000000000000000000000000000001"; 
const NFT_CONTRACT_ADDRESS = "0x0000000000000000000000000000000000000002";
const LEADERBOARD_CONTRACT_ADDRESS = "0x0000000000000000000000000000000000000003";
const TREASURY_ADDRESS = "0x7Da10DeE012a89d3bb454047Fe29Fd130952058E";

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

const AVATAR_LIST = [
  { id: 'classic', svg: `data:image/svg+xml;utf8,<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><rect x="0" y="0" width="100" height="100" fill="%23fff"/><circle cx="45" cy="30" r="14" fill="%23111"/><path d="M 45 44 L 30 70" stroke="%23111" stroke-width="8" stroke-linecap="round"/><path d="M 40 50 L 65 60 L 75 75" stroke="%23111" stroke-width="8" stroke-linecap="round" stroke-linejoin="round" fill="none"/><path d="M 30 70 L 15 95 M 30 70 L 45 95" stroke="%23111" stroke-width="8" stroke-linecap="round" fill="none"/></svg>` },
  { id: 'ninja', svg: `data:image/svg+xml;utf8,<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><path d="M 75 35 C 90 10, 95 5, 80 20 Z" fill="%23374151" stroke="%23111" stroke-width="3" stroke-linejoin="round"/><path d="M 75 45 C 95 50, 98 55, 80 40 Z" fill="%23374151" stroke="%23111" stroke-width="3" stroke-linejoin="round"/><circle cx="75" cy="35" r="10" fill="%23374151" stroke="%23111" stroke-width="3"/><path d="M 15 50 C 15 10, 80 10, 80 50 C 80 80, 55 90, 35 90 C 15 90, 15 70, 15 50 Z" fill="%23374151" stroke="%23111" stroke-width="3" stroke-linejoin="round"/><path d="M 12 40 L 60 30 L 45 80 L 18 65 Z" fill="%23fcd34d" stroke="%23111" stroke-width="3" stroke-linejoin="round"/><circle cx="35" cy="50" r="12" fill="%23fff" stroke="%23111" stroke-width="3"/><circle cx="32" cy="52" r="4" fill="%23111"/><path d="M 10 35 L 60 42 L 50 25 L 10 25 Z" fill="%23fcd34d"/><path d="M 10 35 L 60 42" fill="none" stroke="%23111" stroke-width="4" stroke-linecap="round"/><path d="M 22 18 L 76 25 M 15 30 L 78 40 M 15 65 L 45 80 M 60 30 L 65 75 M 35 90 L 75 60 M 75 30 L 48 13 M 80 50 L 55 83" stroke="%23111" stroke-width="2.5" opacity="0.8" stroke-linecap="round"/></svg>` },
  { id: 'cyber', svg: `data:image/svg+xml;utf8,<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><defs><radialGradient id="astroBg" cx="50%" cy="50%" r="50%"><stop offset="0%" stop-color="%23ffffff"/><stop offset="100%" stop-color="%23cbd5e1"/></radialGradient></defs><rect x="35" y="55" width="30" height="35" rx="15" fill="url(%23astroBg)" stroke="%2394a3b8" stroke-width="2"/><path d="M 38 60 Q 50 80 62 60" fill="%230078ff"/><path d="M 50 15 L 50 5" stroke="%23cbd5e1" stroke-width="3"/><circle cx="50" cy="5" r="4" fill="%2300e5ff"/><rect x="15" y="15" width="70" height="45" rx="20" fill="url(%23astroBg)" stroke="%2394a3b8" stroke-width="2"/><rect x="20" y="20" width="60" height="35" rx="15" fill="%23000"/><path d="M 30 40 Q 37 30 45 40 Z" fill="%2300e5ff"/><path d="M 55 40 Q 62 30 70 40 Z" fill="%2300e5ff"/></svg>` },
  { id: 'wizard', svg: `data:image/svg+xml;utf8,<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><circle cx="50" cy="60" r="30" fill="%23ffedd5"/><path d="M 20 60 Q 50 110 80 60 Z" fill="%23fff"/><circle cx="35" cy="55" r="4" fill="%23111"/><circle cx="65" cy="55" r="4" fill="%23111"/><path d="M 25 45 Q 35 40 45 45" fill="none" stroke="%23fff" stroke-width="4" stroke-linecap="round"/><path d="M 55 45 Q 65 40 75 45" fill="none" stroke="%23fff" stroke-width="4" stroke-linecap="round"/><path d="M 25 40 L 50 5 L 75 40 Z" fill="%231e40af"/><ellipse cx="50" cy="40" rx="45" ry="8" fill="%231e40af"/><path d="M 27 36 Q 50 44 73 36 L 70 30 Q 50 38 30 30 Z" fill="%23fff"/><path d="M 50 68 Q 30 60 10 75 Q 30 75 50 68 Z" fill="%23fff"/><path d="M 50 68 Q 70 60 90 75 Q 70 75 50 68 Z" fill="%23fff"/><circle cx="50" cy="65" r="6" fill="%23fbcfe8"/><path d="M 55 25 A 6 6 0 1 0 55 13 A 8 8 0 1 1 55 25 Z" fill="%23facc15"/><circle cx="35" cy="20" r="2" fill="%23fff"/><circle cx="45" cy="10" r="2" fill="%23fff"/><circle cx="65" cy="25" r="2" fill="%23fff"/></svg>` },
  { id: 'troop', svg: `data:image/svg+xml;utf8,<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><path d="M 15 35 C 15 5, 85 5, 85 35 L 90 65 C 95 85, 75 95, 60 95 L 50 88 L 40 95 C 25 95, 5 85, 10 65 Z" fill="%23ef4444" stroke="%23111" stroke-width="3" stroke-linejoin="round"/><path d="M 12 40 L 88 40" fill="none" stroke="%23111" stroke-width="3"/><path d="M 13 48 L 87 48" fill="none" stroke="%23111" stroke-width="3"/><path d="M 25 15 L 25 40 M 35 10 L 35 40 M 45 8 L 45 40 M 55 8 L 55 40 M 65 10 L 65 40 M 75 15 L 75 40" stroke="%23111" stroke-width="1.5" opacity="0.6"/><path d="M 13 48 L 87 48 L 83 58 L 50 68 L 17 58 Z" fill="%23111"/><path d="M 28 58 L 72 58 L 60 85 L 40 85 Z" fill="%23111"/><path d="M 17 58 L 42 85 L 32 90 L 14 70 Z" fill="%23ef4444" stroke="%23111" stroke-width="2" stroke-linejoin="round"/><path d="M 25 65 L 35 78 M 30 62 L 40 75" stroke="%23111" stroke-width="2"/><path d="M 83 58 L 58 85 L 68 90 L 86 70 Z" fill="%23ef4444" stroke="%23111" stroke-width="2" stroke-linejoin="round"/><path d="M 75 65 L 65 78 M 70 62 L 60 75" stroke="%23111" stroke-width="2"/><path d="M 45 65 L 55 65 L 55 88 L 45 88 Z" fill="%23ef4444" stroke="%23111" stroke-width="2" stroke-linejoin="round"/><path d="M 47 70 L 53 70 M 47 75 L 53 75 M 47 80 L 53 80" stroke="%23111" stroke-width="2"/><path d="M 30 92 L 50 85 L 70 92" fill="none" stroke="%23111" stroke-width="3" stroke-linejoin="round"/></svg>` },
  { id: 'galaxy', svg: `data:image/svg+xml;utf8,<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><rect x="10" y="10" width="80" height="80" rx="15" fill="%231e3a8a"/><path d="M 10 45 L 90 45 L 90 75 A 15 15 0 0 1 75 90 L 25 90 A 15 15 0 0 1 10 75 Z" fill="%239333ea"/><path d="M 5 25 C 15 50, 30 50, 45 40 L 50 50 L 55 40 C 70 50, 85 50, 95 25 C 80 40, 70 30, 50 25 C 30 30, 20 40, 5 25 Z" fill="%23facc15"/><circle cx="35" cy="55" r="4" fill="%23ef4444" stroke="%23111" stroke-width="1"/><circle cx="65" cy="55" r="4" fill="%23ef4444" stroke="%23111" stroke-width="1"/><path d="M 35 75 Q 50 80 65 75" fill="none" stroke="%23581c87" stroke-width="2" stroke-linecap="round"/><path d="M 40 80 L 40 90 M 50 80 L 50 90 M 60 80 L 60 90" stroke="%23581c87" stroke-width="1.5"/></svg>` }
];
if (!localStorage.getItem('bb_v1_uuid')) {
    localStorage.setItem('bb_v1_uuid', 'u-' + Math.random().toString(36).substr(2, 9));
}

let currentUsername = localStorage.getItem('bb_v1_username');
if (!currentUsername) {
    currentUsername = "Player";
    (async () => {
        try {
            const countUrl = 'https://kvdb.io/3Bz5so9xQFGY6vAGb68Mfx/player_count';
            let res = await fetch(`${countUrl}?t=${new Date().getTime()}`, { cache: 'no-store' });
            let count = 0;
            if (res.ok) count = parseInt(await res.text()) || 0;
            count++;
            await fetch(countUrl, { method: 'POST', body: count.toString() });
            
            if (!localStorage.getItem('bb_v1_username')) {
                currentUsername = "Player " + count;
                localStorage.setItem('bb_v1_username', currentUsername);
                
                // Reserve this auto-assigned name
                const myUUID = localStorage.getItem('bb_v1_uuid');
                const userKey = `u_${currentUsername.toLowerCase().replace(/\s+/g, '')}`;
                fetch(`https://kvdb.io/3Bz5so9xQFGY6vAGb68Mfx/${userKey}`, { method: 'POST', body: myUUID });

                if (typeof updateProfileUI === 'function') updateProfileUI();
            }
        } catch (e) { console.error("Could not fetch player count", e); }
    })();
}

let selectedAvatar = localStorage.getItem('bb_v1_avatar') || 'classic';

function getAvatarSVG(id) {
  const item = AVATAR_LIST.find(a => a.id === id) || AVATAR_LIST[0];
  return item.svg;
}

function updateProfileUI() {
  if (currentUserName) currentUserName.innerText = currentUsername;
  if (currentUserAvatar) currentUserAvatar.style.background = `url('${getAvatarSVG(selectedAvatar)}') no-repeat center/contain`;
}

function initProfileModal() {
  if (!avatarGrid) return;
  avatarGrid.innerHTML = '';
  AVATAR_LIST.forEach(item => {
    const div = document.createElement('div');
    div.style.width = '60px'; div.style.height = '60px'; div.style.borderRadius = '12px';
    div.style.cursor = 'pointer'; div.style.background = `rgba(255,255,255,0.05) url('${item.svg}') no-repeat center/70%`;
    div.style.border = selectedAvatar === item.id ? '3px solid #00ff88' : '1px solid rgba(255,255,255,0.1)';
    div.style.transition = "0.2s";
    div.onclick = () => {
      selectedAvatar = item.id;
      Array.from(avatarGrid.children).forEach(c => c.style.border = '1px solid rgba(255,255,255,0.1)');
      div.style.border = '3px solid #00ff88';
      div.style.transform = "scale(1.1)";
      setTimeout(() => div.style.transform = "scale(1)", 150);
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
  if(btnSaveProfile) btnSaveProfile.addEventListener("click", async () => {
    let name = inputUsername.value.trim();
    let oldName = currentUsername;
    
    if(name.length > 0 && name !== oldName) {
      // Check Uniqueness
      btnSaveProfile.disabled = true;
      btnSaveProfile.style.opacity = "0.5";
      btnSaveProfile.innerText = "CHECKING...";

      try {
          const bucket = "3Bz5so9xQFGY6vAGb68Mfx";
          const userKey = `u_${name.toLowerCase().replace(/\s+/g, '')}`;
          const myUUID = localStorage.getItem('bb_v1_uuid');

          const res = await fetch(`https://kvdb.io/${bucket}/${userKey}`);
          if (res.ok) {
              const ownerUUID = await res.text();
              if (ownerUUID && ownerUUID.trim() !== "" && ownerUUID !== myUUID) {
                  alert("This username is already taken! Please choose another one.");
                  btnSaveProfile.disabled = false;
                  btnSaveProfile.style.opacity = "1";
                  btnSaveProfile.innerText = "SAVE";
                  return;
              }
          }

          // Mark as taken
          await fetch(`https://kvdb.io/${bucket}/${userKey}`, { method: 'POST', body: myUUID });
          
          currentUsername = name;
          localStorage.setItem('bb_v1_username', currentUsername);
          
          // Update leaderboard retroactively
          if (typeof window.fetchFirebaseLeaderboard === 'function') {
              try {
                  let board = await window.fetchFirebaseLeaderboard();
                  let modified = false;
                  board.forEach(entry => {
                      if ((entry.uuid === myUUID || entry.addr === oldName) && entry.addr !== currentUsername) {
                          entry.addr = currentUsername;
                          entry.uuid = myUUID; // attach UUID if missing
                          modified = true;
                      }
                  });
                  if (modified) {
                      await fetch(`https://kvdb.io/${bucket}/leaderboard`, {
                          method: 'POST',
                          body: JSON.stringify(board)
                      });
                      if (typeof updateLeaderboardUI === 'function') updateLeaderboardUI();
                  }
              } catch(e) { console.error("Could not update leaderboard name", e); }
          }
      } catch (e) {
          console.error("Uniqueness check failed", e);
      }
      
      btnSaveProfile.disabled = false;
      btnSaveProfile.style.opacity = "1";
      btnSaveProfile.innerText = "SAVE";
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
  
  refInput.value = `${window.location.origin}${window.location.pathname}?ref=${userAddress}`;
  lblBest.innerText = localStorage.getItem('bb_v1_best') || "0";
  
  if (typeof updateLeaderboardUI === 'function') updateLeaderboardUI();
  
  await checkNetwork();
  const provider = window.ethereum;
  if (provider) {
    const chainIdHex = await provider.request({ method: 'eth_chainId' });
    if (parseInt(chainIdHex, 16) !== BASE_MAINNET) {
      await switchNetwork();
    }
  }
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
  
  if (typeof updateLeaderboardUI === 'function') updateLeaderboardUI();
}

async function checkNetwork() {
  const provider = window.ethereum;
  if (!provider) return;
  const chainIdHex = await provider.request({ method: 'eth_chainId' });
  const chainId = parseInt(chainIdHex, 16);
  
  if (chainId !== 8453) {
    lblNetwork.innerText = "Wrong Network";
    lblNetwork.style.color = "#ff2a7a";
    btnSwitch.innerText = "Switch to Base Mainnet";
    btnSwitch.classList.remove("hidden");
  } else {
    lblNetwork.innerText = "Base Mainnet";
    lblNetwork.style.color = "#0052FF";
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
          chainName: 'Base Mainnet',
          rpcUrls: ['https://mainnet.base.org'],
          nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
          blockExplorerUrls: ['https://basescan.org/']
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
    const ethersProvider = new ethers.BrowserProvider(provider);
    const signer = await ethersProvider.getSigner();
    
    // Generate contract call data for: function claim(uint256 amount)
    const tokenAbi = ["function claim(uint256 amount) public"];
    const iface = new ethers.Interface(tokenAbi);
    const parsedAmount = ethers.parseUnits(amount.toString(), 18);
    const data = iface.encodeFunctionData("claim", [parsedAmount]);

    const txResponse = await signer.sendTransaction({
      to: BB_TOKEN_ADDRESS,
      data: data
    });
    
    // Wait for the transaction to be mined (1 confirmation)
    const receipt = await txResponse.wait(1);
    
    if (receipt && receipt.status === 1) {
        console.log("BB Tokens claimed successfully!");
        return true;
    }
    return false;
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

window.mintNFT = async function(nftName, btnElement, taskId) {
  if (!window.userAddress) {
    showInfoModal('Wallet Required', 'You must connect your wallet to mint this NFT!');
    return;
  }
  
  const provider = window.ethereum;
  if (!provider) return;

  // Show loading state
  const originalHTML = btnElement ? btnElement.innerHTML : '';
  if (btnElement) {
    btnElement.innerHTML = '<span style="font-size:0.6rem; color:#fff;">MINTING...</span>';
    btnElement.style.pointerEvents = 'none';
    btnElement.style.filter = 'brightness(0.7)';
  }

  try {
    const ethersProvider = new ethers.BrowserProvider(provider);
    const signer = await ethersProvider.getSigner();
    
    // Generate contract call data for: function mint(string name)
    const nftAbi = ["function mint(string memory name) public"];
    const iface = new ethers.Interface(nftAbi);
    const data = iface.encodeFunctionData("mint", [nftName]);

    const txResponse = await signer.sendTransaction({
      to: NFT_CONTRACT_ADDRESS,
      data: data
    });
    
    // Wait for the transaction to be mined (1 confirmation)
    const receipt = await txResponse.wait(1);
    
    if (receipt && receipt.status === 1) {
        if (taskId) localStorage.setItem('bb_v1_minted_' + taskId, 'true');
        showInfoModal('Success!', `Successfully minted ${nftName} on Base Network!`);
        if (typeof window.renderAchievements === 'function') window.renderAchievements('general');
    } else {
        alert("Transaction failed on chain.");
    }
  } catch (error) {
    console.error("NFT Mint failed:", error);
  } finally {
    if (btnElement) {
      btnElement.innerHTML = originalHTML;
      btnElement.style.pointerEvents = 'auto';
      btnElement.style.filter = '';
    }
  }
};

window.renderAchievements = null; // Will be set by game.js

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

async function purchaseItemOnChain(item) {
  if (!userAddress) {
    if (typeof window.showInfoModal === 'function') window.showInfoModal("Wallet Required", "Please connect your wallet to purchase items.");
    return false;
  }

  try {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const network = await provider.getNetwork();
    if (Number(network.chainId) !== TARGET_CHAIN) {
      if (typeof window.showInfoModal === 'function') window.showInfoModal("Wrong Network", "Please switch to the Base Mainnet.");
      return false;
    }

    const signer = await provider.getSigner();
    const purchaseAmount = ethers.parseEther("0.00004"); // Approx $0.10

    if (typeof window.showInfoModal === 'function') window.showInfoModal("Wallet Action Required", "Please confirm the transaction in your wallet.");

    const tx = await signer.sendTransaction({
      to: TREASURY_ADDRESS,
      value: purchaseAmount
    });

    if (typeof window.showInfoModal === 'function') window.showInfoModal("Transaction Sent", "Processing on-chain... Please wait.");
    await tx.wait();
    
    return true;
  } catch (e) {
    console.error("Purchase failed", e);
    if (typeof window.showInfoModal === 'function') window.showInfoModal("Purchase Canceled", "Transaction was rejected or failed.");
    return false;
  }
}

async function mintAchievementOnChain(id) {
  if (!userAddress) {
    if (typeof window.showInfoModal === 'function') window.showInfoModal("Wallet Required", "Please connect your wallet to mint achievements.");
    return false;
  }

  try {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const network = await provider.getNetwork();
    if (Number(network.chainId) !== TARGET_CHAIN) {
      if (typeof window.showInfoModal === 'function') window.showInfoModal("Wrong Network", "Please switch to the Base Mainnet.");
      return false;
    }

    const signer = await provider.getSigner();
    const mintFee = ethers.parseEther("0.00004"); // Approx $0.10

    if (typeof window.showInfoModal === 'function') window.showInfoModal("Minting Achievement", "Please confirm the transaction in your wallet.");

    const tx = await signer.sendTransaction({
      to: TREASURY_ADDRESS,
      value: mintFee
    });

    if (typeof window.showInfoModal === 'function') window.showInfoModal("Minting Started", "Processing on-chain... Your achievement is being minted.");
    await tx.wait();
    
    return true;
  } catch (e) {
    console.error("Minting failed", e);
    if (typeof window.showInfoModal === 'function') window.showInfoModal("Minting Canceled", "Transaction was rejected or failed.");
    return false;
  }
}

// Export to window
window.mintAchievementOnChain = mintAchievementOnChain;
window.purchaseItemOnChain = purchaseItemOnChain;
