import { INITIAL_STATE, WorkspaceViewModel } from "../viewModel";
import type { SourceWorkspacePortfolioData } from "../live/portfolioAdapter";
import type {
  SourceContract360Row,
  SourceVendorContractPortfolioRow,
} from "@/lib/source/data-model/types";
import { sourceV4CubeUiCatalogForAgent } from "@/lib/source/data-model/source-v4-cube-ui-catalog";
import { createEmptySourceV4WorkspaceSnapshot } from "@/lib/source/data-model/source-v4-workspace-snapshot";

// Live-found bug (2026-08-04): selecting a value in the Explore lens (e.g.
// Vendor = Salesforce) correctly updated the "current selection" total, but
// the "Annual contract value by <dimension>" panel kept showing every
// vendor at full color/value instead of greying out the ones excluded by
// the selection — exactly the associative-selection behavior the listboxes
// already got right. Root cause: explore()'s bucket-liveness computation
// reused matches(c, S.groupBy), which deliberately ignores the CURRENTLY
// GROUPED dimension's own filter (correct for listboxes — "what else could
// I pick" — wrong for the main panel, where a bucket that isn't the
// selected value must never read as live).

function contractRow(
  overrides: Partial<SourceContract360Row> & { contract_id: string },
): SourceContract360Row {
  return {
    tenant_key: "skyharbor_global",
    vendor_ref: "v-default",
    vendor_name: "Default Vendor",
    vendor_category: null,
    contract_name: "Default Contract",
    scope_summary: null,
    annual_value: 50_000_000,
    total_committed_value: 150_000_000,
    committed_annual_spend: 50_000_000,
    actual_annual_spend: 48_000_000,
    end_date: null,
    notice_period_days: null,
    auto_renew: false,
    renewal_decision_state: null,
    renewal_owner_ref: null,
    benchmarking_clause: "none",
    exit_rights_summary: null,
    alternatives_available: "none",
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
    tenant_key: "skyharbor_global",
    vendor_name: "Default Vendor",
    vendor_category: "Cloud",
    contract_count: 1,
    annual_value: 50_000_000,
    total_committed_value: 150_000_000,
    auto_renew_contracts: 0,
    next_end_date: null,
    contract_refs: [],
    ...overrides,
  };
}

// Three vendors, four contracts — Salesforce carries two, so a Vendor =
// Salesforce selection should leave exactly one live bucket (Salesforce)
// and mark CloudPeak / Microsoft excluded.
const CONTRACTS: SourceContract360Row[] = [
  contractRow({ contract_id: "c1", vendor_ref: "v-sf", vendor_name: "Salesforce", annual_value: 40_000_000 }),
  contractRow({ contract_id: "c2", vendor_ref: "v-sf", vendor_name: "Salesforce", annual_value: 3_500_000 }),
  contractRow({ contract_id: "c3", vendor_ref: "v-cp", vendor_name: "CloudPeak", annual_value: 30_000_000 }),
  contractRow({ contract_id: "c4", vendor_ref: "v-ms", vendor_name: "Microsoft", annual_value: 25_000_000 }),
];

const VENDORS: SourceVendorContractPortfolioRow[] = [
  vendorRow({ vendor_ref: "v-sf", vendor_name: "Salesforce", annual_value: 43_500_000, contract_count: 2 }),
  vendorRow({ vendor_ref: "v-cp", vendor_name: "CloudPeak", annual_value: 30_000_000 }),
  vendorRow({ vendor_ref: "v-ms", vendor_name: "Microsoft", annual_value: 25_000_000 }),
];

const EMPTY_V4_SNAPSHOT = createEmptySourceV4WorkspaceSnapshot("2027-06-30T00:00:00Z");

const PORTFOLIO: SourceWorkspacePortfolioData = {
  tenantKey: "skyharbor_global",
  asOfDateIso: "2027-06-30T00:00:00Z",
  semanticLayer: sourceV4CubeUiCatalogForAgent(),
  v4Snapshot: EMPTY_V4_SNAPSHOT,
  contracts: CONTRACTS,
  vendors: VENDORS,
  applicationScope: [],
  initiativeDependencies: [],
  isEmpty: false,
  reads: {
    contracts: "available",
    vendors: "available",
    applicationScope: "available",
    initiativeDependencies: "available",
  },
};

function buildVm(sliceOverride: Record<string, string[]>) {
  return new WorkspaceViewModel(
    { ...INITIAL_STATE, groupBy: "vendor", slice: sliceOverride },
    () => undefined,
    PORTFOLIO,
    "Airline Demo",
    () => undefined,
  );
}

describe("WorkspaceViewModel.explore — associative selection", () => {
  it("with no filters, every vendor bucket is live", () => {
    const vm = buildVm({});
    const ex = vm.explore(vm.enrich());
    expect(ex.groups.every((g) => g.labelColor === "#0a0a0b")).toBe(true);
  });

  it("selecting Vendor = Salesforce marks only the Salesforce bucket live — every other vendor bucket must grey out", () => {
    const vm = buildVm({ vendor: ["Salesforce"] });
    const ex = vm.explore(vm.enrich());

    const salesforce = ex.groups.find((g) => g.key === "Salesforce");
    const cloudPeak = ex.groups.find((g) => g.key === "CloudPeak");
    const microsoft = ex.groups.find((g) => g.key === "Microsoft");

    expect(salesforce).toBeDefined();
    expect(cloudPeak).toBeDefined();
    expect(microsoft).toBeDefined();

    // Live (selected) bucket renders in full ink color and keeps its real value.
    expect(salesforce!.labelColor).toBe("#0a0a0b");
    expect(salesforce!.value).toBe("$43.5M");

    // Excluded buckets must grey out — this is exactly what the live bug
    // failed to do: before the fix, every vendor rendered with labelColor
    // '#0a0a0b' regardless of the active Vendor = Salesforce selection.
    expect(cloudPeak!.labelColor).toBe("#b4b2a9");
    expect(microsoft!.labelColor).toBe("#b4b2a9");
  });

  it("cross-dimension grouping still respects an active filter on a different dimension", () => {
    // Grouping by benchmark clause while Vendor = Salesforce is selected —
    // the grouped dimension itself (benchmark) has no filter, so its own
    // buckets should stay live/possible, gated only by whether any
    // Salesforce contract actually has that clause value.
    const vm = buildVm({ vendor: ["Salesforce"] });
    vm.state.groupBy = "benchmark";
    const ex = vm.explore(vm.enrich());
    const noneClause = ex.groups.find((g) => g.key === "none");
    expect(noneClause).toBeDefined();
    // Both Salesforce contracts use benchmarking_clause: "none" (fixture
    // default), so this bucket must remain live even with the vendor filter active.
    expect(noneClause!.labelColor).toBe("#0a0a0b");
  });
});
