import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import Papa from "papaparse";
import { Client } from "pg";
import { CATEGORY_TO_ARCHETYPE_ID } from "../../src/lib/source/archetypes/event-archetype-resolver";
import {
  adaptServiceNowSourcingRequestExtract,
  type ServiceNowSourcingRequestRow,
} from "../../src/lib/source/intake/servicenow-sourcing-request-adapter";
import { postgresClientOptions } from "../../src/scripts/postgres-client-options";

const DEFAULT_INPUT =
  "datasets/source-servicenow-sourcing-requests-synthetic-v1/servicenow_sourcing_requests.csv";
const APPLY_CONFIRMATION = "APPLY_SERVICENOW_REQUESTS";

function categoryRoutedArchetypeIds(): string[] {
  return [
    ...new Set(
      Object.values(CATEGORY_TO_ARCHETYPE_ID).filter(
        (id): id is string => Boolean(id),
      ),
    ),
  ].sort();
}

export type ServiceNowImportArgs = {
  apply: boolean;
  approved: boolean;
  confirmation: string | null;
  tenantKey: string;
  inputPath: string;
  datasetId: string;
  datasetVersion: string;
  inputSourceVersion: string;
  expectedInputSha256: string | null;
  loadRunId: string;
  idempotencyKey: string;
  buildVersion: string;
  outDir: string;
  requireAllArchetypes: boolean;
  operatorJob: boolean;
  emitProofBundle: boolean;
};

export type ServiceNowImportPlan = {
  event: "source_servicenow_request_import_plan";
  apply: boolean;
  tenantKey: string;
  datasetId: string;
  datasetVersion: string;
  inputSourceVersion: string;
  buildVersion: string;
  loadRunId: string;
  idempotencyKey: string;
  inputPath: string;
  inputSha256: string;
  rowCount: number;
  domains: string[];
  categories: string[];
  archetypes: string[];
  expectedArchetypes: string[];
  missingArchetypes: string[];
  requests: Array<{
    requestId: string;
    requestNumber: string;
    sourceVersion: string;
    sourceRow: number;
    sourceSha256: string;
    categoryId: string;
    archetypeId: string | null;
    requiredFactGaps: string[];
    normalizedRequest: Record<string, unknown>;
    rawSource: Record<string, string>;
    mappingProposal: Record<string, unknown>;
  }>;
  authority: {
    requestVersionsOnly: true;
    mappingDecisionsWritten: false;
    eventsCreated: false;
    suppliersContacted: false;
  };
};

function argValue(argv: readonly string[], name: string): string | null {
  const index = argv.indexOf(name);
  if (index >= 0) return argv[index + 1] ?? null;
  return argv.find((arg) => arg.startsWith(`${name}=`))?.slice(name.length + 1) ?? null;
}

function envValue(env: NodeJS.ProcessEnv, name: string): string | null {
  const value = env[name];
  return value && value.trim() ? value.trim() : null;
}

function requireOperatorValue(
  value: string | null,
  label: string,
  operatorJob: boolean,
): string | null {
  if (operatorJob && !value) {
    throw new Error(`Operator job mode requires ${label}.`);
  }
  return value;
}

export function parseServiceNowImportArgs(
  argv = process.argv.slice(2),
  env = process.env,
): ServiceNowImportArgs {
  const apply =
    argv.includes("--apply") ||
    env.SOURCE_SERVICENOW_REQUEST_IMPORT_APPLY === "true";
  const operatorJob =
    argv.includes("--operator-job") ||
    env.SOURCE_SERVICENOW_REQUEST_IMPORT_OPERATOR_JOB === "true";
  const tenantArg =
    argValue(argv, "--tenant-key") ??
    envValue(env, "SOURCE_SERVICENOW_REQUEST_TENANT_KEY") ??
    envValue(env, "TENANT_KEY");
  const tenantKey = tenantArg ?? (apply ? "" : "corpus_global");
  if (!tenantKey) throw new Error("Apply mode requires --tenant-key.");
  if (apply && tenantKey.trim().toLowerCase() === "corpus_global") {
    throw new Error(
      "corpus_global cannot be used for apply; select one explicit tenant.",
    );
  }
  requireOperatorValue(tenantArg, "--tenant-key or SOURCE_SERVICENOW_REQUEST_TENANT_KEY", operatorJob);
  const datasetVersion =
    argValue(argv, "--dataset-version") ??
    envValue(env, "SOURCE_SERVICENOW_REQUEST_DATASET_VERSION") ??
    "v1";
  const inputSourceVersion =
    requireOperatorValue(
      argValue(argv, "--input-source-version") ??
        envValue(env, "SOURCE_SERVICENOW_REQUEST_INPUT_SOURCE_VERSION"),
      "--input-source-version or SOURCE_SERVICENOW_REQUEST_INPUT_SOURCE_VERSION",
      operatorJob,
    ) ?? datasetVersion;
  const expectedInputSha256 = requireOperatorValue(
    argValue(argv, "--input-sha256") ??
      envValue(env, "SOURCE_SERVICENOW_REQUEST_INPUT_SHA256"),
    "--input-sha256 or SOURCE_SERVICENOW_REQUEST_INPUT_SHA256",
    operatorJob,
  );
  const loadRunId =
    requireOperatorValue(
      argValue(argv, "--load-run-id") ??
        envValue(env, "SOURCE_SERVICENOW_REQUEST_LOAD_RUN_ID"),
      "--load-run-id or SOURCE_SERVICENOW_REQUEST_LOAD_RUN_ID",
      operatorJob,
    ) ??
    `source-servicenow-request-${new Date().toISOString().replace(/[-:.]/g, "")}`;
  const idempotencyKey =
    requireOperatorValue(
      argValue(argv, "--idempotency-key") ??
        envValue(env, "SOURCE_SERVICENOW_REQUEST_IDEMPOTENCY_KEY"),
      "--idempotency-key or SOURCE_SERVICENOW_REQUEST_IDEMPOTENCY_KEY",
      operatorJob,
    ) ?? `source-servicenow-request:${tenantKey}:${inputSourceVersion}:${loadRunId}`;
  return {
    apply,
    approved: env.SOURCE_SERVICENOW_REQUEST_IMPORT_APPLY_APPROVED === "true",
    confirmation:
      argValue(argv, "--confirm") ??
      envValue(env, "SOURCE_SERVICENOW_REQUEST_IMPORT_CONFIRMATION"),
    tenantKey,
    inputPath: path.resolve(
      argValue(argv, "--input") ??
        envValue(env, "SOURCE_SERVICENOW_REQUEST_INPUT_PATH") ??
        DEFAULT_INPUT,
    ),
    datasetId:
      argValue(argv, "--dataset-id") ??
      envValue(env, "SOURCE_SERVICENOW_REQUEST_DATASET_ID") ??
      "source-servicenow-sourcing-requests-synthetic-v1",
    datasetVersion,
    inputSourceVersion,
    expectedInputSha256,
    loadRunId,
    idempotencyKey,
    buildVersion:
      argValue(argv, "--build-version") ??
      envValue(env, "SOURCE_SERVICENOW_REQUEST_BUILD_VERSION") ??
      "local-dry-run",
    outDir: path.resolve(
      argValue(argv, "--out-dir") ??
        envValue(env, "SOURCE_SERVICENOW_REQUEST_OUT_DIR") ??
        "/tmp/source-servicenow-request-import",
    ),
    requireAllArchetypes: !argv.includes("--allow-partial-archetype-set"),
    operatorJob,
    emitProofBundle:
      argv.includes("--emit-proof-bundle") ||
      env.SOURCE_SERVICENOW_REQUEST_EMIT_PROOF_BUNDLE === "true" ||
      env.EMIT_ACA_PROOF_BUNDLE === "true",
  };
}

function sha256(value: string): string {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

function canonicalJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, item]) => `${JSON.stringify(key)}:${canonicalJson(item)}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}

export function buildServiceNowImportPlan(input: {
  args: ServiceNowImportArgs;
  csvText: string;
}): ServiceNowImportPlan {
  const parsed = Papa.parse<ServiceNowSourcingRequestRow>(input.csvText, {
    header: true,
    skipEmptyLines: true,
    transform: (value) => value.trim(),
  });
  if (parsed.errors.length > 0) {
    throw new Error(
      `ServiceNow CSV parse failed: ${parsed.errors
        .map((error) => `row ${error.row ?? "?"}: ${error.message}`)
        .join("; ")}`,
    );
  }
  const requests = adaptServiceNowSourcingRequestExtract({
    tenantKey: input.args.tenantKey,
    rows: parsed.data.map((row, index) => ({ row, sourceRow: index + 2 })),
    loadedSegments: [],
  });
  const expectedArchetypes = categoryRoutedArchetypeIds();
  const archetypes = [
    ...new Set(
      requests.flatMap((request) =>
        request.mappingProposal.archetypeId
          ? [request.mappingProposal.archetypeId]
          : [],
      ),
    ),
  ].sort();
  const missingArchetypes = expectedArchetypes.filter(
    (archetype) => !archetypes.includes(archetype),
  );
  if (input.args.requireAllArchetypes && missingArchetypes.length > 0) {
    throw new Error(
      `Synthetic ServiceNow extract does not cover category-routed archetypes: ${missingArchetypes.join(", ")}`,
    );
  }

  return {
    event: "source_servicenow_request_import_plan",
    apply: input.args.apply,
    tenantKey: input.args.tenantKey,
    datasetId: input.args.datasetId,
    datasetVersion: input.args.datasetVersion,
    inputSourceVersion: input.args.inputSourceVersion,
    buildVersion: input.args.buildVersion,
    loadRunId: input.args.loadRunId,
    idempotencyKey: input.args.idempotencyKey,
    inputPath: input.args.inputPath,
    inputSha256: sha256(input.csvText),
    rowCount: requests.length,
    domains: [...new Set(requests.map((request) => request.organization.businessDomain))].sort(),
    categories: [...new Set(requests.map((request) => request.mappingProposal.categoryId))].sort(),
    archetypes,
    expectedArchetypes,
    missingArchetypes,
    requests: requests.map((request) => ({
      requestId: request.requestId,
      requestNumber: request.source.requestNumber,
      sourceVersion: request.source.version,
      sourceRow: request.source.row,
      sourceSha256: sha256(canonicalJson(request.rawSource)),
      categoryId: request.mappingProposal.categoryId,
      archetypeId: request.mappingProposal.archetypeId,
      requiredFactGaps: [...request.requiredFactGaps],
      normalizedRequest: {
        title: request.title,
        description: request.description,
        requestedBy: request.requestedBy,
        organization: request.organization,
        businessJustification: request.businessJustification,
        trigger: request.trigger,
        requestedOutcome: request.requestedOutcome,
        timing: request.timing,
        value: request.value,
        incumbent: request.incumbent,
        scope: request.scope,
        governance: request.governance,
        attachments: request.attachments,
        loadedSegments: request.loadedSegments,
      },
      rawSource: { ...request.rawSource },
      mappingProposal: { ...request.mappingProposal },
    })),
    authority: {
      requestVersionsOnly: true,
      mappingDecisionsWritten: false,
      eventsCreated: false,
      suppliersContacted: false,
    },
  };
}

function assertExpectedInputSha(args: ServiceNowImportArgs, actualSha256: string): void {
  if (!args.expectedInputSha256) return;
  const expected = args.expectedInputSha256.toLowerCase();
  if (!/^[a-f0-9]{64}$/.test(expected)) {
    throw new Error("--input-sha256 must be a 64-character lowercase hex SHA-256.");
  }
  if (actualSha256 !== expected) {
    throw new Error(
      `ServiceNow request input SHA mismatch: expected ${expected}, got ${actualSha256}.`,
    );
  }
}

function assertOperatorContract(args: ServiceNowImportArgs): void {
  if (!args.operatorJob) return;
  const missing = [
    ["tenantKey", args.tenantKey],
    ["expectedInputSha256", args.expectedInputSha256],
    ["inputSourceVersion", args.inputSourceVersion],
    ["loadRunId", args.loadRunId],
    ["idempotencyKey", args.idempotencyKey],
  ].flatMap(([label, value]) =>
    typeof value === "string" && value.trim() ? [] : [label],
  );
  if (missing.length > 0) {
    throw new Error(
      `Operator job mode requires a complete contract: ${missing.join(", ")}.`,
    );
  }
}

function writeProofManifest(args: ServiceNowImportArgs, plan: ServiceNowImportPlan, result: {
  inserted: number;
  committed: boolean;
}): void {
  writeFileSync(
    path.join(args.outDir, "proof-manifest.json"),
    `${JSON.stringify(
      {
        event: "source_servicenow_request_import_proof",
        status: result.committed ? "committed" : "dry_run",
        blobCompatible: true,
        proofBundleFile: "proof-bundle.tgz",
        blobProofBundleLocation: `local-only:${path.join(args.outDir, "proof-bundle.tgz")}`,
        contract: {
          tenantKey: args.tenantKey,
          datasetId: args.datasetId,
          datasetVersion: args.datasetVersion,
          inputSourceVersion: args.inputSourceVersion,
          inputSha256: plan.inputSha256,
          loadRunId: args.loadRunId,
          idempotencyKey: args.idempotencyKey,
          buildVersion: args.buildVersion,
          apply: args.apply,
        },
        authority: plan.authority,
        summary: {
          rowCount: plan.rowCount,
          inserted: result.inserted,
          committed: result.committed,
          missingArchetypeCount: plan.missingArchetypes.length,
        },
      },
      null,
      2,
    )}\n`,
  );
}

function emitProofBundle(outDir: string): void {
  const parent = path.dirname(outDir);
  const base = path.basename(outDir);
  const tarPath = path.join(parent, `${base}.tgz`);
  const tar = spawnSync("tar", ["-czf", tarPath, "-C", parent, base], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
  if (tar.status !== 0) {
    throw new Error(tar.stderr || tar.stdout || "Failed to build proof bundle");
  }
  const encoded = readFileSync(tarPath).toString("base64");
  writeFileSync(path.join(outDir, "proof-bundle.tgz"), readFileSync(tarPath));
  console.log("__SEMANTIC2_PROOF_TGZ_BEGIN__");
  for (let index = 0; index < encoded.length; index += 7600) {
    console.log(encoded.slice(index, index + 7600));
  }
  console.log("__SEMANTIC2_PROOF_TGZ_END__");
}

function databaseUrl(env = process.env): string {
  const value = env.SOURCE_CONTEXT_DATABASE_URL ?? env.DATABASE_URL;
  if (!value) throw new Error("Apply mode requires SOURCE_CONTEXT_DATABASE_URL or DATABASE_URL.");
  return value;
}

async function applyPlan(plan: ServiceNowImportPlan, args: ServiceNowImportArgs): Promise<number> {
  if (!args.approved || args.confirmation !== APPLY_CONFIRMATION) {
    throw new Error(
      `Apply mode requires SOURCE_SERVICENOW_REQUEST_IMPORT_APPLY_APPROVED=true and --confirm=${APPLY_CONFIRMATION}.`,
    );
  }
  const client = new Client(
    postgresClientOptions(databaseUrl(), "source-servicenow-request-import"),
  );
  await client.connect();
  let inserted = 0;
  try {
    await client.query("BEGIN");
    await client.query("SELECT set_config('app.tenant_key', $1, true)", [
      plan.tenantKey,
    ]);
    const schema = await client.query<{ table_name: string | null }>(
      "SELECT to_regclass('source.intake_request_version')::text AS table_name",
    );
    if (!schema.rows[0]?.table_name) {
      throw new Error("source.intake_request_version is not applied; stop before loading.");
    }
    for (const request of plan.requests) {
      const raw = request.rawSource;
      const result = await client.query<{ source_sha256: string }>(
        `INSERT INTO source.intake_request_version (
           tenant_key, request_id, source_system, source_table,
           source_record_id, source_request_number, source_version,
           source_row, source_status, source_sha256, extracted_at,
           opened_at, updated_at, raw_source, normalized_request,
           mapping_proposal, required_fact_gaps
         ) VALUES (
           $1, $2, 'servicenow', $3, $4, $5, $6,
           $7, $8, $9, $10::timestamptz, $11::timestamptz,
           $12::timestamptz, $13::jsonb, $14::jsonb, $15::jsonb, $16::text[]
         )
         ON CONFLICT (tenant_key, request_id, source_version) DO NOTHING
         RETURNING source_sha256`,
        [
          plan.tenantKey,
          request.requestId,
          raw.source_table,
          raw.sys_id,
          request.requestNumber,
          request.sourceVersion,
          request.sourceRow,
          raw.state || "unknown",
          request.sourceSha256,
          raw.extract_timestamp,
          raw.opened_at || null,
          raw.updated_at || null,
          JSON.stringify(raw),
          JSON.stringify(request.normalizedRequest),
          JSON.stringify(request.mappingProposal),
          request.requiredFactGaps,
        ],
      );
      if (result.rowCount === 1) {
        inserted += 1;
        continue;
      }
      const existing = await client.query<{ source_sha256: string }>(
        `SELECT source_sha256
         FROM source.intake_request_version
         WHERE tenant_key = $1 AND request_id = $2 AND source_version = $3`,
        [plan.tenantKey, request.requestId, request.sourceVersion],
      );
      if (existing.rows[0]?.source_sha256 !== request.sourceSha256) {
        throw new Error(
          `Conflicting bytes for ${request.requestId} version ${request.sourceVersion}; refusing overwrite.`,
        );
      }
    }
    await client.query("COMMIT");
    return inserted;
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);
    throw error;
  } finally {
    await client.end();
  }
}

export async function runServiceNowRequestImport(args: ServiceNowImportArgs) {
  assertOperatorContract(args);
  const csvText = readFileSync(args.inputPath, "utf8");
  assertExpectedInputSha(args, sha256(csvText));
  const plan = buildServiceNowImportPlan({ args, csvText });
  mkdirSync(args.outDir, { recursive: true });
  writeFileSync(
    path.join(args.outDir, "servicenow-request-import-plan.json"),
    `${JSON.stringify(plan, null, 2)}\n`,
  );
  if (!args.apply) {
    const result = { ...plan, inserted: 0, committed: false };
    writeProofManifest(args, plan, result);
    if (args.emitProofBundle) emitProofBundle(args.outDir);
    return result;
  }
  const inserted = await applyPlan(plan, args);
  const result = { ...plan, inserted, committed: true };
  writeFileSync(
    path.join(args.outDir, "servicenow-request-import-result.json"),
    `${JSON.stringify(result, null, 2)}\n`,
  );
  writeProofManifest(args, plan, result);
  if (args.emitProofBundle) emitProofBundle(args.outDir);
  return result;
}

const isDirect = process.argv[1]
  ? import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href
  : false;
if (isDirect) {
  runServiceNowRequestImport(parseServiceNowImportArgs())
    .then((result) => console.log(JSON.stringify(result, null, 2)))
    .catch((error) => {
      console.error(error instanceof Error ? error.message : String(error));
      process.exitCode = 1;
    });
}
