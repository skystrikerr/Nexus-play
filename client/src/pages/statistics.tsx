import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Menu, TrendingUp, Activity, Clock, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import Sidebar from "@/components/sidebar";
import { useIsMobile } from "@/hooks/use-mobile";

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

export default function Statistics() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isMobile = useIsMobile();

  const { data: stats, isLoading } = useQuery<Stats>({
    queryKey: ["/api/stats"],
  });

  const activityTypes = [
    { type: 'game', name: 'Games', icon: '🎮', color: 'bg-blue-500' },
    { type: 'study', name: 'Study', icon: '📚', color: 'bg-green-500' },
    { type: 'work', name: 'Work', icon: '💼', color: 'bg-purple-500' },
    { type: 'exercise', name: 'Exercise', icon: '💪', color: 'bg-red-500' },
    { type: 'reading', name: 'Reading', icon: '📖', color: 'bg-yellow-500' },
    { type: 'hobby', name: 'Hobbies', icon: '🎨', color: 'bg-pink-500' },
    { type: 'other', name: 'Other', icon: '📋', color: 'bg-gray-500' },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen flex">
        <Sidebar />
        <main className="flex-1 overflow-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-slate-400">Loading statistics...</div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      <Sidebar />
      
      {/* Mobile sidebar overlay */}
      {isMobile && sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-20" onClick={() => setSidebarOpen(false)} />
      )}

      <main className="flex-1 overflow-auto">
        {/* Top Bar */}
        <header className="bg-dark-surface border-b border-slate-700 px-6 py-4">
          <div className="flex items-center justify-between">
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
              <h2 className="text-2xl font-bold text-white">Statistics</h2>
            </div>
          </div>
        </header>

        <div className="p-6 space-y-6">
          {/* Overview Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-dark-surface rounded-xl p-6 border border-slate-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Total Activities</p>
                  <p className="text-2xl font-bold text-white">{stats?.totalActivities || 0}</p>
                </div>
                <Activity className="w-8 h-8 text-primary" />
              </div>
            </div>

            <div className="bg-dark-surface rounded-xl p-6 border border-slate-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Completed</p>
                  <p className="text-2xl font-bold text-green-400">{stats?.completedActivities || 0}</p>
                </div>
                <Target className="w-8 h-8 text-green-400" />
              </div>
            </div>

            <div className="bg-dark-surface rounded-xl p-6 border border-slate-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">In Progress</p>
                  <p className="text-2xl font-bold text-blue-400">{stats?.inProgressActivities || 0}</p>
                </div>
                <TrendingUp className="w-8 h-8 text-blue-400" />
              </div>
            </div>

            <div className="bg-dark-surface rounded-xl p-6 border border-slate-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Total Hours</p>
                  <p className="text-2xl font-bold text-yellow-400">{stats?.totalHours || 0}</p>
                </div>
                <Clock className="w-8 h-8 text-yellow-400" />
              </div>
            </div>
          </div>

          {/* Activity Breakdown */}
          <div className="bg-dark-surface rounded-xl p-6 border border-slate-700">
            <h3 className="text-xl font-bold text-white mb-6">Activity Breakdown</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {activityTypes.map((activityType) => {
                const typeStats = stats?.byType?.[activityType.type] || { count: 0, completed: 0, hours: 0 };
                return (
                  <div key={activityType.type} className="bg-dark-bg rounded-lg p-4 border border-slate-700">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className={`w-10 h-10 ${activityType.color} rounded-lg flex items-center justify-center text-white text-lg`}>
                        {activityType.icon}
                      </div>
                      <div>
                        <h4 className="font-semibold text-white">{activityType.name}</h4>
                        <p className="text-slate-400 text-sm">{typeStats.count} activities</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-400">Completed:</span>
                        <span className="text-green-400">{typeStats.completed}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-400">Hours:</span>
                        <span className="text-yellow-400">{typeStats.hours}h</span>
                      </div>
                      {typeStats.count > 0 && (
                        <div className="w-full bg-slate-700 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${activityType.color}`}
                            style={{ width: `${(typeStats.completed / typeStats.count) * 100}%` }}
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
          <div className="bg-dark-surface rounded-xl p-6 border border-slate-700">
            <h3 className="text-xl font-bold text-white mb-4">This Month</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-slate-400 text-sm mb-2">Hours This Month</p>
                <p className="text-3xl font-bold text-primary">{stats?.monthlyHours || 0}h</p>
              </div>
              <div>
                <p className="text-slate-400 text-sm mb-2">Completion Rate</p>
                <p className="text-3xl font-bold text-green-400">
                  {stats?.totalActivities ? Math.round((stats.completedActivities / stats.totalActivities) * 100) : 0}%
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}