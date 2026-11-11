import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  DIRECTIONS,
  checkWin30x30,
  checkFourThreat,
  computeBestMove30x30,
} from '@/lib/gomokuEngine';
import { BOARD_SIZE, WIN_COUNT, createEmptyBoard, PlayerSymbol } from '@/types/game';

function place(
  board: (PlayerSymbol | null)[][],
  cells: [number, number][],
  player: PlayerSymbol
) {
  for (const [r, c] of cells) board[r][c] = player;
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('gomokuEngine constants', () => {
  it('has the four expected directions', () => {
    expect(DIRECTIONS).toEqual([
      [0, 1],
      [1, 0],
      [1, 1],
      [1, -1],
    ]);
  });

  it('uses a 30x30 board and needs 5 in a row', () => {
    expect(BOARD_SIZE).toBe(30);
    expect(WIN_COUNT).toBe(5);
  });
});

describe('checkWin30x30', () => {
  it('detects a horizontal win', () => {
    const board = createEmptyBoard();
    place(board, [[10, 5], [10, 6], [10, 7], [10, 8], [10, 9]], 'X');

    const result = checkWin30x30(board, 10, 7, 'X');

    expect(result.won).toBe(true);
    expect(result.directionName).toBe('Hàng Ngang');
    expect(result.line).toHaveLength(5);
    expect(result.line).toContainEqual({ row: 10, col: 5 });
    expect(result.line).toContainEqual({ row: 10, col: 9 });
  });

  it('detects a vertical win', () => {
    const board = createEmptyBoard();
    place(board, [[3, 20], [4, 20], [5, 20], [6, 20], [7, 20]], 'O');

    const result = checkWin30x30(board, 5, 20, 'O');

    expect(result.won).toBe(true);
    expect(result.directionName).toBe('Hàng Dọc');
  });

  it('detects a main-diagonal win', () => {
    const board = createEmptyBoard();
    place(board, [[2, 2], [3, 3], [4, 4], [5, 5], [6, 6]], 'X');

    const result = checkWin30x30(board, 4, 4, 'X');

    expect(result.won).toBe(true);
    expect(result.directionName).toBe('Đường Chéo Chính');
  });

  it('detects an anti-diagonal win', () => {
    const board = createEmptyBoard();
    place(board, [[2, 8], [3, 7], [4, 6], [5, 5], [6, 4]], 'O');

    const result = checkWin30x30(board, 4, 6, 'O');

    expect(result.won).toBe(true);
    expect(result.directionName).toBe('Đường Chéo Phụ');
  });

  it('detects a win at the board edge', () => {
    const board = createEmptyBoard();
    place(board, [[0, 0], [0, 1], [0, 2], [0, 3], [0, 4]], 'X');

    expect(checkWin30x30(board, 0, 2, 'X').won).toBe(true);
  });

  it('detects a win at the far corner', () => {
    const board = createEmptyBoard();
    place(board, [[29, 25], [29, 26], [29, 27], [29, 28], [29, 29]], 'O');

    expect(checkWin30x30(board, 29, 29, 'O').won).toBe(true);
  });

  it('returns only the first 5 cells in line while keeping the full line', () => {
    const board = createEmptyBoard();
    place(
      board,
      [[10, 2], [10, 3], [10, 4], [10, 5], [10, 6], [10, 7], [10, 8]],
      'X'
    );

    const result = checkWin30x30(board, 10, 5, 'X');

    expect(result.won).toBe(true);
    expect(result.line).toHaveLength(WIN_COUNT);
    expect(result.fullLine).toHaveLength(7);
  });

  it('does not report a win for only four in a row', () => {
    const board = createEmptyBoard();
    place(board, [[10, 5], [10, 6], [10, 7], [10, 8]], 'X');

    const result = checkWin30x30(board, 10, 6, 'X');

    expect(result.won).toBe(false);
    expect(result.line).toEqual([]);
    expect(result.directionName).toBe('');
  });

  it('does not count a line broken by the opponent', () => {
    const board = createEmptyBoard();
    place(board, [[10, 5], [10, 6], [10, 8], [10, 9], [10, 10]], 'X');
    board[10][7] = 'O';

    expect(checkWin30x30(board, 10, 9, 'X').won).toBe(false);
  });

  it('does not mix players in one line', () => {
    const board = createEmptyBoard();
    place(board, [[10, 5], [10, 6], [10, 7], [10, 8]], 'X');
    board[10][9] = 'O';

    expect(checkWin30x30(board, 10, 5, 'X').won).toBe(false);
  });
});

describe('checkFourThreat', () => {
  it('flags an open four', () => {
    const board = createEmptyBoard();
    place(board, [[10, 5], [10, 6], [10, 7], [10, 8]], 'X');

    expect(checkFourThreat(board, 10, 6, 'X')).toBe(true);
  });

  it('flags a four blocked on one side', () => {
    const board = createEmptyBoard();
    place(board, [[10, 5], [10, 6], [10, 7], [10, 8]], 'X');
    board[10][4] = 'O';

    expect(checkFourThreat(board, 10, 6, 'X')).toBe(true);
  });

  it('flags an open three', () => {
    const board = createEmptyBoard();
    place(board, [[10, 5], [10, 6], [10, 7]], 'X');

    expect(checkFourThreat(board, 10, 6, 'X')).toBe(true);
  });

  it('does not flag a blocked three', () => {
    const board = createEmptyBoard();
    place(board, [[10, 5], [10, 6], [10, 7]], 'X');
    board[10][4] = 'O';

    expect(checkFourThreat(board, 10, 6, 'X')).toBe(false);
  });

  it('does not flag two in a row', () => {
    const board = createEmptyBoard();
    place(board, [[10, 5], [10, 6]], 'X');

    expect(checkFourThreat(board, 10, 5, 'X')).toBe(false);
  });

  it('does not flag a five-in-a-row as a mere threat', () => {
    const board = createEmptyBoard();
    place(board, [[10, 5], [10, 6], [10, 7], [10, 8], [10, 9]], 'X');

    expect(checkFourThreat(board, 10, 7, 'X')).toBe(false);
  });
});

describe('computeBestMove30x30', () => {
  it('opens in the center on an empty board', () => {
    const board = createEmptyBoard();

    expect(computeBestMove30x30(board, 'O')).toEqual({ row: 15, col: 15 });
  });

  it('returns a legal empty cell near existing pieces', () => {
    const board = createEmptyBoard();
    board[15][15] = 'X';

    const move = computeBestMove30x30(board, 'O');

    expect(board[move.row][move.col]).toBeNull();
    expect(Math.abs(move.row - 15)).toBeLessThanOrEqual(2);
    expect(Math.abs(move.col - 15)).toBeLessThanOrEqual(2);
  });

  it('takes an immediate winning move', () => {
    const board = createEmptyBoard();
    place(board, [[10, 5], [10, 6], [10, 7], [10, 8]], 'O');
    board[15][15] = 'X';

    const move = computeBestMove30x30(board, 'O');

    expect([
      { row: 10, col: 4 },
      { row: 10, col: 9 },
    ]).toContainEqual(move);
  });

  it('blocks the human four-in-a-row', () => {
    const board = createEmptyBoard();
    place(board, [[10, 5], [10, 6], [10, 7], [10, 8]], 'X');
    board[20][20] = 'O';

    const move = computeBestMove30x30(board, 'O');

    expect([
      { row: 10, col: 4 },
      { row: 10, col: 9 },
    ]).toContainEqual(move);
  });

  it('never returns an occupied cell', () => {
    const board = createEmptyBoard();
    place(board, [[14, 14], [14, 15], [15, 14], [15, 15]], 'X');

    const move = computeBestMove30x30(board, 'O');

    expect(board[move.row][move.col]).toBeNull();
  });

  it('stays deterministic in shape when Math.random is stubbed', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
    const board = createEmptyBoard();
    board[15][15] = 'X';

    const first = computeBestMove30x30(board, 'O');
    const second = computeBestMove30x30(board, 'O');

    expect(first).toEqual(second);
  });
});
