/**
 * SVG portrait of a fighter, drawn from the exact same stance data the 3D rig
 * uses - so the select screen can never drift out of sync with the game.
 */

import { useMemo } from "react";
import { buildSkeleton, type Skeleton } from "../skeleton";
import type { FighterDef, Pose, PropDef, ShapePart } from "../types";

function attachTransform(sk: Skeleton, attach: PropDef["attach"]): { x: number; y: number; rot: number } {
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

function PartShape({ part, fallback }: { part: ShapePart; fallback: string }) {
  const color = part.color ?? fallback;
  const [x, y] = part.pos;
  const transform = `translate(${x} ${-y}) rotate(${-(part.rot ?? 0)})`;

  switch (part.geo) {
    case "box":
      return (
        <rect
          x={-part.size[0] / 2}
          y={-part.size[1] / 2}
          width={part.size[0]}
          height={part.size[1]}
          fill={color}
          transform={transform}
        />
      );
    case "cyl":
      return (
        <rect
          x={-part.size[0]}
          y={-part.size[1] / 2}
          width={part.size[0] * 2}
          height={part.size[1]}
          fill={color}
          transform={transform}
        />
      );
    case "sphere":
    case "disc":
      return <circle r={part.size[0]} fill={color} transform={transform} />;
    case "cone":
    case "tri": {
      const w = part.geo === "cone" ? part.size[0] * 2 : part.size[0];
      const h = part.size[1];
      return (
        <polygon points={`${-w / 2},${h / 2} ${w / 2},${h / 2} 0,${-h / 2}`} fill={color} transform={transform} />
      );
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

  const bone = (a: { x: number; y: number }, b: { x: number; y: number }, width: number, color: string) => (
    <line x1={a.x} y1={-a.y} x2={b.x} y2={-b.y} stroke={color} strokeWidth={width} strokeLinecap="round" />
  );

  const backColor = "#000000";
  const behind = def.props.filter((pr) => pr.parts.some((part) => part.behind));
  const front = def.props.filter((pr) => !pr.parts.some((part) => part.behind));

  return (
    <svg viewBox="-70 -125 140 140" className={className} role="img" aria-label={def.name}>
      <g transform={`scale(${facing} 1)`}>
        {behind.map((pr) => (
          <Prop key={pr.id} def={pr} sk={sk} fallback={p.cloth} />
        ))}

        {/* Back limbs, darkened */}
        <g opacity={0.72}>
          {bone(sk.pelvis, sk.kneeB, 12, backColor)}
          {bone(sk.kneeB, sk.footB, 10.5, backColor)}
          {bone(sk.neck, sk.elbowB, 10.5, backColor)}
          {bone(sk.elbowB, sk.handB, 9.5, backColor)}
          {bone(sk.pelvis, sk.kneeB, 8.5, p.body)}
          {bone(sk.kneeB, sk.footB, 7, p.body)}
          {bone(sk.neck, sk.elbowB, 7, p.body)}
          {bone(sk.elbowB, sk.handB, 6, p.body)}
        </g>

        {/* Torso + head */}
        {bone(sk.pelvis, sk.neck, 15.4, backColor)}
        {bone(sk.pelvis, sk.neck, 12, p.body)}
        {bone(sk.neck, sk.head, 9.4, backColor)}
        {bone(sk.neck, sk.head, 6, p.body)}
        <circle cx={sk.head.x} cy={-sk.head.y} r={11.3} fill={backColor} />
        <circle cx={sk.head.x} cy={-sk.head.y} r={9.5} fill={p.body} />

        {/* Front limbs */}
        {bone(sk.pelvis, sk.kneeF, 12.4, backColor)}
        {bone(sk.kneeF, sk.footF, 11, backColor)}
        {bone(sk.footF, sk.toeF, 8.5, backColor)}
        {bone(sk.neck, sk.elbowF, 11, backColor)}
        {bone(sk.elbowF, sk.handF, 10, backColor)}
        {bone(sk.pelvis, sk.kneeF, 9, p.body)}
        {bone(sk.kneeF, sk.footF, 7.5, p.body)}
        {bone(sk.footF, sk.toeF, 5.5, p.body)}
        {bone(sk.neck, sk.elbowF, 7.5, p.body)}
        {bone(sk.elbowF, sk.handF, 6.5, p.body)}

        {front.map((pr) => (
          <Prop key={pr.id} def={pr} sk={sk} fallback={p.metal} />
        ))}
      </g>
    </svg>
  );
}
