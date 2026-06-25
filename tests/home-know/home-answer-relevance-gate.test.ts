import { assessHomeAnswerRelevance } from "@/lib/home/know/home-answer-relevance-gate";

describe("Home answer relevance gate", () => {
  it("passes a direct org answer using the organization binder", () => {
    const result = assessHomeAnswerRelevance({
      question: "How is our IT and business organized today?",
      answerText:
        "SkyHarbor is organized around business functions and domain-aligned technology teams. The loaded context names the CIO and shows ownership by portfolio.",
      primaryDimension: "organization_leadership",
      relatedDimensions: ["application_systems", "budget_financials"],
      targetSurface: "home",
      handoffTarget: null,
    });

    expect(result.passed).toBe(true);
  });

  it("fails when the answer uses the wrong dimension binder", () => {
    const result = assessHomeAnswerRelevance({
      question: "Which vendors create the largest operational dependency footprint?",
      answerText:
        "The loaded vendor context shows commercial and operational dependency by supplier and supported system.",
      primaryDimension: "application_systems",
      relatedDimensions: ["data_analytics"],
      targetSurface: "home",
      handoffTarget: null,
    });

    expect(result.issues).toContain("wrong_dimension_binder");
  });

  it("fails strategy questions that stay in Home without handoff", () => {
    const result = assessHomeAnswerRelevance({
      question: "Where should SkyHarbor place the next $30M in AI?",
      answerText:
        "SkyHarbor has AI initiatives across operations, customer, and data platforms.",
      primaryDimension: "ai_value_governance",
      relatedDimensions: ["data_analytics", "budget_financials"],
      targetSurface: "home",
      handoffTarget: null,
    });

    expect(result.issues).toContain("missing_decision_handoff");
  });

  it("fails requested table/chart/graph questions when typed artifacts are absent", () => {
    const result = assessHomeAnswerRelevance({
      question: "Show me a table and chart of our applications by domain.",
      answerText:
        "The application estate is concentrated in operations, finance, and data domains.",
      primaryDimension: "application_systems",
      relatedDimensions: ["organization_leadership"],
      targetSurface: "home",
      handoffTarget: null,
      tablesCount: 0,
      chartsCount: 0,
    });

    expect(result.issues).toEqual(
      expect.arrayContaining(["missing_requested_table", "missing_requested_chart"]),
    );
  });

  it("fails internal dossier language and count-first answers", () => {
    const result = assessHomeAnswerRelevance({
      question: "What does the data and analytics estate tell us?",
      answerText:
        "There are 82 rows in the primary dimension binder. The artifact plan includes table and chart.",
      primaryDimension: "data_analytics",
      relatedDimensions: ["application_systems"],
      targetSurface: "home",
      handoffTarget: null,
    });

    expect(result.issues).toEqual(
      expect.arrayContaining(["internal_dossier_language", "count_instead_of_insight"]),
    );
  });

  it("fails answers that do not address the important question terms", () => {
    const result = assessHomeAnswerRelevance({
      question: "Who leads cybersecurity and what is its budget?",
      answerText:
        "The application estate has several important platforms and some ownership gaps.",
      primaryDimension: "risk_compliance",
      relatedDimensions: ["application_systems"],
      targetSurface: "home",
      handoffTarget: null,
    });

    expect(result.issues).toContain("does_not_directly_answer_question");
  });
});
