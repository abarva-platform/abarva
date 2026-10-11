import { readFileSync } from "node:fs";
import { buildCasePreview, previewCaseNumbers, SEED_PATH, BENCHMARK_PATH } from "../../../../scripts/moves/preview-demo-case-numbers";
import { buildRomWorkbook } from "@/lib/pricing/moves-workflow/rom-workbook";

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
      deliveryOptions: {rateStatus:string;status:string;optionA:{hours:number;weeks:number;planDollars:number};
        optionB:{hours:number;weeks:number;lowDollars:number;planDollars:number;highDollars:number;
          rateLines:Array<{roleCode:string;locationCode:string;providerClassCode:string;hourlyRateCents:number;
            baseSource:string;location:{source:string};provider:{source:string};rateStatus:string}>}};
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
    expect(proof.deliveryOptions.status).toContain("neither selected nor approved");
    expect(proof.deliveryOptions.rateStatus).toBe("planning rates, not approved");
    expect(proof.deliveryOptions.optionB).toMatchObject({hours:12847.84,weeks:49,
      lowDollars:2010416.1,planDollars:2680554.8,highDollars:4020832.2});
    expect(proof.deliveryOptions.optionA.hours).toBe(proof.deliveryOptions.optionB.hours);
    expect(proof.deliveryOptions.optionA.weeks).toBe(proof.deliveryOptions.optionB.weeks);
    expect(proof.deliveryOptions.optionB.rateLines.map((line)=>[line.roleCode,line.locationCode,line.providerClassCode,line.hourlyRateCents])).toEqual([
      ["ROL-024","LOC-DALLAS","SI-T1",40625],
      ["ROL-023","LOC-DALLAS","SI-T1",34938],
      ["ROL-037","LOC-INDIA-TIER-1","SI-T2",7956],
      ["ROL-041","LOC-INDIA-TIER-1","SI-T2",6732],
    ]);
    expect(proof.deliveryOptions.optionB.rateLines.every((line)=>line.rateStatus==="planning rates, not approved" &&
      line.baseSource.includes("Role Rate Card row") && line.location.source.includes("Geography row") &&
      line.provider.source.includes("Assumptions row"))).toBe(true);
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

  it("keeps the unapproved rate warning and exact option totals in both workbooks", () => {
    const {rom,optionB}=buildCasePreview();
    for (const [priced, expectedCents] of [[rom,589103480],[optionB,268055480]] as const) {
      const {workbook,layout}=buildRomWorkbook(priced);
      expect(workbook.getWorksheet("Assumptions")?.getCell("B10").value).toBe("planning rates, not approved");
      expect(workbook.getWorksheet("Pod & Rates")?.getCell("R4").value).toContain("planning rates, not approved");
      expect((workbook.getWorksheet("Releases")?.getCell(layout.total.planCents).value as {result:number}).result)
        .toBe(expectedCents);
    }
  });

});
