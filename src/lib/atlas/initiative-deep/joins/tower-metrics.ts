// Join: Tower-ingested metric streams.
//
// The Tower fleet writes per-tool / per-team metrics into the `tower_*` tables
// (`tower_ai_tool_usage`, `tower_dora_metrics`, `tower_jira_issues`,
// `tower_program_financials`, …). These are signals about how teams are using
// AI — they fold into the deep view's `baselineMetrics` so the composer can
// reason about tool adoption, throughput, and spend ALONGSIDE the
// kernel/initiative-recorded KPIs.
//
// HONESTY: a `tower_*` table that does not exist in this environment OR
// contains no rows for this tenant + initiative period returns an empty
// array. No fabricated rollups, no zeros that pretend to be measurements.
//
// LOOSE COUPLING: Tower rows are not keyed to `ai_initiatives` by FK — they
// are per-team / per-tool. The mapping into "which Tower metric is part of
// THIS initiative's baseline" is a downstream concern (composition layer).
// This join surfaces tenant-scoped recent Tower observations and lets the
// composer decide; it does NOT pretend to map them by name.

import type { PostgresCompatClient } from '@/lib/data-plane/postgresCompat';
import type { AtlasTenancyCtx, InitiativeBaselineMetric } from '../types';

export interface TowerMetricSample {
  /** Slug like 'tower_ai_tool_usage.copilot_active_users_30d'. */
  key: string;
  /** Human label for surfacing. */
  label: string;
  measured: number | null;
  target: number | null;
  unit: string;
  /** YYYY-MM derived from the observation timestamp. */
  asOf: string;
}

function isoToYearMonth(iso: string | null | undefined): string {
  if (!iso || iso.length < 7) return '';
  return iso.slice(0, 7);
}

function toNum(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.length > 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

/**
 * Load a small slice of `tower_ai_tool_usage` rows for the tenant — used to
 * surface adoption / active-user counts as baseline metrics. Each row in this
 * table tracks one tool's usage in one period.
 *
 * Returns `[]` on any error or missing table — Tower ingest is OPTIONAL.
 */
export async function loadTowerToolUsage(
  client: PostgresCompatClient,
  ctx: AtlasTenancyCtx,
): Promise<TowerMetricSample[]> {
  try {
    const { data, error } = await client
      .from('tower_ai_tool_usage')
      .select('tool_name, active_users, license_count, observed_at')
      .eq('client_id', ctx.clientId)
      .order('observed_at', { ascending: false })
      .limit(6);
    if (error || !data) return [];
    return (data as Array<Record<string, unknown>>).map((row) => {
      const tool = String(row.tool_name ?? 'unknown_tool');
      return {
        key: `tower_ai_tool_usage.${tool.toLowerCase()}_active_users`,
        label: `${tool} active users`,
        measured: toNum(row.active_users),
        target: toNum(row.license_count),
        unit: 'users',
        asOf: isoToYearMonth(row.observed_at as string | null),
      };
    });
  } catch {
    return [];
  }
}

/**
 * Load the most recent DORA-style throughput sample for the tenant. Surfaces
 * one row per metric (deploy frequency, lead time, change failure rate, MTTR).
 *
 * Returns `[]` on any error or missing table.
 */
export async function loadTowerDoraMetrics(
  client: PostgresCompatClient,
  ctx: AtlasTenancyCtx,
): Promise<TowerMetricSample[]> {
  try {
    const { data, error } = await client
      .from('tower_dora_metrics')
      .select(
        'deploy_frequency_per_week, lead_time_hours, change_failure_rate_pct, mttr_hours, observed_at',
      )
      .eq('client_id', ctx.clientId)
      .order('observed_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error || !data) return [];
    const row = data as Record<string, unknown>;
    const asOf = isoToYearMonth(row.observed_at as string | null);
    const samples: TowerMetricSample[] = [
      {
        key: 'tower_dora_metrics.deploy_frequency_per_week',
        label: 'Deploy frequency (per week)',
        measured: toNum(row.deploy_frequency_per_week),
        target: null,
        unit: 'per_week',
        asOf,
      },
      {
        key: 'tower_dora_metrics.lead_time_hours',
        label: 'Lead time for changes',
        measured: toNum(row.lead_time_hours),
        target: null,
        unit: 'hours',
        asOf,
      },
      {
        key: 'tower_dora_metrics.change_failure_rate_pct',
        label: 'Change failure rate',
        measured: toNum(row.change_failure_rate_pct),
        target: null,
        unit: 'percent',
        asOf,
      },
      {
        key: 'tower_dora_metrics.mttr_hours',
        label: 'Mean time to restore',
        measured: toNum(row.mttr_hours),
        target: null,
        unit: 'hours',
        asOf,
      },
    ];
    return samples.filter((sample) => sample.measured !== null);
  } catch {
    return [];
  }
}

/**
 * Fold Tower samples into the baseline-metric shape. Pure helper; the
 * composer can merge these with the initiative-KPI rows.
 */
export function towerSamplesAsBaselineMetrics(
  samples: ReadonlyArray<TowerMetricSample>,
): InitiativeBaselineMetric[] {
  return samples.map((sample) => ({
    key: sample.key,
    label: sample.label,
    measured: sample.measured,
    target: sample.target,
    unit: sample.unit,
    asOf: sample.asOf,
  }));
}
