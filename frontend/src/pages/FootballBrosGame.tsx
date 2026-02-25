import { useNavigate } from '@tanstack/react-router';
import { ArrowLeft } from 'lucide-react';
import Leaderboard from '../components/Leaderboard';

export default function FootballBrosGame() {
  const navigate = useNavigate();

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate({ to: '/' })}
          className="text-arcade-muted hover:text-neon-green transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="font-pixel text-base text-neon-green tracking-widest">FOOTBALL BROS</h1>
        <span className="font-pixel text-[10px] text-neon-yellow">🏈 ARCADE</span>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* iframe wrapper */}
        <div className="flex-1">
          <div
            className="relative rounded-xl overflow-hidden border-2 border-neon-green/40 w-full"
            style={{ minHeight: '600px', height: 'calc(100vh - 220px)' }}
          >
            <iframe
              src="https://footballbros.io"
              title="Football Bros"
              className="w-full h-full border-0"
              style={{ minHeight: '600px' }}
              allowFullScreen
            />
          </div>
        </div>

        {/* Leaderboard sidebar */}
        <div className="lg:w-64">
          <Leaderboard
            game="football-bros"
            title="🏈 FOOTBALL BROS"
            accentColor="neon-green"
          />
        </div>
      </div>
    </div>
  );
}
