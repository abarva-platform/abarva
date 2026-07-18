import {
  buildUniversalAnswerVisualContract,
  isExplicitVisualAsk,
  isRankedDecisionAsk,
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

  it("requires a comparison connective, not just rank + criteria words", () => {
    expect(
      isRankedDecisionAsk("what is our overall AI readiness and value?"),
    ).toBe(false);
  });

  it("matches prioritize-style phrasing with vs comparisons", () => {
    expect(
      isRankedDecisionAsk(
        "prioritize agent assist vs cost transparency by readiness and risk",
      ),
    ).toBe(true);
  });
});
