'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  BOARD_SIZE,
  GameMode,
  PlayerSymbol,
  MoveRecord,
  WinnerInfo,
  ThreatBannerInfo,
  ScoreboardData,
  MatchHistoryItem,
  ReplayState,
  createEmptyBoard,
  formatCoord,
} from '../types/game';
import { checkWin30x30, checkFourThreat, computeBestMove30x30 } from '../lib/gomokuEngine';
import { soundEngine } from '../lib/soundEngine';
import {
  loadScoreboard,
  saveScoreboard,
  loadMatchHistory,
  saveMatchHistory,
  loadSettings,
  saveSettings,
  loadActiveGame,
  saveActiveGame,
} from '../lib/storage';

interface UseGameEngineCallbacks {
  onSpawnPiece?: (row: number, col: number, player: PlayerSymbol, animate?: boolean) => void;
  onClearPieces?: () => void;
  onSyncBoard?: (moves: MoveRecord[]) => void;
  onWinEffects?: (line: { row: number; col: number }[], player: PlayerSymbol) => void;
  onFocusCell?: (row: number, col: number) => void;
  onSendLanPacket?: (packet: any) => void;
  onMatchWon?: (winner: PlayerSymbol | 'DRAW', mode: GameMode) => void;
  autoFocusMove?: boolean;
}

export function useGameEngine(callbacks: UseGameEngineCallbacks = {}) {
  const [gameMode, setGameMode] = useState<GameMode>('LOCAL_2P');
  const [board, setBoard] = useState<(PlayerSymbol | null)[][]>(() => createEmptyBoard());
  const [currentPlayer, setCurrentPlayer] = useState<PlayerSymbol>('X');
  const [moves, setMoves] = useState<MoveRecord[]>([]);
  const [winnerInfo, setWinnerInfo] = useState<WinnerInfo | null>(null);
  const [threatBanner, setThreatBanner] = useState<ThreatBannerInfo | null>(null);

  const [playerNames, setPlayerNames] = useState({ X: 'Chiến Binh Cyan (X)', O: 'Hộ Vệ Magenta (O)' });
  const [scoreboard, setScoreboard] = useState<ScoreboardData>({
    X: 0,
    O: 0,
    draws: 0,
    streakPlayer: null,
    streakCount: 0,
  });
  const [matchHistory, setMatchHistory] = useState<MatchHistoryItem[]>([]);

  // Turn Timer
  const [turnTimeLimit, setTurnTimeLimit] = useState<number>(30); // 0 = unlimited
  const [timeLeft, setTimeLeft] = useState<number>(30);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const matchStartTimeRef = useRef<number>(Date.now());

  // Replay
  const [replayState, setReplayState] = useState<ReplayState | null>(null);

  const callbacksRef = useRef(callbacks);
  useEffect(() => {
    callbacksRef.current = callbacks;
  }, [callbacks]);

  // Load from LocalStorage on mount
  useEffect(() => {
    setScoreboard(loadScoreboard());
    setMatchHistory(loadMatchHistory());

    const savedSettings = loadSettings();
    if (savedSettings) {
      if (savedSettings.playerNames) setPlayerNames(savedSettings.playerNames);
      if (typeof savedSettings.turnTimeLimit === 'number') {
        setTurnTimeLimit(savedSettings.turnTimeLimit);
        setTimeLeft(savedSettings.turnTimeLimit);
      }
    }

    const savedGame = loadActiveGame();
    if (savedGame && Array.isArray(savedGame.moves) && savedGame.moves.length > 0 && !savedGame.winnerInfo) {
      const restoredBoard = createEmptyBoard();
      savedGame.moves.forEach((m) => {
        if (m.row >= 0 && m.row < BOARD_SIZE && m.col >= 0 && m.col < BOARD_SIZE) {
          restoredBoard[m.row][m.col] = m.player;
        }
      });
      setBoard(restoredBoard);
      setMoves(savedGame.moves);
      setCurrentPlayer(savedGame.currentPlayer || 'X');
      if (savedGame.gameMode) setGameMode(savedGame.gameMode);
    }
  }, []);

  // Save active game to LocalStorage
  useEffect(() => {
    if (replayState) return;
    saveActiveGame({
      moves,
      currentPlayer,
      winnerInfo,
      gameMode,
      updatedAt: Date.now(),
    });
  }, [moves, currentPlayer, winnerInfo, gameMode, replayState]);

  // Save settings
  useEffect(() => {
    saveSettings({ playerNames, turnTimeLimit });
  }, [playerNames, turnTimeLimit]);

  // Record completed match
  const recordCompletedMatch = useCallback(
    (winner: PlayerSymbol | 'DRAW', directionName: string, finalMoves: MoveRecord[]) => {
      const durationSec = Math.max(1, Math.round((Date.now() - matchStartTimeRef.current) / 1000));

      setScoreboard((prev) => {
        const next = { ...prev };
        if (winner === 'DRAW') {
          next.draws += 1;
          next.streakCount = 0;
        } else {
          next[winner] = (next[winner] || 0) + 1;
          if (next.streakPlayer === winner) {
            next.streakCount += 1;
          } else {
            next.streakPlayer = winner;
            next.streakCount = 1;
          }
        }
        saveScoreboard(next);
        return next;
      });

      const newEntry: MatchHistoryItem = {
        id: `match_${Date.now()}`,
        date: new Date().toLocaleString('vi-VN', {
          hour: '2-digit',
          minute: '2-digit',
          day: '2-digit',
          month: '2-digit',
        }),
        mode: gameMode,
        winner,
        playerXName: playerNames.X,
        playerOName: playerNames.O,
        totalMoves: finalMoves.length,
        durationSec,
        winningDirection: directionName,
        moves: finalMoves,
      };

      setMatchHistory((prev) => {
        const updated = [newEntry, ...prev].slice(0, 25);
        saveMatchHistory(updated);
        return updated;
      });

      callbacksRef.current.onMatchWon?.(winner, gameMode);
    },
    [gameMode, playerNames]
  );

  // Execute Move
  const executeMove = useCallback(
    (row: number, col: number, forcedPlayer: PlayerSymbol | null = null, isRemote = false): boolean => {
      if (replayState) return false;
      if (winnerInfo) return false;
      if (row < 0 || row >= BOARD_SIZE || col < 0 || col >= BOARD_SIZE) return false;
      if (board[row][col] !== null) return false;

      const activeP = forcedPlayer || currentPlayer;

      const nextBoard = board.map((r) => [...r]);
      nextBoard[row][col] = activeP;

      const moveItem: MoveRecord = {
        step: moves.length + 1,
        row,
        col,
        player: activeP,
        coord: formatCoord(row, col),
        timestamp: Date.now(),
      };
      const nextMoves = [...moves, moveItem];

      setBoard(nextBoard);
      setMoves(nextMoves);
      soundEngine.playPlacePiece(activeP);

      callbacksRef.current.onSpawnPiece?.(row, col, activeP, true);
      if (callbacksRef.current.autoFocusMove) {
        callbacksRef.current.onFocusCell?.(row, col);
      }

      if (gameMode === 'LAN_WIFI' && !isRemote) {
        callbacksRef.current.onSendLanPacket?.({ type: 'MOVE', row, col, player: activeP });
      }

      // Check Win
      const winCheck = checkWin30x30(nextBoard, row, col, activeP);
      if (winCheck.won) {
        const winPayload: WinnerInfo = {
          winner: activeP,
          line: winCheck.line,
          directionName: winCheck.directionName,
        };
        setWinnerInfo(winPayload);
        setThreatBanner(null);
        soundEngine.playWinFanfare();
        callbacksRef.current.onWinEffects?.(winCheck.line, activeP);
        recordCompletedMatch(activeP, winCheck.directionName, nextMoves);
        return true;
      }

      // Check Draw
      if (nextMoves.length >= BOARD_SIZE * BOARD_SIZE) {
        setWinnerInfo({ winner: 'DRAW', line: [], directionName: 'Hòa Cờ (Đầy Bàn)' });
        recordCompletedMatch('DRAW', 'Hòa Cờ', nextMoves);
        return true;
      }

      // Check Threat
      const isThreat = checkFourThreat(nextBoard, row, col, activeP);
      if (isThreat) {
        setThreatBanner({ player: activeP, coord: formatCoord(row, col) });
        soundEngine.playThreatAlert();
      } else {
        setThreatBanner(null);
      }

      // Switch Turn
      const nextPlayer: PlayerSymbol = activeP === 'X' ? 'O' : 'X';
      setCurrentPlayer(nextPlayer);
      if (turnTimeLimit > 0) setTimeLeft(turnTimeLimit);

      return true;
    },
    [replayState, winnerInfo, board, currentPlayer, moves, gameMode, turnTimeLimit, recordCompletedMatch]
  );

  const executeMoveRef = useRef(executeMove);
  useEffect(() => {
    executeMoveRef.current = executeMove;
  }, [executeMove]);

  // AI CyberBot Turn
  useEffect(() => {
    if (gameMode === 'AI_BOT' && currentPlayer === 'O' && !winnerInfo && !replayState && !isPaused) {
      const timer = setTimeout(() => {
        const aiMove = computeBestMove30x30(board, 'O');
        if (aiMove) {
          executeMoveRef.current(aiMove.row, aiMove.col, 'O', true);
        }
      }, 420);
      return () => clearTimeout(timer);
    }
  }, [gameMode, currentPlayer, winnerInfo, replayState, isPaused, board]);

  // Reset Board
  const resetBoard = useCallback(
    (isRemote = false) => {
      setReplayState(null);
      setBoard(createEmptyBoard());
      setMoves([]);
      setCurrentPlayer('X');
      setWinnerInfo(null);
      setThreatBanner(null);
      matchStartTimeRef.current = Date.now();
      if (turnTimeLimit > 0) setTimeLeft(turnTimeLimit);

      callbacksRef.current.onClearPieces?.();

      if (gameMode === 'LAN_WIFI' && !isRemote) {
        callbacksRef.current.onSendLanPacket?.({ type: 'RESTART' });
      }
    },
    [gameMode, turnTimeLimit]
  );

  // Undo Move
  const performUndo = useCallback(
    (isRemote = false) => {
      if (replayState || winnerInfo || moves.length === 0) return;

      const stepsToPop = gameMode === 'AI_BOT' && moves.length >= 2 ? 2 : 1;
      const remainingMoves = moves.slice(0, moves.length - stepsToPop);

      const rebuiltBoard = createEmptyBoard();
      remainingMoves.forEach((m) => {
        rebuiltBoard[m.row][m.col] = m.player;
      });

      setBoard(rebuiltBoard);
      setMoves(remainingMoves);
      const nextP: PlayerSymbol =
        remainingMoves.length === 0
          ? 'X'
          : remainingMoves[remainingMoves.length - 1].player === 'X'
          ? 'O'
          : 'X';
      setCurrentPlayer(nextP);
      setThreatBanner(null);
      if (turnTimeLimit > 0) setTimeLeft(turnTimeLimit);

      callbacksRef.current.onSyncBoard?.(remainingMoves);

      if (gameMode === 'LAN_WIFI' && !isRemote) {
        callbacksRef.current.onSendLanPacket?.({ type: 'UNDO' });
      }
    },
    [replayState, winnerInfo, moves, gameMode, turnTimeLimit]
  );

  // Surrender
  const handleSurrender = useCallback(
    (surrenderingPlayer: PlayerSymbol = currentPlayer, isRemote = false) => {
      if (winnerInfo || moves.length === 0) return;
      const victorious: PlayerSymbol = surrenderingPlayer === 'X' ? 'O' : 'X';
      setWinnerInfo({
        winner: victorious,
        line: [],
        directionName: `${playerNames[surrenderingPlayer]} Đầu Hàng`,
      });
      soundEngine.playWinFanfare();
      recordCompletedMatch(victorious, 'Đối thủ đầu hàng', moves);

      if (gameMode === 'LAN_WIFI' && !isRemote) {
        callbacksRef.current.onSendLanPacket?.({ type: 'SURRENDER', player: surrenderingPlayer });
      }
    },
    [currentPlayer, winnerInfo, moves, playerNames, recordCompletedMatch, gameMode]
  );

  // Turn Countdown Timer
  useEffect(() => {
    if (winnerInfo || replayState || isPaused || turnTimeLimit === 0) return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          const victorious: PlayerSymbol = currentPlayer === 'X' ? 'O' : 'X';
          setWinnerInfo({
            winner: victorious,
            line: [],
            directionName: `Hết giờ lượt ${currentPlayer}`,
          });
          soundEngine.playWinFanfare();
          recordCompletedMatch(victorious, 'Thắng do hết giờ', moves);
          return 0;
        }
        if (prev <= 6) {
          soundEngine.playTick();
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [winnerInfo, replayState, isPaused, turnTimeLimit, currentPlayer, recordCompletedMatch, moves]);

  // Replay controller
  useEffect(() => {
    if (!replayState || !replayState.playing) return;
    if (replayState.stepIndex >= replayState.match.moves.length) {
      setReplayState((prev) => (prev ? { ...prev, playing: false } : null));
      return;
    }

    const timer = setTimeout(() => {
      const nextStep = replayState.stepIndex + 1;
      const sliceMoves = replayState.match.moves.slice(0, nextStep);
      const latest = sliceMoves[sliceMoves.length - 1];

      if (latest) {
        callbacksRef.current.onSpawnPiece?.(latest.row, latest.col, latest.player, true);
        soundEngine.playPlacePiece(latest.player);
      }

      setReplayState((prev) => (prev ? { ...prev, stepIndex: nextStep } : null));
    }, 550);

    return () => clearTimeout(timer);
  }, [replayState]);

  const startMatchReplay = useCallback((matchItem: MatchHistoryItem) => {
    if (!matchItem || !Array.isArray(matchItem.moves)) return;
    callbacksRef.current.onClearPieces?.();
    setWinnerInfo(null);
    setReplayState({ match: matchItem, stepIndex: 0, playing: true });
  }, []);

  const exitReplayMode = useCallback(() => {
    setReplayState(null);
    callbacksRef.current.onSyncBoard?.(moves);
  }, [moves]);

  return {
    gameMode,
    setGameMode,
    board,
    currentPlayer,
    moves,
    winnerInfo,
    setWinnerInfo,
    threatBanner,
    playerNames,
    setPlayerNames,
    scoreboard,
    setScoreboard,
    matchHistory,
    setMatchHistory,
    turnTimeLimit,
    setTurnTimeLimit,
    timeLeft,
    setTimeLeft,
    isPaused,
    setIsPaused,
    replayState,
    setReplayState,
    executeMove,
    resetBoard,
    performUndo,
    handleSurrender,
    startMatchReplay,
    exitReplayMode,
  };
}
