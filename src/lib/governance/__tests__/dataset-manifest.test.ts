import { validateManifest, type DatasetManifest } from "../dataset-manifest";

/**
 * The fixture's `client_key` must be one the schema still admits, or every
 * case below fails on that field before reaching the rule it is testing.
 *
 * It was a key the schema no longer accepts, so cases that read as tests of
 * PII/PHI handling, retrieval proof and classification were in fact reporting
 * a `client_key` enum error. That is a stale fixture, not a governance
 * regression: the live `validate:context-corpus` gate passes on real data and
 * runs on every pull request.
 *
 * Recorded rather than normalised away: the admitted set is
 * `corpus_global | meridian-health | skyharbor-air`, which is narrower than
 * the tenant registry. Whether the schema should admit the rest is a separate
 * and already-known question, and is not settled here.
 */
function manifest(over: Partial<DatasetManifest> = {}): DatasetManifest {
  return {
    dataset_id: "cloud-posture-2026q2",
    title: "Cloud posture extract",
    client_key: "meridian-health",
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
