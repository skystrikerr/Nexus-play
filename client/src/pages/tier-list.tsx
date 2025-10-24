import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  horizontalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trophy, GripVertical } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Activity } from "@shared/schema";

type TierType = "S" | "A" | "B" | "C" | "D" | "F" | "Unranked";

const TIERS: { id: TierType; label: string; color: string; bgColor: string }[] = [
  { id: "S", label: "S Tier", color: "text-red-500", bgColor: "bg-red-500/20 border-red-500" },
  { id: "A", label: "A Tier", color: "text-orange-500", bgColor: "bg-orange-500/20 border-orange-500" },
  { id: "B", label: "B Tier", color: "text-yellow-500", bgColor: "bg-yellow-500/20 border-yellow-500" },
  { id: "C", label: "C Tier", color: "text-green-500", bgColor: "bg-green-500/20 border-green-500" },
  { id: "D", label: "D Tier", color: "text-blue-500", bgColor: "bg-blue-500/20 border-blue-500" },
  { id: "F", label: "F Tier", color: "text-gray-500", bgColor: "bg-gray-500/20 border-gray-500" },
  { id: "Unranked", label: "Unranked", color: "text-slate-400", bgColor: "bg-slate-800 border-slate-600" },
];

function SortableActivityCard({ activity }: { activity: Activity }) {
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
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <Card
        className="w-[150px] bg-slate-800 border-slate-700 hover:border-red-500 transition-all cursor-grab active:cursor-grabbing"
        data-testid={`card-activity-${activity.id}`}
      >
        <CardContent className="p-3 space-y-2">
          {activity.imageUrl && (
            <div className="w-full h-[180px] rounded overflow-hidden bg-slate-700">
              <img
                src={activity.imageUrl}
                alt={activity.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}
          <div className="space-y-1">
            <div className="flex items-start justify-between gap-2">
              <h3 className="text-sm font-semibold text-white line-clamp-2">
                {activity.title}
              </h3>
              <GripVertical className="w-4 h-4 text-slate-400 flex-shrink-0" />
            </div>
            {activity.rating && (
              <div className="flex items-center gap-1">
                <span className="text-yellow-500 text-xs">★</span>
                <span className="text-xs text-slate-400">
                  {activity.rating}/5
                </span>
              </div>
            )}
            {activity.totalHours > 0 && (
              <p className="text-xs text-slate-400">
                {activity.totalHours.toFixed(1)}h played
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function TierList() {
  const { toast } = useToast();
  const [selectedType, setSelectedType] = useState<string>("game");
  const [activeId, setActiveId] = useState<string | null>(null);
  
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  // Fetch all activities
  const { data: activities = [], isLoading } = useQuery<Activity[]>({
    queryKey: ["/api/activities"],
  });

  // Filter by type and group by tier
  const filteredActivities = activities.filter(
    (activity) => activity.type === selectedType
  );

  const groupedByTier = TIERS.reduce((acc, tier) => {
    acc[tier.id] = filteredActivities.filter((activity) => 
      tier.id === "Unranked" 
        ? !activity.tier || activity.tier === null
        : activity.tier === tier.id
    );
    return acc;
  }, {} as Record<TierType, Activity[]>);

  // Update tier mutation
  const updateTierMutation = useMutation({
    mutationFn: ({ activityId, tier }: { activityId: string; tier: string | null }) =>
      apiRequest("PUT", `/api/activities/${activityId}`, { tier }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/activities"] });
      toast({
        title: "Tier Updated",
        description: "Game tier has been updated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update tier. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
    
    const { active, over } = event;

    if (!over) return;

    // Extract tier from the over container ID
    const overId = over.id as string;
    
    // Check if we're dropping over a tier container
    const tierMatch = TIERS.find(t => overId.startsWith(`tier-${t.id}`));
    
    if (tierMatch) {
      const newTier = tierMatch.id === "Unranked" ? null : tierMatch.id;
      updateTierMutation.mutate({ activityId: active.id as string, tier: newTier });
    }
  };

  const handleDragCancel = () => {
    setActiveId(null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const activeActivity = activeId ? filteredActivities.find(a => a.id === activeId) : null;

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <Trophy className="w-8 h-8 text-red-500" />
          <h1 className="text-3xl font-bold text-white">Tier List</h1>
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

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <div className="space-y-6">
          {TIERS.map((tier) => {
            const tierActivities = groupedByTier[tier.id] || [];

            return (
              <div key={tier.id} className="space-y-2" data-testid={`tier-section-${tier.id}`}>
                <div className="flex items-center gap-4">
                  <div
                    className={`flex items-center justify-center w-20 h-16 rounded-lg font-bold text-2xl border-2 ${tier.bgColor} ${tier.color}`}
                  >
                    {tier.id === "Unranked" ? "?" : tier.id}
                  </div>
                  <div className="flex-1">
                    <h2 className={`text-xl font-bold ${tier.color}`}>{tier.label}</h2>
                    <p className="text-sm text-slate-400">
                      {tierActivities.length} {selectedType}{tierActivities.length !== 1 ? "s" : ""}
                    </p>
                  </div>
                </div>

                <SortableContext
                  id={`tier-${tier.id}`}
                  items={tierActivities.map(a => a.id)}
                  strategy={horizontalListSortingStrategy}
                >
                  <div className="min-h-[180px] p-4 rounded-lg border-2 border-dashed border-slate-700 bg-slate-900/50">
                    <div className="flex gap-4 overflow-x-auto pb-2">
                      {tierActivities.length === 0 ? (
                        <div className="flex items-center justify-center w-full text-slate-500 text-sm">
                          Drag {selectedType}s here
                        </div>
                      ) : (
                        tierActivities.map((activity) => (
                          <SortableActivityCard key={activity.id} activity={activity} />
                        ))
                      )}
                    </div>
                  </div>
                </SortableContext>
              </div>
            );
          })}
        </div>

        <DragOverlay>
          {activeActivity ? (
            <Card className="w-[150px] bg-slate-800 border-red-500 shadow-2xl shadow-red-500/50">
              <CardContent className="p-3 space-y-2">
                {activeActivity.imageUrl && (
                  <div className="w-full h-[180px] rounded overflow-hidden bg-slate-700">
                    <img
                      src={activeActivity.imageUrl}
                      alt={activeActivity.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div className="space-y-1">
                  <h3 className="text-sm font-semibold text-white line-clamp-2">
                    {activeActivity.title}
                  </h3>
                </div>
              </CardContent>
            </Card>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
