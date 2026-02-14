'use client';

import React, { useState, useCallback } from 'react';
import Link from 'next/link';
import { useGame } from '@/contexts/GameContext';
import { getDeckById } from '@/lib/data';
import FlashcardGame, { type FlashcardMode } from '@/components/game/FlashcardGame';
import GameComplete from '@/components/game/GameComplete';
import Button from '@/components/ui/Button';
import { ArrowLeft, Play, RotateCcw, Hand, Zap, BookOpen, Volume2, VolumeX } from 'lucide-react';

const FLASHCARD_MODES: { id: FlashcardMode; label: string; sub: string; icon: React.ReactNode }[] = [
  { id: 'manual', label: 'Manual', sub: 'Work at your own pace', icon: <Hand size={20} /> },
  { id: 'auto-verses', label: 'Automatic Verses', sub: 'Quote the scripture as fast as you can', icon: <Zap size={20} /> },
  { id: 'auto-scripture', label: 'Automatic Scripture', sub: 'Quote the verse as fast as you can', icon: <BookOpen size={20} /> },
];

export default function FlashcardsPage() {
  const { state, dispatch, setDeck, completeGame } = useGame();
  const { settings, stats } = state;
  const [started, setStarted] = useState(false);
  const [gameKey, setGameKey] = useState(0);
  const [gameResult, setGameResult] = useState<{ correct: number; total: number } | null>(null);
  const [flashcardMode, setFlashcardMode] = useState<FlashcardMode>('manual');
  const [voiceEnabled, setVoiceEnabled] = useState(false);

  const deck = getDeckById(settings.selectedDeckId);
  const availableDecks = stats.unlockedDecks;

  const handleComplete = useCallback((correct: number, total: number) => {
    setGameResult({ correct, total });
    completeGame(correct * 100, correct, total, 0, 0);
  }, [completeGame]);

  const handlePlayAgain = useCallback(() => {
    setGameKey(k => k + 1);
  }, []);

  if (!deck) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8 text-center">
        <p className="text-gray-500">Please select a deck first.</p>
        <Link href="/decks"><Button className="mt-4">Choose Deck</Button></Link>
      </div>
    );
  }

  if (gameResult) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <GameComplete
          correct={gameResult.correct}
          total={gameResult.total}
          timeRemaining={0}
          totalTime={0}
          maxCombo={0}
        />
      </div>
    );
  }

  if (!started) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        <div className="flex items-center gap-3">
          <Link href="/" className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
            <ArrowLeft size={20} className="text-gray-600" />
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Flashcards</h1>
        </div>

        {/* Deck Selector */}
        <div>
          <label className="block text-sm font-semibold text-gray-600 mb-2">Select Deck</label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {availableDecks.map(id => {
              const d = getDeckById(id);
              if (!d) return null;
              return (
                <button
                  key={id}
                  onClick={() => setDeck(id)}
                  className={`p-3 rounded-xl border-2 text-left transition-all cursor-pointer ${
                    settings.selectedDeckId === id
                      ? 'border-indigo-500 bg-indigo-50'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <span className="text-xl">{d.icon}</span>
                  <p className="text-sm font-semibold mt-1 text-gray-800">{d.name}</p>
                  <p className="text-xs text-gray-400">{d.cards.length} cards</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Mode Selector */}
        <div>
          <label className="block text-sm font-semibold text-gray-600 mb-2">Mode</label>
          <div className="grid gap-2">
            {FLASHCARD_MODES.map(m => {
              const isSelected = flashcardMode === m.id;
              const isAutoMode = m.id !== 'manual';
              return (
                <div
                  key={m.id}
                  className={`rounded-xl border-2 transition-all ${
                    isSelected
                      ? 'border-indigo-500 bg-indigo-50'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <button
                    onClick={() => setFlashcardMode(m.id)}
                    className="flex items-center gap-3 p-4 w-full text-left cursor-pointer"
                  >
                    <div className={`p-2 rounded-lg ${isSelected ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-100 text-gray-500'}`}>
                      {m.icon}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-gray-800">{m.label}</p>
                      <p className="text-xs text-gray-400">{m.sub}</p>
                    </div>
                  </button>
                  {isAutoMode && isSelected && (
                    <div className="px-4 pb-3">
                      <button
                        onClick={() => setVoiceEnabled(v => !v)}
                        className={`flex items-center gap-2 w-full px-3 py-2 rounded-lg text-left transition-all cursor-pointer ${
                          voiceEnabled
                            ? 'bg-indigo-100 text-indigo-700'
                            : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                        }`}
                      >
                        {voiceEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
                        <span className="text-xs font-medium">Voice {voiceEnabled ? 'On' : 'Off'}</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <Button size="lg" className="w-full" onClick={() => setStarted(true)}>
          <Play size={20} /> Start Flashcards
        </Button>
      </div>
    );
  }

  const isAuto = flashcardMode !== 'manual';

  // Filter out mastered cards (manual mode only)
  const deckProgress = stats.deckProgress[deck.id];
  const unmasteredCards = deck.cards.filter(c => {
    const cp = deckProgress?.cards[c.id];
    return !cp || cp.status !== 'mastered';
  });

  // Auto modes use all cards; manual uses only unmastered
  const gameCards = isAuto ? deck.cards : unmasteredCards;

  if (!isAuto && unmasteredCards.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8 text-center space-y-6">
        <div className="flex items-center gap-3">
          <button onClick={() => setStarted(false)} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
            <ArrowLeft size={20} className="text-gray-600" />
          </button>
          <h1 className="text-xl font-bold text-gray-900">{deck.name}</h1>
        </div>
        <div className="py-12 space-y-4">
          <p className="text-5xl">🎉</p>
          <h2 className="text-2xl font-bold text-gray-900">All Cards Mastered!</h2>
          <p className="text-gray-500">You have mastered all {deck.cards.length} cards in this deck.</p>
          <Button
            variant="secondary"
            onClick={() => dispatch({ type: 'RESET_DECK_MASTERED', deckId: deck.id })}
          >
            <RotateCcw size={16} /> Reset & Study Again
          </Button>
        </div>
      </div>
    );
  }

  const modeLabel = FLASHCARD_MODES.find(m => m.id === flashcardMode)?.label ?? 'Flashcards';
  const totalMastered = deck.cards.filter(c => {
    const cp = deckProgress?.cards[c.id];
    return cp?.status === 'mastered';
  }).length;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => setStarted(false)} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
          <ArrowLeft size={20} className="text-gray-600" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-gray-900">{deck.name}</h1>
          <p className="text-sm text-gray-400">{modeLabel} &middot; {gameCards.length} cards &middot; {totalMastered}/{deck.cards.length} mastered</p>
        </div>
      </div>
      <FlashcardGame key={gameKey} cards={gameCards} deckId={deck.id} mode={flashcardMode} voiceEnabled={voiceEnabled} onComplete={handleComplete} onPlayAgain={handlePlayAgain} />
    </div>
  );
}
