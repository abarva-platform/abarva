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

type FieldId = (typeof FIELD_IDS)[number];

const MODEL = "claude-haiku-4-5-20251001";

interface Body {
  conversation?: Array<{ role?: string; content?: string }>;
}

const LABEL_TO_FIELD: Array<{ field: FieldId; labels: string[] }> = [
  {
    field: "problem-statement",
    labels: ["business problem", "problem statement", "problem", "bet", "hypothesis"],
  },
  { field: "archetype", labels: ["archetype", "classification"] },
  {
    field: "sponsor-candidate",
    labels: ["sponsor candidate", "sponsor", "owner"],
  },
  { field: "scope-boundary", labels: ["scope", "scope boundary", "boundary"] },
  {
    field: "evidence-family",
    labels: ["evidence family", "evidence families", "evidence"],
  },
  {
    field: "value-hypothesis",
    labels: ["value hypothesis", "value", "outcome hypothesis"],
  },
  {
    field: "foundation-readiness",
    labels: ["foundation readiness", "readiness", "foundation"],
  },
];

const ALL_LABELS = LABEL_TO_FIELD.flatMap(({ labels }) => labels)
  .sort((a, b) => b.length - a.length)
  .map((label) => label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
  .join("|");

function compact(value: string): string {
  return value.replace(/\s+/g, " ").replace(/^[-–—:;,\s]+/, "").trim();
}

function stripConversationRolePrefix(value: string): string {
  return value
    .replace(/^(USER|ASSISTANT|SYSTEM):\s*/i, "")
    .replace(/\s+(USER|ASSISTANT|SYSTEM):[\s\S]*$/i, "")
    .trim();
}

function firstSentenceMatching(text: string, patterns: RegExp[]): string {
  const sentences = compact(text)
    .split(/(?<=[.!?])\s+/)
    .map((s) => compact(stripConversationRolePrefix(s)))
    .filter(Boolean);
  return (
    sentences.find((sentence) => patterns.some((pattern) => pattern.test(sentence))) ??
    ""
  );
}

function deriveProblemStatement(text: string): string {
  const move = firstSentenceMatching(text, [
    /strategic move/i,
    /kyriba/i,
    /treasury/i,
    /business problem/i,
  ]);
  const risk = firstSentenceMatching(text, [
    /risk/i,
    /visibility/i,
    /control/i,
    /manual/i,
  ]);
  return compact([move, risk].filter(Boolean).join(" "));
}

function deriveArchetype(text: string): string {
  if (/\b(kyriba|treasury|cash visibility|payment|bank connectivity|sox)\b/i.test(text)) {
    return "Treasury modernization and finance-controls move.";
  }
  if (/\b(vendor|contract|renewal|sourcing|commercial)\b/i.test(text)) {
    return "Vendor and commercial optimization move.";
  }
  if (/\b(ai|agent|copilot|automation|model)\b/i.test(text)) {
    return "AI-enabled operating-model change.";
  }
  if (/\b(data|integration|platform|analytics|lakehouse)\b/i.test(text)) {
    return "Data readiness and platform modernization move.";
  }
  return "";
}

export function extractDeterministicBriefFields(
  conversationText: string,
): Record<FieldId, string> {
  const fields: Partial<Record<FieldId, string>> = {};
  const matches = Array.from(
    conversationText.matchAll(new RegExp(`\\b(${ALL_LABELS})\\s*:`, "gi")),
  ).filter((match) => {
    const before = conversationText
      .slice(Math.max(0, (match.index ?? 0) - 7), match.index ?? 0)
      .toLowerCase();
    return !before.endsWith("out of ");
  });

  for (let i = 0; i < matches.length; i += 1) {
    const match = matches[i];
    const rawLabel = match[1]?.toLowerCase();
    const start = (match.index ?? 0) + match[0].length;
    const end = matches[i + 1]?.index ?? conversationText.length;
    const mapped = LABEL_TO_FIELD.find(({ labels }) =>
      labels.some((label) => label.toLowerCase() === rawLabel),
    );
    if (!mapped || fields[mapped.field]) continue;

    const value = compact(
      stripConversationRolePrefix(conversationText.slice(start, end)),
    );
    if (value) fields[mapped.field] = value;
  }

  if (!fields["problem-statement"]) {
    const problem = deriveProblemStatement(conversationText);
    if (problem) fields["problem-statement"] = problem;
  }

  if (!fields.archetype) {
    const archetype = deriveArchetype(conversationText);
    if (archetype) fields.archetype = archetype;
  }

  const complete: Record<FieldId, string> = {} as Record<FieldId, string>;
  for (const id of FIELD_IDS) {
    const value = fields[id];
    if (typeof value === "string" && value.trim()) {
      complete[id] = value.trim();
    }
  }
  return complete;
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

    const deterministicFields = extractDeterministicBriefFields(conversationText);

    if (!conversationText || !process.env.ANTHROPIC_API_KEY) {
      // Graceful no-op: the manual scaffold + chat still work.
      return Response.json({ fields: deterministicFields });
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
    if (!match) return Response.json({ fields: deterministicFields });

    let parsed: Record<string, unknown> = {};
    try {
      parsed = JSON.parse(match[0]) as Record<string, unknown>;
    } catch {
      return Response.json({ fields: deterministicFields });
    }

    const fields: Record<string, string> = { ...deterministicFields };
    for (const id of FIELD_IDS) {
      const v = parsed[id];
      if (!fields[id] && typeof v === "string" && v.trim()) {
        fields[id] = v.trim();
      }
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
