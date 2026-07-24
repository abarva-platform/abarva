import { describe, expect, it, beforeEach } from "@jest/globals";

const mockListRoleAliasesForTenant = jest.fn();
const mockLoadRateCardReferenceSnapshot = jest.fn();

jest.mock("../../reference-repository", () => ({
  listRoleAliasesForTenant: (...args: unknown[]) => mockListRoleAliasesForTenant(...args),
}));
jest.mock("../reference-lookup", () => ({
  loadRateCardReferenceSnapshot: (...args: unknown[]) => mockLoadRateCardReferenceSnapshot(...args),
}));

import {
  commitClientRoleAliasImport,
  previewClientRoleAliasImport,
  type RoleAliasStorePort,
} from "../role-alias-import";

const REFS = {
  taxonomyVersion: 1,
  roleCodes: new Set(["ROL-001", "ROL-002"]),
  rateBandCodes: new Set<string>(),
  levelCodes: new Set<string>(),
};

describe("previewClientRoleAliasImport", () => {
  beforeEach(() => {
    mockListRoleAliasesForTenant.mockReset();
    mockLoadRateCardReferenceSnapshot.mockReset();
    mockLoadRateCardReferenceSnapshot.mockResolvedValue(REFS);
  });

  it("separates already-present aliases (no-op) from genuinely new ones", async () => {
    mockListRoleAliasesForTenant.mockResolvedValue([
      {
        id: "existing-1",
        taxonomy_version: 1,
        alias_code: "CLI-EXIST01",
        role_code: "ROL-001",
        alias_label: "Sr Data Engineer",
        normalized_alias: "sr data engineer",
        alias_type: "client_naming",
        tenant_key: "apex-retail",
        provider_scope: null,
        source_artifact: null,
        source_row: null,
        status: "active",
        content_hash: "x",
        created_at: "2026-08-01T00:00:00.000Z",
      },
    ]);

    const csv = [
      "alias_label,role_code,alias_type,notes",
      "Sr Data Engineer,ROL-001,client_naming,", // already present
      "Lead Data Engineer,ROL-002,client_naming,", // new
    ].join("\n");

    const preview = await previewClientRoleAliasImport({ tenantKey: "apex-retail", csvText: csv });
    expect(preview.alreadyPresent).toHaveLength(1);
    expect(preview.added).toHaveLength(1);
    expect(preview.added[0].aliasLabel).toBe("Lead Data Engineer");
  });
});

describe("commitClientRoleAliasImport", () => {
  it("inserts one row per added alias", async () => {
    const inserted: unknown[] = [];
    const store: RoleAliasStorePort = {
      async insertAlias(row) {
        inserted.push(row);
      },
    };
    const result = await commitClientRoleAliasImport(
      {
        tenantKey: "apex-retail",
        taxonomyVersion: 1,
        rows: [
          { rowNumber: 1, aliasLabel: "Lead Data Engineer", roleCode: "ROL-002", aliasType: "client_naming", notes: null },
        ],
      },
      store,
    );
    expect(result.inserted).toBe(1);
    expect(inserted).toHaveLength(1);
  });
});
