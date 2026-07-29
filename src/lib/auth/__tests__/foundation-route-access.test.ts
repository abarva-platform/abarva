import {
  foundationKnowledgePath,
  isFoundationRouteAllowed,
  resolveFoundationTenantKeyFromMetadata,
} from "@/lib/auth/foundation-route-access";

describe("foundation route access", () => {
  it("builds the governed Knowledge preview path", () => {
    expect(foundationKnowledgePath("airline-demo-new")).toBe(
      "/knowledge-preview?provider=http&tenant=airline-demo-new",
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

  it("allows only the governed Knowledge surface and supporting APIs", () => {
    expect(isFoundationRouteAllowed("/knowledge-preview")).toBe(true);
    expect(isFoundationRouteAllowed("/api/knowledge/consumption/foo")).toBe(
      true,
    );
    expect(isFoundationRouteAllowed("/home")).toBe(false);
    expect(isFoundationRouteAllowed("/source")).toBe(false);
  });
});
