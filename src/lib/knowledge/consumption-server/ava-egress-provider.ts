/**
 * AiEgressAvaReasoningProvider — the PRODUCTION aVa reasoning path.
 *
 * Routes aVa answers through the repository's audited Anthropic egress
 * (`src/lib/integrations/ai-egress`): tenant-policy gated, usage-capped, and
 * fully audit-logged. This is server-only (it writes the Supabase audit row).
 *
 * Fallback semantics (item 2): the deterministic provider is used ONLY when the
 * model path is genuinely unavailable (no ANTHROPIC_API_KEY). A tenant-policy
 * DENIAL is not "unavailable" — it is surfaced as a refusal, never silently
 * stubbed (that would bypass the governed policy decision).
 *
 * Grounding: aVa answers only from evidence in scope. This provider refuses
 * before calling the model when the packet carries no accepted evidence, and
 * instructs the model to answer only from the governed baseline and to refuse
 * rather than estimate. (Resolving evidence refs → full content via the broker
 * is the grounding-depth refinement; the audited egress path itself is wired.)
 */

import "server-only";
import {
  callModel,
  createAnthropicDirectTextAdapter,
  createSupabaseAiEgressAuditSink,
  loadTenantAiPolicyRecord,
} from "@/lib/integrations/ai-egress";
import type {
  AvaAnswer,
  AvaKnowledgePacket,
  AvaReasoningProvider,
  AvaRequest,
} from "../consumption-contracts";

const AVA_MODEL = "claude-sonnet-4-6";
const AVA_WORKLOAD = "intelligence_answer"; // prod-realtime lane

const SYSTEM_PROMPT = [
  "You are aVa, AbarVa's governed knowledge companion.",
  "Answer ONLY from the accepted, governed Knowledge for the active baseline described in the context.",
  "Never invent numbers or facts the sources do not contain. If the evidence in scope cannot substantiate an answer, refuse and say what evidence would be needed.",
  "Your answer is ephemeral and is not accepted Knowledge. State your limitations and what would change the answer.",
  "Do not expose raw record ids, internal identifiers, scaffolding labels, JSON, or HTML in your prose.",
].join(" ");

export class AiEgressAvaReasoningProvider implements AvaReasoningProvider {
  /** The genuine model-path availability signal (repo convention). */
  isAvailable(): boolean {
    return Boolean(process.env.ANTHROPIC_API_KEY);
  }

  async ask(request: AvaRequest): Promise<AvaAnswer> {
    const { packet, intent, question } = request;

    // Refuse before spending a model call when nothing is in scope.
    if (packet.evidenceRefs.length === 0 && packet.acceptedFactRefs.length === 0) {
      return refused(
        "Required evidence is unavailable for the current scope; aVa does not estimate.",
        ["No accepted evidence is in scope for the current lens, filters and permission boundary."],
      );
    }

    let tenantId: string;
    let policy: Awaited<ReturnType<typeof loadTenantAiPolicyRecord>>["policy"];
    try {
      const record = await loadTenantAiPolicyRecord(packet.tenantKey);
      tenantId = record.tenantId;
      policy = record.policy;
    } catch {
      // Cannot resolve tenant policy → treat as unavailable so the route falls back.
      return refused("aVa could not resolve the governed tenant policy.", ["Tenant policy unavailable."]);
    }

    let result;
    try {
      result = await callModel({
        tenantId,
        workflow: "knowledge-ava-answer",
        provider: "anthropic",
        route: "anthropic-direct",
        model: AVA_MODEL,
        prompt: buildPrompt(intent, question, packet),
        dataClass: "confidential",
        metadata: { module: "knowledge", mode: packet.mode, lens: packet.lens, baseline: packet.knowledgeBaselineRef },
        policy,
        auditSink: createSupabaseAiEgressAuditSink({
          intendedTenantKey: packet.tenantKey,
          resolvedTenantKey: tenantId,
          tenantId,
        }),
        adapter: createAnthropicDirectTextAdapter({
          system: SYSTEM_PROMPT,
          model: AVA_MODEL,
          maxTokens: 2000,
          workload: AVA_WORKLOAD,
        }),
      });
    } catch (err) {
      // Provider/network failure throws — surface as refusal (route may fall back).
      return refused(`aVa reasoning failed: ${String((err as Error)?.message ?? err)}`, ["Model call failed."]);
    }

    if (!result.ok) {
      // Policy denial or usage cap — surfaced, never silently stubbed.
      return refused(result.reason, ["aVa is governed off for this tenant or scope."]);
    }

    const gapNote = packet.knownGapRefs.length > 0
      ? `${packet.knownGapRefs.length} known gap(s) constrain this answer.`
      : "No known gaps constrain this answer.";
    return {
      outcome: packet.knownGapRefs.length > 0 ? "partial" : "answered",
      sections: [{ heading: headingFor(intent), body: result.response, evidenceRefs: packet.evidenceRefs.slice(0, 6) }],
      evidenceRefs: packet.evidenceRefs.slice(0, 6),
      limitations: [gapNote, "aVa's answer is ephemeral and is not accepted Knowledge unless separately promoted."],
      whatWouldChangeIt: ["Closing the known gaps in scope.", "Loading additional accepted evidence for the selected entities."],
      refusalReason: null,
      promoted: false,
    };
  }
}

function buildPrompt(intent: string, question: string, packet: AvaKnowledgePacket): string {
  return [
    `Intent: ${intent}. Mode: ${packet.mode}. Lens: ${packet.lens}. Depth: ${packet.depth}. Scope: ${packet.currentTargetScope}.`,
    `Active Knowledge Baseline: ${packet.knowledgeBaselineRef}.`,
    `In-scope accepted evidence references: ${packet.evidenceRefs.slice(0, 30).join(", ") || "none"}.`,
    `In-scope accepted fact references: ${packet.acceptedFactRefs.slice(0, 30).join(", ") || "none"}.`,
    `Known gaps in scope: ${packet.knownGapRefs.slice(0, 20).join(", ") || "none"}.`,
    `Focal entities: ${packet.focalEntityRefs.join(", ") || "none"}.`,
    "",
    `Question: ${question}`,
    "",
    "Answer only from the governed Knowledge for this baseline. If you cannot substantiate the answer from the evidence in scope, refuse and state what evidence is needed.",
  ].join("\n");
}

function headingFor(intent: string): string {
  switch (intent) {
    case "investigate": return "Investigation";
    case "compare": return "Comparison";
    case "act": return "Suggested action (preview only)";
    default: return "Answer";
  }
}

function refused(reason: string, limitations: string[]): AvaAnswer {
  return {
    outcome: "refused",
    sections: [],
    evidenceRefs: [],
    limitations,
    whatWouldChangeIt: ["Load or accept evidence for this scope, or widen the selection to entities that carry evidence."],
    refusalReason: reason,
    promoted: false,
  };
}
