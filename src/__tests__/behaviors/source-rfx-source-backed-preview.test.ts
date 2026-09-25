import {
  previewRfxReleaseAgainstAuthority,
  type RfxAuthorityReaders,
} from "@/lib/source/rfx-delivery/source-backed-preview";
import type { EventCandidateAuthorityRead } from "@/lib/source/candidate-suppliers/event-candidate-authority-repository";
import type { NdaAuthorityRead } from "@/lib/source/nda/nda-authority-repository";
import type { RfxReleaseSnapshotInput } from "@/lib/source/rfx-delivery/release-snapshot";

const HASH = "a".repeat(64);
const AS_OF = "2026-09-25T00:00:00Z";

function proposal(): RfxReleaseSnapshotInput {
  return {
    release: {
      package: {
        packageId: "package-1",
        tenantKey: "tenant-1",
        eventId: "event-1",
        disclosureScope: { classification: "confidential", includedArtifactIds: ["artifact-1"] },
        authentication: { method: "shared_secret", secretRef: "secret-1" },
        expiresAt: "2026-10-15T00:00:00Z",
        recipients: [{
          recipientId: "recipient-1",
          legalEntityId: "vendor-1",
          contactId: "contact-1",
          contactName: "Named contact",
          contactEmail: "contact@example.test",
          contactPolicy: "contact_allowed",
        }],
        receipts: [],
      },
      supplierContactPolicies: { "vendor-1": "contact_allowed" },
      asOf: AS_OF,
    },
    packageVersionId: "version-1",
    version: 1,
    artifacts: [{ artifactId: "artifact-1", sha256: HASH }],
    recipientAuthorities: [{
      recipientId: "recipient-1",
      candidateAuthorityId: "candidate-1",
      candidateTenantKey: "tenant-1",
      candidateEventId: "event-1",
      candidateLegalEntityId: "vendor-1",
      candidateState: "accepted",
      contactAuthorityId: "contact-authority-1",
      contactTenantKey: "tenant-1",
      contactEventId: "event-1",
      contactLegalEntityId: "vendor-1",
      contactId: "contact-1",
      contactName: "Named contact",
      contactEmail: "contact@example.test",
      contactPolicy: "contact_allowed",
      contactState: "approved",
      contactApprovedByUserId: "approver-1",
      contactApprovedAt: "2026-09-24T00:00:00Z",
      contactEvidenceReference: "contact-evidence-1",
      ndaAuthorityId: "nda-1",
      ndaTenantKey: "tenant-1",
      ndaEventId: "event-1",
      ndaLegalEntityId: "vendor-1",
      ndaState: "recorded",
    }],
    approvedByUserId: "release-approver-1",
    approvedAt: AS_OF,
    approvalEvidenceReference: "release-approval-1",
  };
}

function sourceRows(): {
  candidates: EventCandidateAuthorityRead;
  contacts: Awaited<ReturnType<RfxAuthorityReaders["readApprovedContactsForEvent"]>>;
  nda: NdaAuthorityRead;
} {
  return {
    candidates: {
      registryAvailable: true,
      acceptedSupplierIds: ["vendor-1"],
      acceptedCandidates: [{
        authorityId: "candidate-1",
        supplierId: "vendor-1",
        legalEntityId: "vendor-1",
        legalName: "Vendor One",
        acceptedByName: "Named reviewer",
        acceptedAt: "2026-09-23T00:00:00Z",
        acceptanceRationale: "Reviewed",
        evidenceReference: "candidate-evidence-1",
        contactPolicy: "contact_allowed" as const,
      }],
    },
    contacts: {
      registryAvailable: true,
      approvedContacts: [{
        authorityId: "contact-authority-1",
        candidateAuthorityId: "candidate-1",
        tenantKey: "tenant-1",
        eventId: "event-1",
        legalEntityId: "vendor-1",
        contactId: "contact-1",
        contactName: "Named contact",
        contactEmail: "contact@example.test",
        contactPolicy: "contact_allowed" as const,
        contactState: "approved" as const,
        approvedByUserId: "approver-1",
        approvedAt: "2026-09-24T00:00:00Z",
        evidenceReference: "contact-evidence-1",
      }],
    },
    nda: {
      registryAvailable: true,
      publishedTemplateVersions: ["template-v1"],
      executedNdas: [{
        ndaId: "nda-1",
        tenantKey: "tenant-1",
        supplierLegalEntityId: "vendor-1",
        templateVersion: "template-v1",
        scopeLevel: "event_only" as const,
        coveredEventIds: ["event-1"],
        coveredAffiliateEntityIds: [],
        effectiveFrom: "2026-09-23T00:00:00Z",
        effectiveTo: "2026-10-15T00:00:00Z",
        uploadedBy: "operator-1",
        signatureEvidence: {
          documentSha256: HASH,
          signatureMethod: "wet_ink" as const,
          signedAt: "2026-09-23T00:00:00Z",
          supplierSignatoryName: "Supplier signer",
          buyerSignatoryName: "Buyer signer",
        },
      }],
      waivers: [],
    },
  };
}

const artifact = {
  artifactId: "artifact-1",
  tenantKey: "tenant-1",
  eventId: "event-1",
  sha256: HASH,
  lifecycleState: "current",
  deletedAt: null,
};

function readers(rows = sourceRows()): RfxAuthorityReaders {
  return {
    readAcceptedCandidatesForEvent: jest.fn(async () => rows.candidates),
    readApprovedContactsForEvent: jest.fn(async () => rows.contacts),
    readNdaAuthorityForEvent: jest.fn(async () => rows.nda),
    readArtifactsForEvent: jest.fn(async () => ({ registryAvailable: true, artifacts: [artifact] })),
  };
}

describe("Source-backed RFx preparation preview", () => {
  it("checks the exact event-scoped authority without issuing or calling it release-ready", async () => {
    const sources = readers();
    const result = await previewRfxReleaseAgainstAuthority(proposal(), sources);
    expect(result).toMatchObject({
      proposalConsistent: true,
      sourceAuthoritiesConsistent: true,
      governedReleaseReady: false,
      issued: false,
      artifactCount: 1,
      recipientCount: 1,
    });
    expect(result).toHaveProperty("proposedSnapshotSha256");
    expect(sources.readNdaAuthorityForEvent).toHaveBeenCalledWith({
      clientKey: "tenant-1", eventId: "event-1", supplierLegalEntityId: "vendor-1",
    });
    expect(sources.readArtifactsForEvent).toHaveBeenCalledWith({
      clientKey: "tenant-1", eventId: "event-1", artifactIds: ["artifact-1"],
    });
    expect(JSON.stringify(result)).not.toContain("contact@example.test");
  });

  it.each([
    { name: "missing artifact", artifacts: [], expected: "artifact_authority_mismatch" },
    { name: "wrong tenant", artifacts: [{ ...artifact, tenantKey: "tenant-2" }], expected: "artifact_authority_mismatch" },
    { name: "wrong event", artifacts: [{ ...artifact, eventId: "event-2" }], expected: "artifact_authority_mismatch" },
    { name: "changed bytes", artifacts: [{ ...artifact, sha256: "b".repeat(64) }], expected: "artifact_hash_mismatch" },
    { name: "retired version", artifacts: [{ ...artifact, lifecycleState: "retired" }], expected: "artifact_authority_mismatch" },
    { name: "deleted row", artifacts: [{ ...artifact, deletedAt: AS_OF }], expected: "artifact_authority_mismatch" },
  ])("rejects $name in the source artifact registry", async ({ artifacts, expected }) => {
    const sources = readers();
    jest.mocked(sources.readArtifactsForEvent).mockResolvedValue({ registryAvailable: true, artifacts });
    const result = await previewRfxReleaseAgainstAuthority(proposal(), sources);
    expect(result).toMatchObject({ sourceAuthoritiesConsistent: false, governedReleaseReady: false, issued: false });
    expect(result.defects).toContain(expected);
  });

  it("fails closed when the artifact registry cannot be read", async () => {
    const sources = readers();
    jest.mocked(sources.readArtifactsForEvent).mockResolvedValue({ registryAvailable: false, artifacts: [] });
    const result = await previewRfxReleaseAgainstAuthority(proposal(), sources);
    expect(result.defects).toContain("authority_unavailable");
    expect(result).toMatchObject({ sourceAuthoritiesConsistent: false, issued: false });
  });

  it("rejects a claimed candidate identifier absent from the accepted register", async () => {
    const rows = sourceRows();
    rows.candidates.acceptedCandidates[0].authorityId = "different-candidate";
    const result = await previewRfxReleaseAgainstAuthority(proposal(), readers(rows));
    expect(result).toMatchObject({ sourceAuthoritiesConsistent: false, issued: false });
    expect(result.defects).toContain("candidate_authority_mismatch");
  });

  it("rejects a supplier whose actual contact policy still needs review", async () => {
    const rows = sourceRows();
    rows.candidates.acceptedCandidates[0].contactPolicy = "review_required";
    const result = await previewRfxReleaseAgainstAuthority(proposal(), readers(rows));
    expect(result.defects).toContain("supplier_contact_policy_mismatch");
  });

  it("rejects a contact approval whose source evidence differs from the proposal", async () => {
    const rows = sourceRows();
    rows.contacts.approvedContacts[0].evidenceReference = "other-evidence";
    const result = await previewRfxReleaseAgainstAuthority(proposal(), readers(rows));
    expect(result.defects).toContain("contact_authority_mismatch");
  });

  it("rejects an NDA whose signing evidence is absent", async () => {
    const rows = sourceRows();
    rows.nda.executedNdas[0].signatureEvidence = {};
    const result = await previewRfxReleaseAgainstAuthority(proposal(), readers(rows));
    expect(result.defects).toContain("nda_signature_unproven");
  });

  it("rejects an expired NDA even when the proposal claims it is recorded", async () => {
    const rows = sourceRows();
    rows.nda.executedNdas[0].effectiveTo = "2026-09-24T00:00:00Z";
    const result = await previewRfxReleaseAgainstAuthority(proposal(), readers(rows));
    expect(result.defects).toContain("nda_coverage_unproven");
  });

  it("refuses unavailable authority rather than treating an empty read as a pass", async () => {
    const rows = sourceRows();
    rows.candidates.registryAvailable = false;
    const result = await previewRfxReleaseAgainstAuthority(proposal(), readers(rows));
    expect(result).toMatchObject({ sourceAuthoritiesConsistent: false, issued: false });
    expect(result.defects).toContain("authority_unavailable");
  });

  it("accepts a matching, current Legal waiver as a separate authority", async () => {
    const rows = sourceRows();
    rows.nda.executedNdas = [];
    rows.nda.waivers = [{
      waiverId: "waiver-1",
      tenantKey: "tenant-1",
      supplierLegalEntityId: "vendor-1",
      eventId: "event-1",
      reason: "Reviewed exception",
      expiresAt: "2026-10-15T00:00:00Z",
      approvedByLegalName: "Named Legal approver",
      approvedAt: "2026-09-24T00:00:00Z",
    }];
    const base = proposal();
    const input: RfxReleaseSnapshotInput = {
      ...base,
      recipientAuthorities: [{
        ...base.recipientAuthorities[0],
        ndaAuthorityId: undefined,
        waiverAuthorityId: "waiver-1",
        waiverTenantKey: "tenant-1",
        waiverEventId: "event-1",
        waiverLegalEntityId: "vendor-1",
        waiverState: "approved",
      }],
    };
    const result = await previewRfxReleaseAgainstAuthority(input, readers(rows));
    expect(result).toMatchObject({ sourceAuthoritiesConsistent: true, issued: false });
  });
});
