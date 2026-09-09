import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";

import { getAzureWriteFluentClient } from "../../src/lib/data-plane/postgresCompat";
import { persistContractEvidencePack } from "../../src/lib/source/contract-evidence/persistence";
import type {
  SourceContractEvidencePackInput,
  SourceContractEvidenceRowInput,
} from "../../src/lib/source/contract-evidence/types";

type JobInput = Omit<SourceContractEvidencePackInput, "tenantKey" | "sourceEventId">;

const PROOF_BEGIN = "__SEMANTIC2_PROOF_TGZ_BEGIN__";
const PROOF_END = "__SEMANTIC2_PROOF_TGZ_END__";

function requiredEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is required.`);
  return value;
}

function countFamilies(rows: SourceContractEvidenceRowInput[]): Record<string, number> {
  return rows.reduce<Record<string, number>>((counts, row) => {
    counts[row.family] = (counts[row.family] ?? 0) + 1;
    return counts;
  }, {});
}

function metricValue(
  rows: Array<{ metric_key: string; metric_value: string | number }>,
  key: string,
): number | null {
  const row = rows.find((entry) => entry.metric_key === key);
  if (!row) return null;
  const value = Number(row.metric_value);
  return Number.isFinite(value) ? value : null;
}

function writeJson(outDir: string, name: string, value: unknown): void {
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, name), `${JSON.stringify(value, null, 2)}\n`);
}

function emitProofBundle(outDir: string): void {
  const tarPath = path.join(path.dirname(outDir), `${path.basename(outDir)}.tgz`);
  const result = spawnSync(
    "tar",
    ["-czf", tarPath, "-C", path.dirname(outDir), path.basename(outDir)],
    { encoding: "utf8" },
  );
  if (result.status !== 0) {
    throw new Error(result.stderr || "Could not create Source evidence proof bundle.");
  }
  console.log(PROOF_BEGIN);
  console.log(fs.readFileSync(tarPath).toString("base64"));
  console.log(PROOF_END);
}

async function main(): Promise<void> {
  const startedAt = new Date().toISOString();
  const tenantKey = requiredEnv("SOURCE_EVENT_EVIDENCE_TENANT_KEY");
  const sourceEventId = requiredEnv("SOURCE_EVENT_EVIDENCE_EVENT_ID");
  const runId = requiredEnv("SOURCE_EVENT_EVIDENCE_RUN_ID");
  const buildVersion = requiredEnv("SOURCE_EVENT_EVIDENCE_BUILD_VERSION");
  const inputSourceVersion = requiredEnv("SOURCE_EVENT_EVIDENCE_INPUT_SOURCE_VERSION");
  const idempotencyKey = requiredEnv("SOURCE_EVENT_EVIDENCE_IDEMPOTENCY_KEY");
  const releaseRecord = requiredEnv("SOURCE_EVENT_EVIDENCE_RELEASE_RECORD");
  const expectedPackageSha256 = requiredEnv("SOURCE_EVENT_EVIDENCE_PACKAGE_SHA256");
  if (process.env.SOURCE_EVENT_EVIDENCE_APPLY_APPROVED !== "true") {
    throw new Error("Refusing write: SOURCE_EVENT_EVIDENCE_APPLY_APPROVED must be true.");
  }

  const packagePath = path.resolve(requiredEnv("SOURCE_EVENT_EVIDENCE_PACKAGE_PATH"));
  const outDir = path.resolve(
    process.env.SOURCE_EVENT_EVIDENCE_PROOF_DIR?.trim() ||
      `/tmp/source-event-evidence-${runId}`,
  );
  const packageBytes = fs.readFileSync(packagePath);
  const actualPackageSha256 = createHash("sha256").update(packageBytes).digest("hex");
  if (actualPackageSha256 !== expectedPackageSha256) {
    throw new Error(
      `Package checksum mismatch: expected ${expectedPackageSha256}, received ${actualPackageSha256}.`,
    );
  }
  const parsed = JSON.parse(packageBytes.toString("utf8")) as JobInput;
  if (parsed.uploadBatchId !== idempotencyKey) {
    throw new Error("Package uploadBatchId must equal the governed idempotency key.");
  }
  if (parsed.sourceType !== "synthetic_demo") {
    throw new Error("This operator job accepts only explicitly labelled synthetic demo evidence.");
  }

  const inputCounts = countFamilies(parsed.rows);
  const expectedCounts: Record<string, number> = {
    contract_baseline: 1,
    application_inventory: 48,
    invoice_summary: 12,
    invoice_exception: 4,
    sla_performance: 72,
    ticket_volume: 72,
    staffing_model: 30,
    change_order: 12,
    renewal_terms: 5,
    evidence_reference: 45,
  };
  const inputFailures = Object.entries(expectedCounts)
    .filter(([family, count]) => inputCounts[family] !== count)
    .map(([family, count]) => `${family}: expected ${count}, received ${inputCounts[family] ?? 0}`);
  if (parsed.rows.length !== 301) {
    inputFailures.push(`total rows: expected 301, received ${parsed.rows.length}`);
  }
  if (inputFailures.length > 0) {
    throw new Error(`Input quality gate failed: ${inputFailures.join("; ")}`);
  }

  const db = getAzureWriteFluentClient();
  const { data: eventRow, error: eventError } = await db
    .from("source_events")
    .select("id,client_key")
    .eq("id", sourceEventId)
    .eq("client_key", tenantKey)
    .maybeSingle<{ id: string; client_key: string }>();
  if (eventError || !eventRow) {
    throw new Error(eventError?.message || "Source event is not owned by the requested tenant.");
  }

  const jobContract = {
    jobName: "source-event-contract-evidence-load",
    runId,
    tenantScope: tenantKey,
    buildVersion,
    inputSourceVersion,
    idempotencyKey,
    operatorIdentity: process.env.ABARVA_OPERATOR_IDENTITY ?? "aca-operator-job",
    gitSha: process.env.ABARVA_OPERATOR_BRANCH_COMMIT ?? null,
    imageDigest: process.env.ABARVA_OPERATOR_IMAGE_DIGEST ?? null,
    retryCount: Number(process.env.ABARVA_JOB_RETRY_COUNT ?? 0),
    timeoutSeconds: Number(process.env.ABARVA_JOB_TIMEOUT_SECONDS ?? 7200),
    releaseRecord,
    packageSha256: actualPackageSha256,
  };
  writeJson(outDir, "00-job-contract.json", { ...jobContract, startedAt });
  writeJson(outDir, "01-input-quality-gate.json", {
    status: "PASS",
    packagePath,
    totalRows: parsed.rows.length,
    familyCounts: inputCounts,
  });

  const persisted = await persistContractEvidencePack(
    {
      ...parsed,
      tenantKey,
      sourceEventId,
      metadata: { ...(parsed.metadata ?? {}), jobContract },
    },
    db,
  );

  const { data: rowReadback, error: rowError } = await db
    .from("source_contract_evidence_rows")
    .select("evidence_family,validation_status")
    .eq("manifest_id", persisted.manifestId);
  const { data: metricReadback, error: metricError } = await db
    .from("source_contract_evidence_metrics")
    .select("metric_key,metric_value,validation_status")
    .eq("manifest_id", persisted.manifestId);
  if (rowError || metricError) {
    throw new Error(rowError?.message || metricError?.message || "Readback failed.");
  }

  const acceptedRows = (rowReadback ?? []).filter(
    (row: { validation_status: string }) => row.validation_status === "accepted",
  );
  const readbackCounts = countFamilies(
    acceptedRows.map((row: { evidence_family: SourceContractEvidenceRowInput["family"] }) => ({
      family: row.evidence_family,
      payload: {},
    })),
  );
  const readbackFailures = Object.entries(expectedCounts)
    .filter(([family, count]) => readbackCounts[family] !== count)
    .map(([family, count]) => `${family}: expected ${count}, read back ${readbackCounts[family] ?? 0}`);
  const unclaimedCredit = metricValue(
    metricReadback ?? [],
    "unclaimed_service_credit_usd",
  );
  if (unclaimedCredit !== 24_531.25) {
    readbackFailures.push(
      `unclaimed service credit: expected 24531.25, read back ${unclaimedCredit ?? "missing"}`,
    );
  }
  if (readbackFailures.length > 0) {
    writeJson(outDir, "02-readback-quality-gate.json", {
      status: "FAIL",
      manifestId: persisted.manifestId,
      failures: readbackFailures,
      familyCounts: readbackCounts,
      metrics: metricReadback,
    });
    throw new Error(`Readback quality gate failed: ${readbackFailures.join("; ")}`);
  }

  const finishedAt = new Date().toISOString();
  const summary = {
    ...jobContract,
    startedAt,
    finishedAt,
    status: "succeeded",
    manifestId: persisted.manifestId,
    validationOutput: "02-readback-quality-gate.json",
    qualityGateOutput: "03-summary.json",
    blobProofBundleLocation: "captured-by-aca-operator-wrapper",
    progress: [
      { checkpoint: "input_validated", status: "complete", rows: parsed.rows.length },
      { checkpoint: "evidence_persisted", status: "complete", rows: acceptedRows.length },
      { checkpoint: "readback_reconciled", status: "complete", rows: acceptedRows.length },
    ],
    familyCounts: readbackCounts,
    metrics: metricReadback,
    qualityGate: { status: "PASS", failures: [] },
  };
  writeJson(outDir, "02-readback-quality-gate.json", {
    status: "PASS",
    manifestId: persisted.manifestId,
    familyCounts: readbackCounts,
    metrics: metricReadback,
  });
  writeJson(outDir, "03-summary.json", summary);
  console.log(JSON.stringify(summary, null, 2));
  if (process.env.SOURCE_EVENT_EVIDENCE_EMIT_PROOF_BUNDLE === "true") {
    emitProofBundle(outDir);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
