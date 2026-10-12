import { useEffect, useRef, useState } from 'react';
import type { BufferAttribute, Object3D, Points } from 'three';
import { useLang } from '../i18n';
import { gauss } from './pendulumPhysics';
import { BENCH, MATERIALS, dynamics, solidBobMass, swing, thetaAt, type Motion, type Setup } from './pendulumModel';
import { protractor, refused, track, type Track, type TrackerSettings } from './pendulumInstruments';
import {
  DECAY_SECONDS,
  DEFAULT_MEASURE,
  fmtReading,
  measureLabel,
  readTrack,
  secondsFor,
  trackerOf,
  type AngleUnit,
  type ColKey,
  type FitKind,
  type Measure,
  type Preset,
  type PresetId,
  type Row,
  type XAxis,
  type YAxis,
} from './pendulumBench';
import { isRelease, readNow, runSliced, trialRun } from './pendulumRun';
import { PendulumSetup } from './PendulumSetup';
import { PendulumSweep } from './PendulumSweep';
import { PendulumData } from './PendulumData';
import { PendulumGraph } from './PendulumGraph';
import { DRACO } from './dracoPath';
import { onScreen } from './onScreen';

const MEDIA = '/media/pendulum';
const GLB = `${MEDIA}/pendulum.glb`;
const BOB_R = 0.021;
const SWING_Z = 0.004; // the swing plane sits 4 mm in front of the protractor (glTF +Z)
const MAX = 240 * DECAY_SECONDS + 2; // the longest recording's frames, at the fastest frame rate
const ROWS = 8; // the table rows that fit beside the video
const SPEEDS = [1, 4, 16];
const PULL = 'pull further'; // the note after a tap, worded at render
const PANEL = { rig: 'Rig', data: 'Data', graph: 'Graph', bench: 'Bench' } as const;

// The pendulum lab: the rig from the photos as a physics twin calibrated to the report
// (pendulumModel), inside a window laid out like the Tracker session that read the real video
// — the red marks on the bob, the x(t) and y(t) plots and the frame table fill at the
// instrument's frame rate as it moves. The viewer pulls the ball and lets go; when the
// recording is long enough (or on "measure now") it is read and becomes a row of the table
// and a point on the graph. The bench's knobs, a sweep of any one of them and the report's
// four experiments run the same machinery (pendulumBench, pendulumRun).

type Live = { motion: Motion; seconds: number; setup: Setup; measure: Measure; tk: TrackerSettings };
type PlotStyle = { fg: string; bg: string; grid: string; accent: string; font: string };

const DEG = 180 / Math.PI;
const fmtX = (v: number) => (Object.is(v, -0) ? '0.000' : v.toFixed(3));
const fmtAngle = (th: number, unit: AngleUnit, signed = false) => {
  const sign = signed && th > 0 ? '+' : '';
  return unit === 'rad' ? `${sign}${th.toFixed(3)} rad` : `${sign}${(th * DEG).toFixed(1)}°`;
};
const hangLength = (s: Setup) => dynamics(s).L; // pivot to the bob's centre

/** How the bob looks on the rig: the lab's own 8-ball keychain, a solid sphere of one of the bench's
 *  materials (its mass is that material's at its radius), or a plain one (a mass typed in). */
type Look = 'lab' | keyof typeof MATERIALS | 'other';
const LOOKS: Record<Exclude<Look, 'lab'>, { color: number; metalness: number; roughness: number }> = {
  steel: { color: 0x9aa0a6, metalness: 1, roughness: 0.32 },
  brass: { color: 0xc2a24c, metalness: 1, roughness: 0.3 },
  lead: { color: 0x6c6e72, metalness: 0.7, roughness: 0.55 },
  aluminium: { color: 0xcfd3d8, metalness: 1, roughness: 0.25 },
  wood: { color: 0x9c6b3c, metalness: 0, roughness: 0.75 },
  plastic: { color: 0xd8473f, metalness: 0, roughness: 0.35 },
  styrofoam: { color: 0xf3f1ea, metalness: 0, roughness: 0.95 },
  other: { color: 0x8c8c8c, metalness: 0.4, roughness: 0.5 },
};
function lookOf(s: Setup): Look {
  const near = (a: number, b: number) => Math.abs(a / b - 1) < 0.005;
  if (near(s.bobMass, BENCH.bobMass) && near(s.bobRadius, BENCH.bobRadius)) return 'lab';
  for (const [k, rho] of Object.entries(MATERIALS)) if (near(s.bobMass, solidBobMass(rho, s.bobRadius))) return k as Look;
  return 'other';
}

/** A row's result as the status line shows it: numbers only, or why there are none. */
function readingOf(r: Row): string {
  const res = r.q ?? r.period;
  if (refused(res)) return res.reason;
  return r.q ? `Q ${fmtReading(res.value, res.uncertainty)}` : `T ${fmtReading(res.value, res.uncertainty)} s`;
}

export function PendulumLab() {
  const { t, tx } = useLang();
  const [active, setActive] = useState(() => typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('3d'));
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [setup, setSetup] = useState<Setup>(BENCH);
  const [measure, setMeasure] = useState<Measure>(DEFAULT_MEASURE);
  const [rows, setRows] = useState<Row[]>([]);
  const [graph, setGraph] = useState<{ x: XAxis; y: YAxis; fit: FitKind | null }>({ x: 'theta', y: 'T', fit: null });
  const [unit, setUnit] = useState<AngleUnit>('rad');
  const [speed, setSpeed] = useState(1);
  const [bench, setBench] = useState(false); // the knobs and the sweep form
  const [tab, setTab] = useState<'rig' | 'data' | 'graph' | 'bench'>('rig'); // phones: one panel at a time
  const shown = tab === 'data' && !rows.length ? 'rig' : tab; // no results yet: the data panel would be empty
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null); // a sweep or preset running
  const [preset, setPreset] = useState<PresetId | null>(null);
  const [swinging, setSwinging] = useState(false); // a hand release under the tracker
  const [note, setNote] = useState<string | null>(null); // the last reading, a refusal, or PULL
  const [released, setReleased] = useState(false); // the viewer has let go once: the knot hint can go
  const [pull, setPull] = useState<number | null>(null); // the angle while the ball is held
  const [frame, setFrame] = useState(() => ({ t: 0, x: 0, y: -hangLength(BENCH), th: 0, n: 0 }));
  const [table, setTable] = useState<string[][]>([]);
  const mountRef = useRef<HTMLDivElement>(null);
  const plotX = useRef<HTMLCanvasElement>(null);
  const plotY = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const liveRef = useRef<Live | null>(null);
  const clockRef = useRef({ t: 0, speed: 1 });
  // lazily: useRef's argument would allocate the three 192 KB arrays on every render
  const [bufRef] = useState(() => ({ current: { t: new Float32Array(MAX), x: new Float32Array(MAX), y: new Float32Array(MAX), n: 0 } as Track }));
  const trailRef = useRef<{ points: Points; attr: BufferAttribute } | null>(null);
  const dragRef = useRef({ on: false, theta: 0, offset: 0 });
  const heldRef = useRef<{ th: number; L: number; s: Setup } | null>(null); // a sweep's trial, posed at its release
  const setupRef = useRef(setup); // the bench as set, for the rig
  const hangRef = useRef(hangLength(BENCH));
  const unitRef = useRef<AngleUnit>('rad');
  const styleRef = useRef<PlotStyle | null>(null);
  const nextId = useRef(1);
  const stopRef = useRef<(() => void) | null>(null);
  const runningRef = useRef(false);

  // the loop and the pointer read these live
  clockRef.current.speed = speed;
  unitRef.current = unit;
  hangRef.current = hangLength(setup);
  setupRef.current = setup;

  // ── the Tracker window: the buffer of frames, the red marks, the plots and the table ──

  const writeFrame = (i: number, ts: number, x: number, y: number) => {
    const buf = bufRef.current;
    buf.t[i] = ts;
    buf.x[i] = x;
    buf.y[i] = y;
    const trail = trailRef.current;
    if (trail) {
      const pos = trail.attr.array as Float32Array;
      pos[i * 3] = x;
      pos[i * 3 + 1] = y;
      pos[i * 3 + 2] = SWING_Z + 0.03;
    }
  };
  const paint = (seconds: number) => {
    const buf = bufRef.current;
    const trail = trailRef.current;
    if (trail) {
      trail.attr.needsUpdate = true;
      trail.points.geometry.setDrawRange(0, buf.n);
    }
    const st = styleRef.current;
    if (st) {
      drawPlot(plotX.current, buf, 'x', seconds, st);
      drawPlot(plotY.current, buf, 'y', seconds, st);
    }
  };
  const showFrames = () => {
    const buf = bufRef.current;
    if (!buf.n) return;
    const i = buf.n - 1;
    const u = unitRef.current;
    setFrame({ t: buf.t[i], x: buf.x[i], y: buf.y[i], th: Math.atan2(buf.x[i], -buf.y[i]), n: i });
    const out: string[][] = [];
    for (let k = Math.max(0, buf.n - ROWS); k < buf.n; k++) {
      const th = Math.atan2(buf.x[k], -buf.y[k]);
      out.push([buf.t[k].toFixed(3), fmtX(buf.x[k]), buf.y[k].toFixed(3), u === 'rad' ? th.toFixed(3) : (th * DEG).toFixed(1)]);
    }
    setTable(out);
  };
  const clearTrack = () => {
    clockRef.current.t = 0;
    bufRef.current.n = 0;
    trailRef.current?.points.geometry.setDrawRange(0, 0);
    setTable([]);
    setFrame({ t: 0, x: 0, y: -hangRef.current, th: 0, n: 0 }); // the readouts follow the ball back to hanging
  };

  // ── what the hand and the buttons do ──

  const addRow = (r: Omit<Row, 'id'>) => {
    const row = { ...r, id: nextId.current++ };
    setRows((rs) => [...rs, row]);
    setNote(readingOf(row));
  };
  const hang = () => {
    liveRef.current = null;
    setSwinging(false);
    clearTrack();
  };
  /** The swing's recording read as a row of the table. */
  const handRow = (live: Live, read: ReturnType<typeof readTrack>): Omit<Row, 'id'> => ({
    setup: live.setup,
    angleRead: protractor(live.setup.theta0).value,
    how: measureLabel(live.measure),
    byHand: true,
    ...read,
  });
  const release = (theta: number) => {
    if (runningRef.current) return; // a sweep began while the ball was held: the bench is the sweep's
    if (!isRelease(theta)) {
      setNote(PULL); // a tap: the ball just hangs
      return;
    }
    const s = { ...setup, theta0: theta };
    const seconds = secondsFor(s, measure);
    liveRef.current = { motion: swing(s, seconds), seconds, setup: s, measure, tk: trackerOf(measure) };
    clearTrack();
    setSwinging(true);
    setReleased(true);
    setNote(null);
  };
  /** What the instrument holds so far: Tracker's frames, or for a stopwatch the true motion
   *  (its error is the hand's, added when it is read; and a long stopwatch run can outlast
   *  the frame buffer). */
  const recording = (live: Live) =>
    live.measure.kind === 'stopwatch' ? track(live.motion, Math.min(clockRef.current.t, live.seconds), live.tk) : bufRef.current;
  /** The run's time is up: read the whole recording, then the ball hangs. */
  const finish = () => {
    const live = liveRef.current;
    if (!live) return;
    addRow(handRow(live, readTrack(recording(live), live.measure, Math.random)));
    hang();
  };
  /** Read the recording so far; too early, and the reason shows while the swing goes on. */
  const measureNow = () => {
    const live = liveRef.current;
    if (!live) return;
    const read = readNow(recording(live), live.measure, Math.random);
    if ('reason' in read) {
      setNote(read.reason); // shown for a moment: the recording keeps growing past it
      window.setTimeout(() => setNote((n) => (n === read.reason ? null : n)), 1500);
      return;
    }
    addRow(handRow(live, read));
    hang();
  };
  const grab = () => {
    liveRef.current = null; // the hand takes over from whatever was swinging
    setSwinging(false);
  };
  const stop = () => {
    if (!runningRef.current) return;
    stopRef.current?.();
    stopRef.current = null;
    runningRef.current = false;
    heldRef.current = null;
    setProgress(null);
    clearTrack(); // the ball hangs at the bench's length again: the last trial's marks go
  };
  /** Trials straight through, a slice at a time: rows land as they are measured, the rig takes
   *  each trial's length and release, the plots and the table show its track. */
  const run = (setups: Setup[], m: Measure) => {
    stop();
    hang();
    runningRef.current = true;
    const total = setups.length;
    setProgress({ done: 0, total });
    stopRef.current = runSliced(
      total,
      (i) => {
        const r = trialRun(setups[i], m, Math.random, nextId.current++);
        setRows((rs) => [...rs, r.row]);
        setNote(readingOf(r.row));
        setProgress({ done: i + 1, total });
        heldRef.current = { th: r.motion.theta[0], L: r.motion.L, s: setups[i] };
        const n = Math.min(r.track.n, MAX);
        for (let k = 0; k < n; k++) writeFrame(k, r.track.t[k], r.track.x[k], r.track.y[k]);
        bufRef.current.n = n;
        paint(r.seconds);
        showFrames();
      },
      stop,
    );
  };
  const runPreset = (p: Preset) => {
    setSetup(BENCH);
    setMeasure(p.measure);
    setRows([]);
    nextId.current = 1;
    setGraph({ x: p.x, y: p.y, fit: p.fit });
    setPreset(p.id);
    run(p.setups, p.measure);
  };
  const clear = () => {
    stop();
    setRows([]);
    nextId.current = 1;
    setNote(null);
    setPreset(null);
    setGraph({ x: 'theta', y: 'T', fit: null });
  };
  /** A sweep: the graph takes the swept knob as its x and what is measured as its y. */
  const runSweep = (setups: Setup[], col: ColKey) => {
    setPreset(null);
    setGraph({ x: col, y: measure.kind === 'tracker' && measure.decay ? 'Q' : 'T', fit: null });
    run(setups, measure);
  };
  // the loop and the pointer handlers live in an effect: they call the latest of these
  const act = useRef({ release, finish, grab });
  act.current = { release, finish, grab };
  useEffect(() => () => stopRef.current?.(), []);

  useEffect(() => {
    if (!active) return;
    let disposed = false;
    let raf = 0;
    const cleanupExtra: (() => void)[] = [];
    let renderer: { dispose: () => void; forceContextLoss: () => void; domElement: HTMLCanvasElement } | undefined;
    let controls: { dispose: () => void } | undefined;

    (async () => {
      try {
        const THREE = await import('three');
        const [{ GLTFLoader }, { DRACOLoader }, { OrbitControls }, { RoomEnvironment }] = await Promise.all([
          import('three/examples/jsm/loaders/GLTFLoader.js'),
          import('three/examples/jsm/loaders/DRACOLoader.js'),
          import('three/examples/jsm/controls/OrbitControls.js'),
          import('three/examples/jsm/environments/RoomEnvironment.js'),
        ]);
        const mount = mountRef.current;
        if (!mount || disposed) return;
        const seen = onScreen(mount); // frames off screen or in a hidden tab are not drawn
        cleanupExtra.push(seen.stop);

        const dark = () => document.body.classList.contains('dark-mode');
        const scene = new THREE.Scene();
        const restyle = () => {
          scene.background = new THREE.Color(dark() ? 0x1c1c1e : 0xd8d6d2);
          const host = plotX.current?.parentElement;
          const cs = host ? getComputedStyle(host) : null;
          styleRef.current = {
            fg: cs?.color || '#3e3e3e',
            bg: cs?.backgroundColor || '#ffffff',
            grid: dark() ? 'rgba(255,255,255,0.14)' : 'rgba(0,0,0,0.12)',
            accent: (frameRef.current && getComputedStyle(frameRef.current).getPropertyValue('--trk-accent').trim()) || '#d62b30',
            font: cs?.fontFamily || 'Georgia, serif',
          };
        };
        restyle(); // and again every half second in the loop: the theme sweep animates the colours
        const camera = new THREE.PerspectiveCamera(36, (mount.clientWidth || 560) / (mount.clientHeight || 400), 0.01, 20);
        camera.position.set(0.05, -0.08, 0.78);

        const webgl = new THREE.WebGLRenderer({ antialias: true });
        renderer = webgl;
        webgl.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
        webgl.setSize(mount.clientWidth || 560, mount.clientHeight || 400);
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
            paint(liveRef.current?.seconds ?? 8); // the plots beside it changed width too
          });
          ro.observe(mount);
          cleanupExtra.push(() => ro.disconnect());
        }

        scene.add(new THREE.HemisphereLight(0xffffff, 0x8a8078, 0.7));
        const key = new THREE.DirectionalLight(0xfff4e6, 1.6);
        key.position.set(0.5, 1.0, 1.2);
        key.castShadow = true;
        key.shadow.mapSize.set(1024, 1024);
        key.shadow.camera.left = key.shadow.camera.bottom = -0.7;
        key.shadow.camera.right = key.shadow.camera.top = 0.7;
        scene.add(key);

        const draco = new DRACOLoader();
        draco.setDecoderPath(DRACO);
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

        // the bob as the bench sets it: its size, its material (the 8-ball's markings only on the
        // lab's own bob), and a tank of water round the swing when the fluid is water
        const ball = bob.getObjectByName('BobBall') as InstanceType<typeof THREE.Mesh> | undefined;
        const markings = ['BobCircle', 'BobEight', 'BobRing'].map((n) => bob.getObjectByName(n)).filter((o): o is Object3D => !!o);
        const labLook = ball?.material;
        const looks = new Map<Look, InstanceType<typeof THREE.MeshStandardMaterial>>();
        const tank = new THREE.Mesh(
          new THREE.BoxGeometry(1, 1, 1),
          new THREE.MeshStandardMaterial({ color: 0x3f8fd8, transparent: true, opacity: 0.3, roughness: 0.1, depthWrite: false }),
        );
        // the glass's edges, so the tank reads as a tank and not a tint
        const glass = new THREE.LineSegments(new THREE.EdgesGeometry(tank.geometry), new THREE.LineBasicMaterial({ color: 0x2f6fae }));
        tank.add(glass);
        tank.visible = false;
        scene.add(tank);
        cleanupExtra.push(() => {
          tank.geometry.dispose();
          (tank.material as { dispose: () => void }).dispose();
          glass.geometry.dispose();
          glass.material.dispose();
          looks.forEach((m) => m.dispose());
        });
        let dressed: Setup | null = null;
        const dress = (st: Setup) => {
          if (st === dressed) return;
          dressed = st;
          bob.scale.setScalar(st.bobRadius / BOB_R);
          const look = lookOf(st);
          if (ball) {
            if (look === 'lab') {
              ball.material = labLook!;
            } else {
              let m = looks.get(look);
              if (!m) looks.set(look, (m = new THREE.MeshStandardMaterial(LOOKS[look])));
              ball.material = m;
            }
          }
          for (const o of markings) o.visible = look === 'lab';
          const L = hangLength(st);
          tank.visible = st.fluid.rho > 500;
          // from just under the pivot to below the bob, wide enough for a wide swing
          tank.scale.set(Math.max(0.3, 2 * L + 0.1), L + st.bobRadius + 0.06, 0.12);
          tank.position.set(0, -0.02 - tank.scale.y / 2, SWING_Z);
        };

        // Tracker's overlay: the coordinate axes through the pivot and the red step marks on the bob
        const axes = new THREE.LineSegments(
          new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(-0.35, 0, SWING_Z + 0.03),
            new THREE.Vector3(0.35, 0, SWING_Z + 0.03),
            new THREE.Vector3(0, 0.05, SWING_Z + 0.03),
            new THREE.Vector3(0, -0.42, SWING_Z + 0.03),
          ]),
          new THREE.LineBasicMaterial({ color: 0x7a5cff, depthTest: false, transparent: true, opacity: 0.8 }),
        );
        axes.renderOrder = 2;
        scene.add(axes);
        const trailGeo = new THREE.BufferGeometry();
        const trailAttr = new THREE.BufferAttribute(new Float32Array(MAX * 3), 3);
        trailAttr.setUsage(THREE.DynamicDrawUsage);
        trailGeo.setAttribute('position', trailAttr);
        trailGeo.setDrawRange(0, 0);
        const trail = new THREE.Points(
          trailGeo,
          new THREE.PointsMaterial({ color: 0xe0202a, size: 0.0075, depthTest: false, transparent: true, opacity: 0.9 }),
        );
        trail.renderOrder = 3;
        scene.add(trail);
        trailRef.current = { points: trail, attr: trailAttr };
        cleanupExtra.push(() => {
          trailRef.current = null;
          trailGeo.dispose();
          axes.geometry.dispose();
        });

        const orbit = new OrbitControls(camera, webgl.domElement);
        controls = orbit;
        orbit.enableDamping = true;
        orbit.target.set(0, -0.14, 0);
        orbit.minDistance = 0.2;
        orbit.maxDistance = 2.5;

        // the viewer's hand: a pointer near the ball grabs it, turns it round the pivot in the
        // swing plane (from where it was, so a tap moves nothing), and lets go; a click on a
        // knot re-ties the bob there. While a sweep or preset runs the rig is the bench's.
        let curL = hangRef.current; // the length the rig was last posed at
        const raycaster = new THREE.Raycaster();
        const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), -SWING_Z);
        const hit = new THREE.Vector3();
        const ndc = new THREE.Vector2();
        const toPlane = (clientX: number, clientY: number) => {
          const r = webgl.domElement.getBoundingClientRect();
          ndc.set(((clientX - r.left) / r.width) * 2 - 1, -((clientY - r.top) / r.height) * 2 + 1);
          raycaster.setFromCamera(ndc, camera);
          return raycaster.ray.intersectPlane(plane, hit) ? { x: hit.x, y: hit.y } : null;
        };
        const angleOf = (p: { x: number; y: number }) => Math.atan2(p.x, -p.y);
        const clampAngle = (th: number) => Math.max(-1.5, Math.min(1.5, th));
        const nearBob = (p: { x: number; y: number }) => {
          const th = arm.rotation.z;
          return Math.hypot(p.x - curL * Math.sin(th), p.y + curL * Math.cos(th)) < 0.05;
        };
        const knotAt = (p: { x: number; y: number }) => {
          const th = arm.rotation.z;
          const s = p.x * Math.sin(th) - p.y * Math.cos(th); // distance down the string
          const off = Math.hypot(p.x - s * Math.sin(th), p.y + s * Math.cos(th));
          const k = Math.round(s / 0.05);
          return off < 0.012 && k >= 1 && k <= 6 && Math.abs(s - 0.05 * k) < 0.02 ? 0.05 * k : null;
        };
        const el = webgl.domElement;
        const onDown = (e: PointerEvent) => {
          if (runningRef.current) return; // the bench is running trials: orbit only
          const p = toPlane(e.clientX, e.clientY);
          if (!p) return;
          if (nearBob(p)) {
            e.stopImmediatePropagation();
            e.preventDefault();
            el.setPointerCapture(e.pointerId);
            orbit.enabled = false;
            act.current.grab();
            const th = arm.rotation.z;
            dragRef.current = { on: true, theta: th, offset: th - angleOf(p) };
            setPull(th);
            el.style.cursor = 'grabbing';
            return;
          }
          if (!liveRef.current) {
            const L = knotAt(p);
            if (L !== null) {
              e.stopImmediatePropagation();
              setSetup((s) => ({ ...s, stringLength: L }));
            }
          }
        };
        const onMove = (e: PointerEvent) => {
          const p = toPlane(e.clientX, e.clientY);
          if (dragRef.current.on) {
            if (p) dragRef.current.theta = clampAngle(angleOf(p) + dragRef.current.offset); // shown by the loop's tick
            return;
          }
          el.style.cursor = !runningRef.current && p && nearBob(p) ? 'grab' : '';
        };
        const onUp = (e: PointerEvent) => {
          if (!dragRef.current.on) return;
          dragRef.current.on = false;
          orbit.enabled = true;
          el.style.cursor = '';
          if (el.hasPointerCapture(e.pointerId)) el.releasePointerCapture(e.pointerId);
          setPull(null);
          act.current.release(dragRef.current.theta);
        };
        el.addEventListener('pointerdown', onDown, true);
        el.addEventListener('pointermove', onMove);
        el.addEventListener('pointerup', onUp);
        el.addEventListener('pointercancel', onUp);
        cleanupExtra.push(() => {
          el.removeEventListener('pointerdown', onDown, true);
          el.removeEventListener('pointermove', onMove);
          el.removeEventListener('pointerup', onUp);
          el.removeEventListener('pointercancel', onUp);
        });

        let last = 0;
        let lastUi = 0;
        let lastStyle = 0;
        const pose = (th: number, L: number, st: Setup) => {
          dress(st);
          curL = L;
          arm.rotation.z = th;
          thread.scale.y = L - st.bobRadius;
          bob.position.y = -L;
        };
        const animate = (now: number) => {
          raf = requestAnimationFrame(animate);
          if (!last) last = now;
          const dt = Math.min((now - last) / 1000, 0.1);
          last = now;
          if (now - lastStyle > 500) {
            lastStyle = now;
            restyle();
          }
          const live = liveRef.current;
          const held = heldRef.current;
          if (dragRef.current.on) {
            const L = hangRef.current;
            const th = dragRef.current.theta;
            pose(th, L, setupRef.current);
            if (now - lastUi > 100) {
              lastUi = now;
              setPull(th);
              setFrame((f) => ({ ...f, x: L * Math.sin(th), y: -L * Math.cos(th), th }));
            }
          } else if (live) {
            const clock = clockRef.current;
            clock.t = Math.min(live.seconds, clock.t + dt * clock.speed);
            const { motion, tk } = live;
            pose(thetaAt(motion, clock.t), motion.L, live.setup);
            // the frames Tracker would have stepped through since the last draw, each with the
            // autotracker's jitter
            const buf = bufRef.current;
            const n0 = buf.n;
            while (buf.n < MAX && buf.n / tk.fps <= clock.t) {
              const ts = buf.n / tk.fps;
              const ths = thetaAt(motion, ts);
              writeFrame(buf.n, ts, motion.L * Math.sin(ths) + tk.jitter * gauss(Math.random), -motion.L * Math.cos(ths) + tk.jitter * gauss(Math.random));
              buf.n++;
            }
            if (buf.n > n0) paint(live.seconds);
            if (now - lastUi > 100) {
              lastUi = now;
              showFrames();
            }
            if (clock.t >= live.seconds) act.current.finish();
          } else if (held) {
            pose(held.th, held.L, held.s);
          } else {
            pose(0, hangRef.current, setupRef.current); // hanging still
          }
          // a run goes on while the reader is down at the table or the graph; only the picture rests
          if (seen.on) {
            orbit.update();
            webgl.render(scene, camera);
          }
        };
        raf = requestAnimationFrame(animate);
        paint(8); // empty axes, not blank boxes, before the first run
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
    // the loop reads everything live through refs and `act`
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  const noteText = note === PULL ? t('pull further') : note;
  const tail = noteText ? <> · {noteText}</> : null;
  const statusLine =
    pull !== null ? (
      tx('pulled to {angle}', { angle: fmtAngle(pull, unit, true) })
    ) : progress ? (
      <>
        {tx('sweep {k} / {n}', { k: progress.done, n: progress.total })}
        {tail}
      </>
    ) : swinging ? (
      <>
        {t('tracking')} {frame.t.toFixed(0)} s{tail}
      </>
    ) : (
      (noteText ?? (released ? t('✋ pull the ball and let go') : t('✋ pull the ball and let go · click a knot to re-tie')))
    );

  return (
    <figure className="story-figure model-viewer" id="pendulum-lab">
      {!active ? (
        <button type="button" className="model-poster" onClick={() => setActive(true)}>
          <img
            src={`${MEDIA}/fig-lab-render.jpg`}
            alt={t(
              'Rendered model of the pendulum rig: the acrylic rest and laptop on the oak shelf, the protractor at the pivot, the orange thread and the black 8-ball bob mid-swing in front of the lined-paper backdrop.',
            )}
            width={1600}
            height={1000}
            loading="lazy"
          />
          <span className="model-cta">{t('Try the pendulum')}</span>
        </button>
      ) : (
        <div className="asrs-frame trk" ref={frameRef} data-tab={shown}>
          <div className="trk-head">
            <span className="trk-title">Tracker</span>
            <span className="trk-muted">{t('tracking the bob · pivot as origin')}</span>
            <span className="trk-clock">
              {t('frame')} {frame.n} · t = {frame.t.toFixed(2)} s
            </span>
          </div>
          {status === 'ready' && (
            // phones: the rig, the results, the graph and the bench as four panels (CSS shows this
            // row only on a narrow screen)
            <div className="pl-tabs" role="group" aria-label={t('Lab panels')}>
              {(['rig', 'data', 'graph', 'bench'] as const).map((k) => (
                <button key={k} type="button" className={`asrs-btn${shown === k ? ' asrs-btn-on' : ''}`} aria-pressed={shown === k} disabled={k === 'data' && !rows.length} onClick={() => setTab(k)}>
                  {t(PANEL[k])}
                  {k === 'data' && rows.length > 0 && ` ${rows.length}`}
                </button>
              ))}
            </div>
          )}
          <div className="trk-body">
            <div
              className="trk-video"
              ref={mountRef}
              tabIndex={-1}
              role="application"
              aria-label={t('The pendulum rig in 3D. Drag the ball to pull it back and let go; drag elsewhere to orbit, scroll to zoom.')}
            >
              <span className="model-status" role="status" aria-live="polite">
                {status === 'loading' && t('building the rig…')}
                {status === 'error' && t("3D isn't available in this browser.")}
              </span>
              {status === 'ready' && (
                <>
                  {/* the ticking line is for the eye; a screen reader hears the readings and refusals */}
                  <span className="trk-status" aria-live="off">
                    {statusLine}
                  </span>
                  <span className="sr-only" role="status">
                    {noteText}
                  </span>
                  <span className="trk-read" aria-hidden="true">
                    x = {fmtX(frame.x)} m · y = {fmtX(frame.y)} m · θ = {fmtAngle(frame.th, unit)}
                  </span>
                </>
              )}
            </div>
            <div className="trk-side">
              <div className="trk-plot">
                <canvas ref={plotX} aria-label={t("the bob's x against time")} />
                <span className="trk-read">
                  t = {frame.t.toFixed(3)} s · x = {fmtX(frame.x)} m
                </span>
              </div>
              <div className="trk-plot">
                <canvas ref={plotY} aria-label={t("the bob's y against time")} />
                <span className="trk-read">
                  t = {frame.t.toFixed(3)} s · y = {fmtX(frame.y)} m
                </span>
              </div>
              <div className="trk-table" aria-label={t('frame table')}>
                <table>
                  <thead>
                    <tr>
                      <th>t (s)</th>
                      <th>x (m)</th>
                      <th>y (m)</th>
                      <th>θ ({unit})</th>
                    </tr>
                  </thead>
                  <tbody>
                    {table.map((r) => (
                      <tr key={r[0]}>
                        <td>{r[0]}</td>
                        <td>{r[1]}</td>
                        <td>{r[2]}</td>
                        <td>{r[3]}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          {status === 'ready' && (
            <>
              <PendulumSweep
                presets
                showForm={false}
                base={setup}
                unit={unit}
                progress={progress}
                activePreset={preset}
                onPreset={runPreset}
                onRun={runSweep}
                onStop={stop}
              />
              <div className="asrs-controls">
                <button
                  type="button"
                  className={`asrs-btn pl-bench-toggle${bench ? ' asrs-btn-on' : ''}`}
                  aria-pressed={bench}
                  onClick={() => setBench((b) => !b)}
                >
                  {t('⚙ bench')}
                </button>
                <span className="trk-seg" role="group" aria-label={t('Angle unit')}>
                  {(['rad', 'deg'] as AngleUnit[]).map((u) => (
                    <button
                      key={u}
                      type="button"
                      className={`asrs-btn${u === unit ? ' asrs-btn-on' : ''}`}
                      aria-pressed={u === unit}
                      onClick={() => setUnit(u)}
                    >
                      {u}
                    </button>
                  ))}
                </span>
                <span className="trk-seg" role="group" aria-label={t('Playback speed')}>
                  {SPEEDS.map((sp) => (
                    <button
                      key={sp}
                      type="button"
                      className={`asrs-btn${sp === speed ? ' asrs-btn-on' : ''}`}
                      aria-pressed={sp === speed}
                      onClick={() => setSpeed(sp)}
                    >
                      {sp}×
                    </button>
                  ))}
                </span>
                {/* last in the row, so nothing before it moves when it comes and goes */}
                {progress ? (
                  <button type="button" className="asrs-btn" onClick={stop}>
                    {t('■ stop')}
                  </button>
                ) : (
                  swinging && (
                    <button type="button" className="asrs-btn" onClick={measureNow}>
                      {t('measure now')}
                    </button>
                  )
                )}
                <span className="asrs-hint">{t('drag elsewhere to orbit · scroll to zoom')}</span>
              </div>
              {/* the bench, the results and the graph: under the controls in the article; the right
                  column of an expanded frame on a wide screen, with the bench always open there */}
              <div className="pl-side">
                <div className={`pl-bench${bench ? '' : ' is-shut'}`}>
                  <PendulumSweep
                    presets={false}
                    showForm
                    base={setup}
                    unit={unit}
                    progress={progress}
                    activePreset={preset}
                    onPreset={runPreset}
                    onRun={runSweep}
                    onStop={stop}
                  />
                  <PendulumSetup setup={setup} onSetup={setSetup} measure={measure} onMeasure={setMeasure} unit={unit} locked={progress !== null} />
                </div>
                <PendulumData rows={rows} unit={unit} onClear={clear} onRemove={(id) => setRows((rs) => rs.filter((r) => r.id !== id))} />
                <PendulumGraph
                  rows={rows}
                  base={setup}
                  unit={unit}
                  x={graph.x}
                  y={graph.y}
                  fitKind={graph.fit}
                  onAxes={(x, y) => setGraph((g) => ({ ...g, x, y }))}
                  onFit={(fit) => setGraph((g) => ({ ...g, fit }))}
                />
              </div>
            </>
          )}
        </div>
      )}
      <figcaption>
        {t('The rig from the photos as a physics twin, calibrated to the report. Pull the ball and let go, or change the bench and measure again.')}
      </figcaption>
    </figure>
  );
}

// ── the live plots: red steps in the page's own colours ─────────────────────

function drawPlot(canvas: HTMLCanvasElement | null, buf: Track, which: 'x' | 'y', seconds: number, st: PlotStyle) {
  if (!canvas) return;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const W = canvas.clientWidth || 300;
  const H = canvas.clientHeight || 100;
  if (canvas.width !== Math.round(W * dpr) || canvas.height !== Math.round(H * dpr)) {
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
  }
  const g = canvas.getContext('2d');
  if (!g) return;
  g.setTransform(dpr, 0, 0, dpr, 0, 0);
  g.fillStyle = st.bg;
  g.fillRect(0, 0, W, H);
  const m = { l: 46, r: 8, t: 16, b: 26 };
  const scaleF = which === 'x' ? 100 : 1; // x reads in ×10⁻² m, as Tracker labelled it
  const v = which === 'x' ? buf.x : buf.y;
  let lo = Infinity;
  let hi = -Infinity;
  for (let i = 0; i < buf.n; i++) {
    if (v[i] < lo) lo = v[i];
    if (v[i] > hi) hi = v[i];
  }
  if (!(hi > lo)) {
    lo = which === 'x' ? -0.05 : -0.25;
    hi = which === 'x' ? 0.05 : -0.2;
  }
  const pad = (hi - lo) * 0.08 || 0.01;
  lo -= pad;
  hi += pad;
  // the time axis grows with the run, up to the run's length
  const tEnd = buf.n ? buf.t[buf.n - 1] : 0;
  const span = Math.min(seconds, Math.max(8, 2 ** Math.ceil(Math.log2(Math.max(8, tEnd)))));
  const sx = (t: number) => m.l + (t / span) * (W - m.l - m.r);
  const sy = (y: number) => H - m.b - ((y - lo) / (hi - lo)) * (H - m.t - m.b);
  g.strokeStyle = st.grid;
  g.lineWidth = 1;
  g.strokeRect(m.l + 0.5, m.t + 0.5, W - m.l - m.r, H - m.t - m.b);
  g.beginPath();
  g.moveTo(m.l, sy((lo + hi) / 2) + 0.5);
  g.lineTo(W - m.r, sy((lo + hi) / 2) + 0.5);
  g.stroke();
  g.fillStyle = st.fg;
  g.font = `10px ${st.font}`;
  g.textAlign = 'center';
  g.fillText(`${which}(t)`, m.l + (W - m.l - m.r) / 2, 11);
  g.fillText('t (s)', m.l + (W - m.l - m.r) / 2, H - 4);
  for (let k = 0; k <= 2; k++) {
    const t = (span * k) / 2;
    g.fillText(String(+t.toFixed(1)), sx(t), H - m.b + 11);
  }
  g.textAlign = 'right';
  for (const y of [lo + pad, (lo + hi) / 2, hi - pad]) g.fillText((y * scaleF).toFixed(which === 'x' ? 0 : 2), m.l - 3, sy(y) + 3);
  if (which === 'x') {
    g.textAlign = 'left';
    g.fillText('×10⁻²', 2, 11);
  }
  g.save();
  g.translate(10, m.t + (H - m.t - m.b) / 2);
  g.rotate(-Math.PI / 2);
  g.textAlign = 'center';
  g.fillText(`${which} (m)`, 0, 0);
  g.restore();
  g.fillStyle = st.accent;
  const step = Math.max(1, Math.ceil(buf.n / 2400));
  for (let i = 0; i < buf.n; i += step) {
    g.fillRect(sx(buf.t[i]) - 1, sy(v[i]) - 1, 2, 2);
  }
}
