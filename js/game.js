// js/game.js
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
const levelFillEl = document.getElementById('ui-level-fill');
const btnRevive = document.getElementById('btn-revive');

// --- NEW GAMEPLAY STATE ---
let reviveUsed = false;
let sessionPerfectBonus = 0;
let sessionComboBonus = 0;
let slowMoTimer = 0;
let missionProgress = { perfects: 0, score: 0, combo: 0 };
let currentGapWidth = 0; // Track for risk/reward

// Update UI top bar color
function updateBiomeUI(currentBiome) {
  const levelFill = document.getElementById('ui-level-fill');
  if(levelFill) {
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
const todayString = now.getFullYear() + '-' + (now.getMonth()+1) + '-' + now.getDate();
let lastPlayedDay = localStorage.getItem('bb_v1_last_played_day');

if (lastPlayedDay !== todayString) {
  localStorage.setItem('bb_v1_daily_games', '0');
  localStorage.setItem('bb_v1_daily_score', '0');
  localStorage.setItem('bb_v1_daily_perfects', '0');
  localStorage.setItem('bb_v1_last_played_day', todayString);
  for(let i=1; i<=10; i++) localStorage.removeItem('bb_v1_claimed_d' + i);
}

// Metrics for Achievements
function incMetric(key, amt=1) {
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
    if (missionProgress.perfects % 5 === 0) notifyMission("+1 Mission Progress (Perfects)");
  }
  if (type === 'score' && val > missionProgress.score) {
    missionProgress.score = val;
    if (val === 20) notifyMission("Mission Complete: Reach 20 Score! +50 BB");
  }
  if (type === 'combo' && val > missionProgress.combo) {
    missionProgress.combo = val;
    if (val === 3) notifyMission("Mission Complete: Get 3x Combo! +30 BB");
  }
}

function updateDailyBestScore(s) {
  let dBest = parseInt(localStorage.getItem('bb_v1_daily_score') || '0');
  if (s > dBest) localStorage.setItem('bb_v1_daily_score', s);
}

const SVG_ICONS = {
  hat_cap: `data:image/svg+xml;utf8,<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><path d="M10 65 Q50 65 90 65 L85 55 L75 40 Q50 30 25 40 Z" fill="%23e11d48"/><path d="M10 65 Q50 75 90 65" fill="none" stroke="%23be123c" stroke-width="5"/><circle cx="50" cy="35" r="5" fill="%23fff"/></svg>`,
  hat_crown: `data:image/svg+xml;utf8,<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><path d="M15 80 L25 30 L35 50 L50 20 L65 50 L75 30 L85 80 Z" fill="%23facc15"/><rect x="15" y="70" width="70" height="10" fill="%23ca8a04"/><circle cx="50" cy="35" r="5" fill="%23ef4444"/><circle cx="30" cy="45" r="4" fill="%233b82f6"/><circle cx="70" cy="45" r="4" fill="%2322c55e"/></svg>`,
  hat_halo: `data:image/svg+xml;utf8,<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><ellipse cx="50" cy="50" rx="40" ry="15" fill="none" stroke="%23fef08a" stroke-width="6" filter="drop-shadow(0 0 8px %23facc15)"/></svg>`,
  face_visor: `data:image/svg+xml;utf8,<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><path d="M10 40 L90 40 L75 60 L25 60 Z" fill="%230a192f" stroke="%2300e5ff" stroke-width="6"/><path d="M20 50 L80 50" stroke="%2300e5ff" stroke-width="6" opacity="0.8"/></svg>`,
  face_mask: `data:image/svg+xml;utf8,<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><path d="M10 40 L90 40 L80 100 Q50 110 20 100 Z" fill="%23111"/><path d="M10 40 L90 40" stroke="%23333" stroke-width="4"/><path d="M30 40 L30 100 M50 40 L50 100 M70 40 L70 100" stroke="%23222" stroke-width="2"/></svg>`,
  face_cigar: `data:image/svg+xml;utf8,<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><rect x="30" y="45" width="40" height="10" rx="3" fill="%2378350f"/><rect x="70" y="45" width="10" height="10" fill="%23f97316"/><path d="M75 45 Q80 30 90 20" fill="none" stroke="%23cbd5e1" stroke-width="4" opacity="0.7"/></svg>`,
  face_glasses: `data:image/svg+xml;utf8,<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><rect x="20" y="40" width="25" height="15" fill="%23111"/><rect x="55" y="40" width="25" height="15" fill="%23111"/><path d="M45 45 L55 45" stroke="%23111" stroke-width="3"/></svg>`,
  face_beard: `data:image/svg+xml;utf8,<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><path d="M10 20 Q50 100 90 20 Q50 50 10 20 Z" fill="%23451a03"/></svg>`,
  wpn_sword: `data:image/svg+xml;utf8,<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><rect x="45" y="10" width="10" height="60" fill="%23e2e8f0"/><polygon points="45,10 50,0 55,10" fill="%23e2e8f0"/><rect x="35" y="65" width="30" height="8" fill="%23ca8a04"/><rect x="45" y="73" width="10" height="20" fill="%23451a03"/><circle cx="50" cy="95" r="6" fill="%23ca8a04"/></svg>`,
  wpn_saber: `data:image/svg+xml;utf8,<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><rect x="45" y="10" width="10" height="60" rx="5" fill="%23ef4444" filter="drop-shadow(0 0 10px %23ef4444)"/><rect x="42" y="70" width="16" height="25" fill="%2394a3b8"/><rect x="40" y="72" width="20" height="4" fill="%23334155"/><rect x="40" y="78" width="20" height="4" fill="%23334155"/></svg>`
};
let loadedIcons = {};
for(let k in SVG_ICONS) { const img = new Image(); img.src = SVG_ICONS[k]; loadedIcons[k] = img; }


// --- EQUIPMENT & SKINS SYSTEM ---
let currentSkin = 'classic';
let equippedHat = null;
let equippedWeapon = null;
let equippedFace = null;

const SHOP_DB = [
  // SKINS
  { id: 'classic', type: 'skin', name: 'Classic', rarity: 'Common', cost: 0, icon: 'classic', desc: 'A simple but polished stick hero.', colors: { body: '#111111', head: '#111111' } },
  { id: 'ninja', type: 'skin', name: 'Ninja', rarity: 'Uncommon', cost: 250, icon: 'ninja', desc: 'Stealthy assassin with a red headband.', colors: { body: '#1a1a1a', head: '#1a1a1a', face: '#eebb99', band: '#ef4444' } },
  { id: 'cyber', type: 'skin', name: 'Cyber', rarity: 'Rare', cost: 350, icon: 'cyber', desc: 'Neon glow lines pulsing with digital energy.', colors: { body: '#0f172a', head: '#0f172a', glow: '#00e5ff' } },
  { id: 'gold', type: 'skin', name: 'Gold', rarity: 'Epic', cost: 450, icon: 'gold', desc: 'Solid metallic gradient.', colors: { body: '#eab308', head: '#facc15', shine: '#fef08a' } },
  { id: 'hoodie', type: 'skin', name: 'Hoodie', rarity: 'Legendary', cost: 550, icon: 'hoodie', desc: 'Shadowed face hidden beneath a red hoodie.', colors: { body: '#e11d48', head: '#be123c', faceShadow: '#111111' } },
  { id: 'galaxy', type: 'skin', name: 'Galaxy', rarity: 'Mythic', cost: 750, icon: 'galaxy', desc: 'Contains the cosmos.', colors: { body: '#111111', head: '#000000', grad1: '#b517ff', grad2: '#00e5ff' } },
  // HATS
  { id: 'cap', type: 'hat', name: 'Baseball Cap', rarity: 'Common', cost: 50, iconId: 'hat_cap', desc: 'Keep the sun out.' },
  { id: 'crown', type: 'hat', name: 'King Crown', rarity: 'Epic', cost: 250, iconId: 'hat_crown', desc: 'Rule the bridge.' },
  { id: 'halo', type: 'hat', name: 'Halo', rarity: 'Mythic', cost: 400, iconId: 'hat_halo', desc: 'Divine protection.' },
  // WEAPONS
  { id: 'sword', type: 'weapon', name: 'Iron Sword', rarity: 'Rare', cost: 150, iconId: 'wpn_sword', desc: 'A trusty blade.' },
  { id: 'lightsaber', type: 'weapon', name: 'Plasma Sword', rarity: 'Legendary', cost: 350, iconId: 'wpn_saber', desc: 'Cuts through anything.' }
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

  if(sessions.length === 0) { 
      container.innerHTML = `<div class="lb-empty">No scores found. Be the first!</div>`; 
      return; 
  }

  let html = '';
  for(let i=0; i<Math.min(10, sessions.length); i++) {
    const s = sessions[i]; 
    let rClass = `rank-${i+1}`; if (i > 2) rClass = `rank-4`;
    let shortAddr = s.addr;
    if (shortAddr && shortAddr.length > 10) {
      shortAddr = shortAddr.substring(0, 6) + "..." + shortAddr.substring(shortAddr.length - 4);
    }
    html += `<div class="lb-row"><span class="lb-rank ${rClass}">${i+1}</span> <span class="lb-addr">${shortAddr}</span> <strong class="lb-score">${s.score}</strong></div>`;
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
    let isActive = (s.id === equippedHat || s.id === equippedWeapon || s.id === equippedFace);
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
  if(!list) return;
  list.innerHTML = '';
  
  const mGames = parseInt(localStorage.getItem('bb_v1_total_games')||'0');
  const mPerfects = parseInt(localStorage.getItem('bb_v1_total_perfects')||'0');
  const mScore = parseInt(localStorage.getItem('bb_v1_best')||'0');
  
  const dGames = parseInt(localStorage.getItem('bb_v1_daily_games')||'0');
  const dPerfects = parseInt(localStorage.getItem('bb_v1_daily_perfects')||'0');
  const dScore = parseInt(localStorage.getItem('bb_v1_daily_score')||'0');
  
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
    { id: 'g31', type: 'general', name: 'Game Completed NFT', desc: 'Finish the game! Mints a Base NFT.', target: 1, current: parseInt(localStorage.getItem('bb_v1_games_won')||'0') },

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

    // Weekly (10 Tasks)
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
            <strong>${t.name} <span class="ach-reward-tag">${t.reward ? '+'+t.reward+' BB' : ''}</span></strong>
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

window.claimAchievement = async function(id, reward, type, btnElement) {
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
  
  if (window.claimBBTokensOnchain) {
    const success = await window.claimBBTokensOnchain(reward);
    if (!success) {
      if (btnElement) {
        btnElement.innerHTML = originalHTML;
        btnElement.style.pointerEvents = 'auto';
        btnElement.style.filter = '';
      }
      return; 
    }
  }
  
  localStorage.setItem('bb_v1_claimed_' + id, 'true');
  
  // Give coins
  let coins = parseInt(localStorage.getItem('bb_v1_coins') || '0');
  coins += reward;
  localStorage.setItem('bb_v1_coins', coins);
  
  const uiCoins = document.getElementById('ui-coins');
  if(uiCoins) uiCoins.innerText = coins;
  
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
    if (item.type === 'hat' && item.id === equippedHat) isEq = true;
    if (item.type === 'weapon' && item.id === equippedWeapon) isEq = true;
    if (item.type === 'face' && item.id === equippedFace) isEq = true;

    if(isEq && item.type !== 'skin') { // Cannot unequip skin completely
      btn.innerText = "UNEQUIP";
      btn.classList.replace('btn-green', 'btn-gray');
      btn.onclick = () => {
        if(item.type === 'hat') equippedHat = null;
        if(item.type === 'weapon') equippedWeapon = null;
        if(item.type === 'face') equippedFace = null;
        renderSkinsShop();
        if(item.type === 'skin') closeModals(); else backToShop();
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
        if(item.type === 'skin') currentSkin = id;
        if(item.type === 'hat') equippedHat = id;
        if(item.type === 'weapon') equippedWeapon = id;
        if(item.type === 'face') equippedFace = id;
        renderSkinsShop();
        if(item.type === 'skin') closeModals(); else backToShop();
      };
    }
  } else {
    document.getElementById('preview-cost').innerText = item.cost;
    btn.innerText = "BUY & EQUIP";
    btn.classList.replace('btn-gray', 'btn-green');
    if (coins >= item.cost) {
      btn.disabled = false;
      btn.onclick = () => {
        coins -= item.cost; localStorage.setItem('bb_v1_coins', coins); uiCoinsEl.innerText = coins;
        ownedItems.push(id); localStorage.setItem('bb_v1_owned', JSON.stringify(ownedItems));
        
        if(item.type === 'skin') currentSkin = id;
        if(item.type === 'hat') equippedHat = id;
        if(item.type === 'weapon') equippedWeapon = id;
        if(item.type === 'face') equippedFace = id;

        renderSkinsShop();
        if(item.type === 'skin') closeModals(); else backToShop();
      };
    } else {
      btn.innerText = "INSUFFICIENT BB";
      btn.classList.replace('btn-green', 'btn-gray');
      btn.disabled = true;
      btn.onclick = null;
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
function renderSkeleton(targetCtx, skinId, hatId, wpnId, faceId, s, state, time) {
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
  targetCtx.translate(0, -s + bounceY);
  targetCtx.scale(1.0 + (1.0 - character.squash)*0.5, character.squash);
  const id = skinData.id;
  const colors = skinData.colors;

  // Back Arm & Leg
  drawLimbPath(targetCtx, -s*0.1, s*0.6, s*0.15, s*0.4, legAngle2, colors.body || '#222', true);
  drawLimbPath(targetCtx, 0, s*0.3, s*0.12, s*0.35, armAngle2, colors.body || '#222', true, null);

  // Body Path Details
  if (id === 'gold') {
    let g = targetCtx.createLinearGradient(0, s*0.2, 0, s*0.7); 
    g.addColorStop(0, '#fef08a'); g.addColorStop(0.3, '#eab308'); 
    g.addColorStop(0.7, '#a16207'); g.addColorStop(1, '#422006');
    targetCtx.fillStyle = g;
    targetCtx.shadowColor = '#eab308'; targetCtx.shadowBlur = 15;
  } else if (id === 'galaxy') {
    let g = targetCtx.createRadialGradient(0,s*0.4,0, 0,s*0.4,s*0.5); 
    g.addColorStop(0, '#b517ff'); g.addColorStop(0.5, '#6b21a8'); g.addColorStop(1, '#00e5ff');
    targetCtx.fillStyle = g;
    targetCtx.shadowColor = '#00e5ff'; targetCtx.shadowBlur = 15;
  } else if (id === 'hoodie') {
    targetCtx.fillStyle = '#e11d48';
  } else if (id === 'cyber') {
    targetCtx.fillStyle = '#0891b2';
  } else {
    targetCtx.fillStyle = colors.body || '#111';
  }
  
  targetCtx.beginPath();
  targetCtx.moveTo(-s*0.2, s*0.3);
  targetCtx.quadraticCurveTo(-s*0.25, s*0.5, -s*0.15, s*0.7);
  targetCtx.lineTo(s*0.15, s*0.7);
  targetCtx.quadraticCurveTo(s*0.25, s*0.5, s*0.2, s*0.3);
  targetCtx.fill();
  
  // Subtle body details
  if (id === 'classic' || id === 'ninja') {
    let highlight = targetCtx.createLinearGradient(-s*0.2, s*0.3, s*0.2, s*0.7);
    highlight.addColorStop(0, 'rgba(255,255,255,0.15)'); highlight.addColorStop(1, 'transparent');
    targetCtx.fillStyle = highlight;
    targetCtx.fill();
  }

  targetCtx.shadowBlur = 0;

  if (id === 'galaxy') {
    targetCtx.fillStyle = '#fff';
    for(let i=0; i<8; i++) {
      targetCtx.beginPath(); 
      targetCtx.arc((Math.random()-0.5)*s*0.3, s*0.3 + Math.random()*s*0.4, Math.random()*s*0.03, 0, Math.PI*2); 
      targetCtx.fill();
    }
    targetCtx.strokeStyle = 'rgba(255,255,255,0.4)'; targetCtx.lineWidth=1;
    targetCtx.beginPath(); targetCtx.arc(0, s*0.5, s*0.15, 0, Math.PI*2); targetCtx.stroke();
  }

  if (id === 'cyber') {
    targetCtx.shadowColor = colors.glow; targetCtx.shadowBlur = 10;
    targetCtx.strokeStyle = colors.glow; targetCtx.lineWidth = 2;
    targetCtx.beginPath(); targetCtx.moveTo(-s*0.1, s*0.4); targetCtx.lineTo(0, s*0.5); targetCtx.lineTo(-s*0.05, s*0.6); targetCtx.stroke();
    targetCtx.shadowBlur = 0;
  }
  
  if (id === 'hoodie') {
    targetCtx.strokeStyle = '#9f1239'; targetCtx.lineWidth = 3;
    targetCtx.beginPath(); targetCtx.moveTo(0, s*0.3); targetCtx.lineTo(0, s*0.6); targetCtx.stroke();
  }

  // Head Path
  targetCtx.save();
  if (id === 'hoodie') {
    targetCtx.fillStyle = colors.head;
    targetCtx.beginPath(); targetCtx.arc(0, s*0.2, s*0.35, Math.PI, 0); targetCtx.fill();
    targetCtx.fillRect(-s*0.35, s*0.2, s*0.7, s*0.2);
    targetCtx.fillStyle = colors.faceShadow;
    targetCtx.beginPath(); targetCtx.arc(s*0.1, s*0.3, s*0.2, 0, Math.PI*2); targetCtx.fill();
  } else {
    targetCtx.fillStyle = colors.head || '#111';
    if(id==='galaxy') targetCtx.fillStyle = '#000';
    targetCtx.beginPath(); targetCtx.arc(0, s*0.2, s*0.3, 0, Math.PI*2); targetCtx.fill();
  }

  // Eyes
  if (id === 'gold' || id === 'galaxy' || id === 'classic' || id === 'hoodie') {
    if (id === 'gold' || id === 'galaxy' || id === 'classic') {
      targetCtx.fillStyle = (id === 'gold') ? '#111' : '#fff';
      targetCtx.beginPath(); targetCtx.arc(s*0.15, s*0.15, s*0.05, 0, Math.PI*2); targetCtx.fill();
    }
    // Hoodie has no eyes (face shadow only)
  } else if (id === 'ninja') {
    targetCtx.fillStyle = colors.face;
    targetCtx.beginPath(); targetCtx.ellipse(s*0.1, s*0.2, s*0.15, s*0.1, 0, 0, Math.PI*2); targetCtx.fill();
    targetCtx.fillStyle = colors.band;
    targetCtx.fillRect(-s*0.3, 0, s*0.65, s*0.12);
    // NINJA EYES (New)
    targetCtx.fillStyle = '#111';
    targetCtx.beginPath(); 
    targetCtx.arc(s*0.05, s*0.2, s*0.03, 0, Math.PI*2); 
    targetCtx.arc(s*0.15, s*0.2, s*0.03, 0, Math.PI*2); 
    targetCtx.fill();
  } else {
    targetCtx.fillStyle = colors.face || '#fff';
    targetCtx.beginPath(); targetCtx.arc(s*0.15, s*0.2, s*0.05, 0, Math.PI*2); targetCtx.arc(s*0.3, s*0.2, s*0.05, 0, Math.PI*2); targetCtx.fill();
  }

  // Draw Equipment
  if (hatId === 'cap' && loadedIcons['hat_cap']) targetCtx.drawImage(loadedIcons['hat_cap'], -s*0.4, -s*0.3, s*0.8, s*0.5);
  if (hatId === 'crown' && loadedIcons['hat_crown']) targetCtx.drawImage(loadedIcons['hat_crown'], -s*0.45, -s*0.45, s*0.9, s*0.7);
  if (hatId === 'halo' && loadedIcons['hat_halo']) targetCtx.drawImage(loadedIcons['hat_halo'], -s*0.5, -s*0.4, s*1.0, s*0.4);
  
  if (faceId === 'glasses' && loadedIcons['face_glasses']) targetCtx.drawImage(loadedIcons['face_glasses'], -s*0.15, s*0.1, s*0.6, s*0.25);

  targetCtx.restore();

  // Front Arm & Leg (Use colors.body strictly)
  drawLimbPath(targetCtx, s*0.1, s*0.6, s*0.15, s*0.4, legAngle1, colors.body || '#111', false);
  drawLimbPath(targetCtx, 0, s*0.3, s*0.12, s*0.35, armAngle1, colors.body || '#111', false, wpnId);

  targetCtx.restore();
}

function drawLimbPath(targetCtx, x, y, w, h, angle, color, isBack, wpnId) {
  targetCtx.save();
  targetCtx.translate(x, y); targetCtx.rotate(angle);
  targetCtx.fillStyle = isBack ? shadeColor(color, -20) : color;
  targetCtx.beginPath(); targetCtx.roundRect(-w/2, 0, w, h, w/2); 
  targetCtx.fill();
  
  if (!isBack && wpnId) {
    const iconId = wpnId === 'lightsaber' ? 'wpn_saber' : 'wpn_sword';
    if (loadedIcons[iconId]) {
      targetCtx.translate(0, h);
      targetCtx.drawImage(loadedIcons[iconId], -w, -h*1.2, w*3, h*1.8);
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
  character.x = platforms[0].x + platforms[0].w - character.size*1.5;
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
  if (coins >= 50) {
    coins -= 50; localStorage.setItem('bb_v1_coins', coins); uiCoinsEl.innerText = coins;
    gameState = STATES.PLAYING;
    
    // Reset to current platform safely
    const currP = platforms[currentPlatformIndex];
    character.x = currP.x + currP.w - character.size*1.5;
    character.y = H - platformHeight;
    character.rotation = 0;
    
    resetBridge();
    document.querySelector('.gh-center').style.opacity = '1';
  gameOverOverlay.classList.add('hidden');
    btnRevive.classList.add('hidden');
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
  for(let i=0; i<50; i++) {
    particles.push({
      x: x + (Math.random()-0.5)*100, y: y, vx: (Math.random()-0.5)*25, vy: (Math.random()-1)*25, life: 1.5,
      color: ['#00ff88', '#fff', '#00e5ff', '#ff2a7a', '#facc15'][Math.floor(Math.random()*5)]
    });
  }
}

function spawnSparks(x, y) {
  for(let i=0; i<15; i++) {
    particles.push({
      x: x + (Math.random()-0.5)*10, y: y, vx: (Math.random()-0.5)*10, vy: -Math.random()*15, life: 0.6,
      color: ['#f97316', '#fbbf24', '#fff'][Math.floor(Math.random()*3)]
    });
  }
}

function addCoins(amount) { 
  coins += amount; 
  uiCoinsEl.innerText = coins; 
  localStorage.setItem('bb_v1_coins', coins); 
  playSound('coin');
  incMetric('bb_v1_total_score', amount); 
}

function checkLanding() {
  incMetric('bb_v1_total_bridges', 1);
  const nextP = platforms[currentPlatformIndex + 1];
  const bridgeTip = bridge.x + bridge.length;
  const tolerance = 5; // Pixels for near-miss
  
  // 1. SUCCESS CHECK
  if (bridgeTip >= nextP.x && bridgeTip <= nextP.x + nextP.w) {
    success = true; platforms[currentPlatformIndex].bridgeL = bridge.length; 
    
    // Perfect Zone Logic
    let basePerfectRatio = 0.20;
    let shrinkFactor = Math.max(0.05, basePerfectRatio - (level * 0.015));
    const perfectW = Math.max(10, nextP.w * shrinkFactor);
    const perfectX = nextP.x + (nextP.w / 2) - (perfectW / 2);
    
    if (bridgeTip >= perfectX && bridgeTip <= perfectX + perfectW) {
      // SYSTEM 1 & 2: PERFECT & COMBO
      perfectStreak++;
      sessionPerfects++;
      if (perfectStreak > sessionBestCombo) sessionBestCombo = perfectStreak;
      
      // Combo Rewards: 1->2, 2->4, 3->8, 4->16+
      let comboBB = Math.min(16, Math.pow(2, perfectStreak));
      sessionComboBonus += comboBB;
      
      score += 2; addCoins(comboBB); sessionCoins += comboBB; 
      shakeAmount = 15; scaleAmount = 1.05; // Feedback
      incMetric('bb_v1_total_perfects', 1);
      trackMission('perfect', 1); trackMission('combo', perfectStreak);
      spawnSparks(bridgeTip, H - platformHeight); 
      
      let msg = `PERFECT x${perfectStreak}! +${comboBB} BB`;
      perfectEl.innerText = msg; 
      perfectEl.classList.add('show'); 
      setTimeout(() => perfectEl.classList.remove('show'), 1200);
      playSound('perfect');
    } else {
      // Normal Landing
      perfectStreak = 0;
      score += 1; addCoins(1); sessionCoins += 1;
    }

    // SYSTEM 5: RISK / REWARD (Longer bridge = higher reward)
    let gapRatio = bridge.length / (W * 0.5); // Normalized gap difficulty
    if (gapRatio > 0.6) {
      let riskBonus = Math.floor(gapRatio * 5);
      if (riskBonus > 0) {
        addCoins(riskBonus); sessionCoins += riskBonus;
        console.log("Risk Bonus:", riskBonus);
      }
    }

    scoreEl.innerText = score;
    trackMission('score', score);
    
    if (score > bestScore && bestScore > 0 && !window.newRecordReached) {
      window.newRecordReached = true;
      spawnConfetti(cameraX + W/2, H/2);
      perfectEl.innerText = "NEW RECORD!"; perfectEl.style.color = '#facc15';
      perfectEl.classList.add('show'); 
      setTimeout(() => { perfectEl.classList.remove('show'); perfectEl.style.color = ''; }, 2000);
      playSound('perfect');
    }

    updateLevelUI();
    character.squash = 0.55; // Landing squash feedback
  } 
  else {
    // 2. NEAR MISS CHECK (SYSTEM 4)
    let distFromEdge = Math.min(Math.abs(bridgeTip - nextP.x), Math.abs(bridgeTip - (nextP.x + nextP.w)));
    if (distFromEdge < 15) {
      slowMoTimer = 0.35; // Trigger 0.35s slow-mo
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
  
  // SYSTEM 10: END SCREEN PSYCHOLOGY
  let psychologyMsg = "";
  if (!isNewBest) {
    let diff = bestScore - score;
    psychologyMsg = `You were just ${diff} points away from your best! Next run can beat it!`;
  } else {
    psychologyMsg = "UNBELIEVABLE! New Personal Record!";
  }
  
  // SYSTEM 3: SCORE BREAKDOWN
  document.getElementById('go-score').innerText = score;
  document.getElementById('go-best').innerText = bestScore;
  document.getElementById('go-bb').innerText = sessionCoins;
  
  // Breakdown elements (Injecting into overlay)
  const breakdownHTML = `
    <div class="breakdown-box" style="margin-top:1rem; padding:1rem; background:rgba(255,255,255,0.05); border-radius:12px; font-size:0.9rem;">
      <div style="display:flex; justify-content:space-between; margin-bottom:0.5rem;"><span>Perfects:</span> <span>${sessionPerfects}</span></div>
      <div style="display:flex; justify-content:space-between; margin-bottom:0.5rem;"><span>Combo Bonus:</span> <span>${sessionComboBonus} BB</span></div>
      <div style="display:flex; justify-content:space-between; color:#facc15;"><span>Total Earned:</span> <span>${sessionCoins} BB</span></div>
      <p style="margin-top:1rem; font-style:italic; font-size:0.8rem; color:#94a3b8;">${psychologyMsg}</p>
    </div>
  `;
  
  const statsContainer = document.querySelector('.go-stats-grid');
  if (statsContainer) {
    let existingBreakdown = statsContainer.parentElement.querySelector('.breakdown-box');
    if (existingBreakdown) existingBreakdown.remove();
    let box = document.createElement('div');
    box.className = 'breakdown-box';
    box.innerHTML = breakdownHTML;
    statsContainer.parentElement.insertBefore(box, statsContainer.nextSibling);
  }

  // SYSTEM 6: REVIVE SYSTEM (Once per run)
  if (coins >= 50 && !reviveUsed) {
    btnRevive.classList.remove('hidden');
    btnRevive.onclick = () => {
      addCoins(-50);
      reviveUsed = true;
      revivePlayer();
    };
  } else {
    btnRevive.classList.add('hidden');
  }
  
  document.querySelector('.gh-center').style.opacity = '0';
  setTimeout(() => gameOverOverlay.classList.remove('hidden'), 800);
}

function revivePlayer() {
  gameOverOverlay.classList.add('hidden');
  gameState = STATES.PLAYING;
  character.y = H - platformHeight;
  character.rotation = 0;
  cameraX = platforms[currentPlatformIndex].x - W * 0.1;
  resetBridge();
  playSound('perfect');
}

function triggerGameWon() {
  gameState = STATES.GAME_WON; 
  playSound('perfect');
  spawnConfetti(cameraX + W/2, H/2);
  
  let w = parseInt(localStorage.getItem('bb_v1_games_won') || '0');
  localStorage.setItem('bb_v1_games_won', w + 1);
  
  let isNewBest = false;
  if (score > bestScore) { bestScore = score; bestEl.innerText = bestScore; localStorage.setItem('bb_v1_best', bestScore); isNewBest = true; }
  updateDailyBestScore(score);
  
  document.querySelector('.go-title').innerText = "CONGRATULATIONS!";
  document.querySelector('.go-title').style.color = '#10b981';
  
  // Update the detailed stats
  document.getElementById('go-score').innerText = score;
  document.getElementById('go-best').innerText = bestScore;
  document.getElementById('go-bb').innerText = sessionCoins;
  document.getElementById('go-perfects').innerText = sessionPerfects;
  document.getElementById('go-combo').innerText = sessionBestCombo;
  document.getElementById('go-level').innerText = level;
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
    if(!localStorage.getItem('bb_v1_tut_done')) { localStorage.setItem('bb_v1_tut_done', 'true'); tutEl.classList.add('hidden'); }
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

document.getElementById('fc-skill')?.addEventListener('click', () => {
  if (typeof showInfoModal === 'function') {
    showInfoModal('Skill Based Gameplay', 'Hold to grow the bridge. Release to cross. Perfect landing gives bonus points and combo multiplier. Levels get harder dynamically!');
  }
});
document.getElementById('fc-daily')?.addEventListener('click', () => {
  document.getElementById('btn-achievements')?.click();
  const dailyTab = document.querySelector('.ach-tab[data-tab="daily"]');
  if (dailyTab) dailyTab.click();
});
document.getElementById('fc-compete')?.addEventListener('click', () => {
  document.getElementById('btn-leaderboard')?.click();
});
document.getElementById('fc-own')?.addEventListener('click', () => {
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
    slowMoTimer -= dt/1000;
  }
  
  animTime += effectiveDt/1000;
  
  if ([STATES.MENU, STATES.SHOP, STATES.DAILY, STATES.LEADERBOARD, STATES.ACHIEVEMENTS, STATES.GAME_OVER, STATES.GAME_WON].includes(gameState)) return;

  // SYSTEM 9: FEEDBACK - Smooth squash recovery
  character.squash += (1.0 - character.squash) * 12 * (effectiveDt/1000);

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
      targetX = nextP.x + nextP.w - character.size*1.5;
      if (character.x >= targetX) {
        character.x = targetX; gameState = STATES.SUCCESS_TRANSITION; currentPlatformIndex++;
        targetCameraX = platforms[currentPlatformIndex].x - W * 0.1; generatePlatform();
        
        // SYSTEM 8: Difficulty Scaling (Speed increase)
        if (score > 10) level = Math.floor(score / 10) + 1;
      }
    } else {
      targetX = bridge.x + bridge.length;
      if (character.x >= targetX) { character.x = targetX; gameState = STATES.FALLING_DOWN; }
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
    if (character.y > H + character.size*2) { triggerGameOver(); }
  }
  
  if (scaleAmount > 1.0) { scaleAmount -= effectiveDt / 1000; if (scaleAmount < 1.0) scaleAmount = 1.0; }
}

function drawBackground() {
  const bIdx = Math.min(level - 1, BIOMES.length - 1);
  const b = BIOMES[bIdx];
  let groundY = H - platformHeight;
  
  // Layer 0: Sky
  let g = ctx.createLinearGradient(0,0,0,H); g.addColorStop(0, b.skyTop); g.addColorStop(1, b.skyBot);
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  
  // Layer 0.5: Celestials
  ctx.save();
  ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
  if ([0,2,3,4,5,7,8,9].includes(bIdx)) {
    for(let i=0; i<100; i++) {
       let sx = ((i*123) - cameraX*0.01) % W; if(sx<0) sx+=W;
       let sy = (i*47) % (groundY);
       let size = Math.abs(Math.sin(i)) * 2;
       ctx.fillRect(sx, sy, size, size);
    }
  }
  
  if (bIdx === 3 || bIdx === 8) { // Planet
    let px = (W * 0.7 - cameraX * 0.05) % (W * 1.5); if (px < -200) px += W * 1.5;
    ctx.beginPath(); ctx.arc(px, H * 0.3, 120, 0, Math.PI * 2); 
    ctx.fillStyle = bIdx === 3 ? '#9d4edd' : '#7f1d1d'; ctx.fill();
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.beginPath(); ctx.arc(px-30, H*0.3+30, 120, 0, Math.PI*2); ctx.fill();
  } else if (bIdx === 1 || bIdx === 6 || bIdx === 4) { // Sun
    let px = (W * 0.3 - cameraX * 0.05) % (W * 1.5); if (px < -200) px += W * 1.5;
    ctx.beginPath(); ctx.arc(px, H * 0.4, 80, 0, Math.PI * 2); 
    if(bIdx === 4) {
      // Synthwave sun
      let sunG = ctx.createLinearGradient(0, H*0.4-80, 0, H*0.4+80);
      sunG.addColorStop(0, '#f97316'); sunG.addColorStop(1, '#ec4899');
      ctx.fillStyle = sunG; ctx.fill();
      ctx.fillStyle = b.skyBot;
      for(let i=0; i<5; i++) ctx.fillRect(px-80, H*0.4 + i*15, 160, 4+i);
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
    for(let i=0; i<num; i++) {
      let x = (start + i*gap) - speed;
      let rand = Math.abs(Math.sin((start + i*gap)*0.1));
      let rand2 = Math.abs(Math.cos((start + i*gap)*0.13));
      ctx.save();
      ctx.translate(x, groundY);
      drawFn(rand, rand2, x, start + i*gap);
      ctx.restore();
    }
  }

  // BIOME SPECIFIC DRAWING
  if (bIdx === 0) { // GREEN HILLS
    drawLayer(0.15, W*0.5, (r) => { ctx.fillStyle = b.mtn1; ctx.beginPath(); ctx.ellipse(0, 0, W*0.4, H*0.3 + r*H*0.1, 0, Math.PI, 0); ctx.fill(); });
    drawLayer(0.30, W*0.35, (r) => { ctx.fillStyle = b.mtn2; ctx.beginPath(); ctx.ellipse(0, 0, W*0.3, H*0.2 + r*H*0.1, 0, Math.PI, 0); ctx.fill(); });
    drawLayer(0.45, W*0.15, (r, r2) => {
      let th = 80 + r*60;
      ctx.fillStyle = '#1e293b'; ctx.fillRect(-4, -20, 8, 20); // trunk
      ctx.fillStyle = '#0f766e';
      ctx.beginPath(); ctx.moveTo(0, -th); ctx.lineTo(-25-r2*10, -20); ctx.lineTo(25+r2*10, -20); ctx.fill();
      ctx.fillStyle = '#047857';
      ctx.beginPath(); ctx.moveTo(0, -th); ctx.lineTo(-20-r2*10, -th*0.4); ctx.lineTo(20+r2*10, -th*0.4); ctx.fill();
    });
  } 
  else if (bIdx === 1) { // SUNSET MOUNTAIN
    drawLayer(0.15, W*0.4, (r) => { ctx.fillStyle = b.mtn1; ctx.beginPath(); ctx.moveTo(-W*0.3, 0); ctx.lineTo(0, -H*0.4 - r*H*0.2); ctx.lineTo(W*0.3, 0); ctx.fill(); });
    drawLayer(0.30, W*0.25, (r) => { ctx.fillStyle = b.mtn2; ctx.beginPath(); ctx.moveTo(-W*0.2, 0); ctx.lineTo(0, -H*0.25 - r*H*0.15); ctx.lineTo(W*0.2, 0); ctx.fill(); });
  }
  else if (bIdx === 2) { // NEON CITY
    drawLayer(0.15, 120, (r, r2) => { 
      ctx.fillStyle = b.mtn1; let h = 100+r*200; let w = 60+r2*40; 
      ctx.fillRect(-w/2, -h, w, h); 
    });
    drawLayer(0.30, 150, (r, r2) => { 
      ctx.fillStyle = b.mtn2; let h = 80+r*150; let w = 50+r2*30; 
      ctx.fillRect(-w/2, -h, w, h); 
    });
    drawLayer(0.45, 200, (r, r2) => { 
      ctx.fillStyle = '#020617'; let h = 150+r*150; let w = 80+r2*40; 
      ctx.fillRect(-w/2, -h, w, h);
      ctx.fillStyle = b.platTop;
      for(let y=20; y<h-20; y+=25) {
        if(r2 > 0.5) ctx.fillRect(-w/2+10, -h+y, w-20, 10);
        else { ctx.fillRect(-w/2+10, -h+y, 15, 15); ctx.fillRect(w/2-25, -h+y, 15, 15); }
      }
    });
  }
  else if (bIdx === 3) { // SPACE STATION
    drawLayer(0.15, 300, (r) => { ctx.fillStyle = '#1e293b'; ctx.fillRect(-20, -H, 40, H); ctx.fillRect(-150, -H*0.8, 300, 20); });
    drawLayer(0.30, 200, (r) => { ctx.fillStyle = '#0f172a'; ctx.beginPath(); ctx.moveTo(-30,0); ctx.lineTo(-20,-H); ctx.lineTo(20,-H); ctx.lineTo(30,0); ctx.fill(); });
    drawLayer(0.45, 250, (r, r2) => { 
      ctx.fillStyle = '#334155'; ctx.fillRect(-40, -80-r*40, 80, 80+r*40);
      ctx.fillStyle = '#0284c7'; ctx.fillRect(-30, -70-r*40, 60, 40);
      ctx.fillStyle = '#ffffff'; ctx.font = "bold 14px 'Nunito'"; ctx.fillText("BASED", -22, -45-r*40);
    });
  }
  else if (bIdx === 4) { // CYBER GRID
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)'; ctx.fillRect(0, groundY, W, H - groundY);
    drawLayer(0.15, 100, (r) => { ctx.fillStyle = b.mtn1; ctx.fillRect(-2, -H, 4, H); }); // Vertical grid lines
    drawLayer(0.30, 200, (r, r2) => { 
      ctx.fillStyle = b.mtn2; let h = 100+r*150;
      ctx.fillRect(-15, -h, 30, h); 
      ctx.fillStyle = b.platTop; ctx.fillRect(-5, -h-20, 10, 20);
    });
  }
  else if (bIdx === 5) { // DEEP FOREST
    ctx.fillStyle = 'rgba(0, 10, 5, 0.7)'; ctx.fillRect(0, groundY, W, H - groundY);
    drawLayer(0.15, 150, (r) => { ctx.fillStyle = b.mtn1; ctx.fillRect(-15, -H, 30, H); ctx.beginPath(); ctx.arc(0, -H*0.6+r*50, 80, 0, Math.PI*2); ctx.fill(); });
    drawLayer(0.30, 200, (r,r2) => { ctx.fillStyle = b.mtn2; ctx.fillRect(-25, -H, 50, H); ctx.beginPath(); ctx.ellipse(0, -H*0.7, 120, 80+r*40, 0, Math.PI, 0); ctx.fill(); });
    drawLayer(0.45, W*0.2, (r, r2) => {
      let th = 100 + r*80;
      ctx.fillStyle = '#1e293b'; ctx.fillRect(-6, -20, 12, 20); // trunk
      ctx.fillStyle = '#064e3b';
      ctx.beginPath(); ctx.moveTo(0, -th); ctx.lineTo(-30-r2*10, -20); ctx.lineTo(30+r2*10, -20); ctx.fill();
      ctx.fillStyle = '#065f46';
      ctx.beginPath(); ctx.moveTo(0, -th); ctx.lineTo(-25-r2*10, -th*0.4); ctx.lineTo(25+r2*10, -th*0.4); ctx.fill();
    });
  }
  else if (bIdx === 6) { // BARREN DESERT
    drawLayer(0.15, W*0.5, (r) => { ctx.fillStyle = b.mtn1; ctx.beginPath(); ctx.moveTo(-W*0.3, 0); ctx.quadraticCurveTo(0, -H*0.3 - r*H*0.1, W*0.3, 0); ctx.fill(); });
    drawLayer(0.30, W*0.3, (r) => { ctx.fillStyle = b.mtn2; ctx.beginPath(); ctx.moveTo(-W*0.2, 0); ctx.quadraticCurveTo(0, -H*0.2 - r*H*0.1, W*0.2, 0); ctx.fill(); });
    drawLayer(0.45, 180, (r, r2) => {
      ctx.fillStyle = '#065f46'; let ch = 60+r*60;
      ctx.beginPath(); ctx.roundRect(-8, -ch, 16, ch, 8); ctx.fill();
      if(r > 0.3) { ctx.beginPath(); ctx.roundRect(-24, -ch+20, 16, 8, 4); ctx.fill(); ctx.beginPath(); ctx.roundRect(-24, -ch+10, 8, 18, 4); ctx.fill(); }
      if(r2 > 0.3) { ctx.beginPath(); ctx.roundRect(8, -ch+30, 20, 8, 4); ctx.fill(); ctx.beginPath(); ctx.roundRect(20, -ch+15, 8, 23, 4); ctx.fill(); }
    });
  }
  else if (bIdx === 7) { // FLOATING RUINS
    ctx.fillStyle = 'rgba(10, 0, 25, 0.6)'; ctx.fillRect(0, groundY, W, H - groundY);
    drawLayer(0.15, 300, (r, r2) => { ctx.fillStyle = b.mtn1; ctx.beginPath(); ctx.ellipse(0, -H*0.5-r*100, 80+r2*40, 40+r*20, 0, 0, Math.PI*2); ctx.fill(); });
    drawLayer(0.30, 250, (r, r2) => { ctx.fillStyle = b.mtn2; ctx.beginPath(); ctx.ellipse(0, -H*0.3-r2*100, 60+r*20, 30+r2*10, 0, 0, Math.PI*2); ctx.fill(); });
    drawLayer(0.45, 180, (r, r2) => {
      let th = 50 + r*30;
      ctx.fillStyle = '#4a044e'; ctx.fillRect(-4, -th, 8, th); // trunk
      ctx.fillStyle = b.platTop;
      ctx.beginPath(); ctx.arc(0, -th, 20+r2*10, 0, Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.arc(-15, -th+10, 15+r*5, 0, Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.arc(15, -th+10, 15+r*5, 0, Math.PI*2); ctx.fill();
    });
  }
  else if (bIdx === 8) { // LAVA WORLD
    drawLayer(0.15, W*0.4, (r) => { 
      ctx.fillStyle = b.mtn1; 
      ctx.beginPath(); ctx.moveTo(-W*0.2, 0); ctx.lineTo(-20, -H*0.4-r*100); ctx.lineTo(20, -H*0.4-r*100); ctx.lineTo(W*0.2, 0); ctx.fill(); 
      ctx.fillStyle = '#ef4444';
      ctx.beginPath(); ctx.moveTo(-15, -H*0.4-r*100); ctx.lineTo(0, -H*0.3-r*80); ctx.lineTo(15, -H*0.4-r*100); ctx.fill();
    });
    drawLayer(0.30, W*0.3, (r) => { 
      ctx.fillStyle = b.mtn2; 
      ctx.beginPath(); ctx.moveTo(-W*0.15, 0); ctx.lineTo(-10, -H*0.2-r*50); ctx.lineTo(10, -H*0.2-r*50); ctx.lineTo(W*0.15, 0); ctx.fill(); 
      ctx.fillStyle = '#f97316';
      ctx.beginPath(); ctx.moveTo(-8, -H*0.2-r*50); ctx.lineTo(0, -H*0.1-r*40); ctx.lineTo(8, -H*0.2-r*50); ctx.fill();
    });
  }
  else if (bIdx === 9) { // BASE HQ
    drawLayer(0.15, 400, (r) => { ctx.fillStyle = b.mtn1; ctx.fillRect(-40, -H, 80, H); ctx.fillStyle = '#0052ff'; ctx.fillRect(-20, -H, 40, H); });
    drawLayer(0.30, 300, (r, r2) => { ctx.fillStyle = b.mtn2; ctx.beginPath(); ctx.moveTo(-50,0); ctx.lineTo(0,-H); ctx.lineTo(50,0); ctx.fill(); });
  }
}

let lastDt = 16;
function draw() {
  ctx.save();
  if (scaleAmount > 1.0) { ctx.translate(W/2, H/2); ctx.scale(scaleAmount, scaleAmount); ctx.translate(-W/2, -H/2); }
  if (shakeAmount > 0) { ctx.translate((Math.random()-0.5)*shakeAmount, (Math.random()-0.5)*shakeAmount); shakeAmount *= 0.9; if(shakeAmount < 0.5) shakeAmount = 0; }
  
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
    ctx.beginPath(); ctx.moveTo(p.x+10, H - platformHeight + 40); ctx.lineTo(p.x+p.w-10, H - platformHeight + 50); ctx.stroke();
    
    ctx.fillStyle = b.platTop; 
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(p.x - 4, H - platformHeight, p.w + 8, 24, [10, 10, 4, 4]);
    else ctx.fillRect(p.x - 4, H - platformHeight, p.w + 8, 24);
    ctx.fill();
    
    ctx.fillStyle = 'rgba(255,255,255,0.2)';
    ctx.fillRect(p.x-2, H - platformHeight + 2, p.w+4, 6);
    
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
  ctx.translate(character.x + character.size/2, character.y);
  ctx.rotate(character.rotation);
  let state = 'IDLE';
  if (gameState === STATES.CHARACTER_WALKING && success) state = 'WALK';
  if (gameState === STATES.FALLING_DOWN || gameState === STATES.BRIDGE_GROWING) state = 'IDLE';
  if (gameState === STATES.BRIDGE_FALLING) state = 'JUMP'; // Preview jump pose
  
  renderSkeleton(ctx, currentSkin, equippedHat, equippedWeapon, equippedFace, character.size, state, animTime);
  ctx.restore();
  
  for(let i=particles.length-1; i>=0; i--) {
    let p = particles[i]; p.x += p.vx; p.y += p.vy; p.vy += 0.8; p.life -= lastDt/1000;
    if(p.life <= 0) { particles.splice(i, 1); continue; }
    ctx.fillStyle = p.color; ctx.globalAlpha = Math.max(0, p.life);
    ctx.beginPath(); ctx.arc(p.x, p.y, 4, 0, Math.PI*2); ctx.fill(); ctx.globalAlpha = 1.0;
  }
  
  ctx.restore(); // camera
  ctx.restore(); // shake & scale
}

function drawPreviewCanvas() {
  if(!previewActiveItem) return;
  prevCtx.clearRect(0, 0, prevCanvas.width, prevCanvas.height);
  
  let prevSkin = currentSkin; let prevHat = equippedHat; let prevWpn = equippedWeapon; let prevFace = equippedFace;
  if(previewActiveItem.type === 'skin') prevSkin = previewActiveItem.id;
  if(previewActiveItem.type === 'hat') prevHat = previewActiveItem.id;
  if(previewActiveItem.type === 'weapon') prevWpn = previewActiveItem.id;
  if(previewActiveItem.type === 'face') prevFace = previewActiveItem.id;

  // Determine matching biome
  let bIdx = 0;
  if(prevSkin === 'ninja') bIdx = 1;
  else if(prevSkin === 'cyber') bIdx = 2;
  else if(prevSkin === 'gold') bIdx = 3;
  else if(prevSkin === 'hoodie') bIdx = 4;
  else if(prevSkin === 'galaxy') bIdx = 5;
  const biome = BIOMES[bIdx];

  // Draw Biome Background
  let bg = prevCtx.createLinearGradient(0, 0, 0, prevCanvas.height);
  bg.addColorStop(0, biome.skyTop); bg.addColorStop(1, biome.skyBot);
  prevCtx.fillStyle = bg;
  prevCtx.fillRect(0, 0, prevCanvas.width, prevCanvas.height);
  
  // Draw simple mountain
  prevCtx.fillStyle = biome.mtn2;
  prevCtx.beginPath(); prevCtx.moveTo(0, prevCanvas.height); prevCtx.lineTo(prevCanvas.width/2, prevCanvas.height/2); prevCtx.lineTo(prevCanvas.width, prevCanvas.height); prevCtx.fill();

  prevCtx.save();
  prevCtx.translate(prevCanvas.width/2, prevCanvas.height*0.7);
  
  // draw shadow
  prevCtx.fillStyle = 'rgba(0,0,0,0.5)';
  prevCtx.beginPath(); prevCtx.ellipse(0, 0, 70, 20, 0, 0, Math.PI*2); prevCtx.fill();

  renderSkeleton(prevCtx, prevSkin, prevHat, prevWpn, prevFace, 120, 'IDLE', animTime);
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
