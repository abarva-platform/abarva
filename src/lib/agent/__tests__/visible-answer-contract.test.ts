import {
  VISIBLE_ANSWER_CONTRACT_PROMPT,
  assertVisibleAnswerContract,
} from "../visible-answer-contract";

describe("visible answer contract", () => {
  it("documents the senior advisor prompt contract", () => {
    expect(VISIBLE_ANSWER_CONTRACT_PROMPT).toContain(
      "You are a senior CXO advisor for AbarVa.",
    );
    expect(VISIBLE_ANSWER_CONTRACT_PROMPT).toContain("Claude owns the answer");
    expect(VISIBLE_ANSWER_CONTRACT_PROMPT).toContain(
      "AbarVa owns context, safety, routing, artifacts, and rendering",
    );
    expect(VISIBLE_ANSWER_CONTRACT_PROMPT).toContain(
      "No visible scaffolding labels",
    );
  });

  it("accepts concise advisor prose", () => {
    const gate = assertVisibleAnswerContract(
      "The right call is to pause the expansion until the CIO has named an owner for the integration risk. The current portfolio can absorb one cleanup sprint, but not another unfunded dependency.",
    );

    expect(gate.passed).toBe(true);
    expect(gate.violations).toEqual([]);
  });

  it("blocks template labels, raw identifiers, and internal machinery language", () => {
    const gate = assertVisibleAnswerContract(
      [
        "Read: LAK-INIT-0017 should move now.",
        "Evidence: tenant evidence rows came from F12_it_budget_financials.",
        "Next move: inspect the semantic packet.",
      ].join("\n"),
    );

    expect(gate.passed).toBe(false);
    expect(gate.violations.map((violation) => violation.id)).toEqual(
      expect.arrayContaining([
        "raw_record_id",
        "source_key",
        "scaffolding_label_read",
        "scaffolding_label_evidence",
        "scaffolding_label_next_move",
        "implementation_tenant_evidence",
        "implementation_semantic_packet",
        "implementation_rows",
      ]),
    );
  });

  it("blocks legacy Atlas branding in visible answers", () => {
    const gate = assertVisibleAnswerContract(
      "Atlas needs the portfolio evidence base to synthesize observations.",
    );

    expect(gate.passed).toBe(false);
    expect(gate.violations.map((violation) => violation.id)).toContain(
      "atlas_branding",
    );
  });
});
