#!/usr/bin/env tsx

/**
 * Post-commit, read-only content check of the versioned synthetic enterprise.
 *
 * It regenerates the source pack, builds the rows a load of that pack writes,
 * and compares them with what is persisted: every source file, source record,
 * object and relationship, column by column, plus the bytes of each source blob.
 * The expectation comes from the loader's own row builder, so this proves the
 * database and storage still hold what a load of this pack writes. It is not a
 * second derivation of the pack.
 */

import { createHash } from "node:crypto";
import { rm } from "node:fs/promises";
import path from "node:path";
import { BlobServiceClient } from "@azure/storage-blob";
import { ManagedIdentityCredential } from "@azure/identity";
import pg from "pg";
import { isDirectInvocation } from "../exec/cli-entry.mjs";
import {
  buildLoadRows,
  generatePack,
  loadColumns,
  sourceRows,
  type GeneratedPack,
  type LoadRow,
  type LoadTable,
  type SourceFile,
} from "./load_synthetic_enterprise_v1";

const jobName = "ecl-synthetic-enterprise-v2-readback";
const containerName = "ecl-synthetic-intake";
const homeProjectionKey = "home_enterprise_landscape";
const sampleSize = 3;

type CountRow = Record<string, string>;

export function admissionIssues(
  actual: Record<string, number>,
  expected: Record<string, number>,
): string[] {
  return [...new Set([...Object.keys(expected), ...Object.keys(actual)])]
    .map((key) => [key, expected[key]] as const)
    .filter(([key, value]) => actual[key] !== value)
    .map(
      ([key, value]) =>
        `${key}: expected ${value}, read ${actual[key] ?? "missing"}`,
    );
}

/** Whether a Home projection of this assessment is expected to exist already. */
export const HOME_PROJECTION_STATES = ["absent", "present"] as const;
export type HomeProjectionState = (typeof HOME_PROJECTION_STATES)[number];

/** What a run records about itself, as the data-build job rule requires. */
export type ReadbackBinding = {
  runId: string;
  operatorIdentity: string;
  buildVersion: string;
  imageDigest: string;
  releaseRecord: string;
  /** Stated by the operator: the readback never assumes either state. */
  expectHomeProjection: HomeProjectionState;
};

export type ReadbackSettings = {
  databaseUrl: string;
  account: string;
  identity: string;
  inputSourceVersion: string;
  binding: ReadbackBinding;
};

const governedBindings = [
  "ECL_SYNTHETIC_OPERATOR_IDENTITY",
  "ECL_SYNTHETIC_BUILD_VERSION",
  "ECL_SYNTHETIC_INPUT_SOURCE_VERSION",
  "ECL_SYNTHETIC_IMAGE_DIGEST",
  "ECL_SYNTHETIC_RELEASE_RECORD",
  "ECL_SYNTHETIC_READBACK_EXPECT_HOME_PROJECTION",
] as const;

/** Every binding a run needs, checked before anything is generated or opened. */
export function readbackSettings(
  env: Record<string, string | undefined>,
): ReadbackSettings {
  const databaseUrl = env.DATABASE_URL;
  const runId = env.ECL_SYNTHETIC_RUN_ID;
  const account = env.AZURE_STORAGE_ACCOUNT_NAME;
  const identity = env.ECL_SYNTHETIC_STORAGE_IDENTITY_CLIENT_ID;
  if (!databaseUrl || !runId || !account || !identity) {
    throw new Error(
      "Readback requires database, run ID, storage account and managed identity",
    );
  }
  if (!/^[a-zA-Z0-9][a-zA-Z0-9_-]{0,79}$/.test(runId)) {
    throw new Error("Unsafe run ID");
  }
  if (!/^[a-z0-9]{3,24}$/.test(account)) {
    throw new Error("Invalid Azure storage account name");
  }
  const missing = governedBindings.filter((key) => !env[key]);
  if (missing.length) {
    throw new Error(
      `Missing governed readback bindings: ${missing.join(", ")}`,
    );
  }
  const imageDigest = env.ECL_SYNTHETIC_IMAGE_DIGEST!;
  if (
    !imageDigest.includes("@sha256:") ||
    imageDigest !== env.ABARVA_OPERATOR_IMAGE
  ) {
    throw new Error(
      "Readback image digest must be pinned and be the image the job runs",
    );
  }
  const releaseRecord = env.ECL_SYNTHETIC_RELEASE_RECORD!;
  if (!/^docs\/releases\/records\/[A-Za-z0-9._-]+\.md$/.test(releaseRecord)) {
    throw new Error(
      "Readback release record must be a docs/releases/records/*.md path",
    );
  }
  const expectHomeProjection =
    env.ECL_SYNTHETIC_READBACK_EXPECT_HOME_PROJECTION as HomeProjectionState;
  if (!HOME_PROJECTION_STATES.includes(expectHomeProjection)) {
    throw new Error(
      `Readback must be told whether a Home projection is expected: ${HOME_PROJECTION_STATES.join(" or ")}`,
    );
  }
  return {
    databaseUrl,
    account,
    identity,
    inputSourceVersion: env.ECL_SYNTHETIC_INPUT_SOURCE_VERSION!,
    binding: {
      runId,
      operatorIdentity: env.ECL_SYNTHETIC_OPERATOR_IDENTITY!,
      buildVersion: env.ECL_SYNTHETIC_BUILD_VERSION!,
      imageDigest,
      releaseRecord,
      expectHomeProjection,
    },
  };
}

function sha256(value: Buffer | string): string {
  return createHash("sha256").update(value).digest("hex");
}

/** One spelling for a value, however a JSON object's keys happen to be ordered. */
function canonical(value: unknown): string {
  const ordered = (item: unknown): unknown => {
    if (Array.isArray(item)) return item.map(ordered);
    if (typeof item === "object" && item !== null) {
      return Object.fromEntries(
        Object.entries(item as Record<string, unknown>)
          .filter(([, entry]) => entry !== undefined)
          .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
          .map(([key, entry]) => [key, ordered(entry)]),
      );
    }
    return item ?? null;
  };
  return JSON.stringify(ordered(value));
}

function shown(value: string): string {
  return value.length > 120 ? `${value.slice(0, 117)}...` : value;
}

/** A name a person can find a row by; its id is the fallback. */
const rowLabels: Record<LoadTable, (row: Record<string, unknown>) => unknown> =
  {
    source_file: (row) => row.source_owner,
    source_record: (row) => `${row.record_type}/${row.native_id}`,
    object: (row) => row.object_key,
    relationship: (row) =>
      (row.attributes_json as Record<string, unknown> | null)
        ?.native_relationship_id,
  };

/**
 * The load approval is recorded on a source file by the load that wrote it. It
 * is not part of the pack, so it is left out of the comparison on both sides.
 */
function comparable(table: LoadTable, column: string, value: unknown): unknown {
  if (
    table === "source_file" &&
    column === "metadata_json" &&
    typeof value === "object" &&
    value !== null
  ) {
    return Object.fromEntries(
      Object.entries(value).filter(([key]) => key !== "load_approval"),
    );
  }
  return value;
}

export type TableComparison = {
  expected_rows: number;
  read_rows: number;
  missing_rows: number;
  unexpected_rows: number;
  differing_rows: number;
  differing_fields: Record<string, number>;
};

/**
 * Compare the rows a load writes with the rows that are persisted, by id and
 * then column by column over exactly the columns the loader writes.
 */
export function compareTable(
  table: LoadTable,
  expectedRows: readonly LoadRow[],
  persistedRows: readonly Record<string, unknown>[],
): { comparison: TableComparison; issues: string[] } {
  const label = (row: Record<string, unknown>) =>
    String(rowLabels[table](row) ?? row.id);
  const persisted = new Map(persistedRows.map((row) => [String(row.id), row]));
  const expectedIds = new Set(expectedRows.map((row) => row.id));
  const missing: string[] = [];
  const differing = new Map<string, { count: number; samples: string[] }>();
  let differingRows = 0;
  for (const expected of expectedRows) {
    const actual = persisted.get(expected.id);
    if (!actual) {
      missing.push(label(expected));
      continue;
    }
    let differs = false;
    for (const column of loadColumns[table]) {
      const want = canonical(comparable(table, column, expected[column]));
      const read = canonical(comparable(table, column, actual[column]));
      if (want === read) continue;
      differs = true;
      const field = differing.get(column) ?? { count: 0, samples: [] };
      field.count += 1;
      if (field.samples.length < sampleSize) {
        field.samples.push(
          `${label(expected)}: expected ${shown(want)}, read ${shown(read)}`,
        );
      }
      differing.set(column, field);
    }
    if (differs) differingRows += 1;
  }
  const unexpected = persistedRows
    .filter((row) => !expectedIds.has(String(row.id)))
    .map(label);
  const issues: string[] = [];
  if (missing.length) {
    issues.push(
      `${table}: ${missing.length} of ${expectedRows.length} expected rows are not persisted (e.g. ${missing.slice(0, sampleSize).join(", ")})`,
    );
  }
  if (unexpected.length) {
    issues.push(
      `${table}: ${unexpected.length} persisted rows are not in the pack (e.g. ${unexpected.slice(0, sampleSize).join(", ")})`,
    );
  }
  for (const [column, field] of differing) {
    issues.push(
      `${table}.${column}: ${field.count} rows differ from the pack (e.g. ${field.samples.join("; ")})`,
    );
  }
  return {
    comparison: {
      expected_rows: expectedRows.length,
      read_rows: persistedRows.length,
      missing_rows: missing.length,
      unexpected_rows: unexpected.length,
      differing_rows: differingRows,
      differing_fields: Object.fromEntries(
        [...differing].map(([column, field]) => [column, field.count]),
      ),
    },
    issues,
  };
}

export type ReadbackDatabase = {
  query: <Row extends Record<string, unknown>>(
    sql: string,
    params?: unknown[],
  ) => Promise<{ rows: Row[] }>;
};

export type ReadbackStorage = {
  /** The immutable Blob URI a load of this pack records for a source file. */
  blobUriFor: (file: SourceFile) => string;
  /** The bytes at a Blob URI. It throws when the blob cannot be opened. */
  fetchBlob: (uri: string) => Promise<Buffer>;
};

const persistedTables: Record<LoadTable, string> = {
  source_file: "ecl_source.source_file",
  source_record: "ecl_source.source_record",
  object: "ecl_context.object",
  relationship: "ecl_context.relationship",
};
const readAsText = new Set([
  "id",
  "source_file_id",
  "source_record_id",
  "from_object_id",
  "to_object_id",
  "source_date",
]);

const countsSql = `
  select
    (select count(*) from ecl_source.source_file
      where tenant_key = $1 and assessment_id = $2) as source_files,
    (select count(*) from ecl_source.source_record
      where tenant_key = $1 and assessment_id = $2) as source_records,
    (select count(*) from ecl_context.object
      where tenant_key = $1 and assessment_id = $2) as objects,
    (select count(*) from ecl_context.relationship
      where tenant_key = $1 and assessment_id = $2) as relationships,
    (select count(*) from ecl_context.application_v
      where tenant_key = $1 and assessment_id = $2) as applications,
    (select count(*) from ecl_context.object
      where tenant_key = $1 and assessment_id = $2 and object_type = 'application_module') as application_modules,
    (select count(*) from ecl_context.object
      where tenant_key = $1 and assessment_id = $2 and object_type = 'business_segment') as segments,
    (select count(*) from ecl_context.object
      where tenant_key = $1 and assessment_id = $2 and object_type = 'business_function') as functions,
    (select count(*) from ecl_context.object
      where tenant_key = $1 and assessment_id = $2 and object_type = 'strategic_priority') as priorities,
    (select count(*) from ecl_context.object
      where tenant_key = $1 and assessment_id = $2 and object_type = 'program') as programs,
    (select count(*) from ecl_context.relationship
      where tenant_key = $1 and assessment_id = $2 and relationship_type = 'BELONGS_TO_SEGMENT') as function_segment_edges,
    (select count(*) from ecl_context.relationship
      where tenant_key = $1 and assessment_id = $2 and relationship_type = 'ADVANCES_PRIORITY') as program_priority_edges,
    (select count(*) from ecl_context.object o
      left join ecl_source.source_record r
        on r.tenant_key = o.tenant_key and r.assessment_id = o.assessment_id
       and r.id = o.source_record_id
      where o.tenant_key = $1 and o.assessment_id = $2 and r.id is null) as missing_object_lineage,
    (select count(*) from ecl_context.relationship e
      left join ecl_source.source_record r
        on r.tenant_key = e.tenant_key and r.assessment_id = e.assessment_id
       and r.id = e.source_record_id
      where e.tenant_key = $1 and e.assessment_id = $2 and r.id is null) as missing_edge_lineage,
    (select count(*) from ecl_source.source_file
      where tenant_key = $1 and assessment_id = $2
        and (blob_uri !~ '^https://' or metadata_json->>'source_set_hash' is distinct from $3
          or metadata_json->>'synthetic_review_state' is distinct from 'accepted_lab'
          or quality_state <> 'accepted')) as invalid_source_files,
    (select count(*) from ecl_projection.projection_manifest
      where tenant_key = $1 and assessment_id = $2
        and projection_key = '${homeProjectionKey}') as home_projection_manifests
`;

/**
 * Everything the readback reads, in one read-only snapshot. These are the only
 * statements it issues: `begin ... read only`, one count select, one select per
 * loaded table, and `commit` (or `rollback` when a read fails).
 */
async function readPersisted(
  db: ReadbackDatabase,
  manifest: GeneratedPack["manifest"],
): Promise<{
  actual: Record<string, number>;
  rows: Record<LoadTable, Record<string, unknown>[]>;
}> {
  const scope = [manifest.tenant_key, manifest.assessment_id];
  await db.query("begin transaction isolation level repeatable read read only");
  try {
    const counts = await db.query<CountRow>(countsSql, [
      ...scope,
      manifest.source_set_hash,
    ]);
    const rows = {} as Record<LoadTable, Record<string, unknown>[]>;
    for (const table of Object.keys(persistedTables) as LoadTable[]) {
      const columns = loadColumns[table]
        .map((column) => (readAsText.has(column) ? `${column}::text` : column))
        .join(", ");
      rows[table] = (
        await db.query(
          `select ${columns} from ${persistedTables[table]} where tenant_key = $1 and assessment_id = $2`,
          scope,
        )
      ).rows;
    }
    await db.query("commit");
    return {
      actual: Object.fromEntries(
        Object.entries(counts.rows[0]).map(([key, value]) => [
          key,
          Number(value),
        ]),
      ),
      rows,
    };
  } catch (error) {
    await db.query("rollback").catch(() => undefined);
    throw error;
  }
}

export type ReadbackProof = {
  job_name: string;
  run_id: string;
  tenant_scope: string;
  assessment_id: string;
  source_set_hash: string;
  input_source_version: string;
  client_attestation_state: string;
  operator_identity: string;
  build_version: string;
  image_digest: string;
  release_record: string;
  expected_home_projection: HomeProjectionState;
  started_at: string;
  finished_at: string;
  actual: Record<string, number>;
  expected: Record<string, number>;
  content: Record<LoadTable, TableComparison> & {
    source_blobs: { expected: number; opened: number; matching: number };
  };
  unresolved_relationships: string[];
  status: "passed" | "failed";
  issues: string[];
};

/**
 * Read one loaded assessment back and compare it with the pack. Nothing here
 * writes to the database; the caller decides where the proof goes.
 */
export async function readbackAdmission(
  pack: GeneratedPack,
  binding: ReadbackBinding,
  deps: { db: ReadbackDatabase } & ReadbackStorage,
): Promise<ReadbackProof> {
  const startedAt = new Date().toISOString();
  const { manifest, normalized } = pack;
  const expectedRows = buildLoadRows(
    pack,
    await sourceRows(pack),
    new Map(
      manifest.files.map((file) => [
        file.source_room_family,
        deps.blobUriFor(file),
      ]),
    ),
  );
  const persisted = await readPersisted(deps.db, manifest);

  const expected: Record<string, number> = {
    source_files: expectedRows.source_file.length,
    source_records: expectedRows.source_record.length,
    objects: expectedRows.object.length,
    relationships: expectedRows.relationship.length,
    applications: normalized.objects.filter(
      (object) => object.type === "application",
    ).length,
    application_modules: normalized.objects.filter(
      (object) => object.type === "application_module",
    ).length,
    segments: 3,
    functions: 14,
    priorities: 5,
    programs: 24,
    function_segment_edges: normalized.relationships.filter(
      (edge) => edge.type === "BELONGS_TO_SEGMENT",
    ).length,
    program_priority_edges: normalized.relationships.filter(
      (edge) => edge.type === "ADVANCES_PRIORITY",
    ).length,
    missing_object_lineage: 0,
    missing_edge_lineage: 0,
    invalid_source_files: 0,
    home_projection_manifests:
      binding.expectHomeProjection === "present" ? 1 : 0,
  };
  const issues = admissionIssues(persisted.actual, expected);

  const content = {} as ReadbackProof["content"];
  for (const table of Object.keys(persistedTables) as LoadTable[]) {
    const compared = compareTable(
      table,
      expectedRows[table],
      persisted.rows[table],
    );
    content[table] = compared.comparison;
    issues.push(...compared.issues);
  }

  // The recorded hash is a column the load wrote. The blob is what it points at.
  let opened = 0;
  let matching = 0;
  for (const file of manifest.files) {
    let bytes: Buffer;
    try {
      bytes = await deps.fetchBlob(deps.blobUriFor(file));
    } catch (error) {
      issues.push(
        `source blob could not be opened: ${file.source_room_family}: ${error instanceof Error ? error.message : String(error)}`,
      );
      continue;
    }
    opened += 1;
    if (sha256(bytes) === file.sha256) matching += 1;
    else issues.push(`source blob content drift: ${file.source_room_family}`);
  }
  content.source_blobs = {
    expected: manifest.files.length,
    opened,
    matching,
  };

  return {
    job_name: jobName,
    run_id: binding.runId,
    tenant_scope: manifest.tenant_key,
    assessment_id: manifest.assessment_id,
    source_set_hash: manifest.source_set_hash,
    input_source_version: manifest.source_set_hash,
    client_attestation_state: manifest.client_attestation_state,
    operator_identity: binding.operatorIdentity,
    build_version: binding.buildVersion,
    image_digest: binding.imageDigest,
    release_record: binding.releaseRecord,
    expected_home_projection: binding.expectHomeProjection,
    started_at: startedAt,
    finished_at: new Date().toISOString(),
    actual: persisted.actual,
    expected,
    content,
    unresolved_relationships: normalized.unresolved_relationships.map(
      (edge) => edge.id,
    ),
    status: issues.length ? "failed" : "passed",
    issues,
  };
}

/** The process exit code a proof stands for: zero only when it passed. */
export function exitCodeFor(proof: Pick<ReadbackProof, "status">): number {
  return proof.status === "passed" ? 0 : 1;
}

/** Everything a run touches outside this module, so a test can stand in for it. */
export type ReadbackRuntime = {
  generate: () => Promise<GeneratedPack>;
  dispose: (pack: GeneratedPack) => Promise<void>;
  connect: (
    databaseUrl: string,
  ) => Promise<ReadbackDatabase & { end: () => Promise<void> }>;
  storage: (
    settings: ReadbackSettings,
    pack: GeneratedPack,
  ) => ReadbackStorage & {
    writeProof: (proof: ReadbackProof) => Promise<string>;
  };
  report: (line: string) => void;
  fail: (error: unknown) => void;
};

const productionRuntime: ReadbackRuntime = {
  generate: () => generatePack("v2"),
  dispose: (pack) => rm(pack.dir, { recursive: true, force: true }),
  connect: async (databaseUrl) => {
    const client = new pg.Client({ connectionString: databaseUrl });
    await client.connect();
    return client;
  },
  storage: (settings, pack) => {
    const container = new BlobServiceClient(
      `https://${settings.account}.blob.core.windows.net`,
      new ManagedIdentityCredential({ clientId: settings.identity }),
    ).getContainerClient(containerName);
    const { manifest } = pack;
    const prefix = `${manifest.tenant_key}/${manifest.assessment_id}/${manifest.source_set_hash}`;
    const blobUriFor = (file: SourceFile) =>
      container.getBlockBlobClient(
        `${prefix}/sources/${file.source_room_family}/${path.basename(file.file_path)}`,
      ).url;
    const pinned = new Map(
      manifest.files.map((file) => [
        blobUriFor(file),
        `${prefix}/sources/${file.source_room_family}/${path.basename(file.file_path)}`,
      ]),
    );
    return {
      blobUriFor,
      // Only the pack's own immutable source paths are ever opened.
      fetchBlob: async (uri) => {
        const blobPath = pinned.get(uri);
        if (!blobPath) throw new Error("not a pinned source blob of this pack");
        return container.getBlockBlobClient(blobPath).downloadToBuffer();
      },
      writeProof: async (proof) => {
        const blob = container.getBlockBlobClient(
          `${prefix}/runs/${settings.binding.runId}/readback.json`,
        );
        await blob.uploadData(Buffer.from(JSON.stringify(proof)), {
          conditions: { ifNoneMatch: "*" },
          blobHTTPHeaders: { blobContentType: "application/json" },
        });
        return blob.url;
      },
    };
  },
  report: (line) => {
    process.stdout.write(`${line}\n`);
  },
  fail: (error) => {
    console.error(error);
  },
};

/**
 * One readback run, start to finish. It returns the process exit code and never
 * throws: a refused binding, an unreadable database or blob store, and a failed
 * comparison all end non-zero, and a failed comparison still writes its proof.
 */
export async function runReadbackJob(
  env: Record<string, string | undefined>,
  runtime: ReadbackRuntime = productionRuntime,
): Promise<number> {
  try {
    const settings = readbackSettings(env);
    const pack = await runtime.generate();
    try {
      if (settings.inputSourceVersion !== pack.manifest.source_set_hash) {
        throw new Error("Readback source version is not pinned");
      }
      const storage = runtime.storage(settings, pack);
      const db = await runtime.connect(settings.databaseUrl);
      let proof: ReadbackProof;
      try {
        proof = await readbackAdmission(pack, settings.binding, {
          db,
          blobUriFor: storage.blobUriFor,
          fetchBlob: storage.fetchBlob,
        });
      } finally {
        await db.end();
      }
      const proofUri = await storage.writeProof(proof);
      runtime.report(JSON.stringify({ ...proof, proof_uri: proofUri }));
      return exitCodeFor(proof);
    } finally {
      await runtime.dispose(pack);
    }
  } catch (error) {
    runtime.fail(error);
    return 1;
  }
}

// Compares resolved files: a path comparison answers "imported" for a run
// through a symlinked directory, and the job would exit 0 having done nothing.
if (isDirectInvocation(import.meta.url)) {
  void runReadbackJob(process.env).then((code) => {
    process.exitCode = code;
  });
}
