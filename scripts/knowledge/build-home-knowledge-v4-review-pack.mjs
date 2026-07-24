#!/usr/bin/env node
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const repoRoot = path.resolve(path.dirname(__filename), "../..");
const runStamp = new Date().toISOString().replace(/[:.]/g, "-");
const promptContractVersion = "home-knowledge-v4-business-transformation-prompt-first-20260723-single-dimension-v1";
const outputSchemaVersion = "home-knowledge-v4-candidate-review-v2";
const defaultOutDir = path.join(repoRoot, "reports", "home-knowledge-v4-review", runStamp);
const outDir = getArg("--out-dir", defaultOutDir);
const model = getArg("--model", process.env.HOME_KNOWLEDGE_V4_MODEL || "claude-opus-4-8");
// Opus 4.8 allows 128K output. The old 12000 default was truncating tool calls
// mid-generation: a call that hit the cap before emitting `client_visible`
// returned a tool input of just `{"phase": ...}`, which the code read as an
// empty response and retried in full. It failed hardest on the largest tenant
// (Meridian, 4 of 16 calls) and not at all on the smallest — deterministic
// scaling with tenant size, not flakiness. Streaming is required above ~16K or
// the SDK hits an HTTP timeout.
const maxTokens = Number(getArg("--max-tokens", process.env.HOME_KNOWLEDGE_V4_MAX_TOKENS || "32000"));
const tenantArg = process.env.HOME_KNOWLEDGE_V4_TENANT || getArg("--tenant", "all");
const concurrency = Math.max(1, Number(getArg("--concurrency", "2")));
const reviewOnly = !process.argv.includes("--write-db");
const packetOnly = process.argv.includes("--packet-only");
// Offline replay: re-run every validator against already-generated candidate
// JSON without calling Claude. This is the control point that lets a validator
// or schema change be proven against stored output instead of being tested by
// paying for another full tenant generation.
const replayTarget = getArg("--validate-candidate", null);
const replayMode = Boolean(replayTarget);
// Offline cost ledger: every stored response already carries its `usage` block,
// so the true call/token/cost accounting of a past run can be reconstructed
// without rerunning anything. A paid run should never be authorised against an
// estimate when the measurement is sitting on disk.
const ledgerTarget = getArg("--cost-ledger", null);
const ledgerMode = Boolean(ledgerTarget);

const canonicalTenantOrder = [
  "meridian-health",
  "first-capital",
  "lakeshore-holdings",
  "apex-retail",
  "skyharbor-air",
];

const expandedDimensionCatalog = [
  { key: "enterprise_thesis", name: "Enterprise Thesis", source_keys: ["profile", "functions", "programs", "ai", "industry", "risks"] },
  { key: "leadership_agenda", name: "Leadership Agenda", source_keys: ["workforce", "org", "programs", "ai", "risks"] },
  { key: "proven_strengths", name: "Proven Strengths", source_keys: ["metrics", "programs", "apps", "data", "evidence"] },
  { key: "structural_constraints", name: "Structural Constraints", source_keys: ["risks", "infra", "data", "vendors", "evidence"] },
  { key: "interview_signals", name: "Interview Signals", source_keys: ["workforce", "functions", "opev", "programs"] },
  { key: "profile", name: "Enterprise Profile", source_keys: ["profile"] },
  { key: "divisions", name: "Divisions & Business Units", source_keys: ["org", "functions", "profile"] },
  { key: "front_middle_back", name: "Front / Middle / Back Office", source_keys: ["functions", "org", "workforce"] },
  { key: "functions", name: "Business Functions", source_keys: ["functions"] },
  { key: "capabilities", name: "Business Capabilities", source_keys: ["functions", "opev", "programs", "ai"] },
  { key: "org", name: "Organization Ownership", source_keys: ["org"] },
  { key: "decision_rights", name: "Decision Rights", source_keys: ["org", "risks", "evidence", "programs"] },
  { key: "workforce", name: "Workforce & Roles", source_keys: ["workforce"] },
  { key: "geography", name: "Geography & Legal Entities", source_keys: ["profile", "org", "vendors"] },
  { key: "value_streams", name: "Value Streams", source_keys: ["programs", "metrics", "budget", "opev", "ai"] },
  { key: "business_processes", name: "Business Processes", source_keys: ["opev", "functions", "apps", "data"] },
  { key: "journeys", name: "Member / Customer Journeys", source_keys: ["opev", "functions", "ai", "metrics"] },
  { key: "opev", name: "Operational Evidence", source_keys: ["opev"] },
  { key: "service_delivery", name: "Service Delivery Model", source_keys: ["ms", "vendors", "workforce", "functions", "opev"] },
  { key: "apps", name: "Applications & Systems", source_keys: ["apps"] },
  { key: "data", name: "Data Domains", source_keys: ["data"] },
  { key: "integrations", name: "Integrations", source_keys: ["apps", "data", "rel"] },
  { key: "infra", name: "Infrastructure & Platforms", source_keys: ["infra"] },
  { key: "architecture_dependencies", name: "Architecture Dependencies", source_keys: ["apps", "data", "infra", "rel", "risks"] },
  { key: "tech_lifecycle", name: "Technology Lifecycle", source_keys: ["apps", "infra", "vendors", "risks"] },
  { key: "data_quality_lineage", name: "Data Quality & Lineage", source_keys: ["data", "apps", "evidence", "risks"] },
  { key: "identity_semantic", name: "Identity & Semantic Foundations", source_keys: ["data", "apps", "risks", "evidence"] },
  { key: "risks", name: "Risks & Controls", source_keys: ["risks"] },
  { key: "evidence", name: "Evidence Sources", source_keys: ["evidence"] },
  { key: "vendors", name: "Vendors & Contracts", source_keys: ["vendors"] },
  { key: "ms", name: "Managed Services", source_keys: ["ms", "vendors"] },
  { key: "budget", name: "IT Budget, Spend & Value", source_keys: ["budget"] },
  { key: "programs", name: "Programs & Initiatives", source_keys: ["programs"] },
  { key: "ai", name: "AI & Automation Use Cases", source_keys: ["ai", "programs", "industry"] },
  { key: "metrics", name: "Metrics & Outcomes", source_keys: ["metrics"] },
  { key: "industry", name: "Industry Patterns", source_keys: ["industry"] },
  { key: "lenses", name: "Context Confidence", source_keys: ["functions", "evidence", "risks"] },
  { key: "rel", name: "Relationship Map", source_keys: ["rel", "apps", "data", "functions", "programs", "risks"] },
];

// Canary support: restrict generation to named dimensions so a contract change
// can be proven on ~3 calls instead of a full 38-dimension tenant run.
const dimensionFilter = process.env.HOME_KNOWLEDGE_V4_DIMENSIONS || getArg("--dimensions", null);

function dimensionPasses() {
  const wanted = dimensionFilter
    ? new Set(dimensionFilter.split(",").map((d) => d.trim()).filter(Boolean))
    : null;
  const selected = expandedDimensionCatalog.filter((entry) => !wanted || wanted.has(entry.key));
  if (wanted) {
    const unknown = Array.from(wanted).filter(
      (key) => !expandedDimensionCatalog.some((entry) => entry.key === key),
    );
    if (unknown.length > 0) throw new Error(`Unknown --dimensions key(s): ${unknown.join(", ")}`);
  }
  return selected.map((entry) => ({
    key: entry.key,
    title: entry.name,
    dimensions: [entry.key],
  }));
}

function dimensionPassLabel(index) {
  return String(index + 1).padStart(2, "0");
}

const classificationEnum = [
  "loaded_fact",
  "derived_measure",
  "industry_pattern",
  "strategic_inference",
  "missing_evidence",
];

const requiredVisualFields = [
  "visual_type",
  "title",
  "executive_question",
  "classification",
  "data_points",
  "encoding",
  "annotation",
  "evidence_boundary",
  "empty_state",
];

// signature_visuals come out of the Story Architect pass, which runs before any
// data pass. Demanding data_points/encoding there asks the model to invent data
// it has not been given, so planning exhibits carry intent only; the dimension
// writer binds real data into the full contract later.
const requiredPlanningVisualFields = [
  "visual_type",
  "title",
  "executive_question",
  "classification",
  "empty_state",
];

const requiredRelationshipGraphFields = [
  "visual_type",
  "projection_type",
  "classification",
  "node_groups",
  "edge_meaning",
  "layout_hint",
  "visual_emphasis",
  "empty_state",
];

// Genuinely exclusive to one branch — not derived from set difference against
// the required-field lists above, because title/executive_question/
// classification/empty_state are legitimate on both a chart and a graph even
// though they only happen to be *required* on one of the two lists. Deriving
// "foreign" fields by list difference flagged those as violations; this list
// only names the data-binding fields that are meaningless on the other type.
const chartOnlyVisualFields = ["data_points", "encoding", "annotation", "evidence_boundary"];
const graphOnlyVisualFields = ["projection_type", "node_groups", "edge_meaning", "layout_hint", "visual_emphasis"];

const requiredUseCaseFields = [
  "classification",
  "evidence_maturity",
  "business_object_classification",
  "industry_realization",
  "client_context_signal",
  "evidence_gate",
];

const evidenceMaturityEnum = [
  "source_backed",
  "directional",
  "needs_validation",
  "not_evidenced",
];

const businessObjectClassificationEnum = [
  "qualified_use_case",
  "strategic_foundation",
  "early_idea",
  "current_program",
  "evidence_request",
];

const visualTypeEnum = [
  "horizontal_bar",
  "stacked_bar",
  "scatter_2x2",
  "heatmap",
  "waterfall",
  "line_trend",
  "area_trend",
  "radar",
  "treemap",
  "relationship_graph",
  "evidence_timeline",
  "executive_scorecard",
];

const visualTypeGuidance = {
  horizontal_bar: "Rank 3-7 categories with source-backed or clearly directional values.",
  stacked_bar: "Show composition across 2-5 groups when totals/categories are source-backed.",
  scatter_2x2: "Prioritize options across two axes such as value and readiness; <= 8 points.",
  heatmap: "Show readiness/gap/risk intensity across a compact matrix; <= 5 rows and <= 5 columns.",
  waterfall: "Explain value movement from baseline to opportunity/constraint; only with value components.",
  line_trend: "Show time movement only when dated trend evidence exists.",
  area_trend: "Show cumulative movement only when dated trend evidence exists.",
  radar: "Compare 4-6 capabilities with directional scores; use sparingly.",
  treemap: "Show concentration/exposure by size when supported by categorical magnitude.",
  relationship_graph: "Show entity-to-entity pathways; use only for relationship dimensions or topology.",
  evidence_timeline: "Show source/event chronology, maturity, and what remains to validate.",
  executive_scorecard: "Show 3-6 leadership decisions/statuses when a chart would overstate evidence.",
};

loadEnvFile(path.join(repoRoot, ".env.local"));
loadEnvFile(path.join(repoRoot, ".env"));

// Accepts both `--name=value` and `--name value`. The equals-only form used to
// be silent about a space-separated argument, so `--out-dir /tmp/x` fell back
// to the default and wrote into the repo instead.
function getArg(name, fallback = null) {
  const argv = process.argv.slice(2);
  const prefix = `${name}=`;
  const inline = argv.find((arg) => arg.startsWith(prefix));
  if (inline) return inline.slice(prefix.length);
  const index = argv.indexOf(name);
  if (index !== -1) {
    const next = argv[index + 1];
    if (next !== undefined && !next.startsWith("--")) return next;
  }
  return fallback;
}

function loadEnvFile(file) {
  if (!fs.existsSync(file)) return;
  for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;
    const idx = trimmed.indexOf("=");
    const key = trimmed.slice(0, idx).trim();
    const value = trimmed.slice(idx + 1).trim().replace(/^['"]|['"]$/g, "");
    if (key && process.env[key] === undefined) process.env[key] = value;
  }
}

function sha256(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function writeJson(file, value) {
  ensureDir(path.dirname(file));
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`);
}

function writeText(file, value) {
  ensureDir(path.dirname(file));
  fs.writeFileSync(file, value);
}

function emitAcaProofBundleIfRequested(bundleDir) {
  if (process.env.EMIT_ACA_PROOF_BUNDLE !== "true") return;
  const tmpDir = fs.mkdtempSync(path.join("/tmp", "home-v4-review-proof-"));
  const tarPath = path.join(tmpDir, "proof.tgz");
  const tar = spawnSync("tar", ["-czf", tarPath, "-C", path.dirname(bundleDir), path.basename(bundleDir)], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
  if (tar.status !== 0) {
    throw new Error(tar.stderr || tar.stdout || "home v4 review proof bundle tar failed");
  }
  process.stdout.write("\n__SEMANTIC2_PROOF_TGZ_BEGIN__\n");
  process.stdout.write(fs.readFileSync(tarPath).toString("base64"));
  process.stdout.write("\n__SEMANTIC2_PROOF_TGZ_END__\n");
}

function asText(value) {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (Array.isArray(value)) return value.map(asText).filter(Boolean).join("; ");
  return JSON.stringify(value);
}

function writerSafeText(value) {
  return asText(value)
    .replace(/\b[\w.-]+\.(?:csv|xlsx|json|parquet)\b/gi, "source extract")
    .replace(/\b[A-Z]{2,}-V\d+-EVID-\d+\b/gi, "evidence reference")
    .replace(/\b[A-Z]{2,}-SA\d+-INT-EVID-\d+\b/gi, "interview evidence reference")
    .replace(/\b[A-Z]{2,}-V\d+-EVID-[A-Z0-9*_-]+\b/gi, "evidence reference")
    .replace(/\b(?:\d{1,3}(?:,\d{3})*|\d+)\s+active\s+(?:rows|records|nodes|edges|files|coverage|coverage items)\b/gi, "active evidence coverage")
    .replace(/\b(?:\d{1,3}(?:,\d{3})*|\d+)\b(?=\s+(?:rows|records|nodes|edges|files|coverage items)\b)/gi, "source-backed")
    .replace(/\bsource-backed\s+(rows|records|nodes|edges|files|coverage items)\b/gi, "source-backed coverage")
    .replace(/\b(rows|records|nodes|edges|files|coverage items)\b/gi, "coverage")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function writerSafeValue(value) {
  if (value === null || value === undefined) return value;
  if (typeof value === "string") return writerSafeText(value);
  if (Array.isArray(value)) return value.map(writerSafeValue).filter((item) => item !== "");
  if (typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value)
        .map(([key, item]) => [key, writerSafeValue(item)])
        .filter(([, item]) => item !== "" && item !== undefined && item !== null),
    );
  }
  return value;
}

function sourceKeyLabel(key) {
  const labels = {
    profile: "enterprise profile",
    functions: "business functions",
    org: "organization ownership",
    workforce: "workforce and leadership signals",
    apps: "applications and systems",
    data: "data domains and integrations",
    infra: "infrastructure and platforms",
    vendors: "vendors and contracts",
    budget: "budget, spend, and value",
    programs: "programs and initiatives",
    ai: "AI and automation use cases",
    risks: "risks and controls",
    evidence: "evidence sources",
    metrics: "metrics and outcomes",
    industry: "industry patterns",
    rel: "relationship paths",
    ms: "managed services",
    opev: "operational process evidence",
  };
  return labels[key] ?? key.replace(/_/g, " ");
}

function pick(record, keys) {
  for (const key of keys) {
    const value = writerSafeText(record?.[key]);
    if (value) return value;
  }
  return "";
}

function rowsFor(pack, key) {
  return pack.design_slots?.DATA?.[key]?.rows ?? [];
}

function compactRows(rows, limit, keys) {
  return rows.slice(0, limit).map((row, index) => {
    const compact = { row_index: index + 1 };
    for (const key of keys) {
      const value = row?.[key];
      if (value !== undefined && value !== null && asText(value).trim()) compact[key] = writerSafeValue(value);
    }
    return compact;
  });
}

function mergeDimensionCatalog(pack) {
  const byKey = new Map((pack.design_slots?.DIMS ?? []).map((dimension) => [dimension.key, dimension]));
  return expandedDimensionCatalog.map((entry) => {
    const existing = byKey.get(entry.key);
    if (existing) {
      return {
        ...existing,
        source_keys: entry.source_keys,
      };
    }
    const sourceRows = entry.source_keys.flatMap((key) => rowsFor(pack, key));
    const sourceNames = Array.from(new Set(
      entry.source_keys.flatMap((key) => byKey.get(key)?.sources ?? []).filter(Boolean),
    ));
    return {
      key: entry.key,
      name: entry.name,
      status: sourceRows.length ? "derived_from_related_context" : "missing_evidence",
      summary: sourceRows.length
        ? `${entry.name} must be authored from related source context; the candidate must state what is known, inferred, and missing.`
        : `${entry.name} has no direct source rows yet; the candidate must explain the evidence required before this page can become decision-grade.`,
      covers: entry.source_keys,
      sources: sourceNames,
      source_keys: entry.source_keys,
    };
  });
}

function buildTenantContextPacket(pack, sourceHash) {
  const dims = mergeDimensionCatalog(pack);
  const useCases = pack.design_slots?.USE_CASES ?? [];
  const evidence = pack.design_slots?.EVIDENCE ?? [];
  const narrativeSections = pack.narrative_sections ?? {};
  const relationships = rowsFor(pack, "rel");
  const packet = {
    tenant: {
      canonical_key: pack.tenant_key,
      display_name: pack.tenant_name,
      aliases: aliasesForTenant(pack.tenant_key, pack.tenant_name),
      source_snapshot_hash: sourceHash,
    },
    authoring_contract: {
      prompt_contract_version: promptContractVersion,
      output_schema_version: outputSchemaVersion,
      candidate_status: "candidate_for_human_review",
      renderer_rule:
        "Claude owns every client-visible word. Renderer may parse, arrange, style, paginate, validate, filter, and render visuals; renderer may not rewrite, shorten, sanitize, summarize, supplement, replace, or create fallback narrative.",
      no_raw_inventory_language:
        "Do not narrate raw row counts, node counts, edge counts, or file-size counts as executive claims. Convert them into business coverage and evidence-maturity language.",
    },
    dimension_summary: dims.map((dimension) => ({
      key: dimension.key,
      name: dimension.name,
      status: dimension.status,
      summary: writerSafeText(dimension.summary),
      covers: writerSafeValue(dimension.covers),
      business_source_coverage: (dimension.source_keys ?? dimension.covers ?? [])
        .map(sourceKeyLabel)
        .filter(Boolean)
        .slice(0, 8),
    })),
    existing_home_narratives: writerSafeValue(narrativeSections),
    business_context_samples: {
      enterprise_profile: compactRows(rowsFor(pack, "profile"), 10, [
        "name", "tenant_name", "industry", "summary", "revenue_usd", "employee_count",
        "tenant_archetype", "operating_model", "known_gaps",
      ]),
      functions: compactRows(rowsFor(pack, "functions"), 24, [
        "function_name", "name", "business_function", "operating_model", "owner_role",
        "priority_theme", "current_state_notes", "known_gaps", "evidence_status",
      ]),
      org: compactRows(rowsFor(pack, "org"), 18, [
        "name", "owner_role", "business_function", "operating_model", "decision_rights",
        "known_gaps", "evidence_status",
      ]),
      workforce: compactRows(rowsFor(pack, "workforce"), 18, [
        "role_name", "name", "interview_group", "priority_theme", "business_function",
        "current_state_notes", "known_gaps",
      ]),
      systems: compactRows(rowsFor(pack, "apps"), 28, [
        "application_name", "system_name", "system_category", "business_function",
        "criticality", "lifecycle_status", "deployment_model", "hosting_location",
        "technology_owner", "business_owner", "current_state_notes", "known_gaps",
      ]),
      data_assets: compactRows(rowsFor(pack, "data"), 24, [
        "data_domain", "name", "use_case", "source_systems", "integration_pattern",
        "readiness_status", "known_gaps", "evidence_status",
      ]),
      infrastructure: compactRows(rowsFor(pack, "infra"), 18, [
        "platform_name", "name", "deployment_model", "hosting_location", "criticality",
        "lifecycle_status", "known_gaps",
      ]),
      vendors: compactRows(rowsFor(pack, "vendors"), 18, [
        "vendor_name", "name", "service", "owning_function", "contract_risk",
        "pricing_basis", "known_gaps",
      ]),
      budget_value: compactRows(rowsFor(pack, "budget"), 18, [
        "category", "name", "amount_usd", "value_hypothesis", "value_boundary",
        "confidence", "known_gaps",
      ]),
      programs: compactRows(rowsFor(pack, "programs"), 18, [
        "program_name", "name", "business_function", "stage", "value_hypothesis",
        "owner", "known_gaps",
      ]),
      ai_use_cases: useCases.slice(0, 12).map((row, index) => ({
        candidate_index: index + 1,
        name: pick(row, ["name", "use_case_name", "ai_use_case", "business_name"]),
        business_function: pick(row, ["fn", "business_function", "process_area"]),
        stage: pick(row, ["stage", "current_status", "use_case_status"]),
        value_signal: pick(row, ["value", "value_hypothesis", "target_or_promise"]),
        evidence_gate: pick(row, ["gate", "evidence_gate", "evidence_needed", "required_data"]),
        why_this_is_material: pick(row, ["why_this_is_top_5", "summary", "description"]),
      })),
      risks_controls: compactRows(rowsFor(pack, "risks"), 20, [
        "risk_or_gap", "risk_name", "control", "metric_boundary", "owner",
        "known_gaps", "forbidden_claims",
      ]),
      metrics_outcomes: compactRows(rowsFor(pack, "metrics"), 18, [
        "metric_name", "name", "baseline_metric", "baseline_value", "target_metric",
        "target_range", "value_boundary", "known_gaps",
      ]),
      industry_patterns: compactRows(rowsFor(pack, "industry"), 18, [
        "industry_context", "pattern_name", "signals", "business_function",
        "module_next_actions", "benchmark_range", "known_failure_modes",
      ]),
      process_evidence: compactRows(rowsFor(pack, "opev"), 20, [
        "process", "subprocess", "activity", "decision", "business_function",
        "systems_used", "data_used", "pain_point", "root_cause", "known_gaps",
      ]),
      relationship_samples: compactRows(relationships, 40, [
        "business_name", "use_case", "risk_or_gap", "from_object_name", "from_object_type",
        "to_object_name", "to_object_type", "relationship_type", "affected_systems",
        "metric_boundary", "forbidden_claims", "context_item", "confidence",
      ]),
      evidence_sources: evidence.slice(0, 24).map((row) => ({
        name: pick(row, ["name", "source_name", "source_file", "file_name"]),
        type: pick(row, ["type", "source_type", "file_type"]),
        source_owner: pick(row, ["source_owner", "owner", "loaded_by"]),
        source_status: pick(row, ["source_status", "status"]),
        known_gaps: pick(row, ["known_gaps", "gap", "notes"]),
        parsed_into_dimensions: writerSafeValue(row.parsed_into_dimensions ?? row.dimensions ?? []),
      })),
    },
  };
  return packet;
}

function buildSourceLineageMetadata(pack, sourceHash) {
  const dims = mergeDimensionCatalog(pack);
  const evidence = pack.design_slots?.EVIDENCE ?? [];
  return {
    tenant: {
      canonical_key: pack.tenant_key,
      display_name: pack.tenant_name,
      source_snapshot_hash: sourceHash,
    },
    warning:
      "Lineage metadata is for audit/review only. It is not passed to Claude writer prompts and must not be copied into client-visible narrative.",
    dimension_sources: dims.map((dimension) => ({
      key: dimension.key,
      name: dimension.name,
      source_keys: dimension.source_keys ?? [],
      raw_source_names: dimension.sources ?? [],
    })),
    evidence_sources: evidence.slice(0, 100).map((row) => ({
      name: asText(row.name ?? row.source_name ?? row.source_file ?? row.file_name),
      type: asText(row.type ?? row.source_type ?? row.file_type),
      source_owner: asText(row.source_owner ?? row.owner ?? row.loaded_by),
      source_status: asText(row.source_status ?? row.status),
      parsed_into_dimensions: row.parsed_into_dimensions ?? row.dimensions ?? [],
    })),
    source_files: {
      home_pack_path: pack.__source_file,
      source_hash: sourceHash,
    },
  };
}

function aliasesForTenant(tenantKey, displayName) {
  const aliases = {
    "meridian-health": ["Healthcare Demo", "Meridian"],
    "first-capital": ["FS Demo", "Arcturus", "First Capital"],
    "skyharbor-air": ["Airline Demo", "SkyHarbor", "SkyHarbor Air"],
    "lakeshore-holdings": ["Lakeshore", "Lakeshore Holdings"],
    "apex-retail": ["Retail Demo", "Apex", "Apex Retail"],
  };
  return Array.from(new Set([displayName, ...(aliases[tenantKey] ?? [])].filter(Boolean)));
}

function baseSystemPrompt() {
  return [
    "You are the sole author of client-visible Home / Knowledge content for AbarVa Nexus.",
    "Write like a senior McKinsey or Bain partner briefing a CIO, CDAO, CFO, COO, or CEO.",
    "Start with business outcomes and operating-model change, then explain enabling capabilities. Do not start with a lakehouse, Databricks, AWS, semantic layer, model gateway, or technical modernization unless the business change already justifies it.",
    "Use only the supplied tenant context and supplied industry-pattern rows. If evidence is missing, say what leadership can decide directionally and what must be validated next.",
    "Never narrate raw inventory counts such as rows, nodes, edges, or files as executive value. Translate inventory into business coverage, evidence maturity, decision readiness, and leadership implications.",
    "Every use case must be a bounded workflow, decision, or business intervention. Platforms, lakehouses, semantic layers, identity spines, governance frameworks, and model gateways are strategic foundations, not qualified use cases.",
    `Every client-visible claim, recommendation, dimension tab, evidence gap, visual annotation, and relationship statement must carry exactly one content classification in a field named classification, using only: ${classificationEnum.join(", ")}.`,
    `Use cases and business objects must also carry evidence_maturity using only: ${evidenceMaturityEnum.join(", ")}.`,
    `Use cases and business objects must carry business_object_classification using only: ${businessObjectClassificationEnum.join(", ")}.`,
    "Do not place business_object_classification values inside the content classification field.",
    `Every primary_visual, dashboard_visual, benchmark_exhibit, evidence_visual, priority_matrix_visual, and graph_display_contract must use exactly one visual_type from this closed renderer enum: ${visualTypeEnum.join(", ")}.`,
    "Do not invent visual types. Do not use aliases such as graph_topology, topology_graph, status_heatmap, risk_matrix, priority_grid, dependency_graph, or landscape.",
    "For chart visuals, provide compact Recharts-ready data: no more than 7 visible marks for bars/points, no more than 5x5 heatmap cells, no dense labels, no raw record counts, no JSON intended for display.",
    "Claude owns every client-visible word. Return concise, polished, complete JSON only. Do not include markdown fences.",
    "For visuals, author the visual contract and executive meaning. The renderer will render the visual exactly from your structured spec and source-backed/candidate data; it will not invent titles, annotations, claims, or fallback copy.",
    `A visual object with visual_type from the chart enum (anything except relationship_graph) — in dashboard_visuals, benchmark_exhibits, evidence_visuals, visual_contracts, primary_visual, or priority_matrix_visual — must include all of these fields: ${requiredVisualFields.join(", ")}. It must NOT include projection_type, node_groups, edge_meaning, layout_hint, or visual_emphasis — those belong only to a relationship_graph.`,
    `signature_visuals are planning exhibits chosen before any data pass has run. Specify only: ${requiredPlanningVisualFields.join(", ")}. Do not invent data_points or encoding for a signature visual; the dimension writer binds real data later.`,
    `A visual object with visual_type: relationship_graph must include all of these fields and none of the chart fields: ${requiredRelationshipGraphFields.join(", ")}. It must NOT include data_points, encoding, or annotation — express the graph through node_groups and edge_meaning instead. As a dimension's primary_visual, it carries these fields directly — there is no separate "graph_display_contract" field to nest it inside. The one exception: the relationship writer's graph_projections[] items are narrative wrappers (headline, business_meaning, dependencies, etc.) that legitimately carry the visual contract nested under a graph_display_contract key — that nested key is intentional there and must not be flattened or removed.`,
    "For every visual, chart or graph, write empty_state: the exact business-facing sentence to show if the visual cannot render because evidence is missing. Do not omit empty_state even when the visual is otherwise fully populated.",
    "For a chart visual, provide encoding as a compact object describing x/y/series/color/size, and data_points as the exact compact array the renderer can draw. Do not leave data_points empty unless the classification is missing_evidence and empty_state explains why. Do not add encoding or data_points to a relationship_graph.",
    `Every item in qualified_candidates, foundations, and early_ideas must include all of these fields: ${requiredUseCaseFields.join(", ")}.`,
    "Be concise enough to fit the schema. Every pass must populate client_visible. Do not spend tokens restating instructions.",
  ].join("\n");
}

// A rendered visual, typed. `empty_state` used to be prose only ("Do not omit
// empty_state even when data_points are present") and was dropped on ~57 of
// Meridian's visuals — prose is not holding, so the contract moves into the
// schema. The anyOf discriminates on visual_type so a relationship_graph must
// carry graph fields instead of chart fields, which is the other observed
// defect: the model picked the graph type, then filled a chart contract.
function renderedVisualSchema() {
  const fieldSchema = (field, graphType) => {
    if (field === "visual_type") {
      return {
        type: "string",
        enum: graphType ? ["relationship_graph"] : visualTypeEnum.filter((t) => t !== "relationship_graph"),
      };
    }
    if (field === "classification") return { type: "string", enum: classificationEnum };
    if (field === "data_points" || field === "node_groups") return { type: "array" };
    if (field === "encoding") return { type: "object" };
    return { type: "string" };
  };
  return {
    anyOf: [
      {
        type: "object",
        additionalProperties: true,
        properties: Object.fromEntries(requiredVisualFields.map((f) => [f, fieldSchema(f, false)])),
        required: requiredVisualFields,
      },
      {
        type: "object",
        additionalProperties: true,
        properties: Object.fromEntries(requiredRelationshipGraphFields.map((f) => [f, fieldSchema(f, true)])),
        required: requiredRelationshipGraphFields,
      },
    ],
  };
}

// NOTE: `tools` renders at prefix position 0, so varying the schema by pass type
// invalidates the prompt cache between pass types. That is deliberate and cheap
// — cross-pass-type sharing measured only ~148 tokens — and the 13k-token
// dimension-to-dimension cache is untouched, because every dimension pass gets
// a byte-identical schema.
function toolSchema(pass = null) {
  const clientVisible = pass?.type === "dimensions"
    ? {
        type: "object",
        additionalProperties: true,
        properties: {
          dimension_key: { type: "string" },
          executive_title: { type: "string" },
          primary_visual: renderedVisualSchema(),
        },
        required: ["dimension_key", "executive_title", "primary_visual"],
      }
    : { type: "object", additionalProperties: true };
  return {
    name: "submit_home_v4_candidate_section",
    description: "Submit one bounded Home Knowledge Pack V4 candidate section.",
    input_schema: {
      type: "object",
      additionalProperties: true,
      properties: {
        phase: { type: "string" },
        client_visible: clientVisible,
        visual_contracts: {
          type: "array",
          items: { type: "object", additionalProperties: true },
        },
        evidence_boundary: {
          type: "array",
          items: { type: "object", additionalProperties: true },
        },
        quality_notes: {
          type: "array",
          items: { type: "string" },
        },
      },
      required: ["phase", "client_visible"],
    },
  };
}

function makePrompt(pass, packet, assembled) {
  const locked = {
    source_snapshot_hash: packet.tenant.source_snapshot_hash,
    business_context_packet_hash: sha256(JSON.stringify(packet)),
    story_architecture_id: assembled.story_architecture_id ?? null,
    story_architecture_version: assembled.story_architecture_version ?? null,
    story_architecture_hash: assembled.story_architecture_hash ?? null,
    prompt_contract_version: promptContractVersion,
    output_schema_version: outputSchemaVersion,
  };
  const common = {
    tenant: packet.tenant,
    locked_objects: locked,
    business_first_sequence:
      "Business outcome -> current work/decision -> future way of working -> roles/accountability -> value mechanism/measures -> probability/conditions -> business capabilities -> data/control/tech capabilities -> platforms/vendors.",
    visual_standard:
      "Design for a simple executive cockpit: compact Recharts-ready cards, few labels, strong executive annotations, relationship_graph views for relationships, no giant row-count cards, no visual clutter, no raw JSON in UI.",
    classification_enum: classificationEnum,
    evidence_maturity_enum: evidenceMaturityEnum,
    business_object_classification_enum: businessObjectClassificationEnum,
    visual_type_enum: visualTypeEnum,
    visual_type_guidance: visualTypeGuidance,
    visual_contract_rules: [
      "Use one visual_type only from visual_type_enum.",
      "Use horizontal_bar, stacked_bar, scatter_2x2, heatmap, waterfall, line_trend, area_trend, radar, treemap, evidence_timeline, or executive_scorecard for dimension primary visuals.",
      "Use relationship_graph only when the executive question is explicitly about connections, pathways, dependencies, ownership, lineage, or operating model relationships.",
      "Use fewer than 7 labels. Prefer short labels that fit inside a dashboard card.",
      "Do not show raw rows, records, nodes, edges, or file counts.",
      `A chart visual (visual_type anything except relationship_graph) must include: ${requiredVisualFields.join(", ")}, and must NOT include projection_type, node_groups, edge_meaning, layout_hint, or visual_emphasis.`,
      `A relationship_graph visual — the primary_visual object itself when visual_type is relationship_graph, not a separate nested field — must include: ${requiredRelationshipGraphFields.join(", ")}, and must NOT include data_points, encoding, or annotation.`,
      "Each data_point must include label, value or x/y where relevant, classification, and source_basis.",
      "If source data is directional rather than measured, classification must be strategic_inference or industry_pattern, and the evidence_boundary must say that plainly.",
    ],
  };
  if (pass.type === "story_architect") {
    return {
      task: "Call 1: Story Architect",
      instruction:
        "Create the governing thesis and chapter spine for this tenant's Home Knowledge cockpit. Do not write the full page. Lock the strategic story, tensions, Act/Build/Scale sequence, and signature visual exhibit set.",
      output_requirements: {
        story_architecture_id: `home-v4-${packet.tenant.canonical_key}-${Date.now()}`,
        fields: [
          "business_archetype",
          "governing_thesis",
          "strategic_tensions",
          "chapter_spine",
          "act_build_scale",
          "leadership_decisions",
          "signature_visuals",
          "do_not_claim",
        ],
        max_items: {
          strategic_tensions: 4,
          chapter_spine: 6,
          signature_visuals: 8,
          leadership_decisions: 5,
        },
      },
      common,
      context_packet: packet,
    };
  }
  if (pass.type === "executive_brief") {
    return {
      task: "Call 2: Executive Brief Writer",
      instruction:
        "Using the locked story architecture, write the opening executive brief and compact dashboard content. Keep it board-grade, business-first, and visually scannable.",
      output_requirements: {
        fields: [
          "hero_headline",
          "one_sentence_read",
          "what_leadership_should_understand",
          "business_operating_context",
          "where_ai_or_change_matters",
          "evidence_boundary",
          "decision_cards",
          "dashboard_visuals",
        ],
        hard_limits:
          "Hero headline <= 12 words. one_sentence_read <= 35 words. decision_cards <= 6 cards. dashboard_visuals <= 5 visual specs.",
      },
      common,
      story_architecture: assembled.story_architect,
      context_packet: slimPacket(packet),
    };
  }
  if (pass.type === "industry_change") {
    return {
      task: "Call 3: Industry and Change Writer",
      instruction:
        "Blend external industry movements with this tenant's loaded business context. Produce new ways of operating and change theses, not generic trend commentary.",
      output_requirements: {
        fields: [
          "industry_movements",
          "new_ways_of_operating",
          "change_theses",
          "benchmark_exhibits",
          "what_to_validate_with_client",
        ],
        hard_limits:
          "Industry movements <= 5. New ways of operating <= 5. Change theses <= 5. Benchmark exhibits <= 4.",
      },
      common,
      story_architecture: assembled.story_architect,
      industry_context: packet.business_context_samples.industry_patterns,
      tenant_signals: tenantSignals(packet),
    };
  }
  if (pass.type === "use_cases") {
    return {
      task: `Call 4: Use-Case Qualifier batch ${pass.batchIndex + 1}`,
      instruction:
        "Classify and qualify these candidates. Keep foundations separate from use cases. Write the business case through current work, future work, owner, evidence gate, value mechanism, module handoff, and the relevant industry realization pattern. Industry realization must be classified as industry_pattern and separated from this tenant's loaded facts.",
      output_requirements: {
        fields: [
          "qualified_candidates",
          "foundations",
          "early_ideas",
          "priority_matrix_visual",
          "sequencing_rationale",
        ],
        hard_limits:
          `For each item in qualified_candidates, foundations, and early_ideas, write at most 110 words across all fields and include: ${requiredUseCaseFields.join(", ")}. classification must use classification_enum only; business_object_classification must use qualified_use_case, strategic_foundation, early_idea, current_program, or evidence_request only. priority_matrix_visual must use visual_type=scatter_2x2 and be a compact Recharts-compatible 2x2 spec with <= 8 points and must include all required visual fields.`,
      },
      common,
      story_architecture: assembled.story_architect,
      candidates: pass.items,
      tenant_signals: tenantSignals(packet),
      industry_change: assembled.industry_change,
    };
  }
  if (pass.type === "dimensions") {
    return {
      task: `Call 5${pass.suffix}: Dimension Writer - ${pass.title}`,
      instruction:
        "Write one meaningful Home dimension page for the listed explorer dimension. Return typed page sections, not prose-only tab descriptions. The dimension needs a strong primary visual contract. Relationship sections must be graph/topology-ready when relationships exist, and must explain the art of the possible when evidence is missing.",
      output_requirements: {
        per_dimension_fields: [
          "dimension_key",
          "executive_title",
          "summary_tab",
          "primary_visual",
          "data_tab",
          "relationship_tab",
          "gaps_tab",
          "evidence_tab",
          "module_implications",
        ],
        hard_limits:
          "Return one dimension object directly in client_visible. summary_tab must be an object with headline, executive_read, classification. data_tab must be an object with headline, filters, rows, evidence_boundary, classification. relationship_tab must be an object with headline, graph_nodes, graph_edges, paths_to_show, missing_relationships, classification. gaps_tab must be an object with decision_gaps, why_it_matters, evidence_to_collect, owner_hint, classification. evidence_tab must be an object with source_inventory, what_it_proves, what_it_does_not_prove, next_evidence_request, classification. primary_visual must include visual_type, title, executive_question, classification, data_points, encoding, annotation, evidence_boundary, empty_state. Keep each tab concise. Never write template filenames, evidence IDs, source table names, or raw inventory counts in any tab.",
      },
      common,
      story_architecture: assembled.story_architect,
      dimensions: packet.dimension_summary.filter((d) => pass.dimensions.includes(d.key)),
      rows_by_dimension: Object.fromEntries(pass.dimensions.map((key) => [key, (packet.business_context_samplesForDimension?.[key] ?? rowsForDimensionPacket(packet, key)).slice(0, 8)])),
      relationship_samples: packet.business_context_samples.relationship_samples,
      evidence_sources: packet.business_context_samples.evidence_sources,
    };
  }
  if (pass.type === "relationships") {
    return {
      task: "Call 6: Relationship Writer",
      instruction:
        "Author the enterprise relationship-map story as a graph-native executive artifact. The goal is to show how business priorities, functions, systems, constraints, value mechanisms, and evidence gates connect. Do not talk about node counts or edge counts.",
      output_requirements: {
        graph_projection_types: [
          "enterprise_structure",
          "operating_model",
          "technology_dependency",
          "business_change_impact",
          "value_realization",
          "evidence_lineage",
        ],
        per_projection_fields: [
          "headline",
          "executive_question",
          "root_entities",
          "material_paths",
          "business_meaning",
          "what_it_enables",
          "dependencies",
          "constraints",
          "unresolved_relationships",
          "evidence_boundary",
          "next_action",
          "graph_display_contract",
        ],
        hard_limits:
          "Return exactly six graph_projections, one per requested projection_type. Each projection <= 120 words total. graph_display_contract must include visual_type=relationship_graph, projection_type, classification, node_groups, edge_meaning, layout_hint, visual_emphasis, and empty_state.",
      },
      common,
      story_architecture: assembled.story_architect,
      relationship_samples: packet.business_context_samples.relationship_samples,
      use_case_context: assembled.use_cases,
      dimensions_context: assembled.dimensions,
    };
  }
  if (pass.type === "evidence") {
    return {
      task: "Call 7: Evidence Writer",
      instruction:
        "Write the evidence maturity, gaps, source inventory, and decision-boundary content. Make file/source provenance useful to executives without dumping raw technical metadata.",
      output_requirements: {
        fields: [
          "evidence_maturity_read",
          "source_inventory_rows",
          "critical_gaps",
          "what_can_be_decided_now",
          "what_requires_client_validation",
          "evidence_visuals",
        ],
        hard_limits:
          "critical_gaps <= 8; source_inventory_rows <= 12; evidence_visuals <= 4. evidence_visuals must use visual types from visual_type_enum and include all required visual fields. Use business provenance language, not raw file-count language. Do not mention filenames, physical tables, evidence IDs, or loader internals.",
      },
      common,
      story_architecture: assembled.story_architect,
      evidence_sources: packet.business_context_samples.evidence_sources,
      gaps: packet.business_context_samples.risks_controls,
      relationships: assembled.relationships,
    };
  }
  return {
    task: "Call 8: Coherence Reviewer",
    instruction:
      "Return a complete review object. Do not rewrite content. Check cross-section consistency, business-first story, visual quality, raw-count leakage, tenant leakage, foundation/use-case confusion, missing classification fields, missing visual types, and weak evidence posture.",
    output_requirements: {
      fields: [
        "violations",
        "source_sections_to_regenerate",
        "approval_recommendation",
        "reason",
        "sections_to_regenerate",
      ],
      hard_limits:
        "Always return approval_recommendation, reason, violations, source_sections_to_regenerate, and sections_to_regenerate. If there are no issues, return approval_recommendation=approve_for_human_review and empty arrays. In approval prose, do not use the words high, critical, fail, failed, failure, or forbidden; reserve severity words only for actual violation objects. If any field is missing, the deterministic validator rejects the candidate.",
    },
    common,
    assembled_candidate_pack: assembled,
  };
}

function slimPacket(packet) {
  return {
    tenant: packet.tenant,
    dimension_summary: packet.dimension_summary,
    business_context_samples: {
      enterprise_profile: packet.business_context_samples.enterprise_profile,
      functions: packet.business_context_samples.functions.slice(0, 12),
      systems: packet.business_context_samples.systems.slice(0, 12),
      ai_use_cases: packet.business_context_samples.ai_use_cases,
      risks_controls: packet.business_context_samples.risks_controls.slice(0, 10),
      metrics_outcomes: packet.business_context_samples.metrics_outcomes,
      process_evidence: packet.business_context_samples.process_evidence.slice(0, 10),
      evidence_sources: packet.business_context_samples.evidence_sources.slice(0, 12),
    },
  };
}

function tenantSignals(packet) {
  return {
    enterprise_profile: packet.business_context_samples.enterprise_profile,
    functions: packet.business_context_samples.functions.slice(0, 16),
    systems: packet.business_context_samples.systems.slice(0, 16),
    data_assets: packet.business_context_samples.data_assets.slice(0, 16),
    process_evidence: packet.business_context_samples.process_evidence.slice(0, 16),
    risks_controls: packet.business_context_samples.risks_controls.slice(0, 12),
    metrics_outcomes: packet.business_context_samples.metrics_outcomes.slice(0, 12),
  };
}

function rowsForDimensionPacket(packet, key) {
  const map = {
    profile: packet.business_context_samples.enterprise_profile,
    functions: packet.business_context_samples.functions,
    org: packet.business_context_samples.org,
    workforce: packet.business_context_samples.workforce,
    apps: packet.business_context_samples.systems,
    data: packet.business_context_samples.data_assets,
    infra: packet.business_context_samples.infrastructure,
    vendors: packet.business_context_samples.vendors,
    budget: packet.business_context_samples.budget_value,
    programs: packet.business_context_samples.programs,
    ai: packet.business_context_samples.ai_use_cases,
    risks: packet.business_context_samples.risks_controls,
    rel: packet.business_context_samples.relationship_samples,
    evidence: packet.business_context_samples.evidence_sources,
    metrics: packet.business_context_samples.metrics_outcomes,
    industry: packet.business_context_samples.industry_patterns,
    lenses: packet.business_context_samples.functions.slice(0, 12),
    ms: packet.business_context_samples.vendors,
    opev: packet.business_context_samples.process_evidence,
  };
  if (Object.hasOwn(map, key)) return map[key] ?? [];
  const catalogEntry = expandedDimensionCatalog.find((entry) => entry.key === key);
  if (catalogEntry) {
    return catalogEntry.source_keys.flatMap((sourceKey) => rowsForDimensionPacket(packet, sourceKey));
  }
  return map[key] ?? [];
}

// Prompt-cache partitioning.
//
// Prompt caching matches on an exact byte prefix, so the first differing byte
// ends the cacheable region. Every dimension prompt used to lead with `task`,
// which names the dimension and therefore differs on every call — poisoning the
// ~47KB of byte-identical content behind it (`common`, `story_architecture`,
// `relationship_samples`, `evidence_sources`). Measured result: 0 cache reads
// across 86 calls, every one re-sending its full context at uncached price.
//
// Ordered most-widely-shared first, so shorter prefixes still match longer ones:
// a pass without `relationship_samples` still shares `common` +
// `story_architecture` with a pass that has it.
const CACHE_STABLE_KEYS = [
  "common",
  "story_architecture",
  "context_packet",
  "relationship_samples",
  "evidence_sources",
  "industry_context",
  "tenant_signals",
  "industry_change",
  "instruction",
  "output_requirements",
];

function splitPromptForCache(prompt) {
  const stable = {};
  const variable = {};
  for (const key of CACHE_STABLE_KEYS) {
    if (Object.hasOwn(prompt, key)) stable[key] = prompt[key];
  }
  for (const [key, value] of Object.entries(prompt)) {
    // Everything not explicitly stable stays after the breakpoint — including
    // `task` and any `repair_instruction` added on a retry.
    if (!Object.hasOwn(stable, key)) variable[key] = value;
  }
  return {
    stableText: JSON.stringify(stable, null, 2),
    variableText: JSON.stringify(variable, null, 2),
  };
}

async function callClaude(client, pass, prompt, tenantDir) {
  const tool = toolSchema(pass);
  const promptText = JSON.stringify(prompt, null, 2);
  writeText(path.join(tenantDir, "prompts", `${pass.id}.json`), `${promptText}\n`);
  const started = Date.now();
  console.log(`[home-v4]   ${pass.id} start`);
  let lastMessage = null;
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    const attemptPrompt = attempt === 1
      ? prompt
      : {
          ...prompt,
          repair_instruction: [
            `Repair attempt ${attempt - 1}: your previous tool call did not populate client_visible.`,
            "You are still the sole author of every client-visible word.",
            "Return a compact, complete client_visible object now.",
            "Do not omit client_visible.",
            "Do not include raw filenames, row counts, internal IDs, or loader/table names.",
            "Keep every list short, but complete enough for the requested section.",
          ].join(" "),
        };
    const attemptText = JSON.stringify(attemptPrompt, null, 2);
    if (attempt > 1) writeText(path.join(tenantDir, "prompts", `${pass.id}.repair-${attempt - 1}.json`), `${attemptText}\n`);
    const { stableText, variableText } = splitPromptForCache(attemptPrompt);
    // Streaming, not create(): above ~16K max_tokens a non-streaming request
    // hits the SDK's HTTP timeout. getFinalMessage() returns the same assembled
    // Message object, so nothing downstream changes.
    const message = await retry(async () => client.messages.stream({
      model,
      max_tokens: maxTokens,
      system: baseSystemPrompt(),
      messages: [{
        role: "user",
        content: [
          // Cache breakpoint. Prompt caching is a prefix match over
          // tools -> system -> messages, so this one breakpoint covers the tool
          // schema and system prompt as well as the stable body below. A
          // breakpoint on the tool alone would cache nothing: tools + system is
          // ~1.2k tokens, under Opus's 4096-token minimum cacheable prefix.
          { type: "text", text: stableText, cache_control: { type: "ephemeral", ttl: "1h" } },
          { type: "text", text: variableText },
        ],
      }],
      tools: [tool],
      tool_choice: { type: "tool", name: tool.name },
    }).finalMessage());
    lastMessage = message;
    const toolUse = message.content.find((block) => block.type === "tool_use" && block.name === tool.name);
    if (!toolUse) {
      writeJson(path.join(tenantDir, "responses", `${pass.id}.attempt-${attempt}-raw-message.json`), message);
      if (attempt === 3) throw new Error(`No tool_use returned for ${pass.id}`);
      continue;
    }
    if (!toolUse.input?.client_visible || Object.keys(toolUse.input.client_visible ?? {}).length === 0) {
      writeJson(path.join(tenantDir, "responses", `${pass.id}.empty-response-attempt-${attempt}.json`), {
        elapsed_ms: Date.now() - started,
        attempt,
        model,
        usage: message.usage ?? null,
        content: toolUse.input,
      });
      continue;
    }
    const response = {
      id: pass.id,
      pass: pass.type,
      repaired: attempt > 1,
      repair_attempts: attempt - 1,
      elapsed_ms: Date.now() - started,
      model,
      usage: message.usage ?? null,
      content: toolUse.input,
    };
    writeJson(path.join(tenantDir, "responses", `${pass.id}.json`), response);
    const label = attempt > 1 ? `repaired after ${attempt - 1} attempt(s)` : "done";
    console.log(`[home-v4]   ${pass.id} ${label} in ${Math.round((Date.now() - started) / 1000)}s`);
    return response.content;
  }
  writeJson(path.join(tenantDir, "responses", `${pass.id}.final-empty-raw-message.json`), lastMessage);
  throw new Error(`Claude returned empty client_visible for ${pass.id} after 3 attempts.`);
}

async function retry(fn) {
  let lastError;
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      const status = typeof error?.status === "number" ? error.status : null;
      const retryable = status === null || status === 408 || status === 409 || status === 429 || status >= 500;
      if (!retryable || attempt === 3) break;
      await new Promise((resolve) => setTimeout(resolve, 2500 * attempt));
    }
  }
  throw lastError;
}

async function processTenant(client, tenantKey) {
  const sourceFile = path.join(repoRoot, "datasets", "tenant-inputs", tenantKey, "approved-content", "home", "design-contract-pack.json");
  const sourceText = fs.readFileSync(sourceFile, "utf8");
  const sourceHash = sha256(sourceText);
  const pack = JSON.parse(sourceText);
  pack.__source_file = sourceFile;
  const tenantDir = path.join(outDir, "tenants", tenantKey);
  ensureDir(tenantDir);
  const packet = buildTenantContextPacket(pack, sourceHash);
  const lineage = buildSourceLineageMetadata(pack, sourceHash);
  writeJson(path.join(tenantDir, "source-context-packet.json"), packet);
  writeJson(path.join(tenantDir, "source-lineage-metadata.json"), lineage);
  if (packetOnly) {
    return {
      tenant_key: tenantKey,
      display_name: pack.tenant_name,
      source_hash: sourceHash,
      validation_status: "packet_only",
      violation_count: 0,
      visual_contract_count: 0,
      prompt_count: 0,
      tenant_dir: path.relative(outDir, tenantDir),
    };
  }
  const assembled = {
    tenant: packet.tenant,
    prompt_contract_version: promptContractVersion,
    output_schema_version: outputSchemaVersion,
    review_status: "candidate_not_approved",
    review_only: reviewOnly,
    generated_at: new Date().toISOString(),
    model,
    // Recorded so validateDimensionTabs can tell a deliberate canary subset
    // from a full run missing dimensions it should have produced.
    requested_dimensions: dimensionFilter
      ? dimensionPasses().map((entry) => entry.key)
      : null,
    passes: {},
  };

  const passes = [
    { id: "01-story-architect", type: "story_architect" },
    { id: "02-executive-brief", type: "executive_brief" },
    { id: "03-industry-change", type: "industry_change" },
  ];

  for (const pass of passes) {
    const content = await callClaude(client, pass, makePrompt(pass, packet, assembled), tenantDir);
    assembled.passes[pass.id] = content;
    if (pass.type === "story_architect") {
      assembled.story_architect = content.client_visible;
      assembled.story_architecture_id =
        content.client_visible?.story_architecture_id ||
        `home-v4-${tenantKey}-${sourceHash.slice(0, 10)}`;
      assembled.story_architecture_version = promptContractVersion;
      assembled.story_architecture_hash = sha256(JSON.stringify(content.client_visible ?? {}));
    }
    if (pass.type === "industry_change") assembled.industry_change = content.client_visible;
  }

  const useCaseItems = packet.business_context_samples.ai_use_cases;
  assembled.use_cases = [];
  for (let i = 0; i < useCaseItems.length; i += 4) {
    const pass = {
      id: `04-use-cases-batch-${Math.floor(i / 4) + 1}`,
      type: "use_cases",
      batchIndex: Math.floor(i / 4),
      items: useCaseItems.slice(i, i + 4),
    };
    const content = await callClaude(client, pass, makePrompt(pass, packet, assembled), tenantDir);
    assembled.passes[pass.id] = content;
    assembled.use_cases.push(content.client_visible);
  }

  assembled.dimensions = [];
  const dimensionJobs = dimensionPasses();
  for (let i = 0; i < dimensionJobs.length; i += 1) {
    const batch = dimensionJobs[i];
    const suffix = dimensionPassLabel(i);
    const pass = {
      id: `05-${suffix}-dimensions-${batch.key}`,
      type: "dimensions",
      suffix,
      ...batch,
    };
    const content = await callClaude(client, pass, makePrompt(pass, packet, assembled), tenantDir);
    assembled.passes[pass.id] = content;
    assembled.dimensions.push(content.client_visible);
  }

  for (const pass of [
    { id: "06-relationships", type: "relationships" },
    { id: "07-evidence", type: "evidence" },
    { id: "08-coherence-review", type: "coherence" },
  ]) {
    const content = await callClaude(client, pass, makePrompt(pass, packet, assembled), tenantDir);
    assembled.passes[pass.id] = content;
    if (pass.type === "relationships") assembled.relationships = content.client_visible;
    if (pass.type === "evidence") assembled.evidence = content.client_visible;
    if (pass.type === "coherence") assembled.coherence_review = content.client_visible;
  }

  const validation = validateCandidate(assembled);
  assembled.validation = validation;
  writeJson(path.join(tenantDir, "candidate-home-knowledge-v4.json"), assembled);
  writeText(path.join(tenantDir, "review.html"), tenantHtml(assembled, validation));
  return {
    tenant_key: tenantKey,
    display_name: pack.tenant_name,
    source_hash: sourceHash,
    validation_status: validation.status,
    violation_count: validation.violations.length,
    visual_contract_count: countVisualContracts(assembled),
    prompt_count: Object.keys(assembled.passes).length,
    tenant_dir: path.relative(outDir, tenantDir),
  };
}

function countVisualContracts(candidate) {
  return JSON.stringify(candidate).match(/visual_contract|primary_visual|graph_display_contract|dashboard_visuals|benchmark_exhibits|priority_matrix_visual|evidence_visuals/g)?.length ?? 0;
}

// Findings lists are capped so a broken candidate cannot produce an unbounded
// report. The cap used to be silent, which made a truncated count read as the
// real count (a run reporting exactly 80 findings was at the cap, not at 80).
// Emit an explicit marker carrying the true total instead.
function capFindings(findings, cap, source) {
  if (findings.length <= cap) return findings;
  return [
    ...findings.slice(0, cap),
    {
      severity: "fail",
      type: "findings_truncated",
      message: `${source} produced ${findings.length} findings; only the first ${cap} are listed.`,
      true_total: findings.length,
      listed: cap,
      source,
    },
  ];
}

function validateCandidate(candidate) {
  const violations = [];
  const visiblePayload = clientVisiblePayload(candidate);
  const raw = JSON.stringify(visiblePayload);
  const rawInventoryClaims = raw.match(/\b\d{1,}\s+(rows|records|nodes|edges|files)\b/gi) ?? [];
  for (const claim of Array.from(new Set(rawInventoryClaims)).slice(0, 20)) {
    violations.push({
      severity: "fail",
      type: "raw_inventory_language",
      message: `Candidate contains inventory-count phrasing: ${claim}`,
    });
  }
  const technicalLeakage = raw.match(/\b[\w.-]+\.(?:csv|xlsx|json|parquet)\b|\b[A-Z]{2,}-V\d+-EVID-\d+\b|\bhome_knowledge_[a-z_]+\b|\brender_pack\b/gi) ?? [];
  for (const leak of Array.from(new Set(technicalLeakage)).slice(0, 20)) {
    violations.push({
      severity: "fail",
      type: "client_visible_technical_leakage",
      message: `Candidate exposes technical/source-internal wording: ${leak}`,
    });
  }
  const visualCount = countVisualContracts(candidate);
  if (visualCount < 12) {
    violations.push({
      severity: "fail",
      type: "weak_visual_contract",
      message: `Only ${visualCount} visual-contract markers found; expected rich visuals across dashboard, dimensions, relationships, evidence, and use cases.`,
    });
  }
  const relRaw = JSON.stringify(candidate.relationships ?? {});
  for (const required of [
    "enterprise_structure",
    "operating_model",
    "technology_dependency",
    "business_change_impact",
    "value_realization",
    "evidence_lineage",
  ]) {
    if (!relRaw.includes(required)) {
      violations.push({
        severity: "fail",
        type: "missing_relationship_projection",
        message: `Relationship writer did not include ${required}.`,
      });
    }
  }
  if (!candidate.story_architect?.governing_thesis && !JSON.stringify(candidate.story_architect ?? {}).includes("thesis")) {
    violations.push({
      severity: "fail",
      type: "missing_story_architecture",
      message: "Story architecture does not expose a governing thesis.",
    });
  }
  for (const finding of validateClosedEnums(candidate)) {
    violations.push(finding);
  }
  for (const finding of validateCoherenceGate(candidate)) {
    violations.push(finding);
  }
  for (const finding of validateDimensionTabs(candidate)) {
    violations.push(finding);
  }
  for (const finding of validateUseCaseShape(candidate)) {
    violations.push(finding);
  }
  return {
    status: violations.some((v) => v.severity === "fail") ? "candidate_failed" : "candidate_review_ready",
    violations,
  };
}

function clientVisiblePayload(candidate) {
  return {
    story_architect: candidate.story_architect,
    executive_brief: candidate.passes?.["02-executive-brief"]?.client_visible,
    industry_change: candidate.industry_change,
    use_cases: candidate.use_cases,
    dimensions: candidate.dimensions,
    relationships: candidate.relationships,
    evidence: candidate.evidence,
  };
}

function validateCoherenceGate(candidate) {
  const findings = [];
  const review = candidate.coherence_review ?? candidate.passes?.["08-coherence-review"]?.client_visible ?? {};
  for (const field of ["approval_recommendation", "reason", "violations", "source_sections_to_regenerate", "sections_to_regenerate"]) {
    if (!Object.hasOwn(review, field)) {
      findings.push({
        severity: "fail",
        type: "incomplete_coherence_review",
        message: `Claude coherence review did not return required field: ${field}.`,
      });
    }
  }
  const recommendation = asText(review.approval_recommendation ?? review.recommendation ?? review.status).toLowerCase();
  if (/\b(revise|resubmit|reject|not[_ -]?approve|do[_ -]?not[_ -]?approve|failed?)\b/.test(recommendation)) {
    findings.push({
      severity: "fail",
      type: "coherence_reviewer_blocked",
      message: `Claude coherence reviewer recommendation is not approvable: ${recommendation || "(missing)"}.`,
    });
  }
  const reviewText = JSON.stringify(review);
  if (/\b(high|critical|fail)\b/i.test(reviewText)) {
    findings.push({
      severity: "fail",
      type: "coherence_high_severity_findings",
      message: "Claude coherence review contains high/critical/fail findings; candidate cannot be review-ready.",
    });
  }
  if (!recommendation) {
    findings.push({
      severity: "fail",
      type: "missing_coherence_recommendation",
      message: "Claude coherence review did not return an approval_recommendation.",
    });
  }
  return findings;
}

function collectDimensionObjects(candidate) {
  const dimensions = [];
  const walk = (node) => {
    if (!node || typeof node !== "object") return;
    if (Array.isArray(node)) {
      node.forEach(walk);
      return;
    }
    if (typeof node.dimension_key === "string") dimensions.push(node);
    Object.values(node).forEach(walk);
  };
  walk(candidate.dimensions);
  return dimensions;
}

function validateDimensionTabs(candidate) {
  const findings = [];
  // A canary run (--dimensions) deliberately generates a subset. Checking
  // against the full 38-key catalog on a 3-dimension run produced 35 false
  // "missing" findings that swamped the real signal. Completeness against the
  // full catalog is still enforced for an unscoped run.
  const requestedKeys = candidate.requested_dimensions ?? null;
  const expectedKeys = new Set(
    requestedKeys ?? expandedDimensionCatalog.map((entry) => entry.key),
  );
  const dimensions = collectDimensionObjects(candidate);
  const actualKeys = new Set(dimensions.map((dimension) => asText(dimension.dimension_key)));
  for (const key of expectedKeys) {
    if (!actualKeys.has(key)) {
      findings.push({
        severity: "fail",
        type: "missing_expanded_dimension",
        message: `Missing authored expanded dimension page: ${key}.`,
      });
    }
  }
  const tabKeys = ["summary_tab", "data_tab", "relationship_tab", "gaps_tab", "evidence_tab"];
  for (const dimension of dimensions) {
    const dimensionKey = asText(dimension.dimension_key) || "(unknown)";
    for (const tabKey of tabKeys) {
      const value = dimension[tabKey];
      if (!value || typeof value !== "object" || Array.isArray(value)) {
        findings.push({
          severity: "fail",
          type: "dimension_tab_not_typed",
          message: `${dimensionKey}.${tabKey} must be a typed object, not prose-only text.`,
        });
      } else if (!classificationEnum.includes(asText(value.classification))) {
        findings.push({
          severity: "fail",
          type: "dimension_tab_missing_classification",
          message: `${dimensionKey}.${tabKey} must carry one allowed classification.`,
        });
      }
    }
    if (!dimension.primary_visual || typeof dimension.primary_visual !== "object" || Array.isArray(dimension.primary_visual)) {
      findings.push({
        severity: "fail",
        type: "dimension_primary_visual_not_typed",
        message: `${dimensionKey}.primary_visual must be a typed renderer contract.`,
      });
    }
  }
  return capFindings(findings, 500, "validateDimensionTabs");
}

function validateUseCaseShape(candidate) {
  const findings = [];
  const required = requiredUseCaseFields;
  const walk = (node, pathParts = []) => {
    if (!node || typeof node !== "object") return;
    if (Array.isArray(node)) {
      node.forEach((item, index) => {
        const pathName = [...pathParts, String(index)].join(".");
        const arrayName = pathParts[pathParts.length - 1] ?? "";
        if (/^(qualified_candidates|foundations|early_ideas)$/.test(arrayName)) {
          if (!item || typeof item !== "object" || Array.isArray(item)) {
            findings.push({
              severity: "fail",
              type: "use_case_item_not_typed",
              message: `${pathName} must be an object following the use-case schema.`,
            });
            return;
          }
          for (const field of required) {
            if (!asText(item[field]).trim()) {
              findings.push({
                severity: "fail",
                type: "use_case_schema_missing_field",
                message: `${pathName} is missing ${field}.`,
              });
            }
          }
        }
        walk(item, [...pathParts, String(index)]);
      });
      return;
    }
    Object.entries(node).forEach(([key, value]) => walk(value, [...pathParts, key]));
  };
  walk(candidate.use_cases, ["use_cases"]);
  return capFindings(findings, 500, "validateUseCaseShape");
}

function validateClosedEnums(candidate) {
  const findings = [];
  const allowedClassifications = new Set(classificationEnum);
  const allowedEvidenceMaturity = new Set(evidenceMaturityEnum);
  const allowedBusinessObjectClassifications = new Set(businessObjectClassificationEnum);
  const allowedVisualTypes = new Set(visualTypeEnum);
  const visualKeys = new Set([
    "primary_visual",
    "priority_matrix_visual",
    "graph_display_contract",
  ]);
  const walk = (node, pathParts = []) => {
    if (!node || typeof node !== "object") return;
    if (Array.isArray(node)) {
      node.forEach((item, index) => walk(item, [...pathParts, String(index)]));
      return;
    }
    const pathName = pathParts.join(".");
    const keyName = pathParts[pathParts.length - 1] ?? "";
    // Containing a visual is not the same as being one. A relationship
    // projection is a narrative object carrying a graph_display_contract child;
    // treating the wrapper as a visual demanded visual_type/data_points/
    // encoding of prose, one finding per missing field per projection, while
    // the contract child it holds was already well-formed and is walked below.
    const looksVisual =
      visualKeys.has(keyName) ||
      Boolean(node.visual_type) ||
      Boolean(node.executive_question && node.encoding);
    if (looksVisual) {
      const visualType = asText(node.visual_type).trim();
      if (!visualType) {
        findings.push({
          severity: "fail",
          type: "missing_visual_type",
          message: `${pathName || "visual"} is missing visual_type.`,
        });
      } else if (!allowedVisualTypes.has(visualType)) {
        findings.push({
          severity: "fail",
          type: "disallowed_visual_type",
          message: `${pathName || "visual"} uses ${visualType}; allowed: ${visualTypeEnum.join(", ")}.`,
        });
      }
      // A planning exhibit is judged on intent; a rendered visual is judged on
      // its full data-bound contract.
      const isPlanningVisual = pathParts.includes("signature_visuals");
      const requiredFields = isPlanningVisual
        ? requiredPlanningVisualFields
        : visualType === "relationship_graph"
          ? requiredRelationshipGraphFields
          : requiredVisualFields;
      for (const field of requiredFields) {
        if (!Object.hasOwn(node, field) || !asText(node[field]).trim()) {
          findings.push({
            severity: "fail",
            type: "visual_contract_missing_field",
            message: `${pathName || "visual"} is missing required visual field ${field}.`,
          });
        }
      }
      // The live canary showed visual_type set correctly to relationship_graph
      // while the object was still filled with chart fields (data_points,
      // encoding, annotation) rather than graph fields. requiredFields above
      // only checks for absence; it does not catch the wrong branch's fields
      // being present alongside the right branch's visual_type.
      if (!isPlanningVisual && (visualType === "relationship_graph" || allowedVisualTypes.has(visualType))) {
        const foreignFields = visualType === "relationship_graph" ? chartOnlyVisualFields : graphOnlyVisualFields;
        for (const field of foreignFields) {
          if (Object.hasOwn(node, field) && asText(node[field]).trim()) {
            findings.push({
              severity: "fail",
              type: "visual_contract_wrong_branch_field",
              message: `${pathName || "visual"} has visual_type=${visualType} but also carries ${field}, which belongs to the other visual branch.`,
            });
          }
        }
      }
    }
    if (Object.hasOwn(node, "classification")) {
      const classification = asText(node.classification).trim();
      if (!allowedClassifications.has(classification)) {
        findings.push({
          severity: "fail",
          type: "disallowed_classification",
          message: `${pathName || "candidate"} uses classification ${classification || "(empty)"}; allowed: ${classificationEnum.join(", ")}.`,
        });
      }
    }
    if (Object.hasOwn(node, "evidence_maturity")) {
      const evidenceMaturity = asText(node.evidence_maturity).trim();
      if (!allowedEvidenceMaturity.has(evidenceMaturity)) {
        findings.push({
          severity: "fail",
          type: "disallowed_evidence_maturity",
          message: `${pathName || "candidate"} uses evidence_maturity ${evidenceMaturity || "(empty)"}; allowed: ${evidenceMaturityEnum.join(", ")}.`,
        });
      }
    }
    if (Object.hasOwn(node, "business_object_classification")) {
      const businessObjectClassification = asText(node.business_object_classification).trim();
      if (!allowedBusinessObjectClassifications.has(businessObjectClassification)) {
        findings.push({
          severity: "fail",
          type: "disallowed_business_object_classification",
          message: `${pathName || "candidate"} uses business_object_classification ${businessObjectClassification || "(empty)"}; allowed: ${businessObjectClassificationEnum.join(", ")}.`,
        });
      }
    }
    Object.entries(node).forEach(([key, value]) => {
      if (typeof value === "object") walk(value, [...pathParts, key]);
    });
  };
  // Walk the assembled client-visible payload, not the whole candidate. Every
  // pass's client_visible is copied into story_architect/dimensions/use_cases/
  // relationships/evidence, so walking `candidate` validated the same object
  // twice under two different paths. The duplicates were not deduped (paths
  // differ) and they consumed the findings cap, hiding the assembled-payload
  // findings that actually matter behind their own copies.
  walk(clientVisiblePayload(candidate));
  const unique = new Map();
  for (const finding of findings) {
    unique.set(`${finding.severity}:${finding.type}:${finding.message}`, finding);
  }
  return capFindings(Array.from(unique.values()), 500, "validateClosedEnums");
}

function escapeHtml(value) {
  return asText(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function renderTextBlock(value) {
  if (value === null || value === undefined) return "";
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") return `<p>${escapeHtml(value)}</p>`;
  if (Array.isArray(value)) {
    return `<ul>${value.map((item) => `<li>${renderInline(item)}</li>`).join("")}</ul>`;
  }
  return `<pre>${escapeHtml(JSON.stringify(value, null, 2))}</pre>`;
}

function renderInline(value) {
  if (value === null || value === undefined) return "";
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") return escapeHtml(value);
  if (typeof value === "object") {
    const title = value.title || value.headline || value.name || value.executive_question || value.text;
    const body = value.narrative || value.executive_narrative || value.business_meaning || value.why_it_matters || value.summary || value.basis;
    if (title || body) {
      return `<strong>${escapeHtml(title)}</strong>${body ? `<span>${escapeHtml(body)}</span>` : ""}`;
    }
  }
  return escapeHtml(JSON.stringify(value));
}

function collectVisuals(candidate) {
  const visuals = [];
  const walk = (node, pathParts = []) => {
    if (!node || typeof node !== "object") return;
    if (Array.isArray(node)) {
      node.forEach((item, index) => walk(item, [...pathParts, String(index)]));
      return;
    }
    for (const [key, value] of Object.entries(node)) {
      if (/visual|graph_display_contract|primary_visual|priority_matrix/i.test(key)) {
        visuals.push({ path: [...pathParts, key].join("."), value });
      }
      if (typeof value === "object") walk(value, [...pathParts, key]);
    }
  };
  walk(candidate);
  return visuals.slice(0, 60);
}

function tenantHtml(candidate, validation) {
  const exec = candidate.passes?.["02-executive-brief"]?.client_visible ?? {};
  const story = candidate.story_architect ?? {};
  const visuals = collectVisuals(candidate);
  const violations = validation.violations;
  return `<!doctype html>
<html><head><meta charset="utf-8"><title>${escapeHtml(candidate.tenant.display_name)} Home V4 Candidate</title>
<style>
body{margin:0;background:#f7f5ef;color:#17213b;font:14px/1.45 Inter,Arial,sans-serif}
.shell{max-width:1180px;margin:0 auto;padding:32px}
.eyebrow{letter-spacing:.16em;text-transform:uppercase;color:#008873;font-weight:800;font-size:11px}
h1{font:700 38px/1.05 Georgia,serif;margin:8px 0 10px;color:#111827}
h2{font:700 22px/1.15 Georgia,serif;margin:0 0 12px}
.lead{font-size:17px;max-width:900px;color:#4b5563}
.grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px;margin:20px 0}
.card{background:#fff;border:1px solid #ddd8ce;border-radius:10px;padding:16px;box-shadow:0 1px 1px rgba(0,0,0,.03)}
.wide{grid-column:1/-1}.k{font-size:11px;text-transform:uppercase;letter-spacing:.12em;color:#68758f;font-weight:800}
.v{font:700 20px/1.2 Georgia,serif;color:#111827;margin-top:6px}
.pill{display:inline-flex;border:1px solid #c8ddd5;color:#08775f;border-radius:99px;padding:4px 9px;margin:3px;font-size:12px;background:#effaf6}
.visual{border:1px solid #d8e2ec;border-radius:12px;background:linear-gradient(180deg,#fff,#fbfcff);padding:14px;margin:10px 0}
.bar{height:8px;background:#e9edf3;border-radius:99px;overflow:hidden;margin-top:10px}.bar span{display:block;height:100%;background:#0f766e;width:65%}
pre{white-space:pre-wrap;background:#0d1324;color:#e6edf7;border-radius:10px;padding:12px;max-height:360px;overflow:auto;font-size:12px}
ul{padding-left:18px}.tabs{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:10px}.tab{background:#fff;border:1px solid #ded8cc;border-radius:8px;padding:12px}
.warn{background:#fff7ed;border-color:#fed7aa}.fail{background:#fef2f2;border-color:#fecaca}.ok{background:#ecfdf5;border-color:#a7f3d0}
</style></head><body><main class="shell">
<div class="eyebrow">Home Knowledge Pack V4 Candidate · ${escapeHtml(candidate.review_status)}</div>
<h1>${escapeHtml(candidate.tenant.display_name)}</h1>
<p class="lead">${escapeHtml(exec.one_sentence_read || story.governing_thesis || "Candidate generated for review.")}</p>
<section class="grid">
  <div class="card"><div class="k">Model</div><div class="v">${escapeHtml(candidate.model)}</div></div>
  <div class="card"><div class="k">Prompt Contract</div><div class="v">${escapeHtml(candidate.prompt_contract_version)}</div></div>
  <div class="card ${validation.status === "candidate_review_ready" ? "ok" : "warn"}"><div class="k">Validation</div><div class="v">${escapeHtml(validation.status)}</div></div>
  <div class="card wide"><h2>Governing Thesis</h2>${renderTextBlock(story.governing_thesis || story)}</div>
  <div class="card wide"><h2>Executive Brief</h2>${renderTextBlock(exec)}</div>
</section>
<section><h2>Visual Intelligence Contracts</h2><div class="grid">
${visuals.map((visual, index) => `<div class="visual"><div class="k">${escapeHtml(visual.path)}</div><div class="v">${escapeHtml(visual.value?.title || visual.value?.headline || visual.value?.executive_question || `Visual ${index + 1}`)}</div><div class="bar"><span style="width:${Math.max(20, Math.min(95, 45 + (index % 7) * 7))}%"></span></div>${renderTextBlock(visual.value)}</div>`).join("")}
</div></section>
<section><h2>Dimension Tab Content</h2><div class="tabs">
${(candidate.dimensions ?? []).map((batch) => `<div class="tab">${renderTextBlock(batch)}</div>`).join("")}
</div></section>
<section><h2>Coherence / Review Findings</h2>
${violations.length ? violations.map((v) => `<div class="card ${v.severity === "fail" ? "fail" : "warn"}"><strong>${escapeHtml(v.type)}</strong><p>${escapeHtml(v.message)}</p></div>`).join("") : `<div class="card ok">No automatic validation blockers. Human review still required before approval.</div>`}
</section>
</main></body></html>`;
}

function indexHtml(results) {
  return `<!doctype html><html><head><meta charset="utf-8"><title>Home Knowledge Pack V4 Review</title>
<style>body{font:14px/1.45 Inter,Arial,sans-serif;background:#f7f5ef;color:#17213b;margin:0}.shell{max-width:1100px;margin:0 auto;padding:34px}h1{font:700 40px/1.05 Georgia,serif;margin:0 0 8px}.grid{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:12px}.card{background:#fff;border:1px solid #ddd8ce;border-radius:10px;padding:14px}.k{font-size:11px;text-transform:uppercase;letter-spacing:.12em;color:#68758f;font-weight:800}.v{font:700 24px/1.1 Georgia,serif;margin-top:6px}.ok{border-color:#9ad8c0}.warn{border-color:#f0c27d}table{width:100%;border-collapse:collapse;background:#fff;border:1px solid #ddd8ce;border-radius:8px;overflow:hidden}th,td{padding:10px;border-bottom:1px solid #ebe7df;text-align:left}th{font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:#68758f}</style></head>
<body><main class="shell"><h1>Home Knowledge Pack V4 Candidate Review</h1><p>Prompt-first Claude authorship run. Candidate content is not approved for production until human review.</p>
<section class="grid">
<div class="card"><div class="k">Tenants</div><div class="v">${results.length}</div></div>
<div class="card"><div class="k">Model</div><div class="v">${escapeHtml(model)}</div></div>
<div class="card"><div class="k">Contract</div><div class="v">V4</div></div>
<div class="card"><div class="k">Review Only</div><div class="v">${reviewOnly ? "Yes" : "No"}</div></div>
<div class="card"><div class="k">Generated</div><div class="v">${new Date().toLocaleDateString()}</div></div>
</section>
<h2>Tenant Results</h2><table><thead><tr><th>Tenant</th><th>Status</th><th>Prompts</th><th>Visual markers</th><th>Findings</th><th>Review</th></tr></thead><tbody>
${results.map((r) => `<tr><td>${escapeHtml(r.display_name)}<br><small>${escapeHtml(r.tenant_key)}</small></td><td>${escapeHtml(r.validation_status)}</td><td>${r.prompt_count}</td><td>${r.visual_contract_count}</td><td>${r.violation_count}</td><td><a href="${escapeHtml(r.tenant_dir)}/review.html">open</a></td></tr>`).join("")}
</tbody></table></main></body></html>`;
}

function csv(results) {
  const header = ["tenant_key", "display_name", "validation_status", "violation_count", "visual_contract_count", "prompt_count", "source_hash"];
  return `${header.join(",")}\n${results.map((r) => header.map((key) => JSON.stringify(r[key] ?? "")).join(",")).join("\n")}\n`;
}

async function runPool(items, worker, size) {
  const results = [];
  let next = 0;
  async function work() {
    while (next < items.length) {
      const index = next++;
      results[index] = await worker(items[index], index);
    }
  }
  await Promise.all(Array.from({ length: Math.min(size, items.length) }, work));
  return results;
}

// ---------------------------------------------------------------------------
// Offline replay validation
// ---------------------------------------------------------------------------

// Accepts a candidate JSON file, a tenant directory, or a whole review-bundle
// root, so an operator can point at whatever they actually have on disk.
function discoverCandidateFiles(target) {
  const abs = path.resolve(target);
  if (!fs.existsSync(abs)) throw new Error(`--validate-candidate path does not exist: ${abs}`);
  if (fs.statSync(abs).isFile()) return [abs];
  const direct = path.join(abs, "candidate-home-knowledge-v4.json");
  if (fs.existsSync(direct)) return [direct];
  const found = [];
  const walkDir = (dir, depth) => {
    if (depth > 5) return;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const entryPath = path.join(dir, entry.name);
      if (entry.isDirectory()) walkDir(entryPath, depth + 1);
      else if (entry.name === "candidate-home-knowledge-v4.json") found.push(entryPath);
    }
  };
  walkDir(abs, 0);
  if (found.length === 0) throw new Error(`No candidate-home-knowledge-v4.json found under ${abs}`);
  return found.sort();
}

function groupFindings(violations) {
  const byType = new Map();
  for (const violation of violations ?? []) {
    const type = violation.type ?? "unknown";
    if (!byType.has(type)) {
      byType.set(type, { type, severity: violation.severity ?? "fail", count: 0, samples: [] });
    }
    const group = byType.get(type);
    group.count += 1;
    if (group.samples.length < 3) group.samples.push(violation.message);
    if (violation.true_total) group.true_total = violation.true_total;
  }
  return Array.from(byType.values()).sort((a, b) => b.count - a.count);
}

// A hint only. The authoritative answer is the stored-vs-recomputed delta
// below: a finding type that disappears when only the validator changed was a
// validator defect; one that survives a corrected validator is Claude output.
const findingOwnerHint = {
  findings_truncated: "tooling",
  visual_contract_missing_field: "claude_authorship",
  disallowed_visual_type: "claude_authorship",
  missing_visual_type: "claude_authorship",
  disallowed_classification: "claude_authorship",
  disallowed_evidence_maturity: "claude_authorship",
  disallowed_business_object_classification: "claude_authorship",
  client_visible_technical_leakage: "claude_authorship",
  raw_inventory_language: "claude_authorship",
  weak_visual_contract: "claude_authorship",
  missing_relationship_projection: "claude_authorship",
  missing_story_architecture: "claude_authorship",
  coherence_reviewer_blocked: "claude_reviewer_verdict",
  coherence_high_severity_findings: "claude_reviewer_verdict",
  missing_coherence_recommendation: "claude_reviewer_verdict",
  incomplete_coherence_review: "claude_reviewer_verdict",
};

function replayOneCandidate(file) {
  const candidate = JSON.parse(fs.readFileSync(file, "utf8"));
  // The stored validation is whatever validator version generated this bundle.
  const stored = candidate.validation ?? null;
  const recomputed = validateCandidate(candidate);
  const storedGroups = groupFindings(stored?.violations);
  const recomputedGroups = groupFindings(recomputed.violations);
  const storedByType = new Map(storedGroups.map((g) => [g.type, g.count]));
  const recomputedByType = new Map(recomputedGroups.map((g) => [g.type, g.count]));

  const delta = [];
  for (const type of new Set([...storedByType.keys(), ...recomputedByType.keys()])) {
    const before = storedByType.get(type) ?? 0;
    const after = recomputedByType.get(type) ?? 0;
    if (before === after) continue;
    delta.push({
      type,
      before,
      after,
      change: after - before,
      // Same candidate JSON in, different findings out => the validator moved,
      // not the model output.
      attribution: after < before ? "cleared_by_validator_change" : "introduced_by_validator_change",
    });
  }
  delta.sort((a, b) => a.change - b.change);

  return {
    candidate_file: file,
    tenant_key: candidate.tenant?.tenant_key ?? candidate.tenant?.key ?? path.basename(path.dirname(file)),
    display_name: candidate.tenant?.display_name ?? null,
    source_hash: candidate.source_hash ?? candidate.tenant?.source_hash ?? null,
    generated_prompt_contract_version: candidate.prompt_contract_version ?? null,
    validator_contract_version: promptContractVersion,
    stored_status: stored?.status ?? null,
    stored_violation_count: stored?.violations?.length ?? null,
    replay_status: recomputed.status,
    replay_violation_count: recomputed.violations.length,
    delta,
    findings_by_type: recomputedGroups.map((group) => ({
      ...group,
      owner_hint: findingOwnerHint[group.type] ?? "unclassified",
      persisted_through_validator_change: (storedByType.get(group.type) ?? 0) > 0,
    })),
    violations: recomputed.violations,
  };
}

function replayMarkdown(results) {
  const lines = [
    "# Home Knowledge V4 — offline replay validation",
    "",
    `- Replayed: ${new Date().toISOString()}`,
    `- Validator contract: ${promptContractVersion}`,
    "- Claude calls made: **0** (validators only, against stored candidate JSON)",
    "",
    "## Status",
    "",
    "| Tenant | Stored status | Stored findings | Replay status | Replay findings |",
    "|---|---|---:|---|---:|",
    ...results.map(
      (r) =>
        `| ${r.display_name ?? r.tenant_key} | ${r.stored_status ?? "n/a"} | ${r.stored_violation_count ?? "n/a"} | ${r.replay_status} | ${r.replay_violation_count} |`,
    ),
    "",
    "## Findings by type (replay)",
    "",
    "| Tenant | Finding type | Count | Owner hint | Survived validator change |",
    "|---|---|---:|---|---|",
  ];
  for (const result of results) {
    for (const group of result.findings_by_type) {
      lines.push(
        `| ${result.tenant_key} | ${group.type} | ${group.true_total ?? group.count} | ${group.owner_hint} | ${group.persisted_through_validator_change ? "yes" : "no (new)"} |`,
      );
    }
  }
  lines.push("", "## Validator-attributable delta (same JSON, different validator)", "");
  const anyDelta = results.some((r) => r.delta.length > 0);
  if (!anyDelta) {
    lines.push("No finding-count changed between the stored validation and this replay.");
  } else {
    lines.push("| Tenant | Finding type | Before | After | Attribution |", "|---|---|---:|---:|---|");
    for (const result of results) {
      for (const item of result.delta) {
        lines.push(
          `| ${result.tenant_key} | ${item.type} | ${item.before} | ${item.after} | ${item.attribution} |`,
        );
      }
    }
  }
  lines.push(
    "",
    "## How to read this",
    "",
    "- A finding type whose count drops with identical candidate JSON was a **validator defect**.",
    "- A finding type that survives a corrected validator is a **Claude output defect** and needs regeneration of that scope only.",
    "- `findings_truncated` means the real total exceeds the listed cap; use `true_total`.",
    "",
  );
  return lines.join("\n");
}

async function runReplay() {
  const files = discoverCandidateFiles(replayTarget);
  ensureDir(outDir);
  console.log(`[home-v4-replay] validating ${files.length} candidate file(s), no Claude calls`);
  const results = files.map((file) => {
    const result = replayOneCandidate(file);
    console.log(
      `[home-v4-replay] ${result.tenant_key}: stored=${result.stored_status ?? "n/a"}(${result.stored_violation_count ?? "?"}) -> replay=${result.replay_status}(${result.replay_violation_count})`,
    );
    return result;
  });
  writeJson(path.join(outDir, "replay-validation.json"), {
    replayed_at: new Date().toISOString(),
    validator_contract_version: promptContractVersion,
    output_schema_version: outputSchemaVersion,
    claude_calls: 0,
    source: path.resolve(replayTarget),
    results,
  });
  writeText(path.join(outDir, "REPLAY_VALIDATION.md"), replayMarkdown(results));
  for (const result of results) {
    const candidate = JSON.parse(fs.readFileSync(result.candidate_file, "utf8"));
    const tenantDir = path.join(outDir, "tenants", result.tenant_key);
    ensureDir(tenantDir);
    writeText(
      path.join(tenantDir, "review.html"),
      tenantHtml(candidate, { status: result.replay_status, violations: result.violations }),
    );
  }
  emitAcaProofBundleIfRequested(outDir);
  const failed = results.filter((r) => r.replay_status !== "candidate_review_ready");
  console.log("");
  console.log(
    failed.length === 0
      ? `HOME_V4_REPLAY_VERDICT: ALL_REVIEW_READY (${results.length} candidates)`
      : `HOME_V4_REPLAY_VERDICT: FAILED (${failed.length}/${results.length} candidates)`,
  );
  console.log(`[home-v4-replay] artifacts in ${outDir}`);
  if (failed.length > 0) process.exitCode = 1;
}

// Published Opus list pricing, USD per million tokens. Override with
// HOME_V4_PRICE_* when a negotiated rate applies.
// Opus 4.8 list pricing: $5/MTok input, $25/MTok output. Cache writes bill at
// 2x input for the 1h TTL used here; cache reads at 0.1x input.
const pricePerMillion = {
  input: Number(process.env.HOME_V4_PRICE_INPUT ?? 5),
  cache_write: Number(process.env.HOME_V4_PRICE_CACHE_WRITE ?? 10),
  cache_read: Number(process.env.HOME_V4_PRICE_CACHE_READ ?? 0.5),
  output: Number(process.env.HOME_V4_PRICE_OUTPUT ?? 25),
};

function emptyLedgerBucket() {
  return {
    calls: 0,
    repaired_calls: 0,
    empty_response_attempts: 0,
    input_tokens: 0,
    cache_creation_input_tokens: 0,
    cache_read_input_tokens: 0,
    output_tokens: 0,
    elapsed_ms: 0,
  };
}

function addUsage(bucket, response) {
  const usage = response.usage ?? {};
  bucket.calls += 1;
  if (response.repaired) bucket.repaired_calls += 1;
  bucket.input_tokens += usage.input_tokens ?? 0;
  bucket.cache_creation_input_tokens += usage.cache_creation_input_tokens ?? 0;
  bucket.cache_read_input_tokens += usage.cache_read_input_tokens ?? 0;
  bucket.output_tokens += usage.output_tokens ?? 0;
  bucket.elapsed_ms += response.elapsed_ms ?? 0;
}

function bucketCostUsd(bucket) {
  return (
    (bucket.input_tokens / 1e6) * pricePerMillion.input +
    (bucket.cache_creation_input_tokens / 1e6) * pricePerMillion.cache_write +
    (bucket.cache_read_input_tokens / 1e6) * pricePerMillion.cache_read +
    (bucket.output_tokens / 1e6) * pricePerMillion.output
  );
}

function runCostLedger() {
  const root = path.resolve(ledgerTarget);
  if (!fs.existsSync(root)) throw new Error(`--cost-ledger path does not exist: ${root}`);
  const responseFiles = [];
  const walkDir = (dir, depth) => {
    if (depth > 6) return;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const entryPath = path.join(dir, entry.name);
      if (entry.isDirectory()) walkDir(entryPath, depth + 1);
      else if (entry.name.endsWith(".json") && path.basename(dir) === "responses") {
        responseFiles.push(entryPath);
      }
    }
  };
  walkDir(root, 0);

  const total = emptyLedgerBucket();
  const byTenant = new Map();
  const byPass = new Map();
  for (const file of responseFiles.sort()) {
    let response;
    try {
      response = JSON.parse(fs.readFileSync(file, "utf8"));
    } catch {
      continue;
    }
    const tenant = path.basename(path.dirname(path.dirname(file)));
    // Truncated/empty attempts are wasted work but they ARE billed — the call
    // ran and burned its full output budget before being discarded. Count them
    // as waste *and* include their tokens, or the ledger under-reports spend.
    // The earlier pattern missed `<pass>.empty-response.json` (it only matched
    // `empty-response-attempt`), so those retries were being counted as
    // successful passes.
    if (/empty-response|raw-message/.test(path.basename(file))) {
      const bucket = byTenant.get(tenant) ?? emptyLedgerBucket();
      bucket.empty_response_attempts += 1;
      if (response?.usage) {
        addUsage(bucket, response);
        bucket.calls -= 1; // billed, but not a completed pass
        addUsage(total, response);
        total.calls -= 1;
      }
      byTenant.set(tenant, bucket);
      total.empty_response_attempts += 1;
      continue;
    }
    if (!response?.usage) continue;
    const tenantBucket = byTenant.get(tenant) ?? emptyLedgerBucket();
    addUsage(tenantBucket, response);
    byTenant.set(tenant, tenantBucket);
    const passKey = response.pass ?? response.id ?? "unknown";
    const passBucket = byPass.get(passKey) ?? emptyLedgerBucket();
    addUsage(passBucket, response);
    byPass.set(passKey, passBucket);
    addUsage(total, response);
  }

  const cachedInput = total.cache_read_input_tokens;
  const uncachedInput = total.input_tokens;
  const ledger = {
    measured_at: new Date().toISOString(),
    source: root,
    price_per_million_usd: pricePerMillion,
    total: { ...total, cost_usd: Number(bucketCostUsd(total).toFixed(2)) },
    by_tenant: Object.fromEntries(
      Array.from(byTenant.entries()).map(([key, bucket]) => [
        key,
        { ...bucket, cost_usd: Number(bucketCostUsd(bucket).toFixed(2)) },
      ]),
    ),
    by_pass_type: Object.fromEntries(
      Array.from(byPass.entries()).map(([key, bucket]) => [
        key,
        { ...bucket, cost_usd: Number(bucketCostUsd(bucket).toFixed(2)) },
      ]),
    ),
    prompt_cache_utilisation:
      uncachedInput + cachedInput === 0 ? null : cachedInput / (uncachedInput + cachedInput),
  };

  ensureDir(outDir);
  writeJson(path.join(outDir, "cost-ledger.json"), ledger);
  console.table(
    Object.entries(ledger.by_tenant).map(([tenant, bucket]) => ({
      tenant,
      calls: bucket.calls,
      repaired: bucket.repaired_calls,
      empty: bucket.empty_response_attempts,
      input: bucket.input_tokens,
      cache_read: bucket.cache_read_input_tokens,
      output: bucket.output_tokens,
      minutes: Number((bucket.elapsed_ms / 60000).toFixed(1)),
      usd: bucket.cost_usd,
    })),
  );
  console.log("");
  console.log(`HOME_V4_COST_LEDGER: calls=${total.calls} cost_usd=${ledger.total.cost_usd}`);
  console.log(
    `HOME_V4_CACHE_UTILISATION: ${ledger.prompt_cache_utilisation === null ? "n/a" : `${(ledger.prompt_cache_utilisation * 100).toFixed(1)}%`}`,
  );
  if (ledger.prompt_cache_utilisation === 0) {
    console.log(
      "[home-v4-ledger] WARNING: zero prompt-cache reads. Every call re-sent its full context at full input price.",
    );
  }
  console.log(`[home-v4-ledger] artifacts in ${outDir}`);
}

async function main() {
  if (ledgerMode) {
    runCostLedger();
    return;
  }
  if (replayMode) {
    await runReplay();
    return;
  }
  if (!packetOnly && !process.env.ANTHROPIC_API_KEY) {
    throw new Error("ANTHROPIC_API_KEY is required; refusing to fabricate candidate content.");
  }
  const Anthropic = packetOnly ? null : (await import("@anthropic-ai/sdk")).default;
  const client = packetOnly ? null : new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const tenants = tenantArg === "all"
    ? canonicalTenantOrder
    : tenantArg.split(",").map((t) => t.trim()).filter(Boolean);
  ensureDir(outDir);
  writeJson(path.join(outDir, "run-metadata.json"), {
    run_stamp: runStamp,
    model,
    prompt_contract_version: promptContractVersion,
	    output_schema_version: outputSchemaVersion,
	    tenant_order: tenants,
	    review_only: reviewOnly,
	    packet_only: packetOnly,
	    max_tokens: maxTokens,
    concurrency,
  });
  console.log(`[home-v4] writing review artifacts to ${outDir}`);
  const results = await runPool(tenants, async (tenant) => {
    console.log(`[home-v4] generating ${tenant}`);
    const result = await processTenant(client, tenant);
    console.log(`[home-v4] done ${tenant}: ${result.validation_status}, visuals=${result.visual_contract_count}, findings=${result.violation_count}`);
    return result;
  }, concurrency);
  writeJson(path.join(outDir, "tenant-results.json"), results);
  writeText(path.join(outDir, "tenant-results.csv"), csv(results));
  writeText(path.join(outDir, "index.html"), indexHtml(results));
  const digest = [
    "# Home Knowledge Pack V4 Candidate Review",
    "",
    `- Generated: ${new Date().toISOString()}`,
    `- Model: ${model}`,
    `- Prompt contract: ${promptContractVersion}`,
    `- Output schema: ${outputSchemaVersion}`,
    `- Review only: ${reviewOnly}`,
    "",
    "## Results",
    "",
    "| Tenant | Status | Prompts | Visual markers | Findings |",
    "|---|---:|---:|---:|---:|",
    ...results.map((r) => `| ${r.display_name} (${r.tenant_key}) | ${r.validation_status} | ${r.prompt_count} | ${r.visual_contract_count} | ${r.violation_count} |`),
    "",
    "## Prompt-First Authorship",
    "",
    "Claude authored all client-visible candidate text inside the per-tenant response JSON files. The HTML review renderer displays, arranges, and styles that content; it does not rewrite or substitute client-facing narrative.",
    "",
    "## Review Notes",
    "",
    "- Candidate packs are not production-approved.",
    "- Any validation finding should be resolved by prompt/context regeneration, not renderer patching.",
    "- Relationship visuals must be reviewed as graph-native executive artifacts, not row-count summaries.",
  ].join("\n");
  writeText(path.join(outDir, "PROMPT_AND_OUTPUT_REVIEW_DIGEST.md"), `${digest}\n`);
  emitAcaProofBundleIfRequested(outDir);
  console.log(`[home-v4] complete ${outDir}`);
}

main().catch((error) => {
  console.error(error);
  try {
    ensureDir(outDir);
    writeJson(path.join(outDir, "failure-summary.json"), {
      failed_at: new Date().toISOString(),
      message: error?.message ?? String(error),
      stack: error?.stack ?? null,
      model,
      prompt_contract_version: promptContractVersion,
      output_schema_version: outputSchemaVersion,
    });
    emitAcaProofBundleIfRequested(outDir);
  } catch (bundleError) {
    console.error("[home-v4] failed to emit failure proof bundle", bundleError);
  }
  process.exit(1);
});
