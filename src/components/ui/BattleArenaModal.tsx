'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Swords,
  Shield,
  Flame,
  Zap,
  Heart,
  Play,
  Pause,
  RotateCcw,
  Trophy,
  Skull,
  X,
  Users,
  UserCheck,
  Sparkles,
  FastForward,
} from 'lucide-react';
import {
  FighterStats,
  TeammateFighter,
  UniqueSkill,
} from '../../types/game';
import {
  CAMPAIGN_STAGES,
  PVP_CHALLENGERS,
  CampaignStage,
} from '../../lib/rpgEngine';
import { soundEngine } from '../../lib/soundEngine';

interface BattleArenaModalProps {
  isOpen: boolean;
  onClose: () => void;
  playerStats: FighterStats;
  activeTeammate: TeammateFighter;
  onlineOpponentStats?: FighterStats | null;
  clearedStageIds: number[];
  onStageCleared: (stageId: number, rewardSpins: number) => void;
  onOpenGacha: () => void;
}

interface CombatantState {
  id: string;
  name: string;
  avatar: string;
  isAlly: boolean;
  stats: FighterStats;
  hp: number;
  maxHp: number;
  shield: number;
  stunnedTurns: number;
  reviveUsed: boolean;
  skillCooldowns: Record<string, number>;
}

interface FloatingText {
  id: number;
  targetId: string;
  text: string;
  colorClass: string;
}

export const BattleArenaModal: React.FC<BattleArenaModalProps> = ({
  isOpen,
  onClose,
  playerStats,
  activeTeammate,
  onlineOpponentStats,
  clearedStageIds,
  onStageCleared,
  onOpenGacha,
}) => {
  const [arenaTab, setArenaTab] = useState<'CAMPAIGN' | 'SOLO_1V1'>('CAMPAIGN');
  const [selectedStage, setSelectedStage] = useState<CampaignStage>(CAMPAIGN_STAGES[0]);
  const [selectedChallenger, setSelectedChallenger] = useState<TeammateFighter>(PVP_CHALLENGERS[0]);

  // Active Battle State
  const [inBattle, setInBattle] = useState(false);
  const [autoMode, setAutoMode] = useState(false);
  const [speedMultiplier, setSpeedMultiplier] = useState<1 | 2>(1);
  const [turnIndex, setTurnIndex] = useState(0); // 0: Player, 1: Teammate (if campaign), 2: Enemy
  const [roundNumber, setRoundNumber] = useState(1);

  const [playerUnit, setPlayerUnit] = useState<CombatantState | null>(null);
  const [allyUnit, setAllyUnit] = useState<CombatantState | null>(null);
  const [enemyUnit, setEnemyUnit] = useState<CombatantState | null>(null);

  const [battleLogs, setBattleLogs] = useState<string[]>([]);
  const [floatingTexts, setFloatingTexts] = useState<FloatingText[]>([]);
  const [battleResult, setBattleResult] = useState<'VICTORY' | 'DEFEAT' | null>(null);
  const [earnedSpins, setEarnedSpins] = useState(0);

  const pushFloating = useCallback((targetId: string, text: string, colorClass: string) => {
    const id = Date.now() + Math.random();
    setFloatingTexts((prev) => [...prev.slice(-6), { id, targetId, text, colorClass }]);
  }, []);

  const addLog = useCallback((msg: string) => {
    setBattleLogs((prev) => [msg, ...prev.slice(0, 35)]);
  }, []);

  const startBattle = (mode: 'CAMPAIGN' | 'SOLO_1V1', stage?: CampaignStage, challenger?: TeammateFighter) => {
    const pUnit: CombatantState = {
      id: 'player',
      name: playerStats.name,
      avatar: '🦸‍♂️',
      isAlly: true,
      stats: playerStats,
      hp: playerStats.maxHp,
      maxHp: playerStats.maxHp,
      shield: 0,
      stunnedTurns: 0,
      reviveUsed: false,
      skillCooldowns: {},
    };

    const aUnit: CombatantState | null =
      mode === 'CAMPAIGN'
        ? {
            id: 'ally',
            name: activeTeammate.name,
            avatar: activeTeammate.avatar,
            isAlly: true,
            stats: activeTeammate.stats,
            hp: activeTeammate.stats.maxHp,
            maxHp: activeTeammate.stats.maxHp,
            shield: 0,
            stunnedTurns: 0,
            reviveUsed: false,
            skillCooldowns: {},
          }
        : null;

    const targetEnemyStats =
      mode === 'CAMPAIGN'
        ? (stage || selectedStage).enemyStats
        : (challenger || selectedChallenger).stats;

    const targetAvatar =
      mode === 'CAMPAIGN'
        ? (stage || selectedStage).avatar
        : (challenger || selectedChallenger).avatar;

    const eUnit: CombatantState = {
      id: 'enemy',
      name: targetEnemyStats.name,
      avatar: targetAvatar,
      isAlly: false,
      stats: targetEnemyStats,
      hp: targetEnemyStats.maxHp,
      maxHp: targetEnemyStats.maxHp,
      shield: 0,
      stunnedTurns: 0,
      reviveUsed: false,
      skillCooldowns: {},
    };

    setPlayerUnit(pUnit);
    setAllyUnit(aUnit);
    setEnemyUnit(eUnit);
    setTurnIndex(0);
    setRoundNumber(1);
    setBattleResult(null);
    setEarnedSpins(0);
    setFloatingTexts([]);
    setBattleLogs([
      `⚔️ TRẬN CHIẾN BẮT ĐẦU: ${pUnit.name}${aUnit ? ` & ${aUnit.name}` : ''} đối đầu ${eUnit.name}!`,
    ]);
    setInBattle(true);
  };

  // Damage & Skill Resolution Helper
  const performAttack = useCallback(
    (
      attacker: CombatantState,
      defender: CombatantState,
      actionType: 'NORMAL' | 'HEAVY' | 'DEFEND' | 'UNIQUE_SKILL',
      skill?: UniqueSkill
    ) => {
      let nextAttacker = { ...attacker, skillCooldowns: { ...attacker.skillCooldowns } };
      let nextDefender = { ...defender };

      // Decrement cooldowns at start of turn
      Object.keys(nextAttacker.skillCooldowns).forEach((k) => {
        if (nextAttacker.skillCooldowns[k] > 0) nextAttacker.skillCooldowns[k] -= 1;
      });

      // Check Stun
      if (nextAttacker.stunnedTurns > 0) {
        nextAttacker.stunnedTurns -= 1;
        addLog(`💫 ${nextAttacker.name} đang bị CHOÁNG, mất lượt hành động!`);
        pushFloating(nextAttacker.id, 'BỊ CHOÁNG!', 'text-amber-300');
        return { nextAttacker, nextDefender };
      }

      // DEFEND Action
      if (actionType === 'DEFEND') {
        const shieldGain = Math.round(nextAttacker.maxHp * 0.25);
        const healGain = Math.round(nextAttacker.maxHp * 0.1);
        nextAttacker.shield += shieldGain;
        nextAttacker.hp = Math.min(nextAttacker.maxHp, nextAttacker.hp + healGain);
        soundEngine.playHover();
        addLog(`🛡️ ${nextAttacker.name} tụ lực phòng thủ: +${shieldGain} Khiên & hồi +${healGain} HP!`);
        pushFloating(nextAttacker.id, `+${shieldGain} Khiên`, 'text-cyan-300');
        return { nextAttacker, nextDefender };
      }

      // Set skill cooldown if unique skill used
      if (actionType === 'UNIQUE_SKILL' && skill) {
        nextAttacker.skillCooldowns[skill.id] = skill.cooldown;
        if (skill.shieldPercent) {
          const sGain = Math.round((nextAttacker.maxHp * skill.shieldPercent) / 100);
          nextAttacker.shield += sGain;
          pushFloating(nextAttacker.id, `+${sGain} Khiên`, 'text-cyan-300');
        }
      }

      // Calculate Multiplier & Armor Penetration
      let mult = 1.0;
      let bonusCrit = 0;
      let ignoreDef = nextAttacker.stats.armorPen;
      let extraLifesteal = 0;
      let trueDmg = 0;

      if (actionType === 'HEAVY') {
        mult = 1.35;
        bonusCrit = 20;
      } else if (actionType === 'UNIQUE_SKILL' && skill) {
        mult = skill.multiplier || 2.2;
        ignoreDef = Math.max(ignoreDef, skill.ignoreDefPercent || 0);
        extraLifesteal = skill.lifestealBonus || 0;
        if (skill.trueDamagePercent) {
          trueDmg = Math.round((nextDefender.maxHp * skill.trueDamagePercent) / 100);
        }
      }

      const effectiveDef = Math.max(
        0,
        nextDefender.stats.def * (1 - Math.min(100, ignoreDef) / 100)
      );

      // Crit check
      const isCrit =
        skill?.id === 'skill_blackhole_singularity' ||
        Math.random() * 100 < nextAttacker.stats.critRate + bonusCrit;

      const critMult = isCrit ? nextAttacker.stats.critDamage / 100 : 1.0;
      const rawAtkDmg = nextAttacker.stats.atk * mult * critMult;
      const mitigation = 300 / (300 + effectiveDef);
      let finalDmg = Math.max(25, Math.round(rawAtkDmg * mitigation) + trueDmg);

      soundEngine.playBattleHit(isCrit);

      // Apply damage to Shield first, then HP
      let remainingDmg = finalDmg;
      if (nextDefender.shield > 0) {
        const absorbed = Math.min(nextDefender.shield, remainingDmg);
        nextDefender.shield -= absorbed;
        remainingDmg -= absorbed;
      }
      nextDefender.hp = Math.max(0, nextDefender.hp - remainingDmg);

      const actionLabel =
        actionType === 'UNIQUE_SKILL' && skill
          ? `🔥 [${skill.name}]`
          : actionType === 'HEAVY'
          ? '💥 Trọng Kích'
          : '⚔️ Trảm Kích';

      addLog(
        `${nextAttacker.name} dùng ${actionLabel} lên ${nextDefender.name} gây ${finalDmg} ST${
          isCrit ? ' (BẠO KÍCH!)' : ''
        }!`
      );
      pushFloating(
        nextDefender.id,
        `${isCrit ? '💥 CRIT ' : ''}-${finalDmg}`,
        isCrit ? 'text-amber-300 font-black scale-125' : 'text-rose-400'
      );

      // Stun application from S/SS skill
      if (actionType === 'UNIQUE_SKILL' && skill?.stunTurns && nextDefender.hp > 0) {
        nextDefender.stunnedTurns = Math.max(nextDefender.stunnedTurns, skill.stunTurns);
        addLog(`⚡ ${nextDefender.name} bị làm CHOÁNG ${skill.stunTurns} lượt!`);
      }

      // Lifesteal (Tier A/S/SS)
      const totalLifestealPct = nextAttacker.stats.lifesteal + extraLifesteal;
      if (totalLifestealPct > 0 && finalDmg > 0) {
        const heal = Math.round((finalDmg * totalLifestealPct) / 100);
        if (heal > 0) {
          nextAttacker.hp = Math.min(nextAttacker.maxHp, nextAttacker.hp + heal);
          addLog(`🩸 ${nextAttacker.name} Hút Máu hồi +${heal} HP!`);
          pushFloating(nextAttacker.id, `🩸 +${heal} HP`, 'text-emerald-400');
        }
      }

      // Reflect Damage / Thorns (Tier A/S/SS Armor)
      if (nextDefender.stats.reflectDamage > 0 && finalDmg > 0) {
        const reflected = Math.round((finalDmg * nextDefender.stats.reflectDamage) / 100);
        if (reflected > 0) {
          nextAttacker.hp = Math.max(1, nextAttacker.hp - reflected);
          addLog(`🌵 Giáp của ${nextDefender.name} PHẢN ĐÒN ${reflected} sát thương ngược lại ${nextAttacker.name}!`);
          pushFloating(nextAttacker.id, `🌵 Phản -${reflected}`, 'text-purple-300');
        }
      }

      // Check Passive Revive (SS Thần Giáp Phượng Hoàng)
      const hasPhoenixRevive = nextDefender.stats.skills.some(
        (s) => s.id === 'skill_phoenix_immortal'
      );
      if (nextDefender.hp <= 0 && hasPhoenixRevive && !nextDefender.reviveUsed) {
        nextDefender.reviveUsed = true;
        nextDefender.hp = Math.round(nextDefender.maxHp * 0.65);
        const phoenixBlast = Math.round(nextDefender.stats.def * 2.5);
        nextAttacker.hp = Math.max(0, nextAttacker.hp - phoenixBlast);
        soundEngine.playWinFanfare();
        addLog(
          `🔥 NIẾT BÀN TÁI SINH [SS]: ${nextDefender.name} sống lại với 65% HP và nổ lửa gây ${phoenixBlast} ST chuẩn!`
        );
        pushFloating(nextDefender.id, '🔥 HỒI SINH 65% HP!', 'text-amber-300');
      }

      return { nextAttacker, nextDefender };
    },
    [addLog, pushFloating]
  );

  // Check Victory or Defeat
  useEffect(() => {
    if (!inBattle || battleResult || !playerUnit || !enemyUnit) return;

    if (enemyUnit.hp <= 0) {
      setBattleResult('VICTORY');
      soundEngine.playWinFanfare();
      const reward = arenaTab === 'CAMPAIGN' ? selectedStage.rewardSpins : 1;
      setEarnedSpins(reward);
      onStageCleared(arenaTab === 'CAMPAIGN' ? selectedStage.id : 0, reward);
      addLog(`🏆 CHIẾN THẮNG HUY HOÀNG! Bạn nhận được +${reward} Lượt Quay Vũ Khí/Giáp!`);
      return;
    }

    const allAlliesDead =
      playerUnit.hp <= 0 && (!allyUnit || allyUnit.hp <= 0);
    if (allAlliesDead) {
      setBattleResult('DEFEAT');
      soundEngine.playThreatAlert();
      addLog(`💀 THẤT BẠI! Hãy đánh Caro kiếm thêm Lượt Quay để nâng cấp Vũ Khí & Giáp mạnh hơn!`);
    }
  }, [
    inBattle,
    battleResult,
    playerUnit,
    allyUnit,
    enemyUnit,
    arenaTab,
    selectedStage,
    onStageCleared,
    addLog,
  ]);

  // Execute Player Action
  const handlePlayerAction = useCallback(
    (actionType: 'NORMAL' | 'HEAVY' | 'DEFEND' | 'UNIQUE_SKILL', skill?: UniqueSkill) => {
      if (!inBattle || battleResult || !playerUnit || !enemyUnit) return;
      if (turnIndex !== 0) return;

      if (playerUnit.hp <= 0) {
        setTurnIndex(allyUnit && allyUnit.hp > 0 ? 1 : 2);
        return;
      }

      const { nextAttacker, nextDefender } = performAttack(
        playerUnit,
        enemyUnit,
        actionType,
        skill
      );
      setPlayerUnit(nextAttacker);
      setEnemyUnit(nextDefender);

      if (nextDefender.hp > 0) {
        setTurnIndex(allyUnit && allyUnit.hp > 0 ? 1 : 2);
      }
    },
    [inBattle, battleResult, playerUnit, allyUnit, enemyUnit, turnIndex, performAttack]
  );

  // AI Turn Driver (Teammate Turn + Enemy Turn + Auto Mode for Player)
  useEffect(() => {
    if (!inBattle || battleResult || !playerUnit || !enemyUnit) return;

    const delay = (turnIndex === 0 ? 650 : 850) / speedMultiplier;

    // Turn 0: Player (only if autoMode or player dead)
    if (turnIndex === 0) {
      if (playerUnit.hp <= 0) {
        setTurnIndex(allyUnit && allyUnit.hp > 0 ? 1 : 2);
        return;
      }
      if (!autoMode) return;

      const timer = setTimeout(() => {
        const readySkill = playerUnit.stats.skills.find(
          (s) => (playerUnit.skillCooldowns[s.id] || 0) === 0
        );
        if (readySkill) {
          handlePlayerAction('UNIQUE_SKILL', readySkill);
        } else {
          handlePlayerAction(Math.random() < 0.45 ? 'HEAVY' : 'NORMAL');
        }
      }, delay);
      return () => clearTimeout(timer);
    }

    // Turn 1: Teammate (if present in Campaign)
    if (turnIndex === 1) {
      if (!allyUnit || allyUnit.hp <= 0) {
        setTurnIndex(2);
        return;
      }
      const timer = setTimeout(() => {
        const readySkill = allyUnit.stats.skills.find(
          (s) => (allyUnit.skillCooldowns[s.id] || 0) === 0
        );
        const { nextAttacker, nextDefender } = performAttack(
          allyUnit,
          enemyUnit,
          readySkill ? 'UNIQUE_SKILL' : 'NORMAL',
          readySkill
        );
        setAllyUnit(nextAttacker);
        setEnemyUnit(nextDefender);
        setTurnIndex(2);
      }, delay);
      return () => clearTimeout(timer);
    }

    // Turn 2: Enemy Boss / Challenger
    if (turnIndex === 2) {
      const timer = setTimeout(() => {
        const targetIsPlayer =
          playerUnit.hp > 0 && (!allyUnit || allyUnit.hp <= 0 || Math.random() < 0.65);
        const targetUnit = targetIsPlayer ? playerUnit : allyUnit!;

        const readySkill = enemyUnit.stats.skills.find(
          (s) => (enemyUnit.skillCooldowns[s.id] || 0) === 0
        );
        const { nextAttacker, nextDefender } = performAttack(
          enemyUnit,
          targetUnit,
          readySkill ? 'UNIQUE_SKILL' : Math.random() < 0.35 ? 'HEAVY' : 'NORMAL',
          readySkill
        );

        setEnemyUnit(nextAttacker);
        if (targetIsPlayer) {
          setPlayerUnit(nextDefender);
        } else {
          setAllyUnit(nextDefender);
        }

        setRoundNumber((r) => r + 1);
        setTurnIndex(0);
      }, delay);
      return () => clearTimeout(timer);
    }
  }, [
    inBattle,
    battleResult,
    turnIndex,
    autoMode,
    speedMultiplier,
    playerUnit,
    allyUnit,
    enemyUnit,
    handlePlayerAction,
    performAttack,
  ]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-3 sm:p-6 overflow-y-auto">
      <div className="max-w-5xl w-full rounded-3xl bg-slate-950 border border-rose-500/50 shadow-[0_0_60px_rgba(244,63,94,0.28)] overflow-hidden flex flex-col max-h-[94vh]">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 bg-slate-900 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-rose-500 to-amber-500 p-0.5 shadow-[0_0_20px_rgba(244,63,94,0.5)]">
              <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
                <Swords className="w-5 h-5 text-rose-400" />
              </div>
            </div>
            <div>
              <h2 className="text-lg font-black tracking-wide bg-gradient-to-r from-rose-400 via-amber-300 to-cyan-300 bg-clip-text text-transparent">
                ĐẤU TRƯỜNG CYBER BATTLE (VƯỢT ẢI & SOLO 1VS1)
              </h2>
              <p className="text-xs text-slate-400">
                Sử dụng Vũ Khí & Giáp 6 Ô đã build • Đánh theo lượt bán tự động hoặc bật Auto
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {inBattle && (
              <button
                onClick={() => setInBattle(false)}
                className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 border border-slate-700"
              >
                ← Chọn Ải / Đối Thủ Khác
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* STAGE / MODE SELECTION SCREEN */}
        {!inBattle ? (
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Mode Switcher */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex gap-2 bg-slate-900 p-1.5 rounded-2xl border border-slate-800">
                <button
                  onClick={() => setArenaTab('CAMPAIGN')}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black transition ${
                    arenaTab === 'CAMPAIGN'
                      ? 'bg-gradient-to-r from-rose-500 to-amber-500 text-slate-950 shadow-[0_0_20px_rgba(244,63,94,0.5)]'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Users className="w-4 h-4" />
                  <span>VƯỢT ẢI CÙNG ĐỒNG ĐỘI (CO-OP PVE)</span>
                </button>

                <button
                  onClick={() => setArenaTab('SOLO_1V1')}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black transition ${
                    arenaTab === 'SOLO_1V1'
                      ? 'bg-gradient-to-r from-cyan-400 to-fuchsia-500 text-slate-950 shadow-[0_0_20px_rgba(0,243,255,0.5)]'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Swords className="w-4 h-4" />
                  <span>SOLO 1VS1 ĐẤU TRƯỜNG (PVP)</span>
                </button>
              </div>

              {/* Player & Teammate Summary */}
              <div className="flex items-center gap-3 px-4 py-2 rounded-2xl bg-slate-900/90 border border-slate-800 text-xs">
                <div>
                  <span className="text-slate-400">Lực chiến của bạn: </span>
                  <span className="font-black text-cyan-300">{playerStats.powerScore.toLocaleString()}</span>
                </div>
                {arenaTab === 'CAMPAIGN' && (
                  <div className="border-l border-slate-800 pl-3 flex items-center gap-1.5">
                    <span>{activeTeammate.avatar}</span>
                    <span className="text-slate-400">Đồng đội:</span>
                    <span className="font-bold text-amber-300">{activeTeammate.name}</span>
                  </div>
                )}
              </div>
            </div>

            {/* CAMPAIGN STAGES LIST */}
            {arenaTab === 'CAMPAIGN' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {CAMPAIGN_STAGES.map((stage) => {
                  const isCleared = clearedStageIds.includes(stage.id);
                  const teamPower = playerStats.powerScore + activeTeammate.stats.powerScore;
                  return (
                    <div
                      key={stage.id}
                      className={`p-5 rounded-2xl bg-slate-900/90 border transition flex flex-col justify-between space-y-4 ${
                        isCleared
                          ? 'border-emerald-500/50'
                          : 'border-slate-800 hover:border-rose-500/60'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-14 h-14 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center text-3xl">
                            {stage.avatar}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="text-sm font-black text-white">{stage.name}</h3>
                              {isCleared && (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                                  ✓ Đã Vượt
                                </span>
                              )}
                            </div>
                            <p className="text-xs font-bold text-rose-400 mt-0.5">{stage.bossTitle}</p>
                            <div className="flex flex-wrap gap-2 mt-2 text-[11px] text-slate-300">
                              <span>❤️ HP: {stage.enemyStats.maxHp}</span>
                              <span>• ⚔️ Công: {stage.enemyStats.atk}</span>
                              <span>• 🛡️ Thủ: {stage.enemyStats.def}</span>
                            </div>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="inline-block text-[11px] font-black px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-400/40">
                            🎁 +{stage.rewardSpins} Vé Quay
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t border-slate-800/80">
                        <div className="text-xs">
                          <span className="text-slate-400">Đề xuất: </span>
                          <span
                            className={`font-bold ${
                              teamPower >= stage.recommendedPower ? 'text-emerald-400' : 'text-amber-400'
                            }`}
                          >
                            {stage.recommendedPower.toLocaleString()} LC
                          </span>
                        </div>

                        <button
                          onClick={() => {
                            setSelectedStage(stage);
                            startBattle('CAMPAIGN', stage);
                          }}
                          className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-400 hover:to-amber-400 text-slate-950 font-black text-xs shadow-[0_0_15px_rgba(244,63,94,0.4)] transition"
                        >
                          <Swords className="w-4 h-4" />
                          <span>Khiêu Chiến Cùng Đồng Đội</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* SOLO 1V1 CHALLENGERS LIST */}
            {arenaTab === 'SOLO_1V1' && (
              <div className="space-y-4">
                {onlineOpponentStats && (
                  <div className="p-5 rounded-2xl bg-gradient-to-r from-fuchsia-950/80 to-slate-900 border-2 border-fuchsia-400 shadow-[0_0_25px_rgba(255,0,127,0.3)] flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-3.5">
                      <div className="w-14 h-14 rounded-2xl bg-slate-950 border border-fuchsia-400 flex items-center justify-center text-3xl">
                        ⚡
                      </div>
                      <div>
                        <span className="text-[10px] font-black px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-400/40">
                          ĐỐI THỦ PHÒNG LAN ĐANG ONLINE
                        </span>
                        <h3 className="text-base font-black text-white mt-1">
                          {onlineOpponentStats.name} (Lực chiến: {onlineOpponentStats.powerScore.toLocaleString()})
                        </h3>
                        <p className="text-xs text-slate-300">
                          ❤️ HP: {onlineOpponentStats.maxHp} • ⚔️ Công: {onlineOpponentStats.atk} • 🛡️ Thủ: {onlineOpponentStats.def}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() =>
                        startBattle('SOLO_1V1', undefined, {
                          id: 'online_pvp',
                          name: onlineOpponentStats.name,
                          title: 'Người Chơi LAN',
                          avatar: '⚡',
                          stats: onlineOpponentStats,
                        })
                      }
                      className="px-6 py-3 rounded-xl bg-gradient-to-r from-fuchsia-500 to-cyan-400 text-slate-950 font-black text-xs shadow-[0_0_20px_rgba(255,0,127,0.5)]"
                    >
                      ⚔️ SOLO 1VS1 NGAY
                    </button>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {PVP_CHALLENGERS.map((chal) => (
                    <div
                      key={chal.id}
                      className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-cyan-400/60 transition flex flex-col justify-between space-y-4"
                    >
                      <div>
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center text-2xl">
                            {chal.avatar}
                          </div>
                          <div>
                            <h4 className="text-sm font-black text-white">{chal.name}</h4>
                            <p className="text-[11px] font-bold text-cyan-400">{chal.title}</p>
                          </div>
                        </div>

                        <div className="mt-3 space-y-1 text-xs text-slate-300 bg-slate-950/80 p-3 rounded-xl border border-slate-800/80">
                          <div className="flex justify-between">
                            <span className="text-slate-400">Lực chiến:</span>
                            <span className="font-black text-amber-300">{chal.stats.powerScore.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">Máu / Công / Thủ:</span>
                            <span className="font-semibold">
                              {chal.stats.maxHp} / {chal.stats.atk} / {chal.stats.def}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">Bạo / Hút máu / Phản:</span>
                            <span className="font-semibold text-purple-300">
                              {chal.stats.critRate}% / {chal.stats.lifesteal}% / {chal.stats.reflectDamage}%
                            </span>
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          setSelectedChallenger(chal);
                          startBattle('SOLO_1V1', undefined, chal);
                        }}
                        className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-xs transition"
                      >
                        ⚔️ Thách Đấu Solo 1vs1 (+1 Vé Quay)
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          /* ACTIVE COMBAT STAGE */
          <div className="flex-1 flex flex-col overflow-hidden p-5 space-y-4">
            {/* Top Combat Controls Bar */}
            <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 rounded-2xl bg-slate-900 border border-slate-800">
              <div className="flex items-center gap-3 text-xs font-bold">
                <span className="px-2.5 py-1 rounded-lg bg-rose-500/20 text-rose-300 border border-rose-500/40">
                  HIỆP {roundNumber}
                </span>
                <span className="text-slate-300">
                  Lượt hiện tại:{' '}
                  <strong className="text-cyan-300">
                    {turnIndex === 0
                      ? `BẠN (${playerUnit?.name})`
                      : turnIndex === 1
                      ? `ĐỒNG ĐỘI (${allyUnit?.name})`
                      : `ĐỐI THỦ (${enemyUnit?.name})`}
                  </strong>
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setAutoMode((prev) => !prev)}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-black border transition ${
                    autoMode
                      ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.5)]'
                      : 'bg-slate-800 text-slate-300 border-slate-700'
                  }`}
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>{autoMode ? 'AUTO: ĐANG BẬT' : 'BẬT AUTO ĐÁNH'}</span>
                </button>

                <button
                  onClick={() => setSpeedMultiplier((s) => (s === 1 ? 2 : 1))}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold text-amber-300"
                >
                  <FastForward className="w-3.5 h-3.5" />
                  <span>Tốc độ x{speedMultiplier}</span>
                </button>
              </div>
            </div>

            {/* Battlefield Arena Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center py-2">
              {/* LEFT SIDE: PLAYER + TEAMMATE */}
              <div className="space-y-3">
                {[playerUnit, allyUnit].filter(Boolean).map((unit) => {
                  const u = unit!;
                  const hpPct = Math.max(0, Math.min(100, Math.round((u.hp / u.maxHp) * 100)));
                  const floats = floatingTexts.filter((f) => f.targetId === u.id);
                  return (
                    <div
                      key={u.id}
                      className={`relative p-4 rounded-2xl bg-slate-900/95 border-2 transition ${
                        (turnIndex === 0 && u.id === 'player') || (turnIndex === 1 && u.id === 'ally')
                          ? 'border-cyan-400 shadow-[0_0_25px_rgba(0,243,255,0.3)]'
                          : 'border-slate-800'
                      }`}
                    >
                      {/* Floating combat texts */}
                      <div className="absolute -top-3 right-4 flex flex-col items-end pointer-events-none z-20">
                        {floats.slice(-2).map((fl) => (
                          <span
                            key={fl.id}
                            className={`text-sm font-black drop-shadow animate-bounce ${fl.colorClass}`}
                          >
                            {fl.text}
                          </span>
                        ))}
                      </div>

                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2.5">
                          <span className="text-3xl">{u.avatar}</span>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-black text-white">{u.name}</span>
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300">
                                {u.id === 'player' ? 'BẠN' : 'ĐỒNG ĐỘI'}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-400">
                              ⚔️ {u.stats.atk} • 🛡️ {u.stats.def} • 💥Bạo {u.stats.critRate}% • 🩸Hút {u.stats.lifesteal}% • 🌵Phản {u.stats.reflectDamage}%
                            </div>
                          </div>
                        </div>
                        {u.shield > 0 && (
                          <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-cyan-500/20 text-cyan-300 border border-cyan-400/40">
                            🛡️ Khiên: {u.shield}
                          </span>
                        )}
                      </div>

                      {/* HP Bar */}
                      <div className="w-full h-4 rounded-full bg-slate-950 border border-slate-800 overflow-hidden relative">
                        <div
                          className="h-full bg-gradient-to-r from-emerald-500 to-cyan-400 transition-all duration-300"
                          style={{ width: `${hpPct}%` }}
                        />
                        <span className="absolute inset-0 flex items-center justify-center text-[10px] font-black text-white drop-shadow">
                          {u.hp} / {u.maxHp} HP ({hpPct}%)
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* RIGHT SIDE: ENEMY BOSS / CHALLENGER */}
              {enemyUnit && (
                <div
                  className={`relative p-5 rounded-3xl bg-slate-900/95 border-2 transition ${
                    turnIndex === 2
                      ? 'border-rose-500 shadow-[0_0_30px_rgba(244,63,94,0.4)]'
                      : 'border-rose-500/40'
                  }`}
                >
                  <div className="absolute -top-3 right-6 flex flex-col items-end pointer-events-none z-20">
                    {floatingTexts
                      .filter((f) => f.targetId === enemyUnit.id)
                      .slice(-2)
                      .map((fl) => (
                        <span
                          key={fl.id}
                          className={`text-base font-black drop-shadow animate-bounce ${fl.colorClass}`}
                        >
                          {fl.text}
                        </span>
                      ))}
                  </div>

                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-16 h-16 rounded-2xl bg-slate-950 border border-rose-500/50 flex items-center justify-center text-4xl">
                        {enemyUnit.avatar}
                      </div>
                      <div>
                        <span className="text-[10px] font-black px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40">
                          ĐỐI THỦ ĐẤU TRƯỜNG
                        </span>
                        <h3 className="text-base font-black text-white mt-1">{enemyUnit.name}</h3>
                        <p className="text-xs text-slate-400">
                          ⚔️ Công: {enemyUnit.stats.atk} • 🛡️ Thủ: {enemyUnit.stats.def} • 🌵 Phản: {enemyUnit.stats.reflectDamage}%
                        </p>
                      </div>
                    </div>
                    {enemyUnit.stunnedTurns > 0 && (
                      <span className="px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-400 text-xs font-black animate-pulse">
                        💫 ĐANG CHOÁNG
                      </span>
                    )}
                  </div>

                  {/* Enemy HP Bar */}
                  {(() => {
                    const ePct = Math.max(
                      0,
                      Math.min(100, Math.round((enemyUnit.hp / enemyUnit.maxHp) * 100))
                    );
                    return (
                      <div className="w-full h-5 rounded-full bg-slate-950 border border-slate-800 overflow-hidden relative">
                        <div
                          className="h-full bg-gradient-to-r from-rose-600 via-orange-500 to-amber-400 transition-all duration-300"
                          style={{ width: `${ePct}%` }}
                        />
                        <span className="absolute inset-0 flex items-center justify-center text-xs font-black text-white drop-shadow">
                          {enemyUnit.hp} / {enemyUnit.maxHp} HP ({ePct}%)
                        </span>
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>

            {/* ACTION SKILL BAR (When it's Player's Turn) */}
            {!battleResult && playerUnit && (
              <div className="p-4 rounded-2xl bg-slate-900/90 border border-cyan-500/30 space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-cyan-300">
                    ⚡ CHỌN CHIÊU THỨC CHIẾN ĐẤU (Hoặc bật Auto ở góc trên):
                  </span>
                  {turnIndex !== 0 && (
                    <span className="text-amber-300 font-semibold animate-pulse">
                      Đang chờ lượt hành động...
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap gap-2.5">
                  <button
                    onClick={() => handlePlayerAction('NORMAL')}
                    disabled={turnIndex !== 0 || autoMode}
                    className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 border border-slate-600 text-xs font-black text-white transition"
                  >
                    ⚔️ Trảm Kích (100% Công)
                  </button>

                  <button
                    onClick={() => handlePlayerAction('HEAVY')}
                    disabled={turnIndex !== 0 || autoMode}
                    className="px-4 py-2.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 disabled:opacity-40 border border-rose-400/50 text-xs font-black text-rose-200 transition"
                  >
                    💥 Trọng Kích (135% Công, +20% Bạo)
                  </button>

                  <button
                    onClick={() => handlePlayerAction('DEFEND')}
                    disabled={turnIndex !== 0 || autoMode}
                    className="px-4 py-2.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 disabled:opacity-40 border border-cyan-400/50 text-xs font-black text-cyan-200 transition"
                  >
                    🛡️ Khiên Tụ Lực (+25% Khiên & +10% HP)
                  </button>

                  {/* Unique S / SS Skills from Equipped Items */}
                  {playerUnit.stats.skills.map((sk) => {
                    const cd = playerUnit.skillCooldowns[sk.id] || 0;
                    return (
                      <button
                        key={sk.id}
                        onClick={() => handlePlayerAction('UNIQUE_SKILL', sk)}
                        disabled={turnIndex !== 0 || autoMode || cd > 0}
                        className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 via-rose-500 to-fuchsia-600 hover:opacity-95 disabled:opacity-40 text-slate-950 font-black text-xs shadow-[0_0_20px_rgba(251,191,36,0.4)] transition"
                        title={sk.description}
                      >
                        🔥 {sk.name} {cd > 0 ? `(Hồi: ${cd} lượt)` : '(SẴN SÀNG!)'}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* VICTORY / DEFEAT BANNER IN ARENA */}
            {battleResult && (
              <div className="p-5 rounded-2xl bg-slate-900 border-2 border-amber-400 shadow-[0_0_40px_rgba(251,191,36,0.3)] flex flex-wrap items-center justify-between gap-4 animate-in fade-in zoom-in-95 duration-200">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-amber-400/20 border border-amber-400 flex items-center justify-center">
                    {battleResult === 'VICTORY' ? (
                      <Trophy className="w-7 h-7 text-amber-300" />
                    ) : (
                      <Skull className="w-7 h-7 text-rose-400" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-white">
                      {battleResult === 'VICTORY'
                        ? `CHIẾN THẮNG! NHẬN +${earnedSpins} LƯỢT QUAY VŨ KHÍ!`
                        : 'THẤT BẠI TRÊN ĐẤU TRƯỜNG!'}
                    </h3>
                    <p className="text-xs text-slate-300">
                      {battleResult === 'VICTORY'
                        ? 'Bạn có thể dùng Lượt Quay vừa nhận để mở thêm Vũ Khí & Giáp hạng S / SS!'
                        : 'Hãy đánh thêm Caro để lấy Lượt Quay hoặc chỉnh lại 6 Ô Trang Bị.'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5">
                  {battleResult === 'VICTORY' && (
                    <button
                      onClick={() => {
                        onClose();
                        onOpenGacha();
                      }}
                      className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 text-slate-950 font-black text-xs shadow-[0_0_20px_rgba(251,191,36,0.5)]"
                    >
                      🎰 Mở Vòng Quay Ngay
                    </button>
                  )}
                  <button
                    onClick={() => setInBattle(false)}
                    className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs"
                  >
                    Quay Lại Danh Sách Ải
                  </button>
                </div>
              </div>
            )}

            {/* Battle Log Console */}
            <div className="flex-1 min-h-[120px] max-h-44 overflow-y-auto p-3.5 rounded-2xl bg-slate-950 border border-slate-800 font-mono text-xs space-y-1.5">
              {battleLogs.map((log, i) => (
                <div
                  key={i}
                  className={i === 0 ? 'text-cyan-300 font-bold' : 'text-slate-400'}
                >
                  {log}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
