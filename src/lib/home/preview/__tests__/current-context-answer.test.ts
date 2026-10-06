import { validateAvaAnswerPacket } from "@/lib/ava-answer/validateAvaAnswerPacket";
import { answerHomeAvaQuestion } from "../ava-answer";
import {
  answerHomeCurrentContext,
  canAnswerFromCurrentContext,
} from "../current-context-answer";
import { getHomeReviewBundle } from "../golden-snapshot";
import type { HomeEnterpriseContext } from "../ecl-enterprise-context";
import type { HomeContextVersion } from "../types";

const version: HomeContextVersion = {
  assessmentId: "synthetic-assessment",
  projectionContentHash: "current-projection-hash",
  sourceSetHash: "current-source-set-hash",
  sourceLineageHash: "current-lineage-hash",
  sourceCoverage: { totalRecordRows: 20, linkedRecordRows: 20, families: [] },
  sourceFileReview: {
    totalFiles: 2,
    acceptedFiles: 2,
    partialFiles: 0,
    blockedFiles: 0,
    supersededFiles: 0,
  },
  sourceDateCoverage: {
    earliest: "2026-09-30",
    latest: "2026-09-30",
    datedFiles: 2,
    totalFiles: 2,
  },
  deterministicPacketHash: "current-packet-hash",
  narrativePacketHash: "old-narrative-hash",
  narrativeGeneratedAt: "2026-08-21T00:00:00Z",
  dataAsOf: null,
  coherence: "unverified",
};

const context = {
  profile: {
    rowKey: "profile",
    title: "Enterprise profile",
    sourceRefs: ["source-profile"],
    asOf: "2026-09-30",
    businessModel: "an integrated payer and care-delivery enterprise",
    annualRevenueUsd: null,
  },
  segmentSpine: {
    segments: [
      {
        segmentKey: "care",
        segmentName: "Care delivery",
        revenueSharePct: 60,
        revenueUsd: 0,
        pnlOwnerRole: "Care president",
        domains: {},
      },
      {
        segmentKey: "plan",
        segmentName: "Health plan",
        revenueSharePct: 40,
        revenueUsd: 0,
        pnlOwnerRole: "Plan president",
        domains: {},
      },
    ],
    unattributed: {},
    unresolvedByDomain: {},
    shareVsRevenue: [],
  },
  segmentFacts: {
    care: {
      rowKey: "care",
      title: "Care delivery",
      sourceRefs: ["source-care"],
      asOf: "2026-09-30",
      revenueUsd: null,
      revenueSharePct: null,
    },
    plan: {
      rowKey: "plan",
      title: "Health plan",
      sourceRefs: ["source-plan"],
      asOf: "2026-09-30",
      revenueUsd: null,
      revenueSharePct: null,
    },
  },
  functions: [
    {
      rowKey: "function-1",
      title: "Clinical operations",
      sourceRefs: ["source-function-1"],
      asOf: null,
      functionId: "function-1",
      segmentKey: "care",
      executiveOwner: "Care president",
      applicationCount: 10,
      programCount: 1,
      riskCount: 1,
    },
    {
      rowKey: "function-2",
      title: "Claims",
      sourceRefs: ["source-function-2"],
      asOf: null,
      functionId: "function-2",
      segmentKey: "plan",
      executiveOwner: "Plan president",
      applicationCount: 5,
      programCount: 1,
      riskCount: 1,
    },
  ],
  priorities: [
    {
      rowKey: "priority-1",
      title: "Improve quality",
      sourceRefs: ["source-priority-1"],
      asOf: null,
      priorityId: "priority-1",
      segmentKey: "care",
      ownerRole: "Care president",
      targetOutcome: null,
      programCount: 2,
      atRiskProgramCount: 1,
      metricCount: 2,
    },
    {
      rowKey: "priority-2",
      title: "Simplify claims",
      sourceRefs: ["source-priority-2"],
      asOf: null,
      priorityId: "priority-2",
      segmentKey: "plan",
      ownerRole: "Plan president",
      targetOutcome: null,
      programCount: 1,
      atRiskProgramCount: 0,
      metricCount: 1,
    },
  ],
  valueProof: {
    asOf: "2026-09-30",
    programCount: 3,
    approvedBudgetUsd: 100_000_000,
    forecastUsd: 110_000_000,
    overBudgetProgramCount: 1,
    missingFinancialCount: 0,
    modelledClaimCount: 2,
    unsupportedClaimCount: 1,
    otherClaimCount: 0,
    completedPeriodSpendLines: 9,
    excludedSpendLines: 1,
    priorities: [
      {
        rowKey: "priority-1",
        title: "Improve quality",
        sourceRefs: ["source-priority-1", "source-program-1"],
        asOf: "2026-09-30",
        ownerRole: "Care president",
        programCount: 2,
        approvedBudgetUsd: 70_000_000,
        forecastUsd: 80_000_000,
        overBudgetProgramCount: 1,
        missingFinancialCount: 0,
      },
      {
        rowKey: "priority-2",
        title: "Simplify claims",
        sourceRefs: ["source-priority-2", "source-program-2"],
        asOf: "2026-09-30",
        ownerRole: "Plan president",
        programCount: 1,
        approvedBudgetUsd: 30_000_000,
        forecastUsd: 30_000_000,
        overBudgetProgramCount: 0,
        missingFinancialCount: 0,
      },
    ],
  },
  riskTriage: {
    totalRisks: 3,
    highOrCritical: 2,
    partialControl: 1,
    unknownControl: 1,
    ownerIsConstant: true,
    attentionRisks: [
      {
        rowKey: "risk-1",
        title: "Critical dependency",
        sourceRefs: ["source-risk-1"],
        asOf: null,
        riskType: "operational",
        severity: "critical",
        controlState: "unknown",
        ownerRole: "Care president",
        functionName: "Clinical operations",
        affectedObject: null,
      },
      {
        rowKey: "risk-2",
        title: "Recovery gap",
        sourceRefs: ["source-risk-2"],
        asOf: null,
        riskType: "operational",
        severity: "high",
        controlState: "partially_effective",
        ownerRole: "Plan president",
        functionName: "Claims",
        affectedObject: null,
      },
    ],
  },
  sharedFunctionIds: [],
  unlinkedPrograms: [
    {
      rowKey: "program-3",
      title: "Unlinked initiative",
      sourceRefs: ["source-program-3"],
      asOf: null,
      programId: "program-3",
    },
  ],
  attributionGaps: {},
  unrecordedSpendAmounts: 0,
  excludedUncitedRows: 0,
  evidenceClass: "synthetic_reference",
} satisfies HomeEnterpriseContext;

const dependencyContext: HomeEnterpriseContext = {
  ...context,
  dependencyProof: {
    projectedLinks: 346,
    asOf: "2026-09-30",
    riskPaths: [{
      primaryLinkKey: "edge-risk-1",
      subject: { id: "risk-id", name: "Recovery capacity gap", type: "risk" },
      subjectKind: "risk",
      subjectState: "critical; unknown",
      asset: { id: "app-id", name: "Claims platform", type: "application" },
      supplier: { id: "vendor-id", name: "Vendor A", type: "vendor" },
      contract: null,
      dataProduct: { id: "data-id", name: "Claims data", type: "data_product" },
      platform: { id: "platform-id", name: "Database cluster", type: "data_platform" },
      sourceRefs: ["source-risk-1", "source-edge-1", "source-app-1", "source-vendor-1", "source-data-1"],
      asOf: "2026-09-30",
    }],
    programPaths: [{
      primaryLinkKey: "edge-program-1",
      subject: { id: "program-id", name: "Modernize claims", type: "program" },
      subjectKind: "program",
      subjectState: "at_risk",
      asset: { id: "app-id", name: "Claims platform", type: "application" },
      supplier: { id: "vendor-id", name: "Vendor A", type: "vendor" },
      contract: null,
      dataProduct: { id: "data-id", name: "Claims data", type: "data_product" },
      platform: { id: "platform-id", name: "Database cluster", type: "data_platform" },
      sourceRefs: ["source-program-1", "source-edge-2", "source-app-1", "source-vendor-1", "source-data-1"],
      asOf: "2026-09-30",
    }],
  },
};

describe("current Home context answers", () => {
  it("requires complete source links and accepted source files", () => {
    expect(canAnswerFromCurrentContext(version)).toBe(true);
    expect(
      canAnswerFromCurrentContext({
        ...version,
        sourceCoverage: { ...version.sourceCoverage, linkedRecordRows: 19 },
      }),
    ).toBe(false);
    expect(
      canAnswerFromCurrentContext({
        ...version,
        sourceFileReview: { ...version.sourceFileReview!, acceptedFiles: 1 },
      }),
    ).toBe(false);
  });

  it.each([
    [
      "What do we know about the business, not just technology?",
      "business",
      "source-profile",
    ],
    [
      "What are our priorities and which programs are off track?",
      "priorities",
      "source-priority-1",
    ],
    ["What are our strategic priorities?", "priorities", "source-priority-1"],
    ["How is the operating model organized?", "operating", "source-care"],
    ["What value has finance validated?", "value", "source-priority-1"],
    ["What is our program budget?", "value", "source-priority-1"],
    ["What should the CFO care about first?", "value", "source-priority-1"],
    ["Which risks need attention first?", "risk", "source-risk-1"],
  ])("answers %s from the current record only", (question, area, sourceRef) => {
    const answer = answerHomeCurrentContext({
      context,
      version,
      tenantKey: "meridian-health",
      question,
    });
    expect(answer?.intent).toBe(`home_current_${area}`);
    expect(answer?.status).toBe("partial");
    expect(
      answer?.prose?.split("\n").every((line) => line.startsWith("- ")),
    ).toBe(true);
    expect(
      answer?.citations.some((citation) => citation.recordId === sourceRef),
    ).toBe(true);
    expect(answer?.citations[0].recordId).toBe(version.projectionContentHash);
    expect(answer?.directAnswer).not.toContain("72 contracts");
    expect(answer && validateAvaAnswerPacket(answer).violations.filter((violation) => violation.severity === "error")).toEqual([]);
  });

  it("does not fill commercial, dependency, or change gaps with old narrative", () => {
    for (const question of [
      "Where are we commercially exposed?",
      "What is our IT budget?",
      "Which finance systems do we have?",
      "What does the data estate imply for strategy?",
      "Show critical dependencies",
      "Show me the graph of how risks, vendors, applications, data and programs connect.",
      "What changed over time?",
      "How have our risks changed since last quarter?",
    ]) {
      expect(
        answerHomeCurrentContext({
          context,
          version,
          tenantKey: "meridian-health",
          question,
        }),
      ).toBeNull();
    }
  });

  it("distinguishes recorded investment from unproven realized value", () => {
    const answer = answerHomeCurrentContext({
      context,
      version,
      tenantKey: "meridian-health",
      question: "What value has finance validated?",
    });
    expect(answer?.directAnswer).toContain("$100M");
    expect(answer?.directAnswer).toContain("$110M");
    expect(answer?.directAnswer).toContain("Client-attested realized value is not established");
    expect(answer?.prose?.split("\n")).toHaveLength(2);
    expect(answer?.gaps[0].detail).toContain("2 value claims are modelled");
    expect(answer?.citations.some((citation) => citation.recordId === "source-program-1")).toBe(true);
  });

  it("does not present a constant register role as item-level accountability", () => {
    const answer = answerHomeCurrentContext({
      context,
      version,
      tenantKey: "meridian-health",
      question: "Which risks need attention first?",
    });
    expect(answer?.prose).not.toContain("owner: Care president");
    expect(answer?.caveats[0].detail).toContain(
      "item-level accountability is not established",
    );
    expect(answer?.prose).toContain("item-level accountability is not established");
    const ownerQuestion = answerHomeCurrentContext({
      context,
      version,
      tenantKey: "meridian-health",
      question: "Which risks need attention first, and who owns each item?",
    });
    expect(ownerQuestion?.directAnswer).toContain(
      "item-level accountability is not established",
    );
    expect(ownerQuestion?.prose).not.toContain("owner: Care president");
  });

  it("answers dependencies with cited canonical paths and renders only their verified graph", async () => {
    const question = "Which applications, vendors and data assets are critical dependencies for our top risks and programs?";
    const answer = answerHomeCurrentContext({
      context: dependencyContext, version, tenantKey: "meridian-health", question,
    });
    expect(answer?.intent).toBe("home_current_dependencies");
    expect(answer?.directAnswer).toContain("346 source-linked relationships form a bounded slice around 1 priority risk and 1 program");
    expect(answer?.prose).toContain("Claims platform");
    expect(answer?.prose).toContain("Claims data");
    expect(answer?.citations.some((citation) => citation.recordId === "source-edge-1")).toBe(true);
    const riskCitations = answer?.relationshipsUsed[0].citationIds ?? [];
    expect(riskCitations).toContain(answer?.citations.find((citation) =>
      citation.recordId === "source-edge-1")?.id);
    expect(riskCitations).not.toContain(answer?.citations.find((citation) =>
      citation.recordId === "source-program-1")?.id);
    expect(answer?.artifacts).toHaveLength(0);
    const graph = await answerHomeAvaQuestion({
      bundle: {
        ...getHomeReviewBundle("meridian-health")!,
        contextVersion: version,
        thesis: {
          ...getHomeReviewBundle("meridian-health")!.thesis,
          signalPacket: {
            ...getHomeReviewBundle("meridian-health")!.thesis.signalPacket,
            homeEnterpriseContext: dependencyContext,
          },
        },
      },
      tenantKey: "meridian-health",
      question: "Show me the graph of how risks, vendors, applications, data and programs connect.",
    });
    expect(graph.intent).toBe("home_current_dependencies");
    expect(graph.artifacts[0].artifact).toBe("graph");
    if (graph.artifacts[0].artifact === "graph") {
      expect(graph.artifacts[0].edges).toEqual(expect.arrayContaining([
        expect.objectContaining({ label: "applies to" }),
        expect.objectContaining({ label: "feeds" }),
        expect.objectContaining({ label: "hosted on" }),
      ]));
    }
    expect(validateAvaAnswerPacket(graph).violations.filter((violation) =>
      violation.severity === "error")).toEqual([]);
  });

  it("routes a mixed-version Home bundle to current facts without consulting stored chapter prose", async () => {
    const stored = getHomeReviewBundle("meridian-health");
    expect(stored).not.toBeNull();
    const bundle = {
      ...stored!,
      contextVersion: version,
      thesis: {
        ...stored!.thesis,
        signalPacket: {
          ...stored!.thesis.signalPacket,
          homeEnterpriseContext: context,
        },
      },
    };
    const answer = await answerHomeAvaQuestion({
      bundle,
      tenantKey: "meridian-health",
      question: "What are our priorities and which programs are off track?",
      activeChapterId: "technology_data",
    });
    expect(answer.status).toBe("partial");
    expect(answer.directAnswer).toContain("2 declared priorities");
    expect(answer.directAnswer).not.toContain("Live rows are available");
    expect(answer.citations[0].recordId).toBe(
      bundle.provenance.canonical_snapshot_hash,
    );
    const value = await answerHomeAvaQuestion({
      bundle,
      tenantKey: "meridian-health",
      question: "I'm on Technology & Data. What should the CFO care about first?",
      activeChapterId: "technology_data",
    });
    expect(value.intent).toBe("home_current_value");
    expect(value.directAnswer).toContain("$100M");
    expect(value.directAnswer).not.toContain("reviewed narrative");
    const graph = await answerHomeAvaQuestion({
      bundle,
      tenantKey: "meridian-health",
      question:
        "Show me a graph of how risks, vendors, applications, data and programs connect.",
    });
    expect(graph.status).toBe("no_data");
    expect(graph.directAnswer).toContain(
      "verified relationship graph is not available",
    );
    expect(graph.prose).toBeUndefined();
  });
});
