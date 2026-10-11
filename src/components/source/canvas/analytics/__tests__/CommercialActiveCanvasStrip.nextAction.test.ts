import type { SourceEventShellView } from "@/lib/source/source-event-shell-v2";

import { buildCommercialLenses } from "../CommercialActiveCanvasStrip";

function viewWith(input: {
  ready: number;
  total: number;
  blockerCount: number;
}): SourceEventShellView {
  return {
    stage: {
      key: "selection",
      label: "Selection",
      ready: input.ready,
      total: input.total,
      artifactReadiness: { blockerCount: input.blockerCount },
    },
    guidebook: { available: true },
  } as unknown as SourceEventShellView;
}

function summaryNextAction(view: SourceEventShellView): string {
  const summary = buildCommercialLenses(view).find(
    (lens) => lens.key === "summary",
  );
  if (!summary) throw new Error("No summary lens");
  return summary.nextAction;
}

describe("commercial strip summary next action", () => {
  it("does not invite a duplicate approval when a stage decision is already recorded", () => {
    const view = viewWith({ ready: 1, total: 1, blockerCount: 0 });
    view.stage.approvalRecorded = true;
    expect(summaryNextAction(view)).toBe("Review prior approval record");
  });

  it("does not let captured inputs override current evidence or response gate gaps", () => {
    const view = viewWith({ ready: 1, total: 1, blockerCount: 0 });
    const evidenceLenses = buildCommercialLenses(view, 2);
    expect(
      evidenceLenses.find((lens) => lens.key === "summary")?.nextAction,
    ).toBe("Review required evidence in Files");
    expect(evidenceLenses.find((lens) => lens.key === "readiness")?.state).toBe(
      "blocked",
    );

    view.stage.key = "responses";
    view.stage.approvalRecorded = true;
    const responseLenses = buildCommercialLenses(view, 0, 6);
    expect(
      responseLenses.find((lens) => lens.key === "summary")?.nextAction,
    ).toBe("Resolve current response gate checks");
    expect(responseLenses.find((lens) => lens.key === "readiness")?.state).toBe(
      "blocked",
    );
    expect(
      responseLenses.find((lens) => lens.key === "readiness")?.answer,
    ).toContain("6 current forward gate checks");
  });

  it("points at the approval gate when inputs and artifacts are both clear", () => {
    expect(
      summaryNextAction(viewWith({ ready: 1, total: 1, blockerCount: 0 })),
    ).toBe("Open the approval gate");
  });

  it("points at Files — not at the completed checklist — when only artifact review remains", () => {
    // Regression: the strip used to say "Complete the highlighted step below"
    // while every step below was already done, leaving the user with no real
    // next action. The blocker in this state is artifact review, not inputs.
    expect(
      summaryNextAction(viewWith({ ready: 1, total: 1, blockerCount: 2 })),
    ).toBe("Review and accept 2 artifacts in Files");
    expect(
      summaryNextAction(viewWith({ ready: 1, total: 1, blockerCount: 1 })),
    ).toBe("Review and accept 1 artifact in Files");
  });

  it("still points at the checklist when stage inputs are genuinely incomplete", () => {
    expect(
      summaryNextAction(viewWith({ ready: 0, total: 1, blockerCount: 0 })),
    ).toBe("Complete the highlighted step below");
    expect(
      summaryNextAction(viewWith({ ready: 2, total: 5, blockerCount: 3 })),
    ).toBe("Complete the highlighted step below");
  });
});
