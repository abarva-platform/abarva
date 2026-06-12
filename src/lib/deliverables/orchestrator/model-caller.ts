// Audited-egress ModelCaller for the Deliverable Intelligence Orchestrator.
//
// Backs the orchestrator's injected ModelCaller with the audited Anthropic egress
// path (getAuditedAnthropicClient → client.messages.create). Each pass is its own
// audited call with its own (generous) token budget and a workflow tag that records
// the module / deliverable / pass. Board-grade work runs on claude-opus-4-8.

import { getAuditedAnthropicClient } from "@/lib/agent/stream";
import type { AiDataClass } from "@/lib/integrations/ai-egress";
import { resolveDocumentPolicy } from "@/lib/ai/document-generation-policy";
import { runDeliverableOrchestration } from "./orchestrator";
import type {
  ModelCaller,
  OrchestrationOptions,
  OrchestrationResult,
} from "./orchestrator";
import type { DeliverableIntelligenceRequest, PassPrompt } from "./types";

export interface AuditedModelCallerOptions {
  tenantId: string;
  userId?: string;
  /** override the model; defaults to claude-opus-4-8 for board-grade work. */
  model?: string;
  /** persisted artifact id, when generation is tied to a saved artifact. */
  artifactId?: string;
  dataClass?: AiDataClass;
  metadata?: Record<string, unknown>;
}

function extractText(content: Array<{ type: string; text?: string }>): string {
  return content
    .map((b) => (b.type === "text" ? (b.text ?? "") : ""))
    .join("")
    .trim();
}

/**
 * Build a ModelCaller bound to one tenant/user. The orchestrator calls it once per
 * pass; this wraps each call in the audited egress with a pass-specific workflow tag.
 */
export function createAuditedModelCaller(
  opts: AuditedModelCallerOptions,
): ModelCaller {
  return async (prompt: PassPrompt, req: DeliverableIntelligenceRequest) => {
    // Resolve the model from the central policy by the deliverable's tier
    // (tier-4 packages → large-package model), unless the caller pinned one.
    const model =
      opts.model ??
      resolveDocumentPolicy({ deliverableType: req.deliverableType }).model;
    const fullPrompt = `${prompt.system}\n\n${prompt.user}`;
    const { client } = await getAuditedAnthropicClient({
      tenantId: opts.tenantId,
      ...(opts.userId !== undefined ? { userId: opts.userId } : {}),
      workflow: `deliverable:${req.module}:${req.deliverableType}:${prompt.pass}`,
      prompt: fullPrompt,
      model,
      dataClass: opts.dataClass ?? "confidential",
      ...(opts.artifactId !== undefined ? { artifactId: opts.artifactId } : {}),
      artifactType: `deliverable_${req.deliverableType}`,
      metadata: {
        ...(opts.metadata ?? {}),
        module: req.module,
        archetype: req.useCaseArchetype,
        deliverableType: req.deliverableType,
        pass: prompt.pass,
        highStakes: prompt.highStakes,
        maxTokens: prompt.maxTokens,
      },
    });

    // Stream and resolve the final message. Board-grade passes can exceed the SDK's
    // 10-minute non-streaming ceiling; streaming removes that limit.
    const message = await client.messages
      .stream({
        model,
        max_tokens: prompt.maxTokens,
        system: prompt.system,
        messages: [{ role: "user", content: prompt.user }],
      })
      .finalMessage();

    return { text: extractText(message.content), responseId: message.id };
  };
}

/**
 * One-call entry point: run the full multi-pass orchestration for a deliverable using
 * the audited Anthropic egress. The orchestrator enforces the plan gate and quality
 * gate; the returned result carries the document only when both pass.
 */
export async function generateDeliverable(
  req: DeliverableIntelligenceRequest,
  opts: AuditedModelCallerOptions,
  orchestrationOpts?: OrchestrationOptions,
): Promise<OrchestrationResult> {
  return runDeliverableOrchestration(
    req,
    createAuditedModelCaller(opts),
    orchestrationOpts,
  );
}
