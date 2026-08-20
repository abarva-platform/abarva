// Proof that the Moves runtime path uses the CANONICAL per-artifact quality
// contract, not a hardcoded generic floor.
//
// The audit found `resolveQualityBar` was never called on this path: the
// registry's per-artifact depth bands, ceilings and narrative-spine
// requirements had been written, reviewed and reconciled across two pipelines —
// and never executed once. The enforced bar was 5 sections / 600 words with no
// ceiling, for every Moves artifact type.

import { buildMoveDeliverableRequest } from "../build-request";
import { resolveQualityBar } from "@/lib/deliverables/orchestrator/quality-bar-registry";
import type { MoveBusinessCaseInput } from "@/lib/programs/move-business-case";

function move(): MoveBusinessCaseInput {
  return {
    id: "11111111-1111-4111-8111-111111111111",
    name: "Care coordination uplift",
    tenant_key: "meridian-health",
    tenant_name: "Meridian Health",
    charter: {
      sponsor: "Chief Operating Officer",
      stakeholders: "Care management, analytics, IT",
      success_metrics: "Reduce avoidable readmissions",
      value_range: "Directional, to be validated in P4",
      scope: "In: care coordination. Out: claims adjudication.",
    },
    baseline_metrics: [],
  } as unknown as MoveBusinessCaseInput;
}

function barFor(deliverableType: string) {
  return buildMoveDeliverableRequest(move(), {
    deliverableType,
    phaseOrStage: "P4_business_case",
    artifactStandard: "moves.board_grade.costed_business_case",
    decisionContext: "Fund / shape / kill.",
  }).request.qualityBar;
}

describe("the canonical quality contract reaches the runtime request", () => {
  it("applies the reconciled P4 business-case band, not a generic floor", () => {
    const bar = barFor("business_case");
    expect(bar.minSections).toBe(9);
    expect(bar.minBodyWords).toBe(3_000);
    expect(bar.targetBodyWordsMax).toBe(5_000);
    expect(bar.advisoryBandMax).toBe(5_800);
    expect(bar.enforceMaxAsBlocker).toBe(true);
    expect(bar.excludeNonProseFromBody).toBe(true);
  });

  it("carries the narrative-spine requirements that were previously dead", () => {
    const bar = barFor("business_case");
    expect(bar.requiresCentralTension).toBe(true);
    expect(bar.requiresOptionsConsidered).toBe(true);
    expect(bar.requiresEvidenceGapsNoted).toBe(true);
  });

  it("is no longer the hardcoded 5-section / 600-word floor", () => {
    const bar = barFor("business_case");
    expect(bar.minSections).not.toBe(5);
    expect(bar.minBodyWords).not.toBe(600);
  });

  it("gives each artifact type its own contract rather than one shared bar", () => {
    const businessCase = barFor("business_case");
    const charter = barFor("charter");
    const architecture = barFor("target_state_architecture");

    expect(charter.minBodyWords).toBeLessThan(businessCase.minBodyWords);
    expect(architecture.minBodyWords).toBeGreaterThan(
      businessCase.minBodyWords,
    );
    // The architecture artifact must never be squeezed by a brevity rule.
    expect(architecture.enforceMaxAsBlocker).toBe(false);
  });

  it("matches the registry exactly, so the runtime cannot drift from the contract", () => {
    for (const type of [
      "business_case",
      "charter",
      "target_state_architecture",
      "solution_design",
      "roadmap",
    ]) {
      const expected = resolveQualityBar("moves", type);
      const actual = barFor(type);
      // Everything except the deliberate source-register override.
      const { requiresSourceRegister: _a, ...actualRest } = actual;
      const { requiresSourceRegister: _b, ...expectedRest } = expected;
      expect(actualRest).toEqual(expectedRest);
    }
  });

  it("keeps the source register mandatory for board-grade Move artifacts", () => {
    // Deliberately stricter than the generic builder's `evidence.length > 0`:
    // a Move artifact is gated on governed evidence upstream, so a missing
    // register here is a real defect rather than an empty-bundle edge case.
    expect(barFor("business_case").requiresSourceRegister).toBe(true);
    expect(barFor("charter").requiresSourceRegister).toBe(true);
  });
});
