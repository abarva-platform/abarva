import {
  approvedMoveEvidenceRevisionForPhase,
  isApprovedMoveEvidenceBasisCurrent,
  type ApprovedMoveEvidenceSnapshot,
} from "@/lib/programs/approved-move-evidence-snapshot";
import { approvedMoveEvidenceRevision } from "@/lib/programs/approved-move-evidence-revision";
import { CANONICAL_TENANT_KEYS } from "@/lib/tenant/aliases";
import {
  stampApprovedEvidenceLineage,
  type ApprovedEvidenceLineageStamp,
} from "../approved-evidence-lineage";

// Tenancy comes from code, never a hand-typed list.
const TENANT_KEY = CANONICAL_TENANT_KEYS[0]!;
const MOVE_ID = "11111111-2222-3333-4444-555555555555";
const APPROVED_AT = "2026-10-01T10:00:00.000Z";
const STAMPED_AT = "2026-10-01T11:00:00.000Z";

function evidenceRow(args: { id: string; phase: number | null }) {
  return {
    id: args.id,
    phase: args.phase,
    evidenceType: "uploaded_evidence",
    attachmentId: null,
    createdAt: APPROVED_AT,
    reviewUpdatedAt: APPROVED_AT,
    title: `Evidence ${args.id}`,
    confidence: 0.9,
    summary: "",
    extractedText: null,
    extractedStructured: {},
    reviewedExtraction: null,
  };
}

/**
 * A snapshot shaped exactly as `loadApprovedMoveEvidenceSnapshot` builds one:
 * per-phase revisions over phases 1-5 and a per-phase latest-activity map.
 */
function snapshotFor(
  rows: ReturnType<typeof evidenceRow>[],
): ApprovedMoveEvidenceSnapshot {
  const phases = [1, 2, 3, 4, 5];
  return {
    tenantKey: TENANT_KEY,
    moveId: MOVE_ID,
    revision: approvedMoveEvidenceRevision({
      tenantKey: TENANT_KEY,
      moveId: MOVE_ID,
      rows,
    }),
    approvedEvidenceCount: rows.length,
    rows,
    latestEvidenceActivityAt: APPROVED_AT,
    revisionByPhase: Object.fromEntries(
      phases.map((phase) => [
        phase,
        approvedMoveEvidenceRevision({
          tenantKey: TENANT_KEY,
          moveId: MOVE_ID,
          rows: rows.filter((row) => row.phase === null || row.phase === phase),
        }),
      ]),
    ),
    latestEvidenceActivityAtByPhase: Object.fromEntries(
      phases.map((phase) => [phase, APPROVED_AT]),
    ),
  };
}

/** What `isSignedOff` in `governance.ts` reads off a deliverable's structured data. */
function currencyOfRecordedLineage(args: {
  snapshot: ApprovedMoveEvidenceSnapshot;
  phase: number;
  structured: Record<string, unknown>;
}): boolean {
  const { structured } = args;
  return isApprovedMoveEvidenceBasisCurrent({
    snapshot: args.snapshot,
    phase: args.phase,
    recordedRevision:
      (typeof structured.phaseEvidenceSnapshotHash === "string"
        ? structured.phaseEvidenceSnapshotHash
        : typeof structured.evidenceSnapshotHash === "string"
          ? structured.evidenceSnapshotHash
          : null) ?? null,
    scope:
      typeof structured.evidenceSnapshotScope === "string"
        ? structured.evidenceSnapshotScope
        : null,
    generatedAt:
      typeof structured.generatedAt === "string" ? structured.generatedAt : null,
  });
}

function stampFromSnapshot(
  snapshot: ApprovedMoveEvidenceSnapshot,
  phase: number,
  at = STAMPED_AT,
): ApprovedEvidenceLineageStamp {
  return stampApprovedEvidenceLineage({
    evidenceSnapshotHash: snapshot.revision,
    phaseEvidenceSnapshotHash: approvedMoveEvidenceRevisionForPhase(
      snapshot,
      phase,
    ),
    at,
  });
}

describe("stampApprovedEvidenceLineage — the recorded lineage can be checked", () => {
  it("carries both revisions, the phase scope, and the moment they were read", () => {
    const stamp = stampApprovedEvidenceLineage({
      evidenceSnapshotHash: "whole-move-hash",
      phaseEvidenceSnapshotHash: "phase-hash",
      at: STAMPED_AT,
    });
    expect(stamp).toEqual({
      evidenceSnapshotHash: "whole-move-hash",
      phaseEvidenceSnapshotHash: "phase-hash",
      evidenceSnapshotScope: "phase",
      generatedAt: STAMPED_AT,
    });
  });

  it("takes the moment now when the caller has no timestamp of its own", () => {
    const before = Date.now();
    const stamp = stampApprovedEvidenceLineage({
      evidenceSnapshotHash: "h",
      phaseEvidenceSnapshotHash: "p",
    });
    const after = Date.now();
    const stampedAt = Date.parse(stamp.generatedAt);
    expect(Number.isFinite(stampedAt)).toBe(true);
    expect(stampedAt).toBeGreaterThanOrEqual(before - 1000);
    expect(stampedAt).toBeLessThanOrEqual(after + 1000);
  });

  it("records an empty phase revision as empty rather than inventing one", () => {
    // A phase the revision map does not cover (0, 6) must keep reading as
    // unevaluable. Defaulting it to the whole-Move hash would make an
    // unevaluable phase read as CURRENT, which is the opposite error.
    const snapshot = snapshotFor([evidenceRow({ id: "e1", phase: 2 })]);
    const stamp = stampFromSnapshot(snapshot, 0);
    expect(stamp.phaseEvidenceSnapshotHash).toBe("");
    expect(
      currencyOfRecordedLineage({ snapshot, phase: 0, structured: { ...stamp } }),
    ).toBe(false);
  });
});

describe("the currency check the stamp exists for", () => {
  it("reads a stamped lineage as CURRENT against the snapshot it was stamped from", () => {
    const snapshot = snapshotFor([
      evidenceRow({ id: "e1", phase: 2 }),
      evidenceRow({ id: "e2", phase: 2 }),
    ]);
    const structured = {
      source: "moves_program_generate",
      ...stampFromSnapshot(snapshot, 2),
    };
    expect(currencyOfRecordedLineage({ snapshot, phase: 2, structured })).toBe(
      true,
    );
  });

  it("reads the SAME lineage as stale once the moment is dropped", () => {
    // This is the defect the stamp fixes: every writer recorded the two hashes
    // and omitted the moment, so this leg could never be true in production.
    const snapshot = snapshotFor([evidenceRow({ id: "e1", phase: 2 })]);
    const stamp = stampFromSnapshot(snapshot, 2);
    const withoutMoment: Record<string, unknown> = { ...stamp };
    delete withoutMoment.generatedAt;
    expect(
      currencyOfRecordedLineage({
        snapshot,
        phase: 2,
        structured: { source: "moves_program_generate", ...withoutMoment },
      }),
    ).toBe(false);
    expect(
      currencyOfRecordedLineage({
        snapshot,
        phase: 2,
        structured: { source: "moves_program_generate", ...stamp },
      }),
    ).toBe(true);
  });

  it("reads a stamped lineage as stale when that phase's evidence changes after it", () => {
    const snapshot = snapshotFor([evidenceRow({ id: "e1", phase: 2 })]);
    const structured = {
      source: "moves_program_generate",
      ...stampFromSnapshot(snapshot, 2),
    };
    const afterNewApproval = snapshotFor([
      evidenceRow({ id: "e1", phase: 2 }),
      evidenceRow({ id: "e2", phase: 2 }),
    ]);
    expect(
      currencyOfRecordedLineage({
        snapshot: afterNewApproval,
        phase: 2,
        structured,
      }),
    ).toBe(false);
  });

  it("reads a stamped lineage as stale when the moment predates the phase's activity", () => {
    // The moment has to be when the hashes were READ. A moment taken before the
    // approval it is supposed to cover is not current, stamp or no stamp.
    const snapshot = snapshotFor([evidenceRow({ id: "e1", phase: 2 })]);
    const structured = {
      source: "moves_program_generate",
      ...stampFromSnapshot(snapshot, 2, "2026-09-30T09:00:00.000Z"),
    };
    expect(currencyOfRecordedLineage({ snapshot, phase: 2, structured })).toBe(
      false,
    );
  });

  it("keeps each phase's stamp scoped to its own phase", () => {
    const snapshot = snapshotFor([
      evidenceRow({ id: "e1", phase: 2 }),
      evidenceRow({ id: "e2", phase: 3 }),
    ]);
    const p2 = { source: "moves_program_generate", ...stampFromSnapshot(snapshot, 2) };
    const p3 = { source: "moves_program_generate", ...stampFromSnapshot(snapshot, 3) };
    expect(p2.phaseEvidenceSnapshotHash).not.toBe(p3.phaseEvidenceSnapshotHash);
    expect(currencyOfRecordedLineage({ snapshot, phase: 2, structured: p2 })).toBe(true);
    expect(currencyOfRecordedLineage({ snapshot, phase: 3, structured: p3 })).toBe(true);
    // A P2 stamp must not pass as P3 currency.
    expect(currencyOfRecordedLineage({ snapshot, phase: 3, structured: p2 })).toBe(false);
  });

  it("reads a stamped lineage as unevaluable when there is no snapshot to compare", () => {
    const snapshot = snapshotFor([evidenceRow({ id: "e1", phase: 2 })]);
    expect(
      isApprovedMoveEvidenceBasisCurrent({
        snapshot: null,
        phase: 2,
        recordedRevision: stampFromSnapshot(snapshot, 2)
          .phaseEvidenceSnapshotHash,
        scope: "phase",
        generatedAt: STAMPED_AT,
      }),
    ).toBe(false);
  });
});
