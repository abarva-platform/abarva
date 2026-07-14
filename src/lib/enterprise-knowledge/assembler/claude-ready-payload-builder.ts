import type {
  ClaudeReadyContextPayload,
  ContextPack,
  ModuleContextRequest,
} from "../contracts";

export function buildClaudeReadyPayload(
  request: ModuleContextRequest,
  packDraft: Pick<
    ContextPack,
    | "executiveSummary"
    | "relevantEntityProfiles"
    | "facts"
    | "relationshipCandidates"
    | "metrics"
    | "risks"
    | "evidence"
    | "gaps"
    | "confidenceSummary"
    | "recommendedNextEvidence"
  >,
): ClaudeReadyContextPayload {
  const contextSummary = [
    `Tenant: ${request.tenantKey}`,
    `Module: ${request.moduleKey}`,
    `Purpose: ${request.purpose}`,
    packDraft.executiveSummary,
    `Profiles: ${packDraft.relevantEntityProfiles
      .slice(0, 8)
      .map((profile) => `${profile.entityType}:${profile.entityName}`)
      .join("; ")}`,
    `Key facts: ${packDraft.facts
      .slice(0, 8)
      .map((fact) => `${fact.predicate}=${String(fact.value)}`)
      .join("; ")}`,
    `Relationships: ${packDraft.relationshipCandidates
      .slice(0, 8)
      .map((edge) => `${edge.relationshipType}:${edge.businessMeaning}`)
      .join("; ")}`,
    `Metrics: ${packDraft.metrics.map((fact) => String(fact.value)).join("; ")}`,
    `Risks/controls: ${packDraft.risks.map((profile) => profile.entityName).join("; ")}`,
    `Evidence summary: ${packDraft.evidence
      .slice(0, 5)
      .map((ref) => ref.sourceLabel)
      .join("; ")}`,
    `Confidence: ${packDraft.confidenceSummary.overall} - ${packDraft.confidenceSummary.rationale}`,
    `Known gaps: ${packDraft.gaps.map((gap) => gap.description).join("; ")}`,
    `Recommended next evidence: ${packDraft.recommendedNextEvidence.join("; ")}`,
  ].join("\n");

  return {
    systemInstruction:
      "Use only this governed context payload. Cite evidence refs. Mark inference. Do not treat synthetic, candidate, or source-adapter-only context as active tenant truth.",
    contextSummary,
    evidenceRefs: packDraft.evidence.map((ref) => ref.evidenceId),
    mustCiteEvidence: true,
    mustMarkInference: true,
    unsupportedClaims: [],
    excludesAuditOnlyDiagnostics: true,
    excludesInactiveCandidateContextUnlessRequested: true,
    excludesSourceAdapterOnlyFactsUnlessRequested: true,
  };
}
