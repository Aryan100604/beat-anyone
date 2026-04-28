import type { Achievement, GameState } from './types';

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first_blood',
    title: 'First Blood!',
    emoji: '🩸',
    check: (s) => s.totalHits >= 1,
  },
  {
    id: 'combo_5',
    title: 'Combo King x5!',
    emoji: '🔥',
    check: (s) => s.combo >= 5,
  },
  {
    id: 'combo_10',
    title: 'ON FIRE! x10!',
    emoji: '💥',
    check: (s) => s.combo >= 10,
  },
  {
    id: 'combo_20',
    title: 'UNSTOPPABLE x20!',
    emoji: '⚡',
    check: (s) => s.combo >= 20,
  },
  {
    id: 'first_ko',
    title: 'First KO!',
    emoji: '💀',
    check: (s) => s.koCount >= 1,
  },
  {
    id: 'ko_5',
    title: 'KO Machine x5!',
    emoji: '👊',
    check: (s) => s.koCount >= 5,
  },
  {
    id: 'ko_10',
    title: 'KO Artist x10!',
    emoji: '🎯',
    check: (s) => s.koCount >= 10,
  },
  {
    id: 'rage_mode',
    title: 'RAGE MODE!',
    emoji: '😡',
    check: (s) => s.isRageMode,
  },
  {
    id: 'arsenal',
    title: 'Full Arsenal!',
    emoji: '🔫',
    check: (s) => s.unlockedWeapons.size === 6,
  },
  {
    id: 'score_1000',
    title: 'Score 1,000!',
    emoji: '⭐',
    check: (s) => s.score >= 1000,
  },
  {
    id: 'score_10000',
    title: 'Score 10,000!',
    emoji: '🌟',
    check: (s) => s.score >= 10000,
  },
  {
    id: 'headhunter',
    title: 'Headhunter!',
    emoji: '🎯',
    check: (s) => s.totalHits >= 50,
  },
];

export function checkAchievements(state: GameState, onUnlock: (a: Achievement) => void): void {
  for (const achievement of ACHIEVEMENTS) {
    if (!state.unlockedAchievements.has(achievement.id) && achievement.check(state)) {
      state.unlockedAchievements.add(achievement.id);
      onUnlock(achievement);
    }
  }
}
