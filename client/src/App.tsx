import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import { Landing } from "@/pages/landing";
import { Auth } from "@/pages/auth";
import { XboxSteamConnect } from "@/pages/xbox-steam-connect";
import Dashboard from "@/pages/dashboard";
import GameLibrary from "@/pages/game-library";
import Calendar from "@/pages/calendar";
import Statistics from "@/pages/statistics";
import Wishlist from "@/pages/wishlist";
import { Users } from "@/pages/users";
import { UserProfile } from "@/pages/user-profile";
import Settings from "@/pages/settings";
import Tasks from "@/pages/tasks";
import NotFound from "@/pages/not-found";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <Switch>
      <Route path="/auth" component={Auth} />
      <Route path="/connect-platforms" component={XboxSteamConnect} />
      {isLoading || !isAuthenticated ? (
        <Route path="/" component={Landing} />
      ) : (
        <>
          <Route path="/" component={Dashboard} />
          <Route path="/tasks" component={Tasks} />
          <Route path="/library" component={GameLibrary} />
          <Route path="/calendar" component={Calendar} />
          <Route path="/stats" component={Statistics} />
          <Route path="/wishlist" component={Wishlist} />
          <Route path="/users" component={Users} />
          <Route path="/users/:id" component={UserProfile} />
          <Route path="/settings" component={Settings} />
        </>
      )}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="min-h-screen bg-dark-bg text-slate-100">
          <Toaster />
          <Router />
        </div>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
