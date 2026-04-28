import type { Weapon, WeaponId } from './types';

export const WEAPONS: Record<WeaponId, Weapon> = {
  fist: {
    id: 'fist',
    name: 'Fist',
    damage: 5,
    unlockAt: 0,
    emoji: '👊',
    swingColor: '#ffcc00',
    swingWidth: 8,
  },
  slap: {
    id: 'slap',
    name: 'Slap',
    damage: 9,
    unlockAt: 30,
    emoji: '👋',
    swingColor: '#ff9999',
    swingWidth: 10,
  },
  bat: {
    id: 'bat',
    name: 'Bat',
    damage: 18,
    unlockAt: 80,
    emoji: '🏏',
    swingColor: '#8B4513',
    swingWidth: 12,
  },
  hammer: {
    id: 'hammer',
    name: 'Hammer',
    damage: 30,
    unlockAt: 180,
    emoji: '🔨',
    swingColor: '#666',
    swingWidth: 14,
  },
  katana: {
    id: 'katana',
    name: 'Katana',
    damage: 45,
    unlockAt: 350,
    emoji: '⚔️',
    swingColor: '#00eaff',
    swingWidth: 3,
  },
  rocket: {
    id: 'rocket',
    name: 'Rocket',
    damage: 120,
    unlockAt: 600,
    emoji: '🚀',
    swingColor: '#ff6600',
    swingWidth: 16,
  },
};

export const WEAPON_ORDER: WeaponId[] = ['fist', 'slap', 'bat', 'hammer', 'katana', 'rocket'];

export function getWeaponsToUnlock(totalHits: number): WeaponId[] {
  return WEAPON_ORDER.filter(id => totalHits >= WEAPONS[id].unlockAt);
}

export function getNextUnlock(totalHits: number): { weapon: Weapon; hitsLeft: number } | null {
  const next = WEAPON_ORDER.find(id => WEAPONS[id].unlockAt > totalHits);
  if (!next) return null;
  return { weapon: WEAPONS[next], hitsLeft: WEAPONS[next].unlockAt - totalHits };
}
