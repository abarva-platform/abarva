#!/usr/bin/env tsx

import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { azureRead } from "../../src/lib/data-plane/azureRead";
import { createAzureProgramsReadAdapter } from "../../src/lib/data-plane/read-adapters/programsReadAdapter";
import { createAzureDiscoveryArchetypeWriteAdapter } from "../../src/lib/data-plane/write-adapters/discoveryArchetypeWriteAdapter";
import {
  resolveTenantAlias,
  tenantAliasesFor,
  CANONICAL_TENANT_KEYS,
} from "../../src/lib/tenant/aliases";
import {
  buildDiscoveryBlueprintInputFromProgram,
  resolveDeclaredProgramArchetypeId,
} from "../../src/lib/programs/discovery/evidence-readiness";
import { getDiscoveryBlueprint } from "../../src/lib/deliverables/orchestrator/briefs/discovery-blueprint";
import {
  blobProofStore,
  PROOF_CONTAINER,
  type JobLimits,
  type ProofStore,
} from "../ecl/synthetic_enterprise_home_job";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const JOB_NAME = "job-abarva-private-operator-eus";
const TARGET_ARCHETYPE = "governed_data_foundation";
const RELEASE_RECORD =
  "docs/releases/records/2026-10-05-moves-discovery-archetype-declaration-job.md";
const EXPECTED_REQUIRED_FAMILIES = [
  "data_governance_ownership",
  "semantic_layer_certification",
  "data_lineage_audit_trail",
  "data_quality_rules",
  "source_system_data_access",
  "platform_architecture_readiness",
  "master_identity_resolution",
  "privacy_security_controls",
  "model_risk_responsible_ai_controls",
  "measurement_owner_cadence",
  "finance_baseline_value_plan",
] as const;
const LIMITS: JobLimits = {
  statementTimeoutMs: 60_000,
  lockTimeoutMs: 15_000,
  proofStoreTimeoutMs: 30_000,
};

type JobConfig = {
  runId: string;
  tenantKey: string;
  programId: string;
  expectedNameSha256: string;
  expectedProgramArchetype: string;
  inputSourceVersion: string;
  idempotencyKey: string;
  releaseRecord: string;
  operatorIdentity: string;
  buildVersion: string;
  gitSha: string;
  image: string;
  imageDigest: string;
  retryCount: number;
  timeoutSeconds: number;
  storageAccount: string;
  storageIdentity: string;
};

function required(env: NodeJS.ProcessEnv, key: string): string {
  const value = env[key]?.trim();
  if (!value) throw new Error(`${key} is required`);
  return value;
}

function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function parseConfig(env: NodeJS.ProcessEnv): JobConfig {
  const runId = required(env, "MOVES_ARCHETYPE_RUN_ID");
  if (!/^[A-Za-z0-9][A-Za-z0-9_-]{0,79}$/.test(runId)) {
    throw new Error("Unsafe operator run id");
  }

  const tenantKey = required(env, "MOVES_ARCHETYPE_TENANT_KEY");
  if (!CANONICAL_TENANT_KEYS.includes(tenantKey)) {
    throw new Error("Tenant scope must use a canonical tenant key");
  }

  const programId = required(env, "MOVES_ARCHETYPE_PROGRAM_ID");
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(programId)) {
    throw new Error("Move id must be a UUID");
  }

  const expectedNameSha256 = required(env, "MOVES_ARCHETYPE_EXPECTED_NAME_SHA256");
  if (!/^[0-9a-f]{64}$/.test(expectedNameSha256)) {
    throw new Error("Expected-name fingerprint must be a SHA-256 hex digest");
  }

  const expectedProgramArchetype = required(
    env,
    "MOVES_ARCHETYPE_EXPECTED_PROGRAM_ARCHETYPE",
  );
  if (expectedProgramArchetype !== "ai_product_enablement") {
    throw new Error("Unexpected legacy program archetype precondition");
  }

  const inputSourceVersion = required(env, "MOVES_ARCHETYPE_INPUT_SOURCE_VERSION");
  const gitSha = env.ABARVA_OPERATOR_BRANCH_COMMIT?.trim() ?? "";
  if (!/^[0-9a-f]{40}$/.test(inputSourceVersion) || inputSourceVersion !== gitSha) {
    throw new Error("Input source version must match the operator image source commit");
  }

  const image = required(env, "ABARVA_OPERATOR_IMAGE");
  const imageDigest = required(env, "ABARVA_OPERATOR_IMAGE_DIGEST");
  if (
    !/@sha256:[0-9a-f]{64}$/i.test(image) ||
    imageDigest !== image.slice(image.lastIndexOf("@") + 1)
  ) {
    throw new Error("Operator image and digest must be pinned and consistent");
  }

  if (required(env, "MOVES_ARCHETYPE_TARGET_ID") !== TARGET_ARCHETYPE) {
    throw new Error("This job only declares the governed data-foundation archetype");
  }
  if (required(env, "MOVES_ARCHETYPE_APPLY_APPROVED") !== "true") {
    throw new Error("Explicit operator authorization is required");
  }
  if (required(env, "MOVES_ARCHETYPE_RELEASE_RECORD") !== RELEASE_RECORD) {
    throw new Error("Release record binding does not match this job");
  }
  const azureDatabaseUrl = required(env, "ABARVA_AZURE_DATABASE_URL");
  let databaseHost = "";
  try {
    databaseHost = new URL(azureDatabaseUrl).hostname.toLowerCase();
  } catch {
    throw new Error("Azure/Postgres connection URL is not parseable");
  }
  if (
    !databaseHost.endsWith(".postgres.database.azure.com") &&
    !/^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(databaseHost)
  ) {
    throw new Error("Refusing a non-Azure database target");
  }

  const idempotencyKey = required(env, "MOVES_ARCHETYPE_IDEMPOTENCY_KEY");
  const expectedIdempotencyKey = `moves-declare-archetype-v1:${sha256(
    `${tenantKey}|${programId}|${TARGET_ARCHETYPE}`,
  )}`;
  if (idempotencyKey !== expectedIdempotencyKey) {
    throw new Error("Idempotency key is not bound to this tenant, Move, and target");
  }

  const retryCount = Number(env.MOVES_ARCHETYPE_RETRY_COUNT ?? "0");
  const timeoutSeconds = Number(env.MOVES_ARCHETYPE_TIMEOUT_SECONDS ?? "1800");
  if (!Number.isInteger(retryCount) || retryCount < 0) {
    throw new Error("Retry count must be a non-negative integer");
  }
  if (!Number.isInteger(timeoutSeconds) || timeoutSeconds < 60 || timeoutSeconds > 7200) {
    throw new Error("Timeout must be between 60 and 7200 seconds");
  }

  return {
    runId,
    tenantKey,
    programId,
    expectedNameSha256,
    expectedProgramArchetype,
    inputSourceVersion,
    idempotencyKey,
    releaseRecord: RELEASE_RECORD,
    operatorIdentity: required(env, "MOVES_ARCHETYPE_OPERATOR_IDENTITY"),
    buildVersion: required(env, "MOVES_ARCHETYPE_BUILD_VERSION"),
    gitSha,
    image,
    imageDigest,
    retryCount,
    timeoutSeconds,
    storageAccount: required(env, "AZURE_STORAGE_ACCOUNT_NAME"),
    storageIdentity: required(env, "ECL_SYNTHETIC_STORAGE_IDENTITY_CLIENT_ID"),
  };
}

function assertActiveCanonicalTenant(tenantKey: string): void {
  const registryPath = path.join(
    ROOT,
    "datasets/tenant-inputs/tenant-input-registry.json",
  );
  const registry = JSON.parse(readFileSync(registryPath, "utf8")) as {
    activeTenants?: Array<{ tenantKey?: string }>;
  };
  const profile = resolveTenantAlias(tenantKey);
  if (
    !profile ||
    profile.canonicalKey !== tenantKey ||
    !registry.activeTenants?.some((tenant) => tenant.tenantKey === tenantKey)
  ) {
    throw new Error("Tenant is not active in the canonical tenant registry");
  }
}

async function resolveClientId(tenantKey: string): Promise<string> {
  const aliases = tenantAliasesFor(tenantKey);
  const rows = await azureRead.query<{
    id: string;
    tenant_key: string | null;
    slug: string | null;
  }>(
    "SELECT id, tenant_key, slug FROM clients " +
      "WHERE tenant_key = ANY($1::text[]) OR slug = ANY($1::text[])",
    [aliases],
  );
  const matches = new Map(
    rows
      .filter((row) => aliases.includes(row.tenant_key ?? "") || aliases.includes(row.slug ?? ""))
      .map((row) => [row.id, row]),
  );
  if (matches.size !== 1) {
    throw new Error("Canonical tenant lookup was missing or ambiguous");
  }
  return [...matches.keys()][0]!;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function classificationArchetype(charter: unknown): string | null {
  if (charter === null || charter === undefined) return null;
  if (!isRecord(charter)) throw new Error("Charter is not a JSON object");
  const classification = charter.classification;
  if (classification === null || classification === undefined) return null;
  if (!isRecord(classification)) {
    throw new Error("Charter classification is occupied by a non-object value");
  }
  const value = classification.archetype;
  if (value === null || value === undefined || value === "") return null;
  if (typeof value !== "string") throw new Error("Declared archetype is not text");
  return value;
}

function resolverInput(row: {
  function_pack_key: string | null;
  program_archetype: string | null;
  name: string;
  problem_statement: string | null;
  target_outcome: string | null;
  charter: Record<string, unknown> | null;
}) {
  return {
    functionPackKey: row.function_pack_key,
    archetype: row.program_archetype,
    name: row.name,
    problemStatement: row.problem_statement,
    targetOutcome: row.target_outcome,
    charter: row.charter,
  };
}

async function writeJsonOnce(
  store: ProofStore,
  blobPath: string,
  value: unknown,
): Promise<string> {
  const result = await store.writeOnce(
    blobPath,
    Buffer.from(`${JSON.stringify(value, null, 2)}\n`, "utf8"),
  );
  if (!result.created) throw new Error("Proof blob already exists for this run");
  return result.uri;
}

async function main(): Promise<void> {
  const config = parseConfig(process.env);
  assertActiveCanonicalTenant(config.tenantKey);
  const startedAt = new Date().toISOString();
  const runPrefix = `moves-discovery-archetype/runs/${config.runId}`;
  const store = await blobProofStore(
    config.storageAccount,
    config.storageIdentity,
    LIMITS,
  );
  const progress: Array<{ checkpoint: string; status: string; at: string }> = [];
  let stage = "started";
  const recordCheckpoint = async (checkpoint: string) => {
    const entry = { checkpoint, status: "passed", at: new Date().toISOString() };
    await writeJsonOnce(store, `${runPrefix}/progress/${checkpoint}.json`, {
      job_name: JOB_NAME,
      run_id: config.runId,
      tenant_scope: config.tenantKey,
      ...entry,
    });
    progress.push(entry);
    console.log(JSON.stringify({ run_id: config.runId, ...entry }));
  };

  try {
    await recordCheckpoint("00-authorized-and-proof-store-ready");
    stage = "tenant-resolution";
    const clientId = await resolveClientId(config.tenantKey);
    await recordCheckpoint("01-canonical-tenant-resolved");

    stage = "program-preflight";
    const programs = createAzureProgramsReadAdapter();
    const before = await programs.getProgramByIdRow(config.programId, clientId);
    if (!before || before.client_id !== clientId) {
      throw new Error("Tenant-scoped Move lookup did not resolve exactly one row");
    }
    if (sha256(before.name.trim()) !== config.expectedNameSha256) {
      throw new Error("Move name fingerprint did not match the approved target");
    }
    if (before.program_archetype !== config.expectedProgramArchetype) {
      throw new Error("Legacy program archetype changed since preflight");
    }
    if (before.function_pack_key !== null) {
      throw new Error("Function pack is no longer empty; refusing to override it");
    }
    if (before.current_phase !== 1) {
      throw new Error("Move is no longer at the expected early phase");
    }
    const existingDeclaration = classificationArchetype(before.charter);
    if (existingDeclaration && existingDeclaration !== TARGET_ARCHETYPE) {
      throw new Error("A different discovery archetype is already declared");
    }
    const phaseBefore = before.current_phase;
    const gatesBeforeHash = sha256(JSON.stringify(before.gates_passed ?? []));
    await recordCheckpoint("02-tenant-scoped-preflight-passed");

    stage = "archetype-declaration";
    if (existingDeclaration !== TARGET_ARCHETYPE) {
      const writer = createAzureDiscoveryArchetypeWriteAdapter();
      const write = await writer.setDeclaredArchetype({
        programId: before.id,
        clientId,
        expectedProgramArchetype: config.expectedProgramArchetype,
        expectedFunctionPackKey: null,
        archetypeId: TARGET_ARCHETYPE,
      });
      if (!write.updated) {
        throw new Error("Conditional tenant-scoped declaration was not applied");
      }
    }
    await recordCheckpoint("03-discovery-archetype-declared");

    stage = "blueprint-validation";
    const after = await programs.getProgramByIdRow(config.programId, clientId);
    if (!after || after.client_id !== clientId) {
      throw new Error("Tenant-scoped readback did not resolve the declared Move");
    }
    const input = resolverInput(after);
    const declaredId = resolveDeclaredProgramArchetypeId(input);
    const blueprint = getDiscoveryBlueprint(
      buildDiscoveryBlueprintInputFromProgram(input),
      declaredId,
    );
    const requiredFamilyKeys = blueprint.evidenceFamilies
      .filter((family) => family.required)
      .map((family) => family.id);
    const optionalFamilyKeys = blueprint.evidenceFamilies
      .filter((family) => !family.required)
      .map((family) => family.id);
    if (declaredId !== TARGET_ARCHETYPE || blueprint.blueprintId !== TARGET_ARCHETYPE) {
      throw new Error("Readback did not resolve the requested discovery blueprint");
    }
    if (JSON.stringify(requiredFamilyKeys) !== JSON.stringify(EXPECTED_REQUIRED_FAMILIES)) {
      throw new Error("Resolved required evidence families differ from the job contract");
    }
    if (after.program_archetype !== before.program_archetype) {
      throw new Error("Legacy program archetype changed during declaration");
    }
    if (after.function_pack_key !== before.function_pack_key) {
      throw new Error("Function-pack key changed during declaration");
    }
    if (after.current_phase !== phaseBefore) {
      throw new Error("Phase changed during declaration");
    }
    if (sha256(JSON.stringify(after.gates_passed ?? [])) !== gatesBeforeHash) {
      throw new Error("Gate state changed during declaration");
    }
    await recordCheckpoint("04-blueprint-and-no-phase-change-verified");

    stage = "proof-writing";
    await recordCheckpoint("05-proof-finalizing");
    const finishedAt = new Date().toISOString();
    const proofUri = store.uriFor(`${runPrefix}/proof.json`);
    const validationUri = store.uriFor(`${runPrefix}/validation.json`);
    const qualityGateUri = store.uriFor(`${runPrefix}/quality-gate.json`);
    const validation = {
      status: "PASS",
      checks: [
        "canonical tenant key is active in the tenant-input registry",
        "program read and write are fenced by the resolved tenant client id",
        "Move UUID and name fingerprint match the approved target",
        "program.archetype and functionPackKey are unchanged",
        "charter.classification.archetype resolves to the requested blueprint",
        "required family keys match the catalog contract",
        "current phase and gates_passed are unchanged",
        "no evidence, approval, or deliverable rows are written",
      ],
      program_id: after.id,
      current_phase_before: phaseBefore,
      current_phase_after: after.current_phase,
      gates_passed_hash_unchanged: true,
      legacy_program_archetype: after.program_archetype,
      function_pack_key: after.function_pack_key,
      declared_discovery_archetype: declaredId,
      blueprint_id: blueprint.blueprintId,
      required_family_keys: requiredFamilyKeys,
      optional_family_keys: optionalFamilyKeys,
    };
    const qualityGate = {
      status: "PASS",
      tenant_fence: true,
      conditional_jsonb_merge: true,
      resolver_readback: true,
      legacy_identity_preserved: true,
      phase_and_gate_state_unchanged: true,
      evidence_or_approval_mutation: false,
    };
    const proof = {
      job_name: JOB_NAME,
      run_id: config.runId,
      tenant_scope: config.tenantKey,
      build_version: config.buildVersion,
      input_source_version: config.inputSourceVersion,
      idempotency_key: config.idempotencyKey,
      started_at: startedAt,
      finished_at: finishedAt,
      operator_identity: config.operatorIdentity,
      git_sha: config.gitSha,
      image: config.image,
      image_digest: config.imageDigest,
      status: "succeeded",
      retry_count: config.retryCount,
      timeout_seconds: config.timeoutSeconds,
      proof_container: PROOF_CONTAINER,
      blob_proof_bundle: proofUri,
      validation_output: validationUri,
      quality_gate_output: qualityGateUri,
      release_record: config.releaseRecord,
      progress,
      validation,
      quality_gate: qualityGate,
    };
    await writeJsonOnce(store, `${runPrefix}/validation.json`, validation);
    await writeJsonOnce(store, `${runPrefix}/quality-gate.json`, qualityGate);
    await writeJsonOnce(store, `${runPrefix}/proof.json`, proof);
    console.log(
      JSON.stringify({
        job_name: JOB_NAME,
        run_id: config.runId,
        status: "succeeded",
        tenant_scope: config.tenantKey,
        program_id: after.id,
        blueprint_id: blueprint.blueprintId,
        required_family_keys: requiredFamilyKeys,
        optional_family_keys: optionalFamilyKeys,
        blob_proof_bundle: proofUri,
        quality_gate: qualityGate.status,
      }),
    );
  } catch (error) {
    const finishedAt = new Date().toISOString();
    const failureValidationUri = store.uriFor(`${runPrefix}/failure-validation.json`);
    const failureQualityGateUri = store.uriFor(`${runPrefix}/failure-quality-gate.json`);
    const failureProofUri = store.uriFor(`${runPrefix}/failure.json`);
    const failureValidation = {
      status: "FAIL",
      failed_stage: stage,
      detail: error instanceof Error ? error.message : "unknown operator job error",
    };
    const failureQualityGate = {
      status: "FAIL",
      mutation_authorized: true,
      mutation_may_have_occurred: ["blueprint-validation", "proof-writing"].includes(stage),
      successful_readback: stage === "proof-writing",
    };
    await writeJsonOnce(
      store,
      `${runPrefix}/failure-validation.json`,
      failureValidation,
    ).catch(() => undefined);
    await writeJsonOnce(
      store,
      `${runPrefix}/failure-quality-gate.json`,
      failureQualityGate,
    ).catch(() => undefined);
    const failure = {
      job_name: JOB_NAME,
      run_id: config.runId,
      tenant_scope: config.tenantKey,
      build_version: config.buildVersion,
      input_source_version: config.inputSourceVersion,
      idempotency_key: config.idempotencyKey,
      started_at: startedAt,
      finished_at: finishedAt,
      operator_identity: config.operatorIdentity,
      git_sha: config.gitSha,
      image: config.image,
      image_digest: config.imageDigest,
      status: "failed",
      retry_count: config.retryCount,
      timeout_seconds: config.timeoutSeconds,
      failed_stage: stage,
      error: error instanceof Error ? error.message : "unknown operator job error",
      blob_proof_bundle: failureProofUri,
      validation_output: failureValidationUri,
      quality_gate_output: failureQualityGateUri,
      proof_container: PROOF_CONTAINER,
      progress,
      quality_gate: failureQualityGate,
      release_record: config.releaseRecord,
    };
    await writeJsonOnce(store, `${runPrefix}/failure.json`, failure).catch(() => undefined);
    console.error(JSON.stringify({
      job_name: JOB_NAME,
      run_id: config.runId,
      status: "failed",
      failed_stage: stage,
      error: failure.error,
    }));
    process.exitCode = 1;
  }
}

void main().catch((error) => {
  console.error(JSON.stringify({
    job_name: JOB_NAME,
    status: "failed_before_start",
    error: error instanceof Error ? error.message : "unknown operator job error",
  }));
  process.exitCode = 1;
});
