import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

function createMockAudioContext() {
  const oscillators = [];
  return {
    state: 'running',
    currentTime: 0,
    destination: {},
    resume: vi.fn(),
    createGain: vi.fn(() => ({
      gain: {
        setValueAtTime: vi.fn(),
        exponentialRampToValueAtTime: vi.fn(),
      },
      connect: vi.fn(),
    })),
    createOscillator: vi.fn(() => {
      const osc = {
        type: 'sine',
        frequency: { value: 0 },
        connect: vi.fn(),
        start: vi.fn(),
        stop: vi.fn(),
      };
      oscillators.push(osc);
      return osc;
    }),
    oscillators,
  };
}

describe('sound', () => {
  let mockCtx;

  beforeEach(() => {
    vi.resetModules();
    mockCtx = createMockAudioContext();
    window.AudioContext = vi.fn(function MockAudioContext() {
      return mockCtx;
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('playCorrectSound plays a tone through the audio context', async () => {
    const { playCorrectSound } = await import('./sound');

    playCorrectSound();

    expect(mockCtx.createOscillator).toHaveBeenCalledTimes(1);
    expect(mockCtx.oscillators[0].start).toHaveBeenCalled();
  });

  it('playCorrectSound plays a second, higher-pitched tone shortly after the first', async () => {
    vi.useFakeTimers();
    const { playCorrectSound } = await import('./sound');

    playCorrectSound();
    vi.advanceTimersByTime(100);

    expect(mockCtx.createOscillator).toHaveBeenCalledTimes(2);
    expect(mockCtx.oscillators[1].frequency.value).toBeGreaterThan(mockCtx.oscillators[0].frequency.value);
  });

  it('playWrongSound plays a single sawtooth tone', async () => {
    const { playWrongSound } = await import('./sound');

    playWrongSound();

    expect(mockCtx.createOscillator).toHaveBeenCalledTimes(1);
    expect(mockCtx.oscillators[0].type).toBe('sawtooth');
  });

  it('regression: does not play any sound while muted', async () => {
    const { playCorrectSound, playWrongSound, setMuted } = await import('./sound');

    setMuted(true);
    playCorrectSound();
    playWrongSound();

    expect(mockCtx.createOscillator).not.toHaveBeenCalled();
  });

  it('plays sound again once unmuted', async () => {
    const { playWrongSound, setMuted } = await import('./sound');

    setMuted(true);
    setMuted(false);
    playWrongSound();

    expect(mockCtx.createOscillator).toHaveBeenCalledTimes(1);
  });

  it('resumes a suspended audio context before playing', async () => {
    mockCtx.state = 'suspended';
    const { playWrongSound } = await import('./sound');

    playWrongSound();

    expect(mockCtx.resume).toHaveBeenCalled();
  });
});
