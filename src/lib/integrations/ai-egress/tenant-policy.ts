import {
  policyFromResolvedRow,
  resolveTenantClientPolicyRow,
} from './tenant-client-resolver';
import type { TenantAiPolicy } from './types';

export async function loadTenantAiPolicyRecord(tenantIdOrKey: string): Promise<{
  tenantId: string;
  policy: TenantAiPolicy;
}> {
  const resolvedRow = await resolveTenantClientPolicyRow(tenantIdOrKey).catch((error) => {
    throw new Error(`AI policy lookup failed: ${error instanceof Error ? error.message : String(error)}`);
  });
  return {
    tenantId: resolvedRow?.id ?? tenantIdOrKey,
    policy: policyFromResolvedRow(resolvedRow),
  };
}

export async function loadTenantAiPolicy(tenantIdOrKey: string): Promise<TenantAiPolicy> {
  return (await loadTenantAiPolicyRecord(tenantIdOrKey)).policy;
}

export function formatAiEgressRefusal(reason: string): string {
  return reason;
}
