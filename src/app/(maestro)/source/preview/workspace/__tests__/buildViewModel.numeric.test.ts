import { buildViewModel } from "../buildViewModel";
import { INITIAL_STATE, WorkspaceViewModel } from "../viewModel";
import type { SourceWorkspacePortfolioData } from "../live/portfolioAdapter";
import type {
  SourceContract360Row,
  SourceVendorContractPortfolioRow,
} from "@/lib/source/data-model/types";
import { sourceV4CubeUiCatalogForAgent } from "@/lib/source/data-model/source-v4-cube-ui-catalog";

// `node-postgres` returns NUMERIC/DECIMAL columns as strings, not numbers,
// even though these row types declare them `number | null` (see
// 2026-08-03-source-numeric-string-aggregation-fix and
// 2026-08-03-contract-360-numeric-coercion-fix). This fixture injects real
// strings — exactly what the live driver returns — to catch any `t + value`
// accumulation in this file's own explorer-tree/quadrant aggregates that
// bypasses the already-hardened vendor-contract-portfolio.ts functions.

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
    annual_value: "50000000.00" as unknown as number,
    total_committed_value: "150000000.00" as unknown as number,
    committed_annual_spend: "50000000.00" as unknown as number,
    actual_annual_spend: "48000000.00" as unknown as number,
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
    critical_application_count: "3" as unknown as number,
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
    annual_value: "50000000.00" as unknown as number,
    total_committed_value: "150000000.00" as unknown as number,
    auto_renew_contracts: 0,
    next_end_date: null,
    contract_refs: [],
    ...overrides,
  };
}

// Three contracts in the same vendor category, each carrying weak
// benchmarking/alternatives clauses (weakSignalCount === 2, so all three
// land in the "Leverage" exec-tree bucket) — the exact shape that, before
// this fix, string-concatenated three ~8-digit annual_value strings into a
// ~24-digit number and rendered as a huge or infinite dollar figure.
const CONTRACTS: SourceContract360Row[] = [
  contractRow({
    contract_id: "c1",
    vendor_ref: "v1",
    vendor_name: "Vendor One",
    annual_value: "50000000.00" as unknown as number,
  }),
  contractRow({
    contract_id: "c2",
    vendor_ref: "v2",
    vendor_name: "Vendor Two",
    annual_value: "35000000.00" as unknown as number,
  }),
  contractRow({
    contract_id: "c3",
    vendor_ref: "v3",
    vendor_name: "Vendor Three",
    annual_value: "42000000.00" as unknown as number,
  }),
];

const VENDORS: SourceVendorContractPortfolioRow[] = [
  vendorRow({
    vendor_ref: "v1",
    vendor_name: "Vendor One",
    annual_value: "50000000.00" as unknown as number,
  }),
  vendorRow({
    vendor_ref: "v2",
    vendor_name: "Vendor Two",
    annual_value: "35000000.00" as unknown as number,
  }),
  vendorRow({
    vendor_ref: "v3",
    vendor_name: "Vendor Three",
    annual_value: "42000000.00" as unknown as number,
  }),
];

const PORTFOLIO: SourceWorkspacePortfolioData = {
  tenantKey: "skyharbor_global",
  asOfDateIso: "2027-06-30T00:00:00Z",
  semanticLayer: sourceV4CubeUiCatalogForAgent(),
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

function buildVm() {
  return new WorkspaceViewModel(
    INITIAL_STATE,
    () => undefined,
    PORTFOLIO,
    "Airline Demo",
    () => undefined,
  );
}

// Any dollar figure this build produces must stay within a plausible band —
// scientific notation (e+NN) or the literal string "Infinity" both indicate
// the string-concatenation regression, whether the true sum is huge-but-finite
// or genuinely infinite.
function assertPlausibleMoney(label: string, value: string) {
  expect(value).not.toMatch(/[Ee]\+/);
  expect(value).not.toMatch(/Infinity/i);
}

describe("buildViewModel numeric coercion", () => {
  it("sums explorer-tree badges without string-concatenating NUMERIC-as-string fields", () => {
    const vm = buildVm();
    const built = buildViewModel(vm) as {
      tree: Array<{ id: string; badgeVal: string }>;
    };

    for (const node of built.tree) {
      if (node.badgeVal) assertPlausibleMoney(node.id, node.badgeVal);
    }

    const leverageNode = built.tree.find((n) => n.id === "exec.Leverage");
    expect(leverageNode).toBeDefined();
    // 3 contracts summing to $127M — nowhere near $1B, so this must render as
    // an "M" figure, not the "$InfinityB" this fixture reproduced pre-fix.
    expect(leverageNode!.badgeVal).toBe("$127.0M");
  });

  it("sums the leverage quadrant panel without string-concatenation", () => {
    const vm = buildVm();
    const built = buildViewModel(vm) as { quadPanel: Array<{ value: string }> };
    for (const q of built.quadPanel) {
      assertPlausibleMoney(q.value, q.value);
    }
  });

  it("keeps the Source v4 semantic catalog on the workspace payload", () => {
    expect(PORTFOLIO.semanticLayer.datasetId).toBe(
      "skyharbor-source-v4-202608",
    );
    expect(
      PORTFOLIO.semanticLayer.lenses.map((lens) => lens.cubeView),
    ).toContain("source_v4_ai_usage_value_proof");
  });
});
