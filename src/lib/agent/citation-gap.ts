import type { RenderedResponse } from "@/lib/agent/renderedResponse";

const CITATION_MARKERS = [
  "{{cite:",
  "[user-context:",
  "[tenant-specific:",
  "<abv-source",
  "Source basis:",
] as const;

const PATTERN_CITATION_REGEX = /\[PAT(?:-[A-Z]+)+-\d+:\s*[^\]]+\]/;

export function hasSubstantiveClaimText(text: string): boolean {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (normalized.length >= 140) return true;
  return (normalized.match(/[.!?](?:\s|$)/g) ?? []).length >= 2;
}

export function hasAgentCitationMarkup(text: string): boolean {
  if (CITATION_MARKERS.some((marker) => text.includes(marker))) return true;
  return PATTERN_CITATION_REGEX.test(text);
}

export function shouldShowPlainTextCitationGap(text: string): boolean {
  return hasSubstantiveClaimText(text) && !hasAgentCitationMarkup(text);
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
