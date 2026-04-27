/**
 * DATA11 — Shared DB helpers for admin adapters.
 * Server-only: calls getServerSupabase().
 */

import { getServerSupabase } from '@/lib/supabase-server';
import type { AdminDatasetRung } from './admin-datasets-adapter-types';
import type { AdminConnectorKind } from './admin-connectors-adapter-types';
import type { AdminSetupStepId } from './admin-setup-progress-adapter-types';

/**
 * Map tenant slug → client UUID via the slug column added in DATA11 migration.
 * Falls back to name-based lookup for resilience.
 */
export async function resolveClientId(tenantSlug: string): Promise<string | null> {
  const supabase = getServerSupabase();
  // First try slug column
  const { data: bySlug } = await supabase
    .from('clients')
    .select('id')
    .eq('slug', tenantSlug)
    .maybeSingle();
  if (bySlug?.id) return bySlug.id;

  // Fallback: derive name from slug
  const name = tenantSlug
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
  const { data: byName } = await supabase
    .from('clients')
    .select('id')
    .ilike('name', `${name}%`)
    .maybeSingle();
  return byName?.id ?? null;
}

/** Throws if client not found. */
export async function requireClientId(tenantSlug: string): Promise<string> {
  const id = await resolveClientId(tenantSlug);
  if (!id) throw new Error(`No client found for slug '${tenantSlug}'`);
  return id;
}

/** Map DB rung values → TypeScript AdminDatasetRung. */
const DB_RUNG_MAP: Record<string, AdminDatasetRung> = {
  raw: 'loaded',
  verified: 'available',
  blessed: 'usable',
  ground_truth: 'agent_usable',
  audit_trail: 'decision_grade',
};

export function mapDbRung(dbRung: string): AdminDatasetRung {
  return (DB_RUNG_MAP[dbRung] as AdminDatasetRung) ?? ('loaded' as AdminDatasetRung);
}

/** Map DB connector kind → AdminConnectorKind (pass through; DB may use any string). */
export function mapDbConnectorKind(dbKind: string): AdminConnectorKind {
  return dbKind as AdminConnectorKind;
}

/** Map setup_progress step_id → human label. */
export const SETUP_STEP_LABELS: Record<AdminSetupStepId, string> = {
  data_trust: 'Data Trust',
  connectors: 'Connectors',
  users_access: 'Users & Access',
  agent_readiness: 'Agent Readiness',
  production_readiness: 'Production Readiness',
  architecture: 'Architecture',
};
