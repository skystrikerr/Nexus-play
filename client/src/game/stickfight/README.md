# Stick Fighter

A 2D fighting game rendered with three.js. Two stickmen, side view, orthographic
camera, 60 Hz fixed-step simulation. Everything about a character is data, so
adding fighters means adding one file.

Play it at `/arcade`. Run the checks with `npm run arcade:test`.

## Layout

```
game/stickfight/
  types.ts        every data shape: poses, hitboxes, moves, props, fighters
  skeleton.ts     forward kinematics - joint angles in, joint positions out
  clips.ts        shared movement/reaction animations (idle, walk, hit, KO...)
  constants.ts    the rules: gravity, meter, guard, knockdown, camera, rounds
  selftest.ts     headless checks, including the roster contract

  engine/         pure simulation, no three.js
    input.ts      key/pad state -> facing-relative directions, buffer, motions
    fighter.ts    one fighter: state machine, move selection, physics
    match.ts      collision, hit resolution, projectiles, rounds, effects queue
    ai.ts         CPU opponent - emits the same RawInput a human would
    audio.ts      procedural SFX (no audio files)
    game.ts       fixed-step loop tying simulation, renderer and React together

  render/         three.js only, reads simulation state, never writes it
    rig.ts        skeleton -> outlined bones, head, weapons and props
    stage.ts      parallax backdrops
    fx.ts         pooled particle effects
    renderer.ts   scene, camera framing, projectiles, debug boxes

  fighters/       the roster (one file each) + builders.ts helpers
  ui/             React: HUD, character select, move list, touch controls
```

The simulation never imports three.js and the renderer never mutates the
simulation. That split is what lets the self-test run the whole game headlessly.

## Roster contract

Every fighter must provide, and `npm run arcade:test` enforces it:

| Requirement | Where it comes from |
| --- | --- |
| **5 specials** | moves tagged `special` (EX versions and `variant` moves don't count) |
| **1 light attack** | a move tagged `light` (`5A`) |
| **1 heavy attack** | a move tagged `heavy` (`5C`) |
| **Block** | `universalMoves()` - hold S, or hold back |
| **Dodge** | `universalMoves()` - → + S roll with strike invulnerability |
| **Jump** | `stats.jumpVel` / `stats.gravity` |
| **Character skill** | one move tagged `skill` (A + C) |
| **Super** | one move tagged `super`, 100 meter |
| **Throws** | `universalMoves()` - A + B, and back throw |

Most fighters also carry mediums (`5B`), crouching normals (`2A/2B/2C`), a
command overhead (`6B`), a launcher (`3C`), air normals (`j.A/j.B/j.C`), a dash
attack and one or two EX specials. Copy an existing file and you get the shape
for free.

## Adding a fighter

1. Copy `fighters/roman.ts` to `fighters/<name>.ts`.
2. Change `id`, `name`, bio, palette, `stats` and `stance`.
3. Rework the props (hat, weapon, cape) - they are declarative shapes attached
   to a joint, so no modelling is involved.
4. Write the moves. Five specials, and keep the standard ids so the AI and the
   move list group them correctly.
5. Register it in `fighters/index.ts`.
6. `npm run arcade:test` - it will tell you about dangling follow-up ids,
   hitboxes past the end of a move, animations that stop early, and any missing
   part of the contract.

Nothing else needs touching: select screen, portraits, move list, stages and AI
all read the definition.

### Poses in one minute

A pose is joint angles in degrees, layered over the fighter's stance. `F` is the
lead limb (nearer the opponent), `B` the back limb.

- `shoulderF: 90` raises the front arm straight forward, `180` straight up.
- `elbowF` bends the forearm forward, `kneeF` bends the shin backwards.
- `hipF: 40` swings the front leg forward, negative swings it back.
- `torso` leans towards the opponent, `crouch` (0..1) drops the hips.
- `weapon` rotates whatever is held in the front hand.
- `free: 1` unglues the feet from the floor (airborne poses).

Hitboxes live in facing space too: `bx(x, y, w, h)` with `x` forward from the
fighter and `y` up from the ground.

## Controls

| Input | Action |
| --- | --- |
| WASD / arrows / d-pad | move, jump, crouch |
| J / K / L | light, medium, heavy |
| hold U or `;` | block (add ↓ to block low) |
| ← + S / → + S | parry / dodge roll |
| J + L | character skill |
| J + K | throw |
| ↓↘→ + button | quarter-circle specials |
| →↓↘ + button | dragon punch specials |
| motion + S | EX special (50 meter) |
| Esc / Start | pause · F2 shows hitboxes |

Gamepads use the standard mapping: ✕ light, ○ medium, □ heavy, △/L1/L2 guard,
R1 skill, R2 throw, Start pause. Player 1 gets the first pad, player 2 the
second; keyboard and pad both work at once.
