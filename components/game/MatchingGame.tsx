'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { ScriptureCard, Difficulty } from '@/lib/types';
import { generateMatchingPairs, shuffleArray, getTimerForDifficulty } from '@/lib/gameLogic';
import Timer from '@/components/ui/Timer';
import { Zap, Lightbulb, Volume2 } from 'lucide-react';

interface MatchingGameProps {
  cards: ScriptureCard[];
  difficulty: Difficulty;
  onComplete: (correct: number, total: number, timeRemaining: number, maxCombo: number) => void;
}

interface MatchItem {
  id: string;
  text: string;
  cardId: string;
}

type Selection = { side: 'left' | 'right'; item: MatchItem } | null;

export default function MatchingGame({ cards, difficulty, onComplete }: MatchingGameProps) {
  const totalTime = getTimerForDifficulty(difficulty);
  const [timeRemaining, setTimeRemaining] = useState(totalTime);
  const [isPaused, setIsPaused] = useState(false);
  const [references, setReferences] = useState<MatchItem[]>([]);
  const [scriptures, setScriptures] = useState<MatchItem[]>([]);
  const [selected, setSelected] = useState<Selection>(null);
  const [matchedIds, setMatchedIds] = useState<Set<string>>(new Set());
  const [wrongPair, setWrongPair] = useState<[string, string] | null>(null);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [showSuccess, setShowSuccess] = useState<string | null>(null);
  const [hintCardId, setHintCardId] = useState<string | null>(null);
  const [disappearingIds, setDisappearingIds] = useState<Set<string>>(new Set());
  const [hiddenIds, setHiddenIds] = useState<Set<string>>(new Set());
  const [speakingId, setSpeakingId] = useState<string | null>(null);

  useEffect(() => {
    const { references: refs, scriptures: scrs } = generateMatchingPairs(cards);
    setReferences(refs);
    setScriptures(scrs);
  }, [cards]);

  const checkComplete = useCallback((newMatchedIds: Set<string>) => {
    if (newMatchedIds.size === cards.length) {
      setIsPaused(true);
      setCompleted(true);
    }
  }, [cards.length]);

  useEffect(() => {
    if (completed) {
      onComplete(correct, attempts, timeRemaining, maxCombo);
    }
  }, [completed, correct, attempts, timeRemaining, maxCombo, onComplete]);

  const handleSelect = useCallback((side: 'left' | 'right', item: MatchItem) => {
    if (matchedIds.has(item.cardId)) return;
    if (wrongPair) return;
    setHintCardId(null);

    if (!selected) {
      setSelected({ side, item });
      return;
    }

    if (selected.side === side) {
      setSelected({ side, item });
      return;
    }

    // We have a pair!
    setAttempts(a => a + 1);
    const isMatch = selected.item.cardId === item.cardId;

    if (isMatch) {
      const newMatched = new Set(matchedIds);
      newMatched.add(item.cardId);
      setMatchedIds(newMatched);
      setCorrect(c => c + 1);
      const newCombo = combo + 1;
      setCombo(newCombo);
      setMaxCombo(m => Math.max(m, newCombo));
      setShowSuccess(item.cardId);
      setTimeout(() => {
        setShowSuccess(null);
        // Start disappear animation
        setDisappearingIds(prev => {
          const next = new Set(prev);
          next.add(item.cardId);
          return next;
        });
        // After animation, fully hide
        setTimeout(() => {
          setHiddenIds(prev => {
            const next = new Set(prev);
            next.add(item.cardId);
            return next;
          });
        }, 500);
      }, 600);
      setSelected(null);
      checkComplete(newMatched);
    } else {
      const id1 = selected.item.id;
      const id2 = item.id;
      setWrongPair([id1, id2]);
      setCombo(0);
      setTimeout(() => {
        setWrongPair(null);
        setSelected(null);
      }, 600);
    }
  }, [selected, matchedIds, combo, wrongPair, checkComplete]);

  // Look up the hint text for a card
  const getCardHint = useCallback((cardId: string) => {
    return cards.find(c => c.id === cardId)?.hint ?? '';
  }, [cards]);

  const showHint = useCallback(() => {
    if (!selected) return;
    setHintCardId(selected.item.cardId);
  }, [selected]);

  const playItemAudio = useCallback((text: string, itemId: string) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    if (speakingId === itemId) {
      window.speechSynthesis.cancel();
      setSpeakingId(null);
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    utterance.lang = 'en-US';
    utterance.onend = () => setSpeakingId(null);
    setSpeakingId(itemId);
    window.speechSynthesis.speak(utterance);
  }, [speakingId]);

  const handleTimeUp = useCallback(() => {
    setIsPaused(true);
    setCompleted(true);
  }, []);

  const isItemSelected = (id: string) => selected?.item.id === id;
  const isItemWrong = (id: string) => wrongPair?.includes(id) || false;
  const isItemMatched = (cardId: string) => matchedIds.has(cardId);
  const isItemHinted = (cardId: string, side: 'left' | 'right') =>
    difficulty === 'beginner' && hintCardId === cardId && selected?.side !== side;
  const isItemShowingHintText = (cardId: string) =>
    difficulty === 'intermediate' && hintCardId === cardId;
  const isItemDisappearing = (cardId: string) => disappearingIds.has(cardId);
  const isItemHidden = (cardId: string) => hiddenIds.has(cardId);

  return (
    <div className="flex flex-col gap-4 w-full max-w-4xl mx-auto">
      {/* Timer & Stats */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex-1 min-w-[200px]">
          <Timer
            totalTime={totalTime}
            timeRemaining={timeRemaining}
            onTick={() => setTimeRemaining(t => Math.max(0, t - 1))}
            onTimeUp={handleTimeUp}
            isPaused={isPaused}
          />
        </div>
        <div className="flex items-center gap-4 text-sm">
          <span className="text-gray-500">Matched: <b className="text-indigo-600">{matchedIds.size}/{cards.length}</b></span>
          {combo > 1 && (
            <span className="flex items-center gap-1 text-amber-600 font-bold animate-bounce">
              <Zap size={16} /> {combo}x Combo!
            </span>
          )}
        </div>
      </div>

      {/* Hint Button — hidden for advanced */}
      {difficulty !== 'advanced' && (
        <div className="flex justify-center">
          <button
            onClick={showHint}
            disabled={!selected || !!hintCardId}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${
              selected && !hintCardId
                ? 'bg-amber-50 border-2 border-amber-400 text-amber-700 hover:bg-amber-100'
                : 'bg-gray-50 border-2 border-gray-200 text-gray-300 cursor-not-allowed'
            }`}
          >
            <Lightbulb size={16} /> Hint
          </button>
        </div>
      )}

      {/* Matching Grid */}
      <div className="grid grid-cols-2 gap-4">
        {/* References Column */}
        <div className="flex flex-col gap-3">
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider text-center">References</h3>
          {references.map(ref => {
            if (isItemHidden(ref.cardId)) return null;
            return (
              <div
                key={ref.id}
                className={`relative p-4 rounded-xl text-center font-semibold transition-all duration-200 border-2 overflow-hidden ${
                  isItemDisappearing(ref.cardId)
                    ? 'animate-matchDisappear'
                    : isItemMatched(ref.cardId)
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-600 opacity-60 scale-95'
                    : isItemWrong(ref.id)
                    ? 'bg-red-50 border-red-400 text-red-600 animate-shake'
                    : isItemHinted(ref.cardId, 'left')
                    ? 'bg-amber-50 border-amber-400 text-amber-700 shadow-lg scale-105 animate-pop'
                    : isItemSelected(ref.id)
                    ? 'bg-indigo-50 border-indigo-500 text-indigo-700 shadow-lg scale-105'
                    : showSuccess === ref.cardId
                    ? 'bg-emerald-50 border-emerald-400 text-emerald-700 animate-pop'
                    : 'bg-white border-gray-200 text-gray-800 hover:border-indigo-300 hover:shadow-md'
                }`}
              >
                <button
                  onClick={() => handleSelect('left', ref)}
                  disabled={isItemMatched(ref.cardId)}
                  className="w-full cursor-pointer"
                >
                  {ref.text}
                  {isItemShowingHintText(ref.cardId) && (
                    <p className="text-xs font-normal text-amber-600 italic mt-1 animate-pop">
                      &ldquo;{getCardHint(ref.cardId)}&rdquo;
                    </p>
                  )}
                </button>
                {!isItemMatched(ref.cardId) && !isItemDisappearing(ref.cardId) && (
                  <button
                    onClick={(e) => { e.stopPropagation(); playItemAudio(ref.text, ref.id); }}
                    className={`absolute top-1.5 right-1.5 p-1 rounded-full transition-colors cursor-pointer ${
                      speakingId === ref.id ? 'text-indigo-600 bg-indigo-100' : 'text-gray-300 hover:text-gray-500 hover:bg-gray-100'
                    }`}
                  >
                    <Volume2 size={14} />
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Scriptures Column */}
        <div className="flex flex-col gap-3">
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider text-center">Scriptures</h3>
          {scriptures.map(scr => {
            if (isItemHidden(scr.cardId)) return null;
            return (
              <div
                key={scr.id}
                className={`relative p-4 rounded-xl text-left text-sm leading-relaxed transition-all duration-200 border-2 overflow-hidden ${
                  isItemDisappearing(scr.cardId)
                    ? 'animate-matchDisappear'
                    : isItemMatched(scr.cardId)
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-600 opacity-60 scale-95'
                    : isItemWrong(scr.id)
                    ? 'bg-red-50 border-red-400 text-red-600 animate-shake'
                    : isItemHinted(scr.cardId, 'right')
                    ? 'bg-amber-50 border-amber-400 text-amber-700 shadow-lg scale-105 animate-pop'
                    : isItemSelected(scr.id)
                    ? 'bg-indigo-50 border-indigo-500 text-indigo-700 shadow-lg scale-105'
                    : showSuccess === scr.cardId
                    ? 'bg-emerald-50 border-emerald-400 text-emerald-700 animate-pop'
                    : 'bg-white border-gray-200 text-gray-700 hover:border-indigo-300 hover:shadow-md'
                }`}
              >
                <button
                  onClick={() => handleSelect('right', scr)}
                  disabled={isItemMatched(scr.cardId)}
                  className="w-full text-left cursor-pointer"
                >
                  {scr.text}
                </button>
                {!isItemMatched(scr.cardId) && !isItemDisappearing(scr.cardId) && (
                  <button
                    onClick={(e) => { e.stopPropagation(); playItemAudio(scr.text, scr.id); }}
                    className={`absolute top-1.5 right-1.5 p-1 rounded-full transition-colors cursor-pointer ${
                      speakingId === scr.id ? 'text-indigo-600 bg-indigo-100' : 'text-gray-300 hover:text-gray-500 hover:bg-gray-100'
                    }`}
                  >
                    <Volume2 size={14} />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
