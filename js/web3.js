// js/web3.js
const BASE_MAINNET = 8453;
const BASE_SEPOLIA = 84532;
const ABSTRACT_MAINNET = 2741;
const TARGET_CHAIN = BASE_MAINNET;
const TARGET_CHAIN_HEX = "0x" + TARGET_CHAIN.toString(16);
const BUILDER_CODE_SUFFIX = "62635f67323074347730780b0080218021802180218021802180218021";

const ABSTRACT_NETWORK = {
  chainId: "0xab5", // 2741
  chainName: "Abstract Mainnet",
  nativeCurrency: { name: "ETH", symbol: "ETH", decimals: 18 },
  rpcUrls: ["https://api.mainnet.abs.xyz"],
  blockExplorerUrls: ["https://abscan.org/"]
};

let provider;
let signer;
let userAddress = null;

// Replace these with your actual deployed contract addresses on Base Sepolia/Mainnet
const BB_TOKEN_ADDRESS = "0x0000000000000000000000000000000000000001"; 
const NFT_CONTRACT_ADDRESS = "0x0000000000000000000000000000000000000002";
const LEADERBOARD_CONTRACT_ADDRESS = "0x0000000000000000000000000000000000000003";
const TREASURY_ADDRESS = "0x7Da10DeE012a89d3bb454047Fe29Fd130952058E";

// DOM placeholders
let btnConnect, btnSwitch, viewConnect, viewDetails;
let userProfileArea, currentUserName, currentUserAvatar, btnProfileSettings, btnDisconnect, inputUsername, btnSaveProfile, avatarGrid;
let lblNetwork, lblAddress, lblBest, lblRefs, refInput, btnCopyRef, refText;

const AVATAR_LIST = [
  { id: 'classic', svg: `data:image/svg+xml;utf8,<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><path d="M 20 60 C 15 20 85 20 80 60 L 75 85 Q 50 100 25 85 Z" fill="%23ffd1b3"/><path d="M 15 45 Q 50 15 85 45 L 80 55 Q 50 35 20 55 Z" fill="%234db8b8"/><path d="M 18 35 C 20 -5 80 -5 82 35 Z" fill="%23111"/><path d="M 20 55 Q 50 45 80 55 L 75 70 Q 50 78 25 70 Z" fill="%23111"/><path d="M 32 58 Q 38 52 45 58 Z" fill="%23fff"/><path d="M 55 58 Q 62 52 68 58 Z" fill="%23fff"/></svg>` },
  { id: 'ninja', svg: `data:image/svg+xml;utf8,<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><path d="M 20 20 Q 50 0 80 20 L 85 50 Q 80 95 50 95 Q 20 95 15 50 Z" fill="%23111"/><path d="M 25 45 Q 50 60 75 45 L 75 65 Q 50 75 25 65 Z" fill="%23fcd34d"/><path d="M 25 48 L 45 55 L 45 52 L 25 45 Z" fill="%23111"/><path d="M 75 48 L 55 55 L 55 52 L 75 45 Z" fill="%23111"/><path d="M 30 55 Q 38 52 42 56 Q 38 60 30 55 Z" fill="%23fff"/><circle cx="37" cy="55" r="2" fill="%23111"/><path d="M 70 55 Q 62 52 58 56 Q 62 60 70 55 Z" fill="%23fff"/><circle cx="63" cy="55" r="2" fill="%23111"/><path d="M 50 68 L 40 85 M 50 68 L 60 85 M 50 68 L 50 90" stroke="%23333" stroke-width="2" fill="none"/><path d="M 17 35 Q 50 45 83 35 L 85 20 Q 50 25 15 20 Z" fill="%23ef4444"/><path d="M 17 35 Q 50 45 83 35 L 85 20 Q 50 25 15 20 Z" fill="none" stroke="%23b91c1c" stroke-width="2"/><path d="M 15 30 Q 5 60 10 85 Q 15 60 20 30 Z" fill="%23ef4444"/><path d="M 18 25 Q -5 50 0 75 Q 5 50 15 25 Z" fill="%23dc2626"/></svg>` },
  { id: 'cyber', svg: `data:image/svg+xml;utf8,<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><defs><radialGradient id="astroBg" cx="50%" cy="50%" r="50%"><stop offset="0%" stop-color="%23ffffff"/><stop offset="100%" stop-color="%23cbd5e1"/></radialGradient></defs><rect x="35" y="55" width="30" height="35" rx="15" fill="url(%23astroBg)" stroke="%2394a3b8" stroke-width="2"/><path d="M 50 15 L 50 5" stroke="%23cbd5e1" stroke-width="3"/><circle cx="50" cy="5" r="4" fill="%2300e5ff"/><rect x="15" y="15" width="70" height="45" rx="20" fill="url(%23astroBg)" stroke="%2394a3b8" stroke-width="2"/><rect x="20" y="20" width="60" height="35" rx="15" fill="%230052ff"/><ellipse cx="35" cy="40" rx="8" ry="12" fill="%23111"/><circle cx="37" cy="35" r="3" fill="%23fff"/><ellipse cx="65" cy="40" rx="8" ry="12" fill="%23111"/><circle cx="67" cy="35" r="3" fill="%23fff"/></svg>` },
  { id: 'wizard', svg: `data:image/svg+xml;utf8,<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><circle cx="50" cy="60" r="30" fill="%23ffedd5"/><path d="M 20 60 Q 50 110 80 60 Z" fill="%23fff"/><circle cx="35" cy="55" r="4" fill="%23111"/><circle cx="65" cy="55" r="4" fill="%23111"/><path d="M 25 45 Q 35 40 45 45" fill="none" stroke="%23fff" stroke-width="4" stroke-linecap="round"/><path d="M 55 45 Q 65 40 75 45" fill="none" stroke="%23fff" stroke-width="4" stroke-linecap="round"/><path d="M 25 40 L 50 5 L 75 40 Z" fill="%231e40af"/><ellipse cx="50" cy="40" rx="45" ry="8" fill="%231e40af"/><path d="M 27 36 Q 50 44 73 36 L 70 30 Q 50 38 30 30 Z" fill="%23fff"/><path d="M 50 68 Q 30 60 10 75 Q 30 75 50 68 Z" fill="%23fff"/><path d="M 50 68 Q 70 60 90 75 Q 70 75 50 68 Z" fill="%23fff"/><circle cx="50" cy="65" r="6" fill="%23fbcfe8"/><path d="M 55 25 A 6 6 0 1 0 55 13 A 8 8 0 1 1 55 25 Z" fill="%23facc15"/><circle cx="35" cy="20" r="2" fill="%23fff"/><circle cx="45" cy="10" r="2" fill="%23fff"/><circle cx="65" cy="25" r="2" fill="%23fff"/></svg>` },
  { id: 'demon', svg: `images/demon_avatar.jpg` },
  { id: 'troop', svg: `data:image/svg+xml;utf8,<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><path d="M 15 35 C 15 5, 85 5, 85 35 L 90 65 C 95 85, 75 95, 60 95 L 50 88 L 40 95 C 25 95, 5 85, 10 65 Z" fill="%23ef4444" stroke="%23111" stroke-width="3" stroke-linejoin="round"/><path d="M 12 40 L 88 40" fill="none" stroke="%23111" stroke-width="3"/><path d="M 13 48 L 87 48" fill="none" stroke="%23111" stroke-width="3"/><path d="M 25 15 L 25 40 M 35 10 L 35 40 M 45 8 L 45 40 M 55 8 L 55 40 M 65 10 L 65 40 M 75 15 L 75 40" stroke="%23111" stroke-width="1.5" opacity="0.6"/><path d="M 13 48 L 87 48 L 83 58 L 50 68 L 17 58 Z" fill="%23111"/><path d="M 28 58 L 72 58 L 60 85 L 40 85 Z" fill="%23111"/><path d="M 17 58 L 42 85 L 32 90 L 14 70 Z" fill="%23ef4444" stroke="%23111" stroke-width="2" stroke-linejoin="round"/><path d="M 25 65 L 35 78 M 30 62 L 40 75" stroke="%23111" stroke-width="2"/><path d="M 83 58 L 58 85 L 68 90 L 86 70 Z" fill="%23ef4444" stroke="%23111" stroke-width="2" stroke-linejoin="round"/><path d="M 75 65 L 65 78 M 70 62 L 60 75" stroke="%23111" stroke-width="2"/><path d="M 45 65 L 55 65 L 55 88 L 45 88 Z" fill="%23ef4444" stroke="%23111" stroke-width="2" stroke-linejoin="round"/><path d="M 47 70 L 53 70 M 47 75 L 53 75 M 47 80 L 53 80" stroke="%23111" stroke-width="2"/><path d="M 30 92 L 50 85 L 70 92" fill="none" stroke="%23111" stroke-width="3" stroke-linejoin="round"/></svg>` },
  { id: 'galaxy', svg: `data:image/svg+xml;utf8,<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><rect x="10" y="10" width="80" height="80" rx="15" fill="%231e3a8a"/><path d="M 10 45 L 90 45 L 90 75 A 15 15 0 0 1 75 90 L 25 90 A 15 15 0 0 1 10 75 Z" fill="%239333ea"/><path d="M 5 25 C 15 50, 30 50, 45 40 L 50 50 L 55 40 C 70 50, 85 50, 95 25 C 80 40, 70 30, 50 25 C 30 30, 20 40, 5 25 Z" fill="%23facc15"/><circle cx="35" cy="55" r="4" fill="%23ef4444" stroke="%23111" stroke-width="1"/><circle cx="65" cy="55" r="4" fill="%23ef4444" stroke="%23111" stroke-width="1"/><path d="M 35 75 Q 50 80 65 75" fill="none" stroke="%23581c87" stroke-width="2" stroke-linecap="round"/><path d="M 40 80 L 40 90 M 50 80 L 50 90 M 60 80 L 60 90" stroke="%23581c87" stroke-width="1.5"/></svg>` },
  { id: 'pika', svg: `data:image/svg+xml;utf8,<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><path d="M 50 10 L 40 25 L 55 25 L 45 45 Z" fill="%23facc15" stroke="%23ca8a04" stroke-width="2"/><path d="M 20 40 L 5 10 L 40 30 Z" fill="%23facc15"/><path d="M 20 40 L 5 10 L 15 25 Z" fill="%23111"/><path d="M 80 40 L 95 10 L 60 30 Z" fill="%23facc15"/><path d="M 80 40 L 95 10 L 85 25 Z" fill="%23111"/><circle cx="50" cy="55" r="35" fill="%23facc15"/><circle cx="25" cy="65" r="8" fill="%23ef4444"/><circle cx="75" cy="65" r="8" fill="%23ef4444"/><circle cx="35" cy="52" r="6" fill="%23111"/><circle cx="65" cy="52" r="6" fill="%23111"/><circle cx="33" cy="49" r="2" fill="%23fff"/><circle cx="63" cy="49" r="2" fill="%23fff"/><circle cx="37" cy="55" r="1.5" fill="%23ca8a04"/><circle cx="67" cy="55" r="1.5" fill="%23ca8a04"/><circle cx="50" cy="60" r="2" fill="%23111"/><path d="M 42 63 Q 46 68 50 63 Q 54 68 58 63" fill="none" stroke="%23111" stroke-width="3" stroke-linecap="round"/></svg>` },
  { id: 'mini', svg: `data:image/svg+xml;utf8,<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><circle cx="50" cy="50" r="45" fill="%23facc15"/><rect x="5" y="45" width="90" height="10" fill="%23111"/><circle cx="32" cy="50" r="18" fill="%2394a3b8"/><circle cx="68" cy="50" r="18" fill="%2394a3b8"/><circle cx="32" cy="50" r="14" fill="%23fff"/><circle cx="68" cy="50" r="14" fill="%23fff"/><circle cx="32" cy="50" r="6" fill="%2378350f"/><circle cx="68" cy="50" r="6" fill="%2378350f"/><circle cx="32" cy="50" r="3" fill="%23111"/><circle cx="68" cy="50" r="3" fill="%23111"/><circle cx="50" cy="80" r="5" fill="%23111"/></svg>` },
  { id: 'dino', svg: `data:image/svg+xml;utf8,<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><polygon points="30,15 20,30 40,30" fill="%233a6a40"/><polygon points="70,15 60,30 80,30" fill="%233a6a40"/><path d="M 20 50 C 20 20, 80 20, 80 50 L 90 70 C 90 95, 10 95, 10 70 Z" fill="%2370a174"/><path d="M 20 50 C 20 20, 80 20, 80 50 C 60 55, 40 55, 20 50 Z" fill="%234a7a50"/><circle cx="35" cy="45" r="7" fill="%23111"/><circle cx="33" cy="43" r="2" fill="%23fff"/><circle cx="65" cy="45" r="7" fill="%23111"/><circle cx="63" cy="43" r="2" fill="%23fff"/><ellipse cx="30" cy="65" rx="4" ry="2" fill="none" stroke="%234a7a50" stroke-width="2"/><ellipse cx="70" cy="65" rx="4" ry="2" fill="none" stroke="%234a7a50" stroke-width="2"/><circle cx="50" cy="60" r="1.5" fill="%234a7a50"/><circle cx="42" cy="62" r="1.5" fill="%234a7a50"/><circle cx="58" cy="62" r="1.5" fill="%234a7a50"/><path d="M 25 75 Q 50 85 75 75" fill="none" stroke="%234a7a50" stroke-width="3" stroke-linecap="round"/><polygon points="35,78 40,85 45,79" fill="%23fff"/><polygon points="65,78 60,85 55,79" fill="%23fff"/></svg>` }
];
if (!localStorage.getItem('bb_v1_uuid')) {
    localStorage.setItem('bb_v1_uuid', 'u-' + Math.random().toString(36).substr(2, 9));
}

async function fetchWithTimeout(resource, options = {}) {
  const { timeout = 5000 } = options;
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(resource, { ...options, signal: controller.signal });
    clearTimeout(id);
    return response;
  } catch (e) {
    clearTimeout(id);
    throw e;
  }
}

let currentUsername = localStorage.getItem('bb_v1_username');
window.assignNewUsername = async function() {
    if (localStorage.getItem('bb_v1_username')) return;
    try {
        const countUrl = 'https://kvdb.io/3Bz5so9xQFGY6vAGb68Mfx/player_count';
        let res = await fetchWithTimeout(`${countUrl}?t=${new Date().getTime()}`, { cache: 'no-store' });
        let count = 0;
        if (res.ok) count = parseInt(await res.text()) || 0;
        count++;
        await fetchWithTimeout(countUrl, { method: 'POST', body: count.toString() });
        
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
};

let selectedAvatar = localStorage.getItem('bb_v1_avatar') || 'classic';

function getAvatarSVG(id) {
  const item = AVATAR_LIST.find(a => a.id === id) || AVATAR_LIST[0];
  return item.svg;
}

function updateProfileUI() {
  if (currentUserName) currentUserName.innerText = currentUsername;
  if (currentUserAvatar) {
      let bgSize = selectedAvatar === 'demon' ? '175%' : 'contain';
      currentUserAvatar.style.background = `#111 url('${getAvatarSVG(selectedAvatar)}') no-repeat center/${bgSize}`;
  }
}

function initProfileModal() {
  if (!avatarGrid) return;
  avatarGrid.innerHTML = '';
  AVATAR_LIST.forEach(item => {
    const div = document.createElement('div');
    div.style.width = '60px'; div.style.height = '60px'; div.style.borderRadius = '12px';
    let bgSize = item.id === 'demon' ? '120%' : '70%';
    div.style.cursor = 'pointer'; div.style.background = `rgba(255,255,255,0.05) url('${item.svg}') no-repeat center/${bgSize}`;
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

// DOM Labels
// Will be initialized in initWeb3

let web3Initialized = false;
async function initWeb3() {
  if (web3Initialized) return;
  web3Initialized = true;
  console.log("Initializing Web3...");
  
  // Initialize DOM references
  btnConnect = document.getElementById("btn-connect-wallet");
  btnSwitch = document.getElementById("btn-switch-network");
  viewConnect = document.getElementById("onchain-connect-view");
  viewDetails = document.getElementById("onchain-details-view");
  userProfileArea = document.getElementById("user-profile-area");
  currentUserName = document.getElementById("current-user-name");
  currentUserAvatar = document.getElementById("current-user-avatar");
  btnProfileSettings = document.getElementById("btn-profile-settings");
  btnDisconnect = document.getElementById("btn-disconnect-wallet");
  inputUsername = document.getElementById("username-input");
  btnSaveProfile = document.getElementById("btn-save-profile");
  avatarGrid = document.getElementById("avatar-grid");
  lblNetwork = document.getElementById("network-status");
  lblAddress = document.getElementById("wallet-address");
  lblBest = document.getElementById("onchain-best");
  lblRefs = document.getElementById("onchain-refs");
  refInput = document.getElementById("ref-link-input");
  btnCopyRef = document.getElementById("btn-copy-ref");
  refText = document.getElementById("referred-by-text");

  if (btnConnect) btnConnect.innerText = "CONNECT WALLET";

  const provider = window.ethereum;
  const isDisconnected = localStorage.getItem('bb_v1_disconnected') === 'true';

  if (provider) {
    if (!isDisconnected) {
      try {
        const accounts = await provider.request({ method: "eth_accounts" });
        if (accounts && accounts.length > 0) {
          await handleConnect(accounts[0]);
        }
      } catch (e) { console.error("Auto-connect failed", e); }
    }

    provider.on('accountsChanged', async (accounts) => {
      if (accounts && accounts.length > 0) {
        localStorage.removeItem('bb_v1_disconnected');
        if (window.userAddress && window.userAddress.toLowerCase() !== accounts[0].toLowerCase()) {
            if (typeof window.wipeLocalGameState === 'function') window.wipeLocalGameState();
            window.location.reload();
            return;
        }
        await handleConnect(accounts[0]);
      } else {
        handleDisconnect();
      }
    });
    provider.on('chainChanged', () => window.location.reload());
  } else {
    if (btnConnect) btnConnect.innerText = "CONNECT WALLET";
  }

  // Open multi-wallet picker instead of direct connect
  btnConnect.addEventListener("click", () => {
    document.getElementById('modal-backdrop').classList.remove('hidden');
    document.getElementById('modal-wallet-picker').classList.remove('hidden');
    checkInstalledWallets();
  });

  function checkInstalledWallets() {
      const badges = document.querySelectorAll('.badge-installed');
      badges.forEach(badge => {
          const type = badge.getAttribute('data-wallet');
          let installed = false;
          if (type === 'metamask') installed = !!(window.ethereum && window.ethereum.isMetaMask);
          if (type === 'okx') installed = !!window.okxwallet;
          if (type === 'zerion') installed = !!window.zerionWallet;
          if (type === 'rabby') installed = !!(window.ethereum && window.ethereum.isRabby);
          if (type === 'phantom') installed = !!(window.phantom?.ethereum || (window.ethereum && window.ethereum.isPhantom));
          
          if (installed) badge.classList.remove('hidden');
          else badge.classList.add('hidden');
      });
  }

  // WalletConnect Project ID (Generic or placeholder - typically requires a real ID from reown.com)
  const WC_PROJECT_ID = '93019183492083492083492083492083'; // Placeholder
  let wcModal = null;

  window.connectWallet = async function(type) {
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth < 900;
    const dappUrl = window.location.href.split('://')[1]; // strip https://
    
    if (type === 'walletconnect') {
        // Explicitly hide the picker first to prevent side-by-side overlap
        document.getElementById('modal-wallet-picker')?.classList.add('hidden');
        
        if (typeof window.showInfoModal === 'function') {
            window.showInfoModal(
                "Coming Soon!", 
                "WalletConnect is currently under maintenance and will be available soon. Please use another wallet extension for now. Thank you for your patience!",
                "OK",
                () => {
                    // This is the return action: close everything then restore the picker
                    window.closeModals();
                    document.getElementById('modal-wallet-picker')?.classList.remove('hidden');
                    document.getElementById('modal-backdrop')?.classList.remove('hidden');
                }
            );
        } else {
            alert("WalletConnect is coming soon!");
        }
        return;
    }

    if (type === 'metamask' && isMobile && !window.ethereum) {
        window.open(`https://metamask.app.link/dapp/${dappUrl}`, "_blank");
        return;
    }

    let p = window.ethereum;
    if (type === 'coinbase') p = window.coinbaseWalletExtension || (window.ethereum && window.ethereum.isCoinbaseWallet ? window.ethereum : null);
    if (type === 'phantom') p = window.phantom?.ethereum || (window.ethereum && window.ethereum.isPhantom ? window.ethereum : null);
    if (type === 'zerion') p = window.zerionWallet || (window.ethereum && window.ethereum.isZerion ? window.ethereum : null);
    if (type === 'okx') p = window.okxwallet || (window.ethereum && window.ethereum.isOKXWallet ? window.ethereum : null);


    if (!p) {
        const urls = {
            metamask: "https://metamask.io/download/",
            rabby: "https://rabby.io/",
            phantom: "https://phantom.app/",
            coinbase: "https://www.coinbase.com/wallet",
            zerion: "https://zerion.io/",
            okx: "https://www.okx.com/web3"
        };
        if (urls[type]) window.open(urls[type], "_blank");
        return;
    }

    if (!p) p = window.ethereum; // final fallback

    if (!p) {
        alert("No wallet detected. Please install a wallet extension.");
        return;
    }

    try {
      const accounts = await p.request({ method: "eth_requestAccounts" });
      if (accounts && accounts.length > 0) {
        localStorage.removeItem('bb_v1_disconnected');
        window.closeModals();
        await handleConnect(accounts[0]);
      }
    } catch (error) {
      console.error(error);
      alert("Connection failed: " + (error.message || error));
    }
  };

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
          const res = await fetchWithTimeout(`https://kvdb.io/${bucket}/${userKey}`);
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
          await fetchWithTimeout(`https://kvdb.io/${bucket}/${userKey}`, { method: 'POST', body: myUUID });
          
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
                      await fetchWithTimeout(`https://kvdb.io/${bucket}/leaderboard`, {
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
    if (typeof window.syncDataToCloud === 'function') window.syncDataToCloud();
    updateProfileUI();
    window.closeModals();
  });
  
  checkURLReferral();
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
  
  if (typeof window.loadDataFromCloud === 'function') {
      const hasCloudData = await window.loadDataFromCloud(userAddress);
      
      if (!hasCloudData || !localStorage.getItem('bb_v1_username')) {
          if (typeof window.assignNewUsername === 'function') await window.assignNewUsername();
          if (typeof window.syncDataToCloud === 'function') window.syncDataToCloud();
      }
      
      if (typeof window.reloadGameData === 'function') window.reloadGameData();
      if (typeof updateProfileUI === 'function') {
          currentUsername = localStorage.getItem('bb_v1_username') || "Player";
          selectedAvatar = localStorage.getItem('bb_v1_avatar') || "classic";
          updateProfileUI();
      }
  }

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

window.wipeLocalGameState = function() {
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('bb_v') && key !== 'bb_v1_uuid' && key !== 'bb_v1_disconnected') {
            keysToRemove.push(key);
        }
    }
    keysToRemove.forEach(k => localStorage.removeItem(k));
};

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
  
  if (typeof window.wipeLocalGameState === 'function') window.wipeLocalGameState();
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
      data: data + BUILDER_CODE_SUFFIX
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
      data: data + BUILDER_CODE_SUFFIX
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

// Ensure closeModals is truly global and handled in index.html for UI consistency
// Removed redundant definition from web3.js to prevent conflicts.



document.addEventListener('DOMContentLoaded', () => {
    initWeb3().catch(err => console.error("Web3 critical init failure:", err));
});
// Backwards compatibility/safety
if (document.readyState === 'complete' || document.readyState === 'interactive') {
    initWeb3().catch(err => console.error("Web3 immediate init failure:", err));
}

async function purchaseItemOnChain(item) {
  if (!userAddress) {
    if (typeof window.showInfoModal === 'function') window.showInfoModal("Wallet Required", "Please connect your wallet to purchase this item.");
    return false;
  }

  try {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const network = await provider.getNetwork();
    if (Number(network.chainId) !== TARGET_CHAIN) {
      if (typeof window.showInfoModal === 'function') window.showInfoModal("Wrong Network", "Please switch to the Base Network.");
      return false;
    }

    const signer = await provider.getSigner();
    const fee = ethers.parseEther("0.00004"); // Approx $0.10

    if (typeof window.showInfoModal === 'function') window.showInfoModal("Processing Transaction", `Please confirm the $0.10 network fee in your wallet to proceed with ${item.name || 'this purchase'}.`);

    const tx = await signer.sendTransaction({
      to: TREASURY_ADDRESS,
      value: fee,
      data: "0x" + BUILDER_CODE_SUFFIX
    });

    if (typeof window.showInfoModal === 'function') window.showInfoModal("Transaction Sent", "Waiting for confirmation...");
    await tx.wait();
    
    return true;
  } catch (e) {
    console.error("Purchase failed", e);
    if (typeof window.showInfoModal === 'function') window.showInfoModal("Transaction Canceled", "Transaction was rejected or failed.");
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
      value: mintFee,
      data: "0x" + BUILDER_CODE_SUFFIX
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
