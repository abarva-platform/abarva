import {
  CLIENT_KEY_TO_DB_NAME,
  DEMO_SAFE_CLIENT_NAMES,
  canonicalClientDisplayName,
} from "@/lib/client-config";

// Regression guard for the Move-card tenant-name leak (transformers.ts
// `canonicalProgramClientName`). The old code ran a 4-name if-cascade and
// defaulted everything else to the default client, so other tenants' Moves
// rendered under a tenant that is not theirs. The fix delegates to
// canonicalClientDisplayName, which resolves each tenant from its (key, name).
//
// Move cards always pass the tenant's DB name (clients.name), so the cases
// below drive the realistic resolution path.
//
// 2026-09-19 (backlog T-004). This suite pinned four hand-typed (key, name,
// label) rows. The demo-safe label for one tenant was deliberately changed on
// 2026-08-06 (#6001) and the suite has been failing ever since — visible to
// nobody, because it ran in no CI job. Pinned literals are what made a
// deliberate rename look like a defect and a real leak look like this one, so
// the expectations are now derived from the exported vocabulary itself:
// `CLIENT_KEY_TO_DB_NAME` supplies the inputs, `DEMO_SAFE_CLIENT_NAMES`
// supplies the answer, and a future rename moves both together. A hand-typed
// tenant list is also what AGENTS.md forbids.

// Keyed off the label map rather than off `ClientKey`, which is `string`:
// `ALL_CLIENTS` carries an explicit `ClientOption[]` annotation, so the literal
// ids are widened away before `ClientKey` is derived from them and a
// `Record<ClientKey, …>` gives no exhaustiveness at all. Recorded as backlog
// T-060; not changed here, because widening it back ripples through callers.
type CanonicalTenantKey = keyof typeof DEMO_SAFE_CLIENT_NAMES;

const clientKeys = Object.keys(DEMO_SAFE_CLIENT_NAMES) as CanonicalTenantKey[];

describe("Move-card tenant name resolution (no cross-tenant default)", () => {
  it("covers every canonical tenant and every DB name alias the lookup accepts", () => {
    // Non-vacuous: the loops below would pass trivially over an empty
    // vocabulary, and an empty vocabulary is exactly what a bad refactor of
    // client-config would produce.
    expect(clientKeys.length).toBeGreaterThanOrEqual(6);
    for (const key of clientKeys) {
      expect(CLIENT_KEY_TO_DB_NAME[key].length).toBeGreaterThan(0);
    }
  });

  it("resolves every tenant's DB name to that tenant's own demo-safe label", () => {
    const wrong: string[] = [];
    for (const key of clientKeys) {
      for (const dbName of CLIENT_KEY_TO_DB_NAME[key]) {
        const resolved = canonicalClientDisplayName({ key, name: dbName });
        if (resolved !== DEMO_SAFE_CLIENT_NAMES[key]) {
          wrong.push(
            `${key} + "${dbName}" -> "${resolved}" (expected "${DEMO_SAFE_CLIENT_NAMES[key]}")`,
          );
        }
      }
    }
    expect(wrong).toEqual([]);
  });

  it("resolves a DB name on its own, because a Move card may carry no key", () => {
    const wrong: string[] = [];
    for (const key of clientKeys) {
      for (const dbName of CLIENT_KEY_TO_DB_NAME[key]) {
        const resolved = canonicalClientDisplayName({ name: dbName });
        if (resolved !== DEMO_SAFE_CLIENT_NAMES[key]) {
          wrong.push(
            `"${dbName}" -> "${resolved}" (expected "${DEMO_SAFE_CLIENT_NAMES[key]}")`,
          );
        }
      }
    }
    expect(wrong).toEqual([]);
  });

  it("resolves a canonical key on its own, with no name to normalize", () => {
    // Two different code paths answer this function, and only one of them is
    // exercised by a Move card that carries a DB name. A recognized name is
    // normalized to its demo-safe form and matched before any key is
    // consulted, which leaves the per-key branches reachable only when the
    // name is absent — and those branches end at the default client. That is
    // where the original leak lived, so it is asserted separately rather than
    // assumed to be covered by the rows above.
    const wrong: string[] = [];
    for (const key of clientKeys) {
      const resolved = canonicalClientDisplayName({ key });
      if (resolved !== DEMO_SAFE_CLIENT_NAMES[key]) {
        wrong.push(
          `${key} -> "${resolved}" (expected "${DEMO_SAFE_CLIENT_NAMES[key]}")`,
        );
      }
    }
    expect(wrong).toEqual([]);
  });

  it("never resolves one tenant to another tenant's label", () => {
    // The defect this suite exists for, stated as the property rather than as
    // one named tenant: whatever the labels are called, no tenant may answer
    // with a label that belongs to a different tenant.
    const labels = new Map<string, CanonicalTenantKey>(
      clientKeys.map((key) => [DEMO_SAFE_CLIENT_NAMES[key] as string, key]),
    );
    expect(labels.size).toBe(clientKeys.length);

    const leaks: string[] = [];
    for (const key of clientKeys) {
      for (const dbName of CLIENT_KEY_TO_DB_NAME[key]) {
        const resolved = canonicalClientDisplayName({ key, name: dbName });
        const owner = resolved === null ? undefined : labels.get(resolved);
        if (owner && owner !== key) {
          leaks.push(`${key} + "${dbName}" rendered as ${owner}'s label`);
        }
      }
    }
    expect(leaks).toEqual([]);
  });

  it("returns the raw name for an unmapped tenant rather than inventing one", () => {
    expect(canonicalClientDisplayName({ name: "Some Other Co" })).toBe(
      "Some Other Co",
    );
    expect(
      Object.values(DEMO_SAFE_CLIENT_NAMES) as string[],
    ).not.toContain(canonicalClientDisplayName({ name: "Some Other Co" }));
  });
});
