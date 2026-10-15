jest.mock("server-only", () => ({}));
const auth = jest.fn();
const currentUser = jest.fn();
const isPlatformAdminIdentity = jest.fn();
jest.mock("@clerk/nextjs/server", () => ({
  auth: () => auth(),
  currentUser: () => currentUser(),
}));
jest.mock("@/lib/auth/platform-admin-session", () => ({
  isPlatformAdminIdentity: (...args: unknown[]) =>
    isPlatformAdminIdentity(...args),
}));
jest.mock("@/lib/data-plane/objectStorage", () => ({
  getPrivateObjectStorageBlobClient: jest.fn(),
}));
import { evaluateDemoUser, readDemoSession } from "../server";
const user = {
  id: "owner",
  primaryEmailAddressId: "email_1",
  emailAddresses: [
    {
      id: "email_1",
      emailAddress: "owner@example.com",
      verification: { status: "verified" },
    },
  ],
  publicMetadata: { role: "client" },
  privateMetadata: {},
};
beforeEach(() => {
  jest.clearAllMocks();
  auth.mockResolvedValue({ userId: "owner" });
  currentUser.mockResolvedValue(user);
  isPlatformAdminIdentity.mockReturnValue(true);
});
describe("current demo session authority", () => {
  it("uses the existing platform admin identity policy rather than inventing a second roster", () => {
    expect(evaluateDemoUser(user)).toMatchObject({
      allowed: true,
      admin: true,
    });
    expect(isPlatformAdminIdentity).toHaveBeenCalledWith(
      "client",
      "owner@example.com",
    );
  });
  it("still requires a verified primary address even for a recognized administrator", () => {
    expect(
      evaluateDemoUser({
        ...user,
        emailAddresses: [
          { ...user.emailAddresses[0], verification: { status: "unverified" } },
        ],
      }).allowed,
    ).toBe(false);
  });
  it("does not query user metadata for an anonymous session", async () => {
    auth.mockResolvedValue({ userId: null });
    expect((await readDemoSession()).access.allowed).toBe(false);
    expect(currentUser).not.toHaveBeenCalled();
  });
  it("refreshes provider metadata for subsequent requests and respects revocation", async () => {
    isPlatformAdminIdentity.mockReturnValue(false);
    const approved = {
      ...user,
      privateMetadata: {
        nexusDemoAccess: {
          enabled: true,
          email: "owner@example.com",
          grantedBy: "admin",
          grantedAt: new Date(Date.now() - 1000).toISOString(),
          expiresAt: new Date(Date.now() + 100000).toISOString(),
          videoIds: ["full"],
        },
      },
    };
    currentUser
      .mockResolvedValueOnce(approved)
      .mockResolvedValueOnce({
        ...approved,
        privateMetadata: { nexusDemoAccess: { enabled: false } },
      });
    expect((await readDemoSession()).access.allowed).toBe(true);
    expect((await readDemoSession()).access.allowed).toBe(false);
    expect(currentUser).toHaveBeenCalledTimes(2);
  });
});
