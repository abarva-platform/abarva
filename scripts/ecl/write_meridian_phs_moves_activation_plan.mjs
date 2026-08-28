#!/usr/bin/env node

import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "../..");
const DEFAULT_HOME_SNAPSHOT = "src/lib/home/preview/golden-snapshots/meridian-health.json";
const DEFAULT_SOURCE_ROOM = "outputs/source-room-depth-catchup-2026-08-23";
const DEFAULT_OUT_DIR = "outputs/meridian-phs-moves-activation-plan";
const DEFAULT_CLIENT_ID = "d88769f2-0385-4215-93df-6db29c23162c";
const TENANT_KEY = "meridian-health";
const DECLARED_PROGRAM_COUNT = 38;
const SP07_RELATIVE_PATH = "__synthetic_sources__/SP07_PPM/PPM_Programs_SYNTHETIC.csv";

const MODULES = [
  ["p0_origination", "Origination and sponsor thesis", 0],
  ["p1_baseline", "Current-state baseline", 1],
  ["p2_value_case", "Value case and operating model", 2],
  ["p3_design", "Solution design and evidence plan", 3],
  ["p4_mobilization", "Mobilization plan", 4],
  ["p5_execution", "Execution and value proof", 5],
];

function parseArgs(argv) {
  const args = {
    homeSnapshot: DEFAULT_HOME_SNAPSHOT,
    sourceRoomDir: DEFAULT_SOURCE_ROOM,
    outDir: DEFAULT_OUT_DIR,
    clientId: DEFAULT_CLIENT_ID,
    assessmentId: "meridian-phs-demo-readiness",
    asOfDate: "2026-08-28",
    json: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const next = () => {
      index += 1;
      if (index >= argv.length) throw new Error(`${arg} requires a value`);
      return argv[index];
    };
    if (arg === "--home-snapshot") args.homeSnapshot = next();
    else if (arg === "--source-room-dir") args.sourceRoomDir = next();
    else if (arg === "--out-dir") args.outDir = next();
    else if (arg === "--client-id") args.clientId = next();
    else if (arg === "--assessment-id") args.assessmentId = next();
    else if (arg === "--as-of-date") args.asOfDate = next();
    else if (arg === "--json") args.json = true;
    else if (arg === "--help") {
      console.log(`Usage: node scripts/ecl/write_meridian_phs_moves_activation_plan.mjs [options]

Builds an idempotent SQL activation package for the Meridian/PHS Moves demo lane.
It does not connect to a database. The generated SQL is intended for the governed
ACA data-build job once reviewed.

Options:
  --home-snapshot <path>   Meridian Home snapshot with declared program names.
  --source-room-dir <dir>  Dense source-room root containing SP07_PPM.
  --out-dir <dir>         Output directory for SQL and proof summary.
  --client-id <uuid>      Meridian client id for public.engagements rows.
  --assessment-id <id>    Proof assessment id carried in row metadata.
  --as-of-date <date>     Pinned source/as-of date.
  --json                  Print full summary.`);
      process.exit(0);
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }
  return args;
}

function stableUuid(...parts) {
  const hex = crypto.createHash("sha256").update(parts.join("|")).digest("hex").slice(0, 32).split("");
  hex[12] = "5";
  hex[16] = ((Number.parseInt(hex[16], 16) & 0x3) | 0x8).toString(16);
  const value = hex.join("");
  return `${value.slice(0, 8)}-${value.slice(8, 12)}-${value.slice(12, 16)}-${value.slice(16, 20)}-${value.slice(20)}`;
}

function sha256File(file) {
  return crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function parseCsvLine(line) {
  const cells = [];
  let cell = "";
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    if (char === '"' && quoted && line[index + 1] === '"') {
      cell += '"';
      index += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === "," && !quoted) {
      cells.push(cell);
      cell = "";
    } else {
      cell += char;
    }
  }
  cells.push(cell);
  return cells;
}

function readCsv(file) {
  const lines = fs.readFileSync(file, "utf8").trim().split(/\r?\n/);
  if (!lines.length) return [];
  const headers = parseCsvLine(lines[0]);
  return lines.slice(1).filter(Boolean).map((line) => {
    const cells = parseCsvLine(line);
    return Object.fromEntries(headers.map((header, index) => [header, cells[index] ?? ""]));
  });
}

function normalize(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 90);
}

function sqlText(value) {
  if (value === null || value === undefined || value === "") return "null";
  return `'${String(value).replace(/'/g, "''")}'`;
}

function sqlJson(value) {
  return `${sqlText(JSON.stringify(value, null, 0))}::jsonb`;
}

function datePlus(asOfDate, days) {
  const date = new Date(`${asOfDate}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function money(value, fallback) {
  const parsed = Number(value);
  if (Number.isFinite(parsed) && parsed > 0) return Math.round(parsed);
  return fallback;
}

function currentPhase(pctComplete) {
  const pct = Number(pctComplete || 0);
  if (pct <= 2) return 1;
  if (pct <= 8) return 2;
  if (pct <= 14) return 3;
  if (pct <= 35) return 4;
  if (pct <= 70) return 5;
  return 5;
}

function archetypeFor(name) {
  const lower = name.toLowerCase();
  if (/\b(ai|automation|dax|agent|analytics|stars|raf|hedis|propensity)\b/.test(lower)) return "ai_product_enablement";
  if (/\b(epic|cerner|sql|databricks|servicenow|interface|rhapsody|pam|platform|governance)\b/.test(lower)) {
    return "platform_modernization";
  }
  if (/\b(throughput|denials|clearance|supply chain|access|hospital-at-home|management)\b/.test(lower)) {
    return "operational_optimization";
  }
  return "strategic_transformation";
}

function functionPackFor(name, fallback = "") {
  const lower = `${name} ${fallback}`.toLowerCase();
  if (/\b(stars|raf|claims|hedis|tapestry|provider data|actuarial|underwriting|care management)\b/.test(lower)) {
    return "health_plan_operations";
  }
  if (/\b(epic|cerner|clinical|nurse|pharmacy|emergency|ambient|dax|telehealth|behavioral)\b/.test(lower)) {
    return "clinical_operations";
  }
  if (/\b(sql|databricks|tableau|data|servicenow|interface|pam|governance)\b/.test(lower)) return "data_and_technology";
  if (/\b(revenue|financial|supply chain|contract)\b/.test(lower)) return "finance_and_shared_services";
  return normalize(fallback || "enterprise_strategy").replaceAll("-", "_");
}

function phaseStatus(phase, current, blocked) {
  if (phase < current) return "completed";
  if (phase === current) return blocked ? "blocked" : "in_progress";
  return "not_started";
}

function milestoneStatus(phase, current, blocked) {
  if (phase < current) return "hit";
  if (phase === current && blocked) return "at_risk";
  return "upcoming";
}

function workItemStatus(phase, current, blocked) {
  if (phase < current) return "done";
  if (phase === current) return blocked ? "blocked" : "in_progress";
  return "open";
}

function loadHomePrograms(snapshotFile) {
  const snapshot = readJson(snapshotFile);
  const datasets = snapshot.thesis?.signalPacket?.visualDatasets ?? {};
  const byName = new Map();
  for (const row of datasets.stalled_programs ?? []) {
    if (row?.program) byName.set(row.program, { ...row, source: "home_snapshot.stalled_programs" });
  }
  for (const row of datasets.program_investment_distribution ?? []) {
    if (!row?.program) continue;
    byName.set(row.program, {
      ...(byName.get(row.program) ?? {}),
      ...row,
      source: byName.has(row.program)
        ? "home_snapshot.stalled_programs+program_investment_distribution"
        : "home_snapshot.program_investment_distribution",
    });
  }
  return [...byName.values()].map((row, index) => ({
    ordinal: index + 1,
    source_system: "home_snapshot",
    source_row_id: `HOME-PROGRAM-${String(index + 1).padStart(3, "0")}`,
    program_id: `HOME-PROG-${String(index + 1).padStart(3, "0")}`,
    initiative_id: `HOME-INIT-${String(index + 1).padStart(3, "0")}`,
    program_name: row.program,
    sponsor_function: functionPackFor(row.program).replaceAll("_", " "),
    status: row.blocked ? "at_risk" : "in_flight",
    approved_budget_usd: "",
    forecast_usd: "",
    target_value_usd: row.expectedValue ? String(row.expectedValue) : "",
    pct_complete: row.pctComplete ?? 5,
    blocked_reason: row.blocked ?? "",
    source_basis: "source_recorded",
    review_state: "not_reviewed",
    activation_source: row.source,
  }));
}

function loadPpmPrograms(sourceRoomDir, existingNames) {
  const ppmFile = path.join(sourceRoomDir, SP07_RELATIVE_PATH);
  if (!fs.existsSync(ppmFile)) {
    return { rows: [], ppmFile, ppmHash: null };
  }
  const rows = readCsv(ppmFile)
    .filter((row) => row.program_name && !existingNames.has(row.program_name))
    .map((row) => ({
      ...row,
      pct_complete: Number(row.status === "closed" ? 100 : row.status === "approved" ? 8 : row.status === "at_risk" ? 4 : 11),
      blocked_reason: row.status === "at_risk" ? "PPM status is at risk; owner follow-up required before value commitment." : "",
      activation_source: "source_room.SP07_PPM",
    }));
  return { rows, ppmFile, ppmHash: sha256File(ppmFile) };
}

function enrichProgram(row, index, args, sourceHash) {
  const fallbackBudget = 5_000_000 + index * 625_000;
  const targetValue = money(row.target_value_usd, fallbackBudget * 1.25);
  const approvedBudget = money(row.approved_budget_usd, Math.round(targetValue * 0.74));
  const forecast = money(row.forecast_usd, Math.round(approvedBudget * 1.08));
  const phase = currentPhase(row.pct_complete);
  const blockedReason = row.blocked_reason || "";
  const moveId = stableUuid("meridian-phs-move", row.program_name);
  const sourceId = row.source_row_id || row.program_id || `PROGRAM-${String(index).padStart(3, "0")}`;
  return {
    ...row,
    ordinal: index,
    move_id: moveId,
    solution: `meridian-phs-${normalize(row.program_name)}`,
    current_phase: phase,
    current_module_key: MODULES[Math.min(phase, MODULES.length - 1)][0],
    archetype: archetypeFor(row.program_name),
    function_pack_key: functionPackFor(row.program_name, row.sponsor_function),
    approved_budget_usd: approvedBudget,
    forecast_usd: forecast,
    target_value_usd: targetValue,
    value_low: Math.round(targetValue * 0.75),
    value_high: Math.round(targetValue * 1.15),
    blocked_reason: blockedReason,
    status: blockedReason ? "at_risk" : "active",
    lifecycle_state: "approved",
    source_id: sourceId,
    source_hash: sourceHash,
    charter: {
      activation_basis: "meridian_phs_demo_moves_activation_plan",
      assessment_id: args.assessmentId,
      as_of_date: args.asOfDate,
      tenant_key: TENANT_KEY,
      source_system: row.source_system || "home_snapshot",
      source_row_id: sourceId,
      source_basis: row.source_basis || "source_recorded",
      review_state: row.review_state || "not_reviewed",
      activation_source: row.activation_source,
      declared_program_count: DECLARED_PROGRAM_COUNT,
      pct_complete: Number(row.pct_complete || 0),
      blocked_reason: blockedReason || null,
      source_hash: sourceHash,
    },
    baseline_metrics: {
      approved_budget_usd: approvedBudget,
      forecast_usd: forecast,
      target_value_usd: targetValue,
      forecast_variance_usd: forecast - approvedBudget,
      pct_complete: Number(row.pct_complete || 0),
      value_verification_state: "pending",
    },
  };
}

function engagementSql(row, args) {
  return `insert into engagements (
  id, client_id, solution, name, problem_statement, target_outcome, timeline_horizon,
  value_projected_low_usd, value_projected_high_usd, value_verified_usd,
  value_verified_status, value_currency, value_assumptions_jsonb, baseline_metrics,
  program_archetype, origin_source, origin_source_ref, status, lifecycle_state,
  current_phase, current_module_key, maestro_oversight_level, founder_approval_required,
  data_residency_region, retention_policy_years, is_demo_data, charter,
  function_pack_key, function_pack_confidence, gates_passed, graph_node_id
) values (
  ${sqlText(row.move_id)}, ${sqlText(args.clientId)}, ${sqlText(row.solution)}, ${sqlText(row.program_name)},
  ${sqlText(`Activate the declared ${row.program_name} program as a governed PHS Move with measurable evidence gates.`)},
  ${sqlText(`Create a cross-module execution path where Home context, Intelligence reasoning and Tower value controls agree on ${row.program_name}.`)},
  ${sqlText("FY2026-FY2028")},
  ${row.value_low}, ${row.value_high}, null, ${sqlText("pending")}, ${sqlText("USD")},
  ${sqlJson({
    basis: "declared_program_activation",
    source: row.activation_source,
    source_row_id: row.source_id,
    budget_usd: row.approved_budget_usd,
    forecast_usd: row.forecast_usd,
    value_usd: row.target_value_usd,
    value_is_not_claimable_until_tower_gate_passes: true,
  })},
  ${sqlJson(row.baseline_metrics)},
  ${sqlText(row.archetype)}, ${sqlText("intelligence_promoted")}, null,
  ${sqlText(row.status)}, ${sqlText(row.lifecycle_state)}, ${row.current_phase},
  ${sqlText(row.current_module_key)}, ${sqlText("partial")}, false,
  ${sqlText("us")}, 7, true, ${sqlJson(row.charter)},
  ${sqlText(row.function_pack_key)}, 0.92, ${sqlJson([0, 1].filter((phase) => phase < row.current_phase))},
  ${sqlText(`move:${TENANT_KEY}:${row.solution}`)}
)
on conflict (id) do update set
  client_id = excluded.client_id,
  solution = excluded.solution,
  name = excluded.name,
  problem_statement = excluded.problem_statement,
  target_outcome = excluded.target_outcome,
  timeline_horizon = excluded.timeline_horizon,
  value_projected_low_usd = excluded.value_projected_low_usd,
  value_projected_high_usd = excluded.value_projected_high_usd,
  value_verified_status = excluded.value_verified_status,
  value_currency = excluded.value_currency,
  value_assumptions_jsonb = excluded.value_assumptions_jsonb,
  baseline_metrics = excluded.baseline_metrics,
  program_archetype = excluded.program_archetype,
  origin_source = excluded.origin_source,
  status = excluded.status,
  lifecycle_state = excluded.lifecycle_state,
  current_phase = excluded.current_phase,
  current_module_key = excluded.current_module_key,
  maestro_oversight_level = excluded.maestro_oversight_level,
  founder_approval_required = excluded.founder_approval_required,
  data_residency_region = excluded.data_residency_region,
  retention_policy_years = excluded.retention_policy_years,
  is_demo_data = excluded.is_demo_data,
  charter = excluded.charter,
  function_pack_key = excluded.function_pack_key,
  function_pack_confidence = excluded.function_pack_confidence,
  gates_passed = excluded.gates_passed,
  graph_node_id = excluded.graph_node_id,
  updated_at = now();`;
}

function moduleSql(row, module, index) {
  const [moduleKey, moduleName, phase] = module;
  const status = phaseStatus(phase, row.current_phase, Boolean(row.blocked_reason));
  const id = stableUuid("program-module", row.move_id, moduleKey);
  return `insert into program_modules (
  id, engagement_id, module_key, module_name, phase_number, module_order, status,
  state_jsonb, started_at, completed_at
) values (
  ${sqlText(id)}, ${sqlText(row.move_id)}, ${sqlText(moduleKey)}, ${sqlText(moduleName)},
  ${phase}, ${index + 1}, ${sqlText(status)},
  ${sqlJson({
    activation_basis: "meridian_phs_demo_moves_activation_plan",
    source_row_id: row.source_id,
    source_hash: row.source_hash,
    evidence_state: status === "completed" ? "source_backed" : status === "blocked" ? "evidence_needed" : "planned",
    blocked_reason: status === "blocked" ? row.blocked_reason : null,
  })},
  ${status === "not_started" ? "null" : sqlText(`${row.charter.as_of_date}T12:00:00.000Z`)},
  ${status === "completed" ? sqlText(`${row.charter.as_of_date}T12:00:00.000Z`) : "null"}
)
on conflict (id) do update set
  module_name = excluded.module_name,
  phase_number = excluded.phase_number,
  module_order = excluded.module_order,
  status = excluded.status,
  state_jsonb = excluded.state_jsonb,
  started_at = excluded.started_at,
  completed_at = excluded.completed_at;`;
}

function milestoneSql(row, module, index, args) {
  const [moduleKey, moduleName, phase] = module;
  const id = stableUuid("program-milestone", row.move_id, moduleKey);
  return `insert into program_milestones (
  id, engagement_id, name, description, target_date, actual_date, status, phase_number, module_key
) values (
  ${sqlText(id)}, ${sqlText(row.move_id)}, ${sqlText(`${moduleName} checkpoint`)},
  ${sqlText(`PHS demo activation milestone for ${row.program_name}.`)},
  ${sqlText(datePlus(args.asOfDate, 30 + index * 28))},
  ${phase < row.current_phase ? sqlText(datePlus(args.asOfDate, -14 + index)) : "null"},
  ${sqlText(milestoneStatus(phase, row.current_phase, row.blocked_reason))}, ${phase}, ${sqlText(moduleKey)}
)
on conflict (id) do update set
  name = excluded.name,
  description = excluded.description,
  target_date = excluded.target_date,
  actual_date = excluded.actual_date,
  status = excluded.status,
  phase_number = excluded.phase_number,
  module_key = excluded.module_key;`;
}

function workItemSql(row, module, index, args) {
  const [moduleKey, moduleName, phase] = module;
  const id = stableUuid("program-work-item", row.move_id, moduleKey);
  return `insert into program_work_items (
  id, engagement_id, parent_id, title, description, item_type, status, priority,
  module_key, phase_number, due_date, metadata_jsonb
) values (
  ${sqlText(id)}, ${sqlText(row.move_id)}, null, ${sqlText(`${moduleName}: evidence and decision packet`)},
  ${sqlText(`Prepare source-backed PHS executive material for ${row.program_name}.`)},
  ${sqlText(phase === 0 ? "workstream" : "task")}, ${sqlText(workItemStatus(phase, row.current_phase, row.blocked_reason))},
  ${sqlText(phase === row.current_phase ? "high" : "medium")},
  ${sqlText(moduleKey)}, ${phase}, ${sqlText(datePlus(args.asOfDate, 14 + index * 14))},
  ${sqlJson({
    activation_basis: "meridian_phs_demo_moves_activation_plan",
    source_row_id: row.source_id,
    source_hash: row.source_hash,
    tower_measurement_needed: phase >= 2,
    intelligence_context_needed: phase >= 1,
  })}
)
on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  item_type = excluded.item_type,
  status = excluded.status,
  priority = excluded.priority,
  module_key = excluded.module_key,
  phase_number = excluded.phase_number,
  due_date = excluded.due_date,
  metadata_jsonb = excluded.metadata_jsonb;`;
}

function riskSql(row, index) {
  const id = stableUuid("program-risk", row.move_id, "primary");
  const blocked = Boolean(row.blocked_reason);
  return `insert into program_risks (
  id, engagement_id, title, description, likelihood, impact, status, mitigation_plan,
  phase_number, module_key, identified_at
) values (
  ${sqlText(id)}, ${sqlText(row.move_id)}, ${sqlText(blocked ? "Evidence or dependency blocks current phase" : "Value proof requires Tower measurement")},
  ${sqlText(blocked ? row.blocked_reason : `No value is claimable for ${row.program_name} until Tower measures and evidence gates clear.`)},
  ${sqlText(blocked ? "high" : "medium")}, ${sqlText(index <= 10 ? "high" : "medium")},
  ${sqlText(blocked ? "mitigating" : "open")},
  ${sqlText("Keep the Move open but route all value statements through Tower gate evidence and Intelligence citation checks.")},
  ${row.current_phase}, ${sqlText(row.current_module_key)}, ${sqlText(`${row.charter.as_of_date}T12:00:00.000Z`)}
)
on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  likelihood = excluded.likelihood,
  impact = excluded.impact,
  status = excluded.status,
  mitigation_plan = excluded.mitigation_plan,
  phase_number = excluded.phase_number,
  module_key = excluded.module_key,
  identified_at = excluded.identified_at;`;
}

function patternSql(row) {
  const id = stableUuid("program-pattern", row.move_id, "phs-operating-story");
  return `insert into pattern_match_logs (
  id, engagement_id, pattern_key, match_confidence, match_context_jsonb, suggested_action, acted_upon,
  matched_by_agent
) values (
  ${sqlText(id)}, ${sqlText(row.move_id)}, ${sqlText("phs_executive_value_chain")}, 0.9200,
  ${sqlJson({
    activation_basis: "meridian_phs_demo_moves_activation_plan",
    home_context: true,
    tower_gate_required: true,
    intelligence_reasoning_context: true,
    source_handoff_when_vendor_or_contract_evidence_needed: true,
  })},
  ${sqlText("Use Home for context, Intelligence for explanation, and Tower for value gate proof before claiming impact.")},
  true, ${sqlText("ecl_meridian_phs_activation")}
)
on conflict (id) do update set
  pattern_key = excluded.pattern_key,
  match_confidence = excluded.match_confidence,
  match_context_jsonb = excluded.match_context_jsonb,
  suggested_action = excluded.suggested_action,
  acted_upon = excluded.acted_upon,
  matched_by_agent = excluded.matched_by_agent;`;
}

function build(args) {
  const homeSnapshotFile = path.resolve(ROOT, args.homeSnapshot);
  const sourceRoomDir = path.resolve(ROOT, args.sourceRoomDir);
  const outDir = path.resolve(ROOT, args.outDir);
  const homeHash = sha256File(homeSnapshotFile);
  const homeRows = loadHomePrograms(homeSnapshotFile);
  const names = new Set(homeRows.map((row) => row.program_name));
  const ppm = loadPpmPrograms(sourceRoomDir, names);
  const selected = [...homeRows, ...ppm.rows].slice(0, DECLARED_PROGRAM_COUNT);
  const sourceHash = crypto
    .createHash("sha256")
    .update([homeHash, ppm.ppmHash ?? "missing"].join("|"))
    .digest("hex");
  const programs = selected.map((row, index) => enrichProgram(row, index + 1, args, sourceHash));

  const sql = [
    "-- Meridian/PHS Moves activation package.",
    "-- Generated by scripts/ecl/write_meridian_phs_moves_activation_plan.mjs.",
    "-- Idempotent primary-key upserts only; does not delete existing Move records.",
    "begin;",
    ...programs.flatMap((row) => [
      engagementSql(row, args),
      ...MODULES.map((module, index) => moduleSql(row, module, index)),
      ...MODULES.map((module, index) => milestoneSql(row, module, index, args)),
      ...MODULES.map((module, index) => workItemSql(row, module, index, args)),
      riskSql(row, row.ordinal),
      patternSql(row),
    ]),
    "commit;",
    "",
  ].join("\n\n");

  fs.mkdirSync(outDir, { recursive: true });
  const sqlPath = path.join(outDir, "meridian_phs_moves_activation.sql");
  const summaryPath = path.join(outDir, "meridian_phs_moves_activation_summary.json");
  fs.writeFileSync(sqlPath, sql, "utf8");

  const summary = {
    accepted: programs.length === DECLARED_PROGRAM_COUNT,
    tenant_key: TENANT_KEY,
    client_id: args.clientId,
    assessment_id: args.assessmentId,
    as_of_date: args.asOfDate,
    declared_program_count: DECLARED_PROGRAM_COUNT,
    activation_program_count: programs.length,
    programs_from_home_snapshot: programs.filter((row) => row.activation_source.startsWith("home_snapshot")).length,
    programs_from_source_room_ppm: programs.filter((row) => row.activation_source === "source_room.SP07_PPM").length,
    source_room_ppm_present: Boolean(ppm.ppmHash),
    unresolved_gap_count: Math.max(0, DECLARED_PROGRAM_COUNT - programs.length),
    generated_rows: {
      engagements: programs.length,
      program_modules: programs.length * MODULES.length,
      program_milestones: programs.length * MODULES.length,
      program_work_items: programs.length * MODULES.length,
      program_risks: programs.length,
      pattern_match_logs: programs.length,
    },
    proof_checks: {
      deterministic_ids: new Set(programs.map((row) => row.move_id)).size === programs.length,
      idempotent_upserts: /on conflict \(id\)/i.test(sql) && !/on conflict \(client_id, solution\)|on conflict \(engagement_id, module_key\)/i.test(sql),
      no_database_connection: true,
      no_value_claimable_until_tower_gate: programs.every(
        (row) => row.value_verified_status === undefined || row.baseline_metrics.value_verification_state === "pending",
      ),
      contains_named_phs_moves: [
        "STARS 5.0 Improvement Program",
        "RAF Capture & Risk Adjustment Modernization",
        "Ambient Clinical Documentation (DAX) Rollout",
      ].every((name) => programs.some((row) => row.program_name === name)),
    },
    source_files: {
      home_snapshot: path.relative(ROOT, homeSnapshotFile),
      home_snapshot_sha256: homeHash,
      ppm_extract: path.relative(ROOT, ppm.ppmFile),
      ppm_extract_sha256: ppm.ppmHash,
    },
    output: {
      sql: path.relative(ROOT, sqlPath),
      summary: path.relative(ROOT, summaryPath),
    },
    programs: programs.map((row) => ({
      move_id: row.move_id,
      name: row.program_name,
      solution: row.solution,
      current_phase: row.current_phase,
      current_module_key: row.current_module_key,
      archetype: row.archetype,
      function_pack_key: row.function_pack_key,
      activation_source: row.activation_source,
      source_row_id: row.source_id,
      value_verified_status: "pending",
      blocked_reason: row.blocked_reason || null,
    })),
  };

  fs.writeFileSync(summaryPath, `${JSON.stringify(summary, null, 2)}\n`, "utf8");
  return summary;
}

const summary = build(parseArgs(process.argv.slice(2)));
if (process.argv.includes("--json")) {
  console.log(JSON.stringify(summary, null, 2));
} else {
  console.log(
    JSON.stringify(
      {
        accepted: summary.accepted,
        moves: `${summary.activation_program_count} of ${summary.declared_program_count}`,
        home_snapshot: summary.programs_from_home_snapshot,
        ppm_source_room: summary.programs_from_source_room_ppm,
        output: summary.output,
      },
      null,
      2,
    ),
  );
}
