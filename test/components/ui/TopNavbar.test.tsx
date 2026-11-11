import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TopNavbar } from '@/components/ui/TopNavbar';

function renderNavbar(overrides: Partial<React.ComponentProps<typeof TopNavbar>> = {}) {
  const props: React.ComponentProps<typeof TopNavbar> = {
    gameMode: 'LOCAL_2P',
    onSelectMode: vi.fn(),
    cameraPreset: 'ISO_3D',
    onSelectCameraPreset: vi.fn(),
    isMuted: false,
    onToggleMute: vi.fn(),
    onOpenLanModal: vi.fn(),
    onOpenArchitectureModal: vi.fn(),
    ...overrides,
  };
  return { ...render(<TopNavbar {...props} />), props };
}

describe('TopNavbar', () => {
  it('renders the brand title', () => {
    renderNavbar();

    expect(screen.getByText('CYBERCARO 3D')).toBeInTheDocument();
    expect(screen.getByText('THẮNG +1 VÉ QUAY')).toBeInTheDocument();
  });

  it('selects local 2-player mode', () => {
    const onSelectMode = vi.fn();
    renderNavbar({ onSelectMode });

    fireEvent.click(screen.getByText('1 Máy 2 Người'));

    expect(onSelectMode).toHaveBeenCalledWith('LOCAL_2P');
  });

  it('selects AI mode', () => {
    const onSelectMode = vi.fn();
    renderNavbar({ onSelectMode });

    fireEvent.click(screen.getByText('Đấu AI CyberBot'));

    expect(onSelectMode).toHaveBeenCalledWith('AI_BOT');
  });

  it('opens the LAN modal from the LAN button', () => {
    const onOpenLanModal = vi.fn();
    renderNavbar({ onOpenLanModal });

    fireEvent.click(screen.getByText('Mạng LAN / Đồng Đội'));

    expect(onOpenLanModal).toHaveBeenCalledTimes(1);
  });

  it('shows a connected indicator in LAN mode', () => {
    const { container } = renderNavbar({ gameMode: 'LAN_WIFI', lanStatus: 'CONNECTED' });

    expect(container.querySelector('.bg-emerald-400')).not.toBeNull();
  });

  it('hides the connected indicator when disconnected', () => {
    const { container } = renderNavbar({ gameMode: 'LAN_WIFI', lanStatus: 'DISCONNECTED' });

    expect(container.querySelector('.bg-emerald-400')).toBeNull();
  });

  it('selects camera presets', () => {
    const onSelectCameraPreset = vi.fn();
    renderNavbar({ onSelectCameraPreset });

    fireEvent.click(screen.getByText('3D Nghiêng'));
    fireEvent.click(screen.getByText('2D Đỉnh'));
    fireEvent.click(screen.getByText('Xoay 360°'));

    expect(onSelectCameraPreset).toHaveBeenNthCalledWith(1, 'ISO_3D');
    expect(onSelectCameraPreset).toHaveBeenNthCalledWith(2, 'TOP_2D');
    expect(onSelectCameraPreset).toHaveBeenNthCalledWith(3, 'CINEMATIC');
  });

  it('toggles mute', () => {
    const onToggleMute = vi.fn();
    renderNavbar({ onToggleMute });

    fireEvent.click(screen.getByTitle('Tắt âm thanh'));

    expect(onToggleMute).toHaveBeenCalledTimes(1);
  });

  it('shows the unmute tooltip when muted', () => {
    renderNavbar({ isMuted: true });

    expect(screen.getByTitle('Bật âm thanh')).toBeInTheDocument();
  });

  it('opens the architecture modal', () => {
    const onOpenArchitectureModal = vi.fn();
    renderNavbar({ onOpenArchitectureModal });

    fireEvent.click(screen.getByTitle('Xem cấu trúc thư mục dự án Next.js'));

    expect(onOpenArchitectureModal).toHaveBeenCalledTimes(1);
  });

  it('shows the gacha button with the ticket count', () => {
    const onOpenGachaModal = vi.fn();
    renderNavbar({ onOpenGachaModal, spinTickets: 7 });

    fireEvent.click(screen.getByText('Quay Đồ (7)'));

    expect(onOpenGachaModal).toHaveBeenCalledTimes(1);
  });

  it('hides the gacha button without a handler', () => {
    renderNavbar();

    expect(screen.queryByText(/Quay Đồ/)).not.toBeInTheDocument();
  });

  it('opens the battle arena', () => {
    const onOpenBattleArena = vi.fn();
    renderNavbar({ onOpenBattleArena });

    fireEvent.click(screen.getByText('Battle'));

    expect(onOpenBattleArena).toHaveBeenCalledTimes(1);
  });

  it('shows the dashboard button only when a handler is given', () => {
    const { rerender } = renderNavbar();
    expect(screen.queryByText('Dashboard')).not.toBeInTheDocument();

    const onBackToDashboard = vi.fn();
    rerender(
      <TopNavbar
        gameMode="LOCAL_2P"
        onSelectMode={vi.fn()}
        cameraPreset="ISO_3D"
        onSelectCameraPreset={vi.fn()}
        isMuted={false}
        onToggleMute={vi.fn()}
        onOpenLanModal={vi.fn()}
        onOpenArchitectureModal={vi.fn()}
        onBackToDashboard={onBackToDashboard}
      />
    );

    fireEvent.click(screen.getByText('Dashboard'));
    expect(onBackToDashboard).toHaveBeenCalledTimes(1);
  });
});
