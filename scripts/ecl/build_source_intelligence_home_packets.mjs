#!/usr/bin/env node

import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const CONTRACT_VERSION = "source-intelligence-home-page-packets/v1";
const DEFAULT_SOURCE_DIR = path.join("outputs", "source-intelligence", "meridian-health", "model-pass");
const DEFAULT_OUT_DIR = path.join("outputs", "source-intelligence", "meridian-health", "home-page-packets");
const DEFAULT_INVENTORY_DIR = "";
const DEFAULT_SEGMENT_SPINE_REPORT = "";
const PAGE_DEFS = [
  {
    page_key: "executive_brief",
    title: "Executive Brief",
    question: "What should a first-meeting executive understand about this enterprise?",
    writer_lens: "McKinsey-style business strategy partner",
    canvases: ["boardroom_thesis", "enterprise_profile", "priority_agenda", "evidence_basis"],
    tables: ["executive_fact_base", "priority_and_value_summary", "leadership_theme_extracts"],
    charts: ["business_model_mix", "investment_value_bridge", "risk_value_attention_matrix"],
    drilldowns: ["source-family evidence drawer", "claim citations", "interview excerpts"],
    priority_families: [
      "enterprise_profile",
      "business_segments",
      "business_functions",
      "organization_ownership",
      "programs_initiatives",
      "budget_spend_value",
      "metrics_outcomes",
      "ai_value_interviews",
    ],
  },
  {
    page_key: "our_business",
    title: "Our Business",
    question: "How does the enterprise create value and who does it serve?",
    writer_lens: "CEO and operating-model adviser",
    canvases: ["business_model", "segment_economics", "operating_accountability"],
    tables: ["line_of_business_profile", "business_function_register", "ownership_summary"],
    charts: ["revenue_mix", "function_footprint", "segment_kpi_comparison"],
    drilldowns: ["business segment detail", "function ownership detail", "source rows"],
    priority_families: ["enterprise_profile", "business_segments", "business_functions", "organization_ownership", "metrics_outcomes"],
  },
  {
    page_key: "strategy_value_creation",
    title: "Strategy & Value Creation",
    question: "Where is the enterprise trying to go, what bets are funded, and what value is at stake?",
    writer_lens: "business-strategy and value-creation adviser",
    canvases: ["strategy_agenda", "funded_bets", "value_at_stake", "execution_risks"],
    tables: ["program_portfolio", "benefit_claims", "kpi_outcome_links"],
    charts: ["investment_by_priority", "benefit_realization_funnel", "program_value_risk_matrix"],
    drilldowns: ["program detail", "benefit evidence", "deferred strategy evidence"],
    priority_families: ["programs_initiatives", "budget_spend_value", "metrics_outcomes", "ai_benefits_realization", "ai_kpi_outcomes"],
  },
  {
    page_key: "how_we_operate",
    title: "How We Operate",
    question: "How does work move through the operating model, and where are accountabilities clear or weak?",
    writer_lens: "COO and operating process adviser",
    canvases: ["operating_model_map", "accountability_spine", "process_evidence", "workflow_friction"],
    tables: ["org_ownership_matrix", "process_evidence_register", "workforce_role_summary"],
    charts: ["decision_rights_by_function", "process_maturity_distribution", "ownership_gap_heatmap"],
    drilldowns: ["org unit", "process", "role", "relationship edge"],
    priority_families: ["business_functions", "organization_ownership", "workforce_roles", "operational_process_evidence", "relationships"],
  },
  {
    page_key: "technology_data",
    title: "Technology & Data",
    question: "What technology and data estate underpins the operating model?",
    writer_lens: "expert technologist and enterprise architect",
    canvases: ["technology_estate_overview", "data_platform_stack", "integration_landscape", "AI_usage_context"],
    tables: ["application_portfolio", "data_asset_register", "platform_maturity", "AI_tool_usage"],
    charts: ["apps_by_function", "hosting_mix", "data_assets_by_domain", "reporting_and_etl_volume"],
    drilldowns: ["application", "data asset", "platform", "integration", "AI usage row"],
    priority_families: [
      "applications",
      "data_assets_integrations",
      "infrastructure_hosting",
      "data_analytics_platform_maturity",
      "relationships",
      "ai_tool_usage",
      "m365_copilot_usage",
    ],
  },
  {
    page_key: "performance_value",
    title: "Performance & Value",
    question: "What performance, spend, value, and outcome signals should leadership act on?",
    writer_lens: "CFO and value-realization adviser",
    canvases: ["performance_snapshot", "spend_value_bridge", "outcome_evidence", "blocked_value"],
    tables: ["budget_spend_register", "metric_outcome_register", "benefit_realization_ledger"],
    charts: ["spend_by_category", "benefit_by_program", "outcome_trend", "attestation_gap"],
    drilldowns: ["metric", "budget line", "benefit claim", "evidence source"],
    priority_families: ["budget_spend_value", "metrics_outcomes", "programs_initiatives", "ai_benefits_realization", "ai_kpi_outcomes"],
  },
  {
    page_key: "leadership_perspective",
    title: "Leadership Perspective",
    question: "What do leaders and directors say is working, blocked, risky, or strategically important?",
    writer_lens: "executive interview synthesis lead",
    canvases: ["executive_themes", "director_tactical_signals", "strategy_alignment", "AI_ambition"],
    tables: ["interview_excerpt_register", "theme_by_function", "leader_priority_map"],
    charts: ["theme_frequency", "sentiment_by_function", "priority_alignment_matrix"],
    drilldowns: ["interview excerpt", "speaker role", "theme evidence", "do-not-claim boundary"],
    priority_families: ["ai_value_interviews", "organization_ownership", "expert_lenses", "risks_controls", "programs_initiatives"],
  },
  {
    page_key: "what_needs_attention",
    title: "What Needs Attention",
    question: "What needs executive attention now, and what evidence says so?",
    writer_lens: "board-risk and management-agenda adviser",
    canvases: ["management_agenda", "risk_exposure", "commercial_leverage", "evidence_gaps"],
    tables: ["risk_control_register", "attention_item_queue", "evidence_gap_register"],
    charts: ["risk_by_domain", "value_at_risk", "vendor_and_platform_exposure"],
    drilldowns: ["risk", "control", "contract", "evidence request"],
    priority_families: ["risks_controls", "programs_initiatives", "budget_spend_value", "vendors_contracts", "evidence_sources", "relationships"],
  },
  {
    page_key: "current_state_architecture",
    title: "Current-State Architecture",
    question: "Which system blocks support provider, plan, shared-services, data, and infrastructure work?",
    writer_lens: "expert technologist and enterprise architecture cartographer",
    canvases: ["conceptual_blocks", "logical_system_map", "physical_deployment_map", "ownership_overlay"],
    tables: ["application_register", "platform_register", "system_to_function_mapping", "vendor_to_system_mapping"],
    charts: ["domain_block_footprint", "hosting_by_block", "criticality_by_block", "lifecycle_by_block"],
    drilldowns: ["conceptual block", "logical system", "deployment", "owner", "vendor"],
    priority_families: ["applications", "infrastructure_hosting", "data_assets_integrations", "relationships", "organization_ownership", "vendors_contracts"],
  },
  {
    page_key: "current_state_data_flow",
    title: "Current-State Data Flow",
    question: "How does data move from sources through integration, platforms, marts, analytics, and consumption?",
    writer_lens: "data architecture, BI, ETL, and AI platform architect",
    canvases: ["conceptual_data_zones", "logical_flow_map", "physical_platform_map", "consumption_layer"],
    tables: ["data_asset_register", "integration_flow_register", "reporting_tool_summary", "etl_volume_summary"],
    charts: ["source_to_consumption_flow", "assets_by_zone", "reporting_by_tool", "ETL_jobs_by_function"],
    drilldowns: ["source", "integration", "warehouse or mart", "reporting surface", "analytics workload"],
    priority_families: ["data_assets_integrations", "data_analytics_platform_maturity", "relationships", "infrastructure_hosting", "applications"],
  },
  {
    page_key: "what_has_been_loaded",
    title: "What Has Been Loaded",
    question: "What source families, rows, evidence types, and gaps are present in the governed record?",
    writer_lens: "evidence and provenance steward",
    canvases: ["loaded_source_inventory", "coverage_gaps", "evidence_quality", "lineage_readiness"],
    tables: ["source_file_inventory", "field_coverage", "known_gap_register", "evidence_basis"],
    charts: ["rows_by_family", "fill_rate_by_source", "coverage_by_product_surface"],
    drilldowns: ["source file", "column", "row sample", "mapping state"],
    priority_families: [],
    include_all: true,
  },
  {
    page_key: "browse_the_record",
    title: "Browse The Record",
    question: "Which source files can be sliced, filtered, and inspected with lineage?",
    writer_lens: "source record analyst",
    canvases: ["dataset_browser", "dimension_filters", "column_presets", "row_lineage_drawer"],
    tables: ["all_source_files", "selected_dataset_rows", "column_dictionary", "lineage_trace"],
    charts: ["dataset_row_counts", "dimension_distribution", "missingness_by_column"],
    drilldowns: ["dataset", "row", "column", "source hash"],
    priority_families: [],
    include_all: true,
  },
  {
    page_key: "applications_systems",
    title: "Applications & Systems",
    question: "What systems exist, who owns them, how are they hosted, and what do they support?",
    writer_lens: "enterprise application portfolio architect",
    canvases: ["application_register", "portfolio_slices", "ownership_hosting_matrix", "dependency_context"],
    tables: ["application_inventory", "deployment_inventory", "owner_mapping", "application_relationships"],
    charts: ["applications_by_function", "hosting_model_mix", "criticality_distribution", "lifecycle_watch"],
    drilldowns: ["application", "deployment", "owner", "hosting platform", "contract scope"],
    priority_families: ["applications", "organization_ownership", "infrastructure_hosting", "vendors_contracts", "relationships"],
  },
  {
    page_key: "vendor_contracts",
    title: "Vendor Contracts",
    question: "Which vendors and contracts shape cost, risk, renewal leverage, and sourced value?",
    writer_lens: "commercial sourcing and contracts adviser",
    canvases: ["vendor_portfolio", "contract_360", "renewal_leverage", "commercial_value"],
    tables: ["vendor_register", "contract_register", "managed_services_scope", "renewal_and_terms_summary"],
    charts: ["spend_by_vendor", "contract_value_concentration", "renewal_timeline", "leverage_score"],
    drilldowns: ["vendor", "contract", "clause evidence", "application scope"],
    priority_families: ["vendors_contracts", "managed_services_scope", "budget_spend_value", "evidence_sources", "relationships"],
  },
  {
    page_key: "infrastructure_platforms",
    title: "Infrastructure & Platforms",
    question: "What hosting, platform, resilience, lifecycle, and dependency facts matter?",
    writer_lens: "CTO and infrastructure architect",
    canvases: ["platform_landscape", "hosting_topology", "resilience_posture", "lifecycle_risk"],
    tables: ["platform_inventory", "hosting_relationships", "support_end_dates", "resilience_signals"],
    charts: ["platforms_by_type", "hosting_mix", "EOL_exposure", "critical_dependencies"],
    drilldowns: ["platform", "deployment", "support lifecycle", "risk/control"],
    priority_families: ["infrastructure_hosting", "applications", "relationships", "risks_controls", "data_analytics_platform_maturity"],
  },
  {
    page_key: "data_assets_integrations",
    title: "Data Assets & Integrations",
    question: "What data assets, integrations, reporting technologies, ETL volumes, users, and analytics workloads exist?",
    writer_lens: "data, analytics, BI, ETL, and AI platform architect",
    canvases: ["data_estate_browser", "integration_map", "reporting_consumption", "advanced_analytics_workloads"],
    tables: ["data_asset_inventory", "integration_inventory", "reporting_tool_inventory", "etl_and_script_volume_summary"],
    charts: ["data_assets_by_function", "ETL_jobs_by_mart", "reports_by_tool", "users_by_consumption_layer"],
    drilldowns: ["data asset", "mart", "report", "ETL/script count", "analytics workload"],
    priority_families: ["data_assets_integrations", "data_analytics_platform_maturity", "ai_tool_usage", "m365_copilot_usage", "relationships"],
  },
];

function parseArgs(argv) {
  const args = {
    sourceDir: DEFAULT_SOURCE_DIR,
    inventoryDir: DEFAULT_INVENTORY_DIR,
    segmentSpineReport: DEFAULT_SEGMENT_SPINE_REPORT,
    outDir: DEFAULT_OUT_DIR,
    maxArtifactsPerPage: 12,
  };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    const next = () => {
      i += 1;
      if (i >= argv.length) throw new Error(`${arg} requires a value`);
      return argv[i];
    };
    if (arg === "--source-dir") args.sourceDir = next();
    else if (arg === "--inventory-dir") args.inventoryDir = next();
    else if (arg === "--segment-spine-report") args.segmentSpineReport = next();
    else if (arg === "--out-dir") args.outDir = next();
    else if (arg === "--max-artifacts-per-page") args.maxArtifactsPerPage = Number(next());
    else if (arg === "--help") {
      console.log(`Usage: node scripts/ecl/build_source_intelligence_home_packets.mjs [options]

Options:
  --source-dir <dir>              Model-pass output directory containing accepted/*.json.
  --inventory-dir <dir>           Optional inventory output directory containing prompts/*.json with source_content.
  --segment-spine-report <json>   Optional deterministic segment-spine report from report-segment-spine.ts.
  --out-dir <dir>                 Output directory for Home page packets and prompts.
  --max-artifacts-per-page <n>    Safety bound per page unless include_all is true. Default: 12.`);
      process.exit(0);
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }
  if (!Number.isFinite(args.maxArtifactsPerPage) || args.maxArtifactsPerPage <= 0) {
    throw new Error("--max-artifacts-per-page must be a positive number");
  }
  return args;
}

function sha256(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function writeJson(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`);
}

function listAcceptedArtifacts(sourceDir) {
  const acceptedDir = path.join(sourceDir, "accepted");
  if (!fs.existsSync(acceptedDir)) throw new Error(`Accepted artifact directory not found: ${acceptedDir}`);
  return fs
    .readdirSync(acceptedDir)
    .filter((file) => file.endsWith(".source-intelligence.json"))
    .sort()
    .map((file) => readJson(path.join(acceptedDir, file)));
}

function loadSourceContentIndex(inventoryDir) {
  if (!inventoryDir) return new Map();
  const promptDir = path.join(inventoryDir, "prompts");
  if (!fs.existsSync(promptDir)) {
    throw new Error(`Inventory prompt directory not found: ${promptDir}`);
  }
  const index = new Map();
  for (const file of fs.readdirSync(promptDir).filter((item) => item.endsWith(".prompt.json")).sort()) {
    const prompt = readJson(path.join(promptDir, file));
    const sourceFile = prompt.source_file;
    const sourceContent = prompt.user?.source_content;
    if (!sourceFile?.path || typeof sourceContent !== "string") continue;
    index.set(sourceFile.path, {
      source_family: sourceFile.source_family,
      source_file: sourceFile.path,
      source_hash: sourceFile.sha256,
      schema_fingerprint: sourceFile.schema_fingerprint,
      row_count: sourceFile.row_count,
      column_count: sourceFile.column_count,
      prompt_version: prompt.prompt_version,
      source_inventory: prompt.user?.source_inventory ?? null,
      source_content: sourceContent,
      source_content_hash: sha256(sourceContent),
    });
  }
  return index;
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;
  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') {
        field += '"';
        i += 1;
      } else if (ch === '"') quoted = false;
      else field += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ",") {
      row.push(field);
      field = "";
    } else if (ch === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else if (ch !== "\r") field += ch;
  }
  if (field || row.length) {
    row.push(field);
    rows.push(row);
  }
  const header = rows.shift() ?? [];
  return {
    header,
    rows: rows
      .filter((r) => r.some((cell) => cell.trim()))
      .map((r) => Object.fromEntries(header.map((h, i) => [h, r[i] ?? ""]))),
  };
}

function asNumber(value) {
  const n = Number(String(value ?? "").replace(/[^0-9.-]/g, ""));
  return Number.isFinite(n) ? n : null;
}

function topValues(rows, column, limit = 8) {
  const counts = new Map();
  for (const row of rows) {
    const value = String(row[column] ?? "").trim();
    if (!value) continue;
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, limit)
    .map(([value, count]) => ({ value, count }));
}

function buildSourceEvidenceTable(source) {
  const parsed = parseCsv(source.source_content);
  const keyDimensions = source.source_inventory?.key_dimensions ?? [];
  const dimensionColumns = keyDimensions.filter((column) => parsed.header.includes(column)).slice(0, 8);
  const numericSummaries = [];
  for (const column of parsed.header) {
    let count = 0;
    let sum = 0;
    for (const row of parsed.rows) {
      const n = asNumber(row[column]);
      if (n === null) continue;
      count += 1;
      sum += n;
    }
    if (count > 0 && count >= Math.max(1, Math.floor(parsed.rows.length * 0.6))) {
      numericSummaries.push({
        column,
        populated_count: count,
        sum: Math.round(sum * 100) / 100,
        average: Math.round((sum / count) * 100) / 100,
      });
    }
  }
  numericSummaries.sort((a, b) => Math.abs(b.sum) - Math.abs(a.sum));
  const rowSamples = parsed.rows.slice(0, 2).map((row) => {
    const entries = parsed.header.slice(0, 14).map((column) => [column, row[column] ?? ""]);
    return Object.fromEntries(entries);
  });

  return {
    source_family: source.source_family,
    source_file: source.source_file,
    row_count: parsed.rows.length,
    column_count: parsed.header.length,
    dimension_summaries: dimensionColumns.map((column) => ({ column, top_values: topValues(parsed.rows, column) })),
    numeric_summaries: numericSummaries.slice(0, 12),
    row_samples: rowSamples,
  };
}

function textOf(entry) {
  if (typeof entry === "string") return entry;
  if (entry && typeof entry.statement === "string") return entry.statement;
  return JSON.stringify(entry);
}

function compactArtifact(artifact) {
  return {
    source_family: artifact.source_file.source_family,
    source_file: artifact.source_file.path,
    source_hash: artifact.source_file.sha256,
    row_count: artifact.source_file.row_count,
    column_count: artifact.source_file.column_count,
    fill_rate: artifact.deterministic_inventory.fill_rate,
    grain: artifact.source_file.grain,
    authority: artifact.summary.authority,
    source_summary: artifact.summary.what_this_source_represents,
    key_dimensions: artifact.deterministic_inventory.key_dimensions.slice(0, 8),
    observed_facts: artifact.classification.observed_facts.slice(0, 6).map(textOf),
    calculated_observations: artifact.classification.calculated_observations.slice(0, 6).map(textOf),
    model_derived_observations: artifact.classification.model_derived_observations.slice(0, 4).map(textOf),
    advisory_inferences: artifact.classification.advisory_inferences.slice(0, 3).map(textOf),
    gaps: artifact.summary.gaps.slice(0, 5),
    contradictions: artifact.summary.contradictions.slice(0, 5),
    do_not_claim: artifact.classification.do_not_claim.slice(0, 5).map(textOf),
    citations: artifact.citations.slice(0, 8),
  };
}

function scoreForPage(artifact, page) {
  if (page.include_all) return 100;
  const family = artifact.source_file.source_family;
  const familyIndex = page.priority_families.indexOf(family);
  let score = familyIndex >= 0 ? 80 - familyIndex : 0;
  const relevance = artifact.home_relevance?.[page.page_key];
  if (Array.isArray(relevance) && relevance.length > 0) score += 30;
  if (artifact.classification.observed_facts.length > 0) score += 4;
  if (artifact.classification.calculated_observations.length > 0) score += 3;
  if (artifact.summary.gaps.length > 0 || artifact.summary.contradictions.length > 0) score += 2;
  return score;
}

function selectArtifactsForPage(artifacts, page, maxArtifactsPerPage) {
  const scored = artifacts
    .map((artifact) => ({ artifact, score: scoreForPage(artifact, page) }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score || b.artifact.source_file.row_count - a.artifact.source_file.row_count);
  if (page.include_all) return scored.map((entry) => entry.artifact);
  return scored.slice(0, maxArtifactsPerPage).map((entry) => entry.artifact);
}

function sourceContentForPage(selected, sourceContentIndex) {
  return selected
    .map((artifact) => sourceContentIndex.get(artifact.source_file.path))
    .filter(Boolean);
}

function sourceEvidenceTablesForPage(sourceContentContext) {
  return sourceContentContext.map(buildSourceEvidenceTable);
}

function loadSegmentSpineReport(file) {
  if (!file) return null;
  if (!fs.existsSync(file)) throw new Error(`Segment spine report not found: ${file}`);
  return readJson(file);
}

function segmentContextForPage(page, report) {
  if (!report) return null;
  const relevantPages = new Set([
    "executive_brief",
    "our_business",
    "strategy_value_creation",
    "how_we_operate",
    "technology_data",
    "performance_value",
    "leadership_perspective",
    "what_needs_attention",
    "current_state_architecture",
    "current_state_data_flow",
    "what_has_been_loaded",
    "browse_the_record",
    "applications_systems",
    "vendor_contracts",
    "infrastructure_platforms",
    "data_assets_integrations",
  ]);
  if (!relevantPages.has(page.page_key)) return null;
  return {
    source: "deterministic segment spine report",
    segment_source_file: "01b_business_segments.csv",
    function_map_source: "config/segmentation/health-system-v1.json",
    segments: report.segments,
    unattributed: report.unattributed,
    unresolved_by_domain: report.unresolvedByDomain ?? {},
    share_vs_revenue: report.shareVsRevenue,
    usage_rule: "Use this as fixed arithmetic context. Do not recompute or rename segments.",
  };
}

function buildPrompt(page, packet) {
  return {
    prompt_version: "home-page-source-intelligence-writer/v1",
    page_key: page.page_key,
    title: page.title,
    system: [
      `You are a ${page.writer_lens}.`,
      "Write only from accepted source-intelligence artifacts in the packet.",
      "Lead with the business question before naming vendors, technologies, or internal process.",
      "Do not invent counts, money, dates, owners, vendors, systems, relationships, or readiness states.",
      "If context is insufficient, render a clear deferred/refused page state with evidence needed.",
      "Use executive language for executive pages and expert technologist language for architecture/data pages.",
      "Use source_content_context when present for detail; do not rely only on compact summaries.",
      "Use segment_spine_context and source_evidence_tables as fixed deterministic exhibits; interpret them, do not recalculate them.",
    ].join(" "),
    user: {
      page_question: page.question,
      expected_output: {
        headline: "one board-quality headline",
        opening_thesis: "one short paragraph",
        cxo_readout: ["3-5 bullets grounded in accepted facts"],
        canvas_sections: page.canvases.map((canvas) => ({
          canvas_key: canvas,
          narrative: "what this canvas should say",
          required_tables: page.tables,
          required_charts_or_diagrams: page.charts,
        })),
        visual_datasets_to_use: ["dataset refs from the packet only"],
        deterministic_tables_to_use: [
          "segment_spine_context when present",
          "source_evidence_tables when present",
        ],
        drilldowns_to_enable: page.drilldowns,
        evidence_basis: ["file/family/source refs"],
        gaps_or_refusals: ["explicit unknowns and evidence needed"],
      },
      context_depth: {
        source_intelligence_mode: "accepted source-intelligence artifacts",
        source_content_mode: packet.source_content_context.length > 0
          ? "full selected source files included"
          : "not included in this packet; use accepted artifacts only",
        segment_spine_mode: packet.segment_spine_context
          ? "declared segment spine and cross-domain board included"
          : "not included",
      },
      packet,
    },
  };
}

function main() {
  const options = parseArgs(process.argv.slice(2));
  const runManifest = readJson(path.join(options.sourceDir, "run-manifest.json"));
  const artifacts = listAcceptedArtifacts(options.sourceDir);
  const sourceContentIndex = loadSourceContentIndex(options.inventoryDir);
  const segmentSpineReport = loadSegmentSpineReport(options.segmentSpineReport);
  if (artifacts.length === 0) throw new Error("No accepted source-intelligence artifacts found");

  fs.mkdirSync(options.outDir, { recursive: true });
  fs.mkdirSync(path.join(options.outDir, "packets"), { recursive: true });
  fs.mkdirSync(path.join(options.outDir, "prompts"), { recursive: true });

  const pages = [];
  for (const page of PAGE_DEFS) {
    const selected = selectArtifactsForPage(artifacts, page, options.maxArtifactsPerPage);
    const compact = selected.map(compactArtifact);
    const sourceContentContext = sourceContentForPage(selected, sourceContentIndex);
    const sourceEvidenceTables = sourceEvidenceTablesForPage(sourceContentContext);
    const segmentSpineContext = segmentContextForPage(page, segmentSpineReport);
    const packet = {
      contract_version: CONTRACT_VERSION,
      tenant_key: runManifest.tenant_key,
      assessment_id: runManifest.assessment_id,
      source_ref: runManifest.source_ref,
      page_key: page.page_key,
      title: page.title,
      page_question: page.question,
      writer_lens: page.writer_lens,
      canvases: page.canvases,
      table_candidates: page.tables,
      chart_candidates: page.charts,
      drilldown_candidates: page.drilldowns,
      included_source_count: selected.length,
      included_source_families: [...new Set(selected.map((artifact) => artifact.source_file.source_family))],
      total_source_artifact_count: artifacts.length,
      available_source_index: artifacts.map((artifact) => ({
        source_family: artifact.source_file.source_family,
        source_file: artifact.source_file.path,
        source_hash: artifact.source_file.sha256,
        row_count: artifact.source_file.row_count,
        column_count: artifact.source_file.column_count,
        fill_rate: artifact.deterministic_inventory.fill_rate,
      })),
      context_bounds: {
        selection_rule: page.include_all
          ? "include all accepted source-intelligence artifacts"
          : "priority families plus explicit page relevance, ordered by relevance score",
        max_artifacts_per_page: page.include_all ? null : options.maxArtifactsPerPage,
      },
      source_intelligence: compact,
      source_content_context: sourceContentContext,
      source_evidence_tables: sourceEvidenceTables,
      segment_spine_context: segmentSpineContext,
      evidence_basis: compact.map((artifact) => ({
        source_family: artifact.source_family,
        source_file: artifact.source_file,
        source_hash: artifact.source_hash,
        row_count: artifact.row_count,
        column_count: artifact.column_count,
      })),
    };
    const prompt = buildPrompt(page, packet);
    const packetHash = sha256(JSON.stringify(packet));
    const promptHash = sha256(JSON.stringify(prompt));
    const packetWithHashes = {
      ...packet,
      packet_hash: packetHash,
      prompt_hash: promptHash,
    };
    writeJson(path.join(options.outDir, "packets", `${page.page_key}.home-page-packet.json`), packetWithHashes);
    writeJson(path.join(options.outDir, "prompts", `${page.page_key}.prompt.json`), prompt);
    pages.push({
      page_key: page.page_key,
      title: page.title,
      writer_lens: page.writer_lens,
      included_source_count: selected.length,
      included_source_families: packet.included_source_families,
      source_content_context_count: sourceContentContext.length,
      source_evidence_table_count: sourceEvidenceTables.length,
      segment_spine_context_present: Boolean(segmentSpineContext),
      packet_hash: packetHash,
      prompt_hash: promptHash,
    });
  }

  const manifest = {
    contract_version: CONTRACT_VERSION,
    tenant_key: runManifest.tenant_key,
    assessment_id: runManifest.assessment_id,
    source_ref: runManifest.source_ref,
    source_model_pass_dir: options.sourceDir,
    source_inventory_dir: options.inventoryDir || null,
    segment_spine_report: options.segmentSpineReport || null,
    page_count: pages.length,
    total_source_artifact_count: artifacts.length,
    source_content_context_count: pages.reduce((sum, page) => sum + page.source_content_context_count, 0),
    source_evidence_table_count: pages.reduce((sum, page) => sum + page.source_evidence_table_count, 0),
    segment_spine_context_page_count: pages.filter((page) => page.segment_spine_context_present).length,
    pages,
    generated_at: new Date().toISOString(),
  };
  writeJson(path.join(options.outDir, "manifest.json"), manifest);
  console.log(JSON.stringify({
    accepted: true,
    contract_version: CONTRACT_VERSION,
    tenant_key: manifest.tenant_key,
    assessment_id: manifest.assessment_id,
    page_count: manifest.page_count,
    total_source_artifact_count: manifest.total_source_artifact_count,
    source_content_context_count: manifest.source_content_context_count,
    source_evidence_table_count: manifest.source_evidence_table_count,
    segment_spine_context_page_count: manifest.segment_spine_context_page_count,
    out_dir: options.outDir,
  }, null, 2));
}

main();
