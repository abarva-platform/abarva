/**
 * The write-side evidence-basis phase scope.
 *
 * The property under test is not "the bounds are 1 and 5" — restating those
 * would pass while the predicate they mirror changed underneath. It is that an
 * approved-evidence currency check is reported as evaluable EXACTLY where
 * `isApprovedMoveEvidenceBasisCurrent` will actually compare, and that
 * everywhere else the refusal is `basis_unevaluable` with `rebuildCanSatisfy`
 * false — never a claim that approved evidence changed.
 */
import { readFileSync } from "node:fs";
import { DELIVERABLE_REGISTRY } from "@/lib/programs/deliverable-registry";
import { isApprovedMoveEvidenceBasisCurrent } from "@/lib/programs/approved-move-evidence-snapshot";
import {
  classifyApprovedEvidenceBasisRefusal,
  describeApprovedEvidenceBasisRefusal,
} from "@/lib/programs/approved-evidence-basis-refusal";
import {
  DELIVERABLE_APPROVAL_CURRENCY_PHASES,
  resolveApprovedEvidenceBasisPhaseScope,
} from "@/lib/programs/approved-evidence-basis-phase-scope";

const { min, max } = DELIVERABLE_APPROVAL_CURRENCY_PHASES;

/** A registry built for the test, so the out-of-range arm is reachable. */
const constructedRegistry = [
  { deliverableTypeKey: "below_range_brief", phase: min - 1 },
  { deliverableTypeKey: "in_range_charter", phase: min },
  { deliverableTypeKey: "top_of_range_handoff", phase: max },
  { deliverableTypeKey: "above_range_handoff", phase: max + 1 },
] as const;

describe("resolveApprovedEvidenceBasisPhaseScope", () => {
  it("reports a phase inside the modelled range as evaluable, at that phase", () => {
    expect(
      resolveApprovedEvidenceBasisPhaseScope("in_range_charter", {
        registry: constructedRegistry,
      }),
    ).toEqual({ evaluable: true, phase: min });
    expect(
      resolveApprovedEvidenceBasisPhaseScope("top_of_range_handoff", {
        registry: constructedRegistry,
      }),
    ).toEqual({ evaluable: true, phase: max });
  });

  // The arm the sign-off route did not have. BOTH edges, because the route's
  // own guard covered the lower one and only the lower one.
  it.each([
    ["below_range_brief", min - 1],
    ["above_range_handoff", max + 1],
  ])(
    "refuses %s (phase %i) as outside the evidence-basis range",
    (key, phase) => {
      const scope = resolveApprovedEvidenceBasisPhaseScope(key, {
        registry: constructedRegistry,
      });
      expect(scope).toEqual({
        evaluable: false,
        phase: null,
        cause: "deliverable_phase_outside_evidence_basis_range",
      });
      // Non-vacuity: the predicate really does refuse to compare at this phase,
      // which is why the scope must not call it evaluable.
      expect(
        isApprovedMoveEvidenceBasisCurrent({
          snapshot: {
            revision: "rev-1",
            phaseRevisions: { [phase]: "rev-1" },
            latestEvidenceActivityAtByPhase: {
              [phase]: "2026-01-01T00:00:00.000Z",
            },
          } as unknown as Parameters<
            typeof isApprovedMoveEvidenceBasisCurrent
          >[0]["snapshot"],
          phase,
          recordedRevision: "rev-1",
          scope: "phase",
          generatedAt: "2026-06-01T00:00:00.000Z",
        }),
      ).toBe(false);
    },
  );

  it("refuses a key the registry does not carry as an unresolved phase", () => {
    expect(
      resolveApprovedEvidenceBasisPhaseScope("not_a_registered_key", {
        registry: constructedRegistry,
      }),
    ).toEqual({
      evaluable: false,
      phase: null,
      cause: "deliverable_phase_unresolved",
    });
  });

  // The two unevaluable causes must stay distinguishable: a registration at an
  // unmodelled phase is a different fact from a missing registration, and the
  // read-side component splits them for that reason.
  it("names the two unevaluable causes distinctly", () => {
    const outOfRange = resolveApprovedEvidenceBasisPhaseScope(
      "above_range_handoff",
      { registry: constructedRegistry },
    );
    const unregistered = resolveApprovedEvidenceBasisPhaseScope("nope", {
      registry: constructedRegistry,
    });
    expect(outOfRange.evaluable).toBe(false);
    expect(unregistered.evaluable).toBe(false);
    expect(outOfRange).not.toEqual(unregistered);
  });

  // Every shipped spec, measured rather than assumed. This is what fails if a
  // P0 or P6 deliverable is registered later: the scope answers unevaluable and
  // this expectation records which specs that applies to.
  it("agrees with the predicate for every shipped registry spec", () => {
    for (const spec of DELIVERABLE_REGISTRY) {
      const scope = resolveApprovedEvidenceBasisPhaseScope(
        spec.deliverableTypeKey,
      );
      const withinModelledRange = spec.phase >= min && spec.phase <= max;
      expect(scope.evaluable).toBe(withinModelledRange);
      if (scope.evaluable) expect(scope.phase).toBe(spec.phase);
    }
  });
});

describe("the refusal an unevaluable phase scope produces", () => {
  // The invariant `approved-evidence-basis-refusal.ts` exists to hold, asserted
  // here through the input the sign-off route actually supplies. Gating
  // `basisEvaluable` on the scope is what makes it hold; gating it on a lower
  // bound alone is what broke it.
  it.each(["below_range_brief", "above_range_handoff", "nope"])(
    "never prescribes a rebuild for %s",
    (key) => {
      const scope = resolveApprovedEvidenceBasisPhaseScope(key, {
        registry: constructedRegistry,
      });
      expect(scope.evaluable).toBe(false);
      const refusal = classifyApprovedEvidenceBasisRefusal({
        basisEvaluable: scope.evaluable,
        cause: scope.evaluable ? null : scope.cause,
        // What the predicate returns at such a phase, and what the route used
        // to hand the classifier as if it were a comparison.
        recordedRevision: "rev-recorded",
        basisIsCurrent: false,
      });
      expect(refusal).not.toBeNull();
      expect(refusal!.condition).toBe("basis_unevaluable");
      expect(refusal!.rebuildCanSatisfy).toBe(false);
      const text = describeApprovedEvidenceBasisRefusal(refusal!, "approval");
      expect(text).toContain("could not run at all");
      expect(text).not.toContain("Approved evidence changed");
    },
  );

  // The regression this fix removes, stated as the old inputs. A lower-bound-only
  // guard calls an out-of-range phase evaluable, and the classifier then — given
  // a recorded revision and the predicate's unconditional `false` — asserts the
  // document is stale and that a rebuild fixes it. Both claims are unfounded.
  it("would claim a stale document if evaluability were gated on the lower bound alone", () => {
    const phase = max + 1;
    const lowerBoundOnly = phase >= min;
    expect(lowerBoundOnly).toBe(true);
    const refusal = classifyApprovedEvidenceBasisRefusal({
      basisEvaluable: lowerBoundOnly,
      recordedRevision: "rev-recorded",
      basisIsCurrent: false,
    });
    expect(refusal!.condition).toBe("recorded_basis_superseded");
    expect(refusal!.rebuildCanSatisfy).toBe(true);
    expect(
      describeApprovedEvidenceBasisRefusal(refusal!, "approval"),
    ).toContain("Approved evidence changed");
  });

  it("describes the out-of-range cause distinctly from the other three", () => {
    const texts = (
      [
        "snapshot_unreadable",
        "tenant_scope_unresolved",
        "deliverable_phase_unresolved",
        "deliverable_phase_outside_evidence_basis_range",
      ] as const
    ).map((cause) =>
      describeApprovedEvidenceBasisRefusal(
        { condition: "basis_unevaluable", cause, rebuildCanSatisfy: false },
        "approval",
      ),
    );
    expect(new Set(texts).size).toBe(4);
    expect(texts[3]).toContain("outside the range");
  });
});

/**
 * The route wiring.
 *
 * The rule above is only worth anything where the sign-off route actually
 * consults it: a correct helper reached by nobody is the recorded failure mode
 * of several earlier fixes here. The route handler's own dependency graph
 * (Clerk, tenancy, the Azure write client, the office scanners) is not
 * constructible in this suite, so the wiring is pinned against the source —
 * anchored on the helper's NAME, and on the absence of the bound-only guard it
 * replaced, rather than on any expression of my own.
 */
describe("the deliverable sign-off route's evidence-basis evaluability", () => {
  const SOURCE = readFileSync(
    "src/app/api/v1/programs/[programId]/deliverables/[deliverableId]/sign-off/route.ts",
    "utf8",
  );

  it("resolves the phase scope through the shared rule", () => {
    expect(SOURCE).toContain("resolveApprovedEvidenceBasisPhaseScope");
    expect(SOURCE).toContain(
      "@/lib/programs/approved-evidence-basis-phase-scope",
    );
  });

  it("gates basisEvaluable on the scope, not on a phase bound of its own", () => {
    const call = SOURCE.slice(
      SOURCE.indexOf("classifyApprovedEvidenceBasisRefusal({"),
    );
    expect(call).not.toBe("");
    const basisEvaluableLine = call.slice(
      call.indexOf("basisEvaluable:"),
      call.indexOf("recordedRevision:"),
    );
    expect(basisEvaluableLine).toContain("evidenceBasisPhaseScope.evaluable");
    // The guard this fix removed. Either spelling of a bare bound comparison
    // deciding evaluability is the defect, so neither may come back.
    expect(basisEvaluableLine).not.toMatch(/deliverablePhase\s*>=?\s*1/);
    expect(basisEvaluableLine).not.toMatch(/deliverablePhase\s*<\s*1/);
  });

  it("takes the refusal cause from the scope", () => {
    expect(SOURCE).toContain("evidenceBasisPhaseScope.cause");
  });
});
