import { Star, Clock, TrendingUp, MoreVertical, Trash2, Edit, CheckCircle, MessageSquare, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import ActivityTimer from "./activity-timer";
import CompletionModal from "./completion-modal";
import DateTimeLogModal from "./date-time-log-modal";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
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
import { Button } from "@/components/ui/button";
import type { Activity } from "@shared/schema";

interface GameCardProps {
  game: Activity;
  onClick?: () => void;
}

const statusColors = {
  in_progress: "bg-primary/20 text-primary",
  completed: "bg-green-500/20 text-green-400",
  dropped: "bg-red-500/20 text-red-400",
  wishlist: "bg-yellow-500/20 text-yellow-400",
  on_hold: "bg-orange-500/20 text-orange-400",
};

const statusLabels = {
  in_progress: "In Progress",
  completed: "Completed",
  dropped: "Dropped",
  wishlist: "Wishlist",
  on_hold: "On Hold",
};

export default function GameCard({ game, onClick }: GameCardProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showCompletion, setShowCompletion] = useState(false);
  const [showTimeLog, setShowTimeLog] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const progressColor = 
    game.status === "completed" ? "bg-green-500" :
    game.status === "dropped" ? "bg-red-500" : 
    "bg-primary";

  const deleteGameMutation = useMutation({
    mutationFn: () => apiRequest("DELETE", `/api/activities/${game.id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/activities"] });
      queryClient.invalidateQueries({ queryKey: ["/api/games"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({
        title: "Game Deleted",
        description: "The game has been removed from your library.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete game. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleCardClick = (e: React.MouseEvent) => {
    // Prevent card click when clicking dropdown or delete actions
    if ((e.target as HTMLElement).closest('[data-dropdown-trigger]')) {
      return;
    }
    onClick?.();
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDeleteDialog(true);
  };

  const confirmDelete = () => {
    deleteGameMutation.mutate();
    setShowDeleteDialog(false);
  };

  return (
    <>
      <div 
        className="bg-card rounded-xl p-6 border border-border hover:border-border transition-colors cursor-pointer relative group"
        onClick={handleCardClick}
      >
        {/* Action Menu */}
        <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
          <DropdownMenu>
            <DropdownMenuTrigger asChild data-dropdown-trigger>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-muted-foreground hover:text-white hover:bg-muted"
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-slate-800 border-border">
              <DropdownMenuItem 
                className="text-muted-foreground hover:text-white hover:bg-muted cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  onClick?.();
                }}
              >
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem 
                className="text-muted-foreground hover:text-white hover:bg-muted cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowTimeLog(true);
                }}
              >
                <Plus className="mr-2 h-4 w-4" />
                Log Time
              </DropdownMenuItem>
              <DropdownMenuItem 
                className="text-muted-foreground hover:text-white hover:bg-muted cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowCompletion(true);
                }}
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                Mark Complete
              </DropdownMenuItem>
              <DropdownMenuItem 
                className="text-muted-foreground hover:text-white hover:bg-muted cursor-pointer"
              >
                <MessageSquare className="mr-2 h-4 w-4" />
                Write Review
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

        <div className="flex items-center space-x-4">
        {game.imageUrl ? (
          <img
            src={game.imageUrl}
            alt={`${game.title} cover`}
            className="w-16 h-20 rounded-lg object-cover"
          />
        ) : (
          <div className="w-16 h-20 rounded-lg bg-slate-700 flex items-center justify-center">
            <span className="text-muted-foreground text-xs">No Image</span>
          </div>
        )}
        
        <div className="flex-1">
          <div className="flex items-start justify-between">
            <div>
              <h4 className="text-lg font-semibold text-white">{game.title}</h4>
              <p className="text-muted-foreground text-sm">
                {game.category} {game.subcategory && `• ${game.subcategory}`}
              </p>
              
              <div className="flex items-center space-x-4 mt-2">
                {game.rating && (
                  <div className="flex items-center space-x-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={cn(
                          "w-4 h-4",
                          star <= game.rating! ? "text-yellow-400 fill-current" : "text-slate-600"
                        )}
                      />
                    ))}
                    <span className="text-muted-foreground text-sm ml-1">{game.rating}.0</span>
                  </div>
                )}
                
                <span className={cn("px-2 py-1 rounded-full text-xs font-medium", statusColors[game.status as keyof typeof statusColors])}>
                  {statusLabels[game.status as keyof typeof statusLabels]}
                </span>
              </div>
            </div>
            
            <div className="flex flex-col items-end space-y-2">
              <ActivityTimer activity={game} variant="small" />
              <div className="text-right">
                <p className="text-muted-foreground text-sm">Progress</p>
                <p className="text-white font-semibold">{game.progress}%</p>
                <p className="text-muted-foreground text-xs flex items-center">
                  <Clock className="w-3 h-3 mr-1" />
                  {game.totalHours}h total
                </p>
              </div>
            </div>
          </div>
          
          <div className="mt-3">
            <div className="w-full bg-slate-700 rounded-full h-2">
              <div 
                className={cn("h-2 rounded-full", progressColor)} 
                style={{ width: `${game.progress}%` }}
              />
            </div>
          </div>
        </div>
      </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="bg-slate-900 border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Delete Game</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              Are you sure you want to delete "{game.title}" from your library? This will also remove all associated sessions and cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-border text-muted-foreground hover:bg-muted">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700 text-white"
              disabled={deleteGameMutation.isPending}
            >
              {deleteGameMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Time Logging Modal */}
      <DateTimeLogModal 
        open={showTimeLog} 
        onOpenChange={setShowTimeLog}
        task={game}
        date={new Date().toISOString().split('T')[0]}
      />

      {/* Completion Modal */}
      <CompletionModal
        activity={game}
        isOpen={showCompletion}
        onClose={() => setShowCompletion(false)}
      />
    </>
  );
}
