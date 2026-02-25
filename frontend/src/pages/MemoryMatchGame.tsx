import { useState, useEffect, useCallback } from 'react';
import { Link } from '@tanstack/react-router';
import { ArrowLeft, RotateCcw } from 'lucide-react';
import ScoreSubmission from '../components/ScoreSubmission';
import Leaderboard from '../components/Leaderboard';

const CARD_SYMBOLS = ['🎮', '🕹️', '👾', '🚀', '⭐', '💎', '🔥', '🎯'];

interface Card {
  id: number;
  symbol: string;
  flipped: boolean;
  matched: boolean;
}

function createDeck(): Card[] {
  const symbols = [...CARD_SYMBOLS, ...CARD_SYMBOLS];
  const shuffled = symbols.sort(() => Math.random() - 0.5);
  return shuffled.map((symbol, i) => ({ id: i, symbol, flipped: false, matched: false }));
}

export default function MemoryMatchGame() {
  const [cards, setCards] = useState<Card[]>(createDeck());
  const [flipped, setFlipped] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [locked, setLocked] = useState(false);
  const [complete, setComplete] = useState(false);
  const [scoreSubmitted, setScoreSubmitted] = useState(false);

  const checkComplete = useCallback((updatedCards: Card[]) => {
    if (updatedCards.every((c) => c.matched)) {
      setComplete(true);
    }
  }, []);

  useEffect(() => {
    if (flipped.length !== 2) return;
    const [a, b] = flipped;
    setLocked(true);
    setMoves((m) => m + 1);

    if (cards[a].symbol === cards[b].symbol) {
      // Match
      const updated = cards.map((c, i) =>
        i === a || i === b ? { ...c, matched: true, flipped: true } : c
      );
      setCards(updated);
      setFlipped([]);
      setLocked(false);
      checkComplete(updated);
    } else {
      // No match — flip back after delay
      setTimeout(() => {
        setCards((prev) =>
          prev.map((c, i) =>
            i === a || i === b ? { ...c, flipped: false } : c
          )
        );
        setFlipped([]);
        setLocked(false);
      }, 900);
    }
  }, [flipped, cards, checkComplete]);

  const handleCardClick = (idx: number) => {
    if (locked || cards[idx].flipped || cards[idx].matched || flipped.length >= 2) return;
    const updated = cards.map((c, i) => (i === idx ? { ...c, flipped: true } : c));
    setCards(updated);
    setFlipped((prev) => [...prev, idx]);
  };

  const restart = () => {
    setCards(createDeck());
    setFlipped([]);
    setMoves(0);
    setLocked(false);
    setComplete(false);
    setScoreSubmitted(false);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <Link to="/" className="inline-flex items-center gap-2 font-pixel text-xs text-arcade-muted hover:text-neon-green transition-colors mb-6 tracking-wider">
        <ArrowLeft className="w-4 h-4" /> BACK TO LOBBY
      </Link>

      <h1 className="font-pixel text-3xl text-neon-yellow drop-shadow-neon-yellow mb-2 tracking-widest">MEMORY MATCH</h1>
      <p className="text-arcade-muted text-sm mb-6 font-sans">Flip cards to find matching pairs. Fewer moves = better score!</p>

      <div className="flex flex-col lg:flex-row gap-8 items-start">
        {/* Game area */}
        <div className="flex-1">
          {/* Stats bar */}
          <div className="flex items-center justify-between mb-4">
            <div className="font-pixel text-sm text-arcade-muted tracking-wider">
              MOVES: <span className="text-neon-yellow">{moves}</span>
            </div>
            <div className="font-pixel text-sm text-arcade-muted tracking-wider">
              PAIRS: <span className="text-neon-yellow">{cards.filter((c) => c.matched).length / 2}</span>
              <span className="text-arcade-muted">/{CARD_SYMBOLS.length}</span>
            </div>
            <button
              onClick={restart}
              className="font-pixel text-xs px-3 py-1.5 rounded border border-neon-yellow/50 text-neon-yellow hover:bg-neon-yellow/10 transition-colors tracking-wider flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" /> RESTART
            </button>
          </div>

          {/* Card grid */}
          <div className="grid grid-cols-4 gap-3">
            {cards.map((card, idx) => (
              <button
                key={card.id}
                onClick={() => handleCardClick(idx)}
                disabled={card.matched || locked}
                className={`aspect-square rounded-xl border-2 text-3xl flex items-center justify-center transition-all duration-300 font-pixel select-none
                  ${card.matched
                    ? 'border-neon-yellow/30 bg-neon-yellow/5 opacity-50 cursor-default'
                    : card.flipped
                    ? 'border-neon-yellow bg-neon-yellow/10 shadow-neon-yellow scale-105'
                    : 'border-arcade-border bg-arcade-card hover:border-neon-yellow/50 hover:bg-neon-yellow/5 cursor-pointer'
                  }`}
              >
                {card.flipped || card.matched ? (
                  <span className={card.matched ? 'opacity-60' : ''}>{card.symbol}</span>
                ) : (
                  <span className="text-arcade-muted text-xl">?</span>
                )}
              </button>
            ))}
          </div>

          {/* Completion overlay */}
          {complete && (
            <div className="mt-6 p-6 rounded-xl border-2 border-neon-yellow/50 bg-neon-yellow/5 text-center">
              <p className="font-pixel text-2xl text-neon-yellow mb-1 tracking-widest drop-shadow-neon-yellow">
                🎉 YOU WIN!
              </p>
              <p className="font-pixel text-sm text-arcade-muted mb-4 tracking-wider">
                COMPLETED IN <span className="text-neon-yellow">{moves}</span> MOVES
              </p>
              {!scoreSubmitted && (
                <div className="max-w-xs mx-auto mb-4">
                  <ScoreSubmission
                    game="memory-match"
                    score={moves}
                    onSubmitted={() => setScoreSubmitted(true)}
                    label="SAVE YOUR SCORE"
                    scoreSuffix="moves"
                  />
                </div>
              )}
              <button onClick={restart} className="btn-neon-yellow font-pixel text-sm px-8 py-3 rounded-lg tracking-widest">
                <RotateCcw className="w-4 h-4 inline mr-2" />PLAY AGAIN
              </button>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="w-full lg:w-72 flex flex-col gap-4">
          <Leaderboard game="memory-match" title="BEST MOVES" accentColor="neon-yellow" lowerIsBetter />
          <div className="bg-arcade-card rounded-xl border border-neon-yellow/20 p-4">
            <p className="font-pixel text-xs text-neon-yellow mb-3 tracking-wider">HOW TO PLAY</p>
            <ul className="text-arcade-muted text-sm space-y-1 font-sans">
              <li>🃏 Click a card to flip it</li>
              <li>🔍 Find matching pairs</li>
              <li>⏱️ Non-matches flip back</li>
              <li>🏆 Match all 8 pairs to win</li>
              <li>⭐ Fewer moves = better!</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
