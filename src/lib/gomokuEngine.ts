import { BOARD_SIZE, WIN_COUNT, PlayerSymbol, CellCoord } from '../types/game';

export const DIRECTIONS: [number, number][] = [
  [0, 1],   // Ngang (Horizontal)
  [1, 0],   // Dọc (Vertical)
  [1, 1],   // Chéo chính (Diagonal \)
  [1, -1],  // Chéo phụ (Anti-diagonal /)
];

export interface WinCheckResult {
  won: boolean;
  line: CellCoord[];
  fullLine?: CellCoord[];
  directionName: string;
}

/**
 * Checks if the move at (row, col) by `player` creates 5 or more in a row.
 * Returns { won: boolean, line: Array<{row, col}>, directionName: string }
 */
export function checkWin30x30(
  board: (PlayerSymbol | null)[][],
  row: number,
  col: number,
  player: PlayerSymbol
): WinCheckResult {
  const dirNames = ['Hàng Ngang', 'Hàng Dọc', 'Đường Chéo Chính', 'Đường Chéo Phụ'];

  for (let d = 0; d < DIRECTIONS.length; d++) {
    const [dr, dc] = DIRECTIONS[d];
    const line: CellCoord[] = [{ row, col }];

    // Forward scan
    let r = row + dr;
    let c = col + dc;
    while (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE && board[r][c] === player) {
      line.push({ row: r, col: c });
      r += dr;
      c += dc;
    }

    // Backward scan
    r = row - dr;
    c = col - dc;
    while (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE && board[r][c] === player) {
      line.unshift({ row: r, col: c });
      r -= dr;
      c -= dc;
    }

    if (line.length >= WIN_COUNT) {
      return {
        won: true,
        line: line.slice(0, WIN_COUNT),
        fullLine: line,
        directionName: dirNames[d],
      };
    }
  }

  return { won: false, line: [], directionName: '' };
}

/**
 * Checks if the latest move created a 4-in-a-row threat so we can alert players
 */
export function checkFourThreat(
  board: (PlayerSymbol | null)[][],
  row: number,
  col: number,
  player: PlayerSymbol
): boolean {
  for (const [dr, dc] of DIRECTIONS) {
    let count = 1;
    let openEnds = 0;

    let r = row + dr;
    let c = col + dc;
    while (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE && board[r][c] === player) {
      count++;
      r += dr;
      c += dc;
    }
    if (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE && board[r][c] === null) {
      openEnds++;
    }

    r = row - dr;
    c = col - dc;
    while (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE && board[r][c] === player) {
      count++;
      r -= dr;
      c -= dc;
    }
    if (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE && board[r][c] === null) {
      openEnds++;
    }

    if (count === 4 && openEnds >= 1) return true;
    if (count === 3 && openEnds === 2) return true;
  }
  return false;
}

/**
 * Smart Heuristic AI for 30x30 board when user enables "Đấu với AI CyberBot"
 */
export function computeBestMove30x30(
  board: (PlayerSymbol | null)[][],
  aiPlayer: PlayerSymbol = 'O'
): CellCoord {
  const human: PlayerSymbol = aiPlayer === 'O' ? 'X' : 'O';
  const candidates = new Set<number>();

  let hasPieces = false;
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      if (board[r][c] !== null) {
        hasPieces = true;
        for (let dr = -2; dr <= 2; dr++) {
          for (let dc = -2; dc <= 2; dc++) {
            const nr = r + dr;
            const nc = c + dc;
            if (nr >= 0 && nr < BOARD_SIZE && nc >= 0 && nc < BOARD_SIZE && board[nr][nc] === null) {
              candidates.add(nr * BOARD_SIZE + nc);
            }
          }
        }
      }
    }
  }

  if (!hasPieces) {
    return { row: Math.floor(BOARD_SIZE / 2), col: Math.floor(BOARD_SIZE / 2) };
  }

  const evaluatePoint = (r: number, c: number, targetPlayer: PlayerSymbol): number => {
    let totalScore = 0;
    for (const [dr, dc] of DIRECTIONS) {
      let count = 1;
      let openEnds = 0;

      let nr = r + dr;
      let nc = c + dc;
      while (nr >= 0 && nr < BOARD_SIZE && nc >= 0 && nc < BOARD_SIZE && board[nr][nc] === targetPlayer) {
        count++;
        nr += dr;
        nc += dc;
      }
      if (nr >= 0 && nr < BOARD_SIZE && nc >= 0 && nc < BOARD_SIZE && board[nr][nc] === null) openEnds++;

      nr = r - dr;
      nc = c - dc;
      while (nr >= 0 && nr < BOARD_SIZE && nc >= 0 && nc < BOARD_SIZE && board[nr][nc] === targetPlayer) {
        count++;
        nr -= dr;
        nc -= dc;
      }
      if (nr >= 0 && nr < BOARD_SIZE && nc >= 0 && nc < BOARD_SIZE && board[nr][nc] === null) openEnds++;

      if (count >= 5) totalScore += 1000000;
      else if (count === 4 && openEnds === 2) totalScore += 120000;
      else if (count === 4 && openEnds === 1) totalScore += 25000;
      else if (count === 3 && openEnds === 2) totalScore += 12000;
      else if (count === 3 && openEnds === 1) totalScore += 1500;
      else if (count === 2 && openEnds === 2) totalScore += 600;
      else if (count === 2 && openEnds === 1) totalScore += 120;
      else totalScore += count * 15;
    }
    return totalScore;
  };

  let bestMove: CellCoord | null = null;
  let bestScore = -1;

  candidates.forEach((encoded) => {
    const r = Math.floor(encoded / BOARD_SIZE);
    const c = encoded % BOARD_SIZE;

    const attackScore = evaluatePoint(r, c, aiPlayer);
    const defenseScore = evaluatePoint(r, c, human);
    // Prioritize winning immediately, then blocking opponent's lethal threats
    const centerBias = 15 - (Math.abs(r - 14.5) + Math.abs(c - 14.5)) * 0.3;
    const combined = attackScore * 1.15 + defenseScore * 1.05 + centerBias + Math.random() * 6;

    if (combined > bestScore) {
      bestScore = combined;
      bestMove = { row: r, col: c };
    }
  });

  return bestMove || { row: 15, col: 15 };
}
