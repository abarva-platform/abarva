/**
 * Exact, single-transaction schema lane for the registered-intake Tower candidate.
 * Run only inside the digest-pinned private ACA operator job. The shared
 * db:migrate:ci command intentionally is not used: it applies every pending file.
 */
import { createHash } from "node:crypto";
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Client } from "pg";
import { postgresClientOptions } from "../../src/scripts/postgres-client-options";

type Mode = "status" | "apply" | "verify";
type Target = { name: string; sha256: string };
type Selection = { assessment_id: string; projection_version: number };

const ROOT = process.cwd();
const TARGETS: readonly Target[] = [
  {
    name: "20261011210000_tower_active_lifecycle_fail_closed.sql",
    sha256: "b8dd9e6fd0f7bc941e3b908ad07db0c5779528c28f3efda7efca7e2b0ef0ce21",
  },
  {
    name: "20261012133000_tower_foundations_page_key.sql",
    sha256: "d17d7b84ef94ebd1fa0dce5a00b01fab27d8169570ec41fed256c973756d5857",
  },
];
// Same advisory lock as src/scripts/run-migrations.ts. A broad migration apply
// and this narrow apply must never race on the same database.
const MIGRATION_ADVISORY_LOCK_KEY = "881200441733199010";
const PROOF_MARKER = "TOWER_ONLY_SCHEMA_PROOF";
const CANDIDATE_ASSESSMENT = "tower-registry-candidate-7de0ab623209418a";
const CANDIDATE_SOURCE_HASH = "dd8a1389fa694eb58e835ec55ff71a1ae4132f607fe6635d9b343f98bf885048";
export const PRIOR_PAGE_KEYS = [
  "adoption_lens", "ai_portfolio", "command_center", "cost_lens", "decision_lanes",
  "evidence", "recommended_actions", "risk_lens", "value_proof",
] as const;

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

async function persistPrivateProof(proof: Record<string, unknown>, mode: Mode): Promise<{ sha256: string; uri: string }> {
  const account = process.env.TOWER_RELOAD_PROOF_BLOB_ACCOUNT;
  const container = process.env.TOWER_RELOAD_PROOF_BLOB_CONTAINER;
  const runId = process.env.TOWER_SCHEMA_RUN_ID;
  const clientId = process.env.AZURE_CLIENT_ID;
  assert(account && container && runId && clientId, "Private Blob proof destination, run ID, and managed identity are required");
  assert(/^[a-z0-9]{3,24}$/.test(account) && /^[a-z0-9-]{3,63}$/.test(container) &&
    /^[a-zA-Z0-9_-]+$/.test(runId), "Private proof destination is malformed");
  const bytes = Buffer.from(JSON.stringify(proof));
  const sha256 = createHash("sha256").update(bytes).digest("hex");
  const { BlobServiceClient } = await import("@azure/storage-blob");
  const { DefaultAzureCredential } = await import("@azure/identity");
  const service = new BlobServiceClient(`https://${account}.blob.core.windows.net`,
    new DefaultAzureCredential({ managedIdentityClientId: clientId }));
  const blob = service.getContainerClient(container).getBlockBlobClient(
    `operator-proof/tower-schema/${CANDIDATE_ASSESSMENT}/${runId}/${mode}-${sha256}.json`);
  await blob.uploadData(bytes, { blobHTTPHeaders: { blobContentType: "application/json" }, conditions: { ifNoneMatch: "*" } });
  const readback = await blob.downloadToBuffer();
  assert(createHash("sha256").update(readback).digest("hex") === sha256, "Private proof Blob readback differs");
  return { sha256, uri: blob.url };
}

export function parseMode(args: readonly string[]): Mode {
  const mode = args.find((value) => value.startsWith("--mode="))?.slice(7);
  assert(mode === "status" || mode === "apply" || mode === "verify", "Exact --mode=status|apply|verify is required");
  assert(args.length === 1, "Only one --mode argument is allowed");
  return mode;
}

export function verifyTargetFiles(root = ROOT): Map<string, string> {
  const sqlByName = new Map<string, string>();
  for (const target of TARGETS) {
    const sql = readFileSync(path.join(root, "supabase/migrations", target.name), "utf8");
    const actual = createHash("sha256").update(sql).digest("hex");
    assert(actual === target.sha256, `Approved SQL hash mismatch: ${target.name}`);
    sqlByName.set(target.name, sql);
  }
  return sqlByName;
}

export function stripFrozenFoundationTransaction(sql: string): string {
  // The frozen second file carries BEGIN/COMMIT. Remove exactly those outer
  // markers so both migrations and both ledger inserts share one transaction.
  assert(/^\s*--[^\n]*\n(?:--[^\n]*\n)*begin;\s*\n/i.test(sql), "Unexpected Foundation transaction header");
  assert(/\ncommit;\s*$/i.test(sql), "Unexpected Foundation transaction footer");
  return sql.replace(/\bbegin;\s*\n/i, "").replace(/\ncommit;\s*$/i, "\n");
}

export function priorServingSelection(manifest: any): Selection {
  const approval = manifest.serving_approval;
  const priorProjectionVersion = approval?.delegated_decision?.scope?.extra_bindings?.projection_version;
  assert(approval?.assessment_id && Number.isInteger(priorProjectionVersion) &&
    approval.delegated_decision?.scope?.assessment_id === approval.assessment_id &&
    approval.delegated_decision?.scope?.source_set_hash === approval.source_set_hash &&
    approval.delegated_decision?.scope?.surface === "tower" && approval.surface === "tower",
  "Prior serving approval is incomplete");
  return { assessment_id: approval.assessment_id, projection_version: priorProjectionVersion };
}

function registrySelection(root = ROOT): { tenantKey: string; expected: Selection } {
  const registry = JSON.parse(readFileSync(path.join(root, "datasets/tenant-inputs/tenant-input-registry.json"), "utf8"));
  const manifest = JSON.parse(readFileSync(path.join(root, "docs/governance/dataset-manifests/tower-registered-intake-source-fields-20261012.json"), "utf8"));
  const tenantKey = manifest.client_key;
  assert(registry.activeTenants?.some((entry: { tenantKey: string }) => entry.tenantKey === tenantKey), "Serving tenant is not active in the declared registry");
  const expected = priorServingSelection(manifest);
  const candidateManifest = JSON.parse(readFileSync(path.join(root,
    "docs/governance/dataset-manifests/tower-registered-intake-source-assertions-20261012.json"), "utf8"));
  const candidateApproval = candidateManifest.load_approval;
  assert(candidateManifest.client_key === tenantKey &&
    candidateApproval?.assessment_id === CANDIDATE_ASSESSMENT &&
    candidateApproval?.source_set_hash === CANDIDATE_SOURCE_HASH &&
    candidateApproval?.release_record === "docs/releases/records/2026-10-12-tower-source-assertions-candidate.md" &&
    candidateManifest.serving_approval === null,
  "Exact candidate load approval is not present in this image");
  return { tenantKey, expected };
}

async function targetLedger(client: Client): Promise<Map<string, string | null>> {
  const present = await client.query<{ present: boolean }>("select to_regclass('public.schema_migrations') is not null as present");
  assert(present.rows[0]?.present, "Migration ledger is absent");
  const rows = await client.query<{ name: string; sha256: string | null }>(
    "select name, sha256 from public.schema_migrations where name = any($1::text[]) order by name",
    [TARGETS.map((target) => target.name)],
  );
  return new Map(rows.rows.map((row) => [row.name, row.sha256]));
}

async function ledgerSnapshot(client: Client): Promise<Map<string, string | null>> {
  const rows = await client.query<{ name: string; sha256: string | null }>(
    "select name, sha256 from public.schema_migrations order by name",
  );
  const ledger = new Map(rows.rows.map((row) => [row.name, row.sha256]));
  for (const [name, recorded] of ledger) {
    if (!recorded) continue;
    try {
      const sql = readFileSync(path.join(ROOT, "supabase/migrations", name), "utf8");
      const actual = createHash("sha256").update(sql).digest("hex");
      assert(actual === recorded, `Applied migration drift: ${name}`);
    } catch (error) {
      if (error instanceof Error && (error as NodeJS.ErrnoException).code === "ENOENT") continue;
      throw error;
    }
  }
  return ledger;
}

export function classifyLedger(ledger: ReadonlyMap<string, string | null>): "ready" | "applied" {
  const present = TARGETS.filter((target) => ledger.has(target.name));
  for (const target of present) {
    assert(ledger.get(target.name) === target.sha256, `Target ledger hash mismatch: ${target.name}`);
  }
  assert(present.length === 0 || present.length === TARGETS.length, "Partial Tower migration state; manual investigation required");
  return present.length === 0 ? "ready" : "applied";
}

async function prerequisite(client: Client): Promise<Record<string, boolean>> {
  const result = await client.query<{
    lifecycle: boolean; command_center: boolean; object_type_catalog: boolean; object_table: boolean; selector: boolean;
  }>(`select
    to_regclass('ecl_projection.tower_assessment_lifecycle') is not null as lifecycle,
    to_regclass('ecl_projection.tower_command_center') is not null as command_center,
    to_regclass('ecl_context.object_type_catalog') is not null as object_type_catalog,
    to_regclass('ecl_context.object') is not null as object_table,
    to_regprocedure('serving.tower_active_assessment_keys()') is not null as selector`);
  assert(result.rows.length === 1 && Object.values(result.rows[0]).every(Boolean), "Tower schema prerequisites are absent");
  const nullable = await client.query<{ table_name: string; column_name: string; is_nullable: string; column_default: string | null }>(`
    select table_name, column_name, is_nullable, column_default from information_schema.columns
     where table_schema = 'ecl_projection' and (table_name, column_name) in (
       ('tower_value_chain', 'claimable_value_usd'),
       ('tower_value_chain', 'blocked_value_usd'),
       ('tower_evidence_queue', 'priority_score'))`);
  assert(nullable.rows.length === 3 && nullable.rows.every((row) => row.is_nullable === "YES" && row.column_default === null),
    "Tower unknown-amount columns are not nullable with no default");
  const unknownCheck = await client.query<{ definition: string; convalidated: boolean }>(`
    select pg_get_constraintdef(oid) as definition, convalidated from pg_constraint
     where conrelid = 'ecl_projection.tower_value_chain'::regclass
       and conname = 'tower_value_chain_unknown_amounts_check'`);
  assert(unknownCheck.rows.length === 1 && unknownCheck.rows[0].convalidated,
    "Tower unknown-amount check is absent or unvalidated");
  return result.rows[0];
}

async function activeSelection(client: Client, tenantKey: string, expected: Selection): Promise<Selection> {
  const lifecycle = await client.query<Selection>(
    "select assessment_id, projection_version from ecl_projection.tower_assessment_lifecycle where tenant_key=$1 and state='active'",
    [tenantKey],
  );
  const selected = await client.query<Selection>(
    "select assessment_id, projection_version from serving.tower_active_assessment_keys() where tenant_key=$1",
    [tenantKey],
  );
  assert(lifecycle.rows.length === 1 && selected.rows.length === 1, "Expected one declared and one selected active Tower assessment");
  for (const row of [lifecycle.rows[0], selected.rows[0]]) {
    assert(row.assessment_id === expected.assessment_id && Number(row.projection_version) === expected.projection_version,
      "Active Tower assessment differs from the approved prior serving version");
  }
  return { assessment_id: selected.rows[0].assessment_id, projection_version: Number(selected.rows[0].projection_version) };
}

async function pageFingerprint(client: Client, tenantKey: string, selection: Selection): Promise<Array<{ page_key: string; count: number; fingerprint: string }>> {
  const tables = ["tower_command_center", "tower_value_chain", "tower_evidence_queue", "tower_ai_portfolio"] as const;
  const pages: Array<{ page_key: string; count: number; fingerprint: string }> = [];
  for (const table of tables) {
    const pageExpression = table === "tower_ai_portfolio" ? "display_payload_json ->> 'page_key'" : "page_key";
    const result = await client.query<{ page_key: string; count: string; fingerprint: string }>(
      `select ${pageExpression} as page_key, count(*)::text as count,
              md5(string_agg(row_key || '|' || coalesce(source_hash, '<null>') || '|' ||
                coalesce(display_payload_json::text, '<null>'), chr(10) order by row_key)) as fingerprint
         from ecl_projection.${table}
        where tenant_key=$1 and assessment_id=$2 and projection_version=$3
        group by ${pageExpression} order by ${pageExpression}`,
      [tenantKey, selection.assessment_id, selection.projection_version],
    );
    pages.push(...result.rows.map((row) => ({ page_key: row.page_key, count: Number(row.count), fingerprint: row.fingerprint })));
  }
  pages.sort((a, b) => a.page_key.localeCompare(b.page_key));
  assert(JSON.stringify(pages.map((row) => row.page_key)) === JSON.stringify(PRIOR_PAGE_KEYS),
    "Prior active Tower page set differs from the nine approved pages");
  return pages;
}

async function candidateRows(client: Client, tenantKey: string): Promise<Record<string, number>> {
  const tables = ["ecl_source.source_file", "ecl_source.source_record", "ecl_context.object", "ecl_context.measure",
    "ecl_projection.projection_manifest", "ecl_projection.tower_command_center", "ecl_projection.tower_value_chain",
    "ecl_projection.tower_evidence_queue", "ecl_projection.tower_ai_portfolio"] as const;
  const counts: Record<string, number> = {};
  for (const table of tables) {
    const result = await client.query<{ count: string }>(
      `select count(*)::text as count from ${table} where tenant_key=$1 and assessment_id=$2`,
      [tenantKey, CANDIDATE_ASSESSMENT],
    );
    counts[table] = Number(result.rows[0]?.count);
  }
  return counts;
}

async function foundationReadback(client: Client): Promise<void> {
  const names = ["tower_command_center_page_key_check", "object_type_catalog_grain_check", "object_type_check"];
  const rows = await client.query<{ conname: string; definition: string; convalidated: boolean }>(
    `select conname, pg_get_constraintdef(oid) as definition, convalidated
       from pg_constraint where (conrelid, conname) in (
         ('ecl_projection.tower_command_center'::regclass, 'tower_command_center_page_key_check'),
         ('ecl_context.object_type_catalog'::regclass, 'object_type_catalog_grain_check'),
         ('ecl_context.object'::regclass, 'object_type_check'))`,
  );
  assert(rows.rows.length === names.length, "Expected Foundation constraints are absent or ambiguous");
  assert(rows.rows.every((row) => row.convalidated), "Foundation constraints are not validated");
  const definitions = new Map(rows.rows.map((row) => [row.conname, row.definition]));
  assert(definitions.get(names[0])?.includes("foundations"), "Foundation page key is not admitted");
  for (const name of names.slice(1)) {
    for (const value of ["enterprise_profile", "workforce_role", "managed_service_scope"]) {
      assert(definitions.get(name)?.includes(value), `Foundation type ${value} is not admitted by ${name}`);
    }
  }
  const catalog = await client.query<{ object_type: string; grain: string; counting_class: string }>(
    `select object_type, grain, counting_class from ecl_context.object_type_catalog
      where object_type = any($1::text[]) order by object_type`,
    [["enterprise_profile", "business_function", "workforce_role", "managed_service_scope",
      "organization", "application", "data_flow", "infrastructure", "process"]],
  );
  assert(catalog.rows.length === 9, "Required source object types are not registered");
  for (const row of catalog.rows.filter((row) => ["enterprise_profile", "workforce_role", "managed_service_scope"].includes(row.object_type))) {
    assert(row.grain === row.object_type, `Foundation catalog grain differs for ${row.object_type}`);
  }
  const selector = await client.query<{ definition: string }>(
    "select pg_get_functiondef('serving.tower_active_assessment_keys()'::regprocedure) as definition",
  );
  const definition = selector.rows[0]?.definition ?? "";
  assert(/not exists\s*\([\s\S]*declaration\.tenant_key\s*=\s*ranked\.tenant_key/i.test(definition) &&
    !/declared\.state\s*=\s*'active'/i.test(definition),
  "Tower selector does not use tenant-level fail-closed lifecycle declaration");
}

async function schemaEvidence(client: Client): Promise<{
  nullable_columns: Array<{ table_name: string; column_name: string; is_nullable: string; column_default: string | null }>;
  constraints: Array<{ conname: string; definition: string; convalidated: boolean }>;
  catalog: Array<{ object_type: string; grain: string; counting_class: string }>;
  selector_definition: string;
}> {
  const nullable = await client.query<{ table_name: string; column_name: string; is_nullable: string; column_default: string | null }>(`
    select table_name, column_name, is_nullable, column_default from information_schema.columns
     where table_schema = 'ecl_projection' and (table_name, column_name) in (
       ('tower_value_chain', 'claimable_value_usd'),
       ('tower_value_chain', 'blocked_value_usd'),
       ('tower_evidence_queue', 'priority_score')) order by table_name, column_name`);
  const constraints = await client.query<{ conname: string; definition: string; convalidated: boolean }>(`
    select conname, pg_get_constraintdef(oid) as definition, convalidated from pg_constraint
     where (conrelid, conname) in (
       ('ecl_projection.tower_value_chain'::regclass, 'tower_value_chain_unknown_amounts_check'),
       ('ecl_projection.tower_command_center'::regclass, 'tower_command_center_page_key_check'),
       ('ecl_context.object_type_catalog'::regclass, 'object_type_catalog_grain_check'),
       ('ecl_context.object'::regclass, 'object_type_check')) order by conname`);
  const catalog = await client.query<{ object_type: string; grain: string; counting_class: string }>(`
    select object_type, grain, counting_class from ecl_context.object_type_catalog
     where object_type = any($1::text[]) order by object_type`,
    [["enterprise_profile", "business_function", "workforce_role", "managed_service_scope",
      "organization", "application", "data_flow", "infrastructure", "process"]]);
  const selector = await client.query<{ definition: string }>(
    "select pg_get_functiondef('serving.tower_active_assessment_keys()'::regprocedure) as definition",
  );
  return {
    nullable_columns: nullable.rows,
    constraints: constraints.rows,
    catalog: catalog.rows,
    selector_definition: selector.rows[0]?.definition ?? "",
  };
}

function assertReadySchema(evidence: Awaited<ReturnType<typeof schemaEvidence>>): void {
  // A file marked pending may have been run outside the ledger. Refuse to
  // replay DDL over that ambiguous state, even though clauses use IF EXISTS.
  const page = evidence.constraints.find((row) => row.conname === "tower_command_center_page_key_check")?.definition ?? "";
  const grain = evidence.constraints.find((row) => row.conname === "object_type_catalog_grain_check")?.definition ?? "";
  const objectType = evidence.constraints.find((row) => row.conname === "object_type_check")?.definition ?? "";
  assert(!page.includes("foundations") &&
    ![grain, objectType].some((definition) => definition.includes("managed_service_scope")) &&
    !evidence.catalog.some((row) => ["enterprise_profile", "workforce_role", "managed_service_scope"].includes(row.object_type)),
  "Foundation schema appears changed while target ledger is absent");
  assert(/declared\.state\s*=\s*'active'/i.test(evidence.selector_definition),
    "Tower selector already differs from the prior lifecycle definition while target ledger is absent");
}

async function run(): Promise<void> {
  const startedAt = new Date().toISOString();
  const mode = parseMode(process.argv.slice(2));
  const sqlByName = verifyTargetFiles();
  const { tenantKey, expected } = registrySelection();
  const url = process.env.ABARVA_AZURE_DATABASE_URL ?? process.env.AZURE_DATABASE_URL ?? process.env.DATABASE_URL;
  assert(url, "Azure/Postgres database connection is required");
  if (mode === "apply") assert(process.env.TOWER_SCHEMA_APPLY_CONFIRM === "APPLY_TOWER_ONLY", "Exact Tower apply confirmation is required");
  const client = new Client(postgresClientOptions(url, "tower-only-schema-lane"));
  await client.connect();
  let locked = false;
  try {
    if (mode === "apply") {
      const lock = await client.query<{ locked: boolean }>("select pg_try_advisory_lock($1) as locked", [MIGRATION_ADVISORY_LOCK_KEY]);
      assert(lock.rows[0]?.locked, "Another migration apply holds the shared advisory lock");
      locked = true;
    }
    await client.query("begin");
    if (mode !== "apply") await client.query("set transaction read only");
    await client.query("select set_config('app.tenant_key', $1, true)", [tenantKey]);
    const prerequisiteTables = await prerequisite(client);
    const before = await activeSelection(client, tenantKey, expected);
    const pagesBefore = await pageFingerprint(client, tenantKey, before);
    const ledgerBefore = await ledgerSnapshot(client);
    const targetLedgerBefore = await targetLedger(client);
    const state = classifyLedger(targetLedgerBefore);
    const schemaBefore = await schemaEvidence(client);
    const candidateBefore = await candidateRows(client, tenantKey);
    if (state === "ready") assertReadySchema(schemaBefore);
    let pagesAfter = pagesBefore;
    let after = before;
    let candidateAfter = candidateBefore;
    let schemaAfter = schemaBefore;
    let targetLedgerAfter = targetLedgerBefore;
    if (mode === "apply") {
      assert(state === "ready", "Tower migration target is already applied");
      assert(Object.values(candidateBefore).every((count) => count === 0),
        "Candidate rows already exist; schema lane is not a reload lane");
      for (const target of TARGETS) {
        const sql = sqlByName.get(target.name)!;
        await client.query(target === TARGETS[1] ? stripFrozenFoundationTransaction(sql) : sql);
        await client.query("insert into public.schema_migrations(name, sha256) values ($1,$2)", [target.name, target.sha256]);
      }
      assert(classifyLedger(await targetLedger(client)) === "applied", "Tower migration ledger readback failed");
      await foundationReadback(client);
      after = await activeSelection(client, tenantKey, expected);
      pagesAfter = await pageFingerprint(client, tenantKey, after);
      assert(JSON.stringify(pagesAfter) === JSON.stringify(pagesBefore), "Active Tower page counts changed during schema apply");
      candidateAfter = await candidateRows(client, tenantKey);
      assert(JSON.stringify(candidateAfter) === JSON.stringify(candidateBefore), "Candidate rows changed during schema apply");
      schemaAfter = await schemaEvidence(client);
      targetLedgerAfter = await targetLedger(client);
      const ledgerAfter = await ledgerSnapshot(client);
      assert(ledgerAfter.size === ledgerBefore.size + TARGETS.length &&
        [...ledgerBefore].every(([name, hash]) => ledgerAfter.get(name) === hash),
      "Unrelated migration ledger rows changed during Tower apply");
      await client.query("commit");
    } else {
      if (mode === "verify") assert(state === "applied", "Tower migrations are not both applied");
      if (state === "applied") await foundationReadback(client);
      await client.query("rollback");
    }
    const otherMigrationFiles = readdirSync(path.join(ROOT, "supabase/migrations"))
      .filter((name) => name.endsWith(".sql") && !TARGETS.some((target) => target.name === name));
    const mainSha = process.env.TOWER_SCHEMA_MAIN_SHA;
    const image = process.env.TOWER_SCHEMA_IMAGE;
    const runId = process.env.TOWER_SCHEMA_RUN_ID;
    assert(mainSha && /^[a-f0-9]{40}$/.test(mainSha) && image && /@sha256:[a-f0-9]{64}$/.test(image) && runId,
      "Exact main SHA, digest image, and run ID are required for schema proof");
    const proof = {
      job_name: "job-abarva-private-operator-eus",
      operator_identity_client_id: process.env.AZURE_CLIENT_ID,
      run_id: runId, started_at: startedAt, finished_at: new Date().toISOString(),
      main_sha: mainSha, image, timeout_seconds: 1800, retry_limit: 0,
      tenant_scope: "registry-declared single tenant",
      candidate_assessment_id: CANDIDATE_ASSESSMENT,
      candidate_source_set_hash: CANDIDATE_SOURCE_HASH,
      release_record: "docs/releases/records/2026-10-12-tower-only-schema-lane.md",
      mode, state: mode === "apply" ? "applied" : state,
      targets: TARGETS, tenant_key: tenantKey, active_before: before,
      active_after: after, active_page_fingerprints_before: pagesBefore, active_page_fingerprints_after: pagesAfter,
      candidate_rows_before: candidateBefore, candidate_rows_after: candidateAfter,
      prerequisite_tables: prerequisiteTables, schema_before: schemaBefore, schema_after: schemaAfter,
      target_ledger_before: [...targetLedgerBefore], target_ledger_after: [...targetLedgerAfter],
      unrelated_migration_files_present: otherMigrationFiles.length,
      unrelated_ledger_rows_changed: 0,
    };
    const privateProof = await persistPrivateProof(proof, mode);
    console.log(`${PROOF_MARKER}\t${JSON.stringify({
      mode, state: proof.state, targets: TARGETS, private_proof_sha256: privateProof.sha256,
      private_proof_uri: privateProof.uri, private_readback_verified: true,
      active_selector_unchanged: JSON.stringify(before) === JSON.stringify(after),
      active_page_fingerprints_unchanged: JSON.stringify(pagesBefore) === JSON.stringify(pagesAfter),
      active_page_count: pagesAfter.length,
      candidate_rows_absent: Object.values(candidateBefore).every((count) => count === 0) &&
        Object.values(candidateAfter).every((count) => count === 0),
      target_ledger_after: [...targetLedgerAfter],
      unrelated_ledger_rows_changed: 0,
    })}`);
  } catch (error) {
    await client.query("rollback").catch(() => {});
    throw error;
  } finally {
    if (locked) await client.query("select pg_advisory_unlock($1)", [MIGRATION_ADVISORY_LOCK_KEY]).catch(() => {});
    await client.end();
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  run().catch((error) => {
    console.error(`TOWER_ONLY_SCHEMA_FAIL\t${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 1;
  });
}
