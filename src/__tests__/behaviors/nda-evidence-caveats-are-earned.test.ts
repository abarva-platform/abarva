import {
  evaluateNdaCoverage,
  type ExecutedNdaRecord,
  type NdaCoverageInput,
  type NdaWaiverRecord,
} from "@/lib/source/nda/nda-scope-authority";
import { buildSourceNewNdaReadiness } from "@/lib/source/new-workspace/nda-readiness";

/**
 * Two of the coverage authority's inputs are taken on trust: the published
 * template versions are whatever the caller hands over, and the affiliate
 * entity ids are whatever the NDA record claims. Deriving either needs
 * register tables that do not exist, so the honest interim is to say —
 * beside the answer — where the confidence exceeds the evidence.
 *
 * The rule that makes that worth anything is that a caveat has to be
 * *earned*. A result that carried both caveats every time would train a
 * reader to skip them, which is the same as not stating them. So each case
 * here pins a decision that depended on a trusted input against one that
 * did not.
 */

const TEMPLATE = /published template versions were supplied by the caller/;
const AFFILIATE = /affiliate list was asserted/;

const BASE_NDA: ExecutedNdaRecord = {
  ndaId: "nda-1",
  tenantKey: "t1",
  supplierLegalEntityId: "entity-a",
  templateVersion: "v3",
  scopeLevel: "supplier_entity",
  coveredEventIds: ["evt-1"],
  coveredAffiliateEntityIds: [],
  effectiveFrom: "2026-01-01T00:00:00Z",
  uploadedBy: "ops",
};

const GOOD_WAIVER: NdaWaiverRecord = {
  waiverId: "wv-1",
  tenantKey: "t1",
  supplierLegalEntityId: "entity-a",
  eventId: "evt-1",
  reason: "Counsel confirmed cover under a master agreement.",
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

describe("an evidence caveat is earned, not attached to everything", () => {
  it("names the unverified template list when an NDA is what cleared it", () => {
    const result = evaluateNdaCoverage(input({ executedNdas: [BASE_NDA] }));

    expect(result.state).toBe("covered_by_nda");
    expect(result.evidenceCaveats.join(" ")).toMatch(TEMPLATE);
    // A direct entity match consulted no affiliate list.
    expect(result.evidenceCaveats.join(" ")).not.toMatch(AFFILIATE);
  });

  it("adds the affiliate caveat only when cover came through the affiliate route", () => {
    const viaAffiliate = evaluateNdaCoverage(
      input({
        supplierLegalEntityId: "entity-sub",
        executedNdas: [
          {
            ...BASE_NDA,
            scopeLevel: "supplier_and_affiliates",
            coveredAffiliateEntityIds: ["entity-sub"],
          },
        ],
      }),
    );

    expect(viaAffiliate.state).toBe("covered_by_nda");
    expect(viaAffiliate.evidenceCaveats.join(" ")).toMatch(AFFILIATE);

    // Same scope level, but the entity matched directly. The affiliate list
    // was present and simply was not what decided it.
    const direct = evaluateNdaCoverage(
      input({
        executedNdas: [
          {
            ...BASE_NDA,
            scopeLevel: "supplier_and_affiliates",
            coveredAffiliateEntityIds: ["entity-sub"],
          },
        ],
      }),
    );

    expect(direct.state).toBe("covered_by_nda");
    expect(direct.evidenceCaveats.join(" ")).not.toMatch(AFFILIATE);
  });

  it("carries no caveat when a waiver cleared it, because a waiver cites neither", () => {
    const result = evaluateNdaCoverage(input({ waivers: [GOOD_WAIVER] }));

    expect(result.state).toBe("covered_by_waiver");
    expect(result.evidenceCaveats).toEqual([]);
  });

  it("carries no caveat when the registry was never read", () => {
    const result = evaluateNdaCoverage(input({ registryAvailable: false }));

    expect(result.state).toBe("not_covered");
    expect(result.evidenceCaveats).toEqual([]);
  });

  it("names the template list when a refusal rests on an empty published set", () => {
    const result = evaluateNdaCoverage(
      input({ publishedTemplateVersions: [], executedNdas: [BASE_NDA] }),
    );

    expect(result.state).toBe("not_covered");
    expect(result.evidenceCaveats.join(" ")).toMatch(TEMPLATE);
  });

  it("names the template list when an NDA was turned away for its template alone", () => {
    // The list may be the thing that is wrong. A reader deciding whether to
    // chase Legal needs to know that.
    const result = evaluateNdaCoverage(
      input({
        publishedTemplateVersions: ["v3"],
        executedNdas: [{ ...BASE_NDA, templateVersion: "v4" }],
      }),
    );

    expect(result.state).toBe("not_covered");
    expect(result.evidenceCaveats.join(" ")).toMatch(TEMPLATE);
  });

  it("stays silent when a refusal had nothing to do with the template list", () => {
    // Wrong event. Publishing every template in existence would not change
    // this answer, so implicating the list would be noise.
    const result = evaluateNdaCoverage(
      input({ executedNdas: [{ ...BASE_NDA, coveredEventIds: ["evt-other"] }] }),
    );

    expect(result.state).toBe("not_covered");
    expect(result.evidenceCaveats).toEqual([]);
  });

  it("stays silent when no executed NDA exists at all", () => {
    const result = evaluateNdaCoverage(input());

    expect(result.state).toBe("not_covered");
    expect(result.evidenceCaveats).toEqual([]);
  });

  it("states the caveat on the readiness output, beside the posture", () => {
    // A caveat a reader has to go looking for is not stated. This is the
    // surface a person actually sees.
    const artifact = {
      id: "a1",
      artifactType: "nda_executed",
      title: "Executed NDA",
      status: "approved",
      lifecycleState: "current",
      approvalState: "approved",
      approvedAt: "2026-06-01T00:00:00Z",
      blobSha256: "abc123",
      coveredSupplierLegalEntity: "entity-a",
      coveredScopeId: "scope-1",
      effectiveFrom: "2026-01-01T00:00:00Z",
      expiresOn: "2027-01-01T00:00:00Z",
    };

    const covered = buildSourceNewNdaReadiness(
      [artifact],
      "2026-09-19T00:00:00Z",
      input({ executedNdas: [BASE_NDA] }),
    );
    expect(covered.posture).toBe("ready");
    expect(covered.evidenceCaveats.join(" ")).toMatch(TEMPLATE);

    // And it does not invent one where no coverage was evaluated.
    const noCoverage = buildSourceNewNdaReadiness(
      [artifact],
      "2026-09-19T00:00:00Z",
    );
    expect(noCoverage.evidenceCaveats).toEqual([]);
  });
});
