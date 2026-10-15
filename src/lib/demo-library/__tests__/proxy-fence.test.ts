import { NextRequest } from "next/server";
const authSession = jest.fn();
const getUser = jest.fn();
jest.mock("@clerk/nextjs/server", () => ({
  ...jest.requireActual("@clerk/nextjs/server"),
  clerkClient: async () => ({ users: { getUser } }),
  clerkMiddleware:
    (handler: (auth: unknown, request: NextRequest) => unknown) =>
    (request: NextRequest) =>
      handler(Object.assign(authSession, { protect: jest.fn() }), request),
}));
jest.mock("@/lib/auth/private-browser-proof-session", () => ({
  PRIVATE_BROWSER_PROOF_SESSION_COOKIE: "proof",
  readPrivateBrowserProofSessionValue: async () => null,
}));
import proxy from "@/proxy";

beforeEach(() => {
  process.env.ACCESSIBILITY_AXE_DISABLE_CLERK = "0";
  authSession.mockResolvedValue({
    userId: "external_viewer",
    sessionClaims: {
      publicMetadata: { role: "external" },
      email: "viewer@example.com",
    },
  });
  getUser.mockResolvedValue({
    publicMetadata: { role: "external" },
    primaryEmailAddress: { emailAddress: "viewer@example.com" },
  });
});

describe("the actual proxy denies product access to external demo viewers", () => {
  it("fails closed when an authenticated identity has no role and the provider lookup fails", async () => {
    authSession.mockResolvedValue({
      userId: "unresolved_viewer",
      sessionClaims: {},
    });
    getUser.mockRejectedValue(new Error("identity unavailable"));
    const warning = jest
      .spyOn(console, "warn")
      .mockImplementation(() => undefined);
    try {
      const response = await proxy(
        new NextRequest("https://app.example.com/api/chat/agent"),
        {} as never,
      );
      expect(response?.status).toBe(503);
      expect(await response?.json()).toEqual({
        error: "session_identity_unavailable",
      });
    } finally {
      warning.mockRestore();
    }
  });
  it.each([
    "/home",
    "/tower",
    "/intelligence",
    "/source/360",
    "/demo/explore",
    "/admin",
  ])("redirects %s to the demo before resolving a tenant", async (pathname) => {
    const response = await proxy(
      new NextRequest(`https://app.example.com${pathname}`),
      {} as never,
    );
    expect(response?.status).toBe(307);
    expect(response?.headers.get("location")).toBe(
      "https://app.example.com/demo",
    );
  });
  it.each([
    "/api/chat/agent",
    "/api/context/demo",
    "/api/auth/launch-user",
    "/api/admin/demo-access",
  ])(
    "denies %s as JSON, including public bootstrap shortcuts",
    async (pathname) => {
      const response = await proxy(
        new NextRequest(`https://app.example.com${pathname}`),
        {} as never,
      );
      expect(response?.status).toBe(403);
      expect(await response?.json()).toEqual({ error: "demo_only_access" });
    },
  );
  it.each(["/demo", "/api/demo-video/full", "/api/demo-video/executive"])(
    "admits %s to its own authorization check",
    async (pathname) => {
      const response = await proxy(
        new NextRequest(`https://app.example.com${pathname}`),
        {} as never,
      );
      expect(response?.status ?? 200).toBe(200);
    },
  );
});
