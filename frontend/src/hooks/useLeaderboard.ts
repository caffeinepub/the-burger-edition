import { useState, useCallback } from 'react';

export interface ScoreEntry {
  nickname: string;
  score: number;
  date: string;
}

function getStorageKey(game: string) {
  return `arcade-hub-leaderboard-${game}`;
}

function loadScores(game: string): ScoreEntry[] {
  try {
    const raw = localStorage.getItem(getStorageKey(game));
    if (!raw) return [];
    return JSON.parse(raw) as ScoreEntry[];
  } catch {
    return [];
  }
}

function saveScores(game: string, scores: ScoreEntry[]) {
  try {
    localStorage.setItem(getStorageKey(game), JSON.stringify(scores));
  } catch {
    // ignore storage errors
  }
}

export function useLocalLeaderboard(game: string, lowerIsBetter = false) {
  const [scores, setScores] = useState<ScoreEntry[]>(() => {
    const raw = loadScores(game);
    return raw.sort((a, b) => lowerIsBetter ? a.score - b.score : b.score - a.score);
  });

  const addScore = useCallback(
    (nickname: string, score: number) => {
      const entry: ScoreEntry = { nickname, score, date: new Date().toISOString() };
      const existing = loadScores(game);
      const updated = [...existing, entry]
        .sort((a, b) => lowerIsBetter ? a.score - b.score : b.score - a.score)
        .slice(0, 10);
      saveScores(game, updated);
      setScores(updated);
    },
    [game, lowerIsBetter]
  );

  return { scores, addScore };
}
