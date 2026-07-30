import {
  readProxySessionIdentity,
  shouldFetchClerkUserForProxyIdentity,
} from "@/proxy";

describe("proxy session identity fallback", () => {
  it("uses Clerk user publicMetadata when the session token omits publicMetadata", () => {
    const identity = readProxySessionIdentity(
      { sub: "user_123" },
      {
        publicMetadata: {
          role: "client",
          clientId: "meridian",
          defaultClientId: "meridian",
          foundationTenant: true,
          proofLogin: true,
          foundationTenantKey: "airline-demo-new",
          tenantKey: "airline-demo-new",
          allowedRoutes: ["/home/knowledge", "/knowledge-preview"],
          moduleAccess: ["knowledge"],
        },
        primaryEmailAddress: { emailAddress: "operator@example.com" },
      },
    );

    expect(identity.metadata).toEqual({
      role: "client",
      clientId: "meridian",
      defaultClientId: "meridian",
      foundationTenant: true,
      proofLogin: true,
      foundationTenantKey: "airline-demo-new",
      tenantKey: "airline-demo-new",
      allowedRoutes: ["/home/knowledge", "/knowledge-preview"],
      moduleAccess: ["knowledge"],
    });
    expect(identity.email).toBe("operator@example.com");
    expect(identity.source).toBe("clerk_user_fallback");
  });

  it("keeps session claim metadata authoritative and fills only missing fields from Clerk", () => {
    const identity = readProxySessionIdentity(
      {
        emailAddress: "claims@example.com",
        publicMetadata: {
          role: "admin",
          clientId: "skyharbor",
        },
      },
      {
        publicMetadata: {
          role: "client",
          clientId: "meridian",
          defaultClientId: "skyharbor",
        },
        primaryEmailAddress: { emailAddress: "clerk@example.com" },
      },
    );

    expect(identity.metadata).toEqual({
      role: "admin",
      clientId: "skyharbor",
      defaultClientId: "skyharbor",
    });
    expect(identity.email).toBe("claims@example.com");
  });

  it("preserves foundation route and module capabilities from Clerk metadata", () => {
    const identity = readProxySessionIdentity(
      {
        emailAddress: "claims@example.com",
        publicMetadata: {
          role: "client",
          clientId: "airline-demo-new",
          defaultClientId: "airline-demo-new",
          foundationTenant: true,
          proofLogin: true,
          foundationTenantKey: "airline-demo-new",
        },
      },
      {
        publicMetadata: {
          allowedRoutes: ["/home/knowledge", "/knowledge-preview"],
          moduleAccess: ["knowledge"],
        },
      },
    );

    expect(identity.metadata.allowedRoutes).toEqual([
      "/home/knowledge",
      "/knowledge-preview",
    ]);
    expect(identity.metadata.moduleAccess).toEqual(["knowledge"]);
  });

  it("refreshes Clerk metadata before denying the Home Knowledge proof route", () => {
    const staleIdentity = readProxySessionIdentity({
      emailAddress: "proof@example.com",
      publicMetadata: {
        role: "client",
        clientId: "meridian",
        defaultClientId: "meridian",
      },
    });

    expect(
      shouldFetchClerkUserForProxyIdentity(staleIdentity, "/home/knowledge"),
    ).toBe(true);
    expect(shouldFetchClerkUserForProxyIdentity(staleIdentity, "/home")).toBe(
      false,
    );

    const refreshedIdentity = readProxySessionIdentity(
      {
        emailAddress: "proof@example.com",
        publicMetadata: {
          role: "client",
          clientId: "airline-demo-new",
          defaultClientId: "airline-demo-new",
        },
      },
      {
        publicMetadata: {
          foundationTenant: true,
          proofLogin: true,
          foundationTenantKey: "airline-demo-new",
          tenantKey: "airline-demo-new",
          allowedRoutes: ["/home/knowledge"],
          moduleAccess: ["knowledge"],
        },
      },
    );

    expect(
      shouldFetchClerkUserForProxyIdentity(
        refreshedIdentity,
        "/home/knowledge",
      ),
    ).toBe(false);
  });
});
