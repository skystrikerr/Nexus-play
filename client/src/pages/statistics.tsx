import { useQuery } from "@tanstack/react-query";
import { Gamepad2, Trophy, Clock, Play, Heart, PauseCircle, XCircle } from "lucide-react";
import PageHeader from "@/components/page-header";
import type { Activity } from "@shared/schema";

interface Stats {
  totalActivities: number;
  completedActivities: number;
  inProgressActivities: number;
  totalHours: number;
  monthlyHours: number;
  byType: Record<string, { count: number; completed: number; hours: number }>;
  totalGames: number;
  completedGames: number;
}

const statusMeta = [
  { status: "in_progress", label: "Playing", icon: Play, color: "bg-gradient-aurora" },
  { status: "completed", label: "Completed", icon: Trophy, color: "bg-gradient-neutral" },
  { status: "wishlist", label: "Wishlist", icon: Heart, color: "bg-gradient-pulse" },
  { status: "on_hold", label: "On Hold", icon: PauseCircle, color: "bg-gradient-solar" },
  { status: "dropped", label: "Dropped", icon: XCircle, color: "bg-gradient-solar" },
];

export default function Statistics() {
  const { data: stats, isLoading } = useQuery<Stats>({
    queryKey: ["/api/stats"],
  });

  const { data: games = [] } = useQuery<Activity[]>({
    queryKey: ["/api/games"],
  });

  const gameHours = stats?.byType?.game?.hours ?? stats?.totalHours ?? 0;
  const completed = games.filter(g => g.status === "completed").length;
  const completionRate = games.length ? Math.round((completed / games.length) * 100) : 0;
  const ratedGames = games.filter(g => g.rating);
  const avgRating = ratedGames.length
    ? (ratedGames.reduce((sum, g) => sum + (g.rating || 0), 0) / ratedGames.length).toFixed(1)
    : "—";

  const overviewCards = [
    { title: "Games Tracked", value: games.length, icon: Gamepad2, gradient: "bg-gradient-aurora" },
    { title: "Hours Played", value: `${gameHours}h`, icon: Clock, gradient: "bg-gradient-solar" },
    { title: "Completion Rate", value: `${completionRate}%`, icon: Trophy, gradient: "bg-gradient-neutral" },
    { title: "Avg. Rating", value: avgRating, icon: Play, gradient: "bg-gradient-pulse" },
  ];

  return (
    <>
      <PageHeader title="Statistics" subtitle="Your gaming life in numbers" />

      <div className="px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Overview Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-5">
          {overviewCards.map((card) => {
            const Icon = card.icon;
            return (
              <div key={card.title} className="glass-glow rounded-xl p-5 lg:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-muted-foreground text-xs lg:text-sm font-medium">{card.title}</p>
                    <p className="text-2xl lg:text-3xl font-bold text-foreground font-mono mt-1">
                      {isLoading ? <span className="shimmer inline-block w-14 h-8 rounded" /> : card.value}
                    </p>
                  </div>
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${card.gradient} shadow-lg shrink-0`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Status Breakdown */}
        <div className="glass rounded-xl p-6">
          <h3 className="text-lg font-display font-semibold text-foreground mb-6">Library Breakdown</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {statusMeta.map(({ status, label, icon: Icon, color }) => {
              const inStatus = games.filter(g => g.status === status);
              const share = games.length ? (inStatus.length / games.length) * 100 : 0;
              return (
                <div key={status} className="bg-background/40 rounded-xl p-4 border border-border/60">
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`w-10 h-10 ${color} rounded-xl flex items-center justify-center shadow-lg`}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground">{label}</h4>
                      <p className="text-muted-foreground text-sm">
                        {inStatus.length} {inStatus.length === 1 ? "game" : "games"}
                      </p>
                    </div>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div className={`h-2 rounded-full ${color}`} style={{ width: `${share}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Monthly Progress */}
        <div className="glass rounded-xl p-6">
          <h3 className="text-lg font-display font-semibold text-foreground mb-4">This Month</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-muted-foreground text-sm mb-2">Hours This Month</p>
              <p className="text-3xl font-bold font-mono text-gradient-aurora">{stats?.monthlyHours || 0}h</p>
            </div>
            <div>
              <p className="text-muted-foreground text-sm mb-2">Games Completed All-Time</p>
              <p className="text-3xl font-bold font-mono text-gradient-neutral">{completed}</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
