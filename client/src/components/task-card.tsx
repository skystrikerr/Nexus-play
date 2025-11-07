import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Clock, 
  CheckCircle, 
  Circle, 
  MoreVertical, 
  Edit, 
  Trash2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import TimeLogModal from "./time-log-modal";
import type { Activity } from "@shared/schema";

interface TaskCardProps {
  task: Activity;
  onClick?: () => void;
  variant?: "default" | "compact";
}

const statusConfig = {
  wishlist: { color: "bg-info/20 text-info border-info/30", label: "Planned" },
  in_progress: { color: "bg-warning/20 text-warning border-warning/30", label: "In Progress" },
  completed: { color: "bg-success/20 text-success border-success/30", label: "Completed" },
  on_hold: { color: "bg-silver/20 text-silver border-silver/30", label: "On Hold" },
  dropped: { color: "bg-destructive/20 text-destructive border-destructive/30", label: "Cancelled" },
};

const getTaskGradient = (type: string) => {
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

export default function TaskCard({ task, onClick, variant = "default" }: TaskCardProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showTimeLogModal, setShowTimeLogModal] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const timeSpent = task.totalHours || 0;
  const categoryStyles = getTaskGradient(task.type);

  const deleteTaskMutation = useMutation({
    mutationFn: () => apiRequest("DELETE", `/api/activities/${task.id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/activities"] });
      queryClient.invalidateQueries({ queryKey: ["/api/games"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({
        title: "Task Deleted",
        description: "The task has been removed from your list.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete task. Please try again.",
        variant: "destructive",
      });
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: () => {
      const newStatus = task.status === "completed" ? "in_progress" : "completed";
      const newProgress = newStatus === "completed" ? 100 : task.progress;
      return apiRequest("PUT", `/api/activities/${task.id}`, { 
        status: newStatus,
        progress: newProgress
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/activities"] });
      queryClient.invalidateQueries({ queryKey: ["/api/games"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({
        title: task.status === "completed" ? "Task Reopened" : "Task Completed",
        description: task.status === "completed" ? "Task marked as in progress." : "Great job completing this task!",
      });
    },
  });

  const handleCardClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('[data-dropdown-trigger]') || 
        (e.target as HTMLElement).closest('button')) {
      return;
    }
    onClick?.();
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDeleteDialog(true);
  };

  const confirmDelete = () => {
    deleteTaskMutation.mutate();
    setShowDeleteDialog(false);
  };


  if (variant === "compact") {
    return (
      <div 
        className={cn(
          "flex items-center gap-3 p-3 glass noise rounded-lg border-slate/30 hover:border-slate/50 transition-smooth",
          categoryStyles.rail,
          categoryStyles.glow
        )}
        data-testid={`card-task-${task.id}`}
      >
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0"
          onClick={(e) => {
            e.stopPropagation();
            toggleStatusMutation.mutate();
          }}
          data-testid={`button-toggle-${task.id}`}
        >
          {task.status === "completed" ? (
            <CheckCircle className="w-5 h-5 text-success" />
          ) : (
            <Circle className="w-5 h-5 text-silver" />
          )}
        </Button>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className={cn(
              "text-sm font-medium truncate",
              task.status === "completed" ? "text-silver line-through" : "text-white"
            )}>
              {task.title}
            </p>
            {timeSpent > 0 && (
              <Badge variant="outline" className={cn("text-xs", categoryStyles.text, "border-transparent")}>
                <Clock className="w-3 h-3 mr-1" />
                <span className="font-mono">{timeSpent.toFixed(1)}h</span>
              </Badge>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild data-dropdown-trigger>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-silver">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="glass border-slate/50">
              <DropdownMenuItem onClick={() => onClick?.()} className="text-white">
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleDeleteClick} className="text-destructive">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    );
  }

  return (
    <>
      <div 
        className={cn(
          "glass noise rounded-xl p-6 border-slate/30 hover:border-slate/50 transition-smooth cursor-pointer relative group hover-lift",
          categoryStyles.rail,
          categoryStyles.glow
        )}
        onClick={handleCardClick}
        data-testid={`card-task-${task.id}`}
      >
        {/* Action Menu */}
        <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-smooth">
          <DropdownMenu>
            <DropdownMenuTrigger asChild data-dropdown-trigger>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-silver hover:text-white hover:bg-graphite"
                data-testid={`button-more-${task.id}`}
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="glass border-slate/50">
              <DropdownMenuItem 
                className="text-white hover:bg-graphite cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  onClick?.();
                }}
                data-testid={`button-edit-${task.id}`}
              >
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem 
                className="text-destructive hover:bg-destructive/10 cursor-pointer"
                onClick={handleDeleteClick}
                data-testid={`button-delete-${task.id}`}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleStatusMutation.mutate();
                }}
                data-testid={`button-toggle-${task.id}`}
              >
                {task.status === "completed" ? (
                  <CheckCircle className="w-6 h-6 text-success" />
                ) : (
                  <Circle className="w-6 h-6 text-silver hover:text-primary" />
                )}
              </Button>
              
              <div>
                <h3 className={cn(
                  "text-lg font-display font-semibold",
                  task.status === "completed" ? "text-silver line-through" : "text-white"
                )}>
                  {task.title}
                </h3>
                <div className="flex items-center gap-2 mt-1">
                  {timeSpent > 0 && (
                    <Badge variant="outline" className={cn("text-xs", categoryStyles.text, "border-transparent")}>
                      <Clock className="w-3 h-3 mr-1" />
                      <span className="font-mono">{timeSpent.toFixed(1)}h spent</span>
                    </Badge>
                  )}
                  <Badge variant="outline" className={cn("text-xs", statusConfig[task.status as keyof typeof statusConfig]?.color)}>
                    {statusConfig[task.status as keyof typeof statusConfig]?.label}
                  </Badge>
                </div>
              </div>
            </div>
          </div>

          {/* Description */}
          {task.description && (
            <p className="text-white text-sm line-clamp-2">{task.description}</p>
          )}

          {/* Progress */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-silver">Progress</span>
              <span className="text-sm font-mono font-semibold text-white">{task.progress}%</span>
            </div>
            <Progress value={task.progress} className={cn("h-2", categoryStyles.gradient)} />
          </div>

          {/* Footer Info */}
          <div className="flex items-center justify-between text-sm text-silver">
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              <span className="font-mono">{timeSpent.toFixed(1)}h logged</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                setShowTimeLogModal(true);
              }}
              className="text-xs border-slate/30 text-silver hover:bg-graphite hover:border-slate/50"
              data-testid={`button-log-time-${task.id}`}
            >
              + Log Time
            </Button>
          </div>

        </div>
      </div>

      {/* Time Log Modal */}
      <TimeLogModal
        open={showTimeLogModal}
        onOpenChange={setShowTimeLogModal}
        task={task}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="glass border-slate/50">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white font-display">Delete Task</AlertDialogTitle>
            <AlertDialogDescription className="text-silver">
              Are you sure you want to delete "{task.title}"? This will also remove all associated sessions and cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-slate/30 text-silver hover:bg-graphite">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete}
              className="bg-destructive hover:bg-destructive/90 text-white"
              disabled={deleteTaskMutation.isPending}
            >
              {deleteTaskMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
