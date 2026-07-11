import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, Clock, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/queryClient";
import { cn } from "@/lib/utils";
import CalendarDayModal from "./calendar-day-modal";
import type { ActivitySession } from "@shared/schema";

export default function ActivityCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [showDayModal, setShowDayModal] = useState(false);

  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();
  const today = new Date();

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
      <h3 className="text-lg font-display font-semibold text-foreground mb-4">Activity Calendar</h3>

      <div className="glass rounded-xl p-6">
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
        
        <div className="grid grid-cols-7 gap-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="text-center text-sm font-medium text-slate-400 pb-2">
              {day}
            </div>
          ))}
          
          {calendarDays.map((day, index) => {
            if (day === null) {
              return <div key={`empty-${index}`} className="h-16"></div>;
            }
            
            const isToday = day === today.getDate() && 
                           currentMonth === today.getMonth() && 
                           currentYear === today.getFullYear();
            const daySessions = getSessionsForDate(day);
            const totalHours = getTotalHoursForDate(day);
            const hasActivity = daySessions.length > 0;
            
            return (
              <div
                key={`day-${day}`}
                onClick={() => handleDayClick(day)}
                className={cn(
                  "h-16 p-2 rounded-lg border border-border/60 bg-muted/40 hover:bg-muted transition-colors relative cursor-pointer",
                  isToday && "ring-2 ring-primary",
                  hasActivity && "border-emerald-500/50"
                )}
              >
                <div className="text-sm text-white font-medium">{day}</div>
                {hasActivity && (
                  <div className="absolute bottom-1 left-1 right-1">
                    <div className="text-xs text-emerald-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>{totalHours.toFixed(1)}h</span>
                    </div>
                    <div className="text-xs text-slate-400">
                      {daySessions.length} session{daySessions.length > 1 ? 's' : ''}
                    </div>
                  </div>
                )}
                {!hasActivity && (
                  <div className="absolute bottom-1 left-1 right-1 text-xs text-slate-500 text-center">
                    <Plus className="w-3 h-3 mx-auto" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Calendar Day Modal */}
      <CalendarDayModal
        open={showDayModal}
        onOpenChange={setShowDayModal}
        selectedDate={selectedDate}
      />
    </div>
  );
}