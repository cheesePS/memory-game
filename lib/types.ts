export interface ScriptureCard {
  id: string;
  reference: string;
  hint: string;
  text: string;
  deckId: string;
}

export interface Deck {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  cards: ScriptureCard[];
  unlockLevel: number;
}

export type GameMode = 'flashcards' | 'matching' | 'fill-blanks';
export type Difficulty = 'beginner' | 'intermediate' | 'advanced';
export type CardStatus = 'new' | 'review' | 'known' | 'mastered';

export interface GameSettings {
  difficulty: Difficulty;
  selectedDeckId: string;
  gameMode: GameMode;
  soundEnabled: boolean;
  fontSize: 'small' | 'medium' | 'large';
}

export interface TimerConfig {
  beginner: number;
  intermediate: number;
  advanced: number;
}

export interface GameRound {
  score: number;
  timeRemaining: number;
  totalTime: number;
  comboStreak: number;
  maxCombo: number;
  correctAnswers: number;
  totalQuestions: number;
  isComplete: boolean;
  isPaused: boolean;
}

export interface CardProgress {
  cardId: string;
  status: CardStatus;
  timesReviewed: number;
  timesCorrect: number;
  lastReviewed: number;
}

export interface ModeProgress {
  bestScore: number;
  bestTime: number;
  gamesPlayed: number;
  totalCorrect: number;
  totalAttempts: number;
}

export interface DeckProgress {
  deckId: string;
  cards: Record<string, CardProgress>;
  modes: Record<GameMode, ModeProgress>;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  requirement: (stats: UserStats) => boolean;
  unlockedAt?: number;
}

export interface UserStats {
  totalScore: number;
  totalXP: number;
  level: number;
  dailyStreak: number;
  longestStreak: number;
  lastPlayedDate: string;
  gamesPlayed: number;
  totalCorrectAnswers: number;
  totalAttempts: number;
  versesMastered: number;
  versesInReview: number;
  deckProgress: Record<string, DeckProgress>;
  unlockedBadges: string[];
  unlockedDecks: string[];
  challengeHighScore: number;
}

export interface LeaderboardEntry {
  name: string;
  score: number;
  date: string;
  mode: GameMode;
}

export interface ShareData {
  type: 'deck_complete' | 'high_score' | 'streak' | 'badge';
  title: string;
  verse?: string;
  score?: number;
  streak?: number;
  badgeName?: string;
}
