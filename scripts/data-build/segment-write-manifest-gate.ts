import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

import { validateManifest, type DatasetManifest } from "../../src/lib/governance/dataset-manifest";

const SEGMENT_FILES = ["01_business_functions.csv", "01b_business_segments.csv"] as const;

type ActiveInputRegistry = {
  activeRoot?: string;
  activeTenants?: Array<{ tenantKey?: string; canonicalInputRoot?: string }>;
};

export function segmentSourceBasis(repoRoot: string, tenantKey: string): string {
  const registry = JSON.parse(
    fs.readFileSync(path.join(repoRoot, "datasets/tenant-inputs/tenant-input-registry.json"), "utf8"),
  ) as ActiveInputRegistry;
  const root = registry.activeTenants?.find((tenant) => tenant.tenantKey === tenantKey)?.canonicalInputRoot;
  if (!root || !registry.activeRoot || !root.startsWith(`${registry.activeRoot}/`)) {
    throw new Error(`Segment source root is not declared under the active registry for ${tenantKey}.`);
  }

  return SEGMENT_FILES.map((file) => {
    const relative = path.posix.join(root, file);
    const absolute = path.resolve(repoRoot, relative);
    if (!absolute.startsWith(`${path.resolve(repoRoot)}${path.sep}`)) {
      throw new Error("Segment source path escapes the repository root.");
    }
    const digest = crypto.createHash("sha256").update(fs.readFileSync(absolute)).digest("hex");
    return `${relative}@sha256:${digest}`;
  }).join("; ");
}

export function assertSegmentWriteManifest(args: {
  repoRoot: string;
  tenantKeys: readonly string[];
  segmentRecordCount: number;
  segmentObjectCount: number;
  segmentCandidateCount: number;
  manifestId: string | undefined;
}): void {
  if (args.segmentRecordCount === 0 && args.segmentCandidateCount === 0) return;
  if (args.tenantKeys.length !== 1) {
    throw new Error("Segment writes require one declared tenant and one dataset manifest per job.");
  }
  const tenantKey = args.tenantKeys[0];
  const manifestId = args.manifestId?.trim();
  if (!manifestId || !/^[a-z0-9][a-z0-9-]*$/.test(manifestId)) {
    throw new Error("Segment write refused: a safe dataset manifest ID is required.");
  }
  const manifestPath = path.join(args.repoRoot, "docs/governance/dataset-manifests", `${manifestId}.json`);
  const raw: unknown = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  const result = validateManifest(raw);
  if (!result.ok) {
    throw new Error(`Segment write refused: invalid dataset manifest (${result.errors.join("; ")}).`);
  }
  const manifest = raw as DatasetManifest;
  const expectedSourceBasis = segmentSourceBasis(args.repoRoot, tenantKey);
  if (
    manifest.dataset_id !== manifestId ||
    manifest.tenant_scope !== "canonical_tenant" ||
    manifest.client_key !== tenantKey ||
    manifest.source_layer !== "tenant_context" ||
    manifest.ingestion_method !== "operator_aca_job" ||
    manifest.retrieval_proof_required !== true ||
    manifest.expected_object_count !== args.segmentObjectCount ||
    manifest.source_basis !== expectedSourceBasis
  ) {
    throw new Error("Segment write refused: manifest scope, source hashes, or object count do not match the build.");
  }
}
