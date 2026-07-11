import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, Plus, Gamepad2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import PageHeader from "@/components/page-header";
import AddGameModal from "@/components/add-game-modal";
import GameCard from "@/components/game-card";
import type { Activity } from "@shared/schema";

export default function GameLibrary() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const { data: games = [], isLoading } = useQuery<Activity[]>({
    queryKey: ["/api/games"],
  });

  const filteredGames = games.filter(game => {
    const matchesSearch = game.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || game.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <>
      <PageHeader
        title="Library"
        subtitle={`${games.length} ${games.length === 1 ? "game" : "games"} in your collection`}
        actions={
          <Button
            className="bg-gradient-aurora text-white hover:opacity-90 shadow-lg shadow-primary/20"
            onClick={() => setShowAddModal(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Game
          </Button>
        }
      />

      <div className="px-4 sm:px-6 lg:px-8 py-6">
        {/* Search + Filters */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-6">
          <div className="relative sm:w-72">
            <Input
              type="text"
              placeholder="Search games..."
              className="bg-muted border-input pl-10 text-foreground placeholder:text-muted-foreground/60"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {["all", "playing", "completed", "wishlist", "dropped"].map((status) => (
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
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </Button>
            ))}
          </div>
        </div>

        {/* Games Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {isLoading ? (
            [1, 2, 3, 4].map((i) => <div key={i} className="shimmer rounded-xl h-32" />)
          ) : filteredGames.length > 0 ? (
            filteredGames.map((game) => (
              <GameCard key={game.id} game={game} />
            ))
          ) : (
            <div className="xl:col-span-2 glass-glow rounded-xl p-12 text-center">
              <Gamepad2 className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-muted-foreground mb-4">
                {games.length === 0 ? "No games added yet." : "No games match your filters."}
              </p>
              {games.length === 0 && (
                <Button
                  className="bg-gradient-aurora text-white hover:opacity-90"
                  onClick={() => setShowAddModal(true)}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Your First Game
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      <AddGameModal open={showAddModal} onOpenChange={setShowAddModal} />
    </>
  );
}
