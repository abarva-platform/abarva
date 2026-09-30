import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { CANONICAL_TENANT_KEYS } from "../../../src/config/tenants/CANONICAL_TENANTS";
import { assertSegmentWriteManifest, segmentSourceBasis } from "../segment-write-manifest-gate";

const tenantKey = CANONICAL_TENANT_KEYS[0];
const manifestId = "synthetic-segment-scope-v1";

function fixture() {
  const repoRoot = fs.mkdtempSync(path.join(os.tmpdir(), "segment-manifest-gate-"));
  const activeRoot = `datasets/tenant-inputs/active/${tenantKey}/current`;
  fs.mkdirSync(path.join(repoRoot, activeRoot), { recursive: true });
  fs.mkdirSync(path.join(repoRoot, "docs/governance/dataset-manifests"), { recursive: true });
  fs.writeFileSync(
    path.join(repoRoot, "datasets/tenant-inputs/tenant-input-registry.json"),
    JSON.stringify({
      activeRoot: "datasets/tenant-inputs/active",
      activeTenants: [{ tenantKey, canonicalInputRoot: activeRoot }],
    }),
  );
  fs.writeFileSync(path.join(repoRoot, activeRoot, "01_business_functions.csv"), "function_name\nOperations\n");
  fs.writeFileSync(path.join(repoRoot, activeRoot, "01b_business_segments.csv"), "segment_key\ncore\n");
  const manifest = {
    dataset_id: manifestId,
    title: "Synthetic segment scope",
    client_key: tenantKey,
    tenant_scope: "canonical_tenant",
    source_layer: "tenant_context",
    classification: "internal",
    owner: "Data Governance",
    source_basis: segmentSourceBasis(repoRoot, tenantKey),
    ingestion_method: "operator_aca_job",
    retrieval_plan: "postgres_fts",
    retrieval_proof_required: true,
    expected_object_count: 2,
    approved_by: "Test Approver",
    approved_at: "2026-09-30",
  };
  const writeManifest = () => fs.writeFileSync(
    path.join(repoRoot, "docs/governance/dataset-manifests", `${manifestId}.json`),
    JSON.stringify(manifest),
  );
  writeManifest();
  const args = {
    repoRoot,
    tenantKeys: [tenantKey],
    segmentRecordCount: 1,
    segmentObjectCount: 2,
    segmentCandidateCount: 1,
    manifestId,
  };
  return { repoRoot, activeRoot, manifest, writeManifest, args };
}

describe("segment write manifest gate", () => {
  let root: string;
  afterEach(() => {
    if (root) fs.rmSync(root, { recursive: true, force: true });
  });

  it("permits only a reviewed manifest for the exact registered source bytes", () => {
    const item = fixture();
    root = item.repoRoot;
    expect(() => assertSegmentWriteManifest(item.args)).not.toThrow();
  });

  it("refuses a segment write without a manifest before any database call", () => {
    const item = fixture();
    root = item.repoRoot;
    expect(() => assertSegmentWriteManifest({ ...item.args, manifestId: undefined })).toThrow(/manifest ID is required/);
  });

  it("refuses a manifest for a different tenant or object count", () => {
    const item = fixture();
    root = item.repoRoot;
    item.manifest.client_key = CANONICAL_TENANT_KEYS[1];
    item.writeManifest();
    expect(() => assertSegmentWriteManifest(item.args)).toThrow(/scope, source hashes, or object count/);
    item.manifest.client_key = tenantKey;
    item.manifest.expected_object_count = 3;
    item.writeManifest();
    expect(() => assertSegmentWriteManifest(item.args)).toThrow(/scope, source hashes, or object count/);
  });

  it("refuses a changed source file after approval", () => {
    const item = fixture();
    root = item.repoRoot;
    fs.appendFileSync(path.join(root, item.activeRoot, "01b_business_segments.csv"), "second\n");
    expect(() => assertSegmentWriteManifest(item.args)).toThrow(/scope, source hashes, or object count/);
  });

  it("refuses a multi-tenant segment write under one manifest", () => {
    const item = fixture();
    root = item.repoRoot;
    expect(() => assertSegmentWriteManifest({ ...item.args, tenantKeys: [...CANONICAL_TENANT_KEYS] })).toThrow(/one declared tenant/);
  });

  it("does not require a new manifest when no segment is in the build", () => {
    expect(() => assertSegmentWriteManifest({
      repoRoot: "/not/read",
      tenantKeys: [tenantKey],
      segmentRecordCount: 0,
      segmentObjectCount: 1,
      segmentCandidateCount: 0,
      manifestId: undefined,
    })).not.toThrow();
  });

  it("keeps approved manifests in the ACA operator image", () => {
    const dockerfile = fs.readFileSync(path.resolve(__dirname, "../../../Dockerfile"), "utf8");
    expect(dockerfile).toContain(
      "/app/docs/governance/dataset-manifests ./docs/governance/dataset-manifests",
    );
  });
});
