import {
  FOUNDATION_PROOF_LOGINS,
  buildFoundationProofMetadata,
  foundationProofLoginsForTenant,
} from "@/lib/auth/foundation-proof-logins";

describe("foundation proof logins", () => {
  it("declares human and automation proof identities for Airline Demo New", () => {
    const airline = foundationProofLoginsForTenant("airline-demo-new");
    expect(airline.map((login) => login.personaKind).sort()).toEqual([
      "automation_agent",
      "human_owner",
    ]);
    expect(airline.every((login) => login.email.includes("@"))).toBe(true);
    expect(
      airline.every((login) => !login.email.endsWith(".example.com")),
    ).toBe(true);
  });

  it("emits the exact metadata required by the foundation preview gate", () => {
    for (const login of FOUNDATION_PROOF_LOGINS) {
      const metadata = buildFoundationProofMetadata(login);
      expect(metadata.foundationTenant).toBe(true);
      expect(metadata.proofLogin).toBe(true);
      expect(metadata.foundationTenantKey).toBe(login.tenantKey);
      expect(metadata.tenantKey).toBe(login.tenantKey);
      expect(metadata.clientId).toBe(login.tenantKey);
      expect(metadata.defaultClientId).toBe(login.tenantKey);
      expect(metadata.allowedRoutes).toEqual(["/knowledge-preview"]);
      expect(metadata.moduleAccess).toEqual(["knowledge"]);
    }
  });

  it("keeps the foundation roster separate from legacy demo client keys", () => {
    const legacyKeys = new Set([
      "skyharbor",
      "meridian",
      "arcturus",
      "apexretail",
      "lakeshore",
      "northstar",
    ]);
    for (const login of FOUNDATION_PROOF_LOGINS) {
      expect(legacyKeys.has(login.tenantKey)).toBe(false);
    }
  });
});
