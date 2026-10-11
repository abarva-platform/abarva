import { readFileSync } from "node:fs";
import type { AssumptionRecord } from "@/lib/programs/assumption-register/model";
import type { PlannedWrite } from "../../../../scripts/moves/seed-demo-assumption-register-job";
import { resolveDemoTenant } from "../../../../scripts/moves/seed-demo-assumption-register-job";
import {
  assertApplyCapability, assertRegisterIds, checkedSeed, idempotencyKey,
  sourceSetHash, runJob, withExactCaseTransaction, type CaseJobArgs, type CaseJobDeps,
} from "../../../../scripts/moves/seed-demo-case-numbers-job";

const prior = JSON.parse(readFileSync("datasets/tenant-inputs/meridian-health/moves/demo-assumption-register-seed.json","utf8"));
const prefix = {value:"V",data:"D",delivery:"DL",adoption:"A"} as const;
function priorRows(): AssumptionRecord[] {
  const seq = {value:0,data:0,delivery:0,adoption:0};
  const rows=prior.rows.map((row: {area:keyof typeof prefix;statement:string;working_value:number;confirm:unknown}) => {
    const n=++seq[row.area];
    return {area:row.area,statement:row.statement,workingValue:row.working_value,status:row.confirm?"confirmed":"open",
      seq:n,registerId:`${prefix[row.area]}${n}`} as AssumptionRecord;
  });
  rows.push({area:"delivery",statement:"Other delivery input 1",status:"open",seq:5,registerId:"DL5"} as AssumptionRecord);
  rows.push({area:"delivery",statement:"Other delivery input 2",status:"open",seq:6,registerId:"DL6"} as AssumptionRecord);
  rows.push({area:"value",statement:"Other value input",status:"open",seq:5,registerId:"V5"} as AssumptionRecord);
  return rows;
}
const createPlan = (): PlannedWrite[] => checkedSeed().rows.map((row) => ({
  seedKey:row.seed_key,area:row.area,naturalKey:"unused",action:"create",writes:2,existingRegisterId:null,
}));

describe("case-number seed job contract, offline", () => {
  it("binds idempotency to the exact source set and target Move", () => {
    expect(sourceSetHash()).toMatch(/^[a-f0-9]{64}$/);
    expect(idempotencyKey(sourceSetHash())).toMatch(/^moves-demo-case-numbers-seed-v1:[a-f0-9]{64}$/);
    expect(idempotencyKey("0".repeat(64))).not.toBe(idempotencyKey(sourceSetHash()));
  });

  it("refuses apply without a shared governed capture writer before any mutation", () => {
    expect(() => assertApplyCapability({} as CaseJobDeps)).toThrow(
      "apply_refused:shared_governed_phase_capture_writer_required",
    );
    expect(() => assertApplyCapability({writeValuePlan:jest.fn()} as unknown as CaseJobDeps)).toThrow(
      "apply_refused:atomic_write_transaction_required",
    );
  });

  it("refuses absent named load approval before any live read or write", async () => {
    const readMoveRegistryRow = jest.fn();
    const args = {mode:"apply",tenantKey:"meridian-health",sourceSetHash:sourceSetHash(),
      idempotencyKey:idempotencyKey(sourceSetHash()),approvalReference:"unbound",
      confirmation:"APPLY_DEMO_CASE_NUMBERS_SEED"} as CaseJobArgs;
    await expect(runJob(args,{readMoveRegistryRow} as unknown as CaseJobDeps))
      .rejects.toThrow("apply_refused:exact_named_load_approval_required");
    expect(readMoveRegistryRow).not.toHaveBeenCalled();
  });

  it("accepts the expected register allocation in a synthetic fixture", () => {
    expect(() => assertRegisterIds(checkedSeed(),priorRows(),createPlan())).not.toThrow();
  });

  it("refuses an intervening value row, preserving all existing rows", () => {
    const rows=priorRows();
    rows.push({area:"value",statement:"Another row",workingValue:1,seq:6,registerId:"V6"} as AssumptionRecord);
    expect(() => assertRegisterIds(checkedSeed(),rows,createPlan())).toThrow("expected_register_id_drift:value.zero_baseline");
  });

  it.each(["allocation","revision"])("refuses %s drift inside the locked transaction before invoking any write", async (kind) => {
    const seed=checkedSeed();
    const tenant=resolveDemoTenant("meridian-health");
    const move={moveId:seed.move.move_id,clientId:"client-1",canonicalTenantKey:tenant.canonicalKey,appClientKey:tenant.appClientKey};
    const ctx={clientId:move.clientId,clientKey:move.appClientKey,userId:"operator"};
    const rows=priorRows();
    if (kind==="allocation") rows.push({area:"value",statement:"Intervening",workingValue:1,seq:6,registerId:"V6"} as AssumptionRecord);
    const work=jest.fn();
    const deps={
      withTransaction:jest.fn(async (_moveId:string,callback:()=>Promise<unknown>)=>callback()),
      writeValuePlan:jest.fn(),
      readMoveRegistryRow:jest.fn(async()=>({id:move.moveId,clientId:move.clientId,deletedAt:null,
        charter:{classification:{archetype:seed.move.expected_archetype}},clientTenantKey:tenant.canonicalKey,clientSlug:null,currentPhase:3})),
      list:jest.fn(async()=>rows),
      readCaptureRevision:jest.fn(async()=>({revision:kind==="revision"?"changed":"r1",value:""})),
    } as unknown as CaseJobDeps;
    await expect(withExactCaseTransaction({seed,deps,move,tenant,ctx,capturePreflight:{revision:"r1",value:""}},work))
      .rejects.toThrow(kind==="allocation"?"expected_register_id_drift:value.zero_baseline":"value_plan_revision_drift_inside_transaction");
    expect(deps.withTransaction).toHaveBeenCalledTimes(1);
    expect(work).not.toHaveBeenCalled();
  });
});
