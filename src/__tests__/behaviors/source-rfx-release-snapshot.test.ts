import { prepareRfxReleaseSnapshot, type RfxReleaseSnapshotInput } from "@/lib/source/rfx-delivery/release-snapshot";

const HASH = "a".repeat(64);

function input(): RfxReleaseSnapshotInput {
  return {
    release: {
      package: {
        packageId: "package-1",
        tenantKey: "tenant-1",
        eventId: "event-1",
        disclosureScope: {
          classification: "confidential_rfp",
          includedArtifactIds: ["artifact-1"],
        },
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
      asOf: "2026-09-25T00:00:00Z",
    },
    packageVersionId: "package-version-1",
    version: 1,
    artifacts: [{ artifactId: "artifact-1", sha256: HASH }],
    recipientAuthorities: [{ recipientId: "recipient-1", candidateAuthorityId: "candidate-1", ndaAuthorityId: "nda-1" }],
    approvedByUserId: "approver-1",
    approvedAt: "2026-09-25T00:00:00Z",
    approvalEvidenceReference: "approval-1",
  };
}

describe("Stage 06 release snapshot preparation", () => {
  it("freezes one reproducible package and recipient set without sending", () => {
    const first = prepareRfxReleaseSnapshot(input());
    const second = prepareRfxReleaseSnapshot(input());
    expect(first.ready).toBe(true);
    expect(first).toEqual(second);
    if (!first.ready) return;
    expect(first.snapshot.snapshotSha256).toMatch(/^[0-9a-f]{64}$/);
    expect(first.snapshot.recipients).toHaveLength(1);
    expect(first.snapshot.artifacts).toEqual([{ artifactId: "artifact-1", sha256: HASH }]);
  });

  it("refuses a missing artifact hash", () => {
    const result = prepareRfxReleaseSnapshot({ ...input(), artifacts: [{ artifactId: "artifact-1", sha256: "" }] });
    expect(result.ready).toBe(false);
  });

  it("refuses artifact identity drift even when every hash is present", () => {
    const result = prepareRfxReleaseSnapshot({ ...input(), artifacts: [{ artifactId: "artifact-other", sha256: HASH }] });
    expect(result.ready).toBe(false);
  });

  it("refuses a recipient without accepted-candidate and NDA or waiver authority", () => {
    const result = prepareRfxReleaseSnapshot({ ...input(), recipientAuthorities: [{ recipientId: "recipient-1", candidateAuthorityId: "" }] });
    expect(result.ready).toBe(false);
  });

  it("refuses a package when any selected recipient is do-not-contact", () => {
    const base = input();
    const result = prepareRfxReleaseSnapshot({
      ...base,
      release: {
        ...base.release,
        package: {
          ...base.release.package,
          recipients: [{ ...base.release.package.recipients[0], contactPolicy: "do_not_contact" }],
        },
      },
    });
    expect(result.ready).toBe(false);
  });

  it("refuses an unapproved release", () => {
    const result = prepareRfxReleaseSnapshot({ ...input(), approvedByUserId: "" });
    expect(result.ready).toBe(false);
  });

  it("refuses a missing approval evidence reference", () => {
    const result = prepareRfxReleaseSnapshot({ ...input(), approvalEvidenceReference: "" });
    expect(result.ready).toBe(false);
  });

  it("refuses duplicate recipient IDs", () => {
    const base = input();
    const result = prepareRfxReleaseSnapshot({
      ...base,
      release: {
        ...base.release,
        package: { ...base.release.package, recipients: [...base.release.package.recipients, base.release.package.recipients[0]] },
      },
      recipientAuthorities: [...base.recipientAuthorities, base.recipientAuthorities[0]],
    });
    expect(result.ready).toBe(false);
  });

  it("changes the digest when the package bytes change", () => {
    const base = input();
    const first = prepareRfxReleaseSnapshot(base);
    const second = prepareRfxReleaseSnapshot({ ...base, artifacts: [{ artifactId: "artifact-1", sha256: "b".repeat(64) }] });
    expect(first.ready).toBe(true);
    expect(second.ready).toBe(true);
    if (!first.ready || !second.ready) return;
    expect(first.snapshot.snapshotSha256).not.toBe(second.snapshot.snapshotSha256);
  });
});
