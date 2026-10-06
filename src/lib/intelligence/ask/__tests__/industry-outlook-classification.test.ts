import {
  buildCxoAnswerModePromptDirective,
  buildCxoAnswerModeSystemAddendum,
} from "../answer-mode-registry";
import {
  classifyAbarvaAnswerMode,
  isIndustryOutlookAsk,
} from "../response-policy";

describe("industry outlook classification", () => {
  it("routes pure industry-trend asks to the advisory trend contract", () => {
    const asks = [
      "What healthcare trends matter most over the next 12-24 months, and what do they mean specifically for us?",
      "What are the top airline industry trends right now?",
      "Where does our current strategy appear out of step with our capabilities, evidence, or industry direction?",
      "Where is the market heading for claims processing?",
      "What is emerging in our sector that we should be watching?",
    ];
    for (const ask of asks) {
      expect([ask, classifyAbarvaAnswerMode(ask)]).toEqual([
        ask,
        "industry_trend_to_ai_bets",
      ]);
    }
  });

  it("leaves tenant metric time-series to the data surfaces, not the advisory board", () => {
    const towerAsks = [
      "What are the trends in our spend over time?",
      "Show our IT budget trend by quarter",
      "How has our headcount changed over the last three years?",
      "What is our license cost trend?",
    ];
    for (const ask of towerAsks) {
      expect([ask, isIndustryOutlookAsk(ask)]).toEqual([ask, false]);
    }
  });

  it("does not steal asks that belong to other governed modes", () => {
    expect(
      classifyAbarvaAnswerMode(
        "What should we do with member service agent assist?",
      ),
    ).toBe("strategy_to_abarva_solution");
    expect(
      classifyAbarvaAnswerMode("What would AbarVa do next for this AI bet?"),
    ).toBe("strategy_to_abarva_solution");
    expect(classifyAbarvaAnswerMode("What would change this recommendation?")).not.toBe(
      "industry_trend_to_ai_bets",
    );
  });

  it("still classifies the ranked AI-bet asks it always handled", () => {
    expect(
      classifyAbarvaAnswerMode(
        "What are the top 5 AI opportunities for us, and which should we invest in now versus validate first?",
      ),
    ).toBe("industry_trend_to_ai_bets");
  });
});

describe("general advisory contract", () => {
  const addendum = buildCxoAnswerModeSystemAddendum("general");

  it("no longer answers the default mode with an empty contract", () => {
    expect(addendum).toContain("GENERAL ADVISORY ANSWER MODE");
    expect(addendum).toContain("CLASSIFY THE DEPTH BEFORE YOU WRITE");
    expect(buildCxoAnswerModePromptDirective("general")).toContain(
      "ACTIVE ANSWER MODE: general advisory",
    );
  });

  it("protects simple factual asks from executive over-framing", () => {
    expect(addendum).toContain("Over-framing a simple question is a defect");
  });

  it("does not inherit the Moves surface-handoff override", () => {
    // `general` also answers one-line lookups, where "explain how AbarVa would
    // run this through Moves" is noise. The three strategy modes keep it.
    expect(addendum).not.toContain("FORMAT OVERRIDE FOR THIS MODE");
    expect(
      buildCxoAnswerModeSystemAddendum("strategy_to_abarva_solution"),
    ).toContain("FORMAT OVERRIDE FOR THIS MODE");
    expect(
      buildCxoAnswerModeSystemAddendum("industry_trend_to_ai_bets"),
    ).toContain("FORMAT OVERRIDE FOR THIS MODE");
  });

  it("keeps the outlook positioning step on the trend contract", () => {
    const trend = buildCxoAnswerModeSystemAddendum("industry_trend_to_ai_bets");
    expect(trend).toContain("PURE OUTLOOK ASKS");
    expect(trend).toContain("ahead, aligned, behind, or not yet evidenced");
    expect(trend).toContain("EVIDENCE CLASS LABELS");
  });
});
