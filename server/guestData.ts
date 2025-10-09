// Demo data for guest mode users
import type { Activity, Session } from "@shared/schema";

export const guestActivities: Activity[] = [
  {
    id: "demo-game-1",
    userId: "guest",
    type: "game",
    title: "Elden Ring",
    category: "RPG",
    subcategory: "Action RPG",
    status: "in_progress",
    progress: 65,
    rating: 5,
    totalHours: 87,
    imageUrl: "https://shared.cloudflare.steamstatic.com/store_item_assets/steam/apps/1245620/header.jpg",
    description: "An epic dark fantasy adventure",
    tags: ["souls-like", "open-world", "challenging"],
    metadata: {},
    externalId: null,
  },
  {
    id: "demo-game-2",
    userId: "guest",
    type: "game",
    title: "Baldur's Gate 3",
    category: "RPG",
    subcategory: "Turn-Based",
    status: "completed",
    progress: 100,
    rating: 5,
    totalHours: 156,
    imageUrl: "https://shared.cloudflare.steamstatic.com/store_item_assets/steam/apps/1086940/header.jpg",
    description: "The best D&D adventure in gaming",
    tags: ["d&d", "story-rich", "multiplayer"],
    metadata: {},
    externalId: null,
  },
  {
    id: "demo-game-3",
    userId: "guest",
    type: "game",
    title: "Hollow Knight",
    category: "Metroidvania",
    subcategory: "Platformer",
    status: "wishlist",
    progress: 0,
    rating: null,
    totalHours: 0,
    imageUrl: "https://shared.cloudflare.steamstatic.com/store_item_assets/steam/apps/367520/header.jpg",
    description: "Beautiful hand-drawn metroidvania",
    tags: ["metroidvania", "indie", "challenging"],
    metadata: {},
    externalId: null,
  },
  {
    id: "demo-task-1",
    userId: "guest",
    type: "study",
    title: "Complete React Course",
    category: "Programming",
    subcategory: "Web Development",
    status: "in_progress",
    progress: 45,
    rating: null,
    totalHours: 23,
    imageUrl: null,
    description: "Learning React fundamentals and advanced concepts",
    tags: ["react", "javascript", "web-dev"],
    metadata: {
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // Due in 1 week
      priority: "high",
      estimatedHours: 50
    },
    externalId: null,
  },
  {
    id: "demo-task-2",
    userId: "guest",
    type: "work",
    title: "Q4 Project Planning",
    category: "Project Management",
    subcategory: "Planning",
    status: "in_progress",
    progress: 30,
    rating: null,
    totalHours: 12,
    imageUrl: null,
    description: "Planning and roadmap for Q4 initiatives",
    tags: ["planning", "management", "strategy"],
    metadata: {
      dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), // Due in 2 days
      priority: "high",
      estimatedHours: 40
    },
    externalId: null,
  },
];

export const guestSessions: Session[] = [
  {
    id: "demo-session-1",
    activityId: "demo-game-1",
    userId: "guest",
    date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Yesterday
    duration: 3.5,
    notes: "Defeated the Fire Giant boss!",
    quality: 5,
    location: null,
  },
  {
    id: "demo-session-2",
    activityId: "demo-game-1",
    userId: "guest",
    date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 2 days ago
    duration: 4.0,
    notes: "Exploring the Mountaintops of the Giants",
    quality: 5,
    location: null,
  },
  {
    id: "demo-session-3",
    activityId: "demo-game-2",
    userId: "guest",
    date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 5 days ago
    duration: 8.0,
    notes: "Final boss battle and ending - what an amazing journey!",
    quality: 5,
    location: null,
  },
  {
    id: "demo-session-4",
    activityId: "demo-task-1",
    userId: "guest",
    date: new Date().toISOString().split('T')[0], // Today
    duration: 2.0,
    notes: "Learned about React hooks and state management",
    quality: 4,
    location: null,
  },
  {
    id: "demo-session-5",
    activityId: "demo-task-2",
    userId: "guest",
    date: new Date().toISOString().split('T')[0], // Today
    duration: 3.0,
    notes: "Drafted initial roadmap and key milestones",
    quality: 4,
    location: null,
  },
];

export const guestStats = {
  totalActivities: 5,
  completedActivities: 1,
  inProgressActivities: 3,
  totalHours: 278,
  monthlyHours: 48.5,
  totalGames: 3,
  completedGames: 1,
  byType: {
    game: { count: 3, completed: 1, hours: 243 },
    study: { count: 1, completed: 0, hours: 23 },
    work: { count: 1, completed: 0, hours: 12 },
  },
};
