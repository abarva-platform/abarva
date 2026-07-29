import { classifyLegacyTenantLogin } from "@/lib/auth/legacy-tenant-sunset";

describe("legacy tenant login sunset classifier", () => {
  it("selects old demo tenant users by metadata", () => {
    const decision = classifyLegacyTenantLogin({
      email: "operator@example.com",
      publicMetadata: {
        role: "client",
        clientId: "skyharbor",
        defaultClientId: "skyharbor",
      },
    });

    expect(decision).toEqual({
      shouldDisable: true,
      reason: "legacy_tenant_metadata",
      tenantKey: "skyharbor-air",
    });
  });

  it("selects old demo tenant users by legacy email aliases", () => {
    const decision = classifyLegacyTenantLogin({
      email: "cio@meridian-health.example.com",
      publicMetadata: {
        role: "client",
      },
    });

    expect(decision.shouldDisable).toBe(true);
    expect(decision.reason).toBe("legacy_tenant_email");
  });

  it("keeps foundation proof identities enabled", () => {
    const decision = classifyLegacyTenantLogin({
      email: "anand.sundaram+airline-foundation@thesundaram.com",
      publicMetadata: {
        role: "client",
        foundationTenant: true,
        proofLogin: true,
        foundationTenantKey: "airline-demo-new",
      },
    });

    expect(decision.shouldDisable).toBe(false);
    expect(decision.reason).toBe("protected_identity");
  });

  it("keeps platform admins enabled even when metadata is stale", () => {
    const decision = classifyLegacyTenantLogin({
      email: "admin@abarva.ai",
      publicMetadata: {
        role: "admin",
        clientId: "meridian",
      },
    });

    expect(decision.shouldDisable).toBe(false);
    expect(decision.reason).toBe("protected_identity");
  });
});
