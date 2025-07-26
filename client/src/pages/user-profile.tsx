import { useQuery } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User as UserIcon, Calendar, BarChart3, Activity } from "lucide-react";
import type { User, Activity as ActivityType, ActivitySession } from "@shared/schema";
import GameCard from "@/components/game-card";

export function UserProfile() {
  const [, params] = useRoute("/users/:id");
  const userId = params?.id;

  const { data: user, isLoading: userLoading } = useQuery<User>({
    queryKey: [`/api/users/${userId}`],
    enabled: !!userId,
  });

  const { data: activities, isLoading: activitiesLoading } = useQuery<ActivityType[]>({
    queryKey: [`/api/users/${userId}/activities`],
    enabled: !!userId,
  });

  const { data: sessions, isLoading: sessionsLoading } = useQuery<ActivitySession[]>({
    queryKey: [`/api/users/${userId}/sessions`],
    enabled: !!userId,
  });

  if (userLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 bg-gray-200 rounded-full" />
            <div className="flex-1">
              <div className="h-6 bg-gray-200 rounded mb-2" />
              <div className="h-4 bg-gray-200 rounded w-2/3" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="text-center py-12">
            <UserIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
              User not found
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              This user either doesn't exist or has a private profile.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const totalHours = activities?.reduce((sum, activity) => sum + (activity.totalHours || 0), 0) || 0;
  const completedActivities = activities?.filter(a => a.status === 'completed').length || 0;
  const monthSessions = sessions?.filter(s => {
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    return s.date.startsWith(currentMonth);
  }) || [];
  const monthlyHours = monthSessions.reduce((sum, session) => sum + session.duration, 0);

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center gap-4 mb-6">
        <Avatar className="w-16 h-16">
          <AvatarImage src={user.profileImageUrl || undefined} />
          <AvatarFallback className="text-lg">
            {user.firstName?.[0] || user.email?.[0] || "?"}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">
            {user.firstName || user.lastName 
              ? `${user.firstName || ""} ${user.lastName || ""}`.trim()
              : user.email?.split("@")[0] || "Anonymous User"
            }
          </h1>
          {user.bio && (
            <p className="text-gray-600 dark:text-gray-400 mt-1">{user.bio}</p>
          )}
          <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
            Joined {new Date(user.createdAt!).toLocaleDateString()}
          </p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Total Activities
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activities?.length || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Completed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedActivities}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Total Hours
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round(totalHours)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
              This Month
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round(monthlyHours * 10) / 10}h
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="activities" className="space-y-4">
        <TabsList>
          <TabsTrigger value="activities" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Activities
          </TabsTrigger>
          <TabsTrigger value="sessions" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Recent Sessions
          </TabsTrigger>
        </TabsList>

        <TabsContent value="activities">
          {activitiesLoading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader>
                    <div className="h-4 bg-gray-200 rounded mb-2" />
                    <div className="h-3 bg-gray-200 rounded w-2/3" />
                  </CardHeader>
                </Card>
              ))}
            </div>
          ) : activities?.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                  No public activities
                </h3>
                <p className="text-gray-500 dark:text-gray-400">
                  This user hasn't shared any activities yet.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {activities?.map((activity) => (
                <GameCard
                  key={activity.id}
                  game={activity}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="sessions">
          {sessionsLoading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-4">
                    <div className="h-4 bg-gray-200 rounded mb-2" />
                    <div className="h-3 bg-gray-200 rounded w-1/2" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : sessions?.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                  No recent sessions
                </h3>
                <p className="text-gray-500 dark:text-gray-400">
                  This user hasn't recorded any public sessions yet.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {sessions?.slice(0, 20).map((session) => {
                const activity = activities?.find(a => a.id === session.activityId);
                return (
                  <Card key={session.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="font-medium">
                            {activity?.title || "Unknown Activity"}
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            {session.date} • {Math.round(session.duration * 60)} minutes
                            {session.quality && (
                              <Badge variant="secondary" className="ml-2">
                                Quality: {session.quality}/5
                              </Badge>
                            )}
                          </div>
                          {session.notes && (
                            <div className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                              {session.notes}
                            </div>
                          )}
                        </div>
                        <Badge variant={activity?.type === 'game' ? 'default' : 'secondary'}>
                          {activity?.type || 'activity'}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}