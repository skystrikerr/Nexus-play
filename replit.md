# Game Tracker Application

## Overview

This is a full-stack web application for tracking games and gaming sessions. It's built with a React frontend using Vite, an Express.js backend, and is designed to use PostgreSQL with Drizzle ORM. The application allows users to manage their game library, track gaming sessions, view statistics, and visualize their gaming activity through a calendar interface.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and optimized builds
- **UI Library**: shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with a dark gaming theme
- **State Management**: TanStack Query for server state management
- **Routing**: Wouter for lightweight client-side routing
- **Form Handling**: React Hook Form with Zod validation

### Backend Architecture
- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js for REST API endpoints
- **Database ORM**: Drizzle ORM for type-safe database operations
- **Validation**: Zod schemas for request/response validation
- **Storage**: In-memory storage implementation with interface for future database integration

### Data Storage Solutions
- **Database**: PostgreSQL (configured via Drizzle)
- **Connection**: Neon Database serverless connection
- **Schema Management**: Drizzle migrations in `./migrations` directory
- **Current Implementation**: Memory-based storage for development with database interface ready

## Key Components

### Database Schema
The application defines two main entities:
- **Games**: Stores game information including title, platform, genre, status, rating, progress, and hours played
- **Gaming Sessions**: Tracks individual gaming sessions with duration, date, and notes linked to specific games

### API Endpoints
- `GET/POST /api/games` - Game library management
- `GET/POST/PUT/DELETE /api/games/:id` - Individual game operations
- `GET/POST /api/sessions` - Gaming session management
- `GET /api/sessions/game/:gameId` - Sessions for specific games
- `GET /api/sessions/date/:date` - Sessions for specific dates
- `GET /api/stats` - Gaming statistics and analytics

### Frontend Pages
- **Dashboard**: Overview with recent games, statistics, and calendar widget
- **Game Library**: Full game collection with search and filtering
- **Calendar**: Visual representation of gaming sessions over time
- **Individual Game Views**: Detailed game information and session history

### UI Components
- **GameCard**: Displays game information with status, progress, and ratings
- **AddGameModal**: Form for adding new games to the library
- **GamingCalendar**: Calendar view showing gaming activity
- **Sidebar**: Navigation between different sections

## Data Flow

1. **Game Management**: Users can add games through a modal form that validates input using Zod schemas
2. **Session Tracking**: Gaming sessions are created and linked to games, storing duration and notes
3. **Statistics**: The system calculates various metrics like total games, completed games, and hours played
4. **Real-time Updates**: TanStack Query provides optimistic updates and cache management
5. **Data Persistence**: Currently uses in-memory storage, ready to switch to PostgreSQL database

## External Dependencies

### Core Framework Dependencies
- React ecosystem (React, React DOM, React Router via Wouter)
- Vite build system with React plugin
- Express.js for backend API

### UI and Styling
- Radix UI components for accessible primitives
- Tailwind CSS for utility-first styling
- shadcn/ui component library
- Lucide React for icons

### Database and Validation
- Drizzle ORM for database operations
- Neon Database for PostgreSQL hosting
- Zod for schema validation
- drizzle-zod for schema integration

### Development Tools
- TypeScript for type safety
- ESBuild for server bundling
- PostCSS for CSS processing

## Deployment Strategy

### Development Environment
- **Frontend**: Vite dev server with HMR
- **Backend**: tsx for TypeScript execution with nodemon-like reloading
- **Database**: PostgreSQL via Neon Database connection
- **Environment**: Replit-optimized with cartographer plugin

### Production Build
- **Frontend**: Vite builds to `dist/public` directory
- **Backend**: ESBuild bundles server to `dist/index.js`
- **Static Files**: Express serves built frontend files
- **Database**: PostgreSQL with Drizzle migrations

### Configuration
- **Database URL**: Required via `DATABASE_URL` environment variable
- **Build Scripts**: Separate development and production scripts
- **Type Checking**: TypeScript compiler for validation
- **Database Migrations**: Drizzle push command for schema updates

The application is structured as a monorepo with shared TypeScript types between client and server, enabling type-safe full-stack development. The current implementation uses in-memory storage but is architected to easily switch to PostgreSQL when the database is provisioned.