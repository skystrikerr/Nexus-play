import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/queryClient";
import { cn } from "@/lib/utils";
import CalendarDayModal from "./calendar-day-modal";
import type { ActivitySession, Activity } from "@shared/schema";

export default function GamingCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [showDayModal, setShowDayModal] = useState(false);

  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();
  const today = new Date();
  const todayDateString = today.toISOString().split('T')[0];

  // Get sessions for current month
  const startDate = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-01`;
  const endDate = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-31`;

  const { data: sessions = [] } = useQuery<ActivitySession[]>({
    queryKey: ["/api/sessions", "dateRange", startDate, endDate],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/sessions?startDate=${startDate}&endDate=${endDate}`);
      return await response.json();
    },
  });

  // Get activities for today's sessions
  const { data: activities = [] } = useQuery<Activity[]>({
    queryKey: ["/api/activities"],
  });

  // Get today's sessions
  const todaySessions = sessions.filter(session => session.date === todayDateString);

  // Calendar grid generation
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
  const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);
  const startingDayOfWeek = firstDayOfMonth.getDay();
  const daysInMonth = lastDayOfMonth.getDate();

  const calendarDays = [];
  
  // Add empty cells for days before month starts
  for (let i = 0; i < startingDayOfWeek; i++) {
    calendarDays.push(null);
  }
  
  // Add days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(day);
  }

  const getSessionsForDate = (day: number) => {
    const dateString = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return sessions.filter(session => session.date === dateString);
  };

  const getTotalHoursForDate = (day: number) => {
    const daySessions = getSessionsForDate(day);
    return daySessions.reduce((total, session) => total + (session.duration || 0), 0);
  };

  const handleDayClick = (day: number) => {
    const dateString = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    setSelectedDate(dateString);
    setShowDayModal(true);
  };

  const previousMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth - 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth + 1));
  };

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  return (
    <div>
      <h3 className="text-xl font-bold text-white mb-6">Gaming Calendar</h3>
      
      <div className="bg-dark-surface rounded-xl p-6 border border-slate-700">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-lg font-semibold text-white">
            {monthNames[currentMonth]} {currentYear}
          </h4>
          <div className="flex space-x-2">
            <Button
              variant="ghost"
              size="sm"
              className="p-2 hover:bg-slate-700"
              onClick={previousMonth}
            >
              <ChevronLeft className="w-4 h-4 text-slate-400" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="p-2 hover:bg-slate-700"
              onClick={nextMonth}
            >
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </Button>
          </div>
        </div>
        
        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {["S", "M", "T", "W", "T", "F", "S"].map((day, index) => (
            <div key={`weekday-${index}`} className="text-center text-xs text-slate-400 py-2 font-medium">
              {day}
            </div>
          ))}
        </div>
        
        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map((day, index) => {
            if (day === null) {
              return <div key={`empty-${index}`} className="aspect-square" />;
            }

            const daySessions = getSessionsForDate(day);
            const isToday = today.getDate() === day && 
                           today.getMonth() === currentMonth && 
                           today.getFullYear() === currentYear;

            return (
              <div
                key={`day-${day}`}
                className={`aspect-square flex items-center justify-center text-sm relative ${
                  isToday 
                    ? "bg-primary text-white rounded-lg font-medium" 
                    : "text-slate-300"
                }`}
              >
                {day}
                {daySessions.length > 0 && (
                  <div className="absolute bottom-1 w-1 h-1 bg-primary rounded-full" />
                )}
              </div>
            );
          })}
        </div>
        
        <div className="mt-4 pt-4 border-t border-slate-700">
          <h5 className="text-sm font-medium text-white mb-2">Today's Sessions</h5>
          <div className="space-y-2">
            {todaySessions.length > 0 ? (
              todaySessions.map((session) => {
                const activity = activities.find(a => a.id === session.activityId);
                return (
                  <div key={session.id} className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-primary rounded-full" />
                    <span className="text-sm text-slate-300">
                      {activity?.title || "Unknown Activity"}
                    </span>
                    <span className="text-xs text-slate-500 flex items-center">
                      <Clock className="w-3 h-3 mr-1" />
                      {session.duration}h
                    </span>
                  </div>
                );
              })
            ) : (
              <p className="text-sm text-slate-500">No sessions today</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
