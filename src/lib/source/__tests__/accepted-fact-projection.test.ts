import { projectAcceptedSourceFacts } from "../accepted-fact-projection";

const scope = {
  tenantKey: "tenant-a",
  eventId: "event-a",
  asOf: "2026-09-23T00:00:00.000Z",
};

function assertion(overrides: Record<string, unknown> = {}) {
  return {
    assertionId: "assertion-1",
    factId: "fact-1",
    tenantKey: "tenant-a",
    eventId: "event-a",
    factKey: "contract.annual_fee",
    value: 120000,
    source: {
      system: "supplier_response",
      artifactId: "artifact-1",
      versionId: "version-1",
      location: "pricing!B4",
    },
    confidence: "high",
    reviewStatus: "accepted",
    reviewedBy: "reviewer-1",
    reviewedAt: "2026-09-22T20:00:00.000Z",
    extractionState: "reviewed",
    conflictStatus: "clear",
    effectiveFrom: "2026-09-01T00:00:00.000Z",
    effectiveTo: null,
    observedAt: "2026-09-22T19:00:00.000Z",
    staleAfter: "2026-12-01T00:00:00.000Z",
    supersedesAssertionId: null,
    ...overrides,
  };
}

describe("accepted Source fact projection", () => {
  it("projects an accepted, reviewed assertion with declared identity, dates and provenance", () => {
    const result = projectAcceptedSourceFacts(scope, [assertion()]);

    expect(result.excluded).toEqual([]);
    expect(result.facts).toEqual([
      expect.objectContaining({
        factId: "fact-1",
        assertionId: "assertion-1",
        tenantKey: "tenant-a",
        eventId: "event-a",
        value: 120000,
        effectiveFrom: "2026-09-01T00:00:00.000Z",
        asOf: "2026-09-22T19:00:00.000Z",
        source: expect.objectContaining({
          artifactId: "artifact-1",
          versionId: "version-1",
          location: "pricing!B4",
        }),
      }),
    ]);
  });

  it.each([
    ["draft", { reviewStatus: "draft" }],
    ["rejected", { reviewStatus: "rejected" }],
    ["conflicted", { conflictStatus: "conflicted" }],
    ["parser only", { extractionState: "parser_only" }],
    ["unnamed review", { reviewedBy: "User" }],
    ["unverified confidence", { confidence: "unverified" }],
    [
      "missing provenance",
      {
        source: {
          system: "supplier_response",
          artifactId: "",
          versionId: "version-1",
          location: "pricing!B4",
        },
      },
    ],
  ])(
    "keeps %s visible for review but out of projected facts",
    (_name, override) => {
      const result = projectAcceptedSourceFacts(scope, [assertion(override)]);
      expect(result.facts).toEqual([]);
      expect(result.excluded).toEqual([
        expect.objectContaining({ assertionId: "assertion-1" }),
      ]);
    },
  );

  it("never projects a cross-tenant or cross-event assertion", () => {
    const result = projectAcceptedSourceFacts(scope, [
      assertion({ assertionId: "wrong-tenant", tenantKey: "tenant-b" }),
      assertion({ assertionId: "wrong-event", eventId: "event-b" }),
    ]);
    expect(result.facts).toEqual([]);
    expect(result.excluded.map((entry) => entry.assertionId)).toEqual([
      "wrong-tenant",
      "wrong-event",
    ]);
  });

  it("excludes stale, future and invalid effective-time assertions", () => {
    const result = projectAcceptedSourceFacts(scope, [
      assertion({
        assertionId: "stale",
        staleAfter: "2026-09-22T00:00:00.000Z",
      }),
      assertion({
        assertionId: "future",
        effectiveFrom: "2026-10-01T00:00:00.000Z",
      }),
      assertion({ assertionId: "bad-date", observedAt: "not-a-date" }),
    ]);
    expect(result.facts).toEqual([]);
    expect(result.excluded).toHaveLength(3);
  });

  it("withholds competing accepted assertions for one fact unless supersession is explicit", () => {
    const result = projectAcceptedSourceFacts(scope, [
      assertion(),
      assertion({ assertionId: "assertion-2", value: 125000 }),
    ]);
    expect(result.facts).toEqual([]);
    expect(result.excluded.map((entry) => entry.reason)).toEqual([
      "unresolved_conflict",
      "unresolved_conflict",
    ]);
  });

  it("projects only the accepted successor in a valid same-fact supersession chain", () => {
    const result = projectAcceptedSourceFacts(scope, [
      assertion(),
      assertion({
        assertionId: "assertion-2",
        value: 125000,
        supersedesAssertionId: "assertion-1",
      }),
    ]);
    expect(result.facts.map((fact) => fact.assertionId)).toEqual([
      "assertion-2",
    ]);
    expect(result.excluded).toEqual([
      { assertionId: "assertion-1", reason: "superseded" },
    ]);
  });

  it("does not project the old source fact when a reviewed replacement has a new fact ID", () => {
    const result = projectAcceptedSourceFacts(scope, [
      assertion(),
      assertion({
        assertionId: "assertion-2",
        factId: "fact-2",
        value: 125000,
        supersedesAssertionId: "assertion-1",
      }),
    ]);
    expect(result.facts.map((fact) => fact.assertionId)).toEqual([
      "assertion-2",
    ]);
    expect(result.excluded).toEqual([
      { assertionId: "assertion-1", reason: "superseded" },
    ]);
  });

  it("fails closed when the predecessor of a replacement is missing", () => {
    const result = projectAcceptedSourceFacts(scope, [
      assertion({
        assertionId: "assertion-2",
        factId: "fact-2",
        supersedesAssertionId: "unavailable-assertion",
      }),
    ]);
    expect(result.facts).toEqual([]);
    expect(result.excluded).toEqual([
      { assertionId: "assertion-2", reason: "unresolved_conflict" },
    ]);
  });
});
