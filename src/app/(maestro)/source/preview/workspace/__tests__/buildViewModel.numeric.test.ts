import { buildViewModel } from "../buildViewModel";
import { INITIAL_STATE, WorkspaceViewModel } from "../viewModel";
import type { SourceWorkspacePortfolioData } from "../live/portfolioAdapter";
import type {
  SourceContract360Row,
  SourceVendorContractPortfolioRow,
} from "@/lib/source/data-model/types";
import { sourceV4CubeUiCatalogForAgent } from "@/lib/source/data-model/source-v4-cube-ui-catalog";
import {
  createEmptySourceV4WorkspaceSnapshot,
  type SourceV4WorkspaceSnapshot,
} from "@/lib/source/data-model/source-v4-workspace-snapshot";

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

const EMPTY_V4_SNAPSHOT = createEmptySourceV4WorkspaceSnapshot(
  "2027-06-30T00:00:00Z",
);

const V4_SNAPSHOT: SourceV4WorkspaceSnapshot = {
  ...EMPTY_V4_SNAPSHOT,
  availability: [
    { lensId: "executive_portfolio", state: "available", rowCount: 100 },
    { lensId: "ai_usage_value_proof", state: "available", rowCount: 24480 },
  ],
  executivePortfolio: {
    contractCount: 100,
    annualValue: 1480500000,
    totalCommittedValue: 5151000000,
    autoRenewCount: 12,
    notice90DayCount: 74,
  },
  aiUsageValueProof: {
    ...EMPTY_V4_SNAPSHOT.aiUsageValueProof,
    rowCount: 24480,
    assignedSeats: 705878,
    activeUsers: 481200,
    actualCost: 170200000,
    claimableRows: 0,
    topProducts: [{ name: "Claude Code", count: 960, amount: 8700000 }],
  },
};

const PORTFOLIO: SourceWorkspacePortfolioData = {
  tenantKey: "skyharbor_global",
  asOfDateIso: "2027-06-30T00:00:00Z",
  semanticLayer: sourceV4CubeUiCatalogForAgent(),
  v4Snapshot: V4_SNAPSHOT,
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

  it("never renders 'NaN%' for a non-finite source_confidence — falls back to an honest gap", () => {
    const vm = new WorkspaceViewModel(
      {
        ...INITIAL_STATE,
        sel: { kind: "contract", id: "c1" },
      },
      () => undefined,
      {
        ...PORTFOLIO,
        contracts: [
          contractRow({
            contract_id: "c1",
            vendor_ref: "v1",
            vendor_name: "Vendor One",
            // Live-found bug (2026-08-04): a malformed/unresolved confidence
            // value from the data plane reached pct() as a non-numeric
            // string, and (v * 100).toFixed(1) rendered the literal text
            // "NaN%" on the Contract 360 header strip and Optimization tab.
            source_confidence: "unresolved" as unknown as number,
          }),
        ],
      },
      "Airline Demo",
      () => undefined,
    );
    const built = buildViewModel(vm) as {
      valueStrip: Array<{ label: string; value: string }>;
      pendingItems: Array<{ label: string; sub: string }>;
    };

    // A non-finite source_confidence must never render as "NaN%" anywhere in
    // the header strip — it must fall through as a genuine, honestly-flagged
    // gap (missing: true), which routes it to pendingItems instead of the
    // rendered valueStrip.
    for (const item of built.valueStrip) {
      expect(item.value).not.toMatch(/NaN/);
    }
    const confidencePending = built.pendingItems.find(
      (item) => item.label === "Source confidence",
    );
    expect(confidencePending).toBeDefined();
  });

  it("keeps the Source v4 semantic catalog on the workspace payload", () => {
    expect(PORTFOLIO.semanticLayer.datasetId).toBe(
      "skyharbor-source-v4-202608",
    );
    expect(
      PORTFOLIO.semanticLayer.lenses.map((lens) => lens.cubeView),
    ).toContain("source_v4_ai_usage_value_proof");
  });

  it("keeps the Source v4 aggregate snapshot on the workspace payload", () => {
    expect(PORTFOLIO.v4Snapshot.datasetId).toBe("skyharbor-source-v4-202608");
    expect(
      PORTFOLIO.v4Snapshot.availability.map((slice) => slice.lensId),
    ).toContain("ai_usage_value_proof");
  });

  it("adds Source v4 aggregate facts to the aVa surface context", () => {
    const vm = buildVm();
    const built = buildViewModel(vm) as {
      avaSurfaceContext: {
        sourceV4: {
          executivePortfolio: { contracts: number; annualValue: string };
          valueProof: {
            assignedSeats: number;
            actualCost: string;
            claimableRows: number;
            rule: string;
          };
        };
      };
    };

    expect(built.avaSurfaceContext.sourceV4.executivePortfolio.contracts).toBe(
      100,
    );
    expect(
      built.avaSurfaceContext.sourceV4.executivePortfolio.annualValue,
    ).toBe("$1.4805B");
    expect(built.avaSurfaceContext.sourceV4.valueProof.assignedSeats).toBe(
      705878,
    );
    expect(built.avaSurfaceContext.sourceV4.valueProof.actualCost).toBe(
      "$170.2M",
    );
    expect(built.avaSurfaceContext.sourceV4.valueProof.claimableRows).toBe(0);
    expect(built.avaSurfaceContext.sourceV4.valueProof.rule).toMatch(
      /do not prove realized value/i,
    );
  });
});
