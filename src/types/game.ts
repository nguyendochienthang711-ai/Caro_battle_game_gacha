export const BOARD_SIZE = 30;
export const WIN_COUNT = 5;

export const STORAGE_KEYS = {
  ACTIVE_GAME: 'cybercaro_3d_active_game_v1',
  SCOREBOARD: 'cybercaro_3d_scoreboard_v1',
  MATCH_HISTORY: 'cybercaro_3d_match_history_v1',
  SETTINGS: 'cybercaro_3d_settings_v1',
  RPG_PROFILE: 'cybercaro_3d_rpg_profile_v1',
} as const;

export type PlayerSymbol = 'X' | 'O';
export type GameMode = 'LOCAL_2P' | 'LAN_WIFI' | 'AI_BOT';
export type CameraPreset = 'ISO_3D' | 'TOP_2D' | 'CINEMATIC';
export type AppViewMode = 'DASHBOARD' | 'CARO_GAME' | 'BATTLE_ARENA';

// ==================== RPG & GACHA TYPES ====================
export type ItemRarity = 'C' | 'B' | 'A' | 'S' | 'SS';
export type ItemCategory = 'WEAPON' | 'ARMOR';

export type RarityDropRates = Record<ItemRarity, number>;

export interface UniqueSkill {
  id: string;
  name: string;
  description: string;
  cooldown: number; // turns
  type: 'ACTIVE_ATTACK' | 'ACTIVE_BUFF' | 'PASSIVE_REVIVE' | 'PASSIVE_PROC';
  multiplier?: number; // e.g. 2.5x ATK
  ignoreDefPercent?: number;
  lifestealBonus?: number;
  stunTurns?: number;
  shieldPercent?: number;
  trueDamagePercent?: number;
}

export interface RpgItem {
  instanceId: string;
  templateId: string;
  name: string;
  category: ItemCategory;
  rarity: ItemRarity;
  icon: string;
  atk: number;
  def: number;
  hpBonus: number;
  // Sub-stats (Tier A, S, SS)
  critRate: number;      // %
  critDamage: number;    // % bonus (base 150%)
  lifesteal: number;     // %
  reflectDamage: number; // %
  armorPen: number;      // %
  // Unique Skill (Tier S, SS)
  uniqueSkill?: UniqueSkill;
  obtainedAt: number;
}

export interface FighterStats {
  name: string;
  maxHp: number;
  atk: number;
  def: number;
  critRate: number;
  critDamage: number;
  lifesteal: number;
  reflectDamage: number;
  armorPen: number;
  skills: UniqueSkill[];
  equippedItems: (RpgItem | null)[];
  powerScore: number;
}

export interface TeammateFighter {
  id: string;
  name: string;
  title: string;
  avatar: string;
  isOnlinePlayer?: boolean;
  stats: FighterStats;
}

export interface RpgProfileData {
  spinTickets: number;
  totalSpins: number;
  clearedStageIds: number[];
  dropRates: RarityDropRates;
  inventory: RpgItem[];
  equippedSlots: (string | null)[]; // 6 slots storing item instanceIds
  selectedCompanionId: string;
}

// ==================== CARO 3D TYPES ====================
export interface CellCoord {
  row: number;
  col: number;
}

export interface MoveRecord {
  step: number;
  row: number;
  col: number;
  player: PlayerSymbol;
  coord: string;
  timestamp: number;
}

export interface MatchHistoryItem {
  id: string;
  date: string;
  mode: GameMode;
  winner: PlayerSymbol | 'DRAW';
  playerXName: string;
  playerOName: string;
  totalMoves: number;
  durationSec: number;
  winningDirection: string;
  moves: MoveRecord[];
}

export interface ScoreboardData {
  X: number;
  O: number;
  draws: number;
  streakPlayer: PlayerSymbol | null;
  streakCount: number;
}

export interface WinnerInfo {
  winner: PlayerSymbol | 'DRAW';
  line: CellCoord[];
  directionName: string;
  rewardSpins?: number;
}

export interface ThreatBannerInfo {
  player: PlayerSymbol;
  coord: string;
}

export interface ReplayState {
  match: MatchHistoryItem;
  stepIndex: number;
  playing: boolean;
}

export interface LanMessagePacket {
  type:
    | 'MOVE'
    | 'UNDO'
    | 'RESTART'
    | 'SURRENDER'
    | 'CHAT'
    | 'EMOJI'
    | 'GUEST_JOINED'
    | 'SYNC_STATE'
    | 'SYNC_FIGHTER'
    | 'START_CARO';
  row?: number;
  col?: number;
  player?: PlayerSymbol;
  sender?: string;
  text?: string;
  emoji?: string;
  guestName?: string;
  transport?: string;
  fighterStats?: FighterStats;
  payload?: any;
}

export interface ChatMessage {
  id: number;
  sender: string;
  text: string;
  time: string;
}

export interface FloatingEmoji {
  id: number;
  emoji: string;
  sender: string;
}

export interface SceneApi {
  spawnPiece3D: (row: number, col: number, player: PlayerSymbol, animate?: boolean) => void;
  clearAllPieces: () => void;
  syncBoardState: (moveList: MoveRecord[]) => void;
  showWinEffects: (winningLine: CellCoord[], winnerSymbol: PlayerSymbol) => void;
  setCameraPresetView: (presetName: CameraPreset) => void;
  focusOnCell: (row: number, col: number) => void;
  resetCameraCenter: () => void;
  zoomDelta: (delta: number) => void;
}

// Coordinate helper: Col 0..29 -> A..Z, AA..AD | Row 0..29 -> 1..30
export const getColLabel = (col: number): string => {
  if (col < 26) return String.fromCharCode(65 + col);
  return 'A' + String.fromCharCode(65 + (col - 26));
};

export const formatCoord = (row: number, col: number): string => `${getColLabel(col)}${row + 1}`;

export const createEmptyBoard = (): (PlayerSymbol | null)[][] =>
  Array.from({ length: BOARD_SIZE }, () => Array(BOARD_SIZE).fill(null));
