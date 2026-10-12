import { vi } from 'vitest';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { PendulumGraph } from './PendulumGraph';
import { BENCH } from './pendulumModel';
import type { Row } from './pendulumBench';

const row = (id: number, L: number, extra: Partial<Row> = {}): Row => ({
  id,
  setup: { ...BENCH, stringLength: L },
  angleRead: 0.52,
  how: 'Tracker 30 fps',
  byHand: false,
  period: { value: 2 * Math.sqrt(L), uncertainty: 0.0005 },
  ...extra,
});
const noop = () => {};
const values = (select: HTMLElement) => within(select).getAllByRole('option').map((o) => (o as HTMLOptionElement).value);

afterEach(() => vi.unstubAllGlobals());

test("with no rows it still draws the axes, the textbook line and the report's points", async () => {
  const text = 'x y dx dy\n0.05 0.5444 0.001 0.0047\n0.10 0.7072 0.001 0.0046\n';
  vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, text: async () => text })));
  const { container } = render(<PendulumGraph rows={[]} base={BENCH} unit="deg" x="L" y="T" fitKind={null} onAxes={noop} onFit={noop} />);
  expect(screen.getByText('each release adds a point')).toBeInTheDocument();
  expect(screen.getByText('textbook')).toBeInTheDocument();
  await waitFor(() => expect(container.querySelectorAll('.pl-report-dot')).toHaveLength(2));
  expect(fetch).toHaveBeenCalledWith('/media/pendulum/data/period-vs-length.txt');
  expect(container.innerHTML).not.toContain('NaN');
});

test('the axes follow the table: A only once a decay is recorded, and it forces x = t', () => {
  const onAxes = vi.fn();
  const rows = [row(1, 0.2), row(2, 0.2, { setup: { ...BENCH, bobMass: 0.1 } })];
  const { rerender } = render(<PendulumGraph rows={rows} base={BENCH} unit="rad" x="m" y="T" fitKind={null} onAxes={onAxes} onFit={noop} />);
  expect(values(screen.getByLabelText('y axis'))).toEqual(['T']);
  expect(values(screen.getByLabelText('x axis'))[0]).toBe('m'); // the knob that varied comes first

  const decayed = [...rows, row(3, 0.2, { envelope: [{ x: 0.9, y: 0.5 }, { x: 1.8, y: 0.49 }] })];
  rerender(<PendulumGraph rows={decayed} base={BENCH} unit="rad" x="m" y="T" fitKind={null} onAxes={onAxes} onFit={noop} />);
  fireEvent.change(screen.getByLabelText('y axis'), { target: { value: 'A' } });
  expect(onAxes).toHaveBeenLastCalledWith('t', 'A');

  rerender(<PendulumGraph rows={decayed} base={BENCH} unit="rad" x="t" y="A" fitKind={null} onAxes={onAxes} onFit={noop} />);
  expect(values(screen.getByLabelText('x axis'))).toEqual(['t']);
  fireEvent.change(screen.getByLabelText('y axis'), { target: { value: 'T' } });
  expect(onAxes).toHaveBeenLastCalledWith('m', 'T');
});

test('a fit in SI against the report, its residuals, a refusal in words, and the hover tip in display units', () => {
  const onFit = vi.fn();
  const rows = [row(1, 0.1), row(2, 0.2), row(3, 0.4)];
  const { container, rerender } = render(<PendulumGraph rows={rows} base={BENCH} unit="deg" x="L" y="T" fitKind="power" onAxes={noop} onFit={onFit} />);
  const note = container.querySelector('.pl-graph-note')!;
  expect(note).toHaveTextContent('y = 2·x^0.5 (x in m) · n 0.500 — report 0.433');
  expect(screen.getByText('ΔT')).toBeInTheDocument();

  fireEvent.click(container.querySelectorAll('.lab-twin-dot')[1].parentElement!); // a tap, or a mouse's hover
  expect(screen.getByText('20.0 cm, 0.8944 ± 0.0005 s')).toBeInTheDocument();

  fireEvent.click(screen.getByRole('button', { name: 'none' }));
  expect(onFit).toHaveBeenLastCalledWith(null);

  rerender(<PendulumGraph rows={rows.slice(0, 2)} base={BENCH} unit="deg" x="L" y="T" fitKind="quadratic" onAxes={noop} onFit={onFit} />);
  expect(note).toHaveTextContent('needs points at 3 or more different x values');
  expect(screen.queryByText('ΔT')).not.toBeInTheDocument();
  expect(container.innerHTML).not.toContain('NaN');
});
