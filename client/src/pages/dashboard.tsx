import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, Plus, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Sidebar from "@/components/sidebar";
import AddGameModal from "@/components/add-game-modal";
import GameCard from "@/components/game-card";
import GamingCalendar from "@/components/gaming-calendar";
import { useIsMobile } from "@/hooks/use-mobile";
import type { Activity } from "@shared/schema";

interface Stats {
  totalActivities: number;
  completedActivities: number;
  inProgressActivities: number;
  totalHours: number;
  monthlyHours: number;
  byType: Record<string, { count: number; completed: number; hours: number }>;
  // Backward compatibility
  totalGames: number;
  completedGames: number;
}

export default function Dashboard() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isMobile = useIsMobile();

  const { data: games = [], isLoading: gamesLoading } = useQuery<Activity[]>({
    queryKey: ["/api/games"],
  });

  const { data: stats, isLoading: statsLoading } = useQuery<Stats>({
    queryKey: ["/api/stats"],
  });

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
      icon: "📊",
      color: "bg-primary/20 text-primary",
    },
    {
      title: "Completed",
      value: stats?.completedActivities || 0,
      icon: "🏆",
      color: "bg-green-500/20 text-green-400",
    },
    {
      title: "In Progress",
      value: stats?.inProgressActivities || 0,
      icon: "⚡",
      color: "bg-blue-500/20 text-blue-400",
    },
    {
      title: "Total Hours",
      value: stats?.totalHours || 0,
      icon: "⏰",
      color: "bg-yellow-500/20 text-yellow-500",
    },
    {
      title: "This Month",
      value: `${stats?.monthlyHours || 0}h`,
      icon: "📅",
      color: "bg-purple-500/20 text-purple-400",
    },
  ];

  return (
    <div className="min-h-screen flex">
      <Sidebar />
      
      {/* Mobile sidebar overlay */}
      {isMobile && sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-20" onClick={() => setSidebarOpen(false)} />
      )}

      <main className="flex-1 overflow-auto">
        {/* Top Bar */}
        <header className="bg-dark-surface border-b border-slate-700 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {isMobile && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="p-2 lg:hidden"
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                >
                  <Menu className="w-5 h-5" />
                </Button>
              )}
              <h2 className="text-2xl font-bold text-white">Dashboard</h2>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="relative hidden md:block">
                <Input
                  type="text"
                  placeholder="Search games..."
                  className="bg-dark-bg border-slate-600 pl-10 w-80"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
              </div>
              
              <Button 
                className="bg-primary hover:bg-primary/80"
                onClick={() => setShowAddModal(true)}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Game
              </Button>
            </div>
          </div>
        </header>

        <div className="p-6">
          {/* Dashboard Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {statCards.map((stat, index) => (
              <div key={index} className="bg-dark-surface rounded-xl p-6 border border-slate-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-400 text-sm">{stat.title}</p>
                    <p className="text-3xl font-bold text-white">
                      {statsLoading ? "..." : stat.value}
                    </p>
                  </div>
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${stat.color}`}>
                    <span className="text-2xl">{stat.icon}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            {/* Recent Games */}
            <div className="xl:col-span-2">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-white">Recent Games</h3>
                <div className="flex space-x-2">
                  {["all", "playing", "completed"].map((status) => (
                    <Button
                      key={status}
                      variant={statusFilter === status ? "default" : "outline"}
                      size="sm"
                      className={
                        statusFilter === status
                          ? "bg-primary text-white"
                          : "bg-slate-700 text-slate-300 border-slate-600 hover:bg-slate-600"
                      }
                      onClick={() => setStatusFilter(status)}
                    >
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </Button>
                  ))}
                </div>
              </div>
              
              <div className="space-y-4">
                {gamesLoading ? (
                  <div className="text-slate-400">Loading games...</div>
                ) : recentGames.length > 0 ? (
                  recentGames.map((game) => (
                    <GameCard key={game.id} game={game} />
                  ))
                ) : (
                  <div className="text-slate-400 text-center py-8">
                    {games.length === 0 ? "No games added yet." : "No games match your filters."}
                  </div>
                )}
              </div>
            </div>

            {/* Gaming Calendar */}
            <GamingCalendar games={games} />
          </div>
        </div>
      </main>

      <AddGameModal open={showAddModal} onOpenChange={setShowAddModal} />
    </div>
  );
}
