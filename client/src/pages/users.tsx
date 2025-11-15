import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users as UsersIcon, User as UserIcon, Search, Plus, MessageCircle, Heart, Share2, Hash, Crown } from "lucide-react";
import { ObjectUploader } from "@/components/ObjectUploader";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import type { User, Post, Community } from "@shared/schema";

export function Users() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("posts");
  const [newCommunityName, setNewCommunityName] = useState("");
  const [newCommunityDescription, setNewCommunityDescription] = useState("");
  const [showCreateCommunity, setShowCreateCommunity] = useState(false);
  const { toast } = useToast();

  const { data: posts, isLoading: postsLoading } = useQuery<Post[]>({
    queryKey: ["/api/posts"],
  });

  const { data: users, isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  const { data: communities, isLoading: communitiesLoading } = useQuery<Community[]>({
    queryKey: ["/api/communities"],
  });

  const createCommunityMutation = useMutation({
    mutationFn: async (data: { name: string; description: string }) => {
      return await apiRequest("POST", "/api/communities", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/communities"] });
      setShowCreateCommunity(false);
      setNewCommunityName("");
      setNewCommunityDescription("");
      toast({
        title: "Community Created",
        description: "Your community has been created successfully!",
      });
    },
  });

  const joinCommunityMutation = useMutation({
    mutationFn: async (communityId: string) => {
      return await apiRequest("POST", `/api/communities/${communityId}/join`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/communities"] });
      toast({
        title: "Joined Community",
        description: "You've successfully joined the community!",
      });
    },
  });

  const likeMutation = useMutation({
    mutationFn: async (postId: string) => {
      return await apiRequest("POST", `/api/posts/${postId}/like`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
    },
  });

  const filteredUsers = users?.filter(
    (user) =>
      user.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.lastName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredCommunities = communities?.filter((community) =>
    community.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (postsLoading && activeTab === "posts") {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded mb-6" />
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="mb-4">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-200 rounded-full" />
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded mb-2" />
                    <div className="h-3 bg-gray-200 rounded w-2/3" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="h-20 bg-gray-200 rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <UsersIcon className="h-6 w-6" />
          <h1 className="text-2xl font-bold">Community</h1>
        </div>
        <Dialog open={showCreateCommunity} onOpenChange={setShowCreateCommunity}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              Create Community
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Community</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Community Name</label>
                <Input
                  value={newCommunityName}
                  onChange={(e) => setNewCommunityName(e.target.value)}
                  placeholder="Enter community name"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Description</label>
                <Textarea
                  value={newCommunityDescription}
                  onChange={(e) => setNewCommunityDescription(e.target.value)}
                  placeholder="Describe your community"
                  rows={3}
                />
              </div>
              <Button
                onClick={() =>
                  createCommunityMutation.mutate({
                    name: newCommunityName,
                    description: newCommunityDescription,
                  })
                }
                disabled={!newCommunityName.trim() || createCommunityMutation.isPending}
                className="w-full"
              >
                {createCommunityMutation.isPending ? "Creating..." : "Create Community"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="posts" className="flex items-center gap-2">
            <MessageCircle className="w-4 h-4" />
            Posts Feed
          </TabsTrigger>
          <TabsTrigger value="communities" className="flex items-center gap-2">
            <Hash className="w-4 h-4" />
            Communities
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center gap-2">
            <UserIcon className="w-4 h-4" />
            Find Users
          </TabsTrigger>
        </TabsList>

        <TabsContent value="posts" className="mt-6">
          {posts?.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No posts yet</h3>
                <p className="text-gray-500 dark:text-gray-400 mb-4">
                  Be the first to share something with the community!
                </p>
                <Link href="/posts">
                  <Button>Create First Post</Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {posts?.map((post) => (
                <Card key={post.id} className="overflow-hidden">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarFallback>
                            {post.userId.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-semibold">User {post.userId.slice(0, 8)}</p>
                          <p className="text-sm text-muted-foreground">
                            {post.createdAt ? format(new Date(post.createdAt), "MMM d, yyyy 'at' h:mm a") : ""}
                          </p>
                        </div>
                      </div>
                      {post.isPublic === 0 && (
                        <Badge variant="secondary">Private</Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-4">
                      <p className="text-gray-900 dark:text-gray-100">{post.content}</p>
                      {post.imageUrl && (
                        <img
                          src={post.imageUrl}
                          alt="Post image"
                          className="rounded-lg max-w-full h-auto"
                        />
                      )}
                      <div className="flex items-center gap-4 pt-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => likeMutation.mutate(post.id)}
                          className="flex items-center gap-2 text-gray-500 hover:text-red-500"
                        >
                          <Heart className="w-4 h-4" />
                          {post.likes || 0}
                        </Button>
                        <Button variant="ghost" size="sm" className="flex items-center gap-2">
                          <MessageCircle className="w-4 h-4" />
                          0 comments
                        </Button>
                        <Button variant="ghost" size="sm" className="flex items-center gap-2">
                          <Share2 className="w-4 h-4" />
                          Share
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="communities" className="mt-6">
          <div className="mb-4">
            <Input
              placeholder="Search communities..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-md text-white"
            />
          </div>
          {filteredCommunities?.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Hash className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No communities found</h3>
                <p className="text-gray-500 dark:text-gray-400 mb-4">
                  {searchQuery ? "Try a different search term" : "Be the first to create a community!"}
                </p>
                <Button onClick={() => setShowCreateCommunity(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Community
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {filteredCommunities?.map((community) => (
                <Card key={community.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                          <Hash className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">{community.name}</CardTitle>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {community.description}
                          </p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => joinCommunityMutation.mutate(community.id)}
                        disabled={joinCommunityMutation.isPending}
                      >
                        Join
                      </Button>
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="users" className="mt-6">
          <div className="mb-4">
            <Input
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-md text-white"
            />
          </div>
          {filteredUsers?.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <UserIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No users found</h3>
                <p className="text-gray-500 dark:text-gray-400">
                  {searchQuery ? "Try a different search term" : "No public users yet"}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredUsers?.map((user) => (
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
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}