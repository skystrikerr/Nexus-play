import { useState } from "react";
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
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertActivitySchema, ACTIVITY_TYPES } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Star, X } from "lucide-react";
import { cn } from "@/lib/utils";
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

  // Search games from external API
  const { data: searchResults } = useQuery<{results: any[]}>({
    queryKey: ["/api/search-games", searchQuery],
    enabled: searchQuery.length > 2,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

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
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add game. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: FormData) => {
    const submitData = {
      ...data,
      rating: selectedRating || undefined,
    };
    createGameMutation.mutate(submitData);
  };

  const handleGameSelect = (game: any) => {
    form.setValue("title", game.name);
    form.setValue("category", game.platforms?.[0]?.platform?.name || "");
    form.setValue("subcategory", game.genres?.[0]?.name || "");
    form.setValue("imageUrl", game.background_image || "");
    form.setValue("externalId", game.id.toString());
    form.setValue("description", game.short_screenshots?.[0]?.image || "");
    setSearchQuery(game.name);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-dark-surface border-slate-700 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-white">Add New Game</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-slate-300">Game Title</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        {...field}
                        placeholder="Search for a game..."
                        className="bg-dark-bg border-slate-600 text-white"
                        value={searchQuery}
                        onChange={(e) => {
                          setSearchQuery(e.target.value);
                          field.onChange(e.target.value);
                        }}
                      />
                      {searchResults?.results && searchQuery.length > 2 && (
                        <div className="absolute top-full left-0 right-0 bg-dark-bg border border-slate-600 rounded-lg mt-1 max-h-48 overflow-y-auto z-10">
                          {searchResults.results.slice(0, 5).map((game: any) => (
                            <button
                              key={game.id}
                              type="button"
                              className="w-full text-left px-3 py-2 hover:bg-slate-700 flex items-center space-x-3"
                              onClick={() => handleGameSelect(game)}
                            >
                              {game.background_image && (
                                <img
                                  src={game.background_image}
                                  alt={game.name}
                                  className="w-8 h-8 rounded object-cover"
                                />
                              )}
                              <div>
                                <div className="text-white text-sm">{game.name}</div>
                                <div className="text-slate-400 text-xs">
                                  {game.genres?.map((g: any) => g.name).join(", ")}
                                </div>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
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
                  <FormLabel className="text-slate-300">Platform</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="bg-dark-bg border-slate-600 text-white">
                        <SelectValue placeholder="Select Platform" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="bg-dark-bg border-slate-600">
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
                  <FormLabel className="text-slate-300">Status</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="bg-dark-bg border-slate-600 text-white">
                        <SelectValue placeholder="Select Status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="bg-dark-bg border-slate-600">
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

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Rating</label>
              <div className="flex items-center space-x-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    className={cn(
                      "text-2xl transition-colors",
                      selectedRating >= star ? "text-yellow-400" : "text-slate-600 hover:text-yellow-400"
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
                type="submit"
                className="flex-1 bg-primary hover:bg-primary/80"
                disabled={createGameMutation.isPending}
              >
                {createGameMutation.isPending ? "Adding..." : "Add Game"}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="border-slate-600 text-slate-300 hover:bg-slate-700"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
