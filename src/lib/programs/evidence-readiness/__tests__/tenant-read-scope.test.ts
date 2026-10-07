import {
  CANONICAL_TENANT_KEYS,
  appClientKeyForTenant,
  canonicalTenantKey,
} from "@/lib/tenant/aliases";
import {
  evidenceTenantScopeReport,
  moveEvidenceReadTenantKeys,
  storedTenantKeyNamesSameTenant,
  tenantAliasProfilesAreDisjoint,
} from "../tenant-read-scope";

// Tenant keys come from code, never hand-typed. These cases turn on ONE tenant
// being stored under more than one of its own keys, so both keys are derived
// from the alias table itself, and a second, unrelated tenant comes from the
// same source.
const SPLIT_KEY_TENANT = CANONICAL_TENANT_KEYS.find(
  (key) => appClientKeyForTenant(key) !== key,
)!;
const APP_KEY = appClientKeyForTenant(SPLIT_KEY_TENANT)!;
const CANONICAL_KEY = canonicalTenantKey(SPLIT_KEY_TENANT);
const OTHER_TENANT_KEY = CANONICAL_TENANT_KEYS.find(
  (key) => key !== SPLIT_KEY_TENANT,
)!;

describe("moveEvidenceReadTenantKeys", () => {
  it("the fixture these cases rest on exists: a tenant with two distinct keys", () => {
    // Without this the derivation above could be undefined and every case below
    // would compare a key against itself and pass for the wrong reason.
    expect(SPLIT_KEY_TENANT).toBeTruthy();
    expect(APP_KEY).toBeTruthy();
    expect(CANONICAL_KEY).toBeTruthy();
    expect(APP_KEY).not.toEqual(CANONICAL_KEY);
    expect(OTHER_TENANT_KEY).toBeTruthy();
    expect(OTHER_TENANT_KEY).not.toEqual(CANONICAL_KEY);
  });

  it("includes the canonical substrate key beside the app client key", () => {
    const keys = moveEvidenceReadTenantKeys(APP_KEY);
    expect(keys).toContain(APP_KEY);
    expect(keys).toContain(CANONICAL_KEY);
  });

  it("is reflexive: either key of a tenant resolves to the same set", () => {
    expect(new Set(moveEvidenceReadTenantKeys(CANONICAL_KEY))).toEqual(
      new Set(moveEvidenceReadTenantKeys(APP_KEY)),
    );
  });

  it("leaves an unrecognised key exactly as given, widening nothing", () => {
    expect(moveEvidenceReadTenantKeys("tenant-a")).toEqual(["tenant-a"]);
  });

  it("reads nothing without a tenant, so a scope can never be empty-matched", () => {
    expect(moveEvidenceReadTenantKeys("")).toEqual([]);
    expect(moveEvidenceReadTenantKeys(null)).toEqual([]);
    expect(moveEvidenceReadTenantKeys(undefined)).toEqual([]);
  });

  it("never contains another tenant's key", () => {
    for (const canonicalKey of CANONICAL_TENANT_KEYS) {
      const keys = new Set(moveEvidenceReadTenantKeys(canonicalKey));
      for (const other of CANONICAL_TENANT_KEYS) {
        if (other === canonicalKey) continue;
        expect(keys.has(other)).toBe(false);
      }
    }
  });
});

describe("tenantAliasProfilesAreDisjoint", () => {
  // The precondition every alias-scoped read rests on. The alias lookup is a
  // Map, so a key claimed by two profiles resolves to whichever registered last
  // and silently widens one tenant's read onto another's rows.
  it("holds for every tenant declared in code", () => {
    expect(tenantAliasProfilesAreDisjoint()).toEqual({
      disjoint: true,
      sharedKeys: [],
    });
  });

  it("covers every canonical tenant, not a hand-typed subset", () => {
    expect(CANONICAL_TENANT_KEYS.length).toBeGreaterThan(1);
    for (const canonicalKey of CANONICAL_TENANT_KEYS) {
      expect(moveEvidenceReadTenantKeys(canonicalKey)).toContain(canonicalKey);
    }
  });
});

describe("evidenceTenantScopeReport", () => {
  it("names the stored keys a client-key-only read would miss", () => {
    expect(
      evidenceTenantScopeReport({
        clientKey: APP_KEY,
        storedTenantKeys: [CANONICAL_KEY],
      }),
    ).toMatchObject({
      missedByClientKeyOnly: [CANONICAL_KEY],
      outOfScopeTenantKeys: [],
    });
  });

  it("reports nothing missed when every row carries the client key", () => {
    expect(
      evidenceTenantScopeReport({
        clientKey: APP_KEY,
        storedTenantKeys: [APP_KEY, APP_KEY],
      }),
    ).toMatchObject({ missedByClientKeyOnly: [], outOfScopeTenantKeys: [] });
  });

  it("reports another tenant's key apart rather than folding it in", () => {
    const report = evidenceTenantScopeReport({
      clientKey: APP_KEY,
      storedTenantKeys: [CANONICAL_KEY, OTHER_TENANT_KEY, "unknown-co"],
    });
    expect(report.missedByClientKeyOnly).toEqual([CANONICAL_KEY]);
    expect(report.outOfScopeTenantKeys).toEqual([
      OTHER_TENANT_KEY,
      "unknown-co",
    ]);
  });

  it("deduplicates and ignores blank stored keys", () => {
    const report = evidenceTenantScopeReport({
      clientKey: APP_KEY,
      storedTenantKeys: [CANONICAL_KEY, CANONICAL_KEY, "", APP_KEY],
    });
    expect(report.missedByClientKeyOnly).toEqual([CANONICAL_KEY]);
    expect(report.outOfScopeTenantKeys).toEqual([]);
  });

  it("treats every stored key as out of scope when there is no tenant", () => {
    expect(
      evidenceTenantScopeReport({
        clientKey: null,
        storedTenantKeys: [APP_KEY],
      }),
    ).toEqual({
      readableTenantKeys: [],
      missedByClientKeyOnly: [],
      outOfScopeTenantKeys: [APP_KEY],
    });
  });
});

describe("storedTenantKeyNamesSameTenant", () => {
  it("attributes the canonical key to the app client key's tenant", () => {
    expect(storedTenantKeyNamesSameTenant(APP_KEY, CANONICAL_KEY)).toBe(
      true,
    );
  });

  it("refuses a different tenant", () => {
    expect(
      storedTenantKeyNamesSameTenant(APP_KEY, OTHER_TENANT_KEY),
    ).toBe(false);
  });

  it("falls back to an exact comparison when neither key is known", () => {
    expect(storedTenantKeyNamesSameTenant("tenant-a", "tenant-a")).toBe(true);
    expect(storedTenantKeyNamesSameTenant("tenant-a", "tenant-b")).toBe(false);
  });

  it("refuses when either side is absent", () => {
    expect(storedTenantKeyNamesSameTenant("", APP_KEY)).toBe(false);
    expect(storedTenantKeyNamesSameTenant(APP_KEY, null)).toBe(false);
  });
});

describe("tenantAliasProfilesAreDisjoint — the detection itself", () => {
  // The declared profiles are disjoint, so the default call can only answer
  // true. These exercise the detector against pairs that do collide.
  const keysFor = (map: Record<string, string[]>) => (key: string) =>
    map[key] ?? [];

  it("names a key two tenants both claim", () => {
    expect(
      tenantAliasProfilesAreDisjoint(
        ["alpha-co", "beta-co"],
        keysFor({
          "alpha-co": ["alpha-co", "shared-key"],
          "beta-co": ["beta-co", "shared-key"],
        }),
      ),
    ).toEqual({ disjoint: false, sharedKeys: ["shared-key"] });
  });

  it("treats keys differing only by case or underscore as the same claim", () => {
    expect(
      tenantAliasProfilesAreDisjoint(
        ["alpha-co", "beta-co"],
        keysFor({
          "alpha-co": ["Shared_Key"],
          "beta-co": ["shared-key"],
        }),
      ),
    ).toEqual({ disjoint: false, sharedKeys: ["shared-key"] });
  });

  it("does not report a tenant colliding with itself", () => {
    expect(
      tenantAliasProfilesAreDisjoint(
        ["alpha-co"],
        keysFor({ "alpha-co": ["alpha-co", "alpha-co", "alpha_co"] }),
      ),
    ).toEqual({ disjoint: true, sharedKeys: [] });
  });

  it("is disjoint for tenants that share nothing", () => {
    expect(
      tenantAliasProfilesAreDisjoint(
        ["alpha-co", "beta-co"],
        keysFor({ "alpha-co": ["alpha-co"], "beta-co": ["beta-co"] }),
      ),
    ).toEqual({ disjoint: true, sharedKeys: [] });
  });
});
