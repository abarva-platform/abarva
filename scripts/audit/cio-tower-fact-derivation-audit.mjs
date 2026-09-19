#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const repoRoot = process.cwd();
const outDir = path.join(repoRoot, "reports/tower-audit/cio-fact-derivation");
const generatedAt = process.env.CIO_TOWER_FACT_DERIVATION_AUDIT_AT ?? new Date().toISOString();

const keyFiles = {
  schema: "supabase/migrations/20260628202000_cio_tower_schema_v1.sql",
  traceSchema: "supabase/migrations/20260629162000_cio_tower_answer_trace_visible_parity.sql",
  lakeshoreSeed: "supabase/migrations/20260705180000_lakeshore_cio_tower_budget_seed.sql",
  standardizedLoader: "scripts/tower/load-cio-tower-standardized-v1.mjs",
  lakeshoreLoader: "src/scripts/lakeshore/load-cio-tower-facts.ts",
  v7Projection: "src/lib/tower/v7-tower-projection.ts",
  atlasGrounding: "src/lib/atlas/tower-grounding.ts",
  towerPage: "src/app/(maestro)/tower/page.tsx",
  tenantTowerPage: "src/app/(maestro)/tenant/[tenantSlug]/tower/page.tsx",
  towerIndex: "src/components/tower/TowerIndexPage.tsx",
  cxoView: "src/lib/cio-tower/cxo-view-model.ts",
  cioAnswer: "src/lib/cio-tower/answer.ts",
  metricPacketStore: "src/lib/cio-tower/metric-packet-store.ts",
  budgetRollups: "src/lib/tower/tower-budget-rollups.ts",
  towerCharts: "src/components/tower/charts/TowerCxoCharts.tsx",
  schemaDoc: "docs/architecture/tower/CIO_TOWER_SCHEMA_V1.md",
  contextPackContract: "src/lib/enterprise-knowledge/contracts/context-pack.ts",
  contextPackAssembler: "src/lib/enterprise-knowledge/assembler/context-pack-assembler.ts",
  schemaResetRecord: "docs/releases/records/2026-06-28-cio-tower-schema-reset.md",
  v7HoldcoRecord: "docs/releases/records/2026-07-06-lakeshore-v7-holdco-entity-spine.md",
  sourcePackageRecord: "docs/releases/records/2026-06-29-cio-tower-standardized-package.md",
};

const cioTables = [
  "source_registry",
  "entities",
  "facts",
  "relationships",
  "measures",
  "question_contracts",
  "measure_results",
  "prompt_packages",
  "answer_traces",
  "validation_runs",
  "validation_results",
];

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function read(file) {
  const abs = path.join(repoRoot, file);
  return fs.existsSync(abs) ? fs.readFileSync(abs, "utf8") : "";
}

function exists(file) {
  return fs.existsSync(path.join(repoRoot, file));
}

function sha(text) {
  return crypto.createHash("sha256").update(text).digest("hex").slice(0, 16);
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

function findLine(file, pattern) {
  const text = read(file);
  if (!text) return "missing";
  const lines = text.split(/\r?\n/);
  const matcher = pattern instanceof RegExp ? (line) => pattern.test(line) : (line) => line.includes(pattern);
  const index = lines.findIndex(matcher);
  return index >= 0 ? `${file}:${index + 1}` : `${file}:not-found`;
}

function walkFiles(dir) {
  const abs = path.join(repoRoot, dir);
  if (!fs.existsSync(abs)) return [];
  const entries = fs.readdirSync(abs, { withFileTypes: true });
  return entries.flatMap((entry) => {
    const child = path.join(dir, entry.name);
    if (entry.isDirectory()) return walkFiles(child);
    return [child.split(path.sep).join("/")];
  });
}

function tenantFromTowerSource(file) {
  const parts = file.split("/");
  return parts[1] && !parts[1].includes(".") ? parts[1] : "package-root";
}

function classifyTowerSource(file) {
  if (/T0[01789]_|T10_|T13_/.test(file)) {
    return {
      object_family: "AI initiative / benefit / spend / risk / evidence",
      target_tables: "source_registry;entities;facts;relationships;measure_results",
      expected_key_pattern: "source_key + source_row + generated fact/entity keys",
    };
  }
  if (/F12_it-budget-financials|tower_financial_amounts/.test(file)) {
    return {
      object_family: "budget / spend / value financial fact",
      target_tables: "source_registry;entities;facts;measure_results",
      expected_key_pattern: "budget fact keys and measure_result source_fact_keys",
    };
  }
  if (/F11_vendors|F13_initiatives|F15_kpis|F17_ai-automation/.test(file)) {
    return {
      object_family: "Tower supporting business record",
      target_tables: "source_registry;entities;facts;relationships",
      expected_key_pattern: "entity keys plus source_key/source_row",
    };
  }
  if (/context-relationships\.jsonl/.test(file)) {
    return {
      object_family: "relationship edge",
      target_tables: "source_registry;entities;relationships",
      expected_key_pattern: "relationship_key",
    };
  }
  if (/F25_context-node|F2[0-4]_|F18_|F19_/.test(file)) {
    return {
      object_family: "semantic entity / dependency context",
      target_tables: "source_registry;entities;relationships",
      expected_key_pattern: "entity_key and relationship_key",
    };
  }
  if (/\.csv$|\.yaml$|\.jsonl$/.test(file)) {
    return {
      object_family: "standardized Tower source context",
      target_tables: "source_registry;entities;facts",
      expected_key_pattern: "source_key/source_row lineage",
    };
  }
  return {
    object_family: "package metadata",
    target_tables: "operator documentation",
    expected_key_pattern: "not loaded into cio_tower",
  };
}

const sources = Object.fromEntries(Object.entries(keyFiles).map(([key, file]) => [key, read(file)]));
const packageFiles = walkFiles("tower-standardized-v1").filter((file) => /\.(csv|yaml|jsonl)$/.test(file));
const tenantPackageFiles = packageFiles.filter((file) => tenantFromTowerSource(file) !== "package-root");
const tenants = [...new Set(tenantPackageFiles.map(tenantFromTowerSource))].sort();

const sourceToTowerRows = tenantPackageFiles.map((file) => {
  const classified = classifyTowerSource(file);
  return {
    tenant: tenantFromTowerSource(file),
    source_file: file,
    source_standard: "tower-standardized-v1",
    loader_script: "scripts/tower/load-cio-tower-standardized-v1.mjs",
    target_tables: classified.target_tables,
    object_family: classified.object_family,
    expected_key_pattern: classified.expected_key_pattern,
    evidence_ref_fields: "source_key;source_row;source_file;source_system;source_fact_keys where materialized",
    v3_source_row: "not proven",
    canonical_fact_id: "not proven",
    entity_profile_id: "not proven",
    relationship_edge_id: classified.target_tables.includes("relationships") ? "cio_tower.relationships.relationship_key only" : "not applicable",
    legacy_bridge_dependency: "yes: Tower standardized source package/read-model",
    active_candidate_status: "active read model after loader; no candidate flag in cio_tower schema",
    safe_to_display: "yes as Tower read-model fact with source-file caveat",
    notes: "Source-backed to Tower standardized package, but not proven reconciled to standard-2026-07-v3 canonical row IDs.",
  };
});

const explicitLineageRows = [
  {
    tenant: "lakeshore-industries",
    source_file: "family-4-financial-commercial/F12_it-budget-financials.csv",
    source_standard: "tenant-specific Lakeshore budget bridge",
    loader_script: "src/scripts/lakeshore/load-cio-tower-facts.ts",
    target_tables: "source_registry;measures;question_contracts;entities;facts;measure_results",
    object_family: "budget / run / change / value facts",
    expected_key_pattern: "Lakeshore generated entity/fact/result keys",
    evidence_ref_fields: "source_registry source_file plus source rows",
    v3_source_row: "not proven",
    canonical_fact_id: "not proven",
    entity_profile_id: "cio_tower.entities.entity_key only",
    relationship_edge_id: "not written by this loader",
    legacy_bridge_dependency: "yes: Lakeshore-specific loader",
    active_candidate_status: "active upsert if executed",
    safe_to_display: "yes as bridge/read-model fact with source-file caveat",
    notes: "Loader comment scopes to F12 and writes a subset of cio_tower; not a complete v3-native Tower build.",
  },
  {
    tenant: "lakeshore-industries",
    source_file: "supabase/migrations/20260705180000_lakeshore_cio_tower_budget_seed.sql",
    source_standard: "migration seed fixture",
    loader_script: "Supabase migration",
    target_tables: "measures;question_contracts;source_registry;entities;facts;measure_results",
    object_family: "seeded budget facts and metric packets",
    expected_key_pattern: "literal INSERT keys in migration",
    evidence_ref_fields: "source_key/source_row where inserted",
    v3_source_row: "not proven",
    canonical_fact_id: "not proven",
    entity_profile_id: "cio_tower.entities.entity_key only",
    relationship_edge_id: "not applicable",
    legacy_bridge_dependency: "yes: seed/bootstrap",
    active_candidate_status: "active after migration in target database",
    safe_to_display: "conditional: safe as bootstrap seed, not as proof of full client truth",
    notes: "Should be treated as seed/read-model bootstrap unless reconciled to current source evidence.",
  },
  {
    tenant: "all tenants",
    source_file: "intelligence_v7.business_records",
    source_standard: "V7 projection bridge",
    loader_script: "src/lib/tower/v7-tower-projection.ts",
    target_tables: "none persisted to cio_tower by this path",
    object_family: "runtime current-state projection",
    expected_key_pattern: "V7 business record identifiers",
    evidence_ref_fields: "V7 business record payload fields",
    v3_source_row: "not proven",
    canonical_fact_id: "not proven",
    entity_profile_id: "projection entity labels only",
    relationship_edge_id: "not first-class",
    legacy_bridge_dependency: "yes: V7 bridge",
    active_candidate_status: "runtime active projection; candidate not explicit",
    safe_to_display: "yes only as projected context, not as persisted cio_tower fact",
    notes: "This bridge can inform Tower current state, but it is not the generator of persisted cio_tower facts.",
  },
];

const reconciliationRows = [
  {
    cio_tower_object: "cio_tower.source_registry",
    object_key_pattern: "source_key",
    source_layer: "Tower standardized package and seed/load scripts",
    v3_reconciliation_status: "unproven",
    evidence_registry_status: "partial: stores source_file/source_system/checksum/trust_tier but no Evidence Registry ID",
    canonical_fact_status: "not applicable",
    entity_profile_status: "not applicable",
    relationship_graph_status: "not applicable",
    legacy_bridge_dependency: "yes",
    active_candidate_status: "active rows only; no candidate state field",
    safe_to_display: "yes as lineage/source file metadata",
    notes: "Good lineage foundation; needs evidence_registry_id and source_standard/version to become v3-native.",
  },
  {
    cio_tower_object: "cio_tower.entities",
    object_key_pattern: "entity_key",
    source_layer: "Tower standardized loader, Lakeshore loader, seed migration",
    v3_reconciliation_status: "partial/unproven",
    evidence_registry_status: "partial via source_key/source_row",
    canonical_fact_status: "not a fact ID; entity only",
    entity_profile_status: "partial: entity_key is local Tower entity key, not proven Entity Profile ID",
    relationship_graph_status: "partial through cio_tower.relationships",
    legacy_bridge_dependency: "yes",
    active_candidate_status: "active rows only; no candidate state field",
    safe_to_display: "yes as Tower entity labels when source-backed",
    notes: "Needs canonical_entity_profile_id to reconcile to enterprise knowledge entity profiles.",
  },
  {
    cio_tower_object: "cio_tower.facts",
    object_key_pattern: "fact_key",
    source_layer: "Tower standardized loader, Lakeshore loader, seed migration",
    v3_reconciliation_status: "partial/unproven",
    evidence_registry_status: "partial via source_key/source_row",
    canonical_fact_status: "local fact_key only; no canonical_fact_id column proven",
    entity_profile_status: "partial via entity_key",
    relationship_graph_status: "not directly; relationships table separate",
    legacy_bridge_dependency: "yes",
    active_candidate_status: "active rows only; no candidate state field",
    safe_to_display: "yes as read-model fact; not safe to call fully v3-native",
    notes: "Strongest Tower atomic value layer, but source-template to canonical-fact reconciliation is not closed.",
  },
  {
    cio_tower_object: "cio_tower.relationships",
    object_key_pattern: "relationship_key",
    source_layer: "Tower standardized graph/context relationship files and loader-generated edges",
    v3_reconciliation_status: "partial/unproven",
    evidence_registry_status: "partial via source_key/source_row",
    canonical_fact_status: "not applicable",
    entity_profile_status: "partial via from/to entity keys",
    relationship_graph_status: "local relationship_key only; not proven canonical graph edge ID",
    legacy_bridge_dependency: "yes",
    active_candidate_status: "active rows only; no candidate state field",
    safe_to_display: "yes when labeled Tower relationship context",
    notes: "Needs canonical relationship type dictionary and enterprise relationship_edge_id reconciliation.",
  },
  {
    cio_tower_object: "cio_tower.measures",
    object_key_pattern: "measure_key",
    source_layer: "loader/seeded governed metric registry",
    v3_reconciliation_status: "not applicable to source rows",
    evidence_registry_status: "not evidence-backed; registry metadata",
    canonical_fact_status: "not applicable",
    entity_profile_status: "not applicable",
    relationship_graph_status: "not applicable",
    legacy_bridge_dependency: "no for registry, yes for current loader origin",
    active_candidate_status: "active boolean exists",
    safe_to_display: "yes",
    notes: "Metric registry is a control surface, not a client fact source.",
  },
  {
    cio_tower_object: "cio_tower.question_contracts",
    object_key_pattern: "contract_key",
    source_layer: "loader/seeded question registry",
    v3_reconciliation_status: "not applicable",
    evidence_registry_status: "not evidence-backed; prompt contract metadata",
    canonical_fact_status: "not applicable",
    entity_profile_status: "not applicable",
    relationship_graph_status: "not applicable",
    legacy_bridge_dependency: "no for registry, yes for current loader origin",
    active_candidate_status: "active boolean exists",
    safe_to_display: "internal only",
    notes: "Used to route Tower aVa questions; not a value fact.",
  },
  {
    cio_tower_object: "cio_tower.measure_results",
    object_key_pattern: "result_key and source_fact_keys",
    source_layer: "loader-generated materialized result from cio_tower.facts",
    v3_reconciliation_status: "partial/unproven",
    evidence_registry_status: "partial through source_fact_keys back to local facts",
    canonical_fact_status: "derived from local fact_key list, not canonical_fact_id list",
    entity_profile_status: "dimension JSON may identify scope but not canonical profile ID",
    relationship_graph_status: "not applicable",
    legacy_bridge_dependency: "yes",
    active_candidate_status: "active rows only; no candidate state field",
    safe_to_display: "yes as materialized Tower read-model metric with formula/version caveat",
    notes: "Fast dashboard/chat packet seam; should not be treated as independent source truth.",
  },
  {
    cio_tower_object: "cio_tower.prompt_packages / answer_traces",
    object_key_pattern: "prompt_package_key / trace_key",
    source_layer: "Tower aVa runtime audit trail",
    v3_reconciliation_status: "not applicable",
    evidence_registry_status: "inherits deterministic packet references",
    canonical_fact_status: "packet may include local fact keys",
    entity_profile_status: "packet may include display names",
    relationship_graph_status: "packet may include local relationships",
    legacy_bridge_dependency: "yes if packet comes from bridge/read-model facts",
    active_candidate_status: "runtime trace; candidate not explicit",
    safe_to_display: "internal/audit only",
    notes: "Good prompt/render proof mechanism; not a source fact generator.",
  },
];

const legacyBridgeRows = [
  {
    dependency: "tower-standardized-v1 package",
    kind: "source package/read-model source",
    path: "tower-standardized-v1/",
    why_it_exists: "Primary governed Tower source package loaded into cio_tower for all tenants.",
    v3_status: "not proven equivalent to standard-2026-07-v3 canonical row model",
    risk: "Tower can look source-backed while still bypassing new enterprise data runway identifiers.",
    recommendation: "Keep as read-model bridge until each source row has evidence_registry_id/canonical_fact_id/entity_profile_id where applicable.",
  },
  {
    dependency: "standardized Tower loader",
    kind: "data loader",
    path: "scripts/tower/load-cio-tower-standardized-v1.mjs",
    why_it_exists: "Deletes/reloads tenant cio_tower rows and materializes measures/results from the standardized package.",
    v3_status: "bridge",
    risk: "Loader can remain authoritative unless reconciled to candidate/active promotion contracts.",
    recommendation: "Add v3 contract metadata, active/candidate version, and reconciliation output to each generated row.",
  },
  {
    dependency: "Lakeshore F12 loader",
    kind: "tenant-specific bridge loader",
    path: "src/scripts/lakeshore/load-cio-tower-facts.ts",
    why_it_exists: "Loads Lakeshore budget facts and measure results from F12.",
    v3_status: "tenant bridge",
    risk: "Can diverge from generic all-tenant Tower loader and candidate/promotion state.",
    recommendation: "Retire or wrap through the same v3 candidate-to-active loader contract.",
  },
  {
    dependency: "Lakeshore budget seed migration",
    kind: "seed fixture",
    path: "supabase/migrations/20260705180000_lakeshore_cio_tower_budget_seed.sql",
    why_it_exists: "Bootstraps budget facts and measure packets directly in migrations.",
    v3_status: "seed/bootstrap, not v3-native",
    risk: "Seeded facts can be mistaken for current source-backed facts.",
    recommendation: "Mark seeded facts as bootstrap/read-model and reconcile or replace with loaded source evidence.",
  },
  {
    dependency: "V7 projection bridge",
    kind: "runtime projection",
    path: "src/lib/tower/v7-tower-projection.ts",
    why_it_exists: "Builds Tower current-state packets from intelligence_v7.business_records when materialized Tower packets are needed.",
    v3_status: "legacy projection bridge",
    risk: "The UI/aVa can receive projected context without source-template to canonical fact proof.",
    recommendation: "Use only as shadow/bridge until the v3 active tenant access layer can produce Tower-ready records.",
  },
  {
    dependency: "TowerContextPack contract exists outside runtime",
    kind: "contract gap",
    path: "src/lib/enterprise-knowledge/contracts/context-pack.ts",
    why_it_exists: "Enterprise knowledge layer defines TowerContextPack, but Tower page/ask paths still read cio_tower directly.",
    v3_status: "not adopted as formal runtime boundary",
    risk: "Multiple valid read paths make audit and migration claims hard to prove.",
    recommendation: "Create a formal TowerContextPack adapter from active/candidate data to cio_tower-compatible TowerValueRecords.",
  },
];

const towerConsumerRows = [
  {
    consumer: "Tower route loader",
    path: "src/app/(maestro)/tower/page.tsx",
    reads_tables: "cio_tower through loadCioTowerCxoView and budget rollups",
    fields_used: "tenant_key, metrics, facts, budget rollups",
    writes_tables: "none",
    prompt_or_ui: "UI landing",
    safe_boundary: "partial: deterministic read model, not formal TowerContextPack",
    notes: `Evidence: ${findLine(keyFiles.towerPage, "loadCioTowerCxoView")}`,
  },
  {
    consumer: "Tower CXO view model",
    path: "src/lib/cio-tower/cxo-view-model.ts",
    reads_tables: "cio_tower.measure_results;cio_tower.facts;cio_tower.entities;cio_tower.source_registry",
    fields_used: "value_numeric, value_json, measure, basis, period, source_file, source_row, attributes",
    writes_tables: "none",
    prompt_or_ui: "UI view model",
    safe_boundary: "good read-model seam; no v3 canonical reconciliation",
    notes: `Evidence: ${findLine(keyFiles.cxoView, "from cio_tower.measure_results")}; ${findLine(keyFiles.cxoView, "left join cio_tower.source_registry")}`,
  },
  {
    consumer: "Tower aVa answer path",
    path: "src/lib/cio-tower/answer.ts",
    reads_tables: "question_contracts;measure_results;measures;facts;entities;relationships",
    fields_used: "contract, measures, source_fact_keys, facts, relationships, derived gaps",
    writes_tables: "prompt_packages;answer_traces",
    prompt_or_ui: "Claude deterministic packet and audit trace",
    safe_boundary: "strong for prompt proof; still local read-model facts",
    notes: `Evidence: ${findLine(keyFiles.cioAnswer, "from cio_tower.question_contracts")}; ${findLine(keyFiles.cioAnswer, "insert into cio_tower.prompt_packages")}`,
  },
  {
    consumer: "Metric packet store",
    path: "src/lib/cio-tower/metric-packet-store.ts",
    reads_tables: "cio_tower.measure_results;cio_tower.measures",
    fields_used: "measure_key, label, dimensions, value_numeric, value_json, source_fact_keys",
    writes_tables: "none",
    prompt_or_ui: "shared metric packet",
    safe_boundary: "good for dashboard/chat parity",
    notes: `Evidence: ${findLine(keyFiles.metricPacketStore, "from cio_tower.measure_results")}`,
  },
  {
    consumer: "Tower budget rollups",
    path: "src/lib/tower/tower-budget-rollups.ts",
    reads_tables: "cio_tower.facts",
    fields_used: "budget facts, entity keys, attributes/source labels",
    writes_tables: "none",
    prompt_or_ui: "UI deterministic KPI rollups",
    safe_boundary: "safe if labeled budget/read-model; not a v3 proof",
    notes: `Evidence: ${findLine(keyFiles.budgetRollups, /cio_tower\.facts|from cio_tower/)}`,
  },
  {
    consumer: "Tower charts",
    path: "src/components/tower/charts/TowerCxoCharts.tsx",
    reads_tables: "none directly; consumes CXO view model + budget rollups",
    fields_used: "chart props from deterministic Tower view model",
    writes_tables: "none",
    prompt_or_ui: "UI charts",
    safe_boundary: "presentation only",
    notes: `Evidence: ${findLine(keyFiles.towerCharts, "loadCioTowerCxoView")}`,
  },
  {
    consumer: "Atlas Tower current-state grounding",
    path: "src/lib/atlas/tower-grounding.ts",
    reads_tables: "materialized Tower read model and V7 projection bridge",
    fields_used: "AI initiatives, vendor packets, metric packets",
    writes_tables: "none",
    prompt_or_ui: "aVa current-state context",
    safe_boundary: "bridge: not the same as cio_tower persisted facts",
    notes: `Evidence: ${findLine(keyFiles.atlasGrounding, "loadV7TowerProjection")}`,
  },
];

const unreconciledRows = [
  {
    object_type: "fact",
    object_key_pattern: "cio_tower.facts.fact_key",
    tenant: "all loaded tenants",
    source_file_or_table: "tower-standardized-v1/* plus loader output",
    loader_script: "scripts/tower/load-cio-tower-standardized-v1.mjs",
    missing_reconciliation: "canonical_fact_id",
    safe_to_display: "yes as Tower read-model fact",
    unsafe_claim: "fully v3-native canonical fact",
    notes: "fact_key is local to cio_tower; no proven standard-2026-07-v3 source row ID in current audit.",
  },
  {
    object_type: "measure result",
    object_key_pattern: "cio_tower.measure_results.result_key",
    tenant: "all loaded tenants",
    source_file_or_table: "derived from cio_tower.facts",
    loader_script: "scripts/tower/load-cio-tower-standardized-v1.mjs",
    missing_reconciliation: "source_fact_keys point to local fact_key, not canonical_fact_id",
    safe_to_display: "yes as materialized metric with formula/version",
    unsafe_claim: "source-of-truth financial result without source fact caveat",
    notes: "Good for fast dashboard reads; must remain tied to local fact lineage and formula_version.",
  },
  {
    object_type: "entity",
    object_key_pattern: "cio_tower.entities.entity_key",
    tenant: "all loaded tenants",
    source_file_or_table: "tower-standardized-v1/*",
    loader_script: "scripts/tower/load-cio-tower-standardized-v1.mjs",
    missing_reconciliation: "entity_profile_id",
    safe_to_display: "yes as Tower entity label",
    unsafe_claim: "enterprise entity profile unless reconciled",
    notes: "Portfolio company/system/vendor labels are useful, but not proven bound to canonical entity profiles.",
  },
  {
    object_type: "relationship",
    object_key_pattern: "cio_tower.relationships.relationship_key",
    tenant: "all loaded tenants",
    source_file_or_table: "tower-standardized-v1/* graph/context files",
    loader_script: "scripts/tower/load-cio-tower-standardized-v1.mjs",
    missing_reconciliation: "canonical relationship_edge_id and relationship type dictionary proof",
    safe_to_display: "yes as Tower dependency context",
    unsafe_claim: "canonical enterprise graph edge unless reconciled",
    notes: "Relationship rows are local Tower graph context until reconciled to the enterprise relationship graph.",
  },
  {
    object_type: "seeded fact",
    object_key_pattern: "literal migration INSERT keys",
    tenant: "lakeshore-industries",
    source_file_or_table: "20260705180000_lakeshore_cio_tower_budget_seed.sql",
    loader_script: "Supabase migration",
    missing_reconciliation: "current evidence source and candidate/active state",
    safe_to_display: "conditional",
    unsafe_claim: "current client source fact without seed caveat",
    notes: "Seed facts should be reconciled or marked bootstrap/read-model before CXO-level use.",
  },
  {
    object_type: "V7 projection context",
    object_key_pattern: "projection-generated packets",
    tenant: "all tenants",
    source_file_or_table: "intelligence_v7.business_records",
    loader_script: "src/lib/tower/v7-tower-projection.ts",
    missing_reconciliation: "persisted cio_tower fact mapping and v3 row ID",
    safe_to_display: "yes as projected context",
    unsafe_claim: "persisted cio_tower fact derivation",
    notes: "The bridge reads V7 business records at runtime; it does not itself create persisted cio_tower rows.",
  },
];

const objectSummaryRows = [
  {
    object_key: "source_registry",
    display_name: "Tower source registry",
    tenant: "tenant-scoped",
    source_file_or_table: "tower-standardized-v1/* / migration seeds",
    loader_script: "load-cio-tower-standardized-v1.mjs / load-cio-tower-facts.ts / seed migration",
    source_standard: "tower-standardized-v1 or seed/bridge",
    v3_source_row: "not proven",
    evidence_ref: "source_key/source_file/source_row",
    canonical_fact_id: "not applicable",
    entity_profile_id: "not applicable",
    relationship_edge_id: "not applicable",
    legacy_bridge_dependency: "yes",
    active_candidate_status: "active only; no candidate field",
    safe_to_display: "yes",
    notes: "Lineage source, not a fact itself.",
  },
  {
    object_key: "entities",
    display_name: "Tower entities",
    tenant: "tenant-scoped",
    source_file_or_table: "standardized source package",
    loader_script: "load-cio-tower-standardized-v1.mjs",
    source_standard: "tower-standardized-v1",
    v3_source_row: "not proven",
    evidence_ref: "source_key/source_row",
    canonical_fact_id: "not applicable",
    entity_profile_id: "not proven",
    relationship_edge_id: "not applicable",
    legacy_bridge_dependency: "yes",
    active_candidate_status: "active only; no candidate field",
    safe_to_display: "yes as read-model entity",
    notes: "Needs canonical entity profile reconciliation.",
  },
  {
    object_key: "facts",
    display_name: "Tower atomic facts",
    tenant: "tenant-scoped",
    source_file_or_table: "standardized source package / seed / tenant bridge",
    loader_script: "load-cio-tower-standardized-v1.mjs primarily",
    source_standard: "tower-standardized-v1",
    v3_source_row: "not proven",
    evidence_ref: "source_key/source_row",
    canonical_fact_id: "not proven",
    entity_profile_id: "partial via entity_key",
    relationship_edge_id: "not applicable",
    legacy_bridge_dependency: "yes",
    active_candidate_status: "active only; no candidate field",
    safe_to_display: "yes as Tower read-model fact",
    notes: "This is the main Tower fact layer, but not proven v3-native.",
  },
  {
    object_key: "relationships",
    display_name: "Tower relationships",
    tenant: "tenant-scoped",
    source_file_or_table: "standardized source package graph/context files",
    loader_script: "load-cio-tower-standardized-v1.mjs",
    source_standard: "tower-standardized-v1",
    v3_source_row: "not proven",
    evidence_ref: "source_key/source_row",
    canonical_fact_id: "not applicable",
    entity_profile_id: "partial via from/to entity_key",
    relationship_edge_id: "not proven outside cio_tower relationship_key",
    legacy_bridge_dependency: "yes",
    active_candidate_status: "active only; no candidate field",
    safe_to_display: "yes as Tower relationship context",
    notes: "Needs enterprise relationship graph reconciliation.",
  },
  {
    object_key: "measure_results",
    display_name: "Tower materialized metric results",
    tenant: "tenant-scoped",
    source_file_or_table: "derived from cio_tower.facts",
    loader_script: "load-cio-tower-standardized-v1.mjs",
    source_standard: "Tower read-model formula",
    v3_source_row: "not proven",
    evidence_ref: "source_fact_keys -> cio_tower.facts",
    canonical_fact_id: "not proven",
    entity_profile_id: "not proven",
    relationship_edge_id: "not applicable",
    legacy_bridge_dependency: "yes",
    active_candidate_status: "active only; no candidate field",
    safe_to_display: "yes with formula/source caveat",
    notes: "Fast shared dashboard/chat packet; not independent source truth.",
  },
];

const schemaSignals = cioTables.map((table) => ({
  table: `cio_tower.${table}`,
  schema_definition: findLine(keyFiles.schema, `CREATE TABLE IF NOT EXISTS cio_tower.${table}`),
  insert_or_loader_signal:
    sources.standardizedLoader.includes(`cio_tower.${table}`)
      ? findLine(keyFiles.standardizedLoader, `cio_tower.${table}`)
      : sources.lakeshoreSeed.includes(`cio_tower.${table}`)
        ? findLine(keyFiles.lakeshoreSeed, `cio_tower.${table}`)
        : "no direct insert signal in audited loaders",
}));

const summary = {
  audit_id: "CIO-TOWER-FACT-DERIVATION-AUDIT",
  generated_at: generatedAt,
  branch: process.env.GIT_BRANCH ?? "codex/tower-context-layer-value-audit",
  verdict: "Tower is lineage-aware and source-backed through the cio_tower read model, but this audit does not prove it is fully standard-2026-07-v3-native.",
  current_state: {
    cio_tower_schema_exists: exists(keyFiles.schema),
    primary_loader_exists: exists(keyFiles.standardizedLoader),
    standardized_source_package_exists: fs.existsSync(path.join(repoRoot, "tower-standardized-v1")),
    tenant_count_in_package: tenants.length,
    standardized_source_file_count: tenantPackageFiles.length,
    v7_projection_bridge_exists: exists(keyFiles.v7Projection),
    tower_context_pack_contract_exists: sources.contextPackContract.includes("TowerContextPack"),
    tower_page_uses_cio_tower_view: sources.towerPage.includes("loadCioTowerCxoView"),
    tower_ask_persists_prompt_trace: sources.cioAnswer.includes("cio_tower.prompt_packages") && sources.cioAnswer.includes("cio_tower.answer_traces"),
  },
  pass_criteria: {
    trace_to_v3_source_backed_context: "Partial/Fail: source-backed to Tower standardized files, not proven to v3 source row IDs.",
    label_bridge_read_model_facts: "Pass: audit explicitly labels bridge/read-model dependencies.",
    mark_unsafe_unreconciled: "Pass: unreconciled fact/entity/relationship/measure-result classes are listed.",
  },
  required_outputs: [
    "summary.md",
    "summary.json",
    "source-to-cio-tower-lineage.csv",
    "cio-tower-to-v3-reconciliation.csv",
    "legacy-bridge-dependencies.csv",
    "tower-consumer-map.csv",
    "unreconciled-facts.csv",
    "cio-fact-derivation-proof.html",
  ],
  risk_rating: "Medium",
  next_decision: "Keep cio_tower as a governed Tower read model, then reconcile it to the new data runway by adding evidence_registry_id, canonical_fact_id, entity_profile_id, relationship_edge_id, source_standard, and active/candidate version state.",
  source_hash: sha([
    sources.schema,
    sources.standardizedLoader,
    sources.lakeshoreLoader,
    sources.v7Projection,
    sources.cxoView,
    sources.cioAnswer,
  ].join("\n")),
};

function tableHtml(rows, limit = 12) {
  const visible = rows.slice(0, limit);
  const headers = Object.keys(visible[0] ?? {});
  return `<table><thead><tr>${headers.map((h) => `<th>${htmlEscape(h)}</th>`).join("")}</tr></thead><tbody>${visible.map((row) => `<tr>${headers.map((h) => `<td>${htmlEscape(row[h])}</td>`).join("")}</tr>`).join("")}</tbody></table>`;
}

function writeProofHtml() {
  const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>CIO Tower Fact Derivation Audit</title>
  <style>
    :root { --ink:#0b1730; --muted:#53627a; --line:#dfe5ee; --green:#087a4c; --amber:#a86500; --bg:#f7f5f0; --card:#fffdf8; }
    body { margin:0; font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; color:var(--ink); background:var(--bg); }
    main { max-width: 1180px; margin: 0 auto; padding: 44px 28px 64px; }
    h1 { font-family: Georgia, serif; font-size: 42px; line-height: 1.05; margin: 0 0 12px; }
    h2 { font-size: 20px; margin: 34px 0 12px; }
    p { color: var(--muted); line-height: 1.55; }
    .grid { display:grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 14px; margin: 24px 0; }
    .card { background:var(--card); border:1px solid var(--line); border-radius:10px; padding:18px; box-shadow: 0 8px 26px rgba(9,21,43,.05); }
    .label { text-transform: uppercase; letter-spacing: .12em; color: var(--muted); font-size: 11px; font-weight: 700; }
    .num { font-family: Georgia, serif; font-size: 30px; font-weight: 700; margin-top: 8px; }
    .verdict { border-left: 5px solid var(--amber); }
    .pass { color:var(--green); font-weight:700; }
    table { width:100%; border-collapse: collapse; background:white; border:1px solid var(--line); border-radius:8px; overflow:hidden; display:table; font-size: 13px; }
    th { text-align:left; background:#f0eee8; color:#5b6577; text-transform:uppercase; letter-spacing:.08em; font-size:10px; padding:10px; }
    td { vertical-align:top; padding:10px; border-top:1px solid var(--line); }
    code { background:#eef2f7; padding:2px 5px; border-radius:4px; }
  </style>
</head>
<body>
  <main>
    <div class="label">CIO-TOWER-FACT-DERIVATION-AUDIT</div>
    <h1>How <code>cio_tower</code> facts are derived.</h1>
    <p>Generated ${htmlEscape(generatedAt)}. This is a lineage and derivation audit, not a Tower product redesign or UI proof.</p>
    <div class="card verdict">
      <strong>Verdict:</strong> ${htmlEscape(summary.verdict)}
    </div>
    <div class="grid">
      <div class="card"><div class="label">Tenants in package</div><div class="num">${tenants.length}</div></div>
      <div class="card"><div class="label">Standardized files</div><div class="num">${tenantPackageFiles.length}</div></div>
      <div class="card"><div class="label">cio_tower tables</div><div class="num">${cioTables.length}</div></div>
      <div class="card"><div class="label">Primary status</div><div class="num">Bridge</div></div>
    </div>
    <h2>Pass Criteria</h2>
    <table>
      <tbody>
        <tr><td>Trace to v3 source-backed context</td><td>${htmlEscape(summary.pass_criteria.trace_to_v3_source_backed_context)}</td></tr>
        <tr><td>Label bridge/read-model facts</td><td class="pass">${htmlEscape(summary.pass_criteria.label_bridge_read_model_facts)}</td></tr>
        <tr><td>Mark unsafe/unreconciled</td><td class="pass">${htmlEscape(summary.pass_criteria.mark_unsafe_unreconciled)}</td></tr>
      </tbody>
    </table>
    <h2>Schema Signals</h2>
    ${tableHtml(schemaSignals, 14)}
    <h2>Consumer Map</h2>
    ${tableHtml(towerConsumerRows, 10)}
    <h2>Legacy / Bridge Dependencies</h2>
    ${tableHtml(legacyBridgeRows, 10)}
    <h2>Unreconciled Classes</h2>
    ${tableHtml(unreconciledRows, 10)}
    <h2>Sample Source-to-cio_tower Lineage</h2>
    ${tableHtml([...explicitLineageRows, ...sourceToTowerRows], 14)}
  </main>
</body>
</html>`;
  writeText("cio-fact-derivation-proof.html", html);
}

function writeSummaryMarkdown() {
  const text = `# CIO Tower Fact Derivation Audit

Generated: ${generatedAt}

## Verdict

Tower is **lineage-aware and source-backed through the existing \`cio_tower\` read model**, but this audit does **not** prove Tower is fully \`standard-2026-07-v3\` native.

The strongest derivation chain we can prove is:

\`\`\`text
tower-standardized-v1 source files
  -> scripts/tower/load-cio-tower-standardized-v1.mjs
  -> cio_tower.source_registry / entities / facts / relationships / measures / question_contracts / measure_results
  -> Tower CXO view, Tower charts, budget rollups, and Tower aVa deterministic prompt packets
\`\`\`

There are also bridge paths:

\`\`\`text
src/scripts/lakeshore/load-cio-tower-facts.ts
  -> Lakeshore F12 budget subset into cio_tower

supabase/migrations/20260705180000_lakeshore_cio_tower_budget_seed.sql
  -> seed/bootstrap Tower budget facts

intelligence_v7.business_records
  -> src/lib/tower/v7-tower-projection.ts
  -> runtime Tower current-state projection, not persisted cio_tower fact creation
\`\`\`

## What is proven

- \`cio_tower\` has explicit schema tables for sources, entities, facts, relationships, measures, question contracts, measure results, prompt packages, answer traces, and validation results.
- The standardized Tower loader writes the main \`cio_tower\` tables from \`tower-standardized-v1\`.
- Tower landing and charts consume deterministic \`cio_tower\` view models.
- Tower aVa consumes question contracts, measure results, facts, relationships, and gaps before Claude, then stores prompt/render traces.
- \`source_key\`, \`source_row\`, \`source_file\`, \`source_system\`, \`source_fact_keys\`, and \`formula_version\` provide useful local lineage.

## What is not proven

- That every \`cio_tower.facts.fact_key\` reconciles to a \`standard-2026-07-v3\` source row.
- That \`cio_tower.facts\` rows carry a canonical \`canonical_fact_id\`.
- That \`cio_tower.entities.entity_key\` is the same as an enterprise Entity Profile ID.
- That \`cio_tower.relationships.relationship_key\` is the canonical enterprise relationship graph edge ID.
- That active vs candidate state is represented in the \`cio_tower\` schema.
- That seeded facts are current client evidence rather than bootstrap/read-model rows.

## Safe interpretation

\`cio_tower\` is safe to use as a governed Tower read model when the UI and aVa describe it as source-backed Tower context or materialized Tower metrics. It is not safe to call it fully v3-native or fully promoted active tenant truth until reconciliation fields and candidate/active state are added and proven.

## Required next design move

Keep \`cio_tower\` as the Tower serving/read model, but add a reconciliation boundary:

\`\`\`text
v3 source row / evidence registry
  -> canonical fact
  -> entity profile
  -> relationship graph edge
  -> TowerValueRecord
  -> cio_tower fact / measure result
\`\`\`

At minimum, future rows should carry:

- \`source_standard\`
- \`source_contract_version\`
- \`tenant_packet_id\`
- \`candidate_version_id\` or active version ID
- \`evidence_registry_id\`
- \`canonical_fact_id\`
- \`entity_profile_id\`
- \`relationship_edge_id\` where applicable
- \`value_claim_status\`: proposed, promised, measured, realized, unsupported
- \`safe_to_display\` and \`display_caveat\`

## Generated files

- \`summary.json\`
- \`source-to-cio-tower-lineage.csv\`
- \`cio-tower-to-v3-reconciliation.csv\`
- \`legacy-bridge-dependencies.csv\`
- \`tower-consumer-map.csv\`
- \`unreconciled-facts.csv\`
- \`cio-fact-derivation-proof.html\`
`;
  writeText("summary.md", text);
}

ensureDir(outDir);
writeCsv("source-to-cio-tower-lineage.csv", [...explicitLineageRows, ...sourceToTowerRows]);
writeCsv("cio-tower-to-v3-reconciliation.csv", reconciliationRows);
writeCsv("legacy-bridge-dependencies.csv", legacyBridgeRows);
writeCsv("tower-consumer-map.csv", towerConsumerRows);
writeCsv("unreconciled-facts.csv", unreconciledRows);
writeCsv("cio-object-summary.csv", objectSummaryRows);
writeCsv("schema-signals.csv", schemaSignals);
writeJson("summary.json", summary);
writeSummaryMarkdown();
writeProofHtml();

console.log(JSON.stringify({
  ok: true,
  audit_id: summary.audit_id,
  out_dir: path.relative(repoRoot, outDir),
  tenant_count: tenants.length,
  standardized_source_file_count: tenantPackageFiles.length,
  required_outputs_written: summary.required_outputs.length,
  verdict: summary.verdict,
}, null, 2));
