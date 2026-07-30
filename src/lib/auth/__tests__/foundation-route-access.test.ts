import {
  FOUNDATION_HOME_KNOWLEDGE_ROUTE,
  foundationKnowledgePath,
  isFoundationRouteAllowed,
  isFoundationRouteAllowedForMetadata,
  resolveFoundationTenantKeyFromMetadata,
} from "@/lib/auth/foundation-route-access";

describe("foundation route access", () => {
  it("builds the governed Home Knowledge proof path without tenant query strings", () => {
    expect(foundationKnowledgePath("airline-demo-new")).toBe(
      FOUNDATION_HOME_KNOWLEDGE_ROUTE,
    );
  });

  it("resolves foundation tenant metadata only when proof flags are present", () => {
    expect(
      resolveFoundationTenantKeyFromMetadata({
        foundationTenant: true,
        proofLogin: true,
        tenantKey: "airline-demo-new",
      }),
    ).toBe("airline-demo-new");

    expect(
      resolveFoundationTenantKeyFromMetadata({
        tenantKey: "airline-demo-new",
      }),
    ).toBeNull();
  });

  it("maps historical Airline Demo labels to the new foundation tenant", () => {
    expect(
      resolveFoundationTenantKeyFromMetadata({
        proofLogin: true,
        tenantKey: "airline-demo",
      }),
    ).toBe("airline-demo-new");

    expect(
      resolveFoundationTenantKeyFromMetadata({
        proofLogin: true,
        clientId: "Airline Demo",
      }),
    ).toBe("airline-demo-new");
  });

  it("allows only the legacy preview surface and supporting APIs without metadata", () => {
    expect(isFoundationRouteAllowed("/knowledge-preview")).toBe(true);
    expect(isFoundationRouteAllowed("/api/knowledge/consumption/foo")).toBe(
      true,
    );
    expect(isFoundationRouteAllowed("/home/knowledge")).toBe(false);
    expect(isFoundationRouteAllowed("/home")).toBe(false);
    expect(isFoundationRouteAllowed("/source")).toBe(false);
  });

  it("allows /home/knowledge only for the Airline proof capability", () => {
    expect(
      isFoundationRouteAllowedForMetadata("/home/knowledge", {
        foundationTenant: true,
        proofLogin: true,
        tenantKey: "airline-demo-new",
        moduleAccess: ["knowledge"],
        allowedRoutes: ["/home/knowledge", "/knowledge-preview"],
      }),
    ).toBe(true);

    expect(
      isFoundationRouteAllowedForMetadata("/home/knowledge", {
        foundationTenant: true,
        proofLogin: true,
        tenantKey: "healthcare-demo-new",
        moduleAccess: ["knowledge"],
        allowedRoutes: ["/home/knowledge", "/knowledge-preview"],
      }),
    ).toBe(false);

    expect(
      isFoundationRouteAllowedForMetadata("/home/knowledge", {
        foundationTenant: true,
        proofLogin: true,
        tenantKey: "airline-demo-new",
        moduleAccess: ["knowledge"],
        allowedRoutes: ["/knowledge-preview"],
      }),
    ).toBe(false);
  });
});
