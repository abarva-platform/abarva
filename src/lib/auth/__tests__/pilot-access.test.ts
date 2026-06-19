import { inferClientKeyFromEmail, type ClientKey } from "@/lib/client-config";
import {
  hasExplicitTenantAlias,
  inferSessionRoleFromEmail,
  resolvePinnedSessionClientKey,
} from "@/lib/auth/access-routing";

// Real external pilot users ported from the production pilot. Each is an
// explicit access grant — this test is the contract that pins each to exactly
// one client with the locked `client` role, and proves we do NOT over-grant.
const PILOT_GRANTS: ReadonlyArray<readonly [string, ClientKey]> = [
  ["kmysore@gmail.com", "meridian"],
  ["surekha.durvasula@gmail.com", "lakeshore"],
  ["anandshp@gmail.com", "lakeshore"],
  ["admin@abarva.ai", "arcturus"],
  ["anand@abarva.ai", "skyharbor"],
];

describe("pilot user access (main)", () => {
  it.each(PILOT_GRANTS)(
    "%s resolves to its client, pins, and gets the locked client role",
    (email, expectedKey) => {
      expect(inferClientKeyFromEmail(email)).toBe(expectedKey);
      expect(hasExplicitTenantAlias(email)).toBe(true);
      expect(inferSessionRoleFromEmail(email)).toBe("client");
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
});
