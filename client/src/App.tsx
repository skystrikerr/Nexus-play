import React from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { useAuth } from "@/hooks/useAuth";
import { useMobile, useCapacitor } from "@/hooks/useMobile";
import MobileLayout from "@/components/mobile-layout";
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
import Analytics from "@/pages/analytics";
import NotFound from "@/pages/not-found";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();
  const isMobile = useMobile();

  const AppContent = () => (
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
          <Route path="/analytics" component={Analytics} />
        </>
      )}
      <Route component={NotFound} />
    </Switch>
  );

  // For authenticated users, wrap with mobile layout
  if (isAuthenticated && !isLoading) {
    return (
      <MobileLayout>
        <AppContent />
      </MobileLayout>
    );
  }

  // For non-authenticated users, show without layout
  return <AppContent />;
}

function App() {
  const isCapacitor = useCapacitor();

  // Initialize Capacitor when running in native app
  React.useEffect(() => {
    if (isCapacitor) {
      import('./utils/capacitor').then(({ initializeCapacitor }) => {
        initializeCapacitor();
      });
    }
  }, [isCapacitor]);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="dark" storageKey="nexusplay-ui-theme">
        <TooltipProvider>
          <div className="min-h-screen bg-background text-foreground">
            <Toaster />
            <Router />
          </div>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
