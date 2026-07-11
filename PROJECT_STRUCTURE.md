# NexusPlay Project Structure Guide

This guide explains the purpose of every file and folder in your project.

## 📁 Root Directory Files

### Configuration Files
- **`package.json`** - Lists all Node.js dependencies and defines scripts to run the app (`npm run dev`, `npm run build`)
- **`tsconfig.json`** - TypeScript compiler configuration for type checking
- **`vite.config.ts`** - Vite bundler configuration for building the frontend
- **`tailwind.config.ts`** - Tailwind CSS configuration for styling utilities
- **`postcss.config.js`** - PostCSS configuration for processing CSS
- **`drizzle.config.ts`** - Database ORM configuration for PostgreSQL
- **`capacitor.config.ts`** - Capacitor configuration for mobile app builds (Android)
- **`components.json`** - shadcn/ui component library configuration

### Documentation Files
- **`README.md`** - Project overview, setup instructions, and scripts
- **`design_guidelines.md`** - UI/UX design system and color guidelines (Neo Spectrum Nexus theme)
- **`MOBILE_SETUP.md`** - Instructions for building and deploying the Android mobile app
- **`PROJECT_STRUCTURE.md`** - This file! Complete project structure documentation

---

## 📁 `/client` - Frontend Application

The client folder contains all your React frontend code that runs in the browser.

### `/client/index.html`
- Entry HTML file - the single page that loads your React app

### `/client/src/main.tsx`
- Application entry point - mounts the React app to the DOM

### `/client/src/App.tsx`
- Main app component - defines all routes (pages) using wouter router
- Sets up the global layout and navigation structure

### `/client/src/index.css`
- Global CSS styles including Tailwind imports
- Custom CSS variables for the Neo Spectrum Nexus color system
- Mobile-specific styles for Capacitor

---

## 📁 `/client/src/pages` - All Page Components

Each file represents a different page/route in your app:

### Core Pages
- **`landing.tsx`** - Landing page shown to non-logged-in users
- **`auth.tsx`** - Login/signup page with email/password authentication
- **`dashboard.tsx`** - Main dashboard showing activity overview, stats, and urgent tasks
- **`not-found.tsx`** - 404 error page

### Activity Management
- **`game-library.tsx`** - View and manage all your games
- **`wishlist.tsx`** - Games and activities you want to try
- **`game-backlog.tsx`** - Plan and prioritize games you want to play
- **`calendar.tsx`** - Calendar view of all activity sessions
- **`journal.tsx`** - Daily journal entries for activity sessions
- **`tier-list.tsx`** - Create and manage custom ranking lists for games

### Task & Time Management
- **`tasks.tsx`** - Task management with priorities, due dates, and completion tracking
- **`analytics.tsx`** - Visual analytics and charts for your activities
- **`statistics.tsx`** - Detailed statistics breakdown by activity type

### Reviews & Social
- **`reviews.tsx`** - Your reviews of completed activities
- **`users.tsx`** - Browse community users and communities
- **`user-profile.tsx`** - View other users' public profiles
- **`posts.tsx`** - Social posts and community feed
- **`profile.tsx`** - Your own profile settings
- **`settings.tsx`** - App settings and preferences

### Gaming Platforms
- **`gaming-platforms.tsx`** - Connect Steam/Xbox accounts for game library sync

### Other
- **`premium.tsx`** - Premium/subscription page (currently free app)
- **`subscribe.tsx`** - Subscription management page

---

## 📁 `/client/src/components` - Reusable Components

### `/components/ui/` - shadcn/ui Components
Pre-built, customizable UI components from the shadcn/ui library:
- **Form elements**: `button.tsx`, `input.tsx`, `select.tsx`, `checkbox.tsx`, `switch.tsx`, `slider.tsx`, `textarea.tsx`
- **Layout**: `card.tsx`, `dialog.tsx`, `sheet.tsx`, `tabs.tsx`, `separator.tsx`
- **Navigation**: `navigation-menu.tsx`, `menubar.tsx`, `breadcrumb.tsx`, `pagination.tsx`
- **Feedback**: `toast.tsx`, `alert.tsx`, `progress.tsx`
- **Data display**: `table.tsx`, `avatar.tsx`, `badge.tsx`, `calendar.tsx`, `chart.tsx`
- **Overlays**: `popover.tsx`, `dropdown-menu.tsx`, `tooltip.tsx`, `hover-card.tsx`, `context-menu.tsx`
- **Other**: `accordion.tsx`, `collapsible.tsx`, `carousel.tsx`, `command.tsx`, `drawer.tsx`, `resizable.tsx`, `scroll-area.tsx`, `skeleton.tsx`, `toggle.tsx`

### Custom Application Components
- **`app-layout.tsx`** - Unified app shell: desktop sidebar with grouped navigation, mobile header + bottom tab bar, and user menu
- **`page-header.tsx`** - Shared page header (title, subtitle, action buttons) used by all pages
- **`activity-card.tsx`** - Card displaying activity info (games, books, etc.)
- **`game-card.tsx`** - Specialized card for game display
- **`task-card.tsx`** - Card for displaying tasks
- **`activity-calendar.tsx`** - Calendar component showing activities
- **`gaming-calendar.tsx`** - Gaming-specific calendar view
- **`guest-mode-banner.tsx`** - Banner shown to guest users

### Modal Components
- **`add-activity-modal.tsx`** - Form to add new activities
- **`add-game-modal.tsx`** - Form to add new games (with RAWG API search)
- **`add-task-modal.tsx`** - Form to create new tasks
- **`calendar-day-modal.tsx`** - Modal showing details for a calendar day
- **`completion-modal.tsx`** - Celebration modal when completing activities
- **`change-password-modal.tsx`** - Form to change user password
- **`time-log-modal.tsx`** - Form to log time spent on activities
- **`date-time-log-modal.tsx`** - Form to log time for a specific date

### Timer Components
- **`activity-timer.tsx`** - Timer for tracking activity sessions
- **`active-timer-widget.tsx`** - Widget showing active timers
- **`timer-button.tsx`** - Button to start/stop timers

---

## 📁 `/client/src/hooks` - Custom React Hooks

Reusable logic that can be shared across components:

- **`useAuth.ts`** - Hook to check if user is logged in and get user data
- **`useTimer.ts`** - Hook to manage activity timers
- **`useMobile.ts`** - Hook to detect if user is on mobile device
- **`use-mobile.tsx`** - Alternative mobile detection hook
- **`use-toast.ts`** - Hook to show toast notifications

---

## 📁 `/client/src/lib` - Utility Libraries

Helper functions and configurations:

- **`queryClient.ts`** - TanStack Query configuration for API calls and caching
- **`utils.ts`** - General utility functions (e.g., classname merging)
- **`authUtils.ts`** - Authentication helper functions
- **`rawg-api.ts`** - Functions to fetch game data from RAWG API

---

## 📁 `/client/src/contexts` - React Contexts

Global state providers:

- **`ThemeContext.tsx`** - Theme provider for dark/light mode (currently dark only)

---

## 📁 `/client/src/utils` - Frontend Utilities

- **`capacitor.ts`** - Capacitor-specific utilities for mobile app features

---

## 📁 `/server` - Backend Application

The server folder contains all your Express.js backend code.

### Core Server Files
- **`index.ts`** - Main server entry point, starts Express server on port 5000
- **`routes.ts`** - All API endpoints (e.g., `/api/activities`, `/api/sessions`, `/api/tasks`)
- **`vite.ts`** - Integration between Express server and Vite dev server

### Authentication
- **`auth.ts`** - Authentication middleware and session management

### Database
- **`db.ts`** - PostgreSQL database connection using Drizzle ORM
- **`storage.ts`** - Database storage interface and PostgreSQL implementation
- **`guestData.ts`** - In-memory storage for guest users (non-logged-in)

### Storage
- **`objectStorage.ts`** - Object storage (cloud file storage) integration

---

## 📁 `/shared` - Shared Code

Code shared between frontend and backend:

- **`schema.ts`** - Database schema definitions using Drizzle ORM
  - Defines all tables: users, activities, sessions, tasks, journal entries, ranking lists, reviews, posts, etc.
  - Defines TypeScript types for all data models
  - Defines Zod validation schemas for API requests

---

## 📁 `/android` - Mobile App

Contains Android-specific files for the Capacitor mobile app build.
- Generated by Capacitor CLI
- You typically don't edit these files directly
- See `MOBILE_SETUP.md` for building the Android app

---

## 🔄 How the App Works

### Starting the App
1. Run `npm install` to install dependencies
2. Run `npm run dev` to start both frontend and backend servers
3. Frontend runs on Vite dev server, backend on Express port 5000

### Data Flow
```
User Browser (React)
    ↓ (API request via TanStack Query)
Express Server (/server/routes.ts)
    ↓ (calls storage interface)
PostgreSQL Database (via Drizzle ORM)
    ↓ (returns data)
Express Server
    ↓ (JSON response)
User Browser (React updates UI)
```

### Building for Production
- Frontend: `npm run build` creates optimized build in `/dist`
- Backend: Bundled with esbuild
- Mobile: Use Capacitor CLI to build Android APK

---

## 🎨 Tech Stack Summary

- **Frontend**: React 18 + TypeScript + Vite
- **UI Library**: shadcn/ui (Radix UI primitives) + Tailwind CSS
- **Routing**: wouter
- **State Management**: TanStack Query
- **Forms**: React Hook Form + Zod validation
- **Backend**: Express.js + TypeScript
- **Database**: PostgreSQL via Neon Database
- **ORM**: Drizzle ORM
- **Authentication**: Express sessions + Passport.js
- **Mobile**: Capacitor (Android)
- **External APIs**: RAWG (game database)

---

## 🚀 Key npm Scripts

```bash
npm install          # Install dependencies
npm run dev          # Start development server (frontend + backend)
npm run build        # Build for production
npm run db:push      # Push database schema changes
npm run db:studio    # Open Drizzle Studio (database GUI)
```

---

## 📝 Local Development Setup

To work on this project locally:

1. **Clone/download** your project files
2. **Install Node.js** (v18 or higher)
3. **Create `.env` file** with:
   ```
   DATABASE_URL=your_postgresql_connection_string
   SESSION_SECRET=your_random_secret
   STRIPE_SECRET_KEY=your_stripe_key (if using payments)
   ```
4. **Run `npm install`** to install dependencies
5. **Run `npm run dev`** to start development
6. **Edit files** in VS Code, Cursor, or your preferred editor
7. **Database changes**: Edit `shared/schema.ts`, then run `npm run db:push`

---

## 🎯 Common Customization Points

- **Add new page**: Create file in `/client/src/pages/`, register route in `/client/src/App.tsx`
- **Add API endpoint**: Add route in `/server/routes.ts`, add storage method in `/server/storage.ts`
- **Add database table**: Add to `/shared/schema.ts`, run `npm run db:push`
- **Change colors**: Edit `/client/src/index.css` (CSS variables)
- **Add UI component**: Use `/client/src/components/ui/` components or create new in `/client/src/components/`

---

This structure allows NexusPlay to be a full-stack, type-safe application that works on web and mobile!
