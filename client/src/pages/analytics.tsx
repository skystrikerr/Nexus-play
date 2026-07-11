import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Area,
  AreaChart,
} from "recharts";
import { useState } from "react";
import {
  BarChart3,
  PieChart as PieChartIcon,
  TrendingUp,
  Calendar,
  Activity,
  Clock,
  Target,
  Award,
} from "lucide-react";

// Activity type colors for consistent visualization
const ACTIVITY_COLORS = {
  game: "#3B82F6", // Blue
  study: "#10B981", // Green  
  work: "#F59E0B", // Amber
  exercise: "#EF4444", // Red
  reading: "#8B5CF6", // Purple
  hobby: "#06B6D4", // Cyan
  other: "#64748B", // Slate
};

const ACTIVITY_LABELS = {
  game: "Gaming",
  study: "Study",
  work: "Work", 
  exercise: "Exercise",
  reading: "Reading",
  hobby: "Hobbies",
  other: "Other",
};

interface ActivityHours {
  type: string;
  label: string;
  hours: number;
  sessions: number;
  color: string;
}

interface DailyHours {
  date: string;
  [key: string]: number | string; // Dynamic keys for each activity type
}

interface WeeklyStats {
  week: string;
  totalHours: number;
  activeDays: number;
  avgSessionLength: number;
}

export default function Analytics() {
  const { user } = useAuth();
  const [timeRange, setTimeRange] = useState("30"); // days
  const [chartType, setChartType] = useState("bar");

  // Fetch analytics data
  const { data: analyticsData, isLoading } = useQuery({
    queryKey: ["/api/analytics", timeRange],
    enabled: !!user,
  });

  // Process activity hours data
  const activityHours: ActivityHours[] = analyticsData?.activityHours?.map((item: any) => ({
    type: item.type,
    label: ACTIVITY_LABELS[item.type as keyof typeof ACTIVITY_LABELS] || item.type,
    hours: Math.round(item.hours * 10) / 10,
    sessions: item.sessions,
    color: ACTIVITY_COLORS[item.type as keyof typeof ACTIVITY_COLORS] || "#64748B",
  })) || [];

  // Process daily hours data for line/area charts
  const dailyHours: DailyHours[] = analyticsData?.dailyHours || [];

  // Process weekly stats
  const weeklyStats: WeeklyStats[] = analyticsData?.weeklyStats || [];

  const totalHours = activityHours.reduce((sum, activity) => sum + activity.hours, 0);
  const totalSessions = activityHours.reduce((sum, activity) => sum + activity.sessions, 0);
  const avgSessionLength = totalSessions > 0 ? Math.round((totalHours / totalSessions) * 60) / 10 : 0;

  if (isLoading) {
    return (
      <div className="px-4 sm:px-6 lg:px-8 py-6">
        <div className="max-w-7xl mx-auto">
          <div className="space-y-6">
            <div className="h-8 shimmer rounded w-1/4"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 shimmer rounded-xl"></div>
              ))}
            </div>
            <div className="h-96 shimmer rounded-xl"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-1">
          <div>
            <h1 className="text-2xl sm:text-3xl font-display font-bold tracking-tight text-foreground">
              Analytics
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Visualize your activity patterns and track your progress
            </p>
          </div>
          
          <div className="flex gap-3">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-40 bg-slate-800 border-slate-600 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-600">
                <SelectItem value="7">Last 7 days</SelectItem>
                <SelectItem value="30">Last 30 days</SelectItem>
                <SelectItem value="90">Last 3 months</SelectItem>
                <SelectItem value="365">Last year</SelectItem>
              </SelectContent>
            </Select>

            <Select value={chartType} onValueChange={setChartType}>
              <SelectTrigger className="w-32 bg-slate-800 border-slate-600 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-600">
                <SelectItem value="bar">Bar Chart</SelectItem>
                <SelectItem value="pie">Pie Chart</SelectItem>
                <SelectItem value="line">Line Chart</SelectItem>
                <SelectItem value="area">Area Chart</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-slate-900/50 border-slate-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-400">Total Hours</CardTitle>
              <Clock className="h-4 w-4 text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{totalHours.toFixed(1)}h</div>
              <p className="text-xs text-slate-400">
                Last {timeRange} days
              </p>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 border-slate-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-400">Total Sessions</CardTitle>
              <Activity className="h-4 w-4 text-green-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{totalSessions}</div>
              <p className="text-xs text-slate-400">
                Activities logged
              </p>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 border-slate-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-400">Avg Session</CardTitle>
              <Target className="h-4 w-4 text-purple-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{avgSessionLength}min</div>
              <p className="text-xs text-slate-400">
                Per activity
              </p>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 border-slate-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-400">Activity Types</CardTitle>
              <Award className="h-4 w-4 text-amber-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{activityHours.length}</div>
              <p className="text-xs text-slate-400">
                Different types
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Chart */}
        <Card className="bg-slate-900/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              {chartType === "bar" && <BarChart3 className="w-5 h-5" />}
              {chartType === "pie" && <PieChartIcon className="w-5 h-5" />}
              {(chartType === "line" || chartType === "area") && <TrendingUp className="w-5 h-5" />}
              Activity Hours Distribution
            </CardTitle>
            <CardDescription className="text-slate-400">
              Hours spent on different activity types in the last {timeRange} days
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-96 w-full">
              {activityHours.length === 0 ? (
                <div className="flex items-center justify-center h-full text-slate-400">
                  <div className="text-center">
                    <Activity className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium">No activity data yet</p>
                    <p className="text-sm">Start logging activities to see your analytics</p>
                  </div>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  {chartType === "bar" && (
                    <BarChart data={activityHours}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis 
                        dataKey="label" 
                        stroke="#9CA3AF"
                        fontSize={12}
                      />
                      <YAxis 
                        stroke="#9CA3AF"
                        fontSize={12}
                        label={{ value: 'Hours', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: '#9CA3AF' } }}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#1F2937', 
                          border: '1px solid #374151',
                          borderRadius: '8px',
                          color: '#F9FAFB'
                        }}
                        formatter={(value: any, name: string) => [`${value}h`, 'Hours']}
                      />
                      <Bar dataKey="hours" radius={[4, 4, 0, 0]}>
                        {activityHours.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  )}

                  {chartType === "pie" && (
                    <PieChart>
                      <Pie
                        data={activityHours}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ label, percent }) => `${label} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={120}
                        fill="#8884d8"
                        dataKey="hours"
                      >
                        {activityHours.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#1F2937', 
                          border: '1px solid #374151',
                          borderRadius: '8px',
                          color: '#F9FAFB'
                        }}
                        formatter={(value: any) => [`${value}h`, 'Hours']}
                      />
                    </PieChart>
                  )}

                  {chartType === "line" && dailyHours.length > 0 && (
                    <LineChart data={dailyHours}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis 
                        dataKey="date" 
                        stroke="#9CA3AF"
                        fontSize={12}
                      />
                      <YAxis 
                        stroke="#9CA3AF"
                        fontSize={12}
                        label={{ value: 'Hours', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: '#9CA3AF' } }}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#1F2937', 
                          border: '1px solid #374151',
                          borderRadius: '8px',
                          color: '#F9FAFB'
                        }}
                      />
                      <Legend />
                      {Object.keys(ACTIVITY_COLORS).map((type) => (
                        <Line
                          key={type}
                          type="monotone"
                          dataKey={type}
                          stroke={ACTIVITY_COLORS[type as keyof typeof ACTIVITY_COLORS]}
                          strokeWidth={2}
                          dot={{ r: 4 }}
                          name={ACTIVITY_LABELS[type as keyof typeof ACTIVITY_LABELS]}
                        />
                      ))}
                    </LineChart>
                  )}

                  {chartType === "area" && dailyHours.length > 0 && (
                    <AreaChart data={dailyHours}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis 
                        dataKey="date" 
                        stroke="#9CA3AF"
                        fontSize={12}
                      />
                      <YAxis 
                        stroke="#9CA3AF"
                        fontSize={12}
                        label={{ value: 'Hours', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: '#9CA3AF' } }}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#1F2937', 
                          border: '1px solid #374151',
                          borderRadius: '8px',
                          color: '#F9FAFB'
                        }}
                      />
                      <Legend />
                      {Object.keys(ACTIVITY_COLORS).map((type) => (
                        <Area
                          key={type}
                          type="monotone"
                          dataKey={type}
                          stackId="1"
                          stroke={ACTIVITY_COLORS[type as keyof typeof ACTIVITY_COLORS]}
                          fill={ACTIVITY_COLORS[type as keyof typeof ACTIVITY_COLORS]}
                          fillOpacity={0.6}
                          name={ACTIVITY_LABELS[type as keyof typeof ACTIVITY_LABELS]}
                        />
                      ))}
                    </AreaChart>
                  )}
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Activity Breakdown Table */}
        {activityHours.length > 0 && (
          <Card className="bg-slate-900/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Activity Breakdown</CardTitle>
              <CardDescription className="text-slate-400">
                Detailed statistics for each activity type
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-700">
                      <th className="text-left py-3 px-4 text-slate-400 font-medium">Activity</th>
                      <th className="text-right py-3 px-4 text-slate-400 font-medium">Hours</th>
                      <th className="text-right py-3 px-4 text-slate-400 font-medium">Sessions</th>
                      <th className="text-right py-3 px-4 text-slate-400 font-medium">Avg/Session</th>
                      <th className="text-right py-3 px-4 text-slate-400 font-medium">% of Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activityHours
                      .sort((a, b) => b.hours - a.hours)
                      .map((activity) => (
                        <tr key={activity.type} className="border-b border-slate-800 hover:bg-slate-800/50">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <div 
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: activity.color }}
                              ></div>
                              <span className="text-white font-medium">{activity.label}</span>
                            </div>
                          </td>
                          <td className="text-right py-3 px-4 text-white font-mono">
                            {activity.hours.toFixed(1)}h
                          </td>
                          <td className="text-right py-3 px-4 text-slate-300">
                            {activity.sessions}
                          </td>
                          <td className="text-right py-3 px-4 text-slate-300">
                            {activity.sessions > 0 ? Math.round((activity.hours / activity.sessions) * 60) : 0}min
                          </td>
                          <td className="text-right py-3 px-4 text-slate-300">
                            {totalHours > 0 ? ((activity.hours / totalHours) * 100).toFixed(1) : 0}%
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}