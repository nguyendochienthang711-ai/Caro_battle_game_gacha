import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { CyberDashboard } from '@/components/ui/CyberDashboard';
import { computeFighterStats, PRESET_COMPANIONS } from '@/lib/rpgEngine';
import { RpgItem, ScoreboardData } from '@/types/game';

function makeItem(overrides: Partial<RpgItem> = {}): RpgItem {
  return {
    instanceId: 'item_1',
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
    obtainedAt: 0,
    ...overrides,
  };
}

const scoreboard: ScoreboardData = {
  X: 3,
  O: 2,
  draws: 1,
  streakPlayer: 'X',
  streakCount: 2,
};

function renderDashboard(overrides: Partial<React.ComponentProps<typeof CyberDashboard>> = {}) {
  const inventory = overrides.inventory ?? [];
  const equippedSlots = overrides.equippedSlots ?? [null, null, null, null, null, null];
  const props: React.ComponentProps<typeof CyberDashboard> = {
    playerName: 'An',
    onChangePlayerName: vi.fn(),
    playerStats: computeFighterStats('An', equippedSlots, inventory),
    spinTickets: 4,
    inventory,
    equippedSlots,
    onEquipItemToSlot: vi.fn(),
    onUnequipSlot: vi.fn(),
    onAutoEquipBest: vi.fn(),
    selectedCompanionId: 'comp_valkyrie',
    onSelectCompanion: vi.fn(),
    activeTeammate: PRESET_COMPANIONS[0],
    clearedStagesCount: 2,
    scoreboard,
    selectedCaroMode: 'LOCAL_2P',
    onSelectCaroMode: vi.fn(),
    onStartCaroGame: vi.fn(),
    onOpenGachaModal: vi.fn(),
    onOpenBattleArena: vi.fn(),
    lanRoomCode: '',
    lanStatus: 'DISCONNECTED',
    lanTransport: '',
    onCreatePartyRoom: vi.fn(),
    onJoinPartyRoom: vi.fn(),
    ...overrides,
  };
  return { ...render(<CyberDashboard {...props} />), props };
}

beforeEach(() => {
  Object.assign(navigator, { clipboard: { writeText: vi.fn().mockResolvedValue(undefined) } });
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('CyberDashboard header', () => {
  it('shows the win count and cleared stages', () => {
    renderDashboard();

    expect(screen.getByText('5 trận')).toBeInTheDocument();
    expect(screen.getByText('2/5')).toBeInTheDocument();
  });

  it('shows the spin ticket count', () => {
    renderDashboard({ spinTickets: 9 });

    expect(screen.getByText('9')).toBeInTheDocument();
  });

  it('opens the gacha from the ticket button', () => {
    const onOpenGachaModal = vi.fn();
    renderDashboard({ onOpenGachaModal });

    fireEvent.click(screen.getByText('Vé Quay Hiện Có:'));

    expect(onOpenGachaModal).toHaveBeenCalledTimes(1);
  });
});

describe('CyberDashboard launchers', () => {
  it('selects a Caro mode', () => {
    const onSelectCaroMode = vi.fn();
    renderDashboard({ onSelectCaroMode });

    fireEvent.click(screen.getByText('Đấu AI Bot'));
    fireEvent.click(screen.getByText('Đấu LAN'));

    expect(onSelectCaroMode).toHaveBeenNthCalledWith(1, 'AI_BOT');
    expect(onSelectCaroMode).toHaveBeenNthCalledWith(2, 'LAN_WIFI');
  });

  it('starts a Caro game with the selected mode', () => {
    const onStartCaroGame = vi.fn();
    renderDashboard({ onStartCaroGame, selectedCaroMode: 'AI_BOT' });

    fireEvent.click(screen.getByText('BẮT ĐẦU CHƠI CARO NGAY'));

    expect(onStartCaroGame).toHaveBeenCalledWith('AI_BOT');
  });

  it('opens the gacha from the spin card', () => {
    const onOpenGachaModal = vi.fn();
    renderDashboard({ onOpenGachaModal, spinTickets: 6 });

    fireEvent.click(screen.getByText('MỞ VÒNG QUAY (6 VÉ)'));

    expect(onOpenGachaModal).toHaveBeenCalledTimes(1);
  });

  it('opens the battle arena', () => {
    const onOpenBattleArena = vi.fn();
    renderDashboard({ onOpenBattleArena });

    fireEvent.click(screen.getByText('VÀO ĐẤU TRƯỜNG BATTLE'));

    expect(onOpenBattleArena).toHaveBeenCalledTimes(1);
  });

  it('shows the power score', () => {
    renderDashboard();

    expect(
      screen.getByText((_, el) => el?.tagName === 'SPAN' && /LC$/.test(el.textContent ?? ''))
    ).toBeInTheDocument();
  });
});

describe('CyberDashboard fighter stats', () => {
  it('shows the player name and base stats', () => {
    renderDashboard();

    expect(screen.getByDisplayValue('An')).toBeInTheDocument();
    expect(screen.getByText('1200')).toBeInTheDocument();
    expect(screen.getByText('120')).toBeInTheDocument();
    expect(screen.getByText('60')).toBeInTheDocument();
    expect(screen.getByText('10% / 150%')).toBeInTheDocument();
  });

  it('renames the fighter', () => {
    const onChangePlayerName = vi.fn();
    renderDashboard({ onChangePlayerName });

    fireEvent.change(screen.getByDisplayValue('An'), { target: { value: 'Minh' } });

    expect(onChangePlayerName).toHaveBeenCalledWith('Minh');
  });

  it('auto-equips the best gear', () => {
    const onAutoEquipBest = vi.fn();
    renderDashboard({ onAutoEquipBest });

    fireEvent.click(screen.getByText('Tự Lắp 6 Đồ Mạnh Nhất'));

    expect(onAutoEquipBest).toHaveBeenCalledTimes(1);
  });

  it('shows six empty slots', () => {
    renderDashboard();

    expect(screen.getByText('Ô Trống #1')).toBeInTheDocument();
    expect(screen.getByText('Ô Trống #6')).toBeInTheDocument();
  });

  it('opens the gacha when an empty slot is clicked', () => {
    const onOpenGachaModal = vi.fn();
    renderDashboard({ onOpenGachaModal });

    fireEvent.click(screen.getByText('Ô Trống #3'));

    expect(onOpenGachaModal).toHaveBeenCalledTimes(1);
  });

  it('shows equipped items and unequips on click', () => {
    const item = makeItem();
    const onUnequipSlot = vi.fn();
    renderDashboard({
      inventory: [item],
      equippedSlots: [item.instanceId, null, null, null, null, null],
      onUnequipSlot,
    });

    expect(screen.getAllByText('Dao Găm Xung Kích C-01').length).toBeGreaterThan(0);
    fireEvent.click(screen.getByTitle('Nhấn để tháo trang bị này'));

    expect(onUnequipSlot).toHaveBeenCalledWith(0);
  });

  it('lists active unique skills', () => {
    const item = makeItem({
      instanceId: 'ss1',
      rarity: 'SS',
      name: 'Thần Kiếm Hố Đen Vũ Trụ [SS]',
      uniqueSkill: {
        id: 'skill_blackhole_singularity',
        name: 'TUYỆT KỸ SS: Hố Đen Hủy Diệt Ngân Hà',
        description: 'Triệu hồi Hố Đen chém 3 liên kích.',
        cooldown: 3,
        type: 'ACTIVE_ATTACK',
        multiplier: 3.8,
      },
    });
    renderDashboard({
      inventory: [item],
      equippedSlots: [item.instanceId, null, null, null, null, null],
    });

    expect(screen.getByText(/KỸ NĂNG ĐỘC NHẤT ĐANG KÍCH HOẠT/)).toBeInTheDocument();
    expect(
      screen.getAllByText(/TUYỆT KỸ SS: Hố Đen Hủy Diệt Ngân Hà/).length
    ).toBeGreaterThan(0);
  });
});

describe('CyberDashboard inventory', () => {
  it('shows an empty inventory state with the ticket count', () => {
    renderDashboard({ spinTickets: 4 });

    expect(screen.getByText(/Kho đồ đang trống/)).toBeInTheDocument();
    expect(screen.getByText(/4 Vé Quay/)).toBeInTheDocument();
  });

  it('opens the gacha from the empty inventory button', () => {
    const onOpenGachaModal = vi.fn();
    renderDashboard({ onOpenGachaModal });

    fireEvent.click(screen.getByText('🎰 Quay Vũ Khí & Giáp Ngay'));

    expect(onOpenGachaModal).toHaveBeenCalledTimes(1);
  });

  it('lists owned items with their count', () => {
    const items = [makeItem({ instanceId: 'a' }), makeItem({ instanceId: 'b', name: 'Súng Lục Điện Từ C-02' })];
    renderDashboard({ inventory: items });

    expect(screen.getByText(/KHO VŨ KHÍ & GIÁP ĐÃ SỞ HỮU \(2 MÓN\)/)).toBeInTheDocument();
    expect(screen.getByText('Súng Lục Điện Từ C-02')).toBeInTheDocument();
  });

  it('filters the inventory by category', () => {
    const items = [
      makeItem({ instanceId: 'a', name: 'Vũ Khí A', category: 'WEAPON' }),
      makeItem({ instanceId: 'b', name: 'Giáp B', category: 'ARMOR' }),
    ];
    renderDashboard({ inventory: items });

    fireEvent.click(screen.getByText('⚔️ Vũ Khí'));
    expect(screen.getByText('Vũ Khí A')).toBeInTheDocument();
    expect(screen.queryByText('Giáp B')).not.toBeInTheDocument();

    fireEvent.click(screen.getByText('🛡️ Giáp'));
    expect(screen.getByText('Giáp B')).toBeInTheDocument();
    expect(screen.queryByText('Vũ Khí A')).not.toBeInTheDocument();

    fireEvent.click(screen.getByText('Tất cả'));
    expect(screen.getByText('Vũ Khí A')).toBeInTheDocument();
    expect(screen.getByText('Giáp B')).toBeInTheDocument();
  });

  it('sorts the inventory by rarity', () => {
    const items = [
      makeItem({ instanceId: 'c', name: 'Đồ C', rarity: 'C' }),
      makeItem({ instanceId: 'ss', name: 'Đồ SS', rarity: 'SS' }),
      makeItem({ instanceId: 'a', name: 'Đồ A', rarity: 'A' }),
    ];
    renderDashboard({ inventory: items });

    const names = screen
      .getAllByText(/^Đồ (C|SS|A)$/)
      .map((el) => el.textContent);
    expect(names).toEqual(['Đồ SS', 'Đồ A', 'Đồ C']);
  });

  it('equips an item from the inventory', () => {
    const item = makeItem();
    const onEquipItemToSlot = vi.fn();
    renderDashboard({ inventory: [item], onEquipItemToSlot });

    fireEvent.click(screen.getByText('+ Trang Bị Vào Ô'));

    expect(onEquipItemToSlot).toHaveBeenCalledWith(item);
  });

  it('unequips an equipped item from the inventory', () => {
    const item = makeItem();
    const onUnequipSlot = vi.fn();
    renderDashboard({
      inventory: [item],
      equippedSlots: [null, item.instanceId, null, null, null, null],
      onUnequipSlot,
    });

    fireEvent.click(screen.getByText('✓ Đang Mặc (Nhấn để tháo)'));

    expect(onUnequipSlot).toHaveBeenCalledWith(1);
  });
});

describe('CyberDashboard party hub', () => {
  it('creates a party code when none exists', () => {
    const onCreatePartyRoom = vi.fn();
    renderDashboard({ onCreatePartyRoom });

    expect(screen.getByText('CHƯA TẠO')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Tạo Mã Ngay'));

    expect(onCreatePartyRoom).toHaveBeenCalledTimes(1);
  });

  it('shows the existing party code', () => {
    renderDashboard({ lanRoomCode: 'AB12-89' });

    expect(screen.getByText('AB12-89')).toBeInTheDocument();
    expect(screen.getByText('Copy Link Mời')).toBeInTheDocument();
  });

  it('copies an invite link and shows confirmation', () => {
    vi.useFakeTimers();
    renderDashboard({ lanRoomCode: 'AB12-89' });

    fireEvent.click(screen.getByText('Copy Link Mời'));

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
      expect.stringContaining('?party=AB12-89')
    );
    expect(screen.getByText('Đã Copy Link!')).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(2100);
    });
    expect(screen.getByText('Copy Link Mời')).toBeInTheDocument();
  });

  it('uppercases the join code and joins the party', () => {
    const onJoinPartyRoom = vi.fn();
    renderDashboard({ onJoinPartyRoom });

    const input = screen.getByPlaceholderText('VD: AB12-89');
    fireEvent.change(input, { target: { value: 'xy99' } });
    expect(input).toHaveValue('XY99');

    fireEvent.click(screen.getByText('Vào Đội'));
    expect(onJoinPartyRoom).toHaveBeenCalledWith('XY99');
  });

  it('does not join with an empty code', () => {
    const onJoinPartyRoom = vi.fn();
    renderDashboard({ onJoinPartyRoom });

    fireEvent.click(screen.getByText('Vào Đội'));

    expect(onJoinPartyRoom).not.toHaveBeenCalled();
  });

  it('shows the connection status', () => {
    const { rerender } = renderDashboard();
    expect(screen.getByText('Chế độ Tổ Đội Cá Nhân')).toBeInTheDocument();

    rerender(
      <CyberDashboard
        playerName="An"
        onChangePlayerName={vi.fn()}
        playerStats={computeFighterStats('An', [null, null, null, null, null, null], [])}
        spinTickets={4}
        inventory={[]}
        equippedSlots={[null, null, null, null, null, null]}
        onEquipItemToSlot={vi.fn()}
        onUnequipSlot={vi.fn()}
        onAutoEquipBest={vi.fn()}
        selectedCompanionId="comp_valkyrie"
        onSelectCompanion={vi.fn()}
        activeTeammate={PRESET_COMPANIONS[0]}
        clearedStagesCount={2}
        scoreboard={scoreboard}
        selectedCaroMode="LOCAL_2P"
        onSelectCaroMode={vi.fn()}
        onStartCaroGame={vi.fn()}
        onOpenGachaModal={vi.fn()}
        onOpenBattleArena={vi.fn()}
        lanRoomCode="AB12-89"
        lanStatus="CONNECTED"
        lanTransport="WebRTC"
        onCreatePartyRoom={vi.fn()}
        onJoinPartyRoom={vi.fn()}
      />
    );

    expect(screen.getByText('Đã kết nối đồng đội (WebRTC)')).toBeInTheDocument();
  });

  it('lists preset companions and selects one', () => {
    const onSelectCompanion = vi.fn();
    renderDashboard({ onSelectCompanion });

    expect(screen.getByText('Valkyrie Astra')).toBeInTheDocument();
    expect(screen.getByText('Titan Reinhardt')).toBeInTheDocument();
    expect(screen.getByText('Seraphina Nova')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Titan Reinhardt'));

    expect(onSelectCompanion).toHaveBeenCalledWith('comp_titan');
  });

  it('marks the active companion', () => {
    renderDashboard();

    expect(screen.getByText('Đang Chọn')).toBeInTheDocument();
  });

  it('shows an online LAN friend when available', () => {
    const onSelectCompanion = vi.fn();
    renderDashboard({
      onSelectCompanion,
      onlinePeerFighter: {
        name: 'Bình',
        maxHp: 2000,
        atk: 300,
        def: 150,
        critRate: 20,
        critDamage: 160,
        lifesteal: 10,
        reflectDamage: 5,
        armorPen: 10,
        skills: [],
        equippedItems: [],
        powerScore: 5000,
      },
    });

    expect(screen.getByText('Bạn Bè LAN')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Bạn Bè LAN'));

    expect(onSelectCompanion).toHaveBeenCalledWith('online_friend');
  });
});
