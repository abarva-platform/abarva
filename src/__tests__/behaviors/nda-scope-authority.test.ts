import {
  evaluateNdaCoverage,
  describeWaiverDefects,
  type ExecutedNdaRecord,
  type NdaCoverageInput,
  type NdaWaiverRecord,
} from "@/lib/source/nda/nda-scope-authority";

/**
 * Stage 05 NDA had no policy saying which template version applied, which
 * affiliate or event scope was covered, or when a waiver may stand in for an
 * NDA. The owner decision settles it: Legal owns versioned text, Procurement
 * owns scope, day one is controlled upload of an executed document, and there
 * is **no silent waiver** — a waiver must be explicit, time-bound, reasoned,
 * displayed separately, and carry a named Legal approver.
 *
 * These cases hold the contract to that, and they lean on the negative side
 * on purpose. Every way this could quietly say "covered" is a way a supplier
 * receives material they have not contracted to protect, so each of them has
 * its own case rather than being folded into one happy-path assertion.
 */

const NDA: ExecutedNdaRecord = {
  ndaId: "nda-1",
  tenantKey: "t1",
  supplierLegalEntityId: "entity-a",
  templateVersion: "v3",
  scopeLevel: "supplier_entity",
  coveredEventIds: ["evt-1"],
  coveredAffiliateEntityIds: [],
  effectiveFrom: "2026-01-01T00:00:00Z",
  uploadedBy: "procurement-user",
};

const WAIVER: NdaWaiverRecord = {
  waiverId: "wv-1",
  tenantKey: "t1",
  supplierLegalEntityId: "entity-a",
  eventId: "evt-1",
  reason: "Incumbent already under a master agreement; counsel confirmed cover.",
  expiresAt: "2026-12-31T00:00:00Z",
  approvedByLegalName: "A. Counsel",
  approvedAt: "2026-06-01T00:00:00Z",
};

function input(overrides: Partial<NdaCoverageInput> = {}): NdaCoverageInput {
  return {
    registryAvailable: true,
    tenantKey: "t1",
    eventId: "evt-1",
    supplierLegalEntityId: "entity-a",
    publishedTemplateVersions: ["v3"],
    executedNdas: [],
    waivers: [],
    asOf: "2026-09-19T00:00:00Z",
    ...overrides,
  };
}

describe("NDA coverage is earned, not assumed", () => {
  it("covers a supplier with an executed NDA that names the event", () => {
    const result = evaluateNdaCoverage(input({ executedNdas: [NDA] }));

    expect(result.state).toBe("covered_by_nda");
    expect(result.ndaId).toBe("nda-1");
    // The reason is populated on a pass too: why a gate cleared is evidence.
    expect(result.reason).toContain("nda-1");
  });

  it("refuses when the registry slice is unavailable", () => {
    // Unknown is not covered. This is the case that decides whether an outage
    // opens the gate or closes it.
    const result = evaluateNdaCoverage(input({ registryAvailable: false, executedNdas: [NDA] }));

    expect(result.state).toBe("not_covered");
    expect(result.reason).toContain("unknown is not covered");
  });

  it("refuses an NDA on a template version Legal has not published", () => {
    const result = evaluateNdaCoverage(
      input({ executedNdas: [{ ...NDA, templateVersion: "v2-draft" }] }),
    );

    expect(result.state).toBe("not_covered");
  });

  it("refuses an NDA with the supplier that does not name this event", () => {
    // The inference the decision exists to refuse: having an NDA with a
    // supplier is not having one for this engagement.
    const result = evaluateNdaCoverage(
      input({ executedNdas: [{ ...NDA, coveredEventIds: ["evt-other"] }] }),
    );

    expect(result.state).toBe("not_covered");
  });

  it("refuses an expired NDA", () => {
    const result = evaluateNdaCoverage(
      input({ executedNdas: [{ ...NDA, effectiveTo: "2026-02-01T00:00:00Z" }] }),
    );

    expect(result.state).toBe("not_covered");
  });

  it("reaches an affiliate only when the scope level says so", () => {
    const entityOnly = evaluateNdaCoverage(
      input({
        supplierLegalEntityId: "affiliate-b",
        executedNdas: [{ ...NDA, coveredAffiliateEntityIds: ["affiliate-b"] }],
      }),
    );
    expect(entityOnly.state).toBe("not_covered");

    const affiliateScope = evaluateNdaCoverage(
      input({
        supplierLegalEntityId: "affiliate-b",
        executedNdas: [
          { ...NDA, scopeLevel: "supplier_and_affiliates", coveredAffiliateEntityIds: ["affiliate-b"] },
        ],
      }),
    );
    expect(affiliateScope.state).toBe("covered_by_nda");
  });

  it("never reads an opposite-tenant NDA as cover", () => {
    const result = evaluateNdaCoverage(input({ executedNdas: [{ ...NDA, tenantKey: "t2" }] }));

    expect(result.state).toBe("not_covered");
  });
});

describe("no silent waiver", () => {
  it("accepts a waiver that meets every requirement, and marks it as a waiver", () => {
    const result = evaluateNdaCoverage(input({ waivers: [WAIVER] }));

    expect(result.state).toBe("covered_by_waiver");
    expect(result.waiver?.waiverId).toBe("wv-1");
    // It must be displayable as a waiver rather than indistinguishable from an NDA.
    expect(result.reason).toContain("Display it as a waiver, not as an NDA");
    expect(result.reason).toContain("A. Counsel");
  });

  it.each([
    ["states no reason", { reason: "   " }],
    ["names no Legal approver", { approvedByLegalName: "" }],
    ["has no expiry", { expiresAt: "" }],
    ["was granted for another event", { eventId: "evt-other" }],
    ["was granted for another legal entity", { supplierLegalEntityId: "entity-z" }],
    ["belongs to another tenant", { tenantKey: "t2" }],
  ])("refuses a waiver that %s", (_label, overrides) => {
    const result = evaluateNdaCoverage(
      input({ waivers: [{ ...WAIVER, ...(overrides as Partial<NdaWaiverRecord>) }] }),
    );

    expect(result.state).toBe("not_covered");
  });

  it("refuses an expired waiver and says which one and why", () => {
    const result = evaluateNdaCoverage(
      input({ waivers: [{ ...WAIVER, expiresAt: "2026-07-01T00:00:00Z" }] }),
    );

    expect(result.state).toBe("not_covered");
    expect(result.reason).toContain("wv-1");
    expect(result.reason).toContain("expired");
  });

  it("names every defect, not just the first", () => {
    // The failure has to be actionable in one pass; reporting one missing
    // field at a time turns a single fix into four round trips.
    const defects = describeWaiverDefects(
      { ...WAIVER, reason: "", approvedByLegalName: "", expiresAt: "" },
      input(),
    );

    expect(defects).toEqual(
      expect.arrayContaining([
        "states no reason",
        "names no Legal approver",
        expect.stringContaining("no expiry"),
      ]),
    );
  });

  it("prefers an executed NDA over a waiver when both would apply", () => {
    // A waiver must never be the recorded reason a gate cleared while a real
    // NDA existed — that would understate the position on the record.
    const result = evaluateNdaCoverage(input({ executedNdas: [NDA], waivers: [WAIVER] }));

    expect(result.state).toBe("covered_by_nda");
    expect(result.waiver).toBeUndefined();
  });

  it("refuses everything when Legal has published no template versions", () => {
    // The control on the control: with no published templates, no executed
    // document can be checked, so nothing may pass on the NDA path.
    const result = evaluateNdaCoverage(
      input({ publishedTemplateVersions: [], executedNdas: [NDA] }),
    );

    expect(result.state).toBe("not_covered");
    expect(result.reason).toContain("no NDA template versions");
  });
});
