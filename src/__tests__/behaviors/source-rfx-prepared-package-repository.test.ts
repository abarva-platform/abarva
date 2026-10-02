import { createHash } from "node:crypto";

const runMock = jest.fn();
const withSessionMock = jest.fn();

jest.mock("@/lib/data-plane/azureRead", () => ({
  azureRead: { withSession: (...args: unknown[]) => withSessionMock(...args) },
}));

import { readPreparedRfxPackagesForEvent } from "@/lib/source/rfx-delivery/prepared-package-repository";
import { writePreparedRfxPackageVersion, type PreparedPackageWriteInput } from "@/lib/source/rfx-delivery/write-prepared-package-version";
import type { SqlRunner, TxSessionRunner } from "@/lib/data-plane/read-adapters/azureSession";

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

function writeInput(): PreparedPackageWriteInput {
  return {
    release: {
      package: {
        packageId: content.packageId, tenantKey, eventId,
        disclosureScope: { classification: "confidential_rfp", includedArtifactIds: [content.artifacts[0].artifactId] },
        authentication: content.authentication,
        expiresAt: "2026-10-15T00:00:00Z",
        recipients: [{
          recipientId: "recipient-1", legalEntityId: "vendor-1", contactId: "contact-1",
          contactName: "Named contact", contactEmail: "contact@example.test", contactPolicy: "contact_allowed",
        }],
        receipts: [],
      },
      supplierContactPolicies: { "vendor-1": "contact_allowed" },
      asOf: "2026-10-01T00:00:00Z",
    },
    artifacts: content.artifacts,
    recipientAuthorities: [{
      recipientId: "recipient-1", candidateAuthorityId: "candidate-1",
      candidateTenantKey: tenantKey, candidateEventId: eventId,
      candidateLegalEntityId: "vendor-1", candidateState: "accepted",
      contactAuthorityId: "contact-authority-1", contactTenantKey: tenantKey,
      contactEventId: eventId, contactLegalEntityId: "vendor-1", contactId: "contact-1",
      contactName: "Named contact", contactEmail: "contact@example.test",
      contactPolicy: "contact_allowed", contactState: "approved",
      contactApprovedByUserId: "contact-approver", contactApprovedAt: "2026-09-30T00:00:00Z",
      contactEvidenceReference: "contact-evidence", ndaAuthorityId: "nda-1",
      ndaTenantKey: tenantKey, ndaEventId: eventId, ndaLegalEntityId: "vendor-1",
      ndaState: "recorded",
    }],
    approvedByUserId: "approver-1", approvedAt: "2026-10-01T00:00:00Z",
    approvalEvidenceReference: "approval-1",
  };
}

function writeStore() {
  const writes: unknown[][] = [];
  const sql: string[] = [];
  const run: SqlRunner = async <R>(query: string, params: unknown[]): Promise<R[]> => {
    sql.push(query);
    if (query.includes("FROM source_events")) {
      if (!query.includes("client_key = $1") || params[0] !== tenantKey) return [];
      return (query.includes("id = $2::uuid") && params[1] !== eventId ? [] : [{ id: eventId }]) as R[];
    }
    if (query.includes("FROM source_event_rfx_package_version")) {
      return (writes.length ? [{ version_number: writes.length }] : []) as R[];
    }
    if (query.includes("INSERT INTO source_event_rfx_package_version")) {
      writes.push(params);
      return [{ id: `row-${writes.length}` }] as R[];
    }
    return [];
  };
  const tx: TxSessionRunner = async (fn) => fn(run);
  return { tx, writes, sql };
}

describe("prepared RFx package version write", () => {
  it("allocates n+1 without rewriting the first digest-bound snapshot", async () => {
    const db = writeStore();
    const first = await writePreparedRfxPackageVersion(writeInput(), db.tx, () => "version-1");
    const frozen = JSON.stringify(db.writes[0]);
    const second = await writePreparedRfxPackageVersion(writeInput(), db.tx, () => "version-2");
    expect(first).toMatchObject({ ok: true, version: 1 });
    expect(second).toMatchObject({ ok: true, version: 2 });
    expect(db.writes).toHaveLength(2);
    expect(JSON.stringify(db.writes[0])).toBe(frozen);
    expect(createHash("sha256").update(db.writes[0][5] as string).digest("hex")).toBe(db.writes[0][6]);
    expect(db.sql.some((query) => /^\s*(UPDATE|DELETE)\b/i.test(query))).toBe(false);
  });

  it("refuses a different event in the same tenant before writing", async () => {
    const db = writeStore();
    const proposed = writeInput();
    const foreignEvent = "33333333-3333-4333-8333-333333333333";
    proposed.release.package.eventId = foreignEvent;
    proposed.recipientAuthorities[0].candidateEventId = foreignEvent;
    proposed.recipientAuthorities[0].contactEventId = foreignEvent;
    proposed.recipientAuthorities[0].ndaEventId = foreignEvent;
    expect(await writePreparedRfxPackageVersion(proposed, db.tx, () => "version-1"))
      .toMatchObject({ ok: false, code: "event_unavailable" });
    expect(db.writes).toHaveLength(0);
  });

  it("refuses a do-not-contact recipient before writing", async () => {
    const db = writeStore();
    const proposed = writeInput();
    proposed.release.package.recipients[0].contactPolicy = "do_not_contact";
    expect(await writePreparedRfxPackageVersion(proposed, db.tx, () => "version-1"))
      .toMatchObject({ ok: false, code: "release_not_ready" });
    expect(db.writes).toHaveLength(0);
  });
});
