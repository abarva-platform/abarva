// POST /api/programs/workspace/[moveId]/assemble-pattern
// Increment 12 — governed Claude Pattern Assembly. AbarVa builds the packet
// (client-supplied, from the Move's own data), Claude assembles candidate
// options/tradeoffs/risks through the AUDITED egress path, and AbarVa VALIDATES
// each item. Claude never invents numbers/baselines/value/evidence/readiness/
// approvals — the system prompt forbids it AND validateAssembledResponse labels
// any unbacked number `needs_confirmation` and any overreach `not_allowed`. On
// any failure the route returns no items, so the deterministic feed-forward
// stands. Move-scoped; never promoted to enterprise context.

import {
  requireTenancy,
  tenancyErrorResponse,
} from "@/app/api/v1/programs/_auth";
import { getProgramById } from "@/lib/programs/queries";
import { getActiveClientRow } from "@/lib/active-client";
import { preflightAnthropicDirectClient } from "@/lib/integrations/ai-egress";
import {
  buildPatternAssemblyPacket,
  validateAssembledResponse,
  type AssembledPatternItem,
  type PatternAssemblyPacket,
} from "@/lib/programs/phase-templates";
import type { TenancyCtx } from "@/lib/programs/types.db";

const MODEL = "claude-sonnet-4-6";
const MAX_TOKENS = 1400;

const SYSTEM_PROMPT = [
  "You are AbarVa's solution assembler for a consulting Move. From the governed packet you are given, assemble candidate SOLUTION OPTIONS, TRADEOFFS, and RISKS that inform the next phase.",
  "HARD RULES — non-negotiable:",
  "1. Never invent or assert any number, baseline, metric, percentage, financial value, ROI, evidence claim, readiness level, or approval status. Those exist only if explicitly present in the packet. If a point needs a number that is not in the packet, phrase it qualitatively (no figure).",
  "2. Never propose anything that violates the packet's control constraints or exceeds its stated readiness. No autonomous approvals where human approval is required.",
  "3. Be specific to this Move's evidence, gaps, and building blocks. No generic filler.",
  "OUTPUT: return ONLY a JSON array (no prose, no markdown) of objects:",
  '{"statement": string, "kind": "option"|"tradeoff"|"risk", "assertsNumber": boolean, "evidenceBacked": boolean}',
  "Set assertsNumber=true if the statement contains any number/metric. Set evidenceBacked=true ONLY if the statement restates a fact explicitly present in the packet. Max 8 items.",
].join("\n");

function jsonError(status: number, error: string): Response {
  return Response.json({ error }, { status });
}

/** Minimal shape guard for the client-supplied packet. */
function isPacket(x: unknown): x is PatternAssemblyPacket {
  if (!x || typeof x !== "object") return false;
  const p = x as Record<string, unknown>;
  return (
    typeof p.moveId === "string" &&
    typeof p.phase === "string" &&
    Array.isArray(p.selectedBuildingBlocks) &&
    Array.isArray(p.controlConstraints) &&
    typeof p.readiness === "object" &&
    p.readiness !== null
  );
}

function parseItems(text: string): AssembledPatternItem[] {
  const start = text.indexOf("[");
  const end = text.lastIndexOf("]");
  if (start === -1 || end === -1 || end < start) return [];
  let raw: unknown;
  try {
    raw = JSON.parse(text.slice(start, end + 1));
  } catch {
    return [];
  }
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((r): r is Record<string, unknown> => !!r && typeof r === "object")
    .map((r) => ({
      statement: typeof r.statement === "string" ? r.statement : "",
      evidenceBacked: r.evidenceBacked === true,
      assertsNumber: r.assertsNumber === true,
    }))
    .filter((i) => i.statement.trim().length > 0)
    .slice(0, 8);
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ moveId: string }> },
) {
  let ctx: TenancyCtx;
  try {
    ctx = await requireTenancy();
  } catch (err) {
    try {
      return tenancyErrorResponse(err);
    } catch {
      return jsonError(500, "internal_error");
    }
  }

  const { moveId } = await params;
  if (!moveId) return jsonError(400, "missing_move_id");

  const program = await getProgramById(ctx, moveId);
  if (!program) return jsonError(403, "forbidden");
  if (program.archivedAt || program.deletedAt) {
    return jsonError(410, "archived_or_deleted");
  }

  let body: { packet?: unknown };
  try {
    body = await req.json();
  } catch {
    return jsonError(400, "invalid_json");
  }
  if (!isPacket(body.packet)) return jsonError(400, "invalid_packet");
  // Server owns identity — the packet is scoped to THIS move.
  const packet = buildPatternAssemblyPacket({ ...body.packet, moveId });

  const activeClient = await getActiveClientRow();
  if (!activeClient) return jsonError(403, "no_client");

  const userPrompt = [
    "GOVERNED PACKET (assemble options/tradeoffs/risks from ONLY this):",
    JSON.stringify(packet, null, 2),
  ].join("\n");

  // Deterministic fallback on ANY failure: return no items, feed-forward stands.
  try {
    const preflight = await preflightAnthropicDirectClient({
      tenantId: activeClient.id,
      workflow: "moves-pattern-assembly",
      model: MODEL,
      prompt: `${SYSTEM_PROMPT}\n\n${userPrompt}`,
      dataClass: "confidential",
      metadata: { moveId, phase: packet.phase, surface: "moves-pattern-assembly" },
    });
    if (!preflight.ok) {
      return Response.json({ items: [], reason: preflight.reason }, { status: 200 });
    }
    const message = await preflight.client.messages.create({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userPrompt }],
    });
    const text = message.content
      .filter((block) => block.type === "text")
      .map((block) => ("text" in block ? block.text : ""))
      .join("\n");
    const assembled = parseItems(text);
    // AbarVa validates — the guardrail that Claude cannot bypass.
    const validated = validateAssembledResponse(packet, assembled);
    return Response.json({ items: validated }, { status: 200 });
  } catch (err) {
    console.error("[assemble-pattern] failed", err);
    return Response.json({ items: [] }, { status: 200 });
  }
}
