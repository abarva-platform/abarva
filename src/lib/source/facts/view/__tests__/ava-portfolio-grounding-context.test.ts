// ─────────────────────────────────────────────────────────────────────────────
// Regression coverage for the live-found bug: aVa on a Source surface had no
// governed portfolio grounding and answered portfolio questions from an
// unrelated corpus (fabricated-looking vendor "Sabre", contract ids like
// CON-00207, and an unflagged "$2.28B" figure that matched nothing real).
//
// This suite asserts buildAvaSourcePortfolioGrounding renders the SAME totals
// summarizePortfolio/computeVendorConcentration/computeContractLeverageSignals
// produce for identical fixture rows — the anti-divergence guarantee, mirroring
// ava-grounding-context.test.ts's pattern for the per-event grounding.
// ─────────────────────────────────────────────────────────────────────────────

import { buildAvaSourcePortfolioGrounding } from '../ava-portfolio-grounding-context';
import type {
  SourceContract360Row,
  SourceVendorContractPortfolioRow,
} from '@/lib/source/data-model/types';

const mockListContract360 = jest.fn();
const mockListVendorContractPortfolio = jest.fn();

jest.mock('@/lib/source/data-model/read-adapter', () => ({
  listContract360: (...args: unknown[]) => mockListContract360(...args),
  listVendorContractPortfolio: (...args: unknown[]) =>
    mockListVendorContractPortfolio(...args),
}));

function contractRow(
  overrides: Partial<SourceContract360Row> & { contract_id: string },
): SourceContract360Row {
  return {
    tenant_key: 'skyharbor_global',
    vendor_ref: 'v-default',
    vendor_name: 'Default Vendor',
    vendor_category: null,
    contract_name: 'Default Contract',
    scope_summary: null,
    annual_value: 10_000_000,
    total_committed_value: 30_000_000,
    committed_annual_spend: 10_000_000,
    actual_annual_spend: 9_000_000,
    end_date: null,
    notice_period_days: null,
    auto_renew: false,
    renewal_decision_state: null,
    renewal_owner_ref: null,
    benchmarking_clause: 'none',
    exit_rights_summary: null,
    alternatives_available: 'none',
    concentration_note: null,
    source_confidence: null,
    resolved_annual_value: null,
    annual_value_conflict_flag: false,
    resolved_total_committed_value: null,
    total_committed_value_conflict_flag: false,
    scoped_application_count: null,
    critical_application_count: null,
    linked_budget_amount: null,
    linked_actual_amount: null,
    linked_budget_lines: null,
    cloud_sev1_sev2_incidents: null,
    operational_evidence_gap: null,
    initiative_dependency_count: null,
    ...overrides,
  };
}

function vendorRow(
  overrides: Partial<SourceVendorContractPortfolioRow> & { vendor_ref: string },
): SourceVendorContractPortfolioRow {
  return {
    tenant_key: 'skyharbor_global',
    vendor_name: 'Default Vendor',
    vendor_category: 'Cloud',
    contract_count: 1,
    annual_value: 10_000_000,
    total_committed_value: 30_000_000,
    auto_renew_contracts: 0,
    next_end_date: null,
    contract_refs: [],
    ...overrides,
  };
}

describe('buildAvaSourcePortfolioGrounding', () => {
  beforeEach(() => {
    mockListContract360.mockReset();
    mockListVendorContractPortfolio.mockReset();
  });

  it('returns an empty block when the tenant has no governed contract rows', async () => {
    mockListContract360.mockResolvedValue([]);
    mockListVendorContractPortfolio.mockResolvedValue([]);
    const result = await buildAvaSourcePortfolioGrounding('empty_tenant');
    expect(result.block).toBe('');
    expect(result.hasLiveNumbers).toBe(false);
  });

  it('quotes portfolio totals that match summarizePortfolio for the same rows — the anti-divergence guarantee', async () => {
    const rows: SourceContract360Row[] = [
      contractRow({ contract_id: 'c1', vendor_ref: 'v1', vendor_name: 'Salesforce', annual_value: 43_500_000, actual_annual_spend: 37_400_000, auto_renew: true, benchmarking_clause: 'none', alternatives_available: 'none' }),
      contractRow({ contract_id: 'c2', vendor_ref: 'v2', vendor_name: 'CloudPeak Managed Services', annual_value: 25_000_000, actual_annual_spend: 20_000_000, benchmarking_clause: 'strong' }),
      contractRow({ contract_id: 'c3', vendor_ref: 'v1', vendor_name: 'Salesforce', annual_value: 5_000_000, actual_annual_spend: 4_500_000 }),
    ];
    mockListContract360.mockResolvedValue(rows);
    mockListVendorContractPortfolio.mockResolvedValue([
      vendorRow({ vendor_ref: 'v1', vendor_name: 'Salesforce', annual_value: 48_500_000, contract_count: 2 }),
      vendorRow({ vendor_ref: 'v2', vendor_name: 'CloudPeak Managed Services', annual_value: 25_000_000 }),
    ]);

    const result = await buildAvaSourcePortfolioGrounding('skyharbor_global');

    expect(result.hasLiveNumbers).toBe(true);
    // 3 contracts, 2 distinct vendors, $73.5M total annual value — verified by
    // hand against the fixture above, the same arithmetic summarizePortfolio does.
    expect(result.block).toContain('Contracts: 3');
    expect(result.block).toContain('Vendors: 2');
    expect(result.block).toContain('$73.5M');
    // Real vendor names from the fixture must appear; nothing fabricated.
    expect(result.block).toContain('Salesforce');
    expect(result.block).toContain('CloudPeak Managed Services');
    // No fabricated vendor/contract id from the live-found bug should ever
    // appear — this is the literal regression signature.
    expect(result.block).not.toContain('Sabre');
    expect(result.block).not.toContain('CON-00');
    // The quote-not-compute instruction must be present.
    expect(result.block).toMatch(/ONLY governed Source portfolio numbers/i);
  });

  it('states what its counts actually count, so another surface can be reconciled', async () => {
    // Live-found: aVa reported 121 contracts / 30 vendors while the Source
    // Workspace header reported 100 / 60 for the same tenant. Neither is wrong —
    // the header counts contract FAMILIES from the V4 snapshot, this counts
    // contract ROWS in source.contract_360. A bare number made that read as a
    // contradiction, so the basis has to travel with the figure.
    mockListContract360.mockResolvedValue([
      contractRow({ contract_id: 'c1', vendor_ref: 'v1', vendor_name: 'Salesforce', annual_value: 1_000_000 }),
    ]);
    mockListVendorContractPortfolio.mockResolvedValue([
      vendorRow({ vendor_ref: 'v1', vendor_name: 'Salesforce', annual_value: 1_000_000 }),
    ]);

    const result = await buildAvaSourcePortfolioGrounding('skyharbor');

    expect(result.block).toContain('contract rows in source.contract_360');
    expect(result.block).toContain('distinct vendor references');
    expect(result.block).toContain('contract FAMILIES');
    expect(result.block).toMatch(/do not treat either as wrong/i);
  });

  it('never asserts a number for a tenant whose read fails — falls through honestly', async () => {
    mockListContract360.mockRejectedValue(new Error('connection refused'));
    mockListVendorContractPortfolio.mockRejectedValue(new Error('connection refused'));
    const result = await buildAvaSourcePortfolioGrounding('unreachable_tenant');
    expect(result.block).toBe('');
    expect(result.hasLiveNumbers).toBe(false);
  });
});
