import Anthropic from "@anthropic-ai/sdk";
import { supabase } from "@/lib/supabase";

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/advisor
//
// Known-client mode  → load client_brief from Supabase, force-feed the entire
//                       brief into the system prompt, and (on session open)
//                       force the structured opening pattern:
//                       demonstrate → name tension → pressure-test →
//                       Genome pattern → sharp question.
//
// Unknown-client mode → fall back to generic AbarVa advisor behaviour.
//
// Request body:
//   { clientId?: string,
//     userRole?: string,        // "CIO" | "CFO" | "CHRO" | ... default "executive"
//     clientName?: string,      // optional override; falls back to brief.identity.name
//     messages?: Array<{ role: "user"|"assistant", content: string }> }
//
// Session-opening signal: messages array is empty or missing.
// ─────────────────────────────────────────────────────────────────────────────

type Msg = { role: "user" | "assistant"; content: string };
type ClientBrief = Record<string, unknown> & {
  identity?: { name?: string };
};

async function loadClientBrief(clientId: string): Promise<ClientBrief | null> {
  if (!supabase || !clientId) return null;
  try {
    const { data, error } = await supabase
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
}): string {
  const { brief, clientName, userRole, isOpening } = args;

  if (!brief) {
    return `${BASE_SYSTEM}\n\n${GENERIC_FALLBACK}`;
  }

  let system =
    `${BASE_SYSTEM}\n\n` +
    `CLIENT BRIEF — READ THIS BEFORE RESPONDING. This is what you already know about ${clientName}. Every response must ground itself in these facts.\n` +
    "```json\n" +
    JSON.stringify(brief, null, 2) +
    "\n```";

  if (isOpening) {
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

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    clientId?: string;
    userRole?: string;
    clientName?: string;
    messages?: unknown;
  };

  const clientId = typeof body.clientId === "string" ? body.clientId.trim() : "";
  const userRole =
    typeof body.userRole === "string" && body.userRole.trim()
      ? body.userRole.trim()
      : "executive";
  const messages = normalizeMessages(body.messages);
  const isOpening = messages.length === 0;

  const brief = clientId ? await loadClientBrief(clientId) : null;
  const knownClient = Boolean(brief);
  const clientName =
    (typeof body.clientName === "string" && body.clientName.trim()) ||
    brief?.identity?.name ||
    "this organization";

  const system = buildSystem({ brief, clientName, userRole, isOpening });

  // On opening, synthesize a single user turn so Claude produces the structured opener.
  const anthMessages: Msg[] = isOpening
    ? [
        {
          role: "user",
          content: knownClient
            ? "[session opened]"
            : "[session opened — no client brief available]",
        },
      ]
    : messages;

  // Guard: Anthropic requires at least one user message and the last message must be user.
  if (
    anthMessages.length === 0 ||
    anthMessages[anthMessages.length - 1].role !== "user"
  ) {
    anthMessages.push({ role: "user", content: "[continue]" });
  }

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const stream = await client.messages.stream({
    model: "claude-sonnet-4-6",
    max_tokens: 2048,
    system,
    messages: anthMessages,
  });

  const encoder = new TextEncoder();
  const readable = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of stream) {
          if (
            chunk.type === "content_block_delta" &&
            chunk.delta.type === "text_delta"
          ) {
            controller.enqueue(encoder.encode(chunk.delta.text));
          }
        }
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
    },
  });
}
