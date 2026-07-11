import { useQuery } from "@tanstack/react-query";
import { TrendingUp, Activity, Clock, Target } from "lucide-react";
import PageHeader from "@/components/page-header";

interface Stats {
  totalActivities: number;
  completedActivities: number;
  inProgressActivities: number;
  totalHours: number;
  monthlyHours: number;
  byType: Record<string, { count: number; completed: number; hours: number }>;
  totalGames: number;
  completedGames: number;
}

const activityTypes = [
  { type: 'game', name: 'Games', icon: '🎮', color: 'bg-gradient-aurora' },
  { type: 'study', name: 'Study', icon: '📚', color: 'bg-gradient-solar' },
  { type: 'work', name: 'Work', icon: '💼', color: 'bg-gradient-solar' },
  { type: 'exercise', name: 'Exercise', icon: '💪', color: 'bg-gradient-pulse' },
  { type: 'reading', name: 'Reading', icon: '📖', color: 'bg-gradient-neutral' },
  { type: 'hobby', name: 'Hobbies', icon: '🎨', color: 'bg-gradient-neutral' },
  { type: 'other', name: 'Other', icon: '📋', color: 'bg-gradient-neutral' },
];

export default function Statistics() {
  const { data: stats, isLoading } = useQuery<Stats>({
    queryKey: ["/api/stats"],
  });

  const overviewCards = [
    { title: "Total Activities", value: stats?.totalActivities || 0, icon: Activity, gradient: "bg-gradient-aurora" },
    { title: "Completed", value: stats?.completedActivities || 0, icon: Target, gradient: "bg-gradient-neutral" },
    { title: "In Progress", value: stats?.inProgressActivities || 0, icon: TrendingUp, gradient: "bg-gradient-pulse" },
    { title: "Total Hours", value: `${stats?.totalHours || 0}h`, icon: Clock, gradient: "bg-gradient-solar" },
  ];

  return (
    <>
      <PageHeader title="Statistics" subtitle="Your tracking totals by activity type" />

      <div className="px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Overview Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-5">
          {overviewCards.map((card) => {
            const Icon = card.icon;
            return (
              <div key={card.title} className="glass-glow rounded-xl p-5 lg:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-muted-foreground text-xs lg:text-sm font-medium">{card.title}</p>
                    <p className="text-2xl lg:text-3xl font-bold text-foreground font-mono mt-1">
                      {isLoading ? <span className="shimmer inline-block w-14 h-8 rounded" /> : card.value}
                    </p>
                  </div>
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${card.gradient} shadow-lg shrink-0`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Activity Breakdown */}
        <div className="glass rounded-xl p-6">
          <h3 className="text-lg font-display font-semibold text-foreground mb-6">Activity Breakdown</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {activityTypes.map((activityType) => {
              const typeStats = stats?.byType?.[activityType.type] || { count: 0, completed: 0, hours: 0 };
              const completion = typeStats.count > 0 ? (typeStats.completed / typeStats.count) * 100 : 0;
              return (
                <div key={activityType.type} className="bg-background/40 rounded-xl p-4 border border-border/60">
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`w-10 h-10 ${activityType.color} rounded-xl flex items-center justify-center text-lg shadow-lg`}>
                      {activityType.icon}
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground">{activityType.name}</h4>
                      <p className="text-muted-foreground text-sm">{typeStats.count} activities</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Completed</span>
                      <span className="text-foreground font-mono">{typeStats.completed}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Hours</span>
                      <span className="text-foreground font-mono">{typeStats.hours}h</span>
                    </div>
                    {typeStats.count > 0 && (
                      <div className="w-full bg-muted rounded-full h-2 mt-1">
                        <div
                          className={`h-2 rounded-full ${activityType.color}`}
                          style={{ width: `${completion}%` }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Monthly Progress */}
        <div className="glass rounded-xl p-6">
          <h3 className="text-lg font-display font-semibold text-foreground mb-4">This Month</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-muted-foreground text-sm mb-2">Hours This Month</p>
              <p className="text-3xl font-bold font-mono text-gradient-aurora">{stats?.monthlyHours || 0}h</p>
            </div>
            <div>
              <p className="text-muted-foreground text-sm mb-2">Completion Rate</p>
              <p className="text-3xl font-bold font-mono text-gradient-neutral">
                {stats?.totalActivities ? Math.round((stats.completedActivities / stats.totalActivities) * 100) : 0}%
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
