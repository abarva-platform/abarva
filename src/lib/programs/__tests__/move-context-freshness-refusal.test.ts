import {
  classifyMoveContextFreshnessRefusal,
  type MoveContextFreshnessForRefusal,
} from "@/lib/programs/move-context-freshness-refusal";

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
