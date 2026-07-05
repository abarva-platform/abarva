import {
  emptyAiControlTowerReadModel,
  getAiControlTowerReadModel,
} from '../read-model';
import { azureRead } from '@/lib/data-plane/azureRead';
import { getControlTowerLensProjection } from '@/lib/tower/control-tower-lens-projection';
import type { ControlTowerLensProjection } from '@/lib/tower/control-tower-lens-projection';
import type {
  AiControlTowerInitiativeRead,
  AiControlTowerSpendRead,
} from '../read-model';

jest.mock('@/lib/data-plane/azureRead', () => ({
  azureRead: {
    maybeSingle: jest.fn(async () => null),
    select: jest.fn(async () => []),
    query: jest.fn(async () => []),
  },
}));

jest.mock('@/lib/tower/control-tower-lens-projection', () => ({
  getControlTowerLensProjection: jest.fn(async () => null),
}));

const mockGetProjection = getControlTowerLensProjection as jest.MockedFunction<
  typeof getControlTowerLensProjection
>;
const mockedAzureRead = azureRead as jest.Mocked<typeof azureRead>;

function projectionInitiative(
  overrides: Partial<AiControlTowerInitiativeRead> = {},
): AiControlTowerInitiativeRead {
  return {
    id: 'init-proj-1',
    title: 'Context-projected initiative',
    functionName: 'Technology',
    category: 'AI initiative',
    stage: 'portfolio',
    posture: 'monitor',
    owner: 'CDO',
    sponsor: 'CIO',
    vendor: 'Microsoft',
    system: 'Copilot',
    personas: [],
    promisedBenefit: 'Throughput lift',
    metric: 'benefit_realization_usd',
    baseline: null,
    target: null,
    committedUsd: 1_000_000,
    spendUsd: 500_000,
    promisedUsd: 2_000_000,
    realizedUsd: 900_000,
    realizedPct: 45,
    confidence: 'high',
    evidenceState: 'retrieval_proven',
    status: 'on_track',
    notes: '',
    risks: [],
    citations: [],
    ...overrides,
  };
}

function projectionSpend(overrides: Partial<AiControlTowerSpendRead> = {}): AiControlTowerSpendRead {
  return {
    id: 'spend-proj-1',
    initiativeId: 'init-proj-1',
    functionName: 'Technology',
    vendor: 'Microsoft',
    product: 'Copilot',
    spendType: 'committed',
    monthlySpendUsd: 40_000,
    annualizedSpendUsd: 480_000,
    renewalDate: null,
    unitMetric: '',
    unitValue: null,
    evidenceState: 'committed',
    notes: '',
    ...overrides,
  };
}

function buildProjection(
  overrides: Partial<ControlTowerLensProjection> = {},
): ControlTowerLensProjection {
  return {
    tenantKey: 'first-capital',
    clientId: 'client-firstcapital',
    source: 'context_projection',
    recordCount: 2,
    initiatives: [projectionInitiative()],
    spend: [projectionSpend()],
    risks: [],
    agents: [],
    productivity: [],
    usage: [],
    evidence: [],
    actions: [],
    ...overrides,
  };
}

beforeEach(() => {
  jest.clearAllMocks();
  mockedAzureRead.maybeSingle.mockResolvedValue(null);
  mockedAzureRead.select.mockResolvedValue([]);
  mockedAzureRead.query.mockResolvedValue([]);
  mockGetProjection.mockReset();
  mockGetProjection.mockResolvedValue(null);
});

describe('ai-control-tower read model', () => {
  it('keeps an unloaded tenant honest', () => {
    const model = emptyAiControlTowerReadModel({
      clientId: 'client-empty',
      clientKey: 'empty',
      tenantName: 'Empty Client',
    });

    expect(model.source).toBe('empty');
    expect(model.rowCounts.initiatives).toBe(0);
    expect(model.kpis.find((kpi) => kpi.key === 'spend')?.tone).toBe('red');
    expect(model.kpis.find((kpi) => kpi.key === 'evidence')?.tone).toBe('red');
  });

  it('returns the durable context projection ahead of the synthetic fallback', async () => {
    mockGetProjection.mockResolvedValue(buildProjection());

    const model = await getAiControlTowerReadModel({
      clientId: 'client-firstcapital',
      clientKey: 'first-capital',
      tenantName: 'First Capital Financial',
    });

    expect(mockGetProjection).toHaveBeenCalledWith({
      tenantKey: 'first-capital',
      clientId: 'client-firstcapital',
    });
    expect(model.source).toBe('context_projection');
    expect(model.sourceDisclosure).toContain('committed context layer');
    expect(model.rowCounts.initiatives).toBe(1);
    expect(model.rowCounts.spend).toBe(1);
    // Derived lenses (functions/kpis) are computed from the projected rows.
    expect(model.functions.some((row) => row.name === 'Technology')).toBe(true);
    expect(model.kpis.find((kpi) => kpi.key === 'spend')?.value).not.toBe('$0');
  });

  it('maps validated V7 Lakeshore records into Tower ahead of context projection gaps', async () => {
    mockGetProjection.mockResolvedValue(buildProjection({ initiatives: [], spend: [] }));
    mockedAzureRead.query.mockResolvedValue([
      {
        dimension_key: 'v7_09_programs_initiatives_business_priorities',
        record_key: 'LAK-INIT-001',
        record_name: 'Kyriba global cash and payments rollout',
        source_file: 'V7_09_programs_initiatives.csv',
        source_row_number: 2,
        as_of_date: '2026-07-03',
        period_end: '2026-07-03',
        source_artifact_name: 'Programs and initiatives',
        source_validation_status: 'validated',
        values_json: {
          program_id: 'LAK-INIT-001',
          program_name: 'Kyriba global cash and payments rollout',
          business_function: 'Treasury',
          business_owner: 'Treasurer',
          executive_sponsor: 'CFO',
          phase: 'build',
          budget_usd: 42_000_000,
          expected_value_usd: 86_000_000,
          realized_value_usd: 18_900_000,
          value_basis: 'cash visibility, payment control, and working-capital benefits',
        },
      },
      {
        dimension_key: 'v7_10_ai_initiatives',
        record_key: 'LAK-AI-004',
        record_name: 'Automated close and finance reporting semantic layer',
        source_file: 'V7_10_ai_initiatives.csv',
        source_row_number: 5,
        as_of_date: '2026-07-03',
        period_end: '2026-07-03',
        source_artifact_name: 'AI initiatives',
        source_validation_status: 'validated',
        values_json: {
          ai_initiative_id: 'LAK-AI-004',
          use_case: 'Automated close and finance reporting semantic layer',
          business_process: 'Finance',
          value_hypothesis: 46_000_000,
          measured_value_usd: 21_160_000,
          production_status: 'build',
          data_readiness: 'SOX/control evidence and source citation gap',
          scale_hold_stop: 'hold_until_evidence_or_risk_cleared',
        },
      },
      {
        dimension_key: 'v7_07_vendors_contracts',
        record_key: 'LAK-VEN-002',
        record_name: 'SAP',
        source_file: 'V7_07_vendors_contracts.csv',
        source_row_number: 3,
        as_of_date: '2026-07-03',
        period_end: '2026-07-03',
        source_artifact_name: 'Vendors and contracts',
        source_validation_status: 'validated',
        values_json: {
          vendor_id: 'LAK-VEN-002',
          vendor_name: 'SAP',
          contract_id: 'SAP-2026',
          service: 'finance_treasury',
          annual_cost_usd: 12_500_000,
          renewal_date: '2026-08-07',
        },
      },
    ]);

    const model = await getAiControlTowerReadModel({
      clientId: 'client-lakeshore',
      clientKey: 'lakeshore',
      tenantName: 'Lakeshore Holdings',
    });

    expect(model.source).toBe('intelligence_v7');
    expect(mockGetProjection).not.toHaveBeenCalled();
    expect(model.rowCounts.initiatives).toBeGreaterThanOrEqual(2);
    expect(model.rowCounts.benefits).toBeGreaterThanOrEqual(2);
    expect(model.rowCounts.spend).toBeGreaterThanOrEqual(2);
    expect(model.kpis.find((kpi) => kpi.key === 'value')?.value).not.toBe('$0');
    expect(model.kpis.find((kpi) => kpi.key === 'spend')?.value).not.toBe('$0');
    expect(model.spend.some((row) => row.renewalDate === '2026-08-07')).toBe(true);
    expect(model.sourceDisclosure).toMatch(/validated V7 intelligence substrate/i);
  });

  it('supplements partial committed Tower rows with V7 instead of showing false gaps', async () => {
    mockedAzureRead.maybeSingle.mockResolvedValue({
      id: 'refresh-lakeshore',
      client_id: 'client-lakeshore',
      client_key: 'lakeshore',
      reporting_period_end: '2026-07-03',
    });
    mockedAzureRead.select.mockImplementation(async ({ table }) => {
      if (table === 'ai_control_spend_contracts') {
        return [
          {
            spend_key: 'legacy-cloud-spend',
            vendor: 'Microsoft',
            product_or_service: 'Azure estate',
            spend_type: 'run',
            monthly_spend_usd: 1_000_000,
            annualized_spend_usd: 12_000_000,
            evidence_state: 'committed',
          },
        ];
      }
      return [];
    });
    mockedAzureRead.query.mockResolvedValue([
      {
        dimension_key: 'v7_09_programs_initiatives_business_priorities',
        record_key: 'lak-prog-kyriba',
        record_name: 'Kyriba global cash and payments rollout',
        source_file: 'lakeshore_v7_programs.csv',
        source_row_number: 11,
        as_of_date: '2026-07-03',
        period_end: '2026-07-03',
        source_artifact_name: 'Programs and priorities',
        source_validation_status: 'validated',
        values_json: {
          program_id: 'LAK-PROG-001',
          program_name: 'Kyriba global cash and payments rollout',
          business_function: 'Treasury and payments',
          budget_usd: 42_000_000,
          expected_value_usd: 86_000_000,
          finance_attested_value_usd: 18_900_000,
          business_owner: 'VP Treasury',
        },
      },
      {
        dimension_key: 'v7_07_vendors_contracts',
        record_key: 'lak-sap-renewal',
        record_name: 'SAP finance renewal',
        source_file: 'lakeshore_v7_vendor_contracts.csv',
        source_row_number: 21,
        as_of_date: '2026-07-03',
        period_end: '2026-07-03',
        source_artifact_name: 'Vendors and contracts',
        source_validation_status: 'validated',
        values_json: {
          vendor_id: 'LAK-VEN-002',
          vendor_name: 'SAP',
          contract_id: 'SAP-2026',
          service: 'finance_treasury',
          annual_cost_usd: 12_500_000,
          renewal_date: '2026-08-07',
        },
      },
    ]);

    const model = await getAiControlTowerReadModel({
      clientId: 'client-lakeshore',
      clientKey: 'lakeshore',
      tenantName: 'Lakeshore Holdings',
    });

    expect(model.source).toBe('ai_control_data_plane_plus_intelligence_v7');
    expect(mockGetProjection).not.toHaveBeenCalled();
    expect(model.rowCounts.initiatives).toBeGreaterThanOrEqual(1);
    expect(model.rowCounts.benefits).toBeGreaterThanOrEqual(1);
    expect(model.rowCounts.spend).toBeGreaterThanOrEqual(3);
    expect(model.kpis.find((kpi) => kpi.key === 'value')?.value).not.toBe('$0');
    expect(model.spend.some((row) => row.vendor === 'Microsoft')).toBe(true);
    expect(model.spend.some((row) => row.renewalDate === '2026-08-07')).toBe(true);
    expect(model.sourceDisclosure).toMatch(/supplemented by the validated V7 intelligence substrate/i);
  });

  it('falls back to today’s behavior unchanged when the projection is null (graceful degradation)', async () => {
    mockGetProjection.mockResolvedValue(null);

    const model = await getAiControlTowerReadModel({
      clientId: 'client-firstcapital',
      clientKey: 'firstcapital',
      tenantName: 'First Capital Financial',
    });

    expect(model.source).toBe('first_capital_local_synthetic_fallback');
    expect(model.rowCounts.initiatives).toBeGreaterThan(0);
    expect(model.rowCounts.spend).toBeGreaterThan(0);
    expect(model.rowCounts.risks).toBeGreaterThan(0);
    expect(model.functions.some((row) => row.name === 'Technology')).toBe(true);
    expect(model.kpis.find((kpi) => kpi.key === 'spend')?.value).not.toBe('$0');
  });

  it('returns empty (not synthetic) for a non-First-Capital tenant with no projection', async () => {
    mockGetProjection.mockResolvedValue(null);

    const model = await getAiControlTowerReadModel({
      clientId: 'client-other',
      clientKey: 'some-other-tenant',
      tenantName: 'Some Other Tenant',
    });

    expect(model.source).toBe('empty');
  });
});
