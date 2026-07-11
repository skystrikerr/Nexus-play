// Game data comes from the RAWG database, proxied through our own server so
// the API key stays server-side (see /api/rawg routes in server/routes.ts).

export interface RawgGame {
  id: number;
  name: string;
  background_image: string | null;
  released: string | null;
  rating: number;
  genres: Array<{ id: number; name: string }>;
  platforms: Array<{
    platform: { id: number; name: string };
  }>;
  description_raw?: string;
  metacritic?: number;
}

export interface GameSearchResult {
  count: number;
  results: RawgGame[];
}

export async function searchGames(query: string): Promise<GameSearchResult> {
  if (!query.trim() || query.length < 2) {
    return { count: 0, results: [] };
  }

  try {
    const response = await fetch(`/api/rawg/search?q=${encodeURIComponent(query)}`, {
      credentials: "include",
    });

    if (!response.ok) {
      console.warn(`Game search responded with status: ${response.status}`);
      return { count: 0, results: [] };
    }

    const data = await response.json();
    return data || { count: 0, results: [] };
  } catch (error) {
    console.error("Error searching games:", error);
    return { count: 0, results: [] };
  }
}

export async function getGameDetails(gameId: number): Promise<RawgGame | null> {
  try {
    const response = await fetch(`/api/rawg/games/${gameId}`, {
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error(`Game details error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching game details:", error);
    return null;
  }
}

export function mapRawgToActivity(rawgGame: RawgGame) {
  return {
    title: rawgGame.name,
    type: "game" as const,
    category: rawgGame.genres?.[0]?.name || "Action",
    imageUrl: rawgGame.background_image || undefined,
    description: rawgGame.description_raw || undefined,
    rating: Math.round(rawgGame.rating),
    status: "wishlist" as const,
    progress: 0,
    totalHours: 0,
    metadata: {
      rawgId: rawgGame.id,
      releaseDate: rawgGame.released,
      metacritic: rawgGame.metacritic,
      platforms: rawgGame.platforms?.map(p => p.platform.name) || [],
    }
  };
}
