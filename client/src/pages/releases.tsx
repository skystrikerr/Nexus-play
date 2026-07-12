import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import { CalendarClock, Heart, Star, Gamepad2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import PageHeader from "@/components/page-header";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { RawgGame } from "@/lib/rawg-api";
import type { Activity } from "@shared/schema";

interface ReleasesResponse {
  count: number;
  results: RawgGame[];
}

export default function Releases() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery<ReleasesResponse>({
    queryKey: ["/api/rawg/releases"],
    staleTime: 1000 * 60 * 60, // releases don't change often — cache for an hour
  });

  const { data: myGames = [] } = useQuery<Activity[]>({
    queryKey: ["/api/games"],
  });

  const wishlistedRawgIds = new Set(
    myGames
      .map((g) => (g.metadata as any)?.rawgId)
      .filter((id) => id !== undefined)
  );

  const addToWishlistMutation = useMutation({
    mutationFn: (game: RawgGame) =>
      apiRequest("POST", "/api/activities", {
        title: game.name,
        type: "game",
        category: game.genres?.[0]?.name || "Upcoming",
        imageUrl: game.background_image || undefined,
        status: "wishlist",
        progress: 0,
        totalHours: 0,
        metadata: {
          rawgId: game.id,
          releaseDate: game.released,
          platforms: game.platforms?.map((p) => p.platform.name) || [],
        },
      }),
    onSuccess: (_res, game) => {
      queryClient.invalidateQueries({ queryKey: ["/api/activities"] });
      queryClient.invalidateQueries({ queryKey: ["/api/games"] });
      toast({
        title: "Added to Wishlist",
        description: `${game.name} is on your wishlist.`,
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Couldn't add that game. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleWishlist = (game: RawgGame) => {
    if ((user as any)?.isGuest) {
      toast({
        title: "Guest mode is read-only",
        description: "Create a free account to build your wishlist!",
      });
      return;
    }
    addToWishlistMutation.mutate(game);
  };

  // Group releases by month
  const releases = data?.results?.filter((g) => g.released) || [];
  const byMonth = releases.reduce<Record<string, RawgGame[]>>((acc, game) => {
    const month = format(parseISO(game.released!), "MMMM yyyy");
    (acc[month] = acc[month] || []).push(game);
    return acc;
  }, {});

  return (
    <>
      <PageHeader
        title="Release Calendar"
        subtitle="What's coming out in the next three months"
      />

      <div className="px-4 sm:px-6 lg:px-8 py-6 space-y-8">
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="shimmer rounded-xl h-64" />
            ))}
          </div>
        ) : releases.length === 0 ? (
          <div className="glass-glow rounded-xl p-12 text-center">
            <CalendarClock className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-muted-foreground">
              Couldn't load upcoming releases right now. Try again in a bit.
            </p>
          </div>
        ) : (
          Object.entries(byMonth).map(([month, games]) => (
            <section key={month}>
              <h2 className="text-lg font-display font-semibold text-foreground mb-4 flex items-center gap-2">
                <CalendarClock className="w-5 h-5 text-primary" />
                {month}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {games.map((game) => {
                  const onWishlist = wishlistedRawgIds.has(game.id);
                  return (
                    <div key={game.id} className="glass rounded-xl overflow-hidden hover-lift">
                      {game.background_image ? (
                        <div className="aspect-video relative overflow-hidden">
                          <img
                            src={game.background_image}
                            alt={game.name}
                            loading="lazy"
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                          <div className="absolute bottom-2 left-3 right-3 flex items-end justify-between gap-2">
                            <span className="text-white font-semibold text-sm drop-shadow">
                              {format(parseISO(game.released!), "MMM d")}
                            </span>
                            {game.metacritic && (
                              <Badge className="bg-emerald-500/80 text-white border-0">
                                {game.metacritic}
                              </Badge>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="aspect-video bg-muted flex items-center justify-center">
                          <Gamepad2 className="w-10 h-10 text-muted-foreground/40" />
                        </div>
                      )}

                      <div className="p-4">
                        <h3 className="font-semibold text-foreground truncate">{game.name}</h3>
                        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                          {game.genres?.[0] && <span>{game.genres[0].name}</span>}
                          {game.platforms && game.platforms.length > 0 && (
                            <span className="truncate">
                              · {game.platforms.slice(0, 3).map((p) => p.platform.name).join(", ")}
                              {game.platforms.length > 3 && " +"}
                            </span>
                          )}
                        </div>

                        <Button
                          size="sm"
                          disabled={onWishlist || addToWishlistMutation.isPending}
                          onClick={() => handleWishlist(game)}
                          className={
                            onWishlist
                              ? "mt-3 w-full bg-muted text-muted-foreground"
                              : "mt-3 w-full bg-gradient-aurora text-white hover:opacity-90"
                          }
                        >
                          <Heart className="w-4 h-4 mr-2" />
                          {onWishlist ? "On Your Wishlist" : "Add to Wishlist"}
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          ))
        )}
      </div>
    </>
  );
}
