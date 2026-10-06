import {
  readProxySessionIdentity,
  shouldFetchClerkUserForProxyIdentity,
} from "@/proxy";
import { CANONICAL_TENANT_KEYS } from "@/lib/tenant/aliases";
import { isFoundationTenantKey } from "@/lib/tenant/foundation-tenants";

/**
 * A tenant that is NOT foundation-bound, derived rather than typed.
 *
 * The case below originally hard-coded one tenant key to mean "an ordinary
 * tenant on an ordinary route". That stopped being true on 2026-08-27, when
 * that same key was added to `FOUNDATION_TENANT_KEYS` in a commit about Moves
 * data reads. The assertion then failed for three weeks in a directory no
 * workflow runs, and the predicate it tests had not changed since the day the
 * case was written — only the set it consults had.
 *
 * `canonicalTenantKey` is what `resolveFoundationTenantKey` consults, so the
 * alias module's key list is the right source here; the second, shorter
 * `CANONICAL_TENANT_KEYS` export (item 51) does not participate in this path.
 */
const NON_FOUNDATION_TENANT_KEY = CANONICAL_TENANT_KEYS.find(
  (key) => !isFoundationTenantKey(key),
);

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

  it("has a canonical tenant that is not foundation-bound to test with", () => {
    // If every canonical tenant ever becomes foundation-bound, the case below
    // would silently stop exercising the branch it names — the same failure the
    // hard-coded tenant produced. Fail here instead, loudly.
    expect(NON_FOUNDATION_TENANT_KEY).toBeDefined();
  });

  it("does not fetch the identity provider for an ordinary tenant on an ordinary route", () => {
    const identity = readProxySessionIdentity({
      emailAddress: "proof@example.com",
      publicMetadata: {
        role: "client",
        clientId: NON_FOUNDATION_TENANT_KEY,
        defaultClientId: NON_FOUNDATION_TENANT_KEY,
      },
    });

    // Complete ordinary metadata, non-foundation tenant, ordinary route: the
    // proxy runs on every request, so a `true` here is a Clerk round trip per
    // page view.
    expect(shouldFetchClerkUserForProxyIdentity(identity, "/home")).toBe(false);

    // The proof route still refreshes, because the metadata in hand does not
    // permit it. This is the assertion the original case was written for
    // (`e4f980c48`, "Fix Home Knowledge proof route metadata refresh").
    expect(
      shouldFetchClerkUserForProxyIdentity(identity, "/home/knowledge"),
    ).toBe(true);
  });

  it("refreshes a foundation-bound session that is missing its proof fields, on any route", () => {
    // This pins a MECHANISM, not a judgement that the mechanism is well
    // calibrated. The foundation fence in `src/proxy.ts` engages only when
    // metadata carries `foundationTenant` or `proofLogin`
    // (`resolveFoundationTenantKeyFromMetadata`), and for a session whose
    // claims omit them the only way those fields ever arrive is this refresh.
    // Narrowing the refresh therefore changes when the fence engages, which is
    // why it is not being narrowed here.
    //
    // What IS open, and is filed rather than encoded: the refresh infers
    // "might be a proof login" from an ordinary `clientId`, and it is
    // unsatisfiable for a tenant whose users have no proof metadata to fetch —
    // so it repeats on every request. See T-041 in the execution backlog.
    const foundationBoundKey = CANONICAL_TENANT_KEYS.find((key) =>
      isFoundationTenantKey(key),
    );
    expect(foundationBoundKey).toBeDefined();

    const identity = readProxySessionIdentity({
      emailAddress: "proof@example.com",
      publicMetadata: {
        role: "client",
        clientId: foundationBoundKey,
        defaultClientId: foundationBoundKey,
      },
    });

    expect(shouldFetchClerkUserForProxyIdentity(identity, "/home")).toBe(true);
  });

  it("stops refreshing once the foundation proof fields are present", () => {
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
