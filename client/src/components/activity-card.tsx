import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Gamepad2,
  Book,
  Briefcase,
  Dumbbell,
  Palette,
  MoreVertical,
  Star,
  Clock,
  CheckCircle,
  Trophy,
  MessageSquare,
  Play,
  Pause,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import CompletionModal from "./completion-modal";
import type { Activity } from "@shared/schema";

const activityIcons = {
  game: Gamepad2,
  study: Book,
  work: Briefcase,
  exercise: Dumbbell,
  reading: Book,
  hobby: Palette,
  other: Star,
};

const statusColors = {
  wishlist: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  in_progress: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  completed: "bg-green-500/20 text-green-400 border-green-500/30",
  dropped: "bg-red-500/20 text-red-400 border-red-500/30",
  on_hold: "bg-gray-500/20 text-gray-400 border-gray-500/30",
};

interface ActivityCardProps {
  activity: Activity;
  onEdit?: () => void;
  onDelete?: () => void;
}

export default function ActivityCard({ activity, onEdit, onDelete }: ActivityCardProps) {
  const [showCompletion, setShowCompletion] = useState(false);
  const [timerRunning, setTimerRunning] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const Icon = activityIcons[activity.type as keyof typeof activityIcons] || Star;

  const startTimerMutation = useMutation({
    mutationFn: () => {
      // Timer logic would be implemented here
      // For now, just simulate starting a timer
      return Promise.resolve();
    },
    onSuccess: () => {
      setTimerRunning(true);
      toast({
        title: "Timer started",
        description: `Started tracking time for ${activity.title}`,
      });
    },
  });

  const stopTimerMutation = useMutation({
    mutationFn: () => {
      // Timer logic would be implemented here
      // This would create a session with the elapsed time
      return Promise.resolve();
    },
    onSuccess: () => {
      setTimerRunning(false);
      toast({
        title: "Session logged",
        description: "Time has been added to your activity",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/activities'] });
    },
  });

  const handleComplete = () => {
    if (activity.status === 'completed') {
      toast({
        title: "Already completed",
        description: "This activity is already marked as completed",
      });
      return;
    }
    setShowCompletion(true);
  };

  const handleTimer = () => {
    if (timerRunning) {
      stopTimerMutation.mutate();
    } else {
      startTimerMutation.mutate();
    }
  };

  return (
    <>
      <Card className="group hover:shadow-lg transition-all duration-300 border-slate-700 bg-slate-800/50">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3 flex-1 min-w-0">
              {activity.imageUrl ? (
                <img
                  src={activity.imageUrl}
                  alt={activity.title}
                  className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                />
              ) : (
                <div className="w-12 h-12 rounded-lg bg-slate-700 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-6 h-6 text-slate-300" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-white truncate">{activity.title}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className="text-xs capitalize">
                    {activity.type}
                  </Badge>
                  {activity.category && (
                    <Badge variant="secondary" className="text-xs">
                      {activity.category}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 p-0"
                >
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={onEdit}>
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleComplete}>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Mark Complete
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Write Review
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onDelete} className="text-red-400">
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Status Badge */}
          <div className="flex items-center justify-between">
            <Badge 
              className={cn("text-xs border", statusColors[activity.status as keyof typeof statusColors])}
            >
              {activity.status === 'in_progress' ? 'In Progress' : 
               activity.status === 'on_hold' ? 'On Hold' : 
               activity.status.charAt(0).toUpperCase() + activity.status.slice(1)}
            </Badge>
            {activity.status === 'completed' && (
              <Trophy className="w-4 h-4 text-yellow-500" />
            )}
          </div>

          {/* Progress Bar */}
          {activity.progress !== null && activity.progress > 0 && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Progress</span>
                <span className="text-slate-300">{activity.progress}%</span>
              </div>
              <Progress value={activity.progress} className="h-2" />
            </div>
          )}

          {/* Rating */}
          {activity.rating && (
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              <span className="text-sm text-slate-300">{activity.rating}/5</span>
            </div>
          )}

          {/* Time Tracking */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <Clock className="w-4 h-4" />
              <span>{activity.totalHours || 0}h logged</span>
            </div>
            <Button
              size="sm"
              variant={timerRunning ? "destructive" : "outline"}
              onClick={handleTimer}
              disabled={startTimerMutation.isPending || stopTimerMutation.isPending}
            >
              {timerRunning ? (
                <>
                  <Pause className="w-4 h-4 mr-2" />
                  Stop
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  Start
                </>
              )}
            </Button>
          </div>

          {/* Description */}
          {activity.description && (
            <p className="text-sm text-slate-400 line-clamp-2">
              {activity.description}
            </p>
          )}

          {/* Tags */}
          {activity.tags && activity.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {activity.tags.slice(0, 3).map((tag, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
              {activity.tags.length > 3 && (
                <Badge variant="secondary" className="text-xs">
                  +{activity.tags.length - 3} more
                </Badge>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <CompletionModal
        activity={activity}
        isOpen={showCompletion}
        onClose={() => setShowCompletion(false)}
      />
    </>
  );
}