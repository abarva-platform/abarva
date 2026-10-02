#!/usr/bin/env tsx

/** Build a shadow Home projection from admitted canonical rows, never from the source pack. */

import { createHash } from "node:crypto";
import { rm } from "node:fs/promises";
import path from "node:path";
import { resolveLoadApproval } from "../../src/lib/governance/dataset-manifest";
import { isDirectInvocation } from "../exec/cli-entry.mjs";
import {
  generatePack,
  loadBinding,
  readDatasetManifests,
  type GeneratedPack,
} from "./load_synthetic_enterprise_v1";
import {
  applySqlLimits,
  blobProofStore,
  boundedStore,
  commitTransaction,
  connectDatabase,
  jobLimits,
  jobRecord,
  jobRun,
  pinnedRunBlobPath,
  proofBytes,
  sqlTimeout,
  type JobClient,
  type JobDatabase,
  type JobLimits,
  type JobRun,
  type ProofStore,
} from "./synthetic_enterprise_home_job";
import {
  buildSyntheticHomeRows,
  persistedProjectedRow,
  projectedRowsHash,
  type CanonicalHomeObject,
  type PersistedHomeRow,
  type SyntheticHomeRow,
} from "./synthetic_enterprise_home_rows";

const jobName = "ecl-synthetic-enterprise-v2-project";
const surface = "home_enterprise_landscape";
const version = 1;

function hash(value: unknown): string {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

function stableUuid(...parts: string[]): string {
  const bytes = Buffer.from(
    createHash("sha256").update(parts.join("|")).digest("hex").slice(0, 32),
    "hex",
  );
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = bytes.toString("hex");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

export type ReadbackProof = {
  status: string;
  tenant_scope: string;
  assessment_id: string;
  source_set_hash: string;
  client_attestation_state: string;
  expected_home_projection?: string;
  actual: Record<string, number>;
  content?: Record<string, unknown>;
};

/**
 * The readback proof a projection run presents must be a passed readback of
 * this exact assessment and source set, taken while no Home projection of it
 * existed, and one that compared content: a proof that only counted rows does
 * not carry a `content` block and is refused.
 */
export function assertReadbackProof(
  readback: ReadbackProof,
  pack: Pick<GeneratedPack, "manifest" | "normalized">,
): void {
  const { manifest, normalized } = pack;
  if (
    readback.status !== "passed" ||
    readback.tenant_scope !== manifest.tenant_key ||
    readback.assessment_id !== manifest.assessment_id ||
    readback.source_set_hash !== manifest.source_set_hash ||
    readback.client_attestation_state !== "not_client_attested" ||
    readback.expected_home_projection !== "absent" ||
    typeof readback.content !== "object" ||
    readback.content === null ||
    readback.actual.applications !==
      normalized.objects.filter((object) => object.type === "application")
        .length ||
    readback.actual.invalid_source_files !== 0 ||
    readback.actual.home_projection_manifests !== 0
  ) {
    throw new Error(
      "Admission readback proof did not authorize this projection",
    );
  }
}

async function insertBatch(
  db: JobDatabase,
  table: string,
  columns: readonly [string, string][],
  rows: Record<string, unknown>[],
): Promise<void> {
  const names = columns.map(([name]) => name).join(", ");
  const types = columns.map(([name, type]) => `${name} ${type}`).join(", ");
  const values = columns
    .map(([name, type]) => (type === "text" ? name : `${name}::${type}`))
    .join(", ");
  for (let offset = 0; offset < rows.length; offset += 400) {
    await db.query(
      `insert into ${table} (${names}) select ${values} from jsonb_to_recordset($1::jsonb) as item(${types})`,
      [JSON.stringify(rows.slice(offset, offset + 400))],
    );
  }
}

/** The canonical rows are no longer what the independent readback proved. */
class ProjectionDrift extends Error {}

type PlannedProjection = {
  rows: SyntheticHomeRow[];
  snapshotId: string;
  manifestId: string;
  projectionHash: string;
  projectedRowsHash: string;
  rowTypes: Record<string, number>;
  validation: Record<string, unknown>;
};

const requiredFamilies: Record<string, number> = {
  enterprise_profile: 1,
  application: 344,
  contract: 230,
  business_segment: 3,
  business_function: 14,
  program: 24,
  metric: 36,
};

/** What a projection of the canonical rows, as they are now, writes. It reads and changes nothing. */
async function planProjection(
  db: JobDatabase,
  pack: GeneratedPack,
): Promise<PlannedProjection> {
  const { manifest, normalized } = pack;
  const catalog = await db.query<{
    source_owner: string;
    file_name: string;
    file_hash: string;
  }>(
    `
      select source_owner, file_name, file_hash from ecl_source.source_file
      where tenant_key = $1 and assessment_id = $2 and quality_state = 'accepted'
        and metadata_json->>'source_set_hash' = $3
    `,
    [manifest.tenant_key, manifest.assessment_id, manifest.source_set_hash],
  );
  const expectedFiles = new Map(
    manifest.files.map((file) => [
      `${file.source_room_family}/${path.basename(file.file_path)}`,
      file.sha256,
    ]),
  );
  if (
    catalog.rows.length !== expectedFiles.size ||
    catalog.rows.some(
      (row) =>
        expectedFiles.get(`${row.source_owner}/${row.file_name}`) !==
        row.file_hash,
    )
  ) {
    throw new ProjectionDrift(
      "Canonical source catalog drifted after independent readback",
    );
  }
  const canonical = await db.query<CanonicalHomeObject>(
    `
      select id::text, object_key, object_type, display_name,
        source_record_id::text, value_state, attributes_json
      from ecl_context.object where tenant_key = $1 and assessment_id = $2
    `,
    [manifest.tenant_key, manifest.assessment_id],
  );
  if (canonical.rows.length !== normalized.objects.length) {
    throw new ProjectionDrift(
      "Canonical object count changed after independent readback",
    );
  }
  const rows = buildSyntheticHomeRows(canonical.rows);
  const rowTypes: Record<string, number> = {};
  for (const row of rows) {
    rowTypes[row.row_type] = (rowTypes[row.row_type] ?? 0) + 1;
  }
  if (
    Object.entries(requiredFamilies).some(
      ([type, expected]) => (rowTypes[type] ?? 0) !== expected,
    )
  ) {
    throw new ProjectionDrift(
      "Home projection lost a required canonical family",
    );
  }
  return {
    rows,
    snapshotId: stableUuid(
      "synthetic-home-snapshot",
      manifest.assessment_id,
      manifest.source_set_hash,
    ),
    manifestId: stableUuid(
      "synthetic-home-manifest",
      manifest.assessment_id,
      manifest.source_set_hash,
    ),
    projectionHash: hash(rows.map((row) => row.source_hash)),
    projectedRowsHash: projectedRowsHash(rows),
    rowTypes,
    validation: {
      accepted_source_files: catalog.rows.length,
      canonical_objects: canonical.rows.length,
      projected_rows: rows.length,
      source_links: rows.length,
      required_families: requiredFamilies,
    },
  };
}

/**
 * Whether the projection already committed for this assessment is the one this
 * run writes: the same snapshot and manifest, made from the same readback, with
 * the same hashes, row count and stamps, and holding the same rows field for
 * field. When it is, the location its manifest recorded for its proof and the
 * run that wrote it are returned. Any difference returns null.
 */
async function ownCommittedProjection(
  db: JobDatabase,
  pack: GeneratedPack,
  planned: PlannedProjection,
  readbackUri: string,
): Promise<{ proofUri: string; writtenByRun: string } | null> {
  const scope = [pack.manifest.tenant_key, pack.manifest.assessment_id];
  const manifests = await db.query<{
    id: string;
    snapshot_id: string;
    projection_version: number;
    source_hash: string;
    projection_hash: string;
    row_count: number;
    quality_state: string;
    admission_status: string;
    proof_uri: string;
  }>(
    `select id::text, snapshot_id::text, projection_version, source_hash,
            projection_hash, row_count, quality_state, admission_status, proof_uri
     from ecl_projection.projection_manifest
     where tenant_key = $1 and assessment_id = $2 and projection_key = $3`,
    [...scope, surface],
  );
  const committed = manifests.rows[0];
  if (
    manifests.rows.length !== 1 ||
    committed.id !== planned.manifestId ||
    committed.snapshot_id !== planned.snapshotId ||
    committed.projection_version !== version ||
    committed.source_hash !== pack.manifest.source_set_hash ||
    committed.projection_hash !== planned.projectionHash ||
    committed.row_count !== planned.rows.length ||
    committed.quality_state !== "warning" ||
    committed.admission_status !== "not_applicable"
  ) {
    return null;
  }
  const snapshots = await db.query<{
    created_by_job: string;
    proof_uri: string;
    source_hash: string;
    context_hash: string;
  }>(
    `select created_by_job, proof_uri, source_hash, context_hash
     from ecl_context.snapshot
     where tenant_key = $1 and assessment_id = $2 and id = $3`,
    [...scope, planned.snapshotId],
  );
  const snapshot = snapshots.rows[0];
  if (
    !snapshot ||
    snapshot.proof_uri !== readbackUri ||
    snapshot.source_hash !== pack.manifest.source_set_hash ||
    snapshot.context_hash !== planned.projectionHash
  ) {
    return null;
  }
  const persisted = await db.query<
    PersistedHomeRow & {
      projection_manifest_id: string;
      projection_version: number;
      quality_state: string;
      admission_status: string;
    }
  >(
    `select page_key, row_key, row_type, section_key, title, summary,
            primary_object_id::text, source_refs_json, source_hash, value_state,
            display_payload_json, projection_manifest_id::text,
            projection_version, quality_state, admission_status
     from ecl_projection.home_enterprise_landscape
     where tenant_key = $1 and assessment_id = $2`,
    scope,
  );
  if (
    persisted.rows.length !== planned.rows.length ||
    persisted.rows.some(
      (row) =>
        row.projection_manifest_id !== planned.manifestId ||
        row.projection_version !== version ||
        row.quality_state !== "passed" ||
        row.admission_status !== "not_applicable",
    ) ||
    projectedRowsHash(persisted.rows.map(persistedProjectedRow)) !==
      planned.projectedRowsHash
  ) {
    return null;
  }
  const linked = await db.query<{ entries: string; links: string }>(
    `select (select count(*) from ecl_projection.projection_entry
        where tenant_key = $1 and assessment_id = $2) as entries,
       (select count(*) from ecl_projection.projection_entry_source_record_ref
        where tenant_key = $1 and assessment_id = $2) as links`,
    scope,
  );
  if (
    Number(linked.rows[0].entries) !== planned.rows.length ||
    Number(linked.rows[0].links) !== planned.rows.length
  ) {
    return null;
  }
  return {
    proofUri: committed.proof_uri,
    writtenByRun: snapshot.created_by_job,
  };
}

/**
 * Writes the shadow Home projection of one loaded assessment, in one
 * transaction held to the job's statement and lock limits.
 *
 * An assessment that already holds a Home projection is refused as occupied,
 * with one exception: a run that finds exactly the projection it writes, made
 * from the readback it presents, wrote nothing new and reports
 * `already_projected`, so a run that committed and then lost its proof can be
 * run again. The proof location returned is always the one the committed
 * manifest records.
 */
export async function writeShadowHomeProjection(
  db: JobDatabase,
  pack: GeneratedPack,
  readbackUri: string,
  runId: string,
  projectionProofUri: string,
  limits: JobLimits = jobLimits(),
): Promise<Record<string, unknown>> {
  const { manifest } = pack;
  const proofCore = (
    planned: PlannedProjection,
    outcome: "projected" | "already_projected",
    recorded: { proofUri: string; writtenByRun: string },
  ): Record<string, unknown> => ({
    job_name: jobName,
    run_id: runId,
    assessment_id: manifest.assessment_id,
    source_set_hash: manifest.source_set_hash,
    readback_proof_uri: readbackUri,
    projection_manifest_id: planned.manifestId,
    projection_version: version,
    projection_hash: planned.projectionHash,
    projected_rows_hash: planned.projectedRowsHash,
    rows: planned.rows.length,
    source_linked_rows: planned.rows.length,
    row_types: planned.rowTypes,
    client_attestation_state: "not_client_attested",
    serving_state: "shadow_not_promoted",
    outcome,
    projection_proof_uri: recorded.proofUri,
    projection_written_by_run: recorded.writtenByRun,
    validation: planned.validation,
    quality_gate: {
      manifest_quality_state: "warning",
      snapshot_quality_state: "warning",
      row_quality_state: "passed",
      admission_status: "not_applicable",
    },
    status: "passed",
  });
  let committing = false;
  await db.query("begin isolation level serializable");
  try {
    await applySqlLimits(db, limits);
    const occupied = await db.query<{ n: string }>(
      `
      select (select count(*) from ecl_projection.projection_manifest
        where tenant_key = $1 and assessment_id = $2 and projection_key = $3)
        + (select count(*) from ecl_projection.home_enterprise_landscape
        where tenant_key = $1 and assessment_id = $2) as n
    `,
      [manifest.tenant_key, manifest.assessment_id, surface],
    );
    if (Number(occupied.rows[0].n) !== 0) {
      let own: Awaited<ReturnType<typeof ownCommittedProjection>> = null;
      let planned: PlannedProjection | null = null;
      try {
        planned = await planProjection(db, pack);
        own = await ownCommittedProjection(db, pack, planned, readbackUri);
      } catch (error) {
        // Rows that drifted cannot be this run's projection either.
        if (!(error instanceof ProjectionDrift)) throw error;
      }
      if (!planned || !own) {
        throw new Error("Refusing occupied Home projection");
      }
      await db.query("commit");
      return proofCore(planned, "already_projected", own);
    }
    const planned = await planProjection(db, pack);
    const { rows, snapshotId, manifestId, projectionHash } = planned;
    await db.query(
      `insert into ecl_context.snapshot
      (id, tenant_key, assessment_id, snapshot_key, snapshot_type, source_hash,
       context_hash, created_by_job, quality_state, proof_uri)
      values ($1,$2,$3,$4,'projection_source',$5,$6,$7,'warning',$8)`,
      [
        snapshotId,
        manifest.tenant_key,
        manifest.assessment_id,
        `synthetic-home-${manifest.source_set_hash}`,
        manifest.source_set_hash,
        projectionHash,
        runId,
        readbackUri,
      ],
    );
    await db.query(
      `insert into ecl_projection.projection_manifest
      (id, tenant_key, assessment_id, snapshot_id, projection_key, projection_version,
       rebuild_command, source_hash, projection_hash, row_count, quality_state,
       admission_status, proof_uri)
      values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,'warning','not_applicable',$11)`,
      [
        manifestId,
        manifest.tenant_key,
        manifest.assessment_id,
        snapshotId,
        surface,
        version,
        "npm run ecl:synthetic-enterprise-v2:project-job",
        manifest.source_set_hash,
        projectionHash,
        rows.length,
        projectionProofUri,
      ],
    );
    const entryRows = rows.map((row) => {
      const entryId = stableUuid(
        "synthetic-home-entry",
        manifest.assessment_id,
        row.page_key,
        row.row_key,
      );
      return {
        id: entryId,
        tenant_key: manifest.tenant_key,
        assessment_id: manifest.assessment_id,
        snapshot_id: snapshotId,
        projection_manifest_id: manifestId,
        projection_version: version,
        surface_key: surface,
        row_key: row.row_key,
        row_type: row.row_type,
        source_hash: row.source_hash,
        refs_content_hash: hash([row.primary_object_id, row.source_record_id]),
        refs_cache_json: {
          objects: [row.primary_object_id],
          source_records: [row.source_record_id],
        },
        display_cache_json: { page_key: row.page_key, title: row.title },
      };
    });
    await insertBatch(
      db,
      "ecl_projection.projection_entry",
      [
        ["id", "uuid"],
        ["tenant_key", "text"],
        ["assessment_id", "text"],
        ["snapshot_id", "uuid"],
        ["projection_manifest_id", "uuid"],
        ["projection_version", "integer"],
        ["surface_key", "text"],
        ["row_key", "text"],
        ["row_type", "text"],
        ["source_hash", "text"],
        ["refs_content_hash", "text"],
        ["refs_cache_json", "jsonb"],
        ["display_cache_json", "jsonb"],
      ],
      entryRows,
    );
    await insertBatch(
      db,
      "ecl_projection.projection_entry_source_record_ref",
      [
        ["tenant_key", "text"],
        ["assessment_id", "text"],
        ["projection_entry_id", "uuid"],
        ["source_record_id", "uuid"],
        ["ref_role", "text"],
        ["sort_order", "integer"],
        ["source_hash", "text"],
      ],
      rows.map((row, index) => ({
        tenant_key: manifest.tenant_key,
        assessment_id: manifest.assessment_id,
        projection_entry_id: entryRows[index].id,
        source_record_id: row.source_record_id,
        ref_role: "primary_source",
        sort_order: 1,
        source_hash: row.source_hash,
      })),
    );
    await insertBatch(
      db,
      "ecl_projection.home_enterprise_landscape",
      [
        ["id", "uuid"],
        ["tenant_key", "text"],
        ["assessment_id", "text"],
        ["snapshot_id", "uuid"],
        ["projection_manifest_id", "uuid"],
        ["projection_entry_id", "uuid"],
        ["projection_version", "integer"],
        ["page_key", "text"],
        ["row_key", "text"],
        ["section_key", "text"],
        ["row_type", "text"],
        ["title", "text"],
        ["summary", "text"],
        ["primary_object_id", "uuid"],
        ["source_refs_json", "jsonb"],
        ["basis_summary", "text"],
        ["value_state", "text"],
        ["quality_state", "text"],
        ["admission_status", "text"],
        ["display_payload_json", "jsonb"],
        ["source_hash", "text"],
      ],
      rows.map((row, index) => ({
        ...row,
        id: stableUuid(
          "synthetic-home-row",
          manifest.assessment_id,
          row.page_key,
          row.row_key,
        ),
        tenant_key: manifest.tenant_key,
        assessment_id: manifest.assessment_id,
        snapshot_id: snapshotId,
        projection_manifest_id: manifestId,
        projection_entry_id: entryRows[index].id,
        projection_version: version,
        source_refs_json: [{ source_record_id: row.source_record_id }],
        basis_summary: "synthetic_reference_not_client_attested",
        quality_state: "passed",
        admission_status: "not_applicable",
      })),
    );
    const checks = await db.query<{ projected: string; links: string }>(
      `
      select (select count(*) from ecl_projection.home_enterprise_landscape
        where tenant_key = $1 and assessment_id = $2) as projected,
        (select count(*) from ecl_projection.projection_entry_source_record_ref
        where tenant_key = $1 and assessment_id = $2) as links
    `,
      [manifest.tenant_key, manifest.assessment_id],
    );
    if (
      Number(checks.rows[0].projected) !== rows.length ||
      Number(checks.rows[0].links) !== rows.length
    ) {
      throw new Error("Projection/source-link readback failed");
    }
    committing = true;
    await commitTransaction(db, "Projection", "nothing was written");
    return proofCore(planned, "projected", {
      proofUri: projectionProofUri,
      writtenByRun: runId,
    });
  } catch (error) {
    await db.query("rollback").catch(() => undefined);
    // A statement or lock that ran out of time did so inside the transaction,
    // which is now rolled back.
    const limit = committing ? null : sqlTimeout(error);
    if (limit) {
      throw new Error(
        `Projection stopped at its ${limit} timeout; nothing was written`,
        { cause: error },
      );
    }
    throw error;
  }
}

/**
 * A projection is written only for a version whose load the dataset registry
 * approved: a named person's approval for this assessment and source-set hash.
 */
export function assertProjectionApproved(
  manifests: unknown[],
  pack: Pick<GeneratedPack, "manifest" | "normalized">,
): void {
  const decision = resolveLoadApproval(manifests, loadBinding(pack));
  if (!decision.approved) {
    throw new Error(`Projection gate failed: ${decision.reasons.join("; ")}`);
  }
}

/** The tables a projection run writes. Their statistics are refreshed after the run. */
export const PROJECTION_TABLES = [
  "ecl_context.snapshot",
  "ecl_projection.projection_manifest",
  "ecl_projection.projection_entry",
  "ecl_projection.projection_entry_source_record_ref",
  "ecl_projection.home_enterprise_landscape",
] as const;

export type StatisticsRefresh = {
  table: string;
  analyzed: boolean;
  detail: string | null;
};

/**
 * Refreshes the planner statistics of the tables a projection wrote, one table
 * at a time under the job's limits. The server skips a table the connected
 * role may not analyze and says so in a warning rather than an error, so each
 * table reports whether it was analyzed and what the server said. A table that
 * was skipped, or whose refresh failed, never fails the run: no reader of
 * these rows may depend on the statistics being fresh.
 */
export async function refreshProjectionStatistics(
  db: JobClient,
  limits: JobLimits,
): Promise<StatisticsRefresh[]> {
  const refreshed: StatisticsRefresh[] = [];
  for (const table of PROJECTION_TABLES) {
    const said: string[] = [];
    const hear = (notice: { message?: string }) => {
      said.push(notice.message ?? "");
    };
    db.on("notice", hear);
    try {
      await db.query("begin");
      await applySqlLimits(db, limits);
      await db.query(`analyze ${table}`);
      await db.query("commit");
      refreshed.push({
        table,
        analyzed: said.length === 0,
        detail: said.join("; ") || null,
      });
    } catch (error) {
      await db.query("rollback").catch(() => undefined);
      refreshed.push({
        table,
        analyzed: false,
        detail: error instanceof Error ? error.message : String(error),
      });
    } finally {
      db.removeListener("notice", hear);
    }
  }
  return refreshed;
}

export type ProjectionSettings = {
  databaseUrl: string;
  account: string;
  identity: string;
  readbackUri: string;
  inputSourceVersion: string | undefined;
  idempotencyKey: string | undefined;
  run: JobRun;
  limits: JobLimits;
};

/** Every binding a run needs, checked before anything is generated or opened. */
export function projectionSettings(
  env: Record<string, string | undefined>,
): ProjectionSettings {
  const databaseUrl = env.DATABASE_URL;
  const account = env.AZURE_STORAGE_ACCOUNT_NAME;
  const identity = env.ECL_SYNTHETIC_STORAGE_IDENTITY_CLIENT_ID;
  const readbackUri = env.ECL_SYNTHETIC_READBACK_PROOF_URI;
  if (
    !databaseUrl ||
    !env.ECL_SYNTHETIC_RUN_ID ||
    !account ||
    !identity ||
    !readbackUri ||
    env.ECL_SYNTHETIC_LAB_APPROVAL !== "accepted_lab" ||
    !env.ECL_SYNTHETIC_IMAGE_DIGEST
  ) {
    throw new Error(
      "Projection requires approved synthetic job, pinned image and readback proof bindings",
    );
  }
  return {
    databaseUrl,
    account,
    identity,
    readbackUri,
    inputSourceVersion: env.ECL_SYNTHETIC_INPUT_SOURCE_VERSION,
    idempotencyKey: env.ECL_SYNTHETIC_IDEMPOTENCY_KEY,
    run: jobRun(env, jobName),
    limits: jobLimits(env),
  };
}

/** Everything a run touches outside this module, so a test can stand in for it. */
export type ProjectionRuntime = {
  generate: () => Promise<GeneratedPack>;
  dispose: (pack: GeneratedPack) => Promise<void>;
  manifests: () => Promise<unknown[]>;
  connect: (databaseUrl: string) => Promise<JobClient>;
  store: (settings: ProjectionSettings) => Promise<ProofStore>;
  report: (line: string) => void;
  fail: (error: unknown) => void;
};

const productionRuntime: ProjectionRuntime = {
  generate: () => generatePack("v2"),
  dispose: (pack) => rm(pack.dir, { recursive: true, force: true }),
  manifests: () => readDatasetManifests(),
  connect: connectDatabase,
  store: (settings) =>
    blobProofStore(settings.account, settings.identity, settings.limits),
  report: (line) => {
    process.stdout.write(`${line}\n`);
  },
  fail: (error) => {
    console.error(error);
  },
};

/**
 * One projection run, start to finish. It returns the process exit code and
 * never throws. The rows are committed before the proof is written, so a run
 * whose proof write fails ends non-zero and says, on stdout, that the
 * projection is committed and its proof is missing; running the job again with
 * the same readback proof re-emits it.
 */
export async function runProjectionJob(
  env: Record<string, string | undefined>,
  runtime: ProjectionRuntime = productionRuntime,
): Promise<number> {
  try {
    const settings = projectionSettings(env);
    const { run, limits } = settings;
    const pack = await runtime.generate();
    try {
      const { manifest } = pack;
      assertProjectionApproved(await runtime.manifests(), pack);
      const prefix = `${manifest.tenant_key}/${manifest.assessment_id}/${manifest.source_set_hash}`;
      const pinned = (uri: unknown, fileName: string) =>
        pinnedRunBlobPath(uri, { account: settings.account, prefix, fileName });
      if (!pinned(settings.readbackUri, "readback.json")) {
        throw new Error("Readback proof URI is outside the pinned source set");
      }
      const store = boundedStore(await runtime.store(settings), limits);
      const readback = JSON.parse(
        (await store.read(settings.readbackUri)).toString("utf8"),
      ) as ReadbackProof;
      assertReadbackProof(readback, pack);
      if (settings.inputSourceVersion !== manifest.source_set_hash) {
        throw new Error("Projection source version is not pinned");
      }
      const idempotencyKey = `${manifest.assessment_id}:${manifest.source_set_hash}`;
      if (settings.idempotencyKey !== idempotencyKey) {
        throw new Error(
          "Projection idempotency key does not name this assessment and source set",
        );
      }
      const db = await runtime.connect(settings.databaseUrl);
      try {
        const core = await writeShadowHomeProjection(
          db,
          pack,
          settings.readbackUri,
          run.runId,
          store.uriFor(`${prefix}/runs/${run.runId}/projection-proof.json`),
          limits,
        );
        // A committed projection's proof belongs where its manifest says it is.
        const proofUri = String(core.projection_proof_uri);
        const proofPath = pinned(proofUri, "projection-proof.json");
        if (!proofPath) throw new Error("Refusing occupied Home projection");
        const proof = {
          ...core,
          ...jobRecord(run, {
            tenantScope: manifest.tenant_key,
            inputSourceVersion: manifest.source_set_hash,
            idempotencyKey,
            status: "passed",
            proofUri,
            limits,
          }),
        };
        const reported = { ...proof, proof_uri: proofUri };
        let written: { created: boolean };
        try {
          written = await store.writeOnce(proofPath, proofBytes(proof));
          if (!written.created) {
            const existing = JSON.parse(
              (await store.read(proofUri)).toString("utf8"),
            ) as Record<string, unknown>;
            for (const field of [
              "assessment_id",
              "source_set_hash",
              "projection_hash",
              "rows",
            ]) {
              if (existing[field] !== core[field]) {
                throw new Error(
                  `The proof already at the recorded location states a different ${field}`,
                );
              }
            }
          }
        } catch (error) {
          runtime.fail(error);
          runtime.report(
            JSON.stringify({
              ...reported,
              status: "failed",
              projection: "committed",
              proof: "missing",
              recovery:
                "run the projection job again with the same readback proof to re-emit the proof",
            }),
          );
          return 1;
        }
        runtime.report(
          JSON.stringify({
            ...reported,
            proof_written: written.created,
            statistics: await refreshProjectionStatistics(db, limits),
          }),
        );
        return 0;
      } finally {
        await db.end();
      }
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
  void runProjectionJob(process.env).then((code) => {
    process.exitCode = code;
  });
}
