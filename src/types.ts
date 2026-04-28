export type Gender = 'male' | 'female';
export type WeaponId = 'fist' | 'slap' | 'bat' | 'hammer' | 'katana' | 'rocket';
export type HitZone = 'head' | 'torso' | 'leftArm' | 'rightArm' | 'leftLeg' | 'rightLeg' | 'miss';

export interface Weapon {
  id: WeaponId;
  name: string;
  damage: number;
  unlockAt: number;
  emoji: string;
  swingColor: string;
  swingWidth: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
  shape: 'circle' | 'star' | 'spark';
}

export interface FloatingText {
  text: string;
  x: number;
  y: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  fontSize: number;
  bold: boolean;
}

export interface HitAnimation {
  x: number;
  y: number;
  zone: HitZone;
  life: number;
  maxLife: number;
  weapon: WeaponId;
}

export interface SwingAnimation {
  active: boolean;
  x: number;
  y: number;
  life: number;
  maxLife: number;
  weapon: WeaponId;
  angle: number;
}

export interface FigureShake {
  active: boolean;
  intensity: number;
  timer: number;
  maxTimer: number;
  dx: number;
  dy: number;
}

export interface Achievement {
  id: string;
  title: string;
  emoji: string;
  check: (state: GameState) => boolean;
}

export interface GameState {
  hp: number;
  maxHp: number;
  score: number;
  highScore: number;
  totalHits: number;
  koCount: number;
  currentWeapon: WeaponId;
  unlockedWeapons: Set<WeaponId>;
  combo: number;
  comboTimer: number;
  maxComboTimer: number;
  isRageMode: boolean;
  rageModeTimer: number;
  gender: Gender;
  faceImageBitmap: ImageBitmap | null;
  faceBox: { x: number; y: number; width: number; height: number } | null;
  isKO: boolean;
  koTimer: number;
  koMaxTimer: number;
  figureShake: FigureShake;
  screenShake: { x: number; y: number; intensity: number; timer: number };
  particles: Particle[];
  floatingTexts: FloatingText[];
  hitAnimations: HitAnimation[];
  swingAnimation: SwingAnimation;
  unlockedAchievements: Set<string>;
  figureOffsetY: number;
  figureBobTimer: number;
  rageFlashTimer: number;
  lastComboMilestone: number;
}
