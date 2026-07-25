# NexusPlay

NexusPlay is a full-stack activity tracker: games, study sessions, work, exercise, reading, and hobbies in one library, with built-in session timers, tasks, statistics, a calendar view, and community features (posts, reviews, public profiles). Game data and cover art come from the RAWG database, and Steam/Xbox accounts can be linked for library sync.

## Tech Stack

- **Frontend:** React 18 + TypeScript, Vite, Tailwind CSS, shadcn/ui, TanStack Query, wouter
- **Backend:** Express + TypeScript, Passport (local + Google OAuth), express-session with a PostgreSQL session store
- **Database:** PostgreSQL (Neon) via Drizzle ORM
- **Mobile/Desktop:** Capacitor (Android) and Electron builds

## Getting Started

1. Install Node.js 18+ and run `npm install`
2. Create a `.env` file:

   ```
   DATABASE_URL=postgresql://...          # required
   SESSION_SECRET=<long random string>    # required
   RAWG_API_KEY=<your key>                # game search (free at rawg.io/apidocs)
   GOOGLE_CLIENT_ID=...                   # optional, Google sign-in
   GOOGLE_CLIENT_SECRET=...               # optional, Google sign-in
   BREVO_API_KEY=...                      # email provider (any recipient, free)
   RESEND_API_KEY=...                     # alt email provider (owner-only until domain verified)
   EMAIL_FROM="NexusPlay <you@domain>"    # sender shown on reset emails
   APP_URL=https://yourdomain.com         # used in password reset links
   ```

3. Push the schema: `npm run db:push`
4. Start the dev server: `npm run dev` → http://localhost:5000

Without `RESEND_API_KEY`, password reset links are printed to the server console instead of emailed (development fallback).

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Development server (API + client on port 5000) |
| `npm run build` | Production build to `dist/` |
| `npm run start` | Run the production build |
| `npm run check` | TypeScript type check |
| `npm run db:push` | Apply schema changes to the database |
| `npm run electron:build` | Windows desktop build |

## Deploying (free)

The repo includes a [render.yaml](render.yaml) blueprint for Render's free tier:

1. Push this repo to GitHub
2. On [render.com](https://render.com), choose **New → Blueprint** and pick the repo
3. Fill in the environment variables it asks for (`DATABASE_URL` from Neon, `RAWG_API_KEY`, and optionally the Resend/Google ones)
4. After the first deploy, set `APP_URL` to your Render URL (e.g. `https://nexusplay.onrender.com`) so password reset links point to the right place

The free tier sleeps after 15 minutes of inactivity; the first request afterwards takes up to a minute while it wakes.

See [PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md) for a full tour of the codebase and [MOBILE_SETUP.md](MOBILE_SETUP.md) for the Android build.
