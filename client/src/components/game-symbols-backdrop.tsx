import {
  Gamepad2,
  Trophy,
  Dices,
  Sword,
  Ghost,
  Heart,
  Star,
  Zap,
  Crown,
  Target,
  Puzzle,
  Rocket,
} from "lucide-react";

const ICONS = [Gamepad2, Trophy, Dices, Sword, Ghost, Heart, Star, Zap, Crown, Target, Puzzle, Rocket];

// Deterministic pseudo-random so the layout is stable across renders
function seeded(i: number, salt: number) {
  const x = Math.sin(i * 127.1 + salt * 311.7) * 43758.5453;
  return x - Math.floor(x);
}

/**
 * Ambient floating game symbols. Purely decorative: very low opacity,
 * no pointer events, and the global prefers-reduced-motion rule in
 * index.css freezes the animation for users who ask for less motion.
 */
export default function GameSymbolsBackdrop({ count = 16 }: { count?: number }) {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {Array.from({ length: count }).map((_, i) => {
        const Icon = ICONS[i % ICONS.length];
        const left = seeded(i, 1) * 96; // %
        const top = seeded(i, 2) * 92; // %
        const size = 22 + seeded(i, 3) * 34; // px
        const duration = 14 + seeded(i, 4) * 18; // s
        const delay = -seeded(i, 5) * 20; // negative = start mid-animation
        const drift = i % 2 === 0 ? "float-drift-a" : "float-drift-b";
        return (
          <Icon
            key={i}
            className="absolute text-primary"
            style={{
              left: `${left}%`,
              top: `${top}%`,
              width: size,
              height: size,
              opacity: 0.05,
              animation: `${drift} ${duration}s ease-in-out ${delay}s infinite`,
            }}
          />
        );
      })}
    </div>
  );
}
