import { readFileSync } from "node:fs";
import type { AssumptionRecord } from "@/lib/programs/assumption-register/model";
import type { PlannedWrite } from "../../../../scripts/moves/seed-demo-assumption-register-job";
import {
  assertApplyCapability, assertRegisterIds, checkedSeed, idempotencyKey,
  sourceSetHash,
} from "../../../../scripts/moves/seed-demo-case-numbers-job";

const prior = JSON.parse(readFileSync("datasets/tenant-inputs/meridian-health/moves/demo-assumption-register-seed.json","utf8"));
const prefix = {value:"V",data:"D",delivery:"DL",adoption:"A"} as const;
function priorRows(): AssumptionRecord[] {
  const seq = {value:0,data:0,delivery:0,adoption:0};
  return prior.rows.map((row: {area:keyof typeof prefix;statement:string;working_value:number;confirm:unknown}) => {
    const n=++seq[row.area];
    return {area:row.area,statement:row.statement,workingValue:row.working_value,status:row.confirm?"confirmed":"open",
      seq:n,registerId:`${prefix[row.area]}${n}`} as AssumptionRecord;
  });
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
    expect(() => assertApplyCapability(undefined)).toThrow(
      "apply_refused:no_shared_governed_phase_capture_writer_for_p4_while_move_at_p3",
    );
  });

  it("accepts the expected register allocation in a synthetic fixture", () => {
    expect(() => assertRegisterIds(checkedSeed(),priorRows(),createPlan())).not.toThrow();
  });

  it("refuses an intervening value row, preserving all existing rows", () => {
    const rows=priorRows();
    rows.push({area:"value",statement:"Another row",workingValue:1,seq:5,registerId:"V5"} as AssumptionRecord);
    expect(() => assertRegisterIds(checkedSeed(),rows,createPlan())).toThrow("expected_register_id_drift:value.zero_baseline");
  });
});
