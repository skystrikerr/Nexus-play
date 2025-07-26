import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Users as UsersIcon, User as UserIcon } from "lucide-react";
import type { User } from "@shared/schema";

export function Users() {
  const { data: users, isLoading } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center gap-3 mb-6">
          <UsersIcon className="h-6 w-6" />
          <h1 className="text-2xl font-bold">Community</h1>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-200 rounded-full" />
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded mb-2" />
                    <div className="h-3 bg-gray-200 rounded w-2/3" />
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center gap-3 mb-6">
        <UsersIcon className="h-6 w-6" />
        <h1 className="text-2xl font-bold">Community</h1>
        <Badge variant="secondary">{users?.length || 0} users</Badge>
      </div>

      {users?.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <UserIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
              No public users yet
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              Be the first to make your profile public!
            </p>
          </CardContent>
        </Card>
      )}

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {users?.map((user) => (
          <Link key={user.id} href={`/users/${user.id}`}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={user.profileImageUrl || undefined} />
                    <AvatarFallback>
                      {user.firstName?.[0] || user.email?.[0] || "?"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg truncate">
                      {user.firstName || user.lastName 
                        ? `${user.firstName || ""} ${user.lastName || ""}`.trim()
                        : user.email?.split("@")[0] || "Anonymous User"
                      }
                    </CardTitle>
                    {user.bio && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                        {user.bio}
                      </p>
                    )}
                    <p className="text-xs text-gray-500 dark:text-gray-500">
                      Joined {new Date(user.createdAt!).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}