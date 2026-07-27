import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import { SpreadsheetFile, Workbook } from "@oai/artifact-tool";

const __filename = fileURLToPath(import.meta.url);
const repoRoot = path.resolve(path.dirname(__filename), "../..");
const outDir = path.join(repoRoot, "clients/shared/20-phase3c2d-consumption-contracts");
const validationDir = path.join(outDir, "validation");

const GENERATED = "2026-07-27";
const VERSION = "phase3c2d-consumption-contracts-v1.0.0";

const availabilityStates = [
  "available",
  "not_loaded",
  "not_measured",
  "withheld",
  "conflicting",
  "stale",
  "candidate",
  "accepted",
  "superseded",
  "not_applicable",
];

const projectionRows = [
  ["consumption.enterprise_brief_v1", "Home / Knowledge", "tenant executive brief shell, source-bound status and baseline metadata", "publication.enterprise_publication_v1", "required before Enterprise Brief renders", "Home must render without Cube", "tenant_key, knowledge_baseline_ref, content_hash"],
  ["consumption.enterprise_identity_v1", "Home / aVa", "organization identity, industry, footprint, revenue/employee disclosure states", "knowledge.organization, metrics.metric_observation", "required after enterprise wave", "missing values return null plus availability_state", "tenant_key, organization_id, knowledge_baseline_ref"],
  ["consumption.executive_perspective_v1", "Home / Intelligence", "leadership themes, interview signals and client-confirmed caveats", "knowledge.interview, knowledge.fact_assertion", "optional but expected for rich tenants", "synthetic/interview signals must carry source_basis", "tenant_key, perspective_id, evidence_coverage"],
  ["consumption.strategic_interpretation_v1", "Home / aVa", "Claude-authored strategic interpretation pinned to one baseline", "publication.strategic_publication_v1", "generated only after publication validation", "renderer may style but not rewrite", "tenant_key, interpretation_id, prompt_hash"],
  ["consumption.domain_summary_v1", "Home Explore", "domain-level summary for enterprise, technology, data, vendors, risks and programs", "publication.domain_publication_v1", "required for Explore landing", "partial domains show readiness state", "tenant_key, domain_key, authority_state"],
  ["consumption.application_inventory_v1", "Home / Source / Intelligence", "applications, ownership, lifecycle, hosting and criticality", "knowledge.application", "required after application wave", "no zero substitutions for missing ownership/cost", "tenant_key, application_id, content_hash"],
  ["consumption.vendor_contract_inventory_v1", "Home / Source / Tower", "vendors, contracts, terms, renewal exposure and evidence state", "knowledge.vendor, knowledge.contract", "required before Source projection", "commercial claims require accepted source evidence", "tenant_key, contract_id, publication_ref"],
  ["consumption.metric_observation_v1", "Cube / Tower / Home", "governed metric observations with null semantics and evidence state", "metrics.metric_definition, metrics.metric_observation", "required before Cube certification", "value null when unavailable", "tenant_key, metric_id, period, baseline_ref"],
  ["consumption.relationship_node_v1", "Home Relationships / aVa", "accepted graph nodes for UI and packet use", "knowledge.relationship_assertion", "required before graph view", "no candidate nodes in active view", "tenant_key, node_id, baseline_ref"],
  ["consumption.relationship_edge_v1", "Home Relationships / aVa", "accepted graph edges with valid endpoints and evidence", "knowledge.relationship_assertion", "required before graph view", "zero broken endpoints", "tenant_key, edge_id, from_node_id, to_node_id"],
  ["consumption.relationship_evidence_v1", "Evidence / aVa", "source snippets and lineage for graph assertions", "evidence.evidence_fragment", "required for graph evidence drawer", "hidden truth never exposed", "tenant_key, edge_id, evidence_id"],
  ["consumption.evidence_gap_v1", "Home / Source / Moves", "evidence gaps, source requests and impact explanation", "governance.evidence_gap", "required in every partial state", "missing is explicit, never converted to zero", "tenant_key, gap_id, severity"],
  ["consumption.search_document_v1", "Nexus search / aVa", "deterministic search documents over accepted publications", "publication.active_knowledge_baseline", "required before deterministic search", "candidate/working content excluded", "tenant_key, search_doc_id, content_hash"],
  ["consumption.module_knowledge_packet_v1", "aVa / module APIs", "versioned packet references for Home, Source, Moves, Tower and Intelligence", "publication.active_knowledge_baseline, consumption.*", "required before module packet certification", "records source versions and metric query hashes", "tenant_key, module_key, packet_hash"],
];

const objectFieldRows = [
  ["baseline_metadata", "tenant_key", "text", "required", "all consumption views", "Tenant identity from registry, never path-inferred."],
  ["baseline_metadata", "knowledge_baseline_ref", "text", "required", "all consumption views", "Pins every row to one active baseline."],
  ["baseline_metadata", "domain_publication_ref", "text", "required when domain-specific", "domain and module views", "Prevents cross-domain snapshot mixing."],
  ["baseline_metadata", "projection_contract_version", "text", "required", "all consumption views", "Versioned compatibility contract."],
  ["baseline_metadata", "as_of_date", "date", "required", "all consumption views", "Reader-visible freshness anchor."],
  ["baseline_metadata", "authority_state", "enum", "required", "all consumption views", "candidate/accepted/published/retired/superseded."],
  ["baseline_metadata", "freshness_state", "enum", "required", "all consumption views", "fresh/stale/not_loaded/not_applicable."],
  ["baseline_metadata", "availability_state", "enum", "required", "metrics and optional fields", availabilityStates.join(", ")],
  ["baseline_metadata", "evidence_coverage", "numeric", "required", "all rollups", "0 to 1; does not imply truth by itself."],
  ["baseline_metadata", "content_hash", "text", "required", "all rows/documents", "Supports parity and rollback checks."],
  ["application", "application_id", "text", "required", "application_inventory_v1", "Canonical ID, not display name."],
  ["application", "hosting_model", "enum", "required when known", "application_inventory_v1", "on_prem/private_cloud/aws/azure/saas/hybrid/edge/mainframe."],
  ["contract", "contract_id", "text", "required", "vendor_contract_inventory_v1", "Contract/SOW identity from canonical contract object."],
  ["contract", "renewal_date", "date", "nullable", "vendor_contract_inventory_v1", "Null with not_loaded/withheld is valid."],
  ["metric", "metric_value", "numeric", "nullable", "metric_observation_v1", "Never coerce null to zero."],
  ["relationship", "from_node_id", "text", "required", "relationship_edge_v1", "Endpoint must exist in relationship_node_v1."],
  ["relationship", "to_node_id", "text", "required", "relationship_edge_v1", "Endpoint must exist in relationship_node_v1."],
  ["evidence_gap", "business_impact", "text", "required", "evidence_gap_v1", "Explains why missing evidence matters in business language."],
];

const canonicalMappingRows = [
  ["knowledge.organization", "publication.enterprise_publication_v1", "consumption.enterprise_identity_v1", "Home, aVa", "identity and scope", "confirmed"],
  ["knowledge.business_function", "publication.enterprise_publication_v1", "consumption.domain_summary_v1", "Home Explore, aVa", "operating model", "confirmed"],
  ["knowledge.application", "publication.technology_publication_v1", "consumption.application_inventory_v1", "Home, Source, Intelligence", "technology estate", "confirmed"],
  ["knowledge.platform", "publication.technology_publication_v1", "consumption.application_inventory_v1", "Home, Intelligence", "hosting and resilience", "provisional"],
  ["knowledge.data_product", "publication.data_publication_v1", "consumption.domain_summary_v1", "Home, Intelligence, Cube", "data and analytics estate", "confirmed"],
  ["knowledge.vendor", "publication.vendor_publication_v1", "consumption.vendor_contract_inventory_v1", "Home, Source, Tower", "supplier identity", "confirmed"],
  ["knowledge.contract", "publication.vendor_publication_v1", "consumption.vendor_contract_inventory_v1", "Source, Tower", "commercial terms", "confirmed"],
  ["knowledge.program", "publication.program_publication_v1", "consumption.module_knowledge_packet_v1", "Moves, Tower, Intelligence", "program state", "provisional"],
  ["knowledge.risk", "publication.risk_control_publication_v1", "consumption.evidence_gap_v1", "Home, Tower, aVa", "risk and controls", "confirmed"],
  ["metrics.metric_observation", "publication.metrics_publication_v1", "consumption.metric_observation_v1", "Cube, Tower, Home", "governed measurements", "confirmed"],
  ["knowledge.relationship_assertion", "publication.relationship_publication_v1", "consumption.relationship_edge_v1", "Home graph, aVa", "accepted graph", "confirmed"],
  ["evidence.evidence_fragment", "publication.evidence_publication_v1", "consumption.relationship_evidence_v1", "Evidence drawers, aVa", "lineage and support", "confirmed"],
];

const cubeMeasureRows = [
  ["EnterpriseKnowledge", "entity_count", "count accepted canonical entities", "COUNT(*)", "count", "available only", "published baseline", "tenant_key, domain"],
  ["ApplicationPortfolio", "application_count", "accepted application count", "COUNT(application_id)", "count", "available only", "published baseline", "tenant_key, hosting_model, criticality"],
  ["ApplicationPortfolio", "critical_application_count", "critical accepted applications", "COUNT WHERE criticality='critical'", "count", "available only", "published baseline", "tenant_key, domain"],
  ["ApplicationPortfolio", "end_of_life_application_count", "applications with lifecycle risk", "COUNT WHERE lifecycle_state='end_of_life'", "count", "null if lifecycle not loaded", "accepted lifecycle source", "tenant_key, owner"],
  ["TechnologyEstate", "legacy_platform_count", "mainframe/private-cloud/legacy estate count", "COUNT WHERE platform_type IN (...)", "count", "available only", "published baseline", "tenant_key, platform_type"],
  ["DataAnalyticsEstate", "data_product_count", "accepted data product count", "COUNT(data_product_id)", "count", "available only", "published data publication", "tenant_key, domain, platform_pattern"],
  ["VendorContractPortfolio", "vendor_concentration_pct", "largest vendor spend / total known spend", "MAX(spend)/SUM(spend)", "percent", "null if spend withheld/not_measured", "accepted contract + metric evidence", "tenant_key, service_tower"],
  ["VendorContractPortfolio", "contract_renewal_exposure", "contracts renewing within window", "COUNT/SUM by renewal window", "count or currency", "null for withheld money", "accepted contract dates", "tenant_key, renewal_quarter"],
  ["ProgramPortfolio", "program_at_risk_count", "programs with red/blocked readiness", "COUNT WHERE status risk", "count", "available only", "published program state", "tenant_key, business_function"],
  ["RiskControlPortfolio", "open_critical_gap_count", "critical evidence gaps still open", "COUNT WHERE severity='critical' AND status='open'", "count", "available only", "published gap register", "tenant_key, domain"],
  ["SourceEvent", "decision_readiness_score", "weighted evidence readiness", "weighted formula from accepted evidence states", "score", "null until Source evidence families loaded", "Source event publication", "tenant_key, event_id, lot_id"],
  ["KnowledgeCoverage", "evidence_coverage_pct", "accepted evidence / required evidence", "accepted_count / required_count", "percent", "0 when required exists and accepted none; null when requirement not applicable", "publication validation", "tenant_key, domain"],
];

const avaPacketRows = [
  ["packet_header", "knowledge_baseline_ref", "required", "Active baseline ID used for answer."],
  ["packet_header", "domain_publication_versions", "required", "Map of enterprise/technology/data/vendor/metric/relationship publications."],
  ["packet_header", "consumption_projection_versions", "required", "Exact view contract versions queried."],
  ["packet_header", "cube_semantic_model_version", "required when metrics queried", "Semantic model version and query hashes."],
  ["tenant_context", "executive_perspective", "optional", "Leadership/interview signals with source basis."],
  ["facts", "accepted_fact_refs", "required", "Only accepted/published facts, never working candidates."],
  ["relationships", "relationship_edges", "optional", "Accepted edges with evidence refs and endpoint validation."],
  ["metrics", "metric_query_hashes", "required when metrics used", "Cube/Postgres reconciled measure query references."],
  ["evidence", "evidence_refs", "required", "Displayable source refs, not hidden truth."],
  ["gaps", "known_gaps", "required", "Missing/withheld/conflicting data surfaced plainly."],
  ["safety", "blocked_sources", "required when any source withheld", "Records exclusion without leaking restricted content."],
];

const moduleMappingRows = [
  ["Home / Knowledge", "consumption.enterprise_brief_v1, consumption.domain_summary_v1, consumption.relationship_*", "No Cube dependency; no legacy Home pack/runtime tables as upstream source", "Canonical-to-screen parity required"],
  ["Intelligence / aVa", "consumption.module_knowledge_packet_v1, Cube measures when aggregating", "No raw source, working candidate, hidden truth, legacy V6/V7 dossier, or old chat/session facts as upstream source", "Packet hash and answer evidence parity required"],
  ["Source", "consumption.vendor_contract_inventory_v1, SourceEvent consumption projections", "Existing Source operational workflow tables may remain for current product only; new pilot facts must not be sourced from them", "Published event facts must match canonical contract/vendor/source-event objects"],
  ["Moves", "consumption.module_knowledge_packet_v1, program/risk/metric projections", "Existing Moves workflow ledgers may remain operational only; new pilot facts must not be sourced from them", "Phase/move facts link to canonical program/decision objects"],
  ["Tower", "consumption.metric_observation_v1, Cube measures, TowerOutcomes consumption projections", "Existing Tower marts may remain operational only; new pilot metrics must not be sourced from them", "Metric parity Postgres = Cube = API = UI"],
  ["Cube", "consumption.* plus published metric definitions", "Never raw/working/evaluator/legacy module tables", "Compile and baseline query reconciliation"],
  ["Superset", "consumption.* later", "No legacy module reporting tables", "Dashboard parity after baseline"],
  ["Observable", "consumption exports/snapshots later", "No legacy module exports as source of truth", "Snapshot content hash parity"],
];

const lineageRows = projectionRows.map((row, idx) => [
  row[3],
  `publication.${row[0].split(".")[1].replace("_v1", "")}_ref`,
  row[0],
  row[1],
  idx < 2 ? "wave_1_enterprise" : idx < 8 ? "domain_wave" : "relationship_or_final_wave",
  "content_hash + key-set parity",
]);

function csvEscape(value) {
  const s = String(value ?? "");
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

async function writeCsv(fileName, headers, rows) {
  const text = [headers, ...rows].map((row) => row.map(csvEscape).join(",")).join("\n") + "\n";
  await fs.writeFile(path.join(outDir, fileName), text, "utf8");
}

function columnLetter(index) {
  let s = "";
  let n = index + 1;
  while (n > 0) {
    const r = (n - 1) % 26;
    s = String.fromCharCode(65 + r) + s;
    n = Math.floor((n - 1) / 26);
  }
  return s;
}

async function writeWorkbook(fileName, sheetName, headers, rows, title) {
  const workbook = Workbook.create();
  const sheet = workbook.worksheets.add(sheetName);
  sheet.showGridLines = false;
  const width = headers.length;
  const last = columnLetter(width - 1);
  sheet.getRange(`A1:${last}1`).merge();
  sheet.getRange("A1").values = [[title]];
  sheet.getRange("A1").format.font = { bold: true, size: 16, color: "#0F172A" };
  sheet.getRange(`A3:${last}${rows.length + 3}`).values = [headers, ...rows];
  const headerRange = sheet.getRange(`A3:${last}3`);
  headerRange.format.fill = { color: "#EAF2FF" };
  headerRange.format.font = { bold: true, color: "#0F172A" };
  headerRange.format.borders = { preset: "outside", style: "thin", color: "#CBD5E1" };
  const used = sheet.getRange(`A3:${last}${rows.length + 3}`);
  used.format.wrapText = true;
  used.format.borders = { preset: "inside", style: "thin", color: "#E2E8F0" };
  used.format.autofitColumns();
  used.format.autofitRows();
  for (let i = 0; i < width; i += 1) {
    sheet.getRange(`${columnLetter(i)}:${columnLetter(i)}`).format.columnWidth = i < 2 ? 28 : 34;
  }
  sheet.freezePanes.freezeRows(3);
  const table = sheet.tables.add(`A3:${last}${rows.length + 3}`, true, sheetName.replace(/[^A-Za-z0-9]/g, "") + "Table");
  table.showFilterButton = true;
  table.showBandedRows = true;
  const inspect = await workbook.inspect({ kind: "sheet,table", maxChars: 1600, tableMaxRows: 3, tableMaxCols: Math.min(width, 8) });
  await fs.writeFile(path.join(validationDir, fileName.replace(/\.xlsx$/, ".inspect.ndjson")), inspect.ndjson, "utf8");
  const preview = await workbook.render({ sheetName, range: `A1:${last}${Math.min(rows.length + 3, 16)}`, scale: 1 });
  await fs.writeFile(path.join(validationDir, fileName.replace(/\.xlsx$/, ".png")), new Uint8Array(await preview.arrayBuffer()));
  const output = await SpreadsheetFile.exportXlsx(workbook);
  await output.save(path.join(outDir, fileName));
}

function sqlDdl() {
  return `-- Phase 3C-2D Consumption Contracts, Read Models and Semantic-Layer Certification
-- Status: contract DDL artifact only. This file is NOT a migration and is not applied by CI.
-- Purpose: define the stable consumption layer every tenant load wave must build and reconcile.

BEGIN;

CREATE SCHEMA IF NOT EXISTS consumption;

CREATE TABLE IF NOT EXISTS consumption.projection_registry (
  projection_name TEXT PRIMARY KEY,
  projection_contract_version TEXT NOT NULL,
  consumer_modules TEXT[] NOT NULL,
  source_publication TEXT NOT NULL,
  required_for_baseline BOOLEAN NOT NULL DEFAULT true,
  partial_data_behavior TEXT NOT NULL,
  owner TEXT NOT NULL DEFAULT 'knowledge-platform',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS consumption.baseline_activation (
  tenant_key TEXT NOT NULL,
  knowledge_baseline_ref TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('candidate', 'active', 'inactive', 'failed', 'rolled_back')),
  activated_at TIMESTAMPTZ,
  previous_baseline_ref TEXT,
  activation_content_hash TEXT NOT NULL,
  validation_report_uri TEXT,
  PRIMARY KEY (tenant_key, knowledge_baseline_ref)
);

CREATE TABLE IF NOT EXISTS consumption.refresh_run (
  refresh_run_id TEXT PRIMARY KEY,
  tenant_key TEXT NOT NULL,
  knowledge_baseline_ref TEXT NOT NULL,
  domain_publication_ref TEXT,
  projection_name TEXT NOT NULL REFERENCES consumption.projection_registry(projection_name),
  status TEXT NOT NULL CHECK (status IN ('planned', 'running', 'pass', 'fail', 'skipped')),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  input_hash TEXT,
  output_hash TEXT,
  failure_code TEXT,
  failure_detail TEXT
);

CREATE TABLE IF NOT EXISTS consumption.consumer_reconciliation_ledger (
  ledger_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_key TEXT NOT NULL,
  knowledge_baseline_ref TEXT NOT NULL,
  measure_or_view TEXT NOT NULL,
  canonical_value TEXT,
  publication_value TEXT,
  consumption_value TEXT,
  cube_value TEXT,
  api_value TEXT,
  ui_value TEXT,
  key_set_hash TEXT,
  status TEXT NOT NULL CHECK (status IN ('pass', 'fail', 'not_applicable', 'not_measured')),
  checked_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- View contracts below are intentionally conservative. Final implementations may
-- replace the body, but may not remove required metadata columns.
${projectionRows.map((row) => {
  const name = row[0];
  const specific = name.includes("metric_observation")
    ? `,\n  NULL::text AS metric_id,\n  NULL::date AS period_start,\n  NULL::date AS period_end,\n  NULL::numeric AS metric_value,\n  NULL::text AS unit`
    : name.includes("relationship_edge")
      ? `,\n  NULL::text AS edge_id,\n  NULL::text AS from_node_id,\n  NULL::text AS to_node_id,\n  NULL::text AS relationship_type`
      : name.includes("relationship_node")
        ? `,\n  NULL::text AS node_id,\n  NULL::text AS node_type,\n  NULL::text AS label`
        : `,\n  NULL::text AS object_id,\n  NULL::text AS display_name,\n  NULL::jsonb AS payload`;
  return `CREATE OR REPLACE VIEW ${name} AS
SELECT
  NULL::text AS tenant_key,
  NULL::text AS knowledge_baseline_ref,
  NULL::text AS domain_publication_ref,
  '${VERSION}'::text AS projection_contract_version,
  NULL::date AS as_of_date,
  NULL::text AS authority_state,
  NULL::text AS freshness_state,
  NULL::text AS availability_state,
  NULL::numeric AS evidence_coverage,
  NULL::text AS content_hash${specific}
WHERE false;`;
}).join("\n\n")}

COMMIT;
`;
}

function dependencyGraph() {
  return {
    version: VERSION,
    generated: GENERATED,
    status: "contract_only_no_runtime_mutation",
    nodes: [
      "raw_sources",
      "evidence",
      "working_candidates",
      "accepted_canonical_knowledge",
      "immutable_domain_publication",
      "active_knowledge_baseline",
      ...projectionRows.map((r) => r[0]),
      "cube_semantic_validation",
      "ava_packet_validation",
      "consumer_parity_tests",
      "atomic_baseline_activation",
    ],
    edges: [
      ["raw_sources", "evidence"],
      ["evidence", "working_candidates"],
      ["working_candidates", "accepted_canonical_knowledge"],
      ["accepted_canonical_knowledge", "immutable_domain_publication"],
      ["immutable_domain_publication", "active_knowledge_baseline"],
      ...projectionRows.map((r) => ["active_knowledge_baseline", r[0]]),
      ["consumption.metric_observation_v1", "cube_semantic_validation"],
      ["consumption.module_knowledge_packet_v1", "ava_packet_validation"],
      ["cube_semantic_validation", "consumer_parity_tests"],
      ["ava_packet_validation", "consumer_parity_tests"],
      ["consumer_parity_tests", "atomic_baseline_activation"],
    ],
    failureBehavior: {
      onProjectionFailure: "new publication remains inactive; previous active baseline and read models remain live",
      onCubeFailure: "core Home consumption stays available; semantic dashboard metrics remain on last-known-good snapshot",
      onAvaPacketFailure: "module packet is not activated; prior packet remains active",
    },
  };
}

function registryJson() {
  return {
    version: VERSION,
    generated: GENERATED,
    status: "contract_only_no_runtime_mutation",
    projections: projectionRows.map((r) => ({
      projection_name: r[0],
      consumers: r[1].split(",").map((s) => s.trim()),
      purpose: r[2],
      source_publication: r[3],
      build_gate: r[4],
      partial_data_behavior: r[5],
      key_fields: r[6].split(",").map((s) => s.trim()),
      required_metadata: [
        "tenant_key",
        "knowledge_baseline_ref",
        "domain_publication_ref",
        "projection_contract_version",
        "as_of_date",
        "authority_state",
        "freshness_state",
        "availability_state",
        "evidence_coverage",
        "content_hash",
      ],
    })),
  };
}

async function writeTextArtifacts() {
  await fs.writeFile(path.join(outDir, "README.md"), `# Phase 3C-2D Consumption Contracts, Read Models and Semantic-Layer Certification

Status: plan and contract package only. No Azure apply, PostgreSQL migration, source landing, parser job, publication job, product wiring or runtime deployment is included.

This package makes consumption readiness a first-class output before Airline Demo New or Healthcare Demo New lands source files. It defines the shared path:

Raw sources -> Evidence -> Working candidates -> Accepted canonical Knowledge and metrics -> Immutable domain publication -> Active Knowledge Baseline -> Versioned consumption projections -> Home, Nexus APIs, Cube, aVa packets, Superset and Observable.

Home must not depend on Cube to render. Home and Cube consume the same governed PostgreSQL publication and consumption layer.

## Legacy isolation rule

The new client pilot data plane must not be built from or depend on old module-owned tables, V6/V7 demo packs, legacy Home packs, current Source operational tables, current Moves workflow tables, current Tower marts, old chat/session facts, hidden truth, evaluator artifacts, or any existing module runtime layer.

Those existing tables may be inspected only as migration/audit inputs. They may not become upstream sources for the new canonical Knowledge, publication, consumption, Cube, Home, aVa, Source, Moves or Tower read path. Any retained operational module table must link to the new canonical/publication layer through an explicit identity map and reconciliation proof before its facts are consumer-visible in the new pilot.
`, "utf8");

  await fs.writeFile(path.join(outDir, "HOME_KNOWLEDGE_READ_MODEL_DDL.sql"), sqlDdl(), "utf8");
  await fs.writeFile(path.join(outDir, "CONSUMPTION_PROJECTION_REGISTRY.json"), JSON.stringify(registryJson(), null, 2) + "\n", "utf8");
  await fs.writeFile(path.join(outDir, "CONSUMPTION_REFRESH_DEPENDENCY_GRAPH.json"), JSON.stringify(dependencyGraph(), null, 2) + "\n", "utf8");

  await fs.writeFile(path.join(outDir, "CUBE_SEMANTIC_MODEL_CONTRACT.md"), `# Cube Semantic Model Contract

Status: contract only. Cube must sit on \`consumption.*\` views and published metric definitions. It must never query raw sources, working candidates, restricted evaluator data, hidden truth, unpublished facts, legacy module tables, old Home packs, old V6/V7 demo packs, current Tower marts, current Source operational tables or current Moves workflow tables.

## Initial domains

EnterpriseKnowledge, ApplicationPortfolio, TechnologyEstate, DataAnalyticsEstate, VendorContractPortfolio, ProgramPortfolio, RiskControlPortfolio, SourceEvent, TowerOutcomes and KnowledgeCoverage.

## Measure requirements

Every measure must declare definition, owner, SQL source, dimensions, numerator/denominator, null behavior, unit, effective period, publication version, authority minimum and evidence/readiness requirements.

## Tenant isolation

The semantic model package may be shared. Data-source configuration, credentials and network route must be tenant-bound and fail closed. Real client private planes should use a per-client semantic service unless a future approval explicitly permits another isolation model.
`, "utf8");

  await fs.writeFile(path.join(outDir, "PARTIAL_DATA_AND_EMPTY_STATE_CONTRACT.md"), `# Partial Data and Empty-State Contract

Missing data is a normal operating condition. Consumers must preserve the difference between unavailable, withheld, not measured, candidate and accepted data.

## Allowed availability states

${availabilityStates.map((s) => `- \`${s}\``).join("\n")}

## Non-negotiable conversions

- \`missing\` must not become \`0\`.
- \`withheld\` must not become \`0\`.
- \`not_measured\` must not become \`0\`.
- \`candidate\` must not become \`accepted\`.
- \`target_state\` must not become \`current_state\`.

For metrics with unavailable source data, return \`value: null\`, \`availability_state: not_measured\` and a human explanation. Home should say the underlying source has not been provided or confirmed.
`, "utf8");

  await fs.writeFile(path.join(outDir, "CONSUMPTION_RECONCILIATION_TEST_PLAN.md"), `# Consumption Reconciliation Test Plan

Reconciliation does not stop at canonical row counts. Every major count, metric, list and graph must be certified through the full path.

Canonical SQL value = Publication value = Consumption-view value = Cube value = API value = Home/Nexus displayed value.

For lists and graphs, use key-set hashes and content hashes rather than counts alone.

## Required ledgers

| Tenant | Baseline | Measure/view | Canonical | Publication | Consumption | Cube | API | UI | Status |
|---|---|---|---:|---:|---:|---:|---:|---:|---|
| airline-demo-new | AIRDN-KB-001 | Applications | TBD | TBD | TBD | TBD | TBD | TBD | pending |
| airline-demo-new | AIRDN-KB-001 | Active contracts | TBD | TBD | TBD | TBD | TBD | TBD | pending |
| healthcare-demo-new | HCDN-KB-001 | Epic modules | TBD | TBD | TBD | TBD | TBD | TBD | pending |

## Wave rule

Every load wave must build and validate the projections it unlocks immediately. Do not wait until final load to discover a consumption contract mismatch.
`, "utf8");

  await fs.writeFile(path.join(outDir, "LAST_KNOWN_GOOD_AND_ROLLBACK_CONTRACT.md"), `# Last-Known-Good and Rollback Contract

Baseline activation is atomic. If a downstream projection, Cube validation, aVa packet validation or consumer parity test fails, the new publication remains inactive.

## Failure behavior

- Previous active Knowledge Baseline remains live.
- Previous Home read models remain live.
- Previous Cube semantic snapshot remains live.
- Previous aVa packet remains live.
- Failure is written to \`consumption.refresh_run\` with failure code and input/output hashes.

## Rollback point

Rollback is a pointer change to the prior active baseline, not a destructive data rewrite.
`, "utf8");

  await fs.writeFile(path.join(outDir, "POSTGRES_AGE_EVALUATION_PLAN.md"), `# PostgreSQL AGE Evaluation Plan

Status: evaluation contract only. Apache AGE is not required for the first Airline Demo New or Healthcare Demo New Knowledge Baseline.

## Decision

Keep Azure PostgreSQL relational graph tables as the canonical graph substrate. Evaluate Apache AGE only as a read-side acceleration layer if measured traversal needs exceed what indexed relational SQL and recursive CTEs can support cleanly.

AGE must never become the source of truth for tenant facts, relationship evidence, metric values, source lineage, publication state, or product authorization. If adopted later, AGE consumes an approved projection from \`consumption.relationship_node_v1\`, \`consumption.relationship_edge_v1\`, and \`consumption.relationship_evidence_v1\`.

## Why this is not P0

The immediate product risk is graph semantics and consumption certification, not graph-engine capacity:

- relationship endpoints must resolve to canonical objects;
- relationship types must be normalized;
- evidence and owner coverage must be visible;
- cross-tenant edges must be blocked;
- stale, candidate, withheld, not-measured and conflicting states must survive to Home, Cube and aVa.

Adding AGE before those gates pass would make weak or synthetic relationships easier to traverse and harder to govern.

## Current scale assumption

The expected first synthetic enterprise baselines are within relational Postgres territory:

- Healthcare Demo New: roughly tens of thousands of relationship edges after validation.
- Airline Demo New target: roughly tens of thousands of relationship edges after remediation.
- A real 50B+ enterprise pilot may reach hundreds of thousands to low millions of edges after applications, integrations, data products, contracts, processes, controls and owners are loaded.

These volumes do not by themselves justify AGE. The deciding factor is traversal shape and latency, not row count.

## Candidate AGE use cases

Evaluate AGE when users need repeated, variable-depth traversals such as:

- blast radius: system -> integration -> data product -> process -> owner -> control;
- AI use case dependency path: use case -> process -> data product -> source system -> platform -> vendor -> contract;
- vendor concentration: vendor -> contracts -> applications -> functions -> risks -> outcomes;
- lineage chains across application, database, BI, metric and executive decision objects;
- shortest paths between a transformation program and blocked evidence or ownership gaps.

AGE is not needed for one-hop adjacency, filtered relationship maps, Home dimension summaries, Cube metrics, or deterministic top-N dependency cards.

## Evaluation thresholds

Run the AGE proof only if at least one threshold is breached on the relational path:

| Gate | Threshold |
|---|---|
| p95 traversal latency | Greater than 750 ms for approved 2-4 hop paths with tenant filter and warm cache |
| query complexity | Recursive SQL becomes too fragile to maintain across three or more product consumers |
| result size | More than 5,000 candidate paths require server-side graph pruning before UI/API consumption |
| workload isolation | Graph traversal load materially impacts baseline Home/API/Cube response budgets |
| graph algorithms | shortest path, path expansion or centrality becomes a product requirement rather than an analyst-only audit |

## Azure readiness checks

Before any AGE implementation PR, prove:

- the target Azure Database for PostgreSQL Flexible Server version supports AGE in the selected region;
- \`azure.extensions\` and \`shared_preload_libraries\` can enable AGE without replacing the database version;
- extension creation is permitted under the managed identity / admin model;
- backup, restore, point-in-time recovery and failover are tested with AGE enabled;
- RLS and tenant isolation remain enforced before data reaches AGE projection queries;
- the extension is supported in the private client data-plane SKU, not only the shared lab server.

## Shadow projection approach

If adopted, use this order:

1. Keep canonical nodes and edges in relational Knowledge / consumption tables.
2. Add an inactive \`graph_projection.age_graph_snapshot_v1\` manifest with baseline refs and content hashes.
3. Project only accepted, tenant-scoped, source-backed graph slices into AGE.
4. Compare AGE traversal output with relational traversal output for the same query pack.
5. Activate only read-side APIs whose answers are parity-proven and faster.
6. Keep last-known-good relational traversal available as fallback.

## Certification query pack

The first AGE proof must compare relational SQL vs AGE for:

- 25 two-hop dependency questions;
- 25 three-to-four-hop dependency questions;
- 10 sparse/missing relationship questions;
- 10 cross-tenant negative tests;
- 10 stale/superseded relationship tests;
- 10 large-result pruning tests.

Acceptance requires same business answer, same tenant fence, same evidence boundary, and same availability-state handling. Faster traversal alone is not acceptance.
`, "utf8");

  await writeCsv("PUBLICATION_TO_READ_MODEL_LINEAGE.csv", ["source_publication", "publication_ref_field", "read_model", "consumer", "first_wave", "reconciliation_method"], lineageRows);
}

async function writeReleaseRecord() {
  const release = `# 2026-07-27-knowledge-consumption-3c2d-contracts — Consumption Readiness Contracts

## Release ID

\`2026-07-27-knowledge-consumption-3c2d-contracts\`

## Status

\`draft contract package - no execution\`

## Plain-English Summary

Adds a tenant-neutral Phase 3C-2D consumption contract package so future Airline Demo New and Healthcare Demo New source loads produce stable Home/Knowledge read models, module packets, Cube semantic metrics and reconciliation proof as first-class load-wave outputs.

## Layer Impact

- Release lane: \`client-data-lane\` (contract only; no data-plane mutation).
- Client intake: none.
- Source adapters: no adapter mutation; downstream consumption expectations are documented.
- Canonical model: no schema migration; defines publication-to-consumption contracts.
- Products: no runtime wiring; defines the views and parity checks products must consume later.

## Client Applicability

- All clients: reusable consumption/read-model contract.
- Synthetic tenants: Airline Demo New and Healthcare Demo New are the first planned consumers.
- Real client private planes: applies as the target pattern, with client-isolated data sources.

## Changes Included

- Adds \`clients/shared/20-phase3c2d-consumption-contracts/\` with read-model DDL artifact, projection registry, dependency graph, Cube contract, aVa packet mapping, module mapping, partial-data contract, reconciliation plan and rollback contract.
- Adds reproducible generator \`scripts/knowledge/build-phase3c2d-consumption-contracts.mjs\`.

## QA / Validation

- pass — generated all required package artifacts from the checked-in builder.
- pass — rendered spreadsheet previews for each workbook into the package validation folder.
- not-run — PostgreSQL migration, Azure apply, source landing, Cube deploy, API wiring and signed-in product proof are intentionally out of scope.
- The DDL is intentionally stored as a contract artifact, not a Supabase migration.

## Rollout Plan

Merge only after review. Do not run Azure apply, database migration, source landing, parser jobs, publication jobs, Cube deploys or product wiring from this PR.

## Deployment Authority

No deploy. No ACA/runtime mutation.

## Rollback Plan

Revert this documentation/contract package. No runtime or data-plane rollback is needed.

## Audit Evidence

- Package root: \`clients/shared/20-phase3c2d-consumption-contracts/\`.
- Validation summary: \`clients/shared/20-phase3c2d-consumption-contracts/validation/VALIDATION_SUMMARY.json\`.

## Known Gaps

This does not implement live views, Cube models, API wiring, Home wiring, aVa packet construction, Superset or Observable. Those must be implemented only after this contract is approved and before any tenant is declared complete.

This also does not authorize any old module table or legacy dataset to become an upstream source for the new pilot data plane. Existing module tables may be retained for current product operation or audited for migration planning, but the new client baseline must be sourced through intake, source adapters, canonical Knowledge, publication and consumption only.
`;
  await fs.writeFile(path.join(repoRoot, "docs/releases/records/2026-07-27-knowledge-consumption-3c2d-contracts.md"), release, "utf8");
}

async function writeValidationSummary() {
  const files = [];
  async function walk(dir) {
    for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
      const p = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (entry.name === "validation") continue;
        await walk(p);
      } else {
        const rel = path.relative(outDir, p);
        const bytes = await fs.readFile(p);
        files.push({ path: rel, bytes: bytes.length, sha256: crypto.createHash("sha256").update(bytes).digest("hex") });
      }
    }
  }
  await walk(outDir);
  const required = [
    "CONSUMPTION_OBJECT_AND_FIELD_CONTRACT.xlsx",
    "CANONICAL_TO_PUBLICATION_MAPPING.xlsx",
    "PUBLICATION_TO_READ_MODEL_LINEAGE.xlsx",
    "HOME_KNOWLEDGE_READ_MODEL_DDL.sql",
    "CONSUMPTION_PROJECTION_REGISTRY.json",
    "CONSUMPTION_REFRESH_DEPENDENCY_GRAPH.json",
    "CUBE_SEMANTIC_MODEL_CONTRACT.md",
    "CUBE_MEASURE_AND_DIMENSION_CATALOG.xlsx",
    "AVA_KNOWLEDGE_PACKET_MAPPING.xlsx",
    "MODULE_CONSUMPTION_MAPPING.xlsx",
    "PARTIAL_DATA_AND_EMPTY_STATE_CONTRACT.md",
    "CONSUMPTION_RECONCILIATION_TEST_PLAN.md",
    "LAST_KNOWN_GOOD_AND_ROLLBACK_CONTRACT.md",
    "POSTGRES_AGE_EVALUATION_PLAN.md",
  ];
  const present = new Set(files.map((f) => f.path));
  const missing = required.filter((f) => !present.has(f));
  const registry = JSON.parse(await fs.readFile(path.join(outDir, "CONSUMPTION_PROJECTION_REGISTRY.json"), "utf8"));
  const summary = {
    package: "phase3c2d-consumption-contracts",
    version: VERSION,
    generated: GENERATED,
    status: missing.length ? "fail" : "pass",
    executionBoundary: "No Azure apply, PostgreSQL migration, source landing, parser run, publication run, Cube deploy, product wiring or runtime deployment.",
    requiredFiles: required.length,
    missingRequiredFiles: missing,
    projectionCount: registry.projections.length,
    availabilityStates,
    files,
  };
  await fs.writeFile(path.join(validationDir, "VALIDATION_SUMMARY.json"), JSON.stringify(summary, null, 2) + "\n", "utf8");
}

async function main() {
  await fs.mkdir(outDir, { recursive: true });
  await fs.mkdir(validationDir, { recursive: true });
  await writeTextArtifacts();
  await writeWorkbook("CONSUMPTION_OBJECT_AND_FIELD_CONTRACT.xlsx", "Object Fields", ["object_family", "field_name", "data_type", "requirement", "projection", "guidance"], objectFieldRows, "Phase 3C-2D Consumption Object and Field Contract");
  await writeWorkbook("CANONICAL_TO_PUBLICATION_MAPPING.xlsx", "Canonical Mapping", ["canonical_source", "domain_publication", "read_model", "consumers", "business_purpose", "mapping_confidence"], canonicalMappingRows, "Canonical to Publication Mapping");
  await writeWorkbook("PUBLICATION_TO_READ_MODEL_LINEAGE.xlsx", "Lineage", ["source_publication", "publication_ref_field", "read_model", "consumer", "first_wave", "reconciliation_method"], lineageRows, "Publication to Read Model Lineage");
  await writeWorkbook("CUBE_MEASURE_AND_DIMENSION_CATALOG.xlsx", "Cube Measures", ["cube_domain", "measure_name", "definition", "sql_source_rule", "unit", "null_behavior", "authority_minimum", "dimensions"], cubeMeasureRows, "Cube Measure and Dimension Catalog");
  await writeWorkbook("AVA_KNOWLEDGE_PACKET_MAPPING.xlsx", "aVa Packet", ["packet_section", "field", "requirement", "purpose"], avaPacketRows, "aVa Knowledge Packet Mapping");
  await writeWorkbook("MODULE_CONSUMPTION_MAPPING.xlsx", "Module Mapping", ["consumer", "allowed_sources", "denied_sources", "certification_required"], moduleMappingRows, "Module Consumption Mapping");
  await writeReleaseRecord();
  await writeValidationSummary();
  console.log(`Wrote ${path.relative(repoRoot, outDir)}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
