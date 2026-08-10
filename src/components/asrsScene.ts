// The Incheon ASRS scene library, third pass — built to read like the CAD
// renders, not like primitives. What earns that:
//
//   · chamfered edges everywhere an edge catches light (RoundedBoxGeometry)
//   · hollow, ribbed, lipped Euro containers — not solid blocks
//   · the deck as the real part: brushed plate, cross slots, screw heads,
//     bolt-circle hub, L-shaped tabs riding the slots
//   · scissor links with pins at every joint
//   · posts with a foot flange, a top collar, and pads on the star arms
//   · a kiosk that is actually showing its UI
//   · contact shadows under anything that touches the floor
//
// Everything is generated geometry + canvas textures — no model files. All
// builders take the dynamically-imported three namespace and the
// RoundedBoxGeometry class, so three.js stays out of the main bundle.

import type { Group, InstancedMesh, Material, Mesh, Object3D } from 'three';
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
export const CRADLE_H = 0.32; // stored-bin underside — 24 mm above a carried bin's lip
export const DECK_REST = 0.086; // deck top surface, deck down
export const DECK_LIFT = 0.352; // deck top surface, deck up (32 mm over the cradle arms)
export const TAB_IN = 0.19; // tab centre distance from the hub, retracted
export const TAB_OUT = 0.282; // …run out, under the bin's rim
export const WHEEL_R = 0.05;

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

/** The deck plate, drawn as the real part: brushed aluminium, the cross of
 *  slots the tabs ride in, and the screw pattern from the photograph. */
function deckTexture(THREE: ThreeNS) {
  const W = 1024;
  const H = 768;
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const g = c.getContext('2d')!;
  g.fillStyle = '#c3c7cd';
  g.fillRect(0, 0, W, H);
  for (let i = 0; i < 5200; i++) {
    const y = Math.random() * H;
    g.strokeStyle = `rgba(255,255,255,${Math.random() * 0.08})`;
    g.beginPath();
    g.moveTo(0, y);
    g.lineTo(W, y + (Math.random() - 0.5) * 3);
    g.stroke();
  }
  for (let i = 0; i < 1600; i++) {
    const y = Math.random() * H;
    g.strokeStyle = `rgba(60,64,70,${Math.random() * 0.05})`;
    g.beginPath();
    g.moveTo(0, y);
    g.lineTo(W, y);
    g.stroke();
  }
  const cx = W / 2;
  const cy = H / 2;
  // the four slots the tabs travel in
  const slot = (x0: number, y0: number, x1: number, y1: number, w: number) => {
    g.strokeStyle = '#3a3d42';
    g.lineWidth = w;
    g.lineCap = 'round';
    g.beginPath();
    g.moveTo(x0, y0);
    g.lineTo(x1, y1);
    g.stroke();
    g.strokeStyle = 'rgba(255,255,255,0.35)';
    g.lineWidth = 1.5;
    g.beginPath();
    g.moveTo(x0, y0 + w / 2 + 1);
    g.lineTo(x1, y1 + w / 2 + 1);
    g.stroke();
  };
  slot(cx + 120, cy, W - 70, cy, 11);
  slot(cx - 120, cy, 70, cy, 11);
  slot(cx, cy + 100, cx, H - 60, 11);
  slot(cx, cy - 100, cx, 60, 11);
  // screw heads — countersunk dots with a catch-light
  const screw = (x: number, y: number, r = 7) => {
    g.fillStyle = '#7c8087';
    g.beginPath();
    g.arc(x, y, r, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = '#54575c';
    g.beginPath();
    g.arc(x, y, r * 0.55, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = 'rgba(255,255,255,0.5)';
    g.beginPath();
    g.arc(x - r * 0.25, y - r * 0.25, r * 0.2, 0, Math.PI * 2);
    g.fill();
  };
  for (const [fx, fy] of [
    [0.09, 0.12], [0.5, 0.09], [0.91, 0.12],
    [0.07, 0.5], [0.93, 0.5],
    [0.09, 0.88], [0.5, 0.91], [0.91, 0.88],
    [0.3, 0.28], [0.7, 0.28], [0.3, 0.72], [0.7, 0.72],
  ] as const)
    screw(fx * W, fy * H);
  const t = new THREE.CanvasTexture(c);
  t.anisotropy = 8;
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/** The blue hub disc: bolt circle and a centre boss, like the photo. */
function discTexture(THREE: ThreeNS) {
  const S = 256;
  const c = document.createElement('canvas');
  c.width = c.height = S;
  const g = c.getContext('2d')!;
  const grad = g.createRadialGradient(S / 2, S / 2, 10, S / 2, S / 2, S / 2);
  grad.addColorStop(0, '#2c5fd6');
  grad.addColorStop(0.75, '#1f4ac0');
  grad.addColorStop(1, '#173a9e');
  g.fillStyle = grad;
  g.fillRect(0, 0, S, S);
  g.strokeStyle = 'rgba(255,255,255,0.25)';
  g.lineWidth = 3;
  g.beginPath();
  g.arc(S / 2, S / 2, S * 0.42, 0, Math.PI * 2);
  g.stroke();
  for (let k = 0; k < 6; k++) {
    const a = (k / 6) * Math.PI * 2;
    const x = S / 2 + Math.cos(a) * S * 0.3;
    const y = S / 2 + Math.sin(a) * S * 0.3;
    g.fillStyle = '#cfd3d9';
    g.beginPath();
    g.arc(x, y, 9, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = '#5a5e66';
    g.beginPath();
    g.arc(x, y, 5, 0, Math.PI * 2);
    g.fill();
  }
  g.fillStyle = '#d7dade';
  g.beginPath();
  g.arc(S / 2, S / 2, 16, 0, Math.PI * 2);
  g.fill();
  const t = new THREE.CanvasTexture(c);
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

  const deckMap = deckTexture(THREE);
  const discMap = discTexture(THREE);
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
    chassis: std(0x0d0e11, 0.44, 0.45),
    chassisSide: std(0x131418, 0.36, 0.6),
    deck: phys({ color: 0xffffff, roughness: 0.3, metalness: 0.92, map: deckMap, clearcoat: 0.2 }),
    tab: std(0xd6dade, 0.2, 0.95),
    disc: phys({ color: 0xffffff, roughness: 0.3, metalness: 0.45, map: discMap, clearcoat: 0.55 }),
    hub: std(0x0e0f12, 0.48, 0.6),
    flange: std(0xcfd3d8, 0.28, 0.9),
    roller: std(0xb9ac97, 0.75, 0.05),
    steel: std(0x9aa0a8, 0.26, 0.92),
    darksteel: std(0x3a3d43, 0.4, 0.75),
    frame: std(0x131313, 0.4, 0.68),
    hoist: std(0xa8332c, 0.42, 0.35),
    kiosk: std(0x0c0d10, 0.36, 0.55),
    screen: std(0x10182a, 0.2, 0.15, { map: kioskMap, emissive: 0xffffff, emissiveMap: kioskMap, emissiveIntensity: 1.15 }),
    led: std(0x0c2016, 0.4, 0.2, { emissive: 0x35d07f, emissiveIntensity: 3 }),
    board: std(0x14532d, 0.7, 0.1),
  };

  const geos = {
    post: new THREE.CylinderGeometry(0.0165, 0.019, CRADLE_H, 14),
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
    hub: new THREE.CylinderGeometry(0.043, 0.043, 0.03, 22),
    hubFlange: new THREE.CylinderGeometry(0.05, 0.05, 0.007, 22),
    bolt: new THREE.CylinderGeometry(0.0035, 0.0035, 0.009, 6),
    roller: new THREE.CapsuleGeometry(0.0115, 0.027, 3, 10),
    disc: new THREE.CylinderGeometry(0.076, 0.076, 0.012, 40),
    pin: new THREE.CylinderGeometry(0.006, 0.006, 0.03, 10),
    unitPlane: new THREE.PlaneGeometry(1, 1),
  };

  const dispose = () => {
    mats.floor.map?.dispose(); // assigned later by makeFloor
    for (const t of [deckMap, discMap, kioskMap]) t.dispose();
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

/** Instanced cradles: posts with feet and collars, star arms with pads. */
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
      m.makeTranslation(x, y + CRADLE_H / 2, z);
      posts.setMatrixAt(pi, m);
      m.makeTranslation(x, y + 0.006, z);
      feet.setMatrixAt(pi, m);
      m.makeTranslation(x, y + CRADLE_H - 0.02, z);
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

/** The decorative storage wall: real bin silhouettes, instanced. */
export function makeBackBlock(
  THREE: ThreeNS,
  kit: Kit,
  cols: number,
  rows: number,
  levels: number,
  origin: { x: number; z: number },
): Object3D[] {
  const n = cols * rows * levels;
  const slabs = new THREE.InstancedMesh(kit.geos.slab, kit.mats.slab, n);
  const posts = new THREE.InstancedMesh(kit.geos.post, kit.mats.post, n * 4);
  const bodiesB = new THREE.InstancedMesh(kit.geos.binBody, kit.mats.binBlue, n);
  const lipsB = new THREE.InstancedMesh(kit.geos.binLip, kit.mats.binBlue, n);
  const bodiesK = new THREE.InstancedMesh(kit.geos.binBody, kit.mats.binBlack, n);
  const lipsK = new THREE.InstancedMesh(kit.geos.binLip, kit.mats.binBlack, n);
  const m = new THREE.Matrix4();
  let si = 0;
  let pi = 0;
  let bi = 0;
  let ki = 0;
  for (let l = 0; l < levels; l++) {
    const y = CRADLE_H + l * (CRADLE_H + 0.04);
    for (let cx = 0; cx < cols; cx++) {
      for (let rz = 0; rz < rows; rz++) {
        const x = origin.x + cx * PITCH;
        const z = origin.z + rz * PITCH;
        m.makeTranslation(x, y, z);
        slabs.setMatrixAt(si++, m);
        for (const [dx, dz] of [
          [-0.5, -0.5],
          [0.5, -0.5],
          [-0.5, 0.5],
          [0.5, 0.5],
        ] as const) {
          m.makeTranslation(x + dx * PITCH, y - CRADLE_H / 2, z + dz * PITCH);
          posts.setMatrixAt(pi++, m);
        }
        const black = (cx * 7 + rz * 3 + l) % 5 === 0;
        m.makeTranslation(x, y + 0.1, z);
        if (black) bodiesK.setMatrixAt(ki, m);
        else bodiesB.setMatrixAt(bi, m);
        m.makeTranslation(x, y + 0.19, z);
        if (black) lipsK.setMatrixAt(ki++, m);
        else lipsB.setMatrixAt(bi++, m);
      }
    }
  }
  bodiesB.count = lipsB.count = bi;
  bodiesK.count = lipsK.count = ki;
  const out = [slabs, posts, bodiesB, lipsB, bodiesK, lipsK];
  for (const o of out) {
    o.castShadow = true;
    o.receiveShadow = true;
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

export type Robot = {
  group: Group;
  deck: Group;
  setLift: (t: number) => void;
  setGrip: (t: number, spin: number) => void;
  /** Per-wheel mecanum spin from a world-space move (dx, dz metres). */
  roll: (dx: number, dz: number) => void;
  /** Ghost the shell to show the working parts, like the CAD x-ray renders. */
  setXray: (on: boolean) => void;
  dispose: () => void;
};

/**
 * The robot. Chassis with chamfers and wheel bays, four mecanum wheels with
 * bolted flanges, a pinned scissor, and the deck: brushed plate with its slot
 * cross and screws, the blue bolt-circle hub, and four L-tabs the hub runs
 * outward. X-ray keeps the shell as glass instead of hiding it.
 */
export function makeRobot(THREE: ThreeNS, kit: Kit): Robot {
  const group = new THREE.Group();
  const guts: Object3D[] = [];

  // per-robot clones of the shell materials, so x-ray can ghost this robot only
  const shellMats: Material[] = [];
  const clone = <T extends Material>(m: T): T => {
    const c = m.clone() as T;
    shellMats.push(c);
    return c;
  };
  const chassisMat = clone(kit.mats.chassis);
  const sideMat = clone(kit.mats.chassisSide);
  const deckMat = clone(kit.mats.deck);
  const tabMat = clone(kit.mats.tab);
  const discMat = clone(kit.mats.disc);
  const hubMat = clone(kit.mats.hub);
  const flangeMat = clone(kit.mats.flange);
  const rollerMat = clone(kit.mats.roller);

  const chassis = new THREE.Mesh(kit.box(0.5, 0.056, 0.34, 0.01), chassisMat);
  chassis.position.y = 0.055;
  chassis.castShadow = true;
  group.add(chassis);

  // one centre rail per side; the corners stay open as wheel bays
  for (const sz of [-1, 1]) {
    const rail = new THREE.Mesh(kit.box(0.2, 0.05, 0.026, 0.008), sideMat);
    rail.position.set(0, 0.052, sz * 0.192);
    rail.castShadow = true;
    group.add(rail);
  }
  const led = new THREE.Mesh(new THREE.SphereGeometry(0.0075, 12, 10), kit.mats.led);
  led.position.set(0.2, 0.06, 0.176);
  group.add(led);

  // internals — solid in x-ray
  const board = new THREE.Mesh(kit.box(0.13, 0.007, 0.09, 0.002), kit.mats.board);
  board.position.set(-0.1, 0.075, 0.05);
  guts.push(board);
  group.add(board);
  const motorGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.065, 14);
  for (const [sx, sz] of [
    [-1, -1],
    [1, -1],
    [-1, 1],
    [1, 1],
  ] as const) {
    const motor = new THREE.Mesh(motorGeo, kit.mats.darksteel);
    motor.rotation.x = Math.PI / 2;
    motor.position.set(sx * 0.17, 0.052, sz * 0.13);
    guts.push(motor);
    group.add(motor);
  }
  for (const sz of [-1, 1]) {
    const lin = new THREE.Mesh(kit.box(0.34, 0.01, 0.014, 0.003), kit.mats.steel);
    lin.position.set(0, 0.085, sz * 0.09);
    guts.push(lin);
    group.add(lin);
  }

  // ── mecanum wheels: hub, bolted flanges, angled rollers, in open bays ──
  const wheels: Array<{ spin: Group; sign: number }> = [];
  for (const [sx, sz] of [
    [-1, -1],
    [1, -1],
    [-1, 1],
    [1, 1],
  ] as const) {
    const wheel = new THREE.Group();
    const spin = new THREE.Group();
    const hub = new THREE.Mesh(kit.geos.hub, hubMat);
    hub.rotation.x = Math.PI / 2;
    spin.add(hub);
    for (const fz of [-1, 1]) {
      const fl = new THREE.Mesh(kit.geos.hubFlange, flangeMat);
      fl.rotation.x = Math.PI / 2;
      fl.position.z = fz * 0.016;
      spin.add(fl);
      for (let k = 0; k < 6; k++) {
        const a = (k / 6) * Math.PI * 2 + (fz > 0 ? 0.3 : 0);
        const bolt = new THREE.Mesh(kit.geos.bolt, kit.mats.darksteel);
        bolt.rotation.x = Math.PI / 2;
        bolt.position.set(Math.cos(a) * 0.032, Math.sin(a) * 0.032, fz * 0.017);
        spin.add(bolt);
      }
    }
    for (let k = 0; k < 8; k++) {
      const roller = new THREE.Mesh(kit.geos.roller, rollerMat);
      const a = (k / 8) * Math.PI * 2;
      roller.position.set(Math.cos(a) * 0.046, Math.sin(a) * 0.046, 0);
      roller.rotation.set(0, (sx * sz * Math.PI) / 4, a + Math.PI / 2);
      spin.add(roller);
    }
    wheel.add(spin);
    wheel.position.set(sx * 0.205, WHEEL_R, sz * 0.185);
    wheel.castShadow = true;
    wheels.push({ spin, sign: -sx * sz });
    group.add(wheel);
  }

  // ── the scissor, pinned at every joint ──
  const barGeo = kit.box(0.28, 0.009, 0.016, 0.003);
  const bars: Mesh[] = [];
  for (const sz of [-1, 1]) {
    for (const dir of [-1, 1]) {
      const bar = new THREE.Mesh(barGeo, kit.mats.steel);
      bar.position.z = sz * 0.125;
      bar.userData.dir = dir;
      bars.push(bar);
      group.add(bar);
      guts.push(bar);
    }
    const centre = new THREE.Mesh(kit.geos.pin, kit.mats.darksteel);
    centre.rotation.x = Math.PI / 2;
    centre.position.z = sz * 0.125;
    centre.userData.centre = true;
    bars.push(centre as unknown as Mesh);
    group.add(centre);
    guts.push(centre);
  }
  const pinEnds: Mesh[] = [];
  for (const sz of [-1, 1]) {
    for (const sx of [-1, 1]) {
      for (const top of [0, 1]) {
        const pin = new THREE.Mesh(kit.geos.pin, kit.mats.darksteel);
        pin.rotation.x = Math.PI / 2;
        pin.userData = { sx, sz, top };
        pinEnds.push(pin);
        group.add(pin);
        guts.push(pin);
      }
    }
  }

  // ── the deck ──
  const deck = new THREE.Group();
  const plate = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.013, 0.365), deckMat);
  plate.castShadow = true;
  deck.add(plate);
  const hubGrp = new THREE.Group();
  const disc = new THREE.Mesh(kit.geos.disc, discMat);
  disc.position.y = 0.012;
  hubGrp.add(disc);
  deck.add(hubGrp);

  const tabs: Group[] = [];
  for (let k = 0; k < 4; k++) {
    const tab = new THREE.Group();
    const blade = new THREE.Mesh(kit.box(0.108, 0.005, 0.06, 0.002), tabMat);
    const lip = new THREE.Mesh(kit.box(0.006, 0.03, 0.06, 0.002), tabMat);
    lip.position.set(0.051, 0.017, 0);
    blade.castShadow = true;
    tab.add(blade, lip);
    tab.rotation.y = (k * Math.PI) / 2;
    tab.position.y = 0.0095;
    tab.userData.angle = (k * Math.PI) / 2;
    tabs.push(tab);
    deck.add(tab);
  }
  group.add(deck);

  const setLift = (t: number) => {
    // slight S-curve so the mechanism starts and stops like a machine, not a cursor
    const e = t * t * (3 - 2 * t);
    const yTop = DECK_REST + e * (DECK_LIFT - DECK_REST);
    deck.position.y = yTop - 0.0065;
    const rise = deck.position.y - 0.086;
    const angle = Math.asin(Math.min(0.95, Math.max(0.02, rise / 0.28)));
    const half = 0.14 * Math.cos(angle);
    for (const bar of bars) {
      if ((bar.userData as { centre?: boolean }).centre) {
        bar.position.y = 0.086 + rise / 2;
        continue;
      }
      bar.position.y = 0.086 + rise / 2;
      bar.rotation.z = (bar.userData.dir as number) * angle;
    }
    for (const pin of pinEnds) {
      const { sx, top } = pin.userData as { sx: number; top: number };
      pin.position.x = sx * half;
      pin.position.y = top ? deck.position.y - 0.006 : 0.088;
      pin.position.z = (pin.userData as { sz: number }).sz * 0.125;
    }
  };

  const setGrip = (t: number, spin: number) => {
    hubGrp.rotation.y = spin;
    const r = TAB_IN + t * (TAB_OUT - TAB_IN);
    for (const tab of tabs) {
      const a = tab.userData.angle as number;
      tab.position.x = Math.cos(a) * r;
      tab.position.z = -Math.sin(a) * r;
    }
  };

  const roll = (dx: number, dz: number) => {
    for (const w of wheels) {
      w.spin.rotation.z -= (dx + w.sign * dz) / WHEEL_R;
    }
  };

  const setXray = (on: boolean) => {
    for (const m of shellMats) {
      m.transparent = on;
      m.opacity = on ? 0.16 : 1;
      m.depthWrite = !on;
      m.needsUpdate = true;
    }
    for (const o of guts) o.visible = true; // guts always drawn; the shell reveals them
  };

  const dispose = () => {
    for (const m of shellMats) m.dispose();
    barGeo.dispose();
  };

  setLift(0);
  setGrip(0, 0);
  setXray(false);
  return { group, deck, setLift, setGrip, roll, setXray, dispose };
}
