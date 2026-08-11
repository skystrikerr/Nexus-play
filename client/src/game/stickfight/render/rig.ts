/**
 * Turns a Skeleton into three.js geometry: an inked, tapered body with hands,
 * boots and a face, the character's props, physics-driven cloth, and a trail
 * off the weapon while it swings.
 *
 * Layering is done with real depth (see ORDER); everything is unlit and flat,
 * which is what gives the game its 2D look inside a real 3D scene.
 */

import * as THREE from "three";
import { BONES, type Skeleton } from "../skeleton";
import type { FighterDef, PropDef, ShapePart } from "../types";
import { ClothStrip } from "./cloth";
import {
  bootGeometry,
  eyeGeometry,
  handGeometry,
  headGeometry,
  limbGeometry,
  rigMaterial,
} from "./shapes";
import { WeaponTrail } from "./trail";

const ORDER = {
  cloth: 14,
  shadow: 10,
  backProp: 18,
  backLimb: 20,
  body: 30,
  frontLimb: 40,
  head: 46,
  face: 48,
  frontProp: 50,
  trail: 52,
};

const DEG = Math.PI / 180;
const OUTLINE = 2.1;

/** Limb widths: [radius at the body end, radius at the far end]. */
const LIMB: Record<string, [number, number, number]> = {
  // name: [nominal length, rStart, rEnd]
  thigh: [BONES.thigh, 6.6, 5.2],
  shin: [BONES.shin, 5.2, 3.9],
  upperArm: [BONES.upperArm, 5.4, 4.3],
  foreArm: [BONES.foreArm, 4.3, 3.3],
  spine: [BONES.spine, 8.6, 6.4],
  neck: [BONES.neck + BONES.headR * 0.55, 4.4, 3.6],
};

/** One drawn limb: an outline shape behind a shaded fill. */
class Limb {
  readonly group = new THREE.Group();
  private fill: THREE.Mesh;
  private line: THREE.Mesh;
  private nominal: number;

  constructor(
    nominal: number,
    rStart: number,
    rEnd: number,
    fillColor: string,
    outlineMat: THREE.Material,
    order: number,
    back: boolean,
  ) {
    this.nominal = nominal;
    const shade = back
      ? { color: fillColor, highlight: 0.06, shade: 0.42 }
      : { color: fillColor, highlight: 0.24, shade: 0.28 };

    this.line = new THREE.Mesh(limbGeometry(nominal, rStart, rEnd, OUTLINE), outlineMat);
    this.line.renderOrder = order - 1;
    this.line.position.z = -0.5;

    const fillMat = rigMaterial(fillColor, { vertexColors: true });
    this.fill = new THREE.Mesh(limbGeometry(nominal, rStart, rEnd, 0, shade), fillMat);
    this.fill.renderOrder = order;

    this.group.add(this.line, this.fill);
    this.group.position.z = order;
  }

  get material(): THREE.MeshBasicMaterial {
    return this.fill.material as THREE.MeshBasicMaterial;
  }

  set(ax: number, ay: number, bx: number, by: number) {
    const dx = bx - ax;
    const dy = by - ay;
    const len = Math.hypot(dx, dy) || 0.001;
    this.group.position.x = ax;
    this.group.position.y = ay;
    this.group.rotation.z = Math.atan2(dy, dx);
    // Bone lengths are fixed, so this is 1 except when a pose squashes the
    // body or a ragdoll stretches a joint.
    const stretch = len / this.nominal;
    this.line.scale.x = stretch;
    this.fill.scale.x = stretch;
  }

  dispose() {
    this.line.geometry.dispose();
    this.fill.geometry.dispose();
    (this.fill.material as THREE.Material).dispose();
  }
}

interface PropMesh {
  def: PropDef;
  group: THREE.Group;
  cloth?: ClothStrip;
}

export class StickRig {
  readonly group = new THREE.Group();
  /** Cloth and trails live in world space, so they sit outside the body group. */
  readonly worldGroup = new THREE.Group();

  private limbs: Record<string, Limb> = {};
  private head!: THREE.Mesh;
  private headOutline!: THREE.Mesh;
  private eye!: THREE.Mesh;
  private brow!: THREE.Mesh;
  private hands: THREE.Mesh[] = [];
  private handOutlines: THREE.Mesh[] = [];
  private boots: THREE.Mesh[] = [];
  private bootOutlines: THREE.Mesh[] = [];
  private shadow!: THREE.Mesh;
  private props: PropMesh[] = [];
  private materials: THREE.Material[] = [];
  private tinted: { mesh: THREE.Mesh; base: THREE.Color }[] = [];
  private trail: WeaponTrail | null = null;
  private trailReach = 0;
  private trailAttach: "handF" | "handB" = "handF";
  private def: FighterDef;
  private scale: number;

  constructor(def: FighterDef) {
    this.def = def;
    this.scale = def.stats.scale;
    const p = def.palette;

    const outline = rigMaterial(p.outline);
    this.materials.push(outline);

    const addLimb = (name: string, spec: [number, number, number], back: boolean, order: number) => {
      const limb = new Limb(spec[0], spec[1], spec[2], p.body, outline, order, back);
      this.group.add(limb.group);
      this.limbs[name] = limb;
    };

    addLimb("thighB", LIMB.thigh, true, ORDER.backLimb);
    addLimb("shinB", LIMB.shin, true, ORDER.backLimb + 1);
    addLimb("upperArmB", LIMB.upperArm, true, ORDER.backLimb + 2);
    addLimb("foreArmB", LIMB.foreArm, true, ORDER.backLimb + 3);
    addLimb("spine", LIMB.spine, false, ORDER.body);
    addLimb("neck", LIMB.neck, false, ORDER.body + 1);
    addLimb("thighF", LIMB.thigh, false, ORDER.frontLimb);
    addLimb("shinF", LIMB.shin, false, ORDER.frontLimb + 1);
    addLimb("upperArmF", LIMB.upperArm, false, ORDER.frontLimb + 2);
    addLimb("foreArmF", LIMB.foreArm, false, ORDER.frontLimb + 3);

    // Hands and boots ------------------------------------------------------
    for (let i = 0; i < 2; i++) {
      const back = i === 1;
      const order = back ? ORDER.backLimb + 4 : ORDER.frontLimb + 4;
      const shade = { color: p.body, highlight: back ? 0.05 : 0.2, shade: back ? 0.42 : 0.26 };

      const handLine = new THREE.Mesh(handGeometry(4.4, OUTLINE), outline);
      handLine.renderOrder = order - 1;
      handLine.position.z = order - 0.5;
      const hand = new THREE.Mesh(handGeometry(4.4, 0, shade), rigMaterial(p.body, { vertexColors: true }));
      hand.renderOrder = order;
      hand.position.z = order;
      this.materials.push(hand.material as THREE.Material);
      this.group.add(handLine, hand);
      this.hands.push(hand);
      this.handOutlines.push(handLine);

      const bootLine = new THREE.Mesh(bootGeometry(BONES.foot + 4, 7, OUTLINE), outline);
      bootLine.renderOrder = order - 1;
      bootLine.position.z = order - 0.5;
      const boot = new THREE.Mesh(
        bootGeometry(BONES.foot + 4, 7, 0, { color: p.cloth, highlight: 0.18, shade: back ? 0.44 : 0.3 }),
        rigMaterial(p.cloth, { vertexColors: true }),
      );
      boot.renderOrder = order;
      boot.position.z = order;
      this.materials.push(boot.material as THREE.Material);
      this.group.add(bootLine, boot);
      this.boots.push(boot);
      this.bootOutlines.push(bootLine);
    }

    // Head -----------------------------------------------------------------
    this.headOutline = new THREE.Mesh(headGeometry(BONES.headR, OUTLINE), outline);
    this.headOutline.renderOrder = ORDER.head - 1;
    this.headOutline.position.z = ORDER.head - 0.5;
    this.head = new THREE.Mesh(
      headGeometry(BONES.headR, 0, { color: p.body, highlight: 0.26, shade: 0.24 }),
      rigMaterial(p.body, { vertexColors: true }),
    );
    this.head.renderOrder = ORDER.head;
    this.head.position.z = ORDER.head;
    this.materials.push(this.head.material as THREE.Material);

    this.eye = new THREE.Mesh(eyeGeometry(BONES.headR), rigMaterial(p.outline));
    this.eye.renderOrder = ORDER.face;
    this.eye.position.z = ORDER.face;
    this.brow = new THREE.Mesh(new THREE.PlaneGeometry(BONES.headR * 0.8, BONES.headR * 0.16), rigMaterial(p.outline));
    this.brow.renderOrder = ORDER.face;
    this.brow.position.z = ORDER.face;
    this.group.add(this.headOutline, this.head, this.eye, this.brow);

    this.tinted = [
      ...Object.values(this.limbs).map((l) => ({ mesh: l as unknown as THREE.Mesh, base: new THREE.Color(p.body) })),
    ];

    // Ground shadow --------------------------------------------------------
    const shadowMat = rigMaterial("#000000", { opacity: 0.3 });
    this.materials.push(shadowMat);
    this.shadow = new THREE.Mesh(new THREE.CircleGeometry(1, 20), shadowMat);
    this.shadow.renderOrder = ORDER.shadow;

    // Props, cloth and trail ----------------------------------------------
    for (const prop of def.props) {
      const g = this.buildProp(prop);
      const entry: PropMesh = { def: prop, group: g };
      if (prop.cloth) {
        entry.cloth = new ClothStrip(prop.cloth, ORDER.cloth);
        this.worldGroup.add(entry.cloth.mesh);
      }
      this.props.push(entry);
      this.group.add(g);

      // The furthest point of a hand-held prop is the weapon tip.
      if (prop.attach === "handF" || prop.attach === "handB") {
        const reach = Math.max(...prop.parts.map((part) => partReach(part)));
        if (reach > this.trailReach) {
          this.trailReach = reach;
          this.trailAttach = prop.attach;
        }
      }
    }

    if (this.trailReach > 24) {
      this.trail = new WeaponTrail(def.palette.metal, ORDER.trail);
      this.worldGroup.add(this.trail.mesh);
    }
  }

  get shadowMesh(): THREE.Mesh {
    return this.shadow;
  }

  private buildProp(def: PropDef): THREE.Group {
    const g = new THREE.Group();
    for (const part of def.parts) {
      const mesh = this.buildPart(part);
      const order = part.behind ? ORDER.backProp : ORDER.frontProp + (part.z ?? 0);
      mesh.renderOrder = order;
      mesh.position.z = order;
      g.add(mesh);
    }
    return g;
  }

  private buildPart(part: ShapePart): THREE.Mesh {
    const color = part.color ?? this.def.palette.metal;
    // Props get the same across-the-form gradient as limbs so they sit in the
    // same world as the body instead of reading as stickers.
    const shaded = part.geo !== "disc" && part.geo !== "sphere";
    let geo: THREE.BufferGeometry;

    switch (part.geo) {
      case "box":
        geo = new THREE.PlaneGeometry(part.size[0], part.size[1]);
        break;
      case "cyl":
        geo = new THREE.PlaneGeometry(part.size[0] * 2, part.size[1]);
        break;
      case "sphere":
      case "disc":
        geo = new THREE.CircleGeometry(part.size[0], 18);
        break;
      case "cone": {
        const shape = new THREE.Shape();
        const r = part.size[0];
        const h = part.size[1];
        shape.moveTo(-r, -h / 2);
        shape.lineTo(r, -h / 2);
        shape.lineTo(0, h / 2);
        shape.closePath();
        geo = new THREE.ShapeGeometry(shape);
        break;
      }
      case "tri": {
        const shape = new THREE.Shape();
        const w = part.size[0];
        const h = part.size[1];
        shape.moveTo(-w / 2, -h / 2);
        shape.lineTo(w / 2, -h / 2);
        shape.lineTo(0, h / 2);
        shape.closePath();
        geo = new THREE.ShapeGeometry(shape);
        break;
      }
      case "blade": {
        const len = part.size[0];
        const w = part.size[1];
        const taper = part.size[2] ?? 0.5;
        const shape = new THREE.Shape();
        shape.moveTo(-len / 2, -w / 2);
        shape.quadraticCurveTo(0, -w * 0.9, len / 2, -w * taper * 0.4);
        shape.lineTo(len / 2 + w * 0.7, 0);
        shape.lineTo(len / 2, w * taper);
        shape.quadraticCurveTo(0, w * 0.6, -len / 2, w / 2);
        shape.closePath();
        geo = new THREE.ShapeGeometry(shape, 12);
        break;
      }
      default:
        geo = new THREE.PlaneGeometry(part.size[0], part.size[1] ?? part.size[0]);
    }

    let mat: THREE.MeshBasicMaterial;
    if (shaded) {
      applyPartShading(geo, color);
      mat = rigMaterial(color, { vertexColors: true });
    } else {
      mat = rigMaterial(color);
    }
    this.materials.push(mat);

    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(part.pos[0], part.pos[1], 0);
    if (part.rot) mesh.rotation.z = part.rot * DEG;
    return mesh;
  }

  /**
   * Applies a posed skeleton.
   */
  update(
    sk: Skeleton,
    opts: {
      x: number;
      y: number;
      z?: number;
      facing: 1 | -1;
      visibleProps: Set<string>;
      hiddenProps: Set<string>;
      flash: number;
      airborne: boolean;
      /** Horizontal speed, used to make cloth trail behind movement. */
      speed?: number;
      /** True while an attack is live, so the weapon leaves a trail. */
      swinging?: boolean;
    },
  ) {
    const g = this.group;
    g.position.set(opts.x, opts.y, opts.z ?? 0);
    g.scale.set(opts.facing * this.scale, this.scale, 1);
    g.rotation.z = sk.spin * DEG;

    const L = this.limbs;
    L.thighB.set(sk.pelvis.x, sk.pelvis.y, sk.kneeB.x, sk.kneeB.y);
    L.shinB.set(sk.kneeB.x, sk.kneeB.y, sk.footB.x, sk.footB.y);
    L.upperArmB.set(sk.neck.x, sk.neck.y, sk.elbowB.x, sk.elbowB.y);
    L.foreArmB.set(sk.elbowB.x, sk.elbowB.y, sk.handB.x, sk.handB.y);
    L.spine.set(sk.pelvis.x, sk.pelvis.y, sk.neck.x, sk.neck.y);
    L.neck.set(sk.neck.x, sk.neck.y, sk.head.x, sk.head.y);
    L.thighF.set(sk.pelvis.x, sk.pelvis.y, sk.kneeF.x, sk.kneeF.y);
    L.shinF.set(sk.kneeF.x, sk.kneeF.y, sk.footF.x, sk.footF.y);
    L.upperArmF.set(sk.neck.x, sk.neck.y, sk.elbowF.x, sk.elbowF.y);
    L.foreArmF.set(sk.elbowF.x, sk.elbowF.y, sk.handF.x, sk.handF.y);

    // Hands follow the forearm; boots follow the shin.
    const placeHand = (i: number, x: number, y: number, angle: number) => {
      this.hands[i].position.set(x, y, this.hands[i].position.z);
      this.handOutlines[i].position.set(x, y, this.handOutlines[i].position.z);
      this.hands[i].rotation.z = (angle - 90) * DEG;
      this.handOutlines[i].rotation.z = this.hands[i].rotation.z;
    };
    placeHand(0, sk.handF.x, sk.handF.y, sk.foreAngleF);
    placeHand(1, sk.handB.x, sk.handB.y, sk.foreAngleB);

    const placeBoot = (i: number, foot: { x: number; y: number }, toe: { x: number; y: number }) => {
      const angle = Math.atan2(toe.y - foot.y, toe.x - foot.x);
      this.boots[i].position.set(foot.x, foot.y, this.boots[i].position.z);
      this.bootOutlines[i].position.set(foot.x, foot.y, this.bootOutlines[i].position.z);
      this.boots[i].rotation.z = angle;
      this.bootOutlines[i].rotation.z = angle;
    };
    placeBoot(0, sk.footF, sk.toeF);
    placeBoot(1, sk.footB, sk.toeB);

    // Head, with the face turned along the body's facing.
    const headAngle = (sk.torsoAngle + (sk.head.x - sk.neck.x) * 0.4) * DEG;
    this.head.position.set(sk.head.x, sk.head.y, this.head.position.z);
    this.headOutline.position.set(sk.head.x, sk.head.y, this.headOutline.position.z);
    this.head.rotation.z = -headAngle * 0.35;
    this.headOutline.rotation.z = this.head.rotation.z;

    const faceCos = Math.cos(this.head.rotation.z);
    const faceSin = Math.sin(this.head.rotation.z);
    const place = (mesh: THREE.Mesh, lx: number, ly: number) => {
      mesh.position.set(
        sk.head.x + lx * faceCos - ly * faceSin,
        sk.head.y + lx * faceSin + ly * faceCos,
        mesh.position.z,
      );
      mesh.rotation.z = this.head.rotation.z;
    };
    place(this.eye, BONES.headR * 0.42, BONES.headR * 0.12);
    place(this.brow, BONES.headR * 0.34, BONES.headR * 0.46);

    // Props ---------------------------------------------------------------
    for (const prop of this.props) {
      const visible =
        (!prop.def.conditional || opts.visibleProps.has(prop.def.id)) && !opts.hiddenProps.has(prop.def.id);
      prop.group.visible = visible;
      if (prop.cloth) prop.cloth.mesh.visible = visible;
      if (!visible) continue;
      const t = attachTransform(sk, prop.def.attach);
      prop.group.position.set(t.x, t.y, prop.group.position.z);
      prop.group.rotation.z = t.rot * DEG;

      if (prop.cloth) {
        // Cloth is simulated in world space so it keeps its own momentum.
        const wx = opts.x + t.x * opts.facing * this.scale;
        const wy = opts.y + t.y * this.scale;
        prop.cloth.update(wx, wy, opts.facing, opts.speed ?? 0);
      }
    }

    // Weapon trail --------------------------------------------------------
    if (this.trail) {
      const attach = attachTransform(sk, this.trailAttach);
      if (opts.swinging) {
        const a = attach.rot * DEG;
        const tipLocalX = attach.x + Math.cos(a) * this.trailReach;
        const tipLocalY = attach.y + Math.sin(a) * this.trailReach;
        this.trail.push(
          opts.x + tipLocalX * opts.facing * this.scale,
          opts.y + tipLocalY * this.scale,
          opts.x + attach.x * opts.facing * this.scale,
          opts.y + attach.y * this.scale,
        );
      } else {
        this.trail.fade();
      }
      this.trail.update();
    }

    // Ground shadow shrinks as the fighter rises.
    const lift = Math.max(0, opts.y);
    const shrink = Math.max(0.35, 1 - lift / 260);
    this.shadow.position.set(opts.x, 1.5, ORDER.shadow + (opts.z ?? 0));
    this.shadow.scale.set(26 * shrink * this.scale, 6 * shrink, 1);
    (this.shadow.material as THREE.MeshBasicMaterial).opacity = 0.3 * shrink;

    // White flash when hit.
    const flash = opts.flash > 0 ? Math.min(1, opts.flash / 8) : 0;
    const white = new THREE.Color("#ffffff");
    const applyFlash = (mat: THREE.MeshBasicMaterial, base: string) => {
      const c = new THREE.Color(base);
      if (flash > 0) c.lerp(white, flash * 0.8);
      mat.color.copy(c);
    };
    for (const limb of Object.values(this.limbs)) applyFlash(limb.material, this.def.palette.body);
    for (const hand of this.hands) applyFlash(hand.material as THREE.MeshBasicMaterial, this.def.palette.body);
    applyFlash(this.head.material as THREE.MeshBasicMaterial, this.def.palette.body);
  }

  clearTrail() {
    this.trail?.clear();
  }

  dispose() {
    for (const limb of Object.values(this.limbs)) limb.dispose();
    for (const m of [...this.hands, ...this.handOutlines, ...this.boots, ...this.bootOutlines]) {
      m.geometry.dispose();
    }
    this.head.geometry.dispose();
    this.headOutline.geometry.dispose();
    this.eye.geometry.dispose();
    this.brow.geometry.dispose();
    this.shadow.geometry.dispose();
    for (const prop of this.props) {
      prop.cloth?.dispose();
      prop.group.traverse((o) => {
        const m = o as THREE.Mesh;
        if (m.geometry) m.geometry.dispose();
      });
    }
    this.trail?.dispose();
    for (const m of this.materials) m.dispose();
  }
}

/** Shades a prop shape across its own height, matching the limb gradient. */
function applyPartShading(geo: THREE.BufferGeometry, color: THREE.ColorRepresentation) {
  const pos = geo.getAttribute("position");
  const base = new THREE.Color(color);
  const light = base.clone().lerp(new THREE.Color("#ffffff"), 0.16);
  const dark = base.clone().lerp(new THREE.Color("#000000"), 0.26);
  geo.computeBoundingBox();
  const bb = geo.boundingBox!;
  const span = Math.max(0.0001, bb.max.y - bb.min.y);
  const colors = new Float32Array(pos.count * 3);
  const c = new THREE.Color();
  for (let i = 0; i < pos.count; i++) {
    c.copy(dark).lerp(light, (pos.getY(i) - bb.min.y) / span);
    colors[i * 3] = c.r;
    colors[i * 3 + 1] = c.g;
    colors[i * 3 + 2] = c.b;
  }
  geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
}

/** How far a prop part reaches from its attachment point. */
function partReach(part: ShapePart): number {
  const half = part.geo === "cyl" ? part.size[1] / 2 : Math.max(part.size[0], part.size[1] ?? 0) / 2;
  return part.pos[0] + half;
}

/** Where a prop sits on the body, in facing space. */
export function attachTransform(sk: Skeleton, attach: PropDef["attach"]): { x: number; y: number; rot: number } {
  switch (attach) {
    case "head":
      return { x: sk.head.x, y: sk.head.y, rot: -sk.torsoAngle * 0.6 };
    case "neck":
      return { x: sk.neck.x, y: sk.neck.y, rot: -sk.torsoAngle };
    case "torso":
      return {
        x: (sk.pelvis.x + sk.neck.x) / 2,
        y: (sk.pelvis.y + sk.neck.y) / 2,
        rot: -sk.torsoAngle,
      };
    case "pelvis":
      return { x: sk.pelvis.x, y: sk.pelvis.y, rot: -sk.torsoAngle * 0.5 };
    case "handF":
      return { x: sk.handF.x, y: sk.handF.y, rot: sk.foreAngleF - 90 + sk.weapon };
    case "handB":
      return { x: sk.handB.x, y: sk.handB.y, rot: sk.foreAngleB - 90 + sk.weaponBack };
    case "forearmF":
      return {
        x: (sk.elbowF.x + sk.handF.x) / 2,
        y: (sk.elbowF.y + sk.handF.y) / 2,
        rot: sk.foreAngleF - 90,
      };
    case "forearmB":
      return {
        x: (sk.elbowB.x + sk.handB.x) / 2,
        y: (sk.elbowB.y + sk.handB.y) / 2,
        rot: sk.foreAngleB - 90,
      };
    case "back":
      return { x: sk.neck.x, y: sk.neck.y - 12, rot: -sk.torsoAngle };
    case "footF":
      return { x: sk.footF.x, y: sk.footF.y, rot: 0 };
    case "footB":
      return { x: sk.footB.x, y: sk.footB.y, rot: 0 };
    default:
      return { x: 0, y: 0, rot: 0 };
  }
}
