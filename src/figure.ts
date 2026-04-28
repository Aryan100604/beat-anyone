import type { Gender, HitZone, GameState } from './types';

export interface FigureLayout {
  cx: number;
  cy: number;
  headR: number;
  headCy: number;
  neckTop: number;
  shoulderY: number;
  hipY: number;
  kneeY: number;
  footY: number;
  shoulderW: number;
  torsoW: number;
  hipW: number;
  armW: number;
  legW: number;
  scale: number;
}

export function getFigureLayout(canvas: HTMLCanvasElement, gender: Gender): FigureLayout {
  const cx = canvas.width / 2;
  const scale = canvas.height / 600;
  const headR = 52 * scale;
  const headCy = 90 * scale;
  const neckTop = headCy + headR - 4 * scale;
  const shoulderY = neckTop + 18 * scale;
  const hipY = shoulderY + 160 * scale;
  const kneeY = hipY + 120 * scale;
  const footY = kneeY + 110 * scale;
  const shoulderW = gender === 'male' ? 90 * scale : 72 * scale;
  const torsoW = gender === 'male' ? 60 * scale : 52 * scale;
  const hipW = gender === 'male' ? 65 * scale : 78 * scale;
  const armW = 18 * scale;
  const legW = gender === 'male' ? 26 * scale : 24 * scale;
  const cy = canvas.height / 2;
  return { cx, cy, headR, headCy, neckTop, shoulderY, hipY, kneeY, footY, shoulderW, torsoW, hipW, armW, legW, scale };
}

export function getHitZone(x: number, y: number, layout: FigureLayout): HitZone {
  const { cx, headCy, headR, shoulderY, hipY, kneeY, footY, shoulderW, hipW, armW } = layout;

  // Head
  const dx = x - cx;
  const dy = y - headCy;
  if (Math.sqrt(dx * dx + dy * dy) < headR + 10) return 'head';

  // Torso
  if (y >= shoulderY && y <= hipY && Math.abs(x - cx) < shoulderW + 10) return 'torso';

  // Arms
  const leftArmCx = cx - shoulderW - armW;
  const rightArmCx = cx + shoulderW + armW;
  if (y >= shoulderY && y <= hipY) {
    if (Math.abs(x - leftArmCx) < armW + 15) return 'leftArm';
    if (Math.abs(x - rightArmCx) < armW + 15) return 'rightArm';
  }

  // Legs
  if (y >= hipY && y <= footY) {
    if (x < cx) return 'leftLeg';
    return 'rightLeg';
  }

  return 'miss';
}

function skinColor(gender: Gender) {
  return gender === 'male' ? '#f0c27f' : '#f5c5a3';
}

function shirtColor(gender: Gender, rage: boolean) {
  if (rage) return '#cc0000';
  return gender === 'male' ? '#3a7bd5' : '#e84393';
}

function pantsColor(gender: Gender, rage: boolean) {
  if (rage) return '#880000';
  return gender === 'male' ? '#2c3e50' : '#9b59b6';
}

export function drawFigure(
  ctx: CanvasRenderingContext2D,
  layout: FigureLayout,
  gender: Gender,
  state: GameState,
  offsetX = 0,
  offsetY = 0,
): void {
  const { cx, headR, headCy, neckTop, shoulderY, hipY, kneeY, footY,
    shoulderW, torsoW, hipW, armW, legW, scale } = layout;

  const rage = state.isRageMode;
  const isKO = state.isKO;
  const skin = skinColor(gender);
  const shirt = shirtColor(gender, rage);
  const pants = pantsColor(gender, rage);

  ctx.save();
  ctx.translate(offsetX, offsetY);

  if (isKO) {
    // KO rotation — figure falls to side
    const koProgress = 1 - (state.koTimer / state.koMaxTimer);
    const angle = Math.min(koProgress * 1.6, Math.PI / 2);
    ctx.translate(cx, hipY);
    ctx.rotate(angle);
    ctx.translate(-cx, -hipY);
  }

  // Figure bob animation
  const bob = Math.sin(state.figureBobTimer * 0.05) * 2 * scale;

  // Legs
  ctx.fillStyle = pants;
  // Left leg
  roundRect(ctx, cx - hipW / 2, hipY + bob, legW, kneeY - hipY, 8 * scale);
  // Right leg
  roundRect(ctx, cx + hipW / 2 - legW, hipY + bob, legW, kneeY - hipY, 8 * scale);
  // Shins
  ctx.fillStyle = pants;
  roundRect(ctx, cx - hipW / 2 + 2, kneeY + bob, legW - 2, footY - kneeY, 8 * scale);
  roundRect(ctx, cx + hipW / 2 - legW + 2, kneeY + bob, legW - 2, footY - kneeY, 8 * scale);
  // Feet
  ctx.fillStyle = '#222';
  ctx.fillRect(cx - hipW / 2 - 6, footY + bob, legW + 14, 12 * scale);
  ctx.fillRect(cx + hipW / 2 - legW - 6, footY + bob, legW + 14, 12 * scale);

  // Arms
  ctx.fillStyle = shirt;
  // Left arm upper
  roundRect(ctx, cx - shoulderW - armW * 2, shoulderY + bob, armW, (hipY - shoulderY) * 0.55, 7 * scale);
  // Right arm upper
  roundRect(ctx, cx + shoulderW + armW, shoulderY + bob, armW, (hipY - shoulderY) * 0.55, 7 * scale);
  // Forearms (skin)
  ctx.fillStyle = skin;
  const forearmTop = shoulderY + (hipY - shoulderY) * 0.53 + bob;
  roundRect(ctx, cx - shoulderW - armW * 2, forearmTop, armW, (hipY - shoulderY) * 0.5, 7 * scale);
  roundRect(ctx, cx + shoulderW + armW, forearmTop, armW, (hipY - shoulderY) * 0.5, 7 * scale);
  // Hands
  ctx.fillStyle = skin;
  ctx.beginPath();
  ctx.arc(cx - shoulderW - armW * 1.5, forearmTop + (hipY - shoulderY) * 0.5, armW * 0.7, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(cx + shoulderW + armW * 1.5, forearmTop + (hipY - shoulderY) * 0.5, armW * 0.7, 0, Math.PI * 2);
  ctx.fill();

  // Torso (shirt)
  ctx.fillStyle = shirt;
  // Draw trapezoidal torso
  ctx.beginPath();
  ctx.moveTo(cx - shoulderW, shoulderY + bob);
  ctx.lineTo(cx + shoulderW, shoulderY + bob);
  ctx.lineTo(cx + hipW / 2, hipY + bob);
  ctx.lineTo(cx - hipW / 2, hipY + bob);
  ctx.closePath();
  ctx.fill();

  // Collar / neck
  ctx.fillStyle = skin;
  roundRect(ctx, cx - 10 * scale, neckTop + bob, 20 * scale, shoulderY - neckTop + 2, 4 * scale);

  // Gender-specific torso detail
  if (gender === 'female') {
    // Hair going down the back (behind head — drawn after head)
    ctx.fillStyle = '#4a2800';
    ctx.beginPath();
    ctx.ellipse(cx, headCy + headR * 0.5 + bob, headR * 0.55, headR * 1.2, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // Head
  const headSquish = state.figureShake.active ? (1 - state.figureShake.intensity * 0.03) : 1;
  ctx.fillStyle = skin;
  ctx.save();
  ctx.translate(cx, headCy + bob);
  ctx.scale(1 / headSquish, headSquish);
  ctx.beginPath();
  ctx.arc(0, 0, headR, 0, Math.PI * 2);
  ctx.fill();
  // Jawline / chin
  ctx.beginPath();
  ctx.ellipse(0, headR * 0.4, headR * 0.6, headR * 0.45, 0, 0, Math.PI);
  ctx.fill();
  ctx.restore();

  // Hair
  ctx.fillStyle = gender === 'male' ? '#2c1800' : '#4a2800';
  if (gender === 'male') {
    ctx.save();
    ctx.translate(cx, headCy + bob);
    ctx.beginPath();
    ctx.arc(0, -headR * 0.1, headR, Math.PI, 0);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  } else {
    // Bun / long hair top
    ctx.save();
    ctx.translate(cx, headCy + bob);
    ctx.beginPath();
    ctx.arc(0, -headR * 0.2, headR * 1.05, Math.PI, 0);
    ctx.fill();
    // Side hair
    ctx.fillStyle = '#4a2800';
    ctx.beginPath();
    ctx.ellipse(-headR * 0.9, 0, headR * 0.25, headR * 0.7, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(headR * 0.9, 0, headR * 0.25, headR * 0.7, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // Ears
  ctx.fillStyle = skin;
  ctx.beginPath();
  ctx.ellipse(cx - headR + 2, headCy + bob, 8 * scale, 12 * scale, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(cx + headR - 2, headCy + bob, 8 * scale, 12 * scale, 0, 0, Math.PI * 2);
  ctx.fill();

  // Eyes (drawn but face image will cover)
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.ellipse(cx - headR * 0.3, headCy - headR * 0.05 + bob, 10 * scale, 7 * scale, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(cx + headR * 0.3, headCy - headR * 0.05 + bob, 10 * scale, 7 * scale, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#333';
  ctx.beginPath();
  ctx.arc(cx - headR * 0.3, headCy - headR * 0.05 + bob, 5 * scale, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(cx + headR * 0.3, headCy - headR * 0.05 + bob, 5 * scale, 0, Math.PI * 2);
  ctx.fill();

  // Mouth
  ctx.strokeStyle = rage ? '#ff0000' : '#c0392b';
  ctx.lineWidth = 2 * scale;
  ctx.beginPath();
  if (isKO) {
    ctx.arc(cx, headCy + headR * 0.35 + bob, 15 * scale, 0, Math.PI);
  } else if (state.figureShake.active) {
    // Pain mouth
    ctx.arc(cx, headCy + headR * 0.4 + bob, 12 * scale, Math.PI, 0);
  } else {
    ctx.arc(cx, headCy + headR * 0.45 + bob, 12 * scale, 0, Math.PI);
  }
  ctx.stroke();

  // Rage glow
  if (rage) {
    ctx.save();
    ctx.globalAlpha = 0.3 + Math.sin(state.rageFlashTimer * 0.2) * 0.2;
    const grd = ctx.createRadialGradient(cx, hipY / 2 + bob, 20, cx, hipY / 2 + bob, 160 * scale);
    grd.addColorStop(0, '#ff0000');
    grd.addColorStop(1, 'transparent');
    ctx.fillStyle = grd;
    ctx.fillRect(cx - 200 * scale, 0, 400 * scale, footY + 20);
    ctx.restore();
  }

  ctx.restore();
}

// Draw the face image on top of the figure's head
export function drawFaceOverlay(
  ctx: CanvasRenderingContext2D,
  layout: FigureLayout,
  state: GameState,
  offsetX = 0,
  offsetY = 0,
): void {
  if (!state.faceImageBitmap) return;
  const { cx, headCy, headR } = layout;

  const bob = Math.sin(state.figureBobTimer * 0.05) * 2 * layout.scale;

  // The face image is drawn centered on the head
  const faceSize = headR * 2.05;
  const fx = cx - faceSize / 2 + offsetX;
  const fy = headCy - faceSize * 0.5 + bob + offsetY;

  // Clip to the head circle
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx + offsetX, headCy + bob + offsetY, headR - 2, 0, Math.PI * 2);
  ctx.clip();

  // Apply squish if shaking
  if (state.figureShake.active) {
    const sq = 1 - state.figureShake.intensity * 0.025;
    ctx.save();
    ctx.translate(cx + offsetX, headCy + bob + offsetY);
    ctx.scale(1 / sq, sq);
    ctx.translate(-(cx + offsetX), -(headCy + bob + offsetY));
  }

  ctx.drawImage(state.faceImageBitmap, fx, fy, faceSize, faceSize);

  if (state.figureShake.active) ctx.restore();
  ctx.restore();
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
  ctx.fill();
}
