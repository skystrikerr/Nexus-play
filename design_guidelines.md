# NexusPlay Gaming Tracker - Design Guidelines

## Design Approach

**Selected Approach:** Reference-Based (Gaming Platform Hybrid)
Drawing inspiration from Steam's content density + Discord's dark UI patterns + Xbox Game Pass's card-based game displays. Gaming interfaces prioritize visual hierarchy, quick scanning, and immersive dark themes that reduce eye strain during extended sessions.

**Core Principle:** High-contrast, information-dense design that celebrates game visuals while maintaining readability and scanability.

## Typography System

**Primary Font:** Inter (Google Fonts) - Clean, modern, excellent readability
**Accent Font:** Rajdhani (Google Fonts) - Bold, geometric, gaming aesthetic for headers

**Hierarchy:**
- Page Titles: Rajdhani Bold, 48px (3rem), uppercase, tracking-wide
- Section Headers: Rajdhani Bold, 32px (2rem), uppercase
- Card Titles: Inter Semibold, 20px (1.25rem)
- Body Text: Inter Regular, 16px (1rem)
- Metadata/Stats: Inter Medium, 14px (0.875rem)
- Labels: Inter Medium, 12px (0.75rem), uppercase, tracking-wider

## Layout System

**Spacing Primitives:** Tailwind units of 2, 4, 6, 8, 12, 16
- Micro spacing (within components): 2, 4
- Component padding: 6, 8
- Section spacing: 12, 16
- Page margins: 16

**Grid System:**
- Dashboard: 12-column grid with 16px gaps
- Game cards: 4-column on desktop (3-column tablet, 1-column mobile)
- Tier rows: Full-width with horizontal scroll for overflow
- Sidebar: Fixed 280px width on desktop, slide-out on mobile

**Container Strategy:**
- Main content: max-w-7xl with px-6 padding
- Sidebar navigation: Fixed left, full height
- Header: Sticky top with backdrop-blur

## Component Library

### Navigation
**Top Bar:** Fixed header (h-16) with logo left, search bar center, user profile/notifications right. Black background with subtle red underline on active items.

**Sidebar:** Vertical nav with icon + label format. Icons from Heroicons. Sections: Dashboard, My Games, Tier Lists, Statistics, Friends, Settings. Red accent bar on active item.

### Game Cards
**Standard Card:** 
- Aspect ratio 3:4 game cover image
- Gradient overlay (black 0% to black 80% bottom)
- Title overlaid at bottom with white text
- Hover: Red border glow, slight scale (1.02)
- Metadata below image: Platform icons, playtime, last played

**Tier List Card:**
- Horizontal card format
- Game cover thumbnail (80x80px) left
- Title and metadata center
- Drag handle icon right
- Red accent line separating tiers

### Tier List System
**Tier Rows:**
- Tier label badge left (S, A, B, C, D, F) - Red background for S-tier, gradient fade for others
- Horizontal scrollable game container
- Drop zone highlights with red dashed border
- Empty state shows dotted outline with "+ Add Games" text

**Tier Controls:**
- Color picker for tier customization
- Tier label text input
- Add/remove tier buttons (red accent)

### Dashboard Widgets
**Stats Cards:**
- 4-column grid layout
- Large number display (Rajdhani, 36px)
- Label below (uppercase)
- Icon top-right corner
- Subtle red gradient background on hover

**Activity Feed:**
- Timeline layout with red vertical line
- Activity items with timestamps
- Game thumbnails (48x48px circles)
- Action descriptions in white text

**Recently Played:**
- Horizontal carousel with 5 visible cards
- Smooth scroll with arrow navigation
- Auto-scrolling pause on hover

### Forms & Inputs
**Search Bar:**
- Rounded-full, black background
- White text with placeholder gray-400
- Red focus ring
- Search icon (Heroicons) left, clear button right

**Text Inputs:**
- Black background, white text
- Red bottom border (2px) on focus
- Label above with red asterisk for required

**Buttons:**
- Primary: Red background, white text, rounded-lg, px-8 py-3
- Secondary: Black background, white text, red border (2px)
- Tertiary: Transparent, white text, red underline on hover
- All buttons: Semibold Inter, tracking-wide, uppercase at 14px

**Dropdowns/Selects:**
- Black background, red caret icon
- White text, red border on open
- Options menu with red highlight on hover

### Modals & Overlays
**Modal:**
- Black background with red border (2px)
- Centered, max-w-2xl
- Backdrop: Black with 80% opacity, blur
- Close button: Top-right, white X with red on hover

**Toast Notifications:**
- Bottom-right positioning
- Black background, white text
- Red left border (4px) for errors, green for success
- Auto-dismiss after 5 seconds

### Data Visualization
**Progress Bars:**
- Black background track
- Red fill with gradient (hsl(0, 100%, 50%) to hsl(0, 100%, 40%))
- Rounded-full, h-2
- Percentage label right-aligned

**Charts:**
- Red primary color for data points
- White grid lines (opacity 10%)
- Black background
- Tooltips: Black background, white text, red border

## Animations

**Sparingly Used:**
- Card hover: transform scale(1.02), duration 200ms
- Tier drag: opacity 50% while dragging
- Page transitions: None (instant for gaming responsiveness)
- Modals: Fade in 150ms
- Toasts: Slide from right, 200ms

## Images Section

**Game Cover Images:**
- Source: IGDB API or game cover CDN
- Placement: Game cards, tier list thumbnails, activity feed
- Format: WebP with JPG fallback
- Sizes: Card covers (300x400px), thumbnails (80x80px), feed icons (48x48px)

**Hero Section:** 
**No large hero image.** This is a dashboard app, not a marketing site. Main view opens directly to user's dashboard with game library and tier lists immediately visible.

**Background Treatments:**
- Subtle noise texture overlay (5% opacity) on black backgrounds
- Diagonal stripe pattern (very subtle, 2% opacity) in empty states
- Game cover blurred backgrounds for modals/detailed views (blur-3xl)

**User-Generated:**
- Profile avatars: Circular, 40px (small), 64px (medium), 128px (large)
- Game screenshots: User uploads for activity sharing, 16:9 aspect ratio