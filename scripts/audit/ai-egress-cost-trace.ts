import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import dotenv from 'dotenv';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

export interface AiEgressAuditRow {
  id: string;
  tenant_id: string;
  user_id: string | null;
  workflow: string;
  provider: string;
  model: string | null;
  route: string | null;
  data_class: string | null;
  policy_decision: string | null;
  decision_reason: string | null;
  request_metadata: Record<string, unknown> | null;
  error_message: string | null;
  created_at: string;
}

export interface CostTraceRow {
  auditId: string;
  workflow: string;
  provider: string;
  model: string;
  createdAt: string;
  inputTokens: number;
  outputTokens: number;
  costUsd: number;
  costBasis: 'provider_metadata' | 'metadata_estimate' | 'turn_text_estimate' | 'zero_rate';
  policyDecision: string | null;
  metadata: Record<string, unknown> | null;
}

export interface TurnCostTrace {
  tenantId: string;
  startedAt: string;
  completedAt: string;
  rowCount: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  totalCostUsd: number;
  rows: CostTraceRow[];
}

export interface TenantResolution {
  id: string;
  key: string;
  name: string;
}

const PRICE_PER_MILLION_TOKENS: Record<string, { input: number; output: number }> = {
  'claude-sonnet-4-6': { input: 3, output: 15 },
  'claude-3-5-sonnet': { input: 3, output: 15 },
  'claude-haiku-4-5': { input: 0.8, output: 4 },
  'claude-3-5-haiku': { input: 0.8, output: 4 },
  'text-embedding-3-large': { input: 0.13, output: 0 },
  'text-embedding-3-small': { input: 0.02, output: 0 },
};

export function loadAuditEnv(): void {
  const explicit = process.env.DOTENV_CONFIG_PATH;
  const candidates = [
    explicit,
    path.join(process.cwd(), '.env.local'),
    path.join(process.cwd(), '.env'),
  ].filter(Boolean) as string[];
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      dotenv.config({ path: candidate, override: false });
    }
  }
}

export function createAuditSupabaseClient(): SupabaseClient {
  loadAuditEnv();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL/SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY for audit cost trace');
  }
  return createClient(url, key, { auth: { persistSession: false } });
}

export async function resolveTenantForCostTrace(
  sb: SupabaseClient,
  tenant: string,
): Promise<TenantResolution> {
  const normalized = tenant.trim().toLowerCase();
  const aliases =
    normalized === 'apex'
      ? ['apex', 'apex-retail', 'apexretail', 'Apex Retail Group']
      : normalized === 'meridian'
        ? ['meridian', 'meridian-health', 'Meridian Health']
        : [normalized];

  const { data, error } = await sb
    .from('clients')
    .select('id, tenant_key, slug, name')
    .or([
      ...aliases.map((alias) => `tenant_key.eq.${alias}`),
      ...aliases.map((alias) => `slug.eq.${alias}`),
      ...aliases.map((alias) => `name.ilike.${alias}`),
    ].join(','))
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new Error(`Could not resolve tenant for cost trace: ${tenant}`);
  const row = data as { id: string; tenant_key?: string | null; slug?: string | null; name: string };
  return {
    id: row.id,
    key: row.tenant_key ?? row.slug ?? normalized,
    name: row.name,
  };
}

export async function readTurnCostTrace(input: {
  sb: SupabaseClient;
  tenantId: string;
  startedAt: string;
  completedAt: string;
  promptText?: string;
  responseText?: string;
  workflowPrefix?: string;
}): Promise<TurnCostTrace> {
  const started = new Date(new Date(input.startedAt).getTime() - 2_000).toISOString();
  const completed = new Date(new Date(input.completedAt).getTime() + 2_000).toISOString();
  let query = input.sb
    .from('ai_egress_audit')
    .select('id, tenant_id, user_id, workflow, provider, model, route, data_class, policy_decision, decision_reason, request_metadata, error_message, created_at')
    .eq('tenant_id', input.tenantId)
    .gte('created_at', started)
    .lte('created_at', completed)
    .order('created_at', { ascending: true });

  if (input.workflowPrefix) {
    query = query.ilike('workflow', `${input.workflowPrefix}%`);
  }

  const { data, error } = await query;
  if (error) throw error;

  const rows = ((data ?? []) as AiEgressAuditRow[]).map((row) =>
    estimateCostForAuditRow(row, {
      promptText: input.promptText ?? '',
      responseText: input.responseText ?? '',
    }),
  );
  return {
    tenantId: input.tenantId,
    startedAt: input.startedAt,
    completedAt: input.completedAt,
    rowCount: rows.length,
    totalInputTokens: rows.reduce((sum, row) => sum + row.inputTokens, 0),
    totalOutputTokens: rows.reduce((sum, row) => sum + row.outputTokens, 0),
    totalCostUsd: roundUsd(rows.reduce((sum, row) => sum + row.costUsd, 0)),
    rows,
  };
}

export function estimateCostForAuditRow(
  row: AiEgressAuditRow,
  turn: { promptText: string; responseText: string },
): CostTraceRow {
  const metadata = row.request_metadata ?? {};
  const metadataCost = firstNumber(metadata, ['costUsd', 'cost_usd', 'estimatedCostUsd', 'estimated_cost_usd']);
  const model = row.model ?? String(metadata.model ?? 'unknown');
  const inputTokensFromMetadata = firstNumber(metadata, ['inputTokens', 'input_tokens', 'promptTokens', 'prompt_tokens']);
  const outputTokensFromMetadata = firstNumber(metadata, ['outputTokens', 'output_tokens', 'completionTokens', 'completion_tokens']);

  if (metadataCost !== null) {
    return {
      auditId: row.id,
      workflow: row.workflow,
      provider: row.provider,
      model,
      createdAt: row.created_at,
      inputTokens: Math.round(inputTokensFromMetadata ?? 0),
      outputTokens: Math.round(outputTokensFromMetadata ?? 0),
      costUsd: roundUsd(metadataCost),
      costBasis: 'provider_metadata',
      policyDecision: row.policy_decision,
      metadata: row.request_metadata,
    };
  }

  const rate = findRate(model);
  if (!rate) {
    return {
      auditId: row.id,
      workflow: row.workflow,
      provider: row.provider,
      model,
      createdAt: row.created_at,
      inputTokens: 0,
      outputTokens: 0,
      costUsd: 0,
      costBasis: 'zero_rate',
      policyDecision: row.policy_decision,
      metadata: row.request_metadata,
    };
  }

  const isEmbedding = /embed/i.test(row.workflow) || /embedding/i.test(model);
  const inputTokens = Math.round(inputTokensFromMetadata ?? estimateTokens(turn.promptText || row.workflow));
  const outputTokens = isEmbedding
    ? 0
    : Math.round(outputTokensFromMetadata ?? estimateTokens(turn.responseText));
  const cost = (inputTokens / 1_000_000) * rate.input + (outputTokens / 1_000_000) * rate.output;

  return {
    auditId: row.id,
    workflow: row.workflow,
    provider: row.provider,
    model,
    createdAt: row.created_at,
    inputTokens,
    outputTokens,
    costUsd: roundUsd(cost),
    costBasis: inputTokensFromMetadata !== null || outputTokensFromMetadata !== null
      ? 'metadata_estimate'
      : 'turn_text_estimate',
    policyDecision: row.policy_decision,
    metadata: row.request_metadata,
  };
}

function findRate(model: string): { input: number; output: number } | null {
  const normalized = model.toLowerCase();
  for (const [prefix, rate] of Object.entries(PRICE_PER_MILLION_TOKENS)) {
    if (normalized.includes(prefix)) return rate;
  }
  return null;
}

function firstNumber(record: Record<string, unknown>, keys: string[]): number | null {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (typeof value === 'string' && value.trim() && Number.isFinite(Number(value))) {
      return Number(value);
    }
  }
  const nestedUsage = record.usage;
  if (nestedUsage && typeof nestedUsage === 'object') {
    return firstNumber(nestedUsage as Record<string, unknown>, keys);
  }
  return null;
}

function estimateTokens(text: string): number {
  const chars = Math.max(0, text.trim().length);
  return Math.max(1, Math.ceil(chars / 4));
}

function roundUsd(value: number): number {
  return Math.round(value * 1_000_000) / 1_000_000;
}
