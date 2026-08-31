#!/usr/bin/env node

import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";

const CONTRACT_VERSION = "source-derived-intelligence-inventory/v1";
const PROMPT_VERSION = "source-intelligence-file-analyst/v1";
const DEFAULT_TENANT = "meridian-health";
const DEFAULT_ASSESSMENT = "assessment-dense-source-room-20260823";
const DEFAULT_REF = "origin/main";
const DEFAULT_ROOT = "datasets/tenant-inputs/active/meridian-health/current";
const CONSTANT_COLUMN_DISTINCT_LIMIT = 1;
const NEAR_CONSTANT_SHARE = 0.95;
const NARRATIVE_COLUMN_PATTERN =
  /(narrative|note|description|evidence|basis|challenge|priority|theme|quote|excerpt|rationale|why|what|gap|risk|issue|mitigation|recommendation|plan|maturity)/i;
const HOME_PAGE_KEYS = [
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
  "ai_value_governance",
];
const PAGE_MAPPING_BY_FAMILY = {
  package_guide: ["what_has_been_loaded", "browse_the_record"],
  enterprise_profile: ["executive_brief", "our_business", "what_has_been_loaded"],
  business_segments: ["executive_brief", "our_business", "how_we_operate"],
  business_functions: ["our_business", "how_we_operate", "current_state_architecture"],
  organization_ownership: ["how_we_operate", "leadership_perspective", "our_business"],
  workforce_roles: ["how_we_operate", "leadership_perspective"],
  applications: ["technology_data", "applications_systems", "current_state_architecture", "executive_brief"],
  data_assets_integrations: ["technology_data", "current_state_data_flow", "data_assets_integrations"],
  infrastructure_hosting: ["technology_data", "infrastructure_platforms", "current_state_architecture"],
  vendors_contracts: ["vendor_contracts", "what_needs_attention", "performance_value"],
  budget_spend_value: ["performance_value", "strategy_value_creation", "executive_brief"],
  programs_initiatives: ["strategy_value_creation", "what_needs_attention", "performance_value"],
  ai_automation_use_cases: ["ai_value_governance", "strategy_value_creation", "technology_data"],
  risks_controls: ["what_needs_attention", "leadership_perspective"],
  relationships: ["current_state_architecture", "current_state_data_flow", "how_we_operate"],
  evidence_sources: ["what_has_been_loaded", "browse_the_record", "what_needs_attention"],
  metrics_outcomes: ["performance_value", "strategy_value_creation", "executive_brief"],
  industry_context_patterns: ["executive_brief", "our_business"],
  expert_lenses: ["leadership_perspective", "executive_brief"],
  managed_services_scope: ["vendor_contracts", "applications_systems", "what_needs_attention"],
  operational_process_evidence: ["how_we_operate", "what_needs_attention"],
  data_analytics_platform_maturity: ["technology_data", "current_state_data_flow", "data_assets_integrations"],
  finance_budget_extract: ["performance_value", "strategy_value_creation"],
  program_portfolio_extract: ["strategy_value_creation", "performance_value"],
  ai_benefits_realization: ["ai_value_governance", "performance_value"],
  ai_tool_usage: ["ai_value_governance", "technology_data", "data_assets_integrations"],
  ai_value_interviews: ["leadership_perspective", "ai_value_governance"],
  ai_kpi_outcomes: ["ai_value_governance", "performance_value"],
  m365_copilot_usage: ["ai_value_governance", "technology_data"],
};

const FAMILY_RULES = [
  [/^00_GUIDE_/, "package_guide", "source package onboarding adviser"],
  [/^00_/, "enterprise_profile", "CEO and board strategy adviser"],
  [/^01b_/, "business_segments", "business strategy and operating model adviser"],
  [/^01_/, "business_functions", "operating model adviser"],
  [/^02_/, "organization_ownership", "operating model adviser"],
  [/^03_/, "workforce_roles", "workforce and operating model adviser"],
  [/^04_/, "applications", "enterprise application portfolio architect"],
  [/^05_/, "data_assets_integrations", "data, analytics, BI, ETL, and AI platform architect"],
  [/^06_/, "infrastructure_hosting", "CTO and enterprise infrastructure architect"],
  [/^07_/, "vendors_contracts", "commercial sourcing and contracts adviser"],
  [/^08_/, "budget_spend_value", "CFO and value-realization adviser"],
  [/^09_/, "programs_initiatives", "transformation portfolio adviser"],
  [/^10_/, "ai_automation_use_cases", "AI transformation and adoption adviser"],
  [/^11_/, "risks_controls", "risk committee and control adviser"],
  [/^12_/, "relationships", "enterprise graph and dependency architect"],
  [/^13_/, "evidence_sources", "evidence and provenance steward"],
  [/^14_/, "metrics_outcomes", "CFO and KPI governance adviser"],
  [/^15_/, "industry_context_patterns", "industry strategy adviser"],
  [/^16_/, "expert_lenses", "expert synthesis lead"],
  [/^17_/, "managed_services_scope", "commercial sourcing and operating model adviser"],
  [/^18_/, "operational_process_evidence", "operating process adviser"],
  [/^19_/, "data_analytics_platform_maturity", "data, analytics, BI, ETL, and AI platform architect"],
  [/^SA02_/, "finance_budget_extract", "CFO and IT finance extraction adviser"],
  [/^SA04_/, "program_portfolio_extract", "transformation portfolio adviser"],
  [/^SA08_/, "ai_benefits_realization", "AI value realization adviser"],
  [/^SA09_/, "ai_tool_usage", "AI usage and adoption analytics adviser"],
  [/^SA10_/, "ai_value_interviews", "executive and director interview synthesis lead"],
  [/^SA11_/, "ai_kpi_outcomes", "AI KPI and operational outcome adviser"],
  [/^ms365-/i, "m365_copilot_usage", "M365 Copilot usage and adoption analytics adviser"],
];

function parseArgs(argv) {
  const args = {
    tenant: DEFAULT_TENANT,
    assessment: DEFAULT_ASSESSMENT,
    ref: DEFAULT_REF,
    root: DEFAULT_ROOT,
    outDir: path.join("outputs", "source-intelligence", DEFAULT_TENANT, "current"),
    includeSourceContent: false,
  };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--tenant") args.tenant = argv[++i];
    else if (arg === "--assessment") args.assessment = argv[++i];
    else if (arg === "--ref") args.ref = argv[++i];
    else if (arg === "--root") args.root = argv[++i];
    else if (arg === "--out-dir") args.outDir = argv[++i];
    else if (arg === "--include-source-content") args.includeSourceContent = true;
    else if (arg === "--working-tree") args.ref = "";
    else throw new Error(`Unknown argument: ${arg}`);
  }
  return args;
}

function sha256(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let quoted = false;
  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    const next = text[i + 1];
    if (quoted) {
      if (ch === "\"" && next === "\"") {
        cell += "\"";
        i += 1;
      } else if (ch === "\"") {
        quoted = false;
      } else {
        cell += ch;
      }
      continue;
    }
    if (ch === "\"") quoted = true;
    else if (ch === ",") {
      row.push(cell);
      cell = "";
    } else if (ch === "\n") {
      row.push(cell.replace(/\r$/, ""));
      rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += ch;
    }
  }
  if (cell.length > 0 || row.length > 0) {
    row.push(cell.replace(/\r$/, ""));
    rows.push(row);
  }
  return rows.filter((candidate) => candidate.some((value) => value.trim() !== ""));
}

function readFromRef(ref, repoPath) {
  if (!ref) return fs.readFileSync(repoPath, "utf8");
  return execFileSync("git", ["show", `${ref}:${repoPath}`], {
    encoding: "utf8",
    maxBuffer: 200 * 1024 * 1024,
  });
}

function listCsvFiles(ref, root) {
  if (!ref) {
    return fs
      .readdirSync(root)
      .filter((file) => file.endsWith(".csv"))
      .map((file) => path.posix.join(root, file))
      .sort();
  }
  const tree = execFileSync("git", ["ls-tree", "-r", "--name-only", ref, root], {
    encoding: "utf8",
    maxBuffer: 20 * 1024 * 1024,
  });
  return tree
    .split(/\r?\n/)
    .filter((line) => line.endsWith(".csv"))
    .sort();
}

function inferFamily(fileName) {
  for (const [pattern, family, analystHat] of FAMILY_RULES) {
    if (pattern.test(fileName)) return { family, analystHat };
  }
  return { family: "unclassified", analystHat: "source intelligence analyst" };
}

function profileCsv(repoPath, text) {
  const rows = parseCsv(text);
  const header = rows[0] ?? [];
  const data = rows.slice(1);
  let filled = 0;
  let total = 0;
  const distinctByColumn = new Map();
  const valueCountsByColumn = new Map();
  for (const row of data) {
    header.forEach((column, index) => {
      const value = (row[index] ?? "").trim();
      total += 1;
      if (value) filled += 1;
      if (!distinctByColumn.has(column)) distinctByColumn.set(column, new Set());
      if (!valueCountsByColumn.has(column)) valueCountsByColumn.set(column, new Map());
      if (value) distinctByColumn.get(column).add(value);
      if (value) {
        const counts = valueCountsByColumn.get(column);
        counts.set(value, (counts.get(value) ?? 0) + 1);
      }
    });
  }
  const columnProfiles = header.map((column) => {
    const distinctValues = distinctByColumn.get(column) ?? new Set();
    const valueCounts = valueCountsByColumn.get(column) ?? new Map();
    const populatedCount = [...valueCounts.values()].reduce((sum, count) => sum + count, 0);
    const topValue = [...valueCounts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0] ?? null;
    const topValueShare = populatedCount === 0 || !topValue ? 0 : Number((topValue[1] / populatedCount).toFixed(4));
    const constantState =
      distinctValues.size <= CONSTANT_COLUMN_DISTINCT_LIMIT && populatedCount > 0
        ? "constant"
        : topValueShare >= NEAR_CONSTANT_SHARE && populatedCount > 0
          ? "near_constant"
          : "variable";
    return {
      column,
      populated_count: populatedCount,
      fill_rate: data.length === 0 ? 0 : Number((populatedCount / data.length).toFixed(4)),
      distinct_count: distinctValues.size,
      constant_state: constantState,
      top_value: topValue ? topValue[0] : null,
      top_value_count: topValue ? topValue[1] : 0,
      top_value_share: topValueShare,
      sample_values: [...distinctValues].slice(0, 3),
      model_role: NARRATIVE_COLUMN_PATTERN.test(column) ? "narrative" : "structured",
    };
  });
  const constantColumns = columnProfiles.filter((profile) => profile.constant_state === "constant");
  const nearConstantColumns = columnProfiles.filter((profile) => profile.constant_state === "near_constant");
  const columnsCollapsed = columnProfiles
    .filter((profile) => profile.constant_state === "constant" || profile.constant_state === "near_constant")
    .map((profile) => profile.column);
  const narrativeColumns = columnProfiles
    .filter((profile) => profile.model_role === "narrative" && !columnsCollapsed.includes(profile.column))
    .map((profile) => profile.column);
  const columnsToModel = narrativeColumns.length > 0
    ? narrativeColumns
    : columnProfiles
        .filter((profile) => !columnsCollapsed.includes(profile.column))
        .sort((a, b) => b.distinct_count - a.distinct_count)
        .slice(0, 8)
        .map((profile) => profile.column);
  const keyDimensions = [...distinctByColumn.entries()]
    .map(([column, values]) => ({ column, distinct_count: values.size }))
    .sort((a, b) => b.distinct_count - a.distinct_count)
    .slice(0, 12);
  const sampleEntities = data.slice(0, 5).map((row, rowIndex) => {
    const sample = { source_row_number: rowIndex + 2 };
    header.slice(0, 8).forEach((column, index) => {
      sample[column] = row[index] ?? "";
    });
    return sample;
  });
  return {
    path: repoPath,
    sha256: sha256(text),
    schema_fingerprint: sha256(JSON.stringify(header)),
    content_sha256: sha256(text),
    row_count: data.length,
    rows_read: data.length,
    column_count: header.length,
    fill_rate: total === 0 ? 0 : Number((filled / total).toFixed(4)),
    columns: header,
    column_profiles: columnProfiles,
    constant_columns: constantColumns,
    near_constant_columns: nearConstantColumns,
    columns_collapsed: columnsCollapsed,
    columns_to_model: columnsToModel,
    structured_columns: columnProfiles.filter((profile) => profile.model_role === "structured").map((profile) => profile.column),
    narrative_columns: narrativeColumns,
    key_dimensions: keyDimensions,
    sample_entities: sampleEntities,
  };
}

function pageMappingForFamily(sourceFamily) {
  return PAGE_MAPPING_BY_FAMILY[sourceFamily] ?? ["what_has_been_loaded", "browse_the_record"];
}

function promptForFile({ tenant, assessment, source, includeSourceContent, content }) {
  return {
    prompt_version: PROMPT_VERSION,
    tenant_key: tenant,
    assessment_id: assessment,
    source_file: {
      path: source.path,
      sha256: source.sha256,
      content_sha256: source.content_sha256,
      schema_fingerprint: source.schema_fingerprint,
      source_family: source.source_family,
      row_count: source.row_count,
      rows_read: source.rows_read,
      column_count: source.column_count,
      page_mapping: source.page_mapping,
    },
    system: `You are a ${source.analyst_hat}. Produce governed source-derived intelligence from one source file. Separate recorded facts, calculated observations, model-derived observations, and advisory inferences. Do not invent counts, money, dates, owners, systems, vendors, or relationships. Cite file, row, and column whenever possible.`,
    user: {
      task: "Analyze this source file once and produce source-derived intelligence for Home, Tower, Source, Moves, and Intelligence.",
      required_output_contract: "source-derived-intelligence/v1",
      source_inventory: {
        fill_rate: source.fill_rate,
        columns: source.columns,
        column_profiles: source.column_profiles,
        constant_columns: source.constant_columns,
        near_constant_columns: source.near_constant_columns,
        columns_collapsed: source.columns_collapsed,
        columns_to_model: source.columns_to_model,
        narrative_columns: source.narrative_columns,
        structured_columns: source.structured_columns,
        key_dimensions: source.key_dimensions,
        sample_entities: source.sample_entities,
        read: {
          source_rows: source.row_count,
          rows_read: source.rows_read,
          strategy: "single_pass",
          columns_total: source.column_count,
          columns_collapsed: source.columns_collapsed,
          columns_to_model: source.columns_to_model,
        },
        page_mapping: source.page_mapping,
      },
      required_sections: [
        "what_this_source_represents",
        "grain",
        "authority",
        "observed_facts",
        "calculated_observations",
        "cross_row_findings",
        "business_implications",
        "technology_implications",
        "risk_signals",
        "value_signals",
        "ownership_signals",
        "relationships_observed",
        "gaps",
        "contradictions",
        "suspected_data_quality_issues",
        "home_relevance",
        "do_not_claim",
        "citations",
      ],
      source_content: includeSourceContent ? content : undefined,
      source_content_omitted_reason: includeSourceContent ? undefined : "Prompt manifest records exact source hash and inventory. Use --include-source-content when creating a model-call packet.",
    },
  };
}

function buildScaffold({ tenant, assessment, source, prompt }) {
  return {
    contract_version: "source-derived-intelligence/v1",
    tenant_key: tenant,
    assessment_id: assessment,
    source_file: {
      path: source.path,
    sha256: source.sha256,
      content_sha256: source.content_sha256,
      schema_fingerprint: source.schema_fingerprint,
      row_count: source.row_count,
      rows_read: source.rows_read,
      column_count: source.column_count,
      grain: "pending_model_analysis",
      source_family: source.source_family,
      page_mapping: source.page_mapping,
    },
    deterministic_inventory: {
      fill_rate: source.fill_rate,
      columns: source.columns,
      column_profiles: source.column_profiles,
      constant_columns: source.constant_columns,
      near_constant_columns: source.near_constant_columns,
      columns_collapsed: source.columns_collapsed,
      columns_to_model: source.columns_to_model,
      narrative_columns: source.narrative_columns,
      structured_columns: source.structured_columns,
      key_dimensions: source.key_dimensions,
      sample_entities: source.sample_entities,
      read: {
        source_rows: source.row_count,
        rows_read: source.rows_read,
        strategy: "single_pass",
        columns_total: source.column_count,
        columns_collapsed: source.columns_collapsed,
        columns_to_model: source.columns_to_model,
      },
    },
    model_input: {
      prompt_version: prompt.prompt_version,
      model: "pending",
      context_hash: sha256(JSON.stringify(prompt.user)),
      source_content_hash: source.sha256,
    },
    classification: {
      facts: [],
      reading: [],
      observed_facts: [],
      calculated_observations: [],
      model_derived_observations: [],
      advisory_inferences: [],
      do_not_claim: [],
    },
    home_relevance: {
      executive_brief: [],
      our_business: [],
      strategy_value_creation: [],
      how_we_operate: [],
      technology_data: [],
      performance_value: [],
      leadership_perspective: [],
      what_needs_attention: [],
      current_state_architecture: [],
      current_state_data_flow: [],
      what_has_been_loaded: [],
      browse_the_record: [],
      applications_systems: [],
      vendor_contracts: [],
      infrastructure_platforms: [],
      data_assets_integrations: [],
      ai_value_governance: [],
    },
    page_mapping: source.page_mapping,
    verification: {
      state: "pending_model_run",
      accepted_count: 0,
      repaired_count: 0,
      rejected_count: 0,
      deferred_count: 0,
    },
    citations: [],
  };
}

function main() {
  const options = parseArgs(process.argv.slice(2));
  const files = listCsvFiles(options.ref, options.root);
  if (files.length === 0) throw new Error(`No CSV files found under ${options.root}`);
  fs.mkdirSync(options.outDir, { recursive: true });
  fs.mkdirSync(path.join(options.outDir, "prompts"), { recursive: true });
  fs.mkdirSync(path.join(options.outDir, "scaffolds"), { recursive: true });

  const entries = [];
  const promptLines = [];
  for (const file of files) {
    const fileName = path.basename(file);
    const content = readFromRef(options.ref, file);
    const profile = profileCsv(file, content);
    const family = inferFamily(fileName);
    const source = {
      ...profile,
      file_name: fileName,
      source_family: family.family,
      analyst_hat: family.analystHat,
    };
    source.page_mapping = pageMappingForFamily(source.source_family);
    const prompt = promptForFile({
      tenant: options.tenant,
      assessment: options.assessment,
      source,
      includeSourceContent: options.includeSourceContent,
      content,
    });
    const scaffold = buildScaffold({
      tenant: options.tenant,
      assessment: options.assessment,
      source,
      prompt,
    });
    const stem = fileName.replace(/\.csv$/i, "");
    fs.writeFileSync(path.join(options.outDir, "prompts", `${stem}.prompt.json`), `${JSON.stringify(prompt, null, 2)}\n`);
    fs.writeFileSync(path.join(options.outDir, "scaffolds", `${stem}.source-intelligence.scaffold.json`), `${JSON.stringify(scaffold, null, 2)}\n`);
    promptLines.push(JSON.stringify(prompt));
    entries.push(source);
  }

  const manifest = {
    contract_version: CONTRACT_VERSION,
    tenant_key: options.tenant,
    assessment_id: options.assessment,
    source_ref: options.ref || "working-tree",
    source_root: options.root,
    generated_at: new Date().toISOString(),
    host: os.hostname(),
    file_count: entries.length,
    total_rows: entries.reduce((sum, entry) => sum + entry.row_count, 0),
    total_columns: entries.reduce((sum, entry) => sum + entry.column_count, 0),
    entries,
    rules: {
      current_demo_truth: "Use origin/main source CSVs for the Meridian synthetic digest pass.",
      real_client_truth: "Use client private Blob and ACA data-build jobs inside the client data plane.",
      product_boundary: "Products consume accepted source intelligence through ECL/projection packets, not raw model responses.",
    },
  };

  fs.writeFileSync(path.join(options.outDir, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);
  fs.writeFileSync(path.join(options.outDir, "prompts.jsonl"), `${promptLines.join("\n")}\n`);
  console.log(JSON.stringify({
    accepted: true,
    contract_version: CONTRACT_VERSION,
    tenant_key: options.tenant,
    assessment_id: options.assessment,
    source_ref: manifest.source_ref,
    file_count: manifest.file_count,
    total_rows: manifest.total_rows,
    out_dir: options.outDir,
  }, null, 2));
}

main();
