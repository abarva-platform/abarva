/**
 * The bounds `normalizeReviewedEvidenceExtraction` REFUSES on, exported so the
 * review form can be held to the same numbers instead of carrying its own copy.
 *
 * Only these two are refusals. Every character bound in this module TRUNCATES
 * (`boundedText` slices), so an over-long summary, list item, quote or locator
 * is stored short rather than rejected, and a form has nothing to block on.
 * Keep that distinction: a form that blocked on a truncating bound would refuse
 * an approval the server would have accepted.
 */
export const REVIEWED_EXTRACTION_REFUSAL_LIMITS = {
  /** Items in ANY ONE of the seven reviewed list fields. */
  listItems: 50,
  /** Reviewed evidence references (quote + locator pairs). */
  citations: 30,
} as const;

export interface ReviewedEvidenceCitation {
  quote: string;
  locator: string;
}

export interface ReviewedEvidenceExtraction {
  version: 1;
  summary: string;
  structured: {
    decisions: string[];
    risks: string[];
    baselineCandidates: string[];
    actionItems: string[];
    observations: string[];
    assumptions: string[];
    openQuestions: string[];
    citations: ReviewedEvidenceCitation[];
  };
}

function boundedText(value: unknown, maxLength = 1000): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed ? trimmed.slice(0, maxLength) : null;
}

function textList(value: unknown): string[] | null {
  if (
    !Array.isArray(value) ||
    value.length > REVIEWED_EXTRACTION_REFUSAL_LIMITS.listItems
  )
    return null;
  return value
    .map((item) => boundedText(item, 500))
    .filter((item): item is string => item !== null);
}

export function normalizeReviewedEvidenceExtraction(
  value: unknown,
): ReviewedEvidenceExtraction | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const input = value as Record<string, unknown>;
  const structured = input.structured;
  if (
    !structured ||
    typeof structured !== "object" ||
    Array.isArray(structured)
  )
    return null;
  const fields = structured as Record<string, unknown>;
  const decisions = textList(fields.decisions);
  const risks = textList(fields.risks);
  const baselineCandidates = textList(fields.baselineCandidates);
  const actionItems = textList(fields.actionItems);
  const observations = textList(fields.observations);
  const assumptions = textList(fields.assumptions);
  const openQuestions = textList(fields.openQuestions);
  if (
    [
      decisions,
      risks,
      baselineCandidates,
      actionItems,
      observations,
      assumptions,
      openQuestions,
    ].some((list) => list === null)
  )
    return null;
  if (
    !Array.isArray(fields.citations) ||
    fields.citations.length > REVIEWED_EXTRACTION_REFUSAL_LIMITS.citations
  )
    return null;
  const citations: ReviewedEvidenceCitation[] = [];
  for (const citation of fields.citations) {
    if (!citation || typeof citation !== "object" || Array.isArray(citation))
      return null;
    const record = citation as Record<string, unknown>;
    const quote = boundedText(record.quote, 500);
    const locator = boundedText(record.locator, 200);
    if (!quote || !locator) return null;
    citations.push({ quote, locator });
  }
  const summary = boundedText(input.summary, 3000);
  if (!summary) return null;
  return {
    version: 1,
    summary,
    structured: {
      decisions: decisions!,
      risks: risks!,
      baselineCandidates: baselineCandidates!,
      actionItems: actionItems!,
      observations: observations!,
      assumptions: assumptions!,
      openQuestions: openQuestions!,
      citations,
    },
  };
}

export function reviewedExtractionFromStoredSourceRef(
  value: unknown,
): ReviewedEvidenceExtraction | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const record = value as Record<string, unknown>;
  return normalizeReviewedEvidenceExtraction(record.reviewed_extraction);
}

function sourceTextList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => boundedText(item, 500))
    .filter((item): item is string => item !== null);
}

export function initialReviewedEvidenceExtraction(args: {
  summary: unknown;
  extractedText: unknown;
  extractedStructured: unknown;
}): ReviewedEvidenceExtraction {
  const structured =
    args.extractedStructured &&
    typeof args.extractedStructured === "object" &&
    !Array.isArray(args.extractedStructured)
      ? (args.extractedStructured as Record<string, unknown>)
      : {};
  const flexible =
    structured.flexible &&
    typeof structured.flexible === "object" &&
    !Array.isArray(structured.flexible)
      ? (structured.flexible as Record<string, unknown>)
      : {};
  const citations = Array.isArray(flexible.citations)
    ? flexible.citations.flatMap((item) => {
        if (!item || typeof item !== "object" || Array.isArray(item)) return [];
        const record = item as Record<string, unknown>;
        const quote = boundedText(record.quote, 500);
        const locator = boundedText(record.locator, 200) ?? "source file";
        return quote ? [{ quote, locator }] : [];
      })
    : [];
  const rawText = boundedText(args.extractedText, 3000);
  const summary =
    boundedText(args.summary, 3000) ??
    rawText ??
    "No summary extracted; review the source text before approving.";
  return {
    version: 1,
    summary,
    structured: {
      decisions: sourceTextList(structured.decisions),
      risks: sourceTextList(structured.risks),
      baselineCandidates: sourceTextList(structured.baseline_candidates),
      actionItems: sourceTextList(structured.action_items),
      observations: sourceTextList(flexible.observations),
      assumptions: sourceTextList(flexible.assumptions),
      openQuestions: sourceTextList(flexible.openQuestions),
      citations: citations.slice(
        0,
        REVIEWED_EXTRACTION_REFUSAL_LIMITS.citations,
      ),
    },
  };
}

export function toStoredReviewedStructured(
  extraction: ReviewedEvidenceExtraction,
  originalValue?: unknown,
): Record<string, unknown> {
  const original =
    originalValue &&
    typeof originalValue === "object" &&
    !Array.isArray(originalValue)
      ? (originalValue as Record<string, unknown>)
      : {};
  const originalFlexible =
    original.flexible &&
    typeof original.flexible === "object" &&
    !Array.isArray(original.flexible)
      ? (original.flexible as Record<string, unknown>)
      : {};
  return {
    ...original,
    decisions: extraction.structured.decisions,
    risks: extraction.structured.risks,
    baseline_candidates: extraction.structured.baselineCandidates,
    action_items: extraction.structured.actionItems,
    flexible: {
      ...originalFlexible,
      observations: extraction.structured.observations,
      assumptions: extraction.structured.assumptions,
      openQuestions: extraction.structured.openQuestions,
      citations: extraction.structured.citations,
    },
  };
}
