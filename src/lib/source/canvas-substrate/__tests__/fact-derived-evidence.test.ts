import {
  deriveFactBackedEvidenceStates,
  isFactBackedEvidence,
  mergeFactBackedEvidenceStates,
} from "../fact-derived-evidence";
import type { SourceEventEvidence, SourceEventFactRow } from "../types";

describe("fact-derived evidence", () => {
  it("derives Available evidence from cited structured source_event_facts", () => {
    const derived = deriveFactBackedEvidenceStates([
      fact({
        id: "fact-change-order",
        fact_key: "annual_change_order_spend",
      }),
    ]);

    expect(derived).toHaveLength(1);
    expect(derived[0]).toMatchObject({
      requirementId: "EVID-SRC-SCOPE-TICKET-HISTORY",
      stage: "scope",
      currentState: "Available",
      sourceArtifactId: null,
      sourceEventFactIds: ["fact-change-order"],
    });
    expect(isFactBackedEvidence(derived[0])).toBe(true);
  });

  it("does not derive gate evidence from stale, low-confidence, uncited, or analyst-entered facts", () => {
    const derived = deriveFactBackedEvidenceStates([
      fact({ id: "stale", is_stale: true }),
      fact({ id: "low-confidence", confidence: "low" }),
      fact({ id: "uncited", source_citation: null }),
      fact({ id: "analyst", source_method: "analyst_entered" }),
      fact({ id: "empty-value", value_numeric: null, value_text: null }),
    ]);

    expect(derived).toEqual([]);
  });

  it("groups duplicate mapped facts without creating duplicate evidence rows", () => {
    const derived = deriveFactBackedEvidenceStates([
      fact({ id: "fact-1", fact_key: "response_addressed" }),
      fact({ id: "fact-2", fact_key: "response_addressed" }),
    ]);

    expect(derived).toHaveLength(1);
    expect(derived[0]?.requirementId).toBe("EVID-SRC-RESP-PROPOSALS");
    expect(derived[0]?.sourceEventFactIds).toEqual(["fact-1", "fact-2"]);
  });

  it("does not downgrade uploaded or explicitly usable evidence", () => {
    const merged = mergeFactBackedEvidenceStates(
      [
        evidence({
          currentState: "Usable Evidence",
          sourceArtifactId: "source-artifact-1",
        }),
      ],
      [
        evidence({
          id: "fact-derived:event-1:EVID-SRC-SCOPE-TICKET-HISTORY",
          currentState: "Available",
          sourceArtifactId: null,
          sourceEventFactIds: ["fact-1"],
        }),
      ],
    );

    expect(merged).toHaveLength(1);
    expect(merged[0]).toMatchObject({
      currentState: "Usable Evidence",
      sourceArtifactId: "source-artifact-1",
    });
    expect(merged[0]?.sourceEventFactIds).toBeUndefined();
  });

  it("replaces same-rank client-stated evidence with fact-backed evidence", () => {
    const merged = mergeFactBackedEvidenceStates(
      [
        evidence({
          id: "client-stated",
          currentState: "Available",
          sourceArtifactId: null,
        }),
      ],
      [
        evidence({
          id: "fact-derived:event-1:EVID-SRC-SCOPE-TICKET-HISTORY",
          currentState: "Available",
          sourceArtifactId: null,
          sourceEventFactIds: ["fact-1"],
        }),
      ],
    );

    expect(merged).toHaveLength(1);
    expect(merged[0]).toMatchObject({
      id: "fact-derived:event-1:EVID-SRC-SCOPE-TICKET-HISTORY",
      currentState: "Available",
      sourceArtifactId: null,
      sourceEventFactIds: ["fact-1"],
    });
  });

  it("preserves explicit stale and low-confidence evidence states", () => {
    const merged = mergeFactBackedEvidenceStates(
      [
        evidence({
          currentState: "Low Confidence",
          sourceArtifactId: null,
        }),
      ],
      [
        evidence({
          currentState: "Available",
          sourceArtifactId: null,
          sourceEventFactIds: ["fact-1"],
        }),
      ],
    );

    expect(merged[0]).toMatchObject({
      currentState: "Low Confidence",
    });
    expect(merged[0]?.sourceEventFactIds).toBeUndefined();
  });
});

function fact(overrides: Partial<SourceEventFactRow> = {}): SourceEventFactRow {
  return {
    id: "fact-1",
    source_event_id: "event-1",
    client_key: "skyharbor-air",
    fact_key: "annual_change_order_spend",
    entity_kind: "event",
    entity_ref: null,
    value_numeric: 1200000,
    value_text: null,
    unit: "usd",
    source_method: "structured_map",
    source_citation: {
      doc: "VOLUMETRICS_V1",
      locator: "annual_change_order_spend",
    },
    confidence: "high",
    captured_at: "2026-07-18T00:00:00.000Z",
    is_stale: false,
    ...overrides,
  };
}

function evidence(
  overrides: Partial<SourceEventEvidence> = {},
): SourceEventEvidence {
  return {
    id: "evidence-1",
    sourceEventId: "event-1",
    tenantKey: "skyharbor-air",
    requirementId: "EVID-SRC-SCOPE-TICKET-HISTORY",
    stage: "scope",
    currentState: "Available",
    sourceArtifactId: null,
    notes: null,
    lastSyncedAt: "2026-07-18T00:00:00.000Z",
    createdAt: "2026-07-18T00:00:00.000Z",
    updatedAt: "2026-07-18T00:00:00.000Z",
    ...overrides,
  };
}
