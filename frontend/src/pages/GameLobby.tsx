import { useNavigate } from '@tanstack/react-router';
import { Trophy, Zap } from 'lucide-react';
import Leaderboard from '../components/Leaderboard';

const games = [
  {
    id: 'snake',
    title: 'SNAKE',
    description: 'Guide your snake to eat food and grow longer. Avoid walls and your own tail!',
    icon: '/assets/generated/snake-icon.dim_128x128.png',
    route: '/snake',
    accentClass: 'text-neon-green',
    borderClass: 'border-neon-green/40 hover:border-neon-green',
    glowClass: 'hover:shadow-neon-green',
    badgeClass: 'bg-neon-green/10 text-neon-green',
    btnClass: 'btn-neon-green',
    tag: 'CLASSIC',
    emoji: '🐍',
  },
  {
    id: 'tic-tac-toe',
    title: 'TIC-TAC-TOE',
    description: 'Challenge a friend in the timeless battle of X vs O. Get three in a row to win!',
    icon: '/assets/generated/tictactoe-icon.dim_128x128.png',
    route: '/tic-tac-toe',
    accentClass: 'text-neon-pink',
    borderClass: 'border-neon-pink/40 hover:border-neon-pink',
    glowClass: 'hover:shadow-neon-pink',
    badgeClass: 'bg-neon-pink/10 text-neon-pink',
    btnClass: 'btn-neon-pink',
    tag: '2 PLAYER',
    emoji: '❌',
  },
  {
    id: 'memory-match',
    title: 'MEMORY MATCH',
    description: 'Flip cards to find matching pairs. Test your memory and beat your best move count!',
    icon: '/assets/generated/memory-icon.dim_128x128.png',
    route: '/memory-match',
    accentClass: 'text-neon-yellow',
    borderClass: 'border-neon-yellow/40 hover:border-neon-yellow',
    glowClass: 'hover:shadow-neon-yellow',
    badgeClass: 'bg-neon-yellow/10 text-neon-yellow',
    btnClass: 'btn-neon-yellow',
    tag: 'PUZZLE',
    emoji: '🃏',
  },
  {
    id: 'stickman-archers',
    title: 'STICKMAN ARCHERS',
    description: 'Aim and shoot arrows in epic stickman duels. Defeat your opponent before they defeat you!',
    icon: null,
    route: '/stickman-archers',
    accentClass: 'text-neon-cyan',
    borderClass: 'border-neon-cyan/40 hover:border-neon-cyan',
    glowClass: 'hover:shadow-neon-cyan',
    badgeClass: 'bg-neon-cyan/10 text-neon-cyan',
    btnClass: 'btn-neon-cyan',
    tag: 'ACTION',
    emoji: '🏹',
  },
  {
    id: 'ovo',
    title: 'OvO',
    description: 'Timed platformer: run, slide, and jump through obstacle courses as fast as you can!',
    icon: null,
    route: '/ovo',
    accentClass: 'text-neon-cyan',
    borderClass: 'border-neon-cyan/40 hover:border-neon-cyan',
    glowClass: 'hover:shadow-neon-cyan',
    badgeClass: 'bg-neon-cyan/10 text-neon-cyan',
    btnClass: 'btn-neon-cyan',
    tag: 'SPEED RUN',
    emoji: '⚡',
  },
  {
    id: 'super-mario',
    title: 'SUPER MARIO',
    description: 'Run, jump, and stomp enemies in this classic side-scrolling platformer adventure!',
    icon: null,
    route: '/super-mario',
    accentClass: 'text-neon-yellow',
    borderClass: 'border-neon-yellow/40 hover:border-neon-yellow',
    glowClass: 'hover:shadow-neon-yellow',
    badgeClass: 'bg-neon-yellow/10 text-neon-yellow',
    btnClass: 'btn-neon-yellow',
    tag: 'PLATFORMER',
    emoji: '🍄',
  },
  {
    id: 'pokemon',
    title: 'POKÉMON BATTLE',
    description: 'Choose your Pokémon and battle in turn-based combat. Catch them all!',
    icon: null,
    route: '/pokemon',
    accentClass: 'text-neon-pink',
    borderClass: 'border-neon-pink/40 hover:border-neon-pink',
    glowClass: 'hover:shadow-neon-pink',
    badgeClass: 'bg-neon-pink/10 text-neon-pink',
    btnClass: 'btn-neon-pink',
    tag: 'RPG',
    emoji: '⚔️',
  },
  {
    id: 'slope',
    title: 'SLOPE',
    description: 'Roll a ball down an endless 3D slope. Dodge obstacles and survive as long as you can!',
    icon: null,
    route: '/slope',
    accentClass: 'text-neon-green',
    borderClass: 'border-neon-green/40 hover:border-neon-green',
    glowClass: 'hover:shadow-neon-green',
    badgeClass: 'bg-neon-green/10 text-neon-green',
    btnClass: 'btn-neon-green',
    tag: 'ENDLESS',
    emoji: '🎱',
  },
  {
    id: '1v1-lol',
    title: '1V1.LOL',
    description: 'Build structures and shoot your opponent in this fast-paced 2D arena battle!',
    icon: null,
    route: '/1v1-lol',
    accentClass: 'text-neon-cyan',
    borderClass: 'border-neon-cyan/40 hover:border-neon-cyan',
    glowClass: 'hover:shadow-neon-cyan',
    badgeClass: 'bg-neon-cyan/10 text-neon-cyan',
    btnClass: 'btn-neon-cyan',
    tag: 'BATTLE',
    emoji: '🔫',
  },
  {
    id: 'minecraft-classic',
    title: 'MINECRAFT',
    description: 'Mine blocks, build structures, and explore a 2D pixel world. Creativity is your limit!',
    icon: null,
    route: '/minecraft-classic',
    accentClass: 'text-neon-green',
    borderClass: 'border-neon-green/40 hover:border-neon-green',
    glowClass: 'hover:shadow-neon-green',
    badgeClass: 'bg-neon-green/10 text-neon-green',
    btnClass: 'btn-neon-green',
    tag: 'SANDBOX',
    emoji: '⛏️',
  },
  {
    id: 'retro-bowl',
    title: 'RETRO BOWL',
    description: 'Call plays, throw passes, and score touchdowns in this retro American football game!',
    icon: null,
    route: '/retro-bowl',
    accentClass: 'text-neon-yellow',
    borderClass: 'border-neon-yellow/40 hover:border-neon-yellow',
    glowClass: 'hover:shadow-neon-yellow',
    badgeClass: 'bg-neon-yellow/10 text-neon-yellow',
    btnClass: 'btn-neon-yellow',
    tag: 'SPORTS',
    emoji: '🏈',
  },
  {
    id: 'among-us',
    title: 'AMONG US',
    description: 'Complete tasks as a Crewmate while avoiding the Impostor lurking in the shadows!',
    icon: null,
    route: '/among-us',
    accentClass: 'text-neon-cyan',
    borderClass: 'border-neon-cyan/40 hover:border-neon-cyan',
    glowClass: 'hover:shadow-neon-cyan',
    badgeClass: 'bg-neon-cyan/10 text-neon-cyan',
    btnClass: 'btn-neon-cyan',
    tag: 'SURVIVAL',
    emoji: '🚀',
  },
  {
    id: 'fnaf',
    title: "FIVE NIGHTS AT FREDDY'S",
    description: 'Monitor cameras, manage power, and survive until 6 AM in this horror survival game!',
    icon: null,
    route: '/fnaf',
    accentClass: 'text-neon-pink',
    borderClass: 'border-neon-pink/40 hover:border-neon-pink',
    glowClass: 'hover:shadow-neon-pink',
    badgeClass: 'bg-neon-pink/10 text-neon-pink',
    btnClass: 'btn-neon-pink',
    tag: 'HORROR',
    emoji: '🐻',
  },
  {
    id: 'rocket-soccer-league',
    title: 'ROCKET SOCCER LEAGUE',
    description: 'Drive a rocket-powered car and score goals in this 3D soccer arena! Boost, dodge, and outplay the AI!',
    icon: null,
    route: '/rocket-soccer-league',
    accentClass: 'text-neon-cyan',
    borderClass: 'border-neon-cyan/40 hover:border-neon-cyan',
    glowClass: 'hover:shadow-neon-cyan',
    badgeClass: 'bg-neon-cyan/10 text-neon-cyan',
    btnClass: 'btn-neon-cyan',
    tag: '3D SPORTS',
    emoji: '🚗',
  },
];

const leaderboards = [
  { game: 'snake', title: 'SNAKE', accentColor: 'neon-green' as const },
  { game: 'memory-match', title: 'MEMORY MATCH', accentColor: 'neon-yellow' as const, lowerIsBetter: true },
  { game: 'ovo', title: 'OvO SPEED RUN', accentColor: 'neon-cyan' as const, lowerIsBetter: true },
  { game: 'slope', title: 'SLOPE', accentColor: 'neon-green' as const },
  { game: 'retro-bowl', title: 'RETRO BOWL', accentColor: 'neon-yellow' as const },
  { game: 'among-us', title: 'AMONG US', accentColor: 'neon-cyan' as const },
  { game: 'fnaf', title: 'FNAF', accentColor: 'neon-pink' as const },
  { game: 'rocket-soccer-league', title: 'ROCKET SOCCER', accentColor: 'neon-cyan' as const },
];

export default function GameLobby() {
  const navigate = useNavigate();

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Hero */}
      <div className="relative rounded-2xl overflow-hidden mb-12 border border-neon-green/30">
        <img
          src="/assets/generated/arcade-hero.dim_800x400.png"
          alt="Arcade Hub"
          className="w-full object-cover max-h-64 sm:max-h-80"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-arcade-bg via-arcade-bg/60 to-transparent flex flex-col items-center justify-end pb-8 px-4 text-center">
          <h1 className="font-pixel text-3xl sm:text-5xl text-neon-green drop-shadow-neon-green mb-2 tracking-widest">
            ARCADE HUB
          </h1>
          <p className="font-pixel text-xs sm:text-sm text-neon-cyan tracking-widest">
            INSERT COIN TO PLAY
          </p>
        </div>
      </div>

      {/* Game Cards */}
      <section className="mb-14">
        <div className="flex items-center gap-3 mb-6">
          <Zap className="w-5 h-5 text-neon-yellow" />
          <h2 className="font-pixel text-lg text-arcade-text tracking-widest">SELECT GAME</h2>
          <span className="font-pixel text-xs text-arcade-muted ml-2">{games.length} GAMES</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {games.map((game) => (
            <div
              key={game.id}
              className={`group relative bg-arcade-card rounded-xl border-2 ${game.borderClass} ${game.glowClass} transition-all duration-300 overflow-hidden cursor-pointer`}
              onClick={() => navigate({ to: game.route })}
            >
              {/* Tag */}
              <div className={`absolute top-3 right-3 font-pixel text-[10px] px-2 py-1 rounded ${game.badgeClass} tracking-widest`}>
                {game.tag}
              </div>

              {/* Icon */}
              <div className="flex justify-center pt-8 pb-4">
                {game.icon ? (
                  <img
                    src={game.icon}
                    alt={game.title}
                    className="w-16 h-16 object-contain pixelated"
                  />
                ) : (
                  <span className="text-5xl">{game.emoji}</span>
                )}
              </div>

              {/* Content */}
              <div className="px-4 pb-5">
                <h3 className={`font-pixel text-sm ${game.accentClass} mb-2 tracking-wider leading-relaxed`}>
                  {game.title}
                </h3>
                <p className="font-pixel text-[10px] text-arcade-muted leading-relaxed mb-4 tracking-wide">
                  {game.description}
                </p>
                <button
                  className={`w-full ${game.btnClass} font-pixel text-xs py-2 tracking-widest`}
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate({ to: game.route });
                  }}
                >
                  PLAY NOW
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Leaderboards */}
      <section>
        <div className="flex items-center gap-3 mb-6">
          <Trophy className="w-5 h-5 text-neon-yellow" />
          <h2 className="font-pixel text-lg text-arcade-text tracking-widest">HALL OF FAME</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {leaderboards.map((lb) => (
            <Leaderboard
              key={lb.game}
              game={lb.game}
              title={lb.title}
              accentColor={lb.accentColor}
              lowerIsBetter={lb.lowerIsBetter}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
