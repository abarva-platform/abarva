import { auth } from "@clerk/nextjs/server";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/advisor/history?engagement_id=X&user_id=Y
//
// Returns the full turn history for an (engagement_id, user_id) pair so the
// UI can restore conversation state on page reload.
//
// Auth: Clerk. The authenticated user must match user_id, or be an admin
// (publicMetadata.role === 'admin').
//
// Response shape: { turns: Array<SessionTurn> }  — ordered ascending by turn_number.
// ─────────────────────────────────────────────────────────────────────────────

type SessionTurn = {
  id: string;
  engagement_id: string;
  user_id: string;
  role: "user" | "assistant";
  content: string;
  turn_number: number;
  client_id: string;
  created_at: string;
};

function getSupabase(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const engagement_id = (url.searchParams.get("engagement_id") || "").trim();
  const user_id = (url.searchParams.get("user_id") || "").trim();

  if (!engagement_id || !user_id) {
    return Response.json(
      { error: "engagement_id and user_id are required" },
      { status: 400 },
    );
  }

  // Clerk auth.
  const { userId, sessionClaims } = await auth();
  if (!userId) {
    return Response.json({ error: "unauthenticated" }, { status: 401 });
  }

  const role =
    (sessionClaims?.publicMetadata as { role?: string } | undefined)?.role ??
    null;
  const isAdmin = role === "admin";

  if (!isAdmin && userId !== user_id) {
    return Response.json({ error: "forbidden" }, { status: 403 });
  }

  const sb = getSupabase();
  if (!sb) {
    return Response.json(
      { error: "storage unavailable", turns: [] as SessionTurn[] },
      { status: 503 },
    );
  }

  try {
    const { data, error } = await sb
      .from("session_messages")
      .select("*")
      .eq("engagement_id", engagement_id)
      .eq("user_id", user_id)
      .order("turn_number", { ascending: true });

    if (error) {
      return Response.json({ error: error.message, turns: [] }, { status: 500 });
    }

    return Response.json({ turns: (data as SessionTurn[]) ?? [] });
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown error";
    return Response.json({ error: message, turns: [] }, { status: 500 });
  }
}
