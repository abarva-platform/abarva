#!/usr/bin/env tsx

/** Offline-only proposal preview. This module has no data-plane or network imports. */
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { evaluateValueCase } from "../../src/lib/programs/value-engine";
import { resolveCostBasis, withCostBasis } from "../../src/lib/programs/value-engine/cost-basis";
import { readValueModel } from "../../src/lib/programs/value-model-capture";
import { registerInputRefs } from "../../src/lib/programs/value-engine/register-inputs";
import { computeRom, type RomReferenceLoaders, type RomStructure } from "../../src/lib/pricing/moves-workflow/rom-service";
import { ROM_DRIVERS } from "../../src/lib/pricing/moves-workflow/rom-drivers";

export const SEED_PATH = "datasets/tenant-inputs/meridian-health/moves/demo-case-numbers-seed-v1.json";
export const BENCHMARK_PATH = "scripts/moves/fixtures/demo-case-numbers/synthetic-benchmarks-v1.json";
export const PROOF_PATH = "docs/releases/proofs/2026-10-10-moves-demo-case-numbers-local-preview.json";
const EXISTING_PATH = "datasets/tenant-inputs/meridian-health/moves/demo-assumption-register-seed.json";
const MOVE_ID = "1557f032-5a5c-4475-abe5-b1a841576649";

const hash = (value: string) => createHash("sha256").update(value).digest("hex");
const read = (name: string) => readFileSync(name, "utf8");
const OWNER_ROLES = ["Finance business partner","Transformation office program lead","BI and analytics enablement lead"];
const naturalKey = (area:string,statement:string) => `${area}:${hash(statement.trim().replace(/\s+/g," ").toLowerCase())}`;

export function previewCaseNumbers(input: {seedText?: string; benchmarkText?: string} = {}): Record<string, unknown> {
  const seedText = input.seedText ?? read(SEED_PATH);
  const benchmarkText = input.benchmarkText ?? read(BENCHMARK_PATH);
  const seed = JSON.parse(seedText);
  const benchmark = JSON.parse(benchmarkText);
  const existingText = read(EXISTING_PATH);
  const existing = JSON.parse(existingText);
  if (seed.dataset_id !== "moves_demo_case_numbers_seed_v1" || seed.move.move_id !== MOVE_ID ||
      seed.tenant.canonical_tenant_key !== "meridian-health" || seed.tenant.app_client_key !== "meridian" ||
      !seed.synthetic || seed.client_attested || seed.rows.length !== 17) {
    throw new Error("seed_scope_or_shape_mismatch");
  }
  const byId = new Map<string, { value: number; status: "confirmed" | "open"; confidence: number; key: string }>();
  for (const [index, row] of existing.rows.entries()) {
    const prefix = { value: "V", data: "D", delivery: "DL", adoption: "A" }[row.area as "value" | "data" | "delivery" | "adoption"];
    const id = `${prefix}${existing.rows.slice(0, index + 1).filter((item: {area: string}) => item.area === row.area).length}`;
    if (seed.existing_register_refs[id] === row.seed_key) {
      byId.set(id, { value: row.working_value, status: row.confirm ? "confirmed" : "open", confidence: row.confidence, key: row.seed_key });
    }
  }
  const unique = new Set<string>();
  const naturalKeys = new Set<string>();
  for (const row of seed.rows) {
    const id = row.expected_register_id;
    const key = naturalKey(row.area,row.statement);
    if (!/^(DL|V)[1-9][0-9]*$/.test(id) || unique.has(id) || byId.has(id) ||
        naturalKeys.has(key) || !OWNER_ROLES.includes(row.owner_role) ||
        row.area !== (id.startsWith("DL") ? "delivery" : "value") ||
        ![1,3,5].includes(row.confidence) || row.confirm?.answer_value !== row.working_value ||
        row.source_ref !== BENCHMARK_PATH || row.confirm?.answer_source_ref !== BENCHMARK_PATH ||
        row.source !== `AbarVa delivery benchmark (synthetic, demo) [${BENCHMARK_PATH}]` ||
        row.confirm?.answer_source !== `AbarVa delivery benchmark (synthetic, demo) [${BENCHMARK_PATH}]` ||
        !row.confirm?.answer.includes("not client or Finance attestation")) throw new Error(`invalid_row:${row.seed_key}`);
    unique.add(id);
    naturalKeys.add(key);
    byId.set(id, { value: row.working_value, status: "confirmed", confidence: row.confidence, key: row.seed_key });
  }
  for (const [key, value] of Object.entries(benchmark.unit_hours)) {
    const row = seed.rows.find((item: {seed_key: string}) => item.seed_key === `delivery.${key}`);
    if (!row || row.working_value !== value) throw new Error(`benchmark_drift:${key}`);
  }
  for (const [key, value] of Object.entries(benchmark.rom_factors)) {
    const row = seed.rows.find((item: {seed_key: string}) => item.seed_key === `delivery.${key}`);
    if (!row || row.working_value !== value) throw new Error(`benchmark_drift:${key}`);
  }
  for (const [key, value] of Object.entries(benchmark.value_inputs)) {
    const row = seed.rows.find((item: {seed_key: string}) => item.seed_key === `value.${key}`);
    if (!row || row.working_value !== value) throw new Error(`benchmark_drift:${key}`);
  }
  const model = readValueModel(JSON.stringify(seed.value_plan));
  if (model.kind !== "model") throw new Error("invalid_value_plan");
  const refs = registerInputRefs(model.model.case);
  if (refs.some(({registerId}) => !byId.has(registerId))) throw new Error("missing_register_ref");
  for (const [path, binding] of Object.entries(seed.value_plan_bindings) as Array<[string, {registerId: string; scale: number}]>) {
    const expected = byId.get(binding.registerId);
    const actual = model.model.case.levers.find((lever) => lever.id === path.split(".")[1])?.timing.startMonth;
    if (!expected || actual !== expected.value * binding.scale) throw new Error(`value_plan_binding_mismatch:${path}`);
  }
  if (model.model.case.cost.kind !== "rom" || model.model.case.cost.snapshotId !== "pending-current-approved-p3-rom")
    throw new Error("value_case_must_await_approved_rom");
  const romFixture = seed.rom_preview;
  for (const driver of ROM_DRIVERS) {
    if (!romFixture.unitHours[driver] || !byId.has(romFixture.unitHours[driver].registerId)) throw new Error(`rom_driver_missing:${driver}`);
  }
  const resolveFactor = (key: "friction" | "productiveShare" | "hoursPerFteWeek") => {
    const id = romFixture[key].registerId;
    const row = byId.get(id);
    if (!row) throw new Error(`rom_factor_missing:${key}`);
    return {value: row.value, source: `[A:${id}] synthetic demo benchmark`};
  };
  const structure: RomStructure = {
    ...romFixture,
    unitHours: Object.fromEntries(ROM_DRIVERS.map((driver) => {
      const id = romFixture.unitHours[driver].registerId;
      return [driver, {value: byId.get(id)!.value, source: `[A:${id}] synthetic demo benchmark`, confidence: "medium"}];
    })),
    friction: resolveFactor("friction"), productiveShare: resolveFactor("productiveShare"),
    hoursPerFteWeek: resolveFactor("hoursPerFteWeek"),
  };
  const rates = benchmark.rate_reference;
  if (rates?.classification !== "synthetic-local-preview-only" || rates.currency !== "USD" ||
      rates.basis !== "bill_rate" || structure.pod.rateBasis !== rates.basis ||
      structure.pod.members?.[0]?.fte !== rates.pod_senior_fte ||
      structure.pod.members?.[1]?.fte !== rates.pod_engineer_fte ||
      [rates.senior_loaded_usd_per_hour,rates.engineer_loaded_usd_per_hour,
       rates.bill_to_loaded_multiplier,rates.provider_tier_multiplier,
       rates.location_rate_multiplier].some((number) => typeof number !== "number" || number <= 0))
    throw new Error("synthetic_rate_or_pod_fixture_invalid");
  const band = (role: string, level: string, loaded: number) => ({
    rate_band_code: `${role}-${level}`, role_code: role, level_code: level,
    currency: "USD", rate_basis: "onshore_si_t1_benchmark", loaded_rate: loaded,
    scarcity_adj_rate: loaded * 1.2, indicative_bill_rate: loaded * rates.bill_to_loaded_multiplier,
    confidence: "synthetic", approval_status: "synthetic",
  });
  const loaders: RomReferenceLoaders = {
    loadRateReference: () => ({rateBands: [band("ROL-T01", "LVL-T1", rates.senior_loaded_usd_per_hour), band("ROL-T02", "LVL-T2", rates.engineer_loaded_usd_per_hour)],
      locations: [{location_code:"LOC-TEST",shore_category:"onshore",salary_multiplier:0.5,rate_multiplier:rates.location_rate_multiplier}],
      providerClasses: [{provider_class_code:"SI-T1",tier_multiplier:rates.provider_tier_multiplier}]}),
    loadPodLibrary: () => ({podTemplates:[],podTemplateRoles:[]}),
    loadRangePolicies: () => [],
  };
  const rom = computeRom(structure, loaders);
  if (!rom.ok) throw new Error(`rom_refused:${rom.code}:${rom.message}`);
  if (!rom.foundation || rom.total.weeks > seed.program_schedule.horizon_weeks ||
      rom.total.weeks < 40 || rom.foundation.priced.weeks +
      rom.releases.reduce((weeks, release) => weeks + release.own.weeks, 0) !== rom.total.weeks)
    throw new Error("rom_schedule_or_foundation_incoherent");
  if (seed.program_schedule.release_1_target_week !== rom.foundation.priced.weeks + rom.releases[0].own.weeks ||
      seed.program_schedule.release_2_target_week < rom.total.weeks ||
      seed.program_schedule.benefit_start_month !== 8 ||
      seed.program_schedule.release_1_target_week > 30)
    throw new Error("rom_release_timing_incoherent");
  const ceiling = byId.get(seed.budget_ceiling_check.register_id);
  if (!ceiling || seed.budget_ceiling_check.role !== "ceiling_only_not_value_case_cost") throw new Error("budget_ceiling_missing");
  const budgetCents = ceiling.value * seed.budget_ceiling_check.scale_to_cents;
  if (!Number.isSafeInteger(budgetCents) || budgetCents <= 0 ||
      rom.total.planCents / budgetCents < 0.7 || rom.total.planCents / budgetCents > 0.95)
    throw new Error("synthetic_program_rom_outside_budget_planning_band");
  const costBasis = resolveCostBasis({estimateCapture:"",romSnapshot:{snapshotId:"local-synthetic-preview-unapproved",
    currency:"USD",lowCents:rom.total.lowCents,baseCents:rom.total.planCents,highCents:rom.total.highCents}});
  if (costBasis.status !== "resolved" || costBasis.basis !== "rom_snapshot") throw new Error("rom_cost_basis_unresolved");
  const value = evaluateValueCase(withCostBasis(model.model.case,costBasis), { resolver: (ref) => {
    if (ref.kind !== "register") return null;
    const row = byId.get(ref.registerId);
    return row ? {value: row.value, source: `register:${ref.registerId}`, status: row.status, confidence: row.confidence} : null;
  }});
  if (value.status !== "evaluated" || !value.economics || value.levers[1]?.status !== "zero_no_release_path" ||
      value.levers[1]?.annualCents?.base !== 0) throw new Error("value_preview_not_evaluated_or_capacity_not_zero");
  const cents = (number: number) => number / 100;
  const economics = value.economics;
  return {
    status: "local_synthetic_simulation_only", datasetId: seed.dataset_id, moveId: MOVE_ID,
    seedSha256: hash(seedText), benchmarkSha256: hash(benchmarkText), existingSeedSha256: hash(existingText),
    sourceSetSha256: hash(`${seedText}\n${benchmarkText}\n${existingText}`),
    approval: "absent; no load authorized", liveRegisterReadback: "not_run", captureWrite: "not_run",
    proposedRows: seed.rows.map((row: {seed_key: string;expected_register_id: string;working_value: number;unit: string;owner_role: string;confidence: number;confirm: unknown}) =>
      ({key:row.seed_key, expectedRegisterId:row.expected_register_id, value:row.working_value, unit:row.unit, ownerRole:row.owner_role, confidence:row.confidence, confirmedSyntheticBenchmark:Boolean(row.confirm)})),
    existingRefs: seed.existing_register_refs, registerIdCaveat: "Expected IDs are conditional on exact live register state; apply must refuse drift.",
    costBasis:{kind:"approved_p3_rom_required_for_live",liveSnapshot:"pending",previewSnapshot:"local-synthetic-preview-unapproved",
      lowDollars:rom.total.lowCents/100,planDollars:rom.total.planCents/100,highDollars:rom.total.highCents/100,
      budgetCeilingDollars:budgetCents/100,planShareOfCeiling:rom.total.planCents/budgetCents,
      withinBudgetCeiling:rom.total.planCents<=budgetCents},
    levers: model.model.case.levers.map((lever) => ({id:lever.id,name:lever.name,conversion:lever.conversion,
      registerRefs:refs.filter((ref) => ref.key.startsWith(`${lever.id}.`)),
      timingRegisterRef:seed.value_plan_bindings[`levers.${lever.id}.timing.startMonth`],
      result:value.levers.find((result) => result.leverId === lever.id)})),
    rom: {rateBasis:`synthetic local bill-rate fixture only; ${rates.pod_senior_fte} FTE at $${rates.senior_loaded_usd_per_hour*rates.bill_to_loaded_multiplier}/h and ${rates.pod_engineer_fte} FTE at $${rates.engineer_loaded_usd_per_hour*rates.bill_to_loaded_multiplier}/h`,
      podFte:rates.pod_senior_fte+rates.pod_engineer_fte,
      productiveHoursPerWeek:(rates.pod_senior_fte+rates.pod_engineer_fte)*benchmark.rom_factors.hours_per_fte_week*benchmark.rom_factors.productive_share, schedule:seed.program_schedule,
      foundation:{code:rom.foundation.priced.code,hours:rom.foundation.priced.hours,weeks:rom.foundation.priced.weeks,
        lowDollars:cents(rom.foundation.priced.range.lowCents),planDollars:cents(rom.foundation.priced.range.planCents),
        highDollars:cents(rom.foundation.priced.range.highCents)},releases:rom.releases.map((release) =>
      ({code:release.code,name:release.name,hours:release.own.hours,weeks:release.own.weeks,
        lowDollars:cents(release.own.range.lowCents),planDollars:cents(release.own.range.planCents),highDollars:cents(release.own.range.highCents)})),
      total:{hours:rom.total.hours,weeks:rom.total.weeks,lowDollars:cents(rom.total.lowCents),
        planDollars:cents(rom.total.planCents),highDollars:cents(rom.total.highCents)}},
    value:{status:value.status,engineReadyForApproval:value.readyForApproval,
      approvalEligible:value.readyForApproval&&value.mustValidate.length===0,
      validationState:value.mustValidate.length?"provisional_open_register_inputs":"validated_inputs",
      mustValidate:value.mustValidate,
      annualCashDollars:cents(economics.annualCashCents.base),
      byYearPaidDollars:economics.threeYearBases?.base.creditedPaid.annualCents.map(cents),
      npvDollars:cents(economics.npvCents.base),paybackMonth:economics.paybackMonth.base,
      roi:economics.threeYearBases?.base.creditedPaid.roi,
      analystCapacityAnnualCents:value.levers[1].annualCents?.base,
      analystCapacityHours:value.levers[1].nonMoneyMetric?.value.base},
  };
}

if (process.argv[1]?.endsWith("preview-demo-case-numbers.ts")) {
  const proof = previewCaseNumbers();
  const output = `${JSON.stringify(proof, null, 2)}\n`;
  if (process.argv.includes("--write-proof")) writeFileSync(PROOF_PATH, output);
  process.stdout.write(output);
}
