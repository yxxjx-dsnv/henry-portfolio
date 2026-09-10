import { useEffect, useMemo, useRef, useState } from 'react';
import type { Object3D } from 'three';
import {
  REPORT,
  calibrate,
  runAngle,
  runDecay,
  runLength,
  runQ,
  simulate,
  type Point,
  type Run,
} from './pendulumPhysics';

const MEDIA = '/media/pendulum';
const GLB = `${MEDIA}/pendulum.glb`;
const BOB_R = 0.021;

// The pendulum lab: the rig from the photos, swinging to the report's own damped
// model, and the four experiments re-run on it with the measured points laid over.
// Same lazy-import/cleanup pattern as the other viewers; `?3d` activates at once.

type Exp = 'angle' | 'decay' | 'length' | 'q';
const EXPS: Array<{ id: Exp; name: string; x: string; y: string }> = [
  { id: 'angle', name: 'Period vs angle', x: 'Release angle (rad)', y: 'Period (s)' },
  { id: 'decay', name: 'Amplitude vs time', x: 'Time (s)', y: 'Amplitude (rad)' },
  { id: 'length', name: 'Period vs length', x: 'Length (m)', y: 'Period (s)' },
  { id: 'q', name: 'Q vs length', x: 'Length (m)', y: 'Q-factor' },
];
const DATA: Record<Exp, string> = {
  angle: 'period-vs-angle.txt',
  decay: 'amplitude-decay.txt',
  length: 'period-vs-length.txt',
  q: 'q-factor-vs-length.txt',
};

/** The report's data files: whitespace columns x y dx dy, comments and headers skipped. */
async function loadData(file: string): Promise<Point[]> {
  const text = await fetch(`${MEDIA}/data/${file}`).then((r) => r.text());
  const out: Point[] = [];
  for (const line of text.split('\n')) {
    const t = line.trim().split(/\s+/).map(Number);
    if (t.length >= 2 && Number.isFinite(t[0]) && Number.isFinite(t[1]))
      out.push({ x: t[0], y: t[1], dy: Number.isFinite(t[3]) ? t[3] : undefined });
  }
  return out;
}

/** Positive peaks of the tracked decay, so the measured envelope reads like the twin's. */
function envelopeOf(track: Point[]): Point[] {
  const out: Point[] = [];
  for (let i = 1; i < track.length - 1; i++) {
    const y = track[i].y;
    if (y > 0 && y >= track[i - 1].y && y > track[i + 1].y) out.push(track[i]);
  }
  return out;
}

export function PendulumLab() {
  const [active, setActive] = useState(
    () => typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('3d'),
  );
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [exp, setExp] = useState<Exp>('angle');
  const [angle, setAngle] = useState(0.52); // the release shown in 3D
  const [length, setLength] = useState(REPORT.L);
  const [speed, setSpeed] = useState(1);
  const [hud, setHud] = useState('');
  const [measured, setMeasured] = useState<Partial<Record<Exp, Point[]>>>({});
  const mountRef = useRef<HTMLDivElement>(null);
  const runRef = useRef<{ run: Run; T: number } | null>(null);
  const clockRef = useRef({ t: 0, speed: 1 });

  // the four experiments, run once on the twin
  const results = useMemo(
    () => ({ angle: runAngle(), decay: runDecay(), length: runLength(), q: runQ() }),
    [],
  );

  useEffect(() => {
    let dead = false;
    loadData(DATA[exp]).then((pts) => {
      if (!dead) setMeasured((m) => ({ ...m, [exp]: exp === 'decay' ? envelopeOf(pts) : pts }));
    });
    return () => {
      dead = true;
    };
  }, [exp]);

  // what the 3D pendulum plays: the chosen release at the chosen length, restarted on change
  useEffect(() => {
    const L = exp === 'angle' || exp === 'decay' ? REPORT.L : length;
    const c = exp === 'angle' || exp === 'decay' ? { T0: REPORT.T0, tau: REPORT.tau } : calibrate(L);
    const th = exp === 'angle' ? angle : REPORT.theta0;
    const long = exp === 'decay' || exp === 'q';
    const run = long ? results.decay.run : simulate(c.T0, c.tau, th, 8, 1 / 300);
    runRef.current = { run: exp === 'q' ? simulate(c.T0, c.tau, th, 200, 1 / 200) : run, T: c.T0 };
    clockRef.current.t = 0;
    setSpeed(long ? 16 : 1);
  }, [exp, angle, length, results]);
  useEffect(() => {
    clockRef.current.speed = speed;
  }, [speed]);

  useEffect(() => {
    if (!active) return;
    let disposed = false;
    let raf = 0;
    const cleanupExtra: (() => void)[] = [];
    let renderer:
      | { dispose: () => void; forceContextLoss: () => void; domElement: HTMLCanvasElement }
      | undefined;
    let controls: { dispose: () => void } | undefined;

    (async () => {
      try {
        const THREE = await import('three');
        const [{ GLTFLoader }, { DRACOLoader }, { OrbitControls }, { RoomEnvironment }] =
          await Promise.all([
            import('three/examples/jsm/loaders/GLTFLoader.js'),
            import('three/examples/jsm/loaders/DRACOLoader.js'),
            import('three/examples/jsm/controls/OrbitControls.js'),
            import('three/examples/jsm/environments/RoomEnvironment.js'),
          ]);
        const mount = mountRef.current;
        if (!mount || disposed) return;

        const dark = () => document.body.classList.contains('dark-mode');
        const scene = new THREE.Scene();
        const setBg = () => {
          scene.background = new THREE.Color(dark() ? 0x141518 : 0xd6d9dd);
        };
        setBg();
        const camera = new THREE.PerspectiveCamera(
          38,
          (mount.clientWidth || 560) / (mount.clientHeight || 420),
          0.01,
          20,
        );
        camera.position.set(0.28, -0.05, 0.62);

        const webgl = new THREE.WebGLRenderer({ antialias: true });
        renderer = webgl;
        webgl.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
        webgl.setSize(mount.clientWidth || 560, mount.clientHeight || 420);
        webgl.shadowMap.enabled = true;
        webgl.toneMapping = THREE.ACESFilmicToneMapping;
        mount.appendChild(webgl.domElement);
        const onLost = (e: Event) => {
          e.preventDefault();
          setStatus('error');
        };
        webgl.domElement.addEventListener('webglcontextlost', onLost);
        cleanupExtra.push(() => webgl.domElement.removeEventListener('webglcontextlost', onLost));
        const pmrem = new THREE.PMREMGenerator(webgl);
        scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
        cleanupExtra.push(() => pmrem.dispose());

        if (typeof ResizeObserver === 'function') {
          const ro = new ResizeObserver(() => {
            const w = mount.clientWidth;
            const h = mount.clientHeight;
            if (w > 0 && h > 0) {
              webgl.setSize(w, h);
              camera.aspect = w / h;
              camera.updateProjectionMatrix();
            }
          });
          ro.observe(mount);
          cleanupExtra.push(() => ro.disconnect());
        }
        const mo = new MutationObserver(setBg);
        mo.observe(document.body, { attributes: true, attributeFilter: ['class'] });
        cleanupExtra.push(() => mo.disconnect());

        scene.add(new THREE.HemisphereLight(0xffffff, 0x777777, 0.6));
        const key = new THREE.DirectionalLight(0xffffff, 1.8);
        key.position.set(0.6, 1.2, 1.0);
        key.castShadow = true;
        key.shadow.mapSize.set(1024, 1024);
        key.shadow.camera.left = key.shadow.camera.bottom = -0.6;
        key.shadow.camera.right = key.shadow.camera.top = 0.6;
        scene.add(key);

        const draco = new DRACOLoader();
        draco.setDecoderPath('/draco/');
        cleanupExtra.push(() => draco.dispose());
        const loader = new GLTFLoader();
        loader.setDRACOLoader(draco);
        const gltf = await loader.loadAsync(GLB);
        if (disposed) return;
        const model = gltf.scene;
        model.traverse((o: Object3D) => {
          const m = o as { isMesh?: boolean; castShadow?: boolean; receiveShadow?: boolean };
          if (m.isMesh) m.castShadow = m.receiveShadow = true;
        });
        scene.add(model);
        cleanupExtra.push(() => {
          model.traverse((o) => {
            const mesh = o as { geometry?: { dispose: () => void }; material?: unknown };
            mesh.geometry?.dispose?.();
            const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
            for (const m of mats) (m as { dispose?: () => void } | undefined)?.dispose?.();
          });
        });
        const arm = model.getObjectByName('Arm');
        const thread = model.getObjectByName('Thread');
        const bob = model.getObjectByName('Bob');
        if (!arm || !thread || !bob) throw new Error('pendulum.glb rig nodes missing');

        const orbit = new OrbitControls(camera, webgl.domElement);
        controls = orbit;
        orbit.enableDamping = true;
        orbit.target.set(0, -0.11, 0);
        orbit.minDistance = 0.2;
        orbit.maxDistance = 2.5;

        let last = 0;
        let shown = '';
        const animate = (now: number) => {
          raf = requestAnimationFrame(animate);
          if (!last) last = now;
          const dt = Math.min((now - last) / 1000, 0.1);
          last = now;
          const cur = runRef.current;
          if (cur) {
            const clock = clockRef.current;
            clock.t += dt * clock.speed;
            const n = cur.run.theta.length;
            const i = Math.min(n - 1, Math.floor(clock.t / cur.run.dt));
            if (i >= n - 1) clock.t = 0; // loop the run
            const th = cur.run.theta[i];
            arm.rotation.z = th;
            const L = exp === 'angle' || exp === 'decay' ? REPORT.L : length;
            thread.scale.y = L - BOB_R;
            bob.position.y = -L;
            const text = `t = ${clock.t.toFixed(1)} s · θ = ${th.toFixed(2)} rad · T₀ = ${cur.T.toFixed(3)} s`;
            if (text !== shown) setHud((shown = text));
          }
          orbit.update();
          webgl.render(scene, camera);
        };
        raf = requestAnimationFrame(animate);
        setStatus('ready');
      } catch (e) {
        console.error('PendulumLab', e);
        if (!disposed) setStatus('error');
      }
    })();

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      for (const fn of cleanupExtra) fn();
      controls?.dispose();
      if (renderer) {
        renderer.domElement.parentNode?.removeChild(renderer.domElement);
        renderer.forceContextLoss();
        renderer.dispose();
      }
    };
    // the loop reads exp/length live through refs and closures set above; a change
    // of experiment restarts the run, not the renderer
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  const meta = EXPS.find((e) => e.id === exp)!;
  const chart = chartFor(exp, results, measured[exp]);

  return (
    <figure className="story-figure model-viewer" id="pendulum-lab">
      {!active ? (
        <button type="button" className="model-poster" onClick={() => setActive(true)}>
          <img
            src={`${MEDIA}/fig-lab-render.jpg`}
            alt="Rendered model of the pendulum rig: the acrylic rest and laptop on the shelf edge, the protractor at the pivot, the orange thread and the black 8-ball bob mid-swing in front of the paper backdrop."
            width={1600}
            height={1000}
            loading="lazy"
          />
          <span className="model-cta">Run the pendulum</span>
        </button>
      ) : (
        <div className="asrs-frame">
          <div
            className="model-mount asrs-mount"
            ref={mountRef}
            tabIndex={-1}
            role="application"
            aria-label="The pendulum rig in 3D, swinging to the report's damped model. Drag to orbit, scroll to zoom."
          >
            <span className="model-status" role="status" aria-live="polite">
              {status === 'loading' && 'building the rig…'}
              {status === 'error' && "3D isn't available in this browser."}
            </span>
            {status === 'ready' && (
              <pre className="asrs-hud" aria-hidden="true">
                {hud}
              </pre>
            )}
          </div>
          {status === 'ready' && (
            <>
              <div className="asrs-steps" role="group" aria-label="Experiments">
                {EXPS.map((e) => (
                  <button
                    key={e.id}
                    type="button"
                    className={`asrs-step${e.id === exp ? ' asrs-step-on' : ''}`}
                    onClick={() => setExp(e.id)}
                  >
                    {e.name}
                  </button>
                ))}
              </div>
              <div className="asrs-controls">
                {exp === 'angle' && (
                  <label className="lab-field">
                    release {angle.toFixed(2)} rad
                    <input
                      type="range"
                      min={-1.4}
                      max={1.4}
                      step={0.01}
                      value={angle}
                      aria-label="Release angle"
                      onChange={(ev) => setAngle(Number(ev.target.value))}
                    />
                  </label>
                )}
                {(exp === 'length' || exp === 'q') &&
                  REPORT.lengths.map((L) => (
                    <button
                      key={L}
                      type="button"
                      className={`asrs-btn${L === length ? ' asrs-btn-on' : ''}`}
                      onClick={() => setLength(L)}
                    >
                      {L.toFixed(2)} m
                    </button>
                  ))}
                {[1, 8, 32].map((s) => (
                  <button
                    key={s}
                    type="button"
                    className={`asrs-btn${s === speed ? ' asrs-btn-on' : ''}`}
                    onClick={() => setSpeed(s)}
                  >
                    {s}×
                  </button>
                ))}
                <span className="asrs-hint">drag to orbit · scroll to zoom</span>
              </div>
              <Chart title={meta.name} xLabel={meta.x} yLabel={meta.y} {...chart} />
              <p className="asrs-note">{chart.note}</p>
            </>
          )}
        </div>
      )}
      <figcaption>
        The rig, rebuilt from the photos, driven by the report's own damped-pendulum model with an
        exact restoring force. Each experiment is re-run on it — the twin is calibrated to that
        experiment's measured constants, then the measured points are laid over what it produces.
      </figcaption>
    </figure>
  );
}

// ── the chart: measured points, the report's fit, and the twin ─────────────

type Series = {
  twin: Point[];
  twinLine: (x: number) => number;
  reportLine: (x: number) => number;
  measured?: Point[];
  note: string;
  xRange: [number, number];
  yRange: [number, number];
};

function chartFor(
  exp: Exp,
  r: ReturnType<typeof runAngle> extends infer A
    ? { angle: A; decay: ReturnType<typeof runDecay>; length: ReturnType<typeof runLength>; q: ReturnType<typeof runQ> }
    : never,
  measured?: Point[],
): Series {
  const f3 = (v: number) => v.toFixed(3);
  if (exp === 'angle') {
    const [a, b, c] = r.angle.fit;
    return {
      twin: r.angle.points,
      twinLine: (x) => a + b * x + c * x * x,
      reportLine: (x) => REPORT.T0 * (1 + REPORT.B * x + REPORT.C * x * x),
      measured,
      xRange: [-1.5, 1.5],
      yRange: [0.9, 1.12],
      note: `twin fit T = T₀(1 + Bθ + Cθ²): T₀ = ${f3(a)} s, B = ${f3(b / a)}, C = ${f3(c / a)} · report: 0.936 s, −0.001, 0.080. The ideal pendulum's curvature is the textbook θ²/16 (0.0625); the real one bent a little more — the report's apparatus notes say why.`,
    };
  }
  if (exp === 'decay') {
    const env = r.decay.envelope;
    const A0 = env[0]?.y ?? REPORT.theta0;
    return {
      twin: env.filter((_, i) => i % 3 === 0),
      twinLine: (x) => A0 * Math.exp(-x / r.decay.tau),
      reportLine: (x) => (measured?.[0]?.y ?? A0) * Math.exp(-x / REPORT.tau),
      measured: measured?.filter((_, i) => i % 2 === 0),
      xRange: [0, 200],
      yRange: [0.15, 0.5],
      note: `twin: τ = ${r.decay.tau.toFixed(0)} s, Q = πτ/T = ${r.decay.Q.toFixed(0)} · report: τ = 178 ± 1 s, Q = 597 ± 5 (hand count 592 ± 8).`,
    };
  }
  if (exp === 'length') {
    const { k, n } = r.length.fit;
    return {
      twin: r.length.points,
      twinLine: (x) => k * x ** n,
      reportLine: (x) => REPORT.k * x ** REPORT.n,
      measured,
      xRange: [0.03, 0.32],
      yRange: [0.45, 1.25],
      note: `twin fit T = kLⁿ: k = ${k.toFixed(2)}, n = ${n.toFixed(3)} · report: k = 1.94 ± 0.02, n = 0.433 ± 0.004 (theory: 2.0, 0.5). Released at 0.52 rad, like the report.`,
    };
  }
  const { a, b } = r.q.fit;
  return {
    twin: r.q.points,
    twinLine: (x) => a * x + b,
    reportLine: (x) => REPORT.qa * x + REPORT.qb,
    measured,
    xRange: [0.03, 0.32],
    yRange: [250, 850],
    note: `twin fit Q = aL + b: a = ${a.toFixed(0)}, b = ${b.toFixed(0)} · report: a = 1960 ± 30, b = 202 ± 5; the report's Q at 0.221 m, 594 ± 16, is the point they all agree on.`,
  };
}

function ticks(lo: number, hi: number, n = 5): number[] {
  const raw = (hi - lo) / n;
  const p = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * p).find((s) => s >= raw) ?? raw;
  const out: number[] = [];
  for (let v = Math.ceil(lo / step) * step; v <= hi + 1e-9; v += step) out.push(+v.toFixed(6));
  return out;
}

function Chart({
  title,
  xLabel,
  yLabel,
  twin,
  twinLine,
  reportLine,
  measured,
  xRange,
  yRange,
}: Series & { title: string; xLabel: string; yLabel: string }) {
  const W = 640;
  const H = 320;
  const m = { l: 56, r: 16, t: 14, b: 44 };
  const sx = (x: number) => m.l + ((x - xRange[0]) / (xRange[1] - xRange[0])) * (W - m.l - m.r);
  const sy = (y: number) => H - m.b - ((y - yRange[0]) / (yRange[1] - yRange[0])) * (H - m.t - m.b);
  const line = (f: (x: number) => number) =>
    Array.from({ length: 81 }, (_, i) => {
      const x = xRange[0] + ((xRange[1] - xRange[0]) * i) / 80;
      return `${i ? 'L' : 'M'}${sx(x).toFixed(1)},${sy(Math.min(yRange[1] * 1.5, Math.max(yRange[0] - 1e9, f(x)))).toFixed(1)}`;
    }).join(' ');
  const [hover, setHover] = useState<Point | null>(null);
  return (
    <div className="lab-chart">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`${title}: measured points, the report's fit, and the twin`}>
        {ticks(yRange[0], yRange[1]).map((v) => (
          <g key={`y${v}`}>
            <line x1={m.l} x2={W - m.r} y1={sy(v)} y2={sy(v)} className="lab-grid" />
            <text x={m.l - 8} y={sy(v) + 4} textAnchor="end" className="lab-tick">
              {v}
            </text>
          </g>
        ))}
        {ticks(xRange[0], xRange[1]).map((v) => (
          <text key={`x${v}`} x={sx(v)} y={H - m.b + 18} textAnchor="middle" className="lab-tick">
            {v}
          </text>
        ))}
        <line x1={m.l} x2={W - m.r} y1={H - m.b} y2={H - m.b} className="lab-axis" />
        <line x1={m.l} x2={m.l} y1={m.t} y2={H - m.b} className="lab-axis" />
        <text x={(m.l + W - m.r) / 2} y={H - 6} textAnchor="middle" className="lab-label">
          {xLabel}
        </text>
        <text x={14} y={(m.t + H - m.b) / 2} textAnchor="middle" className="lab-label" transform={`rotate(-90 14 ${(m.t + H - m.b) / 2})`}>
          {yLabel}
        </text>
        <path d={line(reportLine)} className="lab-report" />
        <path d={line(twinLine)} className="lab-twin" />
        {measured?.map((p, i) => (
          <g key={`m${i}`} onPointerEnter={() => setHover(p)} onPointerLeave={() => setHover(null)}>
            {p.dy ? <line x1={sx(p.x)} x2={sx(p.x)} y1={sy(p.y - p.dy)} y2={sy(p.y + p.dy)} className="lab-err" /> : null}
            <circle cx={sx(p.x)} cy={sy(p.y)} r={3.2} className="lab-measured" />
          </g>
        ))}
        {twin.map((p, i) => (
          <circle key={`t${i}`} cx={sx(p.x)} cy={sy(p.y)} r={2.6} className="lab-twin-dot" onPointerEnter={() => setHover(p)} onPointerLeave={() => setHover(null)} />
        ))}
        {hover && (
          <text x={sx(hover.x)} y={sy(hover.y) - 10} textAnchor="middle" className="lab-tip">
            {`${+hover.x.toFixed(3)}, ${+hover.y.toFixed(3)}`}
          </text>
        )}
      </svg>
      <div className="lab-legend">
        <span><i className="lab-key lab-key-measured" /> measured</span>
        <span><i className="lab-key lab-key-report" /> report fit</span>
        <span><i className="lab-key lab-key-twin" /> twin</span>
      </div>
    </div>
  );
}
