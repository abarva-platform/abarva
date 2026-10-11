#!/usr/bin/env tsx

/** Offline-only proposal preview. This module has no data-plane or network imports. */
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { evaluateValueCase } from "../../src/lib/programs/value-engine";
import { resolveCostBasis, withCostBasis } from "../../src/lib/programs/value-engine/cost-basis";
import { readValueModel } from "../../src/lib/programs/value-model-capture";
import { registerInputRefs } from "../../src/lib/programs/value-engine/register-inputs";
import { computeRom, type RomStructure } from "../../src/lib/pricing/moves-workflow/rom-service";
import { createCommittedRomReferenceLoaders, ROM_REFERENCE_SOURCE } from "../../src/lib/pricing/moves-workflow/rom-reference";
import { buildRomWorkbook } from "../../src/lib/pricing/moves-workflow/rom-workbook";
import { ROM_DRIVERS } from "../../src/lib/pricing/moves-workflow/rom-drivers";

export const SEED_PATH = "datasets/tenant-inputs/meridian-health/moves/demo-case-numbers-seed-v1.json";
export const BENCHMARK_PATH = "scripts/moves/fixtures/demo-case-numbers/synthetic-benchmarks-v1.json";
export const PROOF_PATH = "docs/releases/proofs/2026-10-10-moves-demo-case-numbers-local-preview.json";
export const WORKBOOK_PATH = "docs/releases/proofs/2026-10-10-moves-demo-case-numbers-rom-workbook.xlsx";
export const OPTION_B_WORKBOOK_PATH = "docs/releases/proofs/2026-10-10-moves-demo-case-numbers-rom-option-b-workbook.xlsx";
export const COST_PACK_FILES = ["pricing_roles.csv", "pricing_rate_bands.csv", "pricing_delivery_locations.csv", "pricing_provider_classes.csv", "pricing_pod_templates.csv", "pricing_pod_template_roles.csv"] as const;
const EXISTING_PATH = "datasets/tenant-inputs/meridian-health/moves/demo-assumption-register-seed.json";
const MOVE_ID = "1557f032-5a5c-4475-abe5-b1a841576649";

const hash = (value: string) => createHash("sha256").update(value).digest("hex");
const read = (name: string) => readFileSync(name, "utf8");
export const costPackTexts = () => COST_PACK_FILES.map((file) => read(`datasets/reference/pricing-engine-v1/${file}`));
export const costPackSha256 = () => hash(costPackTexts().join("\n"));
const OWNER_ROLES = ["Finance business partner","Transformation office program lead","BI and analytics enablement lead"];
const naturalKey = (area:string,statement:string) => `${area}:${hash(statement.trim().replace(/\s+/g," ").toLowerCase())}`;

export function buildCasePreview(input: {seedText?: string; benchmarkText?: string} = {}) {
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
  const live=seed.live_id_preflight;
  if (live?.observed_current_phase!==3 || live?.next_allocations_at_observation?.delivery!=="DL7" ||
      live?.next_allocations_at_observation?.value!=="V6" ||
      live?.read_only_operator_execution!=="job-abarva-private-operator-eus-9gtw0w6" ||
      JSON.stringify(live?.occupied_register_rows?.map((row:{register_id:string})=>row.register_id))!==JSON.stringify(["DL5","DL6","V5"]))
    throw new Error("live_id_preflight_contract_invalid");
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
  if (benchmark.rate_reference !== undefined || structure.pod.rateBasis !== "bill_rate" ||
      structure.pod.locationCode !== "LOC-DALLAS" || structure.pod.providerClassCode !== "SI-T1" ||
      structure.pod.members?.reduce((fte,member)=>fte+member.fte,0) !== 10 ||
      !structure.pod.members?.every((member)=>member.proposedMapping === true))
    throw new Error("foundation_pod_contract_invalid");
  const loaders = createCommittedRomReferenceLoaders();
  const rom = computeRom(structure, loaders);
  if (!rom.ok) throw new Error(`rom_refused:${rom.code}:${rom.message}`);
  const optionB = computeRom({ ...structure, pod: {
    ...structure.pod,
    members: structure.pod.members!.map((member) =>
      member.roleCode === "ROL-024" || member.roleCode === "ROL-023"
        ? { ...member, locationCode: "LOC-DALLAS", providerClassCode: "SI-T1" }
        : { ...member, locationCode: "LOC-INDIA-TIER-1", providerClassCode: "SI-T2" }),
  } }, loaders);
  if (!optionB.ok) throw new Error(`option_b_rom_refused:${optionB.code}:${optionB.message}`);
  if (optionB.total.hours !== rom.total.hours || optionB.total.weeks !== rom.total.weeks ||
      optionB.pod.members.reduce((fte, member) => fte + member.fte, 0) !== 10)
    throw new Error("delivery_options_scope_or_capacity_drift");
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
  if (!Number.isSafeInteger(budgetCents) || budgetCents <= 0)
    throw new Error("budget_ceiling_invalid");
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
  const optionRateLines = (priced: typeof rom) => priced.releases[0].own.pod.memberLines.map((line,index)=>({
    roleCode:line.member.roleCode,levelCode:line.member.levelCode,fte:line.member.fte,
    locationCode:line.member.locationCode,providerClassCode:line.member.providerClassCode,
    mappingStatus:priced.pod.memberMappingStatus[index],
    hourlyRateCents:line.rate.hourlyRateCents,baseRateCents:line.rate.baseRateCents,
    baseSource:line.rate.baseSource,location:line.rate.location,provider:line.rate.provider,
    provenance:line.rate.notes,rateStatus:"planning rates, not approved",
  }));
  const optionSummary = (priced: typeof rom) => ({
    hours:priced.total.hours,weeks:priced.total.weeks,
    lowDollars:cents(priced.total.lowCents),planDollars:cents(priced.total.planCents),
    highDollars:cents(priced.total.highCents),
    blocks:[...(priced.foundation?[priced.foundation.priced]:[]),...priced.releases.map((release)=>release.own)]
      .map((block)=>({code:block.code,hours:block.hours,weeks:block.weeks,
        lowDollars:cents(block.range.lowCents),planDollars:cents(block.range.planCents),
        highDollars:cents(block.range.highCents)})),
    rateLines:optionRateLines(priced),
  });
  const economics = value.economics;
  const proof = {
    status: "local_synthetic_simulation_only", datasetId: seed.dataset_id, moveId: MOVE_ID,
    seedSha256: hash(seedText), benchmarkSha256: hash(benchmarkText), existingSeedSha256: hash(existingText),
    costPackSha256: costPackSha256(), costPackFiles: COST_PACK_FILES,
    sourceSetSha256: hash([seedText,benchmarkText,existingText,...costPackTexts()].join("\n")),
    approval: "absent; no load authorized", liveRegisterReadback: "read_only_operator_snapshot",liveIdPreflight:live,captureWrite: "not_run",
    proposedRows: seed.rows.map((row: {seed_key: string;expected_register_id: string;working_value: number;unit: string;owner_role: string;confidence: number;confirm: unknown}) =>
      ({key:row.seed_key, expectedRegisterId:row.expected_register_id, value:row.working_value, unit:row.unit, ownerRole:row.owner_role, confidence:row.confidence, confirmedSyntheticBenchmark:Boolean(row.confirm)})),
    existingRefs: seed.existing_register_refs, registerIdCaveat: "Expected IDs are conditional on exact live register state; apply must refuse drift.",
    costBasis:{kind:"approved_p3_rom_required_for_live",liveSnapshot:"pending",previewSnapshot:"local-synthetic-preview-unapproved",
      lowDollars:rom.total.lowCents/100,planDollars:rom.total.planCents/100,highDollars:rom.total.highCents/100,
      budgetCeilingDollars:budgetCents/100,planShareOfCeiling:rom.total.planCents/budgetCents,
      withinBudgetCeiling:rom.total.planCents<=budgetCents},
    deliveryOptions:{status:"comparison_only; neither selected nor approved",rateStatus:"planning rates, not approved",
      optionA:{label:"Dallas SI-T1 proposed pod",...optionSummary(rom)},
      optionB:{label:"Dallas SI-T1 leads with India Tier 1 SI-T2 engineering and BI",...optionSummary(optionB)}},
    levers: model.model.case.levers.map((lever) => ({id:lever.id,name:lever.name,conversion:lever.conversion,
      registerRefs:refs.filter((ref) => ref.key.startsWith(`${lever.id}.`)),
      timingRegisterRef:seed.value_plan_bindings[`levers.${lever.id}.timing.startMonth`],
      result:value.levers.find((result) => result.leverId === lever.id)})),
    rom: {rateBasis:`${ROM_REFERENCE_SOURCE}; proposed TWR-04 Data Product expansion, unapproved; planning rates, not approved`,
      pod:rom.pod,
      rateLines:rom.releases[0].own.pod.memberLines.map((line,index)=>({
        roleCode:line.member.roleCode,levelCode:line.member.levelCode,fte:line.member.fte,
        locationCode:line.member.locationCode,providerClassCode:line.member.providerClassCode,
        mappingStatus:rom.pod.memberMappingStatus[index],
        hourlyRateCents:line.rate.hourlyRateCents,baseRateCents:line.rate.baseRateCents,
        baseSource:line.rate.baseSource,location:line.rate.location,provider:line.rate.provider,
        provenance:line.rate.notes})),
      podFte:10,
      productiveHoursPerWeek:10*benchmark.rom_factors.hours_per_fte_week*benchmark.rom_factors.productive_share, schedule:seed.program_schedule,
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
  return {proof,rom,optionB};
}

export function previewCaseNumbers(input: {seedText?: string; benchmarkText?: string} = {}): Record<string, unknown> {
  return buildCasePreview(input).proof;
}

if (process.argv[1]?.endsWith("preview-demo-case-numbers.ts")) {
  const {proof,rom,optionB} = buildCasePreview();
  const output = `${JSON.stringify(proof, null, 2)}\n`;
  if (process.argv.includes("--write-proof")) {
    writeFileSync(PROOF_PATH, output);
    const {workbook} = buildRomWorkbook(rom);
    workbook.xlsx.writeFile(WORKBOOK_PATH).catch((error)=>{console.error(error);process.exitCode=1;});
    const {workbook:optionBWorkbook} = buildRomWorkbook(optionB);
    optionBWorkbook.xlsx.writeFile(OPTION_B_WORKBOOK_PATH).catch((error)=>{console.error(error);process.exitCode=1;});
  }
  process.stdout.write(output);
}
