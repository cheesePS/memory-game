import { Badge, UserStats } from './types';

export const badges: Badge[] = [
  {
    id: 'first-steps',
    name: 'First Steps',
    description: 'Complete your first game',
    icon: '🎯',
    requirement: (s: UserStats) => s.gamesPlayed >= 1,
  },
  {
    id: 'verse-master',
    name: 'Verse Master',
    description: 'Master 5 verses',
    icon: '📜',
    requirement: (s: UserStats) => s.versesMastered >= 5,
  },
  {
    id: 'speed-memorizer',
    name: 'Speed Memorizer',
    description: 'Score over 500 in a single game',
    icon: '⚡',
    requirement: (s: UserStats) => s.totalScore >= 500,
  },
  {
    id: 'streak-warrior',
    name: 'Streak Warrior',
    description: 'Maintain a 3-day streak',
    icon: '🔥',
    requirement: (s: UserStats) => s.dailyStreak >= 3,
  },
  {
    id: 'dedicated-learner',
    name: 'Dedicated Learner',
    description: 'Play 10 games',
    icon: '📚',
    requirement: (s: UserStats) => s.gamesPlayed >= 10,
  },
  {
    id: 'perfectionist',
    name: 'Perfectionist',
    description: 'Achieve 100% accuracy in a round',
    icon: '💎',
    requirement: (s: UserStats) => s.totalAttempts > 0 && s.totalCorrectAnswers >= 3,
  },
  {
    id: 'scholar',
    name: 'Scholar',
    description: 'Reach level 5',
    icon: '🎓',
    requirement: (s: UserStats) => s.level >= 5,
  },
  {
    id: 'champion',
    name: 'Champion',
    description: 'Score over 2000 total points',
    icon: '🏆',
    requirement: (s: UserStats) => s.totalScore >= 2000,
  },
  {
    id: 'streak-legend',
    name: 'Streak Legend',
    description: 'Maintain a 7-day streak',
    icon: '👑',
    requirement: (s: UserStats) => s.longestStreak >= 7,
  },
  {
    id: 'all-decks',
    name: 'Explorer',
    description: 'Unlock all 12 decks',
    icon: '🗺️',
    requirement: (s: UserStats) => s.unlockedDecks.length >= 12,
  },
];

export function checkNewBadges(stats: UserStats): string[] {
  const newBadges: string[] = [];
  for (const badge of badges) {
    if (!stats.unlockedBadges.includes(badge.id) && badge.requirement(stats)) {
      newBadges.push(badge.id);
    }
  }
  return newBadges;
}

export function getBadgeById(id: string): Badge | undefined {
  return badges.find(b => b.id === id);
}
