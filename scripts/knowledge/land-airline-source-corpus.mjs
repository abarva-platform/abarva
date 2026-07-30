#!/usr/bin/env node
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { dbConnectionConfig, setTenantContext } from "./build-review-decision-ledger.mjs";

const __filename = fileURLToPath(import.meta.url);
const REPO_ROOT = path.resolve(path.dirname(__filename), "..", "..");

const TENANT_KEY = "airline-demo-new";
const RELEASE_ID = "airline-demo-new-source-corpus-v1.0.0";
const PACKAGE_ROOT = path.join(REPO_ROOT, "clients", TENANT_KEY, "19-template-instantiation-source-corpus");
const FREEZE_MANIFEST = path.join(REPO_ROOT, "clients", TENANT_KEY, "execution", `${RELEASE_ID}.freeze-manifest.json`);
const EXECUTE_ACK = "LAND_AIRLINE_SOURCE_CORPUS";
const OPERATIONAL_CONTAINER = "raw";
const OPERATIONAL_MANIFEST_CONTAINER = "source-manifests";
const EVALUATOR_CONTAINER = "restricted-evaluator";

const VALID_MODES = new Set(["plan", "execute"]);
const VALID_SCOPES = new Set(["operational", "evaluator"]);

class LandingError extends Error {
  constructor(code, message, details = {}) {
    super(message);
    this.name = "LandingError";
    this.code = code;
    this.details = details;
  }
}

function parseArgs(argv = process.argv.slice(2), env = process.env) {
  const args = {
    tenant: env.ABARVA_TENANT_KEY ?? TENANT_KEY,
    releaseId: env.ABARVA_RELEASE_ID ?? RELEASE_ID,
    scope: env.ABARVA_SOURCE_LANDING_SCOPE ?? "operational",
    mode: env.ABARVA_SOURCE_LANDING_MODE ?? "plan",
    runId: env.ABARVA_RUN_ID ?? "",
    packageRoot: env.ABARVA_SOURCE_PACKAGE_ROOT ?? PACKAGE_ROOT,
    out: "",
  };

  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    const next = () => {
      const value = argv[i + 1];
      if (!value || value.startsWith("--")) {
        throw new LandingError("missing_cli_value", `Missing value for ${token}`);
      }
      i += 1;
      return value;
    };

    switch (token) {
      case "--tenant":
        args.tenant = next();
        break;
      case "--release-id":
        args.releaseId = next();
        break;
      case "--scope":
        args.scope = next();
        break;
      case "--mode":
        args.mode = next();
        break;
      case "--run-id":
        args.runId = next();
        break;
      case "--package-root":
        args.packageRoot = path.resolve(next());
        break;
      case "--out":
        args.out = path.resolve(next());
        break;
      default:
        throw new LandingError("unknown_cli_argument", `Unknown argument: ${token}`);
    }
  }

  return args;
}

function assertArgs(args) {
  if (args.tenant !== TENANT_KEY) {
    throw new LandingError("tenant_not_authorized", `This launcher is scoped only to ${TENANT_KEY}.`);
  }
  if (args.releaseId !== RELEASE_ID) {
    throw new LandingError("release_not_authorized", `This launcher is scoped only to ${RELEASE_ID}.`);
  }
  if (!VALID_SCOPES.has(args.scope)) {
    throw new LandingError("invalid_scope", `Scope must be one of: ${Array.from(VALID_SCOPES).join(", ")}`);
  }
  if (!VALID_MODES.has(args.mode)) {
    throw new LandingError("invalid_mode", `Mode must be one of: ${Array.from(VALID_MODES).join(", ")}`);
  }
  if (args.mode === "execute" && process.env.ABARVA_SOURCE_LANDING_EXECUTE_ACK !== EXECUTE_ACK) {
    throw new LandingError("execute_ack_missing", `Set ABARVA_SOURCE_LANDING_EXECUTE_ACK=${EXECUTE_ACK} to execute.`);
  }
  if (!fs.existsSync(path.join(args.packageRoot, "PACKAGE_MANIFEST.json"))) {
    throw new LandingError("package_manifest_missing", `Missing PACKAGE_MANIFEST.json under ${args.packageRoot}`);
  }
  if (!fs.existsSync(FREEZE_MANIFEST)) {
    throw new LandingError("freeze_manifest_missing", `Missing freeze manifest: ${FREEZE_MANIFEST}`);
  }
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function sha256File(filePath) {
  const hash = crypto.createHash("sha256");
  hash.update(fs.readFileSync(filePath));
  return hash.digest("hex");
}

function sha256Json(value) {
  return crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

function sourceRefFor(relativePath) {
  const stem = relativePath
    .replace(/\.[^.]+$/, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 92);
  const suffix = crypto.createHash("sha1").update(relativePath).digest("hex").slice(0, 8);
  return `src-airdn-${stem}-${suffix}`;
}

function familyFor(relativePath) {
  if (relativePath.startsWith("01-template-workbooks/")) return "client_intake_template";
  if (relativePath.startsWith("02-synthetic-enterprise/")) return "synthetic_enterprise_context";
  if (relativePath.startsWith("03-source-corpus-design/synthetic-source-samples/")) return "parser_visible_source_sample";
  if (relativePath.startsWith("03-source-corpus-design/")) return "source_corpus_design";
  return "source_package_control";
}

function parserContractFor(relativePath) {
  if (relativePath.startsWith("03-source-corpus-design/synthetic-source-samples/")) return "airline-source-parser-visible-v1";
  if (relativePath.startsWith("01-template-workbooks/")) return "airline-client-template-workbook-v1";
  if (relativePath.startsWith("02-synthetic-enterprise/")) return "airline-synthetic-enterprise-context-v1";
  if (relativePath.startsWith("03-source-corpus-design/")) return "airline-source-design-control-v1";
  return "airline-source-package-control-v1";
}

function syncModeFor(relativePath) {
  if (!relativePath.startsWith("03-source-corpus-design/synthetic-source-samples/")) return "REFERENCE_ONLY";
  const name = path.basename(relativePath).toLowerCase();
  if (name.includes("invoice-change-order-history") || name.includes("sla-incident-history") || name.includes("bafo-revisions")) {
    return "DELTA_APPEND";
  }
  if (
    name.includes("vendor-proposals") ||
    name.includes("proposal-pricing") ||
    name.includes("rate-cards") ||
    name.includes("evaluation-scorecards") ||
    name.includes("assumptions-exceptions") ||
    name.includes("transition-commitments")
  ) {
    return "DELTA_UPSERT";
  }
  return "FULL_SNAPSHOT";
}

function businessKeyFor(relativePath) {
  const name = path.basename(relativePath).toLowerCase();
  if (name.includes("application")) return "application_id";
  if (name.includes("bi-report")) return "report_id";
  if (name.includes("cloud-infrastructure")) return "infra_id";
  if (name.includes("control")) return "control_id";
  if (name.includes("data-analytics")) return "data_product_id";
  if (name.includes("integration")) return "integration_id";
  if (name.includes("process-map")) return "process_id";
  if (name.includes("kpi") || name.includes("sla")) return "kpi_id";
  if (name.includes("vendor-contract")) return "contract_id";
  if (name.includes("vendor-register")) return "vendor_id";
  if (name.includes("program")) return "program_id";
  if (name.includes("relationship")) return "relationship_id";
  if (name.includes("risk")) return "risk_id";
  if (name.includes("service-volume")) return "volume_id";
  if (name.includes("workforce")) return "workforce_id";
  if (name.includes("proposal")) return "proposal_id";
  if (name.includes("rate-card")) return "rate_card_id";
  if (name.includes("invoice")) return "invoice_source";
  return relativePath.startsWith("03-source-corpus-design/synthetic-source-samples/") ? "source_row_number" : "source_version_ref";
}

function contentTypeFor(relativePath) {
  if (relativePath.endsWith(".csv")) return "text/csv";
  if (relativePath.endsWith(".json")) return "application/json";
  if (relativePath.endsWith(".md")) return "text/markdown";
  if (relativePath.endsWith(".html")) return "text/html";
  if (relativePath.endsWith(".xlsx")) return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
  return "application/octet-stream";
}

function schemaHashFor(filePath, relativePath) {
  if (/\.csv$/i.test(relativePath)) {
    const header = fs.readFileSync(filePath, "utf8").split(/\r?\n/, 1)[0] ?? "";
    return crypto.createHash("sha256").update(header.trim()).digest("hex");
  }
  return crypto.createHash("sha256").update(`${contentTypeFor(relativePath)}:${path.extname(relativePath).toLowerCase()}`).digest("hex");
}

function sourceShapeFor(filePath, relativePath) {
  if (/\.csv$/i.test(relativePath)) {
    const text = fs.readFileSync(filePath, "utf8");
    const lines = text.split(/\r?\n/).filter((line) => line.trim().length > 0);
    const headers = (lines[0] ?? "").split(",").map((value) => value.trim()).filter(Boolean);
    return {
      rowCount: Math.max(lines.length - 1, 0),
      fieldCount: Math.max(lines.length - 1, 0) * headers.length,
      columnCount: headers.length,
    };
  }
  if (/\.json$/i.test(relativePath)) {
    const parsed = JSON.parse(fs.readFileSync(filePath, "utf8"));
    const rows = Array.isArray(parsed) ? parsed : [parsed];
    const keys = new Set(rows.flatMap((row) => (row && typeof row === "object" ? Object.keys(row) : ["value"])));
    return { rowCount: rows.length, fieldCount: rows.length * keys.size, columnCount: keys.size };
  }
  if (/\.(md|html)$/i.test(relativePath)) {
    return { rowCount: 1, fieldCount: 1, columnCount: 1 };
  }
  return { rowCount: 0, fieldCount: 0, columnCount: 0 };
}

function completenessFor(relativePath, syncMode, shape) {
  if (isEvaluatorFile(relativePath)) return "restricted";
  if (!relativePath.startsWith("03-source-corpus-design/synthetic-source-samples/")) return "reference_only";
  if (shape.rowCount <= 0) return "empty";
  if (syncMode === "FULL_SNAPSHOT") return "complete";
  if (syncMode === "REFERENCE_ONLY") return "reference_only";
  return "partial";
}

function deltaClassificationFor(file, syncMode, completeness) {
  if (file.evaluatorVisible) return "RESTRICTED";
  if (completeness === "empty") return "EMPTY";
  if (completeness === "reference_only") return "NEW_FILE";
  if (syncMode === "PARTIAL_SNAPSHOT") return "PARTIAL";
  return "NEW_FILE";
}

function isEvaluatorFile(relativePath) {
  return relativePath.startsWith("04-restricted-evaluator-design/");
}

function isValidationOrReviewFile(relativePath) {
  return relativePath.startsWith("05-validation/") || relativePath.startsWith("06-review-package/");
}

function isOperationalFile(relativePath) {
  return !isEvaluatorFile(relativePath) && !isValidationOrReviewFile(relativePath);
}

function resolveFiles(packageRoot, packageManifest, scope) {
  const entries =
    scope === "operational"
      ? packageManifest.files.filter((entry) => isOperationalFile(String(entry.path)))
      : packageManifest.files.filter((entry) => isEvaluatorFile(String(entry.path)));

  const files = entries.map((entry) => {
    const relativePath = String(entry.path);
    const absolutePath = path.join(packageRoot, relativePath);
    if (!fs.existsSync(absolutePath)) {
      throw new LandingError("manifest_file_missing", `Manifest file is missing: ${relativePath}`);
    }
    const actualSha = sha256File(absolutePath);
    const actualBytes = fs.statSync(absolutePath).size;
    if (actualSha !== entry.sha256 || actualBytes !== entry.bytes) {
      throw new LandingError("manifest_hash_mismatch", `Manifest mismatch for ${relativePath}`, {
        expectedSha: entry.sha256,
        actualSha,
        expectedBytes: entry.bytes,
        actualBytes,
      });
    }
    return {
      relativePath,
      absolutePath,
      bytes: actualBytes,
      sha256: actualSha,
      sourceRef: sourceRefFor(relativePath),
      sourceVersionRef: `${sourceRefFor(relativePath)}-v1`,
      sourceFamily: familyFor(relativePath),
      parserContractRef: parserContractFor(relativePath),
      contentType: contentTypeFor(relativePath),
      parserVisible: relativePath.startsWith("03-source-corpus-design/synthetic-source-samples/"),
      evaluatorVisible: isEvaluatorFile(relativePath),
    };
  });

  for (const file of files) {
    const syncMode = syncModeFor(file.relativePath);
    const shape = sourceShapeFor(file.absolutePath, file.relativePath);
    const completeness = completenessFor(file.relativePath, syncMode, shape);
    file.sourceVersion = "v1";
    file.schemaHash = schemaHashFor(file.absolutePath, file.relativePath);
    file.syncMode = syncMode;
    file.businessKey = businessKeyFor(file.relativePath);
    file.periodCovered = "synthetic_airline_v1";
    file.availabilityState = completeness === "empty" ? "empty" : file.evaluatorVisible ? "restricted" : "available";
    file.rowCount = shape.rowCount;
    file.fieldCount = shape.fieldCount;
    file.columnCount = shape.columnCount;
    file.completeness = completeness;
    file.predecessorVersion = null;
    file.supersededVersion = null;
    file.deltaClassification = deltaClassificationFor(file, syncMode, completeness);
  }

  if (scope === "operational" && files.some((file) => file.evaluatorVisible)) {
    throw new LandingError("evaluator_file_in_operational_set", "Evaluator-only file selected for operational landing.");
  }
  if (scope === "evaluator" && files.some((file) => !file.evaluatorVisible)) {
    throw new LandingError("operational_file_in_evaluator_set", "Operational file selected for evaluator landing.");
  }

  return files;
}

function assertFreezeState(freezeManifest, scope) {
  if (freezeManifest.tenant_key !== TENANT_KEY || freezeManifest.release_id !== RELEASE_ID) {
    throw new LandingError("freeze_manifest_identity_mismatch", "Freeze manifest does not match tenant/release.");
  }
  if (freezeManifest.release_state !== "source_release_frozen_for_controlled_landing") {
    throw new LandingError("freeze_manifest_not_authorized", "Freeze manifest is not in controlled landing state.");
  }
  const allowed = new Set(freezeManifest.allowed_next_actions ?? []);
  const requiredAction = scope === "operational" ? "land_operational_sources" : "land_evaluator_truth_separately";
  if (!allowed.has(requiredAction)) {
    throw new LandingError("landing_action_not_authorized", `Freeze manifest does not authorize ${requiredAction}.`);
  }
}

async function buildBlobClient(scope) {
  const { BlobServiceClient } = await import("@azure/storage-blob");
  const { DefaultAzureCredential } = await import("@azure/identity");
  const connectionString =
    scope === "evaluator"
      ? process.env.ABARVA_EVALUATOR_STORAGE_CONNECTION_STRING
      : process.env.AZURE_STORAGE_CONNECTION_STRING;
  if (connectionString) {
    return { accountName: "connection-string", client: BlobServiceClient.fromConnectionString(connectionString) };
  }
  const accountName =
    scope === "evaluator"
      ? process.env.ABARVA_EVALUATOR_STORAGE_ACCOUNT ?? process.env.AZURE_EVALUATOR_STORAGE_ACCOUNT
      : process.env.ABARVA_OPERATIONAL_STORAGE_ACCOUNT ?? process.env.AZURE_STORAGE_ACCOUNT;
  if (!accountName) {
    throw new LandingError(
      "storage_account_missing",
      "Set AZURE_STORAGE_ACCOUNT/ABARVA_OPERATIONAL_STORAGE_ACCOUNT or ABARVA_EVALUATOR_STORAGE_ACCOUNT for execute mode.",
    );
  }
  return {
    accountName,
    client: new BlobServiceClient(`https://${accountName}.blob.core.windows.net`, new DefaultAzureCredential()),
  };
}

async function buildPgClient() {
  const { Client } = await import("pg");
  const client = new Client(await dbConnectionConfig(process.env));
  await client.connect();
  await setTenantContext(client, TENANT_KEY);
  return client;
}

async function uploadFiles({ files, releaseId, scope }) {
  const { accountName, client } = await buildBlobClient(scope);
  const containerName = scope === "evaluator" ? EVALUATOR_CONTAINER : OPERATIONAL_CONTAINER;
  const container = client.getContainerClient(containerName);
  await container.createIfNotExists();

  const uploaded = [];
  for (const file of files) {
    const blobName = `${TENANT_KEY}/${releaseId}/${file.relativePath}`;
    const blockBlob = container.getBlockBlobClient(blobName);
    await blockBlob.uploadFile(file.absolutePath, {
      blobHTTPHeaders: { blobContentType: file.contentType },
      metadata: {
        tenant: TENANT_KEY,
        release: releaseId.replace(/[^a-zA-Z0-9]/g, "-").slice(0, 64),
        sha256: file.sha256,
        scope,
      },
    });
    uploaded.push({
      ...file,
      storageAccount: accountName,
      containerName,
      blobName,
      landedUri: `azblob://${accountName}/${containerName}/${blobName}`,
    });
  }

  return uploaded;
}

async function uploadRunManifest({ result, scope }) {
  const { accountName, client } = await buildBlobClient(scope);
  const containerName = scope === "evaluator" ? EVALUATOR_CONTAINER : OPERATIONAL_MANIFEST_CONTAINER;
  const container = client.getContainerClient(containerName);
  await container.createIfNotExists();
  const blobName = `${TENANT_KEY}/${result.releaseId}/${result.runId}.json`;
  const body = JSON.stringify(result, null, 2);
  await container.getBlockBlobClient(blobName).upload(body, Buffer.byteLength(body), {
    blobHTTPHeaders: { blobContentType: "application/json" },
    metadata: {
      tenant: TENANT_KEY,
      release: result.releaseId.replace(/[^a-zA-Z0-9]/g, "-").slice(0, 64),
      scope,
    },
  });
  return `azblob://${accountName}/${containerName}/${blobName}`;
}

async function recordOperationalLanding({ files, result, packageHash }) {
  const client = await buildPgClient();
  try {
    await client.query("BEGIN");
    await client.query(
      `
        INSERT INTO operations.run (
          tenant_key, run_ref, release_id, idempotency_key, run_type, run_state,
          actor_ref, input_manifest_hash, image_digest, started_at, metadata
        )
        VALUES ($1, $2, $3, $4, 'source_corpus_landing', 'running', $5, $6, $7, now(), $8::jsonb)
        ON CONFLICT (tenant_key, idempotency_key)
        DO UPDATE SET run_state = 'running', started_at = now(), metadata = EXCLUDED.metadata
      `,
      [
        TENANT_KEY,
        result.runId,
        result.releaseId,
        result.idempotencyKey,
        "codex-airline-source-landing",
        packageHash,
        process.env.ABARVA_IMAGE_DIGEST ?? null,
        JSON.stringify({ scope: result.scope, sourceCommitSha: result.sourceCommitSha }),
      ],
    );

    for (const file of files) {
      await client.query(
        `
          INSERT INTO source_registry.source (
            tenant_key, source_ref, source_family, source_name, source_uri, source_hash,
            source_owner_ref, parser_contract_ref, source_visibility, source_basis,
            registered_run_ref, metadata
          )
          VALUES ($1, $2, $3, $4, $5, $6, 'airline-demo-new-source-factory', $7, $8, 'synthetic_demo', $9, $10::jsonb)
          ON CONFLICT (tenant_key, source_ref)
          DO UPDATE SET
            source_family = EXCLUDED.source_family,
            source_name = EXCLUDED.source_name,
            source_uri = EXCLUDED.source_uri,
            source_hash = EXCLUDED.source_hash,
            parser_contract_ref = EXCLUDED.parser_contract_ref,
            source_visibility = EXCLUDED.source_visibility,
            source_basis = EXCLUDED.source_basis,
            registered_run_ref = EXCLUDED.registered_run_ref,
            metadata = EXCLUDED.metadata
        `,
        [
          TENANT_KEY,
          file.sourceRef,
          file.sourceFamily,
          path.basename(file.relativePath),
          file.landedUri,
          file.sha256,
          file.parserContractRef,
          file.parserVisible ? "client_visible" : "internal_ops",
          result.runId,
        JSON.stringify({
            relativePath: file.relativePath,
            bytes: file.bytes,
            contentType: file.contentType,
            parserVisible: file.parserVisible,
            releaseId: result.releaseId,
            schemaHash: file.schemaHash,
            syncMode: file.syncMode,
            businessKey: file.businessKey,
            periodCovered: file.periodCovered,
            availabilityState: file.availabilityState,
            rowCount: file.rowCount,
            fieldCount: file.fieldCount,
            completeness: file.completeness,
            deltaClassification: file.deltaClassification,
          }),
        ],
      );

      await client.query(
        `
          INSERT INTO source_registry.source_version (
            tenant_key, source_version_ref, source_ref, version_number, content_hash,
            landed_uri, manifest_ref, immutable, created_run_ref
          )
          VALUES ($1, $2, $3, 1, $4, $5, $6, true, $7)
          ON CONFLICT (tenant_key, source_ref, version_number)
          DO UPDATE SET
            content_hash = EXCLUDED.content_hash,
            landed_uri = EXCLUDED.landed_uri,
            manifest_ref = EXCLUDED.manifest_ref,
            immutable = true,
            created_run_ref = EXCLUDED.created_run_ref
        `,
        [TENANT_KEY, file.sourceVersionRef, file.sourceRef, file.sha256, file.landedUri, result.manifestRef, result.runId],
      );
    }

    await client.query(
      `
        INSERT INTO operations.checkpoint (
          tenant_key, run_ref, checkpoint_ref, checkpoint_name, checkpoint_state,
          expected_count, actual_count, content_hash, detail
        )
        VALUES ($1, $2, 'operational_source_landing', 'Operational source landing', 'passed', $3, $4, $5, $6::jsonb)
        ON CONFLICT (tenant_key, run_ref, checkpoint_ref)
        DO UPDATE SET checkpoint_state = EXCLUDED.checkpoint_state, expected_count = EXCLUDED.expected_count,
          actual_count = EXCLUDED.actual_count, content_hash = EXCLUDED.content_hash, detail = EXCLUDED.detail
      `,
      [
        TENANT_KEY,
        result.runId,
        result.expectedCount,
        files.length,
        result.contentHash,
        JSON.stringify({
          manifestRef: result.manifestRef,
          parserVisibleCount: result.parserVisibleCount,
          j0SyncManifest: result.j0SyncManifest,
        }),
      ],
    );

    await client.query(
      `
        UPDATE operations.run
        SET run_state = 'passed', completed_at = now(), metadata = $3::jsonb
        WHERE tenant_key = $1 AND run_ref = $2
      `,
      [TENANT_KEY, result.runId, JSON.stringify(result)],
    );
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    try {
      await client.query(
        `
          UPDATE operations.run
          SET run_state = 'failed', completed_at = now(), failure_code = $3, failure_detail = $4
          WHERE tenant_key = $1 AND run_ref = $2
        `,
        [TENANT_KEY, result.runId, error.code ?? "source_landing_failed", String(error.message ?? error)],
      );
    } catch {
      // Preserve the original failure.
    }
    throw error;
  } finally {
    await client.end();
  }
}

async function recordEvaluatorLanding({ result, packageHash }) {
  const client = await buildPgClient();
  try {
    await client.query(
      `
        INSERT INTO operations.run (
          tenant_key, run_ref, release_id, idempotency_key, run_type, run_state,
          actor_ref, input_manifest_hash, image_digest, started_at, completed_at, metadata
        )
        VALUES ($1, $2, $3, $4, 'restricted_evaluator_truth_landing', 'passed', $5, $6, $7, now(), now(), $8::jsonb)
        ON CONFLICT (tenant_key, idempotency_key)
        DO UPDATE SET run_state = 'passed', completed_at = now(), metadata = EXCLUDED.metadata
      `,
      [
        TENANT_KEY,
        result.runId,
        result.releaseId,
        result.idempotencyKey,
        "codex-airline-evaluator-truth-landing",
        packageHash,
        process.env.ABARVA_IMAGE_DIGEST ?? null,
        JSON.stringify(result),
      ],
    );

    await client.query(
      `
        INSERT INTO operations.checkpoint (
          tenant_key, run_ref, checkpoint_ref, checkpoint_name, checkpoint_state,
          expected_count, actual_count, content_hash, detail
        )
        VALUES ($1, $2, 'restricted_evaluator_landing', 'Restricted evaluator truth landing', 'passed', $3, $4, $5, $6::jsonb)
        ON CONFLICT (tenant_key, run_ref, checkpoint_ref)
        DO UPDATE SET checkpoint_state = EXCLUDED.checkpoint_state, expected_count = EXCLUDED.expected_count,
          actual_count = EXCLUDED.actual_count, content_hash = EXCLUDED.content_hash, detail = EXCLUDED.detail
      `,
      [TENANT_KEY, result.runId, result.expectedCount, result.actualCount, result.contentHash, JSON.stringify({ manifestRef: result.manifestRef })],
    );
  } finally {
    await client.end();
  }
}

function buildResult({ args, freezeManifest, packageManifest, files, landedFiles = [], manifestRef = null }) {
  const contentHash = sha256Json(files.map((file) => ({ path: file.relativePath, sha256: file.sha256 })));
  const runId =
    args.runId ||
    `${TENANT_KEY}-${args.scope}-source-landing-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${contentHash.slice(0, 8)}`;
  const visibleFiles = landedFiles.length ? landedFiles : files;
  const parserVisibleFiles = visibleFiles.filter((file) => file.parserVisible);
  const j0SyncManifest = {
    manifestVersion: "airline-source-sync-manifest/v1",
    previousReleaseRef: null,
    deltaPlanState: "INITIAL_FULL_AIRLINE_V2_LOAD",
    sourceFamilyCount: new Set(visibleFiles.map((file) => file.sourceFamily)).size,
    sourceVersionCount: visibleFiles.length,
    parserVisibleSourceVersionCount: parserVisibleFiles.length,
    sourceRowCount: parserVisibleFiles.reduce((sum, file) => sum + Number(file.rowCount || 0), 0),
    sourceFieldCount: parserVisibleFiles.reduce((sum, file) => sum + Number(file.fieldCount || 0), 0),
    classifications: visibleFiles.reduce((acc, file) => {
      acc[file.deltaClassification] = (acc[file.deltaClassification] || 0) + 1;
      return acc;
    }, {}),
    syncModes: visibleFiles.reduce((acc, file) => {
      acc[file.syncMode] = (acc[file.syncMode] || 0) + 1;
      return acc;
    }, {}),
  };

  return {
    status: args.mode === "execute" ? "executed" : "planned",
    mode: args.mode,
    tenantKey: TENANT_KEY,
    releaseId: RELEASE_ID,
    scope: args.scope,
    runId,
    idempotencyKey: `${RELEASE_ID}:${args.scope}:${contentHash}`,
    sourceCommitSha: freezeManifest.source_commit_sha,
    sourcePr: freezeManifest.source_pr,
    packageManifestStatus: packageManifest.status,
    expectedCount: files.length,
    actualCount: landedFiles.length || files.length,
    parserVisibleCount: files.filter((file) => file.parserVisible).length,
    evaluatorVisibleCount: files.filter((file) => file.evaluatorVisible).length,
    contentHash,
    manifestRef,
    j0SyncManifest,
    files: visibleFiles.map((file) => ({
      path: file.relativePath,
      sourceRef: file.sourceRef,
      sourceVersionRef: file.sourceVersionRef,
      sourceFamily: file.sourceFamily,
      sourceVersion: file.sourceVersion,
      parserContractRef: file.parserContractRef,
      schemaHash: file.schemaHash,
      syncMode: file.syncMode,
      businessKey: file.businessKey,
      periodCovered: file.periodCovered,
      availabilityState: file.availabilityState,
      rowCount: file.rowCount,
      fieldCount: file.fieldCount,
      columnCount: file.columnCount,
      completeness: file.completeness,
      predecessorVersion: file.predecessorVersion,
      supersededVersion: file.supersededVersion,
      deltaClassification: file.deltaClassification,
      parserVisible: file.parserVisible,
      evaluatorVisible: file.evaluatorVisible,
      bytes: file.bytes,
      sha256: file.sha256,
      landedUri: file.landedUri ?? null,
    })),
    boundaries: {
      operationalContainer: OPERATIONAL_CONTAINER,
      operationalManifestContainer: OPERATIONAL_MANIFEST_CONTAINER,
      evaluatorContainer: EVALUATOR_CONTAINER,
      evaluatorTruthInSourceRegistry: false,
      productRuntimeClaimAllowed: false,
    },
  };
}

async function main() {
  const args = parseArgs();
  assertArgs(args);

  const packageManifest = readJson(path.join(args.packageRoot, "PACKAGE_MANIFEST.json"));
  const freezeManifest = readJson(FREEZE_MANIFEST);
  assertFreezeState(freezeManifest, args.scope);

  const packageHash = sha256File(path.join(args.packageRoot, "PACKAGE_MANIFEST.json"));
  const files = resolveFiles(args.packageRoot, packageManifest, args.scope);
  let result = buildResult({ args, freezeManifest, packageManifest, files });

  if (args.mode === "execute") {
    const landedFiles = await uploadFiles({ files, releaseId: RELEASE_ID, scope: args.scope });
    result = buildResult({ args, freezeManifest, packageManifest, files, landedFiles });
    const manifestRef = await uploadRunManifest({ result, scope: args.scope });
    result.manifestRef = manifestRef;
    if (args.scope === "operational") {
      await recordOperationalLanding({ files: landedFiles, result, packageHash });
    } else {
      await recordEvaluatorLanding({ result, packageHash });
    }
  }

  const output = `${JSON.stringify(result, null, 2)}\n`;
  if (args.out) {
    fs.mkdirSync(path.dirname(args.out), { recursive: true });
    fs.writeFileSync(args.out, output);
  }
  process.stdout.write(output);
}

main().catch((error) => {
  const payload = {
    status: "failed",
    code: error.code ?? "unexpected_error",
    message: error.message,
    details: error.details ?? {},
  };
  process.stderr.write(`${JSON.stringify(payload, null, 2)}\n`);
  process.exitCode = 1;
});
