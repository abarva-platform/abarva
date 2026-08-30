import { createRouteMatcher } from "@clerk/nextjs/server";
import { NextRequest } from "next/server";
import {
  AUTH_REQUIRED_ROUTE_PATTERNS,
  PUBLIC_ROUTE_PATTERNS,
  shouldBlanketStripClientParamFromProtectedTree,
  shouldPreserveClientParamForSourceWorkspaceGuard,
} from "@/proxy";

describe("proxy public route patterns", () => {
  const isPublicRoute = createRouteMatcher([...PUBLIC_ROUTE_PATTERNS]);
  const isAuthRequiredRoute = createRouteMatcher([
    ...AUTH_REQUIRED_ROUTE_PATTERNS,
  ]);

  it("treats the demo code sign-in handoff as a public route", () => {
    const request = new NextRequest(
      "https://app.abarva.ai/api/auth/demo-code-sign-in",
    );
    expect(isPublicRoute(request)).toBe(true);
  });

  it("treats the hidden approved-access page and eligibility check as public pre-auth routes", () => {
    expect(isPublicRoute(new NextRequest("https://app.abarva.ai/access"))).toBe(
      true,
    );
    expect(
      isPublicRoute(
        new NextRequest("https://app.abarva.ai/api/auth/access-eligibility"),
      ),
    ).toBe(true);
  });

  it("treats the launch access-denied page as public so denied sessions do not loop through Clerk", () => {
    const request = new NextRequest("https://app.abarva.ai/access-denied");
    expect(isPublicRoute(request)).toBe(true);
    expect(isAuthRequiredRoute(request)).toBe(false);
  });

  it("treats the health endpoint as a public platform probe", () => {
    const request = new NextRequest("https://app.abarva.ai/api/health");
    expect(isPublicRoute(request)).toBe(true);
    expect(isAuthRequiredRoute(request)).toBe(false);
  });

  it("lets the guarded Azure connectivity probe return JSON instead of a Clerk redirect", () => {
    const request = new NextRequest(
      "https://app.abarva.ai/api/health/azure-connectivity",
    );
    expect(isPublicRoute(request)).toBe(true);
    expect(isAuthRequiredRoute(request)).toBe(false);
  });

  it("lets the guarded Postgres disruption drill return JSON instead of a Clerk redirect", () => {
    const request = new NextRequest(
      "https://app.abarva.ai/api/health/postgres-disruption",
    );
    expect(isPublicRoute(request)).toBe(true);
    expect(isAuthRequiredRoute(request)).toBe(false);
  });

  it("lets the guarded parallel-run invariant probe return JSON instead of a Clerk redirect", () => {
    const request = new NextRequest(
      "https://app.abarva.ai/api/admin/parallel-run-invariants",
    );
    expect(isPublicRoute(request)).toBe(true);
    expect(isAuthRequiredRoute(request)).toBe(true);
  });

  it("lets notification APIs return JSON auth or token responses instead of Clerk HTML rewrites", () => {
    for (const path of ["/api/notifications", "/api/notifications/dispatch"]) {
      const request = new NextRequest(`https://app.abarva.ai${path}`);
      expect(isPublicRoute(request)).toBe(true);
      expect(isAuthRequiredRoute(request)).toBe(false);
    }
  });

  it("does not treat unrelated auth API paths as public", () => {
    const request = new NextRequest("https://app.abarva.ai/api/auth/other");
    expect(isPublicRoute(request)).toBe(false);
  });

  it("keeps product workspaces auth-gated instead of public", () => {
    for (const path of ["/admin", "/home", "/programs", "/source", "/tower"]) {
      const request = new NextRequest(`https://app.abarva.ai${path}`);
      expect(isAuthRequiredRoute(request)).toBe(true);
      expect(isPublicRoute(request)).toBe(false);
    }
  });

  it("keeps detailed marketing, trust, and training pages behind sign-in", () => {
    for (const path of [
      "/product",
      "/how-it-works",
      "/how-it-works/it-productivity-comparison",
      "/model-card",
      "/responsible-ai",
      "/contact",
      "/status",
      "/subprocessors",
    ]) {
      const request = new NextRequest(`https://app.abarva.ai${path}`);
      expect(isPublicRoute(request)).toBe(false);
      expect(isAuthRequiredRoute(request)).toBe(false);
    }
  });

  it("keeps Responsible AI checkpoint pages public at proxy level to avoid Clerk redirects in RSC fetches", () => {
    for (const path of [
      "/responsible-ai/acknowledgment",
      "/responsible-ai/training",
    ]) {
      const request = new NextRequest(`https://app.abarva.ai${path}`);
      expect(isPublicRoute(request)).toBe(true);
      expect(isAuthRequiredRoute(request)).toBe(false);
    }
  });

  it("keeps the signed-out entry surfaces public", () => {
    for (const path of [
      "/",
      "/sign-in",
      "/signed-out",
      "/invite/start",
      "/demo",
    ]) {
      const request = new NextRequest(`https://app.abarva.ai${path}`);
      expect(isPublicRoute(request)).toBe(true);
      expect(isAuthRequiredRoute(request)).toBe(false);
    }
  });

  it("keeps product demo workspaces auth-gated while the marketing demo is public", () => {
    for (const path of [
      "/demo/programs/new",
      "/demo/explore",
      "/demo/agent-markdown-fixture",
    ]) {
      const request = new NextRequest(`https://app.abarva.ai${path}`);
      expect(isPublicRoute(request)).toBe(false);
      expect(isAuthRequiredRoute(request)).toBe(true);
    }
  });

  it("does not blanket-strip Source client context after the tenant guard has run", () => {
    expect(
      shouldBlanketStripClientParamFromProtectedTree({
        pathname: "/source/preview/workspace",
        role: "client",
      }),
    ).toBe(false);
    expect(
      shouldBlanketStripClientParamFromProtectedTree({
        pathname: "/source/events/evt-123",
        role: "maestro",
      }),
    ).toBe(false);
  });

  it("preserves Source workspace client params for the page-level tenant guard", () => {
    for (const pathname of [
      "/source/workspace",
      "/source/workspace/deep",
      "/source/360",
      "/source/360/deep",
      "/source/preview/workspace",
      "/source/preview/workspace/deep",
    ]) {
      expect(shouldPreserveClientParamForSourceWorkspaceGuard(pathname)).toBe(
        true,
      );
    }

    for (const pathname of [
      "/source",
      "/source/events/evt-123",
      "/source/vendor-portfolio",
      "/home",
      "/tower",
    ]) {
      expect(shouldPreserveClientParamForSourceWorkspaceGuard(pathname)).toBe(
        false,
      );
    }
  });

  it("keeps blanket stripping client params on non-Source protected trees for non-admins", () => {
    for (const pathname of ["/home", "/tower/command", "/admin/users-access"]) {
      expect(
        shouldBlanketStripClientParamFromProtectedTree({
          pathname,
          role: "client",
        }),
      ).toBe(true);
    }

    expect(
      shouldBlanketStripClientParamFromProtectedTree({
        pathname: "/tower/command",
        role: "admin",
      }),
    ).toBe(false);
  });
});
