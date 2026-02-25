import { useState, useCallback } from 'react';

export interface Move {
  name: string;
  damage: number;
  accuracy: number;
  type: string;
  pp: number;
  maxPp: number;
}

export interface Pokemon {
  id: string;
  name: string;
  type: string;
  hp: number;
  maxHp: number;
  attack: number;
  defense: number;
  speed: number;
  emoji: string;
  color: string;
  moves: Move[];
}

export type BattlePhase = 'select' | 'battle' | 'result';
export type BattleLog = { text: string; color: string };

const ROSTER: Pokemon[] = [
  {
    id: 'fire',
    name: 'FLAMEON',
    type: 'Fire',
    hp: 100, maxHp: 100,
    attack: 18, defense: 10, speed: 15,
    emoji: '🔥',
    color: '#ff6b35',
    moves: [
      { name: 'Ember', damage: 20, accuracy: 95, type: 'Fire', pp: 25, maxPp: 25 },
      { name: 'Flamethrower', damage: 35, accuracy: 85, type: 'Fire', pp: 15, maxPp: 15 },
      { name: 'Tackle', damage: 15, accuracy: 100, type: 'Normal', pp: 35, maxPp: 35 },
      { name: 'Inferno', damage: 50, accuracy: 70, type: 'Fire', pp: 5, maxPp: 5 },
    ],
  },
  {
    id: 'water',
    name: 'AQUAFIN',
    type: 'Water',
    hp: 110, maxHp: 110,
    attack: 15, defense: 14, speed: 12,
    emoji: '💧',
    color: '#4fc3f7',
    moves: [
      { name: 'Water Gun', damage: 18, accuracy: 100, type: 'Water', pp: 25, maxPp: 25 },
      { name: 'Surf', damage: 32, accuracy: 90, type: 'Water', pp: 15, maxPp: 15 },
      { name: 'Tackle', damage: 15, accuracy: 100, type: 'Normal', pp: 35, maxPp: 35 },
      { name: 'Hydro Pump', damage: 48, accuracy: 75, type: 'Water', pp: 5, maxPp: 5 },
    ],
  },
  {
    id: 'grass',
    name: 'LEAFEON',
    type: 'Grass',
    hp: 105, maxHp: 105,
    attack: 14, defense: 16, speed: 10,
    emoji: '🌿',
    color: '#66bb6a',
    moves: [
      { name: 'Vine Whip', damage: 18, accuracy: 100, type: 'Grass', pp: 25, maxPp: 25 },
      { name: 'Razor Leaf', damage: 30, accuracy: 90, type: 'Grass', pp: 15, maxPp: 15 },
      { name: 'Tackle', damage: 15, accuracy: 100, type: 'Normal', pp: 35, maxPp: 35 },
      { name: 'Solar Beam', damage: 50, accuracy: 80, type: 'Grass', pp: 5, maxPp: 5 },
    ],
  },
  {
    id: 'electric',
    name: 'VOLTCHU',
    type: 'Electric',
    hp: 90, maxHp: 90,
    attack: 20, defense: 8, speed: 20,
    emoji: '⚡',
    color: '#ffd54f',
    moves: [
      { name: 'Thunder Shock', damage: 22, accuracy: 100, type: 'Electric', pp: 25, maxPp: 25 },
      { name: 'Thunderbolt', damage: 38, accuracy: 90, type: 'Electric', pp: 15, maxPp: 15 },
      { name: 'Quick Attack', damage: 18, accuracy: 100, type: 'Normal', pp: 30, maxPp: 30 },
      { name: 'Thunder', damage: 55, accuracy: 65, type: 'Electric', pp: 5, maxPp: 5 },
    ],
  },
  {
    id: 'psychic',
    name: 'PSYWAVE',
    type: 'Psychic',
    hp: 95, maxHp: 95,
    attack: 16, defense: 12, speed: 18,
    emoji: '🔮',
    color: '#ce93d8',
    moves: [
      { name: 'Confusion', damage: 20, accuracy: 100, type: 'Psychic', pp: 25, maxPp: 25 },
      { name: 'Psybeam', damage: 32, accuracy: 90, type: 'Psychic', pp: 15, maxPp: 15 },
      { name: 'Tackle', damage: 15, accuracy: 100, type: 'Normal', pp: 35, maxPp: 35 },
      { name: 'Psychic', damage: 48, accuracy: 80, type: 'Psychic', pp: 5, maxPp: 5 },
    ],
  },
  {
    id: 'rock',
    name: 'BOULDON',
    type: 'Rock',
    hp: 120, maxHp: 120,
    attack: 16, defense: 20, speed: 6,
    emoji: '🪨',
    color: '#a1887f',
    moves: [
      { name: 'Rock Throw', damage: 22, accuracy: 90, type: 'Rock', pp: 15, maxPp: 15 },
      { name: 'Rock Slide', damage: 35, accuracy: 85, type: 'Rock', pp: 10, maxPp: 10 },
      { name: 'Tackle', damage: 15, accuracy: 100, type: 'Normal', pp: 35, maxPp: 35 },
      { name: 'Stone Edge', damage: 52, accuracy: 70, type: 'Rock', pp: 5, maxPp: 5 },
    ],
  },
];

function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

function calcDamage(attacker: Pokemon, move: Move, defender: Pokemon): number {
  if (Math.random() * 100 > move.accuracy) return -1; // miss
  const base = Math.floor((move.damage * attacker.attack) / (defender.defense + 10));
  const variance = 0.85 + Math.random() * 0.15;
  return Math.max(1, Math.floor(base * variance));
}

export function usePokemonGame() {
  const [phase, setPhase] = useState<BattlePhase>('select');
  const [playerPokemon, setPlayerPokemon] = useState<Pokemon | null>(null);
  const [enemyPokemon, setEnemyPokemon] = useState<Pokemon | null>(null);
  const [battleLog, setBattleLog] = useState<BattleLog[]>([]);
  const [isPlayerTurn, setIsPlayerTurn] = useState(true);
  const [isAnimating, setIsAnimating] = useState(false);
  const [wins, setWins] = useState(0);

  const selectPokemon = useCallback((pokemon: Pokemon) => {
    const player = deepClone(pokemon);
    const enemyOptions = ROSTER.filter(p => p.id !== pokemon.id);
    const enemy = deepClone(enemyOptions[Math.floor(Math.random() * enemyOptions.length)]);
    setPlayerPokemon(player);
    setEnemyPokemon(enemy);
    setBattleLog([{ text: `A wild ${enemy.name} appeared!`, color: '#fff' }]);
    setIsPlayerTurn(true);
    setPhase('battle');
  }, []);

  const playerAttack = useCallback((moveIndex: number) => {
    if (!playerPokemon || !enemyPokemon || !isPlayerTurn || isAnimating) return;
    setIsAnimating(true);

    const move = playerPokemon.moves[moveIndex];
    if (move.pp <= 0) {
      setBattleLog(prev => [...prev, { text: 'No PP left for that move!', color: '#ff6b6b' }]);
      setIsAnimating(false);
      return;
    }

    const dmg = calcDamage(playerPokemon, move, enemyPokemon);
    const newPlayer = deepClone(playerPokemon);
    newPlayer.moves[moveIndex].pp -= 1;
    setPlayerPokemon(newPlayer);

    const newEnemy = deepClone(enemyPokemon);
    let log: BattleLog[] = [];

    if (dmg === -1) {
      log.push({ text: `${playerPokemon.name} used ${move.name}... but missed!`, color: '#aaa' });
    } else {
      newEnemy.hp = Math.max(0, newEnemy.hp - dmg);
      log.push({ text: `${playerPokemon.name} used ${move.name}! Dealt ${dmg} damage!`, color: '#ffd54f' });
    }

    setEnemyPokemon(newEnemy);

    if (newEnemy.hp <= 0) {
      log.push({ text: `${newEnemy.name} fainted! You win!`, color: '#66bb6a' });
      setBattleLog(prev => [...prev, ...log]);
      setWins(w => w + 1);
      setPhase('result');
      setIsAnimating(false);
      return;
    }

    setBattleLog(prev => [...prev, ...log]);

    // AI turn
    setTimeout(() => {
      const aiMove = newEnemy.moves[Math.floor(Math.random() * newEnemy.moves.length)];
      const aiDmg = calcDamage(newEnemy, aiMove, newPlayer);
      const afterAiPlayer = deepClone(newPlayer);
      const aiLog: BattleLog[] = [];

      if (aiDmg === -1) {
        aiLog.push({ text: `${newEnemy.name} used ${aiMove.name}... but missed!`, color: '#aaa' });
      } else {
        afterAiPlayer.hp = Math.max(0, afterAiPlayer.hp - aiDmg);
        aiLog.push({ text: `${newEnemy.name} used ${aiMove.name}! Dealt ${aiDmg} damage!`, color: '#ff6b6b' });
      }

      setPlayerPokemon(afterAiPlayer);
      setBattleLog(prev => [...prev, ...aiLog]);

      if (afterAiPlayer.hp <= 0) {
        setBattleLog(prev => [...prev, { text: `${afterAiPlayer.name} fainted! You lose!`, color: '#ff6b6b' }]);
        setPhase('result');
      }

      setIsAnimating(false);
      setIsPlayerTurn(true);
    }, 1000);

    setIsPlayerTurn(false);
  }, [playerPokemon, enemyPokemon, isPlayerTurn, isAnimating]);

  const restart = useCallback(() => {
    setPhase('select');
    setPlayerPokemon(null);
    setEnemyPokemon(null);
    setBattleLog([]);
    setIsPlayerTurn(true);
    setIsAnimating(false);
  }, []);

  return {
    phase, playerPokemon, enemyPokemon, battleLog, isPlayerTurn, isAnimating,
    wins, roster: ROSTER, selectPokemon, playerAttack, restart,
  };
}
