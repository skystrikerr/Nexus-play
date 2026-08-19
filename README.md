# NexusPlay

So this is nexus play just a personal full-stack activity tracker I hacked together to keep track of literally everything in one spot. Games, study sessions, work grind, workouts, reading lists, and random hobbies. It's got built-in timers, task lists, stats, a calendar view, and even some community stuff like posts, reviews, and profiles if you're into that.

Game details and covers pull straight from the RAWG database, and you can link your Steam or Xbox accounts to pull your library in automatically.

⚠️ **Just a quick warning:** It's still super early in development and definitely needs a ton of work, but it's totally solid enough for personal daily use.

## Stack breakdown

* **Frontend:** React 18 + TypeScript, Vite, Tailwind CSS, shadcn/ui, TanStack Query, wouter
* **Backend:** Express + TypeScript, Passport (local + Google OAuth), express-session with a PostgreSQL session store
* **Database:** PostgreSQL (Neon) using Drizzle ORM
* **Apps:** Capacitor for Android and Electron for desktop

## How to get it running

1. Grab Node.js 18+ if you haven't already, then run `npm install`.
2. Drop a `.env` file in the root folder looking something like this:
```env
DATABASE_URL=postgresql://...         # pretty mandatory
SESSION_SECRET=<long random string>     # also mandatory
RAWG_API_KEY=<your key>                 # for game search (get a free one at rawg.io/apidocs)
GOOGLE_CLIENT_ID=...                    # optional (Google login)
GOOGLE_CLIENT_SECRET=...                # optional (Google login)
BREVO_API_KEY=...                       # email stuff (free, works for anyone)
RESEND_API_KEY=...                      # backup email (owner only until your domain is verified)
EMAIL_FROM="NexusPlay <you@domain>"     # sender address on reset emails
APP_URL=https://yourdomain.com          # where password resets point

```


3. Push the database schema: `npm run db:push`
4. Fire it up: `npm run dev` (runs at http://localhost:5000)

*(Pro tip: If you don't bother setting up `RESEND_API_KEY`, password reset links just spit out into your server console instead. Way easier for local testing anyway.)*

## Useful Scripts

| Command | What it actually does |
| --- | --- |
| `npm run dev` | Boots up the dev server (API + client together on port 5000) |
| `npm run build` | Bundles the whole thing for production into `dist/` |
| `npm run start` | Runs the production build |
| `npm run check` | Runs a quick TypeScript check so nothing's broken |
| `npm run db:push` | Pushes any schema updates to the DB |
| `npm run electron:build` | Packages up the Windows desktop app |

## Deploying it for free

There's a `render.yaml` file in the repo if you want to throw it up on Render's free tier without headaches:

1. Push the code up to GitHub.
2. Go to [render.com](https://render.com), hit **New → Blueprint**, and pick your repo.
3. Plug in the environment variables it asks for (`DATABASE_URL`, `RAWG_API_KEY`, plus whatever optional ones you want).
4. Once it finishes its first deploy, make sure you update `APP_URL` to match your actual Render URL so password reset links don't break.

Keep in mind Render's free tier falls asleep after 15 minutes of nothing happening, so the first time you hit it after a break, it'll take like a minute to wake back up.

Take a peek at [PROJECT_STRUCTURE.md](https://www.google.com/search?q=PROJECT_STRUCTURE.md) if you want to poke around the codebase, or [MOBILE_SETUP.md](https://www.google.com/search?q=MOBILE_SETUP.md) if you're trying to get the Android version built.
