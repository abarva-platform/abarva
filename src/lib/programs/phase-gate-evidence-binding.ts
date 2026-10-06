import type { PhaseSnapshot } from "./types.db";

export interface PhaseGateEvidenceState {
  revision: string;
  latestEvidenceActivityAt: string | null;
  revisionByPhase?: Record<number, string>;
  latestEvidenceActivityAtByPhase?: Record<number, string | null>;
}

function latestSnapshotForPhase(
  snapshots: readonly PhaseSnapshot[],
  phase: number,
): PhaseSnapshot | null {
  return (
    snapshots
      .filter((snapshot) => snapshot.phaseNumber === phase)
      .sort((a, b) => {
        const aTime = Date.parse(a.lockedAt ?? a.createdAt);
        const bTime = Date.parse(b.lockedAt ?? b.createdAt);
        return bTime - aTime;
      })[0] ?? null
  );
}

export function phaseApprovalMatchesEvidence(
  phase: number,
  snapshots: readonly PhaseSnapshot[],
  evidence: PhaseGateEvidenceState | null,
): boolean {
  const approval = latestSnapshotForPhase(snapshots, phase);
  if (!approval || approval.approvalStatus !== "approved") return false;
  if (phase === 0) return true;
  if (!evidence?.revision) return false;

  const approvalAt = Date.parse(approval.lockedAt ?? approval.createdAt);
  if (!Number.isFinite(approvalAt)) return false;
  const recordedPhaseRevision = approval.snapshot.phaseEvidenceSnapshotHash;
  if (
    typeof recordedPhaseRevision === "string" &&
    recordedPhaseRevision.length > 0
  ) {
    if (
      !evidence.revisionByPhase ||
      recordedPhaseRevision !== evidence.revisionByPhase[phase]
    ) {
      return false;
    }
  }

  const recordedRevision = approval.snapshot.evidenceSnapshotHash;
  const hasRecordedRevision =
    typeof recordedRevision === "string" && recordedRevision.length > 0;

  const phaseActivityMap = evidence.latestEvidenceActivityAtByPhase;
  const hasPhaseActivity = Boolean(
    phaseActivityMap &&
      Object.prototype.hasOwnProperty.call(phaseActivityMap, phase),
  );
  if (phaseActivityMap && !hasPhaseActivity) return false;
  const latestPhaseActivity = hasPhaseActivity
    ? phaseActivityMap?.[phase]
    : evidence.latestEvidenceActivityAt;
  const phaseActivityAt = latestPhaseActivity
    ? Date.parse(latestPhaseActivity)
    : null;
  if (phaseActivityAt !== null && !Number.isFinite(phaseActivityAt)) return false;
  if (phaseActivityAt !== null && phaseActivityAt > approvalAt) return false;

  if (!hasRecordedRevision || recordedPhaseRevision) return true;
  if (recordedRevision === evidence.revision) return true;

  // Legacy snapshots only have a whole-Move hash. Preserve one across an
  // unrelated-phase change only when both the changed global activity and
  // unchanged phase activity are timestamped around this approval.
  const latestOverallActivityAt = evidence.latestEvidenceActivityAt
    ? Date.parse(evidence.latestEvidenceActivityAt)
    : NaN;
  return (
    Number.isFinite(latestOverallActivityAt) &&
    latestOverallActivityAt > approvalAt &&
    (phaseActivityAt === null || phaseActivityAt <= approvalAt)
  );
}

export function effectivePhaseAfterEvidenceChange(
  storedCurrentPhase: number,
  snapshots: readonly PhaseSnapshot[],
  evidence: PhaseGateEvidenceState | null,
): number {
  const currentPhase = Math.max(0, Math.min(5, Math.trunc(storedCurrentPhase)));
  for (let phase = 1; phase < currentPhase; phase += 1) {
    if (!phaseApprovalMatchesEvidence(phase, snapshots, evidence)) return phase;
  }
  return currentPhase;
}

export function effectivePhaseAfterGateValidation(
  currentPhase: number,
  gateReadinessByPhase: ReadonlyMap<number, boolean>,
): number {
  const boundedCurrentPhase = Math.max(
    0,
    Math.min(5, Math.trunc(currentPhase)),
  );
  for (let phase = 1; phase < boundedCurrentPhase; phase += 1) {
    if (gateReadinessByPhase.get(phase) !== true) return phase;
  }
  return boundedCurrentPhase;
}
