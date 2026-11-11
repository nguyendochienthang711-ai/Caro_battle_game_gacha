import { describe, it, expect } from 'vitest';
import {
  BOARD_SIZE,
  WIN_COUNT,
  STORAGE_KEYS,
  getColLabel,
  formatCoord,
  createEmptyBoard,
} from '@/types/game';

describe('game constants', () => {
  it('defines a 30x30 board with 5-in-a-row win condition', () => {
    expect(BOARD_SIZE).toBe(30);
    expect(WIN_COUNT).toBe(5);
  });

  it('exposes stable storage keys', () => {
    expect(STORAGE_KEYS.ACTIVE_GAME).toBe('cybercaro_3d_active_game_v1');
    expect(STORAGE_KEYS.SCOREBOARD).toBe('cybercaro_3d_scoreboard_v1');
    expect(STORAGE_KEYS.MATCH_HISTORY).toBe('cybercaro_3d_match_history_v1');
    expect(STORAGE_KEYS.SETTINGS).toBe('cybercaro_3d_settings_v1');
    expect(STORAGE_KEYS.RPG_PROFILE).toBe('cybercaro_3d_rpg_profile_v1');
  });
});

describe('getColLabel', () => {
  it('maps the first 26 columns to A..Z', () => {
    expect(getColLabel(0)).toBe('A');
    expect(getColLabel(1)).toBe('B');
    expect(getColLabel(25)).toBe('Z');
  });

  it('maps columns 26..29 to AA..AD', () => {
    expect(getColLabel(26)).toBe('AA');
    expect(getColLabel(27)).toBe('AB');
    expect(getColLabel(28)).toBe('AC');
    expect(getColLabel(29)).toBe('AD');
  });
});

describe('formatCoord', () => {
  it('formats the top-left cell as A1', () => {
    expect(formatCoord(0, 0)).toBe('A1');
  });

  it('formats the bottom-right cell as AD30', () => {
    expect(formatCoord(29, 29)).toBe('AD30');
  });

  it('formats a middle cell', () => {
    expect(formatCoord(14, 14)).toBe('O15');
  });

  it('uses 1-based rows', () => {
    expect(formatCoord(0, 25)).toBe('Z1');
    expect(formatCoord(1, 25)).toBe('Z2');
  });
});

describe('createEmptyBoard', () => {
  it('creates a 30x30 board', () => {
    const board = createEmptyBoard();

    expect(board).toHaveLength(BOARD_SIZE);
    board.forEach((row) => expect(row).toHaveLength(BOARD_SIZE));
  });

  it('fills every cell with null', () => {
    const board = createEmptyBoard();

    expect(board.flat().every((cell) => cell === null)).toBe(true);
  });

  it('creates independent rows (no shared references)', () => {
    const board = createEmptyBoard();
    board[0][0] = 'X';

    expect(board[1][0]).toBeNull();
    expect(board[0]).not.toBe(board[1]);
  });
});
