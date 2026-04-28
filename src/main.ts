import { Game } from './game';
import { loadModels, detectFace, cropFaceToBitmap } from './faceDetect';
import type { WeaponId } from './types';

const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
const fileInput = document.getElementById('file-input') as HTMLInputElement;
const uploadBtn = document.getElementById('upload-btn') as HTMLButtonElement;
const uploadOverlay = document.getElementById('upload-overlay') as HTMLElement;
const loadingOverlay = document.getElementById('loading-overlay') as HTMLElement;
const genderToggle = document.getElementById('gender-toggle') as HTMLButtonElement;
const changePhotoBtn = document.getElementById('change-photo-btn') as HTMLButtonElement;
const weaponBar = document.getElementById('weapon-bar') as HTMLElement;

const game = new Game(canvas);
game.start();

// Load face detection models in background
loadModels().catch(console.error);

// Upload flow
uploadBtn.addEventListener('click', () => fileInput.click());
changePhotoBtn.addEventListener('click', () => fileInput.click());

fileInput.addEventListener('change', async () => {
  const file = fileInput.files?.[0];
  if (!file) return;

  loadingOverlay.classList.remove('hidden');
  uploadOverlay.classList.add('hidden');

  try {
    const img = await fileToImage(file);
    await loadModels();
    const box = await detectFace(img);

    if (!box) {
      // Fallback: use the whole image as face
      const bitmap = await createImageBitmap(img);
      game.setFace(bitmap);
      showToast('No face detected — using full image', '#ffcc00');
    } else {
      const bitmap = await cropFaceToBitmap(img, box);
      game.setFace(bitmap);
    }

    loadingOverlay.classList.add('hidden');
  } catch (err) {
    console.error(err);
    // Fallback to full image
    try {
      const img = await fileToImage(fileInput.files![0]);
      const bitmap = await createImageBitmap(img);
      game.setFace(bitmap);
      showToast('Face detection failed — using full image', '#ff6600');
    } catch {
      showToast('Could not load image', '#ff0000');
    }
    loadingOverlay.classList.add('hidden');
  }

  fileInput.value = '';
});

// Canvas hit detection
function getCanvasPos(e: MouseEvent | TouchEvent): { x: number; y: number } | null {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;

  if (e instanceof MouseEvent) {
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  } else if (e instanceof TouchEvent && e.touches.length > 0) {
    return {
      x: (e.touches[0].clientX - rect.left) * scaleX,
      y: (e.touches[0].clientY - rect.top) * scaleY,
    };
  }
  return null;
}

canvas.addEventListener('mousedown', (e) => {
  const pos = getCanvasPos(e);
  if (pos) game.handleHit(pos.x, pos.y);
});

canvas.addEventListener('touchstart', (e) => {
  e.preventDefault();
  for (const touch of Array.from(e.touches)) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    game.handleHit(
      (touch.clientX - rect.left) * scaleX,
      (touch.clientY - rect.top) * scaleY,
    );
  }
}, { passive: false });

// Weapon bar clicks
weaponBar.addEventListener('click', (e) => {
  const btn = (e.target as HTMLElement).closest('[data-weapon]') as HTMLElement | null;
  if (!btn) return;
  const weapon = btn.dataset.weapon as WeaponId;
  if (weapon) game.setWeapon(weapon);
});

// Gender toggle
genderToggle.addEventListener('click', () => {
  const state = game.getState();
  const newGender = state.gender === 'male' ? 'female' : 'male';
  game.setGender(newGender);
});

// Helpers
function fileToImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Failed to load image')); };
    img.src = url;
  });
}

let toastTimer: ReturnType<typeof setTimeout> | null = null;
function showToast(msg: string, color: string): void {
  const el = document.getElementById('achievement-toast') as HTMLElement;
  el.textContent = msg;
  el.style.background = color;
  el.classList.add('show');
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 3000);
}
