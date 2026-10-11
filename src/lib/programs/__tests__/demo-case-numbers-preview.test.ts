import { readFileSync } from "node:fs";
import { previewCaseNumbers, SEED_PATH, BENCHMARK_PATH } from "../../../../scripts/moves/preview-demo-case-numbers";
import { addFoundation, addUseCase, emptyRomEstimate } from "@/lib/programs/rom-estimate";
import { proposeRomCountsFromNotes } from "@/lib/programs/rom-estimate-notes";

const seedText = () => readFileSync(SEED_PATH, "utf8");
const benchmarkText = () => readFileSync(BENCHMARK_PATH, "utf8");

describe("synthetic demo case numbers, offline", () => {
  it("prices both ROM releases and computes the value case with zero monetary analyst capacity", () => {
    const proof = previewCaseNumbers() as {
      proposedRows: Array<{expectedRegisterId: string}>;
      rom: {foundation: {weeks:number}; releases: Array<{weeks:number}>; total: {planDollars: number;weeks:number};
        rateLines:Array<{roleCode:string;locationCode:string;mappingStatus:string;baseSource:string;location:{source:string};provider:{source:string}}>};
      costBasis: {planShareOfCeiling:number;budgetCeilingDollars:number;kind:string};
      value: {status: string; byYearPaidDollars: number[]; npvDollars: number;
        paybackMonth: number|null; roi: number; analystCapacityAnnualCents: number; analystCapacityHours: number};
    };
    expect(proof.proposedRows).toHaveLength(17);
    expect(new Set(proof.proposedRows.map((row) => row.expectedRegisterId)).size).toBe(17);
    expect(proof.rom.releases).toHaveLength(2);
    expect(proof.rom.foundation.weeks + proof.rom.releases.reduce((n,r)=>n+r.weeks,0)).toBe(49);
    expect(proof.rom.total).toMatchObject({planDollars:5891034.8,weeks:49});
    expect(proof.costBasis).toMatchObject({kind:"approved_p3_rom_required_for_live",budgetCeilingDollars:5000000,planShareOfCeiling:1.17820696});
    expect(proof.rom.rateLines).toHaveLength(4);
    expect(proof.rom.rateLines.every((line)=>line.locationCode==="LOC-DALLAS" &&
      line.mappingStatus==="proposed_unapproved" && line.baseSource.includes("Role Rate Card row") &&
      line.location.source.includes("Geography row 10") && line.provider.source.includes("Assumptions row 28"))).toBe(true);
    expect(proof.value).toMatchObject({status:"evaluated", byYearPaidDollars:[530400,2545920,2545920],
      npvDollars:-1205904.05, paybackMonth:null, roi:-0.045627773239431554,
      analystCapacityAnnualCents:0, analystCapacityHours:1484});
  });

  it("refuses a changed synthetic benchmark value", () => {
    const changed = JSON.parse(seedText());
    const row = changed.rows.find((item: {seed_key: string}) => item.seed_key === "delivery.data_source_count");
    row.working_value = 1;
    row.confirm.answer_value = 1;
    expect(() => previewCaseNumbers({seedText:JSON.stringify(changed)})).toThrow("benchmark_drift:data_source_count");
  });

  it("refuses a missing probability register reference", () => {
    const changed = JSON.parse(seedText());
    changed.value_plan.case.levers[0].probability.registerId = "V99";
    expect(() => previewCaseNumbers({seedText:JSON.stringify(changed)})).toThrow("missing_register_ref");
  });

  it("refuses converting analyst capacity to a monetary lever", () => {
    const changed = JSON.parse(seedText());
    changed.value_plan.case.levers[1].conversion = "cost_reduction";
    expect(() => previewCaseNumbers({seedText:JSON.stringify(changed)})).toThrow("value_preview_not_evaluated_or_capacity_not_zero");
  });

  it("refuses a drifted timing binding", () => {
    const changed = JSON.parse(seedText());
    changed.value_plan.case.levers[0].timing.startMonth = 7;
    expect(() => previewCaseNumbers({seedText:JSON.stringify(changed)})).toThrow("value_plan_binding_mismatch");
  });

  it("refuses a changed benchmark fixture independently of the seed", () => {
    const changed = JSON.parse(benchmarkText());
    changed.unit_hours.source_table_count = 9;
    expect(() => previewCaseNumbers({benchmarkText:JSON.stringify(changed)})).toThrow("benchmark_drift:source_table_count");
  });

  it("refuses a local invented rate fixture even when it could improve the case", () => {
    const changed = JSON.parse(benchmarkText());
    changed.rate_reference = {basis:"bill_rate",indicative_bill_rate:200};
    expect(() => previewCaseNumbers({benchmarkText:JSON.stringify(changed)}))
      .toThrow("foundation_pod_contract_invalid");
  });

  it("the owner walk-sheet lines fill the exact page codes and all six counts per block", () => {
    const record=emptyRomEstimate();
    const first=addUseCase(record,"Certified measures and governed consumption");
    if (!first.ok) throw new Error(first.reason);
    const second=addUseCase(first.value,"Workbook certification and retirement");
    if (!second.ok) throw new Error(second.reason);
    const foundation=addFoundation(second.value);
    if (!foundation.ok) throw new Error(foundation.reason);
    const release=readFileSync("docs/releases/records/2026-10-10-moves-demo-case-numbers-seed.md","utf8");
    const notes=release.match(/```text\n(FOUNDATION:[\s\S]*?)\n```/)?.[1];
    expect(notes).toBeDefined();
    const proposals=proposeRomCountsFromNotes(notes!,foundation.value);
    expect(proposals.map((item)=>item.code)).toEqual(["FOUNDATION","UC-1","UC-2"]);
    const planned=JSON.parse(seedText()).rom_preview;
    expect(proposals.map((item)=>item.counts)).toEqual([
      planned.foundation.counts,...planned.useCases.map((item:{counts:unknown})=>item.counts),
    ]);
  });
});
