import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Calendar, Plus, Clock, Play, CheckCircle, Circle } from "lucide-react";
import { cn } from "@/lib/utils";
import AddTaskModal from "./add-task-modal";
import AddGameModal from "./add-game-modal";
import DateTimeLogModal from "./date-time-log-modal";
import type { Activity, ActivitySession } from "@shared/schema";

interface CalendarDayModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedDate: string; // YYYY-MM-DD format
}

export default function CalendarDayModal({ open, onOpenChange, selectedDate }: CalendarDayModalProps) {
  const [showAddTask, setShowAddTask] = useState(false);
  const [showAddGame, setShowAddGame] = useState(false);
  const [showTimeLog, setShowTimeLog] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

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

  const toggleStatusMutation = useMutation({
    mutationFn: (activity: Activity) => {
      const newStatus = activity.status === "completed" ? "in_progress" : "completed";
      const newProgress = newStatus === "completed" ? 100 : activity.progress;
      return apiRequest("PUT", `/api/activities/${activity.id}`, { 
        status: newStatus,
        progress: newProgress
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/activities"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({
        title: "Status Updated",
        description: "Activity status has been updated.",
      });
    },
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

  const tasks = activities.filter(a => ['work', 'study', 'other'].includes(a.type));
  const games = activities.filter(a => a.type === 'game');

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-2xl bg-popover border-border max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-white">
              <Calendar className="w-5 h-5" />
              {formatDate(selectedDate)}
            </DialogTitle>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                <span>{dailyTotalTime.toFixed(1)}h total today</span>
              </div>
              <div className="flex items-center gap-1">
                <Play className="w-4 h-4" />
                <span>{sessions.length} sessions</span>
              </div>
            </div>
          </DialogHeader>

          <Tabs defaultValue="tasks" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-card">
              <TabsTrigger value="tasks" className="data-[state=active]:bg-muted">
                Tasks ({tasks.length})
              </TabsTrigger>
              <TabsTrigger value="games" className="data-[state=active]:bg-muted">
                Games ({games.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="tasks" className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-white">Tasks</h3>
                <Button
                  onClick={() => setShowAddTask(true)}
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Task
                </Button>
              </div>

              <div className="space-y-3 max-h-60 overflow-y-auto">
                {tasks.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Plus className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>No tasks yet. Add your first task!</p>
                  </div>
                ) : (
                  tasks.map((task) => {
                    const timeToday = getActivityTimeForDate(task.id);
                    const taskSessions = getActivitySessions(task.id);
                    
                    return (
                      <div key={task.id} className="bg-card rounded-lg p-4 border border-border">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3 flex-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0 mt-1"
                              onClick={() => toggleStatusMutation.mutate(task)}
                            >
                              {task.status === "completed" ? (
                                <CheckCircle className="w-5 h-5 text-green-400" />
                              ) : (
                                <Circle className="w-5 h-5 text-muted-foreground" />
                              )}
                            </Button>
                            
                            <div className="flex-1 min-w-0">
                              <h4 className={cn(
                                "font-medium truncate",
                                task.status === "completed" ? "text-muted-foreground line-through" : "text-white"
                              )}>
                                {task.title}
                              </h4>
                              
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant="outline" className="text-xs bg-blue-500/20 text-blue-400">
                                  {task.type}
                                </Badge>
                                {timeToday > 0 && (
                                  <Badge variant="outline" className="text-xs bg-cyan-500/20 text-cyan-400">
                                    <Clock className="w-3 h-3 mr-1" />
                                    {timeToday.toFixed(1)}h today
                                  </Badge>
                                )}
                              </div>
                              
                              {task.progress > 0 && (
                                <div className="mt-2">
                                  <div className="flex justify-between text-xs text-muted-foreground mb-1">
                                    <span>Progress</span>
                                    <span>{task.progress}%</span>
                                  </div>
                                  <Progress value={task.progress} className="h-1" />
                                </div>
                              )}
                              
                              {taskSessions.length > 0 && (
                                <div className="mt-2 text-xs text-muted-foreground">
                                  {taskSessions.length} session{taskSessions.length > 1 ? 's' : ''} today
                                </div>
                              )}
                            </div>
                          </div>
                          
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleLogTime(task)}
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
            </TabsContent>

            <TabsContent value="games" className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-white">Games</h3>
                <Button
                  onClick={() => setShowAddGame(true)}
                  size="sm"
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Game
                </Button>
              </div>

              <div className="space-y-3 max-h-60 overflow-y-auto">
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
                                game.status === "completed" ? "text-muted-foreground line-through" : "text-white"
                              )}>
                                {game.title}
                              </h4>
                              
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant="outline" className="text-xs bg-purple-500/20 text-purple-400">
                                  {game.category || 'Game'}
                                </Badge>
                                {timeToday > 0 && (
                                  <Badge variant="outline" className="text-xs bg-cyan-500/20 text-cyan-400">
                                    <Clock className="w-3 h-3 mr-1" />
                                    {timeToday.toFixed(1)}h today
                                  </Badge>
                                )}
                              </div>
                              
                              {game.progress > 0 && (
                                <div className="mt-2">
                                  <div className="flex justify-between text-xs text-muted-foreground mb-1">
                                    <span>Progress</span>
                                    <span>{game.progress}%</span>
                                  </div>
                                  <Progress value={game.progress} className="h-1" />
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
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Add Task Modal */}
      <AddTaskModal
        open={showAddTask}
        onOpenChange={setShowAddTask}
      />

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