// The hanging ID badge on the home cover: three.js draws it, Rapier swings it.
// Loaded on demand (this module pulls in three and the Rapier wasm), so the rest
// of the site never pays for it.
//
// What sells it as a real object:
// - the sleeve is a thin film: a mirror whose opacity is its Fresnel reflectance,
//   so it is clear face-on and catches the studio strip lights at grazing angles;
// - the card print is unlit, so the type stays as crisp as the paper it is on;
// - one warm key light casts a soft shadow of everything onto the page behind;
// - the straps are flat webbing (an ellipse swept along the chain), parallel-
//   transported so they never kink, and pushed out of the card where they touch.
import * as THREE from 'three';
import RAPIER from '@dimforge/rapier3d-compat';
import { buildLanyard, PHYSICS, CARD_HALF, CARD_REST_Y } from './badgePhysics';
import { drawCardArt } from './badgeArt';

const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const STRAP_COLOR = '#2b2b2b'; // neutral charcoal: the site is black and white, and olive turned green on dark mode

function roundRect(w: number, h: number, r: number) {
  const s = new THREE.Shape();
  const x = -w / 2;
  const y = -h / 2;
  s.moveTo(x + r, y);
  s.lineTo(x + w - r, y);
  s.quadraticCurveTo(x + w, y, x + w, y + r);
  s.lineTo(x + w, y + h - r);
  s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  s.lineTo(x + r, y + h);
  s.quadraticCurveTo(x, y + h, x, y + h - r);
  s.lineTo(x, y + r);
  s.quadraticCurveTo(x, y, x + r, y);
  return s;
}

function lcg(seed: number) {
  let s = seed >>> 0;
  return () => (s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296;
}

/**
 * Knitted lanyard webbing, one tile = 4 wales (columns) x 6 courses (rows) of
 * stockinette: every stitch is a V of two leaning yarn legs, each leg a little
 * twisted bundle of fibres. Drawn as height (the bump) and as shading (the map),
 * so the strap reads as yarn up close and as a fine rib from across the room.
 */
function knitTextures() {
  const S = 256;
  const W = S / 4; // one wale
  const H = S / 6; // one course
  const height = document.createElement('canvas');
  height.width = height.height = S;
  const g = height.getContext('2d')!;
  g.fillStyle = '#000';
  g.fillRect(0, 0, S, S);
  const r = lcg(41);
  const leg = (cx: number, cy: number, lean: number) => {
    g.save();
    g.translate(cx, cy);
    g.rotate(lean);
    const rx = W * 0.27;
    const ry = H * 0.66;
    const grad = g.createRadialGradient(0, 0, 0, 0, 0, ry);
    grad.addColorStop(0, '#fff');
    grad.addColorStop(0.55, '#b4b4b4');
    grad.addColorStop(1, '#000');
    g.scale(rx / ry, 1);
    g.fillStyle = grad;
    g.beginPath();
    g.arc(0, 0, ry, 0, Math.PI * 2);
    g.fill();
    g.restore();
    // fibres running along the leg, so it reads as plied yarn, not a bead
    g.save();
    g.globalCompositeOperation = 'multiply'; // ('lighten' would drop dark strokes)
    g.translate(cx, cy);
    g.rotate(lean);
    g.strokeStyle = 'rgba(110,110,110,.55)';
    g.lineWidth = 0.8;
    for (let k = -2; k <= 2; k++) {
      g.beginPath();
      g.moveTo(k * rx * 0.33, -ry * 0.75);
      g.quadraticCurveTo(k * rx * 0.33 + rx * 0.25, 0, k * rx * 0.33, ry * 0.75);
      g.stroke();
    }
    g.restore();
  };
  g.globalCompositeOperation = 'lighten';
  // draw a ring of neighbours too, so the tile wraps without a seam
  for (let row = -1; row <= 6; row++)
    for (let col = -1; col <= 4; col++) {
      const cx = col * W + W / 2;
      const cy = row * H + H / 2;
      const j = (r() - 0.5) * 1.5;
      leg(cx - W * 0.21 + j, cy, 0.5);
      leg(cx + W * 0.21 + j, cy, -0.5);
    }
  g.globalCompositeOperation = 'source-over';

  // shading: the same relief, lifted so the dark yarn keeps its colour and
  // only the valleys between stitches go darker
  const shade = document.createElement('canvas');
  shade.width = shade.height = S;
  const sg = shade.getContext('2d')!;
  const img = g.getImageData(0, 0, S, S);
  for (let i = 0; i < img.data.length; i += 4) {
    const v = 190 + (img.data[i] / 255) * 65 + (r() - 0.5) * 12;
    img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
  }
  sg.putImageData(img, 0, 0);

  const make = (c: HTMLCanvasElement, srgb: boolean) => {
    const t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    if (srgb) t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 8;
    return t;
  };
  return { bump: make(height, false), map: make(shade, true) };
}

/** Greyscale bump: a little tooth for the metal. */
function bumpTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const g = c.getContext('2d')!;
  const img = g.createImageData(256, 256);
  const r = lcg(23);
  for (let i = 0; i < 256 * 256; i++) {
    const val = 180 + r() * 50;
    img.data[i * 4] = img.data[i * 4 + 1] = img.data[i * 4 + 2] = val;
    img.data[i * 4 + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  g.strokeStyle = 'rgba(80,80,80,.14)';
  g.lineWidth = 0.4;
  for (let i = 0; i < 45; i++) {
    const x = r() * 256;
    const y = r() * 256;
    g.beginPath();
    g.moveTo(x, y);
    g.lineTo(x + r() * 40, y + r() * 5);
    g.stroke();
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}

/** Dust caught in the sleeve, heavier near the edges and the zip seal, plus a few scuffs. */
function wearTexture() {
  const W = 1024;
  const H = 1536;
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const g = c.getContext('2d')!;
  const r = lcg(617);
  for (let i = 0; i < 950; i++) {
    const x = r() * W;
    const y = r() * H;
    const nearEdge = Math.min(x, W - x, y, H - y) <= 60 || (y > 165 && y < 244);
    if (!nearEdge && r() > 0.09) continue;
    const s = 0.3 + r() * 2.1;
    g.fillStyle = `rgba(${r() > 0.55 ? '70,66,53' : '255,255,246'},${0.12 + r() * 0.38})`;
    g.beginPath();
    g.ellipse(x, y, s, s * (0.45 + r()), r() * Math.PI, 0, Math.PI * 2);
    g.fill();
  }
  for (let i = 0; i < 28; i++) {
    const x = r() > 0.5 ? 25 + r() * 45 : W - 70 + r() * 40;
    const y = 250 + r() * 1220;
    g.strokeStyle = `rgba(240,242,230,${0.1 + r() * 0.2})`;
    g.lineWidth = 0.35 + r() * 0.55;
    g.beginPath();
    g.moveTo(x, y);
    g.quadraticCurveTo(x + r() * 5, y + 12, x + r() * 7, y + 15 + r() * 38);
    g.stroke();
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/**
 * Thin vinyl. A polished mirror whose alpha is its Fresnel reflectance: face-on
 * you see straight through it, edge-on it turns to light. `edge` is the welded
 * seam, which is cloudier and reflects more even face-on.
 */
function filmMaterial(roughness: number, edge = false) {
  const m = new THREE.MeshStandardMaterial({
    color: '#ffffff',
    metalness: 1,
    roughness,
    transparent: true,
    depthWrite: false,
  });
  const base = edge ? 0.18 : 0.035;
  m.onBeforeCompile = (sh) => {
    sh.vertexShader = 'varying vec3 vFilmPos;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\nvFilmPos = position;');
    sh.fragmentShader = 'varying vec3 vFilmPos;\n' + sh.fragmentShader;
    if (!edge) {
      // the film is never perfectly flat; a slow ripple breaks up the reflections
      sh.fragmentShader = sh.fragmentShader.replace(
        '#include <normal_fragment_maps>',
        `#include <normal_fragment_maps>
        normal = normalize(normal + vec3(.018*sin(vFilmPos.y*3.1 + vFilmPos.x*1.4), .011*cos(vFilmPos.x*4.2 - vFilmPos.y*1.3), 0.0));`,
      );
    }
    sh.fragmentShader = sh.fragmentShader.replace(
      '#include <opaque_fragment>',
      `#include <opaque_fragment>
      float facing = clamp(abs(dot(normalize(normal), normalize(vViewPosition))), 0.0, 1.0);
      float fres = ${base.toFixed(3)} + ${(1 - base).toFixed(3)} * pow(1.0 - facing, 5.0);
      fres = clamp(fres * 1.018, 0.0, 1.0);
      // keep the hot strip-light highlights even where the film is see-through
      float energy = max(max(outgoingLight.r, outgoingLight.g), outgoingLight.b);
      fres = max(fres, smoothstep(.9, 4.0, energy) * ${edge ? '.65' : '.34'});
      gl_FragColor.a = fres;`,
    );
  };
  m.customProgramCacheKey = () => `badge-film-${edge}`;
  return m;
}

/** Flat webbing swept along a curve: an ellipse ring per sample, parallel-transported frames. */
function makeRibbon(material: THREE.Material, rings = 80, halfWidth = 0.085, halfThick = 0.012) {
  const RAD = 12;
  const pos = new Float32Array((rings + 1) * (RAD + 1) * 3);
  const nor = new Float32Array(pos.length);
  const uv = new Float32Array((rings + 1) * (RAD + 1) * 2);
  const index: number[] = [];
  for (let i = 0; i <= rings; i++)
    for (let j = 0; j <= RAD; j++) {
      const k = i * (RAD + 1) + j;
      // u runs straight across the face (front 0..0.5, back 0.5..1), even in
      // width, so the knit's wales stay evenly spaced right out to the edges
      const th = (j / RAD) * Math.PI * 2;
      uv[k * 2] = j <= RAD / 2 ? (1 - Math.cos(th)) / 4 : 0.5 + (1 + Math.cos(th)) / 4;
      uv[k * 2 + 1] = i / rings;
      // wound so the outside faces out (counter-clockwise seen from outside)
      if (i < rings && j < RAD) index.push(k, k + RAD + 1, k + 1, k + 1, k + RAD + 1, k + RAD + 2);
    }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
  geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  geo.setIndex(index);
  const mesh = new THREE.Mesh(geo, material);
  mesh.castShadow = true;
  mesh.frustumCulled = false;

  const P = Array.from({ length: rings + 1 }, () => V());
  const T = Array.from({ length: rings + 1 }, () => V());
  const N = Array.from({ length: rings + 1 }, () => V());
  const q = new THREE.Quaternion();
  const a = V();
  const b = V();
  const t = V();
  const tmp = V();
  let twist = 0;

  /** `endNormal`: the direction the strap's width should face where it ends. */
  function update(curve: THREE.Curve<THREE.Vector3>, endNormal: THREE.Vector3, dt = 1 / 60, push?: (p: THREE.Vector3) => boolean) {
    for (let i = 0; i <= rings; i++) {
      curve.getPoint(i / rings, P[i]);
      curve.getTangent(i / rings, T[i]).normalize();
    }
    if (push) {
      let moved = false;
      for (const p of P) moved = push(p) || moved;
      if (moved) for (let i = 0; i <= rings; i++) T[i].copy(P[Math.min(rings, i + 1)]).sub(P[Math.max(0, i - 1)]).normalize();
    }
    N[0].set(1, 0, 0).addScaledVector(T[0], -T[0].x).normalize();
    for (let i = 1; i <= rings; i++) {
      q.setFromUnitVectors(T[i - 1], T[i]);
      N[i].copy(N[i - 1]).applyQuaternion(q);
      N[i].addScaledVector(T[i], -N[i].dot(T[i])).normalize();
    }
    // spread the twist needed to meet `endNormal` along the strap; webbing is
    // symmetric, so a half turn either way is as good as none
    t.copy(endNormal).addScaledVector(T[rings], -endNormal.dot(T[rings])).normalize();
    let ang = Math.atan2(tmp.crossVectors(N[rings], t).dot(T[rings]), N[rings].dot(t));
    ang = 0.5 * Math.atan2(Math.sin(2 * ang), Math.cos(2 * ang));
    twist += (ang - twist) * (1 - Math.exp(-14 * dt));
    for (let i = 0; i <= rings; i++) {
      a.copy(N[i]).applyAxisAngle(T[i], twist * THREE.MathUtils.smoothstep(i / rings, 0, 1));
      b.crossVectors(a, T[i]).normalize();
      for (let j = 0; j <= RAD; j++) {
        const th = (j / RAD) * Math.PI * 2;
        const cs = Math.cos(th);
        const sn = Math.sin(th);
        const k = (i * (RAD + 1) + j) * 3;
        tmp.copy(P[i]).addScaledVector(a, cs * halfWidth).addScaledVector(b, sn * halfThick).toArray(pos, k);
        tmp.copy(a).multiplyScalar(cs / halfWidth).addScaledVector(b, sn / halfThick).normalize().toArray(nor, k);
      }
    }
    geo.attributes.position.needsUpdate = true;
    geo.attributes.normal.needsUpdate = true;
  }
  return { mesh, update };
}

/** Swivel lobster clasp, the swivel eye, and the strap's sewn fold through the eye. */
function makeHardware(metal: THREE.Material, strap: THREE.Material) {
  // (`strap` here is the fold's own copy: its knit is tiled for a short piece)
  const clasp = new THREE.Group();
  const eye = new THREE.Group();
  const yoke = new THREE.Group();
  // the lobster is modelled in its own plane, then turned edge-on to the camera
  const side = new THREE.Group();
  side.rotation.y = Math.PI / 2;
  clasp.add(side);

  const add = (geo: THREE.BufferGeometry, mat: THREE.Material, parent: THREE.Object3D, at = V()) => {
    const m = new THREE.Mesh(geo, mat);
    m.position.copy(at);
    m.castShadow = true;
    parent.add(m);
    return m;
  };
  const rod = (from: THREE.Vector3, to: THREE.Vector3, r: number, parent: THREE.Object3D) => {
    const d = to.clone().sub(from);
    const m = add(new THREE.CylinderGeometry(r, r, d.length(), 20), metal, parent, from.clone().add(to).multiplyScalar(0.5));
    m.quaternion.setFromUnitVectors(V(0, 1, 0), d.normalize());
    return m;
  };
  const wire = (pts: THREE.Vector3[], r: number, parent: THREE.Object3D, closed = false) =>
    add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, closed), 64, r, 12, closed), metal, parent);

  // lobster body: a rounded wedge, thick at the swivel, tapering into the jaw
  const body = new THREE.Shape();
  body.moveTo(-0.05, 0.245);
  body.lineTo(0.05, 0.245);
  body.bezierCurveTo(0.064, 0.17, 0.078, 0.06, 0.105, -0.09);
  body.quadraticCurveTo(0.074, -0.082, 0.04, -0.036);
  body.quadraticCurveTo(-0.026, 0.046, -0.108, 0.02);
  body.quadraticCurveTo(-0.07, 0.112, -0.05, 0.245);
  const bodyGeo = new THREE.ExtrudeGeometry(body, { depth: 0.047, bevelEnabled: true, bevelSegments: 4, bevelSize: 0.012, bevelThickness: 0.012, curveSegments: 20 });
  bodyGeo.translate(0, 0, -0.0235);
  add(bodyGeo, metal, side);
  // the hook that passes through the sleeve's slot, and the spring gate closing it
  const hook = new THREE.CurvePath<THREE.Vector3>();
  hook.add(new THREE.CubicBezierCurve3(V(0.075, 0.015), V(0.14, -0.1), V(0.13, -0.3), V(0, -0.32)));
  hook.add(new THREE.CubicBezierCurve3(V(0, -0.32), V(-0.15, -0.34), V(-0.19, -0.2), V(-0.15, -0.1)));
  add(new THREE.TubeGeometry(hook, 80, 0.025, 16, false), metal, side);
  const gate = new THREE.Group();
  side.add(gate);
  const gateArm = add(
    new THREE.TubeGeometry(new THREE.CubicBezierCurve3(V(-0.03, 0.069), V(-0.09, 0.075), V(-0.13, -0.05), V(-0.15, -0.1)), 40, 0.024, 16, false),
    metal,
    gate,
  );
  gateArm.scale.z = 0.75;
  wire([V(0.073, 0.07, -0.01), V(0.178, 0.015, -0.01), V(0.182, -0.027, -0.01), V(0.13, -0.047, -0.01)], 0.011, side);
  const pin = add(new THREE.CylinderGeometry(0.028, 0.028, 0.075, 24), metal, side, V(-0.03, 0.069, 0));
  pin.rotation.x = Math.PI / 2;
  for (const z of [-1, 1]) {
    add(new THREE.TorusGeometry(0.022, 0.0038, 8, 24), metal, side, V(-0.03, 0.069, z * 0.04));
    add(new THREE.SphereGeometry(0.012, 16, 10), metal, side, V(-0.03, 0.069, z * 0.04)).scale.z = 0.25;
  }
  rod(V(0, 0.225, 0), V(0, 0.285, 0), 0.042, clasp);

  // swivel eye: barrel, collar, and the D-ring the strap is sewn through
  add(new THREE.CylinderGeometry(0.069, 0.058, 0.085, 32), metal, eye, V(0, -0.146, 0));
  add(new THREE.CylinderGeometry(0.084, 0.084, 0.019, 32), metal, eye, V(0, -0.115, 0));
  wire([V(-0.115, 0.13), V(-0.125, 0.04), V(-0.115, -0.07), V(0, -0.1), V(0.115, -0.07), V(0.125, 0.04), V(0.115, 0.13)], 0.027, eye);
  rod(V(-0.115, 0.13), V(0.115, 0.13), 0.027, eye);

  // the strap folded over the ring, with its box stitching
  const fold = makeRibbon(strap, 64, 0.085);
  fold.update(
    new THREE.CatmullRomCurve3([V(0, 0.04, 0.061), V(0, -0.06, 0.061), V(0, -0.16, 0.061), V(0, -0.22, 0), V(0, -0.16, -0.061), V(0, -0.06, -0.061), V(0, 0.04, -0.061)]),
    V(1, 0, 0),
    1,
  );
  yoke.add(fold.mesh);
  const thread = new THREE.MeshStandardMaterial({ color: '#777777', roughness: 1 });
  for (const z of [-1, 1])
    for (const y of [-0.04, 0])
      for (let i = 0; i < 6; i++) add(new THREE.BoxGeometry(0.01, 0.003, 0.002), thread, yoke, V(-0.06 + i * 0.024, y, z * 0.073));
  return { clasp, eye, yoke };
}

export type BadgeState = 'loading' | 'live' | 'dragging' | 'error';

export async function createBadgeScene(canvas: HTMLCanvasElement, onState: (s: BadgeState) => void) {
  await RAPIER.init();
  let disposed = false;
  let raf = 0;
  let visible = true;
  let last = 0;
  let acc = 0;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');

  const scene = new THREE.Scene();
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0x000000, 0);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;

  const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 60);

  // studio: three strip lights, baked into a prefiltered environment
  const pmrem = new THREE.PMREMGenerator(renderer);
  const studio = new THREE.Scene();
  for (const [x, z, w, h, power, turn] of [
    [-3, 3, 1, 7, 5, 0.55],
    [3, 3, 1.5, 7, 0.015, -0.55],
    [0.8, 4, 0.28, 6, 7, -0.2],
  ]) {
    const strip = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.03), new THREE.MeshBasicMaterial({ color: new THREE.Color().setRGB(power, power, power) }));
    strip.position.set(x, 1, z);
    strip.rotation.y = turn;
    studio.add(strip);
  }
  const env = pmrem.fromScene(studio, 0.015);
  scene.environment = env.texture;
  scene.environmentIntensity = 0.65;
  studio.traverse((o) => {
    if (o instanceof THREE.Mesh) {
      o.geometry.dispose();
      (o.material as THREE.Material).dispose();
    }
  });
  pmrem.dispose();

  const key = new THREE.DirectionalLight('#fff7e6', 2.5);
  key.position.set(-3, 6, 7);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  Object.assign(key.shadow.camera, { left: -8, right: 8, top: 9, bottom: -7, near: 0.1, far: 25 });
  key.shadow.bias = -5e-4;
  key.shadow.normalBias = 0.03;
  key.shadow.radius = 5;
  scene.add(key);
  const fill = new THREE.DirectionalLight('#e8f0ff', 0.7);
  fill.position.set(5, 2, 4);
  scene.add(fill);
  scene.add(new THREE.AmbientLight('#ffffff', 0.35));
  // the page behind, which only shows the shadow
  const wall = new THREE.Mesh(new THREE.PlaneGeometry(100, 100), new THREE.ShadowMaterial({ opacity: 0.13 }));
  wall.position.z = -1;
  wall.receiveShadow = true;
  scene.add(wall);

  const grain = bumpTexture();
  const knit = knitTextures();
  // tiling: ~7 wales across the face (u 0..0.5 holds 3.5 tiles of 4), and
  // stitches about as tall as wide along a strap ~7 units long
  for (const t of [knit.bump, knit.map]) t.repeat.set(3.5, 58);
  const knitFold = { bump: knit.bump.clone(), map: knit.map.clone() };
  for (const t of [knitFold.bump, knitFold.map]) t.repeat.set(3.5, 4.5);
  const wear = wearTexture();

  // ---- the card in its sleeve ----
  const card = new THREE.Group();
  scene.add(card);
  const put = (geo: THREE.BufferGeometry, mat: THREE.Material, x = 0, y = 0, z = 0, parent: THREE.Object3D = card) => {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x, y, z);
    parent.add(m);
    return m;
  };
  const film = filmMaterial(0.012);
  const seam = filmMaterial(0.018, true);
  seam.color.set('#858c88');
  film.envMapIntensity = seam.envMapIntensity = 0.9;

  const sleeve = roundRect(2.72, 4.36, 0.19);
  for (const x of [-0.88, 0.88]) {
    const hole = new THREE.Path();
    hole.absarc(x, 1.89, 0.104, 0, Math.PI * 2, true);
    sleeve.holes.push(hole);
  }
  const slot = new THREE.Path();
  roundRect(0.66, 0.13, 0.064)
    .getPoints(16)
    .reverse()
    .forEach((p, i) => (i ? slot.lineTo(p.x, p.y + 1.88) : slot.moveTo(p.x, p.y + 1.88)));
  sleeve.holes.push(slot);
  const sleeveGeo = new THREE.ExtrudeGeometry(sleeve, { depth: 0.008, bevelEnabled: true, bevelSegments: 3, steps: 1, bevelSize: 0.005, bevelThickness: 0.004, curveSegments: 16 });
  put(sleeveGeo, film, 0, 0, 0.045).renderOrder = 3;
  const back = put(new THREE.ShapeGeometry(sleeve, 16), film, 0, 0, 0.005);
  back.rotation.y = Math.PI;
  back.renderOrder = 2;
  const dust = put(
    new THREE.PlaneGeometry(2.52, 3.87),
    new THREE.MeshBasicMaterial({ map: wear, transparent: true, opacity: 0.2, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -1 }),
    0,
    -0.12,
    0.061,
  );
  dust.renderOrder = 4;

  // welded seams around the edge, the slot and the punched holes
  const seamLoop = (w: number, h: number, r: number, z: number, tube: number, yOff = 0) => {
    const pts = roundRect(w, h, r)
      .getPoints(24)
      .map((p, i) => V(p.x, p.y + yOff, z + 0.002 * Math.sin(i * 1.7) + 0.0015 * Math.sin(i * 0.47)));
    if (pts[0].distanceTo(pts[pts.length - 1]) < 1e-4) pts.pop();
    put(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, true), 220, tube, 10, true), seam);
  };
  seamLoop(2.72, 4.36, 0.19, 0.032, 0.012);
  seamLoop(2.58, 4.2, 0.15, 0.05, 0.007);
  seamLoop(0.66, 0.13, 0.064, 0.053, 0.006, 1.88);
  for (const x of [-0.88, 0.88]) put(new THREE.TorusGeometry(0.109, 0.013, 8, 40), seam, x, 1.89, 0.053);
  // the press-seal ridges across the top, with air caught in them
  for (let i = 0; i < 4; i++) {
    const pts = Array.from({ length: 38 }, (_, n) => V(-1.275 + (n / 37) * 2.55, 1.55 + i * 0.032 + 0.002 * Math.sin(n * 0.81 + i), 0.056 + 0.002 * Math.sin(n * 0.69 + i * 2)));
    put(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 90, 0.01 + i * 8e-4, 8, false), seam);
  }
  const bubble = new THREE.MeshPhysicalMaterial({ color: '#ffffff', roughness: 0.015, transmission: 1, thickness: 0.008, ior: 1.1 });
  for (let i = 0; i < 19; i++) {
    const x = Math.sin(i * 47.31) * 1.17;
    const y = 1.565 + (0.5 + 0.5 * Math.sin(i * 29.9)) * 0.083;
    put(new THREE.SphereGeometry(0.004 + (i % 5) * 0.0017, 10, 6), bubble, x, y, 0.065).scale.set(1.8, 0.65, 0.4);
  }

  // the printed card itself
  const stock = new THREE.MeshStandardMaterial({ color: '#efebdf', roughness: 0.88 });
  const insert = new THREE.BoxGeometry(2.4, 3.52, 0.025);
  const paper = put(insert, stock, 0, -0.3, 0.025);
  paper.castShadow = true;
  const art = new THREE.CanvasTexture(await drawCardArt());
  art.colorSpace = THREE.SRGBColorSpace;
  art.anisotropy = renderer.capabilities.getMaxAnisotropy();
  put(new THREE.PlaneGeometry(2.39, 3.505), new THREE.MeshBasicMaterial({ map: art, toneMapped: false }), 0, -0.3, 0.04);
  put(new THREE.PlaneGeometry(2.39, 3.505), new THREE.MeshStandardMaterial({ color: '#eeeadf', roughness: 0.9 }), 0, -0.3, 0.009).rotation.y = Math.PI;

  const metal = new THREE.MeshStandardMaterial({ color: '#d5d9d6', metalness: 1, roughness: 0.2, bumpMap: grain, bumpScale: 1.2e-4 });
  // polyester yarn: matte, with the soft rim glow of cloth (sheen) at grazing angles
  const yarn = (t: typeof knit) =>
    new THREE.MeshPhysicalMaterial({
      color: STRAP_COLOR,
      map: t.map,
      roughness: 0.82,
      bumpMap: t.bump,
      bumpScale: 0.0022,
      sheen: 0.7,
      sheenRoughness: 0.5,
      sheenColor: new THREE.Color('#9a9a9a'),
    });
  const webbing = yarn(knit);
  const hw = makeHardware(metal, yarn(knitFold));
  scene.add(hw.clasp, hw.eye, hw.yoke);

  const rig = buildLanyard(RAPIER, PHYSICS);
  const straps = rig.straps.map(() => {
    const r = makeRibbon(webbing);
    scene.add(r.mesh);
    return r;
  });

  // ---- pointer: grab and drag, or brush past to flick ----
  const ray = new THREE.Raycaster();
  const ndc = new THREE.Vector2(10, 10);
  const dragPlane = new THREE.Plane(V(0, 0, 1), 0);
  const target = V();
  const grabLocal = V();
  const onPlane = V();
  const prevOnPlane = V();
  let havePrev = false;
  let prevT = 0;
  let dragging = false;
  let pointerId: number | null = null;

  const aim = (e: PointerEvent) => {
    const r = canvas.getBoundingClientRect();
    ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
  };
  const hit = () => ray.intersectObject(paper, false)[0];

  function down(e: PointerEvent) {
    if (e.button !== 0) return;
    aim(e);
    const h = hit();
    if (!h) return;
    // touch only grabs on purpose; a swipe elsewhere still scrolls the page
    dragging = true;
    pointerId = e.pointerId;
    try {
      canvas.setPointerCapture(e.pointerId);
    } catch {
      /* pointer already gone */
    }
    dragPlane.setFromNormalAndCoplanarPoint(camera.getWorldDirection(V()), h.point);
    ray.ray.intersectPlane(dragPlane, target);
    grabLocal.copy(card.worldToLocal(h.point.clone()));
    canvas.style.cursor = 'grabbing';
    onState('dragging');
    e.preventDefault();
  }
  function move(e: PointerEvent) {
    if (pointerId !== null && e.pointerId !== pointerId) return;
    aim(e);
    ray.ray.intersectPlane(dragPlane, onPlane);
    if (dragging) {
      target.copy(onPlane);
      target.x = THREE.MathUtils.clamp(target.x, -4.5, 4.5);
      target.y = THREE.MathUtils.clamp(target.y, -3.5, 5);
      return;
    }
    const h = hit();
    canvas.style.cursor = h ? 'grab' : 'default';
    const now = performance.now();
    if (h && havePrev && !reduced.matches && e.pointerType !== 'touch') {
      const dt = Math.max((now - prevT) / 1000, 0.016);
      const vx = THREE.MathUtils.clamp((onPlane.x - prevOnPlane.x) / dt, -12, 12);
      const vy = THREE.MathUtils.clamp((onPlane.y - prevOnPlane.y) / dt, -8, 8);
      rig.card.applyImpulseAtPoint({ x: vx * 0.008, y: vy * 0.004, z: 0 }, h.point, true);
    }
    prevOnPlane.copy(onPlane);
    prevT = now;
    havePrev = true;
  }
  function up(e?: PointerEvent) {
    if (pointerId !== null && e && e.pointerId !== pointerId) return;
    dragging = false;
    if (pointerId !== null && canvas.hasPointerCapture(pointerId)) canvas.releasePointerCapture(pointerId);
    pointerId = null;
    canvas.style.cursor = 'grab';
    onState('live');
  }
  function leave() {
    havePrev = false;
    if (!dragging) canvas.style.cursor = 'default';
  }
  const listeners: [string, (e: PointerEvent) => void][] = [
    ['pointerdown', down],
    ['pointermove', move],
    ['pointerup', up],
    ['pointercancel', up],
    ['lostpointercapture', up],
    ['pointerleave', leave],
  ];
  for (const [n, f] of listeners) canvas.addEventListener(n, f as EventListener);

  const narrow = () => canvas.clientWidth < 700;
  function resize() {
    const { width, height } = canvas.getBoundingClientRect();
    if (!width || !height) return;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.fov = 36;
    const tan = Math.tan(THREE.MathUtils.degToRad(18));
    if (narrow()) {
      // phones: the canvas is only the gap between copy and name, so frame the
      // card itself (and the clasp) rather than the whole lanyard
      const d = Math.max(2.75 / tan, 1.75 / (tan * camera.aspect));
      camera.position.set(0, 0.45, d);
      camera.lookAt(0, 0.45, 0);
    } else {
      camera.position.set(0, 0.8, 13.8);
      camera.lookAt(0, 0.8, 0);
    }
    camera.updateProjectionMatrix();
  }
  const ro = new ResizeObserver(resize);
  ro.observe(canvas);
  resize();

  // ---- simulation ----
  const q = new THREE.Quaternion();
  const off = V();
  const vel = V();
  const w = V();
  const pull = V();
  function physicsStep() {
    const p = PHYSICS;
    if (dragging) {
      // a critically damped spring from the grabbed point to the cursor, solved
      // implicitly so a hard yank cannot blow the card up
      const m = p.mass;
      const dt = rig.world.timestep;
      const t = rig.card.translation();
      q.copy(rig.card.rotation() as THREE.Quaternion);
      off.copy(grabLocal).applyQuaternion(q);
      vel.copy(rig.card.linvel() as THREE.Vector3).add(w.copy(rig.card.angvel() as THREE.Vector3).cross(off));
      const meff = m / (1 + off.lengthSq() / 0.65);
      const k = 100 * meff;
      const c = 2 * Math.sqrt(100) * meff;
      const denom = 1 + (c * dt + k * dt * dt) / meff;
      const at = V(t.x, t.y, t.z).add(off);
      pull.copy(target).sub(at).multiplyScalar(k).addScaledVector(vel, -c).divideScalar(denom).clampLength(0, 110 * m);
      rig.card.applyImpulseAtPoint(pull.multiplyScalar(dt), at, true);
    }
    rig.step(p, reduced.matches);
    // if a wild yank ever throws it off the screen, hang it back up
    const c = rig.card.translation();
    if (!Number.isFinite(c.x + c.y + c.z) || Math.abs(c.x) > 12 || c.y > 9 || c.y < -9) {
      dragging = false;
      rig.reset();
    }
  }

  // keep the straps out of the card: points inside its box move to the nearest face
  const inv = new THREE.Quaternion();
  const local = V();
  const box = [CARD_HALF[0] + 0.07, CARD_HALF[1] + 0.08, 0.18];
  const axes = ['x', 'y', 'z'] as const;
  function pushOut(p: THREE.Vector3) {
    let moved = false;
    local.copy(p).sub(card.position).applyQuaternion(inv);
    if (axes.every((a, i) => Math.abs(local[a]) < box[i])) {
      let best = 0;
      for (let i = 1; i < 3; i++) if (box[i] - Math.abs(local[axes[i]]) < box[best] - Math.abs(local[axes[best]])) best = i;
      const a = axes[best];
      local[a] = (Math.sign(local[a]) || 1) * box[best];
      p.copy(local).applyQuaternion(card.quaternion).add(card.position);
      moved = true;
    }
    if (p.z < -0.88) {
      p.z = -0.88;
      moved = true;
    }
    return moved;
  }

  const strapPts = rig.straps.map((s) => Array.from({ length: s.links.length + 2 }, () => V()));
  const xAxis = V();
  function frame(now: number) {
    raf = 0;
    if (disposed || document.hidden || !visible) return;
    raf = requestAnimationFrame(frame);
    const dt = Math.min((now - (last || now)) / 1000, 0.05);
    last = now;
    for (acc += dt; acc >= rig.world.timestep; acc -= rig.world.timestep) physicsStep();

    card.position.copy(rig.card.translation() as THREE.Vector3);
    card.quaternion.copy(rig.card.rotation() as THREE.Quaternion);
    card.updateMatrixWorld(true);
    for (const k of ['clasp', 'eye', 'yoke'] as const) {
      hw[k].position.copy(rig[k].translation() as THREE.Vector3);
      hw[k].quaternion.copy(rig[k].rotation() as THREE.Quaternion);
      hw[k].updateMatrixWorld(true);
    }
    inv.copy(card.quaternion).invert();
    rig.straps.forEach((s, i) => {
      const pts = strapPts[i];
      const n = s.links.length;
      pts[0].copy(s.anchor as THREE.Vector3);
      for (let j = 0; j < n - 1; j++) pts[j + 1].copy(s.links[j].translation() as THREE.Vector3);
      const at = s.attachment;
      pts[n].copy(hw.yoke.localToWorld(V(at.x + Math.sign(s.anchor.x) * 0.025, at.y + 0.055, at.z)));
      pts[n + 1].copy(hw.yoke.localToWorld(V(at.x, at.y, at.z)));
      straps[i].update(new THREE.CatmullRomCurve3(pts), xAxis.set(1, 0, 0).applyQuaternion(hw.yoke.quaternion), dt, pushOut);
    });
    renderer.render(scene, camera);
  }
  function wake() {
    last = 0;
    acc = 0;
    if (document.hidden || !visible) {
      cancelAnimationFrame(raf);
      raf = 0;
      up();
    } else if (!raf && !disposed) raf = requestAnimationFrame(frame);
  }
  // nothing runs while the cover is scrolled away or the tab is hidden
  const io = new IntersectionObserver(([e]) => {
    visible = e.isIntersecting;
    wake();
  });
  io.observe(canvas);
  document.addEventListener('visibilitychange', wake);

  // a small push so it is already swinging when it first appears
  if (!reduced.matches) rig.card.applyImpulseAtPoint({ x: 0.4, y: 0, z: 0.04 }, { x: 0, y: CARD_REST_Y - 0.7, z: 0 }, true);
  raf = requestAnimationFrame(frame);
  onState('live');

  return {
    dispose() {
      disposed = true;
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      document.removeEventListener('visibilitychange', wake);
      for (const [n, f] of listeners) canvas.removeEventListener(n, f as EventListener);
      const geos = new Set<THREE.BufferGeometry>();
      const mats = new Set<THREE.Material>();
      scene.traverse((o) => {
        if (o instanceof THREE.Mesh) {
          geos.add(o.geometry);
          mats.add(o.material as THREE.Material);
        }
      });
      geos.forEach((g) => g.dispose());
      mats.forEach((m) => m.dispose());
      [art, grain, wear, knit.bump, knit.map, knitFold.bump, knitFold.map].forEach((t) => t.dispose());
      key.shadow.dispose();
      env.dispose();
      rig.world.free();
      renderer.dispose();
    },
  };
}
