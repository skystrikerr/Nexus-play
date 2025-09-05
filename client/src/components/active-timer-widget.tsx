import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, Square, Activity, AlertCircle } from "lucide-react";
import { useTimer } from "@/hooks/useTimer";
import { useQuery } from "@tanstack/react-query";
import { TimerButton } from "./timer-button";
import type { Activity as ActivityType } from "@shared/schema";

interface ActiveTimerWidgetProps {
  className?: string;
}

export function ActiveTimerWidget({ className }: ActiveTimerWidgetProps) {
  const { activeTimer, formattedElapsedTime, isLoading } = useTimer();

  // Fetch activity details if there's an active timer
  const { data: activities } = useQuery<ActivityType[]>({
    queryKey: ['/api/activities'],
    enabled: !!activeTimer,
  });

  if (isLoading) {
    return (
      <Card className={`bg-slate-800/50 border-slate-700 ${className}`}>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin w-6 h-6 border-2 border-purple-400 border-t-transparent rounded-full"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!activeTimer) {
    return (
      <Card className={`bg-slate-800/50 border-slate-700 ${className}`}>
        <CardHeader className="pb-3">
          <CardTitle className="text-white flex items-center gap-2">
            <Clock className="h-5 w-5 text-gray-400" />
            Timer
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center py-6">
            <AlertCircle className="h-12 w-12 text-gray-500 mx-auto mb-3" />
            <div className="text-gray-400 text-sm">No timer running</div>
            <div className="text-gray-500 text-xs mt-1">
              Start a timer from any activity card
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const currentActivity = activities?.find(a => a.id === activeTimer.activityId);

  return (
    <Card className={`bg-slate-800/50 border-slate-700 border-green-500/30 ${className}`}>
      <CardHeader className="pb-3">
        <CardTitle className="text-white flex items-center gap-2">
          <Clock className="h-5 w-5 text-green-400 animate-pulse" />
          Timer Running
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Activity Info */}
        <div className="flex items-center gap-3">
          {currentActivity?.imageUrl ? (
            <img
              src={currentActivity.imageUrl}
              alt={currentActivity.title}
              className="w-12 h-12 rounded-lg object-cover"
            />
          ) : (
            <div className="w-12 h-12 rounded-lg bg-slate-700 flex items-center justify-center">
              <Activity className="w-6 h-6 text-slate-300" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-white truncate">
              {currentActivity?.title || 'Unknown Activity'}
            </h4>
            {currentActivity && (
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className="text-xs capitalize">
                  {currentActivity.type}
                </Badge>
                {currentActivity.category && (
                  <Badge variant="secondary" className="text-xs">
                    {currentActivity.category}
                  </Badge>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Timer Display */}
        <div className="text-center py-4">
          <div className="text-3xl font-mono font-bold text-green-400 mb-2">
            {formattedElapsedTime}
          </div>
          <div className="text-sm text-gray-400">
            Started {new Date(activeTimer.startTime).toLocaleTimeString([], { 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
          </div>
        </div>

        {/* Stop Button */}
        <div className="flex justify-center">
          <TimerButton 
            activityId={activeTimer.activityId}
            activityTitle={currentActivity?.title || 'Activity'}
            variant="destructive"
            size="default"
            className="w-full"
          />
        </div>
      </CardContent>
    </Card>
  );
}