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

describe("resolveRoleRate — a card holding several providers and locations for one role", () => {
  const line = (rate: number, extra: Partial<RoleRateSnapshot["clientLines"][number]> = {}) => ({
    role_or_band_ref: "ROL-037",
    level: "LVL-07",
    rate_value: rate,
    currency: "USD",
    card_version_id: "card-1",
    provider_ref: null,
    location_ref: null,
    ...extra,
  });
  const card = (lines: RoleRateSnapshot["clientLines"]): RoleRateSnapshot => ({ ...baseSnapshot, clientLines: lines });

  it("picks the line for the member's provider class", () => {
    const snapshot = card([line(310, { provider_ref: "SI-T1" }), line(140, { provider_ref: "INTERNAL" })]);
    expect(resolveRoleRate("ROL-037", "LVL-07", snapshot, { providerClassCode: "SI-T1" }).hourlyRateCents).toBe(31000);
    const internal = resolveRoleRate("ROL-037", "LVL-07", snapshot, { providerClassCode: "INTERNAL" });
    expect(internal.hourlyRateCents).toBe(14000);
    expect(internal.matchedProviderRef).toBe("INTERNAL");
  });

  it("prefers a provider-and-location line over a provider-only line, and that over a generic one", () => {
    const snapshot = card([
      line(250),
      line(300, { provider_ref: "SI-T1" }),
      line(120, { provider_ref: "SI-T1", location_ref: "LOC-INDIA-TIER-1" }),
    ]);
    const dims = (locationCode: string) => ({ providerClassCode: "SI-T1", locationCode });
    expect(resolveRoleRate("ROL-037", "LVL-07", snapshot, dims("LOC-INDIA-TIER-1")).hourlyRateCents).toBe(12000);
    expect(resolveRoleRate("ROL-037", "LVL-07", snapshot, dims("LOC-DALLAS")).hourlyRateCents).toBe(30000);
    expect(resolveRoleRate("ROL-037", "LVL-07", snapshot, { providerClassCode: "ENG-B" }).hourlyRateCents).toBe(25000);
  });

  it("returns a stated gap, not an arbitrary line, when the provider is unknown and only provider lines exist", () => {
    const snapshot = card([line(310, { provider_ref: "SI-T1" }), line(140, { provider_ref: "INTERNAL" })]);
    const resolved = resolveRoleRate("ROL-037", "LVL-07", snapshot);
    expect(resolved.resolvedFromScope).toBe("missing");
    expect(resolved.hourlyRateCents).toBeNull();
    expect(resolved.gapReason).toMatch(/providers: SI-T1, INTERNAL/);
  });

  it("uses the generic line, not a guessed provider line, when the provider is unknown", () => {
    const snapshot = card([line(310, { provider_ref: "SI-T1" }), line(250)]);
    const resolved = resolveRoleRate("ROL-037", "LVL-07", snapshot);
    expect(resolved.hourlyRateCents).toBe(25000);
    expect(resolved.matchedProviderRef).toBeNull();
  });

  it("ranks a provider match above a location match", () => {
    const snapshot = card([line(130, { location_ref: "LOC-INDIA-TIER-1" }), line(300, { provider_ref: "SI-T1" })]);
    const resolved = resolveRoleRate("ROL-037", "LVL-07", snapshot, { providerClassCode: "SI-T1", locationCode: "LOC-INDIA-TIER-1" });
    expect(resolved.hourlyRateCents).toBe(30000);
  });

  it("uses a single provider line when the provider is unknown but nothing competes with it", () => {
    const resolved = resolveRoleRate("ROL-037", "LVL-07", card([line(310, { provider_ref: "SI-T1" })]));
    expect(resolved.resolvedFromScope).toBe("client");
    expect(resolved.hourlyRateCents).toBe(31000);
  });

  it("never borrows another level's line for a member whose level is known", () => {
    const resolved = resolveRoleRate("ROL-037", "LVL-09", card([line(999)]));
    expect(resolved.resolvedFromScope).toBe("rate_band_default");
    expect(resolved.hourlyRateCents).toBe(22750);
  });

  it("refuses to price internal staff from a supplier band when the card has no internal line", () => {
    const resolved = resolveRoleRate("ROL-037", "LVL-07", baseSnapshot, { providerClassCode: "INTERNAL" });
    expect(resolved.resolvedFromScope).toBe("missing");
    expect(resolved.gapReason).toMatch(/internal rates come only from the client's own card/);
  });
});
