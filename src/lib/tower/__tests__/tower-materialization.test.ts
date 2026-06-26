import {
  buildTowerMaterializationPlan,
  canonicalizeTowerTenantKey,
  persistTowerMaterializationPlan,
} from '@/lib/tower/tower-materialization';
import type { AIInitiative, AIInitiativeVendorRow } from '@/lib/admin/ai-initiatives/queries';
import type { PostgresCompatClient } from '@/lib/data-plane/postgresCompat';

const initiative: AIInitiative = {
  initiativeId: 'enterprise_context:lak-001',
  displayId: 'LAK-INIT-001',
  name: 'M365 Copilot finance rollout',
  description: 'Finance pilot with value proof lag.',
  primaryCategoryId: 'finance_ai',
  primaryCategoryName: 'Finance AI',
  secondaryCategoryId: null,
  secondaryCategoryName: null,
  primaryGoalId: 'tower_value',
  primaryGoalName: 'Tower value proof',
  stage: 'pilot',
  stageDetail: 'pilot',
  ownerName: 'Finance transformation owner',
  ownerTitle: 'Finance transformation owner',
  ownerFunction: 'Finance',
  committedAnnualUsd: 90_000,
  committedTotalUsd: 3_000_000,
  measuredValueUsd: null,
  statusFlag: 'value_lag',
  statusSummary: 'Adoption and value proof lag the business case.',
  confidenceLevel: 'HIGH',
  alignedCallout: false,
  alignedRationale: null,
  loadedViaTemplate: 'enterprise_context_initiatives_portfolio',
};

function vendor(name: string, id: string, value: number): AIInitiativeVendorRow {
  return {
    vendorId: id,
    initiativeId: initiative.initiativeId,
    initiativeDisplayId: initiative.displayId,
    initiativeName: initiative.name,
    vendorName: name,
    contractValueUsd: value,
    renewalDate: '2026-09-30',
    financialHealth: 'watch',
  };
}

function makeDb() {
  const calls: Array<{ table: string; rows: unknown[]; onConflict: string }> = [];
  const db = {
    from(table: string) {
      return {
        upsert(rows: unknown[], options: { onConflict?: string }) {
          calls.push({ table, rows, onConflict: options.onConflict ?? '' });
          return {
            select() {
              return Promise.resolve({ data: rows, error: null, count: rows.length });
            },
          };
        },
      } as unknown as ReturnType<PostgresCompatClient['from']>;
    },
    schema() {
      return db;
    },
    storage: {
      from() {
        throw new Error('storage_not_used');
      },
    },
  } as unknown as PostgresCompatClient;
  return { db, calls };
}

describe('tower materialization planner', () => {
  it('canonicalizes Lakeshore and SkyHarbor aliases', () => {
    expect(canonicalizeTowerTenantKey('Lakeshore Holdings')).toBe('lakeshore-holdings');
    expect(canonicalizeTowerTenantKey('lakeshore-industries')).toBe('lakeshore-holdings');
    expect(canonicalizeTowerTenantKey('skyharbor')).toBe('skyharbor-air');
  });

  it('dedupes vendor expansion rows and records Path A portfolio gaps', () => {
    const plan = buildTowerMaterializationPlan({
      clientId: 'client-lak',
      tenantKey: 'lakeshore-industries',
      projected: {
        source: 'enterprise_context_records',
        initiatives: [initiative],
        vendors: [
          vendor('JPMorgan expansion 21', 'vendor-1', 41_000_000),
          vendor('JPMorgan expansion 49', 'vendor-2', 41_000_000),
          vendor('Cisco', 'vendor-3', 25_000_000),
        ],
      },
    });

    expect(plan.tenantKey).toBe('lakeshore-holdings');
    expect(plan.summary.vendorInputCount).toBe(3);
    expect(plan.summary.vendorOutputCount).toBe(2);
    expect(plan.summary.duplicateVendorGroups).toBe(1);
    expect(plan.vendors.find((row) => row.logical_vendor_key === 'jpmorgan')).toMatchObject({
      vendor_name: 'JPMorgan',
      is_duplicate_rollup: true,
      duplicate_raw_row_count: 2,
      amount_type: 'contract_value',
    });
    expect(plan.gaps).toContainEqual(
      expect.objectContaining({
        gap_key: 'tower.lakeshore.operating_company_dimension_missing',
        tenant_key: 'lakeshore-holdings',
      }),
    );
    expect(plan.forbiddenIdentifiers.map((row) => row.identifier)).toEqual([
      'Morgan Street',
      'Chicago',
    ]);
  });

  it('keeps unknown amounts out of executive metric readiness', () => {
    const plan = buildTowerMaterializationPlan({
      clientId: 'client-sky',
      tenantKey: 'skyharbor-air',
      projected: {
        source: 'ai_control_tower',
        initiatives: [{ ...initiative, committedAnnualUsd: null, committedTotalUsd: null }],
        vendors: [vendor('Airline Vendor', 'vendor-1', 0)],
      },
    });

    expect(plan.initiatives[0]?.amount_type).toBe('unknown');
    expect(plan.initiatives[0]?.gaps).toContainEqual(
      expect.objectContaining({ gap: 'amount_type' }),
    );
    expect(plan.spendRealismAudit).toContainEqual(
      expect.objectContaining({
        object_type: 'initiative',
        amount_type: 'unknown',
        verdict: 'gap_amount_type',
      }),
    );
  });

  it('persists only tower_* tables', async () => {
    const { db, calls } = makeDb();
    const plan = buildTowerMaterializationPlan({
      clientId: 'client-lak',
      tenantKey: 'lakeshore-holdings',
      projected: {
        source: 'enterprise_context_records',
        initiatives: [initiative],
        vendors: [vendor('Cisco', 'vendor-1', 25_000_000)],
      },
    });

    await persistTowerMaterializationPlan({ db, plan });

    expect(calls.map((call) => call.table)).toEqual([
      'tower_read_model_initiatives',
      'tower_read_model_vendors',
      'tower_gap_register',
      'tower_spend_realism_audit',
      'tower_forbidden_identifiers',
    ]);
    expect(calls.find((call) => call.table === 'tower_forbidden_identifiers')?.onConflict).toBe(
      'tenant_key,identifier',
    );
    expect(calls.every((call) => call.table.startsWith('tower_'))).toBe(true);
  });

  it('serializes JSONB columns before writing through the Postgres compatibility client', async () => {
    const { db, calls } = makeDb();
    const plan = buildTowerMaterializationPlan({
      clientId: 'client-lak',
      tenantKey: 'lakeshore-holdings',
      projected: {
        source: 'enterprise_context_records',
        initiatives: [initiative],
        vendors: [vendor('Cisco', 'vendor-1', 25_000_000)],
      },
    });

    await persistTowerMaterializationPlan({ db, plan });

    const initiativeWrite = calls.find(
      (call) => call.table === 'tower_read_model_initiatives',
    )?.rows[0] as Record<string, unknown>;
    expect(typeof initiativeWrite.citations).toBe('string');
    expect(typeof initiativeWrite.lineage).toBe('string');
    expect(typeof initiativeWrite.gaps).toBe('string');
    expect(Array.isArray(initiativeWrite.evidence_ids)).toBe(true);

    const gapWrite = calls.find((call) => call.table === 'tower_gap_register')
      ?.rows[0] as Record<string, unknown>;
    expect(typeof gapWrite.lineage).toBe('string');

    const auditWrite = calls.find((call) => call.table === 'tower_spend_realism_audit')
      ?.rows[0] as Record<string, unknown>;
    expect(typeof auditWrite.lineage).toBe('string');
  });
});
