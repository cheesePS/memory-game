'use client';

import React from 'react';
import Link from 'next/link';
import { useGame } from '@/contexts/GameContext';
import { decks } from '@/lib/data';
import { xpForCurrentLevel } from '@/lib/gameLogic';
import ProgressBar from '@/components/ui/ProgressBar';
import {
  BookOpen, Layers, PenTool, Trophy, Flame, Star, ChevronRight, Lock, Zap,
} from 'lucide-react';

const gameModes = [
  {
    id: 'flashcards',
    name: 'Flashcards',
    description: 'Flip cards to learn verse references and scriptures',
    icon: <Layers size={28} />,
    color: 'from-indigo-500 to-blue-500',
    href: '/play/flashcards',
  },
  {
    id: 'matching',
    name: 'Matching Cards',
    description: 'Match verse references to their correct scripture text',
    icon: <BookOpen size={28} />,
    color: 'from-purple-500 to-pink-500',
    href: '/play/matching',
  },
  {
    id: 'fill-blanks',
    name: 'Fill in the Blanks',
    description: 'Complete scriptures by filling in the missing words',
    icon: <PenTool size={28} />,
    color: 'from-emerald-500 to-teal-500',
    href: '/play/fill-blanks',
  },
];

export default function HomePage() {
  const { state } = useGame();
  const { stats, isLoaded } = state;

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin h-8 w-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full" />
      </div>
    );
  }

  const { current: xpCurrent, needed: xpNeeded } = xpForCurrentLevel(stats.totalXP);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-10">
      {/* Hero Section */}
      <section className="text-center space-y-4">
        <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 leading-tight">
          Scripture<span className="text-indigo-600"> Memory</span> Game
        </h1>
        <p className="text-lg text-gray-500 max-w-xl mx-auto">
          Memorize Bible verses through fun, competitive games. Choose a mode, pick a deck, and start mastering God&apos;s Word.
        </p>
      </section>

      {/* Quick Stats */}
      <section className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard icon={<Trophy size={20} className="text-amber-500" />} label="Total Score" value={stats.totalScore.toLocaleString()} />
        <StatCard icon={<Flame size={20} className="text-red-500" />} label="Daily Streak" value={`${stats.dailyStreak} days`} />
        <StatCard icon={<Star size={20} className="text-indigo-500" />} label="Level" value={stats.level.toString()} />
        <StatCard icon={<Zap size={20} className="text-emerald-500" />} label="Mastered" value={`${stats.versesMastered} verses`} />
      </section>

      {/* XP Progress */}
      <section className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold text-gray-600">Level {stats.level} Progress</span>
          <span className="text-sm text-indigo-600 font-bold">{xpCurrent} / {xpNeeded} XP</span>
        </div>
        <ProgressBar value={xpCurrent} max={xpNeeded} showText={false} size="md" />
      </section>

      {/* Game Modes */}
      <section>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Game Modes</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {gameModes.map(mode => (
            <Link
              key={mode.id}
              href={mode.href}
              className="group relative overflow-hidden rounded-2xl bg-gradient-to-br text-white p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${mode.color} opacity-90`} />
              <div className="relative z-10 flex flex-col gap-3">
                <div className="p-3 bg-white/20 rounded-xl w-fit backdrop-blur-sm">
                  {mode.icon}
                </div>
                <h3 className="text-xl font-bold">{mode.name}</h3>
                <p className="text-sm opacity-90 leading-relaxed">{mode.description}</p>
                <div className="flex items-center gap-1 text-sm font-semibold mt-1 group-hover:translate-x-1 transition-transform">
                  Play Now <ChevronRight size={16} />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Decks */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900">Scripture Decks</h2>
          <Link href="/decks" className="text-indigo-600 font-semibold text-sm hover:text-indigo-700 flex items-center gap-1">
            View All <ChevronRight size={16} />
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {decks.slice(0, 6).map(deck => {
            const isUnlocked = stats.unlockedDecks.includes(deck.id);
            return (
              <Link
                key={deck.id}
                href={isUnlocked ? `/decks?deck=${deck.id}` : '#'}
                className={`relative rounded-2xl border-2 p-5 transition-all duration-200 ${
                  isUnlocked
                    ? 'border-gray-100 bg-white hover:border-indigo-200 hover:shadow-md cursor-pointer'
                    : 'border-gray-100 bg-gray-50 opacity-60 cursor-not-allowed'
                }`}
                onClick={e => !isUnlocked && e.preventDefault()}
              >
                <div className="flex items-start gap-3">
                  <span className="text-3xl">{deck.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-gray-900 truncate">{deck.name}</h3>
                      {!isUnlocked && <Lock size={14} className="text-gray-400 flex-shrink-0" />}
                    </div>
                    <p className="text-sm text-gray-500 mt-1 line-clamp-2">{deck.description}</p>
                    <div className="flex items-center gap-2 mt-2 text-xs text-gray-400">
                      <span>{deck.cards.length} cards</span>
                      {!isUnlocked && <span>Unlocks at Lv.{deck.unlockLevel}</span>}
                    </div>
                  </div>
                </div>
                {isUnlocked && (
                  <div className="absolute top-3 right-3 w-2 h-2 rounded-full bg-emerald-400" />
                )}
              </Link>
            );
          })}
        </div>
      </section>

      {/* Daily Tip */}
      <section className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl p-6 border border-amber-100">
        <div className="flex items-start gap-4">
          <span className="text-4xl">💡</span>
          <div>
            <h3 className="font-bold text-gray-900 text-lg">Daily Tip</h3>
            <p className="text-gray-600 mt-1">
              Try the <strong>Fill in the Blanks</strong> mode for the most effective memorization.
              Studies show that active recall strengthens memory more than passive reading!
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
      <div className="flex items-center gap-2 mb-1">
        {icon}
        <span className="text-xs text-gray-400 uppercase tracking-wider">{label}</span>
      </div>
      <p className="text-xl font-bold text-gray-900">{value}</p>
    </div>
  );
}
