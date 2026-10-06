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
    expect(VISIBLE_ANSWER_CONTRACT_PROMPT).toContain(
      "No session-history phrases",
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

  it("blocks Tower stock endings and generic next-step scaffolding", () => {
    const gate = assertVisibleAnswerContract(
      [
        "Start with the four value-lag programs.",
        "Next: ask aVa to inspect the supporting evidence, compare options, or shape the next CIO action.",
      ].join("\n"),
    );

    expect(gate.passed).toBe(false);
    expect(gate.violations.map((violation) => violation.id)).toEqual(
      expect.arrayContaining([
        "scaffolding_label_next",
        "stock_generic_closing",
      ]),
    );
  });

  it("blocks dashboard stock prompts and read-model jargon", () => {
    const gate = assertVisibleAnswerContract(
      "Ask me to inspect pressure spend, benchmark AI ROI, challenge vendor renewals, or shape this into a board readout from the Tower read-model.",
    );

    expect(gate.passed).toBe(false);
    expect(gate.violations.map((violation) => violation.id)).toEqual(
      expect.arrayContaining([
        "stock_generic_closing",
        "internal_dossier_terms",
      ]),
    );
  });

  it("blocks answer-construction recovery language", () => {
    const gate = assertVisibleAnswerContract(
      "I tightened the wording before display because the first draft exposed answer-construction language instead of executive prose.",
    );

    expect(gate.passed).toBe(false);
    expect(gate.violations.map((violation) => violation.id)).toContain(
      "answer_construction_language",
    );
  });

  it("blocks session-history language in visible answers", () => {
    const gate = assertVisibleAnswerContract(
      "Same answer as the last four turns: fix certified operational data first.",
    );
    const allSessionGate = assertVisibleAnswerContract(
      "The answer is the same one the evidence has supported all session: fix certified operational data first.",
    );
    const movedGate = assertVisibleAnswerContract(
      "The answer hasn't moved across this session: fix certified operational data first.",
    );

    expect(gate.passed).toBe(false);
    expect(gate.violations.map((violation) => violation.id)).toContain(
      "session_history_language",
    );
    expect(allSessionGate.passed).toBe(false);
    expect(allSessionGate.violations.map((violation) => violation.id)).toContain(
      "session_history_language",
    );
    expect(movedGate.passed).toBe(false);
    expect(movedGate.violations.map((violation) => violation.id)).toContain(
      "session_history_language",
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

/**
 * Checks restored after a July 2026 refactor narrowed this gate. Each describes
 * output a user should never be shown: nothing at all, an internal identifier,
 * an internal table name, or a developer artifact.
 */
describe("visible answer contract · restored checks", () => {
  const ids = (text: string) =>
    assertVisibleAnswerContract(text).violations.map(
      (violation) => violation.id,
    );

  it("refuses a blank answer", () => {
    expect(ids("")).toContain("blank_answer");
    expect(ids("   \n  ")).toContain("blank_answer");
  });

  it("catches a raw UUID, which the uppercase record-id pattern cannot match", () => {
    expect(
      ids(
        "The renewal owner is recorded as 3f2504e0-4f89-11d3-9a0c-0305e82c3301 in the register.",
      ),
    ).toContain("raw_uuid");
  });

  it("catches an internal table name", () => {
    expect(ids("That figure comes from enterprise_context_chunks.")).toContain(
      "internal_table_name",
    );
    expect(ids("Loaded via mv_tower_spend last night.")).toContain(
      "internal_table_name",
    );
  });

  it("catches debug markers, filesystem paths and stack traces", () => {
    expect(ids("See /Users/someone/projects for the file.")).toContain(
      "debug_or_path",
    );
    expect(ids("A stack trace was written to the log.")).toContain(
      "debug_or_path",
    );
  });

  it("still allows business prose that happens to discuss data formats", () => {
    // This gate returns 422 to the caller, so a false positive costs the user
    // their answer. Advising on a vendor integration is not a contract breach.
    const text =
      "The vendor delivers JSON extracts nightly, which is why the reconciliation lands a day late.";
    expect(ids(text)).not.toContain("internal_table_name");
    expect(assertVisibleAnswerContract(text).passed).toBe(true);
  });

  /**
   * The prompt used to ban "source keys" flatly while CITATION_INSTRUCTION,
   * in the same prompt, required the model to quote "the exact source_key
   * shown with the chunk" and gave worked examples. Two mutually exclusive
   * instructions, with nothing saying which governed.
   *
   * The enforcement below was never actually in conflict — SOURCE_KEY_RE
   * matches a storage-shaped key (uppercase letter, digits, snake_case) and
   * has never matched a citation key. So the prose was corrected to match the
   * enforcement rather than the enforcement widened to match the prose, and
   * nothing a reader sees changed.
   *
   * These cases pin both sides of that line against the literal examples
   * CITATION_INSTRUCTION ships, so the prompt and the regex cannot drift apart
   * again without one of them going red.
   */
  describe("a citation key is not a leaked source key", () => {
    // Copied from the Examples block of CITATION_INSTRUCTION in
    // src/lib/agent/retrieval-format.ts. If that block changes, these should
    // be re-checked against it — that is the point of using its own examples.
    const CITED = [
      "NIST AI RMF [nist_ai_rmf_1_0 § 3.2.1] requires continuous monitoring of deployed models.",
      "The HIPAA Security Rule [hhs_hipaa_security_rule § 164.308] requires a documented risk analysis.",
      "CMS national median readmission is 21.8% [cms_hospital_compare].",
    ];

    it.each(CITED)("passes an answer citing a public source: %s", (text) => {
      expect(ids(text)).not.toContain("source_key");
      expect(assertVisibleAnswerContract(text).passed).toBe(true);
    });

    it("still catches a storage-shaped key", () => {
      expect(
        ids("The figure comes from A12_tenant_evidence_rows for this quarter."),
      ).toContain("source_key");
      expect(
        ids("It landed in S3_raw_landing_zone before the nightly build."),
      ).toContain("source_key");
    });

    it("no longer tells the model to suppress the citations it is also told to emit", () => {
      // The contradiction itself. The prohibition must not ban the general
      // category the citation contract requires.
      expect(VISIBLE_ANSWER_CONTRACT_PROMPT).not.toContain("source keys,");
      expect(VISIBLE_ANSWER_CONTRACT_PROMPT).toContain("storage-shaped keys");
      expect(VISIBLE_ANSWER_CONTRACT_PROMPT).toContain(
        "Citing a source document is the exception",
      );
    });
  });
});

/**
 * The four scaffolding-label patterns were written as `(?:^|\n)\s*Label:`.
 * `\s` matches spaces, tabs and newlines — it does NOT match a list marker or
 * an emphasis marker. So every decorated form of the same label passed:
 * `- Next:`, `* Next:`, `1. Next:`, `**Next:**`.
 *
 * That matters more than a general widening would, because the bulleted form
 * is the one #4038 actually removed from the product. The gate written to stop
 * it from coming back could not see it. The four labels share one literal
 * shape, so all four had the same hole and are fixed together rather than one
 * being fixed and three left.
 *
 * This gate returns 422 on four routes and forces a degraded fallback on a
 * fifth, so a false positive costs the user their answer. The reach is
 * therefore widened only across decoration of the same label token — the
 * cases below pin both what that now catches and what it deliberately does
 * not.
 */
describe("visible answer contract · a scaffolding label is still a label when it is decorated", () => {
  const ids = (text: string) =>
    assertVisibleAnswerContract(text).violations.map(
      (violation) => violation.id,
    );

  const BODY = "The portfolio has pressure in value attainment.";

  const DECORATIONS = [
    ["unordered dash", "- "],
    ["unordered asterisk", "* "],
    ["unordered plus", "+ "],
    ["ordered with a period", "1. "],
    ["ordered with a parenthesis", "2) "],
    ["indented under a parent bullet", "  - "],
    ["bold", "**"],
    ["italic underscore", "_"],
  ] as const;

  describe.each(DECORATIONS)("%s", (_name, decoration) => {
    it.each([
      ["Next:", "scaffolding_label_next"],
      ["Next move:", "scaffolding_label_next_move"],
      ["Read:", "scaffolding_label_read"],
      ["Evidence:", "scaffolding_label_evidence"],
    ])("catches %s", (label, violationId) => {
      expect(
        ids(`${BODY}\n\n${decoration}${label} open the cited initiative.`),
      ).toContain(violationId);
    });
  });

  it("catches the bulleted closing that #4038 removed from the product", () => {
    // The concrete regression this gate exists to stop, in the exact shape the
    // shared shaper used to append.
    expect(
      ids(`${BODY}\n\n- Next: open the value-attainment review with the owner.`),
    ).toContain("scaffolding_label_next");
  });

  it("does not fire on a blockquote, and that is a decision rather than an oversight", () => {
    // A `>` line is quoted material — a clause from a vendor's own document,
    // not the model's scaffolding. This gate returns 422, so quoting a
    // supplier deadline must not cost the user the whole answer. If a future
    // reader wants blockquotes covered, the cost to weigh is that one.
    expect(
      ids(`${BODY}\n\n> Next: submit the renewal notice by 30 June.`),
    ).not.toContain("scaffolding_label_next");
  });

  it("leaves the label words alone inside ordinary advisor prose", () => {
    // Each of these contains a label word and must still pass: position and
    // decoration are the signal, not the word.
    const clean = [
      "The next renewal lands in March, and the next review after it is unscheduled.",
      "- The next contract to open is the managed-services renewal.",
      "Read the vendor's own SOC 2 report before you sign anything.",
      "- Evidence of the overrun is in the invoices the CFO already has.",
      "**Next year** the same clause auto-renews unless someone acts.",
      "The board asked what the evidence was; it is thinner than the paper suggests.",
    ];
    for (const text of clean) {
      expect(assertVisibleAnswerContract(text).passed).toBe(true);
    }
  });

  it("requires the label to lead the line, not merely appear on it", () => {
    // Position is half the signal. A label word with a colon after it in the
    // middle of a sentence is ordinary English, and this gate returns 422 —
    // so a widening that dropped the line-start anchor would cost the user
    // their answer for writing a normal sentence.
    const midLine = [
      "He asked me to read: the contract, the invoices, and the statement of work.",
      "There is one thing to do next: name an owner for the integration risk.",
      "The question the board will ask is about evidence: whether any of it is current.",
    ];
    for (const text of midLine) {
      expect(assertVisibleAnswerContract(text).passed).toBe(true);
    }
  });

  it("still catches the undecorated form it always caught", () => {
    expect(ids(`${BODY}\n\nNext: open the cited initiative.`)).toContain(
      "scaffolding_label_next",
    );
    expect(ids(`${BODY}\n\n   Read: the renewal file.`)).toContain(
      "scaffolding_label_read",
    );
  });
});
