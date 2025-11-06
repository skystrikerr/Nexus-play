import { useState, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  DndContext,
  DragEndEvent,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trophy, GripVertical, Search, X, Plus, UserPlus } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { searchGames, mapRawgToActivity, type RawgGame } from "@/lib/rawg-api";
import type { Activity } from "@shared/schema";
import { Alert, AlertDescription } from "@/components/ui/alert";

function debounce(func: Function, wait: number) {
  let timeout: NodeJS.Timeout;
  return function executedFunction(...args: any[]) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

interface RankedActivity extends Activity {
  rankOrder: number;
}

function SortableRankItem({ activity, rank }: { activity: Activity; rank: number }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: activity.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} data-testid={`ranked-item-${activity.id}`}>
      <Card className="bg-slate-800 border-slate-700 hover:border-red-500 transition-all">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing">
                <GripVertical className="w-5 h-5 text-slate-400" />
              </div>
              <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-red-600 text-white font-bold text-xl">
                {rank}
              </div>
            </div>

            {activity.imageUrl && (
              <div className="w-16 h-16 rounded overflow-hidden bg-slate-700 flex-shrink-0">
                <img
                  src={activity.imageUrl}
                  alt={activity.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold text-white truncate">
                {activity.title}
              </h3>
              <div className="flex items-center gap-4 text-sm text-slate-400">
                {activity.category && (
                  <span>{activity.category}</span>
                )}
                {activity.rating && (
                  <div className="flex items-center gap-1">
                    <span className="text-yellow-500">★</span>
                    <span>{activity.rating}/5</span>
                  </div>
                )}
                {activity.totalHours && activity.totalHours > 0 && (
                  <span>{activity.totalHours.toFixed(1)}h played</span>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function TierList() {
  const { toast } = useToast();
  const [selectedType, setSelectedType] = useState<string>("game");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<RawgGame[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  // Check if user is a guest
  const { data: user } = useQuery({
    queryKey: ["/api/auth/user"],
  });
  const isGuest = (user as any)?.isGuest;

  // Fetch all activities
  const { data: activities = [], isLoading } = useQuery<Activity[]>({
    queryKey: ["/api/activities"],
  });

  // Filter by type and sort by tier (using tier as rank order)
  const rankedActivities = activities
    .filter((activity) => activity.type === selectedType && activity.tier)
    .sort((a, b) => {
      const rankA = parseInt(a.tier || "999");
      const rankB = parseInt(b.tier || "999");
      return rankA - rankB;
    });

  // Search games using RAWG API
  const handleSearch = useCallback(async (query: string) => {
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const results = await searchGames(query);
      setSearchResults(results.results || []);
    } catch (error) {
      console.error("Search error:", error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  const debouncedSearch = useCallback(
    debounce((query: string) => handleSearch(query), 500),
    [handleSearch]
  );

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    if (value.trim()) {
      debouncedSearch(value);
    } else {
      setSearchResults([]);
    }
  };

  // Add game to ranking
  const addToRankingMutation = useMutation({
    mutationFn: async (rawgGame: RawgGame) => {
      const activityData = mapRawgToActivity(rawgGame);
      // Set tier to next rank number
      const nextRank = rankedActivities.length + 1;
      return apiRequest("POST", "/api/activities", {
        ...activityData,
        tier: nextRank.toString(),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/activities"] });
      setSearchQuery("");
      setSearchResults([]);
      toast({
        title: "Added to Rankings",
        description: "Game has been added to your ranking list.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add game. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Update rankings after reorder
  const updateRankingsMutation = useMutation({
    mutationFn: async (orderedActivities: Activity[]) => {
      // Update each activity's tier to match its new position
      const updates = orderedActivities.map((activity, index) =>
        apiRequest("PUT", `/api/activities/${activity.id}`, {
          tier: (index + 1).toString(),
        })
      );
      return Promise.all(updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/activities"] });
      toast({
        title: "Rankings Updated",
        description: "Your ranking list has been reordered.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update rankings. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over || active.id === over.id) return;

    const oldIndex = rankedActivities.findIndex((a) => a.id === active.id);
    const newIndex = rankedActivities.findIndex((a) => a.id === over.id);

    if (oldIndex !== -1 && newIndex !== -1) {
      const reordered = arrayMove(rankedActivities, oldIndex, newIndex);
      updateRankingsMutation.mutate(reordered);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const activeActivity = activeId ? rankedActivities.find(a => a.id === activeId) : null;

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <Trophy className="w-8 h-8 text-red-500" />
          <h1 className="text-3xl font-bold text-white">My Rankings</h1>
        </div>
        <div className="flex gap-2">
          <Button
            variant={selectedType === "game" ? "default" : "outline"}
            onClick={() => setSelectedType("game")}
            className={selectedType === "game" ? "bg-red-600 hover:bg-red-700" : ""}
            data-testid="button-filter-games"
          >
            Games
          </Button>
          <Button
            variant={selectedType === "study" ? "default" : "outline"}
            onClick={() => setSelectedType("study")}
            className={selectedType === "study" ? "bg-red-600 hover:bg-red-700" : ""}
            data-testid="button-filter-study"
          >
            Study
          </Button>
          <Button
            variant={selectedType === "work" ? "default" : "outline"}
            onClick={() => setSelectedType("work")}
            className={selectedType === "work" ? "bg-red-600 hover:bg-red-700" : ""}
            data-testid="button-filter-work"
          >
            Work
          </Button>
        </div>
      </div>

      {/* Guest user message */}
      {isGuest && selectedType === "game" && (
        <Alert className="bg-slate-800 border-slate-700 mb-6">
          <UserPlus className="h-5 w-5 text-red-500" />
          <AlertDescription className="text-slate-300 ml-2">
            <span className="font-semibold text-white">Sign up for free</span> to add games to your personal ranking list!
            <Button
              size="sm"
              onClick={() => window.location.href = "/auth"}
              className="ml-3 bg-red-600 hover:bg-red-700"
            >
              Create Account
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Search to add games */}
      {selectedType === "game" && !isGuest && (
        <Card className="bg-slate-800 border-slate-700 mb-6">
          <CardContent className="p-4">
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                <Input
                  placeholder="Search games to add to your ranking..."
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="pl-10 bg-slate-900 border-slate-700 text-white"
                  data-testid="input-search-games"
                />
                {searchQuery && (
                  <button
                    onClick={() => {
                      setSearchQuery("");
                      setSearchResults([]);
                    }}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>

              {isSearching && (
                <div className="flex items-center justify-center py-4">
                  <div className="w-6 h-6 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                </div>
              )}

              {searchResults.length > 0 && (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {searchResults.map((game) => (
                    <Card key={game.id} className="bg-slate-900 border-slate-700">
                      <CardContent className="p-3">
                        <div className="flex items-center gap-3">
                          {game.background_image && (
                            <img
                              src={game.background_image}
                              alt={game.name}
                              className="w-16 h-16 rounded object-cover"
                            />
                          )}
                          <div className="flex-1 min-w-0">
                            <h4 className="text-white font-medium truncate">{game.name}</h4>
                            <p className="text-sm text-slate-400">
                              {game.genres?.[0]?.name || "Game"} • ★ {game.rating}
                            </p>
                          </div>
                          <Button
                            size="sm"
                            onClick={() => addToRankingMutation.mutate(game)}
                            disabled={addToRankingMutation.isPending}
                            className="bg-red-600 hover:bg-red-700"
                            data-testid={`button-add-game-${game.id}`}
                          >
                            <Plus className="w-4 h-4 mr-1" />
                            Add
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Ranked list */}
      {rankedActivities.length === 0 ? (
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-12">
            <div className="text-center text-slate-400">
              <Trophy className="w-16 h-16 mx-auto mb-4 text-slate-600" />
              <h3 className="text-xl font-semibold mb-2">No Rankings Yet</h3>
              <p>
                {selectedType === "game"
                  ? "Search for games above to add them to your ranking list."
                  : `Add ${selectedType}s to your library and rank them here.`}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={(e) => setActiveId(e.active.id as string)}
          onDragEnd={handleDragEnd}
          onDragCancel={() => setActiveId(null)}
        >
          <SortableContext
            items={rankedActivities.map((a) => a.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-3">
              {rankedActivities.map((activity, index) => (
                <SortableRankItem
                  key={activity.id}
                  activity={activity}
                  rank={index + 1}
                />
              ))}
            </div>
          </SortableContext>

          <DragOverlay>
            {activeActivity ? (
              <Card className="bg-slate-800 border-red-500 shadow-2xl shadow-red-500/50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-3">
                      <GripVertical className="w-5 h-5 text-slate-400" />
                      <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-red-600 text-white font-bold text-xl">
                        {rankedActivities.findIndex(a => a.id === activeId) + 1}
                      </div>
                    </div>
                    {activeActivity.imageUrl && (
                      <div className="w-16 h-16 rounded overflow-hidden bg-slate-700">
                        <img
                          src={activeActivity.imageUrl}
                          alt={activeActivity.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-white">
                        {activeActivity.title}
                      </h3>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : null}
          </DragOverlay>
        </DndContext>
      )}
    </div>
  );
}
