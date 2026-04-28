import type { Particle, FloatingText, HitAnimation, GameState, WeaponId, HitZone } from './types';

const WEAPON_COLORS: Record<WeaponId, string[]> = {
  fist:   ['#ffcc00', '#ff9900', '#fff'],
  slap:   ['#ff9999', '#ff6666', '#ffcccc'],
  bat:    ['#8B4513', '#a0522d', '#fff'],
  hammer: ['#888', '#555', '#aaa'],
  katana: ['#00eaff', '#0099cc', '#fff'],
  rocket: ['#ff6600', '#ff3300', '#ffcc00', '#fff', '#ff9900'],
};

export function spawnHitParticles(state: GameState, x: number, y: number, weapon: WeaponId): void {
  const colors = WEAPON_COLORS[weapon];
  const count = weapon === 'rocket' ? 40 : weapon === 'hammer' ? 22 : weapon === 'katana' ? 18 : 14;

  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 2 + Math.random() * (weapon === 'rocket' ? 10 : 5);
    const color = colors[Math.floor(Math.random() * colors.length)];
    const shape = weapon === 'katana' ? 'spark' : weapon === 'rocket' ? 'star' : 'circle';

    state.particles.push({
      x, y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 2,
      life: 1,
      maxLife: 1,
      color,
      size: 3 + Math.random() * (weapon === 'rocket' ? 8 : 4),
      shape,
    });
  }

  // Stars for combo hits
  if (state.combo >= 5) {
    for (let i = 0; i < 6; i++) {
      const angle = Math.random() * Math.PI * 2;
      state.particles.push({
        x, y,
        vx: Math.cos(angle) * (2 + Math.random() * 3),
        vy: Math.sin(angle) * (2 + Math.random() * 3) - 1,
        life: 1, maxLife: 1,
        color: '#ffd700',
        size: 5 + Math.random() * 5,
        shape: 'star',
      });
    }
  }
}

export function spawnFloatingText(state: GameState, text: string, x: number, y: number, color = '#fff', fontSize = 22, bold = true): void {
  state.floatingTexts.push({
    text, x, y,
    vy: -2.5,
    life: 1, maxLife: 1,
    color, fontSize, bold,
  });
}

export function spawnHitAnimation(state: GameState, x: number, y: number, zone: HitZone, weapon: WeaponId): void {
  state.hitAnimations.push({ x, y, zone, life: 1, maxLife: 1, weapon });
}

export function triggerScreenShake(state: GameState, intensity: number): void {
  state.screenShake.intensity = Math.max(state.screenShake.intensity, intensity);
  state.screenShake.timer = Math.max(state.screenShake.timer, intensity * 4);
}

export function triggerFigureShake(state: GameState, intensity: number): void {
  state.figureShake.active = true;
  state.figureShake.intensity = Math.max(state.figureShake.intensity, intensity);
  state.figureShake.timer = 0;
  state.figureShake.maxTimer = 15;
  state.figureShake.dx = (Math.random() - 0.5) * intensity * 4;
  state.figureShake.dy = (Math.random() - 0.5) * intensity * 2;
}

export function updateEffects(state: GameState, dt: number): void {
  const speed = dt / 16.67;

  // Particles
  for (let i = state.particles.length - 1; i >= 0; i--) {
    const p = state.particles[i];
    p.x += p.vx * speed;
    p.y += p.vy * speed;
    p.vy += 0.25 * speed; // gravity
    p.life -= 0.025 * speed;
    if (p.life <= 0) state.particles.splice(i, 1);
  }

  // Floating texts
  for (let i = state.floatingTexts.length - 1; i >= 0; i--) {
    const t = state.floatingTexts[i];
    t.y += t.vy * speed;
    t.vy *= 0.97;
    t.life -= 0.018 * speed;
    if (t.life <= 0) state.floatingTexts.splice(i, 1);
  }

  // Hit animations
  for (let i = state.hitAnimations.length - 1; i >= 0; i--) {
    const h = state.hitAnimations[i];
    h.life -= 0.05 * speed;
    if (h.life <= 0) state.hitAnimations.splice(i, 1);
  }

  // Swing animation
  if (state.swingAnimation.active) {
    state.swingAnimation.life -= 0.08 * speed;
    if (state.swingAnimation.life <= 0) state.swingAnimation.active = false;
  }

  // Screen shake
  if (state.screenShake.timer > 0) {
    state.screenShake.timer -= speed;
    state.screenShake.x = (Math.random() - 0.5) * state.screenShake.intensity * 2;
    state.screenShake.y = (Math.random() - 0.5) * state.screenShake.intensity * 2;
    state.screenShake.intensity *= 0.9;
    if (state.screenShake.timer <= 0) {
      state.screenShake.x = 0;
      state.screenShake.y = 0;
      state.screenShake.intensity = 0;
    }
  }

  // Figure shake
  if (state.figureShake.active) {
    state.figureShake.timer += speed;
    state.figureShake.intensity *= 0.88;
    state.figureShake.dx = (Math.random() - 0.5) * state.figureShake.intensity * 4;
    state.figureShake.dy = (Math.random() - 0.5) * state.figureShake.intensity * 2;
    if (state.figureShake.timer >= state.figureShake.maxTimer || state.figureShake.intensity < 0.1) {
      state.figureShake.active = false;
      state.figureShake.intensity = 0;
      state.figureShake.dx = 0;
      state.figureShake.dy = 0;
    }
  }

  // Rage flash
  if (state.isRageMode) state.rageFlashTimer += speed;

  // Figure bob
  state.figureBobTimer += speed;
}

export function drawEffects(ctx: CanvasRenderingContext2D, state: GameState): void {
  // Particles
  for (const p of state.particles) {
    ctx.save();
    ctx.globalAlpha = Math.max(0, p.life);
    ctx.fillStyle = p.color;
    if (p.shape === 'circle') {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
      ctx.fill();
    } else if (p.shape === 'star') {
      drawStar(ctx, p.x, p.y, p.size * p.life, p.size * 0.4 * p.life, 5);
    } else if (p.shape === 'spark') {
      ctx.strokeStyle = p.color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(p.x - p.vx * 3, p.y - p.vy * 3);
      ctx.lineTo(p.x, p.y);
      ctx.stroke();
    }
    ctx.restore();
  }

  // Hit impact flashes
  for (const h of state.hitAnimations) {
    ctx.save();
    ctx.globalAlpha = h.life * 0.8;
    const weaponColors = WEAPON_COLORS[h.weapon];
    const grd = ctx.createRadialGradient(h.x, h.y, 0, h.x, h.y, 35 * h.life);
    grd.addColorStop(0, '#fff');
    grd.addColorStop(0.3, weaponColors[0]);
    grd.addColorStop(1, 'transparent');
    ctx.fillStyle = grd;
    ctx.beginPath();
    ctx.arc(h.x, h.y, 35 * h.life, 0, Math.PI * 2);
    ctx.fill();

    // Impact lines
    ctx.strokeStyle = weaponColors[0];
    ctx.lineWidth = 2;
    const lineCount = 8;
    for (let i = 0; i < lineCount; i++) {
      const angle = (i / lineCount) * Math.PI * 2;
      const innerR = 15 * h.life;
      const outerR = (25 + Math.random() * 15) * h.life;
      ctx.beginPath();
      ctx.moveTo(h.x + Math.cos(angle) * innerR, h.y + Math.sin(angle) * innerR);
      ctx.lineTo(h.x + Math.cos(angle) * outerR, h.y + Math.sin(angle) * outerR);
      ctx.stroke();
    }
    ctx.restore();
  }

  // Floating texts
  for (const t of state.floatingTexts) {
    ctx.save();
    ctx.globalAlpha = Math.min(1, t.life * 2);
    ctx.font = `${t.bold ? 'bold ' : ''}${t.fontSize * (1 + (1 - t.life) * 0.3)}px Arial Black, Arial`;
    ctx.textAlign = 'center';
    ctx.strokeStyle = 'rgba(0,0,0,0.8)';
    ctx.lineWidth = 4;
    ctx.strokeText(t.text, t.x, t.y);
    ctx.fillStyle = t.color;
    ctx.fillText(t.text, t.x, t.y);
    ctx.restore();
  }

  // Swing animation
  if (state.swingAnimation.active) {
    const sw = state.swingAnimation;
    const weapon = sw.weapon;
    ctx.save();
    ctx.globalAlpha = sw.life * 0.7;
    const colors = WEAPON_COLORS[weapon];
    ctx.strokeStyle = colors[0];
    ctx.lineWidth = weapon === 'katana' ? 3 : weapon === 'rocket' ? 16 : 10;
    ctx.lineCap = 'round';
    ctx.beginPath();
    const swingLen = weapon === 'rocket' ? 80 : weapon === 'katana' ? 70 : 50;
    ctx.moveTo(sw.x - Math.cos(sw.angle) * swingLen * sw.life, sw.y - Math.sin(sw.angle) * swingLen * sw.life);
    ctx.lineTo(sw.x, sw.y);
    ctx.stroke();
    // Trail
    ctx.strokeStyle = colors.length > 1 ? colors[1] : colors[0];
    ctx.globalAlpha = sw.life * 0.3;
    ctx.lineWidth = (weapon === 'katana' ? 3 : 10) * 2;
    ctx.stroke();
    ctx.restore();
  }
}

function drawStar(ctx: CanvasRenderingContext2D, cx: number, cy: number, outerR: number, innerR: number, points: number) {
  ctx.beginPath();
  for (let i = 0; i < points * 2; i++) {
    const angle = (i * Math.PI) / points - Math.PI / 2;
    const r = i % 2 === 0 ? outerR : innerR;
    if (i === 0) ctx.moveTo(cx + r * Math.cos(angle), cy + r * Math.sin(angle));
    else ctx.lineTo(cx + r * Math.cos(angle), cy + r * Math.sin(angle));
  }
  ctx.closePath();
  ctx.fill();
}
