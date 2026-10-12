// The report's four experiments as one click each, and the automatic sweep: one knob stepped
// from one value to another, each step measured `repeats` times. Inputs read in the bench's
// display units (cm, g, the lab's angle unit); the sweep itself is built in SI.
import { useState } from 'react';
import { useLang } from '../i18n';
import type { Setup } from './pendulumModel';
import { GRAVITY, FLUIDS } from './pendulumModel';
import { PRESETS, VARIABLES, display, sweep, type AngleUnit, type ColKey, type Preset, type PresetId, type VarKey } from './pendulumBench';

const DEG = Math.PI / 180;
const COL: Record<VarKey, ColKey> = { stringLength: 'L', theta0: 'theta', bobRadius: 'r', bobMass: 'm', g: 'g', fluidRho: 'rho', pivotFriction: 'friction' };
/** A sweep's default ends, SI: the report's ranges where it had one, else bench to a telling other end. */
const ENDS: Record<VarKey, [number, number]> = {
  stringLength: [0.05, 0.3],
  theta0: [10 * DEG, 80 * DEG],
  bobRadius: [0.005, 0.04],
  bobMass: [0.01, 1],
  g: [GRAVITY.moon, GRAVITY.jupiter],
  fluidRho: [FLUIDS.air.rho, FLUIDS.water.rho],
  pivotFriction: [0, 0.0002],
};
const KEYS = Object.keys(VARIABLES) as VarKey[];

/** A number field shown at `scale` × the SI value it holds, rounded to `digits`, kept in [min, max]
 *  (SI). Uncontrolled, so a half-typed number is never snapped back; it shows the clamped value on blur. */
function Num(p: { label: string; si: number; set: (v: number) => void; min: number; max: number; scale?: number; digits?: number; disabled: boolean }) {
  const { scale = 1, digits = 0 } = p;
  const show = (v: number) => String(+(v * scale).toFixed(digits));
  return (
    <label className="lab-field">
      {p.label}
      <input
        type="number"
        className="pl-num"
        defaultValue={show(p.si)}
        min={show(p.min)}
        max={show(p.max)}
        step={10 ** -digits}
        disabled={p.disabled}
        onChange={(e) => {
          const v = e.target.valueAsNumber;
          if (Number.isFinite(v)) p.set(Math.min(p.max, Math.max(p.min, +v.toFixed(digits) / scale)));
        }}
        onBlur={(e) => (e.target.value = show(p.si))}
      />
    </label>
  );
}

export function PendulumSweep(props: {
  base: Setup;
  unit: AngleUnit;
  progress: { done: number; total: number } | null;
  activePreset: PresetId | null;
  onPreset: (p: Preset) => void;
  onRun: (setups: Setup[]) => void;
  onStop: () => void;
  showForm: boolean;
}): JSX.Element {
  const { base, unit, progress, activePreset, onPreset, onRun, onStop, showForm } = props;
  const { t, tx } = useLang();
  const [key, setKey] = useState<VarKey>('stringLength');
  const [[from, to], setEnds] = useState(ENDS.stringLength);
  const [steps, setSteps] = useState(6);
  const [repeats, setRepeats] = useState(1);
  const busy = progress !== null;
  const v = VARIABLES[key];
  const d = display(COL[key], unit);
  const field = { min: v.min, max: v.max, scale: d.scale, digits: d.digits, disabled: busy };

  return (
    <div className="pl-sweep">
      <div className="asrs-steps" role="group" aria-label={t('Experiments')}>
        {PRESETS.map((p) => (
          <button
            key={p.id}
            type="button"
            className={`asrs-step${p.id === activePreset ? ' asrs-step-on' : ''}`}
            aria-pressed={p.id === activePreset}
            disabled={busy}
            onClick={() => onPreset(p)}
          >
            {t(p.lab)} · {t(p.name)}
          </button>
        ))}
      </div>
      {(showForm || busy) && (
        <div className="asrs-controls" role="group" aria-label={t('Sweep')}>
          {showForm && (
            <>
              <select
                className="pl-select"
                aria-label={t('Variable')}
                value={key}
                disabled={busy}
                onChange={(e) => {
                  const k = e.target.value as VarKey;
                  setKey(k);
                  setEnds(ENDS[k]);
                }}
              >
                {KEYS.map((k) => (
                  <option key={k} value={k}>
                    {t(VARIABLES[k].label)}
                  </option>
                ))}
              </select>
              {/* remounted on a new variable or angle unit, so the fields show the new values */}
              <span key={`${key}-${unit}`} className="trk-seg">
                <Num label={t('from')} si={from} set={(x) => setEnds([x, to])} {...field} />
                <Num label={t('to')} si={to} set={(x) => setEnds([from, x])} {...field} />
                <span className="trk-muted">{d.unit}</span>
              </span>
              <Num label={t('steps')} si={steps} set={setSteps} min={2} max={25} disabled={busy} />
              <Num label={t('repeats')} si={repeats} set={setRepeats} min={1} max={10} disabled={busy} />
            </>
          )}
          {busy ? (
            <>
              <button type="button" className="asrs-btn" onClick={onStop}>
                {t('■ stop')}
              </button>
              <span className="trk-progress">
                {progress.done} / {progress.total}
              </span>
            </>
          ) : (
            <button type="button" className="asrs-btn" onClick={() => onRun(sweep(base, key, from, to, steps, repeats))}>
              {tx('▶ sweep {n}', { n: steps * repeats })}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
