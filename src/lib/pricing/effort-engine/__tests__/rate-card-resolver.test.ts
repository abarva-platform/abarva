import { resolveRoleRate, type RoleRateSnapshot } from "../rate-card-resolver";

const baseSnapshot: RoleRateSnapshot = {
  roles: [{ role_code: "ROL-037", default_rate_band_code: "ROL-037-LVL-09" }],
  rateBands: [
    { rate_band_code: "ROL-037-LVL-09", role_code: "ROL-037", level_code: "LVL-09", indicative_bill_rate: 227.5, currency: "USD" },
    { rate_band_code: "ROL-037-LVL-07", role_code: "ROL-037", level_code: "LVL-07", indicative_bill_rate: 349.38, currency: "USD" },
  ],
  clientLines: [],
  globalLines: [],
};

describe("resolveRoleRate — direct/inherited/missing precedence", () => {
  it("resolves via rate_band_default (indicative_bill_rate) when no client or global card exists", () => {
    const resolved = resolveRoleRate("ROL-037", null, baseSnapshot);
    expect(resolved.resolvedFromScope).toBe("rate_band_default");
    expect(resolved.hourlyRateCents).toBe(22750);
    expect(resolved.levelCode).toBe("LVL-09");
    expect(resolved.gapReason).toBeNull();
  });

  it("honors an explicit levelHint over the role's own default", () => {
    const resolved = resolveRoleRate("ROL-037", "LVL-07", baseSnapshot);
    expect(resolved.resolvedFromScope).toBe("rate_band_default");
    expect(resolved.hourlyRateCents).toBe(34938);
    expect(resolved.levelCode).toBe("LVL-07");
  });

  it("prefers a client-scope line over global and rate-band default", () => {
    const snapshot: RoleRateSnapshot = {
      ...baseSnapshot,
      clientLines: [{ role_or_band_ref: "ROL-037", level: null, rate_value: 200, currency: "USD", card_version_id: "card-1" }],
    };
    const resolved = resolveRoleRate("ROL-037", null, snapshot);
    expect(resolved.resolvedFromScope).toBe("client");
    expect(resolved.hourlyRateCents).toBe(20000);
    expect(resolved.rateCardVersionId).toBe("card-1");
  });

  it("prefers a global-scope line over the rate-band default when no client line exists", () => {
    const snapshot: RoleRateSnapshot = {
      ...baseSnapshot,
      globalLines: [{ role_or_band_ref: "ROL-037-LVL-09", level: null, rate_value: 210, currency: "USD", card_version_id: "card-g" }],
    };
    const resolved = resolveRoleRate("ROL-037", null, snapshot);
    expect(resolved.resolvedFromScope).toBe("global");
    expect(resolved.hourlyRateCents).toBe(21000);
  });

  it("returns an honest 'missing' gap — never a fabricated rate — when nothing resolves", () => {
    const resolved = resolveRoleRate("ROL-999", null, { roles: [], rateBands: [], clientLines: [], globalLines: [] });
    expect(resolved.resolvedFromScope).toBe("missing");
    expect(resolved.hourlyRateCents).toBeNull();
    expect(resolved.gapReason).toMatch(/unpriced gap, not a fabricated number/);
  });
});
