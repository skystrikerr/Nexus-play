import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Gamepad2, Users, Link, ExternalLink } from "lucide-react";
import { SiXbox, SiSteam } from "react-icons/si";

interface XboxConnectionData {
  accessToken: string;
  gamertag: string;
}

interface SteamConnectionData {
  steamId: string;
  apiKey?: string;
}

export function XboxSteamConnect() {
  const [xboxData, setXboxData] = useState<XboxConnectionData>({ accessToken: "", gamertag: "" });
  const [steamData, setSteamData] = useState<SteamConnectionData>({ steamId: "", apiKey: "" });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const connectXboxMutation = useMutation({
    mutationFn: (data: XboxConnectionData) => apiRequest("POST", "/api/auth/connect/xbox", data),
    onSuccess: () => {
      toast({
        title: "Xbox Live Connected!",
        description: "Your Xbox Live account has been successfully linked.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
    },
    onError: (error: any) => {
      toast({
        title: "Xbox Connection Failed",
        description: error.message || "Failed to connect Xbox Live account",
        variant: "destructive",
      });
    },
  });

  const connectSteamMutation = useMutation({
    mutationFn: (data: SteamConnectionData) => apiRequest("POST", "/api/auth/connect/steam", data),
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

  const handleXboxConnect = (e: React.FormEvent) => {
    e.preventDefault();
    if (!xboxData.accessToken || !xboxData.gamertag) {
      toast({
        title: "Missing Information",
        description: "Please provide both Xbox access token and gamertag",
        variant: "destructive",
      });
      return;
    }
    connectXboxMutation.mutate(xboxData);
  };

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

  const handleSteamLogin = () => {
    window.location.href = "/api/auth/steam";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      <div className="container mx-auto max-w-4xl py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            Connect Gaming Platforms
          </h1>
          <p className="text-gray-300">
            Link your Xbox and Steam accounts to sync your gaming library
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Xbox Live Connection */}
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <div className="flex items-center gap-3">
                <SiXbox className="h-8 w-8 text-green-400" />
                <div>
                  <CardTitle className="text-white">Xbox Live</CardTitle>
                  <CardDescription className="text-gray-400">
                    Connect your Xbox Live account to sync achievements and games
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <form onSubmit={handleXboxConnect} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="gamertag" className="text-gray-300">Gamertag</Label>
                  <Input
                    id="gamertag"
                    placeholder="Enter your Xbox gamertag"
                    value={xboxData.gamertag}
                    onChange={(e) => setXboxData(prev => ({ ...prev, gamertag: e.target.value }))}
                    className="bg-slate-700 border-slate-600 text-white placeholder:text-gray-400"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="xbox-token" className="text-gray-300">Access Token</Label>
                  <Input
                    id="xbox-token"
                    type="password"
                    placeholder="Paste your Xbox Live access token"
                    value={xboxData.accessToken}
                    onChange={(e) => setXboxData(prev => ({ ...prev, accessToken: e.target.value }))}
                    className="bg-slate-700 border-slate-600 text-white placeholder:text-gray-400"
                    required
                  />
                  <p className="text-xs text-gray-400">
                    Get your token from Xbox Live authentication flow
                  </p>
                </div>

                <Button 
                  type="submit" 
                  className="w-full bg-green-600 hover:bg-green-700"
                  disabled={connectXboxMutation.isPending}
                >
                  <SiXbox className="mr-2 h-4 w-4" />
                  {connectXboxMutation.isPending ? "Connecting..." : "Connect Xbox Live"}
                </Button>
              </form>

              <Separator className="bg-slate-600" />
              
              <div className="text-center">
                <p className="text-sm text-gray-400 mb-2">Need help getting your token?</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open('https://developer.microsoft.com/en-us/games/xbox/xbox-live', '_blank')}
                  className="text-gray-300 border-gray-600 hover:bg-slate-700"
                >
                  <ExternalLink className="mr-2 h-3 w-3" />
                  Xbox Live Documentation
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Steam Connection */}
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <div className="flex items-center gap-3">
                <SiSteam className="h-8 w-8 text-blue-400" />
                <div>
                  <CardTitle className="text-white">Steam</CardTitle>
                  <CardDescription className="text-gray-400">
                    Connect your Steam account to sync your game library
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Steam OAuth Login */}
              <Button 
                onClick={handleSteamLogin}
                className="w-full bg-blue-600 hover:bg-blue-700 mb-4"
              >
                <SiSteam className="mr-2 h-4 w-4" />
                Sign in with Steam
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <Separator className="bg-slate-600" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-slate-800 px-2 text-gray-400">Or Connect Manually</span>
                </div>
              </div>

              <form onSubmit={handleSteamConnect} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="steam-id" className="text-gray-300">Steam ID</Label>
                  <Input
                    id="steam-id"
                    placeholder="Enter your Steam ID (17-digit number)"
                    value={steamData.steamId}
                    onChange={(e) => setSteamData(prev => ({ ...prev, steamId: e.target.value }))}
                    className="bg-slate-700 border-slate-600 text-white placeholder:text-gray-400"
                    required
                  />
                  <p className="text-xs text-gray-400">
                    Find your Steam ID in your profile URL or use steamid.io
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="steam-api-key" className="text-gray-300">Steam API Key (Optional)</Label>
                  <Input
                    id="steam-api-key"
                    type="password"
                    placeholder="Your personal Steam API key"
                    value={steamData.apiKey}
                    onChange={(e) => setSteamData(prev => ({ ...prev, apiKey: e.target.value }))}
                    className="bg-slate-700 border-slate-600 text-white placeholder:text-gray-400"
                  />
                  <p className="text-xs text-gray-400">
                    Provides access to private profile data and enhanced features
                  </p>
                </div>

                <Button 
                  type="submit" 
                  variant="outline"
                  className="w-full border-blue-600 text-blue-400 hover:bg-blue-600 hover:text-white"
                  disabled={connectSteamMutation.isPending}
                >
                  <Link className="mr-2 h-4 w-4" />
                  {connectSteamMutation.isPending ? "Connecting..." : "Connect Manually"}
                </Button>
              </form>

              <Separator className="bg-slate-600" />
              
              <div className="text-center">
                <p className="text-sm text-gray-400 mb-2">Need a Steam API key?</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open('https://steamcommunity.com/dev/apikey', '_blank')}
                  className="text-gray-300 border-gray-600 hover:bg-slate-700"
                >
                  <ExternalLink className="mr-2 h-3 w-3" />
                  Get Steam API Key
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mt-8 text-center">
          <Card className="bg-slate-800/30 border-slate-700 inline-block">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 text-gray-300">
                <Users className="h-5 w-5 text-purple-400" />
                <span className="text-sm">
                  Connected accounts will sync your gaming library and enable cross-platform activity tracking
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}