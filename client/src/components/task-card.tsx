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
  wishlist: { color: "bg-purple-500/20 text-purple-400", label: "Planned" },
  in_progress: { color: "bg-blue-500/20 text-blue-400", label: "In Progress" },
  completed: { color: "bg-green-500/20 text-green-400", label: "Completed" },
  on_hold: { color: "bg-orange-500/20 text-orange-400", label: "On Hold" },
  dropped: { color: "bg-red-500/20 text-red-400", label: "Cancelled" },
};

export default function TaskCard({ task, onClick, variant = "default" }: TaskCardProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showTimeLogModal, setShowTimeLogModal] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const timeSpent = task.totalHours || 0;

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
      <div className="flex items-center gap-3 p-3 bg-slate-800 rounded-lg border border-slate-700 hover:border-slate-600 transition-colors">
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0"
          onClick={(e) => {
            e.stopPropagation();
            toggleStatusMutation.mutate();
          }}
        >
          {task.status === "completed" ? (
            <CheckCircle className="w-5 h-5 text-green-400" />
          ) : (
            <Circle className="w-5 h-5 text-slate-400" />
          )}
        </Button>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className={cn(
              "text-sm font-medium truncate",
              task.status === "completed" ? "text-slate-400 line-through" : "text-white"
            )}>
              {task.title}
            </p>
            {timeSpent > 0 && (
              <Badge variant="outline" className="text-xs bg-cyan-500/20 text-cyan-400">
                <Clock className="w-3 h-3 mr-1" />
                {timeSpent.toFixed(1)}h
              </Badge>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild data-dropdown-trigger>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-slate-400">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-slate-800 border-slate-600">
              <DropdownMenuItem onClick={() => onClick?.()} className="text-slate-300 hover:text-white">
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleDeleteClick} className="text-red-400 hover:text-red-300">
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
        className="bg-slate-900 rounded-xl p-6 border border-slate-700 hover:border-slate-600 transition-colors cursor-pointer relative group"
        onClick={handleCardClick}
      >
        {/* Action Menu */}
        <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
          <DropdownMenu>
            <DropdownMenuTrigger asChild data-dropdown-trigger>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-slate-400 hover:text-white hover:bg-slate-700"
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-slate-800 border-slate-600">
              <DropdownMenuItem 
                className="text-slate-300 hover:text-white hover:bg-slate-700 cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  onClick?.();
                }}
              >
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem 
                className="text-red-400 hover:text-red-300 hover:bg-red-900/20 cursor-pointer"
                onClick={handleDeleteClick}
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
              >
                {task.status === "completed" ? (
                  <CheckCircle className="w-6 h-6 text-green-400" />
                ) : (
                  <Circle className="w-6 h-6 text-slate-400 hover:text-blue-400" />
                )}
              </Button>
              
              <div>
                <h3 className={cn(
                  "text-lg font-semibold",
                  task.status === "completed" ? "text-slate-400 line-through" : "text-white"
                )}>
                  {task.title}
                </h3>
                <div className="flex items-center gap-2 mt-1">
                  {timeSpent > 0 && (
                    <Badge variant="outline" className="text-xs bg-cyan-500/20 text-cyan-400">
                      <Clock className="w-3 h-3 mr-1" />
                      {timeSpent.toFixed(1)}h spent
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
            <p className="text-slate-300 text-sm line-clamp-2">{task.description}</p>
          )}

          {/* Progress */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-400">Progress</span>
              <span className="text-sm font-medium text-white">{task.progress}%</span>
            </div>
            <Progress value={task.progress} className="h-2" />
          </div>

          {/* Footer Info */}
          <div className="flex items-center justify-between text-sm text-slate-400">
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              <span>{timeSpent.toFixed(1)}h logged</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                setShowTimeLogModal(true);
              }}
              className="text-xs border-slate-600 text-slate-300 hover:bg-slate-700"
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
        <AlertDialogContent className="bg-slate-900 border-slate-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Delete Task</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400">
              Are you sure you want to delete "{task.title}"? This will also remove all associated sessions and cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-slate-600 text-slate-300 hover:bg-slate-700">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700 text-white"
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