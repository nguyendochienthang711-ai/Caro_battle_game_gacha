import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  getDefaultRpgProfile,
  loadRpgProfile,
  saveRpgProfile,
  loadScoreboard,
  saveScoreboard,
  loadMatchHistory,
  saveMatchHistory,
  clearMatchHistory,
  loadSettings,
  saveSettings,
  loadActiveGame,
  saveActiveGame,
  clearActiveGame,
  SavedActiveGame,
  SavedSettings,
} from '@/lib/storage';
import { STORAGE_KEYS, MatchHistoryItem, ScoreboardData } from '@/types/game';
import { DEFAULT_DROP_RATES } from '@/lib/rpgEngine';

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('getDefaultRpgProfile', () => {
  it('grants 3 starter spin tickets', () => {
    expect(getDefaultRpgProfile().spinTickets).toBe(3);
  });

  it('starts with an empty inventory and six empty slots', () => {
    const profile = getDefaultRpgProfile();

    expect(profile.inventory).toEqual([]);
    expect(profile.equippedSlots).toEqual([null, null, null, null, null, null]);
    expect(profile.clearedStageIds).toEqual([]);
  });

  it('uses the default drop rates and first companion', () => {
    const profile = getDefaultRpgProfile();

    expect(profile.dropRates).toEqual(DEFAULT_DROP_RATES);
    expect(profile.selectedCompanionId).toBe('comp_valkyrie');
  });

  it('returns a fresh object each call', () => {
    const a = getDefaultRpgProfile();
    const b = getDefaultRpgProfile();
    a.equippedSlots[0] = 'x';

    expect(b.equippedSlots[0]).toBeNull();
  });
});

describe('RPG profile persistence', () => {
  it('round-trips a saved profile', () => {
    const profile = { ...getDefaultRpgProfile(), spinTickets: 42, totalSpins: 7 };
    saveRpgProfile(profile);

    expect(loadRpgProfile()).toEqual(profile);
  });

  it('returns defaults when nothing is stored', () => {
    expect(loadRpgProfile()).toEqual(getDefaultRpgProfile());
  });

  it('merges partial stored data with defaults', () => {
    localStorage.setItem(STORAGE_KEYS.RPG_PROFILE, JSON.stringify({ spinTickets: 9 }));

    const profile = loadRpgProfile();

    expect(profile.spinTickets).toBe(9);
    expect(profile.dropRates).toEqual(DEFAULT_DROP_RATES);
    expect(profile.equippedSlots).toHaveLength(6);
  });

  it('repairs a malformed equippedSlots array', () => {
    localStorage.setItem(
      STORAGE_KEYS.RPG_PROFILE,
      JSON.stringify({ equippedSlots: ['a', 'b'] })
    );

    expect(loadRpgProfile().equippedSlots).toEqual([null, null, null, null, null, null]);
  });

  it('falls back to defaults on corrupt JSON', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    localStorage.setItem(STORAGE_KEYS.RPG_PROFILE, '{not json');

    expect(loadRpgProfile()).toEqual(getDefaultRpgProfile());
  });
});

describe('scoreboard persistence', () => {
  const scoreboard: ScoreboardData = {
    X: 3,
    O: 2,
    draws: 1,
    streakPlayer: 'X',
    streakCount: 2,
  };

  it('round-trips a scoreboard', () => {
    saveScoreboard(scoreboard);

    expect(loadScoreboard()).toEqual(scoreboard);
  });

  it('returns a zeroed scoreboard when empty', () => {
    expect(loadScoreboard()).toEqual({
      X: 0,
      O: 0,
      draws: 0,
      streakPlayer: null,
      streakCount: 0,
    });
  });

  it('falls back to zeros on corrupt JSON', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    localStorage.setItem(STORAGE_KEYS.SCOREBOARD, 'oops');

    expect(loadScoreboard().X).toBe(0);
  });
});

describe('match history persistence', () => {
  const match: MatchHistoryItem = {
    id: 'match_1',
    date: '01/01 10:00',
    mode: 'LOCAL_2P',
    winner: 'X',
    playerXName: 'A',
    playerOName: 'B',
    totalMoves: 9,
    durationSec: 60,
    winningDirection: 'Hàng Ngang',
    moves: [],
  };

  it('round-trips match history', () => {
    saveMatchHistory([match]);

    expect(loadMatchHistory()).toEqual([match]);
  });

  it('returns an empty list when empty', () => {
    expect(loadMatchHistory()).toEqual([]);
  });

  it('clears match history', () => {
    saveMatchHistory([match]);
    clearMatchHistory();

    expect(loadMatchHistory()).toEqual([]);
  });

  it('falls back to an empty list on corrupt JSON', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    localStorage.setItem(STORAGE_KEYS.MATCH_HISTORY, 'nope');

    expect(loadMatchHistory()).toEqual([]);
  });
});

describe('settings persistence', () => {
  const settings: SavedSettings = {
    playerNames: { X: 'An', O: 'Bình' },
    turnTimeLimit: 60,
  };

  it('round-trips settings', () => {
    saveSettings(settings);

    expect(loadSettings()).toEqual(settings);
  });

  it('returns null when nothing is stored', () => {
    expect(loadSettings()).toBeNull();
  });

  it('falls back to null on corrupt JSON', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    localStorage.setItem(STORAGE_KEYS.SETTINGS, '<<<');

    expect(loadSettings()).toBeNull();
  });
});

describe('active game persistence', () => {
  const game: SavedActiveGame = {
    moves: [
      { step: 1, row: 0, col: 0, player: 'X', coord: 'A1', timestamp: 1 },
      { step: 2, row: 1, col: 1, player: 'O', coord: 'B2', timestamp: 2 },
    ],
    currentPlayer: 'X',
    winnerInfo: null,
    gameMode: 'LOCAL_2P',
    updatedAt: 123,
  };

  it('round-trips an active game', () => {
    saveActiveGame(game);

    expect(loadActiveGame()).toEqual(game);
  });

  it('returns null when nothing is stored', () => {
    expect(loadActiveGame()).toBeNull();
  });

  it('clears the active game', () => {
    saveActiveGame(game);
    clearActiveGame();

    expect(loadActiveGame()).toBeNull();
  });

  it('falls back to null on corrupt JSON', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    localStorage.setItem(STORAGE_KEYS.ACTIVE_GAME, '}{');

    expect(loadActiveGame()).toBeNull();
  });
});

describe('storage failures', () => {
  it('does not throw when localStorage.setItem fails', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError');
    });

    expect(() => saveScoreboard({ X: 1, O: 0, draws: 0, streakPlayer: null, streakCount: 0 })).not.toThrow();
  });
});
