import type { GameState, WeaponId } from './types';
import { createInitialState, savePersistentData } from './gameState';
import { getFigureLayout, drawFigure, drawFaceOverlay, getHitZone } from './figure';
import {
  spawnHitParticles, spawnFloatingText, spawnHitAnimation,
  triggerScreenShake, triggerFigureShake, updateEffects, drawEffects
} from './effects';
import { playHitSound, playComboSound, playRageModeSound, playKOSound, playUnlockSound, speakHitReaction, speakKO } from './audio';
import { checkAchievements } from './achievements';
import { updateHUD, showAchievementToast, showUnlockToast } from './ui';
import { WEAPONS, WEAPON_ORDER, getWeaponsToUnlock } from './weapons';
import { hasLeadBeenCaptured, showLeadModal } from './leadCapture';

export class Game {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private state: GameState;
  private animFrame: number = 0;
  private lastTime: number = 0;
  private rafId: number = 0;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.state = createInitialState();
    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  resize(): void {
    const container = this.canvas.parentElement!;
    const w = container.clientWidth;
    const h = window.innerHeight - 200; // leave room for HUD
    this.canvas.width = w;
    this.canvas.height = Math.max(h, 380);
  }

  start(): void {
    this.lastTime = performance.now();
    this.loop(this.lastTime);
  }

  private loop = (timestamp: number): void => {
    const dt = Math.min(timestamp - this.lastTime, 50);
    this.lastTime = timestamp;

    this.update(dt);
    this.draw();

    this.rafId = requestAnimationFrame(this.loop);
  };

  private update(dt: number): void {
    const state = this.state;
    const speed = dt / 16.67;

    // Combo timer
    if (state.combo > 0) {
      state.comboTimer -= speed;
      if (state.comboTimer <= 0) {
        state.combo = 0;
        state.lastComboMilestone = 0;
      }
    }

    // Rage mode timer
    if (state.isRageMode) {
      state.rageModeTimer -= speed;
      if (state.rageModeTimer <= 0) {
        state.isRageMode = false;
      }
    }

    // KO recovery
    if (state.isKO) {
      state.koTimer -= speed;
      if (state.koTimer <= 0) {
        state.isKO = false;
        state.hp = state.maxHp;
        // Reset combo for next round
      }
    }

    updateEffects(state, dt);
    updateHUD(state);
  }

  private draw(): void {
    const { ctx, canvas, state } = this;
    const { screenShake, figureShake } = state;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Background
    const bg = ctx.createLinearGradient(0, 0, 0, canvas.height);
    if (state.isRageMode) {
      bg.addColorStop(0, '#1a0000');
      bg.addColorStop(1, '#0a0000');
    } else {
      bg.addColorStop(0, '#0d0d1e');
      bg.addColorStop(1, '#060610');
    }
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const layout = getFigureLayout(canvas, state.gender);

    // Crowd silhouettes
    this.drawCrowd(layout);

    // Arena floor / stage
    this.drawArenaFloor(layout);

    // Spotlight
    this.drawSpotlight(layout);

    // Shadow under figure
    ctx.save();
    ctx.globalAlpha = 0.5;
    const shadowGrd = ctx.createRadialGradient(
      layout.cx + screenShake.x, layout.footY + 14 * layout.scale + screenShake.y, 0,
      layout.cx + screenShake.x, layout.footY + 14 * layout.scale + screenShake.y, 60 * layout.scale,
    );
    shadowGrd.addColorStop(0, 'rgba(0,0,0,0.6)');
    shadowGrd.addColorStop(1, 'transparent');
    ctx.fillStyle = shadowGrd;
    ctx.beginPath();
    ctx.ellipse(layout.cx + screenShake.x, layout.footY + 14 * layout.scale + screenShake.y, 60 * layout.scale, 14 * layout.scale, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Draw figure with shake offset
    const sx = screenShake.x + (figureShake.active ? figureShake.dx : 0);
    const sy = screenShake.y + (figureShake.active ? figureShake.dy : 0);

    ctx.save();
    ctx.translate(sx, sy);
    drawFigure(ctx, layout, state.gender, state);
    drawFaceOverlay(ctx, layout, state);
    ctx.restore();

    // Effects on top (no shake for effects, they're already positioned)
    drawEffects(ctx, state);

    // Draw combo bar
    if (state.combo > 0) {
      this.drawComboBar();
    }

    // KO text
    if (state.isKO) {
      this.drawKOText();
    }

    // Rage mode banner
    if (state.isRageMode) {
      this.drawRageBanner();
    }
  }

  private drawCrowd(layout: ReturnType<typeof getFigureLayout>): void {
    const { ctx, canvas, state } = this;
    const crowdY = layout.footY + 14 * layout.scale;
    const crowdH = canvas.height - crowdY;
    if (crowdH < 10) return;

    // Crowd gradient backdrop
    const crowdGrd = ctx.createLinearGradient(0, crowdY, 0, canvas.height);
    if (state.isRageMode) {
      crowdGrd.addColorStop(0, '#2a0808');
      crowdGrd.addColorStop(1, '#150404');
    } else {
      crowdGrd.addColorStop(0, '#0a1428');
      crowdGrd.addColorStop(1, '#050a14');
    }
    ctx.fillStyle = crowdGrd;
    ctx.fillRect(0, crowdY, canvas.width, crowdH);

    // Silhouette crowd row
    ctx.save();
    ctx.globalAlpha = 0.35;
    const crowdColors = state.isRageMode
      ? ['#330000', '#440000', '#220000']
      : ['#0a1020', '#0c1828', '#081018'];

    const headSize = 10;
    const spacing = 22;
    for (let x = 0; x < canvas.width; x += spacing) {
      ctx.fillStyle = crowdColors[Math.floor(x / spacing) % 3];
      const bobOffset = Math.sin(state.figureBobTimer * 0.04 + x * 0.5) * 3;
      // Body
      ctx.fillRect(x + 4, crowdY + 8 + bobOffset, 14, 30);
      // Head
      ctx.beginPath();
      ctx.arc(x + 11, crowdY + 4 + bobOffset, headSize / 2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // Waving arms dots (crowd excitement)
    if (state.combo >= 5 || state.isRageMode) {
      ctx.save();
      ctx.globalAlpha = 0.2 + (state.combo / 50) * 0.2;
      for (let x = 0; x < canvas.width; x += spacing) {
        const wave = Math.sin(state.figureBobTimer * 0.06 + x * 0.4) * 12;
        ctx.fillStyle = state.isRageMode ? '#ff4400' : '#4488ff';
        ctx.fillRect(x + 10, crowdY - 6 + wave, 3, 14);
      }
      ctx.restore();
    }
  }

  private drawArenaFloor(layout: ReturnType<typeof getFigureLayout>): void {
    const { ctx, canvas, state } = this;
    const floorY = layout.footY + 12 * layout.scale;

    // Main floor
    const floorGrd = ctx.createLinearGradient(0, floorY, 0, floorY + 40);
    if (state.isRageMode) {
      floorGrd.addColorStop(0, '#3a0a0a');
      floorGrd.addColorStop(1, '#1a0404');
    } else {
      floorGrd.addColorStop(0, '#0f2040');
      floorGrd.addColorStop(1, '#07101f');
    }
    ctx.fillStyle = floorGrd;
    ctx.fillRect(0, floorY, canvas.width, canvas.height - floorY);

    // Floor line / stage edge
    ctx.save();
    const lineColor = state.isRageMode ? '#ff2200' : '#ffd700';
    ctx.strokeStyle = lineColor;
    ctx.lineWidth = 2;
    ctx.globalAlpha = 0.5;
    ctx.beginPath();
    ctx.moveTo(0, floorY);
    ctx.lineTo(canvas.width, floorY);
    ctx.stroke();

    // Floor reflection
    const reflectGrd = ctx.createLinearGradient(0, floorY, 0, floorY + 60);
    reflectGrd.addColorStop(0, state.isRageMode ? 'rgba(255,40,0,0.08)' : 'rgba(255,215,0,0.06)');
    reflectGrd.addColorStop(1, 'transparent');
    ctx.fillStyle = reflectGrd;
    ctx.globalAlpha = 1;
    ctx.fillRect(0, floorY, canvas.width, 60);
    ctx.restore();
  }

  private drawSpotlight(layout: ReturnType<typeof getFigureLayout>): void {
    const { ctx, canvas, state } = this;
    // Spotlight cone from top
    const spotGrd = ctx.createRadialGradient(
      layout.cx, 0, 0,
      layout.cx, 0, canvas.height * 0.85,
    );
    if (state.isRageMode) {
      spotGrd.addColorStop(0, 'rgba(255,40,0,0.12)');
      spotGrd.addColorStop(0.5, 'rgba(255,20,0,0.04)');
      spotGrd.addColorStop(1, 'transparent');
    } else {
      spotGrd.addColorStop(0, 'rgba(255,240,180,0.1)');
      spotGrd.addColorStop(0.5, 'rgba(180,210,255,0.04)');
      spotGrd.addColorStop(1, 'transparent');
    }
    ctx.save();
    ctx.fillStyle = spotGrd;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.restore();
  }

  private drawComboBar(): void {
    // Combo is now in the HUD, just draw a hit streak flash on canvas
    const { ctx, canvas, state } = this;
    if (state.combo < 5) return;

    const alpha = Math.sin(state.figureBobTimer * 0.2) * 0.15 + 0.15;
    ctx.save();
    ctx.globalAlpha = alpha;
    const color = state.combo >= 20 ? '#ff00ff' : state.combo >= 10 ? '#ff3300' : '#ff8800';
    const grd = ctx.createRadialGradient(canvas.width / 2, canvas.height / 2, 0, canvas.width / 2, canvas.height / 2, canvas.width * 0.6);
    grd.addColorStop(0, 'transparent');
    grd.addColorStop(0.7, 'transparent');
    grd.addColorStop(1, color);
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.restore();
  }

  private drawKOText(): void {
    const { ctx, canvas, state } = this;
    const progress = 1 - state.koTimer / state.koMaxTimer;
    const alpha = progress < 0.6 ? 1 : 1 - (progress - 0.6) / 0.4;
    const scale = progress < 0.1 ? 0.5 + progress * 5 : 1;

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(canvas.width / 2, canvas.height * 0.42);
    ctx.scale(scale, scale);
    ctx.textAlign = 'center';

    const flash = Math.floor(state.koTimer / 8) % 2 === 0;

    // Glow effect
    ctx.shadowColor = flash ? '#ff0000' : '#ffcc00';
    ctx.shadowBlur = 30;

    ctx.font = '900 80px Bangers, Arial Black';
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 8;
    ctx.strokeText('K.O.!', 0, 0);
    ctx.fillStyle = flash ? '#ff2222' : '#ffdd00';
    ctx.fillText('K.O.!', 0, 0);

    ctx.shadowBlur = 0;
    ctx.restore();
  }

  private drawRageBanner(): void {
    const { ctx, canvas, state } = this;
    const t = state.rageFlashTimer;
    const alpha = 0.7 + Math.sin(t * 0.25) * 0.3;

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.textAlign = 'center';
    ctx.font = '900 24px Bangers, Arial Black';
    ctx.shadowColor = '#ff0000';
    ctx.shadowBlur = 20;
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 4;
    ctx.strokeText('!! RAGE MODE !!', canvas.width / 2, 38);
    ctx.fillStyle = `hsl(${(t * 3) % 60}, 100%, 55%)`;
    ctx.fillText('!! RAGE MODE !!', canvas.width / 2, 38);
    ctx.restore();
  }

  handleHit(x: number, y: number): void {
    const state = this.state;
    if (state.isKO) return;
    if (!state.faceImageBitmap) return;

    const layout = getFigureLayout(this.canvas, state.gender);
    const zone = getHitZone(x, y, layout);
    if (zone === 'miss') return;

    const weapon = WEAPONS[state.currentWeapon];
    let damage = weapon.damage;

    // Zone multiplier
    if (zone === 'head') damage = Math.floor(damage * 2);

    // Combo multiplier
    const comboMult = 1 + Math.floor(state.combo / 5) * 0.5;
    damage = Math.floor(damage * comboMult);

    // Rage mode doubles damage
    if (state.isRageMode) damage *= 2;

    // Apply damage
    state.hp = Math.max(0, state.hp - damage);
    state.totalHits++;
    state.score += damage;
    if (state.score > state.highScore) state.highScore = state.score;

    // Combo
    state.combo++;
    state.comboTimer = state.maxComboTimer;

    // Combo milestone text
    const milestones = [5, 10, 15, 20, 30, 50];
    for (const m of milestones) {
      if (state.combo === m && state.lastComboMilestone < m) {
        state.lastComboMilestone = m;
        const labels: Record<number, string> = {
          5: 'NICE!', 10: 'ON FIRE!', 15: 'UNSTOPPABLE!', 20: 'GODLIKE!', 30: 'LEGENDARY!', 50: 'MAXIMUM!'
        };
        const colors: Record<number, string> = {
          5: '#ffcc00', 10: '#ff6600', 15: '#ff0000', 20: '#ff00ff', 30: '#00eaff', 50: '#ffffff'
        };
        spawnFloatingText(state, labels[m], layout.cx, layout.headCy - 80 * layout.scale, colors[m], 32);
        playComboSound(state.combo);
      }
    }

    // Rage mode at 20 combo
    if (state.combo >= 20 && !state.isRageMode) {
      state.isRageMode = true;
      state.rageModeTimer = 300;
      playRageModeSound();
      spawnFloatingText(state, '!!! RAGE MODE !!!', layout.cx, layout.headCy - 110 * layout.scale, '#ff0000', 28);
    }

    // Effects
    spawnHitParticles(state, x, y, state.currentWeapon);
    spawnHitAnimation(state, x, y, zone, state.currentWeapon);

    // Swing animation
    state.swingAnimation = {
      active: true,
      x, y,
      life: 1, maxLife: 1,
      weapon: state.currentWeapon,
      angle: Math.atan2(y - layout.headCy, x - layout.cx),
    };

    // Damage text
    const dmgColor = zone === 'head' ? '#ff4444' : state.isRageMode ? '#ff6600' : '#fff';
    const dmgText = zone === 'head' ? `${damage} 💥` : `${damage}`;
    spawnFloatingText(state, dmgText, x + (Math.random() - 0.5) * 40, y - 20, dmgColor, zone === 'head' ? 26 : 20);

    // Figure shake
    triggerFigureShake(state, Math.min(damage / 5, 8));
    triggerScreenShake(state, Math.min(damage / 10, 6));

    // Play sound + voice reaction
    playHitSound(state.currentWeapon);
    speakHitReaction(state.currentWeapon, zone, state.combo, state.isRageMode, damage);

    // Check weapon unlocks
    const nowUnlocked = getWeaponsToUnlock(state.totalHits);
    for (const id of nowUnlocked) {
      if (!state.unlockedWeapons.has(id)) {
        // Slap (2nd weapon) is gated behind lead capture
        if (id === 'slap' && !hasLeadBeenCaptured()) {
          showLeadModal().then(() => {
            state.unlockedWeapons.add(id);
            const w = WEAPONS[id];
            showUnlockToast(w.name, w.emoji);
            playUnlockSound();
            spawnFloatingText(state, `${w.emoji} ${w.name} UNLOCKED!`, layout.cx, layout.cy - 60, '#ffd700', 22);
            savePersistentData(state);
          }).catch(() => {/* user dismissed — weapon stays locked */});
        } else {
          state.unlockedWeapons.add(id);
          const w = WEAPONS[id];
          showUnlockToast(w.name, w.emoji);
          playUnlockSound();
          spawnFloatingText(state, `${w.emoji} ${w.name} UNLOCKED!`, layout.cx, layout.cy - 60, '#ffd700', 22);
        }
      }
    }

    // KO check
    if (state.hp <= 0) {
      this.triggerKO();
    }

    // Check achievements
    checkAchievements(state, (a) => {
      showAchievementToast(a.title, a.emoji);
    });

    savePersistentData(state);
  }

  private triggerKO(): void {
    const state = this.state;
    state.isKO = true;
    state.koTimer = state.koMaxTimer;
    state.koCount++;
    state.combo = 0;
    state.isRageMode = false;

    const layout = getFigureLayout(this.canvas, state.gender);
    spawnFloatingText(state, 'K.O.!!!', layout.cx, layout.cy - 80 * layout.scale, '#ff0000', 40);
    triggerScreenShake(state, 15);
    playKOSound();
    speakKO();

    // Big particle burst
    for (let i = 0; i < 60; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 3 + Math.random() * 10;
      state.particles.push({
        x: layout.cx,
        y: layout.headCy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 4,
        life: 1, maxLife: 1,
        color: ['#ff0000', '#ff6600', '#ffcc00', '#fff', '#ff3333'][Math.floor(Math.random() * 5)],
        size: 4 + Math.random() * 8,
        shape: 'star',
      });
    }

    savePersistentData(state);
  }

  setGender(gender: 'male' | 'female'): void {
    this.state.gender = gender;
  }

  setWeapon(weapon: WeaponId): void {
    if (this.state.unlockedWeapons.has(weapon)) {
      this.state.currentWeapon = weapon;
    }
  }

  setFace(bitmap: ImageBitmap): void {
    this.state.faceImageBitmap = bitmap;
  }

  getState(): GameState {
    return this.state;
  }

  destroy(): void {
    cancelAnimationFrame(this.rafId);
  }
}
