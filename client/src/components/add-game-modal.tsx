import { useState, useCallback } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertActivitySchema, ACTIVITY_TYPES } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Star, X, Search, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { searchGames, mapRawgToActivity, type RawgGame } from "@/lib/rawg-api";
import type { z } from "zod";

const formSchema = insertActivitySchema.extend({
  rating: insertActivitySchema.shape.rating.optional(),
});

type FormData = z.infer<typeof formSchema>;

interface AddGameModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function AddGameModal({ open, onOpenChange }: AddGameModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRating, setSelectedRating] = useState<number>(0);
  const [searchResults, setSearchResults] = useState<RawgGame[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showManualForm, setShowManualForm] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      type: ACTIVITY_TYPES.GAME,
      category: "",
      subcategory: "",
      status: "wishlist",
      rating: undefined,
      progress: 0,
      totalHours: 0,
      imageUrl: "",
      externalId: "",
      description: "",
      tags: [],
      metadata: null,
    },
  });

  // Search games using RAWG API
  const handleSearch = useCallback(async (query: string) => {
    if (query.length < 3) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const results = await searchGames(query);
      setSearchResults(results.results);
    } catch (error) {
      console.error("Search error:", error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  // Debounced search
  const debouncedSearch = useCallback(
    debounce((query: string) => handleSearch(query), 500),
    [handleSearch]
  );

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    debouncedSearch(value);
  };

  // Simple debounce function
  function debounce(func: Function, wait: number) {
    let timeout: NodeJS.Timeout;
    return function executedFunction(...args: any[]) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  const createGameMutation = useMutation({
    mutationFn: (data: FormData) => apiRequest("POST", "/api/activities", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/activities"] });
      queryClient.invalidateQueries({ queryKey: ["/api/games"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({
        title: "Success",
        description: "Game added successfully!",
      });
      onOpenChange(false);
      form.reset();
      setSelectedRating(0);
    },
    onError: (error: any) => {
      console.error("Failed to add game:", error);
      if (error.message?.includes("Unauthorized")) {
        toast({
          title: "Login Required",
          description: "Please log in to add games to your library.",
          variant: "destructive",
        });
        // Redirect to login after showing error
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 2000);
      } else {
        toast({
          title: "Error",
          description: "Failed to add game. Please try again.",
          variant: "destructive",
        });
      }
    },
  });

  const onSubmit = (data: FormData) => {
    const submitData = {
      ...data,
      rating: selectedRating || undefined,
    };
    console.log("Submitting activity data:", submitData); // Debug log
    createGameMutation.mutate(submitData);
  };

  const handleGameSelect = (game: RawgGame) => {
    const activityData = mapRawgToActivity(game);
    
    // Fill form with game data
    form.setValue("title", activityData.title);
    form.setValue("category", activityData.category);
    form.setValue("imageUrl", activityData.imageUrl || "");
    form.setValue("description", activityData.description || "");
    form.setValue("rating", activityData.rating);
    form.setValue("metadata", activityData.metadata);
    
    setSelectedRating(activityData.rating);
    setShowManualForm(true);
    setSearchResults([]);
    setSearchQuery("");
  };

  const resetForm = () => {
    form.reset();
    setSelectedRating(0);
    setSearchQuery("");
    setSearchResults([]);
    setShowManualForm(false);
  };

  return (
    <Dialog open={open} onOpenChange={(open) => {
      onOpenChange(open);
      if (!open) resetForm();
    }}>
      <DialogContent className="bg-popover border-border text-white max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-white flex items-center gap-2">
            <Search className="w-5 h-5" />
            Add New Game
          </DialogTitle>
        </DialogHeader>

        {!showManualForm ? (
          // Game Search Interface
          <div className="space-y-4">
            <div className="relative">
              <Input
                placeholder="Search for a game..."
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="bg-muted border-input text-white placeholder-slate-400 pl-10 focus:border-blue-500"
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              {isSearching && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <div className="w-4 h-4 border-2 border-muted-foreground/40 border-t-white rounded-full animate-spin"></div>
                </div>
              )}
            </div>

            {searchResults && searchResults.length > 0 && (
              <div className="grid gap-3 max-h-96 overflow-y-auto">
                {searchResults.slice(0, 8).map((game: RawgGame) => (
                  <Card key={game.id} className="bg-muted border-input hover:border-blue-500 hover:bg-muted transition-all cursor-pointer">
                    <CardContent className="p-4" onClick={() => handleGameSelect(game)}>
                      <div className="flex items-center gap-4">
                        {game.background_image ? (
                          <img
                            src={game.background_image}
                            alt={game.name}
                            className="w-16 h-20 rounded-lg object-cover"
                          />
                        ) : (
                          <div className="w-16 h-20 rounded-lg bg-muted flex items-center justify-center">
                            <span className="text-muted-foreground text-xs">No Image</span>
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <h3 className="text-white font-semibold truncate">{game.name}</h3>
                          <div className="flex items-center gap-2 mt-1">
                            {game.rating > 0 && (
                              <div className="flex items-center gap-1">
                                <Star className="w-3 h-3 text-yellow-400 fill-current" />
                                <span className="text-yellow-400 text-sm font-medium">{game.rating.toFixed(1)}</span>
                              </div>
                            )}
                            {game.released && (
                              <span className="text-muted-foreground text-sm">{new Date(game.released).getFullYear()}</span>
                            )}
                          </div>
                          <div className="flex flex-wrap gap-1 mt-2">
                            {game.genres?.slice(0, 3).map((genre) => (
                              <Badge key={genre.id} variant="secondary" className="text-xs bg-muted text-foreground border-0">
                                {genre.name}
                              </Badge>
                            ))}
                          </div>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {game.platforms?.slice(0, 3).map((platform) => (
                              <Badge key={platform.platform.id} variant="outline" className="text-xs border-border text-muted-foreground">
                                {platform.platform.name}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <ExternalLink className="w-4 h-4 text-muted-foreground" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {searchQuery.length > 2 && !isSearching && searchResults.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Search className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p className="text-white">No games found for "{searchQuery}"</p>
                <p className="text-sm mt-2 text-muted-foreground">Try a different search term or add manually</p>
              </div>
            )}

            <div className="flex gap-2 pt-4 border-t border-border">
              <Button
                type="button"
                variant="outline"
                className="flex-1 border-border text-white hover:bg-muted hover:border-muted-foreground/40"
                onClick={() => setShowManualForm(true)}
              >
                Add Manually
              </Button>
              <Button
                type="button"
                variant="outline"
                className="border-border text-white hover:bg-muted hover:border-muted-foreground/40"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          // Manual Form Interface
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white font-medium">Game Title</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Enter game title..."
                        className="bg-muted border-input text-white placeholder-slate-400 focus:border-blue-500"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white font-medium">Platform</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value || ""}>
                    <FormControl>
                      <SelectTrigger className="bg-muted border-input text-white focus:border-blue-500">
                        <SelectValue placeholder="Select Platform" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="bg-muted border-input">
                      <SelectItem value="PC">PC</SelectItem>
                      <SelectItem value="PlayStation 5">PlayStation 5</SelectItem>
                      <SelectItem value="Xbox Series X">Xbox Series X</SelectItem>
                      <SelectItem value="Nintendo Switch">Nintendo Switch</SelectItem>
                      <SelectItem value="Mobile">Mobile</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white font-medium">Status</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="bg-muted border-input text-white focus:border-blue-500">
                        <SelectValue placeholder="Select Status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="bg-muted border-input">
                      <SelectItem value="wishlist">Wishlist</SelectItem>
                      <SelectItem value="in_progress">Currently Playing</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="dropped">Dropped</SelectItem>
                      <SelectItem value="on_hold">On Hold</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="imageUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white font-medium">Game Image URL</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Image URL (auto-filled from search)"
                      className="bg-muted border-input text-white placeholder-slate-400 focus:border-blue-500"
                    />
                  </FormControl>
                  <FormMessage />
                  {field.value && (
                    <div className="mt-2">
                      <img 
                        src={field.value} 
                        alt="Game preview" 
                        className="w-16 h-20 rounded object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                </FormItem>
              )}
            />

            <div>
              <label className="block text-sm font-medium text-white mb-2">Rating</label>
              <div className="flex items-center space-x-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    className={cn(
                      "text-2xl transition-colors",
                      selectedRating >= star ? "text-yellow-400" : "text-muted-foreground/70 hover:text-yellow-400"
                    )}
                    onClick={() => setSelectedRating(star)}
                  >
                    <Star className="w-6 h-6" fill={selectedRating >= star ? "currentColor" : "none"} />
                  </button>
                ))}
              </div>
            </div>

              <div className="flex space-x-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  className="border-border text-white hover:bg-muted hover:border-muted-foreground/40"
                  onClick={() => setShowManualForm(false)}
                >
                  ← Back to Search
                </Button>
                <Button
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                  disabled={createGameMutation.isPending}
                >
                  {createGameMutation.isPending ? "Adding..." : "Add Game"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="border-border text-white hover:bg-muted hover:border-muted-foreground/40"
                  onClick={() => onOpenChange(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}
