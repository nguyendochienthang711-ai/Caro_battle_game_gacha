import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useGameEngine } from '@/hooks/useGameEngine';
import { MatchHistoryItem, MoveRecord, STORAGE_KEYS, formatCoord } from '@/types/game';

const replayMoves: MoveRecord[] = [
  { step: 1, row: 0, col: 0, player: 'X', coord: 'A1', timestamp: 1 },
  { step: 2, row: 1, col: 1, player: 'O', coord: 'B2', timestamp: 2 },
  { step: 3, row: 2, col: 2, player: 'X', coord: 'C3', timestamp: 3 },
];

const match: MatchHistoryItem = {
  id: 'match_replay',
  date: '01/01 10:00',
  mode: 'LOCAL_2P',
  winner: 'X',
  playerXName: 'An',
  playerOName: 'Bình',
  totalMoves: 3,
  durationSec: 10,
  winningDirection: 'Hàng Ngang',
  moves: replayMoves,
};

beforeEach(() => {
  localStorage.clear();
  vi.useFakeTimers({ shouldAdvanceTime: true });
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('replay mode', () => {
  it('starts a replay and clears the board first', () => {
    const onClearPieces = vi.fn();
    const { result } = renderHook(() => useGameEngine({ onClearPieces }));

    act(() => {
      result.current.executeMove(5, 5);
    });
    act(() => {
      result.current.startMatchReplay(match);
    });

    expect(onClearPieces).toHaveBeenCalled();
    expect(result.current.replayState).not.toBeNull();
    expect(result.current.replayState!.match.id).toBe('match_replay');
    expect(result.current.replayState!.stepIndex).toBe(0);
    expect(result.current.replayState!.playing).toBe(true);
  });

  it('ignores an invalid match', () => {
    const { result } = renderHook(() => useGameEngine());

    act(() => {
      result.current.startMatchReplay({ ...match, moves: undefined as unknown as MoveRecord[] });
    });

    expect(result.current.replayState).toBeNull();
  });

  it('blocks moves while replaying', () => {
    const { result } = renderHook(() => useGameEngine());

    act(() => {
      result.current.startMatchReplay(match);
    });
    act(() => {
      expect(result.current.executeMove(9, 9)).toBe(false);
    });

    expect(result.current.moves).toHaveLength(0);
  });

  it('spawns pieces step by step during playback', () => {
    const onSpawnPiece = vi.fn();
    const { result } = renderHook(() => useGameEngine({ onSpawnPiece }));

    act(() => {
      result.current.startMatchReplay(match);
    });

    act(() => {
      vi.advanceTimersByTime(600);
    });
    expect(onSpawnPiece).toHaveBeenCalledWith(0, 0, 'X', true);
    expect(result.current.replayState!.stepIndex).toBe(1);

    act(() => {
      vi.advanceTimersByTime(600);
    });
    expect(onSpawnPiece).toHaveBeenCalledWith(1, 1, 'O', true);
  });

  it('stops playing at the end of the replay', () => {
    const { result } = renderHook(() => useGameEngine());

    act(() => {
      result.current.startMatchReplay(match);
    });

    // Each tick schedules the next timer after a re-render, so advance one
    // step at a time.
    for (let i = 0; i < 4; i++) {
      act(() => {
        vi.advanceTimersByTime(600);
      });
    }

    expect(result.current.replayState!.stepIndex).toBe(3);
    expect(result.current.replayState!.playing).toBe(false);
  });

  it('pauses and resumes playback', () => {
    const { result } = renderHook(() => useGameEngine());

    act(() => {
      result.current.startMatchReplay(match);
    });
    act(() => {
      result.current.setReplayState((prev) => (prev ? { ...prev, playing: false } : null));
    });

    act(() => {
      vi.advanceTimersByTime(1200);
    });
    expect(result.current.replayState!.stepIndex).toBe(0);

    act(() => {
      result.current.setReplayState((prev) => (prev ? { ...prev, playing: true } : null));
    });
    act(() => {
      vi.advanceTimersByTime(600);
    });
    expect(result.current.replayState!.stepIndex).toBe(1);
  });

  it('exits replay and resyncs the live board', () => {
    const onSyncBoard = vi.fn();
    const { result } = renderHook(() => useGameEngine({ onSyncBoard }));

    act(() => {
      result.current.executeMove(4, 4);
    });
    act(() => {
      result.current.startMatchReplay(match);
    });
    act(() => {
      result.current.exitReplayMode();
    });

    expect(result.current.replayState).toBeNull();
    expect(onSyncBoard).toHaveBeenCalledWith(result.current.moves);
  });

  it('does not persist the active game while replaying', () => {
    const { result } = renderHook(() => useGameEngine());

    act(() => {
      result.current.startMatchReplay(match);
    });

    // The save effect is skipped during replay, so the stored game stays empty.
    const raw = localStorage.getItem('cybercaro_3d_active_game_v1');
    const saved = raw ? JSON.parse(raw) : { moves: [] };
    expect(saved.moves).toHaveLength(0);
  });
});

describe('draw detection', () => {
  it('declares a draw when the board is full', () => {
    // Pattern ((r + 2c) % 4 < 2) never produces five in a row in any of the
    // four directions (max run is 2), and splits the board 450/450.
    const isX = (r: number, c: number) => (r + 2 * c) % 4 < 2;
    const xCells: [number, number][] = [];
    const oCells: [number, number][] = [];
    for (let r = 0; r < 30; r++) {
      for (let c = 0; c < 30; c++) {
        (isX(r, c) ? xCells : oCells).push([r, c]);
      }
    }
    expect(xCells).toHaveLength(450);
    expect(oCells).toHaveLength(450);

    // (29,29) is an O cell; make it the final (900th) move.
    const lastIndex = oCells.findIndex(([r, c]) => r === 29 && c === 29);
    const [lastRow, lastCol] = oCells.splice(lastIndex, 1)[0];

    // Interleave X and O so players alternate, ending on X at index 898.
    const seeded: MoveRecord[] = [];
    for (let i = 0; i < 450; i++) {
      const [xr, xc] = xCells[i];
      seeded.push({
        step: seeded.length + 1,
        row: xr,
        col: xc,
        player: 'X',
        coord: formatCoord(xr, xc),
        timestamp: seeded.length,
      });
      if (i < oCells.length) {
        const [or, oc] = oCells[i];
        seeded.push({
          step: seeded.length + 1,
          row: or,
          col: oc,
          player: 'O',
          coord: formatCoord(or, oc),
          timestamp: seeded.length,
        });
      }
    }
    expect(seeded).toHaveLength(899);

    localStorage.setItem(
      STORAGE_KEYS.ACTIVE_GAME,
      JSON.stringify({
        moves: seeded,
        currentPlayer: 'O',
        winnerInfo: null,
        gameMode: 'LOCAL_2P',
        updatedAt: 1,
      })
    );

    const { result } = renderHook(() => useGameEngine());
    expect(result.current.moves).toHaveLength(899);

    act(() => {
      result.current.executeMove(lastRow, lastCol);
    });

    expect(result.current.moves).toHaveLength(900);
    expect(result.current.winnerInfo).not.toBeNull();
    expect(result.current.winnerInfo!.winner).toBe('DRAW');
    expect(result.current.winnerInfo!.directionName).toContain('Hòa Cờ');
    expect(result.current.scoreboard.draws).toBe(1);
  });
});
