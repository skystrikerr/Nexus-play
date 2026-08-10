/**
 * The roster.
 *
 * Adding a fighter:
 *   1. Copy one of the existing files (roman.ts is the most straightforward).
 *   2. Give it a unique `id`, its own stats, stance, props and moves.
 *   3. Import it here and add it to ROSTER - nothing else in the game needs to
 *      change. The select screen, move list, AI and renderer are all driven by
 *      the FighterDef.
 *
 * Conventions worth keeping so characters feel like they belong together:
 *   - 5A/5B/5C, 2A/2B/2C, j.A/j.B/j.C, 6B (overhead), 3C (launcher),
 *     dashAttack, plus specials on qcf / qcb / dp and one super.
 *   - EX versions use the S button with a motion and cost 50 meter.
 *   - A + C is the character's signature skill; S is held to block.
 *   - Exactly five moves tagged `special` (see selftest.ts for the contract).
 */

import type { FighterDef } from "../types";
import { PIRATE } from "./pirate";
import { ROMAN } from "./roman";
import { SAMURAI } from "./samurai";
import { SPARTAN } from "./spartan";
import { WESTERN } from "./western";

export const ROSTER: FighterDef[] = [ROMAN, SPARTAN, PIRATE, SAMURAI, WESTERN];

export const ROSTER_BY_ID: Record<string, FighterDef> = Object.fromEntries(
  ROSTER.map((f) => [f.id, f]),
);

export function getFighter(id: string): FighterDef {
  return ROSTER_BY_ID[id] ?? ROSTER[0];
}

export { ROMAN, SPARTAN, PIRATE, SAMURAI, WESTERN };
