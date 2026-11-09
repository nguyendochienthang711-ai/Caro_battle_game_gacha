'use client';

import React from 'react';
import {
  Sparkles,
  Users,
  Wifi,
  Cpu,
  FolderTree,
  Volume2,
  VolumeX,
  Home,
  Gift,
  Swords,
} from 'lucide-react';
import { GameMode, CameraPreset } from '../../types/game';

interface TopNavbarProps {
  gameMode: GameMode;
  onSelectMode: (mode: GameMode) => void;
  cameraPreset: CameraPreset;
  onSelectCameraPreset: (preset: CameraPreset) => void;
  isMuted: boolean;
  onToggleMute: () => void;
  onOpenLanModal: () => void;
  onOpenArchitectureModal: () => void;
  lanStatus?: 'DISCONNECTED' | 'WAITING' | 'CONNECTED';
  onBackToDashboard?: () => void;
  spinTickets?: number;
  onOpenGachaModal?: () => void;
  onOpenBattleArena?: () => void;
}

export const TopNavbar: React.FC<TopNavbarProps> = ({
  gameMode,
  onSelectMode,
  cameraPreset,
  onSelectCameraPreset,
  isMuted,
  onToggleMute,
  onOpenLanModal,
  onOpenArchitectureModal,
  lanStatus,
  onBackToDashboard,
  spinTickets = 0,
  onOpenGachaModal,
  onOpenBattleArena,
}) => {
  return (
    <header className="relative z-20 flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 bg-slate-950/80 backdrop-blur-xl border-b border-cyan-500/30 shadow-[0_0_25px_rgba(0,243,255,0.12)]">
      {/* Left: Back to Dashboard + Brand Title */}
      <div className="flex items-center gap-3">
        {onBackToDashboard && (
          <button
            onClick={onBackToDashboard}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-cyan-500/50 text-cyan-300 text-xs font-black transition shadow-[0_0_12px_rgba(0,243,255,0.2)]"
            title="Quay về Trang Chủ Dashboard"
          >
            <Home className="w-4 h-4" />
            <span>Dashboard</span>
          </button>
        )}

        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500 to-fuchsia-600 p-0.5 shadow-[0_0_15px_rgba(0,243,255,0.5)]">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-cyan-400 animate-pulse" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-black tracking-wider bg-gradient-to-r from-cyan-400 via-sky-200 to-fuchsia-400 bg-clip-text text-transparent">
                CYBERCARO 3D
              </h1>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/40">
                THẮNG +1 VÉ QUAY
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Game Mode Selector Pills */}
      <div className="flex items-center bg-slate-900/90 p-1 rounded-xl border border-slate-700/80">
        <button
          onClick={() => onSelectMode('LOCAL_2P')}
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
          onClick={onOpenLanModal}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
            gameMode === 'LAN_WIFI'
              ? 'bg-fuchsia-500 text-white shadow-[0_0_12px_rgba(255,0,127,0.6)]'
              : 'text-slate-300 hover:text-white'
          }`}
        >
          <Wifi className="w-3.5 h-3.5" />
          <span>Mạng LAN / Đồng Đội</span>
          {lanStatus === 'CONNECTED' && (
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          )}
        </button>

        <button
          onClick={() => onSelectMode('AI_BOT')}
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

      {/* Right Controls: Gacha, Battle, Camera Presets & Sound */}
      <div className="flex items-center gap-2">
        {onOpenGachaModal && (
          <button
            onClick={onOpenGachaModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/50 text-amber-200 text-xs font-black transition"
          >
            <Gift className="w-4 h-4 text-amber-300" />
            <span>Quay Đồ ({spinTickets})</span>
          </button>
        )}

        {onOpenBattleArena && (
          <button
            onClick={onOpenBattleArena}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-400/50 text-rose-200 text-xs font-black transition"
          >
            <Swords className="w-4 h-4 text-rose-300" />
            <span className="hidden sm:inline">Battle</span>
          </button>
        )}

        <div className="hidden xl:flex items-center bg-slate-900/90 p-1 rounded-xl border border-slate-700/70">
          <button
            onClick={() => onSelectCameraPreset('ISO_3D')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
              cameraPreset === 'ISO_3D'
                ? 'bg-slate-700 text-cyan-300'
                : 'text-slate-400 hover:text-white'
            }`}
            title="Góc nhìn 3D Nghiêng"
          >
            3D Nghiêng
          </button>
          <button
            onClick={() => onSelectCameraPreset('TOP_2D')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
              cameraPreset === 'TOP_2D'
                ? 'bg-slate-700 text-cyan-300'
                : 'text-slate-400 hover:text-white'
            }`}
            title="Góc nhìn từ đỉnh xuống như 2D"
          >
            2D Đỉnh
          </button>
          <button
            onClick={() => onSelectCameraPreset('CINEMATIC')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
              cameraPreset === 'CINEMATIC'
                ? 'bg-slate-700 text-cyan-300'
                : 'text-slate-400 hover:text-white'
            }`}
            title="Camera tự xoay điện ảnh 360 độ"
          >
            Xoay 360°
          </button>
        </div>

        <button
          onClick={onOpenArchitectureModal}
          className="p-2 rounded-xl bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-400/40 text-indigo-200 transition"
          title="Xem cấu trúc thư mục dự án Next.js"
        >
          <FolderTree className="w-4 h-4 text-indigo-300" />
        </button>

        <button
          onClick={onToggleMute}
          className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 transition"
          title={isMuted ? 'Bật âm thanh' : 'Tắt âm thanh'}
        >
          {isMuted ? (
            <VolumeX className="w-4 h-4 text-rose-400" />
          ) : (
            <Volume2 className="w-4 h-4 text-cyan-400" />
          )}
        </button>
      </div>
    </header>
  );
};
