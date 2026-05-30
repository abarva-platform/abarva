// Ingest-plan & idempotency tests.
//
// Uses an in-memory fake pg Client that captures SQL + params and lets
// tests pre-seed "existing" rows. This keeps the test honest about the
// upsert contract without requiring a live Postgres in CI.

import {
  applyIngestPlan,
  buildIngestPlan,
} from '../ingest';
import type { GithubDoraRow } from '../schema';

interface CapturedQuery {
  sql: string;
  params?: readonly unknown[];
}

class FakeClient {
  public readonly queries: CapturedQuery[] = [];
  public existing: Array<{
    client_id: string;
    repo: string;
    team: string;
    period_start: string;
    period_end: string;
    deployment_frequency_per_day: number;
    lead_time_for_changes_hours: number;
    change_failure_rate_pct: number;
    mttr_hours: number;
    sample_size_deploys: number;
  }> = [];
  public failOnInsert = false;

  async query<R = unknown>(
    sql: string,
    params?: readonly unknown[],
  ): Promise<{ rows: R[]; rowCount: number }> {
    this.queries.push({ sql, params });

    if (/SELECT[\s\S]+FROM public\.tower_dora_metrics/.test(sql)) {
      const [clientId, repos] = (params ?? []) as [string, string[]];
      const matching = this.existing.filter(
        (r) =>
          r.client_id === clientId && repos.some((repo) => repo === r.repo),
      );
      return {
        rows: matching as unknown as R[],
        rowCount: matching.length,
      };
    }

    if (/INSERT INTO public\.tower_dora_metrics/.test(sql)) {
      if (this.failOnInsert) {
        throw new Error('simulated insert failure');
      }
      const [clientId, repo, team, periodStart, periodEnd, df, lt, cfr, mttr, n] =
        (params ?? []) as [
          string,
          string,
          string,
          string,
          string,
          number,
          number,
          number,
          number,
          number,
        ];
      const existing = this.existing.find(
        (r) =>
          r.client_id === clientId &&
          r.repo === repo &&
          r.period_start === periodStart &&
          r.period_end === periodEnd,
      );
      if (existing) {
        existing.team = team;
        existing.deployment_frequency_per_day = df;
        existing.lead_time_for_changes_hours = lt;
        existing.change_failure_rate_pct = cfr;
        existing.mttr_hours = mttr;
        existing.sample_size_deploys = n;
        return {
          rows: [{ inserted: false }] as unknown as R[],
          rowCount: 1,
        };
      }
      this.existing.push({
        client_id: clientId,
        repo,
        team,
        period_start: periodStart,
        period_end: periodEnd,
        deployment_frequency_per_day: df,
        lead_time_for_changes_hours: lt,
        change_failure_rate_pct: cfr,
        mttr_hours: mttr,
        sample_size_deploys: n,
      });
      return {
        rows: [{ inserted: true }] as unknown as R[],
        rowCount: 1,
      };
    }

    // BEGIN / COMMIT / ROLLBACK.
    return { rows: [] as R[], rowCount: 0 };
  }
}

const SAMPLE_ROW: GithubDoraRow = {
  repo: 'northwind-retail/checkout-service',
  team: 'checkout-platform',
  period_start: '2025-01-01',
  period_end: '2025-01-31',
  deployment_frequency_per_day: 1.42,
  lead_time_for_changes_hours: 36,
  change_failure_rate_pct: 11,
  mttr_hours: 4.5,
  sample_size_deploys: 44,
};

describe('buildIngestPlan', () => {
  it('classifies every row as insert when the table is empty', async () => {
    const client = new FakeClient();
    const plan = await buildIngestPlan({
      // FakeClient duck-types pg.Client; cast through unknown for tests.
      client: client as unknown as import('pg').Client,
      clientId: 'tenant-uuid',
      rows: [SAMPLE_ROW],
    });
    expect(plan.inserts).toBe(1);
    expect(plan.updates).toBe(0);
    expect(plan.noops).toBe(0);
    expect(plan.rows[0]!.action).toBe('insert');
  });

  it('classifies a row identical to an existing one as a no-op', async () => {
    const client = new FakeClient();
    client.existing.push({
      client_id: 'tenant-uuid',
      ...SAMPLE_ROW,
    });
    const plan = await buildIngestPlan({
      client: client as unknown as import('pg').Client,
      clientId: 'tenant-uuid',
      rows: [SAMPLE_ROW],
    });
    expect(plan.inserts).toBe(0);
    expect(plan.updates).toBe(0);
    expect(plan.noops).toBe(1);
  });

  it('classifies a value drift as update', async () => {
    const client = new FakeClient();
    client.existing.push({
      client_id: 'tenant-uuid',
      ...SAMPLE_ROW,
      change_failure_rate_pct: 99, // drift
    });
    const plan = await buildIngestPlan({
      client: client as unknown as import('pg').Client,
      clientId: 'tenant-uuid',
      rows: [SAMPLE_ROW],
    });
    expect(plan.updates).toBe(1);
    expect(plan.inserts).toBe(0);
    expect(plan.noops).toBe(0);
  });
});

describe('applyIngestPlan', () => {
  it('wraps writes in a transaction and reports per-action counts', async () => {
    const client = new FakeClient();
    const plan = await buildIngestPlan({
      client: client as unknown as import('pg').Client,
      clientId: 'tenant-uuid',
      rows: [SAMPLE_ROW],
    });
    const summary = await applyIngestPlan({
      client: client as unknown as import('pg').Client,
      plan,
      actor: 'jest',
    });
    expect(summary.rowsInserted).toBe(1);
    expect(summary.rowsUpdated).toBe(0);
    expect(summary.rowsUnchanged).toBe(0);

    const txn = client.queries.map((q) => q.sql.trim());
    expect(txn[1]).toBe('BEGIN');
    expect(txn[txn.length - 1]).toBe('COMMIT');
  });

  it('is idempotent: re-running yields all no-ops', async () => {
    const client = new FakeClient();
    const firstPlan = await buildIngestPlan({
      client: client as unknown as import('pg').Client,
      clientId: 'tenant-uuid',
      rows: [SAMPLE_ROW],
    });
    await applyIngestPlan({
      client: client as unknown as import('pg').Client,
      plan: firstPlan,
      actor: 'jest',
    });

    const secondPlan = await buildIngestPlan({
      client: client as unknown as import('pg').Client,
      clientId: 'tenant-uuid',
      rows: [SAMPLE_ROW],
    });
    expect(secondPlan.inserts).toBe(0);
    expect(secondPlan.updates).toBe(0);
    expect(secondPlan.noops).toBe(1);

    const summary = await applyIngestPlan({
      client: client as unknown as import('pg').Client,
      plan: secondPlan,
      actor: 'jest',
    });
    expect(summary.rowsInserted).toBe(0);
    expect(summary.rowsUpdated).toBe(0);
    expect(summary.rowsUnchanged).toBe(1);
  });

  it('rolls back on failure', async () => {
    const client = new FakeClient();
    client.failOnInsert = true;
    const plan = await buildIngestPlan({
      client: client as unknown as import('pg').Client,
      clientId: 'tenant-uuid',
      rows: [SAMPLE_ROW],
    });
    await expect(
      applyIngestPlan({
        client: client as unknown as import('pg').Client,
        plan,
        actor: 'jest',
      }),
    ).rejects.toThrow('simulated insert failure');
    expect(client.queries.some((q) => q.sql.trim() === 'ROLLBACK')).toBe(true);
    expect(client.existing).toEqual([]);
  });
});
