'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { ScriptureCard } from '@/lib/types';
import { useGame } from '@/contexts/GameContext';
import Button from '@/components/ui/Button';
import { RotateCcw, Eye, Star, ChevronLeft, ChevronRight, Lightbulb, BookOpen, RefreshCw, Pause, Play, Volume2 } from 'lucide-react';

export type FlashcardMode = 'manual' | 'auto-verses' | 'auto-scripture';

interface FlashcardGameProps {
  cards: ScriptureCard[];
  deckId: string;
  mode: FlashcardMode;
  voiceEnabled?: boolean;
  onComplete: (correct: number, total: number) => void;
  onPlayAgain: () => void;
}

type FlashcardStatus = 'review' | 'mastered';

export default function FlashcardGame({ cards, deckId, mode, voiceEnabled = false, onComplete, onPlayAgain }: FlashcardGameProps) {
  const { dispatch } = useGame();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [statuses, setStatuses] = useState<Record<string, FlashcardStatus>>({});
  const [completed, setCompleted] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [paused, setPaused] = useState(false);
  const [autoFlipAnim, setAutoFlipAnim] = useState<'in' | 'out' | ''>('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const flipTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isAuto = mode === 'auto-verses' || mode === 'auto-scripture';
  const card = cards[currentIndex];

  // Auto-advance + TTS logic for automatic modes
  useEffect(() => {
    if (!isAuto || paused) {
      if (timerRef.current) clearTimeout(timerRef.current);
      return;
    }

    const advanceWithFlip = () => {
      // Flip out, then change card, then flip in
      setAutoFlipAnim('out');
      flipTimerRef.current = setTimeout(() => {
        setCurrentIndex(i => (i + 1) % cards.length);
        setAutoFlipAnim('in');
        flipTimerRef.current = setTimeout(() => setAutoFlipAnim(''), 300);
      }, 300);
    };

    const delay = mode === 'auto-verses' ? 15000 : 5000;
    const startAdvanceTimer = () => {
      timerRef.current = setTimeout(advanceWithFlip, delay);
    };

    if (voiceEnabled && card && typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      const text = mode === 'auto-verses' ? card.reference : card.text;
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      utterance.lang = 'en-US';
      utterance.onend = () => startAdvanceTimer();
      window.speechSynthesis.speak(utterance);
    } else {
      startAdvanceTimer();
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (flipTimerRef.current) clearTimeout(flipTimerRef.current);
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, [isAuto, paused, voiceEnabled, currentIndex, cards.length, card, mode]);

  const flipCard = useCallback(() => setIsFlipped(f => !f), []);

  const markCard = useCallback((status: FlashcardStatus) => {
    setStatuses(prev => ({ ...prev, [card.id]: status }));
    const isCorrect = status === 'mastered';
    dispatch({ type: 'UPDATE_CARD_PROGRESS', cardId: card.id, deckId: card.deckId, correct: isCorrect });
    if (status === 'mastered') {
      dispatch({ type: 'MASTER_CARD', cardId: card.id, deckId: card.deckId });
    }

    if (currentIndex < cards.length - 1) {
      setIsFlipped(false);
      setShowHint(false);
      setTimeout(() => setCurrentIndex(i => i + 1), 200);
    } else {
      const allStatuses = { ...statuses, [card.id]: status };
      const correct = Object.values(allStatuses).filter(s => s === 'mastered').length;
      setCompleted(true);
      onComplete(correct, cards.length);
    }
  }, [card, currentIndex, cards.length, statuses, dispatch, onComplete]);

  const goTo = useCallback((dir: 'prev' | 'next') => {
    setIsFlipped(false);
    setShowHint(false);
    setTimeout(() => {
      setCurrentIndex(i => dir === 'next' ? Math.min(i + 1, cards.length - 1) : Math.max(i - 1, 0));
    }, 150);
  }, [cards.length]);

  const playAudio = useCallback(() => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }
    const text = isFlipped ? card.text : card.reference;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    utterance.lang = 'en-US';
    utterance.onend = () => setIsSpeaking(false);
    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  }, [card, isFlipped, isSpeaking]);

  // Stop speech on card change or unmount in manual mode
  useEffect(() => {
    if (!isAuto) {
      setIsSpeaking(false);
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    }
  }, [currentIndex, isAuto]);

  if (completed) return null;

  // Auto modes: show only one side of the card (no flip)
  if (isAuto) {
    const showVerse = mode === 'auto-verses';
    return (
      <div className="flex flex-col items-center gap-6 w-full max-w-xl mx-auto">
        {/* Card Counter */}
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <span>Card {currentIndex + 1} of {cards.length}</span>
          <div className="flex gap-1 ml-2">
            {cards.map((_, i) => (
              <div key={i} className={`w-2.5 h-2.5 rounded-full transition-all ${
                i === currentIndex ? 'bg-indigo-500 scale-125' : 'bg-gray-200'
              }`} />
            ))}
          </div>
        </div>

        {/* Card - Single side only */}
        <div className={`relative w-full aspect-[3/2] ${
          autoFlipAnim === 'out' ? 'animate-autoFlipOut' :
          autoFlipAnim === 'in' ? 'animate-autoFlipIn' : ''
        }`}>
          {showVerse ? (
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-xl flex flex-col items-center justify-center p-8 text-white">
              <BookIcon />
              <h2 className="text-4xl sm:text-5xl font-bold mt-4 text-center">{card.reference}</h2>
            </div>
          ) : (
            <div className="absolute inset-0 rounded-2xl bg-white shadow-xl border-2 border-indigo-100 flex flex-col items-center justify-center p-8">
              <p className="text-xl sm:text-2xl leading-relaxed text-gray-800 text-center italic font-serif">
                &ldquo;{card.text}&rdquo;
              </p>
            </div>
          )}
        </div>

        {/* Auto mode controls */}
        <div className="flex items-center gap-3">
          <Button variant="secondary" size="sm" onClick={() => setPaused(p => !p)}>
            {paused ? <><Play size={16} /> Resume</> : <><Pause size={16} /> Pause</>}
          </Button>
          <Button variant="ghost" size="sm" onClick={onPlayAgain}>
            <RefreshCw size={16} /> Play Again
          </Button>
        </div>
      </div>
    );
  }

  // Manual mode: full interactive UI
  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-xl mx-auto">
      {/* Card Counter */}
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <span>Card {currentIndex + 1} of {cards.length}</span>
        <div className="flex gap-1 ml-2">
          {cards.map((_, i) => (
            <div key={i} className={`w-2.5 h-2.5 rounded-full transition-all ${
              i === currentIndex ? 'bg-indigo-500 scale-125' :
              i < currentIndex ? 'bg-indigo-300' : 'bg-gray-200'
            }`} />
          ))}
        </div>
      </div>

      {/* Flashcard */}
      <div
        className="relative w-full aspect-[3/2] cursor-pointer perspective-1000"
        onClick={flipCard}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') flipCard(); }}
        tabIndex={0}
        role="button"
        aria-label={isFlipped ? 'Scripture text shown, click to flip back' : 'Verse reference shown, click to reveal scripture'}
      >
        <div className={`relative w-full h-full transition-transform duration-600 transform-style-3d ${isFlipped ? 'rotate-y-180' : ''}`}>
          {/* Front - Reference */}
          <div className="absolute inset-0 backface-hidden rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-xl flex flex-col items-center justify-center p-8 text-white">
            <BookIcon />
            <h2 className="text-4xl sm:text-5xl font-bold mt-4 text-center">{card.reference}</h2>
            {showHint && card.hint && <p className="text-indigo-100 mt-2 text-base italic animate-pop">&ldquo;{card.hint}&rdquo;</p>}
          </div>

          {/* Back - Scripture */}
          <div className="absolute inset-0 backface-hidden rotate-y-180 rounded-2xl bg-white shadow-xl border-2 border-indigo-100 flex flex-col items-center justify-center p-8">
            <p className="text-xl sm:text-2xl leading-relaxed text-gray-800 text-center italic font-serif">
              &ldquo;{card.text}&rdquo;
            </p>
            <p className="mt-4 text-indigo-600 font-semibold text-lg">{card.reference}</p>
          </div>
        </div>
      </div>

      {/* Reveal, Hint & Audio Buttons */}
      <div className="flex items-center gap-3">
        <Button variant="primary" size="sm" onClick={flipCard}>
          <BookOpen size={16} /> {isFlipped ? 'Show Reference' : 'Reveal Scripture'}
        </Button>
        {card.hint && (
          <Button variant="ghost" size="sm" onClick={() => setShowHint(h => !h)} className="text-amber-600 hover:text-amber-700">
            <Lightbulb size={16} /> {showHint ? 'Hide Hint' : 'Hint'}
          </Button>
        )}
        <Button variant="ghost" size="sm" onClick={playAudio} className={isSpeaking ? 'text-indigo-600' : 'text-gray-500 hover:text-gray-700'}>
          <Volume2 size={16} /> {isSpeaking ? 'Stop' : 'Listen'}
        </Button>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap items-center justify-center gap-3 w-full">
        <Button variant="ghost" size="sm" onClick={() => goTo('prev')} disabled={currentIndex === 0}>
          <ChevronLeft size={18} /> Prev
        </Button>
        <Button variant="secondary" size="sm" onClick={() => markCard('review')}>
          <RotateCcw size={16} /> Review
        </Button>
        <Button size="sm" className="bg-amber-500 hover:bg-amber-600 text-white" onClick={() => markCard('mastered')}>
          <Star size={16} /> Mastered
        </Button>
        <Button variant="ghost" size="sm" onClick={onPlayAgain}>
          <RefreshCw size={16} /> Play Again
        </Button>
        <Button variant="ghost" size="sm" onClick={() => goTo('next')} disabled={currentIndex === cards.length - 1}>
          Next <ChevronRight size={18} />
        </Button>
      </div>

      {/* Status Legend */}
      <div className="flex items-center gap-4 text-xs text-gray-400">
        <span className="flex items-center gap-1"><Eye size={12} /> {Object.values(statuses).filter(s => s === 'review').length} Review</span>
        <span className="flex items-center gap-1"><Star size={12} /> {Object.values(statuses).filter(s => s === 'mastered').length} Mastered</span>
      </div>

      {/* Reset */}
      <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-600" onClick={() => dispatch({ type: 'RESET_DECK_MASTERED', deckId })}>
        <RotateCcw size={16} /> Reset
      </Button>
    </div>
  );
}

function BookIcon() {
  return (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="opacity-60">
      <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
    </svg>
  );
}
