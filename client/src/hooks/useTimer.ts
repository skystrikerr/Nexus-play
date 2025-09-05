import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

interface ActiveTimer {
  id: string;
  userId: string;
  activityId: string;
  startTime: string;
  createdAt: string;
}

export function useTimer() {
  const [elapsedTime, setElapsedTime] = useState(0);
  const queryClient = useQueryClient();

  // Query to get active timer
  const { data: activeTimer, isLoading } = useQuery<ActiveTimer | null>({
    queryKey: ['/api/timer'],
    refetchInterval: 5000, // Refetch every 5 seconds to stay synced
  });

  // Start timer mutation
  const startTimerMutation = useMutation({
    mutationFn: async (activityId: string) => {
      const response = await apiRequest('POST', '/api/timer/start', { activityId });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/timer'] });
      queryClient.invalidateQueries({ queryKey: ['/api/sessions'] });
    },
  });

  // Stop timer mutation
  const stopTimerMutation = useMutation({
    mutationFn: async (activityId: string) => {
      const response = await apiRequest('POST', '/api/timer/stop', { activityId });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/timer'] });
      queryClient.invalidateQueries({ queryKey: ['/api/sessions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/stats'] });
      setElapsedTime(0);
    },
  });

  // Calculate elapsed time
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (activeTimer) {
      const updateElapsedTime = () => {
        const startTime = new Date(activeTimer.startTime).getTime();
        const now = Date.now();
        const elapsed = Math.floor((now - startTime) / 1000); // seconds
        setElapsedTime(elapsed);
      };

      // Update immediately
      updateElapsedTime();
      
      // Update every second
      interval = setInterval(updateElapsedTime, 1000);
    } else {
      setElapsedTime(0);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [activeTimer]);

  // Format elapsed time as HH:MM:SS
  const formatElapsedTime = useCallback((seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, []);

  return {
    activeTimer,
    isLoading,
    elapsedTime,
    formattedElapsedTime: formatElapsedTime(elapsedTime),
    startTimer: startTimerMutation.mutate,
    stopTimer: stopTimerMutation.mutate,
    isStarting: startTimerMutation.isPending,
    isStopping: stopTimerMutation.isPending,
  };
}