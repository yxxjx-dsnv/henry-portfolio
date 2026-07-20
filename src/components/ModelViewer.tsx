import { useEffect, useRef, useState } from 'react';

type Props = {
  src: string; // .glb path
  poster: { src: string; alt: string; width: number; height: number };
  caption: string;
  label?: string; // accessible name for the live canvas
};

// Click-to-activate 3D viewer (drag to orbit, scroll to zoom). three.js loads
// only after the visitor asks for it, so the page itself stays light and
// nothing moves unasked. Falls back to the poster with a download link when
// WebGL is unavailable.
export function ModelViewer({ src, poster, caption, label }: Props) {
  const [active, setActive] = useState(false);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!active) return;
    mountRef.current?.focus();
    let disposed = false;
    let raf = 0;
    let cleanupExtra: (() => void)[] = [];
    let renderer:
      | {
          dispose: () => void;
          forceContextLoss: () => void;
          domElement: HTMLCanvasElement;
          setSize: (w: number, h: number) => void;
        }
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
        scene.background = new THREE.Color(dark() ? 0x161616 : 0xf4f4f4);
        const camera = new THREE.PerspectiveCamera(
          45,
          (mount.clientWidth || 560) / (mount.clientHeight || 420),
          0.01,
          1000,
        );

        const webglRenderer = new THREE.WebGLRenderer({ antialias: true });
        renderer = webglRenderer;
        webglRenderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
        webglRenderer.setSize(mount.clientWidth || 560, mount.clientHeight || 420);
        mount.appendChild(webglRenderer.domElement);

        const onContextLost = (e: Event) => {
          e.preventDefault();
          setStatus('error');
        };
        webglRenderer.domElement.addEventListener('webglcontextlost', onContextLost);
        cleanupExtra.push(() =>
          webglRenderer.domElement.removeEventListener('webglcontextlost', onContextLost),
        );

        // stay honest with the column on rotation / resize
        if (typeof ResizeObserver === 'function') {
          const ro = new ResizeObserver(() => {
            const w = mount.clientWidth;
            const h = mount.clientHeight;
            if (w > 0 && h > 0) {
              webglRenderer.setSize(w, h);
              camera.aspect = w / h;
              camera.updateProjectionMatrix();
            }
          });
          ro.observe(mount);
          cleanupExtra.push(() => ro.disconnect());
        }

        // follow the site's dark-mode toggle while the canvas is live
        const mo = new MutationObserver(() => {
          scene.background = new THREE.Color(dark() ? 0x161616 : 0xf4f4f4);
        });
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
        const gltf = await loader.loadAsync(src);
        if (disposed) return;

        const model = gltf.scene;
        const box = new THREE.Box3().setFromObject(model);
        const size = box.getSize(new THREE.Vector3());
        const center = box.getCenter(new THREE.Vector3());
        model.position.sub(center);
        scene.add(model);
        cleanupExtra.push(() => {
          scene.traverse((obj) => {
            const mesh = obj as { geometry?: { dispose: () => void }; material?: unknown };
            mesh.geometry?.dispose?.();
            const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
            for (const m of mats) {
              const mat = m as { dispose?: () => void; map?: { dispose?: () => void } } | undefined;
              mat?.map?.dispose?.();
              mat?.dispose?.();
            }
          });
        });

        const maxDim = Math.max(size.x, size.y, size.z);
        camera.position.set(maxDim * 0.75, maxDim * 0.3, maxDim * 1.05);
        camera.lookAt(0, 0, 0);

        const orbit = new OrbitControls(camera, webglRenderer.domElement);
        controls = orbit;
        orbit.enableDamping = true;
        orbit.minDistance = maxDim * 0.25;
        orbit.maxDistance = maxDim * 3;

        const animate = () => {
          raf = requestAnimationFrame(animate);
          orbit.update();
          webglRenderer.render(scene, camera);
        };
        animate();
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
  }, [active, src]);

  return (
    <figure className="story-figure model-viewer">
      {!active ? (
        <button type="button" className="model-poster" onClick={() => setActive(true)}>
          <img
            src={poster.src}
            alt={poster.alt}
            width={poster.width}
            height={poster.height}
            loading="lazy"
          />
          <span className="model-cta">View in 3D</span>
        </button>
      ) : (
        <div
          className="model-mount"
          ref={mountRef}
          tabIndex={-1}
          role="application"
          aria-label={`${label ?? 'Interactive 3D model of the wand'}. Drag to orbit, scroll to zoom.`}
        >
          <span className="model-status" role="status" aria-live="polite">
            {status === 'loading' && 'loading the model…'}
            {status === 'error' && (
              <>
                3D isn't available here —{' '}
                <a href={src} download>
                  download the model
                </a>{' '}
                instead.
              </>
            )}
          </span>
        </div>
      )}
      <figcaption>{caption}</figcaption>
    </figure>
  );
}
