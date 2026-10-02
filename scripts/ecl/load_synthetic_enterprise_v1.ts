#!/usr/bin/env tsx

/** Governed, new-assessment load for the synthetic enterprise source set. */

import { createHash } from "node:crypto";
import { mkdtemp, readFile, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { BlobServiceClient } from "@azure/storage-blob";
import { ManagedIdentityCredential } from "@azure/identity";
import Papa from "papaparse";
import pg from "pg";
import {
  resolveLoadApproval,
  type LoadApproval,
  type LoadBinding,
} from "../../src/lib/governance/dataset-manifest";
import { isDirectInvocation } from "../exec/cli-entry.mjs";
import {
  resolveSourceVersion,
  type GrainOrigin,
  type SourceVersion,
} from "./synthetic_source_versions";

const root = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);
const manifestsDir = path.join(root, "docs/governance/dataset-manifests");
const containerName = "ecl-synthetic-intake";
const batchSize = 400;

export type SourceFile = {
  source_room_family: string;
  file_path: string;
  row_count: number;
  sha256: string;
};

type SourceRef = { source_family: string; source_row_id: string };
type CanonicalObject = {
  id: string;
  type: string;
  name: string;
  attributes: Record<string, string>;
  source_as_of: string;
  provenance_class: string;
  client_attestation_state: string;
  source: SourceRef;
};
type CanonicalEdge = {
  id: string;
  from_object_id: string;
  to_object_id: string;
  type: string;
  native_type: string;
  source_as_of: string;
  provenance_class: string;
  declaration_source: SourceRef;
  source_refs: SourceRef[];
};
type Manifest = {
  dataset_id: string;
  tenant_key: string;
  assessment_id: string;
  as_of: string;
  source_set_hash: string;
  client_attestation_state: string;
  files: SourceFile[];
};
type Normalized = {
  adapter_contract_version: string;
  dataset_id: string;
  source_set_hash: string;
  tenant_key: string;
  assessment_id: string;
  client_attestation_state: string;
  objects: CanonicalObject[];
  relationships: CanonicalEdge[];
  unresolved_relationships: CanonicalEdge[];
  quality: {
    object_count: number;
    relationship_count: number;
    unresolved_relationship_count: number;
  };
};
export type GeneratedPack = {
  dir: string;
  manifest: Manifest;
  normalized: Normalized;
  /** The registered source version this pack was generated as. */
  source: SourceVersion;
};

function sha256(value: Buffer | string): string {
  return createHash("sha256").update(value).digest("hex");
}

function stableUuid(...parts: string[]): string {
  const bytes = Buffer.from(sha256(parts.join("|")).slice(0, 32), "hex");
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = bytes.toString("hex");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

type IdentifiedPack = Pick<GeneratedPack, "manifest" | "source">;

/**
 * A persisted row id. Its first part is the id namespace the registry declares
 * for the source version, so an id never depends on how a dataset is named.
 */
function id(pack: IdentifiedPack, kind: string, nativeId: string): string {
  return stableUuid(
    pack.source.id_namespace,
    pack.manifest.tenant_key,
    pack.manifest.assessment_id,
    kind,
    nativeId,
  );
}

/**
 * A generated pack and its adapter output must be the dataset, the assessment
 * and the adapter contract the registry declares for the requested version.
 */
export function assertRegisteredIdentity(
  source: SourceVersion,
  manifest: Pick<Manifest, "dataset_id" | "assessment_id">,
  normalized: Pick<
    Normalized,
    "dataset_id" | "assessment_id" | "adapter_contract_version"
  >,
): void {
  if (
    manifest.dataset_id !== source.dataset_id ||
    normalized.dataset_id !== source.dataset_id ||
    manifest.assessment_id !== source.assessment_id ||
    normalized.assessment_id !== source.assessment_id ||
    normalized.adapter_contract_version !== source.adapter_contract_version
  ) {
    throw new Error(
      `Generated pack is not the registered source version ${source.key}`,
    );
  }
}

function rowsFromCsv(value: string): Record<string, string>[] {
  const parsed = Papa.parse<Record<string, string>>(value, {
    header: true,
    skipEmptyLines: "greedy",
  });
  if (parsed.errors.length)
    throw new Error(`Invalid source CSV: ${parsed.errors[0].message}`);
  return parsed.data;
}

export async function generatePack(
  version: string = "v1",
): Promise<GeneratedPack> {
  // Fails closed on a version the registry does not list, before anything runs.
  const source = resolveSourceVersion(version);
  const dir = await mkdtemp(path.join(tmpdir(), "ecl-enterprise-pack-"));
  const packDir = path.join(dir, "pack");
  const adapterDir = path.join(dir, "adapter");
  try {
    for (const args of [
      [
        "scripts/ecl/generate_synthetic_enterprise_v1.py",
        "--source-version",
        source.key,
        "--out-dir",
        packDir,
      ],
      [
        "scripts/ecl/normalize_synthetic_enterprise_v1.py",
        "--pack",
        packDir,
        "--source-version",
        source.key,
        "--out-dir",
        adapterDir,
      ],
    ]) {
      const result = spawnSync("python3", args, {
        cwd: root,
        encoding: "utf8",
      });
      if (result.status !== 0) {
        // A process that never started has no output; say why it did not start.
        throw new Error(
          `${args[0]} failed: ${result.error?.message || result.stderr || result.stdout}`,
        );
      }
    }
    return await readGeneratedPack(dir, source);
  } catch (error) {
    await rm(dir, { recursive: true, force: true });
    throw error;
  }
}

/**
 * Reads the pack and adapter output a generation left in `dir`, and refuses
 * them unless they are the source version the caller resolved.
 */
export async function readGeneratedPack(
  dir: string,
  source: SourceVersion,
): Promise<GeneratedPack> {
  const manifest = JSON.parse(
    await readFile(path.join(dir, "pack", "enterprise_manifest.json"), "utf8"),
  ) as Manifest;
  const normalized = JSON.parse(
    await readFile(
      path.join(dir, "adapter", "normalized_enterprise.json"),
      "utf8",
    ),
  ) as Normalized;
  assertRegisteredIdentity(source, manifest, normalized);
  if (
    manifest.source_set_hash !== normalized.source_set_hash ||
    manifest.tenant_key !== normalized.tenant_key ||
    manifest.client_attestation_state !== "not_client_attested" ||
    normalized.client_attestation_state !== "not_client_attested" ||
    manifest.files.length !== 22 ||
    normalized.unresolved_relationships.length !== 1
  ) {
    throw new Error(
      "Source pack and Layer 2 adapter did not agree on the pinned synthetic contract",
    );
  }
  return { dir, manifest, normalized, source };
}

export async function sourceRows(
  pack: GeneratedPack,
): Promise<Map<string, Record<string, string>[]>> {
  const result = new Map<string, Record<string, string>[]>();
  for (const file of pack.manifest.files) {
    const bytes = await readFile(path.join(pack.dir, "pack", file.file_path));
    if (sha256(bytes) !== file.sha256)
      throw new Error(`Source file hash drift: ${file.source_room_family}`);
    const rows = rowsFromCsv(bytes.toString("utf8"));
    if (
      rows.length !== file.row_count ||
      rows.some((row) => !row.source_row_id)
    ) {
      throw new Error(
        `Source row count or identity drift: ${file.source_room_family}`,
      );
    }
    if (new Set(rows.map((row) => row.source_row_id)).size !== rows.length) {
      throw new Error(
        `Duplicate source row identity: ${file.source_room_family}`,
      );
    }
    result.set(file.source_room_family, rows);
  }
  return result;
}

/** Every manifest in the dataset registry, parsed. An unreadable one stops the load. */
export async function readDatasetManifests(
  dir: string = manifestsDir,
): Promise<unknown[]> {
  const names = (await readdir(dir))
    .filter((name) => name.endsWith(".json") && !name.startsWith("_"))
    .sort();
  const manifests: unknown[] = [];
  for (const name of names) {
    try {
      manifests.push(JSON.parse(await readFile(path.join(dir, name), "utf8")));
    } catch {
      throw new Error(`Unreadable dataset manifest: ${name}`);
    }
  }
  return manifests;
}

export function loadBinding(
  pack: Pick<GeneratedPack, "manifest" | "normalized">,
): LoadBinding {
  return {
    dataset_id: pack.manifest.dataset_id,
    tenant_key: pack.manifest.tenant_key,
    assessment_id: pack.manifest.assessment_id,
    source_set_hash: pack.manifest.source_set_hash,
    object_count: pack.normalized.objects.length,
    ingestion_method: "operator_aca_job",
  };
}

const requiredBindings = [
  "DATABASE_URL",
  "ECL_SYNTHETIC_RUN_ID",
  "ECL_SYNTHETIC_OPERATOR_IDENTITY",
  "ECL_SYNTHETIC_BUILD_VERSION",
  "ECL_SYNTHETIC_INPUT_SOURCE_VERSION",
  "ECL_SYNTHETIC_IDEMPOTENCY_KEY",
  "ECL_SYNTHETIC_IMAGE_DIGEST",
  "ECL_SYNTHETIC_RELEASE_RECORD",
];

/**
 * Every gate an executing run must pass, decided before anything is written.
 * The job's own bindings can only restate what the dataset registry already
 * approved: a named person's load approval for this assessment and this
 * source-set hash, and the release record that approval names.
 */
export function resolveExecutionBinding(
  pack: Pick<GeneratedPack, "manifest" | "normalized">,
  env: Record<string, string | undefined>,
  manifests: unknown[],
): { runId: string; approval: LoadApproval } {
  const missing = requiredBindings.filter((key) => !env[key]);
  if (missing.length)
    throw new Error(`Missing governed job bindings: ${missing.join(", ")}`);
  const storageAccount = env.AZURE_STORAGE_ACCOUNT_NAME;
  if (
    !env.AZURE_STORAGE_CONNECTION_STRING &&
    (!storageAccount || !env.ECL_SYNTHETIC_STORAGE_IDENTITY_CLIENT_ID)
  ) {
    throw new Error(
      "Blob storage requires a connection string or an explicit account and managed identity",
    );
  }
  if (storageAccount && !/^[a-z0-9]{3,24}$/.test(storageAccount)) {
    throw new Error("Invalid Azure storage account name");
  }
  if (
    env.ECL_SYNTHETIC_LAB_APPROVAL !== "accepted_lab" ||
    env.ECL_SYNTHETIC_INPUT_SOURCE_VERSION !== pack.manifest.source_set_hash ||
    env.ECL_SYNTHETIC_IDEMPOTENCY_KEY !==
      `${pack.manifest.assessment_id}:${pack.manifest.source_set_hash}` ||
    !env.ECL_SYNTHETIC_IMAGE_DIGEST?.includes("@sha256:")
  ) {
    throw new Error(
      "Synthetic review, source version, idempotency, or digest gate failed",
    );
  }
  const decision = resolveLoadApproval(manifests, loadBinding(pack));
  if (!decision.approved) {
    throw new Error(
      `Load approval gate failed: ${decision.reasons.join("; ")}`,
    );
  }
  if (env.ECL_SYNTHETIC_RELEASE_RECORD !== decision.approval.release_record) {
    throw new Error(
      "The release record bound to this run is not the one the load approval names",
    );
  }
  const runId = env.ECL_SYNTHETIC_RUN_ID!;
  if (!/^[a-zA-Z0-9][a-zA-Z0-9_-]{0,79}$/.test(runId))
    throw new Error("Unsafe run id");
  return { runId, approval: decision.approval };
}

/**
 * Runs staged work, reporting each stage as it starts. A failure is recorded
 * against the stage it reached, then rethrown; a failure to record it never
 * replaces the error that caused it.
 */
export async function runStages<T>(
  report: (stage: string, status: string) => Promise<void>,
  work: (enter: (stage: string) => Promise<void>) => Promise<T>,
): Promise<T> {
  let stage = "not_started";
  try {
    return await work(async (next) => {
      stage = next;
      await report(next, "running");
    });
  } catch (error) {
    await report(stage, "failed").catch(() => undefined);
    throw error;
  }
}

async function insertBatch(
  client: pg.Client,
  table: string,
  columns: string[],
  rows: Record<string, unknown>[],
): Promise<void> {
  const uuidColumns = new Set([
    "id",
    "source_file_id",
    "source_record_id",
    "from_object_id",
    "to_object_id",
  ]);
  for (let offset = 0; offset < rows.length; offset += batchSize) {
    const batch = rows.slice(offset, offset + batchSize);
    const fields = columns.join(", ");
    const types = columns
      .map(
        (column) =>
          `${column} ${column.endsWith("_json") ? "jsonb" : column === "row_number" ? "integer" : "text"}`,
      )
      .join(", ");
    const select = columns
      .map((column) =>
        uuidColumns.has(column)
          ? `${column}::uuid`
          : column === "source_date"
            ? `${column}::date`
            : column,
      )
      .join(", ");
    await client.query(
      `insert into ${table} (${fields}) select ${select} from jsonb_to_recordset($1::jsonb) as row(${types})`,
      [JSON.stringify(batch)],
    );
  }
}

function valueState(object: CanonicalObject): string {
  if (object.type === "evidence_request") return "unknown";
  if (object.attributes.definition_state === "conflict") return "conflicting";
  if (object.attributes.value_claim_status === "unsupported_hypothesis")
    return "estimated";
  return "known";
}

const applicationTypes = new Set(["application", "application_module"]);

/**
 * How an application-family row came to exist: the origin the registry declares
 * for the grain the row itself declares. Null for every other object type. It
 * is never read from a name, and a grain the registry does not list is refused.
 */
export function applicationGrainOrigin(
  object: Pick<CanonicalObject, "id" | "type" | "attributes">,
  source: Pick<SourceVersion, "key" | "application_grain_origin">,
): GrainOrigin | null {
  if (!applicationTypes.has(object.type)) return null;
  const grain = object.attributes.application_grain;
  if (!grain || !Object.hasOwn(source.application_grain_origin, grain)) {
    throw new Error(
      `Application row ${object.id} carries a grain source version ${source.key} does not register`,
    );
  }
  return source.application_grain_origin[grain];
}

function objectBasis(
  object: CanonicalObject,
  source: Pick<SourceVersion, "key" | "application_grain_origin">,
): string {
  if (
    object.type === "leadership_observation" &&
    object.attributes.response_basis === "modelled"
  ) {
    return "model_inferred";
  }
  // A row the generator multiplied out by formula was computed, not recorded.
  return applicationGrainOrigin(object, source) === "generated_by_formula"
    ? "calculated"
    : "source_recorded";
}

/** The depth of logical applications the serving check asks for. */
export const APPLICATION_DEPTH_TARGET = 300;

export type ApplicationDepth = {
  depth_target: number;
  /** Applications the definition names. */
  declared_applications: number;
  /** Application rows the generator multiplied out by formula. */
  generated_applications: number;
  /** Modules of an application; never an application. */
  application_modules: number;
  applications_by_grain: Record<string, number>;
  /** Only declared applications count toward the target. */
  counted_toward_target: number;
  serving_eligible: boolean;
  serving_blockers: string[];
};

/**
 * Application depth by declared grain. Whether generated rows may count toward
 * the target is a product decision this code does not make: it counts only
 * declared applications, and when the target is reached only by adding
 * generated rows it says exactly that.
 */
export function applicationDepth(
  objects: readonly Pick<CanonicalObject, "id" | "type" | "attributes">[],
  source: Pick<SourceVersion, "key" | "application_grain_origin">,
): ApplicationDepth {
  let declared = 0;
  let generated = 0;
  let modules = 0;
  const byGrain: Record<string, number> = {};
  for (const object of objects) {
    const origin = applicationGrainOrigin(object, source);
    if (origin === null) continue;
    const grain = object.attributes.application_grain;
    byGrain[grain] = (byGrain[grain] ?? 0) + 1;
    if (object.type === "application_module") modules += 1;
    else if (origin === "declared_in_definition") declared += 1;
    else generated += 1;
  }
  const blockers =
    declared >= APPLICATION_DEPTH_TARGET
      ? []
      : declared + generated >= APPLICATION_DEPTH_TARGET
        ? ["logical_application_depth_met_only_with_generated_rows"]
        : [`logical_application_depth_below_${APPLICATION_DEPTH_TARGET}`];
  return {
    depth_target: APPLICATION_DEPTH_TARGET,
    declared_applications: declared,
    generated_applications: generated,
    application_modules: modules,
    applications_by_grain: byGrain,
    counted_toward_target: declared,
    serving_eligible: blockers.length === 0,
    serving_blockers: blockers,
  };
}

/** The job name a load of this source version records. */
export function loadJobName(source: Pick<SourceVersion, "key">): string {
  return `ecl-synthetic-enterprise-${source.key}-load`;
}

/** What the quality-gate output of a committed load states. */
export function qualityGate(
  pack: Pick<GeneratedPack, "manifest" | "normalized" | "source">,
  proof: Record<string, unknown>,
): Record<string, unknown> {
  const depth = applicationDepth(pack.normalized.objects, pack.source);
  return {
    load_integrity_pass: true,
    serving_eligible: depth.serving_eligible,
    serving_blockers: depth.serving_blockers,
    application_depth: depth,
    counts: proof.counts,
    unresolved_relationships: proof.unresolved_relationships,
    serving_state: "not_promoted",
    client_attestation_state: pack.manifest.client_attestation_state,
  };
}

type LoadRun = { runId: string; startedAt: string };

/** What a run records about the stage it has reached. */
export function progressRecord(
  pack: Pick<GeneratedPack, "manifest" | "source">,
  run: LoadRun,
  stage: string,
  status: string,
): Record<string, unknown> {
  return {
    job_name: loadJobName(pack.source),
    run_id: run.runId,
    tenant_scope: pack.manifest.tenant_key,
    assessment_id: pack.manifest.assessment_id,
    input_source_version: pack.manifest.source_set_hash,
    stage,
    status,
    started_at: run.startedAt,
    updated_at: new Date().toISOString(),
  };
}

/**
 * The proof of a committed load: what the load read back, the depth facts, and
 * what the run was. `outputs` is the Blob location the run writes under.
 */
export function loadProof(
  pack: Pick<GeneratedPack, "manifest" | "normalized" | "source">,
  committed: Record<string, unknown>,
  run: LoadRun,
  env: Record<string, string | undefined>,
  outputs: string,
): Record<string, unknown> {
  const gate = qualityGate(pack, committed);
  return {
    ...committed,
    serving_eligible: gate.serving_eligible,
    application_depth: gate.application_depth,
    job_name: loadJobName(pack.source),
    run_id: run.runId,
    operator_identity: env.ECL_SYNTHETIC_OPERATOR_IDENTITY,
    build_version: env.ECL_SYNTHETIC_BUILD_VERSION,
    input_source_version: env.ECL_SYNTHETIC_INPUT_SOURCE_VERSION,
    idempotency_key: env.ECL_SYNTHETIC_IDEMPOTENCY_KEY,
    image_digest: env.ECL_SYNTHETIC_IMAGE_DIGEST,
    release_record: env.ECL_SYNTHETIC_RELEASE_RECORD,
    retry_count: Number(env.ECL_SYNTHETIC_RETRY_COUNT ?? "0"),
    timeout_seconds: Number(env.ECL_SYNTHETIC_TIMEOUT_SECONDS ?? "1800"),
    status: "succeeded",
    started_at: run.startedAt,
    finished_at: new Date().toISOString(),
    blob_proof_bundle: `${outputs}/proof.json`,
    validation_output: `${outputs}/validation.json`,
    quality_gate_output: `${outputs}/quality-gate.json`,
    progress_output: `${outputs}/progress.json`,
  };
}

/** The columns each load writes, in insert order. The readback compares the same ones. */
export const loadColumns = {
  source_file: [
    "id",
    "source_type",
    "origin",
    "source_owner",
    "file_name",
    "blob_uri",
    "file_hash",
    "source_date",
    "access_class",
    "quality_state",
    "metadata_json",
  ],
  source_record: [
    "id",
    "source_file_id",
    "native_id",
    "record_type",
    "row_number",
    "payload_json",
    "parse_state",
    "parse_notes",
  ],
  object: [
    "id",
    "object_key",
    "object_type",
    "display_name",
    "lifecycle_state",
    "source_record_id",
    "basis",
    "value_state",
    "review_state",
    "attributes_json",
  ],
  relationship: [
    "id",
    "from_object_id",
    "relationship_type",
    "to_object_id",
    "source_record_id",
    "basis",
    "value_state",
    "review_state",
    "attributes_json",
  ],
} as const;

export type LoadTable = keyof typeof loadColumns;
export type LoadRow = Record<string, unknown> & { id: string };
export type LoadRows = Record<LoadTable, LoadRow[]>;

/**
 * Every row a load of this pack writes, from the pack alone. The loader inserts
 * these rows; the readback compares what is persisted against them. `approval`
 * is recorded on the source files when the caller has one.
 */
export function buildLoadRows(
  pack: Pick<GeneratedPack, "manifest" | "normalized" | "source">,
  nativeRows: Map<string, Record<string, string>[]>,
  blobUris: Map<string, string>,
  approval?: Pick<
    LoadApproval,
    "approved_by" | "approved_at" | "release_record"
  >,
): LoadRows {
  const { manifest, normalized, source } = pack;
  const sourceFileRows = manifest.files.map((file) => ({
    id: id(pack, "source_file", file.source_room_family),
    source_type: "synthetic_source_room",
    origin: "synthetic_generator",
    source_owner: file.source_room_family,
    file_name: path.basename(file.file_path),
    blob_uri: blobUris.get(file.source_room_family),
    file_hash: file.sha256,
    source_date: manifest.as_of,
    access_class: "internal",
    quality_state: "accepted",
    metadata_json: {
      dataset_id: manifest.dataset_id,
      source_set_hash: manifest.source_set_hash,
      client_attestation_state: manifest.client_attestation_state,
      synthetic_review_state: "accepted_lab",
      ...(approval
        ? {
            load_approval: {
              approved_by: approval.approved_by,
              approved_at: approval.approved_at,
              release_record: approval.release_record,
            },
          }
        : {}),
    },
  }));
  const sourceRecordRows = manifest.files.flatMap((file) =>
    (nativeRows.get(file.source_room_family) ?? []).map((row, index) => ({
      id: id(
        pack,
        "source_record",
        `${file.source_room_family}/${row.source_row_id}`,
      ),
      source_file_id: id(pack, "source_file", file.source_room_family),
      native_id: row.source_row_id,
      record_type: file.source_room_family,
      row_number: index + 1,
      payload_json: row,
      parse_state: "parsed",
      parse_notes: "synthetic_reference_not_client_attested",
    })),
  );
  const objectRows = normalized.objects.map((object) => ({
    id: id(pack, "object", object.id),
    object_key: object.id,
    object_type: object.type,
    display_name: object.name,
    lifecycle_state:
      object.type === "external_benchmark" ? "benchmark" : "current",
    source_record_id: id(
      pack,
      "source_record",
      `${object.source.source_family}/${object.source.source_row_id}`,
    ),
    basis: objectBasis(object, source),
    value_state: valueState(object),
    // Approving a load is not reviewing its rows.
    review_state: "not_reviewed",
    attributes_json: {
      ...object.attributes,
      source_as_of: object.source_as_of,
      provenance_class: object.provenance_class,
      client_attestation_state: object.client_attestation_state,
      source: object.source,
      synthetic_review_state: "accepted_lab",
    },
  }));
  const relationshipRows = normalized.relationships.map((edge) => ({
    id: id(pack, "relationship", edge.id),
    from_object_id: id(pack, "object", edge.from_object_id),
    to_object_id: id(pack, "object", edge.to_object_id),
    relationship_type: edge.type,
    source_record_id: id(
      pack,
      "source_record",
      `${edge.declaration_source.source_family}/${edge.declaration_source.source_row_id}`,
    ),
    basis: "source_recorded",
    value_state: "known",
    review_state: "not_reviewed",
    attributes_json: {
      native_relationship_id: edge.id,
      native_type: edge.native_type,
      source_as_of: edge.source_as_of,
      provenance_class: edge.provenance_class,
      client_attestation_state: manifest.client_attestation_state,
      source_refs: edge.source_refs,
      synthetic_review_state: "accepted_lab",
    },
  }));
  return {
    source_file: sourceFileRows,
    source_record: sourceRecordRows,
    object: objectRows,
    relationship: relationshipRows,
  };
}

export async function loadIntoNewAssessment(
  connectionString: string,
  pack: GeneratedPack,
  blobUris: Map<string, string>,
  approval: LoadApproval,
): Promise<Record<string, unknown>> {
  const { manifest, normalized } = pack;
  if (
    approval.assessment_id !== manifest.assessment_id ||
    approval.source_set_hash !== manifest.source_set_hash
  ) {
    throw new Error(
      "Load approval does not bind this assessment and source-set hash",
    );
  }
  const nativeRows = await sourceRows(pack);
  const rows = buildLoadRows(pack, nativeRows, blobUris, approval);
  if (rows.source_file.some((row) => !row.blob_uri))
    throw new Error("Every source file needs an immutable Blob URI");
  const client = new pg.Client({ connectionString });
  await client.connect();
  try {
    await client.query("begin isolation level serializable");
    const occupied = await client.query<{
      source_files: string;
      objects: string;
      relationships: string;
    }>(
      `
      select
        (select count(*) from ecl_source.source_file where tenant_key = $1 and assessment_id = $2) as source_files,
        (select count(*) from ecl_context.object where tenant_key = $1 and assessment_id = $2) as objects,
        (select count(*) from ecl_context.relationship where tenant_key = $1 and assessment_id = $2) as relationships
    `,
      [manifest.tenant_key, manifest.assessment_id],
    );
    if (Object.values(occupied.rows[0]).some((count) => Number(count) !== 0)) {
      throw new Error(
        "Refusing to load an assessment that already contains source or canonical rows",
      );
    }
    const catalog = await client.query<{ object_type: string }>(
      "select object_type from ecl_context.object_type_catalog",
    );
    const knownTypes = new Set(catalog.rows.map((row) => row.object_type));
    const missingTypes = [
      ...new Set(rows.object.map((row) => String(row.object_type))),
    ].filter((type) => !knownTypes.has(type));
    if (missingTypes.length)
      throw new Error(
        `Physical admission migration is missing types: ${missingTypes.join(", ")}`,
      );
    for (const [table, kind] of [
      ["ecl_source.source_file", "source_file"],
      ["ecl_source.source_record", "source_record"],
      ["ecl_context.object", "object"],
      ["ecl_context.relationship", "relationship"],
    ] as const) {
      const withScope = rows[kind].map((row) => ({
        ...row,
        tenant_key: manifest.tenant_key,
        assessment_id: manifest.assessment_id,
      }));
      await insertBatch(
        client,
        table,
        ["tenant_key", "assessment_id", ...loadColumns[kind]],
        withScope,
      );
    }
    const readback = await client.query<{
      source_files: string;
      source_records: string;
      objects: string;
      relationships: string;
      applications: string;
      application_modules: string;
      missing_object_lineage: string;
      missing_edge_lineage: string;
      missing_source_blob: string;
    }>(
      `
      select
        (select count(*) from ecl_source.source_file where tenant_key = $1 and assessment_id = $2) as source_files,
        (select count(*) from ecl_source.source_record where tenant_key = $1 and assessment_id = $2) as source_records,
        (select count(*) from ecl_context.object where tenant_key = $1 and assessment_id = $2) as objects,
        (select count(*) from ecl_context.relationship where tenant_key = $1 and assessment_id = $2) as relationships,
        (select count(*) from ecl_context.application_v where tenant_key = $1 and assessment_id = $2) as applications,
        (select count(*) from ecl_context.object where tenant_key = $1 and assessment_id = $2 and object_type = 'application_module') as application_modules,
        (select count(*) from ecl_context.object where tenant_key = $1 and assessment_id = $2 and source_record_id is null) as missing_object_lineage,
        (select count(*) from ecl_context.relationship where tenant_key = $1 and assessment_id = $2 and source_record_id is null) as missing_edge_lineage,
        (select count(*) from ecl_source.source_file where tenant_key = $1 and assessment_id = $2 and blob_uri !~ '^https://') as missing_source_blob
    `,
      [manifest.tenant_key, manifest.assessment_id],
    );
    const counts = Object.fromEntries(
      Object.entries(readback.rows[0]).map(([key, value]) => [
        key,
        Number(value),
      ]),
    );
    const expected = {
      source_files: rows.source_file.length,
      source_records: rows.source_record.length,
      objects: rows.object.length,
      relationships: rows.relationship.length,
      applications: rows.object.filter(
        (row) => row.object_type === "application",
      ).length,
      application_modules: rows.object.filter(
        (row) => row.object_type === "application_module",
      ).length,
      missing_object_lineage: 0,
      missing_edge_lineage: 0,
      missing_source_blob: 0,
    };
    if (
      Object.entries(expected).some(([key, value]) => counts[key] !== value)
    ) {
      throw new Error(
        `Canonical readback failed: ${JSON.stringify({ expected, actual: counts })}`,
      );
    }
    await client.query("commit");
    return {
      dataset_id: manifest.dataset_id,
      tenant_key: manifest.tenant_key,
      assessment_id: manifest.assessment_id,
      source_set_hash: manifest.source_set_hash,
      client_attestation_state: manifest.client_attestation_state,
      synthetic_review_state: "accepted_lab",
      load_approval: approval,
      counts,
      unresolved_relationships: normalized.unresolved_relationships.map(
        (edge) => edge.id,
      ),
      serving_state: "not_promoted",
    };
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    await client.end();
  }
}

async function main(): Promise<void> {
  const startedAt = new Date().toISOString();
  const args = process.argv.slice(2);
  if (args.length && !(args.length === 1 && args[0] === "--execute")) {
    throw new Error(
      "Only --execute is supported; absence of it performs a read-only generation check",
    );
  }
  // The registry decides which versions exist; an unlisted one is refused.
  const pack = await generatePack(
    process.env.ECL_SYNTHETIC_DATASET_VERSION ?? "v1",
  );
  try {
    const rows = await sourceRows(pack);
    const summary = {
      source_version: pack.source.key,
      dataset_id: pack.manifest.dataset_id,
      tenant_key: pack.manifest.tenant_key,
      assessment_id: pack.manifest.assessment_id,
      source_set_hash: pack.manifest.source_set_hash,
      source_files: pack.manifest.files.length,
      source_rows: [...rows.values()].reduce(
        (sum, items) => sum + items.length,
        0,
      ),
      objects: pack.normalized.objects.length,
      relationships: pack.normalized.relationships.length,
      unresolved_relationships: pack.normalized.unresolved_relationships.length,
      client_attestation_state: pack.manifest.client_attestation_state,
      application_depth: applicationDepth(pack.normalized.objects, pack.source),
    };
    const manifests = await readDatasetManifests();
    if (!args.length) {
      const decision = resolveLoadApproval(manifests, loadBinding(pack));
      process.stdout.write(
        `${JSON.stringify({
          mode: "read_only",
          ...summary,
          load_approval: decision.approved ? "approved" : "not_approved",
          load_approval_reasons: decision.approved ? [] : decision.reasons,
        })}\n`,
      );
      return;
    }
    const { runId, approval } = resolveExecutionBinding(
      pack,
      process.env,
      manifests,
    );
    const storageConnectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
    const storageAccount = process.env.AZURE_STORAGE_ACCOUNT_NAME;
    const storageIdentity =
      process.env.ECL_SYNTHETIC_STORAGE_IDENTITY_CLIENT_ID;
    const service = storageConnectionString
      ? BlobServiceClient.fromConnectionString(storageConnectionString)
      : new BlobServiceClient(
          `https://${storageAccount}.blob.core.windows.net`,
          new ManagedIdentityCredential({ clientId: storageIdentity! }),
        );
    const container = service.getContainerClient(containerName);
    await container.createIfNotExists();
    const prefix = `${pack.manifest.tenant_key}/${pack.manifest.assessment_id}/${pack.manifest.source_set_hash}`;
    const runPrefix = `${prefix}/runs/${runId}`;
    const uploadImmutable = async (
      blobPath: string,
      bytes: Buffer,
    ): Promise<string> => {
      const blob = container.getBlockBlobClient(blobPath);
      if (await blob.exists()) {
        if (sha256(await blob.downloadToBuffer()) !== sha256(bytes))
          throw new Error(`Blob content drift: ${blobPath}`);
      } else {
        await blob.uploadData(bytes, {
          conditions: { ifNoneMatch: "*" },
          blobHTTPHeaders: { blobContentType: "application/octet-stream" },
          metadata: { sha256: sha256(bytes), synthetic: "true" },
        });
      }
      return blob.url;
    };
    const uploadProgress = async (
      stage: string,
      status: string,
    ): Promise<void> => {
      await container
        .getBlockBlobClient(`${runPrefix}/progress.json`)
        .uploadData(
          Buffer.from(
            JSON.stringify(
              progressRecord(pack, { runId, startedAt }, stage, status),
              null,
              2,
            ),
          ),
          { blobHTTPHeaders: { blobContentType: "application/json" } },
        );
    };
    await runStages(uploadProgress, async (enter) => {
      await enter("validation");
      await uploadImmutable(
        `${runPrefix}/validation.json`,
        Buffer.from(JSON.stringify(summary, null, 2)),
      );
      const blobUris = new Map<string, string>();
      for (const file of pack.manifest.files) {
        const bytes = await readFile(
          path.join(pack.dir, "pack", file.file_path),
        );
        blobUris.set(
          file.source_room_family,
          await uploadImmutable(
            `${prefix}/sources/${file.source_room_family}/${path.basename(file.file_path)}`,
            bytes,
          ),
        );
      }
      await uploadImmutable(
        `${prefix}/enterprise_manifest.json`,
        await readFile(path.join(pack.dir, "pack", "enterprise_manifest.json")),
      );
      await enter("canonical_load");
      const proof = await loadIntoNewAssessment(
        process.env.DATABASE_URL!,
        pack,
        blobUris,
        approval,
      );
      // The rows are committed from here on; a failure below is a proof-output
      // failure and is reported as one.
      await enter("proof_output");
      const result = loadProof(
        pack,
        proof,
        { runId, startedAt },
        process.env,
        `${container.url}/${runPrefix}`,
      );
      await uploadImmutable(
        `${runPrefix}/quality-gate.json`,
        Buffer.from(JSON.stringify(qualityGate(pack, proof), null, 2)),
      );
      await uploadImmutable(
        `${runPrefix}/proof.json`,
        Buffer.from(JSON.stringify(result, null, 2)),
      );
      await uploadProgress("complete", "succeeded");
      process.stdout.write(`${JSON.stringify(result)}\n`);
    });
  } finally {
    await rm(pack.dir, { recursive: true, force: true });
  }
}

// Compares resolved files: a path comparison answers "imported" for a run
// through a symlinked directory, and the job would exit 0 having done nothing.
if (isDirectInvocation(import.meta.url)) {
  main().catch((error: unknown) => {
    process.stderr.write(
      `${error instanceof Error ? error.message : String(error)}\n`,
    );
    process.exitCode = 1;
  });
}
