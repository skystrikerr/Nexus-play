// Per-guest in-memory sandboxes.
//
// Every guest session gets its own empty, fully-usable workspace: they can
// add games, log sessions, and build tier lists, and nobody else ever sees
// it. Data lives only in server memory — it disappears when the server
// restarts or the sandbox goes stale, which is exactly the pitch of guest
// mode ("create a free account to keep your progress").

import { randomUUID } from "crypto";

export interface GuestSandbox {
  activities: any[];
  sessions: any[];
  rankingLists: any[];
  rankingItems: any[];
  activeTimer: { id: string; activityId: string; startedAt: number } | null;
  lastAccess: number;
}

const SANDBOX_TTL_MS = 6 * 60 * 60 * 1000; // forget sandboxes idle > 6h
const MAX_SANDBOXES = 2000; // hard cap so memory can't grow unbounded

const sandboxes = new Map<string, GuestSandbox>();

function sweep() {
  const now = Date.now();
  sandboxes.forEach((box, id) => {
    if (now - box.lastAccess > SANDBOX_TTL_MS) {
      sandboxes.delete(id);
    }
  });
  // Still over cap? Drop the oldest.
  if (sandboxes.size > MAX_SANDBOXES) {
    const oldest = Array.from(sandboxes.entries()).sort((a, b) => a[1].lastAccess - b[1].lastAccess);
    for (let i = 0; i < oldest.length - MAX_SANDBOXES; i++) {
      sandboxes.delete(oldest[i][0]);
    }
  }
}

export function getSandbox(guestId: string): GuestSandbox {
  let box = sandboxes.get(guestId);
  if (!box) {
    if (sandboxes.size >= MAX_SANDBOXES) sweep();
    box = {
      activities: [],
      sessions: [],
      rankingLists: [],
      rankingItems: [],
      activeTimer: null,
      lastAccess: Date.now(),
    };
    sandboxes.set(guestId, box);
  }
  box.lastAccess = Date.now();
  return box;
}

export function newId(): string {
  return "guest-" + randomUUID();
}

/** Create an activity in the sandbox with sane defaults */
export function createGuestActivity(box: GuestSandbox, guestId: string, data: any) {
  const activity = {
    id: newId(),
    userId: guestId,
    title: data.title,
    type: data.type || "game",
    category: data.category ?? null,
    subcategory: data.subcategory ?? null,
    status: data.status || "wishlist",
    rating: data.rating ?? null,
    progress: data.progress ?? 0,
    totalHours: data.totalHours ?? 0,
    tier: data.tier ?? null,
    imageUrl: data.imageUrl ?? null,
    externalId: data.externalId ?? null,
    description: data.description ?? null,
    tags: data.tags ?? [],
    metadata: data.metadata ?? {},
    isPublic: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  box.activities.push(activity);
  return activity;
}

/** Compute the /api/stats payload from a sandbox */
export function guestStatsFor(box: GuestSandbox) {
  const activities = box.activities;
  const totalHours = activities.reduce((sum, a) => sum + (a.totalHours || 0), 0);
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const monthlyHours = box.sessions
    .filter((s) => String(s.date).startsWith(currentMonth))
    .reduce((sum, s) => sum + (s.duration || 0), 0);

  const games = activities.filter((a) => a.type === "game");
  return {
    totalActivities: activities.length,
    completedActivities: activities.filter((a) => a.status === "completed").length,
    inProgressActivities: activities.filter((a) => a.status === "in_progress").length,
    totalHours: Math.round(totalHours),
    monthlyHours: Math.round(monthlyHours * 10) / 10,
    byType: {
      game: {
        count: games.length,
        completed: games.filter((a) => a.status === "completed").length,
        hours: games.reduce((sum, a) => sum + (a.totalHours || 0), 0),
      },
    },
    totalGames: games.length,
    completedGames: games.filter((a) => a.status === "completed").length,
  };
}
