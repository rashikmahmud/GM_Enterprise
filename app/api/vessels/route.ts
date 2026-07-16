// app/api/vessels/route.ts
//
// GET /api/vessels
//
// Design goal: The map should NEVER be empty for a returning visitor.
//
// Strategy:
//   1. ALWAYS return whatever is currently cached (even if hours old) —
//      the client never waits for a WebSocket refresh.
//   2. If the cache is stale (>25s), kick off a background refresh AND
//      fire-and-forget so the next visitor gets fresh data.
//   3. If the cache is completely empty (first ever visit / expired),
//      block on a refresh so the client gets *something*.
//   4. Each vessel carries its own timestamp; we mark stale ones with
//      an `isStale` flag so the client can render them differently.
//
// Also supports optional query params for filtering:
//   ?type=moving         → only ships underway (SOG >= 0.5 kn)
//   ?type=anchored       → only anchored ships
//   ?near=mmsi           → only ships whose MMSI contains this substring
//   ?name=xxx            → only ships whose name contains this string
//   ?maxAge=300          → only ships seen within last 300 seconds (5 min)

import { NextRequest, NextResponse } from "next/server";
import { redis, KEYS, CACHE_CONFIG, CachedVessel } from "@/lib/redis";
import { refreshVessels, isStale } from "@/lib/refreshVessels";

// Force this route to always run at request time (never statically cached)
export const dynamic = "force-dynamic";
export const runtime = "nodejs"; // Needs Node runtime for `ws` package

type VesselResponseItem = CachedVessel & {
  ageSeconds: number;
  isStale: boolean;
};

async function readCachedVessels(): Promise<VesselResponseItem[]> {
  const raw = (await redis.hgetall<Record<string, string>>(
    KEYS.vesselsHash
  )) as Record<string, string> | null;

  if (!raw) return [];

  const now = Date.now();
  const cutoff = CACHE_CONFIG.vesselDisplayCutoffMs;
  const results: VesselResponseItem[] = [];

  for (const [, value] of Object.entries(raw)) {
    try {
      const v =
        typeof value === "string"
          ? (JSON.parse(value) as CachedVessel)
          : (value as unknown as CachedVessel);
      if (!v || !Number.isFinite(v.mmsi)) continue;

      const ageMs = now - v.ts;
      if (ageMs > cutoff) continue; // too old — skip entirely

      results.push({
        ...v,
        ageSeconds: Math.round(ageMs / 1000),
        // "Fresh" = updated in the last 5 minutes. Anything older we mark stale
        // so the UI can dim it or add a "last seen X ago" note.
        isStale: ageMs > 5 * 60 * 1000,
      });
    } catch {
      /* skip malformed entries */
    }
  }

  return results;
}

function applyFilters(
  vessels: VesselResponseItem[],
  params: URLSearchParams
): VesselResponseItem[] {
  let out = vessels;

  const type = params.get("type");
  if (type === "moving") {
    out = out.filter((v) => v.sog >= 0.5);
  } else if (type === "anchored") {
    out = out.filter((v) => v.sog < 0.5);
  }

  const near = params.get("near");
  if (near) {
    out = out.filter((v) => String(v.mmsi).includes(near));
  }

  const name = params.get("name");
  if (name) {
    const needle = name.toLowerCase();
    out = out.filter((v) => v.name.toLowerCase().includes(needle));
  }

  const maxAgeRaw = params.get("maxAge");
  if (maxAgeRaw) {
    const maxAge = Number(maxAgeRaw);
    if (Number.isFinite(maxAge)) {
      out = out.filter((v) => v.ageSeconds <= maxAge);
    }
  }

  return out;
}

export async function GET(request: NextRequest) {
  try {
    // 1. Read whatever's currently cached (may be stale, may be empty)
    let vessels = await readCachedVessels();
    const stale = await isStale();

    // 2. If cache is empty, we MUST wait for a refresh — otherwise UI is blank
    if (vessels.length === 0) {
      await refreshVessels();
      vessels = await readCachedVessels();
    } else if (stale) {
      // 3. We have data — return it immediately, refresh in the background
      refreshVessels().catch(() => {
        /* errors logged inside refreshVessels */
      });
    }

    // 4. Apply optional filters from query params
    const { searchParams } = new URL(request.url);
    const filtered = applyFilters(vessels, searchParams);

    // 5. Metadata for the client to display "updated Xs ago" etc.
    const lastRefreshRaw = await redis.get<string>(KEYS.refreshMeta);
    const lastRefreshMs = lastRefreshRaw ? Number(lastRefreshRaw) : null;
    const cacheAgeMs =
      lastRefreshMs && Number.isFinite(lastRefreshMs)
        ? Date.now() - lastRefreshMs
        : null;

    return NextResponse.json({
      vessels: filtered,
      count: filtered.length,
      totalBeforeFilter: vessels.length,
      freshCount: filtered.filter((v) => !v.isStale).length,
      staleCount: filtered.filter((v) => v.isStale).length,
      cacheAgeMs,
      isRefreshing: stale && vessels.length > 0,
    });
  } catch (err) {
    console.error("[/api/vessels] Failed", err);
    return NextResponse.json(
      { error: "Failed to fetch vessels", vessels: [], count: 0 },
      { status: 500 }
    );
  }
}
