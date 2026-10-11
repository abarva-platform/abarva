import { createHash } from "node:crypto";
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { resolveLoadApproval } from "../../../src/lib/governance/dataset-manifest";
import type { AssumptionRecord, NewAssumptionInput } from "../../../src/lib/programs/assumption-register/model";
import type { RegisterActor, RegisterWriteResult } from "../../../src/lib/programs/assumption-register/store";
import type { TenancyCtx } from "../../../src/lib/programs/types.db";
import { isDeclaredSyntheticDemoTenant, type TenantInputDeclarations } from "../../../src/lib/tenant/declared-synthetic-tenant";
import { canonicalTenantKey } from "../../../src/lib/tenant-keys";
import {
  denialsSeedIdempotencyKey, readExactProposal, REGISTER_KEYS, SEED_DATASET_ID,
  sourceSetSha256, validateDenialsSeedBinding, type DenialsSeedBinding,
  type ProposedRegisterRow,
} from "./seed-contract";

export const JOB_NAME = "job-abarva-private-operator-eus";
export const RELEASE_RECORD = "docs/releases/records/2026-10-11-moves-denials-register-operator-job.md";
export const APPLY_CONFIRMATION = "APPLY_FRESH_DENIALS_REGISTER_SEED";
export const PROOF_PREFIX = "moves-denials-register-seed/runs";
export const OLD_PROTECTED_MOVE_ID = "1557f032-5a5c-4475-abe5-b1a841576649";
const TENANT_REGISTRY_PATH = "datasets/tenant-inputs/tenant-input-registry.json";
const MANIFEST_DIR = "docs/governance/dataset-manifests";
const MINIMUM_NEW_MOVE_DATE = "2026-10-11T00:00:00.000Z";
const EXPECTED_MOVE_NAME = "Claims Denial Prevention Intelligence";

export interface RegisterRevision {
  id: string;
  area: string;
  registerId: string;
  revision: number;
  status: string;
}

/** The read-only operator preflight emits this exact snapshot for dry-run/apply. */
export interface DenialsJobBinding extends DenialsSeedBinding {
  moveUpdatedAt: string;
  registerSnapshot: RegisterRevision[];
}

export interface LiveScope {
  move: {
    id: string; clientId: string; name: string; currentPhase: number;
    createdAt: string; updatedAt: string; deletedAt: string | null;
  } | null;
  clientTenantKey: string | null;
  clientSlug: string | null;
  person: { id: string; graphNodeId: string | null; primaryRole: string | null } | null;
  memberships: Array<{ clientId: string; accessLevel: string; canAdminUsers: boolean }>;
  participants: Array<{ userId: string; accessLevel: string; canApproveGates: boolean }>;
  originationActorIds: string[];
  identityApprovalRefs: string[];
  registerRows: AssumptionRecord[];
  creationEvents: Array<{ assumptionId: string; actorUserId: string; actorKind: string; eventType: string }>;
}

export interface JobArgs {
  mode: "preflight" | "dry_run" | "apply";
  moveId: string;
  operatorClerkId: string;
  operatorPersonId: string;
  approvalRef: string;
  sourceHash: string;
  idempotencyKey: string | null;
  binding: DenialsJobBinding | null;
  confirmation: string | null;
  runId: string;
  buildVersion: string;
  imageDigest: string;
}

export interface JobDeps {
  readLive(moveId: string, operatorPersonId: string): Promise<LiveScope>;
  create(ctx: TenancyCtx, moveId: string, input: NewAssumptionInput,
    actor: RegisterActor, options: { expectedRegisterId: string }): Promise<RegisterWriteResult>;
  withTransaction<T>(moveId: string, work: () => Promise<T>): Promise<T>;
  manifests: unknown[];
}

export interface JobProof {
  event: "moves_denials_register_seed_proof";
  mode: JobArgs["mode"];
  jobName: typeof JOB_NAME;
  runId: string;
  buildVersion: string;
  imageDigest: string;
  moveId: string;
  operatorClerkId: string;
  operatorPersonId: string;
  sourceSetHash: string;
  idempotencyKey: string;
  releaseRecord: typeof RELEASE_RECORD;
  loadApproval: "present" | "absent";
  rows: Array<{ key: string; registerId: string; value: number; unit: string;
    sourceFile: string; sourceBasis: string; ownerRole: string; confidence: 1 | 3 | 5;
    status: "proposed" }>;
  binding: DenialsJobBinding;
  plannedWrites: number;
  actualWrites: number;
  committed: boolean;
  qualityGate: "preflight_only" | "dry_run_only" | "passed";
  postcommitReadback: "not_run" | "passed";
  blobProofLocation?: string;
}

const STATEMENTS: Record<(typeof REGISTER_KEYS)[number], string> = {
  unit_source: "Source integration hours per source component",
  unit_table: "Table implementation hours per table component",
  unit_entity: "Canonical entity modeling hours per entity component",
  unit_view: "Read model view implementation hours per view component",
  unit_design: "Design review hours per delivery component",
  unit_validation: "Validation hours per delivery component",
  friction: "Delivery friction multiplier",
  productive_share: "Productive share of delivery time",
  weekly_hours: "Hours per delivery FTE-week",
  writeoff_baseline: "Trailing annual denials writeoff baseline",
  prevented_share: "Share of denials writeoffs prevented",
  zero: "Zero baseline for incremental benefit",
  margin: "Contribution margin share for value case",
  attribution: "Attribution share for denials benefit",
  probability: "Probability of denials benefit realization",
  rework_hours: "Baseline rework hours per denial",
  rework_target: "Target rework hours per denial",
  denial_volume: "Trailing annual denial volume",
  days_ar: "Baseline days in accounts receivable",
  days_ar_target: "Target days in accounts receivable",
  discount: "Annual discount rate for value case",
  budget_ceiling: "Investment budget ceiling",
};

export function registerRevision(row: AssumptionRecord): RegisterRevision {
  return { id: row.id, area: row.area, registerId: row.registerId,
    revision: row.revision, status: row.status };
}

export function denialsJobIdempotencyKey(binding: DenialsJobBinding): string {
  validateDenialsSeedBinding(binding);
  if (!Array.isArray(binding.registerSnapshot) ||
    !Number.isFinite(Date.parse(binding.moveUpdatedAt)))
    throw new Error("denials_job_snapshot_invalid");
  const framed = JSON.stringify({ base: denialsSeedIdempotencyKey(binding),
    moveUpdatedAt: binding.moveUpdatedAt,
    registerSnapshot: sortRevisions(binding.registerSnapshot) });
  return `moves-denials-register-seed-v1:${createHash("sha256").update(framed).digest("hex")}`;
}

function sortRevisions(rows: readonly RegisterRevision[]): RegisterRevision[] {
  return [...rows].sort((a, b) => a.registerId.localeCompare(b.registerId));
}

/** Checked from the committed tenant registry, never from a folder label. */
export function assertDeclaredSyntheticTenant(): void {
  const registry = JSON.parse(readFileSync(TENANT_REGISTRY_PATH, "utf8")) as TenantInputDeclarations;
  if (!isDeclaredSyntheticDemoTenant("meridian-health", registry))
    throw new Error("denials_tenant_not_declared_synthetic_demo");
}

export function loadManifests(): unknown[] {
  return readdirSync(MANIFEST_DIR).filter((file) => file.endsWith(".json"))
    .map((file) => JSON.parse(readFileSync(path.join(MANIFEST_DIR, file), "utf8")));
}

export function assertFreshMoveScope(live: LiveScope, args: Pick<JobArgs,
  "moveId" | "operatorClerkId" | "operatorPersonId" | "approvalRef">): asserts live is LiveScope & { move: NonNullable<LiveScope["move"]> } {
  const move = live.move;
  const declaredTenantKeys = [live.clientTenantKey, live.clientSlug]
    .filter((value): value is string => Boolean(value));
  if (!move || move.id !== args.moveId || move.id === OLD_PROTECTED_MOVE_ID ||
    move.name !== EXPECTED_MOVE_NAME || move.deletedAt !== null ||
    !Number.isFinite(Date.parse(move.createdAt)) ||
    Date.parse(move.createdAt) < Date.parse(MINIMUM_NEW_MOVE_DATE) ||
    move.currentPhase !== 3 ||
    declaredTenantKeys.length === 0 ||
    declaredTenantKeys.some((key) => canonicalTenantKey(key) !== "meridian-health"))
    throw new Error("denials_fresh_p3_move_scope_invalid");
  if (!live.person || live.person.id !== args.operatorPersonId ||
    live.person.graphNodeId !== `clerk:${args.operatorClerkId}` ||
    live.person.primaryRole !== "client_viewer" ||
    live.memberships.length !== 1 || live.memberships[0].clientId !== move.clientId ||
    live.memberships[0].accessLevel !== "program_member" ||
    live.memberships[0].canAdminUsers !== false ||
    live.participants.length !== 1 ||
    live.participants[0].userId !== args.operatorPersonId ||
    live.participants[0].accessLevel !== "program_member" ||
    live.participants[0].canApproveGates !== true ||
    live.originationActorIds.length !== 1 ||
    live.originationActorIds[0] !== args.operatorPersonId ||
    live.identityApprovalRefs.length < 1 ||
    live.identityApprovalRefs.some((ref) => ref !== args.approvalRef))
    throw new Error("denials_operator_scope_invalid");
}

export function makePreflightBinding(live: LiveScope, args: Pick<JobArgs,
  "moveId" | "operatorClerkId" | "operatorPersonId" | "approvalRef">,
observedAtUtc: string): DenialsJobBinding {
  assertFreshMoveScope(live, args);
  const rows = live.registerRows.map(registerRevision);
  const occupiedRegisterIds = rows.map((row) => row.registerId);
  const next = (prefix: "DL" | "V") => Math.max(0, ...occupiedRegisterIds
    .filter((id) => id.startsWith(prefix))
    .map((id) => Number(id.slice(prefix.length))).filter(Number.isSafeInteger));
  const dl = next("DL");
  const v = next("V");
  const registerIds = Object.fromEntries(REGISTER_KEYS.map((key, index) => [
    key, index < 9 ? `DL${dl + index + 1}` : `V${v + index - 8}`,
  ])) as Record<string, string>;
  const binding: DenialsJobBinding = {
    moveId: live.move.id, clientId: live.move.clientId,
    appClientKey: "meridian", canonicalTenantKey: "meridian-health",
    operatorClerkId: args.operatorClerkId, operatorPersonId: args.operatorPersonId,
    approvalRef: args.approvalRef, observedAtUtc, currentPhase: live.move.currentPhase,
    moveUpdatedAt: live.move.updatedAt, occupiedRegisterIds, registerIds,
    registerSnapshot: sortRevisions(rows), sourceSetSha256: sourceSetSha256(),
  };
  validateDenialsSeedBinding(binding);
  return binding;
}

export function assertExactLiveBinding(live: LiveScope, args: JobArgs,
  binding: DenialsJobBinding): void {
  assertFreshMoveScope(live, args);
  validateDenialsSeedBinding(binding);
  if (binding.moveId !== args.moveId || binding.clientId !== live.move!.clientId ||
    binding.operatorClerkId !== args.operatorClerkId ||
    binding.operatorPersonId !== args.operatorPersonId ||
    binding.approvalRef !== args.approvalRef ||
    binding.currentPhase !== live.move!.currentPhase ||
    binding.moveUpdatedAt !== live.move!.updatedAt ||
    !Number.isFinite(Date.parse(binding.moveUpdatedAt)) ||
    Date.parse(binding.observedAtUtc) > Date.now() + 60_000 ||
    JSON.stringify(sortRevisions(binding.registerSnapshot)) !==
      JSON.stringify(sortRevisions(live.registerRows.map(registerRevision))) ||
    JSON.stringify([...binding.occupiedRegisterIds].sort()) !==
      JSON.stringify(live.registerRows.map((row) => row.registerId).sort()) ||
    args.sourceHash !== binding.sourceSetSha256 ||
    args.idempotencyKey !== denialsJobIdempotencyKey(binding))
    throw new Error("denials_live_binding_drift");
}

export function rowInput(row: ProposedRegisterRow, sourceHash: string): NewAssumptionInput {
  const key = row.key as (typeof REGISTER_KEYS)[number];
  if (!(key in STATEMENTS)) throw new Error(`denials_unknown_register_key:${row.key}`);
  return {
    area: row.category, statement: STATEMENTS[key],
    whyItMatters: `Synthetic planning input, not client-attested. ${row.sourceBasis}`,
    workingFigure: String(row.value), workingValue: row.value, unit: row.unit,
    source: `datasets/tenant-inputs/meridian-health/moves/denials-pack-v1/${row.sourceFile} | source-set:${sourceHash}`,
    confidence: row.confidence, ownerRole: row.ownerRole,
    origin: "evidence_extraction", raisedPhase: 3,
  };
}

function assertNoPriorProposalRows(live: LiveScope, proposal: readonly ProposedRegisterRow[]): void {
  for (const row of proposal) {
    const statement = STATEMENTS[row.key as (typeof REGISTER_KEYS)[number]];
    if (live.registerRows.some((item) => item.area === row.category &&
      item.statement.trim().toLowerCase() === statement.toLowerCase()))
      throw new Error(`denials_seed_row_already_present:${row.key}`);
  }
}

function assertCreatedRows(live: LiveScope, binding: DenialsJobBinding,
  proposal: readonly ProposedRegisterRow[]): void {
  if (live.registerRows.length !== binding.registerSnapshot.length + proposal.length)
    throw new Error("denials_readback_row_count_invalid");
  for (const baseline of binding.registerSnapshot) {
    const actual = live.registerRows.find((row) => row.id === baseline.id);
    if (!actual || JSON.stringify(registerRevision(actual)) !== JSON.stringify(baseline))
      throw new Error(`denials_baseline_revision_drift:${baseline.registerId}`);
  }
  for (const row of proposal) {
    const stored = live.registerRows.filter((item) => item.registerId === binding.registerIds[row.key]);
    if (stored.length !== 1 || stored[0].area !== row.category ||
      stored[0].statement !== STATEMENTS[row.key as (typeof REGISTER_KEYS)[number]] ||
      stored[0].workingValue !== row.value || stored[0].unit !== row.unit ||
      stored[0].status !== "proposed" || stored[0].origin !== "evidence_extraction" ||
      stored[0].createdByUserId !== binding.operatorPersonId ||
      !stored[0].source.includes(binding.sourceSetSha256))
      throw new Error(`denials_readback_row_invalid:${row.key}`);
    const events = live.creationEvents.filter((event) => event.assumptionId === stored[0].id &&
      event.eventType === "created" && event.actorKind === "person" &&
      event.actorUserId === binding.operatorPersonId);
    if (events.length !== 1) throw new Error(`denials_event_readback_invalid:${row.key}`);
  }
}

export async function runDenialsSeedJob(args: JobArgs, deps: JobDeps,
  observedAtUtc = new Date().toISOString()): Promise<JobProof> {
  assertDeclaredSyntheticTenant();
  const proposal = readExactProposal().rows;
  const sourceHash = sourceSetSha256();
  if (args.sourceHash !== sourceHash) throw new Error("denials_source_set_hash_mismatch");
  const live = await deps.readLive(args.moveId, args.operatorPersonId);
  assertFreshMoveScope(live, args);
  assertNoPriorProposalRows(live, proposal);
  const binding = args.mode === "preflight"
    ? makePreflightBinding(live, args, observedAtUtc)
    : args.binding;
  if (!binding) throw new Error("denials_bound_preflight_required");
  if (args.mode !== "preflight") assertExactLiveBinding(live, args, binding);
  const idempotencyKey = denialsJobIdempotencyKey(binding);
  const decision = resolveLoadApproval(deps.manifests, {
    dataset_id: SEED_DATASET_ID, tenant_key: "meridian", assessment_id: args.moveId,
    source_set_hash: sourceHash, object_count: proposal.length,
    ingestion_method: "operator_aca_job", move_id: args.moveId,
  });
  if (!decision.approved && (decision.reasons.length !== 1 ||
    decision.reasons[0] !== "manifest carries no load_approval"))
    throw new Error(`denials_manifest_contract_invalid:${decision.reasons.join("|")}`);
  const proof: JobProof = {
    event: "moves_denials_register_seed_proof", mode: args.mode, jobName: JOB_NAME,
    runId: args.runId, buildVersion: args.buildVersion, imageDigest: args.imageDigest,
    moveId: args.moveId, operatorClerkId: args.operatorClerkId,
    operatorPersonId: args.operatorPersonId, sourceSetHash: sourceHash,
    idempotencyKey, releaseRecord: RELEASE_RECORD,
    loadApproval: decision.approved ? "present" : "absent",
    rows: proposal.map((row) => ({ key: row.key, registerId: binding.registerIds[row.key],
      value: row.value, unit: row.unit, sourceFile: row.sourceFile,
      sourceBasis: row.sourceBasis, ownerRole: row.ownerRole,
      confidence: row.confidence, status: "proposed" })),
    binding, plannedWrites: proposal.length, actualWrites: 0,
    committed: false, qualityGate: args.mode === "preflight" ? "preflight_only" : "dry_run_only",
    postcommitReadback: "not_run",
  };
  if (args.mode !== "apply") return proof;
  if (!decision.approved || decision.approval.release_record !== RELEASE_RECORD ||
    decision.approval.approved_by !== "Anand Sundaram" ||
    args.confirmation !== APPLY_CONFIRMATION)
    throw new Error("denials_apply_refused_exact_named_load_approval_required");

  const actor: RegisterActor = { kind: "person", userId: binding.operatorPersonId };
  const ctx: TenancyCtx = { clientId: binding.clientId, clientKey: binding.appClientKey,
    userId: binding.operatorPersonId };
  await deps.withTransaction(args.moveId, async () => {
    const locked = await deps.readLive(args.moveId, args.operatorPersonId);
    assertExactLiveBinding(locked, args, binding);
    assertNoPriorProposalRows(locked, proposal);
    for (const row of proposal) {
      const created = await deps.create(ctx, args.moveId, rowInput(row, sourceHash), actor,
        { expectedRegisterId: binding.registerIds[row.key] });
      if (!created.ok) throw new Error(`denials_register_create_refused:${row.key}:${created.refusal.code}`);
      if (created.record.registerId !== binding.registerIds[row.key] ||
        created.record.status !== "proposed")
        throw new Error(`denials_register_allocation_drift:${row.key}`);
    }
    assertCreatedRows(await deps.readLive(args.moveId, args.operatorPersonId), binding, proposal);
  });
  // A fresh connection verifies committed rows and the append-only actor events.
  assertCreatedRows(await deps.readLive(args.moveId, args.operatorPersonId), binding, proposal);
  proof.actualWrites = proposal.length;
  proof.committed = true;
  proof.postcommitReadback = "passed";
  proof.qualityGate = "passed";
  return proof;
}
