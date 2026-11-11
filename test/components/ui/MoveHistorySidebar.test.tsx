import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MoveHistorySidebar } from '@/components/ui/MoveHistorySidebar';
import { MoveRecord, MatchHistoryItem, ChatMessage, ScoreboardData } from '@/types/game';

const moves: MoveRecord[] = [
  { step: 1, row: 0, col: 0, player: 'X', coord: 'A1', timestamp: 1 },
  { step: 2, row: 1, col: 1, player: 'O', coord: 'B2', timestamp: 2 },
  { step: 3, row: 2, col: 2, player: 'X', coord: 'C3', timestamp: 3 },
];

const matchHistory: MatchHistoryItem[] = [
  {
    id: 'm1',
    date: '01/01 10:00',
    mode: 'LOCAL_2P',
    winner: 'X',
    playerXName: 'An',
    playerOName: 'Bình',
    totalMoves: 9,
    durationSec: 60,
    winningDirection: 'Hàng Ngang',
    moves,
  },
  {
    id: 'm2',
    date: '01/01 11:00',
    mode: 'AI_BOT',
    winner: 'DRAW',
    playerXName: 'An',
    playerOName: 'Bot',
    totalMoves: 30,
    durationSec: 120,
    winningDirection: 'Hòa Cờ',
    moves: [],
  },
];

const chatMessages: ChatMessage[] = [
  { id: 1, sender: 'An', text: 'Chào bạn', time: '10:00' },
  { id: 2, sender: 'Bình', text: 'GG', time: '10:01' },
];

const scoreboard: ScoreboardData = {
  X: 3,
  O: 2,
  draws: 1,
  streakPlayer: 'X',
  streakCount: 2,
};

function renderSidebar(overrides: Partial<React.ComponentProps<typeof MoveHistorySidebar>> = {}) {
  const props: React.ComponentProps<typeof MoveHistorySidebar> = {
    moves,
    matchHistory,
    chatMessages,
    activeTab: 'MOVES',
    setActiveTab: vi.fn(),
    autoFocusMove: false,
    setAutoFocusMove: vi.fn(),
    playerNames: { X: 'An', O: 'Bình' },
    scoreboard,
    onResetScoreboard: vi.fn(),
    onClearHistory: vi.fn(),
    onStartReplay: vi.fn(),
    onFocusCell: vi.fn(),
    onSendChat: vi.fn(),
    onSendEmoji: vi.fn(),
    ...overrides,
  };
  return { ...render(<MoveHistorySidebar {...props} />), props };
}

describe('MoveHistorySidebar tabs', () => {
  it('shows move counts on the tabs', () => {
    renderSidebar();

    expect(screen.getByText('Nước Đi (3)')).toBeInTheDocument();
    expect(screen.getByText('Lịch Sử (2)')).toBeInTheDocument();
    expect(screen.getByText('Chat LAN')).toBeInTheDocument();
  });

  it('switches tabs when clicked', () => {
    const setActiveTab = vi.fn();
    renderSidebar({ setActiveTab });

    fireEvent.click(screen.getByText('Lịch Sử (2)'));
    fireEvent.click(screen.getByText('Chat LAN'));

    expect(setActiveTab).toHaveBeenNthCalledWith(1, 'HISTORY');
    expect(setActiveTab).toHaveBeenNthCalledWith(2, 'CHAT');
  });
});

describe('MoveHistorySidebar MOVES tab', () => {
  it('lists moves newest first', () => {
    renderSidebar();

    const coords = screen.getAllByText(/^[A-Z]+\d+$/).map((el) => el.textContent);
    expect(coords).toEqual(['C3', 'B2', 'A1']);
  });

  it('shows the player name for each move', () => {
    renderSidebar();

    expect(screen.getAllByText('An')).toHaveLength(2);
    expect(screen.getAllByText('Bình')).toHaveLength(1);
  });

  it('focuses a cell when a move row is clicked', () => {
    const onFocusCell = vi.fn();
    renderSidebar({ onFocusCell });

    fireEvent.click(screen.getByText('B2'));

    expect(onFocusCell).toHaveBeenCalledWith(1, 1);
  });

  it('shows an empty state with no moves', () => {
    renderSidebar({ moves: [] });

    expect(screen.getByText('Chưa có nước cờ nào được đặt.')).toBeInTheDocument();
  });

  it('toggles auto-focus camera', () => {
    const setAutoFocusMove = vi.fn();
    renderSidebar({ setAutoFocusMove });

    fireEvent.click(screen.getByRole('checkbox'));

    expect(setAutoFocusMove).toHaveBeenCalledWith(true);
  });

  it('calls onUndo from the undo button', () => {
    const onUndo = vi.fn();
    renderSidebar({ onUndo });

    fireEvent.click(screen.getByText('Đi Lại'));

    expect(onUndo).toHaveBeenCalledTimes(1);
  });

  it('hides the undo button when no handler is given', () => {
    renderSidebar({ onUndo: undefined });

    expect(screen.queryByText('Đi Lại')).not.toBeInTheDocument();
  });

  it('shows the win streak and resets the scoreboard', () => {
    const onResetScoreboard = vi.fn();
    renderSidebar({ onResetScoreboard });

    expect(screen.getByText('X (2 trận)')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Reset tỷ số'));

    expect(onResetScoreboard).toHaveBeenCalledTimes(1);
  });

  it('shows zero streak when there is none', () => {
    renderSidebar({
      scoreboard: { X: 0, O: 0, draws: 0, streakPlayer: null, streakCount: 0 },
    });

    expect(screen.getByText('0')).toBeInTheDocument();
  });
});

describe('MoveHistorySidebar HISTORY tab', () => {
  it('lists completed matches', () => {
    renderSidebar({ activeTab: 'HISTORY' });

    expect(screen.getByText('THẮNG: QUÂN X')).toBeInTheDocument();
    expect(screen.getByText('HÒA CỜ')).toBeInTheDocument();
    expect(
      screen.getByText(
        (_, el) => el?.tagName === 'DIV' && el.textContent === 'An vs Bình'
      )
    ).toBeInTheDocument();
  });

  it('shows the winning direction and move count', () => {
    renderSidebar({ activeTab: 'HISTORY' });

    expect(screen.getByText(/Hàng Ngang • 9 nước/)).toBeInTheDocument();
  });

  it('starts a replay from a history entry', () => {
    const onStartReplay = vi.fn();
    renderSidebar({ activeTab: 'HISTORY', onStartReplay });

    fireEvent.click(screen.getAllByText('Replay 3D')[0]);

    expect(onStartReplay).toHaveBeenCalledWith(matchHistory[0]);
  });

  it('clears the history', () => {
    const onClearHistory = vi.fn();
    renderSidebar({ activeTab: 'HISTORY', onClearHistory });

    fireEvent.click(screen.getByText('Xóa hết'));

    expect(onClearHistory).toHaveBeenCalledTimes(1);
  });

  it('shows an empty state with no history', () => {
    renderSidebar({ activeTab: 'HISTORY', matchHistory: [] });

    expect(screen.getByText('Chưa có trận đấu nào hoàn thành.')).toBeInTheDocument();
    expect(screen.queryByText('Xóa hết')).not.toBeInTheDocument();
  });
});

describe('MoveHistorySidebar CHAT tab', () => {
  it('lists chat messages with sender and time', () => {
    renderSidebar({ activeTab: 'CHAT' });

    expect(screen.getByText('Chào bạn')).toBeInTheDocument();
    expect(screen.getByText('GG')).toBeInTheDocument();
    expect(screen.getByText('10:00')).toBeInTheDocument();
  });

  it('sends a trimmed chat message and clears the input', () => {
    const onSendChat = vi.fn();
    renderSidebar({ activeTab: 'CHAT', onSendChat });

    const input = screen.getByPlaceholderText('Nhập tin nhắn phòng LAN...');
    fireEvent.change(input, { target: { value: '  hello  ' } });
    fireEvent.submit(input.closest('form')!);

    expect(onSendChat).toHaveBeenCalledWith('hello');
    expect(input).toHaveValue('');
  });

  it('does not send an empty message', () => {
    const onSendChat = vi.fn();
    renderSidebar({ activeTab: 'CHAT', onSendChat });

    fireEvent.submit(screen.getByPlaceholderText('Nhập tin nhắn phòng LAN...').closest('form')!);

    expect(onSendChat).not.toHaveBeenCalled();
  });

  it('sends quick emoji reactions', () => {
    const onSendEmoji = vi.fn();
    renderSidebar({ activeTab: 'CHAT', onSendEmoji });

    fireEvent.click(screen.getByText('🔥'));
    fireEvent.click(screen.getByText('🏆'));

    expect(onSendEmoji).toHaveBeenNthCalledWith(1, '🔥');
    expect(onSendEmoji).toHaveBeenNthCalledWith(2, '🏆');
  });
});
