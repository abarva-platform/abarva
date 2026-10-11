import type { AssumptionRecord } from "../../lib/programs/assumption-register/model";
import {
  APPLY_CONFIRMATION, assertExactLiveBinding, denialsJobIdempotencyKey, loadManifests,
  makePreflightBinding, OLD_PROTECTED_MOVE_ID, RELEASE_RECORD,
  runDenialsSeedJob, type JobArgs, type JobDeps, type LiveScope,
} from "../../../scripts/moves/denials-pack/seed-job";
import { readExactProposal, SEED_DATASET_ID, sourceSetSha256 } from
  "../../../scripts/moves/denials-pack/seed-contract";
import { parseArgs } from "../../../scripts/moves/denials-pack/seed-job-runner";

const MOVE = "00000000-0000-4000-8000-000000000101";
const CLIENT = "00000000-0000-4000-8000-000000000102";
const PERSON = "00000000-0000-4000-8000-000000000103";
const CLERK = "user_dedicated_operator";
const APPROVAL_REF = "private-approved-scope";
const OBSERVED = new Date(Date.now() - 60_000).toISOString();

function liveScope(): LiveScope {
  return {
    move: { id: MOVE, clientId: CLIENT, name: "Claims Denial Prevention Intelligence",
      currentPhase: 3, createdAt: "2026-10-11T12:00:00.000Z",
      updatedAt: "2026-10-11T18:00:00.000Z", deletedAt: null },
    clientTenantKey: "meridian-health", clientSlug: "meridian",
    person: { id: PERSON, email: "e2e-operator@abarva.ai",
      graphNodeId: `clerk:${CLERK}`, primaryRole: "client_viewer" },
    memberships: [{ clientId: CLIENT, accessLevel: "program_member", canAdminUsers: false }],
    participants: [{ userId: PERSON, accessLevel: "program_member", canApproveGates: true }],
    originationActorIds: [PERSON], identityApprovalRefs: [APPROVAL_REF],
    registerRows: [], creationEvents: [],
  };
}

function args(mode: JobArgs["mode"]): JobArgs {
  return { mode, moveId: MOVE, operatorClerkId: CLERK, operatorPersonId: PERSON,
    approvalRef: APPROVAL_REF, sourceHash: sourceSetSha256(),
    binding: null, idempotencyKey: null,
    confirmation: mode === "apply" ? APPLY_CONFIRMATION : null,
    runId: "denials-test-run-001", buildVersion: "a".repeat(40),
    imageDigest: `sha256:${"b".repeat(64)}` };
}

function manifests(approved: boolean): unknown[] {
  const manifest = loadManifests().find((item) =>
    (item as { dataset_id?: string }).dataset_id === SEED_DATASET_ID) as Record<string, unknown>;
  return [{ ...manifest, load_approval: approved ? {
    approved_by: "Anand Sundaram", approved_at: "2026-10-11",
    assessment_id: MOVE, source_set_hash: sourceSetSha256(),
    release_record: RELEASE_RECORD, move_id: MOVE,
  } : null }];
}

function deps(scope: LiveScope, approved = false): JobDeps & { createCount: () => number } {
  let count = 0;
  return {
    manifests: manifests(approved),
    readLive: async () => scope,
    withTransaction: async (_moveId, work) => {
      const beforeRows = [...scope.registerRows];
      const beforeEvents = [...scope.creationEvents];
      try { return await work(); }
      catch (error) {
        scope.registerRows = beforeRows;
        scope.creationEvents = beforeEvents;
        throw error;
      }
    },
    create: async (_ctx, _moveId, input, actor, options) => {
      count += 1;
      const record = {
        id: `00000000-0000-4000-8000-${String(count).padStart(12, "0")}`,
        area: input.area, registerId: options.expectedRegisterId,
        statement: input.statement, workingValue: input.workingValue,
        unit: input.unit, source: input.source, status: "proposed",
        origin: input.origin, createdByUserId: actor.userId, revision: 1,
      } as AssumptionRecord;
      scope.registerRows.push(record);
      scope.creationEvents.push({ assumptionId: record.id, actorUserId: actor.userId,
        actorKind: actor.kind, eventType: "created" });
      return { ok: true, record };
    },
    createCount: () => count,
  };
}

it("preflights the fresh operator Move and plans 22 unchanged proposed values", async () => {
  const scope = liveScope();
  const work = deps(scope);
  const preview = await runDenialsSeedJob(args("preflight"), work, OBSERVED);
  expect(preview.committed).toBe(false);
  expect(preview.actualWrites).toBe(0);
  expect(preview.loadApproval).toBe("absent");
  expect(preview.rows).toHaveLength(22);
  expect(preview.rows[0].registerId).toBe("DL1");
  expect(preview.rows[9].registerId).toBe("V1");
  expect(preview.rows.map((row) => row.value)).toEqual(readExactProposal().rows.map((row) => row.value));
  expect(work.createCount()).toBe(0);

  const dry = { ...args("dry_run"), binding: preview.binding,
    idempotencyKey: preview.idempotencyKey };
  const result = await runDenialsSeedJob(dry, work);
  expect(result.qualityGate).toBe("dry_run_only");
  expect(work.createCount()).toBe(0);
  await expect(runDenialsSeedJob({ ...dry, mode: "apply", confirmation: APPLY_CONFIRMATION }, work))
    .rejects.toThrow("exact_named_load_approval_required");
  expect(work.createCount()).toBe(0);
  const invalid = deps(scope);
  invalid.manifests = [{ ...(invalid.manifests[0] as Record<string, unknown>),
    expected_object_count: 21 }];
  await expect(runDenialsSeedJob(args("preflight"), invalid, OBSERVED))
    .rejects.toThrow("denials_manifest_contract_invalid");
});

it("refuses a stale revision, another tenant, or the old protected Move", async () => {
  const scope = liveScope();
  const binding = makePreflightBinding(scope, args("preflight"), OBSERVED);
  expect(denialsJobIdempotencyKey({ ...binding,
    moveUpdatedAt: "2026-10-11T18:01:00.000Z" })).not.toBe(denialsJobIdempotencyKey(binding));
  const run = { ...args("dry_run"), binding,
    idempotencyKey: (await runDenialsSeedJob(args("preflight"), deps(scope), OBSERVED)).idempotencyKey };
  scope.move!.updatedAt = "2026-10-11T18:01:00.000Z";
  expect(() => assertExactLiveBinding(scope, run, binding)).toThrow("denials_live_binding_drift");
  scope.move!.updatedAt = binding.moveUpdatedAt;
  scope.clientTenantKey = "skyharbor-air";
  await expect(runDenialsSeedJob(run, deps(scope))).rejects.toThrow("fresh_p3_move_scope_invalid");
  scope.clientTenantKey = "meridian-health";
  scope.clientSlug = "skyharbor";
  await expect(runDenialsSeedJob(run, deps(scope))).rejects.toThrow("fresh_p3_move_scope_invalid");
  scope.clientSlug = "meridian";
  scope.person!.graphNodeId = "clerk:user_other";
  await expect(runDenialsSeedJob(run, deps(scope))).rejects.toThrow("denials_operator_scope_invalid");
  scope.person!.graphNodeId = `clerk:${CLERK}`;
  scope.person!.email = "other@example.test";
  await expect(runDenialsSeedJob(run, deps(scope))).rejects.toThrow("denials_operator_scope_invalid");
  scope.person!.email = "e2e-operator@abarva.ai";
  await expect(runDenialsSeedJob({ ...run, sourceHash: "0".repeat(64) }, deps(scope)))
    .rejects.toThrow("denials_source_set_hash_mismatch");
  scope.move!.id = OLD_PROTECTED_MOVE_ID;
  await expect(runDenialsSeedJob({ ...run, moveId: OLD_PROTECTED_MOVE_ID }, deps(scope)))
    .rejects.toThrow("fresh_p3_move_scope_invalid");
});

it("applies once under the dedicated person with proposed status and actor events", async () => {
  const scope = liveScope();
  const work = deps(scope, true);
  const preflight = await runDenialsSeedJob(args("preflight"), work, OBSERVED);
  const apply = { ...args("apply"), binding: preflight.binding,
    idempotencyKey: preflight.idempotencyKey };
  const result = await runDenialsSeedJob(apply, work);
  expect(result.committed).toBe(true);
  expect(result.actualWrites).toBe(22);
  expect(result.postcommitReadback).toBe("passed");
  expect(scope.registerRows).toHaveLength(22);
  expect(scope.registerRows.every((row) => row.status === "proposed" &&
    row.createdByUserId === PERSON)).toBe(true);
  expect(scope.creationEvents).toHaveLength(22);
  expect(work.createCount()).toBe(22);
  await expect(runDenialsSeedJob(apply, work)).rejects.toThrow("denials_seed_row_already_present");
});

it("rolls back a mid-batch refusal and does not retry the write", async () => {
  const scope = liveScope();
  const work = deps(scope, true);
  const preflight = await runDenialsSeedJob(args("preflight"), work, OBSERVED);
  const create = work.create;
  let attempts = 0;
  work.create = async (...input) => {
    attempts += 1;
    if (attempts === 4) throw new Error("injected_create_failure");
    return create(...input);
  };
  await expect(runDenialsSeedJob({ ...args("apply"), binding: preflight.binding,
    idempotencyKey: preflight.idempotencyKey }, work))
    .rejects.toThrow("injected_create_failure");
  expect(attempts).toBe(4);
  expect(scope.registerRows).toHaveLength(0);
  expect(scope.creationEvents).toHaveLength(0);
});

it("requires the private Azure job's zero-retry and digest-pinned envelope", () => {
  const env = {
    MOVES_DENIALS_SEED_MODE: "preflight",
    MOVES_DENIALS_SEED_MOVE_ID: MOVE,
    MOVES_DENIALS_SEED_OPERATOR_PERSON_ID: PERSON,
    MOVES_DENIALS_SEED_OPERATOR_CLERK_ID: CLERK,
    MOVES_DENIALS_SEED_TENANT_KEY: "meridian-health",
    MOVES_DENIALS_SEED_APPROVAL_REFERENCE: APPROVAL_REF,
    MOVES_DENIALS_SEED_SOURCE_SET_SHA256: sourceSetSha256(),
    MOVES_DENIALS_SEED_BUILD_VERSION: "a".repeat(40),
    MOVES_DENIALS_SEED_IMAGE_DIGEST: `sha256:${"b".repeat(64)}`,
    MOVES_DENIALS_SEED_RUN_ID: "denials-test-run-001",
    MOVES_DENIALS_SEED_RETRY_COUNT: "0",
    MOVES_DENIALS_SEED_TIMEOUT_SECONDS: "3600",
    DATABASE_URL: "postgres://operator:placeholder@demo.postgres.database.azure.com:5432/db",
  };
  expect(parseArgs(env).mode).toBe("preflight");
  expect(() => parseArgs({ ...env, MOVES_DENIALS_SEED_RETRY_COUNT: "1" }))
    .toThrow("denials_seed_scope_or_retry_policy_invalid");
  expect(() => parseArgs({ ...env,
    DATABASE_URL: "postgres://operator:placeholder@other.example.com:5432/db" }))
    .toThrow("denials_seed_non_azure_database_refused");
  expect(() => parseArgs({ ...env, MOVES_DENIALS_SEED_IMAGE_DIGEST: "mutable-tag" }))
    .toThrow("denials_seed_job_identity_or_version_invalid");
});
