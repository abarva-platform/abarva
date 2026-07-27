#!/usr/bin/env node
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const REPO_ROOT = path.resolve(path.dirname(__filename), "..", "..");

export const CONTRACT_SCHEMA_VERSION = "hcdn-job-runner-envelope/v1";

export const PROCESS_CONTRACTS = Object.freeze([
  {
    suffix: "source-register-v1",
    stages: ["01_register_source", "02_store_immutable_source_version"],
    identityPurpose: "ingest",
    databaseRolePurpose: "ingest",
  },
  {
    suffix: "source-parse-v1",
    stages: ["03_parse_source"],
    identityPurpose: "ingest",
    databaseRolePurpose: "ingest",
  },
  {
    suffix: "evidence-extract-v1",
    stages: ["04_extract_evidence"],
    identityPurpose: "ingest",
    databaseRolePurpose: "ingest",
  },
  {
    suffix: "knowledge-normalize-v1",
    stages: ["05_normalize_values"],
    identityPurpose: "ingest",
    databaseRolePurpose: "ingest",
  },
  {
    suffix: "entity-resolve-v1",
    stages: ["06_resolve_identity"],
    identityPurpose: "ingest",
    databaseRolePurpose: "ingest",
  },
  {
    suffix: "knowledge-validate-v1",
    stages: ["07_validate_semantics", "08_detect_conflicts_changes"],
    identityPurpose: "ingest",
    databaseRolePurpose: "ingest",
  },
  {
    suffix: "knowledge-review-v1",
    stages: ["09_route_review_quarantine", "10_accept_reject"],
    identityPurpose: "review",
    databaseRolePurpose: "review",
  },
  {
    suffix: "domain-publish-v1",
    stages: ["11_publish_domain"],
    identityPurpose: "publish",
    databaseRolePurpose: "publish",
  },
  {
    suffix: "baseline-publish-v1",
    stages: ["12_publish_baseline"],
    identityPurpose: "publish",
    databaseRolePurpose: "publish",
  },
  {
    suffix: "projection-build-v1",
    stages: ["13_build_module_projections"],
    identityPurpose: "publish",
    databaseRolePurpose: "publish",
  },
  {
    suffix: "home-readmodel-v1",
    stages: ["14_refresh_home_readmodel"],
    identityPurpose: "publish",
    databaseRolePurpose: "publish",
  },
  {
    suffix: "knowledge-backfill-v1",
    stages: ["15_backfill_replay"],
    identityPurpose: "ingest",
    databaseRolePurpose: "ingest",
  },
  {
    suffix: "reconciliation-audit-v1",
    stages: ["16_reconciliation_audit"],
    identityPurpose: "evaluator",
    databaseRolePurpose: "evaluator",
  },
]);

const REJECTED_TENANT_SCOPES = new Set(["all", "*", "any", "tenant-all", "all-tenants"]);
const VALID_TENANT_KEY = /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/;
const VALID_MODES = new Set(["preflight", "noop", "execute"]);
const EXECUTE_ACK = "EXECUTE_SHARED_TENANT_JOB";

class GuardFailure extends Error {
  constructor(code, message, details = {}) {
    super(message);
    this.name = "GuardFailure";
    this.code = code;
    this.details = details;
  }
}

export function parseArgs(argv = process.argv.slice(2), env = process.env) {
  const args = {
    tenant: env.ABARVA_TENANT_KEY ?? "",
    process: env.ABARVA_HCDN_PROCESS ?? "",
    stage: env.ABARVA_HCDN_STAGE ?? "",
    mode: env.ABARVA_HCDN_MODE ?? "preflight",
    manifest: env.ABARVA_TENANT_MANIFEST ?? "",
    out: "",
    runId: "",
    sourceRunRef: "",
    noNetwork: false,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    const next = () => {
      const value = argv[i + 1];
      if (!value || value.startsWith("--")) {
        throw new GuardFailure("missing_cli_value", `Missing value for ${token}`);
      }
      i += 1;
      return value;
    };

    switch (token) {
      case "--tenant":
        args.tenant = next();
        break;
      case "--process":
        args.process = next();
        break;
      case "--stage":
        args.stage = next();
        break;
      case "--mode":
        args.mode = next();
        break;
      case "--manifest":
        args.manifest = next();
        break;
      case "--out":
        args.out = next();
        break;
      case "--run-id":
        args.runId = next();
        break;
      case "--source-run-ref":
        args.sourceRunRef = next();
        break;
      case "--no-network":
        args.noNetwork = true;
        break;
      default:
        throw new GuardFailure("unknown_cli_argument", `Unknown argument: ${token}`);
    }
  }

  return args;
}

export function validateTenantKey(tenantKey) {
  const tenant = String(tenantKey ?? "").trim();
  if (!tenant) {
    throw new GuardFailure("tenant_blank", "A single tenant key is required.");
  }
  if (REJECTED_TENANT_SCOPES.has(tenant.toLowerCase())) {
    throw new GuardFailure("tenant_wildcard_scope", `Wildcard tenant scope is not allowed: ${tenant}`);
  }
  if (tenant.includes(",") || /\s/.test(tenant)) {
    throw new GuardFailure("tenant_list_scope", `Tenant lists are not allowed: ${tenant}`);
  }
  if (!VALID_TENANT_KEY.test(tenant)) {
    throw new GuardFailure("tenant_key_invalid", `Tenant key is not a canonical slug: ${tenant}`);
  }
  return tenant;
}

export function processNameForTenant(tenantKey, contract) {
  return `${tenantKey}-${contract.suffix}`;
}

export function resolveProcessContract(tenantKey, processName) {
  const expected = PROCESS_CONTRACTS.map((contract) => ({
    ...contract,
    processName: processNameForTenant(tenantKey, contract),
  }));
  const found = expected.find((contract) => contract.processName === processName);
  if (!found) {
    throw new GuardFailure("unknown_process", `Process is not approved for ${tenantKey}: ${processName}`, {
      approvedProcesses: expected.map((contract) => contract.processName),
    });
  }
  return found;
}

export function resolveDefaultBoundarySnapshot(tenantKey) {
  const packagedBoundaryDir = process.env.ABARVA_TENANT_BOUNDARY_DIR
    ? path.resolve(process.env.ABARVA_TENANT_BOUNDARY_DIR)
    : path.join(REPO_ROOT, "runtime-tenant-boundaries");
  const packagedSnapshot = path.join(packagedBoundaryDir, tenantKey, "APPROVED_BOUNDARY_SNAPSHOT.json");
  if (fs.existsSync(packagedSnapshot)) {
    return packagedSnapshot;
  }
  return path.join(
    REPO_ROOT,
    "clients",
    tenantKey,
    "18-phase2b3c-azure-lab-implementation",
    "00-implementation-charter",
    "APPROVED_BOUNDARY_SNAPSHOT.json",
  );
}

export function loadBoundarySnapshot(manifestPath) {
  const resolved = path.isAbsolute(manifestPath) ? manifestPath : path.join(REPO_ROOT, manifestPath);
  if (!fs.existsSync(resolved)) {
    throw new GuardFailure("manifest_missing", `Boundary snapshot not found: ${resolved}`, { manifestPath: resolved });
  }
  const manifest = JSON.parse(fs.readFileSync(resolved, "utf8"));
  return { manifest, manifestPath: resolved };
}

function observedValues(env, names) {
  return names.map((name) => env[name]).filter((value) => value !== undefined && value !== "");
}

function assertEveryObservedEquals({ name, expected, observed, guards }) {
  if (observed.length === 0) {
    guards.push({ name, status: "warning", expected, observed: null, message: "No environment value supplied; checked from manifest only." });
    return;
  }
  const mismatches = observed.filter((value) => value !== expected);
  if (mismatches.length > 0) {
    guards.push({ name, status: "failed", expected, observed });
    throw new GuardFailure(`${name}_mismatch`, `${name} does not match the approved boundary.`, { expected, observed });
  }
  guards.push({ name, status: "passed", expected, observed });
}

function identityForPurpose(manifest, purpose) {
  return (manifest.managed_identities ?? []).find((identity) => identity.purpose === purpose) ?? null;
}

function imageDigestFromImage(image) {
  const match = String(image ?? "").match(/@([^@]+)$/);
  return match ? match[1] : "";
}

function sha256Json(value) {
  return crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

function buildCheckpoints(contract, resultStatus) {
  return contract.stages.map((stageName) => {
    const payload = {
      processName: contract.processName,
      canonicalProcess: contract.suffix,
      stageName,
      resultStatus,
    };
    return {
      checkpointId: `${contract.processName}:${stageName}`,
      stageName,
      checkpointHash: sha256Json(payload),
      status: resultStatus,
      payload,
    };
  });
}

export function validateRunnerInputs({ args, env = process.env, manifest, manifestPath }) {
  const guards = [];
  const tenantKey = validateTenantKey(args.tenant);
  guards.push({ name: "tenant_scope", status: "passed", expected: "single canonical tenant", observed: tenantKey });

  if (env.ABARVA_TENANT_KEY && env.ABARVA_TENANT_KEY !== tenantKey) {
    guards.push({ name: "tenant_env", status: "failed", expected: tenantKey, observed: env.ABARVA_TENANT_KEY });
    throw new GuardFailure("tenant_env_mismatch", "ABARVA_TENANT_KEY does not match --tenant.", {
      expected: tenantKey,
      observed: env.ABARVA_TENANT_KEY,
    });
  }
  guards.push({ name: "tenant_env", status: "passed", expected: tenantKey, observed: env.ABARVA_TENANT_KEY ?? null });

  if (manifest.tenant_key !== tenantKey) {
    guards.push({ name: "manifest_tenant", status: "failed", expected: tenantKey, observed: manifest.tenant_key });
    throw new GuardFailure("manifest_tenant_mismatch", "Boundary snapshot tenant does not match requested tenant.", {
      expected: tenantKey,
      observed: manifest.tenant_key,
      manifestPath,
    });
  }
  guards.push({ name: "manifest_tenant", status: "passed", expected: tenantKey, observed: manifest.tenant_key });

  const mode = String(args.mode ?? "preflight").trim();
  if (!VALID_MODES.has(mode)) {
    guards.push({ name: "mode", status: "failed", expected: Array.from(VALID_MODES), observed: mode });
    throw new GuardFailure("mode_invalid", `Mode must be one of ${Array.from(VALID_MODES).join(", ")}.`);
  }
  guards.push({ name: "mode", status: "passed", expected: Array.from(VALID_MODES), observed: mode });

  const processName = String(args.process ?? "").trim();
  if (!processName) {
    guards.push({ name: "process", status: "failed", expected: "approved process name", observed: processName });
    throw new GuardFailure("process_missing", "An approved process name is required.");
  }
  const contract = resolveProcessContract(tenantKey, processName);
  const identity = identityForPurpose(manifest, contract.identityPurpose);
  const databaseRole = identity?.database_role ?? null;
  guards.push({ name: "process", status: "passed", expected: processName, observed: processName });

  if (args.stage && !contract.stages.includes(args.stage)) {
    guards.push({ name: "stage", status: "failed", expected: contract.stages, observed: args.stage });
    throw new GuardFailure("stage_mismatch", "Requested stage is not part of the approved process contract.", {
      expected: contract.stages,
      observed: args.stage,
    });
  }
  guards.push({ name: "stage", status: "passed", expected: contract.stages, observed: args.stage || contract.stages });

  assertEveryObservedEquals({
    name: "environment",
    expected: manifest.environment,
    observed: observedValues(env, ["ABARVA_HCDN_ENVIRONMENT", "ABARVA_ENVIRONMENT", "APP_ENV"]),
    guards,
  });
  assertEveryObservedEquals({
    name: "subscription",
    expected: manifest.subscription?.subscription_id,
    observed: observedValues(env, ["ABARVA_HCDN_SUBSCRIPTION_ID", "AZURE_SUBSCRIPTION_ID"]),
    guards,
  });
  assertEveryObservedEquals({
    name: "database",
    expected: manifest.control_plane?.postgres_database,
    observed: observedValues(env, ["ABARVA_HCDN_DATABASE", "ABARVA_DATABASE_NAME", "PGDATABASE"]),
    guards,
  });
  assertEveryObservedEquals({
    name: "storage_account",
    expected: manifest.control_plane?.storage_account,
    observed: observedValues(env, ["ABARVA_HCDN_STORAGE_ACCOUNT", "AZURE_STORAGE_ACCOUNT"]),
    guards,
  });

  const expectedImage = manifest.container_image?.image;
  const expectedDigest = manifest.container_image?.image_digest ?? imageDigestFromImage(expectedImage);
  const imageValues = observedValues(env, ["ABARVA_HCDN_IMAGE", "ABARVA_CONTAINER_IMAGE"]);
  if (imageValues.length > 0) {
    const mismatches = imageValues.filter((value) => value !== expectedImage);
    const mutableTags = imageValues.filter((value) => !value.includes("@sha256:"));
    if (mutableTags.length > 0 || mismatches.length > 0) {
      guards.push({ name: "image_digest_pin", status: "failed", expected: expectedImage, observed: imageValues });
      throw new GuardFailure("image_not_digest_pinned", "Container image must match the approved digest-pinned image.", {
        expected: expectedImage,
        observed: imageValues,
      });
    }
    guards.push({ name: "image_digest_pin", status: "passed", expected: expectedImage, observed: imageValues });
  } else {
    guards.push({ name: "image_digest_pin", status: "warning", expected: expectedImage, observed: null, message: "No runtime image env supplied; manifest image remains the lock." });
  }

  assertEveryObservedEquals({
    name: "image_digest",
    expected: expectedDigest,
    observed: observedValues(env, ["ABARVA_HCDN_IMAGE_DIGEST", "ABARVA_CONTAINER_IMAGE_DIGEST"]),
    guards,
  });

  if (mode === "execute" && env.ABARVA_HCDN_EXECUTE_ACK !== EXECUTE_ACK) {
    guards.push({ name: "execute_ack", status: "failed", expected: EXECUTE_ACK, observed: env.ABARVA_HCDN_EXECUTE_ACK ?? null });
    throw new GuardFailure("execute_ack_missing", "Execute mode requires explicit ABARVA_HCDN_EXECUTE_ACK.");
  }
  if (mode === "execute") {
    guards.push({ name: "execute_ack", status: "passed", expected: EXECUTE_ACK, observed: env.ABARVA_HCDN_EXECUTE_ACK });
  }

  return {
    tenantKey,
    mode,
    processName,
    contract: { ...contract, databaseRole },
    guards,
  };
}

export function buildAuditEnvelope({ args, env = process.env, manifest, manifestPath, validation, resultStatus, networkAccessAttempted, error = null }) {
  const runId =
    args.runId ||
    `${validation?.tenantKey ?? args.tenant}-${validation?.processName ?? args.process}-${new Date().toISOString().replace(/[:.]/g, "-")}`;
  const expectedImage = manifest.container_image?.image ?? null;
  const expectedDigest = manifest.container_image?.image_digest ?? imageDigestFromImage(expectedImage);
  const contract = validation?.contract;
  const status = error ? "failed_guard" : resultStatus;

  return {
    schemaVersion: CONTRACT_SCHEMA_VERSION,
    generatedAt: new Date().toISOString(),
    runId,
    tenantKey: validation?.tenantKey ?? args.tenant ?? null,
    environment: manifest.environment ?? null,
    processName: validation?.processName ?? args.process ?? null,
    stageNames: contract?.stages ?? [],
    mode: validation?.mode ?? args.mode ?? "preflight",
    sourceRunRef: args.sourceRunRef || env.ABARVA_SOURCE_RUN_REF || null,
    manifest: {
      path: manifestPath,
      tenantKey: manifest.tenant_key ?? null,
      databaseName: manifest.control_plane?.postgres_database ?? null,
      storageAccount: manifest.control_plane?.storage_account ?? null,
      subscriptionId: manifest.subscription?.subscription_id ?? null,
      image: expectedImage,
      imageDigest: expectedDigest,
    },
    guardResults: validation?.guards ?? [],
    processContract: contract
      ? {
          processName: validation.processName,
          canonicalProcess: contract.suffix,
          stageNames: contract.stages,
          identityPurpose: contract.identityPurpose,
          databaseRole: contract.databaseRole,
        }
      : null,
    checkpoints: contract ? buildCheckpoints({ ...contract, processName: validation.processName }, status) : [],
    auditEvents: [
      {
        eventType: error ? "guard_failure" : "runner_result",
        status,
        message: error ? error.message : `Runner completed in ${validation?.mode ?? args.mode ?? "preflight"} mode.`,
      },
    ],
    networkAccessAttempted: Boolean(networkAccessAttempted),
    status,
    error: error
      ? {
          code: error.code ?? "unexpected_error",
          message: error.message,
          details: error.details ?? {},
        }
      : null,
  };
}

function writeEnvelope(envelope, outPath) {
  const serialized = `${JSON.stringify(envelope, null, 2)}\n`;
  if (outPath) {
    const resolved = path.isAbsolute(outPath) ? outPath : path.join(REPO_ROOT, outPath);
    fs.mkdirSync(path.dirname(resolved), { recursive: true });
    fs.writeFileSync(resolved, serialized);
  }
  process.stdout.write(serialized);
}

export async function runJobRunner({
  argv = process.argv.slice(2),
  env = process.env,
  networkProbe = async () => ({ status: "not_implemented" }),
  stdout = true,
  setExitCode = false,
} = {}) {
  let args = {};
  let manifest = {};
  let manifestPath = "";
  let validation = null;
  let networkAccessAttempted = false;

  try {
    args = parseArgs(argv, env);
    const tenantKey = validateTenantKey(args.tenant);
    const requestedManifest = args.manifest || resolveDefaultBoundarySnapshot(tenantKey);
    const loaded = loadBoundarySnapshot(requestedManifest);
    manifest = loaded.manifest;
    manifestPath = loaded.manifestPath;
    validation = validateRunnerInputs({ args: { ...args, tenant: tenantKey }, env, manifest, manifestPath });

    let resultStatus = "preflight_passed";
    if (validation.mode === "noop") {
      resultStatus = "noop_completed";
    } else if (validation.mode === "execute") {
      networkAccessAttempted = !args.noNetwork;
      if (!args.noNetwork) {
        await networkProbe({ args, env, manifest, manifestPath, validation });
      }
      resultStatus = "execute_dispatched";
    }

    const envelope = buildAuditEnvelope({ args: { ...args, tenant: tenantKey }, env, manifest, manifestPath, validation, resultStatus, networkAccessAttempted });
    if (stdout) writeEnvelope(envelope, args.out);
    return envelope;
  } catch (error) {
    const fallbackArgs = args.tenant || args.process || args.mode ? args : { tenant: "", process: "", mode: "preflight", sourceRunRef: "" };
    const envelope = buildAuditEnvelope({
      args: fallbackArgs,
      env,
      manifest,
      manifestPath,
      validation,
      resultStatus: "failed_guard",
      networkAccessAttempted,
      error,
    });
    if (stdout) writeEnvelope(envelope, fallbackArgs.out);
    if (error instanceof GuardFailure) {
      if (setExitCode) process.exitCode = 2;
      return envelope;
    }
    if (setExitCode) process.exitCode = 1;
    return envelope;
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  await runJobRunner({ setExitCode: true });
}
