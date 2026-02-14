'use client';

import React, { useState, useCallback } from 'react';
import Link from 'next/link';
import { useGame } from '@/contexts/GameContext';
import { getDeckById } from '@/lib/data';
import { calculateScore, getTimerForDifficulty } from '@/lib/gameLogic';
import MatchingGame from '@/components/game/MatchingGame';
import GameComplete from '@/components/game/GameComplete';
import DifficultySelector from '@/components/game/DifficultySelector';
import Button from '@/components/ui/Button';
import { ArrowLeft, Play } from 'lucide-react';

export default function MatchingPage() {
  const { state, setDifficulty, setDeck, completeGame } = useGame();
  const { settings, stats } = state;
  const [started, setStarted] = useState(false);
  const [gameResult, setGameResult] = useState<{
    correct: number; total: number; timeRemaining: number; maxCombo: number;
  } | null>(null);

  const deck = getDeckById(settings.selectedDeckId);
  const totalTime = getTimerForDifficulty(settings.difficulty);

  const handleComplete = useCallback((correct: number, total: number, timeRemaining: number, maxCombo: number) => {
    const score = calculateScore(correct, total, timeRemaining, totalTime, maxCombo, 0);
    setGameResult({ correct, total, timeRemaining, maxCombo });
    completeGame(score, correct, total, timeRemaining, maxCombo);
  }, [completeGame, totalTime]);

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
          timeRemaining={gameResult.timeRemaining}
          totalTime={totalTime}
          maxCombo={gameResult.maxCombo}
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
          <h1 className="text-3xl font-bold text-gray-900">Matching Cards</h1>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-600 mb-2">Select Deck</label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {stats.unlockedDecks.map(id => {
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

        <div>
          <label className="block text-sm font-semibold text-gray-600 mb-2">Difficulty</label>
          <DifficultySelector value={settings.difficulty} onChange={setDifficulty} />
        </div>

        <Button size="lg" className="w-full" onClick={() => setStarted(true)}>
          <Play size={20} /> Start Matching
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => setStarted(false)} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
          <ArrowLeft size={20} className="text-gray-600" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-gray-900">{deck.name}</h1>
          <p className="text-sm text-gray-400">Matching Cards - {settings.difficulty}</p>
        </div>
      </div>
      <MatchingGame cards={deck.cards} difficulty={settings.difficulty} onComplete={handleComplete} />
    </div>
  );
}
