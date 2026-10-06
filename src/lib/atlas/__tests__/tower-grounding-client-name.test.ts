/**
 * Tower grounding: cover-name canonicalization and tenant scoping.
 *
 * WHY THIS SUITE WAS REWRITTEN (T-466). It previously declared
 * `const mockLoadV7TowerProjection = jest.fn(...)` and asserted against it,
 * but no `jest.mock` call ever installed it, so the assertion ran against a
 * spy nothing could call: 2 collected, 2 failed on `origin/main` 437d518a3.
 * The repair is NOT to install that spy. `buildAtlasTowerCurrentState` imports
 * no V7 projection module at all -- `grep -rn loadV7TowerProjection src`
 * returns nothing repo-wide -- and its `tenantKeyCandidates` input field is
 * read by nothing in the body and passed by nobody at the only call site
 * (`src/lib/atlas/tool-belt.ts:53`). The contract the old case described does
 * not exist at either end. It is replaced below by the tenant-scoping contract
 * that DOES exist: the resolved tenant key reaching the two projection
 * loaders the function actually imports. The dead input field is filed
 * separately rather than removed here; that is a product call, not a test fix.
 *
 * THE DATA-PLANE BOUNDARY, measured rather than assumed. Under this repo's
 * jest invocation an UNMOCKED read through `@/lib/data-plane/postgresCompat`
 * cannot reach Postgres and does not try: `loadPg` reaches the driver through
 * `new Function('specifier', 'return import(specifier)')`
 * (src/lib/data-plane/postgresCompat.ts:77-80), which jest's VM refuses
 * without `--experimental-vm-modules`. Probed directly with
 * `DATABASE_URL=postgresql://probe:probe@127.0.0.1:59999/probe`: the read
 * returned `{data: null, error: {message: "TypeError
 * [ERR_VM_DYNAMIC_IMPORT_CALLBACK_MISSING_FLAG] ..."}}` in 0 ms, no socket
 * opened. So this suite was never able to read live tenant data.
 *
 * That is luck, not a control, and it cuts the other way too: because the
 * error is SWALLOWED into `{data: null}`, an unmocked read is indistinguishable
 * from an empty one, and a suite that forgets to mock the data plane goes
 * green on silent nulls. That is precisely why the old first case passed its
 * fixture through unused -- removing its `clients` mock entirely changed
 * nothing, both paths converge on the same cover name. The mock below is
 * therefore made STRICT: any table other than `clients` throws, so the day
 * this file's call graph grows a real read, this suite says so instead of
 * quietly reading null.
 */

const selectedTables: string[] = [];

jest.mock("@/lib/data-plane/postgresCompat", () => ({
  getAzureReadFluentClient: jest.fn(() => ({
    from: jest.fn((table: string) => {
      selectedTables.push(table);
      if (table !== "clients") {
        throw new Error(
          `T-466 boundary guard: unmocked data-plane read of "${table}". ` +
            `This suite is only permitted to read "clients". An unmocked read ` +
            `returns a swallowed null under jest rather than failing, so it is ` +
            `caught here instead.`,
        );
      }
      return {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn(async () => ({ data: clientRow })),
      };
    }),
  })),
}));

jest.mock("@/lib/admin/ai-initiatives/queries", () => ({
  listInitiativesForClient: jest.fn(async () => []),
  listVendorsForClient: jest.fn(async () => []),
}));

jest.mock("@/lib/tower/tower-materialized-read-model", () => ({
  listMaterializedTowerReadModelForClient: jest.fn(async () => ({
    source: "empty",
    initiatives: [],
    vendors: [],
  })),
}));

jest.mock("@/lib/tower/tower-budget-rollups", () => ({
  listTowerBudgetRollupsForClient: jest.fn(async () => []),
  shapeTowerBudgetRollupsFromInitiatives: jest.fn(() => []),
}));

import { buildAtlasTowerCurrentState } from "@/lib/atlas/tower-grounding";
import { DEMO_SAFE_CLIENT_NAMES } from "@/lib/client-config";
import { listMaterializedTowerReadModelForClient } from "@/lib/tower/tower-materialized-read-model";
import { listTowerBudgetRollupsForClient } from "@/lib/tower/tower-budget-rollups";

type ClientRow = {
  id: string;
  name: string | null;
  tenant_key: string | null;
  slug: string | null;
  industry_code: string | null;
  industry: string | null;
};

let clientRow: ClientRow | null = null;

const mockMaterialized =
  listMaterializedTowerReadModelForClient as jest.MockedFunction<
    typeof listMaterializedTowerReadModelForClient
  >;
const mockBudgetRollups =
  listTowerBudgetRollupsForClient as jest.MockedFunction<
    typeof listTowerBudgetRollupsForClient
  >;

beforeEach(() => {
  selectedTables.length = 0;
  clientRow = null;
  mockMaterialized.mockClear();
  mockBudgetRollups.mockClear();
});

describe("buildAtlasTowerCurrentState cover-name canonicalization", () => {
  it("overrides a legacy brand label stored on the row with the demo-safe cover name", async () => {
    // The fixture feeds the RETIRED label deliberately. The old version of
    // this case fed "Airline Demo" -- already a cover name -- so it passed
    // whether or not canonicalization ran, and in fact passed identically with
    // its own mock deleted. A control has to be able to fail.
    clientRow = {
      id: "client-skyharbor",
      name: "SkyHarbor Air",
      tenant_key: "skyharbor-air",
      slug: "skyharbor-air",
      industry_code: "AIRLINE",
      industry: "airline",
    };

    const state = await buildAtlasTowerCurrentState({
      clientId: "client-skyharbor",
      clientKey: "skyharbor",
    });

    // Asserted against the register in code, never a hand-typed literal.
    expect(state.client.clientName).toBe(DEMO_SAFE_CLIENT_NAMES.skyharbor);
    expect(state.client.clientName).not.toBe("SkyHarbor Air");
    expect(state.client.clientName).not.toContain("Air Lines");
  });

  it("does not let a stored legacy label survive into the grounding state for a second tenant", async () => {
    clientRow = {
      id: "client-lakeshore",
      name: "Lakeshore Industries Inc",
      tenant_key: "lakeshore-holdings",
      slug: "lakeshore-holdings",
      industry_code: "GENERAL",
      industry: "industrial",
    };

    const state = await buildAtlasTowerCurrentState({
      clientId: "client-lakeshore",
      clientKey: "lakeshore-holdings",
    });

    expect(state.client.clientName).toBe(DEMO_SAFE_CLIENT_NAMES.lakeshore);
    expect(state.client.clientName).not.toBe("Lakeshore Industries Inc");
  });
});

describe("buildAtlasTowerCurrentState tenant scoping", () => {
  it("passes the tenant key resolved from the client row into both projection loaders", async () => {
    // This replaces the old "passes active-client tenant candidates into the
    // V7 Tower projection" case. These two ARE the projection boundaries
    // `buildAtlasTowerCurrentState` imports; the V7 loader it named is not.
    clientRow = {
      id: "client-lakeshore",
      name: "Lakeshore Industries Inc",
      tenant_key: "lakeshore-holdings",
      slug: "lakeshore-holdings",
      industry_code: "GENERAL",
      industry: "industrial",
    };

    await buildAtlasTowerCurrentState({
      clientId: "client-lakeshore",
      clientKey: "industrial-demo",
    });

    expect(mockMaterialized).toHaveBeenCalledWith(
      expect.objectContaining({
        clientId: "client-lakeshore",
        tenantKey: "lakeshore-holdings",
      }),
    );
    expect(mockBudgetRollups).toHaveBeenCalledWith(
      expect.objectContaining({
        clientId: "client-lakeshore",
        tenantKey: "lakeshore-holdings",
      }),
    );
  });

  it("falls back to the slug, not to the caller's clientKey, when the row carries no tenant_key", async () => {
    clientRow = {
      id: "client-lakeshore",
      name: "Lakeshore Industries Inc",
      tenant_key: null,
      slug: "lakeshore-holdings",
      industry_code: "GENERAL",
      industry: "industrial",
    };

    await buildAtlasTowerCurrentState({
      clientId: "client-lakeshore",
      clientKey: "industrial-demo",
    });

    expect(mockMaterialized).toHaveBeenCalledWith(
      expect.objectContaining({ tenantKey: "lakeshore-holdings" }),
    );
  });
});

describe("data-plane boundary", () => {
  it("reads no table but clients, so no unmocked read can go green on a swallowed null", async () => {
    clientRow = {
      id: "client-skyharbor",
      name: "SkyHarbor Air",
      tenant_key: "skyharbor-air",
      slug: "skyharbor-air",
      industry_code: "AIRLINE",
      industry: "airline",
    };

    await buildAtlasTowerCurrentState({
      clientId: "client-skyharbor",
      clientKey: "skyharbor",
    });

    expect(selectedTables).toEqual(["clients"]);
  });
});
