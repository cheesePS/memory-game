'use client';

import React, { createContext, useContext, useReducer, useEffect, useCallback, useRef, ReactNode } from 'react';
import {
  UserStats, GameSettings, GameMode, Difficulty, CardProgress, ModeProgress, DeckProgress,
} from '@/lib/types';
import { loadStats, saveStats, loadSettings, saveSettings, defaultStats, defaultSettings } from '@/lib/storage';
import { loadStatsFromDB, saveStatsToDB, loadSettingsFromDB, saveSettingsToDB } from '@/lib/supabaseSync';
import { calculateXP, levelFromXP, isStreakActive, getToday } from '@/lib/gameLogic';
import { checkNewBadges } from '@/lib/badges';
import { decks } from '@/lib/data';
import { useAuth } from '@/contexts/AuthContext';

interface GameState {
  stats: UserStats;
  settings: GameSettings;
  newBadges: string[];
  isLoaded: boolean;
}

type GameAction =
  | { type: 'INIT'; stats: UserStats; settings: GameSettings }
  | { type: 'SET_DIFFICULTY'; difficulty: Difficulty }
  | { type: 'SET_DECK'; deckId: string }
  | { type: 'SET_GAME_MODE'; mode: GameMode }
  | { type: 'SET_SOUND'; enabled: boolean }
  | { type: 'SET_FONT_SIZE'; size: 'small' | 'medium' | 'large' }
  | { type: 'COMPLETE_GAME'; score: number; correct: number; total: number; timeRemaining: number; maxCombo: number; mode: GameMode; deckId: string }
  | { type: 'UPDATE_CARD_PROGRESS'; cardId: string; deckId: string; correct: boolean }
  | { type: 'MASTER_CARD'; cardId: string; deckId: string }
  | { type: 'CLEAR_NEW_BADGES' }
  | { type: 'RESET_DECK_MASTERED'; deckId: string }
  | { type: 'RESET_PROGRESS' };

function ensureDeckProgress(state: UserStats, deckId: string): DeckProgress {
  if (state.deckProgress[deckId]) return state.deckProgress[deckId];
  return {
    deckId,
    cards: {},
    modes: {
      flashcards: { bestScore: 0, bestTime: 0, gamesPlayed: 0, totalCorrect: 0, totalAttempts: 0 },
      matching: { bestScore: 0, bestTime: 0, gamesPlayed: 0, totalCorrect: 0, totalAttempts: 0 },
      'fill-blanks': { bestScore: 0, bestTime: 0, gamesPlayed: 0, totalCorrect: 0, totalAttempts: 0 },
    },
  };
}

function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'INIT':
      return { ...state, stats: action.stats, settings: action.settings, isLoaded: true };

    case 'SET_DIFFICULTY':
      return { ...state, settings: { ...state.settings, difficulty: action.difficulty } };

    case 'SET_DECK':
      return { ...state, settings: { ...state.settings, selectedDeckId: action.deckId } };

    case 'SET_GAME_MODE':
      return { ...state, settings: { ...state.settings, gameMode: action.mode } };

    case 'SET_SOUND':
      return { ...state, settings: { ...state.settings, soundEnabled: action.enabled } };

    case 'SET_FONT_SIZE':
      return { ...state, settings: { ...state.settings, fontSize: action.size } };

    case 'COMPLETE_GAME': {
      const { score, correct, total, timeRemaining, maxCombo, mode, deckId } = action;
      const today = getToday();
      const streakActive = isStreakActive(state.stats.lastPlayedDate);
      const isNewDay = state.stats.lastPlayedDate !== today;
      const newStreak = isNewDay ? (streakActive ? state.stats.dailyStreak + 1 : 1) : state.stats.dailyStreak;
      const xp = calculateXP(score, maxCombo, true);
      const newTotalXP = state.stats.totalXP + xp;
      const newLevel = levelFromXP(newTotalXP);

      // Unlock new decks based on level
      const newUnlocked = [...state.stats.unlockedDecks];
      for (const deck of decks) {
        if (newLevel >= deck.unlockLevel && !newUnlocked.includes(deck.id)) {
          newUnlocked.push(deck.id);
        }
      }

      // Update deck & mode progress
      const dp = ensureDeckProgress(state.stats, deckId);
      const mp: ModeProgress = { ...dp.modes[mode] };
      mp.gamesPlayed += 1;
      mp.totalCorrect += correct;
      mp.totalAttempts += total;
      if (score > mp.bestScore) mp.bestScore = score;
      if (timeRemaining > mp.bestTime) mp.bestTime = timeRemaining;

      const newDeckProgress = {
        ...state.stats.deckProgress,
        [deckId]: { ...dp, modes: { ...dp.modes, [mode]: mp } },
      };

      const newStats: UserStats = {
        ...state.stats,
        totalScore: state.stats.totalScore + score,
        totalXP: newTotalXP,
        level: newLevel,
        dailyStreak: newStreak,
        longestStreak: Math.max(state.stats.longestStreak, newStreak),
        lastPlayedDate: today,
        gamesPlayed: state.stats.gamesPlayed + 1,
        totalCorrectAnswers: state.stats.totalCorrectAnswers + correct,
        totalAttempts: state.stats.totalAttempts + total,
        deckProgress: newDeckProgress,
        unlockedDecks: newUnlocked,
        challengeHighScore: Math.max(state.stats.challengeHighScore, score),
      };

      const newBadgeIds = checkNewBadges(newStats);
      if (newBadgeIds.length > 0) {
        newStats.unlockedBadges = [...newStats.unlockedBadges, ...newBadgeIds];
      }

      return { ...state, stats: newStats, newBadges: newBadgeIds };
    }

    case 'UPDATE_CARD_PROGRESS': {
      const { cardId, deckId, correct } = action;
      const dp = ensureDeckProgress(state.stats, deckId);
      const existing: CardProgress = dp.cards[cardId] || {
        cardId, status: 'new', timesReviewed: 0, timesCorrect: 0, lastReviewed: 0,
      };
      const updated: CardProgress = {
        ...existing,
        timesReviewed: existing.timesReviewed + 1,
        timesCorrect: existing.timesCorrect + (correct ? 1 : 0),
        lastReviewed: Date.now(),
        status: correct && existing.timesCorrect >= 2 ? 'known' : correct ? 'review' : existing.status === 'new' ? 'review' : existing.status,
      };

      const newDeckProgress = {
        ...state.stats.deckProgress,
        [deckId]: { ...dp, cards: { ...dp.cards, [cardId]: updated } },
      };

      // Count mastered/review
      let mastered = 0;
      let inReview = 0;
      Object.values(newDeckProgress).forEach(d => {
        Object.values(d.cards).forEach(c => {
          if (c.status === 'mastered') mastered++;
          else if (c.status === 'review' || c.status === 'known') inReview++;
        });
      });

      return {
        ...state,
        stats: { ...state.stats, deckProgress: newDeckProgress, versesMastered: mastered, versesInReview: inReview },
      };
    }

    case 'MASTER_CARD': {
      const { cardId, deckId } = action;
      const dp = ensureDeckProgress(state.stats, deckId);
      const existing = dp.cards[cardId];
      if (!existing) return state;
      const updated: CardProgress = { ...existing, status: 'mastered' };
      const newDeckProgress = {
        ...state.stats.deckProgress,
        [deckId]: { ...dp, cards: { ...dp.cards, [cardId]: updated } },
      };
      let mastered = 0;
      let inReview = 0;
      Object.values(newDeckProgress).forEach(d => {
        Object.values(d.cards).forEach(c => {
          if (c.status === 'mastered') mastered++;
          else if (c.status === 'review' || c.status === 'known') inReview++;
        });
      });
      return {
        ...state,
        stats: { ...state.stats, deckProgress: newDeckProgress, versesMastered: mastered, versesInReview: inReview },
      };
    }

    case 'RESET_DECK_MASTERED': {
      const { deckId } = action;
      const dp = state.stats.deckProgress[deckId];
      if (!dp) return state;

      // Reset all mastered cards back to 'new'
      const resetCards: Record<string, CardProgress> = {};
      for (const [cardId, card] of Object.entries(dp.cards)) {
        if (card.status === 'mastered') {
          resetCards[cardId] = { ...card, status: 'new', timesReviewed: 0, timesCorrect: 0 };
        } else {
          resetCards[cardId] = card;
        }
      }

      const newDeckProgress = {
        ...state.stats.deckProgress,
        [deckId]: { ...dp, cards: resetCards },
      };

      let mastered = 0;
      let inReview = 0;
      Object.values(newDeckProgress).forEach(d => {
        Object.values(d.cards).forEach(c => {
          if (c.status === 'mastered') mastered++;
          else if (c.status === 'review' || c.status === 'known') inReview++;
        });
      });

      return {
        ...state,
        stats: { ...state.stats, deckProgress: newDeckProgress, versesMastered: mastered, versesInReview: inReview },
      };
    }

    case 'CLEAR_NEW_BADGES':
      return { ...state, newBadges: [] };

    case 'RESET_PROGRESS':
      return { ...state, stats: defaultStats, newBadges: [] };

    default:
      return state;
  }
}

interface GameContextValue {
  state: GameState;
  dispatch: React.Dispatch<GameAction>;
  setDifficulty: (d: Difficulty) => void;
  setDeck: (id: string) => void;
  setGameMode: (m: GameMode) => void;
  completeGame: (score: number, correct: number, total: number, timeRemaining: number, maxCombo: number) => void;
}

const GameContext = createContext<GameContextValue | null>(null);

export function GameProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const [state, dispatch] = useReducer(gameReducer, {
    stats: defaultStats,
    settings: defaultSettings,
    newBadges: [],
    isLoaded: false,
  });

  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevUserIdRef = useRef<string | null>(null);

  // ── INIT: load from Supabase (if logged in) or localStorage ──
  useEffect(() => {
    if (authLoading) return;

    async function init() {
      let stats: UserStats;
      let settings: GameSettings;

      if (user) {
        // Authenticated: load from Supabase, fall back to clean defaults (not localStorage)
        const [dbStats, dbSettings] = await Promise.all([
          loadStatsFromDB(user.id),
          loadSettingsFromDB(user.id),
        ]);
        stats = dbStats ? { ...defaultStats, ...dbStats } : { ...defaultStats };
        settings = dbSettings ? { ...defaultSettings, ...dbSettings } : { ...defaultSettings };
      } else if (prevUserIdRef.current) {
        // Just logged out: reset to clean defaults and clear localStorage
        stats = { ...defaultStats };
        settings = { ...defaultSettings };
        saveStats(stats);
        saveSettings(settings);
      } else {
        // Guest from the start: use localStorage
        stats = loadStats();
        settings = loadSettings();
      }

      dispatch({ type: 'INIT', stats, settings });
      prevUserIdRef.current = user?.id ?? null;
    }

    init();
  }, [user, authLoading]);

  // ── SAVE: persist to localStorage always, debounce to Supabase when logged in ──
  useEffect(() => {
    if (!state.isLoaded) return;

    // Skip saving if the user identity just changed (init hasn't re-run yet)
    const currentUserId = user?.id ?? null;
    if (currentUserId !== prevUserIdRef.current) return;

    // Always cache locally
    saveStats(state.stats);
    saveSettings(state.settings);

    // Debounced cloud save for authenticated users
    if (user) {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(() => {
        saveStatsToDB(user.id, state.stats);
        saveSettingsToDB(user.id, state.settings);
      }, 1000);
    }

    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [state.stats, state.settings, state.isLoaded, user]);

  // Apply font size class to <html> so it cascades to the entire page
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('font-size-small', 'font-size-medium', 'font-size-large');
    root.classList.add(`font-size-${state.settings.fontSize}`);
  }, [state.settings.fontSize]);

  const setDifficulty = useCallback((d: Difficulty) => dispatch({ type: 'SET_DIFFICULTY', difficulty: d }), []);
  const setDeck = useCallback((id: string) => dispatch({ type: 'SET_DECK', deckId: id }), []);
  const setGameMode = useCallback((m: GameMode) => dispatch({ type: 'SET_GAME_MODE', mode: m }), []);

  const completeGame = useCallback((score: number, correct: number, total: number, timeRemaining: number, maxCombo: number) => {
    dispatch({
      type: 'COMPLETE_GAME',
      score, correct, total, timeRemaining, maxCombo,
      mode: state.settings.gameMode,
      deckId: state.settings.selectedDeckId,
    });
  }, [state.settings.gameMode, state.settings.selectedDeckId]);

  return (
    <GameContext.Provider value={{ state, dispatch, setDifficulty, setDeck, setGameMode, completeGame }}>
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame must be used within GameProvider');
  return ctx;
}
