// app/api/refresh/route.ts
//
// GET/POST /api/refresh?secret=XXX
//
// Triggers a fresh vessel collection from AISstream and writes to Redis.
// Designed to be called by:
//   1. An external cron service (cron-job.org) every 30 min
//   2. A manual admin trigger for testing
//
// Protected by a shared secret in the URL to prevent random visitors
// from burning through your Upstash quota.

import { NextRequest, NextResponse } from "next/server";
import { refreshVessels } from "@/lib/refreshVessels";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
// Give the function up to 10s on Hobby / 60s on Pro to finish the refresh
export const maxDuration = 10;

async function handle(request: NextRequest) {
  const expected = process.env.REFRESH_SECRET;

  if (!expected) {
    return NextResponse.json(
      {
        error:
          "REFRESH_SECRET is not configured on the server. Add it to your env vars.",
      },
      { status: 500 }
    );
  }

  // Accept the secret either as a query param (?secret=xxx)
  // or as a Bearer token in the Authorization header (Bearer xxx)
  const { searchParams } = new URL(request.url);
  const secretFromQuery = searchParams.get("secret");
  const authHeader = request.headers.get("authorization") || "";
  const secretFromHeader = authHeader.startsWith("Bearer ")
    ? authHeader.slice(7)
    : null;

  const provided = secretFromQuery || secretFromHeader;

  if (provided !== expected) {
    return NextResponse.json(
      { error: "Unauthorized. Missing or wrong secret." },
      { status: 401 }
    );
  }

  const result = await refreshVessels();

  return NextResponse.json({
    ok: result.refreshed,
    vesselsSeen: result.vesselsSeen,
    reason: result.reason,
    triggeredAt: new Date().toISOString(),
  });
}

// Support both GET (easier to test in a browser) and POST (typical for crons)
export async function GET(request: NextRequest) {
  return handle(request);
}

export async function POST(request: NextRequest) {
  return handle(request);
}
