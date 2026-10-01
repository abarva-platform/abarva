#!/usr/bin/env tsx

/** Governed, new-assessment load for the synthetic enterprise source set. */

import { createHash } from "node:crypto";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { BlobServiceClient } from "@azure/storage-blob";
import Papa from "papaparse";
import pg from "pg";

const root = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);
const definitionPath = path.join(
  root,
  "datasets/synthetic/enterprise-v1/definition.json",
);
const containerName = "ecl-synthetic-intake";
const batchSize = 400;

type SourceFile = {
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

function id(manifest: Manifest, kind: string, nativeId: string): string {
  return stableUuid(
    "ecl-synthetic-enterprise-v1",
    manifest.tenant_key,
    manifest.assessment_id,
    kind,
    nativeId,
  );
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

export async function generatePack(): Promise<GeneratedPack> {
  const dir = await mkdtemp(path.join(tmpdir(), "ecl-enterprise-v1-"));
  const packDir = path.join(dir, "pack");
  const adapterDir = path.join(dir, "adapter");
  try {
    for (const args of [
      [
        "scripts/ecl/generate_synthetic_enterprise_v1.py",
        "--definition",
        definitionPath,
        "--out-dir",
        packDir,
      ],
      [
        "scripts/ecl/normalize_synthetic_enterprise_v1.py",
        "--pack",
        packDir,
        "--out-dir",
        adapterDir,
      ],
    ]) {
      const result = spawnSync("python3", args, {
        cwd: root,
        encoding: "utf8",
      });
      if (result.status !== 0)
        throw new Error(`${args[0]} failed: ${result.stderr || result.stdout}`);
    }
    const manifest = JSON.parse(
      await readFile(path.join(packDir, "enterprise_manifest.json"), "utf8"),
    ) as Manifest;
    const normalized = JSON.parse(
      await readFile(
        path.join(adapterDir, "normalized_enterprise.json"),
        "utf8",
      ),
    ) as Normalized;
    if (
      manifest.source_set_hash !== normalized.source_set_hash ||
      manifest.tenant_key !== normalized.tenant_key ||
      manifest.assessment_id !== normalized.assessment_id ||
      manifest.client_attestation_state !== "not_client_attested" ||
      normalized.client_attestation_state !== "not_client_attested" ||
      manifest.files.length !== 22 ||
      normalized.unresolved_relationships.length !== 1
    ) {
      throw new Error(
        "Source pack and Layer 2 adapter did not agree on the pinned synthetic contract",
      );
    }
    return { dir, manifest, normalized };
  } catch (error) {
    await rm(dir, { recursive: true, force: true });
    throw error;
  }
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

export async function loadIntoNewAssessment(
  connectionString: string,
  pack: GeneratedPack,
  blobUris: Map<string, string>,
): Promise<Record<string, unknown>> {
  const { manifest, normalized } = pack;
  const nativeRows = await sourceRows(pack);
  const expectedSourceRows = [...nativeRows.values()].reduce(
    (sum, rows) => sum + rows.length,
    0,
  );
  const sourceFileRows = manifest.files.map((file) => ({
    id: id(manifest, "source_file", file.source_room_family),
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
    },
  }));
  if (sourceFileRows.some((row) => !row.blob_uri))
    throw new Error("Every source file needs an immutable Blob URI");
  const sourceRecordRows = manifest.files.flatMap((file) =>
    (nativeRows.get(file.source_room_family) ?? []).map((row, index) => ({
      id: id(
        manifest,
        "source_record",
        `${file.source_room_family}/${row.source_row_id}`,
      ),
      source_file_id: id(manifest, "source_file", file.source_room_family),
      native_id: row.source_row_id,
      record_type: file.source_room_family,
      row_number: index + 1,
      payload_json: row,
      parse_state: "parsed",
      parse_notes: "synthetic_reference_not_client_attested",
    })),
  );
  const objectRows = normalized.objects.map((object) => ({
    id: id(manifest, "object", object.id),
    object_key: object.id,
    object_type: object.type,
    display_name: object.name,
    lifecycle_state:
      object.type === "external_benchmark" ? "benchmark" : "current",
    source_record_id: id(
      manifest,
      "source_record",
      `${object.source.source_family}/${object.source.source_row_id}`,
    ),
    basis:
      object.type === "leadership_observation" &&
      object.attributes.response_basis === "modelled"
        ? "model_inferred"
        : "source_recorded",
    value_state: valueState(object),
    review_state: "confirmed",
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
    id: id(manifest, "relationship", edge.id),
    from_object_id: id(manifest, "object", edge.from_object_id),
    to_object_id: id(manifest, "object", edge.to_object_id),
    relationship_type: edge.type,
    source_record_id: id(
      manifest,
      "source_record",
      `${edge.declaration_source.source_family}/${edge.declaration_source.source_row_id}`,
    ),
    basis: "source_recorded",
    value_state: "known",
    review_state: "confirmed",
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
      ...new Set(objectRows.map((row) => row.object_type)),
    ].filter((type) => !knownTypes.has(type));
    if (missingTypes.length)
      throw new Error(
        `Physical admission migration is missing types: ${missingTypes.join(", ")}`,
      );
    for (const [table, columns, rows] of [
      [
        "ecl_source.source_file",
        [
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
        sourceFileRows,
      ],
      [
        "ecl_source.source_record",
        [
          "id",
          "source_file_id",
          "native_id",
          "record_type",
          "row_number",
          "payload_json",
          "parse_state",
          "parse_notes",
        ],
        sourceRecordRows,
      ],
      [
        "ecl_context.object",
        [
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
        objectRows,
      ],
      [
        "ecl_context.relationship",
        [
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
        relationshipRows,
      ],
    ] as const) {
      const withScope = rows.map((row) => ({
        ...row,
        tenant_key: manifest.tenant_key,
        assessment_id: manifest.assessment_id,
      }));
      await insertBatch(
        client,
        table,
        ["tenant_key", "assessment_id", ...columns],
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
      source_files: manifest.files.length,
      source_records: expectedSourceRows,
      objects: objectRows.length,
      relationships: relationshipRows.length,
      applications: objectRows.filter(
        (row) => row.object_type === "application",
      ).length,
      application_modules: objectRows.filter(
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
  const pack = await generatePack();
  try {
    const rows = await sourceRows(pack);
    const summary = {
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
    };
    if (!args.length) {
      process.stdout.write(
        `${JSON.stringify({ mode: "read_only", ...summary })}\n`,
      );
      return;
    }
    const required = [
      "DATABASE_URL",
      "AZURE_STORAGE_CONNECTION_STRING",
      "ECL_SYNTHETIC_RUN_ID",
      "ECL_SYNTHETIC_OPERATOR_IDENTITY",
      "ECL_SYNTHETIC_BUILD_VERSION",
      "ECL_SYNTHETIC_INPUT_SOURCE_VERSION",
      "ECL_SYNTHETIC_IDEMPOTENCY_KEY",
      "ECL_SYNTHETIC_IMAGE_DIGEST",
      "ECL_SYNTHETIC_RELEASE_RECORD",
    ];
    const missing = required.filter((key) => !process.env[key]);
    if (missing.length)
      throw new Error(`Missing governed job bindings: ${missing.join(", ")}`);
    if (
      process.env.ECL_SYNTHETIC_LAB_APPROVAL !== "accepted_lab" ||
      process.env.ECL_SYNTHETIC_INPUT_SOURCE_VERSION !==
        pack.manifest.source_set_hash ||
      process.env.ECL_SYNTHETIC_IDEMPOTENCY_KEY !==
        `${pack.manifest.assessment_id}:${pack.manifest.source_set_hash}` ||
      !process.env.ECL_SYNTHETIC_IMAGE_DIGEST?.includes("@sha256:")
    ) {
      throw new Error(
        "Synthetic review, source version, idempotency, or digest gate failed",
      );
    }
    const runId = process.env.ECL_SYNTHETIC_RUN_ID!;
    if (!/^[a-zA-Z0-9][a-zA-Z0-9_-]{0,79}$/.test(runId))
      throw new Error("Unsafe run id");
    const service = BlobServiceClient.fromConnectionString(
      process.env.AZURE_STORAGE_CONNECTION_STRING!,
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
              {
                job_name: "ecl-synthetic-enterprise-v1-load",
                run_id: runId,
                tenant_scope: pack.manifest.tenant_key,
                assessment_id: pack.manifest.assessment_id,
                input_source_version: pack.manifest.source_set_hash,
                stage,
                status,
                started_at: startedAt,
                updated_at: new Date().toISOString(),
              },
              null,
              2,
            ),
          ),
          { blobHTTPHeaders: { blobContentType: "application/json" } },
        );
    };
    await uploadProgress("validation", "running");
    await uploadImmutable(
      `${runPrefix}/validation.json`,
      Buffer.from(JSON.stringify(summary, null, 2)),
    );
    const blobUris = new Map<string, string>();
    for (const file of pack.manifest.files) {
      const bytes = await readFile(path.join(pack.dir, "pack", file.file_path));
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
    await uploadProgress("canonical_load", "running");
    const proof = await loadIntoNewAssessment(
      process.env.DATABASE_URL!,
      pack,
      blobUris,
    );
    const applicationCount = (proof.counts as Record<string, number>)
      .applications;
    const servingEligible = applicationCount >= 300;
    const result = {
      ...proof,
      serving_eligible: servingEligible,
      job_name: "ecl-synthetic-enterprise-v1-load",
      run_id: runId,
      operator_identity: process.env.ECL_SYNTHETIC_OPERATOR_IDENTITY,
      build_version: process.env.ECL_SYNTHETIC_BUILD_VERSION,
      input_source_version: process.env.ECL_SYNTHETIC_INPUT_SOURCE_VERSION,
      idempotency_key: process.env.ECL_SYNTHETIC_IDEMPOTENCY_KEY,
      image_digest: process.env.ECL_SYNTHETIC_IMAGE_DIGEST,
      release_record: process.env.ECL_SYNTHETIC_RELEASE_RECORD,
      retry_count: Number(process.env.ECL_SYNTHETIC_RETRY_COUNT ?? "0"),
      timeout_seconds: Number(
        process.env.ECL_SYNTHETIC_TIMEOUT_SECONDS ?? "1800",
      ),
      status: "succeeded",
      started_at: startedAt,
      finished_at: new Date().toISOString(),
      blob_proof_bundle: `${container.url}/${runPrefix}/proof.json`,
      validation_output: `${container.url}/${runPrefix}/validation.json`,
      quality_gate_output: `${container.url}/${runPrefix}/quality-gate.json`,
      progress_output: `${container.url}/${runPrefix}/progress.json`,
    };
    await uploadImmutable(
      `${runPrefix}/quality-gate.json`,
      Buffer.from(
        JSON.stringify(
          {
            load_integrity_pass: true,
            serving_eligible: servingEligible,
            serving_blockers: servingEligible
              ? []
              : ["logical_application_depth_below_300"],
            counts: proof.counts,
            unresolved_relationships: proof.unresolved_relationships,
            serving_state: "not_promoted",
            client_attestation_state: pack.manifest.client_attestation_state,
          },
          null,
          2,
        ),
      ),
    );
    await uploadImmutable(
      `${runPrefix}/proof.json`,
      Buffer.from(JSON.stringify(result, null, 2)),
    );
    await uploadProgress("complete", "succeeded");
    process.stdout.write(`${JSON.stringify(result)}\n`);
  } finally {
    await rm(pack.dir, { recursive: true, force: true });
  }
}

if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  main().catch((error: unknown) => {
    process.stderr.write(
      `${error instanceof Error ? error.message : String(error)}\n`,
    );
    process.exitCode = 1;
  });
}
