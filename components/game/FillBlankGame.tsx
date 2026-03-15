'use client';

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { ScriptureCard, Difficulty } from '@/lib/types';
import { generateBlanks, getHint, getTimerForDifficulty, getMaxHints, shuffleArray } from '@/lib/gameLogic';
import Timer from '@/components/ui/Timer';
import Button from '@/components/ui/Button';
import { useGame } from '@/contexts/GameContext';
import { Lightbulb, Check, SkipForward } from 'lucide-react';

interface FillBlankGameProps {
  cards: ScriptureCard[];
  difficulty: Difficulty;
  onComplete: (correct: number, total: number, timeRemaining: number, maxCombo: number, hintsUsed: number) => void;
}

interface BlankData {
  display: string;
  blanks: string[];
}

export default function FillBlankGame({ cards, difficulty, onComplete }: FillBlankGameProps) {
  const { dispatch } = useGame();
  const totalTime = getTimerForDifficulty(difficulty);
  const maxHints = getMaxHints(difficulty);
  const [timeRemaining, setTimeRemaining] = useState(totalTime);
  const [isPaused, setIsPaused] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [blankData, setBlankData] = useState<BlankData>({ display: '', blanks: [] });
  const [userAnswers, setUserAnswers] = useState<string[]>([]);
  const [currentBlankIdx, setCurrentBlankIdx] = useState(0);
  const [inputValue, setInputValue] = useState('');
  const [showResult, setShowResult] = useState<'correct' | 'wrong' | null>(null);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [revealedHints, setRevealedHints] = useState<Set<number>>(new Set());
  const [correctCount, setCorrectCount] = useState(0);
  const [totalAnswered, setTotalAnswered] = useState(0);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [cardCorrects, setCardCorrects] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [mcChoices, setMcChoices] = useState<string[]>([]);
  const [activeBlankIdx, setActiveBlankIdx] = useState<number | null>(null);

  const card = cards[currentIndex];

  useEffect(() => {
    if (card) {
      const data = generateBlanks(card.text, difficulty);
      setBlankData(data);
      setUserAnswers(new Array(data.blanks.length).fill(''));
      setCurrentBlankIdx(0);
      setInputValue('');
      setShowResult(null);
      setRevealedHints(new Set());
      setCardCorrects(0);
      setActiveBlankIdx(null);
      setMcChoices([]);
    }
  }, [card, difficulty]);

  const displayParts = useMemo(() => {
    return blankData.display.split('______').map((part, i) => ({
      text: part,
      blankIndex: i < blankData.blanks.length ? i : null,
    }));
  }, [blankData]);

  const submitAnswer = useCallback(() => {
    const expected = blankData.blanks[currentBlankIdx];
    if (!expected) return;

    const cleanInput = inputValue.trim().toLowerCase().replace(/[^a-z]/g, '');
    const cleanExpected = expected.toLowerCase().replace(/[^a-z]/g, '');
    const isCorrect = cleanInput === cleanExpected;

    setTotalAnswered(t => t + 1);

    if (isCorrect) {
      setCorrectCount(c => c + 1);
      const newCombo = combo + 1;
      setCombo(newCombo);
      setMaxCombo(m => Math.max(m, newCombo));
      setCardCorrects(c => c + 1);
      setShowResult('correct');

      const newAnswers = [...userAnswers];
      newAnswers[currentBlankIdx] = expected;
      setUserAnswers(newAnswers);
    } else {
      setCombo(0);
      setShowResult('wrong');
      // Advanced: don't reveal, let them retry
      if (difficulty !== 'advanced') {
        const newAnswers = [...userAnswers];
        newAnswers[currentBlankIdx] = expected;
        setUserAnswers(newAnswers);
      }
    }

    // Advanced wrong: just clear and let them retry the same blank
    if (!isCorrect && difficulty === 'advanced') {
      setTimeout(() => {
        setShowResult(null);
        setInputValue('');
      }, 800);
      return;
    }

    setTimeout(() => {
      setShowResult(null);
      setInputValue('');
      if (currentBlankIdx < blankData.blanks.length - 1) {
        setCurrentBlankIdx(i => i + 1);
      } else {
        // Card complete
        const wasCorrect = isCorrect && cardCorrects === blankData.blanks.length - 1;
        dispatch({ type: 'UPDATE_CARD_PROGRESS', cardId: card.id, deckId: card.deckId, correct: wasCorrect });

        if (currentIndex < cards.length - 1) {
          setCurrentIndex(i => i + 1);
        } else {
          setIsPaused(true);
          setCompleted(true);
        }
      }
    }, 800);
  }, [inputValue, blankData, currentBlankIdx, userAnswers, combo, currentIndex, cards.length, card, dispatch, cardCorrects, difficulty]);

  useEffect(() => {
    if (completed) {
      onComplete(correctCount, totalAnswered, timeRemaining, maxCombo, hintsUsed);
    }
  }, [completed, correctCount, totalAnswered, timeRemaining, maxCombo, hintsUsed, onComplete]);

  const useHint = useCallback(() => {
    if (hintsUsed >= maxHints) return;
    setHintsUsed(h => h + 1);
    setRevealedHints(prev => new Set(prev).add(currentBlankIdx));
  }, [hintsUsed, maxHints, currentBlankIdx]);

  // Generate 3 multiple-choice options for intermediate
  const generateChoices = useCallback((blankIdx: number) => {
    const correct = blankData.blanks[blankIdx];
    if (!correct) return [];

    // Collect distractor candidates from other blanks + words in the verse
    const skipWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'is', 'it', 'be', 'as', 'do', 'no', 'not', 'so', 'up', 'if', 'my', 'ye', 'he', 'me']);
    const cleanCorrect = correct.toLowerCase().replace(/[^a-z]/g, '');
    const candidates: string[] = [];

    // Other blanks first (good distractors)
    blankData.blanks.forEach((b, i) => {
      if (i !== blankIdx) {
        const clean = b.toLowerCase().replace(/[^a-z]/g, '');
        if (clean !== cleanCorrect && !candidates.some(c => c.toLowerCase().replace(/[^a-z]/g, '') === clean)) {
          candidates.push(b);
        }
      }
    });

    // Words from the verse text as fallback
    const verseWords = card.text.split(' ');
    verseWords.forEach(w => {
      const clean = w.replace(/[^a-zA-Z]/g, '').toLowerCase();
      if (clean.length > 2 && !skipWords.has(clean) && clean !== cleanCorrect && !candidates.some(c => c.toLowerCase().replace(/[^a-z]/g, '') === clean)) {
        candidates.push(w);
      }
    });

    const shuffled = shuffleArray(candidates);
    const distractors = shuffled.slice(0, 2);
    return shuffleArray([correct, ...distractors]);
  }, [blankData, card]);

  const revealBlank = useCallback((blankIdx: number) => {
    if (difficulty !== 'beginner') return;
    if (userAnswers[blankIdx]) return;
    if (showResult) return;

    const answer = blankData.blanks[blankIdx];
    if (!answer) return;

    setTotalAnswered(t => t + 1);
    setCombo(0);
    const newAnswers = [...userAnswers];
    newAnswers[blankIdx] = answer;
    setUserAnswers(newAnswers);
    setShowResult('correct');
    setInputValue('');

    setTimeout(() => {
      setShowResult(null);
      const allFilled = newAnswers.every(a => a !== '');
      if (allFilled) {
        dispatch({ type: 'UPDATE_CARD_PROGRESS', cardId: card.id, deckId: card.deckId, correct: false });
        if (currentIndex < cards.length - 1) {
          setCurrentIndex(i => i + 1);
        } else {
          setIsPaused(true);
          setCompleted(true);
        }
      } else {
        const nextIdx = newAnswers.findIndex((a, i) => i > blankIdx && a === '');
        const fallbackIdx = newAnswers.findIndex(a => a === '');
        setCurrentBlankIdx(nextIdx !== -1 ? nextIdx : fallbackIdx);
      }
    }, 600);
  }, [difficulty, blankData, userAnswers, showResult, currentIndex, cards.length, card, dispatch]);

  // Intermediate: click blank to show multiple choice
  const openChoices = useCallback((blankIdx: number) => {
    if (difficulty !== 'intermediate') return;
    if (userAnswers[blankIdx]) return;
    if (showResult) return;
    setCurrentBlankIdx(blankIdx);
    setActiveBlankIdx(blankIdx);
    setMcChoices(generateChoices(blankIdx));
  }, [difficulty, userAnswers, showResult, generateChoices]);

  // Intermediate: pick a choice
  const pickChoice = useCallback((choice: string) => {
    if (activeBlankIdx === null) return;
    const expected = blankData.blanks[activeBlankIdx];
    if (!expected) return;

    const cleanChoice = choice.toLowerCase().replace(/[^a-z]/g, '');
    const cleanExpected = expected.toLowerCase().replace(/[^a-z]/g, '');
    const isCorrect = cleanChoice === cleanExpected;

    setTotalAnswered(t => t + 1);

    if (isCorrect) {
      setCorrectCount(c => c + 1);
      const newCombo = combo + 1;
      setCombo(newCombo);
      setMaxCombo(m => Math.max(m, newCombo));
      setCardCorrects(c => c + 1);
      setShowResult('correct');

      const newAnswers = [...userAnswers];
      newAnswers[activeBlankIdx] = expected;
      setUserAnswers(newAnswers);

      setTimeout(() => {
        setShowResult(null);
        setActiveBlankIdx(null);
        setMcChoices([]);

        const allFilled = newAnswers.every(a => a !== '');
        if (allFilled) {
          const wasAllCorrect = isCorrect && cardCorrects === blankData.blanks.length - 1;
          dispatch({ type: 'UPDATE_CARD_PROGRESS', cardId: card.id, deckId: card.deckId, correct: wasAllCorrect });
          if (currentIndex < cards.length - 1) {
            setCurrentIndex(i => i + 1);
          } else {
            setIsPaused(true);
            setCompleted(true);
          }
        } else {
          const nextIdx = newAnswers.findIndex((a, i) => i > activeBlankIdx! && a === '');
          const fallbackIdx = newAnswers.findIndex(a => a === '');
          setCurrentBlankIdx(nextIdx !== -1 ? nextIdx : fallbackIdx);
        }
      }, 600);
    } else {
      setCombo(0);
      setShowResult('wrong');
      setTimeout(() => {
        setShowResult(null);
      }, 600);
    }
  }, [activeBlankIdx, blankData, userAnswers, combo, cardCorrects, currentIndex, cards.length, card, dispatch]);

  // Advanced: click blank to select it for typing
  const selectBlankForTyping = useCallback((blankIdx: number) => {
    if (difficulty !== 'advanced') return;
    if (userAnswers[blankIdx]) return;
    if (showResult) return;
    setCurrentBlankIdx(blankIdx);
    setInputValue('');
  }, [difficulty, userAnswers, showResult]);

  const skipBlank = useCallback(() => {
    setTotalAnswered(t => t + 1);
    setCombo(0);
    const newAnswers = [...userAnswers];
    newAnswers[currentBlankIdx] = blankData.blanks[currentBlankIdx];
    setUserAnswers(newAnswers);
    setInputValue('');

    if (currentBlankIdx < blankData.blanks.length - 1) {
      setCurrentBlankIdx(i => i + 1);
    } else {
      dispatch({ type: 'UPDATE_CARD_PROGRESS', cardId: card.id, deckId: card.deckId, correct: false });
      if (currentIndex < cards.length - 1) {
        setCurrentIndex(i => i + 1);
      } else {
        setIsPaused(true);
        setCompleted(true);
      }
    }
  }, [currentBlankIdx, blankData, userAnswers, currentIndex, cards.length, card, dispatch]);

  const handleTimeUp = useCallback(() => {
    setIsPaused(true);
    setCompleted(true);
  }, []);

  if (!card || completed) return null;

  return (
    <div className="flex flex-col gap-5 w-full max-w-2xl mx-auto">
      {/* Timer */}
      <Timer
        totalTime={totalTime}
        timeRemaining={timeRemaining}
        onTick={() => setTimeRemaining(t => Math.max(0, t - 1))}
        onTimeUp={handleTimeUp}
        isPaused={isPaused}
      />

      {/* Stats Bar */}
      <div className="flex items-center justify-between text-sm text-gray-500">
        <span>Verse {currentIndex + 1} of {cards.length}</span>
        <span>Blank {currentBlankIdx + 1} of {blankData.blanks.length}</span>
        <span className="text-emerald-600 font-semibold">{correctCount} correct</span>
      </div>

      {/* Reference */}
      <div className="text-center">
        <span className="inline-block bg-indigo-100 text-indigo-700 font-bold px-4 py-2 rounded-full text-sm">
          {card.reference}
        </span>
        {difficulty === 'beginner' && (
          <p className="text-xs text-gray-400 mt-2">Click on the blank to reveal the correct word.</p>
        )}
        {difficulty === 'intermediate' && (
          <p className="text-xs text-gray-400 mt-2">Click on a blank, then choose the correct word from the options.</p>
        )}
        {difficulty === 'advanced' && (
          <p className="text-xs text-gray-400 mt-2">Click on a blank, then type the correct word.</p>
        )}
      </div>

      {/* Scripture with Blanks */}
      <div className="bg-white rounded-2xl border-2 border-gray-100 p-6 shadow-sm">
        <p className="text-lg leading-loose text-gray-800 font-serif">
          {displayParts.map((part, i) => (
            <React.Fragment key={i}>
              <span>{part.text}</span>
              {part.blankIndex !== null && (
                <span
                  onClick={() => {
                    if (userAnswers[part.blankIndex!] || showResult) return;
                    if (difficulty === 'beginner') revealBlank(part.blankIndex!);
                    else if (difficulty === 'intermediate') openChoices(part.blankIndex!);
                    else if (difficulty === 'advanced') selectBlankForTyping(part.blankIndex!);
                  }}
                  className={`inline-block mx-1 px-2 py-0.5 rounded-lg font-sans text-base transition-all duration-300 ${
                    userAnswers[part.blankIndex]
                      ? 'bg-emerald-100 text-emerald-700 font-semibold'
                      : part.blankIndex === currentBlankIdx
                      ? `border-b-2 border-indigo-500 ${showResult === 'correct' ? 'bg-emerald-100 text-emerald-700' : showResult === 'wrong' ? 'bg-red-100 text-red-600' : 'bg-indigo-50 text-indigo-600'}`
                      : 'bg-gray-100 text-gray-400'
                  } ${!userAnswers[part.blankIndex!] ? 'cursor-pointer hover:bg-indigo-100 hover:scale-105' : ''}`}
                >
                  {userAnswers[part.blankIndex] || (
                    revealedHints.has(part.blankIndex!)
                      ? getHint(blankData.blanks[part.blankIndex!])
                      : '______'
                  )}
                </span>
              )}
            </React.Fragment>
          ))}
        </p>
      </div>

      {/* Multiple Choice — intermediate only */}
      {difficulty === 'intermediate' && activeBlankIdx !== null && mcChoices.length > 0 && (
        <div className="flex flex-wrap items-center justify-center gap-3">
          {mcChoices.map((choice, i) => (
            <button
              key={i}
              onClick={() => pickChoice(choice)}
              disabled={!!showResult}
              className={`px-5 py-2.5 rounded-xl border-2 font-semibold text-base transition-all cursor-pointer ${
                showResult
                  ? choice.toLowerCase().replace(/[^a-z]/g, '') === blankData.blanks[activeBlankIdx]?.toLowerCase().replace(/[^a-z]/g, '')
                    ? 'bg-emerald-100 border-emerald-400 text-emerald-700'
                    : 'bg-gray-50 border-gray-200 text-gray-400'
                  : 'bg-white border-gray-200 text-gray-800 hover:border-indigo-400 hover:bg-indigo-50 hover:shadow-md'
              }`}
            >
              {choice}
            </button>
          ))}
        </div>
      )}

      {/* Input — advanced only */}
      {difficulty === 'advanced' && (
        <div className="flex items-center gap-3">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && inputValue.trim()) submitAnswer(); }}
            placeholder="Type the missing word..."
            className="flex-1 px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none text-lg transition-all"
            autoFocus
            disabled={!!showResult}
            aria-label="Type the missing word"
          />
          <Button onClick={submitAnswer} disabled={!inputValue.trim() || !!showResult}>
            <Check size={18} /> Check
          </Button>
        </div>
      )}

      {/* Helpers */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {maxHints > 0 && difficulty === 'advanced' && (
            <Button variant="ghost" size="sm" onClick={useHint} disabled={hintsUsed >= maxHints || revealedHints.has(currentBlankIdx)}>
              <Lightbulb size={16} /> Hint ({maxHints - hintsUsed} left)
            </Button>
          )}
          {difficulty === 'beginner' && (
            <Button variant="ghost" size="sm" onClick={skipBlank}>
              <SkipForward size={16} /> Skip
            </Button>
          )}
        </div>
        {combo > 1 && (
          <span className="text-amber-600 font-bold text-sm animate-bounce">
            {combo}x Combo!
          </span>
        )}
      </div>

      {/* Result Flash */}
      {showResult && (
        <div className={`text-center py-2 rounded-xl font-semibold animate-pop ${
          showResult === 'correct' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
        }`}>
          {showResult === 'correct' ? 'Correct!' : difficulty === 'advanced' ? 'Try again!' : 'Wrong, try again!'}
        </div>
      )}
    </div>
  );
}
