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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import CompletionModal from "./completion-modal";
import { TimerButton } from "./timer-button";
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
  wishlist: "bg-info/20 text-info border-info/30",
  in_progress: "bg-warning/20 text-warning border-warning/30",
  completed: "bg-success/20 text-success border-success/30",
  dropped: "bg-destructive/20 text-destructive border-destructive/30",
  on_hold: "bg-silver/20 text-silver border-silver/30",
};

const getActivityGradient = (type: string) => {
  switch (type) {
    case 'game':
      return {
        rail: 'rail-aurora',
        gradient: 'bg-gradient-aurora',
        text: 'text-gradient-aurora',
        glow: 'hover:shadow-aurora-start/20'
      };
    case 'study':
    case 'work':
      return {
        rail: 'rail-solar',
        gradient: 'bg-gradient-solar',
        text: 'text-gradient-solar',
        glow: 'hover:shadow-solar-start/20'
      };
    case 'exercise':
      return {
        rail: 'rail-pulse',
        gradient: 'bg-gradient-pulse',
        text: 'text-gradient-pulse',
        glow: 'hover:shadow-pulse-start/20'
      };
    default:
      return {
        rail: 'rail-neutral',
        gradient: 'bg-gradient-neutral',
        text: 'text-gradient-neutral',
        glow: 'hover:shadow-neutral-start/20'
      };
  }
};

interface ActivityCardProps {
  activity: Activity;
  onEdit?: () => void;
  onDelete?: () => void;
}

export default function ActivityCard({ activity, onEdit, onDelete }: ActivityCardProps) {
  const [showCompletion, setShowCompletion] = useState(false);
  const { toast } = useToast();

  const Icon = activityIcons[activity.type as keyof typeof activityIcons] || Star;
  const categoryStyles = getActivityGradient(activity.type);

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

  return (
    <>
      <Card 
        className={cn(
          "group hover-lift glass noise overflow-hidden transition-smooth",
          categoryStyles.rail,
          categoryStyles.glow
        )}
        data-testid={`card-activity-${activity.id}`}
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3 flex-1 min-w-0">
              {activity.imageUrl ? (
                <div className="relative w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
                  <img
                    src={activity.imageUrl}
                    alt={activity.title}
                    className="w-full h-full object-cover"
                  />
                  <div className={cn("absolute inset-0 bg-gradient-to-t from-black/60 to-transparent", categoryStyles.gradient, "opacity-30")} />
                </div>
              ) : (
                <div className={cn("w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0", categoryStyles.gradient)}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h3 className="font-display font-semibold text-white truncate">{activity.title}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className={cn("text-xs capitalize", categoryStyles.text)}>
                    {activity.type}
                  </Badge>
                  {activity.category && (
                    <Badge variant="secondary" className="text-xs bg-graphite/50">
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
                  className="opacity-0 group-hover:opacity-100 transition-smooth h-8 w-8 p-0"
                  data-testid={`button-more-${activity.id}`}
                >
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="glass border-slate/50">
                <DropdownMenuItem onClick={onEdit} data-testid={`button-edit-${activity.id}`}>
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleComplete} data-testid={`button-complete-${activity.id}`}>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Mark Complete
                </DropdownMenuItem>
                <DropdownMenuItem data-testid={`button-review-${activity.id}`}>
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Write Review
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={onDelete} 
                  className="text-destructive"
                  data-testid={`button-delete-${activity.id}`}
                >
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
              data-testid={`status-${activity.id}`}
            >
              {activity.status === 'in_progress' ? 'In Progress' : 
               activity.status === 'on_hold' ? 'On Hold' : 
               activity.status.charAt(0).toUpperCase() + activity.status.slice(1)}
            </Badge>
            {activity.status === 'completed' && (
              <Trophy className="w-4 h-4 text-warning" />
            )}
          </div>

          {/* Progress Bar */}
          {activity.progress !== null && activity.progress > 0 && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-silver">Progress</span>
                <span className="text-white font-mono">{activity.progress}%</span>
              </div>
              <Progress value={activity.progress} className={cn("h-2", categoryStyles.gradient)} />
            </div>
          )}

          {/* Rating */}
          {activity.rating && (
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 fill-warning text-warning" />
              <span className="text-sm text-white font-mono">{activity.rating}/5</span>
            </div>
          )}

          {/* Time Tracking */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-silver">
              <Clock className="w-4 h-4" />
              <span className="font-mono">{activity.totalHours || 0}h logged</span>
            </div>
            <TimerButton 
              activityId={activity.id} 
              activityTitle={activity.title}
              size="sm"
              showTimeDisplay={false}
            />
          </div>

          {/* Description */}
          {activity.description && (
            <p className="text-sm text-silver line-clamp-2">
              {activity.description}
            </p>
          )}

          {/* Tags */}
          {activity.tags && activity.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {activity.tags.slice(0, 3).map((tag, index) => (
                <Badge key={index} variant="secondary" className="text-xs bg-graphite/50 border-slate/30">
                  {tag}
                </Badge>
              ))}
              {activity.tags.length > 3 && (
                <Badge variant="secondary" className="text-xs bg-graphite/50 border-slate/30">
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
