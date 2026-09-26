const requireTenancyMock = jest.fn();
const activeClientMock = jest.fn();
const accessPolicyMock = jest.fn();
const currentUserMock = jest.fn();
const sponsorMock = jest.fn();
const scopeMock = jest.fn();
const verifiedMock = jest.fn();
const delegateMock = jest.fn();
const appendAckMock = jest.fn();
const appendNoticeMock = jest.fn();
const sendMock = jest.fn();
const getUserMock = jest.fn();
const eventQueryMock = jest.fn();

jest.mock("@/lib/auth/tenancy", () => ({
  requireTenancy: () => requireTenancyMock(),
  tenancyErrorResponse: (error: Error) => { throw error; },
}));
jest.mock("@/lib/active-client", () => ({ getActiveClientRow: () => activeClientMock() }));
jest.mock("@/lib/auth/source-access-policy", () => ({ loadUserSourceAccessPolicy: () => accessPolicyMock() }));
jest.mock("@/lib/auth/current-user", () => ({ getCurrentUser: () => currentUserMock() }));
jest.mock("@/lib/data-plane/postgresCompat", () => ({
  getAzureReadFluentClient: () => ({ from: () => eventQueryMock() }),
}));
jest.mock("@clerk/nextjs/server", () => ({
  clerkClient: async () => ({ users: { getUser: getUserMock } }),
}));
jest.mock("@/lib/source/sponsor-delegation-repository", () => ({
  readAssignedSponsorUserId: () => sponsorMock(),
  readCurrentScopeArtifactVersion: () => scopeMock(),
  hasVerifiedSponsorDelegation: () => verifiedMock(),
  isAssignedSponsorDelegate: (...args: unknown[]) => delegateMock(...args),
  appendSponsorDelegationAcknowledgement: (...args: unknown[]) => appendAckMock(...args),
  appendSponsorDelegationNotice: (...args: unknown[]) => appendNoticeMock(...args),
}));
jest.mock("@/lib/source/notifications/sponsor-delegation-notice", () => ({
  sendSponsorDelegationNotice: (...args: unknown[]) => sendMock(...args),
}));

import { GET, POST } from "../route";

const artifact = { id: "scope-file", sha256: "a".repeat(64) };
const params = { params: Promise.resolve({ eventId: "event-1" }) };
const request = (body: object) => new Request("https://app.example.test/api/source", {
  method: "POST",
  body: JSON.stringify(body),
});
const accepted = { acknowledged: true, scopeArtifactId: artifact.id, scopeArtifactSha256: artifact.sha256 };

beforeEach(() => {
  jest.clearAllMocks();
  process.env.SOURCE_SPONSOR_DELEGATION_SIGNING_KEY = "test-only-signing-key-with-32-plus-bytes";
  requireTenancyMock.mockResolvedValue({ userId: "user_delegate" });
  activeClientMock.mockResolvedValue({ key: "tenant-one" });
  accessPolicyMock.mockResolvedValue({ accessLevel: "client_admin", canApproveSourceStages: true });
  currentUserMock.mockResolvedValue({ name: "Alex Delegate" });
  sponsorMock.mockResolvedValue("user_sponsor");
  scopeMock.mockResolvedValue(artifact);
  verifiedMock.mockResolvedValue(false);
  delegateMock.mockResolvedValue(false);
  appendAckMock.mockResolvedValue("ack-1");
  appendNoticeMock.mockResolvedValue(undefined);
  sendMock.mockResolvedValue({ channel: "email_sent", providerMessageId: "provider-1" });
  getUserMock.mockResolvedValue({
    firstName: "Sam", lastName: "Sponsor",
    primaryEmailAddress: { emailAddress: "admin@abarva.ai" },
  });
  const query = {
    select: jest.fn(), eq: jest.fn(),
    maybeSingle: jest.fn().mockResolvedValue({
      data: { id: "event-1", client_key: "tenant-one", event_name: "Example event", current_stage_key: "scope" },
      error: null,
    }),
  };
  query.select.mockReturnValue(query);
  query.eq.mockReturnValue(query);
  eventQueryMock.mockReturnValue(query);
});

afterAll(() => { delete process.env.SOURCE_SPONSOR_DELEGATION_SIGNING_KEY; });

it("denies an ordinary user without explicit delegation before writing or sending", async () => {
  accessPolicyMock.mockResolvedValue({ accessLevel: "source_member", canApproveSourceStages: true });
  const response = await POST(request(accepted), params);
  expect(response.status).toBe(403);
  expect(appendAckMock).not.toHaveBeenCalled();
  expect(sendMock).not.toHaveBeenCalled();
});

it("refuses a stale Scope file or an unsigned action", async () => {
  expect((await POST(request({ ...accepted, acknowledged: false }), params)).status).toBe(400);
  expect((await POST(request({ ...accepted, scopeArtifactSha256: "b".repeat(64) }), params)).status).toBe(409);
  expect(appendAckMock).not.toHaveBeenCalled();
});

it("does not accept a logged notification fallback as verified proof", async () => {
  sendMock.mockResolvedValue({ channel: "logged_fallback", providerMessageId: null });
  const response = await POST(request(accepted), params);
  expect(response.status).toBe(202);
  expect(await response.json()).toEqual(expect.objectContaining({ verified: false, notification: "logged_fallback" }));
  expect(appendAckMock).toHaveBeenCalledTimes(1);
  expect(appendNoticeMock).not.toHaveBeenCalled();
});

it("records a distinct delivery receipt only for a named, allowed sponsor", async () => {
  const response = await POST(request(accepted), params);
  expect(response.status).toBe(200);
  expect(appendAckMock).toHaveBeenCalledWith(expect.objectContaining({
    eventId: "event-1", actorUserId: "user_delegate", sponsorUserId: "user_sponsor", scopeArtifact: artifact,
  }));
  expect(sendMock).toHaveBeenCalledWith(expect.objectContaining({ sponsorEmail: "admin@abarva.ai" }));
  expect(appendNoticeMock).toHaveBeenCalledWith(expect.objectContaining({
    eventId: "event-1", acknowledgementId: "ack-1", sponsorUserId: "user_sponsor", providerMessageId: "provider-1",
  }));
});

it("fails closed when sponsor assignment or recipient allowlisting is absent", async () => {
  sponsorMock.mockResolvedValueOnce(null);
  expect((await POST(request(accepted), params)).status).toBe(409);
  getUserMock.mockResolvedValueOnce({
    firstName: "External", lastName: "Sponsor",
    primaryEmailAddress: { emailAddress: "external@example.com" },
  });
  expect((await POST(request(accepted), params)).status).toBe(403);
  expect(sendMock).not.toHaveBeenCalled();
});

it("GET exposes readback without creating a new acknowledgement", async () => {
  verifiedMock.mockResolvedValue(true);
  const response = await GET(new Request("https://app.example.test/api/source"), params);
  expect(response.status).toBe(200);
  expect(await response.json()).toEqual(expect.objectContaining({
    verified: true, sponsorAssigned: true, sponsorName: "Sam Sponsor", recipientReady: true,
  }));
  expect(appendAckMock).not.toHaveBeenCalled();
});

it("matches a delegate's Clerk identity while recording the canonical actor", async () => {
  requireTenancyMock.mockResolvedValue({ userId: "canonical-person", clerkUserId: "user_delegate" });
  accessPolicyMock.mockResolvedValue({ accessLevel: "source_member", canApproveSourceStages: true });
  delegateMock.mockResolvedValue(true);
  expect((await POST(request(accepted), params)).status).toBe(200);
  expect(delegateMock).toHaveBeenCalledWith("event-1", "tenant-one", [
    "canonical-person", "user_delegate", "clerk:user_delegate",
  ]);
  expect(appendAckMock).toHaveBeenCalledWith(expect.objectContaining({ actorUserId: "canonical-person" }));
});

it("never treats a sponsor's alias as a distinct delegate", async () => {
  requireTenancyMock.mockResolvedValue({ userId: "canonical-person", clerkUserId: "user_sponsor" });
  expect((await POST(request(accepted), params)).status).toBe(409);
  expect(appendAckMock).not.toHaveBeenCalled();
});

it("shows an unavailable recipient before any acknowledgement", async () => {
  getUserMock.mockResolvedValue({
    firstName: "External", lastName: "Sponsor",
    primaryEmailAddress: { emailAddress: "external@example.com" },
  });
  const response = await GET(new Request("https://app.example.test/api/source"), params);
  expect(await response.json()).toEqual(expect.objectContaining({ recipientReady: false, canDelegate: false }));
  expect(appendAckMock).not.toHaveBeenCalled();
});

it("fails closed before a write when the server signing key is absent", async () => {
  delete process.env.SOURCE_SPONSOR_DELEGATION_SIGNING_KEY;
  const response = await POST(request(accepted), params);
  expect(response.status).toBe(503);
  expect(appendAckMock).not.toHaveBeenCalled();
  expect(sendMock).not.toHaveBeenCalled();
});

it("rejects a short signing key before any write or notification", async () => {
  process.env.SOURCE_SPONSOR_DELEGATION_SIGNING_KEY = "too-short";
  expect((await POST(request(accepted), params)).status).toBe(503);
  expect(appendAckMock).not.toHaveBeenCalled();
  expect(sendMock).not.toHaveBeenCalled();
});
