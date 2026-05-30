// Database upsert for validated GitHub → DORA rows.
//
// Idempotent: keyed by (client_id, repo, period_start, period_end), so
// re-running on the same workbook produces no row-count drift. Wraps
// the per-row writes in a single transaction so a partial failure
// rolls back cleanly.
//
// The pg `Client` is injected so the CLI, tests, and any future API
// route can share one implementation without re-implementing the
// connection management.

import type { Client } from 'pg';

import type { GithubDoraRow } from './schema';

export interface GithubDoraIngestPlanRow {
  readonly row: GithubDoraRow;
  readonly action: 'insert' | 'update' | 'noop';
  readonly existing?: GithubDoraRow;
}

export interface GithubDoraIngestPlan {
  readonly clientId: string;
  readonly inserts: number;
  readonly updates: number;
  readonly noops: number;
  readonly rows: readonly GithubDoraIngestPlanRow[];
}

export interface GithubDoraIngestSummary {
  readonly clientId: string;
  readonly rowsTotal: number;
  readonly rowsInserted: number;
  readonly rowsUpdated: number;
  readonly rowsUnchanged: number;
}

const COLUMNS = [
  'repo',
  'team',
  'period_start',
  'period_end',
  'deployment_frequency_per_day',
  'lead_time_for_changes_hours',
  'change_failure_rate_pct',
  'mttr_hours',
  'sample_size_deploys',
] as const;

interface ExistingRow {
  client_id: string;
  repo: string;
  team: string;
  period_start: string;
  period_end: string;
  deployment_frequency_per_day: string | number;
  lead_time_for_changes_hours: string | number;
  change_failure_rate_pct: string | number;
  mttr_hours: string | number;
  sample_size_deploys: string | number;
}

/**
 * Look up the existing tower_dora_metrics rows for the (client, repo,
 * period) tuples in `rows`. Returns a map keyed by
 * `${repo}|${period_start}|${period_end}`. The map is empty when the
 * table is empty or no rows match — which is the common first-run
 * shape.
 */
async function loadExistingRows(
  client: Client,
  clientId: string,
  rows: readonly GithubDoraRow[],
): Promise<Map<string, GithubDoraRow>> {
  if (rows.length === 0) return new Map();
  const repos = [...new Set(rows.map((r) => r.repo))];
  const result = await client.query<ExistingRow>(
    `SELECT client_id, repo, team, to_char(period_start, 'YYYY-MM-DD') AS period_start,
            to_char(period_end, 'YYYY-MM-DD') AS period_end,
            deployment_frequency_per_day, lead_time_for_changes_hours,
            change_failure_rate_pct, mttr_hours, sample_size_deploys
       FROM public.tower_dora_metrics
      WHERE client_id = $1
        AND repo = ANY($2::text[])
        AND deleted_at IS NULL`,
    [clientId, repos],
  );
  const map = new Map<string, GithubDoraRow>();
  for (const r of result.rows) {
    map.set(`${r.repo}|${r.period_start}|${r.period_end}`, {
      repo: r.repo,
      team: r.team,
      period_start: r.period_start,
      period_end: r.period_end,
      deployment_frequency_per_day: Number(r.deployment_frequency_per_day),
      lead_time_for_changes_hours: Number(r.lead_time_for_changes_hours),
      change_failure_rate_pct: Number(r.change_failure_rate_pct),
      mttr_hours: Number(r.mttr_hours),
      sample_size_deploys: Number(r.sample_size_deploys),
    });
  }
  return map;
}

function rowsEqual(a: GithubDoraRow, b: GithubDoraRow): boolean {
  return (
    a.repo === b.repo &&
    a.team === b.team &&
    a.period_start === b.period_start &&
    a.period_end === b.period_end &&
    a.deployment_frequency_per_day === b.deployment_frequency_per_day &&
    a.lead_time_for_changes_hours === b.lead_time_for_changes_hours &&
    a.change_failure_rate_pct === b.change_failure_rate_pct &&
    a.mttr_hours === b.mttr_hours &&
    a.sample_size_deploys === b.sample_size_deploys
  );
}

/**
 * Build a dry-run plan — what would change if we ingested these rows —
 * without writing anything. Used by `--dry-run` to print a diff and by
 * the idempotency test to assert that a second run is a no-op.
 */
export async function buildIngestPlan(args: {
  client: Client;
  clientId: string;
  rows: readonly GithubDoraRow[];
}): Promise<GithubDoraIngestPlan> {
  const existing = await loadExistingRows(args.client, args.clientId, args.rows);
  const planRows: GithubDoraIngestPlanRow[] = [];
  let inserts = 0;
  let updates = 0;
  let noops = 0;

  for (const row of args.rows) {
    const key = `${row.repo}|${row.period_start}|${row.period_end}`;
    const prior = existing.get(key);
    if (!prior) {
      planRows.push({ row, action: 'insert' });
      inserts += 1;
    } else if (rowsEqual(prior, row)) {
      planRows.push({ row, action: 'noop', existing: prior });
      noops += 1;
    } else {
      planRows.push({ row, action: 'update', existing: prior });
      updates += 1;
    }
  }

  return {
    clientId: args.clientId,
    inserts,
    updates,
    noops,
    rows: planRows,
  };
}

/**
 * Apply an ingest plan. All writes happen in a single transaction so a
 * partial failure leaves the table untouched. The actor string is
 * recorded in `created_by` / `updated_by` for audit.
 */
export async function applyIngestPlan(args: {
  client: Client;
  plan: GithubDoraIngestPlan;
  actor: string;
  sourceFileId?: string;
}): Promise<GithubDoraIngestSummary> {
  const { client, plan, actor, sourceFileId } = args;

  let inserted = 0;
  let updated = 0;
  const unchanged = plan.noops;

  await client.query('BEGIN');
  try {
    for (const item of plan.rows) {
      if (item.action === 'noop') continue;

      const values = [
        plan.clientId,
        item.row.repo,
        item.row.team,
        item.row.period_start,
        item.row.period_end,
        item.row.deployment_frequency_per_day,
        item.row.lead_time_for_changes_hours,
        item.row.change_failure_rate_pct,
        item.row.mttr_hours,
        item.row.sample_size_deploys,
        sourceFileId ?? null,
        actor,
      ];

      const columnList = ['client_id', ...COLUMNS, 'source_file_id', 'created_by'];
      const placeholders = columnList
        .map((_, idx) => `$${idx + 1}`)
        .join(', ');
      const updateAssignments = [
        'team = EXCLUDED.team',
        'deployment_frequency_per_day = EXCLUDED.deployment_frequency_per_day',
        'lead_time_for_changes_hours = EXCLUDED.lead_time_for_changes_hours',
        'change_failure_rate_pct = EXCLUDED.change_failure_rate_pct',
        'mttr_hours = EXCLUDED.mttr_hours',
        'sample_size_deploys = EXCLUDED.sample_size_deploys',
        'source_file_id = EXCLUDED.source_file_id',
        `updated_by = $${columnList.length + 1}`,
        'updated_at = now()',
        'deleted_at = NULL',
      ].join(', ');

      const sql = `
        INSERT INTO public.tower_dora_metrics (${columnList.join(', ')})
        VALUES (${placeholders})
        ON CONFLICT (client_id, repo, period_start, period_end)
        DO UPDATE SET ${updateAssignments}
        RETURNING (xmax = 0) AS inserted
      `;

      const result = await client.query<{ inserted: boolean }>(sql, [
        ...values,
        actor,
      ]);
      const wasInsert = result.rows[0]?.inserted ?? false;
      if (item.action === 'insert' && wasInsert) inserted += 1;
      else if (item.action === 'update' && !wasInsert) updated += 1;
      else if (wasInsert) inserted += 1;
      else updated += 1;
    }
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  }

  return {
    clientId: plan.clientId,
    rowsTotal: plan.rows.length,
    rowsInserted: inserted,
    rowsUpdated: updated,
    rowsUnchanged: unchanged,
  };
}

/**
 * Resolve a tenant key (e.g. `northwind-retail`) to a clients.id UUID.
 * Throws if the tenant is not seeded — the CLI surfaces this as a
 * user-friendly error rather than a Postgres FK failure mid-write.
 */
export async function resolveClientIdByTenantKey(
  client: Client,
  tenantKey: string,
): Promise<string> {
  const result = await client.query<{ id: string }>(
    `SELECT id FROM public.clients WHERE tenant_key = $1 LIMIT 1`,
    [tenantKey],
  );
  const id = result.rows[0]?.id;
  if (!id) {
    throw new Error(
      `tenant key "${tenantKey}" has no clients row. Seed the tenant first.`,
    );
  }
  return id;
}
