import { answerCurrentTowerQuestion } from "@/lib/tower/current-layer-answer";
import { readTowerCommandCenter } from "@/lib/tower/readTowerCommandCenter";

jest.mock("@/lib/tower/readTowerCommandCenter", () => ({
  readTowerCommandCenter: jest.fn(),
}));

const mockReadTowerCommandCenter = jest.mocked(readTowerCommandCenter);

function aiItem(overrides: Record<string, unknown> = {}) {
  return {
    aiPortfolioKey: "ai-1",
    itemName: "Prior authorization agent",
    itemKind: "funded",
    vendorName: "Internal build",
    systemName: null,
    aiSpendType: "funded",
    aiSpendCategory: "Clinical operations",
    fundingStatus: "approved",
    decisionLane: "fix",
    approvedFundingUsd: 10_000_000,
    aiTaggedSpendUsd: 10_000_000,
    aiSpendLoaded: true,
    aiAmountBasis: "approved_funding",
    promisedValueUsd: 32_000_000,
    financeValidatedValueUsd: 0,
    usageMetric: "users",
    usageActual: 320,
    adoptionRatePct: 42,
    adoptionTargetPct: 55,
    linkedBusinessCaseCount: 3,
    valueScore: 82,
    readinessScore: 61,
    riskScore: null,
    financeStatus: "sponsor_claimed",
    gatingConstraint: "workflow telemetry",
    confidenceLevel: "medium",
    businessValueType: "Reduce cost",
    costToBuildLowUsd: 8_000_000,
    costToBuildHighUsd: 12_000_000,
    controlBlocker: "workflow telemetry",
    controlBlockerReviewed: true,
    sponsorRole: "Operations leader",
    duplicateRisk: null,
    valueClaimStatus: "usage_supported",
    towerClaimAllowed: "no",
    caveat: "Finance has not attested the value.",
    sourceFile: "21_it_project_portfolio.csv",
    sourceRow: "row-1",
    ...overrides,
  };
}

function towerView(overrides: Record<string, unknown> = {}) {
  return {
    generatedFrom: "ecl_serving",
    headline: "Tower current layer",
    command: {
      commandCenterKey: "command-1",
      tenantKey: "selected-client",
      tenantName: "Selected Client",
      martVersion: "current",
      sourceStandard: "standard",
      formulaVersion: "v1",
      asOfPeriod: "2026-08-24",
      refreshTimestamp: null,
      totalItBudgetFy26: 1_000_000_000,
      runBudgetFy26: null,
      changeBudgetFy26: null,
      approvedProgramBudgetFy26: 211_800_000,
      aiTaggedSpendFy26NonAdditive: 211_800_000,
      promisedValueFy26: 677_800_000,
      partialFinanceValidatedValueYtd: 0,
      realizedValueYtdAllowed: 13_100_000,
      valueClaimCount: 42,
      candidateAiOpportunities: 0,
      watchPressureSignals: 0,
      runRatio: null,
      changeRatio: null,
      financeValidationRatio: null,
      decisionQuestion: "What must happen next?",
      executiveSummary: "Current Tower summary.",
      sourceFiles: ["21_it_project_portfolio.csv"],
    },
    valueFunnel: [
      {
        funnelKey: "stage-1",
        sequence: 1,
        stageKey: "promised",
        stageLabel: "Promised value",
        valueNumeric: 677_800_000,
        denominatorStageKey: null,
        conversionRatio: null,
        claimStatus: "planning",
        caveat: "Sponsor-stated value.",
        sourceFile: "21_it_project_portfolio.csv",
        sourceRow: "row-1",
      },
    ],
    programLanes: [],
    aiPortfolio: [
      aiItem(),
      aiItem({
        aiPortfolioKey: "tool-1",
        itemName: "Enterprise coding agents",
        vendorName: "Model providers",
        approvedFundingUsd: 0,
        aiTaggedSpendUsd: 2_000_000,
        aiAmountBasis: "annualized_tool_cost",
        promisedValueUsd: null,
        businessValueType: null,
        sourceFile: "23_ai_tool_rollout.csv",
        rolloutGoal: "engineering productivity",
        rolloutStage: "pilot",
        rolloutTargetUsers: 680,
        enabledUsers: 306,
        usageActual: 299,
        linkedBusinessCaseCount: 4,
        adoptionRatePct: 35,
        adoptionTargetPct: 60,
        controlBlocker: "SOX evidence",
        sourceSystem: "AI Portfolio and Business Case Tracker",
        sourceRecordId: "TOOL-ROW",
        sourceAsOfDate: "2026-08-24",
        refreshCadence: "monthly",
        sourceQualityState: "synthetic_review_ready",
      }),
      aiItem({
        aiPortfolioKey: "foundation-1",
        itemName: "Enterprise AI platform foundation",
        itemKind: "platform",
        aiSpendCategory: "Data & AI",
        approvedFundingUsd: 18_000_000,
        aiTaggedSpendUsd: 18_000_000,
        promisedValueUsd: null,
        sourceFile: "21_it_project_portfolio.csv",
      }),
    ],
    cxoActions: [],
    evidenceLineage: [],
    requiredFieldGaps: [
      {
        gapKey: "gap-1",
        martTable: "tower_ai_portfolio",
        martRecordKey: "ai-1",
        requiredField: "finance_attestation",
        sourceTemplate: "monthly_value_refresh",
        sourceRecordId: null,
        severity: "high",
        ownerHint: "Finance",
        remediationAction: "Capture monthly actuals and finance attestation.",
        blocking: true,
      },
    ],
    ...overrides,
  };
}

describe("answerCurrentTowerQuestion", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockReadTowerCommandCenter.mockResolvedValue(
      towerView() as Awaited<ReturnType<typeof readTowerCommandCenter>>,
    );
  });

  it("answers top-investment questions with sponsor ROI and a chart-ready visual contract", async () => {
    const result = await answerCurrentTowerQuestion({
      tenantId: "client-id",
      tenantKey: "selected-client",
      tenantKeyCandidates: ["route-client", "selected-client-id"],
      tenantName: "Selected Client",
      question: "Show me the top 10 AI investments and ROI",
    });

    expect(mockReadTowerCommandCenter).toHaveBeenCalledWith({
      tenantKeyCandidates: [
        "selected-client",
        "route-client",
        "selected-client-id",
        "Selected Client",
      ],
    });
    expect(result.modelOutput.answer).toContain("projected yearly benefit per $1 of approved funding");
    expect(result.modelOutput.tables?.[0]?.title).toBe(
      "AI Cases By Approved Funding And Projected Yearly Benefit",
    );
    expect(result.modelOutput.tables?.[0]?.columns).toContain("Projected yearly benefit per $1 of approved funding");
    expect(result.modelOutput.tables?.[0]?.columns).toContain("Yearly tool cost");
    expect(result.modelOutput.tables?.[0]?.rows.flat()).toContain("3.2x");
    expect(result.modelOutput.tables?.[0]?.rows.flat()).not.toContain("Enterprise coding agents");
    expect(result.modelOutput.visualContract?.recommendedVisual).toBeDefined();
  });

  it("calls an unsupported usage dollar stage not measured in the value answer", async () => {
    mockReadTowerCommandCenter.mockResolvedValue(
      towerView({
        valueFunnel: [{
          funnelKey: "usage-stage",
          sequence: 2,
          stageKey: "usage_supported",
          stageLabel: "Usage supported",
          valueNumeric: null,
          denominatorStageKey: "promised",
          conversionRatio: null,
          claimStatus: "gated",
          caveat: "No independently measured usage-supported amount is recorded.",
          sourceFile: null,
          sourceRow: null,
        }],
      }) as Awaited<ReturnType<typeof readTowerCommandCenter>>,
    );

    const result = await answerCurrentTowerQuestion({
      tenantId: "client-id",
      tenantKey: "selected-client",
      tenantName: "Selected Client",
      question: "What value is claimable?",
    });

    expect(result.modelOutput.tables?.[0]?.rows[0]?.[1]).toBe("Not measured");
  });

  it("uses page context to answer from the Tools tab even when the question is generic", async () => {
    const result = await answerCurrentTowerQuestion({
      tenantId: "client-id",
      tenantKey: "selected-client",
      tenantName: "Selected Client",
      question: "What should I look at here?",
      pageContext: {
        activeTab: "tools",
        activeTabLabel: "Tools",
        activeView: "rollouts",
        activeViewLabel: "Rollouts",
      },
    });

    expect(result.modelOutput.answer).toContain("Tools / Rollouts");
    expect(result.modelOutput.tables?.[0]?.title).toBe(
      "AI Tool Rollouts, Adoption Targets, And Blockers",
    );
    expect(result.modelOutput.tables?.[0]?.columns).toEqual([
      "Tool",
      "Vendor",
      "Goal",
      "Target users",
      "Enabled users",
      "Monthly active users",
      "Adoption",
      "Target",
      "Gap to target",
      "Control blocker",
      "Linked cases",
      "Source system",
      "As of",
    ]);
    expect(result.modelOutput.tables?.[0]?.rows.flat()).toEqual(
      expect.arrayContaining([
        "engineering productivity",
        "680",
        "306",
        "299 users",
        "AI Portfolio and Business Case Tracker",
        "2026-08-24",
      ]),
    );
  });

  it("answers selected-row drill-downs without treating missing values as zero", async () => {
    const result = await answerCurrentTowerQuestion({
      tenantId: "client-id",
      tenantKey: "selected-client",
      tenantName: "Selected Client",
      question: "Explain this selected row",
      pageContext: {
        selectedEntity: {
          kind: "ai",
          id: "tool-1",
          label: "Enterprise coding agents",
        },
      },
    });

    const cells = result.modelOutput.tables?.[0]?.rows.flat() ?? [];
    expect(result.modelOutput.tables?.[0]?.title).toContain(
      "Enterprise coding agents",
    );
    expect(cells).toContain("Sponsor's yearly value estimate");
    expect(cells).toContain("Not loaded");
    expect(cells).toContain("Approved funding");
    expect(cells).toContain("Yearly tool cost");
    expect(cells).toContain("Projected yearly benefit per $1 of approved funding");
    expect(cells).toContain("Rollout goal");
    expect(cells).toContain("engineering productivity");
    expect(cells).toContain("Enabled users");
    expect(cells).toContain("306");
    expect(cells).toContain("Source system");
    expect(cells).toContain("AI Portfolio and Business Case Tracker");
    expect(cells).toContain("Refresh cadence");
    expect(cells).toContain("monthly");
    expect(cells).not.toContain("$0");
    expect(result.modelOutput.answer).toContain("Review the selected item's loaded owner");
  });

  it("withholds budget and combined AI totals without source reconciliation", async () => {
    const result = await answerCurrentTowerQuestion({
      tenantId: "client-id",
      tenantKey: "selected-client",
      tenantName: "Selected Client",
      question: "Show the budget posture",
    });

    const rows = result.modelOutput.tables?.[0]?.rows ?? [];
    expect(rows.find((row) => row[0] === "Technology budget")?.[1]).toBe("Not verified");
    expect(rows.find((row) => row[0] === "Combined AI amount")?.[1]).toBe("Not comparable");
    expect(result.modelOutput.answer).toContain("cannot quote the budget");
    expect(result.modelOutput.answer).toContain("in loaded months as of 2026-08-24");
    expect(result.modelOutput.answer).not.toContain("AI-tagged spend");
    expect(result.metricCards?.map((card) => card.label)).not.toContain("Technology budget");
    expect(result.metricCards?.map((card) => card.label)).not.toContain("AI-tagged spend");
    expect(result.gaps).toContain("Reconcile budget fields to active intake before quoting them.");
  });

  it("keeps approved funding and yearly tool cost in separate answer columns", async () => {
    const result = await answerCurrentTowerQuestion({
      tenantId: "client-id",
      tenantKey: "selected-client",
      tenantName: "Selected Client",
      question: "Show the distribution by domain",
    });

    const byDomain = result.modelOutput.tables?.find(
      (entry) => entry.id === "tower_distribution_by_domain",
    );
    expect(byDomain?.columns).toContain("Approved funding");
    expect(byDomain?.columns).toContain("Yearly tool cost");
    const clinical = byDomain?.rows.find((row) => row[0] === "Clinical operations");
    expect(clinical?.[2]).toBe("$10.0M");
    expect(clinical?.[3]).toBe("$2.0M");
  });

  it("hides an AI amount when its basis is missing", async () => {
    mockReadTowerCommandCenter.mockResolvedValueOnce(
      towerView({
        aiPortfolio: [aiItem({ aiAmountBasis: undefined, aiTaggedSpendUsd: 99_000_000 })],
      }) as Awaited<ReturnType<typeof readTowerCommandCenter>>,
    );
    const result = await answerCurrentTowerQuestion({
      tenantId: "client-id",
      tenantKey: "selected-client",
      tenantName: "Selected Client",
      question: "Describe the AI portfolio",
    });

    const row = result.modelOutput.tables?.[0]?.rows[0];
    expect(row?.[2]).toBe("Not loaded");
    expect(row?.[3]).toBe("Not loaded");
    expect(result.response).not.toContain("$99.0M");
  });

  it("does not quote an unaligned blocked amount in the value funnel", async () => {
    mockReadTowerCommandCenter.mockResolvedValueOnce(
      towerView({
        valueFunnel: [{
          funnelKey: "blocked-stage",
          sequence: 5,
          stageKey: "blocked",
          stageLabel: "Blocked value",
          valueNumeric: 99_000_000,
          conversionRatio: 0.5,
          caveat: "Mixed annual and loaded-month periods.",
        }],
      }) as Awaited<ReturnType<typeof readTowerCommandCenter>>,
    );
    const result = await answerCurrentTowerQuestion({
      tenantId: "client-id",
      tenantKey: "selected-client",
      tenantName: "Selected Client",
      question: "What value is claimable?",
    });

    expect(result.modelOutput.tables?.[0]?.rows[0]).toEqual([
      "Blocked value",
      "Not comparable",
      "n/a",
      "Check the amount basis and reporting period before quoting this gap.",
    ]);
    expect(result.response).not.toContain("$99.0M");
  });

  it("withholds an action's amount when its reporting period is unverified", async () => {
    mockReadTowerCommandCenter.mockResolvedValueOnce(
      towerView({
        cxoActions: [{
          actionKey: "action-1",
          title: "Review value evidence",
          actionBody: "Confirm the source period.",
          actionLane: "fix",
          amountExposed: 99_000_000,
        }],
      }) as Awaited<ReturnType<typeof readTowerCommandCenter>>,
    );
    const result = await answerCurrentTowerQuestion({
      tenantId: "client-id",
      tenantKey: "selected-client",
      tenantName: "Selected Client",
      question: "Explain this selected row",
      pageContext: {
        selectedEntity: { kind: "action", id: "action-1", label: "Review value evidence" },
      },
    });

    const affected = result.modelOutput.tables?.[0]?.rows.find(
      (row) => row[0] === "Value affected",
    );
    expect(affected?.[1]).toContain("Not verified");
    expect(result.response).not.toContain("$99.0M");
  });

  it("marks grouped amounts partial when a row has no amount basis", async () => {
    mockReadTowerCommandCenter.mockResolvedValueOnce(
      towerView({
        aiPortfolio: [
          aiItem(),
          aiItem({
            aiPortfolioKey: "tool-2",
            aiAmountBasis: "annualized_tool_cost",
            approvedFundingUsd: 0,
            aiTaggedSpendUsd: 2_000_000,
          }),
          aiItem({
            aiPortfolioKey: "unknown-3",
            aiAmountBasis: undefined,
            aiTaggedSpendUsd: 99_000_000,
          }),
        ],
      }) as Awaited<ReturnType<typeof readTowerCommandCenter>>,
    );
    const result = await answerCurrentTowerQuestion({
      tenantId: "client-id",
      tenantKey: "selected-client",
      tenantName: "Selected Client",
      question: "Show the distribution by domain",
    });

    const row = result.modelOutput.tables?.find(
      (entry) => entry.id === "tower_distribution_by_domain",
    )?.rows.find((entry) => entry[0] === "Clinical operations");
    expect(row?.[2]).toContain("$10.0M (partial; 1 row without amount basis)");
    expect(row?.[3]).toContain("$2.0M (partial; 1 row without amount basis)");
    expect(result.response).not.toContain("$99.0M");
  });

  it("keeps a tool rollout out of the foundation funding table", async () => {
    mockReadTowerCommandCenter.mockResolvedValueOnce(
      towerView({
        aiPortfolio: [
          aiItem({
            aiPortfolioKey: "foundation-1",
            itemKind: "platform",
            itemName: "Shared AI platform",
          }),
          aiItem({
            aiPortfolioKey: "tool-platform",
            itemKind: "platform",
            itemName: "Platform tool rollout",
            sourceFile: "23_ai_tool_rollout.csv",
            aiAmountBasis: "annualized_tool_cost",
          }),
        ],
      }) as Awaited<ReturnType<typeof readTowerCommandCenter>>,
    );
    const result = await answerCurrentTowerQuestion({
      tenantId: "client-id",
      tenantKey: "selected-client",
      tenantName: "Selected Client",
      question: "Show the foundations",
    });

    const names = result.modelOutput.tables?.[0]?.rows.map((row) => row[0]);
    expect(names).toContain("Shared AI platform");
    expect(names).not.toContain("Platform tool rollout");
  });

  it("uses the portfolio action when a selected row is unavailable", async () => {
    const result = await answerCurrentTowerQuestion({
      tenantId: "client-id",
      tenantKey: "selected-client",
      tenantName: "Selected Client",
      question: "Explain this selected row",
    });

    expect(result.modelOutput.answer).toContain("Review the claim states and proof gaps with Finance");
    expect(result.modelOutput.answer).not.toContain("selected item's loaded owner");
  });

  it.each([
    ["What value is claimable?", "Close the baseline, actual, and attestation gaps"],
    ["Show the tool rollouts", "collect a before-and-after workflow baseline"],
    ["Show the budget posture", "Review the claim states and proof gaps with Finance"],
    ["Rank the top investments", "Have Finance review each yearly benefit estimate"],
    ["Show the distribution by domain", "Validate value-type and domain tags"],
    ["Which control blockers remain?", "Ask the control owner to document clearance evidence"],
    ["Show the evidence lineage", "Verify the source and caveat"],
    ["Describe the AI portfolio", "collect a before-and-after workflow baseline"],
  ])("includes a grounded next action in the visible %s answer", async (question, action) => {
    const result = await answerCurrentTowerQuestion({
      tenantId: "client-id",
      tenantKey: "selected-client",
      tenantName: "Selected Client",
      question,
    });

    expect(result.modelOutput.answer).toContain(action);
    expect(result.response).toContain(action);
    expect(result.modelOutput.answer).not.toMatch(/\bNext:/);
    expect(result.modelOutput.tables?.length).toBeGreaterThan(0);
  });

  it("uses the Foundations tab for a context-specific action", async () => {
    const result = await answerCurrentTowerQuestion({
      tenantId: "client-id",
      tenantKey: "selected-client",
      tenantName: "Selected Client",
      question: "What should I look at here?",
      pageContext: { activeTab: "foundations" },
    });

    expect(result.modelOutput.answer).toContain("Link each foundation to the business cases");
    expect(result.modelOutput.tables?.[0]?.id).toBe("tower_foundations");
  });

  it("keeps the existing decision action without repeating it", async () => {
    const result = await answerCurrentTowerQuestion({
      tenantId: "client-id",
      tenantKey: "selected-client",
      tenantName: "Selected Client",
      question: "What decision comes next?",
    });

    expect(result.modelOutput.answer).toContain("The next action is to use the current claim states");
    expect(result.modelOutput.answer.match(/The next action is/g)).toHaveLength(1);
  });

  it("gives a safe next action when governed Tower data is unavailable", async () => {
    mockReadTowerCommandCenter.mockResolvedValueOnce(null);
    const result = await answerCurrentTowerQuestion({
      tenantId: "client-id",
      tenantKey: "selected-client",
      tenantName: "Selected Client",
      question: "What is the portfolio posture?",
    });

    expect(result.modelOutput.answer).toContain(
      "Have the data owner load and validate the current Tower evidence",
    );
    expect(result.modelOutput.answer).not.toMatch(/\$\d/);
  });
});
