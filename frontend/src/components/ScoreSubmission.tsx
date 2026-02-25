import { useState } from 'react';
import { useLocalLeaderboard } from '../hooks/useLeaderboard';
import { CheckCircle } from 'lucide-react';

interface ScoreSubmissionProps {
  game: string;
  score: number;
  onSubmitted: () => void;
  label?: string;
  scoreSuffix?: string;
}

export default function ScoreSubmission({ game, score, onSubmitted, label = 'SAVE SCORE', scoreSuffix }: ScoreSubmissionProps) {
  const [nickname, setNickname] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const { addScore } = useLocalLeaderboard(game);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const name = nickname.trim() || 'PLAYER';
    addScore(name, score);
    setSubmitted(true);
    onSubmitted();
  };

  if (submitted) {
    return (
      <div className="flex items-center justify-center gap-2 py-2 text-neon-green font-pixel text-xs tracking-wider">
        <CheckCircle className="w-4 h-4" />
        SCORE SAVED!
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2">
      <p className="font-pixel text-xs text-arcade-muted tracking-wider text-center">
        {label} — {score}{scoreSuffix ? ` ${scoreSuffix}` : ' pts'}
      </p>
      <div className="flex gap-2">
        <input
          type="text"
          value={nickname}
          onChange={(e) => setNickname(e.target.value.toUpperCase().slice(0, 10))}
          placeholder="YOUR NAME"
          maxLength={10}
          className="flex-1 bg-arcade-bg border border-arcade-border rounded-lg px-3 py-2 font-pixel text-xs text-arcade-text placeholder:text-arcade-muted/50 focus:outline-none focus:border-neon-green/60 tracking-wider"
        />
        <button
          type="submit"
          className="btn-neon-green font-pixel text-xs px-4 py-2 rounded-lg tracking-wider whitespace-nowrap"
        >
          SAVE
        </button>
      </div>
    </form>
  );
}
