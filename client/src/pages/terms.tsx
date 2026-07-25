import { Link } from "wouter";
import { Gamepad2 } from "lucide-react";

const LAST_UPDATED = "July 17, 2026";

export default function Terms() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
        <Link href="/">
          <div className="flex items-center gap-3 mb-8 cursor-pointer w-fit">
            <div className="w-9 h-9 bg-gradient-aurora rounded-xl flex items-center justify-center shadow-lg shadow-primary/25">
              <Gamepad2 className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-display font-bold tracking-tight">
              <span className="text-foreground">Nexus</span>
              <span className="text-gradient-aurora">Play</span>
            </span>
          </div>
        </Link>

        <h1 className="text-3xl font-display font-bold text-foreground mb-2">Terms of Use</h1>
        <p className="text-sm text-muted-foreground mb-8">Last updated: {LAST_UPDATED}</p>

        <div className="space-y-6 text-muted-foreground leading-relaxed [&_h2]:text-foreground [&_h2]:font-display [&_h2]:font-semibold [&_h2]:text-lg [&_h2]:mb-2">
          <section>
            <h2>1. What NexusPlay is</h2>
            <p>
              NexusPlay is a free game-tracking service: a library for the games you play, tier
              lists, a release calendar, play-session tracking, and a small community feed. The
              service is currently in beta, which means things may change, break, or be reset as
              it improves.
            </p>
          </section>

          <section>
            <h2>2. Your account</h2>
            <p>
              You need an account to save your data. You're responsible for keeping your password
              private and for everything that happens under your account. You must be at least 13
              years old (or the minimum age required in your country) to create an account. Guest
              mode is available without an account — guest data is temporary and is deleted
              automatically.
            </p>
          </section>

          <section>
            <h2>3. Your content</h2>
            <p>
              Anything you add — games, ratings, tier lists, reviews, and posts — remains yours.
              By posting to public areas (the community feed, public reviews, or a public
              profile), you give NexusPlay permission to display that content to other users.
              Don't post anything illegal, hateful, harassing, or that you don't have the right
              to share. We can remove content or suspend accounts that break these rules.
            </p>
          </section>

          <section>
            <h2>4. Third-party data</h2>
            <p>
              Game titles, cover art, and release dates come from the RAWG video game database.
              Optional Steam and Xbox connections pull playtime data from those platforms.
              NexusPlay is not affiliated with or endorsed by RAWG, Valve, Microsoft, or any game
              publisher; game artwork belongs to its respective owners.
            </p>
          </section>

          <section>
            <h2>5. No warranty</h2>
            <p>
              NexusPlay is provided "as is", free of charge, without warranties of any kind. We
              do our best to keep the service available and your data safe, but we can't
              guarantee uninterrupted service or that data will never be lost — please don't use
              NexusPlay as the only copy of anything important to you.
            </p>
          </section>

          <section>
            <h2>6. Limitation of liability</h2>
            <p>
              To the maximum extent permitted by law, NexusPlay and its creator are not liable
              for any indirect, incidental, or consequential damages arising from your use of
              the service.
            </p>
          </section>

          <section>
            <h2>7. Ending or changing the service</h2>
            <p>
              You can delete your account at any time by contacting us. We may suspend accounts
              that violate these terms, and we may modify or discontinue features (or the
              service) — if we ever shut down for good, we'll make reasonable efforts to give
              notice first.
            </p>
          </section>

          <section>
            <h2>8. Changes to these terms</h2>
            <p>
              We may update these terms as the service evolves. The "last updated" date at the
              top will always reflect the current version, and continued use after changes means
              you accept them.
            </p>
          </section>

          <section>
            <h2>9. Contact</h2>
            <p>
              Questions about these terms? Reach out at{" "}
              <a href="mailto:camdenharkins24@gmail.com" className="text-primary hover:underline">
                camdenharkins24@gmail.com
              </a>
              .
            </p>
          </section>
        </div>

        <div className="mt-10 pt-6 border-t border-border/60 flex gap-6 text-sm">
          <Link href="/privacy">
            <span className="text-primary hover:underline cursor-pointer">Privacy Policy</span>
          </Link>
          <Link href="/">
            <span className="text-muted-foreground hover:text-foreground cursor-pointer">Back to NexusPlay</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
