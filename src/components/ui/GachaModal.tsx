'use client';

import React, { useState } from 'react';
import {
  Sparkles,
  Sliders,
  X,
  Zap,
  Shield,
  Flame,
  RotateCcw,
  Plus,
  Check,
  Gift,
  BookOpen,
} from 'lucide-react';
import {
  ItemRarity,
  RarityDropRates,
  RpgItem,
} from '../../types/game';
import {
  RARITY_META,
  DEFAULT_DROP_RATES,
  ITEM_TEMPLATES,
  rollGachaItem,
} from '../../lib/rpgEngine';
import { soundEngine } from '../../lib/soundEngine';

interface GachaModalProps {
  isOpen: boolean;
  onClose: () => void;
  spinTickets: number;
  dropRates: RarityDropRates;
  onUpdateDropRates: (rates: RarityDropRates) => void;
  onItemObtained: (items: RpgItem[], ticketsSpent: number) => void;
  onAutoEquipItem: (item: RpgItem) => void;
  onGoToCaro: () => void;
  onAddFreeTestTicket: () => void;
}

export const GachaModal: React.FC<GachaModalProps> = ({
  isOpen,
  onClose,
  spinTickets,
  dropRates,
  onUpdateDropRates,
  onItemObtained,
  onAutoEquipItem,
  onGoToCaro,
  onAddFreeTestTicket,
}) => {
  const [isSpinning, setIsSpinning] = useState(false);
  const [previewIcon, setPreviewIcon] = useState('🎰');
  const [previewRarity, setPreviewRarity] = useState<ItemRarity>('S');
  const [rolledResults, setRolledResults] = useState<RpgItem[]>([]);
  const [equippedIds, setEquippedIds] = useState<Set<string>>(new Set());
  const [activeSubTab, setActiveSubTab] = useState<'SPIN' | 'RATES' | 'CATALOG'>('SPIN');

  if (!isOpen) return null;

  const raritiesOrder: ItemRarity[] = ['C', 'B', 'A', 'S', 'SS'];
  const totalWeight = raritiesOrder.reduce(
    (sum, r) => sum + Math.max(0, Number(dropRates[r]) || 0),
    0
  );

  const getActualPercent = (r: ItemRarity) => {
    if (totalWeight <= 0) return r === 'C' ? '100.0' : '0.0';
    return (((Math.max(0, Number(dropRates[r]) || 0)) / totalWeight) * 100).toFixed(1);
  };

  const handleSpin = (count: number) => {
    if (isSpinning || spinTickets < count) return;
    setIsSpinning(true);
    setRolledResults([]);

    let ticks = 0;
    const maxTicks = 14;
    const interval = setInterval(() => {
      ticks++;
      const randTemplate = ITEM_TEMPLATES[Math.floor(Math.random() * ITEM_TEMPLATES.length)];
      setPreviewIcon(randTemplate.icon);
      setPreviewRarity(randTemplate.rarity);
      soundEngine.playTick();

      if (ticks >= maxTicks) {
        clearInterval(interval);
        const results: RpgItem[] = [];
        for (let i = 0; i < count; i++) {
          results.push(rollGachaItem(dropRates));
        }

        const bestRarity = results.some((i) => i.rarity === 'SS')
          ? 'SS'
          : results.some((i) => i.rarity === 'S')
          ? 'S'
          : results.some((i) => i.rarity === 'A')
          ? 'A'
          : results[0].rarity;

        setPreviewIcon(results[0].icon);
        setPreviewRarity(bestRarity);
        soundEngine.playItemReveal(bestRarity);
        setRolledResults(results);
        onItemObtained(results, count);
        setIsSpinning(false);
      }
    }, 85);
  };

  const handleRateChange = (rarity: ItemRarity, val: number) => {
    onUpdateDropRates({
      ...dropRates,
      [rarity]: Math.max(0, val),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-3 sm:p-6 overflow-y-auto">
      <div className="max-w-4xl w-full rounded-3xl bg-slate-950 border border-amber-400/50 shadow-[0_0_60px_rgba(251,191,36,0.25)] overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 bg-slate-900/90 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-400 via-fuchsia-500 to-cyan-400 p-0.5 shadow-[0_0_20px_rgba(251,191,36,0.5)]">
              <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center text-xl">
                🎰
              </div>
            </div>
            <div>
              <h2 className="text-lg font-black tracking-wide bg-gradient-to-r from-amber-300 via-fuchsia-300 to-cyan-300 bg-clip-text text-transparent">
                VÒNG QUAY KHO BÁU CYBER (HẠNG C ➔ SS)
              </h2>
              <p className="text-xs text-slate-400">
                Thắng Caro nhận Lượt Quay • Săn Vũ Khí & Giáp kích hoạt Kỹ Năng Độc Nhất S/SS
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-amber-500/20 border border-amber-400/50">
              <Gift className="w-4 h-4 text-amber-400" />
              <span className="text-xs text-amber-200 font-semibold">Lượt quay:</span>
              <span className="text-base font-black text-amber-300">{spinTickets}</span>
              <button
                onClick={onAddFreeTestTicket}
                className="ml-1 px-2 py-0.5 rounded-lg bg-amber-400/20 hover:bg-amber-400/35 text-[10px] font-bold text-amber-200 border border-amber-400/40 transition"
                title="Cộng thêm 1 lượt quay để test nhanh"
              >
                +1 Test
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Sub-navigation Tabs */}
        <div className="flex items-center gap-2 px-6 py-2.5 bg-slate-900/50 border-b border-slate-800/80 text-xs font-bold">
          <button
            onClick={() => setActiveSubTab('SPIN')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl transition ${
              activeSubTab === 'SPIN'
                ? 'bg-gradient-to-r from-amber-400 to-orange-500 text-slate-950 shadow-[0_0_15px_rgba(251,191,36,0.5)]'
                : 'text-slate-400 hover:text-white bg-slate-900'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Quay Trang Bị</span>
          </button>

          <button
            onClick={() => setActiveSubTab('RATES')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl transition ${
              activeSubTab === 'RATES'
                ? 'bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-950 shadow-[0_0_15px_rgba(0,243,255,0.5)]'
                : 'text-slate-400 hover:text-white bg-slate-900'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>Tùy Chỉnh Tỷ Lệ Rơi (C - SS)</span>
          </button>

          <button
            onClick={() => setActiveSubTab('CATALOG')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl transition ${
              activeSubTab === 'CATALOG'
                ? 'bg-gradient-to-r from-fuchsia-500 to-purple-600 text-white shadow-[0_0_15px_rgba(255,0,127,0.5)]'
                : 'text-slate-400 hover:text-white bg-slate-900'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Danh Mục Đồ & Kỹ Năng S/SS</span>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* TAB 1: GACHA MACHINE */}
          {activeSubTab === 'SPIN' && (
            <div className="space-y-6">
              {/* Current Drop Rate Pills */}
              <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-2xl bg-slate-900/80 border border-slate-800">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[11px] font-bold text-slate-400 uppercase mr-1">
                    Tỷ lệ hiện tại:
                  </span>
                  {raritiesOrder.map((r) => (
                    <span
                      key={r}
                      className={`text-xs font-bold px-2.5 py-1 rounded-lg border ${RARITY_META[r].bgBadge}`}
                    >
                      Hạng {r}: {getActualPercent(r)}%
                    </span>
                  ))}
                </div>
                <button
                  onClick={() => setActiveSubTab('RATES')}
                  className="text-xs font-bold text-cyan-400 hover:underline flex items-center gap-1"
                >
                  <Sliders className="w-3.5 h-3.5" />
                  <span>Chỉnh tỷ lệ</span>
                </button>
              </div>

              {/* Center Capsule / Orb Display */}
              <div className="flex flex-col items-center justify-center py-4">
                <div
                  className={`relative w-36 h-36 rounded-3xl flex flex-col items-center justify-center border-2 transition-all duration-300 ${
                    isSpinning
                      ? 'animate-pulse scale-110 border-cyan-400 bg-slate-900 shadow-[0_0_50px_rgba(0,243,255,0.6)]'
                      : `${RARITY_META[previewRarity].border} bg-slate-900/90 ${RARITY_META[previewRarity].glow}`
                  }`}
                >
                  <span className={`text-6xl select-none ${isSpinning ? 'animate-bounce' : ''}`}>
                    {previewIcon}
                  </span>
                  <span
                    className={`mt-2 text-[11px] font-black px-2.5 py-0.5 rounded-full border ${RARITY_META[previewRarity].bgBadge}`}
                  >
                    {isSpinning ? 'ĐANG QUAY...' : `HẠNG ${previewRarity}`}
                  </span>
                </div>

                {/* Spin Action Buttons */}
                <div className="flex flex-wrap items-center justify-center gap-3 mt-6">
                  <button
                    onClick={() => handleSpin(1)}
                    disabled={isSpinning || spinTickets < 1}
                    className="flex items-center gap-2 px-7 py-3.5 rounded-2xl bg-gradient-to-r from-amber-400 via-orange-500 to-rose-500 hover:from-amber-300 hover:to-rose-400 disabled:opacity-40 text-slate-950 font-black text-sm shadow-[0_0_30px_rgba(251,191,36,0.5)] transition transform active:scale-95"
                  >
                    <Sparkles className="w-5 h-5" />
                    <span>QUAY 1 LẦN (1 VÉ)</span>
                  </button>

                  <button
                    onClick={() => handleSpin(3)}
                    disabled={isSpinning || spinTickets < 3}
                    className="flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-cyan-400 to-fuchsia-500 hover:from-cyan-300 hover:to-fuchsia-400 disabled:opacity-40 text-slate-950 font-black text-sm shadow-[0_0_25px_rgba(0,243,255,0.4)] transition transform active:scale-95"
                  >
                    <Zap className="w-5 h-5" />
                    <span>QUAY NHANH x3 (3 VÉ)</span>
                  </button>
                </div>

                {spinTickets === 0 && (
                  <div className="mt-4 flex items-center gap-3 px-4 py-2.5 rounded-xl bg-rose-500/15 border border-rose-500/40 text-xs text-rose-200">
                    <span>Bạn đã hết Lượt Quay! Hãy thắng 1 ván Caro 3D để nhận thêm lượt quay.</span>
                    <button
                      onClick={() => {
                        onClose();
                        onGoToCaro();
                      }}
                      className="px-3 py-1 rounded-lg bg-cyan-500 text-slate-950 font-black hover:bg-cyan-400 transition shrink-0"
                    >
                      Đánh Caro Ngay
                    </button>
                  </div>
                )}
              </div>

              {/* Rolled Items Showcase */}
              {rolledResults.length > 0 && (
                <div className="space-y-3 animate-in fade-in zoom-in-95 duration-300">
                  <div className="text-xs font-black text-amber-300 uppercase tracking-wider text-center">
                    🎉 VẬT PHẨM BẠN VỪA NHẬN ĐƯỢC 🎉
                  </div>
                  <div
                    className={`grid gap-3 ${
                      rolledResults.length === 1 ? 'grid-cols-1 max-w-lg mx-auto' : 'grid-cols-1 md:grid-cols-3'
                    }`}
                  >
                    {rolledResults.map((item) => {
                      const meta = RARITY_META[item.rarity];
                      const isEquipped = equippedIds.has(item.instanceId);
                      return (
                        <div
                          key={item.instanceId}
                          className={`p-4 rounded-2xl bg-slate-900/95 border-2 ${meta.border} ${meta.glow} flex flex-col justify-between space-y-3`}
                        >
                          <div>
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-center gap-2.5">
                                <span className="text-3xl">{item.icon}</span>
                                <div>
                                  <span
                                    className={`inline-block text-[10px] font-black px-2 py-0.5 rounded border mb-1 ${meta.bgBadge}`}
                                  >
                                    {meta.label} • {item.category === 'WEAPON' ? 'VŨ KHÍ' : 'GIÁP'}
                                  </span>
                                  <h4 className={`text-sm font-black ${meta.textGrad}`}>
                                    {item.name}
                                  </h4>
                                </div>
                              </div>
                            </div>

                            {/* Primary Stats */}
                            <div className="mt-3 flex flex-wrap gap-1.5 text-xs">
                              {item.atk > 0 && (
                                <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30 font-bold">
                                  ⚔️ +{item.atk} Công
                                </span>
                              )}
                              {item.def > 0 && (
                                <span className="px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 border border-sky-500/30 font-bold">
                                  🛡️ +{item.def} Thủ
                                </span>
                              )}
                              {item.hpBonus > 0 && (
                                <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold">
                                  ❤️ +{item.hpBonus} HP
                                </span>
                              )}
                            </div>

                            {/* Tier A+ Sub-stats */}
                            {(item.critRate > 0 ||
                              item.lifesteal > 0 ||
                              item.reflectDamage > 0 ||
                              item.armorPen > 0) && (
                              <div className="mt-2 pt-2 border-t border-slate-800 flex flex-wrap gap-1.5 text-[11px] text-purple-200">
                                {item.critRate > 0 && (
                                  <span className="px-2 py-0.5 rounded bg-purple-500/20 border border-purple-400/30">
                                    💥 Bạo kích +{item.critRate}%
                                  </span>
                                )}
                                {item.critDamage > 0 && (
                                  <span className="px-2 py-0.5 rounded bg-purple-500/20 border border-purple-400/30">
                                    🔥 ST Bạo +{item.critDamage}%
                                  </span>
                                )}
                                {item.lifesteal > 0 && (
                                  <span className="px-2 py-0.5 rounded bg-rose-500/20 border border-rose-400/30 text-rose-200">
                                    🩸 Hút máu +{item.lifesteal}%
                                  </span>
                                )}
                                {item.reflectDamage > 0 && (
                                  <span className="px-2 py-0.5 rounded bg-amber-500/20 border border-amber-400/30 text-amber-200">
                                    🌵 Phản đòn +{item.reflectDamage}%
                                  </span>
                                )}
                                {item.armorPen > 0 && (
                                  <span className="px-2 py-0.5 rounded bg-cyan-500/20 border border-cyan-400/30 text-cyan-200">
                                    ⚡ Xuyên giáp +{item.armorPen}%
                                  </span>
                                )}
                              </div>
                            )}

                            {/* Tier S / SS Unique Skill */}
                            {item.uniqueSkill && (
                              <div className="mt-2.5 p-2.5 rounded-xl bg-gradient-to-r from-amber-500/15 via-rose-500/15 to-fuchsia-500/15 border border-amber-400/50 text-[11px]">
                                <div className="font-black text-amber-300 flex items-center gap-1">
                                  <Flame className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                                  <span>{item.uniqueSkill.name}</span>
                                </div>
                                <p className="text-slate-200 mt-0.5 leading-relaxed">
                                  {item.uniqueSkill.description}
                                </p>
                              </div>
                            )}
                          </div>

                          <button
                            onClick={() => {
                              onAutoEquipItem(item);
                              setEquippedIds((prev) => new Set(prev).add(item.instanceId));
                            }}
                            disabled={isEquipped}
                            className={`w-full py-2 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition ${
                              isEquipped
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950'
                            }`}
                          >
                            {isEquipped ? (
                              <>
                                <Check className="w-4 h-4" />
                                <span>Đã Trang Bị Vào Ô</span>
                              </>
                            ) : (
                              <>
                                <Plus className="w-4 h-4" />
                                <span>Trang Bị Ngay</span>
                              </>
                            )}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: CUSTOMIZE DROP RATES (DO NGƯỜI CHƠI TỰ QUYẾT ĐỊNH) */}
          {activeSubTab === 'RATES' && (
            <div className="space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-2 p-4 rounded-2xl bg-slate-900/90 border border-cyan-500/30">
                <div>
                  <h3 className="text-sm font-black text-cyan-300">
                    BẢNG ĐIỀU CHỈNH TỶ LỆ RƠI ĐỒ (C ➔ SS)
                  </h3>
                  <p className="text-xs text-slate-400">
                    Bạn có toàn quyền quyết định tỷ lệ xuất hiện của từng bậc Vũ Khí & Giáp. Hệ thống tự động tính % xác suất chuẩn!
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => onUpdateDropRates({ ...DEFAULT_DROP_RATES })}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 border border-slate-700"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Mặc định chuẩn</span>
                  </button>
                  <button
                    onClick={() => onUpdateDropRates({ C: 10, B: 20, A: 30, S: 25, SS: 15 })}
                    className="px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-xs font-bold text-amber-300 border border-amber-400/40"
                  >
                    🔥 Tỷ lệ Siêu Cấp (S/SS Cao)
                  </button>
                  <button
                    onClick={() => onUpdateDropRates({ C: 0, B: 0, A: 0, S: 30, SS: 70 })}
                    className="px-3 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-xs font-bold text-rose-300 border border-rose-400/40"
                  >
                    👑 Test Toàn Đồ S & SS
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                {raritiesOrder.map((r) => {
                  const meta = RARITY_META[r];
                  const val = dropRates[r];
                  const pct = getActualPercent(r);
                  return (
                    <div
                      key={r}
                      className={`p-4 rounded-2xl bg-slate-900/80 border ${meta.border} flex flex-col sm:flex-row sm:items-center justify-between gap-4`}
                    >
                      <div className="min-w-[210px]">
                        <span
                          className={`inline-block text-xs font-black px-2.5 py-0.5 rounded border ${meta.bgBadge}`}
                        >
                          {meta.label}
                        </span>
                        <div className="text-[11px] text-slate-400 mt-1">
                          {r === 'C' && 'Chỉ cộng Công hoặc Thủ cơ bản'}
                          {r === 'B' && 'Công/Thủ khá + Chút bạo kích/phản đòn'}
                          {r === 'A' && 'Mở khóa Hút Máu, Phản Đòn, Bạo Kích, Xuyên Giáp'}
                          {r === 'S' && 'Mở khóa Kỹ Năng Độc Nhất (Choáng, Khiên Phản Pháo...)'}
                          {r === 'SS' && 'Mở khóa Tuyệt Kỹ Thần Thoại (Hố Đen, Bất Tử Hồi Sinh...)'}
                        </div>
                      </div>

                      <div className="flex-1 flex items-center gap-3">
                        <input
                          type="range"
                          min={0}
                          max={100}
                          value={val}
                          onChange={(e) => handleRateChange(r, Number(e.target.value))}
                          className="flex-1 accent-cyan-400 cursor-pointer"
                        />
                        <input
                          type="number"
                          min={0}
                          max={1000}
                          value={val}
                          onChange={(e) => handleRateChange(r, Number(e.target.value))}
                          className="w-20 px-2.5 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-center font-mono text-sm font-bold text-white"
                        />
                        <div className="w-20 text-right font-mono text-sm font-black text-cyan-300">
                          {pct}%
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: FULL ITEM & SKILL CATALOG */}
          {activeSubTab === 'CATALOG' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[...ITEM_TEMPLATES].reverse().map((tpl) => {
                const meta = RARITY_META[tpl.rarity];
                return (
                  <div
                    key={tpl.templateId}
                    className={`p-3.5 rounded-2xl bg-slate-900/90 border ${meta.border} space-y-2`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <span className="text-2xl">{tpl.icon}</span>
                        <div>
                          <div className={`text-xs font-black ${meta.textGrad}`}>{tpl.name}</div>
                          <div className="text-[10px] text-slate-400">
                            {tpl.category === 'WEAPON' ? 'Vũ Khí (+Công)' : 'Giáp (+Thủ & HP)'}
                          </div>
                        </div>
                      </div>
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded border ${meta.bgBadge}`}>
                        Hạng {tpl.rarity}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-1.5 text-[11px]">
                      {tpl.atk > 0 && <span className="text-rose-300 font-bold">⚔️ +{tpl.atk} Công</span>}
                      {tpl.def > 0 && <span className="text-sky-300 font-bold">🛡️ +{tpl.def} Thủ</span>}
                      {tpl.hpBonus > 0 && <span className="text-emerald-300 font-bold">❤️ +{tpl.hpBonus} HP</span>}
                      {tpl.critRate > 0 && <span className="text-purple-300">• 💥Bạo +{tpl.critRate}%</span>}
                      {tpl.lifesteal > 0 && <span className="text-rose-300">• 🩸Hút máu +{tpl.lifesteal}%</span>}
                      {tpl.reflectDamage > 0 && <span className="text-amber-300">• 🌵Phản đòn +{tpl.reflectDamage}%</span>}
                      {tpl.armorPen > 0 && <span className="text-cyan-300">• ⚡Xuyên giáp +{tpl.armorPen}%</span>}
                    </div>

                    {tpl.uniqueSkill && (
                      <div className="p-2 rounded-xl bg-slate-950/90 border border-amber-500/30 text-[11px]">
                        <div className="font-bold text-amber-300">★ {tpl.uniqueSkill.name}</div>
                        <div className="text-slate-300 mt-0.5">{tpl.uniqueSkill.description}</div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
