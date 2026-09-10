import { useEffect, useRef, useState } from 'react';
import type { Material, Mesh, Object3D, Quaternion, Vector3 } from 'three';

const MEDIA = '/media/civ102-bridge';
const GLB = `${MEDIA}/bridge.glb`;
const SHEET_W = 1.016; // the one matboard sheet, metres
const SHEET_H = 0.813;
// test day, in Bridge-local metres (handout §1.5–1.6): 50 mm support plates at
// 1200 c/c, a 400 N three-car train, and the splice that let go under its lead car
const SUP = [0.028, 1.228];
const SPLICE = 1.016;
const FLAP_X = 0.936;
const DECK_TOP = 0.08004;
const AXLES = [0, -0.176, -0.34, -0.516, -0.68, -0.856]; // from the lead axle
const AXLE_N = 400 / 6;
const TRAIN_START = -0.15;
const TRAIN_SPEED = 0.15; // m/s
const LEAD_BREAK = SPLICE + 0.088; // lead axle when the lead car sits on the splice
const DROP = 0.07; // how far the splice sags in the break
const FLAP_LIFT = 0.45; // rad

// Explode/assemble studio for the Holy Bridge. Every piece from the assembly
// drawing carries its laid-flat pose in the GLB (`userData.sheet`), so one
// slider lays the box girder back onto the sheet it was cut from. Same lazy
// import, cleanup, resize and dark-mode pattern as ModelViewer; `?3d`
// activates immediately for screenshots.
export function BridgeStudio({ className }: { className?: string }) {
  const [active, setActive] = useState(
    () => typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('3d'),
  );
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [target, setTarget] = useState(0); // explode 0–100
  const [inside, setInside] = useState(false);
  const [playing, setPlaying] = useState(false); // the build run: one piece at a time
  const [testing, setTesting] = useState(false); // test day: the train rolls until the splice lets go
  const [hud, setHud] = useState(''); // test-day readout, written by the loop
  const [count, setCount] = useState(0); // pieces in the loaded model
  const mountRef = useRef<HTMLDivElement>(null);
  const flags = useRef({ target: 0, inside: false, playing: false, testing: false });

  useEffect(() => {
    flags.current = { target, inside, playing, testing };
  }, [target, inside, playing, testing]);

  useEffect(() => {
    if (!active) return;
    mountRef.current?.focus();
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
        const [{ GLTFLoader }, { DRACOLoader }, { OrbitControls }] = await Promise.all([
          import('three/examples/jsm/loaders/GLTFLoader.js'),
          import('three/examples/jsm/loaders/DRACOLoader.js'),
          import('three/examples/jsm/controls/OrbitControls.js'),
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
          45,
          (mount.clientWidth || 560) / (mount.clientHeight || 420),
          0.01,
          100,
        );

        const webgl = new THREE.WebGLRenderer({ antialias: true });
        renderer = webgl;
        webgl.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
        webgl.setSize(mount.clientWidth || 560, mount.clientHeight || 420);
        mount.appendChild(webgl.domElement);
        const onLost = (e: Event) => {
          e.preventDefault();
          setStatus('error');
        };
        webgl.domElement.addEventListener('webglcontextlost', onLost);
        cleanupExtra.push(() => webgl.domElement.removeEventListener('webglcontextlost', onLost));

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

        scene.add(new THREE.HemisphereLight(0xffffff, 0x555555, 2.6));
        const key = new THREE.DirectionalLight(0xffffff, 2.2);
        key.position.set(3, 5, 4);
        scene.add(key);

        const draco = new DRACOLoader();
        draco.setDecoderPath('/draco/');
        cleanupExtra.push(() => draco.dispose());
        const loader = new GLTFLoader();
        loader.setDRACOLoader(draco);
        const gltf = await loader.loadAsync(GLB);
        if (disposed) return;

        const model = gltf.scene;
        scene.add(model);
        cleanupExtra.push(() => {
          scene.traverse((obj) => {
            const mesh = obj as { geometry?: { dispose: () => void }; material?: unknown };
            mesh.geometry?.dispose?.();
            const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
            for (const m of mats) (m as { dispose?: () => void } | undefined)?.dispose?.();
          });
        });

        // Pieces carry rest (node transform) and laid-flat (extras.sheet) poses,
        // both in Bridge-local space — centring the whole model keeps them valid.
        // A piece is the tagged node: two materials (blue face, white core) make
        // GLTFLoader wrap its two primitives in a Group, so look at nodes, not meshes.
        type Piece = { node: Object3D; rest: [Vector3, Quaternion]; flat: [Vector3, Quaternion]; hop: number; start: number; part: string; half: string };
        const pieces: Piece[] = [];
        const seeThrough: Mesh[] = [];
        let sheet: Object3D | undefined;
        const rigTop: Object3D[] = []; // test-day apparatus, hidden until the run
        let train: Object3D | undefined;
        const cars: Object3D[] = [];
        const meshesUnder = (node: Object3D) => {
          const out: Mesh[] = [];
          node.traverse((o) => {
            if ((o as Mesh).isMesh) out.push(o as Mesh);
          });
          return out;
        };
        model.traverse((node: Object3D) => {
          const part = node.userData?.part as string | undefined;
          if (!part) return;
          if (part === 'sheet') {
            sheet = node;
            return;
          }
          if (part === 'rig') {
            if (!node.parent?.userData?.part) rigTop.push(node);
            if (node.name === 'Train') train = node;
            if (node.name.startsWith('Car_')) cars.push(node);
            return;
          }
          const s = node.userData.sheet as number[] | undefined;
          if (!s || s.length !== 7) return;
          const flat: [Vector3, Quaternion] = [
            new THREE.Vector3(s[0], s[1], s[2]),
            new THREE.Quaternion(s[3], s[4], s[5], s[6]),
          ];
          pieces.push({
            node,
            rest: [node.position.clone(), node.quaternion.clone()],
            flat,
            hop: 0.04 + 0.05 * node.position.distanceTo(flat[0]),
            start: 0,
            part,
            half: String(node.userData.half ?? 'A'),
          });
          seeThrough.push(...meshesUnder(node));
        });
        if (!pieces.length || !sheet || !train) throw new Error('bridge.glb has no pieces');
        setCount(pieces.length);
        const trainNode: Object3D = train;
        for (const n of rigTop) n.visible = false;
        const carRest = cars.map((c) => c.position.x);
        // build run: like bricks — one piece at a time, each owning its own slice
        // of the travel, in build order (soffit first, top sheet last), ~0.5 s each
        const ORDER = ['soffit', 'web', 'diaphragm', 'patch', 'tab', 'layer', 'top'];
        pieces.sort((a, b) => ORDER.indexOf(a.part) - ORDER.indexOf(b.part) || a.node.name.localeCompare(b.node.name));
        const SPAN = 1 / pieces.length;
        const SPEED = 100 / (pieces.length * 0.5); // slider units per second while playing
        pieces.forEach((p, i) => (p.start = i * SPAN));
        const sheetNode: Object3D = sheet;

        const box = new THREE.Box3();
        for (const p of pieces) box.expandByObject(p.node);
        const size = box.getSize(new THREE.Vector3());
        model.position.sub(box.getCenter(new THREE.Vector3()));
        model.updateMatrixWorld(true);
        const sheetCentre = new THREE.Box3().setFromObject(sheetNode).getCenter(new THREE.Vector3());

        // the sheet fades in as the pieces settle on it — on its own material
        // copies, since the loader shares Board_Blue/Board_White with the pieces
        const sheetMats: Material[] = [];
        for (const m of meshesUnder(sheetNode)) {
          m.renderOrder = -1; // always under the ghosted pieces, whatever the sort says
          m.material = Array.isArray(m.material) ? m.material.map((x) => x.clone()) : m.material.clone();
          sheetMats.push(...(Array.isArray(m.material) ? m.material : [m.material]));
        }
        for (const m of sheetMats) {
          m.transparent = true;
          m.depthWrite = false;
        }
        cleanupExtra.push(() => sheetMats.forEach((m) => m.dispose()));

        // X-ray: ghost every piece to the same opacity (clone once per mesh); independent of the build run
        const ghosts = new Map<Mesh, { solid: Material | Material[]; ghost: Material | Material[] }>();
        const cloneGhost = (m: Material) => {
          const g = m.clone();
          g.transparent = true;
          g.opacity = 0.3;
          g.depthWrite = false;
          return g;
        };
        for (const mesh of seeThrough) {
          const solid = mesh.material;
          const ghost = Array.isArray(solid) ? solid.map(cloneGhost) : cloneGhost(solid);
          ghosts.set(mesh, { solid, ghost });
        }
        cleanupExtra.push(() => {
          for (const { ghost } of ghosts.values())
            for (const m of Array.isArray(ghost) ? ghost : [ghost]) m.dispose();
        });
        let ghosted = false;

        // camera: fit the assembled bbox, pull back to fit the sheet as it lays flat
        const fov = (camera.fov * Math.PI) / 180;
        const fit = (maxDim: number) =>
          (maxDim / (2 * Math.tan(fov / 2)) / Math.min(1, camera.aspect)) * 1.15;
        const dAssembled = () => fit(Math.max(size.x, size.y, size.z));
        const dFlat = () => fit(Math.max(SHEET_W, SHEET_H));
        camera.position.set(0.75, 0.45, 1.05).normalize().multiplyScalar(dAssembled());

        const orbit = new OrbitControls(camera, webgl.domElement);
        controls = orbit;
        orbit.enableDamping = true;
        orbit.minDistance = dAssembled() * 0.2;
        orbit.maxDistance = dFlat() * 4;

        const reduced =
          typeof window.matchMedia === 'function' &&
          window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        const smooth = (v: number, a: number, b: number) => {
          const t = Math.min(1, Math.max(0, (v - a) / (b - a)));
          return t * t * (3 - 2 * t);
        };

        const up = new THREE.Vector3(0, 1, 0);
        const dir = new THREE.Vector3();
        let e = 0; // damped explode, 0–100
        let play: { dir: -1 | 1; e: number } | null = null; // one run from where the slider is
        let test: { x: number; t: number; hud: string } | null = null; // test day: lead-axle x, break progress
        const zAxis = new THREE.Vector3(0, 0, 1);
        const hingeQ = new THREE.Quaternion();
        const pivot = new THREE.Vector3();
        const tmp = new THREE.Vector3();
        // rotate a piece about a hinge line parallel to Z through (px, py), from its rest pose
        const hinge = (p: Piece, px: number, py: number, th: number) => {
          hingeQ.setFromAxisAngle(zAxis, th);
          pivot.set(px, py, 0);
          p.node.position.copy(tmp.copy(p.rest[0]).sub(pivot).applyQuaternion(hingeQ).add(pivot));
          p.node.quaternion.copy(hingeQ).multiply(p.rest[1]);
        };
        // deck drop under a point once the splice has let go
        const sag = (x: number, thA: number, thB: number) =>
          x <= SUP[0] || x >= SUP[1] ? 0 : x < SPLICE ? (x - SUP[0]) * Math.tan(thA) : -(SUP[1] - x) * Math.tan(thB);
        // the explode re-frames the view by nudging the orbit, never by overwriting
        // it, so the visitor's own wheel zoom and drag survive every frame
        let prevFit = dAssembled();
        const prevTarget = new THREE.Vector3();
        const targetNow = new THREE.Vector3();
        let last = 0;
        const animate = (now: number) => {
          raf = requestAnimationFrame(animate);
          if (!last) last = now;
          const dt = Math.min((now - last) / 1000, 0.1);
          last = now;
          const f = flags.current;
          // the build run drives e itself, one piece after another: from the flat
          // side it assembles down to 0, from the assembled side it takes apart to 100
          if (f.testing) {
            // test day drives everything: assembled bridge, rig on, train rolling
            if (!test) {
              test = { x: TRAIN_START, t: 0, hud: '' };
              play = null;
              for (const n of rigTop) n.visible = true;
              if (f.target !== 0) setTarget(0);
            }
            if (test.x < LEAD_BREAK) test.x = Math.min(LEAD_BREAK, test.x + dt * TRAIN_SPEED);
            else test.t = Math.min(1, test.t + dt / 1.4);
            e = 0;
          } else if (test) {
            test = null;
            for (const n of rigTop) n.visible = false;
          }
          if (f.playing && !test) {
            if (!play) play = { dir: e >= 50 ? -1 : 1, e };
            play.e = Math.min(100, Math.max(0, play.e + play.dir * dt * SPEED));
            if (play.e === 0 || play.e === 100) setPlaying(false);
            e = play.e;
            setTarget(Math.round(e)); // the slider follows the run
          } else if (!test) {
            play = null;
            e = reduced ? f.target : e + (f.target - e) * Math.min(1, dt * 4);
          }
          const s = e / 100;

          for (const p of pieces) {
            const si = play ? Math.min(1, Math.max(0, (s - p.start) / SPAN)) : s;
            p.node.position.lerpVectors(p.rest[0], p.flat[0], si).addScaledVector(up, Math.sin(Math.PI * si) * p.hop);
            p.node.quaternion.slerpQuaternions(p.rest[1], p.flat[1], si);
          }
          if (test) {
            const k = test.t * test.t * (3 - 2 * test.t);
            const thA = -Math.asin((DROP * k) / (SPLICE - SUP[0]));
            const thB = Math.asin((DROP * k) / (SUP[1] - SPLICE));
            if (k > 0)
              for (const p of pieces) {
                if (p.node.name === 'Top_Flap') hinge(p, FLAP_X, DECK_TOP, FLAP_LIFT * k);
                else if (p.half === 'A') hinge(p, SUP[0], 0, thA);
                else hinge(p, SUP[1], 0, thB);
              }
            trainNode.position.x = test.x;
            cars.forEach((car, i) => {
              const x1 = test!.x + carRest[i] - 0.088;
              const x2 = x1 + 0.176;
              const y1 = sag(x1, thA, thB);
              const y2 = sag(x2, thA, thB);
              car.position.y = (y1 + y2) / 2;
              car.rotation.z = Math.atan2(y2 - y1, 0.176);
            });
            const onSpan = AXLES.filter((a) => test!.x + a > SUP[0] && test!.x + a < SUP[1]).length * AXLE_N;
            const text =
              test.t > 0
                ? '133 N over the splice — the top sheet folds, the web tears'
                : `load case 1 · 400 N train · ${Math.round(onSpan)} N on the span`;
            if (text !== test.hud) setHud((test.hud = text));
          }
          const sheetOpacity = smooth(s, 0.9, 1); // only once the pieces are settling
          for (const m of sheetMats) m.opacity = sheetOpacity;
          sheetNode.visible = sheetOpacity >= 0.02;

          if (f.inside !== ghosted) {
            ghosted = f.inside;
            for (const [mesh, g] of ghosts) mesh.material = ghosted ? g.ghost : g.solid;
          }

          // pull back and re-centre as the sheet spreads, as a delta on the current orbit
          const k = smooth(s, 0.4, 1);
          const fitNow = dAssembled() + (dFlat() - dAssembled()) * k;
          targetNow.copy(sheetCentre).multiplyScalar(k);
          if (fitNow !== prevFit || !targetNow.equals(prevTarget)) {
            dir.subVectors(camera.position, orbit.target);
            const dist = dir.length() * (fitNow / prevFit);
            orbit.target.copy(targetNow);
            camera.position.copy(targetNow).addScaledVector(dir.normalize(), dist);
            prevFit = fitNow;
            prevTarget.copy(targetNow);
          }
          orbit.update();
          webgl.render(scene, camera);
        };
        raf = requestAnimationFrame(animate);
        setStatus('ready');
      } catch (e) {
        console.error('BridgeStudio', e);
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

  return (
    <figure className={`story-figure model-viewer bridge-studio${className ? ` ${className}` : ''}`}>
      {!active ? (
        <button type="button" className="model-poster" onClick={() => setActive(true)}>
          <img
            src={`${MEDIA}/fig-bridge-render.jpg`}
            alt="Render of the assembled Holy Bridge: a blue matboard box girder, blue side out, in soft studio light."
            width={1600}
            height={1000}
            loading="lazy"
          />
          <span className="model-cta">View in 3D</span>
        </button>
      ) : (
        <div className="asrs-frame">
          <div
            className="model-mount asrs-mount"
            ref={mountRef}
            tabIndex={-1}
            role="application"
            aria-label="The box girder, piece by piece. Drag to orbit, scroll to zoom; the slider lays the bridge flat on its sheet."
          >
            <span className="model-status" role="status" aria-live="polite">
              {status === 'loading' && 'loading the model…'}
              {status === 'error' && (
                <>
                  3D isn't available here —{' '}
                  <a href={GLB} download>
                    download the model
                  </a>{' '}
                  instead.
                </>
              )}
            </span>
            {status === 'ready' && (
              <pre className="asrs-hud" aria-hidden="true">
                {testing ? hud : target === 100 ? `${count} pieces · one 1016 × 813 mm sheet` : `explode ${target}%`}
              </pre>
            )}
          </div>
          {status === 'ready' && (
            <div className="asrs-controls">
              <button
                type="button"
                className={`asrs-btn${playing ? ' asrs-btn-on' : ''}`}
                onClick={() => setPlaying((v) => !v)}
                title="One piece at a time: from the sheet to the bridge, or back again"
                disabled={testing}
              >
                {playing ? '■ Stop' : target >= 50 ? '▶ Assemble' : '▶ Take apart'}
              </button>
              <button type="button" className="asrs-btn" onClick={() => setTarget(100)} disabled={testing}>
                Lay flat
              </button>
              <input
                type="range"
                min={0}
                max={100}
                value={target}
                aria-label="Explode"
                onChange={(ev) => setTarget(Number(ev.target.value))}
                disabled={testing}
              />
              <button
                type="button"
                className={`asrs-btn${inside ? ' asrs-btn-on' : ''}`}
                onClick={() => setInside((v) => !v)}
              >
                ⦿ X-ray
              </button>
              <button
                type="button"
                className={`asrs-btn${testing ? ' asrs-btn-on' : ''}`}
                onClick={() => setTesting((v) => !v)}
                title="Test day: the 400 N train rolls until the top-flange splice lets go"
              >
                {testing ? '■ Reset' : '▶ Test day'}
              </button>

              <span className="asrs-hint">drag to orbit · scroll to zoom</span>
            </div>
          )}
        </div>
      )}
      <figcaption>
        The box girder from the engineering assembly, every piece coloured as cut. Slide it flat
        and it lands back on the one sheet; X-ray shows the diaphragms and the splice
        patches — none on the top sheet.
      </figcaption>
    </figure>
  );
}
