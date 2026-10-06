import assert from "node:assert/strict";
import { spawnSync, type SpawnSyncReturns } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import {
  mkdir,
  mkdtemp,
  readFile,
  rm,
  symlink,
  unlink,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { CANONICAL_TENANT_KEYS } from "../../../src/config/tenants/CANONICAL_TENANTS";
import type {
  LoadApproval,
  ServingApproval,
} from "../../../src/lib/governance/dataset-manifest";
import type { GeneratedPack } from "../load_synthetic_enterprise_v1";
import {
  PROOF_CONTAINER,
  storeHost,
  type ProofStore,
} from "../synthetic_enterprise_home_job";

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

/** The storage account every fixture run names. Nothing ever contacts it. */
export const STORE_ACCOUNT = "fixturestorage";
export const IMAGE = `registry.invalid/web@sha256:${"e".repeat(64)}`;
export const GIT_SHA = "f".repeat(40);

/** The disposable database the admission workflow provides, and nothing else. */
export function disposableDatabaseUrl(): string {
  const connectionString = process.env.ECL_ADMISSION_TEST_DATABASE_URL ?? "";
  const url = new URL(connectionString);
  assert.ok(["127.0.0.1", "localhost"].includes(url.hostname));
  assert.equal(url.pathname, "/ecl_admission_test");
  return connectionString;
}

/** Where the proofs one workflow step writes are found by the steps after it. */
export function proofDirectory(): string {
  return (
    process.env.ECL_ADMISSION_TEST_PROOF_DIR ??
    path.join(tmpdir(), "ecl-admission-test-proofs")
  );
}

export type FileProofStore = ProofStore & {
  /** The file a blob path is kept in. */
  fileFor: (blobPath: string) => string;
  /** The proof at a blob path, parsed, or null when none was written. */
  proofAt: (blobPath: string) => Promise<Record<string, unknown> | null>;
};

/**
 * A proof store on the filesystem that gives its blobs the URIs the real store
 * gives them and, like it, never overwrites one. `write` stands in for the
 * store's answer to a write: it may throw, as an unreachable store does, or
 * never settle.
 */
export function fileProofStore(
  dir: string,
  write: (blobPath: string) => Promise<void> = async () => undefined,
): FileProofStore {
  const base = `https://${storeHost(STORE_ACCOUNT)}/${PROOF_CONTAINER}/`;
  const fileFor = (blobPath: string) => path.join(dir, ...blobPath.split("/"));
  return {
    fileFor,
    proofAt: async (blobPath) =>
      existsSync(fileFor(blobPath))
        ? JSON.parse(await readFile(fileFor(blobPath), "utf8"))
        : null,
    uriFor: (blobPath) => `${base}${blobPath}`,
    read: async (uri) => {
      if (!uri.startsWith(base)) throw new Error(`no such blob: ${uri}`);
      return readFile(fileFor(uri.slice(base.length)));
    },
    writeOnce: async (blobPath, bytes) => {
      await write(blobPath);
      const file = fileFor(blobPath);
      await mkdir(path.dirname(file), { recursive: true });
      try {
        await writeFile(file, bytes, { flag: "wx" });
        return { uri: `${base}${blobPath}`, created: true };
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== "EEXIST") throw error;
        return { uri: `${base}${blobPath}`, created: false };
      }
    },
  };
}

/** Every binding a Home job run carries for a pack, with `over` applied last. */
export function homeJobEnv(
  pack: Pick<GeneratedPack, "manifest">,
  over: Record<string, string | undefined> = {},
): Record<string, string | undefined> {
  return {
    DATABASE_URL: process.env.ECL_ADMISSION_TEST_DATABASE_URL,
    AZURE_STORAGE_ACCOUNT_NAME: STORE_ACCOUNT,
    ECL_SYNTHETIC_STORAGE_IDENTITY_CLIENT_ID:
      "00000000-0000-0000-0000-000000000000",
    ECL_SYNTHETIC_RUN_ID: "run-fixture-1",
    ECL_SYNTHETIC_LAB_APPROVAL: "accepted_lab",
    ECL_SYNTHETIC_IMAGE_DIGEST: IMAGE,
    ABARVA_OPERATOR_IMAGE: IMAGE,
    ABARVA_OPERATOR_BRANCH_COMMIT: GIT_SHA,
    ECL_SYNTHETIC_OPERATOR_IDENTITY: "fixture-operator",
    ECL_SYNTHETIC_BUILD_VERSION: "build-fixture-1",
    ECL_SYNTHETIC_RELEASE_RECORD: RELEASE_RECORD,
    ECL_SYNTHETIC_INPUT_SOURCE_VERSION: pack.manifest.source_set_hash,
    ECL_SYNTHETIC_IDEMPOTENCY_KEY: `${pack.manifest.assessment_id}:${pack.manifest.source_set_hash}`,
    ...over,
  };
}

/**
 * The dataset registry as it is, with the fixture approvals a test needs added
 * to the one manifest that declares this pack. The registry itself records no
 * approval for it, so a test that needs one states it here.
 */
export function registryWithApprovals(
  manifests: unknown[],
  pack: Pick<GeneratedPack, "manifest">,
  approvals: { serving: boolean },
): unknown[] {
  const version = {
    assessment_id: pack.manifest.assessment_id,
    source_set_hash: pack.manifest.source_set_hash,
  };
  return manifests.map((raw) =>
    (raw as { dataset_id?: unknown }).dataset_id === pack.manifest.dataset_id
      ? {
          ...(raw as Record<string, unknown>),
          load_approval: approval(version),
          ...(approvals.serving
            ? { serving_approval: servingApproval(version) }
            : {}),
        }
      : raw,
  );
}

/** The fields the data-build job rule requires every proof to carry. */
export const JOB_RULE_FIELDS = [
  "job_name",
  "run_id",
  "tenant_scope",
  "build_version",
  "input_source_version",
  "idempotency_key",
  "started_at",
  "finished_at",
  "operator_identity",
  "git_sha",
  "image_digest",
  "status",
  "blob_proof_bundle",
  "validation_output",
  "quality_gate_output",
  "release_record",
] as const;

/** A proof names every field the rule requires, and holds the two sections its locations point at. */
export function assertJobRuleFields(
  proof: Record<string, unknown> | null | undefined,
  expected: { job_name: string; run_id: string; status: string },
): void {
  assert.ok(proof, "the proof was written");
  for (const field of JOB_RULE_FIELDS) {
    assert.ok(
      typeof proof[field] === "string" && proof[field] !== "",
      `the proof carries ${field}`,
    );
  }
  assert.equal(proof.job_name, expected.job_name);
  assert.equal(proof.run_id, expected.run_id);
  assert.equal(proof.status, expected.status);
  assert.equal(proof.operator_identity, "fixture-operator");
  assert.equal(proof.build_version, "build-fixture-1");
  assert.equal(proof.git_sha, GIT_SHA);
  assert.equal(proof.image_digest, IMAGE);
  assert.equal(proof.release_record, RELEASE_RECORD);
  assert.equal(
    proof.validation_output,
    `${proof.blob_proof_bundle}#/validation`,
  );
  assert.equal(
    proof.quality_gate_output,
    `${proof.blob_proof_bundle}#/quality_gate`,
  );
  assert.equal(typeof proof.validation, "object");
  assert.equal(typeof proof.quality_gate, "object");
  assert.ok(
    Date.parse(String(proof.started_at)) <=
      Date.parse(String(proof.finished_at)),
  );
}

const WORKFLOW_PATH = ".github/workflows/ecl-physical-admission.yml";

/** Every repository file this process has loaded as a module so far. */
export function loadedRepoFiles(): string[] {
  return Object.keys(require.cache)
    .filter(
      (file) =>
        file.startsWith(`${REPO_ROOT}${path.sep}`) &&
        !file.includes(`${path.sep}node_modules${path.sep}`),
    )
    .map((file) => path.relative(REPO_ROOT, file).split(path.sep).join("/"))
    .sort();
}

/**
 * The admission workflow runs only when a path it names changes, so a file a
 * step loads and the workflow does not name can change that step's result
 * without the step being run. The modules this process loaded are therefore
 * checked against the workflow here, with the files it reads at run time,
 * which no module list shows, named by the caller.
 */
export function assertWorkflowTriggersCover(readAtRunTime: string[]): void {
  const workflow = readFileSync(path.join(REPO_ROOT, WORKFLOW_PATH), "utf8");
  const block = workflow.slice(
    workflow.indexOf("    paths:"),
    workflow.indexOf("  workflow_dispatch:"),
  );
  const triggers = [...block.matchAll(/^\s+- "([^"]+)"$/gm)].map((m) => m[1]);
  assert.ok(triggers.length > 0, "the workflow declares trigger paths");
  const loaded = loadedRepoFiles();
  assert.ok(
    loaded.some((file) => file.startsWith("scripts/ecl/")),
    "the loaded modules of this process can be listed",
  );
  const covered = (file: string) =>
    triggers.some((trigger) =>
      trigger.endsWith("/**")
        ? file.startsWith(trigger.slice(0, -2))
        : trigger === file,
    );
  assert.deepEqual(
    [...loaded, ...readAtRunTime].filter((file) => !covered(file)),
    [],
    `${WORKFLOW_PATH} does not trigger on files this step loads or reads`,
  );
  assert.deepEqual(
    triggers.filter(
      (trigger) =>
        !trigger.endsWith("/**") && !existsSync(path.join(REPO_ROOT, trigger)),
    ),
    [],
    `${WORKFLOW_PATH} names paths that do not exist`,
  );
}
