import {
  executiveVisualForm,
  executiveVisualSelectionContract,
} from "../executive-visual-selection";

it.each([
  [
    "Compare in-house, hybrid and managed-service delivery for one capability",
    "comparison-table",
  ],
  ["Rank the options by value and risk", "comparison-table"],
  ["Give a comparison matrix of build, buy and partner", "comparison-table"],
  ["Compare delivery options, not a 2x2", "comparison-table"],
  ["Compare options without another quadrant matrix", "comparison-table"],
  ["Compare options without charts", "comparison-table"],
  ["Compare options, not a bar chart", "comparison-table"],
  [
    "Show the supplied revenue shares as a horizontal bar chart",
    "numeric-chart",
  ],
  ["Show a line chart of the measured resolution baseline", "numeric-chart"],
  ["What gates are needed before discovery approval?", "gate-table"],
  ["Show three options in an effort/potential 2x2", "qualitative-matrix"],
  ["What is the recorded business model?", "none"],
  ["Explain the decision without any exhibits", "none"],
  ["Where should leadership focus?", "auto"],
] as const)("routes %s to %s", (question, expected) => {
  expect(executiveVisualForm(question)).toBe(expected);
});

it("requires compatible sources and never converts a user target into chart measurements", () => {
  const contract = executiveVisualSelectionContract(
    "Show a bar chart of the proposed target",
  );
  expect(contract).toContain("at least two compatible sourced numeric values");
  expect(contract).toContain("target alone is not a baseline");
  expect(contract).toContain("not invented scores or a substitute quadrant");
});

it("preserves the existing evidence and response boundaries for every visual choice", () => {
  for (const question of [
    "Compare options",
    "Show a line chart",
    "Show a 2x2",
    "What is the model?",
  ]) {
    expect(executiveVisualSelectionContract(question)).toContain(
      "never licenses new facts, calculations, scores or graph edges",
    );
    expect(executiveVisualSelectionContract(question)).toContain(
      "three follow-ups",
    );
  }
});
