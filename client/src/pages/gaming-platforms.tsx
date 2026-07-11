import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { SiSteam } from "react-icons/si";
import { FaXbox } from "react-icons/fa";
import { Link, ExternalLink, RefreshCw, Trophy } from "lucide-react";

interface SteamConnectionData {
  steamId: string;
  apiKey: string;
}

interface XboxConnectionData {
  gamertag: string;
  accessToken: string;
}

export function GamingPlatforms() {
  const [steamData, setSteamData] = useState<SteamConnectionData>({ steamId: "", apiKey: "" });
  const [xboxData, setXboxData] = useState<XboxConnectionData>({ gamertag: "", accessToken: "" });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get current user data to check connected platforms
  const { data: user } = useQuery({
    queryKey: ["/api/auth/user"],
  });

  const connectSteamMutation = useMutation({
    mutationFn: (data: SteamConnectionData) => apiRequest("POST", "/api/gaming/connect/steam", data),
    onSuccess: () => {
      toast({
        title: "Steam Connected!",
        description: "Your Steam account has been successfully linked.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
    },
    onError: (error: any) => {
      toast({
        title: "Steam Connection Failed",
        description: error.message || "Failed to connect Steam account",
        variant: "destructive",
      });
    },
  });

  const connectXboxMutation = useMutation({
    mutationFn: (data: XboxConnectionData) => apiRequest("POST", "/api/gaming/connect/xbox", data),
    onSuccess: () => {
      toast({
        title: "Xbox Connected!",
        description: "Your Xbox account has been successfully linked.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
    },
    onError: (error: any) => {
      toast({
        title: "Xbox Connection Failed",
        description: error.message || "Failed to connect Xbox account",
        variant: "destructive",
      });
    },
  });

  const syncSteamGamesMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/gaming/sync/steam"),
    onSuccess: (data: any) => {
      toast({
        title: "Steam Games Synced!",
        description: `Added ${data.gamesAdded} new games to your library.`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/activities"] });
    },
    onError: (error: any) => {
      toast({
        title: "Steam Sync Failed",
        description: error.message || "Failed to sync Steam games",
        variant: "destructive",
      });
    },
  });

  const syncXboxGamesMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/gaming/sync/xbox"),
    onSuccess: (data: any) => {
      toast({
        title: "Xbox Games Synced!",
        description: `Added ${data.gamesAdded} new games to your library.`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/activities"] });
    },
    onError: (error: any) => {
      toast({
        title: "Xbox Sync Failed", 
        description: error.message || "Failed to sync Xbox games",
        variant: "destructive",
      });
    },
  });

  const handleSteamConnect = (e: React.FormEvent) => {
    e.preventDefault();
    if (!steamData.steamId) {
      toast({
        title: "Missing Information",
        description: "Please provide your Steam ID",
        variant: "destructive",
      });
      return;
    }
    connectSteamMutation.mutate(steamData);
  };

  const handleXboxConnect = (e: React.FormEvent) => {
    e.preventDefault();
    if (!xboxData.gamertag || !xboxData.accessToken) {
      toast({
        title: "Missing Information",
        description: "Please provide both Xbox gamertag and access token",
        variant: "destructive",
      });
      return;
    }
    connectXboxMutation.mutate(xboxData);
  };

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6">
      <div className="container mx-auto max-w-4xl">
        <div className="text-center mb-8 pt-2">
          <h1 className="text-2xl sm:text-3xl font-display font-bold tracking-tight text-foreground mb-2">
            Gaming Platforms
          </h1>
          <p className="text-muted-foreground text-sm">
            Connect your gaming accounts to track progress and achievements
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Steam Connection */}
          <Card className="glass border-border/60">
            <CardHeader>
              <div className="flex items-center gap-3">
                <SiSteam className="h-8 w-8 text-sky-400" />
                <div>
                  <CardTitle className="text-foreground">Steam</CardTitle>
                  <CardDescription className="text-muted-foreground">
                    Connect your Steam account to sync games and achievements
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <form onSubmit={handleSteamConnect} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="steam-id" className="text-muted-foreground">Steam ID</Label>
                  <Input
                    id="steam-id"
                    placeholder="Enter your Steam ID (17-digit number)"
                    value={steamData.steamId}
                    onChange={(e) => setSteamData(prev => ({ ...prev, steamId: e.target.value }))}
                    className="bg-muted border-input text-foreground placeholder:text-muted-foreground/60"
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Find your Steam ID in your profile URL or use steamid.io
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="steam-api-key" className="text-muted-foreground">Steam API Key</Label>
                  <Input
                    id="steam-api-key"
                    type="password"
                    placeholder="Your Steam API key"
                    value={steamData.apiKey}
                    onChange={(e) => setSteamData(prev => ({ ...prev, apiKey: e.target.value }))}
                    className="bg-muted border-input text-foreground placeholder:text-muted-foreground/60"
                  />
                  <p className="text-xs text-muted-foreground">
                    Required for accessing your game library and achievements
                  </p>
                </div>

                <Button 
                  type="submit" 
                  className="w-full bg-gradient-aurora text-white hover:opacity-90"
                  disabled={connectSteamMutation.isPending}
                >
                  <Link className="mr-2 h-4 w-4" />
                  {connectSteamMutation.isPending ? "Connecting..." : "Connect Steam"}
                </Button>
              </form>

              {user?.steamId && (
                <>
                  <Separator className="bg-border" />
                  
                  <div className="text-center space-y-3">
                    <p className="text-sm text-green-400">✓ Steam account connected</p>
                    <Button
                      onClick={() => syncSteamGamesMutation.mutate()}
                      variant="outline"
                      disabled={syncSteamGamesMutation.isPending}
                      className="w-full text-foreground border-border hover:bg-muted"
                    >
                      <RefreshCw className="mr-2 h-4 w-4" />
                      {syncSteamGamesMutation.isPending ? "Syncing..." : "Sync Steam Games"}
                    </Button>
                    
                    <div>
                      <p className="text-sm text-gray-400 mb-2">Need a Steam API key?</p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open('https://steamcommunity.com/dev/apikey', '_blank')}
                        className="text-muted-foreground border-border hover:bg-muted"
                      >
                        <ExternalLink className="mr-2 h-3 w-3" />
                        Get Steam API Key
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Xbox Connection */}
          <Card className="glass border-border/60">
            <CardHeader>
              <div className="flex items-center gap-3">
                <FaXbox className="h-8 w-8 text-green-400" />
                <div>
                  <CardTitle className="text-foreground">Xbox Live</CardTitle>
                  <CardDescription className="text-muted-foreground">
                    Connect your Xbox account to track gaming progress
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <form onSubmit={handleXboxConnect} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="xbox-gamertag" className="text-muted-foreground">Xbox Gamertag</Label>
                  <Input
                    id="xbox-gamertag"
                    placeholder="Enter your Xbox Gamertag"
                    value={xboxData.gamertag}
                    onChange={(e) => setXboxData(prev => ({ ...prev, gamertag: e.target.value }))}
                    className="bg-muted border-input text-foreground placeholder:text-muted-foreground/60"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="xbox-token" className="text-muted-foreground">Xbox Access Token</Label>
                  <Input
                    id="xbox-token"
                    type="password"
                    placeholder="Xbox Live access token"
                    value={xboxData.accessToken}
                    onChange={(e) => setXboxData(prev => ({ ...prev, accessToken: e.target.value }))}
                    className="bg-muted border-input text-foreground placeholder:text-muted-foreground/60"
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Required for accessing your Xbox gaming data
                  </p>
                </div>

                <Button 
                  type="submit" 
                  className="w-full bg-green-600 hover:bg-green-700"
                  disabled={connectXboxMutation.isPending}
                >
                  <Link className="mr-2 h-4 w-4" />
                  {connectXboxMutation.isPending ? "Connecting..." : "Connect Xbox"}
                </Button>
              </form>

              {user?.xboxLiveId && (
                <>
                  <Separator className="bg-border" />
                  
                  <div className="text-center space-y-3">
                    <p className="text-sm text-green-400">✓ Xbox account connected</p>
                    <Button
                      onClick={() => syncXboxGamesMutation.mutate()}
                      variant="outline"
                      disabled={syncXboxGamesMutation.isPending}
                      className="w-full text-foreground border-border hover:bg-muted"
                    >
                      <RefreshCw className="mr-2 h-4 w-4" />
                      {syncXboxGamesMutation.isPending ? "Syncing..." : "Sync Xbox Games"}
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="mt-8 text-center">
          <Card className="glass border-border/60">
            <CardContent className="pt-6">
              <div className="flex items-center justify-center gap-2 text-muted-foreground mb-4">
                <Trophy className="h-5 w-5" />
                <span className="text-lg font-semibold">Achievement Tracking</span>
              </div>
              <p className="text-muted-foreground text-sm">
                Once connected, your games will automatically sync with achievement progress, 
                playtime statistics, and completion status from both platforms.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}