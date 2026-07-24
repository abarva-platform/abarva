import { describe, expect, it, beforeEach } from "@jest/globals";
import { azureRead } from "@/lib/data-plane/azureRead";
import {
  getCurrentTaxonomyVersion,
  getRoleByCode,
  listRoleAliasesForTenant,
  listTowers,
} from "../reference-repository";

jest.mock("@/lib/data-plane/azureRead", () => ({
  azureRead: {
    select: jest.fn(),
    maybeSingle: jest.fn(),
  },
}));

const selectMock = azureRead.select as jest.MockedFunction<typeof azureRead.select>;
const maybeSingleMock = azureRead.maybeSingle as jest.MockedFunction<typeof azureRead.maybeSingle>;

describe("reference-repository", () => {
  beforeEach(() => {
    selectMock.mockReset();
    maybeSingleMock.mockReset();
  });

  it("getCurrentTaxonomyVersion queries is_current = true", async () => {
    maybeSingleMock.mockResolvedValueOnce({ id: "v1", version: 3 } as never);
    const result = await getCurrentTaxonomyVersion();
    expect(result).toEqual({ id: "v1", version: 3 });
    expect(maybeSingleMock).toHaveBeenCalledWith(
      expect.objectContaining({
        table: "pricing_taxonomy_versions",
        where: { is_current: true },
      }),
    );
  });

  it("listTowers scopes the query to the requested taxonomy version", async () => {
    selectMock.mockResolvedValueOnce([{ tower_code: "TWR-01" }] as never);
    const rows = await listTowers(3);
    expect(rows).toEqual([{ tower_code: "TWR-01" }]);
    expect(selectMock).toHaveBeenCalledWith(
      expect.objectContaining({ table: "pricing_towers", where: { taxonomy_version: 3 } }),
    );
  });

  it("getRoleByCode scopes by both taxonomy_version and role_code", async () => {
    maybeSingleMock.mockResolvedValueOnce({ role_code: "ROL-001" } as never);
    const row = await getRoleByCode(3, "ROL-001");
    expect(row).toEqual({ role_code: "ROL-001" });
    expect(maybeSingleMock).toHaveBeenCalledWith(
      expect.objectContaining({
        table: "pricing_roles",
        where: { taxonomy_version: 3, role_code: "ROL-001" },
      }),
    );
  });

  describe("listRoleAliasesForTenant — tenant isolation at the repository layer", () => {
    it("returns only global aliases when no tenant key is supplied", async () => {
      selectMock.mockResolvedValueOnce([{ alias_code: "ALIAS-GLOBAL" }] as never);
      const rows = await listRoleAliasesForTenant(3, null);
      expect(rows).toEqual([{ alias_code: "ALIAS-GLOBAL" }]);
      expect(selectMock).toHaveBeenCalledTimes(1);
      expect(selectMock).toHaveBeenCalledWith(
        expect.objectContaining({
          table: "pricing_role_aliases",
          where: { taxonomy_version: 3, tenant_key: { op: "is", value: null } },
        }),
      );
    });

    it("never leaks a different tenant's alias rows: apex-retail's query cannot return meridian-health's rows", async () => {
      // Simulate a shared underlying table with rows for two tenants; the
      // fake azureRead.select only returns rows matching the `where` clause
      // the repository function actually sent — proving the repository,
      // not just a lucky mock, is what enforces the tenant boundary.
      const table = [
        { alias_code: "ALIAS-GLOBAL-1", tenant_key: null },
        { alias_code: "ALIAS-APEX-1", tenant_key: "apex-retail" },
        { alias_code: "ALIAS-MERIDIAN-1", tenant_key: "meridian-health" },
      ];
      selectMock.mockImplementation(async (request) => {
        const where = request.where ?? {};
        return table.filter((row) => {
          for (const [column, predicate] of Object.entries(where)) {
            if (column === "tenant_key") {
              if (predicate && typeof predicate === "object" && "op" in predicate) {
                if (predicate.op === "is" && row.tenant_key !== null) return false;
              } else if (row.tenant_key !== predicate) {
                return false;
              }
            }
          }
          return true;
        }) as never;
      });

      const apexRows = await listRoleAliasesForTenant(3, "apex-retail");
      expect(apexRows.map((r) => r.alias_code).sort()).toEqual(["ALIAS-APEX-1", "ALIAS-GLOBAL-1"]);
      expect(apexRows.some((r) => r.alias_code === "ALIAS-MERIDIAN-1")).toBe(false);

      const meridianRows = await listRoleAliasesForTenant(3, "meridian-health");
      expect(meridianRows.map((r) => r.alias_code).sort()).toEqual([
        "ALIAS-GLOBAL-1",
        "ALIAS-MERIDIAN-1",
      ]);
      expect(meridianRows.some((r) => r.alias_code === "ALIAS-APEX-1")).toBe(false);
    });
  });
});
