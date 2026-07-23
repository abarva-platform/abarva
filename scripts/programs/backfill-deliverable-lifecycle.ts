import "dotenv/config";

import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { Pool } from "pg";
import { tenantAliasesFor, canonicalTenantKey } from "../../src/lib/tenant/aliases";

interface Args {
  mode: "status" | "apply";
  tenants: string[];
  workflowRunId: string;
  reviewedReportId: string | null;
  batchSize: number;
  outDir: string;
}

interface CandidateRow {
  tenant_key: string;
  tenant_display_name: string;
  engagement_id: string;
  move_name: string | null;
  deliverable_id: string;
  deliverable_type_key: string;
  current_version: number | null;
  signed_off_version: number | null;
  approved_artifact_id: string | null;
  resolved_version: number | null;
  version_exists: boolean;
  approved_artifact_resolves: boolean;
}

interface ReportRow {
  tenant: string;
  move: string;
  engagement_id: string;
  deliverable_id: string;
  phase: string;
  artifact: string;
  version: string;
  legacy_evidence: string;
  proposed_lifecycle_current_state: "human_approved" | "skipped";
  authoritative_designation: string;
  requires_revalidation: "true" | "false";
  reason: string;
  confidence: "high" | "inferred" | "none";
  action_or_skip: string;
}

const MIGRATION_PATH = path.join(
  process.cwd(),
  "supabase/migrations/20260723100000_deliverable_lifecycle_events.sql",
);

function parseArgs(argv: string[]): Args {
  const args: Args = {
    mode: "status",
    tenants: [],
    workflowRunId:
      process.env.GITHUB_RUN_ID ||
      process.env.ACA_JOB_EXECUTION_NAME ||
      `local-${new Date().toISOString().replace(/[-:.]/g, "")}`,
    reviewedReportId: null,
    batchSize: 200,
    outDir: path.join(process.cwd(), "reports/moves-deliverable-lifecycle-backfill"),
  };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index]!;
    const next = () => {
      index += 1;
      if (index >= argv.length) throw new Error(`${arg} requires a value`);
      return argv[index]!;
    };
    if (arg === "--mode") args.mode = next() as Args["mode"];
    else if (arg === "--tenant") args.tenants.push(canonicalTenantKey(next()));
    else if (arg === "--tenants") {
      args.tenants.push(...next().split(",").map((tenant) => canonicalTenantKey(tenant.trim())));
    } else if (arg === "--workflow-run-id") args.workflowRunId = next();
    else if (arg === "--reviewed-report-id") args.reviewedReportId = next();
    else if (arg === "--batch-size") args.batchSize = Number.parseInt(next(), 10);
    else if (arg === "--out-dir") args.outDir = next();
    else if (arg === "--help") {
      console.log(
        "Usage: npx tsx scripts/programs/backfill-deliverable-lifecycle.ts --tenant <key> [--mode status|apply] [--reviewed-report-id <id>]",
      );
      process.exit(0);
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }
  if (!["status", "apply"].includes(args.mode)) throw new Error("--mode must be status or apply");
  if (args.tenants.length === 0) {
    throw new Error("At least one --tenant or --tenants value is required; there is no all-tenant mode.");
  }
  if (args.mode === "apply" && !args.reviewedReportId) {
    throw new Error("--mode apply requires --reviewed-report-id from the reviewed dry-run report.");
  }
  if (!Number.isFinite(args.batchSize) || args.batchSize < 1 || args.batchSize > 500) {
    throw new Error("--batch-size must be between 1 and 500.");
  }
  args.tenants = Array.from(new Set(args.tenants));
  return args;
}

function connectionString(): string {
  const value =
    process.env.ABARVA_AZURE_DATABASE_URL ||
    process.env.AZURE_DATABASE_URL ||
    process.env.DATABASE_URL;
  if (!value) throw new Error("ABARVA_AZURE_DATABASE_URL, AZURE_DATABASE_URL, or DATABASE_URL is required.");
  return value.replace(/^"|"$/g, "").replace(/^'|'$/g, "");
}

function migrationHash(): string {
  return crypto.createHash("sha256").update(fs.readFileSync(MIGRATION_PATH)).digest("hex");
}

function csvEscape(value: unknown): string {
  const text = String(value ?? "");
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function writeCsv(file: string, rows: ReportRow[]): void {
  const headers = [
    "tenant",
    "move",
    "engagement_id",
    "deliverable_id",
    "phase",
    "artifact",
    "version",
    "legacy_evidence",
    "proposed_lifecycle_current_state",
    "authoritative_designation",
    "requires_revalidation",
    "reason",
    "confidence",
    "action_or_skip",
  ];
  fs.writeFileSync(
    file,
    [headers.join(","), ...rows.map((row) => headers.map((header) => csvEscape(row[header as keyof ReportRow])).join(","))].join("\n") +
      "\n",
  );
}

function classifyCandidate(row: CandidateRow): ReportRow {
  const move = row.move_name || row.engagement_id;
  const version = row.resolved_version ? String(row.resolved_version) : "";
  if (!row.resolved_version || !row.version_exists) {
    return {
      tenant: row.tenant_key,
      move,
      engagement_id: row.engagement_id,
      deliverable_id: row.deliverable_id,
      phase: "unknown",
      artifact: row.deliverable_type_key,
      version,
      legacy_evidence: row.signed_off_version ? "signed_off_version" : "current_version",
      proposed_lifecycle_current_state: "skipped",
      authoritative_designation: "false",
      requires_revalidation: "true",
      reason: "signed_off pointer did not resolve to an existing deliverable_versions row",
      confidence: "none",
      action_or_skip: "skipped:unresolvable_lineage",
    };
  }
  if (row.approved_artifact_id && row.approved_artifact_resolves) {
    return {
      tenant: row.tenant_key,
      move,
      engagement_id: row.engagement_id,
      deliverable_id: row.deliverable_id,
      phase: "unknown",
      artifact: row.deliverable_type_key,
      version,
      legacy_evidence: "approved_artifact_id",
      proposed_lifecycle_current_state: "human_approved",
      authoritative_designation: "true:legacy_backfill",
      requires_revalidation: "false",
      reason: "approved_artifact_id resolves to a real move_artifacts row",
      confidence: "high",
      action_or_skip: "backfilled",
    };
  }
  return {
    tenant: row.tenant_key,
    move,
    engagement_id: row.engagement_id,
    deliverable_id: row.deliverable_id,
    phase: "unknown",
    artifact: row.deliverable_type_key,
    version,
    legacy_evidence: row.approved_artifact_id ? "dangling_approved_artifact_id" : "signed_off_version",
    proposed_lifecycle_current_state: "human_approved",
    authoritative_designation: "true:legacy_backfill",
    requires_revalidation: "true",
    reason: row.approved_artifact_id
      ? "approved_artifact_id did not resolve; demoted to signed_off_version-only legacy inference"
      : "signed_off_version only, no upload lineage; legacy inferred",
    confidence: "inferred",
    action_or_skip: "backfilled",
  };
}

async function assertSchemaReady(pool: Pool): Promise<void> {
  const result = await pool.query<{ exists: boolean }>(
    "select exists (select 1 from information_schema.tables where table_name = 'deliverable_lifecycle_events') as exists",
  );
  if (result.rows[0]?.exists !== true) {
    throw new Error("Schema is not migrated: deliverable_lifecycle_events is missing.");
  }
}

async function candidatesForTenant(pool: Pool, tenant: string): Promise<CandidateRow[]> {
  const aliases = tenantAliasesFor(tenant).map((alias) => alias.toLowerCase());
  const result = await pool.query<CandidateRow>(
    `
      with tenant_clients as (
        select id, name
        from clients
        where lower(name) = any($1::text[])
           or lower(coalesce(legal_name, '')) = any($1::text[])
           or id::text = any($1::text[])
      )
      select
        $2::text as tenant_key,
        tc.name as tenant_display_name,
        d.engagement_id::text,
        e.engagement_name as move_name,
        d.id::text as deliverable_id,
        d.deliverable_type_key,
        d.current_version,
        d.signed_off_version,
        d.approved_artifact_id::text,
        coalesce(d.signed_off_version, d.current_version) as resolved_version,
        dv.id is not null as version_exists,
        ma.artifact_id is not null as approved_artifact_resolves
      from deliverables_v2 d
      join engagements e on e.id = d.engagement_id
      join tenant_clients tc on tc.id::text = e.client_id::text
      left join deliverable_versions dv
        on dv.deliverable_id = d.id
       and dv.version = coalesce(d.signed_off_version, d.current_version)
      left join move_artifacts ma on ma.artifact_id = d.approved_artifact_id
      where d.status = 'signed_off'
      order by tc.name, e.engagement_name, d.deliverable_type_key
    `,
    [aliases, tenant],
  );
  return result.rows;
}

async function applyReport(pool: Pool, rows: ReportRow[], args: Args): Promise<ReportRow[]> {
  const applied: ReportRow[] = [];
  for (const tenant of args.tenants) {
    const locked = await pool.query<{ locked: boolean }>(
      "select pg_try_advisory_lock(hashtext($1)) as locked",
      [`${tenant}:moves_lifecycle_backfill`],
    );
    if (locked.rows[0]?.locked !== true) throw new Error(`Backfill already running for ${tenant}.`);
    try {
      const tenantRows = rows.filter((row) => row.tenant === tenant);
      for (let index = 0; index < tenantRows.length; index += args.batchSize) {
        const batch = tenantRows.slice(index, index + args.batchSize);
        for (const row of batch) {
          if (row.action_or_skip !== "backfilled") {
            applied.push(row);
            continue;
          }
          await pool.query("begin");
          try {
            const already = await pool.query(
              `
                select 1
                from deliverable_lifecycle_events
                where deliverable_id = $1::uuid
                  and version = $2
                  and workflow_run_id = $3
                limit 1
              `,
              [row.deliverable_id, Number(row.version), args.workflowRunId],
            );
            if (already.rowCount) {
              await pool.query("commit");
              applied.push({ ...row, action_or_skip: "skipped:already_processed_for_workflow_run" });
              continue;
            }
            const origin = row.requires_revalidation === "false" ? "client_uploaded" : "ai_generated";
            await pool.query(
              `
                insert into deliverable_lifecycle_events
                  (deliverable_id, version, workflow_run_id, event_type, origin, reviewer_role_code,
                   reviewer_name, approval_scope, backfill)
                values ($1::uuid, $2, $3, 'version_created', $4, 'artifact_owner',
                        'legacy lifecycle backfill', $5, true)
              `,
              [row.deliverable_id, Number(row.version), args.workflowRunId, origin, row.reason],
            );
            await pool.query(
              `
                insert into deliverable_lifecycle_events
                  (deliverable_id, version, workflow_run_id, event_type, reviewer_role_code,
                   reviewer_name, approval_scope, decision, backfill, decided_at)
                values ($1::uuid, $2, $3, 'marked_authoritative', 'abarva_quality',
                        'legacy lifecycle backfill', $4, 'human_approved', true, now())
              `,
              [row.deliverable_id, Number(row.version), args.workflowRunId, row.reason],
            );
            await pool.query(
              `
                update deliverables_v2
                set authoritative_lifecycle_state = 'human_approved',
                    authoritative_flag_source = 'legacy_backfill',
                    requires_revalidation = $2,
                    signed_off_version = $3,
                    updated_at = now()
                where id = $1::uuid
              `,
              [row.deliverable_id, row.requires_revalidation === "true", Number(row.version)],
            );
            await pool.query("commit");
            applied.push(row);
          } catch (error) {
            await pool.query("rollback");
            applied.push({
              ...row,
              action_or_skip: `failed:${error instanceof Error ? error.message : String(error)}`,
            });
          }
        }
      }
    } finally {
      await pool.query("select pg_advisory_unlock(hashtext($1))", [`${tenant}:moves_lifecycle_backfill`]);
    }
  }
  return applied;
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  const outDir = path.join(args.outDir, args.workflowRunId);
  fs.mkdirSync(outDir, { recursive: true });
  const hash = migrationHash();
  const pool = new Pool({
    connectionString: connectionString(),
    ssl: connectionString().includes("localhost") ? false : { rejectUnauthorized: false },
    max: 2,
  });
  try {
    await assertSchemaReady(pool);
    const candidates = (
      await Promise.all(args.tenants.map((tenant) => candidatesForTenant(pool, tenant)))
    ).flat();
    const predicted = candidates.map(classifyCandidate);
    const rows = args.mode === "apply" ? await applyReport(pool, predicted, args) : predicted;
    const counts = rows.reduce<Record<string, number>>((acc, row) => {
      acc[row.action_or_skip] = (acc[row.action_or_skip] ?? 0) + 1;
      return acc;
    }, {});
    const summary = {
      status: rows.some((row) => row.action_or_skip.startsWith("failed:")) ? "FAIL" : "PASS",
      mode: args.mode,
      workflowRunId: args.workflowRunId,
      reviewedReportId: args.reviewedReportId,
      tenants: args.tenants,
      migrationHash: hash,
      candidateCount: candidates.length,
      counts,
    };
    fs.writeFileSync(path.join(outDir, "summary.json"), `${JSON.stringify(summary, null, 2)}\n`);
    writeCsv(path.join(outDir, "candidate-report.csv"), rows);
    fs.writeFileSync(
      path.join(outDir, "summary.md"),
      [
        "# Moves Deliverable Lifecycle Backfill",
        "",
        `Status: ${summary.status}`,
        `Mode: ${args.mode}`,
        `Workflow run id: ${args.workflowRunId}`,
        `Reviewed report id: ${args.reviewedReportId ?? "n/a"}`,
        `Tenants: ${args.tenants.join(", ")}`,
        `Migration hash: ${hash}`,
        `Candidates: ${candidates.length}`,
        "",
        "## Counts",
        "",
        ...Object.entries(counts).map(([key, value]) => `- ${key}: ${value}`),
        "",
      ].join("\n"),
    );
    console.log(JSON.stringify(summary, null, 2));
    if (summary.status !== "PASS") process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
