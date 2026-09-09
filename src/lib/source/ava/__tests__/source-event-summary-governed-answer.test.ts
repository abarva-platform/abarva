import { composeAvaAnswer } from "@/lib/ava-answer/composeAvaAnswer";
import {
  combineSourceEventDecisionAndValueAnswers,
  looksLikeSourceEventDecisionAndValueQuestion,
} from "@/lib/source/ava/source-event-summary-governed-answer";

const tenantKey = "synthetic-enterprise";

describe("Source event decision and value summary", () => {
  it("matches only questions that ask for both decision basis and value", () => {
    expect(
      looksLikeSourceEventDecisionAndValueQuestion(
        "Name the selected vendor and score, then distinguish committed value from realized value.",
      ),
    ).toBe(true);
    expect(
      looksLikeSourceEventDecisionAndValueQuestion(
        "Who was selected and what was the score?",
      ),
    ).toBe(false);
    expect(
      looksLikeSourceEventDecisionAndValueQuestion(
        "What value is committed and realized?",
      ),
    ).toBe(false);
  });

  it("preserves both governed answers, citations, and exhibits", () => {
    const selection = composeAvaAnswer({
      surface: "source",
      mode: "SOURCE",
      tenantKey,
      question: "decision",
      intent: "selection_decision_basis",
      status: "answered",
      directAnswer:
        "Example Services is the documented selection, supported by evaluation score 86.8.",
      tenantFencePassed: true,
      citations: [
        {
          id: "selection-citation",
          label: "Accepted selection memo",
          sourceClass: "tenant-fact",
        },
      ],
      artifacts: [
        {
          artifact: "table",
          id: "selection-table",
          columns: [{ key: "item", label: "Item" }],
          rows: [{ item: "Example Services" }],
        },
      ],
    });
    const value = composeAvaAnswer({
      surface: "source",
      mode: "SOURCE",
      tenantKey,
      question: "value",
      intent: "value_ledger_waterfall",
      status: "answered",
      directAnswer:
        "This event carries $810K of committed Source value. $155K is registered as realized.",
      tenantFencePassed: true,
      citations: [
        {
          id: "value-citation",
          label: "Event value ledger",
          sourceClass: "tenant-fact",
        },
      ],
      artifacts: [
        {
          artifact: "chart",
          id: "value-chart",
          kind: "waterfall",
          data: [],
        },
      ],
    });

    const answer = combineSourceEventDecisionAndValueAnswers({
      question:
        "Name the selected vendor and score, then distinguish committed value from realized value.",
      selection,
      value,
    });

    expect(answer.status).toBe("answered");
    expect(answer.intent).toBe("source_event_decision_and_value_summary");
    expect(answer.directAnswer).toContain("Example Services");
    expect(answer.directAnswer).toContain("86.8");
    expect(answer.directAnswer).toContain("$810K");
    expect(answer.directAnswer).toContain("$155K");
    expect(answer.citations.map((citation) => citation.id)).toEqual([
      "selection-citation",
      "value-citation",
    ]);
    expect(answer.artifacts.map((artifact) => artifact.id)).toEqual([
      "selection-table",
      "value-chart",
    ]);
    expect(answer.safety.tenantFencePassed).toBe(true);
  });
});
