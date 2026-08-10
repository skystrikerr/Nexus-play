/**
 * The match: collision, hit resolution, projectiles, rounds and the effect
 * queue the renderer draws from. Pure simulation - no three.js in here.
 */

import { COMBAT, FPS, GROUND_Y, MATCH, STAGE_HALF_WIDTH } from "../constants";
import type { FighterDef, GuardHeight, HitDef, HitFx, ProjectileSpawn } from "../types";
import { Fighter, boxesOverlap, toWorldBox, type WorldBox } from "./fighter";
import { EMPTY_INPUT, type RawInput } from "./input";

export type Phase = "intro" | "fight" | "roundEnd" | "matchEnd";

export interface FxEvent {
  kind: HitFx | "block" | "parry" | "dust" | "spawn" | "super" | "guardBreak" | "ko" | "trail";
  x: number;
  y: number;
  scale?: number;
  color?: string;
  angle?: number;
  facing?: number;
}

export interface ComboBanner {
  hits: number;
  damage: number;
  owner: 0 | 1;
  life: number;
}

export interface Projectile {
  id: number;
  owner: 0 | 1;
  kind: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  gravity: number;
  life: number;
  age: number;
  spec: ProjectileSpawn;
  hitsLeft: number;
  facing: 1 | -1;
  spin: number;
  dead: boolean;
}

export interface RoundResult {
  winner: 0 | 1 | null;
  reason: "ko" | "time" | "double";
}

let projId = 0;

export class Match {
  readonly fighters: [Fighter, Fighter];
  projectiles: Projectile[] = [];
  fx: FxEvent[] = [];

  phase: Phase = "intro";
  phaseFrame = 0;
  frame = 0;
  round = 1;
  timer = MATCH.roundTime * FPS;
  shake = 0;
  /** Global hit-freeze used by supers. */
  freeze = 0;
  slowmo = 0;
  combo: [ComboBanner | null, ComboBanner | null] = [null, null];
  lastResult: RoundResult | null = null;
  matchWinner: 0 | 1 | null = null;
  roundsToWin: number;

  constructor(defs: [FighterDef, FighterDef], roundsToWin = MATCH.roundsToWin) {
    this.fighters = [new Fighter(defs[0], 0), new Fighter(defs[1], 1)];
    this.roundsToWin = roundsToWin;
    this.resetPositions();
  }

  private resetPositions() {
    const [a, b] = this.fighters;
    a.x = -150;
    b.x = 150;
    for (const f of this.fighters) {
      f.y = GROUND_Y;
      f.vx = 0;
      f.vy = 0;
      f.health = f.def.stats.health;
      f.meter = Math.min(f.meter, COMBAT.maxMeter * 0.5);
      f.guard = COMBAT.maxGuard;
      f.resource = f.def.resource?.start ?? 0;
      f.hitstun = 0;
      f.blockstun = 0;
      f.hitstop = 0;
      f.endCombo();
      f.releaseHold();
      f.grabbedBy = null;
      f.pendingKnockdown = "none";
      f.input.reset();
      f.setState("intro");
    }
    a.facing = 1;
    b.facing = -1;
    this.projectiles = [];
    this.combo = [null, null];
  }

  startRound() {
    this.resetPositions();
    this.phase = "intro";
    this.phaseFrame = 0;
    this.timer = MATCH.roundTime * FPS;
    this.lastResult = null;
  }

  get roundActive(): boolean {
    return this.phase === "fight";
  }

  // -------------------------------------------------------------------------
  // Main step
  // -------------------------------------------------------------------------

  step(inputs: [RawInput, RawInput]) {
    this.frame++;
    this.phaseFrame++;
    this.fx.length = 0;
    if (this.shake > 0) this.shake *= 0.86;
    if (this.shake < 0.05) this.shake = 0;

    for (let i = 0; i < 2; i++) {
      const f = this.fighters[i];
      f.pushInput(this.phase === "fight" ? inputs[i] : EMPTY_INPUT);
      f.tickAnim();
    }

    if (this.freeze > 0) {
      this.freeze--;
      return;
    }

    switch (this.phase) {
      case "intro":
        if (this.phaseFrame >= MATCH.introFrames) {
          this.phase = "fight";
          this.phaseFrame = 0;
          for (const f of this.fighters) f.setState("idle");
        }
        break;
      case "fight":
        this.stepFight();
        break;
      case "roundEnd":
        this.stepRoundEnd();
        break;
      case "matchEnd":
        this.stepPassive();
        break;
    }

    for (const banner of this.combo) {
      if (banner && banner.life > 0) banner.life--;
    }
    if (this.combo[0] && this.combo[0]!.life <= 0) this.combo[0] = null;
    if (this.combo[1] && this.combo[1]!.life <= 0) this.combo[1] = null;
  }

  private stepPassive() {
    for (const f of this.fighters) f.update(this.other(f), false);
    this.updateProjectiles();
  }

  private stepFight() {
    const [a, b] = this.fighters;

    a.faceOpponent(b);
    b.faceOpponent(a);

    a.update(b, true);
    b.update(a, true);

    this.separate();
    this.resolveThrows(a, b);
    this.resolveThrows(b, a);
    this.resolveHits(a, b);
    this.resolveHits(b, a);
    this.spawnProjectiles(a);
    this.spawnProjectiles(b);
    this.updateProjectiles();
    this.emitMovementFx();

    if (this.timer > 0) this.timer--;

    const aDead = a.health <= 0;
    const bDead = b.health <= 0;
    if (aDead || bDead || this.timer <= 0) {
      this.endRound(aDead, bDead);
    }
  }

  private endRound(aDead: boolean, bDead: boolean) {
    const [a, b] = this.fighters;
    let winner: 0 | 1 | null = null;
    let reason: RoundResult["reason"] = "ko";

    if (aDead && bDead) {
      reason = "double";
    } else if (aDead) {
      winner = 1;
    } else if (bDead) {
      winner = 0;
    } else {
      reason = "time";
      if (a.health > b.health) winner = 0;
      else if (b.health > a.health) winner = 1;
      else reason = "double";
    }

    this.lastResult = { winner, reason };
    if (winner !== null) this.fighters[winner].wins++;
    this.phase = "roundEnd";
    this.phaseFrame = 0;
    this.freeze = reason === "time" ? 0 : 12;
    this.shake = Math.max(this.shake, reason === "time" ? 2 : 9);

    for (const f of this.fighters) {
      f.releaseHold();
      f.endCombo();
    }
    if (winner !== null) {
      const loser = this.fighters[winner === 0 ? 1 : 0];
      loser.setState("ko");
      loser.vy = 6;
      loser.vx = -loser.facing * 3.2;
      this.pushFx({ kind: "ko", x: loser.x, y: loser.y + 60, scale: 2 });
    }

    const a0 = this.fighters[0].wins;
    const b0 = this.fighters[1].wins;
    if (a0 >= this.roundsToWin || b0 >= this.roundsToWin) {
      this.matchWinner = a0 > b0 ? 0 : b0 > a0 ? 1 : null;
    }
  }

  private stepRoundEnd() {
    for (const f of this.fighters) f.update(this.other(f), false);
    this.updateProjectiles();

    if (this.phaseFrame === 40 && this.lastResult?.winner !== null && this.lastResult) {
      const w = this.fighters[this.lastResult.winner!];
      if (w.state !== "ko") w.setState("win");
    }
    if (this.phaseFrame >= MATCH.roundEndDelay) {
      if (this.matchWinner !== null) {
        this.phase = "matchEnd";
        this.phaseFrame = 0;
      } else {
        this.round++;
        this.startRound();
      }
    }
  }

  other(f: Fighter): Fighter {
    return this.fighters[f.index === 0 ? 1 : 0];
  }

  pushFx(e: FxEvent) {
    this.fx.push(e);
  }

  // -------------------------------------------------------------------------
  // Pushboxes
  // -------------------------------------------------------------------------

  private separate() {
    const [a, b] = this.fighters;
    if (a.state === "grabbed" || b.state === "grabbed") return;
    const pa = a.pushbox();
    const pb = b.pushbox();
    if (!boxesOverlap(pa, pb)) return;

    const overlap = Math.min(pa.right - pb.left, pb.right - pa.left);
    if (overlap <= 0) return;
    const dir = a.x <= b.x ? -1 : 1;
    const push = Math.min(overlap / 2, COMBAT.pushSpeed);

    const aWall = Math.abs(a.x) >= STAGE_HALF_WIDTH - a.def.stats.width - 1;
    const bWall = Math.abs(b.x) >= STAGE_HALF_WIDTH - b.def.stats.width - 1;

    if (aWall && !bWall) {
      b.x -= dir * push * 2;
    } else if (bWall && !aWall) {
      a.x += dir * push * 2;
    } else {
      a.x += dir * push;
      b.x -= dir * push;
    }
  }

  // -------------------------------------------------------------------------
  // Strikes
  // -------------------------------------------------------------------------

  private resolveHits(attacker: Fighter, defender: Fighter) {
    if (attacker.hitstop > 0) return;
    for (const { hit, box } of attacker.activeHits()) {
      if (defender.state === "grabbed" && defender.grabbedBy === attacker) continue;
      if (defender.hasInvuln("strike")) continue;
      const hurt = defender.hurtboxes();
      if (!hurt.some((h) => boxesOverlap(box, h))) continue;

      const contact = {
        x: (Math.max(box.left, hurt[0].left) + Math.min(box.right, hurt[0].right)) / 2,
        y: (Math.max(box.bottom, hurt[0].bottom) + Math.min(box.top, hurt[0].top)) / 2,
      };
      this.applyHit(attacker, defender, hit, contact);
      break;
    }
  }

  private parryActive(f: Fighter): boolean {
    const w = f.move?.parryWindow;
    return f.state === "move" && !!w && f.moveFrame >= w[0] && f.moveFrame <= w[1];
  }

  canBlock(defender: Fighter, guard: GuardHeight = "mid"): boolean {
    if (guard === "unblockable") return false;
    const guarding =
      defender.state === "block" ||
      defender.state === "blockLow" ||
      defender.state === "blockAir" ||
      defender.state === "blockstun" ||
      (defender.actionable && (defender.input.holding("S") || defender.input.holdingBack()));
    if (!guarding) return false;
    if (defender.stance === "air") return true;
    const crouching = defender.stance === "crouch" || defender.input.holdingDown();
    if (guard === "low") return crouching;
    if (guard === "overhead" || guard === "high") return !crouching;
    return true;
  }

  private applyHit(
    attacker: Fighter,
    defender: Fighter,
    hit: HitDef,
    contact: { x: number; y: number },
    fromProjectile = false,
  ) {
    const guard = hit.guard ?? "mid";

    // Parry beats everything blockable.
    if (this.parryActive(defender) && guard !== "unblockable") {
      attacker.markConnected(hit, true);
      defender.addMeter(COMBAT.parryMeter);
      defender.hitstop = COMBAT.parryFreeze;
      attacker.hitstop = COMBAT.parryFreeze + 6;
      defender.parrySuccess = 20;
      this.freeze = 6;
      this.pushFx({ kind: "parry", x: contact.x, y: contact.y, scale: 1.2 });
      return;
    }

    const blocked = this.canBlock(defender, guard);
    attacker.markConnected(hit, blocked);

    const dirSign = attacker.x <= defender.x ? 1 : -1;
    const weight = defender.def.stats.weight || 1;

    if (blocked) {
      const stun = hit.blockstun;
      defender.blockstun = stun;
      defender.setState("blockstun");
      defender.guard -= Math.max(4, hit.damage * 0.5);
      const chip = hit.chip ?? 0;
      if (chip > 0) defender.health = Math.max(COMBAT.chipFloor, defender.health - chip);
      defender.vx = dirSign * (hit.pushX ?? 6) * 0.5;
      attacker.vx = -dirSign * (hit.selfPushX ?? 2);
      defender.addMeter(COMBAT.meterOnBlock);
      attacker.addMeter(COMBAT.meterOnBlock * 0.6);
      attacker.hitstop = Math.max(2, (hit.hitstop ?? 6) - 2);
      defender.hitstop = Math.max(2, (hit.hitstop ?? 6) - 2);
      this.shake = Math.max(this.shake, 1.4);
      this.pushFx({ kind: "block", x: contact.x, y: contact.y, scale: 0.9 });

      if (defender.guard <= 0) {
        defender.guard = 0;
        defender.setState("guardBreak");
        defender.endCombo();
        this.pushFx({ kind: "guardBreak", x: defender.x, y: defender.y + 70, scale: 1.4 });
        this.shake = Math.max(this.shake, 6);
      }
      return;
    }

    // Armor absorbs the hit but still takes chip-ish damage.
    if (defender.armorLeft > 0 && guard !== "unblockable") {
      defender.armorLeft--;
      const armorScale = defender.move?.armor?.[0]?.damageScale ?? 0.4;
      defender.health = Math.max(1, defender.health - hit.damage * armorScale);
      defender.flash = 6;
      attacker.hitstop = 6;
      defender.hitstop = 4;
      this.pushFx({ kind: "spark", x: contact.x, y: contact.y, scale: 1.1 });
      return;
    }

    const counter = defender.inStartup && !fromProjectile;
    const scale = Math.max(COMBAT.minScale, defender.scaling);
    const damage = Math.max(1, Math.round(hit.damage * scale * (counter ? COMBAT.counterDamageScale : 1)));

    defender.health = Math.max(0, defender.health - damage);
    defender.flash = 8;
    defender.releaseHold();
    defender.scaling = Math.max(COMBAT.minScale, defender.scaling * COMBAT.scaleStep);

    const stunBase = hit.hitstun + (counter ? COMBAT.counterHitstunBonus : 0);
    const juggleScale = Math.pow(COMBAT.juggleDecay, defender.juggleCount);
    defender.hitstun = Math.max(COMBAT.minHitstun, Math.round(stunBase * juggleScale));

    const hitstop = (hit.hitstop ?? 8) + (counter ? COMBAT.counterBonus : 0);
    attacker.hitstop = hitstop;
    defender.hitstop = hitstop;

    attacker.addMeter((hit.meterGain ?? COMBAT.meterOnHit) * (counter ? 1.3 : 1));
    defender.addMeter(hit.meterGainDefender ?? COMBAT.meterOnTakeHit);

    const kd = hit.knockdown ?? "none";
    const airborne = !defender.grounded || kd === "launch" || hit.launch;

    if (hit.launch || kd === "launch") {
      const [lx, ly] = hit.launch ?? [3, 11];
      defender.vx = dirSign * lx * (1 / weight);
      defender.vy = ly * (1 / Math.max(0.75, weight));
      defender.y = Math.max(defender.y, GROUND_Y + 1);
      defender.juggleCount++;
      defender.setState("hitstunAir");
      defender.pendingKnockdown = "soft";
    } else if (airborne) {
      defender.vx = dirSign * (hit.pushX ?? 5) * 0.6 * (1 / weight);
      defender.vy = Math.max(defender.vy * 0.4, 2.2);
      defender.juggleCount++;
      defender.setState("hitstunAir");
      defender.pendingKnockdown = kd === "none" ? "soft" : kd;
    } else if (kd === "sweep" || kd === "hard" || kd === "soft" || kd === "crumple") {
      defender.vx = dirSign * (hit.pushX ?? 6) * (1 / weight);
      defender.knockDown(kd === "sweep" ? "soft" : kd);
      defender.hitstun = 0;
    } else {
      defender.vx = dirSign * (hit.pushX ?? 5) * (1 / weight);
      defender.lastHitHeight = guard === "low" ? "low" : guard === "overhead" || guard === "high" ? "high" : "mid";
      defender.setState("hitstun");
    }

    // Corner pushback: the attacker gets moved instead.
    const wall = STAGE_HALF_WIDTH - defender.def.stats.width - 2;
    if (Math.abs(defender.x) >= wall && Math.sign(defender.x) === dirSign) {
      attacker.vx = -dirSign * (hit.pushX ?? 5) * 0.7;
    } else if (hit.selfPushX) {
      attacker.vx = -dirSign * hit.selfPushX;
    }

    const banner = this.combo[attacker.index];
    const hits = (banner?.hits ?? 0) + 1;
    this.combo[attacker.index] = {
      hits,
      damage: (banner?.damage ?? 0) + damage,
      owner: attacker.index,
      life: 100,
    };
    defender.comboHits = hits;

    this.shake = Math.max(this.shake, (hit.shake ?? 1) * (2 + damage * 0.09) * (counter ? 1.4 : 1));
    this.pushFx({
      kind: hit.fx ?? "blunt",
      x: contact.x,
      y: contact.y,
      scale: 0.8 + damage * 0.02,
      angle: dirSign > 0 ? 0 : Math.PI,
      facing: dirSign,
    });
    if (counter) this.pushFx({ kind: "spark", x: contact.x, y: contact.y, scale: 1.3 });
  }

  // -------------------------------------------------------------------------
  // Throws
  // -------------------------------------------------------------------------

  private resolveThrows(attacker: Fighter, defender: Fighter) {
    const t = attacker.move?.throwDef;
    if (!t || attacker.state !== "move") return;
    if (attacker.moveFrame < t.from || attacker.moveFrame > t.to) return;
    if (attacker.holding) return;

    const inRange =
      Math.abs(defender.x - attacker.x) <= t.range &&
      (t.airOk || defender.grounded) &&
      defender.y >= (t.minY ?? -10) &&
      defender.y <= (t.maxY ?? 60);

    const throwable =
      !defender.hasInvuln("throw") &&
      defender.state !== "knockdown" &&
      defender.state !== "hitstunAir" &&
      defender.state !== "ko" &&
      !defender.holding;

    if (!inRange || !throwable) {
      if (attacker.moveFrame === t.to && t.whiff) attacker.startMove(t.whiff, true);
      return;
    }

    attacker.holding = defender;
    defender.grabbedBy = attacker;
    defender.setState("grabbed");
    defender.endCombo();
    attacker.startMove(t.success, true);
    attacker.hitstop = 6;
    defender.hitstop = 6;
    this.pushFx({ kind: "spark", x: (attacker.x + defender.x) / 2, y: attacker.y + 60, scale: 1 });
  }

  // -------------------------------------------------------------------------
  // Projectiles
  // -------------------------------------------------------------------------

  private spawnProjectiles(f: Fighter) {
    if (f.state !== "move" || !f.move?.projectiles || f.hitstop > 0) return;
    for (const spec of f.move.projectiles) {
      if (spec.at !== f.moveFrame) continue;
      this.projectiles.push({
        id: ++projId,
        owner: f.index,
        kind: spec.kind,
        x: f.x + f.facing * spec.x,
        y: f.y + spec.y,
        vx: f.facing * spec.vx,
        vy: spec.vy,
        gravity: spec.gravity ?? 0,
        life: spec.life,
        age: 0,
        spec,
        hitsLeft: spec.hits ?? 1,
        facing: f.facing,
        spin: spec.spin ?? 0,
        dead: false,
      });
      this.pushFx({ kind: "spawn", x: f.x + f.facing * spec.x, y: f.y + spec.y, scale: spec.scale ?? 1 });
    }
  }

  private updateProjectiles() {
    for (const p of this.projectiles) {
      if (p.dead) continue;
      p.age++;
      p.vy -= p.gravity;
      p.x += p.vx;
      p.y += p.vy;

      if (p.spec.trail && p.age % 2 === 0) {
        this.pushFx({ kind: "trail", x: p.x, y: p.y, color: p.spec.trail, scale: p.spec.scale ?? 1 });
      }

      const grounded = p.y <= GROUND_Y + 2 && p.gravity > 0;
      const expired = p.age >= p.life || Math.abs(p.x) > STAGE_HALF_WIDTH + 60;

      if (this.roundActive) {
        const target = this.fighters[p.owner === 0 ? 1 : 0];
        const box = toWorldBox(p.spec.box, p.x, p.y, p.facing);
        if (!target.hasInvuln("projectile") && !target.hasInvuln("strike")) {
          const hurt = target.hurtboxes();
          if (hurt.some((h) => boxesOverlap(box, h))) {
            const hitDef: HitDef = {
              from: 0,
              to: 0,
              box: p.spec.box,
              damage: p.spec.damage,
              hitstun: p.spec.hitstun,
              blockstun: p.spec.blockstun,
              guard: p.spec.guard,
              knockdown: p.spec.knockdown,
              chip: p.spec.chip,
              pushX: p.spec.pushX,
              hitstop: p.spec.hitstop,
              fx: p.spec.fx,
              meterGain: p.spec.meterGain,
            };
            const owner = this.fighters[p.owner];
            this.applyHit(owner, target, hitDef, { x: p.x, y: p.y }, true);
            p.hitsLeft--;
            if (p.hitsLeft <= 0) this.killProjectile(p, false);
          }
        }
      }

      // Projectile clashes.
      if (p.spec.clashes && !p.dead) {
        for (const q of this.projectiles) {
          if (q.dead || q.owner === p.owner || !q.spec.clashes) continue;
          const bp = toWorldBox(p.spec.box, p.x, p.y, p.facing);
          const bq = toWorldBox(q.spec.box, q.x, q.y, q.facing);
          if (boxesOverlap(bp, bq)) {
            this.killProjectile(p, false);
            this.killProjectile(q, false);
            this.pushFx({ kind: "spark", x: (p.x + q.x) / 2, y: (p.y + q.y) / 2, scale: 1.4 });
          }
        }
      }

      if (!p.dead && (expired || grounded)) this.killProjectile(p, true);
    }
    this.projectiles = this.projectiles.filter((p) => !p.dead);
  }

  private killProjectile(p: Projectile, natural: boolean) {
    if (p.dead) return;
    p.dead = true;
    const det = p.spec.detonate;
    if (!det) {
      this.pushFx({ kind: p.spec.fx ?? "spark", x: p.x, y: Math.max(p.y, GROUND_Y + 4), scale: 0.8 });
      return;
    }
    if (!natural && p.hitsLeft > 0) return;

    this.pushFx({ kind: "explode", x: p.x, y: Math.max(p.y, GROUND_Y + 10), scale: det.radius / 40 });
    this.shake = Math.max(this.shake, 7);
    const owner = this.fighters[p.owner];
    const target = this.fighters[p.owner === 0 ? 1 : 0];
    const dist = Math.hypot(target.x - p.x, target.y + 40 - p.y);
    if (dist <= det.radius && this.roundActive && !target.hasInvuln("strike")) {
      const hitDef: HitDef = {
        from: 0,
        to: 0,
        box: { x: -det.radius, y: 0, w: det.radius * 2, h: det.radius * 2 },
        damage: det.damage,
        hitstun: det.hitstun,
        blockstun: det.blockstun,
        guard: det.guard ?? "mid",
        knockdown: det.knockdown ?? "hard",
        chip: det.chip,
        pushX: 8,
        launch: det.knockdown === "launch" ? [4, 12] : undefined,
        fx: "explode",
        hitstop: 10,
        shake: 2,
      };
      const dir = target.x >= p.x ? 1 : -1;
      const saved = owner.x;
      owner.x = p.x - dir * 10;
      this.applyHit(owner, target, hitDef, { x: target.x, y: target.y + 40 }, true);
      owner.x = saved;
    }
  }

  // -------------------------------------------------------------------------
  // Ambient effects
  // -------------------------------------------------------------------------

  private emitMovementFx() {
    for (const f of this.fighters) {
      if (f.hitstop > 0) continue;
      if ((f.state === "dash" || f.state === "backdash") && f.stateFrame % 4 === 1) {
        this.pushFx({ kind: "dust", x: f.x - f.facing * 12, y: GROUND_Y + 2, scale: 0.8 });
      }
      if (f.state === "land" && f.stateFrame === 1) {
        this.pushFx({ kind: "dust", x: f.x, y: GROUND_Y + 2, scale: 1.1 });
      }
      if (f.state === "knockdown" && f.stateFrame === 1) {
        this.pushFx({ kind: "dust", x: f.x, y: GROUND_Y + 4, scale: 1.6 });
        this.shake = Math.max(this.shake, 4);
      }
      if (f.state === "move" && f.move?.vfx) {
        for (const v of f.move.vfx) {
          if (v.at !== f.moveFrame) continue;
          this.pushFx({
            kind: v.kind as FxEvent["kind"],
            x: f.x + f.facing * v.x,
            y: f.y + v.y,
            scale: v.scale ?? 1,
            color: v.color,
            facing: f.facing,
          });
        }
      }
      if (f.state === "move" && f.move?.superFreeze && f.moveFrame === 1) {
        this.freeze = f.move.superFreeze;
        this.pushFx({ kind: "super", x: f.x, y: f.y + 50, scale: 2, color: f.def.palette.aura });
        this.shake = Math.max(this.shake, 5);
      }
    }
  }

  /** Where the camera should look. */
  cameraFocus(): { x: number; spread: number } {
    const [a, b] = this.fighters;
    return { x: (a.x + b.x) / 2, spread: Math.abs(a.x - b.x) };
  }
}

export type { WorldBox };
