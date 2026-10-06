import {
  buildCxoAnswerModePromptDirective,
  buildCxoAnswerModeSystemAddendum,
  CXO_ANSWER_MODE_REGISTRY,
} from "../answer-mode-registry";
import {
  classifyAbarvaAnswerMode,
  isPortfolioPrioritizationAsk,
  needsAbarvaSolutionGuidance,
} from "../response-policy";

describe("portfolio prioritization mode", () => {
  it("is reachable now that the mode union carries it", () => {
    const asks = [
      "Prioritize these AI bets by value, readiness, complexity, and dependency.",
      "Prioritize our AI initiatives by value and readiness.",
      "How should we sequence our existing transformation programs?",
      "Rank our current portfolio and tell us where to start.",
      "Triage the backlog we already have and say what to fund.",
    ];
    for (const ask of asks) {
      expect([ask, classifyAbarvaAnswerMode(ask)]).toEqual([
        ask,
        "portfolio_prioritization",
      ]);
    }
  });

  it("does not steal industry discovery asks that rank use cases", () => {
    // These rank things too, but they are about what the industry is doing,
    // not about a set this enterprise already holds.
    const discovery = [
      "Give me the top 5 AI use cases for supply chain and rank them in a 2x2 matrix across value and complexity.",
      "For FS Demo, rank five AI investment use cases by business value and implementation complexity.",
      "What are the AI trends in financial services and which bets should FS Demo prioritize?",
      "Give me the top 5 AI use cases for healthcare with a 2x2 value complexity matrix.",
    ];
    for (const ask of discovery) {
      expect([ask, isPortfolioPrioritizationAsk(ask)]).toEqual([ask, false]);
      expect([ask, classifyAbarvaAnswerMode(ask)]).toEqual([
        ask,
        "industry_trend_to_ai_bets",
      ]);
    }
  });

  it("leaves unrelated asks alone", () => {
    expect(classifyAbarvaAnswerMode("What is our IT budget?")).toBe("general");
    expect(isPortfolioPrioritizationAsk("What is our IT budget?")).toBe(false);
    expect(
      isPortfolioPrioritizationAsk("Which vendors should we renegotiate?"),
    ).toBe(false);
  });

  it("carries a real contract rather than an empty registry entry", () => {
    expect(CXO_ANSWER_MODE_REGISTRY.portfolio_prioritization.active).toBe(true);
    const addendum = buildCxoAnswerModeSystemAddendum(
      "portfolio_prioritization",
    );
    expect(addendum).toContain("PORTFOLIO_PRIORITIZATION ANSWER MODE");
    expect(addendum).toContain("Invest now");
    expect(addendum).toContain("Validate next");
    expect(addendum).toContain("Sequence");
    expect(addendum).toContain("Hold");
    expect(buildCxoAnswerModePromptDirective("portfolio_prioritization")).toContain(
      "ACTIVE ANSWER MODE: portfolio_prioritization",
    );
  });

  it("bars manufactured precision, which is the failure mode of a ranking answer", () => {
    const addendum = buildCxoAnswerModeSystemAddendum(
      "portfolio_prioritization",
    );
    expect(addendum).toContain("83.6/100");
    expect(addendum).toContain("Separate value from readiness");
  });

  it("keeps AbarVa surface guidance for portfolio asks", () => {
    expect(
      needsAbarvaSolutionGuidance("Prioritize our AI initiatives by value and readiness."),
    ).toBe(true);
  });
});
