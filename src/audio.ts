import type { WeaponId } from './types';

let ctx: AudioContext | null = null;

function getCtx(): AudioContext {
  if (!ctx) ctx = new AudioContext();
  return ctx;
}

function resumeCtx() {
  const c = getCtx();
  if (c.state === 'suspended') c.resume();
}

function playTone(
  frequency: number,
  duration: number,
  type: OscillatorType = 'sine',
  gainVal = 0.3,
  detune = 0,
) {
  resumeCtx();
  const c = getCtx();
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.connect(gain);
  gain.connect(c.destination);
  osc.type = type;
  osc.frequency.setValueAtTime(frequency, c.currentTime);
  osc.detune.setValueAtTime(detune, c.currentTime);
  gain.gain.setValueAtTime(gainVal, c.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + duration);
  osc.start(c.currentTime);
  osc.stop(c.currentTime + duration);
}

function playNoise(duration: number, gainVal = 0.2, highpass = 1000) {
  resumeCtx();
  const c = getCtx();
  const bufferSize = c.sampleRate * duration;
  const buffer = c.createBuffer(1, bufferSize, c.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
  const source = c.createBufferSource();
  source.buffer = buffer;
  const filter = c.createBiquadFilter();
  filter.type = 'highpass';
  filter.frequency.value = highpass;
  const gain = c.createGain();
  gain.gain.setValueAtTime(gainVal, c.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + duration);
  source.connect(filter);
  filter.connect(gain);
  gain.connect(c.destination);
  source.start();
}

export function playHitSound(weapon: WeaponId): void {
  switch (weapon) {
    case 'fist':
      playNoise(0.08, 0.4, 200);
      playTone(120, 0.08, 'sine', 0.2);
      break;
    case 'slap':
      playNoise(0.12, 0.5, 800);
      playTone(300, 0.06, 'sine', 0.15);
      break;
    case 'bat':
      playTone(200, 0.15, 'sawtooth', 0.3);
      playNoise(0.1, 0.3, 100);
      playTone(80, 0.2, 'sine', 0.2);
      break;
    case 'hammer':
      playTone(60, 0.3, 'sine', 0.5);
      playNoise(0.2, 0.4, 50);
      playTone(40, 0.25, 'square', 0.15);
      break;
    case 'katana':
      playTone(800, 0.05, 'sawtooth', 0.2);
      playTone(1200, 0.08, 'sine', 0.15);
      playNoise(0.06, 0.2, 2000);
      break;
    case 'rocket':
      playNoise(0.5, 0.6, 20);
      playTone(80, 0.4, 'sawtooth', 0.4);
      playTone(50, 0.5, 'sine', 0.3);
      setTimeout(() => playNoise(0.3, 0.5, 100), 100);
      break;
  }
}

export function playComboSound(combo: number): void {
  const freq = 400 + combo * 30;
  playTone(freq, 0.12, 'sine', 0.25);
  if (combo >= 10) {
    setTimeout(() => playTone(freq * 1.5, 0.1, 'sine', 0.2), 60);
  }
}

export function playRageModeSound(): void {
  playTone(150, 0.5, 'sawtooth', 0.4);
  setTimeout(() => playTone(200, 0.4, 'sawtooth', 0.35), 100);
  setTimeout(() => playTone(250, 0.4, 'sine', 0.3), 200);
  setTimeout(() => playTone(300, 0.6, 'square', 0.25), 300);
}

export function playKOSound(): void {
  playTone(300, 0.1, 'sine', 0.3);
  setTimeout(() => playTone(200, 0.1, 'sine', 0.3), 100);
  setTimeout(() => playTone(100, 0.3, 'sine', 0.4), 200);
  setTimeout(() => playNoise(0.3, 0.3, 50), 200);
}

export function playUnlockSound(): void {
  playTone(523, 0.1, 'sine', 0.2);
  setTimeout(() => playTone(659, 0.1, 'sine', 0.2), 80);
  setTimeout(() => playTone(784, 0.2, 'sine', 0.25), 160);
  setTimeout(() => playTone(1046, 0.3, 'sine', 0.2), 260);
}

// ─── Voice Reactions ───────────────────────────────────────────────────────

const HIT_PHRASES: string[] = [
  'Ouch!', 'Ow!', 'Stop it!', 'That hurt!', 'Ahh!', 'Ugh!',
  'Not the face!', 'Come on!', 'Easy there!', 'Help!',
];

const HEAD_PHRASES: string[] = [
  'Not my head!', 'My brain!', 'Stars! I see stars!', 'My nose!',
  'Ow my face!', 'Not the head!', 'Concussion!',
];

const HEAVY_PHRASES: string[] = [
  'You monster!', 'You maniac!', 'Have mercy!', 'I give up!',
  'Please stop!', 'No more!', 'I beg you!', 'Spare me!',
];

const COMBO_PHRASES: string[] = [
  "You're relentless!", "You're a demon!", 'You merciless beast!',
  'Have you no soul?', "Stop! I'm begging you!", 'You savage!',
  'Are you insane?!', 'Pure evil!',
];

const RAGE_PHRASES: string[] = [
  "You're in RAGE MODE!", 'Absolute madness!', 'Someone stop this person!',
  'Call the police!', 'I need a medic!',
];

const KO_PHRASES: string[] = [
  'K... O...', "I'm done...", 'You win... this time...',
  'My whole body hurts...', 'Everything is spinning...',
  "I can't take anymore...",
];

const WEAPON_PHRASES: Record<WeaponId, string[]> = {
  fist:   ['Ow my gut!', 'Nice punch!', 'Felt that one!'],
  slap:   ['Did you just slap me?!', 'The audacity!', 'A SLAP?!'],
  bat:    ['Not the bat!', 'That bat is lethal!', 'My ribs!'],
  hammer: ['A HAMMER?!', 'Who uses a hammer?!', 'My bones!'],
  katana: ['A SWORD?!', 'You brought a katana?!', 'I am sliced!'],
  rocket: ['A ROCKET?!', 'EXPLOSION!', 'I am on FIRE!', 'NOOOO!!!'],
};

let lastSpeechTime = 0;
let currentUtterance: SpeechSynthesisUtterance | null = null;
let subtitleTimer: ReturnType<typeof setTimeout> | null = null;

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function showSubtitle(text: string): void {
  const el = document.getElementById('subtitle');
  if (!el) return;
  el.textContent = `"${text}"`;
  el.classList.add('visible');
  if (subtitleTimer) clearTimeout(subtitleTimer);
  // Hide after speech duration estimate: ~60ms per character, min 1.5s
  const duration = Math.max(1500, text.length * 70);
  subtitleTimer = setTimeout(() => el.classList.remove('visible'), duration);
}

function speak(text: string, pitch = 1, rate = 1): void {
  if (!window.speechSynthesis) return;

  const now = Date.now();
  if (now - lastSpeechTime < 600) return;
  lastSpeechTime = now;

  if (currentUtterance) {
    window.speechSynthesis.cancel();
  }

  const utt = new SpeechSynthesisUtterance(text);
  utt.pitch = pitch;
  utt.rate = rate;
  utt.volume = 1;

  const voices = window.speechSynthesis.getVoices();
  const preferred = voices.find(v => v.lang.startsWith('en') && v.name.toLowerCase().includes('male'))
    || voices.find(v => v.lang.startsWith('en'))
    || voices[0];
  if (preferred) utt.voice = preferred;

  currentUtterance = utt;
  showSubtitle(text);
  window.speechSynthesis.speak(utt);
}

export function speakHitReaction(
  weapon: WeaponId,
  zone: 'head' | 'torso' | 'leftArm' | 'rightArm' | 'leftLeg' | 'rightLeg' | 'miss',
  combo: number,
  isRageMode: boolean,
  damage: number,
): void {
  let phrase: string;
  let pitch = 1 + Math.random() * 0.4 - 0.2;
  let rate = 1;

  if (isRageMode) {
    phrase = pick(RAGE_PHRASES);
    pitch = 0.7 + Math.random() * 0.3;
    rate = 1.2;
  } else if (combo >= 15) {
    phrase = pick(COMBO_PHRASES);
    pitch = 0.8;
    rate = 1.1;
  } else if (zone === 'head') {
    phrase = pick(HEAD_PHRASES);
    pitch = 1.3 + Math.random() * 0.3;
    rate = 1.2;
  } else if (damage >= 40) {
    phrase = pick(HEAVY_PHRASES);
    pitch = 0.8 + Math.random() * 0.2;
  } else if (Math.random() < 0.4) {
    // 40% chance: weapon-specific line
    phrase = pick(WEAPON_PHRASES[weapon]);
    pitch = 1 + Math.random() * 0.3;
  } else {
    phrase = pick(HIT_PHRASES);
    pitch = 1.1 + Math.random() * 0.4;
    rate = 1 + Math.random() * 0.3;
  }

  speak(phrase, pitch, rate);
}

export function speakKO(): void {
  speak(pick(KO_PHRASES), 0.6, 0.8);
}
