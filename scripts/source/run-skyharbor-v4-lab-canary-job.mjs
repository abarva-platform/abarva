import { spawnSync } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { Client } from "pg";

const TENANT_KEY = process.env.SOURCE_V4_TENANT_KEY || "skyharbor_global";
const DATASET_ID =
  process.env.SOURCE_V4_DATASET_ID || "skyharbor-source-v4-202608";
const EXPECTED_ROWS = 195_960;
const EXPECTED_CONTRACTS = 100;
const EXPECTED_VENDORS = 60;
const EXPECTED_ANNUAL_VALUE = 1_480_500_000;
let activeOutDir = null;

function stamp() {
  return new Date()
    .toISOString()
    .replace(/[-:]/gu, "")
    .replace(/\.\d{3}Z$/u, "Z");
}

function parseArgs() {
  const args = process.argv.slice(2);
  const value = (name) => {
    const index = args.indexOf(name);
    if (index >= 0) return args[index + 1];
    return args
      .find((arg) => arg.startsWith(`${name}=`))
      ?.slice(name.length + 1);
  };
  return {
    planOnly:
      args.includes("--plan-only") ||
      process.env.SOURCE_V4_JOB_PLAN_ONLY === "true",
    emitProofBundle: !args.includes("--no-emit-proof-bundle"),
    outDir:
      value("--out-dir") ||
      process.env.SOURCE_V4_JOB_OUT_DIR ||
      path.join(os.tmpdir(), `skyharbor-source-v4-lab-canary-${stamp()}`),
  };
}

function databaseUrl() {
  return (
    process.env.SOURCE_CONTEXT_DATABASE_URL ||
    process.env.AZURE_LAB_DATABASE_URL ||
    process.env.LAB_DATABASE_URL ||
    process.env.ABARVA_AZURE_DATABASE_URL ||
    process.env.AZURE_DATABASE_URL ||
    process.env.DATABASE_URL
  );
}

function clientOptions(connectionString) {
  return {
    connectionString,
    application_name: "skyharbor-v4-lab-canary-job-readback",
    connectionTimeoutMillis: Number(process.env.PG_CONNECT_TIMEOUT_MS || 15000),
    query_timeout: Number(process.env.PG_QUERY_TIMEOUT_MS || 120000),
    statement_timeout: Number(process.env.PG_STATEMENT_TIMEOUT_MS || 120000),
    ssl: connectionString.includes("sslmode=disable")
      ? false
      : { rejectUnauthorized: true },
  };
}

function sha256(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function quoteIdent(value) {
  return `"${String(value).replace(/"/gu, '""')}"`;
}

function writeJson(file, value) {
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`);
}

function tailText(value, maxLength = 12000) {
  const text = String(value || "");
  return text.length <= maxLength ? text : text.slice(text.length - maxLength);
}

function runStep(name, command, args, options) {
  const startedAt = new Date().toISOString();
  const result = spawnSync(command, args, {
    cwd: process.cwd(),
    env: { ...process.env, ...(options.env || {}) },
    encoding: "utf8",
    maxBuffer: 1024 * 1024 * 64,
  });
  const finishedAt = new Date().toISOString();
  const record = {
    name,
    command,
    args,
    status: result.status,
    signal: result.signal,
    startedAt,
    finishedAt,
    stdoutPath: path.join(options.outDir, `${name}.stdout.txt`),
    stderrPath: path.join(options.outDir, `${name}.stderr.txt`),
  };
  fs.writeFileSync(record.stdoutPath, result.stdout || "");
  fs.writeFileSync(record.stderrPath, result.stderr || "");
  writeJson(path.join(options.outDir, `${name}.json`), record);
  if (result.status !== 0) {
    console.error(
      JSON.stringify(
        {
          event: "skyharbor_v4_lab_canary_step_failed",
          step: name,
          status: result.status,
          signal: result.signal,
          error: result.error?.message || null,
          stdout_tail: tailText(result.stdout),
          stderr_tail: tailText(result.stderr),
          stdout_path: record.stdoutPath,
          stderr_path: record.stderrPath,
        },
        null,
        2,
      ),
    );
    throw new Error(
      `${name} failed with status ${result.status}, signal ${result.signal || "none"}. See ${record.stderrPath}`,
    );
  }
  return {
    ...record,
    stdout: result.stdout || "",
    stderr: result.stderr || "",
  };
}

function parseJsonFromStdout(stdout, stepName) {
  const trimmed = stdout.trim();
  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  if (start < 0 || end < start)
    throw new Error(`Could not find JSON object in ${stepName} stdout`);
  return JSON.parse(trimmed.slice(start, end + 1));
}

async function readbackDatabase() {
  const url = databaseUrl();
  if (!url) {
    return {
      skipped: true,
      reason:
        "Missing SOURCE_CONTEXT_DATABASE_URL, AZURE_LAB_DATABASE_URL, LAB_DATABASE_URL, ABARVA_AZURE_DATABASE_URL, AZURE_DATABASE_URL, or DATABASE_URL.",
    };
  }
  const client = new Client(clientOptions(url));
  await client.connect();
  try {
    await client.query("select set_config('app.tenant_key', $1, false)", [
      TENANT_KEY,
    ]);
    const tableRows = (
      await client.query(
        `
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'raw_source_v4'
          AND table_type = 'BASE TABLE'
          AND table_name <> '_column_map'
        ORDER BY table_name
        `,
      )
    ).rows;
    const tables = [];
    let rawRows = 0;
    for (const { table_name: tableName } of tableRows) {
      const row = (
        await client.query(
          `SELECT count(*)::int AS rows, count(DISTINCT _row_sha256)::int AS distinct_row_hashes
           FROM raw_source_v4.${quoteIdent(tableName)}
           WHERE _tenant_key = $1 AND _dataset_id = $2`,
          [TENANT_KEY, DATASET_ID],
        )
      ).rows[0];
      rawRows += Number(row.rows);
      tables.push({
        table: tableName,
        rows: Number(row.rows),
        distinct_row_hashes: Number(row.distinct_row_hashes),
      });
    }
    const coverage = (
      await client.query(
        `
        SELECT *
        FROM consumption_v4_canary.sourcing_context_coverage_v1
        WHERE tenant_key = $1
        `,
        [TENANT_KEY],
      )
    ).rows[0];
    const contracts = (
      await client.query(
        `
        SELECT
          count(*)::int AS contracts,
          count(DISTINCT vendor_id)::int AS vendors_with_contracts,
          coalesce(sum(annual_value), 0)::numeric AS annual_value
        FROM consumption_v4_canary.sourcing_contract_v1
        WHERE tenant_key = $1
        `,
        [TENANT_KEY],
      )
    ).rows[0];
    const vendors = (
      await client.query(
        `
        SELECT count(*)::int AS vendors, coalesce(sum(annual_value), 0)::numeric AS annual_value
        FROM consumption_v4_canary.sourcing_vendor_v1
        WHERE tenant_key = $1
        `,
        [TENANT_KEY],
      )
    ).rows[0];
    const failures = [];
    if (tableRows.length !== 10)
      failures.push(`expected 10 raw tables, got ${tableRows.length}`);
    if (rawRows !== EXPECTED_ROWS)
      failures.push(`expected ${EXPECTED_ROWS} raw rows, got ${rawRows}`);
    if (Number(contracts.contracts) !== EXPECTED_CONTRACTS)
      failures.push(
        `expected ${EXPECTED_CONTRACTS} contracts, got ${contracts.contracts}`,
      );
    if (Number(vendors.vendors) !== EXPECTED_VENDORS)
      failures.push(
        `expected ${EXPECTED_VENDORS} vendors, got ${vendors.vendors}`,
      );
    if (Number(contracts.annual_value) !== EXPECTED_ANNUAL_VALUE) {
      failures.push(
        `expected ${EXPECTED_ANNUAL_VALUE} annual value, got ${contracts.annual_value}`,
      );
    }
    return {
      skipped: false,
      ok: failures.length === 0,
      tenant_key: TENANT_KEY,
      dataset_id: DATASET_ID,
      raw_tables: tableRows.length,
      raw_rows: rawRows,
      tables,
      coverage,
      contracts,
      vendors,
      failures,
    };
  } finally {
    await client.end();
  }
}

function copyIfExists(source, target) {
  if (!fs.existsSync(source)) return;
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.copyFileSync(source, target);
}

function emitProofBundle(outDir) {
  const proofRoot = fs.mkdtempSync(
    path.join(os.tmpdir(), `skyharbor-source-v4-proof-root-${stamp()}-`),
  );
  for (const fileName of [
    "summary.json",
    "01-build-package.json",
    "02-row-depth.json",
    "03-load-canary.json",
    "03-load-canary.stdout.txt",
    "03-load-canary.stderr.txt",
    "04-answer-baseline.json",
  ]) {
    copyIfExists(path.join(outDir, fileName), path.join(proofRoot, fileName));
  }
  const summaryPath = path.join(outDir, "summary.json");
  const baselinePath = path.join(outDir, "canary-answer-baseline.json");
  if (fs.existsSync(baselinePath)) {
    const baseline = JSON.parse(fs.readFileSync(baselinePath, "utf8"));
    writeJson(path.join(proofRoot, "canary-answer-baseline-summary.json"), {
      summary: baseline.summary,
      question_ids: (baseline.rows || []).map((row) => row.question_id),
      answer_quality_counts: (baseline.rows || []).reduce((counts, row) => {
        counts[row.answer_quality] = (counts[row.answer_quality] || 0) + 1;
        return counts;
      }, {}),
    });
  }
  if (fs.existsSync(summaryPath)) {
    const summary = JSON.parse(fs.readFileSync(summaryPath, "utf8"));
    writeJson(
      path.join(proofRoot, "database-readback.json"),
      summary.database_readback,
    );
    writeJson(path.join(proofRoot, "package-fingerprint.json"), {
      package_sha256: summary.package?.package_sha256,
      dataset_id: summary.package?.dataset_id,
      dataset_version: summary.package?.dataset_version,
      tenant_key: summary.package?.tenant_key,
      total_rows: summary.package?.total_rows,
      contract_annual_value: summary.package?.contract_annual_value,
      files: summary.package?.files,
    });
  }
  const tarPath = path.join(
    os.tmpdir(),
    `skyharbor-source-v4-lab-canary-proof-${stamp()}.tgz`,
  );
  const result = spawnSync("tar", ["-czf", tarPath, "-C", proofRoot, "."], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
  if (result.status !== 0)
    throw new Error(result.stderr || "tar proof bundle failed");
  process.stdout.write("__SEMANTIC2_PROOF_TGZ_BEGIN__\n");
  process.stdout.write(fs.readFileSync(tarPath).toString("base64"));
  process.stdout.write("\n__SEMANTIC2_PROOF_TGZ_END__\n");
}

async function main() {
  const args = parseArgs();
  activeOutDir = args.outDir;
  fs.mkdirSync(args.outDir, { recursive: true });
  const generatedDir = path.join(args.outDir, "generated-package");
  const baselinePath = path.join(args.outDir, "canary-answer-baseline.json");
  const startedAt = new Date().toISOString();

  const build = runStep(
    "01-build-package",
    "node",
    [
      "scripts/source/build-skyharbor-v4-synthetic-package.mjs",
      "--out-dir",
      generatedDir,
    ],
    { outDir: args.outDir },
  );
  const packageResult = parseJsonFromStdout(build.stdout, "01-build-package");

  const rowDepth = runStep(
    "02-row-depth",
    "node",
    ["scripts/source/verify-skyharbor-v4-row-depth.mjs", packageResult.csv_dir],
    { outDir: args.outDir },
  );
  const rowDepthResult = parseJsonFromStdout(rowDepth.stdout, "02-row-depth");

  const loaderArgs = [
    "scripts/source/load-skyharbor-v4-lab-canary.mjs",
    "--package-zip",
    packageResult.package_path,
  ];
  if (!args.planOnly) loaderArgs.push("--apply");
  const load = runStep("03-load-canary", "node", loaderArgs, {
    outDir: args.outDir,
    env: {
      SOURCE_V4_PACKAGE_ZIP: packageResult.package_path,
      SOURCE_V4_TENANT_KEY: TENANT_KEY,
      SOURCE_V4_DATASET_ID: DATASET_ID,
    },
  });
  const loadResult = parseJsonFromStdout(load.stdout, "03-load-canary");

  const baseline = runStep(
    "04-answer-baseline",
    "node",
    [
      "scripts/source/run-skyharbor-v4-canary-answer-baseline.mjs",
      "--package-zip",
      packageResult.package_path,
      "--out",
      baselinePath,
    ],
    { outDir: args.outDir },
  );
  const baselineResult = JSON.parse(fs.readFileSync(baselinePath, "utf8"));
  const readback = args.planOnly
    ? { skipped: true, reason: "plan-only mode" }
    : await readbackDatabase();

  const failures = [];
  if (!packageResult.ok) failures.push("package build failed");
  if (!rowDepthResult.ok) failures.push("row-depth failed");
  if (baselineResult.summary?.blocked !== 0)
    failures.push(
      `baseline blocked questions ${baselineResult.summary?.blocked}`,
    );
  if (!args.planOnly && !loadResult.reconciliation?.passed)
    failures.push("loader reconciliation failed");
  if (!readback.skipped && !readback.ok) failures.push(...readback.failures);

  const summary = {
    event: "skyharbor_v4_lab_canary_job_completed",
    ok: failures.length === 0,
    plan_only: args.planOnly,
    tenant_key: TENANT_KEY,
    dataset_id: DATASET_ID,
    started_at: startedAt,
    finished_at: new Date().toISOString(),
    out_dir: args.outDir,
    package: packageResult,
    row_depth: {
      ok: rowDepthResult.ok,
      total_rows: rowDepthResult.total_rows,
      failures: rowDepthResult.failures || [],
    },
    load: loadResult,
    baseline: baselineResult.summary,
    database_readback: readback,
    failures,
  };
  writeJson(path.join(args.outDir, "summary.json"), summary);
  console.log(JSON.stringify(summary, null, 2));
  if (args.emitProofBundle) emitProofBundle(args.outDir);
  if (!summary.ok) process.exitCode = 1;
}

main().catch((error) => {
  const args = parseArgs();
  if (activeOutDir) args.outDir = activeOutDir;
  fs.mkdirSync(args.outDir, { recursive: true });
  writeJson(path.join(args.outDir, "summary.json"), {
    event: "skyharbor_v4_lab_canary_job_failed",
    ok: false,
    plan_only: args.planOnly,
    tenant_key: TENANT_KEY,
    dataset_id: DATASET_ID,
    finished_at: new Date().toISOString(),
    out_dir: args.outDir,
    error: error.stack || error.message,
  });
  console.error(
    JSON.stringify({ ok: false, error: error.stack || error.message }, null, 2),
  );
  if (args.emitProofBundle) {
    try {
      emitProofBundle(args.outDir);
    } catch (proofError) {
      console.error(
        JSON.stringify(
          {
            ok: false,
            event: "skyharbor_v4_lab_canary_failure_proof_emit_failed",
            error: proofError.stack || proofError.message,
          },
          null,
          2,
        ),
      );
    }
  }
  process.exit(1);
});
