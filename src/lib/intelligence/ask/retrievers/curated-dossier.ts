import {
  loadCuratedSemanticDossier,
  type CuratedDossierLoadResult,
} from "@/lib/semantic-dossiers";
import type { AskSource, AskSurfaceContext, RetrievalResult } from "../types";

interface CuratedDossierRetrievalOptions {
  tenantInventoryKey?: string | null;
  tenantAppClientKey?: string | null;
  surfaceContext?: AskSurfaceContext | null;
}

const CONFIDENCE_WEIGHT: Record<"high" | "medium" | "low", number> = {
  high: 0.9,
  medium: 0.7,
  low: 0.5,
};

function resolveCuratedDossierTenantKey(
  opts: CuratedDossierRetrievalOptions,
): string | null {
  return (
    opts.tenantAppClientKey ??
    opts.tenantInventoryKey ??
    opts.surfaceContext?.clientKey ??
    opts.surfaceContext?.activeClient ??
    null
  );
}

function truncate(text: string, max: number): string {
  const trimmed = text.trim();
  return trimmed.length > max ? `${trimmed.slice(0, max - 1)}…` : trimmed;
}

function averageFactConfidence(
  facts: CuratedDossierLoadResult["dossier"]["facts"],
): number {
  if (facts.length === 0) return 0.6;
  const total = facts.reduce(
    (sum, fact) => sum + (CONFIDENCE_WEIGHT[fact.confidence] ?? 0.6),
    0,
  );
  return Math.round((total / facts.length) * 100) / 100;
}

// Formatting mirrors formatCleanDossierContext in src/lib/atlas/llm.ts (the
// established, proven pattern for turning a CuratedDossierLoadResult into a
// prompt-ready source block) — reused, not reinvented, so Intelligence's
// curated-dossier grounding reads the same shape Atlas and Home already
// serve from this data plane.
function formatCuratedDossierDetail(result: CuratedDossierLoadResult): string {
  const dossier = result.dossier;
  const facts = dossier.facts
    .slice(0, 12)
    .map(
      (fact) =>
        `- ${fact.label}: ${truncate(String(fact.value), 140)} (${fact.confidence})`,
    );
  const metrics = dossier.metrics
    .slice(0, 8)
    .map(
      (metric) =>
        `- ${metric.label}: ${metric.value}${metric.unit ? ` ${metric.unit}` : ""}${metric.caveat ? `; caveat ${truncate(metric.caveat, 100)}` : ""}`,
    );
  const gaps = dossier.gaps
    .slice(0, 6)
    .map((gap) => `- ${gap.label}: ${truncate(gap.impact, 140)}`);

  return [
    `Dossier: ${result.canonicalTenantKey}/${dossier.route.primaryDimension}`,
    `Dossier version ${result.dossierVersion}, built ${result.builtAt}.`,
    `Dimension summary: ${truncate(dossier.dimensionSummary, 260)}`,
    "",
    facts.length
      ? `Supported facts:\n${facts.join("\n")}`
      : "Supported facts: none returned.",
    "",
    metrics.length
      ? `Measures:\n${metrics.join("\n")}`
      : "Measures: none returned.",
    "",
    gaps.length
      ? `Known gaps:\n${gaps.join("\n")}`
      : "Known gaps: none flagged.",
  ].join("\n");
}

/**
 * Additive Intelligence retriever for the current-context curated Semantic2
 * dossier layer (`semantic2_dossiers`, served through
 * loadCuratedSemanticDossier — the same Postgres-backed source Home and
 * Atlas already read from). Runs alongside the existing V7 dossier retriever
 * rather than replacing it: V7 stays wired until this source is proven
 * reliable across tenants, matching the two-stage migration Home just
 * completed (add the new source, verify, then gate the old one down).
 *
 * Best-effort: any missing/ineligible/stale dossier or read failure returns
 * an empty result rather than throwing — callers already run retrievers in
 * parallel/sequence with the expectation that a source can be legitimately
 * empty.
 */
export async function retrieveCuratedDossierSources(
  query: string,
  opts: CuratedDossierRetrievalOptions = {},
): Promise<RetrievalResult> {
  const tenantKey = resolveCuratedDossierTenantKey(opts);
  if (!tenantKey) return { sources: [], averageConfidence: 0 };

  try {
    const result = await loadCuratedSemanticDossier({ tenantKey, question: query });
    const confidence = averageFactConfidence(result.dossier.facts);
    const source: AskSource = {
      type: "TENANT",
      name: `Curated dossier — ${result.dossier.route.primaryDimension}`,
      id: `curated-dossier:${result.canonicalTenantKey}:${result.dossier.route.primaryDimension}`,
      detail: formatCuratedDossierDetail(result),
      confidence,
    };
    return { sources: [source], averageConfidence: confidence };
  } catch {
    return { sources: [], averageConfidence: 0 };
  }
}
