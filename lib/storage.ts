import { UserStats, LeaderboardEntry, GameSettings } from './types';

const STORAGE_KEYS = {
  stats: 'scripture-game-stats',
  settings: 'scripture-game-settings',
  leaderboard: 'scripture-game-leaderboard',
} as const;

export const defaultStats: UserStats = {
  totalScore: 0,
  totalXP: 0,
  level: 1,
  dailyStreak: 0,
  longestStreak: 0,
  lastPlayedDate: '',
  gamesPlayed: 0,
  totalCorrectAnswers: 0,
  totalAttempts: 0,
  versesMastered: 0,
  versesInReview: 0,
  deckProgress: {},
  unlockedBadges: [],
  unlockedDecks: ['foundation', 'salvation'],
  challengeHighScore: 0,
};

export const defaultSettings: GameSettings = {
  difficulty: 'beginner',
  selectedDeckId: 'foundation',
  gameMode: 'flashcards',
  soundEnabled: true,
  fontSize: 'medium',
};

function isBrowser(): boolean {
  return typeof window !== 'undefined';
}

export function loadStats(): UserStats {
  if (!isBrowser()) return defaultStats;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.stats);
    if (!raw) return defaultStats;
    return { ...defaultStats, ...JSON.parse(raw) };
  } catch {
    return defaultStats;
  }
}

export function saveStats(stats: UserStats): void {
  if (!isBrowser()) return;
  try {
    localStorage.setItem(STORAGE_KEYS.stats, JSON.stringify(stats));
  } catch {
    // Storage full or unavailable
  }
}

export function loadSettings(): GameSettings {
  if (!isBrowser()) return defaultSettings;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.settings);
    if (!raw) return defaultSettings;
    return { ...defaultSettings, ...JSON.parse(raw) };
  } catch {
    return defaultSettings;
  }
}

export function saveSettings(settings: GameSettings): void {
  if (!isBrowser()) return;
  try {
    localStorage.setItem(STORAGE_KEYS.settings, JSON.stringify(settings));
  } catch {
    // Storage full or unavailable
  }
}

export function loadLeaderboard(): LeaderboardEntry[] {
  if (!isBrowser()) return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.leaderboard);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveLeaderboardEntry(entry: LeaderboardEntry): void {
  if (!isBrowser()) return;
  try {
    const board = loadLeaderboard();
    board.push(entry);
    board.sort((a, b) => b.score - a.score);
    const trimmed = board.slice(0, 50);
    localStorage.setItem(STORAGE_KEYS.leaderboard, JSON.stringify(trimmed));
  } catch {
    // Storage full or unavailable
  }
}
