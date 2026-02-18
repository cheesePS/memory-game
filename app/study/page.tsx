'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { decks } from '@/lib/data';
import { ArrowLeft, Download, Printer, ChevronDown, ChevronUp } from 'lucide-react';
import Button from '@/components/ui/Button';

export default function StudyPage() {
  const [expandedDeck, setExpandedDeck] = useState<string | null>(
    decks[0]?.id ?? null
  );
  const toggleDeck = (deckId: string) => {
    setExpandedDeck(prev => (prev === deckId ? null : deckId));
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    let text = 'SCRIPTURE MEMORY - STUDY SHEET\n';
    text += '='.repeat(40) + '\n\n';

    decks.forEach(deck => {
      text += `${deck.icon} ${deck.name}\n`;
      text += '-'.repeat(30) + '\n';
      deck.cards.forEach((card, i) => {
        text += `${i + 1}. ${card.reference}\n`;
        text += `   "${card.text}"\n\n`;
      });
      text += '\n';
    });

    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'scripture-study-sheet.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/" className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
            <ArrowLeft size={20} className="text-gray-600" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Study Sheet</h1>
            <p className="text-sm text-gray-400">Learn the scriptures and their references</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={handleDownload}>
            <Download size={16} /> Download
          </Button>
          <Button variant="ghost" size="sm" onClick={handlePrint}>
            <Printer size={16} /> Print
          </Button>
        </div>
      </div>

      {/* Deck List */}
      <div className="space-y-4">
        {decks.map(deck => {
          const isExpanded = expandedDeck === deck.id;

          return (
            <div key={deck.id} className="bg-white rounded-2xl border-2 border-gray-100 overflow-hidden shadow-sm">
              {/* Deck Header */}
              <button
                onClick={() => toggleDeck(deck.id)}
                className="w-full flex items-center justify-between p-5 hover:bg-gray-50 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{deck.icon}</span>
                  <div className="text-left">
                    <h2 className="font-bold text-gray-900 text-lg">{deck.name}</h2>
                    <p className="text-sm text-gray-400">{deck.cards.length} verses</p>
                  </div>
                </div>
                {isExpanded ? (
                  <ChevronUp size={20} className="text-gray-400" />
                ) : (
                  <ChevronDown size={20} className="text-gray-400" />
                )}
              </button>

              {/* Verses Table */}
              {isExpanded && (
                <div className="border-t border-gray-100">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50 text-left text-xs uppercase tracking-wider text-gray-400">
                        <th className="px-5 py-3 w-8">#</th>
                        <th className="px-5 py-3 w-1/3">Reference</th>
                        <th className="px-5 py-3">Scripture</th>
                      </tr>
                    </thead>
                    <tbody>
                      {deck.cards.map((card, i) => (
                        <tr key={card.id} className="border-t border-gray-50 hover:bg-indigo-50/30 transition-colors">
                          <td className="px-5 py-3 text-sm text-gray-300 font-mono">{i + 1}</td>
                          <td className="px-5 py-3">
                            <span className="font-semibold text-indigo-700 text-sm">{card.reference}</span>
                          </td>
                          <td className="px-5 py-3 text-sm text-gray-700 leading-relaxed font-serif italic">
                            &ldquo;{card.text}&rdquo;
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Print Styles (hidden on screen, shown on print) */}
      <style jsx global>{`
        @media print {
          body * { visibility: hidden; }
          .max-w-3xl, .max-w-3xl * { visibility: visible; }
          .max-w-3xl { position: absolute; left: 0; top: 0; width: 100%; max-width: 100%; }
          button, a { display: none !important; }
          .bg-white { border: 1px solid #ddd !important; break-inside: avoid; }
          table { break-inside: auto; }
          tr { break-inside: avoid; }
        }
      `}</style>
    </div>
  );
}
