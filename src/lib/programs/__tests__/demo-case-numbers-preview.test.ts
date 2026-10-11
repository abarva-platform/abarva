import { readFileSync } from "node:fs";
import { previewCaseNumbers, SEED_PATH, BENCHMARK_PATH } from "../../../../scripts/moves/preview-demo-case-numbers";

const seedText = () => readFileSync(SEED_PATH, "utf8");
const benchmarkText = () => readFileSync(BENCHMARK_PATH, "utf8");

describe("synthetic demo case numbers, offline", () => {
  it("prices both ROM releases and computes the value case with zero monetary analyst capacity", () => {
    const proof = previewCaseNumbers() as {
      proposedRows: Array<{expectedRegisterId: string}>;
      rom: {releases: unknown[]; total: {planDollars: number}};
      value: {status: string; byYearPaidDollars: number[]; npvDollars: number;
        paybackMonth: number; roi: number; analystCapacityAnnualCents: number; analystCapacityHours: number};
    };
    expect(proof.proposedRows).toHaveLength(17);
    expect(new Set(proof.proposedRows.map((row) => row.expectedRegisterId)).size).toBe(17);
    expect(proof.rom.releases).toHaveLength(2);
    expect(proof.rom.total.planDollars).toBe(115600);
    expect(proof.value).toMatchObject({status:"evaluated", byYearPaidDollars:[530400,2545920,2545920],
      npvDollars:-314869.25, paybackMonth:34, roi:0.124448,
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
});
