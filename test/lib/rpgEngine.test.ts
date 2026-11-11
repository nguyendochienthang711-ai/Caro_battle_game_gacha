import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  DEFAULT_DROP_RATES,
  RARITY_META,
  ITEM_TEMPLATES,
  PRESET_COMPANIONS,
  CAMPAIGN_STAGES,
  PVP_CHALLENGERS,
  rollGachaItem,
  computeFighterStats,
} from '@/lib/rpgEngine';
import { ItemRarity, RarityDropRates, RpgItem } from '@/types/game';

const ALL_RARITIES: ItemRarity[] = ['C', 'B', 'A', 'S', 'SS'];

function ratesOnly(rarity: ItemRarity): RarityDropRates {
  return { C: 0, B: 0, A: 0, S: 0, SS: 0, [rarity]: 100 };
}

function makeItem(overrides: Partial<RpgItem> = {}): RpgItem {
  return {
    instanceId: 'item_test',
    templateId: 'test',
    name: 'Test Item',
    category: 'WEAPON',
    rarity: 'C',
    icon: '🗡️',
    atk: 0,
    def: 0,
    hpBonus: 0,
    critRate: 0,
    critDamage: 0,
    lifesteal: 0,
    reflectDamage: 0,
    armorPen: 0,
    obtainedAt: 0,
    ...overrides,
  };
}

beforeEach(() => {
  vi.spyOn(Math, 'random').mockReturnValue(0.5);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('DEFAULT_DROP_RATES', () => {
  it('sums to 100', () => {
    const total = ALL_RARITIES.reduce((acc, r) => acc + DEFAULT_DROP_RATES[r], 0);
    expect(total).toBe(100);
  });

  it('is ordered from common to rarest', () => {
    expect(DEFAULT_DROP_RATES.C).toBeGreaterThan(DEFAULT_DROP_RATES.B);
    expect(DEFAULT_DROP_RATES.B).toBeGreaterThan(DEFAULT_DROP_RATES.A);
    expect(DEFAULT_DROP_RATES.A).toBeGreaterThan(DEFAULT_DROP_RATES.S);
    expect(DEFAULT_DROP_RATES.S).toBeGreaterThan(DEFAULT_DROP_RATES.SS);
  });
});

describe('RARITY_META', () => {
  it('has metadata for every rarity', () => {
    ALL_RARITIES.forEach((rarity) => {
      expect(RARITY_META[rarity]).toBeDefined();
      expect(RARITY_META[rarity].label).toBeTruthy();
      expect(RARITY_META[rarity].color).toMatch(/^#[0-9a-f]{6}$/i);
    });
  });
});

describe('ITEM_TEMPLATES', () => {
  it('has unique template ids', () => {
    const ids = ITEM_TEMPLATES.map((t) => t.templateId);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('has at least one weapon and one armor per rarity', () => {
    ALL_RARITIES.forEach((rarity) => {
      const pool = ITEM_TEMPLATES.filter((t) => t.rarity === rarity);
      expect(pool.some((t) => t.category === 'WEAPON')).toBe(true);
      expect(pool.some((t) => t.category === 'ARMOR')).toBe(true);
    });
  });

  it('gives S and SS items a unique skill', () => {
    ITEM_TEMPLATES.filter((t) => t.rarity === 'S' || t.rarity === 'SS').forEach((t) => {
      expect(t.uniqueSkill).toBeDefined();
      expect(t.uniqueSkill!.cooldown).toBeGreaterThan(0);
    });
  });

  it('gives C and B items no unique skill', () => {
    ITEM_TEMPLATES.filter((t) => t.rarity === 'C' || t.rarity === 'B').forEach((t) => {
      expect(t.uniqueSkill).toBeUndefined();
    });
  });

  it('scales stats with rarity', () => {
    const maxAtk = (rarity: ItemRarity) =>
      Math.max(...ITEM_TEMPLATES.filter((t) => t.rarity === rarity).map((t) => t.atk));

    expect(maxAtk('C')).toBeLessThan(maxAtk('B'));
    expect(maxAtk('B')).toBeLessThan(maxAtk('A'));
    expect(maxAtk('A')).toBeLessThan(maxAtk('S'));
    expect(maxAtk('S')).toBeLessThan(maxAtk('SS'));
  });
});

describe('rollGachaItem', () => {
  it('returns an item from the requested rarity pool', () => {
    ALL_RARITIES.forEach((rarity) => {
      const item = rollGachaItem(ratesOnly(rarity));
      expect(item.rarity).toBe(rarity);
      expect(ITEM_TEMPLATES.some((t) => t.templateId === item.templateId)).toBe(true);
    });
  });

  it('generates a unique instance id and timestamp', () => {
    const item = rollGachaItem(DEFAULT_DROP_RATES);

    expect(item.instanceId).toMatch(/^item_\d+_[a-z0-9]+$/);
    expect(item.obtainedAt).toBeGreaterThan(0);
  });

  it('applies stat variance within 0.95..1.08', () => {
    for (let i = 0; i < 50; i++) {
      const item = rollGachaItem(ratesOnly('SS'));
      const template = ITEM_TEMPLATES.find((t) => t.templateId === item.templateId)!;

      expect(item.atk).toBeGreaterThanOrEqual(Math.round(template.atk * 0.95));
      expect(item.atk).toBeLessThanOrEqual(Math.round(template.atk * 1.08));
    }
  });

  it('falls back to C when every weight is zero', () => {
    const item = rollGachaItem({ C: 0, B: 0, A: 0, S: 0, SS: 0 });

    expect(item.rarity).toBe('C');
  });

  it('ignores negative and non-numeric weights', () => {
    const item = rollGachaItem({
      C: -50,
      B: 0,
      A: 0,
      S: 0,
      SS: 100,
    } as RarityDropRates);

    expect(item.rarity).toBe('SS');
  });

  it('respects relative weights', () => {
    // SS occupies [0, 96) of the 100 total weight, so 0.9 * 100 = 90 lands in SS.
    vi.spyOn(Math, 'random').mockReturnValue(0.9);
    const item = rollGachaItem({ C: 1, B: 1, A: 1, S: 1, SS: 96 });

    expect(item.rarity).toBe('SS');
  });
});

describe('computeFighterStats', () => {
  it('returns base stats with no equipment', () => {
    const stats = computeFighterStats('Hero', [null, null, null, null, null, null], []);

    expect(stats.name).toBe('Hero');
    expect(stats.maxHp).toBe(1200);
    expect(stats.atk).toBe(120);
    expect(stats.def).toBe(60);
    expect(stats.critRate).toBe(10);
    expect(stats.critDamage).toBe(150);
    expect(stats.skills).toEqual([]);
    expect(stats.equippedItems).toHaveLength(6);
    expect(stats.equippedItems.every((i) => i === null)).toBe(true);
  });

  it('adds item stats to the base stats', () => {
    const item = makeItem({ instanceId: 'a', atk: 100, def: 50, hpBonus: 300, critRate: 5 });
    const stats = computeFighterStats('Hero', ['a', null, null, null, null, null], [item]);

    expect(stats.atk).toBe(220);
    expect(stats.def).toBe(110);
    expect(stats.maxHp).toBe(1500);
    expect(stats.critRate).toBe(15);
  });

  it('ignores equipped ids missing from the inventory', () => {
    const stats = computeFighterStats('Hero', ['ghost', null, null, null, null, null], []);

    expect(stats.atk).toBe(120);
    expect(stats.equippedItems[0]).toBeNull();
  });

  it('caps crit rate and armor pen at 100', () => {
    const items = Array.from({ length: 6 }, (_, i) =>
      makeItem({ instanceId: `i${i}`, critRate: 40, armorPen: 40 })
    );
    const stats = computeFighterStats(
      'Hero',
      items.map((i) => i.instanceId),
      items
    );

    expect(stats.critRate).toBe(100);
    expect(stats.armorPen).toBe(100);
  });

  it('collects unique skills without duplicates', () => {
    const skill = {
      id: 'skill_x',
      name: 'X',
      description: 'X',
      cooldown: 3,
      type: 'ACTIVE_ATTACK' as const,
      multiplier: 2,
    };
    const items = [
      makeItem({ instanceId: 'a', uniqueSkill: skill }),
      makeItem({ instanceId: 'b', uniqueSkill: skill }),
    ];
    const stats = computeFighterStats('Hero', ['a', 'b', null, null, null, null], items);

    expect(stats.skills).toHaveLength(1);
  });

  it('increases power score with better equipment', () => {
    const weak = computeFighterStats('Hero', [null, null, null, null, null, null], []);
    const strongItem = makeItem({ instanceId: 'a', atk: 500, def: 300, hpBonus: 2000 });
    const strong = computeFighterStats('Hero', ['a', null, null, null, null, null], [strongItem]);

    expect(strong.powerScore).toBeGreaterThan(weak.powerScore);
  });

  it('counts each unique skill in the power score', () => {
    const skill = {
      id: 'skill_x',
      name: 'X',
      description: 'X',
      cooldown: 3,
      type: 'ACTIVE_ATTACK' as const,
    };
    const withSkill = computeFighterStats(
      'Hero',
      ['a', null, null, null, null, null],
      [makeItem({ instanceId: 'a', uniqueSkill: skill })]
    );
    const withoutSkill = computeFighterStats(
      'Hero',
      ['a', null, null, null, null, null],
      [makeItem({ instanceId: 'a' })]
    );

    expect(withSkill.powerScore - withoutSkill.powerScore).toBe(1200);
  });
});

describe('preset data', () => {
  it('has three companions with increasing power', () => {
    expect(PRESET_COMPANIONS).toHaveLength(3);
    expect(PRESET_COMPANIONS[0].stats.powerScore).toBeLessThan(
      PRESET_COMPANIONS[1].stats.powerScore
    );
    expect(PRESET_COMPANIONS[1].stats.powerScore).toBeLessThan(
      PRESET_COMPANIONS[2].stats.powerScore
    );
  });

  it('has five campaign stages with increasing difficulty', () => {
    expect(CAMPAIGN_STAGES).toHaveLength(5);
    for (let i = 1; i < CAMPAIGN_STAGES.length; i++) {
      expect(CAMPAIGN_STAGES[i].recommendedPower).toBeGreaterThan(
        CAMPAIGN_STAGES[i - 1].recommendedPower
      );
    }
  });

  it('gives every stage a positive spin reward', () => {
    CAMPAIGN_STAGES.forEach((stage) => expect(stage.rewardSpins).toBeGreaterThan(0));
  });

  it('has three PvP challengers', () => {
    expect(PVP_CHALLENGERS).toHaveLength(3);
    PVP_CHALLENGERS.forEach((c) => {
      expect(c.stats.skills.length).toBeGreaterThan(0);
      expect(c.stats.powerScore).toBeGreaterThan(0);
    });
  });
});
