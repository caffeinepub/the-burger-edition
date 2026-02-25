import { Trophy, Medal } from 'lucide-react';
import { useLocalLeaderboard } from '../hooks/useLeaderboard';

interface LeaderboardProps {
  game: string;
  title: string;
  accentColor: 'neon-green' | 'neon-yellow' | 'neon-pink' | 'neon-cyan';
  lowerIsBetter?: boolean;
}

const accentMap = {
  'neon-green': {
    text: 'text-neon-green',
    border: 'border-neon-green/30',
    bg: 'bg-neon-green/5',
    headerBorder: 'border-neon-green/20',
    rankColors: ['text-neon-yellow', 'text-arcade-muted', 'text-arcade-muted'],
  },
  'neon-yellow': {
    text: 'text-neon-yellow',
    border: 'border-neon-yellow/30',
    bg: 'bg-neon-yellow/5',
    headerBorder: 'border-neon-yellow/20',
    rankColors: ['text-neon-yellow', 'text-arcade-muted', 'text-arcade-muted'],
  },
  'neon-pink': {
    text: 'text-neon-pink',
    border: 'border-neon-pink/30',
    bg: 'bg-neon-pink/5',
    headerBorder: 'border-neon-pink/20',
    rankColors: ['text-neon-yellow', 'text-arcade-muted', 'text-arcade-muted'],
  },
  'neon-cyan': {
    text: 'text-neon-cyan',
    border: 'border-neon-cyan/30',
    bg: 'bg-neon-cyan/5',
    headerBorder: 'border-neon-cyan/20',
    rankColors: ['text-neon-yellow', 'text-arcade-muted', 'text-arcade-muted'],
  },
};

const rankIcons = ['🥇', '🥈', '🥉'];

export default function Leaderboard({ game, title, accentColor, lowerIsBetter = false }: LeaderboardProps) {
  const { scores } = useLocalLeaderboard(game, lowerIsBetter);
  const styles = accentMap[accentColor];

  return (
    <div className={`bg-arcade-card rounded-xl border ${styles.border} overflow-hidden`}>
      {/* Header */}
      <div className={`flex items-center gap-2 px-4 py-3 border-b ${styles.headerBorder} ${styles.bg}`}>
        <Trophy className={`w-4 h-4 ${styles.text}`} />
        <span className={`font-pixel text-xs ${styles.text} tracking-widest`}>{title}</span>
      </div>

      {/* Scores */}
      <div className="divide-y divide-arcade-border/30">
        {scores.length === 0 ? (
          <div className="px-4 py-6 text-center">
            <Medal className="w-8 h-8 text-arcade-muted mx-auto mb-2 opacity-40" />
            <p className="font-pixel text-xs text-arcade-muted tracking-wider">NO SCORES YET</p>
            <p className="text-arcade-muted text-xs mt-1 font-sans">Play a game to get on the board!</p>
          </div>
        ) : (
          scores.slice(0, 5).map((entry, i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-2.5">
              <span className="text-base w-6 text-center">{rankIcons[i] ?? `${i + 1}.`}</span>
              <span className="flex-1 font-pixel text-xs text-arcade-text tracking-wider truncate">
                {entry.nickname}
              </span>
              <span className={`font-pixel text-sm ${styles.text} tabular-nums`}>
                {entry.score}
                {lowerIsBetter && <span className="text-arcade-muted text-xs ml-1">mv</span>}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
