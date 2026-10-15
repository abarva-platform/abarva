const currentUser = jest.fn();
const getUserList = jest.fn();
const createUser = jest.fn();
const updateUserMetadata = jest.fn();
jest.mock("@clerk/nextjs/server", () => ({
  currentUser: () => currentUser(),
  clerkClient: async () => ({
    users: { getUserList, createUser, updateUserMetadata },
  }),
}));
jest.mock("@/lib/admin/invite-rate-limit", () => ({
  checkInviteRateLimit: jest.fn(() => ({ allowed: true })),
}));
jest.mock("@/lib/demo-library/server", () => ({
  evaluateDemoUser: (user: unknown) =>
    jest.requireActual("../policy").evaluateDemoAccess(user),
  PRIVATE_DEMO_HEADERS: { "Cache-Control": "private, no-store" },
}));
import { POST as bootstrap } from "@/app/api/auth/demo-viewer/route";
import { POST as manage } from "@/app/api/admin/demo-access/route";
import { checkInviteRateLimit } from "@/lib/admin/invite-rate-limit";
const address = {
  id: "email_1",
  emailAddress: "viewer@example.com",
  verification: { status: "verified" },
};
const user = {
  id: "viewer",
  primaryEmailAddressId: "email_1",
  primaryEmailAddress: address,
  emailAddresses: [address],
  publicMetadata: { role: "client", clientId: "existing-client" },
  privateMetadata: {},
};
const admin = { ...user, id: "admin", publicMetadata: { role: "admin" } };
const future = () => new Date(Date.now() + 7 * 86400000).toISOString();
const request = (body: unknown, origin = "https://app.example.com") =>
  new Request("https://app.example.com/api/auth/demo-viewer", {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: origin },
    body: JSON.stringify(body),
  });

beforeEach(() => {
  jest.clearAllMocks();
  (checkInviteRateLimit as jest.Mock).mockReturnValue({ allowed: true });
  currentUser.mockResolvedValue(admin);
  getUserList.mockResolvedValue({ data: [user] });
  createUser.mockResolvedValue({ id: "new_viewer" });
  updateUserMetadata.mockResolvedValue(user);
});

describe("demo email-code eligibility", () => {
  it("does not create, modify or provision workspace identities", async () => {
    expect(
      (await bootstrap(request({ email: address.emailAddress }))).status,
    ).toBe(403);
    expect(createUser).not.toHaveBeenCalled();
    expect(updateUserMetadata).not.toHaveBeenCalled();
  });
  it("allows only a current primary-email-bound grant", async () => {
    getUserList.mockResolvedValue({
      data: [
        {
          ...user,
          privateMetadata: {
            nexusDemoAccess: {
              enabled: true,
              email: address.emailAddress,
              expiresAt: future(),
              grantedAt: new Date(Date.now() - 1000).toISOString(),
              grantedBy: "admin",
              videoIds: ["full"],
            },
          },
        },
      ],
    });
    const response = await bootstrap(
      request({ email: " Viewer@Example.com " }),
    );
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true });
  });
  it("rejects unknown emails, invalid input and cross-site requests", async () => {
    getUserList.mockResolvedValue({ data: [] });
    expect(
      (await bootstrap(request({ email: address.emailAddress }))).status,
    ).toBe(403);
    expect((await bootstrap(request({ email: 23 }))).status).toBe(400);
    expect(
      (
        await bootstrap(
          request({ email: address.emailAddress }, "https://attacker.example"),
        )
      ).status,
    ).toBe(403);
  });
  it("enforces bootstrap rate limiting before querying Clerk", async () => {
    (checkInviteRateLimit as jest.Mock).mockReturnValue({ allowed: false });
    expect(
      (await bootstrap(request({ email: address.emailAddress }))).status,
    ).toBe(429);
    expect(getUserList).not.toHaveBeenCalled();
  });
});

describe("admin demo grants", () => {
  it("calculates the expiry from the server clock for duration-based approvals", async () => {
    const before = Date.now();
    const response = await manage(
      request({ action: "grant", email: address.emailAddress, days: 30 }),
    );
    expect(response.status).toBe(200);
    const result = await response.json();
    expect(Date.parse(result.expiresAt)).toBeGreaterThanOrEqual(
      before + 30 * 86400000,
    );
    expect(Date.parse(result.expiresAt)).toBeLessThanOrEqual(
      Date.now() + 30 * 86400000,
    );
    expect(
      (
        await manage(
          request({ action: "grant", email: address.emailAddress, days: 31 }),
        )
      ).status,
    ).toBe(400);
  });
  it("denies unauthenticated callers and signed-in non-admins", async () => {
    currentUser.mockResolvedValue(null);
    expect((await manage(request({}))).status).toBe(401);
    currentUser.mockResolvedValue(user);
    expect((await manage(request({}))).status).toBe(403);
    expect(updateUserMetadata).not.toHaveBeenCalled();
  });
  it("requires same-origin POSTs and an expiry no more than 30 days away", async () => {
    const body = {
      action: "grant",
      email: address.emailAddress,
      expiresAt: future(),
    };
    expect(
      (await manage(request(body, "https://attacker.example"))).status,
    ).toBe(403);
    expect(
      (await manage(request({ ...body, expiresAt: "2000-01-01T00:00:00Z" })))
        .status,
    ).toBe(400);
    expect(
      (
        await manage(
          request({
            ...body,
            expiresAt: new Date(Date.now() + 32 * 86400000).toISOString(),
          }),
        )
      ).status,
    ).toBe(400);
  });
  it("changes only private demo metadata for an existing workspace user", async () => {
    expect(
      (
        await manage(
          request({
            action: "grant",
            email: address.emailAddress,
            expiresAt: future(),
          }),
        )
      ).status,
    ).toBe(200);
    expect(updateUserMetadata).toHaveBeenCalledWith("viewer", {
      privateMetadata: {
        nexusDemoAccess: expect.objectContaining({
          enabled: true,
          email: address.emailAddress,
          grantedBy: "admin",
          videoIds: ["executive", "full"],
        }),
      },
    });
    expect(createUser).not.toHaveBeenCalled();
  });
  it("creates new viewers as external with no client or module grants and no fabricated phone", async () => {
    getUserList.mockResolvedValue({ data: [] });
    expect(
      (
        await manage(
          request({
            action: "grant",
            email: address.emailAddress,
            expiresAt: future(),
          }),
        )
      ).status,
    ).toBe(200);
    expect(createUser).toHaveBeenCalledWith({
      emailAddress: [address.emailAddress],
      skipPasswordRequirement: true,
      publicMetadata: {
        role: "external",
        accountType: "demo_viewer",
        moduleAccess: [],
      },
      privateMetadata: {
        nexusDemoAccess: expect.objectContaining({ enabled: true }),
      },
    });
  });
  it("records revocation and never removes an existing product entitlement", async () => {
    expect(
      (await manage(request({ action: "revoke", email: address.emailAddress })))
        .status,
    ).toBe(200);
    expect(updateUserMetadata).toHaveBeenCalledWith("viewer", {
      privateMetadata: {
        nexusDemoAccess: expect.objectContaining({
          enabled: false,
          revokedBy: "admin",
        }),
      },
    });
  });
  it("does not grant a secondary email or modify an administrator", async () => {
    getUserList.mockResolvedValue({
      data: [
        {
          ...user,
          primaryEmailAddress: {
            ...address,
            emailAddress: "other@example.com",
          },
        },
      ],
    });
    expect(
      (
        await manage(
          request({
            action: "grant",
            email: address.emailAddress,
            expiresAt: future(),
          }),
        )
      ).status,
    ).toBe(409);
    getUserList.mockResolvedValue({ data: [admin] });
    expect(
      (await manage(request({ action: "revoke", email: address.emailAddress })))
        .status,
    ).toBe(409);
  });
});
