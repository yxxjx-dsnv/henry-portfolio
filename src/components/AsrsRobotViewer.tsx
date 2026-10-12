import { useCallback, useEffect, useRef, useState } from 'react';
import { loadSystemAsset, makeRack, makeBin, makeGround, CRADLE_H, DECK_REST, TILE_T } from './asrsScene';
import { loadRobotAsset, makeRobot, liftPose, liftFraction, clampFraction } from './asrsRobot';
import { PITCH, SPEED } from './asrsFleet';
import { act, startDrive, stepDrive, toGrid, type Drive, type Screen } from './asrsDrive';
import { useLang } from '../i18n';
import { onScreen } from './onScreen';

const CLAMP = clampFraction();
// drive mode: WASD by key position (e.code), so a Korean IME or an AZERTY layout still drives
const KEYS: Record<string, Screen> = { KeyW: 'up', KeyA: 'left', KeyS: 'down', KeyD: 'right' };
const DPAD: Array<[Screen, string]> = [
  ['up', '▴'],
  ['left', '◂'],
  ['right', '▸'],
  ['down', '▾'],
];
// `?fast` runs the easing 12× — for screenshots from a throttled headless browser, not for people
const TEMPO = typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('fast') ? 12 : 1;

const MEDIA = '/media/incheon-robotics';

// ── the mechanism, one step at a time ──────────────────────────────────────
// Each stage is a target pose; the viewer eases between them, and the caption
// says what the machine is doing and why. Auto-play walks the whole cycle.
type Stage = {
  name: string;
  note: string;
  // targets
  slide: number; // 0 = parked a cell away, 1 = squared under the bin
  grip: number; // 0 = tabs in, 1 = tabs run out under the rim
  lift: number; // 0 = deck down, 1 = deck up
};

const STAGES: Stage[] = [
  {
    name: 'Park',
    note: 'Between orders the machine runs flat: deck down, tabs in, low enough to pass under stored bins. Here it heads for its next pick.',
    slide: 0,
    grip: 0,
    lift: 0,
  },
  {
    name: 'Drive',
    note: 'It follows the guide lines: down one lane, a 90° corner, into the next, without ever turning. The mecanum rollers, set at 45°, let the same four wheels drive in any direction; watch the near pair counter-rotate on the first leg.',
    slide: 1,
    grip: 0,
    lift: 0,
  },
  {
    name: 'Spread',
    note: 'Stopped on the tile centre, the blue hub turns and its slots run all four tabs outward past the bin\u2019s footprint. One motor moves all four.',
    slide: 1,
    grip: 1,
    lift: 0,
  },
  {
    name: 'Lift',
    note: 'The scissor extends. The deck meets the bin\u2019s underside and lifts it clear of its cradle: up to 30 kg on an 8 kg machine.',
    slide: 1,
    grip: 1,
    lift: 1,
  },
  {
    name: 'Lock',
    note: 'The hub turns back until the tabs meet the bin\u2019s sides and clamp it to the deck.',
    slide: 1,
    grip: CLAMP,
    lift: 1,
  },
  {
    name: 'Carry',
    note: 'Out the way it came with the bin held high, clear of the cradle arms. In the warehouse this leg ends at the picking station.',
    slide: 0,
    grip: CLAMP,
    lift: 1,
  },
  {
    name: 'Release',
    note: 'Over the next cradle the hub turns again: the tabs spread clear of the arms, and the bin is free to land.',
    slide: 0,
    grip: 1,
    lift: 1,
  },
  {
    name: 'Set down',
    note: 'The deck lowers through the arms and the cradle takes the bin.',
    slide: 0,
    grip: 1,
    lift: 0,
  },
  {
    name: 'Retract',
    note: 'Tabs in, deck down: the machine is free, and the next order sends it straight back for the bin.',
    slide: 0,
    grip: 0,
    lift: 0,
  },
];

export function AsrsRobotViewer() {
  const { t } = useLang();
  const [active, setActive] = useState(
    () => typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('3d'),
  );
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [stage, setStage] = useState(0);
  // a clicked step is a goal: the machine walks there one step at a time, forward or back,
  // so every pose it passes through is one it could really be in — no teleporting bins
  const [goal, setGoal] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [xray, setXray] = useState(false);
  const mountRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef(0);
  const goalRef = useRef(0);
  const playRef = useRef(true);
  const xrayRef = useRef(false);
  // drive it yourself: the loop owns the robot (dvRef) while this is on
  const [drive, setDrive] = useState(false);
  const [pose, setPose] = useState({ lift: 0, grip: 0 }); // the HUD's deck and tabs while driving
  const [msg, setMsg] = useState<string | null>(null);
  const [coarse] = useState(() => typeof window !== 'undefined' && !!window.matchMedia?.('(pointer: coarse)').matches);
  const driveRef = useRef(false);
  const dvRef = useRef<Drive | null>(null);
  const padRef = useRef<{ held: Screen[]; tap: Screen | null }>({ held: [], tap: null });
  const msgRef = useRef<{ text: string | null; until: number }>({ text: null, until: 0 });
  const onScreenRef = useRef(false);

  // a refusal stays up while the key is held, and a couple of seconds after
  const say = useCallback((text: string) => {
    msgRef.current.until = performance.now() + 2200;
    if (msgRef.current.text !== text) {
      msgRef.current.text = text;
      setMsg(text);
    }
  }, []);
  const doAct = (what: 'grip' | 'lift') => {
    const d = dvRef.current;
    if (!d) return;
    const why = act(d, what);
    if (why) say(why);
  };
  const press = (d: Screen) => {
    const p = padRef.current;
    p.held = p.held.filter((h) => h !== d).concat(d);
    p.tap = d; // a press shorter than a frame still moves it a cell
  };
  const release = (d: Screen) => {
    padRef.current.held = padRef.current.held.filter((h) => h !== d);
  };
  const toggleDrive = () => {
    // either way the cycle starts over: parked, the bin on cell A
    setDrive(!drive);
    setPlaying(drive);
    setStage(0);
    setGoal(0);
    padRef.current = { held: [], tap: null };
  };

  useEffect(() => {
    stageRef.current = stage;
  }, [stage]);
  useEffect(() => {
    driveRef.current = drive;
  }, [drive]);

  useEffect(() => {
    const el = mountRef.current;
    if (!active || !el || typeof IntersectionObserver !== 'function') return;
    const io = new IntersectionObserver(([e]) => {
      onScreenRef.current = e.isIntersecting;
    });
    io.observe(el);
    return () => io.disconnect();
  }, [active]);

  // the keys drive only while drive mode is on and the viewer is on screen
  useEffect(() => {
    if (!drive) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.altKey || !onScreenRef.current) return;
      const el = e.target as HTMLElement | null;
      if (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable)) return;
      const dir = KEYS[e.code];
      if (dir) {
        e.preventDefault();
        if (!e.repeat) press(dir);
      } else if ((e.code === 'KeyE' || e.code === 'KeyF') && !e.repeat) {
        e.preventDefault();
        doAct(e.code === 'KeyE' ? 'grip' : 'lift');
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      // macOS sends no keyup for a key let go while Cmd is down
      if (e.key === 'Meta') padRef.current.held = [];
      else if (KEYS[e.code]) release(KEYS[e.code]);
    };
    // no keyup reaches a window that has lost focus, so held keys are forgotten then
    const onBlur = () => {
      padRef.current.held = [];
    };
    window.addEventListener('keydown', onKey);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', onBlur);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', onBlur);
    };
    // press/release/doAct only touch refs and state setters, so the first ones serve
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drive]);
  useEffect(() => {
    goalRef.current = goal;
  }, [goal]);
  useEffect(() => {
    playRef.current = playing;
  }, [playing]);
  useEffect(() => {
    xrayRef.current = xray;
  }, [xray]);

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
        const [{ OrbitControls }, { RoomEnvironment }, asset, sys] = await Promise.all([
          import('three/examples/jsm/controls/OrbitControls.js'),
          import('three/examples/jsm/environments/RoomEnvironment.js'),
          loadRobotAsset(),
          loadSystemAsset(),
        ]);
        const mount = mountRef.current;
        if (!mount || disposed) return;
        const seen = onScreen(mount); // frames off screen or in a hidden tab are not drawn
        cleanupExtra.push(seen.stop);

        const dark = () => document.body.classList.contains('dark-mode');
        const scene = new THREE.Scene();
        const setBg = () => {
          scene.background = new THREE.Color(dark() ? 0x131417 : 0xd4d7db);
        };
        setBg();

        const webgl = new THREE.WebGLRenderer({ antialias: true });
        renderer = webgl;
        webgl.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
        webgl.setSize(mount.clientWidth || 560, mount.clientHeight || 420);
        webgl.shadowMap.enabled = true;
        webgl.shadowMap.type = THREE.PCFSoftShadowMap;
        webgl.toneMapping = THREE.ACESFilmicToneMapping;
        webgl.toneMappingExposure = 1.1;
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

        const camera = new THREE.PerspectiveCamera(
          36,
          (mount.clientWidth || 560) / (mount.clientHeight || 420),
          0.01,
          60,
        );
        camera.position.set(1.35, 0.62, 1.5);

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

        scene.add(new THREE.HemisphereLight(0xffffff, 0x707070, 0.8));
        const key = new THREE.DirectionalLight(0xffffff, 2.3);
        key.position.set(1.8, 3, 2);
        key.castShadow = true;
        key.shadow.mapSize.set(2048, 2048);
        key.shadow.camera.left = key.shadow.camera.bottom = -1.6;
        key.shadow.camera.right = key.shadow.camera.top = 1.6;
        key.shadow.bias = -0.0012;
        scene.add(key);
        const rim = new THREE.DirectionalLight(0xd8e4ff, 0.55);
        rim.position.set(-2, 1.4, -1.6);
        scene.add(rim);

        // a 4 × 4 patch of the rack's deck, tiles at floor level, cradles at every cell —
        // the storage cell A (0,0) and, diagonally, the station cell B (1,1)
        const cells: Array<[number, number, number]> = [];
        for (let c = -1; c <= 2; c++) for (let r = -1; r <= 2; r++) cells.push([c, r, 0]);
        for (const mesh of makeRack(THREE, sys, { tiles: cells, cradles: cells, floorY: -TILE_T - 0.05, topY: 0.5 }))
          scene.add(mesh);
        const ground = makeGround(THREE, sys, 12);
        ground.position.y = -TILE_T - 0.05;
        scene.add(ground);

        const robot = makeRobot(asset);
        scene.add(robot.group);
        cleanupExtra.push(() => robot.dispose());
        const bin = makeBin(sys);
        scene.add(bin);

        const orbit = new OrbitControls(camera, webgl.domElement);
        controls = orbit;
        orbit.enableDamping = true;
        orbit.target.set(PITCH / 2, 0.1, PITCH / 2);
        orbit.minDistance = 0.35;
        orbit.maxDistance = 4;
        orbit.maxPolarAngle = Math.PI / 2 - 0.03;

        // The path between the two cells runs the guide lines, exactly like the fleet:
        // along the x-lane, a 90° corner, then down the z-lane — never cutting between
        // the posts. u = 0 is cell A (storage), u = 1 is cell B (the station).
        const CELL = { A: { x: 0, z: 0 }, B: { x: PITCH, z: PITCH } };
        const W = [CELL.A, { x: PITCH, z: 0 }, CELL.B];
        const seg1 = Math.hypot(W[1].x - W[0].x, W[1].z - W[0].z);
        const seg2 = Math.hypot(W[2].x - W[1].x, W[2].z - W[1].z);
        const total = seg1 + seg2;
        const pointAt = (u: number) => {
          const d = u * total;
          if (d <= seg1) {
            const t = d / seg1;
            return { x: W[0].x + (W[1].x - W[0].x) * t, z: W[0].z + (W[1].z - W[0].z) * t };
          }
          const t = (d - seg1) / seg2;
          return { x: W[1].x + (W[2].x - W[1].x) * t, z: W[1].z + (W[2].z - W[1].z) * t };
        };
        const cellAt = (pt: { x: number; z: number }): 'A' | 'B' | null =>
          Math.hypot(pt.x - CELL.A.x, pt.z - CELL.A.z) < 0.02 ? 'A' : Math.hypot(pt.x - CELL.B.x, pt.z - CELL.B.z) < 0.02 ? 'B' : null;

        // eased state, chasing the current stage's targets. slide 1 = under the bin,
        // slide 0 = the other cell; each cycle the bin changes cells, so the mapping flips
        // at Park (with slide mirrored so the machine stays where it is) and it drives
        // back for the bin the other way round — a delivery, then the return trip.
        const ATTACH_Y = CRADLE_H - 0.004;
        // drive mode: the same 4 × 4 patch, at the fleet's cruise speed, by the same handoff
        const rig = { lo: -1, hi: 2, speed: SPEED / PITCH, clamp: CLAMP, attach: liftFraction(ATTACH_Y - DECK_REST) };
        let wasDriving = false;
        let shown = { lift: 0, grip: 0 }; // what the HUD says, so it re-renders only on a change
        // the orbit target moves, and the camera with it, so the visitor's angle and zoom stay theirs
        const follow = (x: number, z: number, k: number) => {
          const dx = (x - orbit.target.x) * k;
          const dz = (z - orbit.target.z) * k;
          orbit.target.x += dx;
          orbit.target.z += dz;
          camera.position.x += dx;
          camera.position.z += dz;
        };
        let slide = 0;
        let grip = 0;
        let lift = 0;
        let hold = 0;
        let carried = false;
        let binCell: 'A' | 'B' = 'A';
        let legBin: 'A' | 'B' = 'A';
        let last = 0;
        const toU = (v: number) => (legBin === 'A' ? 1 - v : v);
        let px = pointAt(toU(0)).x;
        let pz = pointAt(toU(0)).z;

        const animate = (now: number) => {
          raf = requestAnimationFrame(animate);
          if (!seen.on) {
            last = 0; // and the first frame back starts afresh, with no leap
            return;
          }
          if (!last) last = now;
          const dt = Math.min((now - last) / 1000, 0.1);
          last = now;

          // in or out of drive mode, the cycle starts over: parked on B, the bin on A
          if (driveRef.current !== wasDriving) {
            wasDriving = driveRef.current;
            slide = grip = lift = hold = 0;
            carried = false;
            binCell = legBin = 'A';
            px = pz = PITCH;
            dvRef.current = wasDriving ? startDrive(rig, [1, 1], [0, 0]) : null;
            if (!wasDriving) follow(PITCH / 2, PITCH / 2, 1);
            msgRef.current.text = null;
            setMsg(null);
          }
          const dv = dvRef.current;
          if (dv) {
            const pad = padRef.current;
            const key = pad.held[pad.held.length - 1] ?? pad.tap;
            pad.tap = null;
            const fx = orbit.target.x - camera.position.x;
            const fz = orbit.target.z - camera.position.z;
            const why = stepDrive(dv, key ? toGrid(key, fx, fz) : null, dt * TEMPO);
            if (why) say(why);
            else if (msgRef.current.text && now > msgRef.current.until) {
              msgRef.current.text = null;
              setMsg(null);
            }
            const x = dv.x * PITCH;
            const z = dv.z * PITCH;
            robot.group.position.set(x, 0, z);
            robot.roll(x - px, z - pz);
            px = x;
            pz = z;
            robot.setLift(dv.lift);
            robot.setGrip(dv.grip);
            const deckTop = DECK_REST + liftPose(dv.lift).rise;
            if (dv.carried) bin.position.set(x, deckTop, z);
            else bin.position.set(dv.bx * PITCH, CRADLE_H, dv.bz * PITCH);
            robot.setXray(xrayRef.current);
            if (dv.liftTo !== shown.lift || dv.gripTo !== shown.grip) {
              shown = { lift: dv.liftTo, grip: dv.gripTo };
              setPose(shown);
            }
            follow(x, z, Math.min(1, dt * 4));
            orbit.update();
            webgl.render(scene, camera);
            return;
          }

          const idx = stageRef.current;
          const s = STAGES[idx] ?? STAGES[0];
          if (idx === 0 && legBin !== binCell) {
            legBin = binCell;
            slide = 1 - slide;
          }
          const ease = (v: number, target: number, rate: number) =>
            v + (target - v) * Math.min(1, dt * rate * TEMPO);
          slide = ease(slide, s.slide, 0.9);
          grip = ease(grip, s.grip, 1.6);
          lift = ease(lift, s.lift, 1.5);

          const pt = pointAt(Math.min(1, Math.max(0, toU(slide))));
          robot.group.position.set(pt.x, 0, pt.z);
          robot.roll(pt.x - px, pt.z - pz); // per-wheel mecanum spin from the real delta
          px = pt.x;
          pz = pt.z;
          robot.setLift(lift);
          robot.setGrip(grip);

          // the handoff matches the fleet: the bin moves onto the deck only when the
          // tabs are spread and the deck reaches it, and it lands only when spread
          // again with the deck back below the arms — on whichever cradle it is over
          const cell = cellAt(pt);
          const deckTop = DECK_REST + liftPose(lift).rise;
          if (!carried && cell === binCell && grip > 0.9 && deckTop >= ATTACH_Y) carried = true;
          if (carried && cell && grip > 0.9 && deckTop < ATTACH_Y) {
            carried = false;
            binCell = cell;
          }
          if (carried) bin.position.set(pt.x, deckTop, pt.z);
          else bin.position.set(CELL[binCell].x, CRADLE_H, CELL[binCell].z);

          robot.setXray(xrayRef.current);

          // advance once the pose has settled: round the cycle when playing, otherwise
          // one step at a time toward the clicked goal
          const settled =
            Math.abs(slide - s.slide) < 0.02 &&
            Math.abs(grip - s.grip) < 0.02 &&
            Math.abs(lift - s.lift) < 0.02;
          hold = settled ? hold + dt : 0;
          if (playRef.current) {
            if (hold > 2.0) {
              hold = 0;
              const next = (idx + 1) % STAGES.length;
              setStage(next);
              setGoal(next);
            }
          } else if (goalRef.current !== idx && hold > 0.5) {
            hold = 0;
            setStage(idx + Math.sign(goalRef.current - idx));
          }

          orbit.update();
          webgl.render(scene, camera);
        };
        raf = requestAnimationFrame(animate);
        setStatus('ready');
      } catch (e) {
        console.error('AsrsRobotViewer:', e);
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
  }, [active]);

  const s = STAGES[stage];
  const deckTabs = (p: { lift: number; grip: number }) =>
    `deck ${(p.lift * 100).toFixed(0).padStart(3)}%   tabs ${(p.grip * 100).toFixed(0).padStart(3)}%`;

  return (
    <figure className="story-figure model-viewer" id="robot-3d">
      {!active ? (
        <button type="button" className="model-poster" onClick={() => setActive(true)}>
          <img
            src={`${MEDIA}/r-4.jpg`}
            alt={t("CAD render of the ASRS robot with its deck raised on the lifting cross and the four tabs run out.")}
            width={1300}
            height={700}
            loading="lazy"
          />
          <span className="model-cta">Open the mechanism in 3D</span>
        </button>
      ) : (
        <div className="asrs-frame">
          <div
            className="model-mount asrs-mount"
            ref={mountRef}
            tabIndex={-1}
            role="application"
            aria-label={t("Interactive 3D model of the ASRS robot running its retrieval cycle. Drag to orbit, scroll to zoom.")}
          >
            <span className="model-status" role="status" aria-live="polite">
              {status === 'loading' && 'loading the model…'}
              {status === 'error' && "3D isn't available in this browser."}
            </span>
            {status === 'ready' && (
              <pre className="asrs-hud" aria-hidden="true">
                {drive
                  ? ['DRIVE', deckTabs(pose), msg ?? (coarse ? '' : 'WASD drive · E spread/grip · F lift')]
                      .filter(Boolean)
                      .join('\n')
                  : `STEP ${String(stage + 1).padStart(2)}/${STAGES.length}  ${s.name.toUpperCase()}\n${deckTabs(s)}`}
              </pre>
            )}
            {status === 'ready' && drive && coarse && (
              // a Game Boy pad over the canvas: hold a direction to keep going, A lifts, B grips
              <div className="asrs-pad" onContextMenu={(e) => e.preventDefault()}>
                <div className="asrs-dpad" role="group" aria-label="Drive">
                  {DPAD.map(([d, glyph]) => (
                    <button
                      key={d}
                      type="button"
                      className={`asrs-dpad-${d}`}
                      aria-label={`Drive ${d}`}
                      onPointerDown={(e) => {
                        press(d);
                        e.currentTarget.setPointerCapture(e.pointerId);
                      }}
                      onPointerUp={() => release(d)}
                      onPointerCancel={() => release(d)}
                      onClick={(e) => {
                        if (e.detail === 0) padRef.current.tap = d; // a screen reader's tap: one cell
                      }}
                    >
                      {glyph}
                    </button>
                  ))}
                </div>
                <div className="asrs-ab">
                  <button type="button" className="asrs-ab-b" aria-label="B: spread or grip" onClick={() => doAct('grip')}>
                    B
                  </button>
                  <button type="button" className="asrs-ab-a" aria-label="A: lift or lower" onClick={() => doAct('lift')}>
                    A
                  </button>
                </div>
              </div>
            )}
          </div>
          {status === 'ready' && (
            <>
              <div className="asrs-steps" role="group" aria-label="Mechanism steps">
                {STAGES.map((st, i) => (
                  <button
                    key={st.name}
                    type="button"
                    className={`asrs-step${drive ? '' : i === stage ? ' asrs-step-on' : i === goal && !playing ? ' asrs-step-goal' : ''}`}
                    onClick={() => {
                      setDrive(false); // a step leaves drive mode and walks there from the start
                      setPlaying(false);
                      setGoal(i);
                    }}
                  >
                    {i + 1}. {st.name}
                  </button>
                ))}
              </div>
              <div className="asrs-controls">
                <button
                  type="button"
                  className="asrs-btn"
                  onClick={() => {
                    setDrive(false); // play leaves drive mode, from the cycle's start
                    setGoal(stage);
                    setPlaying((p) => !p);
                  }}
                >
                  {playing ? '⏸ Pause' : '▶ Play the cycle'}
                </button>
                <button
                  type="button"
                  className={`asrs-btn${xray ? ' asrs-btn-on' : ''}`}
                  onClick={() => setXray((v) => !v)}
                >
                  ⦿ X-ray
                </button>
                <button
                  type="button"
                  className={`asrs-btn${drive ? ' asrs-btn-on' : ''}`}
                  aria-pressed={drive}
                  onClick={toggleDrive}
                >
                  ✥ Drive
                </button>
                <span className="asrs-hint">drag to orbit · ctrl+drag to pan · scroll to zoom</span>
              </div>
              <p className="asrs-note">{t(s.note)}</p>
            </>
          )}
        </div>
      )}
      <figcaption>{t("The full handling cycle. The robot is the Blender model, built to the company's robot description and photographs; the cradle and floor around it are generated geometry. Drive in along the lanes, spread, lift, clamp, carry the bin high to the next cradle and set it down, then back for it. Step through it or let it run; X-ray strips the shell off.")}</figcaption>
    </figure>
  );
}
