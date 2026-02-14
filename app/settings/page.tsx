'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useGame } from '@/contexts/GameContext';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import { ArrowLeft, Volume2, VolumeX, Type, RotateCcw, AlertTriangle } from 'lucide-react';

export default function SettingsPage() {
  const { state, dispatch } = useGame();
  const { settings } = state;
  const [confirmReset, setConfirmReset] = useState(false);

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-8">
      <div className="flex items-center gap-3">
        <Link href="/" className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
          <ArrowLeft size={20} className="text-gray-600" />
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
      </div>

      {/* Sound */}
      <section className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Sound</h2>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {settings.soundEnabled ? <Volume2 size={20} className="text-indigo-500" /> : <VolumeX size={20} className="text-gray-400" />}
            <div>
              <p className="font-semibold text-gray-800">Sound Effects</p>
              <p className="text-sm text-gray-500">Play sounds for correct/wrong answers</p>
            </div>
          </div>
          <button
            onClick={() => dispatch({ type: 'SET_SOUND', enabled: !settings.soundEnabled })}
            className={`relative w-12 h-6 rounded-full transition-colors duration-200 cursor-pointer ${
              settings.soundEnabled ? 'bg-indigo-500' : 'bg-gray-300'
            }`}
            role="switch"
            aria-checked={settings.soundEnabled}
          >
            <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-200 ${
              settings.soundEnabled ? 'translate-x-6' : 'translate-x-0.5'
            }`} />
          </button>
        </div>
      </section>

      {/* Font Size / Accessibility */}
      <section className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Accessibility</h2>

        <div className="space-y-4">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Type size={20} className="text-indigo-500" />
              <p className="font-semibold text-gray-800">Font Size</p>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {(['small', 'medium', 'large'] as const).map(size => (
                <button
                  key={size}
                  onClick={() => dispatch({ type: 'SET_FONT_SIZE', size })}
                  className={`p-3 rounded-xl border-2 text-center capitalize transition-all cursor-pointer ${
                    settings.fontSize === size
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-700 font-bold'
                      : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                  }`}
                >
                  <span className={size === 'small' ? 'text-sm' : size === 'large' ? 'text-xl' : 'text-base'}>
                    Aa
                  </span>
                  <p className="text-xs mt-1">{size}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-gray-50 rounded-xl p-4 text-sm text-gray-600 space-y-2">
            <p><strong>Keyboard Navigation:</strong> Use Tab to navigate between elements, Enter/Space to activate buttons, and Escape to close modals.</p>
            <p><strong>Screen Reader:</strong> All interactive elements have ARIA labels for screen reader compatibility.</p>
            <p><strong>Color-blind Friendly:</strong> The app uses distinct colors with sufficient contrast and never relies on color alone to convey information.</p>
          </div>
        </div>
      </section>

      {/* Reset Progress */}
      <section className="bg-white rounded-2xl border border-red-100 p-6 shadow-sm">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Data</h2>
        <div className="flex items-center justify-between">
          <div>
            <p className="font-semibold text-gray-800">Reset All Progress</p>
            <p className="text-sm text-gray-500">This will delete all your scores, badges, and progress</p>
          </div>
          <Button variant="danger" size="sm" onClick={() => setConfirmReset(true)}>
            <RotateCcw size={16} /> Reset
          </Button>
        </div>
      </section>

      {/* Reset Confirmation Modal */}
      <Modal open={confirmReset} onClose={() => setConfirmReset(false)} title="Reset Progress?">
        <div className="flex flex-col items-center gap-4 text-center">
          <AlertTriangle size={48} className="text-red-500" />
          <p className="text-gray-600">
            This will permanently delete all your progress, scores, badges, and streaks. This action cannot be undone.
          </p>
          <div className="flex gap-3 w-full">
            <Button variant="ghost" className="flex-1" onClick={() => setConfirmReset(false)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              className="flex-1"
              onClick={() => {
                dispatch({ type: 'RESET_PROGRESS' });
                setConfirmReset(false);
              }}
            >
              Reset Everything
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
