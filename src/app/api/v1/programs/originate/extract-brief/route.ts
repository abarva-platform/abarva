// POST /api/v1/programs/originate/extract-brief
//
// Deterministic P0 scaffold reconciliation. The /strategic-moves/new scaffold
// fills only from `brief-progress` artifacts the conversational agent emits, and
// the model intermittently narrates a capture ("the brief is ready, click
// Promote") WITHOUT emitting the artifact — leaving the scaffold at 0/7 and
// Promote disabled. Prompt-hardening did not make that reliable.
//
// This endpoint is the model-independent fallback: it runs a cheap, structured
// (JSON-only) extraction over the conversation and returns the seven scaffold
// fields. The originate client calls it whenever a turn produced no
// brief-progress artifact, then fills the scaffold from the result — so capture
// is deterministic regardless of whether the chat turn emitted the artifact.

import { NextRequest } from "next/server";
import { requireTenancy, tenancyErrorResponse } from "@/lib/auth/tenancy";
import { getAuditedAnthropicClient } from "@/lib/agent/stream";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const FIELD_IDS = [
  "problem-statement",
  "archetype",
  "sponsor-candidate",
  "scope-boundary",
  "evidence-family",
  "value-hypothesis",
  "foundation-readiness",
] as const;

const MODEL = "claude-haiku-4-5-20251001";

interface Body {
  conversation?: Array<{ role?: string; content?: string }>;
}

function extractionPrompt(conversationText: string): string {
  return `You extract a 7-section origination brief for a Strategic Move from a conversation between a user and the Nexus agent. Return ONLY a JSON object.

CONVERSATION
"""
${conversationText}
"""

Return a JSON object whose keys are a subset of EXACTLY these seven ids, including a key ONLY when the conversation clearly establishes that section:
- "problem-statement" — the bet / hypothesis (the problem and the testable claim)
- "archetype" — archetype classification of the Move
- "sponsor-candidate" — ONLY if a specific sponsor is named (a real person/role explicitly named); omit if merely "likely" or unnamed
- "scope-boundary" — what is in-scope and out-of-scope
- "evidence-family" — the evidence/data families that will ground the work
- "value-hypothesis" — the value hypothesis (size + that it is unvalidated)
- "foundation-readiness" — readiness of data/platform/governance foundations

RULES
- Values are concise strings (one or two sentences max), written as settled brief content, not as questions.
- Include a key ONLY if the conversation supports it; otherwise omit it.
- If nothing is established, return {}.
- Return ONLY the JSON object, no prose, no code fences.`;
}

export async function POST(req: NextRequest) {
  try {
    const ctx = await requireTenancy();
    const body = (await req.json().catch(() => ({}))) as Body;
    const conversation = Array.isArray(body.conversation) ? body.conversation : [];
    const conversationText = conversation
      .filter((m) => typeof m?.content === "string" && m.content.trim())
      .map((m) => `${(m.role ?? "user").toUpperCase()}: ${m.content}`)
      .join("\n\n")
      .slice(0, 24000);

    if (!conversationText || !process.env.ANTHROPIC_API_KEY) {
      // Graceful no-op: the manual scaffold + chat still work.
      return Response.json({ fields: {} });
    }

    const prompt = extractionPrompt(conversationText);
    const { client } = await getAuditedAnthropicClient({
      tenantId: ctx.clientId,
      userId: ctx.userId ?? undefined,
      workflow: "moves-originate-brief-extraction",
      model: MODEL,
      prompt,
      dataClass: "confidential",
      artifactId: `originate-extract:${ctx.clientId}`,
      artifactType: "origination-brief",
      metadata: { surface: "/strategic-moves/new" },
    });

    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 800,
      messages: [{ role: "user", content: prompt }],
    });
    const text = response.content
      .filter((b) => b.type === "text")
      .map((b) => (b as { text: string }).text)
      .join("");
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return Response.json({ fields: {} });

    let parsed: Record<string, unknown> = {};
    try {
      parsed = JSON.parse(match[0]) as Record<string, unknown>;
    } catch {
      return Response.json({ fields: {} });
    }

    const fields: Record<string, string> = {};
    for (const id of FIELD_IDS) {
      const v = parsed[id];
      if (typeof v === "string" && v.trim()) fields[id] = v.trim();
    }
    return Response.json({ fields });
  } catch (err) {
    try {
      return tenancyErrorResponse(err);
    } catch {
      /* not a tenancy error */
    }
    console.error("[POST /api/v1/programs/originate/extract-brief]", err);
    return Response.json({ fields: {} });
  }
}
