import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PlayerScoreCard } from '@/components/ui/PlayerScoreCard';
import { ScoreboardData, WinnerInfo, ReplayState, MatchHistoryItem } from '@/types/game';

const scoreboard: ScoreboardData = {
  X: 3,
  O: 2,
  draws: 1,
  streakPlayer: 'X',
  streakCount: 2,
};

function renderCard(overrides: Partial<React.ComponentProps<typeof PlayerScoreCard>> = {}) {
  const props: React.ComponentProps<typeof PlayerScoreCard> = {
    currentPlayer: 'X',
    winnerInfo: null,
    setWinnerInfo: vi.fn(),
    scoreboard,
    playerNames: { X: 'An', O: 'Bình' },
    setPlayerNames: vi.fn(),
    gameMode: 'LOCAL_2P',
    timeLeft: 25,
    turnTimeLimit: 30,
    setTurnTimeLimit: vi.fn(),
    hoveredCell: null,
    threatBanner: null,
    movesCount: 5,
    onUndo: vi.fn(),
    onReset: vi.fn(),
    onSurrender: vi.fn(),
    onFocusLastMove: vi.fn(),
    onResetCameraCenter: vi.fn(),
    ...overrides,
  };
  return { ...render(<PlayerScoreCard {...props} />), props };
}

describe('PlayerScoreCard', () => {
  it('renders both player names and scores', () => {
    renderCard();

    expect(screen.getByDisplayValue('An')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Bình')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('shows the turn indicator for the active player only', () => {
    renderCard({ currentPlayer: 'X' });

    expect(screen.getByText('Đang tới lượt đánh...')).toBeInTheDocument();
    expect(screen.queryByText('AI đang tính toán...')).not.toBeInTheDocument();
  });

  it('shows the AI thinking indicator when the bot is on the clock', () => {
    renderCard({ currentPlayer: 'O', gameMode: 'AI_BOT' });

    expect(screen.getByText('AI đang tính toán...')).toBeInTheDocument();
  });

  it('disables the O name input in AI mode and shows the bot name', () => {
    renderCard({ gameMode: 'AI_BOT' });

    const input = screen.getByDisplayValue('AI CyberBot 30x30');
    expect(input).toBeDisabled();
  });

  it('updates player names through setPlayerNames', () => {
    function StatefulCard() {
      const [names, setNames] = React.useState({ X: 'An', O: 'Bình' });
      return (
        <PlayerScoreCard
          currentPlayer="X"
          winnerInfo={null}
          setWinnerInfo={vi.fn()}
          scoreboard={scoreboard}
          playerNames={names}
          setPlayerNames={setNames}
          gameMode="LOCAL_2P"
          timeLeft={25}
          turnTimeLimit={30}
          setTurnTimeLimit={vi.fn()}
          hoveredCell={null}
          threatBanner={null}
          movesCount={5}
          onUndo={vi.fn()}
          onReset={vi.fn()}
          onSurrender={vi.fn()}
          onFocusLastMove={vi.fn()}
          onResetCameraCenter={vi.fn()}
        />
      );
    }
    render(<StatefulCard />);

    fireEvent.change(screen.getByDisplayValue('An'), { target: { value: 'Minh' } });

    expect(screen.getByDisplayValue('Minh')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Bình')).toBeInTheDocument();
  });

  it('shows the countdown when the timer is enabled', () => {
    renderCard({ timeLeft: 25, turnTimeLimit: 30 });

    expect(screen.getByText('25s')).toBeInTheDocument();
  });

  it('shows "Vô hạn" when the timer is disabled', () => {
    renderCard({ turnTimeLimit: 0 });

    expect(screen.getByText('Vô hạn')).toBeInTheDocument();
  });

  it('changes the turn time limit from the select', () => {
    const setTurnTimeLimit = vi.fn();
    renderCard({ setTurnTimeLimit });

    fireEvent.change(screen.getByRole('combobox'), { target: { value: '60' } });

    expect(setTurnTimeLimit).toHaveBeenCalledWith(60);
  });

  it('shows the hovered coordinate or a placeholder', () => {
    const { rerender } = renderCard({ hoveredCell: null });
    expect(screen.getByText('--')).toBeInTheDocument();

    rerender(
      <PlayerScoreCard
        currentPlayer="X"
        winnerInfo={null}
        setWinnerInfo={vi.fn()}
        scoreboard={scoreboard}
        playerNames={{ X: 'An', O: 'Bình' }}
        setPlayerNames={vi.fn()}
        gameMode="LOCAL_2P"
        timeLeft={25}
        turnTimeLimit={30}
        setTurnTimeLimit={vi.fn()}
        hoveredCell={{ row: 14, col: 14 }}
        threatBanner={null}
        movesCount={5}
        onUndo={vi.fn()}
        onReset={vi.fn()}
        onSurrender={vi.fn()}
        onFocusLastMove={vi.fn()}
        onResetCameraCenter={vi.fn()}
      />
    );

    expect(screen.getByText('O15')).toBeInTheDocument();
  });

  it('shows the threat banner with the player and coordinate', () => {
    renderCard({ threatBanner: { player: 'O', coord: 'AD30' } });

    expect(screen.getByText(/Quân O vừa tạo thế sát thủ tại AD30/)).toBeInTheDocument();
  });

  it('shows the LAN status pill only in LAN mode', () => {
    const { rerender } = renderCard({ gameMode: 'LOCAL_2P' });
    expect(screen.queryByText(/Phòng LAN/)).not.toBeInTheDocument();

    rerender(
      <PlayerScoreCard
        currentPlayer="X"
        winnerInfo={null}
        setWinnerInfo={vi.fn()}
        scoreboard={scoreboard}
        playerNames={{ X: 'An', O: 'Bình' }}
        setPlayerNames={vi.fn()}
        gameMode="LAN_WIFI"
        timeLeft={25}
        turnTimeLimit={30}
        setTurnTimeLimit={vi.fn()}
        hoveredCell={null}
        threatBanner={null}
        lanStatus="CONNECTED"
        lanRoomCode="ROOM42"
        lanRole="HOST"
        movesCount={5}
        onUndo={vi.fn()}
        onReset={vi.fn()}
        onSurrender={vi.fn()}
        onFocusLastMove={vi.fn()}
        onResetCameraCenter={vi.fn()}
      />
    );

    expect(screen.getByText('ROOM42')).toBeInTheDocument();
    expect(screen.getByText(/Chủ Phòng \(X\)/)).toBeInTheDocument();
  });

  it('shows the floating emoji reaction', () => {
    renderCard({ floatingEmoji: { id: 1, emoji: '🔥', sender: 'Bình' } });

    expect(screen.getByText('🔥')).toBeInTheDocument();
    expect(screen.getByText('Từ Bình')).toBeInTheDocument();
  });

  it('shows the replay banner with progress', () => {
    const match: MatchHistoryItem = {
      id: 'm1',
      date: '01/01',
      mode: 'LOCAL_2P',
      winner: 'X',
      playerXName: 'An',
      playerOName: 'Bình',
      totalMoves: 9,
      durationSec: 30,
      winningDirection: 'Hàng Ngang',
      moves: Array.from({ length: 9 }, (_, i) => ({
        step: i + 1,
        row: 0,
        col: i,
        player: (i % 2 === 0 ? 'X' : 'O') as 'X' | 'O',
        coord: `A${i + 1}`,
        timestamp: i,
      })),
    };
    const replayState: ReplayState = { match, stepIndex: 3, playing: true };

    renderCard({ replayState });

    expect(
      screen.getByText(
        (_, el) => el?.tagName === 'SPAN' && el.textContent === 'Đang phát lại trận đấu (3/9 nước)'
      )
    ).toBeInTheDocument();
    expect(screen.getByText('Tạm dừng')).toBeInTheDocument();
  });

  it('shows the victory modal with the winner name', () => {
    const winnerInfo: WinnerInfo = {
      winner: 'X',
      line: [],
      directionName: 'Hàng Ngang',
    };

    renderCard({ winnerInfo });

    expect(screen.getByText(/CHIẾN THẮNG: An \(X\)!/)).toBeInTheDocument();
    expect(screen.getByText('Hàng Ngang')).toBeInTheDocument();
    expect(screen.getByText(/\+1 LƯỢT QUAY/)).toBeInTheDocument();
  });

  it('shows the draw modal for a draw', () => {
    renderCard({ winnerInfo: { winner: 'DRAW', line: [], directionName: 'Hòa Cờ' } });

    expect(screen.getByText('TRẬN ĐẤU HÒA CỜ!')).toBeInTheDocument();
    expect(screen.queryByText(/\+1 LƯỢT QUAY/)).not.toBeInTheDocument();
  });

  it('wires the action dock buttons to their callbacks', () => {
    const onUndo = vi.fn();
    const onReset = vi.fn();
    const onSurrender = vi.fn();
    const onFocusLastMove = vi.fn();
    const onResetCameraCenter = vi.fn();
    renderCard({ onUndo, onReset, onSurrender, onFocusLastMove, onResetCameraCenter });

    fireEvent.click(screen.getByText('Đi Lại'));
    fireEvent.click(screen.getByText('Ván Mới'));
    fireEvent.click(screen.getByText('Đầu Hàng'));
    fireEvent.click(screen.getByText('Tâm Nước Cuối'));
    fireEvent.click(screen.getByText('Giữa Bàn'));

    expect(onUndo).toHaveBeenCalledTimes(1);
    expect(onReset).toHaveBeenCalledTimes(1);
    expect(onSurrender).toHaveBeenCalledTimes(1);
    expect(onFocusLastMove).toHaveBeenCalledTimes(1);
    expect(onResetCameraCenter).toHaveBeenCalledTimes(1);
  });

  it('disables undo and surrender with no moves', () => {
    renderCard({ movesCount: 0 });

    expect(screen.getByText('Đi Lại').closest('button')).toBeDisabled();
    expect(screen.getByText('Đầu Hàng').closest('button')).toBeDisabled();
  });

  it('opens the gacha from the victory modal', () => {
    const onOpenGacha = vi.fn();
    const setWinnerInfo = vi.fn();
    renderCard({
      winnerInfo: { winner: 'X', line: [], directionName: 'Hàng Ngang' },
      onOpenGacha,
      setWinnerInfo,
    });

    fireEvent.click(screen.getByText(/Quay Vũ Khí Ngay/));

    expect(setWinnerInfo).toHaveBeenCalledWith(null);
    expect(onOpenGacha).toHaveBeenCalledTimes(1);
  });

  it('returns to the dashboard from the victory modal', () => {
    const onBackToDashboard = vi.fn();
    renderCard({
      winnerInfo: { winner: 'O', line: [], directionName: 'Hàng Dọc' },
      onBackToDashboard,
    });

    fireEvent.click(screen.getByText('Về Dashboard'));

    expect(onBackToDashboard).toHaveBeenCalledTimes(1);
  });
});
