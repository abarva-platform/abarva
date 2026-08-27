import {
  buildInitialWorkspaceState,
  INITIAL_STATE,
  WorkspaceViewModel,
} from "../viewModel";
import {
  buildSourceVendor360Cockpit,
  type SourceWorkspacePortfolioData,
} from "../live/portfolioAdapter";
import { buildViewModel } from "../buildViewModel";
import type {
  SourceContract360Row,
  SourceVendorContractPortfolioRow,
} from "@/lib/source/data-model/types";
import { sourceV4CubeUiCatalogForAgent } from "@/lib/source/data-model/source-v4-cube-ui-catalog";
import { evaluateContractCategoryQuality } from "@/lib/source/data-model/contract-category-quality";
import { createEmptySourceV4WorkspaceSnapshot } from "@/lib/source/data-model/source-v4-workspace-snapshot";

// Live-found bug (2026-08-04): selecting a value in the Explore lens (e.g.
// Vendor = Salesforce) correctly updated the "current selection" total, but
// the "Annual contract value by <dimension>" panel kept showing every vendor.
// The approved Source behavior is now selected-only by default; peers return
// only when Compare all is explicit.

function contractRow(
  overrides: Partial<SourceContract360Row> & { contract_id: string },
): SourceContract360Row {
  return {
    tenant_key: "skyharbor_global",
    vendor_ref: "vendor-default",
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
  contractRow({ contract_id: "c1", vendor_ref: "vendor-salesforce", vendor_name: "Salesforce", annual_value: 40_000_000 }),
  contractRow({ contract_id: "c2", vendor_ref: "vendor-salesforce", vendor_name: "Salesforce", annual_value: 3_500_000 }),
  contractRow({ contract_id: "c3", vendor_ref: "vendor-cloudpeak", vendor_name: "CloudPeak", annual_value: 30_000_000 }),
  contractRow({ contract_id: "c4", vendor_ref: "vendor-microsoft", vendor_name: "Microsoft", annual_value: 25_000_000 }),
];

const VENDORS: SourceVendorContractPortfolioRow[] = [
  vendorRow({ vendor_ref: "vendor-salesforce", vendor_name: "Salesforce", annual_value: 43_500_000, contract_count: 2 }),
  vendorRow({ vendor_ref: "vendor-cloudpeak", vendor_name: "CloudPeak", annual_value: 30_000_000 }),
  vendorRow({ vendor_ref: "vendor-microsoft", vendor_name: "Microsoft", annual_value: 25_000_000 }),
];

const EMPTY_V4_SNAPSHOT = createEmptySourceV4WorkspaceSnapshot("2027-06-30T00:00:00Z");

const WORKSPACE_DIAGNOSTICS = {
  datasetLabel: "SkyHarbor Source v4",
  datasetId: "skyharbor-source-v4-202608",
  datasetVersion: "v4",
  analyticsProvider: "CubeSourceProvider",
  activeLoadRunId: null,
  asOfDateIso: "2027-06-30T00:00:00Z",
  v4ContractCount: 0,
  v4VendorCount: 0,
  legacyContractCount: CONTRACTS.length,
  legacyVendorCount: VENDORS.length,
  exploreProvider: "LegacySourceContract360Provider" as const,
  exploreMatchesV4: false,
  mismatchWarning:
    "Explore lens is reading 4 contracts / 3 vendors from source.contract_360 while the active Source V4 snapshot reports 0 contract families / 0 vendors.",
};

const READS = {
  contracts: "available" as const,
  vendors: "available" as const,
  applicationScope: "available" as const,
  initiativeDependencies: "available" as const,
};

const PORTFOLIO: SourceWorkspacePortfolioData = {
  tenantKey: "skyharbor_global",
  asOfDateIso: "2027-06-30T00:00:00Z",
  semanticLayer: sourceV4CubeUiCatalogForAgent(),
  v4Snapshot: EMPTY_V4_SNAPSHOT,
  categoryQuality: evaluateContractCategoryQuality(CONTRACTS),
  workspaceDiagnostics: WORKSPACE_DIAGNOSTICS,
  cockpit: buildSourceVendor360Cockpit({
    contracts: CONTRACTS,
    vendors: VENDORS,
    applicationScope: [],
    initiativeDependencies: [],
    v4Snapshot: EMPTY_V4_SNAPSHOT,
    workspaceDiagnostics: WORKSPACE_DIAGNOSTICS,
    reads: READS,
    asOfDateIso: "2027-06-30T00:00:00Z",
  }),
  contracts: CONTRACTS,
  vendors: VENDORS,
  applicationScope: [],
  initiativeDependencies: [],
  isEmpty: false,
  reads: READS,
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
  it("initializes a contract deep link directly in Contract 360 mode", () => {
    const state = buildInitialWorkspaceState({
      contractId: "CTR-090",
      contractTab: "Evidence",
    });

    expect(state.sel).toEqual({ kind: "contract", id: "CTR-090" });
    expect(state.tabs.contract).toBe("Evidence");
    expect(state.hist).toEqual([
      { kind: "contract", id: "CTR-090", tab: "Evidence" },
    ]);
    expect(state.hi).toBe(0);
  });

  it("normalizes lower-case contract deep-link tab requests", () => {
    const state = buildInitialWorkspaceState({
      contractId: "CTR-090",
      contractTab: "evidence",
    });

    expect(state.tabs.contract).toBe("Evidence");
    expect(state.hist).toEqual([
      { kind: "contract", id: "CTR-090", tab: "Evidence" },
    ]);
  });

  it("keeps contract deep-link tab requests inside known Contract 360 tabs", () => {
    const state = buildInitialWorkspaceState({
      contractId: "CTR-090",
      contractTab: "Not a real tab",
    });

    expect(state.sel).toEqual({ kind: "contract", id: "CTR-090" });
    expect(state.tabs.contract).toBe(INITIAL_STATE.tabs.contract);
  });

  it("does not substitute the first contract when a deep link points to a missing contract", () => {
    const state = buildInitialWorkspaceState({
      contractId: "CTR-DOES-NOT-EXIST",
      contractTab: "Story",
    });
    const vm = new WorkspaceViewModel(
      state,
      () => undefined,
      PORTFOLIO,
      "Airline Demo",
      () => undefined,
    );

    const view = buildViewModel(vm);

    expect(view.title).toBe("Contract not found in governed Source rows");
    expect(view.thesis).toContain("CTR-DOES-NOT-EXIST");
    expect(view.thesis).toContain("withholding the contract view");
    expect(view.isContract).toBe(true);
    expect(view.c).toBeNull();
    expect(view.statusSel).toBe("CTR-DOES-NOT-EXIST › Not found");
    expect(view.valueStrip.map((item) => item.value)).toContain(
      "CTR-DOES-NOT-EXIST",
    );
    expect(view.title).not.toContain(CONTRACTS[0]!.vendor_name);
  });

  it("with no filters, every vendor bucket is live", () => {
    const vm = buildVm({});
    const ex = vm.explore(vm.enrich());
    expect(ex.groups.every((g) => g.labelColor === "#0a0a0b")).toBe(true);
    expect(ex.intentTitle).toMatch(/leadership conversation/i);
    expect(ex.emptySelectionCopy).toMatch(/Pick a vendor, urgency/i);
    expect(ex.chartInstruction).toMatch(/Click a row to narrow/i);
    expect(ex.quality.showBanner).toBe(false);
    expect(ex.boxes.map((box) => box.id)).toEqual([
      "urgency",
      "benchmark",
      "alternatives",
      "autoRenew",
      "weak",
    ]);
    expect(ex.boxes.map((box) => box.id)).not.toContain("category");
    expect(ex.selectedContracts.map((contract) => contract.id)).toEqual(["c1", "c3", "c4", "c2"]);
  });

  it("selecting Vendor = Salesforce shows only the Salesforce bucket by default", () => {
    const vm = buildVm({ vendor: ["Salesforce"] });
    const ex = vm.explore(vm.enrich());

    expect(ex.groups.map((g) => g.key)).toEqual(["Salesforce"]);
    expect(ex.groups[0]?.labelColor).toBe("#0a0a0b");
    expect(ex.groups[0]?.value).toBe("$43.5M");
    expect(ex.selectedContracts.map((contract) => contract.id)).toEqual(["c1", "c2"]);
    expect(ex.selectedContracts[0]).toMatchObject({
      vendor: "Salesforce",
      value: "$40.0M",
      renewal: "Manual",
      weakSignals: "2 of 4",
    });
  });

  it("Compare all intentionally restores excluded peers", () => {
    const vm = buildVm({ vendor: ["Salesforce"] });
    vm.state.compareExcluded = true;
    const ex = vm.explore(vm.enrich());

    expect(ex.groups.map((g) => g.key)).toEqual(["Salesforce", "CloudPeak", "Microsoft"]);
    expect(ex.groups.find((g) => g.key === "CloudPeak")?.labelColor).toBe("#b4b2a9");
    expect(ex.groups.find((g) => g.key === "Microsoft")?.share).toBe("excluded");
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
