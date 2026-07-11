import { Button } from "@/components/ui/button";
import {
  Gamepad2,
  Timer,
  Users,
  BarChart3,
  Calendar,
  Trophy,
  ArrowRight,
  Sparkles,
} from "lucide-react";

const features = [
  {
    icon: Sparkles,
    title: "Track Everything",
    description:
      "Games, study, work, exercise, reading, hobbies — one library for everything you spend time on.",
    gradient: "bg-gradient-aurora",
  },
  {
    icon: Timer,
    title: "Built-in Timers",
    description:
      "Start a session with one click, rate its quality, and keep notes on how it went.",
    gradient: "bg-gradient-solar",
  },
  {
    icon: BarChart3,
    title: "Insights & Analytics",
    description:
      "Color-coded charts and statistics show where your hours actually go.",
    gradient: "bg-gradient-pulse",
  },
  {
    icon: Calendar,
    title: "Calendar View",
    description:
      "Every session and task laid out over time, so streaks and gaps are obvious at a glance.",
    gradient: "bg-gradient-neutral",
  },
  {
    icon: Trophy,
    title: "Game Backlog & Tiers",
    description:
      "Plan what to play next, sync your Steam and Xbox libraries, and rank your favorites.",
    gradient: "bg-gradient-aurora",
  },
  {
    icon: Users,
    title: "Community",
    description:
      "Share progress, write reviews, and see what other members are playing and working on.",
    gradient: "bg-gradient-solar",
  },
];

export function Landing() {
  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Ambient glow */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at 20% 0%, rgba(20, 184, 166, 0.14) 0%, transparent 50%), radial-gradient(ellipse at 80% 20%, rgba(139, 92, 246, 0.12) 0%, transparent 50%), radial-gradient(ellipse at 50% 100%, rgba(99, 102, 241, 0.08) 0%, transparent 50%)",
        }}
      />

      <div className="relative container mx-auto px-4">
        {/* Top bar */}
        <header className="flex items-center justify-between py-6">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-aurora rounded-xl flex items-center justify-center shadow-lg shadow-primary/25">
              <Gamepad2 className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-display font-bold tracking-tight">
              <span className="text-foreground">Nexus</span>
              <span className="text-gradient-aurora">Play</span>
            </span>
          </div>
          <Button
            variant="outline"
            className="border-border text-foreground hover:bg-muted"
            onClick={() => (window.location.href = "/auth")}
          >
            Sign In
          </Button>
        </header>

        {/* Hero */}
        <section className="text-center pt-16 pb-20 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass text-xs font-medium text-muted-foreground mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-gradient-aurora inline-block" />
            Free while in beta
          </div>
          <h1 className="text-4xl sm:text-6xl font-display font-bold tracking-tight text-foreground mb-6">
            Your games and goals,
            <br />
            <span className="text-gradient-aurora">all in one place.</span>
          </h1>
          <p className="text-lg sm:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
            NexusPlay tracks your play sessions, study time, workouts, and
            everything in between — with timers, stats, and a community that
            keeps you going.
          </p>
          <div className="flex items-center justify-center gap-3">
            <Button
              size="lg"
              className="bg-gradient-aurora text-white hover:opacity-90 shadow-lg shadow-primary/25 px-8 text-base"
              onClick={() => (window.location.href = "/auth")}
            >
              Get Started
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </section>

        {/* Features */}
        <section className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 pb-24 max-w-5xl mx-auto">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.title}
                className="glass rounded-2xl p-6 hover-lift"
              >
                <div
                  className={`w-11 h-11 rounded-xl flex items-center justify-center ${feature.gradient} shadow-lg mb-4`}
                >
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-lg font-display font-semibold text-foreground mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </section>

        {/* Footer CTA */}
        <section className="text-center pb-24">
          <h2 className="text-2xl sm:text-3xl font-display font-bold text-foreground mb-4">
            Ready to start tracking?
          </h2>
          <p className="text-muted-foreground mb-8">
            Try it as a guest — no account needed.
          </p>
          <Button
            size="lg"
            variant="outline"
            className="border-border text-foreground hover:bg-muted px-8"
            onClick={() => (window.location.href = "/auth")}
          >
            Explore NexusPlay
          </Button>
        </section>
      </div>
    </div>
  );
}
