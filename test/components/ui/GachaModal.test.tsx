import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { GachaModal } from '@/components/ui/GachaModal';
import { DEFAULT_DROP_RATES } from '@/lib/rpgEngine';
import { RpgItem } from '@/types/game';

function renderGacha(overrides: Partial<React.ComponentProps<typeof GachaModal>> = {}) {
  const props: React.ComponentProps<typeof GachaModal> = {
    isOpen: true,
    onClose: vi.fn(),
    spinTickets: 5,
    dropRates: { ...DEFAULT_DROP_RATES },
    onUpdateDropRates: vi.fn(),
    onItemObtained: vi.fn(),
    onAutoEquipItem: vi.fn(),
    onGoToCaro: vi.fn(),
    onAddFreeTestTicket: vi.fn(),
    ...overrides,
  };
  return { ...render(<GachaModal {...props} />), props };
}

/** Runs the 14-tick spin animation to completion. */
function finishSpin() {
  act(() => {
    vi.advanceTimersByTime(14 * 85 + 50);
  });
}

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('GachaModal visibility', () => {
  it('renders nothing when closed', () => {
    const { container } = renderGacha({ isOpen: false });

    expect(container).toBeEmptyDOMElement();
  });

  it('shows the title and ticket count', () => {
    renderGacha({ spinTickets: 7 });

    expect(screen.getByText(/VÒNG QUAY KHO BÁU CYBER/)).toBeInTheDocument();
    expect(screen.getByText('7')).toBeInTheDocument();
  });

  it('closes from the X button', () => {
    const onClose = vi.fn();
    const { container } = renderGacha({ onClose });

    fireEvent.click(container.querySelector('button.p-2')!);

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('adds a free test ticket', () => {
    const onAddFreeTestTicket = vi.fn();
    renderGacha({ onAddFreeTestTicket });

    fireEvent.click(screen.getByText('+1 Test'));

    expect(onAddFreeTestTicket).toHaveBeenCalledTimes(1);
  });
});

describe('GachaModal drop rate display', () => {
  it('shows the actual percentage for each rarity', () => {
    renderGacha();

    expect(screen.getByText('Hạng C: 45.0%')).toBeInTheDocument();
    expect(screen.getByText('Hạng SS: 2.0%')).toBeInTheDocument();
  });

  it('normalizes percentages when weights do not sum to 100', () => {
    renderGacha({ dropRates: { C: 1, B: 1, A: 1, S: 1, SS: 96 } });

    expect(screen.getByText('Hạng SS: 96.0%')).toBeInTheDocument();
    expect(screen.getByText('Hạng C: 1.0%')).toBeInTheDocument();
  });

  it('shows 100% for C when every weight is zero', () => {
    renderGacha({ dropRates: { C: 0, B: 0, A: 0, S: 0, SS: 0 } });

    expect(screen.getByText('Hạng C: 100.0%')).toBeInTheDocument();
    expect(screen.getByText('Hạng SS: 0.0%')).toBeInTheDocument();
  });
});

describe('GachaModal spinning', () => {
  it('disables spin buttons when there are no tickets', () => {
    renderGacha({ spinTickets: 0 });

    expect(screen.getByText('QUAY 1 LẦN (1 VÉ)').closest('button')).toBeDisabled();
    expect(screen.getByText('QUAY NHANH x3 (3 VÉ)').closest('button')).toBeDisabled();
  });

  it('disables the x3 button with fewer than 3 tickets', () => {
    renderGacha({ spinTickets: 2 });

    expect(screen.getByText('QUAY 1 LẦN (1 VÉ)').closest('button')).not.toBeDisabled();
    expect(screen.getByText('QUAY NHANH x3 (3 VÉ)').closest('button')).toBeDisabled();
  });

  it('shows the out-of-tickets hint and links to Caro', () => {
    const onClose = vi.fn();
    const onGoToCaro = vi.fn();
    renderGacha({ spinTickets: 0, onClose, onGoToCaro });

    expect(screen.getByText(/Bạn đã hết Lượt Quay/)).toBeInTheDocument();
    fireEvent.click(screen.getByText('Đánh Caro Ngay'));

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onGoToCaro).toHaveBeenCalledTimes(1);
  });

  it('awards one item for a single spin', () => {
    const onItemObtained = vi.fn();
    renderGacha({ onItemObtained });

    fireEvent.click(screen.getByText('QUAY 1 LẦN (1 VÉ)'));
    finishSpin();

    expect(onItemObtained).toHaveBeenCalledTimes(1);
    const [items, spent] = onItemObtained.mock.calls[0];
    expect(items).toHaveLength(1);
    expect(spent).toBe(1);
  });

  it('awards three items for a triple spin', () => {
    const onItemObtained = vi.fn();
    renderGacha({ onItemObtained });

    fireEvent.click(screen.getByText('QUAY NHANH x3 (3 VÉ)'));
    finishSpin();

    const [items, spent] = onItemObtained.mock.calls[0];
    expect(items).toHaveLength(3);
    expect(spent).toBe(3);
  });

  it('shows the rolled items with their stats', () => {
    renderGacha({ dropRates: { C: 0, B: 0, A: 0, S: 0, SS: 100 } });

    fireEvent.click(screen.getByText('QUAY 1 LẦN (1 VÉ)'));
    finishSpin();

    expect(screen.getByText(/VẬT PHẨM BẠN VỪA NHẬN ĐƯỢC/)).toBeInTheDocument();
    expect(screen.getByText(/Tối Thượng \(SS\)/)).toBeInTheDocument();
  });

  it('auto-equips a rolled item once', () => {
    const onAutoEquipItem = vi.fn();
    renderGacha({ onAutoEquipItem });

    fireEvent.click(screen.getByText('QUAY 1 LẦN (1 VÉ)'));
    finishSpin();

    fireEvent.click(screen.getByText('Trang Bị Ngay'));

    expect(onAutoEquipItem).toHaveBeenCalledTimes(1);
    expect(screen.getByText('Đã Trang Bị Vào Ô')).toBeInTheDocument();
    expect(screen.getByText('Đã Trang Bị Vào Ô').closest('button')).toBeDisabled();
  });

  it('ignores spin clicks while spinning', () => {
    const onItemObtained = vi.fn();
    renderGacha({ onItemObtained });

    const button = screen.getByText('QUAY 1 LẦN (1 VÉ)').closest('button')!;
    fireEvent.click(button);
    fireEvent.click(button);
    finishSpin();

    expect(onItemObtained).toHaveBeenCalledTimes(1);
  });
});

describe('GachaModal rate editor', () => {
  it('switches to the rates tab', () => {
    renderGacha();

    fireEvent.click(screen.getByText('Tùy Chỉnh Tỷ Lệ Rơi (C - SS)'));

    expect(screen.getByText(/BẢNG ĐIỀU CHỈNH TỶ LỆ RƠI ĐỒ/)).toBeInTheDocument();
  });

  it('updates a rate from the number input', () => {
    const onUpdateDropRates = vi.fn();
    renderGacha({ onUpdateDropRates });

    fireEvent.click(screen.getByText('Tùy Chỉnh Tỷ Lệ Rơi (C - SS)'));
    const numberInputs = screen.getAllByRole('spinbutton');
    fireEvent.change(numberInputs[0], { target: { value: '60' } });

    expect(onUpdateDropRates).toHaveBeenCalledWith({ ...DEFAULT_DROP_RATES, C: 60 });
  });

  it('clamps negative values to zero', () => {
    const onUpdateDropRates = vi.fn();
    renderGacha({ onUpdateDropRates });

    fireEvent.click(screen.getByText('Tùy Chỉnh Tỷ Lệ Rơi (C - SS)'));
    fireEvent.change(screen.getAllByRole('spinbutton')[0], { target: { value: '-5' } });

    expect(onUpdateDropRates).toHaveBeenCalledWith({ ...DEFAULT_DROP_RATES, C: 0 });
  });

  it('restores the default rates', () => {
    const onUpdateDropRates = vi.fn();
    renderGacha({ onUpdateDropRates });

    fireEvent.click(screen.getByText('Tùy Chỉnh Tỷ Lệ Rơi (C - SS)'));
    fireEvent.click(screen.getByText('Mặc định chuẩn'));

    expect(onUpdateDropRates).toHaveBeenCalledWith(DEFAULT_DROP_RATES);
  });

  it('applies the S/SS-heavy preset', () => {
    const onUpdateDropRates = vi.fn();
    renderGacha({ onUpdateDropRates });

    fireEvent.click(screen.getByText('Tùy Chỉnh Tỷ Lệ Rơi (C - SS)'));
    fireEvent.click(screen.getByText('🔥 Tỷ lệ Siêu Cấp (S/SS Cao)'));

    expect(onUpdateDropRates).toHaveBeenCalledWith({ C: 10, B: 20, A: 30, S: 25, SS: 15 });
  });

  it('applies the S/SS-only test preset', () => {
    const onUpdateDropRates = vi.fn();
    renderGacha({ onUpdateDropRates });

    fireEvent.click(screen.getByText('Tùy Chỉnh Tỷ Lệ Rơi (C - SS)'));
    fireEvent.click(screen.getByText('👑 Test Toàn Đồ S & SS'));

    expect(onUpdateDropRates).toHaveBeenCalledWith({ C: 0, B: 0, A: 0, S: 30, SS: 70 });
  });
});

describe('GachaModal catalog', () => {
  it('lists every item template', () => {
    renderGacha();

    fireEvent.click(screen.getByText('Danh Mục Đồ & Kỹ Năng S/SS'));

    expect(screen.getByText('Thần Kiếm Hố Đen Vũ Trụ [SS]')).toBeInTheDocument();
    expect(screen.getByText('Dao Găm Xung Kích C-01')).toBeInTheDocument();
  });

  it('shows unique skills for S and SS items', () => {
    renderGacha();

    fireEvent.click(screen.getByText('Danh Mục Đồ & Kỹ Năng S/SS'));

    expect(screen.getByText(/TUYỆT KỸ SS: Hố Đen Hủy Diệt Ngân Hà/)).toBeInTheDocument();
  });
});
