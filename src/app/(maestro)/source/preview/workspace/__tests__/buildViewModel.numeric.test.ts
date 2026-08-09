import { buildViewModel } from "../buildViewModel";
import { INITIAL_STATE, WorkspaceViewModel } from "../viewModel";
import type { SourceWorkspacePortfolioData } from "../live/portfolioAdapter";
import type {
  SourceContract360Row,
  SourceVendorContractPortfolioRow,
} from "@/lib/source/data-model/types";
import { sourceV4CubeUiCatalogForAgent } from "@/lib/source/data-model/source-v4-cube-ui-catalog";
import { evaluateContractCategoryQuality } from "@/lib/source/data-model/contract-category-quality";
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
    vendor_ref: "vendor-default",
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
// land in the "Weak leverage" contract drill-down bucket) — the exact shape that, before
// this fix, string-concatenated three ~8-digit annual_value strings into a
// ~24-digit number and rendered as a huge or infinite dollar figure.
const CONTRACTS: SourceContract360Row[] = [
  contractRow({
    contract_id: "c1",
    vendor_ref: "vendor-one",
    vendor_name: "Vendor One",
    annual_value: "50000000.00" as unknown as number,
  }),
  contractRow({
    contract_id: "c2",
    vendor_ref: "vendor-two",
    vendor_name: "Vendor Two",
    annual_value: "35000000.00" as unknown as number,
  }),
  contractRow({
    contract_id: "c3",
    vendor_ref: "vendor-three",
    vendor_name: "Vendor Three",
    annual_value: "42000000.00" as unknown as number,
  }),
];

const VENDORS: SourceVendorContractPortfolioRow[] = [
  vendorRow({
    vendor_ref: "vendor-one",
    vendor_name: "Vendor One",
    annual_value: "50000000.00" as unknown as number,
  }),
  vendorRow({
    vendor_ref: "vendor-two",
    vendor_name: "Vendor Two",
    annual_value: "35000000.00" as unknown as number,
  }),
  vendorRow({
    vendor_ref: "vendor-three",
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
  scopeConfidence: {
    rowCount: 5200,
    explicitScopeCount: 2600,
    inferredScopeCount: 2600,
  },
  spendConsumption: {
    ...EMPTY_V4_SNAPSHOT.spendConsumption,
    invoiceLines: 175000,
    actualSpend: 2494900000,
    offContractSpend: 25709000,
  },
  performanceCredits: {
    ...EMPTY_V4_SNAPSHOT.performanceCredits,
    rowCount: 7200,
    unclaimedCredit: 12728000,
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
  categoryQuality: evaluateContractCategoryQuality(CONTRACTS),
  workspaceDiagnostics: {
    datasetLabel: "SkyHarbor Source v4",
    datasetId: "skyharbor-source-v4-202608",
    datasetVersion: "v4",
    analyticsProvider: "CubeSourceProvider",
    activeLoadRunId: "source-v4-load-20260803",
    asOfDateIso: "2027-06-30T00:00:00Z",
    v4ContractCount: 100,
    v4VendorCount: 60,
    legacyContractCount: CONTRACTS.length,
    legacyVendorCount: VENDORS.length,
    exploreProvider: "LegacySourceContract360Provider",
    exploreMatchesV4: false,
    mismatchWarning:
      "Explore lens is reading 3 contracts / 3 vendors from source.contract_360 while the active Source V4 snapshot reports 100 contract families / 60 vendors.",
  },
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

function buildVm(overrides: Partial<SourceWorkspacePortfolioData> = {}) {
  return new WorkspaceViewModel(
    structuredClone(INITIAL_STATE),
    () => undefined,
    { ...PORTFOLIO, ...overrides },
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
  it("routes the workspace optimize entry to the contract-optimization intake, not generic new sourcing", () => {
    const vm = buildVm();
    vm.state.open.events = true;
    const built = buildViewModel(vm) as {
      tree: Array<{ id: string; onClick?: () => void }>;
    };
    const optimizeNode = built.tree.find(
      (item) => item.id === "events.optimize",
    );

    expect(optimizeNode).toBeDefined();
    expect(String(optimizeNode?.onClick)).toContain(
      "/source/new?intent=contract-optimization",
    );
    expect(String(optimizeNode?.onClick)).not.toContain(
      "window.location.href = '/source/new';",
    );
  });

  it("routes the selected-contract optimization cockpit through the reviewable intake URL", () => {
    const vm = buildVm();
    vm.state.sel = { kind: "contract", id: "c1" };
    vm.state.tabs.contract = "Optimize";
    const built = buildViewModel(vm) as {
      optCtaHref: string | null;
      optCtaLabel: string;
    };

    expect(built.optCtaLabel).toBe("Start / continue optimization");
    expect(built.optCtaHref).toContain(
      "/source/new?intent=contract-optimization",
    );
    const url = new URL(built.optCtaHref!, "https://app.abarva.ai");
    expect(url.searchParams.get("contractId")).toBe("c1");
    expect(url.searchParams.get("contractName")).toBe("Default Contract");
    expect(url.searchParams.get("vendorName")).toBe("Vendor One");
    expect(url.searchParams.get("annualValueUsd")).toBe("50000000");
    expect(url.searchParams.get("actualAnnualSpendUsd")).toBe("48000000");
    expect(url.searchParams.get("weakSignalCount")).toBe("2");
    expect(built.optCtaHref).not.toContain("/api/source/workspace");
    expect(JSON.stringify(built)).not.toContain("Door 1");
  });

  it("renders conflicted optimization evidence as not sized instead of zero", () => {
    const vm = buildVm();
    vm.state.sel = { kind: "contract", id: "c1" };
    vm.state.tabs.contract = "Optimize";
    vm.state.contractDetail.c1 = {
      contract: CONTRACTS[0],
      financialExposure: null,
      operationalPerformance: null,
      initiativeDependencies: [],
      scopeTiers: {
        explicit: [],
        reviewed: [],
        vendorInferred: [],
        unresolved: [],
        totalCount: 0,
      },
      towerObservations: [],
      towerValueClaims: [],
      hasTowerOverlay: false,
      docExtractions: [],
      optimizationEvidence: null,
      evidenceOverview: null,
      evidenceScope: [],
      evidencePricing: [],
      evidencePerformance: null,
      optimizationOpportunitySet: {
        tenantKey: "skyharbor_global",
        datasetVersion: "v4-golden-evidence",
        contractId: "c1",
        vendorId: "vendor-one",
        vendorName: "Vendor One",
        contractName: "Default Contract",
        recommendation: "Build evidence before optimizing.",
        recommendationDetail:
          "Baseline conflict must be resolved before any opportunity is sized.",
        actionState: "request_evidence",
        baseline: {
          status: "conflict",
          headline: "Commercial baseline conflict",
          detail: "Annual value conflicts with pricing schedule totals.",
          annualValueUsd: 35_000_000,
          pricingScheduleAnnualValueUsd: 45_000_000,
          actualAnnualSpendUsd: null,
          totalCommittedValueUsd: null,
          conflictAmountUsd: 10_000_000,
          sourceRefs: ["source.golden_contract_pricing_schedule"],
        },
        selectedOpportunityId: "c1:baseline-conflict",
        opportunities: [
          {
            opportunityId: "c1:baseline-conflict",
            contractId: "c1",
            label: "Commercial baseline conflict",
            shortLabel: "Baseline conflict",
            valueType: "recoverable_leakage",
            amountUsd: null,
            amountState: "not_sized",
            stage: "baseline_conflict",
            evidenceGrade: "conflicted",
            confidence: 0.92,
            deadline: null,
            owner: "Commercial owner",
            blockingGap: "Annual value conflicts with pricing schedule totals.",
            nextAction: "Reconcile the baseline before sizing.",
            sourceSystems: ["CLM / contract repository"],
            evidenceRefs: [],
            calculation: null,
            overlapTreatment:
              "No opportunity amount is displayed until the baseline is resolved.",
            approvalState: "blocked_by_baseline_conflict",
            narrative:
              "This contract is material, but the current evidence conflicts.",
          },
        ],
        financeRealizations: [],
        evidenceRequirements: ["Resolve baseline conflict."],
        potentialRecoverableUsd: 0,
        potentialAvoidableUsd: 0,
        potentialNegotiableUsd: 0,
        financeConfirmedUsd: 0,
      },
    };

    const built = buildViewModel(vm) as {
      compactItems: Array<{ label: string; value: string }>;
      opportunityView: {
        potential: {
          recoverable: string;
          avoidable: string;
          negotiable: string;
          total: string;
        };
        financeConfirmed: string;
      };
    };

    expect(built.opportunityView.potential.recoverable).toBe("Not sized");
    expect(built.opportunityView.potential.total).toBe("Not sized");
    expect(built.opportunityView.financeConfirmed).toBe("Not established");
    expect(built.compactItems).toEqual(
      expect.arrayContaining([
        { label: "potential recoverable", value: "Not sized" },
        { label: "finance confirmed", value: "Not established" },
      ]),
    );
  });

  it("does not promote synthetic fallback scope into the selected-contract intake URL", () => {
    const vm = buildVm({
      contracts: [
        contractRow({
          contract_id: "c1",
          vendor_ref: "vendor-one",
          vendor_name: "Vendor One",
          annual_value: "50000000.00" as unknown as number,
          scope_summary:
            "Fictional contract supporting airline technology services for Vendor One; annual value covers only the contract-backed portion of FY2027 vendor spend.",
        }),
      ],
    });
    vm.state.sel = { kind: "contract", id: "c1" };
    vm.state.tabs.contract = "Optimization";
    const built = buildViewModel(vm) as {
      optCtaHref: string | null;
      scopeSummary: string;
    };

    expect(built.optCtaHref).toContain(
      "/source/new?intent=contract-optimization",
    );
    expect(built.optCtaHref).not.toContain("scopeSummary=");
    expect(built.optCtaHref).not.toContain("Fictional");
    expect(built.scopeSummary).toContain(
      "Contract scope has not been extracted yet",
    );
  });

  it("sums explorer-tree badges without string-concatenating NUMERIC-as-string fields", () => {
    const vm = buildVm();
    const built = buildViewModel(vm) as {
      tree: Array<{ id: string; badgeVal: string }>;
    };

    for (const node of built.tree) {
      if (node.badgeVal) assertPlausibleMoney(node.id, node.badgeVal);
    }

    const leverageNode = built.tree.find((n) => n.id === "c.weak");
    expect(leverageNode).toBeDefined();
    // 3 contracts summing to $127M — nowhere near $1B, so this must render as
    // an "M" figure, not the "$InfinityB" this fixture reproduced pre-fix.
    expect(leverageNode!.badgeVal).toBe("$127.0M");
  });

  it("presents the portfolio workspace as four top-level tabs", () => {
    const vm = buildVm();
    const built = buildViewModel(vm) as {
      activeTab: string;
      tabs: Array<{ label: string }>;
      isPortfolioContext: boolean;
      isAgenda: boolean;
      isOpps: boolean;
    };

    expect(built.activeTab).toBe("Portfolio");
    expect(built.tabs.map((tab) => tab.label)).toEqual([
      "Portfolio",
      "Explore",
      "Concentration & Leverage",
      "Renewals",
    ]);
    expect(built.isPortfolioContext).toBe(true);
    expect(built.isAgenda).toBe(false);
    expect(built.isOpps).toBe(false);
  });

  it("keeps contract relationship as its own detail tab", () => {
    const vm = new WorkspaceViewModel(
      {
        ...INITIAL_STATE,
        sel: { kind: "contract", id: "c1" },
      },
      () => undefined,
      PORTFOLIO,
      "SkyHarbor Global",
      () => undefined,
    );
    const built = buildViewModel(vm) as {
      tabs: Array<{ label: string }>;
      cOverview: boolean;
      cRelationship: boolean;
    };

    expect(built.tabs.map((tab) => tab.label)).toEqual([
      "Story",
      "Scope",
      "Economics",
      "Performance",
      "Relationship",
      "Evidence",
      "Optimize",
    ]);
    expect(built.cOverview).toBe(true);
    expect(built.cRelationship).toBe(false);
  });

  it("uses real vendor names in the explorer instead of category buckets", () => {
    const vm = buildVm();
    const built = buildViewModel(vm) as {
      tree: Array<{ id: string; label: string }>;
    };

    expect(built.tree.some((node) => node.id === "exec.Context")).toBe(false);
    expect(built.tree.some((node) => node.id === "exec.Agenda")).toBe(false);
    expect(built.tree.some((node) => node.id === "opps")).toBe(false);
    expect(built.tree).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: "vv.vendor-one", label: "Vendor One" }),
        expect.objectContaining({ id: "vv.vendor-two", label: "Vendor Two" }),
        expect.objectContaining({
          id: "vv.vendor-three",
          label: "Vendor Three",
        }),
      ]),
    );
  });

  it("keeps Vendor 360 contract counts aligned to the visible material-contract table", () => {
    const salesforceContracts = [
      contractRow({
        contract_id: "CTR-090",
        vendor_ref: "salesforce",
        vendor_name: "Salesforce",
        contract_name: "Salesforce Data Platform Agreement 3",
        annual_value: "43500000.00" as unknown as number,
      }),
      contractRow({
        contract_id: "CTR-088",
        vendor_ref: "salesforce",
        vendor_name: "Salesforce",
        contract_name: "Salesforce AMS Agreement 1",
        annual_value: "35600000.00" as unknown as number,
      }),
      contractRow({
        contract_id: "CTR-089",
        vendor_ref: "salesforce",
        vendor_name: "Salesforce",
        contract_name: "Salesforce Implementation Services Agreement 2",
        annual_value: "30300000.00" as unknown as number,
      }),
      contractRow({
        contract_id: "CTR-091",
        vendor_ref: "salesforce",
        vendor_name: "Salesforce",
        contract_name: "Salesforce Cybersecurity Agreement 4",
        annual_value: "24600000.00" as unknown as number,
      }),
    ];
    const vm = new WorkspaceViewModel(
      {
        ...INITIAL_STATE,
        sel: { kind: "vendor", id: "salesforce" },
      },
      () => undefined,
      {
        ...PORTFOLIO,
        contracts: salesforceContracts,
        vendors: [
          vendorRow({
            vendor_ref: "salesforce",
            vendor_name: "Salesforce",
            vendor_category: "SaaS",
            // The rollup can represent families; the Vendor 360 headline must
            // not use it as the visible contract-row count.
            contract_count: 2,
            annual_value: "133900000.00" as unknown as number,
          }),
        ],
        categoryQuality: evaluateContractCategoryQuality(salesforceContracts),
      },
      "SkyHarbor Global",
      () => undefined,
    );
    const built = buildViewModel(vm) as {
      thesis: string;
      vendorStats: Array<{ label: string; value: string }>;
      valueStrip: Array<{ label: string; sub: string }>;
      vendorContractRows: unknown[];
    };

    expect(built.vendorContractRows).toHaveLength(4);
    expect(built.thesis).toContain("across 4 material contracts shown");
    expect(built.thesis).not.toContain("across 2 governed contracts");
    expect(built.vendorStats).toEqual(
      expect.arrayContaining([
        { label: "Material contracts shown", value: "4" },
        { label: "Rollup contract families", value: "2" },
      ]),
    );
    expect(
      built.valueStrip.find((item) => item.label === "Annual contract value")
        ?.sub,
    ).toBe("4 material contracts shown");
  });

  it("sums the leverage quadrant panel without string-concatenation", () => {
    const vm = buildVm();
    const built = buildViewModel(vm) as {
      quadPanel: Array<{ value: string }>;
      leverageRowsTitle: string;
      leverageRows: Array<{ cells: Array<{ text: unknown }> }>;
    };
    for (const q of built.quadPanel) {
      assertPlausibleMoney(q.value, q.value);
    }
    expect(built.leverageRowsTitle).toBe(
      "Two-or-more weak leverage signals — contract register",
    );
    expect(built.leverageRows).toHaveLength(3);
    expect(built.leverageRows[0]?.cells.map((cell) => cell.text)).toEqual(
      expect.arrayContaining(["Vendor One", "c1", "$50.0M", "2 of 4"]),
    );
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
            vendor_ref: "vendor-one",
            vendor_name: "Vendor One",
            // Live-found bug (2026-08-04): a malformed/unresolved confidence
            // value from the data plane reached pct() as a non-numeric
            // string, and (v * 100).toFixed(1) rendered the literal text
            // "NaN%" on the Contract 360 header strip and Optimize tab.
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

  it("exposes Source v4 proof cards with governed period and exposure labels", () => {
    const vm = buildVm();
    const built = buildViewModel(vm) as {
      title: string;
      thesis: string;
      sourceV4ProofCards: Array<{ label: string; value: string; note: string }>;
      valueStrip: Array<{ label: string; value: string; sub: string }>;
    };

    expect(built.thesis).toContain("2,600 explicit scope links");
    expect(built.sourceV4ProofCards).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          label: "Contract families",
          value: "100",
        }),
        expect.objectContaining({
          label: "Scope relationships",
          value: "5,200",
          note: "2,600 explicit · 2,600 inferred",
        }),
        expect.objectContaining({
          label: "Invoice lines",
          value: "175,000",
          note: expect.stringContaining("24-month actual spend"),
        }),
        expect.objectContaining({
          label: "Off-contract exposure",
          value: "$25.7M",
          note: "Exposure, not savings",
        }),
      ]),
    );
    expect(built.valueStrip).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          label: "Actual spend — 24 months",
          value: "$2.4949B",
          sub: expect.stringContaining("not an annual variance"),
        }),
      ]),
    );
  });

  it("keeps Explore selected-only by default after a vendor selection", () => {
    const vm = new WorkspaceViewModel(
      {
        ...INITIAL_STATE,
        tabs: { ...INITIAL_STATE.tabs, portfolio: "Explore" },
        groupBy: "vendor",
        slice: { vendor: ["Vendor One"] },
      },
      () => undefined,
      PORTFOLIO,
      "Airline Demo",
      () => undefined,
    );
    const built = buildViewModel(vm) as {
      ex: {
        groups: Array<{ label: string }>;
        chartSubtitle: string;
        quality: { showBanner: boolean };
      };
    };

    expect(built.ex.groups.map((group) => group.label)).toEqual(["Vendor One"]);
    expect(built.ex.chartSubtitle).toContain("compare-all is off");
    expect(built.ex.quality.showBanner).toBe(false);
  });

  it("shows peer groups only when Explore compare-all mode is explicit", () => {
    const vm = new WorkspaceViewModel(
      {
        ...INITIAL_STATE,
        tabs: { ...INITIAL_STATE.tabs, portfolio: "Explore" },
        groupBy: "vendor",
        compareExcluded: true,
        slice: { vendor: ["Vendor One"] },
      },
      () => undefined,
      PORTFOLIO,
      "Airline Demo",
      () => undefined,
    );
    const built = buildViewModel(vm) as {
      ex: { groups: Array<{ label: string; share: string }> };
    };

    expect(built.ex.groups.map((group) => group.label)).toEqual([
      "Vendor One",
      "Vendor Three",
      "Vendor Two",
    ]);
    expect(
      built.ex.groups.find((group) => group.label === "Vendor Two")?.share,
    ).toBe("excluded");
  });

  it("marks category-dependent Explore conclusions as withheld", () => {
    const vm = new WorkspaceViewModel(
      {
        ...INITIAL_STATE,
        tabs: { ...INITIAL_STATE.tabs, portfolio: "Explore" },
        groupBy: "category",
      },
      () => undefined,
      PORTFOLIO,
      "Airline Demo",
      () => undefined,
    );
    const built = buildViewModel(vm) as {
      ex: {
        quality: { state: string; message: string; showBanner: boolean };
        groups: Array<{ label: string; taxonomy: { flagged: boolean } }>;
      };
    };

    expect(built.ex.quality.state).toBe("blocked");
    expect(built.ex.quality.showBanner).toBe(true);
    expect(built.ex.quality.message).toMatch(/withheld pending review/i);
    expect(built.ex.groups[0]?.label).toBe("Needs classification");
    expect(built.ex.groups[0]?.taxonomy.flagged).toBe(true);
  });
});
