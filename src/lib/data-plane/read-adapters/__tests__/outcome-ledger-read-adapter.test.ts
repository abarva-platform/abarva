// Outcome ledger read adapter · Wave 3, Slice 3.1 · unit tests.
//
//   - default plane stays Supabase; Azure is selectable by env;
//   - row mapping coerces snake_case columns + unknown enums safely;
//   - both adapters degrade to [] (never throw) on a read failure.

import type { PostgresCompatClient as SupabaseClient } from '@/lib/supabase-server';
import type { SessionRunner } from '../azureSession';
import {
  createAzureOutcomeLedgerReadAdapter,
  createSupabaseOutcomeLedgerReadAdapter,
  mapOutcomeLedgerRow,
  selectOutcomeLedgerReadAdapter,
} from '../outcomeLedgerReadAdapter';

function fakeSession(
  handler: (sql: string, params: unknown[]) => unknown[],
): SessionRunner {
  return async (fn) =>
    fn(async <R>(sql: string, params: unknown[]) => handler(sql, params) as R[]);
}

const RAW_ROW: Record<string, unknown> = {
  id: 'ol-1',
  supersedes_entry_id: null,
  is_current: true,
  tenant_client_key: 'apexretail',
  client_id: 'client-1',
  subject_kind: 'move',
  subject_ref: 'move-101',
  subject_label: 'Contact Center AI',
  value_rung: 'measured_in_production',
  value_category: 'cost_avoidance',
  measurement_unit: 'usd_seed',
  projected_amount: 1_000_000,
  realized_amount: 900_000,
  baseline_amount: 0,
  counterfactual_confidence: 'medium',
  governance_review_status: 'approved',
  measurement_owner_role: 'VP CX',
  evidence_pointer: 'evidence/x',
  evidence_claim_ids: ['claim-seed-1'],
  note: 'seed',
  recorded_by: 'svc',
  recorded_at: '2026-05-16T10:00:00.000Z',
};

describe('mapOutcomeLedgerRow', () => {
  it('maps snake_case columns onto the view-model row shape', () => {
    const row = mapOutcomeLedgerRow(RAW_ROW);
    expect(row.id).toBe('ol-1');
    expect(row.subjectKind).toBe('move');
    expect(row.valueRung).toBe('measured_in_production');
    expect(row.projectedAmount).toBe(1_000_000);
    expect(row.realizedAmount).toBe(900_000);
    expect(row.evidenceClaimIds).toEqual(['claim-seed-1']);
  });

  it('falls back safely on unknown enum values and missing fields', () => {
    const row = mapOutcomeLedgerRow({
      id: 'ol-2',
      subject_kind: 'bogus',
      value_rung: 'bogus',
      value_category: 'bogus',
      measurement_unit: 'bogus',
      counterfactual_confidence: 'bogus',
      governance_review_status: 'bogus',
      projected_amount: null,
      evidence_claim_ids: 'not-an-array',
    });
    expect(row.subjectKind).toBe('move');
    expect(row.valueRung).toBe('projected_only');
    expect(row.valueCategory).toBe('productivity');
    expect(row.measurementUnit).toBe('usd_seed');
    expect(row.counterfactualConfidence).toBe('low');
    expect(row.governanceReviewStatus).toBe('not_started');
    expect(row.projectedAmount).toBe(0);
    expect(row.evidenceClaimIds).toEqual([]);
  });
});

describe('selectOutcomeLedgerReadAdapter', () => {
  const original = process.env.ABARVA_DATA_PLANE;
  afterEach(() => {
    if (original === undefined) delete process.env.ABARVA_DATA_PLANE;
    else process.env.ABARVA_DATA_PLANE = original;
  });

  it('returns the Supabase adapter by default', () => {
    delete process.env.ABARVA_DATA_PLANE;
    expect(selectOutcomeLedgerReadAdapter().name).toBe('supabase');
  });

  it('returns the Azure adapter when ABARVA_DATA_PLANE=azure-postgres', () => {
    process.env.ABARVA_DATA_PLANE = 'azure-postgres';
    expect(selectOutcomeLedgerReadAdapter().name).toBe('azure-postgres');
  });

  it('routes foundation tenants to Azure when no plane is configured', () => {
    delete process.env.ABARVA_DATA_PLANE;
    expect(selectOutcomeLedgerReadAdapter(undefined, 'meridian-health').name).toBe(
      'azure-postgres',
    );
  });

  it('fails closed when a foundation tenant is explicitly routed away from Azure', () => {
    expect(() =>
      selectOutcomeLedgerReadAdapter('supabase', 'meridian-health'),
    ).toThrow(/cannot use supabase/);
  });
});

describe('azureOutcomeLedgerReadAdapter', () => {
  it('reads current entries scoped by tenant key', async () => {
    const session = fakeSession((sql, params) => {
      expect(sql).toContain('FROM outcome_ledger');
      expect(sql).toContain('is_current = true');
      expect(params).toEqual(['apexretail']);
      return [RAW_ROW];
    });
    const adapter = createAzureOutcomeLedgerReadAdapter(session);
    const rows = await adapter.getCurrentEntries('apexretail');
    expect(rows).toHaveLength(1);
    expect(rows[0].subjectRef).toBe('move-101');
  });

  it('degrades to [] when the read throws (missing table / connection)', async () => {
    const session = fakeSession(() => {
      throw new Error('relation outcome_ledger does not exist');
    });
    const adapter = createAzureOutcomeLedgerReadAdapter(session);
    expect(await adapter.getCurrentEntries('apexretail')).toEqual([]);
  });
});

describe('supabaseOutcomeLedgerReadAdapter', () => {
  function mockClient(result: {
    data: unknown[] | null;
    error: unknown;
  }): SupabaseClient {
    return {
      from() {
        const builder: Record<string, unknown> = {};
        for (const m of ['select', 'eq']) builder[m] = () => builder;
        builder.order = () => Promise.resolve(result);
        return builder;
      },
    } as unknown as SupabaseClient;
  }

  it('maps rows when the query succeeds', async () => {
    const adapter = createSupabaseOutcomeLedgerReadAdapter(() =>
      mockClient({ data: [RAW_ROW], error: null }),
    );
    const rows = await adapter.getCurrentEntries('apexretail');
    expect(rows).toHaveLength(1);
    expect(rows[0].valueRung).toBe('measured_in_production');
  });

  it('degrades to [] on a query error', async () => {
    const adapter = createSupabaseOutcomeLedgerReadAdapter(() =>
      mockClient({ data: null, error: { message: 'boom' } }),
    );
    expect(await adapter.getCurrentEntries('apexretail')).toEqual([]);
  });
});
