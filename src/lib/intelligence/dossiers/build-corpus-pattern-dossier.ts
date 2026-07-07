import type { AskSource } from "@/lib/intelligence/ask/types";
import type {
  CorpusPatternDossier,
  IntelligenceCitation,
  IntelligenceRoute,
} from "./types";

function sourceLabel(source: AskSource, index: number): string {
  return source.name || source.id || `Corpus source ${index + 1}`;
}

function summarize(detail: string, max = 260): string {
  const compact = detail.replace(/\s+/g, " ").trim();
  return compact.length > max ? `${compact.slice(0, max - 1).trimEnd()}…` : compact;
}

function confidenceFromSource(source: AskSource): "strong" | "moderate" | "directional" {
  const confidence = source.confidence ?? 0;
  if (confidence >= 0.82) return "strong";
  if (confidence >= 0.62) return "moderate";
  return "directional";
}

function citationFor(source: AskSource, index: number): IntelligenceCitation {
  return {
    id: `corpus-${index + 1}`,
    label: sourceLabel(source, index),
    sourceClass:
      source.type === "BENCHMARK"
        ? "benchmark"
        : source.type === "WORLDVIEW"
          ? "worldview"
          : "corpus-pattern",
    sourceId: source.id,
    confidence:
      (source.confidence ?? 0) >= 0.82
        ? "high"
        : (source.confidence ?? 0) >= 0.62
          ? "medium"
          : "low",
  };
}

export function buildCorpusPatternDossier(input: {
  route: IntelligenceRoute;
  sources: AskSource[];
}): CorpusPatternDossier {
  const corpusSources = input.sources.filter((source) =>
    ["PATTERN", "WORLDVIEW", "BENCHMARK", "RESEARCH", "REGULATION"].includes(source.type),
  );
  const selected = corpusSources.slice(0, 6);
  const citations = selected.map(citationFor);
  const citationIds = citations.map((citation) => citation.id);
  const family = input.route.corpusPatternFamiliesRequired[0] ?? "industry-pattern";

  return {
    patternFamilies: input.route.corpusPatternFamiliesRequired,
    patternsIncluded:
      selected.length > 0
        ? [
            {
              patternFamilyId: family,
              patternFamilyName: family.replaceAll("-", " "),
              relevanceReason: `Selected because the question routes to ${input.route.intelligenceIntent} and overlaps ${input.route.primaryDimension}.`,
              industryFit: "Tenant-scoped corpus retrieval was filtered before dossier assembly; treat this as pattern fit, not tenant proof.",
              functionFit: input.route.relatedDimensions.join(", "),
              valueLever: input.route.intelligenceIntent,
              patterns: selected.map((source, index) => ({
                patternId: source.id ?? `pattern-${index + 1}`,
                title: sourceLabel(source, index),
                summary: summarize(source.detail),
                applicability: "Use as precedent and comparison only; validate against tenant evidence before recommending.",
                prerequisites: [
                  "Tenant evidence overlaps the pattern",
                  "Implementation prerequisites are visible or named as gaps",
                ],
                risks: [
                  "Corpus pattern may not match tenant maturity",
                  "Pattern cannot substitute for tenant proof",
                ],
                evidenceStrength: confidenceFromSource(source),
                citationIds: [citationIds[index]],
              })),
            },
          ]
        : [],
    patternsExcluded:
      corpusSources.length > selected.length
        ? corpusSources.slice(selected.length, selected.length + 4).map((source, index) => ({
            patternName: sourceLabel(source, selected.length + index),
            reasonExcluded: "Lower relevance than the selected corpus patterns for this question budget.",
          }))
        : [],
    applicabilitySummary:
      selected.length > 0
        ? `Corpus is used to compare ${input.route.primaryDimension} patterns, not to prove tenant facts.`
        : "No relevant corpus pattern was retrieved for this question; the answer must not invent pattern evidence.",
    citations,
  };
}
