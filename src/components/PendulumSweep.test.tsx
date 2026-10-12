import { vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { PendulumSweep } from './PendulumSweep';
import { BENCH } from './pendulumModel';
import { PRESETS } from './pendulumBench';

const props = (over: Partial<Parameters<typeof PendulumSweep>[0]> = {}) => ({
  base: BENCH,
  unit: 'deg' as const,
  progress: null,
  activePreset: null,
  onPreset: vi.fn(),
  onRun: vi.fn(),
  onStop: vi.fn(),
  showForm: true,
  ...over,
});
const num = (name: string) => screen.getByRole('spinbutton', { name }) as HTMLInputElement;

test('a preset is one click, the active one is pressed', () => {
  const p = props({ activePreset: 'angle' });
  render(<PendulumSweep {...p} />);
  expect(screen.getByRole('button', { name: 'Lab 1 · Period vs angle' })).toHaveAttribute('aria-pressed', 'true');
  fireEvent.click(screen.getByRole('button', { name: 'Lab 2 · Period vs length' }));
  expect(p.onPreset).toHaveBeenCalledWith(PRESETS[2]);
});

test('the sweep runs in display units, clamped to the bench, steps × repeats', () => {
  const onRun = vi.fn();
  render(<PendulumSweep {...props({ onRun })} />);
  expect([num('from').value, num('to').value]).toEqual(['5', '30']); // cm
  fireEvent.change(num('to'), { target: { value: '999' } }); // past the bench's 60 cm
  fireEvent.click(screen.getByRole('button', { name: '▶ sweep 6' }));
  const Ls = onRun.mock.calls[0][0].map((s: typeof BENCH) => s.stringLength);
  expect(Ls[0]).toBeCloseTo(0.05);
  expect(Ls[5]).toBeCloseTo(0.6);

  // a new variable resets its ends; the angle reads in the lab's unit
  fireEvent.change(screen.getByRole('combobox', { name: 'Variable' }), { target: { value: 'theta0' } });
  expect([num('from').value, num('to').value]).toEqual(['10', '80']);
  fireEvent.change(num('to'), { target: { value: '40' } });
  fireEvent.change(num('steps'), { target: { value: '3' } });
  fireEvent.change(num('repeats'), { target: { value: '2' } });
  fireEvent.click(screen.getByRole('button', { name: '▶ sweep 6' }));
  const degs = onRun.mock.calls[1][0].map((s: typeof BENCH) => Math.round((s.theta0 * 180) / Math.PI));
  expect(degs).toEqual([10, 10, 25, 25, 40, 40]);
});

test('while running: presets and fields locked, stop and the count shown', () => {
  const p = props({ progress: { done: 2, total: 6 } });
  render(<PendulumSweep {...p} />);
  expect(PRESETS.every((x) => screen.getByRole('button', { name: `${x.lab} · ${x.name}` }).hasAttribute('disabled'))).toBe(true);
  expect(num('from')).toBeDisabled();
  expect(screen.getByText('2 / 6')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: '■ stop' }));
  expect(p.onStop).toHaveBeenCalled();
});
