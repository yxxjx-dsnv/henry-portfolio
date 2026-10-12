import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { ArcadeOverlay } from './ArcadeOverlay';
import { DotField } from './DotField';

// a 2D context that takes every call, so both game loops run in jsdom
const ctx = new Proxy({}, { get: () => () => {} }) as unknown as CanvasRenderingContext2D;

beforeEach(() => {
  vi.useFakeTimers({ now: 0, toFake: ['requestAnimationFrame', 'cancelAnimationFrame', 'performance'] });
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(ctx);
});
afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

it('leaves typing in the palette over a game, and browser shortcuts, alone', () => {
  render(
    <>
      <input aria-label="palette" />
      <ArcadeOverlay />
    </>,
  );
  act(() => void window.dispatchEvent(new CustomEvent('henry:tetris')));
  act(() => vi.advanceTimersByTime(600)); // past the unfold, into play
  const input = screen.getByLabelText('palette');
  expect(fireEvent.keyDown(window, { key: 'ArrowLeft' })).toBe(false); // the game takes its keys
  expect(fireEvent.keyDown(input, { key: 'd' })).toBe(true); // but not the palette's letters
  expect(fireEvent.keyDown(window, { key: 'ArrowLeft', metaKey: true })).toBe(true); // ⌘← stays Back
  fireEvent.keyDown(input, { key: 'Escape' }); // the palette's Esc
  act(() => vi.advanceTimersByTime(600));
  expect(screen.getByRole('dialog', { name: 'tetris game' })).toBeInTheDocument();
});

it('wakes the band in its starting gesture and ends it when a game opens', () => {
  const resume = vi.fn(() => Promise.resolve());
  const oscillators = vi.fn();
  const node = () => new Proxy({}, { get: (_t, p) => (p === 'connect' ? () => node() : () => {}) });
  const param = { setValueAtTime() {}, exponentialRampToValueAtTime() {}, value: 0 };
  vi.stubGlobal(
    'AudioContext',
    class {
      state = 'suspended'; // how Safari makes one outside a gesture
      currentTime = 0;
      sampleRate = 8000;
      destination = {};
      resume() {
        this.state = 'running'; // a resume inside the gesture wakes it
        return resume();
      }
      close() {}
      createOscillator() {
        oscillators();
        return Object.assign(node(), { frequency: param });
      }
      createGain() {
        return Object.assign(node(), { gain: param });
      }
      createBuffer() {
        return { getChannelData: () => new Float32Array(1) };
      }
      createBufferSource = node;
      createBiquadFilter = () => Object.assign(node(), { frequency: param });
    },
  );
  render(
    <>
      <DotField />
      <ArcadeOverlay />
    </>,
  );
  act(() => void window.dispatchEvent(new CustomEvent('henry:band')));
  expect(resume).toHaveBeenCalled();
  act(() => vi.advanceTimersByTime(1000));
  expect(document.body).toHaveClass('egg-playing');
  expect(oscillators).toHaveBeenCalled();

  act(() => void window.dispatchEvent(new CustomEvent('henry:tetris')));
  act(() => vi.advanceTimersByTime(100));
  expect(document.body).not.toHaveClass('egg-playing');
  oscillators.mockClear();
  act(() => vi.advanceTimersByTime(2000));
  expect(oscillators).not.toHaveBeenCalled(); // the band is silent under the game
});
