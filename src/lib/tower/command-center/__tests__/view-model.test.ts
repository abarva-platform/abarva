// Unit tests for the mart → design-shape mapper.
//
// The contract under test: every string and number originates in the mart, an
// absent value becomes `null` / an `unknownSlots` entry rather than a zero, and
// a tenant with no mart rows yields `null` so the page can render its honest
// empty state.

import type {
  TowerMartAiPortfolioItem,
  TowerMartCommandCenter,
  TowerMartCommandViewModel,
  TowerMartProgramLane,
  TowerMartValueTrajectoryPoint,
} from "@/lib/tower/current-layer-view-model";

import {
  aiDisplayBucketFor,
  aiKindFor,
  buildTowerCommandCenterView,
  postureFor,
  TOWER_AI_DISPLAY_BUCKET_POLICY_VERSION,
  vendorConcentrationPct,
} from "../view-model";

const M = 1_000_000;

function command(
  overrides: Partial<TowerMartCommandCenter> = {},
): TowerMartCommandCenter {
  return {
    commandCenterKey: "tenant::cc",
    tenantKey: "demo-tenant",
    tenantName: "Demo Tenant",
    martVersion: "v1",
    sourceStandard: "standard-2026-07",
    formulaVersion: "f1",
    totalItBudgetFy26: 650 * M,
    runBudgetFy26: 442 * M,
    changeBudgetFy26: 208 * M,
    approvedProgramBudgetFy26: 600 * M,
    aiTaggedSpendFy26NonAdditive: 53.7 * M,
    promisedValueFy26: 35.5 * M,
    partialFinanceValidatedValueYtd: 3.8 * M,
    realizedValueYtdAllowed: 0,
    valueClaimCount: 6,
    knownValueClaimCount: 4,
    unknownValueClaimCount: 2,
    knownZeroValueClaimCount: 1,
    knownValueAmountUsd: 35.5 * M,
    financeAttestedClaimCount: 0,
    businessAttestedClaimCount: 0,
    candidateAiOpportunities: 5,
    watchPressureSignals: 2,
    runRatio: 0.68,
    changeRatio: 0.32,
    financeValidationRatio: 0.107,
    decisionQuestion: "Can any of the promised value be booked this quarter?",
    executiveSummary: "Value proof, not spend visibility, is the constraint.",
    sourceFiles: ["08_it_budget_spend_value.csv"],
    ...overrides,
  };
}

function lane(
  overrides: Partial<TowerMartProgramLane> = {},
): TowerMartProgramLane {
  return {
    laneKey: "tenant::lane::p1",
    programCode: "P1",
    programName: "Program One",
    ownerRole: "CIO",
    financeOwnerRole: "CFO",
    decisionLane: "fix",
    decisionRationale: "Adoption is thin",
    approvedFundingUsd: 16 * M,
    aiTaggedSpendUsd: 3.8 * M,
    promisedValueUsd: 6.8 * M,
    financeValidatedValueUsd: 0.2 * M,
    usageMetric: "active_seats",
    usageActual: 1840,
    adoptionRatePct: 44,
    valueClaimStatus: "blocked",
    towerClaimAllowed: "partial",
    requiredGates: [{ ask: "File the DLP policy" }],
    caveat: "Benefit is asserted per-seat.",
    sourceFile: "SA08_ai-benefits.csv",
    sourceRow: "row-3",
    ...overrides,
  };
}

function aiItem(
  overrides: Partial<TowerMartAiPortfolioItem> = {},
): TowerMartAiPortfolioItem {
  return {
    aiPortfolioKey: "tenant::ai::1",
    itemName: "Copilot",
    itemKind: "funded_program",
    adoptionTargetPct: null,
    linkedBusinessCaseCount: null,
    vendorName: "Microsoft",
    systemName: "M365",
    aiSpendType: "funded",
    aiSpendCategory: "copilot",
    fundingStatus: "approved",
    decisionLane: "fix",
    approvedFundingUsd: 16 * M,
    aiTaggedSpendUsd: 3.8 * M,
    promisedValueUsd: 6.8 * M,
    financeValidatedValueUsd: 0.2 * M,
    usageMetric: "active_seats",
    usageActual: 1840,
    adoptionRatePct: 44,
    valueScore: 64,
    readinessScore: 40,
    riskScore: 30,
    duplicateRisk: null,
    valueClaimStatus: "blocked",
    towerClaimAllowed: "partial",
    caveat: "Adoption uneven.",
    sourceFile: "10_ai-use-cases.csv",
    sourceRow: "row-1",
    ...overrides,
  };
}

function valueTrajectory(
  overrides: Partial<TowerMartValueTrajectoryPoint> = {},
): TowerMartValueTrajectoryPoint {
  return {
    tenantKey: "demo-tenant",
    valueCaseId: "vc-1",
    programId: "P1",
    initiativeId: "P1",
    valueCaseName: "Program One value case",
    valueArchetype: "capacity",
    periodStart: "2026-01-01",
    periodEnd: "2026-03-31",
    fiscalQuarter: "2026-Q1",
    scenario: "forecast",
    plannedInvestmentUsd: 2 * M,
    actualSpendUsd: 1 * M,
    remainingCommitmentUsd: 1 * M,
    businessCaseValueUsd: 3 * M,
    businessCaseBenefitUsd: 3 * M,
    riskAdjustedForecastUsd: null,
    financeValidatedRunRateUsd: 0.2 * M,
    realizedPAndLUsd: null,
    realizedCashUsd: null,
    forecastAtCompletionUsd: 6.8 * M,
    financialConversionUsd: null,
    usageEvidenceState: "present",
    operationalOutcomeEvidenceState: "missing",
    financeAttestationState: "missing",
    sourceTrustState: "ONE_SOURCE",
    claimState: "evidence_gap",
    datasetVersion: "fixture",
    sourceRunId: "fixture-run",
    sourceRefs: [{ view: "consumption.tower_value_trajectory_v1" }],
    economicClassification: "capacity",
    boardScopeState: "board_portfolio",
    materialScopeState: "material",
    sourceCount: 1,
    ...overrides,
  };
}

function mart(
  overrides: Partial<TowerMartCommandViewModel> = {},
): TowerMartCommandViewModel {
  return {
    generatedFrom: "tower_schema",
    headline: "Tower",
    command: command(),
    valueFunnel: [
      {
        funnelKey: "f1",
        sequence: 1,
        stageKey: "promised_value",
        stageLabel: "Promised value",
        valueNumeric: 35.5 * M,
        denominatorStageKey: null,
        conversionRatio: null,
        claimStatus: "promised",
        caveat: "Business-case value.",
        sourceFile: null,
        sourceRow: null,
      },
    ],
    valueTrajectory: [valueTrajectory()],
    programLanes: [lane()],
    aiPortfolio: [aiItem()],
    cxoActions: [
      {
        actionKey: "a1",
        sequence: 1,
        actionLane: "fix",
        title: "Clear the DLP review",
        actionBody: "Paid seats are idle behind a policy review.",
        ownerHint: "CIO",
        moduleHandoff: "Strategic Moves",
      },
    ],
    evidenceLineage: [
      {
        lineageKey: "e1",
        surfaceSection: "value_funnel",
        displayedFact: "Promised value FY26",
        displayedValueText: "$35.5M",
        displayedValueNumeric: 35.5 * M,
        sourceFile: "08_it_budget.csv",
        sourceRow: "row-9",
        sourceSystem: "finance",
        caveat: "",
      },
    ],
    requiredFieldGaps: [
      {
        gapKey: "g1",
        martTable: "mart_program_decision_lanes",
        martRecordKey: "tenant::lane::p1",
        requiredField: "finance_validated_value_usd",
        sourceTemplate: "SA08_AI_Benefits.csv",
        sourceRecordId: "r1",
        severity: "high",
        ownerHint: "CFO",
        remediationAction: "Finance must sign the measurement method.",
        blocking: true,
      },
    ],
    ...overrides,
  };
}

describe("buildTowerCommandCenterView", () => {
  it("returns null for a tenant with no mart view — the page then shows its empty state", () => {
    expect(
      buildTowerCommandCenterView(null, { tenantName: "Demo" }),
    ).toBeNull();
  });

  it("handles an empty mart (rows present, all collections empty) without inventing numbers", () => {
    const view = buildTowerCommandCenterView(
      mart({
        command: command({
          totalItBudgetFy26: 0,
          promisedValueFy26: 0,
          partialFinanceValidatedValueYtd: 0,
          realizedValueYtdAllowed: 0,
          aiTaggedSpendFy26NonAdditive: 0,
          candidateAiOpportunities: 0,
        }),
        programLanes: [],
        aiPortfolio: [],
        cxoActions: [],
        evidenceLineage: [],
        requiredFieldGaps: [],
        valueFunnel: [],
        valueTrajectory: [],
      }),
      { tenantName: "Demo" },
    );

    expect(view).not.toBeNull();
    expect(view!.programs).toHaveLength(0);
    expect(view!.summary.usageSupportedUsd).toBe(0);
    expect(view!.summary.blockedUsd).toBe(0);
    expect(view!.summary.vendorConcentrationPct).toBeNull();
    // Every absent slot is declared rather than quietly filled.
    expect(view!.unknownSlots).toEqual(
      expect.arrayContaining([
        "Top-3 vendor concentration",
        "Evidence lineage rows",
        "Value funnel stages",
        "Eight-quarter value trajectory",
      ]),
    );
  });

  it("aggregates the governed eight-quarter trajectory without filling missing conversion dollars", () => {
    const view = buildTowerCommandCenterView(
      mart({
        valueTrajectory: [
          valueTrajectory({
            fiscalQuarter: "2026-Q1",
            periodStart: "2026-01-01",
            periodEnd: "2026-03-31",
            plannedInvestmentUsd: 2 * M,
            actualSpendUsd: 1 * M,
            financialConversionUsd: null,
          }),
          valueTrajectory({
            valueCaseId: "vc-2",
            fiscalQuarter: "2026-Q1",
            periodStart: "2026-01-01",
            periodEnd: "2026-03-31",
            plannedInvestmentUsd: 4 * M,
            actualSpendUsd: null,
            financialConversionUsd: null,
          }),
        ],
      }),
      { tenantName: "Demo" },
    );

    expect(view?.valueTrajectory).toHaveLength(1);
    expect(view?.valueTrajectory[0]?.plannedInvestmentUsd).toBe(6 * M);
    expect(view?.valueTrajectory[0]?.actualSpendUsd).toBe(1 * M);
    expect(view?.valueTrajectory[0]?.financialConversionUsd).toBeNull();
    expect(
      view?.conversionBridge.find(
        (stage) => stage.key === "economic_conversion",
      )?.valueUsd,
    ).toBeNull();
  });

  it("reads headline totals straight from the mart, not from a re-aggregation", () => {
    const view = buildTowerCommandCenterView(mart(), { tenantName: "Demo" })!;
    expect(view.summary.budgetUsd).toBe(650 * M);
    expect(view.summary.aiTaggedUsd).toBe(53.7 * M);
    expect(view.summary.promisedUsd).toBe(35.5 * M);
    expect(view.summary.financeValidatedUsd).toBe(3.8 * M);
    expect(view.summary.claimableUsd).toBe(0);
    expect(view.summary.unknownValueClaimCount).toBe(2);
  });

  it("derives blocked value as promised minus claimable", () => {
    const view = buildTowerCommandCenterView(mart(), { tenantName: "Demo" })!;
    expect(view.summary.blockedUsd).toBe(35.5 * M);
  });

  it("sums usage-supported value across programs rather than reading a mart column", () => {
    const view = buildTowerCommandCenterView(mart(), { tenantName: "Demo" })!;
    // 6.8M × 0.44 = 2.992M — adoption-credited only, with no finance floor.
    expect(view.summary.usageSupportedUsd).toBeCloseTo(2.992 * M, 0);
  });

  it("prefers the caller-supplied tenant name over the mart label", () => {
    const view = buildTowerCommandCenterView(mart(), {
      tenantName: "Cover Name",
    })!;
    expect(view.summary.tenantName).toBe("Cover Name");
  });

  it("maps a program lane through the derivations and keeps its provenance", () => {
    const view = buildTowerCommandCenterView(mart(), { tenantName: "Demo" })!;
    const [p] = view.programs;
    expect(p.id).toBe("P1");
    expect(p.lane).toBe("fix");
    expect(p.proofLevel).toBe(2);
    expect(p.proofSequenceStatus).toBe("ordered");
    expect(p.semanticSource).toBe("derived_compatibility");
    expect(p.usageStatus).toBe("weak");
    expect(p.nextGate).toBe("File the DLP policy");
    expect(p.blocker).toBe("Adoption is thin");
    expect(p.sourceFile).toBe("SA08_ai-benefits.csv");
  });

  it("reports no next gate rather than inventing one when the mart records none", () => {
    const view = buildTowerCommandCenterView(
      mart({ programLanes: [lane({ requiredGates: [] })] }),
      { tenantName: "Demo" },
    )!;
    expect(view.programs[0].nextGate).toBeNull();
  });

  it("splits candidates out of the funded AI portfolio", () => {
    const view = buildTowerCommandCenterView(
      mart({
        aiPortfolio: [
          aiItem(),
          aiItem({
            aiPortfolioKey: "tenant::ai::2",
            itemName: "Branch Vision",
            itemKind: "candidate_opportunity",
            aiSpendType: "candidate",
            fundingStatus: "not_funded",
            aiTaggedSpendUsd: 0,
          }),
        ],
      }),
      { tenantName: "Demo" },
    )!;
    expect(view.ai.map((a) => a.name)).toEqual(["Copilot"]);
    expect(view.candidates.map((c) => c.name)).toEqual(["Branch Vision"]);
    expect(view.summary.aiInitiativeCount).toBe(1);
  });

  it("uses the governed AI initiative count instead of the display slice count", () => {
    const view = buildTowerCommandCenterView(
      mart({
        command: command({ aiInitiativeCount: 132 }),
        aiPortfolio: [aiItem()],
        aiPortfolioCounts: {
          total: 80,
          candidate: 0,
          active: 80,
          funded: 0,
          embeddedOrUsage: 80,
          attributedSpendUsd: 3.8 * M,
        },
      }),
      { tenantName: "Demo" },
    )!;

    expect(view.ai).toHaveLength(1);
    expect(view.summary.aiInitiativeCount).toBe(132);
  });

  it("keeps candidate pool integrity for the real candidate_opportunity enum", () => {
    const view = buildTowerCommandCenterView(
      mart({
        command: command({ candidateAiOpportunities: 2 }),
        aiPortfolio: [
          aiItem({
            aiPortfolioKey: "tenant::ai::candidate-1",
            itemName: "Branch Vision",
            itemKind: "candidate_opportunity",
            aiSpendCategory: null,
            aiSpendType: null,
            fundingStatus: "not_funded",
            aiTaggedSpendUsd: 0,
          }),
          aiItem({
            aiPortfolioKey: "tenant::ai::candidate-2",
            itemName: "Commercial Credit Memo AI",
            itemKind: "candidate_opportunity",
            aiSpendCategory: null,
            aiSpendType: null,
            fundingStatus: "not_funded",
            aiTaggedSpendUsd: 0,
          }),
        ],
      }),
      { tenantName: "Demo" },
    )!;
    expect(view.ai).toHaveLength(0);
    expect(view.candidates.map((c) => c.name)).toEqual([
      "Branch Vision",
      "Commercial Credit Memo AI",
    ]);
    expect(view.candidates).toHaveLength(view.summary.candidateAiCount);
  });

  it("caps displayed candidates while preserving the total candidate count", () => {
    const manyCandidates = Array.from({ length: 24 }, (_, i) =>
      aiItem({
        aiPortfolioKey: `tenant::ai::candidate-${i + 1}`,
        itemName: `Candidate ${String(i + 1).padStart(2, "0")}`,
        itemKind: "candidate_opportunity",
        aiSpendCategory: null,
        aiSpendType: null,
        fundingStatus: "not_funded",
        aiTaggedSpendUsd: 0,
        valueScore: 24 - i,
        readinessScore: i,
      }),
    );
    const view = buildTowerCommandCenterView(
      mart({
        command: command({ candidateAiOpportunities: 242 }),
        aiPortfolio: [aiItem(), ...manyCandidates],
        aiPortfolioCounts: {
          total: 243,
          candidate: 242,
          active: 1,
          funded: 1,
          embeddedOrUsage: 0,
          attributedSpendUsd: 3.8 * M,
        },
      }),
      { tenantName: "Demo" },
    )!;
    expect(view.summary.candidateAiCount).toBe(242);
    expect(view.candidates).toHaveLength(10);
    expect(view.portfolioCounts.displayCandidateCount).toBe(10);
    expect(view.portfolioCounts.totalCandidateCount).toBe(242);
    expect(view.portfolioCounts.martItemCount).toBe(243);
    expect(view.portfolioCounts.excludedItemCount).toBe(218);
    expect(view.portfolioCounts.exclusionReasons).toEqual(
      expect.arrayContaining([expect.stringContaining("10 of 242")]),
    );
  });

  it("retains original usage_benefit semantics while grouping it visually as embedded", () => {
    const view = buildTowerCommandCenterView(
      mart({
        aiPortfolio: [
          aiItem({
            itemKind: "usage_benefit",
            aiSpendCategory: "workflow_ai",
            aiSpendType: null,
          }),
        ],
      }),
      { tenantName: "Demo" },
    )!;
    expect(view.ai[0].originalItemKind).toBe("usage_benefit");
    expect(view.ai[0].displayBucket).toBe("embedded");
    expect(view.ai[0].kind).toBe("embedded");
    expect(view.ai[0].displayBucketBasis).toBe("item_kind");
  });

  it("sorts the spend lens by value and colours each bar by its dominant kind", () => {
    const view = buildTowerCommandCenterView(
      mart({
        aiPortfolio: [
          aiItem({ aiSpendCategory: "copilot", aiTaggedSpendUsd: 4 * M }),
          aiItem({
            aiPortfolioKey: "x2",
            aiSpendCategory: "cloud_ai",
            aiSpendType: "platform",
            itemKind: "embedded_platform",
            aiTaggedSpendUsd: 14 * M,
          }),
        ],
      }),
      { tenantName: "Demo" },
    )!;
    expect(view.spendLens.map((r) => r.category)).toEqual([
      "Cloud ai",
      "Copilot",
    ]);
    expect(view.spendLens[0].kind).toBe("embedded");
  });

  it("keeps data-pipeline gaps off the executive Evidence tab", () => {
    const view = buildTowerCommandCenterView(mart(), { tenantName: "Demo" })!;
    // Pipeline field gaps are an ETL backlog ("populate this field and rerun
    // the projection"), so they land in pipelineGaps, never in gaps.
    const [pipeline] = view.pipelineGaps;
    expect(pipeline.kind).toBe("pipeline");
    expect(pipeline.linkedProgram).toBe("Program One");
    expect(pipeline.why).toBe("Finance must sign the measurement method.");
    expect(view.gaps.every((g) => g.kind !== "pipeline")).toBe(true);
  });

  it("derives a business evidence gap from the first unmet step of the claim chain", () => {
    // The fixture program has usage evidence (44% adoption) and $0.2M finance
    // validated, so usage and finance both clear; the claim gate does not.
    const view = buildTowerCommandCenterView(mart(), { tenantName: "Demo" })!;
    expect(view.gaps).toHaveLength(1);
    const [gap] = view.gaps;
    expect(gap.kind).toBe("claim_gate");
    expect(gap.primaryBlockingGap).toBe(true);
    expect(gap.linkedProgram).toBe("Program One");
    expect(gap.valueAtStakeUsd).toBe(0.2 * M);
    expect(gap.promisedValueExposedUsd).toBe(6.8 * M);
    expect(gap.validatedValueHeldUsd).toBe(0.2 * M);
    expect(gap.owner).toBe("CFO");
  });

  it("raises a usage gap first when a program has no usage evidence at all", () => {
    const view = buildTowerCommandCenterView(
      mart({
        programLanes: [
          lane({ usageMetric: null, usageActual: null, adoptionRatePct: null }),
        ],
      }),
      { tenantName: "Demo" },
    )!;
    expect(view.gaps.map((g) => g.kind)).toEqual(["usage", "claim_gate"]);
    expect(view.gaps.map((g) => g.primaryBlockingGap)).toEqual([true, false]);
    expect(view.gaps[0].owner).toBe("CIO");
  });

  it("raises a finance gap and preserves the claim-gate gap when usage exists but nothing is validated", () => {
    const view = buildTowerCommandCenterView(
      mart({ programLanes: [lane({ financeValidatedValueUsd: 0 })] }),
      { tenantName: "Demo" },
    )!;
    expect(view.gaps.map((g) => g.kind)).toEqual(["finance", "claim_gate"]);
    expect(view.gaps.map((g) => g.primaryBlockingGap)).toEqual([true, false]);
  });

  it("raises an unknown-value evidence gap for a claim with no promised amount", () => {
    const view = buildTowerCommandCenterView(
      mart({ programLanes: [lane({ promisedValueUsd: 0 })] }),
      { tenantName: "Demo" },
    )!;
    expect(view.gaps).toHaveLength(1);
    expect(view.gaps[0]).toMatchObject({
      kind: "claim_gate",
      missing:
        "Governed financial amount and baseline/target/actual proof for Program One",
      valueAtStakeUsd: null,
    });
  });

  it("still produces evidence gaps when the pipeline gap table is EMPTY", () => {
    // The whole point of the rewiring: healthy data (no required-field gaps)
    // must not yield an empty Evidence tab.
    const view = buildTowerCommandCenterView(mart({ requiredFieldGaps: [] }), {
      tenantName: "Demo",
    })!;
    expect(view.pipelineGaps).toHaveLength(0);
    expect(view.gaps.length).toBeGreaterThan(0);
  });

  it("flags the absent action due window instead of printing a plausible date", () => {
    const view = buildTowerCommandCenterView(mart(), { tenantName: "Demo" })!;
    expect(view.actions[0].due).toBeNull();
    expect(view.unknownSlots).toEqual(
      expect.arrayContaining([expect.stringContaining("Action due windows")]),
    );
  });

  it("flags AI spend as unattributed when the portfolio carries none but the total is non-zero", () => {
    // The live Healthcare Composite Demo state: $53.7M AI-tagged at the command
    // centre, $0 on every one of the portfolio rows.
    const view = buildTowerCommandCenterView(
      mart({ aiPortfolio: [aiItem({ aiTaggedSpendUsd: 0 })] }),
      { tenantName: "Demo" },
    )!;
    expect(view.summary.aiSpendUnattributed).toBe(true);
    expect(view.summary.aiSpendAttributionStatus).toBe("portfolio_only");
    expect(view.summary.aiUnallocatedSpendUsd).toBe(53.7 * M);
    expect(view.unknownSlots).toEqual(
      expect.arrayContaining([expect.stringContaining("AI spend attribution")]),
    );
  });

  it("does not flag unattributed spend when the portfolio carries spend", () => {
    const view = buildTowerCommandCenterView(mart(), { tenantName: "Demo" })!;
    expect(view.summary.aiSpendUnattributed).toBe(false);
  });

  it("does not flag unattributed spend when the tenant has no AI spend at all", () => {
    const view = buildTowerCommandCenterView(
      mart({
        command: command({ aiTaggedSpendFy26NonAdditive: 0 }),
        aiPortfolio: [aiItem({ aiTaggedSpendUsd: 0 })],
      }),
      { tenantName: "Demo" },
    )!;
    expect(view.summary.aiSpendUnattributed).toBe(false);
  });
});

describe("aiKindFor", () => {
  // The four values of MartAiPortfolioItemKind, matched exactly. Regressing any
  // of these silently recolours the whole AI portfolio.
  it.each([
    ["funded_program", "funded"],
    ["embedded_platform", "embedded"],
    ["usage_benefit", "embedded"],
    ["candidate_opportunity", "candidate"],
  ])("maps the mart enum %s to %s", (itemKind, expected) => {
    expect(
      aiKindFor({ itemKind, aiSpendType: null, fundingStatus: null }),
    ).toBe(expected);
  });

  it("does not lose candidate_opportunity to the snake_case word-boundary trap", () => {
    // \bcandidate\b does NOT match "candidate_opportunity" — `_` is a word
    // character. This previously filed every candidate as "platform" and left
    // the candidate pool empty.
    expect(
      aiKindFor({
        itemKind: "candidate_opportunity",
        aiSpendType: null,
        fundingStatus: null,
      }),
    ).toBe("candidate");
  });

  it.each([
    [
      { itemKind: "idea", aiSpendType: null, fundingStatus: "not_funded" },
      "candidate",
    ],
    [
      { itemKind: "control", aiSpendType: "governance", fundingStatus: null },
      "governance",
    ],
    [
      { itemKind: "cloud", aiSpendType: "platform", fundingStatus: null },
      "platform",
    ],
    [
      { itemKind: "initiative", aiSpendType: null, fundingStatus: "approved" },
      "funded",
    ],
  ])(
    "falls back on keywords for values outside the enum: %j → %s",
    (item, expected) => {
      expect(aiKindFor(item as Parameters<typeof aiKindFor>[0])).toBe(expected);
    },
  );

  it("falls back to platform rather than dropping an unrecognised item", () => {
    expect(
      aiKindFor({ itemKind: "zzz", aiSpendType: null, fundingStatus: null }),
    ).toBe("platform");
  });
});

describe("aiDisplayBucketFor", () => {
  it("records the basis and policy version for exact enum mappings", () => {
    expect(
      aiDisplayBucketFor({
        itemKind: "usage_benefit",
        aiSpendType: null,
        fundingStatus: null,
        aiSpendCategory: null,
      }),
    ).toEqual({
      displayBucket: "embedded",
      displayBucketBasis: "item_kind",
      mappingPolicyVersion: TOWER_AI_DISPLAY_BUCKET_POLICY_VERSION,
      originalItemKind: "usage_benefit",
    });
  });

  it("lets governance category outrank item kind without overwriting original kind", () => {
    expect(
      aiDisplayBucketFor({
        itemKind: "embedded_platform",
        aiSpendType: null,
        fundingStatus: null,
        aiSpendCategory: "governance",
      }),
    ).toEqual({
      displayBucket: "governance",
      displayBucketBasis: "ai_spend_category",
      mappingPolicyVersion: TOWER_AI_DISPLAY_BUCKET_POLICY_VERSION,
      originalItemKind: "embedded_platform",
    });
  });
});

describe("postureFor", () => {
  it("labels the four quadrants of value × readiness", () => {
    const base = { towerClaimAllowed: "partial" };
    expect(postureFor({ ...base, valueScore: 92, readinessScore: 80 })).toBe(
      "Scale",
    );
    expect(postureFor({ ...base, valueScore: 64, readinessScore: 40 })).toBe(
      "Fix readiness",
    );
    expect(postureFor({ ...base, valueScore: 34, readinessScore: 52 })).toBe(
      "Measure",
    );
    expect(postureFor({ ...base, valueScore: 20, readinessScore: 20 })).toBe(
      "Restructure",
    );
  });
});

describe("vendorConcentrationPct", () => {
  it("is the top-three vendors’ share of AI-tagged spend", () => {
    const items = [
      aiItem({
        aiPortfolioKey: "1",
        vendorName: "A",
        aiTaggedSpendUsd: 40 * M,
      }),
      aiItem({
        aiPortfolioKey: "2",
        vendorName: "B",
        aiTaggedSpendUsd: 30 * M,
      }),
      aiItem({
        aiPortfolioKey: "3",
        vendorName: "C",
        aiTaggedSpendUsd: 20 * M,
      }),
      aiItem({
        aiPortfolioKey: "4",
        vendorName: "D",
        aiTaggedSpendUsd: 10 * M,
      }),
    ];
    expect(vendorConcentrationPct(items)).toBe(90);
  });

  it("is null when no item carries a vendor — the tile then shows an unknown", () => {
    expect(
      vendorConcentrationPct([
        aiItem({ vendorName: null, aiTaggedSpendUsd: 5 * M }),
      ]),
    ).toBeNull();
  });

  it("is null when there is no AI spend at all", () => {
    expect(
      vendorConcentrationPct([aiItem({ aiTaggedSpendUsd: 0 })]),
    ).toBeNull();
  });
});
