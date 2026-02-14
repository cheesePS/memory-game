'use client';

import React from 'react';
import Link from 'next/link';
import { useGame } from '@/contexts/GameContext';
import { decks, getDeckById } from '@/lib/data';
import { badges } from '@/lib/badges';
import { xpForCurrentLevel } from '@/lib/gameLogic';
import { loadLeaderboard } from '@/lib/storage';
import ProgressBar from '@/components/ui/ProgressBar';
import BadgeDisplay from '@/components/ui/Badge';
import {
  ArrowLeft, Trophy, Flame, Star, Target, BookOpen, Zap, Clock, Award,
} from 'lucide-react';

export default function StatsPage() {
  const { state } = useGame();
  const { stats } = state;
  const { current: xpCurrent, needed: xpNeeded } = xpForCurrentLevel(stats.totalXP);
  const accuracy = stats.totalAttempts > 0 ? Math.round((stats.totalCorrectAnswers / stats.totalAttempts) * 100) : 0;
  const leaderboard = loadLeaderboard();

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      <div className="flex items-center gap-3">
        <Link href="/" className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
          <ArrowLeft size={20} className="text-gray-600" />
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">Your Progress</h1>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatBox icon={<Trophy size={20} className="text-amber-500" />} label="Total Score" value={stats.totalScore.toLocaleString()} />
        <StatBox icon={<Star size={20} className="text-indigo-500" />} label="Level" value={stats.level.toString()} />
        <StatBox icon={<Flame size={20} className="text-red-500" />} label="Daily Streak" value={`${stats.dailyStreak} days`} />
        <StatBox icon={<Zap size={20} className="text-emerald-500" />} label="Total XP" value={stats.totalXP.toLocaleString()} />
        <StatBox icon={<Target size={20} className="text-purple-500" />} label="Accuracy" value={`${accuracy}%`} />
        <StatBox icon={<BookOpen size={20} className="text-blue-500" />} label="Games Played" value={stats.gamesPlayed.toString()} />
        <StatBox icon={<Award size={20} className="text-amber-500" />} label="Verses Mastered" value={stats.versesMastered.toString()} />
        <StatBox icon={<Clock size={20} className="text-gray-500" />} label="Longest Streak" value={`${stats.longestStreak} days`} />
      </div>

      {/* Level Progress */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
        <h2 className="text-lg font-bold text-gray-900 mb-3">Level {stats.level} Progress</h2>
        <ProgressBar value={xpCurrent} max={xpNeeded} label={`${xpCurrent} / ${xpNeeded} XP to next level`} />
      </div>

      {/* Deck Progress */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-4">Deck Progress</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {decks.map(deck => {
            const isUnlocked = stats.unlockedDecks.includes(deck.id);
            const dp = stats.deckProgress[deck.id];
            const mastered = dp ? Object.values(dp.cards).filter(c => c.status === 'mastered').length : 0;
            const known = dp ? Object.values(dp.cards).filter(c => c.status === 'known').length : 0;
            const reviewed = dp ? Object.values(dp.cards).filter(c => c.status === 'review').length : 0;
            const total = deck.cards.length;

            return (
              <div key={deck.id} className={`rounded-xl border p-4 ${isUnlocked ? 'bg-white border-gray-100' : 'bg-gray-50 border-gray-100 opacity-50'}`}>
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-2xl">{deck.icon}</span>
                  <div>
                    <h3 className="font-bold text-gray-900">{deck.name}</h3>
                    <p className="text-xs text-gray-400">{total} cards</p>
                  </div>
                </div>
                {isUnlocked ? (
                  <>
                    <ProgressBar value={mastered} max={total} size="sm" color="bg-emerald-500" showText={false} />
                    <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                      <span className="text-emerald-600">{mastered} mastered</span>
                      <span className="text-blue-500">{known} known</span>
                      <span className="text-amber-500">{reviewed} in review</span>
                    </div>
                    {dp && (
                      <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                        {(['flashcards', 'matching', 'fill-blanks'] as const).map(mode => (
                          <div key={mode} className="text-center bg-gray-50 rounded-lg p-2">
                            <p className="font-semibold text-gray-700 capitalize">{mode.replace('-', ' ')}</p>
                            <p className="text-gray-400">{dp.modes[mode]?.gamesPlayed || 0} games</p>
                            <p className="text-indigo-600 font-bold">{dp.modes[mode]?.bestScore || 0} best</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <p className="text-sm text-gray-400">Unlocks at Level {deck.unlockLevel}</p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Badges */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-4">Badges ({stats.unlockedBadges.length}/{badges.length})</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {badges.map(badge => (
            <BadgeDisplay
              key={badge.id}
              icon={badge.icon}
              name={badge.name}
              description={badge.description}
              unlocked={stats.unlockedBadges.includes(badge.id)}
            />
          ))}
        </div>
      </div>

      {/* Leaderboard */}
      {leaderboard.length > 0 && (
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-4">Leaderboard (Local)</h2>
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">#</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Score</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Mode</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Date</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.slice(0, 10).map((entry, i) => (
                  <tr key={i} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="px-4 py-3 font-bold text-gray-700">
                      {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}
                    </td>
                    <td className="px-4 py-3 font-bold text-indigo-600">{entry.score}</td>
                    <td className="px-4 py-3 text-sm text-gray-500 capitalize">{entry.mode.replace('-', ' ')}</td>
                    <td className="px-4 py-3 text-sm text-gray-400">{entry.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function StatBox({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm text-center">
      <div className="flex justify-center mb-2">{icon}</div>
      <p className="text-xl font-bold text-gray-900">{value}</p>
      <p className="text-xs text-gray-400 mt-1">{label}</p>
    </div>
  );
}
