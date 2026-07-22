// Transactional write path for the Tower mart projection, with the
// ai_control_refresh_runs job-contract row wrapping the whole run.
//
// Isolated from the CLI so the dry-run path never imports write internals.
// Every mutation is inside ONE transaction: a partial failure rolls back and
// the run row is marked failed, so the mart is never left half-written.

import type { Client } from "pg";
import crypto from "node:crypto";

import type { assembleMartFromFacts } from "../../lib/cio-tower/mart-projection/assemble-mart";
import type {
  CioTowerFactRow,
  CioTowerTenantIdentity,
} from "../../lib/cio-tower/mart-projection/facts-schema";

type AssembledMart = ReturnType<typeof assembleMartFromFacts>;

async function upsert(
  client: Client,
  table: string,
  rows: Array<Record<string, unknown>>,
  conflictCols: string[],
  jsonCols: string[] = [],
): Promise<number> {
  if (rows.length === 0) return 0;
  const cols = Object.keys(rows[0]);
  const updateCols = cols.filter((c) => !conflictCols.includes(c));
  let written = 0;
  for (let i = 0; i < rows.length; i += 100) {
    const batch = rows.slice(i, i + 100);
    const values: unknown[] = [];
    const tuples = batch.map((row) => {
      const placeholders = cols.map((col) => {
        let v = row[col] ?? null;
        if (jsonCols.includes(col) && v !== null && typeof v === "object") {
          v = JSON.stringify(v);
        }
        values.push(v);
        return `$${values.length}`;
      });
      return `(${placeholders.join(", ")})`;
    });
    const conflictClause = updateCols.length
      ? `DO UPDATE SET ${updateCols.map((c) => `${c} = EXCLUDED.${c}`).join(", ")}`
      : "DO NOTHING";
    await client.query(
      `INSERT INTO ${table} (${cols.join(", ")}) VALUES ${tuples.join(", ")} ON CONFLICT (${conflictCols.join(", ")}) ${conflictClause}`,
      values,
    );
    written += batch.length;
  }
  return written;
}

export async function runInTransactionWithTracking(
  client: Client,
  identity: CioTowerTenantIdentity,
  mart: AssembledMart,
  facts: CioTowerFactRow[],
  meta: { idempotencyKey: string; actor: string },
): Promise<void> {
  const tenantKey = identity.tenantKey;
  const runKey = `tower-mart::${tenantKey}::${meta.idempotencyKey}`;
  const gitSha = process.env.GIT_SHA ?? process.env.GITHUB_SHA ?? "local";

  if (!identity.clientId) {
    throw new Error(
      `tower_mart_write_requires_resolved_client_id: tenant=${tenantKey}`,
    );
  }

  // The run row lives OUTSIDE the mart transaction so a failed run is still
  // recorded (status=failed) rather than rolled away with the data.
  let runId: string | null = null;
  const runRes = await client.query<{ id: string }>(
    `INSERT INTO ai_control_refresh_runs
         (client_id, client_key, refresh_run_key, reporting_period_start, reporting_period_end,
          run_type, status, rows_seen, rows_valid, parser_version, source_fingerprint, metadata)
       VALUES ($1,$2,$3, date_trunc('year', now())::date, (date_trunc('year', now()) + interval '1 year - 1 day')::date,
          'template_upload', 'received', $4, $4, $5, $6, $7)
       ON CONFLICT (client_id, refresh_run_key) DO UPDATE SET status='received', rows_seen=$4, rows_valid=$4, updated_at=now()
       RETURNING id`,
    [
      identity.clientId,
      tenantKey,
      runKey,
      facts.length,
      "unified_facts_v1",
      meta.idempotencyKey,
      JSON.stringify({
        job: "project-tower-mart",
        tenant_scope: tenantKey,
        build_version: "tower_command_mart_v1",
        idempotency_key: meta.idempotencyKey,
        git_sha: gitSha,
        operator: meta.actor,
        mart_counts: {
          command_center: mart.command_center.length,
          program_decision_lanes: mart.program_decision_lanes.length,
          ai_portfolio: mart.ai_portfolio.length,
          required_field_gaps: mart.required_field_gaps.length,
        },
      }),
    ],
  );
  runId = runRes.rows[0]?.id ?? null;

  try {
    await client.query("BEGIN");
    // Stamp the source_run_id onto the command-center row for lineage.
    const commandRows = mart.command_center.map((r) => ({
      ...r,
      source_run_id: runId,
    }));

    // Replace this tenant's mart + facts (idempotent full refresh).
    for (const table of [
      "cio_tower.mart_required_field_gaps",
      "cio_tower.mart_evidence_lineage",
      "cio_tower.mart_cxo_actions",
      "cio_tower.mart_ai_portfolio",
      "cio_tower.mart_program_decision_lanes",
      "cio_tower.mart_value_funnel",
      "cio_tower.mart_command_center",
      "cio_tower.facts",
    ]) {
      await client.query(`DELETE FROM ${table} WHERE tenant_key = $1`, [
        tenantKey,
      ]);
    }

    await upsert(
      client,
      "cio_tower.facts",
      facts as unknown as Array<Record<string, unknown>>,
      ["fact_key"],
      ["attributes"],
    );
    await upsert(
      client,
      "cio_tower.mart_command_center",
      commandRows as unknown as Array<Record<string, unknown>>,
      ["command_center_key"],
    );
    await upsert(
      client,
      "cio_tower.mart_value_funnel",
      mart.value_funnel as unknown as Array<Record<string, unknown>>,
      ["funnel_key"],
    );
    await upsert(
      client,
      "cio_tower.mart_program_decision_lanes",
      mart.program_decision_lanes as unknown as Array<Record<string, unknown>>,
      ["lane_key"],
      ["required_gates"],
    );
    await upsert(
      client,
      "cio_tower.mart_ai_portfolio",
      mart.ai_portfolio as unknown as Array<Record<string, unknown>>,
      ["ai_portfolio_key"],
    );
    await upsert(
      client,
      "cio_tower.mart_cxo_actions",
      mart.cxo_actions as unknown as Array<Record<string, unknown>>,
      ["action_key"],
    );
    await upsert(
      client,
      "cio_tower.mart_evidence_lineage",
      mart.evidence_lineage as unknown as Array<Record<string, unknown>>,
      ["lineage_key"],
    );
    await upsert(
      client,
      "cio_tower.mart_required_field_gaps",
      mart.required_field_gaps as unknown as Array<Record<string, unknown>>,
      ["gap_key"],
    );

    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    if (runId) {
      await client.query(
        `UPDATE ai_control_refresh_runs SET status='failed', updated_at=now() WHERE id=$1`,
        [runId],
      );
    }
    throw error;
  }

  if (runId) {
    await client.query(
      `UPDATE ai_control_refresh_runs SET status='committed', committed_at=now(), updated_at=now() WHERE id=$1`,
      [runId],
    );
  }
}

// Small helper kept for parity with other ingest writers; not currently used
// but documents the natural-key hashing approach if a partial upsert is added.
export function runFingerprint(
  tenantKey: string,
  facts: CioTowerFactRow[],
): string {
  const h = crypto.createHash("sha256");
  h.update(tenantKey);
  for (const f of facts) h.update(f.fact_key);
  return h.digest("hex");
}
