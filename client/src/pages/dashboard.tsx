import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, Plus, Menu, Target, CheckSquare, Gamepad2, Clock, CalendarDays, Trophy, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Sidebar from "@/components/sidebar";
import AddGameModal from "@/components/add-game-modal";
import AddTaskModal from "@/components/add-task-modal";
import GameCard from "@/components/game-card";
import TaskCard from "@/components/task-card";
import GamingCalendar from "@/components/gaming-calendar";
import { ActiveTimerWidget } from "@/components/active-timer-widget";
import { useIsMobile } from "@/hooks/use-mobile";
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
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isMobile = useIsMobile();

  const { data: games = [], isLoading: gamesLoading } = useQuery<Activity[]>({
    queryKey: ["/api/games"],
  });

  const { data: allActivities = [], isLoading: activitiesLoading } = useQuery<Activity[]>({
    queryKey: ["/api/activities"],
  });

  const { data: stats, isLoading: statsLoading } = useQuery<Stats>({
    queryKey: ["/api/stats"],
  });

  const tasks = allActivities.filter(activity => 
    activity.type !== "game" && 
    ["work", "study", "other"].includes(activity.type)
  );

  const urgentTasks = tasks.filter(task => {
    const dueDate = (task.metadata as any)?.dueDate;
    if (!dueDate || task.status === "completed") return false;
    
    const due = new Date(dueDate);
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    
    return due <= tomorrow;
  }).slice(0, 3);

  const filteredGames = games.filter(game => {
    const matchesSearch = game.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || game.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const recentGames = filteredGames.slice(0, 3);

  const statCards = [
    {
      title: "Total Activities",
      value: stats?.totalActivities || 0,
      icon: Sparkles,
      gradient: "bg-gradient-aurora",
    },
    {
      title: "Games",
      value: games.length || 0,
      icon: Gamepad2,
      gradient: "bg-gradient-neutral",
    },
    {
      title: "Completed",
      value: stats?.completedActivities || 0,
      icon: Trophy,
      gradient: "bg-gradient-pulse",
    },
    {
      title: "Hours Tracked",
      value: `${stats?.totalHours || 0}h`,
      icon: Clock,
      gradient: "bg-gradient-solar",
    },
  ];

  return (
    <div className="min-h-screen flex">
      <Sidebar />
      
      {isMobile && sidebarOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-20" onClick={() => setSidebarOpen(false)} />
      )}

      <main className="flex-1 overflow-auto">
        <header className="sticky top-0 z-10 glass border-b border-border px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {isMobile && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="p-2 lg:hidden text-muted-foreground hover:text-foreground"
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                >
                  <Menu className="w-5 h-5" />
                </Button>
              )}
              <div>
                <h2 className="text-2xl font-display font-bold text-foreground">Dashboard</h2>
                <p className="text-muted-foreground text-sm">Your personal time management and activity hub</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="relative hidden md:block">
                <Input
                  type="text"
                  placeholder="Search activities..."
                  className="bg-muted border-input pl-10 w-80 text-foreground placeholder:text-muted-foreground/60"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
              </div>
              
              <div className="flex gap-2">
                <Button 
                  className="bg-gradient-solar text-white hover:opacity-90 shadow-lg shadow-amber-500/20"
                  onClick={() => setShowAddTaskModal(true)}
                >
                  <Target className="w-4 h-4 mr-2" />
                  Add Task
                </Button>
                <Button 
                  className="bg-gradient-aurora text-white hover:opacity-90 shadow-lg shadow-cyan-500/20"
                  onClick={() => setShowAddGameModal(true)}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Game
                </Button>
              </div>
            </div>
          </div>
        </header>

        <div className="p-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
            {statCards.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div key={index} className="glass-glow rounded-xl p-6 hover-lust">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-muted-foreground text-sm font-medium">{stat.title}</p>
                      <p className="text-3xl font-bold text-foreground font-mono mt-1">
                        {statsLoading ? (
                          <span className="shimmer inline-block w-16 h-8 rounded" />
                        ) : stat.value}
                      </p>
                    </div>
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${stat.gradient} shadow-lg`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            {/* Left Column - Urgent Tasks & Recent Games */}
            <div className="xl:col-span-2 space-y-8">
              {/* Urgent Tasks */}
              {urgentTasks.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-display font-semibold text-foreground flex items-center gap-2">
                      <CheckSquare className="w-5 h-5 text-destructive" />
                      Urgent Tasks
                    </h3>
                    <Button 
                      onClick={() => window.location.href = '/tasks'}
                      variant="outline"
                      size="sm"
                      className="border-border text-muted-foreground hover:text-foreground hover:bg-muted"
                    >
                      View All
                    </Button>
                  </div>
                  
                  <div className="space-y-3">
                    {urgentTasks.map((task) => (
                      <TaskCard key={task.id} task={task} variant="compact" />
                    ))}
                  </div>
                </div>
              )}

              {/* Recent Games */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-display font-semibold text-foreground">Recent Games</h3>
                  <div className="flex space-x-2">
                    {["all", "playing", "completed"].map((status) => (
                      <Button
                        key={status}
                        variant={statusFilter === status ? "default" : "outline"}
                        size="sm"
                        className={
                          statusFilter === status
                            ? "bg-gradient-aurora text-white shadow-lg shadow-cyan-500/20"
                            : "bg-muted text-muted-foreground border-border hover:text-foreground hover:bg-muted/80"
                        }
                        onClick={() => setStatusFilter(status)}
                      >
                        {status.charAt(0).toUpperCase() + status.slice(1)}
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
                      <p className="text-muted-foreground">
                        {games.length === 0 ? "No games added yet. Add your first game!" : "No games match your filters."}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column - Timer & Calendar */}
            <div className="space-y-6">
              <ActiveTimerWidget />
              <GamingCalendar />
            </div>
          </div>
        </div>
      </main>

      <AddGameModal open={showAddGameModal} onOpenChange={setShowAddGameModal} />
      <AddTaskModal open={showAddTaskModal} onOpenChange={setShowAddTaskModal} />
    </div>
  );
}
