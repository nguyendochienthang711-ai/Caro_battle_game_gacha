import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { CyberSoundEngine } from '@/lib/soundEngine';

let engine: CyberSoundEngine;

beforeEach(() => {
  engine = new CyberSoundEngine();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('CyberSoundEngine', () => {
  it('starts unmuted', () => {
    expect(engine.muted).toBe(false);
  });

  it('stays silent when muted', () => {
    engine.muted = true;
    // Spy on the instance the engine will create rather than the prototype,
    // because the setup file stubs AudioContext with a plain class.
    const createOscillator = vi.fn();
    const OriginalAudioContext = globalThis.AudioContext;
    globalThis.AudioContext = class {
      state = 'running';
      currentTime = 0;
      destination = {};
      createOscillator = createOscillator;
      createGain = () => ({ connect: vi.fn(), gain: { setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() } });
      resume = vi.fn();
    } as unknown as typeof AudioContext;

    engine.playPlacePiece('X');
    engine.playHover();
    engine.playWinFanfare();
    engine.playTick();
    engine.playThreatAlert();
    engine.playUndo();

    expect(createOscillator).not.toHaveBeenCalled();
    globalThis.AudioContext = OriginalAudioContext;
  });

  it('plays a placement sound for both players', () => {
    expect(() => engine.playPlacePiece('X')).not.toThrow();
    expect(() => engine.playPlacePiece('O')).not.toThrow();
  });

  it('plays every effect without throwing', () => {
    expect(() => engine.playHover()).not.toThrow();
    expect(() => engine.playTick()).not.toThrow();
    expect(() => engine.playThreatAlert()).not.toThrow();
    expect(() => engine.playUndo()).not.toThrow();
    expect(() => engine.playWinFanfare()).not.toThrow();
    expect(() => engine.playBattleHit(true)).not.toThrow();
    expect(() => engine.playBattleHit(false)).not.toThrow();
  });

  it('plays item reveal sounds for every rarity', () => {
    (['C', 'B', 'A', 'S', 'SS'] as const).forEach((rarity) => {
      expect(() => engine.playItemReveal(rarity)).not.toThrow();
    });
  });

  it('survives a missing AudioContext', () => {
    const original = globalThis.AudioContext;
    // Simulate an environment without Web Audio.
    delete (globalThis as any).AudioContext;
    delete (globalThis as any).webkitAudioContext;

    expect(() => engine.playPlacePiece('X')).not.toThrow();

    globalThis.AudioContext = original;
  });
});
