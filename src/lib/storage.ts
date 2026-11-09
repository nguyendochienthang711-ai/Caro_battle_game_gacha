import {
  STORAGE_KEYS,
  ScoreboardData,
  MatchHistoryItem,
  MoveRecord,
  PlayerSymbol,
  GameMode,
  WinnerInfo,
  RpgProfileData,
} from '../types/game';
import { DEFAULT_DROP_RATES } from './rpgEngine';

export interface SavedActiveGame {
  moves: MoveRecord[];
  currentPlayer: PlayerSymbol;
  winnerInfo: WinnerInfo | null;
  gameMode: GameMode;
  updatedAt: number;
}

export interface SavedSettings {
  playerNames: { X: string; O: string };
  turnTimeLimit: number;
}

const isClient = typeof window !== 'undefined';

export function getDefaultRpgProfile(): RpgProfileData {
  return {
    spinTickets: 3, // Tặng sẵn 3 lượt quay tân thủ
    totalSpins: 0,
    clearedStageIds: [],
    dropRates: { ...DEFAULT_DROP_RATES },
    inventory: [],
    equippedSlots: [null, null, null, null, null, null],
    selectedCompanionId: 'comp_valkyrie',
  };
}

export function loadRpgProfile(): RpgProfileData {
  if (!isClient) return getDefaultRpgProfile();
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.RPG_PROFILE);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        ...getDefaultRpgProfile(),
        ...parsed,
        dropRates: { ...DEFAULT_DROP_RATES, ...(parsed.dropRates || {}) },
        equippedSlots: Array.isArray(parsed.equippedSlots) && parsed.equippedSlots.length === 6
          ? parsed.equippedSlots
          : [null, null, null, null, null, null],
      };
    }
  } catch (e) {
    console.error('Failed to load RPG profile:', e);
  }
  return getDefaultRpgProfile();
}

export function saveRpgProfile(profile: RpgProfileData): void {
  if (!isClient) return;
  try {
    localStorage.setItem(STORAGE_KEYS.RPG_PROFILE, JSON.stringify(profile));
  } catch (e) {
    console.error('Failed to save RPG profile:', e);
  }
}

export function loadScoreboard(): ScoreboardData {
  if (!isClient) return { X: 0, O: 0, draws: 0, streakPlayer: null, streakCount: 0 };
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SCOREBOARD);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load scoreboard from localStorage:', e);
  }
  return { X: 0, O: 0, draws: 0, streakPlayer: null, streakCount: 0 };
}

export function saveScoreboard(data: ScoreboardData): void {
  if (!isClient) return;
  try {
    localStorage.setItem(STORAGE_KEYS.SCOREBOARD, JSON.stringify(data));
  } catch (e) {
    console.error('Failed to save scoreboard to localStorage:', e);
  }
}

export function loadMatchHistory(): MatchHistoryItem[] {
  if (!isClient) return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.MATCH_HISTORY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load match history from localStorage:', e);
  }
  return [];
}

export function saveMatchHistory(items: MatchHistoryItem[]): void {
  if (!isClient) return;
  try {
    localStorage.setItem(STORAGE_KEYS.MATCH_HISTORY, JSON.stringify(items));
  } catch (e) {
    console.error('Failed to save match history to localStorage:', e);
  }
}

export function clearMatchHistory(): void {
  if (!isClient) return;
  try {
    localStorage.removeItem(STORAGE_KEYS.MATCH_HISTORY);
  } catch (e) {
    console.error('Failed to clear match history:', e);
  }
}

export function loadSettings(): SavedSettings | null {
  if (!isClient) return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load settings from localStorage:', e);
  }
  return null;
}

export function saveSettings(settings: SavedSettings): void {
  if (!isClient) return;
  try {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  } catch (e) {
    console.error('Failed to save settings to localStorage:', e);
  }
}

export function loadActiveGame(): SavedActiveGame | null {
  if (!isClient) return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ACTIVE_GAME);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load active game from localStorage:', e);
  }
  return null;
}

export function saveActiveGame(game: SavedActiveGame): void {
  if (!isClient) return;
  try {
    localStorage.setItem(STORAGE_KEYS.ACTIVE_GAME, JSON.stringify(game));
  } catch (e) {
    console.error('Failed to save active game to localStorage:', e);
  }
}

export function clearActiveGame(): void {
  if (!isClient) return;
  try {
    localStorage.removeItem(STORAGE_KEYS.ACTIVE_GAME);
  } catch (e) {
    console.error('Failed to clear active game:', e);
  }
}
