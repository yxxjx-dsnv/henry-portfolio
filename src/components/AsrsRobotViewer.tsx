import { useEffect, useRef, useState } from 'react';
import {
  makeKit,
  makeFloor,
  makeRobot,
  makeBin,
  makeCradleField,
  CRADLE_H,
  DECK_REST,
  DECK_LIFT,
} from './asrsScene';
import { PITCH } from './asrsFleet';

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
    note: 'At rest the deck is down and the tabs are pulled in — the whole machine is flat enough to drive underneath a stored bin.',
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
    note: 'The scissor extends. The deck meets the bin\u2019s underside and takes it off its cradle — up to 30 kg on an 8 kg machine.',
    slide: 1,
    grip: 1,
    lift: 1,
  },
  {
    name: 'Lock',
    note: 'The hub turns back: the tabs close in and clamp the bin to the deck. It is now held, not just carried.',
    slide: 1,
    grip: 0,
    lift: 1,
  },
  {
    name: 'Settle',
    note: 'The deck comes back down. Loaded machines always travel with the bin low — under the stored bins above, and stable at speed.',
    slide: 1,
    grip: 0,
    lift: 0,
  },
  {
    name: 'Carry',
    note: 'Out the way it came, load riding low on the deck. In the warehouse this leg ends at the picking station.',
    slide: 0,
    grip: 0,
    lift: 0,
  },
  {
    name: 'Return',
    note: 'And back in — the same lanes, the same corner, the bin still clamped.',
    slide: 1,
    grip: 0,
    lift: 0,
  },
  {
    name: 'Raise',
    note: 'Under the cradle again, the deck lifts the bin up over the arms.',
    slide: 1,
    grip: 0,
    lift: 1,
  },
  {
    name: 'Release',
    note: 'The hub turns: tabs spread clear of the cradle arms, and the bin is free to land.',
    slide: 1,
    grip: 1,
    lift: 1,
  },
  {
    name: 'Set down',
    note: 'The deck lowers through the arms and the cradle catches the bin. The cycle closes: tabs in, drive away, next order.',
    slide: 1,
    grip: 1,
    lift: 0,
  },
];

export function AsrsRobotViewer() {
  const [active, setActive] = useState(
    () => typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('3d'),
  );
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [stage, setStage] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [xray, setXray] = useState(false);
  const mountRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef(0);
  const playRef = useRef(true);
  const xrayRef = useRef(false);

  useEffect(() => {
    stageRef.current = stage;
  }, [stage]);
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
        const [{ OrbitControls }, { RoomEnvironment }, { RoundedBoxGeometry }] =
          await Promise.all([
            import('three/examples/jsm/controls/OrbitControls.js'),
            import('three/examples/jsm/environments/RoomEnvironment.js'),
            import('three/examples/jsm/geometries/RoundedBoxGeometry.js'),
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
        camera.position.set(0.88, 0.5, 0.98);

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
        for (const mesh of makeCradleField(THREE, kit, [[0, 0]])) scene.add(mesh);

        const robot = makeRobot(THREE, kit);
        scene.add(robot.group);
        cleanupExtra.push(() => robot.dispose());
        const bin = makeBin(THREE, kit);
        bin.position.set(0, CRADLE_H, 0);
        scene.add(bin);

        const orbit = new OrbitControls(camera, webgl.domElement);
        controls = orbit;
        orbit.enableDamping = true;
        orbit.target.set(0, 0.22, 0);
        orbit.minDistance = 0.35;
        orbit.maxDistance = 4;
        orbit.maxPolarAngle = Math.PI / 2 - 0.03;

        // The approach path runs the guide lines, exactly like the fleet:
        // down the z-lane at x = 1 cell, a 90° corner, then in along the
        // x-lane — never cutting between the posts.
        const W = [
          { x: 1 * PITCH, z: 1.25 * PITCH },
          { x: 1 * PITCH, z: 0 },
          { x: 0, z: 0 },
        ];
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

        // eased state, chasing the current stage's targets
        const ATTACH_Y = CRADLE_H - 0.004;
        let slide = 0;
        let grip = 0;
        let lift = 0;
        let spin = 0;
        let hold = 0;
        let carried = false;
        let last = 0;
        let px = W[0].x;
        let pz = W[0].z;

        const animate = (now: number) => {
          raf = requestAnimationFrame(animate);
          if (!last) last = now;
          const dt = Math.min((now - last) / 1000, 0.1);
          last = now;

          const s = STAGES[stageRef.current] ?? STAGES[0];
          const ease = (v: number, target: number, rate: number) =>
            v + (target - v) * Math.min(1, dt * rate);
          slide = ease(slide, s.slide, 1.6);
          grip = ease(grip, s.grip, 3);
          lift = ease(lift, s.lift, 3);
          if (Math.abs(s.grip - grip) > 0.002) spin += (s.grip > grip ? 1 : -1) * dt * 2.4;

          const pt = pointAt(Math.min(1, Math.max(0, slide)));
          robot.group.position.set(pt.x, 0, pt.z);
          robot.roll(pt.x - px, pt.z - pz); // per-wheel mecanum spin from the real delta
          px = pt.x;
          pz = pt.z;
          robot.setLift(lift);
          robot.setGrip(grip, spin);

          // the handoff matches the fleet: the bin moves onto the deck only
          // when the tabs are spread and the deck reaches it, and it lands
          // only when spread again with the deck back below the arms
          const atCell = Math.hypot(pt.x, pt.z) < 0.02;
          const deckTop = DECK_REST + lift * (DECK_LIFT - DECK_REST);
          if (!carried && atCell && grip > 0.9 && deckTop >= ATTACH_Y) carried = true;
          if (carried && atCell && grip > 0.9 && deckTop < ATTACH_Y) carried = false;
          if (carried) bin.position.set(pt.x, deckTop, pt.z);
          else bin.position.set(0, CRADLE_H, 0);

          robot.setXray(xrayRef.current);

          // auto-play advances once the pose has settled
          if (playRef.current) {
            const settled =
              Math.abs(slide - s.slide) < 0.02 &&
              Math.abs(grip - s.grip) < 0.02 &&
              Math.abs(lift - s.lift) < 0.02;
            hold = settled ? hold + dt : 0;
            if (hold > 1.7) {
              hold = 0;
              setStage((i) => (i + 1) % STAGES.length);
            }
          }

          orbit.update();
          webgl.render(scene, camera);
        };
        raf = requestAnimationFrame(animate);
        setStatus('ready');
      } catch {
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
              {status === 'loading' && 'building the model…'}
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
                    className={`asrs-step${i === stage ? ' asrs-step-on' : ''}`}
                    onClick={() => {
                      setPlaying(false);
                      setStage(i);
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
                  onClick={() => setPlaying((p) => !p)}
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
                <span className="asrs-hint">drag to orbit · scroll to zoom</span>
              </div>
              <p className="asrs-note">{s.note}</p>
            </>
          )}
        </div>
      )}
      <figcaption>
        The full handling cycle, modelled in three.js from the CAD renders — no mesh files, just
        geometry and materials. Drive in along the lanes, spread, lift, lock, travel low, and set
        the bin back on its cradle. Step through it or let it run; X-ray strips the shell off.
      </figcaption>
    </figure>
  );
}
