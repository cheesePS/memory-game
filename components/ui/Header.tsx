'use client';

import React from 'react';
import Link from 'next/link';
import { useGame } from '@/contexts/GameContext';
import { useAuth } from '@/contexts/AuthContext';
import { xpForCurrentLevel } from '@/lib/gameLogic';
import { BookOpen, BarChart3, Settings, Flame, Trophy, LogIn, LogOut } from 'lucide-react';

export default function Header() {
  const { state } = useGame();
  const { user, signOut, loading } = useAuth();
  const { stats } = state;
  const { current, needed } = xpForCurrentLevel(stats.totalXP);

  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-100">
      <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          <BookOpen size={28} className="text-indigo-600 group-hover:scale-110 transition-transform" />
          <span className="font-bold text-lg text-gray-900 hidden sm:inline">Scripture Memory</span>
        </Link>

        <div className="flex items-center gap-1 sm:gap-2">
          {/* XP / Level */}
          <div className="hidden sm:flex items-center gap-2 bg-indigo-50 rounded-full px-3 py-1.5">
            <Trophy size={16} className="text-indigo-600" />
            <span className="text-sm font-bold text-indigo-700">Lv.{stats.level}</span>
            <div className="w-16 h-1.5 bg-indigo-200 rounded-full overflow-hidden">
              <div className="h-full bg-indigo-500 rounded-full transition-all duration-500" style={{ width: `${(current / needed) * 100}%` }} />
            </div>
          </div>

          {/* Streak */}
          {stats.dailyStreak > 0 && (
            <div className="flex items-center gap-1 bg-amber-50 rounded-full px-3 py-1.5">
              <Flame size={16} className="text-amber-500" />
              <span className="text-sm font-bold text-amber-700">{stats.dailyStreak}</span>
            </div>
          )}

          {/* Score */}
          <div className="hidden sm:flex items-center gap-1 bg-emerald-50 rounded-full px-3 py-1.5">
            <span className="text-sm font-bold text-emerald-700">{stats.totalScore.toLocaleString()} pts</span>
          </div>

          <nav className="flex items-center gap-1 ml-2">
            <Link href="/stats" className="p-2 rounded-lg hover:bg-gray-100 transition-colors" aria-label="Statistics">
              <BarChart3 size={20} className="text-gray-600" />
            </Link>
            <Link href="/settings" className="p-2 rounded-lg hover:bg-gray-100 transition-colors" aria-label="Settings">
              <Settings size={20} className="text-gray-600" />
            </Link>

            {/* Auth */}
            {!loading && (
              user ? (
                <div className="flex items-center gap-1.5 ml-1">
                  <span className="hidden md:inline text-xs text-gray-500 max-w-[120px] truncate">{user.email}</span>
                  <button
                    onClick={() => signOut()}
                    className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                    aria-label="Sign out"
                  >
                    <LogOut size={20} className="text-gray-600" />
                  </button>
                </div>
              ) : (
                <Link href="/login" className="flex items-center gap-1 ml-1 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors">
                  <LogIn size={16} />
                  <span className="hidden sm:inline">Login</span>
                </Link>
              )
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}
