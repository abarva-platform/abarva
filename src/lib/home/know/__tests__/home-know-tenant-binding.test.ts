import { resolveHomeKnowDossierTenantKey } from "../home-know-engine";

describe("Home KNOW tenant binding", () => {
  it("canonicalizes the command-center SkyHarbor Global key before dossier lookup", () => {
    expect(
      resolveHomeKnowDossierTenantKey({
        tenantKey: "skyharbor-air",
        client: "skyharbor_global",
      }),
    ).toBe("skyharbor-air");
  });

  it("keeps the resolved canonical key when no display client is supplied", () => {
    expect(
      resolveHomeKnowDossierTenantKey({
        tenantKey: "skyharbor-air",
        client: null,
      }),
    ).toBe("skyharbor-air");
  });
});
