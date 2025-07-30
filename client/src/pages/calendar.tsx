import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Menu } from "lucide-react";
import Sidebar from "@/components/sidebar";
import { useIsMobile } from "@/hooks/use-mobile";
import { format, parseISO, isSameDay, startOfDay, endOfDay } from "date-fns";
import { Clock, Calendar as CalendarIcon, Trophy, Target, Gamepad2, BookOpen, Briefcase, Activity, Star, MapPin } from "lucide-react";

interface Session {
  id: string;
  activityId: string;
  date: string;
  duration: number;
  notes?: string;
  quality?: number;
  location?: string;
  activity?: {
    title: string;
    type: string;
    category?: string;
    imageUrl?: string;
  };
}

interface Task {
  id: string;
  title: string;
  type: string;
  priority: string;
  dueDate?: string;
  status: string;
  estimatedHours?: number;
  completedAt?: string;
}

const getActivityIcon = (type: string) => {
  switch (type) {
    case 'game': return <Gamepad2 className="h-4 w-4" />;
    case 'study': return <BookOpen className="h-4 w-4" />;
    case 'work': return <Briefcase className="h-4 w-4" />;
    case 'exercise': return <Activity className="h-4 w-4" />;
    case 'reading': return <BookOpen className="h-4 w-4" />;
    default: return <Target className="h-4 w-4" />;
  }
};

const getActivityColor = (type: string) => {
  switch (type) {
    case 'game': return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
    case 'study': return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
    case 'work': return 'bg-green-500/20 text-green-300 border-green-500/30';
    case 'exercise': return 'bg-red-500/20 text-red-300 border-red-500/30';
    case 'reading': return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
    default: return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
  }
};

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'urgent': return 'bg-red-500/20 text-red-300 border-red-500/30';
    case 'high': return 'bg-orange-500/20 text-orange-300 border-orange-500/30';
    case 'medium': return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
    case 'low': return 'bg-green-500/20 text-green-300 border-green-500/30';
    default: return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
  }
};

export default function CalendarPage() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isMobile = useIsMobile();

  const { data: sessions = [] } = useQuery<Session[]>({
    queryKey: ["/api/sessions"],
  });

  const { data: tasks = [] } = useQuery<Task[]>({
    queryKey: ["/api/tasks"],
  });

  // Get sessions for selected date
  const selectedDateSessions = selectedDate 
    ? sessions.filter(session => {
        const sessionDate = parseISO(session.date);
        return isSameDay(sessionDate, selectedDate);
      })
    : [];

  // Get tasks for selected date (completed or due)
  const selectedDateTasks = selectedDate 
    ? tasks.filter(task => {
        // Include completed tasks on this date
        if (task.completedAt && isSameDay(parseISO(task.completedAt), selectedDate)) {
          return true;
        }
        // Include tasks due on this date
        if (task.dueDate && isSameDay(parseISO(task.dueDate), selectedDate)) {
          return true;
        }
        return false;
      })
    : [];

  // Calculate daily totals for calendar display
  const getDayData = (date: Date) => {
    const daySessions = sessions.filter(session => 
      isSameDay(parseISO(session.date), date)
    );
    const dayTasks = tasks.filter(task => {
      if (task.completedAt && isSameDay(parseISO(task.completedAt), date)) return true;
      if (task.dueDate && isSameDay(parseISO(task.dueDate), date)) return true;
      return false;
    });

    const totalHours = daySessions.reduce((sum, session) => sum + session.duration, 0);
    const completedTasks = dayTasks.filter(task => task.status === 'completed').length;
    
    return {
      totalHours: Math.round(totalHours * 10) / 10,
      sessionCount: daySessions.length,
      taskCount: dayTasks.length,
      completedTasks,
      hasActivity: daySessions.length > 0 || dayTasks.length > 0
    };
  };

  // Custom day content for calendar
  const dayContent = (date: Date) => {
    const data = getDayData(date);
    
    if (!data.hasActivity) return null;

    return (
      <div className="absolute bottom-0 left-0 right-0 p-1">
        <div className="flex justify-center space-x-1">
          {data.sessionCount > 0 && (
            <div className="w-1 h-1 bg-purple-400 rounded-full"></div>
          )}
          {data.completedTasks > 0 && (
            <div className="w-1 h-1 bg-green-400 rounded-full"></div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen flex">
      <Sidebar />
      
      {/* Mobile sidebar overlay */}
      {isMobile && sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-20" onClick={() => setSidebarOpen(false)} />
      )}

      <main className="flex-1 overflow-auto">
        {/* Header */}
        <header className="bg-dark-surface border-b border-slate-700 px-6 py-4">
          <div className="flex items-center space-x-4">
            {isMobile && (
              <Button
                variant="ghost"
                size="sm"
                className="p-2 lg:hidden"
                onClick={() => setSidebarOpen(!sidebarOpen)}
              >
                <Menu className="w-5 h-5" />
              </Button>
            )}
            <CalendarIcon className="h-6 w-6 text-purple-400" />
            <h1 className="text-2xl font-bold text-white">Activity Calendar</h1>
          </div>
        </header>

        <div className="p-6 space-y-6">
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Calendar */}
            <Card className="lg:col-span-2 bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <CalendarIcon className="h-5 w-5 text-purple-400" />
                  Monthly Overview
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Click on any date to view detailed activity history
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  className="rounded-md border border-slate-600"
                  classNames={{
                    months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
                    month: "space-y-4",
                    caption: "flex justify-center pt-1 relative items-center text-white",
                    caption_label: "text-sm font-medium",
                    nav: "space-x-1 flex items-center",
                    nav_button: "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 text-white",
                    nav_button_previous: "absolute left-1",
                    nav_button_next: "absolute right-1",
                    table: "w-full border-collapse space-y-1",
                    head_row: "flex",
                    head_cell: "text-gray-400 rounded-md w-9 font-normal text-[0.8rem]",
                    row: "flex w-full mt-2",
                    cell: "relative h-9 w-9 text-center text-sm p-0 focus-within:relative focus-within:z-20 [&:has([aria-selected])]:bg-slate-700 [&:has([aria-selected].day-outside)]:bg-slate-700/50 [&:has([aria-selected].day-range-end)]:rounded-r-md",
                    day: "h-9 w-9 p-0 font-normal text-white hover:bg-slate-600 rounded-md transition-colors relative",
                    day_range_end: "day-range-end",
                    day_selected: "bg-purple-600 text-white hover:bg-purple-600 hover:text-white focus:bg-purple-600 focus:text-white",
                    day_today: "bg-slate-700 text-white",
                    day_outside: "text-gray-500 opacity-50 aria-selected:bg-slate-700/50 aria-selected:text-gray-500 aria-selected:opacity-30",
                    day_disabled: "text-gray-500 opacity-50",
                    day_range_middle: "aria-selected:bg-slate-700 aria-selected:text-white",
                    day_hidden: "invisible",
                  }}
                  components={{
                    DayContent: ({ date }) => (
                      <div className="relative w-full h-full flex items-center justify-center">
                        {date.getDate()}
                        {dayContent(date)}
                      </div>
                    )
                  }}
                />
                
                {/* Legend */}
                <div className="mt-4 flex items-center justify-center space-x-6 text-sm text-gray-400">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                    <span>Activity Sessions</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                    <span>Completed Tasks</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Selected Date Summary */}
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Clock className="h-5 w-5 text-blue-400" />
                  {selectedDate ? format(selectedDate, 'MMM d, yyyy') : 'Select a Date'}
                </CardTitle>
                {selectedDate && (
                  <CardDescription className="text-gray-400">
                    {(() => {
                      const data = getDayData(selectedDate);
                      if (!data.hasActivity) return 'No activity recorded';
                      return `${data.sessionCount} sessions • ${data.completedTasks} tasks completed`;
                    })()}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                {selectedDate && (
                  <>
                    {/* Quick Stats */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-slate-700/50 rounded-lg p-3 text-center">
                        <div className="text-lg font-bold text-purple-400">
                          {getDayData(selectedDate).totalHours}h
                        </div>
                        <div className="text-xs text-gray-400">Total Time</div>
                      </div>
                      <div className="bg-slate-700/50 rounded-lg p-3 text-center">
                        <div className="text-lg font-bold text-green-400">
                          {getDayData(selectedDate).completedTasks}
                        </div>
                        <div className="text-xs text-gray-400">Tasks Done</div>
                      </div>
                    </div>

                    {/* View Details Button */}
                    {(selectedDateSessions.length > 0 || selectedDateTasks.length > 0) && (
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" className="w-full text-purple-400 border-purple-500/30 hover:bg-purple-500/10">
                            View Full Day Details
                          </Button>
                        </DialogTrigger>
                        <DayDetailsDialog 
                          date={selectedDate} 
                          sessions={selectedDateSessions} 
                          tasks={selectedDateTasks} 
                        />
                      </Dialog>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity Overview */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Recent Sessions */}
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Activity className="h-5 w-5 text-purple-400" />
                  Recent Activity Sessions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-48">
                  <div className="space-y-3">
                    {sessions.slice(0, 10).map((session) => (
                      <div key={session.id} className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
                        <div className="flex items-center space-x-3">
                          {getActivityIcon(session.activity?.type || 'other')}
                          <div>
                            <div className="text-sm font-medium text-white">
                              {session.activity?.title}
                            </div>
                            <div className="text-xs text-gray-400">
                              {format(parseISO(session.date), 'MMM d')} • {session.duration}h
                            </div>
                          </div>
                        </div>
                        <Badge className={getActivityColor(session.activity?.type || 'other')}>
                          {session.activity?.type}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Recent Tasks */}
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Target className="h-5 w-5 text-green-400" />
                  Recent Task Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-48">
                  <div className="space-y-3">
                    {tasks.filter(task => task.status === 'completed').slice(0, 10).map((task) => (
                      <div key={task.id} className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <Trophy className="h-4 w-4 text-green-400" />
                          <div>
                            <div className="text-sm font-medium text-white">
                              {task.title}
                            </div>
                            <div className="text-xs text-gray-400">
                              {task.completedAt && format(parseISO(task.completedAt), 'MMM d')}
                            </div>
                          </div>
                        </div>
                        <Badge className={getPriorityColor(task.priority)}>
                          {task.priority}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}

// Day Details Dialog Component
function DayDetailsDialog({ date, sessions, tasks }: { 
  date: Date; 
  sessions: Session[]; 
  tasks: Task[]; 
}) {
  return (
    <DialogContent className="max-w-2xl max-h-[80vh] bg-slate-800 border-slate-700">
      <DialogHeader>
        <DialogTitle className="text-white flex items-center gap-2">
          <CalendarIcon className="h-5 w-5 text-purple-400" />
          {format(date, 'EEEE, MMMM d, yyyy')}
        </DialogTitle>
        <DialogDescription className="text-gray-400">
          Complete activity breakdown for this day
        </DialogDescription>
      </DialogHeader>
      
      <ScrollArea className="max-h-96 pr-4">
        <div className="space-y-6">
          {/* Activity Sessions */}
          {sessions.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                <Activity className="h-5 w-5 text-purple-400" />
                Activity Sessions ({sessions.length})
              </h3>
              <div className="space-y-3">
                {sessions.map((session) => (
                  <div key={session.id} className="p-4 bg-slate-700/30 rounded-lg">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        {session.activity?.imageUrl && (
                          <img 
                            src={session.activity.imageUrl} 
                            alt={session.activity.title}
                            className="w-10 h-10 rounded object-cover"
                          />
                        )}
                        <div>
                          <div className="font-medium text-white flex items-center gap-2">
                            {getActivityIcon(session.activity?.type || 'other')}
                            {session.activity?.title}
                          </div>
                          <div className="text-sm text-gray-400">
                            {session.activity?.category && `${session.activity.category} • `}
                            Duration: {session.duration} hours
                          </div>
                          {session.notes && (
                            <div className="text-sm text-gray-300 mt-1">
                              "{session.notes}"
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-end space-y-1">
                        <Badge className={getActivityColor(session.activity?.type || 'other')}>
                          {session.activity?.type}
                        </Badge>
                        {session.quality && (
                          <div className="flex items-center space-x-1">
                            <Star className="h-3 w-3 text-yellow-400" />
                            <span className="text-xs text-gray-400">{session.quality}/5</span>
                          </div>
                        )}
                        {session.location && (
                          <div className="flex items-center space-x-1">
                            <MapPin className="h-3 w-3 text-blue-400" />
                            <span className="text-xs text-gray-400">{session.location}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tasks */}
          {tasks.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                <Target className="h-5 w-5 text-green-400" />
                Tasks ({tasks.length})
              </h3>
              <div className="space-y-3">
                {tasks.map((task) => (
                  <div key={task.id} className="p-4 bg-slate-700/30 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        {task.status === 'completed' ? (
                          <Trophy className="h-5 w-5 text-green-400" />
                        ) : (
                          <Target className="h-5 w-5 text-yellow-400" />
                        )}
                        <div>
                          <div className="font-medium text-white">{task.title}</div>
                          <div className="text-sm text-gray-400">
                            {task.estimatedHours && `Est. ${task.estimatedHours}h • `}
                            {task.status === 'completed' ? 'Completed' : task.dueDate ? 'Due' : 'Scheduled'}
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col items-end space-y-1">
                        <Badge className={getPriorityColor(task.priority)}>
                          {task.priority}
                        </Badge>
                        <Badge variant={task.status === 'completed' ? 'default' : 'secondary'} className="text-xs">
                          {task.status}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* No Activity */}
          {sessions.length === 0 && tasks.length === 0 && (
            <div className="text-center py-8">
              <CalendarIcon className="h-12 w-12 text-gray-500 mx-auto mb-3" />
              <div className="text-gray-400">No activity recorded for this day</div>
            </div>
          )}
        </div>
      </ScrollArea>
    </DialogContent>
  );
}