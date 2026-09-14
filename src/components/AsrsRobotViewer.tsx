import { useEffect, useRef, useState } from 'react';
import { makeKit, makeFloor, makeBin, makeCradleField, CRADLE_H, DECK_REST } from './asrsScene';
import { loadRobotAsset, makeRobot, liftPose, gripPose } from './asrsRobot';
import { PITCH } from './asrsFleet';

// The bin the viewer handles (asrsScene.makeBin): 555 × 375 body. Locking means the tabs
// close in until they meet its sides — not all the way, which would put them through it.
// One hub drives both pairs, so it stops at the first contact; the other pair sits a few mm off.
const BIN_HALF = { long: 0.555 / 2 + 0.002, short: 0.375 / 2 + 0.002 };
const clampFraction = () => {
  const tips = { long: 0.2288, short: 0.166 }; // tab tips with the hub closed (tools/robot/dims.json)
  const need = (axis: 'long' | 'short') => {
    let lo = 0;
    let hi = 1;
    for (let i = 0; i < 40; i++) {
      const mid = (lo + hi) / 2;
      if (tips[axis] + gripPose(mid).slide[axis] < BIN_HALF[axis]) lo = mid;
      else hi = mid;
    }
    return hi;
  };
  return Math.max(need('long'), need('short'));
};
const CLAMP = clampFraction();
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
    note: 'Between orders the machine runs flat — deck down, tabs in, low enough to pass under stored bins. Here it heads for its next pick.',
    slide: 0,
    grip: 0,
    lift: 0,
  },
  {
    name: 'Drive',
    note: 'It travels the guide lines: down one lane, a 90° corner, into the next — without ever turning. The mecanum rollers, set at 45°, let the same four wheels drive any direction, so watch the near pair counter-rotate on the first leg.',
    slide: 1,
    grip: 0,
    lift: 0,
  },
  {
    name: 'Spread',
    note: 'Stopped on the tile centre, the blue hub turns and its slots run all four tabs outward past the bin\u2019s footprint — one motor, one motion.',
    slide: 1,
    grip: 1,
    lift: 0,
  },
  {
    name: 'Lift',
    note: 'The scissor extends. The deck meets the bin\u2019s underside and takes it clear off its cradle — up to 30 kg on an 8 kg machine.',
    slide: 1,
    grip: 1,
    lift: 1,
  },
  {
    name: 'Lock',
    note: 'The hub turns back until the tabs meet the bin\u2019s sides and clamp it to the deck. It is now held, not just carried.',
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

  useEffect(() => {
    stageRef.current = stage;
  }, [stage]);
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
        const [{ OrbitControls }, { RoomEnvironment }, { RoundedBoxGeometry }, asset] =
          await Promise.all([
            import('three/examples/jsm/controls/OrbitControls.js'),
            import('three/examples/jsm/environments/RoomEnvironment.js'),
            import('three/examples/jsm/geometries/RoundedBoxGeometry.js'),
            loadRobotAsset(),
          ]);
        const mount = mountRef.current;
        if (!mount || disposed) return;

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

        const kit = makeKit(THREE, RoundedBoxGeometry);
        cleanupExtra.push(() => kit.dispose());
        scene.add(makeFloor(THREE, kit, 7));
        // two cradles a lane apart: the storage cell and, diagonally, the station it delivers to
        for (const mesh of makeCradleField(THREE, kit, [[0, 0], [1, 1]])) scene.add(mesh);

        const robot = makeRobot(asset);
        scene.add(robot.group);
        cleanupExtra.push(() => robot.dispose());
        const bin = makeBin(THREE, kit);
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
          if (!last) last = now;
          const dt = Math.min((now - last) / 1000, 0.1);
          last = now;

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

  return (
    <figure className="story-figure model-viewer" id="robot-3d">
      {!active ? (
        <button type="button" className="model-poster" onClick={() => setActive(true)}>
          <img
            src={`${MEDIA}/r-4.jpg`}
            alt="CAD render of the ASRS robot with its deck raised on the lifting cross and the four tabs run out."
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
            aria-label="Interactive 3D model of the ASRS robot running its retrieval cycle. Drag to orbit, scroll to zoom."
          >
            <span className="model-status" role="status" aria-live="polite">
              {status === 'loading' && 'loading the model…'}
              {status === 'error' && "3D isn't available in this browser."}
            </span>
            {status === 'ready' && (
              <pre className="asrs-hud" aria-hidden="true">
                {`STEP ${String(stage + 1).padStart(2)}/${STAGES.length}  ${s.name.toUpperCase()}\n`}
                {`deck ${(s.lift * 100).toFixed(0).padStart(3)}%   tabs ${(s.grip * 100)
                  .toFixed(0)
                  .padStart(3)}%`}
              </pre>
            )}
          </div>
          {status === 'ready' && (
            <>
              <div className="asrs-steps" role="group" aria-label="Mechanism steps">
                {STAGES.map((st, i) => (
                  <button
                    key={st.name}
                    type="button"
                    className={`asrs-step${i === stage ? ' asrs-step-on' : i === goal && !playing ? ' asrs-step-goal' : ''}`}
                    onClick={() => {
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
                <span className="asrs-hint">drag to orbit · ctrl+drag to pan · scroll to zoom</span>
              </div>
              <p className="asrs-note">{s.note}</p>
            </>
          )}
        </div>
      )}
      <figcaption>
        The full handling cycle. The robot is the Blender model, built to the company's robot
        description and photographs; the cradle and floor around it are generated geometry. Drive
        in along the lanes, spread, lift, clamp, carry the bin high to the next cradle and set it
        down — then back for it. Step through it or let it run; X-ray strips the shell off.
      </figcaption>
    </figure>
  );
}
