import { useState } from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { PendulumSetup } from './PendulumSetup';
import { BENCH, GRAVITY, MATERIALS, solidBobMass, type Setup } from './pendulumModel';
import { DEFAULT_MEASURE, type Measure } from './pendulumBench';

let now: { setup: Setup; measure: Measure };

function Bench({ locked = false }: { locked?: boolean }) {
  const [setup, onSetup] = useState(BENCH);
  const [measure, onMeasure] = useState<Measure>(DEFAULT_MEASURE);
  now = { setup, measure };
  return <PendulumSetup setup={setup} onSetup={onSetup} measure={measure} onMeasure={onMeasure} unit="deg" locked={locked} />;
}

const pressed = (group: string) =>
  within(screen.getByRole('group', { name: group }))
    .queryAllByRole('button', { pressed: true })
    .map((b) => b.textContent);

test('the bob chip on follows the numbers: material, radius, a typed mass, the lab bob', () => {
  render(<Bench />);
  expect(pressed('Material')).toEqual(['lab bob']);

  fireEvent.click(screen.getByRole('button', { name: 'steel' }));
  expect(now.setup.bobMass).toBeCloseTo(solidBobMass(MATERIALS.steel, BENCH.bobRadius), 9);
  expect(pressed('Material')).toEqual(['steel']);

  // a solid bob keeps its material as it grows
  fireEvent.change(screen.getByLabelText('radius'), { target: { value: '3' } });
  expect(now.setup.bobRadius).toBeCloseTo(0.03, 9);
  expect(now.setup.bobMass).toBeCloseTo(solidBobMass(MATERIALS.steel, 0.03), 9);
  expect(pressed('Material')).toEqual(['steel']);

  // typing a mass makes it no material at all; out of range is not committed
  fireEvent.change(screen.getByLabelText('mass'), { target: { value: '100' } });
  expect(now.setup.bobMass).toBeCloseTo(0.1, 9);
  expect(pressed('Material')).toEqual([]);
  fireEvent.change(screen.getByLabelText('mass'), { target: { value: '5000' } });
  expect(now.setup.bobMass).toBeCloseTo(0.1, 9);

  fireEvent.click(screen.getByRole('button', { name: 'lab bob' }));
  expect([now.setup.bobMass, now.setup.bobRadius]).toEqual([BENCH.bobMass, BENCH.bobRadius]);
});

test('environment chips and the g box agree; instrument switches its own choices; ↺ bench restores', () => {
  render(<Bench />);
  fireEvent.click(screen.getByRole('button', { name: 'Moon' }));
  expect(now.setup.g).toBe(GRAVITY.moon);
  expect(screen.getByLabelText('g')).toHaveValue(1.62);
  fireEvent.change(screen.getByLabelText('g'), { target: { value: '5' } });
  expect(pressed('Gravity')).toEqual([]);
  fireEvent.click(screen.getByRole('button', { name: 'Water' }));
  fireEvent.click(screen.getByRole('button', { name: 'rusty' }));
  expect([now.setup.fluid.rho, now.setup.pivotFriction]).toEqual([998, 1e-3]);

  fireEvent.click(screen.getByRole('button', { name: 'decay' }));
  fireEvent.click(screen.getByRole('button', { name: '60 fps' }));
  expect(now.measure).toEqual({ kind: 'tracker', fps: 60, decay: true });
  fireEvent.click(screen.getByRole('button', { name: 'stopwatch' }));
  expect(screen.queryByRole('button', { name: '60 fps' })).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: '×5' }));
  expect(now.measure).toEqual({ kind: 'stopwatch', swings: 5 });

  fireEvent.change(screen.getByLabelText('length'), { target: { value: '45' } });
  expect(now.setup.stringLength).toBeCloseTo(0.45, 9);
  fireEvent.click(screen.getByRole('button', { name: '↺ bench' }));
  expect(now).toEqual({ setup: BENCH, measure: DEFAULT_MEASURE });
});

test('locked: every control is disabled', () => {
  render(<Bench locked />);
  for (const el of [...screen.getAllByRole('button'), ...screen.getAllByRole('slider'), ...screen.getAllByRole('spinbutton')])
    expect(el).toBeDisabled();
});
