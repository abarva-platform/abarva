import {
  getControlTowerLensProjection,
  shapeControlTowerLensProjection,
  type ControlTowerLensProjectionRow,
} from '../control-tower-lens-projection';
import type { AzureReadClient } from '@/lib/data-plane/azureRead';

function row(overrides: Partial<ControlTowerLensProjectionRow>): ControlTowerLensProjectionRow {
  return {
    record_uid: 'rec-1',
    client_id: 'client-1',
    tenant_key: 'first-capital',
    canonical_record_id: 'init-001',
    lens_record_type: 'initiative',
    record_subtype: null,
    title: 'Untitled',
    business_function: 'FCF-BF-finance',
    dimension_family: 'governance_ai_evidence',
    domain_segment: 'DATA_ANALYTICS',
    owner: 'Owner Role',
    steward_owner: null,
    payload: {},
    facts: {},
    fact_count: 0,
    record_confidence: null,
    max_fact_confidence: null,
    freshness_status: 'fresh',
    evidence_pointer: 'T08:row-12',
    has_evidence_pointer: true,
    source_file: 'T08_ai-spend-by-initiative.csv',
    source_row_number: 12,
    ...overrides,
  };
}

describe('shapeControlTowerLensProjection', () => {
  it('routes each record type into the correct lens array', () => {
    const projection = shapeControlTowerLensProjection([
      row({ record_uid: 'a', lens_record_type: 'initiative', canonical_record_id: 'init-1' }),
      row({ record_uid: 'b', lens_record_type: 'spend_contract', canonical_record_id: 'spend-1' }),
      row({ record_uid: 'c', lens_record_type: 'risk_governance', canonical_record_id: 'risk-1' }),
      row({ record_uid: 'd', lens_record_type: 'agent', canonical_record_id: 'agent-1' }),
      row({ record_uid: 'e', lens_record_type: 'productivity', canonical_record_id: 'prod-1' }),
      row({ record_uid: 'f', lens_record_type: 'usage', canonical_record_id: 'usage-1' }),
      row({ record_uid: 'g', lens_record_type: 'action', canonical_record_id: 'action-1' }),
      row({ record_uid: 'h', lens_record_type: 'evidence', canonical_record_id: 'ev-1' }),
    ]);

    expect(projection.source).toBe('context_projection');
    expect(projection.recordCount).toBe(8);
    expect(projection.tenantKey).toBe('first-capital');
    expect(projection.clientId).toBe('client-1');
    expect(projection.initiatives).toHaveLength(1);
    expect(projection.spend).toHaveLength(1);
    expect(projection.risks).toHaveLength(1);
    expect(projection.agents).toHaveLength(1);
    expect(projection.productivity).toHaveLength(1);
    expect(projection.usage).toHaveLength(1);
    expect(projection.actions).toHaveLength(1);
    expect(projection.evidence).toHaveLength(1);
  });

  it('maps a benefit_realization record into the initiative lens', () => {
    const projection = shapeControlTowerLensProjection([
      row({ lens_record_type: 'benefit_realization', canonical_record_id: 'init-2' }),
    ]);
    expect(projection.initiatives).toHaveLength(1);
    expect(projection.initiatives[0].id).toBe('init-2');
  });

  it('maps model_risk into the risk lens', () => {
    const projection = shapeControlTowerLensProjection([
      row({ lens_record_type: 'model_risk', canonical_record_id: 'mr-1' }),
    ]);
    expect(projection.risks).toHaveLength(1);
  });

  it('shapes initiative economics from the typed fact bag', () => {
    const projection = shapeControlTowerLensProjection([
      row({
        lens_record_type: 'initiative',
        canonical_record_id: 'init-econ',
        title: 'Copilot for Finance',
        facts: {
          committed_value_usd: { numeric: '4000000', unit: 'USD' },
          realized_value_usd: { numeric: '1200000', unit: 'USD' },
          spend_ytd_usd: { numeric: '900000', unit: 'USD' },
          stage: { text: 'scaled' },
          posture: { text: 'scale' },
          vendor: { text: 'Microsoft' },
        },
      }),
    ]);

    const initiative = projection.initiatives[0];
    expect(initiative.title).toBe('Copilot for Finance');
    expect(initiative.committedUsd).toBe(4_000_000);
    expect(initiative.realizedUsd).toBe(1_200_000);
    expect(initiative.spendUsd).toBe(900_000);
    expect(initiative.promisedUsd).toBe(4_000_000);
    expect(initiative.realizedPct).toBe(30); // 1.2M / 4M
    expect(initiative.stage).toBe('scaled');
    expect(initiative.vendor).toBe('Microsoft');
    expect(initiative.functionName).toBe('Finance & Accounting');
    expect(initiative.evidenceState).toBe('retrieval_proven');
  });

  it('falls back to raw value when no typed numeric is present', () => {
    const projection = shapeControlTowerLensProjection([
      row({
        lens_record_type: 'spend_contract',
        canonical_record_id: 'spend-raw',
        facts: {
          annualized_spend_usd: { value: '$2,500,000' },
          renewal_date: { value: '2026-09-30' },
          vendor: { text: 'Snowflake' },
        },
      }),
    ]);

    const spend = projection.spend[0];
    expect(spend.annualizedSpendUsd).toBe(2_500_000);
    expect(spend.renewalDate).toBe('2026-09-30');
    expect(spend.vendor).toBe('Snowflake');
  });

  it('derives agent deflection/auto-resolve percentages from volumes', () => {
    const projection = shapeControlTowerLensProjection([
      row({
        lens_record_type: 'agent',
        canonical_record_id: 'agent-pct',
        facts: {
          eligible_volume: { numeric: '1000' },
          ai_touched_volume: { numeric: '600' },
          auto_resolved_volume: { numeric: '450' },
          vendor: { text: 'SAP' },
          status: { text: 'disabled' },
        },
      }),
    ]);

    const agent = projection.agents[0];
    expect(agent.deflectionPct).toBe(60);
    expect(agent.autoResolvePct).toBe(45);
    expect(agent.vendor).toBe('SAP');
    expect(agent.governance).toBe('disabled');
  });

  it('computes usage adoption from seats when no adoption fact exists', () => {
    const projection = shapeControlTowerLensProjection([
      row({
        lens_record_type: 'usage',
        canonical_record_id: 'usage-adopt',
        facts: {
          seats_purchased: { numeric: '200' },
          seats_active: { numeric: '50' },
        },
      }),
    ]);
    expect(projection.usage[0].adoptionPct).toBe(25);
  });

  it('marks evidence review_required when freshness is stale', () => {
    const projection = shapeControlTowerLensProjection([
      row({
        lens_record_type: 'evidence',
        canonical_record_id: 'ev-stale',
        freshness_status: 'stale',
        has_evidence_pointer: true,
        max_fact_confidence: '0.88',
      }),
    ]);
    const evidence = projection.evidence[0];
    expect(evidence.evidenceState).toBe('review_required');
    expect(evidence.confidence).toBeCloseTo(0.88);
  });

  it('routes a governance_ai_evidence record with no explicit Tower type into evidence', () => {
    const projection = shapeControlTowerLensProjection([
      row({
        lens_record_type: 'gate_history',
        dimension_family: 'governance_ai_evidence',
        canonical_record_id: 'gate-1',
      }),
    ]);
    expect(projection.evidence).toHaveLength(1);
  });

  it('returns honest empty arrays for empty input', () => {
    const projection = shapeControlTowerLensProjection([]);
    expect(projection.recordCount).toBe(0);
    expect(projection.tenantKey).toBe('');
    expect(projection.initiatives).toEqual([]);
    expect(projection.evidence).toEqual([]);
  });
});

describe('getControlTowerLensProjection', () => {
  function fakeDb(rows: ControlTowerLensProjectionRow[]): AzureReadClient {
    return {
      select: jest.fn().mockResolvedValue(rows),
      query: jest.fn(),
      maybeSingle: jest.fn(),
      count: jest.fn(),
      withSession: jest.fn(),
    } as unknown as AzureReadClient;
  }

  it('returns null when the MV has no rows for the tenant', async () => {
    const db = fakeDb([]);
    const result = await getControlTowerLensProjection({ tenantKey: 'unloaded', db });
    expect(result).toBeNull();
  });

  it('returns null when neither tenantKey nor clientId is provided', async () => {
    const db = fakeDb([row({})]);
    const result = await getControlTowerLensProjection({ db });
    expect(result).toBeNull();
    expect(db.select).not.toHaveBeenCalled();
  });

  it('shapes rows and prefers clientId scoping when supplied', async () => {
    const db = fakeDb([row({ lens_record_type: 'initiative', canonical_record_id: 'init-x' })]);
    const result = await getControlTowerLensProjection({
      tenantKey: 'first-capital',
      clientId: 'client-1',
      db,
    });
    expect(result).not.toBeNull();
    expect(result?.source).toBe('context_projection');
    expect(result?.initiatives).toHaveLength(1);
    expect(db.select).toHaveBeenCalledWith(
      expect.objectContaining({
        table: 'ai_control_tower_lens_mv',
        where: { client_id: 'client-1' },
      }),
    );
  });

  it('degrades to null when the read throws (MV absent)', async () => {
    const db = {
      select: jest.fn().mockRejectedValue(new Error('relation "ai_control_tower_lens_mv" does not exist')),
      query: jest.fn(),
      maybeSingle: jest.fn(),
      count: jest.fn(),
      withSession: jest.fn(),
    } as unknown as AzureReadClient;
    const result = await getControlTowerLensProjection({ tenantKey: 'first-capital', db });
    expect(result).toBeNull();
  });
});
