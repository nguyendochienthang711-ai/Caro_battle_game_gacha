'use client';

import React, { useRef, useState, useCallback, useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { useGameEngine } from '../hooks/useGameEngine';
import { useLanMultiplayer } from '../hooks/useLanMultiplayer';
import { TopNavbar } from '../components/ui/TopNavbar';
import { PlayerScoreCard } from '../components/ui/PlayerScoreCard';
import { MoveHistorySidebar } from '../components/ui/MoveHistorySidebar';
import { LanLobbyModal } from '../components/ui/LanLobbyModal';
import { CyberDashboard } from '../components/ui/CyberDashboard';
import { GachaModal } from '../components/ui/GachaModal';
import { BattleArenaModal } from '../components/ui/BattleArenaModal';
import {
  AppViewMode,
  CameraPreset,
  CellCoord,
  LanMessagePacket,
  SceneApi,
  PlayerSymbol,
  GameMode,
  RpgProfileData,
  RpgItem,
  FighterStats,
  ItemRarity,
} from '../types/game';
import {
  computeFighterStats,
  PRESET_COMPANIONS,
} from '../lib/rpgEngine';
import {
  getDefaultRpgProfile,
  loadRpgProfile,
  saveRpgProfile,
} from '../lib/storage';
import { soundEngine } from '../lib/soundEngine';
import { FolderTree, X, ChevronRight, Copy, Check } from 'lucide-react';

// Dynamic import with SSR disabled for Three.js 3D viewport
const CaroScene3D = dynamic(
  () => import('../components/3d/CaroScene3D').then((mod) => mod.CaroScene3D),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex flex-col items-center justify-center bg-slate-950">
        <div className="w-12 h-12 rounded-full border-4 border-cyan-400 border-t-transparent animate-spin mb-3" />
        <p className="text-cyan-300 font-bold tracking-wider">ĐANG TẢI ĐẤU TRƯỜNG 3D...</p>
      </div>
    ),
  }
);

const ARCHITECTURE_DOCS = [
  {
    path: 'STRUCTURE.md',
    title: 'Cấu Trúc Thư Mục Next.js 14 (Caro 3D + RPG Battle & Gacha)',
    code: `cybercaro-3d-nextjs/
├── package.json
├── next.config.mjs
├── server.js                      # Custom Node.js + Socket.IO LAN Server
└── src/
    ├── app/
    │   ├── layout.tsx             # Root Layout + Font Orbitron / Inter
    │   ├── page.tsx               # Điều phối Dashboard, Caro 3D, Gacha & Battle Arena
    │   └── globals.css            # TailwindCSS + Neon Glassmorphism styles
    ├── types/
    │   └── game.ts                # Types Bàn cờ 30x30, Vật phẩm C->SS, 6 Ô Trang bị, Battle
    ├── lib/
    │   ├── gomokuEngine.ts        # Thuật toán kiểm tra thắng 5 ô & AI CyberBot
    │   ├── rpgEngine.ts           # Kho Vũ khí/Giáp C->SS, Kỹ năng độc nhất S/SS, Vượt Ải
    │   ├── soundEngine.ts         # Bộ tổng hợp âm thanh Web Audio API
    │   └── storage.ts             # Quản lý LocalStorage (Hồ sơ RPG, Kho đồ, Lịch sử)
    ├── hooks/
    │   ├── useGameEngine.ts       # Quản lý State ván cờ, Undo, Đồng hồ đếm ngược
    │   └── useLanMultiplayer.ts   # Kết nối Tổ đội LAN/Wi-Fi (WebRTC PeerJS + BroadcastChannel)
    └── components/
        ├── 3d/
        │   ├── CaroScene3D.tsx    # Khung cảnh Three.js, Camera Orbit, Raycaster
        │   ├── Piece3D.ts         # Tạo Mesh 3D Quân X (Tinh thể Cyan) & O (Vòng Neon)
        │   └── EffectsManager.ts  # Hiệu ứng Sóng xung kích, Hạt nổ, Tia Laser thắng
        └── ui/
            ├── CyberDashboard.tsx # Trang chủ Dashboard, 6 Ô Trang bị, Mời Đồng Đội
            ├── GachaModal.tsx     # Vòng quay Vũ khí/Giáp (C -> SS) & Chỉnh tỷ lệ rơi
            ├── BattleArenaModal.tsx # Đấu trường Vượt Ải cùng Đồng đội & Solo 1vs1
            ├── TopNavbar.tsx      # Thanh điều hướng, Chế độ chơi, Camera Presets
            ├── PlayerScoreCard.tsx# Bảng tỷ số + Thưởng Vé Quay khi thắng Caro
            ├── LanLobbyModal.tsx  # Phòng chờ mạng LAN / Wi-Fi
            └── MoveHistorySidebar.tsx # Nhật ký tọa độ & Chat LAN`,
  },
];

export default function GamePage() {
  // Default to DASHBOARD when opening the web app!
  const [viewMode, setViewMode] = useState<AppViewMode>('DASHBOARD');
  const [selectedCaroMode, setSelectedCaroMode] = useState<GameMode>('AI_BOT');

  // Modals
  const [showGachaModal, setShowGachaModal] = useState<boolean>(false);
  const [showBattleModal, setShowBattleModal] = useState<boolean>(false);
  const [showLanModal, setShowLanModal] = useState<boolean>(false);
  const [showArchitectureModal, setShowArchitectureModal] = useState<boolean>(false);
  const [selectedArchFile, setSelectedArchFile] = useState(ARCHITECTURE_DOCS[0]);
  const [copiedFile, setCopiedFile] = useState<boolean>(false);

  // RPG Profile State (Tickets, Drop Rates, Inventory, 6 Slots)
  const [rpgProfile, setRpgProfile] = useState<RpgProfileData>(() => getDefaultRpgProfile());
  const [rpgLoaded, setRpgLoaded] = useState(false);
  const [onlinePeerFighter, setOnlinePeerFighter] = useState<FighterStats | null>(null);

  // 3D Scene & HUD State
  const sceneApiRef = useRef<SceneApi | null>(null);
  const [cameraPreset, setCameraPreset] = useState<CameraPreset>('ISO_3D');
  const [autoFocusMove, setAutoFocusMove] = useState<boolean>(false);
  const [hoveredCell, setHoveredCell] = useState<CellCoord | null>(null);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'MOVES' | 'HISTORY' | 'CHAT'>('MOVES');

  // Load RPG Profile on mount
  useEffect(() => {
    setRpgProfile(loadRpgProfile());
    setRpgLoaded(true);
  }, []);

  // Save RPG Profile whenever it changes
  useEffect(() => {
    if (!rpgLoaded) return;
    saveRpgProfile(rpgProfile);
  }, [rpgProfile, rpgLoaded]);

  // Handle incoming LAN packets (Caro Moves + Fighter Sync + Start Caro)
  const handleIncomingLanPacket = useCallback((packet: LanMessagePacket) => {
    if (!packet || !packet.type) return;

    switch (packet.type) {
      case 'MOVE':
        if (packet.row !== undefined && packet.col !== undefined && packet.player) {
          gameEngineRef.current?.executeMove(packet.row, packet.col, packet.player, true);
        }
        break;
      case 'RESTART':
        gameEngineRef.current?.resetBoard(true);
        break;
      case 'UNDO':
        gameEngineRef.current?.performUndo(true);
        break;
      case 'SURRENDER':
        if (packet.player) {
          gameEngineRef.current?.handleSurrender(packet.player, true);
        }
        break;
      case 'SYNC_FIGHTER':
        if (packet.fighterStats) {
          setOnlinePeerFighter(packet.fighterStats);
        }
        break;
      case 'START_CARO':
        setViewMode('CARO_GAME');
        gameEngineRef.current?.setGameMode('LAN_WIFI');
        gameEngineRef.current?.resetBoard(true);
        break;
      default:
        break;
    }
  }, []);

  const lanMultiplayer = useLanMultiplayer({
    onPacketReceived: handleIncomingLanPacket,
  });

  // Game Engine
  const gameEngine = useGameEngine({
    autoFocusMove,
    onSpawnPiece: (row, col, player, animate) => {
      sceneApiRef.current?.spawnPiece3D(row, col, player, animate);
    },
    onClearPieces: () => {
      sceneApiRef.current?.clearAllPieces();
    },
    onSyncBoard: (moves) => {
      sceneApiRef.current?.syncBoardState(moves);
    },
    onWinEffects: (line, player) => {
      sceneApiRef.current?.showWinEffects(line, player);
    },
    onFocusCell: (row, col) => {
      sceneApiRef.current?.focusOnCell(row, col);
    },
    onSendLanPacket: (packet) => {
      lanMultiplayer.sendLanPacket(packet);
    },
    onMatchWon: (winner) => {
      if (winner !== 'DRAW') {
        // Award +1 Spin Ticket when a match is won!
        setRpgProfile((prev) => ({
          ...prev,
          spinTickets: prev.spinTickets + 1,
        }));
      }
    },
  });

  const gameEngineRef = useRef(gameEngine);
  useEffect(() => {
    gameEngineRef.current = gameEngine;
  }, [gameEngine]);

  // Pause Caro turn timer whenever user is on Dashboard or modals
  useEffect(() => {
    gameEngine.setIsPaused(viewMode !== 'CARO_GAME' || showGachaModal || showBattleModal);
  }, [viewMode, showGachaModal, showBattleModal]);

  // Check URL query param `?party=CODE` on mount to auto-join friend's party
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const partyCode = params.get('party') || params.get('room');
    if (partyCode && partyCode.trim()) {
      lanMultiplayer.joinLanRoom(partyCode.trim());
    }
  }, []);

  // Compute Player's Fighter Stats from 6 free-form slots
  const playerFighterStats = useMemo(
    () =>
      computeFighterStats(
        gameEngine.playerNames.X,
        rpgProfile.equippedSlots,
        rpgProfile.inventory
      ),
    [gameEngine.playerNames.X, rpgProfile.equippedSlots, rpgProfile.inventory]
  );

  // Sync fighter stats to LAN peer when connected
  useEffect(() => {
    if (lanMultiplayer.lanStatus === 'CONNECTED') {
      lanMultiplayer.sendLanPacket({
        type: 'SYNC_FIGHTER',
        fighterStats: playerFighterStats,
      });
    }
  }, [lanMultiplayer.lanStatus, playerFighterStats, lanMultiplayer.sendLanPacket]);

  // Determine Active Teammate for Co-op Campaign
  const activeTeammate = useMemo(() => {
    if (rpgProfile.selectedCompanionId === 'online_friend' && onlinePeerFighter) {
      return {
        id: 'online_friend',
        name: onlinePeerFighter.name,
        title: 'Đồng Đội LAN Online',
        avatar: '⚡',
        isOnlinePlayer: true,
        stats: onlinePeerFighter,
      };
    }
    return (
      PRESET_COMPANIONS.find((c) => c.id === rpgProfile.selectedCompanionId) ||
      PRESET_COMPANIONS[0]
    );
  }, [rpgProfile.selectedCompanionId, onlinePeerFighter]);

  // Equipment & Gacha Handlers
  const handleItemObtained = useCallback((items: RpgItem[], ticketsSpent: number) => {
    setRpgProfile((prev) => ({
      ...prev,
      spinTickets: Math.max(0, prev.spinTickets - ticketsSpent),
      totalSpins: prev.totalSpins + ticketsSpent,
      inventory: [...items, ...prev.inventory],
    }));
  }, []);

  const handleEquipItemToSlot = useCallback((item: RpgItem, targetSlotIndex?: number) => {
    setRpgProfile((prev) => {
      const nextSlots = [...prev.equippedSlots];
      // Prevent duplicate equip of the same instanceId
      const existingIdx = nextSlots.indexOf(item.instanceId);
      if (existingIdx !== -1) return prev;

      if (typeof targetSlotIndex === 'number' && targetSlotIndex >= 0 && targetSlotIndex < 6) {
        nextSlots[targetSlotIndex] = item.instanceId;
      } else {
        const emptyIdx = nextSlots.findIndex((s) => s === null);
        if (emptyIdx !== -1) {
          nextSlots[emptyIdx] = item.instanceId;
        } else {
          // Replace slot 5 if all 6 slots are full
          nextSlots[5] = item.instanceId;
        }
      }
      soundEngine.playHover();
      return { ...prev, equippedSlots: nextSlots };
    });
  }, []);

  const handleUnequipSlot = useCallback((slotIndex: number) => {
    setRpgProfile((prev) => {
      const nextSlots = [...prev.equippedSlots];
      nextSlots[slotIndex] = null;
      soundEngine.playHover();
      return { ...prev, equippedSlots: nextSlots };
    });
  }, []);

  const handleAutoEquipBest = useCallback(() => {
    const rarityRank: Record<ItemRarity, number> = { SS: 5, S: 4, A: 3, B: 2, C: 1 };
    setRpgProfile((prev) => {
      const sorted = [...prev.inventory].sort(
        (a, b) =>
          rarityRank[b.rarity] - rarityRank[a.rarity] ||
          b.atk * 2 + b.def * 2 + b.hpBonus * 0.2 - (a.atk * 2 + a.def * 2 + a.hpBonus * 0.2)
      );
      const bestSix: (string | null)[] = [null, null, null, null, null, null];
      for (let i = 0; i < Math.min(6, sorted.length); i++) {
        bestSix[i] = sorted[i].instanceId;
      }
      soundEngine.playWinFanfare();
      return { ...prev, equippedSlots: bestSix };
    });
  }, []);

  const handleStageCleared = useCallback((stageId: number, rewardSpins: number) => {
    setRpgProfile((prev) => ({
      ...prev,
      spinTickets: prev.spinTickets + rewardSpins,
      clearedStageIds:
        stageId > 0 && !prev.clearedStageIds.includes(stageId)
          ? [...prev.clearedStageIds, stageId]
          : prev.clearedStageIds,
    }));
  }, []);

  // Launch Caro Game from Dashboard
  const handleStartCaroFromDashboard = (mode: GameMode = selectedCaroMode) => {
    gameEngine.setGameMode(mode);
    gameEngine.resetBoard(false);
    setViewMode('CARO_GAME');

    if (mode === 'LAN_WIFI') {
      if (!lanMultiplayer.lanRoomCode) {
        lanMultiplayer.createLanRoom();
      } else {
        lanMultiplayer.sendLanPacket({ type: 'START_CARO' });
      }
    }
  };

  // Cell click handler inside Caro 3D
  const handleCellClick = useCallback(
    (row: number, col: number) => {
      if (gameEngine.gameMode === 'LAN_WIFI' && lanMultiplayer.lanStatus === 'CONNECTED') {
        const mySymbol: PlayerSymbol = lanMultiplayer.lanRole === 'HOST' ? 'X' : 'O';
        if (gameEngine.currentPlayer !== mySymbol) {
          soundEngine.playTick();
          return;
        }
      }
      gameEngine.executeMove(row, col);
    },
    [gameEngine, lanMultiplayer.lanStatus, lanMultiplayer.lanRole]
  );

  const handleSelectCameraPreset = (preset: CameraPreset) => {
    setCameraPreset(preset);
    sceneApiRef.current?.setCameraPresetView(preset);
  };

  const handleToggleMute = () => {
    const next = !isMuted;
    setIsMuted(next);
    soundEngine.muted = next;
  };

  const handleCopyArchCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedFile(true);
    setTimeout(() => setCopiedFile(false), 1800);
  };

  return (
    <div className="relative w-full h-screen bg-[#050711] text-slate-100 overflow-hidden select-none font-sans flex flex-col">
      {/* ==================== VIEW 1: MAIN DASHBOARD ==================== */}
      {viewMode === 'DASHBOARD' ? (
        <CyberDashboard
          playerName={gameEngine.playerNames.X}
          onChangePlayerName={(name) =>
            gameEngine.setPlayerNames((prev) => ({ ...prev, X: name }))
          }
          playerStats={playerFighterStats}
          spinTickets={rpgProfile.spinTickets}
          inventory={rpgProfile.inventory}
          equippedSlots={rpgProfile.equippedSlots}
          onEquipItemToSlot={handleEquipItemToSlot}
          onUnequipSlot={handleUnequipSlot}
          onAutoEquipBest={handleAutoEquipBest}
          selectedCompanionId={rpgProfile.selectedCompanionId}
          onSelectCompanion={(id) =>
            setRpgProfile((prev) => ({ ...prev, selectedCompanionId: id }))
          }
          activeTeammate={activeTeammate}
          clearedStagesCount={rpgProfile.clearedStageIds.length}
          scoreboard={gameEngine.scoreboard}
          selectedCaroMode={selectedCaroMode}
          onSelectCaroMode={setSelectedCaroMode}
          onStartCaroGame={handleStartCaroFromDashboard}
          onOpenGachaModal={() => setShowGachaModal(true)}
          onOpenBattleArena={() => setShowBattleModal(true)}
          lanRoomCode={lanMultiplayer.lanRoomCode}
          lanStatus={lanMultiplayer.lanStatus}
          lanTransport={lanMultiplayer.lanTransport}
          onCreatePartyRoom={lanMultiplayer.createLanRoom}
          onJoinPartyRoom={(code) => lanMultiplayer.joinLanRoom(code)}
          onlinePeerFighter={onlinePeerFighter}
        />
      ) : (
        /* ==================== VIEW 2: CARO 3D 30x30 ARENA ==================== */
        <>
          <TopNavbar
            gameMode={gameEngine.gameMode}
            onSelectMode={(mode) => {
              gameEngine.setGameMode(mode);
              gameEngine.resetBoard(true);
            }}
            cameraPreset={cameraPreset}
            onSelectCameraPreset={handleSelectCameraPreset}
            isMuted={isMuted}
            onToggleMute={handleToggleMute}
            onOpenLanModal={() => {
              setShowLanModal(true);
              if (!lanMultiplayer.lanRoomCode) lanMultiplayer.createLanRoom();
            }}
            onOpenArchitectureModal={() => setShowArchitectureModal(true)}
            lanStatus={lanMultiplayer.lanStatus}
            onBackToDashboard={() => setViewMode('DASHBOARD')}
            spinTickets={rpgProfile.spinTickets}
            onOpenGachaModal={() => setShowGachaModal(true)}
            onOpenBattleArena={() => setShowBattleModal(true)}
          />

          <div className="relative flex-1 flex overflow-hidden">
            <div className="relative flex-1 h-full overflow-hidden">
              <CaroScene3D
                ref={sceneApiRef}
                sceneRef={sceneApiRef}
                cameraPreset={cameraPreset}
                currentPlayer={gameEngine.currentPlayer}
                moves={gameEngine.moves}
                onCellClick={handleCellClick}
                onCellHover={setHoveredCell}
              />

              <PlayerScoreCard
                currentPlayer={gameEngine.currentPlayer}
                winnerInfo={gameEngine.winnerInfo}
                setWinnerInfo={gameEngine.setWinnerInfo}
                scoreboard={gameEngine.scoreboard}
                playerNames={gameEngine.playerNames}
                setPlayerNames={gameEngine.setPlayerNames}
                gameMode={gameEngine.gameMode}
                timeLeft={gameEngine.timeLeft}
                turnTimeLimit={gameEngine.turnTimeLimit}
                setTurnTimeLimit={gameEngine.setTurnTimeLimit}
                hoveredCell={hoveredCell}
                threatBanner={gameEngine.threatBanner}
                lanStatus={lanMultiplayer.lanStatus}
                lanRoomCode={lanMultiplayer.lanRoomCode}
                lanRole={lanMultiplayer.lanRole}
                onOpenLanModal={() => setShowLanModal(true)}
                floatingEmoji={lanMultiplayer.floatingEmoji}
                replayState={gameEngine.replayState}
                setReplayState={gameEngine.setReplayState}
                onExitReplay={gameEngine.exitReplayMode}
                movesCount={gameEngine.moves.length}
                onUndo={() => gameEngine.performUndo(false)}
                onReset={() => gameEngine.resetBoard(false)}
                onSurrender={() =>
                  gameEngine.handleSurrender(gameEngine.currentPlayer, false)
                }
                onFocusLastMove={() => {
                  if (gameEngine.moves.length > 0 && sceneApiRef.current) {
                    const last = gameEngine.moves[gameEngine.moves.length - 1];
                    sceneApiRef.current.focusOnCell(last.row, last.col);
                  } else if (sceneApiRef.current) {
                    sceneApiRef.current.resetCameraCenter();
                  }
                }}
                onResetCameraCenter={() => sceneApiRef.current?.resetCameraCenter()}
                onOpenGacha={() => setShowGachaModal(true)}
                onBackToDashboard={() => setViewMode('DASHBOARD')}
              />
            </div>

            <MoveHistorySidebar
              moves={gameEngine.moves}
              matchHistory={gameEngine.matchHistory}
              chatMessages={lanMultiplayer.chatMessages}
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              autoFocusMove={autoFocusMove}
              setAutoFocusMove={setAutoFocusMove}
              playerNames={gameEngine.playerNames}
              scoreboard={gameEngine.scoreboard}
              onResetScoreboard={() => {
                const reset = {
                  X: 0,
                  O: 0,
                  draws: 0,
                  streakPlayer: null,
                  streakCount: 0,
                };
                gameEngine.setScoreboard(reset);
              }}
              onClearHistory={() => gameEngine.setMatchHistory([])}
              onStartReplay={gameEngine.startMatchReplay}
              onFocusCell={(r, c) => sceneApiRef.current?.focusOnCell(r, c)}
              onSendChat={(text) => {
                const senderLabel =
                  gameEngine.gameMode === 'LAN_WIFI'
                    ? lanMultiplayer.lanRole === 'HOST'
                      ? 'Chủ Phòng (X)'
                      : 'Khách (O)'
                    : gameEngine.playerNames[gameEngine.currentPlayer];
                lanMultiplayer.sendChat(text, senderLabel);
              }}
              onSendEmoji={(emoji) => {
                const senderLabel =
                  gameEngine.gameMode === 'LAN_WIFI'
                    ? lanMultiplayer.lanRole === 'HOST'
                      ? 'X'
                      : 'O'
                    : gameEngine.currentPlayer;
                lanMultiplayer.sendEmoji(emoji, senderLabel);
                soundEngine.playHover();
              }}
              onUndo={() => gameEngine.performUndo(false)}
            />
          </div>
        </>
      )}

      {/* ==================== GLOBAL MODALS (GACHA, BATTLE ARENA, LAN LOBBY, ARCHITECTURE) ==================== */}
      <GachaModal
        isOpen={showGachaModal}
        onClose={() => setShowGachaModal(false)}
        spinTickets={rpgProfile.spinTickets}
        dropRates={rpgProfile.dropRates}
        onUpdateDropRates={(rates) =>
          setRpgProfile((prev) => ({ ...prev, dropRates: rates }))
        }
        onItemObtained={handleItemObtained}
        onAutoEquipItem={(item) => handleEquipItemToSlot(item)}
        onGoToCaro={() => handleStartCaroFromDashboard('AI_BOT')}
        onAddFreeTestTicket={() =>
          setRpgProfile((prev) => ({ ...prev, spinTickets: prev.spinTickets + 1 }))
        }
      />

      <BattleArenaModal
        isOpen={showBattleModal}
        onClose={() => setShowBattleModal(false)}
        playerStats={playerFighterStats}
        activeTeammate={activeTeammate}
        onlineOpponentStats={onlinePeerFighter}
        clearedStageIds={rpgProfile.clearedStageIds}
        onStageCleared={handleStageCleared}
        onOpenGacha={() => setShowGachaModal(true)}
      />

      <LanLobbyModal
        isOpen={showLanModal}
        onClose={() => setShowLanModal(false)}
        roomCode={lanMultiplayer.lanRoomCode}
        status={lanMultiplayer.lanStatus}
        transport={lanMultiplayer.lanTransport}
        onCreateRoom={lanMultiplayer.createLanRoom}
        onJoinRoom={(code) => lanMultiplayer.joinLanRoom(code)}
      />

      {showArchitectureModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="max-w-4xl w-full h-[80vh] rounded-3xl bg-slate-950 border border-indigo-500/50 shadow-[0_0_50px_rgba(99,102,241,0.3)] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 bg-slate-900 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <FolderTree className="w-6 h-6 text-indigo-400" />
                <div>
                  <h3 className="text-base font-black text-white">
                    CẤU TRÚC THƯ MỤC DỰ ÁN NEXT.JS + THREE.JS
                  </h3>
                  <p className="text-xs text-slate-400">
                    Tích hợp Dashboard, Caro 3D 30x30, Vòng Quay Vũ Khí/Giáp C-SS & Đấu Trường Battle
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

            <div className="flex-1 flex overflow-hidden">
              <div className="w-64 bg-slate-900/60 border-r border-slate-800 p-3 space-y-1.5 overflow-y-auto">
                {ARCHITECTURE_DOCS.map((file) => (
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

              <div className="flex-1 flex flex-col bg-[#070a14] overflow-hidden">
                <div className="flex items-center justify-between px-5 py-3 bg-slate-900/40 border-b border-slate-800">
                  <div>
                    <span className="text-xs font-bold text-indigo-300">
                      {selectedArchFile.title}
                    </span>
                    <span className="ml-2 text-[11px] font-mono text-slate-500">
                      ({selectedArchFile.path})
                    </span>
                  </div>
                  <button
                    onClick={() => handleCopyArchCode(selectedArchFile.code)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-400/40 text-indigo-200 text-xs font-bold"
                  >
                    {copiedFile ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
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
