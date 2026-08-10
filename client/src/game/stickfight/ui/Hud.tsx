/** In-match HUD: health, super meter, guard, ammo, timer and round pips. */

import { useEffect, useRef, useState } from "react";
import type { HudState, PlayerHud } from "../engine/game";

function HealthBar({ player, side }: { player: PlayerHud; side: "left" | "right" }) {
  const pct = Math.max(0, (player.health / player.maxHealth) * 100);
  // Delayed "chip" bar that drains behind the real one.
  const [ghost, setGhost] = useState(pct);
  const timeout = useRef<number | null>(null);

  useEffect(() => {
    if (pct >= ghost) {
      setGhost(pct);
      return;
    }
    if (timeout.current) window.clearTimeout(timeout.current);
    timeout.current = window.setTimeout(() => setGhost(pct), 420);
    return () => {
      if (timeout.current) window.clearTimeout(timeout.current);
    };
  }, [pct, ghost]);

  const flip = side === "right";
  return (
    <div className={`flex-1 ${flip ? "items-end" : "items-start"} flex flex-col gap-1`}>
      <div className={`flex w-full items-baseline gap-2 ${flip ? "flex-row-reverse" : ""}`}>
        <span className="text-sm font-bold uppercase tracking-wide text-white drop-shadow">{player.name}</span>
        <span className="hidden text-[10px] uppercase tracking-widest text-white/60 sm:inline">{player.title}</span>
      </div>

      <div
        className={`relative h-5 w-full overflow-hidden rounded-sm border-2 border-black/60 bg-black/50 ${
          flip ? "rotate-180" : ""
        }`}
      >
        <div
          className="absolute inset-y-0 left-0 bg-red-500/70 transition-[width] duration-500"
          style={{ width: `${ghost}%` }}
        />
        <div
          className="absolute inset-y-0 left-0 bg-gradient-to-b from-amber-300 via-amber-400 to-amber-600 transition-[width] duration-100"
          style={{ width: `${pct}%` }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-white/25 to-transparent" />
      </div>

      {/* Guard meter */}
      <div className={`h-1.5 w-2/3 overflow-hidden rounded-sm bg-black/50 ${flip ? "rotate-180" : ""}`}>
        <div
          className="h-full bg-sky-400/80 transition-[width] duration-200"
          style={{ width: `${Math.max(0, player.guard)}%` }}
        />
      </div>

      {player.resource && (
        <div className={`flex items-center gap-1 ${flip ? "flex-row-reverse" : ""}`}>
          <span className="text-[10px] uppercase tracking-wider text-white/70">{player.resource.name}</span>
          {player.resource.pips ? (
            <div className="flex gap-1">
              {Array.from({ length: player.resource.max }).map((_, i) => (
                <span
                  key={i}
                  className="h-2 w-2 rounded-full border border-black/60"
                  style={{
                    background: i < Math.floor(player.resource!.value) ? player.resource!.color : "#00000066",
                  }}
                />
              ))}
            </div>
          ) : (
            <div className="h-2 w-24 overflow-hidden rounded-sm bg-black/50">
              <div
                className="h-full transition-[width] duration-200"
                style={{
                  width: `${(player.resource.value / player.resource.max) * 100}%`,
                  background: player.resource.color,
                }}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function MeterBar({ player, side }: { player: PlayerHud; side: "left" | "right" }) {
  const stocks = Math.floor(player.meter / 100);
  const partial = (player.meter % 100) / 100;
  const flip = side === "right";
  return (
    <div className={`flex items-center gap-1.5 ${flip ? "flex-row-reverse" : ""}`}>
      <span className="text-[10px] font-bold uppercase tracking-widest text-white/70">Meter</span>
      <div className={`flex gap-1 ${flip ? "flex-row-reverse" : ""}`}>
        {[0, 1].map((i) => (
          <div key={i} className="h-2.5 w-20 overflow-hidden rounded-sm border border-black/60 bg-black/50 sm:w-28">
            <div
              className={`h-full transition-[width] duration-150 ${
                i < stocks ? "bg-gradient-to-r from-cyan-300 to-sky-500" : "bg-sky-500/70"
              }`}
              style={{ width: i < stocks ? "100%" : i === stocks ? `${partial * 100}%` : "0%" }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

function RoundPips({ wins, roundsToWin, side }: { wins: number; roundsToWin: number; side: "left" | "right" }) {
  return (
    <div className={`flex gap-1 ${side === "right" ? "flex-row-reverse" : ""}`}>
      {Array.from({ length: roundsToWin }).map((_, i) => (
        <span
          key={i}
          className={`h-3 w-3 rounded-full border-2 border-black/60 ${
            i < wins ? "bg-amber-400 shadow-[0_0_8px_2px_rgba(251,191,36,0.6)]" : "bg-white/15"
          }`}
        />
      ))}
    </div>
  );
}

export function Hud({ state, roundsToWin }: { state: HudState; roundsToWin: number }) {
  const [p1, p2] = state.players;
  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-10 select-none p-2 sm:p-4">
      <div className="flex items-start gap-3">
        <HealthBar player={p1} side="left" />

        <div className="flex min-w-[76px] flex-col items-center gap-1">
          <div className="rounded-md border-2 border-black/60 bg-black/60 px-3 py-1 font-mono text-2xl font-bold text-amber-300 tabular-nums sm:text-3xl">
            {String(Math.max(0, state.timer)).padStart(2, "0")}
          </div>
          <div className="flex items-center gap-3">
            <RoundPips wins={p1.wins} roundsToWin={roundsToWin} side="left" />
            <span className="text-[10px] uppercase tracking-widest text-white/60">R{state.round}</span>
            <RoundPips wins={p2.wins} roundsToWin={roundsToWin} side="right" />
          </div>
        </div>

        <HealthBar player={p2} side="right" />
      </div>

      <div className="mt-2 flex items-center justify-between">
        <MeterBar player={p1} side="left" />
        <MeterBar player={p2} side="right" />
      </div>

      {/* Combo counters */}
      <div className="mt-3 flex items-start justify-between px-1">
        <div className="h-14">
          {p1.combo > 1 && (
            <div className="animate-in fade-in slide-in-from-left-4 text-left">
              <div className="text-3xl font-black italic text-amber-300 drop-shadow-[2px_2px_0_rgba(0,0,0,0.8)]">
                {p1.combo} <span className="text-lg">HITS</span>
              </div>
              <div className="text-xs font-bold uppercase tracking-wider text-white/70">
                {Math.round(p1.comboDamage)} damage
              </div>
            </div>
          )}
        </div>
        <div className="h-14">
          {p2.combo > 1 && (
            <div className="animate-in fade-in slide-in-from-right-4 text-right">
              <div className="text-3xl font-black italic text-amber-300 drop-shadow-[2px_2px_0_rgba(0,0,0,0.8)]">
                {p2.combo} <span className="text-lg">HITS</span>
              </div>
              <div className="text-xs font-bold uppercase tracking-wider text-white/70">
                {Math.round(p2.comboDamage)} damage
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function Announcement({ state }: { state: HudState }) {
  if (!state.announcement) return null;
  const big = state.announcement === "K.O." || state.announcement === "Double K.O.";
  return (
    <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center">
      <div
        key={state.announcement}
        className={`animate-in zoom-in-50 fade-in duration-200 font-black italic uppercase tracking-tight drop-shadow-[4px_4px_0_rgba(0,0,0,0.85)] ${
          big ? "text-7xl text-red-500 sm:text-8xl" : "text-5xl text-amber-300 sm:text-6xl"
        }`}
      >
        {state.announcement}
      </div>
    </div>
  );
}
