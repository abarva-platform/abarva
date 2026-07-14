import type { EvidenceRef } from "../contracts";
import type { ContextAssemblyInput } from "./fixture-input";

export function buildEvidenceRefs(input: ContextAssemblyInput): EvidenceRef[] {
  const { blueprint, semanticCluster } = input;
  return semanticCluster.evidenceItems.map((item, index) => ({
    evidenceId: `${blueprint.catalogKey}-evidence-${index + 1}`,
    tenantKey: blueprint.tenantKey,
    sourceLabel: item,
    sourceType: "generated_fixture",
    authority: "synthetic",
    truthStatus: "synthetic_review",
    sourcePath: input.inputSources[0],
    excerpt: item,
    asOfDate: "2026-07-14",
    sourceOwner: "AbarVa semantic-depth proof input",
    sensitivity: "internal",
    confidence: 0.78,
    citationStatus: "needs_review",
  }));
}

export function summarizeEvidence(evidence: EvidenceRef[]): string {
  if (!evidence.length) return "No evidence refs available.";
  return `${evidence.length} evidence refs are available; all remain synthetic review evidence until tenant validation and promotion.`;
}
