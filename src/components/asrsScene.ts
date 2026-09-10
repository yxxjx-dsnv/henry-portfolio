// The Incheon ASRS scene library: the warehouse around the robot — bins,
// cradles, decks, the elevator, the kiosk — built to read like the CAD
// renders, not like primitives. What earns that:
//
//   · chamfered edges everywhere an edge catches light (RoundedBoxGeometry)
//   · hollow, ribbed, lipped Euro containers — not solid blocks
//   · posts with a foot flange, a top collar, and pads on the star arms
//   · a kiosk that is actually showing its UI
//   · contact shadows under anything that touches the floor
//
// Everything here is generated geometry + canvas textures; the robot itself
// is the Blender GLB in asrsRobot.ts. All builders take the dynamically-
// imported three namespace and the RoundedBoxGeometry class, so three.js
// stays out of the main bundle.

import type { Group, InstancedMesh, Mesh, Object3D } from 'three';
import { PITCH, LEVEL_H } from './asrsFleet';

type ThreeNS = typeof import('three');
type RoundedBoxCtor = new (
  w: number,
  h: number,
  d: number,
  segments?: number,
  radius?: number,
) => import('three').BufferGeometry;

export { PITCH, LEVEL_H };
export const CRADLE_H = 0.088; // cradle arms — a stored bin's underside
export const DECK_REST = 0.0495; // deck top surface, deck down
export const DECK_LIFT = 0.0995; // deck top surface, deck up (11 mm over the cradle arms)
export const WHEEL_R = 0.03;

export type Kit = ReturnType<typeof makeKit>;

// ── canvas textures ────────────────────────────────────────────────────────

function floorTexture(THREE: ThreeNS, repeats: number) {
  const S = 512;
  const c = document.createElement('canvas');
  c.width = c.height = S;
  const g = c.getContext('2d')!;
  g.fillStyle = '#efeeec';
  g.fillRect(0, 0, S, S);
  for (let i = 0; i < 5200; i++) {
    g.fillStyle = `rgba(0,0,0,${Math.random() * 0.05})`;
    g.fillRect(Math.random() * S, Math.random() * S, 1.6, 1.6);
  }
  for (let i = 0; i < 900; i++) {
    g.fillStyle = `rgba(255,255,255,${Math.random() * 0.35})`;
    g.fillRect(Math.random() * S, Math.random() * S, 1.2, 1.2);
  }
  // guide lines through the centre, drawn soft so they anti-alias
  g.shadowColor = 'rgba(30,32,36,0.9)';
  g.shadowBlur = 2;
  g.fillStyle = '#26282c';
  g.fillRect(0, S / 2 - 8, S, 16);
  g.fillRect(S / 2 - 8, 0, 16, S);
  g.shadowBlur = 0;
  // worn centre of the lane
  g.fillStyle = 'rgba(255,255,255,0.08)';
  g.fillRect(0, S / 2 - 2, S, 4);
  g.fillRect(S / 2 - 2, 0, 4, S);
  // tile seams
  g.strokeStyle = 'rgba(120,116,110,0.55)';
  g.lineWidth = 3;
  g.strokeRect(1, 1, S - 2, S - 2);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(repeats, repeats);
  t.anisotropy = 8;
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/** The kiosk, actually showing its warehouse UI. */
function kioskTexture(THREE: ThreeNS) {
  const W = 256;
  const H = 384;
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const g = c.getContext('2d')!;
  g.fillStyle = '#0d1626';
  g.fillRect(0, 0, W, H);
  g.fillStyle = '#12203a';
  g.fillRect(0, 0, W, 46);
  g.fillStyle = '#e8ecf4';
  g.font = 'bold 17px monospace';
  g.fillText('INCHEON ASRS', 14, 29);
  g.fillStyle = '#35d07f';
  g.beginPath();
  g.arc(W - 22, 23, 5, 0, Math.PI * 2);
  g.fill();
  const rows = ['A12  ·  fasteners', 'B07  ·  bearings', 'C31  ·  seals', 'D02  ·  gaskets'];
  rows.forEach((r, i) => {
    const y = 66 + i * 44;
    g.fillStyle = i === 0 ? '#1c3157' : '#111d33';
    g.fillRect(12, y, W - 24, 34);
    g.fillStyle = i === 0 ? '#cfe0ff' : '#8fa1c0';
    g.font = '13px monospace';
    g.fillText(r, 22, y + 22);
  });
  // the mic button — the voice layer this whole story is about
  g.fillStyle = '#2f7bff';
  g.beginPath();
  g.arc(W / 2, H - 62, 34, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = '#ffffff';
  g.fillRect(W / 2 - 5, H - 80, 10, 24);
  g.beginPath();
  g.arc(W / 2, H - 56, 5, 0, Math.PI);
  g.fill();
  g.fillStyle = '#7f92b5';
  g.font = '11px monospace';
  g.fillText('hold to talk', W / 2 - 34, H - 16);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

// ── the kit ────────────────────────────────────────────────────────────────

export function makeKit(THREE: ThreeNS, RoundedBox?: RoundedBoxCtor) {
  const std = (color: number, roughness: number, metalness: number, extra = {}) =>
    new THREE.MeshStandardMaterial({ color, roughness, metalness, ...extra });
  const phys = (opts: ConstructorParameters<typeof THREE.MeshPhysicalMaterial>[0]) =>
    new THREE.MeshPhysicalMaterial(opts);

  const box = (w: number, h: number, d: number, r = 0.004) =>
    RoundedBox ? new RoundedBox(w, h, d, 2, Math.min(r, w / 2, h / 2, d / 2)) : new THREE.BoxGeometry(w, h, d);

  const kioskMap = kioskTexture(THREE);

  const mats = {
    floor: std(0xffffff, 0.55, 0.02),
    post: std(0xf6f4f0, 0.32, 0.03),
    cradle: std(0xf1efe9, 0.4, 0.03),
    slab: std(0xe9e6df, 0.58, 0.02),
    binBlue: phys({ color: 0x2434a4, roughness: 0.34, metalness: 0, clearcoat: 0.6, clearcoatRoughness: 0.3 }),
    binBlueIn: std(0x18246e, 0.7, 0),
    binBlack: phys({ color: 0x17181c, roughness: 0.42, metalness: 0.05, clearcoat: 0.4 }),
    binBlackIn: std(0x0b0c0f, 0.75, 0),
    flange: std(0xcfd3d8, 0.28, 0.9),
    darksteel: std(0x3a3d43, 0.4, 0.75),
    frame: std(0x131313, 0.4, 0.68),
    hoist: std(0xa8332c, 0.42, 0.35),
    kiosk: std(0x0c0d10, 0.36, 0.55),
    screen: std(0x10182a, 0.2, 0.15, { map: kioskMap, emissive: 0xffffff, emissiveMap: kioskMap, emissiveIntensity: 1.15 }),
  };

  const geos = {
    post: new THREE.CylinderGeometry(0.0165, 0.019, LEVEL_H, 14),
    postFoot: new THREE.CylinderGeometry(0.034, 0.04, 0.012, 14),
    postCollar: new THREE.CylinderGeometry(0.024, 0.024, 0.034, 14),
    cradleArm: box(0.105, 0.014, 0.034, 0.004),
    cradlePad: new THREE.BoxGeometry(0.02, 0.008, 0.034),
    binBody: box(0.555, 0.185, 0.375, 0.008),
    binCavity: new THREE.BoxGeometry(0.49, 0.02, 0.315),
    binLip: box(0.585, 0.03, 0.405, 0.006),
    binRib: new THREE.BoxGeometry(0.008, 0.155, 0.383),
    binRibX: new THREE.BoxGeometry(0.561, 0.155, 0.008),
    slab: box(PITCH * 0.985, 0.016, PITCH * 0.985, 0.004),
    unitPlane: new THREE.PlaneGeometry(1, 1),
  };

  const dispose = () => {
    mats.floor.map?.dispose(); // assigned later by makeFloor
    kioskMap.dispose();
    for (const m of Object.values(mats)) m.dispose();
    for (const g of Object.values(geos)) g.dispose();
  };
  return { mats, geos, box, dispose };
}

/** The ground plane, textured with the tile pattern and its guide lines. */
export function makeFloor(THREE: ThreeNS, kit: Kit, size = 18): Mesh {
  const tex = floorTexture(THREE, size / PITCH);
  tex.offset.set(0.5 - (size / PITCH) * 0.5, 0.5 - (size / PITCH) * 0.5);
  kit.mats.floor.map = tex;
  kit.mats.floor.needsUpdate = true;
  const floor = new THREE.Mesh(kit.geos.unitPlane, kit.mats.floor); // kit-owned unit plane
  floor.scale.set(size, size, 1);
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  return floor;
}

/** A Euro container: hollow, lipped, ribbed — reads as a container from every angle. */
export function makeBin(THREE: ThreeNS, kit: Kit, black = false): Group {
  const grp = new THREE.Group();
  const mat = black ? kit.mats.binBlack : kit.mats.binBlue;
  const inner = black ? kit.mats.binBlackIn : kit.mats.binBlueIn;
  const body = new THREE.Mesh(kit.geos.binBody, mat);
  body.position.y = 0.0925;
  const cavity = new THREE.Mesh(kit.geos.binCavity, inner);
  cavity.position.y = 0.176;
  const lip = new THREE.Mesh(kit.geos.binLip, mat);
  lip.position.y = 0.183;
  body.castShadow = lip.castShadow = true;
  grp.add(body, cavity, lip);
  for (const x of [-0.185, -0.062, 0.062, 0.185]) {
    const rib = new THREE.Mesh(kit.geos.binRib, mat);
    rib.position.set(x, 0.09, 0);
    grp.add(rib);
  }
  for (const z of [-0.125, 0, 0.125]) {
    const rib = new THREE.Mesh(kit.geos.binRibX, mat);
    rib.position.set(0, 0.09, z);
    grp.add(rib);
  }
  return grp;
}

/** Instanced cradles: posts spanning the level, with feet and collars, and
 *  star arms with pads at CRADLE_H — a bin sits on the arms, and a robot
 *  drives under it. */
export function makeCradleField(
  THREE: ThreeNS,
  kit: Kit,
  cells: Array<[number, number]>,
  y = 0,
): InstancedMesh[] {
  const n = cells.length * 4;
  const posts = new THREE.InstancedMesh(kit.geos.post, kit.mats.post, n);
  const feet = new THREE.InstancedMesh(kit.geos.postFoot, kit.mats.post, n);
  const collars = new THREE.InstancedMesh(kit.geos.postCollar, kit.mats.post, n);
  const arms = new THREE.InstancedMesh(kit.geos.cradleArm, kit.mats.cradle, n * 4);
  const pads = new THREE.InstancedMesh(kit.geos.cradlePad, kit.mats.cradle, n * 4);
  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const up = new THREE.Vector3(0, 1, 0);
  const one = new THREE.Vector3(1, 1, 1);
  let pi = 0;
  let ai = 0;
  for (const [cx, cz] of cells) {
    for (const [dx, dz] of [
      [-0.5, -0.5],
      [0.5, -0.5],
      [-0.5, 0.5],
      [0.5, 0.5],
    ] as const) {
      const x = (cx + dx) * PITCH;
      const z = (cz + dz) * PITCH;
      m.makeTranslation(x, y + LEVEL_H / 2, z);
      posts.setMatrixAt(pi, m);
      m.makeTranslation(x, y + 0.006, z);
      feet.setMatrixAt(pi, m);
      m.makeTranslation(x, y + CRADLE_H - 0.035, z);
      collars.setMatrixAt(pi, m);
      pi++;
      for (let k = 0; k < 4; k++) {
        q.setFromAxisAngle(up, (k * Math.PI) / 2);
        const off = new THREE.Vector3(0.056, 0, 0).applyQuaternion(q);
        m.compose(new THREE.Vector3(x + off.x, y + CRADLE_H - 0.011, z + off.z), q, one);
        arms.setMatrixAt(ai, m);
        const padOff = new THREE.Vector3(0.098, 0, 0).applyQuaternion(q);
        m.compose(new THREE.Vector3(x + padOff.x, y + CRADLE_H - 0.004, z + padOff.z), q, one);
        pads.setMatrixAt(ai, m);
        ai++;
      }
    }
  }
  const out = [posts, feet, collars, arms, pads];
  for (const o of out) {
    o.castShadow = true;
    o.receiveShadow = true;
  }
  return out;
}

/** The tile deck of an upper level. */
export function makeDeck(
  THREE: ThreeNS,
  kit: Kit,
  cells: Array<[number, number]>,
  y: number,
): InstancedMesh {
  const slabs = new THREE.InstancedMesh(kit.geos.slab, kit.mats.slab, cells.length);
  const m = new THREE.Matrix4();
  cells.forEach(([cx, cz], i) => {
    m.makeTranslation(cx * PITCH, y - 0.008, cz * PITCH); // top face at y
    slabs.setMatrixAt(i, m);
  });
  slabs.castShadow = slabs.receiveShadow = true;
  return slabs;
}

/** The decorative storage wall: the same cradles and decks as the working
 *  field, levels LEVEL_H apart, with real bin silhouettes instanced on top. */
export function makeBackBlock(
  THREE: ThreeNS,
  kit: Kit,
  cols: number,
  rows: number,
  levels: number,
  origin: { x: number; z: number },
): Object3D[] {
  const cells: Array<[number, number]> = [];
  for (let cx = 0; cx < cols; cx++)
    for (let rz = 0; rz < rows; rz++) cells.push([origin.x / PITCH + cx, origin.z / PITCH + rz]);
  const n = cells.length * levels;
  const bodiesB = new THREE.InstancedMesh(kit.geos.binBody, kit.mats.binBlue, n);
  const lipsB = new THREE.InstancedMesh(kit.geos.binLip, kit.mats.binBlue, n);
  const bodiesK = new THREE.InstancedMesh(kit.geos.binBody, kit.mats.binBlack, n);
  const lipsK = new THREE.InstancedMesh(kit.geos.binLip, kit.mats.binBlack, n);
  const out: Object3D[] = [];
  const m = new THREE.Matrix4();
  let bi = 0;
  let ki = 0;
  for (let l = 0; l < levels; l++) {
    const y = l * LEVEL_H;
    out.push(...makeCradleField(THREE, kit, cells, y));
    if (l > 0) out.push(makeDeck(THREE, kit, cells, y));
    cells.forEach(([cx, cz], i) => {
      const black = (i * 7 + l) % 5 === 0;
      m.makeTranslation(cx * PITCH, y + CRADLE_H + 0.0925, cz * PITCH);
      if (black) bodiesK.setMatrixAt(ki, m);
      else bodiesB.setMatrixAt(bi, m);
      m.makeTranslation(cx * PITCH, y + CRADLE_H + 0.183, cz * PITCH);
      if (black) lipsK.setMatrixAt(ki++, m);
      else lipsB.setMatrixAt(bi++, m);
    });
  }
  bodiesB.count = lipsB.count = bi;
  bodiesK.count = lipsK.count = ki;
  for (const o of [bodiesB, lipsB, bodiesK, lipsK]) {
    o.castShadow = true;
    o.receiveShadow = true;
    out.push(o);
  }
  return out;
}

/** The elevator: braced frame, hoist, cable, and a carriage that rides it. */
export function makeElevator(
  THREE: ThreeNS,
  kit: Kit,
  height: number,
): { group: Group; carriage: Group; cable: Mesh; hoistY: number } {
  const g = new THREE.Group();
  const colGeo = kit.box(0.032, height, 0.032, 0.004);
  for (const [dx, dz] of [
    [-0.335, -0.27],
    [0.335, -0.27],
    [-0.335, 0.27],
    [0.335, 0.27],
  ] as const) {
    const c = new THREE.Mesh(colGeo, kit.mats.frame);
    c.position.set(dx, height / 2, dz);
    c.castShadow = true;
    g.add(c);
  }
  for (const y of [height * 0.33, height * 0.66, height]) {
    for (const sz of [-0.27, 0.27]) {
      const tie = new THREE.Mesh(kit.box(0.71, 0.02, 0.02), kit.mats.frame);
      tie.position.set(0, y, sz);
      tie.castShadow = true;
      g.add(tie);
    }
    for (const sx of [-0.335, 0.335]) {
      const tie = new THREE.Mesh(kit.box(0.02, 0.02, 0.56), kit.mats.frame);
      tie.position.set(sx, y, 0);
      g.add(tie);
    }
  }
  // diagonal bracing on the back face
  for (const dir of [1, -1]) {
    const brace = new THREE.Mesh(
      new THREE.CylinderGeometry(0.007, 0.007, Math.hypot(0.67, height * 0.33), 8),
      kit.mats.darksteel,
    );
    brace.position.set(0, height * 0.5, 0.27);
    brace.rotation.z = dir * Math.atan2(0.67, height * 0.33);
    g.add(brace);
  }
  const hoistY = height + 0.02;
  const hoist = new THREE.Mesh(kit.box(0.2, 0.12, 0.14, 0.01), kit.mats.hoist);
  hoist.position.y = hoistY;
  hoist.castShadow = true;
  const drum = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.1, 14), kit.mats.darksteel);
  drum.rotation.z = Math.PI / 2;
  drum.position.y = hoistY - 0.08;
  g.add(hoist, drum);

  const cable = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, 1, 6), kit.mats.darksteel);
  g.add(cable);

  const carriage = new THREE.Group();
  const plate = new THREE.Mesh(kit.box(0.54, 0.016, 0.42, 0.005), kit.mats.flange);
  plate.castShadow = true;
  const yoke = new THREE.Mesh(kit.box(0.1, 0.05, 0.06, 0.008), kit.mats.darksteel);
  yoke.position.y = 0.033;
  carriage.add(plate, yoke);
  g.add(carriage);
  return { group: g, carriage, cable, hoistY };
}

/** The kiosk, with its UI on screen. */
export function makeKiosk(THREE: ThreeNS, kit: Kit): Group {
  const g = new THREE.Group();
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.17, 0.022, 26), kit.mats.kiosk);
  base.position.y = 0.011;
  const pole = new THREE.Mesh(kit.box(0.075, 0.9, 0.055, 0.01), kit.mats.kiosk);
  pole.position.y = 0.46;
  const bezel = new THREE.Mesh(kit.box(0.34, 0.47, 0.03, 0.008), kit.mats.kiosk);
  bezel.position.set(0, 1.06, 0);
  bezel.rotation.x = -0.16;
  const face = new THREE.Mesh(new THREE.PlaneGeometry(0.295, 0.42), kit.mats.screen);
  face.position.set(0, 1.058, 0.0165);
  face.rotation.x = -0.16;
  for (const o of [base, pole, bezel]) o.castShadow = true;
  g.add(base, pole, bezel, face);
  return g;
}
