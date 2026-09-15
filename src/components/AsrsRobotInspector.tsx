import { useEffect, useRef, useState } from 'react';
import { loadRobotAsset, makeRobot } from './asrsRobot';
import { useLang } from '../i18n';

const MEDIA = '/media/incheon-robotics';

// The robot alone, on a studio turntable — no warehouse, no task, just the
// machine to examine up close. Slow auto-spin until you grab it; toggles for
// the deck, the tabs, and the x-ray shell. Same lazy-load pattern as the
// other viewers; `?3d` activates immediately for screenshots.
export function AsrsRobotInspector() {
  const { t } = useLang();
  const [active, setActive] = useState(
    () => typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('3d'),
  );
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [spin, setSpin] = useState(true);
  const [xray, setXray] = useState(false);
  const [deckUp, setDeckUp] = useState(false);
  const [tabsOut, setTabsOut] = useState(false);
  const mountRef = useRef<HTMLDivElement>(null);
  const flags = useRef({ spin: true, xray: false, deckUp: false, tabsOut: false });

  useEffect(() => {
    flags.current = { spin, xray, deckUp, tabsOut };
  }, [spin, xray, deckUp, tabsOut]);

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
        const [{ OrbitControls }, { RoomEnvironment }, asset] = await Promise.all([
          import('three/examples/jsm/controls/OrbitControls.js'),
          import('three/examples/jsm/environments/RoomEnvironment.js'),
          loadRobotAsset(),
        ]);
        const mount = mountRef.current;
        if (!mount || disposed) return;

        const dark = () => document.body.classList.contains('dark-mode');
        const scene = new THREE.Scene();
        const setBg = () => {
          scene.background = new THREE.Color(dark() ? 0x141518 : 0xd6d9dd);
        };
        setBg();

        const webgl = new THREE.WebGLRenderer({ antialias: true });
        renderer = webgl;
        webgl.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
        webgl.setSize(mount.clientWidth || 560, mount.clientHeight || 420);
        webgl.shadowMap.enabled = true;
        webgl.shadowMap.type = THREE.PCFSoftShadowMap;
        webgl.toneMapping = THREE.ACESFilmicToneMapping;
        webgl.toneMappingExposure = 1.12;
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
          34,
          (mount.clientWidth || 560) / (mount.clientHeight || 420),
          0.01,
          40,
        );
        camera.position.set(0.55, 0.32, 0.62);

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

        scene.add(new THREE.HemisphereLight(0xffffff, 0x777777, 0.75));
        const key = new THREE.DirectionalLight(0xffffff, 2.4);
        key.position.set(1.4, 2.4, 1.6);
        key.castShadow = true;
        key.shadow.mapSize.set(2048, 2048);
        key.shadow.camera.left = key.shadow.camera.bottom = -0.5;
        key.shadow.camera.right = key.shadow.camera.top = 0.5;
        key.shadow.bias = -0.001;
        scene.add(key);
        const rim = new THREE.DirectionalLight(0xd8e4ff, 0.6);
        rim.position.set(-1.6, 1.1, -1.4);
        scene.add(rim);

        // a plain studio ground that catches the shadow — no tiles, no plate
        const ground = new THREE.Mesh(
          new THREE.CircleGeometry(2.2, 48),
          new THREE.MeshStandardMaterial({ color: dark() ? 0x1a1b1e : 0xc9ccd1, roughness: 0.9 }),
        );
        const groundMat = ground.material as { color: { set: (c: number) => void } };
        const mo2 = new MutationObserver(() => groundMat.color.set(dark() ? 0x1a1b1e : 0xc9ccd1));
        mo2.observe(document.body, { attributes: true, attributeFilter: ['class'] });
        cleanupExtra.push(() => mo2.disconnect());
        ground.rotation.x = -Math.PI / 2;
        ground.receiveShadow = true;
        scene.add(ground);
        cleanupExtra.push(() => ground.geometry.dispose());

        const turntable = new THREE.Group();
        scene.add(turntable);
        const robot = makeRobot(asset);
        turntable.add(robot.group);
        cleanupExtra.push(() => robot.dispose());

        const orbit = new OrbitControls(camera, webgl.domElement);
        controls = orbit;
        orbit.enableDamping = true;
        orbit.target.set(0, 0.05, 0);
        orbit.minDistance = 0.2;
        orbit.maxDistance = 2.5;
        orbit.maxPolarAngle = Math.PI / 2 - 0.02;
        // grabbing the model takes over from the turntable
        orbit.addEventListener('start', () => {
          if (flags.current.spin) setSpin(false);
        });

        const reduced =
          typeof window.matchMedia === 'function' &&
          window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (reduced) setSpin(false);

        let lift = 0;
        let grip = 0;
        let last = 0;
        const animate = (now: number) => {
          raf = requestAnimationFrame(animate);
          if (!last) last = now;
          const dt = Math.min((now - last) / 1000, 0.1);
          last = now;
          const f = flags.current;
          if (f.spin) turntable.rotation.y += dt * 0.35;
          const ease = (v: number, t: number) => v + (t - v) * Math.min(1, dt * 3);
          lift = ease(lift, f.deckUp ? 1 : 0);
          grip = ease(grip, f.tabsOut ? 1 : 0);
          robot.setLift(lift);
          robot.setGrip(grip);
          robot.setXray(f.xray);
          orbit.update();
          webgl.render(scene, camera);
        };
        raf = requestAnimationFrame(animate);
        setStatus('ready');
      } catch (e) {
        console.error('AsrsRobotInspector:', e);
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
    <figure className="story-figure model-viewer" id="robot-inspect">
      {!active ? (
        <button type="button" className="model-poster" onClick={() => setActive(true)}>
          <img
            src={`${MEDIA}/r-2.jpg`}
            alt={t("CAD render of the ASRS robot from a high angle, deck seated flat with its four tabs extended.")}
            width={1300}
            height={700}
            loading="lazy"
          />
          <span className="model-cta">Inspect the robot in 3D</span>
        </button>
      ) : (
        <div className="asrs-frame">
          <div
            className="model-mount asrs-mount"
            ref={mountRef}
            tabIndex={-1}
            role="application"
            aria-label={t("The ASRS robot alone on a turntable. Drag to orbit, scroll to zoom; toggles run the deck, the tabs, and the x-ray shell.")}
          >
            <span className="model-status" role="status" aria-live="polite">
              {status === 'loading' && 'loading the model…'}
              {status === 'error' && "3D isn't available in this browser."}
            </span>
            {status === 'ready' && (
              <pre className="asrs-hud" aria-hidden="true">
                {'INCHEON ASRS ROBOT\n8 kg · 30 kg payload · ~30 W · 1.5 m/s'}
              </pre>
            )}
          </div>
          {status === 'ready' && (
            <div className="asrs-controls">
              <button
                type="button"
                className={`asrs-btn${spin ? ' asrs-btn-on' : ''}`}
                onClick={() => setSpin((v) => !v)}
              >
                ⟳ Turntable
              </button>
              <button
                type="button"
                className={`asrs-btn${deckUp ? ' asrs-btn-on' : ''}`}
                onClick={() => setDeckUp((v) => !v)}
              >
                ▴ Deck
              </button>
              <button
                type="button"
                className={`asrs-btn${tabsOut ? ' asrs-btn-on' : ''}`}
                onClick={() => setTabsOut((v) => !v)}
              >
                ⇤ Tabs
              </button>
              <button
                type="button"
                className={`asrs-btn${xray ? ' asrs-btn-on' : ''}`}
                onClick={() => setXray((v) => !v)}
              >
                ⊘ X-ray
              </button>
              <span className="asrs-hint">drag to orbit · ctrl+drag to pan · scroll to zoom</span>
            </div>
          )}
        </div>
      )}
      <figcaption>{t("The machine itself, on a turntable — the Blender model, built to the company's robot description and photographs: the plate with its slot cross, the blue hub and its cam links, the mecanum rollers, the pinned scissor. Run the deck and the tabs yourself, and X-ray the shell to see the drivetrain.")}</figcaption>
    </figure>
  );
}
