import {
  isMoneyRow,
  relianceLine,
  rowsStepReliesOn,
  type RelianceRow,
} from "@/lib/programs/assumption-register/step-reliance";

const row = (
  over: Partial<RelianceRow> & Pick<RelianceRow, "registerId">,
): RelianceRow => ({
  area: "adoption",
  seq: Number(over.registerId.replace(/\D/g, "")) || 1,
  statement: `Statement ${over.registerId}`,
  status: "open",
  ownerRole: "Steward lead",
  source: "P1 charter, adoption answer",
  confidence: 1,
  origin: "team",
  raisedStepId: null,
  workingFigure: null,
  answerFigure: null,
  unit: null,
  ...over,
});

const STEP = { stepId: "P3.3", areas: ["adoption"] as const };

describe("the register rows a step relies on", () => {
  it("keeps standing rows in its area or raised on it, in register order", () => {
    const out = rowsStepReliesOn(
      [
        row({ registerId: "A4", status: "confirmed" }),
        row({ registerId: "A1" }),
        row({
          registerId: "V2",
          area: "value",
          raisedStepId: "P3.3",
          status: "corrected",
        }),
        row({ registerId: "D1", area: "data" }),
        row({ registerId: "A2", status: "proposed" }),
        row({ registerId: "A3", status: "superseded" }),
        row({ registerId: "A5", status: "rejected" }),
      ],
      STEP,
    );
    expect(out.rows.map((r) => r.registerId)).toEqual(["A1", "A4", "V2"]);
    expect(out.moneyLeftOut).toBe(0);
  });

  it("leaves a money figure to the estimate, and says how many", () => {
    const out = rowsStepReliesOn(
      [
        row({ registerId: "A1", workingFigure: "$40k a year" }),
        row({ registerId: "A2", unit: "USD", workingFigure: "40000" }),
        row({ registerId: "A3", workingFigure: "~10% of a steward's week" }),
      ],
      STEP,
    );
    expect(out.rows.map((r) => r.registerId)).toEqual(["A3"]);
    expect(out.moneyLeftOut).toBe(2);
    expect(isMoneyRow(row({ registerId: "A9", answerFigure: "€12,000" }))).toBe(
      true,
    );
    expect(
      isMoneyRow(
        row({ registerId: "A9", workingFigure: "~2 days per steward" }),
      ),
    ).toBe(false);
  });

  it("words each row as an ESTIMATE reference: figure, [A:id], status, owner role", () => {
    expect(
      relianceLine(
        row({ registerId: "A1", workingFigure: "~10% of a steward's week" }),
      ),
    ).toEqual({
      text: "~10% of a steward's week",
      cite: "[A:A1] open · Steward lead",
    });
    // A confirmed row stands on its answer.
    expect(
      relianceLine(
        row({
          registerId: "A4",
          status: "confirmed",
          workingFigure: "~3 days",
          answerFigure: "~2 days per steward",
        }),
      ).text,
    ).toBe("~2 days per steward");
    // Withheld or absent figures fall back to the statement, never a number of ours.
    expect(
      relianceLine(
        row({ registerId: "A1", workingFigure: "~10%", figuresRedacted: true }),
      ).text,
    ).toBe("Statement A1");
    expect(relianceLine(row({ registerId: "A2" })).text).toBe("Statement A2");
  });
});
