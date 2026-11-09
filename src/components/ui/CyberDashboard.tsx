'use client';

import React, { useState } from 'react';
import {
  Sparkles,
  Gamepad2,
  Swords,
  Users,
  Wifi,
  Cpu,
  Copy,
  Check,
  Plus,
  Trash2,
  Flame,
  Shield,
  Zap,
  Gift,
  Sliders,
  UserPlus,
  Crown,
  Share2,
  Play,
} from 'lucide-react';
import {
  GameMode,
  RpgItem,
  FighterStats,
  TeammateFighter,
  ScoreboardData,
  ItemRarity,
} from '../../types/game';
import {
  RARITY_META,
  PRESET_COMPANIONS,
} from '../../lib/rpgEngine';

interface CyberDashboardProps {
  playerName: string;
  onChangePlayerName: (name: string) => void;
  playerStats: FighterStats;
  spinTickets: number;
  inventory: RpgItem[];
  equippedSlots: (string | null)[];
  onEquipItemToSlot: (item: RpgItem, slotIndex?: number) => void;
  onUnequipSlot: (slotIndex: number) => void;
  onAutoEquipBest: () => void;
  selectedCompanionId: string;
  onSelectCompanion: (id: string) => void;
  activeTeammate: TeammateFighter;
  clearedStagesCount: number;
  scoreboard: ScoreboardData;
  // Game Mode & Launchers
  selectedCaroMode: GameMode;
  onSelectCaroMode: (mode: GameMode) => void;
  onStartCaroGame: (mode?: GameMode) => void;
  onOpenGachaModal: () => void;
  onOpenBattleArena: () => void;
  // LAN / Party Invite
  lanRoomCode: string;
  lanStatus: 'DISCONNECTED' | 'WAITING' | 'CONNECTED';
  lanTransport: string;
  onCreatePartyRoom: () => void;
  onJoinPartyRoom: (code: string) => void;
  onlinePeerFighter?: FighterStats | null;
}

export const CyberDashboard: React.FC<CyberDashboardProps> = ({
  playerName,
  onChangePlayerName,
  playerStats,
  spinTickets,
  inventory,
  equippedSlots,
  onEquipItemToSlot,
  onUnequipSlot,
  onAutoEquipBest,
  selectedCompanionId,
  onSelectCompanion,
  activeTeammate,
  clearedStagesCount,
  scoreboard,
  selectedCaroMode,
  onSelectCaroMode,
  onStartCaroGame,
  onOpenGachaModal,
  onOpenBattleArena,
  lanRoomCode,
  lanStatus,
  lanTransport,
  onCreatePartyRoom,
  onJoinPartyRoom,
  onlinePeerFighter,
}) => {
  const [joinCodeInput, setJoinCodeInput] = useState('');
  const [copiedInvite, setCopiedInvite] = useState(false);
  const [invFilter, setInvFilter] = useState<'ALL' | 'WEAPON' | 'ARMOR'>('ALL');

  const handleCopyInviteLink = () => {
    const code = lanRoomCode;
    if (!code) return;
    const url =
      typeof window !== 'undefined'
        ? `${window.location.origin}${window.location.pathname}?party=${code}`
        : code;
    navigator.clipboard.writeText(url);
    setCopiedInvite(true);
    setTimeout(() => setCopiedInvite(false), 2000);
  };

  const rarityRank: Record<ItemRarity, number> = { SS: 5, S: 4, A: 3, B: 2, C: 1 };
  const filteredInventory = [...inventory]
    .filter((it) => (invFilter === 'ALL' ? true : it.category === invFilter))
    .sort((a, b) => rarityRank[b.rarity] - rarityRank[a.rarity] || b.atk + b.def - (a.atk + a.def));

  return (
    <div className="relative w-full h-screen bg-[#050711] text-slate-100 overflow-y-auto select-none font-sans flex flex-col">
      {/* Background Cyberpunk Ambient Glows */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden z-0">
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-cyan-500/15 rounded-full blur-[120px]" />
        <div className="absolute top-1/3 -right-32 w-96 h-96 bg-fuchsia-500/15 rounded-full blur-[120px]" />
        <div className="absolute -bottom-32 left-1/3 w-96 h-96 bg-amber-500/10 rounded-full blur-[120px]" />
      </div>

      {/* ==================== TOP DASHBOARD HEADER ==================== */}
      <header className="sticky top-0 z-30 flex flex-wrap items-center justify-between gap-3 px-6 py-3.5 bg-slate-950/85 backdrop-blur-xl border-b border-cyan-500/30 shadow-[0_0_30px_rgba(0,243,255,0.12)]">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-cyan-400 via-fuchsia-500 to-amber-400 p-0.5 shadow-[0_0_20px_rgba(0,243,255,0.5)]">
            <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-cyan-400 animate-pulse" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black tracking-wider bg-gradient-to-r from-cyan-300 via-fuchsia-300 to-amber-300 bg-clip-text text-transparent">
                CYBERCARO 3D: ARENA & LOOT
              </h1>
              <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/40">
                DASHBOARD TRUNG TÂM
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Đánh Caro 30x30 Kiếm Lượt Quay ➔ Mở Vũ Khí & Giáp (C - SS) ➔ Vượt Ải & Solo 1vs1 Cùng Đồng Đội
            </p>
          </div>
        </div>

        {/* Quick Status Badges */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="px-3.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs flex items-center gap-2">
            <span className="text-slate-400">Thắng Caro:</span>
            <span className="font-black text-cyan-300">{scoreboard.X + scoreboard.O} trận</span>
            <span className="text-slate-700">|</span>
            <span className="text-slate-400">Vượt Ải:</span>
            <span className="font-black text-emerald-400">{clearedStagesCount}/5</span>
          </div>

          <button
            onClick={onOpenGachaModal}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500/25 to-rose-500/25 hover:from-amber-500/35 hover:to-rose-500/35 border border-amber-400/60 text-xs font-black text-amber-200 shadow-[0_0_20px_rgba(251,191,36,0.25)] transition"
          >
            <Gift className="w-4 h-4 text-amber-300 animate-bounce" />
            <span>Vé Quay Hiện Có:</span>
            <span className="px-2 py-0.5 rounded-lg bg-amber-400 text-slate-950 font-black text-sm">
              {spinTickets}
            </span>
          </button>
        </div>
      </header>

      {/* ==================== MAIN DASHBOARD CONTENT ==================== */}
      <main className="relative z-10 flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* TOP 3 BIG HERO ACTION LAUNCHERS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* ACTION 1: START CARO 3D */}
          <div className="p-5 rounded-3xl bg-gradient-to-br from-cyan-950/80 via-slate-900/95 to-slate-950 border-2 border-cyan-400/60 shadow-[0_0_35px_rgba(0,243,255,0.2)] flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black px-2.5 py-1 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 uppercase">
                  BƯỚC 1 • KIẾM LƯỢT QUAY
                </span>
                <span className="text-2xl">🎮</span>
              </div>
              <h2 className="text-lg font-black text-white">ĐẤU TRƯỜNG CARO 3D (30x30)</h2>
              <p className="text-xs text-slate-300 leading-relaxed">
                Mỗi ván thắng Caro 3D thưởng ngay <strong className="text-amber-300">+1 Vé Quay Vũ Khí/Giáp</strong>! Chọn chế độ bên dưới rồi bấm Bắt Đầu Chơi:
              </p>

              {/* Mode Selector inside card */}
              <div className="grid grid-cols-3 gap-1.5 pt-1">
                <button
                  onClick={() => onSelectCaroMode('AI_BOT')}
                  className={`py-2 px-2 rounded-xl text-[11px] font-bold border transition flex flex-col items-center gap-1 ${
                    selectedCaroMode === 'AI_BOT'
                      ? 'bg-cyan-500/25 border-cyan-400 text-cyan-200'
                      : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <Cpu className="w-4 h-4" />
                  <span>Đấu AI Bot</span>
                </button>
                <button
                  onClick={() => onSelectCaroMode('LOCAL_2P')}
                  className={`py-2 px-2 rounded-xl text-[11px] font-bold border transition flex flex-col items-center gap-1 ${
                    selectedCaroMode === 'LOCAL_2P'
                      ? 'bg-cyan-500/25 border-cyan-400 text-cyan-200'
                      : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <Users className="w-4 h-4" />
                  <span>1 Máy 2 Người</span>
                </button>
                <button
                  onClick={() => onSelectCaroMode('LAN_WIFI')}
                  className={`py-2 px-2 rounded-xl text-[11px] font-bold border transition flex flex-col items-center gap-1 ${
                    selectedCaroMode === 'LAN_WIFI'
                      ? 'bg-fuchsia-500/25 border-fuchsia-400 text-fuchsia-200'
                      : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <Wifi className="w-4 h-4" />
                  <span>Đấu LAN</span>
                </button>
              </div>
            </div>

            <button
              onClick={() => onStartCaroGame(selectedCaroMode)}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-cyan-400 via-sky-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-slate-950 font-black text-sm shadow-[0_0_25px_rgba(0,243,255,0.5)] flex items-center justify-center gap-2 transition transform active:scale-95"
            >
              <Play className="w-5 h-5 fill-current" />
              <span>BẮT ĐẦU CHƠI CARO NGAY</span>
            </button>
          </div>

          {/* ACTION 2: GACHA LUCKY SPIN */}
          <div className="p-5 rounded-3xl bg-gradient-to-br from-amber-950/75 via-slate-900/95 to-slate-950 border-2 border-amber-400/60 shadow-[0_0_35px_rgba(251,191,36,0.2)] flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/40 uppercase">
                  BƯỚC 2 • SĂN ĐỒ C ➔ SS
                </span>
                <span className="text-2xl">🎰</span>
              </div>
              <h2 className="text-lg font-black text-white">VÒNG QUAY VŨ KHÍ & GIÁP</h2>
              <p className="text-xs text-slate-300 leading-relaxed">
                Quay ngẫu nhiên Vũ Khí (+Công) & Giáp (+Thủ). Đồ hạng <strong className="text-purple-300">A</strong> có Hút máu/Phản đòn/Bạo kích; Đồ <strong className="text-amber-300">S & SS</strong> sở hữu Tuyệt Kỹ Độc Nhất!
              </p>
              <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between text-xs">
                <span className="text-slate-400">Tỷ lệ rơi C / B / A / S / SS:</span>
                <span className="font-bold text-amber-300 flex items-center gap-1">
                  <Sliders className="w-3.5 h-3.5" />
                  <span>Tùy chỉnh tự do</span>
                </span>
              </div>
            </div>

            <button
              onClick={onOpenGachaModal}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-400 via-orange-500 to-rose-500 hover:from-amber-300 hover:to-rose-400 text-slate-950 font-black text-sm shadow-[0_0_25px_rgba(251,191,36,0.5)] flex items-center justify-center gap-2 transition transform active:scale-95"
            >
              <Sparkles className="w-5 h-5" />
              <span>MỞ VÒNG QUAY ({spinTickets} VÉ)</span>
            </button>
          </div>

          {/* ACTION 3: ENTER BATTLE ARENA */}
          <div className="p-5 rounded-3xl bg-gradient-to-br from-rose-950/80 via-slate-900/95 to-slate-950 border-2 border-rose-500/60 shadow-[0_0_35px_rgba(244,63,94,0.2)] flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black px-2.5 py-1 rounded-full bg-rose-500/20 text-rose-300 border border-rose-400/40 uppercase">
                  BƯỚC 3 • VƯỢT ẢI & SOLO 1V1
                </span>
                <span className="text-2xl">⚔️</span>
              </div>
              <h2 className="text-lg font-black text-white">ĐẤU TRƯỜNG ARENA BATTLE</h2>
              <p className="text-xs text-slate-300 leading-relaxed">
                Mang 6 món trang bị đã lắp vào <strong className="text-rose-300">Vượt Ải Chiến Dịch</strong> cùng Đồng đội hoặc <strong className="text-cyan-300">Solo 1vs1</strong> với người chơi khác!
              </p>
              <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between text-xs">
                <span className="text-slate-400">Lực chiến hiện tại:</span>
                <span className="font-black text-rose-400">
                  ⚡ {playerStats.powerScore.toLocaleString()} LC
                </span>
              </div>
            </div>

            <button
              onClick={onOpenBattleArena}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-rose-500 via-fuchsia-500 to-amber-500 hover:from-rose-400 hover:to-amber-400 text-white font-black text-sm shadow-[0_0_25px_rgba(244,63,94,0.5)] flex items-center justify-center gap-2 transition transform active:scale-95"
            >
              <Swords className="w-5 h-5" />
              <span>VÀO ĐẤU TRƯỜNG BATTLE</span>
            </button>
          </div>
        </div>

        {/* ==================== LOWER GRID: 6-SLOT LOADOUT + INVENTORY (LEFT) & INVITE TEAMMATE (RIGHT) ==================== */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* LEFT 8 COLUMNS: FIGHTER STATS + 6 FREE SLOTS + INVENTORY */}
          <div className="lg:col-span-8 space-y-6">
            {/* Fighter Stats & 6 Free-form Equipment Slots */}
            <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500 to-fuchsia-600 p-0.5 shadow-[0_0_20px_rgba(0,243,255,0.35)]">
                    <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center text-3xl">
                      🦸‍♂️
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <input
                        value={playerName}
                        onChange={(e) => onChangePlayerName(e.target.value)}
                        className="bg-slate-950/90 px-3 py-1 rounded-xl border border-slate-700 focus:border-cyan-400 text-base font-black text-white focus:outline-none"
                        title="Đổi tên Chiến Binh của bạn"
                      />
                      <span className="text-xs font-black px-3 py-1 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-400/40">
                        ⚡ Lực Chiến: {playerStats.powerScore.toLocaleString()}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                      6 Ô Trang Bị Tự Do: Lắp 6 Vũ Khí (Full Công), 6 Giáp (Full Thủ/Phản Đòn) hoặc Kết Hợp!
                    </p>
                  </div>
                </div>

                <button
                  onClick={onAutoEquipBest}
                  className="px-4 py-2 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/50 text-cyan-200 text-xs font-black transition flex items-center gap-1.5"
                >
                  <Zap className="w-4 h-4 text-cyan-300" />
                  <span>Tự Lắp 6 Đồ Mạnh Nhất</span>
                </button>
              </div>

              {/* Fighter Stat Pills */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800/90">
                  <span className="text-slate-400 block text-[11px]">❤️ Máu Tối Đa (HP)</span>
                  <span className="text-base font-black text-emerald-400">{playerStats.maxHp}</span>
                </div>
                <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800/90">
                  <span className="text-slate-400 block text-[11px]">⚔️ Sức Tấn Công (ATK)</span>
                  <span className="text-base font-black text-rose-400">{playerStats.atk}</span>
                </div>
                <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800/90">
                  <span className="text-slate-400 block text-[11px]">🛡️ Phòng Thủ (DEF)</span>
                  <span className="text-base font-black text-sky-400">{playerStats.def}</span>
                </div>
                <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800/90">
                  <span className="text-slate-400 block text-[11px]">💥 Tỷ Lệ / ST Bạo Kích</span>
                  <span className="text-base font-black text-purple-300">
                    {playerStats.critRate}% / {playerStats.critDamage}%
                  </span>
                </div>
                <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800/90">
                  <span className="text-slate-400 block text-[11px]">🩸 Hút Máu (Hạng A+)</span>
                  <span className="text-base font-black text-rose-300">{playerStats.lifesteal}%</span>
                </div>
                <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800/90">
                  <span className="text-slate-400 block text-[11px]">🌵 Phản Đòn (Hạng A+)</span>
                  <span className="text-base font-black text-amber-300">{playerStats.reflectDamage}%</span>
                </div>
                <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800/90">
                  <span className="text-slate-400 block text-[11px]">⚡ Xuyên Giáp (Hạng A+)</span>
                  <span className="text-base font-black text-cyan-300">{playerStats.armorPen}%</span>
                </div>
                <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800/90">
                  <span className="text-slate-400 block text-[11px]">🔥 Tuyệt Kỹ S / SS</span>
                  <span className="text-base font-black text-amber-400">
                    {playerStats.skills.length} Chiêu
                  </span>
                </div>
              </div>

              {/* 6 FREE EQUIPMENT SLOTS */}
              <div>
                <div className="text-xs font-black text-slate-300 uppercase tracking-wider mb-2.5">
                  6 Ô TRANG BỊ TỰ DO (NHẤN VÀO Ô ĐỂ THÁO ĐỒ)
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5">
                  {playerStats.equippedItems.map((item, idx) => {
                    if (!item) {
                      return (
                        <div
                          key={idx}
                          onClick={onOpenGachaModal}
                          className="h-28 rounded-2xl bg-slate-950/70 border-2 border-dashed border-slate-800 hover:border-slate-700 flex flex-col items-center justify-center p-2 text-center cursor-pointer transition"
                        >
                          <Plus className="w-5 h-5 text-slate-600 mb-1" />
                          <span className="text-[11px] font-bold text-slate-500">Ô Trống #{idx + 1}</span>
                          <span className="text-[9px] text-slate-600">Vũ khí / Giáp</span>
                        </div>
                      );
                    }
                    const meta = RARITY_META[item.rarity];
                    return (
                      <div
                        key={idx}
                        onClick={() => onUnequipSlot(idx)}
                        className={`relative h-28 rounded-2xl bg-slate-950 border-2 ${meta.border} ${meta.glow} p-2.5 flex flex-col justify-between cursor-pointer group transition`}
                        title="Nhấn để tháo trang bị này"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-2xl">{item.icon}</span>
                          <span
                            className={`text-[9px] font-black px-1.5 py-0.5 rounded border ${meta.bgBadge}`}
                          >
                            {item.rarity}
                          </span>
                        </div>
                        <div>
                          <div className={`text-[11px] font-black truncate ${meta.textGrad}`}>
                            {item.name}
                          </div>
                          <div className="text-[10px] text-slate-300 font-semibold">
                            {item.atk > 0 ? `+${item.atk} Công` : `+${item.def} Thủ`}
                          </div>
                        </div>
                        <div className="absolute inset-0 rounded-2xl bg-rose-950/85 opacity-0 group-hover:opacity-100 flex items-center justify-center text-xs font-black text-rose-200 transition">
                          Tháo Đồ
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Active Unique Skills from S / SS Items */}
              {playerStats.skills.length > 0 && (
                <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-rose-500/10 to-fuchsia-500/10 border border-amber-400/40 space-y-2">
                  <div className="text-xs font-black text-amber-300 flex items-center gap-1.5">
                    <Flame className="w-4 h-4 text-rose-400" />
                    <span>KỸ NĂNG ĐỘC NHẤT ĐANG KÍCH HOẠT (HẠNG S / SS):</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {playerStats.skills.map((sk) => (
                      <div
                        key={sk.id}
                        className="p-2.5 rounded-xl bg-slate-950/90 border border-amber-400/30 text-xs"
                      >
                        <div className="font-black text-amber-200">★ {sk.name}</div>
                        <div className="text-[11px] text-slate-300 mt-0.5">{sk.description}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* INVENTORY LIST */}
            <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-black text-white">
                    🎒 KHO VŨ KHÍ & GIÁP ĐÃ SỞ HỮU ({inventory.length} MÓN)
                  </h3>
                  <p className="text-xs text-slate-400">
                    Nhấn vào vật phẩm bất kỳ để lắp vào 6 Ô Trang Bị
                  </p>
                </div>

                <div className="flex gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-bold">
                  <button
                    onClick={() => setInvFilter('ALL')}
                    className={`px-3 py-1 rounded-lg ${
                      invFilter === 'ALL' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400'
                    }`}
                  >
                    Tất cả
                  </button>
                  <button
                    onClick={() => setInvFilter('WEAPON')}
                    className={`px-3 py-1 rounded-lg ${
                      invFilter === 'WEAPON' ? 'bg-rose-500 text-white' : 'text-slate-400'
                    }`}
                  >
                    ⚔️ Vũ Khí
                  </button>
                  <button
                    onClick={() => setInvFilter('ARMOR')}
                    className={`px-3 py-1 rounded-lg ${
                      invFilter === 'ARMOR' ? 'bg-sky-500 text-slate-950' : 'text-slate-400'
                    }`}
                  >
                    🛡️ Giáp
                  </button>
                </div>
              </div>

              {filteredInventory.length === 0 ? (
                <div className="py-10 text-center space-y-3 bg-slate-950/60 rounded-2xl border border-slate-800/80">
                  <p className="text-sm font-bold text-slate-400">
                    Kho đồ đang trống! Bạn đang có sẵn <span className="text-amber-300">{spinTickets} Vé Quay</span>.
                  </p>
                  <button
                    onClick={onOpenGachaModal}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 text-slate-950 font-black text-xs shadow-[0_0_20px_rgba(251,191,36,0.4)]"
                  >
                    🎰 Quay Vũ Khí & Giáp Ngay
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 max-h-80 overflow-y-auto pr-1">
                  {filteredInventory.map((item) => {
                    const meta = RARITY_META[item.rarity];
                    const isEquipped = equippedSlots.includes(item.instanceId);
                    return (
                      <div
                        key={item.instanceId}
                        className={`p-3.5 rounded-2xl bg-slate-950 border ${meta.border} flex flex-col justify-between space-y-2.5`}
                      >
                        <div>
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span className="text-2xl">{item.icon}</span>
                              <div>
                                <div className={`text-xs font-black ${meta.textGrad}`}>
                                  {item.name}
                                </div>
                                <span
                                  className={`inline-block text-[9px] font-black px-1.5 py-0.5 rounded border mt-0.5 ${meta.bgBadge}`}
                                >
                                  Hạng {item.rarity} • {item.category === 'WEAPON' ? 'Vũ Khí' : 'Giáp'}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="mt-2 flex flex-wrap gap-1 text-[11px]">
                            {item.atk > 0 && (
                              <span className="text-rose-300 font-bold">⚔️+{item.atk} Công</span>
                            )}
                            {item.def > 0 && (
                              <span className="text-sky-300 font-bold">🛡️+{item.def} Thủ</span>
                            )}
                            {item.hpBonus > 0 && (
                              <span className="text-emerald-300 font-bold">❤️+{item.hpBonus} HP</span>
                            )}
                            {item.critRate > 0 && (
                              <span className="text-purple-300">• 💥Bạo +{item.critRate}%</span>
                            )}
                            {item.lifesteal > 0 && (
                              <span className="text-rose-300">• 🩸Hút +{item.lifesteal}%</span>
                            )}
                            {item.reflectDamage > 0 && (
                              <span className="text-amber-300">• 🌵Phản +{item.reflectDamage}%</span>
                            )}
                          </div>

                          {item.uniqueSkill && (
                            <div className="mt-1.5 text-[10px] text-amber-300 font-semibold truncate">
                              ★ {item.uniqueSkill.name}
                            </div>
                          )}
                        </div>

                        <button
                          onClick={() => {
                            if (isEquipped) {
                              const idx = equippedSlots.indexOf(item.instanceId);
                              if (idx !== -1) onUnequipSlot(idx);
                            } else {
                              onEquipItemToSlot(item);
                            }
                          }}
                          className={`w-full py-1.5 rounded-xl text-xs font-black transition ${
                            isEquipped
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-rose-500/20 hover:text-rose-300'
                              : 'bg-cyan-500/20 hover:bg-cyan-500 text-cyan-200 hover:text-slate-950 border border-cyan-500/40'
                          }`}
                        >
                          {isEquipped ? '✓ Đang Mặc (Nhấn để tháo)' : '+ Trang Bị Vào Ô'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* RIGHT 4 COLUMNS: INVITE TEAMMATE / PARTY HUB */}
          <div className="lg:col-span-4 space-y-6">
            <div className="p-6 rounded-3xl bg-slate-900/90 border border-fuchsia-500/40 shadow-[0_0_30px_rgba(255,0,127,0.15)] space-y-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2.5 rounded-xl bg-fuchsia-500/20 border border-fuchsia-400/40 text-fuchsia-300">
                    <UserPlus className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-white">SẢNH MỜI ĐỒNG ĐỘI & TỔ ĐỘI</h3>
                    <p className="text-[11px] text-slate-400">
                      Mời bạn bè qua Mã / Link để Đấu Caro hoặc Sát Cánh Vượt Ải
                    </p>
                  </div>
                </div>
              </div>

              {/* Create / Share Party Code */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-cyan-300">Mã Tổ Đội / Phòng Của Bạn:</span>
                  <button
                    onClick={onCreatePartyRoom}
                    className="text-xs font-bold text-fuchsia-400 hover:underline"
                  >
                    {lanRoomCode ? 'Đổi mã mới' : 'Tạo Mã Mời'}
                  </button>
                </div>

                <div className="flex items-center justify-between gap-2 p-3 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="font-mono text-xl font-black tracking-widest text-white">
                    {lanRoomCode || 'CHƯA TẠO'}
                  </span>
                  <button
                    onClick={() => {
                      if (!lanRoomCode) {
                        onCreatePartyRoom();
                      } else {
                        handleCopyInviteLink();
                      }
                    }}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-black transition"
                  >
                    {copiedInvite ? <Check className="w-3.5 h-3.5" /> : <Share2 className="w-3.5 h-3.5" />}
                    <span>{copiedInvite ? 'Đã Copy Link!' : lanRoomCode ? 'Copy Link Mời' : 'Tạo Mã Ngay'}</span>
                  </button>
                </div>

                {/* Join Friend's Party */}
                <div className="pt-2 border-t border-slate-800/80 space-y-2">
                  <span className="text-[11px] font-bold text-slate-400 block">
                    Hoặc nhập Mã Tổ Đội của bạn bè:
                  </span>
                  <div className="flex gap-2">
                    <input
                      value={joinCodeInput}
                      onChange={(e) => setJoinCodeInput(e.target.value.toUpperCase())}
                      placeholder="VD: AB12-89"
                      className="flex-1 px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 font-mono text-xs text-white uppercase focus:outline-none focus:border-fuchsia-400"
                    />
                    <button
                      onClick={() => {
                        if (joinCodeInput.trim()) onJoinPartyRoom(joinCodeInput.trim());
                      }}
                      className="px-4 py-2 rounded-xl bg-fuchsia-500 hover:bg-fuchsia-400 text-white text-xs font-black transition"
                    >
                      Vào Đội
                    </button>
                  </div>
                </div>

                {/* Connection Status */}
                <div className="flex items-center justify-between text-xs pt-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-2.5 h-2.5 rounded-full ${
                        lanStatus === 'CONNECTED'
                          ? 'bg-emerald-400'
                          : lanRoomCode
                          ? 'bg-amber-400 animate-ping'
                          : 'bg-slate-600'
                      }`}
                    />
                    <span className="text-slate-300">
                      {lanStatus === 'CONNECTED'
                        ? `Đã kết nối đồng đội (${lanTransport})`
                        : lanRoomCode
                        ? 'Đang chờ đồng đội mở link / nhập mã...'
                        : 'Chế độ Tổ Đội Cá Nhân'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Select Active Companion for Co-op Campaign */}
              <div className="space-y-2.5">
                <div className="text-xs font-black text-amber-300 uppercase tracking-wider">
                  🤝 CHỌN ĐỒNG ĐỘI SÁT CÁNH VƯỢT ẢI:
                </div>

                {onlinePeerFighter && (
                  <div
                    onClick={() => onSelectCompanion('online_friend')}
                    className={`p-3.5 rounded-2xl border-2 cursor-pointer transition flex items-center justify-between ${
                      selectedCompanionId === 'online_friend'
                        ? 'bg-fuchsia-950/60 border-fuchsia-400 shadow-[0_0_20px_rgba(255,0,127,0.3)]'
                        : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">⚡</span>
                      <div>
                        <div className="text-xs font-black text-white flex items-center gap-1.5">
                          <span>{onlinePeerFighter.name}</span>
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                            Bạn Bè LAN
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400">
                          ⚔️ {onlinePeerFighter.atk} • 🛡️ {onlinePeerFighter.def} • LC: {onlinePeerFighter.powerScore}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {PRESET_COMPANIONS.map((comp) => {
                  const isSelected = activeTeammate.id === comp.id;
                  return (
                    <div
                      key={comp.id}
                      onClick={() => onSelectCompanion(comp.id)}
                      className={`p-3.5 rounded-2xl border cursor-pointer transition flex items-center justify-between ${
                        isSelected
                          ? 'bg-cyan-950/60 border-cyan-400 shadow-[0_0_15px_rgba(0,243,255,0.25)]'
                          : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{comp.avatar}</span>
                        <div>
                          <div className="text-xs font-black text-white">{comp.name}</div>
                          <div className="text-[10px] text-cyan-300 font-semibold">{comp.title}</div>
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            ❤️ {comp.stats.maxHp} • ⚔️ {comp.stats.atk} • 🛡️ {comp.stats.def}
                          </div>
                        </div>
                      </div>
                      {isSelected && (
                        <span className="text-[10px] font-black px-2 py-1 rounded-lg bg-cyan-500 text-slate-950">
                          Đang Chọn
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
