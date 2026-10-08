// Moves — the approved-evidence lineage a signed-off deliverable records.
//
// A generated deliverable's approval is only current while the approved-evidence
// set it was built from is unchanged. `isApprovedMoveEvidenceBasisCurrent` decides
// that from THREE recorded facts: the whole-Move revision, the phase revision, and
// the moment those two were read. It returns false when the moment is missing:
//
//     const generatedAt = args.generatedAt ? Date.parse(args.generatedAt) : NaN;
//     if (!Number.isFinite(generatedAt)) return false;
//
// Every writer recorded the two hashes and omitted the moment, so the structured
// leg of `isSignedOff` in `governance.ts` could never be true and a signed-off
// deliverable's currency rested entirely on a linked `move_artifacts` row — whose
// own `created_at` supplies the moment. Where no artifact row is linked (a sign-off
// whose version/artifact match misses, so `approved_artifact_id` is written NULL)
// the deliverable reads as NOT signed off, and its phase gate holds with no reason.
//
// The reason the moment was omitted at four separate sites is that nothing tied it
// to the hashes. This stamp is that tie: the three fields the reader compares plus
// the one it needs to compare them AT, produced together or not at all.

/**
 * The approved-evidence lineage recorded on a deliverable or an artifact.
 *
 * `generatedAt` is when `evidenceSnapshotHash` and `phaseEvidenceSnapshotHash`
 * were READ — not when the document's text was written. A re-approval that
 * re-reads the hashes re-stamps all four together.
 */
export interface ApprovedEvidenceLineageStamp {
  evidenceSnapshotHash: string;
  phaseEvidenceSnapshotHash: string;
  evidenceSnapshotScope: "phase";
  generatedAt: string;
}

/**
 * Stamp the two revisions with the moment they were read.
 *
 * Pass `at` to use a timestamp already taken for this same read; omit it and the
 * stamp is taken now. Nothing is validated or defaulted away: an empty phase
 * revision is recorded as empty, exactly as before this stamp existed, so a phase
 * the revision map does not cover keeps reading as unevaluable rather than current.
 */
export function stampApprovedEvidenceLineage(args: {
  evidenceSnapshotHash: string;
  phaseEvidenceSnapshotHash: string;
  at?: string;
}): ApprovedEvidenceLineageStamp {
  return {
    evidenceSnapshotHash: args.evidenceSnapshotHash,
    phaseEvidenceSnapshotHash: args.phaseEvidenceSnapshotHash,
    evidenceSnapshotScope: "phase",
    generatedAt: args.at ?? new Date().toISOString(),
  };
}
