import { validateManifest, type DatasetManifest } from "../dataset-manifest";

function manifest(over: Partial<DatasetManifest> = {}): DatasetManifest {
  return {
    dataset_id: "lakeshore-cloud-posture-2026q2",
    title: "Lakeshore cloud posture extract",
    client_key: "lakeshore-holdings",
    source_layer: "tenant_context",
    classification: "internal",
    owner: "anand",
    source_basis: "tenant_admin_upload",
    ingestion_method: "admin_bulk_loader",
    retrieval_plan: "fts_plus_search",
    retrieval_proof_required: true,
    pii_phi_handling: null,
    expected_object_count: 180,
    approved_by: "anand",
    approved_at: "2026-06-08",
    notes: null,
    ...over,
  };
}

describe("validateManifest", () => {
  it("accepts a well-formed manifest", () => {
    const v = validateManifest(manifest());
    expect(v.ok).toBe(true);
    expect(v.errors).toHaveLength(0);
  });

  it("rejects a non-canonical client_key (real client name guard)", () => {
    const v = validateManifest(
      manifest({ client_key: "morgan-street" as never }),
    );
    expect(v.ok).toBe(false);
  });

  it("rejects sensitive data destined for shared corpus", () => {
    const v = validateManifest(
      manifest({
        client_key: "corpus_global",
        classification: "phi",
        source_layer: "industry_corpus",
        pii_phi_handling: "redacted",
      }),
    );
    expect(v.ok).toBe(false);
    expect(v.errors.join(" ")).toMatch(/corpus_global/);
  });

  it("requires pii_phi_handling for sensitive classifications", () => {
    const v = validateManifest(
      manifest({ classification: "pii", pii_phi_handling: null }),
    );
    expect(v.ok).toBe(false);
    expect(v.errors.join(" ")).toMatch(/pii_phi_handling/);
  });

  it("rejects unknown fields (strict schema — no silent extra keys)", () => {
    const v = validateManifest({ ...manifest(), sneaky: true });
    expect(v.ok).toBe(false);
  });

  it("rejects a malformed approved_at date", () => {
    const v = validateManifest(manifest({ approved_at: "June 8 2026" }));
    expect(v.ok).toBe(false);
  });

  it("warns when retrievable but retrieval_proof_required is false", () => {
    const v = validateManifest(
      manifest({
        retrieval_plan: "azure_ai_search",
        retrieval_proof_required: false,
      }),
    );
    expect(v.ok).toBe(true);
    expect(v.warnings.join(" ")).toMatch(/retrieval-proven/);
  });
});
