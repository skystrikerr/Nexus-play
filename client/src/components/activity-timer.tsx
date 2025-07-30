import { useState, useEffect, useRef } from "react";
import { Play, Pause, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Activity, InsertSession } from "@shared/schema";

interface ActivityTimerProps {
  activity: Activity;
  variant?: "small" | "large";
}

export default function ActivityTimer({ activity, variant = "small" }: ActivityTimerProps) {
  const [isActive, setIsActive] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [showEndDialog, setShowEndDialog] = useState(false);
  const [notes, setNotes] = useState("");
  const [quality, setQuality] = useState<number>(5);
  const [location, setLocation] = useState("");
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<Date | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const createSessionMutation = useMutation({
    mutationFn: (data: InsertSession) => 
      apiRequest("POST", "/api/sessions", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sessions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({
        title: "Session Saved",
        description: `${formatTime(seconds)} session recorded for ${activity.title}`,
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save session",
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    if (isActive) {
      intervalRef.current = setInterval(() => {
        setSeconds(prevSeconds => prevSeconds + 1);
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isActive]);

  const formatTime = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const startTimer = () => {
    setIsActive(true);
    startTimeRef.current = new Date();
  };

  const pauseTimer = () => {
    setIsActive(false);
  };

  const stopTimer = () => {
    setIsActive(false);
    if (seconds > 0) {
      setShowEndDialog(true);
    } else {
      resetTimer();
    }
  };

  const resetTimer = () => {
    setSeconds(0);
    setNotes("");
    setQuality(5);
    setLocation("");
    startTimeRef.current = null;
  };

  const saveSession = () => {
    if (seconds > 0 && startTimeRef.current) {
      const duration = seconds / 3600; // Convert to hours
      const sessionData: InsertSession = {
        activityId: activity.id,
        date: startTimeRef.current.toISOString().split('T')[0],
        duration,
        notes: notes.trim() || undefined,
        quality: quality || undefined,
        location: location.trim() || undefined,
      };

      createSessionMutation.mutate(sessionData);
    }
    setShowEndDialog(false);
    resetTimer();
  };

  const cancelSave = () => {
    setShowEndDialog(false);
    resetTimer();
  };

  if (variant === "small") {
    return (
      <>
        <div className="flex items-center space-x-1">
          {!isActive && seconds === 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                startTimer();
              }}
              className="h-8 w-8 p-0 hover:bg-primary/20 hover:text-primary"
              title={`Start timer for ${activity.title}`}
            >
              <Play className="w-4 h-4" />
            </Button>
          )}
          
          {isActive && (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  pauseTimer();
                }}
                className="h-8 w-8 p-0 hover:bg-yellow-500/20 hover:text-yellow-400"
                title="Pause timer"
              >
                <Pause className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  stopTimer();
                }}
                className="h-8 w-8 p-0 hover:bg-red-500/20 hover:text-red-400"
                title="Stop and save session"
              >
                <Square className="w-4 h-4" />
              </Button>
            </>
          )}
          
          {!isActive && seconds > 0 && (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  startTimer();
                }}
                className="h-8 w-8 p-0 hover:bg-primary/20 hover:text-primary"
                title="Resume timer"
              >
                <Play className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  stopTimer();
                }}
                className="h-8 w-8 p-0 hover:bg-red-500/20 hover:text-red-400"
                title="Stop and save session"
              >
                <Square className="w-4 h-4" />
              </Button>
            </>
          )}
          
          {(isActive || seconds > 0) && (
            <span className="text-xs font-mono text-slate-300 min-w-[40px]">
              {formatTime(seconds)}
            </span>
          )}
        </div>

        <Dialog open={showEndDialog} onOpenChange={setShowEndDialog}>
          <DialogContent className="bg-dark-surface border-slate-700">
            <DialogHeader>
              <DialogTitle className="text-white">Session Complete</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <p className="text-slate-300 mb-2">
                  You spent <span className="font-semibold text-primary">{formatTime(seconds)}</span> on{" "}
                  <span className="font-semibold text-white">{activity.title}</span>
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="quality" className="text-slate-300">Quality (1-5)</Label>
                <Input
                  id="quality"
                  type="number"
                  min="1"
                  max="5"
                  value={quality}
                  onChange={(e) => setQuality(parseInt(e.target.value) || 5)}
                  className="bg-dark-bg border-slate-600 text-white"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="location" className="text-slate-300">Location (optional)</Label>
                <Input
                  id="location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g., Home, Office, Library"
                  className="bg-dark-bg border-slate-600 text-white"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes" className="text-slate-300">Notes (optional)</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="How did this session go?"
                  className="bg-dark-bg border-slate-600 text-white"
                  rows={3}
                />
              </div>

              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={cancelSave}
                  className="border-slate-600 text-slate-300 hover:bg-slate-700"
                >
                  Discard
                </Button>
                <Button
                  onClick={saveSession}
                  disabled={createSessionMutation.isPending}
                  className="bg-primary hover:bg-primary/80 text-white"
                >
                  {createSessionMutation.isPending ? "Saving..." : "Save Session"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  // Large variant could be used for dedicated timer page in the future
  return null;
}