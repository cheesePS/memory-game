'use client';

import React from 'react';

interface BadgeDisplayProps {
  icon: string;
  name: string;
  description: string;
  unlocked: boolean;
  size?: 'sm' | 'md';
}

export default function BadgeDisplay({ icon, name, description, unlocked, size = 'md' }: BadgeDisplayProps) {
  return (
    <div
      className={`flex items-center gap-3 rounded-xl p-3 transition-all duration-300 ${
        unlocked
          ? 'bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 shadow-sm'
          : 'bg-gray-50 border border-gray-200 opacity-50 grayscale'
      } ${size === 'sm' ? 'p-2' : 'p-3'}`}
    >
      <span className={`${size === 'sm' ? 'text-2xl' : 'text-3xl'} ${unlocked ? 'animate-wiggle' : ''}`} role="img" aria-label={name}>
        {icon}
      </span>
      <div className="min-w-0">
        <p className={`font-bold ${size === 'sm' ? 'text-sm' : 'text-base'} text-gray-900 truncate`}>{name}</p>
        <p className={`${size === 'sm' ? 'text-xs' : 'text-sm'} text-gray-500 truncate`}>{description}</p>
      </div>
      {unlocked && (
        <span className="ml-auto text-green-500 text-sm font-semibold flex-shrink-0">Earned</span>
      )}
    </div>
  );
}
