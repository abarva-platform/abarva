const requireTenancyMock = jest.fn();
const getActiveClientRowMock = jest.fn();
const getCurrentUserMock = jest.fn();
const loadPolicyMock = jest.fn();
const previewMock = jest.fn();
const writeMock = jest.fn();
const revalidatePathMock = jest.fn();

jest.mock("@/lib/auth/tenancy", () => ({
  requireTenancy: () => requireTenancyMock(),
  tenancyErrorResponse: () => Response.json({ error: "forbidden" }, { status: 403 }),
}));
jest.mock("@/lib/active-client", () => ({ getActiveClientRow: () => getActiveClientRowMock() }));
jest.mock("@/lib/auth/current-user", () => ({ getCurrentUser: () => getCurrentUserMock() }));
jest.mock("@/lib/auth/source-access-policy", () => ({
  loadUserSourceAccessPolicy: (...args: unknown[]) => loadPolicyMock(...args),
}));
jest.mock("@/lib/source/rfx-delivery/source-backed-preview", () => ({
  previewRfxReleaseAgainstAuthority: (...args: unknown[]) => previewMock(...args),
}));
jest.mock("@/lib/source/rfx-delivery/write-prepared-package-version", () => ({
  writePreparedRfxPackageVersion: (...args: unknown[]) => writeMock(...args),
}));
jest.mock("next/cache", () => ({ revalidatePath: (...args: unknown[]) => revalidatePathMock(...args) }));

import { POST } from "@/app/api/v1/source/[eventId]/rfx-release/prepare/route";

const eventId = "11111111-1111-4111-8111-111111111111";
const artifactId = "22222222-2222-4222-8222-222222222222";
const params = { params: Promise.resolve({ eventId }) };

function request(overrides: Record<string, unknown> = {}): Request {
  const packet = {
    packageId: "pkg-1",
    disclosureScope: { classification: "confidential", includedArtifactIds: [artifactId] },
    authentication: { method: "magic_link", expiresAt: "2099-10-15T00:00:00Z" },
    expiresAt: "2099-10-15T00:00:00Z",
    recipients: [{
      recipientId: "recipient-1", legalEntityId: "VEN-001", contactId: "CONTACT-001",
      contactName: "Named contact", contactEmail: "contact@example.test", contactPolicy: "contact_allowed",
    }],
    supplierContactPolicies: { "VEN-001": "contact_allowed" },
    artifacts: [{ artifactId, sha256: "a".repeat(64) }],
    recipientAuthorities: [{
      recipientId: "recipient-1", candidateAuthorityId: "candidate-1",
      candidateTenantKey: "tenant-alpha", candidateEventId: eventId,
      candidateLegalEntityId: "VEN-001", candidateState: "accepted",
      contactAuthorityId: "contact-approval-1", contactTenantKey: "tenant-alpha",
      contactEventId: eventId, contactLegalEntityId: "VEN-001",
      contactId: "CONTACT-001", contactName: "Named contact", contactEmail: "contact@example.test",
      contactPolicy: "contact_allowed", contactState: "approved",
      contactApprovedByUserId: "person-2", contactApprovedAt: "2026-09-25T00:00:00Z",
      contactEvidenceReference: "named contact reviewed", ndaAuthorityId: "nda-1",
      ndaTenantKey: "tenant-alpha", ndaEventId: eventId,
      ndaLegalEntityId: "VEN-001", ndaState: "recorded",
    }],
    approvalEvidenceReference: "Reviewed prepared package and recipients.",
    tenantKey: "foreign-tenant", eventId: "foreign-event", approvedByUserId: "forged-user",
    ...overrides,
  };
  return new Request(`https://app.example.test/api/v1/source/${eventId}/rfx-release/prepare`, {
    method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(packet),
  });
}

beforeEach(() => {
  jest.clearAllMocks();
  requireTenancyMock.mockResolvedValue({ clientKey: "tenant-alpha", userId: "person-1" });
  getActiveClientRowMock.mockResolvedValue({ key: "tenant-alpha" });
  getCurrentUserMock.mockResolvedValue({ personId: "person-1", name: "Named reviewer" });
  loadPolicyMock.mockResolvedValue({ canApproveSourceStages: true });
  previewMock.mockResolvedValue({ proposalConsistent: true, sourceAuthoritiesConsistent: true, defects: [] });
  writeMock.mockResolvedValue({ ok: true, id: "row-1", packageVersionId: "version-1", version: 1, snapshotSha256: "a".repeat(64) });
});

describe("RFx prepared version route", () => {
  it("binds scope and named approver to the session before a source-backed write", async () => {
    const response = await POST(request(), params);
    expect(response.status).toBe(201);
    expect(previewMock).toHaveBeenCalledWith(expect.objectContaining({
      approvedByUserId: "person-1",
      release: expect.objectContaining({ package: expect.objectContaining({ tenantKey: "tenant-alpha", eventId }) }),
    }));
    expect(writeMock).toHaveBeenCalledWith(expect.objectContaining({
      approvedByUserId: "person-1",
      release: expect.objectContaining({ package: expect.objectContaining({ tenantKey: "tenant-alpha", eventId }) }),
    }));
    expect(revalidatePathMock).toHaveBeenCalledWith(`/source/new/${eventId}`);
  });

  it("returns named source-authority defects without writing a version", async () => {
    previewMock.mockResolvedValue({ proposalConsistent: true, sourceAuthoritiesConsistent: false, defects: ["nda_coverage_unproven"] });
    const response = await POST(request(), params);
    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toMatchObject({ error: "release_not_ready", defects: ["nda_coverage_unproven"] });
    expect(writeMock).not.toHaveBeenCalled();
  });

  it("refuses an unauthorised reviewer or malformed proposal before authority reads", async () => {
    loadPolicyMock.mockResolvedValue({ canApproveSourceStages: false });
    expect((await POST(request(), params)).status).toBe(403);
    expect(previewMock).not.toHaveBeenCalled();
    loadPolicyMock.mockResolvedValue({ canApproveSourceStages: true });
    expect((await POST(request({ recipients: "not-an-array" }), params)).status).toBe(400);
    expect(previewMock).not.toHaveBeenCalled();
  });
});
