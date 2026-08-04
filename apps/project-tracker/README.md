# Project Tracker

A standalone app for tracking everything you have going, with a progress bar on every project.
It lives beside NexusPlay in this repo but shares none of its code, server, or database — it is
its own app with its own dependencies.

## Running it

```bash
cd apps/project-tracker
npm install
npm run dev      # http://localhost:5180
```

| Command | Purpose |
| --- | --- |
| `npm run dev` | Dev server with hot reload |
| `npm run build` | Type check, then build to `dist/` |
| `npm run preview` | Serve the production build |
| `npm run check` | TypeScript only |

`npm run build` produces a plain static site in `dist/` — drop it on Netlify, Vercel, GitHub Pages,
or any static host. There is no backend to deploy.

## How progress works

Each project can get its percentage one of two ways:

- **From tasks** (default) — add a checklist and the bar fills as you tick items off. A project set
  to this mode that has no tasks yet falls back to the manual slider, so the bar is never stuck at 0.
- **Manual** — you set the percentage yourself with a slider. Good for things that don't break down
  into a checklist ("Learn Rust", "Read 20 books").

Switch modes any time from the project's edit dialog.

## What's in it

- Projects with name, description, status (planning / active / paused / done), color, and due date
- Per-project task checklists, added and ticked off inline on the card
- Dashboard tiles: project count, average progress, tasks done, paused projects
- Search across project names, descriptions, and task text
- Filter by status, sort by recently updated / name / progress / due date
- Overdue due dates called out in red
- Archive instead of delete, with an archived view; delete asks first
- Light and dark themes, remembered
- Export/import JSON backups

## Where the data lives

In your browser's `localStorage`, under `project-tracker:v1`. That means no account and no server,
but also that the data belongs to one browser on one device. **Export** writes a JSON file you can
back up or import into another browser.

Anything read back from storage (or an imported file) is validated field by field, so a truncated
or hand-edited file degrades to "skip the bad records" rather than a blank screen.

## Stack

React 18, TypeScript, Vite, Tailwind CSS, lucide-react. No backend, no state library, no UI kit.

```
src/
  App.tsx              layout, filtering, sorting, dialogs
  types.ts             Project/Task shapes, status + accent tables
  hooks/useProjects.ts state and every mutation, persisted on change
  lib/progress.ts      the tasks-vs-manual percentage rules
  lib/storage.ts       localStorage read/write, validation, export/import, samples
  lib/format.ts        due-date and relative-time formatting
  components/          ProjectCard, ProjectDialog, TaskList, ProgressBar, StatsRow, Modal
```
