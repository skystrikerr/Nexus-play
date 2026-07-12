import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Plus, Gamepad2, Clock, Trophy, Play, ListTodo } from "lucide-react";
import { Button } from "@/components/ui/button";
import PageHeader from "@/components/page-header";
import AddGameModal from "@/components/add-game-modal";
import GameCard from "@/components/game-card";
import GamingCalendar from "@/components/gaming-calendar";
import { ActiveTimerWidget } from "@/components/active-timer-widget";
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

export default function Dashboard() {
  const [showAddGameModal, setShowAddGameModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");

  const { data: games = [], isLoading: gamesLoading } = useQuery<Activity[]>({
    queryKey: ["/api/games"],
  });

  const { data: stats, isLoading: statsLoading } = useQuery<Stats>({
    queryKey: ["/api/stats"],
  });

  const gameStats = stats?.byType?.game;
  const playing = games.filter(g => g.status === "in_progress").length;
  const completed = games.filter(g => g.status === "completed").length;
  const backlogged = games.filter(g => g.status === "wishlist" || g.status === "on_hold").length;

  const filteredGames = games.filter(game =>
    statusFilter === "all" || game.status === statusFilter
  );

  const recentGames = filteredGames.slice(0, 4);

  const statCards = [
    {
      title: "Games",
      value: games.length,
      icon: Gamepad2,
      gradient: "bg-gradient-aurora",
    },
    {
      title: "Playing",
      value: playing,
      icon: Play,
      gradient: "bg-gradient-pulse",
    },
    {
      title: "Completed",
      value: completed,
      icon: Trophy,
      gradient: "bg-gradient-neutral",
    },
    {
      title: "Hours Played",
      value: `${gameStats?.hours ?? stats?.totalHours ?? 0}h`,
      icon: Clock,
      gradient: "bg-gradient-solar",
    },
  ];

  return (
    <>
      <PageHeader
        title="Dashboard"
        subtitle="Your games at a glance"
        actions={
          <Button
            className="bg-gradient-aurora text-white hover:opacity-90 shadow-lg shadow-primary/20"
            onClick={() => setShowAddGameModal(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Game
          </Button>
        }
      />

      <div className="px-4 sm:px-6 lg:px-8 py-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-5 mb-8">
          {statCards.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div key={index} className="glass-glow rounded-xl p-5 lg:p-6 hover-lift">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-muted-foreground text-xs lg:text-sm font-medium">{stat.title}</p>
                    <p className="text-2xl lg:text-3xl font-bold text-foreground font-mono mt-1">
                      {statsLoading || gamesLoading ? (
                        <span className="shimmer inline-block w-14 h-8 rounded" />
                      ) : stat.value}
                    </p>
                  </div>
                  <div className={`w-11 h-11 lg:w-12 lg:h-12 rounded-xl flex items-center justify-center ${stat.gradient} shadow-lg shrink-0`}>
                    <Icon className="w-5 h-5 lg:w-6 lg:h-6 text-white" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Left Column - Recent Games */}
          <div className="xl:col-span-2 space-y-8">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-display font-semibold text-foreground">Recent Games</h3>
                <div className="flex space-x-2">
                  {["all", "in_progress", "completed"].map((status) => (
                    <Button
                      key={status}
                      variant={statusFilter === status ? "default" : "outline"}
                      size="sm"
                      className={
                        statusFilter === status
                          ? "bg-gradient-aurora text-white shadow-lg shadow-primary/20"
                          : "bg-muted text-muted-foreground border-border hover:text-foreground hover:bg-muted/80"
                      }
                      onClick={() => setStatusFilter(status)}
                    >
                      {status === "all" ? "All" : status === "in_progress" ? "Playing" : "Completed"}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                {gamesLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="shimmer rounded-xl h-24" />
                    ))}
                  </div>
                ) : recentGames.length > 0 ? (
                  recentGames.map((game) => (
                    <GameCard key={game.id} game={game} />
                  ))
                ) : (
                  <div className="glass-glow rounded-xl p-8 text-center">
                    <Gamepad2 className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
                    <p className="text-muted-foreground mb-4">
                      {games.length === 0 ? "No games yet — add your first one!" : "No games match this filter."}
                    </p>
                    {games.length === 0 && (
                      <Button
                        className="bg-gradient-aurora text-white hover:opacity-90"
                        onClick={() => setShowAddGameModal(true)}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Your First Game
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Backlog teaser */}
            {backlogged > 0 && (
              <Link href="/game-backlog">
                <div className="glass rounded-xl p-4 flex items-center justify-between cursor-pointer hover:bg-muted/40 transition-smooth">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-pulse flex items-center justify-center shadow-lg">
                      <ListTodo className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-foreground font-medium">{backlogged} games waiting in your backlog</p>
                      <p className="text-muted-foreground text-sm">Plan what to play next</p>
                    </div>
                  </div>
                  <span className="text-muted-foreground text-sm">View →</span>
                </div>
              </Link>
            )}
          </div>

          {/* Right Column - Timer & Calendar */}
          <div className="space-y-6">
            <ActiveTimerWidget />
            <GamingCalendar />
          </div>
        </div>
      </div>

      <AddGameModal open={showAddGameModal} onOpenChange={setShowAddGameModal} />
    </>
  );
}
