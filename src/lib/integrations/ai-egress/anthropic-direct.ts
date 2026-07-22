import Anthropic from "@anthropic-ai/sdk";
import type {
  ContentBlock,
  ContentBlockParam,
  Message,
  MessageCreateParamsNonStreaming,
  MessageParam,
  TextBlock,
  ToolResultBlockParam,
  ToolUseBlock,
} from "@anthropic-ai/sdk/resources/messages";

import type { AiKeyLane } from "@/lib/observability/ai-workload-taxonomy";

import type { AiModelAdapter } from "./types";
import { buildAnthropicPromptCachePayload } from "./anthropic-prompt-cache";
import {
  keyLaneAuditMetadata,
  laneForWorkloadOrDefault,
  resolveAnthropicKeyForLane,
} from "./anthropic-key-lanes";
import { preflightModelEgress } from "./call-model";
import { createSupabaseAiEgressAuditSink } from "./supabase-audit";
import { loadTenantAiPolicyRecord } from "./tenant-policy";
import type { AiDataClass, AiPreflightResult } from "./types";

/**
 * One client per key lane. This was a single module-level singleton, which
 * silently pinned every workload to whichever key loaded first — the reason
 * provider-side cost attribution was impossible. Keyed by lane so each lane
 * uses its own credential when provisioned, and by resolved env var so a
 * partially-provisioned rollout cannot hand a cached shared-key client to a
 * lane that has since been given its own key.
 */
const anthropicClientsByLane = new Map<string, Anthropic>();

export type AnthropicDirectClient = Anthropic;
export type AnthropicTool = Anthropic.Tool;
export type AnthropicMessageStreamParams = Anthropic.MessageStreamParams;
export type {
  ContentBlock,
  ContentBlockParam,
  MessageParam,
  TextBlock,
  ToolResultBlockParam,
  ToolUseBlock,
};

/**
 * Get the Anthropic client for a key lane.
 *
 * Callers should pass the `workload` they are performing (a value from
 * AI_WORKLOADS); the lane is derived from it. Omitting it resolves to
 * DEFAULT_KEY_LANE and, until lane keys are provisioned, to the shared
 * `ANTHROPIC_API_KEY` — so existing zero-argument call sites keep working
 * unchanged.
 */
export function getAnthropicDirectClient(args?: {
  workload?: string | null;
  lane?: AiKeyLane;
}): Anthropic {
  const lane = args?.lane ?? laneForWorkloadOrDefault(args?.workload);
  const resolved = resolveAnthropicKeyForLane(lane);

  // Cache on lane + supplying env var: if a lane is later given its own key,
  // the cached shared-key client for that lane is not reused.
  const cacheKey = `${resolved.lane}::${resolved.envVar}`;
  const cached = anthropicClientsByLane.get(cacheKey);
  if (cached) return cached;

  const client = new Anthropic({ apiKey: resolved.apiKey });
  anthropicClientsByLane.set(cacheKey, client);
  return client;
}

/** Test seam — clears the per-lane client cache. */
export function resetAnthropicDirectClientCache(): void {
  anthropicClientsByLane.clear();
}

export function createAnthropicDirectTextAdapter(args: {
  system?: string;
  model: string;
  maxTokens: number;
  tools?: Anthropic.Tool[];
  /** Value from AI_WORKLOADS. Selects the billing key lane. */
  workload?: string;
}): AiModelAdapter {
  return async (request) => {
    const client = getAnthropicDirectClient({ workload: args.workload });
    const promptCache = buildAnthropicPromptCachePayload({
      system: args.system,
      prompt: request.prompt,
      metadata: request.metadata,
    });
    const response = (await client.messages.create({
      model: request.model ?? args.model,
      max_tokens: args.maxTokens,
      ...(promptCache.system ? { system: promptCache.system } : {}),
      ...(args.tools && args.tools.length > 0 ? { tools: args.tools } : {}),
      messages: promptCache.messages,
    } satisfies MessageCreateParamsNonStreaming)) as Message;
    const text = response.content
      .filter((block): block is TextBlock => block.type === "text")
      .map((block) => block.text)
      .join("\n");
    return {
      response: text,
      model: response.model,
      metadata: {
        usage: response.usage,
        anthropicPromptCache: promptCache.auditMetadata,
        ...keyLaneAuditMetadata(
          resolveAnthropicKeyForLane(laneForWorkloadOrDefault(args.workload)),
        ),
      },
    };
  };
}

export async function preflightAnthropicDirectClient(args: {
  tenantId: string;
  userId?: string;
  workflow: string;
  prompt: string;
  model: string;
  dataClass?: AiDataClass;
  artifactId?: string;
  artifactType?: string;
  metadata?: Record<string, unknown>;
  /**
   * Value from AI_WORKLOADS. Selects the billing key lane and is stamped on the
   * audit row so internal causality can be reconciled against provider-side
   * per-key cost. Omitting it falls back to the shared key and the default
   * lane, which is valid but yields no provider attribution.
   */
  workload?: string;
}): Promise<AiPreflightResult<AnthropicDirectClient>> {
  const { tenantId, policy } = await loadTenantAiPolicyRecord(args.tenantId);
  const lane = laneForWorkloadOrDefault(args.workload);
  const resolvedKey = resolveAnthropicKeyForLane(lane);
  // PRE-W4-PR-6: every ai_egress_audit row stamps intended + resolved
  // tenant. `args.tenantId` is what the caller asked for; `tenantId`
  // from `loadTenantAiPolicyRecord` is what we actually resolved to.
  return preflightModelEgress({
    tenantId,
    userId: args.userId,
    workflow: args.workflow,
    provider: "anthropic",
    route: "anthropic-direct",
    model: args.model,
    prompt: args.prompt,
    dataClass: args.dataClass,
    artifactId: args.artifactId,
    artifactType: args.artifactType,
    metadata: {
      ...(args.metadata ?? {}),
      ...(args.workload ? { workload: args.workload } : {}),
      ...keyLaneAuditMetadata(resolvedKey),
    },
    policy,
    auditSink: createSupabaseAiEgressAuditSink({
      intendedTenantKey: args.tenantId,
      resolvedTenantKey: tenantId,
      tenantId,
    }),
    clientFactory: () => getAnthropicDirectClient({ lane }),
  });
}
