const mockAuth = jest.fn();
const mockCurrentUser = jest.fn();

jest.mock("@clerk/nextjs/server", () => ({
  auth: () => mockAuth(),
  currentUser: () => mockCurrentUser(),
}));

import {
  isFoundationPreviewOperatorSession,
  isFoundationPreviewTenantSession,
  resolveFoundationPreviewTenantKeyForSession,
} from "@/lib/auth/foundation-preview-session";

beforeEach(() => {
  jest.clearAllMocks();
  mockAuth.mockResolvedValue({ userId: "user_123", sessionClaims: {} });
  mockCurrentUser.mockResolvedValue(null);
});

describe("foundation preview session access", () => {
  it("allows foundation proof users only for their bound foundation tenant", async () => {
    mockAuth.mockResolvedValue({
      userId: "user_123",
      sessionClaims: {
        publicMetadata: {
          foundationTenant: true,
          proofLogin: true,
          foundationTenantKey: "airline-demo-new",
          tenantKey: "airline-demo-new",
        },
      },
    });

    await expect(
      isFoundationPreviewTenantSession("airline-demo-new"),
    ).resolves.toBe(true);
    await expect(
      isFoundationPreviewTenantSession("healthcare-demo-new"),
    ).resolves.toBe(false);
  });

  it("allows launch-owner emails to inspect foundation preview without tenant proof metadata", async () => {
    mockAuth.mockResolvedValue({
      userId: "user_123",
      sessionClaims: {
        emailAddress: "anandshp@gmail.com",
        publicMetadata: {
          role: "client",
          tenantKey: "skyharbor-air",
        },
      },
    });

    await expect(isFoundationPreviewOperatorSession()).resolves.toBe(true);
    await expect(
      isFoundationPreviewTenantSession("airline-demo-new"),
    ).resolves.toBe(false);
  });

  it("does not allow arbitrary signed-in users as foundation preview operators", async () => {
    mockAuth.mockResolvedValue({
      userId: "user_123",
      sessionClaims: { emailAddress: "person@example.com" },
    });

    await expect(isFoundationPreviewOperatorSession()).resolves.toBe(false);
  });

  it("resolves the signed-in foundation tenant from Clerk claims metadata", async () => {
    mockAuth.mockResolvedValue({
      userId: "user_123",
      sessionClaims: {
        publicMetadata: {
          foundationTenant: true,
          proofLogin: true,
          foundationTenantKey: "airline-demo-new",
          allowedRoutes: ["/home/knowledge", "/knowledge-preview"],
          moduleAccess: ["knowledge"],
        },
      },
    });

    await expect(
      resolveFoundationPreviewTenantKeyForSession({
        pathname: "/home/knowledge",
      }),
    ).resolves.toBe("airline-demo-new");
  });

  it("does not resolve /home/knowledge when the proof metadata lacks route access", async () => {
    mockAuth.mockResolvedValue({
      userId: "user_123",
      sessionClaims: {
        publicMetadata: {
          foundationTenant: true,
          proofLogin: true,
          foundationTenantKey: "airline-demo-new",
          allowedRoutes: ["/knowledge-preview"],
          moduleAccess: ["knowledge"],
        },
      },
    });

    await expect(
      resolveFoundationPreviewTenantKeyForSession({
        pathname: "/home/knowledge",
      }),
    ).resolves.toBeNull();
  });

  it("falls back to currentUser metadata when session claims are stale", async () => {
    mockAuth.mockResolvedValue({
      userId: "user_123",
      sessionClaims: { publicMetadata: {} },
    });
    mockCurrentUser.mockResolvedValue({
      publicMetadata: {
        foundationTenant: true,
        proofLogin: true,
        foundationTenantKey: "airline-demo-new",
        allowedRoutes: ["/home/knowledge"],
        moduleAccess: ["knowledge"],
      },
    });

    await expect(
      resolveFoundationPreviewTenantKeyForSession({
        pathname: "/home/knowledge",
      }),
    ).resolves.toBe("airline-demo-new");
  });
});
