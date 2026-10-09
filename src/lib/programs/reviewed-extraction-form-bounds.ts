/**
 * Whether the review form's current contents can be APPROVED, and when they
 * cannot, which field is over which bound.
 *
 * `POST .../current-state/evidence/<id>/approve` refuses an approval whose
 * reviewed extraction `normalizeReviewedEvidenceExtraction` will not accept,
 * with `reviewed_extraction_required` — whose sentence tells the reviewer to
 * review the parsed facts and approve the reviewed version. That is the right
 * sentence for an EMPTY form and a fabrication for a full one: the two bounds
 * the contract refuses on (items per list field, evidence references) are
 * numbers no form control states, so a reviewer over either one is told to do
 * the thing they just did, and pressing again is deterministic.
 *
 * The producer that fills the form makes that reachable with no reviewer action
 * at all. `initialReviewedEvidenceExtraction` caps citations at the contract's
 * number but leaves all SEVEN list fields uncapped, so an evidence row whose
 * `extracted_structured` holds more than `listItems` entries in one list opens
 * a form the contract already refuses, with a live Approve button.
 *
 * So the bounds are evaluated HERE, against the same exported numbers the
 * contract refuses on, and named per field with the count and the overage. No
 * list is truncated on the reviewer's behalf — which lines go is theirs to
 * decide, and silently dropping facts a source document records is the one
 * outcome worse than refusing.
 */
import {
  REVIEWED_EXTRACTION_REFUSAL_LIMITS,
  type ReviewedEvidenceExtraction,
} from "@/lib/programs/evidence-review-contract";

/**
 * A reviewed list field — every key of the stored structure except the
 * citations, which are bounded separately and shaped differently.
 *
 * Derived from the contract type on purpose. A hand-typed roster closed with
 * `as const satisfies readonly Field[]` is satisfied by any SUBSET, so an
 * eighth list field could join the contract and this form would keep checking
 * seven. The `Record` below cannot compile without every member.
 */
export type ReviewedExtractionListField = Exclude<
  keyof ReviewedEvidenceExtraction["structured"],
  "citations"
>;

/** Display order is the key order here; `Object.keys` preserves it. */
export const REVIEWED_EXTRACTION_LIST_FIELD_LABELS: Record<
  ReviewedExtractionListField,
  string
> = {
  decisions: "Decisions",
  baselineCandidates: "Baseline candidates",
  risks: "Risks",
  actionItems: "Actions",
  observations: "Observations",
  assumptions: "Assumptions",
  openQuestions: "Open questions",
};

/** The labelled fields in display order, for a form that renders one each. */
export const REVIEWED_EXTRACTION_LIST_FIELDS = Object.keys(
  REVIEWED_EXTRACTION_LIST_FIELD_LABELS,
) as ReviewedExtractionListField[];

export const REVIEWED_EXTRACTION_LIST_FIELD_ENTRIES =
  REVIEWED_EXTRACTION_LIST_FIELDS.map(
    (field) => [field, REVIEWED_EXTRACTION_LIST_FIELD_LABELS[field]] as const,
  );

/** Why an approval cannot be sent yet. One per thing the reviewer must change. */
export type ReviewedExtractionFormBlocker =
  | {
      kind: "summary_empty";
      sentence: string;
    }
  | {
      kind: "list_over_limit";
      field: ReviewedExtractionListField;
      label: string;
      count: number;
      limit: number;
      sentence: string;
    }
  | {
      kind: "citations_over_limit";
      count: number;
      limit: number;
      sentence: string;
    };

/**
 * `canApprove` is the ABSENCE of blockers and is carried as a discriminant so
 * the two cannot disagree. A flat `{ canApprove, blockers }` lets a caller read
 * a true flag beside a populated list, which is exactly the state that put a
 * live button on a refused form.
 */
export type ReviewedExtractionFormVerdict =
  | { canApprove: true; blockers: readonly [] }
  | {
      canApprove: false;
      blockers: readonly [
        ReviewedExtractionFormBlocker,
        ...ReviewedExtractionFormBlocker[],
      ];
    };

function overageSentence(args: {
  subject: string;
  count: number;
  limit: number;
}): string {
  const over = args.count - args.limit;
  return (
    `${args.subject} holds ${args.count} items and at most ${args.limit} ` +
    `are stored. Remove ${over} ${over === 1 ? "item" : "items"} before ` +
    `approving — approval is refused while it is over.`
  );
}

/**
 * Judge the form's current contents against the approval contract.
 *
 * Takes the lists exactly as the form will SEND them (already split into
 * trimmed, non-empty items) so the count judged here is the count the contract
 * will count. A form that evaluated its raw textarea strings would disagree
 * with the server on every blank line.
 */
export function evaluateReviewedExtractionForm(input: {
  summary: string;
  lists: Record<ReviewedExtractionListField, readonly unknown[]>;
  citations: readonly unknown[];
}): ReviewedExtractionFormVerdict {
  const blockers: ReviewedExtractionFormBlocker[] = [];

  if (!input.summary.trim()) {
    blockers.push({
      kind: "summary_empty",
      sentence:
        "A reviewed summary is required. Write what this evidence " +
        "establishes, then approve the reviewed version.",
    });
  }

  const listLimit = REVIEWED_EXTRACTION_REFUSAL_LIMITS.listItems;
  for (const field of REVIEWED_EXTRACTION_LIST_FIELDS) {
    const count = input.lists[field]?.length ?? 0;
    if (count > listLimit) {
      const label = REVIEWED_EXTRACTION_LIST_FIELD_LABELS[field];
      blockers.push({
        kind: "list_over_limit",
        field,
        label,
        count,
        limit: listLimit,
        sentence: overageSentence({
          subject: label,
          count,
          limit: listLimit,
        }),
      });
    }
  }

  const citationLimit = REVIEWED_EXTRACTION_REFUSAL_LIMITS.citations;
  if (input.citations.length > citationLimit) {
    blockers.push({
      kind: "citations_over_limit",
      count: input.citations.length,
      limit: citationLimit,
      sentence: overageSentence({
        subject: "Evidence references",
        count: input.citations.length,
        limit: citationLimit,
      }),
    });
  }

  if (!blockers.length) return { canApprove: true, blockers: [] };
  return {
    canApprove: false,
    blockers: blockers as [
      ReviewedExtractionFormBlocker,
      ...ReviewedExtractionFormBlocker[],
    ],
  };
}
