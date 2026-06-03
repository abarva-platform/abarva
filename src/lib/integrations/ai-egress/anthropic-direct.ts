import Anthropic from '@anthropic-ai/sdk';
import type {
  ContentBlock,
  ContentBlockParam,
  Message,
  MessageCreateParamsNonStreaming,
  MessageParam,
  TextBlock,
  ToolResultBlockParam,
  ToolUseBlock,
} from '@anthropic-ai/sdk/resources/messages';

import type { AiModelAdapter } from './types';
import { buildAnthropicPromptCachePayload } from './anthropic-prompt-cache';
import { preflightModelEgress } from './call-model';
import { createSupabaseAiEgressAuditSink } from './supabase-audit';
import { loadTenantAiPolicyRecord } from './tenant-policy';
import type { AiDataClass, AiPreflightResult } from './types';

let anthropicClient: Anthropic | null = null;

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

export function getAnthropicDirectClient(): Anthropic {
  if (anthropicClient) return anthropicClient;
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('Missing ANTHROPIC_API_KEY');
  }
  anthropicClient = new Anthropic({ apiKey });
  return anthropicClient;
}

export function createAnthropicDirectTextAdapter(args: {
  system?: string;
  model: string;
  maxTokens: number;
  tools?: Anthropic.Tool[];
}): AiModelAdapter {
  return async (request) => {
    const client = getAnthropicDirectClient();
    const promptCache = buildAnthropicPromptCachePayload({
      system: args.system,
      prompt: request.prompt,
      metadata: request.metadata,
    });
    const response = await client.messages.create({
      model: request.model ?? args.model,
      max_tokens: args.maxTokens,
      ...(promptCache.system ? { system: promptCache.system } : {}),
      ...(args.tools && args.tools.length > 0 ? { tools: args.tools } : {}),
      messages: promptCache.messages,
    } satisfies MessageCreateParamsNonStreaming) as Message;
    const text = response.content
      .filter((block): block is TextBlock => block.type === 'text')
      .map((block) => block.text)
      .join('\n');
    return {
      response: text,
      model: response.model,
      metadata: {
        usage: response.usage,
        anthropicPromptCache: promptCache.auditMetadata,
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
}): Promise<AiPreflightResult<AnthropicDirectClient>> {
  const { tenantId, policy } = await loadTenantAiPolicyRecord(args.tenantId);
  // PRE-W4-PR-6: every ai_egress_audit row stamps intended + resolved
  // tenant. `args.tenantId` is what the caller asked for; `tenantId`
  // from `loadTenantAiPolicyRecord` is what we actually resolved to.
  return preflightModelEgress({
    tenantId,
    userId: args.userId,
    workflow: args.workflow,
    provider: 'anthropic',
    route: 'anthropic-direct',
    model: args.model,
    prompt: args.prompt,
    dataClass: args.dataClass,
    artifactId: args.artifactId,
    artifactType: args.artifactType,
    metadata: args.metadata,
    policy,
    auditSink: createSupabaseAiEgressAuditSink({
      intendedTenantKey: args.tenantId,
      resolvedTenantKey: tenantId,
      tenantId,
    }),
    clientFactory: getAnthropicDirectClient,
  });
}
