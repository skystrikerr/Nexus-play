import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Heart, MessageCircle, Share, MoreVertical, Plus, Image } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";
import type { Post } from "@shared/schema";

type FeedPost = Post & {
  author?: { username: string | null; displayName: string | null; profileImageUrl: string | null };
};
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

export default function PostsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [newPostContent, setNewPostContent] = useState("");
  const [postImageUrl, setPostImageUrl] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  // Fetch all public posts
  const { data: posts, isLoading } = useQuery<FeedPost[]>({
    queryKey: ["/api/posts"],
  });

  // Create post mutation
  const createPostMutation = useMutation({
    mutationFn: (data: { content: string; imageUrl?: string; isPublic: number }) =>
      apiRequest("POST", "/api/posts", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
      setNewPostContent("");
      setPostImageUrl("");
      setIsCreating(false);
      toast({ title: "Post created successfully!" });
    },
    onError: (error: any) => {
      toast({
        title: "Error creating post",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Like post mutation
  const likePostMutation = useMutation({
    mutationFn: (postId: string) => apiRequest("POST", `/api/posts/${postId}/like`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
    }
  });

  const handleCreatePost = () => {
    if (!newPostContent.trim()) return;

    createPostMutation.mutate({
      content: newPostContent.trim(),
      imageUrl: postImageUrl || undefined,
      isPublic: 1
    });
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 dark:bg-gray-800 rounded mb-4"></div>
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-32 bg-gray-200 dark:bg-gray-800 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Community Posts</h1>
          {user && (
            <Button
              onClick={() => setIsCreating(!isCreating)}
              className="flex items-center gap-2"
              data-testid="button-create-post"
            >
              <Plus className="w-4 h-4" />
              New Post
            </Button>
          )}
        </div>

        {/* Create Post Form */}
        {user && isCreating && (
          <Card data-testid="card-create-post">
            <CardHeader>
              <h3 className="text-lg font-semibold">Create a New Post</h3>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder="What's on your mind?"
                value={newPostContent}
                onChange={(e) => setNewPostContent(e.target.value)}
                className="min-h-[120px]"
                data-testid="textarea-post-content"
              />
              
              {postImageUrl && (
                <div className="relative">
                  <img 
                    src={postImageUrl} 
                    alt="Post image" 
                    className="max-h-64 rounded-lg border"
                  />
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setPostImageUrl("")}
                    className="absolute top-2 right-2"
                    data-testid="button-remove-image"
                  >
                    Remove
                  </Button>
                </div>
              )}

              <div className="flex items-center gap-2">
                <Image className="w-4 h-4 text-muted-foreground shrink-0" />
                <Input
                  placeholder="Optional image URL (https://...)"
                  value={postImageUrl}
                  onChange={(e) => setPostImageUrl(e.target.value)}
                  className="bg-muted border-input text-foreground placeholder:text-muted-foreground/60"
                  data-testid="input-post-image-url"
                />
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button
                variant="outline"
                onClick={() => setIsCreating(false)}
                data-testid="button-cancel-post"
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreatePost}
                disabled={!newPostContent.trim() || createPostMutation.isPending}
                data-testid="button-submit-post"
              >
                {createPostMutation.isPending ? "Posting..." : "Post"}
              </Button>
            </CardFooter>
          </Card>
        )}

        {/* Posts Feed */}
        <div className="space-y-6" data-testid="posts-feed">
          {posts && posts.length > 0 ? (
            posts.map((post) => (
              <Card key={post.id} data-testid={`post-${post.id}`}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={post.author?.profileImageUrl || undefined} />
                        <AvatarFallback>
                          {(post.author?.displayName || post.author?.username || "?").slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold">
                          {post.author?.displayName || post.author?.username || "Former member"}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {post.createdAt ? format(new Date(post.createdAt), "MMM d, yyyy 'at' h:mm a") : ""}
                        </p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <p className="text-base whitespace-pre-wrap mb-4">{post.content}</p>
                  
                  {post.imageUrl && (
                    <img
                      src={post.imageUrl}
                      alt="Post image"
                      className="max-w-full rounded-lg border"
                    />
                  )}
                </CardContent>
                
                <CardFooter className="pt-4">
                  <div className="flex items-center gap-6">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="flex items-center gap-2"
                      onClick={() => likePostMutation.mutate(post.id)}
                      data-testid={`button-like-${post.id}`}
                    >
                      <Heart className="w-4 h-4" />
                      <span>{post.likes || 0}</span>
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      className="flex items-center gap-2"
                      data-testid={`button-comment-${post.id}`}
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span>{post.commentsCount || 0}</span>
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      className="flex items-center gap-2"
                      data-testid={`button-share-${post.id}`}
                    >
                      <Share className="w-4 h-4" />
                      Share
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            ))
          ) : (
            <Card data-testid="empty-posts">
              <CardContent className="text-center py-12">
                <MessageCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">No posts yet</h3>
                <p className="text-muted-foreground mb-4">
                  Be the first to share something with the community!
                </p>
                {user && (
                  <Button onClick={() => setIsCreating(true)} data-testid="button-create-first-post">
                    Create Your First Post
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}