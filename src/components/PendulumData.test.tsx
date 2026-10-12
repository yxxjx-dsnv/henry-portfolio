import { vi } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { PendulumData } from './PendulumData';
import { BENCH } from './pendulumModel';
import type { Row } from './pendulumBench';

const row = (id: number, L: number, extra: Partial<Row> = {}): Row => ({
  id,
  setup: { ...BENCH, stringLength: L },
  angleRead: (30 * Math.PI) / 180,
  how: 'Tracker 30 fps',
  byHand: false,
  period: { value: 0.952, uncertainty: 0.0005 },
  ...extra,
});
const heads = () => screen.getAllByRole('columnheader').map((h) => h.textContent);
const noop = () => {};

test('no rows, nothing drawn', () => {
  const { container } = render(<PendulumData rows={[]} unit="deg" onClear={noop} onRemove={noop} />);
  expect(container).toBeEmptyDOMElement();
});

test('one row shows L and θ₀, then T to the decimals its uncertainty earns', () => {
  render(<PendulumData rows={[row(1, 0.2)]} unit="deg" onClear={noop} onRemove={noop} />);
  expect(heads()).toEqual(['#', 'L (cm)', 'θ₀ (°)', 'T (s)', 'remove']);
  const cells = screen.getAllByRole('cell').map((c) => c.textContent);
  expect(cells.slice(0, 4)).toEqual(['1', '20.0', '30.0', '0.9520 ± 0.0005']);
});

test('only what varies gets a column; refusals keep their reasons', () => {
  const rows = [
    row(1, 0.2, { byHand: true }),
    row(2, 0.3, { period: { reason: 'needs 2 more full swings' }, decay: { reason: 'x' }, q: { reason: 'x' } }),
    row(3, 0.25, { decay: { value: 178, uncertainty: 4 }, q: { reason: 'the swing is not dying away' } }),
  ];
  render(<PendulumData rows={rows} unit="rad" onClear={noop} onRemove={noop} />);
  expect(heads()).toEqual(['#', 'L (cm)', 'T (s)', 'τ (s)', 'Q', 'how', 'remove']);
  const why = screen.getByText('needs 2 more full swings');
  expect(why).toHaveAttribute('colspan', '3');
  const r3 = screen.getAllByRole('row')[3];
  expect(within(r3).getByText('178 ± 4')).toBeInTheDocument();
  expect(within(r3).getByTitle('the swing is not dying away')).toHaveTextContent('—');
  expect(within(screen.getAllByRole('row')[1]).getByText('Tracker 30 fps · hand')).toBeInTheDocument();
});

test('remove, clear and the CSV download', () => {
  const onRemove = vi.fn();
  const onClear = vi.fn();
  URL.createObjectURL = vi.fn(() => 'blob:x');
  URL.revokeObjectURL = vi.fn();
  const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (this: HTMLAnchorElement) {
    expect(this.download).toBe('pendulum-lab.csv');
  });
  render(<PendulumData rows={[row(4, 0.2), row(7, 0.3)]} unit="deg" onClear={onClear} onRemove={onRemove} />);
  fireEvent.click(screen.getByRole('button', { name: 'Remove row 7' }));
  expect(onRemove).toHaveBeenCalledWith(7);
  fireEvent.click(screen.getByRole('button', { name: '↺ clear' }));
  expect(onClear).toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', { name: '↓ CSV' }));
  expect(click).toHaveBeenCalledTimes(1);
  expect(URL.createObjectURL).toHaveBeenCalledWith(expect.any(Blob));
  click.mockRestore();
});
