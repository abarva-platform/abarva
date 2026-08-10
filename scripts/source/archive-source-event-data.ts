import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { Client } from "pg";
import dotenv from "dotenv";

import { postgresClientOptions } from "../../src/scripts/postgres-client-options";

const CONFIRMATION = "ARCHIVE_ALL_SOURCE_EVENTS_DELETE_EVENT_DATA";
const PROOF_BEGIN = "__SEMANTIC2_PROOF_TGZ_BEGIN__";
const PROOF_END = "__SEMANTIC2_PROOF_TGZ_END__";

type EventRow = Record<string, unknown> & {
  id: string;
  client_key: string;
  event_code: string | null;
  lifecycle_state: string | null;
};

type RefColumn = {
  table_schema: string;
  table_name: string;
  column_name: string;
  data_type: string;
  udt_name: string;
};

type TablePlan = {
  schema: string;
  table: string;
  columns: RefColumn[];
};

type BlobLocation = {
  bucket: string;
  path: string;
  artifactId: string;
  source: "blob_container_path" | "blob_uri";
};

function loadEnv() {
  dotenv.config({ path: ".env.local" });
  dotenv.config({ path: ".env" });
}

function databaseUrl(): string {
  const url =
    process.env.DATABASE_URL ||
    process.env.ABARVA_AZURE_DATABASE_URL ||
    process.env.AZURE_DATABASE_URL ||
    process.env.AZURE_LAB_DATABASE_URL ||
    process.env.TARGET_DATABASE_URL;
  if (!url) {
    throw new Error(
      "Missing DATABASE_URL, ABARVA_AZURE_DATABASE_URL, AZURE_DATABASE_URL, AZURE_LAB_DATABASE_URL, or TARGET_DATABASE_URL.",
    );
  }
  return url;
}

function usage() {
  return `Usage:
  npm run ops:source-events:archive-cleanup

Modes:
  dry-run is the default. Set SOURCE_EVENT_CLEANUP_APPLY=true to mutate.

Apply guard:
  SOURCE_EVENT_CLEANUP_CONFIRM=${CONFIRMATION}

Scope:
  SOURCE_EVENT_CLEANUP_EVENT_IDS=<uuid,uuid>  # optional exact event ids
  SOURCE_EVENT_CLEANUP_CLIENT_KEY=<tenant>    # optional tenant scope
  SOURCE_EVENT_CLEANUP_INCLUDE_ARCHIVED=true  # include already archived events

Output:
  SOURCE_EVENT_CLEANUP_OUT_DIR=<dir>          # optional proof/export directory
  EMIT_ACA_PROOF_BUNDLE=true                  # emit tarball in ACA wrapper format
`;
}

function boolEnv(name: string): boolean {
  return process.env[name]?.trim().toLowerCase() === "true";
}

function selectedEventIds(): string[] {
  const raw = process.env.SOURCE_EVENT_CLEANUP_EVENT_IDS?.trim();
  if (!raw) return [];
  return raw
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);
}

function outDir(): string {
  const explicit = process.env.SOURCE_EVENT_CLEANUP_OUT_DIR?.trim();
  if (explicit) return explicit;
  const stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
  return path.join(os.tmpdir(), `source-event-archive-cleanup-${stamp}`);
}

function qident(value: string): string {
  return `"${value.replace(/"/g, '""')}"`;
}

function ensureDir(dir: string) {
  fs.mkdirSync(dir, { recursive: true });
}

function writeJson(file: string, value: unknown) {
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`);
}

function writeJsonl(file: string, rows: Record<string, unknown>[]) {
  fs.writeFileSync(file, rows.map((row) => JSON.stringify(row)).join("\n") + (rows.length ? "\n" : ""));
}

function publicSafeScope() {
  return {
    eventIds: selectedEventIds(),
    clientKey: process.env.SOURCE_EVENT_CLEANUP_CLIENT_KEY || null,
    includeArchived: boolEnv("SOURCE_EVENT_CLEANUP_INCLUDE_ARCHIVED"),
  };
}

async function loadTargetEvents(client: Client): Promise<EventRow[]> {
  const eventIds = selectedEventIds();
  const clientKey = process.env.SOURCE_EVENT_CLEANUP_CLIENT_KEY?.trim();
  const includeArchived = boolEnv("SOURCE_EVENT_CLEANUP_INCLUDE_ARCHIVED");
  const where: string[] = [];
  const params: unknown[] = [];

  if (eventIds.length) {
    params.push(eventIds);
    where.push(`id = any($${params.length}::uuid[])`);
  }
  if (clientKey) {
    params.push(clientKey);
    where.push(`client_key = $${params.length}`);
  }
  if (!includeArchived) {
    where.push(`coalesce(lifecycle_state, '') <> 'archived'`);
  }

  const sql = `
    select *
    from public.source_events
    ${where.length ? `where ${where.join(" and ")}` : ""}
    order by client_key, created_at, id
  `;
  const result = await client.query<EventRow>(sql, params);
  return result.rows;
}

async function discoverReferenceColumns(client: Client): Promise<TablePlan[]> {
  const result = await client.query<RefColumn>(
    `
      select table_schema, table_name, column_name, data_type, udt_name
      from information_schema.columns
      where table_schema = 'public'
        and table_name like 'source%'
        and column_name in (
          'source_event_id',
          'source_event_row_id',
          'event_id',
          'artifact_id',
          'source_artifact_id',
          'linked_artifact_id',
          'authoritative_version_id',
          'source_generated_artifact_id'
        )
      order by table_name, ordinal_position
    `,
  );
  const byTable = new Map<string, TablePlan>();
  for (const row of result.rows) {
    const key = `${row.table_schema}.${row.table_name}`;
    const existing = byTable.get(key) ?? { schema: row.table_schema, table: row.table_name, columns: [] };
    existing.columns.push(row);
    byTable.set(key, existing);
  }
  return [...byTable.values()].sort((a, b) => `${a.schema}.${a.table}`.localeCompare(`${b.schema}.${b.table}`));
}

function isUuidColumn(column: RefColumn): boolean {
  return column.udt_name === "uuid" || column.data_type === "uuid";
}

function tableWhere(
  plan: TablePlan,
  uuidEventIds: string[],
  textEventIds: string[],
  artifactIds: string[],
  paramOffset = 0,
): { where: string; params: unknown[] } | null {
  const clauses: string[] = [];
  const params: unknown[] = [];

  for (const column of plan.columns) {
    const col = qident(column.column_name);
    const isArtifactColumn = [
      "artifact_id",
      "source_artifact_id",
      "linked_artifact_id",
      "authoritative_version_id",
      "source_generated_artifact_id",
    ].includes(column.column_name);
    const values = isArtifactColumn ? artifactIds : isUuidColumn(column) ? uuidEventIds : textEventIds;
    if (values.length === 0) continue;
    params.push(values);
    const type = isArtifactColumn || isUuidColumn(column) ? "uuid" : "text";
    clauses.push(`${col} = any($${paramOffset + params.length}::${type}[])`);
  }

  if (!clauses.length) return null;
  return { where: clauses.join(" or "), params };
}

async function fetchRowsForPlan(
  client: Client,
  plan: TablePlan,
  eventIds: string[],
  artifactIds: string[],
): Promise<Record<string, unknown>[]> {
  if (plan.table === "source_events") return [];
  const condition = tableWhere(plan, eventIds, eventIds, artifactIds);
  if (!condition) return [];
  const sql = `select * from ${qident(plan.schema)}.${qident(plan.table)} where ${condition.where}`;
  const result = await client.query(sql, condition.params);
  return result.rows;
}

async function loadArtifactRows(client: Client, eventIds: string[]): Promise<Record<string, unknown>[]> {
  const result = await client.query(
    `
      select *
      from public.source_artifacts
      where source_event_row_id = any($1::uuid[])
         or source_event_id = any($2::text[])
    `,
    [eventIds, eventIds],
  );
  return result.rows;
}

function artifactIdList(rows: Record<string, unknown>[]): string[] {
  return rows.map((row) => String(row.id)).filter(Boolean);
}

function blobLocations(rows: Record<string, unknown>[]): BlobLocation[] {
  const byKey = new Map<string, BlobLocation>();
  for (const row of rows) {
    const artifactId = String(row.id);
    const blobContainer = typeof row.blob_container === "string" ? row.blob_container.trim() : "";
    const blobPath = typeof row.blob_path === "string" ? row.blob_path.trim() : "";
    if (blobContainer && blobPath && !blobPath.startsWith("registry://")) {
      byKey.set(`${blobContainer}\n${blobPath}`, {
        bucket: blobContainer,
        path: blobPath,
        artifactId,
        source: "blob_container_path",
      });
    }

    const blobUri = typeof row.blob_uri === "string" ? row.blob_uri.trim() : "";
    if (blobUri && !blobUri.startsWith("registry://")) {
      byKey.set(`source-artifacts\n${blobUri}`, {
        bucket: "source-artifacts",
        path: blobUri,
        artifactId,
        source: "blob_uri",
      });
    }
  }
  return [...byKey.values()].sort((a, b) => `${a.bucket}/${a.path}`.localeCompare(`${b.bucket}/${b.path}`));
}

async function countRows(
  client: Client,
  plans: TablePlan[],
  eventIds: string[],
  artifactIds: string[],
): Promise<Record<string, number>> {
  const counts: Record<string, number> = {};
  counts.source_events = eventIds.length;
  for (const plan of plans) {
    if (plan.table === "source_events") continue;
    const condition = tableWhere(plan, eventIds, eventIds, artifactIds);
    if (!condition) continue;
    const sql = `select count(*)::int as count from ${qident(plan.schema)}.${qident(plan.table)} where ${condition.where}`;
    const result = await client.query<{ count: number }>(sql, condition.params);
    counts[plan.table] = Number(result.rows[0]?.count ?? 0);
  }
  return Object.fromEntries(Object.entries(counts).sort(([a], [b]) => a.localeCompare(b)));
}

async function exportRows(
  client: Client,
  dir: string,
  plans: TablePlan[],
  events: EventRow[],
  artifacts: Record<string, unknown>[],
) {
  const exportDir = path.join(dir, "exports");
  ensureDir(exportDir);
  const eventIds = events.map((row) => row.id);
  const artifactIds = artifactIdList(artifacts);
  writeJsonl(path.join(exportDir, "source_events.jsonl"), events);
  writeJsonl(path.join(exportDir, "source_artifacts.jsonl"), artifacts);

  for (const plan of plans) {
    if (plan.table === "source_events" || plan.table === "source_artifacts") continue;
    const rows = await fetchRowsForPlan(client, plan, eventIds, artifactIds);
    if (rows.length > 0) {
      writeJsonl(path.join(exportDir, `${plan.table}.jsonl`), rows);
    }
  }
}

async function deleteBlobs(locations: BlobLocation[]): Promise<{ requested: number; deletedOrAlreadyMissing: number }> {
  if (locations.length === 0) return { requested: 0, deletedOrAlreadyMissing: 0 };
  const { getObjectStorageAdapter } = await import("../../src/lib/data-plane/objectStorage");
  const adapter = getObjectStorageAdapter();
  const byBucket = new Map<string, string[]>();
  for (const loc of locations) {
    const list = byBucket.get(loc.bucket) ?? [];
    list.push(loc.path);
    byBucket.set(loc.bucket, list);
  }
  for (const [bucket, paths] of byBucket) {
    for (let index = 0; index < paths.length; index += 100) {
      await adapter.remove(bucket, paths.slice(index, index + 100));
    }
  }
  return { requested: locations.length, deletedOrAlreadyMissing: locations.length };
}

async function deleteEventOwnedRows(
  client: Client,
  plans: TablePlan[],
  eventIds: string[],
  artifactIds: string[],
): Promise<Record<string, number>> {
  const deleted: Record<string, number> = {};
  const childPlans = plans
    .filter((plan) => !["source_events", "source_artifacts"].includes(plan.table))
    .sort((a, b) => {
      const aArtifact = a.columns.some((col) => col.column_name.includes("artifact"));
      const bArtifact = b.columns.some((col) => col.column_name.includes("artifact"));
      if (aArtifact !== bArtifact) return aArtifact ? -1 : 1;
      return `${a.schema}.${a.table}`.localeCompare(`${b.schema}.${b.table}`);
    });

  for (const plan of childPlans) {
    const condition = tableWhere(plan, eventIds, eventIds, artifactIds);
    if (!condition) continue;
    const sql = `delete from ${qident(plan.schema)}.${qident(plan.table)} where ${condition.where}`;
    const result = await client.query(sql, condition.params);
    deleted[plan.table] = (deleted[plan.table] ?? 0) + (result.rowCount ?? 0);
  }

  const artifactDelete = await client.query(
    `
      delete from public.source_artifacts
      where id = any($1::uuid[])
         or source_event_row_id = any($2::uuid[])
         or source_event_id = any($3::text[])
    `,
    [artifactIds, eventIds, eventIds],
  );
  deleted.source_artifacts = artifactDelete.rowCount ?? 0;

  const archive = await client.query(
    `
      update public.source_events
      set lifecycle_state = 'archived',
          updated_at = now()
      where id = any($1::uuid[])
    `,
    [eventIds],
  );
  deleted.source_events_archived = archive.rowCount ?? 0;

  return Object.fromEntries(Object.entries(deleted).sort(([a], [b]) => a.localeCompare(b)));
}

function emitProofBundle(dir: string) {
  if (!boolEnv("EMIT_ACA_PROOF_BUNDLE")) return;
  const tarPath = path.join(os.tmpdir(), `source-event-archive-cleanup-${Date.now()}.tgz`);
  const tar = spawnSync("tar", ["-czf", tarPath, "-C", path.dirname(dir), path.basename(dir)], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
  if (tar.status !== 0) {
    throw new Error(`failed to create proof bundle: ${tar.stderr || tar.stdout || "tar failed"}`);
  }
  process.stdout.write(`${PROOF_BEGIN}\n`);
  process.stdout.write(fs.readFileSync(tarPath).toString("base64"));
  process.stdout.write(`\n${PROOF_END}\n`);
}

async function main() {
  if (process.argv.includes("--help") || process.argv.includes("-h")) {
    process.stdout.write(usage());
    return;
  }

  loadEnv();
  const apply = boolEnv("SOURCE_EVENT_CLEANUP_APPLY") || process.argv.includes("--apply");
  if (apply && process.env.SOURCE_EVENT_CLEANUP_CONFIRM !== CONFIRMATION) {
    throw new Error(`Refusing apply without SOURCE_EVENT_CLEANUP_CONFIRM=${CONFIRMATION}`);
  }

  const dir = outDir();
  ensureDir(dir);
  const startedAt = new Date().toISOString();
  const client = new Client(postgresClientOptions(databaseUrl(), "source-event-archive-cleanup"));
  await client.connect();

  const summary: Record<string, unknown> = {
    mode: apply ? "apply" : "dry-run",
    scope: publicSafeScope(),
    startedAt,
    outDir: dir,
    confirmationRequiredForApply: CONFIRMATION,
    canonicalTablesTouched: [],
  };

  try {
    const events = await loadTargetEvents(client);
    if (events.length === 0) {
      summary.status = "no_target_events";
      writeJson(path.join(dir, "summary.json"), summary);
      console.log(JSON.stringify(summary, null, 2));
      emitProofBundle(dir);
      return;
    }

    const eventIds = events.map((row) => row.id);
    const plans = await discoverReferenceColumns(client);
    const artifacts = await loadArtifactRows(client, eventIds);
    const artifactIds = artifactIdList(artifacts);
    const blobs = blobLocations(artifacts);
    const beforeCounts = await countRows(client, plans, eventIds, artifactIds);

    await exportRows(client, dir, plans, events, artifacts);
    writeJson(path.join(dir, "target-events.json"), events);
    writeJson(path.join(dir, "artifact-blob-locations.json"), blobs);
    writeJson(path.join(dir, "before-counts.json"), beforeCounts);
    writeJson(path.join(dir, "table-reference-plan.json"), plans);

    summary.targetEventCount = events.length;
    summary.targetEvents = events.map((row) => ({
      id: row.id,
      client_key: row.client_key,
      event_code: row.event_code,
      lifecycle_state: row.lifecycle_state,
    }));
    summary.artifactCount = artifacts.length;
    summary.blobLocationCount = blobs.length;
    summary.beforeCounts = beforeCounts;

    if (!apply) {
      summary.status = "dry_run_complete_no_mutation";
      writeJson(path.join(dir, "summary.json"), summary);
      console.log(JSON.stringify(summary, null, 2));
      emitProofBundle(dir);
      return;
    }

    const blobDelete = await deleteBlobs(blobs);
    await client.query("begin");
    let deleted: Record<string, number>;
    try {
      deleted = await deleteEventOwnedRows(client, plans, eventIds, artifactIds);
      await client.query("commit");
    } catch (error) {
      await client.query("rollback");
      throw error;
    }

    const afterArtifacts = await loadArtifactRows(client, eventIds);
    const afterCounts = await countRows(client, plans, eventIds, artifactIdList(afterArtifacts));
    const archiveCheck = await client.query<{ archived: number }>(
      `
        select count(*)::int as archived
        from public.source_events
        where id = any($1::uuid[])
          and lifecycle_state = 'archived'
      `,
      [eventIds],
    );

    summary.status = "apply_complete";
    summary.blobDelete = blobDelete;
    summary.deletedRows = deleted;
    summary.afterCounts = afterCounts;
    summary.archivedEventCount = Number(archiveCheck.rows[0]?.archived ?? 0);
    writeJson(path.join(dir, "after-counts.json"), afterCounts);
    writeJson(path.join(dir, "deleted-rows.json"), deleted);
    writeJson(path.join(dir, "summary.json"), summary);
    console.log(JSON.stringify(summary, null, 2));
    emitProofBundle(dir);
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error("source-event-archive-cleanup: failed", error instanceof Error ? error.message : error);
  process.exit(1);
});
