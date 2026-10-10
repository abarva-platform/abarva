import {
  captureTextStepNotes,
  captureTextStepWords,
  hasUncitedPlanningFigure,
  parseCaptureTextStepRecord,
} from "@/lib/programs/capture-text-step-record";
import {
  captureValueText,
  captureValueGateText,
} from "@/lib/programs/structured-capture-text";

const record = JSON.stringify({
  version: 1,
  entries: {
    business_trigger: {
      text: "A team-owned trigger",
      source: "team",
      status: "accepted",
    },
    problem_statement: {
      text: "Unreviewed proposal",
      source: "ava",
      status: "draft",
    },
  },
});

describe("P0/P1 capture text step records", () => {
  it("makes both text readers use only accepted team words", () => {
    expect(captureTextStepWords(record)).toBe("A team-owned trigger");
    expect(captureValueText("p0_signal_step", record)).toBe(
      "A team-owned trigger",
    );
    expect(captureValueGateText("p0_signal_step", record)).toBe(
      "A team-owned trigger",
    );
    expect(captureValueGateText("business_trigger", "The team's answer")).toBe(
      "The team's answer",
    );
    expect(parseCaptureTextStepRecord("invalid").entries).toEqual({});
  });

  it("fills exact labelled notes into empty fields without rewriting occupied values", () => {
    const proposed = captureTextStepNotes(
      "Business trigger: A verbatim signal\nProblem statement: a gap\nUnknown: ignored",
      [
        { key: "business_trigger", label: "Business trigger" },
        { key: "problem_statement", label: "Problem statement" },
      ],
      { problem_statement: "Already typed" },
    );
    expect(proposed).toEqual({
      business_trigger: {
        text: "A verbatim signal",
        source: "notes",
        status: "draft",
        citation: "Pasted session notes",
      },
    });
  });

  it("holds planning figures until a register row is cited", () => {
    expect(hasUncitedPlanningFigure("Reduce cycle time by 20%.")).toBe(true);
    expect(hasUncitedPlanningFigure("Reduce cycle time by 20% [A:12].")).toBe(
      false,
    );
    expect(
      hasUncitedPlanningFigure(
        "Reduce cycle time by 20% [A:12].\nRaise adoption by 15%.",
      ),
    ).toBe(true);
    expect(
      hasUncitedPlanningFigure("Improve cycle time after Discovery."),
    ).toBe(false);
    expect(
      hasUncitedPlanningFigure("12 of 40 [E:1].", { allowEvidence: true }),
    ).toBe(false);
    expect(hasUncitedPlanningFigure("12 of 40 [E:1].")).toBe(true);
  });

  it("reads P2 step records as accepted team words only", () => {
    for (const key of ["p2_evidence_plan_step", "p2_baseline_step"]) {
      expect(captureValueText(key, record)).toBe("A team-owned trigger");
      expect(captureValueGateText(key, record)).toBe("A team-owned trigger");
    }
  });
});
