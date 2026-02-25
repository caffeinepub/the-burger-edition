import { useRef, useEffect } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { ArrowLeft } from 'lucide-react';
import { usePokemonGame } from '../hooks/usePokemonGame';
import ScoreSubmission from '../components/ScoreSubmission';
import Leaderboard from '../components/Leaderboard';
import { useState } from 'react';

function HpBar({ hp, maxHp, color }: { hp: number; maxHp: number; color: string }) {
  const pct = Math.max(0, (hp / maxHp) * 100);
  const barColor = pct > 50 ? '#66bb6a' : pct > 25 ? '#ffd54f' : '#ef5350';
  return (
    <div className="w-full">
      <div className="flex justify-between mb-1">
        <span className="font-pixel text-[10px] text-arcade-muted">HP</span>
        <span className="font-pixel text-[10px]" style={{ color }}>{hp}/{maxHp}</span>
      </div>
      <div className="h-3 bg-arcade-bg rounded-full overflow-hidden border border-arcade-border">
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{ width: `${pct}%`, backgroundColor: barColor }}
        />
      </div>
    </div>
  );
}

export default function PokemonGame() {
  const navigate = useNavigate();
  const { phase, playerPokemon, enemyPokemon, battleLog, isPlayerTurn, isAnimating,
    wins, roster, selectPokemon, playerAttack, restart } = usePokemonGame();
  const [scoreSubmitted, setScoreSubmitted] = useState(false);
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [battleLog]);

  const playerWon = phase === 'result' && playerPokemon && playerPokemon.hp > 0;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => navigate({ to: '/' })} className="text-arcade-muted hover:text-neon-green transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="font-pixel text-xl text-neon-pink tracking-widest">POKÉMON BATTLE</h1>
        <span className="font-pixel text-xs text-neon-yellow ml-auto">WINS: {wins}</span>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1">
          {/* Roster Selection */}
          {phase === 'select' && (
            <div className="bg-arcade-card rounded-xl border-2 border-neon-pink/40 p-6">
              <h2 className="font-pixel text-sm text-neon-pink mb-6 tracking-wider text-center">CHOOSE YOUR POKÉMON!</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {roster.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => selectPokemon(p)}
                    className="bg-arcade-bg rounded-xl border-2 border-arcade-border hover:border-neon-pink/60 p-4 text-center transition-all hover:shadow-neon-pink group"
                  >
                    <div className="text-4xl mb-2">{p.emoji}</div>
                    <p className="font-pixel text-xs text-arcade-text mb-1">{p.name}</p>
                    <p className="font-pixel text-[10px] text-arcade-muted mb-2">{p.type}</p>
                    <div className="text-[10px] text-arcade-muted font-sans">
                      <div>HP: {p.maxHp}</div>
                      <div>ATK: {p.attack} DEF: {p.defense}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Battle Screen */}
          {(phase === 'battle' || phase === 'result') && playerPokemon && enemyPokemon && (
            <div className="space-y-4">
              {/* Battle Arena */}
              <div className="bg-arcade-card rounded-xl border-2 border-neon-pink/40 p-6">
                <div className="flex justify-between items-start mb-6">
                  {/* Enemy */}
                  <div className="w-5/12">
                    <p className="font-pixel text-xs text-neon-pink mb-1">{enemyPokemon.name}</p>
                    <p className="font-pixel text-[10px] text-arcade-muted mb-2">{enemyPokemon.type}</p>
                    <HpBar hp={enemyPokemon.hp} maxHp={enemyPokemon.maxHp} color={enemyPokemon.color} />
                  </div>
                  {/* VS */}
                  <div className="flex flex-col items-center justify-center">
                    <div className="text-5xl">{enemyPokemon.emoji}</div>
                    <span className="font-pixel text-xs text-arcade-muted mt-2">VS</span>
                    <div className="text-5xl mt-2">{playerPokemon.emoji}</div>
                  </div>
                  {/* Player */}
                  <div className="w-5/12 text-right">
                    <p className="font-pixel text-xs text-neon-cyan mb-1">{playerPokemon.name}</p>
                    <p className="font-pixel text-[10px] text-arcade-muted mb-2">{playerPokemon.type}</p>
                    <HpBar hp={playerPokemon.hp} maxHp={playerPokemon.maxHp} color={playerPokemon.color} />
                  </div>
                </div>

                {/* Battle Log */}
                <div
                  ref={logRef}
                  className="bg-arcade-bg rounded-lg border border-arcade-border p-3 h-28 overflow-y-auto mb-4"
                >
                  {battleLog.map((log, i) => (
                    <p key={i} className="font-pixel text-[10px] mb-1" style={{ color: log.color }}>
                      {log.text}
                    </p>
                  ))}
                </div>

                {/* Move Buttons */}
                {phase === 'battle' && isPlayerTurn && !isAnimating && (
                  <div className="grid grid-cols-2 gap-2">
                    {playerPokemon.moves.map((move, i) => (
                      <button
                        key={i}
                        onClick={() => playerAttack(i)}
                        disabled={move.pp <= 0}
                        className="bg-arcade-bg border border-neon-pink/40 hover:border-neon-pink rounded-lg p-3 text-left transition-all disabled:opacity-40"
                      >
                        <p className="font-pixel text-[10px] text-arcade-text">{move.name}</p>
                        <p className="font-pixel text-[10px] text-arcade-muted mt-1">
                          {move.type} | PP: {move.pp}/{move.maxPp}
                        </p>
                      </button>
                    ))}
                  </div>
                )}

                {phase === 'battle' && isAnimating && (
                  <div className="text-center py-4">
                    <p className="font-pixel text-xs text-arcade-muted animate-pulse">...</p>
                  </div>
                )}

                {/* Result */}
                {phase === 'result' && (
                  <div className="text-center space-y-4">
                    <p className={`font-pixel text-lg ${playerWon ? 'text-neon-green' : 'text-neon-pink'}`}>
                      {playerWon ? '🎉 VICTORY!' : '💀 DEFEATED!'}
                    </p>
                    {playerWon && !scoreSubmitted && (
                      <div className="max-w-xs mx-auto">
                        <ScoreSubmission
                          game="pokemon"
                          score={wins}
                          label="SAVE WINS"
                          scoreSuffix="wins"
                          onSubmitted={() => setScoreSubmitted(true)}
                        />
                      </div>
                    )}
                    <button onClick={restart} className="btn-neon-pink font-pixel text-xs px-6 py-3 rounded-lg tracking-widest">
                      ▶ BATTLE AGAIN
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="lg:w-64">
          <Leaderboard game="pokemon" title="MOST WINS" accentColor="neon-pink" />
        </div>
      </div>
    </div>
  );
}
