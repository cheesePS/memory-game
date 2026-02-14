'use client';

import React, { useState } from 'react';
import { useGame } from '@/contexts/GameContext';
import { calculateScore } from '@/lib/gameLogic';
import { getDeckById } from '@/lib/data';
import { getBadgeById } from '@/lib/badges';
import { shareToFacebook, shareToTwitter, shareToWhatsApp, shareNative, copyToClipboard } from '@/lib/sharing';
import { ShareData } from '@/lib/types';
import Button from '@/components/ui/Button';
import BadgeDisplay from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import Link from 'next/link';
import { Trophy, RotateCcw, Home, Share2, Copy, CheckCheck } from 'lucide-react';

interface GameCompleteProps {
  correct: number;
  total: number;
  timeRemaining: number;
  totalTime: number;
  maxCombo: number;
  hintsUsed?: number;
}

export default function GameComplete({ correct, total, timeRemaining, totalTime, maxCombo, hintsUsed = 0 }: GameCompleteProps) {
  const { state } = useGame();
  const [shareOpen, setShareOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const score = calculateScore(correct, total, timeRemaining, totalTime, maxCombo, hintsUsed);
  const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;
  const deck = getDeckById(state.settings.selectedDeckId);

  const shareData: ShareData = {
    type: 'high_score',
    title: deck ? `${deck.name} - ${state.settings.gameMode}` : 'Scripture Memory Game',
    score,
  };

  const newBadges = state.newBadges.map(id => getBadgeById(id)).filter(Boolean);

  const handleCopy = () => {
    copyToClipboard(shareData);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-lg mx-auto animate-fadeIn">
      {/* Celebration Header */}
      <div className="text-center">
        <div className="text-6xl mb-3 animate-bounce">
          {accuracy >= 80 ? '🎉' : accuracy >= 50 ? '👏' : '💪'}
        </div>
        <h2 className="text-3xl font-bold text-gray-900">
          {accuracy >= 80 ? 'Excellent!' : accuracy >= 50 ? 'Good Job!' : 'Keep Practicing!'}
        </h2>
      </div>

      {/* Score Card */}
      <div className="w-full bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-6 text-white shadow-xl">
        <div className="flex items-center justify-center gap-2 mb-4">
          <Trophy size={24} />
          <span className="text-4xl font-bold">{score}</span>
          <span className="text-indigo-200 text-lg">pts</span>
        </div>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold">{accuracy}%</p>
            <p className="text-indigo-200 text-sm">Accuracy</p>
          </div>
          <div>
            <p className="text-2xl font-bold">{correct}/{total}</p>
            <p className="text-indigo-200 text-sm">Correct</p>
          </div>
          <div>
            <p className="text-2xl font-bold">{maxCombo}x</p>
            <p className="text-indigo-200 text-sm">Best Combo</p>
          </div>
        </div>
        {timeRemaining > 0 && (
          <p className="text-center mt-3 text-indigo-200 text-sm">
            Time bonus: {Math.floor(timeRemaining)}s remaining
          </p>
        )}
      </div>

      {/* New Badges */}
      {newBadges.length > 0 && (
        <div className="w-full">
          <h3 className="text-lg font-bold text-gray-900 mb-3 text-center">New Badges Earned!</h3>
          <div className="flex flex-col gap-2">
            {newBadges.map(badge => badge && (
              <BadgeDisplay
                key={badge.id}
                icon={badge.icon}
                name={badge.name}
                description={badge.description}
                unlocked={true}
              />
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-col sm:flex-row items-center gap-3 w-full">
        <Button variant="primary" size="lg" className="w-full sm:w-auto" onClick={() => window.location.reload()}>
          <RotateCcw size={18} /> Play Again
        </Button>
        <Button variant="secondary" size="lg" className="w-full sm:w-auto" onClick={() => setShareOpen(true)}>
          <Share2 size={18} /> Share
        </Button>
        <Link href="/" className="w-full sm:w-auto">
          <Button variant="ghost" size="lg" className="w-full">
            <Home size={18} /> Home
          </Button>
        </Link>
      </div>

      {/* Share Modal */}
      <Modal open={shareOpen} onClose={() => setShareOpen(false)} title="Share Your Score">
        <div className="flex flex-col gap-3">
          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-4 text-center">
            <p className="font-bold text-indigo-700 text-lg">Score: {score} pts</p>
            <p className="text-gray-500 text-sm">{deck?.name} - {accuracy}% accuracy</p>
          </div>
          <Button variant="primary" onClick={() => shareToFacebook(shareData)} className="w-full bg-blue-600 hover:bg-blue-700">
            Share on Facebook
          </Button>
          <Button variant="primary" onClick={() => shareToTwitter(shareData)} className="w-full bg-gray-900 hover:bg-gray-800">
            Share on X
          </Button>
          <Button variant="primary" onClick={() => shareToWhatsApp(shareData)} className="w-full bg-green-600 hover:bg-green-700">
            Share on WhatsApp
          </Button>
          <Button variant="primary" onClick={() => shareNative(shareData)} className="w-full bg-purple-600 hover:bg-purple-700">
            Share via Device
          </Button>
          <Button variant="secondary" onClick={handleCopy} className="w-full">
            {copied ? <CheckCheck size={16} /> : <Copy size={16} />}
            {copied ? 'Copied!' : 'Copy to Clipboard'}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
