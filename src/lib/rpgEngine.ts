import {
  ItemRarity,
  RarityDropRates,
  RpgItem,
  FighterStats,
  UniqueSkill,
  TeammateFighter,
} from '../types/game';

export const DEFAULT_DROP_RATES: RarityDropRates = {
  C: 45,
  B: 28,
  A: 17,
  S: 8,
  SS: 2,
};

export const RARITY_META: Record<
  ItemRarity,
  {
    label: string;
    color: string;
    bgBadge: string;
    border: string;
    glow: string;
    textGrad: string;
  }
> = {
  C: {
    label: 'Bình Thường (C)',
    color: '#94a3b8',
    bgBadge: 'bg-slate-700/60 text-slate-200 border-slate-500/50',
    border: 'border-slate-600',
    glow: '',
    textGrad: 'text-slate-300',
  },
  B: {
    label: 'Hiếm (B)',
    color: '#38bdf8',
    bgBadge: 'bg-sky-500/20 text-sky-300 border-sky-400/50',
    border: 'border-sky-500/70',
    glow: 'shadow-[0_0_15px_rgba(56,189,248,0.25)]',
    textGrad: 'text-sky-300',
  },
  A: {
    label: 'Quý Hiếm (A)',
    color: '#c084fc',
    bgBadge: 'bg-purple-500/25 text-purple-200 border-purple-400/60',
    border: 'border-purple-500/80',
    glow: 'shadow-[0_0_20px_rgba(192,132,252,0.35)]',
    textGrad: 'bg-gradient-to-r from-purple-300 to-fuchsia-400 bg-clip-text text-transparent',
  },
  S: {
    label: 'Siêu Hiếm (S)',
    color: '#fbbf24',
    bgBadge: 'bg-amber-500/25 text-amber-200 border-amber-400/80',
    border: 'border-amber-400',
    glow: 'shadow-[0_0_28px_rgba(251,191,36,0.5)]',
    textGrad: 'bg-gradient-to-r from-amber-200 via-yellow-400 to-orange-400 bg-clip-text text-transparent',
  },
  SS: {
    label: 'Tối Thượng (SS)',
    color: '#ff007f',
    bgBadge: 'bg-gradient-to-r from-rose-600/40 to-fuchsia-600/40 text-rose-200 border-rose-400',
    border: 'border-rose-500',
    glow: 'shadow-[0_0_35px_rgba(255,0,127,0.7)]',
    textGrad: 'bg-gradient-to-r from-rose-400 via-amber-300 to-cyan-300 bg-clip-text text-transparent',
  },
};

type ItemTemplate = Omit<RpgItem, 'instanceId' | 'obtainedAt'>;

export const ITEM_TEMPLATES: ItemTemplate[] = [
  // ==================== TIER C (BÌNH THƯỜNG) ====================
  {
    templateId: 'c_wpn_1',
    name: 'Dao Găm Xung Kích C-01',
    category: 'WEAPON',
    rarity: 'C',
    icon: '🗡️',
    atk: 45,
    def: 0,
    hpBonus: 0,
    critRate: 0,
    critDamage: 0,
    lifesteal: 0,
    reflectDamage: 0,
    armorPen: 0,
  },
  {
    templateId: 'c_wpn_2',
    name: 'Súng Lục Điện Từ C-02',
    category: 'WEAPON',
    rarity: 'C',
    icon: '🔫',
    atk: 52,
    def: 0,
    hpBonus: 0,
    critRate: 0,
    critDamage: 0,
    lifesteal: 0,
    reflectDamage: 0,
    armorPen: 0,
  },
  {
    templateId: 'c_arm_1',
    name: 'Giáp Tuần Tra Hợp Kim',
    category: 'ARMOR',
    rarity: 'C',
    icon: '🦺',
    atk: 0,
    def: 30,
    hpBonus: 180,
    critRate: 0,
    critDamage: 0,
    lifesteal: 0,
    reflectDamage: 0,
    armorPen: 0,
  },
  {
    templateId: 'c_arm_2',
    name: 'Khiên Carbon Tân Thủ',
    category: 'ARMOR',
    rarity: 'C',
    icon: '🛡️',
    atk: 0,
    def: 36,
    hpBonus: 150,
    critRate: 0,
    critDamage: 0,
    lifesteal: 0,
    reflectDamage: 0,
    armorPen: 0,
  },

  // ==================== TIER B (HIẾM) ====================
  {
    templateId: 'b_wpn_1',
    name: 'Kiếm Laser Lam Quang',
    category: 'WEAPON',
    rarity: 'B',
    icon: '⚔️',
    atk: 110,
    def: 10,
    hpBonus: 50,
    critRate: 4,
    critDamage: 0,
    lifesteal: 0,
    reflectDamage: 0,
    armorPen: 0,
  },
  {
    templateId: 'b_wpn_2',
    name: 'Trường Thương Điện Cao Áp',
    category: 'WEAPON',
    rarity: 'B',
    icon: '🔱',
    atk: 125,
    def: 0,
    hpBonus: 0,
    critRate: 5,
    critDamage: 10,
    lifesteal: 0,
    reflectDamage: 0,
    armorPen: 0,
  },
  {
    templateId: 'b_arm_1',
    name: 'Giáp Titan Quang Học',
    category: 'ARMOR',
    rarity: 'B',
    icon: '🥋',
    atk: 0,
    def: 75,
    hpBonus: 420,
    critRate: 0,
    critDamage: 0,
    lifesteal: 0,
    reflectDamage: 5,
    armorPen: 0,
  },
  {
    templateId: 'b_arm_2',
    name: 'Khiên Từ Trường Hạng Nặng',
    category: 'ARMOR',
    rarity: 'B',
    icon: '💠',
    atk: 15,
    def: 85,
    hpBonus: 380,
    critRate: 0,
    critDamage: 0,
    lifesteal: 0,
    reflectDamage: 0,
    armorPen: 0,
  },

  // ==================== TIER A (QUÝ HIẾM - CÓ HÚT MÁU / PHẢN ĐÒN / BẠO KÍCH) ====================
  {
    templateId: 'a_wpn_1',
    name: 'Huyết Kiếm Neon Crimson',
    category: 'WEAPON',
    rarity: 'A',
    icon: '🩸',
    atk: 230,
    def: 15,
    hpBonus: 180,
    critRate: 12,
    critDamage: 20,
    lifesteal: 18,
    reflectDamage: 0,
    armorPen: 10,
  },
  {
    templateId: 'a_wpn_2',
    name: 'Pháo Bắn Tỉa Tử Thần',
    category: 'WEAPON',
    rarity: 'A',
    icon: '☄️',
    atk: 260,
    def: 0,
    hpBonus: 0,
    critRate: 25,
    critDamage: 45,
    lifesteal: 0,
    reflectDamage: 0,
    armorPen: 25,
  },
  {
    templateId: 'a_arm_1',
    name: 'Giáp Gai Phản Xạ Plasma',
    category: 'ARMOR',
    rarity: 'A',
    icon: '🌵',
    atk: 30,
    def: 165,
    hpBonus: 850,
    critRate: 0,
    critDamage: 0,
    lifesteal: 5,
    reflectDamage: 28,
    armorPen: 0,
  },
  {
    templateId: 'a_arm_2',
    name: 'Chiến Giáp Huyết Ma Hộ Vệ',
    category: 'ARMOR',
    rarity: 'A',
    icon: '🧛',
    atk: 45,
    def: 145,
    hpBonus: 950,
    critRate: 10,
    critDamage: 15,
    lifesteal: 15,
    reflectDamage: 18,
    armorPen: 0,
  },

  // ==================== TIER S (SIÊU HIẾM - KỸ NĂNG ĐỘC NHẤT) ====================
  {
    templateId: 's_wpn_1',
    name: 'Đoản Đao Xé Rách Không Gian',
    category: 'WEAPON',
    rarity: 'S',
    icon: '⚡',
    atk: 480,
    def: 35,
    hpBonus: 350,
    critRate: 25,
    critDamage: 50,
    lifesteal: 12,
    reflectDamage: 0,
    armorPen: 35,
    uniqueSkill: {
      id: 'skill_void_slash',
      name: 'Trảm Kích Không Gian',
      description: 'Chém xuyên chiều không gian gây 250% ATK, bỏ qua 60% Phòng Thủ và làm Choáng mục tiêu 1 lượt!',
      cooldown: 3,
      type: 'ACTIVE_ATTACK',
      multiplier: 2.5,
      ignoreDefPercent: 60,
      stunTurns: 1,
    },
  },
  {
    templateId: 's_wpn_2',
    name: 'Lưỡi Hái Huyết Nguyệt Cyber',
    category: 'WEAPON',
    rarity: 'S',
    icon: '🌙',
    atk: 450,
    def: 40,
    hpBonus: 500,
    critRate: 20,
    critDamage: 35,
    lifesteal: 28,
    reflectDamage: 10,
    armorPen: 20,
    uniqueSkill: {
      id: 'skill_blood_harvest',
      name: 'Huyết Tế Đoạt Mệnh',
      description: 'Gây 220% ATK + 12% Máu tối đa của địch thành sát thương chuẩn, đồng thời Hút 65% sát thương thành Máu!',
      cooldown: 3,
      type: 'ACTIVE_ATTACK',
      multiplier: 2.2,
      trueDamagePercent: 12,
      lifestealBonus: 65,
    },
  },
  {
    templateId: 's_arm_1',
    name: 'Giáp Phản Pháo Từ Trường S-Rank',
    category: 'ARMOR',
    rarity: 'S',
    icon: '🔮',
    atk: 80,
    def: 340,
    hpBonus: 1800,
    critRate: 10,
    critDamage: 20,
    lifesteal: 10,
    reflectDamage: 38,
    armorPen: 0,
    uniqueSkill: {
      id: 'skill_plasma_mirror',
      name: 'Khiên Phản Pháo Tuyệt Đối',
      description: 'Tạo lớp Khiên chắn bằng 40% HP tối đa, hồi 15% HP và bắn tia Phản Pháo gây 200% DEF sát thương chuẩn!',
      cooldown: 3,
      type: 'ACTIVE_BUFF',
      shieldPercent: 40,
      multiplier: 2.0,
    },
  },

  // ==================== TIER SS (TỐI THƯỢNG - TUYỆT KỸ THẦN THOẠI) ====================
  {
    templateId: 'ss_wpn_1',
    name: 'Thần Kiếm Hố Đen Vũ Trụ [SS]',
    category: 'WEAPON',
    rarity: 'SS',
    icon: '🌌',
    atk: 980,
    def: 120,
    hpBonus: 1200,
    critRate: 40,
    critDamage: 90,
    lifesteal: 30,
    reflectDamage: 15,
    armorPen: 55,
    uniqueSkill: {
      id: 'skill_blackhole_singularity',
      name: 'TUYỆT KỸ SS: Hố Đen Hủy Diệt Ngân Hà',
      description: 'Triệu hồi Hố Đen chém 3 liên kích gây 380% ATK (Xuyên 100% Giáp), Hút 50% Máu và làm Choáng kẻ địch 1 lượt!',
      cooldown: 3,
      type: 'ACTIVE_ATTACK',
      multiplier: 3.8,
      ignoreDefPercent: 100,
      lifestealBonus: 50,
      stunTurns: 1,
    },
  },
  {
    templateId: 'ss_wpn_2',
    name: 'Pháo Thần Quang Tận Thế [SS]',
    category: 'WEAPON',
    rarity: 'SS',
    icon: '👑',
    atk: 1080,
    def: 80,
    hpBonus: 950,
    critRate: 45,
    critDamage: 110,
    lifesteal: 20,
    reflectDamage: 10,
    armorPen: 65,
    uniqueSkill: {
      id: 'skill_judgment_ray',
      name: 'TUYỆT KỸ SS: Phán Quyết Tối Thượng',
      description: 'Bắn chùm tia hủy diệt gây 350% ATK + 25% Máu tối đa của đối thủ thành Sát Thương Chuẩn không thể cản phá!',
      cooldown: 3,
      type: 'ACTIVE_ATTACK',
      multiplier: 3.5,
      ignoreDefPercent: 80,
      trueDamagePercent: 25,
    },
  },
  {
    templateId: 'ss_arm_1',
    name: 'Thần Giáp Phượng Hoàng Bất Tử [SS]',
    category: 'ARMOR',
    rarity: 'SS',
    icon: '🔥',
    atk: 260,
    def: 680,
    hpBonus: 3600,
    critRate: 20,
    critDamage: 40,
    lifesteal: 25,
    reflectDamage: 50,
    armorPen: 20,
    uniqueSkill: {
      id: 'skill_phoenix_immortal',
      name: 'TUYỆT KỸ SS: Niết Bàn Bất Tử',
      description: 'Nội tại: Khi bị hạ gục lần đầu sẽ HỒI SINH ngay với 65% HP! Kích hoạt chủ động: Tạo Khiên 50% HP + Nổ lửa gây 280% ATK!',
      cooldown: 3,
      type: 'PASSIVE_REVIVE',
      shieldPercent: 50,
      multiplier: 2.8,
    },
  },
];

/**
 * Roll a random item according to the user's configured drop rates
 */
export function rollGachaItem(dropRates: RarityDropRates): RpgItem {
  const rarities: ItemRarity[] = ['SS', 'S', 'A', 'B', 'C'];
  const totalWeight = rarities.reduce((acc, r) => acc + Math.max(0, Number(dropRates[r]) || 0), 0);

  let chosenRarity: ItemRarity = 'C';
  if (totalWeight > 0) {
    let rand = Math.random() * totalWeight;
    for (const r of rarities) {
      const w = Math.max(0, Number(dropRates[r]) || 0);
      if (rand < w) {
        chosenRarity = r;
        break;
      }
      rand -= w;
    }
  }

  const pool = ITEM_TEMPLATES.filter((t) => t.rarity === chosenRarity);
  const template = pool[Math.floor(Math.random() * pool.length)] || ITEM_TEMPLATES[0];

  // Slight random stat variance (0.95 to 1.08) for excitement
  const variance = () => 0.95 + Math.random() * 0.13;

  return {
    ...template,
    instanceId: `item_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    atk: Math.round(template.atk * variance()),
    def: Math.round(template.def * variance()),
    hpBonus: Math.round(template.hpBonus * variance()),
    obtainedAt: Date.now(),
  };
}

/**
 * Compute full fighter stats from 6 free-form equipment slots
 */
export function computeFighterStats(
  name: string,
  equippedSlots: (string | null)[],
  inventory: RpgItem[]
): FighterStats {
  let maxHp = 1200;
  let atk = 120;
  let def = 60;
  let critRate = 10;
  let critDamage = 150;
  let lifesteal = 0;
  let reflectDamage = 0;
  let armorPen = 0;
  const skills: UniqueSkill[] = [];
  const equippedItems: (RpgItem | null)[] = [];

  for (let i = 0; i < 6; i++) {
    const instanceId = equippedSlots[i] || null;
    const item = instanceId ? inventory.find((it) => it.instanceId === instanceId) || null : null;
    equippedItems.push(item);

    if (item) {
      maxHp += item.hpBonus;
      atk += item.atk;
      def += item.def;
      critRate += item.critRate;
      critDamage += item.critDamage;
      lifesteal += item.lifesteal;
      reflectDamage += item.reflectDamage;
      armorPen += item.armorPen;

      if (item.uniqueSkill && !skills.some((s) => s.id === item.uniqueSkill!.id)) {
        skills.push(item.uniqueSkill);
      }
    }
  }

  // Cap reasonable percentages
  critRate = Math.min(100, critRate);
  armorPen = Math.min(100, armorPen);

  const powerScore = Math.round(
    atk * 4.5 +
      def * 3.8 +
      maxHp * 0.45 +
      critRate * 18 +
      critDamage * 4 +
      lifesteal * 22 +
      reflectDamage * 20 +
      armorPen * 16 +
      skills.length * 1200
  );

  return {
    name,
    maxHp,
    atk,
    def,
    critRate,
    critDamage,
    lifesteal,
    reflectDamage,
    armorPen,
    skills,
    equippedItems,
    powerScore,
  };
}

// ==================== PRESET AI COMPANIONS (ĐỒNG ĐỘI TRỢ CHIẾN) ====================
export const PRESET_COMPANIONS: TeammateFighter[] = [
  {
    id: 'comp_valkyrie',
    name: 'Valkyrie Astra',
    title: 'Xạ Thủ Bạo Kích (Hạng A)',
    avatar: '🧝‍♀️',
    stats: {
      name: 'Valkyrie Astra',
      maxHp: 2400,
      atk: 460,
      def: 180,
      critRate: 35,
      critDamage: 195,
      lifesteal: 15,
      reflectDamage: 10,
      armorPen: 25,
      skills: [
        {
          id: 'comp_skill_astra',
          name: 'Mưa Tên Ánh Sáng',
          description: 'Bắn liên hoàn gây 210% ATK xuyên 40% giáp địch.',
          cooldown: 3,
          type: 'ACTIVE_ATTACK',
          multiplier: 2.1,
          ignoreDefPercent: 40,
        },
      ],
      equippedItems: [],
      powerScore: 5200,
    },
  },
  {
    id: 'comp_titan',
    name: 'Titan Reinhardt',
    title: 'Pháo Đài Thiết Giáp (Hạng S)',
    avatar: '🤖',
    stats: {
      name: 'Titan Reinhardt',
      maxHp: 4500,
      atk: 340,
      def: 480,
      critRate: 15,
      critDamage: 160,
      lifesteal: 12,
      reflectDamage: 35,
      armorPen: 15,
      skills: [
        {
          id: 'comp_skill_titan',
          name: 'Khiên Chấn Động Địa Cầu',
          description: 'Tạo Khiên 35% HP và đập búa gây 220% ATK.',
          cooldown: 3,
          type: 'ACTIVE_BUFF',
          shieldPercent: 35,
          multiplier: 2.2,
        },
      ],
      equippedItems: [],
      powerScore: 6800,
    },
  },
  {
    id: 'comp_seraph',
    name: 'Seraphina Nova',
    title: 'Kiếm Thánh Hố Đen (Hạng SS)',
    avatar: '👼',
    stats: {
      name: 'Seraphina Nova',
      maxHp: 5800,
      atk: 820,
      def: 420,
      critRate: 42,
      critDamage: 220,
      lifesteal: 28,
      reflectDamage: 25,
      armorPen: 45,
      skills: [
        {
          id: 'comp_skill_seraph',
          name: 'Thiên Phạt Tinh Vân',
          description: 'Chém 280% ATK xuyên 70% giáp và hồi máu cho toàn đội.',
          cooldown: 3,
          type: 'ACTIVE_ATTACK',
          multiplier: 2.8,
          ignoreDefPercent: 70,
          lifestealBonus: 40,
        },
      ],
      equippedItems: [],
      powerScore: 11500,
    },
  },
];

// ==================== CAMPAIGN STAGES (CHẾ ĐỘ VƯỢT ẢI) ====================
export interface CampaignStage {
  id: number;
  name: string;
  bossTitle: string;
  avatar: string;
  recommendedPower: number;
  rewardSpins: number;
  enemyStats: FighterStats;
}

export const CAMPAIGN_STAGES: CampaignStage[] = [
  {
    id: 1,
    name: 'Ải 1: Khu Phố Ngầm Neon',
    bossTitle: 'Trinh Sát Cơ Giới C-Rank',
    avatar: '👾',
    recommendedPower: 1800,
    rewardSpins: 1,
    enemyStats: {
      name: 'Trinh Sát Cơ Giới',
      maxHp: 1800,
      atk: 190,
      def: 80,
      critRate: 10,
      critDamage: 150,
      lifesteal: 0,
      reflectDamage: 0,
      armorPen: 0,
      skills: [],
      equippedItems: [],
      powerScore: 1850,
    },
  },
  {
    id: 2,
    name: 'Ải 2: Trạm Năng Lượng Lõi Từ',
    bossTitle: 'Đội Trưởng Thiết Giáp B-Rank',
    avatar: '🦾',
    recommendedPower: 3500,
    rewardSpins: 1,
    enemyStats: {
      name: 'Đội Trưởng Thiết Giáp',
      maxHp: 3400,
      atk: 320,
      def: 190,
      critRate: 15,
      critDamage: 165,
      lifesteal: 8,
      reflectDamage: 12,
      armorPen: 10,
      skills: [],
      equippedItems: [],
      powerScore: 3600,
    },
  },
  {
    id: 3,
    name: 'Ải 3: Đấu Trường Huyết Nguyệt',
    bossTitle: 'Sát Thủ Bóng Đêm A-Rank',
    avatar: '🥷',
    recommendedPower: 6500,
    rewardSpins: 2,
    enemyStats: {
      name: 'Sát Thủ Bóng Đêm',
      maxHp: 5600,
      atk: 620,
      def: 280,
      critRate: 32,
      critDamage: 195,
      lifesteal: 22,
      reflectDamage: 15,
      armorPen: 30,
      skills: [
        {
          id: 'boss_skill_3',
          name: 'Ám Sát Liên Hoàn',
          description: 'Đâm xuyên tâm gây 220% ATK bỏ qua 50% giáp.',
          cooldown: 3,
          type: 'ACTIVE_ATTACK',
          multiplier: 2.2,
          ignoreDefPercent: 50,
        },
      ],
      equippedItems: [],
      powerScore: 6800,
    },
  },
  {
    id: 4,
    name: 'Ải 4: Pháo Đài Trên Không',
    bossTitle: 'Tướng Quân Lôi Điện S-Rank',
    avatar: '⚡',
    recommendedPower: 11000,
    rewardSpins: 2,
    enemyStats: {
      name: 'Tướng Quân Lôi Điện',
      maxHp: 9800,
      atk: 980,
      def: 520,
      critRate: 35,
      critDamage: 210,
      lifesteal: 20,
      reflectDamage: 30,
      armorPen: 40,
      skills: [
        {
          id: 'boss_skill_4',
          name: 'Lôi Đình Vạn Quân',
          description: 'Giáng sấm sét gây 260% ATK và làm choáng 1 lượt.',
          cooldown: 3,
          type: 'ACTIVE_ATTACK',
          multiplier: 2.6,
          ignoreDefPercent: 50,
          stunTurns: 1,
        },
      ],
      equippedItems: [],
      powerScore: 11800,
    },
  },
  {
    id: 5,
    name: 'Ải 5: Ngai Vàng Hố Đen Tối Thượng',
    bossTitle: 'ĐẠI ĐẾ CYBER OMEGA [BOSS SS]',
    avatar: '👹',
    recommendedPower: 18000,
    rewardSpins: 5,
    enemyStats: {
      name: 'ĐẠI ĐẾ CYBER OMEGA [SS]',
      maxHp: 18500,
      atk: 1650,
      def: 880,
      critRate: 45,
      critDamage: 240,
      lifesteal: 30,
      reflectDamage: 35,
      armorPen: 55,
      skills: [
        {
          id: 'boss_skill_5',
          name: 'TUYỆT KỸ ĐẠI ĐẾ: Vụ Nổ Big Bang',
          description: 'Gây 320% ATK xuyên 80% giáp + 15% HP tối đa thành sát thương chuẩn!',
          cooldown: 3,
          type: 'ACTIVE_ATTACK',
          multiplier: 3.2,
          ignoreDefPercent: 80,
          trueDamagePercent: 15,
        },
      ],
      equippedItems: [],
      powerScore: 21000,
    },
  },
];

// ==================== SOLO 1v1 PVP ARENA CHALLENGERS ====================
export const PVP_CHALLENGERS: TeammateFighter[] = [
  {
    id: 'pvp_1',
    name: 'Kaito_Blade99',
    title: 'Kiếm Sĩ Thuần Công (6 Vũ Khí)',
    avatar: '🦊',
    stats: {
      name: 'Kaito_Blade99',
      maxHp: 2800,
      atk: 780,
      def: 140,
      critRate: 45,
      critDamage: 230,
      lifesteal: 25,
      reflectDamage: 5,
      armorPen: 50,
      skills: [ITEM_TEMPLATES.find((i) => i.templateId === 's_wpn_1')!.uniqueSkill!],
      equippedItems: [],
      powerScore: 7600,
    },
  },
  {
    id: 'pvp_2',
    name: 'IronWall_VN',
    title: 'Thánh Phản Đòn (6 Giáp Gai)',
    avatar: '🦏',
    stats: {
      name: 'IronWall_VN',
      maxHp: 8200,
      atk: 360,
      def: 920,
      critRate: 15,
      critDamage: 160,
      lifesteal: 15,
      reflectDamage: 65,
      armorPen: 15,
      skills: [ITEM_TEMPLATES.find((i) => i.templateId === 's_arm_1')!.uniqueSkill!],
      equippedItems: [],
      powerScore: 9400,
    },
  },
  {
    id: 'pvp_3',
    name: 'CyberGod_SS',
    title: 'Quán Quân Thần Thoại [Full SS]',
    avatar: '🐉',
    stats: {
      name: 'CyberGod_SS',
      maxHp: 11500,
      atk: 1580,
      def: 760,
      critRate: 50,
      critDamage: 250,
      lifesteal: 35,
      reflectDamage: 40,
      armorPen: 60,
      skills: [
        ITEM_TEMPLATES.find((i) => i.templateId === 'ss_wpn_1')!.uniqueSkill!,
        ITEM_TEMPLATES.find((i) => i.templateId === 'ss_arm_1')!.uniqueSkill!,
      ],
      equippedItems: [],
      powerScore: 17500,
    },
  },
];
