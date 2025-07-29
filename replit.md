# NexusPlay Application

## Overview

NexusPlay is a full-stack web application for tracking various activities including games, study sessions, work projects, exercise, reading, and hobbies. Originally designed as a game tracker, it has been transformed into a comprehensive multi-user activity monitoring system with social features. Built with React frontend using Vite, Express.js backend, and PostgreSQL with Drizzle ORM. The application allows users to manage their activity library, track sessions across different activity types, view comprehensive statistics, visualize their activity through a calendar interface, and discover what other users in the community are working on. Each activity can have custom images for better visual identification.

## User Preferences

Preferred communication style: Simple, everyday language.
Feature requirements: Multi-activity tracking beyond games (study, work, exercise, etc.) with image support for activities.
App name: NexusPlay (changed from Activity Tracker in January 2025)
API Integration: RAWG gaming database for automatic game data and cover art (January 2025)

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
- **Current Implementation**: PostgreSQL database with user authentication via Replit Auth
- **Authentication**: Multi-user support with Replit OpenID Connect authentication
- **User Management**: Public/private profiles, user directory, social activity viewing

## Key Components

### Database Schema
The application defines two main entities with enhanced flexibility:
- **Activities**: Universal activity storage supporting multiple types (games, study, work, exercise, reading, hobbies, other) with fields including:
  - Basic info: title, type, category, subcategory, status, rating, progress, totalHours
  - Visual: imageUrl for custom activity images
  - Metadata: description, tags array, flexible metadata JSON field, externalId for API integration
- **Activity Sessions**: Tracks individual activity sessions with enhanced fields:
  - Core: activityId, date, duration, notes
  - Enhanced: quality rating (1-5), location tracking
  - Backward compatibility maintained for gaming sessions

### API Endpoints
**New Activity Management:**
- `GET/POST /api/activities` - Universal activity management with type filtering
- `GET/POST/PUT/DELETE /api/activities/:id` - Individual activity operations
- `GET /api/activities?type=game` - Filter activities by type (game, study, work, etc.)

**Enhanced Sessions:**
- `GET/POST /api/sessions` - Activity session management with quality and location tracking
- `GET /api/sessions?activityId=:id` - Sessions for specific activities
- `GET /api/sessions?date=:date` - Sessions for specific dates
- `GET /api/sessions?gameId=:id` - Backward compatibility for gaming sessions

**Comprehensive Statistics:**
- `GET /api/stats` - Multi-activity statistics with type breakdown
- `GET /api/stats?type=game` - Type-specific statistics

**Backward Compatibility:**
- All original `/api/games` endpoints maintained for seamless transition
- Game-specific queries automatically filter to type='game'

### Frontend Pages
- **Dashboard**: Time management hub with urgent tasks, recent activities across all types, comprehensive statistics, and calendar widget
- **Task Manager**: Dedicated task management page with priority filtering, due date sorting, completion tracking, and statistics
- **Activity Library**: Full activity collection with search, filtering by type and status
- **Calendar**: Visual representation of all activity sessions over time with type differentiation
- **Individual Activity Views**: Detailed activity information and session history
- **Activity Management**: Enhanced forms supporting all activity types with image upload/URL support

### Enhanced Features Added (January 2025)
- **Multi-Activity Support**: Expanded from games-only to support study, work, exercise, reading, hobbies, and custom activities
- **Task Management System**: Comprehensive task management with priority levels, due dates, estimated hours
- **Time Management Hub**: Dashboard redesigned to serve as unified time management platform
- **Image Integration**: Full support for activity images via URL with preview functionality
- **Enhanced Session Tracking**: Added quality ratings and location tracking for sessions
- **Flexible Metadata**: JSON metadata field and tagging system for extensible activity data
- **Comprehensive Statistics**: Type-based breakdowns showing activity distribution across categories
- **Smart Activity Forms**: Context-aware forms that adapt labels and options based on activity type
- **User Authentication**: Implemented Replit Auth with secure multi-user support
- **Social Features**: User profiles, community directory, ability to view others' public activities
- **Timer System**: Built-in activity timers with session completion tracking
- **Database Migration**: Moved from memory storage to PostgreSQL with proper user isolation
- **RAWG API Integration**: Automatic game data and cover art fetching from 500,000+ game database
- **Smart Game Search**: Real-time search with rich game details, ratings, and automatic form filling
- **Task Management Interface**: Dedicated task page with filtering, priority sorting, and completion tracking
- **Urgent Task Dashboard**: Dashboard shows urgent/overdue tasks prominently

### UI Components
- **ActivityCard (formerly GameCard)**: Universal activity display supporting all types with image preview, status, progress, and ratings
- **TaskCard**: Specialized task display with priority indicators, due dates, completion status, and timer integration
- **AddActivityModal**: Comprehensive form for adding any activity type with smart field adaptation and image support
- **AddTaskModal**: Dedicated task creation form with priority levels, due dates, estimated hours, and categorization
- **AddGameModal**: Maintained for backward compatibility, now uses activity system internally
- **GamingCalendar**: Enhanced to show all activity types with visual differentiation
- **Sidebar**: Navigation supporting the expanded activity ecosystem including dedicated task management
- **Tasks Page**: Full-featured task management interface with filtering, sorting, and statistics

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

The application is structured as a monorepo with shared TypeScript types between client and server, enabling type-safe full-stack development. It now uses PostgreSQL database with full user authentication, social features, and proper data isolation between users. The app has been renamed to NexusPlay to reflect its evolution into a comprehensive social activity tracking platform.