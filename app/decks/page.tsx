'use client';

import React from 'react';
import Link from 'next/link';
import { useGame } from '@/contexts/GameContext';
import { decks } from '@/lib/data';
import Button from '@/components/ui/Button';
import { Lock, ArrowLeft, Layers, BookOpen, PenTool } from 'lucide-react';

export default function DecksPage() {
  const { state, setDeck } = useGame();
  const { stats } = state;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/" className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
          <ArrowLeft size={20} className="text-gray-600" />
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">Scripture Decks</h1>
      </div>

      <p className="text-gray-500">
        Choose a deck to practice. Unlock more decks by leveling up through gameplay!
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {decks.map(deck => {
          const isUnlocked = stats.unlockedDecks.includes(deck.id);
          const dp = stats.deckProgress[deck.id];
          const masteredCount = dp ? Object.values(dp.cards).filter(c => c.status === 'mastered').length : 0;
          const totalCards = deck.cards.length;

          return (
            <div
              key={deck.id}
              className={`rounded-2xl border-2 p-6 transition-all duration-200 ${
                isUnlocked
                  ? 'border-gray-100 bg-white shadow-sm hover:shadow-md'
                  : 'border-gray-100 bg-gray-50 opacity-50'
              }`}
            >
              <div className="flex items-start gap-4">
                <div
                  className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
                  style={{ backgroundColor: deck.color + '15' }}
                >
                  {deck.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-bold text-gray-900">{deck.name}</h2>
                    {!isUnlocked && <Lock size={16} className="text-gray-400" />}
                  </div>
                  <p className="text-sm text-gray-500 mt-1">{deck.description}</p>
                  <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                    <span>{totalCards} cards</span>
                    {isUnlocked && <span>{masteredCount}/{totalCards} mastered</span>}
                    {!isUnlocked && <span>Unlocks at Level {deck.unlockLevel}</span>}
                  </div>

                  {/* Progress */}
                  {isUnlocked && (
                    <div className="mt-3 w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${(masteredCount / totalCards) * 100}%`,
                          backgroundColor: deck.color,
                        }}
                      />
                    </div>
                  )}

                  {/* Play Buttons */}
                  {isUnlocked && (
                    <div className="flex flex-wrap gap-2 mt-4">
                      <Link href="/play/flashcards" onClick={() => setDeck(deck.id)}>
                        <Button variant="secondary" size="sm">
                          <Layers size={14} /> Flashcards
                        </Button>
                      </Link>
                      <Link href="/play/matching" onClick={() => setDeck(deck.id)}>
                        <Button variant="secondary" size="sm">
                          <BookOpen size={14} /> Matching
                        </Button>
                      </Link>
                      <Link href="/play/fill-blanks" onClick={() => setDeck(deck.id)}>
                        <Button variant="secondary" size="sm">
                          <PenTool size={14} /> Fill Blanks
                        </Button>
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
