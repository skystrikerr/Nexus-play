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
import { Trophy, GripVertical, Search, X, Plus, UserPlus, List, Trash2 } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { searchGames, mapRawgToActivity, type RawgGame } from "@/lib/rawg-api";
import type { Activity } from "@shared/schema";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

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

interface RankingList {
  id: string;
  userId: string;
  name: string;
  description: string | null;
  type: string;
  isPublic: number;
  createdAt: Date;
  updatedAt: Date;
}

interface RankingItem {
  id: string;
  rankingListId: string;
  activityId: string;
  position: number;
  notes: string | null;
  createdAt: Date;
}

interface RankedGameWithActivity {
  item: RankingItem;
  activity: Activity;
}

function SortableRankItem({ activity, rank, onRemove }: { activity: Activity; rank: number; onRemove: () => void }) {
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
      <Card className="bg-[#1E293B] border-[#334155] hover:border-teal-500 transition-all">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing">
                <GripVertical className="w-5 h-5 text-slate-400" />
              </div>
              <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-gradient-to-r from-teal-500 to-violet-500 text-white font-bold text-xl">
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

            <Button
              variant="ghost"
              size="sm"
              onClick={onRemove}
              className="text-red-400 hover:text-red-300 hover:bg-red-950"
              data-testid={`button-remove-${activity.id}`}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function TierList() {
  const { toast } = useToast();
  const [selectedType, setSelectedType] = useState<string>("game");
  const [selectedListId, setSelectedListId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<RawgGame[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newListName, setNewListName] = useState("");
  const [newListDescription, setNewListDescription] = useState("");
  
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

  // Fetch ranking lists
  const { data: rankingLists = [], isLoading: listsLoading } = useQuery<RankingList[]>({
    queryKey: ["/api/ranking-lists", selectedType],
    enabled: !isGuest,
  });

  // Auto-select first list when lists load
  if (!selectedListId && rankingLists.length > 0) {
    setSelectedListId(rankingLists[0].id);
  }

  // Fetch activities for the selected list
  const { data: activities = [], isLoading: activitiesLoading } = useQuery<Activity[]>({
    queryKey: ["/api/activities"],
    enabled: !isGuest,
  });

  // Fetch ranking items for selected list
  const { data: rankingItems = [], isLoading: itemsLoading } = useQuery<RankingItem[]>({
    queryKey: ["/api/ranking-lists", selectedListId, "items"],
    enabled: !isGuest && !!selectedListId,
  });

  // Combine ranking items with activities
  const rankedActivities: Activity[] = rankingItems
    .map(item => {
      const activity = activities.find(a => a.id === item.activityId);
      return activity;
    })
    .filter((a): a is Activity => a !== undefined)
    .sort((a, b) => {
      const aItem = rankingItems.find(i => i.activityId === a.id);
      const bItem = rankingItems.find(i => i.activityId === b.id);
      return (aItem?.position || 0) - (bItem?.position || 0);
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

  // Create ranking list
  const createListMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/ranking-lists", {
        name: newListName,
        description: newListDescription || null,
        type: selectedType,
      });
    },
    onSuccess: (newList: RankingList) => {
      queryClient.invalidateQueries({ queryKey: ["/api/ranking-lists"] });
      setSelectedListId(newList.id);
      setIsCreateDialogOpen(false);
      setNewListName("");
      setNewListDescription("");
      toast({
        title: "List Created",
        description: "Your new ranking list has been created.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create ranking list. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Add game to ranking list
  const addToRankingMutation = useMutation({
    mutationFn: async (rawgGame: RawgGame) => {
      if (!selectedListId) {
        throw new Error("No list selected");
      }

      // First create the activity
      const activityData = mapRawgToActivity(rawgGame);
      const activity = await apiRequest("POST", "/api/activities", activityData);

      // Then add it to the ranking list
      const nextPosition = rankingItems.length + 1;
      return apiRequest("POST", `/api/ranking-lists/${selectedListId}/items`, {
        rankingListId: selectedListId,
        activityId: activity.id,
        position: nextPosition,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/activities"] });
      queryClient.invalidateQueries({ queryKey: ["/api/ranking-lists", selectedListId, "items"] });
      setSearchQuery("");
      setSearchResults([]);
      toast({
        title: "Added to Rankings",
        description: "Game has been added to your ranking list.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add game. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Remove game from ranking list
  const removeFromRankingMutation = useMutation({
    mutationFn: async (activityId: string) => {
      const item = rankingItems.find(i => i.activityId === activityId);
      if (!item) {
        throw new Error("Item not found");
      }
      return apiRequest("DELETE", `/api/ranking-items/${item.id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ranking-lists", selectedListId, "items"] });
      toast({
        title: "Removed from Rankings",
        description: "Game has been removed from your ranking list.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to remove game. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Update rankings after reorder
  const updateRankingsMutation = useMutation({
    mutationFn: async (orderedActivities: Activity[]) => {
      if (!selectedListId) {
        throw new Error("No list selected");
      }

      // Map activities to ranking items and update positions
      const itemPositions = orderedActivities.map((activity, index) => {
        const item = rankingItems.find(i => i.activityId === activity.id);
        if (!item) {
          throw new Error(`Item not found for activity ${activity.id}`);
        }
        return {
          id: item.id,
          position: index + 1,
        };
      });

      return apiRequest("POST", `/api/ranking-lists/${selectedListId}/reorder`, {
        items: itemPositions,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ranking-lists", selectedListId, "items"] });
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

  if (listsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const activeActivity = activeId ? rankedActivities.find(a => a.id === activeId) : null;
  const selectedList = rankingLists.find(l => l.id === selectedListId);

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <Trophy className="w-8 h-8 text-teal-500" />
          <h1 className="text-3xl font-bold text-white">Game Rankings</h1>
        </div>
        <div className="flex gap-2">
          <Button
            variant={selectedType === "game" ? "default" : "outline"}
            onClick={() => setSelectedType("game")}
            className={selectedType === "game" ? "bg-gradient-to-r from-teal-500 to-violet-500 hover:from-teal-600 hover:to-violet-600" : ""}
            data-testid="button-filter-games"
          >
            Games
          </Button>
        </div>
      </div>

      {/* Guest user message */}
      {isGuest && (
        <Alert className="bg-[#1E293B] border-[#334155] mb-6">
          <UserPlus className="h-5 w-5 text-teal-500" />
          <AlertDescription className="text-slate-300 ml-2">
            <span className="font-semibold text-white">Sign up for free</span> to create and manage your personal game ranking lists!
            <Button
              size="sm"
              onClick={() => window.location.href = "/auth"}
              className="ml-3 bg-gradient-to-r from-teal-500 to-violet-500 hover:from-teal-600 hover:to-violet-600"
            >
              Create Account
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* List selector and create button */}
      {!isGuest && (
        <Card className="bg-[#1E293B] border-[#334155] mb-6">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <Label className="text-slate-300 mb-2 block">Select Ranking List</Label>
                <Select
                  value={selectedListId || undefined}
                  onValueChange={setSelectedListId}
                  disabled={rankingLists.length === 0}
                >
                  <SelectTrigger className="bg-[#0F172A] border-[#94A3B8] text-white">
                    <SelectValue placeholder="Select a ranking list" />
                  </SelectTrigger>
                  <SelectContent>
                    {rankingLists.map((list) => (
                      <SelectItem key={list.id} value={list.id}>
                        {list.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button 
                    className="bg-gradient-to-r from-teal-500 to-violet-500 hover:from-teal-600 hover:to-violet-600 mt-6"
                    data-testid="button-create-list"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    New List
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-[#1E293B] border-[#334155] text-white">
                  <DialogHeader>
                    <DialogTitle>Create New Ranking List</DialogTitle>
                    <DialogDescription className="text-slate-400">
                      Create a new list to rank your favorite games.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="list-name">List Name</Label>
                      <Input
                        id="list-name"
                        placeholder="e.g., Top 10 Racing Games"
                        value={newListName}
                        onChange={(e) => setNewListName(e.target.value)}
                        className="bg-[#0F172A] border-[#94A3B8] text-white"
                        data-testid="input-list-name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="list-description">Description (Optional)</Label>
                      <Input
                        id="list-description"
                        placeholder="Describe your ranking list..."
                        value={newListDescription}
                        onChange={(e) => setNewListDescription(e.target.value)}
                        className="bg-[#0F172A] border-[#94A3B8] text-white"
                        data-testid="input-list-description"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      onClick={() => createListMutation.mutate()}
                      disabled={!newListName.trim() || createListMutation.isPending}
                      className="bg-gradient-to-r from-teal-500 to-violet-500 hover:from-teal-600 hover:to-violet-600"
                      data-testid="button-create-list-submit"
                    >
                      {createListMutation.isPending ? "Creating..." : "Create List"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
            {selectedList && selectedList.description && (
              <p className="text-sm text-slate-400 mt-2">{selectedList.description}</p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Search to add games */}
      {selectedType === "game" && !isGuest && selectedListId && (
        <Card className="bg-[#1E293B] border-[#334155] mb-6">
          <CardContent className="p-4">
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                <Input
                  placeholder="Search games to add to your ranking..."
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="pl-10 bg-[#1E293B] border-[#94A3B8] text-white placeholder:text-slate-400 focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
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
                  <div className="w-6 h-6 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
              )}

              {searchResults.length > 0 && (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {searchResults.map((game) => (
                    <Card key={game.id} className="bg-[#0F172A] border-[#334155]">
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
                            className="bg-gradient-to-r from-teal-500 to-violet-500 hover:from-teal-600 hover:to-violet-600"
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
      {!isGuest && !selectedListId && rankingLists.length === 0 && (
        <Card className="bg-[#1E293B] border-[#334155]">
          <CardContent className="p-12">
            <div className="text-center text-slate-400">
              <List className="w-16 h-16 mx-auto mb-4 text-slate-600" />
              <h3 className="text-xl font-semibold mb-2 text-white">No Ranking Lists Yet</h3>
              <p>
                Create your first ranking list to start organizing your favorite games.
              </p>
              <Button 
                onClick={() => setIsCreateDialogOpen(true)}
                className="mt-4 bg-gradient-to-r from-teal-500 to-violet-500 hover:from-teal-600 hover:to-violet-600"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Your First List
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {!isGuest && selectedListId && rankedActivities.length === 0 ? (
        <Card className="bg-[#1E293B] border-[#334155]">
          <CardContent className="p-12">
            <div className="text-center text-slate-400">
              <Trophy className="w-16 h-16 mx-auto mb-4 text-slate-600" />
              <h3 className="text-xl font-semibold mb-2 text-white">No Games Yet</h3>
              <p>
                Search for games above to add them to this ranking list.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : !isGuest && selectedListId && rankedActivities.length > 0 ? (
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
                  onRemove={() => removeFromRankingMutation.mutate(activity.id)}
                />
              ))}
            </div>
          </SortableContext>

          <DragOverlay>
            {activeActivity ? (
              <Card className="bg-[#1E293B] border-teal-500 shadow-2xl shadow-teal-500/50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-3">
                      <GripVertical className="w-5 h-5 text-slate-400" />
                      <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-gradient-to-r from-teal-500 to-violet-500 text-white font-bold text-xl">
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
      ) : null}
    </div>
  );
}
