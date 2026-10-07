import {
  buildPhaseFindings,
  isFindingsPhase,
  summarizePhaseFindingsReview,
  type FindingReviewState,
} from "@/lib/programs/moves-phase-findings";
import type {
  InstrumentReadiness,
  ReadinessReport,
} from "@/lib/programs/current-state-readiness";
import type { DeliverableContentSignal } from "@/lib/deliverables/deliverable-content-signals";

function instrument(
  over: Partial<InstrumentReadiness> & Pick<InstrumentReadiness, "key" | "label">,
): InstrumentReadiness {
  return {
    kind: "qualitative",
    whyNeeded: "Needed to diagnose the current state.",
    sourceDocHint: "Governance ownership map",
    severity: "hard",
    status: "missing",
    backingTable: null,
    committedRows: 0,
    rationale: "Applies to this archetype at this phase.",
    documentFamily: true,
    pendingReviews: [],
    evidenceDigest: [],
    ...over,
  };
}

function report(
  phase: number,
  instruments: InstrumentReadiness[],
): ReadinessReport {
  const hardGaps = instruments
    .filter((i) => i.severity === "hard" && i.status !== "committed")
    .map((i) => i.key);
  const softGaps = instruments
    .filter((i) => i.severity === "soft" && i.status !== "committed")
    .map((i) => i.key);
  return {
    phase,
    archetypeId: "arch_1",
    archetypeName: "Data remediation",
    archetypeVersion: "1.0.0",
    // Minimal profile — not read by the model.
    profile: {} as ReadinessReport["profile"],
    instruments,
    coverageScore: 0,
    hardGaps,
    softGaps,
  };
}

describe("isFindingsPhase", () => {
  it("is true only for the intelligence phases P2 and P4", () => {
    expect([0, 1, 2, 3, 4, 5].filter(isFindingsPhase)).toEqual([2, 4]);
  });
});

describe("buildPhaseFindings", () => {
  it("returns null for a non-findings phase (keeps the hand-off recap)", () => {
    expect(
      buildPhaseFindings({ phase: 1, readiness: null, contentSignals: [] }),
    ).toBeNull();
  });

  it("reports a pending empty state when there is no governed content yet", () => {
    const model = buildPhaseFindings({
      phase: 2,
      readiness: null,
      contentSignals: [],
    });
    expect(model).not.toBeNull();
    expect(model!.pending).toBe(true);
    expect(model!.findings).toHaveLength(0);
    // A pending surface asserts no structural headline — it does not guess.
    expect(model!.structuralHeadline).toBeNull();
  });

  it("derives one finding per assessed evidence family on P2 Discover", () => {
    const model = buildPhaseFindings({
      phase: 2,
      readiness: report(2, [
        instrument({
          key: "identity",
          label: "Enterprise identity",
          kind: "qualitative",
          severity: "hard",
          status: "committed",
          documentFamily: true,
          evidenceDigest: [
            "Three source systems carry their own MRNs; no governed EMPI key.",
          ],
          sourceDocHint: "Identity & lineage specs",
        }),
        instrument({
          key: "measures",
          label: "Certified measures",
          kind: "metric_baseline",
          severity: "soft",
          status: "review_required",
          documentFamily: true,
          sourceDocHint: "Certified-measure register",
        }),
      ]),
      contentSignals: [],
    });
    expect(model!.pending).toBe(false);
    expect(model!.findings.map((f) => f.id)).toEqual(["identity", "measures"]);
  });

  it("marks a committed family with carried content high confidence and evidence-backed", () => {
    const model = buildPhaseFindings({
      phase: 2,
      readiness: report(2, [
        instrument({
          key: "identity",
          label: "Enterprise identity",
          status: "committed",
          evidenceDigest: ["No governed EMPI key across three MRNs."],
          sourceDocHint: "Identity specs",
        }),
      ]),
      contentSignals: [],
    });
    const finding = model!.findings[0];
    expect(finding.confidence).toBe("high");
    expect(finding.evidenceBacked).toBe(true);
    expect(finding.evidenceLabel).toBe("Evidence · Identity specs");
    expect(finding.detail).toBe("No governed EMPI key across three MRNs.");
  });

  it("marks a partial (in-review) family medium confidence, held as a gap", () => {
    const model = buildPhaseFindings({
      phase: 2,
      readiness: report(2, [
        instrument({
          key: "measures",
          label: "Certified measures",
          status: "review_required",
        }),
      ]),
      contentSignals: [],
    });
    const finding = model!.findings[0];
    expect(finding.confidence).toBe("medium");
    expect(finding.evidenceBacked).toBe(false);
    expect(finding.evidenceLabel).toBe("Partial · in review");
    expect(finding.kind).toBe("Gap");
  });

  it("marks a missing family low confidence", () => {
    const model = buildPhaseFindings({
      phase: 2,
      readiness: report(2, [
        instrument({ key: "lineage", label: "Lineage", status: "missing" }),
      ]),
      contentSignals: [],
    });
    expect(model!.findings[0].confidence).toBe("low");
    expect(model!.findings[0].evidenceLabel).toBe("Gap · not yet provided");
  });

  it("classifies a hard structural family as the taxonomy trap", () => {
    const model = buildPhaseFindings({
      phase: 2,
      readiness: report(2, [
        instrument({
          key: "identity",
          label: "Enterprise identity",
          kind: "qualitative",
          severity: "hard",
          status: "missing",
        }),
      ]),
      contentSignals: [],
    });
    expect(model!.findings[0].benchmarkSource).toBe("taxonomy_trap");
    expect(model!.findings[0].benchmarkLabel).toBe("Taxonomy trap");
  });

  it("classifies a metric/financial family as an industry baseline", () => {
    const model = buildPhaseFindings({
      phase: 2,
      readiness: report(2, [
        instrument({
          key: "cost",
          label: "Run cost baseline",
          kind: "financial",
          severity: "soft",
          status: "missing",
        }),
      ]),
      contentSignals: [],
    });
    expect(model!.findings[0].benchmarkSource).toBe("industry_baseline");
  });

  it("labels an empirical family with its REAL committed-record count, not a comparable", () => {
    const model = buildPhaseFindings({
      phase: 2,
      readiness: report(2, [
        instrument({
          key: "tools",
          label: "AI tool inventory",
          kind: "inventory",
          status: "committed",
          backingTable: "tower_ai_tool_usage",
          committedRows: 4,
          evidenceDigest: ["AI tool inventory: 4 records committed."],
        }),
      ]),
      contentSignals: [],
    });
    expect(model!.findings[0].benchmarkSource).toBe("empirical");
    expect(model!.findings[0].benchmarkLabel).toBe(
      "Empirical · 4 committed records",
    );
  });

  it("builds the input-vs-generated split from real document families and generated headings", () => {
    const signals: DeliverableContentSignal[] = [
      { key: "hypotheses", heading: "Root-cause tree", snippet: "..." },
      { key: "readiness_gaps", heading: "Readiness gaps", snippet: "..." },
    ];
    const model = buildPhaseFindings({
      phase: 2,
      readiness: report(2, [
        instrument({
          key: "ownership",
          label: "Governance ownership map",
          documentFamily: true,
          status: "committed",
        }),
        instrument({
          key: "entitlements",
          label: "Source-access entitlements",
          documentFamily: true,
          status: "review_required",
        }),
      ]),
      contentSignals: signals,
    });
    expect(model!.inputs.map((r) => [r.label, r.status])).toEqual([
      ["Governance ownership map", "reviewed"],
      ["Source-access entitlements", "partial"],
    ]);
    // The generated side carries the real generated headings + the deliverable,
    // which lands on attest.
    expect(model!.generated.map((r) => r.label)).toEqual([
      "Root-cause tree",
      "Readiness gaps",
      "Phase deliverable",
    ]);
    expect(model!.generated.at(-1)!.status).toBe("pending");
  });

  it("calls a structural headline only when there is a structural hard gap", () => {
    const structural = buildPhaseFindings({
      phase: 2,
      readiness: report(2, [
        instrument({
          key: "identity",
          label: "Identity",
          kind: "qualitative",
          severity: "hard",
          status: "missing",
        }),
      ]),
      contentSignals: [],
    });
    expect(structural!.structuralHeadline).toContain("structural");

    const committed = buildPhaseFindings({
      phase: 2,
      readiness: report(2, [
        instrument({
          key: "identity",
          label: "Identity",
          severity: "hard",
          status: "committed",
          evidenceDigest: ["done"],
        }),
      ]),
      contentSignals: [],
    });
    expect(committed!.structuralHeadline).toBeNull();
  });

  it("adds a confidence note whenever any finding is below high confidence", () => {
    const model = buildPhaseFindings({
      phase: 2,
      readiness: report(2, [
        instrument({ key: "a", label: "A", status: "missing" }),
      ]),
      contentSignals: [],
    });
    expect(model!.confidenceNote).toContain("lower confidence");
  });

  it("surfaces P4 value levers from the generated case, labelled as needing a baseline", () => {
    const model = buildPhaseFindings({
      phase: 4,
      readiness: report(4, []),
      contentSignals: [
        {
          key: "cost",
          heading: "Delivery cost scenarios",
          snippet: "Big 4 vs boutique vs offshore envelopes.",
        },
        // A non-value signal is ignored.
        { key: "owners", heading: "RACI", snippet: "..." },
      ],
    });
    const lever = model!.findings.find((f) => f.id === "signal_cost");
    expect(lever).toBeDefined();
    expect(lever!.kind).toBe("Value");
    expect(lever!.evidenceBacked).toBe(false);
    expect(lever!.benchmarkSource).toBe("generated_projection");
    expect(model!.findings.find((f) => f.id === "signal_owners")).toBeUndefined();
  });

  it("reads every P4 assessed family as a value lever", () => {
    const model = buildPhaseFindings({
      phase: 4,
      readiness: report(4, [
        instrument({
          key: "finance_baseline",
          label: "Finance baseline",
          kind: "financial",
          status: "missing",
        }),
      ]),
      contentSignals: [],
    });
    expect(model!.findings[0].kind).toBe("Value");
  });
});

describe("summarizePhaseFindingsReview", () => {
  const model = buildPhaseFindings({
    phase: 2,
    readiness: report(2, [
      instrument({ key: "a", label: "Alpha", status: "committed", evidenceDigest: ["x"] }),
      instrument({ key: "b", label: "Bravo", status: "committed", evidenceDigest: ["y"] }),
      instrument({ key: "c", label: "Charlie", status: "review_required" }),
    ]),
    contentSignals: [],
  })!;

  it("counts an unreviewed finding as awaiting and names the first open one", () => {
    const summary = summarizePhaseFindingsReview(model, {});
    expect(summary).toMatchObject({
      total: 3,
      accepted: 0,
      challenged: 0,
      awaiting: 3,
      allReviewed: false,
    });
    expect(summary.openFinding!.id).toBe("a");
  });

  it("tallies accepted/challenged/awaiting and names the challenged finding", () => {
    const review: Record<string, FindingReviewState> = {
      a: "accepted",
      b: "accepted",
      c: "challenged",
    };
    const summary = summarizePhaseFindingsReview(model, review);
    expect(summary).toMatchObject({
      accepted: 2,
      challenged: 1,
      awaiting: 0,
      allReviewed: true,
    });
    expect(summary.openFinding).toBeNull();
    expect(summary.challengedFinding!.id).toBe("c");
  });

  it("is not allReviewed while any finding is still awaiting", () => {
    const summary = summarizePhaseFindingsReview(model, { a: "accepted" });
    expect(summary.allReviewed).toBe(false);
    expect(summary.awaiting).toBe(2);
    expect(summary.openFinding!.id).toBe("b");
  });
});
