import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { X, UserPlus, LogIn } from "lucide-react";
import { useState } from "react";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";

export default function GuestModeBanner() {
  const [dismissed, setDismissed] = useState(false);
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  
  const { data: user } = useQuery({
    queryKey: ["/api/auth/user"],
  });

  const logoutMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/auth/logout", {}),
    onSuccess: () => {
      queryClient.clear();
      setLocation("/auth");
    },
  });

  // Only show for guest users and if not dismissed
  if (!user || !(user as any).isGuest || dismissed) {
    return null;
  }

  return (
    <div className="glass border-b border-border/60 px-4 py-2.5 relative">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <span className="hidden sm:inline-flex w-2 h-2 rounded-full bg-gradient-aurora shrink-0" />
          <p className="text-sm text-muted-foreground truncate">
            <span className="font-medium text-foreground">Guest mode</span>
            <span className="hidden md:inline"> — create a free account to save your progress.</span>
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            onClick={() => {
              logoutMutation.mutate();
            }}
            size="sm"
            variant="ghost"
            className="text-muted-foreground hover:text-foreground"
            data-testid="button-signin-from-guest"
          >
            <LogIn className="w-4 h-4 mr-2" />
            Sign In
          </Button>
          <Button
            onClick={() => {
              logoutMutation.mutate();
            }}
            size="sm"
            className="bg-gradient-aurora text-white hover:opacity-90"
            data-testid="button-signup-from-guest"
          >
            <UserPlus className="w-4 h-4 mr-2" />
            Sign Up
          </Button>
          <Button
            onClick={() => setDismissed(true)}
            size="sm"
            variant="ghost"
            className="text-muted-foreground hover:text-foreground"
            data-testid="button-dismiss-guest-banner"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
