// Audited-egress ModelCaller for the Deliverable Intelligence Orchestrator.
//
// Backs the orchestrator's injected ModelCaller with the audited OpenAI egress
// path (preflightOpenAIDirectClient → client.responses.create). Each pass is its
// own audited call with its own generous token budget and a workflow tag that
// records the module / deliverable / pass.

import {
  preflightOpenAIDirectClient,
  type AiDataClass,
} from "@/lib/integrations/ai-egress";
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
  /** override the model; defaults to the document policy's OpenAI model. */
  model?: string;
  /** persisted artifact id, when generation is tied to a saved artifact. */
  artifactId?: string;
  dataClass?: AiDataClass;
  metadata?: Record<string, unknown>;
}

function extractResponseText(response: unknown): string {
  if (
    response &&
    typeof response === "object" &&
    "output_text" in response &&
    typeof (response as { output_text?: unknown }).output_text === "string"
  ) {
    return (response as { output_text: string }).output_text.trim();
  }

  const output = (response as { output?: unknown } | null)?.output;
  if (!Array.isArray(output)) return "";
  const chunks: string[] = [];
  for (const item of output) {
    const content = (item as { content?: unknown } | null)?.content;
    if (!Array.isArray(content)) continue;
    for (const block of content) {
      const text =
        (block as { text?: unknown } | null)?.text ??
        (block as { output_text?: unknown } | null)?.output_text;
      if (typeof text === "string") chunks.push(text);
    }
  }
  return chunks.join("").trim();
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
    const preflight = await preflightOpenAIDirectClient({
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
    if (!preflight.ok) {
      throw new Error(`OpenAI egress denied: ${preflight.reason}`);
    }

    const response = await preflight.client.responses.create({
        model,
        instructions: prompt.system,
        input: prompt.user,
        max_output_tokens: prompt.maxTokens,
      });

    return {
      text: extractResponseText(response),
      responseId:
        typeof response.id === "string" ? response.id : preflight.auditId,
    };
  };
}

/**
 * One-call entry point: run the full multi-pass orchestration for a deliverable using
 * the audited OpenAI egress. The orchestrator enforces the plan gate and quality
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
