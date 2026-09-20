/**
 * T-060 (Platform-integrity section): `ClientKey` must be the union of the
 * tenant ids the registry declares, not `string`.
 *
 * `ClientKey` is derived as `(typeof ALL_CLIENTS)[number]["id"]`. That
 * derivation is only worth anything if `ALL_CLIENTS` keeps its literal ids.
 * While it carried an explicit `: ClientOption[]` annotation the ids were
 * widened to `string` before the derivation ran, so `ClientKey` was `string`
 * and every `Record<ClientKey, …>` in the registry accepted any key and
 * required none — a tenant could be dropped from either map, or a key that is
 * not a tenant added to it, and nothing would fail to compile. Both had
 * happened by the time this was measured.
 *
 * Two guards, because the defect has two faces:
 *
 *   1. The type guard below is enforced by `tsc`, not by jest. If `ClientKey`
 *      widens back to `string` the `@ts-expect-error` becomes unused and the
 *      typecheck fails. ts-jest does not report that, which is the point of
 *      stating it here: the control runs in the typecheck job.
 *   2. The runtime guards are enforced by jest and catch the consequence
 *      directly — a registry map whose key set has drifted from the declared
 *      tenants — without depending on the type surviving.
 */

import {
  ALL_CLIENTS,
  CLIENT_KEY_TO_DB_NAME,
  CLIENT_KEY_TO_INDUSTRY_CODE,
  DEFAULT_CLIENT_KEY,
  isClientKey,
  type ClientKey,
} from "@/lib/client-config";

const declaredIds = ALL_CLIENTS.map((client) => client.id)
  .slice()
  .sort();

describe("ClientKey is the declared tenant union, not string", () => {
  // Enforced by `tsc`, not by this expect. If `ClientKey` widens to `string`,
  // the assignment below stops being an error and the unused
  // `@ts-expect-error` fails the typecheck.
  it("rejects a string that is not a declared tenant id", () => {
    // @ts-expect-error — "definitely-not-a-tenant" is not a declared tenant id
    const notATenant: ClientKey = "definitely-not-a-tenant";
    expect(isClientKey(notATenant)).toBe(false);
  });

  // The negative control for the guard above: a key that IS declared has to be
  // assignable, or the guard would pass by rejecting everything.
  it("accepts a declared tenant id", () => {
    const real: ClientKey = "lakeshore";
    expect(isClientKey(real)).toBe(true);
  });

  it("derives the union from every id in ALL_CLIENTS", () => {
    expect(declaredIds).toEqual([
      "apexretail",
      "arcturus",
      "lakeshore",
      "meridian",
      "northstar",
      "skyharbor",
    ]);
  });

  it("names a declared tenant as the default", () => {
    expect(declaredIds).toContain(DEFAULT_CLIENT_KEY);
  });
});

describe("registry maps keyed by ClientKey cover exactly the declared tenants", () => {
  it.each([
    ["CLIENT_KEY_TO_DB_NAME", CLIENT_KEY_TO_DB_NAME],
    ["CLIENT_KEY_TO_INDUSTRY_CODE", CLIENT_KEY_TO_INDUSTRY_CODE],
  ])("%s has one entry per declared tenant and no others", (_name, map) => {
    expect(Object.keys(map).slice().sort()).toEqual(declaredIds);
  });

  it("gives every declared tenant at least one database name", () => {
    for (const id of declaredIds) {
      expect(CLIENT_KEY_TO_DB_NAME[id as ClientKey].length).toBeGreaterThan(0);
    }
  });

  it("gives every declared tenant a non-empty industry code", () => {
    for (const id of declaredIds) {
      expect(CLIENT_KEY_TO_INDUSTRY_CODE[id as ClientKey]).toBeTruthy();
    }
  });
});
