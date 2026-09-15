import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { BufferAttribute, Object3D, Points } from 'three';
import { useLang } from '../i18n';
import { FPS, REPORT, gauss, trackOf, type Point, type Track } from './pendulumPhysics';
import {
  BY_HAND,
  EXPERIMENTS,
  completeExperiment,
  experiment,
  fitOf,
  measure,
  prepare,
  protractorReading,
  reportLine,
  type ExpId,
  type Release,
  type Trial,
} from './pendulumExperiments';

const MEDIA = '/media/pendulum';
const GLB = `${MEDIA}/pendulum.glb`;
const BOB_R = 0.021;
const SWING_Z = 0.004; // the swing plane sits 4 mm in front of the protractor (glTF +Z)
const MAX = 200 * FPS + 2; // the longest run's frames
const ROWS = 8; // the table rows that fit beside the video
const HAND = 200; // a release by hand is tracked for up to 200 s, like the report's decay
const SETTLE = 4; // seconds of frames before a hand release's period goes on the graph

// The pendulum lab: the rig from the photos, swinging to the report's damped model, inside a
// window laid out like the Tracker session that read the real video — the red marks on the
// bob, the x(t) and y(t) plots and the frame table fill at 30 fps as it moves. The viewer
// pulls the ball and lets go; each release is tracked and becomes a point on the current
// experiment's graph. "Run all" plays the report's whole procedure instead. Every release
// carries a lab day's scatter (see JITTER), so no two runs give the same numbers.

type Live = Release & { trial: Trial; exp: ExpId; idx: number; recorded: boolean }; // idx −1: by hand

type Unit = 'rad' | 'deg';
const DEG = 180 / Math.PI;
const fmtX = (v: number) => (Object.is(v, -0) ? '0.000' : v.toFixed(3));
const fmtAngle = (th: number, unit: Unit, signed = false) => {
  const sign = signed && th > 0 ? '+' : '';
  return unit === 'rad' ? `${sign}${th.toFixed(3)} rad` : `${sign}${(th * DEG).toFixed(1)}°`;
};
type PlotStyle = { fg: string; bg: string; grid: string; accent: string; font: string };

export function PendulumLab() {
  const { t, tx } = useLang();
  const [active, setActive] = useState(
    () => typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('3d'),
  );
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [exp, setExp] = useState<ExpId>('angle');
  const [unit, setUnit] = useState<Unit>('rad');
  const [speed, setSpeed] = useState(1);
  const [length, setLength] = useState(REPORT.L);
  const [running, setRunning] = useState(false); // the report's procedure, playing by itself
  const [trialIdx, setTrialIdx] = useState(-1);
  const [busy, setBusy] = useState(false); // anything swinging under the tracker
  const [points, setPoints] = useState<Record<ExpId, Point[]>>({ angle: [], decay: [], length: [], q: [] });
  const [measured, setMeasured] = useState<Partial<Record<ExpId, Point[]>>>({});
  const [frame, setFrame] = useState({ t: 0, x: 0, y: -REPORT.L, th: 0, n: 0 });
  const [rows, setRows] = useState<string[][]>([]);
  const [lastResult, setLastResult] = useState<{ exp: ExpId; n: number; y: number } | null>(null); // the last measurement, worded at render
  const [released, setReleased] = useState(false); // the viewer has let go once: the hint can go
  const [pull, setPull] = useState<number | null>(null); // the angle while the ball is held
  const mountRef = useRef<HTMLDivElement>(null);
  const plotX = useRef<HTMLCanvasElement>(null);
  const plotY = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const liveRef = useRef<Live | null>(null);
  const clockRef = useRef({ t: 0, speed: 1 });
  const bufRef = useRef<Track>({ t: new Float32Array(MAX), x: new Float32Array(MAX), y: new Float32Array(MAX), n: 0 });
  const trailRef = useRef<{ points: Points; attr: BufferAttribute } | null>(null);
  const dragRef = useRef({ on: false, theta: 0 });
  const doneRef = useRef<() => void>(() => {});
  const unitRef = useRef<Unit>('rad');
  const expRef = useRef<ExpId>('angle');
  const lengthRef = useRef(REPORT.L);
  const styleRef = useRef<PlotStyle | null>(null);

  const def = experiment(exp);
  const lengthFor = (id: ExpId) => (id === 'length' || id === 'q' ? lengthRef.current : REPORT.L);

  const clearTrack = useCallback(() => {
    clockRef.current.t = 0;
    bufRef.current.n = 0;
    trailRef.current?.points.geometry.setDrawRange(0, 0);
    setRows([]);
  }, []);
  const hang = useCallback(() => {
    liveRef.current = null;
    setBusy(false);
    clearTrack();
  }, [clearTrack]);
  // the report's procedure, trial by trial
  const startTrial = useCallback(
    (id: ExpId, idx: number) => {
      const trial = experiment(id).trials[idx];
      liveRef.current = { ...prepare(trial), trial, exp: id, idx, recorded: false };
      setBusy(true);
      clearTrack();
    },
    [clearTrack],
  );
  // a release by the viewer's hand, at the angle they let go of
  const release = useCallback(
    (theta: number) => {
      const id = expRef.current;
      const trial: Trial = { L: lengthFor(id), theta0: theta, seconds: HAND };
      liveRef.current = { ...prepare(trial, Math.random, BY_HAND), trial, exp: id, idx: -1, recorded: false };
      setRunning(false);
      setTrialIdx(-1);
      setBusy(true);
      setReleased(true);
      setLastResult(null);
      if (id === 'decay') setPoints((p) => ({ ...p, decay: [] })); // one decay on the graph at a time
      clearTrack();
    },
    [clearTrack],
  );

  useEffect(() => {
    let dead = false;
    fetch(`${MEDIA}/data/${def.data}`)
      .then((r) => r.text())
      .catch(() => '') // no data (tests, offline): the twin still runs
      .then((text) => {
        if (dead) return;
        const pts: Point[] = [];
        for (const line of text.split('\n')) {
          const t = line.trim().split(/\s+/).map(Number);
          if (t.length >= 2 && Number.isFinite(t[0]) && Number.isFinite(t[1]))
            pts.push({ x: t[0], y: t[1], dy: Number.isFinite(t[3]) ? t[3] : undefined });
        }
        setMeasured((m) => ({ ...m, [exp]: exp === 'decay' ? envelopeOf(pts) : pts }));
      });
    return () => {
      dead = true;
    };
  }, [exp, def.data]);

  useEffect(() => {
    expRef.current = exp;
    setRunning(false);
    setTrialIdx(-1);
    setLastResult(null);
    hang(); // a new experiment starts with the ball hanging
  }, [exp, hang]);
  useEffect(() => {
    clockRef.current.speed = speed;
    unitRef.current = unit;
    lengthRef.current = length;
  }, [speed, unit, length]);

  const runAll = () => {
    setPoints((p) => ({ ...p, [exp]: [] }));
    setLastResult(null);
    setRunning(true);
    setTrialIdx(0);
    startTrial(exp, 0);
  };
  const record = (live: Live, pts: Point[]) => {
    setPoints((p) => ({ ...p, [live.exp]: live.exp === 'decay' ? pts : [...p[live.exp], ...pts] }));
    const last = pts[pts.length - 1];
    if (last) setLastResult({ exp: live.exp, n: pts.length, y: last.y });
  };
  /** A hand release's measurement, the angle taken as the protractor reading. */
  const measureHand = (live: Live, tr: Track): Point[] =>
    measure(live.exp, live.trial, tr).map((p) => (live.exp === 'angle' ? { ...p, x: protractorReading(live.trial.theta0) } : p));
  const finishNow = () => {
    const live = liveRef.current;
    if (!live) return;
    if (live.idx >= 0) {
      setPoints((p) => ({ ...p, [exp]: completeExperiment(exp, live.idx, p[exp]) }));
      setRunning(false);
      setTrialIdx(-1);
    } else {
      const full = trackOf(live.run, live.L, live.trial.seconds, FPS, live.noise, Math.random);
      if (live.exp === 'decay' || live.exp === 'q' || !live.recorded) record(live, measureHand(live, full));
    }
    hang();
  };
  const clear = () => {
    setPoints((p) => ({ ...p, [exp]: [] }));
    setLastResult(null);
    setRunning(false);
    setTrialIdx(-1);
    hang();
  };
  // a run's time is up: measure it off the frames, then the next trial — or hang the ball
  doneRef.current = () => {
    const live = liveRef.current;
    if (!live) return;
    const buf = bufRef.current;
    const tr = { t: buf.t, x: buf.x, y: buf.y, n: buf.n };
    if (live.idx < 0) {
      if (live.exp === 'decay' || live.exp === 'q') record(live, measureHand(live, tr));
      hang();
      return;
    }
    record(live, measure(live.exp, live.trial, tr));
    const trials = experiment(live.exp).trials;
    if (live.idx + 1 < trials.length) {
      setTrialIdx(live.idx + 1);
      startTrial(live.exp, live.idx + 1);
    } else {
      setRunning(false);
      setTrialIdx(-1);
      hang();
    }
  };

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
        const camera = new THREE.PerspectiveCamera(
          36,
          (mount.clientWidth || 560) / (mount.clientHeight || 400),
          0.01,
          20,
        );
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

        // the viewer's hand: a pointer near the ball grabs it, drags it round the pivot in the
        // swing plane, and lets go; a click on a knot re-ties the bob there (length experiments)
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
        const nearBob = (p: { x: number; y: number }) => {
          const L = lengthFor(expRef.current);
          const th = arm.rotation.z;
          return Math.hypot(p.x - L * Math.sin(th), p.y + L * Math.cos(th)) < 0.05;
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
          const p = toPlane(e.clientX, e.clientY);
          if (!p) return;
          if (nearBob(p)) {
            e.stopImmediatePropagation();
            e.preventDefault();
            el.setPointerCapture(e.pointerId);
            orbit.enabled = false;
            liveRef.current = null; // the hand takes over from whatever was swinging
            setRunning(false);
            setTrialIdx(-1);
            dragRef.current = { on: true, theta: Math.max(-1.5, Math.min(1.5, Math.atan2(p.x, -p.y))) };
            setPull(dragRef.current.theta);
            el.style.cursor = 'grabbing';
            return;
          }
          const id = expRef.current;
          if ((id === 'length' || id === 'q') && !liveRef.current) {
            const L = knotAt(p);
            if (L !== null) {
              e.stopImmediatePropagation();
              setLength(L);
            }
          }
        };
        const onMove = (e: PointerEvent) => {
          const p = toPlane(e.clientX, e.clientY);
          if (dragRef.current.on) {
            if (p) {
              dragRef.current.theta = Math.max(-1.5, Math.min(1.5, Math.atan2(p.x, -p.y)));
              setPull(dragRef.current.theta);
            }
            return;
          }
          el.style.cursor = p && nearBob(p) ? 'grab' : '';
        };
        const onUp = (e: PointerEvent) => {
          if (!dragRef.current.on) return;
          dragRef.current.on = false;
          orbit.enabled = true;
          el.style.cursor = '';
          if (el.hasPointerCapture(e.pointerId)) el.releasePointerCapture(e.pointerId);
          setPull(null);
          release(dragRef.current.theta);
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
        let lastEnvelope = 0;
        const pose = (th: number, L: number) => {
          arm.rotation.z = th;
          thread.scale.y = L - BOB_R;
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
          if (dragRef.current.on) {
            const L = lengthFor(expRef.current);
            const th = dragRef.current.theta;
            pose(th, L);
            if (now - lastUi > 100) {
              lastUi = now;
              setFrame((f) => ({ ...f, x: L * Math.sin(th), y: -L * Math.cos(th), th }));
            }
          } else if (live) {
            const clock = clockRef.current;
            clock.t += dt * clock.speed;
            if (clock.t >= live.trial.seconds) {
              doneRef.current();
            } else {
              const { run, trial, L, noise } = live;
              pose(run.theta[Math.min(run.theta.length - 1, Math.floor(clock.t / run.dt))], L);
              // the frames Tracker would have stepped through since the last draw
              const buf = bufRef.current;
              const pos = trailAttr.array as Float32Array;
              let added = false;
              while (buf.n < MAX && buf.n / FPS <= clock.t) {
                const ts = buf.n / FPS;
                const ths = run.theta[Math.min(run.theta.length - 1, Math.round(ts / run.dt))];
                const x = L * Math.sin(ths) + noise * gauss(Math.random); // the autotracker's jitter
                const y = -L * Math.cos(ths) + noise * gauss(Math.random);
                buf.t[buf.n] = ts;
                buf.x[buf.n] = x;
                buf.y[buf.n] = y;
                pos[buf.n * 3] = x;
                pos[buf.n * 3 + 1] = y;
                pos[buf.n * 3 + 2] = SWING_Z + 0.03;
                buf.n++;
                added = true;
              }
              if (added) {
                trailAttr.needsUpdate = true;
                trailGeo.setDrawRange(0, buf.n);
                const st = styleRef.current;
                if (st) {
                  drawPlot(plotX.current, buf, 'x', trial.seconds, st);
                  drawPlot(plotY.current, buf, 'y', trial.seconds, st);
                }
              }
              // a hand release: its period goes on the graph once a few swings are in, a decay
              // envelope grows as the peaks come
              if (live.idx < 0) {
                const tr = { t: buf.t, x: buf.x, y: buf.y, n: buf.n };
                if (!live.recorded && (live.exp === 'angle' || live.exp === 'length') && clock.t >= SETTLE) {
                  live.recorded = true;
                  record(live, measureHand(live, tr));
                } else if (live.exp === 'decay' && now - lastEnvelope > 1000) {
                  lastEnvelope = now;
                  record(live, measureHand(live, tr));
                }
              }
              if (now - lastUi > 100 && buf.n > 0) {
                lastUi = now;
                const i = buf.n - 1;
                const u = unitRef.current;
                setFrame({ t: buf.t[i], x: buf.x[i], y: buf.y[i], th: Math.atan2(buf.x[i], -buf.y[i]), n: i });
                const out: string[][] = [];
                for (let k = Math.max(0, buf.n - ROWS); k < buf.n; k++) {
                  const th = Math.atan2(buf.x[k], -buf.y[k]);
                  out.push([buf.t[k].toFixed(3), fmtX(buf.x[k]), buf.y[k].toFixed(3), u === 'rad' ? th.toFixed(3) : (th * DEG).toFixed(1)]);
                }
                setRows(out);
              }
            }
          } else {
            pose(0, lengthFor(expRef.current)); // hanging still
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
    // the loop reads everything live through refs; `release` and `record` are stable enough
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  const pts = points[exp];
  const fit = useMemo(() => fitOf(exp, pts), [exp, pts]);
  const A0 = exp === 'decay' ? (measured.decay?.[0]?.y ?? pts[0]?.y ?? REPORT.theta0) : REPORT.theta0;
  // the angle experiment's graph reads in the chosen unit; the fits stay in radians
  const xf = exp === 'angle' && unit === 'deg' ? DEG : 1;
  const scaled = (p?: Point[]) => (xf === 1 ? p : p?.map((q) => ({ ...q, x: q.x * xf })));
  const inRad = (f?: (x: number) => number) => (f && xf !== 1 ? (x: number) => f(x / xf) : f);
  const knots = exp === 'length' || exp === 'q';
  const result =
    lastResult === null
      ? null
      : lastResult.exp === 'decay'
        ? tx('{n} peaks', { n: lastResult.n })
        : lastResult.exp === 'q'
          ? `Q ${lastResult.y.toFixed(0)}`
          : `T ${lastResult.y.toFixed(3)} s`;
  const tail = result ? <> · {result}</> : null;
  const statusLine =
    pull !== null
      ? tx('pulled to {angle}', { angle: fmtAngle(pull, unit, true) })
      : running
        ? <>{tx('trial {i} of {n}', { i: trialIdx + 1, n: def.trials.length })}{tail}</>
        : busy
          ? <>{t('tracking')} {frame.t.toFixed(0)} s{tail}</>
          : released
            ? result ?? t('hanging')
            : knots
              ? t('✋ pull the ball and let go · click a knot to re-tie')
              : t('✋ pull the ball and let go');
  const chartNote = fit
    ? tx(fit.note.key, fit.note.values)
    : pts.length === 1
      ? t('1 point — a few more for the fit')
      : pts.length
        ? tx('{n} points — a few more for the fit', { n: pts.length })
        : t('each release adds a point');

  return (
    <figure className="story-figure model-viewer" id="pendulum-lab">
      {!active ? (
        <button type="button" className="model-poster" onClick={() => setActive(true)}>
          <img
            src={`${MEDIA}/fig-lab-render.jpg`}
            alt={t('Rendered model of the pendulum rig: the acrylic rest and laptop on the oak shelf, the protractor at the pivot, the orange thread and the black 8-ball bob mid-swing in front of the lined-paper backdrop.')}
            width={1600}
            height={1000}
            loading="lazy"
          />
          <span className="model-cta">{t('Try the pendulum')}</span>
        </button>
      ) : (
        <div className="asrs-frame trk" ref={frameRef}>
          <div className="trk-head">
            <span className="trk-title">Tracker</span>
            <span className="trk-muted">{t('tracking the bob · pivot as origin')}</span>
            <span className="trk-clock">
              {t('frame')} {frame.n} · t = {frame.t.toFixed(2)} s
            </span>
          </div>
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
                  <span className="trk-status" role="status" aria-live="polite">
                    {statusLine}
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
                    {rows.map((r) => (
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
              <div className="asrs-steps" role="group" aria-label={t('Experiments')}>
                {EXPERIMENTS.map((e) => (
                  <button
                    key={e.id}
                    type="button"
                    className={`asrs-step${e.id === exp ? ' asrs-step-on' : ''}`}
                    title={t(e.blurb)}
                    onClick={() => setExp(e.id)}
                  >
                    {t(e.lab)} · {t(e.name)}
                  </button>
                ))}
              </div>
              <div className="asrs-controls">
                {busy ? (
                  <button type="button" className="asrs-btn" onClick={finishNow}>
                    {t('⏭ finish')}
                  </button>
                ) : (
                  <button type="button" className="asrs-btn" onClick={runAll}>
                    {tx('▶ run all {n}', { n: def.trials.length })}
                  </button>
                )}
                {pts.length > 0 && (
                  <button type="button" className="asrs-btn" onClick={clear}>
                    {t('↺ clear')}
                  </button>
                )}
                {knots &&
                  REPORT.lengths.map((L) => (
                    <button
                      key={L}
                      type="button"
                      className={`asrs-btn${L === length ? ' asrs-btn-on' : ''}`}
                      disabled={busy}
                      onClick={() => setLength(L)}
                    >
                      {Math.round(L * 100)} cm
                    </button>
                  ))}
                <span className="trk-seg" role="group" aria-label={t('Angle unit')}>
                  {(['rad', 'deg'] as Unit[]).map((u) => (
                    <button key={u} type="button" className={`asrs-btn${u === unit ? ' asrs-btn-on' : ''}`} onClick={() => setUnit(u)}>
                      {u}
                    </button>
                  ))}
                </span>
                <span className="trk-seg" role="group" aria-label={t('Playback speed')}>
                  {[1, 4].map((s) => (
                    <button key={s} type="button" className={`asrs-btn${s === speed ? ' asrs-btn-on' : ''}`} onClick={() => setSpeed(s)}>
                      {s}×
                    </button>
                  ))}
                </span>
                <span className="asrs-hint">{t('drag elsewhere to orbit · scroll to zoom')}</span>
              </div>
              <Chart
                title={t(def.name)}
                xLabel={exp === 'angle' ? `${t('Release angle')} (${unit})` : t(def.x)}
                yLabel={t(def.y)}
                twin={scaled(exp === 'decay' ? pts.filter((_, i) => i % 3 === 0) : pts)!}
                twinLine={inRad(fit?.line)}
                reportLine={inRad(reportLine(exp, A0))!}
                measured={scaled(exp === 'decay' ? measured.decay?.filter((_, i) => i % 2 === 0) : measured[exp])}
                xRange={[def.xRange[0] * xf, def.xRange[1] * xf]}
                yRange={def.yRange}
              />
              <p className="asrs-note">{chartNote}</p>
            </>
          )}
        </div>
      )}
      <figcaption>
        {t("The rig from the photos, swinging to the report's own damped model. Pull the ball and let go: the window tracks it the way Tracker tracked the real video, and each release becomes a point on the graph beside the report's measurements.")}
      </figcaption>
    </figure>
  );
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
  // the time axis grows with the run: a hand release is tracked for up to 200 s
  const span = Math.min(seconds, Math.max(8, 2 ** Math.ceil(Math.log2(Math.max(8, buf.n / FPS)))));
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

// ── the result chart: measured points, the report's fit, and this lab's releases ─

type Series = {
  twin: Point[];
  twinLine?: (x: number) => number;
  reportLine: (x: number) => number;
  measured?: Point[];
  xRange: [number, number];
  yRange: [number, number];
};

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
  const { t } = useLang();
  return (
    <div className="lab-chart">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`${title}: ${t("the report's points and fit, and this lab's releases")}`}>
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
        {twinLine && <path d={line(twinLine)} className="lab-twin" />}
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
        <span><i className="lab-key lab-key-measured" /> {t('report')}</span>
        <span><i className="lab-key lab-key-report" /> {t('report fit')}</span>
        <span><i className="lab-key lab-key-twin" /> {t('this lab')}</span>
      </div>
    </div>
  );
}
