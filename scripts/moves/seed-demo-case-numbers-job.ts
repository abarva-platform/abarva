#!/usr/bin/env tsx

/**
 * Governed proposal job for the synthetic demo Move. The shipped runtime has
 * a shared phase-capture domain writer. Apply still requires an exact named
 * load approval absent from this proposal. Dry-run may inspect the Move and
 * register through the private ACA operator job. Local preview is offline.
 */
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { resolveLoadApproval } from "../../src/lib/governance/dataset-manifest";
import { isDeclaredSyntheticDemoTenant, type TenantInputDeclarations } from "../../src/lib/tenant/declared-synthetic-tenant";
import { readValueModel } from "../../src/lib/programs/value-model-capture";
import { phaseCaptureModuleKey } from "../../src/lib/programs/phase-capture-contract";
import { readValuePlanCaptureRevision, writeGovernedValuePlan } from "../../src/lib/programs/phase-capture-writer";
import type { AssumptionRecord, NewAssumptionInput, TransitionRequest } from "../../src/lib/programs/assumption-register/model";
import type { RegisterActor, RegisterWriteResult } from "../../src/lib/programs/assumption-register/store";
import type { TenancyCtx } from "../../src/lib/programs/types.db";
import type { ProofStore } from "../ecl/synthetic_enterprise_home_job";
import {
  assertMoveDeclaration, authenticateDemoMove, confirmRequest, naturalKey,
  newAssumptionInput, operatorActor, planSeedWrites, resolveDemoTenant,
  type MoveRegistryRow, type PlannedWrite, type SeedRow,
} from "./seed-demo-assumption-register-job";
import { BENCHMARK_PATH, costPackTexts, previewCaseNumbers, SEED_PATH } from "./preview-demo-case-numbers";

export const DATASET_ID = "moves_demo_case_numbers_seed_v1";
export const RELEASE_RECORD = "docs/releases/records/2026-10-10-moves-demo-case-numbers-seed.md";
export const APPLY_CONFIRMATION = "APPLY_DEMO_CASE_NUMBERS_SEED";
export const PROOF_PREFIX = "moves-demo-case-numbers-seed/runs";
export const EXISTING_SEED_PATH = "datasets/tenant-inputs/meridian-health/moves/demo-assumption-register-seed.json";
export const REGISTRY_PATH = "datasets/tenant-inputs/tenant-input-registry.json";
const MANIFEST_DIR = "docs/governance/dataset-manifests";
const EXPECTED_MOVE = "1557f032-5a5c-4475-abe5-b1a841576649";
const sha = (value: string) => createHash("sha256").update(value).digest("hex");
const text = (file: string) => readFileSync(file, "utf8");

export function sourceSetHash(): string {
  return sha([text(SEED_PATH),text(BENCHMARK_PATH),text(EXISTING_SEED_PATH),...costPackTexts()].join("\n"));
}

export function idempotencyKey(sourceHash: string): string {
  return `moves-demo-case-numbers-seed-v1:${sha(`${EXPECTED_MOVE}|${sourceHash}`)}`;
}

interface CaseRow extends SeedRow { expected_register_id: string }
interface CaseSeed {
  dataset_id: string;
  synthetic: boolean;
  client_attested: boolean;
  tenant: {canonical_tenant_key: string; app_client_key: string};
  move: {move_id: string; declared_by: {manifest_dataset_id: string;field: "load_approval.move_id"};expected_archetype:string};
  rows: CaseRow[];
  existing_register_refs: Record<string,string>;
  live_id_preflight: {read_only_operator_execution:string;observed_at_utc:string;observed_current_phase:number;
    occupied_register_rows:Array<{area:"delivery"|"value";register_id:string;status:string;statement_sha256:string}>;
    next_allocations_at_observation:{delivery:string;value:string}};
  value_plan: unknown;
}

export function checkedSeed(): CaseSeed {
  // The pure preview checks the complete benchmark, reference and conversion
  // contracts. Re-run it here so the job never trusts only a file hash.
  previewCaseNumbers();
  const seed = JSON.parse(text(SEED_PATH)) as CaseSeed;
  if (seed.dataset_id !== DATASET_ID || seed.move.move_id !== EXPECTED_MOVE ||
      !seed.synthetic || seed.client_attested || seed.rows.length !== 17) throw new Error("seed_scope_invalid");
  return seed;
}

export interface CaseJobArgs {
  mode: "dry_run" | "apply";
  tenantKey: string;
  sourceSetHash: string;
  idempotencyKey: string;
  runId: string;
  buildVersion: string;
  imageDigest: string;
  databaseUrl: string;
  operator: string;
  approvalReference: string | null;
  confirmation: string | null;
  storageAccount: string | null;
  storageIdentityClientId: string | null;
  outDir: string;
}

export function parseArgs(env: Record<string,string|undefined> = process.env): CaseJobArgs {
  const required = (key:string) => {const v=env[key]?.trim(); if (!v) throw new Error(`${key}_required`); return v;};
  const mode = required("MOVES_CASE_SEED_MODE");
  if (mode !== "dry_run" && mode !== "apply") throw new Error("invalid_mode");
  const tenant = resolveDemoTenant(required("MOVES_CASE_SEED_TENANT_KEY"));
  if (tenant.appClientKey !== "meridian") throw new Error("app_tenant_mismatch");
  const sourceSetHash = required("MOVES_CASE_SEED_SOURCE_SET_SHA256");
  if (!/^[0-9a-f]{64}$/.test(sourceSetHash)) throw new Error("invalid_source_hash");
  const buildVersion = required("MOVES_CASE_SEED_BUILD_VERSION");
  const imageDigest = required("MOVES_CASE_SEED_IMAGE_DIGEST");
  if (!/^[0-9a-f]{40}$/.test(buildVersion) || !/^sha256:[0-9a-f]{64}$/.test(imageDigest)) throw new Error("image_or_sha_invalid");
  const databaseUrl = required("DATABASE_URL");
  const hostname = new URL(databaseUrl).hostname.toLowerCase();
  if (!hostname.endsWith(".postgres.database.azure.com") && !/^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(hostname)) throw new Error("non_azure_database_refused");
  return {mode, tenantKey:tenant.canonicalKey, sourceSetHash,
    idempotencyKey:required("MOVES_CASE_SEED_IDEMPOTENCY_KEY"),
    runId:required("MOVES_CASE_SEED_RUN_ID"),buildVersion,imageDigest,databaseUrl,
    operator:required("MOVES_CASE_SEED_OPERATOR"),
    approvalReference:env.MOVES_CASE_SEED_APPROVAL_REFERENCE?.trim() || null,
    confirmation:env.MOVES_CASE_SEED_CONFIRMATION?.trim() || null,
    storageAccount:env.AZURE_STORAGE_ACCOUNT_NAME?.trim() || null,
    storageIdentityClientId:env.ECL_SYNTHETIC_STORAGE_IDENTITY_CLIENT_ID?.trim() || null,
    outDir:path.join(env.MOVES_CASE_SEED_OUT_PARENT ?? "/tmp", "moves-demo-case-numbers-seed-job")};
}

export function loadManifests(): unknown[] {
  return readdirSync(MANIFEST_DIR).filter((file) => file.endsWith(".json"))
    .map((file) => JSON.parse(text(path.join(MANIFEST_DIR,file))));
}

/** A missing capture writer is an unconditional refusal before register writes. */
export function assertApplyCapability(deps: CaseJobDeps): void {
  if (!deps.writeValuePlan) throw new Error("apply_refused:shared_governed_phase_capture_writer_required");
  if (!deps.withTransaction) throw new Error("apply_refused:atomic_write_transaction_required");
}

/** Expected IDs are a precondition, never inferred as authoritative offline. */
export function assertRegisterIds(seed: CaseSeed, existing: readonly AssumptionRecord[], plan: readonly PlannedWrite[]): void {
  const priorSeed = JSON.parse(text(EXISTING_SEED_PATH));
  for (const [id,key] of Object.entries(seed.existing_register_refs)) {
    const source = priorSeed.rows.find((row: SeedRow) => row.seed_key === key);
    const actual = source && existing.find((row) => naturalKey(row.area,row.statement) === naturalKey(source.area,source.statement));
    if (!actual || actual.registerId !== id || actual.workingValue !== source.working_value ||
        actual.status !== (source.confirm ? "confirmed" : "open")) throw new Error(`existing_register_ref_drift:${id}`);
  }
  for (const occupied of seed.live_id_preflight.occupied_register_rows) {
    const matches=existing.filter((row)=>row.registerId===occupied.register_id && row.area===occupied.area);
    if (matches.length!==1 || matches[0].status!==occupied.status)
      throw new Error(`occupied_register_ref_drift:${occupied.register_id}`);
  }
  const seq: Record<string,number> = {value:0,delivery:0};
  for (const row of existing) if (row.area in seq) seq[row.area] = Math.max(seq[row.area],row.seq);
  seed.rows.forEach((row,index) => {
    const item = plan[index];
    if (item.action === "human_changed") throw new Error(`seed_row_changed:${row.seed_key}`);
    if (item.action === "create") {
      seq[row.area] += 1;
      const expected = `${row.area === "delivery" ? "DL" : "V"}${seq[row.area]}`;
      if (expected !== row.expected_register_id) throw new Error(`expected_register_id_drift:${row.seed_key}`);
    } else {
      const actual = existing.find((record) => naturalKey(record.area,record.statement) === item.naturalKey);
      if (!actual || actual.registerId !== row.expected_register_id || actual.workingValue !== row.working_value ||
          actual.ownerRole !== row.owner_role || actual.source !== row.source) throw new Error(`existing_new_row_drift:${row.seed_key}`);
      if (item.action === "present" && row.confirm &&
          (actual.answerValue !== row.confirm.answer_value || actual.answerSource !== row.confirm.answer_source)) {
        throw new Error(`confirmed_seed_row_drift:${row.seed_key}`);
      }
    }
  });
}

export interface CaseJobDeps {
  readMoveRegistryRow(moveId:string):Promise<MoveRegistryRow|null>;
  list(ctx:TenancyCtx,moveId:string):Promise<AssumptionRecord[]>;
  create(ctx:TenancyCtx,moveId:string,input:NewAssumptionInput,actor:RegisterActor,options?:{expectedRegisterId:string}):Promise<RegisterWriteResult>;
  transition(ctx:TenancyCtx,moveId:string,id:string,revision:number,request:TransitionRequest,actor:RegisterActor):Promise<RegisterWriteResult>;
  /** Calls the same governed domain writer as signed-in phase capture. */
  writeValuePlan?: (ctx:TenancyCtx,moveId:string,value:string,expectedRevision:string) => Promise<void>;
  readCaptureRevision(ctx:TenancyCtx,moveId:string):Promise<{revision:string;value:string}>;
  readValuePlan(ctx:TenancyCtx,moveId:string):Promise<string|null>;
  openProofStore():Promise<ProofStore>;
  /** Locks the Move and related rows, then commits or rolls back every governed write together. */
  withTransaction?<T>(moveId:string,work:()=>Promise<T>):Promise<T>;
}

/** Rechecks the exact ID map and P4 revision under the same lock as every write. */
export async function withExactCaseTransaction<T>(input:{
  seed:CaseSeed;deps:CaseJobDeps;move:ReturnType<typeof authenticateDemoMove>;
  tenant:ReturnType<typeof resolveDemoTenant>;ctx:TenancyCtx;
  capturePreflight:{revision:string;value:string};
},work:(locked:{existing:AssumptionRecord[];plan:PlannedWrite[];capture:{revision:string;value:string}})=>Promise<T>):Promise<T> {
  const {seed,deps,move,tenant,ctx,capturePreflight}=input;
  assertApplyCapability(deps);
  return deps.withTransaction!(move.moveId,async()=>{
    const lockedMove=authenticateDemoMove(await deps.readMoveRegistryRow(EXPECTED_MOVE),seed,tenant);
    if (lockedMove.clientId!==move.clientId || lockedMove.appClientKey!==move.appClientKey)
      throw new Error("move_scope_drift_inside_transaction");
    const existing=await deps.list(ctx,move.moveId);
    const plan=planSeedWrites(seed.rows,existing);
    assertRegisterIds(seed,existing,plan);
    const capture=await deps.readCaptureRevision(ctx,move.moveId);
    if (capture.revision!==capturePreflight.revision || capture.value!==capturePreflight.value)
      throw new Error("value_plan_revision_drift_inside_transaction");
    return work({existing,plan,capture});
  });
}

export async function runJob(args: CaseJobArgs, deps: CaseJobDeps):Promise<Record<string,unknown>> {
  const seed=checkedSeed();
  const sourceHash=sourceSetHash();
  if (args.tenantKey !== seed.tenant.canonical_tenant_key || sourceHash !== args.sourceSetHash ||
      args.idempotencyKey !== idempotencyKey(sourceHash)) throw new Error("job_scope_or_hash_mismatch");
  const registry=JSON.parse(text(REGISTRY_PATH)) as TenantInputDeclarations;
  if (!isDeclaredSyntheticDemoTenant(args.tenantKey,registry)) throw new Error("tenant_not_declared_synthetic_demo");
  const manifests=loadManifests();
  assertMoveDeclaration(seed,manifests);
  const decision=resolveLoadApproval(manifests,{dataset_id:DATASET_ID,tenant_key:seed.tenant.app_client_key,
    assessment_id:EXPECTED_MOVE,source_set_hash:sourceHash,object_count:18,
    ingestion_method:"operator_aca_job",move_id:EXPECTED_MOVE});
  if (args.mode === "apply") {
    if (!decision.approved || decision.approval.release_record !== RELEASE_RECORD ||
        !args.approvalReference || args.confirmation !== APPLY_CONFIRMATION) throw new Error("apply_refused:exact_named_load_approval_required");
    assertApplyCapability(deps);
    if (!args.storageAccount || !args.storageIdentityClientId) throw new Error("apply_refused:blob_proof_target_required");
  }
  const tenant=resolveDemoTenant(args.tenantKey);
  const moveRow=await deps.readMoveRegistryRow(EXPECTED_MOVE);
  const move=authenticateDemoMove(moveRow,seed,tenant);
  const actor=operatorActor(args.operator);
  const ctx:TenancyCtx={clientId:move.clientId,clientKey:move.appClientKey,userId:actor.userId};
  const existing=await deps.list(ctx,move.moveId);
  const plan=planSeedWrites(seed.rows,existing);
  assertRegisterIds(seed,existing,plan);
  const capturePreflight=await deps.readCaptureRevision(ctx,move.moveId);
  const currentValuePlan=capturePreflight.value;
  const proposedValuePlan=JSON.stringify(seed.value_plan);
  if (currentValuePlan && currentValuePlan !== proposedValuePlan) throw new Error("value_plan_existing_drift");
  const proof:Record<string,unknown>={event:"moves_demo_case_numbers_seed_proof",mode:args.mode,jobName:"job-abarva-private-operator-eus",
    runId:args.runId,tenantScope:args.tenantKey,appClientKey:move.appClientKey,moveId:move.moveId,
    observedCurrentPhase:moveRow?.currentPhase??null,
    datasetId:DATASET_ID,buildVersion:args.buildVersion,imageDigest:args.imageDigest,
    sourceSetHash:sourceHash,idempotencyKey:args.idempotencyKey,operatorIdentity:actor.userId,
    releaseRecord:RELEASE_RECORD,loadApproval:decision.approved?"present":"absent",
    rows:seed.rows.map((row,index)=>({seedKey:row.seed_key,expectedRegisterId:row.expected_register_id,
      value:row.working_value,unit:row.unit,ownerRole:row.owner_role,action:plan[index].action,writes:plan[index].writes})),
    valuePlan:{levers:readValueModel(proposedValuePlan).kind === "model" ? (seed.value_plan as {case:{levers:unknown[]}}).case.levers : [],
      action:currentValuePlan?"present":"create",captureRevision:capturePreflight.revision,
      costBasis:"pending_current_approved_p3_rom",p3RomReferenceLinkage:"human_selection_and_approval_required"},
    plannedRegisterWrites:plan.reduce((sum,item)=>sum+item.writes,0),
    actualWrites:0,liveReadback:"not_run",blobProofLocation:"not_written",qualityGate:"dry_run_only"};
  if (args.mode === "dry_run") return proof;
  const writer=deps.writeValuePlan!;
  const writes=await withExactCaseTransaction({seed,deps,move,tenant,ctx,capturePreflight},async({existing:lockedExisting,plan:lockedPlan,capture:lockedCapture})=>{
  let atomicWrites=0;
  for (const [index,item] of lockedPlan.entries()) {
    const row=seed.rows[index];
    if (item.action === "create") {
      const created=await deps.create(ctx,move.moveId,newAssumptionInput(row),actor,{expectedRegisterId:row.expected_register_id});
      if (!created.ok) throw new Error(`register_refused:${created.refusal.code}`);
      if (created.record.registerId !== row.expected_register_id) throw new Error(`allocated_register_id_drift:${row.seed_key}`);
      atomicWrites++;
      if (row.confirm) {
        const confirmed=await deps.transition(ctx,move.moveId,created.record.id,created.record.revision,confirmRequest(row),actor);
        if (!confirmed.ok) throw new Error(`register_confirm_refused:${confirmed.refusal.code}`);
        atomicWrites++;
      }
    } else if (item.action === "confirm_existing") {
      const current=lockedExisting.find((record)=>naturalKey(record.area,record.statement)===item.naturalKey)!;
      const confirmed=await deps.transition(ctx,move.moveId,current.id,current.revision,confirmRequest(row),actor);
      if (!confirmed.ok) throw new Error(`register_confirm_refused:${confirmed.refusal.code}`);
      atomicWrites++;
    }
  }
  if (!currentValuePlan) await writer(ctx,move.moveId,proposedValuePlan,lockedCapture.revision);
  const readback=await deps.list(ctx,move.moveId);
  assertRegisterIds(seed,readback,planSeedWrites(seed.rows,readback));
  for (const row of seed.rows) {
    const actual=readback.find((record)=>record.registerId===row.expected_register_id);
    if (!actual || actual.status!=="confirmed" || actual.answerValue!==row.confirm?.answer_value || actual.answerSource!==row.confirm?.answer_source) throw new Error(`readback_failed:${row.seed_key}`);
  }
  if (await deps.readValuePlan(ctx,move.moveId)!==proposedValuePlan) throw new Error("value_plan_readback_failed");
  return atomicWrites+(currentValuePlan?0:1);
  });
  // A fresh connection confirms committed state; the transactional readback above
  // is only a pre-commit quality gate.
  const committedRows=await deps.list(ctx,move.moveId);
  assertRegisterIds(seed,committedRows,planSeedWrites(seed.rows,committedRows));
  for (const row of seed.rows) {
    const actual=committedRows.find((record)=>record.registerId===row.expected_register_id);
    if (!actual || actual.status!=="confirmed" || actual.answerValue!==row.confirm?.answer_value || actual.answerSource!==row.confirm?.answer_source)
      throw new Error(`postcommit_readback_failed:${row.seed_key}`);
  }
  if (await deps.readValuePlan(ctx,move.moveId)!==proposedValuePlan) throw new Error("postcommit_value_plan_readback_failed");
  proof.actualWrites=writes;
  proof.liveReadback="passed";
  proof.qualityGate="passed";
  const blob=await deps.openProofStore();
  const uri=`${PROOF_PREFIX}/${args.runId}/proof.json`;
  const stored=await blob.writeOnce(uri,Buffer.from(`${JSON.stringify(proof,null,2)}\n`));
  if (!stored.created) throw new Error("proof_blob_already_exists");
  proof.blobProofLocation=stored.uri;
  return proof;
}

async function main():Promise<void> {
  if (process.argv.includes("--seed-hash")) {
    const sourceHash=sourceSetHash();
    console.log(JSON.stringify({datasetId:DATASET_ID,moveId:EXPECTED_MOVE,sourceSetHash:sourceHash,
      idempotencyKey:idempotencyKey(sourceHash),applyCapability:"blocked_until_exact_named_load_approval"},null,2));
    return;
  }
  const args=parseArgs();
  const store=await import("../../src/lib/programs/assumption-register/store");
  const {getAzureWriteFluentClient,withAzureWriteTransaction,writeTransactionOutcome}=await import("../../src/lib/data-plane/postgresCompat");
  const deps:CaseJobDeps={
    async readMoveRegistryRow(moveId) {
      const db=getAzureWriteFluentClient();
      const {data:move,error}=await db.from("engagements").select("id, client_id, charter, deleted_at, current_phase").eq("id",moveId).maybeSingle();
      if (error) throw error;
      if (!move) return null;
      const {data:client,error:clientError}=await db.from("clients").select("tenant_key, slug").eq("id",move.client_id).maybeSingle();
      if (clientError) throw clientError;
      return {id:String(move.id),clientId:String(move.client_id),deletedAt:move.deleted_at??null,
        charter:move.charter??null,clientTenantKey:client?.tenant_key??null,clientSlug:client?.slug??null,
        currentPhase:typeof move.current_phase==="number"?move.current_phase:null};
    },
    list:store.listAssumptions,create:store.createAssumption,transition:store.transitionAssumption,
    readCaptureRevision:readValuePlanCaptureRevision,
    writeValuePlan:(ctx,moveId,value,expectedRevision)=>writeGovernedValuePlan({ctx,moveId,value,expectedRevision}),
    async readValuePlan(ctx,moveId) {
      const db=getAzureWriteFluentClient();
      const {data,error}=await db.from("program_modules").select("state_jsonb").eq("engagement_id",moveId)
        .eq("module_key",phaseCaptureModuleKey(4,"value_plan")).maybeSingle();
      if (error) throw error;
      const value=(data?.state_jsonb as {value?:unknown}|null)?.value;
      return typeof value==="string"?value:null;
    },
    async openProofStore() {
      const {blobProofStore}=await import("../ecl/synthetic_enterprise_home_job");
      return blobProofStore(args.storageAccount!,args.storageIdentityClientId!,
        {statementTimeoutMs:60000,lockTimeoutMs:15000,proofStoreTimeoutMs:30000});
    },
    withTransaction(moveId,work) {
      return withAzureWriteTransaction(args.databaseUrl,async(query)=>{
        const locked=await query("SELECT id FROM engagements WHERE id = $1 FOR UPDATE",[moveId]);
        if (locked.rowCount!==1) throw new Error("move_lock_missing");
        await query("SELECT id FROM move_assumptions WHERE program_id = $1 FOR UPDATE",[moveId]);
        await query("SELECT id FROM program_modules WHERE engagement_id = $1 AND phase_number IN (3,4) FOR UPDATE",[moveId]);
        return work();
      });
    },
  };
  let summary:Record<string,unknown>;
  let status:"succeeded"|"failed"="succeeded";
  try {
    summary=await runJob(args,deps);
  } catch(error) {
    status="failed";
    process.exitCode=1;
    const observed:Record<string,unknown>={readback:"unavailable"};
    try {
      const seed=checkedSeed();
      const move=authenticateDemoMove(await deps.readMoveRegistryRow(EXPECTED_MOVE),seed,resolveDemoTenant(args.tenantKey));
      const ctx:TenancyCtx={clientId:move.clientId,clientKey:move.appClientKey,userId:operatorActor(args.operator).userId};
      const rows=await deps.list(ctx,move.moveId);
      observed.readback="completed";
      observed.registerRows=rows.map((row)=>({registerId:row.registerId,area:row.area,status:row.status,
        seedKey:seed.rows.find((item)=>naturalKey(item.area,item.statement)===naturalKey(row.area,row.statement))?.seed_key??null}));
      observed.expectedIds=seed.rows.map((row)=>({seedKey:row.seed_key,expectedRegisterId:row.expected_register_id,
        actualRegisterId:rows.find((item)=>naturalKey(item.area,item.statement)===naturalKey(row.area,row.statement))?.registerId??null}));
      observed.valuePlanMatchesSeed=(await deps.readValuePlan(ctx,move.moveId))===JSON.stringify(seed.value_plan);
    } catch(readError) {
      observed.readbackError=readError instanceof Error?readError.message:String(readError);
    }
    summary={event:"moves_demo_case_numbers_seed_failure",mode:args.mode,runId:args.runId,
      datasetId:DATASET_ID,sourceSetHash:args.sourceSetHash,idempotencyKey:args.idempotencyKey,
      transactionOutcome:writeTransactionOutcome(error),
      error:error instanceof Error?error.message:String(error),observed,
      actualWrites:"unknown; inspect observed state",liveReadback:observed.readback,qualityGate:"failed",
      rows:[],valuePlan:null};
  }
  mkdirSync(args.outDir,{recursive:true});
  const manifest={schemaVersion:1,status,committed:status==="succeeded"?args.mode==="apply":"unknown; see transactionOutcome and observed state",...summary};
  writeFileSync(path.join(args.outDir,"proof-manifest.json"),`${JSON.stringify(manifest,null,2)}\n`);
  writeFileSync(path.join(args.outDir,"plan.json"),`${JSON.stringify({rows:summary.rows,valuePlan:summary.valuePlan},null,2)}\n`);
  writeFileSync(path.join(args.outDir,"validation.json"),`${JSON.stringify({scopeAndIds:status==="succeeded"?"passed":"failed",liveReadback:summary.liveReadback,observed:summary.observed??null},null,2)}\n`);
  writeFileSync(path.join(args.outDir,"quality-gate.json"),`${JSON.stringify({mode:args.mode,
    passed:status==="succeeded"&&(args.mode==="dry_run"?summary.actualWrites===0:summary.liveReadback==="passed"),
    applyBlocked:args.mode==="dry_run",reason:status==="failed"?summary.error:args.mode==="dry_run"?"exact_named_load_approval_absent":null},null,2)}\n`);
  const parent=path.dirname(args.outDir);
  const base=path.basename(args.outDir);
  const tarPath=path.join(parent,`${base}.tgz`);
  const archived=spawnSync("tar",["-czf",tarPath,"-C",parent,base],{encoding:"utf8"});
  if (archived.status!==0) throw new Error(archived.stderr||"proof_bundle_failed");
  const encoded=readFileSync(tarPath).toString("base64");
  console.log("__SEMANTIC2_PROOF_TGZ_BEGIN__");
  for (let i=0;i<encoded.length;i+=7600) console.log(encoded.slice(i,i+7600));
  console.log("__SEMANTIC2_PROOF_TGZ_END__");
  console.log(`__MOVES_DEMO_CASE_NUMBERS_PROOF_SUMMARY__${JSON.stringify(summary)}`);
}

if (process.argv[1]?.endsWith("seed-demo-case-numbers-job.ts")) {
  main().catch((error)=>{console.error(error instanceof Error?error.message:String(error));process.exitCode=1;});
}
