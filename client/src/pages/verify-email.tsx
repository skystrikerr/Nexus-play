import { useEffect, useState } from "react";
import { Link } from "wouter";
import { Gamepad2, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiRequest, queryClient } from "@/lib/queryClient";

type Status = "working" | "done" | "failed";

export default function VerifyEmail() {
  const [status, setStatus] = useState<Status>("working");
  const [message, setMessage] = useState("Confirming your email…");

  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get("token");
    if (!token) {
      setStatus("failed");
      setMessage("This link is missing its confirmation code.");
      return;
    }

    apiRequest("POST", "/api/auth/verify-email", { token })
      .then(async (res) => {
        const body = await res.json().catch(() => ({}));
        setStatus("done");
        setMessage(body.message || "Email confirmed. Thanks!");
        // Refresh the cached user so the banner disappears
        queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      })
      .catch((err: any) => {
        setStatus("failed");
        setMessage(
          String(err?.message || "").includes("expired")
            ? "This link is invalid or has expired. You can send a new one from the banner in the app."
            : "We couldn't confirm this link. It may have already been used or expired."
        );
      });
  }, []);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at 20% 10%, rgba(20, 184, 166, 0.12) 0%, transparent 55%), radial-gradient(ellipse at 80% 90%, rgba(139, 92, 246, 0.10) 0%, transparent 55%)",
        }}
      />

      <div className="relative w-full max-w-md text-center">
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-9 h-9 bg-gradient-aurora rounded-xl flex items-center justify-center shadow-lg shadow-primary/25">
            <Gamepad2 className="w-5 h-5 text-white" />
          </div>
          <span className="text-lg font-display font-bold tracking-tight">
            <span className="text-foreground">Nexus</span>
            <span className="text-gradient-aurora">Play</span>
          </span>
        </div>

        <div className="glass rounded-2xl p-8">
          {status === "working" && (
            <Loader2 className="w-12 h-12 text-primary mx-auto mb-4 animate-spin" />
          )}
          {status === "done" && (
            <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-4" />
          )}
          {status === "failed" && <XCircle className="w-12 h-12 text-destructive mx-auto mb-4" />}

          <h1 className="text-xl font-display font-semibold text-foreground mb-2">
            {status === "working" && "Just a moment"}
            {status === "done" && "You're all set"}
            {status === "failed" && "Couldn't confirm"}
          </h1>
          <p className="text-muted-foreground mb-6">{message}</p>

          <Link href="/">
            <Button className="bg-gradient-aurora text-white hover:opacity-90">
              Go to NexusPlay
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
