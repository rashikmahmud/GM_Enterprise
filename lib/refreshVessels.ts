// lib/refreshVessels.ts
//
// Server-side function that briefly opens a WebSocket to AISstream,
// collects position reports for ~8 seconds, and writes them to Redis.
//
// Uses a distributed lock so multiple concurrent requests don't
// duplicate the refresh work.

import WebSocket from "ws";
import { redis, KEYS, CACHE_CONFIG, CachedVessel } from "./redis";

// The AIS bounding box — Persian Gulf → Indian Ocean → South China Sea
const AIS_BBOX: [[number, number], [number, number]] = [
  [-10, 40],
  [40, 130],
];

// Try to acquire a refresh lock. Returns true if this call is the "leader"
// and should perform the refresh; false if someone else already is.
async function acquireLock(): Promise<boolean> {
  const result = await redis.set(KEYS.refreshLock, "1", {
    nx: true,
    ex: CACHE_CONFIG.lockTtlSeconds,
  });
  return result === "OK";
}

async function releaseLock() {
  try {
    await redis.del(KEYS.refreshLock);
  } catch {
    // Non-fatal — lock will expire on its own
  }
}

// The main worker. Runs one refresh cycle.
export async function refreshVessels(): Promise<{
  refreshed: boolean;
  vesselsSeen: number;
  reason?: string;
}> {
  const apiKey = process.env.AISSTREAM_KEY;
  if (!apiKey) {
    return {
      refreshed: false,
      vesselsSeen: 0,
      reason: "AISSTREAM_KEY not configured",
    };
  }

  const gotLock = await acquireLock();
  if (!gotLock) {
    return {
      refreshed: false,
      vesselsSeen: 0,
      reason: "another refresh in progress",
    };
  }

  const collected = new Map<number, CachedVessel>();

  try {
    await new Promise<void>((resolve) => {
      const socket = new WebSocket("wss://stream.aisstream.io/v0/stream");
      let subscribed = false;

      const finish = () => {
        try {
          socket.close();
        } catch {
          /* noop */
        }
        resolve();
      };

      const timer = setTimeout(finish, CACHE_CONFIG.refreshDurationMs);

      socket.on("open", () => {
        subscribed = true;
        socket.send(
          JSON.stringify({
            APIKey: apiKey,
            BoundingBoxes: [AIS_BBOX],
            FilterMessageTypes: ["PositionReport"],
          })
        );
      });

      socket.on("message", (raw: WebSocket.RawData) => {
        try {
          const text = raw.toString("utf-8");
          const msg = JSON.parse(text);
          if (msg.MessageType !== "PositionReport") return;

          const report = msg.Message?.PositionReport;
          const meta = msg.MetaData;
          if (!report || !meta) return;

          const mmsi = Number(meta.MMSI);
          if (!Number.isFinite(mmsi)) return;

          collected.set(mmsi, {
            mmsi,
            name: String(meta.ShipName || "Unknown Vessel").trim(),
            lat: Number(report.Latitude),
            lon: Number(report.Longitude),
            sog: Number(report.Sog ?? 0),
            cog: Number(report.Cog ?? 0),
            ts: Date.now(),
          });
        } catch {
          /* ignore parse errors */
        }
      });

      socket.on("error", () => {
        clearTimeout(timer);
        finish();
      });

      socket.on("close", () => {
        clearTimeout(timer);
        if (!subscribed) resolve();
      });
    });

    // Write collected vessels to Redis (hash) with TTL on the hash key
    if (collected.size > 0) {
      const pipeline = redis.pipeline();
      const entries: Record<string, string> = {};
      collected.forEach((v, mmsi) => {
        entries[String(mmsi)] = JSON.stringify(v);
      });
      pipeline.hset(KEYS.vesselsHash, entries);
      pipeline.expire(KEYS.vesselsHash, CACHE_CONFIG.vesselTtlSeconds);
      pipeline.set(KEYS.refreshMeta, String(Date.now()));
      await pipeline.exec();
    } else {
      // Still update the meta so we don't retry immediately
      await redis.set(KEYS.refreshMeta, String(Date.now()));
    }

    return { refreshed: true, vesselsSeen: collected.size };
  } finally {
    await releaseLock();
  }
}

// Returns true if the cache is old enough that we should refresh it
export async function isStale(): Promise<boolean> {
  const lastRefreshRaw = await redis.get<string>(KEYS.refreshMeta);
  if (!lastRefreshRaw) return true;
  const lastRefresh = Number(lastRefreshRaw);
  if (!Number.isFinite(lastRefresh)) return true;
  return Date.now() - lastRefresh > CACHE_CONFIG.refreshWindowMs;
}
