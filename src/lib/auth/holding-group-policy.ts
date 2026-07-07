import { getAzureReadFluentClient } from '@/lib/data-plane/postgresCompat';
import 'server-only';

import type { TenancyCtx } from '@/lib/programs/types.db';

export type HoldingGroupRole = 'standalone' | 'l0_sponsor' | 'l1_holdco' | 'l2_portco';
export type AggregateVisibilityLevel = 'own_client' | 'group_aggregate' | 'transaction_grant_required';

export interface HoldingGroupClientProfile {
  clientId: string;
  tenantKey: string | null;
  holdingGroupId: string | null;
  parentClientId: string | null;
  holdingGroupRole: HoldingGroupRole;
  aggregateVisibilityLevel: AggregateVisibilityLevel;
}

export interface HoldingGroupAccessInput {
  requester: Pick<HoldingGroupClientProfile, 'clientId' | 'holdingGroupId' | 'holdingGroupRole'>;
  target: Pick<HoldingGroupClientProfile, 'clientId' | 'holdingGroupId' | 'aggregateVisibilityLevel'>;
  explicitTransactionGrant?: boolean;
}

function normalizeHoldingGroupRole(value: string | null | undefined): HoldingGroupRole {
  if (value === 'l0_sponsor' || value === 'l1_holdco' || value === 'l2_portco') return value;
  return 'standalone';
}

function normalizeAggregateVisibility(value: string | null | undefined): AggregateVisibilityLevel {
  if (value === 'group_aggregate' || value === 'transaction_grant_required') return value;
  return 'own_client';
}

export function canReadAggregate(input: HoldingGroupAccessInput): boolean {
  if (input.requester.clientId === input.target.clientId) return true;
  return Boolean(
    input.requester.holdingGroupRole === 'l0_sponsor' &&
      input.requester.holdingGroupId &&
      input.requester.holdingGroupId === input.target.holdingGroupId &&
      input.target.aggregateVisibilityLevel === 'group_aggregate',
  );
}

export function canReadTransactionGrain(input: HoldingGroupAccessInput): boolean {
  if (input.requester.clientId === input.target.clientId) return true;
  return Boolean(input.explicitTransactionGrant);
}

export function canApproveSpawn(input: HoldingGroupAccessInput): boolean {
  if (input.requester.clientId === input.target.clientId) return true;
  return canReadAggregate(input);
}

export async function loadHoldingGroupClientProfile(ctx: TenancyCtx): Promise<HoldingGroupClientProfile | null> {
  const { data, error } = await getAzureReadFluentClient()
    .from('clients')
    .select('id, tenant_key, holding_group_id, parent_client_id, holding_group_role, aggregate_visibility_level')
    .eq('id', ctx.clientId)
    .maybeSingle();

  if (error) {
    console.warn('[holding-group-policy] clients holding-group profile unavailable:', error.message);
    return null;
  }

  const row = data as {
    id?: string | null;
    tenant_key?: string | null;
    holding_group_id?: string | null;
    parent_client_id?: string | null;
    holding_group_role?: string | null;
    aggregate_visibility_level?: string | null;
  } | null;

  if (!row?.id) return null;
  return {
    clientId: row.id,
    tenantKey: row.tenant_key ?? null,
    holdingGroupId: row.holding_group_id ?? null,
    parentClientId: row.parent_client_id ?? null,
    holdingGroupRole: normalizeHoldingGroupRole(row.holding_group_role),
    aggregateVisibilityLevel: normalizeAggregateVisibility(row.aggregate_visibility_level),
  };
}
