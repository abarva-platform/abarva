#!/usr/bin/env tsx

// Seed the Move assumptions register of the synthetic demo tenant's
// governed-data-foundation demo Move from a committed, reviewable definition.
//
// What it writes: one register row per seed row, through the register STORE
// (`src/lib/programs/assumption-register/store.ts`), so every domain rule, the
// tenant fence, the revision guard and the append-only event history apply
// exactly as they do for a person in the product. Rows are created with origin
// `team`; the few the seed marks confirmed are then confirmed through the same
// store transition a person uses, naming the answer's source.
//
// Actor: the register has two actor kinds, `person` and `ava`, and the events
// table CHECK allows only those. `ava` may only raise proposals, so a team row
// written by an accountable human operator uses `person`. The user id is
// namespaced `operator:<dispatching GitHub actor>`, so the history names who
// dispatched the seed and can never be mistaken for a product user id.
//
// Identity is declared, never inferred:
//   - tenant: the seed names the canonical tenant, and the run refuses any
//     tenant whose canonical key is not the synthetic demo tenant AND is not
//     declared synthetic-demo in the tenant input registry;
//   - Move: the seed names the Move by id, and that id must equal the id the
//     committed discovery-evidence load approval already declares. The Move is
//     then authenticated from the Move registry: its client must resolve to
//     the demo tenant and its persisted charter must declare the expected
//     archetype. Nothing is looked up by name.
//
// Idempotency: the run's idempotency key must equal the key bound to the Move
// and the exact seed bytes. Each row's natural key is its area plus a hash of
// its normalised statement; a row already in the register under that key is
// never written again, so a re-run writes nothing.
//
// Modes: `dry_run` authenticates the Move, reads the register and prints the
// planned writes; it writes nothing to the register and needs no load
// approval. `apply` additionally requires the dataset manifest's named-person
// load approval for this Move and this exact seed hash.
//
// Job contract: docs/ops/aca-data-build-job-rule.md. Progress, validation,
// quality-gate and proof JSON are written locally and emitted as a proof
// bundle in the logs; an apply also writes them to the Blob proof container.
//
// Offline: `--seed-hash` validates the seed and prints its hash, Move and the
// idempotency key without touching a database.

import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";
import { z } from "zod";

import { resolveLoadApproval } from "../../src/lib/governance/dataset-manifest";
import {
  ASSUMPTION_AREAS,
  agentContextAssumptions,
  toApprovedAssumption,
  type AssumptionArea,
  type AssumptionRecord,
  type NewAssumptionInput,
  type TransitionRequest,
} from "../../src/lib/programs/assumption-register/model";
import type {
  RegisterActor,
  RegisterWriteResult,
} from "../../src/lib/programs/assumption-register/store";
import type { TenancyCtx } from "../../src/lib/programs/types.db";
import {
  isDeclaredSyntheticDemoTenant,
  type TenantInputDeclarations,
} from "../../src/lib/tenant/declared-synthetic-tenant";
import { resolveTenantAlias } from "../../src/lib/tenant/aliases";
import type { ProofStore } from "../ecl/synthetic_enterprise_home_job";

// ── Declarations ─────────────────────────────────────────────────────────────

export const JOB_NAME = "job-abarva-private-operator-eus";
export const DATASET_ID = "moves_demo_assumption_register_seed_v1";
export const SEED_PATH =
  "datasets/tenant-inputs/meridian-health/moves/demo-assumption-register-seed.json";
export const MANIFEST_DIR = "docs/governance/dataset-manifests";
export const TENANT_REGISTRY_PATH =
  "datasets/tenant-inputs/tenant-input-registry.json";
export const RELEASE_RECORD =
  "docs/releases/records/2026-10-10-moves-demo-register-seed.md";
/** The only tenant this job may ever write: the synthetic demo tenant. */
export const DEMO_TENANT_CANONICAL_KEY = "meridian-health";
export const APPLY_CONFIRMATION = "APPLY_DEMO_ASSUMPTION_REGISTER_SEED";
export const IDEMPOTENCY_PREFIX = "moves-demo-register-seed-v1";
export const DEMO_PLANNING_ASSUMPTION = "demo planning assumption";
export const OPERATOR_USER_PREFIX = "operator:";
export const PROOF_DIR_NAME = "moves-demo-assumption-register-seed-job";
export const PROOF_EVENT = "moves_demo_assumption_register_seed_proof";
export const BLOB_PREFIX = "moves-demo-assumption-register-seed/runs";
export const TIMEOUT_SECONDS = 2700;

/** Owner roles a seed row may name. Roles only: a seed never names a person. */
export const SEED_OWNER_ROLES = [
  "Finance business partner",
  "Transformation office program lead",
  "Data governance lead",
  "Data platform owner",
  "Domain data steward",
  "Clinical analytics product owner",
  "BI and analytics enablement lead",
  "Privacy owner",
] as const;

/** Repo roots a seed row may cite as its source. */
const CITABLE_ROOTS = ["datasets/", "scripts/moves/fixtures/"] as const;

// ── Seed schema ──────────────────────────────────────────────────────────────

const text = (max: number) => z.string().trim().min(1).max(max);
const repoPath = z
  .string()
  .min(1)
  .refine(
    (value) =>
      !value.includes("..") &&
      !path.isAbsolute(value) &&
      CITABLE_ROOTS.some((root) => value.startsWith(root)),
    "must be a repo-relative path under a citable root",
  );

const ConfirmSchema = z
  .object({
    answer: text(600),
    answer_figure: text(80),
    answer_value: z.number(),
    answer_source: text(400),
    answer_source_ref: repoPath,
  })
  .strict();

const RowSchema = z
  .object({
    seed_key: z.string().regex(/^(value|data|delivery|adoption)\.[a-z0-9_]+$/),
    area: z.enum(ASSUMPTION_AREAS),
    statement: z.string().trim().min(12).max(400),
    why_it_matters: z.string().trim().min(12).max(600),
    working_figure: text(80),
    working_value: z.number(),
    unit: text(60),
    source: text(400),
    source_ref: repoPath.nullable(),
    owner_role: z.enum(SEED_OWNER_ROLES),
    confidence: z.union([z.literal(1), z.literal(3), z.literal(5)]),
    confirm: ConfirmSchema.nullable(),
  })
  .strict();

const SeedSchema = z
  .object({
    schema_version: z.literal(1),
    dataset_id: z.literal(DATASET_ID),
    title: text(200),
    synthetic: z.literal(true),
    client_attested: z.literal(false),
    tenant: z.object({ canonical_tenant_key: z.string().min(1) }).strict(),
    move: z
      .object({
        move_id: z
          .string()
          .regex(
            /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
          ),
        declared_by: z
          .object({
            manifest_dataset_id: z.string().min(1),
            field: z.literal("load_approval.move_id"),
          })
          .strict(),
        expected_archetype: z.string().min(1),
      })
      .strict(),
    origin: z.literal("team"),
    rows: z.array(RowSchema).min(12).max(16),
  })
  .strict();

export type SeedDefinition = z.infer<typeof SeedSchema>;
export type SeedRow = SeedDefinition["rows"][number];

export type SeedValidation =
  | { ok: true; seed: SeedDefinition; errors: [] }
  | { ok: false; seed: null; errors: string[] };

const CONTACT_OR_LINK = /(?:\b[\w.+-]+@[\w-]+\.[\w.]+\b|https?:\/\/)/i;

export function sha256(value: string | Buffer): string {
  return createHash("sha256").update(value).digest("hex");
}

export function normalizeStatement(statement: string): string {
  return statement.trim().replace(/\s+/g, " ").toLowerCase();
}

/** A row's natural key: its area plus the hash of its normalised statement. */
export function naturalKey(area: AssumptionArea, statement: string): string {
  return `${area}:${sha256(normalizeStatement(statement))}`;
}

/** The only idempotency key a run of this seed against this Move may carry. */
export function idempotencyKeyFor(moveId: string, seedHash: string): string {
  return `${IDEMPOTENCY_PREFIX}:${sha256(`${moveId}|${seedHash}`)}`;
}

/**
 * Validate a parsed seed: its schema, then the rules no schema states — area
 * coverage, unique keys, a role never a name, every cited file present, and a
 * planning assumption never confirmed.
 */
export function validateSeedDefinition(
  raw: unknown,
  fileExists: (repoRelativePath: string) => boolean,
): SeedValidation {
  const parsed = SeedSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      seed: null,
      errors: parsed.error.issues.map(
        (issue) => `${issue.path.join(".")}: ${issue.message}`,
      ),
    };
  }
  const seed = parsed.data;
  const errors: string[] = [];
  if (seed.tenant.canonical_tenant_key !== DEMO_TENANT_CANONICAL_KEY) {
    errors.push("tenant.canonical_tenant_key: not the synthetic demo tenant");
  }
  const seedKeys = new Set<string>();
  const naturalKeys = new Set<string>();
  for (const [index, row] of seed.rows.entries()) {
    const at = `rows.${index}`;
    if (!row.seed_key.startsWith(`${row.area}.`)) {
      errors.push(`${at}.seed_key: prefix does not match area ${row.area}`);
    }
    if (seedKeys.has(row.seed_key)) {
      errors.push(`${at}.seed_key: duplicate ${row.seed_key}`);
    }
    seedKeys.add(row.seed_key);
    const key = naturalKey(row.area, row.statement);
    if (naturalKeys.has(key)) {
      errors.push(`${at}.statement: duplicates another row's natural key`);
    }
    naturalKeys.add(key);
    if (row.source_ref === null) {
      if (row.source !== DEMO_PLANNING_ASSUMPTION) {
        errors.push(
          `${at}.source: an uncited source must be "${DEMO_PLANNING_ASSUMPTION}"`,
        );
      }
    } else {
      if (!row.source.includes(`[${row.source_ref}]`)) {
        errors.push(`${at}.source: does not cite [${row.source_ref}]`);
      }
      if (!fileExists(row.source_ref)) {
        errors.push(`${at}.source_ref: ${row.source_ref} does not exist`);
      }
    }
    if (row.confirm) {
      if (row.source_ref === null) {
        errors.push(`${at}.confirm: a planning assumption cannot be confirmed`);
      }
      if (
        !row.confirm.answer_source.includes(
          `[${row.confirm.answer_source_ref}]`,
        )
      ) {
        errors.push(
          `${at}.confirm.answer_source: does not cite [${row.confirm.answer_source_ref}]`,
        );
      }
      if (!fileExists(row.confirm.answer_source_ref)) {
        errors.push(
          `${at}.confirm.answer_source_ref: ${row.confirm.answer_source_ref} does not exist`,
        );
      }
    }
    const texts = [
      row.statement,
      row.why_it_matters,
      row.working_figure,
      row.source,
      row.confirm?.answer ?? "",
      row.confirm?.answer_source ?? "",
    ];
    if (texts.some((value) => CONTACT_OR_LINK.test(value))) {
      errors.push(`${at}: contains contact data or a link`);
    }
  }
  for (const area of ASSUMPTION_AREAS) {
    if (!seed.rows.some((row) => row.area === area)) {
      errors.push(`rows: no ${area} row`);
    }
  }
  const confirmed = seed.rows.filter((row) => row.confirm !== null).length;
  if (confirmed === 0 || confirmed === seed.rows.length) {
    errors.push("rows: a seed must leave some rows open and confirm some");
  }
  return errors.length > 0
    ? { ok: false, seed: null, errors }
    : { ok: true, seed, errors: [] };
}

// ── Job arguments ────────────────────────────────────────────────────────────

export type SeedJobMode = "dry_run" | "apply";

export interface SeedJobArgs {
  mode: SeedJobMode;
  canonicalTenantKey: string;
  appClientKey: string;
  inputSha256: string;
  idempotencyKey: string;
  runId: string;
  buildVersion: string;
  imageDigest: string;
  operator: string;
  runAttempt: number;
  approvalReference: string | null;
  storageAccount: string | null;
  storageIdentityClientId: string | null;
  outDir: string;
  emitProofBundle: boolean;
}

function required(
  env: Record<string, string | undefined>,
  key: string,
): string {
  const value = env[key]?.trim();
  if (!value) throw new Error(`${key}_required`);
  return value;
}

/** Refuse every tenant but the synthetic demo tenant, by its canonical key. */
export function resolveDemoTenant(tenantKey: string): {
  canonicalKey: string;
  appClientKey: string;
} {
  const profile = resolveTenantAlias(tenantKey);
  if (!profile || profile.canonicalKey !== DEMO_TENANT_CANONICAL_KEY) {
    throw new Error("demo_tenant_only");
  }
  return {
    canonicalKey: profile.canonicalKey,
    appClientKey: profile.appClientKey,
  };
}

function isAzureDatabaseHost(databaseUrl: string): boolean {
  let host = "";
  try {
    host = new URL(databaseUrl).hostname.toLowerCase();
  } catch {
    return false;
  }
  return (
    host.endsWith(".postgres.database.azure.com") ||
    /^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(host)
  );
}

export function parseSeedJobArgs(
  env: Record<string, string | undefined> = process.env,
): SeedJobArgs {
  const mode = env.MOVES_REGISTER_SEED_MODE ?? "dry_run";
  if (mode !== "dry_run" && mode !== "apply")
    throw new Error("invalid_job_mode");
  const tenant = resolveDemoTenant(
    required(env, "MOVES_REGISTER_SEED_TENANT_KEY"),
  );
  const inputSha256 = required(env, "MOVES_REGISTER_SEED_INPUT_SHA256");
  if (!/^[a-f0-9]{64}$/.test(inputSha256))
    throw new Error("invalid_input_sha256");
  const runId = required(env, "MOVES_REGISTER_SEED_RUN_ID");
  if (!/^[A-Za-z0-9][A-Za-z0-9_-]{0,79}$/.test(runId))
    throw new Error("invalid_run_id");
  const buildVersion = required(env, "MOVES_REGISTER_SEED_BUILD_VERSION");
  if (!/^[a-f0-9]{40}$/.test(buildVersion))
    throw new Error("git_sha_build_version_required");
  const imageDigest = required(env, "MOVES_REGISTER_SEED_IMAGE_DIGEST");
  if (!/^sha256:[a-f0-9]{64}$/.test(imageDigest)) {
    throw new Error("digest_pinned_image_required");
  }
  const operator = required(env, "MOVES_REGISTER_SEED_OPERATOR");
  if (!/^[A-Za-z0-9._@-]+$/.test(operator)) throw new Error("invalid_operator");
  const runAttempt = Number(env.MOVES_REGISTER_SEED_RUN_ATTEMPT ?? "1");
  if (!Number.isSafeInteger(runAttempt) || runAttempt < 1) {
    throw new Error("invalid_run_attempt");
  }
  const databaseUrl = required(env, "DATABASE_URL");
  if (!isAzureDatabaseHost(databaseUrl))
    throw new Error("non_azure_database_refused");
  let approvalReference: string | null = null;
  let storageAccount: string | null = null;
  let storageIdentityClientId: string | null = null;
  if (mode === "apply") {
    if (
      env.MOVES_REGISTER_SEED_APPLY_APPROVED !== "true" ||
      env.MOVES_REGISTER_SEED_CONFIRMATION !== APPLY_CONFIRMATION
    ) {
      throw new Error("apply_not_authorized");
    }
    approvalReference = required(env, "MOVES_REGISTER_SEED_APPROVAL_REFERENCE");
    storageAccount = required(env, "AZURE_STORAGE_ACCOUNT_NAME");
    storageIdentityClientId = required(
      env,
      "ECL_SYNTHETIC_STORAGE_IDENTITY_CLIENT_ID",
    );
  }
  return {
    mode,
    canonicalTenantKey: tenant.canonicalKey,
    appClientKey: tenant.appClientKey,
    inputSha256,
    idempotencyKey: required(env, "MOVES_REGISTER_SEED_IDEMPOTENCY_KEY"),
    runId,
    buildVersion,
    imageDigest,
    operator,
    runAttempt,
    approvalReference,
    storageAccount,
    storageIdentityClientId,
    outDir: path.join(
      env.MOVES_REGISTER_SEED_OUT_PARENT ?? "/tmp",
      PROOF_DIR_NAME,
    ),
    emitProofBundle: env.MOVES_REGISTER_SEED_EMIT_PROOF_BUNDLE === "true",
  };
}

// ── Move authentication ──────────────────────────────────────────────────────

/** What the Move registry holds about one Move and its client. */
export interface MoveRegistryRow {
  id: string;
  clientId: string;
  deletedAt: string | null;
  charter: unknown;
  clientTenantKey: string | null;
  clientSlug: string | null;
}

export interface AuthenticatedMove {
  moveId: string;
  clientId: string;
  canonicalTenantKey: string;
  appClientKey: string;
}

/** The Move id the committed manifest the seed points at declares. */
export function assertMoveDeclaration(
  seed: SeedDefinition,
  manifests: unknown[],
): void {
  const declaring = manifests.filter(
    (raw) =>
      typeof raw === "object" &&
      raw !== null &&
      (raw as { dataset_id?: unknown }).dataset_id ===
        seed.move.declared_by.manifest_dataset_id,
  ) as Array<{ load_approval?: { move_id?: unknown } | null }>;
  if (declaring.length !== 1)
    throw new Error("move_declaration_manifest_not_unique");
  if (declaring[0].load_approval?.move_id !== seed.move.move_id) {
    throw new Error("move_not_declared_by_manifest");
  }
}

export function authenticateDemoMove(
  row: MoveRegistryRow | null,
  seed: SeedDefinition,
  tenant: { canonicalKey: string; appClientKey: string },
): AuthenticatedMove {
  if (!row || row.id !== seed.move.move_id || row.deletedAt !== null) {
    throw new Error("move_not_found");
  }
  const declaredKeys = [row.clientTenantKey, row.clientSlug].filter(
    (value): value is string => Boolean(value),
  );
  const profiles = declaredKeys.map((value) => resolveTenantAlias(value));
  if (
    profiles.length === 0 ||
    profiles.some(
      (profile) => !profile || profile.canonicalKey !== tenant.canonicalKey,
    )
  ) {
    throw new Error("move_tenant_mismatch");
  }
  const charter = (row.charter ?? {}) as {
    classification?: { archetype?: unknown };
  };
  if (charter.classification?.archetype !== seed.move.expected_archetype) {
    throw new Error("move_archetype_mismatch");
  }
  return {
    moveId: row.id,
    clientId: row.clientId,
    canonicalTenantKey: tenant.canonicalKey,
    appClientKey: tenant.appClientKey,
  };
}

// ── Planning ─────────────────────────────────────────────────────────────────

export type PlannedAction =
  /** Not in the register: create it (and confirm it, when the seed says so). */
  | "create"
  /** Created by an earlier seed run that stopped before its confirm. */
  | "confirm_existing"
  /** Already in the register as the seed describes it. */
  | "present"
  /** In the register, but a person has moved it since; left as it is. */
  | "human_changed";

export interface PlannedWrite {
  seedKey: string;
  area: AssumptionArea;
  naturalKey: string;
  action: PlannedAction;
  /** Register mutations this item makes: a create, a confirm, or both. */
  writes: number;
  existingRegisterId: string | null;
}

export function operatorActor(operator: string): RegisterActor {
  return { kind: "person", userId: `${OPERATOR_USER_PREFIX}${operator}` };
}

/**
 * Compare the seed with the register. A row already present under its natural
 * key is never written again; the only exception is the confirm an earlier
 * seed run created the row for and did not reach.
 */
export function planSeedWrites(
  rows: readonly SeedRow[],
  existing: readonly AssumptionRecord[],
): PlannedWrite[] {
  return rows.map((row) => {
    const key = naturalKey(row.area, row.statement);
    const matches = existing.filter(
      (record) => naturalKey(record.area, record.statement) === key,
    );
    const base = { seedKey: row.seed_key, area: row.area, naturalKey: key };
    if (matches.length === 0) {
      return {
        ...base,
        action: "create",
        writes: row.confirm ? 2 : 1,
        existingRegisterId: null,
      };
    }
    const current = matches[0];
    const createdBySeed =
      matches.length === 1 &&
      current.createdByUserId.startsWith(OPERATOR_USER_PREFIX);
    if (row.confirm && current.status === "open" && createdBySeed) {
      return {
        ...base,
        action: "confirm_existing",
        writes: 1,
        existingRegisterId: current.registerId,
      };
    }
    const expected = row.confirm ? "confirmed" : "open";
    return {
      ...base,
      action:
        matches.length === 1 && current.status === expected
          ? "present"
          : "human_changed",
      writes: 0,
      existingRegisterId: current.registerId,
    };
  });
}

export function newAssumptionInput(row: SeedRow): NewAssumptionInput {
  return {
    area: row.area,
    statement: row.statement,
    whyItMatters: row.why_it_matters,
    workingFigure: row.working_figure,
    workingValue: row.working_value,
    unit: row.unit,
    source: row.source,
    confidence: row.confidence,
    ownerRole: row.owner_role,
    origin: "team",
  };
}

export function confirmRequest(row: SeedRow): TransitionRequest {
  if (!row.confirm) throw new Error(`seed_row_not_confirmed:${row.seed_key}`);
  return {
    action: "confirm",
    answer: row.confirm.answer,
    answerFigure: row.confirm.answer_figure,
    answerValue: row.confirm.answer_value,
    answerSource: row.confirm.answer_source,
  };
}

// ── Readback ─────────────────────────────────────────────────────────────────

export interface ReadbackValidation {
  passed: boolean;
  seedRows: number;
  rowsFound: number;
  openRows: number;
  confirmedRows: number;
  humanChangedRows: number;
  agentContextRows: number;
  generationFigures: number;
  failures: string[];
}

/**
 * Read the register back and check that every seed row is in it exactly once,
 * as the seed describes it, and that every one of them may reach a Move's
 * prompt context with a figure — the point of seeding it.
 */
export function validateReadback(
  rows: readonly SeedRow[],
  plan: readonly PlannedWrite[],
  register: readonly AssumptionRecord[],
  scope: { clientId: string; appClientKey: string; actor: RegisterActor },
): ReadbackValidation {
  const failures: string[] = [];
  const seeded: AssumptionRecord[] = [];
  let humanChangedRows = 0;
  rows.forEach((row, index) => {
    const key = naturalKey(row.area, row.statement);
    const matches = register.filter(
      (record) => naturalKey(record.area, record.statement) === key,
    );
    if (matches.length !== 1) {
      failures.push(`${row.seed_key}: ${matches.length} register rows`);
      return;
    }
    const record = matches[0];
    if (plan[index]?.action === "human_changed") {
      humanChangedRows += 1;
      return;
    }
    const expected = row.confirm ? "confirmed" : "open";
    if (record.status !== expected) {
      failures.push(
        `${row.seed_key}: status ${record.status}, expected ${expected}`,
      );
    }
    if (record.origin !== "team")
      failures.push(`${row.seed_key}: origin ${record.origin}`);
    if (record.tenantKey !== scope.appClientKey) {
      failures.push(`${row.seed_key}: tenant key ${record.tenantKey}`);
    }
    if (
      plan[index]?.action === "create" &&
      record.createdByUserId !== scope.actor.userId
    ) {
      failures.push(`${row.seed_key}: not created by this operator`);
    }
    if (row.confirm && record.answerSource !== row.confirm.answer_source) {
      failures.push(`${row.seed_key}: answer source differs`);
    }
    seeded.push(record);
  });
  const agentContext = agentContextAssumptions(seeded, {
    tenantId: scope.clientId,
  });
  if (agentContext.length !== seeded.length) {
    failures.push(
      `${seeded.length - agentContext.length} seeded rows blocked from agent context`,
    );
  }
  const generationFigures = seeded.filter(
    (record) => toApprovedAssumption(record)?.figure,
  ).length;
  if (generationFigures !== seeded.length) {
    failures.push(
      `${seeded.length - generationFigures} seeded rows reach generation without a figure`,
    );
  }
  return {
    passed: failures.length === 0,
    seedRows: rows.length,
    rowsFound: seeded.length + humanChangedRows,
    openRows: seeded.filter((record) => record.status === "open").length,
    confirmedRows: seeded.filter((record) => record.status === "confirmed")
      .length,
    humanChangedRows,
    agentContextRows: agentContext.length,
    generationFigures,
    failures,
  };
}

// ── The run ──────────────────────────────────────────────────────────────────

export interface SeedRegisterPort {
  list(ctx: TenancyCtx, programId: string): Promise<AssumptionRecord[]>;
  create(
    ctx: TenancyCtx,
    programId: string,
    input: NewAssumptionInput,
    actor: RegisterActor,
  ): Promise<RegisterWriteResult>;
  transition(
    ctx: TenancyCtx,
    programId: string,
    assumptionId: string,
    expectedRevision: number,
    request: TransitionRequest,
    actor: RegisterActor,
  ): Promise<RegisterWriteResult>;
}

export interface SeedJobDeps {
  readText(repoRelativePath: string): string;
  fileExists(repoRelativePath: string): boolean;
  listManifests(): unknown[];
  readMoveRegistryRow(moveId: string): Promise<MoveRegistryRow | null>;
  register: SeedRegisterPort;
  /** Apply only: the Blob proof store. */
  openProofStore(): Promise<ProofStore>;
  writeLocal(name: string, value: unknown): void;
  emitBundle(): void;
  log(line: string): void;
  now(): string;
}

export interface SeedJobSummary {
  schemaVersion: 1;
  event: typeof PROOF_EVENT;
  mode: SeedJobMode;
  status: "succeeded" | "failed";
  contract: Record<string, unknown>;
  seed: {
    rowCount: number;
    byArea: Record<string, number>;
    confirmRows: number;
  } | null;
  plan: PlannedWrite[];
  writes: { created: number; confirmed: number; total: number };
  committed: boolean;
  loadApproval: { approved: boolean; reasons: string[] } | null;
  progress: Array<{ checkpoint: string; status: string; at: string }>;
  validation: ReadbackValidation | null;
  qualityGate: Record<string, unknown> | null;
  blobProofLocation: string;
  validationOutput: string;
  qualityGateOutput: string;
  failedStage: string | null;
  error: string | null;
}

function refusalText(
  result: Extract<RegisterWriteResult, { ok: false }>,
): string {
  return `register_refused:${result.refusal.code}`;
}

export async function runSeedJob(
  args: SeedJobArgs,
  deps: SeedJobDeps,
): Promise<SeedJobSummary> {
  const startedAt = deps.now();
  const actor = operatorActor(args.operator);
  const blobPrefix = `${BLOB_PREFIX}/${args.runId}`;
  const progress: SeedJobSummary["progress"] = [];
  const writes = { created: 0, confirmed: 0, total: 0 };
  let stage = "seed-validation";
  let seed: SeedDefinition | null = null;
  let plan: PlannedWrite[] = [];
  let loadApproval: SeedJobSummary["loadApproval"] = null;
  let validation: ReadbackValidation | null = null;
  let qualityGate: Record<string, unknown> | null = null;
  let proofStore: ProofStore | null = null;
  let moveId: string | null = null;

  const seedText = deps.readText(SEED_PATH);
  const seedHash = sha256(seedText);
  const contract = (): Record<string, unknown> => ({
    jobName: JOB_NAME,
    runId: args.runId,
    tenantScope: args.canonicalTenantKey,
    appClientKey: args.appClientKey,
    moveId,
    datasetId: DATASET_ID,
    buildVersion: args.buildVersion,
    gitSha: args.buildVersion,
    inputSourceVersion: seedHash,
    inputSha256: args.inputSha256,
    idempotencyKey: args.idempotencyKey,
    operatorIdentity: actor.userId,
    imageDigest: args.imageDigest,
    approvalReferenceSha256: args.approvalReference
      ? sha256(args.approvalReference)
      : null,
    startedAt,
    retryCount: args.runAttempt - 1,
    timeoutSeconds: TIMEOUT_SECONDS,
    releaseRecord: RELEASE_RECORD,
  });
  const writeProof = async (name: string, value: unknown): Promise<string> => {
    deps.writeLocal(`${name}.json`, value);
    if (!proofStore) return `local:${PROOF_DIR_NAME}/${name}.json`;
    const result = await proofStore.writeOnce(
      `${blobPrefix}/${name}.json`,
      Buffer.from(`${JSON.stringify(value, null, 2)}\n`, "utf8"),
    );
    if (!result.created) throw new Error("proof_blob_already_exists");
    return result.uri;
  };
  const checkpoint = async (name: string) => {
    const entry = { checkpoint: name, status: "passed", at: deps.now() };
    progress.push(entry);
    deps.writeLocal("progress.json", {
      jobName: JOB_NAME,
      runId: args.runId,
      progress,
    });
    if (proofStore)
      await writeProof(`progress/${name}`, { runId: args.runId, ...entry });
    deps.log(
      JSON.stringify({
        event: "moves_demo_register_seed_progress",
        runId: args.runId,
        ...entry,
      }),
    );
  };
  const summaryOf = (
    status: SeedJobSummary["status"],
    extra: Partial<SeedJobSummary>,
  ): SeedJobSummary => ({
    schemaVersion: 1,
    event: PROOF_EVENT,
    mode: args.mode,
    status,
    contract: { ...contract(), finishedAt: deps.now() },
    seed: seed
      ? {
          rowCount: seed.rows.length,
          byArea: Object.fromEntries(
            ASSUMPTION_AREAS.map((area) => [
              area,
              seed!.rows.filter((row) => row.area === area).length,
            ]),
          ),
          confirmRows: seed.rows.filter((row) => row.confirm).length,
        }
      : null,
    plan,
    writes,
    committed: writes.total > 0,
    loadApproval,
    progress,
    validation,
    qualityGate,
    blobProofLocation: "not_required_for_dry_run",
    validationOutput: "not_written",
    qualityGateOutput: "not_written",
    failedStage: null,
    error: null,
    ...extra,
  });

  try {
    if (seedHash !== args.inputSha256) throw new Error("input_sha256_mismatch");
    const checked = validateSeedDefinition(
      JSON.parse(seedText),
      deps.fileExists,
    );
    if (!checked.ok)
      throw new Error(`seed_invalid:${checked.errors.join("; ")}`);
    seed = checked.seed;
    moveId = seed.move.move_id;
    if (
      args.idempotencyKey !== idempotencyKeyFor(seed.move.move_id, seedHash)
    ) {
      throw new Error("idempotency_key_mismatch");
    }
    const registry = JSON.parse(
      deps.readText(TENANT_REGISTRY_PATH),
    ) as TenantInputDeclarations;
    if (!isDeclaredSyntheticDemoTenant(args.canonicalTenantKey, registry)) {
      throw new Error("tenant_not_declared_synthetic_demo");
    }
    const manifests = deps.listManifests();
    assertMoveDeclaration(seed, manifests);
    if (args.mode === "apply") proofStore = await deps.openProofStore();
    await checkpoint("00-seed-and-job-contract-validated");

    stage = "move-authentication";
    const move = authenticateDemoMove(
      await deps.readMoveRegistryRow(seed.move.move_id),
      seed,
      {
        canonicalKey: args.canonicalTenantKey,
        appClientKey: args.appClientKey,
      },
    );
    await checkpoint("01-move-tenant-and-archetype-authenticated");

    stage = "load-approval";
    const decision = resolveLoadApproval(manifests, {
      dataset_id: DATASET_ID,
      tenant_key: move.appClientKey,
      assessment_id: move.moveId,
      source_set_hash: seedHash,
      object_count: seed.rows.length,
      ingestion_method: "operator_aca_job",
      move_id: move.moveId,
    });
    loadApproval = decision.approved
      ? { approved: true, reasons: [] }
      : { approved: false, reasons: decision.reasons };
    if (args.mode === "apply") {
      if (!decision.approved) {
        throw new Error(`load_approval_refused:${decision.reasons.join("; ")}`);
      }
      if (decision.approval.release_record !== RELEASE_RECORD) {
        throw new Error("load_approval_release_record_mismatch");
      }
    }
    await checkpoint(
      args.mode === "apply"
        ? "02-load-approval-verified"
        : "02-load-approval-reported",
    );

    stage = "register-read-and-plan";
    const ctx: TenancyCtx = {
      clientId: move.clientId,
      clientKey: move.appClientKey,
      userId: actor.userId,
    };
    const existing = await deps.register.list(ctx, move.moveId);
    plan = planSeedWrites(seed.rows, existing);
    deps.writeLocal("plan.json", { contract: contract(), plan });
    for (const item of plan) {
      deps.log(
        JSON.stringify({
          event: "moves_demo_register_seed_planned_write",
          mode: args.mode,
          ...item,
        }),
      );
    }
    await checkpoint("03-register-read-and-plan-built");

    let register = existing;
    if (args.mode === "apply") {
      stage = "register-write";
      for (const [index, item] of plan.entries()) {
        const row = seed.rows[index];
        if (item.action === "create") {
          const created = await deps.register.create(
            ctx,
            move.moveId,
            newAssumptionInput(row),
            actor,
          );
          if (!created.ok) throw new Error(refusalText(created));
          writes.created += 1;
          writes.total += 1;
          if (row.confirm) {
            const confirmed = await deps.register.transition(
              ctx,
              move.moveId,
              created.record.id,
              created.record.revision,
              confirmRequest(row),
              actor,
            );
            if (!confirmed.ok) throw new Error(refusalText(confirmed));
            writes.confirmed += 1;
            writes.total += 1;
          }
        } else if (item.action === "confirm_existing") {
          const current = existing.find(
            (record) =>
              naturalKey(record.area, record.statement) === item.naturalKey,
          )!;
          const confirmed = await deps.register.transition(
            ctx,
            move.moveId,
            current.id,
            current.revision,
            confirmRequest(row),
            actor,
          );
          if (!confirmed.ok) throw new Error(refusalText(confirmed));
          writes.confirmed += 1;
          writes.total += 1;
        }
      }
      await checkpoint("04-register-writes-applied");
      stage = "readback";
      register = await deps.register.list(ctx, move.moveId);
      validation = validateReadback(seed.rows, plan, register, {
        clientId: move.clientId,
        appClientKey: move.appClientKey,
        actor,
      });
      if (!validation.passed) {
        throw new Error(`readback_failed:${validation.failures.join("; ")}`);
      }
      await checkpoint("05-register-readback-validated");
    } else {
      await checkpoint("04-dry-run-wrote-nothing");
    }

    stage = "quality-gate";
    const plannedWrites = plan.reduce((sum, item) => sum + item.writes, 0);
    qualityGate = {
      passed: true,
      seedValidated: true,
      demoTenantOnly: true,
      moveDeclaredAndAuthenticated: true,
      loadApproval:
        args.mode === "apply"
          ? "verified"
          : decision.approved
            ? "present"
            : "absent_not_required_for_dry_run",
      writesThroughRegisterStore: true,
      actorKind: actor.kind,
      origin: "team",
      ownerRolesOnly: true,
      plannedWrites,
      readback: args.mode === "apply" ? "passed" : "not_run_for_dry_run",
    };
    const validationOutput = await writeProof(
      "validation",
      validation ?? { mode: "dry_run", plannedWrites, plan: plan.length },
    );
    const qualityGateOutput = await writeProof("quality-gate", qualityGate);
    const blobProofLocation = proofStore
      ? proofStore.uriFor(`${blobPrefix}/proof.json`)
      : "not_required_for_dry_run";
    const summary = summaryOf("succeeded", {
      blobProofLocation,
      validationOutput,
      qualityGateOutput,
    });
    await writeProof("proof", summary);
    deps.writeLocal("proof-manifest.json", summary);
    deps.emitBundle();
    deps.log(
      `__MOVES_DEMO_REGISTER_SEED_PROOF_SUMMARY__${JSON.stringify(summary)}`,
    );
    return summary;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    // The store throws RegisterHistoryWriteError when a change DID land but its
    // history event did not; that run committed a mutation even though the
    // write counter never saw the result.
    const landedWithoutHistory =
      error instanceof Error && error.name === "RegisterHistoryWriteError";
    const summary = summaryOf("failed", {
      failedStage: stage,
      error: message,
      committed: writes.total > 0 || landedWithoutHistory,
    });
    deps.writeLocal("proof-manifest.json", summary);
    if (proofStore) {
      await writeProof("failure", summary).catch(() => undefined);
    }
    try {
      deps.emitBundle();
    } catch {
      // The failure is already recorded locally; a bundle error must not mask it.
    }
    deps.log(
      JSON.stringify({
        event: PROOF_EVENT,
        status: "failed",
        runId: args.runId,
        failedStage: stage,
        mutationCommitted: summary.committed,
        error: message,
      }),
    );
    return summary;
  }
}

// ── Runtime wiring (ACA operator job only) ───────────────────────────────────

const ROOT = process.cwd();

function readRepoText(repoRelativePath: string): string {
  return readFileSync(path.join(ROOT, repoRelativePath), "utf8");
}

function repoFileExists(repoRelativePath: string): boolean {
  return existsSync(path.join(ROOT, repoRelativePath));
}

function readManifests(): unknown[] {
  const dir = path.join(ROOT, MANIFEST_DIR);
  return readdirSync(dir)
    .filter((name) => name.endsWith(".json"))
    .map((name) => JSON.parse(readFileSync(path.join(dir, name), "utf8")));
}

function emitProofBundle(outDir: string): void {
  const parent = path.dirname(outDir);
  const base = path.basename(outDir);
  const tarPath = path.join(parent, `${base}.tgz`);
  const result = spawnSync("tar", ["-czf", tarPath, "-C", parent, base], {
    encoding: "utf8",
  });
  if (result.status !== 0)
    throw new Error(result.stderr || "proof_bundle_failed");
  const encoded = readFileSync(tarPath).toString("base64");
  console.log("__SEMANTIC2_PROOF_TGZ_BEGIN__");
  for (let index = 0; index < encoded.length; index += 7600) {
    console.log(encoded.slice(index, index + 7600));
  }
  console.log("__SEMANTIC2_PROOF_TGZ_END__");
}

async function runtimeDeps(args: SeedJobArgs): Promise<SeedJobDeps> {
  const store =
    await import("../../src/lib/programs/assumption-register/store");
  const { getAzureReadFluentClient } =
    await import("../../src/lib/data-plane/postgresCompat");
  mkdirSync(args.outDir, { recursive: true });
  return {
    readText: readRepoText,
    fileExists: repoFileExists,
    listManifests: readManifests,
    async readMoveRegistryRow(moveId) {
      const db = getAzureReadFluentClient();
      const { data: move, error } = await db
        .from("engagements")
        .select("id, client_id, charter, deleted_at")
        .eq("id", moveId)
        .maybeSingle();
      if (error) throw error;
      if (!move) return null;
      const { data: client, error: clientError } = await db
        .from("clients")
        .select("id, tenant_key, slug")
        .eq("id", move.client_id)
        .maybeSingle();
      if (clientError) throw clientError;
      return {
        id: String(move.id),
        clientId: String(move.client_id),
        deletedAt: move.deleted_at ?? null,
        charter: move.charter ?? null,
        clientTenantKey: client?.tenant_key ?? null,
        clientSlug: client?.slug ?? null,
      };
    },
    register: {
      list: store.listAssumptions,
      create: store.createAssumption,
      transition: store.transitionAssumption,
    },
    async openProofStore() {
      const { blobProofStore } =
        await import("../ecl/synthetic_enterprise_home_job");
      return blobProofStore(
        args.storageAccount!,
        args.storageIdentityClientId!,
        {
          statementTimeoutMs: 60_000,
          lockTimeoutMs: 15_000,
          proofStoreTimeoutMs: 30_000,
        },
      );
    },
    writeLocal(name, value) {
      const target = path.join(args.outDir, name);
      mkdirSync(path.dirname(target), { recursive: true });
      writeFileSync(target, `${JSON.stringify(value, null, 2)}\n`);
    },
    emitBundle() {
      if (args.emitProofBundle) emitProofBundle(args.outDir);
    },
    log: (line) => console.log(line),
    now: () => new Date().toISOString(),
  };
}

/** Offline: validate the seed and print what a dispatch must carry. */
export function describeSeed(
  seedText: string,
  fileExists: (repoRelativePath: string) => boolean,
): Record<string, unknown> {
  const checked = validateSeedDefinition(JSON.parse(seedText), fileExists);
  if (!checked.ok) throw new Error(`seed_invalid:${checked.errors.join("; ")}`);
  const seedHash = sha256(seedText);
  return {
    dataset_id: DATASET_ID,
    seed_path: SEED_PATH,
    input_sha256: seedHash,
    move_id: checked.seed.move.move_id,
    idempotency_key: idempotencyKeyFor(checked.seed.move.move_id, seedHash),
    row_count: checked.seed.rows.length,
    rows: checked.seed.rows.map((row) => ({
      seed_key: row.seed_key,
      area: row.area,
      confirmed: row.confirm !== null,
      natural_key: naturalKey(row.area, row.statement),
    })),
  };
}

async function main(): Promise<void> {
  if (process.argv.includes("--seed-hash")) {
    console.log(
      JSON.stringify(
        describeSeed(readRepoText(SEED_PATH), repoFileExists),
        null,
        2,
      ),
    );
    return;
  }
  const args = parseSeedJobArgs();
  const summary = await runSeedJob(args, await runtimeDeps(args));
  if (summary.status !== "succeeded") process.exitCode = 1;
}

if (process.argv[1]?.endsWith("seed-demo-assumption-register-job.ts")) {
  main().catch((error) => {
    console.error(
      JSON.stringify({
        event: PROOF_EVENT,
        status: "failed_before_start",
        error: error instanceof Error ? error.message : String(error),
      }),
    );
    process.exitCode = 1;
  });
}
