import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import PageHeader from "@/components/page-header";
import ActivityCalendar from "@/components/activity-calendar";
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
    case 'game': return 'bg-primary/15 text-primary border-primary/30';
    case 'study': return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
    case 'work': return 'bg-green-500/20 text-green-300 border-green-500/30';
    case 'exercise': return 'bg-red-500/20 text-red-300 border-red-500/30';
    case 'reading': return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
    default: return 'bg-gray-500/20 text-muted-foreground border-gray-500/30';
  }
};

export default function CalendarPage() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());

  const { data: sessions = [] } = useQuery<Session[]>({
    queryKey: ["/api/sessions"],
  });

  const { data: activities = [] } = useQuery<any[]>({
    queryKey: ["/api/activities"],
  });

  // Get sessions for selected date
  const selectedDateSessions = selectedDate 
    ? sessions.filter(session => {
        const sessionDate = parseISO(session.date);
        return isSameDay(sessionDate, selectedDate);
      })
    : [];

  // Create activity lookup map
  const activityMap = activities.reduce((acc: any, activity: any) => {
    acc[activity.id] = activity;
    return acc;
  }, {});

  // Calculate daily totals for calendar display
  const getDayData = (date: Date) => {
    const daySessions = sessions.filter(session => 
      isSameDay(parseISO(session.date), date)
    );
    const totalHours = daySessions.reduce((sum, session) => sum + session.duration, 0);
    
    return {
      totalHours: Math.round(totalHours * 10) / 10,
      sessionCount: daySessions.length,
      hasActivity: daySessions.length > 0
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
            <div className="w-1 h-1 bg-primary rounded-full"></div>
          )}
        </div>
      </div>
    );
  };

  return (
    <>
      <PageHeader title="Calendar" subtitle="Your play sessions over time" />

      <div className="px-4 sm:px-6 lg:px-8 py-6 space-y-6">
          {/* Interactive Calendar for Adding Activities */}
          <ActivityCalendar />
          
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Calendar */}
            <Card className="lg:col-span-2 glass border-border/60">
              <CardHeader>
                <CardTitle className="text-foreground flex items-center gap-2">
                  <CalendarIcon className="h-5 w-5 text-primary" />
                  Monthly Overview
                </CardTitle>
                <CardDescription className="text-muted-foreground">
                  Click on any date to view detailed activity history
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  className="rounded-md border border-border"
                  classNames={{
                    months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
                    month: "space-y-4",
                    caption: "flex justify-center pt-1 relative items-center text-foreground",
                    caption_label: "text-sm font-medium",
                    nav: "space-x-1 flex items-center",
                    nav_button: "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 text-foreground",
                    nav_button_previous: "absolute left-1",
                    nav_button_next: "absolute right-1",
                    table: "w-full border-collapse space-y-1",
                    head_row: "flex",
                    head_cell: "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]",
                    row: "flex w-full mt-2",
                    cell: "relative h-9 w-9 text-center text-sm p-0 focus-within:relative focus-within:z-20 [&:has([aria-selected])]:bg-muted [&:has([aria-selected].day-outside)]:bg-muted/50 [&:has([aria-selected].day-range-end)]:rounded-r-md",
                    day: "h-9 w-9 p-0 font-normal text-foreground hover:bg-muted rounded-md transition-colors relative",
                    day_range_end: "day-range-end",
                    day_selected: "bg-primary text-foreground hover:bg-primary hover:text-foreground focus:bg-primary focus:text-foreground",
                    day_today: "bg-muted text-foreground",
                    day_outside: "text-muted-foreground/60 opacity-50 aria-selected:bg-muted/50 aria-selected:text-muted-foreground/60 aria-selected:opacity-30",
                    day_disabled: "text-muted-foreground/60 opacity-50",
                    day_range_middle: "aria-selected:bg-muted aria-selected:text-foreground",
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
                <div className="mt-4 flex items-center justify-center space-x-6 text-sm text-muted-foreground">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                    <span>Activity Sessions</span>
                  </div>

                </div>
              </CardContent>
            </Card>

            {/* Selected Date Summary */}
            <Card className="glass border-border/60">
              <CardHeader>
                <CardTitle className="text-foreground flex items-center gap-2">
                  <Clock className="h-5 w-5 text-blue-400" />
                  {selectedDate ? format(selectedDate, 'MMM d, yyyy') : 'Select a Date'}
                </CardTitle>
                {selectedDate && (
                  <CardDescription className="text-muted-foreground">
                    {(() => {
                      const data = getDayData(selectedDate);
                      if (!data.hasActivity) return 'No activity recorded';
                      return `${data.sessionCount} sessions • ${data.totalHours}h played`;
                    })()}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                {selectedDate && (
                  <>
                    {/* Quick Stats */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-muted/50 rounded-lg p-3 text-center">
                        <div className="text-lg font-bold text-primary">
                          {getDayData(selectedDate).totalHours}h
                        </div>
                        <div className="text-xs text-muted-foreground">Total Time</div>
                      </div>
                      <div className="bg-muted/50 rounded-lg p-3 text-center">
                        <div className="text-lg font-bold text-green-400">
                          {getDayData(selectedDate).sessionCount}
                        </div>
                        <div className="text-xs text-muted-foreground">Sessions</div>
                      </div>
                    </div>

                    {/* View Details Button */}
                    {selectedDateSessions.length > 0 && (
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" className="w-full text-primary border-primary/30 hover:bg-primary/10">
                            View Full Day Details
                          </Button>
                        </DialogTrigger>
                        <DayDetailsDialog
                          date={selectedDate}
                          sessions={selectedDateSessions}
                          activityMap={activityMap}
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
            <Card className="glass border-border/60">
              <CardHeader>
                <CardTitle className="text-foreground flex items-center gap-2">
                  <Activity className="h-5 w-5 text-primary" />
                  Recent Activity Sessions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-48">
                  <div className="space-y-3">
                    {sessions.slice(0, 10).map((session) => (
                      <div key={session.id} className="flex items-center justify-between p-3 bg-muted/40 rounded-lg">
                        <div className="flex items-center space-x-3">
                          {getActivityIcon(session.activity?.type || 'other')}
                          <div>
                            <div className="text-sm font-medium text-foreground">
                              {session.activity?.title}
                            </div>
                            <div className="text-xs text-muted-foreground">
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
        </div>
      </div>
    </>
  );
}

// Day Details Dialog Component
function DayDetailsDialog({ date, sessions, activityMap }: {
  date: Date;
  sessions: Session[];
  activityMap: any;
}) {
  return (
    <DialogContent className="max-w-2xl max-h-[80vh] bg-card border-border">
      <DialogHeader>
        <DialogTitle className="text-foreground flex items-center gap-2">
          <CalendarIcon className="h-5 w-5 text-primary" />
          {format(date, 'EEEE, MMMM d, yyyy')}
        </DialogTitle>
        <DialogDescription className="text-muted-foreground">
          Complete activity breakdown for this day
        </DialogDescription>
      </DialogHeader>
      
      <ScrollArea className="max-h-96 pr-4">
        <div className="space-y-6">
          {/* Activity Sessions */}
          {sessions.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary" />
                Activity Sessions ({sessions.length})
              </h3>
              <div className="space-y-3">
                {sessions.map((session) => (
                  <div key={session.id} className="p-4 bg-muted/40 rounded-lg">
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
                          <div className="font-medium text-foreground flex items-center gap-2">
                            {getActivityIcon(session.activity?.type || 'other')}
                            {session.activity?.title}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {session.activity?.category && `${session.activity.category} • `}
                            Duration: {session.duration} hours
                          </div>
                          {session.notes && (
                            <div className="text-sm text-muted-foreground mt-1">
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
                            <span className="text-xs text-muted-foreground">{session.quality}/5</span>
                          </div>
                        )}
                        {session.location && (
                          <div className="flex items-center space-x-1">
                            <MapPin className="h-3 w-3 text-blue-400" />
                            <span className="text-xs text-muted-foreground">{session.location}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* No Activity */}
          {sessions.length === 0 && (
            <div className="text-center py-8">
              <CalendarIcon className="h-12 w-12 text-muted-foreground/60 mx-auto mb-3" />
              <div className="text-muted-foreground">No activity recorded for this day</div>
            </div>
          )}
        </div>
      </ScrollArea>
    </DialogContent>
  );
}