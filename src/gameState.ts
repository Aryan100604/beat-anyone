import type { GameState } from './types';

const STORAGE_KEY = 'beat-anyone-save';

interface SaveData {
  highScore: number;
  totalHits: number;
  koCount: number;
  unlockedWeapons: string[];
  unlockedAchievements: string[];
}

function loadSave(): SaveData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { highScore: 0, totalHits: 0, koCount: 0, unlockedWeapons: ['fist'], unlockedAchievements: [] };
    return JSON.parse(raw);
  } catch {
    return { highScore: 0, totalHits: 0, koCount: 0, unlockedWeapons: ['fist'], unlockedAchievements: [] };
  }
}

export function savePersistentData(state: GameState): void {
  const data: SaveData = {
    highScore: state.highScore,
    totalHits: state.totalHits,
    koCount: state.koCount,
    unlockedWeapons: [...state.unlockedWeapons],
    unlockedAchievements: [...state.unlockedAchievements],
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function createInitialState(): GameState {
  const save = loadSave();
  return {
    hp: 1000,
    maxHp: 1000,
    score: 0,
    highScore: save.highScore,
    totalHits: save.totalHits,
    koCount: save.koCount,
    currentWeapon: 'fist',
    unlockedWeapons: new Set(save.unlockedWeapons as any),
    combo: 0,
    comboTimer: 0,
    maxComboTimer: 90, // frames
    isRageMode: false,
    rageModeTimer: 0,
    gender: 'male',
    faceImageBitmap: null,
    faceBox: null,
    isKO: false,
    koTimer: 0,
    koMaxTimer: 120, // frames before respawn
    figureShake: { active: false, intensity: 0, timer: 0, maxTimer: 15, dx: 0, dy: 0 },
    screenShake: { x: 0, y: 0, intensity: 0, timer: 0 },
    particles: [],
    floatingTexts: [],
    hitAnimations: [],
    swingAnimation: { active: false, x: 0, y: 0, life: 0, maxLife: 1, weapon: 'fist', angle: 0 },
    unlockedAchievements: new Set(save.unlockedAchievements),
    figureOffsetY: 0,
    figureBobTimer: 0,
    rageFlashTimer: 0,
    lastComboMilestone: 0,
  };
}
