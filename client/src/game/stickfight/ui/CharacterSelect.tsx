/** Character select: roster grid, stats panel, mode and difficulty options. */

import { useState } from "react";
import { AI_LEVELS, type AiLevel } from "../constants";
import { ROSTER } from "../fighters";
import type { FighterDef } from "../types";
import type { GameMode } from "../engine/game";
import { FighterPortrait } from "./Portrait";

interface Props {
  onStart: (opts: { p1: string; p2: string; mode: GameMode; aiLevel: AiLevel; rounds: number }) => void;
  onShowMoves: (id: string) => void;
}

function StatBar({ label, value, max = 5 }: { label: string; value: number; max?: number }) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-20 text-[10px] uppercase tracking-widest text-white/50">{label}</span>
      <div className="flex gap-0.5">
        {Array.from({ length: max }).map((_, i) => (
          <span key={i} className={`h-1.5 w-4 rounded-sm ${i < value ? "bg-amber-400" : "bg-white/15"}`} />
        ))}
      </div>
    </div>
  );
}

function ratingFor(def: FighterDef) {
  const s = def.stats;
  return {
    power: Math.min(5, Math.round((s.health / 240) * 1.1)),
    speed: Math.min(5, Math.round(s.walkF * 1.6)),
    range: def.id === "roman" ? 5 : def.id === "western" ? 4 : 3,
    tricky: Math.min(5, def.difficulty + 1),
  };
}

function Card({
  def,
  selected,
  dim,
  onPick,
  onHover,
}: {
  def: FighterDef;
  selected: "p1" | "p2" | "both" | null;
  dim: boolean;
  onPick: () => void;
  onHover: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onPick}
      onMouseEnter={onHover}
      onFocus={onHover}
      className={`group relative overflow-hidden rounded-lg border-2 p-3 text-left transition ${
        selected
          ? "border-amber-400 bg-amber-400/10 shadow-[0_0_24px_-4px_rgba(251,191,36,0.6)]"
          : "border-white/10 bg-white/[0.03] hover:border-white/40"
      } ${dim ? "opacity-60" : ""}`}
    >
      <div
        className="absolute inset-0 opacity-25"
        style={{ background: `radial-gradient(circle at 50% 25%, ${def.palette.accent}, transparent 65%)` }}
      />
      <FighterPortrait def={def} className="relative h-32 w-full" />
      <div className="relative mt-1">
        <div className="text-sm font-bold uppercase tracking-wide text-white">{def.name}</div>
        <div className="text-[10px] uppercase tracking-widest text-white/50">{def.archetype}</div>
      </div>
      {selected && (
        <span className="absolute right-2 top-2 rounded bg-amber-400 px-1.5 py-0.5 text-[10px] font-bold text-black">
          {selected === "both" ? "P1 · P2" : selected.toUpperCase()}
        </span>
      )}
    </button>
  );
}

export function CharacterSelect({ onStart, onShowMoves }: Props) {
  const [p1, setP1] = useState(ROSTER[0].id);
  const [p2, setP2] = useState(ROSTER[1].id);
  const [picking, setPicking] = useState<"p1" | "p2">("p1");
  const [hover, setHover] = useState(ROSTER[0].id);
  const [mode, setMode] = useState<GameMode>("cpu");
  const [aiLevel, setAiLevel] = useState<AiLevel>("Veteran");
  const [rounds, setRounds] = useState(2);

  const preview = ROSTER.find((f) => f.id === hover) ?? ROSTER[0];
  const ratings = ratingFor(preview);

  const pick = (id: string) => {
    if (picking === "p1") {
      setP1(id);
      setPicking("p2");
    } else {
      setP2(id);
      setPicking("p1");
    }
  };

  return (
    <div className="flex h-full flex-col gap-4 overflow-y-auto p-4 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-black uppercase italic tracking-tight text-white sm:text-3xl">
            Choose your fighter
          </h2>
          <p className="text-xs text-white/50">
            Selecting for <span className="font-bold text-amber-300">{picking.toUpperCase()}</span> · click a fighter to
            lock in
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex overflow-hidden rounded-md border border-white/15">
            {(["cpu", "versus"] as GameMode[]).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider transition ${
                  mode === m ? "bg-amber-400 text-black" : "text-white/70 hover:bg-white/10"
                }`}
              >
                {m === "cpu" ? "1P vs CPU" : "2 Players"}
              </button>
            ))}
          </div>

          {mode === "cpu" && (
            <select
              value={aiLevel}
              onChange={(e) => setAiLevel(e.target.value as AiLevel)}
              className="rounded-md border border-white/15 bg-black/40 px-2 py-1.5 text-xs font-bold uppercase tracking-wider text-white"
            >
              {AI_LEVELS.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
          )}

          <select
            value={rounds}
            onChange={(e) => setRounds(Number(e.target.value))}
            className="rounded-md border border-white/15 bg-black/40 px-2 py-1.5 text-xs font-bold uppercase tracking-wider text-white"
          >
            <option value={1}>1 round</option>
            <option value={2}>Best of 3</option>
            <option value={3}>Best of 5</option>
          </select>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {ROSTER.map((def) => (
            <Card
              key={def.id}
              def={def}
              selected={p1 === def.id && p2 === def.id ? "both" : p1 === def.id ? "p1" : p2 === def.id ? "p2" : null}
              dim={false}
              onPick={() => pick(def.id)}
              onHover={() => setHover(def.id)}
            />
          ))}
          <div className="flex min-h-[180px] flex-col items-center justify-center rounded-lg border-2 border-dashed border-white/10 p-3 text-center">
            <span className="text-3xl text-white/20">+</span>
            <span className="mt-1 text-[10px] uppercase tracking-widest text-white/30">More fighters soon</span>
          </div>
        </div>

        <aside className="flex flex-col gap-3 rounded-lg border border-white/10 bg-black/30 p-4">
          <div>
            <div className="text-xl font-black uppercase italic tracking-tight text-white">{preview.name}</div>
            <div className="text-[11px] uppercase tracking-widest" style={{ color: preview.palette.accent }}>
              {preview.title} · {preview.era}
            </div>
          </div>
          <p className="text-xs leading-relaxed text-white/60">{preview.bio}</p>

          <div className="flex flex-col gap-1.5">
            <StatBar label="Power" value={ratings.power} />
            <StatBar label="Speed" value={ratings.speed} />
            <StatBar label="Range" value={ratings.range} />
            <StatBar label="Difficulty" value={preview.difficulty} />
          </div>

          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div>
              <div className="mb-1 font-bold uppercase tracking-wider text-emerald-400">Strengths</div>
              <ul className="space-y-0.5 text-white/60">
                {preview.strengths.map((s) => (
                  <li key={s}>· {s}</li>
                ))}
              </ul>
            </div>
            <div>
              <div className="mb-1 font-bold uppercase tracking-wider text-rose-400">Weaknesses</div>
              <ul className="space-y-0.5 text-white/60">
                {preview.weaknesses.map((s) => (
                  <li key={s}>· {s}</li>
                ))}
              </ul>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onShowMoves(preview.id)}
            className="rounded-md border border-white/15 px-3 py-2 text-xs font-bold uppercase tracking-wider text-white/80 transition hover:bg-white/10"
          >
            View move list ({preview.moves.filter((m) => !m.internal).length} moves)
          </button>
        </aside>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-white/10 bg-black/30 p-3">
        <div className="flex items-center gap-4">
          {[p1, p2].map((id, i) => {
            const def = ROSTER.find((f) => f.id === id)!;
            return (
              <div key={i} className="flex items-center gap-2">
                <FighterPortrait def={def} className="h-14 w-14" facing={i === 0 ? 1 : -1} />
                <div>
                  <div className="text-[10px] uppercase tracking-widest text-white/40">P{i + 1}</div>
                  <div className="text-sm font-bold text-white">{def.name}</div>
                </div>
              </div>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => onStart({ p1, p2, mode, aiLevel, rounds })}
          className="rounded-md bg-amber-400 px-8 py-3 text-lg font-black uppercase italic tracking-wide text-black transition hover:bg-amber-300"
        >
          Fight
        </button>
      </div>
    </div>
  );
}
