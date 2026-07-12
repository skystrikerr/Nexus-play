import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { apiRequest } from "@/lib/queryClient";
import { Calendar, Plus, Clock, Play } from "lucide-react";
import { cn } from "@/lib/utils";
import AddGameModal from "./add-game-modal";
import DateTimeLogModal from "./date-time-log-modal";
import type { Activity, ActivitySession } from "@shared/schema";

interface CalendarDayModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedDate: string; // YYYY-MM-DD format
}

export default function CalendarDayModal({ open, onOpenChange, selectedDate }: CalendarDayModalProps) {
  const [showAddGame, setShowAddGame] = useState(false);
  const [showTimeLog, setShowTimeLog] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);

  // Get all user activities
  const { data: activities = [] } = useQuery<Activity[]>({
    queryKey: ["/api/activities"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/activities");
      return await response.json();
    },
  });

  // Get sessions for the selected date
  const { data: sessions = [] } = useQuery<ActivitySession[]>({
    queryKey: ["/api/sessions", selectedDate],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/sessions?date=${selectedDate}`);
      return await response.json();
    },
    enabled: !!selectedDate,
  });

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getActivitySessions = (activityId: string) => {
    return sessions.filter(session => session.activityId === activityId);
  };

  const getActivityTimeForDate = (activityId: string) => {
    const activitySessions = getActivitySessions(activityId);
    return activitySessions.reduce((total, session) => total + (session.duration || 0), 0);
  };

  const dailyTotalTime = sessions.reduce((total, session) => total + (session.duration || 0), 0);

  const handleLogTime = (activity: Activity) => {
    setSelectedActivity(activity);
    setShowTimeLog(true);
  };

  const games = activities.filter(a => a.type === 'game');

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-2xl bg-popover border-border max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-foreground">
              <Calendar className="w-5 h-5" />
              {formatDate(selectedDate)}
            </DialogTitle>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                <span>{dailyTotalTime.toFixed(1)}h played today</span>
              </div>
              <div className="flex items-center gap-1">
                <Play className="w-4 h-4" />
                <span>{sessions.length} sessions</span>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-display font-semibold text-foreground">Log time for {formatDate(selectedDate).split(',')[0]}</h3>
              <Button
                onClick={() => setShowAddGame(true)}
                size="sm"
                className="bg-gradient-aurora text-white hover:opacity-90"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Game
              </Button>
            </div>

            <div className="space-y-3 max-h-80 overflow-y-auto">
              {games.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Plus className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>No games yet. Add your first game!</p>
                </div>
              ) : (
                games.map((game) => {
                  const timeToday = getActivityTimeForDate(game.id);
                  const gameSessions = getActivitySessions(game.id);

                  return (
                    <div key={game.id} className="bg-card rounded-lg p-4 border border-border">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3 flex-1">
                          {game.imageUrl && (
                            <img
                              src={game.imageUrl}
                              alt={game.title}
                              className="w-12 h-12 rounded object-cover flex-shrink-0"
                            />
                          )}

                          <div className="flex-1 min-w-0">
                            <h4 className={cn(
                              "font-medium truncate",
                              game.status === "completed" ? "text-muted-foreground line-through" : "text-foreground"
                            )}>
                              {game.title}
                            </h4>

                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="outline" className="text-xs bg-primary/15 text-primary border-primary/30">
                                {game.category || 'Game'}
                              </Badge>
                              {timeToday > 0 && (
                                <Badge variant="outline" className="text-xs bg-cyan-500/20 text-cyan-400">
                                  <Clock className="w-3 h-3 mr-1" />
                                  {timeToday.toFixed(1)}h today
                                </Badge>
                              )}
                            </div>

                            {(game.progress ?? 0) > 0 && (
                              <div className="mt-2">
                                <div className="flex justify-between text-xs text-muted-foreground mb-1">
                                  <span>Progress</span>
                                  <span>{game.progress}%</span>
                                </div>
                                <Progress value={game.progress ?? 0} className="h-1" />
                              </div>
                            )}

                            {gameSessions.length > 0 && (
                              <div className="mt-2 text-xs text-muted-foreground">
                                {gameSessions.length} session{gameSessions.length > 1 ? 's' : ''} today
                              </div>
                            )}
                          </div>
                        </div>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleLogTime(game)}
                          className="text-xs border-border text-muted-foreground hover:bg-muted"
                        >
                          + Time
                        </Button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Game Modal */}
      <AddGameModal
        open={showAddGame}
        onOpenChange={setShowAddGame}
      />

      {/* Time Log Modal */}
      {selectedActivity && (
        <DateTimeLogModal
          open={showTimeLog}
          onOpenChange={setShowTimeLog}
          task={selectedActivity}
          date={selectedDate}
        />
      )}
    </>
  );
}
