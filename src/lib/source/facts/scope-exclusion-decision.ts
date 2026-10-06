import { evidenceMeetsRequirement, hasAuditedAbsence, type EvidenceAssessment } from "@/lib/source/evidence-authority";
import { evidenceById } from "@/lib/source/canonical-specs";
import { scopeMatrixSourceId } from "@/lib/source/facts/scope-matrix-decision";

export const SCOPE_EXCLUSIONS_DECISION_ID = "EVID-SRC-SCOPE-EXCLUSIONS-DECISION";
const CURRENT_SOW_ID = "EVID-SRC-SCOPE-CURRENT-SOW";

export type ScopeExclusionBasis =
  | { kind: "source"; sourceId: string }
  | { kind: "audited_absence"; actorUserId: string; decidedAt: string; reason: string };

export interface ScopeExclusionDecision {
  kind: "scope_exclusions_decision_v1";
  actorUserId: string;
  decidedAt: string;
  excludedWork: string;
  responsibleOwner: string;
  rationale: string;
  basis: ScopeExclusionBasis;
}

export function scopeExclusionBasis(evidence: EvidenceAssessment | undefined): ScopeExclusionBasis | null {
  const requirement = evidenceById(CURRENT_SOW_ID);
  if (!requirement || evidence?.requirementId !== CURRENT_SOW_ID || !evidenceMeetsRequirement(requirement, evidence)) return null;
  const sourceId = scopeMatrixSourceId(evidence);
  if (sourceId) return { kind: "source", sourceId };
  if (hasAuditedAbsence(requirement, evidence)) {
    return {
      kind: "audited_absence",
      actorUserId: evidence!.applicabilityActorUserId!,
      decidedAt: new Date(evidence!.applicabilityDecidedAt!).toISOString(),
      reason: evidence!.applicabilityReason!.trim(),
    };
  }
  return null;
}

export function parseScopeExclusionDecision(notes: string | null | undefined): ScopeExclusionDecision | null {
  if (!notes) return null;
  let parsed: unknown;
  try { parsed = JSON.parse(notes); } catch { return null; }
  if (!parsed || typeof parsed !== "object") return null;
  const value = parsed as Record<string, unknown>;
  if (value.kind !== "scope_exclusions_decision_v1") return null;
  for (const field of ["actorUserId", "decidedAt", "excludedWork", "responsibleOwner", "rationale"]) {
    if (typeof value[field] !== "string" || !(value[field] as string).trim()) return null;
  }
  if (Number.isNaN(Date.parse(value.decidedAt as string))) return null;
  for (const field of ["excludedWork", "responsibleOwner", "rationale"]) {
    const length = (value[field] as string).trim().length;
    if (length < 24 || length > 2_000) return null;
  }
  const basis = value.basis;
  if (!basis || typeof basis !== "object") return null;
  const source = basis as Record<string, unknown>;
  if (source.kind === "source") {
    if (typeof source.sourceId !== "string" || !source.sourceId.trim()) return null;
  } else if (source.kind === "audited_absence") {
    if (typeof source.actorUserId !== "string" || !source.actorUserId.trim() ||
        typeof source.decidedAt !== "string" || Number.isNaN(Date.parse(source.decidedAt)) ||
        typeof source.reason !== "string" || source.reason.trim().length < 24) return null;
  } else {
    return null;
  }
  return value as unknown as ScopeExclusionDecision;
}

export function scopeExclusionDecisionMatchesBasis(
  decision: ScopeExclusionDecision | null,
  evidence: EvidenceAssessment | undefined,
): boolean {
  const current = scopeExclusionBasis(evidence);
  if (!decision || !current || decision.basis.kind !== current.kind) return false;
  if (current.kind === "source") {
    return decision.basis.kind === "source" && decision.basis.sourceId === current.sourceId;
  }
  return decision.basis.kind === "audited_absence" &&
    decision.basis.actorUserId === current.actorUserId &&
    Date.parse(decision.basis.decidedAt) === Date.parse(current.decidedAt) &&
    decision.basis.reason === current.reason;
}
