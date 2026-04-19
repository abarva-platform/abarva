import Anthropic from "@anthropic-ai/sdk";
import { auth } from "@clerk/nextjs/server";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/advisor
//
// Known-client mode   → load client_brief from Supabase, force-feed the entire
//                        brief into the system prompt, and (on session open)
//                        force the structured opening pattern:
//                        demonstrate → name tension → pressure-test →
//                        Genome pattern → sharp question.
//
// Session memory      → when engagement_id + user_id are present, the route
//                        reads prior turns from session_messages, Haiku-
//                        summarises anything older than the last 20 turns,
//                        feeds the full context to Claude, and persists both
//                        the new user turn and the assistant response.
//
// Graceful fallback   → missing engagement_id or user_id → stateless behaviour
//                        identical to the pre-memory contract (messages[] array
//                        drives the conversation, nothing persists).
//
// Unknown-client mode → no client_brief → generic AbarVa advisor behaviour.
//
// Request body:
//   { clientId?: string,
//     userRole?: string,
//     clientName?: string,
//     engagement_id?: string | engagementId?: string,
//     user_id?: string       | userId?: string,
//     message?: string,                               // new user turn (memory)
//     messages?: Array<{ role: "user"|"assistant", content: string }> }
// ─────────────────────────────────────────────────────────────────────────────

type Msg = { role: "user" | "assistant"; content: string };
type ClientBrief = Record<string, unknown> & { identity?: { name?: string } };
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

// Lazy Supabase client — per-request, matches PR #2 safe pattern.
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

async function loadAllTurns(
  sb: SupabaseClient,
  engagement_id: string,
  user_id: string,
): Promise<SessionTurn[]> {
  try {
    const { data, error } = await sb
      .from("session_messages")
      .select("*")
      .eq("engagement_id", engagement_id)
      .eq("user_id", user_id)
      .order("turn_number", { ascending: true });
    if (error || !data) return [];
    return data as SessionTurn[];
  } catch {
    return [];
  }
}

async function summariseOlderTurns(
  older: SessionTurn[],
  anthropic: Anthropic,
): Promise<string | null> {
  if (older.length === 0) return null;
  const text = older
    .map((t) => `${t.role.toUpperCase()}: ${t.content}`)
    .join("\n\n");
  try {
    const resp = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 512,
      system:
        "You are summarizing an ongoing advisor conversation for context preservation. Produce a 3-5 sentence summary preserving: the user's stated concerns, any decisions made, any constraints stated, and the current topic. No fluff. No meta-commentary.",
      messages: [{ role: "user", content: text }],
    });
    const block = resp.content[0];
    return block && block.type === "text" ? block.text : null;
  } catch (err) {
    console.warn("[advisor] Haiku summary failed:", err);
    return null;
  }
}

async function persistTurns(
  sb: SupabaseClient,
  rows: Array<{
    engagement_id: string;
    user_id: string;
    role: "user" | "assistant";
    content: string;
    turn_number: number;
    client_id: string;
  }>,
): Promise<void> {
  if (rows.length === 0) return;
  try {
    const { error } = await sb.from("session_messages").insert(rows);
    if (error) console.warn("[advisor] persist failed:", error.message);
  } catch (err) {
    console.warn("[advisor] persist threw:", err);
  }
}

const BASE_SYSTEM = `You are AbarVa, the world's most experienced enterprise transformation advisor. Deep expertise across healthcare, financial services, and specialty retail.

Senior-partner posture — direct, specific, opinionated.
Every claim cites a source. Specific numbers, not ranges. No generic advice.`;

const GENERIC_FALLBACK = `When no client context is provided, act as a general transformation advisor. Ask a targeted diagnostic question; do not lecture. Keep responses tight.`;

function orchestrationInstruction(clientName: string, role: string) {
  return `You are opening a conversation with a senior ${role} from ${clientName}.

YOU ALREADY KNOW the situation above.
You will NOT ask "what is your current state" or "tell me about your organisation."

Your opening message MUST follow this structure:

LINE 1-2: Demonstrate specific knowledge
(name 1-2 facts from the brief that matter most to where they are RIGHT NOW)

LINE 3-4: Name the most acute tension
(reference the forcing_event + the biggest financial gap in one sentence, with $ amount)

LINE 5-7: Offer 2-3 pressure-test hypotheses
(pull from likely_tensions — present them as "Most ${role}s in your seat come here looking at one of three things: (a)... (b)... (c)...")

LINE 8: Attach a Genome pattern to the riskiest hypothesis — pattern code + failure rate

LINE 9: Close with ONE sharp question that forces them to pick, redirect, or reveal the tension you haven't named.

ABSOLUTE RULES:
- No "Hello" or "Welcome" opening
- No "How can I help you today"
- No "Tell me more about..."
- Every claim cites a source from the brief
- Specific numbers, not ranges ("$94M" not "significant")
- Sound like a senior partner who walked in having read every document, not a chatbot waiting for input`;
}

function buildSystem(args: {
  brief: ClientBrief | null;
  clientName: string;
  userRole: string;
  isOpening: boolean;
  priorSummary: string | null;
}): string {
  const { brief, clientName, userRole, isOpening, priorSummary } = args;

  const base = brief
    ? `${BASE_SYSTEM}\n\n` +
      `CLIENT BRIEF — READ THIS BEFORE RESPONDING. This is what you already know about ${clientName}. Every response must ground itself in these facts.\n` +
      "```json\n" +
      JSON.stringify(brief, null, 2) +
      "\n```"
    : `${BASE_SYSTEM}\n\n${GENERIC_FALLBACK}`;

  let system = base;
  if (priorSummary) {
    system += `\n\nPRIOR CONVERSATION SUMMARY:\n${priorSummary}`;
  }
  if (isOpening && brief) {
    system += `\n\n${orchestrationInstruction(clientName, userRole)}`;
  }
  return system;
}

function normalizeMessages(raw: unknown): Msg[] {
  if (!Array.isArray(raw)) return [];
  const out: Msg[] = [];
  for (const m of raw) {
    if (
      m &&
      typeof m === "object" &&
      typeof (m as { content?: unknown }).content === "string" &&
      ((m as { role?: unknown }).role === "user" ||
        (m as { role?: unknown }).role === "assistant")
    ) {
      out.push({
        role: (m as { role: "user" | "assistant" }).role,
        content: (m as { content: string }).content,
      });
    }
  }
  return out;
}

const SYNTHETIC_OPEN = "[session opened]";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    clientId?: string;
    userRole?: string;
    clientName?: string;
    engagement_id?: string;
    engagementId?: string;
    user_id?: string;
    userId?: string;
    message?: string;
    messages?: unknown;
  };

  const clientId = typeof body.clientId === "string" ? body.clientId.trim() : "";
  const userRole =
    typeof body.userRole === "string" && body.userRole.trim()
      ? body.userRole.trim()
      : "executive";
  const engagement_id =
    (typeof body.engagement_id === "string" && body.engagement_id.trim()) ||
    (typeof body.engagementId === "string" && body.engagementId.trim()) ||
    "";

  // Prefer Clerk-authenticated userId; fall back to body.user_id. If Clerk
  // says something different from body, Clerk wins (prevents user-id spoofing).
  let clerkUserId: string | null = null;
  try {
    const session = await auth();
    clerkUserId = session?.userId ?? null;
  } catch {
    clerkUserId = null;
  }
  const bodyUserId =
    (typeof body.user_id === "string" && body.user_id.trim()) ||
    (typeof body.userId === "string" && body.userId.trim()) ||
    "";
  const user_id = clerkUserId || bodyUserId;

  const memoryEnabled = Boolean(engagement_id && user_id);
  if (!memoryEnabled && (engagement_id || bodyUserId)) {
    console.warn(
      "[advisor] partial memory context — engagement_id and user_id must both be present; falling back to stateless mode",
    );
  }

  const incomingMessages = normalizeMessages(body.messages);
  const explicitMessage =
    typeof body.message === "string" && body.message.trim()
      ? body.message.trim()
      : "";

  const sb = getSupabase();
  const brief = sb && clientId ? await loadClientBrief(sb, clientId) : null;
  const knownClient = Boolean(brief);
  const clientName =
    (typeof body.clientName === "string" && body.clientName.trim()) ||
    brief?.identity?.name ||
    "this organization";

  // Load session history if memory is enabled.
  let history: SessionTurn[] = [];
  if (memoryEnabled && sb) {
    history = await loadAllTurns(sb, engagement_id, user_id);
  }

  // Determine if this is a session opening.
  //   memory-enabled: opening iff nothing persisted yet
  //   stateless: opening iff incoming messages empty
  const isOpening = memoryEnabled
    ? history.length === 0
    : incomingMessages.length === 0 && !explicitMessage;

  // Resolve the latest user turn content.
  //   memory-enabled: explicit.message > last user in messages[] > synthetic open
  //   stateless: last user in messages[] > synthetic open
  let newUserContent = explicitMessage;
  if (!newUserContent) {
    const lastUser = [...incomingMessages]
      .reverse()
      .find((m) => m.role === "user");
    newUserContent = lastUser?.content ?? "";
  }
  if (!newUserContent) newUserContent = SYNTHETIC_OPEN;

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  // Summarise anything beyond the last 20 turns.
  let priorSummary: string | null = null;
  if (memoryEnabled && history.length > 20) {
    const older = history.slice(0, history.length - 20);
    priorSummary = await summariseOlderTurns(older, anthropic);
  }

  const system = buildSystem({
    brief,
    clientName,
    userRole,
    isOpening,
    priorSummary,
  });

  // Build the messages array sent to Claude.
  let anthMessages: Msg[];
  if (memoryEnabled) {
    const last20 = history.slice(-20).map<Msg>((t) => ({
      role: t.role,
      content: t.content,
    }));
    anthMessages = [...last20, { role: "user", content: newUserContent }];
  } else {
    // Stateless: honour the caller's full messages[] array, append new if needed.
    anthMessages = [...incomingMessages];
    const last = anthMessages[anthMessages.length - 1];
    if (!last || last.role !== "user") {
      anthMessages.push({ role: "user", content: newUserContent });
    }
  }

  // Turn numbers for persistence. If memoryEnabled, compute from history max.
  const nextUserTurn =
    memoryEnabled && history.length > 0
      ? (history[history.length - 1].turn_number ?? 0) + 1
      : 1;
  const nextAssistantTurn = nextUserTurn + 1;

  const stream = await anthropic.messages.stream({
    model: "claude-sonnet-4-6",
    max_tokens: 2048,
    system,
    messages: anthMessages,
  });

  const encoder = new TextEncoder();
  const readable = new ReadableStream({
    async start(controller) {
      let assistantText = "";
      try {
        for await (const chunk of stream) {
          if (
            chunk.type === "content_block_delta" &&
            chunk.delta.type === "text_delta"
          ) {
            assistantText += chunk.delta.text;
            controller.enqueue(encoder.encode(chunk.delta.text));
          }
        }

        if (memoryEnabled && sb && assistantText) {
          await persistTurns(sb, [
            {
              engagement_id,
              user_id,
              role: "user",
              content: newUserContent,
              turn_number: nextUserTurn,
              client_id: clientId || "",
            },
            {
              engagement_id,
              user_id,
              role: "assistant",
              content: assistantText,
              turn_number: nextAssistantTurn,
              client_id: clientId || "",
            },
          ]);
        }
      } catch (err) {
        console.error("[advisor] stream error:", err);
      } finally {
        controller.close();
      }
    },
  });

  return new Response(readable, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Transfer-Encoding": "chunked",
      "X-Advisor-Mode": knownClient
        ? isOpening
          ? "known-client-opening"
          : "known-client-turn"
        : "generic-fallback",
      "X-Advisor-Memory": memoryEnabled ? "on" : "off",
      "X-Advisor-Turn": String(nextAssistantTurn),
    },
  });
}
