import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import os from "node:os";
import path from "node:path";
import {
  parseServiceNowImportArgs,
  runServiceNowRequestImport,
} from "./load-servicenow-sourcing-requests";

const PROOF_BEGIN = "__SOURCE_SERVICENOW_REQUEST_IMPORT_PROOF_TGZ_BEGIN__";
const PROOF_END = "__SOURCE_SERVICENOW_REQUEST_IMPORT_PROOF_TGZ_END__";
const APPLY_CONFIRMATION = "APPLY_SERVICENOW_REQUESTS";
const RELEASE_RECORD =
  "docs/releases/records/2026-09-22-source-servicenow-request-import-job.md";

type JobMode = "dry-run" | "apply";

function envValue(name: string, fallback = ""): string {
  return process.env[name]?.trim() || fallback;
}

function requiredEnv(name: string): string {
  const value = envValue(name);
  if (!value) throw new Error(`${name} is required.`);
  return value;
}

function sha256(value: string | Buffer): string {
  return createHash("sha256").update(value).digest("hex");
}

function parseMode(): JobMode {
  const raw = envValue("SOURCE_SERVICENOW_REQUEST_IMPORT_MODE", "dry-run");
  if (raw === "dry_run" || raw === "dry-run") return "dry-run";
  if (raw === "apply") return "apply";
  throw new Error(
    "SOURCE_SERVICENOW_REQUEST_IMPORT_MODE must be dry-run or apply.",
  );
}

function writeJson(outDir: string, fileName: string, value: unknown): void {
  mkdirSync(outDir, { recursive: true });
  writeFileSync(path.join(outDir, fileName), `${JSON.stringify(value, null, 2)}\n`);
}

function emitProofBundle(outDir: string): void {
  const tarPath = path.join(path.dirname(outDir), `${path.basename(outDir)}.tgz`);
  const result = spawnSync(
    "tar",
    ["-czf", tarPath, "-C", path.dirname(outDir), path.basename(outDir)],
    { encoding: "utf8" },
  );
  if (result.status !== 0) {
    throw new Error(result.stderr || "Could not create ServiceNow import proof bundle.");
  }
  console.log(PROOF_BEGIN);
  console.log(readFileSync(tarPath).toString("base64"));
  console.log(PROOF_END);
}

function buildLoaderArgv(input: {
  mode: JobMode;
  tenantKey: string;
  inputPath: string;
  datasetId: string;
  datasetVersion: string;
  loadRunId: string;
  outDir: string;
  confirmation: string;
}): string[] {
  const argv = [
    "--tenant-key",
    input.tenantKey,
    "--input",
    input.inputPath,
    "--dataset-id",
    input.datasetId,
    "--dataset-version",
    input.datasetVersion,
    "--load-run-id",
    input.loadRunId,
    "--out-dir",
    input.outDir,
  ];
  if (input.mode === "apply") {
    argv.push("--apply", "--confirm", input.confirmation);
  }
  return argv;
}

async function main(): Promise<void> {
  const startedAt = new Date().toISOString();
  const mode = parseMode();
  const tenantKey = requiredEnv("SOURCE_SERVICENOW_REQUEST_IMPORT_TENANT_KEY");
  const loadRunId = requiredEnv("SOURCE_SERVICENOW_REQUEST_IMPORT_LOAD_RUN_ID");
  const idempotencyKey = requiredEnv(
    "SOURCE_SERVICENOW_REQUEST_IMPORT_IDEMPOTENCY_KEY",
  );
  const inputPath = path.resolve(
    envValue(
      "SOURCE_SERVICENOW_REQUEST_IMPORT_INPUT",
      "datasets/source-servicenow-sourcing-requests-synthetic-v1/servicenow_sourcing_requests.csv",
    ),
  );
  const datasetId = envValue(
    "SOURCE_SERVICENOW_REQUEST_IMPORT_DATASET_ID",
    "source-servicenow-sourcing-requests-synthetic-v1",
  );
  const datasetVersion = envValue(
    "SOURCE_SERVICENOW_REQUEST_IMPORT_DATASET_VERSION",
    "v1",
  );
  const inputSourceVersion = envValue(
    "SOURCE_SERVICENOW_REQUEST_IMPORT_INPUT_SOURCE_VERSION",
    datasetVersion,
  );
  const buildVersion = envValue(
    "SOURCE_SERVICENOW_REQUEST_IMPORT_BUILD_VERSION",
    envValue("ABARVA_OPERATOR_BRANCH_COMMIT", "local"),
  );
  const outDir = path.resolve(
    envValue(
      "SOURCE_SERVICENOW_REQUEST_IMPORT_OUT_DIR",
      path.join(os.tmpdir(), `source-servicenow-request-import-${loadRunId}`),
    ),
  );
  const releaseRecord = envValue(
    "SOURCE_SERVICENOW_REQUEST_IMPORT_RELEASE_RECORD",
    RELEASE_RECORD,
  );
  const confirmation = envValue("SOURCE_SERVICENOW_REQUEST_IMPORT_APPLY_CONFIRM");
  const inputBytes = readFileSync(inputPath);
  const inputSha256 = sha256(inputBytes);
  const expectedInputSha256 = envValue(
    "SOURCE_SERVICENOW_REQUEST_IMPORT_EXPECTED_INPUT_SHA256",
  );
  if (expectedInputSha256 && expectedInputSha256 !== inputSha256) {
    throw new Error(
      `Input checksum mismatch: expected ${expectedInputSha256}, received ${inputSha256}.`,
    );
  }
  if (mode === "apply") {
    if (envValue("SOURCE_SERVICENOW_REQUEST_IMPORT_APPLY_APPROVED") !== "true") {
      throw new Error(
        "Apply mode requires SOURCE_SERVICENOW_REQUEST_IMPORT_APPLY_APPROVED=true.",
      );
    }
    if (confirmation !== APPLY_CONFIRMATION) {
      throw new Error(
        `Apply mode requires SOURCE_SERVICENOW_REQUEST_IMPORT_APPLY_CONFIRM=${APPLY_CONFIRMATION}.`,
      );
    }
  }

  const jobContract = {
    jobName: "source-servicenow-request-import",
    runId: loadRunId,
    tenantScope: tenantKey,
    buildVersion,
    inputSourceVersion,
    idempotencyKey,
    startedAt,
    operatorIdentity: envValue("ABARVA_OPERATOR_IDENTITY", "aca-operator-job"),
    gitSha: envValue("ABARVA_OPERATOR_BRANCH_COMMIT") || null,
    imageDigest: envValue("ABARVA_OPERATOR_IMAGE_DIGEST") || null,
    retryCount: Number(envValue("ABARVA_JOB_RETRY_COUNT", "0")),
    timeoutSeconds: Number(envValue("ABARVA_JOB_TIMEOUT_SECONDS", "7200")),
    inputPath,
    inputSha256,
    releaseRecord,
    mode,
  };
  writeJson(outDir, "00-job-contract.json", jobContract);
  writeJson(outDir, "01-progress.json", {
    status: "running",
    checkpoints: [
      { checkpoint: "contract_recorded", status: "complete" },
      { checkpoint: "loader_started", status: "running" },
    ],
  });

  const args = parseServiceNowImportArgs(
    buildLoaderArgv({
      mode,
      tenantKey,
      inputPath,
      datasetId,
      datasetVersion,
      loadRunId,
      outDir,
      confirmation,
    }),
    {
      ...process.env,
      SOURCE_SERVICENOW_REQUEST_IMPORT_APPLY_APPROVED:
        mode === "apply" ? "true" : "",
    },
  );
  const result = await runServiceNowRequestImport(args);
  const validation = {
    status: "PASS",
    tenantKey: result.tenantKey,
    datasetId: result.datasetId,
    datasetVersion: result.datasetVersion,
    loadRunId: result.loadRunId,
    inputSha256: result.inputSha256,
    rowCount: result.rowCount,
    expectedArchetypes: result.expectedArchetypes,
    archetypes: result.archetypes,
    missingArchetypes: result.missingArchetypes,
    committed: result.committed,
    inserted: result.inserted,
  };
  const failures: string[] = [];
  if (result.inputSha256 !== inputSha256) failures.push("input sha mismatch");
  if (result.missingArchetypes.length > 0) {
    failures.push(`missing archetypes: ${result.missingArchetypes.join(", ")}`);
  }
  if (!result.authority.requestVersionsOnly) {
    failures.push("job authority is broader than request-version rows");
  }
  if (result.authority.eventsCreated) failures.push("job created Source events");
  if (result.authority.mappingDecisionsWritten) {
    failures.push("job wrote mapping decisions");
  }
  if (result.authority.suppliersContacted) failures.push("job contacted suppliers");
  const qualityGate = {
    status: failures.length === 0 ? "PASS" : "FAIL",
    failures,
    dryRunDefault: mode === "dry-run",
    requestVersionsOnly: result.authority.requestVersionsOnly,
    migrationsApplied: false,
  };
  writeJson(outDir, "02-validation-output.json", validation);
  writeJson(outDir, "03-quality-gate.json", qualityGate);
  if (failures.length > 0) {
    throw new Error(`ServiceNow import quality gate failed: ${failures.join("; ")}`);
  }

  const finishedAt = new Date().toISOString();
  const summary = {
    structured_event: "source_servicenow_request_import_job",
    ...jobContract,
    finishedAt,
    status: "succeeded",
    validationOutput: "02-validation-output.json",
    qualityGateOutput: "03-quality-gate.json",
    blobProofBundleLocation: "captured-by-aca-operator-wrapper",
    committed: result.committed,
    inserted: result.inserted,
    progress: [
      { checkpoint: "contract_recorded", status: "complete" },
      { checkpoint: "input_validated", status: "complete", rows: result.rowCount },
      {
        checkpoint: mode === "apply" ? "request_versions_applied" : "dry_run_planned",
        status: "complete",
        rows: result.rowCount,
      },
      { checkpoint: "quality_gate", status: "complete" },
    ],
  };
  writeJson(outDir, "01-progress.json", {
    status: "succeeded",
    checkpoints: summary.progress,
  });
  writeJson(outDir, "04-summary.json", summary);
  console.log(JSON.stringify(summary, null, 2));
  if (envValue("SOURCE_SERVICENOW_REQUEST_IMPORT_EMIT_PROOF_BUNDLE") === "true") {
    emitProofBundle(outDir);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
