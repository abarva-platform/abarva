// GET /api/reasoning/synthesis-cache/info
// Returns a snapshot of every in-memory synthesis cache (source / programs /
// tower) for diagnostic visibility on the admin dashboard.
//
// Importing the three synthesis route modules is intentional — that's how
// each per-route cache registers itself with the shared registry. Without
// these imports the registry would be empty until a real request landed.

// SECURITY (audit 2026-05-22, P0-1): requires an authenticated session.
import { snapshotSynthesisCaches } from "@/lib/reasoning/synthesis-cache-registry";
import { guardReasoning } from "@/app/api/reasoning/_auth";
import "@/app/api/source/synthesis/route";
import "@/app/api/programs/synthesis/route";
import "@/app/api/tower/synthesis/route";

export async function GET() {
  const guard = await guardReasoning();
  if (guard.response) return guard.response;

  const entries = snapshotSynthesisCaches();
  return new Response(JSON.stringify({ entries }), {
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
    },
  });
}
