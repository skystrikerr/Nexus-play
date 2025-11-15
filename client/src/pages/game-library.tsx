import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, Plus, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Sidebar from "@/components/sidebar";
import AddGameModal from "@/components/add-game-modal";
import GameCard from "@/components/game-card";
import { useIsMobile } from "@/hooks/use-mobile";
import type { Activity } from "@shared/schema";

export default function GameLibrary() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isMobile = useIsMobile();

  const { data: games = [], isLoading } = useQuery<Activity[]>({
    queryKey: ["/api/games"],
  });

  const filteredGames = games.filter(game => {
    const matchesSearch = game.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || game.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

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
              <h2 className="text-2xl font-bold text-white">Game Library</h2>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="relative hidden md:block">
                <Input
                  type="text"
                  placeholder="Search games..."
                  className="bg-dark-bg border-slate-600 pl-10 w-80 text-white"
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
          {/* Filter Tabs */}
          <div className="flex items-center space-x-2 mb-6">
            {["all", "playing", "completed", "wishlist", "dropped"].map((status) => (
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

          {/* Games Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-1 gap-4">
            {isLoading ? (
              <div className="text-slate-400">Loading games...</div>
            ) : filteredGames.length > 0 ? (
              filteredGames.map((game) => (
                <GameCard key={game.id} game={game} />
              ))
            ) : (
              <div className="text-slate-400 text-center py-8">
                {games.length === 0 ? "No games added yet." : "No games match your filters."}
              </div>
            )}
          </div>
        </div>
      </main>

      <AddGameModal open={showAddModal} onOpenChange={setShowAddModal} />
    </div>
  );
}
