// The bench's knobs: the string, the bob, the world it swings in, and the instrument that
// reads it. Every chip that shows "on" is derived from the numbers in the setup, so the panel
// can never claim a material or a planet the numbers disagree with.
import { useId, useState, type ReactNode } from 'react';
import { useLang } from '../i18n';
import { BENCH, FLUIDS, GRAVITY, MATERIALS, solidBobMass, type Setup } from './pendulumModel';
import { DEFAULT_MEASURE, FPS_CHOICES, SWING_CHOICES, display, type AngleUnit, type Measure } from './pendulumBench';

const DEG = Math.PI / 180;
type Material = keyof typeof MATERIALS;
const SOLIDS: Material[] = ['steel', 'brass', 'lead', 'aluminium', 'wood', 'plastic', 'styrofoam'];
const PIVOTS = [
  ['bench', 0],
  ['stiff', 1e-4],
  ['rusty', 1e-3],
] as const;
const cap = (s: string) => s[0].toUpperCase() + s.slice(1);
const near = (a: number, b: number) => Math.abs(a - b) <= 0.005 * Math.abs(b);

/** Which bob chip is on: the report's own bob, a solid sphere of one material, or none. */
function bobOf(s: Setup): 'lab' | Material | null {
  if (near(s.bobMass, BENCH.bobMass) && near(s.bobRadius, BENCH.bobRadius)) return 'lab';
  return SOLIDS.find((k) => near(s.bobMass, solidBobMass(MATERIALS[k], s.bobRadius))) ?? null;
}

function fmt(k: 'L' | 'r' | 'theta', v: number, unit: AngleUnit) {
  const d = display(k, unit);
  const n = (v * d.scale).toFixed(d.digits);
  return d.unit === '°' ? `${n}°` : `${n} ${d.unit}`;
}

/** A number box that lets a half-typed value sit in the field and commits only values in range. */
function NumField(props: { id: string; value: number; min: number; max: number; step: number; onCommit: (v: number) => void }) {
  const [draft, setDraft] = useState<string | null>(null);
  const { value, onCommit, ...rest } = props;
  return (
    <input
      {...rest}
      type="number"
      inputMode="decimal"
      className="pl-num"
      value={draft ?? String(+value.toPrecision(4))}
      onChange={(e) => {
        setDraft(e.target.value);
        const v = e.target.valueAsNumber;
        if (v >= props.min && v <= props.max) onCommit(v);
      }}
      onBlur={() => setDraft(null)}
    />
  );
}

function Chip({ on, onClick, children }: { on: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button type="button" className={`asrs-btn${on ? ' asrs-btn-on' : ''}`} aria-pressed={on} onClick={onClick}>
      {children}
    </button>
  );
}

export function PendulumSetup(props: {
  setup: Setup;
  onSetup: (s: Setup) => void;
  measure: Measure;
  onMeasure: (m: Measure) => void;
  unit: AngleUnit;
  locked?: boolean;
}) {
  const { setup: s, onSetup, measure: m, onMeasure, unit, locked } = props;
  const { t } = useLang();
  const id = useId();
  const set = (patch: Partial<Setup>) => onSetup({ ...s, ...patch });
  const bob = bobOf(s);

  return (
    <fieldset className="pl-setup" disabled={locked} aria-label={t('Setup')}>
      <fieldset className="pl-group">
        <legend>{t('String & release')}</legend>
        <div className="pl-row">
          <label className="pl-key" htmlFor={`${id}L`}>{t('length')}</label>
          <input
            id={`${id}L`}
            type="range"
            min={3}
            max={60}
            step={0.5}
            value={s.stringLength * 100}
            aria-valuetext={fmt('L', s.stringLength, unit)}
            onChange={(e) => set({ stringLength: e.target.valueAsNumber / 100 })}
          />
          <output className="pl-val" htmlFor={`${id}L`}>{fmt('L', s.stringLength, unit)}</output>
        </div>
        <div className="pl-row">
          <label className="pl-key" htmlFor={`${id}a`}>{t('release')}</label>
          <input
            id={`${id}a`}
            type="range"
            min={1}
            max={85}
            step={1}
            value={s.theta0 / DEG}
            aria-valuetext={fmt('theta', s.theta0, unit)}
            onChange={(e) => set({ theta0: e.target.valueAsNumber * DEG })}
          />
          <output className="pl-val" htmlFor={`${id}a`}>{fmt('theta', s.theta0, unit)}</output>
        </div>
      </fieldset>

      <fieldset className="pl-group">
        <legend>{t('Bob')}</legend>
        <div className="pl-row" role="group" aria-label={t('Material')}>
          <Chip on={bob === 'lab'} onClick={() => set({ bobMass: BENCH.bobMass, bobRadius: BENCH.bobRadius })}>
            lab bob
          </Chip>
          {SOLIDS.map((k) => (
            <Chip key={k} on={bob === k} onClick={() => set({ bobMass: solidBobMass(MATERIALS[k], s.bobRadius) })}>
              {k}
            </Chip>
          ))}
        </div>
        <div className="pl-row">
          <label className="pl-key" htmlFor={`${id}r`}>{t('radius')}</label>
          <input
            id={`${id}r`}
            type="range"
            min={0.5}
            max={4}
            step={0.1}
            value={s.bobRadius * 100}
            aria-valuetext={fmt('r', s.bobRadius, unit)}
            onChange={(e) => {
              const r = e.target.valueAsNumber / 100;
              set(bob && bob !== 'lab' ? { bobRadius: r, bobMass: solidBobMass(MATERIALS[bob], r) } : { bobRadius: r });
            }}
          />
          <output className="pl-val" htmlFor={`${id}r`}>{fmt('r', s.bobRadius, unit)}</output>
        </div>
        <div className="pl-row">
          <label className="pl-key" htmlFor={`${id}m`}>{t('mass')}</label>
          <NumField id={`${id}m`} value={s.bobMass * 1000} min={1} max={2000} step={0.1} onCommit={(v) => set({ bobMass: v / 1000 })} />
          <span className="pl-unit">g</span>
        </div>
      </fieldset>

      <fieldset className="pl-group">
        <legend>{t('Environment')}</legend>
        <div className="pl-row">
          <label className="pl-key" htmlFor={`${id}g`}>g</label>
          <NumField id={`${id}g`} value={s.g} min={0.5} max={30} step={0.01} onCommit={(g) => set({ g })} />
          <span className="pl-unit">m/s²</span>
          <span className="trk-seg pl-chips" role="group" aria-label={t('Gravity')}>
            {(Object.keys(GRAVITY) as (keyof typeof GRAVITY)[]).map((k) => (
              <Chip key={k} on={s.g === GRAVITY[k]} onClick={() => set({ g: GRAVITY[k] })}>
                {cap(k)}
              </Chip>
            ))}
          </span>
        </div>
        <div className="pl-row">
          <span className="pl-key">{t('fluid')}</span>
          <span className="trk-seg pl-chips" role="group" aria-label={t('Fluid')}>
            {(Object.keys(FLUIDS) as (keyof typeof FLUIDS)[]).map((k) => (
              <Chip key={k} on={s.fluid.rho === FLUIDS[k].rho && s.fluid.mu === FLUIDS[k].mu} onClick={() => set({ fluid: FLUIDS[k] })}>
                {cap(k)}
              </Chip>
            ))}
          </span>
        </div>
        <div className="pl-row">
          <span className="pl-key">{t('pivot')}</span>
          <span className="trk-seg pl-chips" role="group" aria-label={t('Pivot')}>
            {PIVOTS.map(([name, f]) => (
              <Chip key={name} on={s.pivotFriction === f} onClick={() => set({ pivotFriction: f })}>
                {name}
              </Chip>
            ))}
          </span>
        </div>
      </fieldset>

      <fieldset className="pl-group">
        <legend>{t('Instrument')}</legend>
        <div className="pl-row">
          <Chip on={m.kind === 'tracker'} onClick={() => m.kind !== 'tracker' && onMeasure(DEFAULT_MEASURE)}>
            Tracker
          </Chip>
          <Chip on={m.kind === 'stopwatch'} onClick={() => m.kind !== 'stopwatch' && onMeasure({ kind: 'stopwatch', swings: 10 })}>
            stopwatch
          </Chip>
        </div>
        {m.kind === 'tracker' ? (
          <>
            <div className="pl-row" role="group" aria-label={t('Frame rate')}>
              {FPS_CHOICES.map((fps) => (
                <Chip key={fps} on={m.fps === fps} onClick={() => onMeasure({ ...m, fps })}>
                  {fps} fps
                </Chip>
              ))}
            </div>
            <div className="pl-row" role="group" aria-label={t('Reading')}>
              <Chip on={!m.decay} onClick={() => onMeasure({ ...m, decay: false })}>
                period
              </Chip>
              <Chip on={m.decay} onClick={() => onMeasure({ ...m, decay: true })}>
                decay
              </Chip>
            </div>
          </>
        ) : (
          <div className="pl-row" role="group" aria-label={t('Swings')}>
            {SWING_CHOICES.map((n) => (
              <Chip key={n} on={m.swings === n} onClick={() => onMeasure({ kind: 'stopwatch', swings: n })}>
                ×{n}
              </Chip>
            ))}
          </div>
        )}
      </fieldset>

      <button
        type="button"
        className="asrs-btn pl-reset"
        onClick={() => {
          onSetup(BENCH);
          onMeasure(DEFAULT_MEASURE);
        }}
      >
        {t('↺ bench')}
      </button>
    </fieldset>
  );
}
