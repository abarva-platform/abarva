import type { RenderedResponse } from "@/lib/agent/renderedResponse";

const CITATION_MARKERS = [
  "{{cite:",
  "[user-context:",
  "[tenant-specific:",
  "<abv-source",
  "Source basis:",
  // Grounded-deliverable engine form: a humanized source is attached inline
  // (e.g. "[source: Application & Systems Inventory]"). Presence means the
  // answer IS cited — the "no citations" banner must not fire.
  "[source:",
] as const;

const PATTERN_CITATION_REGEX = /\[PAT(?:-[A-Z]+)+-\d+:\s*[^\]]+\]/;

// The grounded-answer engine (answerGrounded) attaches sources as
// "(cited <Source Name> …)". A deterministic product form, not arbitrary prose,
// so it is a reliable positive signal that the answer carries a citation.
const GROUNDED_CITE_REGEX = /\(cited\s+\S/i;

export function hasSubstantiveClaimText(text: string): boolean {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (normalized.length >= 140) return true;
  return (normalized.match(/[.!?](?:\s|$)/g) ?? []).length >= 2;
}

export function hasAgentCitationMarkup(text: string): boolean {
  if (CITATION_MARKERS.some((marker) => text.includes(marker))) return true;
  if (PATTERN_CITATION_REGEX.test(text)) return true;
  return GROUNDED_CITE_REGEX.test(text);
}

export function hasEvidenceBackedSurfaceContext(surfaceContext: unknown): boolean {
  if (!surfaceContext || typeof surfaceContext !== "object") return false;
  const evidenceContext = (surfaceContext as { evidenceContext?: unknown }).evidenceContext;
  if (!evidenceContext || typeof evidenceContext !== "object") return false;
  const usableEvidenceCount = (evidenceContext as { usableEvidenceCount?: unknown }).usableEvidenceCount;
  return typeof usableEvidenceCount === "number" && usableEvidenceCount > 0;
}

export function shouldShowPlainTextCitationGap(
  text: string,
  surfaceContext?: unknown,
): boolean {
  return (
    hasSubstantiveClaimText(text) &&
    !hasAgentCitationMarkup(text) &&
    !hasEvidenceBackedSurfaceContext(surfaceContext)
  );
}

export function shouldShowRenderedResponseCitationGap(
  response: RenderedResponse,
): boolean {
  return (
    response.citations.length === 0 &&
    response.confidence_signal !== "none" &&
    shouldShowPlainTextCitationGap(response.response_text)
  );
}
