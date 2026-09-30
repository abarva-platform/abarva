import type { PhaseSnapshot } from "./types.db";

export interface PhaseGateEvidenceState {
  revision: string;
  latestEvidenceActivityAt: string | null;
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

  const recordedRevision = approval.snapshot.evidenceSnapshotHash;
  if (typeof recordedRevision === "string" && recordedRevision.length > 0) {
    if (recordedRevision !== evidence.revision) return false;
  }

  // Keep a timestamp check alongside the revision so later approved evidence
  // activity cannot be masked by a stale or incorrectly preserved hash.
  if (!evidence.latestEvidenceActivityAt) return true;
  const approvalAt = Date.parse(approval.lockedAt ?? approval.createdAt);
  const evidenceChangedAt = Date.parse(evidence.latestEvidenceActivityAt);
  return (
    Number.isFinite(approvalAt) &&
    Number.isFinite(evidenceChangedAt) &&
    evidenceChangedAt <= approvalAt
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
