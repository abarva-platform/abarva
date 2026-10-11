import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { getAzureWriteFluentClient, withAzureWriteTransaction,
  writeTransactionOutcome } from "../../lib/data-plane/postgresCompat";
import { createAssumption, listAssumptions } from "../../lib/programs/assumption-register/store";
import { sourceSetSha256 } from "../../../scripts/moves/denials-pack/seed-contract";
import * as seedJob from "../../../scripts/moves/denials-pack/seed-job";
import { blobProofStore } from "../../../scripts/ecl/synthetic_enterprise_home_job";
import { main, makeDeps, parseArgs, readLiveScope, writeProofBundle } from
  "../../../scripts/moves/denials-pack/seed-job-runner";

jest.mock("../../lib/data-plane/postgresCompat", () => ({
  getAzureWriteFluentClient: jest.fn(),
  withAzureWriteTransaction: jest.fn(),
  writeTransactionOutcome: jest.fn(() => "rolled_back"),
}));
jest.mock("../../lib/programs/assumption-register/store", () => ({
  listAssumptions: jest.fn(),
  createAssumption: jest.fn(),
}));
jest.mock("../../../scripts/ecl/synthetic_enterprise_home_job", () => ({
  blobProofStore: jest.fn(),
}));
jest.mock("../../../scripts/moves/denials-pack/seed-job", () => {
  const actual = jest.requireActual("../../../scripts/moves/denials-pack/seed-job");
  return { ...actual, runDenialsSeedJob: jest.fn(actual.runDenialsSeedJob) };
});

const MOVE = "00000000-0000-4000-8000-000000000101";
const CLIENT = "00000000-0000-4000-8000-000000000102";
const PERSON = "00000000-0000-4000-8000-000000000103";
const CLERK = "user_dedicated_operator";
const APPROVAL_REF = "private-approved-scope";
const originalEnv = { ...process.env };
let outputRoot: string;

function liveTables() {
  return {
    engagements: [{ id: MOVE, client_id: CLIENT, name: "Claims Denial Prevention Intelligence",
      current_phase: 3, created_at: "2026-10-11T12:00:00.000Z",
      updated_at: "2026-10-11T18:00:00.000Z", deleted_at: null }],
    clients: [{ id: CLIENT, tenant_key: "meridian-health", slug: "meridian" }],
    persons: [{ id: PERSON, email: "e2e-operator@abarva.ai",
      graph_node_id: `clerk:${CLERK}`, primary_role: "client_viewer" }],
    person_client_memberships: [{ person_id: PERSON, client_id: CLIENT,
      access_level: "program_member", can_admin_users: false }],
    engagement_participants: [{ engagement_id: MOVE, user_id: PERSON,
      program_access_level: "program_member", can_approve_phase_gates: true }],
    module_state_log: [{ engagement_id: MOVE, changed_by_user_id: PERSON,
      module_key: "origination", new_state: "completed" }],
    admin_audit_log: [{ target_id: PERSON, client_id: CLIENT,
      action: "synthetic_e2e_operator.identity_bound", metadata: { approvalRef: APPROVAL_REF } }],
    move_assumption_events: [{ program_id: MOVE,
      assumption_id: "00000000-0000-4000-8000-000000000104",
      actor_user_id: PERSON, actor_kind: "person", event_type: "created" }],
  };
}

function installReadback(tables = liveTables()) {
  jest.mocked(getAzureWriteFluentClient).mockReturnValue({
    from(table: string) {
      return {
        select() {
          return {
            eq(column: string, value: string) {
              const rows = (tables[table as keyof typeof tables] as Array<Record<string, unknown>>)
                .filter((row) => row[column] === value);
              return {
                maybeSingle: async () => ({ data: rows[0] ?? null, error: null }),
                then: (resolve: (value: unknown) => unknown) =>
                  Promise.resolve({ data: rows, error: null }).then(resolve),
              };
            },
          };
        },
      };
    },
  } as never);
  jest.mocked(listAssumptions).mockResolvedValue([]);
}

function env(runId: string) {
  return {
    MOVES_DENIALS_SEED_MODE: "preflight",
    MOVES_DENIALS_SEED_MOVE_ID: MOVE,
    MOVES_DENIALS_SEED_OPERATOR_PERSON_ID: PERSON,
    MOVES_DENIALS_SEED_OPERATOR_CLERK_ID: CLERK,
    MOVES_DENIALS_SEED_TENANT_KEY: "meridian-health",
    MOVES_DENIALS_SEED_APPROVAL_REFERENCE: APPROVAL_REF,
    MOVES_DENIALS_SEED_SOURCE_SET_SHA256: sourceSetSha256(),
    MOVES_DENIALS_SEED_BUILD_VERSION: "a".repeat(40),
    MOVES_DENIALS_SEED_IMAGE_DIGEST: `sha256:${"b".repeat(64)}`,
    MOVES_DENIALS_SEED_RUN_ID: runId,
    MOVES_DENIALS_SEED_RETRY_COUNT: "0",
    MOVES_DENIALS_SEED_TIMEOUT_SECONDS: "3600",
    MOVES_DENIALS_SEED_OUT_PARENT: outputRoot,
    DATABASE_URL: "postgres://operator:placeholder@demo.postgres.database.azure.com:5432/db",
  };
}

beforeEach(() => {
  outputRoot = mkdtempSync(path.join(os.tmpdir(), "denials-runner-test-"));
  jest.clearAllMocks();
  jest.mocked(seedJob.runDenialsSeedJob).mockImplementation(
    jest.requireActual("../../../scripts/moves/denials-pack/seed-job").runDenialsSeedJob);
  installReadback();
});

afterEach(() => {
  process.env = { ...originalEnv };
  process.exitCode = 0;
  jest.restoreAllMocks();
  rmSync(outputRoot, { recursive: true, force: true });
});

it("reads the exact Move, identity, participant and register scope before any write", async () => {
  const scope = await readLiveScope(MOVE, PERSON);
  expect(scope.move).toMatchObject({ id: MOVE, clientId: CLIENT, currentPhase: 3 });
  expect(scope.clientTenantKey).toBe("meridian-health");
  expect(scope.person).toMatchObject({ id: PERSON, graphNodeId: `clerk:${CLERK}` });
  expect(scope.memberships).toEqual([{ clientId: CLIENT, accessLevel: "program_member",
    canAdminUsers: false }]);
  expect(scope.participants).toEqual([{ userId: PERSON, accessLevel: "program_member",
    canApproveGates: true }]);
  expect(scope.originationActorIds).toEqual([PERSON]);
  expect(scope.identityApprovalRefs).toEqual([APPROVAL_REF]);
  expect(scope.registerRows).toEqual([]);
  expect(scope.creationEvents).toEqual([{ assumptionId: "00000000-0000-4000-8000-000000000104",
    actorUserId: PERSON, actorKind: "person", eventType: "created" }]);
  expect(listAssumptions).toHaveBeenCalledWith({ clientId: CLIENT, clientKey: "meridian",
    userId: PERSON }, MOVE);
  expect(createAssumption).not.toHaveBeenCalled();
});

it("locks the scoped Move and dependent rows in one transaction before applying work", async () => {
  const queries: Array<[string, unknown[]]> = [];
  jest.mocked(withAzureWriteTransaction).mockImplementation(async (_url, work) =>
    work((async (sql: string, params: unknown[]) => {
      queries.push([sql, params]);
      return { rowCount: sql.includes("FROM engagements") ? 1 : 0, rows: [] };
    }) as never));
  const deps = makeDeps(parseArgs(env("denials-runner-lock-001")));
  const result = await deps.withTransaction!(MOVE, async () => "work-complete");
  expect(result).toBe("work-complete");
  expect(queries).toEqual([
    ["SELECT id FROM engagements WHERE id = $1 FOR UPDATE", [MOVE]],
    ["SELECT id FROM move_assumptions WHERE program_id = $1 FOR UPDATE", [MOVE]],
    ["SELECT id FROM engagement_participants WHERE engagement_id = $1 FOR UPDATE", [MOVE]],
  ]);
  expect(createAssumption).not.toHaveBeenCalled();
  jest.mocked(createAssumption).mockResolvedValue({ ok: true, record: null } as never);
  await deps.create!({ clientId: CLIENT, clientKey: "meridian", userId: PERSON }, MOVE,
    { area: "delivery" } as never, { kind: "person", userId: PERSON } as never,
    { expectedRegisterId: "DL1" } as never);
  expect(createAssumption).toHaveBeenCalledTimes(1);
  jest.mocked(withAzureWriteTransaction).mockImplementation(async (_url, work) =>
    work((async () => ({ rowCount: 0, rows: [] })) as never));
  await expect(deps.withTransaction!(MOVE, async () => "must-not-run"))
    .rejects.toThrow("denials_move_lock_missing");
});

it("writes a verifiable local proof bundle for read-only preflight", async () => {
  const proof = { mode: "preflight", runId: "denials-runner-proof-001", moveId: MOVE,
    sourceSetHash: sourceSetSha256(), qualityGate: "preflight_only", committed: false };
  const outDir = path.join(outputRoot, "proof");
  const log = jest.spyOn(console, "log").mockImplementation(() => {});
  writeProofBundle(outDir, proof, "succeeded", "2026-10-11T18:00:00.000Z", 3600);
  const manifest = JSON.parse(readFileSync(path.join(outDir, "proof-manifest.json"), "utf8"));
  const gate = JSON.parse(readFileSync(path.join(outDir, "quality-gate.json"), "utf8"));
  expect(manifest).toMatchObject({ status: "succeeded", retryCount: 0,
    sourceSetHash: proof.sourceSetHash, committed: false });
  expect(gate).toMatchObject({ passed: true, mode: "preflight", applyBlocked: true });
  expect(log.mock.calls.map(([line]) => line)).toContain("__SEMANTIC2_PROOF_TGZ_BEGIN__");
  expect(log.mock.calls.map(([line]) => line)).toContain("__SEMANTIC2_PROOF_TGZ_END__");
  writeProofBundle(path.join(outputRoot, "dry"), { ...proof, mode: "dry_run",
    qualityGate: "dry_run_only" }, "succeeded", "2026-10-11T18:00:00.000Z", 3600);
  expect(JSON.parse(readFileSync(path.join(outputRoot, "dry", "quality-gate.json"), "utf8")))
    .toMatchObject({ passed: true, applyBlocked: true });
});

it("emits a successful read-only preflight and an explicit failure proof", async () => {
  const log = jest.spyOn(console, "log").mockImplementation(() => {});
  Object.assign(process.env, env("denials-runner-main-001"));
  await main();
  const successDir = path.join(outputRoot, "moves-denials-register-seed-denials-runner-main-001");
  const success = JSON.parse(readFileSync(path.join(successDir, "proof-manifest.json"), "utf8"));
  expect(success).toMatchObject({ status: "succeeded", mode: "preflight",
    actualWrites: 0, committed: false, qualityGate: "preflight_only" });
  expect(createAssumption).not.toHaveBeenCalled();

  const invalid = liveTables();
  invalid.clients[0].slug = "wrong-client";
  installReadback(invalid);
  Object.assign(process.env, env("denials-runner-main-002"));
  await main();
  const failureDir = path.join(outputRoot, "moves-denials-register-seed-denials-runner-main-002");
  const failed = JSON.parse(readFileSync(path.join(failureDir, "proof-manifest.json"), "utf8"));
  const gate = JSON.parse(readFileSync(path.join(failureDir, "quality-gate.json"), "utf8"));
  expect(failed).toMatchObject({ status: "failed", committed:
    "unknown; inspect live readback before any new run", qualityGate: "failed" });
  expect(gate).toMatchObject({ passed: false, applyBlocked: true });
  expect(writeTransactionOutcome).toHaveBeenCalled();
  expect(log.mock.calls.some(([line]) => String(line).includes("__MOVES_DENIALS_SEED_PROOF_SUMMARY__")))
    .toBe(true);
});

it("prints only the immutable source hash when invoked offline", async () => {
  const log = jest.spyOn(console, "log").mockImplementation(() => {});
  process.argv.push("--seed-hash");
  try { await main(); }
  finally { process.argv.pop(); }
  expect(JSON.parse(String(log.mock.calls[0][0]))).toMatchObject({ objectCount: 22,
    sourceSetSha256: sourceSetSha256(),
    applyCapability: "blocked_until_fresh_move_and_exact_named_load_approval" });
  expect(getAzureWriteFluentClient).not.toHaveBeenCalled();
});

it("writes an apply proof once and preserves committed state if the Blob proof collides", async () => {
  jest.spyOn(console, "log").mockImplementation(() => {});
  const proposedProof = { mode: "apply", runId: "denials-runner-apply-001", moveId: MOVE,
    sourceSetHash: sourceSetSha256(), qualityGate: "passed", committed: true,
    actualWrites: 22, postcommitReadback: "passed" };
  const run = jest.mocked(seedJob.runDenialsSeedJob).mockResolvedValue(proposedProof as never);
  const writeOnce = jest.fn().mockResolvedValueOnce({ created: true, uri: "private-blob-proof" })
    .mockResolvedValueOnce({ created: false, uri: "private-blob-proof" });
  jest.mocked(blobProofStore).mockResolvedValue({ writeOnce } as never);
  const applyEnv = { ...env("denials-runner-apply-001"),
    MOVES_DENIALS_SEED_MODE: "apply",
    MOVES_DENIALS_SEED_BINDING_JSON: "{}",
    MOVES_DENIALS_SEED_IDEMPOTENCY_KEY: "bound-idempotency",
    MOVES_DENIALS_SEED_CONFIRMATION: seedJob.APPLY_CONFIRMATION,
    AZURE_STORAGE_ACCOUNT_NAME: "privateproof",
    ECL_SYNTHETIC_STORAGE_IDENTITY_CLIENT_ID: "private-identity",
  };
  Object.assign(process.env, applyEnv);
  await main();
  const successDir = path.join(outputRoot, "moves-denials-register-seed-denials-runner-apply-001");
  const success = JSON.parse(readFileSync(path.join(successDir, "proof-manifest.json"), "utf8"));
  expect(success).toMatchObject({ status: "succeeded", committed: true,
    blobProofLocation: "private-blob-proof" });
  expect(JSON.parse(readFileSync(path.join(successDir, "quality-gate.json"), "utf8")))
    .toMatchObject({ passed: true, applyBlocked: false });
  expect(writeOnce).toHaveBeenCalledWith(expect.stringContaining("denials-runner-apply-001"),
    expect.any(Buffer));

  Object.assign(process.env, { ...applyEnv, MOVES_DENIALS_SEED_RUN_ID: "denials-runner-apply-002" });
  await main();
  const failureDir = path.join(outputRoot, "moves-denials-register-seed-denials-runner-apply-002");
  const failure = JSON.parse(readFileSync(path.join(failureDir, "proof-manifest.json"), "utf8"));
  expect(failure).toMatchObject({ status: "failed", committed: true,
    error: "denials_proof_blob_already_exists_no_retry" });
  expect(run).toHaveBeenCalledTimes(2);
  expect(writeOnce).toHaveBeenCalledTimes(2);
});
