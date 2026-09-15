import { useEffect, useRef, useState } from 'react';
import type { AnimationAction, AnimationMixer, Material, Mesh, Object3D, Quaternion, Vector3 } from 'three';
import { useLang } from '../i18n';

const MEDIA = '/media/civ102-bridge';
const GLB = `${MEDIA}/bridge.glb`;
const SHEET_W = 1.016; // the one matboard sheet, metres
const SHEET_H = 0.813;
// test day: the GLB carries the whole run as one animation clip, `testday`, keyframed in
// Blender — load case 1 in stages (one car across and back, then two cars until the
// splice lets go), wheels, the halves hinging, the flap, the tethers. The web only plays
// it and reads the cars' positions back for the HUD.
const SUP = [0.028, 1.228]; // support centres, Bridge-local metres (handout §1.5)
const AXLE_N = 400 / 6;
// test-day readout: the loop reports the stage and the load on the span; the JSX words it
type Hud = { stage: 'pass1' | 'held' | 'pass2' | 'broke'; n: number };

// Explode/assemble studio for the Holy Bridge. Every piece from the assembly
// drawing carries its laid-flat pose in the GLB (`userData.sheet`), so one
// slider lays the box girder back onto the sheet it was cut from. Same lazy
// import, cleanup, resize and dark-mode pattern as ModelViewer; `?3d`
// activates immediately for screenshots.
// Two figures share this component: the studio (explode/assemble/X-ray) and the
// test-day run, which starts with the rig on show and only knows Run/Reset/X-ray.
export function BridgeStudio({ className, variant = 'studio' }: { className?: string; variant?: 'studio' | 'testday' }) {
  const testday = variant === 'testday';
  const { t, tx } = useLang();
  const [active, setActive] = useState(
    () => typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('3d'),
  );
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [target, setTarget] = useState(0); // explode 0–100
  const [inside, setInside] = useState(false);
  const [playing, setPlaying] = useState(false); // the build run: one piece at a time
  const [testing, setTesting] = useState(false); // test day: the train rolls until the splice lets go
  const [hud, setHud] = useState<Hud | null>(null); // test-day readout, written by the loop
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
        const [{ GLTFLoader }, { DRACOLoader }, { OrbitControls }, { RoomEnvironment }] = await Promise.all([
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

        scene.add(new THREE.HemisphereLight(0xffffff, 0x555555, 1.3));
        const key = new THREE.DirectionalLight(0xffffff, 2.0);
        key.position.set(3, 5, 4);
        scene.add(key);
        // a room to reflect: the galvanized beam, wheels and rods read as metal instead of soot
        const pmrem = new THREE.PMREMGenerator(webgl);
        const env = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
        pmrem.dispose();
        scene.environment = env;
        scene.environmentIntensity = 0.4;
        cleanupExtra.push(() => env.dispose());

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
        type Piece = { node: Object3D; rest: [Vector3, Quaternion]; flat: [Vector3, Quaternion]; hop: number; start: number; part: string };
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
            if (/^Car_\d$/.test(node.name)) cars.push(node);
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
          });
          for (const m of meshesUnder(node)) {
            if (m.name === 'Decal') m.renderOrder = 1; // always drawn over its (ghosted) web, not by load order
            seeThrough.push(m);
          }
        });
        if (!pieces.length || !sheet || !train || !gltf.animations.length) throw new Error('bridge.glb has no pieces');
        setCount(pieces.length);
        const trainNode: Object3D = train;
        for (const n of rigTop) n.visible = testday;
        const axle = Number(trainNode.userData.axle) || 0.088;
        const tBack = Number(trainNode.userData.t_back);
        const tPass2 = Number(trainNode.userData.t_pass2);
        const tBreak = Number(trainNode.userData.t_break);
        const mixer: AnimationMixer = new THREE.AnimationMixer(model);
        const run: AnimationAction = mixer.clipAction(gltf.animations[0]);
        run.loop = THREE.LoopOnce;
        run.clampWhenFinished = true;
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
        const dAssembled = () => fit(testday ? 1.75 : Math.max(size.x, size.y, size.z)); // frames, bridge and train, benches cropped
        const dFlat = () => fit(Math.max(SHEET_W, SHEET_H));
        if (testday) camera.position.set(0.22, 0.26, 1);
        else camera.position.set(0.75, 0.45, 1.05);
        camera.position.normalize().multiplyScalar(dAssembled());

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
        let test: { hud: string } | null = null; // test day: the clip is playing
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
            // test day: the clip drives everything — assembled bridge, rig on, train rolling, the break
            if (!test) {
              test = { hud: '' };
              play = null;
              for (const n of rigTop) n.visible = true;
              if (f.target !== 0) setTarget(0);
              run.reset().play();
            }
            mixer.update(dt);
            e = 0;
          } else if (test) {
            test = null;
            for (const n of rigTop) n.visible = testday;
            run.reset(); // back to the first frame: train at the start, halves level, tethers slack
            mixer.update(0);
            run.stop();
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

          if (test) {
            // the clip owns the pieces while it plays; the HUD reads the cars back
            const clipT = run.time;
            let onSpan = 0;
            for (const car of cars)
              for (const a of [-axle, axle]) {
                const x = trainNode.position.x + car.position.x + a;
                if (x > SUP[0] && x < SUP[1]) onSpan += AXLE_N;
              }
            const lead = trainNode.position.x + (cars[0]?.position.x ?? 0);
            const stage: Hud['stage'] =
              clipT >= tBreak ? 'broke' : clipT >= tPass2 ? 'pass2' : clipT >= tBack || lead > SUP[1] + axle ? 'held' : 'pass1';
            const n = Math.round(onSpan);
            const key = `${stage}:${n}`;
            if (key !== test.hud) {
              test.hud = key;
              setHud({ stage, n });
            }
          } else {
            for (const p of pieces) {
              const si = play ? Math.min(1, Math.max(0, (s - p.start) / SPAN)) : s;
              p.node.position.lerpVectors(p.rest[0], p.flat[0], si).addScaledVector(up, Math.sin(Math.PI * si) * p.hop);
              p.node.quaternion.slerpQuaternions(p.rest[1], p.flat[1], si);
            }
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

  const hudLine = (h: Hud) =>
    h.stage === 'broke'
      ? t('267 N on the span — the splice lets go · failure load 133 N')
      : h.stage === 'pass2'
        ? tx('pass 2 · two cars, 267 N · {n} N on the span', { n: h.n })
        : h.stage === 'held'
          ? t('pass 1 held · 133 N · the car comes back for pass 2')
          : tx('pass 1 · one car, 133 N · {n} N on the span', { n: h.n });

  return (
    <figure
      className={`story-figure model-viewer bridge-studio${className ? ` ${className}` : ''}`}
      id={testday ? 'bridge-testday' : 'bridge-studio'}
    >
      {!active ? (
        <button type="button" className="model-poster" onClick={() => setActive(true)}>
          <img
            src={`${MEDIA}/${testday ? 'fig-testday-render.jpg' : 'fig-bridge-render.jpg'}`}
            alt={
              testday
                ? t('Rendered model of test day: the blue box girder through two wooden A-frames on the lab bench, resting on plywood stacks under the steel beam, the three-car train part-way across on its tethers.')
                : t('Rendered model of the Holy Bridge: a blue matboard box girder seen from its open end, the white interior and a diaphragm visible inside.')
            }
            width={1600}
            height={1000}
            loading="lazy"
          />
          <span className="model-cta">{testday ? t('Run test day') : t('View in 3D')}</span>
        </button>
      ) : (
        <div className="asrs-frame">
          <div
            className="model-mount asrs-mount"
            ref={mountRef}
            tabIndex={-1}
            role="application"
            aria-label={t('The box girder, piece by piece. Drag to orbit, scroll to zoom; the slider lays the bridge flat on its sheet.')}
          >
            <span className="model-status" role="status" aria-live="polite">
              {status === 'loading' && t('loading the model…')}
              {status === 'error' &&
                tx("3D isn't available here — {link} instead.", {
                  link: (
                    <a href={GLB} download>
                      {t('download the model')}
                    </a>
                  ),
                })}
            </span>
            {status === 'ready' && (
              <pre className="asrs-hud" aria-hidden="true">
                {testing
                  ? hud && hudLine(hud)
                  : testday
                    ? t('load case 1 · 400 N train, one car at a time · ready')
                    : target === 100
                      ? tx('{count} pieces · one 1016 × 813 mm sheet', { count })
                      : tx('explode {target}%', { target })}
              </pre>
            )}
          </div>
          {status === 'ready' && (
            <div className="asrs-controls">
              {testday ? (
                <button
                  type="button"
                  className={`asrs-btn${testing ? ' asrs-btn-on' : ''}`}
                  onClick={() => setTesting((v) => !v)}
                  title={t('Load case 1 in stages: one car across and back, then two cars until the top-flange splice lets go')}
                >
                  {testing ? t('■ Reset') : t('▶ Run')}
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    className={`asrs-btn${playing ? ' asrs-btn-on' : ''}`}
                    onClick={() => setPlaying((v) => !v)}
                    title={t('One piece at a time: from the sheet to the bridge, or back again')}
                  >
                    {playing ? t('■ Stop') : target >= 50 ? t('▶ Assemble') : t('▶ Take apart')}
                  </button>
                  <button type="button" className="asrs-btn" onClick={() => setTarget(100)}>
                    {t('Lay flat')}
                  </button>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={target}
                    aria-label={t('Explode')}
                    onChange={(ev) => setTarget(Number(ev.target.value))}
                  />
                </>
              )}
              <button
                type="button"
                className={`asrs-btn${inside ? ' asrs-btn-on' : ''}`}
                onClick={() => setInside((v) => !v)}
              >
                {t('⦿ X-ray')}
              </button>

              <span className="asrs-hint">{t('drag to orbit · ctrl+drag to pan · scroll to zoom')}</span>
            </div>
          )}
        </div>
      )}
      <figcaption>
        {testday
          ? t("Test day, replayed from the photos: load case 1 goes in stages — one car across and back, then two together. Ours carried the single car; with two cars on the span, 267 N, the lead car reached the top-flange splice at 1,016 mm and it let go: the near web's glued splice parts cleanly, the far web tears, the cars drop onto their tethers. Failure load 133 N, the pass before.")
          : t('The box girder from the engineering assembly, every piece coloured as cut. Slide it flat and it lands back on the one sheet; X-ray shows the diaphragms and the splice patches — none on the top sheet.')}
      </figcaption>
    </figure>
  );
}
