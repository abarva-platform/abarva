// POST /api/tower/ask
// Body: { question: string }
// Response: streaming plain text — Ava's Tower answer to a free-text question.
//
// W1.4 — the Tower server answer endpoint. Today Tower answers entirely in the
// browser (public/tower-v2/app.js `answerFor`), so a question never reaches the
// shared engine. This route is the server-side seam: it answers a Tower question
// through the SAME Anthropic egress/auth path the Tower synthesis route uses
// (requireTenancy → getActiveClientRow → preflightAnthropicDirectClient →
// client.messages.stream), and — when the `scb_shared_engine_tower` flag is ON
// for the tenant — grounds the answer in the Consilium expert faculty via
// `summonExpertsForQuery`, prepending the grounding block to the user message.
//
// Dormant by default: the flag is OFF for every tenant (registry default), so
// the answer is byte-identical to an ungrounded Tower answer. Wiring the browser
// `answerFor` to POST here is a separate, intentionally-not-done follow-on.

import { preflightAnthropicDirectClient } from "@/lib/integrations/ai-egress";
import { getActiveClientRow } from "@/lib/active-client";
import { isFeatureEnabled } from "@/lib/features/is-feature-enabled";
import { summonExpertsForQuery } from "@/lib/intelligence/answer/expert-grounding";
import type { ExpertRef } from "@/lib/ava-answer/contract";
import { requireTenancy, tenancyErrorResponse } from "@/lib/auth/tenancy";
import { AGENT_DEMO_SYSTEM_BLOCK } from "@/lib/agent/demo-context";
import { getUserContextPromptBlock } from "@/lib/agent/userContext";
import { FOUR_LAYER_REASONING_INSTRUCTIONS } from "@/lib/intelligence/synthesis/instructionLayer";
import { composeAllAgentDoctrineBlock } from "@/lib/agent/all-agent-doctrine";
import { CONSULTANT_ANSWER_SHAPE_CONTRACT } from "@/lib/intelligence/ask/response-policy";

// Ava's Tower voice mirrors the synthesis route (which already says Ava on the
// Tower surface). The ask path answers a single user question rather than
// synthesizing the whole portfolio, so the task line is question-shaped.
const AVA_TOWER_ASK_VOICE_AND_TASK = `You are Ava, AbarVa's portfolio CIO-of-staff agent on the Tower surface.

Your task: answer the user's question about the IT portfolio — budget, spend, vendors/renewals, AI initiatives, and which programs to scale, hold, or stop — as a portfolio-level CIO-of-staff.

Ava voice register (from brand voice spec §9):
- Cross-program synthesizer. Ava reasons about the portfolio as a single system.
- Lead with the decision implication, then the evidence.
- Reference specific programs, vendors, or initiatives by name/ID when the answer turns on them — authority comes from naming specific instances.
- Quantify portfolio scope when relevant.
- Precise, executive register. No filler. No hedging.
- Do NOT fabricate IDs, vendors, or figures. If the portfolio context for a claim is not provided, say so plainly rather than inventing it.

Format: Use the shared agent output contract. Prefer a direct lead line, then 2-4 short evidence bullets. No raw markdown emphasis.

${CONSULTANT_ANSWER_SHAPE_CONTRACT}`;

export function buildAvaTowerAskPrompt(userContextBlock: string): string {
  // Mirrors the synthesis prompt composition (voice → doctrine → user context →
  // four-layer reasoning → demo block), minus the synthesis-only access/output
  // policy blocks which the ask path does not gate financial values on yet.
  return [
    AVA_TOWER_ASK_VOICE_AND_TASK,
    composeAllAgentDoctrineBlock({ agentName: "Atlas", surface: "/tower" }),
    userContextBlock,
    FOUR_LAYER_REASONING_INSTRUCTIONS,
    AGENT_DEMO_SYSTEM_BLOCK,
  ]
    .filter((s) => s && s.trim().length > 0)
    .join("\n\n");
}

export async function POST(request: Request) {
  // Auth: same tenancy gate the synthesis route uses.
  try {
    await requireTenancy();
  } catch (err) {
    return tenancyErrorResponse(err);
  }

  const body = (await request.json().catch(() => ({}))) as {
    question?: unknown;
  };
  const question =
    typeof body.question === "string" ? body.question.trim() : "";
  if (!question) {
    return new Response(
      JSON.stringify({
        error: "missing_question",
        detail: "Body must include a non-empty 'question' string.",
      }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  const activeClient = await getActiveClientRow();
  if (!activeClient) {
    return Response.json(
      { error: "no_client", detail: "No active client for AI egress policy." },
      { status: 403 },
    );
  }

  // Layer 0 user context (same helper as synthesis).
  const userContextBlock = await getUserContextPromptBlock();
  const systemPrompt = buildAvaTowerAskPrompt(userContextBlock);

  // Shared Context Brain (flag-gated, default OFF). When ON for the tenant,
  // ground the Tower answer in the Consilium expert(s) the router summons for
  // the question, industry-fenced via the active client key. Flag OFF =
  // byte-identical to the ungrounded path (groundedUserMessage === question).
  const sharedTowerOn = isFeatureEnabled(
    { clientKey: activeClient.key },
    "scb_shared_engine_tower",
  );
  const expertGrounding = sharedTowerOn
    ? summonExpertsForQuery({ query: question, clientKey: activeClient.key })
    : { experts: [] as ExpertRef[], groundingBlock: "" };
  const groundedUserMessage = expertGrounding.groundingBlock
    ? `${expertGrounding.groundingBlock}\n\n${question}`
    : question;

  // Egress: identical preflight → client → messages.stream path as synthesis.
  const preflight = await preflightAnthropicDirectClient({
    tenantId: activeClient.id,
    workflow: "tower-ask",
    model: "claude-sonnet-4-6",
    prompt: [systemPrompt, groundedUserMessage].join("\n\n"),
    dataClass: "confidential",
    metadata: { surface: "tower", grounded: String(sharedTowerOn) },
  });
  if (!preflight.ok) {
    return new Response(preflight.reason, {
      status: 403,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }
  const client = preflight.client;

  const stream = await client.messages.stream({
    model: "claude-sonnet-4-6",
    max_tokens: 600,
    system: systemPrompt,
    messages: [{ role: "user", content: groundedUserMessage }],
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
      } catch (err) {
        controller.error(err);
        return;
      }
      controller.close();
    },
  });

  return new Response(readable, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Transfer-Encoding": "chunked",
      "X-Tower-Grounded": String(sharedTowerOn),
    },
  });
}
