import {
  initialReviewedEvidenceExtraction,
  normalizeReviewedEvidenceExtraction,
  REVIEWED_EXTRACTION_REFUSAL_LIMITS,
  type ReviewedEvidenceExtraction,
} from "@/lib/programs/evidence-review-contract";
import {
  evaluateReviewedExtractionForm,
  REVIEWED_EXTRACTION_LIST_FIELDS,
  type ReviewedExtractionFormBlocker,
  type ReviewedExtractionFormVerdict,
  REVIEWED_EXTRACTION_LIST_FIELD_ENTRIES,
  REVIEWED_EXTRACTION_LIST_FIELD_LABELS,
  type ReviewedExtractionListField,
} from "@/lib/programs/reviewed-extraction-form-bounds";

const lines = (count: number): string[] =>
  Array.from({ length: count }, (_, index) => `item ${index + 1}`);

const citations = (count: number) =>
  Array.from({ length: count }, (_, index) => ({
    quote: `quote ${index + 1}`,
    locator: "page 1",
  }));

/** The payload shape the review form sends, with one field overridden. */
function formInput(
  overrides: {
    summary?: string;
    field?: ReviewedExtractionListField;
    count?: number;
    citationCount?: number;
  } = {},
) {
  const lists = Object.fromEntries(
    REVIEWED_EXTRACTION_LIST_FIELDS.map((field) => [
      field,
      field === overrides.field ? lines(overrides.count ?? 0) : [],
    ]),
  ) as Record<ReviewedExtractionListField, string[]>;
  return {
    summary: overrides.summary ?? "What this evidence establishes.",
    lists,
    citations: citations(overrides.citationCount ?? 0),
  };
}

/** The same values as a `ReviewedEvidenceExtraction`, for the contract side. */
function extractionFrom(
  input: ReturnType<typeof formInput>,
): ReviewedEvidenceExtraction {
  return {
    version: 1,
    summary: input.summary,
    structured: {
      ...(input.lists as ReviewedEvidenceExtraction["structured"]),
      citations: input.citations,
    },
  };
}

/**
 * The blockers of a verdict that must be unapprovable.
 *
 * `expect(...).toBe(false)` does not narrow the verdict union, so reading
 * `verdict.blockers[0].field` off it is unchecked at the type level. Narrowing
 * on the discriminant is what makes the tuple non-empty and the member fields
 * reachable.
 */
function blockersOf(
  verdict: ReviewedExtractionFormVerdict,
): readonly ReviewedExtractionFormBlocker[] {
  if (verdict.canApprove) {
    throw new Error("expected an unapprovable form verdict");
  }
  return verdict.blockers;
}

/** The one blocker of the given kind, or a failure naming what was there. */
function blockerOfKind<Kind extends ReviewedExtractionFormBlocker["kind"]>(
  verdict: ReviewedExtractionFormVerdict,
  kind: Kind,
): Extract<ReviewedExtractionFormBlocker, { kind: Kind }> {
  const blockers = blockersOf(verdict);
  const found = blockers.find((blocker) => blocker.kind === kind);
  if (!found) {
    throw new Error(
      `no ${kind} blocker; got ${blockers.map((b) => b.kind).join(", ")}`,
    );
  }
  return found as Extract<ReviewedExtractionFormBlocker, { kind: Kind }>;
}

describe("reviewed extraction form bounds", () => {
  it("names every reviewed list field the approval contract declares", () => {
    const contractFields = Object.keys(
      extractionFrom(formInput()).structured,
    ).filter((key) => key !== "citations");
    expect([...REVIEWED_EXTRACTION_LIST_FIELDS].sort()).toEqual(
      contractFields.sort(),
    );
    expect(REVIEWED_EXTRACTION_LIST_FIELD_ENTRIES).toHaveLength(
      REVIEWED_EXTRACTION_LIST_FIELDS.length,
    );
    for (const [field, label] of REVIEWED_EXTRACTION_LIST_FIELD_ENTRIES) {
      expect(label).toBe(REVIEWED_EXTRACTION_LIST_FIELD_LABELS[field]);
      expect(label.trim()).not.toBe("");
    }
  });

  // The property that matters: the form's verdict and the server's acceptance
  // are the SAME decision, so a bound that drifts on either side is red. A form
  // that allowed a payload the contract refuses is the defect this closes; a
  // form that refused one the contract accepts would be the mirror of it.
  describe("agrees with the approval contract at and over every refusal bound", () => {
    const listLimit = REVIEWED_EXTRACTION_REFUSAL_LIMITS.listItems;
    const citationLimit = REVIEWED_EXTRACTION_REFUSAL_LIMITS.citations;

    for (const field of REVIEWED_EXTRACTION_LIST_FIELDS) {
      it(`${field}: ${listLimit} is approvable and ${listLimit + 1} is refused by both`, () => {
        const atLimit = formInput({ field, count: listLimit });
        expect(evaluateReviewedExtractionForm(atLimit).canApprove).toBe(true);
        expect(
          normalizeReviewedEvidenceExtraction(extractionFrom(atLimit)),
        ).not.toBeNull();

        const overLimit = formInput({ field, count: listLimit + 1 });
        const verdict = evaluateReviewedExtractionForm(overLimit);
        expect(verdict.canApprove).toBe(false);
        expect(
          normalizeReviewedEvidenceExtraction(extractionFrom(overLimit)),
        ).toBeNull();
      });
    }

    it(`citations: ${citationLimit} is approvable and ${citationLimit + 1} is refused by both`, () => {
      const atLimit = formInput({ citationCount: citationLimit });
      expect(evaluateReviewedExtractionForm(atLimit).canApprove).toBe(true);
      expect(
        normalizeReviewedEvidenceExtraction(extractionFrom(atLimit)),
      ).not.toBeNull();

      const overLimit = formInput({ citationCount: citationLimit + 1 });
      expect(evaluateReviewedExtractionForm(overLimit).canApprove).toBe(false);
      expect(
        normalizeReviewedEvidenceExtraction(extractionFrom(overLimit)),
      ).toBeNull();
    });

    it("an empty summary is refused by both", () => {
      const blank = formInput({ summary: "   " });
      expect(evaluateReviewedExtractionForm(blank).canApprove).toBe(false);
      expect(
        normalizeReviewedEvidenceExtraction(extractionFrom(blank)),
      ).toBeNull();
    });
  });

  it("names the field, the count and how many to remove for a list overage", () => {
    const limit = REVIEWED_EXTRACTION_REFUSAL_LIMITS.listItems;
    const verdict = evaluateReviewedExtractionForm(
      formInput({ field: "baselineCandidates", count: limit + 3 }),
    );
    expect(verdict.canApprove).toBe(false);
    const blocker = blockerOfKind(verdict, "list_over_limit");
    expect(blocker.field).toBe("baselineCandidates");
    expect(blocker.count).toBe(limit + 3);
    expect(blocker.limit).toBe(limit);
    // The label, not the key: a reviewer looks for the field heading on screen.
    expect(blocker.sentence).toContain(
      REVIEWED_EXTRACTION_LIST_FIELD_LABELS.baselineCandidates,
    );
    expect(blocker.sentence).toContain(String(limit + 3));
    expect(blocker.sentence).toContain(String(limit));
    // How many to remove — the action, stated as a number, not "too many".
    expect(blocker.sentence).toMatch(/Remove 3 items/);
  });

  it("states a singular overage as one item", () => {
    const verdict = evaluateReviewedExtractionForm(
      formInput({
        field: "risks",
        count: REVIEWED_EXTRACTION_REFUSAL_LIMITS.listItems + 1,
      }),
    );
    const sentence = blockerOfKind(verdict, "list_over_limit").sentence;
    expect(sentence).toMatch(/Remove 1 item\b/);
    expect(sentence).not.toMatch(/Remove 1 items/);
  });

  it("names the evidence references separately from the list fields", () => {
    const limit = REVIEWED_EXTRACTION_REFUSAL_LIMITS.citations;
    const verdict = evaluateReviewedExtractionForm(
      formInput({ citationCount: limit + 2 }),
    );
    expect(verdict.canApprove).toBe(false);
    const blocker = blockerOfKind(verdict, "citations_over_limit");
    expect(blocker.sentence).toContain("Evidence references");
    expect(blocker.sentence).toContain(String(limit + 2));
    expect(blocker.count).toBe(limit + 2);
  });

  it("reports every blocker at once, so one fix does not reveal the next", () => {
    const limits = REVIEWED_EXTRACTION_REFUSAL_LIMITS;
    const input = formInput({
      summary: "",
      field: "observations",
      count: limits.listItems + 1,
      citationCount: limits.citations + 1,
    });
    input.lists.decisions = lines(limits.listItems + 1);
    const verdict = evaluateReviewedExtractionForm(input);
    expect(verdict.canApprove).toBe(false);
    expect(blockersOf(verdict).map((blocker) => blocker.kind)).toEqual([
      "summary_empty",
      "list_over_limit",
      "list_over_limit",
      "citations_over_limit",
    ]);
    const overFields = blockersOf(verdict).flatMap((blocker) =>
      blocker.kind === "list_over_limit" ? [blocker.field] : [],
    );
    expect(overFields.sort()).toEqual(["decisions", "observations"]);
  });

  it("an approvable form carries no blockers to render", () => {
    const verdict = evaluateReviewedExtractionForm(formInput());
    expect(verdict.canApprove).toBe(true);
    expect(verdict.blockers).toHaveLength(0);
  });

  it("every blocker sentence says approval is refused while it stands", () => {
    const limits = REVIEWED_EXTRACTION_REFUSAL_LIMITS;
    const inputs = [
      formInput({ summary: "" }),
      formInput({ field: "actionItems", count: limits.listItems + 1 }),
      formInput({ citationCount: limits.citations + 1 }),
    ];
    const kinds = new Set<string>();
    for (const input of inputs) {
      for (const blocker of blockersOf(evaluateReviewedExtractionForm(input))) {
        kinds.add(blocker.kind);
        expect(blocker.sentence).toMatch(/approv/i);
        expect(blocker.sentence.length).toBeGreaterThan(40);
      }
    }
    // All three kinds exercised, so none can lose its sentence unchecked.
    expect([...kinds].sort()).toEqual([
      "citations_over_limit",
      "list_over_limit",
      "summary_empty",
    ]);
  });

  // The reachability this closes: the producer that FILLS the form caps the
  // citations at the contract's number and caps no list at all, so a stored
  // row can open a form the contract already refuses with no reviewer action.
  it("judges a form the stored-row producer can fill as unapprovable", () => {
    const limits = REVIEWED_EXTRACTION_REFUSAL_LIMITS;
    const produced = initialReviewedEvidenceExtraction({
      summary: "Stored summary",
      extractedText: "source text",
      extractedStructured: {
        decisions: lines(limits.listItems + 10),
        flexible: { citations: citations(limits.citations + 10) },
      },
    });
    // The producer bounds the citations and not the list.
    expect(produced.structured.citations).toHaveLength(limits.citations);
    expect(produced.structured.decisions).toHaveLength(limits.listItems + 10);
    // The contract refuses exactly that payload.
    expect(normalizeReviewedEvidenceExtraction(produced)).toBeNull();
    // And the form now says so instead of offering a live Approve.
    const verdict = evaluateReviewedExtractionForm({
      summary: produced.summary,
      lists: produced.structured as unknown as Record<
        ReviewedExtractionListField,
        string[]
      >,
      citations: produced.structured.citations,
    });
    expect(verdict.canApprove).toBe(false);
    expect(blockerOfKind(verdict, "list_over_limit").field).toBe("decisions");
  });
});
