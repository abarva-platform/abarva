#!/usr/bin/env tsx

import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import dotenv from "dotenv";
import { Client } from "pg";

dotenv.config();
dotenv.config({ path: ".env.local", override: false });

type Args = {
  execute: boolean;
  purgeLinkedRecords: boolean;
  selfTest: boolean;
  tenants: string[];
  outDir: string;
  operator: string;
  reason: string;
};

type MoveRow = {
  id: string;
  client_id: string;
  client_name: string | null;
  client_slug: string | null;
  tenant_key: string;
  solution: string;
  status: string | null;
  lifecycle_state: string | null;
  current_phase: number | null;
  created_at: string | null;
};

type SnapshotSpec = {
  file: string;
  table: string;
  sql: string;
  params?: unknown[];
};

const PROOF_BEGIN = "__SEMANTIC2_PROOF_TGZ_BEGIN__";
const PROOF_END = "__SEMANTIC2_PROOF_TGZ_END__";

function usage() {
  return `Usage:
  npx tsx scripts/ops/archive-existing-moves.ts [options]

Default is dry-run: snapshot and report only.

Options:
  --execute                Mutate the data plane.
  --purge-linked-records   Delete linked Move workspace/input/deliverable rows after snapshot.
                           Without this flag, attachments are soft-deleted and move_artifacts are retired.
  --tenant <key-or-name>   Limit to tenant slug/name/client_id. Repeatable. Default: all tenants.
  --out-dir <path>         Proof output folder. Default: reports/moves-archive/<timestamp>.
  --operator <id>          Audit actor. Default: ABARVA_OPERATOR_ID or codex-operator.
  --reason <text>          Archive rationale.
  --self-test              Run parser/report/proof-bundle self-test without a DB.
  --help                   Show this help.
`;
}

function stamp() {
  return new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

function parseArgs(argv: string[]): Args {
  const args: Args = {
    execute: false,
    purgeLinkedRecords: false,
    selfTest: false,
    tenants: [],
    outDir: path.join("reports", "moves-archive", stamp()),
    operator: process.env.ABARVA_OPERATOR_ID || "codex-operator",
    reason: "operator_archive_existing_moves_reset",
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    const next = () => {
      i += 1;
      if (i >= argv.length) throw new Error(`${arg} requires a value`);
      return argv[i];
    };

    if (arg === "--help" || arg === "-h") {
      console.log(usage());
      process.exit(0);
    } else if (arg === "--execute") args.execute = true;
    else if (arg === "--purge-linked-records") args.purgeLinkedRecords = true;
    else if (arg === "--self-test") args.selfTest = true;
    else if (arg === "--tenant") args.tenants.push(next());
    else if (arg === "--out-dir") args.outDir = next();
    else if (arg === "--operator") args.operator = next();
    else if (arg === "--reason") args.reason = next();
    else throw new Error(`Unknown argument: ${arg}`);
  }

  return args;
}

function splitEnvArgs(value: string | undefined) {
  if (!value) return [];
  const args: string[] = [];
  let current = "";
  let quote: '"' | "'" | null = null;
  for (const char of value) {
    if ((char === '"' || char === "'") && quote === null) {
      quote = char;
      continue;
    }
    if (char === quote) {
      quote = null;
      continue;
    }
    if (!quote && /\s/.test(char)) {
      if (current) args.push(current);
      current = "";
      continue;
    }
    current += char;
  }
  if (quote) throw new Error("Unclosed quote in ARCHIVE_EXISTING_MOVES_ARGS.");
  if (current) args.push(current);
  return args;
}

function ensureDir(dir: string) {
  fs.mkdirSync(dir, { recursive: true });
}

function writeJson(file: string, value: unknown) {
  ensureDir(path.dirname(file));
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`);
}

function writeText(file: string, value: string) {
  ensureDir(path.dirname(file));
  fs.writeFileSync(file, value);
}

function sha256File(file: string) {
  return crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
}

function databaseUrl() {
  return process.env.ABARVA_AZURE_DATABASE_URL || process.env.DATABASE_URL || "";
}

async function tableExists(client: Client, table: string) {
  const result = await client.query<{ exists: boolean }>("select to_regclass($1) is not null as exists", [
    `public.${table}`,
  ]);
  return result.rows[0]?.exists === true;
}

async function columnExists(client: Client, table: string, column: string) {
  const result = await client.query<{ exists: boolean }>(
    `select exists (
       select 1
       from information_schema.columns
       where table_schema = 'public' and table_name = $1 and column_name = $2
     ) as exists`,
    [table, column],
  );
  return result.rows[0]?.exists === true;
}

function tenantPredicate(tenants: string[], startParam: number) {
  if (!tenants.length) return { sql: "", params: [] as unknown[] };
  const values = tenants.map((tenant) => tenant.toLowerCase());
  return {
    sql: ` and (
      lower(coalesce(c.slug, '')) = any($${startParam}::text[])
      or lower(coalesce(c.name, '')) = any($${startParam}::text[])
      or lower(e.client_id::text) = any($${startParam}::text[])
    )`,
    params: [values],
  };
}

async function activeMoves(client: Client, tenants: string[]) {
  const lifecycle = (await columnExists(client, "engagements", "lifecycle_state"))
    ? " and coalesce(e.lifecycle_state, '') <> 'archived'"
    : "";
  const archived = (await columnExists(client, "engagements", "archived_at")) ? " and e.archived_at is null" : "";
  const deleted = (await columnExists(client, "engagements", "deleted_at")) ? " and e.deleted_at is null" : "";
  const tenant = tenantPredicate(tenants, 1);
  const sql = `
    select
      e.id::text,
      e.client_id::text,
      c.name as client_name,
      c.slug as client_slug,
      coalesce(c.slug, c.name, e.client_id::text) as tenant_key,
      e.solution,
      e.status,
      ${await columnExists(client, "engagements", "lifecycle_state") ? "e.lifecycle_state" : "null::text as lifecycle_state"},
      e.current_phase,
      ${await columnExists(client, "engagements", "created_at") ? "e.created_at::text" : "null::text as created_at"}
    from public.engagements e
    left join public.clients c on c.id::text = e.client_id::text
    where true
      ${deleted}
      ${archived}
      ${lifecycle}
      ${tenant.sql}
    order by c.name nulls last, e.solution
  `;
  const result = await client.query<MoveRow>(sql, tenant.params);
  return result.rows;
}

function linkedSnapshotSpecs(moveIds: string[]): SnapshotSpec[] {
  const ids = [moveIds];
  return [
    {
      file: "engagements.json",
      table: "engagements",
      sql: "select * from public.engagements where id = any($1::uuid[]) order by id",
      params: ids,
    },
    {
      file: "engagement_phases.json",
      table: "engagement_phases",
      sql: "select * from public.engagement_phases where engagement_id = any($1::uuid[]) order by engagement_id, phase_number",
      params: ids,
    },
    {
      file: "phase_workstreams.json",
      table: "phase_workstreams",
      sql: `select ws.*
            from public.phase_workstreams ws
            join public.engagement_phases ep on ep.id = ws.phase_id
            where ep.engagement_id = any($1::uuid[])
            order by ws.phase_id, ws.order_index nulls last`,
      params: ids,
    },
    {
      file: "workstream_messages.json",
      table: "workstream_messages",
      sql: `select wm.*
            from public.workstream_messages wm
            join public.phase_workstreams ws on ws.id = wm.workstream_id
            join public.engagement_phases ep on ep.id = ws.phase_id
            where ep.engagement_id = any($1::uuid[])
            order by wm.created_at`,
      params: ids,
    },
    {
      file: "phase_findings.json",
      table: "phase_findings",
      sql: `select pf.*
            from public.phase_findings pf
            join public.engagement_phases ep on ep.id = pf.phase_id
            where ep.engagement_id = any($1::uuid[])
            order by pf.created_at`,
      params: ids,
    },
    {
      file: "finding_versions.json",
      table: "finding_versions",
      sql: `select fv.*
            from public.finding_versions fv
            join public.phase_findings pf on pf.id = fv.finding_id
            join public.engagement_phases ep on ep.id = pf.phase_id
            where ep.engagement_id = any($1::uuid[])
            order by fv.changed_at`,
      params: ids,
    },
    {
      file: "finding_comments.json",
      table: "finding_comments",
      sql: `select fc.*
            from public.finding_comments fc
            join public.phase_findings pf on pf.id = fc.finding_id
            join public.engagement_phases ep on ep.id = pf.phase_id
            where ep.engagement_id = any($1::uuid[])
            order by fc.created_at`,
      params: ids,
    },
    {
      file: "phase_outputs.json",
      table: "phase_outputs",
      sql: `select po.*
            from public.phase_outputs po
            join public.engagement_phases ep on ep.id = po.phase_id
            where ep.engagement_id = any($1::uuid[])
            order by po.created_at`,
      params: ids,
    },
    {
      file: "output_versions.json",
      table: "output_versions",
      sql: `select ov.*
            from public.output_versions ov
            join public.phase_outputs po on po.id = ov.output_id
            join public.engagement_phases ep on ep.id = po.phase_id
            where ep.engagement_id = any($1::uuid[])
            order by ov.published_at`,
      params: ids,
    },
    {
      file: "output_comments.json",
      table: "output_comments",
      sql: `select oc.*
            from public.output_comments oc
            join public.phase_outputs po on po.id = oc.output_id
            join public.engagement_phases ep on ep.id = po.phase_id
            where ep.engagement_id = any($1::uuid[])
            order by oc.created_at`,
      params: ids,
    },
    {
      file: "phase_approvals.json",
      table: "phase_approvals",
      sql: `select pa.*
            from public.phase_approvals pa
            join public.engagement_phases ep on ep.id = pa.phase_id
            where ep.engagement_id = any($1::uuid[])
            order by pa.created_at`,
      params: ids,
    },
    {
      file: "engagement_uploads.json",
      table: "engagement_uploads",
      sql: "select * from public.engagement_uploads where engagement_id = any($1::uuid[]) order by created_at",
      params: ids,
    },
    {
      file: "deliverables_v2.json",
      table: "deliverables_v2",
      sql: "select * from public.deliverables_v2 where engagement_id = any($1::uuid[]) order by created_at",
      params: ids,
    },
    {
      file: "deliverable_versions.json",
      table: "deliverable_versions",
      sql: `select dv.*
            from public.deliverable_versions dv
            join public.deliverables_v2 d on d.id = dv.deliverable_id
            where d.engagement_id = any($1::uuid[])
            order by dv.generated_at`,
      params: ids,
    },
    {
      file: "engagement_deliverables.json",
      table: "engagement_deliverables",
      sql: "select * from public.engagement_deliverables where engagement_id = any($1::uuid[]) order by created_at",
      params: ids,
    },
    {
      file: "program_evidence_items.json",
      table: "program_evidence_items",
      sql: "select * from public.program_evidence_items where program_id = any($1::uuid[]) order by created_at",
      params: ids,
    },
    {
      file: "program_attachments.json",
      table: "program_attachments",
      sql: "select * from public.program_attachments where program_id = any($1::uuid[]) order by created_at",
      params: ids,
    },
    {
      file: "move_artifacts.json",
      table: "move_artifacts",
      sql: "select * from public.move_artifacts where move_id = any($1::uuid[]) order by created_at",
      params: ids,
    },
    {
      file: "program_approval_requests.json",
      table: "program_approval_requests",
      sql: "select * from public.program_approval_requests where program_id = any($1::uuid[]) order by requested_at",
      params: ids,
    },
    {
      file: "program_origination_drafts.json",
      table: "program_origination_drafts",
      sql: "select * from public.program_origination_drafts where committed_engagement_id = any($1::uuid[]) order by updated_at",
      params: ids,
    },
    ...[
      "engagement_activity",
      "genome_matches",
      "phase0_scores",
      "engagement_baseline",
      "engagement_participants",
      "program_threads",
      "maestro_oversight_flags",
      "phase_snapshots",
      "module_state_log",
      "founder_approval_requests",
      "pattern_match_logs",
      "program_modules",
      "program_milestones",
      "program_work_items",
      "program_risks",
    ].map((table) => ({
      file: `${table}.json`,
      table,
      sql: `select * from public.${table} where engagement_id = any($1::uuid[]) order by 1`,
      params: ids,
    })),
  ];
}

async function snapshot(client: Client, outDir: string, moveIds: string[]) {
  const snapshotsDir = path.join(outDir, "snapshots");
  const counts: Record<string, number | "missing"> = {};
  const storageRefs: Array<Record<string, unknown>> = [];
  const queryWarnings: Array<Record<string, string>> = [];

  for (const spec of linkedSnapshotSpecs(moveIds)) {
    if (!(await tableExists(client, spec.table))) {
      counts[spec.table] = "missing";
      continue;
    }
    let result;
    try {
      result = await client.query(spec.sql, spec.params ?? []);
    } catch (error) {
      const code = typeof error === "object" && error !== null ? String((error as { code?: unknown }).code ?? "") : "";
      if (code !== "42703" || !/\border by\b/i.test(spec.sql)) {
        throw error;
      }

      const unorderedSql = spec.sql.replace(/\s+order\s+by\s+[^;]+$/i, "");
      queryWarnings.push({
        table: spec.table,
        reason: "Snapshot query retried without ORDER BY because the deployed table lacks the requested ordering column.",
      });
      result = await client.query(unorderedSql, spec.params ?? []);
    }
    counts[spec.table] = result.rowCount ?? 0;
    writeJson(path.join(snapshotsDir, spec.file), result.rows);

    if (spec.table === "program_attachments") {
      for (const row of result.rows as Array<Record<string, unknown>>) {
        storageRefs.push({
          sourceTable: "program_attachments",
          id: row.id,
          storagePath: row.storage_path,
          fileName: row.original_name,
          mimeType: row.mime_type,
        });
      }
    }
    if (spec.table === "move_artifacts") {
      for (const row of result.rows as Array<Record<string, unknown>>) {
        storageRefs.push({
          sourceTable: "move_artifacts",
          id: row.artifact_id,
          blobContainer: row.blob_container,
          blobPath: row.blob_path,
          fileName: row.file_name,
          fileFormat: row.file_format,
        });
      }
    }
    if (spec.table === "engagement_uploads") {
      for (const row of result.rows as Array<Record<string, unknown>>) {
        storageRefs.push({
          sourceTable: "engagement_uploads",
          id: row.id,
          fileUrl: row.file_url,
          fileName: row.file_name,
          fileType: row.file_type,
        });
      }
    }
  }

  writeJson(path.join(outDir, "linked-record-counts.json"), counts);
  writeJson(path.join(outDir, "storage-paths.json"), storageRefs);
  if (queryWarnings.length) {
    writeJson(path.join(outDir, "snapshot-query-warnings.json"), queryWarnings);
  }
  return { counts, storageRefs };
}

async function deleteIfExists(client: Client, table: string, sql: string, params: unknown[]) {
  if (!(await tableExists(client, table))) return { table, affected: "missing" as const };
  const result = await client.query(sql, params);
  return { table, affected: result.rowCount ?? 0 };
}

async function mutate(client: Client, args: Args, moveIds: string[], runId: string) {
  const now = new Date().toISOString();
  const results: Array<Record<string, unknown>> = [];

  await client.query("begin");
  try {
    if (await tableExists(client, "program_audit_log")) {
      await client.query(
        `insert into public.program_audit_log (
           tenant_key, program_id, engagement_id, actor_id, actor_role,
           action, from_state, to_state, rationale, evidence_refs, created_at
         )
         select
           coalesce(c.slug, c.name, e.client_id::text),
           e.id::text,
           e.id,
           null,
           $2,
           'archive_existing_moves_and_remove_linked_content',
           coalesce(e.lifecycle_state, e.status),
           'archived',
           $3,
           array[$4]::text[],
           $5::timestamptz
         from public.engagements e
         left join public.clients c on c.id::text = e.client_id::text
         where e.id = any($1::uuid[])`,
        [moveIds, args.operator, args.reason, `moves-archive-run:${runId}`, now],
      );
    }

    const archive = await client.query(
      `update public.engagements e
          set lifecycle_state = 'archived',
              status = case when status = 'archived' then status else status end,
              archived_at = coalesce(archived_at, $2::timestamptz),
              archived_by = $3,
              archive_reason = $4,
              archive_explanation = $5,
              archived_from_state = case
                when coalesce(lifecycle_state, '') = 'archived' then archived_from_state
                else coalesce(lifecycle_state, status)
              end
        where e.id = any($1::uuid[])
          and coalesce(e.lifecycle_state, '') <> 'archived'`,
      [
        moveIds,
        now,
        args.operator,
        "operator_reset",
        `Archived by archive-existing-moves run ${runId}; linked Move runtime content ${args.purgeLinkedRecords ? "purged" : "retired/soft-deleted"} after snapshot.`,
      ],
    );
    results.push({ table: "engagements", action: "archive", affected: archive.rowCount ?? 0 });

    if (args.purgeLinkedRecords) {
      results.push(
        await deleteIfExists(
          client,
          "deliverable_versions",
          `delete from public.deliverable_versions dv
           using public.deliverables_v2 d
           where d.id = dv.deliverable_id and d.engagement_id = any($1::uuid[])`,
          [moveIds],
        ),
      );
      results.push(
        await deleteIfExists(client, "program_evidence_items", "delete from public.program_evidence_items where program_id = any($1::uuid[])", [
          moveIds,
        ]),
      );
      for (const [table, sql] of [
        ["engagement_deliverables", "delete from public.engagement_deliverables where engagement_id = any($1::uuid[])"],
        ["deliverables_v2", "delete from public.deliverables_v2 where engagement_id = any($1::uuid[])"],
        ["program_attachments", "delete from public.program_attachments where program_id = any($1::uuid[])"],
        ["move_artifacts", "delete from public.move_artifacts where move_id = any($1::uuid[])"],
        ["program_approval_requests", "delete from public.program_approval_requests where program_id = any($1::uuid[])"],
        ["program_origination_drafts", "delete from public.program_origination_drafts where committed_engagement_id = any($1::uuid[])"],
        ["engagement_activity", "delete from public.engagement_activity where engagement_id = any($1::uuid[])"],
        ["engagement_uploads", "delete from public.engagement_uploads where engagement_id = any($1::uuid[])"],
        ["genome_matches", "delete from public.genome_matches where engagement_id = any($1::uuid[])"],
        ["phase0_scores", "delete from public.phase0_scores where engagement_id = any($1::uuid[])"],
        ["engagement_baseline", "delete from public.engagement_baseline where engagement_id = any($1::uuid[])"],
        ["engagement_participants", "delete from public.engagement_participants where engagement_id = any($1::uuid[])"],
        ["program_threads", "delete from public.program_threads where engagement_id = any($1::uuid[])"],
        ["maestro_oversight_flags", "delete from public.maestro_oversight_flags where engagement_id = any($1::uuid[])"],
        ["phase_snapshots", "delete from public.phase_snapshots where engagement_id = any($1::uuid[])"],
        ["module_state_log", "delete from public.module_state_log where engagement_id = any($1::uuid[])"],
        ["founder_approval_requests", "delete from public.founder_approval_requests where engagement_id = any($1::uuid[])"],
        ["pattern_match_logs", "delete from public.pattern_match_logs where engagement_id = any($1::uuid[])"],
        ["program_modules", "delete from public.program_modules where engagement_id = any($1::uuid[])"],
        ["program_milestones", "delete from public.program_milestones where engagement_id = any($1::uuid[])"],
        ["program_work_items", "delete from public.program_work_items where engagement_id = any($1::uuid[])"],
        ["program_risks", "delete from public.program_risks where engagement_id = any($1::uuid[])"],
        ["engagement_phases", "delete from public.engagement_phases where engagement_id = any($1::uuid[])"],
      ] as const) {
        results.push(await deleteIfExists(client, table, sql, [moveIds]));
      }
    } else {
      if (await tableExists(client, "program_attachments") && (await columnExists(client, "program_attachments", "deleted_at"))) {
        const attachments = await client.query(
          "update public.program_attachments set deleted_at = coalesce(deleted_at, $2::timestamptz) where program_id = any($1::uuid[]) and deleted_at is null",
          [moveIds, now],
        );
        results.push({ table: "program_attachments", action: "soft_delete", affected: attachments.rowCount ?? 0 });
      }
      if (await tableExists(client, "move_artifacts")) {
        const artifacts = await client.query(
          `update public.move_artifacts
              set lifecycle_state = 'retired',
                  status = case when status = 'retired' then status else 'retired' end,
                  metadata = coalesce(metadata, '{}'::jsonb) || jsonb_build_object('archivedByRunId', $2, 'archivedBy', $3, 'archivedAt', $4::text),
                  updated_at = $4::timestamptz
            where move_id = any($1::uuid[])`,
          [moveIds, runId, args.operator, now],
        );
        results.push({ table: "move_artifacts", action: "retire", affected: artifacts.rowCount ?? 0 });
      }
    }

    await client.query("commit");
  } catch (error) {
    await client.query("rollback");
    throw error;
  }

  return results;
}

async function verify(client: Client, tenants: string[], beforeMoveIds: string[]) {
  const after = await activeMoves(client, tenants);
  const remaining = after.filter((move) => beforeMoveIds.includes(move.id));
  return {
    activeMovesRemainingInScope: after.length,
    archivedMoveIdsStillActive: remaining.map((move) => move.id),
  };
}

function writeSummary(outDir: string, args: Args, runId: string, moves: MoveRow[], counts: Record<string, unknown>, mutation?: unknown, verification?: unknown) {
  const tenantText = args.tenants.length ? args.tenants.join(", ") : "all tenants";
  const summary = `# Existing Moves Archive Proof

Run ID: \`${runId}\`

Mode: \`${args.execute ? "EXECUTE" : "DRY_RUN"}\`
Tenant scope: \`${tenantText}\`
Linked record removal: \`${args.purgeLinkedRecords ? "purge linked records" : "soft-delete/retire only"}\`
Operator: \`${args.operator}\`
Reason: \`${args.reason}\`

## Moves in scope

${moves.length === 0 ? "No active Moves were in scope." : moves.map((move) => `- ${move.tenant_key}: ${move.solution} (${move.id})`).join("\n")}

## Linked record snapshot counts

${Object.entries(counts)
  .map(([table, count]) => `- ${table}: ${count}`)
  .join("\n")}

## Mutation result

${mutation ? `\`\`\`json\n${JSON.stringify(mutation, null, 2)}\n\`\`\`` : "Dry-run only; no mutation attempted."}

## Verification

${verification ? `\`\`\`json\n${JSON.stringify(verification, null, 2)}\n\`\`\`` : "Not run in dry-run mode."}

## Audit boundary

The top-level \`engagements\` rows are archived, not hard-deleted. Immutable \`program_audit_log\` rows are retained. Blob paths are captured in \`storage-paths.json\`; blob deletion is intentionally a separate retention job.
`;
  writeText(path.join(outDir, "summary.md"), summary);
}

function emitProofBundle(outDir: string) {
  const tarPath = path.join(os.tmpdir(), `moves-archive-proof-${path.basename(outDir)}.tgz`);
  execFileSync("tar", ["-czf", tarPath, "-C", path.dirname(outDir), path.basename(outDir)]);
  const payload = fs.readFileSync(tarPath).toString("base64");
  console.log(PROOF_BEGIN);
  for (let i = 0; i < payload.length; i += 76) console.log(payload.slice(i, i + 76));
  console.log(PROOF_END);
  return {
    tarPath,
    sha256: sha256File(tarPath),
    bytes: fs.statSync(tarPath).size,
  };
}

function selfTest(args: Args) {
  const outDir = path.resolve(args.outDir);
  ensureDir(outDir);
  const runId = `self-test-${stamp()}`;
  const moves: MoveRow[] = [
    {
      id: "00000000-0000-0000-0000-000000000001",
      client_id: "client-demo",
      client_name: "Demo Tenant",
      client_slug: "demo-tenant",
      tenant_key: "demo-tenant",
      solution: "Demo Move",
      status: "active",
      lifecycle_state: "approved",
      current_phase: 2,
      created_at: new Date().toISOString(),
    },
  ];
  const counts = {
    engagements: 1,
    deliverables_v2: 2,
    program_attachments: 3,
    move_artifacts: 4,
  };
  writeJson(path.join(outDir, "moves-in-scope.json"), moves);
  writeJson(path.join(outDir, "linked-record-counts.json"), counts);
  writeJson(path.join(outDir, "storage-paths.json"), [
    { sourceTable: "program_attachments", storagePath: "program-attachments/demo-tenant/demo.pdf" },
  ]);
  writeSummary(outDir, args, runId, moves, counts);
  const bundle = emitProofBundle(outDir);
  writeJson(path.join(outDir, "self-test.json"), { ok: true, bundle });
  console.log(`Self-test proof written to ${outDir}`);
}

async function main() {
  const args = parseArgs([...splitEnvArgs(process.env.ARCHIVE_EXISTING_MOVES_ARGS), ...process.argv.slice(2)]);
  if (args.selfTest) {
    selfTest(args);
    return;
  }

  const url = databaseUrl();
  if (!url) {
    throw new Error("ABARVA_AZURE_DATABASE_URL or DATABASE_URL is required.");
  }

  const outDir = path.resolve(args.outDir);
  ensureDir(outDir);
  const runId = `moves-archive-${stamp()}`;
  const client = new Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
  await client.connect();
  try {
    const moves = await activeMoves(client, args.tenants);
    const moveIds = moves.map((move) => move.id);
    writeJson(path.join(outDir, "moves-in-scope.json"), moves);
    writeJson(path.join(outDir, "run-config.json"), { ...args, runId, generatedAt: new Date().toISOString() });

    const { counts } = moveIds.length
      ? await snapshot(client, outDir, moveIds)
      : { counts: {} as Record<string, number | "missing"> };

    let mutation: unknown = null;
    let verification: unknown = null;
    if (args.execute && moveIds.length) {
      mutation = await mutate(client, args, moveIds, runId);
      verification = await verify(client, args.tenants, moveIds);
      writeJson(path.join(outDir, "mutation-result.json"), mutation);
      writeJson(path.join(outDir, "verification.json"), verification);
    }

    writeSummary(outDir, args, runId, moves, counts, mutation, verification);
    const bundle = emitProofBundle(outDir);
    writeJson(path.join(outDir, "proof-bundle.json"), bundle);

    console.log(
      JSON.stringify(
        {
          ok: true,
          mode: args.execute ? "execute" : "dry_run",
          movesInScope: moves.length,
          purgeLinkedRecords: args.purgeLinkedRecords,
          proofDir: outDir,
          proofBundle: bundle,
          verification,
        },
        null,
        2,
      ),
    );
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack || error.message : error);
  process.exit(1);
});
