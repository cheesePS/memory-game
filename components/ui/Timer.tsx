'use client';

import React, { useEffect, useRef, useCallback } from 'react';
import { Clock } from 'lucide-react';

interface TimerProps {
  totalTime: number;
  timeRemaining: number;
  onTick: () => void;
  onTimeUp: () => void;
  isPaused: boolean;
}

export default function Timer({ totalTime, timeRemaining, onTick, onTimeUp, isPaused }: TimerProps) {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const onTickRef = useRef(onTick);
  const onTimeUpRef = useRef(onTimeUp);

  onTickRef.current = onTick;
  onTimeUpRef.current = onTimeUp;

  useEffect(() => {
    if (isPaused || timeRemaining <= 0) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }

    intervalRef.current = setInterval(() => {
      onTickRef.current();
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isPaused, timeRemaining]);

  const handleTimeUp = useCallback(() => {
    onTimeUpRef.current();
  }, []);

  useEffect(() => {
    if (timeRemaining <= 0) handleTimeUp();
  }, [timeRemaining, handleTimeUp]);

  const pct = totalTime > 0 ? (timeRemaining / totalTime) * 100 : 0;
  const isLow = timeRemaining <= 10;
  const isCritical = timeRemaining <= 5;
  const mins = Math.floor(timeRemaining / 60);
  const secs = timeRemaining % 60;

  return (
    <div className={`flex items-center gap-3 ${isCritical ? 'animate-pulse' : ''}`}>
      <Clock size={20} className={isLow ? 'text-red-500' : 'text-gray-500'} />
      <div className="flex-1 h-3 bg-gray-200 rounded-full overflow-hidden min-w-[100px]">
        <div
          className={`h-full rounded-full transition-all duration-1000 ease-linear ${
            isCritical ? 'bg-red-500' : isLow ? 'bg-amber-500' : 'bg-indigo-500'
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className={`font-mono font-bold text-lg min-w-[60px] text-right ${
        isCritical ? 'text-red-500 animate-bounce' : isLow ? 'text-amber-500' : 'text-gray-700'
      }`}>
        {mins}:{secs.toString().padStart(2, '0')}
      </span>
    </div>
  );
}
