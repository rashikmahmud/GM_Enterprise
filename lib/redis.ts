// lib/redis.ts
//
// Central Upstash Redis client. Reused across every API route so we
// avoid opening a new HTTP session on each request.
//
// Also defines shared types + key helpers so route files stay tiny.

import { Redis } from "@upstash/redis";

export const redis = Redis.fromEnv();

// ─────────────────────────────────────────────────────────────
// Shared vessel type — mirrors the shape we send to the client
// ─────────────────────────────────────────────────────────────
export type CachedVessel = {
  mmsi: number;
  name: string;
  lat: number;
  lon: number;
  sog: number; // knots
  cog: number; // degrees
  ts: number;  // last-update timestamp (ms since epoch)
};

// ─────────────────────────────────────────────────────────────
// Key helpers (keeps our Redis key space organized)
// ─────────────────────────────────────────────────────────────
export const KEYS = {
  vesselsHash: "vessels:all",           // Hash: mmsi → JSON(CachedVessel)
  refreshLock: "vessels:refresh:lock",  // Lock preventing simultaneous refreshes
  refreshMeta: "vessels:refresh:meta",  // Last refresh timestamp
};

// ─────────────────────────────────────────────────────────────
// Config
// ─────────────────────────────────────────────────────────────
export const CACHE_CONFIG = {
  // How long a cached vessel counts as "fresh" (< this = serve from cache, no refresh)
  refreshWindowMs: 25 * 1000, // 25 seconds

  // How long we keep a vessel in Redis even if never seen again.
  // Long enough that a quiet 3am → busy 9am gap doesn't show an empty map.
  vesselTtlSeconds: 6 * 60 * 60, // 6 hours

  // How old a cached vessel can be before we hide it from the map.
  // Beyond this, we treat it as "gone" even though it's still in Redis.
  vesselDisplayCutoffMs: 2 * 60 * 60 * 1000, // 2 hours

  // Max duration to hold a refresh WebSocket open
  // ⚠️ Vercel Hobby plan caps functions at 10s — keep this at 8s to be safe.
  // If you upgrade to Pro (60s limit), bump this to 30-40s for way more ships.
  refreshDurationMs: 8 * 1000, // 8 seconds

  // Lock TTL so a crashed refresh doesn't block forever
  lockTtlSeconds: 15,
};
