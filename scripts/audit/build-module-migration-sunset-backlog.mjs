#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";

const REPO = process.cwd();
const AUDIT_DIR = path.join(REPO, "reports/module-data-integration-audit/2026-07-27");
const OUT_DIR = path.join(REPO, "reports/module-migration-sunset-backlog/2026-07-27");
const DEFAULT_ARTIFACT_TOOL =
  "/Users/anand/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/@oai/artifact-tool/dist/artifact_tool.mjs";

const csvHeaders = {
  migrationBacklog: [
    "wave",
    "module",
    "current_object_or_path",
    "current_authority",
    "current_writers",
    "current_readers",
    "target_operational_owner",
    "canonical_promotion_target",
    "target_consumption_projection",
    "migration_method",
    "historical_backfill",
    "dual_run_requirement",
    "reconciliation_rule",
    "cutover_dependency",
    "rollback_path",
    "read_only_observation_period",
    "archive_requirement",
    "drop_authorization",
    "status",
  ],
  legacySunset: [
    "module",
    "legacy_path",
    "current_writers",
    "current_readers",
    "why_it_exists",
    "convergence_problem",
    "target_state",
    "sunset_sequence",
    "required_business_event_telemetry",
    "read_only_observation_period",
    "archive_requirement",
    "drop_authorization",
    "status",
  ],
  promotionMatrix: [
    "module",
    "schema_table",
    "canonical_target",
    "current_authority",
    "identity_map_required",
    "publication_trigger",
    "required_evidence",
    "historical_backfill",
    "dual_run_requirement",
    "reconciliation_rule",
    "cutover_dependency",
    "rollback_path",
    "status",
  ],
  projectionCatalog: [
    "module",
    "source_object",
    "projection_family",
    "intended_consumers",
    "refresh_trigger",
    "current_authority",
    "lineage_requirement",
    "parity_test",
    "rollback_path",
    "status",
  ],
  telemetryCatalog: [
    "business_event",
    "owning_module",
    "when_emitted",
    "required_keys",
    "why_it_matters",
    "migration_use",
    "status",
  ],
};

const workbookMap = [
  ["MODULE_DATA_LAYER_MIGRATION_BACKLOG.csv", "MODULE_DATA_LAYER_MIGRATION_BACKLOG.xlsx", "Migration Backlog"],
  ["LEGACY_PATH_AND_CONSUMER_SUNSET_REGISTER.csv", "LEGACY_PATH_AND_CONSUMER_SUNSET_REGISTER.xlsx", "Sunset Register"],
  ["CANONICAL_PROMOTION_IMPLEMENTATION_MATRIX.csv", "CANONICAL_PROMOTION_IMPLEMENTATION_MATRIX.xlsx", "Promotion Matrix"],
  ["SHARED_CONSUMPTION_PROJECTION_CATALOG.csv", "SHARED_CONSUMPTION_PROJECTION_CATALOG.xlsx", "Projection Catalog"],
  ["BUSINESS_EVENT_TELEMETRY_CATALOG.csv", "BUSINESS_EVENT_TELEMETRY_CATALOG.xlsx", "Telemetry Catalog"],
];

function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const next = text[i + 1];
    if (inQuotes && char === '"' && next === '"') {
      field += '"';
      i += 1;
    } else if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      row.push(field);
      field = "";
    } else if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && next === "\n") i += 1;
      row.push(field);
      if (row.some((value) => value.length)) rows.push(row);
      row = [];
      field = "";
    } else {
      field += char;
    }
  }
  if (field.length || row.length) {
    row.push(field);
    if (row.some((value) => value.length)) rows.push(row);
  }
  return rows;
}

function parseObjects(text) {
  const rows = parseCsv(text);
  const [headers, ...body] = rows;
  return body.map((row) => Object.fromEntries(headers.map((header, index) => [header, row[index] || ""])));
}

function csvEscape(value) {
  if (value === null || value === undefined) return "";
  const text = Array.isArray(value) ? value.join("; ") : String(value);
  if (/[",\n\r]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
}

async function writeCsv(fileName, headers, rows) {
  const lines = [headers.join(",")];
  for (const row of rows) lines.push(headers.map((header) => csvEscape(row[header])).join(","));
  await fs.writeFile(path.join(OUT_DIR, fileName), `${lines.join("\n")}\n`);
}

function columnLetter(index) {
  let value = index + 1;
  let label = "";
  while (value > 0) {
    const mod = (value - 1) % 26;
    label = String.fromCharCode(65 + mod) + label;
    value = Math.floor((value - mod) / 26);
  }
  return label;
}

async function loadArtifactTool() {
  const candidates = [process.env.ARTIFACT_TOOL_MODULE, "@oai/artifact-tool", DEFAULT_ARTIFACT_TOOL].filter(Boolean);
  let lastError;
  for (const candidate of candidates) {
    try {
      return await import(candidate);
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError;
}

function applyFormatting(sheet, rows) {
  if (!rows.length) return;
  const rowCount = rows.length;
  const colCount = Math.max(...rows.map((row) => row.length));
  const lastCol = columnLetter(colCount - 1);
  sheet.showGridLines = false;
  sheet.freezePanes.freezeRows(1);
  const used = sheet.getRange(`A1:${lastCol}${rowCount}`);
  used.format.font.name = "Aptos";
  used.format.font.size = 10;
  used.format.wrapText = true;
  used.format.borders = {
    insideHorizontal: { style: "thin", color: "#E5E7EB" },
    top: { style: "thin", color: "#CBD5E1" },
    bottom: { style: "thin", color: "#CBD5E1" },
  };
  const header = sheet.getRange(`A1:${lastCol}1`);
  header.format.fill.color = "#111827";
  header.format.font.color = "#FFFFFF";
  header.format.font.bold = true;
  header.format.rowHeightPx = 34;
  used.format.autofitColumns();
  used.format.autofitRows();
  for (let i = 0; i < colCount; i += 1) {
    const width = i <= 2 ? 34 : 42;
    sheet.getRange(`${columnLetter(i)}:${columnLetter(i)}`).format.columnWidth = width;
  }
}

async function writeWorkbook({ Workbook, SpreadsheetFile }, csvFile, xlsxFile, sheetName) {
  const rows = parseCsv(await fs.readFile(path.join(OUT_DIR, csvFile), "utf8"));
  const workbook = Workbook.create();
  const sheet = workbook.worksheets.add(sheetName);
  const colCount = Math.max(...rows.map((row) => row.length), 1);
  const normalized = rows.map((row) => [...row, ...Array(Math.max(0, colCount - row.length)).fill("")]);
  sheet.getRange(`A1:${columnLetter(colCount - 1)}${normalized.length}`).values = normalized;
  applyFormatting(sheet, normalized);
  const output = await SpreadsheetFile.exportXlsx(workbook);
  await output.save(path.join(OUT_DIR, xlsxFile));
}

function objectBacklogRows(inventory) {
  const rows = [];
  for (const row of inventory) {
    if (row.future_classification === "archive") continue;
    rows.push({
      wave:
        row.future_classification === "promote_link_canonical_knowledge"
          ? "Wave 1 identity and references"
          : row.future_classification === "project_shared_consumption"
            ? "Wave 5 cross-module consumption"
            : "Module-specific workflow preservation",
      module: row.module,
      current_object_or_path: row.schema_table,
      current_authority: row.system_of_record,
      current_writers: "Live writer inspection required; static audit records focused consumers only",
      current_readers: row.current_consumers,
      target_operational_owner: row.future_classification === "retain_operational" ? row.module : `${row.module} until publication`,
      canonical_promotion_target: row.future_classification === "promote_link_canonical_knowledge" ? row.canonical_equivalent : "",
      target_consumption_projection:
        row.future_classification === "project_shared_consumption" ? inferProjectionName(row) : "",
      migration_method: migrationMethod(row),
      historical_backfill: backfillNeed(row),
      dual_run_requirement: dualRunNeed(row),
      reconciliation_rule: reconciliationRule(row),
      cutover_dependency: row.cutover_requirement,
      rollback_path: rollbackPath(row),
      read_only_observation_period: row.future_classification === "retain_operational" ? "Not applicable before consumer migration" : "30-60 days after new read primary",
      archive_requirement: row.future_classification === "retain_operational" ? "None now" : "Keep legacy rows immutable during observation",
      drop_authorization: "Explicit later approval required; not authorized by this package",
      status: "planning_only",
    });
  }
  return rows;
}

function inferProjectionName(row) {
  const name = row.schema_table.replace(/^public\./, "").replace(/^cio_tower\./, "").replace(/^intelligence_v7\./, "");
  if (row.canonical_equivalent.includes("metric")) return `consumption.metric_${name}`;
  if (row.canonical_equivalent.includes("evidence")) return `consumption.evidence_${name}`;
  if (row.canonical_equivalent.includes("program")) return `consumption.program_${name}`;
  if (row.canonical_equivalent.includes("relationship")) return `consumption.relationship_${name}`;
  if (row.canonical_equivalent.includes("context_pack")) return `consumption.context_${name}`;
  return `consumption.${name}`;
}

function migrationMethod(row) {
  if (row.future_classification === "retain_operational") return "Preserve current table; add publication outbox only when accepted enterprise facts are emitted";
  if (row.future_classification === "promote_link_canonical_knowledge") return "Map local IDs through governance.object_identity_map; publish reviewed facts through canonical adapter";
  if (row.future_classification === "project_shared_consumption") return "Build/refresh projection from active publications; dual-read compare before switching consumers";
  return "Archive only";
}

function backfillNeed(row) {
  if (row.future_classification === "promote_link_canonical_knowledge") return "Backfill approved/current rows only after stale/superseded filtering";
  if (row.future_classification === "project_shared_consumption") return "Backfill published observations needed for baseline reports and exports";
  return "No backfill until workflow emits accepted publication";
}

function dualRunNeed(row) {
  if (row.future_classification === "retain_operational") return "No dual-run until a consumer moves off local reads";
  if (row.future_classification === "project_shared_consumption") return "Required: old module read versus new projection read";
  return "Required for promoted object family until identity and fact parity pass";
}

function reconciliationRule(row) {
  if (row.future_classification === "project_shared_consumption") return "Counts, tenant scope, lineage, period, unit, and headline metric parity";
  if (row.future_classification === "promote_link_canonical_knowledge") return "One local object maps to one canonical object or an explicit reviewed many-to-one link";
  return "Operational behavior must remain unchanged";
}

function rollbackPath(row) {
  if (row.future_classification === "retain_operational") return "Keep current domain read/write path";
  return "Revert consumer flag to domain read path; preserve published rows as superseded audit evidence";
}

function promotionRows(inventory) {
  return inventory
    .filter((row) => row.future_classification === "promote_link_canonical_knowledge")
    .map((row) => ({
      module: row.module,
      schema_table: row.schema_table,
      canonical_target: row.canonical_equivalent,
      current_authority: row.system_of_record,
      identity_map_required: "governance.object_identity_map",
      publication_trigger: "accepted/reviewed/published row state plus tenant and lineage validation",
      required_evidence: row.evidence_lineage,
      historical_backfill: backfillNeed(row),
      dual_run_requirement: dualRunNeed(row),
      reconciliation_rule: reconciliationRule(row),
      cutover_dependency: "Healthcare publication/consumption framework certified first",
      rollback_path: rollbackPath(row),
      status: "candidate_not_authorized",
    }));
}

function projectionRows(inventory) {
  return inventory
    .filter((row) => row.future_classification === "project_shared_consumption")
    .map((row) => ({
      module: row.module,
      source_object: row.schema_table,
      projection_family: inferProjectionName(row),
      intended_consumers: "Nexus; aVa; Cube; Superset; Observable; module dashboards; exports",
      refresh_trigger: "Domain publication/outbox or controlled materialization run after source reconciliation",
      current_authority: row.system_of_record,
      lineage_requirement: row.evidence_lineage,
      parity_test: "Compare current screen/API/export answer to new projection output under same tenant and period",
      rollback_path: rollbackPath(row),
      status: "candidate_not_authorized",
    }));
}

function legacySunsetRows() {
  return [
    {
      module: "Moves",
      legacy_path: "Golden-bar deliverables path -> deliverables_v2 -> deliverable_versions",
      current_writers: "Moves golden-bar generation/persistence path",
      current_readers: "Moves phase screens, export/review consumers to be verified live",
      why_it_exists: "Historical path for phase deliverable versions and structured output",
      convergence_problem: "Runs beside the orchestrator/generated-artifact path and can create two output truths for the same phase",
      target_state: "One authoritative deliverable lifecycle and typed artifact contract",
      sunset_sequence: "ACTIVE -> DUAL_RUN -> NEW_READ_PRIMARY -> LEGACY_READ_ONLY -> ARCHIVED -> DROPPED",
      required_business_event_telemetry: "moves.deliverable_signed_off; moves.gate_approved; moves.program_published",
      read_only_observation_period: "60 days after new read primary",
      archive_requirement: "Archive historical versions with phase, tenant, move, artifact type, hash, signer, and source lineage",
      drop_authorization: "Explicit later approval after export and gate parity",
      status: "path_level_candidate",
    },
    {
      module: "Moves",
      legacy_path: "Orchestrator deliverable path -> deliverable_runs -> generated_artifacts",
      current_writers: "Moves orchestration/generation path",
      current_readers: "Moves orchestration, review, and artifact display consumers to be verified live",
      why_it_exists: "Supports generated artifacts from automated phase execution",
      convergence_problem: "May write different structured_data shapes than golden-bar path",
      target_state: "Both generation engines emit one typed artifact contract into one lifecycle",
      sunset_sequence: "ACTIVE -> DUAL_RUN -> NEW_READ_PRIMARY -> LEGACY_READ_ONLY -> ARCHIVED -> DROPPED",
      required_business_event_telemetry: "moves.deliverable_signed_off; moves.gate_approved; moves.program_published",
      read_only_observation_period: "60 days after typed contract parity",
      archive_requirement: "Retain run evidence and model/prompt lineage as audit history",
      drop_authorization: "Explicit later approval after historical artifact backfill",
      status: "path_level_candidate",
    },
    {
      module: "Source",
      legacy_path: "Direct writeback into enterprise_context_records / enterprise_context_facts / governed_object_readiness",
      current_writers: "Source context promotion/writeback paths to be confirmed in live read/write audit",
      current_readers: "Context retrieval, aVa, Home/Knowledge, Source evidence views to be verified live",
      why_it_exists: "Publishes Source-derived facts into enterprise context for reuse",
      convergence_problem: "Writeback path is not yet proven to run through a common governance/publication adapter",
      target_state: "Governed promotion adapter with identity map, review state, tenant fence, and evidence lineage",
      sunset_sequence: "ACTIVE -> DUAL_RUN -> GOVERNED_WRITE_PRIMARY -> LEGACY_WRITE_BLOCKED -> ARCHIVED -> DROPPED",
      required_business_event_telemetry: "source.artifact_accepted; source.stage_advanced; source.decision_published",
      read_only_observation_period: "60 days after governed write primary",
      archive_requirement: "Retain previous promoted rows as superseded evidence with source path and write timestamp",
      drop_authorization: "Explicit later approval after retrieval parity",
      status: "path_level_candidate",
    },
    {
      module: "Tower",
      legacy_path: "Overlapping source input trees and derived folders consumed as source",
      current_writers: "Tower materialization/input generators to be verified live",
      current_readers: "Tower marts, Tower aVa, exports, and dashboards",
      why_it_exists: "Fast Tower demonstrations and deterministic marts were built from mixed inputs",
      convergence_problem: "Two input trees can disagree and derived outputs can be re-consumed as source",
      target_state: "Registered source inputs only; derived outputs marked as projections, never source",
      sunset_sequence: "ACTIVE -> DUAL_RUN -> REGISTERED_SOURCE_PRIMARY -> LEGACY_READ_ONLY -> ARCHIVED -> DROPPED",
      required_business_event_telemetry: "tower.metric_attested; tower.lineage_blocked; tower.decision_recorded",
      read_only_observation_period: "90 days after registered-source mart parity",
      archive_requirement: "Archive old input snapshots and lineage reports with digest and materialization run id",
      drop_authorization: "Explicit later approval after headline metric reconciliation",
      status: "path_level_candidate",
    },
    {
      module: "Tower",
      legacy_path: "Precedence-based merge and advisory lineage report",
      current_writers: "Tower mart builders and lineage report scripts to be verified live",
      current_readers: "Tower command center, answer packets, exports, and proof reports",
      why_it_exists: "Allows a complete mart when source inputs conflict or lineage is incomplete",
      convergence_problem: "Lineage warnings are advisory rather than blocking for material claims",
      target_state: "Blocking lineage validation before metric publication and headline display",
      sunset_sequence: "ACTIVE -> BLOCKING_SHADOW -> BLOCKING_PRIMARY -> LEGACY_READ_ONLY -> ARCHIVED -> DROPPED",
      required_business_event_telemetry: "tower.lineage_blocked; tower.metric_attested",
      read_only_observation_period: "90 days after blocking validation primary",
      archive_requirement: "Keep advisory reports as historical quality evidence",
      drop_authorization: "Explicit later approval after all headline metrics reconcile",
      status: "path_level_candidate",
    },
    {
      module: "Cross-module",
      legacy_path: "Duplicated local IDs and module-specific object identity",
      current_writers: "Moves, Source, Tower domain workflows",
      current_readers: "All module screens, aVa packets, exports, and reports",
      why_it_exists: "Each product evolved its own workflow model and local identifiers",
      convergence_problem: "Same enterprise object can appear as separate vendor, program, contract, metric, risk, or evidence object",
      target_state: "Canonical identity map preserving local IDs while linking reviewed enterprise objects",
      sunset_sequence: "ACTIVE -> IDENTITY_SHADOW -> CANONICAL_READ_PRIMARY -> LEGACY_READ_ONLY -> ARCHIVED -> DROPPED",
      required_business_event_telemetry: "module.object_published; module.identity_link_reviewed",
      read_only_observation_period: "90 days after canonical read primary",
      archive_requirement: "Retain old local IDs and crosswalk history permanently",
      drop_authorization: "Explicit later approval; many local IDs may never be dropped",
      status: "path_level_candidate",
    },
    {
      module: "Cross-module",
      legacy_path: "Duplicated reporting and metric logic in routes/components",
      current_writers: "Module-specific API routes, components, and report scripts",
      current_readers: "Module screens, exports, BI surfaces, aVa answer packets",
      why_it_exists: "Local products needed fast calculations before shared metrics existed",
      convergence_problem: "Same number can be calculated differently by different surfaces",
      target_state: "Shared metric definitions plus consumption projections",
      sunset_sequence: "ACTIVE -> DUAL_RUN -> SHARED_METRIC_PRIMARY -> LEGACY_READ_ONLY -> ARCHIVED -> DROPPED",
      required_business_event_telemetry: "metric.definition_published; metric.observation_attested",
      read_only_observation_period: "60 days after shared metric primary",
      archive_requirement: "Keep old formula output as reconciliation evidence",
      drop_authorization: "Explicit later approval after formula parity",
      status: "path_level_candidate",
    },
    {
      module: "Cross-module",
      legacy_path: "Telemetry limited to generic page/click events",
      current_writers: "Current analytics/telemetry instrumentation",
      current_readers: "Operational monitoring and product analytics",
      why_it_exists: "Captures broad product usage",
      convergence_problem: "Cannot prove whether business-critical legacy paths are dormant",
      target_state: "Business-event telemetry before migration and sunset",
      sunset_sequence: "ACTIVE -> BUSINESS_EVENTS_ADDED -> DUAL_RUN_OBSERVED -> LEGACY_READ_ONLY -> ARCHIVED",
      required_business_event_telemetry: "source.*, moves.*, tower.* events listed in telemetry catalog",
      read_only_observation_period: "At least 60 days with business-event coverage",
      archive_requirement: "Retain event stream snapshots for migration evidence",
      drop_authorization: "No destructive drop without event-backed dormancy proof",
      status: "pre_migration_requirement",
    },
  ];
}

function telemetryRows() {
  return [
    ["source.artifact_accepted", "Source", "A Source artifact is accepted as usable evidence", "tenant_key; source_event_id; artifact_id; stage_key; actor_id; accepted_at", "Proves Source evidence moved from draft/upload into accepted use", "Publication trigger and legacy dormancy proof"],
    ["source.stage_advanced", "Source", "A Source event advances stage", "tenant_key; source_event_id; from_stage; to_stage; actor_id; advanced_at", "Proves workflow state and stage gates are active", "Dual-run stage parity"],
    ["source.decision_published", "Source", "A sourcing decision is published", "tenant_key; source_event_id; decision_id; selected_vendor_id; evidence_refs; published_at", "Proves accepted decisions are ready to link to canonical Knowledge", "Canonical promotion trigger"],
    ["moves.gate_approved", "Moves", "A phase/gate approval is completed", "tenant_key; move_id; phase; gate_id; approver_id; approved_at; evidence_refs", "Proves decision authority and phase control", "Moves deliverable truth convergence"],
    ["moves.deliverable_signed_off", "Moves", "A deliverable is signed off", "tenant_key; move_id; phase; artifact_id; version; signer_id; signed_at", "Proves which deliverable path is authoritative", "Deliverable path sunset evidence"],
    ["moves.program_published", "Moves", "A Move/program is published for cross-module use", "tenant_key; move_id; program_id; published_at; evidence_refs", "Proves approved program object can promote/link", "Canonical program publication"],
    ["tower.metric_attested", "Tower", "A metric observation is attested", "tenant_key; metric_key; period; value; unit; attester_id; evidence_refs", "Separates observed value from definition and narrative", "Metric observation publication"],
    ["tower.decision_recorded", "Tower", "A Tower decision/action is recorded", "tenant_key; decision_id; metric_refs; actor_id; recorded_at", "Proves Tower is recording business decisions, not just page visits", "Cross-module decision linking"],
    ["tower.lineage_blocked", "Tower", "A metric or answer is blocked by lineage validation", "tenant_key; metric_key; period; blocker_code; source_refs; blocked_at", "Turns advisory lineage into enforceable control", "Cutover stop condition proof"],
    ["module.object_published", "Cross-module", "Any module publishes an enterprise-significant object", "tenant_key; module; local_object_type; local_object_ref; canonical_object_type; event_time", "Common publication heartbeat for migration", "Identity-map and outbox monitoring"],
    ["module.identity_link_reviewed", "Cross-module", "A local-to-canonical identity link is reviewed", "tenant_key; module; local_object_ref; canonical_object_ref; reviewer_id; review_state", "Proves identity links are governed", "Canonical read cutover proof"],
    ["metric.definition_published", "Cross-module", "A shared metric definition is published", "tenant_key; metric_key; formula_version; owner; published_at", "Prevents duplicated metric logic", "Shared metric cutover"],
    ["metric.observation_attested", "Cross-module", "A metric observation is attested for consumption", "tenant_key; metric_key; period; value; unit; evidence_refs; attester_id", "Proves the value is safe for dashboards/aVa", "Shared consumption projection refresh"],
  ].map(([business_event, owning_module, when_emitted, required_keys, why_it_matters, migration_use]) => ({
    business_event,
    owning_module,
    when_emitted,
    required_keys,
    why_it_matters,
    migration_use,
    status: "required_before_dual_run",
  }));
}

function foundationRows() {
  return [
    {
      wave: "Wave 0 shared foundation",
      module: "Cross-module",
      current_object_or_path: "canonical identity map",
      current_authority: "not yet authorized by audit",
      current_writers: "none",
      current_readers: "future canonical publications and projections",
      target_operational_owner: "Governance",
      canonical_promotion_target: "governance.object_identity_map",
      target_consumption_projection: "",
      migration_method: "Design and approve before any module migration",
      historical_backfill: "none until identity policy is approved",
      dual_run_requirement: "Identity shadow mode before any read cutover",
      reconciliation_rule: "Every local object link has tenant, type, confidence, review state, and history",
      cutover_dependency: "Healthcare certified Knowledge Baseline",
      rollback_path: "Do not use canonical identity reads until approved",
      read_only_observation_period: "Not applicable",
      archive_requirement: "Identity map changes are append-only",
      drop_authorization: "Not applicable",
      status: "foundation_required",
    },
    {
      wave: "Wave 0 shared foundation",
      module: "Cross-module",
      current_object_or_path: "module promotion outbox",
      current_authority: "not yet authorized by audit",
      current_writers: "none",
      current_readers: "future publication adapters",
      target_operational_owner: "Governance",
      canonical_promotion_target: "governance.module_publication_outbox",
      target_consumption_projection: "",
      migration_method: "Implement after Healthcare publication lifecycle proves out",
      historical_backfill: "none before approved replay strategy",
      dual_run_requirement: "Required with old direct-write paths",
      reconciliation_rule: "Outbox event count equals accepted domain event count by tenant/module/object family",
      cutover_dependency: "Business-event telemetry active",
      rollback_path: "Stop outbox processing; retain domain workflow tables",
      read_only_observation_period: "30 days before write primary",
      archive_requirement: "Outbox events retained as audit stream",
      drop_authorization: "Not applicable",
      status: "foundation_required",
    },
    {
      wave: "Wave 0 shared foundation",
      module: "Cross-module",
      current_object_or_path: "shared metric definition contract",
      current_authority: "Tower/local module metric definitions",
      current_writers: "module-specific formula paths",
      current_readers: "Tower, Source, Moves, aVa, future BI",
      target_operational_owner: "Governance + metric owner",
      canonical_promotion_target: "knowledge.metric_definition",
      target_consumption_projection: "consumption.metric_observation_*",
      migration_method: "Separate definition from observation; publish formula versions before observations",
      historical_backfill: "Backfill current definitions first, then observations",
      dual_run_requirement: "Required for every headline number",
      reconciliation_rule: "Formula, period, unit, basis, source, and value parity",
      cutover_dependency: "Metric owner attestation and lineage validation",
      rollback_path: "Revert consumers to module-specific calculation while keeping shared definitions candidate",
      read_only_observation_period: "60 days",
      archive_requirement: "Preserve old formula outputs for reconciliation",
      drop_authorization: "Explicit later approval",
      status: "foundation_required",
    },
  ];
}

function writeMarkdownFiles(summary) {
  const common = `> Planning package derived from PR #5679's 131-object static audit. This package does not authorize migration, backfill, dual-write, cutover, archive, drop, Azure mutation, Postgres mutation, or product runtime changes.\n\n`;
  const files = {
    "MODULE_MIGRATION_SUNSET_BACKLOG_SUMMARY.md": `# Module Migration and Sunset Backlog Summary\n\n${common}## Current-State Baseline\n\nPR #5679 remains the factual baseline: ${summary.inventoryRows} persisted objects, with ${summary.byClassification.retain_operational} retained operational, ${summary.byClassification.promote_link_canonical_knowledge} promotion/link candidates, ${summary.byClassification.project_shared_consumption} shared-consumption projections, ${summary.byClassification.archive} archive items, and ${summary.byClassification.replace || 0} immediate replace items.\n\n## Key Interpretation\n\n\`replace = 0\` means no persisted object is safe to remove today. It does not mean there are no paths to sunset. The path-level backlog separately tracks duplicate deliverable truth, direct context writeback, legacy source/mart construction, duplicated reporting logic, identity duplication, and telemetry gaps.\n\n## Required Sequence\n\n1. Merge the factual audit baseline only after approval.\n2. Keep Healthcare execution separate until it certifies the Knowledge publication and consumption path.\n3. Add business-event telemetry before module dual-run.\n4. Build shared foundation: identity map, promotion outbox, publication lifecycle, projection registry, metric-definition contract, audit stream, reconciliation framework.\n5. Migrate by wave with shadow reads, parity proof, rollback, and explicit destructive-change approval.\n`,
    "CROSS_MODULE_IDENTITY_MAP_DESIGN.md": `# Cross-Module Identity Map Design\n\n${common}## Purpose\n\nPreserve module-local IDs while linking reviewed enterprise-significant objects to stable canonical references. The identity map is not a bulk copy of module workflow state.\n\n## Required Fields\n\n| Field | Requirement |\n| --- | --- |\n| tenant_key | Required tenant fence from session/runtime identity |\n| module | Moves, Source, Tower, or future module |\n| local_object_type | Domain object type such as vendor, contract, program, decision, risk, control, metric, outcome, evidence, application, sourcing_event |\n| local_object_ref | Module-local primary identifier |\n| canonical_object_type | Canonical Knowledge family |\n| canonical_object_ref | Stable canonical ID after review |\n| match_method | exact, deterministic, reviewed, manual, or rejected |\n| match_confidence | Confidence tier and score where available |\n| review_state | candidate, approved, rejected, superseded |\n| valid_from / valid_to | Temporal boundary |\n| evidence_refs | Source/evidence/provenance references supporting the link |\n| created_by / reviewed_by | Accountability |\n\n## Rules\n\n- Identity is declared and reviewed, not inferred from filenames or display labels.\n- Local IDs are retained for workflow rollback and audit history.\n- No consumer may use canonical reads until the link is approved and parity-tested.\n`,
    "MODULE_PUBLICATION_AND_OUTBOX_CONTRACT.md": `# Module Publication and Outbox Contract\n\n${common}## Contract\n\nModules own workflow state. A module publishes only accepted, reviewed, or attested enterprise-significant events to a governed outbox. Canonical Knowledge and shared projections consume from the outbox after validation.\n\n## Outbox Fields\n\n| Field | Requirement |\n| --- | --- |\n| event_id | Immutable event identifier |\n| tenant_key | Required tenant fence |\n| module | Emitting module |\n| business_event | Source, Moves, Tower, or cross-module event name |\n| local_object_type / local_object_ref | Domain-local object reference |\n| canonical_object_type | Intended target family |\n| payload | Typed publication payload |\n| evidence_refs | Source/evidence/provenance links |\n| review_state | candidate, approved, rejected, superseded |\n| idempotency_key | Required for replay safety |\n| emitted_at / processed_at | Audit timestamps |\n\n## Stop Conditions\n\n- Missing tenant key.\n- Missing evidence lineage for a material fact.\n- Unreviewed fact attempting canonical promotion.\n- Cross-tenant object reference.\n- Conflicting metric definition or unit.\n`,
    "MODULE_DUAL_RUN_RECONCILIATION_PLAN.md": `# Module Dual-Run Reconciliation Plan\n\n${common}## Dual-Run Rule\n\nEvery consumer cutover must compare old module reads with new canonical/projection reads under the same tenant, time period, filters, and user path.\n\n## Required Reconciliation Dimensions\n\n- Row count and object count.\n- Tenant fence.\n- Local ID to canonical ID map.\n- Source lineage and evidence refs.\n- Metric period, unit, formula version, and basis.\n- Headline values and material thresholds.\n- aVa answer packet fields.\n- Export and dashboard visual parity.\n\n## Go / No-Go\n\nNo consumer switches to new reads until parity is accepted, rollback is tested, and business-event telemetry proves the old path can be observed during the read-only window.\n`,
    "MODULE_CUTOVER_AND_ROLLBACK_PLAN.md": `# Module Cutover and Rollback Plan\n\n${common}## Cutover Sequence\n\n\`ACTIVE -> DUAL_RUN -> NEW_READ_PRIMARY -> LEGACY_READ_ONLY -> ARCHIVED -> DROPPED\`\n\n## Rollback\n\n- Revert consumer flags to the domain read path.\n- Mark published projection rows superseded rather than deleting them.\n- Stop outbox processing if publication quality fails.\n- Preserve identity links and audit history unless a reversal record is approved.\n\n## Cutover Evidence\n\n- Signed-in screen/API/export proof.\n- aVa answer regression.\n- Metric parity report.\n- Tenant isolation proof.\n- Business-event telemetry coverage.\n- Rollback command and owner.\n`,
    "LEGACY_READ_ONLY_AND_ARCHIVE_PLAN.md": `# Legacy Read-Only and Archive Plan\n\n${common}## Read-Only Entry Criteria\n\nA legacy path can become read-only only after new reads are primary, parity has passed, rollback is tested, and business-event telemetry confirms writes have moved.\n\n## Archive Requirements\n\n- Immutable snapshot or export with digest.\n- Source migration wave and approval reference.\n- Retention owner.\n- Restore procedure.\n- Reader list and dormant-path telemetry.\n\n## Do Not Archive When\n\n- A writer is still active.\n- A consumer lacks parity proof.\n- Tenant isolation has not been proven.\n- Any material metric or artifact export diverges.\n`,
    "LEGACY_DESTRUCTIVE_CHANGE_ACCEPTANCE.md": `# Legacy Destructive Change Acceptance\n\n${common}## Non-Negotiable Rule\n\nNo destructive drop is authorized by the audit or backlog package.\n\n## Future Drop Acceptance Checklist\n\n- Legacy path has completed ACTIVE, DUAL_RUN, NEW_READ_PRIMARY, LEGACY_READ_ONLY, and ARCHIVED states.\n- Observation window has elapsed with no writes and no rollback usage.\n- Archive restore drill passed.\n- Signed-in product proof passed for all affected surfaces.\n- aVa and export regressions passed.\n- Tenant isolation proof passed.\n- Data owner and product owner explicitly approve.\n- Release record names rollback limits and irreversible effects.\n`,
  };
  return Promise.all(Object.entries(files).map(([file, text]) => fs.writeFile(path.join(OUT_DIR, file), text)));
}

async function main() {
  await fs.mkdir(OUT_DIR, { recursive: true });
  const inventory = parseObjects(await fs.readFile(path.join(AUDIT_DIR, "CURRENT_MODULE_DATA_INVENTORY.csv"), "utf8"));
  const summary = JSON.parse(await fs.readFile(path.join(AUDIT_DIR, "summary.json"), "utf8"));

  const migrationRows = [...foundationRows(), ...objectBacklogRows(inventory)];
  await writeCsv("MODULE_DATA_LAYER_MIGRATION_BACKLOG.csv", csvHeaders.migrationBacklog, migrationRows);
  await writeCsv("LEGACY_PATH_AND_CONSUMER_SUNSET_REGISTER.csv", csvHeaders.legacySunset, legacySunsetRows());
  await writeCsv("CANONICAL_PROMOTION_IMPLEMENTATION_MATRIX.csv", csvHeaders.promotionMatrix, promotionRows(inventory));
  await writeCsv("SHARED_CONSUMPTION_PROJECTION_CATALOG.csv", csvHeaders.projectionCatalog, projectionRows(inventory));
  await writeCsv("BUSINESS_EVENT_TELEMETRY_CATALOG.csv", csvHeaders.telemetryCatalog, telemetryRows());
  await writeMarkdownFiles(summary);

  await fs.writeFile(
    path.join(OUT_DIR, "summary.json"),
    JSON.stringify(
      {
        packageDate: "2026-07-27",
        sourceAudit: "reports/module-data-integration-audit/2026-07-27",
        sourcePr: 5679,
        scope: "planning backlog only; no migration authorization",
        migrationBacklogRows: migrationRows.length,
        legacySunsetRows: legacySunsetRows().length,
        promotionRows: promotionRows(inventory).length,
        projectionRows: projectionRows(inventory).length,
        telemetryRows: telemetryRows().length,
      },
      null,
      2,
    ),
  );

  const artifactTool = await loadArtifactTool();
  for (const [csvFile, xlsxFile, sheetName] of workbookMap) {
    await writeWorkbook(artifactTool, csvFile, xlsxFile, sheetName);
    console.log(`Wrote ${path.relative(REPO, path.join(OUT_DIR, xlsxFile))}`);
  }
  console.log(`Wrote module migration/sunset backlog to ${path.relative(REPO, OUT_DIR)}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
