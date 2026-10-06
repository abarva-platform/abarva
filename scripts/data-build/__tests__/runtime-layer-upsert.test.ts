import { upsertCurrentRowColumns } from "../runtime-layer-upsert";

describe("runtime layer current-row upsert", () => {
  it("refreshes canonical identity labels and lineage on a matching record", () => {
    const sql = upsertCurrentRowColumns(
      [
        "record_key",
        "tenant_key",
        "contract_version",
        "object_type",
        "source_object_id",
        "display_name",
        "source_file",
        "source_row_number",
        "source_evidence_refs",
        "source_authority",
        "lineage",
        "attributes",
      ],
      {
        keys: [
          "tenant_key",
          "contract_version",
          "object_type",
          "source_object_id",
        ],
        immutable: ["record_key"],
      },
    );
    for (const field of [
      "display_name",
      "source_file",
      "source_row_number",
      "source_evidence_refs",
      "source_authority",
      "lineage",
      "attributes",
    ]) {
      expect(sql).toContain(`${field}=excluded.${field}`);
    }
    expect(sql).not.toContain("record_key=excluded.record_key");
    expect(sql).not.toContain("tenant_key=excluded.tenant_key");
  });

  it("refreshes graph node evidence without changing the node identity", () => {
    const sql = upsertCurrentRowColumns(
      [
        "node_key",
        "tenant_key",
        "contract_version",
        "node_id",
        "object_family",
        "business_display_name",
        "source_file",
        "source_row_number",
        "source_evidence_refs",
      ],
      {
        keys: ["node_key"],
        immutable: ["tenant_key", "contract_version", "node_id"],
      },
    );
    expect(sql).toContain("source_file=excluded.source_file");
    expect(sql).toContain("source_evidence_refs=excluded.source_evidence_refs");
    expect(sql).not.toContain("node_id=excluded.node_id");
  });

  it("refreshes relationship endpoints and evidence while retaining the source identity", () => {
    const sql = upsertCurrentRowColumns(
      [
        "edge_key",
        "tenant_key",
        "contract_version",
        "relationship_id",
        "source_file",
        "source_row_number",
        "source_object_name",
        "target_object_name",
        "from_node_id",
        "to_node_id",
        "source_evidence_refs",
        "relationship_confidence",
      ],
      {
        keys: [
          "tenant_key",
          "contract_version",
          "relationship_id",
          "source_file",
          "source_row_number",
        ],
        immutable: ["edge_key"],
      },
    );
    for (const field of [
      "source_object_name",
      "target_object_name",
      "from_node_id",
      "to_node_id",
      "source_evidence_refs",
      "relationship_confidence",
    ]) {
      expect(sql).toContain(`${field}=excluded.${field}`);
    }
    expect(sql).not.toContain("source_row_number=excluded.source_row_number");
  });

  it("refuses unknown or invalid conflict columns", () => {
    expect(() =>
      upsertCurrentRowColumns(["id", "value"], { keys: [] }),
    ).toThrow("upsert keys and immutable fields must be inserted columns");
    expect(() =>
      upsertCurrentRowColumns(["id", "value"], { keys: ["missing"] }),
    ).toThrow("upsert keys and immutable fields must be inserted columns");
    expect(() =>
      upsertCurrentRowColumns(["id", "value"], {
        keys: ["id"],
        immutable: ["missing"],
      }),
    ).toThrow("upsert keys and immutable fields must be inserted columns");
    expect(() =>
      upsertCurrentRowColumns(["id", "bad-name"], { keys: ["id"] }),
    ).toThrow("invalid column identifier");
  });
});
