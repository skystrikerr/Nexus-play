import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { MailWarning, X } from "lucide-react";

/**
 * Soft nudge for accounts whose email hasn't been confirmed yet.
 * Verification is intentionally non-blocking — the app stays fully usable.
 */
export default function VerifyEmailBanner() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [dismissed, setDismissed] = useState(false);

  const resendMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/auth/resend-verification", {}),
    onSuccess: async (res) => {
      const body = await res.json().catch(() => ({}));
      toast({
        title: "Check your inbox",
        description: body.message || "Confirmation email sent.",
      });
    },
    onError: () => {
      toast({
        title: "Couldn't send",
        description: "Please try again in a few minutes.",
        variant: "destructive",
      });
    },
  });

  const u = user as any;
  if (!u || u.isGuest || u.emailVerified || dismissed) return null;

  return (
    <div className="glass border-b border-border/60 px-4 py-2.5">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <MailWarning className="w-4 h-4 text-warning shrink-0" />
          <p className="text-sm text-muted-foreground truncate">
            <span className="font-medium text-foreground">Confirm your email</span>
            <span className="hidden md:inline"> — we sent a link to {u.email}.</span>
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button
            size="sm"
            variant="ghost"
            className="text-primary hover:text-primary/80"
            disabled={resendMutation.isPending}
            onClick={() => resendMutation.mutate()}
          >
            {resendMutation.isPending ? "Sending…" : "Resend"}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="text-muted-foreground hover:text-foreground"
            onClick={() => setDismissed(true)}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
