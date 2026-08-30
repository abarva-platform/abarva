#!/usr/bin/env node

import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const DEFAULT_PACKAGE_DIR = path.join(
  ROOT,
  "datasets/tenant-inputs/generated/meridian-health/tower-layer1-v2026-08-business-case",
);
const DEFAULT_TENANT_KEY = "meridian-health";
const DEFAULT_ASSESSMENT_ID = "meridian-tower-layer2-source-adapters-v2026-08";
const DEFAULT_BUILD_VERSION = "tower-layer4-products-v2026-08";
const DEFAULT_INPUT_SOURCE_VERSION = "tower-layer3-canonical-v2026-08";
const DEFAULT_OUT_DIR = path.join(ROOT, "reports/meridian-tower-layer4-products");
const PROOF_BEGIN = "__SEMANTIC2_PROOF_TGZ_BEGIN__";
const PROOF_END = "__SEMANTIC2_PROOF_TGZ_END__";
const SOURCE_RELATIVE_PREFIX = "layer_1_client_intake/source_system_extracts";
const PROJECTION_VERSION = 2;
const CUBE_VERSION = 2;
const TRUTHY = new Set(["1", "true", "yes", "on"]);

const PHYSICAL_OBJECT_TYPE_BY_CANONICAL_TYPE = new Map([
  ["budget", "metric"],
  ["value_observation", "metric"],
  ["finance_approval_event", "control"],
  ["evidence_item", "control"],
]);

const METRIC_UNITS = new Map([
  ["project_approved_budget_usd", "USD"],
  ["use_case_promised_annual_value_low_usd", "USD"],
  ["use_case_promised_annual_value_high_usd", "USD"],
  ["use_case_roi_low_multiple", "multiple"],
  ["use_case_roi_high_multiple", "multiple"],
  ["readiness_score", "score_0_100"],
  ["linked_business_case_count", "count"],
  ["rollout_target_users", "users"],
  ["monthly_active_users", "users"],
  ["adoption_target_pct", "percent"],
  ["adoption_actual_pct", "percent"],
  ["sponsor_claimed_value_usd", "USD"],
  ["finance_reviewed_value_usd", "USD"],
  ["finance_validated_value_usd", "USD"],
  ["board_claimable_value_usd", "USD"],
]);

const FINANCE_REVIEW = new Map([
  ["cfo_approved_target", "approved"],
  ["finance_validated_actual", "approved"],
  ["finance_challenged", "reviewed"],
  ["sponsor_claimed", "not_reviewed"],
  ["not_submitted", "not_reviewed"],
]);

function argValue(argv, name) {
  const explicit = argv.find((arg) => arg.startsWith(`${name}=`));
  if (explicit) return explicit.slice(name.length + 1);
  const index = argv.indexOf(name);
  return index >= 0 ? argv[index + 1] : null;
}

function envFlag(name) {
  return TRUTHY.has(String(process.env[name] ?? "").toLowerCase());
}

function gitSha() {
  const result = spawnSync("git", ["rev-parse", "HEAD"], {
    cwd: ROOT,
    encoding: "utf8",
  });
  return result.status === 0 ? result.stdout.trim() : "unknown";
}

function parseArgs(argv) {
  return {
    packageDir: path.resolve(argValue(argv, "--package-dir") ?? DEFAULT_PACKAGE_DIR),
    tenantKey: argValue(argv, "--tenant-key") ?? DEFAULT_TENANT_KEY,
    assessmentId: argValue(argv, "--assessment-id") ?? DEFAULT_ASSESSMENT_ID,
    buildVersion:
      argValue(argv, "--build-version") ??
      process.env.TOWER_LAYER4_BUILD_VERSION ??
      DEFAULT_BUILD_VERSION,
    inputSourceVersion:
      argValue(argv, "--input-source-version") ??
      process.env.TOWER_LAYER4_INPUT_SOURCE_VERSION ??
      DEFAULT_INPUT_SOURCE_VERSION,
    idempotencyKey:
      argValue(argv, "--idempotency-key") ??
      process.env.TOWER_LAYER4_IDEMPOTENCY_KEY ??
      `${DEFAULT_BUILD_VERSION}:${gitSha()}`,
    outDir: path.resolve(argValue(argv, "--out-dir") ?? DEFAULT_OUT_DIR),
    write: argv.includes("--write") || envFlag("TOWER_LAYER4_WRITE"),
    readbackOnly: argv.includes("--readback-only"),
    // When this projection was built. This is a build fact, so taking it from the clock here is
    // correct — unlike a render-time date standing in for the age of the data, which is the defect
    // this field exists to retire.
    builtAt: new Date().toISOString(),
    purgeOnly: argv.includes("--purge-only") || envFlag("TOWER_LAYER4_PURGE_ONLY"),
    emitProofBundle:
      argv.includes("--emit-proof-bundle") ||
      envFlag("TOWER_LAYER4_EMIT_PROOF_BUNDLE"),
  };
}

function sha256Text(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function stableUuid(...parts) {
  const hex = sha256Text(parts.join("|")).slice(0, 32).split("");
  hex[12] = "5";
  hex[16] = ((Number.parseInt(hex[16], 16) & 0x3) | 0x8).toString(16);
  const value = hex.join("");
  return `${value.slice(0, 8)}-${value.slice(8, 12)}-${value.slice(12, 16)}-${value.slice(16, 20)}-${value.slice(20, 32)}`;
}

function stableJson(value) {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stableJson(value[key])}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];
    if (quoted) {
      if (char === '"' && next === '"') {
        field += '"';
        index += 1;
      } else if (char === '"') quoted = false;
      else field += char;
    } else if (char === '"') quoted = true;
    else if (char === ",") {
      row.push(field);
      field = "";
    } else if (char === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else if (char !== "\r") field += char;
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  const header = rows.shift()?.map((value) => value.trim()) ?? [];
  return rows
    .filter((cells) => cells.some((cell) => String(cell).trim()))
    .map((cells) =>
      Object.fromEntries(header.map((key, index) => [key, cells[index] ?? ""])),
    );
}

function readCsv(filePath) {
  return parseCsv(fs.readFileSync(filePath, "utf8"));
}

function num(value) {
  if (value === null || value === undefined || value === "") return 0;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function numOrNull(value) {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function sqlText(value) {
  if (value === null || value === undefined || value === "") return "null";
  return `'${String(value).replace(/'/g, "''")}'`;
}

function sqlNum(value) {
  const parsed = numOrNull(value);
  return parsed === null ? "null" : String(parsed);
}

function sqlJson(value) {
  return `${sqlText(stableJson(value))}::jsonb`;
}

function insertSql(table, columns, rows, batchSize = 400) {
  if (!rows.length) return `-- no rows for ${table}\n`;
  const chunks = [];
  for (let index = 0; index < rows.length; index += batchSize) {
    const batch = rows.slice(index, index + batchSize);
    const values = batch
      .map((row) => `(${columns.map((column) => row[column]).join(", ")})`)
      .join(",\n");
    chunks.push(`insert into ${table} (${columns.join(", ")}) values\n${values};`);
  }
  return `${chunks.join("\n")}\n`;
}

function objectUuid(options, objectType, canonicalId) {
  const physicalType =
    PHYSICAL_OBJECT_TYPE_BY_CANONICAL_TYPE.get(objectType) ?? objectType;
  return stableUuid("object", options.tenantKey, options.assessmentId, physicalType, canonicalId);
}

function measureUuid(options, subjectObjectType, subjectCanonicalId, metricKey, source, attrs = {}) {
  return stableUuid(
    "measure",
    options.tenantKey,
    options.assessmentId,
    subjectObjectType,
    subjectCanonicalId,
    metricKey,
    attrs.period_start ?? "",
    attrs.period_end ?? "",
    source.source_record_id,
  );
}

function sourceRecordUuid(options, source) {
  return stableUuid(
    "source_record",
    options.tenantKey,
    options.assessmentId,
    `${SOURCE_RELATIVE_PREFIX}/${source.source_file}`,
    Number(source.source_row),
    source.source_record_id,
  );
}

function sourceRef(options, source, extra = {}) {
  return {
    source_file: source.source_file,
    source_system: source.source_system,
    source_row: Number(source.source_row),
    source_record_id: source.source_record_id,
    ecl_source_record_id: sourceRecordUuid(options, source),
    ...extra,
  };
}

function loadPackage(options) {
  const layer3 = path.join(options.packageDir, "layer_3_canonical");
  const layer4 = path.join(options.packageDir, "layer_4_read_models");
  const cube = path.join(options.packageDir, "cube");
  const manifest = JSON.parse(
    fs.readFileSync(path.join(options.packageDir, "package_manifest.json"), "utf8"),
  );
  if (manifest.tenant_key !== options.tenantKey) {
    throw new Error(`Package tenant ${manifest.tenant_key} does not match ${options.tenantKey}`);
  }
  const ensureTenant = (rows, label) => {
    const bad = rows.filter((row) => row.tenant_key !== options.tenantKey);
    if (bad.length) throw new Error(`${label} has ${bad.length} wrong-tenant rows`);
    return rows;
  };
  return {
    manifest,
    aiUseCases: ensureTenant(readCsv(path.join(layer3, "canonical_ai_use_cases.csv")), "ai cases"),
    projects: ensureTenant(readCsv(path.join(layer3, "canonical_projects.csv")), "projects"),
    tools: ensureTenant(readCsv(path.join(layer3, "canonical_tools.csv")), "tools"),
    valueObservations: ensureTenant(
      readCsv(path.join(layer3, "canonical_monthly_value_observations.csv")),
      "value observations",
    ),
    summary: ensureTenant(readCsv(path.join(layer4, "tower_executive_summary.csv")), "summary")[0],
    proofQueue: ensureTenant(readCsv(path.join(layer4, "tower_value_proof_queue.csv")), "proof queue"),
    caseCube: ensureTenant(readCsv(path.join(cube, "tower_ai_case_cube.csv")), "case cube"),
    portfolioCube: ensureTenant(readCsv(path.join(cube, "tower_ai_portfolio_cube.csv")), "portfolio cube"),
  };
}

function sumBy(rows, key) {
  return rows.reduce((sum, row) => sum + num(row[key]), 0);
}

function groupBy(rows, key) {
  const grouped = new Map();
  for (const row of rows) {
    const value = row[key];
    if (!grouped.has(value)) grouped.set(value, []);
    grouped.get(value).push(row);
  }
  return grouped;
}

function gateForCase(row, actual) {
  if (num(row.projected_annual_value_low_usd) <= 0) {
    return {
      status: "gated",
      code: "foundation_linkage_needed",
      detail: "Foundation spend is tracked as enablement until linked use cases show measured outcomes.",
      nextGate: "link_to_value_cases",
      evidence: ["linked use cases", "allocated platform cost", "measured downstream value"],
    };
  }
  if (actual.boardClaimable > 0) {
    return {
      status: "gated",
      code: "remaining_value_not_validated",
      detail: "Some value is claimable, but the remaining annual promise still needs monthly evidence and Finance sign-off.",
      nextGate: "finance_validation",
      evidence: ["monthly actuals", "Finance validation", "board-claimable amount"],
    };
  }
  return {
    status: "gated",
    code: "monthly_actuals_and_finance_review_needed",
    detail: "Sponsor value is still a promise until monthly actuals and Finance validation are loaded.",
    nextGate: "measured_outcome",
    evidence: ["monthly actuals", "usage-to-value mapping", "Finance validation"],
  };
}

function sourceHash(...values) {
  return sha256Text(stableJson(values));
}

function surfacePhysicalKey(pageKey) {
  if (["value_proof", "cost_lens"].includes(pageKey)) return "tower_value_chain";
  if (["evidence", "risk_lens"].includes(pageKey)) return "tower_evidence_queue";
  if (["ai_portfolio", "adoption_lens"].includes(pageKey)) return "tower_ai_portfolio";
  return "tower_command_center";
}

function projectionEntry(options, snapshotId, manifestId, surfaceKey, pageKey, rowKey, rowType, rowPayload, refs) {
  const id = stableUuid("projection_entry", options.tenantKey, options.assessmentId, PROJECTION_VERSION, surfaceKey, pageKey, rowKey);
  return {
    id,
    row: {
      id: sqlText(id),
      tenant_key: sqlText(options.tenantKey),
      assessment_id: sqlText(options.assessmentId),
      snapshot_id: sqlText(snapshotId),
      projection_manifest_id: sqlText(manifestId),
      projection_version: PROJECTION_VERSION,
      surface_key: sqlText(surfaceKey),
      row_key: sqlText(`${pageKey}:${rowKey}`),
      row_type: sqlText(rowType),
      source_hash: sqlText(sourceHash(rowPayload)),
      refs_content_hash: sqlText(sourceHash(refs)),
      refs_cache_json: sqlJson({ source_refs: refs }),
      display_cache_json: sqlJson(rowPayload),
    },
  };
}

function addProjectionRow(ctx, pageKey, rowKey, rowType, rowPayload, refs) {
  const surfaceKey = surfacePhysicalKey(pageKey);
  const manifestId = ctx.manifestIds[pageKey];
  const entry = projectionEntry(ctx.options, ctx.snapshotId, manifestId, surfaceKey, pageKey, rowKey, rowType, rowPayload, refs);
  ctx.projectionEntries.push(entry.row);
  for (const [index, ref] of refs.entries()) {
    ctx.sourceRecordRefs.push({
      tenant_key: sqlText(ctx.options.tenantKey),
      assessment_id: sqlText(ctx.options.assessmentId),
      projection_entry_id: sqlText(entry.id),
      source_record_id: sqlText(ref.ecl_source_record_id),
      ref_role: sqlText(index === 0 ? "primary" : "supporting"),
      sort_order: index + 1,
      source_hash: sqlText(sourceHash(ref)),
    });
  }
  return { manifestId, entryId: entry.id };
}

function buildRows(options) {
  const data = loadPackage(options);
  const snapshotId = stableUuid("snapshot", options.tenantKey, options.assessmentId, options.buildVersion);
  const sourceHashValue = sourceHash(data.manifest, data.summary, data.caseCube, data.portfolioCube);
  const ctx = {
    options,
    snapshotId,
    manifestIds: {},
    projectionEntries: [],
    sourceRecordRefs: [],
    objectRefs: [],
    metricRefs: [],
    cubeManifests: [],
    cubeSlices: [],
    cubeSliceMetrics: [],
    cubeSliceMeasures: [],
  };

  const surfaces = {
    command_center: 1,
    decision_lanes: data.aiUseCases.length,
    recommended_actions: data.proofQueue.length,
    value_proof: data.aiUseCases.length,
    cost_lens: data.aiUseCases.length,
    evidence: data.proofQueue.length,
    risk_lens: data.proofQueue.length,
    ai_portfolio: data.aiUseCases.length,
    adoption_lens: data.tools.length,
  };

  const projectionManifestRows = [];
  for (const [surface, count] of Object.entries(surfaces)) {
    const manifestId = stableUuid("projection_manifest", options.tenantKey, options.assessmentId, surface, PROJECTION_VERSION);
    ctx.manifestIds[surface] = manifestId;
    projectionManifestRows.push({
      id: sqlText(manifestId),
      tenant_key: sqlText(options.tenantKey),
      assessment_id: sqlText(options.assessmentId),
      snapshot_id: sqlText(snapshotId),
      projection_key: sqlText(surface === "command_center" ? "tower_command_center" : `tower_${surface}`),
      projection_version: PROJECTION_VERSION,
      rebuild_command: sqlText("npm run tower:healthcare-demo-layer4-products:write-job"),
      source_hash: sqlText(sourceHashValue),
      projection_hash: sqlText(sourceHash(surface, count, options.buildVersion)),
      row_count: count,
      quality_state: sqlText("passed"),
      admission_status: sqlText("not_applicable"),
      admission_gate_results_json: sqlJson([]),
      gated_claim_count: surface.includes("lens") || surface === "command_center" ? 0 : count,
      proof_uri: sqlText(`local:${options.outDir}`),
    });
  }

  const commandRows = [];
  const valueRows = [];
  const evidenceRows = [];
  const aiRows = [];
  const observationsByCase = groupBy(data.valueObservations, "business_case_id");
  const projectsById = new Map(data.projects.map((row) => [row.project_id, row]));
  const caseById = new Map(data.aiUseCases.map((row) => [row.business_case_id, row]));
  const sourceForSummary = data.projects[0] ?? data.aiUseCases[0];
  const summaryRefs = [sourceRef(options, sourceForSummary, { layer: "layer_4_executive_summary" })];
  const summaryPayload = {
    page_key: "command_center",
    layer4_build_version: options.buildVersion,
    input_source_version: options.inputSourceVersion,
    // Freshness, carried from the package rather than invented. Without these the surface honestly
    // reports "as-of date not recorded" — correct, but only because the value was being dropped
    // here. `as_of_date` is the period the figures cover; `refresh_timestamp` is when this
    // projection was built, which is a different fact and must not stand in for the first.
    as_of_period: data.summary.as_of_date ?? null,
    refresh_timestamp: options.builtAt,
    total_it_budget_usd: num(data.summary.total_it_budget_usd),
    reviewed_project_count: data.projects.length,
    reviewed_project_budget_usd: num(data.summary.reviewed_project_budget_usd),
    ai_related_investment_usd: num(data.summary.ai_related_investment_usd),
    projected_annual_value_low_usd: num(data.summary.projected_annual_value_low_usd),
    projected_annual_value_high_usd: num(data.summary.projected_annual_value_high_usd),
    portfolio_roi_low_multiple: num(data.summary.portfolio_roi_low_multiple),
    portfolio_roi_high_multiple: num(data.summary.portfolio_roi_high_multiple),
    board_claimable_ytd_usd: num(data.summary.board_claimable_ytd_usd),
    business_case_count: num(data.summary.business_case_count),
    tool_rollout_count: num(data.summary.tool_rollout_count),
    headline: data.summary.headline,
  };
  const summaryEntry = addProjectionRow(ctx, "command_center", "executive_summary", "portfolio_summary", summaryPayload, summaryRefs);
  commandRows.push({
    id: sqlText(stableUuid("tower_command_center", options.tenantKey, "command_center", "executive_summary")),
    tenant_key: sqlText(options.tenantKey),
    assessment_id: sqlText(options.assessmentId),
    snapshot_id: sqlText(snapshotId),
    projection_manifest_id: sqlText(summaryEntry.manifestId),
    projection_entry_id: sqlText(summaryEntry.entryId),
    projection_version: PROJECTION_VERSION,
    row_key: sqlText("executive_summary"),
    page_key: sqlText("command_center"),
    row_type: sqlText("portfolio_summary"),
    primary_object_id: "null",
    claim_id: "null",
    claim_gate_status: sqlText("not_applicable"),
    claim_gate_reason_code: "null",
    claim_gate_reason_detail: "null",
    next_gate: "null",
    evidence_needed_json: sqlJson([]),
    funded_amount_usd: sqlNum(data.summary.reviewed_project_budget_usd),
    promised_value_usd: sqlNum(data.summary.projected_annual_value_low_usd),
    usage_supported_value_usd: "null",
    finance_validated_value_usd: "null",
    claimable_value_usd: sqlNum(data.summary.board_claimable_ytd_usd),
    blocked_value_usd: sqlNum(num(data.summary.projected_annual_value_low_usd) - num(data.summary.board_claimable_ytd_usd)),
    proof_maturity_score: "null",
    risk_pressure_score: "null",
    usage_strength_score: "null",
    owner_role: sqlText("executive_committee"),
    handoff_module: sqlText("Tower"),
    value_state: sqlText("known"),
    quality_state: sqlText("passed"),
    metric_keys_json: sqlJson([
      "project_approved_budget_usd",
      "use_case_promised_annual_value_low_usd",
      "board_claimable_value_usd",
    ]),
    source_refs_json: sqlJson(summaryRefs),
    gap_flags_json: sqlJson([]),
    display_payload_json: sqlJson(summaryPayload),
    source_hash: sqlText(sourceHash(summaryPayload, summaryRefs)),
  });

  for (const row of data.aiUseCases) {
    const project = projectsById.get(row.project_id);
    const observations = observationsByCase.get(row.business_case_id) ?? [];
    const actual = {
      sponsorClaimed: sumBy(observations, "sponsor_claimed_value_usd"),
      financeReviewed: sumBy(observations, "finance_reviewed_value_usd"),
      financeValidated: sumBy(observations, "finance_validated_value_usd"),
      boardClaimable: sumBy(observations, "board_claimable_value_usd"),
    };
    const gate = gateForCase(row, actual);
    const useCaseObjectId = objectUuid(options, "ai_use_case", row.canonical_ai_use_case_id);
    const refs = [sourceRef(options, row, { business_case_id: row.business_case_id })];
    if (project) refs.push(sourceRef(options, project, { project_id: project.project_id }));
    const display = {
      page_key: "decision_lanes",
      business_case_id: row.business_case_id,
      project_id: row.project_id,
      domain_name: project?.domain_name ?? row.domain_key,
      business_value_type: row.business_value_type,
      primary_tool_or_platform: row.primary_tool_or_platform,
      promised_value_usd: num(row.projected_annual_value_low_usd),
      projected_annual_value_high_usd: num(row.projected_annual_value_high_usd),
      sponsor_claimed_value_usd: actual.sponsorClaimed,
      finance_reviewed_value_usd: actual.financeReviewed,
      finance_validated_value_usd: actual.financeValidated,
      board_claimable_value_usd: actual.boardClaimable,
      roi_low_multiple: numOrNull(row.roi_low_multiple),
      roi_high_multiple: numOrNull(row.roi_high_multiple),
      finance_status: row.finance_status,
      // Decision attributes. gating_constraint is the load-bearing one: across the portfolio it is
      // what separates a validated case from a blocked one, where readiness score does not.
      gating_constraint: row.gating_constraint ?? null,
      confidence_level: row.confidence_level ?? null,
      readiness_score: numOrNull(row.readiness_score),
      cost_to_build_low_usd: numOrNull(row.cost_to_build_low_usd),
      cost_to_build_high_usd: numOrNull(row.cost_to_build_high_usd),
      proof_needed: row.proof_needed ?? null,
      business_sponsor_role: row.business_sponsor_role ?? null,
      // Initiative-detail fields the canonical layer already carries and the payload dropped.
      // The approved design's drill-down needs each of these; none is derived or inferred.
      project_name: project?.project_name ?? null,
      lifecycle_stage: project?.lifecycle_stage ?? null,
      finance_partner_role: project?.finance_partner_role ?? null,
      success_metric: row.success_metric ?? null,
      payback_months_target: num(row.payback_months_target) || null,
      // The observation series behind the value waterfall, so the drawer can show when each step
      // happened rather than only its total.
      value_observation_months: observations
        .map((o) => ({
          month: o.reporting_month ?? null,
          sponsor_claimed_usd: num(o.sponsor_claimed_value_usd),
          finance_reviewed_usd: num(o.finance_reviewed_value_usd),
          finance_validated_usd: num(o.finance_validated_value_usd),
          board_claimable_usd: num(o.board_claimable_value_usd),
          validation_state: o.validation_state ?? null,
        }))
        .filter((o) => o.month !== null)
        .sort((a, b) => String(a.month).localeCompare(String(b.month))),
      layer4_build_version: options.buildVersion,
    };
    const commandEntry = addProjectionRow(ctx, "decision_lanes", row.business_case_id, "ai_business_case", display, refs);
    commandRows.push({
      id: sqlText(stableUuid("tower_command_center", options.tenantKey, "decision_lanes", row.business_case_id)),
      tenant_key: sqlText(options.tenantKey),
      assessment_id: sqlText(options.assessmentId),
      snapshot_id: sqlText(snapshotId),
      projection_manifest_id: sqlText(commandEntry.manifestId),
      projection_entry_id: sqlText(commandEntry.entryId),
      projection_version: PROJECTION_VERSION,
      row_key: sqlText(row.business_case_id),
      page_key: sqlText("decision_lanes"),
      row_type: sqlText("ai_business_case"),
      primary_object_id: sqlText(useCaseObjectId),
      claim_id: sqlText(row.business_case_id),
      claim_gate_status: sqlText(gate.status),
      claim_gate_reason_code: sqlText(gate.code),
      claim_gate_reason_detail: sqlText(gate.detail),
      next_gate: sqlText(gate.nextGate),
      evidence_needed_json: sqlJson(gate.evidence),
      funded_amount_usd: sqlNum(project?.approved_budget_usd),
      promised_value_usd: sqlNum(row.projected_annual_value_low_usd),
      usage_supported_value_usd: sqlNum(actual.financeReviewed),
      finance_validated_value_usd: sqlNum(actual.financeValidated),
      claimable_value_usd: sqlNum(actual.boardClaimable),
      blocked_value_usd: sqlNum(Math.max(0, num(row.projected_annual_value_low_usd) - actual.boardClaimable)),
      proof_maturity_score: sqlNum(row.readiness_score),
      risk_pressure_score: sqlNum(100 - num(row.readiness_score)),
      usage_strength_score: sqlNum(actual.financeReviewed > 0 ? 70 : 20),
      owner_role: sqlText(project?.sponsor_role ?? "program_sponsor"),
      handoff_module: sqlText("Tower"),
      value_state: sqlText(num(row.projected_annual_value_low_usd) > 0 ? "estimated" : "known"),
      quality_state: sqlText("passed"),
      metric_keys_json: sqlJson(["project_approved_budget_usd", "use_case_promised_annual_value_low_usd"]),
      source_refs_json: sqlJson(refs),
      gap_flags_json: sqlJson(gate.evidence),
      display_payload_json: sqlJson(display),
      source_hash: sqlText(sourceHash(display, refs)),
    });

    const valueDisplay = {
      ...display,
      page_key: "value_proof",
      metric_key: "use_case_promised_annual_value_low_usd",
      promised_value_usd: null,
      usage_supported_value_usd: actual.financeReviewed,
      current_value: actual.financeValidated > 0 ? actual.financeValidated : null,
      business_case_benefit_usd: num(row.projected_annual_value_low_usd),
      realized_p_and_l_usd: null,
      realized_cash_usd: null,
      financial_conversion_usd: actual.boardClaimable,
    };
    const valueEntry = addProjectionRow(ctx, "value_proof", row.business_case_id, "value_claim", valueDisplay, refs);
    valueRows.push({
      id: sqlText(stableUuid("tower_value_chain", options.tenantKey, "value_proof", row.business_case_id)),
      tenant_key: sqlText(options.tenantKey),
      assessment_id: sqlText(options.assessmentId),
      snapshot_id: sqlText(snapshotId),
      projection_manifest_id: sqlText(valueEntry.manifestId),
      projection_entry_id: sqlText(valueEntry.entryId),
      projection_version: PROJECTION_VERSION,
      row_key: sqlText(row.business_case_id),
      page_key: sqlText("value_proof"),
      row_type: sqlText("value_claim"),
      primary_object_id: sqlText(useCaseObjectId),
      claim_id: sqlText(row.business_case_id),
      observation_key: sqlText(`${row.business_case_id}:annual_promise`),
      metric_key: sqlText("use_case_promised_annual_value_low_usd"),
      measure_id: num(row.projected_annual_value_low_usd) > 0 ? sqlText(measureUuid(options, "ai_use_case", row.canonical_ai_use_case_id, "use_case_promised_annual_value_low_usd", row, { scenario: "planned" })) : "null",
      source_record_id: sqlText(sourceRecordUuid(options, row)),
      review_event_id: "null",
      evidence_state: sqlText("source_recorded"),
      claim_gate_status: sqlText(gate.status),
      claim_gate_reason_code: sqlText(gate.code),
      claim_gate_reason_detail: sqlText(gate.detail),
      next_gate: sqlText(gate.nextGate),
      evidence_needed_json: sqlJson(gate.evidence),
      baseline_value: sqlNum(row.projected_annual_value_low_usd),
      current_value: actual.financeValidated > 0 ? sqlNum(actual.financeValidated) : "null",
      target_value: sqlNum(row.projected_annual_value_high_usd),
      claimable_value_usd: sqlNum(actual.boardClaimable),
      blocked_value_usd: sqlNum(Math.max(0, num(row.projected_annual_value_low_usd) - actual.boardClaimable)),
      value_state: sqlText(num(row.projected_annual_value_low_usd) > 0 ? "estimated" : "known"),
      quality_state: sqlText("passed"),
      source_refs_json: sqlJson(refs),
      display_payload_json: sqlJson(valueDisplay),
      gap_flags_json: sqlJson(gate.evidence),
      source_hash: sqlText(sourceHash(valueDisplay, refs)),
    });

    const costDisplay = {
      ...display,
      page_key: "cost_lens",
      trajectory_only: true,
      lens_role: "top_investment",
      approved_investment_usd: num(project?.approved_budget_usd),
    };
    const costEntry = addProjectionRow(ctx, "cost_lens", row.business_case_id, "top_investment", costDisplay, refs);
    valueRows.push({
      id: sqlText(stableUuid("tower_value_chain", options.tenantKey, "cost_lens", row.business_case_id)),
      tenant_key: sqlText(options.tenantKey),
      assessment_id: sqlText(options.assessmentId),
      snapshot_id: sqlText(snapshotId),
      projection_manifest_id: sqlText(costEntry.manifestId),
      projection_entry_id: sqlText(costEntry.entryId),
      projection_version: PROJECTION_VERSION,
      row_key: sqlText(row.business_case_id),
      page_key: sqlText("cost_lens"),
      row_type: sqlText("top_investment"),
      primary_object_id: sqlText(useCaseObjectId),
      claim_id: sqlText(row.business_case_id),
      observation_key: sqlText(`${row.business_case_id}:cost_lens`),
      metric_key: sqlText("project_approved_budget_usd"),
      measure_id: project ? sqlText(measureUuid(options, "program", project.canonical_project_id, "project_approved_budget_usd", project, { scenario: "current", project_classification: project.project_classification })) : "null",
      source_record_id: sqlText(sourceRecordUuid(options, row)),
      review_event_id: "null",
      evidence_state: sqlText("source_recorded"),
      claim_gate_status: sqlText(gate.status),
      claim_gate_reason_code: sqlText(gate.code),
      claim_gate_reason_detail: sqlText(gate.detail),
      next_gate: sqlText(gate.nextGate),
      evidence_needed_json: sqlJson(gate.evidence),
      baseline_value: sqlNum(project?.approved_budget_usd),
      current_value: "null",
      target_value: sqlNum(row.projected_annual_value_low_usd),
      claimable_value_usd: sqlNum(actual.boardClaimable),
      blocked_value_usd: sqlNum(Math.max(0, num(row.projected_annual_value_low_usd) - actual.boardClaimable)),
      value_state: sqlText("known"),
      quality_state: sqlText("passed"),
      source_refs_json: sqlJson(refs),
      display_payload_json: sqlJson(costDisplay),
      gap_flags_json: sqlJson(gate.evidence),
      source_hash: sqlText(sourceHash(costDisplay, refs)),
    });

    const aiDisplay = {
      ...display,
      page_key: "ai_portfolio",
      item_kind: row.business_value_type === "Foundation" ? "embedded_platform" : "funded_program",
      ai_spend_category: row.business_value_type,
      funding_status: project?.committee_decision ?? "in_review",
      approved_funding_usd: num(project?.approved_budget_usd),
    };
    const aiEntry = addProjectionRow(ctx, "ai_portfolio", row.business_case_id, "ai_business_case", aiDisplay, refs);
    aiRows.push({
      id: sqlText(stableUuid("tower_ai_portfolio", options.tenantKey, "ai_portfolio", row.business_case_id)),
      tenant_key: sqlText(options.tenantKey),
      assessment_id: sqlText(options.assessmentId),
      snapshot_id: sqlText(snapshotId),
      projection_manifest_id: sqlText(aiEntry.manifestId),
      projection_entry_id: sqlText(aiEntry.entryId),
      projection_version: PROJECTION_VERSION,
      row_key: sqlText(row.business_case_id),
      use_case_object_id: sqlText(useCaseObjectId),
      tool_object_id: "null",
      function_object_id: "null",
      use_case_name: sqlText(row.initiative_name),
      tool_name: sqlText(row.primary_tool_or_platform),
      business_function: sqlText(project?.domain_name ?? row.domain_key),
      licensed_users: "null",
      active_users: "null",
      usage_events: "null",
      monthly_cost_usd: "null",
      adoption_rate_percent: "null",
      value_state: sqlText(num(row.projected_annual_value_low_usd) > 0 ? "estimated" : "known"),
      quality_state: sqlText("passed"),
      review_state: sqlText(FINANCE_REVIEW.get(row.finance_status) ?? "not_reviewed"),
      metric_keys_json: sqlJson(["use_case_promised_annual_value_low_usd", "readiness_score"]),
      source_refs_json: sqlJson(refs),
      gap_flags_json: sqlJson(gate.evidence),
      display_payload_json: sqlJson(aiDisplay),
      source_hash: sqlText(sourceHash(aiDisplay, refs)),
    });
  }

  for (const queueRow of data.proofQueue) {
    const useCase = caseById.get(queueRow.business_case_id);
    if (!useCase) continue;
    const project = projectsById.get(useCase.project_id);
    const refs = [sourceRef(options, useCase, { business_case_id: useCase.business_case_id })];
    const actual = {
      boardClaimable: sumBy(observationsByCase.get(useCase.business_case_id) ?? [], "board_claimable_value_usd"),
    };
    const gate = gateForCase(useCase, actual);
    for (const pageKey of ["evidence", "risk_lens"]) {
      const payload = {
        page_key: pageKey,
        business_case_id: queueRow.business_case_id,
        initiative_name: queueRow.initiative_name,
        business_value_type: queueRow.business_value_type,
        projected_annual_value_low_usd: num(queueRow.projected_annual_value_low_usd),
        finance_status: queueRow.finance_status,
        proof_needed: queueRow.proof_needed,
        next_action: queueRow.next_action,
        blocked_value_usd: Math.max(0, num(queueRow.projected_annual_value_low_usd) - actual.boardClaimable),
        owner_role: project?.sponsor_role ?? "program_sponsor",
        layer4_build_version: options.buildVersion,
      };
      const entry = addProjectionRow(ctx, pageKey, queueRow.business_case_id, "evidence_gap", payload, refs);
      evidenceRows.push({
        id: sqlText(stableUuid("tower_evidence_queue", options.tenantKey, pageKey, queueRow.business_case_id)),
        tenant_key: sqlText(options.tenantKey),
        assessment_id: sqlText(options.assessmentId),
        snapshot_id: sqlText(snapshotId),
        projection_manifest_id: sqlText(entry.manifestId),
        projection_entry_id: sqlText(entry.entryId),
        projection_version: PROJECTION_VERSION,
        row_key: sqlText(queueRow.business_case_id),
        page_key: sqlText(pageKey),
        row_type: sqlText("evidence_gap"),
        primary_object_id: sqlText(objectUuid(options, "ai_use_case", useCase.canonical_ai_use_case_id)),
        claim_id: sqlText(queueRow.business_case_id),
        claim_gate_status: sqlText("gated"),
        claim_gate_reason_code: sqlText(gate.code),
        claim_gate_reason_detail: sqlText(queueRow.proof_needed || gate.detail),
        evidence_needed_json: sqlJson(gate.evidence),
        next_gate: sqlText(gate.nextGate),
        owner_role: sqlText(project?.sponsor_role ?? "program_sponsor"),
        due_date: "null",
        related_measure_id: num(useCase.projected_annual_value_low_usd) > 0 ? sqlText(measureUuid(options, "ai_use_case", useCase.canonical_ai_use_case_id, "use_case_promised_annual_value_low_usd", useCase, { scenario: "planned" })) : "null",
        source_record_id: sqlText(sourceRecordUuid(options, useCase)),
        review_event_id: "null",
        evidence_state: sqlText("source_recorded"),
        priority_score: Math.max(1, Math.min(100, 100 - num(useCase.readiness_score))),
        source_refs_json: sqlJson(refs),
        gap_flags_json: sqlJson(gate.evidence),
        display_payload_json: sqlJson(payload),
        source_hash: sqlText(sourceHash(payload, refs)),
      });
    }

    const actionPayload = {
      ...queueRow,
      page_key: "recommended_actions",
      blocked_value_usd: Math.max(0, num(queueRow.projected_annual_value_low_usd) - actual.boardClaimable),
      owner_role: project?.sponsor_role ?? "program_sponsor",
      handoff_module: "Tower",
      title: queueRow.next_action,
      layer4_build_version: options.buildVersion,
    };
    const actionEntry = addProjectionRow(ctx, "recommended_actions", queueRow.business_case_id, "recommended_action", actionPayload, refs);
    commandRows.push({
      id: sqlText(stableUuid("tower_command_center", options.tenantKey, "recommended_actions", queueRow.business_case_id)),
      tenant_key: sqlText(options.tenantKey),
      assessment_id: sqlText(options.assessmentId),
      snapshot_id: sqlText(snapshotId),
      projection_manifest_id: sqlText(actionEntry.manifestId),
      projection_entry_id: sqlText(actionEntry.entryId),
      projection_version: PROJECTION_VERSION,
      row_key: sqlText(queueRow.business_case_id),
      page_key: sqlText("recommended_actions"),
      row_type: sqlText("recommended_action"),
      primary_object_id: sqlText(objectUuid(options, "ai_use_case", useCase.canonical_ai_use_case_id)),
      claim_id: sqlText(queueRow.business_case_id),
      claim_gate_status: sqlText("gated"),
      claim_gate_reason_code: sqlText(gate.code),
      claim_gate_reason_detail: sqlText(queueRow.next_action || gate.detail),
      next_gate: sqlText(gate.nextGate),
      evidence_needed_json: sqlJson(gate.evidence),
      funded_amount_usd: "null",
      promised_value_usd: sqlNum(queueRow.projected_annual_value_low_usd),
      usage_supported_value_usd: "null",
      finance_validated_value_usd: "null",
      claimable_value_usd: sqlNum(actual.boardClaimable),
      blocked_value_usd: sqlNum(Math.max(0, num(queueRow.projected_annual_value_low_usd) - actual.boardClaimable)),
      proof_maturity_score: sqlNum(useCase.readiness_score),
      risk_pressure_score: sqlNum(100 - num(useCase.readiness_score)),
      usage_strength_score: "null",
      owner_role: sqlText(project?.sponsor_role ?? "program_sponsor"),
      handoff_module: sqlText("Tower"),
      value_state: sqlText("estimated"),
      quality_state: sqlText("passed"),
      metric_keys_json: sqlJson(["use_case_promised_annual_value_low_usd"]),
      source_refs_json: sqlJson(refs),
      gap_flags_json: sqlJson(gate.evidence),
      display_payload_json: sqlJson(actionPayload),
      source_hash: sqlText(sourceHash(actionPayload, refs)),
    });
  }

  for (const tool of data.tools) {
    const toolObjectId = objectUuid(options, "ai_tool", tool.canonical_tool_id);
    const refs = [sourceRef(options, tool, { tool_rollout_id: tool.tool_rollout_id })];
    const payload = {
      page_key: "adoption_lens",
      tool_rollout_id: tool.tool_rollout_id,
      rollout_goal: tool.rollout_goal,
      linked_business_case_count: num(tool.linked_business_case_count),
      rollout_target_users: num(tool.rollout_target_users),
      monthly_active_users: num(tool.monthly_active_users),
      adoption_target_pct: num(tool.adoption_target_pct),
      adoption_actual_pct: num(tool.adoption_actual_pct),
      item_kind: "usage_benefit",
      ai_spend_category: "AI tool rollout",
      funding_status: tool.rollout_stage,
      // The named obstacle. Without it a rollout reads as merely under-adopted when the real
      // blocker is a control review or a telemetry gap that nobody has scheduled.
      control_blocker: tool.control_blocker ?? null,
      business_owner_role: tool.business_owner_role ?? null,
      rollout_stage: tool.rollout_stage ?? null,
      layer4_build_version: options.buildVersion,
    };
    const entry = addProjectionRow(ctx, "adoption_lens", tool.tool_rollout_id, "ai_tool_rollout", payload, refs);
    aiRows.push({
      id: sqlText(stableUuid("tower_ai_portfolio", options.tenantKey, "adoption_lens", tool.tool_rollout_id)),
      tenant_key: sqlText(options.tenantKey),
      assessment_id: sqlText(options.assessmentId),
      snapshot_id: sqlText(snapshotId),
      projection_manifest_id: sqlText(entry.manifestId),
      projection_entry_id: sqlText(entry.entryId),
      projection_version: PROJECTION_VERSION,
      row_key: sqlText(tool.tool_rollout_id),
      use_case_object_id: sqlText(toolObjectId),
      tool_object_id: sqlText(toolObjectId),
      function_object_id: "null",
      use_case_name: sqlText(tool.tool_name),
      tool_name: sqlText(tool.vendor_name),
      business_function: sqlText(tool.domain_key),
      licensed_users: sqlNum(tool.rollout_target_users),
      active_users: sqlNum(tool.monthly_active_users),
      usage_events: sqlNum(num(tool.monthly_active_users) * 20),
      monthly_cost_usd: "null",
      adoption_rate_percent: sqlNum(tool.adoption_actual_pct),
      value_state: sqlText("known"),
      quality_state: sqlText("passed"),
      review_state: sqlText("reviewed"),
      metric_keys_json: sqlJson(["rollout_target_users", "monthly_active_users", "adoption_actual_pct"]),
      source_refs_json: sqlJson(refs),
      gap_flags_json: sqlJson([]),
      display_payload_json: sqlJson(payload),
      source_hash: sqlText(sourceHash(payload, refs)),
    });
  }

  buildCubes(options, ctx, data, observationsByCase, projectsById);

  return {
    snapshot: {
      id: sqlText(snapshotId),
      tenant_key: sqlText(options.tenantKey),
      assessment_id: sqlText(options.assessmentId),
      snapshot_key: sqlText(options.buildVersion),
      snapshot_type: sqlText("projection_source"),
      source_hash: sqlText(sourceHashValue),
      context_hash: sqlText(sourceHashValue),
      created_by_job: sqlText(options.idempotencyKey),
      quality_state: sqlText("passed"),
      proof_uri: sqlText(`local:${options.outDir}`),
    },
    projectionManifests: projectionManifestRows,
    projectionEntries: ctx.projectionEntries,
    sourceRecordRefs: ctx.sourceRecordRefs,
    commandRows,
    valueRows,
    evidenceRows,
    aiRows,
    cubeManifests: ctx.cubeManifests,
    cubeSlices: ctx.cubeSlices,
    cubeSliceMetrics: ctx.cubeSliceMetrics,
    cubeSliceMeasures: ctx.cubeSliceMeasures,
    expected: {
      projection_manifest: projectionManifestRows.length,
      projection_entry: ctx.projectionEntries.length,
      projection_entry_source_record_ref: ctx.sourceRecordRefs.length,
      tower_command_center: commandRows.length,
      tower_value_chain: valueRows.length,
      tower_evidence_queue: evidenceRows.length,
      tower_ai_portfolio: aiRows.length,
      cube_manifest: ctx.cubeManifests.length,
      cube_slice: ctx.cubeSlices.length,
      cube_slice_metric: ctx.cubeSliceMetrics.length,
      cube_slice_measure: ctx.cubeSliceMeasures.length,
      serving: {
        tower_command_center: commandRows.length,
        tower_value_proof: valueRows.length,
        tower_decision_lanes: data.aiUseCases.length,
        tower_evidence: data.proofQueue.length,
        tower_recommended_actions: data.proofQueue.length,
        tower_ai_portfolio: data.aiUseCases.length,
        tower_cost_lens: data.aiUseCases.length,
        tower_risk_lens: data.proofQueue.length,
        tower_adoption_lens: data.tools.length,
      },
      executive: {
        total_it_budget_usd: num(data.summary.total_it_budget_usd),
        reviewed_project_count: data.projects.length,
        reviewed_project_budget_usd: num(data.summary.reviewed_project_budget_usd),
        ai_related_investment_usd: num(data.summary.ai_related_investment_usd),
        projected_annual_value_low_usd: num(data.summary.projected_annual_value_low_usd),
        board_claimable_ytd_usd: num(data.summary.board_claimable_ytd_usd),
      },
    },
  };
}

function addCubeMetric(ctx, sliceId, metricKey, role, sortOrder) {
  ctx.cubeSliceMetrics.push({
    tenant_key: sqlText(ctx.options.tenantKey),
    assessment_id: sqlText(ctx.options.assessmentId),
    cube_slice_id: sqlText(sliceId),
    metric_key: sqlText(metricKey),
    metric_role: sqlText(role),
    unit: sqlText(METRIC_UNITS.get(metricKey) ?? "count"),
    sort_order: sortOrder,
    source_hash: sqlText(sourceHash(sliceId, metricKey, role)),
  });
}

function addCubeMeasure(ctx, sliceId, measureId, metricKey, role) {
  ctx.cubeSliceMeasures.push({
    tenant_key: sqlText(ctx.options.tenantKey),
    assessment_id: sqlText(ctx.options.assessmentId),
    cube_slice_id: sqlText(sliceId),
    measure_id: sqlText(measureId),
    metric_key: sqlText(metricKey),
    measure_role: sqlText(role),
    source_hash: sqlText(sourceHash(sliceId, measureId, metricKey, role)),
  });
}

function addCubeSlice(ctx, cubeKey, sliceKey, grainKey, primaryObjectId, dimensions, measures, metricKeys, sourceRefs, qualityState = "passed") {
  const manifestId = ctx.cubeManifestIds[cubeKey];
  const sliceId = stableUuid("cube_slice", ctx.options.tenantKey, ctx.options.assessmentId, cubeKey, CUBE_VERSION, sliceKey);
  ctx.cubeSlices.push({
    id: sqlText(sliceId),
    tenant_key: sqlText(ctx.options.tenantKey),
    assessment_id: sqlText(ctx.options.assessmentId),
    snapshot_id: sqlText(ctx.snapshotId),
    cube_manifest_id: sqlText(manifestId),
    cube_key: sqlText(cubeKey),
    cube_version: CUBE_VERSION,
    slice_key: sqlText(sliceKey),
    grain_key: sqlText(grainKey),
    primary_object_id: primaryObjectId ? sqlText(primaryObjectId) : "null",
    dimensions_json: sqlJson(dimensions),
    measures_json: sqlJson(measures),
    primary_metric_key: sqlText(metricKeys[0]),
    metric_keys_json: sqlJson(metricKeys),
    source_refs_json: sqlJson(sourceRefs),
    basis_summary: sqlText("Layer 4 cube slice built from Layer 3 canonical measures."),
    value_state: sqlText("known"),
    quality_state: sqlText(qualityState),
    gap_flags_json: sqlJson(qualityState === "blocked" ? ["missing_source_measure"] : []),
    source_hash: sqlText(sourceHash(cubeKey, sliceKey, dimensions, measures, sourceRefs)),
  });
  metricKeys.forEach((metricKey, index) =>
    addCubeMetric(ctx, sliceId, metricKey, index === 0 ? "primary" : "display", index),
  );
  return sliceId;
}

function buildCubes(options, ctx, data, observationsByCase, projectsById) {
  ctx.cubeManifestIds = {};
  const cubeCounts = {
    tower_spend_value_cube: data.portfolioCube.length,
    tower_evidence_cube: data.proofQueue.length,
    ai_portfolio_cube: data.caseCube.length + data.tools.length,
  };
  for (const [cubeKey, count] of Object.entries(cubeCounts)) {
    const manifestId = stableUuid("cube_manifest", options.tenantKey, options.assessmentId, cubeKey, CUBE_VERSION);
    ctx.cubeManifestIds[cubeKey] = manifestId;
    ctx.cubeManifests.push({
      id: sqlText(manifestId),
      tenant_key: sqlText(options.tenantKey),
      assessment_id: sqlText(options.assessmentId),
      snapshot_id: sqlText(ctx.snapshotId),
      cube_key: sqlText(cubeKey),
      cube_version: CUBE_VERSION,
      rebuild_command: sqlText("npm run tower:healthcare-demo-layer4-products:write-job"),
      source_hash: sqlText(sourceHash(data.manifest, cubeKey)),
      cube_hash: sqlText(sourceHash(cubeKey, count, options.buildVersion)),
      slice_count: count,
      quality_state: sqlText("passed"),
      admission_status: sqlText("not_applicable"),
      admission_gate_results_json: sqlJson([]),
      proof_uri: sqlText(`local:${options.outDir}`),
    });
  }

  for (const row of data.portfolioCube) {
    const refs = [sourceRef(options, data.aiUseCases[0], { aggregate_cube: "tower_spend_value_cube" })];
    addCubeSlice(
      ctx,
      "tower_spend_value_cube",
      `${row.domain_name}:${row.business_value_type}:${row.finance_status}`,
      "domain_value_status",
      null,
      {
        domain_name: row.domain_name,
        business_value_type: row.business_value_type,
        finance_status: row.finance_status,
      },
      {
        business_case_count: num(row.business_case_count),
        approved_investment_usd: num(row.approved_investment_usd),
        projected_annual_value_low_usd: num(row.projected_annual_value_low_usd),
        projected_annual_value_high_usd: num(row.projected_annual_value_high_usd),
        board_claimable_ytd_usd: num(row.board_claimable_ytd_usd),
      },
      [
        "project_approved_budget_usd",
        "use_case_promised_annual_value_low_usd",
        "use_case_promised_annual_value_high_usd",
        "board_claimable_value_usd",
      ],
      refs,
    );
  }

  const casesById = new Map(data.aiUseCases.map((row) => [row.business_case_id, row]));
  for (const row of data.caseCube) {
    const useCase = casesById.get(row.business_case_id);
    if (!useCase) continue;
    const objectId = objectUuid(options, "ai_use_case", useCase.canonical_ai_use_case_id);
    const refs = [sourceRef(options, useCase, { business_case_id: row.business_case_id })];
    const sliceId = addCubeSlice(
      ctx,
      "ai_portfolio_cube",
      row.business_case_id,
      "business_case",
      objectId,
      {
        domain_name: row.domain_name,
        business_value_type: row.business_value_type,
        finance_status: row.finance_status,
        committee_decision: row.committee_decision,
      },
      {
        approved_investment_usd: num(row.approved_investment_usd),
        projected_annual_value_low_usd: num(row.projected_annual_value_low_usd),
        projected_annual_value_high_usd: num(row.projected_annual_value_high_usd),
        board_claimable_ytd_usd: num(row.board_claimable_ytd_usd),
        readiness_score: num(row.readiness_score),
      },
      [
        "use_case_promised_annual_value_low_usd",
        "use_case_promised_annual_value_high_usd",
        "readiness_score",
      ],
      refs,
    );
    if (num(row.projected_annual_value_low_usd) > 0) {
      addCubeMeasure(
        ctx,
        sliceId,
        measureUuid(options, "ai_use_case", useCase.canonical_ai_use_case_id, "use_case_promised_annual_value_low_usd", useCase, { scenario: "planned" }),
        "use_case_promised_annual_value_low_usd",
        "primary",
      );
    }
    addCubeMeasure(
      ctx,
      sliceId,
      measureUuid(options, "ai_use_case", useCase.canonical_ai_use_case_id, "readiness_score", useCase, { scenario: "current" }),
      "readiness_score",
      "display",
    );
  }

  for (const tool of data.tools) {
    const objectId = objectUuid(options, "ai_tool", tool.canonical_tool_id);
    const refs = [sourceRef(options, tool, { tool_rollout_id: tool.tool_rollout_id })];
    const sliceId = addCubeSlice(
      ctx,
      "ai_portfolio_cube",
      tool.tool_rollout_id,
      "tool_rollout",
      objectId,
      {
        vendor_name: tool.vendor_name,
        rollout_stage: tool.rollout_stage,
        rollout_goal: tool.rollout_goal,
      },
      {
        rollout_target_users: num(tool.rollout_target_users),
        monthly_active_users: num(tool.monthly_active_users),
        adoption_target_pct: num(tool.adoption_target_pct),
        adoption_actual_pct: num(tool.adoption_actual_pct),
      },
      ["rollout_target_users", "monthly_active_users", "adoption_actual_pct"],
      refs,
    );
    addCubeMeasure(ctx, sliceId, measureUuid(options, "ai_tool", tool.canonical_tool_id, "rollout_target_users", tool, { scenario: "target" }), "rollout_target_users", "primary");
    addCubeMeasure(ctx, sliceId, measureUuid(options, "ai_tool", tool.canonical_tool_id, "monthly_active_users", tool, { scenario: "actual" }), "monthly_active_users", "display");
    addCubeMeasure(ctx, sliceId, measureUuid(options, "ai_tool", tool.canonical_tool_id, "adoption_actual_pct", tool, { scenario: "actual" }), "adoption_actual_pct", "display");
  }

  for (const row of data.proofQueue) {
    const useCase = casesById.get(row.business_case_id);
    if (!useCase) continue;
    const refs = [sourceRef(options, useCase, { business_case_id: row.business_case_id })];
    const actual = {
      boardClaimable: sumBy(observationsByCase.get(row.business_case_id) ?? [], "board_claimable_value_usd"),
    };
    const project = projectsById.get(useCase.project_id);
    const sliceId = addCubeSlice(
      ctx,
      "tower_evidence_cube",
      row.business_case_id,
      "evidence_gap",
      objectUuid(options, "ai_use_case", useCase.canonical_ai_use_case_id),
      {
        finance_status: row.finance_status,
        business_value_type: row.business_value_type,
        owner_role: project?.sponsor_role ?? "program_sponsor",
      },
      {
        blocked_value_usd: Math.max(0, num(row.projected_annual_value_low_usd) - actual.boardClaimable),
        projected_annual_value_low_usd: num(row.projected_annual_value_low_usd),
      },
      ["use_case_promised_annual_value_low_usd"],
      refs,
    );
    if (num(row.projected_annual_value_low_usd) > 0) {
      addCubeMeasure(
        ctx,
        sliceId,
        measureUuid(options, "ai_use_case", useCase.canonical_ai_use_case_id, "use_case_promised_annual_value_low_usd", useCase, { scenario: "planned" }),
        "use_case_promised_annual_value_low_usd",
        "primary",
      );
    }
  }
}

/**
 * Every projection row this loader owns, in an order that satisfies the foreign keys.
 *
 * Extracted so it can run on its own. `ecl_projection.tower_value_chain` carries
 * `tower_value_chain_measure_fk` onto `ecl_context.measure` — a Layer 4 row referencing a Layer 3
 * one — so Layer 3 cannot be reloaded while these rows exist. That makes any Layer 3 reload fail
 * once Layer 4 has been built: structural, not incidental, and not specific to any one change.
 *
 * The dependency resolves in one direction only, so the teardown belongs on this side of the layer
 * boundary rather than having the canonical loader reach across it. Documented sequence:
 *
 *     layer4 --purge-only  ->  layer3 load  ->  layer4 load
 *
 * Layer 4 is deliberately empty between the first and last step. A projection derived from
 * canonical data is not valid while that data is being replaced, and pretending otherwise is what
 * would let a stale projection outlive the rows it was built from.
 */
function projectionDeletes(options) {
  const tenant = sqlText(options.tenantKey);
  const assessment = sqlText(options.assessmentId);
  return [
    `delete from ecl_projection.cube_slice_measure where tenant_key = ${tenant} and assessment_id = ${assessment} and cube_slice_id in (select id from ecl_projection.cube_slice where tenant_key = ${tenant} and assessment_id = ${assessment} and cube_key in ('tower_spend_value_cube','tower_evidence_cube','ai_portfolio_cube'));`,
    `delete from ecl_projection.cube_slice_metric where tenant_key = ${tenant} and assessment_id = ${assessment} and cube_slice_id in (select id from ecl_projection.cube_slice where tenant_key = ${tenant} and assessment_id = ${assessment} and cube_key in ('tower_spend_value_cube','tower_evidence_cube','ai_portfolio_cube'));`,
    `delete from ecl_projection.cube_slice where tenant_key = ${tenant} and assessment_id = ${assessment} and cube_key in ('tower_spend_value_cube','tower_evidence_cube','ai_portfolio_cube');`,
    `delete from ecl_projection.cube_manifest where tenant_key = ${tenant} and assessment_id = ${assessment} and cube_key in ('tower_spend_value_cube','tower_evidence_cube','ai_portfolio_cube');`,
    `delete from ecl_projection.projection_entry_source_record_ref where tenant_key = ${tenant} and assessment_id = ${assessment} and projection_entry_id in (select id from ecl_projection.projection_entry where tenant_key = ${tenant} and assessment_id = ${assessment} and surface_key in ('tower_command_center','tower_value_chain','tower_evidence_queue','tower_ai_portfolio'));`,
    `delete from ecl_projection.projection_entry_object_ref where tenant_key = ${tenant} and assessment_id = ${assessment} and projection_entry_id in (select id from ecl_projection.projection_entry where tenant_key = ${tenant} and assessment_id = ${assessment} and surface_key in ('tower_command_center','tower_value_chain','tower_evidence_queue','tower_ai_portfolio'));`,
    `delete from ecl_projection.projection_entry_metric_ref where tenant_key = ${tenant} and assessment_id = ${assessment} and projection_entry_id in (select id from ecl_projection.projection_entry where tenant_key = ${tenant} and assessment_id = ${assessment} and surface_key in ('tower_command_center','tower_value_chain','tower_evidence_queue','tower_ai_portfolio'));`,
    `delete from ecl_projection.projection_entry_measure_ref where tenant_key = ${tenant} and assessment_id = ${assessment} and projection_entry_id in (select id from ecl_projection.projection_entry where tenant_key = ${tenant} and assessment_id = ${assessment} and surface_key in ('tower_command_center','tower_value_chain','tower_evidence_queue','tower_ai_portfolio'));`,
    `delete from ecl_projection.tower_command_center where tenant_key = ${tenant} and assessment_id = ${assessment};`,
    `delete from ecl_projection.tower_value_chain where tenant_key = ${tenant} and assessment_id = ${assessment};`,
    `delete from ecl_projection.tower_evidence_queue where tenant_key = ${tenant} and assessment_id = ${assessment};`,
    `delete from ecl_projection.tower_ai_portfolio where tenant_key = ${tenant} and assessment_id = ${assessment};`,
    `delete from ecl_projection.projection_entry where tenant_key = ${tenant} and assessment_id = ${assessment} and surface_key in ('tower_command_center','tower_value_chain','tower_evidence_queue','tower_ai_portfolio');`,
    `delete from ecl_projection.projection_manifest where tenant_key = ${tenant} and assessment_id = ${assessment} and projection_key in ('tower_command_center','tower_decision_lanes','tower_recommended_actions','tower_value_proof','tower_cost_lens','tower_evidence','tower_risk_lens','tower_ai_portfolio','tower_adoption_lens');`,
    `delete from ecl_context.snapshot where tenant_key = ${tenant} and assessment_id = ${assessment} and snapshot_key = ${sqlText(options.buildVersion)};`,
  ];
}

/** The deletes alone, so Layer 3 can be replaced. Carries the same approval gate as a write. */
function writePurgeSql(outPath, options) {
  const sql = ["begin;", ...projectionDeletes(options), "commit;"].join("\n");
  fs.writeFileSync(outPath, sql, "utf8");
}

/**
 * Declare this generation active, and retire whatever was active before it.
 *
 * The active generation used to be inferred — `serving.tower_active_assessment_keys()` ranked on
 * payload shape, projection version, created_at and finally assessment id. A tenant once saw
 * $492.5M instead of $677.8M because that ranking picked a retired generation. `AGENTS.md`:
 * identity is declared, never inferred.
 *
 * Retire first, then activate. A partial unique index permits one active generation per tenant, so
 * activating before retiring would be rejected — which is the index doing its job.
 *
 * Guarded on the table existing, so a database that has not taken the lifecycle migration yet
 * loads exactly as it did before instead of failing.
 */
function lifecycleDeclarationSql(options) {
  const tenant = sqlText(options.tenantKey);
  const assessment = sqlText(options.assessmentId);
  const build = sqlText(options.buildVersion);
  return `do $lifecycle$
begin
  if to_regclass('ecl_projection.tower_assessment_lifecycle') is null then
    raise notice 'tower_assessment_lifecycle absent; generation not declared';
    return;
  end if;

  update ecl_projection.tower_assessment_lifecycle
     set state = 'retired',
         retired_at = now()
   where tenant_key = ${tenant}
     and state = 'active'
     and not (assessment_id = ${assessment} and projection_version = ${PROJECTION_VERSION});

  insert into ecl_projection.tower_assessment_lifecycle
    (tenant_key, assessment_id, projection_version, state, activated_at, retired_at, build_version, note)
  values
    (${tenant}, ${assessment}, ${PROJECTION_VERSION}, 'active', now(), null, ${build},
     'Declared by the Layer 4 product load.')
  on conflict (tenant_key, assessment_id, projection_version)
  do update set
    state = 'active',
    activated_at = now(),
    retired_at = null,
    build_version = excluded.build_version;
end
$lifecycle$;`;
}

function writeLoadSql(outPath, options, rows) {
  const sql = [
    "begin;",
    ...projectionDeletes(options),
    insertSql("ecl_context.snapshot", ["id", "tenant_key", "assessment_id", "snapshot_key", "snapshot_type", "source_hash", "context_hash", "created_by_job", "quality_state", "proof_uri"], [rows.snapshot]),
    insertSql("ecl_projection.projection_manifest", ["id", "tenant_key", "assessment_id", "snapshot_id", "projection_key", "projection_version", "rebuild_command", "source_hash", "projection_hash", "row_count", "quality_state", "admission_status", "admission_gate_results_json", "gated_claim_count", "proof_uri"], rows.projectionManifests),
    insertSql("ecl_projection.projection_entry", ["id", "tenant_key", "assessment_id", "snapshot_id", "projection_manifest_id", "projection_version", "surface_key", "row_key", "row_type", "source_hash", "refs_content_hash", "refs_cache_json", "display_cache_json"], rows.projectionEntries),
    insertSql("ecl_projection.projection_entry_source_record_ref", ["tenant_key", "assessment_id", "projection_entry_id", "source_record_id", "ref_role", "sort_order", "source_hash"], rows.sourceRecordRefs),
    insertSql("ecl_projection.tower_command_center", ["id", "tenant_key", "assessment_id", "snapshot_id", "projection_manifest_id", "projection_entry_id", "projection_version", "row_key", "page_key", "row_type", "primary_object_id", "claim_id", "claim_gate_status", "claim_gate_reason_code", "claim_gate_reason_detail", "next_gate", "evidence_needed_json", "funded_amount_usd", "promised_value_usd", "usage_supported_value_usd", "finance_validated_value_usd", "claimable_value_usd", "blocked_value_usd", "proof_maturity_score", "risk_pressure_score", "usage_strength_score", "owner_role", "handoff_module", "value_state", "quality_state", "metric_keys_json", "source_refs_json", "gap_flags_json", "display_payload_json", "source_hash"], rows.commandRows),
    insertSql("ecl_projection.tower_value_chain", ["id", "tenant_key", "assessment_id", "snapshot_id", "projection_manifest_id", "projection_entry_id", "projection_version", "row_key", "page_key", "row_type", "primary_object_id", "claim_id", "observation_key", "metric_key", "measure_id", "source_record_id", "review_event_id", "evidence_state", "claim_gate_status", "claim_gate_reason_code", "claim_gate_reason_detail", "next_gate", "evidence_needed_json", "baseline_value", "current_value", "target_value", "claimable_value_usd", "blocked_value_usd", "value_state", "quality_state", "source_refs_json", "display_payload_json", "gap_flags_json", "source_hash"], rows.valueRows),
    insertSql("ecl_projection.tower_evidence_queue", ["id", "tenant_key", "assessment_id", "snapshot_id", "projection_manifest_id", "projection_entry_id", "projection_version", "row_key", "page_key", "row_type", "primary_object_id", "claim_id", "claim_gate_status", "claim_gate_reason_code", "claim_gate_reason_detail", "evidence_needed_json", "next_gate", "owner_role", "due_date", "related_measure_id", "source_record_id", "review_event_id", "evidence_state", "priority_score", "source_refs_json", "gap_flags_json", "display_payload_json", "source_hash"], rows.evidenceRows),
    insertSql("ecl_projection.tower_ai_portfolio", ["id", "tenant_key", "assessment_id", "snapshot_id", "projection_manifest_id", "projection_entry_id", "projection_version", "row_key", "use_case_object_id", "tool_object_id", "function_object_id", "use_case_name", "tool_name", "business_function", "licensed_users", "active_users", "usage_events", "monthly_cost_usd", "adoption_rate_percent", "value_state", "quality_state", "review_state", "metric_keys_json", "source_refs_json", "gap_flags_json", "display_payload_json", "source_hash"], rows.aiRows),
    insertSql("ecl_projection.cube_manifest", ["id", "tenant_key", "assessment_id", "snapshot_id", "cube_key", "cube_version", "rebuild_command", "source_hash", "cube_hash", "slice_count", "quality_state", "admission_status", "admission_gate_results_json", "proof_uri"], rows.cubeManifests),
    insertSql("ecl_projection.cube_slice", ["id", "tenant_key", "assessment_id", "snapshot_id", "cube_manifest_id", "cube_key", "cube_version", "slice_key", "grain_key", "primary_object_id", "dimensions_json", "measures_json", "primary_metric_key", "metric_keys_json", "source_refs_json", "basis_summary", "value_state", "quality_state", "gap_flags_json", "source_hash"], rows.cubeSlices),
    insertSql("ecl_projection.cube_slice_metric", ["tenant_key", "assessment_id", "cube_slice_id", "metric_key", "metric_role", "unit", "sort_order", "source_hash"], rows.cubeSliceMetrics),
    insertSql("ecl_projection.cube_slice_measure", ["tenant_key", "assessment_id", "cube_slice_id", "measure_id", "metric_key", "measure_role", "source_hash"], rows.cubeSliceMeasures),
    // Last, inside the same transaction as the rows it describes. A generation that fails to load
    // is never declared active, and the prior one keeps serving.
    lifecycleDeclarationSql(options),
    "commit;",
  ].join("\n");
  fs.writeFileSync(outPath, sql, "utf8");
}

function readbackSql(options) {
  const tenant = sqlText(options.tenantKey);
  const assessment = sqlText(options.assessmentId);
  return `
select jsonb_build_object(
  'tenant_key', ${tenant},
  'assessment_id', ${assessment},
  'projection_manifest', (select count(*) from ecl_projection.projection_manifest where tenant_key = ${tenant} and assessment_id = ${assessment} and projection_version = ${PROJECTION_VERSION} and projection_key like 'tower_%'),
  'projection_entry', (select count(*) from ecl_projection.projection_entry where tenant_key = ${tenant} and assessment_id = ${assessment} and projection_version = ${PROJECTION_VERSION} and surface_key in ('tower_command_center','tower_value_chain','tower_evidence_queue','tower_ai_portfolio')),
  'projection_entry_source_record_ref', (select count(*) from ecl_projection.projection_entry_source_record_ref where tenant_key = ${tenant} and assessment_id = ${assessment} and projection_entry_id in (select id from ecl_projection.projection_entry where tenant_key = ${tenant} and assessment_id = ${assessment} and projection_version = ${PROJECTION_VERSION} and surface_key in ('tower_command_center','tower_value_chain','tower_evidence_queue','tower_ai_portfolio'))),
  'tower_command_center', (select count(*) from ecl_projection.tower_command_center where tenant_key = ${tenant} and assessment_id = ${assessment} and projection_version = ${PROJECTION_VERSION}),
  'tower_value_chain', (select count(*) from ecl_projection.tower_value_chain where tenant_key = ${tenant} and assessment_id = ${assessment} and projection_version = ${PROJECTION_VERSION}),
  'tower_evidence_queue', (select count(*) from ecl_projection.tower_evidence_queue where tenant_key = ${tenant} and assessment_id = ${assessment} and projection_version = ${PROJECTION_VERSION}),
  'tower_ai_portfolio', (select count(*) from ecl_projection.tower_ai_portfolio where tenant_key = ${tenant} and assessment_id = ${assessment} and projection_version = ${PROJECTION_VERSION}),
  'cube_manifest', (select count(*) from ecl_projection.cube_manifest where tenant_key = ${tenant} and assessment_id = ${assessment} and cube_version = ${CUBE_VERSION} and cube_key in ('tower_spend_value_cube','tower_evidence_cube','ai_portfolio_cube')),
  'cube_slice', (select count(*) from ecl_projection.cube_slice where tenant_key = ${tenant} and assessment_id = ${assessment} and cube_version = ${CUBE_VERSION} and cube_key in ('tower_spend_value_cube','tower_evidence_cube','ai_portfolio_cube')),
  'cube_slice_metric', (select count(*) from ecl_projection.cube_slice_metric where tenant_key = ${tenant} and assessment_id = ${assessment} and cube_slice_id in (select id from ecl_projection.cube_slice where tenant_key = ${tenant} and assessment_id = ${assessment} and cube_version = ${CUBE_VERSION} and cube_key in ('tower_spend_value_cube','tower_evidence_cube','ai_portfolio_cube'))),
  'cube_slice_measure', (select count(*) from ecl_projection.cube_slice_measure where tenant_key = ${tenant} and assessment_id = ${assessment} and cube_slice_id in (select id from ecl_projection.cube_slice where tenant_key = ${tenant} and assessment_id = ${assessment} and cube_version = ${CUBE_VERSION} and cube_key in ('tower_spend_value_cube','tower_evidence_cube','ai_portfolio_cube'))),
  'serving_counts', jsonb_build_object(
    'tower_command_center', (select count(*) from serving.tower_command_center where tenant_key = ${tenant}),
    'tower_value_proof', (select count(*) from serving.tower_value_proof where tenant_key = ${tenant}),
    'tower_decision_lanes', (select count(*) from serving.tower_decision_lanes where tenant_key = ${tenant}),
    'tower_evidence', (select count(*) from serving.tower_evidence where tenant_key = ${tenant}),
    'tower_recommended_actions', (select count(*) from serving.tower_recommended_actions where tenant_key = ${tenant}),
    'tower_ai_portfolio', (select count(*) from serving.tower_ai_portfolio where tenant_key = ${tenant}),
    'tower_cost_lens', (select count(*) from serving.tower_cost_lens where tenant_key = ${tenant}),
    'tower_risk_lens', (select count(*) from serving.tower_risk_lens where tenant_key = ${tenant}),
    'tower_adoption_lens', (select count(*) from serving.tower_adoption_lens where tenant_key = ${tenant})
  ),
  'source_ref_missing', (
    select count(*) from (
      select source_refs_json from ecl_projection.tower_command_center where tenant_key = ${tenant} and assessment_id = ${assessment} and projection_version = ${PROJECTION_VERSION}
      union all select source_refs_json from ecl_projection.tower_value_chain where tenant_key = ${tenant} and assessment_id = ${assessment} and projection_version = ${PROJECTION_VERSION}
      union all select source_refs_json from ecl_projection.tower_evidence_queue where tenant_key = ${tenant} and assessment_id = ${assessment} and projection_version = ${PROJECTION_VERSION}
      union all select source_refs_json from ecl_projection.tower_ai_portfolio where tenant_key = ${tenant} and assessment_id = ${assessment} and projection_version = ${PROJECTION_VERSION}
    ) rows where coalesce(jsonb_array_length(source_refs_json), 0) = 0
  ),
  'tower_value_chain_measure_drift', (
    select count(*) from ecl_projection.tower_value_chain p
    left join ecl_context.measure m on m.tenant_key = p.tenant_key and m.assessment_id = p.assessment_id and m.id = p.measure_id
    where p.tenant_key = ${tenant} and p.assessment_id = ${assessment} and p.projection_version = ${PROJECTION_VERSION} and p.measure_id is not null and m.id is null
  ),
  'tower_ai_primary_object_drift', (
    select count(*) from ecl_projection.tower_ai_portfolio p
    left join ecl_context.object o on o.tenant_key = p.tenant_key and o.assessment_id = p.assessment_id and o.id = p.use_case_object_id
    where p.tenant_key = ${tenant} and p.assessment_id = ${assessment} and p.projection_version = ${PROJECTION_VERSION} and o.id is null
  ),
  'cube_metric_drift', (
    select count(*) from ecl_projection.cube_slice_metric csm
    left join ecl_context.metric_definition md on md.tenant_key = csm.tenant_key and md.metric_key = csm.metric_key
    where csm.tenant_key = ${tenant} and csm.assessment_id = ${assessment} and md.metric_key is null
  ),
  'cube_measure_drift', (
    select count(*) from ecl_projection.cube_slice_measure csm
    left join ecl_context.measure m on m.tenant_key = csm.tenant_key and m.assessment_id = csm.assessment_id and m.id = csm.measure_id
    where csm.tenant_key = ${tenant} and csm.assessment_id = ${assessment} and m.id is null
  ),
  'executive_totals', (
    select display_payload_json from ecl_projection.tower_command_center
    where tenant_key = ${tenant} and assessment_id = ${assessment} and projection_version = ${PROJECTION_VERSION} and row_key = 'executive_summary'
    limit 1
  )
)::text;
`.trim();
}

function writeReadbackSql(outPath, options) {
  fs.writeFileSync(outPath, `${readbackSql(options)}\n`, "utf8");
}

function validateReadback(readback, expected) {
  const issues = [];
  for (const key of [
    "projection_manifest",
    "projection_entry",
    "projection_entry_source_record_ref",
    "tower_command_center",
    "tower_value_chain",
    "tower_evidence_queue",
    "tower_ai_portfolio",
    "cube_manifest",
    "cube_slice",
    "cube_slice_metric",
    "cube_slice_measure",
  ]) {
    if (Number(readback[key]) !== Number(expected[key])) {
      issues.push(`${key}_expected_${expected[key]}_got_${readback[key]}`);
    }
  }
  for (const [surface, count] of Object.entries(expected.serving)) {
    if (Number(readback.serving_counts?.[surface]) !== Number(count)) {
      issues.push(`serving_${surface}_expected_${count}_got_${readback.serving_counts?.[surface]}`);
    }
  }
  for (const key of [
    "source_ref_missing",
    "tower_value_chain_measure_drift",
    "tower_ai_primary_object_drift",
    "cube_metric_drift",
    "cube_measure_drift",
  ]) {
    if (Number(readback[key] ?? 1) !== 0) issues.push(key);
  }
  for (const [key, value] of Object.entries(expected.executive)) {
    if (Number(readback.executive_totals?.[key]) !== Number(value)) {
      issues.push(`executive_${key}_expected_${value}_got_${readback.executive_totals?.[key]}`);
    }
  }
  return issues;
}

function run(command, label, outDir, sensitive = false) {
  const result = spawnSync(command[0], command.slice(1), {
    cwd: ROOT,
    encoding: "utf8",
    env: { ...process.env, PGCONNECT_TIMEOUT: process.env.PGCONNECT_TIMEOUT ?? "30" },
  });
  fs.writeFileSync(path.join(outDir, `${label}.stdout.log`), sensitive ? "<redacted>\n" : result.stdout, "utf8");
  fs.writeFileSync(path.join(outDir, `${label}.stderr.log`), sensitive ? "<redacted>\n" : result.stderr, "utf8");
  if (result.status !== 0) {
    throw new Error(`${label} failed: ${(result.stderr || result.stdout).slice(0, 1200)}`);
  }
  return result.stdout;
}

function runPsqlFile(databaseUrl, sqlPath, outDir, label) {
  return run(["psql", databaseUrl, "-v", "ON_ERROR_STOP=1", "-f", sqlPath], label, outDir, true);
}

function runPsqlReadback(databaseUrl, options, outDir) {
  const stdout = run(["psql", databaseUrl, "-v", "ON_ERROR_STOP=1", "-At", "-c", readbackSql(options)], "03-readback", outDir);
  const parsed = JSON.parse(stdout.trim());
  fs.writeFileSync(path.join(outDir, "03-readback.json"), `${JSON.stringify(parsed, null, 2)}\n`, "utf8");
  return parsed;
}

function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function emitProofBundle(outDir) {
  const tarPath = path.join(os.tmpdir(), `meridian-tower-layer4-proof-${Date.now()}.tgz`);
  const rootName = path.basename(outDir);
  const result = spawnSync("tar", ["-czf", tarPath, "-C", path.dirname(outDir), rootName], {
    cwd: ROOT,
    encoding: "utf8",
  });
  if (result.status !== 0) throw new Error(result.stderr || "proof bundle tar failed");
  process.stdout.write(`${PROOF_BEGIN}\n`);
  process.stdout.write(fs.readFileSync(tarPath).toString("base64"));
  process.stdout.write(`\n${PROOF_END}\n`);
}

function main() {
  const options = parseArgs(process.argv.slice(2));
  fs.mkdirSync(options.outDir, { recursive: true });
  const rows = buildRows(options);
  const loadSqlPath = path.join(options.outDir, "tower_layer4_product_cube_load.sql");
  const readbackSqlPath = path.join(options.outDir, "tower_layer4_product_cube_readback.sql");
  writeLoadSql(loadSqlPath, options, rows);
  writeReadbackSql(readbackSqlPath, options);

  const summary = {
    generated_at: new Date().toISOString(),
    status: "dry_run_ready",
    boundary: {
      layer: "layer_4_products_and_cubes",
      azure_write_requested: options.write,
      source_layer_written: false,
      canonical_layer_written: false,
      product_projection_written: options.write,
      cube_layer_written: options.write,
    },
    job_contract: {
      job_name: process.env.ACA_OPERATOR_JOB ?? "job-abarva-private-operator-eus",
      tenant_scope: options.tenantKey,
      assessment_id: options.assessmentId,
      build_version: options.buildVersion,
      input_source_version: options.inputSourceVersion,
      idempotency_key: options.idempotencyKey,
      operator_identity: process.env.USER ?? "unknown",
      git_sha: gitSha(),
      image_digest: process.env.ABARVA_OPERATOR_IMAGE_DIGEST ?? null,
    },
    package_dir: options.packageDir,
    out_dir: options.outDir,
    expected_counts: rows.expected,
    load_sql: loadSqlPath,
    readback_sql: readbackSqlPath,
    readback: null,
    issues: [],
  };

  if (options.write || options.readbackOnly || options.purgeOnly) {
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL is required for --write, --readback-only or --purge-only");
    }
  }
  if (options.purgeOnly) {
    // Purging mutates, so it carries the same approval gate as a write. It exists to unblock a
    // Layer 3 reload; see projectionDeletes() for why the teardown has to happen here first.
    if (!envFlag("TOWER_LAYER4_AZURE_WRITE_APPROVED")) {
      throw new Error("Refusing Azure purge without TOWER_LAYER4_AZURE_WRITE_APPROVED=true");
    }
    const purgeSqlPath = path.join(options.outDir, "tower_layer4_product_cube_purge.sql");
    writePurgeSql(purgeSqlPath, options);
    summary.purge_sql = purgeSqlPath;
    summary.boundary.product_projection_written = false;
    summary.boundary.cube_layer_written = false;
    runPsqlFile(process.env.DATABASE_URL, purgeSqlPath, options.outDir, "02-purge");
    summary.status = "purge_applied";
    writeJson(path.join(options.outDir, "tower_layer4_product_cube_load_summary.json"), summary);
    console.log(JSON.stringify(summary, null, 2));
    if (options.emitProofBundle) emitProofBundle(options.outDir);
    return;
  }
  if (options.write) {
    if (!envFlag("TOWER_LAYER4_AZURE_WRITE_APPROVED")) {
      throw new Error("Refusing Azure write without TOWER_LAYER4_AZURE_WRITE_APPROVED=true");
    }
    runPsqlFile(process.env.DATABASE_URL, loadSqlPath, options.outDir, "02-load");
    summary.status = "write_applied";
  }
  if (options.write || options.readbackOnly) {
    const readback = runPsqlReadback(process.env.DATABASE_URL, options, options.outDir);
    summary.readback = readback;
    summary.issues = validateReadback(readback, rows.expected);
    summary.status = summary.issues.length ? "failed" : options.write ? "write_verified" : "readback_verified";
  }
  writeJson(path.join(options.outDir, "tower_layer4_product_cube_load_summary.json"), summary);
  console.log(JSON.stringify(summary, null, 2));
  if (options.emitProofBundle) emitProofBundle(options.outDir);
  if (summary.issues.length) process.exitCode = 1;
}

main();
