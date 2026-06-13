import { describe, expect, it } from "@jest/globals";
import {
  AZURE_SEARCH_EMBEDDING_DIMENSIONS,
  azureSearchIndexContracts,
} from "../index-contracts";

describe("azureSearchIndexContracts", () => {
  it("defines the five approved retrieval indexes", () => {
    expect(azureSearchIndexContracts().map((index) => index.name)).toEqual([
      "tenant-context-v1",
      "evidence-ledger-v1",
      "source-vendor-v1",
      "industry-corpus-v1",
      "signals-v1",
    ]);
  });

  it("keeps every index tenant/industry scoped and vector searchable", () => {
    for (const index of azureSearchIndexContracts()) {
      expect(index.fields.some((field) => field.key)).toBe(true);
      expect(
        index.fields.some(
          (field) => field.name === "tenant_key" || field.name === "industry",
        ),
      ).toBe(true);
      const vector = index.fields.find((field) => field.name === "embedding");
      expect(vector).toMatchObject({
        type: "Collection(Edm.Single)",
        searchable: true,
        dimensions: AZURE_SEARCH_EMBEDDING_DIMENSIONS,
      });
      expect(index.vectorSearch?.profiles).toHaveLength(1);
    }
  });

  it("keeps tenant-context-v1 governance fields retrievable and filterable", () => {
    const tenantContext = azureSearchIndexContracts().find(
      (index) => index.name === "tenant-context-v1",
    );
    expect(tenantContext).toBeDefined();
    const fields = new Map(
      tenantContext!.fields.map((field) => [field.name, field]),
    );
    for (const fieldName of [
      "tenant_key",
      "client_id",
      "client_key",
      "source_basis",
      "source_citation",
      "confidence_level",
      "classification",
      "lifecycle_state",
      "agent_readiness_status",
    ]) {
      expect(fields.get(fieldName)).toMatchObject({
        filterable: true,
        retrievable: true,
      });
    }
  });
});
