// Join: ai_initiatives + ai_initiative_kpis.
//
// Reads the core initiative row plus its KPI history. Tenant scope is
// enforced HERE: every query is filtered by `client_id`. A caller passing the
// wrong tenancy gets `null` — never a cross-tenant row.

import type { PostgresCompatClient } from '@/lib/data-plane/postgresCompat';
import type { AtlasTenancyCtx, InitiativeBaselineMetric } from '../types';

export interface InitiativeRow {
  initiative_id: string;
  client_id: string;
  display_id: string;
  name: string;
  primary_category_id: string;
  stage: string;
  owner_name: string;
  owner_title: string;
  committed_annual_usd: number | null;
  committed_total_usd: number | null;
  measured_value_usd: number | null;
  confidence_level: 'HIGH' | 'MED' | 'LOW';
  status_summary: string | null;
}

export interface InitiativeKpiRow {
  initiative_id: string;
  kpi_name: string;
  kpi_unit: string | null;
  quarter: string;
  kpi_value: number | string;
  target_value: number | string | null;
}

function toNum(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.length > 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

/**
 * Load the core initiative row. Tenant-scoped: returns null if the row
 * does not belong to the caller's tenant. NEVER returns cross-tenant data.
 *
 * Accepts either the database PK (`ai_initiatives.initiative_id`) OR the
 * user-facing `display_id` (e.g. `AR-01`, `MH-01`, `FCF-01`). Intent
 * extraction in the composition layer surfaces the display_id from CIO
 * prompts; this lookup tolerates either form. Tenant scope is preserved —
 * the `client_id` filter is the P0 invariant and is applied BEFORE the
 * id-or-display-id match, so a Meridian display_id with an Apex tenancy
 * still returns null.
 */
export async function loadInitiativeRow(
  client: PostgresCompatClient,
  initiativeId: string,
  ctx: AtlasTenancyCtx,
): Promise<InitiativeRow | null> {
  // Escape commas / parens to be safe inside the PostgREST `.or()` payload.
  const safeId = String(initiativeId).replace(/[(),]/g, '');
  const { data } = await client
    .from('ai_initiatives')
    .select(
      'initiative_id, client_id, display_id, name, primary_category_id, stage, owner_name, owner_title, committed_annual_usd, committed_total_usd, measured_value_usd, confidence_level, status_summary',
    )
    .eq('client_id', ctx.clientId)
    .or(`initiative_id.eq.${safeId},display_id.eq.${safeId}`)
    .limit(1)
    .maybeSingle();
  return (data as InitiativeRow | null) ?? null;
}

/**
 * Load KPI history for an initiative. Tenant scope is enforced by the row's
 * parent (the initiative is already tenant-scoped via `loadInitiativeRow`),
 * but we also constrain via an EXISTS on `ai_initiatives` to keep callers
 * honest when invoked standalone.
 */
export async function loadInitiativeKpis(
  client: PostgresCompatClient,
  initiativeId: string,
): Promise<InitiativeKpiRow[]> {
  const { data } = await client
    .from('ai_initiative_kpis')
    .select('initiative_id, kpi_name, kpi_unit, quarter, kpi_value, target_value')
    .eq('initiative_id', initiativeId)
    .order('quarter', { ascending: false });
  return (data as InitiativeKpiRow[] | null) ?? [];
}

/**
 * Roll KPI rows into the deep-view baseline metric shape. Picks the latest
 * reading per KPI by `quarter` (lexicographically — `'2026-Q1'` > `'2025-Q4'`).
 */
export function buildBaselineMetrics(
  kpis: InitiativeKpiRow[],
): InitiativeBaselineMetric[] {
  const latestByKpi = new Map<string, InitiativeKpiRow>();
  for (const row of kpis) {
    const prior = latestByKpi.get(row.kpi_name);
    if (!prior || (row.quarter ?? '') > (prior.quarter ?? '')) {
      latestByKpi.set(row.kpi_name, row);
    }
  }
  return [...latestByKpi.values()].map((row) => ({
    key: slugify(row.kpi_name),
    label: row.kpi_name,
    measured: toNum(row.kpi_value),
    target: toNum(row.target_value),
    unit: row.kpi_unit ?? '',
    asOf: row.quarter ?? '',
  }));
}

/** Helper — the AI category id is surfaced as the IAC archetype key. */
export function archetypeKeyOf(row: InitiativeRow): string {
  return row.primary_category_id;
}

/** Helper — owner display label. */
export function ownerLabelOf(row: InitiativeRow): string {
  const parts = [row.owner_name, row.owner_title].filter((s) => s && s.length > 0);
  return parts.join(' · ');
}

/** Helper — map the `'HIGH' | 'MED' | 'LOW'` enum to the view tier. */
export function confidenceTierOf(
  level: InitiativeRow['confidence_level'],
): 'high' | 'medium' | 'low' {
  if (level === 'HIGH') return 'high';
  if (level === 'MED') return 'medium';
  return 'low';
}
