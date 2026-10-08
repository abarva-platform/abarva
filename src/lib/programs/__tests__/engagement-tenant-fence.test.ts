/**
 * The engagement console's tenancy fence.
 *
 * The defect: `/engagements/[engagementId]` loaded its Move with
 * `getEngagementByAnyId(engagementId)` — id only, no client column, through
 * the data-plane compat client, under a layout that guards only the
 * responsible-AI gates. A signed-in user of any tenant holding an engagement
 * UUID rendered another tenant's Move console.
 *
 * These cases pin BOTH directions. Under-fencing is the defect. Over-fencing
 * would withdraw a surface that works today, so the two fail-open states are
 * asserted as deliberately permitted, not left to a default.
 */
import {
  decideEngagementTenantAccess,
  engagementReadIsCrossTenant,
} from "@/lib/programs/engagement-tenant-fence";

const TENANT_A = "aaaaaaaa-1a1a-4a1a-8a1a-aaaaaaaaaaaa";
const TENANT_B = "bbbbbbbb-2b2b-4b2b-8b2b-bbbbbbbbbbbb";

describe("decideEngagementTenantAccess", () => {
  it("refuses a Move recorded against a different client — the defect", () => {
    expect(
      decideEngagementTenantAccess({
        engagementClientId: TENANT_B,
        contextClientId: TENANT_A,
      }),
    ).toEqual({ allow: false, reason: "cross_tenant" });
  });

  it("allows a Move recorded against the requesting client", () => {
    expect(
      decideEngagementTenantAccess({
        engagementClientId: TENANT_A,
        contextClientId: TENANT_A,
      }),
    ).toEqual({ allow: true, reason: "same_client" });
  });

  describe("a difference of spelling is not a difference of tenant", () => {
    it("treats case as a representation detail, not a mismatch", () => {
      expect(
        decideEngagementTenantAccess({
          engagementClientId: TENANT_A.toUpperCase(),
          contextClientId: TENANT_A,
        }),
      ).toEqual({ allow: true, reason: "same_client" });
    });

    it("treats surrounding whitespace the same way", () => {
      expect(
        decideEngagementTenantAccess({
          engagementClientId: `  ${TENANT_A}\n`,
          contextClientId: TENANT_A,
        }),
      ).toEqual({ allow: true, reason: "same_client" });
    });

    it("still refuses two genuinely different clients after normalising", () => {
      expect(
        decideEngagementTenantAccess({
          engagementClientId: ` ${TENANT_B.toUpperCase()} `,
          contextClientId: TENANT_A,
        }),
      ).toEqual({ allow: false, reason: "cross_tenant" });
    });
  });

  describe("fails open where no cross-tenant read is evidenced", () => {
    it("allows a Move that records no client at all", () => {
      expect(
        decideEngagementTenantAccess({
          engagementClientId: null,
          contextClientId: TENANT_A,
        }),
      ).toEqual({ allow: true, reason: "engagement_client_unrecorded" });
    });

    it("reads an empty client string as unrecorded, not as a mismatch", () => {
      expect(
        decideEngagementTenantAccess({
          engagementClientId: "   ",
          contextClientId: TENANT_A,
        }),
      ).toEqual({ allow: true, reason: "engagement_client_unrecorded" });
    });

    it("allows when tenancy resolved no client — an outage is not a mismatch", () => {
      expect(
        decideEngagementTenantAccess({
          engagementClientId: TENANT_A,
          contextClientId: null,
        }),
      ).toEqual({ allow: true, reason: "context_client_unresolved" });
    });

    it("reads an empty context client as unresolved", () => {
      expect(
        decideEngagementTenantAccess({
          engagementClientId: TENANT_A,
          contextClientId: "",
        }),
      ).toEqual({ allow: true, reason: "context_client_unresolved" });
    });

    it("allows when neither side records a client", () => {
      expect(
        decideEngagementTenantAccess({
          engagementClientId: null,
          contextClientId: null,
        }),
      ).toEqual({ allow: true, reason: "engagement_client_unrecorded" });
    });

    it("allows when both fields are absent entirely", () => {
      expect(decideEngagementTenantAccess({})).toEqual({
        allow: true,
        reason: "engagement_client_unrecorded",
      });
    });
  });

  it("names a distinct reason for every outcome it can reach", () => {
    const reasons = new Set(
      [
        { engagementClientId: TENANT_B, contextClientId: TENANT_A },
        { engagementClientId: TENANT_A, contextClientId: TENANT_A },
        { engagementClientId: null, contextClientId: TENANT_A },
        { engagementClientId: TENANT_A, contextClientId: null },
      ].map((input) => decideEngagementTenantAccess(input).reason),
    );
    expect(reasons).toEqual(
      new Set([
        "cross_tenant",
        "same_client",
        "engagement_client_unrecorded",
        "context_client_unresolved",
      ]),
    );
  });

  it("refuses exactly one of the four reachable states", () => {
    const refused = [
      { engagementClientId: TENANT_B, contextClientId: TENANT_A },
      { engagementClientId: TENANT_A, contextClientId: TENANT_A },
      { engagementClientId: null, contextClientId: TENANT_A },
      { engagementClientId: TENANT_A, contextClientId: null },
    ].filter((input) => !decideEngagementTenantAccess(input).allow);
    expect(refused).toHaveLength(1);
  });
});

describe("engagementReadIsCrossTenant", () => {
  it("is true only for the refusal the decider names", () => {
    expect(
      engagementReadIsCrossTenant({
        engagementClientId: TENANT_B,
        contextClientId: TENANT_A,
      }),
    ).toBe(true);
  });

  it("is false for each allowed state", () => {
    for (const input of [
      { engagementClientId: TENANT_A, contextClientId: TENANT_A },
      { engagementClientId: null, contextClientId: TENANT_A },
      { engagementClientId: TENANT_A, contextClientId: null },
    ]) {
      expect(engagementReadIsCrossTenant(input)).toBe(false);
    }
  });

  it("agrees with the decider on every case, so the two cannot drift", () => {
    for (const engagementClientId of [TENANT_A, TENANT_B, null, "  "]) {
      for (const contextClientId of [TENANT_A, TENANT_B, null, ""]) {
        const input = { engagementClientId, contextClientId };
        expect(engagementReadIsCrossTenant(input)).toBe(
          !decideEngagementTenantAccess(input).allow,
        );
      }
    }
  });
});
