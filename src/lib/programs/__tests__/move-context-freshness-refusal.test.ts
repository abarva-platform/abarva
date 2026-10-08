import {
  classifyMoveContextFreshnessRefusal,
  describeUnevaluableApprovedEvidenceBasis,
  type MoveContextFreshnessForRefusal,
} from "@/lib/programs/move-context-freshness-refusal";
import { classifyP3ArchitectureLineagePrecondition } from "@/lib/programs/p3-architecture-lineage-precondition";

const fresh: MoveContextFreshnessForRefusal = {
  freshnessStatus: "fresh",
  approvedEvidenceRevision: "rev-9",
  evidenceFingerprint: "fp-1",
};

describe("classifyMoveContextFreshnessRefusal", () => {
  it("returns null only when the extract is fresh AND matches the queued batch", () => {
    expect(
      classifyMoveContextFreshnessRefusal({
        freshness: fresh,
        expectedFingerprint: "fp-1",
      }),
    ).toBeNull();
  });

  it("an absent extract is not a report that evidence changed", () => {
    const refusal = classifyMoveContextFreshnessRefusal({
      freshness: null,
      expectedFingerprint: "fp-1",
    });
    expect(refusal?.condition).toBe("extract_absent");
    expect(refusal?.error).toBe("context_extract_absent");
    expect(refusal?.rebuildCanSatisfy).toBe(true);
    expect(refusal?.blocker).not.toMatch(
      /Move evidence changed after this architecture batch/,
    );
  });

  describe("an unreadable approved-evidence basis", () => {
    const reasons = [
      "tenant_scope_unresolved",
      "snapshot_load_failed",
      "snapshot_unavailable",
    ] as const;

    it.each(reasons)(
      "%s is unevaluable, and says so rather than claiming evidence changed",
      (reason) => {
        const refusal = classifyMoveContextFreshnessRefusal({
          freshness: {
            ...fresh,
            freshnessStatus: "rebuild_required",
            basisUnevaluableReason: reason,
          },
          expectedFingerprint: "fp-1",
        });
        expect(refusal?.condition).toBe("basis_unevaluable");
        expect(refusal?.reason).toBe(reason);
        expect(refusal?.error).toBe("context_extract_basis_unevaluable");
        expect(refusal?.blocker).not.toMatch(
          /Move evidence changed after this architecture batch/,
        );
        expect(refusal?.blocker).toMatch(/could not be determined/i);
        expect(refusal?.blocker).toMatch(/not a report that evidence changed/i);
      },
    );

    it.each(reasons)("%s states which read could not be made", (reason) => {
      const refusal = classifyMoveContextFreshnessRefusal({
        freshness: {
          ...fresh,
          freshnessStatus: "rebuild_required",
          basisUnevaluableReason: reason,
        },
        expectedFingerprint: "fp-1",
      });
      const expected =
        reason === "tenant_scope_unresolved"
          ? /no tenant key/i
          : reason === "snapshot_load_failed"
            ? /threw/i
            : /row cap exceeded/i;
      expect(refusal?.blocker).toMatch(expected);
    });

    // The defect this module exists to prevent: the prior single `if` answered
    // this case with "Refresh the Context Extract and rebuild", and the rebuild
    // re-reads the same unreadable basis. `blocked` is terminal, so that
    // prescription ended the batch while being unable to clear it.
    it("does not prescribe a rebuild it has marked unsatisfiable", () => {
      const refusal = classifyMoveContextFreshnessRefusal({
        freshness: {
          ...fresh,
          freshnessStatus: "rebuild_required",
          basisUnevaluableReason: "snapshot_unavailable",
        },
        expectedFingerprint: "fp-1",
      });
      expect(refusal?.rebuildCanSatisfy).toBe(false);
      expect(refusal?.blocker).toMatch(/cannot clear this block/i);
    });

    it("is read before the status, which cannot separate it from a missing revision", () => {
      // Both arrive as `rebuild_required`. With a recorded revision present, a
      // status-first ladder would mislabel this as `extract_marked_rebuild_required`.
      const refusal = classifyMoveContextFreshnessRefusal({
        freshness: {
          freshnessStatus: "rebuild_required",
          approvedEvidenceRevision: "rev-9",
          evidenceFingerprint: "fp-1",
          basisUnevaluableReason: "snapshot_unavailable",
        },
        expectedFingerprint: "fp-1",
      });
      expect(refusal?.condition).toBe("basis_unevaluable");
    });

    it("outranks a fingerprint mismatch, which it could not have evaluated either", () => {
      const refusal = classifyMoveContextFreshnessRefusal({
        freshness: {
          ...fresh,
          freshnessStatus: "rebuild_required",
          basisUnevaluableReason: "snapshot_load_failed",
          evidenceFingerprint: "fp-OTHER",
        },
        expectedFingerprint: "fp-1",
      });
      expect(refusal?.condition).toBe("basis_unevaluable");
    });
  });

  it("an extract recording no revision is genuinely rebuild-shaped", () => {
    const refusal = classifyMoveContextFreshnessRefusal({
      freshness: {
        ...fresh,
        freshnessStatus: "rebuild_required",
        approvedEvidenceRevision: null,
      },
      expectedFingerprint: "fp-1",
    });
    expect(refusal?.condition).toBe("recorded_basis_absent");
    expect(refusal?.error).toBe("context_extract_basis_absent");
    expect(refusal?.rebuildCanSatisfy).toBe(true);
    expect(refusal?.blocker).toMatch(/records no approved-evidence revision/i);
  });

  it("a stored rebuild_required with a readable basis keeps its own fact", () => {
    const refusal = classifyMoveContextFreshnessRefusal({
      freshness: { ...fresh, freshnessStatus: "rebuild_required" },
      expectedFingerprint: "fp-1",
    });
    expect(refusal?.condition).toBe("extract_marked_rebuild_required");
    expect(refusal?.error).toBe("context_extract_rebuild_required");
    expect(refusal?.rebuildCanSatisfy).toBe(true);
  });

  it("a stale extract is the one reading the original text stated correctly", () => {
    const refusal = classifyMoveContextFreshnessRefusal({
      freshness: { ...fresh, freshnessStatus: "stale" },
      expectedFingerprint: "fp-1",
    });
    expect(refusal?.condition).toBe("context_superseded");
    expect(refusal?.error).toBe("stale_context_snapshot");
    expect(refusal?.blocker).toMatch(/Move evidence changed/);
  });

  // The guard this replaces was `freshnessStatus !== "fresh"`. An unrecognised
  // status must keep refusing: falling through to the fingerprint check would let
  // a batch generate against an extract nothing had certified as current.
  it("refuses an unrecognised status rather than falling through to the fingerprint check", () => {
    const refusal = classifyMoveContextFreshnessRefusal({
      freshness: {
        ...fresh,
        freshnessStatus: "something_else" as unknown as "fresh",
        evidenceFingerprint: "fp-1",
      },
      expectedFingerprint: "fp-1",
    });
    expect(refusal).not.toBeNull();
    expect(refusal?.condition).toBe("context_superseded");
  });

  it("refuses a status the loader never sets, even when the fingerprint matches", () => {
    const refusal = classifyMoveContextFreshnessRefusal({
      freshness: {
        approvedEvidenceRevision: "rev-9",
        evidenceFingerprint: "fp-1",
      } as unknown as MoveContextFreshnessForRefusal,
      expectedFingerprint: "fp-1",
    });
    expect(refusal).not.toBeNull();
  });

  it("a fresh extract the batch does not name is a mismatch, not a stale basis", () => {
    const refusal = classifyMoveContextFreshnessRefusal({
      freshness: { ...fresh, evidenceFingerprint: "fp-OTHER" },
      expectedFingerprint: "fp-1",
    });
    expect(refusal?.condition).toBe("fingerprint_mismatch");
    expect(refusal?.rebuildCanSatisfy).toBe(true);
    expect(refusal?.blocker).toMatch(/different P3 Context Extract/i);
  });

  it("every refusal states its own fact — no two share a blocker", () => {
    const cases: MoveContextFreshnessForRefusal[] = [
      { ...fresh, freshnessStatus: "rebuild_required", basisUnevaluableReason: "snapshot_unavailable" },
      { ...fresh, freshnessStatus: "rebuild_required", approvedEvidenceRevision: null },
      { ...fresh, freshnessStatus: "rebuild_required" },
      { ...fresh, freshnessStatus: "stale" },
      { ...fresh, evidenceFingerprint: "fp-OTHER" },
    ];
    const blockers = [
      classifyMoveContextFreshnessRefusal({ freshness: null, expectedFingerprint: "fp-1" }),
      ...cases.map((freshness) =>
        classifyMoveContextFreshnessRefusal({ freshness, expectedFingerprint: "fp-1" }),
      ),
    ].map((r) => r?.blocker);
    expect(blockers.every(Boolean)).toBe(true);
    expect(new Set(blockers).size).toBe(blockers.length);
  });

  it("only the unevaluable condition marks a rebuild unable to satisfy it", () => {
    const all: Array<MoveContextFreshnessForRefusal | null> = [
      null,
      { ...fresh, freshnessStatus: "rebuild_required", basisUnevaluableReason: "snapshot_unavailable" },
      { ...fresh, freshnessStatus: "rebuild_required", approvedEvidenceRevision: null },
      { ...fresh, freshnessStatus: "rebuild_required" },
      { ...fresh, freshnessStatus: "stale" },
      { ...fresh, evidenceFingerprint: "fp-OTHER" },
    ];
    const unsatisfiable = all
      .map((freshness) =>
        classifyMoveContextFreshnessRefusal({ freshness, expectedFingerprint: "fp-1" }),
      )
      .filter((r) => r && !r.rebuildCanSatisfy);
    expect(unsatisfiable).toHaveLength(1);
    expect(unsatisfiable[0]?.condition).toBe("basis_unevaluable");
  });

  it("a null basis reason does not make a readable basis unevaluable", () => {
    const refusal = classifyMoveContextFreshnessRefusal({
      freshness: { ...fresh, freshnessStatus: "stale", basisUnevaluableReason: null },
      expectedFingerprint: "fp-1",
    });
    expect(refusal?.condition).toBe("context_superseded");
  });
});

// The interactive P3 approval paths make the same comparison about the same
// extract, plus one more fact the queue never reads (the approved solution
// option). Its classifier delegates here, so both live in one suite rather than
// drifting apart.
describe("classifyP3ArchitectureLineagePrecondition", () => {
  const ready = {
    clientKey: "tenant-1",
    approvedOptionPresent: true,
    freshness: fresh,
    staleRefuses: true as boolean,
  };

  it("does not refuse when the option and a fresh extract are both present", () => {
    expect(classifyP3ArchitectureLineagePrecondition(ready)).toBeNull();
    expect(
      classifyP3ArchitectureLineagePrecondition({
        ...ready,
        staleRefuses: false,
      }),
    ).toBeNull();
  });

  describe("an absent approved solution option", () => {
    const refusal = classifyP3ArchitectureLineagePrecondition({
      ...ready,
      approvedOptionPresent: false,
    });

    it("is named as the missing option, not as an unavailable snapshot", () => {
      expect(refusal?.condition).toBe("approved_option_absent");
      expect(refusal?.detail).toMatch(/no approved P3 solution option/i);
      expect(refusal?.detail).not.toMatch(
        /approved option or P3 context snapshot is unavailable/i,
      );
    });

    it("prescribes approving an option and rules out a rebuild", () => {
      expect(refusal?.detail).toMatch(/approve a P3 solution option/i);
      expect(refusal?.rebuildCanSatisfy).toBe(false);
      expect(refusal?.detail).toMatch(/[Rr]ebuilding .*cannot create one/);
    });

    it("refuses on both callers' conditions", () => {
      expect(
        classifyP3ArchitectureLineagePrecondition({
          ...ready,
          approvedOptionPresent: false,
          staleRefuses: false,
        })?.condition,
      ).toBe("approved_option_absent");
    });

    it("is reported even when the extract is also unusable", () => {
      // The option is read first because its remedy is the one a product user
      // holds; an extract refresh cannot substitute for it.
      expect(
        classifyP3ArchitectureLineagePrecondition({
          ...ready,
          approvedOptionPresent: false,
          freshness: null,
        })?.condition,
      ).toBe("approved_option_absent");
    });
  });

  it("an unresolved tenant scope reports that nothing was compared", () => {
    const refusal = classifyP3ArchitectureLineagePrecondition({
      ...ready,
      clientKey: null,
    });
    expect(refusal?.condition).toBe("tenant_scope_unresolved");
    expect(refusal?.rebuildCanSatisfy).toBe(false);
    expect(refusal?.detail).toMatch(/[Nn]othing was compared/);
    expect(refusal?.detail).not.toMatch(
      /The active tenant key is unavailable\./,
    );
  });

  it("an absent extract is not reported as changed evidence", () => {
    const refusal = classifyP3ArchitectureLineagePrecondition({
      ...ready,
      freshness: null,
    });
    expect(refusal?.condition).toBe("context_extract_absent");
    expect(refusal?.rebuildCanSatisfy).toBe(true);
    expect(refusal?.detail).toMatch(/No current P3 Context Extract/);
    expect(refusal?.detail).not.toMatch(/Move evidence changed/);
  });

  it("an empty fingerprint refuses as an absent extract on both callers", () => {
    for (const staleRefuses of [true, false]) {
      expect(
        classifyP3ArchitectureLineagePrecondition({
          ...ready,
          staleRefuses,
          freshness: { ...fresh, evidenceFingerprint: "" },
        })?.condition,
      ).toBe("context_extract_absent");
    }
  });

  describe("an unreadable approved-evidence basis", () => {
    const reasons = [
      "tenant_scope_unresolved",
      "snapshot_load_failed",
      "snapshot_unavailable",
    ] as const;

    it.each(reasons)("%s does not prescribe a rebuild", (reason) => {
      const refusal = classifyP3ArchitectureLineagePrecondition({
        ...ready,
        freshness: {
          ...fresh,
          freshnessStatus: "rebuild_required",
          basisUnevaluableReason: reason,
        },
      });
      expect(refusal?.condition).toBe("context_basis_unevaluable");
      expect(refusal?.reason).toBe(reason);
      expect(refusal?.rebuildCanSatisfy).toBe(false);
      expect(refusal?.detail).toMatch(/cannot clear this/);
      // The sentence must DISCLAIM a change, not assert one.
      expect(refusal?.detail).toMatch(/not a report that the evidence changed/);
      expect(refusal?.detail).not.toMatch(/Move evidence changed after/);
    });

    it("states a different cause for each reason", () => {
      // A clause helper collapsed to one constant would satisfy the
      // same-helper comparison below while telling every reader the same thing.
      const details = reasons.map(
        (reason) =>
          classifyP3ArchitectureLineagePrecondition({
            ...ready,
            freshness: {
              ...fresh,
              freshnessStatus: "rebuild_required",
              basisUnevaluableReason: reason,
            },
          })?.detail,
      );
      expect(new Set(details).size).toBe(reasons.length);
    });

    it.each(reasons)("%s names which read could not be made", (reason) => {
      const refusal = classifyP3ArchitectureLineagePrecondition({
        ...ready,
        freshness: {
          ...fresh,
          freshnessStatus: "rebuild_required",
          basisUnevaluableReason: reason,
        },
      });
      expect(refusal?.detail).toContain(
        describeUnevaluableApprovedEvidenceBasis(reason),
      );
    });
  });

  it("an extract with no recorded revision is rebuild-shaped", () => {
    const refusal = classifyP3ArchitectureLineagePrecondition({
      ...ready,
      freshness: {
        ...fresh,
        freshnessStatus: "rebuild_required",
        approvedEvidenceRevision: null,
      },
    });
    expect(refusal?.condition).toBe("context_recorded_basis_absent");
    expect(refusal?.rebuildCanSatisfy).toBe(true);
  });

  it("an extract marked for rebuild with a readable basis keeps that reading", () => {
    const refusal = classifyP3ArchitectureLineagePrecondition({
      ...ready,
      freshness: { ...fresh, freshnessStatus: "rebuild_required" },
    });
    expect(refusal?.condition).toBe("context_extract_rebuild_required");
    expect(refusal?.rebuildCanSatisfy).toBe(true);
  });

  it("a superseded extract is the only reading that reports changed evidence", () => {
    const refusal = classifyP3ArchitectureLineagePrecondition({
      ...ready,
      freshness: { ...fresh, freshnessStatus: "stale" },
    });
    expect(refusal?.condition).toBe("context_superseded");
    expect(refusal?.detail).toMatch(/Move evidence changed/);
  });

  it("an unrecognised status still refuses", () => {
    // Narrowing the last arm to `=== "stale"` would let an unrecognised status
    // fall through and PASS, so a document could be approved against an extract
    // nothing had certified.
    const refusal = classifyP3ArchitectureLineagePrecondition({
      ...ready,
      freshness: {
        ...fresh,
        freshnessStatus: "FRESH" as unknown as "fresh",
      },
    });
    expect(refusal).not.toBeNull();
    expect(refusal?.condition).toBe("context_superseded");
  });

  it("the sign-off caller's condition ignores a non-fresh extract", () => {
    // `staleRefuses: false` is the sign-off path, whose original condition
    // required only that an extract exist. Widening it here would add a refusal.
    for (const freshnessStatus of ["stale", "rebuild_required"] as const) {
      expect(
        classifyP3ArchitectureLineagePrecondition({
          ...ready,
          staleRefuses: false,
          freshness: { ...fresh, freshnessStatus },
        }),
      ).toBeNull();
    }
  });

  it("exactly three readings rule out a rebuild", () => {
    const inputs = [
      { ...ready, clientKey: null },
      { ...ready, approvedOptionPresent: false },
      { ...ready, freshness: null },
      {
        ...ready,
        freshness: {
          ...fresh,
          freshnessStatus: "rebuild_required" as const,
          basisUnevaluableReason: "snapshot_unavailable" as const,
        },
      },
      {
        ...ready,
        freshness: {
          ...fresh,
          freshnessStatus: "rebuild_required" as const,
          approvedEvidenceRevision: null,
        },
      },
      { ...ready, freshness: { ...fresh, freshnessStatus: "stale" as const } },
    ];
    const unsatisfiable = inputs
      .map((input) => classifyP3ArchitectureLineagePrecondition(input))
      .filter((refusal) => refusal && !refusal.rebuildCanSatisfy)
      .map((refusal) => refusal?.condition);
    expect(unsatisfiable.sort()).toEqual([
      "approved_option_absent",
      "context_basis_unevaluable",
      "tenant_scope_unresolved",
    ]);
  });

  it("no refusal prescribes the rebuild it has ruled out", () => {
    const ruledOut = [
      { ...ready, approvedOptionPresent: false },
      {
        ...ready,
        freshness: {
          ...fresh,
          freshnessStatus: "rebuild_required" as const,
          basisUnevaluableReason: "snapshot_load_failed" as const,
        },
      },
    ];
    for (const input of ruledOut) {
      const detail = classifyP3ArchitectureLineagePrecondition(input)?.detail;
      expect(detail).toBeTruthy();
      expect(detail).not.toMatch(
        /(Refresh the Context Extract|Rebuild the architecture chain)/,
      );
    }
  });
});
