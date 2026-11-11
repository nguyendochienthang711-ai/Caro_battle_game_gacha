import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useGameEngine } from '@/hooks/useGameEngine';
import { BOARD_SIZE, STORAGE_KEYS } from '@/types/game';

function renderEngine(callbacks = {}) {
  return renderHook(() => useGameEngine(callbacks));
}

/** Plays a sequence of moves through the hook, alternating players. */
function playMoves(result: { current: ReturnType<typeof useGameEngine> }, cells: [number, number][]) {
  cells.forEach(([row, col]) => {
    act(() => {
      result.current.executeMove(row, col);
    });
  });
}

beforeEach(() => {
  localStorage.clear();
  vi.useFakeTimers({ shouldAdvanceTime: true });
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('useGameEngine initial state', () => {
  it('starts with an empty board and X to move', () => {
    const { result } = renderEngine();

    expect(result.current.board).toHaveLength(BOARD_SIZE);
    expect(result.current.currentPlayer).toBe('X');
    expect(result.current.moves).toEqual([]);
    expect(result.current.winnerInfo).toBeNull();
    expect(result.current.gameMode).toBe('LOCAL_2P');
  });

  it('starts with default player names', () => {
    const { result } = renderEngine();

    expect(result.current.playerNames.X).toContain('Cyan');
    expect(result.current.playerNames.O).toContain('Magenta');
  });

  it('starts with a 30 second turn timer', () => {
    const { result } = renderEngine();

    expect(result.current.turnTimeLimit).toBe(30);
    expect(result.current.timeLeft).toBe(30);
  });
});

describe('executeMove', () => {
  it('places a piece and switches turns', () => {
    const { result } = renderEngine();

    act(() => {
      expect(result.current.executeMove(10, 10)).toBe(true);
    });

    expect(result.current.board[10][10]).toBe('X');
    expect(result.current.currentPlayer).toBe('O');
    expect(result.current.moves).toHaveLength(1);
    expect(result.current.moves[0]).toMatchObject({
      step: 1,
      row: 10,
      col: 10,
      player: 'X',
      coord: 'K11',
    });
  });

  it('rejects a move on an occupied cell', () => {
    const { result } = renderEngine();

    act(() => {
      result.current.executeMove(5, 5);
    });
    act(() => {
      expect(result.current.executeMove(5, 5)).toBe(false);
    });

    expect(result.current.moves).toHaveLength(1);
    expect(result.current.currentPlayer).toBe('O');
  });

  it('rejects out-of-bounds moves', () => {
    const { result } = renderEngine();

    act(() => {
      expect(result.current.executeMove(-1, 0)).toBe(false);
      expect(result.current.executeMove(0, BOARD_SIZE)).toBe(false);
      expect(result.current.executeMove(BOARD_SIZE, 0)).toBe(false);
    });

    expect(result.current.moves).toHaveLength(0);
  });

  it('calls onSpawnPiece for every move', () => {
    const onSpawnPiece = vi.fn();
    const { result } = renderEngine({ onSpawnPiece });

    act(() => {
      result.current.executeMove(3, 4);
    });

    expect(onSpawnPiece).toHaveBeenCalledWith(3, 4, 'X', true);
  });

  it('detects a horizontal win and records the match', () => {
    const onWinEffects = vi.fn();
    const onMatchWon = vi.fn();
    const { result } = renderEngine({ onWinEffects, onMatchWon });

    // X: (10,5) (10,6) (10,7) (10,8) (10,9) | O: filler row
    playMoves(result, [
      [10, 5],
      [20, 5],
      [10, 6],
      [20, 6],
      [10, 7],
      [20, 7],
      [10, 8],
      [20, 8],
      [10, 9],
    ]);

    expect(result.current.winnerInfo).not.toBeNull();
    expect(result.current.winnerInfo!.winner).toBe('X');
    expect(result.current.winnerInfo!.directionName).toBe('Hàng Ngang');
    expect(result.current.winnerInfo!.line).toHaveLength(5);
    expect(onWinEffects).toHaveBeenCalledWith(expect.any(Array), 'X');
    expect(onMatchWon).toHaveBeenCalledWith('X', 'LOCAL_2P');
  });

  it('blocks further moves after a win', () => {
    const { result } = renderEngine();

    playMoves(result, [
      [10, 5],
      [20, 5],
      [10, 6],
      [20, 6],
      [10, 7],
      [20, 7],
      [10, 8],
      [20, 8],
      [10, 9],
    ]);
    const movesAtWin = result.current.moves.length;

    act(() => {
      expect(result.current.executeMove(0, 0)).toBe(false);
    });

    expect(result.current.moves).toHaveLength(movesAtWin);
  });

  it('updates the scoreboard after a win', () => {
    const { result } = renderEngine();

    playMoves(result, [
      [10, 5],
      [20, 5],
      [10, 6],
      [20, 6],
      [10, 7],
      [20, 7],
      [10, 8],
      [20, 8],
      [10, 9],
    ]);

    expect(result.current.scoreboard.X).toBe(1);
    expect(result.current.scoreboard.streakPlayer).toBe('X');
    expect(result.current.scoreboard.streakCount).toBe(1);
  });

  it('adds a match history entry after a win', () => {
    const { result } = renderEngine();

    playMoves(result, [
      [10, 5],
      [20, 5],
      [10, 6],
      [20, 6],
      [10, 7],
      [20, 7],
      [10, 8],
      [20, 8],
      [10, 9],
    ]);

    expect(result.current.matchHistory).toHaveLength(1);
    expect(result.current.matchHistory[0]).toMatchObject({
      winner: 'X',
      mode: 'LOCAL_2P',
      totalMoves: 9,
      winningDirection: 'Hàng Ngang',
    });
  });

  it('shows a threat banner on an open four', () => {
    const { result } = renderEngine();

    playMoves(result, [
      [10, 5],
      [20, 5],
      [10, 6],
      [20, 6],
      [10, 7],
      [20, 7],
      [10, 8],
    ]);

    expect(result.current.threatBanner).not.toBeNull();
    expect(result.current.threatBanner!.player).toBe('X');
    expect(result.current.threatBanner!.coord).toBe('I11');
  });

  it('sends a LAN packet for local moves in LAN mode', () => {
    const onSendLanPacket = vi.fn();
    const { result } = renderEngine({ onSendLanPacket });

    act(() => {
      result.current.setGameMode('LAN_WIFI');
    });
    act(() => {
      result.current.executeMove(1, 1);
    });

    expect(onSendLanPacket).toHaveBeenCalledWith({
      type: 'MOVE',
      row: 1,
      col: 1,
      player: 'X',
    });
  });

  it('does not echo remote LAN moves back to the network', () => {
    const onSendLanPacket = vi.fn();
    const { result } = renderEngine({ onSendLanPacket });

    act(() => {
      result.current.setGameMode('LAN_WIFI');
    });
    act(() => {
      result.current.executeMove(1, 1, 'O', true);
    });

    expect(onSendLanPacket).not.toHaveBeenCalled();
    expect(result.current.board[1][1]).toBe('O');
  });
});

describe('resetBoard', () => {
  it('clears the board, moves and winner', () => {
    const onClearPieces = vi.fn();
    const { result } = renderEngine({ onClearPieces });

    playMoves(result, [
      [10, 5],
      [20, 5],
      [10, 6],
      [20, 6],
      [10, 7],
      [20, 7],
      [10, 8],
      [20, 8],
      [10, 9],
    ]);

    act(() => {
      result.current.resetBoard();
    });

    expect(result.current.moves).toEqual([]);
    expect(result.current.winnerInfo).toBeNull();
    expect(result.current.currentPlayer).toBe('X');
    expect(result.current.board.flat().every((c) => c === null)).toBe(true);
    expect(onClearPieces).toHaveBeenCalled();
  });
});

describe('performUndo', () => {
  it('removes the last move and gives the turn back', () => {
    const { result } = renderEngine();

    playMoves(result, [
      [1, 1],
      [2, 2],
    ]);
    expect(result.current.currentPlayer).toBe('X');

    act(() => {
      result.current.performUndo();
    });

    expect(result.current.moves).toHaveLength(1);
    expect(result.current.board[2][2]).toBeNull();
    expect(result.current.currentPlayer).toBe('O');
  });

  it('does nothing on an empty board', () => {
    const { result } = renderEngine();

    act(() => {
      result.current.performUndo();
    });

    expect(result.current.moves).toHaveLength(0);
  });

  it('resumes the game after undoing a winning move', () => {
    const { result } = renderEngine();

    playMoves(result, [
      [10, 5],
      [20, 5],
      [10, 6],
      [20, 6],
      [10, 7],
      [20, 7],
      [10, 8],
      [20, 8],
      [10, 9],
    ]);
    expect(result.current.winnerInfo).not.toBeNull();

    act(() => {
      result.current.performUndo();
    });

    expect(result.current.winnerInfo).toBeNull();
    expect(result.current.moves).toHaveLength(8);
  });

  it('pops two moves in AI mode so the human moves again', () => {
    const { result } = renderEngine();

    act(() => {
      result.current.setGameMode('AI_BOT');
    });
    playMoves(result, [
      [1, 1],
      [2, 2],
    ]);

    act(() => {
      result.current.performUndo();
    });

    expect(result.current.moves).toHaveLength(0);
    expect(result.current.currentPlayer).toBe('X');
  });
});

describe('handleSurrender', () => {
  it('awards the win to the opponent', () => {
    const { result } = renderEngine();

    playMoves(result, [
      [1, 1],
      [2, 2],
    ]);

    act(() => {
      result.current.handleSurrender('X');
    });

    expect(result.current.winnerInfo!.winner).toBe('O');
    expect(result.current.winnerInfo!.directionName).toContain('Đầu Hàng');
    expect(result.current.scoreboard.O).toBe(1);
  });

  it('does nothing before the first move', () => {
    const { result } = renderEngine();

    act(() => {
      result.current.handleSurrender('X');
    });

    expect(result.current.winnerInfo).toBeNull();
  });
});

describe('turn timer', () => {
  it('counts down each second', () => {
    const { result } = renderEngine();

    act(() => {
      vi.advanceTimersByTime(3000);
    });

    expect(result.current.timeLeft).toBe(27);
  });

  it('awards the win to the opponent when time runs out', () => {
    const { result } = renderEngine();

    playMoves(result, [
      [1, 1],
      [2, 2],
    ]);

    act(() => {
      vi.advanceTimersByTime(30_000);
    });

    expect(result.current.winnerInfo).not.toBeNull();
    // X is on the clock when time runs out, so O wins.
    expect(result.current.winnerInfo!.winner).toBe('O');
    expect(result.current.winnerInfo!.directionName).toContain('Hết giờ');
  });

  it('does not count down when the timer is disabled', () => {
    const { result } = renderEngine();

    act(() => {
      result.current.setTurnTimeLimit(0);
    });
    act(() => {
      vi.advanceTimersByTime(5000);
    });

    expect(result.current.timeLeft).toBe(30);
    expect(result.current.winnerInfo).toBeNull();
  });

  it('does not count down while paused', () => {
    const { result } = renderEngine();

    act(() => {
      result.current.setIsPaused(true);
    });
    act(() => {
      vi.advanceTimersByTime(5000);
    });

    expect(result.current.timeLeft).toBe(30);
  });
});

describe('persistence', () => {
  it('saves the active game to localStorage', () => {
    const { result } = renderEngine();

    act(() => {
      result.current.executeMove(4, 4);
    });

    const raw = localStorage.getItem(STORAGE_KEYS.ACTIVE_GAME);
    expect(raw).not.toBeNull();
    const saved = JSON.parse(raw!);
    expect(saved.moves).toHaveLength(1);
    expect(saved.currentPlayer).toBe('O');
  });

  it('restores a saved game on mount', () => {
    localStorage.setItem(
      STORAGE_KEYS.ACTIVE_GAME,
      JSON.stringify({
        moves: [
          { step: 1, row: 7, col: 7, player: 'X', coord: 'H8', timestamp: 1 },
          { step: 2, row: 8, col: 8, player: 'O', coord: 'I9', timestamp: 2 },
        ],
        currentPlayer: 'X',
        winnerInfo: null,
        gameMode: 'LOCAL_2P',
        updatedAt: 1,
      })
    );

    const { result } = renderEngine();

    expect(result.current.moves).toHaveLength(2);
    expect(result.current.board[7][7]).toBe('X');
    expect(result.current.board[8][8]).toBe('O');
    expect(result.current.currentPlayer).toBe('X');
  });

  it('ignores a saved game that already has a winner', () => {
    localStorage.setItem(
      STORAGE_KEYS.ACTIVE_GAME,
      JSON.stringify({
        moves: [{ step: 1, row: 7, col: 7, player: 'X', coord: 'H8', timestamp: 1 }],
        currentPlayer: 'O',
        winnerInfo: { winner: 'X', line: [], directionName: 'test' },
        gameMode: 'LOCAL_2P',
        updatedAt: 1,
      })
    );

    const { result } = renderEngine();

    expect(result.current.moves).toHaveLength(0);
  });

  it('restores saved settings', () => {
    localStorage.setItem(
      STORAGE_KEYS.SETTINGS,
      JSON.stringify({ playerNames: { X: 'An', O: 'Bình' }, turnTimeLimit: 60 })
    );

    const { result } = renderEngine();

    expect(result.current.playerNames).toEqual({ X: 'An', O: 'Bình' });
    expect(result.current.turnTimeLimit).toBe(60);
  });
});

describe('AI mode', () => {
  it('lets the bot move automatically after the human', async () => {
    const { result } = renderEngine();

    act(() => {
      result.current.setGameMode('AI_BOT');
    });
    act(() => {
      result.current.executeMove(15, 15);
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(500);
    });

    await waitFor(() => {
      expect(result.current.moves.length).toBe(2);
    });
    expect(result.current.moves[1].player).toBe('O');
    expect(result.current.currentPlayer).toBe('X');
  });
});
