import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { SourceDecisionQueueView } from "@/components/source/SourceDecisionQueueView";
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
    recommendedAction: "Open the renewal cockpit.",
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

describe("SourceDecisionQueueView triage bands", () => {
  it("renders the three clickable triage bands and URL-driven controls", () => {
    const html = renderToStaticMarkup(
      createElement(SourceDecisionQueueView, {
        queue: queue([
          bundle("overdue", "due_now", 10_000_000, "Wipro"),
          bundle("due", "next_45_days", 5_000_000, "Infosys"),
          bundle("pipeline", "watch", 1_000_000, "TCS"),
        ]),
        activeBand: "all",
        sort: "deadline",
        activeEventsCount: 3,
      }),
    );

    expect(html).toContain('data-testid="source-triage-bands"');
    expect(html).toContain(
      'href="/source/workspace?decisionBand=overdue&amp;sort=deadline"',
    );
    expect(html).toContain("Overdue — act now");
    expect(html).toContain("Due this quarter");
    expect(html).toContain("Pipeline");
    expect(html).toContain('data-testid="source-triage-filter"');
    expect(html).toContain('data-testid="source-triage-sort"');
  });

  it("filters visible cards by the selected triage band", () => {
    const html = renderToStaticMarkup(
      createElement(SourceDecisionQueueView, {
        queue: queue([
          bundle("overdue", "due_now", 10_000_000, "Wipro"),
          bundle("due", "next_45_days", 5_000_000, "Infosys"),
          bundle("pipeline", "watch", 1_000_000, "TCS"),
        ]),
        activeBand: "pipeline",
        sort: "deadline",
        activeEventsCount: 3,
      }),
    );

    expect(html).toContain("TCS renewal");
    expect(html).not.toContain("Wipro renewal");
    expect(html).not.toContain("Infosys renewal");
  });

  it("authors a portfolio-forward zero state", () => {
    const html = renderToStaticMarkup(
      createElement(SourceDecisionQueueView, {
        queue: queue([]),
        activeBand: "all",
        sort: "deadline",
        activeEventsCount: 2,
      }),
    );

    expect(html).toContain("Nothing needs you. 2 active events in Portfolio");
    expect(html).toContain('href="/source/workspace"');
  });

  it("guards secondary deadline actions behind a confirmation disclosure", () => {
    const html = renderToStaticMarkup(
      createElement(SourceDecisionQueueView, {
        queue: queue([bundle("overdue", "due_now", 10_000_000, "Wipro")]),
        activeBand: "all",
        sort: "deadline",
        activeEventsCount: 1,
      }),
    );

    expect(html).toContain("Defer to Q4");
    expect(html).toContain("Confirm before changing deadlines");
    expect(html).toContain("No queue date is changed silently");
  });

  it("scrubs internal source vocabulary from queue card copy", () => {
    const html = renderToStaticMarkup(
      createElement(SourceDecisionQueueView, {
        queue: queue([
          {
            ...bundle("blocked", "due_now", 7_500_000, "Acme"),
            headline: "Acme posture: unblock",
            summary:
              "vendor_contracts and it_financials grounding are incomplete.",
            recommendedAction:
              "AbarVa should decline rather than guess until posture: review clears.",
          },
        ]),
        activeBand: "all",
        sort: "deadline",
        activeEventsCount: 1,
      }),
    );

    expect(html).toContain("Acme needs evidence before action");
    expect(html).toContain("vendor contract evidence");
    expect(html).toContain("financial baseline evidence");
    expect(html).toContain("evidence are incomplete");
    expect(html).toContain(
      "Do not recommend until the missing evidence is refreshed",
    );
    expect(html).toContain("needs review clears");
    expect(html).toContain("Review required");
    expect(html).not.toContain("vendor_contracts");
    expect(html).not.toContain("it_financials");
    expect(html).not.toContain("grounding");
    expect(html).not.toContain("posture:");
    expect(html).not.toContain("AbarVa should decline rather than guess");
  });
});
