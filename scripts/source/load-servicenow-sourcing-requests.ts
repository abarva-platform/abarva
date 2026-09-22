import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import Papa from "papaparse";
import { Client } from "pg";
import { listSourceArchetypes } from "../../src/lib/source/archetypes/registry";
import {
  adaptServiceNowSourcingRequestExtract,
  type ServiceNowSourcingRequestRow,
} from "../../src/lib/source/intake/servicenow-sourcing-request-adapter";
import { postgresClientOptions } from "../../src/scripts/postgres-client-options";

const DEFAULT_INPUT =
  "datasets/source-servicenow-sourcing-requests-synthetic-v1/servicenow_sourcing_requests.csv";
const APPLY_CONFIRMATION = "APPLY_SERVICENOW_REQUESTS";

export type ServiceNowImportArgs = {
  apply: boolean;
  approved: boolean;
  confirmation: string | null;
  tenantKey: string;
  inputPath: string;
  datasetId: string;
  datasetVersion: string;
  loadRunId: string;
  outDir: string;
  requireAllArchetypes: boolean;
};

export type ServiceNowImportPlan = {
  event: "source_servicenow_request_import_plan";
  apply: boolean;
  tenantKey: string;
  datasetId: string;
  datasetVersion: string;
  loadRunId: string;
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

export function parseServiceNowImportArgs(
  argv = process.argv.slice(2),
  env = process.env,
): ServiceNowImportArgs {
  const apply = argv.includes("--apply");
  const tenantArg = argValue(argv, "--tenant-key");
  const tenantKey = tenantArg ?? (apply ? "" : "corpus_global");
  if (!tenantKey) throw new Error("Apply mode requires --tenant-key.");
  return {
    apply,
    approved: env.SOURCE_SERVICENOW_REQUEST_IMPORT_APPLY_APPROVED === "true",
    confirmation: argValue(argv, "--confirm"),
    tenantKey,
    inputPath: path.resolve(argValue(argv, "--input") ?? DEFAULT_INPUT),
    datasetId:
      argValue(argv, "--dataset-id") ??
      "source-servicenow-sourcing-requests-synthetic-v1",
    datasetVersion: argValue(argv, "--dataset-version") ?? "v1",
    loadRunId:
      argValue(argv, "--load-run-id") ??
      `source-servicenow-request-${new Date().toISOString().replace(/[-:.]/g, "")}`,
    outDir: path.resolve(
      argValue(argv, "--out-dir") ?? "/tmp/source-servicenow-request-import",
    ),
    requireAllArchetypes: !argv.includes("--allow-partial-archetype-set"),
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
  const expectedArchetypes = listSourceArchetypes()
    .map((archetype) => archetype.id)
    .sort();
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
      `Synthetic ServiceNow extract does not cover registered archetypes: ${missingArchetypes.join(", ")}`,
    );
  }

  return {
    event: "source_servicenow_request_import_plan",
    apply: input.args.apply,
    tenantKey: input.args.tenantKey,
    datasetId: input.args.datasetId,
    datasetVersion: input.args.datasetVersion,
    loadRunId: input.args.loadRunId,
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
  const csvText = readFileSync(args.inputPath, "utf8");
  const plan = buildServiceNowImportPlan({ args, csvText });
  mkdirSync(args.outDir, { recursive: true });
  writeFileSync(
    path.join(args.outDir, "servicenow-request-import-plan.json"),
    `${JSON.stringify(plan, null, 2)}\n`,
  );
  if (!args.apply) return { ...plan, inserted: 0, committed: false };
  const inserted = await applyPlan(plan, args);
  const result = { ...plan, inserted, committed: true };
  writeFileSync(
    path.join(args.outDir, "servicenow-request-import-result.json"),
    `${JSON.stringify(result, null, 2)}\n`,
  );
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
