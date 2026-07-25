#!/usr/bin/env node
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { assertIntegratedPromptPreflight } from "./assert-integrated-prompt-preflight.mjs";
import { assertEnterpriseBookPromptPreflight } from "./assert-enterprise-book-prompt-preflight.mjs";
import { validateIntegratedManifest } from "./validate-integrated-manifest.mjs";

const __filename = fileURLToPath(import.meta.url);
const repoRoot = path.resolve(path.dirname(__filename), "../..");
const runStamp = new Date().toISOString().replace(/[:.]/g, "-");
const promptContractVersion = "home-knowledge-v4-business-transformation-prompt-first-20260723-single-dimension-v1";
const outputSchemaVersion = "home-knowledge-v4-candidate-review-v2";
const defaultOutDir = path.join(repoRoot, "reports", "home-knowledge-v4-review", runStamp);
const outDir = getArg("--out-dir", defaultOutDir);
const model = getArg("--model", process.env.HOME_KNOWLEDGE_V4_MODEL || "claude-opus-4-8");
// Enterprise Book architecture: one call producing ONE enterprise story with
// shared sections + tagged conclusions; all 38 dimension pages (including
// every visual_binding) are then derived deterministically by
// renderDimensionsFromBook(), never authored by Claude. Additive: gated
// behind its own flag so the just-proven integrated path stays intact.
// Declared here (ahead of maxTokens below) because book mode's real
// five-jobs synthesis depth needs materially more output room than the
// other, more compact pass types.
const bookMode =
  process.env.HOME_KNOWLEDGE_V4_BOOK_MODE === "true" || process.argv.includes("--book-mode");
// Opus 4.8 allows 128K output. The old 12000 default was truncating tool calls
// mid-generation: a call that hit the cap before emitting `client_visible`
// returned a tool input of just `{"phase": ...}`, which the code read as an
// empty response and retried in full. It failed hardest on the largest tenant
// (Meridian, 4 of 16 calls) and not at all on the smallest — deterministic
// scaling with tenant size, not flakiness. Streaming is required above ~16K or
// the SDK hits an HTTP timeout. Book mode defaults higher than the other pass
// types: a real five-jobs synthesis (understand -> compare vs industry ->
// material gaps/advantages -> integrated POV -> decisions/exhibits) across
// 38 dimensions needs more room than a compact per-dimension manifest did,
// and running into this cap is exactly the failure mode above -- explicit
// --max-tokens still always wins.
const maxTokens = Number(getArg("--max-tokens", process.env.HOME_KNOWLEDGE_V4_MAX_TOKENS || (bookMode ? "64000" : "32000")));
const tenantArg = process.env.HOME_KNOWLEDGE_V4_TENANT || getArg("--tenant", "all");
const concurrency = Math.max(1, Number(getArg("--concurrency", "2")));
const reviewOnly = !process.argv.includes("--write-db");
const packetOnly = process.argv.includes("--packet-only");
// Zero-cost runtime-path proof: assemble the EXACT integrated_dimensions
// prompt the deployed job would send (same makePrompt() call, real packet,
// real registry, real evidence_index, real bindings), run
// assert-integrated-prompt-preflight.mjs against it, and exit -- without
// ever constructing an Anthropic client or importing the SDK. Because
// integrated_dimensions needs assembled.story_architect (normally Call 1's
// output), preflight mode loads a real, previously-captured story
// architecture fixture instead of calling Claude for it -- everything else
// in the payload (registry, evidence_index, bindings, visual contract,
// hash, dimension list) is the real, current, code-computed value.
const preflightMode = process.argv.includes("--preflight");
// Integrated Home Book architecture: one call for all dimension manifests
// instead of one call per dimension. See makePrompt's "integrated_dimensions"
// pass type and the deterministic_dataset_registry on the context packet.
const integratedMode =
  process.env.HOME_KNOWLEDGE_V4_INTEGRATED === "true" || process.argv.includes("--integrated");
// Offline replay: re-run every validator against already-generated candidate
// JSON without calling Claude. This is the control point that lets a validator
// or schema change be proven against stored output instead of being tested by
// paying for another full tenant generation.
const replayTarget = getArg("--validate-candidate", null);
const replayMode = Boolean(replayTarget);
// Offline re-render: take an already-generated (real, Claude-produced)
// candidate's stored enterprise_book and re-run the pure-code
// renderDimensionsFromBook() against it using today's dataset registry --
// no Claude call. This is how a deterministic-renderer change (a new
// VISUAL_RENDER_RULES entry, a resolveVisualDataPoints fix) gets proven
// against real candidates already on disk without paying for regeneration.
const reresolveTarget = getArg("--reresolve-visuals", null);
const reresolveMode = Boolean(reresolveTarget);
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

// Stable, citable fact base for the industry-comparison job (JOB 2 below).
// Distinct from compactRows()'s generic picked-field approach because this
// specifically needs a STABLE ID per row so Claude can cite a real
// benchmark_refs value instead of writing "the industry assumes..." with
// nothing to check it against -- mirrors evidence_index's evidence_id
// contract. Tenant CSV schemas are not uniform: meridian-health's
// 15_industry_context_patterns.csv uses a newer record_id/context_item
// shape; every other tenant uses an older pattern_name/original_row_id
// shape. pick() across both rather than assuming one -- the previous
// picked-key list (industry_context, pattern_name, signals,
// business_function, module_next_actions, benchmark_range, known_failure_modes)
// matched neither schema's actual column names for the fields that mattered
// (the pattern's own name/title), so Claude was receiving fact-base rows
// with no identifiable pattern and no citable ID.
function buildIndustryFactBase(pack) {
  const rows = rowsFor(pack, "industry");
  return rows.slice(0, 18).map((row, index) => {
    const patternName = pick(row, ["pattern_name", "context_item", "business_name"]);
    if (!patternName) return null;
    return {
      pattern_id: pick(row, ["record_id", "original_row_id"]) || `pattern-${index + 1}`,
      pattern_name: patternName,
      industry: pick(row, ["industry_context", "industry"]),
      signals: pick(row, ["signals", "business_context", "applicability"]),
      evidence_basis: pick(row, ["evidence_basis"]),
      caveats: pick(row, ["caveats", "known_gaps"]),
      module_next_actions: pick(row, ["module_next_actions"]),
    };
  }).filter(Boolean);
}

// Same stable-ID need as buildIndustryFactBase, for the metric rows a
// pattern's comparison may cite. has_real_value is derived from whether a
// real value is present in baseline/actual/target text -- not from the
// baseline_available/actual_available flag columns, which only exist on
// meridian-health's newer 14_metrics_outcomes.csv schema and are simply
// absent (not false) on every other tenant's metrics file.
function buildMetricsFactBase(pack) {
  const rows = rowsFor(pack, "metrics");
  return rows.slice(0, 40).map((row, index) => {
    const metricName = pick(row, ["metric_name", "name", "use_case"]);
    if (!metricName) return null;
    const baselineValue = pick(row, ["baseline_value"]);
    const actualValue = pick(row, ["actual_value"]);
    const targetValue = pick(row, ["target_value"]);
    return {
      metric_id: pick(row, ["record_id", "original_row_id"]) || `metric-${index + 1}`,
      metric_name: metricName,
      business_function: pick(row, ["business_function", "metric_domain"]),
      baseline_value: baselineValue || null,
      actual_value: actualValue || null,
      target_value: targetValue || null,
      has_real_value: Boolean(baselineValue || actualValue),
      known_gaps: pick(row, ["known_gaps", "caveat"]),
    };
  }).filter(Boolean);
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
      // Real, deterministic application-ownership coverage from the reconciled
      // tower-standardized-v1 source (see loadTenantApplicationOwnershipFacts).
      // If present, this is authoritative for any ownership-coverage claim in
      // the apps dimension's narrative/gaps/relationship/evidence text --
      // do not claim ownership is universally unassigned or "to confirm" when
      // owner_coverage_pct is above 0; state the actual split instead.
      application_ownership_coverage: pack.__application_ownership_facts ?? null,
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
      metrics_outcomes: buildMetricsFactBase(pack),
      industry_patterns: buildIndustryFactBase(pack),
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
          "Return one dimension object directly in client_visible. summary_tab must be an object with headline, executive_read, classification. data_tab must be an object with headline, filters, rows, evidence_boundary, classification. relationship_tab must be an object with headline, graph_nodes, graph_edges, paths_to_show, missing_relationships, classification. gaps_tab must be an object with decision_gaps, why_it_matters, evidence_to_collect, owner_hint, classification. evidence_tab must be an object with source_inventory, what_it_proves, what_it_does_not_prove, next_evidence_request, classification. primary_visual must include visual_type, title, executive_question, classification, data_points, encoding, annotation, evidence_boundary, empty_state. Keep each tab concise. Never write template filenames, evidence IDs, source table names, or raw inventory counts in any tab." +
          (packet.business_context_samples.application_ownership_coverage
            ? " If writing the apps dimension: application_ownership_coverage below is deterministic, verified data — the applications_with_named_owner / total_applications split is a fact, not an estimate. Do not state or imply ownership is universally unassigned, unknown, or 'to confirm' across the whole estate; state the real coverage split (e.g. as a percentage or a business-coverage phrase) in summary_tab, gaps_tab, and relationship_tab consistently. gaps_tab may correctly note that the remaining share lacks ownership. relationship_tab's Owners node group must reflect both the known-owner population and the genuinely unresolved remainder, not only a single missing_evidence node."
            : ""),
      },
      common,
      story_architecture: assembled.story_architect,
      dimensions: packet.dimension_summary.filter((d) => pass.dimensions.includes(d.key)),
      rows_by_dimension: Object.fromEntries(pass.dimensions.map((key) => [key, (packet.business_context_samplesForDimension?.[key] ?? rowsForDimensionPacket(packet, key)).slice(0, 8)])),
      relationship_samples: packet.business_context_samples.relationship_samples,
      evidence_sources: packet.business_context_samples.evidence_sources,
      application_ownership_coverage: pass.dimensions.includes("apps")
        ? packet.business_context_samples.application_ownership_coverage
        : undefined,
    };
  }
  if (pass.type === "integrated_dimensions") {
    // The old chart contract (visual_contract_rules, requiring data_points/
    // encoding/annotation) is structurally excluded from `common` for this
    // pass below -- not merely told to be ignored. A contradicting
    // instruction sitting next to an "ignore it" notice is exactly the
    // shape of bug that let attempt 1 fabricate data_points: the field was
    // present, mandatory-sounding, and the override was prose, not schema.
    // See assert-integrated-prompt-preflight.mjs's
    // preflight.stale_visual_contract_rules_present check.
    const integratedCommon = { ...common };
    delete integratedCommon.visual_contract_rules;
    return {
      task: "Call 5-integrated: Home Book — all dimension manifests in one call",
      contract_version: DIMENSION_DATASET_BINDINGS_VERSION,
      instruction:
        "Write ONE cohesive enterprise story across every listed dimension, not independent " +
        "essays. Each dimension gets a concise page manifest. Never reproduce rows, records, " +
        "or numeric series from any dataset — reference dataset_id only; the renderer attaches " +
        "real values deterministically after you respond. The only visual contract for this " +
        "pass is visual_binding_contract below; common.visual_contract_rules from other passes " +
        "in this pipeline does not apply here and has been omitted from this payload.",
      visual_binding_contract: {
        instruction:
          "visual_binding is a DECLARATIVE INSTRUCTION for the renderer, not a rendered chart. " +
          "It must contain ONLY: dataset_id, visual_type, dimension, measure, filters, sort, " +
          "limit, title, annotation_instruction, format, orientation, interpretation. It must " +
          "NEVER contain data_points, series, values, percentages, computed_totals, x_values, " +
          "y_values, or any other computed/numeric figure — those come from the real dataset at " +
          "render time, and you have not seen the real rows. title and annotation_instruction " +
          "are plain presentation text (e.g. a chart title, or 'highlight the largest category') " +
          "and must never themselves state a number, percentage, or figure you were not given. " +
          "dataset_id must be the primary_dataset named in dimension_dataset_bindings for this " +
          "dimension_key, or omitted entirely if that map has no entry for this dimension_key. " +
          "dimension/measure must be chosen from that dataset's available_dimensions/" +
          "available_measures in deterministic_dataset_registry — never invent a field name. " +
          "visual_type must be one from common.visual_type_enum.",
        shape: {
          dataset_id: "string, from dimension_dataset_bindings[dimension_key].primary_dataset — omit visual_binding entirely if no binding exists",
          visual_type: "string, from common.visual_type_enum",
          dimension: "string, from the dataset's available_dimensions",
          measure: "string, from the dataset's available_measures",
          filters: "array, may be empty",
          sort: "'ascending' | 'descending'",
          limit: "integer, max categories to show",
          title: "optional string, a chart title with no numbers or figures in it",
          annotation_instruction: "optional string, a presentation instruction with no numbers or figures in it (e.g. 'highlight the largest category')",
          format: "optional string, a display format hint (e.g. 'currency', 'percent-of-total') — not a computed value",
          orientation: "optional string, e.g. 'horizontal' | 'vertical'",
          interpretation: "one sentence: what this visual should help leadership see",
        },
      },
      output_requirements: {
        fields: ["enterprise_story", "dimensions"],
        enterprise_story_fields: ["title", "thesis", "narrative_arc", "strategic_agenda"],
        per_dimension_fields: [
          "dimension_key", "chapter", "title", "headline", "executive_takeaway",
          "key_insights", "strategic_implication", "recommended_actions", "evidence_refs",
          "visual_binding", "data_binding", "relationship_binding", "gap_binding",
          "related_dimensions", "confidence_statement",
        ],
        hard_limits:
          "title: one line. executive_takeaway: 40-80 words. key_insights: 3-5 objects " +
          "{statement, evidence_refs}. strategic_implication: one statement. " +
          "recommended_actions: 1-3 items. evidence_refs and key_insights[].evidence_refs: " +
          "evidence_id values from evidence_index only — an ID not in that list is invalid, " +
          "never invent one; empty array if no evidence_index entry supports the claim. " +
          "data_binding/relationship_binding/gap_binding: {dataset_id} from dimension_dataset_bindings " +
          "only, or omit the field. No enterprise background per dimension — that belongs in " +
          "enterprise_story. No generic introductions, no restated navigation labels, no raw " +
          "records, no methodology explanations. Keep total response compact: target well under " +
          "24000 output tokens across all 38 dimensions combined.",
      },
      common: integratedCommon,
      story_architecture: assembled.story_architect,
      dimensions: packet.dimension_summary,
      dimension_dataset_bindings: DIMENSION_DATASET_BINDINGS,
      deterministic_dataset_registry: packet.deterministic_dataset_registry ?? [],
      material_aggregates: packet.business_context_samples.application_ownership_coverage
        ? { applications: packet.business_context_samples.application_ownership_coverage }
        : {},
      relationship_samples: packet.business_context_samples.relationship_samples,
      evidence_index: packet.evidence_index ?? [],
    };
  }
  if (pass.type === "enterprise_book") {
    const bookCommon = { ...common };
    delete bookCommon.visual_contract_rules;
    // Review finding, confirmed against source: packet.dimension_summary's
    // `summary`/`status` fields come from a legacy 19-entry DIMS array that
    // pre-dates the 38-key catalog. For skyharbor-air, 6 of those 19 entries
    // carry a byte-identical duplicate summary belonging to a DIFFERENT
    // dimension (functions/budget share one string; profile/ai share
    // another; risks/opev share a third), and `apps` names a stale figure
    // ("Fourteen systems") against a real registry of 900 rows. Sending
    // Claude that field and hoping it notices/repairs the contamination is
    // exactly the failure mode this architecture exists to remove. Book
    // mode never sends `summary`/`status` at all -- only clean, code-derived
    // identity and routing metadata. Real understanding comes from
    // context_packet.business_context_samples below, not a pre-digested
    // (and here, broken) narrative layer.
    const cleanDimensionCatalog = packet.dimension_summary.map((d) => ({
      key: d.key,
      name: d.name,
      business_source_coverage: d.business_source_coverage,
    }));
    // Review finding: industry comparison was previously buried as one more
    // field inside context_packet, with no instruction to actually use it
    // comparatively -- Claude was reusing pre-authored "industry
    // realization" assertions from elsewhere in the pipeline rather than
    // doing its own comparison against a real fact base. Pulled out here as
    // an explicit, named input for job 2 below.
    const industryFactBase = packet.business_context_samples.industry_patterns ?? [];
    const metricsFactBase = packet.business_context_samples.metrics_outcomes ?? [];
    return {
      task: "Enterprise Book — one enterprise knowledge book, not 38 pages",
      contract_version: DIMENSION_DATASET_BINDINGS_VERSION,
      instruction:
        "You are a senior strategy partner producing an enterprise knowledge book, not a " +
        "page-layout engine authoring 38 independent manifests. Do this in five explicit " +
        "jobs, in order, and let the later jobs actually depend on the earlier ones -- " +
        "this is a synthesis, not five unrelated sections:\n" +
        "JOB 1 -- UNDERSTAND THE ENTERPRISE. Read context_packet fully: what this tenant " +
        "actually does, how it is organized, where its real data is thin versus thick.\n" +
        "JOB 2 -- COMPARE WITH THE INDUSTRY. industry_fact_base below is a real, structured " +
        "set of industry patterns -- not decoration and not something to restate. For each " +
        "pattern actually relevant to this tenant, cite it by pattern_id in benchmark_refs " +
        "and evaluate the tenant separately across up to seven dimensions: " +
        "strategic_intent, operational_capability, data_foundation, technology_readiness, " +
        "governance_and_controls, measurement_and_value, scale_readiness. Only include the " +
        "dimensions that pattern actually bears on. Make a calibrated, independent judgment " +
        "per dimension -- do not default to 'behind', and do not manufacture balance by " +
        "forcing variety across positions either. A tenant that is genuinely behind on " +
        "every relevant dimension of a pattern stays behind on all of them; the defect this " +
        "rule exists to prevent is not 'everything says behind', it is collapsing a REAL " +
        "mix (strong in one dimension, weak in another) into one flat label. Set " +
        "overall_position to 'mixed' whenever the per-dimension positions actually differ " +
        "(some ahead-or-at_parity, some behind) -- never 'behind' when a dimension is ahead " +
        "or at_parity, and never 'ahead'/'at_parity' when a dimension is behind. Before " +
        "writing each comparison, reconcile it against this book's own material_advantages " +
        "and material_gaps (jobs 1/3): if the same capability appears in " +
        "material_advantages, set advantage_to_preserve to name it and explain which " +
        "distinct dimensions still trail -- never describe a capability elsewhere called an " +
        "advantage as wholly behind with no acknowledgment. Where metrics_fact_base below " +
        "contains a metric genuinely about this pattern (matched by topic, not by name " +
        "string), cite its metric_id and report ONLY the real baseline_value/actual_value/" +
        "target_value it carries, with evidence_status 'available' (has_real_value: true) " +
        "or 'partial'/'missing' otherwise plus a required_next_step naming what baseline is " +
        "needed. Never invent a metric, a prior-period value, a trend direction, a " +
        "confidence rating, or a benchmark range that is not present in metrics_fact_base or " +
        "industry_fact_base -- the data model does not yet capture historical or external- " +
        "benchmark figures, so do not imply one exists. Each pattern's explanation text must " +
        "do real analytical work (what the fact base's yardstick requires, what the tenant " +
        "specifically has, what is missing or stronger, why the difference matters) and must " +
        "not reuse the same opening sentence structure as another pattern's explanation in " +
        "this book -- vary the construction, this is advisory judgment, not a filled-in " +
        "template. Do " +
        "not summarize the fact base; use it as a yardstick.\n" +
        "JOB 3 -- IDENTIFY THE FEW MATERIAL GAPS AND ADVANTAGES. From jobs 1-2, name the " +
        "small number of differences that actually matter to leadership -- material_gaps " +
        "and material_advantages below. 'Few' is deliberate: 3-7 of each, not one per " +
        "dimension. A gap or advantage that doesn't change what leadership should decide " +
        "does not belong here.\n" +
        "JOB 4 -- DEVELOP AN INTEGRATED POINT OF VIEW. executive_narrative is your thesis: " +
        "given jobs 1-3, what is the one governing argument, and what tensions does it " +
        "have to resolve? Every later section and conclusion should trace back to this " +
        "thesis, not contradict or ignore it.\n" +
        "JOB 5 -- TRANSLATE THE POV INTO DECISIONS AND EXHIBITS. sections, conclusions, " +
        "decisions, recommendations are where the thesis becomes specific and actionable. " +
        "'Exhibits' -- charts and relationship/dependency graphs -- are NOT something you " +
        "produce: for the 6 dimensions with a real governed dataset and the handful with " +
        "real relationship evidence (the apps/technology/data dependency cluster), the " +
        "renderer attaches a real chart or dependency graph deterministically after you " +
        "respond, using the real underlying data. Your job is the interpretation those " +
        "exhibits will sit next to, not the exhibit itself.\n" +
        "Structural rules that apply throughout: a conclusion that is true of both 'apps' " +
        "and 'org' (for example, an ownership-coverage figure) must be written ONCE, " +
        "tagged applies_to_dimensions: ['apps','org'] -- never write it twice with " +
        "different wording; that is the exact drift this architecture exists to prevent. " +
        "Tell one story with the data available -- do not force uniform coverage onto a " +
        "dimension that has little to say; a dimension with few applicable conclusions " +
        "should stay short. Never reproduce rows, records, or numeric series from any " +
        "dataset; reference dataset facts only through evidence_refs against " +
        "evidence_index. Evidence semantics: evidence_index entries vary in specificity " +
        "-- some have a real descriptive title, many have only a generic placeholder " +
        "locator (e.g. 'synthetic locator 4') behind a broad category tag. A technically " +
        "valid evidence_id is not automatically sufficient support for a precise, " +
        "specific claim. If the best available evidence for a conclusion is a " +
        "low-specificity placeholder, either write a more general claim that placeholder " +
        "genuinely supports, or mark evidence_status: 'not_evidenced' instead of citing a " +
        "citation-shaped ID that doesn't actually establish the specific fact. Never treat " +
        "a broad supports category (risk/budget/value/adoption/architecture/governance) as " +
        "license to cite it for any claim in that category.\n" +
        "HARD RULE, checked mechanically after you respond, every conclusion, no exceptions: " +
        "evidence_refs and evidence_status are a pair, not two independent fields -- exactly " +
        "one of these two states is valid, nothing else:\n" +
        "  (a) evidence_refs has >=1 real ID from evidence_index that actually supports THIS " +
        "statement, AND evidence_status: 'evidenced'.\n" +
        "  (b) evidence_refs is [], AND evidence_status: 'not_evidenced', AND " +
        "evidence_gap_note names in one short phrase what evidence would be needed (e.g. " +
        "'no source document ties initiatives to named executive sponsors').\n" +
        "WRONG (a real defect this exact rule exists to catch): evidence_status: 'evidenced' " +
        "with evidence_refs: [] -- claiming support while citing none. WRONG: evidence_status " +
        "omitted entirely -- silence is not disclosure. If you are not certain a claim is " +
        "evidenced, default to (b); a smaller number of honestly-marked conclusions is " +
        "correct, a larger number of falsely-evidenced ones is not. OVERRIDE NOTICE: " +
        "common.visual_contract_rules described the OLD per-dimension chart contract used " +
        "elsewhere in this pipeline -- it has been removed from this payload and does not " +
        "apply here.",
      output_requirements: {
        fields: ["executive_narrative", "industry_comparison", "material_gaps", "material_advantages", "sections", "conclusions", "decisions", "recommendations", "open_questions"],
        executive_narrative_fields: [
          "title", "thesis", "narrative_arc", "strategic_agenda", "strategic_tensions",
        ],
        industry_comparison_shape:
          "An array, job 2's output. One item per industry_fact_base pattern that is " +
          "actually relevant -- skip patterns that don't apply rather than forcing a " +
          "position on all of them. Each item: {pattern_id (the cited industry_fact_base " +
          "pattern_id), pattern (its name), overall_position " +
          "(ahead|at_parity|mixed|behind|not_applicable), dimensions, metrics, " +
          "advantage_to_preserve, gap_to_close, executive_implication, benchmark_refs}. " +
          "dimensions: array of {dimension (strategic_intent|operational_capability|" +
          "data_foundation|technology_readiness|governance_and_controls|" +
          "measurement_and_value|scale_readiness), position " +
          "(ahead|at_parity|behind|not_evidenced|not_applicable), explanation, " +
          "evidence_refs} -- only the dimensions this pattern actually bears on, each " +
          "independently judged (see the HARD RULE on overall_position below). metrics: " +
          "OPTIONAL array, only when a metrics_fact_base row is genuinely about this " +
          "pattern -- {metric_id, metric_name, baseline_value, actual_value, target_value, " +
          "evidence_status (available|partial|missing), required_next_step, evidence_refs}. " +
          "baseline_value/actual_value/target_value must be copied verbatim from that " +
          "metrics_fact_base row (null if the row doesn't carry one) -- never a number you " +
          "computed or estimated. evidence_status 'available' only when has_real_value is " +
          "true on that row; otherwise 'partial' or 'missing' with required_next_step " +
          "naming the baseline needed. Omit metrics entirely for a pattern with no " +
          "genuinely matching metric row -- do not force one. advantage_to_preserve/" +
          "gap_to_close: short strings, omit (or null) when not applicable -- " +
          "advantage_to_preserve must be set whenever this pattern's capability also " +
          "appears in material_advantages. benchmark_refs: >=1 industry_fact_base " +
          "pattern_id -- required, never a comparison with no cited benchmark.\n" +
          "HARD RULE on overall_position, checked mechanically: it must reflect the " +
          "dimensions actually judged (ignoring not_evidenced/not_applicable) -- all " +
          "behind means overall_position 'behind', all ahead means 'ahead', all at_parity " +
          "means 'at_parity', ANY mix of behind with ahead-or-at_parity means 'mixed'. " +
          "overall_position 'behind' while advantage_to_preserve is set is also invalid -- " +
          "that is the exact contradiction (a stated advantage flattened into a wholesale " +
          "'behind' label) this schema exists to prevent.",
        material_gaps_and_advantages_shape:
          "material_gaps and material_advantages: job 3's output, each an array of " +
          "{id, statement, why_it_matters_to_leadership, applies_to_dimensions, " +
          "evidence_refs}. 3-7 items each -- these are the few things that actually " +
          "change a decision, not a complete inventory.",
        sections_shape:
          `An object keyed by book_sections id -- one entry for every id in book_sections ` +
          `below (${BOOK_SECTION_IDS.join(", ")}), no more, no fewer. Each entry: ` +
          "{headline, narrative}. narrative is 2-4 sentences of shared context for every " +
          "dimension that reads this section -- not a per-dimension takeaway.",
        conclusions_shape:
          "An array of shared enterprise conclusions -- job 4/5's supporting detail. Each: " +
          "{id, statement, theme, evidence_refs, evidence_status, evidence_gap_note, " +
          "applies_to_dimensions, confidence}. applies_to_dimensions: 1 or more " +
          "dimension_key values from dimension_catalog -- tag every dimension this " +
          "conclusion is actually relevant to, not just one. evidence_status: 'evidenced' " +
          "only if evidence_refs contains at least one sufficiently specific ID for this " +
          "exact statement; otherwise 'not_evidenced' with an empty evidence_refs array " +
          "and a filled-in evidence_gap_note (see the HARD RULE above -- this is checked " +
          "mechanically, not a style preference). evidence_gap_note: omit only when " +
          "evidence_status is 'evidenced'. confidence: one of loaded_fact, derived_measure, " +
          "industry_pattern, strategic_inference, missing_evidence.",
        decisions_recommendations_open_questions_shape:
          "decisions, recommendations, and open_questions are each an array of " +
          "{id, statement, applies_to_dimensions}. Keep each list focused -- a handful " +
          "of real leadership-relevant items, not one per dimension.",
        hard_limits:
          "sections: exactly one entry per book_sections id, headline <= 12 words, " +
          "narrative 2-4 sentences. material_gaps/material_advantages: 3-7 items each. " +
          "industry_comparison: one item per genuinely relevant pattern, skip the rest; " +
          "benchmark_refs values: pattern_id from industry_fact_base only. metrics[].metric_id " +
          "values: metric_id from metrics_fact_base only. dimensions[].evidence_refs and " +
          "conclusions' evidence_refs: evidence_id from evidence_index only -- an ID not in " +
          "the relevant list is invalid, never invent one. " +
          "conclusions: aim for the number of genuinely distinct enterprise-level facts/" +
          "inferences that exist in the source data -- not 38, not one per dimension; " +
          "reuse via applies_to_dimensions instead of restating. Every single conclusion, " +
          "no exceptions: evidence_status " +
          "'evidenced' with evidence_refs: [] is invalid and will fail the candidate -- " +
          "see the HARD RULE above. No generic introductions, no restated navigation labels, no " +
          "raw records, no methodology explanations. This is a real strategic synthesis, " +
          "not a compressed manifest -- use the room available for genuine analytical " +
          "depth in jobs 2-4, not for repeating the same point across many conclusions. " +
          "Target well under 64000 output tokens.",
      },
      common: bookCommon,
      // No story_architecture input here, unlike every other pass type --
      // this call generates the executive_narrative itself; it does not
      // consume one. assembled.story_architect does not exist yet at the
      // point this pass runs (book mode calls this first and derives
      // assembled.story_architect FROM its output afterward), so passing it
      // through would just send an empty/undefined field.
      dimension_catalog: cleanDimensionCatalog,
      book_sections: BOOK_SECTION_IDS,
      dimension_chapters: DIMENSION_BOOK_CHAPTERS,
      industry_fact_base: industryFactBase,
      metrics_fact_base: metricsFactBase,
      // Unlike every downstream pass, this call has no upstream story
      // architecture to lean on -- it is the first (and, for dimension
      // content, only) call. It needs the same full raw context the OLD
      // story_architect pass got, not just the thesis-level summaries later
      // passes use.
      context_packet: packet,
      material_aggregates: packet.business_context_samples.application_ownership_coverage
        ? { applications: packet.business_context_samples.application_ownership_coverage }
        : {},
      // Real dependency/usage edges (not authored by Claude -- see
      // deriveGraphBinding/GRAPH_ELIGIBLE_DIMENSIONS). Supplied here as
      // INPUT so Claude's own conclusions about the apps/technology/data
      // cluster are grounded in the real dependency shape, even though the
      // graph_binding object itself is always renderer-owned.
      relationship_samples: packet.business_context_samples.relationship_samples,
      evidence_index: packet.evidence_index ?? [],
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

// Loads a tenant's reconciled application inventory (real per-application
// ownership/hosting/vendor/cost data), the same source
// scripts/knowledge/reconcile-tenant-applications.mjs uses for the
// deterministic HomeV4ApplicationsGrid. Folded into both the context Claude
// sees and the source hash, so narrative generated after this data was
// found is provably distinguishable from narrative generated before it.
function loadTenantApplicationOwnershipFacts(tenantKey) {
  const tstFolder = TST_TENANT_FOLDER[tenantKey];
  if (!tstFolder) return null;
  const f05Path = path.join(repoRoot, "tower-standardized-v1", tstFolder, "family-2-technology-estate/F05_applications-systems.csv");
  if (!fs.existsSync(f05Path)) return null;
  const f05Text = fs.readFileSync(f05Path, "utf8");
  // F05 canonical column order (normalized 2026-07-25, one schema for every
  // tenant): application_id=0, application_name=1, domain=2,
  // primary_business_owner=3. Some tenants (e.g. skyharbor-air) never
  // directly captured an owner on F05 -- real data absence, not a parsing
  // bug -- and instead have it via a governed join to
  // F19_team-application-ownership.csv. Fall back to that join PER ROW
  // whenever primary_business_owner is blank, regardless of which tenant;
  // the F19 file exists for every tenant, not just the ones with a
  // pre-2026-07-25 legacy F05 schema.
  const rows = f05Text.trim().split("\n").slice(1).map((line) => line.replace(/\r$/, ""));
  const totalCount = rows.length;
  const f19Path = path.join(repoRoot, "tower-standardized-v1", tstFolder, "family-8-semantic-enrichment/F19_team-application-ownership.csv");
  const f19OwnerById = new Map();
  let usedF19Fallback = false;
  if (fs.existsSync(f19Path)) {
    const f19Lines = fs.readFileSync(f19Path, "utf8").trim().split("\n").slice(1).map((l) => l.replace(/\r$/, ""));
    for (const line of f19Lines) {
      const cells = line.split(",");
      const applicationId = cells[1]; // tenant_key=0, application_id=1
      const businessOwnerRole = cells[4]; // business_owner_role=4
      if (applicationId && businessOwnerRole) f19OwnerById.set(applicationId, businessOwnerRole);
    }
  }
  const ownedCount = rows.filter((line) => {
    const cells = line.split(",");
    const applicationId = cells[0];
    const primaryBusinessOwner = cells[3];
    if (primaryBusinessOwner) return true;
    if (f19OwnerById.has(applicationId)) {
      usedF19Fallback = true;
      return true;
    }
    return false;
  }).length;
  return {
    source_files: usedF19Fallback
      ? [`tower-standardized-v1/${tstFolder}/family-2-technology-estate/F05_applications-systems.csv`, `tower-standardized-v1/${tstFolder}/family-8-semantic-enrichment/F19_team-application-ownership.csv`]
      : [`tower-standardized-v1/${tstFolder}/family-2-technology-estate/F05_applications-systems.csv`],
    total_applications: totalCount,
    applications_with_named_owner: ownedCount,
    owner_coverage_pct: Math.round((ownedCount / totalCount) * 100),
    ownership_maturity: usedF19Fallback
      ? "Directly captured where present on the source application record; derived from a team/domain-matched join (with an explicit confidence score per row) where not."
      : "Directly captured on the source application record.",
    raw_hash: sha256(f05Text),
  };
}

const TST_TENANT_FOLDER = {
  "skyharbor-air": "skyharbor-air",
  "first-capital": "first-capital-financial",
  "meridian-health": "meridian-health",
  "apex-retail": "apex-retail",
  "lakeshore-holdings": "lakeshore-industries",
};

// F05/F11/T09/T10 were normalized to one canonical column schema across all
// 5 tower-standardized-v1 tenants on 2026-07-25 (previously skyharbor-air
// used a different, older schema than the other 4 for all four files, and
// apex-retail had a third, F11-specific variant -- a real bug caught by a
// zero-cost dry run before any paid call: blindly reading skyharbor's
// column names against the other schema produced undefined values and
// crashed loadTenantEvidenceIndex). T01 (programs) and F12 (budget) were
// already identical across all tenants. No dataset needs per-tenant schema
// branching any more; every tenant reads the same column names.
function loadTenantDatasetRegistry(tenantKey) {
  const tstFolder = TST_TENANT_FOLDER[tenantKey];
  if (!tstFolder) return [];
  const base = path.join(repoRoot, "tower-standardized-v1", tstFolder);
  const registry = [];

  const appsPath = path.join(base, "family-2-technology-estate/F05_applications-systems.csv");
  if (fs.existsSync(appsPath)) {
    const rows = fs.readFileSync(appsPath, "utf8").trim().split("\n").length - 1;
    registry.push({
      dataset_id: "applications_full",
      grain: "one row per application",
      business_definition: "The tenant's application inventory: hosting, criticality, vendor, run cost, modernization plan, and owner where known.",
      row_count: rows,
      available_dimensions: ["domain", "platform_type", "hosting_model", "environment", "criticality", "modernization_state"],
      available_measures: ["annual_run_cost_usd", "integration_count", "count"],
      approved_visual_types: ["horizontal_bar", "treemap", "heatmap"],
      evidence_source: `tower-standardized-v1/${tstFolder}/family-2-technology-estate/F05_applications-systems.csv`,
    });
  }

  const vendorsPath = path.join(base, "family-4-financial-commercial/F11_vendors-contracts-licenses.csv");
  if (fs.existsSync(vendorsPath)) {
    const rows = fs.readFileSync(vendorsPath, "utf8").trim().split("\n").length - 1;
    registry.push({
      dataset_id: "vendors_full",
      grain: "one row per vendor contract",
      business_definition: "Vendor name, category, annual contract value, renewal date, and criticality.",
      row_count: rows,
      available_dimensions: ["category", "criticality", "commercial_risk"],
      available_measures: ["annual_contract_value_usd", "count"],
      approved_visual_types: ["horizontal_bar", "treemap"],
      evidence_source: `tower-standardized-v1/${tstFolder}/family-4-financial-commercial/F11_vendors-contracts-licenses.csv`,
    });
  }

  const programsPath = path.join(base, "ai-control-tower/T01_initiative-registry.csv");
  if (fs.existsSync(programsPath)) {
    const rows = fs.readFileSync(programsPath, "utf8").trim().split("\n").length - 1;
    registry.push({
      dataset_id: "programs_full",
      grain: "one row per initiative",
      business_definition: "Named initiative, business area, owner, sponsor, stage, promised vs. measured value, evidence status, scale decision.",
      row_count: rows,
      available_dimensions: ["business_area", "portfolio_segment", "stage", "status", "scale_decision"],
      available_measures: ["promised_benefit_usd", "measured_value_usd", "count"],
      approved_visual_types: ["horizontal_bar", "scatter_2x2", "waterfall"],
      evidence_source: `tower-standardized-v1/${tstFolder}/ai-control-tower/T01_initiative-registry.csv`,
    });
  }

  const risksPath = path.join(base, "ai-control-tower/T09_risk-governance.csv");
  if (fs.existsSync(risksPath)) {
    const rows = fs.readFileSync(risksPath, "utf8").trim().split("\n").length - 1;
    registry.push({
      dataset_id: "risk_register",
      grain: "one row per identified risk",
      business_definition: "Risk domain, severity, control status, owner role, and any exception/gap noted against it.",
      row_count: rows,
      available_dimensions: ["risk_domain", "severity", "control_status", "owner_role"],
      available_measures: ["count"],
      approved_visual_types: ["heatmap", "horizontal_bar"],
      evidence_source: `tower-standardized-v1/${tstFolder}/ai-control-tower/T09_risk-governance.csv`,
    });
  }

  const evidencePath = path.join(base, "ai-control-tower/T10_evidence-items.csv");
  if (fs.existsSync(evidencePath)) {
    const rows = fs.readFileSync(evidencePath, "utf8").trim().split("\n").length - 1;
    registry.push({
      dataset_id: "evidence_registry",
      grain: "one row per evidence item",
      business_definition: "Evidence item linked to a specific initiative_id, with a review state and a numeric confidence score.",
      row_count: rows,
      available_dimensions: ["review_state", "initiative_id"],
      available_measures: ["count"],
      approved_visual_types: ["evidence_timeline"],
      evidence_source: `tower-standardized-v1/${tstFolder}/ai-control-tower/T10_evidence-items.csv`,
    });
  }

  const budgetPath = path.join(base, "family-4-financial-commercial/F12_it-budget-financials.csv");
  if (fs.existsSync(budgetPath)) {
    const rows = fs.readFileSync(budgetPath, "utf8").trim().split("\n").length - 1;
    registry.push({
      dataset_id: "budget_summary",
      grain: "one row per budget line",
      business_definition: "Budget area, run/change split, capex/opex split, owner team.",
      row_count: rows,
      // Confirmed identical schema across all tenants -- no per-family branch needed.
      available_dimensions: ["budget_area", "spend_type"],
      available_measures: ["budget_fy26_usd", "run_budget_fy26_usd", "change_budget_fy26_usd", "capex_budget_fy26_usd", "opex_budget_fy26_usd"],
      approved_visual_types: ["waterfall", "stacked_bar"],
      evidence_source: `tower-standardized-v1/${tstFolder}/family-4-financial-commercial/F12_it-budget-financials.csv`,
    });
  }

  return registry;
}

// Matches placeholder locator text confirmed in real source CSVs: skyharbor-
// air's legacy rows used the literal phrase "synthetic locator N" (72 of 80
// rows); the majority schema's source_locator instead uses bare "section
// N.N" references (confirmed for first-capital-financial and meridian-health)
// -- real, but just as non-descriptive on its own: a citation that resolves
// to "see section 5.4" doesn't establish whether that section actually
// supports THIS claim any better than a sequence number does. Both count as
// low specificity. Named exactly so a validator or prompt can key off it.
const LOW_SPECIFICITY_LOCATOR_PATTERN = /^(synthetic locator \d+|section \d+(\.\d+)*)$/i;

// Compact, real evidence index (spec Section "Wire the real evidence
// registry into the prompt") -- sourced from T10_evidence-items.csv (one
// canonical schema across all 5 tenants as of 2026-07-25), the same file
// registered as evidence_registry above. Ships IDs, source family, title,
// supported claims, period, confidence, and specificity -- never the full
// row set. Claude cites evidence_id values from this list; the validator
// (validate-integrated-manifest.mjs) rejects any ID that isn't in it, and
// separately flags conclusions whose only support is low-specificity.
function loadTenantEvidenceIndex(tenantKey) {
  const tstFolder = TST_TENANT_FOLDER[tenantKey];
  if (!tstFolder) return [];
  const evidencePath = path.join(repoRoot, "tower-standardized-v1", tstFolder, "ai-control-tower/T10_evidence-items.csv");
  if (!fs.existsSync(evidencePath)) return [];
  const lines = fs.readFileSync(evidencePath, "utf8").trim().split("\n").map((l) => l.replace(/\r$/, ""));
  const header = lines[0].split(",");
  return lines.slice(1).map((line) => {
    const cells = line.split(",");
    const row = Object.fromEntries(header.map((h, i) => [h, cells[i] ?? ""]));
    // legacy_* columns are populated only for rows normalized from
    // skyharbor-air's pre-2026-07-25 schema, which never captured
    // review_state/confidence/initiative_id/source_timestamp; fall back to
    // them per-row rather than per-tenant, since the column set is now
    // identical for every tenant regardless of which was actually captured.
    const title = row.source_locator || row.source_document || row.evidence_item_id;
    return {
      evidence_id: row.evidence_item_id,
      source_family: row.legacy_source_type || "tenant_document",
      title,
      supports: [row.initiative_id || row.legacy_claim_supported].filter(Boolean),
      period: row.source_timestamp || null,
      confidence: row.review_state === "approved" || row.legacy_trust_status === "usable"
        ? "governed-real"
        : "needs-review",
      specificity: LOW_SPECIFICITY_LOCATOR_PATTERN.test(title.trim()) ? "low" : "high",
    };
  });
}

// Versioned, explicit dimension -> dataset binding map (spec Section "Add
// explicit dimension-to-dataset bindings"). Claude selects among these
// pre-approved options; it does not infer which dataset supports a
// dimension. Only dimensions with a verified real dataset get an entry --
// every other dimension gets no binding, which is correct, not a gap to
// silently paper over.
const DIMENSION_DATASET_BINDINGS_VERSION = "v1-2026-07-24";
const DIMENSION_DATASET_BINDINGS = {
  apps: { primary_dataset: "applications_full", evidence_families: ["applications", "cmdb", "architecture_deck"] },
  vendors: { primary_dataset: "vendors_full", evidence_families: ["vendors", "annual_report"] },
  programs: { primary_dataset: "programs_full", evidence_families: ["programs", "investor_day_deck"] },
  risks: { primary_dataset: "risk_register", evidence_families: ["risk", "investor_day_deck"] },
  evidence: { primary_dataset: "evidence_registry", evidence_families: ["evidence"] },
  // NOTE: the real 38-dimension catalog key for this concept is "budget"
  // (expandedDimensionCatalog: { key: "budget", name: "IT Budget, Spend &
  // Value" }) -- an earlier version of this map used "spend", which matches
  // no real dimension_key and made this binding permanently unreachable.
  // Caught by assert-integrated-prompt-preflight.mjs's
  // preflight.binding_unreachable_dimension check.
  budget: { primary_dataset: "budget_summary", evidence_families: ["budget", "annual_report"] },
};

// ---------------------------------------------------------------------------
// Enterprise Book architecture (v2).
//
// v1 (shipped, then reviewed) removed Claude from visual-binding authorship
// but still asked it to write a complete, separately-authored `dimension_notes`
// entry -- title, headline, takeaway, insights, implication, actions,
// evidence, confidence -- for each of the 38 keys. That is not a shared
// story with 38 sections; it is still 38 independently authored pages, just
// without charts. Review finding, confirmed against the real prior output:
// the same handful of enterprise conclusions (ownership ambiguity,
// uncertified lineage, missing baselines, managed-services exposure) were
// independently restated with different wording across many dimensions --
// exactly the drift risk a "one book" architecture is supposed to prevent
// by construction, not by asking the model to stay consistent across 38
// separate answers.
//
// v2 fixes this structurally: Claude writes a SMALL number of shared
// narrative sections (BOOK_SECTION_IDS below) plus a FLAT list of
// `conclusions` (and `decisions`/`recommendations`/`open_questions`), each
// tagged with which dimension_keys it applies to. A conclusion is authored
// ONCE; every dimension page that needs it references the SAME object via
// renderDimensionsFromBook()'s filter -- byte-identical wherever it shows
// up, because it is the same object, not independently retyped. Claude
// never writes a `dimension_notes.<key>` object at all; there is no field
// in its schema to author "the apps page" or "the org page" into.
//
// DIMENSION_BOOK_CHAPTERS: every one of the 38 real catalog keys assigned to
// exactly one of BOOK_SECTION_IDS (or "executive_narrative", the one
// dimension -- enterprise_thesis -- that reads the top-level narrative
// directly instead of a `sections` entry). The self-check below throws at
// load time if any catalog key is uncovered or any chapter is unrecognized.
const BOOK_SECTION_IDS = [
  "business_context",
  "operating_model",
  "capabilities",
  "value_streams",
  "applications_context",
  "data_context",
  "technology_context",
  "vendor_context",
  "risk_context",
  "portfolio_context",
  "ai_opportunity_context",
  "evidence_context",
  "relationships_context",
];

const DIMENSION_BOOK_CHAPTERS = {
  enterprise_thesis: "executive_narrative",
  profile: "business_context",
  geography: "business_context",
  industry: "business_context",
  metrics: "business_context",
  divisions: "operating_model",
  front_middle_back: "operating_model",
  org: "operating_model",
  decision_rights: "operating_model",
  workforce: "operating_model",
  business_processes: "operating_model",
  opev: "operating_model",
  journeys: "operating_model",
  service_delivery: "operating_model",
  leadership_agenda: "operating_model",
  interview_signals: "operating_model",
  functions: "capabilities",
  capabilities: "capabilities",
  proven_strengths: "capabilities",
  value_streams: "value_streams",
  infra: "technology_context",
  integrations: "technology_context",
  architecture_dependencies: "technology_context",
  tech_lifecycle: "technology_context",
  data: "data_context",
  data_quality_lineage: "data_context",
  identity_semantic: "data_context",
  apps: "applications_context",
  vendors: "vendor_context",
  ms: "vendor_context",
  risks: "risk_context",
  structural_constraints: "risk_context",
  evidence: "evidence_context",
  lenses: "evidence_context",
  ai: "ai_opportunity_context",
  budget: "portfolio_context",
  programs: "portfolio_context",
  rel: "relationships_context",
};

{
  const covered = new Set(Object.keys(DIMENSION_BOOK_CHAPTERS));
  const catalogKeys = expandedDimensionCatalog.map((e) => e.key);
  const missing = catalogKeys.filter((k) => !covered.has(k));
  const extra = Array.from(covered).filter((k) => !catalogKeys.includes(k));
  if (missing.length > 0) throw new Error(`DIMENSION_BOOK_CHAPTERS missing catalog keys: ${missing.join(", ")}`);
  if (extra.length > 0) throw new Error(`DIMENSION_BOOK_CHAPTERS has unknown keys: ${extra.join(", ")}`);
  const usedChapters = new Set(Object.values(DIMENSION_BOOK_CHAPTERS));
  const knownChapters = new Set([...BOOK_SECTION_IDS, "executive_narrative"]);
  const unknownChapters = Array.from(usedChapters).filter((c) => !knownChapters.has(c));
  if (unknownChapters.length > 0) throw new Error(`DIMENSION_BOOK_CHAPTERS uses unrecognized chapter(s): ${unknownChapters.join(", ")}`);
}

// Deterministic visual construction. dataset_id -> a fixed visual_binding
// template. The renderer fills these in for the 6 governed dimensions; every
// other dimension gets no visual_binding, same as before. Dimension/measure
// names here must match loadTenantDatasetRegistry()'s available_dimensions/
// available_measures exactly -- validate-integrated-manifest.mjs's
// unknown_visual_field check enforces this at zero cost, which is how a
// stale field name (this block referenced skyharbor-air's pre-2026-07-25
// column names after the F05/F11/T09/T10 normalization) gets caught before
// any paid call rather than silently producing a broken visual_binding.
const VISUAL_RENDER_RULES = {
  applications_full: {
    visual_type: "treemap", dimension: "domain", measure: "count", limit: 7,
    title: "Application concentration by domain",
    annotation_instruction: "Emphasize the domains with the largest system footprint",
  },
  vendors_full: {
    visual_type: "horizontal_bar", dimension: "category", measure: "annual_contract_value_usd", limit: 7,
    title: "Vendor concentration by contract value",
    annotation_instruction: "Emphasize the largest delivery dependency",
    format: "currency", orientation: "horizontal",
  },
  programs_full: {
    visual_type: "scatter_2x2", dimension: "stage", measure: "measured_value_usd", limit: 8,
    title: "Programs by measured value and stage",
    annotation_instruction: "Highlight programs with promised but no measured value",
    format: "currency",
  },
  risk_register: {
    visual_type: "heatmap", dimension: "risk_domain", measure: "count", limit: 5,
    title: "Risk intensity by domain and control status",
    annotation_instruction: "Emphasize high-severity risks with weak control status",
  },
  evidence_registry: {
    visual_type: "evidence_timeline", dimension: "review_state", measure: "count", limit: 7,
    title: "From review-required to approved evidence",
    annotation_instruction: "Emphasize items still needing review versus approved",
  },
  budget_summary: {
    visual_type: "stacked_bar", dimension: "budget_area", measure: "budget_fy26_usd", limit: 5,
    title: "Budget composition by area and spend type",
    annotation_instruction: "Emphasize the run versus change split",
    format: "currency",
  },
};

function readCsvRows(relativePath) {
  const fullPath = path.join(repoRoot, relativePath);
  if (!fs.existsSync(fullPath)) return [];
  const lines = fs.readFileSync(fullPath, "utf8").trim().split("\n").map((l) => l.replace(/\r$/, ""));
  const header = lines[0].split(",");
  return lines.slice(1).map((line) => {
    const cells = line.split(",");
    return Object.fromEntries(header.map((h, i) => [h, cells[i] ?? ""]));
  });
}

// Real per-row label column for the one visual_type (scatter_2x2, currently
// only programs_full) that plots individual rows rather than a grouped
// aggregate.
const DATASET_LABEL_COLUMN = {
  applications_full: "application_name",
  vendors_full: "vendor_name",
  programs_full: "initiative_name",
  risk_register: "risk_id",
  evidence_registry: "evidence_item_id",
  budget_summary: "line_id",
};

// Real per-row legacy fallback -- same rationale as loadTenantEvidenceIndex:
// skyharbor-air's evidence rows never captured review_state directly
// (pre-2026-07-25 schema gap, not a parsing bug); every other tenant does.
// skyharbor's legacy_trust_status uses "usable" where the canonical column
// uses "approved" for the same real state -- normalize so the resulting
// chart groups consistently across tenants instead of fragmenting into an
// extra label for skyharbor-air alone.
const DIMENSION_VALUE_FALLBACK = {
  evidence_registry: {
    review_state: (row) =>
      row.review_state || (row.legacy_trust_status === "usable" ? "approved" : row.legacy_trust_status),
  },
};

function resolveDimensionValue(row, datasetId, dimension) {
  const fallback = DIMENSION_VALUE_FALLBACK[datasetId]?.[dimension];
  return fallback ? fallback(row) : row[dimension];
}

// The single function anywhere in this codebase that turns a declarative
// visual_binding pointer into real numbers. Claude never sees or influences
// this -- it runs entirely after generation, reading the exact same real
// CSV deterministic_dataset_registry already names for this dataset_id, via
// registry.evidence_source (a single source of truth for the file path,
// not a second hardcoded map). Verified: T01/F12 have no rollup rows for
// any tenant (view is a single constant, is_rollup_of always empty), so
// summing every row for a numeric measure is safe -- no double-counting.
//
// scatter_2x2 (today, only programs_full) is handled as individual points
// (x = promised_benefit_usd, y = the bound measure) rather than grouped:
// visual_binding.dimension for that dataset is "stage," a categorical
// value, and grouping by it would not produce a meaningful two-axis plot.
// Every other governed visual_type groups by visual_binding.dimension and
// aggregates visual_binding.measure (row count, or the sum of a real
// numeric column).
function resolveVisualDataPoints(visualBinding, packet) {
  if (!visualBinding?.dataset_id) return [];
  const registryEntry = (packet.deterministic_dataset_registry ?? []).find((d) => d.dataset_id === visualBinding.dataset_id);
  if (!registryEntry?.evidence_source) return [];
  const rows = readCsvRows(registryEntry.evidence_source);
  if (rows.length === 0) return [];

  if (visualBinding.visual_type === "scatter_2x2") {
    const labelCol = DATASET_LABEL_COLUMN[visualBinding.dataset_id] ?? visualBinding.dimension;
    return rows
      .map((row) => {
        const dimensionValue = resolveDimensionValue(row, visualBinding.dataset_id, visualBinding.dimension);
        return {
          label: row[labelCol] || dimensionValue || "",
          x: Number(row.promised_benefit_usd) || 0,
          y: Number(row[visualBinding.measure]) || 0,
          series: dimensionValue || "",
          classification: "loaded_fact",
          source_basis: registryEntry.grain,
        };
      })
      .filter((p) => p.label)
      .sort((a, b) => b.y - a.y)
      .slice(0, visualBinding.limit ?? 8);
  }

  const groups = new Map();
  for (const row of rows) {
    const key = resolveDimensionValue(row, visualBinding.dataset_id, visualBinding.dimension);
    if (!key) continue;
    const current = groups.get(key) ?? 0;
    const increment = visualBinding.measure === "count" ? 1 : (Number(row[visualBinding.measure]) || 0);
    groups.set(key, current + increment);
  }
  return Array.from(groups.entries())
    .map(([label, value]) => ({
      label,
      value,
      classification: "loaded_fact",
      source_basis: registryEntry.grain,
    }))
    .sort((a, b) => (visualBinding.sort === "ascending" ? a.value - b.value : b.value - a.value))
    .slice(0, visualBinding.limit ?? 7);
}

// Purposeful, not decorative: relationship_samples has real edges only for
// the tech/dependency cluster (confirmed against skyharbor-air: 40 real
// rows, 78 unique named nodes, 4 real relationship types -- owns/uses/
// runs_on/feeds -- covering business-function-to-system and system-to-
// integration chains). Every other dimension gets no graph_binding at all;
// forcing a graph onto e.g. "vendors" or "budget" with no real edge data
// would be exactly the kind of decoration-not-purpose the graph feature
// must avoid.
const GRAPH_ELIGIBLE_DIMENSIONS = new Set(["apps", "infra", "architecture_dependencies", "integrations", "data", "rel"]);

// Same non-fabricable-pointer pattern as visual_binding: Claude never
// writes this field. graph_binding is a real, code-computed SUMMARY of the
// actual relationship_samples rows (counts, real relationship types) --
// never the full node/edge list, matching how visual_binding points at a
// dataset_id instead of embedding rows. The real graph rendering (e.g.
// RelationshipTopologyGraph, already built and proven earlier this
// session) reads relationship_samples/the graph substrate directly, not
// this JSON.
function deriveGraphBinding(key, packet) {
  if (!GRAPH_ELIGIBLE_DIMENSIONS.has(key)) return null;
  const rows = packet.business_context_samples?.relationship_samples ?? [];
  if (rows.length === 0) {
    return { relationship_source: "relationship_samples", node_count: 0, edge_count: 0, relationship_types: [], empty_state: "No relationship evidence loaded for this dimension yet." };
  }
  const nodeNames = new Set();
  const types = new Set();
  for (const row of rows) {
    if (row.from_object_name) nodeNames.add(row.from_object_name);
    if (row.to_object_name) nodeNames.add(row.to_object_name);
    if (row.relationship_type) types.add(row.relationship_type);
  }
  return {
    relationship_source: "relationship_samples",
    projection_type: "dependency_map",
    node_count: nodeNames.size,
    edge_count: rows.length,
    relationship_types: Array.from(types).sort(),
  };
}

// Deterministic renderer: turns one EnterpriseBook object into the same
// dimensions[] shape the rest of the pipeline (validator, review HTML,
// downstream Home V4 consumers) already expects from the integrated_
// dimensions pass. Claude supplies dimension_notes; every dataset/visual/
// graph field below is attached by code, never by the model.
// Zero-cost dry-run proof for item 1 of the Enterprise Book review: the
// execution trace is fully deterministic (no field depends on what Claude
// actually returns), so it can be produced and inspected before any paid
// call. This is the SAME literal id/type/status/reason values processTenant()
// emits during a real run -- one definition, so the dry-run trace cannot
// silently drift from what actually executes.
export function bookModeExecutionTrace() {
  return [
    { id: "01-enterprise-book", type: "enterprise_book", status: "executed" },
    { id: "01-story-architect", type: "story_architect", status: "skipped", reason: "book mode: superseded by enterprise_book.executive_narrative" },
    { id: "02-executive-brief", type: "executive_brief", status: "skipped", reason: "book mode: not yet folded into the book; no assembled.executive_brief under this architecture" },
    { id: "03-industry-change", type: "industry_change", status: "skipped", reason: "book mode: not yet folded into the book; no assembled.industry_change under this architecture" },
    { id: "04-use-cases-batch-*", type: "use_cases", status: "skipped", reason: "book mode: not yet folded into the book; no assembled.use_cases under this architecture" },
    { id: "05-integrated-dimensions", type: "integrated_dimensions", status: "skipped", reason: "book mode: superseded by enterprise_book + renderDimensionsFromBook()" },
    { id: "06-relationships", type: "relationships", status: "skipped", reason: "book mode: not yet folded into the book; no assembled.relationships under this architecture" },
    { id: "07-evidence", type: "evidence", status: "skipped", reason: "book mode: not yet folded into the book; no assembled.evidence under this architecture" },
    { id: "08-coherence-review", type: "coherence", status: "executed", note: "kept as an independent self-check; optional per architecture, not required for renderDimensionsFromBook() to run" },
  ];
}

// dimension_key -> { book sections read, datasets read, evidence families
// read, renderer used } -- the literal answer to review item 3 ("prove the
// renderer is actually deriving views"), generated from the same tables the
// renderer itself uses, so this mapping cannot silently drift from what
// renderDimensionsFromBook() actually does.
export function dimensionRendererMapping() {
  return expandedDimensionCatalog.map((entry) => {
    const key = entry.key;
    const chapter = DIMENSION_BOOK_CHAPTERS[key];
    const binding = DIMENSION_DATASET_BINDINGS[key];
    return {
      dimension_key: key,
      book_sections_read: chapter === "executive_narrative" ? ["executive_narrative"] : [chapter],
      deterministic_datasets_read: binding ? [binding.primary_dataset] : [],
      evidence_families_read: binding?.evidence_families ?? [],
      renderer: binding ? "GovernedDatasetDimensionRenderer" : "NarrativeOnlyDimensionRenderer",
    };
  });
}

// Turns one EnterpriseBook (v2 shape: executive_narrative + sections{} +
// conclusions[] + decisions[]/recommendations[]/open_questions[], each
// tagged applies_to_dimensions) into the same dimensions[] shape the rest
// of the pipeline already expects. This is a FILTER + PROJECTION over
// shared objects, not a per-dimension object lookup: the same conclusion
// referenced by three dimensions is the same JS object in all three
// outputs, not three independently authored copies -- so it is
// structurally impossible for the renderer to introduce the "same fact,
// worded three different ways" drift that v1's dimension_notes shape
// allowed Claude to introduce.
export function renderDimensionsFromBook(book, packet) {
  const sections = book?.sections ?? {};
  const conclusions = Array.isArray(book?.conclusions) ? book.conclusions : [];
  const decisions = Array.isArray(book?.decisions) ? book.decisions : [];
  const recommendations = Array.isArray(book?.recommendations) ? book.recommendations : [];
  const openQuestions = Array.isArray(book?.open_questions) ? book.open_questions : [];
  const materialGaps = Array.isArray(book?.material_gaps) ? book.material_gaps : [];
  const materialAdvantages = Array.isArray(book?.material_advantages) ? book.material_advantages : [];
  const registryById = new Map((packet.deterministic_dataset_registry ?? []).map((d) => [d.dataset_id, d]));

  const appliesTo = (item, key) => Array.isArray(item.applies_to_dimensions) && item.applies_to_dimensions.includes(key);

  // Reverse index for related_dimensions: two dimensions are "related" here
  // because they are DERIVED FROM THE SAME SHARED CONCLUSION, not because
  // Claude separately typed a related_dimensions list on each of 38 pages.
  const dimensionsByConclusion = new Map();
  for (const c of conclusions) {
    for (const dim of c.applies_to_dimensions ?? []) {
      if (!dimensionsByConclusion.has(dim)) dimensionsByConclusion.set(dim, new Set());
    }
  }
  for (const c of conclusions) {
    const dims = c.applies_to_dimensions ?? [];
    for (const dim of dims) {
      for (const other of dims) {
        if (other !== dim) dimensionsByConclusion.get(dim)?.add(other);
      }
    }
  }

  return expandedDimensionCatalog.map((entry) => {
    const key = entry.key;
    const chapter = DIMENSION_BOOK_CHAPTERS[key];
    const section = chapter === "executive_narrative" ? (book?.executive_narrative ?? {}) : (sections[chapter] ?? {});
    const binding = DIMENSION_DATASET_BINDINGS[key];

    const relevantConclusions = conclusions.filter((c) => appliesTo(c, key));
    const relevantRecommendations = recommendations.filter((r) => appliesTo(r, key));
    const relevantDecisions = decisions.filter((d) => appliesTo(d, key));
    const relevantOpenQuestions = openQuestions.filter((q) => appliesTo(q, key));
    const relevantGaps = materialGaps.filter((g) => appliesTo(g, key));
    const relevantAdvantages = materialAdvantages.filter((a) => appliesTo(a, key));

    const dimension = {
      dimension_key: key,
      chapter,
      title: entry.name,
      headline: section.headline ?? "",
      executive_takeaway: section.narrative ?? "",
      key_insights: relevantConclusions.map((c) => ({
        statement: c.statement ?? "",
        evidence_refs: Array.isArray(c.evidence_refs) ? c.evidence_refs : [],
        evidence_status: c.evidence_status ?? (Array.isArray(c.evidence_refs) && c.evidence_refs.length > 0 ? "evidenced" : "not_evidenced"),
        ...(c.evidence_gap_note ? { evidence_gap_note: c.evidence_gap_note } : {}),
      })),
      // Job 3 output (material_gaps/material_advantages), filtered to this
      // dimension the same way conclusions are -- these are the "few things
      // that actually matter," not restated once per dimension.
      material_gaps: relevantGaps.map((g) => ({ statement: g.statement ?? "", why_it_matters: g.why_it_matters_to_leadership ?? "", evidence_refs: g.evidence_refs ?? [] })),
      material_advantages: relevantAdvantages.map((a) => ({ statement: a.statement ?? "", why_it_matters: a.why_it_matters_to_leadership ?? "", evidence_refs: a.evidence_refs ?? [] })),
      strategic_implication: relevantDecisions.map((d) => d.statement ?? "").filter(Boolean).join(" "),
      recommended_actions: relevantRecommendations.map((r) => r.statement ?? "").filter(Boolean),
      evidence_refs: Array.from(new Set(relevantConclusions.flatMap((c) => c.evidence_refs ?? []))),
      related_dimensions: Array.from(dimensionsByConclusion.get(key) ?? []).slice(0, 6),
      confidence_statement: relevantConclusions.length
        ? `${relevantConclusions.length} shared enterprise conclusion(s) apply to this dimension.`
        : "",
      open_questions: relevantOpenQuestions.map((q) => q.statement ?? "").filter(Boolean),
    };

    if (binding && registryById.has(binding.primary_dataset)) {
      dimension.data_binding = { dataset_id: binding.primary_dataset };
      const rule = VISUAL_RENDER_RULES[binding.primary_dataset];
      if (rule) {
        dimension.visual_binding = {
          dataset_id: binding.primary_dataset,
          visual_type: rule.visual_type,
          dimension: rule.dimension,
          measure: rule.measure,
          filters: [],
          sort: "descending",
          limit: rule.limit,
          title: rule.title,
          annotation_instruction: rule.annotation_instruction,
          ...(rule.format ? { format: rule.format } : {}),
          ...(rule.orientation ? { orientation: rule.orientation } : {}),
          interpretation: section.narrative
            ? `Deterministic view of ${binding.primary_dataset}, read alongside "${chapter}."`
            : `Deterministic view of ${binding.primary_dataset}.`,
        };
        // Resolve the pointer into real numbers here, in the generator,
        // once -- so the shipped candidate carries a fully-formed
        // HomeV4ChartVisual (existing shape the live renderer already
        // knows how to draw) alongside the declarative visual_binding.
        // The renderer itself needs zero changes; every new aggregation
        // rule lives in this one already-governed function.
        const dataPoints = resolveVisualDataPoints(dimension.visual_binding, packet);
        const registryEntry = (packet.deterministic_dataset_registry ?? []).find((d) => d.dataset_id === binding.primary_dataset);
        dimension.primary_visual = {
          visual_type: rule.visual_type,
          title: rule.title,
          executive_question: rule.annotation_instruction,
          classification: dataPoints.length > 0 ? "loaded_fact" : "missing_evidence",
          data_points: dataPoints,
          encoding: rule.visual_type === "scatter_2x2"
            ? { x: "promised_benefit_usd", y: rule.measure, series: rule.dimension }
            : { x: rule.dimension, y: rule.measure },
          annotation: rule.annotation_instruction,
          evidence_boundary: registryEntry
            ? `Computed directly from ${registryEntry.row_count} real records (${registryEntry.grain}); no model-generated values.`
            : `Computed directly from the tenant's real records; no model-generated values.`,
          empty_state: `No ${rule.dimension} data available in ${binding.primary_dataset} for this view.`,
        };
      }
    }
    const graphBinding = deriveGraphBinding(key, packet);
    if (graphBinding) dimension.graph_binding = graphBinding;
    return dimension;
  });
}

async function processTenant(client, tenantKey) {
  const sourceFile = path.join(repoRoot, "datasets", "tenant-inputs", tenantKey, "approved-content", "home", "design-contract-pack.json");
  const sourceText = fs.readFileSync(sourceFile, "utf8");
  const applicationOwnershipFacts = loadTenantApplicationOwnershipFacts(tenantKey);
  const sourceHash = sha256(sourceText + (applicationOwnershipFacts?.raw_hash ?? ""));
  const pack = JSON.parse(sourceText);
  pack.__source_file = sourceFile;
  pack.__application_ownership_facts = applicationOwnershipFacts;
  const tenantDir = path.join(outDir, "tenants", tenantKey);
  ensureDir(tenantDir);
  const packet = buildTenantContextPacket(pack, sourceHash);
  packet.deterministic_dataset_registry = loadTenantDatasetRegistry(tenantKey);
  packet.evidence_index = loadTenantEvidenceIndex(tenantKey);
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
  if (preflightMode) {
    // enterprise_book has no story_architecture input (see makePrompt's
    // "enterprise_book" branch) -- it's the first call, not a downstream
    // one, so book-mode preflight never needs the fixture the legacy/
    // integrated preflight path requires to stand in for Call 1's output.
    let assembled = { tenant: packet.tenant };
    if (!bookMode) {
      const fixturePath = path.join(repoRoot, "scripts", "knowledge", "__fixtures__", `story-architecture-${tenantKey}.json`);
      if (!fs.existsSync(fixturePath)) {
        throw new Error(
          `No story-architecture preflight fixture for "${tenantKey}" at ${path.relative(repoRoot, fixturePath)}. ` +
          "Preflight mode never calls Claude, so it needs a real, previously-captured story architecture on disk to stand in for Call 1's output.",
        );
      }
      const storyArchitect = JSON.parse(fs.readFileSync(fixturePath, "utf8"));
      assembled = {
        tenant: packet.tenant,
        story_architect: storyArchitect,
        story_architecture_id: storyArchitect.story_architecture_id ?? `home-v4-${tenantKey}-${sourceHash.slice(0, 10)}`,
        story_architecture_version: promptContractVersion,
        story_architecture_hash: sha256(JSON.stringify(storyArchitect)),
      };
    }
    const pass = bookMode
      ? { id: "01-enterprise-book", type: "enterprise_book" }
      : { id: "05-integrated-dimensions", type: "integrated_dimensions" };
    const prompt = makePrompt(pass, packet, assembled);
    writeJson(path.join(tenantDir, "preflight", `${pass.id}.prompt.json`), prompt);
    const preflight = bookMode
      ? assertEnterpriseBookPromptPreflight(prompt, packet)
      : assertIntegratedPromptPreflight(prompt, packet);
    writeJson(path.join(tenantDir, "preflight", `${pass.id}.preflight-result.json`), preflight);
    console.log(`[home-v4-preflight] ${tenantKey}: ${preflight.status} (${preflight.failure_count} failure(s))`);
    for (const f of preflight.failures) {
      console.log(`[home-v4-preflight]   [FAIL] ${f.rule_id}${f.dimension_key ? ` (${f.dimension_key})` : ""}: ${f.message}`);
    }
    if (preflight.status !== "pass") {
      throw new Error(`Integrated prompt preflight failed for "${tenantKey}": ${preflight.failure_count} failure(s). See ${path.relative(repoRoot, path.join(tenantDir, "preflight"))}.`);
    }
    // Book mode has one more zero-cost step available: if a fixture
    // EnterpriseBook exists for this tenant (a real, previously-captured
    // book, or one reshaped from prior real dimension content), run the
    // ACTUAL production renderDimensionsFromBook() against it -- not a copy,
    // the same function the real pipeline calls -- and validate the result
    // with the same validator that would run against a paid candidate. This
    // proves the deterministic half of book mode end-to-end without ever
    // calling Claude.
    if (bookMode) {
      const dryRunTrace = bookModeExecutionTrace();
      writeJson(path.join(tenantDir, "preflight", "dry-run-execution-trace.json"), dryRunTrace);
      writeJson(path.join(tenantDir, "preflight", "dimension-renderer-mapping.json"), dimensionRendererMapping());
      console.log(`[home-v4-preflight] ${tenantKey}: execution trace -- executed: ${dryRunTrace.filter((t) => t.status === "executed").map((t) => t.id).join(", ")}`);
      console.log(`[home-v4-preflight] ${tenantKey}: execution trace -- skipped: ${dryRunTrace.filter((t) => t.status === "skipped").map((t) => t.id).join(", ")}`);
      const bookFixturePath = path.join(repoRoot, "scripts", "knowledge", "__fixtures__", "enterprise-book", `${tenantKey}-book.json`);
      if (fs.existsSync(bookFixturePath)) {
        const fixtureBook = JSON.parse(fs.readFileSync(bookFixturePath, "utf8"));
        const renderedDimensions = renderDimensionsFromBook(fixtureBook, packet);
        writeJson(path.join(tenantDir, "preflight", "rendered-dimensions-from-fixture-book.json"), renderedDimensions);
        const rendererCandidate = { dimensions: renderedDimensions, enterprise_story_integrated: fixtureBook.executive_narrative };
        const rendererValidation = validateIntegratedManifest(rendererCandidate, packet, { bindings: DIMENSION_DATASET_BINDINGS });
        writeJson(path.join(tenantDir, "preflight", "renderer-proof-validation.json"), rendererValidation);
        console.log(`[home-v4-preflight] ${tenantKey}: renderer-proof ${rendererValidation.status} (${rendererValidation.failure_count} failure(s), ${rendererValidation.warning_count} warning(s))`);
        for (const f of rendererValidation.failures) {
          console.log(`[home-v4-preflight]   [RENDERER FAIL] ${f.type}${f.dimension_key ? ` (${f.dimension_key})` : ""}: ${f.message}`);
        }
      } else {
        console.log(`[home-v4-preflight] ${tenantKey}: no enterprise-book fixture at ${path.relative(repoRoot, bookFixturePath)} -- skipping renderer proof.`);
      }
    }
    return {
      tenant_key: tenantKey,
      display_name: pack.tenant_name,
      source_hash: sourceHash,
      validation_status: "preflight_pass",
      violation_count: 0,
      visual_contract_count: 0,
      prompt_count: 1,
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

  // Book mode replaces Call 1 (story_architect) AND Call 5 (the 38-dimension
  // generation, whichever of the two prior architectures) with ONE
  // enterprise_book call. The book's executive_narrative stands in for
  // story_architect for every downstream pass that still references
  // assembled.story_architect (executive_brief, industry_change, use_cases,
  // relationships, evidence) -- those passes are unchanged and still run;
  // only the two passes that were actually producing the fabrication-prone,
  // drift-prone 38-independent-authors output are replaced.
  // Execution trace: every pass that COULD run in either architecture, with
  // an explicit executed/skipped verdict and reason. This is the direct,
  // inspectable answer to "which passes actually ran" -- not a claim in a
  // release-record paragraph, a data structure written to disk every run.
  const executionTrace = [];
  const traceExecuted = (id, type, extra = {}) => executionTrace.push({ id, type, status: "executed", ...extra });
  const traceSkipped = (id, type, reason) => executionTrace.push({ id, type, status: "skipped", reason });

  if (bookMode) {
    // Book mode's ENTIRE Claude-facing surface for enterprise content is one
    // call. Every legacy pass below is explicitly skipped, not silently
    // absent -- assembled.executive_brief/industry_change/use_cases/
    // relationships/evidence do not exist under book mode today. That is a
    // real, disclosed scope reduction versus the legacy pipeline, not an
    // oversight: those five passes' content has no home in this
    // architecture yet and folding them in is future work, not assumed done
    // here.
    const pass = { id: "01-enterprise-book", type: "enterprise_book" };
    const content = await callClaude(client, pass, makePrompt(pass, packet, assembled), tenantDir);
    assembled.passes[pass.id] = content;
    traceExecuted(pass.id, pass.type);
    const bookResult = content.client_visible ?? {};
    assembled.story_architect = bookResult.executive_narrative ?? {};
    assembled.story_architecture_id = `home-v4-book-${tenantKey}-${sourceHash.slice(0, 10)}`;
    assembled.story_architecture_version = promptContractVersion;
    assembled.story_architecture_hash = sha256(JSON.stringify(bookResult.executive_narrative ?? {}));
    assembled.enterprise_book = bookResult;

    traceSkipped("01-story-architect", "story_architect", "book mode: superseded by enterprise_book.executive_narrative");
    traceSkipped("02-executive-brief", "executive_brief", "book mode: not yet folded into the book; no assembled.executive_brief under this architecture");
    traceSkipped("03-industry-change", "industry_change", "book mode: not yet folded into the book; no assembled.industry_change under this architecture");
    traceSkipped("04-use-cases-batch-*", "use_cases", "book mode: not yet folded into the book; no assembled.use_cases under this architecture");
    traceSkipped("05-integrated-dimensions", "integrated_dimensions", "book mode: superseded by enterprise_book + renderDimensionsFromBook()");
    traceSkipped("06-relationships", "relationships", "book mode: not yet folded into the book; no assembled.relationships under this architecture");
    traceSkipped("07-evidence", "evidence", "book mode: not yet folded into the book; no assembled.evidence under this architecture");

    // No model call here -- renderDimensionsFromBook() is pure code. Claude
    // returns book.sections + book.conclusions; every dataset/visual field
    // and every per-dimension page is assembled deterministically.
    assembled.enterprise_story_integrated = bookResult?.executive_narrative ?? null;
    assembled.dimensions = renderDimensionsFromBook(bookResult, packet);

    const coherencePass = { id: "08-coherence-review", type: "coherence" };
    const coherenceContent = await callClaude(client, coherencePass, makePrompt(coherencePass, packet, assembled), tenantDir);
    assembled.passes[coherencePass.id] = coherenceContent;
    assembled.coherence_review = coherenceContent.client_visible;
    traceExecuted(coherencePass.id, coherencePass.type, { note: "kept as an independent self-check; optional per architecture, not required for renderDimensionsFromBook() to run" });

    assembled.execution_trace = executionTrace;
    const bookValidation = validateIntegratedManifest(
      {
        dimensions: assembled.dimensions,
        enterprise_story_integrated: assembled.enterprise_story_integrated,
        enterprise_book: assembled.enterprise_book,
      },
      packet,
      {
        bindings: DIMENSION_DATASET_BINDINGS,
        industryFactBase: packet.business_context_samples.industry_patterns ?? [],
        metricsFactBase: packet.business_context_samples.metrics_outcomes ?? [],
      },
    );
    assembled.validation = { status: bookValidation.status === "pass" ? "candidate_review_ready" : "candidate_failed", violations: bookValidation.failures };
    writeJson(path.join(tenantDir, "candidate-home-knowledge-v4.json"), assembled);
    writeJson(path.join(tenantDir, "execution-trace.json"), executionTrace);
    return {
      tenant_key: tenantKey,
      display_name: pack.tenant_name,
      source_hash: sourceHash,
      validation_status: assembled.validation.status,
      violation_count: assembled.validation.violations.length,
      visual_contract_count: countVisualContracts(assembled),
      prompt_count: Object.keys(assembled.passes).length,
      tenant_dir: path.relative(outDir, tenantDir),
    };
  }

  const passes = [
    { id: "01-story-architect", type: "story_architect" },
    { id: "02-executive-brief", type: "executive_brief" },
    { id: "03-industry-change", type: "industry_change" },
  ];

  for (const pass of passes) {
    const content = await callClaude(client, pass, makePrompt(pass, packet, assembled), tenantDir);
    assembled.passes[pass.id] = content;
    traceExecuted(pass.id, pass.type);
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
    traceExecuted(pass.id, pass.type);
    assembled.use_cases.push(content.client_visible);
  }

  assembled.dimensions = [];
  if (integratedMode) {
    // One call for every dimension's manifest, per the integrated Home Book
    // architecture -- replaces the one-call-per-dimension loop below.
    const pass = { id: "05-integrated-dimensions", type: "integrated_dimensions" };
    const content = await callClaude(client, pass, makePrompt(pass, packet, assembled), tenantDir);
    assembled.passes[pass.id] = content;
    traceExecuted(pass.id, pass.type);
    assembled.enterprise_story_integrated = content.client_visible?.enterprise_story ?? null;
    assembled.dimensions = content.client_visible?.dimensions ?? [];
  } else {
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
      traceExecuted(pass.id, pass.type);
      assembled.dimensions.push(content.client_visible);
    }
  }

  for (const pass of [
    { id: "06-relationships", type: "relationships" },
    { id: "07-evidence", type: "evidence" },
    { id: "08-coherence-review", type: "coherence" },
  ]) {
    const content = await callClaude(client, pass, makePrompt(pass, packet, assembled), tenantDir);
    assembled.passes[pass.id] = content;
    traceExecuted(pass.id, pass.type);
    if (pass.type === "relationships") assembled.relationships = content.client_visible;
    if (pass.type === "evidence") assembled.evidence = content.client_visible;
    if (pass.type === "coherence") assembled.coherence_review = content.client_visible;
  }

  assembled.execution_trace = executionTrace;
  const validation = validateCandidate(assembled);
  assembled.validation = validation;
  writeJson(path.join(tenantDir, "candidate-home-knowledge-v4.json"), assembled);
  writeJson(path.join(tenantDir, "execution-trace.json"), executionTrace);
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

async function runReresolveVisuals() {
  const files = discoverCandidateFiles(reresolveTarget);
  ensureDir(outDir);
  console.log(`[home-v4-reresolve] re-rendering ${files.length} real candidate(s) against today's dataset registry, no Claude calls`);
  const results = [];
  for (const file of files) {
    const candidate = JSON.parse(fs.readFileSync(file, "utf8"));
    const tenantKey = candidate.tenant?.canonical_key;
    if (!tenantKey) {
      console.log(`[home-v4-reresolve]   [SKIP] ${file}: no tenant.canonical_key`);
      continue;
    }
    if (!candidate.enterprise_book) {
      console.log(`[home-v4-reresolve]   [SKIP] ${tenantKey}: not a book-mode candidate (no enterprise_book)`);
      continue;
    }
    const sourceFile = path.join(repoRoot, "datasets", "tenant-inputs", tenantKey, "approved-content", "home", "design-contract-pack.json");
    const sourceText = fs.readFileSync(sourceFile, "utf8");
    const applicationOwnershipFacts = loadTenantApplicationOwnershipFacts(tenantKey);
    const sourceHash = sha256(sourceText + (applicationOwnershipFacts?.raw_hash ?? ""));
    const pack = JSON.parse(sourceText);
    pack.__source_file = sourceFile;
    pack.__application_ownership_facts = applicationOwnershipFacts;
    const packet = buildTenantContextPacket(pack, sourceHash);
    packet.deterministic_dataset_registry = loadTenantDatasetRegistry(tenantKey);
    packet.evidence_index = loadTenantEvidenceIndex(tenantKey);

    // Book mode is validated by validateIntegratedManifest(), not the
    // legacy full-candidate validateCandidate() (which checks fields --
    // relationships.graph_projections, dimension.summary_tab -- that book
    // mode deliberately doesn't produce). Match processTenant()'s real
    // book-mode validation call exactly.
    const bookValidate = (dims) => {
      const result = validateIntegratedManifest(
        { dimensions: dims, enterprise_story_integrated: candidate.enterprise_book?.executive_narrative ?? null },
        packet,
        { bindings: DIMENSION_DATASET_BINDINGS },
      );
      return { status: result.status === "pass" ? "candidate_review_ready" : "candidate_failed", violations: result.failures };
    };
    const before = bookValidate(candidate.dimensions);
    candidate.dimensions = renderDimensionsFromBook(candidate.enterprise_book, packet);
    const after = bookValidate(candidate.dimensions);
    candidate.validation = after;

    const tenantDir = path.join(outDir, "tenants", tenantKey);
    ensureDir(tenantDir);
    const outFile = path.join(tenantDir, "candidate-home-knowledge-v4.json");
    writeJson(outFile, candidate);
    results.push({
      tenant_key: tenantKey,
      before_status: before.status,
      before_violation_count: before.violations.length,
      after_status: after.status,
      after_violation_count: after.violations.length,
      out_file: path.relative(repoRoot, outFile),
    });
    console.log(
      `[home-v4-reresolve] ${tenantKey}: ${before.status}(${before.violations.length}) -> ${after.status}(${after.violations.length}) -- ${path.relative(repoRoot, outFile)}`,
    );
  }
  writeJson(path.join(outDir, "reresolve-visuals.json"), {
    reresolved_at: new Date().toISOString(),
    source: path.resolve(reresolveTarget),
    claude_calls: 0,
    results,
  });
  const failed = results.filter((r) => r.after_status !== "candidate_review_ready");
  console.log("");
  console.log(
    failed.length === 0
      ? `HOME_V4_RERESOLVE_VERDICT: ALL_REVIEW_READY (${results.length} candidates)`
      : `HOME_V4_RERESOLVE_VERDICT: FAILED (${failed.length}/${results.length} candidates)`,
  );
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
  if (reresolveMode) {
    await runReresolveVisuals();
    return;
  }
  if (!packetOnly && !preflightMode && !process.env.ANTHROPIC_API_KEY) {
    throw new Error("ANTHROPIC_API_KEY is required; refusing to fabricate candidate content.");
  }
  const skipClient = packetOnly || preflightMode;
  const Anthropic = skipClient ? null : (await import("@anthropic-ai/sdk")).default;
  const client = skipClient ? null : new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
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
  // One tenant's generation failure (a Claude API error, a source-data bug,
  // an unexpected exception) must not silently take every other tenant down
  // with it -- runPool itself has no per-item error isolation (a rejection
  // propagates straight through Promise.all). Catch here, write a real
  // generation-failed.json marker (so persist-home-knowledge-v4-book.mjs can
  // log a generation_failed job_runs row for this tenant instead of finding
  // nothing and staying silent), and let every other tenant keep going.
  let anyGenerationFailed = false;
  const results = await runPool(tenants, async (tenant) => {
    console.log(`[home-v4] generating ${tenant}`);
    try {
      const result = await processTenant(client, tenant);
      console.log(`[home-v4] done ${tenant}: ${result.validation_status}, visuals=${result.visual_contract_count}, findings=${result.violation_count}`);
      return result;
    } catch (error) {
      anyGenerationFailed = true;
      const tenantDir = path.join(outDir, "tenants", tenant);
      ensureDir(tenantDir);
      writeJson(path.join(tenantDir, "generation-failed.json"), {
        tenant_key: tenant,
        error_message: error instanceof Error ? error.message : String(error),
        failed_at: new Date().toISOString(),
      });
      console.log(`[home-v4] FAILED ${tenant}: ${error instanceof Error ? error.message : error}`);
      return {
        tenant_key: tenant,
        display_name: tenant,
        validation_status: "generation_failed",
        violation_count: 0,
        visual_contract_count: 0,
        prompt_count: 0,
        tenant_dir: path.relative(outDir, tenantDir),
      };
    }
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
  // Non-zero exit signals "at least one tenant failed" for the job's own
  // logs, without throwing -- every successfully-generated tenant's
  // candidate JSON is already written to disk at this point, and the
  // canary-and-persist chain must still run persist against them (see that
  // npm script's own comment for why it no longer uses `&&`).
  if (anyGenerationFailed) process.exitCode = 1;
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
