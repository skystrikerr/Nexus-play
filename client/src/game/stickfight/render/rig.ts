/**
 * Turns a Skeleton into three.js geometry: outlined bones, joints, a head and
 * the character's props (weapons, hats, capes).
 *
 * Everything is flat, unlit and drawn back-to-front with renderOrder, which is
 * what gives the game its inked 2D look while still being a real 3D scene.
 */

import * as THREE from "three";
import type { Skeleton } from "../skeleton";
import type { FighterDef, PropDef, ShapePart } from "../types";

const ORDER = {
  shadow: 10,
  backProp: 18,
  backLimb: 20,
  body: 30,
  frontLimb: 40,
  head: 46,
  frontProp: 50,
};

const DEG = Math.PI / 180;

/**
 * Layering is done with real depth: every element sits at the z given by ORDER,
 * so opaque pieces can depth-test instead of being blended in a strict draw
 * order. That keeps the 2D look while letting the GPU reject hidden pixels.
 */
function flatMaterial(color: THREE.ColorRepresentation, opacity = 1) {
  const translucent = opacity < 1;
  return new THREE.MeshBasicMaterial({
    color,
    transparent: translucent,
    opacity,
    depthTest: true,
    depthWrite: !translucent,
    side: THREE.DoubleSide,
  });
}

function darken(hex: string, amount: number): THREE.Color {
  const c = new THREE.Color(hex);
  c.multiplyScalar(1 - amount);
  return c;
}

/** A rounded line segment: a rectangle plus a disc at each end. */
class Bone {
  readonly group = new THREE.Group();
  private body: THREE.Mesh;
  private capA: THREE.Mesh;
  private capB: THREE.Mesh;

  constructor(
    private thickness: number,
    material: THREE.Material,
    order: number,
  ) {
    this.body = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), material);
    this.capA = new THREE.Mesh(new THREE.CircleGeometry(0.5, 14), material);
    this.capB = new THREE.Mesh(new THREE.CircleGeometry(0.5, 14), material);
    this.group.position.z = order;
    for (const m of [this.body, this.capA, this.capB]) {
      m.renderOrder = order;
      this.group.add(m);
    }
    this.capA.scale.setScalar(thickness);
    this.capB.scale.setScalar(thickness);
  }

  set(ax: number, ay: number, bx: number, by: number) {
    const dx = bx - ax;
    const dy = by - ay;
    const len = Math.hypot(dx, dy) || 0.001;
    this.body.position.set((ax + bx) / 2, (ay + by) / 2, 0);
    this.body.rotation.z = Math.atan2(dy, dx);
    this.body.scale.set(len, this.thickness, 1);
    this.capA.position.set(ax, ay, 0);
    this.capB.position.set(bx, by, 0);
  }
}

interface PropMesh {
  def: PropDef;
  group: THREE.Group;
}

export class StickRig {
  readonly group = new THREE.Group();
  private bones: Record<string, { fill: Bone; line: Bone }> = {};
  private head!: THREE.Mesh;
  private headOutline!: THREE.Mesh;
  private shadow!: THREE.Mesh;
  private props: PropMesh[] = [];
  private materials: THREE.Material[] = [];
  private tintMaterials: THREE.MeshBasicMaterial[] = [];
  private def: FighterDef;
  private scale: number;

  constructor(def: FighterDef) {
    this.def = def;
    this.scale = def.stats.scale;
    const p = def.palette;

    const outline = flatMaterial(p.outline);
    const bodyMat = flatMaterial(p.body);
    const backMat = flatMaterial(darken(p.body, 0.32));
    this.materials.push(outline, bodyMat, backMat);
    this.tintMaterials.push(bodyMat as THREE.MeshBasicMaterial, backMat as THREE.MeshBasicMaterial);

    const addBone = (name: string, thickness: number, back: boolean) => {
      const order = back ? ORDER.backLimb : name === "spine" ? ORDER.body : ORDER.frontLimb;
      const line = new Bone(thickness + 3.4, outline, order - 1);
      const fill = new Bone(thickness, back ? backMat : bodyMat, order);
      this.group.add(line.group, fill.group);
      this.bones[name] = { fill, line };
    };

    addBone("thighB", 8.5, true);
    addBone("shinB", 7, true);
    addBone("footB", 5, true);
    addBone("upperArmB", 7, true);
    addBone("foreArmB", 6, true);
    addBone("spine", 12, false);
    addBone("thighF", 9, false);
    addBone("shinF", 7.5, false);
    addBone("footF", 5.5, false);
    addBone("upperArmF", 7.5, false);
    addBone("foreArmF", 6.5, false);
    addBone("neck", 6, false);

    // Head
    this.headOutline = new THREE.Mesh(new THREE.CircleGeometry(1, 22), outline);
    this.headOutline.renderOrder = ORDER.head - 1;
    this.head = new THREE.Mesh(new THREE.CircleGeometry(1, 22), bodyMat);
    this.head.renderOrder = ORDER.head;
    this.group.add(this.headOutline, this.head);

    // Ground shadow (not parented to the body so it stays on the floor).
    const shadowMat = flatMaterial("#000000", 0.28);
    this.materials.push(shadowMat);
    this.shadow = new THREE.Mesh(new THREE.CircleGeometry(1, 20), shadowMat);
    this.shadow.renderOrder = ORDER.shadow;
    this.shadow.scale.set(26, 6, 1);

    for (const prop of def.props) {
      const g = this.buildProp(prop);
      this.props.push({ def: prop, group: g });
      this.group.add(g);
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
    const mat = flatMaterial(color);
    this.materials.push(mat);
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

    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(part.pos[0], part.pos[1], 0);
    if (part.rot) mesh.rotation.z = part.rot * DEG;
    return mesh;
  }

  /**
   * Applies a posed skeleton. `visibleProps` lists conditional prop ids that
   * should be shown this frame; `hidden` force-hides normally visible ones.
   */
  update(
    sk: Skeleton,
    opts: {
      x: number;
      y: number;
      /** Depth nudge so the attacking fighter draws in front. */
      z?: number;
      facing: 1 | -1;
      visibleProps: Set<string>;
      hiddenProps: Set<string>;
      flash: number;
      airborne: boolean;
    },
  ) {
    const g = this.group;
    g.position.set(opts.x, opts.y, opts.z ?? 0);
    g.scale.set(opts.facing * this.scale, this.scale, 1);
    // Spin is authored in facing space; the mirrored scale flips it for free.
    g.rotation.z = sk.spin * DEG;

    const b = this.bones;
    b.thighB.fill.set(sk.pelvis.x, sk.pelvis.y, sk.kneeB.x, sk.kneeB.y);
    b.shinB.fill.set(sk.kneeB.x, sk.kneeB.y, sk.footB.x, sk.footB.y);
    b.footB.fill.set(sk.footB.x, sk.footB.y, sk.toeB.x, sk.toeB.y);
    b.upperArmB.fill.set(sk.neck.x, sk.neck.y, sk.elbowB.x, sk.elbowB.y);
    b.foreArmB.fill.set(sk.elbowB.x, sk.elbowB.y, sk.handB.x, sk.handB.y);
    b.spine.fill.set(sk.pelvis.x, sk.pelvis.y, sk.neck.x, sk.neck.y);
    b.neck.fill.set(sk.neck.x, sk.neck.y, sk.head.x, sk.head.y);
    b.thighF.fill.set(sk.pelvis.x, sk.pelvis.y, sk.kneeF.x, sk.kneeF.y);
    b.shinF.fill.set(sk.kneeF.x, sk.kneeF.y, sk.footF.x, sk.footF.y);
    b.footF.fill.set(sk.footF.x, sk.footF.y, sk.toeF.x, sk.toeF.y);
    b.upperArmF.fill.set(sk.neck.x, sk.neck.y, sk.elbowF.x, sk.elbowF.y);
    b.foreArmF.fill.set(sk.elbowF.x, sk.elbowF.y, sk.handF.x, sk.handF.y);

    b.thighB.line.set(sk.pelvis.x, sk.pelvis.y, sk.kneeB.x, sk.kneeB.y);
    b.shinB.line.set(sk.kneeB.x, sk.kneeB.y, sk.footB.x, sk.footB.y);
    b.footB.line.set(sk.footB.x, sk.footB.y, sk.toeB.x, sk.toeB.y);
    b.upperArmB.line.set(sk.neck.x, sk.neck.y, sk.elbowB.x, sk.elbowB.y);
    b.foreArmB.line.set(sk.elbowB.x, sk.elbowB.y, sk.handB.x, sk.handB.y);
    b.spine.line.set(sk.pelvis.x, sk.pelvis.y, sk.neck.x, sk.neck.y);
    b.neck.line.set(sk.neck.x, sk.neck.y, sk.head.x, sk.head.y);
    b.thighF.line.set(sk.pelvis.x, sk.pelvis.y, sk.kneeF.x, sk.kneeF.y);
    b.shinF.line.set(sk.kneeF.x, sk.kneeF.y, sk.footF.x, sk.footF.y);
    b.footF.line.set(sk.footF.x, sk.footF.y, sk.toeF.x, sk.toeF.y);
    b.upperArmF.line.set(sk.neck.x, sk.neck.y, sk.elbowF.x, sk.elbowF.y);
    b.foreArmF.line.set(sk.elbowF.x, sk.elbowF.y, sk.handF.x, sk.handF.y);

    const headR = 9.5;
    this.head.position.set(sk.head.x, sk.head.y, ORDER.head);
    this.head.scale.setScalar(headR);
    this.headOutline.position.set(sk.head.x, sk.head.y, ORDER.head - 1);
    this.headOutline.scale.setScalar(headR + 1.8);

    // Props follow their attachment point.
    for (const p of this.props) {
      const visible =
        (!p.def.conditional || opts.visibleProps.has(p.def.id)) && !opts.hiddenProps.has(p.def.id);
      p.group.visible = visible;
      if (!visible) continue;
      this.placeProp(p, sk);
    }

    // Ground shadow shrinks as the fighter rises.
    const lift = Math.max(0, opts.y);
    const shrink = Math.max(0.35, 1 - lift / 260);
    this.shadow.position.set(opts.x, 1.5, ORDER.shadow + (opts.z ?? 0));
    this.shadow.scale.set(26 * shrink * this.scale, 6 * shrink, 1);
    (this.shadow.material as THREE.MeshBasicMaterial).opacity = 0.3 * shrink;

    // White flash when hit.
    const flash = opts.flash > 0 ? Math.min(1, opts.flash / 8) : 0;
    for (const m of this.tintMaterials) {
      const base = m === this.tintMaterials[0] ? this.def.palette.body : darken(this.def.palette.body, 0.32).getStyle();
      const c = new THREE.Color(base);
      if (flash > 0) c.lerp(new THREE.Color("#ffffff"), flash * 0.85);
      m.color.copy(c);
    }
  }

  private placeProp(p: PropMesh, sk: Skeleton) {
    const g = p.group;
    switch (p.def.attach) {
      case "head": {
        g.position.set(sk.head.x, sk.head.y, 0);
        g.rotation.z = -(sk.torsoAngle * 0.6) * DEG;
        break;
      }
      case "neck":
        g.position.set(sk.neck.x, sk.neck.y, 0);
        g.rotation.z = -sk.torsoAngle * DEG;
        break;
      case "torso": {
        g.position.set((sk.pelvis.x + sk.neck.x) / 2, (sk.pelvis.y + sk.neck.y) / 2, 0);
        g.rotation.z = -sk.torsoAngle * DEG;
        break;
      }
      case "pelvis":
        g.position.set(sk.pelvis.x, sk.pelvis.y, 0);
        g.rotation.z = -sk.torsoAngle * 0.5 * DEG;
        break;
      case "handF":
        g.position.set(sk.handF.x, sk.handF.y, 0);
        g.rotation.z = (sk.foreAngleF - 90 + sk.weapon) * DEG;
        break;
      case "handB":
        g.position.set(sk.handB.x, sk.handB.y, 0);
        g.rotation.z = (sk.foreAngleB - 90 + sk.weaponBack) * DEG;
        break;
      case "forearmF":
        g.position.set((sk.elbowF.x + sk.handF.x) / 2, (sk.elbowF.y + sk.handF.y) / 2, 0);
        g.rotation.z = (sk.foreAngleF - 90) * DEG;
        break;
      case "forearmB":
        g.position.set((sk.elbowB.x + sk.handB.x) / 2, (sk.elbowB.y + sk.handB.y) / 2, 0);
        g.rotation.z = (sk.foreAngleB - 90) * DEG;
        break;
      case "back":
        g.position.set(sk.neck.x, sk.neck.y - 12, 0);
        g.rotation.z = -sk.torsoAngle * DEG;
        break;
      case "footF":
        g.position.set(sk.footF.x, sk.footF.y, 0);
        g.rotation.z = 0;
        break;
      case "footB":
        g.position.set(sk.footB.x, sk.footB.y, 0);
        g.rotation.z = 0;
        break;
    }
  }

  dispose() {
    this.group.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (mesh.geometry) mesh.geometry.dispose();
    });
    for (const m of this.materials) m.dispose();
    (this.shadow.geometry as THREE.BufferGeometry).dispose();
  }
}
