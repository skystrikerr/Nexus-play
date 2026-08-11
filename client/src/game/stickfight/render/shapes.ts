/**
 * Shape builders for the fighter rig.
 *
 * Limbs are tapered capsules rather than plain rectangles - wider at the joint
 * that carries the weight, narrower at the end - which is most of what makes a
 * stick figure read as a body instead of a diagram. Each one carries a vertex
 * colour gradient across its width so it shades like a tube.
 */

import * as THREE from "three";

const CAP_SEGMENTS = 7;

export interface ShadeOptions {
  /** Base colour of the limb. */
  color: THREE.ColorRepresentation;
  /** How much lighter the top edge gets, 0..1. */
  highlight?: number;
  /** How much darker the bottom edge gets, 0..1. */
  shade?: number;
}

/** Applies a light-to-dark gradient across the shape's local y axis. */
function shadeGeometry(geo: THREE.BufferGeometry, opts: ShadeOptions) {
  const pos = geo.getAttribute("position");
  const base = new THREE.Color(opts.color);
  const light = base.clone().lerp(new THREE.Color("#ffffff"), opts.highlight ?? 0.22);
  const dark = base.clone().lerp(new THREE.Color("#000000"), opts.shade ?? 0.3);

  geo.computeBoundingBox();
  const bb = geo.boundingBox!;
  const minY = bb.min.y;
  const spanY = Math.max(0.0001, bb.max.y - minY);

  const colors = new Float32Array(pos.count * 3);
  const c = new THREE.Color();
  for (let i = 0; i < pos.count; i++) {
    const t = (pos.getY(i) - minY) / spanY;
    // Slightly biased so the lit band sits above the middle.
    c.copy(dark).lerp(light, Math.pow(t, 0.8));
    colors[i * 3] = c.r;
    colors[i * 3 + 1] = c.g;
    colors[i * 3 + 2] = c.b;
  }
  geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
}

/**
 * A limb: runs along +x from the origin to (len, 0), with rounded ends of
 * different radii. `grow` inflates both ends evenly for the outline pass.
 */
export function limbGeometry(
  len: number,
  rStart: number,
  rEnd: number,
  grow = 0,
  shade?: ShadeOptions,
): THREE.BufferGeometry {
  const r1 = rStart + grow;
  const r2 = rEnd + grow;
  const shape = new THREE.Shape();

  // Tangent angle so the sides meet both circles cleanly on a taper.
  const dr = r1 - r2;
  const phi = Math.asin(Math.max(-1, Math.min(1, dr / Math.max(len, 0.001))));

  shape.absarc(0, 0, r1, Math.PI / 2 + phi, (Math.PI * 3) / 2 - phi, false);
  shape.absarc(len, 0, r2, (Math.PI * 3) / 2 - phi, Math.PI / 2 + phi, false);
  shape.closePath();

  const geo = new THREE.ShapeGeometry(shape, CAP_SEGMENTS);
  if (shade) shadeGeometry(geo, shade);
  return geo;
}

/**
 * A hand: a rounded mitt with a thumb, pointing along +x from the wrist.
 */
export function handGeometry(size: number, grow = 0, shade?: ShadeOptions): THREE.BufferGeometry {
  const s = size + grow;
  const shape = new THREE.Shape();
  shape.moveTo(-s * 0.2, -s * 0.72);
  shape.quadraticCurveTo(s * 1.25, -s * 0.9, s * 1.35, -s * 0.1);
  shape.quadraticCurveTo(s * 1.4, s * 0.75, s * 0.45, s * 0.9);
  // Thumb.
  shape.quadraticCurveTo(s * 0.1, s * 1.05, -s * 0.35, s * 0.5);
  shape.quadraticCurveTo(-s * 0.6, s * 0.05, -s * 0.2, -s * 0.72);
  shape.closePath();
  const geo = new THREE.ShapeGeometry(shape, 8);
  if (shade) shadeGeometry(geo, shade);
  return geo;
}

/**
 * A boot: heel behind the ankle, sole along the floor, toe raised slightly.
 * Runs along +x from the ankle.
 */
export function bootGeometry(len: number, height: number, grow = 0, shade?: ShadeOptions): THREE.BufferGeometry {
  const g = grow;
  const shape = new THREE.Shape();
  shape.moveTo(-height * 0.75 - g, height * 0.55 + g);
  shape.quadraticCurveTo(-height * 0.95 - g, -height * 0.5 - g, -height * 0.45, -height * 0.62 - g);
  shape.lineTo(len * 0.82, -height * 0.62 - g);
  shape.quadraticCurveTo(len + g, -height * 0.5 - g, len * 0.95 + g, height * 0.05);
  shape.quadraticCurveTo(len * 0.6, height * 0.42 + g, height * 0.2, height * 0.62 + g);
  shape.closePath();
  const geo = new THREE.ShapeGeometry(shape, 8);
  if (shade) shadeGeometry(geo, shade);
  return geo;
}

/**
 * A head: a rounded skull with a jaw that reads as facing +x.
 */
export function headGeometry(r: number, grow = 0, shade?: ShadeOptions): THREE.BufferGeometry {
  const s = r + grow;
  const shape = new THREE.Shape();
  shape.absarc(0, 0, s, Math.PI * 0.62, Math.PI * 1.72, false);
  // Jaw and chin, pushed forward.
  shape.quadraticCurveTo(s * 1.12, -s * 0.62, s * 0.92, -s * 0.36);
  shape.quadraticCurveTo(s * 1.16, -s * 0.06, s * 0.86, s * 0.5);
  shape.closePath();
  const geo = new THREE.ShapeGeometry(shape, 16);
  if (shade) shadeGeometry(geo, shade);
  return geo;
}

/** A simple eye: a short angled slit sitting on the face. */
export function eyeGeometry(r: number): THREE.BufferGeometry {
  const shape = new THREE.Shape();
  const w = r * 0.42;
  const h = r * 0.2;
  shape.moveTo(-w, h * 0.4);
  shape.quadraticCurveTo(0, h * 1.5, w, h * 0.2);
  shape.quadraticCurveTo(0, -h * 0.9, -w, h * 0.4);
  shape.closePath();
  return new THREE.ShapeGeometry(shape, 6);
}

/** Reusable flat material. Set `vertexColors` for shaded limb geometry. */
export function rigMaterial(
  color: THREE.ColorRepresentation,
  opts: { vertexColors?: boolean; opacity?: number } = {},
): THREE.MeshBasicMaterial {
  const translucent = (opts.opacity ?? 1) < 1;
  return new THREE.MeshBasicMaterial({
    color,
    vertexColors: opts.vertexColors ?? false,
    transparent: translucent,
    opacity: opts.opacity ?? 1,
    depthTest: true,
    depthWrite: !translucent,
    side: THREE.DoubleSide,
  });
}
