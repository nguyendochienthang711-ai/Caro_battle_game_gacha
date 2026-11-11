import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { BattleArenaModal } from '@/components/ui/BattleArenaModal';
import { computeFighterStats, PRESET_COMPANIONS, CAMPAIGN_STAGES, PVP_CHALLENGERS } from '@/lib/rpgEngine';
import { FighterStats } from '@/types/game';

function strongPlayer(overrides: Partial<FighterStats> = {}): FighterStats {
  return {
    ...computeFighterStats('An', [null, null, null, null, null, null], []),
    atk: 100000,
    ...overrides,
  };
}

function renderArena(overrides: Partial<React.ComponentProps<typeof BattleArenaModal>> = {}) {
  const props: React.ComponentProps<typeof BattleArenaModal> = {
    isOpen: true,
    onClose: vi.fn(),
    playerStats: computeFighterStats('An', [null, null, null, null, null, null], []),
    activeTeammate: PRESET_COMPANIONS[0],
    clearedStageIds: [],
    onStageCleared: vi.fn(),
    onOpenGacha: vi.fn(),
    ...overrides,
  };
  return { ...render(<BattleArenaModal {...props} />), props };
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.spyOn(Math, 'random').mockReturnValue(0.1);
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('BattleArenaModal visibility', () => {
  it('renders nothing when closed', () => {
    const { container } = renderArena({ isOpen: false });

    expect(container).toBeEmptyDOMElement();
  });

  it('shows the arena title', () => {
    renderArena();

    expect(screen.getByText(/ĐẤU TRƯỜNG CYBER BATTLE/)).toBeInTheDocument();
  });

  it('closes from the X button', () => {
    const onClose = vi.fn();
    const { container } = renderArena({ onClose });

    fireEvent.click(container.querySelector('button.p-2')!);

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

describe('BattleArenaModal stage selection', () => {
  it('lists all campaign stages', () => {
    renderArena();

    CAMPAIGN_STAGES.forEach((stage) => {
      expect(screen.getByText(stage.name)).toBeInTheDocument();
    });
  });

  it('marks cleared stages', () => {
    renderArena({ clearedStageIds: [1, 2] });

    expect(screen.getAllByText('✓ Đã Vượt')).toHaveLength(2);
  });

  it('shows the player power and teammate', () => {
    renderArena();

    expect(screen.getByText('Valkyrie Astra')).toBeInTheDocument();
  });

  it('switches to the solo PvP tab', () => {
    renderArena();

    fireEvent.click(screen.getByText('SOLO 1VS1 ĐẤU TRƯỜNG (PVP)'));

    PVP_CHALLENGERS.forEach((chal) => {
      expect(screen.getByText(chal.name)).toBeInTheDocument();
    });
  });

  it('shows an online LAN opponent when available', () => {
    renderArena({
      onlineOpponentStats: {
        ...computeFighterStats('Bình', [null, null, null, null, null, null], []),
        powerScore: 9999,
      },
    });

    fireEvent.click(screen.getByText('SOLO 1VS1 ĐẤU TRƯỜNG (PVP)'));

    expect(screen.getByText(/ĐỐI THỦ PHÒNG LAN ĐANG ONLINE/)).toBeInTheDocument();
    expect(screen.getByText(/Bình \(Lực chiến: 9,999\)/)).toBeInTheDocument();
  });
});

describe('BattleArenaModal combat', () => {
  it('starts a campaign battle', () => {
    renderArena();

    fireEvent.click(screen.getAllByText('Khiêu Chiến Cùng Đồng Đội')[0]);

    expect(screen.getByText(/HIỆP 1/)).toBeInTheDocument();
    expect(screen.getByText(/TRẬN CHIẾN BẮT ĐẦU/)).toBeInTheDocument();
    expect(screen.getByText(/BẠN \(An\)/)).toBeInTheDocument();
  });

  it('starts a solo battle', () => {
    renderArena();

    fireEvent.click(screen.getByText('SOLO 1VS1 ĐẤU TRƯỜNG (PVP)'));
    fireEvent.click(screen.getAllByText(/Thách Đấu Solo 1vs1/)[0]);

    // The battle opens on the player's turn; the enemy card shows the challenger.
    expect(screen.getByText(/BẠN \(An\)/)).toBeInTheDocument();
    expect(screen.getByText('Kaito_Blade99')).toBeInTheDocument();
    expect(screen.getByText(/TRẬN CHIẾN BẮT ĐẦU: An đối đầu Kaito_Blade99/)).toBeInTheDocument();
  });

  it('lets the player attack and logs the damage', () => {
    renderArena();

    fireEvent.click(screen.getAllByText('Khiêu Chiến Cùng Đồng Đội')[0]);
    fireEvent.click(screen.getByText('⚔️ Trảm Kích (100% Công)'));

    expect(screen.getByText(/dùng ⚔️ Trảm Kích lên/)).toBeInTheDocument();
  });

  it('lets the player defend and gain a shield', () => {
    renderArena();

    fireEvent.click(screen.getAllByText('Khiêu Chiến Cùng Đồng Đội')[0]);
    fireEvent.click(screen.getByText('🛡️ Khiên Tụ Lực (+25% Khiên & +10% HP)'));

    expect(screen.getByText(/tụ lực phòng thủ/)).toBeInTheDocument();
    expect(screen.getByText(/🛡️ Khiên:/)).toBeInTheDocument();
  });

  it('disables action buttons outside the player turn', () => {
    renderArena();

    fireEvent.click(screen.getAllByText('Khiêu Chiến Cùng Đồng Đội')[0]);
    fireEvent.click(screen.getByText('⚔️ Trảm Kích (100% Công)'));

    // Turn passes to the teammate, so the player's buttons are disabled.
    expect(screen.getByText('⚔️ Trảm Kích (100% Công)').closest('button')).toBeDisabled();
  });

  it('runs teammate and enemy turns on a timer', () => {
    renderArena();

    fireEvent.click(screen.getAllByText('Khiêu Chiến Cùng Đồng Đội')[0]);
    fireEvent.click(screen.getByText('⚔️ Trảm Kích (100% Công)'));

    act(() => {
      vi.advanceTimersByTime(900);
    });
    expect(screen.getByText(/Valkyrie Astra dùng/)).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(900);
    });
    expect(screen.getByText(/HIỆP 2/)).toBeInTheDocument();
    expect(screen.getByText(/BẠN \(An\)/)).toBeInTheDocument();
  });

  it('toggles auto mode', () => {
    renderArena();

    fireEvent.click(screen.getAllByText('Khiêu Chiến Cùng Đồng Đội')[0]);
    fireEvent.click(screen.getByText('BẬT AUTO ĐÁNH'));

    expect(screen.getByText('AUTO: ĐANG BẬT')).toBeInTheDocument();
  });

  it('auto-plays the player turn when auto mode is on', () => {
    renderArena();

    fireEvent.click(screen.getAllByText('Khiêu Chiến Cùng Đồng Đội')[0]);
    fireEvent.click(screen.getByText('BẬT AUTO ĐÁNH'));

    act(() => {
      vi.advanceTimersByTime(700);
    });

    expect(screen.getByText(/An dùng/)).toBeInTheDocument();
  });

  it('toggles the speed multiplier', () => {
    renderArena();

    fireEvent.click(screen.getAllByText('Khiêu Chiến Cùng Đồng Đội')[0]);
    fireEvent.click(screen.getByText('Tốc độ x1'));

    expect(screen.getByText('Tốc độ x2')).toBeInTheDocument();
  });

  it('shows a victory banner and awards spins', () => {
    const onStageCleared = vi.fn();
    renderArena({ playerStats: strongPlayer(), onStageCleared });

    fireEvent.click(screen.getAllByText('Khiêu Chiến Cùng Đồng Đội')[0]);
    fireEvent.click(screen.getByText('⚔️ Trảm Kích (100% Công)'));

    expect(screen.getByText(/CHIẾN THẮNG! NHẬN \+1 LƯỢT QUAY/)).toBeInTheDocument();
    expect(onStageCleared).toHaveBeenCalledWith(1, 1);
  });

  it('opens the gacha from the victory banner', () => {
    const onClose = vi.fn();
    const onOpenGacha = vi.fn();
    renderArena({ playerStats: strongPlayer(), onClose, onOpenGacha });

    fireEvent.click(screen.getAllByText('Khiêu Chiến Cùng Đồng Đội')[0]);
    fireEvent.click(screen.getByText('⚔️ Trảm Kích (100% Công)'));
    fireEvent.click(screen.getByText('🎰 Mở Vòng Quay Ngay'));

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onOpenGacha).toHaveBeenCalledTimes(1);
  });

  it('returns to the stage list from the victory banner', () => {
    renderArena({ playerStats: strongPlayer() });

    fireEvent.click(screen.getAllByText('Khiêu Chiến Cùng Đồng Đội')[0]);
    fireEvent.click(screen.getByText('⚔️ Trảm Kích (100% Công)'));
    fireEvent.click(screen.getByText('Quay Lại Danh Sách Ải'));

    expect(screen.getByText('VƯỢT ẢI CÙNG ĐỒNG ĐỘI (CO-OP PVE)')).toBeInTheDocument();
  });

  it('shows a defeat banner when the player falls in solo mode', () => {
    renderArena({
      playerStats: {
        ...computeFighterStats('An', [null, null, null, null, null, null], []),
        maxHp: 1,
      } as FighterStats,
    });

    fireEvent.click(screen.getByText('SOLO 1VS1 ĐẤU TRƯỜNG (PVP)'));
    fireEvent.click(screen.getAllByText(/Thách Đấu Solo 1vs1/)[0]);
    fireEvent.click(screen.getByText('⚔️ Trảm Kích (100% Công)'));

    // No teammate in solo mode, so the enemy turn follows immediately.
    act(() => {
      vi.advanceTimersByTime(900);
    });

    expect(screen.getByText(/THẤT BẠI TRÊN ĐẤU TRƯỜNG/)).toBeInTheDocument();
  });

  it('leaves the battle from the header button', () => {
    renderArena();

    fireEvent.click(screen.getAllByText('Khiêu Chiến Cùng Đồng Đội')[0]);
    fireEvent.click(screen.getByText('← Chọn Ải / Đối Thủ Khác'));

    expect(screen.getByText('VƯỢT ẢI CÙNG ĐỒNG ĐỘI (CO-OP PVE)')).toBeInTheDocument();
  });
});
