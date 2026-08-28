#!/usr/bin/env node

import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const DEFAULT_PACKAGE_DIR = path.join(
  ROOT,
  "datasets/tenant-inputs/generated/meridian-health/tower-layer1-v2026-08-business-case",
);
const DEFAULT_TENANT_KEY = "meridian-health";
const DEFAULT_ASSESSMENT_ID = "meridian-tower-layer2-source-adapters-v2026-08";
const DEFAULT_BUILD_VERSION = "tower-layer2-source-adapters-v2026-08";
const DEFAULT_INPUT_SOURCE_VERSION = "tower-layer1-v2026-08-business-case";
const DEFAULT_OUT_DIR = path.join(ROOT, "reports/meridian-tower-layer2-source-adapters");
const PROOF_BEGIN = "__SEMANTIC2_PROOF_TGZ_BEGIN__";
const PROOF_END = "__SEMANTIC2_PROOF_TGZ_END__";
const TRUTHY = new Set(["1", "true", "yes", "on"]);

const SOURCE_FILE_TO_TYPE = {
  "20_it_budget_by_domain.csv": "erp",
  "21_it_project_portfolio.csv": "ppm",
  "22_ai_business_cases.csv": "manual_workbook",
  "23_ai_tool_rollout.csv": "ai_telemetry",
  "24_monthly_value_tracking.csv": "manual_workbook",
  "25_finance_approval_ledger.csv": "manual_workbook",
  "26_evidence_register.csv": "manual_workbook",
  "adapter_runs.csv": "synthetic_source_room",
  "adapter_emitted_objects.csv": "synthetic_source_room",
};

function envFlag(name) {
  return TRUTHY.has(String(process.env[name] ?? "").trim().toLowerCase());
}

function argValue(argv, name) {
  const prefix = `${name}=`;
  const inline = argv.find((arg) => arg.startsWith(prefix));
  if (inline) return inline.slice(prefix.length);
  const index = argv.indexOf(name);
  if (index === -1) return null;
  const value = argv[index + 1];
  if (!value || value.startsWith("--")) throw new Error(`${name} requires a value`);
  return value;
}

function parseArgs(argv) {
  return {
    packageDir: path.resolve(argValue(argv, "--package-dir") ?? process.env.TOWER_LAYER2_PACKAGE_DIR ?? DEFAULT_PACKAGE_DIR),
    outDir: path.resolve(argValue(argv, "--out-dir") ?? process.env.TOWER_LAYER2_OUT_DIR ?? DEFAULT_OUT_DIR),
    tenantKey: argValue(argv, "--tenant-key") ?? process.env.TOWER_LAYER2_TENANT_KEY ?? DEFAULT_TENANT_KEY,
    assessmentId:
      argValue(argv, "--assessment-id") ?? process.env.TOWER_LAYER2_ASSESSMENT_ID ?? DEFAULT_ASSESSMENT_ID,
    buildVersion:
      argValue(argv, "--build-version") ?? process.env.TOWER_LAYER2_BUILD_VERSION ?? DEFAULT_BUILD_VERSION,
    inputSourceVersion:
      argValue(argv, "--input-source-version") ??
      process.env.TOWER_LAYER2_INPUT_SOURCE_VERSION ??
      DEFAULT_INPUT_SOURCE_VERSION,
    idempotencyKey:
      argValue(argv, "--idempotency-key") ??
      process.env.TOWER_LAYER2_IDEMPOTENCY_KEY ??
      `${DEFAULT_ASSESSMENT_ID}:${gitSha()}`,
    write: argv.includes("--write") || envFlag("TOWER_LAYER2_WRITE"),
    emitProofBundle: argv.includes("--emit-proof-bundle") || envFlag("TOWER_LAYER2_EMIT_PROOF_BUNDLE"),
    readbackOnly: argv.includes("--readback-only"),
  };
}

function gitSha() {
  const operatorCommit = process.env.ABARVA_OPERATOR_BRANCH_COMMIT?.trim();
  if (operatorCommit) return operatorCommit;
  const result = spawnSync("git", ["rev-parse", "HEAD"], { cwd: ROOT, encoding: "utf8" });
  return result.status === 0 ? result.stdout.trim() : "unknown";
}

function sha256Buffer(buffer) {
  return crypto.createHash("sha256").update(buffer).digest("hex");
}

function sha256Text(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function stableUuid(...parts) {
  const hex = sha256Text(parts.join("|")).slice(0, 32).split("");
  hex[12] = "5";
  hex[16] = ((Number.parseInt(hex[16], 16) & 0x3) | 0x8).toString(16);
  const value = hex.join("");
  return `${value.slice(0, 8)}-${value.slice(8, 12)}-${value.slice(12, 16)}-${value.slice(16, 20)}-${value.slice(20, 32)}`;
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];
    if (quoted) {
      if (char === '"' && next === '"') {
        field += '"';
        index += 1;
      } else if (char === '"') {
        quoted = false;
      } else {
        field += char;
      }
    } else if (char === '"') {
      quoted = true;
    } else if (char === ",") {
      row.push(field);
      field = "";
    } else if (char === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else if (char !== "\r") {
      field += char;
    }
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  const header = rows.shift()?.map((value) => value.trim()) ?? [];
  return rows
    .filter((cells) => cells.some((cell) => String(cell).trim()))
    .map((cells) => Object.fromEntries(header.map((key, index) => [key, cells[index] ?? ""])));
}

function readCsv(filePath) {
  return parseCsv(fs.readFileSync(filePath, "utf8"));
}

function sqlText(value) {
  if (value === null || value === undefined || value === "") return "null";
  return `'${String(value).replace(/'/g, "''")}'`;
}

function sqlNum(value) {
  return value === null || value === undefined || value === "" ? "null" : String(value);
}

function sqlJson(value) {
  return `${sqlText(JSON.stringify(value, Object.keys(value).sort()))}::jsonb`;
}

function insertSql(table, columns, rows, batchSize = 500) {
  if (!rows.length) return `-- no rows for ${table}\n`;
  const chunks = [];
  for (let index = 0; index < rows.length; index += batchSize) {
    const batch = rows.slice(index, index + batchSize);
    const values = batch.map((row) => `(${columns.map((column) => row[column]).join(", ")})`).join(",\n");
    chunks.push(`insert into ${table} (${columns.join(", ")}) values\n${values};`);
  }
  return `${chunks.join("\n")}\n`;
}

function nativeId(row, fallback, recordType = "") {
  if (recordType === "tower_layer2_adapter_emission") {
    return row.canonical_object_id || fallback;
  }
  return (
    row.source_record_id ||
    row.project_id ||
    row.business_case_id ||
    row.tool_rollout_id ||
    row.observation_id ||
    row.approval_event_id ||
    row.evidence_id ||
    row.adapter_id ||
    row.canonical_object_id ||
    fallback
  );
}

function ensureTenant(rows, tenantKey, label) {
  const badRows = rows.filter((row) => row.tenant_key !== tenantKey);
  if (badRows.length) {
    throw new Error(`${label} contains ${badRows.length} row(s) outside tenant ${tenantKey}`);
  }
}

function sourceFilesForPackage(packageDir) {
  const manifestPath = path.join(packageDir, "layer_1_client_intake/source_file_manifest.csv");
  const manifestRows = readCsv(manifestPath);
  return manifestRows.map((row) => ({
    fileName: row.source_file,
    owner: row.owner_role,
    description: row.description,
    refreshCadence: row.refresh_cadence,
    qualityState: row.quality_state,
    relativePath: `layer_1_client_intake/source_system_extracts/${row.source_file}`,
    recordType: "tower_layer1_source_extract",
  }));
}

function adapterFilesForPackage() {
  return [
    {
      fileName: "adapter_runs.csv",
      owner: "AbarVa source adapter",
      description: "Tower Layer 2 adapter run ledger",
      refreshCadence: "per data build",
      qualityState: "synthetic_review_ready",
      relativePath: "layer_2_source_adapters/adapter_runs.csv",
      recordType: "tower_layer2_adapter_run",
    },
    {
      fileName: "adapter_emitted_objects.csv",
      owner: "AbarVa source adapter",
      description: "Tower Layer 2 emitted canonical object ledger",
      refreshCadence: "per data build",
      qualityState: "synthetic_review_ready",
      relativePath: "layer_2_source_adapters/adapter_emitted_objects.csv",
      recordType: "tower_layer2_adapter_emission",
    },
  ];
}

function buildSourceRows(options) {
  const packageManifestPath = path.join(options.packageDir, "package_manifest.json");
  const packageManifest = JSON.parse(fs.readFileSync(packageManifestPath, "utf8"));
  if (packageManifest.tenant_key !== options.tenantKey) {
    throw new Error(`Package tenant ${packageManifest.tenant_key} does not match requested ${options.tenantKey}`);
  }

  const fileSpecs = [...sourceFilesForPackage(options.packageDir), ...adapterFilesForPackage()];
  const sourceFiles = [];
  const sourceRecords = [];
  const countsByRecordType = {};
  const countsByFile = {};

  for (const spec of fileSpecs) {
    const absolutePath = path.join(options.packageDir, spec.relativePath);
    if (!fs.existsSync(absolutePath)) throw new Error(`Missing required Layer 2 input file: ${absolutePath}`);
    const fileBuffer = fs.readFileSync(absolutePath);
    const fileHash = sha256Buffer(fileBuffer);
    const rows = parseCsv(fileBuffer.toString("utf8"));
    ensureTenant(rows, options.tenantKey, spec.relativePath);
    countsByRecordType[spec.recordType] = (countsByRecordType[spec.recordType] ?? 0) + rows.length;
    countsByFile[spec.fileName] = rows.length;

    const sourceFileId = stableUuid("source_file", options.tenantKey, options.assessmentId, spec.relativePath, fileHash);
    sourceFiles.push({
      id: sqlText(sourceFileId),
      tenant_key: sqlText(options.tenantKey),
      assessment_id: sqlText(options.assessmentId),
      source_type: sqlText(SOURCE_FILE_TO_TYPE[spec.fileName] ?? "manual_workbook"),
      origin: sqlText("synthetic_generator"),
      source_owner: sqlText(spec.owner),
      file_name: sqlText(spec.fileName),
      blob_uri: sqlText(`repo://${path.relative(ROOT, absolutePath)}`),
      file_hash: sqlText(fileHash),
      source_date: sqlText(packageManifest.as_of_date ?? "2026-08-24"),
      access_class: sqlText("internal"),
      quality_state: sqlText("accepted"),
      metadata_json: sqlJson({
        build_version: options.buildVersion,
        description: spec.description,
        input_source_version: options.inputSourceVersion,
        package_type: packageManifest.package_type,
        refresh_cadence: spec.refreshCadence,
        source_quality_state: spec.qualityState,
      }),
    });

    rows.forEach((row, index) => {
      const csvLineNumber = index + 2;
      const sourceNativeId = nativeId(row, `${spec.fileName}:${csvLineNumber}`, spec.recordType);
      const id = stableUuid(
        "source_record",
        options.tenantKey,
        options.assessmentId,
        spec.relativePath,
        csvLineNumber,
        sourceNativeId,
      );
      sourceRecords.push({
        id: sqlText(id),
        tenant_key: sqlText(options.tenantKey),
        assessment_id: sqlText(options.assessmentId),
        source_file_id: sqlText(sourceFileId),
        native_id: sqlText(sourceNativeId),
        record_type: sqlText(spec.recordType),
        row_number: sqlNum(csvLineNumber),
        payload_json: sqlJson({
          ...row,
          layer_boundary: spec.recordType.startsWith("tower_layer1") ? "layer_1_client_intake" : "layer_2_source_adapters",
          loaded_by: "scripts/tower/load-healthcare-demo-layer2-source-adapters.mjs",
        }),
        parse_state: sqlText("parsed"),
        parse_notes: sqlText(
          spec.recordType === "tower_layer2_adapter_emission"
            ? "tower_layer2_adapter_emission_with_upstream_source_lineage"
            : spec.recordType === "tower_layer2_adapter_run"
              ? "tower_layer2_adapter_run_landed_for_audit"
              : "tower_layer1_source_record_landed_by_layer2_adapter_job",
        ),
      });
    });
  }

  return {
    sourceFiles,
    sourceRecords,
    countsByRecordType,
    countsByFile,
    packageManifest,
  };
}

function writeLoadSql(outPath, options, sourceFiles, sourceRecords) {
  const tenant = sqlText(options.tenantKey);
  const assessment = sqlText(options.assessmentId);
  const sourceFileColumns = [
    "id",
    "tenant_key",
    "assessment_id",
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
  ];
  const sourceRecordColumns = [
    "id",
    "tenant_key",
    "assessment_id",
    "source_file_id",
    "native_id",
    "record_type",
    "row_number",
    "payload_json",
    "parse_state",
    "parse_notes",
  ];
  const sql = [
    "begin;",
    `delete from ecl_source.source_record where tenant_key = ${tenant} and assessment_id = ${assessment};`,
    `delete from ecl_source.source_file where tenant_key = ${tenant} and assessment_id = ${assessment};`,
    insertSql("ecl_source.source_file", sourceFileColumns, sourceFiles),
    insertSql("ecl_source.source_record", sourceRecordColumns, sourceRecords),
    "commit;",
  ].join("\n");
  fs.writeFileSync(outPath, sql, "utf8");
}

function readbackSql(options) {
  const tenant = sqlText(options.tenantKey);
  const assessment = sqlText(options.assessmentId);
  return `
with readback as (
  select jsonb_build_object(
    'tenant_key', ${tenant},
    'assessment_id', ${assessment},
    'source_file', (select count(*) from ecl_source.source_file where tenant_key = ${tenant} and assessment_id = ${assessment}),
    'source_record', (select count(*) from ecl_source.source_record where tenant_key = ${tenant} and assessment_id = ${assessment}),
    'source_extract_records', (
      select count(*) from ecl_source.source_record
      where tenant_key = ${tenant} and assessment_id = ${assessment} and record_type = 'tower_layer1_source_extract'
    ),
    'adapter_run_records', (
      select count(*) from ecl_source.source_record
      where tenant_key = ${tenant} and assessment_id = ${assessment} and record_type = 'tower_layer2_adapter_run'
    ),
    'adapter_emission_records', (
      select count(*) from ecl_source.source_record
      where tenant_key = ${tenant} and assessment_id = ${assessment} and record_type = 'tower_layer2_adapter_emission'
    ),
    'source_files_by_type', (
      select coalesce(jsonb_object_agg(source_type, row_count), '{}'::jsonb)
      from (
        select source_type, count(*) as row_count
        from ecl_source.source_file
        where tenant_key = ${tenant} and assessment_id = ${assessment}
        group by source_type
      ) counts
    ),
    'source_records_by_type', (
      select coalesce(jsonb_object_agg(record_type, row_count), '{}'::jsonb)
      from (
        select record_type, count(*) as row_count
        from ecl_source.source_record
        where tenant_key = ${tenant} and assessment_id = ${assessment}
        group by record_type
      ) counts
    ),
    'tenant_payload_drift', (
      select count(*)
      from ecl_source.source_record
      where tenant_key = ${tenant}
        and assessment_id = ${assessment}
        and payload_json ? 'tenant_key'
        and payload_json ->> 'tenant_key' <> ${tenant}
    ),
    'adapter_lineage_drift', (
      select count(*)
      from ecl_source.source_record emission
      where emission.tenant_key = ${tenant}
        and emission.assessment_id = ${assessment}
        and emission.record_type = 'tower_layer2_adapter_emission'
        and not exists (
          select 1
          from ecl_source.source_record source_record
          join ecl_source.source_file source_file
            on source_file.tenant_key = source_record.tenant_key
            and source_file.assessment_id = source_record.assessment_id
            and source_file.id = source_record.source_file_id
          where source_record.tenant_key = emission.tenant_key
            and source_record.assessment_id = emission.assessment_id
            and source_record.record_type = 'tower_layer1_source_extract'
            and source_file.file_name = emission.payload_json ->> 'source_file'
            and source_record.row_number = nullif(emission.payload_json ->> 'source_row', '')::integer
        )
    )
  ) as payload
)
select payload::text from readback;
`.trim();
}

function writeReadbackSql(outPath, options) {
  fs.writeFileSync(outPath, `${readbackSql(options)}\n`, "utf8");
}

function run(command, label, outDir, sensitive = false) {
  const result = spawnSync(command[0], command.slice(1), {
    cwd: ROOT,
    encoding: "utf8",
    env: { ...process.env, PGCONNECT_TIMEOUT: process.env.PGCONNECT_TIMEOUT ?? "30" },
  });
  fs.writeFileSync(path.join(outDir, `${label}.stdout.log`), sensitive ? "<redacted>\n" : result.stdout, "utf8");
  fs.writeFileSync(path.join(outDir, `${label}.stderr.log`), sensitive ? "<redacted>\n" : result.stderr, "utf8");
  if (result.status !== 0) {
    throw new Error(`${label} failed: ${(result.stderr || result.stdout).slice(0, 1200)}`);
  }
  return result.stdout;
}

function runPsqlFile(databaseUrl, sqlPath, outDir, label) {
  return run(["psql", databaseUrl, "-v", "ON_ERROR_STOP=1", "-f", sqlPath], label, outDir, true);
}

function runPsqlReadback(databaseUrl, options, outDir) {
  const stdout = run(["psql", databaseUrl, "-v", "ON_ERROR_STOP=1", "-At", "-c", readbackSql(options)], "03-readback", outDir);
  const parsed = JSON.parse(stdout.trim());
  fs.writeFileSync(path.join(outDir, "03-readback.json"), `${JSON.stringify(parsed, null, 2)}\n`, "utf8");
  return parsed;
}

function expectedCounts(sourceRows) {
  return {
    source_file: sourceRows.sourceFiles.length,
    source_record: sourceRows.sourceRecords.length,
    source_extract_records: sourceRows.countsByRecordType.tower_layer1_source_extract ?? 0,
    adapter_run_records: sourceRows.countsByRecordType.tower_layer2_adapter_run ?? 0,
    adapter_emission_records: sourceRows.countsByRecordType.tower_layer2_adapter_emission ?? 0,
  };
}

function validateReadback(readback, expected) {
  const issues = [];
  for (const [key, value] of Object.entries(expected)) {
    if (Number(readback[key]) !== Number(value)) {
      issues.push(`${key}_expected_${value}_got_${readback[key]}`);
    }
  }
  if (Number(readback.tenant_payload_drift ?? 1) !== 0) issues.push("tenant_payload_drift");
  if (Number(readback.adapter_lineage_drift ?? 1) !== 0) issues.push("adapter_lineage_drift");
  return issues;
}

function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function emitProofBundle(outDir) {
  const tarPath = path.join(os.tmpdir(), `meridian-tower-layer2-proof-${Date.now()}.tgz`);
  const rootName = path.basename(outDir);
  const result = spawnSync("tar", ["-czf", tarPath, "-C", path.dirname(outDir), rootName], {
    cwd: ROOT,
    encoding: "utf8",
  });
  if (result.status !== 0) throw new Error(result.stderr || "proof bundle tar failed");
  process.stdout.write(`${PROOF_BEGIN}\n`);
  process.stdout.write(fs.readFileSync(tarPath).toString("base64"));
  process.stdout.write(`\n${PROOF_END}\n`);
}

function main() {
  const options = parseArgs(process.argv.slice(2));
  fs.mkdirSync(options.outDir, { recursive: true });

  const sourceRows = buildSourceRows(options);
  const expected = expectedCounts(sourceRows);
  const loadSqlPath = path.join(options.outDir, "tower_layer2_ecl_source_load.sql");
  const readbackSqlPath = path.join(options.outDir, "tower_layer2_ecl_source_readback.sql");
  writeLoadSql(loadSqlPath, options, sourceRows.sourceFiles, sourceRows.sourceRecords);
  writeReadbackSql(readbackSqlPath, options);

  const summary = {
    generated_at: new Date().toISOString(),
    status: "dry_run_ready",
    boundary: {
      layer: "layer_2_source_adapters",
      azure_write_requested: options.write,
      product_projection_written: false,
      canonical_layer_written: false,
    },
    job_contract: {
      job_name: process.env.ACA_OPERATOR_JOB ?? "job-abarva-private-operator-eus",
      tenant_scope: options.tenantKey,
      build_version: options.buildVersion,
      input_source_version: options.inputSourceVersion,
      idempotency_key: options.idempotencyKey,
      operator_identity: process.env.USER ?? "unknown",
      git_sha: gitSha(),
      image_digest: process.env.ABARVA_OPERATOR_IMAGE_DIGEST ?? null,
    },
    package_dir: options.packageDir,
    out_dir: options.outDir,
    expected_counts: expected,
    counts_by_file: sourceRows.countsByFile,
    counts_by_record_type: sourceRows.countsByRecordType,
    load_sql: loadSqlPath,
    readback_sql: readbackSqlPath,
    readback: null,
    issues: [],
  };

  if (options.write || options.readbackOnly) {
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL is required for --write or --readback-only");
    }
  }

  if (options.write) {
    if (!envFlag("TOWER_LAYER2_AZURE_WRITE_APPROVED")) {
      throw new Error("Refusing Azure write without TOWER_LAYER2_AZURE_WRITE_APPROVED=true");
    }
    runPsqlFile(process.env.DATABASE_URL, loadSqlPath, options.outDir, "02-load");
    summary.status = "write_applied";
  }

  if (options.write || options.readbackOnly) {
    const readback = runPsqlReadback(process.env.DATABASE_URL, options, options.outDir);
    summary.readback = readback;
    summary.issues = validateReadback(readback, expected);
    summary.status = summary.issues.length ? "failed" : options.write ? "write_verified" : "readback_verified";
  }

  writeJson(path.join(options.outDir, "tower_layer2_ecl_source_load_summary.json"), summary);
  console.log(JSON.stringify(summary, null, 2));

  if (options.emitProofBundle) emitProofBundle(options.outDir);
  if (summary.issues.length) process.exitCode = 1;
}

main();
