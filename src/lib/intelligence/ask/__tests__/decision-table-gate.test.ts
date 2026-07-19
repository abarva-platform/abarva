import {
  buildUniversalAnswerVisualContract,
  isExplicitVisualAsk,
  isRankedDecisionAsk,
  rankedDecisionPromptDirectiveForQuery,
} from "@/lib/intelligence/ask/synthesizer";

describe("isRankedDecisionAsk", () => {
  it("keeps the decision-table instructions in the universal contract, not only in regex-gated prompts", () => {
    const contract = buildUniversalAnswerVisualContract();

    expect(contract).toContain("UNIVERSAL aVa ANSWER + VISUAL CONTRACT");
    expect(contract).toContain("```decision-table");
    expect(contract).toContain("```chart");
    expect(contract).toContain("```followups");
    expect(contract).toContain("not yet evidenced");
  });

  it("matches the reported ranking query even though it lacks any isExplicitVisualAsk keyword", () => {
    const query =
      "rank agent assist vs payment integrity vs cost transparency by value, complexity, readiness";
    expect(isRankedDecisionAsk(query)).toBe(true);
    // This gap is exactly why the decision-table first-pass prompt cannot be
    // gated behind isExplicitVisualAsk alone — "rank" is not in its word list
    // (only "ranking"/"ranked" are), so this query would otherwise fall
    // through to the generic prose contract with no table-first instruction.
    expect(isExplicitVisualAsk(query)).toBe(false);
  });

  it("matches top-N use-case ranking by value and complexity without vs phrasing", () => {
    expect(
      isRankedDecisionAsk(
        "For FS Demo, rank five AI investment use cases by business value and implementation complexity.",
      ),
    ).toBe(true);
    expect(
      isRankedDecisionAsk(
        "rank five AI use cases by value, complexity, and readiness",
      ),
    ).toBe(true);
  });

  it("injects a first-pass decision-table directive for top-N visual rankings", () => {
    const directive = rankedDecisionPromptDirectiveForQuery(
      "For FS Demo, rank five AI investment use cases by business value and implementation complexity.",
    );

    expect(directive).toContain("MANDATORY FOR THIS USER QUESTION");
    expect(directive).toContain("```decision-table");
    expect(directive).toContain("valueScore");
    expect(directive).toContain("complexityScore");
    expect(directive).toContain(
      "The fenced decision-table is the chart payload",
    );
  });

  it("does not inject the first-pass directive for broad criteria questions", () => {
    expect(
      rankedDecisionPromptDirectiveForQuery(
        "what is our overall AI readiness and value?",
      ),
    ).toBe("");
  });

  it("does not match a generic visual ask with no named items to compare", () => {
    const query = "i need the ai trends in industry- tables and charts";
    expect(isRankedDecisionAsk(query)).toBe(false);
    // This one IS covered by isExplicitVisualAsk's generic mandatory-table
    // path instead — verifying the two gates are complementary, not
    // redundant.
    expect(isExplicitVisualAsk(query)).toBe(true);
  });

  it("treats top-N as explicit but keeps broad prioritization concise", () => {
    expect(isExplicitVisualAsk("give me the top 5 AI bets")).toBe(true);
    expect(isExplicitVisualAsk("what AI bets should we prioritize next?")).toBe(
      false,
    );
  });

  it("requires named or counted items, not just broad criteria words", () => {
    expect(
      isRankedDecisionAsk("what is our overall AI readiness and value?"),
    ).toBe(false);
    expect(isRankedDecisionAsk("rank by value and complexity")).toBe(false);
  });

  it("matches prioritize-style phrasing with vs comparisons", () => {
    expect(
      isRankedDecisionAsk(
        "prioritize agent assist vs cost transparency by readiness and risk",
      ),
    ).toBe(true);
  });
});
