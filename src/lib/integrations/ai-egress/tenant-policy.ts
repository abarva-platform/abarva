import { azureRead } from '@/lib/data-plane/azureRead';
import { CONSERVATIVE_TENANT_AI_POLICY } from './policy';
import type { TenantAiPolicy } from './types';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

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

export async function loadTenantAiPolicyRecord(tenantIdOrKey: string): Promise<{
  tenantId: string;
  policy: TenantAiPolicy;
}> {
  const resolvedRow = await (UUID_RE.test(tenantIdOrKey)
    ? azureRead.maybeSingle<{ id: string; ai_policy: unknown }>({
        table: 'clients',
        columns: ['id', 'ai_policy'],
        where: { id: tenantIdOrKey },
      })
    : azureRead.query<{ id: string; ai_policy: unknown }>(
        'SELECT id, ai_policy FROM clients WHERE tenant_key = $1 OR name = $1 LIMIT 1',
        [tenantIdOrKey],
      ).then((rows) => rows[0] ?? null)
  ).catch((error) => {
    throw new Error(`AI policy lookup failed: ${error instanceof Error ? error.message : String(error)}`);
  });
  const policy = resolvedRow?.ai_policy;
  return {
    tenantId: resolvedRow?.id ?? tenantIdOrKey,
    policy: isTenantAiPolicy(policy) ? policy : CONSERVATIVE_TENANT_AI_POLICY,
  };
}

export async function loadTenantAiPolicy(tenantIdOrKey: string): Promise<TenantAiPolicy> {
  return (await loadTenantAiPolicyRecord(tenantIdOrKey)).policy;
}

export function formatAiEgressRefusal(reason: string): string {
  return reason;
}
