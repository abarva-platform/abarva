import { createHash } from 'node:crypto';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { ContradictionSensitivity } from '@/lib/contradictions/types';
import { createSeedClient, loadSeedEnv, TENANTS, type TenantKey } from './seed-wave-lib';

export interface ClientRef {
  id: string;
  name: string;
  legal_name: string | null;
}

export interface PersonRef {
  id: string;
  name: string;
  role: string | null;
  organization: string | null;
}

export function contradictionScopeId(
  tenant: TenantKey,
  key: 'reasoning_broad' | 'program_leadership' | 'executive_sponsor' | 'reasoning_only',
): string {
  return `${tenant}_scope_contradictions_${key}`;
}

export function scopeIdsForSensitivity(tenant: TenantKey, sensitivity: ContradictionSensitivity) {
  const reasoningScopeId = contradictionScopeId(tenant, 'reasoning_broad');
  if (sensitivity === 'severe') {
    return {
      reasoningScopeId,
      disclosureScopeId: contradictionScopeId(tenant, 'executive_sponsor'),
    };
  }
  if (sensitivity === 'high') {
    return {
      reasoningScopeId,
      disclosureScopeId: contradictionScopeId(tenant, 'program_leadership'),
    };
  }
  if (sensitivity === 'medium') {
    return {
      reasoningScopeId,
      disclosureScopeId: contradictionScopeId(tenant, 'program_leadership'),
    };
  }
  return {
    reasoningScopeId,
    disclosureScopeId: contradictionScopeId(tenant, 'reasoning_broad'),
  };
}

export function deterministicUuid(input: string): string {
  const hex = createHash('sha1').update(input).digest('hex').slice(0, 32);
  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    `4${hex.slice(13, 16)}`,
    `a${hex.slice(17, 20)}`,
    hex.slice(20, 32),
  ].join('-');
}

export async function resolveClientMap(sb: SupabaseClient): Promise<Map<TenantKey, ClientRef>> {
  const map = new Map<TenantKey, ClientRef>();
  for (const tenant of Object.values(TENANTS)) {
    for (const field of [
      { column: 'name', value: tenant.shortName },
      { column: 'name', value: tenant.canonicalName },
      { column: 'legal_name', value: tenant.legalName },
    ]) {
      const { data, error } = await sb
        .from('clients')
        .select('id, name, legal_name')
        .eq(field.column, field.value)
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      if (data) {
        map.set(tenant.key, data as ClientRef);
        break;
      }
    }
    if (!map.has(tenant.key)) {
      throw new Error(`Missing client row for ${tenant.canonicalName}`);
    }
  }
  return map;
}

export async function loadPeopleMap(sb: SupabaseClient): Promise<Map<string, PersonRef>> {
  const orgNames = Object.values(TENANTS).map((tenant) => tenant.canonicalName);
  const { data, error } = await sb
    .from('persons')
    .select('id, name, role, organization')
    .in('organization', orgNames);
  if (error) throw error;
  return new Map(((data ?? []) as PersonRef[]).map((row) => [row.name, row]));
}

export async function upsertRows(
  sb: SupabaseClient,
  table: string,
  rows: Array<Record<string, unknown>>,
  onConflict = 'id',
): Promise<void> {
  if (rows.length === 0) return;
  const batchSize = 50;
  for (let index = 0; index < rows.length; index += batchSize) {
    const batch = rows.slice(index, index + batchSize);
    const { error } = await sb.from(table).upsert(batch, { onConflict });
    if (error) throw error;
  }
}

export async function createContradictionSeedClient() {
  loadSeedEnv();
  return createSeedClient();
}
