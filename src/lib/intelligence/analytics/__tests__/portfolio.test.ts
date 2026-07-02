import {
  assignInvestmentPosture,
  buildFastCanvasAnalytics,
  bucketInvestmentPosture,
  buildInvestmentSequencingPayload,
  buildValueReadinessMatrixPayload,
  calculateProofBoundaryScore,
  calculateQuadrantPlacement,
  computeGateToValueRoadmap,
  computeSensitivityCases,
  computeValueReadinessQuadrants,
  detectOutliers,
  detectPortfolioOutliers,
  INDUSTRIAL_DEMO_PORTFOLIO_CANDIDATES,
  normalizeScore,
  rankPortfolioCandidates,
  rankPortfolioItems,
  SKYHARBOR_DEMO_PORTFOLIO_CANDIDATES,
  type IntelligencePortfolioCandidate,
  type InvestmentPostureCode,
  type RankedPortfolioCandidate,
} from "../portfolio";
import {
  buildPendingCanvasFrame,
  buildPendingIntelligenceCanvasTabs,
} from "../pending-canvas";
import { extractExecutiveCanvasPayloads } from "@/lib/intelligence/executive-canvas-payload";

describe("Intelligence portfolio analytics", () => {
  it("normalizes scores into a stable 0-100 range", () => {
    expect(normalizeScore(5)).toBe(50);
    expect(normalizeScore(20)).toBe(100);
    expect(normalizeScore(-1)).toBe(0);
    expect(normalizeScore(75, 50, 100)).toBe(50);
  });

  it("buckets initiatives into executive investment postures", () => {
    expect(
      bucketInvestmentPosture({ value: 8, readiness: 8, risk: 4 }),
    ).toBe("Scale now");
    expect(
      bucketInvestmentPosture({ value: 8, readiness: 6, risk: 6 }),
    ).toBe("Certify then scale");
    expect(
      bucketInvestmentPosture({ value: 10, readiness: 3, risk: 8 }),
    ).toBe("Fund readiness");
    expect(
      bucketInvestmentPosture({ value: 5, readiness: 4, risk: 8 }),
    ).toBe("Hold / stop");
  });

  it("scores proof boundaries from evidence and completeness", () => {
    const complete: IntelligencePortfolioCandidate = {
      id: "complete",
      name: "Complete candidate",
      domain: "Finance",
      tenantKey: "industrial",
      valueSignal: 8,
      readinessSignal: 8,
      riskSignal: 4,
      evidenceCount: 9,
      missingEvidenceCount: 1,
      ownerKnown: true,
      controlKnown: true,
      baselineKnown: true,
      dependenciesKnown: true,
      sourceConfidence: 0.9,
    };
    const incomplete = {
      ...complete,
      id: "incomplete",
      ownerKnown: false,
      controlKnown: false,
      baselineKnown: false,
      dependenciesKnown: false,
      missingEvidenceCount: 9,
      sourceConfidence: 0.4,
    };

    expect(calculateProofBoundaryScore(complete)).toBeGreaterThan(8);
    expect(calculateProofBoundaryScore(incomplete)).toBeLessThan(4);
  });

  it("assigns deterministic posture and quadrant placement for candidate inputs", () => {
    const scaleCandidate = SKYHARBOR_DEMO_PORTFOLIO_CANDIDATES.find(
      (candidate) => candidate.id === "skyharbor-loyalty-ai",
    );
    const readinessCandidate = SKYHARBOR_DEMO_PORTFOLIO_CANDIDATES.find(
      (candidate) => candidate.id === "skyharbor-irops",
    );

    expect(scaleCandidate).toBeDefined();
    expect(readinessCandidate).toBeDefined();
    expect(assignInvestmentPosture(scaleCandidate!).posture).toBe("scale_now");
    expect(assignInvestmentPosture(readinessCandidate!).posture).toBe(
      "fund_readiness",
    );
    expect(calculateQuadrantPlacement(readinessCandidate!).quadrant).toBe(
      "high_value_low_readiness",
    );
  });

  it("ranks portfolio items with readiness, risk, and evidence confidence", () => {
    const ranked = rankPortfolioItems([
      {
        label: "IROPS Decisioning",
        value: 10,
        readiness: 3,
        risk: 8,
        evidenceConfidence: 5,
      },
      {
        label: "Loyalty AI",
        value: 8,
        readiness: 8,
        risk: 4,
        evidenceConfidence: 8,
      },
      {
        label: "Generic assistant rollout",
        value: 5,
        readiness: 5,
        risk: 8,
        evidenceConfidence: 4,
      },
    ]);

    expect(ranked[0]).toMatchObject({
      label: "Loyalty AI",
      posture: "Scale now",
      quadrant: "High value / high readiness",
    });
    expect(ranked.find((item) => item.label === "IROPS Decisioning")).toMatchObject({
      posture: "Fund readiness",
      quadrant: "High value / low readiness",
    });
    expect(ranked.at(-1)).toMatchObject({
      label: "Generic assistant rollout",
      posture: "Hold / stop",
    });
  });

  it("builds sequencing and matrix canvas payloads without relying on Claude", () => {
    const items = [
      { label: "Treasury / Kyriba controls", value: 8, readiness: 8, risk: 4 },
      { label: "Legal intake / CLM AI", value: 7, readiness: 4, risk: 7 },
    ];
    const sequencing = buildInvestmentSequencingPayload({
      title: "Back-office investment sequence",
      items,
      proofBoundary: {
        known: ["Treasury evidence exists"],
        missing: ["Legal matter taxonomy"],
        decisionRequired: "Pick the lighthouse lane.",
      },
    });
    const matrix = buildValueReadinessMatrixPayload({
      title: "Back-office value/readiness map",
      items,
    });

    expect(sequencing.canvasType).toBe("executive-canvas-sequencing");
    expect(sequencing.lanes?.map((lane) => lane.label)).toEqual([
      "Scale now",
      "Fund readiness",
    ]);
    expect(sequencing.proofBoundary?.decisionRequired).toBe(
      "Pick the lighthouse lane.",
    );
    expect(matrix.canvasType).toBe("value-readiness-matrix");
    expect(matrix.items).toHaveLength(2);
  });

  it("computes quadrants, gate roadmaps, outliers, and scenario cases deterministically", () => {
    expect(
      computeValueReadinessQuadrants([
        { label: "Scale", value: 8, readiness: 8, risk: 3 },
        { label: "Readiness", value: 9, readiness: 3, risk: 8 },
      ])["High value / low readiness"].map((item) => item.label),
    ).toEqual(["Readiness"]);

    expect(
      computeGateToValueRoadmap([
        { label: "Certify data", owner: "CDAO" },
        { label: "Approve HITL", owner: "AI Governance" },
      ]),
    ).toEqual([
      { label: "Certify data", owner: "CDAO", status: "Gate 1" },
      { label: "Approve HITL", owner: "AI Governance", status: "Gate 2" },
    ]);

    expect(
      detectOutliers([
        { label: "A", value: 10 },
        { label: "B", value: 11 },
        { label: "C", value: 10 },
        { label: "D", value: 80 },
      ], 1.5),
    ).toEqual([expect.objectContaining({ label: "D", kind: "high" })]);

    expect(
      computeSensitivityCases([
        { label: "Benefit", value: 100, lowMultiplier: 0.5, highMultiplier: 1.5 },
      ]),
    ).toEqual([{ label: "Benefit", low: 50, base: 100, high: 150 }]);
  });

  it("generates deterministic portfolio outlier flags", () => {
    expect(
      detectPortfolioOutliers(SKYHARBOR_DEMO_PORTFOLIO_CANDIDATES).map(
        (flag) => flag.code,
      ),
    ).toEqual(
      expect.arrayContaining([
        "high_value_low_proof",
        "high_dependency_uncertainty",
      ]),
    );
  });

  it("ranks Industrial fixtures into expected lanes", () => {
    const ranked = rankPortfolioCandidates(INDUSTRIAL_DEMO_PORTFOLIO_CANDIDATES);
    const lanes = groupByPosture(ranked);

    expect(ranked[0]).toMatchObject({
      id: "industrial-treasury-kyriba",
      posture: "scale_now",
    });
    expect(lanes.certify_then_scale?.map((candidate) => candidate.id)).toEqual(
      expect.arrayContaining([
        "industrial-finance-semantic-layer",
        "industrial-shared-services-agent",
      ]),
    );
    expect(lanes.fund_readiness?.map((candidate) => candidate.id)).toEqual(
      expect.arrayContaining(["industrial-hr-ai", "industrial-legal-ai"]),
    );
    expect(lanes.hold?.map((candidate) => candidate.id)).toContain(
      "industrial-m365-copilot-scale",
    );
  });

  it("ranks SkyHarbor fixtures into expected lanes", () => {
    const ranked = rankPortfolioCandidates(SKYHARBOR_DEMO_PORTFOLIO_CANDIDATES);
    const lanes = groupByPosture(ranked);

    expect(ranked[0]).toMatchObject({
      id: "skyharbor-loyalty-ai",
      posture: "scale_now",
    });
    expect(lanes.certify_then_scale?.map((candidate) => candidate.id)).toEqual(
      expect.arrayContaining([
        "skyharbor-crew-recovery",
        "skyharbor-predictive-maintenance",
      ]),
    );
    expect(lanes.fund_readiness?.map((candidate) => candidate.id)).toEqual(
      expect.arrayContaining([
        "skyharbor-irops",
        "skyharbor-customer-disruption-recovery",
      ]),
    );
  });

  it("builds a UI-safe fast canvas analytics payload", () => {
    const analytics = buildFastCanvasAnalytics(
      SKYHARBOR_DEMO_PORTFOLIO_CANDIDATES,
      {
        title: "SkyHarbor AI decision frame",
        intent: "executive-canvas-sequencing",
      },
    );
    const serialized = JSON.stringify(analytics);

    expect(analytics.topRecommendation).toMatchObject({
      id: "skyharbor-loyalty-ai",
    });
    expect(analytics.canvas.canvasType).toBe("executive-canvas-sequencing");
    expect(analytics.keyProofGaps.length).toBeGreaterThan(0);
    expect(serialized).not.toContain("<<<TAB:");
    expect(serialized).not.toContain("rawPrompt");
    expect(serialized).not.toContain("rawClaude");
    expect(serialized).not.toContain("grounding:");
  });
});

function groupByPosture(
  ranked: RankedPortfolioCandidate[],
): Partial<Record<InvestmentPostureCode, RankedPortfolioCandidate[]>> {
  return ranked.reduce<
    Partial<Record<InvestmentPostureCode, RankedPortfolioCandidate[]>>
  >((accumulator, candidate) => {
    accumulator[candidate.posture] = [
      ...(accumulator[candidate.posture] ?? []),
      candidate,
    ];
    return accumulator;
  }, {});
}

describe("Intelligence pending canvas analytics", () => {
  it("returns a five-tab airline fast canvas with a native sequencing payload", () => {
    const tabs = buildPendingIntelligenceCanvasTabs({
      tenantKey: "skyharbor-air",
      question: "Where should we fund AI next across IROPS and loyalty?",
    });
    const chart = tabs.find((tab) => tab.label === "Chart");
    const payloads = extractExecutiveCanvasPayloads(chart?.content ?? "").payloads;

    expect(tabs.map((tab) => tab.label)).toEqual([
      "Decision",
      "Industry Insights",
      "Chart",
      "Table",
      "Evidence",
    ]);
    expect(payloads[0]).toMatchObject({
      canvasType: "executive-canvas-sequencing",
      title: "Building airline AI decision frame",
    });
    expect(payloads[0]?.lanes?.map((lane) => lane.label)).toEqual([
      "Scale now",
      "Certify then scale",
      "Fund readiness",
    ]);
    expect(chart?.content).not.toContain("canvasType=");
  });

  it("selects the right native exhibit type from the question", () => {
    expect(
      buildPendingCanvasFrame({
        tenant: "industrial",
        intent: "value-readiness-matrix",
      }).canvas.canvasType,
    ).toBe("value-readiness-matrix");

    expect(
      buildPendingIntelligenceCanvasTabs({
        tenantKey: "lakeshore-industries",
        question: "What has to happen first before Legal AI scales?",
      })
        .find((tab) => tab.label === "Chart")
        ?.content,
    ).toContain('"canvasType":"gate-to-value-roadmap"');

    expect(
      buildPendingIntelligenceCanvasTabs({
        tenantKey: "lakeshore-industries",
        question: "What proof is missing before HR and Legal AI can scale?",
      })
        .find((tab) => tab.label === "Chart")
        ?.content,
    ).toContain('"canvasType":"proof-boundary-card"');
  });
});
