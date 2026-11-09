import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  Gamepad2, Wifi, Users, RotateCcw, Undo2, Flag, Volume2, VolumeX,
  Trophy, History, Camera, Eye, Sparkles, FolderTree, Copy, Check,
  Play, Pause, Trash2, MessageSquare, Send, ShieldAlert, Zap,
  Maximize2, Compass, Award, Clock, ChevronRight, RefreshCw, Cpu, X
} from 'lucide-react';

// ============================================================================
// MODULE 1: src/types/game.ts (CONSTANTS & DATA STRUCTURES)
// ============================================================================
const BOARD_SIZE = 30;
const WIN_COUNT = 5;
const STORAGE_KEYS = {
  ACTIVE_GAME: 'cybercaro_3d_active_game_v1',
  SCOREBOARD: 'cybercaro_3d_scoreboard_v1',
  MATCH_HISTORY: 'cybercaro_3d_match_history_v1',
  SETTINGS: 'cybercaro_3d_settings_v1',
};

// Coordinate helper: Col 0..29 -> A..Z, AA..AD | Row 0..29 -> 1..30
const getColLabel = (col) => {
  if (col < 26) return String.fromCharCode(65 + col);
  return 'A' + String.fromCharCode(65 + (col - 26));
};

const formatCoord = (row, col) => `${getColLabel(col)}${row + 1}`;

const createEmptyBoard = () =>
  Array.from({ length: BOARD_SIZE }, () => Array(BOARD_SIZE).fill(null));

// ============================================================================
// MODULE 2: src/lib/soundEngine.ts (WEB AUDIO SYNTHESIZER)
// ============================================================================
class CyberSoundEngine {
  constructor() {
    this.ctx = null;
    this.muted = false;
  }

  init() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  playHover() {
    if (this.muted) return;
    try {
      this.init();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(520, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(780, this.ctx.currentTime + 0.04);
      gain.gain.setValueAtTime(0.025, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.04);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.045);
    } catch (e) {}
  }

  playPlacePiece(player) {
    if (this.muted) return;
    try {
      this.init();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;

      // High-tech plasma drop + bass thud
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc1.type = player === 'X' ? 'triangle' : 'sine';
      osc2.type = 'sawtooth';

      const baseFreq = player === 'X' ? 440 : 360;
      osc1.frequency.setValueAtTime(baseFreq * 1.8, now);
      osc1.frequency.exponentialRampToValueAtTime(baseFreq, now + 0.12);
      osc1.frequency.exponentialRampToValueAtTime(baseFreq * 1.25, now + 0.22);

      osc2.frequency.setValueAtTime(140, now);
      osc2.frequency.exponentialRampToValueAtTime(48, now + 0.18);

      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(this.ctx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.26);
      osc2.stop(now + 0.26);
    } catch (e) {}
  }

  playThreatAlert() {
    if (this.muted) return;
    try {
      this.init();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      [587.33, 880].forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(freq, now + idx * 0.09);
        gain.gain.setValueAtTime(0.06, now + idx * 0.09);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.09 + 0.08);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now + idx * 0.09);
        osc.stop(now + idx * 0.09 + 0.085);
      });
    } catch (e) {}
  }

  playTick() {
    if (this.muted) return;
    try {
      this.init();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(980, now);
      gain.gain.setValueAtTime(0.05, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.06);
    } catch (e) {}
  }

  playWinFanfare() {
    if (this.muted) return;
    try {
      this.init();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const notes = [523.25, 659.25, 783.99, 1046.5, 1318.5];
      notes.forEach((freq, i) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + i * 0.11);
        gain.gain.setValueAtTime(0.16, now + i * 0.11);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.11 + 0.45);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now + i * 0.11);
        osc.stop(now + i * 0.11 + 0.46);
      });
    } catch (e) {}
  }
}

const soundEngine = new CyberSoundEngine();

// ============================================================================
// MODULE 3: src/lib/gomokuEngine.ts (WIN CHECK, THREAT DETECTION & CYBER AI)
// ============================================================================
const DIRECTIONS = [
  [0, 1],   // Ngang (Horizontal)
  [1, 0],   // Dọc (Vertical)
  [1, 1],   // Chéo chính (Diagonal \)
  [1, -1],  // Chéo phụ (Anti-diagonal /)
];

/**
 * Checks if the move at (row, col) by `player` creates 5 or more in a row.
 * Returns { won: boolean, line: Array<{row, col}>, directionName: string }
 */
function checkWin30x30(board, row, col, player) {
  const dirNames = ['Hàng Ngang', 'Hàng Dọc', 'Đường Chéo Chính', 'Đường Chéo Phụ'];

  for (let d = 0; d < DIRECTIONS.length; d++) {
    const [dr, dc] = DIRECTIONS[d];
    const line = [{ row, col }];

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
function checkFourThreat(board, row, col, player) {
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
function computeBestMove30x30(board, aiPlayer = 'O') {
  const human = aiPlayer === 'O' ? 'X' : 'O';
  const candidates = new Set();

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

  const evaluatePoint = (r, c, targetPlayer) => {
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

  let bestMove = null;
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

// ============================================================================
// MODULE 4: NEXT.JS PROJECT ARCHITECTURE SOURCE CODE VIEWER DATA
// ============================================================================
const NEXTJS_PROJECT_FILES = [
  {
    path: 'STRUCTURE.md',
    title: 'Cấu Trúc Thư Mục Next.js 14 (App Router)',
    lang: 'markdown',
    code: `cybercaro-3d-nextjs/
├── package.json
├── next.config.mjs
├── server.js                      # Custom Node.js + Socket.IO LAN Server (Tùy chọn)
└── src/
    ├── app/
    │   ├── layout.tsx             # Root Layout + Font Orbitron / Inter
    │   ├── page.tsx               # Trang chính khởi chạy Game
    │   └── globals.css            # TailwindCSS + Neon Glassmorphism styles
    ├── types/
    │   └── game.ts                # Kiểu dữ liệu Bàn cờ 30x30, Nước đi, LAN Packet
    ├── lib/
    │   ├── gomokuEngine.ts        # Thuật toán kiểm tra thắng 5 ô & AI CyberBot
    │   ├── soundEngine.ts         # Bộ tổng hợp âm thanh Web Audio API
    │   └── storage.ts             # Quản lý LocalStorage (Ván đang chơi, Lịch sử)
    ├── hooks/
    │   ├── useGameEngine.ts       # Quản lý State ván cờ, Undo, Đồng hồ đếm ngược
    │   └── useLanMultiplayer.ts   # Kết nối LAN/Wi-Fi (WebRTC PeerJS + BroadcastChannel)
    └── components/
        ├── 3d/
        │   ├── CaroScene3D.tsx    # Khung cảnh Three.js, Camera Orbit, Raycaster
        │   ├── Piece3D.ts         # Tạo Mesh 3D Quân X (Tinh thể Cyan) & O (Vòng Neon)
        │   └── EffectsManager.ts  # Hiệu ứng Sóng xung kích, Hạt nổ, Tia Laser thắng
        └── ui/
            ├── TopNavbar.tsx      # Thanh điều hướng, Chế độ chơi, Camera Presets
            ├── PlayerScoreCard.tsx# Bảng tỷ số 2 người chơi + Đồng hồ lượt
            ├── LanLobbyModal.tsx  # Phòng chờ mạng LAN / Wi-Fi (Tạo mã & Vào phòng)
            └── MoveHistorySidebar.tsx # Nhật ký tọa độ (A1..AD30) & Lịch sử đấu`
  },
  {
    path: 'src/types/game.ts',
    title: 'Định nghĩa Types & Constants (30x30)',
    lang: 'typescript',
    code: `export type PlayerSymbol = 'X' | 'O';
export type GameMode = 'LOCAL_2P' | 'LAN_WIFI' | 'AI_BOT';

export interface MoveRecord {
  step: number;
  row: number;
  col: number;
  player: PlayerSymbol;
  coord: string;
  timestamp: number;
}

export interface MatchHistoryItem {
  id: string;
  date: string;
  mode: GameMode;
  winner: PlayerSymbol | 'DRAW';
  playerXName: string;
  playerOName: string;
  totalMoves: number;
  durationSec: number;
  winningDirection: string;
  moves: MoveRecord[];
}

export interface LanMessagePacket {
  type: 'MOVE' | 'UNDO_REQ' | 'RESTART' | 'SURRENDER' | 'CHAT' | 'SYNC_STATE';
  payload: any;
  senderId: string;
}`
  },
  {
    path: 'src/hooks/useLanMultiplayer.ts',
    title: 'Hook kết nối mạng LAN / Wi-Fi (WebRTC + Local Sync)',
    lang: 'typescript',
    code: `// Hỗ trợ kết nối 2 máy dùng chung Wi-Fi qua PeerJS (WebRTC P2P)
// Kèm BroadcastChannel giúp test ngay trên 2 tab trình duyệt cùng 1 máy!
import { useEffect, useRef, useState, useCallback } from 'react';

export function useLanMultiplayer(onPacketReceived: (packet: any) => void) {
  const [roomCode, setRoomCode] = useState<string>('');
  const [status, setStatus] = useState<'IDLE' | 'HOSTING' | 'CONNECTED'>('IDLE');
  const peerRef = useRef<any>(null);
  const connRef = useRef<any>(null);
  const bcRef = useRef<BroadcastChannel | null>(null);

  const sendPacket = useCallback((packet: any) => {
    if (connRef.current?.open) connRef.current.send(packet);
    if (bcRef.current) bcRef.current.postMessage(packet);
  }, []);

  return { roomCode, status, sendPacket };
}`
  },
  {
    path: 'server.js',
    title: 'LAN Socket.IO Server (Chạy Offline Không Cần Internet)',
    lang: 'javascript',
    code: `// Chạy lệnh: node server.js để phát Server LAN nội bộ qua địa chỉ IP Wi-Fi (VD: http://192.168.1.15:3000)
const { createServer } = require('http');
const next = require('next');
const { Server } = require('socket.io');

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer((req, res) => handle(req, res));
  const io = new Server(httpServer, { cors: { origin: '*' } });

  io.on('connection', (socket) => {
    socket.on('join-room', (roomCode) => {
      socket.join(roomCode);
      socket.to(roomCode).emit('player-joined', { id: socket.id });
    });
    socket.on('game-packet', ({ roomCode, packet }) => {
      socket.to(roomCode).emit('game-packet', packet);
    });
  });

  httpServer.listen(3000, '0.0.0.0', () => {
    console.log('> CyberCaro 3D LAN Server ready on http://0.0.0.0:3000');
  });
});`
  }
];

// ============================================================================
// MODULE 5: MAIN APPLICATION & 3D THREE.JS SCENE CONTROLLER
// ============================================================================
export default function App() {
  // --- External CDN Scripts State (Three.js & PeerJS) ---
  const [threeReady, setThreeReady] = useState(false);
  const [peerLibReady, setPeerLibReady] = useState(false);

  // --- Game Configuration & Modes ---
  const [gameMode, setGameMode] = useState('LOCAL_2P'); // 'LOCAL_2P' | 'LAN_WIFI' | 'AI_BOT'
  const [board, setBoard] = useState(() => createEmptyBoard());
  const [currentPlayer, setCurrentPlayer] = useState('X');
  const [moves, setMoves] = useState([]);
  const [winnerInfo, setWinnerInfo] = useState(null); // { winner: 'X'|'O'|'DRAW', line: [], directionName: '' }
  const [threatBanner, setThreatBanner] = useState(null);

  // --- Player Profiles & Scoreboard (Persisted in LocalStorage) ---
  const [playerNames, setPlayerNames] = useState({ X: 'Chiến Binh Cyan (X)', O: 'Hộ Vệ Magenta (O)' });
  const [scoreboard, setScoreboard] = useState({ X: 0, O: 0, draws: 0, streakPlayer: null, streakCount: 0 });
  const [matchHistory, setMatchHistory] = useState([]);

  // --- Turn Timer ---
  const [turnTimeLimit, setTurnTimeLimit] = useState(30); // seconds (0 = unlimited)
  const [timeLeft, setTimeLeft] = useState(30);
  const [isPaused, setIsPaused] = useState(false);
  const matchStartTimeRef = useRef(Date.now());

  // --- Audio & Camera Controls ---
  const [isMuted, setIsMuted] = useState(false);
  const [cameraPreset, setCameraPreset] = useState('ISO_3D'); // 'ISO_3D' | 'TOP_2D' | 'CINEMATIC'
  const [autoFocusMove, setAutoFocusMove] = useState(false);
  const [hoveredCell, setHoveredCell] = useState(null); // { row, col }

  // --- UI Modals & Drawers ---
  const [activeTab, setActiveTab] = useState('MOVES'); // 'MOVES' | 'HISTORY' | 'CHAT'
  const [showLanModal, setShowLanModal] = useState(false);
  const [showArchitectureModal, setShowArchitectureModal] = useState(false);
  const [selectedArchFile, setSelectedArchFile] = useState(NEXTJS_PROJECT_FILES[0]);
  const [copiedFile, setCopiedFile] = useState(false);

  // --- Replay Mode State ---
  const [replayState, setReplayState] = useState(null); // { match, stepIndex, playing }

  // --- LAN / Wi-Fi Multiplayer State (WebRTC PeerJS + BroadcastChannel fallback) ---
  const [lanRole, setLanRole] = useState('HOST'); // 'HOST' ('X') | 'GUEST' ('O')
  const [lanRoomCode, setLanRoomCode] = useState('');
  const [lanInputCode, setLanInputCode] = useState('');
  const [lanStatus, setLanStatus] = useState('DISCONNECTED'); // 'DISCONNECTED' | 'WAITING' | 'CONNECTED'
  const [lanTransport, setLanTransport] = useState(''); // 'WebRTC Wi-Fi' | 'Local Tab Sync'
  const [chatMessages, setChatMessages] = useState([
    { id: 1, sender: 'SYSTEM', text: 'Chào mừng đến với đấu trường CyberCaro 3D 30x30!', time: 'Now' }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [floatingEmoji, setFloatingEmoji] = useState(null);

  const peerInstanceRef = useRef(null);
  const peerConnRef = useRef(null);
  const broadcastChannelRef = useRef(null);

  // --- Load Three.js & PeerJS Dynamically ---
  useEffect(() => {
    if (window.THREE) {
      setThreeReady(true);
    } else {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
      script.async = true;
      script.onload = () => setThreeReady(true);
      document.head.appendChild(script);
    }

    if (window.Peer) {
      setPeerLibReady(true);
    } else {
      const peerScript = document.createElement('script');
      peerScript.src = 'https://unpkg.com/peerjs@1.5.2/dist/peerjs.min.js';
      peerScript.async = true;
      peerScript.onload = () => setPeerLibReady(true);
      document.head.appendChild(peerScript);
    }
  }, []);

  // --- Load Persisted Data from LocalStorage on Mount ---
  useEffect(() => {
    try {
      const savedScores = localStorage.getItem(STORAGE_KEYS.SCOREBOARD);
      if (savedScores) setScoreboard(JSON.parse(savedScores));

      const savedHistory = localStorage.getItem(STORAGE_KEYS.MATCH_HISTORY);
      if (savedHistory) setMatchHistory(JSON.parse(savedHistory));

      const savedSettings = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        if (parsed.playerNames) setPlayerNames(parsed.playerNames);
        if (typeof parsed.turnTimeLimit === 'number') {
          setTurnTimeLimit(parsed.turnTimeLimit);
          setTimeLeft(parsed.turnTimeLimit);
        }
      }

      const savedGame = localStorage.getItem(STORAGE_KEYS.ACTIVE_GAME);
      if (savedGame) {
        const parsed = JSON.parse(savedGame);
        if (parsed && Array.isArray(parsed.moves) && parsed.moves.length > 0 && !parsed.winnerInfo) {
          const restoredBoard = createEmptyBoard();
          parsed.moves.forEach((m) => {
            if (m.row >= 0 && m.row < BOARD_SIZE && m.col >= 0 && m.col < BOARD_SIZE) {
              restoredBoard[m.row][m.col] = m.player;
            }
          });
          setBoard(restoredBoard);
          setMoves(parsed.moves);
          setCurrentPlayer(parsed.currentPlayer || 'X');
          if (parsed.gameMode) setGameMode(parsed.gameMode);
        }
      }
    } catch (e) {
      console.error('Failed to restore from localStorage', e);
    }
  }, []);

  // --- Save Active Game to LocalStorage ---
  useEffect(() => {
    if (replayState) return;
    try {
      localStorage.setItem(
        STORAGE_KEYS.ACTIVE_GAME,
        JSON.stringify({
          moves,
          currentPlayer,
          winnerInfo,
          gameMode,
          updatedAt: Date.now(),
        })
      );
    } catch (e) {}
  }, [moves, currentPlayer, winnerInfo, gameMode, replayState]);

  // --- Save Settings ---
  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEYS.SETTINGS,
        JSON.stringify({ playerNames, turnTimeLimit })
      );
    } catch (e) {}
  }, [playerNames, turnTimeLimit]);

  // ============================================================================
  // LAN / WI-FI MULTIPLAYER ENGINE (PeerJS WebRTC + BroadcastChannel)
  // ============================================================================
  const sendLanPacket = useCallback((packet) => {
    if (peerConnRef.current && peerConnRef.current.open) {
      try {
        peerConnRef.current.send(packet);
      } catch (e) {}
    }
    if (broadcastChannelRef.current) {
      try {
        broadcastChannelRef.current.postMessage(packet);
      } catch (e) {}
    }
  }, []);

  const handleIncomingLanPacket = useCallback((packet) => {
    if (!packet || !packet.type) return;

    switch (packet.type) {
      case 'GUEST_JOINED':
        setLanStatus('CONNECTED');
        setLanTransport(packet.transport || 'LAN Wi-Fi');
        setChatMessages((prev) => [
          ...prev,
          { id: Date.now(), sender: 'LAN', text: `Người chơi ${packet.guestName || 'Khách (O)'} đã kết nối vào phòng!`, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
        ]);
        soundEngine.playThreatAlert();
        break;

      case 'MOVE':
        if (packet.row !== undefined && packet.col !== undefined) {
          executeMoveRef.current(packet.row, packet.col, packet.player, true);
        }
        break;

      case 'RESTART':
        resetBoardRef.current(true);
        break;

      case 'UNDO':
        performUndoRef.current(true);
        break;

      case 'SURRENDER':
        handleSurrenderRef.current(packet.player, true);
        break;

      case 'CHAT':
        setChatMessages((prev) => [
          ...prev,
          {
            id: Date.now(),
            sender: packet.sender,
            text: packet.text,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]);
        soundEngine.playHover();
        break;

      case 'EMOJI':
        setFloatingEmoji({ emoji: packet.emoji, sender: packet.sender, id: Date.now() });
        soundEngine.playHover();
        break;

      default:
        break;
    }
  }, []);

  const setupBroadcastChannel = useCallback((code) => {
    if (broadcastChannelRef.current) {
      broadcastChannelRef.current.close();
    }
    if (typeof BroadcastChannel !== 'undefined') {
      const bc = new BroadcastChannel(`cybercaro_lan_${code}`);
      bc.onmessage = (ev) => handleIncomingLanPacket(ev.data);
      broadcastChannelRef.current = bc;
    }
  }, [handleIncomingLanPacket]);

  const createLanRoom = useCallback(() => {
    const code = Math.random().toString(36).substring(2, 6).toUpperCase() + '-' + Math.floor(10 + Math.random() * 89);
    setLanRoomCode(code);
    setLanRole('HOST');
    setLanStatus('WAITING');
    setGameMode('LAN_WIFI');

    // Setup instant BroadcastChannel for same-machine/multi-tab testing
    setupBroadcastChannel(code);

    // Setup PeerJS WebRTC for cross-device LAN Wi-Fi
    if (window.Peer) {
      try {
        if (peerInstanceRef.current) peerInstanceRef.current.destroy();
        const peerId = `cybercaro-3d-${code.toLowerCase()}`;
        const peer = new window.Peer(peerId);
        peerInstanceRef.current = peer;

        peer.on('connection', (conn) => {
          peerConnRef.current = conn;
          conn.on('open', () => {
            setLanStatus('CONNECTED');
            setLanTransport('WebRTC P2P Wi-Fi');
          });
          conn.on('data', (data) => handleIncomingLanPacket(data));
        });
      } catch (e) {
        console.warn('PeerJS fallback to local channel:', e);
      }
    }
  }, [handleIncomingLanPacket, setupBroadcastChannel]);

  const joinLanRoom = useCallback((rawCode) => {
    const cleanCode = rawCode.trim().toUpperCase();
    if (!cleanCode) return;

    setLanRoomCode(cleanCode);
    setLanRole('GUEST');
    setLanStatus('WAITING');
    setGameMode('LAN_WIFI');

    // 1. Connect via BroadcastChannel (works immediately across tabs)
    setupBroadcastChannel(cleanCode);
    setTimeout(() => {
      if (broadcastChannelRef.current) {
        broadcastChannelRef.current.postMessage({
          type: 'GUEST_JOINED',
          guestName: playerNames.O,
          transport: 'Local LAN Sync'
        });
      }
    }, 150);

    // 2. Connect via PeerJS WebRTC (works across 2 phones/laptops on Wi-Fi)
    if (window.Peer) {
      try {
        if (peerInstanceRef.current) peerInstanceRef.current.destroy();
        const peer = new window.Peer();
        peerInstanceRef.current = peer;

        peer.on('open', () => {
          const hostPeerId = `cybercaro-3d-${cleanCode.toLowerCase()}`;
          const conn = peer.connect(hostPeerId, { reliable: true });
          peerConnRef.current = conn;

          conn.on('open', () => {
            setLanStatus('CONNECTED');
            setLanTransport('WebRTC P2P Wi-Fi');
            conn.send({
              type: 'GUEST_JOINED',
              guestName: playerNames.O,
              transport: 'WebRTC P2P Wi-Fi'
            });
            setShowLanModal(false);
          });

          conn.on('data', (data) => handleIncomingLanPacket(data));
        });
      } catch (e) {}
    }

    // Also mark connected if BroadcastChannel responds or for immediate LAN testing
    setTimeout(() => {
      setLanStatus('CONNECTED');
      setLanTransport((prev) => prev || 'LAN Channel');
      setShowLanModal(false);
    }, 500);
  }, [handleIncomingLanPacket, playerNames.O, setupBroadcastChannel]);

  // ============================================================================
  // CORE GAMEPLAY ACTIONS (PLACE PIECE, WIN RECORDING, UNDO, SURRENDER)
  // ============================================================================
  const recordCompletedMatch = useCallback((winner, directionName, finalMoves) => {
    const durationSec = Math.max(1, Math.round((Date.now() - matchStartTimeRef.current) / 1000));

    // Update Scoreboard
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
      try {
        localStorage.setItem(STORAGE_KEYS.SCOREBOARD, JSON.stringify(next));
      } catch (e) {}
      return next;
    });

    // Add to Match History
    const newEntry = {
      id: `match_${Date.now()}`,
      date: new Date().toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' }),
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
      try {
        localStorage.setItem(STORAGE_KEYS.MATCH_HISTORY, JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  }, [gameMode, playerNames]);

  const executeMove = useCallback((row, col, forcedPlayer = null, isRemote = false) => {
    if (replayState) return false;
    if (winnerInfo) return false;
    if (row < 0 || row >= BOARD_SIZE || col < 0 || col >= BOARD_SIZE) return false;
    if (board[row][col] !== null) return false;

    const activeP = forcedPlayer || currentPlayer;

    // In LAN mode, check if it's this device's turn (unless packet came from remote)
    if (gameMode === 'LAN_WIFI' && lanStatus === 'CONNECTED' && !isRemote) {
      const mySymbol = lanRole === 'HOST' ? 'X' : 'O';
      if (activeP !== mySymbol) {
        soundEngine.playTick();
        return false;
      }
    }

    // Update Board
    const nextBoard = board.map((r) => [...r]);
    nextBoard[row][col] = activeP;

    const moveItem = {
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

    // Trigger 3D Scene Visual Effects (Drop, Shockwave, Particle Burst)
    if (sceneApiRef.current) {
      sceneApiRef.current.spawnPiece3D(row, col, activeP, true);
      if (autoFocusMove) {
        sceneApiRef.current.focusOnCell(row, col);
      }
    }

    // Broadcast to LAN peer if local move
    if (gameMode === 'LAN_WIFI' && !isRemote) {
      sendLanPacket({ type: 'MOVE', row, col, player: activeP });
    }

    // Check 5-in-a-row Win
    const winCheck = checkWin30x30(nextBoard, row, col, activeP);
    if (winCheck.won) {
      const winPayload = {
        winner: activeP,
        line: winCheck.line,
        directionName: winCheck.directionName,
      };
      setWinnerInfo(winPayload);
      setThreatBanner(null);
      soundEngine.playWinFanfare();
      if (sceneApiRef.current) {
        sceneApiRef.current.showWinEffects(winCheck.line, activeP);
      }
      recordCompletedMatch(activeP, winCheck.directionName, nextMoves);
      return true;
    }

    // Check Full Board Draw (900 cells)
    if (nextMoves.length >= BOARD_SIZE * BOARD_SIZE) {
      setWinnerInfo({ winner: 'DRAW', line: [], directionName: 'Hòa Cờ (Đầy Bàn)' });
      recordCompletedMatch('DRAW', 'Hòa Cờ', nextMoves);
      return true;
    }

    // Check 4-in-a-row threat alert
    const isThreat = checkFourThreat(nextBoard, row, col, activeP);
    if (isThreat) {
      setThreatBanner({
        player: activeP,
        coord: formatCoord(row, col),
      });
      soundEngine.playThreatAlert();
    } else {
      setThreatBanner(null);
    }

    // Switch Turn & Reset Turn Timer
    const nextPlayer = activeP === 'X' ? 'O' : 'X';
    setCurrentPlayer(nextPlayer);
    if (turnTimeLimit > 0) setTimeLeft(turnTimeLimit);

    return true;
  }, [
    replayState, winnerInfo, board, currentPlayer, gameMode, lanStatus,
    lanRole, moves, autoFocusMove, sendLanPacket, turnTimeLimit, recordCompletedMatch
  ]);

  const executeMoveRef = useRef(executeMove);
  useEffect(() => {
    executeMoveRef.current = executeMove;
  }, [executeMove]);

  // --- AI CyberBot Turn Trigger ---
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

  // --- Reset / New Game ---
  const resetBoard = useCallback((isRemote = false) => {
    setReplayState(null);
    setBoard(createEmptyBoard());
    setMoves([]);
    setCurrentPlayer('X');
    setWinnerInfo(null);
    setThreatBanner(null);
    matchStartTimeRef.current = Date.now();
    if (turnTimeLimit > 0) setTimeLeft(turnTimeLimit);

    if (sceneApiRef.current) {
      sceneApiRef.current.clearAllPieces();
    }

    if (gameMode === 'LAN_WIFI' && !isRemote) {
      sendLanPacket({ type: 'RESTART' });
    }
  }, [gameMode, sendLanPacket, turnTimeLimit]);

  const resetBoardRef = useRef(resetBoard);
  useEffect(() => {
    resetBoardRef.current = resetBoard;
  }, [resetBoard]);

  // --- Undo Move (Xin đi lại) ---
  const performUndo = useCallback((isRemote = false) => {
    if (replayState || winnerInfo || moves.length === 0) return;

    // If playing vs AI Bot, undo both AI and Human moves (2 steps)
    const stepsToPop = gameMode === 'AI_BOT' && moves.length >= 2 ? 2 : 1;
    const remainingMoves = moves.slice(0, moves.length - stepsToPop);

    const rebuiltBoard = createEmptyBoard();
    remainingMoves.forEach((m) => {
      rebuiltBoard[m.row][m.col] = m.player;
    });

    setBoard(rebuiltBoard);
    setMoves(remainingMoves);
    const nextP = remainingMoves.length === 0
      ? 'X'
      : remainingMoves[remainingMoves.length - 1].player === 'X' ? 'O' : 'X';
    setCurrentPlayer(nextP);
    setThreatBanner(null);
    if (turnTimeLimit > 0) setTimeLeft(turnTimeLimit);

    if (sceneApiRef.current) {
      sceneApiRef.current.syncBoardState(remainingMoves);
    }

    if (gameMode === 'LAN_WIFI' && !isRemote) {
      sendLanPacket({ type: 'UNDO' });
    }
  }, [replayState, winnerInfo, moves, gameMode, turnTimeLimit, sendLanPacket]);

  const performUndoRef = useRef(performUndo);
  useEffect(() => {
    performUndoRef.current = performUndo;
  }, [performUndo]);

  // --- Surrender (Đầu hàng) ---
  const handleSurrender = useCallback((surrenderingPlayer = currentPlayer, isRemote = false) => {
    if (winnerInfo || moves.length === 0) return;
    const victorious = surrenderingPlayer === 'X' ? 'O' : 'X';
    setWinnerInfo({
      winner: victorious,
      line: [],
      directionName: `${playerNames[surrenderingPlayer]} Đầu Hàng`,
    });
    soundEngine.playWinFanfare();
    recordCompletedMatch(victorious, 'Đối thủ đầu hàng', moves);

    if (gameMode === 'LAN_WIFI' && !isRemote) {
      sendLanPacket({ type: 'SURRENDER', player: surrenderingPlayer });
    }
  }, [currentPlayer, winnerInfo, moves, playerNames, recordCompletedMatch, gameMode, sendLanPacket]);

  const handleSurrenderRef = useRef(handleSurrender);
  useEffect(() => {
    handleSurrenderRef.current = handleSurrender;
  }, [handleSurrender]);

  // --- Turn Countdown Timer ---
  useEffect(() => {
    if (winnerInfo || replayState || isPaused || turnTimeLimit === 0) return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          // Time out -> Opponent wins!
          const victorious = currentPlayer === 'X' ? 'O' : 'X';
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

  // --- 3D Match Replay Controller ---
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

      if (sceneApiRef.current && latest) {
        sceneApiRef.current.spawnPiece3D(latest.row, latest.col, latest.player, true);
      }
      soundEngine.playPlacePiece(latest?.player || 'X');

      setReplayState((prev) => (prev ? { ...prev, stepIndex: nextStep } : null));
    }, 550);

    return () => clearTimeout(timer);
  }, [replayState]);

  const startMatchReplay = (matchItem) => {
    if (!matchItem || !Array.isArray(matchItem.moves)) return;
    if (sceneApiRef.current) {
      sceneApiRef.current.clearAllPieces();
    }
    setWinnerInfo(null);
    setReplayState({
      match: matchItem,
      stepIndex: 0,
      playing: true,
    });
  };

  const exitReplayMode = () => {
    setReplayState(null);
    if (sceneApiRef.current) {
      sceneApiRef.current.syncBoardState(moves);
    }
  };

  // ============================================================================
  // THREE.JS 30x30 CYBERPUNK 3D SCENE ENGINE
  // ============================================================================
  const mountRef = useRef(null);
  const sceneApiRef = useRef(null);

  useEffect(() => {
    if (!threeReady || !mountRef.current) return;
    const THREE = window.THREE;
    const container = mountRef.current;

    // 1. Scene, Fog & Renderer
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x050711);
    scene.fog = new THREE.FogExp2(0x050711, 0.0085);

    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // 2. Camera & Spherical Orbit / Pan System
    const camera = new THREE.PerspectiveCamera(
      45,
      container.clientWidth / container.clientHeight,
      0.5,
      300
    );

    const camState = {
      target: new THREE.Vector3(0, 0, 0),
      DesiredTarget: new THREE.Vector3(0, 0, 0),
      theta: 0,               // Horizontal angle
      phi: Math.PI / 3.1,     // Vertical angle from Y axis
      radius: 36,
      desiredTheta: 0,
      desiredPhi: Math.PI / 3.1,
      desiredRadius: 36,
      isDragging: false,
      isPanning: false,
      dragStartX: 0,
      dragStartY: 0,
      pointerMovedDist: 0,
      cinematicRotate: false,
    };

    // 3. Cyberpunk Lighting Setup
    const ambientLight = new THREE.AmbientLight(0x2a3558, 1.4);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.1);
    dirLight.position.set(18, 35, 22);
    dirLight.castShadow = true;
    scene.add(dirLight);

    const cyanPointLight = new THREE.PointLight(0x00f3ff, 2.2, 65);
    cyanPointLight.position.set(-18, 12, -18);
    scene.add(cyanPointLight);

    const magentaPointLight = new THREE.PointLight(0xff007f, 2.2, 65);
    magentaPointLight.position.set(18, 12, 18);
    scene.add(magentaPointLight);

    // 4. 30x30 Board Geometry & Neon Grid
    const cellSize = 1.0;
    const totalSpan = BOARD_SIZE * cellSize; // 30 units (-15 to +15)
    const halfSpan = totalSpan / 2;

    const boardGroup = new THREE.Group();
    scene.add(boardGroup);

    // Base Obsidian Platform
    const baseGeo = new THREE.BoxGeometry(totalSpan + 1.8, 0.9, totalSpan + 1.8);
    const baseMat = new THREE.MeshStandardMaterial({
      color: 0x0a0f1f,
      roughness: 0.25,
      metalness: 0.75,
    });
    const baseMesh = new THREE.Mesh(baseGeo, baseMat);
    baseMesh.position.y = -0.46;
    baseMesh.receiveShadow = true;
    boardGroup.add(baseMesh);

    // Glowing Neon Frame Borders around the 30x30 board
    const borderMatCyan = new THREE.MeshBasicMaterial({ color: 0x00f3ff });
    const borderMatMagenta = new THREE.MeshBasicMaterial({ color: 0xff007f });

    const borderTop = new THREE.Mesh(new THREE.BoxGeometry(totalSpan + 2.05, 0.14, 0.16), borderMatCyan);
    borderTop.position.set(0, 0.02, -halfSpan - 0.92);
    boardGroup.add(borderTop);

    const borderBottom = new THREE.Mesh(new THREE.BoxGeometry(totalSpan + 2.05, 0.14, 0.16), borderMatMagenta);
    borderBottom.position.set(0, 0.02, halfSpan + 0.92);
    boardGroup.add(borderBottom);

    const borderLeft = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.14, totalSpan + 2.05), borderMatCyan);
    borderLeft.position.set(-halfSpan - 0.92, 0.02, 0);
    boardGroup.add(borderLeft);

    const borderRight = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.14, totalSpan + 2.05), borderMatMagenta);
    borderRight.position.set(halfSpan + 0.92, 0.02, 0);
    boardGroup.add(borderRight);

    // 30x30 Grid Lines
    const linePoints = [];
    const majorLinePoints = [];
    for (let i = 0; i <= BOARD_SIZE; i++) {
      const pos = -halfSpan + i * cellSize;
      const isMajor = i % 5 === 0;
      const targetArray = isMajor ? majorLinePoints : linePoints;

      // Horizontal line
      targetArray.push(new THREE.Vector3(-halfSpan, 0.01, pos));
      targetArray.push(new THREE.Vector3(halfSpan, 0.01, pos));
      // Vertical line
      targetArray.push(new THREE.Vector3(pos, 0.01, -halfSpan));
      targetArray.push(new THREE.Vector3(pos, 0.01, halfSpan));
    }

    const minorGridGeo = new THREE.BufferGeometry().setFromPoints(linePoints);
    const minorGridMat = new THREE.LineBasicMaterial({ color: 0x1e3a5f, transparent: true, opacity: 0.65 });
    boardGroup.add(new THREE.LineSegments(minorGridGeo, minorGridMat));

    const majorGridGeo = new THREE.BufferGeometry().setFromPoints(majorLinePoints);
    const majorGridMat = new THREE.LineBasicMaterial({ color: 0x00f3ff, transparent: true, opacity: 0.45 });
    boardGroup.add(new THREE.LineSegments(majorGridGeo, majorGridMat));

    // Star Points (Hoshi) on 30x30 Grid for Tactical Orientation
    const starCoords = [5, 10, 15, 20, 25];
    const starGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.03, 16);
    const starMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
    starCoords.forEach((r) => {
      starCoords.forEach((c) => {
        const dot = new THREE.Mesh(starGeo, starMat);
        dot.position.set(-halfSpan + c * cellSize, 0.015, -halfSpan + r * cellSize);
        boardGroup.add(dot);
      });
    });

    // Invisible Raycast Plane for Accurate 30x30 Cell Selection
    const raycastPlaneGeo = new THREE.PlaneGeometry(totalSpan, totalSpan);
    raycastPlaneGeo.rotateX(-Math.PI / 2);
    const raycastPlaneMat = new THREE.MeshBasicMaterial({ visible: false });
    const raycastPlane = new THREE.Mesh(raycastPlaneGeo, raycastPlaneMat);
    boardGroup.add(raycastPlane);

    // 5. Interactive Hover Cell Hologram Selector
    const hoverGroup = new THREE.Group();
    hoverGroup.visible = false;
    scene.add(hoverGroup);

    const hoverTileGeo = new THREE.PlaneGeometry(0.92, 0.92);
    hoverTileGeo.rotateX(-Math.PI / 2);
    const hoverTileMat = new THREE.MeshBasicMaterial({
      color: 0x00f3ff,
      transparent: true,
      opacity: 0.32,
      side: THREE.DoubleSide,
    });
    const hoverTile = new THREE.Mesh(hoverTileGeo, hoverTileMat);
    hoverTile.position.y = 0.03;
    hoverGroup.add(hoverTile);

    const hoverRingGeo = new THREE.RingGeometry(0.32, 0.44, 24);
    hoverRingGeo.rotateX(-Math.PI / 2);
    const hoverRingMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.85,
      side: THREE.DoubleSide,
    });
    const hoverRing = new THREE.Mesh(hoverRingGeo, hoverRingMat);
    hoverRing.position.y = 0.05;
    hoverGroup.add(hoverRing);

    // Last Move Beacon Marker (Golden Pulsing Halo)
    const lastMoveBeacon = new THREE.Group();
    lastMoveBeacon.visible = false;
    const beaconRingGeo = new THREE.RingGeometry(0.38, 0.48, 32);
    beaconRingGeo.rotateX(-Math.PI / 2);
    const beaconRingMat = new THREE.MeshBasicMaterial({
      color: 0xfacc15,
      transparent: true,
      opacity: 0.95,
      side: THREE.DoubleSide,
    });
    const beaconRing = new THREE.Mesh(beaconRingGeo, beaconRingMat);
    beaconRing.position.y = 0.04;
    lastMoveBeacon.add(beaconRing);

    const beaconPillarGeo = new THREE.CylinderGeometry(0.05, 0.25, 1.4, 16, 1, true);
    const beaconPillarMat = new THREE.MeshBasicMaterial({
      color: 0xfacc15,
      transparent: true,
      opacity: 0.22,
      side: THREE.DoubleSide,
    });
    const beaconPillar = new THREE.Mesh(beaconPillarGeo, beaconPillarMat);
    beaconPillar.position.y = 0.7;
    lastMoveBeacon.add(beaconPillar);
    scene.add(lastMoveBeacon);

    // 6. Ambient Floating Cyber Dust Particles
    const ambientCount = 220;
    const ambientPos = new Float32Array(ambientCount * 3);
    for (let i = 0; i < ambientCount; i++) {
      ambientPos[i * 3] = (Math.random() - 0.5) * 65;
      ambientPos[i * 3 + 1] = Math.random() * 22 + 0.5;
      ambientPos[i * 3 + 2] = (Math.random() - 0.5) * 65;
    }
    const ambientGeo = new THREE.BufferGeometry();
    ambientGeo.setAttribute('position', new THREE.BufferAttribute(ambientPos, 3));
    const ambientMat = new THREE.PointsMaterial({
      color: 0x38bdf8,
      size: 0.18,
      transparent: true,
      opacity: 0.55,
    });
    const ambientParticles = new THREE.Points(ambientGeo, ambientMat);
    scene.add(ambientParticles);

    // 7. Dynamic Containers for Pieces, Shockwaves, Bursts & Win Laser
    const piecesGroup = new THREE.Group();
    scene.add(piecesGroup);

    const effectsGroup = new THREE.Group();
    scene.add(effectsGroup);

    const animatedPieces = []; // { mesh, coreMesh, startY, progress }
    const shockwaves = [];     // { mesh, progress, maxScale }
    const particleBursts = []; // { points, velocities, progress }
    let winLaserObjects = [];

    const cellToWorld = (row, col) => ({
      x: -halfSpan + (col + 0.5) * cellSize,
      z: -halfSpan + (row + 0.5) * cellSize,
    });

    // Helper: Create 3D Piece Mesh (Player X = Neon Cyan Crystal Cross, Player O = Neon Magenta Energy Torus)
    const createPieceMesh = (player) => {
      const group = new THREE.Group();

      if (player === 'X') {
        const cyanMat = new THREE.MeshStandardMaterial({
          color: 0x00f3ff,
          emissive: 0x00a8b5,
          emissiveIntensity: 0.85,
          roughness: 0.15,
          metalness: 0.8,
        });

        const barGeo = new THREE.BoxGeometry(0.76, 0.22, 0.2);
        const bar1 = new THREE.Mesh(barGeo, cyanMat);
        bar1.rotation.y = Math.PI / 4;
        bar1.position.y = 0.18;
        bar1.castShadow = true;

        const bar2 = new THREE.Mesh(barGeo, cyanMat);
        bar2.rotation.y = -Math.PI / 4;
        bar2.position.y = 0.18;
        bar2.castShadow = true;

        // Floating Octahedron Energy Core
        const coreGeo = new THREE.OctahedronGeometry(0.18, 0);
        const coreMat = new THREE.MeshBasicMaterial({ color: 0xe0ffff });
        const core = new THREE.Mesh(coreGeo, coreMat);
        core.position.y = 0.42;

        group.add(bar1, bar2, core);
        group.userData.core = core;
      } else {
        const magentaMat = new THREE.MeshStandardMaterial({
          color: 0xff007f,
          emissive: 0xc80064,
          emissiveIntensity: 0.85,
          roughness: 0.15,
          metalness: 0.8,
        });

        const torusGeo = new THREE.TorusGeometry(0.28, 0.1, 16, 32);
        torusGeo.rotateX(Math.PI / 2);
        const torus = new THREE.Mesh(torusGeo, magentaMat);
        torus.position.y = 0.18;
        torus.castShadow = true;

        // Levitating Plasma Sphere Core
        const sphereGeo = new THREE.SphereGeometry(0.14, 16, 16);
        const sphereMat = new THREE.MeshBasicMaterial({ color: 0xffe4f2 });
        const core = new THREE.Mesh(sphereGeo, sphereMat);
        core.position.y = 0.38;

        group.add(torus, core);
        group.userData.core = core;
      }

      return group;
    };

    // Helper: Spawn Shockwave & Particle Burst at (x, z)
    const triggerLandingEffects = (x, z, colorHex) => {
      // 1. Expanding Neon Shockwave Ring
      const ringGeo = new THREE.RingGeometry(0.15, 0.26, 32);
      ringGeo.rotateX(-Math.PI / 2);
      const ringMat = new THREE.MeshBasicMaterial({
        color: colorHex,
        transparent: true,
        opacity: 0.95,
        side: THREE.DoubleSide,
      });
      const ringMesh = new THREE.Mesh(ringGeo, ringMat);
      ringMesh.position.set(x, 0.04, z);
      effectsGroup.add(ringMesh);
      shockwaves.push({ mesh: ringMesh, progress: 0, maxScale: 4.2 });

      // 2. 3D Particle Sparks Burst
      const count = 28;
      const positions = new Float32Array(count * 3);
      const velocities = [];
      for (let i = 0; i < count; i++) {
        positions[i * 3] = x;
        positions[i * 3 + 1] = 0.2;
        positions[i * 3 + 2] = z;
        const angle = Math.random() * Math.PI * 2;
        const speed = 0.04 + Math.random() * 0.11;
        velocities.push({
          vx: Math.cos(angle) * speed,
          vy: 0.06 + Math.random() * 0.12,
          vz: Math.sin(angle) * speed,
        });
      }
      const pGeo = new THREE.BufferGeometry();
      pGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      const pMat = new THREE.PointsMaterial({
        color: colorHex,
        size: 0.16,
        transparent: true,
        opacity: 1,
      });
      const points = new THREE.Points(pGeo, pMat);
      effectsGroup.add(points);
      particleBursts.push({ points, velocities, progress: 0 });
    };

    // Expose Imperative Scene Methods to React
    sceneApiRef.current = {
      spawnPiece3D: (row, col, player, animate = true) => {
        const { x, z } = cellToWorld(row, col);
        const pieceMesh = createPieceMesh(player);
        pieceMesh.position.set(x, animate ? 4.5 : 0, z);
        piecesGroup.add(pieceMesh);

        // Move Last Move Beacon here
        lastMoveBeacon.position.set(x, 0, z);
        lastMoveBeacon.visible = true;

        if (animate) {
          animatedPieces.push({
            mesh: pieceMesh,
            progress: 0,
            x,
            z,
            colorHex: player === 'X' ? 0x00f3ff : 0xff007f,
            landedEffectTriggered: false,
          });
        } else {
          pieceMesh.position.y = 0;
        }
      },

      clearAllPieces: () => {
        while (piecesGroup.children.length > 0) {
          piecesGroup.remove(piecesGroup.children[0]);
        }
        winLaserObjects.forEach((obj) => effectsGroup.remove(obj));
        winLaserObjects = [];
        lastMoveBeacon.visible = false;
      },

      syncBoardState: (moveList) => {
        sceneApiRef.current.clearAllPieces();
        moveList.forEach((m, idx) => {
          const isLast = idx === moveList.length - 1;
          sceneApiRef.current.spawnPiece3D(m.row, m.col, m.player, isLast);
        });
      },

      showWinEffects: (winningLine, winnerSymbol) => {
        if (!winningLine || winningLine.length < 2) return;
        const colorHex = winnerSymbol === 'X' ? 0x00f3ff : 0xff007f;

        const first = cellToWorld(winningLine[0].row, winningLine[0].col);
        const last = cellToWorld(winningLine[winningLine.length - 1].row, winningLine[winningLine.length - 1].col);

        const startVec = new THREE.Vector3(first.x, 0.38, first.z);
        const endVec = new THREE.Vector3(last.x, 0.38, last.z);
        const distance = startVec.distanceTo(endVec);
        const midVec = startVec.clone().lerp(endVec, 0.5);

        // Glowing Laser Cylinder connecting all 5 winning pieces
        const laserGeo = new THREE.CylinderGeometry(0.12, 0.12, distance + 0.6, 20);
        laserGeo.rotateX(Math.PI / 2);
        const laserMat = new THREE.MeshBasicMaterial({
          color: 0xffffff,
          transparent: true,
          opacity: 0.95,
        });
        const laserMesh = new THREE.Mesh(laserGeo, laserMat);
        laserMesh.position.copy(midVec);
        laserMesh.lookAt(endVec);
        effectsGroup.add(laserMesh);
        winLaserObjects.push(laserMesh);

        // Outer Neon Halo Tube around Laser
        const haloGeo = new THREE.CylinderGeometry(0.28, 0.28, distance + 0.8, 20);
        haloGeo.rotateX(Math.PI / 2);
        const haloMat = new THREE.MeshBasicMaterial({
          color: colorHex,
          transparent: true,
          opacity: 0.45,
        });
        const haloMesh = new THREE.Mesh(haloGeo, haloMat);
        haloMesh.position.copy(midVec);
        haloMesh.lookAt(endVec);
        effectsGroup.add(haloMesh);
        winLaserObjects.push(haloMesh);

        // Celebratory Firework Bursts on every winning piece
        winningLine.forEach((cell, i) => {
          const pos = cellToWorld(cell.row, cell.col);
          setTimeout(() => {
            triggerLandingEffects(pos.x, pos.z, 0xfacc15);
            triggerLandingEffects(pos.x, pos.z, colorHex);
          }, i * 140);
        });
      },

      setCameraPresetView: (presetName) => {
        if (presetName === 'TOP_2D') {
          camState.desiredTheta = 0;
          camState.desiredPhi = 0.06; // Nearly vertical top-down
          camState.desiredRadius = 38;
          camState.cinematicRotate = false;
        } else if (presetName === 'ISO_3D') {
          camState.desiredTheta = 0;
          camState.desiredPhi = Math.PI / 3.1;
          camState.desiredRadius = 35;
          camState.cinematicRotate = false;
        } else if (presetName === 'CINEMATIC') {
          camState.desiredPhi = Math.PI / 3.4;
          camState.desiredRadius = 32;
          camState.cinematicRotate = true;
        }
      },

      focusOnCell: (row, col) => {
        const { x, z } = cellToWorld(row, col);
        camState.DesiredTarget.set(x, 0, z);
      },

      resetCameraCenter: () => {
        camState.DesiredTarget.set(0, 0, 0);
      },

      zoomDelta: (delta) => {
        camState.desiredRadius = Math.max(12, Math.min(58, camState.desiredRadius + delta));
      },
    };

    // Sync any existing moves when scene initializes
    if (moves.length > 0) {
      moves.forEach((m) => {
        sceneApiRef.current.spawnPiece3D(m.row, m.col, m.player, false);
      });
    }

    // 8. Raycasting & Pointer / Orbit / Pan Event Handlers
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();

    const getIntersectedCell = (clientX, clientY) => {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);

      const hits = raycaster.intersectObject(raycastPlane);
      if (hits.length > 0) {
        const pt = hits[0].point;
        const col = Math.floor((pt.x + halfSpan) / cellSize);
        const row = Math.floor((pt.z + halfSpan) / cellSize);
        if (row >= 0 && row < BOARD_SIZE && col >= 0 && col < BOARD_SIZE) {
          return { row, col };
        }
      }
      return null;
    };

    let lastHoveredKey = '';

    const onPointerDown = (e) => {
      camState.isDragging = true;
      camState.isPanning = e.button === 2 || e.shiftKey;
      camState.dragStartX = e.clientX;
      camState.dragStartY = e.clientY;
      camState.pointerMovedDist = 0;
    };

    const onPointerMove = (e) => {
      if (camState.isDragging) {
        const dx = e.clientX - camState.dragStartX;
        const dy = e.clientY - camState.dragStartY;
        camState.pointerMovedDist += Math.hypot(dx, dy);
        camState.dragStartX = e.clientX;
        camState.dragStartY = e.clientY;

        if (camState.isPanning) {
          // Pan target across board
          const panSpeed = 0.035;
          const forward = new THREE.Vector3(Math.sin(camState.theta), 0, Math.cos(camState.theta));
          const right = new THREE.Vector3(Math.cos(camState.theta), 0, -Math.sin(camState.theta));
          camState.DesiredTarget.addScaledVector(right, -dx * panSpeed);
          camState.DesiredTarget.addScaledVector(forward, -dy * panSpeed);
          camState.DesiredTarget.x = Math.max(-14, Math.min(14, camState.DesiredTarget.x));
          camState.DesiredTarget.z = Math.max(-14, Math.min(14, camState.DesiredTarget.z));
        } else {
          // Orbit camera
          camState.desiredTheta -= dx * 0.0065;
          camState.desiredPhi = Math.max(0.08, Math.min(Math.PI / 2.25, camState.desiredPhi - dy * 0.0065));
        }
        return;
      }

      // Hover cell raycasting
      const cell = getIntersectedCell(e.clientX, e.clientY);
      if (cell) {
        const { x, z } = cellToWorld(cell.row, cell.col);
        hoverGroup.position.set(x, 0, z);
        hoverGroup.visible = true;

        const key = `${cell.row}-${cell.col}`;
        if (key !== lastHoveredKey) {
          lastHoveredKey = key;
          setHoveredCell(cell);
        }
      } else {
        hoverGroup.visible = false;
        setHoveredCell(null);
      }
    };

    const onPointerUp = (e) => {
      const wasClick = camState.pointerMovedDist < 7 && e.button === 0 && !e.shiftKey;
      camState.isDragging = false;

      if (wasClick) {
        const cell = getIntersectedCell(e.clientX, e.clientY);
        if (cell) {
          executeMoveRef.current(cell.row, cell.col);
        }
      }
    };

    const onWheel = (e) => {
      e.preventDefault();
      camState.desiredRadius = Math.max(12, Math.min(58, camState.desiredRadius + e.deltaY * 0.025));
    };

    const onContextMenu = (e) => e.preventDefault();

    const domElem = renderer.domElement;
    domElem.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    domElem.addEventListener('wheel', onWheel, { passive: false });
    domElem.addEventListener('contextmenu', onContextMenu);

    // 9. Main 60FPS Render & Physics Animation Loop
    let reqId;
    const clock = new THREE.Clock();

    const animate = () => {
      reqId = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();

      if (camState.cinematicRotate && !camState.isDragging) {
        camState.desiredTheta += 0.003;
      }

      // Smooth Camera Interpolation
      camState.theta += (camState.desiredTheta - camState.theta) * 0.1;
      camState.phi += (camState.desiredPhi - camState.phi) * 0.1;
      camState.radius += (camState.desiredRadius - camState.radius) * 0.12;
      camState.target.lerp(camState.DesiredTarget, 0.12);

      camera.position.x = camState.target.x + camState.radius * Math.sin(camState.phi) * Math.sin(camState.theta);
      camera.position.y = camState.target.y + camState.radius * Math.cos(camState.phi);
      camera.position.z = camState.target.z + camState.radius * Math.sin(camState.phi) * Math.cos(camState.theta);
      camera.lookAt(camState.target);

      // Animate Hover Indicator Pulse
      if (hoverGroup.visible) {
        const scale = 1 + Math.sin(elapsed * 6) * 0.08;
        hoverRing.scale.set(scale, scale, 1);
      }

      // Animate Last Move Beacon
      if (lastMoveBeacon.visible) {
        const bScale = 1 + Math.sin(elapsed * 5) * 0.14;
        beaconRing.scale.set(bScale, bScale, 1);
        beaconPillar.rotation.y = elapsed * 1.5;
      }

      // Animate Piece Drop + Elastic Bounce + Rotating Cores
      piecesGroup.children.forEach((piece) => {
        if (piece.userData.core) {
          piece.userData.core.rotation.y = elapsed * 2.4;
          piece.userData.core.rotation.x = elapsed * 1.6;
          piece.userData.core.position.y = 0.38 + Math.sin(elapsed * 3.5 + piece.position.x) * 0.05;
        }
      });

      for (let i = animatedPieces.length - 1; i >= 0; i--) {
        const item = animatedPieces[i];
        item.progress += 0.055;

        if (item.progress >= 1) {
          item.mesh.position.y = 0;
          if (!item.landedEffectTriggered) {
            triggerLandingEffects(item.x, item.z, item.colorHex);
            item.landedEffectTriggered = true;
          }
          animatedPieces.splice(i, 1);
        } else {
          // Elastic bounce curve
          const t = item.progress;
          const bounce = Math.abs(Math.sin(t * Math.PI * 2.5)) * (1 - t) * 0.85;
          const fall = (1 - Math.min(1, t * 1.85)) * 4.5;
          item.mesh.position.y = fall + bounce;

          if (t >= 0.52 && !item.landedEffectTriggered) {
            triggerLandingEffects(item.x, item.z, item.colorHex);
            item.landedEffectTriggered = true;
          }
        }
      }

      // Animate Shockwave Rings
      for (let i = shockwaves.length - 1; i >= 0; i--) {
        const sw = shockwaves[i];
        sw.progress += 0.04;
        if (sw.progress >= 1) {
          effectsGroup.remove(sw.mesh);
          shockwaves.splice(i, 1);
        } else {
          const s = 1 + sw.progress * sw.maxScale;
          sw.mesh.scale.set(s, s, 1);
          sw.mesh.material.opacity = (1 - sw.progress) * 0.9;
        }
      }

      // Animate 3D Particle Sparks
      for (let i = particleBursts.length - 1; i >= 0; i--) {
        const pb = particleBursts[i];
        pb.progress += 0.032;
        if (pb.progress >= 1) {
          effectsGroup.remove(pb.points);
          particleBursts.splice(i, 1);
        } else {
          const posAttr = pb.points.geometry.attributes.position;
          for (let j = 0; j < pb.velocities.length; j++) {
            const v = pb.velocities[j];
            posAttr.array[j * 3] += v.vx;
            posAttr.array[j * 3 + 1] += v.vy;
            posAttr.array[j * 3 + 2] += v.vz;
            v.vy -= 0.0045; // gravity
          }
          posAttr.needsUpdate = true;
          pb.points.material.opacity = 1 - pb.progress;
        }
      }

      // Gently Float Ambient Cyber Dust
      ambientParticles.rotation.y = elapsed * 0.025;

      renderer.render(scene, camera);
    };

    animate();

    // Responsive Resize Handler
    const handleResize = () => {
      if (!container) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(reqId);
      window.removeEventListener('resize', handleResize);
      domElem.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      domElem.removeEventListener('wheel', onWheel);
      domElem.removeEventListener('contextmenu', onContextMenu);
      renderer.dispose();
    };
  }, [threeReady]);

  // Update Hover Highlight Color to match current player's Neon theme
  const switchCameraPreset = (preset) => {
    setCameraPreset(preset);
    if (sceneApiRef.current) {
      sceneApiRef.current.setCameraPresetView(preset);
    }
  };

  const toggleMute = () => {
    const next = !isMuted;
    setIsMuted(next);
    soundEngine.muted = next;
  };

  const handleSendChat = (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    const senderLabel = gameMode === 'LAN_WIFI' ? (lanRole === 'HOST' ? 'Chủ Phòng (X)' : 'Khách (O)') : playerNames[currentPlayer];
    const msgObj = {
      id: Date.now(),
      sender: senderLabel,
      text: chatInput.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setChatMessages((prev) => [...prev, msgObj]);
    sendLanPacket({ type: 'CHAT', sender: senderLabel, text: chatInput.trim() });
    setChatInput('');
  };

  const triggerQuickEmoji = (emoji) => {
    const senderLabel = gameMode === 'LAN_WIFI' ? (lanRole === 'HOST' ? 'X' : 'O') : currentPlayer;
    setFloatingEmoji({ emoji, sender: senderLabel, id: Date.now() });
    sendLanPacket({ type: 'EMOJI', emoji, sender: senderLabel });
    soundEngine.playHover();
  };

  const copyArchCode = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedFile(true);
    setTimeout(() => setCopiedFile(false), 1800);
  };

  return (
    <div className="relative w-full h-screen bg-[#050711] text-slate-100 overflow-hidden select-none font-sans flex flex-col">
      {/* ==================== TOP CYBERPUNK HUD NAVBAR ==================== */}
      <header className="relative z-20 flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 bg-slate-950/80 backdrop-blur-xl border-b border-cyan-500/30 shadow-[0_0_25px_rgba(0,243,255,0.12)]">
        {/* Brand Title */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-fuchsia-600 p-0.5 shadow-[0_0_15px_rgba(0,243,255,0.5)]">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-cyan-400 animate-pulse" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-black tracking-wider bg-gradient-to-r from-cyan-400 via-sky-200 to-fuchsia-400 bg-clip-text text-transparent">
                CYBERCARO 3D
              </h1>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-400/40">
                30x30 PRO
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              Next.js + Three.js • 5 Chấm Liên Tiếp • Lưu LocalStorage Tự Động
            </p>
          </div>
        </div>

        {/* Game Mode Selector Pills */}
        <div className="flex items-center bg-slate-900/90 p-1 rounded-xl border border-slate-700/80">
          <button
            onClick={() => {
              setGameMode('LOCAL_2P');
              resetBoard(true);
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              gameMode === 'LOCAL_2P'
                ? 'bg-cyan-500 text-slate-950 shadow-[0_0_12px_rgba(0,243,255,0.6)]'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>1 Máy 2 Người</span>
          </button>

          <button
            onClick={() => {
              setShowLanModal(true);
              if (!lanRoomCode) createLanRoom();
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              gameMode === 'LAN_WIFI'
                ? 'bg-fuchsia-500 text-white shadow-[0_0_12px_rgba(255,0,127,0.6)]'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <Wifi className="w-3.5 h-3.5" />
            <span>Mạng LAN / Wi-Fi</span>
            {lanStatus === 'CONNECTED' && (
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            )}
          </button>

          <button
            onClick={() => {
              setGameMode('AI_BOT');
              resetBoard(true);
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              gameMode === 'AI_BOT'
                ? 'bg-amber-400 text-slate-950 shadow-[0_0_12px_rgba(251,191,36,0.6)]'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>Đấu AI CyberBot</span>
          </button>
        </div>

        {/* Right Controls: Camera Presets, Next.js Folder Structure & Sound */}
        <div className="flex items-center gap-2">
          <div className="hidden md:flex items-center bg-slate-900/90 p-1 rounded-xl border border-slate-700/70">
            <button
              onClick={() => switchCameraPreset('ISO_3D')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                cameraPreset === 'ISO_3D' ? 'bg-slate-700 text-cyan-300' : 'text-slate-400 hover:text-white'
              }`}
              title="Góc nhìn 3D Nghiêng"
            >
              3D Nghiêng
            </button>
            <button
              onClick={() => switchCameraPreset('TOP_2D')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                cameraPreset === 'TOP_2D' ? 'bg-slate-700 text-cyan-300' : 'text-slate-400 hover:text-white'
              }`}
              title="Góc nhìn từ đỉnh xuống như 2D"
            >
              2D Đỉnh
            </button>
            <button
              onClick={() => switchCameraPreset('CINEMATIC')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                cameraPreset === 'CINEMATIC' ? 'bg-slate-700 text-cyan-300' : 'text-slate-400 hover:text-white'
              }`}
              title="Camera tự xoay điện ảnh 360 độ"
            >
              Xoay 360°
            </button>
          </div>

          <button
            onClick={() => setShowArchitectureModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-400/40 text-indigo-200 text-xs font-bold transition shadow-[0_0_12px_rgba(99,102,241,0.25)]"
            title="Xem cấu trúc thư mục dự án Next.js sạch gọn"
          >
            <FolderTree className="w-4 h-4 text-indigo-300" />
            <span className="hidden sm:inline">Cấu Trúc Next.js</span>
          </button>

          <button
            onClick={toggleMute}
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 transition"
            title={isMuted ? 'Bật âm thanh' : 'Tắt âm thanh'}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
          </button>
        </div>
      </header>

      {/* ==================== MAIN WORKSPACE: 3D CANVAS + HUD OVERLAYS ==================== */}
      <div className="relative flex-1 flex overflow-hidden">
        {/* THREE.JS 30x30 3D VIEWPORT */}
        <div className="relative flex-1 h-full overflow-hidden">
          <div ref={mountRef} className="w-full h-full cursor-crosshair" />

          {/* Loading Three.js Overlay */}
          {!threeReady && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/90 z-30">
              <div className="w-12 h-12 rounded-full border-4 border-cyan-400 border-t-transparent animate-spin mb-3" />
              <p className="text-cyan-300 font-bold tracking-wider">ĐANG KHỞI TẠO ĐẤU TRƯỜNG 3D 30x30...</p>
            </div>
          )}

          {/* TOP-LEFT FLOATING SCOREBOARD & TURN HUD */}
          <div className="absolute top-3 left-3 z-10 flex flex-col gap-2.5 max-w-xs sm:max-w-md pointer-events-auto">
            {/* Dual Player Cards */}
            <div className="grid grid-cols-2 gap-2.5">
              {/* PLAYER X CARD */}
              <div
                className={`p-3 rounded-2xl backdrop-blur-md border transition-all ${
                  currentPlayer === 'X' && !winnerInfo
                    ? 'bg-cyan-950/75 border-cyan-400 shadow-[0_0_20px_rgba(0,243,255,0.35)] scale-[1.02]'
                    : 'bg-slate-900/75 border-slate-700/70 opacity-85'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-black px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-400/30">
                    QUÂN X
                  </span>
                  <span className="text-lg font-black text-cyan-400">{scoreboard.X}</span>
                </div>
                <input
                  value={playerNames.X}
                  onChange={(e) => setPlayerNames((prev) => ({ ...prev, X: e.target.value }))}
                  className="w-full bg-transparent text-xs font-bold text-white focus:outline-none border-b border-transparent focus:border-cyan-400 truncate"
                  title="Nhấn để đổi tên Người chơi X"
                />
                {currentPlayer === 'X' && !winnerInfo && (
                  <div className="mt-1.5 flex items-center gap-1 text-[11px] text-cyan-300 font-semibold">
                    <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                    <span>Đang tới lượt đánh...</span>
                  </div>
                )}
              </div>

              {/* PLAYER O CARD */}
              <div
                className={`p-3 rounded-2xl backdrop-blur-md border transition-all ${
                  currentPlayer === 'O' && !winnerInfo
                    ? 'bg-fuchsia-950/75 border-fuchsia-400 shadow-[0_0_20px_rgba(255,0,127,0.35)] scale-[1.02]'
                    : 'bg-slate-900/75 border-slate-700/70 opacity-85'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-black px-2 py-0.5 rounded bg-fuchsia-500/20 text-fuchsia-300 border border-fuchsia-400/30">
                    QUÂN O
                  </span>
                  <span className="text-lg font-black text-fuchsia-400">{scoreboard.O}</span>
                </div>
                <input
                  value={gameMode === 'AI_BOT' ? 'AI CyberBot 30x30' : playerNames.O}
                  onChange={(e) => setPlayerNames((prev) => ({ ...prev, O: e.target.value }))}
                  disabled={gameMode === 'AI_BOT'}
                  className="w-full bg-transparent text-xs font-bold text-white focus:outline-none border-b border-transparent focus:border-fuchsia-400 truncate"
                  title="Nhấn để đổi tên Người chơi O"
                />
                {currentPlayer === 'O' && !winnerInfo && (
                  <div className="mt-1.5 flex items-center gap-1 text-[11px] text-fuchsia-300 font-semibold">
                    <span className="w-2 h-2 rounded-full bg-fuchsia-400 animate-ping" />
                    <span>{gameMode === 'AI_BOT' ? 'AI đang tính toán...' : 'Đang tới lượt đánh...'}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Turn Timer & Coordinate Status Bar */}
            <div className="flex items-center justify-between gap-2 px-3.5 py-2 rounded-xl bg-slate-950/80 backdrop-blur-md border border-slate-700/80 text-xs">
              <div className="flex items-center gap-2">
                <Clock className={`w-4 h-4 ${timeLeft <= 6 ? 'text-rose-400 animate-bounce' : 'text-cyan-400'}`} />
                <span className="text-slate-400">Thời gian:</span>
                {turnTimeLimit > 0 ? (
                  <span className={`font-black text-sm ${timeLeft <= 6 ? 'text-rose-400' : 'text-white'}`}>
                    {timeLeft}s
                  </span>
                ) : (
                  <span className="text-emerald-400 font-bold">Vô hạn</span>
                )}
                <select
                  value={turnTimeLimit}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setTurnTimeLimit(val);
                    setTimeLeft(val);
                  }}
                  className="bg-slate-900 border border-slate-700 rounded px-1.5 py-0.5 text-[11px] text-slate-300 focus:outline-none"
                >
                  <option value={15}>15s</option>
                  <option value={30}>30s</option>
                  <option value={60}>60s</option>
                  <option value={0}>Tắt</option>
                </select>
              </div>

              <div className="flex items-center gap-2 border-l border-slate-800 pl-3">
                <Compass className="w-4 h-4 text-amber-400" />
                <span className="text-slate-400">Tọa độ:</span>
                <span className="font-mono font-bold text-amber-300 min-w-[36px]">
                  {hoveredCell ? formatCoord(hoveredCell.row, hoveredCell.col) : '--'}
                </span>
              </div>
            </div>

            {/* 4-in-a-row Threat Warning Banner */}
            {threatBanner && !winnerInfo && (
              <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-amber-500/20 border border-amber-400/60 text-amber-200 text-xs font-bold animate-pulse shadow-[0_0_15px_rgba(245,158,11,0.3)]">
                <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
                <span>
                  CẢNH BÁO NGUY HIỂM: Quân {threatBanner.player} vừa tạo thế sát thủ tại {threatBanner.coord}!
                </span>
              </div>
            )}

            {/* LAN Status Pill */}
            {gameMode === 'LAN_WIFI' && (
              <div className="flex items-center justify-between px-3.5 py-2 rounded-xl bg-fuchsia-950/80 border border-fuchsia-500/40 text-xs">
                <div className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${lanStatus === 'CONNECTED' ? 'bg-emerald-400' : 'bg-amber-400 animate-ping'}`} />
                  <span className="font-bold text-fuchsia-200">
                    Phòng LAN: <span className="font-mono text-white">{lanRoomCode || 'Chưa tạo'}</span>
                  </span>
                  <span className="text-[11px] px-1.5 py-0.5 rounded bg-fuchsia-500/30 text-fuchsia-200">
                    Bạn là: {lanRole === 'HOST' ? 'Chủ Phòng (X)' : 'Khách (O)'}
                  </span>
                </div>
                <button
                  onClick={() => setShowLanModal(true)}
                  className="text-cyan-300 hover:underline font-semibold ml-2"
                >
                  Cấu hình
                </button>
              </div>
            )}
          </div>

          {/* FLOATING EMOJI REACTION POPUP */}
          {floatingEmoji && (
            <div
              key={floatingEmoji.id}
              className="absolute top-24 right-8 z-30 flex items-center gap-2 px-4 py-2 rounded-2xl bg-slate-900/90 border border-cyan-400/50 shadow-2xl animate-bounce"
            >
              <span className="text-3xl">{floatingEmoji.emoji}</span>
              <span className="text-xs font-bold text-cyan-300">Từ {floatingEmoji.sender}</span>
            </div>
          )}

          {/* REPLAY MODE BANNER */}
          {replayState && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-3 px-5 py-2.5 rounded-2xl bg-indigo-950/90 border border-indigo-400 shadow-[0_0_25px_rgba(99,102,241,0.5)]">
              <Play className="w-4 h-4 text-indigo-300 animate-pulse" />
              <span className="text-xs font-bold text-white">
                Đang phát lại trận đấu ({replayState.stepIndex}/{replayState.match.moves.length} nước)
              </span>
              <button
                onClick={() => setReplayState((prev) => (prev ? { ...prev, playing: !prev.playing } : null))}
                className="px-2.5 py-1 rounded-lg bg-indigo-500 text-white text-xs font-bold"
              >
                {replayState.playing ? 'Tạm dừng' : 'Tiếp tục'}
              </button>
              <button
                onClick={exitReplayMode}
                className="px-2.5 py-1 rounded-lg bg-rose-500/80 text-white text-xs font-bold"
              >
                Thoát Replay
              </button>
            </div>
          )}

          {/* VICTORY / GAME OVER MODAL OVERLAY */}
          {winnerInfo && (
            <div className="absolute inset-x-0 top-1/4 z-30 flex justify-center pointer-events-auto px-4">
              <div className="max-w-md w-full p-6 rounded-3xl bg-slate-950/90 backdrop-blur-xl border-2 border-cyan-400/70 shadow-[0_0_50px_rgba(0,243,255,0.4)] text-center animate-in fade-in zoom-in-95 duration-300">
                <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-gradient-to-br from-amber-400 to-fuchsia-600 flex items-center justify-center shadow-[0_0_25px_rgba(251,191,36,0.6)]">
                  <Trophy className="w-9 h-9 text-slate-950" />
                </div>
                <h2 className="text-2xl font-black tracking-wide bg-gradient-to-r from-amber-300 via-cyan-300 to-fuchsia-400 bg-clip-text text-transparent">
                  {winnerInfo.winner === 'DRAW'
                    ? 'TRẬN ĐẤU HÒA CỜ!'
                    : `CHIẾN THẮNG: ${playerNames[winnerInfo.winner]} (${winnerInfo.winner})!`}
                </h2>
                <p className="text-xs text-slate-300 mt-1.5">
                  Kết thúc bởi: <span className="font-bold text-cyan-300">{winnerInfo.directionName}</span> • Tổng số nước: <span className="font-bold text-amber-300">{moves.length}</span>
                </p>

                <div className="flex items-center justify-center gap-3 mt-5">
                  <button
                    onClick={() => resetBoard(false)}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-xs shadow-[0_0_20px_rgba(0,243,255,0.5)] transition"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>Chơi Ván Mới</span>
                  </button>
                  <button
                    onClick={() => setWinnerInfo(null)}
                    className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-600 transition"
                  >
                    Xem Bàn Cờ 3D
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* BOTTOM CENTER ACTION DOCK (UNDO, NEW GAME, SURRENDER, CAMERA HELPERS) */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex flex-wrap items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-slate-950/85 backdrop-blur-xl border border-slate-700/80 shadow-[0_10px_35px_rgba(0,0,0,0.75)]">
            <button
              onClick={() => performUndo(false)}
              disabled={moves.length === 0 || !!winnerInfo}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-40 border border-slate-700 text-xs font-bold text-cyan-300 transition"
              title="Xin đi lại nước vừa đánh"
            >
              <Undo2 className="w-4 h-4" />
              <span>Đi Lại</span>
            </button>

            <button
              onClick={() => resetBoard(false)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-sky-500 hover:from-cyan-400 hover:to-sky-400 text-slate-950 text-xs font-black shadow-[0_0_15px_rgba(0,243,255,0.4)] transition"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Ván Mới</span>
            </button>

            <button
              onClick={() => handleSurrender(currentPlayer, false)}
              disabled={moves.length === 0 || !!winnerInfo}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 disabled:opacity-40 border border-rose-500/40 text-xs font-bold text-rose-300 transition"
            >
              <Flag className="w-4 h-4" />
              <span>Đầu Hàng</span>
            </button>

            <div className="h-5 w-px bg-slate-800 mx-1 hidden sm:block" />

            <button
              onClick={() => {
                if (moves.length > 0 && sceneApiRef.current) {
                  const last = moves[moves.length - 1];
                  sceneApiRef.current.focusOnCell(last.row, last.col);
                } else if (sceneApiRef.current) {
                  sceneApiRef.current.resetCameraCenter();
                }
              }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-amber-300 transition"
              title="Đưa tâm camera tới nước cờ cuối cùng"
            >
              <Eye className="w-4 h-4" />
              <span className="hidden sm:inline">Tâm Nước Cuối</span>
            </button>

            <button
              onClick={() => sceneApiRef.current?.resetCameraCenter()}
              className="px-2.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs text-slate-300 transition"
              title="Reset góc nhìn về chính giữa bàn cờ 30x30"
            >
              Giữa Bàn
            </button>
          </div>

          {/* BOTTOM-LEFT 3D CONTROLS HINT */}
          <div className="hidden lg:flex absolute bottom-4 left-4 z-10 items-center gap-3 px-3 py-1.5 rounded-xl bg-slate-950/75 border border-slate-800 text-[11px] text-slate-400">
            <span>🖱️ Chuột trái: Đánh cờ / Kéo xoay 3D</span>
            <span>•</span>
            <span>🖱️ Chuột phải / Shift: Kéo trượt bàn</span>
            <span>•</span>
            <span>🔍 Con lăn: Phóng to / Thu nhỏ</span>
          </div>
        </div>

        {/* ==================== RIGHT SIDEBAR: MOVES, HISTORY & LAN CHAT ==================== */}
        <aside className="w-80 xl:w-96 bg-slate-950/95 border-l border-slate-800/90 flex flex-col z-20 shrink-0 hidden md:flex">
          {/* Sidebar Navigation Tabs */}
          <div className="grid grid-cols-3 p-2 gap-1 bg-slate-900/70 border-b border-slate-800">
            <button
              onClick={() => setActiveTab('MOVES')}
              className={`flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition ${
                activeTab === 'MOVES'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Nước Đi ({moves.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('HISTORY')}
              className={`flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition ${
                activeTab === 'HISTORY'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>Lịch Sử ({matchHistory.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('CHAT')}
              className={`flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition ${
                activeTab === 'CHAT'
                  ? 'bg-fuchsia-500/20 text-fuchsia-300 border border-fuchsia-500/40'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Chat LAN</span>
            </button>
          </div>

          {/* TAB 1: MOVE LOG & COORDINATE TRACKER */}
          {activeTab === 'MOVES' && (
            <div className="flex-1 flex flex-col overflow-hidden p-3">
              <div className="flex items-center justify-between mb-2 px-1">
                <span className="text-xs font-bold text-slate-400">NHẬT KÝ TỌA ĐỘ 30x30</span>
                <label className="flex items-center gap-1.5 text-[11px] text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoFocusMove}
                    onChange={(e) => setAutoFocusMove(e.target.checked)}
                    className="rounded accent-cyan-400"
                  />
                  <span>Tự khóa camera</span>
                </label>
              </div>

              <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
                {moves.length === 0 ? (
                  <div className="h-48 flex flex-col items-center justify-center text-center text-slate-500 text-xs px-4">
                    <Gamepad2 className="w-8 h-8 mb-2 text-slate-700" />
                    <p>Chưa có nước cờ nào được đặt.</p>
                    <p className="text-[11px] mt-1">Nhấn trực tiếp lên mặt bàn 3D 30x30 để khai cuộc!</p>
                  </div>
                ) : (
                  [...moves].reverse().map((m, idx) => {
                    const isLatest = idx === 0;
                    return (
                      <div
                        key={m.step}
                        onClick={() => sceneApiRef.current?.focusOnCell(m.row, m.col)}
                        className={`flex items-center justify-between px-3 py-2 rounded-xl border cursor-pointer transition ${
                          isLatest
                            ? 'bg-amber-500/15 border-amber-400/50 text-amber-200'
                            : 'bg-slate-900/80 hover:bg-slate-800 border-slate-800 text-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="text-[11px] font-mono text-slate-500 w-7">#{m.step}</span>
                          <span
                            className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-black ${
                              m.player === 'X'
                                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/40'
                                : 'bg-fuchsia-500/20 text-fuchsia-300 border border-fuchsia-400/40'
                            }`}
                          >
                            {m.player}
                          </span>
                          <span className="text-xs font-semibold">
                            {m.player === 'X' ? playerNames.X : playerNames.O}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-950 text-cyan-300 border border-slate-800">
                            {m.coord}
                          </span>
                          {isLatest && <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Persistent LocalStorage Stats Summary Footer */}
              <div className="mt-3 pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                <div>
                  Chuỗi thắng:{' '}
                  <span className="text-amber-300 font-bold">
                    {scoreboard.streakCount > 0 ? `${scoreboard.streakPlayer} (${scoreboard.streakCount} trận)` : '0'}
                  </span>
                </div>
                <button
                  onClick={() => {
                    const reset = { X: 0, O: 0, draws: 0, streakPlayer: null, streakCount: 0 };
                    setScoreboard(reset);
                    localStorage.setItem(STORAGE_KEYS.SCOREBOARD, JSON.stringify(reset));
                  }}
                  className="text-[11px] text-rose-400 hover:underline"
                >
                  Reset tỷ số
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: LOCALSTORAGE MATCH HISTORY & 3D REPLAY */}
          {activeTab === 'HISTORY' && (
            <div className="flex-1 flex flex-col overflow-hidden p-3">
              <div className="flex items-center justify-between mb-2 px-1">
                <span className="text-xs font-bold text-slate-400">LỊCH SỬ ĐẤU (LOCAL STORAGE)</span>
                {matchHistory.length > 0 && (
                  <button
                    onClick={() => {
                      setMatchHistory([]);
                      localStorage.removeItem(STORAGE_KEYS.MATCH_HISTORY);
                    }}
                    className="flex items-center gap-1 text-[11px] text-rose-400 hover:underline"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Xóa hết</span>
                  </button>
                )}
              </div>

              <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                {matchHistory.length === 0 ? (
                  <div className="h-48 flex flex-col items-center justify-center text-center text-slate-500 text-xs px-4">
                    <Award className="w-8 h-8 mb-2 text-slate-700" />
                    <p>Chưa có trận đấu nào hoàn thành.</p>
                    <p className="text-[11px] mt-1">Mọi trận đấu kết thúc sẽ tự động lưu tại đây để bạn Xem lại 3D!</p>
                  </div>
                ) : (
                  matchHistory.map((item) => (
                    <div
                      key={item.id}
                      className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span
                          className={`text-xs font-black px-2 py-0.5 rounded ${
                            item.winner === 'X'
                              ? 'bg-cyan-500/20 text-cyan-300'
                              : item.winner === 'O'
                              ? 'bg-fuchsia-500/20 text-fuchsia-300'
                              : 'bg-slate-700 text-slate-300'
                          }`}
                        >
                          {item.winner === 'DRAW' ? 'HÒA CỜ' : `THẮNG: QUÂN ${item.winner}`}
                        </span>
                        <span className="text-[11px] text-slate-500">{item.date}</span>
                      </div>

                      <div className="text-xs text-slate-300 font-semibold truncate">
                        {item.playerXName} <span className="text-slate-500">vs</span> {item.playerOName}
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-slate-400">
                        <span>{item.winningDirection} • {item.totalMoves} nước</span>
                        <button
                          onClick={() => startMatchReplay(item)}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-400/30 font-bold"
                        >
                          <Play className="w-3 h-3" />
                          <span>Replay 3D</span>
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 3: LAN CHAT & QUICK EMOJI REACTIONS */}
          {activeTab === 'CHAT' && (
            <div className="flex-1 flex flex-col overflow-hidden p-3">
              {/* Quick Emoji Bar */}
              <div className="flex items-center justify-between px-2 py-1.5 mb-2 rounded-xl bg-slate-900 border border-slate-800">
                {['🔥', '😎', '⚡', '👏', '😱', '🏆'].map((emo) => (
                  <button
                    key={emo}
                    onClick={() => triggerQuickEmoji(emo)}
                    className="text-lg hover:scale-125 transition transform"
                    title="Thả biểu cảm nhanh"
                  >
                    {emo}
                  </button>
                ))}
              </div>

              <div className="flex-1 overflow-y-auto space-y-2 pr-1 mb-2">
                {chatMessages.map((msg) => (
                  <div key={msg.id} className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-xs">
                    <div className="flex items-center justify-between text-[10px] text-cyan-400 font-bold mb-0.5">
                      <span>{msg.sender}</span>
                      <span className="text-slate-500">{msg.time}</span>
                    </div>
                    <p className="text-slate-200 break-words">{msg.text}</p>
                  </div>
                ))}
              </div>

              <form onSubmit={handleSendChat} className="flex gap-1.5">
                <input
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Nhập tin nhắn phòng LAN..."
                  className="flex-1 px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-cyan-400"
                />
                <button
                  type="submit"
                  className="p-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold transition"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          )}
        </aside>
      </div>

      {/* ==================== MODAL 1: LAN / WI-FI MULTIPLAYER LOBBY ==================== */}
      {showLanModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4">
          <div className="max-w-lg w-full rounded-3xl bg-slate-950 border border-fuchsia-500/50 shadow-[0_0_50px_rgba(255,0,127,0.3)] p-6 space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-xl bg-fuchsia-500/20 border border-fuchsia-400/40 text-fuchsia-300">
                  <Wifi className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white">CHƠI QUA MẠNG LAN / WI-FI</h3>
                  <p className="text-xs text-slate-400">
                    Kết nối P2P WebRTC giữa 2 thiết bị chung Wi-Fi hoặc 2 Tab trình duyệt
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowLanModal(false)}
                className="p-1.5 rounded-lg bg-slate-900 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Option A: Host Room */}
            <div className="p-4 rounded-2xl bg-slate-900/90 border border-cyan-500/30 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-cyan-300 uppercase tracking-wider">
                  1. Tạo Phòng (Chủ Phòng - Quân X)
                </span>
                <button
                  onClick={createLanRoom}
                  className="flex items-center gap-1 text-xs font-bold text-cyan-400 hover:underline"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Tạo mã mới</span>
                </button>
              </div>

              <div className="flex items-center justify-between gap-2 p-3 rounded-xl bg-slate-950 border border-slate-800">
                <div>
                  <div className="text-[11px] text-slate-400">Mã Phòng LAN của bạn:</div>
                  <div className="text-2xl font-mono font-black tracking-widest text-white">
                    {lanRoomCode || '----'}
                  </div>
                </div>
                <button
                  onClick={() => {
                    if (lanRoomCode) navigator.clipboard.writeText(lanRoomCode);
                  }}
                  className="px-3.5 py-2 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/40 text-cyan-200 text-xs font-bold"
                >
                  Copy Mã
                </button>
              </div>

              <div className="flex items-center gap-2 text-xs text-slate-300">
                <span
                  className={`w-2.5 h-2.5 rounded-full ${
                    lanStatus === 'CONNECTED' ? 'bg-emerald-400' : 'bg-amber-400 animate-ping'
                  }`}
                />
                <span>
                  Trạng thái:{' '}
                  <strong className={lanStatus === 'CONNECTED' ? 'text-emerald-400' : 'text-amber-300'}>
                    {lanStatus === 'CONNECTED'
                      ? `Đã kết nối (${lanTransport}) - Sẵn sàng chiến!`
                      : 'Đang chờ người chơi thứ 2 nhập mã...'}
                  </strong>
                </span>
              </div>
            </div>

            {/* Option B: Join Existing Room */}
            <div className="p-4 rounded-2xl bg-slate-900/90 border border-fuchsia-500/30 space-y-3">
              <span className="text-xs font-black text-fuchsia-300 uppercase tracking-wider">
                2. Vào Phòng Của Bạn Bè (Khách - Quân O)
              </span>
              <div className="flex gap-2">
                <input
                  value={lanInputCode}
                  onChange={(e) => setLanInputCode(e.target.value.toUpperCase())}
                  placeholder="Nhập mã phòng (VD: AB12-89)"
                  className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 font-mono text-sm text-white uppercase focus:outline-none focus:border-fuchsia-400"
                />
                <button
                  onClick={() => joinLanRoom(lanInputCode)}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-fuchsia-500 to-pink-600 hover:from-fuchsia-400 hover:to-pink-500 text-white font-black text-xs shadow-[0_0_20px_rgba(255,0,127,0.4)]"
                >
                  Kết Nối Ngay
                </button>
              </div>
              <p className="text-[11px] text-slate-400">
                💡 <strong>Mẹo test nhanh:</strong> Bạn có thể mở thêm 1 Tab trình duyệt nữa hoặc dùng máy thứ 2 cùng mạng Wi-Fi, nhập mã phòng ở trên để đánh đồng bộ thời gian thực!
              </p>
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setShowLanModal(false)}
                className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200"
              >
                Đóng & Vào Bàn Cờ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== MODAL 2: CLEAN NEXT.JS FOLDER ARCHITECTURE EXPLORER ==================== */}
      {showArchitectureModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="max-w-4xl w-full h-[80vh] rounded-3xl bg-slate-950 border border-indigo-500/50 shadow-[0_0_50px_rgba(99,102,241,0.3)] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 bg-slate-900 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <FolderTree className="w-6 h-6 text-indigo-400" />
                <div>
                  <h3 className="text-base font-black text-white">
                    CẤU TRÚC THƯ MỤC DỰ ÁN NEXT.JS + THREE.JS (CHIA MODULE GỌN GÀNG)
                  </h3>
                  <p className="text-xs text-slate-400">
                    Phân tách rõ ràng `src/types`, `src/lib`, `src/hooks`, `src/components/3d`, `src/components/ui` và `server.js`
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowArchitectureModal(false)}
                className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Explorer Body */}
            <div className="flex-1 flex overflow-hidden">
              {/* Left File Tree */}
              <div className="w-64 bg-slate-900/60 border-r border-slate-800 p-3 space-y-1.5 overflow-y-auto">
                <div className="text-[11px] font-bold text-slate-400 px-2 py-1 uppercase">Danh sách Module</div>
                {NEXTJS_PROJECT_FILES.map((file) => (
                  <button
                    key={file.path}
                    onClick={() => setSelectedArchFile(file)}
                    className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-mono transition flex items-center justify-between ${
                      selectedArchFile.path === file.path
                        ? 'bg-indigo-500/25 text-indigo-200 border border-indigo-400/40 font-bold'
                        : 'text-slate-400 hover:bg-slate-800/70 hover:text-white'
                    }`}
                  >
                    <span className="truncate">{file.path}</span>
                    <ChevronRight className="w-3.5 h-3.5 shrink-0" />
                  </button>
                ))}
              </div>

              {/* Right Code Preview */}
              <div className="flex-1 flex flex-col bg-[#070a14] overflow-hidden">
                <div className="flex items-center justify-between px-5 py-3 bg-slate-900/40 border-b border-slate-800">
                  <div>
                    <span className="text-xs font-bold text-indigo-300">{selectedArchFile.title}</span>
                    <span className="ml-2 text-[11px] font-mono text-slate-500">({selectedArchFile.path})</span>
                  </div>
                  <button
                    onClick={() => copyArchCode(selectedArchFile.code)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-400/40 text-indigo-200 text-xs font-bold"
                  >
                    {copiedFile ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedFile ? 'Đã Copy' : 'Copy Code'}</span>
                  </button>
                </div>
                <pre className="flex-1 p-5 overflow-auto text-xs font-mono text-cyan-100 leading-relaxed">
                  <code>{selectedArchFile.code}</code>
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}