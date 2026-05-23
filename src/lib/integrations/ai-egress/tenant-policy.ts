import { getServerSupabase } from '@/lib/supabase-server';
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
  const supabase = getServerSupabase();
  const base = supabase.from('clients').select('id, ai_policy').limit(1);
  const { data, error } = UUID_RE.test(tenantIdOrKey)
    ? await base.eq('id', tenantIdOrKey).maybeSingle()
    : await base.or(`tenant_key.eq.${tenantIdOrKey},name.eq.${tenantIdOrKey}`).maybeSingle();

  if (error) {
    throw new Error(`AI policy lookup failed: ${error.message}`);
  }

  const row = data as { id?: string; ai_policy?: unknown } | null;
  const policy = row?.ai_policy;
  return {
    tenantId: row?.id ?? tenantIdOrKey,
    policy: isTenantAiPolicy(policy) ? policy : CONSERVATIVE_TENANT_AI_POLICY,
  };
}

export async function loadTenantAiPolicy(tenantIdOrKey: string): Promise<TenantAiPolicy> {
  return (await loadTenantAiPolicyRecord(tenantIdOrKey)).policy;
}

export function formatAiEgressRefusal(reason: string): string {
  return reason;
}
