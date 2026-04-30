// js/game.js
// Polyfill for CanvasRenderingContext2D.prototype.roundRect
if (!CanvasRenderingContext2D.prototype.roundRect) {
  CanvasRenderingContext2D.prototype.roundRect = function (x, y, w, h, radii) {
    let r = 0;
    if (typeof radii === "number") r = radii;
    else if (Array.isArray(radii) && radii.length > 0) r = radii[0];
    if (w < 2 * r) r = w / 2;
    if (h < 2 * r) r = h / 2;
    this.moveTo(x + r, y);
    this.arcTo(x + w, y, x + w, y + h, r);
    this.arcTo(x + w, y + h, x, y + h, r);
    this.arcTo(x, y + h, x, y, r);
    this.arcTo(x, y, x + w, y, r);
    this.closePath();
    return this;
  };
}

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const prevCanvas = document.getElementById('previewCanvas');
const prevCtx = prevCanvas.getContext('2d');

const scoreEl = document.getElementById('ui-score');
const bestEl = document.getElementById('ui-best');
const perfectEl = document.getElementById('perfect-msg');
const tutEl = document.getElementById('tutorial-msg');
const gameOverOverlay = document.getElementById('game-over-overlay');
const finalScoreEl = document.getElementById('final-score');
const uiCoinsEl = document.getElementById('ui-coins');
const levelNameEl = document.getElementById('ui-level-name');
console.log("%c BASE BRIDGE v17 LOADED %c", "background: #0052ff; color: #fff; font-size: 20px; font-weight: bold; padding: 10px;", "");

const levelFillEl = document.getElementById('ui-level-fill');
const btnRevive = document.getElementById('btn-revive');

function renderDailyCheckinPanel() {
  const cardsContainer = document.getElementById('neon-cards-container');
  const nodesContainer = document.getElementById('neon-timeline-nodes');
  const dashboardGrid = document.getElementById('dashboard-daily-grid');
  const openBtn = document.getElementById('btn-open-daily-modal');
  const claimBtn = document.getElementById('btn-claim-daily');
  
  if (!cardsContainer || !nodesContainer) return;

  let streak = parseInt(localStorage.getItem('bb_v1_checkin_streak') || '0');
  let currentDayInWeek = (streak % 7) + 1;

  const lastCheckinDate = localStorage.getItem('bb_v2_last_checkin_date');
  const today = new Date().toLocaleDateString();
  
  if (lastCheckinDate === today) {
    currentDayInWeek = ((streak - 1) % 7) + 1;
  }

  // Ninja Icon for all 7 days (matching the user's uploaded image)
  const ninjaSVG = `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <circle cx="50" cy="50" r="45" fill="#111"/>
    <rect x="30" y="45" width="40" height="20" rx="5" fill="#ffbda1"/>
    <circle cx="42" cy="55" r="4" fill="#111"/>
    <circle cx="58" cy="55" r="4" fill="#111"/>
    <rect x="15" y="30" width="70" height="20" rx="8" fill="#ff0000"/>
  </svg>`;
  
  // 7 Different Neon Glow Colors
  const neonColors = ['#ef4444', '#f97316', '#facc15', '#4ade80', '#00e5ff', '#3b82f6', '#d946ef'];

  cardsContainer.innerHTML = '';
  nodesContainer.innerHTML = '';
  if (dashboardGrid) dashboardGrid.innerHTML = '';

  for (let i = 1; i <= 7; i++) {
    const isClaimed = i < currentDayInWeek || (i === currentDayInWeek && lastCheckinDate === today);
    const isActive = i === currentDayInWeek && lastCheckinDate !== today;
    const reward = 50 + ((i - 1) * 25);

    // --- Modal Neon Card ---
    const card = document.createElement('div');
    card.className = `neon-card ${isActive ? 'active' : ''} ${isClaimed ? 'claimed' : ''}`;
    // Apply dynamic neon border/shadow if active or claimed
    if (isActive || isClaimed) {
      const color = isActive ? neonColors[i-1] : '#00ff88';
      card.style.borderColor = color;
      card.style.boxShadow = `0 0 20px ${color}, inset 0 0 15px ${color}`;
      card.style.filter = `drop-shadow(0 0 5px ${color})`;
    }
    card.innerHTML = `<div class="neon-card-icon" style="filter: drop-shadow(0 0 12px ${neonColors[i-1]});">${ninjaSVG}</div>`;
    cardsContainer.appendChild(card);

    // --- Modal Timeline Node ---
    const node = document.createElement('div');
    node.className = `neon-node ${isActive ? 'active' : ''} ${isClaimed ? 'claimed' : ''}`;
    if (isActive) {
      node.style.backgroundColor = '#fff';
      node.style.boxShadow = `0 0 15px #fff, 0 0 20px ${neonColors[i-1]}`;
    }
    if (isClaimed) {
      node.style.backgroundColor = '#00ff88';
      node.style.boxShadow = `0 0 15px #00ff88`;
      node.innerHTML = `<div style="width:6px; height:6px; background:#fff; border-radius:50%; margin:4px auto 0;"></div><div class="neon-node-label">DAY ${i}</div>`;
    } else {
      node.innerHTML = `<div class="neon-node-label">DAY ${i}</div>`;
    }
    nodesContainer.appendChild(node);
    
    // --- Dashboard Visual Grid Card ---
    if (dashboardGrid) {
      const dashCard = document.createElement('div');
      dashCard.className = 'checkin-day-card';
      if (isClaimed) dashCard.classList.add('claimed');
      else if (isActive) dashCard.classList.add('current');
      
      let tickHTML = isClaimed ? `<span style='color:#00ff88; font-size:1.2rem; line-height:1;'>✓</span>` : `<span class="reward-amt">${reward}</span>`;
      
      dashCard.innerHTML = `<span class="day-title">Day ${i}</span>${tickHTML}`;
      dashboardGrid.appendChild(dashCard);
    }
  }

  // Update Buttons
  if (lastCheckinDate === today) {
    if (openBtn) {
      openBtn.innerHTML = "CHECKED IN <span style='color:#00ff88;'>✓</span>";
      // Keeping it clickable so user can open modal to see their progress as requested!
      openBtn.disabled = false;
      openBtn.classList.replace('btn-green', 'btn-gray');
    }
    if (claimBtn) {
      claimBtn.innerText = "CLAIMED ✓";
      claimBtn.disabled = true;
    }
  } else {
    if (openBtn) {
      openBtn.innerText = "CHECK IN";
      openBtn.disabled = false;
      openBtn.classList.replace('btn-gray', 'btn-green');
    }
    if (claimBtn) {
      claimBtn.innerText = "CHECK IN TODAY";
      claimBtn.disabled = false;
      claimBtn.onclick = () => doDailyCheckin();
    }
  }
}

async function doDailyCheckin() {
  const claimBtn = document.getElementById('btn-claim-daily');
  claimBtn.innerText = "PROCESSING...";
  claimBtn.disabled = true;

  const success = await window.purchaseItemOnChain({ id: 'daily_checkin', name: 'Daily Check-in' });
  if (success) {
    let streak = parseInt(localStorage.getItem('bb_v1_checkin_streak') || '0');
    streak++;
    localStorage.setItem('bb_v1_checkin_streak', streak);

    let total = parseInt(localStorage.getItem('bb_v1_total_checkins') || '0');
    total++;
    localStorage.setItem('bb_v1_total_checkins', total);

    const today = new Date().toLocaleDateString();
    localStorage.setItem('bb_v2_last_checkin_date', today);

    // Award BB (base 50 + 25 per day in week)
    const currentDayInWeek = ((streak - 1) % 7) + 1;
    const reward = 50 + ((currentDayInWeek - 1) * 25);
    
    coins += reward;
    localStorage.setItem('bb_v1_coins', coins);
    uiCoinsEl.innerText = coins;

    renderDailyCheckinPanel();
    
    // Auto hide the daily modal so the success modal is clearly visible
    document.getElementById('modal-daily-calendar')?.classList.add('hidden');
    if (typeof window.showInfoModal === 'function') window.showInfoModal("Check-in Successful!", `You checked in and earned ${reward} BB Tokens!`);
    
    // Sync to cloud
    if (typeof window.syncDataToCloud === 'function') window.syncDataToCloud();
  } else {
    claimBtn.innerText = "CHECK IN";
    claimBtn.disabled = false;
  }
}

// Initialize
window.addEventListener('load', () => {
  renderDailyCheckinPanel();
});

// --- NEW GAMEPLAY STATE ---
let reviveUsed = false;
let sessionPerfectBonus = 0;
let sessionComboBonus = 0;
let slowMoTimer = 0;
let missionProgress = { perfects: 0, score: 0, combo: 0 };
let currentGapWidth = 0;
let bridgesCrossed = 0;
let currentSessionGoal = "";

// Update UI top bar color
function updateBiomeUI(currentBiome) {
  const levelFill = document.getElementById('ui-level-fill');
  if (levelFill) {
    levelFill.style.backgroundColor = currentBiome.color;
    levelFill.style.boxShadow = `0 0 10px ${currentBiome.color}`;
  }
}

let dpr = window.devicePixelRatio || 1;
let W, H;
let platformHeight = 250;

const STATES = {
  MENU: 'MENU',
  PLAYING: 'PLAYING',
  BRIDGE_GROWING: 'BRIDGE_GROWING',
  BRIDGE_FALLING: 'BRIDGE_FALLING',
  CHARACTER_WALKING: 'CHARACTER_WALKING',
  SUCCESS_TRANSITION: 'SUCCESS_TRANSITION',
  FALLING_DOWN: 'FALLING_DOWN',
  GAME_OVER: 'GAME_OVER',
  GAME_WON: 'GAME_WON',
  SHOP: 'SHOP',
  DAILY: 'DAILY',
  LEADERBOARD: 'LEADERBOARD',
  ACHIEVEMENTS: 'ACHIEVEMENTS'
};
let gameState = STATES.MENU;

let platforms = [];
let character = { x: 0, y: 0, size: 55, rotation: 0, squash: 1.0 };
let bridge = { x: 0, y: 0, length: 0, angle: 0, thickness: 8, fallTime: 0 };
let perfectStreak = 0;
let sessionBestCombo = 0;
let sessionPerfects = 0;
let sessionCoins = 0;
let score = 0;
let bestScore = parseInt(localStorage.getItem('bb_v1_best') || '0');
let coins = parseInt(localStorage.getItem('bb_v1_coins') || '0');
bestEl.innerText = bestScore;
uiCoinsEl.innerText = coins;

window.reloadGameData = function() {
  bestScore = parseInt(localStorage.getItem('bb_v1_best') || '0');
  coins = parseInt(localStorage.getItem('bb_v1_coins') || '0');
  ownedItems = JSON.parse(localStorage.getItem('bb_v1_owned') || '["classic"]');
  currentSkin = localStorage.getItem('bb_v1_skin') || 'classic';
  equippedHat = localStorage.getItem('bb_v1_hat') || null;
  equippedWeapon = localStorage.getItem('bb_v1_weapon') || null;
  equippedFace = localStorage.getItem('bb_v1_face') || null;
  
  bestEl.innerText = bestScore;
  uiCoinsEl.innerText = coins;
  renderDailyCheckinPanel();
  renderSkinsShop();
  updateLeaderboardUI();
};

let cameraX = 0;
let targetCameraX = 0;
let currentPlatformIndex = 0;
let success = false;
let lastTime = 0;
let shakeAmount = 0;
let scaleAmount = 1.0;
let particles = [];
let animTime = 0;
let level = 1;

// Time tracking & Daily Reset
const now = new Date();
const todayString = now.getFullYear() + '-' + (now.getMonth() + 1) + '-' + now.getDate();
let lastPlayedDay = localStorage.getItem('bb_v1_last_played_day');

if (lastPlayedDay !== todayString) {
  localStorage.setItem('bb_v1_daily_games', '0');
  localStorage.setItem('bb_v1_daily_score', '0');
  localStorage.setItem('bb_v1_daily_perfects', '0');
  localStorage.setItem('bb_v1_last_played_day', todayString);
  for (let i = 1; i <= 10; i++) localStorage.removeItem('bb_v1_claimed_d' + i);
}

// Metrics for Achievements
function incMetric(key, amt = 1) {
  let val = parseInt(localStorage.getItem(key) || '0');
  let newVal = val + amt;
  localStorage.setItem(key, newVal);

  if (key === 'bb_v1_total_games') {
    let dGames = parseInt(localStorage.getItem('bb_v1_daily_games') || '0');
    localStorage.setItem('bb_v1_daily_games', dGames + amt);
  }
  if (key === 'bb_v1_total_perfects') {
    let dPerf = parseInt(localStorage.getItem('bb_v1_daily_perfects') || '0');
    localStorage.setItem('bb_v1_daily_perfects', dPerf + amt);
  }
}

function notifyMission(text) {
  const missionPopup = document.createElement('div');
  missionPopup.className = 'mission-popup';
  missionPopup.innerText = text;
  document.body.appendChild(missionPopup);
  setTimeout(() => missionPopup.classList.add('show'), 100);
  setTimeout(() => {
    missionPopup.classList.remove('show');
    setTimeout(() => missionPopup.remove(), 500);
  }, 2500);
}

function trackMission(type, val) {
  if (type === 'perfect') {
    missionProgress.perfects += val;
    if (missionProgress.perfects % 3 === 0) notifyMission(`Mission: ${missionProgress.perfects} Perfects reached!`);
  }
  if (type === 'score' && val > missionProgress.score) {
    missionProgress.score = val;
    if (val % 10 === 0) notifyMission(`Mission: Score ${val} reached!`);
    if (val === 20) notifyMission("Mission Complete: Reach 20 Score! +50 BB");
  }
  if (type === 'combo' && val > missionProgress.combo) {
    missionProgress.combo = val;
    if (val === 3) notifyMission("Mission Complete: Get 3x Combo! +30 BB");
    if (val >= 5) notifyMission("EPIC STREAK! Mission +50 BB");
  }
}

function updateDailyBestScore(s) {
  let dBest = parseInt(localStorage.getItem('bb_v1_daily_score') || '0');
  if (s > dBest) localStorage.setItem('bb_v1_daily_score', s);
}

const SVG_ICONS = {
  hat_cap: `data:image/svg+xml;utf8,<svg viewBox="-20 0 120 100" xmlns="http://www.w3.org/2000/svg"><path d="M -15 70 Q 5 55 65 65 L 65 75 Q 5 65 -15 75 Z" fill="%23000"/><path d="M -15 70 C -15 20, 60 20, 65 60 L 65 65 Q 25 55 -15 70" fill="%23d90000" stroke="%23000" stroke-width="4"/><path d="M 20 28 C 20 24, 30 24, 30 28" fill="%23d90000" stroke="%23000" stroke-width="4" stroke-linecap="round"/><path d="M 25 28 C 22 40, 20 50, 20 63" fill="none" stroke="%23000" stroke-width="2"/><path d="M 20 66 C 50 50, 95 65, 95 72 C 70 75, 40 70, 20 72 Z" fill="%23000" stroke="%23000" stroke-width="3" stroke-linejoin="round"/><path d="M 25 65 C 50 53, 90 66, 90 69 C 70 70, 40 66, 25 69 Z" fill="%23d90000"/></svg>`,
  hat_cape: `data:image/svg+xml;utf8,<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><path d="M20 20 L80 20 L95 100 L5 100 Z" fill="%23ef4444" stroke="%23b91c1c" stroke-width="2"/><path d="M20 20 L50 40 L80 20" fill="none" stroke="%23b91c1c" stroke-width="3"/></svg>`,
  hat_halo: `data:image/svg+xml;utf8,<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><ellipse cx="50" cy="50" rx="40" ry="15" fill="none" stroke="%23fef08a" stroke-width="6" filter="drop-shadow(0 0 8px %23facc15)"/></svg>`,
  face_visor: `data:image/svg+xml;utf8,<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><path d="M10 40 L90 40 L75 60 L25 60 Z" fill="%230a192f" stroke="%2300e5ff" stroke-width="6"/><path d="M20 50 L80 50" stroke="%2300e5ff" stroke-width="6" opacity="0.8"/></svg>`,
  face_mask: `data:image/svg+xml;utf8,<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><path d="M10 40 L90 40 L80 100 Q50 110 20 100 Z" fill="%23111"/><path d="M10 40 L90 40" stroke="%23333" stroke-width="4"/><path d="M30 40 L30 100 M50 40 L50 100 M70 40 L70 100" stroke="%23222" stroke-width="2"/></svg>`,
  face_cigar: `data:image/svg+xml;utf8,<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><rect x="30" y="45" width="40" height="10" rx="3" fill="%2378350f"/><rect x="70" y="45" width="10" height="10" fill="%23f97316"/><path d="M75 45 Q80 30 90 20" fill="none" stroke="%23cbd5e1" stroke-width="4" opacity="0.7"/></svg>`,
  face_glasses: `data:image/svg+xml;utf8,<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><rect x="20" y="40" width="25" height="15" fill="%23111"/><rect x="55" y="40" width="25" height="15" fill="%23111"/><path d="M45 45 L55 45" stroke="%23111" stroke-width="3"/></svg>`,
  face_beard: `data:image/svg+xml;utf8,<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><path d="M10 20 Q50 100 90 20 Q50 50 10 20 Z" fill="%23451a03"/></svg>`,
  wpn_sword: `data:image/svg+xml;utf8,<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><rect x="45" y="10" width="10" height="60" fill="%23e2e8f0"/><polygon points="45,10 50,0 55,10" fill="%23e2e8f0"/><rect x="35" y="65" width="30" height="8" fill="%23ca8a04"/><rect x="45" y="73" width="10" height="20" fill="%23451a03"/><circle cx="50" cy="95" r="6" fill="%23ca8a04"/></svg>`,
  wpn_saber: `data:image/svg+xml;utf8,<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><rect x="45" y="10" width="10" height="60" rx="5" fill="%23ef4444" filter="drop-shadow(0 0 10px %23ef4444)"/><rect x="42" y="70" width="16" height="25" fill="%2394a3b8"/><rect x="40" y="72" width="20" height="4" fill="%23334155"/><rect x="40" y="78" width="20" height="4" fill="%23334155"/></svg>`,
  wpn_axe: `data:image/svg+xml;utf8,<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><rect x="45" y="15" width="10" height="80" rx="5" fill="%2378350f" stroke="%23451a03" stroke-width="2"/><path d="M55 20 Q95 20 95 48 Q95 70 55 70 L55 55 Q75 48 55 35 Z" fill="%23f1f5f9" stroke="%23475569" stroke-width="2"/><path d="M45 20 Q5 20 5 48 Q5 70 45 70 L45 55 Q25 48 45 35 Z" fill="%23f1f5f9" stroke="%23475569" stroke-width="2"/><rect x="42" y="32" width="16" height="8" rx="2" fill="%2394a3b8"/></svg>`,
  wpn_gun: `data:image/svg+xml;utf8,<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><path d="M10 35 H75 L85 40 L85 55 L10 60 Z" fill="%23334155" stroke="%230f172a" stroke-width="2"/><rect x="15" y="55" width="20" height="40" rx="5" fill="%23475569" stroke="%230f172a" stroke-width="2"/><path d="M70 38 H95 V52 H70 Z" fill="%2300e5ff" opacity="0.6"/><circle cx="85" cy="45" r="7" fill="%23fff" filter="drop-shadow(0 0 10px %2300e5ff)"/><rect x="30" y="30" width="30" height="5" rx="2" fill="%2364748b"/></svg>`
};
let loadedIcons = {};
for (let k in SVG_ICONS) { const img = new Image(); img.src = SVG_ICONS[k]; loadedIcons[k] = img; }


// --- EQUIPMENT & SKINS SYSTEM ---
let currentSkin = localStorage.getItem('bb_v1_skin') || 'classic';
let equippedHat = localStorage.getItem('bb_v1_hat') || null;
let equippedWeapon = localStorage.getItem('bb_v1_weapon') || null;
let equippedFace = localStorage.getItem('bb_v1_face') || null;

let equippedCape = localStorage.getItem('bb_v1_cape') || null;

function saveEquipmentsToStorage() {
  localStorage.setItem('bb_v1_skin', currentSkin);
  if (equippedHat) localStorage.setItem('bb_v1_hat', equippedHat); else localStorage.removeItem('bb_v1_hat');
  if (equippedCape) localStorage.setItem('bb_v1_cape', equippedCape); else localStorage.removeItem('bb_v1_cape');
  if (equippedWeapon) localStorage.setItem('bb_v1_weapon', equippedWeapon); else localStorage.removeItem('bb_v1_weapon');
  if (equippedFace) localStorage.setItem('bb_v1_face', equippedFace); else localStorage.removeItem('bb_v1_face');
  if (typeof window.syncDataToCloud === 'function') window.syncDataToCloud();
}

const SHOP_DB = [
  // SKINS
  { id: 'classic', type: 'skin', name: 'Classic', rarity: 'Common', cost: 10, icon: 'classic', desc: 'The original legendary stick hero.', colors: { body: '#334155', head: '#fed7aa' } },
  { id: 'ninja', type: 'skin', name: 'Ninja', rarity: 'Uncommon', cost: 10, icon: 'ninja', desc: 'A swift warrior of the night.', colors: { body: '#111111', head: '#111111', straps: '#1f2937' } },
  { id: 'cyber', type: 'skin', name: 'Based', rarity: 'Rare', cost: 10, icon: 'cyber', desc: 'Friendly AI robot from the future.', colors: { body: '#f8fafc', head: '#0052ff', glow: '#111111' } },
  { id: 'dino', type: 'skin', name: 'Dino', rarity: 'Epic', cost: 10, icon: 'dino', desc: 'A prehistoric powerhouse.', colors: { body: '#65a30d', head: '#65a30d' } },
  { id: 'wizard', type: 'skin', name: 'Wizard', rarity: 'Epic', cost: 10, icon: 'wizard', desc: 'A wise sorcerer with a star-patterned robe.', colors: { body: '#1d4ed8', head: '#ffffff', hat: '#1d4ed8', stars: '#facc15' } },
  { id: 'demon', type: 'skin', name: 'Demon', rarity: 'Epic', cost: 10, icon: 'demon', desc: 'A fiery fiend from the underworld.', colors: { body: '#ef4444', head: '#ef4444' } },
  { id: 'troop', type: 'skin', name: 'Troop', rarity: 'Legendary', cost: 10, icon: 'troop', desc: 'Shadowed face hidden beneath a red hood.', colors: { body: '#e11d48', head: '#be123c', faceShadow: '#111111' } },
  { id: 'mini', type: 'skin', name: 'Mini', rarity: 'Legendary', cost: 10, icon: 'mini', desc: 'A small, yellow, pill-shaped fellow.', colors: { body: '#facc15', head: '#facc15', overalls: '#1e3a8a', height: 75 } },
  { id: 'galaxy', type: 'skin', name: 'Titan', rarity: 'Mythic', cost: 10, icon: 'galaxy', desc: 'Inspired by a cosmic powerhouse.', colors: { body: '#1e3a8a', head: '#a855f7', gauntlet: '#eab308' } },
  { id: 'pika', type: 'skin', name: 'Pika', rarity: 'Mythic', cost: 10, icon: 'pika', desc: 'An electric mouse with a shocking attitude.', colors: { body: '#facc15', head: '#facc15', cheeks: '#ef4444', ears: '#111111' } },
  // HATS
  { id: 'cap', type: 'hat', name: 'Baseball Cap', rarity: 'Common', cost: 10, iconId: 'hat_cap', desc: 'Keep the sun out.' },
  { id: 'cape', type: 'hat', name: 'Hero Cape', rarity: 'Epic', cost: 10, iconId: 'hat_cape', desc: 'Flows in the wind.' },
  { id: 'halo', type: 'hat', name: 'Halo', rarity: 'Mythic', cost: 10, iconId: 'hat_halo', desc: 'Divine protection.' },
  // WEAPONS
  { id: 'iron_sword', type: 'weapon', name: 'Iron Sword', rarity: 'Rare', cost: 150, iconId: 'wpn_sword', desc: 'A trusty blade.' },
  { id: 'battle_axe', type: 'weapon', name: 'Battle Axe', rarity: 'Epic', cost: 250, iconId: 'wpn_axe', desc: 'Heavy hitter.' },
  { id: 'plasma_saber', type: 'weapon', name: 'Plasma Sword', rarity: 'Legendary', cost: 350, iconId: 'wpn_saber', desc: 'Cuts through anything.' },
  { id: 'laser_gun', type: 'weapon', name: 'Laser Gun', rarity: 'Mythic', cost: 500, iconId: 'wpn_gun', desc: 'Pew pew!' }
];
let ownedItems = JSON.parse(localStorage.getItem('bb_v1_owned') || '["classic"]');

// Audio Context
let isMuted = false;
let actx, osc, gainNode;
function initAudio() { if (!actx) actx = new (window.AudioContext || window.webkitAudioContext)(); if (actx.state === 'suspended') actx.resume(); }
function playSound(type) {
  if (!actx || isMuted) return;
  const o = actx.createOscillator(); const g = actx.createGain();
  o.connect(g); g.connect(actx.destination); const now = actx.currentTime;
  if (type === 'drop') {
    o.type = 'square'; o.frequency.setValueAtTime(150, now); o.frequency.exponentialRampToValueAtTime(40, now + 0.1);
    g.gain.setValueAtTime(0.3, now); g.gain.exponentialRampToValueAtTime(0.01, now + 0.1); o.start(now); o.stop(now + 0.1);
  } else if (type === 'perfect') {
    o.type = 'sine'; o.frequency.setValueAtTime(523.25, now); o.frequency.setValueAtTime(659.25, now + 0.1); o.frequency.setValueAtTime(783.99, now + 0.2);
    g.gain.setValueAtTime(0, now); g.gain.linearRampToValueAtTime(0.2, now + 0.05); g.gain.linearRampToValueAtTime(0, now + 0.4); o.start(now); o.stop(now + 0.4);
  } else if (type === 'fail') {
    o.type = 'sawtooth'; o.frequency.setValueAtTime(200, now); o.frequency.exponentialRampToValueAtTime(50, now + 0.5);
    g.gain.setValueAtTime(0.3, now); g.gain.exponentialRampToValueAtTime(0.01, now + 0.5); o.start(now); o.stop(now + 0.5);
  } else if (type === 'click') {
    o.type = 'sine'; o.frequency.setValueAtTime(800, now); o.frequency.exponentialRampToValueAtTime(100, now + 0.05);
    g.gain.setValueAtTime(0.1, now); g.gain.exponentialRampToValueAtTime(0.01, now + 0.05); o.start(now); o.stop(now + 0.05);
  } else if (type === 'coin') {
    o.type = 'sine'; o.frequency.setValueAtTime(987.77, now); o.frequency.setValueAtTime(1318.51, now + 0.1);
    g.gain.setValueAtTime(0.1, now); g.gain.linearRampToValueAtTime(0, now + 0.3); o.start(now); o.stop(now + 0.3);
  } else if (type === 'levelup') {
    o.type = 'square'; o.frequency.setValueAtTime(261.63, now); o.frequency.setValueAtTime(329.63, now + 0.1); o.frequency.setValueAtTime(392.00, now + 0.2); o.frequency.setValueAtTime(523.25, now + 0.3);
    g.gain.setValueAtTime(0, now); g.gain.linearRampToValueAtTime(0.2, now + 0.1); g.gain.linearRampToValueAtTime(0, now + 0.5); o.start(now); o.stop(now + 0.5);
  } else if (type === 'success') {
    o.type = 'sine'; o.frequency.setValueAtTime(440, now); o.frequency.setValueAtTime(554.37, now + 0.1); o.frequency.setValueAtTime(659.25, now + 0.2);
    g.gain.setValueAtTime(0, now); g.gain.linearRampToValueAtTime(0.2, now + 0.1); g.gain.linearRampToValueAtTime(0, now + 0.4); o.start(now); o.stop(now + 0.4);
  }
}

isMuted = localStorage.getItem('bb_v1_muted') === 'true';
function updateMuteUI() {
  const btn = document.getElementById('btn-mute-toggle');
  if (btn) btn.innerText = isMuted ? '🔇' : '🔊';
}

function toggleMute() {
  isMuted = !isMuted;
  localStorage.setItem('bb_v1_muted', isMuted);
  updateMuteUI();
}

document.addEventListener('DOMContentLoaded', () => {
  const btnMute = document.getElementById('btn-mute-toggle');
  if (btnMute) btnMute.addEventListener('click', toggleMute);
  updateMuteUI();
});
function startGrowSound() {
  if (!actx || isMuted) return;
  osc = actx.createOscillator(); gainNode = actx.createGain();
  osc.type = 'sine'; osc.frequency.setValueAtTime(100, actx.currentTime); osc.frequency.linearRampToValueAtTime(400, actx.currentTime + 2);
  gainNode.gain.setValueAtTime(0.1, actx.currentTime);
  osc.connect(gainNode); gainNode.connect(actx.destination); osc.start();
}
function stopGrowSound() { if (gainNode) { gainNode.gain.linearRampToValueAtTime(0, actx.currentTime + 0.05); setTimeout(() => { if (osc) { osc.stop(); osc.disconnect(); osc = null; } }, 50); } }

function resize() {
  const rect = canvas.parentElement.getBoundingClientRect(); W = rect.width; H = rect.height;
  canvas.width = W * dpr; canvas.height = H * dpr; ctx.scale(dpr, dpr);
  platformHeight = Math.min(H * 0.4, 300);
  if (gameState === STATES.PLAYING || gameState === STATES.MENU) { bridge.y = H - platformHeight; character.y = H - platformHeight; }
}
window.addEventListener('resize', resize);

async function updateLeaderboardUI() {
  const container = document.getElementById('lb-rows-container');
  container.innerHTML = `<div class="lb-empty">Loading Global Leaderboard...</div>`;

  let sessions = [];
  if (typeof window.fetchFirebaseLeaderboard === 'function') {
    sessions = await window.fetchFirebaseLeaderboard();
  }

  if (sessions.length === 0) {
    container.innerHTML = `<div class="lb-empty">No scores found. Be the first!</div>`;
    return;
  }

  let html = '';
  for (let i = 0; i < Math.min(10, sessions.length); i++) {
    const s = sessions[i];
    let rClass = `rank-${i + 1}`; if (i > 2) rClass = `rank-4`;
    let shortAddr = s.addr;
    if (shortAddr && shortAddr.length > 10) {
      shortAddr = shortAddr.substring(0, 6) + "..." + shortAddr.substring(shortAddr.length - 4);
    }
    html += `<div class="lb-row"><span class="lb-rank ${rClass}">${i + 1}</span> <span class="lb-addr">${shortAddr}</span> <strong class="lb-score">${s.score}</strong></div>`;
  }
  container.innerHTML = html;
}
updateLeaderboardUI();

// Populate Shop Lists
function renderSkinsShop() {
  const list = document.getElementById('skins-list');
  list.innerHTML = '';
  SHOP_DB.filter(s => s.type === 'skin').forEach(s => {
    const isOwned = ownedItems.includes(s.id);
    const lockedClass = isOwned ? '' : 'locked';
    let isActive = (s.id === currentSkin);
    const activeClass = isActive ? 'active' : '';
    const priceTxt = isOwned ? 'Owned' : `<div class="bb-token-small" style="width:14px;height:14px;"></div> ${s.cost}`;

    const rarityClass = s.rarity ? s.rarity.toLowerCase() : 'common';
    let html = `
      <div class="skin-item ${lockedClass} ${activeClass} ${rarityClass}" data-id="${s.id}">
        <div class="skin-avatar ${s.icon}-avatar"></div>
        <span>${s.name}<br><span class="skin-price">${priceTxt}</span></span>
      </div>
    `;
    list.innerHTML += html;
  });

  document.querySelectorAll('#skins-list .skin-item').forEach(item => {
    item.addEventListener('click', () => {
      openShopPreview(item.getAttribute('data-id'));
    });
  });
}
renderSkinsShop();

function renderEquipmentShop(typeFilter) {
  const list = document.getElementById('equip-list');
  list.innerHTML = '';
  SHOP_DB.filter(s => s.type === typeFilter).forEach(s => {
    const isOwned = ownedItems.includes(s.id);
    const lockedClass = isOwned ? '' : 'locked';
    let isActive = (s.id === equippedHat || s.id === equippedCape || s.id === equippedWeapon || s.id === equippedFace);
    const activeClass = isActive ? 'active' : '';
    const priceTxt = isOwned ? 'Owned' : `<div class="bb-token-small" style="width:14px;height:14px;"></div> ${s.cost}`;

    const rarityClass = s.rarity ? s.rarity.toLowerCase() : 'common';
    let html = `
      <div class="equip-item ${lockedClass} ${activeClass} ${rarityClass}" data-id="${s.id}">
        <img src='${SVG_ICONS[s.iconId]}' width="40" height="40" style="filter: drop-shadow(0 2px 4px rgba(0,0,0,0.5));">
        <span>${s.name}<br><span class="skin-price">${priceTxt}</span></span>
      </div>
    `;
    list.innerHTML += html;
  });

  document.querySelectorAll('.equip-item').forEach(item => {
    item.addEventListener('click', () => {
      document.getElementById('modal-equip-shop').classList.add('hidden');
      openShopPreview(item.getAttribute('data-id'));
    });
  });
}

// Equip Tabs
const eqTabs = document.querySelectorAll('.equip-tab');
eqTabs.forEach(t => t.addEventListener('click', (e) => {
  eqTabs.forEach(tab => tab.classList.remove('active'));
  e.target.classList.add('active');
  renderEquipmentShop(e.target.getAttribute('data-tab'));
}));
document.getElementById('btn-equipment').addEventListener('click', () => {
  document.getElementById('modal-backdrop').classList.remove('hidden');
  document.getElementById('modal-equip-shop').classList.remove('hidden');
  renderEquipmentShop('hat');
  eqTabs.forEach(tab => tab.classList.remove('active'));
  eqTabs[0].classList.add('active');
});

// Leaderboard & Achievements Listeners
document.getElementById('btn-leaderboard')?.addEventListener('click', () => {
  document.getElementById('leaderboard-section').scrollIntoView({ behavior: 'smooth' });
});
document.getElementById('btn-achievements')?.addEventListener('click', () => {
  document.getElementById('modal-backdrop').classList.remove('hidden');
  document.getElementById('modal-achievements').classList.remove('hidden');
});

// Back to Shop Helper
function backToShop() {
  document.getElementById('modal-shop').classList.add('hidden');
  document.getElementById('modal-equip-shop').classList.remove('hidden');
}

// Real Tasks for Achievements (Expanded to 30+ tasks)
function renderAchievements(type) {
  const list = document.getElementById('achievements-list');
  if (!list) return;
  list.innerHTML = '';

  const mGames = parseInt(localStorage.getItem('bb_v1_total_games') || '0');
  const mPerfects = parseInt(localStorage.getItem('bb_v1_total_perfects') || '0');
  const mScore = parseInt(localStorage.getItem('bb_v1_best') || '0');

  const dGames = parseInt(localStorage.getItem('bb_v1_daily_games') || '0');
  const dPerfects = parseInt(localStorage.getItem('bb_v1_daily_perfects') || '0');
  const dScore = parseInt(localStorage.getItem('bb_v1_daily_score') || '0');

  const allTasks = [
    // General (NFT Badges - 30 Tasks)
    { id: 'g1', type: 'general', name: 'First Steps NFT', desc: 'Play your first game. Mints a Base NFT.', target: 1, current: mGames },
    { id: 'g2', type: 'general', name: 'Starter Builder NFT', desc: 'Play 10 games. Mints a Base NFT.', target: 10, current: mGames },
    { id: 'g3', type: 'general', name: 'Apprentice NFT', desc: 'Play 25 games. Mints a Base NFT.', target: 25, current: mGames },
    { id: 'g4', type: 'general', name: 'Dedicated NFT', desc: 'Play 50 games. Mints a Base NFT.', target: 50, current: mGames },
    { id: 'g5', type: 'general', name: 'Centurion NFT', desc: 'Play 100 games. Mints a Base NFT.', target: 100, current: mGames },
    { id: 'g6', type: 'general', name: 'Veteran NFT', desc: 'Play 250 games. Mints a Base NFT.', target: 250, current: mGames },
    { id: 'g7', type: 'general', name: 'Master Builder NFT', desc: 'Play 500 games. Mints a Base NFT.', target: 500, current: mGames },
    { id: 'g8', type: 'general', name: 'Grandmaster NFT', desc: 'Play 1000 games. Mints a Base NFT.', target: 1000, current: mGames },
    { id: 'g9', type: 'general', name: 'Legendary NFT', desc: 'Play 2500 games. Mints a Base NFT.', target: 2500, current: mGames },
    { id: 'g10', type: 'general', name: 'God of Bridges NFT', desc: 'Play 5000 games. Mints a Base NFT.', target: 5000, current: mGames },

    { id: 'g11', type: 'general', name: 'Bronze Score NFT', desc: 'Reach a score of 10. Mints a Base NFT.', target: 10, current: mScore },
    { id: 'g12', type: 'general', name: 'Silver Score NFT', desc: 'Reach a score of 20. Mints a Base NFT.', target: 20, current: mScore },
    { id: 'g13', type: 'general', name: 'Gold Score NFT', desc: 'Reach a score of 30. Mints a Base NFT.', target: 30, current: mScore },
    { id: 'g14', type: 'general', name: 'Platinum Score NFT', desc: 'Reach a score of 40. Mints a Base NFT.', target: 40, current: mScore },
    { id: 'g15', type: 'general', name: 'Diamond Score NFT', desc: 'Reach a score of 50. Mints a Base NFT.', target: 50, current: mScore },
    { id: 'g16', type: 'general', name: 'Mythic Score NFT', desc: 'Reach a score of 75. Mints a Base NFT.', target: 75, current: mScore },
    { id: 'g17', type: 'general', name: 'Godlike Score NFT', desc: 'Reach a score of 100. Mints a Base NFT.', target: 100, current: mScore },
    { id: 'g18', type: 'general', name: 'Unreal Score NFT', desc: 'Reach a score of 150. Mints a Base NFT.', target: 150, current: mScore },
    { id: 'g19', type: 'general', name: 'Impossible Score NFT', desc: 'Reach a score of 200. Mints a Base NFT.', target: 200, current: mScore },
    { id: 'g20', type: 'general', name: 'Base Champion NFT', desc: 'Reach a score of 300. Mints a Base NFT.', target: 300, current: mScore },
    { id: 'g31', type: 'general', name: 'Game Completed NFT', desc: 'Finish the game! Mints a Base NFT.', target: 1, current: parseInt(localStorage.getItem('bb_v1_games_won') || '0') },

    { id: 'g21', type: 'general', name: 'First Perfect NFT', desc: 'Get 1 perfect landing. Mints a Base NFT.', target: 1, current: mPerfects },
    { id: 'g22', type: 'general', name: 'Sharp Eye NFT', desc: 'Get 10 perfect landings. Mints a Base NFT.', target: 10, current: mPerfects },
    { id: 'g23', type: 'general', name: 'Sniper NFT', desc: 'Get 25 perfect landings. Mints a Base NFT.', target: 25, current: mPerfects },
    { id: 'g24', type: 'general', name: 'Eagle Vision NFT', desc: 'Get 50 perfect landings. Mints a Base NFT.', target: 50, current: mPerfects },
    { id: 'g25', type: 'general', name: 'Perfectionist NFT', desc: 'Get 100 perfect landings. Mints a Base NFT.', target: 100, current: mPerfects },
    { id: 'g26', type: 'general', name: 'Flawless NFT', desc: 'Get 250 perfect landings. Mints a Base NFT.', target: 250, current: mPerfects },
    { id: 'g27', type: 'general', name: 'Laser Guided NFT', desc: 'Get 500 perfect landings. Mints a Base NFT.', target: 500, current: mPerfects },
    { id: 'g28', type: 'general', name: 'True Master NFT', desc: 'Get 1000 perfect landings. Mints a Base NFT.', target: 1000, current: mPerfects },
    { id: 'g29', type: 'general', name: 'Absolute God NFT', desc: 'Get 2500 perfect landings. Mints a Base NFT.', target: 2500, current: mPerfects },
    { id: 'g30', type: 'general', name: 'Base Network Legend', desc: 'Get 5000 perfect landings. Mints a Base NFT.', target: 5000, current: mPerfects },

    // Daily (10 Tasks)
    { id: 'd1', type: 'daily', name: 'Rookie Builder', desc: 'Play 5 games today.', target: 5, current: dGames, reward: 5 },
    { id: 'd2', type: 'daily', name: 'Bridge Master', desc: 'Score 10 points in a game today.', target: 10, current: dScore, reward: 5 },
    { id: 'd3', type: 'daily', name: 'Perfect Landing', desc: 'Get 5 perfects today.', target: 5, current: dPerfects, reward: 5 },
    { id: 'd4', type: 'daily', name: 'Frequent Flyer', desc: 'Play 10 games today.', target: 10, current: dGames, reward: 10 },
    { id: 'd5', type: 'daily', name: 'Flawless', desc: 'Get 10 perfects today.', target: 10, current: dPerfects, reward: 10 },
    { id: 'd6', type: 'daily', name: 'Dedicated', desc: 'Play 15 games today.', target: 15, current: dGames, reward: 15 },
    { id: 'd7', type: 'daily', name: 'Pro Builder', desc: 'Score 20 points in a game today.', target: 20, current: dScore, reward: 5 },
    { id: 'd8', type: 'daily', name: 'Eagle Eye', desc: 'Get 15 perfects today.', target: 15, current: dPerfects, reward: 15 },
    { id: 'd9', type: 'daily', name: 'Marathoner', desc: 'Play 25 games today.', target: 25, current: dGames, reward: 25 },
    { id: 'd10', type: 'daily', name: 'Unstoppable', desc: 'Score 30 points in a game today.', target: 30, current: dScore, reward: 5 },

    // Check-in Milestones (New Category)
    { id: 'c1', type: 'checkin', name: '1 Week Loyal', desc: 'Check-in for 7 total days. Mints a Base NFT.', target: 7, current: parseInt(localStorage.getItem('bb_v1_total_checkins') || '0') },
    { id: 'c2', type: 'checkin', name: '2 Weeks Dedicated', desc: 'Check-in for 14 total days. Mints a Base NFT.', target: 14, current: parseInt(localStorage.getItem('bb_v1_total_checkins') || '0') },
    { id: 'c3', type: 'checkin', name: '3 Weeks Pro', desc: 'Check-in for 21 total days. Mints a Base NFT.', target: 21, current: parseInt(localStorage.getItem('bb_v1_total_checkins') || '0') },
    { id: 'c4', type: 'checkin', name: '1 Month Veteran', desc: 'Check-in for 30 total days. Mints a Base NFT.', target: 30, current: parseInt(localStorage.getItem('bb_v1_total_checkins') || '0') },
    { id: 'c5', type: 'checkin', name: '2 Months Legend', desc: 'Check-in for 60 total days. Mints a Base NFT.', target: 60, current: parseInt(localStorage.getItem('bb_v1_total_checkins') || '0') },
    { id: 'c6', type: 'checkin', name: '3 Months Master', desc: 'Check-in for 90 total days. Mints a Base NFT.', target: 90, current: parseInt(localStorage.getItem('bb_v1_total_checkins') || '0') },
    { id: 'c7', type: 'checkin', name: '6 Months Godlike', desc: 'Check-in for 180 total days. Mints a Base NFT.', target: 180, current: parseInt(localStorage.getItem('bb_v1_total_checkins') || '0') },
    { id: 'c8', type: 'checkin', name: '9 Months Divine', desc: 'Check-in for 270 total days. Mints a Base NFT.', target: 270, current: parseInt(localStorage.getItem('bb_v1_total_checkins') || '0') },
    { id: 'c9', type: 'checkin', name: '1 Year Eternal', desc: 'Check-in for 365 total days. Mints a Base NFT.', target: 365, current: parseInt(localStorage.getItem('bb_v1_total_checkins') || '0') },

    { id: 'w1', type: 'weekly', name: 'Veteran', desc: 'Play 50 games.', target: 50, current: mGames, reward: 50 },
    { id: 'w3', type: 'weekly', name: 'Precision', desc: 'Get 25 perfects.', target: 25, current: mPerfects, reward: 50 },
    { id: 'w5', type: 'weekly', name: 'Century Club', desc: 'Play 100 games.', target: 100, current: mGames, reward: 100 },
    { id: 'w6', type: 'weekly', name: 'Absolute Focus', desc: 'Get 50 perfects.', target: 50, current: mPerfects, reward: 100 },
    { id: 'w7', type: 'weekly', name: 'Addict', desc: 'Play 150 games.', target: 150, current: mGames, reward: 150 },
    { id: 'w9', type: 'weekly', name: 'Laser Sight', desc: 'Get 75 perfects.', target: 75, current: mPerfects, reward: 150 },
    { id: 'w10', type: 'weekly', name: 'Weekly Boss', desc: 'Play 200 games.', target: 200, current: mGames, reward: 200 },

    // Lifetime (10 Tasks)
    { id: 'l1', type: 'lifetime', name: 'Legend', desc: 'Play 500 games total.', target: 500, current: mGames, reward: 500 },
    { id: 'l2', type: 'lifetime', name: 'Godlike', desc: 'Reach a score of 100.', target: 100, current: mScore, reward: 500 },
    { id: 'l3', type: 'lifetime', name: 'True Master', desc: 'Get 500 perfects.', target: 500, current: mPerfects, reward: 500 },
    { id: 'l4', type: 'lifetime', name: 'Grandmaster', desc: 'Play 1000 games total.', target: 1000, current: mGames, reward: 1000 },
    { id: 'l5', type: 'lifetime', name: 'The Chosen One', desc: 'Get 1000 perfects.', target: 1000, current: mPerfects, reward: 1000 },
    { id: 'l6', type: 'lifetime', name: 'Bridger', desc: 'Score 150 points.', target: 150, current: mScore, reward: 1500 },
    { id: 'l7', type: 'lifetime', name: 'Unreal', desc: 'Play 2500 games.', target: 2500, current: mGames, reward: 2500 },
    { id: 'l8', type: 'lifetime', name: 'Sniper', desc: 'Get 2500 perfects.', target: 2500, current: mPerfects, reward: 2500 },
    { id: 'l9', type: 'lifetime', name: 'Mythic Score', desc: 'Score 200 points.', target: 200, current: mScore, reward: 3000 },
    { id: 'l10', type: 'lifetime', name: 'Base Bridge God', desc: 'Play 5000 games.', target: 5000, current: mGames, reward: 5000 }
  ];

  const filtered = allTasks.filter(t => t.type === type);

  // Sort actionable items to the top
  filtered.sort((a, b) => {
    const isDoneA = a.current >= a.target;
    const isDoneB = b.current >= b.target;
    const isClaimedA = localStorage.getItem('bb_v1_claimed_' + a.id) === 'true' || localStorage.getItem('bb_v1_minted_' + a.id) === 'true';
    const isClaimedB = localStorage.getItem('bb_v1_claimed_' + b.id) === 'true' || localStorage.getItem('bb_v1_minted_' + b.id) === 'true';

    const actionableA = isDoneA && !isClaimedA;
    const actionableB = isDoneB && !isClaimedB;

    if (actionableA && !actionableB) return -1;
    if (!actionableA && actionableB) return 1;

    // Then show in-progress items, and finally claimed/minted ones at the bottom
    if (!isClaimedA && isClaimedB) return -1;
    if (isClaimedA && !isClaimedB) return 1;

    return 0;
  });

  filtered.forEach(t => {
    const isDone = t.current >= t.target;
    const isClaimed = localStorage.getItem('bb_v1_claimed_' + t.id) === 'true';
    const isMinted = localStorage.getItem('bb_v1_minted_' + t.id) === 'true';
    const progressPercent = Math.min(100, (t.current / t.target) * 100);

    let rightSideHTML = '';
    if (t.type === 'general') {
      if (isMinted) {
        rightSideHTML = `<div class="btn-3d-lock claimed"><div class="check-icon-svg"></div></div>`;
      } else if (isDone) {
        rightSideHTML = `<div class="btn-3d-lock" style="background: linear-gradient(135deg, #ff2a7a, #c40049); box-shadow: 0 4px 0 #850031, inset 0 2px 4px rgba(255,255,255,0.4);" onclick="if(!window.userAddress){showInfoModal('Wallet Required', 'You must connect your wallet to mint this NFT!');return;} window.mintNFT('${t.name}', this, '${t.id}');"><span style="font-size:0.8rem; font-weight:900; color:#fff;">MINT</span></div>`;
      } else {
        rightSideHTML = `<div class="btn-3d-lock"><div class="lock-icon-svg"></div></div>`;
      }
    } else {
      if (isClaimed) {
        rightSideHTML = `<div class="btn-3d-lock claimed"><div class="check-icon-svg"></div></div>`;
      } else if (isDone) {
        rightSideHTML = `<div class="btn-3d-lock" style="background: linear-gradient(135deg, #00ff88, #00b359); box-shadow: 0 4px 0 #007339, inset 0 2px 4px rgba(255,255,255,0.4);" onclick="claimAchievement('${t.id}', ${t.reward}, '${type}', this)"><span style="font-size:0.8rem; font-weight:900; color:#fff;">CLAIM</span></div>`;
      } else {
        rightSideHTML = `<div class="btn-3d-lock"><div class="lock-icon-svg"></div></div>`;
      }
    }

    list.innerHTML += `
      <div class="achieve-item">
        <div class="ach-card-top">
          <div class="ach-text">
            <strong>${t.name} <span class="ach-reward-tag">${t.reward ? '+' + t.reward + ' BB' : ''}</span></strong>
            ${t.desc}
          </div>
          <div class="ach-action">
            ${rightSideHTML}
          </div>
        </div>
        <div class="ach-progress-wrapper">
          <div class="ach-progress-container">
            <div class="ach-progress-fill" style="width: ${progressPercent}%"></div>
          </div>
          <span class="ach-progress-text">${Math.min(t.current, t.target)}/${t.target}</span>
        </div>
      </div>
    `;
  });
}
window.renderAchievements = renderAchievements;

window.claimAchievement = async function (id, reward, type, btnElement) {
  if (!window.userAddress) {
    if (typeof showInfoModal === 'function') {
      showInfoModal('Wallet Required', 'You must connect your wallet to claim rewards!');
    } else {
      alert('You must connect your wallet to claim rewards!');
    }
    return;
  }

  // Show loading state
  const originalHTML = btnElement ? btnElement.innerHTML : '';
  if (btnElement) {
    btnElement.innerHTML = '<span style="font-size:0.7rem;">WAITING...</span>';
    btnElement.style.pointerEvents = 'none';
    btnElement.style.filter = 'brightness(0.7)';
  }

  const success = await window.mintAchievementOnChain(id);
  if (!success) {
    if (btnElement) {
      btnElement.innerHTML = originalHTML;
      btnElement.style.pointerEvents = 'auto';
      btnElement.style.filter = '';
    }
    return;
  }

  localStorage.setItem('bb_v1_claimed_' + id, 'true');

  // Give coins
  let coins = parseInt(localStorage.getItem('bb_v1_coins') || '0');
  coins += reward;
  localStorage.setItem('bb_v1_coins', coins);

  const uiCoins = document.getElementById('ui-coins');
  if (uiCoins) uiCoins.innerText = coins;

  // Mark as claimed
  localStorage.setItem('bb_v1_claimed_' + id, 'true');

  // Re-render
  renderAchievements(type);

  if (typeof showInfoModal === 'function') {
    showInfoModal('Achievement Claimed!', `You successfully claimed ${reward} BB Tokens onchain!`);
  }
};
const achTabs = document.querySelectorAll('.ach-tab');
achTabs.forEach(t => t.addEventListener('click', (e) => {
  achTabs.forEach(tab => tab.classList.remove('active'));
  e.target.classList.add('active');
  renderAchievements(e.target.getAttribute('data-tab'));
}));
renderAchievements('general');

let previewActiveItem = null;
function openShopPreview(id) {
  const item = SHOP_DB.find(s => s.id === id);
  previewActiveItem = item;
  document.getElementById('preview-name').innerText = item.name;
  document.getElementById('preview-rarity').innerText = item.rarity;

  if (item.rarity === 'Legendary') document.getElementById('preview-rarity').style.color = '#facc15';
  else if (item.rarity === 'Mythic') document.getElementById('preview-rarity').style.color = '#ff2a7a';
  else document.getElementById('preview-rarity').style.color = '#b517ff';

  document.getElementById('preview-desc').innerText = item.desc;

  const btn = document.getElementById('btn-buy-equip');
  if (ownedItems.includes(id)) {
    document.getElementById('preview-cost').innerText = "Owned";

    let isEq = false;
    if (item.type === 'skin' && item.id === currentSkin) isEq = true;
    if (item.type === 'hat') {
      if (item.id === 'cape') {
        if (equippedCape === 'cape') isEq = true;
      } else {
        if (item.id === equippedHat) isEq = true;
      }
    }
    if (item.type === 'weapon' && item.id === equippedWeapon) isEq = true;
    if (item.type === 'face' && item.id === equippedFace) isEq = true;

    if (isEq && item.type !== 'skin') { // Cannot unequip skin completely
      btn.innerText = "UNEQUIP";
      btn.classList.replace('btn-green', 'btn-gray');
      btn.disabled = false; // Fix unequip bug
      btn.onclick = () => {
        if (item.type === 'hat') {
          if (item.id === 'cape') equippedCape = null;
          else equippedHat = null;
        }
        if (item.type === 'weapon') equippedWeapon = null;
        if (item.type === 'face') equippedFace = null;
        saveEquipmentsToStorage();
        renderSkinsShop();
        openShopPreview(id);
      };
    } else if (isEq && item.type === 'skin') {
      btn.innerText = "EQUIPPED";
      btn.classList.replace('btn-green', 'btn-gray');
      btn.disabled = true;
    } else {
      btn.innerText = "EQUIP";
      btn.classList.replace('btn-gray', 'btn-green');
      btn.disabled = false;
      btn.onclick = () => {
        if (item.type === 'skin') currentSkin = id;
        if (item.type === 'hat') {
          if (item.id === 'cape') equippedCape = 'cape';
          else equippedHat = id;
        }
        if (item.type === 'weapon') equippedWeapon = id;
        if (item.type === 'face') equippedFace = id;
        saveEquipmentsToStorage();
        renderSkinsShop();
        openShopPreview(id);
      };
    }
  } else {
    document.getElementById('preview-cost').innerText = item.cost + " BB";
    btn.innerText = "BUY ON-CHAIN";
    btn.classList.replace('btn-gray', 'btn-green');
    
    if (coins >= item.cost) {
      btn.disabled = false;
      btn.onclick = async () => {
        btn.innerText = "PROCESSING...";
        btn.disabled = true;
        const success = await window.purchaseItemOnChain(item);
        if (success) {
          coins -= item.cost; localStorage.setItem('bb_v1_coins', coins); uiCoinsEl.innerText = coins;
          ownedItems.push(id); localStorage.setItem('bb_v1_owned', JSON.stringify(ownedItems));
          if (item.type === 'hat') {
            if (item.id === 'cape') equippedCape = 'cape';
            else equippedHat = id;
          }
          if (item.type === 'weapon') equippedWeapon = id;
          if (item.type === 'face') equippedFace = id;
          saveEquipmentsToStorage();
          if (typeof window.syncDataToCloud === 'function') window.syncDataToCloud(); // Sync purchase
          renderSkinsShop();
          if (item.type === 'skin') closeModals(); else backToShop();
        } else {
          btn.innerText = "BUY ON-CHAIN";
          btn.disabled = false;
        }
      };
    } else {
      btn.innerText = "INSUFFICIENT BB";
      btn.disabled = true;
      btn.classList.replace('btn-green', 'btn-gray');
    }
  }

  const btnClose = document.getElementById('btn-preview-close');
  if (item.type === 'skin') {
    btnClose.innerText = 'CLOSE';
    btnClose.onclick = closeModals;
  } else {
    btnClose.innerText = 'BACK';
    btnClose.onclick = backToShop;
  }

  document.getElementById('modal-backdrop').classList.remove('hidden');
  document.getElementById('modal-shop').classList.remove('hidden');
}

// Side-Profile AAA+ Path2D Vector Character Rendering
function renderSkeleton(targetCtx, skinId, hatId, capeId, wpnId, faceId, s, state, time) {
  const skinData = SHOP_DB.find(x => x.id === skinId) || SHOP_DB[0];
  targetCtx.save();

  // Base transforms
  let bounceY = 0;
  let legAngle1 = 0;
  let legAngle2 = 0;
  let armAngle1 = 0;
  let armAngle2 = 0;

  if (state === 'IDLE') {
    bounceY = Math.sin(time * 3) * (s * 0.05);
    armAngle1 = Math.sin(time * 2) * 0.1;
    armAngle2 = -Math.sin(time * 2) * 0.1;
  } else if (state === 'WALK') {
    bounceY = Math.abs(Math.sin(time * 15)) * (s * 0.1);
    legAngle1 = Math.sin(time * 15) * 0.6;
    legAngle2 = -Math.sin(time * 15) * 0.6;
    armAngle1 = -legAngle1 * 0.8;
    armAngle2 = -legAngle2 * 0.8;
  }

  // Translate up so feet touch 0, apply squash
  const id = skinData.id;
  let yOffset = -s;
  // Removed manual yOffsets so Pika and Mini match Titan's vertical alignment
  targetCtx.translate(0, yOffset + bounceY);
  targetCtx.scale(1.0 + (1.0 - character.squash) * 0.5, character.squash);
  const colors = skinData.colors;


  // Cape Rendering (Behind body)
  if (capeId === 'cape' && loadedIcons['hat_cape']) {
    if (id === 'classic' || id === 'ninja') {
      targetCtx.save();
      targetCtx.translate(-s * 0.1, s * 0.3);
      targetCtx.rotate(state === 'WALK' ? Math.sin(time * 15) * 0.2 : Math.sin(time * 3) * 0.05);
      targetCtx.drawImage(loadedIcons['hat_cape'], -s * 0.2, 0, s * 0.5, s * 0.6);
      targetCtx.restore();
    }
  }

  // 2. Legs (Both drawn behind body for Pika/Mini/Wizard/Demon)
  if (id === 'wizard' || id === 'pika' || id === 'mini' || id === 'demon') {
    // Leg 1 (Back)
    drawLimbPath(targetCtx, -s * 0.1, s * 0.6, s * 0.15, s * 0.4, legAngle2, colors.body || '#222', true, null, id);
    // Leg 2 (Front)
    drawLimbPath(targetCtx, s * 0.1, s * 0.6, s * 0.15, s * 0.4, legAngle1, colors.body || '#111', false, null, id);
  } else {
    // Standard back leg
    drawLimbPath(targetCtx, -s * 0.1, s * 0.6, s * 0.15, s * 0.4, legAngle2, colors.body || '#222', true, null, id);
  }
  
  // Back Arm
  if (id !== 'dino') {
    drawLimbPath(targetCtx, 0, s * 0.3, s * 0.12, s * 0.35, armAngle2, colors.body || '#222', true, null, id);
  }



  // Body Path Details
  if (id === 'dino') {
    targetCtx.save();
    // Draw front leg behind the body BEFORE translating
    drawLimbPath(targetCtx, s * 0.1, s * 0.6, s * 0.15, s * 0.4, legAngle1, colors.body || '#111', false, null, id);
    targetCtx.translate(0, s * 0.05); // Lower body

    // Single Continuous Body Path for Dino
    targetCtx.fillStyle = '#65a30d'; // main green
    targetCtx.strokeStyle = '#14532d'; // outline green
    targetCtx.lineWidth = Math.max(2, s*0.03);
    targetCtx.lineJoin = 'round';
    targetCtx.lineCap = 'round';
    
    targetCtx.beginPath();
    // 1. Top of head (back to front)
    targetCtx.moveTo(-s*0.1, -s*0.35); 
    targetCtx.quadraticCurveTo(s*0.3, -s*0.35, s*0.35, -s*0.25); 
    // 2. Front of Snout
    targetCtx.quadraticCurveTo(s*0.4, -s*0.15, s*0.4, 0); 
    targetCtx.lineTo(s*0.4, s*0.1); 
    // 3. Bottom of Jaw
    targetCtx.lineTo(s*0.1, s*0.1); 
    // 4. Neck & Plump Belly
    targetCtx.bezierCurveTo(s*0.1, s*0.3, s*0.35, s*0.4, s*0.15, s*0.7); 
    // 5. Flat bottom across leg area
    targetCtx.lineTo(-s*0.15, s*0.7);
    // 6. Tail bottom curve
    targetCtx.quadraticCurveTo(-s*0.3, s*0.6, -s*0.85, s*0.25);
    // 7. Tail top curve
    targetCtx.bezierCurveTo(-s*0.6, s*0.2, -s*0.4, 0, -s*0.3, -s*0.05);
    // 8. Mid-back up to back of head
    targetCtx.bezierCurveTo(-s*0.2, -s*0.1, -s*0.15, -s*0.2, -s*0.1, -s*0.35);
    targetCtx.closePath();
    targetCtx.fill();
    targetCtx.stroke();

    // Belly light green shade
    targetCtx.fillStyle = '#bef264';
    targetCtx.beginPath();
    targetCtx.moveTo(s*0.1, s*0.1);
    targetCtx.bezierCurveTo(s*0.1, s*0.3, s*0.35, s*0.4, s*0.15, s*0.7);
    targetCtx.lineTo(0, s*0.7);
    targetCtx.bezierCurveTo(s*0.15, s*0.4, -s*0.05, s*0.3, 0, s*0.1);
    targetCtx.fill();

    // Dark green back stripes (polygons)
    targetCtx.fillStyle = '#14532d';
    targetCtx.beginPath(); targetCtx.moveTo(-s*0.1, -s*0.2); targetCtx.lineTo(0, -s*0.2); targetCtx.lineTo(-s*0.05, -s*0.1); targetCtx.fill();
    targetCtx.beginPath(); targetCtx.moveTo(-s*0.2, -s*0.05); targetCtx.lineTo(-s*0.1, -s*0.05); targetCtx.lineTo(-s*0.15, s*0.05); targetCtx.fill();
    targetCtx.beginPath(); targetCtx.moveTo(-s*0.35, s*0.1); targetCtx.lineTo(-s*0.25, s*0.1); targetCtx.lineTo(-s*0.3, s*0.2); targetCtx.fill();
    targetCtx.beginPath(); targetCtx.moveTo(-s*0.55, s*0.2); targetCtx.lineTo(-s*0.45, s*0.2); targetCtx.lineTo(-s*0.5, s*0.25); targetCtx.fill();

    // Dark green spots scattered
    targetCtx.beginPath(); targetCtx.arc(-s*0.05, s*0.2, s*0.03, 0, Math.PI*2); targetCtx.fill();
    targetCtx.beginPath(); targetCtx.arc(-s*0.15, s*0.4, s*0.04, 0, Math.PI*2); targetCtx.fill();
    targetCtx.beginPath(); targetCtx.arc(s*0.05, s*0.5, s*0.025, 0, Math.PI*2); targetCtx.fill();
    targetCtx.beginPath(); targetCtx.arc(-s*0.3, s*0.35, s*0.03, 0, Math.PI*2); targetCtx.fill();
    targetCtx.beginPath(); targetCtx.arc(-s*0.45, s*0.3, s*0.02, 0, Math.PI*2); targetCtx.fill();

    // Tiny T-Rex Front Arm (Bent elbow)
    targetCtx.save();
    targetCtx.translate(s*0.1, s*0.35); // Shoulder point on belly
    targetCtx.rotate(armAngle1);
    targetCtx.fillStyle = '#65a30d';
    targetCtx.strokeStyle = '#14532d';
    targetCtx.lineWidth = Math.max(2, s*0.02);
    
    // Arm shape
    targetCtx.beginPath();
    targetCtx.moveTo(-s*0.02, -s*0.02); // Shoulder top
    targetCtx.lineTo(s*0.05, s*0.06);   // Elbow top
    targetCtx.lineTo(s*0.12, s*0.04);   // Wrist top
    targetCtx.lineTo(s*0.13, s*0.08);   // Wrist bot
    targetCtx.lineTo(s*0.04, s*0.11);   // Elbow bot
    targetCtx.lineTo(-s*0.04, 0.03);    // Shoulder bot
    targetCtx.closePath();
    targetCtx.fill(); targetCtx.stroke();
    
    // Claws
    targetCtx.beginPath(); targetCtx.moveTo(s*0.12, s*0.06); targetCtx.lineTo(s*0.16, s*0.08); targetCtx.stroke();
    targetCtx.beginPath(); targetCtx.moveTo(s*0.13, s*0.08); targetCtx.lineTo(s*0.15, s*0.12); targetCtx.stroke();
    targetCtx.restore();
    targetCtx.restore();
  } else if (id === 'pika') {
    // Pika Custom Fat Body
    // Zigzag tail - Better body connection
    targetCtx.beginPath(); targetCtx.moveTo(-s*0.2, s*0.4); targetCtx.lineTo(-s*0.4, s*0.45); targetCtx.lineTo(-s*0.65, s*0.5); targetCtx.lineTo(-s*0.55, s*0.35); targetCtx.lineTo(-s*0.75, s*0.25); targetCtx.lineTo(-s*0.65, s*0.1); targetCtx.lineTo(-s*0.9, -s*0.1); targetCtx.lineTo(-s*0.75, -s*0.2); targetCtx.lineWidth = Math.max(3, s*0.12); targetCtx.strokeStyle = '#facc15'; targetCtx.lineJoin = 'miter'; targetCtx.stroke();
    targetCtx.beginPath(); targetCtx.moveTo(-s*0.2, s*0.4); targetCtx.lineTo(-s*0.35, s*0.42); targetCtx.strokeStyle = '#854d0e'; targetCtx.stroke();
    
    // Fat Body - Shifted LEFT to center the legs
    targetCtx.fillStyle = '#facc15';
    targetCtx.beginPath();
    targetCtx.moveTo(-s * 0.25, s * 0.1);
    targetCtx.quadraticCurveTo(-s * 0.45, s * 0.5, -s * 0.2, s * 0.85);
    targetCtx.lineTo(s * 0.2, s * 0.85);
    targetCtx.quadraticCurveTo(s * 0.4, s * 0.5, s * 0.25, s * 0.1);
    targetCtx.fill();
    
    // Brown stripes (shifted left)
    targetCtx.strokeStyle = '#854d0e'; targetCtx.lineWidth = Math.max(2, s*0.06); targetCtx.lineCap = 'round';
    targetCtx.beginPath(); targetCtx.moveTo(-s*0.35, s*0.35); targetCtx.lineTo(-s*0.15, s*0.38); targetCtx.stroke();
    targetCtx.beginPath(); targetCtx.moveTo(-s*0.37, s*0.5); targetCtx.lineTo(-s*0.17, s*0.53); targetCtx.stroke();


  } else if (id === 'mini') {
    // Mini Custom Pill Body - SCALED UP & LONGER
    // Fat Pill Body - Larger and Taller
    targetCtx.fillStyle = '#facc15';
    targetCtx.beginPath(); targetCtx.roundRect(-s*0.35, -s*0.05, s*0.7, s*0.95, s*0.35); targetCtx.fill();
    
    // Overalls (Blue)
    targetCtx.fillStyle = '#1e40af';
    targetCtx.beginPath(); 
    targetCtx.roundRect(-s*0.35, s*0.55, s*0.7, s*0.35, [0, 0, s*0.35, s*0.35]); targetCtx.fill();
    // Strap (Vertical, shifted left)
    targetCtx.strokeStyle = '#1e40af'; targetCtx.lineWidth = Math.max(2, s*0.1);
    targetCtx.beginPath(); targetCtx.moveTo(-s*0.12, s*0.55); targetCtx.lineTo(-s*0.12, s*0.28); targetCtx.stroke();
  } else if (id === 'demon') {
    // Demon Body (Pill shaped, red gradient)
    let dg = targetCtx.createLinearGradient(0, s*0.2, 0, s*0.8);
    dg.addColorStop(0, '#ef4444'); dg.addColorStop(1, '#991b1b');
    targetCtx.fillStyle = dg;
    targetCtx.beginPath();
    targetCtx.roundRect(-s*0.25, s*0.2, s*0.5, s*0.75, s*0.2);
    targetCtx.fill();

    // Devil Tail
    targetCtx.strokeStyle = '#b91c1c'; targetCtx.lineWidth = Math.max(2, s*0.04); targetCtx.lineCap = 'round';
    targetCtx.beginPath();
    targetCtx.moveTo(-s*0.1, s*0.6);
    targetCtx.quadraticCurveTo(-s*0.5, s*0.7, -s*0.6, s*0.4);
    targetCtx.stroke();
    // Fire on tail tip
    targetCtx.save();
    targetCtx.translate(-s*0.6, s*0.4);
    let firePulse = Math.abs(Math.sin(time * 15)) * s * 0.05;
    targetCtx.fillStyle = '#ef4444'; targetCtx.shadowColor = '#ef4444'; targetCtx.shadowBlur = 10;
    targetCtx.beginPath(); targetCtx.moveTo(0, s*0.05); targetCtx.quadraticCurveTo(-s*0.1, 0, 0, -s*0.15 - firePulse); targetCtx.quadraticCurveTo(s*0.1, 0, 0, s*0.05); targetCtx.fill();
    targetCtx.fillStyle = '#facc15'; targetCtx.shadowColor = '#facc15'; targetCtx.shadowBlur = 5;
    targetCtx.beginPath(); targetCtx.moveTo(0, s*0.02); targetCtx.quadraticCurveTo(-s*0.05, 0, 0, -s*0.08 - firePulse*0.5); targetCtx.quadraticCurveTo(s*0.05, 0, 0, s*0.02); targetCtx.fill();
    targetCtx.restore();
  } else {
    targetCtx.beginPath();
    targetCtx.moveTo(-s * 0.2, s * 0.3);
    targetCtx.quadraticCurveTo(-s * 0.25, s * 0.5, -s * 0.15, s * 0.7);
    targetCtx.lineTo(s * 0.15, s * 0.7);
    targetCtx.quadraticCurveTo(s * 0.25, s * 0.5, s * 0.2, s * 0.3);
  }

    // Removed old cross straps and pouch since they were drawn out of order

  if (id === 'wizard') {
    // Long Mystic Robe/Coat
    targetCtx.fillStyle = '#1e40af';
    targetCtx.beginPath();
    targetCtx.moveTo(-s*0.25, s*0.3);
    targetCtx.lineTo(s*0.25, s*0.3);
    targetCtx.lineTo(s*0.35, s*0.9);
    targetCtx.lineTo(-s*0.35, s*0.9);
    targetCtx.closePath();
    targetCtx.fill();
    // Yellow Stars on Robe
    targetCtx.fillStyle = '#facc15';
    for(let i=0; i<5; i++) {
        targetCtx.beginPath();
        targetCtx.arc((i%2?0.1:-0.1)*s, s*(0.45 + i*0.08), s*0.02, 0, Math.PI*2);
        targetCtx.fill();
    }
  }

  if (id === 'troop') {
    targetCtx.fillStyle = '#e11d48';
    targetCtx.fill();
  } else if (id === 'classic') {
    // Hoodie Body
    targetCtx.fillStyle = '#334155';
    targetCtx.fill();
    targetCtx.strokeStyle = '#111'; targetCtx.lineWidth = 1.5; targetCtx.stroke();
    // Hoodie Pocket
    targetCtx.beginPath();
    targetCtx.moveTo(-s * 0.1, s * 0.65);
    targetCtx.lineTo(-s * 0.05, s * 0.55);
    targetCtx.lineTo(s * 0.05, s * 0.55);
    targetCtx.lineTo(s * 0.1, s * 0.65);
    targetCtx.stroke();
  } else if (id !== 'ninja' && id !== 'pika' && id !== 'mini' && id !== 'dino') {
    targetCtx.fillStyle = colors.body || '#111';
    targetCtx.fill();
  }

  if (id === 'ninja') {
    // Advanced Ninja Body (More athletic V-shape armor)
    targetCtx.fillStyle = '#111';
    targetCtx.beginPath();
    targetCtx.moveTo(-s * 0.25, s * 0.3);
    targetCtx.lineTo(s * 0.25, s * 0.3);
    targetCtx.lineTo(s * 0.15, s * 0.7);
    targetCtx.lineTo(-s * 0.15, s * 0.7);
    targetCtx.fill();
    
    // Dark Gray Armor Chest Plate
    targetCtx.fillStyle = '#374151';
    targetCtx.beginPath(); targetCtx.moveTo(-s*0.15, s*0.35); targetCtx.lineTo(s*0.15, s*0.35); targetCtx.lineTo(s*0.1, s*0.5); targetCtx.lineTo(-s*0.1, s*0.5); targetCtx.fill();

    // Cross straps
    targetCtx.strokeStyle = '#1f2937'; targetCtx.lineWidth = Math.max(3, s * 0.05);
    targetCtx.beginPath(); targetCtx.moveTo(-s*0.15, s*0.35); targetCtx.lineTo(s*0.1, s*0.55); targetCtx.stroke();
    targetCtx.beginPath(); targetCtx.moveTo(s*0.15, s*0.35); targetCtx.lineTo(-s*0.1, s*0.55); targetCtx.stroke();

    // High-quality Red Belt with gold buckle
    targetCtx.fillStyle = '#ef4444';
    targetCtx.beginPath(); targetCtx.roundRect(-s * 0.2, s * 0.52, s * 0.4, s * 0.08, s * 0.02); targetCtx.fill();
    targetCtx.fillStyle = '#facc15';
    targetCtx.fillRect(-s*0.05, s*0.51, s*0.1, s*0.1);
    
    // Dynamic Belt Tails (Animated)
    targetCtx.save();
    targetCtx.translate(s * 0.1, s * 0.55);
    targetCtx.rotate(-Math.sin(time * 5) * 0.2);
    targetCtx.fillStyle = '#ef4444';
    targetCtx.beginPath(); targetCtx.moveTo(0, 0); targetCtx.lineTo(s * 0.2, s * 0.25); targetCtx.lineTo(s * 0.1, s * 0.3); targetCtx.closePath(); targetCtx.fill();
    targetCtx.restore();
  }

  // Character Outline for Troop
  if (id === 'troop') {
    targetCtx.strokeStyle = '#000';
    targetCtx.lineWidth = 0.5;
    targetCtx.stroke();
  }

  // Red Boots for Ninja
  if (id === 'ninja') {
    targetCtx.fillStyle = '#ef4444'; // Red boots
    // Draw on top of legs later or just set here
  }

  // Subtle body details
  if (id === 'classic' || id === 'ninja') {
    let highlight = targetCtx.createLinearGradient(-s * 0.2, s * 0.3, s * 0.2, s * 0.7);
    highlight.addColorStop(0, 'rgba(255,255,255,0.15)'); highlight.addColorStop(1, 'transparent');
    targetCtx.fillStyle = highlight;
    targetCtx.fill();
  }

  if (id === 'cyber') {
    // Cyber Rocket Jetpack (Drawn before body)
    targetCtx.fillStyle = '#94a3b8'; // grey metal
    targetCtx.strokeStyle = '#334155'; // dark metal edge
    targetCtx.lineWidth = Math.max(1, s * 0.02);
    targetCtx.beginPath();
    if (targetCtx.roundRect) {
      targetCtx.roundRect(-s * 0.35, s * 0.35, s * 0.2, s * 0.3, s * 0.05);
    } else {
      targetCtx.rect(-s * 0.35, s * 0.35, s * 0.2, s * 0.3);
    }
    targetCtx.fill(); targetCtx.stroke();
    // Inner panel
    targetCtx.fillStyle = '#475569';
    targetCtx.fillRect(-s * 0.3, s * 0.4, s * 0.1, s * 0.2);

    // Animated Rocket Thrust
    let thrustLength = s * 0.2 + Math.abs(Math.sin(time * 20)) * (s * 0.15);
    targetCtx.fillStyle = '#00e5ff'; // neon blue thrust
    targetCtx.shadowColor = '#00e5ff';
    targetCtx.shadowBlur = 10;
    targetCtx.beginPath();
    targetCtx.moveTo(-s * 0.32, s * 0.65);
    targetCtx.lineTo(-s * 0.18, s * 0.65);
    targetCtx.lineTo(-s * 0.25, s * 0.65 + thrustLength);
    targetCtx.fill();
    // Hot white core
    targetCtx.fillStyle = '#ffffff';
    targetCtx.beginPath();
    targetCtx.moveTo(-s * 0.28, s * 0.65);
    targetCtx.lineTo(-s * 0.22, s * 0.65);
    targetCtx.lineTo(-s * 0.25, s * 0.65 + thrustLength * 0.6);
    targetCtx.fill();
    targetCtx.shadowBlur = 0;

    // Astro Bot Body
    let g = targetCtx.createLinearGradient(-s * 0.2, s * 0.3, s * 0.2, s * 0.7);
    g.addColorStop(0, '#ffffff'); g.addColorStop(1, '#cbd5e1');
    targetCtx.fillStyle = g;
    targetCtx.beginPath();
    if (targetCtx.roundRect) {
      targetCtx.roundRect(-s * 0.2, s * 0.3, s * 0.4, s * 0.45, s * 0.15);
    } else {
      targetCtx.rect(-s * 0.2, s * 0.3, s * 0.4, s * 0.45);
    }
    targetCtx.fill();
  }

  targetCtx.shadowBlur = 0;

  if (id === 'galaxy') {
    // Blue Suit with Gold Trim
    targetCtx.fillStyle = '#1e3a8a';
    targetCtx.beginPath();
    targetCtx.moveTo(-s * 0.2, s * 0.35); targetCtx.lineTo(s * 0.2, s * 0.35);
    targetCtx.lineTo(s * 0.15, s * 0.65); targetCtx.lineTo(-s * 0.15, s * 0.65);
    targetCtx.closePath(); targetCtx.fill();
    // Gold Shoulder Armor
    targetCtx.fillStyle = '#eab308';
    targetCtx.fillRect(-s * 0.25, s * 0.28, s * 0.15, s * 0.1);
    targetCtx.fillRect(s * 0.1, s * 0.28, s * 0.15, s * 0.1);
  }

  if (id === 'cyber') {
    // Astro Bot Head
    let hg = targetCtx.createRadialGradient(0, s * 0.1, 0, 0, s * 0.1, s * 0.3);
    hg.addColorStop(0, '#ffffff'); hg.addColorStop(1, '#cbd5e1');
    targetCtx.fillStyle = hg;
    
    // Stylish Glowing Antenna
    targetCtx.strokeStyle = '#94a3b8'; targetCtx.lineWidth = s * 0.03;
    targetCtx.beginPath(); targetCtx.moveTo(0, 0); 
    targetCtx.quadraticCurveTo(s * 0.1, -s * 0.1, s * 0.1, -s * 0.2); 
    targetCtx.stroke();
    
    // Antenna Glow Tip
    targetCtx.fillStyle = '#00e5ff';
    targetCtx.shadowColor = '#00e5ff'; targetCtx.shadowBlur = 15;
    targetCtx.beginPath(); targetCtx.arc(s * 0.1, -s * 0.2, s * 0.06, 0, Math.PI * 2); targetCtx.fill();
    targetCtx.fillStyle = '#ffffff'; targetCtx.shadowBlur = 0;
    targetCtx.beginPath(); targetCtx.arc(s * 0.1, -s * 0.2, s * 0.02, 0, Math.PI * 2); targetCtx.fill();

    // Head Base
    targetCtx.fillStyle = hg;
    targetCtx.beginPath();
    if (targetCtx.roundRect) {
      targetCtx.roundRect(-s * 0.25, 0, s * 0.5, s * 0.4, s * 0.15);
    } else {
      targetCtx.rect(-s * 0.25, 0, s * 0.5, s * 0.4);
    }
    targetCtx.fill();

    // Blue Visor (Based)
    targetCtx.fillStyle = '#0052ff';
    targetCtx.beginPath();
    if (targetCtx.roundRect) {
      targetCtx.roundRect(-s * 0.2, s * 0.05, s * 0.4, s * 0.3, s * 0.1);
    } else {
      targetCtx.rect(-s * 0.2, s * 0.05, s * 0.4, s * 0.3);
    }
    targetCtx.fill();

    // Big Side Profile Glowing Astro Eye
    targetCtx.fillStyle = '#111111';
    targetCtx.shadowColor = '#111111'; targetCtx.shadowBlur = 10;
    targetCtx.beginPath();
    if (targetCtx.ellipse) {
        targetCtx.ellipse(s * 0.1, s * 0.18, s * 0.08, s * 0.05, Math.PI / 8, 0, Math.PI * 2);
    } else {
        targetCtx.arc(s * 0.1, s * 0.18, s * 0.06, 0, Math.PI * 2);
    }
    targetCtx.fill();
    targetCtx.fillStyle = '#ffffff'; targetCtx.shadowBlur = 0;
    targetCtx.beginPath(); targetCtx.arc(s * 0.12, s * 0.16, s * 0.02, 0, Math.PI * 2); targetCtx.fill();

    targetCtx.shadowBlur = 0;
  }

  if (id === 'troop') {
    targetCtx.strokeStyle = '#9f1239'; targetCtx.lineWidth = 3;
    targetCtx.beginPath(); targetCtx.moveTo(0, s * 0.3); targetCtx.lineTo(0, s * 0.6); targetCtx.stroke();
  }

  // Wizard Aura (In front of body, linear steam)
  if (id === 'wizard') {
    targetCtx.save();
    targetCtx.shadowColor = '#c084fc';
    targetCtx.shadowBlur = 15;
    targetCtx.strokeStyle = 'rgba(192, 132, 252, 0.6)';
    targetCtx.lineWidth = s * 0.03;
    targetCtx.lineCap = 'round';
    
    // Draw 3 wavy lines rising up
    for (let i = -1; i <= 1; i++) {
      let xOff = i * s * 0.2;
      let phase = time * 3 + i * 2;
      targetCtx.beginPath();
      for (let y = s * 0.7; y >= s * 0.3; y -= s * 0.05) {
        let wave = Math.sin(phase - y / s * 10) * s * 0.05;
        if (y === s * 0.7) targetCtx.moveTo(xOff + wave, y);
        else targetCtx.lineTo(xOff + wave, y);
      }
      targetCtx.stroke();
    }
    targetCtx.restore();
  }

  // Head Path
  targetCtx.save();
  if (id === 'troop') {
    targetCtx.fillStyle = colors.head;
    targetCtx.beginPath(); targetCtx.arc(0, s * 0.2, s * 0.35, Math.PI, 0); targetCtx.fill();
    targetCtx.fillRect(-s * 0.35, s * 0.2, s * 0.7, s * 0.2);
    targetCtx.fillStyle = colors.faceShadow || '#111111';
    targetCtx.beginPath(); targetCtx.arc(s * 0.1, s * 0.3, s * 0.2, 0, Math.PI * 2); targetCtx.fill();
  } else if (id === 'pika') {
    targetCtx.fillStyle = '#facc15';
    // Head shape - Shifted left by 0.15
    targetCtx.beginPath(); targetCtx.arc(0, s * 0.15, s * 0.32, 0, Math.PI * 2); targetCtx.fill();
    // Ears - Shifted left by 0.15
    targetCtx.fillStyle = '#eab308';
    targetCtx.beginPath(); targetCtx.moveTo(-s*0.15, s*0.05); targetCtx.lineTo(-s*0.45, -s*0.2); targetCtx.lineTo(0, 0); targetCtx.fill();
    targetCtx.fillStyle = '#111';
    targetCtx.beginPath(); targetCtx.moveTo(-s*0.3, -s*0.08); targetCtx.lineTo(-s*0.45, -s*0.2); targetCtx.lineTo(-s*0.2, -s*0.15); targetCtx.fill();
    targetCtx.fillStyle = '#facc15';
    targetCtx.beginPath(); targetCtx.moveTo(0, 0); targetCtx.lineTo(-s*0.15, -s*0.35); targetCtx.lineTo(s*0.15, -s*0.05); targetCtx.fill();
    targetCtx.fillStyle = '#111';
    targetCtx.beginPath(); targetCtx.moveTo(-s*0.07, -s*0.15); targetCtx.lineTo(-s*0.15, -s*0.35); targetCtx.lineTo(0, -s*0.2); targetCtx.fill();
  } else if (id === 'mini') {
    // Head integrated into pill, draw goggles (side profile) - BETTER DETAIL
    // Goggle Strap
    targetCtx.fillStyle = '#111';
    targetCtx.fillRect(-s*0.35, s*0.18, s*0.7, s*0.1);
    // Goggle Frame (Silver/Metal)
    targetCtx.fillStyle = '#94a3b8';
    targetCtx.beginPath(); targetCtx.roundRect(s*0.22, s*0.1, s*0.16, s*0.28, s*0.04); targetCtx.fill();
    targetCtx.strokeStyle = '#64748b'; targetCtx.lineWidth = 1; targetCtx.stroke();
  } else if (id === 'demon') {
    // Horns
    targetCtx.fillStyle = '#1f2937';
    targetCtx.beginPath(); targetCtx.moveTo(-s*0.15, s*0.25); targetCtx.lineTo(-s*0.25, s*0.05); targetCtx.lineTo(-s*0.05, s*0.22); targetCtx.fill();
    targetCtx.beginPath(); targetCtx.moveTo(s*0.15, s*0.25); targetCtx.lineTo(s*0.25, s*0.05); targetCtx.lineTo(s*0.05, s*0.22); targetCtx.fill();

    // Angry Eyebrows
    targetCtx.strokeStyle = '#111'; targetCtx.lineWidth = Math.max(2, s*0.04); targetCtx.lineCap = 'round';
    targetCtx.beginPath(); targetCtx.moveTo(s*0.05, s*0.3); targetCtx.lineTo(s*0.15, s*0.35); targetCtx.stroke();
    
    // Eyes (Red pupil)
    targetCtx.fillStyle = '#fff';
    targetCtx.beginPath(); targetCtx.arc(s*0.15, s*0.38, s*0.06, 0, Math.PI*2); targetCtx.fill();
    targetCtx.fillStyle = '#b91c1c';
    targetCtx.beginPath(); targetCtx.arc(s*0.15, s*0.38, s*0.03, 0, Math.PI*2); targetCtx.fill();

    // Toothy Smile
    targetCtx.fillStyle = '#111';
    targetCtx.beginPath();
    targetCtx.moveTo(s*0.05, s*0.45);
    targetCtx.quadraticCurveTo(s*0.15, s*0.55, s*0.25, s*0.45);
    targetCtx.quadraticCurveTo(s*0.15, s*0.5, s*0.05, s*0.45);
    targetCtx.fill();
    // Teeth (Zigzag)
    targetCtx.strokeStyle = '#fff'; targetCtx.lineWidth = Math.max(1, s*0.02); targetCtx.lineJoin = 'miter';
    targetCtx.beginPath();
    targetCtx.moveTo(s*0.07, s*0.47); targetCtx.lineTo(s*0.1, s*0.5); targetCtx.lineTo(s*0.13, s*0.47); targetCtx.lineTo(s*0.16, s*0.51); targetCtx.lineTo(s*0.2, s*0.47); targetCtx.lineTo(s*0.23, s*0.49); targetCtx.stroke();

  } else if (id === 'wizard') {
    // Face Skin area
    targetCtx.fillStyle = '#ffedd5';
    targetCtx.beginPath(); targetCtx.arc(0, s*0.2, s*0.22, 0, Math.PI*2); targetCtx.fill();
    // Eye
    targetCtx.fillStyle = '#111';
    targetCtx.beginPath(); targetCtx.arc(s*0.1, s*0.2, s*0.04, 0, Math.PI*2); targetCtx.fill();

    // Long White Beard (Drawn over the bottom of the face)
    targetCtx.fillStyle = '#fff';
    targetCtx.beginPath();
    targetCtx.moveTo(-s*0.18, s*0.28);
    targetCtx.quadraticCurveTo(0, s*0.68, s*0.17, s*0.28);
    targetCtx.fill();

    // 3. Pointy Wizard Hat (Drawn on top)
    targetCtx.fillStyle = '#1e40af';
    targetCtx.beginPath();
    targetCtx.moveTo(-s*0.4, s*0.18);
    targetCtx.lineTo(s*0.4, s*0.18);
    targetCtx.lineTo(0, -s*0.35);
    targetCtx.closePath();
    targetCtx.fill();
    // Star on Hat
    targetCtx.fillStyle = '#facc15';
    targetCtx.beginPath(); targetCtx.arc(0, -s*0.05, s*0.03, 0, Math.PI*2); targetCtx.fill();
  } else if (id === 'galaxy') {
    targetCtx.fillStyle = '#a855f7';
    targetCtx.beginPath();
    targetCtx.roundRect(-s*0.28, -s*0.1, s*0.56, s*0.56, s*0.08); // Square/Blocky head
    targetCtx.fill();
  } else if (id !== 'cyber' && id !== 'dino') {
    targetCtx.fillStyle = colors.head || '#111';
    targetCtx.beginPath(); targetCtx.arc(0, s * 0.2, s * 0.3, 0, Math.PI * 2); targetCtx.fill();
  }

  // Eyes & Details
  if (id === 'dino') {
    // Zigzag Mouth
    targetCtx.strokeStyle = '#14532d';
    targetCtx.lineWidth = Math.max(2, s*0.02);
    targetCtx.beginPath();
    targetCtx.moveTo(s*0.4, s*0.02);
    targetCtx.lineTo(s*0.35, -s*0.02); targetCtx.lineTo(s*0.3, s*0.02);
    targetCtx.lineTo(s*0.25, -s*0.02); targetCtx.lineTo(s*0.2, s*0.02);
    targetCtx.lineTo(s*0.15, -s*0.02); targetCtx.lineTo(s*0.1, s*0.02);
    targetCtx.stroke();

    // Secondary Eye (Background Bulge)
    targetCtx.fillStyle = '#fff';
    targetCtx.beginPath(); targetCtx.arc(s*0.32, -s*0.18, s*0.05, 0, Math.PI*2); targetCtx.fill(); targetCtx.stroke();
    targetCtx.fillStyle = '#111';
    targetCtx.beginPath(); targetCtx.arc(s*0.35, -s*0.17, s*0.015, 0, Math.PI*2); targetCtx.fill();

    // Giant Eye (Foreground)
    targetCtx.fillStyle = '#fff';
    targetCtx.beginPath(); targetCtx.arc(s*0.18, -s*0.2, s*0.08, 0, Math.PI*2); targetCtx.fill(); targetCtx.stroke();
    targetCtx.fillStyle = '#111';
    targetCtx.beginPath(); targetCtx.arc(s*0.22, -s*0.18, s*0.03, 0, Math.PI*2); targetCtx.fill();
    targetCtx.fillStyle = '#fff';
    targetCtx.beginPath(); targetCtx.arc(s*0.23, -s*0.19, s*0.01, 0, Math.PI*2); targetCtx.fill();
  } else if (id === 'ninja') {
    // 1. Sleeker Face Skin Area (Exposed eyes slit)
    targetCtx.fillStyle = '#ffedd5';
    targetCtx.beginPath();
    targetCtx.roundRect(s * 0.05, s * 0.15, s * 0.25, s * 0.08, s * 0.04);
    targetCtx.fill();

    // 2. Ninja Mask / Hood (Overlapping fabric folds)
    targetCtx.fillStyle = '#111';
    targetCtx.beginPath(); targetCtx.moveTo(-s * 0.1, s * 0.22); targetCtx.lineTo(s * 0.35, s * 0.22); targetCtx.lineTo(s * 0.2, s * 0.5); targetCtx.lineTo(-s * 0.1, s * 0.4); targetCtx.fill();
    targetCtx.fillStyle = '#1f2937'; // Highlight fold
    targetCtx.beginPath(); targetCtx.moveTo(s * 0.05, s * 0.22); targetCtx.lineTo(s * 0.3, s * 0.22); targetCtx.lineTo(s * 0.2, s * 0.3); targetCtx.fill();

    // 3. Thick Red Bandana
    targetCtx.fillStyle = '#ef4444';
    targetCtx.fillRect(-s * 0.3, s * 0.05, s * 0.6, s * 0.1);

    // Bandana Tails (Animated behind head)
    targetCtx.save();
    targetCtx.translate(-s * 0.25, s * 0.1);
    targetCtx.rotate(Math.sin(time * 8) * 0.2);
    targetCtx.fillStyle = '#ef4444';
    targetCtx.beginPath(); targetCtx.moveTo(0, 0); targetCtx.quadraticCurveTo(-s * 0.3, -s * 0.1, -s * 0.4, s * 0.1); targetCtx.lineTo(-s * 0.2, s * 0.15); targetCtx.fill();
    targetCtx.beginPath(); targetCtx.moveTo(0, s * 0.05); targetCtx.quadraticCurveTo(-s * 0.3, s * 0.1, -s * 0.35, s * 0.25); targetCtx.lineTo(-s * 0.15, s * 0.2); targetCtx.fill();
    targetCtx.restore();

    // 4. Intense Eye & Scar
    targetCtx.fillStyle = '#000';
    targetCtx.beginPath(); targetCtx.ellipse(s * 0.2, s * 0.19, s * 0.03, s * 0.02, 0, 0, Math.PI * 2); targetCtx.fill();
    // Scar
    targetCtx.strokeStyle = '#ef4444'; targetCtx.lineWidth = 1.5;
    targetCtx.beginPath(); targetCtx.moveTo(s * 0.15, s * 0.12); targetCtx.lineTo(s * 0.25, s * 0.25); targetCtx.stroke();
  } 
  else if (id === 'wizard') {
    // Beard handled in head path
  }
  else if (id === 'pika') {
    // Red cheek
    targetCtx.fillStyle = '#ef4444';
    targetCtx.beginPath(); targetCtx.arc(s*0.12, s*0.24, s*0.08, 0, Math.PI*2); targetCtx.fill();
    // Eye - Above and slightly left of nose
    targetCtx.fillStyle = '#111';
    targetCtx.beginPath(); targetCtx.arc(s*0.24, s*0.08, s*0.04, 0, Math.PI*2); targetCtx.fill();
    // White eye reflection
    targetCtx.fillStyle = '#fff';
    targetCtx.beginPath(); targetCtx.arc(s*0.22, s*0.06, s*0.015, 0, Math.PI*2); targetCtx.fill();
    // Nose - On the outer edge of the face
    targetCtx.fillStyle = '#111';
    targetCtx.beginPath(); targetCtx.arc(s*0.32, s*0.14, s*0.012, 0, Math.PI*2); targetCtx.fill();
    // Mouth - Starting from outer edge, going left
    targetCtx.strokeStyle = '#111'; targetCtx.lineWidth = Math.max(1, s*0.015); targetCtx.lineCap = 'round';
    targetCtx.beginPath(); targetCtx.moveTo(s*0.3, s*0.18); targetCtx.quadraticCurveTo(s*0.26, s*0.22, s*0.22, s*0.18); targetCtx.stroke();
  }
  else if (id === 'mini') {
    // Lens (Better white highlights)
    targetCtx.fillStyle = '#fff';
    targetCtx.beginPath(); targetCtx.arc(s*0.3, s*0.24, s*0.08, 0, Math.PI*2); targetCtx.fill();
    // Eye (Iris)
    targetCtx.fillStyle = '#78350f';
    targetCtx.beginPath(); targetCtx.arc(s*0.32, s*0.24, s*0.045, 0, Math.PI*2); targetCtx.fill();
    // Pupil
    targetCtx.fillStyle = '#111';
    targetCtx.beginPath(); targetCtx.arc(s*0.34, s*0.24, s*0.025, 0, Math.PI*2); targetCtx.fill();
    // Highlight
    targetCtx.fillStyle = '#fff';
    targetCtx.beginPath(); targetCtx.arc(s*0.32, s*0.22, s*0.01, 0, Math.PI*2); targetCtx.fill();
    // Mouth
    targetCtx.fillStyle = '#111';
    targetCtx.beginPath(); targetCtx.arc(s*0.3, s*0.42, s*0.03, 0, Math.PI*2); targetCtx.fill();
  }
  else if (id === 'galaxy') {
    // Thanos Chin Ridges
    targetCtx.strokeStyle = 'rgba(0,0,0,0.3)';
    targetCtx.lineWidth = 1.5;
    for (let i = 0; i < 3; i++) {
      targetCtx.beginPath();
      targetCtx.moveTo(-s * 0.1 + i * s * 0.1, s * 0.35);
      targetCtx.lineTo(-s * 0.1 + i * s * 0.1, s * 0.45);
      targetCtx.stroke();
    }
    // Serious Eyes
    targetCtx.fillStyle = '#111';
    targetCtx.beginPath(); targetCtx.arc(s * 0.15, s * 0.2, s * 0.05, 0, Math.PI * 2); targetCtx.fill();
  }
  else if (id === 'classic') {
    // Thief Mask (Black Domino)
    targetCtx.fillStyle = '#111111';
    targetCtx.beginPath();
    targetCtx.ellipse(s * 0.15, s * 0.18, s * 0.25, s * 0.1, 0, 0, Math.PI * 2);
    targetCtx.fill();
    
    // Eyes (White sclera, black pupils)
    targetCtx.fillStyle = '#ffffff';
    targetCtx.beginPath(); targetCtx.arc(s * 0.05, s * 0.18, s * 0.07, 0, Math.PI * 2); targetCtx.fill();
    targetCtx.beginPath(); targetCtx.arc(s * 0.25, s * 0.18, s * 0.07, 0, Math.PI * 2); targetCtx.fill();
    
    targetCtx.fillStyle = '#111111';
    targetCtx.beginPath(); targetCtx.arc(s * 0.08, s * 0.18, s * 0.03, 0, Math.PI * 2); targetCtx.fill();
    targetCtx.beginPath(); targetCtx.arc(s * 0.28, s * 0.18, s * 0.03, 0, Math.PI * 2); targetCtx.fill();
    
    // Smile (Red inside)
    targetCtx.fillStyle = '#ef4444';
    targetCtx.beginPath();
    targetCtx.moveTo(s * 0.05, s * 0.35);
    targetCtx.quadraticCurveTo(s * 0.15, s * 0.45, s * 0.25, s * 0.35);
    targetCtx.fill();
    targetCtx.strokeStyle = '#111'; targetCtx.lineWidth = 1.5; targetCtx.stroke();
    
    // Beanie Hat
    targetCtx.fillStyle = '#111111';
    targetCtx.beginPath();
    targetCtx.arc(0, s * 0.15, s * 0.3, Math.PI, 0); // Top half
    targetCtx.fill();
    // Beanie Brim
    targetCtx.fillRect(-s * 0.3, s * 0.1, s * 0.6, s * 0.08);
  }
  else if (id === 'troop') {
    // No eyes for troop, just shadow
  }
  else if (id === 'cyber') {
    // Eye already drawn in body block
  }
  else {
    targetCtx.fillStyle = colors.face || '#fff';
    if (id === 'wizard') targetCtx.fillStyle = '#ffedd5'; // Skin tone
    targetCtx.beginPath(); targetCtx.arc(s * 0.18, s * 0.2, s * 0.06, 0, Math.PI * 2); targetCtx.fill();
  }

  // Final Outline for Troop (Head)
  if (id === 'troop') {
    targetCtx.strokeStyle = '#000';
    targetCtx.lineWidth = 0.5;
    targetCtx.stroke();
  }

  // Draw Equipment
  if (id === 'classic' || id === 'ninja') {
    if (hatId === 'cap' && loadedIcons['hat_cap']) targetCtx.drawImage(loadedIcons['hat_cap'], -s * 0.32, -s * 0.30, s * 0.8, s * 0.45);
    if (hatId === 'halo' && loadedIcons['hat_halo']) targetCtx.drawImage(loadedIcons['hat_halo'], -s * 0.5, -s * 0.4, s * 1.0, s * 0.4);

    if (faceId === 'glasses' && loadedIcons['face_glasses']) targetCtx.drawImage(loadedIcons['face_glasses'], -s * 0.15, s * 0.1, s * 0.6, s * 0.25);
    if (faceId === 'bandana' && loadedIcons['face_bandana']) targetCtx.drawImage(loadedIcons['face_bandana'], -s * 0.2, s * 0.2, s * 0.6, s * 0.4);
    if (faceId === 'mask' && loadedIcons['face_mask']) targetCtx.drawImage(loadedIcons['face_mask'], -s * 0.15, s * 0.3, s * 0.5, s * 0.35);
  }

  // Animated Electricity Aura (Drawn IN FRONT of the body)
  if (id === 'pika') {
    targetCtx.save();
    targetCtx.strokeStyle = '#0ea5e9'; // Bright cyan sparks
    targetCtx.shadowColor = '#38bdf8';
    targetCtx.shadowBlur = 15;
    targetCtx.lineWidth = Math.max(2, s*0.04);
    targetCtx.lineJoin = 'miter';
    targetCtx.lineCap = 'round';
    
    const sparkCount = 3;
    for(let i=0; i<sparkCount; i++) {
      // Create a flashy flickering effect that jumps around
      const t = Math.floor(time * 15 + i * 7) % 20;
      if (t < 5) {
        // Discrete random positions (does not smoothly rotate)
        const seed = Math.floor(time * 15) + i * 100;
        const pseudoRandX = (Math.sin(seed * 13.5) * 0.5 - 0.05) * s;
        const pseudoRandY = (Math.cos(seed * 21.3) * 0.4 + 0.45) * s;
        
        // Random flip horizontally for variety
        const dir = (seed % 2 === 0) ? 1 : -1;

        targetCtx.beginPath();
        targetCtx.moveTo(pseudoRandX, pseudoRandY);
        targetCtx.lineTo(pseudoRandX + dir*s*0.15, pseudoRandY - s*0.1);
        targetCtx.lineTo(pseudoRandX + dir*s*0.05, pseudoRandY - s*0.15);
        targetCtx.lineTo(pseudoRandX + dir*s*0.2, pseudoRandY - s*0.3);
        targetCtx.stroke();
        
        // Inner white core
        targetCtx.strokeStyle = '#ffffff';
        targetCtx.lineWidth = Math.max(1, s*0.02);
        targetCtx.stroke();
        // Reset
        targetCtx.strokeStyle = '#0ea5e9';
        targetCtx.lineWidth = Math.max(2, s*0.04);
      }
    }
    targetCtx.restore();
  }

  targetCtx.restore();

  // Front Arm & Leg
  if (id !== 'wizard' && id !== 'pika' && id !== 'mini' && id !== 'dino' && id !== 'demon') {
    drawLimbPath(targetCtx, s * 0.1, s * 0.6, s * 0.15, s * 0.4, legAngle1, colors.body || '#111', false, null, id);
  }
  
  // Troop Arm alignment fix
  let armX = 0;
  if (id === 'troop') armX = s * 0.1;
  if (id !== 'dino') {
    drawLimbPath(targetCtx, armX, s * 0.3, s * 0.12, s * 0.35, armAngle1, colors.body || '#111', false, wpnId, id);
  }

  // Troop Lightsaber
  if (id === 'troop') {
    targetCtx.save();
    targetCtx.translate(armX, s * 0.3);
    targetCtx.rotate(armAngle1);
    
    targetCtx.translate(0, s * 0.3); // Translate to hand center
    targetCtx.rotate(-Math.PI / 6); // Tilt forward
    
    // Lightsaber Handle
    targetCtx.fillStyle = '#cbd5e1';
    targetCtx.fillRect(-s*0.03, -s*0.05, s*0.06, s*0.15);
    targetCtx.fillStyle = '#111';
    targetCtx.fillRect(-s*0.04, -s*0.02, s*0.08, s*0.04);
    
    // Glowing Blue Blade
    targetCtx.shadowColor = '#00e5ff';
    targetCtx.shadowBlur = 20;
    targetCtx.fillStyle = '#ffffff';
    targetCtx.beginPath();
    targetCtx.roundRect(-s*0.02, -s*0.55, s*0.04, s*0.5, s*0.02);
    targetCtx.fill();
    targetCtx.shadowBlur = 10;
    targetCtx.fillStyle = '#00e5ff';
    targetCtx.globalAlpha = 0.5;
    targetCtx.beginPath();
    targetCtx.roundRect(-s*0.03, -s*0.55, s*0.06, s*0.5, s*0.03);
    targetCtx.fill();
    targetCtx.globalAlpha = 1.0;
    targetCtx.restore();
  }

  // Infinity Gauntlet for Galaxy Skin
  if (id === 'galaxy') {
    targetCtx.save();
    targetCtx.translate(0, s * 0.3);
    targetCtx.rotate(armAngle1);
    // Gold Gauntlet Base
    targetCtx.fillStyle = '#eab308';
    targetCtx.shadowColor = '#eab308'; targetCtx.shadowBlur = 5;
    targetCtx.beginPath();
    targetCtx.roundRect(-s * 0.08, s * 0.25, s * 0.16, s * 0.15, s * 0.04);
    targetCtx.fill();
    // Colored Gems
    const gems = ['#ef4444', '#22c55e', '#3b82f6', '#f59e0b', '#a855f7', '#06b6d4'];
    gems.forEach((gc, i) => {
      targetCtx.fillStyle = gc;
      targetCtx.shadowBlur = 2;
      targetCtx.beginPath();
      targetCtx.arc(-s * 0.04 + (i % 3) * s * 0.04, s * 0.28 + Math.floor(i / 3) * s * 0.05, s * 0.015, 0, Math.PI * 2);
      targetCtx.fill();
    });
    targetCtx.restore();
  }

  // Wizard Staff
  if (id === 'wizard') {
    targetCtx.save();
    targetCtx.translate(0, s * 0.3);
    targetCtx.rotate(armAngle1);
    // Wooden Staff
    targetCtx.strokeStyle = '#78350f';
    targetCtx.lineWidth = 4;
    targetCtx.beginPath();
    targetCtx.moveTo(0, s * 0.35); targetCtx.lineTo(0, -s * 0.25);
    targetCtx.stroke();
    // Golden Orb
    targetCtx.fillStyle = '#facc15';
    targetCtx.shadowColor = '#facc15'; targetCtx.shadowBlur = 10;
    targetCtx.beginPath(); targetCtx.arc(0, -s * 0.3, s*0.08, 0, Math.PI*2); targetCtx.fill();
    targetCtx.shadowBlur = 0;
    targetCtx.restore();
  }

  targetCtx.restore();
}

function drawLimbPath(targetCtx, x, y, w, h, angle, color, isBack, wpnId, skinId) {
  targetCtx.save();
  targetCtx.translate(x, y); targetCtx.rotate(angle);
  
  // Thin black outline for Troop, Ninja, and Pika limbs
  let drawStroke = false;
  if (color === '#e11d48' || skinId === 'ninja' || skinId === 'pika') drawStroke = true;

  const baseColor = isBack ? shadeColor(color, -20) : color;
  targetCtx.fillStyle = baseColor;
  targetCtx.beginPath(); targetCtx.roundRect(-w / 2, 0, w, h, w / 2);
  targetCtx.fill();
  if (drawStroke) {
    targetCtx.strokeStyle = '#000';
    targetCtx.lineWidth = skinId === 'ninja' ? 1.5 : 0.5;
    targetCtx.stroke();
  }

  // Ninja Wraps on Limbs
  if (skinId === 'ninja') {
    targetCtx.strokeStyle = '#1f2937';
    targetCtx.lineWidth = 2;
    targetCtx.beginPath();
    targetCtx.moveTo(-w/2, h*0.3); targetCtx.lineTo(w/2, h*0.5);
    targetCtx.moveTo(-w/2, h*0.5); targetCtx.lineTo(w/2, h*0.7);
    targetCtx.moveTo(-w/2, h*0.7); targetCtx.lineTo(w/2, h*0.9);
    targetCtx.stroke();
  }

  // Universal Feet (for legs) - Contrasting Color
  if (h > w * 1.5 && !wpnId) {
    let footColor = (color === '#111' || color === '#222') ? '#334155' : shadeColor(color, -30);
    if (color === '#111' && !isBack) footColor = '#ef4444'; // default red boots if needed
    if (skinId === 'ninja') footColor = '#1f2937'; // Ninja boots/wraps
    
    targetCtx.fillStyle = footColor;
    targetCtx.beginPath(); targetCtx.arc(0, h, w*0.6, 0, Math.PI*2); targetCtx.fill();
    // Subtle outline for foot
    targetCtx.strokeStyle = skinId === 'ninja' ? '#000' : 'rgba(0,0,0,0.2)';
    targetCtx.lineWidth = skinId === 'ninja' ? 1.5 : 1;
    targetCtx.stroke();
  }
  
  // Universal Hands (for arms) - Contrasting Color
  if (h < w * 2 || wpnId) {
    let handColor = (color === '#111' || color === '#222') ? '#475569' : shadeColor(color, -40);
    if (skinId === 'ninja') handColor = '#fcd34d'; // Peach skin hands
    
    targetCtx.fillStyle = handColor;
    targetCtx.beginPath(); targetCtx.arc(0, h, w*0.5, 0, Math.PI*2); targetCtx.fill();
    targetCtx.strokeStyle = skinId === 'ninja' ? '#000' : 'rgba(0,0,0,0.2)';
    targetCtx.lineWidth = skinId === 'ninja' ? 1.5 : 1;
    targetCtx.stroke();
  }
    // Subtle outline for hand
    targetCtx.strokeStyle = 'rgba(0,0,0,0.2)';
    targetCtx.lineWidth = 1;
    targetCtx.stroke();

  if (!isBack && wpnId && (skinId === 'classic' || skinId === 'ninja')) {
    let iconId = 'wpn_sword';
    if (wpnId === 'plasma_saber') iconId = 'wpn_saber';
    else if (wpnId === 'battle_axe') iconId = 'wpn_axe';
    else if (wpnId === 'laser_gun') iconId = 'wpn_gun';

    if (loadedIcons[iconId]) {
      targetCtx.translate(0, h);
      targetCtx.rotate(-Math.PI / 6); // Tilt forwards
      targetCtx.drawImage(loadedIcons[iconId], -w*1.5, -h * 1.3, w * 3, h * 1.5);
    }
  }

  targetCtx.restore();
}

function shadeColor(color, percent) {
  let f = parseInt(color.slice(1), 16),
    t = percent < 0 ? 0 : 255,
    p = percent < 0 ? percent * -1 : percent,
    R = f >> 16,
    G = f >> 8 & 0x00FF,
    B = f & 0x0000FF;

  // Handle 3-digit hex (e.g. #111)
  if (color.length === 4) {
    R = parseInt(color[1] + color[1], 16);
    G = parseInt(color[2] + color[2], 16);
    B = parseInt(color[3] + color[3], 16);
  }

  return "#" + (0x1000000 + (Math.round((t - R) * (p / 100)) + R) * 0x10000 + (Math.round((t - G) * (p / 100)) + G) * 0x100 + (Math.round((t - B) * (p / 100)) + B)).toString(16).slice(1);
}

function setupInitialState() {
  platforms = [{ x: W * 0.1, w: Math.min(120, W * 0.25), npcIndex: -1 }];
  generatePlatform();
  character.x = platforms[0].x + platforms[0].w - character.size * 1.5;
  character.y = H - platformHeight;
  character.rotation = 0;
  resetBridge();
  updateLevelUI();
}

// 10 Biome System with Names
const BIOMES = [
  { name: 'GREEN HILLS', skyTop: '#38bdf8', skyBot: '#fde047', mtn1: '#15803d', mtn2: '#166534', platDirt: '#451a03', platTop: '#4ade80' },
  { name: 'SUNSET MOUNTAIN', skyTop: '#f97316', skyBot: '#ec4899', mtn1: '#9d174d', mtn2: '#831843', platDirt: '#4a044e', platTop: '#fcd34d' },
  { name: 'NEON CITY', skyTop: '#0f172a', skyBot: '#1e1b4b', mtn1: '#312e81', mtn2: '#1e1b4b', platDirt: '#020617', platTop: '#00e5ff' },
  { name: 'SPACE STATION', skyTop: '#000000', skyBot: '#0f172a', mtn1: '#1e293b', mtn2: '#0f172a', platDirt: '#334155', platTop: '#94a3b8' },
  { name: 'CYBER GRID', skyTop: '#064e3b', skyBot: '#021a14', mtn1: '#065f46', mtn2: '#047857', platDirt: '#01030b', platTop: '#10b981' },
  { name: 'DEEP FOREST', skyTop: '#0284c7', skyBot: '#047857', mtn1: '#065f46', mtn2: '#064e3b', platDirt: '#210c01', platTop: '#15803d' },
  { name: 'BARREN DESERT', skyTop: '#fef08a', skyBot: '#facc15', mtn1: '#ca8a04', mtn2: '#a16207', platDirt: '#713f12', platTop: '#eab308' },
  { name: 'FLOATING RUINS', skyTop: '#c084fc', skyBot: '#7e22ce', mtn1: '#6b21a8', mtn2: '#581c87', platDirt: '#170832', platTop: '#d8b4fe' },
  { name: 'LAVA WORLD', skyTop: '#450a0a', skyBot: '#7f1d1d', mtn1: '#991b1b', mtn2: '#7f1d1d', platDirt: '#2a0a0a', platTop: '#ef4444' },
  { name: 'BASE HQ', skyTop: '#0052ff', skyBot: '#0033cc', mtn1: '#002299', mtn2: '#001166', platDirt: '#000833', platTop: '#00d2ff' }
];

function updateLevelUI() {
  level = Math.floor(score / 10) + 1;
  const bIdx = Math.min(level - 1, BIOMES.length - 1);
  const biome = BIOMES[bIdx];
  levelNameEl.innerText = biome.name;

  levelFillEl.style.background = biome.platTop;
  levelFillEl.style.boxShadow = `0 0 10px ${biome.platTop}, 0 0 20px ${biome.platTop}`;
  levelNameEl.style.color = biome.platTop;
  levelNameEl.style.textShadow = `0 2px 4px rgba(0,0,0,0.8), 0 0 15px ${biome.platTop}`;

  let progress = (score % 10) / 10 * 100;
  levelFillEl.style.width = `${progress}%`;

  levelFillEl.classList.remove('spark-fill');
  void levelFillEl.offsetWidth;
  levelFillEl.classList.add('spark-fill');
}

function startGame() {
  initAudio();
  score = 0; level = 1;
  perfectStreak = 0; sessionBestCombo = 0; sessionPerfects = 0; sessionCoins = 0;
  window.newRecordReached = false;
  scoreEl.innerText = score;
  cameraX = 0; targetCameraX = 0; currentPlatformIndex = 0; particles = []; scaleAmount = 1.0; shakeAmount = 0;
  reviveUsed = false; bridgesCrossed = 0; sessionCoins = 0; sessionPerfects = 0; sessionBestCombo = 0;
  setupSessionGoal();
  setupInitialState();
  gameState = STATES.PLAYING;
  document.querySelector('.gh-center').style.opacity = '1';
  const headerUI = document.getElementById('game-header-ui');
  if (headerUI) {
    headerUI.style.opacity = '1';
    headerUI.style.pointerEvents = 'auto';
  }
  gameOverOverlay.classList.add('hidden');
  const startOverlay = document.getElementById('start-overlay');
  if (startOverlay) startOverlay.classList.add('hidden');
  btnRevive.classList.add('hidden');
  if (!localStorage.getItem('bb_v1_tut_done')) tutEl.classList.remove('hidden');
  incMetric('bb_v1_total_games', 1);
}

function reviveGame() {
  if (coins >= 25 && !reviveUsed) {
    addCoins(-25);
    reviveUsed = true;
    gameOverOverlay.classList.add('hidden');
    gameState = STATES.PLAYING;

    // Reset to current platform safely
    const currP = platforms[currentPlatformIndex];
    character.x = currP.x + currP.w - character.size * 1.5;
    character.y = H - platformHeight;
    character.rotation = 0;

    resetBridge();
    document.querySelector('.gh-center').style.opacity = '1';
    btnRevive.classList.add('hidden');
    playSound('perfect');
  }
}

function generatePlatform() {
  // SYSTEM 8: DIFFICULTY PROGRESSION
  let difficulty = Math.min(1.0, score / 60);

  const minW = 60 - (difficulty * 35);
  const maxW = 160 - (difficulty * 80);
  const minGap = 50 + (difficulty * 60);
  const maxGap = Math.min(W * 0.5, 150 + (difficulty * 180));

  const lastP = platforms[platforms.length - 1];
  const w = Math.floor(Math.random() * (maxW - minW + 1)) + minW;
  const gap = Math.floor(Math.random() * (maxGap - minGap + 1)) + minGap;
  const x = lastP.x + lastP.w + gap;

  platforms.push({ x, w, npcIndex: -1 });
  currentGapWidth = gap;
  if (platforms.length > 5) {
    platforms.shift();
    if (currentPlatformIndex > 0) currentPlatformIndex--;
  }
}

function resetBridge() {
  const curr = platforms[currentPlatformIndex];
  bridge.x = curr.x + curr.w; bridge.y = H - platformHeight; bridge.length = 0; bridge.angle = 0; bridge.fallTime = 0;
}

function spawnConfetti(x, y) {
  for (let i = 0; i < 50; i++) {
    particles.push({
      x: x + (Math.random() - 0.5) * 100, y: y, vx: (Math.random() - 0.5) * 25, vy: (Math.random() - 1) * 25, life: 1.5,
      color: ['#00ff88', '#fff', '#00e5ff', '#ff2a7a', '#facc15'][Math.floor(Math.random() * 5)]
    });
  }
}

function spawnSparks(x, y) {
  for (let i = 0; i < 15; i++) {
    particles.push({
      x: x + (Math.random() - 0.5) * 10, y: y, vx: (Math.random() - 0.5) * 10, vy: -Math.random() * 15, life: 0.6,
      color: ['#f97316', '#fbbf24', '#fff'][Math.floor(Math.random() * 3)]
    });
  }
}

function addCoins(amount, x, y) {
  coins += amount;
  uiCoinsEl.innerText = coins;
  localStorage.setItem('bb_v1_coins', coins);
  if (amount > 0) {
    playSound('coin');
    incMetric('bb_v1_total_score', amount);
    if (x && y) spawnFloatingText(`+${amount} BB`, x, y);
  }
}

function spawnFloatingText(text, x, y, isSpecial = false) {
  const container = document.getElementById('canvas-wrapper') || document.body;
  const el = document.createElement('div');
  el.className = 'floating-text';
  if (isSpecial) el.classList.add('hot-streak');
  el.innerText = text;
  // Convert world x to screen x
  const rect = canvas.getBoundingClientRect();
  const screenX = (x - cameraX) * (canvas.offsetWidth / W);
  const screenY = y * (canvas.offsetHeight / H);
  el.style.left = `${screenX}px`;
  el.style.top = `${screenY}px`;
  container.appendChild(el);
  setTimeout(() => el.remove(), 1000);
}

function setupSessionGoal() {
  const goals = [
    { text: "Reach 20 score", target: 20, type: 'score' },
    { text: "Hit 3 perfects", target: 3, type: 'perfect' },
    { text: "Earn 50 BB", target: 50, type: 'coins' },
    { text: "Beat your best", target: bestScore + 1, type: 'score' }
  ];
  const g = goals[Math.floor(Math.random() * goals.length)];
  currentSessionGoal = g.text;
  notifyMission("Session Goal: " + g.text);
}

function checkLanding() {
  incMetric('bb_v1_total_bridges', 1);
  const nextP = platforms[currentPlatformIndex + 1];
  const bridgeTip = bridge.x + bridge.length;
  const tolerance = 5; // Pixels for near-miss

  // 1. SUCCESS CHECK
  if (bridgeTip >= nextP.x && bridgeTip <= nextP.x + nextP.w) {
    success = true; platforms[currentPlatformIndex].bridgeL = bridge.length;
    bridgesCrossed++;

    // Perfect Zone Logic
    let basePerfectRatio = 0.20;
    let shrinkFactor = Math.max(0.05, basePerfectRatio - (level * 0.015));
    const perfectW = Math.max(10, nextP.w * shrinkFactor);
    const perfectX = nextP.x + (nextP.w / 2) - (perfectW / 2);

    let isRisky = (bridgeTip < nextP.x + 10) || (bridgeTip > nextP.x + nextP.w - 10);

    if (bridgeTip >= perfectX && bridgeTip <= perfectX + perfectW) {
      perfectStreak++;
      sessionPerfects++;
      if (perfectStreak > sessionBestCombo) sessionBestCombo = perfectStreak;

      let comboBB = Math.min(32, Math.pow(2, perfectStreak));
      sessionComboBonus += comboBB;

      score += 2; addCoins(comboBB, bridgeTip, H - platformHeight - 50); sessionCoins += comboBB;
      shakeAmount = 15; scaleAmount = 1.05;
      incMetric('bb_v1_total_perfects', 1);
      trackMission('perfect', 1); trackMission('combo', perfectStreak);
      spawnSparks(bridgeTip, H - platformHeight);

      let msg = `PERFECT x${perfectStreak}!`;
      if (perfectStreak === 5) msg = "HOT STREAK! 🔥";
      if (perfectStreak === 10) msg = "LEGENDARY!! 👑";

      perfectEl.innerText = msg;
      perfectEl.classList.add('show');
      setTimeout(() => perfectEl.classList.remove('show'), 1200);
      playSound('perfect');
      if (perfectStreak >= 5) spawnFloatingText(msg, bridgeTip, H - platformHeight - 100, true);
    } else {
      perfectStreak = 0;
      let reward = isRisky ? 5 : 1;
      score += 1; addCoins(reward, bridgeTip, H - platformHeight - 50);
      sessionCoins += reward;
      if (isRisky) {
        spawnFloatingText("RISKY SAVE! +5", bridgeTip, H - platformHeight - 80);
        playSound('success');
      }
    }

    // SYSTEM 5: RISK / REWARD (Longer bridge = higher reward)
    let gapRatio = bridge.length / (W * 0.5);
    if (gapRatio > 0.6) {
      let riskBonus = Math.floor(gapRatio * 10);
      if (riskBonus > 0) { addCoins(riskBonus, bridgeTip, H - platformHeight - 120); sessionCoins += riskBonus; }
    }

    scoreEl.innerText = score;
    trackMission('score', score);
    updateLevelUI();
    character.squash = 0.55;
  }
  else {
    // 2. NEAR MISS CHECK
    let distFromEdge = Math.min(Math.abs(bridgeTip - nextP.x), Math.abs(bridgeTip - (nextP.x + nextP.w)));
    if (distFromEdge < 15) {
      slowMoTimer = 0.4;
      shakeAmount = 10;
      perfectEl.innerText = "ALMOST!";
      perfectEl.classList.add('show');
      setTimeout(() => perfectEl.classList.remove('show'), 1000);
    }
    success = false;
    perfectStreak = 0;
  }
  gameState = STATES.CHARACTER_WALKING;
}

function triggerGameOver() {
  gameState = STATES.GAME_OVER; shakeAmount = 25; playSound('fail');
  let isNewBest = false;
  if (score > bestScore) {
    bestScore = score;
    bestEl.innerText = bestScore;
    localStorage.setItem('bb_v1_best', bestScore);
    isNewBest = true;
  }

  let psychologyMsg = "";
  if (score < 3) {
    psychologyMsg = "Just a warm up! Let's go again!";
  } else if (isNewBest) {
    psychologyMsg = "UNBELIEVABLE! New Personal Record! 🏆";
  } else {
    let diff = bestScore - score;
    if (diff <= 5) psychologyMsg = `So close! Only ${diff} away from your best!`;
    else psychologyMsg = "Great effort! One more run for the win?";
  }

  const breakdownHTML = `
    <div class="breakdown-box" style="width: 100%; max-width: 320px; text-transform: uppercase;">
      <div class="breakdown-row" style="margin-bottom: 4px;"><span>SCORE:</span> <strong style="color:#00ff88;">${score}</strong></div>
      <div class="breakdown-row" style="border-bottom: 2px solid rgba(255,255,255,0.1); padding-bottom: 8px; margin-bottom: 8px;"><span>BEST:</span> <strong>${bestScore}</strong></div>
      
      <div class="breakdown-row"><span>Bridges Crossed:</span> <strong>${bridgesCrossed}</strong></div>
      <div class="breakdown-row"><span>Perfect Landings:</span> <strong>${sessionPerfects}</strong></div>
      <div class="breakdown-row" style="border-bottom: 2px solid rgba(255,255,255,0.1); padding-bottom: 8px; margin-bottom: 8px;"><span>Best Combo:</span> <strong>x${sessionBestCombo}</strong></div>
      
      <div class="breakdown-row"><span style="color:#facc15;">Total Earned:</span> <strong style="color:#facc15;">${sessionCoins} BB</strong></div>
      <p style="margin-top:15px; font-style:italic; font-size:0.8rem; color:#94a3b8; text-align:center; line-height:1.4; text-transform: none;">${psychologyMsg}</p>
    </div>
  `;

  const statsContainer = document.querySelector('.go-stats-container');
  if (statsContainer) {
    statsContainer.innerHTML = breakdownHTML;
  }

  if (coins >= 25 && !reviveUsed && score > 0) {
    btnRevive.classList.remove('hidden');
    btnRevive.innerText = "REVIVE (25 BB)";
    btnRevive.onclick = reviveGame;
  } else {
    btnRevive.classList.add('hidden');
  }

  // Trigger cloud sync to save coins and new best score
  if (typeof window.syncDataToCloud === 'function') window.syncDataToCloud();

  document.querySelector('.gh-center').style.opacity = '0';
  setTimeout(() => gameOverOverlay.classList.remove('hidden'), 800);
}

function triggerGameWon() {
  gameState = STATES.GAME_WON;
  playSound('perfect');
  spawnConfetti(cameraX + W / 2, H / 2);

  let w = parseInt(localStorage.getItem('bb_v1_games_won') || '0');
  localStorage.setItem('bb_v1_games_won', w + 1);

  let isNewBest = false;
  if (score > bestScore) { bestScore = score; bestEl.innerText = bestScore; localStorage.setItem('bb_v1_best', bestScore); isNewBest = true; }
  const psychologyMsg = isNewBest ? "UNBELIEVABLE! New Personal Record! 🏆" : "Amazing run! Can you do even better?";
  const breakdownHTML = `
    <div class="breakdown-box" style="width: 100%; max-width: 320px; text-transform: uppercase;">
      <div class="breakdown-row" style="margin-bottom: 4px;"><span>SCORE:</span> <strong style="color:#00ff88;">${score}</strong></div>
      <div class="breakdown-row" style="border-bottom: 2px solid rgba(255,255,255,0.1); padding-bottom: 8px; margin-bottom: 8px;"><span>BEST:</span> <strong>${bestScore}</strong></div>
      
      <div class="breakdown-row"><span>Bridges Crossed:</span> <strong>${bridgesCrossed}</strong></div>
      <div class="breakdown-row"><span>Perfect Landings:</span> <strong>${sessionPerfects}</strong></div>
      <div class="breakdown-row" style="border-bottom: 2px solid rgba(255,255,255,0.1); padding-bottom: 8px; margin-bottom: 8px;"><span>Best Combo:</span> <strong>x${sessionBestCombo}</strong></div>
      
      <div class="breakdown-row"><span style="color:#facc15;">Total Earned:</span> <strong style="color:#facc15;">${sessionCoins} BB</strong></div>
      <p style="margin-top:15px; font-style:italic; font-size:0.8rem; color:#94a3b8; text-align:center; line-height:1.4; text-transform: none;">${psychologyMsg}</p>
    </div>
  `;
  const statsContainer = document.querySelector('.go-stats-container');
  if (statsContainer) statsContainer.innerHTML = breakdownHTML;
  
  updateLeaderboardUI();

  document.querySelector('.gh-center').style.opacity = '0';
  btnRevive.classList.add('hidden');

  const btnSubmitScore = document.getElementById('btn-submit-score');
  if (btnSubmitScore) {
    btnSubmitScore.classList.add('hidden');
  }

  if (isNewBest && score > 0) {
    setTimeout(async () => {
      if (typeof window.submitScoreToFirebase === 'function') {
        await window.submitScoreToFirebase(score);
      }
    }, 100);
  }

  setTimeout(() => gameOverOverlay.classList.remove('hidden'), 1000);
}

function handlePointerDown(e) {
  if (e.target.tagName === 'BUTTON' || gameState !== STATES.PLAYING) return;
  if (!window.userAddress) {
    showInfoModal('Wallet Required', 'You must connect your wallet to play the game!');
    return;
  }
  initAudio();
  if (gameState === STATES.PLAYING) {
    gameState = STATES.BRIDGE_GROWING; startGrowSound();
    if (!tutEl.classList.contains('hidden')) {
      tutEl.classList.add('hidden');
      localStorage.setItem('bb_v1_tut_done', 'true');
    }
  }
}

function handlePointerUp(e) {
  if (e.target.tagName === 'BUTTON') return;
  if (gameState === STATES.BRIDGE_GROWING) { gameState = STATES.BRIDGE_FALLING; stopGrowSound(); playSound('drop'); }
}

const canvasArea = document.getElementById('canvas-wrapper');
canvasArea.addEventListener('mousedown', handlePointerDown);
canvasArea.addEventListener('touchstart', (e) => { e.preventDefault(); handlePointerDown(e); }, { passive: false });
window.addEventListener('mouseup', handlePointerUp);
window.addEventListener('touchend', handlePointerUp);
document.getElementById('btn-play').addEventListener('click', startGame);
document.getElementById('btn-restart').addEventListener('click', startGame);
document.getElementById('btn-start-overlay').addEventListener('click', startGame);
document.getElementById('btn-revive').addEventListener('click', reviveGame);

// Consolidated Feature Card Listeners
document.getElementById('fc-skill')?.addEventListener('click', () => {
  console.log("Skill Missions Card Clicked");
  if (typeof showInfoModal === 'function') {
    showInfoModal('Skill Based Gameplay', 'Hold to grow the bridge. Release to cross. Perfect landing gives bonus points and combo multiplier. Levels get harder dynamically!');
  }
});
document.getElementById('fc-compete')?.addEventListener('click', () => {
  console.log("Compete Card Clicked");
  document.getElementById('btn-leaderboard')?.click();
});
document.getElementById('fc-own')?.addEventListener('click', () => {
  console.log("Gear Up Card Clicked");
  document.getElementById('btn-equipment')?.click();
});

document.getElementById('btn-mute-toggle')?.addEventListener('click', (e) => {
  isMuted = !isMuted;
  e.target.innerText = isMuted ? '🔇' : '🔊';
  if (!isMuted) playSound('click');
});

// Global Button Sounds
document.addEventListener('click', (e) => {
  if (e.target.tagName === 'BUTTON' || e.target.closest('.btn') || e.target.closest('.feature-card') || e.target.closest('.skin-item')) {
    playSound('click');
  }
});

function update(dt) {
  // Apply Slow Motion (System 4)
  let effectiveDt = dt;
  if (slowMoTimer > 0) {
    effectiveDt *= 0.3; // 30% speed
    slowMoTimer -= dt / 1000;
  }

  animTime += effectiveDt / 1000;

  if ([STATES.MENU, STATES.SHOP, STATES.DAILY, STATES.LEADERBOARD, STATES.ACHIEVEMENTS, STATES.GAME_OVER, STATES.GAME_WON].includes(gameState)) return;

  // SYSTEM 9: FEEDBACK - Smooth squash recovery
  character.squash += (1.0 - character.squash) * 12 * (effectiveDt / 1000);

  if (gameState === STATES.BRIDGE_GROWING) {
    bridge.length += (H * 0.8 + bridge.length * 0.5) * (effectiveDt / 1000);
    let maxL = (cameraX + W) - bridge.x; if (bridge.length > maxL) bridge.length = maxL;
  }
  else if (gameState === STATES.BRIDGE_FALLING) {
    bridge.fallTime += (effectiveDt / 1000);
    let t = Math.min(bridge.fallTime / 0.4, 1.0); // Faster fall (0.4s)
    let easeOutCubic = 1 - Math.pow(1 - t, 3);
    bridge.angle = easeOutCubic * (Math.PI / 2);
    if (t >= 1.0) { bridge.angle = Math.PI / 2; checkLanding(); }
  }
  else if (gameState === STATES.CHARACTER_WALKING) {
    character.x += (W * 0.45) * (effectiveDt / 1000);
    let targetX;
    if (success) {
      const nextP = platforms[currentPlatformIndex + 1];
      targetX = nextP.x + nextP.w - character.size * 1.5;
      if (character.x >= targetX) {
        character.x = targetX;
        gameState = STATES.SUCCESS_TRANSITION;
        currentPlatformIndex++;
        targetCameraX = platforms[currentPlatformIndex].x - W * 0.1;
        generatePlatform();
      }
    } else {
      targetX = bridge.x + bridge.length;
      if (character.x >= targetX) {
        character.x = targetX;
        gameState = STATES.FALLING_DOWN;
      }
    }
  }
  else if (gameState === STATES.SUCCESS_TRANSITION) {
    let camSpeed = (targetCameraX - cameraX) * 10 * (effectiveDt / 1000); cameraX += camSpeed;
    if (Math.abs(targetCameraX - cameraX) < 1) {
      cameraX = targetCameraX;
      resetBridge(); gameState = STATES.PLAYING;
    }
  }
  else if (gameState === STATES.FALLING_DOWN) {
    character.y += (H * 1.2) * (effectiveDt / 1000); character.rotation += (effectiveDt / 1000) * Math.PI * 3; bridge.angle += (effectiveDt / 1000) * Math.PI * 2;
    if (character.y > H + character.size * 2) { triggerGameOver(); }
  }

  if (scaleAmount > 1.0) { scaleAmount -= effectiveDt / 1000; if (scaleAmount < 1.0) scaleAmount = 1.0; }
}

function drawBackground() {
  const bIdx = Math.min(level - 1, BIOMES.length - 1);
  const b = BIOMES[bIdx];
  let groundY = H - platformHeight;

  // Layer 0: Sky
  let g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, b.skyTop); g.addColorStop(1, b.skyBot);
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);

  // Layer 0.5: Celestials
  ctx.save();
  ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
  if ([0, 2, 3, 4, 5, 7, 8, 9].includes(bIdx)) {
    for (let i = 0; i < 100; i++) {
      let sx = ((i * 123) - cameraX * 0.01) % W; if (sx < 0) sx += W;
      let sy = (i * 47) % (groundY);
      let size = Math.abs(Math.sin(i)) * 2;
      ctx.fillRect(sx, sy, size, size);
    }
  }

  if (bIdx === 3 || bIdx === 8) { // Planet
    let px = (W * 0.7 - cameraX * 0.05) % (W * 1.5); if (px < -200) px += W * 1.5;
    ctx.beginPath(); ctx.arc(px, H * 0.3, 120, 0, Math.PI * 2);
    ctx.fillStyle = bIdx === 3 ? '#9d4edd' : '#7f1d1d'; ctx.fill();
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.beginPath(); ctx.arc(px - 30, H * 0.3 + 30, 120, 0, Math.PI * 2); ctx.fill();
  } else if (bIdx === 1 || bIdx === 6 || bIdx === 4) { // Sun
    let px = (W * 0.3 - cameraX * 0.05) % (W * 1.5); if (px < -200) px += W * 1.5;
    ctx.beginPath(); ctx.arc(px, H * 0.4, 80, 0, Math.PI * 2);
    if (bIdx === 4) {
      // Synthwave sun
      let sunG = ctx.createLinearGradient(0, H * 0.4 - 80, 0, H * 0.4 + 80);
      sunG.addColorStop(0, '#f97316'); sunG.addColorStop(1, '#ec4899');
      ctx.fillStyle = sunG; ctx.fill();
      ctx.fillStyle = b.skyBot;
      for (let i = 0; i < 5; i++) ctx.fillRect(px - 80, H * 0.4 + i * 15, 160, 4 + i);
    } else {
      ctx.fillStyle = bIdx === 1 ? '#ffb703' : '#fef08a'; ctx.fill();
    }
  }
  ctx.restore();

  // Helper for Parallax Loops
  function drawLayer(speedFactor, gap, drawFn) {
    let speed = cameraX * speedFactor;
    let num = Math.ceil(W / gap) + 2;
    let start = Math.floor(speed / gap) * gap;
    for (let i = 0; i < num; i++) {
      let x = (start + i * gap) - speed;
      let rand = Math.abs(Math.sin((start + i * gap) * 0.1));
      let rand2 = Math.abs(Math.cos((start + i * gap) * 0.13));
      ctx.save();
      ctx.translate(x, groundY);
      drawFn(rand, rand2, x, start + i * gap);
      ctx.restore();
    }
  }

  // BIOME SPECIFIC DRAWING
  if (bIdx === 0) { // GREEN HILLS
    drawLayer(0.15, W * 0.5, (r) => { ctx.fillStyle = b.mtn1; ctx.beginPath(); ctx.ellipse(0, 0, W * 0.4, H * 0.3 + r * H * 0.1, 0, Math.PI, 0); ctx.fill(); });
    drawLayer(0.30, W * 0.35, (r) => { ctx.fillStyle = b.mtn2; ctx.beginPath(); ctx.ellipse(0, 0, W * 0.3, H * 0.2 + r * H * 0.1, 0, Math.PI, 0); ctx.fill(); });
    drawLayer(0.45, W * 0.15, (r, r2) => {
      let th = 80 + r * 60;
      ctx.fillStyle = '#1e293b'; ctx.fillRect(-4, -20, 8, 20); // trunk
      ctx.fillStyle = '#0f766e';
      ctx.beginPath(); ctx.moveTo(0, -th); ctx.lineTo(-25 - r2 * 10, -20); ctx.lineTo(25 + r2 * 10, -20); ctx.fill();
      ctx.fillStyle = '#047857';
      ctx.beginPath(); ctx.moveTo(0, -th); ctx.lineTo(-20 - r2 * 10, -th * 0.4); ctx.lineTo(20 + r2 * 10, -th * 0.4); ctx.fill();
    });
  }
  else if (bIdx === 1) { // SUNSET MOUNTAIN
    drawLayer(0.15, W * 0.4, (r) => { ctx.fillStyle = b.mtn1; ctx.beginPath(); ctx.moveTo(-W * 0.3, 0); ctx.lineTo(0, -H * 0.4 - r * H * 0.2); ctx.lineTo(W * 0.3, 0); ctx.fill(); });
    drawLayer(0.30, W * 0.25, (r) => { ctx.fillStyle = b.mtn2; ctx.beginPath(); ctx.moveTo(-W * 0.2, 0); ctx.lineTo(0, -H * 0.25 - r * H * 0.15); ctx.lineTo(W * 0.2, 0); ctx.fill(); });
  }
  else if (bIdx === 2) { // NEON CITY
    drawLayer(0.15, 120, (r, r2) => {
      ctx.fillStyle = b.mtn1; let h = 100 + r * 200; let w = 60 + r2 * 40;
      ctx.fillRect(-w / 2, -h, w, h);
    });
    drawLayer(0.30, 150, (r, r2) => {
      ctx.fillStyle = b.mtn2; let h = 80 + r * 150; let w = 50 + r2 * 30;
      ctx.fillRect(-w / 2, -h, w, h);
    });
    drawLayer(0.45, 200, (r, r2) => {
      ctx.fillStyle = '#020617'; let h = 150 + r * 150; let w = 80 + r2 * 40;
      ctx.fillRect(-w / 2, -h, w, h);
      ctx.fillStyle = b.platTop;
      for (let y = 20; y < h - 20; y += 25) {
        if (r2 > 0.5) ctx.fillRect(-w / 2 + 10, -h + y, w - 20, 10);
        else { ctx.fillRect(-w / 2 + 10, -h + y, 15, 15); ctx.fillRect(w / 2 - 25, -h + y, 15, 15); }
      }
    });
  }
  else if (bIdx === 3) { // SPACE STATION
    drawLayer(0.15, 300, (r) => { ctx.fillStyle = '#1e293b'; ctx.fillRect(-20, -H, 40, H); ctx.fillRect(-150, -H * 0.8, 300, 20); });
    drawLayer(0.30, 200, (r) => { ctx.fillStyle = '#0f172a'; ctx.beginPath(); ctx.moveTo(-30, 0); ctx.lineTo(-20, -H); ctx.lineTo(20, -H); ctx.lineTo(30, 0); ctx.fill(); });
    drawLayer(0.45, 250, (r, r2) => {
      ctx.fillStyle = '#334155'; ctx.fillRect(-40, -80 - r * 40, 80, 80 + r * 40);
      ctx.fillStyle = '#0284c7'; ctx.fillRect(-30, -70 - r * 40, 60, 40);
      ctx.fillStyle = '#ffffff'; ctx.font = "bold 14px 'Nunito'"; ctx.fillText("BASED", -22, -45 - r * 40);
    });
  }
  else if (bIdx === 4) { // CYBER GRID
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)'; ctx.fillRect(0, groundY, W, H - groundY);
    drawLayer(0.15, 100, (r) => { ctx.fillStyle = b.mtn1; ctx.fillRect(-2, -H, 4, H); }); // Vertical grid lines
    drawLayer(0.30, 200, (r, r2) => {
      ctx.fillStyle = b.mtn2; let h = 100 + r * 150;
      ctx.fillRect(-15, -h, 30, h);
      ctx.fillStyle = b.platTop; ctx.fillRect(-5, -h - 20, 10, 20);
    });
  }
  else if (bIdx === 5) { // DEEP FOREST
    ctx.fillStyle = 'rgba(0, 10, 5, 0.7)'; ctx.fillRect(0, groundY, W, H - groundY);
    drawLayer(0.15, 150, (r) => { ctx.fillStyle = b.mtn1; ctx.fillRect(-15, -H, 30, H); ctx.beginPath(); ctx.arc(0, -H * 0.6 + r * 50, 80, 0, Math.PI * 2); ctx.fill(); });
    drawLayer(0.30, 200, (r, r2) => { ctx.fillStyle = b.mtn2; ctx.fillRect(-25, -H, 50, H); ctx.beginPath(); ctx.ellipse(0, -H * 0.7, 120, 80 + r * 40, 0, Math.PI, 0); ctx.fill(); });
    drawLayer(0.45, W * 0.2, (r, r2) => {
      let th = 100 + r * 80;
      ctx.fillStyle = '#1e293b'; ctx.fillRect(-6, -20, 12, 20); // trunk
      ctx.fillStyle = '#064e3b';
      ctx.beginPath(); ctx.moveTo(0, -th); ctx.lineTo(-30 - r2 * 10, -20); ctx.lineTo(30 + r2 * 10, -20); ctx.fill();
      ctx.fillStyle = '#065f46';
      ctx.beginPath(); ctx.moveTo(0, -th); ctx.lineTo(-25 - r2 * 10, -th * 0.4); ctx.lineTo(25 + r2 * 10, -th * 0.4); ctx.fill();
    });
  }
  else if (bIdx === 6) { // BARREN DESERT
    drawLayer(0.15, W * 0.5, (r) => { ctx.fillStyle = b.mtn1; ctx.beginPath(); ctx.moveTo(-W * 0.3, 0); ctx.quadraticCurveTo(0, -H * 0.3 - r * H * 0.1, W * 0.3, 0); ctx.fill(); });
    drawLayer(0.30, W * 0.3, (r) => { ctx.fillStyle = b.mtn2; ctx.beginPath(); ctx.moveTo(-W * 0.2, 0); ctx.quadraticCurveTo(0, -H * 0.2 - r * H * 0.1, W * 0.2, 0); ctx.fill(); });
    drawLayer(0.45, 180, (r, r2) => {
      ctx.fillStyle = '#065f46'; let ch = 60 + r * 60;
      ctx.beginPath(); ctx.roundRect(-8, -ch, 16, ch, 8); ctx.fill();
      if (r > 0.3) { ctx.beginPath(); ctx.roundRect(-24, -ch + 20, 16, 8, 4); ctx.fill(); ctx.beginPath(); ctx.roundRect(-24, -ch + 10, 8, 18, 4); ctx.fill(); }
      if (r2 > 0.3) { ctx.beginPath(); ctx.roundRect(8, -ch + 30, 20, 8, 4); ctx.fill(); ctx.beginPath(); ctx.roundRect(20, -ch + 15, 8, 23, 4); ctx.fill(); }
    });
  }
  else if (bIdx === 7) { // FLOATING RUINS
    ctx.fillStyle = 'rgba(10, 0, 25, 0.6)'; ctx.fillRect(0, groundY, W, H - groundY);
    drawLayer(0.15, 300, (r, r2) => { ctx.fillStyle = b.mtn1; ctx.beginPath(); ctx.ellipse(0, -H * 0.5 - r * 100, 80 + r2 * 40, 40 + r * 20, 0, 0, Math.PI * 2); ctx.fill(); });
    drawLayer(0.30, 250, (r, r2) => { ctx.fillStyle = b.mtn2; ctx.beginPath(); ctx.ellipse(0, -H * 0.3 - r2 * 100, 60 + r * 20, 30 + r2 * 10, 0, 0, Math.PI * 2); ctx.fill(); });
    drawLayer(0.45, 180, (r, r2) => {
      let th = 50 + r * 30;
      ctx.fillStyle = '#4a044e'; ctx.fillRect(-4, -th, 8, th); // trunk
      ctx.fillStyle = b.platTop;
      ctx.beginPath(); ctx.arc(0, -th, 20 + r2 * 10, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(-15, -th + 10, 15 + r * 5, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(15, -th + 10, 15 + r * 5, 0, Math.PI * 2); ctx.fill();
    });
  }
  else if (bIdx === 8) { // LAVA WORLD
    drawLayer(0.15, W * 0.4, (r) => {
      ctx.fillStyle = b.mtn1;
      ctx.beginPath(); ctx.moveTo(-W * 0.2, 0); ctx.lineTo(-20, -H * 0.4 - r * 100); ctx.lineTo(20, -H * 0.4 - r * 100); ctx.lineTo(W * 0.2, 0); ctx.fill();
      ctx.fillStyle = '#ef4444';
      ctx.beginPath(); ctx.moveTo(-15, -H * 0.4 - r * 100); ctx.lineTo(0, -H * 0.3 - r * 80); ctx.lineTo(15, -H * 0.4 - r * 100); ctx.fill();
    });
    drawLayer(0.30, W * 0.3, (r) => {
      ctx.fillStyle = b.mtn2;
      ctx.beginPath(); ctx.moveTo(-W * 0.15, 0); ctx.lineTo(-10, -H * 0.2 - r * 50); ctx.lineTo(10, -H * 0.2 - r * 50); ctx.lineTo(W * 0.15, 0); ctx.fill();
      ctx.fillStyle = '#f97316';
      ctx.beginPath(); ctx.moveTo(-8, -H * 0.2 - r * 50); ctx.lineTo(0, -H * 0.1 - r * 40); ctx.lineTo(8, -H * 0.2 - r * 50); ctx.fill();
    });
  }
  else if (bIdx === 9) { // BASE HQ
    drawLayer(0.15, 400, (r) => { ctx.fillStyle = b.mtn1; ctx.fillRect(-40, -H, 80, H); ctx.fillStyle = '#0052ff'; ctx.fillRect(-20, -H, 40, H); });
    drawLayer(0.30, 300, (r, r2) => { ctx.fillStyle = b.mtn2; ctx.beginPath(); ctx.moveTo(-50, 0); ctx.lineTo(0, -H); ctx.lineTo(50, 0); ctx.fill(); });
  }
}

let lastDt = 16;
function draw() {
  ctx.save();
  if (scaleAmount > 1.0) { ctx.translate(W / 2, H / 2); ctx.scale(scaleAmount, scaleAmount); ctx.translate(-W / 2, -H / 2); }
  if (shakeAmount > 0) { ctx.translate((Math.random() - 0.5) * shakeAmount, (Math.random() - 0.5) * shakeAmount); shakeAmount *= 0.9; if (shakeAmount < 0.5) shakeAmount = 0; }

  drawBackground();

  ctx.save();
  ctx.translate(-cameraX, 0);

  const bIdx = Math.min(level - 1, BIOMES.length - 1);
  const b = BIOMES[bIdx];

  for (let i = 0; i < platforms.length; i++) {
    const p = platforms[i];
    if (p.x + p.w < cameraX - 200) continue;
    if (p.x > cameraX + W + 200) break;

    let dG = ctx.createLinearGradient(0, H - platformHeight, 0, H);
    dG.addColorStop(0, b.platTop); dG.addColorStop(1, b.platDirt);
    ctx.fillStyle = dG;
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(p.x, H - platformHeight, p.w, platformHeight, [8, 8, 20, 20]);
    else ctx.fillRect(p.x, H - platformHeight, p.w, platformHeight);
    ctx.fill();

    ctx.strokeStyle = 'rgba(0,0,0,0.3)'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(p.x + 10, H - platformHeight + 40); ctx.lineTo(p.x + p.w - 10, H - platformHeight + 50); ctx.stroke();

    ctx.fillStyle = b.platTop;
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(p.x - 4, H - platformHeight, p.w + 8, 24, [10, 10, 4, 4]);
    else ctx.fillRect(p.x - 4, H - platformHeight, p.w + 8, 24);
    ctx.fill();

    ctx.fillStyle = 'rgba(255,255,255,0.2)';
    ctx.fillRect(p.x - 2, H - platformHeight + 2, p.w + 4, 6);

    // Draw Centered White Perfect Zone
    if (i > 0) {
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = '#ffffff';
      ctx.shadowBlur = 15;
      let basePerfectRatio = 0.20;
      let shrinkFactor = Math.max(0.05, basePerfectRatio - (level * 0.015));
      const perfectW = Math.max(10, p.w * shrinkFactor);
      const perfectX = p.x + (p.w / 2) - (perfectW / 2);
      ctx.fillRect(perfectX, H - platformHeight - 5, perfectW, 5);
      ctx.shadowBlur = 0;
    }

    if (p.bridgeL) {
      const bColor = BIOMES[Math.min(level - 1, BIOMES.length - 1)].platTop;
      ctx.save(); ctx.translate(p.x + p.w, H - platformHeight); ctx.rotate(Math.PI / 2);
      ctx.fillStyle = '#111'; ctx.fillRect(0, -p.bridgeL, bridge.thickness, p.bridgeL);
      ctx.setLineDash([10, 5]); ctx.strokeStyle = bColor; ctx.lineWidth = 2; ctx.strokeRect(0, -p.bridgeL, bridge.thickness, p.bridgeL);
      ctx.restore();
    }
  }

  if (gameState !== STATES.PLAYING || bridge.length > 0) {
    const bColor = BIOMES[Math.min(level - 1, BIOMES.length - 1)].platTop;
    ctx.save(); ctx.translate(bridge.x, bridge.y); ctx.rotate(bridge.angle);
    ctx.fillStyle = '#111'; ctx.fillRect(0, -bridge.length, bridge.thickness, bridge.length);
    ctx.setLineDash([10, 5]); ctx.strokeStyle = bColor; ctx.lineWidth = 2; ctx.strokeRect(0, -bridge.length, bridge.thickness, bridge.length);
    ctx.restore();
  }

  // Render character
  ctx.save();
  ctx.translate(character.x + character.size / 2, character.y);
  ctx.rotate(character.rotation);
  let state = 'IDLE';
  if (gameState === STATES.CHARACTER_WALKING && success) state = 'WALK';
  if (gameState === STATES.FALLING_DOWN || gameState === STATES.BRIDGE_GROWING) state = 'IDLE';
  if (gameState === STATES.BRIDGE_FALLING) state = 'JUMP'; // Preview jump pose

  renderSkeleton(ctx, currentSkin, equippedHat, equippedCape, equippedWeapon, equippedFace, character.size, state, animTime);
  ctx.restore();

  for (let i = particles.length - 1; i >= 0; i--) {
    let p = particles[i]; p.x += p.vx; p.y += p.vy; p.vy += 0.8; p.life -= lastDt / 1000;
    if (p.life <= 0) { particles.splice(i, 1); continue; }
    ctx.fillStyle = p.color; ctx.globalAlpha = Math.max(0, p.life);
    ctx.beginPath(); ctx.arc(p.x, p.y, 4, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1.0;
  }

  ctx.restore(); // camera
  ctx.restore(); // shake & scale
}

function drawPreviewCanvas() {
  if (!previewActiveItem) return;
  prevCtx.clearRect(0, 0, prevCanvas.width, prevCanvas.height);

  let prevSkin = 'classic'; let prevHat = equippedHat; let prevCape = equippedCape; let prevWpn = equippedWeapon; let prevFace = equippedFace;
  if (previewActiveItem.type === 'skin') prevSkin = previewActiveItem.id;
  if (previewActiveItem.type === 'hat') {
    if (previewActiveItem.id === 'cape') prevCape = 'cape';
    else prevHat = previewActiveItem.id;
  }
  if (previewActiveItem.type === 'weapon') prevWpn = previewActiveItem.id;
  if (previewActiveItem.type === 'face') prevFace = previewActiveItem.id;

  // Determine matching biome
  let bIdx = 0;
  if (prevSkin === 'ninja') bIdx = 1;
  else if (prevSkin === 'cyber') bIdx = 2;
  else if (prevSkin === 'gold') bIdx = 3;
  else if (prevSkin === 'troop') bIdx = 4;
  else if (prevSkin === 'galaxy') bIdx = 5;
  const biome = BIOMES[bIdx];

  // Draw Biome Background
  let bg = prevCtx.createLinearGradient(0, 0, 0, prevCanvas.height);
  bg.addColorStop(0, biome.skyTop); bg.addColorStop(1, biome.skyBot);
  prevCtx.fillStyle = bg;
  prevCtx.fillRect(0, 0, prevCanvas.width, prevCanvas.height);

  // Draw simple mountain
  prevCtx.fillStyle = biome.mtn2;
  prevCtx.beginPath(); prevCtx.moveTo(0, prevCanvas.height); prevCtx.lineTo(prevCanvas.width / 2, prevCanvas.height / 2); prevCtx.lineTo(prevCanvas.width, prevCanvas.height); prevCtx.fill();

  prevCtx.save();
  prevCtx.translate(prevCanvas.width / 2, prevCanvas.height * 0.7);

  // draw shadow
  prevCtx.fillStyle = 'rgba(0,0,0,0.5)';
  prevCtx.beginPath(); prevCtx.ellipse(0, 0, 70, 20, 0, 0, Math.PI * 2); prevCtx.fill();

  renderSkeleton(prevCtx, prevSkin, prevHat, prevCape, prevWpn, prevFace, 120, 'IDLE', animTime);
  prevCtx.restore();
}

function loop(time) {
  const dt = time - lastTime; lastTime = time;
  if (dt > 0 && dt < 100) { lastDt = dt; update(dt); }
  draw();
  drawPreviewCanvas();
  requestAnimationFrame(loop);
}

setTimeout(() => {
  resize(); setupInitialState();
  requestAnimationFrame(time => { lastTime = time; loop(time); });
}, 100);
