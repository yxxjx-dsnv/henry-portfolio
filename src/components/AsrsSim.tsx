import { useEffect, useRef, useState } from 'react';
import {
  makeKit,
  makeFloor,
  makeBin,
  makeCradleField,
  makeDeck,
  makeBackBlock,
  makeElevator,
  makeKiosk,
  CRADLE_H,
  DECK_REST,
} from './asrsScene';
import { loadRobotAsset, makeRobot, liftPose, liftFraction, type Robot } from './asrsRobot';
import { Fleet, PITCH, LEVEL_H, PHASE_LABEL, cellPos, type FleetOpts } from './asrsFleet';

const MEDIA = '/media/incheon-robotics';

// A working miniature of the Incheon ASRS. The fleet state machine lives in
// asrsFleet.ts (and is unit-tested there); this file is only the picture of it:
// build the world once, then copy fleet state onto meshes every frame.

// the lift fraction at which the deck top reaches a cradled bin's underside
const ATTACH = liftFraction(CRADLE_H - DECK_REST);

const OPTS: FleetOpts = {
  cols: 6,
  rows: [1, 2, 3],
  levels: 3,
  stations: [
    [1, -1],
    [3, -1],
  ],
  robotStart: [0, 2, 4],
  elevator: [5, 0],
  fillEvery: 3,
};

type Snapshot = {
  t: number;
  lines: Array<{ id: number; text: string }>;
  queue: number;
  done: number;
  avg: number | null;
  running: boolean;
  speed: number;
  focus: number | null;
  xray: boolean;
};

const fmtT = (t: number) => {
  const m = Math.floor(t / 60);
  const s = (t - m * 60).toFixed(1).padStart(4, '0');
  return `${String(m).padStart(2, '0')}:${s}`;
};

export function AsrsSim() {
  const [active, setActive] = useState(
    () => typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('3d'),
  );
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [snap, setSnap] = useState<Snapshot | null>(null);
  const mountRef = useRef<HTMLDivElement>(null);
  const fleetRef = useRef<Fleet | null>(null);
  const runRef = useRef(true);
  const speedRef = useRef(1);
  const focusRef = useRef<number | null>(null);
  const xrayRef = useRef(false);

  useEffect(() => {
    if (!active) return;
    let disposed = false;
    let raf = 0;
    const cleanupExtra: (() => void)[] = [];
    let renderer:
      | { dispose: () => void; forceContextLoss: () => void; domElement: HTMLCanvasElement }
      | undefined;
    let controls: { dispose: () => void; target: { set: (x: number, y: number, z: number) => void } } | undefined;

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
          const bg = new THREE.Color(dark() ? 0x121316 : 0xd2d5d9);
          scene.background = bg;
          scene.fog = new THREE.Fog(bg, 12, 30);
        };
        setBg();

        const webgl = new THREE.WebGLRenderer({ antialias: true });
        renderer = webgl;
        webgl.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
        webgl.setSize(mount.clientWidth || 640, mount.clientHeight || 460);
        webgl.shadowMap.enabled = true;
        webgl.shadowMap.type = THREE.PCFSoftShadowMap;
        webgl.toneMapping = THREE.ACESFilmicToneMapping;
        webgl.toneMappingExposure = 1.05;
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
          40,
          (mount.clientWidth || 640) / (mount.clientHeight || 460),
          0.01,
          90,
        );

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
        const key = new THREE.DirectionalLight(0xffffff, 2.1);
        key.position.set(4, 8, 6);
        key.castShadow = true;
        key.shadow.mapSize.set(2048, 2048);
        key.shadow.camera.left = key.shadow.camera.bottom = -6;
        key.shadow.camera.right = key.shadow.camera.top = 6;
        key.shadow.bias = -0.0012;
        scene.add(key);
        const fill = new THREE.DirectionalLight(0xdfe6ff, 0.5);
        fill.position.set(-5, 3, -4);
        scene.add(fill);

        // ── the world ──
        const kit = makeKit(THREE, RoundedBoxGeometry);
        cleanupExtra.push(() => kit.dispose());
        const world = new THREE.Group();
        world.position.set(-(OPTS.cols - 1) * PITCH * 0.5, 0, -1.15 * PITCH);
        scene.add(world);
        world.add(makeFloor(THREE, kit, 26));

        const fleet = new Fleet({ ...OPTS, attachAt: ATTACH });
        fleetRef.current = fleet;

        // storage cradles + the tile deck each upper level drives on
        const flat: Array<[number, number]> = [];
        for (const r of OPTS.rows) for (let c = 0; c < OPTS.cols; c++) flat.push([c, r]);
        const aisle: Array<[number, number]> = [];
        for (let c = 0; c < OPTS.cols; c++) aisle.push([c, 0]);
        for (let lv = 0; lv <= OPTS.levels; lv++) {
          const y = lv * LEVEL_H;
          for (const mesh of makeCradleField(THREE, kit, flat, y)) world.add(mesh);
          if (lv > 0) world.add(makeDeck(THREE, kit, [...flat, ...aisle], y));
        }

        const binMeshes = new Map<number, ReturnType<typeof makeBin>>();
        for (const b of fleet.bins) {
          const grp = makeBin(THREE, kit, b.id % 7 === 3);
          world.add(grp);
          binMeshes.set(b.id, grp);
        }

        const views: Robot[] = fleet.robots.map(() => {
          const api = makeRobot(asset);
          world.add(api.group);
          cleanupExtra.push(() => api.dispose());
          return api;
        });

        // the focused robot's planned route, drawn on its deck
        const pathGeo = new THREE.BufferGeometry();
        const pathPos = new Float32Array(128 * 3);
        pathGeo.setAttribute('position', new THREE.BufferAttribute(pathPos, 3));
        const pathLine = new THREE.Line(
          pathGeo,
          new THREE.LineBasicMaterial({ color: 0x2f7bff, transparent: true, opacity: 0.9 }),
        );
        pathLine.frustumCulled = false;
        pathLine.visible = false;
        world.add(pathLine);
        cleanupExtra.push(() => {
          pathGeo.dispose();
          pathLine.material.dispose();
        });

        for (const o of makeBackBlock(THREE, kit, 11, 2, 4, { x: -2.2 * PITCH, z: 5.1 * PITCH }))
          world.add(o);

        const elevator = makeElevator(THREE, kit, OPTS.levels * LEVEL_H + 0.45);
        const hoistY = elevator.hoistY;
        elevator.group.position.set(OPTS.elevator[0] * PITCH, 0, OPTS.elevator[1] * PITCH);
        world.add(elevator.group);

        const kiosk = makeKiosk(THREE, kit);
        kiosk.position.set(-1.35 * PITCH, 0, -1.05 * PITCH);
        kiosk.rotation.y = Math.PI; // screen toward the viewer, as you walk up to it
        world.add(kiosk);

        // a soft highlight ring that follows the focused robot
        const ring = new THREE.Mesh(
          new THREE.RingGeometry(0.3, 0.345, 48),
          new THREE.MeshBasicMaterial({
            color: 0x2f7bff,
            transparent: true,
            opacity: 0.85,
            side: THREE.DoubleSide,
          }),
        );
        ring.rotation.x = -Math.PI / 2;
        ring.visible = false;
        world.add(ring);
        cleanupExtra.push(() => {
          ring.geometry.dispose();
          (ring.material as { dispose: () => void }).dispose();
        });

        const reduced =
          typeof window.matchMedia === 'function' &&
          window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        runRef.current = !reduced;

        // ── camera: looking at the front of the rack from above, kiosk in view
        const home = new THREE.Vector3(0.2, 3.7, 6.1);
        const homeTarget = new THREE.Vector3(0, 0.7, 0.1);
        camera.position.copy(home);
        const orbit = new OrbitControls(camera, webgl.domElement);
        controls = orbit;
        orbit.enableDamping = true;
        orbit.target.copy(homeTarget);
        orbit.minDistance = 0.8;
        orbit.maxDistance = 18;
        orbit.maxPolarAngle = Math.PI / 2 - 0.03;

        // ── per-frame: advance the fleet, copy it onto the meshes ──
        const prevPos = fleet.robots.map((r) => ({ ...r.pos }));
        // x-ray ghosts the warehouse itself, so the robots stay the subject
        const envMats = [
          kit.mats.binBlue,
          kit.mats.binBlueIn,
          kit.mats.binBlack,
          kit.mats.binBlackIn,
          kit.mats.slab,
          kit.mats.post,
          kit.mats.cradle,
          kit.mats.frame,
          kit.mats.flange,
        ];
        let lastXray = false;
        const applyXray = (on: boolean) => {
          for (const m of envMats) {
            m.transparent = on;
            m.opacity = on ? 0.16 : 1;
            m.depthWrite = !on;
            m.needsUpdate = true;
          }
          views.forEach((v) => v.setXray(on));
        };
        const sync = (dt: number) => {
          const focus = focusRef.current;
          if (xrayRef.current !== lastXray) {
            lastXray = xrayRef.current;
            applyXray(lastXray);
          }
          fleet.robots.forEach((r, i) => {
            const v = views[i];
            v.group.position.set(r.pos.x, r.pos.y, r.pos.z);
            v.setLift(r.lift);
            v.setGrip(r.grip);
            v.roll(r.pos.x - prevPos[i].x, r.pos.z - prevPos[i].z);
            prevPos[i] = { ...r.pos };
          });
          for (const b of fleet.bins) {
            const mesh = binMeshes.get(b.id);
            if (!mesh) continue;
            if (b.cell) {
              const p = cellPos(b.cell);
              mesh.position.set(p.x, p.y + CRADLE_H, p.z);
            } else if (b.carriedBy !== null) {
              const r = fleet.robots[b.carriedBy];
              const deckTop = DECK_REST + liftPose(r.lift).rise;
              mesh.position.set(r.pos.x, r.pos.y + deckTop, r.pos.z);
            }
          }
          const carY = fleet.elevLevel * LEVEL_H - 0.008;
          elevator.carriage.position.y = carY;
          const cableTop = hoistY - 0.06;
          const cableLen = Math.max(0.02, cableTop - (carY + 0.03));
          elevator.cable.scale.y = cableLen;
          elevator.cable.position.y = carY + 0.03 + cableLen / 2;

          if (focus !== null) {
            const r = fleet.robots[focus];
            ring.visible = true;
            ring.position.set(r.pos.x, r.pos.y + 0.004, r.pos.z);
            // the planned route, drawn a hand above the level it runs on
            const pts = [{ x: r.pos.x, y: r.pos.y, z: r.pos.z }, ...r.path.map((c) => cellPos(c))];
            const n = Math.min(pts.length, 128);
            for (let i = 0; i < n; i++) {
              pathPos[i * 3] = pts[i].x;
              pathPos[i * 3 + 1] = pts[i].y + 0.03;
              pathPos[i * 3 + 2] = pts[i].z;
            }
            pathGeo.setDrawRange(0, n);
            pathGeo.attributes.position.needsUpdate = true;
            pathLine.visible = n > 1;
            const t = world.position.clone().add(new THREE.Vector3(r.pos.x, r.pos.y + 0.2, r.pos.z));
            orbit.target.lerp(t, Math.min(1, dt * 3));
          } else {
            ring.visible = false;
            pathLine.visible = false;
            // no drift back home: the view stays where the visitor panned it (ctrl+drag)
          }
        };
        sync(0);

        let last = 0;
        let hudAt = 0;
        const animate = (now: number) => {
          raf = requestAnimationFrame(animate);
          if (!last) last = now;
          const dt = Math.min((now - last) / 1000, 0.1);
          last = now;
          if (runRef.current) fleet.step(dt * speedRef.current);
          sync(dt);
          orbit.update();
          webgl.render(scene, camera);
          if (now - hudAt > 180) {
            hudAt = now;
            setSnap({
              t: fleet.t,
              queue: fleet.queue.length,
              done: fleet.done,
              avg: fleet.avgCycle(),
              running: runRef.current,
              speed: speedRef.current,
              focus: focusRef.current,
              xray: xrayRef.current,
              lines: fleet.robots.map((r) => ({
                id: r.id,
                text: `R0${r.id + 1}  ${PHASE_LABEL[r.phase].padEnd(13)} c${r.cell[0]},${
                  r.cell[1]
                } L${r.cell[2]}  deck ${(r.lift * 100).toFixed(0).padStart(3)}%  grip ${(
                  r.grip * 100
                )
                  .toFixed(0)
                  .padStart(3)}%`,
              })),
            });
          }
        };
        raf = requestAnimationFrame(animate);
        setStatus('ready');
      } catch (e) {
        console.error('AsrsSim:', e);
        if (!disposed) setStatus('error');
      }
    })();

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      for (const fn of cleanupExtra) fn();
      controls?.dispose();
      fleetRef.current = null;
      if (renderer) {
        renderer.domElement.parentNode?.removeChild(renderer.domElement);
        renderer.forceContextLoss();
        renderer.dispose();
      }
    };
  }, [active]);

  const cycleFocus = () => {
    const n = OPTS.robotStart.length;
    focusRef.current = focusRef.current === null ? 0 : focusRef.current + 1 >= n ? null : focusRef.current + 1;
    setSnap((s) => (s ? { ...s, focus: focusRef.current } : s));
  };

  return (
    <figure className="story-figure model-viewer" id="sim">
      {!active ? (
        <button type="button" className="model-poster" onClick={() => setActive(true)}>
          <img
            src={`${MEDIA}/tower.jpg`}
            alt="Render of the full-scale ASRS: a dense block of blue bins on white posts, elevators at the corners, a kiosk at the front."
            width={1600}
            height={991}
            loading="lazy"
          />
          <span className="model-cta">Run the simulation</span>
        </button>
      ) : (
        <div className="asrs-frame">
          <div
            className="model-mount asrs-mount asrs-mount-tall"
            ref={mountRef}
            tabIndex={-1}
            role="application"
            aria-label="Live 3D simulation of the ASRS: robots fetching bins from two storage levels, riding the elevator, and presenting them at the picking station. Drag to orbit, scroll to zoom."
          >
            <span className="model-status" role="status" aria-live="polite">
              {status === 'loading' && 'building the warehouse…'}
              {status === 'error' && "3D isn't available in this browser."}
            </span>
            {status === 'ready' && snap && (
              <pre className="asrs-hud" aria-hidden="true">
                {`INCHEON ASRS · LIVE SIM        t ${fmtT(snap.t)}\n`}
                {snap.lines.map((l) => (
                  <span key={l.id} className={snap.focus === l.id ? 'asrs-hud-focus' : undefined}>
                    {l.text}
                    {'\n'}
                  </span>
                ))}
                {`queue ${snap.queue} · retrieved ${snap.done} · avg cycle ${
                  snap.avg ? snap.avg.toFixed(1) + ' s' : '—'
                }`}
              </pre>
            )}
          </div>
          {status === 'ready' && (
            <div className="asrs-controls">
              <button
                type="button"
                className="asrs-btn"
                onClick={() => {
                  runRef.current = !runRef.current;
                  setSnap((s) => (s ? { ...s, running: runRef.current } : s));
                }}
              >
                {snap?.running ? '⏸ Pause' : '▶ Run'}
              </button>
              <button type="button" className="asrs-btn" onClick={() => fleetRef.current?.request()}>
                Request a bin
              </button>
              <button
                type="button"
                className="asrs-btn"
                onClick={() => {
                  speedRef.current = speedRef.current === 1 ? 2 : 1;
                  setSnap((s) => (s ? { ...s, speed: speedRef.current } : s));
                }}
              >
                {snap?.speed === 2 ? '2×' : '1×'}
              </button>
              <button
                type="button"
                className={`asrs-btn${snap?.focus !== null && snap?.focus !== undefined ? ' asrs-btn-on' : ''}`}
                onClick={cycleFocus}
              >
                {snap?.focus === null || snap?.focus === undefined
                  ? '⦿ Track a robot'
                  : `⦿ Tracking R0${snap.focus + 1}`}
              </button>
              <button
                type="button"
                className={`asrs-btn${snap?.xray ? ' asrs-btn-on' : ''}`}
                onClick={() => {
                  xrayRef.current = !xrayRef.current;
                  setSnap((s) => (s ? { ...s, xray: xrayRef.current } : s));
                }}
              >
                ⊘ X-ray
              </button>
              <span className="asrs-hint">drag to orbit · ctrl+drag to pan · scroll to zoom</span>
            </div>
          )}
        </div>
      )}
      <figcaption>
        The whole system, running: three robots working three storage levels, riding the elevator
        between decks, and always travelling with the load carried low. Routing is A* around
        whatever squares the other robots hold, so paths never cross. Track follows one robot;
        X-ray ghosts the warehouse so you can watch the machines work through it.
      </figcaption>
    </figure>
  );
}
