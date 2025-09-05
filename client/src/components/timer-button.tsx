import { Button } from "@/components/ui/button";
import { Play, Square, Clock, Loader2 } from "lucide-react";
import { useTimer } from "@/hooks/useTimer";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface TimerButtonProps {
  activityId: string;
  activityTitle: string;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg";
  className?: string;
  showTimeDisplay?: boolean;
}

export function TimerButton({ 
  activityId, 
  activityTitle, 
  variant = "outline", 
  size = "sm",
  className,
  showTimeDisplay = false
}: TimerButtonProps) {
  const { 
    activeTimer, 
    formattedElapsedTime, 
    startTimer, 
    stopTimer, 
    isStarting, 
    isStopping 
  } = useTimer();
  const { toast } = useToast();

  const isActiveForThisActivity = activeTimer?.activityId === activityId;
  const hasActiveTimer = !!activeTimer;
  const canStart = !hasActiveTimer;
  const canStop = isActiveForThisActivity;

  const handleStart = async () => {
    try {
      await startTimer(activityId);
      toast({
        title: "Timer Started",
        description: `Started tracking time for ${activityTitle}`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to start timer",
        variant: "destructive",
      });
    }
  };

  const handleStop = async () => {
    try {
      await stopTimer(activityId);
      toast({
        title: "Timer Stopped",
        description: `Session saved for ${activityTitle}`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to stop timer",
        variant: "destructive",
      });
    }
  };

  const isLoading = isStarting || isStopping;

  if (showTimeDisplay && isActiveForThisActivity) {
    return (
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1 px-2 py-1 bg-green-500/10 text-green-400 rounded text-sm font-mono">
          <Clock className="h-3 w-3 animate-pulse" />
          {formattedElapsedTime}
        </div>
        <Button
          onClick={handleStop}
          disabled={isLoading}
          variant={variant}
          size={size}
          className={cn(
            "text-red-400 border-red-500/30 hover:bg-red-500/10 hover:border-red-500/50",
            className
          )}
          data-testid={`button-stop-timer-${activityId}`}
        >
          {isStopping ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Square className="h-4 w-4" />
          )}
          {size !== "sm" && <span className="ml-1">Stop</span>}
        </Button>
      </div>
    );
  }

  if (canStop) {
    return (
      <Button
        onClick={handleStop}
        disabled={isLoading}
        variant={variant}
        size={size}
        className={cn(
          "text-red-400 border-red-500/30 hover:bg-red-500/10 hover:border-red-500/50",
          className
        )}
        data-testid={`button-stop-timer-${activityId}`}
      >
        {isStopping ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Square className="h-4 w-4" />
        )}
        {size !== "sm" && <span className="ml-1">Stop</span>}
      </Button>
    );
  }

  if (canStart) {
    return (
      <Button
        onClick={handleStart}
        disabled={isLoading}
        variant={variant}
        size={size}
        className={cn(
          "text-green-400 border-green-500/30 hover:bg-green-500/10 hover:border-green-500/50",
          className
        )}
        data-testid={`button-start-timer-${activityId}`}
      >
        {isStarting ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Play className="h-4 w-4" />
        )}
        {size !== "sm" && <span className="ml-1">Start</span>}
      </Button>
    );
  }

  // Another activity has an active timer
  return (
    <Button
      disabled
      variant="ghost"
      size={size}
      className={cn("text-gray-500 cursor-not-allowed", className)}
      title="Stop the current timer to start a new one"
      data-testid={`button-timer-disabled-${activityId}`}
    >
      <Clock className="h-4 w-4" />
      {size !== "sm" && <span className="ml-1">Timer</span>}
    </Button>
  );
}