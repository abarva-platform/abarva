import Anthropic from "@anthropic-ai/sdk";
import { auth } from "@clerk/nextjs/server";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// ─────────────────────────────────────────────────────────────────────────────
// /api/intake/charter
//
// GET  — return current engagement_charters row for the engagement (or null
//        if not drafted yet). Clerk-gated — created_by_user_id must match or
//        role === 'admin'.
//
// POST — extract a structured charter from the intake_turns conversation
//        using Haiku. Requires at least 6 turns. Upserts with
//        status='pending_approval'.
// ─────────────────────────────────────────────────────────────────────────────

type IntakeTurn = {
  role: "user" | "assistant";
  content: string;
  turn_number: number;
};

type CharterExtract = {
  problem: string | null;
  desired_outcome: string | null;
  timeline: string | null;
  success_metrics: string | null;
  primary_sponsor: string | null;
  co_sponsor: string | null;
  workstreams: string[];
  dependencies: string | null;
  data_available: string[];
  data_gaps: string[];
  risks: string[];
  approval_required_from: string[];
};

function getSupabase(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

async function resolveAuthUser(): Promise<{
  userId: string | null;
  role: string | null;
}> {
  try {
    const session = await auth();
    const userId = session?.userId ?? null;
    const role =
      (session?.sessionClaims?.publicMetadata as { role?: string } | undefined)
        ?.role ?? null;
    return { userId, role };
  } catch {
    return { userId: null, role: null };
  }
}

// ─── GET — fetch current charter ────────────────────────────────────────────
export async function GET(request: Request) {
  const url = new URL(request.url);
  const engagement_id = (url.searchParams.get("engagement_id") || "").trim();

  if (!engagement_id) {
    return Response.json({ error: "engagement_id required" }, { status: 400 });
  }

  const { userId, role } = await resolveAuthUser();
  if (!userId) {
    return Response.json({ error: "unauthenticated" }, { status: 401 });
  }

  const sb = getSupabase();
  if (!sb) {
    return Response.json({ error: "storage unavailable" }, { status: 503 });
  }

  const { data, error } = await sb
    .from("engagement_charters")
    .select("*")
    .eq("engagement_id", engagement_id)
    .maybeSingle();

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
  if (!data) {
    return Response.json({ charter: null });
  }

  const isAdmin = role === "admin";
  const charter = data as { created_by_user_id: string };
  if (!isAdmin && charter.created_by_user_id !== userId) {
    return Response.json({ error: "forbidden" }, { status: 403 });
  }

  return Response.json({ charter: data });
}

// ─── POST — extract and upsert charter ──────────────────────────────────────
function tryParseJson(text: string): CharterExtract | null {
  const trimmed = text.trim();
  // Strip markdown fences if the model emitted them despite instructions.
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const raw = fenced ? fenced[1] : trimmed;
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object") {
      return parsed as CharterExtract;
    }
    return null;
  } catch {
    return null;
  }
}

async function extractWithHaiku(
  anthropic: Anthropic,
  turns: IntakeTurn[],
): Promise<CharterExtract | null> {
  const formatted = turns
    .map(
      (t, i) =>
        `TURN ${i + 1} — ${t.role.toUpperCase()}: ${t.content}`,
    )
    .join("\n\n");

  const systemPrompt =
    "You extract structured engagement charter data from an intake conversation between a senior advisor and a client executive. Return ONLY valid JSON matching the schema. Never invent information — if something was not discussed, use null or an empty array. Use the client's own language where possible.";

  const userPrompt = `Schema:
{
  "problem": string | null,
  "desired_outcome": string | null,
  "timeline": string | null,
  "success_metrics": string | null,
  "primary_sponsor": string | null,
  "co_sponsor": string | null,
  "workstreams": string[],
  "dependencies": string | null,
  "data_available": string[],
  "data_gaps": string[],
  "risks": string[],
  "approval_required_from": string[]
}

Conversation:
${formatted}

Return only the JSON object, no prose, no markdown fences.`;

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const resp = await anthropic.messages.create({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 1536,
        system: systemPrompt,
        messages: [{ role: "user", content: userPrompt }],
      });
      const block = resp.content[0];
      const text = block && block.type === "text" ? block.text : "";
      const parsed = tryParseJson(text);
      if (parsed) return parsed;
    } catch (err) {
      console.warn(`[charter] Haiku extract attempt ${attempt + 1} failed:`, err);
    }
  }
  return null;
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    engagement_id?: string;
    client_id?: string;
    user_id?: string;
  };

  const engagement_id = (body.engagement_id ?? "").trim();
  const client_id = (body.client_id ?? "").trim();

  if (!engagement_id || !client_id) {
    return Response.json(
      { error: "engagement_id and client_id required" },
      { status: 400 },
    );
  }

  const { userId } = await resolveAuthUser();
  if (!userId) {
    return Response.json({ error: "unauthenticated" }, { status: 401 });
  }

  const sb = getSupabase();
  if (!sb) {
    return Response.json({ error: "storage unavailable" }, { status: 503 });
  }

  const { data: turnsData, error: turnsErr } = await sb
    .from("intake_turns")
    .select("role, content, turn_number")
    .eq("engagement_id", engagement_id)
    .eq("user_id", userId)
    .order("turn_number", { ascending: true });

  if (turnsErr) {
    return Response.json({ error: turnsErr.message }, { status: 500 });
  }

  const turns = (turnsData as IntakeTurn[] | null) ?? [];
  if (turns.length < 6) {
    return Response.json(
      { error: "intake not advanced enough" },
      { status: 400 },
    );
  }

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const extracted = await extractWithHaiku(anthropic, turns);
  if (!extracted) {
    return Response.json(
      { error: "charter extraction failed" },
      { status: 500 },
    );
  }

  const payload = {
    engagement_id,
    client_id,
    created_by_user_id: userId,
    status: "pending_approval" as const,
    problem: extracted.problem,
    desired_outcome: extracted.desired_outcome,
    timeline: extracted.timeline,
    success_metrics: extracted.success_metrics,
    primary_sponsor: extracted.primary_sponsor,
    co_sponsor: extracted.co_sponsor,
    workstreams: Array.isArray(extracted.workstreams)
      ? extracted.workstreams
      : [],
    dependencies: extracted.dependencies,
    data_available: Array.isArray(extracted.data_available)
      ? extracted.data_available
      : [],
    data_gaps: Array.isArray(extracted.data_gaps) ? extracted.data_gaps : [],
    risks: Array.isArray(extracted.risks) ? extracted.risks : [],
    approval_required_from: Array.isArray(extracted.approval_required_from)
      ? extracted.approval_required_from
      : [],
  };

  const { data: upserted, error: upsertErr } = await sb
    .from("engagement_charters")
    .upsert(payload, { onConflict: "engagement_id" })
    .select()
    .single();

  if (upsertErr) {
    return Response.json({ error: upsertErr.message }, { status: 500 });
  }

  return Response.json({ charter: upserted });
}
