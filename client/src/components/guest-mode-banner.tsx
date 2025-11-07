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
    <div className="bg-gradient-to-r from-red-600 to-red-800 text-white px-4 py-3 relative">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1">
          <div className="flex-1">
            <p className="font-medium">You're in Guest Mode</p>
            <p className="text-sm text-white/90">
              Create a free account to save your progress and access all features!
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            onClick={() => {
              logoutMutation.mutate();
            }}
            size="sm"
            variant="outline"
            className="bg-transparent border-white text-white hover:bg-white/20"
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
            className="bg-white text-red-600 hover:bg-white/90"
            data-testid="button-signup-from-guest"
          >
            <UserPlus className="w-4 h-4 mr-2" />
            Sign Up
          </Button>
          <Button
            onClick={() => setDismissed(true)}
            size="sm"
            variant="ghost"
            className="text-white hover:bg-white/20"
            data-testid="button-dismiss-guest-banner"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
