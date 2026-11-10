'use client';

import React from 'react';
import {
  Clock,
  Compass,
  ShieldAlert,
  Play,
  Trophy,
  RotateCcw,
  Undo2,
  Flag,
  Eye,
  Gift,
  Home,
} from 'lucide-react';
import {
  PlayerSymbol,
  WinnerInfo,
  ScoreboardData,
  GameMode,
  CellCoord,
  ThreatBannerInfo,
  FloatingEmoji,
  ReplayState,
  formatCoord,
} from '../../types/game';

interface PlayerScoreCardProps {
  currentPlayer: PlayerSymbol;
  winnerInfo: WinnerInfo | null;
  setWinnerInfo: (info: WinnerInfo | null) => void;
  scoreboard: ScoreboardData;
  playerNames: { X: string; O: string };
  setPlayerNames: React.Dispatch<React.SetStateAction<{ X: string; O: string }>>;
  gameMode: GameMode;
  timeLeft: number;
  turnTimeLimit: number;
  setTurnTimeLimit: (val: number) => void;
  hoveredCell: CellCoord | null;
  threatBanner: ThreatBannerInfo | null;
  lanStatus?: 'DISCONNECTED' | 'WAITING' | 'CONNECTED';
  lanRoomCode?: string;
  lanRole?: 'HOST' | 'GUEST';
  onOpenLanModal?: () => void;
  floatingEmoji?: FloatingEmoji | null;
  replayState?: ReplayState | null;
  setReplayState?: React.Dispatch<React.SetStateAction<ReplayState | null>>;
  onExitReplay?: () => void;
  movesCount: number;
  onUndo: () => void;
  onReset: () => void;
  onSurrender: () => void;
  onFocusLastMove: () => void;
  onResetCameraCenter: () => void;
  onOpenGacha?: () => void;
  onBackToDashboard?: () => void;
}

export const PlayerScoreCard: React.FC<PlayerScoreCardProps> = ({
  currentPlayer,
  winnerInfo,
  setWinnerInfo,
  scoreboard,
  playerNames,
  setPlayerNames,
  gameMode,
  timeLeft,
  turnTimeLimit,
  setTurnTimeLimit,
  hoveredCell,
  threatBanner,
  lanStatus,
  lanRoomCode,
  lanRole,
  onOpenLanModal,
  floatingEmoji,
  replayState,
  setReplayState,
  onExitReplay,
  movesCount,
  onUndo,
  onReset,
  onSurrender,
  onFocusLastMove,
  onResetCameraCenter,
  onOpenGacha,
  onBackToDashboard,
}) => {
  return (
    <>
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
            <Clock
              className={`w-4 h-4 ${timeLeft <= 6 ? 'text-rose-400 animate-bounce' : 'text-cyan-400'}`}
            />
            <span className="text-slate-400">Thời gian:</span>
            {turnTimeLimit > 0 ? (
              <span
                className={`font-black text-sm ${timeLeft <= 6 ? 'text-rose-400' : 'text-white'}`}
              >
                {timeLeft}s
              </span>
            ) : (
              <span className="text-emerald-400 font-bold">Vô hạn</span>
            )}
            <select
              value={turnTimeLimit}
              onChange={(e) => setTurnTimeLimit(Number(e.target.value))}
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
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  lanStatus === 'CONNECTED' ? 'bg-emerald-400' : 'bg-amber-400 animate-ping'
                }`}
              />
              <span className="font-bold text-fuchsia-200">
                Phòng LAN: <span className="font-mono text-white">{lanRoomCode || 'Chưa tạo'}</span>
              </span>
              <span className="text-[11px] px-1.5 py-0.5 rounded bg-fuchsia-500/30 text-fuchsia-200">
                Bạn là: {lanRole === 'HOST' ? 'Chủ Phòng (X)' : 'Khách (O)'}
              </span>
            </div>
            {onOpenLanModal && (
              <button
                onClick={onOpenLanModal}
                className="text-cyan-300 hover:underline font-semibold ml-2"
              >
                Cấu hình
              </button>
            )}
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
            onClick={() =>
              setReplayState?.((prev) => (prev ? { ...prev, playing: !prev.playing } : null))
            }
            className="px-2.5 py-1 rounded-lg bg-indigo-500 text-white text-xs font-bold"
          >
            {replayState.playing ? 'Tạm dừng' : 'Tiếp tục'}
          </button>
          <button
            onClick={onExitReplay}
            className="px-2.5 py-1 rounded-lg bg-rose-500/80 text-white text-xs font-bold"
          >
            Thoát Replay
          </button>
        </div>
      )}

      {/* VICTORY / GAME OVER MODAL OVERLAY WITH GACHA TICKET REWARD */}
      {winnerInfo && (
        <div className="absolute inset-x-0 top-1/5 z-30 flex justify-center pointer-events-auto px-4">
          <div className="max-w-lg w-full p-6 rounded-3xl bg-slate-950/95 backdrop-blur-xl border-2 border-amber-400/80 shadow-[0_0_60px_rgba(251,191,36,0.45)] text-center animate-in fade-in zoom-in-95 duration-300 space-y-4">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-amber-400 via-orange-500 to-fuchsia-600 flex items-center justify-center shadow-[0_0_25px_rgba(251,191,36,0.6)]">
              <Trophy className="w-9 h-9 text-slate-950" />
            </div>

            <div>
              <h2 className="text-2xl font-black tracking-wide bg-gradient-to-r from-amber-300 via-cyan-300 to-fuchsia-400 bg-clip-text text-transparent">
                {winnerInfo.winner === 'DRAW'
                  ? 'TRẬN ĐẤU HÒA CỜ!'
                  : `CHIẾN THẮNG: ${playerNames[winnerInfo.winner]} (${winnerInfo.winner})!`}
              </h2>
              <p className="text-xs text-slate-300 mt-1">
                Kết thúc bởi: <span className="font-bold text-cyan-300">{winnerInfo.directionName}</span> • Tổng số nước:{' '}
                <span className="font-bold text-amber-300">{movesCount}</span>
              </p>
            </div>

            {/* Lucky Spin Reward Banner */}
            {winnerInfo.winner !== 'DRAW' && (
              <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/20 via-rose-500/20 to-fuchsia-500/20 border border-amber-400/60 flex items-center justify-center gap-2.5">
                <Gift className="w-5 h-5 text-amber-300 animate-bounce shrink-0" />
                <span className="text-xs font-black text-amber-200">
                  PHẦN THƯỞNG CHIẾN THẮNG: +1 LƯỢT QUAY VŨ KHÍ & GIÁP (HẠNG C ➔ SS)!
                </span>
              </div>
            )}

            <div className="flex flex-wrap items-center justify-center gap-2.5 pt-2">
              {onOpenGacha && (
                <button
                  onClick={() => {
                    setWinnerInfo(null);
                    onOpenGacha();
                  }}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 via-orange-500 to-rose-500 hover:from-amber-300 hover:to-rose-400 text-slate-950 font-black text-xs shadow-[0_0_20px_rgba(251,191,36,0.5)] transition"
                >
                  <Gift className="w-4 h-4" />
                  <span>🎰 Quay Vũ Khí Ngay</span>
                </button>
              )}

              <button
                onClick={onReset}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-xs shadow-[0_0_20px_rgba(0,243,255,0.4)] transition"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Chơi Ván Mới</span>
              </button>

              <button
                onClick={onUndo}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 font-bold text-xs border border-cyan-400/40 shadow-[0_0_15px_rgba(0,243,255,0.2)] transition"
              >
                <Undo2 className="w-4 h-4" />
                <span>Đi Lại Nước Này</span>
              </button>

              {onBackToDashboard && (
                <button
                  onClick={onBackToDashboard}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-600 transition"
                >
                  <Home className="w-4 h-4" />
                  <span>Về Dashboard</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* BOTTOM CENTER ACTION DOCK */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex flex-wrap items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-slate-950/85 backdrop-blur-xl border border-slate-700/80 shadow-[0_10px_35px_rgba(0,0,0,0.75)]">
        <button
          onClick={onUndo}
          disabled={movesCount === 0}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-40 border border-slate-700 text-xs font-bold text-cyan-300 transition"
          title="Xin đi lại nước vừa đánh"
        >
          <Undo2 className="w-4 h-4" />
          <span>Đi Lại</span>
        </button>

        <button
          onClick={onReset}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-sky-500 hover:from-cyan-400 hover:to-sky-400 text-slate-950 text-xs font-black shadow-[0_0_15px_rgba(0,243,255,0.4)] transition"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Ván Mới</span>
        </button>

        <button
          onClick={onSurrender}
          disabled={movesCount === 0 || !!winnerInfo}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 disabled:opacity-40 border border-rose-500/40 text-xs font-bold text-rose-300 transition"
        >
          <Flag className="w-4 h-4" />
          <span>Đầu Hàng</span>
        </button>

        <div className="h-5 w-px bg-slate-800 mx-1 hidden sm:block" />

        <button
          onClick={onFocusLastMove}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-amber-300 transition"
          title="Đưa tâm camera tới nước cờ cuối cùng"
        >
          <Eye className="w-4 h-4" />
          <span className="hidden sm:inline">Tâm Nước Cuối</span>
        </button>

        <button
          onClick={onResetCameraCenter}
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
    </>
  );
};
