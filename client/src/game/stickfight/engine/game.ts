/**
 * Glue between the simulation, the renderer and React: a fixed 60 Hz loop with
 * an accumulator, input reading for both players, and a HUD snapshot pushed to
 * the UI whenever something changes.
 */

import type { AiLevel } from "../constants";
import { COMBAT, FPS, MATCH } from "../constants";
import { getFighter } from "../fighters";
import { GameRenderer } from "../render/renderer";
import { randomTheme, themeForFighter, type StageTheme } from "../render/stage";
import type { FighterDef } from "../types";
import { AiController } from "./ai";
import { Sfx } from "./audio";
import { GamepadReader, Keyboard, mergeInputs, P1_KEYS, P2_KEYS, type RawInput } from "./input";
import { Match, type Phase } from "./match";

export type GameMode = "cpu" | "versus";

export interface GameOptions {
  p1: string;
  p2: string;
  mode: GameMode;
  aiLevel: AiLevel;
  roundsToWin?: number;
  /** A specific stage, or "random" to roll one per match. */
  stage?: StageTheme | "random";
}

export interface PlayerHud {
  name: string;
  title: string;
  health: number;
  maxHealth: number;
  meter: number;
  maxMeter: number;
  guard: number;
  wins: number;
  resource?: { name: string; value: number; max: number; color: string; pips: boolean };
  combo: number;
  comboDamage: number;
  accent: string;
}

export interface HudState {
  phase: Phase;
  timer: number;
  round: number;
  players: [PlayerHud, PlayerHud];
  announcement: string | null;
  matchWinner: 0 | 1 | null;
  winnerName: string | null;
  winQuote: string | null;
  paused: boolean;
}

export class GameSession {
  match: Match;
  renderer: GameRenderer | null = null;
  readonly keyboard = new Keyboard();
  readonly gamepads = new GamepadReader();
  readonly sfx = new Sfx();
  private ai: AiController | null = null;
  private raf = 0;
  private last = 0;
  private acc = 0;
  private running = false;
  paused = false;
  private detachKeys: (() => void) | null = null;
  private defs: [FighterDef, FighterDef];

  onHud: ((s: HudState) => void) | null = null;

  constructor(private options: GameOptions) {
    this.defs = [getFighter(options.p1), getFighter(options.p2)];
    this.match = new Match(this.defs, options.roundsToWin ?? MATCH.roundsToWin);
    this.theme =
      options.stage === "random"
        ? randomTheme()
        : (options.stage ?? themeForFighter(options.p1));
    if (options.mode === "cpu") this.ai = new AiController(options.aiLevel);
  }

  /** The stage actually in use once "random" has been resolved. */
  readonly theme: StageTheme;

  attach(canvas: HTMLCanvasElement) {
    const theme = this.theme;
    this.renderer = new GameRenderer(canvas, this.match, theme);
    this.detachKeys = this.keyboard.attach(window);
    this.resize(canvas.clientWidth, canvas.clientHeight);
    // Handy for poking at a live match from the console (F2 toggles hitboxes).
    (window as unknown as { stickfight?: GameSession }).stickfight = this;
  }

  resize(width: number, height: number) {
    this.renderer?.setSize(width, height);
  }

  start() {
    if (this.running) return;
    this.running = true;
    this.last = performance.now();
    this.acc = 0;
    this.loop();
  }

  stop() {
    this.running = false;
    cancelAnimationFrame(this.raf);
  }

  dispose() {
    this.stop();
    this.detachKeys?.();
    this.renderer?.dispose();
    this.renderer = null;
  }

  restart() {
    this.match = new Match(this.defs, this.options.roundsToWin ?? MATCH.roundsToWin);
    this.ai?.reset();
    this.renderer?.resetEffects();
    this.paused = false;
    this.pushHud();
  }

  setAiLevel(level: AiLevel) {
    this.options.aiLevel = level;
    if (this.ai) this.ai.level = level;
  }

  toggleBoxes() {
    if (this.renderer) this.renderer.showBoxes = !this.renderer.showBoxes;
  }

  private loop = () => {
    if (!this.running) return;
    this.raf = requestAnimationFrame(this.loop);

    const now = performance.now();
    let delta = (now - this.last) / 1000;
    this.last = now;
    if (delta > 0.25) delta = 0.25;

    if (!this.paused) {
      this.acc += delta;
      const stepTime = 1 / FPS;
      let steps = 0;
      while (this.acc >= stepTime && steps < 5) {
        this.stepOnce();
        this.acc -= stepTime;
        steps++;
      }
    }

    this.renderer?.render(this.match);
    this.pushHud();
  };

  private stepOnce() {
    // Player 1 is keyboard + first pad; player 2 is keyboard + second pad, or
    // the first pad when nobody is on the keyboard-2 layout.
    const p1 = mergeInputs(this.keyboard.read(P1_KEYS, "p1"), this.gamepads.read(0));
    let p2: RawInput;
    if (this.options.mode === "versus") {
      p2 = mergeInputs(this.keyboard.read(P2_KEYS, "p2"), this.gamepads.read(1));
    } else {
      p2 = this.ai!.step(this.match, this.match.fighters[1], this.match.fighters[0]);
    }
    const phaseBefore = this.match.phase;
    const announcementBefore = this.match.phaseFrame;
    this.match.step([p1, p2]);

    for (const e of this.match.fx) this.sfx.play(e);
    if (this.match.phase !== phaseBefore) {
      if (this.match.phase === "fight") this.sfx.cue("fight");
      else if (this.match.phase === "roundEnd") this.sfx.cue("win");
      else if (this.match.phase === "intro" && announcementBefore > 0) this.sfx.cue("round");
    }
  }

  /** True when a pad's Start button was tapped since the last call. */
  pollPause(): boolean {
    return this.gamepads.startPressed(0) || this.gamepads.startPressed(1);
  }

  padCount(): number {
    return this.gamepads.count();
  }

  // -------------------------------------------------------------------------

  private lastHudKey = "";

  private pushHud() {
    if (!this.onHud) return;
    const state = this.hud();
    const key = [
      state.phase,
      Math.ceil(state.timer),
      state.round,
      state.announcement,
      state.matchWinner,
      state.paused,
      ...state.players.flatMap((p) => [
        Math.round(p.health),
        Math.round(p.meter),
        Math.round(p.guard),
        p.wins,
        p.combo,
        Math.round(p.resource?.value ?? 0),
      ]),
    ].join("|");
    if (key === this.lastHudKey) return;
    this.lastHudKey = key;
    this.onHud(state);
  }

  hud(): HudState {
    const m = this.match;
    const players = m.fighters.map((f, i): PlayerHud => {
      const res = f.def.resource;
      return {
        name: f.def.name,
        title: f.def.title,
        health: f.health,
        maxHealth: f.def.stats.health,
        meter: f.meter,
        maxMeter: COMBAT.maxMeter,
        guard: f.guard,
        wins: f.wins,
        resource: res
          ? { name: res.name, value: f.resource, max: res.max, color: res.color, pips: !!res.pips }
          : undefined,
        combo: m.combo[i as 0 | 1]?.hits ?? 0,
        comboDamage: m.combo[i as 0 | 1]?.damage ?? 0,
        accent: f.def.palette.accent,
      };
    }) as [PlayerHud, PlayerHud];

    let announcement: string | null = null;
    if (m.phase === "intro") {
      announcement = m.phaseFrame < MATCH.introFrames - 24 ? `Round ${m.round}` : "Fight!";
    } else if (m.phase === "fight" && m.phaseFrame < 26) {
      announcement = "Fight!";
    } else if (m.phase === "roundEnd") {
      if (m.lastResult?.reason === "time") announcement = "Time Up";
      else if (m.lastResult?.reason === "double") announcement = "Double K.O.";
      else announcement = "K.O.";
    } else if (m.phase === "matchEnd") {
      announcement = null;
    }

    const winner = m.matchWinner;
    return {
      phase: m.phase,
      timer: Math.ceil(m.timer / FPS),
      round: m.round,
      players,
      announcement,
      matchWinner: winner,
      winnerName: winner !== null ? m.fighters[winner].def.name : null,
      winQuote: winner !== null ? m.fighters[winner].def.winQuote : null,
      paused: this.paused,
    };
  }
}
