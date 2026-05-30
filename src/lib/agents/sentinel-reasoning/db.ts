import { Pool, type PoolClient, type QueryResultRow } from 'pg';
import { createMemoryAiEgressAuditSink, createSupabaseAiEgressAuditSink, type AiEgressAuditSink, type TenantAiPolicy } from '@/lib/integrations/ai-egress';
import { CONSERVATIVE_TENANT_AI_POLICY } from '@/lib/integrations/ai-egress/policy';
import { resolvePostgresPoolMax } from '@/lib/data-plane/postgresCompat';
import type { SentinelReasoningStage } from './types';

let pool: Pool | null = null;
const memoryAuditSink = createMemoryAiEgressAuditSink();

function shouldDisableSsl(connectionString: string): boolean {
  try {
    const url = new URL(connectionString);
    if (url.searchParams.get('sslmode')?.toLowerCase() === 'disable') return true;
    return ['localhost', '127.0.0.1', '::1'].includes(url.hostname);
  } catch {
    return false;
  }
}

function getPool(): Pool {
  if (pool) return pool;
  const connectionString = process.env.DATABASE_URL?.trim();
  if (!connectionString) throw new Error('DATABASE_URL is required for Sentinel reasoning data access.');
  pool = new Pool({
    connectionString,
    application_name: 'nexus-sentinel-reasoning',
    max: resolvePostgresPoolMax(),
    idleTimeoutMillis: 5_000,
    connectionTimeoutMillis: 5_000,
    allowExitOnIdle: true,
    ssl: shouldDisableSsl(connectionString) ? false : { rejectUnauthorized: false },
  });
  return pool;
}

export async function withSentinelClient<T>(fn: (client: PoolClient) => Promise<T>): Promise<T> {
  const client = await getPool().connect();
  try {
    return await fn(client);
  } finally {
    client.release();
  }
}

export async function safeRows<T extends QueryResultRow>(sql: string, values: unknown[] = []): Promise<T[]> {
  try {
    return await withSentinelClient(async (client) => {
      const result = await client.query<T>(sql, values);
      return result.rows;
    });
  } catch {
    return [];
  }
}

function isTenantAiPolicy(value: unknown): value is TenantAiPolicy {
  if (!value || typeof value !== 'object') return false;
  const policy = value as Partial<TenantAiPolicy>;
  return (
    typeof policy.allowExternalAI === 'boolean' &&
    typeof policy.allowClaude === 'boolean' &&
    typeof policy.allowGamma === 'boolean' &&
    typeof policy.maxDataClass === 'string' &&
    typeof policy.requireRedaction === 'boolean' &&
    typeof policy.requireHumanApprovalForExports === 'boolean' &&
    typeof policy.promptResponseRetentionDays === 'number'
  );
}

export async function loadSentinelClientPolicy(clientIdOrKey: string): Promise<{
  clientId: string;
  policy: TenantAiPolicy;
}> {
  const rows = await safeRows<{ id: string; ai_policy: unknown }>(
    `
      SELECT id, ai_policy
      FROM public.clients
      WHERE id::text = $1 OR tenant_key = $1 OR name = $1
      LIMIT 1
    `,
    [clientIdOrKey],
  );
  const row = rows[0];
  return {
    clientId: row?.id ?? clientIdOrKey,
    policy: isTenantAiPolicy(row?.ai_policy) ? row.ai_policy : CONSERVATIVE_TENANT_AI_POLICY,
  };
}

export function createSentinelAiAuditSink(): AiEgressAuditSink {
  const primary = createSupabaseAiEgressAuditSink();
  return {
    async write(record) {
      try {
        return await primary.write(record);
      } catch {
        return memoryAuditSink.write(record);
      }
    },
  };
}

export async function readVersionPins(): Promise<{
  corpusVersionPinned: number;
  templateVersionPinned: number;
}> {
  const rows = await safeRows<{
    corpus_version: string | number | null;
    template_version: string | number | null;
  }>(
    `
      SELECT
        (SELECT COALESCE(MAX(version), 1) FROM public.corpus_patterns WHERE category = 'it-productivity' AND status = 'published') AS corpus_version,
        (SELECT COALESCE(MAX(version), 1) FROM public.move_templates WHERE status = 'published') AS template_version
    `,
    [],
  );
  const row = rows[0];
  return {
    corpusVersionPinned: Number(row?.corpus_version ?? 1),
    templateVersionPinned: Number(row?.template_version ?? 1),
  };
}

export async function persistReasoningStage(stage: SentinelReasoningStage): Promise<void> {
  await safeRows(
    `
      INSERT INTO public.reasoning_trace (
        trace_id, client_id, stage_id, stage_name, sequence_index, content,
        citations_jsonb, confidence, data_class, corpus_version_pinned,
        template_version_pinned, dissent, action_jsonb, created_at
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7::jsonb,$8,$9,$10,$11,$12,$13::jsonb,now())
    `,
    [
      stage.traceId,
      stage.clientId,
      stage.id,
      stage.name,
      stage.sequence,
      stage.content,
      JSON.stringify(stage.citations),
      stage.confidence,
      stage.dataClass,
      stage.corpusVersionPinned,
      stage.templateVersionPinned,
      stage.dissent ?? null,
      JSON.stringify(stage.oneClickAction ?? null),
    ],
  );
}
