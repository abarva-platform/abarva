import {
  createPrivateBrowserProofSessionValue,
  readPrivateBrowserProofSessionValue,
} from "@/lib/auth/private-browser-proof-session";

describe("private browser proof session", () => {
  const originalEnabled = process.env.ABARVA_PRIVATE_BROWSER_PROOF_ENABLED;
  const originalToken = process.env.ABARVA_PRIVATE_BROWSER_PROOF_TOKEN;

  beforeEach(() => {
    process.env.ABARVA_PRIVATE_BROWSER_PROOF_ENABLED = "1";
    process.env.ABARVA_PRIVATE_BROWSER_PROOF_TOKEN = "unit-test-proof-token";
  });

  afterAll(() => {
    process.env.ABARVA_PRIVATE_BROWSER_PROOF_ENABLED = originalEnabled;
    process.env.ABARVA_PRIVATE_BROWSER_PROOF_TOKEN = originalToken;
  });

  it("creates a SkyHarbor-scoped proof session when requested", async () => {
    const value = await createPrivateBrowserProofSessionValue(
      "anand.sundaram+skyharbor@thesundaram.com",
      900,
      "skyharbor",
    );

    const session = await readPrivateBrowserProofSessionValue(value);

    expect(session).toMatchObject({
      email: "anand.sundaram+skyharbor@thesundaram.com",
      clientId: "skyharbor",
      defaultClientId: "skyharbor",
      clientName: "SkyHarbor Global",
      tenantKey: "skyharbor_global",
      tenantName: "SkyHarbor Global",
      allowedClientKeys: ["skyharbor"],
      visibleClientKeys: ["skyharbor"],
    });
    expect(session?.moduleAccess).toEqual([
      "programs",
      "source",
      "intelligence",
      "tower",
    ]);
    expect(session?.tenantRoles).toMatchObject({
      skyharbor: "tenant_admin",
      skyharbor_global: "tenant_admin",
    });
  });

  it("preserves the Meridian default for existing proof callers", async () => {
    const value =
      await createPrivateBrowserProofSessionValue("admin@abarva.ai");

    const session = await readPrivateBrowserProofSessionValue(value);

    expect(session).toMatchObject({
      clientId: "meridian",
      tenantKey: "meridian_health_global",
      tenantName: "Meridian Health",
    });
  });

  it("rejects a tampered proof session", async () => {
    const value = await createPrivateBrowserProofSessionValue(
      "anand.sundaram+skyharbor@thesundaram.com",
      900,
      "skyharbor",
    );

    const [payload, signature] = value?.split(".") ?? [];
    const tamperedPayload = payload
      ? `${payload.slice(0, -1)}${payload.endsWith("a") ? "b" : "a"}`
      : null;
    const tampered =
      tamperedPayload && signature ? `${tamperedPayload}.${signature}` : null;

    await expect(readPrivateBrowserProofSessionValue(tampered)).resolves.toBe(
      null,
    );
  });
});
