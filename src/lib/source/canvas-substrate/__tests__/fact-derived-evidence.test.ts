import {
  deriveFactBackedEvidenceStates,
  isFactBackedEvidence,
  mergeFactBackedEvidenceStates,
} from "../fact-derived-evidence";
import type { SourceEventEvidence, SourceEventFactRow } from "../types";

describe("fact-derived evidence", () => {
  it("does not mistake service economics for parsed ticket history", () => {
    const derived = deriveFactBackedEvidenceStates([
      fact({
        id: "fact-change-order",
        fact_key: "annual_change_order_spend",
      }),
    ]);

    expect(derived).toEqual([]);
  });

  it("derives Available ticket history only from cited L2 and L3 cohorts", () => {
    const derived = deriveFactBackedEvidenceStates([
      fact({
        id: "ticket-l2", fact_key: "ticket_count", entity_kind: "tower",
        entity_ref: "Service desk", value_numeric: "42" as unknown as number, unit: "count",
        source_citation: {
          doc: "synthetic-ticket.csv", locator: "row 1, Ticket Count",
          source_sha256: "a".repeat(64), support_tier: "L2",
          month: "2026-08", time_window: "Business hours",
          source_basis: "Synthetic smoke scenario",
        },
      }),
      fact({
        id: "ticket-l3", fact_key: "ticket_count", entity_kind: "tower",
        entity_ref: "Service desk", value_numeric: 13, unit: "count",
        source_citation: {
          doc: "synthetic-ticket.csv", locator: "row 2, Ticket Count",
          source_sha256: "a".repeat(64), support_tier: "L3",
          month: "2026-08", time_window: "After hours",
          source_basis: "Synthetic smoke scenario",
        },
      }),
    ]);

    expect(derived).toHaveLength(1);
    expect(derived[0]).toMatchObject({
      requirementId: "EVID-SRC-SCOPE-TICKET-HISTORY",
      stage: "scope",
      currentState: "Available",
      sourceArtifactId: null,
      sourceEventFactIds: ["ticket-l2", "ticket-l3"],
    });
    expect(isFactBackedEvidence(derived[0])).toBe(true);
  });

  it("keeps a single-tier ticket upload below Available", () => {
    expect(deriveFactBackedEvidenceStates([
      fact({
        fact_key: "ticket_count", entity_kind: "tower", unit: "count",
        source_citation: {
          doc: "synthetic-ticket.csv", locator: "row 1, Ticket Count",
          source_sha256: "a".repeat(64), support_tier: "L2",
          month: "2026-08", time_window: "Business hours",
        },
      }),
    ])).toEqual([]);
  });

  it("does not assemble L2 and L3 from different files into one gate receipt", () => {
    const baseCitation = {
      doc: "ticket-history.csv", locator: "row 1, Ticket Count",
      month: "2026-08", time_window: "Business hours",
      source_basis: "Synthetic smoke scenario",
    };
    expect(deriveFactBackedEvidenceStates([
      fact({
        id: "l2", fact_key: "ticket_count", entity_kind: "tower",
        entity_ref: "Service desk", unit: "count", value_numeric: 42,
        source_citation: { ...baseCitation, support_tier: "L2", source_sha256: "a".repeat(64) },
      }),
      fact({
        id: "l3", fact_key: "ticket_count", entity_kind: "tower",
        entity_ref: "Service desk", unit: "count", value_numeric: 13,
        source_citation: { ...baseCitation, support_tier: "L3", source_sha256: "b".repeat(64) },
      }),
    ])).toEqual([]);
  });

  it("does not derive gate evidence from stale, low-confidence, uncited, or analyst-entered facts", () => {
    const invalid = [
      { id: "stale", is_stale: true },
      { id: "low-confidence", confidence: "low" as const },
      { id: "uncited", source_citation: null },
      { id: "analyst", source_method: "analyst_entered" as const },
      { id: "empty-value", value_numeric: null, value_text: null },
      { id: "fraction", value_numeric: 1.5 },
    ];
    for (const overrides of invalid) {
      expect(deriveFactBackedEvidenceStates([
        ticketFact("L2", overrides),
        ticketFact("L3", { id: "valid-l3" }),
      ])).toEqual([]);
    }
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

function ticketFact(
  tier: "L2" | "L3",
  overrides: Partial<SourceEventFactRow> = {},
): SourceEventFactRow {
  return fact({
    id: `ticket-${tier}`,
    fact_key: "ticket_count",
    entity_kind: "tower",
    entity_ref: "Service desk",
    value_numeric: 42,
    unit: "count",
    source_citation: {
      doc: "synthetic-ticket.csv", locator: `row ${tier}, Ticket Count`,
      source_sha256: "a".repeat(64), support_tier: tier,
      month: "2026-08", time_window: "Business hours",
      source_basis: "Synthetic smoke scenario",
    },
    ...overrides,
  });
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
