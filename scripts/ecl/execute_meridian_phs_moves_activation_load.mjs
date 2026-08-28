#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import process from "node:process";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "../..");
const DEFAULT_OUT_DIR = "job-output/meridian-phs-moves-activation-load";
const DEFAULT_CLIENT_ID = "d2e9b6f4-8c25-43a9-b8e0-7d2f41f0a612";
const DEFAULT_ASSESSMENT_ID = "meridian-phs-demo-readiness";
const DEFAULT_AS_OF_DATE = "2026-08-28";
const TENANT_KEY = "meridian-health";
const ACTIVATION_BASIS = "meridian_phs_demo_moves_activation_plan";
const TRUTHY = new Set(["1", "true", "yes", "on"]);
const ALLOWED_TARGETS = new Set(["lab", "preprod", "lab_preprod", "client_preprod", "local_disposable"]);
const PROOF_BEGIN = "__SEMANTIC2_PROOF_TGZ_BEGIN__";
const PROOF_END = "__SEMANTIC2_PROOF_TGZ_END__";

const EXPECTED_ROWS = {
  engagements: 38,
  program_modules: 228,
  program_milestones: 228,
  program_work_items: 228,
  program_risks: 38,
  pattern_match_logs: 38,
};

function parseArgs(argv) {
  const args = {
    outDir: process.env.MERIDIAN_PHS_MOVES_ACTIVATION_OUT_DIR || DEFAULT_OUT_DIR,
    clientId: process.env.MERIDIAN_PHS_MOVES_CLIENT_ID || DEFAULT_CLIENT_ID,
    assessmentId: process.env.MERIDIAN_PHS_MOVES_ASSESSMENT_ID || DEFAULT_ASSESSMENT_ID,
    asOfDate: process.env.MERIDIAN_PHS_MOVES_AS_OF_DATE || DEFAULT_AS_OF_DATE,
    databaseUrl: process.env.DATABASE_URL || "",
    mode: process.env.MERIDIAN_PHS_MOVES_ACTIVATION_MODE || "",
    approved: TRUTHY.has(String(process.env.MERIDIAN_PHS_MOVES_ACTIVATION_APPROVED || "").toLowerCase()),
    targetClassification: process.env.MERIDIAN_PHS_MOVES_TARGET_DATA_PLANE || "",
    emitProofBundle: process.env.EMIT_ACA_PROOF_BUNDLE !== "false",
    proveIdempotency: process.env.MERIDIAN_PHS_MOVES_PROVE_IDEMPOTENCY !== "false",
    planOnly: false,
    json: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const next = () => {
      index += 1;
      if (index >= argv.length) throw new Error(`${arg} requires a value`);
      return argv[index];
    };
    if (arg === "--out-dir") args.outDir = next();
    else if (arg === "--client-id") args.clientId = next();
    else if (arg === "--assessment-id") args.assessmentId = next();
    else if (arg === "--as-of-date") args.asOfDate = next();
    else if (arg === "--target-classification") args.targetClassification = next();
    else if (arg === "--mode") args.mode = next();
    else if (arg === "--approved") args.approved = true;
    else if (arg === "--database-url") args.databaseUrl = next();
    else if (arg === "--plan-only") args.planOnly = true;
    else if (arg === "--no-proof-bundle") args.emitProofBundle = false;
    else if (arg === "--no-idempotency-proof") args.proveIdempotency = false;
    else if (arg === "--json") args.json = true;
    else if (arg === "--help") {
      console.log(`Usage: node scripts/ecl/execute_meridian_phs_moves_activation_load.mjs [options]

Governed Meridian/PHS Moves activation load entrypoint for ACA operator jobs.

Required for execution:
  DATABASE_URL
  MERIDIAN_PHS_MOVES_ACTIVATION_MODE=execute
  MERIDIAN_PHS_MOVES_ACTIVATION_APPROVED=true
  MERIDIAN_PHS_MOVES_TARGET_DATA_PLANE=lab|preprod|lab_preprod|client_preprod|local_disposable

Options:
  --out-dir <dir>                 Proof output directory.
  --client-id <uuid>              Meridian client id.
  --assessment-id <id>            Activation assessment id.
  --as-of-date <date>             Pinned as-of date.
  --target-classification <name>  Target data-plane classification.
  --mode execute                  Required for mutation.
  --approved                      Required for mutation.
  --plan-only                     Generate package and refusal/plan only; no database.
  --no-idempotency-proof          Skip second execution of the same SQL.
  --no-proof-bundle               Do not emit ACA proof bundle markers.
  --json                          Print summary JSON.`);
      process.exit(0);
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }
  return args;
}

function nowIso() {
  return new Date().toISOString();
}

function writeJson(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function sha256File(file) {
  return crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
}

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: ROOT,
    encoding: "utf8",
    env: {
      ...process.env,
      LC_ALL: process.env.LC_ALL || "C.UTF-8",
      LANG: process.env.LANG || "C.UTF-8",
    },
    maxBuffer: 128 * 1024 * 1024,
    ...options,
  });
  if (result.status !== 0) {
    throw new Error(`${command} ${args.join(" ")} failed\nSTDOUT:\n${result.stdout}\nSTDERR:\n${result.stderr}`);
  }
  return result;
}

function executionIssues(args) {
  if (args.planOnly) return [];
  const issues = [];
  if (args.mode !== "execute") issues.push("MERIDIAN_PHS_MOVES_ACTIVATION_MODE_must_be_execute");
  if (!args.approved) issues.push("MERIDIAN_PHS_MOVES_ACTIVATION_APPROVED_must_be_true");
  if (!ALLOWED_TARGETS.has(args.targetClassification)) {
    issues.push("MERIDIAN_PHS_MOVES_TARGET_DATA_PLANE_not_allowed_or_missing");
  }
  if (!args.databaseUrl) issues.push("DATABASE_URL_missing");
  if (args.databaseUrl && /prod/i.test(args.databaseUrl) && !["preprod", "client_preprod"].includes(args.targetClassification)) {
    issues.push("DATABASE_URL_contains_prod_without_preprod_classification");
  }
  return issues;
}

function buildActivationPackage(args, outDir) {
  const sourceRoomDir = path.join(outDir, "source-room");
  const activationDir = path.join(outDir, "activation");
  run("python3", [
    "scripts/ecl/generate_dense_source_room_extracts.py",
    "--profile",
    TENANT_KEY,
    "--out-dir",
    sourceRoomDir,
  ]);
  const plan = run("node", [
    "scripts/ecl/write_meridian_phs_moves_activation_plan.mjs",
    "--source-room-dir",
    sourceRoomDir,
    "--out-dir",
    activationDir,
    "--client-id",
    args.clientId,
    "--assessment-id",
    args.assessmentId,
    "--as-of-date",
    args.asOfDate,
    "--json",
  ]);
  const summary = JSON.parse(plan.stdout);
  const sqlPath = path.join(ROOT, summary.output.sql);
  return {
    sourceRoomDir,
    activationDir,
    activationSummary: summary,
    sqlPath,
    sqlSha256: sha256File(sqlPath),
  };
}

function runPsql(databaseUrl, args, label) {
  const result = spawnSync("psql", [databaseUrl, "-v", "ON_ERROR_STOP=1", ...args], {
    cwd: ROOT,
    encoding: "utf8",
    env: {
      ...process.env,
      PGCONNECT_TIMEOUT: process.env.PGCONNECT_TIMEOUT || "30",
      LC_ALL: process.env.LC_ALL || "C.UTF-8",
      LANG: process.env.LANG || "C.UTF-8",
    },
    maxBuffer: 128 * 1024 * 1024,
  });
  if (result.status !== 0) {
    throw new Error(`psql ${label} failed\nSTDOUT:\n${result.stdout}\nSTDERR:\n${result.stderr}`);
  }
  return result.stdout;
}

function executeSql(databaseUrl, sqlPath, label) {
  runPsql(databaseUrl, ["-f", sqlPath], label);
}

function readback(databaseUrl, clientId) {
  const sql = `
with activated as (
  select id
  from public.engagements
  where client_id = :'client_id'
    and is_demo_data = true
    and charter ->> 'tenant_key' = :'tenant_key'
    and charter ->> 'activation_basis' = :'activation_basis'
)
select row_to_json(q)::text
from (
select
  (select count(*)::int from activated) as engagements,
  (select count(*)::int from public.program_modules where engagement_id in (select id from activated)) as program_modules,
  (select count(*)::int from public.program_milestones where engagement_id in (select id from activated)) as program_milestones,
  (select count(*)::int from public.program_work_items where engagement_id in (select id from activated)) as program_work_items,
  (select count(*)::int from public.program_risks where engagement_id in (select id from activated)) as program_risks,
  (select count(*)::int from public.pattern_match_logs where engagement_id in (select id from activated)) as pattern_match_logs,
  (select count(*)::int from public.engagements where id in (select id from activated) and value_verified_status <> 'pending') as claimable_value_rows,
  (select count(distinct solution)::int from public.engagements where id in (select id from activated)) as distinct_solutions,
  (select count(distinct id)::int from activated) as distinct_engagement_ids
) q;
`;
  const output = runPsql(
    databaseUrl,
    [
      "-At",
      "-v",
      `client_id=${clientId}`,
      "-v",
      `tenant_key=${TENANT_KEY}`,
      "-v",
      `activation_basis=${ACTIVATION_BASIS}`,
      "-c",
      sql,
    ],
    "readback",
  ).trim();
  const start = output.indexOf("{");
  const end = output.lastIndexOf("}");
  if (start === -1 || end <= start) throw new Error(`readback JSON missing: ${output.slice(0, 500)}`);
  return JSON.parse(output.slice(start, end + 1));
}

function validateReadback(actual, expected = EXPECTED_ROWS) {
  const issues = [];
  for (const [key, expectedValue] of Object.entries(expected)) {
    if (Number(actual[key] ?? -1) !== expectedValue) {
      issues.push(`${key}_expected_${expectedValue}_got_${actual[key] ?? "missing"}`);
    }
  }
  if (Number(actual.claimable_value_rows ?? -1) !== 0) issues.push("claimable_value_rows_should_be_zero");
  if (Number(actual.distinct_solutions ?? -1) !== expected.engagements) issues.push("distinct_solutions_should_match_engagements");
  if (Number(actual.distinct_engagement_ids ?? -1) !== expected.engagements) {
    issues.push("distinct_engagement_ids_should_match_engagements");
  }
  return issues;
}

function emitProofBundle(outDir) {
  const tarPath = path.join(os.tmpdir(), `meridian-phs-moves-activation-${Date.now()}.tgz`);
  try {
    run("tar", ["-czf", tarPath, "-C", path.dirname(outDir), path.basename(outDir)]);
    const encoded = fs.readFileSync(tarPath).toString("base64");
    console.log(PROOF_BEGIN);
    for (let index = 0; index < encoded.length; index += 76) {
      console.log(encoded.slice(index, index + 76));
    }
    console.log(PROOF_END);
  } finally {
    fs.rmSync(tarPath, { force: true });
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const outDir = path.resolve(ROOT, args.outDir);
  fs.mkdirSync(outDir, { recursive: true });

  const issues = executionIssues(args);
  if (issues.length) {
    const refusal = {
      accepted: false,
      actual_database_mutation: false,
      tenant_key: TENANT_KEY,
      client_id: args.clientId,
      issues,
      generated_at: nowIso(),
    };
    writeJson(path.join(outDir, "meridian_phs_moves_activation_refusal.json"), refusal);
    throw new Error(issues.join("; "));
  }

  const built = buildActivationPackage(args, outDir);
  const sql = fs.readFileSync(built.sqlPath, "utf8");

  if (args.planOnly) {
    const summary = {
      accepted: true,
      actual_database_mutation: false,
      plan_only: true,
      tenant_key: TENANT_KEY,
      client_id: args.clientId,
      activation_summary: built.activationSummary,
      sql_sha256: built.sqlSha256,
      generated_at: nowIso(),
    };
    writeJson(path.join(outDir, "meridian_phs_moves_activation_execute_summary.json"), summary);
    if (args.json) console.log(JSON.stringify(summary, null, 2));
    else console.log(JSON.stringify({ accepted: true, plan_only: true, moves: built.activationSummary.activation_program_count }, null, 2));
    return;
  }

  try {
    executeSql(args.databaseUrl, built.sqlPath, "apply_activation_sql");
    const firstReadback = readback(args.databaseUrl, args.clientId);
    const firstIssues = validateReadback(firstReadback, built.activationSummary.generated_rows);

    let secondReadback = null;
    let idempotencyIssues = [];
    if (args.proveIdempotency) {
      executeSql(args.databaseUrl, built.sqlPath, "apply_activation_sql_idempotency_second_run");
      secondReadback = readback(args.databaseUrl, args.clientId);
      idempotencyIssues = validateReadback(secondReadback, built.activationSummary.generated_rows);
      for (const key of Object.keys(EXPECTED_ROWS)) {
        if (Number(firstReadback[key] ?? -1) !== Number(secondReadback[key] ?? -2)) {
          idempotencyIssues.push(`${key}_changed_after_second_run`);
        }
      }
    }

    const allIssues = [...firstIssues, ...idempotencyIssues];
    const summary = {
      accepted: allIssues.length === 0,
      actual_database_mutation: true,
      tenant_key: TENANT_KEY,
      client_id: args.clientId,
      assessment_id: args.assessmentId,
      as_of_date: args.asOfDate,
      target_classification: args.targetClassification,
      activation_basis: ACTIVATION_BASIS,
      activation_summary: built.activationSummary,
      sql_sha256: built.sqlSha256,
      readback: firstReadback,
      idempotency_readback: secondReadback,
      idempotency_proven: args.proveIdempotency && idempotencyIssues.length === 0,
      issues: allIssues,
      proof_files: {
        summary: "meridian_phs_moves_activation_execute_summary.json",
        source_room_dir: path.relative(outDir, built.sourceRoomDir),
        activation_dir: path.relative(outDir, built.activationDir),
      },
      generated_at: nowIso(),
    };
    writeJson(path.join(outDir, "meridian_phs_moves_activation_execute_summary.json"), summary);
    if (args.emitProofBundle) emitProofBundle(outDir);
    if (args.json) console.log(JSON.stringify(summary, null, 2));
    else console.log(JSON.stringify({ accepted: summary.accepted, readback: summary.readback, issues: summary.issues }, null, 2));
    if (!summary.accepted) process.exitCode = 1;
  } catch (error) {
    throw error;
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
