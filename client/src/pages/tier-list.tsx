import { useState, useEffect, useCallback, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
  CollisionDetection,
  pointerWithin,
  closestCorners,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  useDroppable,
  DragOverlay,
} from "@dnd-kit/core";
import {
  SortableContext,
  rectSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Gamepad2, Search, X, Plus, UserPlus, Trash2 } from "lucide-react";
import PageHeader from "@/components/page-header";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { searchGames, mapRawgToActivity, type RawgGame } from "@/lib/rawg-api";
import type { Activity } from "@shared/schema";

const TIERS = [
  { id: "S", color: "bg-red-500" },
  { id: "A", color: "bg-orange-500" },
  { id: "B", color: "bg-amber-400" },
  { id: "C", color: "bg-yellow-300" },
  { id: "D", color: "bg-lime-400" },
  { id: "F", color: "bg-sky-400" },
] as const;

const UNRANKED = "unranked";
const ALL_ROWS = [...TIERS.map(t => t.id), UNRANKED] as string[];

type Board = Record<string, string[]>; // row id -> activity ids in order

interface RankingList {
  id: string;
  name: string;
  description: string | null;
}

interface RankingItem {
  id: string;
  rankingListId: string;
  activityId: string;
  position: number;
  tier: string | null;
}

function emptyBoard(): Board {
  return Object.fromEntries(ALL_ROWS.map(r => [r, []]));
}

/** A single draggable game cover tile */
function GameTile({ activity, onRemove, dragging }: { activity: Activity; onRemove?: () => void; dragging?: boolean }) {
  return (
    <div
      className={`relative group w-20 shrink-0 select-none ${dragging ? "shadow-2xl shadow-primary/40 scale-105" : ""}`}
      title={activity.title}
    >
      {activity.imageUrl ? (
        <img
          src={activity.imageUrl}
          alt={activity.title}
          className="w-20 h-20 rounded-lg object-cover border border-border/60 pointer-events-none"
          draggable={false}
        />
      ) : (
        <div className="w-20 h-20 rounded-lg bg-muted border border-border/60 flex items-center justify-center p-1">
          <span className="text-[10px] text-muted-foreground text-center leading-tight line-clamp-4">
            {activity.title}
          </span>
        </div>
      )}
      <div className="absolute inset-x-0 bottom-0 bg-black/70 rounded-b-lg px-1 py-0.5 pointer-events-none">
        <p className="text-[9px] text-white truncate">{activity.title}</p>
      </div>
      {onRemove && (
        <button
          onClick={(e) => { e.stopPropagation(); onRemove(); }}
          onPointerDown={(e) => e.stopPropagation()}
          className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-destructive text-white items-center justify-center hidden group-hover:flex z-10"
          title="Remove from list"
        >
          <X className="w-3 h-3" />
        </button>
      )}
    </div>
  );
}

function SortableTile({ activity, onRemove }: { activity: Activity; onRemove: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: activity.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };
  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing touch-none">
      <GameTile activity={activity} onRemove={onRemove} />
    </div>
  );
}

/** One tier row (or the unranked pool) that tiles can be dropped into */
function TierRow({
  rowId,
  label,
  color,
  activityIds,
  activityById,
  onRemove,
}: {
  rowId: string;
  label: string;
  color?: string;
  activityIds: string[];
  activityById: Map<string, Activity>;
  onRemove: (activityId: string) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: `row-${rowId}` });

  return (
    <div className="flex rounded-xl overflow-hidden border border-border/60">
      {color ? (
        <div className={`w-16 sm:w-20 shrink-0 ${color} flex items-center justify-center`}>
          <span className="text-black font-display font-bold text-2xl">{label}</span>
        </div>
      ) : (
        <div className="w-16 sm:w-20 shrink-0 bg-muted flex items-center justify-center">
          <span className="text-muted-foreground font-display font-semibold text-xs text-center px-1">{label}</span>
        </div>
      )}
      <SortableContext items={activityIds} strategy={rectSortingStrategy}>
        <div
          ref={setNodeRef}
          className={`flex-1 min-h-[6rem] p-2 flex flex-wrap gap-2 items-center transition-colors ${
            isOver ? "bg-primary/10" : "bg-card/40"
          }`}
        >
          {activityIds.length === 0 && (
            <span className="text-xs text-muted-foreground/50 px-2">Drag games here</span>
          )}
          {activityIds.map((id) => {
            const activity = activityById.get(id);
            if (!activity) return null;
            return <SortableTile key={id} activity={activity} onRemove={() => onRemove(id)} />;
          })}
        </div>
      </SortableContext>
    </div>
  );
}

// Tier rows are wide, so corner-distance collision picks wrong targets.
// Use whatever the pointer is actually inside; prefer tiles over their row.
const tierCollisionDetection: CollisionDetection = (args) => {
  const within = pointerWithin(args);
  if (within.length > 0) {
    const tileHit = within.find(c => !String(c.id).startsWith("row-"));
    return tileHit ? [tileHit] : within;
  }
  return closestCorners(args);
};

function debounce<T extends (...args: any[]) => void>(func: T, wait: number) {
  let timeout: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

export default function TierList() {
  const { toast } = useToast();
  const [selectedListId, setSelectedListId] = useState<string | null>(null);
  const [board, setBoard] = useState<Board>(emptyBoard());
  const [activeId, setActiveId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<RawgGame[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [dropSignal, setDropSignal] = useState(0);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newListName, setNewListName] = useState("");
  const [newListDescription, setNewListDescription] = useState("");
  const boardDirty = useRef(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 6 } })
  );

  const { data: user } = useQuery({ queryKey: ["/api/auth/user"] });
  const isGuest = (user as any)?.isGuest;

  const { data: rankingListsData, isLoading: listsLoading } = useQuery<RankingList[]>({
    queryKey: ["/api/ranking-lists"],
    enabled: !isGuest,
  });
  const rankingLists = rankingListsData ?? [];

  const { data: activitiesData } = useQuery<Activity[]>({
    queryKey: ["/api/activities"],
    enabled: !isGuest,
  });
  const activities = activitiesData ?? [];

  const { data: rankingItemsData } = useQuery<RankingItem[]>({
    queryKey: ["/api/ranking-lists", selectedListId, "items"],
    enabled: !isGuest && !!selectedListId,
  });
  const rankingItems = rankingItemsData ?? [];

  // Auto-select the first list once lists arrive
  useEffect(() => {
    if (!selectedListId && rankingListsData && rankingListsData.length > 0) {
      setSelectedListId(rankingListsData[0].id);
    }
  }, [rankingListsData, selectedListId]);

  // Rebuild the local board whenever server items change (unless mid-edit)
  useEffect(() => {
    const next = emptyBoard();
    [...(rankingItemsData ?? [])]
      .sort((a, b) => a.position - b.position)
      .forEach((item) => {
        const row = item.tier && ALL_ROWS.includes(item.tier) ? item.tier : UNRANKED;
        next[row].push(item.activityId);
      });
    setBoard(next);
    boardDirty.current = false;
  }, [rankingItemsData]);

  const activityById = new Map(activities.map(a => [a.id, a]));
  const itemByActivityId = new Map(rankingItems.map(i => [i.activityId, i]));

  // ----- Mutations -----

  const createListMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/ranking-lists", {
        name: newListName,
        ...(newListDescription.trim() ? { description: newListDescription.trim() } : {}),
        type: "game",
      });
      return (await res.json()) as RankingList;
    },
    onSuccess: (newList) => {
      queryClient.invalidateQueries({ queryKey: ["/api/ranking-lists"] });
      setSelectedListId(newList.id);
      setIsCreateDialogOpen(false);
      setNewListName("");
      setNewListDescription("");
      toast({ title: "List Created", description: `"${newList.name}" is ready — add some games!` });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create list. Please try again.", variant: "destructive" });
    },
  });

  const deleteListMutation = useMutation({
    mutationFn: async (listId: string) => apiRequest("DELETE", `/api/ranking-lists/${listId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ranking-lists"] });
      setSelectedListId(null);
      toast({ title: "List Deleted" });
    },
  });

  const addGameMutation = useMutation({
    mutationFn: async (rawgGame: RawgGame) => {
      if (!selectedListId) throw new Error("No list selected");

      // Reuse an existing library entry for this game if there is one
      let activity = activities.find(
        a => (a.metadata as any)?.rawgId === rawgGame.id || a.title.toLowerCase() === rawgGame.name.toLowerCase()
      );
      if (!activity) {
        const res = await apiRequest("POST", "/api/activities", mapRawgToActivity(rawgGame));
        activity = (await res.json()) as Activity;
      }

      if (rankingItems.some(i => i.activityId === activity!.id)) {
        throw new Error("That game is already on this list");
      }

      const res = await apiRequest("POST", `/api/ranking-lists/${selectedListId}/items`, {
        rankingListId: selectedListId,
        activityId: activity.id,
        position: rankingItems.length + 1,
        tier: null,
      });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/activities"] });
      queryClient.invalidateQueries({ queryKey: ["/api/ranking-lists", selectedListId, "items"] });
      toast({ title: "Game Added", description: "Drag it into a tier to rank it." });
    },
    onError: (error: any) => {
      toast({ title: "Couldn't Add Game", description: error.message || "Please try again.", variant: "destructive" });
    },
  });

  const removeItemMutation = useMutation({
    mutationFn: async (activityId: string) => {
      const item = itemByActivityId.get(activityId);
      if (!item) throw new Error("Item not found");
      return apiRequest("DELETE", `/api/ranking-items/${item.id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ranking-lists", selectedListId, "items"] });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to remove game.", variant: "destructive" });
    },
  });

  const persistBoardMutation = useMutation({
    mutationFn: async (next: Board) => {
      if (!selectedListId) throw new Error("No list selected");
      let position = 1;
      const items: { id: string; position: number; tier: string | null }[] = [];
      for (const row of ALL_ROWS) {
        for (const activityId of next[row]) {
          const item = itemByActivityId.get(activityId);
          if (item) {
            items.push({ id: item.id, position: position++, tier: row === UNRANKED ? null : row });
          }
        }
      }
      return apiRequest("POST", `/api/ranking-lists/${selectedListId}/reorder`, { items });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ranking-lists", selectedListId, "items"] });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to save your ranking.", variant: "destructive" });
      queryClient.invalidateQueries({ queryKey: ["/api/ranking-lists", selectedListId, "items"] });
    },
  });

  // ----- Search -----

  const handleSearch = useCallback(async (query: string) => {
    if (query.length < 2) { setSearchResults([]); return; }
    setIsSearching(true);
    try {
      const results = await searchGames(query);
      setSearchResults(results.results || []);
    } finally {
      setIsSearching(false);
    }
  }, []);

  const debouncedSearch = useCallback(debounce(handleSearch, 400), [handleSearch]);

  // ----- Drag & drop -----

  const rowFromDroppableId = (id: string): string | undefined =>
    id.startsWith("row-") ? id.slice(4) : undefined;

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;
    const activeId = active.id as string;
    const overId = over.id as string;

    // All row lookups happen against the freshest state inside the updater —
    // drag-over events can fire faster than React re-renders.
    setBoard(prev => {
      const activeRow = ALL_ROWS.find(r => prev[r].includes(activeId));
      const overRow = rowFromDroppableId(overId) ?? ALL_ROWS.find(r => prev[r].includes(overId));
      if (!activeRow || !overRow || activeRow === overRow) return prev;

      // Remove the tile from every row (dedupe-proof), then insert at target
      const next: Board = Object.fromEntries(
        ALL_ROWS.map(r => [r, prev[r].filter(id => id !== activeId)])
      );
      const overIndex = next[overRow].indexOf(overId);
      if (overIndex >= 0) {
        next[overRow].splice(overIndex, 0, activeId);
      } else {
        next[overRow].push(activeId);
      }
      boardDirty.current = true;
      return next;
    });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    if (!over) {
      boardDirty.current = false;
      return;
    }

    setBoard(prev => {
      const activeIdStr = active.id as string;
      const overId = over.id as string;
      const activeRow = ALL_ROWS.find(r => prev[r].includes(activeIdStr));
      const overRow = rowFromDroppableId(overId) ?? ALL_ROWS.find(r => prev[r].includes(overId));

      if (activeRow && overRow && activeRow === overRow && activeIdStr !== overId) {
        const ids = prev[activeRow];
        const oldIndex = ids.indexOf(activeIdStr);
        const newIndex = ids.indexOf(overId);
        if (oldIndex >= 0 && newIndex >= 0) {
          boardDirty.current = true;
          return { ...prev, [activeRow]: arrayMove(ids, oldIndex, newIndex) };
        }
      }
      return prev;
    });

    // Persist after React commits the final board (see effect below)
    setDropSignal(n => n + 1);
  };

  // Save the board after a drop completes
  useEffect(() => {
    if (dropSignal > 0 && boardDirty.current) {
      boardDirty.current = false;
      persistBoardMutation.mutate(board);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dropSignal, board]);

  // ----- Render -----

  const selectedList = rankingLists.find(l => l.id === selectedListId);
  const activeActivity = activeId ? activityById.get(activeId) : null;
  const totalOnBoard = ALL_ROWS.reduce((sum, row) => sum + board[row].length, 0);

  return (
    <>
      <PageHeader
        title="Tier Lists"
        subtitle={selectedList ? `${selectedList.name} · ${totalOnBoard} games` : "Rank your games, S through F"}
        actions={
          !isGuest && (
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-aurora text-white hover:opacity-90 shadow-lg shadow-primary/20">
                  <Plus className="w-4 h-4 mr-2" />
                  New List
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-popover border-border">
                <DialogHeader>
                  <DialogTitle className="text-foreground">Create New Tier List</DialogTitle>
                  <DialogDescription className="text-muted-foreground">
                    Name your list, then search games and drag them into tiers.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="list-name" className="text-foreground">List Name</Label>
                    <Input
                      id="list-name"
                      placeholder="e.g., Best RPGs of All Time"
                      value={newListName}
                      onChange={(e) => setNewListName(e.target.value)}
                      className="bg-muted border-input text-foreground"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="list-description" className="text-foreground">Description (Optional)</Label>
                    <Input
                      id="list-description"
                      placeholder="What's this list about?"
                      value={newListDescription}
                      onChange={(e) => setNewListDescription(e.target.value)}
                      className="bg-muted border-input text-foreground"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    onClick={() => createListMutation.mutate()}
                    disabled={!newListName.trim() || createListMutation.isPending}
                    className="bg-gradient-aurora text-white hover:opacity-90"
                  >
                    {createListMutation.isPending ? "Creating..." : "Create List"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )
        }
      />

      <div className="px-4 sm:px-6 lg:px-8 py-6 space-y-5">
        {/* Guest user message */}
        {isGuest && (
          <Alert className="glass border-border/60">
            <UserPlus className="h-5 w-5 text-primary" />
            <AlertDescription className="text-muted-foreground ml-2">
              <span className="font-semibold text-foreground">Sign up for free</span> to build drag-and-drop tier lists of your games!
              <Button
                size="sm"
                onClick={() => (window.location.href = "/auth")}
                className="ml-3 bg-gradient-aurora text-white hover:opacity-90"
              >
                Create Account
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {!isGuest && listsLoading && (
          <div className="space-y-3">
            {[1, 2, 3].map(i => <div key={i} className="shimmer rounded-xl h-24" />)}
          </div>
        )}

        {/* No lists yet */}
        {!isGuest && !listsLoading && rankingLists.length === 0 && (
          <div className="glass-glow rounded-xl p-12 text-center">
            <Gamepad2 className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
            <h3 className="text-lg font-display font-semibold text-foreground mb-1">No Tier Lists Yet</h3>
            <p className="text-muted-foreground mb-6">
              Create your first list, search for games, and drag them into tiers.
            </p>
            <Button
              onClick={() => setIsCreateDialogOpen(true)}
              className="bg-gradient-aurora text-white hover:opacity-90"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Your First List
            </Button>
          </div>
        )}

        {!isGuest && rankingLists.length > 0 && (
          <>
            {/* List picker + search row */}
            <div className="flex flex-col lg:flex-row gap-3">
              <div className="lg:w-64">
                <Select value={selectedListId || undefined} onValueChange={setSelectedListId}>
                  <SelectTrigger className="bg-muted border-input text-foreground">
                    <SelectValue placeholder="Select a list" />
                  </SelectTrigger>
                  <SelectContent>
                    {rankingLists.map((list) => (
                      <SelectItem key={list.id} value={list.id}>{list.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search games to add..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    debouncedSearch(e.target.value);
                  }}
                  className="pl-10 bg-muted border-input text-foreground placeholder:text-muted-foreground/60"
                />
                {searchQuery && (
                  <button
                    onClick={() => { setSearchQuery(""); setSearchResults([]); }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {selectedListId && (
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => {
                    if (window.confirm(`Delete "${selectedList?.name}"? The games stay in your library.`)) {
                      deleteListMutation.mutate(selectedListId);
                    }
                  }}
                  className="border-border text-muted-foreground hover:text-destructive hover:border-destructive/40 shrink-0"
                  title="Delete this list"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </div>

            {/* Search results */}
            {(isSearching || searchResults.length > 0) && (
              <div className="glass rounded-xl p-3">
                {isSearching ? (
                  <div className="flex items-center justify-center py-6">
                    <div className="w-6 h-6 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : (
                  <div className="flex gap-3 overflow-x-auto pb-1">
                    {searchResults.slice(0, 10).map((game) => (
                      <button
                        key={game.id}
                        onClick={() => addGameMutation.mutate(game)}
                        disabled={addGameMutation.isPending || !selectedListId}
                        className="w-24 shrink-0 text-left group disabled:opacity-50"
                        title={`Add ${game.name}`}
                      >
                        {game.background_image ? (
                          <img
                            src={game.background_image}
                            alt={game.name}
                            className="w-24 h-24 rounded-lg object-cover border border-border/60 group-hover:border-primary transition-colors"
                          />
                        ) : (
                          <div className="w-24 h-24 rounded-lg bg-muted border border-border/60 flex items-center justify-center">
                            <Gamepad2 className="w-6 h-6 text-muted-foreground/40" />
                          </div>
                        )}
                        <p className="text-xs text-muted-foreground group-hover:text-foreground truncate mt-1">
                          <Plus className="w-3 h-3 inline mr-0.5" />
                          {game.name}
                        </p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* The tier board */}
            {selectedListId && (
              <DndContext
                sensors={sensors}
                collisionDetection={tierCollisionDetection}
                onDragStart={(e: DragStartEvent) => setActiveId(e.active.id as string)}
                onDragOver={handleDragOver}
                onDragEnd={handleDragEnd}
                onDragCancel={() => setActiveId(null)}
              >
                <div className="space-y-2">
                  {TIERS.map(({ id, color }) => (
                    <TierRow
                      key={id}
                      rowId={id}
                      label={id}
                      color={color}
                      activityIds={board[id]}
                      activityById={activityById}
                      onRemove={(activityId) => removeItemMutation.mutate(activityId)}
                    />
                  ))}
                  <TierRow
                    rowId={UNRANKED}
                    label="UNRANKED"
                    activityIds={board[UNRANKED]}
                    activityById={activityById}
                    onRemove={(activityId) => removeItemMutation.mutate(activityId)}
                  />
                </div>

                <DragOverlay dropAnimation={null}>
                  {activeActivity ? <GameTile activity={activeActivity} dragging /> : null}
                </DragOverlay>
              </DndContext>
            )}

            {selectedListId && totalOnBoard === 0 && (
              <p className="text-center text-sm text-muted-foreground">
                Search for games above — they'll land in <span className="text-foreground font-medium">Unranked</span>, then drag them into tiers.
              </p>
            )}
          </>
        )}
      </div>
    </>
  );
}
