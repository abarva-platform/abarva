import { spawnSync, type SpawnSyncReturns } from "node:child_process";
import { mkdtemp, rm, symlink, unlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { CANONICAL_TENANT_KEYS } from "../../../src/config/tenants/CANONICAL_TENANTS";
import type {
  LoadApproval,
  ServingApproval,
} from "../../../src/lib/governance/dataset-manifest";
import type { GeneratedPack } from "../load_synthetic_enterprise_v1";

/** Shared fixtures for the synthetic enterprise job gate tests. Not a test file. */

export const TENANT = CANONICAL_TENANT_KEYS[0];
export const ASSESSMENT = "assessment-fixture-enterprise-v1";
export const HASH = "c".repeat(64);
export const OTHER_HASH = "d".repeat(64);
export const RELEASE_RECORD =
  "docs/releases/records/2026-01-01-fixture-load.md";
export const REPO_ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../..",
);

export function fixturePack(objectCount = 3): GeneratedPack {
  return {
    dir: path.join(tmpdir(), "ecl-load-gate-fixture-does-not-exist"),
    manifest: {
      dataset_id: "FIXTURE_ENTERPRISE_V1",
      tenant_key: TENANT,
      assessment_id: ASSESSMENT,
      as_of: "2026-01-01",
      source_set_hash: HASH,
      client_attestation_state: "not_client_attested",
      files: [],
    },
    normalized: {
      adapter_contract_version: "fixture-enterprise/layer2/v1",
      dataset_id: "FIXTURE_ENTERPRISE_V1",
      source_set_hash: HASH,
      tenant_key: TENANT,
      assessment_id: ASSESSMENT,
      client_attestation_state: "not_client_attested",
      objects: Array.from({ length: objectCount }, (_, index) => ({
        id: `OBJ-${index}`,
        type: "application",
        name: `Fixture object ${index}`,
        attributes: {},
        source_as_of: "2026-01-01",
        provenance_class: "synthetic",
        client_attestation_state: "not_client_attested",
        source: { source_family: "fixture", source_row_id: `ROW-${index}` },
      })),
      relationships: [],
      unresolved_relationships: [],
      quality: {
        object_count: objectCount,
        relationship_count: 0,
        unresolved_relationship_count: 0,
      },
    },
    source: {
      key: "fixture",
      definition_path: "datasets/synthetic/fixture/definition.json",
      base_version: null,
      dataset_id: "FIXTURE_ENTERPRISE_V1",
      assessment_id: ASSESSMENT,
      id_namespace: "ecl-fixture-enterprise",
      adapter_contract_version: "fixture-enterprise/layer2/v1",
      source_system: "fixture_enterprise_generator",
      application_grain_origin: { fixture_product: "declared_in_definition" },
    },
  };
}

export function approval(over: Partial<LoadApproval> = {}): LoadApproval {
  return {
    approved_by: "Jordan Rivera",
    approved_at: "2026-01-01",
    assessment_id: ASSESSMENT,
    source_set_hash: HASH,
    release_record: RELEASE_RECORD,
    ...over,
  };
}

export function servingApproval(
  over: Partial<ServingApproval> = {},
): ServingApproval {
  return { ...approval(), approved_at: "2026-01-02", surface: "home", ...over };
}

export function registryManifest(
  over: Record<string, unknown> = {},
): Record<string, unknown> {
  return {
    dataset_id: "FIXTURE_ENTERPRISE_V1",
    title: "Fixture enterprise source set",
    client_key: TENANT,
    tenant_scope: "canonical_tenant",
    source_layer: "tenant_context",
    classification: "internal",
    owner: "fixture owner",
    source_basis: "deterministic fixture definition",
    ingestion_method: "operator_aca_job",
    retrieval_plan: "postgres_fts",
    retrieval_proof_required: true,
    pii_phi_handling: null,
    expected_object_count: 3,
    approved_by: "fixture owner",
    approved_at: "2026-01-01",
    load_approval: approval(),
    notes: null,
    ...over,
  };
}

/** The current environment with every job binding removed, plus `set`. */
export function jobProcessEnv(
  set: Record<string, string> = {},
): NodeJS.ProcessEnv {
  const env = { ...process.env };
  for (const key of Object.keys(env)) {
    if (
      key === "DATABASE_URL" ||
      key === "ABARVA_OPERATOR_IMAGE" ||
      key.startsWith("ECL_SYNTHETIC_") ||
      key.startsWith("AZURE_STORAGE_")
    ) {
      delete env[key];
    }
  }
  return { ...env, ...set };
}

export function runScript(
  cwd: string,
  args: string[],
  env: NodeJS.ProcessEnv,
): SpawnSyncReturns<string> {
  return spawnSync(process.execPath, ["--import", "tsx", ...args], {
    cwd,
    env,
    encoding: "utf8",
  });
}

/**
 * Starts one job script three ways: imported by a file whose own path contains
 * the script's name, run directly, and run through a symlink to the checkout.
 */
export async function startThreeWays(
  script: string,
  args: string[] = [],
  env: NodeJS.ProcessEnv = jobProcessEnv(),
): Promise<
  Record<"imported" | "direct" | "throughLink", SpawnSyncReturns<string>>
> {
  const scratch = await mkdtemp(path.join(tmpdir(), "ecl-job-entry-"));
  const linkedRoot = path.join(scratch, "linked-root");
  let linked = false;
  try {
    const importer = path.join(
      scratch,
      `imports-${path.basename(script).replace(/\.ts$/, "")}.mjs`,
    );
    await writeFile(
      importer,
      'await import(process.argv[2]);\nconsole.log("imported without running");\n',
    );
    const imported = runScript(
      REPO_ROOT,
      [importer, pathToFileURL(path.join(REPO_ROOT, script)).href, ...args],
      env,
    );
    const direct = runScript(REPO_ROOT, [script, ...args], env);
    await symlink(REPO_ROOT, linkedRoot, "dir");
    linked = true;
    const throughLink = runScript(
      linkedRoot,
      [path.join(linkedRoot, script), ...args],
      env,
    );
    return { imported, direct, throughLink };
  } finally {
    // Remove the link itself before the directory that holds it.
    if (linked) await unlink(linkedRoot);
    await rm(scratch, { recursive: true, force: true });
  }
}
