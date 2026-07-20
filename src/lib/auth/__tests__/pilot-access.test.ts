import {
  type AppSessionRole,
  hasExplicitTenantAlias,
  inferSessionRoleFromEmail,
  resolvePinnedSessionClientKey,
} from "@/lib/auth/access-routing";
import { inferClientKeyFromEmail, type ClientKey } from "@/lib/client-config";

// Real external pilot users ported from the production pilot. Each is an
// explicit access grant — this test is the contract that pins each to exactly
// one client with the locked `client` role, and proves we do NOT over-grant.
const PILOT_GRANTS: ReadonlyArray<
  readonly [string, ClientKey, AppSessionRole]
> = [
  ["kmysore@gmail.com", "meridian", "client"],
  ["surekha.durvasula@gmail.com", "lakeshore", "client"],
  ["anandshp@gmail.com", "lakeshore", "client"],
  ["admin@abarva.ai", "arcturus", "admin"],
  ["anand@abarva.ai", "skyharbor", "admin"],
  ["mreddy@republicebank.com", "arcturus", "client"],
];

describe("pilot user access (main)", () => {
  it.each(PILOT_GRANTS)(
    "%s resolves to its client, pins, and resolves to the expected session role",
    (email, expectedKey, expectedRole) => {
      expect(inferClientKeyFromEmail(email)).toBe(expectedKey);
      expect(hasExplicitTenantAlias(email)).toBe(true);
      expect(inferSessionRoleFromEmail(email)).toBe(expectedRole);
      expect(resolvePinnedSessionClientKey({ email })).toBe(expectedKey);
    },
  );

  it("is case-insensitive (Clerk may pass mixed case)", () => {
    expect(inferClientKeyFromEmail("KMysore@Gmail.com")).toBe("meridian");
    expect(hasExplicitTenantAlias("Admin@Abarva.AI")).toBe(true);
  });

  it("FENCE: an unrelated gmail user gets no client and no alias", () => {
    expect(inferClientKeyFromEmail("random.person@gmail.com")).toBeNull();
    expect(hasExplicitTenantAlias("random.person@gmail.com")).toBe(false);
    expect(inferSessionRoleFromEmail("random.person@gmail.com")).toBeNull();
  });

  it("FENCE: a different @abarva.ai address is NOT auto-granted", () => {
    // Only the two enumerated abarva.ai pilot addresses are granted; a new one
    // must be added deliberately, not inferred from the domain.
    expect(inferClientKeyFromEmail("someoneelse@abarva.ai")).toBeNull();
    expect(hasExplicitTenantAlias("someoneelse@abarva.ai")).toBe(false);
  });

  it("FENCE: a different Republic E Bank address is NOT auto-granted", () => {
    expect(inferClientKeyFromEmail("someoneelse@republicebank.com")).toBeNull();
    expect(hasExplicitTenantAlias("someoneelse@republicebank.com")).toBe(false);
    expect(
      inferSessionRoleFromEmail("someoneelse@republicebank.com"),
    ).toBeNull();
  });
});
