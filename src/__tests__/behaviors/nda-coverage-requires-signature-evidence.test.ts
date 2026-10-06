import { buildSourceNewStage05NdaCoverage } from "@/lib/source/new-workspace/stage05-nda-coverage";
import type { ExecutedNdaRecord } from "@/lib/source/nda/nda-scope-authority";

/**
 * Coverage by an executed document is only as good as the evidence that it
 * was executed. The record says a file was filed, by whom, under which
 * template. A hash proves the bytes did not change; it says nothing about
 * whose signature is on them, or whether both sides signed.
 *
 * Absence and incompleteness are treated differently, and that is the
 * decision this suite pins. No row carried signature evidence before the
 * capture columns existed, so refusing on absence would turn every covered
 * supplier red the day it lands — a gate that fails on arrival is a gate
 * somebody switches off. Refusing on incompleteness costs nothing today and
 * bites the moment anyone records evidence badly, which is when it should.
 */

const AS_OF = "2026-09-19";

const CANDIDATE = {
  authorityId: "auth-1",
  supplierId: "entity-a",
  legalEntityId: "entity-a",
  legalName: "Supplier A",
  acceptedByName: "A. Buyer",
  acceptedAt: "2026-09-01T00:00:00Z",
  acceptanceRationale: "Named in the category strategy.",
  evidenceReference: "EVID-1",
};

function nda(overrides: Partial<ExecutedNdaRecord> = {}): ExecutedNdaRecord {
  return {
    ndaId: "nda-1",
    tenantKey: "t1",
    supplierLegalEntityId: "entity-a",
    templateVersion: "v3",
    scopeLevel: "supplier_entity",
    coveredEventIds: ["evt-1"],
    coveredAffiliateEntityIds: [],
    effectiveFrom: "2026-01-01T00:00:00Z",
    uploadedBy: "ops",
    ...overrides,
  };
}

const COMPLETE_EVIDENCE = {
  documentSha256: "abc123",
  signatureMethod: "wet_ink" as const,
  signedAt: "2026-06-01T00:00:00Z",
  supplierSignatoryName: "R. Vendor",
  buyerSignatoryName: "A. Buyer",
};

function coverageFor(record: ExecutedNdaRecord) {
  return buildSourceNewStage05NdaCoverage({
    clientKey: "t1",
    eventId: "evt-1",
    asOf: AS_OF,
    candidateRegistryAvailable: true,
    suppliers: [
      {
        candidate: CANDIDATE,
        ndaAuthority: {
          registryAvailable: true,
          publishedTemplateVersions: ["v3"],
          executedNdas: [record],
          waivers: [],
        },
      },
    ],
  });
}

describe("coverage consults the signature evidence behind the document", () => {
  it("stays covered when no signature evidence was ever captured, and says so", () => {
    // Every row predating the capture columns is in this state. Refusing
    // here would turn every covered supplier red on the day this lands.
    const coverage = coverageFor(nda());
    const supplier = coverage.suppliers[0];

    expect(supplier.state).toBe("covered_by_nda");
    expect(supplier.evidenceCaveats.join(" ")).toContain(
      "The file is on record; the signing is not.",
    );
  });

  it("refuses coverage when evidence was captured and falls short", () => {
    // The guard that matters. Someone recorded a signature method and one
    // signatory and stopped, which reads as progress and is not.
    const coverage = coverageFor(
      nda({
        signatureEvidence: {
          ...COMPLETE_EVIDENCE,
          buyerSignatoryName: null,
        },
      }),
    );
    const supplier = coverage.suppliers[0];

    expect(supplier.state).toBe("not_covered");
    expect(supplier.reason).toContain("signature evidence is incomplete");
    expect(supplier.reason).toContain("No internal signatory");
  });

  it("stays covered, with no caveat, when the evidence is complete", () => {
    const coverage = coverageFor(nda({ signatureEvidence: COMPLETE_EVIDENCE }));
    const supplier = coverage.suppliers[0];

    expect(supplier.state).toBe("covered_by_nda");
    expect(supplier.evidenceCaveats.join(" ")).not.toContain(
      "the signing is not",
    );
  });

  it("refuses a document signed by only one side", () => {
    const coverage = coverageFor(
      nda({
        signatureEvidence: { ...COMPLETE_EVIDENCE, supplierSignatoryName: "  " },
      }),
    );

    expect(coverage.suppliers[0].state).toBe("not_covered");
    expect(coverage.suppliers[0].reason).toContain("No supplier signatory");
  });

  it("refuses an out-of-band e-signature with no completion certificate", () => {
    const coverage = coverageFor(
      nda({
        signatureEvidence: {
          ...COMPLETE_EVIDENCE,
          signatureMethod: "e_signature_out_of_band",
        },
      }),
    );

    expect(coverage.suppliers[0].state).toBe("not_covered");
    expect(coverage.suppliers[0].reason).toContain("completion certificate");
  });

  it("leaves a waiver-cleared supplier alone, because a waiver has no document", () => {
    // The signature check applies to coverage granted by an executed
    // document. A waiver is a different instrument and asserting document
    // evidence against it would refuse a correct record.
    const coverage = buildSourceNewStage05NdaCoverage({
      clientKey: "t1",
      eventId: "evt-1",
      asOf: AS_OF,
      candidateRegistryAvailable: true,
      suppliers: [
        {
          candidate: CANDIDATE,
          ndaAuthority: {
            registryAvailable: true,
            publishedTemplateVersions: ["v3"],
            executedNdas: [],
            waivers: [
              {
                waiverId: "wv-1",
                tenantKey: "t1",
                supplierLegalEntityId: "entity-a",
                eventId: "evt-1",
                reason: "Counsel confirmed cover under a master agreement.",
                expiresAt: "2026-12-31T00:00:00Z",
                approvedByLegalName: "A. Counsel",
                approvedAt: "2026-06-01T00:00:00Z",
              },
            ],
          },
        },
      ],
    });

    expect(coverage.suppliers[0].state).toBe("covered_by_waiver");
    expect(coverage.suppliers[0].evidenceCaveats.join(" ")).not.toContain(
      "the signing is not",
    );
  });
});
