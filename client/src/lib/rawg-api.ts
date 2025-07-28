const RAWG_API_KEY = "cd4d0e08df4c4eaca4158f8fbbe212f8";
const RAWG_BASE_URL = "https://api.rawg.io/api";

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
    // Try different search approaches for better results
    const searchUrl = `${RAWG_BASE_URL}/games?key=${RAWG_API_KEY}&search=${encodeURIComponent(query)}&page_size=12&ordering=-rating,-added`;
    
    const response = await fetch(searchUrl);

    if (!response.ok) {
      console.warn(`RAWG API responded with status: ${response.status}`);
      // Still try to return the response if it's not a complete failure
      if (response.status === 429) {
        console.warn("Rate limited by RAWG API");
      }
      if (response.status < 500) {
        try {
          const data = await response.json();
          return data || { count: 0, results: [] };
        } catch {
          return { count: 0, results: [] };
        }
      }
      throw new Error(`RAWG API error: ${response.status}`);
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
    const response = await fetch(
      `${RAWG_BASE_URL}/games/${gameId}?key=${RAWG_API_KEY}`
    );

    if (!response.ok) {
      throw new Error(`RAWG API error: ${response.status}`);
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