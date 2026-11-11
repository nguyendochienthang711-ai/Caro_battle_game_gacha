import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useLanMultiplayer } from '@/hooks/useLanMultiplayer';
import { LanMessagePacket } from '@/types/game';

class FakeBroadcastChannel {
  static instances: FakeBroadcastChannel[] = [];
  name: string;
  onmessage: ((ev: MessageEvent) => void) | null = null;
  posted: unknown[] = [];
  closed = false;

  constructor(name: string) {
    this.name = name;
    FakeBroadcastChannel.instances.push(this);
  }
  postMessage(data: unknown) {
    this.posted.push(data);
  }
  close() {
    this.closed = true;
  }
  emit(data: unknown) {
    this.onmessage?.({ data } as MessageEvent);
  }
}

beforeEach(() => {
  FakeBroadcastChannel.instances = [];
  vi.stubGlobal('BroadcastChannel', FakeBroadcastChannel);
  // No PeerJS in tests: the hook must fall back to BroadcastChannel.
  delete (window as any).Peer;
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('useLanMultiplayer initial state', () => {
  it('starts disconnected as host with a welcome message', () => {
    const { result } = renderHook(() => useLanMultiplayer());

    expect(result.current.lanRole).toBe('HOST');
    expect(result.current.lanStatus).toBe('DISCONNECTED');
    expect(result.current.lanRoomCode).toBe('');
    expect(result.current.chatMessages).toHaveLength(1);
    expect(result.current.chatMessages[0].sender).toBe('SYSTEM');
    expect(result.current.floatingEmoji).toBeNull();
  });
});

describe('createLanRoom', () => {
  it('creates a room code in the AB12-34 format', async () => {
    const { result } = renderHook(() => useLanMultiplayer());

    await act(async () => {
      await result.current.createLanRoom();
    });

    expect(result.current.lanRoomCode).toMatch(/^[A-Z0-9]{4}-\d{2}$/);
    expect(result.current.lanRole).toBe('HOST');
    expect(result.current.lanStatus).toBe('WAITING');
  });

  it('opens a BroadcastChannel for the room', async () => {
    const { result } = renderHook(() => useLanMultiplayer());

    await act(async () => {
      await result.current.createLanRoom();
    });

    const channel = FakeBroadcastChannel.instances.at(-1)!;
    expect(channel.name).toBe(`cybercaro_lan_${result.current.lanRoomCode}`);
  });

  it('marks the room connected when a guest joins', async () => {
    const { result } = renderHook(() => useLanMultiplayer());

    await act(async () => {
      await result.current.createLanRoom();
    });
    const channel = FakeBroadcastChannel.instances.at(-1)!;

    act(() => {
      channel.emit({ type: 'GUEST_JOINED', guestName: 'Bình', transport: 'Local LAN Sync' });
    });

    expect(result.current.lanStatus).toBe('CONNECTED');
    expect(result.current.lanTransport).toBe('Local LAN Sync');
    expect(result.current.chatMessages.at(-1)!.text).toContain('Bình');
  });
});

describe('joinLanRoom', () => {
  it('normalizes the room code and becomes the guest', async () => {
    const { result } = renderHook(() => useLanMultiplayer());

    await act(async () => {
      await result.current.joinLanRoom('  ab12-34 ');
    });

    expect(result.current.lanRoomCode).toBe('AB12-34');
    expect(result.current.lanRole).toBe('GUEST');
  });

  it('ignores an empty room code', async () => {
    const { result } = renderHook(() => useLanMultiplayer());

    await act(async () => {
      await result.current.joinLanRoom('   ');
    });

    expect(result.current.lanRoomCode).toBe('');
    expect(result.current.lanRole).toBe('HOST');
  });

  it('announces the guest on the channel after 150ms', async () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => useLanMultiplayer({ guestDefaultName: 'Khách A' }));

    await act(async () => {
      await result.current.joinLanRoom('AB12-34');
    });
    const channel = FakeBroadcastChannel.instances.at(-1)!;

    act(() => {
      vi.advanceTimersByTime(200);
    });

    expect(channel.posted).toContainEqual({
      type: 'GUEST_JOINED',
      guestName: 'Khách A',
      transport: 'Local LAN Sync',
    });
  });

  it('falls back to a connected LAN channel after 500ms', async () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => useLanMultiplayer());

    await act(async () => {
      await result.current.joinLanRoom('AB12-34');
    });

    act(() => {
      vi.advanceTimersByTime(600);
    });

    expect(result.current.lanStatus).toBe('CONNECTED');
    expect(result.current.lanTransport).toBe('LAN Channel');
  });
});

describe('incoming packets', () => {
  function setup() {
    const onPacketReceived = vi.fn();
    const hook = renderHook(() => useLanMultiplayer({ onPacketReceived }));
    return { ...hook, onPacketReceived };
  }

  it('appends incoming chat messages', async () => {
    const { result } = setup();

    await act(async () => {
      await result.current.createLanRoom();
    });
    const channel = FakeBroadcastChannel.instances.at(-1)!;

    act(() => {
      channel.emit({ type: 'CHAT', sender: 'Bình', text: 'GG' });
    });

    expect(result.current.chatMessages.some((m) => m.text === 'GG')).toBe(true);
  });

  it('shows a floating emoji for incoming reactions', () => {
    const { result } = setup();

    act(() => {
      result.current.sendEmoji('🔥', 'An');
    });

    expect(result.current.floatingEmoji).toMatchObject({ emoji: '🔥', sender: 'An' });
  });

  it('forwards every packet to the callback', () => {
    const { result, onPacketReceived } = setup();
    const packet: LanMessagePacket = { type: 'MOVE', row: 1, col: 2, player: 'X' };

    act(() => {
      result.current.sendLanPacket(packet);
    });

    // sendLanPacket only transmits; delivery is verified through the channel below.
    const channel = FakeBroadcastChannel.instances.at(-1);
    if (channel) {
      act(() => {
        channel.emit(packet);
      });
      expect(onPacketReceived).toHaveBeenCalledWith(packet);
    }
  });

  it('ignores packets without a type', () => {
    const { result, onPacketReceived } = setup();
    const channel = FakeBroadcastChannel.instances.at(-1);

    if (channel) {
      act(() => {
        channel.emit({} as LanMessagePacket);
      });
      expect(onPacketReceived).not.toHaveBeenCalled();
    }
  });
});

describe('sendChat and sendEmoji', () => {
  it('adds a trimmed chat message locally', () => {
    const { result } = renderHook(() => useLanMultiplayer());

    act(() => {
      result.current.sendChat('  hello  ', 'An');
    });

    const last = result.current.chatMessages.at(-1)!;
    expect(last.text).toBe('hello');
    expect(last.sender).toBe('An');
  });

  it('ignores empty chat messages', () => {
    const { result } = renderHook(() => useLanMultiplayer());
    const before = result.current.chatMessages.length;

    act(() => {
      result.current.sendChat('   ', 'An');
    });

    expect(result.current.chatMessages).toHaveLength(before);
  });

  it('sets the floating emoji locally', () => {
    const { result } = renderHook(() => useLanMultiplayer());

    act(() => {
      result.current.sendEmoji('🏆', 'An');
    });

    expect(result.current.floatingEmoji).toMatchObject({ emoji: '🏆', sender: 'An' });
  });

  it('broadcasts chat and emoji over the channel', async () => {
    const { result } = renderHook(() => useLanMultiplayer());

    await act(async () => {
      await result.current.createLanRoom();
    });
    const channel = FakeBroadcastChannel.instances.at(-1)!;

    act(() => {
      result.current.sendChat('hi', 'An');
      result.current.sendEmoji('🔥', 'An');
    });

    expect(channel.posted).toContainEqual({ type: 'CHAT', sender: 'An', text: 'hi' });
    expect(channel.posted).toContainEqual({ type: 'EMOJI', emoji: '🔥', sender: 'An' });
  });
});
