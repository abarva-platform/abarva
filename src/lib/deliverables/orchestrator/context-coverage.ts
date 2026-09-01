import type { RenderableDeliverable } from "./types";

export interface ContextCoverage {
  /** Approved document-derived evidence items that exist for this Move. */
  approvedAvailable: number;
  /** Returned by retrieval before budget packing. */
  retrieved: number;
  /** Actually placed in the prompt. */
  packed: number;
  droppedForBudget: number;
  /** Parsed/extracted failures, counted separately and never treated as clean. */
  unreadable: number;
  /** Referenced in the finished artifact. */
  cited: number;
  /** Null when no approved evidence exists, so "no input" is not confused with starvation. */
  coverageRatio: number | null;
  /** Structural signal for dashboards and run polling; do not grep warnings for this. */
  coverageState: "no_approved_evidence" | "packed" | "empty_prompt";
  requiresAttention: boolean;
  /** Approximate evidence tokens placed in the prompt, using chars / 4. */
  usedTokens: number;
  /** Approximate evidence-token budget available to the prompt. */
  evidenceTokenBudget: number;
}

export function buildContextCoverage(input: {
  approvedAvailable?: number;
  retrieved?: number;
  packed?: number;
  droppedForBudget?: number;
  unreadable?: number;
  cited?: number;
  usedTokens?: number;
  evidenceTokenBudget?: number;
}): ContextCoverage {
  const approvedAvailable = Math.max(
    0,
    Math.floor(input.approvedAvailable ?? 0),
  );
  const packed = Math.max(0, Math.floor(input.packed ?? 0));
  const coverageState =
    approvedAvailable === 0
      ? "no_approved_evidence"
      : packed === 0
        ? "empty_prompt"
        : "packed";
  return {
    approvedAvailable,
    retrieved: Math.max(0, Math.floor(input.retrieved ?? 0)),
    packed,
    droppedForBudget: Math.max(0, Math.floor(input.droppedForBudget ?? 0)),
    unreadable: Math.max(0, Math.floor(input.unreadable ?? 0)),
    cited: Math.max(0, Math.floor(input.cited ?? 0)),
    coverageRatio: approvedAvailable > 0 ? packed / approvedAvailable : null,
    coverageState,
    requiresAttention: coverageState === "empty_prompt",
    usedTokens: Math.max(0, Math.floor(input.usedTokens ?? 0)),
    evidenceTokenBudget: Math.max(
      0,
      Math.floor(input.evidenceTokenBudget ?? 0),
    ),
  };
}

export function countCitedEvidence(
  document: RenderableDeliverable | undefined,
): number {
  if (!document) return 0;
  const citations = new Set<number>();
  for (const section of document.generatedSections ?? []) {
    for (const citation of section.citationsUsed ?? []) {
      if (Number.isInteger(citation) && citation > 0) citations.add(citation);
    }
  }
  return citations.size;
}

export function withCitedEvidence(
  coverage: ContextCoverage,
  document: RenderableDeliverable | undefined,
): ContextCoverage {
  return buildContextCoverage({
    ...coverage,
    cited: countCitedEvidence(document),
  });
}
