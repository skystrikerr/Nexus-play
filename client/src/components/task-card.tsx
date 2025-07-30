import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Clock, 
  Calendar, 
  CheckCircle, 
  Circle, 
  MoreVertical, 
  Edit, 
  Trash2, 
  Play, 
  Pause,
  AlertCircle,
  Target,
  TrendingUp
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
// import ActivityTimer from "./activity-timer";
import type { Activity } from "@shared/schema";

interface TaskCardProps {
  task: Activity;
  onClick?: () => void;
  variant?: "default" | "compact";
}

const priorityConfig = {
  low: { color: "bg-slate-500/20 text-slate-400 border-slate-500/20", icon: Circle },
  medium: { color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/20", icon: AlertCircle },
  high: { color: "bg-red-500/20 text-red-400 border-red-500/20", icon: Target },
};

const statusConfig = {
  wishlist: { color: "bg-purple-500/20 text-purple-400", label: "Planned" },
  in_progress: { color: "bg-blue-500/20 text-blue-400", label: "In Progress" },
  completed: { color: "bg-green-500/20 text-green-400", label: "Completed" },
  on_hold: { color: "bg-orange-500/20 text-orange-400", label: "On Hold" },
  dropped: { color: "bg-red-500/20 text-red-400", label: "Cancelled" },
};

const typeConfig = {
  work: { color: "bg-blue-500/20 text-blue-400", label: "Work" },
  study: { color: "bg-green-500/20 text-green-400", label: "Study" },
  other: { color: "bg-purple-500/20 text-purple-400", label: "Personal" },
};

export default function TaskCard({ task, onClick, variant = "default" }: TaskCardProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const priority = (task.metadata as any)?.priority || "medium";
  const dueDate = (task.metadata as any)?.dueDate;
  const estimatedHours = (task.metadata as any)?.estimatedHours;
  const PriorityIcon = priorityConfig[priority as keyof typeof priorityConfig]?.icon || Circle;

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

  const isOverdue = dueDate && new Date(dueDate) < new Date() && task.status !== "completed";
  const isDueSoon = dueDate && new Date(dueDate) <= new Date(Date.now() + 24 * 60 * 60 * 1000) && task.status !== "completed";

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
            <Badge variant="outline" className={cn("text-xs", priorityConfig[priority as keyof typeof priorityConfig]?.color)}>
              {priority}
            </Badge>
          </div>
          {dueDate && (
            <p className={cn(
              "text-xs mt-1",
              isOverdue ? "text-red-400" : isDueSoon ? "text-yellow-400" : "text-slate-400"
            )}>
              Due {new Date(dueDate).toLocaleDateString()}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* <ActivityTimer activity={task} variant="mini" /> */}
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
                  <Badge variant="outline" className={cn("text-xs", typeConfig[task.type as keyof typeof typeConfig]?.color)}>
                    {typeConfig[task.type as keyof typeof typeConfig]?.label}
                  </Badge>
                  <Badge variant="outline" className={cn("text-xs", priorityConfig[priority as keyof typeof priorityConfig]?.color)}>
                    <PriorityIcon className="w-3 h-3 mr-1" />
                    {priority} priority
                  </Badge>
                  <Badge variant="outline" className={cn("text-xs", statusConfig[task.status as keyof typeof statusConfig]?.color)}>
                    {statusConfig[task.status as keyof typeof statusConfig]?.label}
                  </Badge>
                </div>
              </div>
            </div>

            {/* <ActivityTimer activity={task} variant="small" /> */}
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
            <div className="flex items-center gap-4">
              {estimatedHours && (
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  <span>{estimatedHours}h est.</span>
                </div>
              )}
              <div className="flex items-center gap-1">
                <TrendingUp className="w-4 h-4" />
                <span>{task.totalHours}h logged</span>
              </div>
            </div>
            
            {dueDate && (
              <div className={cn(
                "flex items-center gap-1",
                isOverdue ? "text-red-400" : isDueSoon ? "text-yellow-400" : "text-slate-400"
              )}>
                <Calendar className="w-4 h-4" />
                <span>Due {new Date(dueDate).toLocaleDateString()}</span>
              </div>
            )}
          </div>

          {/* Tags */}
          {task.tags && task.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {task.tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="bg-slate-700 text-slate-300 text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </div>

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