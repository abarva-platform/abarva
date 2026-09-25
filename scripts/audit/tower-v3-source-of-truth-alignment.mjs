#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const repoRoot = process.cwd();
const outDir = path.join(repoRoot, "reports/tower-v3-alignment");
const generatedAt = process.env.TOWER_V3_ALIGNMENT_AUDIT_AT ?? new Date().toISOString();

const requiredV3Dimensions = [
  { id: "08", file: "08_spend_value.csv", label: "IT Budget, Spend & Value", towerNeed: "budget, spend, promised value, savings opportunity, calculation basis" },
  { id: "09", file: "09_programs_initiatives.csv", label: "Programs & Initiatives", towerNeed: "initiative, sponsor, owner, budget, expected value, dependencies, risks" },
  { id: "11", file: "11_risks_controls.csv", label: "Risks & Controls", towerNeed: "risk/control context for value claims and readiness gates" },
  { id: "14", file: "14_metrics_outcomes.csv", label: "Metrics & Outcomes", towerNeed: "baseline, target, current metric value, frequency, source, owner" },
  { id: "17", file: "17_service_scope_managed_services.csv", label: "Managed Services Scope", towerNeed: "scope, SLA, service boundaries, buyer/provider responsibilities" },
  { id: "18", file: "18_operational_process_evidence.csv", label: "Operational Process Evidence", towerNeed: "process actuals, operational proof, service evidence" },
];

const proposedAdapters = [
  { id: "SA07", name: "Value Realization Actuals", purpose: "Measured and realized value snapshots with finance attestation." },
  { id: "SA08", name: "Benefits Tracking / KPI Actuals", purpose: "KPI actuals, operational outcomes, and benefits tracking exports." },
  { id: "SA09", name: "Project Financials / Forecast / Actuals", purpose: "Portfolio financial forecast, actuals, capex/opex, and budget variance." },
  { id: "SA10", name: "SLA / Service Performance Actuals", purpose: "SLA, XLA, incident, request, backlog, and service performance actuals." },
  { id: "SA11", name: "Contract Savings / Commercial Commitments", purpose: "Source awards, BAFO commitments, contract savings, credits, and obligations." },
];

const files = {
  tenantRegistry: "datasets/tenant-inputs/tenant-input-registry.json",
  v3Manifest: "datasets/tenant-inputs/templates/universal/standard-2026-07-v3/template-manifest.json",
  v3WorkbookManifest: "datasets/tenant-inputs/templates/universal/standard-2026-07-v3/manifest.json",
  canonicalInputsDoc: "docs/architecture/canonical-tenant-inputs.md",
  sourceAdapterDoc: "docs/architecture/source-adapter-framework.md",
  towerContextContract: "src/lib/enterprise-knowledge/contracts/context-pack.ts",
  towerContextAssembler: "src/lib/enterprise-knowledge/assembler/context-pack-assembler.ts",
  cioSchema: "supabase/migrations/20260628202000_cio_tower_schema_v1.sql",
  towerLoader: "scripts/tower/load-cio-tower-standardized-v1.mjs",
  towerPage: "src/app/(maestro)/tower/page.tsx",
  cxoView: "src/lib/cio-tower/cxo-view-model.ts",
  cioAnswer: "src/lib/cio-tower/answer.ts",
  valueStates: "src/lib/tower/value-states/types.ts",
  priorDerivationSummary: "reports/tower-audit/cio-fact-derivation/summary.json",
};

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function read(file) {
  const abs = path.join(repoRoot, file);
  return fs.existsSync(abs) ? fs.readFileSync(abs, "utf8") : "";
}

function readJson(file, fallback = {}) {
  try {
    const text = read(file);
    return text ? JSON.parse(text) : fallback;
  } catch {
    return fallback;
  }
}

function exists(file) {
  return fs.existsSync(path.join(repoRoot, file));
}

function sha(value) {
  return crypto.createHash("sha256").update(String(value)).digest("hex").slice(0, 16);
}

function csvEscape(value) {
  const text = value === undefined || value === null ? "" : String(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function writeCsv(fileName, rows) {
  if (!rows.length) throw new Error(`No rows for ${fileName}`);
  const headers = Object.keys(rows[0]);
  const csv = [
    headers.join(","),
    ...rows.map((row) => headers.map((header) => csvEscape(row[header])).join(",")),
  ].join("\n");
  fs.writeFileSync(path.join(outDir, fileName), `${csv}\n`);
}

function writeJson(fileName, data) {
  fs.writeFileSync(path.join(outDir, fileName), `${JSON.stringify(data, null, 2)}\n`);
}

function writeText(fileName, text) {
  fs.writeFileSync(path.join(outDir, fileName), text.endsWith("\n") ? text : `${text}\n`);
}

function htmlEscape(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function walk(dir) {
  const abs = path.join(repoRoot, dir);
  if (!fs.existsSync(abs)) return [];
  return fs.readdirSync(abs, { withFileTypes: true }).flatMap((entry) => {
    const child = path.join(dir, entry.name);
    if (entry.isDirectory()) return walk(child);
    return [child.split(path.sep).join("/")];
  });
}

function findLine(file, needle) {
  const text = read(file);
  if (!text) return "missing";
  const lines = text.split(/\r?\n/);
  const index = lines.findIndex((line) => needle instanceof RegExp ? needle.test(line) : line.includes(needle));
  return index >= 0 ? `${file}:${index + 1}` : `${file}:not-found`;
}

const registry = readJson(files.tenantRegistry);
const templateManifest = readJson(files.v3Manifest, { templates: [] });
const workbookManifest = readJson(files.v3WorkbookManifest, { files: [] });
const priorDerivation = readJson(files.priorDerivationSummary, {});
const v3TemplateFiles = new Set((templateManifest.templates ?? []).map((template) => template.file));
const v3WorkbookFiles = new Set(workbookManifest.files ?? []);
const activeTenantFiles = walk("datasets/tenant-inputs/active").filter((file) => file.endsWith(".csv"));
const towerStandardizedFiles = walk("tower-standardized-v1").filter((file) => /\.(csv|yaml|jsonl)$/.test(file));

const source = Object.fromEntries(Object.entries(files).map(([key, file]) => [key, read(file)]));

const signals = {
  registrySaysV3Only: registry?.policy?.universalTemplateStandardV3IsOnlyApprovedStandard === true,
  registryDisallowsLegacyTruth: registry?.policy?.legacyDatasetRootsMayNotBecomeActiveTruth === true,
  v3TemplatePackExists: exists(files.v3Manifest),
  allRequiredDimensionsExist: requiredV3Dimensions.every((dimension) => v3TemplateFiles.has(dimension.file)),
  existingSourceAdapters: [...v3WorkbookFiles].filter((file) => /^SA\d+_/.test(file)).sort(),
  proposedAdaptersExist: proposedAdapters.every((adapter) => [...v3WorkbookFiles].some((file) => file.startsWith(`${adapter.id}_`))),
  towerStandardizedPackageExists: fs.existsSync(path.join(repoRoot, "tower-standardized-v1")),
  towerLoaderReadsSeparatePackage: source.towerLoader.includes("tower-standardized-v1"),
  towerLoaderWritesCioTower: source.towerLoader.includes("cio_tower.facts") && source.towerLoader.includes("cio_tower.measure_results"),
  towerPageUsesCioTower: source.towerPage.includes("loadCioTowerCxoView"),
  cxoViewReadsCioTower: source.cxoView.includes("from cio_tower.measure_results") && source.cxoView.includes("from cio_tower.facts"),
  cioAnswerReadsCioTower: source.cioAnswer.includes("from cio_tower.facts") && source.cioAnswer.includes("from cio_tower.relationships"),
  promptTraceExists: source.cioAnswer.includes("cio_tower.prompt_packages") && source.cioAnswer.includes("cio_tower.answer_traces"),
  towerContextPackExists: source.towerContextContract.includes("export interface TowerContextPack"),
  towerContextPackHasValueRecords: source.towerContextContract.includes("TowerValueRecord") || source.towerContextContract.includes("TowerMetricRecord") || source.towerContextContract.includes("TowerValueClaim"),
  cioSchemaHasRequiredLineageFields: [
    "source_standard",
    "source_dimension",
    "source_adapter",
    "source_row_id",
    "evidence_registry_id",
    "canonical_fact_id",
    "entity_profile_id",
    "relationship_edge_id",
    "context_gap_id",
    "tower_context_pack_id",
    "active_candidate_status",
    "safe_to_display",
    "value_claim_status",
  ].every((field) => source.cioSchema.includes(field)),
  valueStatesMentionRealized: source.valueStates.includes("realized_value_usd"),
};

const hardFailures = [
  {
    rule: "Tower-visible rows lack v3/context-layer lineage",
    failed: !signals.cioSchemaHasRequiredLineageFields,
    evidence: "cio_tower schema does not contain the required lineage fields for every Tower-visible row.",
  },
  {
    rule: "cio_tower rows are treated as source of truth without reconciliation",
    failed: signals.towerPageUsesCioTower && signals.cxoViewReadsCioTower && !signals.cioSchemaHasRequiredLineageFields,
    evidence: "Tower UI consumes cio_tower directly through loadCioTowerCxoView while required v3 reconciliation fields are absent.",
  },
  {
    rule: "tower-standardized-v1 remains an independent active source",
    failed: signals.towerStandardizedPackageExists && signals.towerLoaderReadsSeparatePackage,
    evidence: "tower-standardized-v1 exists and scripts/tower/load-cio-tower-standardized-v1.mjs reads it.",
  },
  {
    rule: "realized value appears without TowerValueClaim support",
    failed: signals.valueStatesMentionRealized && !signals.towerContextPackHasValueRecords,
    evidence: "Tower has realized_value_usd value-state code, but TowerContextPack does not define TowerValueClaim/TowerValueRecord support.",
  },
  {
    rule: "old V6/V7 bridge rows are visible as product truth",
    failed: priorDerivation?.current_state?.v7_projection_bridge_exists === true,
    evidence: "Prior derivation audit found the V7 projection bridge exists; current audit does not prove it is hidden from product truth.",
  },
  {
    rule: "Tower data bypasses Evidence Registry / Canonical Facts / Entity Profiles / Relationship Graph",
    failed: !signals.cioSchemaHasRequiredLineageFields,
    evidence: "Missing evidence_registry_id, canonical_fact_id, entity_profile_id, and relationship_edge_id on cio_tower serving rows.",
  },
];

const alignmentStatus = hardFailures.some((failure) => failure.failed) ? "Fail" : "Pass";

const classificationRows = [
  {
    object_or_path: "standard-2026-07-v3 tenant input standard",
    classification: "approved source of truth",
    current_status: signals.registrySaysV3Only ? "present and policy-backed" : "not proven",
    allowed_future_role: "authoritative tenant source input",
    source_of_truth_allowed: "yes",
    derived_projection_allowed: "not applicable",
    required_action: "Keep as the only approved Tower source input standard.",
    evidence: files.tenantRegistry,
  },
  {
    object_or_path: "datasets/tenant-inputs/active/<tenant>/current",
    classification: "approved active tenant input root",
    current_status: `${activeTenantFiles.length} active CSV files found`,
    allowed_future_role: "active source packet consumed by candidate/build pipeline",
    source_of_truth_allowed: "yes",
    derived_projection_allowed: "not applicable",
    required_action: "Use active/candidate state from the tenant input registry and data runway.",
    evidence: "datasets/tenant-inputs/tenant-input-registry.json",
  },
  {
    object_or_path: "tower-standardized-v1",
    classification: "legacy bridge / separate Tower source package",
    current_status: `${towerStandardizedFiles.length} files found; loader reads package`,
    allowed_future_role: "temporary migration bridge only",
    source_of_truth_allowed: "no",
    derived_projection_allowed: "no unless generated from v3 context layer",
    required_action: "Stop treating as independent active source; replace with v3-derived TowerContextPack/projection.",
    evidence: "scripts/tower/load-cio-tower-standardized-v1.mjs",
  },
  {
    object_or_path: "cio_tower.*",
    classification: "derived/read-optimized projection target",
    current_status: signals.cioSchemaHasRequiredLineageFields ? "lineage-ready" : "missing required lineage fields",
    allowed_future_role: "derived projection only",
    source_of_truth_allowed: "no",
    derived_projection_allowed: "yes, if every row reconciles to v3/evidence/canonical/graph IDs",
    required_action: "Add required lineage fields and block authoritative claims when reconciliation is missing.",
    evidence: files.cioSchema,
  },
  {
    object_or_path: "TowerContextPack",
    classification: "future module context boundary",
    current_status: signals.towerContextPackExists ? "interface exists, value records incomplete" : "not found",
    allowed_future_role: "formal Tower module input",
    source_of_truth_allowed: "no, assembled from context layer",
    derived_projection_allowed: "yes",
    required_action: "Extend with TowerMetricRecord, TowerValueRecord, TowerValueClaim, and proof boundary.",
    evidence: files.towerContextContract,
  },
];

const towerToV3Rows = requiredV3Dimensions.map((dimension) => ({
  tower_need: dimension.towerNeed,
  v3_dimension: dimension.label,
  v3_file: dimension.file,
  present_in_v3_template: v3TemplateFiles.has(dimension.file) ? "yes" : "no",
  present_in_active_tenants: activeTenantFiles.some((file) => file.endsWith(`/${dimension.file}`)) ? "yes" : "no",
  tower_current_source: "cio_tower/tower-standardized-v1 bridge",
  desired_source_path: `${dimension.file} -> Evidence Registry -> Canonical Facts -> TowerContextPack`,
  reconciliation_status: "not wired/proven",
  required_next_action: "Map this dimension into TowerMetricRecord/TowerValueRecord through context assembler.",
}));

const unreconciledRows = [
  {
    tower_visible_row_class: "cio_tower.facts",
    current_key: "fact_key",
    missing_v3_lineage: "source_standard;source_dimension;source_row_id;evidence_registry_id;canonical_fact_id;active_candidate_status;safe_to_display;value_claim_status",
    current_consumer: "Tower CXO view and Tower aVa prompt packet",
    safe_current_status: "read-model only with caveat",
    blocked_claim: "authoritative v3-native fact",
  },
  {
    tower_visible_row_class: "cio_tower.measure_results",
    current_key: "result_key/source_fact_keys",
    missing_v3_lineage: "tower_context_pack_id;canonical_fact_ids;calculation_method;value_claim_status;active_candidate_status",
    current_consumer: "dashboard metric packet and chat parity",
    safe_current_status: "materialized metric read model with formula caveat",
    blocked_claim: "source-of-truth financial result",
  },
  {
    tower_visible_row_class: "cio_tower.entities",
    current_key: "entity_key",
    missing_v3_lineage: "entity_profile_id;source_dimension;active_candidate_status",
    current_consumer: "CXO view, charts, relationships",
    safe_current_status: "Tower entity label",
    blocked_claim: "canonical enterprise entity profile",
  },
  {
    tower_visible_row_class: "cio_tower.relationships",
    current_key: "relationship_key",
    missing_v3_lineage: "relationship_edge_id;relationship type dictionary proof;evidence_registry_id",
    current_consumer: "Tower aVa context and dependency explanations",
    safe_current_status: "Tower local relationship context",
    blocked_claim: "canonical enterprise graph edge",
  },
  {
    tower_visible_row_class: "tower-standardized-v1 source rows",
    current_key: "source_key/source_row",
    missing_v3_lineage: "tenant input packet ID;v3 source dimension;canonical ingestion record ID",
    current_consumer: "Tower loader",
    safe_current_status: "migration bridge only",
    blocked_claim: "active enterprise source input",
  },
  {
    tower_visible_row_class: "realized value display",
    current_key: "realized_value_usd",
    missing_v3_lineage: "TowerValueClaim.supported_by_evidence;supporting_evidence_refs;claim_status;caveat_text",
    current_consumer: "Tower value-state calculations",
    safe_current_status: "only safe when measured evidence and value claim support exist",
    blocked_claim: "realized ROI/value without evidence-backed claim object",
  },
];

const summary = {
  audit_id: "TOWER-V3-SOURCE-OF-TRUTH-ALIGNMENT-PR",
  generated_at: generatedAt,
  status: alignmentStatus,
  selected_path: "Path A - Derived Tower Projection",
  selected_path_rationale: "Current Tower depends heavily on cio_tower, so the practical migration path is to keep cio_tower as a read-optimized projection while requiring every visible row to reconcile back to v3 governed context. Path B remains a later simplification option.",
  hard_rule: "There is only one enterprise context source standard. Tower may have a derived read model, but it cannot have a separate truth model.",
  current_findings: {
    registry_says_v3_only: signals.registrySaysV3Only,
    v3_required_dimensions_present: signals.allRequiredDimensionsExist,
    existing_source_adapters: signals.existingSourceAdapters,
    proposed_tower_adapters_present: signals.proposedAdaptersExist,
    tower_standardized_files: towerStandardizedFiles.length,
    active_tenant_input_files: activeTenantFiles.length,
    cio_schema_has_required_lineage_fields: signals.cioSchemaHasRequiredLineageFields,
    tower_context_pack_has_value_records: signals.towerContextPackHasValueRecords,
  },
  hard_failures: hardFailures.filter((failure) => failure.failed),
  output_files: [
    "summary.md",
    "summary.json",
    "cio-tower-source-of-truth-classification.csv",
    "tower-to-v3-lineage.csv",
    "unreconciled-tower-rows.csv",
    "required-v3-tower-extensions.md",
    "tower-context-pack-design.md",
    "tower-v3-alignment-proof.html",
  ],
  source_hash: sha([
    source.tenantRegistry,
    source.v3Manifest,
    source.cioSchema,
    source.towerLoader,
    source.cxoView,
    source.cioAnswer,
    source.towerContextContract,
  ].join("\n")),
};

function writeRequiredExtensions() {
  const rows = requiredV3Dimensions.map((dimension) => `| ${dimension.id} | ${dimension.label} | ${dimension.file} | ${dimension.towerNeed} | Present | Use as core Tower source dimension |`).join("\n");
  const adapters = proposedAdapters.map((adapter) => `| ${adapter.id} | ${adapter.name} | Missing | ${adapter.purpose} | Add under \`datasets/tenant-inputs/templates/universal/standard-2026-07-v3/source-adapters/\` or the existing v3 template pack. |`).join("\n");
  writeText("required-v3-tower-extensions.md", `# Required v3 Tower Extensions

Generated: ${generatedAt}

## Existing v3 dimensions that should feed Tower

| ID | Dimension | File | Tower need | Status | Required use |
| --- | --- | --- | --- | --- | --- |
${rows}

## Source adapters to add next

| Adapter | Name | Status | Purpose | Required action |
| --- | --- | --- | --- | --- |
${adapters}

## Design rule

Do not add separate Tower source files. If Tower needs more actuals, forecasts, SLA outcomes, contract savings, or benefits tracking, add them as v3 source adapters and process them through Evidence Registry, Canonical Facts, Entity Profiles, Relationship Graph, Context Gaps/Confidence, and then TowerContextPack.
`);
}

function writeContextPackDesign() {
  writeText("tower-context-pack-design.md", `# TowerContextPack Source-of-Truth Design

Generated: ${generatedAt}

## Selected Path

**Path A - Derived Tower Projection** is selected for the near-term migration.

Reason: Tower already depends heavily on \`cio_tower\` for dashboard/chat parity. Retiring it immediately would create avoidable product risk. The right migration is to make \`cio_tower\` a derived projection only.

## Target Flow

\`\`\`text
standard-2026-07-v3 source templates / source adapters
-> Evidence Registry
-> Canonical Facts
-> Entity Profiles
-> Relationship Graph
-> Context Gaps / Confidence
-> TowerContextPack
-> derived cio_tower projection
-> TowerMetricRecord / TowerValueRecord / TowerValueClaim
-> Tower UI / Tower aVa
\`\`\`

## Required Projection Lineage

Every Tower-visible derived row must carry:

- tenant_key
- source_standard
- source_dimension
- source_adapter, if applicable
- source_row_id
- evidence_registry_id
- canonical_fact_id
- entity_profile_id
- relationship_edge_id
- context_gap_id, if applicable
- tower_context_pack_id
- active_candidate_status
- confidence
- as_of_date
- calculation_method, for metrics/value
- safe_to_display
- value_claim_status

## TowerMetricRecord

\`\`\`ts
type TowerMetricRecord = {
  metric_id: string;
  metric_name: string;
  metric_family: string;
  business_owner: string;
  data_owner: string;
  source_system: string;
  source_dimension: string;
  evidence_registry_id: string;
  baseline_status: "missing" | "directional" | "measured" | "attested";
  baseline_value: number | string | null;
  target_value: number | string | null;
  current_value: number | string | null;
  measurement_frequency: string;
  calculation_method: string;
  confidence: number;
  gap_status: "none" | "needs_evidence" | "needs_owner" | "needs_method" | "blocked";
  active_candidate_status: "active" | "candidate";
};
\`\`\`

## TowerValueRecord

\`\`\`ts
type TowerValueRecord = {
  value_record_id: string;
  initiative_id: string;
  business_function: string;
  owner: string;
  metric_id: string;
  baseline_value: number | null;
  baseline_evidence_id: string | null;
  target_value: number | null;
  promised_value: number | null;
  forecast_value: number | null;
  measured_value: number | null;
  realized_value: number | null;
  calculation_method: string;
  evidence_refs: string[];
  risk_ids: string[];
  control_ids: string[];
  source_handoff_id: string | null;
  moves_handoff_id: string | null;
  status: "hypothesis" | "planned" | "tracked" | "measured" | "realized" | "blocked";
  caveats: string[];
  active_candidate_status: "active" | "candidate";
};
\`\`\`

## TowerValueClaim

\`\`\`ts
type TowerValueClaim = {
  claim_id: string;
  claim_text: string;
  claim_type: "hypothesis" | "target" | "forecast" | "measured" | "realized" | "roi";
  claim_status: "safe" | "caveated" | "blocked";
  supported_by_evidence: boolean;
  supporting_evidence_refs: string[];
  unsupported_reason: string | null;
  visible_to_user: boolean;
  caveat_text: string;
};
\`\`\`

## Runtime rule

Tower UI and Tower aVa may consume a derived projection only after the projection proves the source row, evidence, canonical fact, entity, relationship, context gap, confidence, active/candidate state, and value-claim status.
`);
}

function writeSummaryMarkdown() {
  const failures = hardFailures
    .map((failure) => `- ${failure.failed ? "Fail" : "Pass"}: ${failure.rule} — ${failure.evidence}`)
    .join("\n");
  writeText("summary.md", `# Tower v3 Source-of-Truth Alignment Audit

Generated: ${generatedAt}

## Verdict

**${alignmentStatus}: Tower is not yet aligned to the v3 enterprise context source of truth.**

The correct architecture is now explicit:

\`\`\`text
standard-2026-07-v3 source templates / source adapters
-> Evidence Registry
-> Canonical Facts
-> Entity Profiles
-> Relationship Graph
-> Context Gaps / Confidence
-> TowerContextPack
-> TowerMetricRecord / TowerValueRecord / TowerValueClaim
-> Tower UI / Tower aVa
\`\`\`

The current bridge is still:

\`\`\`text
tower-standardized-v1
-> cio_tower tables
-> Tower UI / Tower aVa
\`\`\`

That bridge may remain temporarily only as a derived/read-optimized projection. It must not be treated as Tower source of truth.

## Selected Path

${summary.selected_path}

${summary.selected_path_rationale}

## Hard-rule checks

${failures}

## v3 coverage

- Required Tower dimensions present in v3 template: ${signals.allRequiredDimensionsExist ? "yes" : "no"}
- Existing source adapters in v3 pack: ${signals.existingSourceAdapters.join(", ") || "none"}
- Proposed Tower source adapters present: ${signals.proposedAdaptersExist ? "yes" : "no"}
- Active tenant CSV files under canonical root: ${activeTenantFiles.length}
- Separate \`tower-standardized-v1\` files still present: ${towerStandardizedFiles.length}

## Definition of done

Tower may use read-optimized projections, but Tower truth must come from the v3 enterprise context layer. \`cio_tower\` can survive only as a reconciled projection with source/evidence/canonical/entity/relationship/context-gap lineage and value-claim status.
`);
}

function writeProofHtml() {
  const rows = hardFailures.map((failure) => `<tr><td>${htmlEscape(failure.failed ? "Fail" : "Pass")}</td><td>${htmlEscape(failure.rule)}</td><td>${htmlEscape(failure.evidence)}</td></tr>`).join("");
  const lineageRows = towerToV3Rows.map((row) => `<tr><td>${htmlEscape(row.v3_dimension)}</td><td>${htmlEscape(row.v3_file)}</td><td>${htmlEscape(row.present_in_v3_template)}</td><td>${htmlEscape(row.reconciliation_status)}</td></tr>`).join("");
  writeText("tower-v3-alignment-proof.html", `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Tower v3 Source-of-Truth Alignment</title>
  <style>
    body { margin:0; background:#f7f5f0; color:#0b1730; font-family:Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
    main { max-width:1160px; margin:0 auto; padding:42px 28px 64px; }
    h1 { font-family:Georgia, serif; font-size:42px; line-height:1.05; margin:0 0 12px; }
    h2 { margin-top:34px; }
    p { color:#53627a; line-height:1.55; }
    .status { display:inline-block; border-radius:999px; padding:8px 12px; background:#fff1df; color:#9a5300; font-weight:800; letter-spacing:.08em; text-transform:uppercase; font-size:12px; }
    .grid { display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:14px; margin:24px 0; }
    .card { background:#fffdf8; border:1px solid #dfe5ee; border-radius:10px; padding:18px; }
    .label { color:#69758b; text-transform:uppercase; letter-spacing:.12em; font-size:11px; font-weight:800; }
    .num { font-family:Georgia, serif; font-size:30px; font-weight:800; margin-top:8px; }
    table { width:100%; border-collapse:collapse; background:white; border:1px solid #dfe5ee; font-size:13px; }
    th { text-align:left; background:#f0eee8; padding:10px; color:#5b6577; text-transform:uppercase; letter-spacing:.08em; font-size:10px; }
    td { border-top:1px solid #dfe5ee; padding:10px; vertical-align:top; }
    code { background:#eef2f7; padding:2px 5px; border-radius:4px; }
  </style>
</head>
<body>
  <main>
    <div class="status">${htmlEscape(alignmentStatus)}</div>
    <h1>Tower v3 source-of-truth alignment.</h1>
    <p>Generated ${htmlEscape(generatedAt)}. This proof verifies whether Tower truth originates from the v3 enterprise context layer or from a separate Tower package.</p>
    <div class="grid">
      <div class="card"><div class="label">v3 Tower dims</div><div class="num">${requiredV3Dimensions.filter((d) => v3TemplateFiles.has(d.file)).length}/6</div></div>
      <div class="card"><div class="label">Active input files</div><div class="num">${activeTenantFiles.length}</div></div>
      <div class="card"><div class="label">Tower bridge files</div><div class="num">${towerStandardizedFiles.length}</div></div>
      <div class="card"><div class="label">Path selected</div><div class="num">A</div></div>
    </div>
    <h2>Hard-rule checks</h2>
    <table><thead><tr><th>Status</th><th>Rule</th><th>Evidence</th></tr></thead><tbody>${rows}</tbody></table>
    <h2>Tower needs mapped to v3</h2>
    <table><thead><tr><th>Dimension</th><th>File</th><th>Present</th><th>Reconciliation</th></tr></thead><tbody>${lineageRows}</tbody></table>
    <h2>Decision</h2>
    <p><code>cio_tower</code> may remain only as a derived projection. It is not the source of truth until every visible row carries v3/context-layer lineage and value-claim status.</p>
  </main>
</body>
</html>`);
}

ensureDir(outDir);
writeCsv("cio-tower-source-of-truth-classification.csv", classificationRows);
writeCsv("tower-to-v3-lineage.csv", towerToV3Rows);
writeCsv("unreconciled-tower-rows.csv", unreconciledRows);
writeJson("summary.json", summary);
writeRequiredExtensions();
writeContextPackDesign();
writeSummaryMarkdown();
writeProofHtml();

const payload = {
  ok: alignmentStatus === "Pass",
  audit_id: summary.audit_id,
  status: alignmentStatus,
  out_dir: path.relative(repoRoot, outDir),
  selected_path: summary.selected_path,
  hard_failures: hardFailures.filter((failure) => failure.failed).map((failure) => failure.rule),
};

console.log(JSON.stringify(payload, null, 2));

if (alignmentStatus !== "Pass") {
  process.exitCode = 1;
}
