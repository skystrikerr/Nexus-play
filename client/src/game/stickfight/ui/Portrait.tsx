/**
 * SVG portrait of a fighter, drawn from the same stance data and the same
 * proportions as the 3D rig - tapered limbs, boots, hands and a jawed head -
 * so the select screen never drifts from what you get in the match.
 */

import { useMemo } from "react";
import { BONES, buildSkeleton, type Joint, type Skeleton } from "../skeleton";
import type { FighterDef, Pose, PropDef, ShapePart } from "../types";

/** Limb widths, mirrored from the rig's LIMB table. */
const W = {
  thigh: [6.6, 5.2],
  shin: [5.2, 3.9],
  upperArm: [5.4, 4.3],
  foreArm: [4.3, 3.3],
  spine: [8.6, 6.4],
  neck: [4.4, 3.6],
} as const;

const OUTLINE = 2.1;

function attachTransform(sk: Skeleton, attach: PropDef["attach"]): { x: number; y: number; rot: number } {
  switch (attach) {
    case "head":
      return { x: sk.head.x, y: sk.head.y, rot: -sk.torsoAngle * 0.6 };
    case "neck":
      return { x: sk.neck.x, y: sk.neck.y, rot: -sk.torsoAngle };
    case "torso":
      return { x: (sk.pelvis.x + sk.neck.x) / 2, y: (sk.pelvis.y + sk.neck.y) / 2, rot: -sk.torsoAngle };
    case "pelvis":
      return { x: sk.pelvis.x, y: sk.pelvis.y, rot: -sk.torsoAngle * 0.5 };
    case "handF":
      return { x: sk.handF.x, y: sk.handF.y, rot: sk.foreAngleF - 90 + sk.weapon };
    case "handB":
      return { x: sk.handB.x, y: sk.handB.y, rot: sk.foreAngleB - 90 + sk.weaponBack };
    case "forearmF":
      return { x: (sk.elbowF.x + sk.handF.x) / 2, y: (sk.elbowF.y + sk.handF.y) / 2, rot: sk.foreAngleF - 90 };
    case "forearmB":
      return { x: (sk.elbowB.x + sk.handB.x) / 2, y: (sk.elbowB.y + sk.handB.y) / 2, rot: sk.foreAngleB - 90 };
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

/** A tapered limb: two circles joined by a quad, matching the rig's shape. */
function Limb({
  a,
  b,
  r1,
  r2,
  color,
  grow = 0,
}: {
  a: Joint;
  b: Joint;
  r1: number;
  r2: number;
  color: string;
  grow?: number;
}) {
  const ax = a.x;
  const ay = -a.y;
  const bx = b.x;
  const by = -b.y;
  const dx = bx - ax;
  const dy = by - ay;
  const len = Math.hypot(dx, dy) || 0.001;
  const nx = -dy / len;
  const ny = dx / len;
  const w1 = r1 + grow;
  const w2 = r2 + grow;
  const pts = [
    [ax + nx * w1, ay + ny * w1],
    [bx + nx * w2, by + ny * w2],
    [bx - nx * w2, by - ny * w2],
    [ax - nx * w1, ay - ny * w1],
  ]
    .map(([x, y]) => `${x.toFixed(2)},${y.toFixed(2)}`)
    .join(" ");

  return (
    <g fill={color}>
      <polygon points={pts} />
      <circle cx={ax} cy={ay} r={w1} />
      <circle cx={bx} cy={by} r={w2} />
    </g>
  );
}

/** A boot, drawn from the ankle along the foot direction. */
function Boot({ foot, toe, color, grow = 0 }: { foot: Joint; toe: Joint; color: string; grow?: number }) {
  const angle = (Math.atan2(-(toe.y - foot.y), toe.x - foot.x) * 180) / Math.PI;
  const len = BONES.foot + 4;
  const h = 7;
  const g = grow;
  const d = `M ${-h * 0.75 - g} ${-(h * 0.55 + g)}
    Q ${-h * 0.95 - g} ${h * 0.5 + g} ${-h * 0.45} ${h * 0.62 + g}
    L ${len * 0.82} ${h * 0.62 + g}
    Q ${len + g} ${h * 0.5 + g} ${len * 0.95 + g} ${-h * 0.05}
    Q ${len * 0.6} ${-(h * 0.42 + g)} ${h * 0.2} ${-(h * 0.62 + g)} Z`;
  return (
    <g transform={`translate(${foot.x} ${-foot.y}) rotate(${angle})`}>
      <path d={d} fill={color} />
    </g>
  );
}

/** A hand mitt, oriented along the forearm. */
function Hand({ at, angle, color, grow = 0 }: { at: Joint; angle: number; color: string; grow?: number }) {
  const s = 4.4 + grow;
  const d = `M ${-s * 0.2} ${s * 0.72}
    Q ${s * 1.25} ${s * 0.9} ${s * 1.35} ${s * 0.1}
    Q ${s * 1.4} ${-s * 0.75} ${s * 0.45} ${-s * 0.9}
    Q ${s * 0.1} ${-s * 1.05} ${-s * 0.35} ${-s * 0.5}
    Q ${-s * 0.6} ${-s * 0.05} ${-s * 0.2} ${s * 0.72} Z`;
  return (
    <g transform={`translate(${at.x} ${-at.y}) rotate(${-(angle - 90)})`}>
      <path d={d} fill={color} />
    </g>
  );
}

function Head({ at, r, color, grow = 0 }: { at: Joint; r: number; color: string; grow?: number }) {
  const s = r + grow;
  // Skull arc plus a jaw pushed forward, mirroring headGeometry().
  const start = { x: Math.cos(Math.PI * 0.62) * s, y: -Math.sin(Math.PI * 0.62) * s };
  const end = { x: Math.cos(Math.PI * 1.72) * s, y: -Math.sin(Math.PI * 1.72) * s };
  const d = `M ${start.x} ${start.y}
    A ${s} ${s} 0 1 0 ${end.x} ${end.y}
    Q ${s * 1.12} ${s * 0.62} ${s * 0.92} ${s * 0.36}
    Q ${s * 1.16} ${s * 0.06} ${s * 0.86} ${-s * 0.5} Z`;
  return (
    <g transform={`translate(${at.x} ${-at.y})`}>
      <path d={d} fill={color} />
    </g>
  );
}

function PartShape({ part, fallback }: { part: ShapePart; fallback: string }) {
  const color = part.color ?? fallback;
  const [x, y] = part.pos;
  const transform = `translate(${x} ${-y}) rotate(${-(part.rot ?? 0)})`;

  switch (part.geo) {
    case "box":
      return (
        <rect x={-part.size[0] / 2} y={-part.size[1] / 2} width={part.size[0]} height={part.size[1]} fill={color} transform={transform} />
      );
    case "cyl":
      return (
        <rect x={-part.size[0]} y={-part.size[1] / 2} width={part.size[0] * 2} height={part.size[1]} fill={color} transform={transform} />
      );
    case "sphere":
    case "disc":
      return <circle r={part.size[0]} fill={color} transform={transform} />;
    case "cone":
    case "tri": {
      const w = part.geo === "cone" ? part.size[0] * 2 : part.size[0];
      const h = part.size[1];
      return <polygon points={`${-w / 2},${h / 2} ${w / 2},${h / 2} 0,${-h / 2}`} fill={color} transform={transform} />;
    }
    case "blade": {
      const len = part.size[0];
      const w = part.size[1];
      const taper = part.size[2] ?? 0.5;
      return (
        <polygon
          points={`${-len / 2},${w / 2} ${len / 2},${w * taper * 0.4} ${len / 2 + w * 0.7},0 ${len / 2},${-w * taper} ${-len / 2},${-w / 2}`}
          fill={color}
          transform={transform}
        />
      );
    }
    default:
      return null;
  }
}

function Prop({ def, sk, fallback }: { def: PropDef; sk: Skeleton; fallback: string }) {
  if (def.conditional) return null;
  const t = attachTransform(sk, def.attach);
  return (
    <g transform={`translate(${t.x} ${-t.y}) rotate(${-t.rot})`}>
      {def.parts.map((part, i) => (
        <PartShape key={i} part={part} fallback={fallback} />
      ))}
    </g>
  );
}

/** A static hanging cape, standing in for the simulated cloth in-game. */
function Cape({ def, sk }: { def: PropDef; sk: Skeleton }) {
  const cloth = def.cloth;
  if (!cloth) return null;
  const t = attachTransform(sk, def.attach);
  const drop = cloth.segments * cloth.segmentLength;
  const w0 = cloth.width / 2;
  const w1 = (cloth.endWidth ?? cloth.width * 0.45) / 2;
  const sway = drop * 0.22;
  const d = `M ${t.x - w0} ${-t.y}
    L ${t.x + w0} ${-t.y}
    Q ${t.x + w1 - sway * 0.4} ${-t.y + drop * 0.6} ${t.x + w1 - sway} ${-t.y + drop}
    L ${t.x - w1 - sway} ${-t.y + drop}
    Q ${t.x - w0 - sway * 0.3} ${-t.y + drop * 0.55} ${t.x - w0} ${-t.y} Z`;
  return <path d={d} fill={cloth.color} opacity={0.95} />;
}

export function FighterPortrait({
  def,
  pose,
  className,
  facing = 1,
}: {
  def: FighterDef;
  pose?: Pose;
  className?: string;
  facing?: 1 | -1;
}) {
  const sk = useMemo(() => buildSkeleton({ ...def.stance, ...pose }, true, 1), [def, pose]);
  const p = def.palette;
  const ink = p.outline;

  const behind = def.props.filter((pr) => pr.parts.some((part) => part.behind));
  const front = def.props.filter((pr) => !pr.parts.some((part) => part.behind));
  const capes = def.props.filter((pr) => pr.cloth);

  const back = (c: string) => c;

  return (
    <svg viewBox="-70 -125 140 140" className={className} role="img" aria-label={def.name}>
      <g transform={`scale(${facing} 1)`}>
        {capes.map((pr) => (
          <Cape key={`cape-${pr.id}`} def={pr} sk={sk} />
        ))}
        {behind.map((pr) => (
          <Prop key={pr.id} def={pr} sk={sk} fallback={p.cloth} />
        ))}

        {/* Back limbs, darkened so the body reads with depth. */}
        <g opacity={0.78}>
          <Limb a={sk.pelvis} b={sk.kneeB} r1={W.thigh[0]} r2={W.thigh[1]} color={ink} grow={OUTLINE} />
          <Limb a={sk.kneeB} b={sk.footB} r1={W.shin[0]} r2={W.shin[1]} color={ink} grow={OUTLINE} />
          <Limb a={sk.neck} b={sk.elbowB} r1={W.upperArm[0]} r2={W.upperArm[1]} color={ink} grow={OUTLINE} />
          <Limb a={sk.elbowB} b={sk.handB} r1={W.foreArm[0]} r2={W.foreArm[1]} color={ink} grow={OUTLINE} />
          <Boot foot={sk.footB} toe={sk.toeB} color={ink} grow={OUTLINE} />
          <Hand at={sk.handB} angle={sk.foreAngleB} color={ink} grow={OUTLINE} />

          <Limb a={sk.pelvis} b={sk.kneeB} r1={W.thigh[0]} r2={W.thigh[1]} color={back(p.body)} />
          <Limb a={sk.kneeB} b={sk.footB} r1={W.shin[0]} r2={W.shin[1]} color={back(p.body)} />
          <Limb a={sk.neck} b={sk.elbowB} r1={W.upperArm[0]} r2={W.upperArm[1]} color={back(p.body)} />
          <Limb a={sk.elbowB} b={sk.handB} r1={W.foreArm[0]} r2={W.foreArm[1]} color={back(p.body)} />
          <Boot foot={sk.footB} toe={sk.toeB} color={p.cloth} />
          <Hand at={sk.handB} angle={sk.foreAngleB} color={back(p.body)} />
        </g>

        {/* Torso and head */}
        <Limb a={sk.pelvis} b={sk.neck} r1={W.spine[0]} r2={W.spine[1]} color={ink} grow={OUTLINE} />
        <Limb a={sk.neck} b={sk.head} r1={W.neck[0]} r2={W.neck[1]} color={ink} grow={OUTLINE} />
        <Head at={sk.head} r={BONES.headR} color={ink} grow={OUTLINE} />
        <Limb a={sk.pelvis} b={sk.neck} r1={W.spine[0]} r2={W.spine[1]} color={p.body} />
        <Limb a={sk.neck} b={sk.head} r1={W.neck[0]} r2={W.neck[1]} color={p.body} />
        <Head at={sk.head} r={BONES.headR} color={p.body} />
        <ellipse
          cx={sk.head.x + BONES.headR * 0.42}
          cy={-sk.head.y - BONES.headR * 0.12}
          rx={BONES.headR * 0.2}
          ry={BONES.headR * 0.12}
          fill={ink}
        />

        {/* Front limbs */}
        <Limb a={sk.pelvis} b={sk.kneeF} r1={W.thigh[0]} r2={W.thigh[1]} color={ink} grow={OUTLINE} />
        <Limb a={sk.kneeF} b={sk.footF} r1={W.shin[0]} r2={W.shin[1]} color={ink} grow={OUTLINE} />
        <Limb a={sk.neck} b={sk.elbowF} r1={W.upperArm[0]} r2={W.upperArm[1]} color={ink} grow={OUTLINE} />
        <Limb a={sk.elbowF} b={sk.handF} r1={W.foreArm[0]} r2={W.foreArm[1]} color={ink} grow={OUTLINE} />
        <Boot foot={sk.footF} toe={sk.toeF} color={ink} grow={OUTLINE} />
        <Hand at={sk.handF} angle={sk.foreAngleF} color={ink} grow={OUTLINE} />

        <Limb a={sk.pelvis} b={sk.kneeF} r1={W.thigh[0]} r2={W.thigh[1]} color={p.body} />
        <Limb a={sk.kneeF} b={sk.footF} r1={W.shin[0]} r2={W.shin[1]} color={p.body} />
        <Limb a={sk.neck} b={sk.elbowF} r1={W.upperArm[0]} r2={W.upperArm[1]} color={p.body} />
        <Limb a={sk.elbowF} b={sk.handF} r1={W.foreArm[0]} r2={W.foreArm[1]} color={p.body} />
        <Boot foot={sk.footF} toe={sk.toeF} color={p.cloth} />
        <Hand at={sk.handF} angle={sk.foreAngleF} color={p.body} />

        {front.map((pr) => (
          <Prop key={pr.id} def={pr} sk={sk} fallback={p.metal} />
        ))}
      </g>
    </svg>
  );
}
