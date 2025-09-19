import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Plus, Search, Filter, Calendar, Star, Clock, ExternalLink, Gamepad2, Monitor } from "lucide-react";
import { format } from "date-fns";
import AddGameModal from "@/components/add-game-modal";
import DateTimeLogModal from "@/components/date-time-log-modal";

interface Game {
  id: string;
  title: string;
  category: string;
  subcategory?: string;
  imageUrl?: string;
  description?: string;
  rating?: number;
  metadata?: {
    platform?: string;
    releaseDate?: string;
    estimatedHours?: number;
    genre?: string;
    priority?: string;
    notes?: string;
  };
  createdAt: string;
}

export function GameBacklog() {
  const [searchTerm, setSearchTerm] = useState("");
  const [platformFilter, setPlatformFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [timeLogModal, setTimeLogModal] = useState<{open: boolean, game: Game | null}>({
    open: false,
    game: null
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch backlog games (wishlist status)
  const { data: games = [], isLoading } = useQuery({
    queryKey: ["/api/activities", { type: "game", status: "wishlist" }],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/activities?type=game&status=wishlist");
      return await response.json();
    },
  });


  // Move game to "in progress" mutation
  const startGameMutation = useMutation({
    mutationFn: (gameId: string) => apiRequest("PUT", `/api/activities/${gameId}`, {
      status: "in_progress"
    }),
    onSuccess: () => {
      toast({
        title: "Game Started!",
        description: "The game has been moved to your active library.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/activities"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to start game",
        variant: "destructive",
      });
    },
  });

  // Remove from backlog mutation
  const removeGameMutation = useMutation({
    mutationFn: (gameId: string) => apiRequest("DELETE", `/api/activities/${gameId}`),
    onSuccess: () => {
      toast({
        title: "Game Removed",
        description: "The game has been removed from your backlog.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/activities"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to remove game",
        variant: "destructive",
      });
    },
  });

  // Filter games based on search and filters
  const filteredGames = (games || []).filter((game: Game) => {
    const matchesSearch = game.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         game.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPlatform = platformFilter === "all" || game.metadata?.platform === platformFilter;
    const matchesPriority = priorityFilter === "all" || game.metadata?.priority === priorityFilter;
    
    return matchesSearch && matchesPlatform && matchesPriority;
  });


  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      case "medium": return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "low": return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  const platforms = Array.from(new Set((games || []).map((game: Game) => game.metadata?.platform).filter(Boolean)));
  const priorities = ["high", "medium", "low"];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      <div className="container mx-auto max-w-7xl py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
              <Gamepad2 className="h-10 w-10 text-purple-400" />
              Game Backlog
            </h1>
            <p className="text-gray-300">
              Plan and organize games you want to play
            </p>
          </div>

          <Button 
            onClick={() => setIsAddModalOpen(true)}
            className="bg-purple-600 hover:bg-purple-700 text-white"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Game
          </Button>
        </div>

        {/* Filters */}
        <Card className="bg-slate-800/50 border-slate-700 mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-wrap gap-4 items-center">
              <div className="flex-1 min-w-64">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search games..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-slate-700 border-slate-600 text-white placeholder:text-gray-400"
                  />
                </div>
              </div>

              <div className="flex gap-2 items-center">
                <Filter className="h-4 w-4 text-gray-400" />
                <Select value={platformFilter} onValueChange={setPlatformFilter}>
                  <SelectTrigger className="w-40 bg-slate-700 border-slate-600 text-white">
                    <SelectValue placeholder="Platform" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-700 border-slate-600">
                    <SelectItem value="all">All Platforms</SelectItem>
                    {platforms.map((platform: string) => (
                      <SelectItem key={platform} value={platform}>{platform}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                  <SelectTrigger className="w-40 bg-slate-700 border-slate-600 text-white">
                    <SelectValue placeholder="Priority" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-700 border-slate-600">
                    <SelectItem value="all">All Priorities</SelectItem>
                    {priorities.map(priority => (
                      <SelectItem key={priority} value={priority}>
                        {priority.charAt(0).toUpperCase() + priority.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Game Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-white">{games.length}</div>
                <div className="text-sm text-gray-400">Total Games</div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-red-400">
                  {games.filter((g: Game) => g.metadata?.priority === "high").length}
                </div>
                <div className="text-sm text-gray-400">High Priority</div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-400">
                  {games.filter((g: Game) => g.metadata?.priority === "medium").length}
                </div>
                <div className="text-sm text-gray-400">Medium Priority</div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-400">
                  {games.reduce((total: number, game: Game) => 
                    total + (game.metadata?.estimatedHours || 0), 0
                  )}h
                </div>
                <div className="text-sm text-gray-400">Est. Total Hours</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Games Grid */}
        {isLoading ? (
          <div className="text-center text-gray-400 py-12">
            Loading your game backlog...
          </div>
        ) : filteredGames.length === 0 ? (
          <Card className="bg-slate-800/30 border-slate-700">
            <CardContent className="pt-6 text-center">
              <Gamepad2 className="h-16 w-16 text-gray-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">No Games Found</h3>
              <p className="text-gray-400 mb-4">
                {searchTerm || platformFilter !== "all" || priorityFilter !== "all" 
                  ? "Try adjusting your filters" 
                  : "Start building your game backlog by adding games you want to play"}
              </p>
              {!searchTerm && platformFilter === "all" && priorityFilter === "all" && (
                <Button
                  onClick={() => setIsAddModalOpen(true)}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Your First Game
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredGames.map((game: Game) => (
              <Card key={game.id} className="bg-slate-800/50 border-slate-700 overflow-hidden">
                {game.imageUrl && (
                  <div className="aspect-video relative overflow-hidden">
                    <img 
                      src={game.imageUrl} 
                      alt={game.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-white text-lg truncate">{game.title}</h3>
                    {game.metadata?.priority && (
                      <Badge className={`ml-2 ${getPriorityColor(game.metadata.priority)} text-xs`}>
                        {game.metadata.priority}
                      </Badge>
                    )}
                  </div>

                  {game.description && (
                    <p className="text-gray-400 text-sm mb-3 overflow-hidden">
                      {game.description.length > 100 
                        ? `${game.description.substring(0, 100)}...` 
                        : game.description}
                    </p>
                  )}

                  <div className="space-y-2 mb-4">
                    {game.metadata?.platform && (
                      <div className="flex items-center gap-2 text-sm text-gray-300">
                        <Monitor className="h-3 w-3" />
                        {game.metadata.platform}
                      </div>
                    )}
                    
                    {game.metadata?.genre && (
                      <div className="flex items-center gap-2 text-sm text-gray-300">
                        <Star className="h-3 w-3" />
                        {game.metadata.genre}
                      </div>
                    )}
                    
                    {game.metadata?.estimatedHours && (
                      <div className="flex items-center gap-2 text-sm text-gray-300">
                        <Clock className="h-3 w-3" />
                        ~{game.metadata.estimatedHours} hours
                      </div>
                    )}

                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      <Calendar className="h-3 w-3" />
                      Added {format(new Date(game.createdAt), "MMM d, yyyy")}
                    </div>
                  </div>

                  {game.metadata?.notes && (
                    <p className="text-gray-400 text-xs mb-3 italic">
                      "{game.metadata.notes}"
                    </p>
                  )}

                  <Separator className="bg-slate-600 mb-4" />

                  <div className="flex gap-2">
                    <Button
                      onClick={() => startGameMutation.mutate(game.id)}
                      disabled={startGameMutation.isPending}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white text-sm"
                    >
                      Start Playing
                    </Button>
                    <Button
                      onClick={() => setTimeLogModal({ open: true, game })}
                      className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-3"
                      title="Log Time"
                    >
                      <Clock className="h-4 w-4" />
                    </Button>
                    <Button
                      onClick={() => removeGameMutation.mutate(game.id)}
                      disabled={removeGameMutation.isPending}
                      variant="outline"
                      className="text-red-400 border-red-600 hover:bg-red-600 hover:text-white"
                    >
                      Remove
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
      
      {/* Modals */}
      <AddGameModal open={isAddModalOpen} onOpenChange={setIsAddModalOpen} />
      {timeLogModal.game && (
        <DateTimeLogModal 
          open={timeLogModal.open} 
          onOpenChange={(open) => setTimeLogModal({ open, game: null })}
          task={timeLogModal.game as any}
          date={new Date().toISOString().split('T')[0]}
        />
      )}
    </div>
  );
}