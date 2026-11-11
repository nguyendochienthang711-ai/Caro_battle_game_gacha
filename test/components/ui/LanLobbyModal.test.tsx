import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { LanLobbyModal } from '@/components/ui/LanLobbyModal';

function renderModal(overrides: Partial<React.ComponentProps<typeof LanLobbyModal>> = {}) {
  const props: React.ComponentProps<typeof LanLobbyModal> = {
    isOpen: true,
    onClose: vi.fn(),
    roomCode: 'AB12-89',
    status: 'WAITING',
    transport: 'WebRTC',
    onCreateRoom: vi.fn(),
    onJoinRoom: vi.fn(),
    ...overrides,
  };
  return { ...render(<LanLobbyModal {...props} />), props };
}

describe('LanLobbyModal', () => {
  it('renders nothing when closed', () => {
    const { container } = renderModal({ isOpen: false });

    expect(container).toBeEmptyDOMElement();
  });

  it('shows the room code', () => {
    renderModal();

    expect(screen.getByText('AB12-89')).toBeInTheDocument();
  });

  it('shows a placeholder when there is no room code', () => {
    renderModal({ roomCode: '' });

    expect(screen.getByText('----')).toBeInTheDocument();
  });

  it('shows the waiting status', () => {
    renderModal({ status: 'WAITING' });

    expect(screen.getByText('Đang chờ người chơi thứ 2 nhập mã...')).toBeInTheDocument();
  });

  it('shows the connected status with the transport', () => {
    renderModal({ status: 'CONNECTED', transport: 'PeerJS' });

    expect(screen.getByText('Đã kết nối (PeerJS) - Sẵn sàng chiến!')).toBeInTheDocument();
  });

  it('creates a new room', () => {
    const onCreateRoom = vi.fn();
    renderModal({ onCreateRoom });

    fireEvent.click(screen.getByText('Tạo mã mới'));

    expect(onCreateRoom).toHaveBeenCalledTimes(1);
  });

  it('copies the room code to the clipboard', () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });
    renderModal();

    fireEvent.click(screen.getByText('Copy Mã'));

    expect(writeText).toHaveBeenCalledWith('AB12-89');
  });

  it('does not copy an empty room code', () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });
    renderModal({ roomCode: '' });

    fireEvent.click(screen.getByText('Copy Mã'));

    expect(writeText).not.toHaveBeenCalled();
  });

  it('uppercases the join code as it is typed', () => {
    renderModal();

    const input = screen.getByPlaceholderText('Nhập mã phòng (VD: AB12-89)');
    fireEvent.change(input, { target: { value: 'ab12' } });

    expect(input).toHaveValue('AB12');
  });

  it('joins a room with the entered code', () => {
    const onJoinRoom = vi.fn();
    renderModal({ onJoinRoom });

    fireEvent.change(screen.getByPlaceholderText('Nhập mã phòng (VD: AB12-89)'), {
      target: { value: 'xy99' },
    });
    fireEvent.click(screen.getByText('Kết Nối Ngay'));

    expect(onJoinRoom).toHaveBeenCalledWith('XY99');
  });

  it('closes from the X button and the footer button', () => {
    const onClose = vi.fn();
    const { container } = renderModal({ onClose });

    fireEvent.click(container.querySelector('button.p-1\\.5')!);
    fireEvent.click(screen.getByText('Đóng & Vào Bàn Cờ'));

    expect(onClose).toHaveBeenCalledTimes(2);
  });
});
