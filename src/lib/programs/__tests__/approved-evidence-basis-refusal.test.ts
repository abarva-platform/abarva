import {
  approvedEvidenceBasisRefusalCode,
  classifyApprovedEvidenceBasisRefusal,
  describeApprovedEvidenceBasisRefusal,
  unevaluableApprovedEvidenceBasisRefusal,
} from "@/lib/programs/approved-evidence-basis-refusal";

// The four Moves write paths that compare a document's recorded approved-evidence
// revision against the Move's current one each answered three independent facts
// with one `stale_*` code. This suite pins the three apart, and pins the one
// property the conflation violated: a refusal must not prescribe an action it
// also reports cannot succeed.

describe("classifyApprovedEvidenceBasisRefusal", () => {
  it("returns no refusal when the basis is evaluable, recorded, and current", () => {
    expect(
      classifyApprovedEvidenceBasisRefusal({
        basisEvaluable: true,
        recordedRevision: "rev-1",
        basisIsCurrent: true,
      }),
    ).toBeNull();
  });

  it("names an unreadable basis unevaluable rather than superseded", () => {
    const refusal = classifyApprovedEvidenceBasisRefusal({
      basisEvaluable: false,
      cause: "snapshot_unreadable",
      recordedRevision: "rev-1",
      basisIsCurrent: false,
    });
    expect(refusal).toEqual({
      condition: "basis_unevaluable",
      cause: "snapshot_unreadable",
      rebuildCanSatisfy: false,
    });
  });

  // `isApprovedMoveEvidenceBasisCurrent` answers `false` for all three
  // conditions, so an unevaluable basis reaching the classifier with
  // `basisIsCurrent: false` must still be classified by the basis, not the
  // predicate. It must also not be rescued by a `true` the caller could not
  // honestly have produced.
  it("classifies by the basis, whichever way the currency predicate answered", () => {
    for (const basisIsCurrent of [true, false]) {
      expect(
        classifyApprovedEvidenceBasisRefusal({
          basisEvaluable: false,
          recordedRevision: "rev-1",
          basisIsCurrent,
        })?.condition,
      ).toBe("basis_unevaluable");
    }
  });

  it("carries the cause the caller established, not a single default", () => {
    expect(
      classifyApprovedEvidenceBasisRefusal({
        basisEvaluable: false,
        cause: "tenant_scope_unresolved",
        recordedRevision: null,
        basisIsCurrent: false,
      })?.cause,
    ).toBe("tenant_scope_unresolved");
    expect(
      classifyApprovedEvidenceBasisRefusal({
        basisEvaluable: false,
        cause: "deliverable_phase_unresolved",
        recordedRevision: "rev-1",
        basisIsCurrent: false,
      })?.cause,
    ).toBe("deliverable_phase_unresolved");
  });

  // An unevaluable basis outranks a missing recorded revision: with no basis to
  // compare against, whether the document recorded one is not what blocks.
  it("reports an unevaluable basis even when no revision was recorded", () => {
    expect(
      classifyApprovedEvidenceBasisRefusal({
        basisEvaluable: false,
        recordedRevision: null,
        basisIsCurrent: false,
      })?.condition,
    ).toBe("basis_unevaluable");
  });

  it("separates a document that recorded no revision from one that is superseded", () => {
    expect(
      classifyApprovedEvidenceBasisRefusal({
        basisEvaluable: true,
        recordedRevision: null,
        basisIsCurrent: false,
      }),
    ).toEqual({
      condition: "recorded_basis_absent",
      cause: null,
      rebuildCanSatisfy: true,
    });
    expect(
      classifyApprovedEvidenceBasisRefusal({
        basisEvaluable: true,
        recordedRevision: "rev-old",
        basisIsCurrent: false,
      }),
    ).toEqual({
      condition: "recorded_basis_superseded",
      cause: null,
      rebuildCanSatisfy: true,
    });
  });

  // A blank recorded revision is no revision. The route callers read the hash
  // off `structuredData`/`metadata`, where an empty string is a live shape.
  it("treats a blank recorded revision as absent", () => {
    expect(
      classifyApprovedEvidenceBasisRefusal({
        basisEvaluable: true,
        recordedRevision: "",
        basisIsCurrent: false,
      })?.condition,
    ).toBe("recorded_basis_absent");
  });

  it("builds the same refusal as a caller's narrowing fallback", () => {
    expect(
      classifyApprovedEvidenceBasisRefusal({
        basisEvaluable: false,
        recordedRevision: "rev-1",
        basisIsCurrent: false,
      }),
    ).toEqual(unevaluableApprovedEvidenceBasisRefusal());
  });
});

describe("describeApprovedEvidenceBasisRefusal", () => {
  // The defect this module exists to prevent: a refusal that prescribes a
  // rebuild while reporting that a rebuild cannot satisfy it. Asserted as a
  // property over every condition, not case by case, so a later condition
  // cannot be added without obeying it.
  it("never prescribes a rebuild for a refusal a rebuild cannot satisfy", () => {
    const refusals = [
      unevaluableApprovedEvidenceBasisRefusal("snapshot_unreadable"),
      unevaluableApprovedEvidenceBasisRefusal("tenant_scope_unresolved"),
      unevaluableApprovedEvidenceBasisRefusal("deliverable_phase_unresolved"),
      classifyApprovedEvidenceBasisRefusal({
        basisEvaluable: true,
        recordedRevision: null,
        basisIsCurrent: false,
      }),
      classifyApprovedEvidenceBasisRefusal({
        basisEvaluable: true,
        recordedRevision: "rev-old",
        basisIsCurrent: false,
      }),
    ];
    for (const refusal of refusals) {
      expect(refusal).not.toBeNull();
      if (!refusal) continue;
      for (const surface of ["approval", "build"] as const) {
        const text = describeApprovedEvidenceBasisRefusal(refusal, surface);
        const prescribesRebuild = /\b(Rebuild|Re-run)\b/.test(text);
        expect(prescribesRebuild).toBe(refusal.rebuildCanSatisfy);
      }
    }
  });

  it("does not claim evidence changed when nothing of the sort was established", () => {
    const text = describeApprovedEvidenceBasisRefusal(
      unevaluableApprovedEvidenceBasisRefusal("snapshot_unreadable"),
      "build",
    );
    expect(text).toContain("was not verified as changed");
    expect(text).toContain("will not change the answer");
    expect(text).not.toMatch(/evidence changed after/i);
  });

  it("names each unevaluable cause distinctly", () => {
    const texts = (
      [
        "snapshot_unreadable",
        "tenant_scope_unresolved",
        "deliverable_phase_unresolved",
      ] as const
    ).map((cause) =>
      describeApprovedEvidenceBasisRefusal(
        unevaluableApprovedEvidenceBasisRefusal(cause),
        "approval",
      ),
    );
    expect(new Set(texts).size).toBe(3);
    expect(texts[1]).toContain("tenant key");
    expect(texts[2]).toContain("phase");
  });

  it("addresses the approval surface and the build surface differently", () => {
    const refusal = unevaluableApprovedEvidenceBasisRefusal();
    expect(
      describeApprovedEvidenceBasisRefusal(refusal, "approval"),
    ).toContain("Regenerating this document");
    expect(describeApprovedEvidenceBasisRefusal(refusal, "build")).toContain(
      "Re-running this build",
    );
  });

  // The absent and superseded texts both prescribe the re-run, so asserting the
  // prescription alone cannot tell them apart — deleting the absent branch would
  // fall through to the superseded text and still read as "Re-run". Each must
  // state its own fact.
  it("states what a document that recorded no revision is missing, not that evidence changed", () => {
    const refusal = classifyApprovedEvidenceBasisRefusal({
      basisEvaluable: true,
      recordedRevision: null,
      basisIsCurrent: false,
    });
    expect(refusal).not.toBeNull();
    if (!refusal) return;
    for (const surface of ["approval", "build"] as const) {
      const text = describeApprovedEvidenceBasisRefusal(refusal, surface);
      expect(text).toContain("records no approved-evidence revision");
      expect(text).not.toMatch(/evidence changed after/i);
    }
  });

  it("still says evidence changed for a genuinely superseded basis", () => {
    const refusal = classifyApprovedEvidenceBasisRefusal({
      basisEvaluable: true,
      recordedRevision: "rev-old",
      basisIsCurrent: false,
    });
    expect(refusal).not.toBeNull();
    if (!refusal) return;
    expect(describeApprovedEvidenceBasisRefusal(refusal, "build")).toContain(
      "Approved Move evidence changed after this build was queued",
    );
  });
});

describe("approvedEvidenceBasisRefusalCode", () => {
  it("gives each condition its own code, and keeps the existing stale code", () => {
    const codes = (
      [
        unevaluableApprovedEvidenceBasisRefusal(),
        classifyApprovedEvidenceBasisRefusal({
          basisEvaluable: true,
          recordedRevision: null,
          basisIsCurrent: false,
        }),
        classifyApprovedEvidenceBasisRefusal({
          basisEvaluable: true,
          recordedRevision: "rev-old",
          basisIsCurrent: false,
        }),
      ].filter((refusal) => refusal !== null) as ReturnType<
        typeof unevaluableApprovedEvidenceBasisRefusal
      >[]
    ).map(approvedEvidenceBasisRefusalCode);
    expect(codes).toEqual([
      "approved_evidence_basis_unevaluable",
      "approved_evidence_basis_not_recorded",
      "stale_approved_evidence_snapshot",
    ]);
  });

  // The cause is reported in the text, not in the code: an operator filtering
  // runs by code must see every unevaluable basis under one code.
  it("uses one code for every unevaluable cause", () => {
    const codes = (
      [
        "snapshot_unreadable",
        "tenant_scope_unresolved",
        "deliverable_phase_unresolved",
      ] as const
    ).map((cause) =>
      approvedEvidenceBasisRefusalCode(
        unevaluableApprovedEvidenceBasisRefusal(cause),
      ),
    );
    expect(new Set(codes)).toEqual(
      new Set(["approved_evidence_basis_unevaluable"]),
    );
  });
});
