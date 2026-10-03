import type { EvidenceAssessment } from "@/lib/source/evidence-authority";

export const SCOPE_MATRIX_DECISION_ID = "EVID-SRC-SCOPE-RETAINED-VENDOR-DECISION";

type SourceWithId = EvidenceAssessment & { id?: string; notes?: string | null };

export interface ScopeMatrixDecision {
  kind: "scope_matrix_decision_v1";
  actorUserId: string;
  decidedAt: string;
  retainedResponsibilities: string;
  vendorResponsibilities: string;
  rationale: string;
  workforceArtifactId: string;
  slaArtifactId: string;
}

export function scopeMatrixSourceId(evidence: SourceWithId | undefined): string | null {
  if (!evidence) return null;
  if (evidence.sourceArtifactId) return evidence.sourceArtifactId;
  if (evidence.sourceEventFactIds?.length) {
    return `facts:${[...evidence.sourceEventFactIds].sort().join(",")}`;
  }
  return null;
}

export function parseScopeMatrixDecision(notes: string | null | undefined): ScopeMatrixDecision | null {
  if (!notes) return null;
  let parsed: unknown;
  try {
    parsed = JSON.parse(notes);
  } catch {
    return null;
  }
  if (!parsed || typeof parsed !== "object") return null;
  const value = parsed as Record<string, unknown>;
  if (value.kind !== "scope_matrix_decision_v1") return null;
  const fields = [
    "actorUserId", "decidedAt", "retainedResponsibilities", "vendorResponsibilities",
    "rationale", "workforceArtifactId", "slaArtifactId",
  ] as const;
  if (fields.some((field) => typeof value[field] !== "string" || !(value[field] as string).trim())) return null;
  if (Number.isNaN(Date.parse(value.decidedAt as string))) return null;
  if ((value.retainedResponsibilities as string).trim().length < 24 ||
      (value.vendorResponsibilities as string).trim().length < 24 ||
      (value.rationale as string).trim().length < 24) return null;
  return value as unknown as ScopeMatrixDecision;
}

export function scopeMatrixDecisionMatchesSources(
  decision: ScopeMatrixDecision | null,
  workforce: SourceWithId | undefined,
  sla: SourceWithId | undefined,
): boolean {
  return Boolean(
    decision &&
    scopeMatrixSourceId(workforce) === decision.workforceArtifactId &&
    scopeMatrixSourceId(sla) === decision.slaArtifactId,
  );
}
