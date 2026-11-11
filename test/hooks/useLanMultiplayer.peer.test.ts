import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useLanMultiplayer } from '@/hooks/useLanMultiplayer';

/** Minimal PeerJS stand-in that records instances and lets tests fire events. */
class FakePeer {
  static instances: FakePeer[] = [];
  id: string;
  handlers: Record<string, (...args: any[]) => void> = {};
  connections: FakeConnection[] = [];
  destroyed = false;

  constructor(id?: string) {
    this.id = id ?? `peer_${FakePeer.instances.length}`;
    FakePeer.instances.push(this);
  }
  on(event: string, handler: (...args: any[]) => void) {
    this.handlers[event] = handler;
  }
  emit(event: string, ...args: any[]) {
    this.handlers[event]?.(...args);
  }
  connect(_id: string) {
    const conn = new FakeConnection();
    this.connections.push(conn);
    return conn;
  }
  destroy() {
    this.destroyed = true;
  }
}

class FakeConnection {
  open = false;
  sent: unknown[] = [];
  handlers: Record<string, (...args: any[]) => void> = {};
  on(event: string, handler: (...args: any[]) => void) {
    this.handlers[event] = handler;
  }
  emit(event: string, ...args: any[]) {
    this.handlers[event]?.(...args);
  }
  send(data: unknown) {
    this.sent.push(data);
  }
}

class FakeBroadcastChannel {
  static instances: FakeBroadcastChannel[] = [];
  onmessage: ((ev: MessageEvent) => void) | null = null;
  posted: unknown[] = [];
  constructor(public name: string) {
    FakeBroadcastChannel.instances.push(this);
  }
  postMessage(data: unknown) {
    this.posted.push(data);
  }
  close() {}
  emit(data: unknown) {
    this.onmessage?.({ data } as MessageEvent);
  }
}

beforeEach(() => {
  FakePeer.instances = [];
  FakeBroadcastChannel.instances = [];
  vi.stubGlobal('BroadcastChannel', FakeBroadcastChannel);
  (window as any).Peer = FakePeer;
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  delete (window as any).Peer;
});

describe('useLanMultiplayer with PeerJS', () => {
  it('creates a host peer with a deterministic id', async () => {
    const { result } = renderHook(() => useLanMultiplayer());

    await act(async () => {
      await result.current.createLanRoom();
    });

    const peer = FakePeer.instances.at(-1)!;
    expect(peer.id).toBe(`cybercaro-3d-${result.current.lanRoomCode.toLowerCase()}`);
  });

  it('marks the room connected when a peer connection opens', async () => {
    const { result } = renderHook(() => useLanMultiplayer());

    await act(async () => {
      await result.current.createLanRoom();
    });
    const peer = FakePeer.instances.at(-1)!;
    const conn = new FakeConnection();

    act(() => {
      peer.emit('connection', conn);
      conn.open = true;
      conn.emit('open');
    });

    expect(result.current.lanStatus).toBe('CONNECTED');
    expect(result.current.lanTransport).toBe('WebRTC P2P Wi-Fi');
  });

  it('handles data received over the peer connection', async () => {
    const onPacketReceived = vi.fn();
    const { result } = renderHook(() => useLanMultiplayer({ onPacketReceived }));

    await act(async () => {
      await result.current.createLanRoom();
    });
    const peer = FakePeer.instances.at(-1)!;
    const conn = new FakeConnection();

    act(() => {
      peer.emit('connection', conn);
      conn.emit('data', { type: 'CHAT', sender: 'Bình', text: 'qua WebRTC' });
    });

    expect(result.current.chatMessages.some((m) => m.text === 'qua WebRTC')).toBe(true);
    expect(onPacketReceived).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'CHAT', text: 'qua WebRTC' })
    );
  });

  it('sends packets over an open peer connection', async () => {
    const { result } = renderHook(() => useLanMultiplayer());

    await act(async () => {
      await result.current.createLanRoom();
    });
    const peer = FakePeer.instances.at(-1)!;
    const conn = new FakeConnection();

    act(() => {
      peer.emit('connection', conn);
      conn.open = true;
      conn.emit('open');
    });
    act(() => {
      result.current.sendChat('qua peer', 'An');
    });

    expect(conn.sent).toContainEqual({ type: 'CHAT', sender: 'An', text: 'qua peer' });
  });

  it('destroys the previous peer when creating a new room', async () => {
    const { result } = renderHook(() => useLanMultiplayer());

    await act(async () => {
      await result.current.createLanRoom();
    });
    const first = FakePeer.instances.at(-1)!;

    await act(async () => {
      await result.current.createLanRoom();
    });

    expect(first.destroyed).toBe(true);
  });

  it('connects a guest to the host peer id', async () => {
    const { result } = renderHook(() => useLanMultiplayer());

    await act(async () => {
      await result.current.joinLanRoom('AB12-34');
    });
    const peer = FakePeer.instances.at(-1)!;

    act(() => {
      peer.emit('open');
    });

    expect(peer.connections).toHaveLength(1);
    const conn = peer.connections[0];
    act(() => {
      conn.open = true;
      conn.emit('open');
    });

    expect(result.current.lanStatus).toBe('CONNECTED');
    expect(conn.sent).toContainEqual(
      expect.objectContaining({ type: 'GUEST_JOINED', transport: 'WebRTC P2P Wi-Fi' })
    );
  });

  it('falls back to BroadcastChannel when PeerJS throws', async () => {
    (window as any).Peer = class {
      constructor() {
        throw new Error('peer unavailable');
      }
    };
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { result } = renderHook(() => useLanMultiplayer());

    await act(async () => {
      await result.current.createLanRoom();
    });

    expect(result.current.lanStatus).toBe('WAITING');
    expect(FakeBroadcastChannel.instances).toHaveLength(1);
  });
});
