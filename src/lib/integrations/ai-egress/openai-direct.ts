import OpenAI from 'openai';

import { preflightModelEgress } from './call-model';
import { createSupabaseAiEgressAuditSink } from './supabase-audit';
import { loadTenantAiPolicyRecord } from './tenant-policy';
import type { AiDataClass, AiPreflightResult } from './types';

let openAiClient: OpenAI | null = null;

export type OpenAIDirectClient = OpenAI;

export function getOpenAIDirectClient(): OpenAI {
  if (openAiClient) return openAiClient;
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('Missing OPENAI_API_KEY');
  }
  openAiClient = new OpenAI({ apiKey });
  return openAiClient;
}

export async function preflightOpenAIDirectClient(args: {
  tenantId: string;
  userId?: string;
  workflow: string;
  prompt: string;
  model: string;
  dataClass?: AiDataClass;
  artifactId?: string;
  artifactType?: string;
  metadata?: Record<string, unknown>;
}): Promise<AiPreflightResult<OpenAIDirectClient>> {
  const { tenantId, policy } = await loadTenantAiPolicyRecord(args.tenantId);
  return preflightModelEgress({
    tenantId,
    userId: args.userId,
    workflow: args.workflow,
    provider: 'openai',
    route: 'openai-direct',
    model: args.model,
    prompt: args.prompt,
    dataClass: args.dataClass,
    artifactId: args.artifactId,
    artifactType: args.artifactType,
    metadata: args.metadata,
    policy,
    auditSink: createSupabaseAiEgressAuditSink(),
    clientFactory: getOpenAIDirectClient,
  });
}
