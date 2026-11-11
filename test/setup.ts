import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

// Node 26 exposes an experimental `localStorage` global that is undefined
// without --localstorage-file and shadows jsdom's implementation.
if (typeof globalThis.localStorage === 'undefined') {
  class MemoryStorage implements Storage {
    private store = new Map<string, string>();
    get length() {
      return this.store.size;
    }
    clear() {
      this.store.clear();
    }
    getItem(key: string) {
      return this.store.has(key) ? this.store.get(key)! : null;
    }
    key(index: number) {
      return Array.from(this.store.keys())[index] ?? null;
    }
    removeItem(key: string) {
      this.store.delete(key);
    }
    setItem(key: string, value: string) {
      this.store.set(key, String(value));
    }
  }
  Object.defineProperty(globalThis, 'localStorage', {
    value: new MemoryStorage(),
    configurable: true,
    writable: true,
  });
}

afterEach(() => {
  cleanup();
  localStorage.clear();
});

// jsdom has no Web Audio API; the sound engine must stay silent in tests.
class FakeAudioParam {
  setValueAtTime = vi.fn();
  exponentialRampToValueAtTime = vi.fn();
  linearRampToValueAtTime = vi.fn();
}

class FakeAudioNode {
  connect = vi.fn();
  disconnect = vi.fn();
}

class FakeOscillator extends FakeAudioNode {
  type = 'sine';
  frequency = new FakeAudioParam();
  start = vi.fn();
  stop = vi.fn();
}

class FakeGain extends FakeAudioNode {
  gain = new FakeAudioParam();
}

class FakeAudioContext {
  state = 'running';
  currentTime = 0;
  destination = new FakeAudioNode();
  createOscillator = () => new FakeOscillator();
  createGain = () => new FakeGain();
  createBuffer = () => ({ getChannelData: () => new Float32Array(128) });
  createBufferSource = () => ({ connect: vi.fn(), start: vi.fn(), stop: vi.fn(), buffer: null });
  createBiquadFilter = () => ({ ...new FakeAudioNode(), frequency: new FakeAudioParam(), Q: new FakeAudioParam(), type: 'lowpass' });
  resume = vi.fn();
  suspend = vi.fn();
  close = vi.fn();
}

vi.stubGlobal('AudioContext', FakeAudioContext);
