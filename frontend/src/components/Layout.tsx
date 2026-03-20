import { ReactNode, useState } from 'react';
import { Link } from '@tanstack/react-router';
import { Gamepad2, Heart, Menu, X } from 'lucide-react';

interface LayoutProps {
  children: ReactNode;
}

const navLinks = [
  { to: '/', label: 'LOBBY', color: 'hover:text-neon-cyan' },
  { to: '/snake', label: 'SNAKE', color: 'hover:text-neon-green' },
  { to: '/tic-tac-toe', label: 'TIC-TAC-TOE', color: 'hover:text-neon-pink' },
  { to: '/memory-match', label: 'MEMORY', color: 'hover:text-neon-yellow' },
  { to: '/stickman-archers', label: 'ARCHERS', color: 'hover:text-neon-cyan' },
  { to: '/ovo', label: 'OvO', color: 'hover:text-neon-cyan' },
  { to: '/super-mario', label: 'MARIO', color: 'hover:text-neon-yellow' },
  { to: '/pokemon', label: 'POKÉMON', color: 'hover:text-neon-pink' },
  { to: '/slope', label: 'SLOPE', color: 'hover:text-neon-green' },
  { to: '/1v1-lol', label: '1V1.LOL', color: 'hover:text-neon-cyan' },
  { to: '/minecraft-classic', label: 'MINECRAFT', color: 'hover:text-neon-green' },
  { to: '/retro-bowl', label: 'RETRO BOWL', color: 'hover:text-neon-yellow' },
  { to: '/among-us', label: 'AMONG US', color: 'hover:text-neon-cyan' },
  { to: '/fnaf', label: 'FNAF', color: 'hover:text-neon-pink' },
  { to: '/rocket-soccer-league', label: 'ROCKET SOCCER', color: 'hover:text-neon-cyan' },
  { to: '/rocket-soccer-derby', label: 'DERBY', color: 'hover:text-neon-yellow' },
  { to: '/f19-flight-simulator', label: 'F-19 SIM', color: 'hover:text-neon-green' },
];

export default function Layout({ children }: LayoutProps) {
  const hostname = typeof window !== 'undefined' ? window.location.hostname : 'unknown-app';
  const utmContent = encodeURIComponent(hostname);
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-arcade-bg text-arcade-text">
      {/* Header */}
      <header className="border-b border-neon-green/30 bg-arcade-surface/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 group shrink-0">
            <Gamepad2 className="w-7 h-7 text-neon-green group-hover:drop-shadow-neon-green transition-all" />
            <span className="font-pixel text-xl text-neon-green tracking-widest group-hover:drop-shadow-neon-green transition-all">
              ARCADE HUB
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden xl:flex items-center gap-3 flex-wrap">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`font-pixel text-[10px] text-arcade-muted ${link.color} transition-colors tracking-wider`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Mobile menu button */}
          <button
            className="xl:hidden text-arcade-muted hover:text-neon-green transition-colors p-1"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile nav dropdown */}
        {menuOpen && (
          <div className="xl:hidden border-t border-neon-green/20 bg-arcade-surface/95 px-4 py-3">
            <nav className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`font-pixel text-[10px] text-arcade-muted ${link.color} transition-colors tracking-wider py-1`}
                  onClick={() => setMenuOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>
        )}
      </header>

      {/* Main content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-neon-green/20 bg-arcade-surface/60 py-6 mt-auto">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="font-pixel text-xs text-arcade-muted tracking-wider">
            © {new Date().getFullYear()} ARCADE HUB
          </p>
          <p className="font-pixel text-xs text-arcade-muted flex items-center gap-1">
            Built with{' '}
            <Heart className="w-3 h-3 text-neon-pink fill-neon-pink inline" />{' '}
            using{' '}
            <a
              href={`https://caffeine.ai/?utm_source=Caffeine-footer&utm_medium=referral&utm_content=${utmContent}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-neon-cyan hover:text-neon-green transition-colors"
            >
              caffeine.ai
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}
