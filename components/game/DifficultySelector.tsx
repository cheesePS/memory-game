'use client';

import React from 'react';
import { Difficulty } from '@/lib/types';
import { Zap, Target, Flame } from 'lucide-react';

interface DifficultySelectorProps {
  value: Difficulty;
  onChange: (d: Difficulty) => void;
}

const options: { value: Difficulty; label: string; description: string; icon: React.ReactNode; color: string }[] = [
  {
    value: 'beginner',
    label: 'Beginner',
    description: 'Short verses, fewer blanks, longer timers',
    icon: <Target size={20} />,
    color: 'border-emerald-300 bg-emerald-50 text-emerald-700',
  },
  {
    value: 'intermediate',
    label: 'Intermediate',
    description: 'Medium verses, moderate blanks, normal timer',
    icon: <Zap size={20} />,
    color: 'border-amber-300 bg-amber-50 text-amber-700',
  },
  {
    value: 'advanced',
    label: 'Advanced',
    description: 'Long verses, many blanks, short timer, no hints',
    icon: <Flame size={20} />,
    color: 'border-red-300 bg-red-50 text-red-700',
  },
];

export default function DifficultySelector({ value, onChange }: DifficultySelectorProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      {options.map(opt => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all duration-200 cursor-pointer ${
            value === opt.value
              ? `${opt.color} shadow-md scale-[1.02]`
              : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:shadow-sm'
          }`}
          aria-pressed={value === opt.value}
        >
          {opt.icon}
          <span className="font-bold">{opt.label}</span>
          <span className="text-xs text-center opacity-75">{opt.description}</span>
        </button>
      ))}
    </div>
  );
}
