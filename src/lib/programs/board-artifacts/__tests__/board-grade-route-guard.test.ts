import { ALL_CLIENTS } from "@/lib/client-config";
import { isFoundationTenantKey } from "@/lib/tenant/foundation-tenants";

import { BOARD_GRADE_ARTIFACT_TENANT } from "../board-grade-route-guard";

const getActiveClientKeyMock = jest.fn();

jest.mock("@/lib/active-client", () => ({
  getActiveClientKey: () => getActiveClientKeyMock(),
}));

/**
 * The guard has two denial branches, and which one a tenant takes is decided by
 * `isFoundationTenantKey` — a list that moves. This suite used to hand-type one
 * tenant per branch, and it went red the day one of those tenants was promoted
 * into `FOUNDATION_TENANT_KEYS`: the denial was still correct (403 either way),
 * but the fixture had quietly stopped being an example of the branch it named.
 *
 * So the fixtures are DERIVED from the same two sources the guard consults, and
 * each is asserted to exist before it is used. If the foundation list ever grew
 * to cover every non-owner tenant, the legacy branch would become unreachable —
 * and these cases say so loudly instead of passing on a tenant that no longer
 * demonstrates anything.
 */
const foundationTenant = ALL_CLIENTS.map((client) => client.id).find(
  (key) => key !== BOARD_GRADE_ARTIFACT_TENANT && isFoundationTenantKey(key),
);

const nonFoundationTenant = ALL_CLIENTS.map((client) => client.id).find(
  (key) => key !== BOARD_GRADE_ARTIFACT_TENANT && !isFoundationTenantKey(key),
);

describe("assertBoardGradeTenancy", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("has a real tenant for each denial branch, so neither case can pass vacuously", () => {
    // Non-vacuous guard for the two cases below: `undefined` here would make
    // both of them assert against a tenant that does not exist.
    expect(foundationTenant).toBeDefined();
    expect(nonFoundationTenant).toBeDefined();
    expect(isFoundationTenantKey(foundationTenant!)).toBe(true);
    expect(isFoundationTenantKey(nonFoundationTenant!)).toBe(false);
  });

  it("blocks governed foundation tenants from board-grade reference fallbacks", async () => {
    getActiveClientKeyMock.mockResolvedValue(foundationTenant);

    const { assertBoardGradeTenancy } = await import(
      "../board-grade-route-guard"
    );

    const response = await assertBoardGradeTenancy("test route");

    expect(response?.status).toBe(403);
    await expect(response?.json()).resolves.toMatchObject({
      error: "governed_foundation_tenant",
    });
  });

  it("keeps legacy cross-tenant denial for non-foundation tenants", async () => {
    getActiveClientKeyMock.mockResolvedValue(nonFoundationTenant);

    const { assertBoardGradeTenancy } = await import(
      "../board-grade-route-guard"
    );

    const response = await assertBoardGradeTenancy("test route");

    expect(response?.status).toBe(403);
    await expect(response?.json()).resolves.toMatchObject({
      error: "forbidden",
    });
  });

  it("allows the reference artifact owner tenant", async () => {
    getActiveClientKeyMock.mockResolvedValue(BOARD_GRADE_ARTIFACT_TENANT);

    const { assertBoardGradeTenancy } = await import(
      "../board-grade-route-guard"
    );

    await expect(assertBoardGradeTenancy("test route")).resolves.toBeNull();
  });
});

export {};
