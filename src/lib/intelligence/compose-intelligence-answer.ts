import type { IntelligenceDossier } from "@/lib/intelligence/dossiers/types";

function list(values: string[], fallback = "None retrieved."): string {
  return values.length > 0 ? values.map((value) => `- ${value}`).join("\n") : `- ${fallback}`;
}

function sentence(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

export function formatIntelligenceDossierForPrompt(dossier: IntelligenceDossier): string {
  const tenantFacts = dossier.evidenceBoundary.tenantFacts.map(sentence).slice(0, 8);
  const corpusPatterns = dossier.evidenceBoundary.corpusPatterns.map(sentence).slice(0, 8);
  const experts = dossier.expertCouncilDossier.selectedExperts.slice(0, 7);
  const options = dossier.decisionOptionsDossier.options.slice(0, 5);
  const gaps = dossier.evidenceBoundary.missingTenantEvidence.map(sentence);

  return [
    "INTELLIGENCE DOSSIER — AUTHORITATIVE ADVISORY PACKET",
    "",
    "Use this packet as the primary briefing book. Tenant facts prove. Corpus patterns compare. Experts interpret. Benchmarks calibrate. You synthesize. AbarVa verifies and cites.",
    "",
    `Tenant: ${dossier.tenantName} (${dossier.tenantKey})`,
    `Question: ${dossier.question}`,
    `Intent: ${dossier.intelligenceIntent}`,
    `Primary dimension: ${dossier.primaryDimension}`,
    `Related dimensions: ${dossier.relatedDimensions.join(", ") || "none"}`,
    `Tenant evidence strength: ${dossier.tenantEvidenceDossier.confidence}`,
    `Artifact plan: ${dossier.artifactPlan.join(", ")}`,
    "",
    "Tenant evidence — use as proof for tenant-specific claims:",
    list(tenantFacts, "No tenant evidence retrieved; do not make tenant-specific recommendations as proven."),
    "",
    "Corpus patterns — use as precedent/comparison, not tenant fact:",
    list(corpusPatterns, "No corpus pattern retrieved; do not claim peer precedent."),
    "",
    "Expert council — synthesize these lenses; do not present experts as proof:",
    experts.length > 0
      ? experts
          .map((expert) => {
            const questions = expert.questionsThisExpertShouldPressureTest.slice(0, 3).join("; ");
            return `- ${expert.nameOrRole}: lens=${expert.lens}; why=${expert.whySelected}; pressure-test=${questions}`;
          })
          .join("\n")
      : "- No expert lens selected; answer should be conservative.",
    "",
    "Options and tradeoffs — include for decision questions:",
    options.length > 0
      ? options
          .map(
            (option) =>
              `- ${option.title}: use=${option.recommendedUse}; value=${option.expectedValue}; complexity=${option.executionComplexity}; risk=${option.riskLevel}; missing=${option.missingEvidence.join(", ") || "none named"}`,
          )
          .join("\n")
      : "- No options built; do not force a recommendation.",
    "",
    "Risks, caveats, and missing evidence:",
    list([
      ...dossier.riskCaveatDossier.dataReadinessGaps,
      ...dossier.riskCaveatDossier.operatingModelRisks,
      ...dossier.riskCaveatDossier.executionRisks,
      ...gaps,
    ].slice(0, 10)),
    "",
    "Cannot conclude:",
    list(dossier.evidenceBoundary.cannotConclude),
    "",
    "Answer structure required:",
    "- Start with the executive answer in plain language.",
    "- Then separate: tenant evidence, corpus pattern, expert interpretation, options/tradeoffs, risks/missing evidence.",
    "- Do not say corpus evidence is tenant fact.",
    "- Do not say expert interpretation is evidence.",
    "- Do not invent exact ROI, dates, dollar values, vendors, owners, or relationships.",
    "- If tenant evidence is thin, say what tenant evidence is missing and still provide a pattern-based view with caveats.",
  ].join("\n");
}
