// The lab's result graph: any measured column against any knob from the table, a fit of the
// visitor's choosing with its residuals, the textbook's line, and the report's own points and
// curve where the axes are one of the report's. Everything is computed in SI and scaled for
// display only at the end (display()), so a fit's numbers never depend on the unit shown.
import { useEffect, useId, useState, type ReactNode } from 'react';
import { useLang } from '../i18n';
import type { Point } from './pendulumPhysics';
import { refused } from './pendulumInstruments';
import type { Setup } from './pendulumModel';
import {
  COLUMNS,
  DECAY_SECONDS,
  FIT_KINDS,
  INPUT_COLS,
  VARIABLES,
  display,
  fit,
  fitEquation,
  fmtReading,
  parseReport,
  reportSeries,
  series,
  theoryLine,
  varying,
  type AngleUnit,
  type FitKind,
  type Row,
  type VarKey,
  type XAxis,
  type YAxis,
} from './pendulumBench';

// the report's data files, fetched once each; a failure (offline, tests) is just no overlay
const REPORT_DATA = new Map<string, Promise<Point[]>>();
function reportData(file: string, peaks: boolean): Promise<Point[]> {
  let p = REPORT_DATA.get(file);
  if (!p) {
    p = Promise.resolve()
      .then(() => fetch(`/media/pendulum/data/${file}`))
      .then((r) => (r.ok ? r.text() : ''))
      .then((text) => parseReport(text, peaks))
      .catch(() => {
        REPORT_DATA.delete(file); // try again on the next visit to these axes
        return [];
      });
    REPORT_DATA.set(file, p);
  }
  return p;
}

const KNOB: Partial<Record<XAxis, VarKey>> = { L: 'stringLength', theta: 'theta0', r: 'bobRadius', m: 'bobMass', g: 'g', rho: 'fluidRho', friction: 'pivotFriction' };
const Y_EMPTY: Record<YAxis, [number, number]> = { T: [0, 2], tau: [0, 300], Q: [0, 1000], A: [0, 0.6] }; // SI, when nothing at all is drawn
const sym = (k: XAxis | YAxis) => (k === 't' ? 't' : k === 'A' ? 'A' : COLUMNS[k].label);

function ticks(lo: number, hi: number, n = 5): number[] {
  const raw = (hi - lo) / n;
  const p = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * p).find((s) => s >= raw) ?? raw;
  const out: number[] = [];
  for (let v = Math.ceil(lo / step) * step; v <= hi + 1e-9; v += step) out.push(+v.toFixed(6));
  return out;
}

/** [lo, hi] of the values, padded by `pad` of the span (or around a single value). */
function extent(vs: number[], pad: number): [number, number] {
  const lo = Math.min(...vs);
  const hi = Math.max(...vs);
  const d = hi > lo ? (hi - lo) * pad : Math.abs(lo) * 0.1 || 1;
  return [lo - d, hi + d];
}

const W = 640;
const M = { l: 56, r: 16, t: 14, b: 44 };
const PLOT_BOTTOM = 320 - M.b;
const GAP = 10;
const STRIP = 64; // the residual strip's height

export function PendulumGraph({
  rows,
  base,
  unit,
  x,
  y,
  fitKind,
  onAxes,
  onFit,
}: {
  rows: Row[];
  base: Setup;
  unit: AngleUnit;
  x: XAxis;
  y: YAxis;
  fitKind: FitKind | null;
  onAxes: (x: XAxis, y: YAxis) => void;
  onFit: (k: FitKind | null) => void;
}) {
  const { t, tx } = useLang();
  const clip = `pl-clip${useId().replace(/:/g, '')}`;
  const [hover, setHover] = useState<Point | null>(null);

  // the report's own data for these axes
  const rep = reportSeries(x, y);
  const file = rep?.file;
  const peaks = rep?.peaks ?? false;
  const [loaded, setLoaded] = useState<{ file: string; pts: Point[] } | null>(null);
  useEffect(() => {
    if (!file) return;
    let live = true;
    reportData(file, peaks).then((pts) => live && setLoaded({ file, pts }));
    return () => {
      live = false;
    };
  }, [file, peaks]);
  const repPts = file && loaded?.file === file ? loaded.pts : [];

  // SI → display
  const dx = display(x, unit);
  const dy = display(y, unit);
  const toD = (p: Point): Point => ({ x: p.x * dx.scale, y: p.y * dy.scale, dy: p.dy === undefined ? undefined : p.dy * dy.scale });
  const inD = (g: (v: number) => number) => (v: number) => g(v / dx.scale) * dy.scale;

  const pts = series(rows, x, y);
  const shown = pts.map(toD);
  const repShown = repPts.map(toD);
  const f = fitKind && pts.length ? fit(fitKind, pts.map((p) => p.x), pts.map((p) => p.y)) : null;
  const good = f && !('reason' in f) ? f : null;
  const theory = theoryLine(base, x, y);
  const lines: Array<[string, (v: number) => number]> = [];
  if (rep) lines.push(['pl-report-line', inD(rep.line)]);
  if (theory) lines.push(['pl-textbook', inD(theory)]);
  if (good) lines.push(['lab-twin', inD(good.at)]);

  // ranges: the points (the lab's and the report's), else the knob's whole range
  const xsAll = [...shown, ...repShown].map((p) => p.x);
  const knob = KNOB[x];
  const [x0, x1] = xsAll.length
    ? extent(xsAll, 0.06)
    : x === 't'
      ? [0, DECAY_SECONDS]
      : knob
        ? [VARIABLES[knob].min * dx.scale, VARIABLES[knob].max * dx.scale]
        : [0, 1];
  const along = Array.from({ length: 81 }, (_, i) => x0 + ((x1 - x0) * i) / 80);
  const ysAll = [...shown, ...repShown].flatMap((p) => [p.y - (p.dy ?? 0), p.y + (p.dy ?? 0)]);
  for (const [, g] of lines) for (const v of along) ysAll.push(g(v));
  const ysFinite = ysAll.filter(Number.isFinite);
  const [y0, y1] = ysFinite.length ? extent(ysFinite, 0.08) : [Y_EMPTY[y][0] * dy.scale, Y_EMPTY[y][1] * dy.scale];

  // the residual strip, when there is a fit to be off from
  const res = good ? pts.map((p, i) => ({ x: shown[i].x, y: (p.y - good.at(p.x)) * dy.scale, dy: shown[i].dy })) : [];
  const R = Math.max(...res.map((p) => Math.abs(p.y) + (p.dy ?? 0)), 0) * 1.15 || 1;
  const bottom = res.length ? PLOT_BOTTOM + GAP + STRIP : PLOT_BOTTOM;
  const H = bottom + M.b;

  const sx = (v: number) => M.l + ((v - x0) / (x1 - x0)) * (W - M.l - M.r);
  const sy = (v: number) => PLOT_BOTTOM - ((v - y0) / (y1 - y0)) * (PLOT_BOTTOM - M.t);
  const ry = (v: number) => PLOT_BOTTOM + GAP + STRIP / 2 - (v / R) * (STRIP / 2);
  const span = y1 - y0;
  const path = (g: (v: number) => number) => {
    let d = '';
    let pen = false;
    for (const v of along) {
      const w = g(v);
      if (!Number.isFinite(w)) {
        pen = false;
        continue;
      }
      d += `${pen ? 'L' : 'M'}${sx(v).toFixed(1)},${sy(Math.min(y1 + 10 * span, Math.max(y0 - 10 * span, w))).toFixed(1)}`;
      pen = true;
    }
    return d;
  };

  // the axis pickers: what the table holds
  const has = {
    tau: rows.some((r) => r.decay && !refused(r.decay)),
    Q: rows.some((r) => r.q && !refused(r.q)),
    A: rows.some((r) => r.envelope?.length),
  };
  const yOpts = (['T', 'tau', 'Q', 'A'] as YAxis[]).filter((k) => k === 'T' || k === y || has[k as 'tau' | 'Q' | 'A']);
  const vary = varying(rows);
  const xOpts: XAxis[] = y === 'A' ? ['t'] : [...vary, ...INPUT_COLS.filter((k) => !vary.includes(k))];
  const label = (k: XAxis | YAxis, u: string) => (u ? `${sym(k)} (${u})` : sym(k));
  const pickY = (ny: YAxis) => onAxes(ny === 'A' ? 't' : x === 't' ? (vary[0] ?? 'L') : x, ny);

  // the note: the fit's equation in SI, and on the report's own axes how it compares
  const lastDecay = [...rows].reverse().find((r) => r.envelope?.length);
  const T = lastDecay && !refused(lastDecay.period) ? lastDecay.period.value : undefined;
  let compare: ReactNode = null;
  if (good) {
    const p = good.params;
    if (x === 'theta' && y === 'T' && good.kind === 'quadratic')
      compare = tx('T₀ {a} s · C {c} — report 0.936 s · 0.080', { a: p.c0.toFixed(3), c: (p.c2 / p.c0).toFixed(3) });
    else if (x === 't' && y === 'A' && good.kind === 'exponential')
      compare = tx('τ {tau} s · Q {q} — report 178 s · 597', { tau: p.tau.toFixed(0), q: T ? ((Math.PI * p.tau) / T).toFixed(0) : '—' });
    else if (x === 'L' && y === 'T' && good.kind === 'power') compare = tx('n {n} — report 0.433', { n: p.n.toFixed(3) });
    else if (x === 'L' && y === 'Q' && good.kind === 'linear')
      compare = tx('Q ≈ {a}·L + {b} — report 1960·L + 202', { a: p.slope.toFixed(0), b: p.intercept.toFixed(0) });
  }
  const note: ReactNode = !pts.length
    ? t('each release adds a point')
    : !fitKind
      ? `n = ${pts.length}`
      : f && 'reason' in f
        ? f.reason
        : <>{fitEquation(good!)}{compare && <> · {compare}</>}</>;

  const tip = (p: Point) =>
    [`${p.x.toFixed(x === 't' ? 1 : dx.digits)} ${dx.unit}`, `${fmtReading(p.y, p.dy, dy.digits)} ${dy.unit}`].map((s) => s.trim()).join(', ');
  const hoverOn = (p: Point) => ({ onPointerEnter: () => setHover(p), onPointerLeave: () => setHover(null) });
  const xLab = label(x, dx.unit);
  const yLab = label(y, dy.unit);

  return (
    <div className="pl-graph">
      <div className="pl-graph-bar">
        <label className="pl-axis">
          <span>y</span>
          <select aria-label={t('y axis')} value={y} onChange={(e) => pickY(e.target.value as YAxis)}>
            {yOpts.map((k) => (
              <option key={k} value={k}>
                {k === 'A' ? t('A (last decay)') : label(k, display(k, unit).unit)}
              </option>
            ))}
          </select>
        </label>
        <label className="pl-axis">
          <span>x</span>
          <select aria-label={t('x axis')} value={x} onChange={(e) => onAxes(e.target.value as XAxis, y)}>
            {xOpts.map((k) => (
              <option key={k} value={k}>
                {label(k, display(k, unit).unit)}
              </option>
            ))}
          </select>
        </label>
        <span className="trk-seg" role="group" aria-label={t('Fit')}>
          {[null, ...FIT_KINDS].map((k) => (
            <button
              key={k ?? 'none'}
              type="button"
              className={`asrs-btn${k === fitKind ? ' asrs-btn-on' : ''}`}
              aria-pressed={k === fitKind}
              onClick={() => onFit(k)}
            >
              {t(k ?? 'none')}
            </button>
          ))}
        </span>
      </div>
      <div className="lab-chart">
        <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`${yLab} — ${xLab}`}>
          <defs>
            <clipPath id={clip}>
              <rect x={M.l} y={M.t} width={W - M.l - M.r} height={PLOT_BOTTOM - M.t} />
            </clipPath>
          </defs>
          {ticks(y0, y1).map((v) => (
            <g key={`y${v}`}>
              <line x1={M.l} x2={W - M.r} y1={sy(v)} y2={sy(v)} className="lab-grid" />
              <text x={M.l - 8} y={sy(v) + 4} textAnchor="end" className="lab-tick">
                {v}
              </text>
            </g>
          ))}
          {ticks(x0, x1).map((v) => (
            <text key={`x${v}`} x={sx(v)} y={bottom + 18} textAnchor="middle" className="lab-tick">
              {v}
            </text>
          ))}
          <line x1={M.l} x2={W - M.r} y1={PLOT_BOTTOM} y2={PLOT_BOTTOM} className="lab-axis" />
          <line x1={M.l} x2={M.l} y1={M.t} y2={PLOT_BOTTOM} className="lab-axis" />
          <text x={(M.l + W - M.r) / 2} y={H - 6} textAnchor="middle" className="lab-label">
            {xLab}
          </text>
          <text x={14} y={(M.t + PLOT_BOTTOM) / 2} textAnchor="middle" className="lab-label" transform={`rotate(-90 14 ${(M.t + PLOT_BOTTOM) / 2})`}>
            {yLab}
          </text>
          <g clipPath={`url(#${clip})`}>
            {lines.map(([cls, g]) => (
              <path key={cls} d={path(g)} className={cls} />
            ))}
          </g>
          {repShown.map((p, i) => (
            <g key={`r${i}`} {...hoverOn(p)}>
              {p.dy ? <line x1={sx(p.x)} x2={sx(p.x)} y1={sy(p.y - p.dy)} y2={sy(p.y + p.dy)} className="lab-err" /> : null}
              <circle cx={sx(p.x)} cy={sy(p.y)} r={3.2} className="pl-report-dot" />
            </g>
          ))}
          {shown.map((p, i) => (
            <g key={`p${i}`} {...hoverOn(p)}>
              {p.dy ? <line x1={sx(p.x)} x2={sx(p.x)} y1={sy(p.y - p.dy)} y2={sy(p.y + p.dy)} className="lab-err" /> : null}
              <circle cx={sx(p.x)} cy={sy(p.y)} r={3} className="lab-twin-dot" />
            </g>
          ))}
          {res.length > 0 && (
            <g>
              <line x1={M.l} x2={W - M.r} y1={ry(0)} y2={ry(0)} className="lab-axis" />
              <line x1={M.l} x2={M.l} y1={PLOT_BOTTOM + GAP} y2={bottom} className="lab-axis" />
              {ticks(-R, R, 3).map((v) => (
                <text key={`d${v}`} x={M.l - 8} y={ry(v) + 4} textAnchor="end" className="lab-tick">
                  {v}
                </text>
              ))}
              <text x={14} y={ry(0)} textAnchor="middle" className="lab-label" transform={`rotate(-90 14 ${ry(0)})`}>
                {`Δ${sym(y)}`}
              </text>
              {res.map((p, i) => (
                <g key={`e${i}`}>
                  {p.dy ? <line x1={sx(p.x)} x2={sx(p.x)} y1={ry(p.y - p.dy)} y2={ry(p.y + p.dy)} className="lab-err" /> : null}
                  <circle cx={sx(p.x)} cy={ry(p.y)} r={2.4} className="lab-twin-dot" />
                </g>
              ))}
            </g>
          )}
          {hover && (
            <text
              x={sx(hover.x)}
              y={sy(hover.y) - 10}
              textAnchor={sx(hover.x) > W * 0.75 ? 'end' : sx(hover.x) < W * 0.25 ? 'start' : 'middle'}
              className="lab-tip"
            >
              {tip(hover)}
            </text>
          )}
        </svg>
        <div className="lab-legend">
          <span>
            <i className="lab-key pl-key-dot" /> {t('this lab')}
          </span>
          {theory && (
            <span>
              <i className="lab-key lab-key-report" /> {t('textbook')}
            </span>
          )}
          {rep && (
            <span>
              <i className="lab-key pl-key-hollow" /> {t('report')}
            </span>
          )}
        </div>
      </div>
      <p className="asrs-note pl-graph-note">{note}</p>
    </div>
  );
}
