import {
  buildSourceTriageQueueView,
  normalizeTriageBandFilter,
  normalizeTriageSort,
  summarizeTriageBands,
  triageBandForUrgency,
} from "@/lib/source/queue/triage-banding";
import type {
  DecisionUrgency,
  SourceDecisionBundle,
  SourceDecisionQueue,
} from "@/lib/source/decision-queue/types";

function bundle(
  id: string,
  urgency: DecisionUrgency,
  valueAtStakeUsd: number | null,
  vendorName = id,
): SourceDecisionBundle {
  return {
    bundleId: `bundle:${id}`,
    clientKey: "apexretail",
    contractId: id,
    vendorName,
    urgency,
    headline: `${vendorName} renewal`,
    summary: `${vendorName} needs a decision.`,
    posture: "review",
    recommendedAction: "Open event",
    deepLink: `/source/renewal/${encodeURIComponent(id)}`,
    subIssues: [
      {
        kind: urgency === "due_now" ? "blocked_missing_evidence" : "renewal",
        label: "Renewal trigger",
        detail: "Decision trigger is inside the queue horizon.",
        valueAtStakeUsd,
        evidenceRefs: [id],
      },
    ],
    evidenceRefs: [id],
    valueAtStakeUsd,
    surfacedAt: "2026-06-05T00:00:00.000Z",
    accountability: null,
  };
}

function queue(bundles: SourceDecisionBundle[]): SourceDecisionQueue {
  return {
    clientKey: "apexretail",
    generatedAt: "2026-06-05T00:00:00.000Z",
    bundles,
    bandCounts: {
      due_now: bundles.filter((b) => b.urgency === "due_now").length,
      next_14_days: bundles.filter((b) => b.urgency === "next_14_days").length,
      next_45_days: bundles.filter((b) => b.urgency === "next_45_days").length,
      next_90_days: bundles.filter((b) => b.urgency === "next_90_days").length,
      watch: bundles.filter((b) => b.urgency === "watch").length,
    },
    emptyState: bundles.length === 0 ? "No decisions need attention." : null,
  };
}

describe("source queue triage banding", () => {
  it("collapses detector urgency into the three executive triage bands", () => {
    expect(triageBandForUrgency("due_now")).toBe("overdue");
    expect(triageBandForUrgency("next_14_days")).toBe("due_this_quarter");
    expect(triageBandForUrgency("next_45_days")).toBe("due_this_quarter");
    expect(triageBandForUrgency("next_90_days")).toBe("due_this_quarter");
    expect(triageBandForUrgency("watch")).toBe("pipeline");
  });

  it("summarizes counts, aggregate value, and scope-clarity blockers", () => {
    const summaries = summarizeTriageBands([
      bundle("overdue", "due_now", 10_000_000, "Wipro"),
      bundle("due", "next_45_days", 5_000_000, "Infosys"),
      bundle("watch", "watch", 1_000_000, "TCS"),
    ]);

    expect(summaries.map((s) => [s.band, s.count])).toEqual([
      ["overdue", 1],
      ["due_this_quarter", 1],
      ["pipeline", 1],
    ]);
    expect(summaries[0].aggregateValueUsd).toBe(10_000_000);
    expect(summaries[0].scopeClarityCount).toBe(1);
  });

  it("filters by clickable band and sorts within the visible list", () => {
    const view = buildSourceTriageQueueView(
      queue([
        bundle("pipeline", "watch", 1_000_000, "Zed"),
        bundle("due-small", "next_45_days", 2_000_000, "Bravo"),
        bundle("due-big", "next_14_days", 9_000_000, "Alpha"),
      ]),
      { activeBand: "due_this_quarter", sort: "value" },
    );

    expect(view.visibleBundles.map((b) => b.vendorName)).toEqual([
      "Alpha",
      "Bravo",
    ]);
    expect(view.aggregateValueThisQuarterUsd).toBe(11_000_000);
  });

  it("normalizes unknown URL params to safe defaults", () => {
    expect(normalizeTriageBandFilter("nonsense")).toBe("all");
    expect(normalizeTriageSort("nonsense")).toBe("deadline");
  });
});
