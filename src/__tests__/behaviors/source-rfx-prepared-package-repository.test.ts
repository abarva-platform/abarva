import { createHash } from "node:crypto";

const runMock = jest.fn();
const withSessionMock = jest.fn();

jest.mock("@/lib/data-plane/azureRead", () => ({
  azureRead: { withSession: (...args: unknown[]) => withSessionMock(...args) },
}));

import { readPreparedRfxPackagesForEvent } from "@/lib/source/rfx-delivery/prepared-package-repository";

const eventId = "11111111-1111-4111-8111-111111111111";
const tenantKey = "tenant-alpha";
const content = {
  tenantKey,
  eventId,
  packageId: "package-1",
  packageVersionId: "version-1",
  version: 1,
  disclosureClassification: "confidential",
  authentication: { method: "shared_secret", secretRef: "vault-ref" },
  expiresAt: "2026-10-01T00:00:00.000Z",
  artifacts: [{ artifactId: "22222222-2222-4222-8222-222222222222", sha256: "a".repeat(64) }],
  recipients: [{
    recipientId: "recipient-1",
    legalEntityId: "vendor-1",
    contactId: "contact-1",
    contactName: "Named contact",
    contactEmail: "contact@example.test",
    candidateAuthorityId: "candidate-1",
    contactAuthorityId: "contact-authority-1",
    ndaAuthorityId: "nda-1",
  }],
  approvedByUserId: "approver-1",
  approvedAt: "2026-09-25T00:00:00.000Z",
  approvalEvidenceReference: "approval-1",
};
const snapshotJson = JSON.stringify(content);
const snapshotSha256 = createHash("sha256").update(snapshotJson).digest("hex");
const row = {
  client_key: tenantKey,
  source_event_id: eventId,
  package_id: content.packageId,
  package_version_id: content.packageVersionId,
  version_number: content.version,
  snapshot_json: snapshotJson,
  snapshot_sha256: snapshotSha256,
  release_state: "prepared",
  expires_at: new Date(content.expiresAt),
  approved_by_user_id: content.approvedByUserId,
  approved_at: new Date(content.approvedAt),
  approval_evidence_reference: content.approvalEvidenceReference,
};

describe("Stage 06 prepared-package readback", () => {
  beforeEach(() => {
    runMock.mockReset();
    withSessionMock.mockReset();
    withSessionMock.mockImplementation(
      async (callback: (run: typeof runMock) => unknown) => callback(runMock),
    );
  });

  it("returns only verified metadata for an exact tenant and event", async () => {
    runMock.mockResolvedValueOnce([]).mockResolvedValueOnce([row]);
    await expect(readPreparedRfxPackagesForEvent({ clientKey: tenantKey, eventId }))
      .resolves.toEqual({
        registryAvailable: true,
        versions: [{
          packageId: content.packageId,
          packageVersionId: content.packageVersionId,
          version: 1,
          snapshotSha256,
          artifactCount: 1,
          recipientCount: 1,
          expiresAt: content.expiresAt,
          approvedAt: content.approvedAt,
          state: "prepared",
        }],
      });
    expect(runMock.mock.calls[0]?.[0]).toContain("set_config('app.tenant_key'");
    const sql = runMock.mock.calls[1]?.[0] as string;
    expect(sql).toContain("FROM source_event_rfx_package_version");
    expect(sql).toContain("client_key = $1");
    expect(sql).toContain("source_event_id = $2::uuid");
  });

  it("distinguishes an empty prepared register from an unreadable one", async () => {
    runMock.mockResolvedValueOnce([]).mockResolvedValueOnce([]);
    await expect(readPreparedRfxPackagesForEvent({ clientKey: tenantKey, eventId }))
      .resolves.toEqual({ registryAvailable: true, versions: [] });
    withSessionMock.mockRejectedValueOnce(new Error("relation unavailable"));
    await expect(readPreparedRfxPackagesForEvent({ clientKey: tenantKey, eventId }))
      .resolves.toEqual({ registryAvailable: false, versions: [] });
  });

  it.each([
    { client_key: "tenant-beta" },
    { source_event_id: "33333333-3333-4333-8333-333333333333" },
    { snapshot_sha256: "0".repeat(64) },
    { snapshot_json: snapshotJson.replace("Named contact", "Changed contact") },
    { snapshot_json: "not-json" },
    { release_state: "issued" },
    { approved_by_user_id: "another-approver" },
  ])("fails closed for inconsistent stored evidence: %p", async (change) => {
    runMock.mockResolvedValueOnce([]).mockResolvedValueOnce([{ ...row, ...change }]);
    await expect(readPreparedRfxPackagesForEvent({ clientKey: tenantKey, eventId }))
      .resolves.toEqual({ registryAvailable: false, versions: [] });
  });

  it("does not query without both tenant and event identity", async () => {
    await expect(readPreparedRfxPackagesForEvent({ clientKey: "", eventId }))
      .resolves.toEqual({ registryAvailable: false, versions: [] });
    expect(withSessionMock).not.toHaveBeenCalled();
  });
});
