// The lab's results table: one row per measurement, only the columns that say something
// (the knobs that changed, and what was measured), newest row kept in view, out as CSV.
import { useEffect, useRef } from 'react';
import { useLang } from '../i18n';
import { refused, type Result } from './pendulumInstruments';
import { COLUMNS, display, fmtReading, toCSV, varying, type AngleUnit, type ColKey, type Row } from './pendulumBench';

const RESULT: Record<'T' | 'tau' | 'Q', (r: Row) => Result | undefined> = { T: (r) => r.period, tau: (r) => r.decay, Q: (r) => r.q };
const howOf = (r: Row, hand: string) => r.how + (r.byHand ? ` · ${hand}` : '');

function downloadCSV(rows: Row[]) {
  const url = URL.createObjectURL(new Blob([toCSV(rows)], { type: 'text/csv' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = 'pendulum-lab.csv';
  a.click();
  setTimeout(() => URL.revokeObjectURL(url)); // after the click has started the download (Safari)
}

export function PendulumData({ rows, unit, onClear, onRemove }: { rows: Row[]; unit: AngleUnit; onClear: () => void; onRemove: (id: number) => void }) {
  const { t } = useLang();
  const box = useRef<HTMLDivElement>(null);
  const newest = rows.length ? rows[rows.length - 1].id : -1;
  useEffect(() => {
    if (box.current) box.current.scrollTop = box.current.scrollHeight; // the box's own scroll, never the page's
  }, [newest]);
  if (!rows.length) return null;

  const vary = varying(rows);
  const inputs: ColKey[] = vary.length ? vary : ['L', 'theta'];
  const measured = (['T', 'tau', 'Q'] as const).filter((k) => k === 'T' || rows.some((r) => RESULT[k](r)));
  const hand = t('hand');
  const showHow = new Set(rows.map((r) => howOf(r, hand))).size > 1;
  const head = (k: ColKey) => {
    const u = display(k, unit).unit;
    return u ? `${COLUMNS[k].label} (${u})` : COLUMNS[k].label;
  };

  const reading = (r: Row, k: 'T' | 'tau' | 'Q') => {
    const res = RESULT[k](r);
    if (!res) return <td key={k} />;
    if (refused(res))
      return (
        <td key={k} title={res.reason}>
          —<span className="sr-only">{res.reason}</span>
        </td>
      );
    const d = display(k, unit);
    const e = COLUMNS[k].err?.(r);
    return <td key={k}>{fmtReading(res.value * d.scale, e && e * d.scale, e ? 0 : d.digits)}</td>;
  };

  return (
    <div className="pl-data">
      <div className="pl-data-box" ref={box} role="region" aria-label={t('Results')} tabIndex={0}>
        <table>
          <thead>
            <tr>
              <th>#</th>
              {inputs.map((k) => (
                <th key={k}>{head(k)}</th>
              ))}
              {measured.map((k) => (
                <th key={k}>{head(k)}</th>
              ))}
              {showHow && <th className="pl-data-how">{t('how')}</th>}
              <th>
                <span className="sr-only">{t('remove')}</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const period = r.period;
              return (
                <tr key={r.id}>
                  <td>{r.id}</td>
                  {inputs.map((k) => {
                    const d = display(k, unit);
                    return <td key={k}>{(COLUMNS[k].value(r)! * d.scale).toFixed(d.digits)}</td>;
                  })}
                  {refused(period) ? (
                    <td className="pl-data-why" colSpan={measured.length}>
                      {period.reason}
                    </td>
                  ) : (
                    measured.map((k) => reading(r, k))
                  )}
                  {showHow && <td className="pl-data-how">{howOf(r, hand)}</td>}
                  <td>
                    <button type="button" className="pl-data-x" aria-label={t('Remove row {n}').replace('{n}', String(r.id))} onClick={() => onRemove(r.id)}>
                      ×
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="pl-data-foot">
        <button type="button" className="asrs-btn" onClick={() => downloadCSV(rows)}>
          {t('↓ CSV')}
        </button>
        <button type="button" className="asrs-btn" onClick={onClear}>
          {t('↺ clear')}
        </button>
      </div>
    </div>
  );
}
