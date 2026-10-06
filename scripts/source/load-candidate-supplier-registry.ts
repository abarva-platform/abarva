import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import Papa from "papaparse";
import { Client } from "pg";
import {
  buildCandidateSupplierRegistryValidation,
  type CandidateSupplierRegistryRow,
  type CandidateSupplierRegistryValidation,
} from "./validate-candidate-supplier-registry-package";
import { postgresClientOptions } from "../../src/scripts/postgres-client-options";

const DEFAULT_INPUT =
  "datasets/source/candidate-supplier-registry-synthetic-v1/candidate_supplier_registry.csv";
const APPLY_CONFIRMATION = "APPLY_CANDIDATE_SUPPLIER_REGISTRY";

export type CandidateSupplierRegistryImportArgs = {
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
  operatorJob: boolean;
  emitProofBundle: boolean;
};

export type CandidateSupplierRegistryImportSupplier = {
  supplierId: string;
  legalEntityId: string;
  legalName: string;
  sourceRow: number;
  sourceRecordId: string;
  sourceSha256: string;
  sourceSystem: string;
  categoryId: string;
  businessFunction: string;
  archetypeId: string;
  eligibilityBasis: string;
  contactPolicy: "review_required" | "do_not_contact";
  contacts: [];
  existingContractStatus: string;
  existingContractReference: string | null;
  rawSource: Record<string, string>;
  registryPayload: {
    authorityState: "accepted";
    categoryKeys: string[];
    functionKeys: string[];
    archetypeKeys: string[];
    contactPolicy: "review_required" | "do_not_contact";
    contacts: [];
    sourceSha256: string;
    inputSourceVersion: string;
    fixtureAuthorityState: string;
    fixtureContactPolicy: string;
    fixtureContactAuthorityState: string;
    existingContractStatus: string;
    existingContractReference: string | null;
  };
};

export type CandidateSupplierRegistryImportPlan = {
  event: "source_candidate_supplier_registry_import_plan";
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
  supplierCount: number;
  archetypes: string[];
  validation: CandidateSupplierRegistryValidation;
  failClosedControls: CandidateSupplierRegistryValidation["failClosedControls"];
  suppliers: CandidateSupplierRegistryImportSupplier[];
  authority: {
    dryRunDefault: true;
    supplierRegistryRowsOnly: true;
    candidateSupplierAuthoritiesWritten: false;
    eventsCreated: false;
    suppliersContacted: false;
    emailsSent: false;
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

export function parseCandidateSupplierRegistryImportArgs(
  argv = process.argv.slice(2),
  env = process.env,
): CandidateSupplierRegistryImportArgs {
  const apply =
    argv.includes("--apply") ||
    env.SOURCE_CANDIDATE_SUPPLIER_REGISTRY_IMPORT_APPLY === "true";
  const operatorJob =
    argv.includes("--operator-job") ||
    env.SOURCE_CANDIDATE_SUPPLIER_REGISTRY_IMPORT_OPERATOR_JOB === "true";
  const tenantArg =
    argValue(argv, "--tenant-key") ??
    envValue(env, "SOURCE_CANDIDATE_SUPPLIER_REGISTRY_TENANT_KEY") ??
    envValue(env, "TENANT_KEY");
  const tenantKey = tenantArg ?? (apply ? "" : "corpus_global");
  if (!tenantKey) throw new Error("Apply mode requires --tenant-key.");
  if (apply && tenantKey.trim().toLowerCase() === "corpus_global") {
    throw new Error(
      "corpus_global cannot be used for apply; select one explicit tenant.",
    );
  }
  requireOperatorValue(
    tenantArg,
    "--tenant-key or SOURCE_CANDIDATE_SUPPLIER_REGISTRY_TENANT_KEY",
    operatorJob,
  );
  const datasetVersion =
    argValue(argv, "--dataset-version") ??
    envValue(env, "SOURCE_CANDIDATE_SUPPLIER_REGISTRY_DATASET_VERSION") ??
    "v1";
  const inputSourceVersion =
    requireOperatorValue(
      argValue(argv, "--input-source-version") ??
        envValue(env, "SOURCE_CANDIDATE_SUPPLIER_REGISTRY_INPUT_SOURCE_VERSION"),
      "--input-source-version or SOURCE_CANDIDATE_SUPPLIER_REGISTRY_INPUT_SOURCE_VERSION",
      operatorJob,
    ) ?? datasetVersion;
  const expectedInputSha256 = requireOperatorValue(
    argValue(argv, "--input-sha256") ??
      envValue(env, "SOURCE_CANDIDATE_SUPPLIER_REGISTRY_INPUT_SHA256"),
    "--input-sha256 or SOURCE_CANDIDATE_SUPPLIER_REGISTRY_INPUT_SHA256",
    operatorJob,
  );
  const loadRunId =
    requireOperatorValue(
      argValue(argv, "--load-run-id") ??
        envValue(env, "SOURCE_CANDIDATE_SUPPLIER_REGISTRY_LOAD_RUN_ID"),
      "--load-run-id or SOURCE_CANDIDATE_SUPPLIER_REGISTRY_LOAD_RUN_ID",
      operatorJob,
    ) ??
    `source-candidate-supplier-registry-${new Date()
      .toISOString()
      .replace(/[-:.]/g, "")}`;
  const idempotencyKey =
    requireOperatorValue(
      argValue(argv, "--idempotency-key") ??
        envValue(env, "SOURCE_CANDIDATE_SUPPLIER_REGISTRY_IDEMPOTENCY_KEY"),
      "--idempotency-key or SOURCE_CANDIDATE_SUPPLIER_REGISTRY_IDEMPOTENCY_KEY",
      operatorJob,
    ) ??
    `source-candidate-supplier-registry:${tenantKey}:${inputSourceVersion}:${loadRunId}`;
  return {
    apply,
    approved:
      env.SOURCE_CANDIDATE_SUPPLIER_REGISTRY_IMPORT_APPLY_APPROVED === "true",
    confirmation:
      argValue(argv, "--confirm") ??
      envValue(env, "SOURCE_CANDIDATE_SUPPLIER_REGISTRY_IMPORT_CONFIRMATION"),
    tenantKey,
    inputPath: path.resolve(
      argValue(argv, "--input") ??
        envValue(env, "SOURCE_CANDIDATE_SUPPLIER_REGISTRY_INPUT_PATH") ??
        DEFAULT_INPUT,
    ),
    datasetId:
      argValue(argv, "--dataset-id") ??
      envValue(env, "SOURCE_CANDIDATE_SUPPLIER_REGISTRY_DATASET_ID") ??
      "source-candidate-supplier-registry-synthetic-v1",
    datasetVersion,
    inputSourceVersion,
    expectedInputSha256,
    loadRunId,
    idempotencyKey,
    buildVersion:
      argValue(argv, "--build-version") ??
      envValue(env, "SOURCE_CANDIDATE_SUPPLIER_REGISTRY_BUILD_VERSION") ??
      "local-dry-run",
    outDir: path.resolve(
      argValue(argv, "--out-dir") ??
        envValue(env, "SOURCE_CANDIDATE_SUPPLIER_REGISTRY_OUT_DIR") ??
        "/tmp/source-candidate-supplier-registry-import",
    ),
    operatorJob,
    emitProofBundle:
      argv.includes("--emit-proof-bundle") ||
      env.SOURCE_CANDIDATE_SUPPLIER_REGISTRY_EMIT_PROOF_BUNDLE === "true" ||
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

function parseRows(csvText: string): CandidateSupplierRegistryRow[] {
  const parsed = Papa.parse<CandidateSupplierRegistryRow>(csvText, {
    header: true,
    skipEmptyLines: true,
    transform: (value) => value.trim(),
  });
  if (parsed.errors.length > 0) {
    throw new Error(
      `Candidate supplier CSV parse failed: ${parsed.errors
        .map((error) => `row ${error.row ?? "?"}: ${error.message}`)
        .join("; ")}`,
    );
  }
  return parsed.data;
}

function mappedContactPolicy(
  row: CandidateSupplierRegistryRow,
): CandidateSupplierRegistryImportSupplier["contactPolicy"] {
  if (
    row.contact_policy === "do_not_contact" ||
    row.contact_authority_state === "contact_prohibited"
  ) {
    return "do_not_contact";
  }
  return "review_required";
}

function supplierFromRow(
  row: CandidateSupplierRegistryRow,
  args: CandidateSupplierRegistryImportArgs,
): CandidateSupplierRegistryImportSupplier {
  const sourceSha256 = sha256(canonicalJson(row));
  const contactPolicy = mappedContactPolicy(row);
  return {
    supplierId: row.record_id,
    legalEntityId: row.record_id,
    legalName: row.supplier_legal_name,
    sourceRow: Number(row.source_row),
    sourceRecordId: row.source_record_id,
    sourceSha256,
    sourceSystem: row.source_system,
    categoryId: row.category_id,
    businessFunction: row.business_function,
    archetypeId: row.eligible_archetype_id,
    eligibilityBasis: row.eligibility_basis,
    contactPolicy,
    contacts: [],
    existingContractStatus: row.existing_contract_status,
    existingContractReference: row.existing_contract_reference || null,
    rawSource: { ...row },
    registryPayload: {
      authorityState: "accepted",
      categoryKeys: [row.category_id],
      functionKeys: [row.business_function],
      archetypeKeys: [row.eligible_archetype_id],
      contactPolicy,
      contacts: [],
      sourceSha256,
      inputSourceVersion: args.inputSourceVersion,
      fixtureAuthorityState: row.authority_state,
      fixtureContactPolicy: row.contact_policy,
      fixtureContactAuthorityState: row.contact_authority_state,
      existingContractStatus: row.existing_contract_status,
      existingContractReference: row.existing_contract_reference || null,
    },
  };
}

export function buildCandidateSupplierRegistryImportPlan(input: {
  args: CandidateSupplierRegistryImportArgs;
  csvText: string;
}): CandidateSupplierRegistryImportPlan {
  const validation = buildCandidateSupplierRegistryValidation({
    csvText: input.csvText,
    inputPath: input.args.inputPath,
  });
  if (validation.status !== "pass") {
    throw new Error(
      `Candidate supplier registry validation failed: ${validation.errors.join("; ")}`,
    );
  }
  const rows = parseRows(input.csvText);
  const suppliers = rows
    .filter((row) => row.expected_decision === "eligible")
    .map((row) => supplierFromRow(row, input.args));
  const archetypes = [...new Set(suppliers.map((supplier) => supplier.archetypeId))].sort();

  return {
    event: "source_candidate_supplier_registry_import_plan",
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
    rowCount: rows.length,
    supplierCount: suppliers.length,
    archetypes,
    validation,
    failClosedControls: validation.failClosedControls,
    suppliers,
    authority: {
      dryRunDefault: true,
      supplierRegistryRowsOnly: true,
      candidateSupplierAuthoritiesWritten: false,
      eventsCreated: false,
      suppliersContacted: false,
      emailsSent: false,
    },
  };
}

function assertExpectedInputSha(
  args: CandidateSupplierRegistryImportArgs,
  actualSha256: string,
): void {
  if (!args.expectedInputSha256) return;
  const expected = args.expectedInputSha256.toLowerCase();
  if (!/^[a-f0-9]{64}$/.test(expected)) {
    throw new Error("--input-sha256 must be a 64-character lowercase hex SHA-256.");
  }
  if (actualSha256 !== expected) {
    throw new Error(
      `Candidate supplier registry input SHA mismatch: expected ${expected}, got ${actualSha256}.`,
    );
  }
}

function assertOperatorContract(args: CandidateSupplierRegistryImportArgs): void {
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

function writeProofManifest(
  args: CandidateSupplierRegistryImportArgs,
  plan: CandidateSupplierRegistryImportPlan,
  result: { inserted: number; committed: boolean },
): void {
  writeFileSync(
    path.join(args.outDir, "proof-manifest.json"),
    `${JSON.stringify(
      {
        event: "source_candidate_supplier_registry_import_proof",
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
          supplierCount: plan.supplierCount,
          inserted: result.inserted,
          committed: result.committed,
          failClosedControlCount: plan.failClosedControls.length,
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

function emitCompactProofSummary(result: CandidateSupplierRegistryImportPlan & {
  inserted: number;
  committed: boolean;
}): void {
  const summary = {
    schemaVersion: 1,
    event: "source_candidate_supplier_registry_import_proof_summary",
    mode: result.apply ? "apply" : "dry_run",
    rowCount: result.rowCount,
    supplierCount: result.supplierCount,
    archetypeCount: result.archetypes.length,
    failClosedControlCount: result.failClosedControls.length,
    inputSha256: result.inputSha256,
    inputSourceVersion: result.inputSourceVersion,
    inserted: result.inserted,
    committed: result.committed,
    authority: result.authority,
  };
  console.log(`__SOURCE_CANDIDATE_SUPPLIER_PROOF_SUMMARY__${JSON.stringify(summary)}`);
}

function databaseUrl(env = process.env): string {
  const value = env.SOURCE_CONTEXT_DATABASE_URL ?? env.DATABASE_URL;
  if (!value) throw new Error("Apply mode requires SOURCE_CONTEXT_DATABASE_URL or DATABASE_URL.");
  return value;
}

async function applyPlan(
  plan: CandidateSupplierRegistryImportPlan,
  args: CandidateSupplierRegistryImportArgs,
): Promise<number> {
  if (!args.approved || args.confirmation !== APPLY_CONFIRMATION) {
    throw new Error(
      `Apply mode requires SOURCE_CANDIDATE_SUPPLIER_REGISTRY_IMPORT_APPLY_APPROVED=true and --confirm=${APPLY_CONFIRMATION}.`,
    );
  }
  const client = new Client(
    postgresClientOptions(databaseUrl(), "source-candidate-supplier-registry-import"),
  );
  await client.connect();
  let inserted = 0;
  try {
    await client.query("BEGIN");
    await client.query("SELECT set_config('app.tenant_key', $1, true)", [
      plan.tenantKey,
    ]);
    const schema = await client.query<{ table_name: string | null }>(
      "SELECT to_regclass('source.vendor')::text AS table_name",
    );
    if (!schema.rows[0]?.table_name) {
      throw new Error("source.vendor is not applied; stop before loading.");
    }
    for (const supplier of plan.suppliers) {
      const result = await client.query<{ raw_payload: unknown }>(
        `INSERT INTO source.vendor (
           tenant_key, vendor_id, legal_name, supplier_category, strategic_status,
           relationship_owner_role, active_state, source_system, source_record_id,
           as_of_date, confidence, quality_state, evidence_reference, load_run_id, raw_payload
         )
         VALUES (
           $1, $2, $3, $4, 'candidate_supplier_registry', $5, 'active', $6, $7,
           CURRENT_DATE, 0.9000, 'reviewed', $8, $9, $10::jsonb
         )
         ON CONFLICT (tenant_key, vendor_id) DO NOTHING
         RETURNING raw_payload`,
        [
          plan.tenantKey,
          supplier.supplierId,
          supplier.legalName,
          supplier.categoryId,
          supplier.businessFunction,
          supplier.sourceSystem,
          supplier.sourceRecordId,
          `${plan.datasetId}:${plan.inputSourceVersion}:${supplier.sourceRecordId}`,
          args.loadRunId,
          JSON.stringify({
            dataset_id: plan.datasetId,
            dataset_version: plan.datasetVersion,
            input_source_version: plan.inputSourceVersion,
            input_sha256: plan.inputSha256,
            load_run_id: args.loadRunId,
            idempotency_key_sha256: sha256(args.idempotencyKey),
            synthetic_policy: "public_safe_synthetic_fixture_not_client_truth",
            candidate_supplier_registry: supplier.registryPayload,
            raw_source: supplier.rawSource,
          }),
        ],
      );
      if (result.rowCount === 1) {
        inserted += 1;
        continue;
      }
      const existing = await client.query<{ source_sha256: string | null }>(
        `SELECT raw_payload #>> '{candidate_supplier_registry,sourceSha256}' AS source_sha256
           FROM source.vendor
          WHERE tenant_key = $1 AND vendor_id = $2`,
        [plan.tenantKey, supplier.supplierId],
      );
      if (existing.rows[0]?.source_sha256 !== supplier.sourceSha256) {
        throw new Error(
          `Conflicting supplier registry bytes for ${supplier.supplierId}; refusing overwrite.`,
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

export async function runCandidateSupplierRegistryImport(
  args: CandidateSupplierRegistryImportArgs,
) {
  assertOperatorContract(args);
  const csvText = readFileSync(args.inputPath, "utf8");
  assertExpectedInputSha(args, sha256(csvText));
  const plan = buildCandidateSupplierRegistryImportPlan({ args, csvText });
  mkdirSync(args.outDir, { recursive: true });
  writeFileSync(
    path.join(args.outDir, "candidate-supplier-registry-import-plan.json"),
    `${JSON.stringify(plan, null, 2)}\n`,
  );
  if (!args.apply) {
    const result = { ...plan, inserted: 0, committed: false };
    writeProofManifest(args, plan, result);
    if (args.emitProofBundle) emitProofBundle(args.outDir);
    if (args.operatorJob) emitCompactProofSummary(result);
    return result;
  }
  const inserted = await applyPlan(plan, args);
  const result = { ...plan, inserted, committed: true };
  writeFileSync(
    path.join(args.outDir, "candidate-supplier-registry-import-result.json"),
    `${JSON.stringify(result, null, 2)}\n`,
  );
  writeProofManifest(args, plan, result);
  if (args.emitProofBundle) emitProofBundle(args.outDir);
  if (args.operatorJob) emitCompactProofSummary(result);
  return result;
}

const isDirect = process.argv[1]
  ? import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href
  : false;
if (isDirect) {
  const args = parseCandidateSupplierRegistryImportArgs();
  runCandidateSupplierRegistryImport(args)
    .then((result) => {
      if (!args.operatorJob) console.log(JSON.stringify(result, null, 2));
    })
    .catch((error) => {
      console.error(error instanceof Error ? error.message : String(error));
      process.exitCode = 1;
    });
}
