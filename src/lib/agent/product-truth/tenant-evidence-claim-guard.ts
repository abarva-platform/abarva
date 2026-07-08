// Global aVa Product Truth + Scope Guard — tenant evidence-claim guard.
//
// Generalizes the `traceable_to_grounding` check already proven in
// src/lib/source/ava/answer-quality-gate.ts (every $ figure in a value-mode
// answer must appear verbatim in the grounding block) into a
// surface-agnostic guard: any specific dollar amount or percentage stated
// about the tenant must appear in the grounding text supplied for this turn.
// A missing grounding block (empty string) makes every numeric claim
// unsupported by definition — deterministic and testable.

import type { ProductTruthViolation } from "./types";

const DOLLAR_AMOUNT_PATTERN = /\$\s?[\d,]+(?:\.\d+)?\s?(?:[kmb]|thousand|million|billion)?\b/gi;
const PERCENTAGE_PATTERN = /\b\d+(?:\.\d+)?\s?%/g;

function extractNumericClaims(text: string): string[] {
  const dollarMatches = text.match(DOLLAR_AMOUNT_PATTERN) ?? [];
  const percentMatches = text.match(PERCENTAGE_PATTERN) ?? [];
  return [...dollarMatches, ...percentMatches];
}

function normalize(value: string): string {
  return value.replace(/\s+/g, " ").trim().toLowerCase();
}

export function checkTenantEvidenceClaims(
  text: string,
  groundingText: string,
): ProductTruthViolation[] {
  const claims = extractNumericClaims(text);
  if (claims.length === 0) return [];

  const normalizedGrounding = normalize(groundingText);
  const violations: ProductTruthViolation[] = [];

  for (const claim of claims) {
    if (!normalizedGrounding.includes(normalize(claim))) {
      violations.push({
        category: "unsupported_tenant_claim",
        id: "tenant-evidence-1",
        matchedText: claim,
        detail:
          "This number does not appear in the grounding context supplied for this turn. Never state a tenant-specific figure that wasn't provided — label it 'needs confirmation' instead.",
      });
    }
  }

  return violations;
}
