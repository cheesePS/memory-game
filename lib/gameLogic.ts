import { Difficulty, TimerConfig, ScriptureCard } from './types';

export const TIMER_CONFIG: TimerConfig = {
  beginner: 120,
  intermediate: 90,
  advanced: 45,
};

export const XP_PER_CORRECT = 10;
export const XP_PER_COMBO = 5;
export const XP_PER_GAME_COMPLETE = 50;
export const XP_PER_LEVEL = 200;
export const HINT_PENALTY = 5;
export const TIME_BONUS_THRESHOLD = 0.5; // 50% time remaining
export const TIME_BONUS_MULTIPLIER = 1.5;
export const COMBO_MULTIPLIER_STEP = 3; // every 3 combo = extra multiplier

export function calculateScore(
  correct: number,
  total: number,
  timeRemaining: number,
  totalTime: number,
  comboMax: number,
  hintsUsed: number
): number {
  const baseScore = correct * 100;
  const accuracyBonus = total > 0 ? Math.round((correct / total) * 200) : 0;
  const timeRatio = totalTime > 0 ? timeRemaining / totalTime : 0;
  const timeBonus = timeRatio >= TIME_BONUS_THRESHOLD
    ? Math.round(baseScore * (TIME_BONUS_MULTIPLIER - 1) * timeRatio)
    : 0;
  const comboBonus = Math.floor(comboMax / COMBO_MULTIPLIER_STEP) * 50;
  const hintPenalty = hintsUsed * HINT_PENALTY;

  return Math.max(0, baseScore + accuracyBonus + timeBonus + comboBonus - hintPenalty);
}

export function calculateXP(score: number, comboMax: number, isComplete: boolean): number {
  let xp = Math.floor(score / 10);
  xp += Math.floor(comboMax / COMBO_MULTIPLIER_STEP) * XP_PER_COMBO;
  if (isComplete) xp += XP_PER_GAME_COMPLETE;
  return xp;
}

export function levelFromXP(xp: number): number {
  return Math.floor(xp / XP_PER_LEVEL) + 1;
}

export function xpForCurrentLevel(xp: number): { current: number; needed: number } {
  const currentLevelXP = xp % XP_PER_LEVEL;
  return { current: currentLevelXP, needed: XP_PER_LEVEL };
}

export function generateBlanks(text: string, difficulty: Difficulty): { display: string; blanks: string[] } {
  const words = text.split(' ');
  const totalWords = words.length;

  let blankCount: number;
  switch (difficulty) {
    case 'beginner':
      blankCount = Math.max(1, Math.floor(totalWords * 0.15));
      break;
    case 'intermediate':
      blankCount = Math.max(2, Math.floor(totalWords * 0.3));
      break;
    case 'advanced':
      blankCount = Math.max(3, Math.floor(totalWords * 0.5));
      break;
  }

  // Pick meaningful words to blank (skip short common words)
  const skipWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'is', 'it', 'be', 'as', 'do', 'no', 'not', 'so', 'up', 'if', 'my', 'ye', 'he', 'me']);
  const candidates: number[] = [];
  words.forEach((w, i) => {
    const clean = w.replace(/[^a-zA-Z]/g, '').toLowerCase();
    if (clean.length > 2 && !skipWords.has(clean)) {
      candidates.push(i);
    }
  });

  // Shuffle and pick
  const shuffled = [...candidates].sort(() => Math.random() - 0.5);
  const blankIndices = new Set(shuffled.slice(0, Math.min(blankCount, candidates.length)));

  const blanks: string[] = [];
  const display = words.map((word, i) => {
    if (blankIndices.has(i)) {
      blanks.push(word);
      return '______';
    }
    return word;
  }).join(' ');

  return { display, blanks };
}

export function getHint(word: string): string {
  if (word.length <= 2) return word;
  const clean = word.replace(/[^a-zA-Z]/g, '');
  return clean[0] + '_'.repeat(clean.length - 2) + clean[clean.length - 1];
}

export function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function generateMatchingPairs(cards: ScriptureCard[]): {
  references: { id: string; text: string; cardId: string }[];
  scriptures: { id: string; text: string; cardId: string }[];
} {
  const references = shuffleArray(cards.map(c => ({
    id: `ref-${c.id}`,
    text: c.reference,
    cardId: c.id,
  })));

  const scriptures = shuffleArray(cards.map(c => ({
    id: `scr-${c.id}`,
    text: c.text.length > 80 ? c.text.slice(0, 80) + '...' : c.text,
    cardId: c.id,
  })));

  return { references, scriptures };
}

export function isStreakActive(lastPlayedDate: string): boolean {
  if (!lastPlayedDate) return false;
  const last = new Date(lastPlayedDate);
  const now = new Date();
  const diffMs = now.getTime() - last.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  return diffDays <= 1;
}

export function getToday(): string {
  return new Date().toISOString().split('T')[0];
}

export function getTimerForDifficulty(difficulty: Difficulty): number {
  return TIMER_CONFIG[difficulty];
}

export function getMaxHints(difficulty: Difficulty): number {
  switch (difficulty) {
    case 'beginner': return 5;
    case 'intermediate': return 3;
    case 'advanced': return 0;
  }
}
