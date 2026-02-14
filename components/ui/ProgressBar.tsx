'use client';

import React from 'react';

interface ProgressBarProps {
  value: number;
  max: number;
  label?: string;
  color?: string;
  showText?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const barSizes = { sm: 'h-1.5', md: 'h-3', lg: 'h-5' };

export default function ProgressBar({ value, max, label, color = 'bg-indigo-500', showText = true, size = 'md' }: ProgressBarProps) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;

  return (
    <div className="w-full">
      {(label || showText) && (
        <div className="flex justify-between items-center mb-1">
          {label && <span className="text-sm font-medium text-gray-600">{label}</span>}
          {showText && <span className="text-sm font-semibold text-gray-800">{Math.round(pct)}%</span>}
        </div>
      )}
      <div className={`w-full bg-gray-200 rounded-full overflow-hidden ${barSizes[size]}`}>
        <div
          className={`${barSizes[size]} ${color} rounded-full transition-all duration-700 ease-out`}
          style={{ width: `${pct}%` }}
          role="progressbar"
          aria-valuenow={value}
          aria-valuemin={0}
          aria-valuemax={max}
        />
      </div>
    </div>
  );
}
