import { evidenceById } from "../canonical-specs";
import type { SourceEventEvidence } from "../canvas-substrate";
import { evidenceMeetsRequirement } from "../evidence-authority";

function evidence(requirementId: string): SourceEventEvidence {
  return {
    id: `row-${requirementId}`,
    sourceEventId: "event",
    tenantKey: "test-tenant",
    requirementId,
    stage: "strategy",
    currentState: "Not Requested",
    sourceArtifactId: null,
    notes: null,
    lastSyncedAt: null,
    createdAt: "2026-09-28T00:00:00Z",
    updatedAt: "2026-09-28T00:00:00Z",
  };
}

function requirement(id: string) {
  const result = evidenceById(id);
  if (!result) throw new Error(`Missing requirement ${id}`);
  return result;
}

describe("event-specific evidence applicability", () => {
  it("accepts an audited absence of an incumbent without inventing a contract", () => {
    const state = {
      ...evidence("EVID-SRC-STR-INCUMBENT"),
      applicabilityStatus: "not_applicable",
      applicabilityReason: "No incumbent agreement exists for this net-new service.",
      applicabilityActorUserId: "event-owner",
      applicabilityDecidedAt: "2026-09-28T00:00:00Z",
    } as SourceEventEvidence;

    expect(evidenceMeetsRequirement(requirement("EVID-SRC-STR-INCUMBENT"), state)).toBe(true);
    expect(state.currentState).toBe("Not Requested");
    expect(state.sourceArtifactId).toBeNull();
  });

  it("does not let an applicability declaration satisfy an unrelated hard requirement", () => {
    const state = {
      ...evidence("EVID-SRC-STR-SPONSOR-COMMIT"),
      applicabilityStatus: "not_applicable",
      applicabilityReason: "An unrelated declaration must not disable this gate.",
      applicabilityActorUserId: "event-owner",
      applicabilityDecidedAt: "2026-09-28T00:00:00Z",
    } as SourceEventEvidence;

    expect(evidenceMeetsRequirement(requirement("EVID-SRC-STR-SPONSOR-COMMIT"), state)).toBe(false);
  });

  it("requires an actor, time, and substantial rationale for absence", () => {
    const state = {
      ...evidence("EVID-SRC-STR-SPEND-BASELINE"),
      applicabilityStatus: "not_applicable",
      applicabilityReason: "No spend",
      applicabilityActorUserId: null,
      applicabilityDecidedAt: null,
    } as SourceEventEvidence;

    expect(evidenceMeetsRequirement(requirement("EVID-SRC-STR-SPEND-BASELINE"), state)).toBe(false);
  });

  it("resolves a net-new event's prior-contract baseline only from an audited absence", () => {
    const valid = {
      ...evidence("EVID-SRC-SCOPE-FY-CONTRACT"),
      stage: "scope",
      applicabilityStatus: "not_applicable",
      applicabilityReason: "No prior agreement or finance run-cost baseline exists for this net-new sourcing event.",
      applicabilityActorUserId: "event-owner",
      applicabilityDecidedAt: "2026-09-29T00:00:00Z",
    } as SourceEventEvidence;
    const scopeBaseline = requirement("EVID-SRC-SCOPE-FY-CONTRACT");

    expect(evidenceMeetsRequirement(scopeBaseline, valid)).toBe(true);
    expect(evidenceMeetsRequirement(scopeBaseline, { ...valid, applicabilityActorUserId: null })).toBe(false);
    expect(evidenceMeetsRequirement(scopeBaseline, { ...valid, applicabilityReason: "No baseline" })).toBe(false);
    expect(evidenceMeetsRequirement(scopeBaseline, { ...valid, currentState: "Loaded" })).toBe(false);
    expect(evidenceMeetsRequirement(scopeBaseline, { ...valid, sourceArtifactId: "artifact-1" })).toBe(false);
  });
});
