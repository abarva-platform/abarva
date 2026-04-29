// GET /api/reasoning/synthesis-cache/info
// Returns a snapshot of every in-memory synthesis cache (source / programs /
// tower) for diagnostic visibility on the admin dashboard.
//
// Importing the three synthesis route modules is intentional — that's how
// each per-route cache registers itself with the shared registry. Without
// these imports the registry would be empty until a real request landed.

import { snapshotSynthesisCaches } from "@/lib/reasoning/synthesis-cache-registry";
import "@/app/api/source/synthesis/route";
import "@/app/api/programs/synthesis/route";
import "@/app/api/tower/synthesis/route";

export async function GET() {
  const entries = snapshotSynthesisCaches();
  return new Response(JSON.stringify({ entries }), {
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
    },
  });
}
