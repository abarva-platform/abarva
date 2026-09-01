// Audited-egress ModelCaller for the Deliverable Intelligence Orchestrator.
//
// Backs the orchestrator's injected ModelCaller with the audited Anthropic egress
// path (preflightAnthropicDirectClient → client.messages.stream). Each pass is its
// own audited call with its own generous token budget and a workflow tag that
// records the module / deliverable / pass.

import {
  preflightAnthropicDirectClient,
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
  /** override the model; defaults to the document policy's Claude model. */
  model?: string;
  /** persisted artifact id, when generation is tied to a saved artifact. */
  artifactId?: string;
  dataClass?: AiDataClass;
  metadata?: Record<string, unknown>;
}

/**
 * A long-lived streaming fetch to the Anthropic API can have its underlying socket
 * closed prematurely (proxy/idle timeout, transient network blip) — Node's fetch
 * implementation surfaces this as a bare `TypeError: terminated` with no retry, no
 * status code, and no indication it was a transient network event rather than a
 * real generation failure. Observed live: a section_draft/synthesis pass reaching
 * 100% progress and then failing the whole run with error "terminated". Retry a
 * bounded number of times on this narrow class of network-transient errors only —
 * a real model/prompt error (bad request, content policy, etc.) is not retried.
 */
const RETRYABLE_STREAM_ERROR_RE =
  /\bterminated\b|other side closed|ECONNRESET|ETIMEDOUT|EPIPE|socket hang up|fetch failed|network (error|timeout)/i;

function isRetryableStreamError(err: unknown): boolean {
  const message = err instanceof Error ? err.message : String(err);
  return RETRYABLE_STREAM_ERROR_RE.test(message);
}

const MAX_STREAM_RETRIES = 2;

type AnthropicUserContentBlock = {
  type: "text";
  text: string;
  cache_control?: { type: "ephemeral" };
};

async function withStreamRetry<T>(fn: () => Promise<T>): Promise<T> {
  let lastErr: unknown;
  for (let attempt = 0; attempt <= MAX_STREAM_RETRIES; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      if (attempt === MAX_STREAM_RETRIES || !isRetryableStreamError(err)) throw err;
      const backoffMs = 1000 * (attempt + 1);
      await new Promise((resolve) => setTimeout(resolve, backoffMs));
    }
  }
  throw lastErr;
}

function extractResponseText(response: unknown): string {
  const content = (response as { content?: unknown } | null)?.content;
  if (Array.isArray(content)) {
    const chunks: string[] = [];
    for (const block of content) {
      const type = (block as { type?: unknown } | null)?.type;
      const text = (block as { text?: unknown } | null)?.text;
      if ((type === undefined || type === "text") && typeof text === "string") {
        chunks.push(text);
      }
    }
    return chunks.join("").trim();
  }

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

function buildUserMessageContent(
  prompt: PassPrompt,
): string | AnthropicUserContentBlock[] {
  const context = prompt.cacheableContext;
  if (!context || !prompt.user.startsWith(context)) return prompt.user;
  const remainder = prompt.user.slice(context.length);
  const blocks: AnthropicUserContentBlock[] = [
    {
      type: "text",
      text: context,
      cache_control: { type: "ephemeral" },
    },
  ];
  if (remainder.trim()) {
    blocks.push({
      type: "text",
      text: remainder,
    });
  }
  return blocks;
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
    const preflight = await preflightAnthropicDirectClient({
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
      throw new Error(`Anthropic egress denied: ${preflight.reason}`);
    }

    // Board-grade passes request large token budgets, so a single non-streaming
    // call can exceed the Anthropic SDK's 10-minute ceiling — the SDK rejects it
    // pre-flight ("Streaming is required for operations that may take longer than
    // 10 minutes"). Stream the response and assemble the final Message instead;
    // this lifts the ceiling while preserving the same Message shape that
    // extractResponseText / response.id already consume.
    const response = await withStreamRetry(() =>
      preflight.client.messages
        .stream({
          model,
          system: prompt.system,
          messages: [{ role: "user", content: buildUserMessageContent(prompt) }],
          max_tokens: prompt.maxTokens,
        })
        .finalMessage(),
    );

    return {
      text: extractResponseText(response),
      responseId:
        typeof response.id === "string" ? response.id : preflight.auditId,
    };
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
