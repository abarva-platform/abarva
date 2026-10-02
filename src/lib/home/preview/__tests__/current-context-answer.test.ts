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
    expect(answer && validateAvaAnswerPacket(answer).passed).toBe(true);
  });

  it("does not fill value, dependency, or change gaps with old narrative", () => {
    for (const question of [
      "What value has finance validated?",
      "Where are we commercially exposed?",
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
