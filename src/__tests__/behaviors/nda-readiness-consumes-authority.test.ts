import {
  buildSourceNewNdaReadiness,
  type SourceNewNdaArtifact,
} from "@/lib/source/new-workspace/nda-readiness";
import type { NdaCoverageInput } from "@/lib/source/nda/nda-scope-authority";

/**
 * Stage 05 readiness established that a document was filed, hashed, reviewed
 * and in date. It could not establish the two things the owner decision
 * added, because neither is a property of the file: whether Legal published
 * the template version the document cites, and whether a waiver standing in
 * for an NDA meets all four of its requirements.
 *
 * Readiness now consults `evaluateNdaCoverage` for both. These cases pin the
 * three consequences the item asked for — an uncovered supplier blocks, a
 * waiver is displayed *as a waiver*, and a registry outage reads as blocked
 * rather than clear — plus the one that makes the first meaningful: a
 * document that looks complete by every file-level check must still be
 * refused when nothing covers the event.
 */

const COMPLETE_ARTIFACT: SourceNewNdaArtifact = {
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

const AS_OF = "2026-09-19T00:00:00Z";

function coverage(overrides: Partial<NdaCoverageInput> = {}): NdaCoverageInput {
  return {
    registryAvailable: true,
    tenantKey: "t1",
    eventId: "evt-1",
    supplierLegalEntityId: "entity-a",
    publishedTemplateVersions: ["v3"],
    executedNdas: [],
    waivers: [],
    asOf: AS_OF,
    ...overrides,
  };
}

const COVERING_NDA = {
  ndaId: "nda-1",
  tenantKey: "t1",
  supplierLegalEntityId: "entity-a",
  templateVersion: "v3",
  scopeLevel: "supplier_entity" as const,
  coveredEventIds: ["evt-1"],
  coveredAffiliateEntityIds: [],
  effectiveFrom: "2026-01-01T00:00:00Z",
  uploadedBy: "procurement-user",
};

const GOOD_WAIVER = {
  waiverId: "wv-1",
  tenantKey: "t1",
  supplierLegalEntityId: "entity-a",
  eventId: "evt-1",
  reason: "Incumbent under a master agreement; counsel confirmed cover.",
  expiresAt: "2026-12-31T00:00:00Z",
  approvedByLegalName: "A. Counsel",
  approvedAt: "2026-06-01T00:00:00Z",
};

describe("stage 05 readiness consumes the NDA coverage authority", () => {
  it("does not treat an artifact type that merely contains the letters nda as an NDA", () => {
    const lookalike = {
      ...COMPLETE_ARTIFACT,
      artifactType: "foundational_assessment",
      title: "Foundational assessment",
    };

    const result = buildSourceNewNdaReadiness([lookalike], AS_OF);

    expect(result.posture).toBe("blocked");
    expect(result.blockers).toContain("No current NDA artifact is filed.");
    expect(result.artifactTitle).toBeNull();
  });

  it("is ready when the file checks pass and an executed NDA covers the event", () => {
    const result = buildSourceNewNdaReadiness(
      [COMPLETE_ARTIFACT],
      AS_OF,
      coverage({ executedNdas: [COVERING_NDA] }),
    );

    expect(result.posture).toBe("ready");
    expect(result.waiver).toBeUndefined();
    expect(result.completeItems).toEqual(
      expect.arrayContaining([
        "Executed NDA covers this event on a published template version",
      ]),
    );
  });

  it("blocks a document that passes every file-level check when nothing covers the event", () => {
    // The case that makes the mount worth making. Before this, an artifact
    // this complete read as ready on its own properties alone.
    const withoutCoverage = buildSourceNewNdaReadiness(
      [COMPLETE_ARTIFACT],
      AS_OF,
    );
    expect(withoutCoverage.posture).toBe("ready");

    const withCoverage = buildSourceNewNdaReadiness(
      [COMPLETE_ARTIFACT],
      AS_OF,
      coverage(),
    );
    expect(withCoverage.posture).toBe("blocked");
    expect(withCoverage.blockers.join(" ")).toContain(
      "No executed NDA covers this event",
    );
  });

  it("reads a registry outage as blocked rather than clear, and says why", () => {
    const result = buildSourceNewNdaReadiness(
      [COMPLETE_ARTIFACT],
      AS_OF,
      coverage({ registryAvailable: false, executedNdas: [COVERING_NDA] }),
    );

    expect(result.posture).toBe("blocked");
    expect(result.blockers.join(" ")).toContain("unknown is not covered");
  });

  it("displays a waiver as a waiver, with its approver and expiry", () => {
    // The decision requires a waiver to be distinguishable from an NDA on the
    // surface. A result that only said "ready" would satisfy the gate and
    // defeat the policy.
    const result = buildSourceNewNdaReadiness(
      [COMPLETE_ARTIFACT],
      AS_OF,
      coverage({ waivers: [GOOD_WAIVER] }),
    );

    expect(result.posture).toBe("ready");
    expect(result.waiver).toEqual({
      waiverId: "wv-1",
      approvedByLegalName: "A. Counsel",
      expiresAt: "2026-12-31T00:00:00Z",
      reason: GOOD_WAIVER.reason,
    });
    expect(result.completeItems.join(" ")).toContain(
      "Covered by WAIVER wv-1, not by an NDA",
    );
  });

  it("does not present a waiver when an executed NDA is what covered it", () => {
    const result = buildSourceNewNdaReadiness(
      [COMPLETE_ARTIFACT],
      AS_OF,
      coverage({ executedNdas: [COVERING_NDA], waivers: [GOOD_WAIVER] }),
    );

    expect(result.posture).toBe("ready");
    expect(result.waiver).toBeUndefined();
  });

  it("blocks when a waiver is the only candidate and it is defective", () => {
    const result = buildSourceNewNdaReadiness(
      [COMPLETE_ARTIFACT],
      AS_OF,
      coverage({ waivers: [{ ...GOOD_WAIVER, approvedByLegalName: "" }] }),
    );

    expect(result.posture).toBe("blocked");
    expect(result.blockers.join(" ")).toContain("names no Legal approver");
  });

  it("leaves the existing behaviour alone when no coverage input is supplied", () => {
    // The optional parameter is what let this land without rewriting the
    // caller. It is also the gap: where coverage is absent the policy is not
    // enforced, and that has to stay visible rather than read as a pass.
    const result = buildSourceNewNdaReadiness([COMPLETE_ARTIFACT], AS_OF);

    expect(result.posture).toBe("ready");
    expect(result.waiver).toBeUndefined();
    expect(result.blockers).toEqual([]);
  });
});
