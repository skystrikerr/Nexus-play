/**
 * Arena backdrops. Each theme is a handful of parallax layers built from flat
 * shapes - cheap to draw, and they read instantly at a glance.
 */

import * as THREE from "three";
import { STAGE_HALF_WIDTH } from "../constants";

export type StageTheme = "colosseum" | "deck" | "frontier";

export const STAGE_THEMES: Record<StageTheme, { name: string; sky: [string, string]; ground: string }> = {
  colosseum: { name: "The Colosseum", sky: ["#2b1b3d", "#c8643c"], ground: "#c9a267" },
  deck: { name: "Storm Deck", sky: ["#0d1b2a", "#3f6b8a"], ground: "#6b4b32" },
  frontier: { name: "Perdition Flats", sky: ["#3a1f2b", "#e2925a"], ground: "#c98d5a" },
};

interface Layer {
  group: THREE.Group;
  /** 0 = fixed to camera, 1 = fixed to world. */
  parallax: number;
}

/** Stage layers sit behind the fighters at negative z (see LAYER_Z). */
function mat(color: THREE.ColorRepresentation, opacity = 1) {
  const translucent = opacity < 1;
  return new THREE.MeshBasicMaterial({
    color,
    transparent: translucent,
    opacity,
    depthTest: true,
    depthWrite: !translucent,
  });
}

/** Stage draw order 0..9 maps to z -120..-30, all behind the fighters. */
const layerZ = (order: number) => -120 + order * 10;

function rect(
  x: number,
  y: number,
  w: number,
  h: number,
  color: THREE.ColorRepresentation,
  order: number,
  opacity = 1,
): THREE.Mesh {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat(color, opacity));
  m.position.set(x, y + h / 2, layerZ(order));
  m.renderOrder = order;
  return m;
}

function tri(
  x: number,
  y: number,
  w: number,
  h: number,
  color: THREE.ColorRepresentation,
  order: number,
  opacity = 1,
): THREE.Mesh {
  const s = new THREE.Shape();
  s.moveTo(-w / 2, 0);
  s.lineTo(w / 2, 0);
  s.lineTo(0, h);
  s.closePath();
  const m = new THREE.Mesh(new THREE.ShapeGeometry(s), mat(color, opacity));
  m.position.set(x, y, layerZ(order));
  m.renderOrder = order;
  return m;
}

function disc(
  x: number,
  y: number,
  r: number,
  color: THREE.ColorRepresentation,
  order: number,
  opacity = 1,
): THREE.Mesh {
  const m = new THREE.Mesh(new THREE.CircleGeometry(r, 32), mat(color, opacity));
  m.position.set(x, y, layerZ(order));
  m.renderOrder = order;
  return m;
}

/** Vertical gradient backdrop built from a two-colour vertex-coloured quad. */
function skyQuad(top: string, bottom: string, order: number): THREE.Mesh {
  const geo = new THREE.PlaneGeometry(2400, 1300);
  const top3 = new THREE.Color(top);
  const bot3 = new THREE.Color(bottom);
  const colors: number[] = [];
  // PlaneGeometry vertex order: top-left, top-right, bottom-left, bottom-right.
  for (const c of [top3, top3, bot3, bot3]) colors.push(c.r, c.g, c.b);
  geo.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
  const m = new THREE.Mesh(
    geo,
    new THREE.MeshBasicMaterial({ vertexColors: true }),
  );
  m.renderOrder = order;
  return m;
}

export class Stage {
  readonly group = new THREE.Group();
  private layers: Layer[] = [];
  private disposables: (THREE.BufferGeometry | THREE.Material)[] = [];
  readonly theme: StageTheme;

  constructor(theme: StageTheme) {
    this.theme = theme;
    const cfg = STAGE_THEMES[theme];

    const sky = new THREE.Group();
    const skyMesh = skyQuad(cfg.sky[0], cfg.sky[1], 0);
    skyMesh.position.set(0, 380, layerZ(0) - 10);
    sky.add(skyMesh);
    this.addLayer(sky, 0);

    switch (theme) {
      case "colosseum":
        this.buildColosseum();
        break;
      case "deck":
        this.buildDeck();
        break;
      case "frontier":
        this.buildFrontier();
        break;
    }

    this.buildGround(cfg.ground);
  }

  private addLayer(group: THREE.Group, parallax: number) {
    this.layers.push({ group, parallax });
    this.group.add(group);
    group.traverse((o) => {
      const m = o as THREE.Mesh;
      if (m.geometry) this.disposables.push(m.geometry);
      if (m.material) this.disposables.push(m.material as THREE.Material);
    });
  }

  private buildGround(color: string) {
    const g = new THREE.Group();
    g.add(rect(0, -420, 1800, 420, color, 8));
    g.add(rect(0, -6, 1800, 7, "#00000033", 9, 0.35));
    // Arena floor markings.
    for (let x = -STAGE_HALF_WIDTH; x <= STAGE_HALF_WIDTH; x += 130) {
      g.add(rect(x, -34, 6, 34, "#00000022", 9, 0.25));
    }
    this.addLayer(g, 1);
  }

  private buildColosseum() {
    const far = new THREE.Group();
    far.add(disc(240, 300, 90, "#f6c46a", 1, 0.85));
    for (let i = -4; i <= 4; i++) {
      far.add(rect(i * 190, 40, 120, 240, "#4a2f42", 2, 0.9));
      far.add(rect(i * 190, 260, 150, 30, "#5c3a52", 2, 0.9));
    }
    this.addLayer(far, 0.25);

    const mid = new THREE.Group();
    // Tiered seating.
    mid.add(rect(0, 96, 1800, 90, "#3a2434", 3));
    for (let i = -8; i <= 8; i++) {
      mid.add(rect(i * 150, 110, 26, 70, "#2b1a28", 4, 0.9));
    }
    mid.add(rect(0, 60, 1800, 40, "#553751", 4));
    // Columns on the arena wall.
    for (let i = -6; i <= 6; i++) {
      mid.add(rect(i * 170, 0, 34, 70, "#d8c39a", 5));
      mid.add(rect(i * 170, 66, 46, 12, "#efe0bd", 5));
    }
    mid.add(rect(0, 0, 1800, 10, "#8a744f", 6));
    this.addLayer(mid, 0.55);

    const near = new THREE.Group();
    near.add(rect(-STAGE_HALF_WIDTH - 40, 0, 40, 150, "#2a1c26", 7, 0.85));
    near.add(rect(STAGE_HALF_WIDTH + 40, 0, 40, 150, "#2a1c26", 7, 0.85));
    this.addLayer(near, 0.9);
  }

  private buildDeck() {
    const far = new THREE.Group();
    far.add(disc(-260, 340, 66, "#dfe7ef", 1, 0.5));
    for (let i = -3; i <= 3; i++) {
      // Storm clouds.
      far.add(disc(i * 260 + 40, 330 + (i % 2) * 40, 90, "#1b2c3f", 2, 0.75));
      far.add(disc(i * 260 - 60, 300 + (i % 2) * 30, 70, "#22374d", 2, 0.7));
    }
    this.addLayer(far, 0.2);

    const mid = new THREE.Group();
    // Distant ship.
    mid.add(rect(-320, 40, 320, 60, "#20303f", 3));
    mid.add(rect(-320, 100, 12, 190, "#2b3f52", 3));
    mid.add(tri(-320, 110, 130, 150, "#41586d", 3, 0.9));
    // Sea.
    mid.add(rect(0, 0, 1800, 46, "#2b4a63", 4));
    mid.add(rect(0, 34, 1800, 8, "#43698a", 5, 0.8));
    this.addLayer(mid, 0.5);

    const near = new THREE.Group();
    // Deck planks and rails.
    near.add(rect(0, 0, 1800, 16, "#4d3521", 6));
    for (let i = -8; i <= 8; i++) {
      near.add(rect(i * 140, 16, 10, 60, "#5c4029", 6, 0.9));
    }
    near.add(rect(0, 74, 1800, 8, "#5c4029", 6, 0.9));
    // Mast behind the fighters.
    near.add(rect(210, 0, 22, 320, "#6b4b32", 5, 0.95));
    near.add(rect(210, 250, 200, 14, "#7d5a3c", 5, 0.95));
    this.addLayer(near, 0.85);
  }

  private buildFrontier() {
    const far = new THREE.Group();
    far.add(disc(-200, 250, 120, "#ffd9a0", 1, 0.75));
    far.add(tri(-380, 0, 620, 250, "#5b3446", 2, 0.85));
    far.add(tri(180, 0, 520, 190, "#6b3d4a", 2, 0.8));
    far.add(tri(560, 0, 440, 230, "#4d2b3c", 2, 0.85));
    this.addLayer(far, 0.25);

    const mid = new THREE.Group();
    // Main street buildings.
    const buildings = [
      { x: -470, w: 180, h: 150 },
      { x: -250, w: 150, h: 120 },
      { x: 260, w: 200, h: 165 },
      { x: 490, w: 160, h: 130 },
    ];
    for (const b of buildings) {
      mid.add(rect(b.x, 0, b.w, b.h, "#6a4630", 3));
      mid.add(rect(b.x, b.h, b.w + 22, 16, "#4f3323", 4));
      mid.add(rect(b.x, b.h * 0.45, b.w * 0.32, b.h * 0.3, "#2a1a14", 4, 0.9));
      mid.add(rect(b.x - b.w * 0.28, 0, b.w * 0.22, b.h * 0.42, "#33201a", 4, 0.9));
    }
    // Cacti and posts.
    mid.add(rect(-60, 0, 12, 70, "#4a6b3a", 3));
    mid.add(rect(-72, 40, 26, 10, "#4a6b3a", 3));
    mid.add(rect(80, 0, 8, 90, "#5b3f28", 3));
    this.addLayer(mid, 0.55);

    const near = new THREE.Group();
    near.add(rect(0, 0, 1800, 12, "#a9713f", 6, 0.8));
    this.addLayer(near, 0.9);
  }

  /** Applies parallax for the current camera position. */
  update(cameraX: number, cameraY: number) {
    for (const layer of this.layers) {
      layer.group.position.x = cameraX * (1 - layer.parallax);
      layer.group.position.y = cameraY * (1 - layer.parallax) * 0.4;
    }
  }

  dispose() {
    for (const d of this.disposables) d.dispose();
  }
}

export function themeForFighter(id: string): StageTheme {
  switch (id) {
    case "roman":
      return "colosseum";
    case "pirate":
      return "deck";
    case "western":
      return "frontier";
    default:
      return "colosseum";
  }
}
