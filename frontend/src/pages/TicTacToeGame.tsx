import { useState } from 'react';
import { Link } from '@tanstack/react-router';
import { ArrowLeft, RotateCcw } from 'lucide-react';

type Cell = 'X' | 'O' | null;

const WINNING_LINES = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
  [0, 3, 6], [1, 4, 7], [2, 5, 8], // cols
  [0, 4, 8], [2, 4, 6],             // diagonals
];

function checkWinner(board: Cell[]): { winner: Cell; line: number[] } | null {
  for (const line of WINNING_LINES) {
    const [a, b, c] = line;
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return { winner: board[a], line };
    }
  }
  return null;
}

export default function TicTacToeGame() {
  const [board, setBoard] = useState<Cell[]>(Array(9).fill(null));
  const [currentPlayer, setCurrentPlayer] = useState<'X' | 'O'>('X');
  const [winResult, setWinResult] = useState<{ winner: Cell; line: number[] } | null>(null);
  const [isDraw, setIsDraw] = useState(false);

  const handleClick = (idx: number) => {
    if (board[idx] || winResult || isDraw) return;
    const newBoard = [...board];
    newBoard[idx] = currentPlayer;
    const result = checkWinner(newBoard);
    setBoard(newBoard);
    if (result) {
      setWinResult(result);
    } else if (newBoard.every((c) => c !== null)) {
      setIsDraw(true);
    } else {
      setCurrentPlayer(currentPlayer === 'X' ? 'O' : 'X');
    }
  };

  const restart = () => {
    setBoard(Array(9).fill(null));
    setCurrentPlayer('X');
    setWinResult(null);
    setIsDraw(false);
  };

  const getCellStyle = (idx: number) => {
    const val = board[idx];
    const isWinCell = winResult?.line.includes(idx);
    if (isWinCell) {
      return winResult?.winner === 'X'
        ? 'border-neon-cyan bg-neon-cyan/10 text-neon-cyan shadow-neon-cyan scale-105'
        : 'border-neon-pink bg-neon-pink/10 text-neon-pink shadow-neon-pink scale-105';
    }
    if (val === 'X') return 'border-neon-cyan/60 text-neon-cyan hover:border-neon-cyan hover:bg-neon-cyan/5';
    if (val === 'O') return 'border-neon-pink/60 text-neon-pink hover:border-neon-pink hover:bg-neon-pink/5';
    return 'border-arcade-border hover:border-neon-green/50 hover:bg-neon-green/5 cursor-pointer';
  };

  const statusText = winResult
    ? `PLAYER ${winResult.winner} WINS!`
    : isDraw
    ? "IT'S A DRAW!"
    : `PLAYER ${currentPlayer}'S TURN`;

  const statusColor = winResult
    ? winResult.winner === 'X' ? 'text-neon-cyan' : 'text-neon-pink'
    : isDraw
    ? 'text-neon-yellow'
    : currentPlayer === 'X' ? 'text-neon-cyan' : 'text-neon-pink';

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <Link to="/" className="inline-flex items-center gap-2 font-pixel text-xs text-arcade-muted hover:text-neon-green transition-colors mb-6 tracking-wider">
        <ArrowLeft className="w-4 h-4" /> BACK TO LOBBY
      </Link>

      <h1 className="font-pixel text-3xl text-neon-pink drop-shadow-neon-pink mb-2 tracking-widest">TIC-TAC-TOE</h1>
      <p className="text-arcade-muted text-sm mb-8 font-sans">Two players take turns. Get three in a row to win!</p>

      {/* Status */}
      <div className="flex items-center justify-between mb-6">
        <p className={`font-pixel text-lg tracking-widest ${statusColor}`}>{statusText}</p>
        <button
          onClick={restart}
          className="font-pixel text-xs px-3 py-1.5 rounded border border-neon-pink/50 text-neon-pink hover:bg-neon-pink/10 transition-colors tracking-wider flex items-center gap-1"
        >
          <RotateCcw className="w-3 h-3" /> RESTART
        </button>
      </div>

      {/* Player indicators */}
      <div className="flex gap-4 mb-6">
        <div className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-all ${
          !winResult && !isDraw && currentPlayer === 'X'
            ? 'border-neon-cyan bg-neon-cyan/10'
            : 'border-arcade-border opacity-50'
        }`}>
          <span className="font-pixel text-neon-cyan text-lg">X</span>
          <span className="font-pixel text-xs text-arcade-muted tracking-wider">PLAYER 1</span>
        </div>
        <div className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-all ${
          !winResult && !isDraw && currentPlayer === 'O'
            ? 'border-neon-pink bg-neon-pink/10'
            : 'border-arcade-border opacity-50'
        }`}>
          <span className="font-pixel text-neon-pink text-lg">O</span>
          <span className="font-pixel text-xs text-arcade-muted tracking-wider">PLAYER 2</span>
        </div>
      </div>

      {/* Board */}
      <div className="grid grid-cols-3 gap-3 max-w-xs mx-auto mb-8">
        {board.map((cell, idx) => (
          <button
            key={idx}
            onClick={() => handleClick(idx)}
            disabled={!!cell || !!winResult || isDraw}
            className={`aspect-square flex items-center justify-center rounded-xl border-2 text-4xl font-pixel transition-all duration-200 ${getCellStyle(idx)}`}
          >
            {cell}
          </button>
        ))}
      </div>

      {/* Result message */}
      {(winResult || isDraw) && (
        <div className={`text-center p-6 rounded-xl border-2 mb-6 ${
          winResult
            ? winResult.winner === 'X'
              ? 'border-neon-cyan/50 bg-neon-cyan/5'
              : 'border-neon-pink/50 bg-neon-pink/5'
            : 'border-neon-yellow/50 bg-neon-yellow/5'
        }`}>
          <p className={`font-pixel text-2xl mb-4 tracking-widest ${statusColor}`}>
            {winResult ? `🏆 PLAYER ${winResult.winner} WINS!` : '🤝 DRAW!'}
          </p>
          <button
            onClick={restart}
            className="btn-neon-pink font-pixel text-sm px-8 py-3 rounded-lg tracking-widest"
          >
            <RotateCcw className="w-4 h-4 inline mr-2" />PLAY AGAIN
          </button>
        </div>
      )}

      {/* Instructions */}
      <div className="bg-arcade-card rounded-xl border border-neon-pink/20 p-4">
        <p className="font-pixel text-xs text-neon-pink mb-3 tracking-wider">HOW TO PLAY</p>
        <ul className="text-arcade-muted text-sm space-y-1 font-sans">
          <li>🎮 Two players take turns on the same device</li>
          <li>❌ Player 1 plays as X (cyan)</li>
          <li>⭕ Player 2 plays as O (pink)</li>
          <li>🏆 Get 3 in a row (horizontal, vertical, or diagonal) to win</li>
        </ul>
      </div>
    </div>
  );
}
