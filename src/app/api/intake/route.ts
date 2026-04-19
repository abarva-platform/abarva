import Anthropic from "@anthropic-ai/sdk";
import { auth } from "@clerk/nextjs/server";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import {
  actFromTurnCount,
  buildIntakeSystemPrompt,
  type ClientBrief,
} from "@/lib/intake/systemPrompt";

// ─────────────────────────────────────────────────────────────────────────────
// /api/intake
//
// POST — advance the intake conversation by one turn. Streams Claude
// Sonnet 4.6 response. Persists both the user turn and the assistant
// turn to intake_turns on stream close.
//
// GET  — return full intake_turns history for (engagement_id, user_id).
//        Clerk-gated: userId must match or be admin.
// ─────────────────────────────────────────────────────────────────────────────

type IntakeTurn = {
  id: string;
  engagement_id: string;
  user_id: string;
  client_id: string;
  role: "user" | "assistant";
  content: string;
  turn_number: number;
  act: number;
  created_at: string;
};

const SYNTHETIC_OPEN = "[session_opened]";

function getSupabase(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

async function loadClientBrief(
  sb: SupabaseClient,
  clientId: string,
): Promise<ClientBrief | null> {
  if (!clientId) return null;
  try {
    const { data, error } = await sb
      .from("client_brief")
      .select("brief_json")
      .eq("client_id", clientId)
      .maybeSingle();
    if (error || !data) return null;
    const brief = (data as { brief_json?: ClientBrief }).brief_json;
    return brief && typeof brief === "object" ? brief : null;
  } catch {
    return null;
  }
}

async function loadTurns(
  sb: SupabaseClient,
  engagement_id: string,
  user_id: string,
): Promise<IntakeTurn[]> {
  try {
    const { data, error } = await sb
      .from("intake_turns")
      .select("*")
      .eq("engagement_id", engagement_id)
      .eq("user_id", user_id)
      .order("turn_number", { ascending: true });
    if (error || !data) return [];
    return data as IntakeTurn[];
  } catch {
    return [];
  }
}

async function persistTurns(
  sb: SupabaseClient,
  rows: Array<Omit<IntakeTurn, "id" | "created_at">>,
): Promise<void> {
  if (rows.length === 0) return;
  try {
    const { error } = await sb.from("intake_turns").insert(rows);
    if (error) console.warn("[intake] persist failed:", error.message);
  } catch (err) {
    console.warn("[intake] persist threw:", err);
  }
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

// ─── GET — history ──────────────────────────────────────────────────────────
export async function GET(request: Request) {
  const url = new URL(request.url);
  const engagement_id = (url.searchParams.get("engagement_id") || "").trim();
  const queryUserId = (url.searchParams.get("user_id") || "").trim();

  if (!engagement_id) {
    return Response.json(
      { error: "engagement_id required", turns: [] },
      { status: 400 },
    );
  }

  const { userId, role } = await resolveAuthUser();
  if (!userId) {
    return Response.json({ error: "unauthenticated", turns: [] }, { status: 401 });
  }

  const effectiveUserId = queryUserId || userId;
  const isAdmin = role === "admin";
  if (!isAdmin && effectiveUserId !== userId) {
    return Response.json({ error: "forbidden", turns: [] }, { status: 403 });
  }

  const sb = getSupabase();
  if (!sb) {
    return Response.json(
      { error: "storage unavailable", turns: [] as IntakeTurn[] },
      { status: 503 },
    );
  }

  const turns = await loadTurns(sb, engagement_id, effectiveUserId);
  return Response.json({ turns });
}

// ─── POST — advance conversation ────────────────────────────────────────────
export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    engagement_id?: string;
    client_id?: string;
    user_id?: string;
    message?: string;
    clientName?: string;
    userRole?: string;
  };

  const engagement_id = (body.engagement_id ?? "").trim();
  const client_id = (body.client_id ?? "").trim();
  const bodyUserId = (body.user_id ?? "").trim();
  const message = typeof body.message === "string" ? body.message : "";
  const userRole =
    typeof body.userRole === "string" && body.userRole.trim()
      ? body.userRole.trim()
      : "executive";

  if (!engagement_id || !client_id) {
    return Response.json(
      { error: "engagement_id and client_id required" },
      { status: 400 },
    );
  }

  const { userId: clerkUserId } = await resolveAuthUser();
  if (!clerkUserId) {
    return Response.json({ error: "unauthenticated" }, { status: 401 });
  }
  const user_id = clerkUserId; // Clerk wins over body.user_id
  // (bodyUserId is reconciled silently; prevents spoofing)
  void bodyUserId;

  const sb = getSupabase();
  if (!sb) {
    return Response.json({ error: "storage unavailable" }, { status: 503 });
  }

  const brief = await loadClientBrief(sb, client_id);
  const clientName =
    (typeof body.clientName === "string" && body.clientName.trim()) ||
    brief?.identity?.name ||
    "this organization";

  const history = await loadTurns(sb, engagement_id, user_id);
  const turnCount = Math.floor(history.length / 2);
  const isOpening = turnCount === 0 && !message.trim();

  // Resolve new user content.
  const newUserContent = isOpening ? SYNTHETIC_OPEN : message.trim();
  if (!newUserContent) {
    return Response.json(
      { error: "message required after the opening turn" },
      { status: 400 },
    );
  }

  const act = actFromTurnCount(turnCount);

  const system = buildIntakeSystemPrompt({
    clientBrief: brief,
    clientName,
    userRole,
    turnCount,
    priorSummary: null,
  });

  // Build messages — last 20 prior turns verbatim + new user turn.
  const prior = history.slice(-20).map((t) => ({
    role: t.role,
    content: t.content,
  }));
  const anthMessages: Array<{ role: "user" | "assistant"; content: string }> = [
    ...prior,
    { role: "user", content: newUserContent },
  ];

  const nextUserTurn =
    history.length > 0
      ? (history[history.length - 1].turn_number ?? 0) + 1
      : 1;
  const nextAssistantTurn = nextUserTurn + 1;

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  let stream;
  try {
    stream = await anthropic.messages.stream({
      model: "claude-sonnet-4-6",
      max_tokens: 2048,
      system,
      messages: anthMessages,
    });
  } catch (err) {
    console.error("[intake] anthropic stream failed:", err);
    return Response.json({ error: "upstream error" }, { status: 500 });
  }

  const encoder = new TextEncoder();
  const readable = new ReadableStream({
    async start(controller) {
      let assistantText = "";
      try {
        for await (const chunk of stream!) {
          if (
            chunk.type === "content_block_delta" &&
            chunk.delta.type === "text_delta"
          ) {
            assistantText += chunk.delta.text;
            controller.enqueue(encoder.encode(chunk.delta.text));
          }
        }

        if (assistantText) {
          await persistTurns(sb, [
            {
              engagement_id,
              user_id,
              client_id,
              role: "user",
              content: newUserContent,
              turn_number: nextUserTurn,
              act,
            },
            {
              engagement_id,
              user_id,
              client_id,
              role: "assistant",
              content: assistantText,
              turn_number: nextAssistantTurn,
              act,
            },
          ]);
        }
      } catch (err) {
        console.error("[intake] stream error:", err);
      } finally {
        controller.close();
      }
    },
  });

  return new Response(readable, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Transfer-Encoding": "chunked",
      "X-Intake-Act": String(act),
      "X-Intake-Turn": String(nextAssistantTurn),
    },
  });
}
