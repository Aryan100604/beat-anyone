import type { GameState } from './types';
import { WEAPONS, WEAPON_ORDER, getNextUnlock } from './weapons';

export function updateHUD(state: GameState): void {
  // Score
  (document.getElementById('score-display') as HTMLElement).textContent = state.score.toLocaleString();
  (document.getElementById('high-score-display') as HTMLElement).textContent = `BEST: ${state.highScore.toLocaleString()}`;

  // KO
  (document.getElementById('ko-count') as HTMLElement).textContent = `x${state.koCount}`;

  // Hits
  (document.getElementById('hits-display') as HTMLElement).textContent = `${state.totalHits} HITS`;

  // Combo
  const comboEl = document.getElementById('combo-display') as HTMLElement;
  if (state.combo >= 2) {
    const pct = state.comboTimer / state.maxComboTimer;
    comboEl.textContent = `x${state.combo} COMBO`;
    comboEl.style.color = state.combo >= 20 ? '#ff00ff'
      : state.combo >= 10 ? '#ff2200'
      : state.combo >= 5  ? '#ff6600'
      : '#ffaa00';
  } else {
    comboEl.textContent = '';
  }

  // Health bar
  const hpPct = Math.max(0, state.hp / state.maxHp) * 100;
  const fill = document.getElementById('health-bar-fill') as HTMLElement;
  fill.style.width = `${hpPct}%`;
  if (hpPct > 60) {
    fill.style.background = 'linear-gradient(90deg, #22cc44, #44ff66)';
  } else if (hpPct > 30) {
    fill.style.background = 'linear-gradient(90deg, #ccaa00, #ffdd00)';
  } else {
    fill.style.background = 'linear-gradient(90deg, #cc1111, #ff3333)';
  }
  (document.getElementById('health-text') as HTMLElement).textContent = `${Math.max(0, state.hp)} / ${state.maxHp}`;

  // Next unlock progress
  const nextUnlock = getNextUnlock(state.totalHits);
  const unlockFill = document.getElementById('next-unlock-fill') as HTMLElement;
  const unlockLabel = document.getElementById('next-unlock-label') as HTMLElement;
  if (nextUnlock) {
    const prevWeaponIdx = WEAPON_ORDER.findIndex(id => id === nextUnlock.weapon.id) - 1;
    const prevAt = prevWeaponIdx >= 0 ? WEAPONS[WEAPON_ORDER[prevWeaponIdx]].unlockAt : 0;
    const range = nextUnlock.weapon.unlockAt - prevAt;
    const progress = (state.totalHits - prevAt) / range;
    unlockFill.style.width = `${Math.min(100, progress * 100)}%`;
    unlockLabel.textContent = `${nextUnlock.weapon.emoji} ${nextUnlock.weapon.name} in ${nextUnlock.hitsLeft} hits`;
  } else {
    unlockFill.style.width = '100%';
    unlockLabel.textContent = 'ALL WEAPONS UNLOCKED';
    unlockLabel.style.color = '#ffd700';
  }

  updateWeaponBar(state);
  updateGenderBtn(state);
  updateRageBorder(state);
}

function updateWeaponBar(state: GameState): void {
  const bar = document.getElementById('weapon-bar') as HTMLElement;
  bar.innerHTML = '';

  for (const id of WEAPON_ORDER) {
    const w = WEAPONS[id];
    const unlocked = state.unlockedWeapons.has(id);
    const active = state.currentWeapon === id;

    const btn = document.createElement('button');
    btn.className = `weapon-btn${active ? ' active' : ''}${!unlocked ? ' locked' : ''}`;
    btn.dataset.weapon = id;
    btn.disabled = !unlocked;
    btn.title = unlocked ? `${w.name} — ${w.damage} dmg` : `Unlock at ${w.unlockAt} hits`;

    btn.innerHTML = `
      <span class="weapon-emoji">${w.emoji}</span>
      <span class="weapon-name">${w.name}</span>
      <span class="weapon-dmg">${w.damage}dmg</span>
      ${!unlocked ? `<span class="lock-icon">${w.unlockAt}</span>` : ''}
    `;
    bar.appendChild(btn);
  }
}

function updateGenderBtn(state: GameState): void {
  const btn = document.getElementById('gender-toggle') as HTMLButtonElement;
  btn.textContent = state.gender === 'male' ? '♂ MALE' : '♀ FEMALE';
}

function updateRageBorder(state: GameState): void {
  const border = document.getElementById('rage-border') as HTMLElement;
  if (state.isRageMode) {
    border.classList.add('active');
  } else {
    border.classList.remove('active');
  }
}

let achievementTimer: ReturnType<typeof setTimeout> | null = null;
let unlockTimer: ReturnType<typeof setTimeout> | null = null;

export function showAchievementToast(title: string, emoji: string): void {
  const el = document.getElementById('achievement-toast') as HTMLElement;
  el.textContent = `${emoji}  ${title}`;
  el.classList.add('show');
  if (achievementTimer) clearTimeout(achievementTimer);
  achievementTimer = setTimeout(() => el.classList.remove('show'), 2800);
}

export function showUnlockToast(weaponName: string, emoji: string): void {
  const el = document.getElementById('unlock-toast') as HTMLElement;
  el.textContent = `${emoji}  ${weaponName} UNLOCKED!`;
  el.classList.add('show');
  if (unlockTimer) clearTimeout(unlockTimer);
  unlockTimer = setTimeout(() => el.classList.remove('show'), 2800);
}
