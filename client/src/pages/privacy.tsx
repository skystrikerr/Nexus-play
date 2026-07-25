import { Link } from "wouter";
import { Gamepad2 } from "lucide-react";

const LAST_UPDATED = "July 17, 2026";

export default function Privacy() {
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

        <h1 className="text-3xl font-display font-bold text-foreground mb-2">Privacy Policy</h1>
        <p className="text-sm text-muted-foreground mb-8">Last updated: {LAST_UPDATED}</p>

        <div className="space-y-6 text-muted-foreground leading-relaxed [&_h2]:text-foreground [&_h2]:font-display [&_h2]:font-semibold [&_h2]:text-lg [&_h2]:mb-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1">
          <section>
            <h2>The short version</h2>
            <p>
              NexusPlay collects the minimum needed to run a game tracker: your email, a
              username, and the gaming data you choose to add. We don't sell your data, we don't
              run ad trackers, and your library is private by default.
            </p>
          </section>

          <section>
            <h2>What we collect</h2>
            <ul>
              <li>
                <span className="text-foreground">Account info:</span> email address, username,
                optional first/last name, and a securely hashed password (we never store your
                actual password).
              </li>
              <li>
                <span className="text-foreground">Your tracking data:</span> games, ratings,
                tier lists, play sessions, reviews, and posts you create.
              </li>
              <li>
                <span className="text-foreground">Optional connections:</span> if you sign in
                with Google we receive your name, email, and profile photo from Google. If you
                connect Steam or Xbox, we store the IDs and tokens needed to sync your playtime.
              </li>
              <li>
                <span className="text-foreground">Cookies:</span> a single session cookie that
                keeps you logged in. No advertising or cross-site tracking cookies.
              </li>
            </ul>
          </section>

          <section>
            <h2>What we do with it</h2>
            <p>
              We use your data to run the service — showing you your library, syncing playtime,
              sending password-reset emails, and displaying content you've chosen to make
              public. That's it. We do not sell or rent personal data to anyone.
            </p>
          </section>

          <section>
            <h2>What's visible to others</h2>
            <p>
              Your profile and library are <span className="text-foreground">private by
              default</span>. Other users can only see: posts you publish to the community feed,
              reviews you make public, and your profile if you switch it to public in settings.
              Guest visitors get a temporary sandbox that no one else can see, which is deleted
              automatically.
            </p>
          </section>

          <section>
            <h2>Services we rely on</h2>
            <p>These providers process data on our behalf to keep NexusPlay running:</p>
            <ul>
              <li>Render (application hosting)</li>
              <li>Neon (database hosting)</li>
              <li>RAWG (game database — your game searches are sent to their API)</li>
              <li>Resend (transactional email, e.g. password resets)</li>
              <li>Google (only if you choose "Sign in with Google")</li>
              <li>Steam / Xbox APIs (only if you connect those accounts)</li>
            </ul>
          </section>

          <section>
            <h2>Data retention & deletion</h2>
            <p>
              We keep your data for as long as your account exists. To delete your account and
              all associated data, email{" "}
              <a href="mailto:camdenharkins24@gmail.com" className="text-primary hover:underline">
                camdenharkins24@gmail.com
              </a>{" "}
              from your account's email address and we'll remove it. Guest sandboxes delete
              themselves automatically within hours.
            </p>
          </section>

          <section>
            <h2>Security</h2>
            <p>
              Passwords are hashed with bcrypt, connections are encrypted with HTTPS, login
              attempts are rate-limited, and each user's data is isolated at the database level.
              No system is perfectly secure, but we take reasonable measures to protect yours.
            </p>
          </section>

          <section>
            <h2>Children</h2>
            <p>
              NexusPlay is not directed at children under 13, and we don't knowingly collect
              their data. If you believe a child has created an account, contact us and we'll
              delete it.
            </p>
          </section>

          <section>
            <h2>Changes</h2>
            <p>
              If this policy changes in a meaningful way (for example, if advertising is ever
              introduced), we'll update this page and the date above before the change takes
              effect.
            </p>
          </section>
        </div>

        <div className="mt-10 pt-6 border-t border-border/60 flex gap-6 text-sm">
          <Link href="/terms">
            <span className="text-primary hover:underline cursor-pointer">Terms of Use</span>
          </Link>
          <Link href="/">
            <span className="text-muted-foreground hover:text-foreground cursor-pointer">Back to NexusPlay</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
