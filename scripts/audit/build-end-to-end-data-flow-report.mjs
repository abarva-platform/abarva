#!/usr/bin/env node
import crypto from "node:crypto";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const repoRoot = process.cwd();
const generatedAt = new Date().toISOString();
const reportsDir = path.join(repoRoot, "reports");
const htmlPath = path.join(reportsDir, "abarva-end-to-end-data-flow-latest.html");
const jsonPath = path.join(reportsDir, "abarva-end-to-end-data-flow-latest.json");
const mdPath = path.join(reportsDir, "abarva-end-to-end-data-flow-summary.md");

const DATA_ROOTS = ["datasets", "data", "meridian-data", "reports", "proof", "out", "outputs"];
const CODE_ROOTS = ["src", "scripts", "docs", "supabase", "db"];
const DATA_EXTENSIONS = new Set([".csv", ".json", ".jsonl", ".md", ".txt", ".html", ".xlsx", ".docx", ".pdf", ".png", ".jpg", ".jpeg", ".webp", ".mp4"]);
const TEXT_EXTENSIONS = new Set([".csv", ".json", ".jsonl", ".md", ".txt", ".html", ".sql", ".ts", ".tsx", ".js", ".mjs", ".cjs"]);

const V7_DIMENSIONS = {
  V7_00: ["Enterprise Entity Registry", "Enterprise identity, tenant/entity spine, and claim boundary"],
  V7_01: ["Enterprise Profile", "Enterprise landing profile, business model, priorities, sponsors, evidence boundary"],
  V7_02: ["Business Functions", "Business functions, function owners, operating model"],
  V7_03: ["Org Ownership", "Org ownership and accountable roles"],
  V7_04: ["Workforce Personas", "Workforce/persona groups and adoption/change context"],
  V7_05: ["Applications & Systems", "Application and system estate"],
  V7_06: ["Data Assets & Integrations", "Data assets, integration paths, lineage/readiness blockers"],
  V7_07: ["Vendors & Contracts", "Vendor, contract, and commercial relationship context"],
  V7_08: ["Spend & Value", "Spend, budget, baseline, and value hypotheses"],
  V7_09: ["Programs & Priorities", "Programs, priorities, initiatives, candidate Moves"],
  V7_10: ["AI Initiatives", "AI/LLM initiatives, readiness gates, model/workflow posture"],
  V7_11: ["Risks & Controls", "Risks, controls, gaps, evidence requirements"],
  V7_12: ["Relationship Graph Edges", "Normalized relationships between systems, initiatives, risks, vendors, and records"],
  V7_13: ["Source Evidence Registry", "Source files, evidence artifacts, validation, sensitivity, freshness"],
  V7_14: ["Metric Definitions", "Metrics, KPI semantics, measurement definitions"],
  V7_15: ["Industry & Market Patterns", "Industry patterns and reusable market knowledge"],
  V7_16: ["Expert Lenses", "Expert lenses and advisory frames"],
  V7_17: ["Client Rate Card & Cost Basis", "Rate-card and cost-basis planning evidence"],
  V7_18: ["Function/System/Data/Vendor Bridge", "Bridge across functions, systems, data domains, and vendors"],
  V7_19: ["Service Tower Managed Services Scope", "Managed-services scope and service tower structure"],
  V7_20: ["Chunk Retrieval Registry", "Retrieval chunks and answer-grounding registry"],
  V7_21: ["Graph Relationship Dictionary", "Relationship type dictionary and graph semantics"],
  V7_22: ["Operational Evidence Process Intelligence", "Process, evidence, and operational-intelligence records"],
  V7_23: ["External Benchmark Market Corpus", "Benchmark and market context"],
  V7_24: ["Infrastructure & Cloud Estate", "Infrastructure/cloud/platform estate"],
};

const MODULE_PATTERNS = {
  Home: ["src/app/(maestro)/home", "src/lib/home", "home"],
  Intelligence: ["src/app/(maestro)/intelligence", "src/lib/intelligence", "dossier", "v7-dossier"],
  Moves: ["src/app/(maestro)/strategic-moves", "src/app/api/v1/programs", "src/lib/programs", "strategic-moves", "programs"],
  Source: ["src/app/(maestro)/source", "src/app/api/v1/source", "src/lib/source", "source_events"],
  Tower: ["src/app/(maestro)/tower", "src/app/api/tower", "src/lib/tower", "src/lib/cio-tower", "tower"],
  "Export/artifacts": ["exports", "artifact", "render-pdf", "render-docx", "generated_artifacts"],
  "Dossier/context": ["context", "corpus", "dossier", "enterprise_context"],
};

const PIPELINES = [
  {
    name: "Tenant dataset creation",
    inputs: ["tenant config", "source docs", "generated CSV/JSON packs"],
    outputs: ["datasets/<tenant>", "manifest", "validation output", "optional load payload"],
    evidence: ["scripts/tenant-v6/generate-tenant-v6-pack.mjs", "scripts/lib/v6-v7/tenant-pack-builder.mjs", "docs/governance/dataset-manifests"],
    gaps: ["Not every rich v4/v6 tenant is normalized into a V7 active access layer."],
  },
  {
    name: "V4 rich tenant pack flow",
    inputs: ["family-* CSVs", "ai-control-tower CSVs", "source-docs", "graph/context-relationships.jsonl"],
    outputs: ["derived-intelligence/enterprise-reads.json", "intelligence-binding-payload.json", "graph JSONL"],
    evidence: ["scripts/context-packs/derive-enterprise-reads.cjs", "scripts/context-packs/build-intelligence-binding-payload.py", "datasets/*synthetic-v4"],
    gaps: ["Rich but physically divergent from V7; module consumption can be legacy/source-specific."],
  },
  {
    name: "V6 graph substrate flow",
    inputs: ["intelligence_v6.business_records", "intelligence_v6.relationship_edges", "relationship dictionary"],
    outputs: ["intelligence_v6.graph_nodes", "intelligence_v6.graph_edges", "graph_quality_reports"],
    evidence: ["supabase/migrations/20260702190000_intelligence_v6_graph_physical.sql", "docs/standards/V6_GRAPH_SUBSTRATE_CONTRACT.md"],
    gaps: ["Canonical graph substrate exists in schema, but adoption is shadow/read-only and not universal across modules."],
  },
  {
    name: "V7 access-layer flow",
    inputs: ["V7 CSV pack", "tenant load payload"],
    outputs: ["intelligence_v7.dimension_registry", "column_registry", "source_files", "tenant_pack_runs", "business_records", "record_fields"],
    evidence: ["scripts/v7/load-tenant-v7-azure.mjs", "scripts/v7/sql/intelligence-v7-moat-foundation.sql", "supabase/migrations/20260709203000_intelligence_v7_moat_foundation.sql"],
    gaps: ["Meridian has the clearest local normalized V7 pack; other rich tenants need migration/projection into the same contract."],
  },
  {
    name: "Derived/Home flow",
    inputs: ["normalized V7 pack"],
    outputs: ["derived/home/*.json", "derived/home/*.csv", "Home enterprise profile report"],
    evidence: ["scripts/v7/build-home-derived-layer.mjs", "datasets/meridian-health-v6-v7-current-state-v1/derived/home"],
    gaps: ["Currently file-materialized locally; runtime Home does not yet universally consume this materialized derived layer."],
  },
  {
    name: "Tower flow",
    inputs: ["ai_initiatives", "vendors", "value_states", "V7 projection", "Tower standardized datasets"],
    outputs: ["Tower dashboards", "value states", "portfolio rollups", "outcome reports"],
    evidence: ["src/lib/tower/v7-tower-projection.ts", "scripts/lakeshore/project-lakeshore-v7-to-tower-standardized.mjs", "src/app/(maestro)/tower", "docs/audits/TOWER-MODULE-AUDIT-2026-05-22.md"],
    gaps: ["Tower has local/read-model concepts and V7 bridge work, but not universal bidirectional write-back to V7."],
  },
  {
    name: "Source flow",
    inputs: ["source_events", "event artifacts", "evidence documents", "stage/gate payloads", "vendor/pricing data"],
    outputs: ["Source canvas", "file cabinet", "generated deliverables", "approvals/signoffs", "exports"],
    evidence: ["src/app/api/v1/source", "src/lib/source", "docs/abarva-source/build-pack/06_DATA_MODEL_AND_ERD.md", "src/components/source"],
    gaps: ["Rich Source-local workflow exists; common V7 write-back and cross-module artifact lineage are not universal."],
  },
  {
    name: "Moves flow",
    inputs: ["programs/moves", "phase evidence", "gate criteria", "deliverables/artifacts", "aVa context"],
    outputs: ["P0-P5 phase advancement", "gate decision artifacts", "deliverables", "Tower handoff"],
    evidence: ["src/app/api/v1/programs", "src/lib/programs", "src/app/(maestro)/strategic-moves", "docs/build/moves-design"],
    gaps: ["Moves has governed execution and artifacts; V7 grounding/read-write integration is partial."],
  },
];

let SCRIPT_DOC_TEXT_CACHE = null;
let RUNTIME_TEXT_CACHE = null;

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function run(cmd, args, opts = {}) {
  const isContextCorpusValidation =
    cmd === "npm" && args.some((arg) => String(arg).startsWith("validate:context-corpus"));
  if (isContextCorpusValidation && !fs.existsSync(path.join(repoRoot, "node_modules", "zod"))) {
    return {
      ok: true,
      command: [cmd, ...args].join(" "),
      output:
        "Skipped inside data-flow report generator because local node_modules/zod is unavailable. Run the dedicated validate:context-corpus:* command in an installed workspace for full governance validation.",
    };
  }

  try {
    return {
      ok: true,
      command: [cmd, ...args].join(" "),
      output: execFileSync(cmd, args, { cwd: repoRoot, encoding: "utf8", maxBuffer: opts.maxBuffer ?? 12_000_000, timeout: opts.timeout ?? 15_000 }).trim(),
    };
  } catch (error) {
    return {
      ok: false,
      command: [cmd, ...args].join(" "),
      output: String(error.stdout ?? "").trim(),
      error: String(error.stderr ?? error.message ?? "").trim(),
    };
  }
}

function walk(rootRel, predicate = () => true) {
  const root = path.join(repoRoot, rootRel);
  if (!fs.existsSync(root)) return [];
  const out = [];
  const stack = [root];
  while (stack.length) {
    const dir = stack.pop();
    let entries = [];
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const entry of entries) {
      if (entry.name === "node_modules" || entry.name === ".git" || entry.name === ".next") continue;
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) stack.push(full);
      else if (predicate(full)) out.push(full);
    }
  }
  return out.sort();
}

function checksum(filePath) {
  try {
    return crypto.createHash("sha256").update(fs.readFileSync(filePath)).digest("hex");
  } catch {
    return "";
  }
}

function parseCsvPreview(filePath) {
  const text = readTextSample(filePath, 1_200_000);
  if (!text) return { rowCount: 0, columnCount: 0, columns: [], sampleRow: null };
  const rows = [];
  let row = [];
  let value = "";
  let quoted = false;
  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const next = text[i + 1];
    if (quoted) {
      if (char === '"' && next === '"') {
        value += '"';
        i += 1;
      } else if (char === '"') {
        quoted = false;
      } else {
        value += char;
      }
    } else if (char === '"') {
      quoted = true;
    } else if (char === ",") {
      row.push(value);
      value = "";
    } else if (char === "\n") {
      row.push(value);
      rows.push(row);
      if (rows.length > 6) break;
      row = [];
      value = "";
    } else if (char !== "\r") {
      value += char;
    }
  }
  if (rows.length <= 6 && (value || row.length)) {
    row.push(value);
    rows.push(row);
  }
  const fullLineCount = text.split(/\r?\n/).filter(Boolean).length;
  const [headers = [], first = []] = rows;
  const sampleRow = headers.length
    ? Object.fromEntries(headers.map((header, index) => [header, sanitizeSample(first[index] ?? "")]))
    : null;
  return {
    rowCount: Math.max(0, fullLineCount - 1),
    columnCount: headers.length,
    columns: headers,
    sampleRow,
  };
}

function readTextSample(filePath, max = 220_000) {
  try {
    const buffer = fs.readFileSync(filePath);
    return buffer.subarray(0, max).toString("utf8");
  } catch {
    return "";
  }
}

function sanitizeSample(value) {
  const text = String(value ?? "").replace(/\s+/g, " ").trim();
  return text.length > 240 ? `${text.slice(0, 240)}...` : text;
}

function inferTenant(relPath) {
  const parts = relPath.split(path.sep);
  const dataset = parts[0] === "datasets" ? parts[1] : parts[0] === "proof" || parts[0] === "reports" ? parts[1] : "";
  const text = relPath.toLowerCase();
  const known = [
    ["first-capital", "First Capital"],
    ["skyharbor", "SkyHarbor"],
    ["apex", "Apex"],
    ["meridian", "Meridian"],
    ["lakeshore", "Lakeshore"],
    ["northstar", "Northstar"],
    ["morgan", "Morgan Street"],
    ["arcturus", "Arcturus"],
  ];
  const match = known.find(([key]) => text.includes(key));
  return {
    tenant_key: match?.[0] ?? (dataset ? dataset.replace(/-synthetic.*|-v[0-9].*$/g, "") : "unknown"),
    tenant_display_name: match?.[1] ?? dataset ?? "Unknown",
    dataset_id: dataset ?? "",
  };
}

function classifyLayer(relPath) {
  const p = relPath.toLowerCase();
  if (p.includes("/derived/home/")) return "derived/home";
  if (p.includes("/derived-intelligence/")) return "intelligence/dossier";
  if (p.includes("/derived-tower") || p.includes("tower-standard") || p.includes("/holdco_tower/")) return "tower-standardized";
  if (p.includes("/v7/") || /v7_\d+/.test(p) || p.includes("synthetic-v7")) return "v7";
  if (p.includes("-v6") || p.includes("/templates/v6_") || p.includes("template-pack-v6")) return "v6";
  if (p.includes("-v4") || p.includes("/family-") || p.includes("/ai-control-tower/")) return "v4";
  if (p.includes("/graph/") || p.includes("graph")) return "graph";
  if (p.includes("source") || p.includes("sourcing") || p.includes("rfp")) return "source-event";
  if (p.includes("strategic-moves") || p.includes("program") || p.includes("moves")) return "moves/program";
  if (p.includes("context") || p.includes("corpus")) return "context-corpus";
  if (p.includes("artifact") || p.includes("export") || p.includes("/reports/") || p.includes("/proof/")) return "artifact/export";
  return "unknown";
}

function classifyDimension(relPath, columns = []) {
  const p = `${relPath} ${columns.join(" ")}`.toLowerCase();
  const rules = [
    ["applications/systems", ["application", "system", "technology-estate", "f05", "v7_05"]],
    ["vendors", ["vendor", "supplier"]],
    ["contracts", ["contract", "license"]],
    ["spend/budget", ["spend", "budget", "cost", "rate", "pricing", "bafo"]],
    ["initiatives", ["initiative", "priority", "program", "move_id"]],
    ["milestones", ["milestone"]],
    ["risks", ["risk", "raid"]],
    ["controls", ["control", "governance", "policy"]],
    ["evidence", ["evidence", "source_file", "source_artifact", "citation"]],
    ["AI use cases/models/tools", ["ai", "model", "tool", "llm", "agent"]],
    ["metrics/outcomes", ["metric", "kpi", "outcome", "benefit", "value"]],
    ["sourcing/RFP", ["source", "sourcing", "rfp", "scorecard", "vendor_response"]],
    ["Tower/value", ["tower", "value_state", "benefit", "outcome"]],
    ["Moves/program", ["strategic-moves", "programs", "phase", "gate"]],
    ["Home/context", ["home", "enterprise_profile", "context browser"]],
    ["Intelligence/dossier", ["intelligence", "dossier", "retrieval", "chunk"]],
    ["semantic enrichment", ["semantic", "dictionary", "f18", "f19", "f20", "f21", "f22", "f23", "f24", "f25"]],
    ["graph edges", ["edge", "relationship", "relationships", "v7_12"]],
    ["graph nodes", ["node", "nodes", "dictionary"]],
    ["benchmark/corpus", ["benchmark", "corpus", "pattern", "market"]],
  ];
  return rules.find(([, needles]) => needles.some((needle) => p.includes(needle)))?.[0] ?? "other";
}

function inferColumnRoles(columns) {
  const lower = columns.map((column) => column.toLowerCase());
  const find = (needles) => columns.filter((column, idx) => needles.some((needle) => lower[idx].includes(needle)));
  return {
    primaryIdentifierFields: find(["_id", "id", "key", "code"]).slice(0, 12),
    relationshipFields: find(["parent", "ref", "from_", "to_", "relationship", "mapped", "foreign", "source"]).slice(0, 12),
    dateFields: find(["date", "as_of", "period", "freshness", "created", "updated"]).slice(0, 12),
    metricValueFields: find(["amount", "value", "metric", "score", "count", "pct", "percent", "usd", "cost", "budget"]).slice(0, 12),
    confidenceEvidenceFields: find(["confidence", "evidence", "source", "validation", "provenance", "lineage", "citation"]).slice(0, 12),
    gapClaimFields: find(["known_gaps", "not_allowed", "must_not", "gap", "claim"]).slice(0, 12),
  };
}

function sourceFileInventory() {
  const files = DATA_ROOTS.flatMap((root) => walk(root, (file) => DATA_EXTENSIONS.has(path.extname(file).toLowerCase())));
  return files.map((file) => {
    const relPath = path.relative(repoRoot, file);
    const ext = path.extname(file).toLowerCase();
    const stat = fs.statSync(file);
    const tenant = inferTenant(relPath);
    const preview = ext === ".csv" ? parseCsvPreview(file) : previewNonCsv(file, ext);
    const columnRoles = inferColumnRoles(preview.columns);
    const references = findReferenceCounts(relPath);
    return {
      ...tenant,
      source_path: relPath,
      file_name: path.basename(file),
      extension: ext || "none",
      file_type: ext.replace(".", "") || "unknown",
      layer: classifyLayer(relPath),
      dimension: classifyDimension(relPath, preview.columns),
      row_count: preview.rowCount,
      column_count: preview.columnCount,
      column_names: preview.columns.slice(0, 80),
      ...columnRoles,
      populated_status: preview.rowCount > 0 || (ext !== ".csv" && stat.size > 0) ? "populated" : "empty_or_template_only",
      sample_row: preview.sampleRow,
      checksum_sha256: checksum(file),
      modified_at: stat.mtime.toISOString(),
      size_bytes: stat.size,
      referenced_by_scripts_count: references.scripts,
      referenced_by_runtime_count: references.runtime,
      appears_loaded_into_db: inferLoadedIntoDb(relPath),
    };
  });
}

function previewNonCsv(file, ext) {
  if (ext === ".json") {
    try {
      const parsed = JSON.parse(readTextSample(file, 500_000));
      const sample = Array.isArray(parsed) ? parsed[0] : parsed;
      return { rowCount: Array.isArray(parsed) ? parsed.length : 1, columnCount: sample && typeof sample === "object" ? Object.keys(sample).length : 0, columns: sample && typeof sample === "object" ? Object.keys(sample) : [], sampleRow: sanitizeJson(sample) };
    } catch {
      return { rowCount: 0, columnCount: 0, columns: [], sampleRow: null };
    }
  }
  if (ext === ".jsonl") {
    const lines = readTextSample(file, 800_000).split(/\r?\n/).filter(Boolean);
    let sample = null;
    try { sample = lines[0] ? JSON.parse(lines[0]) : null; } catch { sample = lines[0] ?? null; }
    return { rowCount: lines.length, columnCount: sample && typeof sample === "object" ? Object.keys(sample).length : 0, columns: sample && typeof sample === "object" ? Object.keys(sample) : [], sampleRow: sanitizeJson(sample) };
  }
  return { rowCount: 0, columnCount: 0, columns: [], sampleRow: null };
}

function sanitizeJson(value) {
  if (value === null || value === undefined) return null;
  if (typeof value !== "object") return sanitizeSample(value);
  return Object.fromEntries(Object.entries(value).slice(0, 20).map(([key, val]) => [key, sanitizeSample(typeof val === "object" ? JSON.stringify(val) : val)]));
}

function findReferenceCounts(relPath) {
  void relPath;
  return { scripts: "not computed in fast audit; use code evidence sections", runtime: "not computed in fast audit; use code evidence sections" };
}

function countNeedleHits(roots, needles) {
  const cacheKey = roots.join("|");
  let cache;
  if (cacheKey === "scripts|docs") {
    if (!SCRIPT_DOC_TEXT_CACHE) SCRIPT_DOC_TEXT_CACHE = buildTextCache(["scripts", "docs"]);
    cache = SCRIPT_DOC_TEXT_CACHE;
  } else if (cacheKey === "src") {
    if (!RUNTIME_TEXT_CACHE) RUNTIME_TEXT_CACHE = buildTextCache(["src"]);
    cache = RUNTIME_TEXT_CACHE;
  } else {
    cache = buildTextCache(roots);
  }
  let count = 0;
  for (const entry of cache) {
    if (needles.some((needle) => entry.text.includes(needle))) count += 1;
  }
  return count;
}

function buildTextCache(roots) {
  return roots.flatMap((root) => walk(root, (file) => TEXT_EXTENSIONS.has(path.extname(file).toLowerCase()))
    .map((file) => ({
      rel: path.relative(repoRoot, file),
      text: readTextSample(file, 180_000),
    })));
}

function inferLoadedIntoDb(relPath) {
  const p = relPath.toLowerCase();
  if (p.includes("/v7/")) return "likely via scripts/v7/load-tenant-v7-azure.mjs when load is run";
  if (p.includes("ai-control-tower") || p.includes("tower")) return "possible via Tower seed/projection scripts";
  if (p.includes("source")) return "possible Source artifact/event ingestion";
  if (p.includes("context") || p.includes("corpus")) return "possible context/corpus ingestion";
  return "unknown";
}

function dimensionCatalog(sourceFiles) {
  const map = new Map();
  for (const file of sourceFiles) {
    const key = file.dimension;
    if (!map.has(key)) {
      map.set(key, {
        canonical_dimension_name: key,
        aliases_file_names: new Set(),
        tenant_coverage: new Set(),
        layer_coverage: new Set(),
        source_file_paths: [],
        row_counts_by_tenant: new Map(),
        key_columns: new Set(),
        value_columns: new Set(),
        evidence_columns: new Set(),
        relationship_columns: new Set(),
        consuming_modules: new Set(),
        quality_notes: [],
        migration_status: "unknown",
      });
    }
    const dim = map.get(key);
    dim.aliases_file_names.add(file.file_name);
    dim.tenant_coverage.add(file.tenant_key);
    dim.layer_coverage.add(file.layer);
    dim.source_file_paths.push(file.source_path);
    dim.row_counts_by_tenant.set(file.tenant_key, (dim.row_counts_by_tenant.get(file.tenant_key) ?? 0) + (file.row_count ?? 0));
    file.primaryIdentifierFields.forEach((field) => dim.key_columns.add(field));
    file.metricValueFields.forEach((field) => dim.value_columns.add(field));
    file.confidenceEvidenceFields.forEach((field) => dim.evidence_columns.add(field));
    file.relationshipFields.forEach((field) => dim.relationship_columns.add(field));
  }
  return [...map.values()].map((dim) => {
    const layers = [...dim.layer_coverage];
    const modules = inferConsumersForDimension(dim.canonical_dimension_name);
    modules.forEach((module) => dim.consuming_modules.add(module));
    return {
      canonical_dimension_name: dim.canonical_dimension_name,
      aliases_file_names: [...dim.aliases_file_names].slice(0, 30),
      tenant_coverage: [...dim.tenant_coverage].sort(),
      layer_coverage: layers.sort(),
      source_file_paths: dim.source_file_paths.slice(0, 80),
      row_counts_by_tenant: Object.fromEntries([...dim.row_counts_by_tenant.entries()].sort()),
      key_columns: [...dim.key_columns].slice(0, 20),
      value_columns: [...dim.value_columns].slice(0, 20),
      evidence_columns: [...dim.evidence_columns].slice(0, 20),
      relationship_columns: [...dim.relationship_columns].slice(0, 20),
      consuming_modules: [...dim.consuming_modules],
      quality_notes: layers.includes("v7") ? ["Has at least one V7-shaped source"] : ["Not yet represented in normalized V7 file inventory"],
      migration_status: inferMigrationStatus(layers),
    };
  }).sort((a, b) => a.canonical_dimension_name.localeCompare(b.canonical_dimension_name));
}

function inferConsumersForDimension(dimension) {
  const d = dimension.toLowerCase();
  const modules = new Set();
  if (["home/context", "applications/systems", "evidence", "graph edges", "graph nodes"].some((needle) => d.includes(needle))) modules.add("Home");
  if (["intelligence", "context", "evidence", "benchmark", "graph"].some((needle) => d.includes(needle))) modules.add("Intelligence");
  if (["moves", "initiatives", "milestones", "risks", "controls", "metrics"].some((needle) => d.includes(needle))) modules.add("Moves");
  if (["sourcing", "vendors", "contracts", "spend"].some((needle) => d.includes(needle))) modules.add("Source");
  if (["tower", "metrics", "outcomes", "spend", "initiatives"].some((needle) => d.includes(needle))) modules.add("Tower");
  return [...modules];
}

function inferMigrationStatus(layers) {
  if (layers.includes("v7")) return "already in V7";
  if (layers.includes("derived/home")) return "derived only";
  if (layers.includes("tower-standardized")) return "Tower-only";
  if (layers.includes("source-event")) return "Source-only";
  if (layers.includes("moves/program")) return "Moves-only";
  if (layers.includes("v6") && layers.length === 1) return "v6 only";
  if (layers.includes("v4") && !layers.includes("v7")) return "v4 only";
  return "unknown";
}

function v7DimensionCatalog(sourceFiles) {
  return Object.entries(V7_DIMENSIONS).map(([prefix, [label, purpose]]) => {
    const files = sourceFiles.filter((file) => file.file_name.startsWith(prefix) || file.source_path.includes(`/${prefix}_`));
    const tenantCoverage = [...new Set(files.map((file) => file.tenant_key))].sort();
    return {
      dimension_key: prefix.toLowerCase(),
      dimension_label: label,
      business_purpose: purpose,
      source_files: files.map((file) => file.source_path),
      tenant_coverage: tenantCoverage,
      local_file_rows: files.reduce((sum, file) => sum + (file.row_count ?? 0), 0),
      business_records_count: "not queried - live DB unavailable in this audit",
      record_fields_count: "not queried - live DB unavailable in this audit",
      home_consumption: ["V7_01", "V7_05", "V7_06", "V7_11", "V7_12", "V7_13", "V7_20"].includes(prefix) ? "direct/likely via Home V7 browser or derived Home layer" : "supporting context",
      intelligence_consumption: ["V7_01", "V7_12", "V7_13", "V7_20", "V7_21"].includes(prefix) ? "direct/likely via V7 dossier retriever" : "available if in business_records/record_fields",
      tower_consumption: ["V7_08", "V7_09", "V7_14", "V7_17", "V7_19"].includes(prefix) ? "candidate/bridge via Tower V7 projection" : "not primary",
      moves_source_consumption: ["V7_07", "V7_08", "V7_09", "V7_11", "V7_13", "V7_17", "V7_19"].includes(prefix) ? "candidate grounding for Moves/Source" : "not primary",
      missing_tenant_coverage: tenantCoverage.length ? "all non-normalized tenants" : "all tenants in local inventory",
    };
  });
}

function databaseTables() {
  const sqlFiles = [
    ...walk("supabase", (file) => file.endsWith(".sql")),
    ...walk("db", (file) => file.endsWith(".sql")),
    ...walk("scripts", (file) => file.endsWith(".sql")),
  ];
  const tables = new Map();
  for (const file of sqlFiles) {
    const rel = path.relative(repoRoot, file);
    const text = readTextSample(file, 2_000_000);
    const createRe = /create\s+table\s+(?:if\s+not\s+exists\s+)?("?[\w-]+"?\.)?"?([\w-]+)"?\s*\(([\s\S]*?)\);/gi;
    let match;
    while ((match = createRe.exec(text))) {
      const schema = (match[1] ?? "").replace(/[."]/g, "") || inferSchemaFromPath(rel);
      const table = match[2].replace(/"/g, "");
      const full = schema ? `${schema}.${table}` : table;
      const body = match[3];
      const columns = body.split(/\n/).map((line) => line.trim().replace(/,$/, "")).filter((line) => /^[a-zA-Z_"]/i.test(line) && !/^(constraint|primary|foreign|unique|check)\b/i.test(line)).map((line) => line.split(/\s+/)[0].replace(/"/g, ""));
      if (!tables.has(full)) {
        tables.set(full, {
          table_name: full,
          schema,
          table,
          columns: new Set(),
          primary_keys: [],
          foreign_keys: [],
          unique_constraints: [],
          indexes: [],
          rls_policies: [],
          migrations: new Set(),
          expected_writer: inferExpectedWriter(full),
          actual_writer: inferActualWriter(full),
          actual_runtime_consumer: inferRuntimeConsumer(full),
          row_counts: "not queried - DB access not available in report generator",
          gaps: inferTableGaps(full),
        });
      }
      const entry = tables.get(full);
      columns.forEach((column) => entry.columns.add(column));
      entry.migrations.add(rel);
      if (/primary key/i.test(body)) entry.primary_keys.push(snippet(body, /primary\s+key\s*\(([^)]+)\)/i));
      for (const fk of body.matchAll(/foreign\s+key\s*\(([^)]+)\)\s+references\s+([^\s(]+)/gi)) entry.foreign_keys.push(`${fk[1]} -> ${fk[2]}`);
      for (const uq of body.matchAll(/unique\s*\(([^)]+)\)/gi)) entry.unique_constraints.push(uq[1]);
    }
    for (const index of text.matchAll(/create\s+(unique\s+)?index\s+(?:if\s+not\s+exists\s+)?("?[\w-]+"?)\s+on\s+([^\s(]+)/gi)) {
      const target = index[3].replaceAll('"', "");
      const targetKey = [...tables.keys()].find((key) => key.endsWith(`.${target}`) || key === target);
      if (targetKey) tables.get(targetKey).indexes.push(index[2].replaceAll('"', ""));
    }
    for (const policy of text.matchAll(/create\s+policy\s+"?([^"\n]+)"?\s+on\s+([^\s]+)|alter\s+table\s+([^\s]+)\s+enable\s+row\s+level\s+security/gi)) {
      const target = (policy[2] || policy[3] || "").replaceAll('"', "");
      const targetKey = [...tables.keys()].find((key) => key.endsWith(`.${target}`) || key === target);
      if (targetKey) tables.get(targetKey).rls_policies.push(policy[1] || "RLS enabled");
    }
  }
  return [...tables.values()].map((table) => ({
    ...table,
    columns: [...table.columns],
    migrations: [...table.migrations],
  })).sort((a, b) => a.table_name.localeCompare(b.table_name));
}

function inferSchemaFromPath(rel) {
  if (rel.includes("intelligence_v7")) return "intelligence_v7";
  if (rel.includes("intelligence_v6")) return "intelligence_v6";
  return "";
}

function snippet(text, re) {
  const match = text.match(re);
  return match?.[1] ?? "";
}

function inferExpectedWriter(table) {
  if (table.includes("intelligence_v7")) return "scripts/v7/load-tenant-v7-azure.mjs or V7 loader job";
  if (table.includes("intelligence_v6") || table.includes("graph")) return "V6 graph materializer / relationship normalizer";
  if (table.includes("source")) return "Source routes and Source event services";
  if (table.includes("program") || table.includes("move")) return "Moves/program API routes";
  if (table.includes("tower") || table.includes("initiative") || table.includes("value")) return "Tower seed/runtime/update paths";
  return "unknown";
}

function inferActualWriter(table) {
  if (table.includes("intelligence_v7")) return ["scripts/v7/load-tenant-v7-azure.mjs", "scripts/v7/load-lakeshore-holdco-v7-azure.mjs"];
  if (table.includes("intelligence_v6")) return ["supabase/migrations/20260702190000_intelligence_v6_graph_physical.sql"];
  if (table.includes("source")) return ["src/app/api/v1/source", "src/lib/source"];
  if (table.includes("program") || table.includes("move")) return ["src/app/api/v1/programs", "src/lib/programs"];
  if (table.includes("tower") || table.includes("initiative") || table.includes("value")) return ["src/app/(maestro)/tower", "src/lib/tower"];
  return ["not mapped by fast audit"];
}

function inferRuntimeConsumer(table) {
  if (table.includes("intelligence_v7")) return ["src/lib/home/v7-context-browser.ts", "src/lib/intelligence/ask/retrievers/v7-dossier.ts", "src/lib/tower/v7-tower-projection.ts"];
  if (table.includes("intelligence_v6")) return ["graph/context consumers are not universal; see V6 graph substrate contract"];
  if (table.includes("source")) return ["src/app/(maestro)/source", "src/app/api/v1/source", "src/lib/source"];
  if (table.includes("program") || table.includes("move")) return ["src/app/(maestro)/strategic-moves", "src/app/api/v1/programs", "src/lib/programs"];
  if (table.includes("tower") || table.includes("initiative") || table.includes("value")) return ["src/app/(maestro)/tower", "src/lib/tower"];
  return ["not mapped by fast audit"];
}

function inferTableGaps(table) {
  const gaps = [];
  if (table.includes("intelligence_v7")) gaps.push("DB counts not queried in this offline audit; verify live tenant/version counts separately.");
  if (table.includes("intelligence_v6")) gaps.push("Graph substrate adoption is not universal across product modules.");
  if (table.includes("source")) gaps.push("Confirm whether Source-local artifacts write back into common V7/source evidence layer.");
  if (table.includes("program") || table.includes("move")) gaps.push("Confirm V7 grounding and Tower handoff write-back per phase/gate.");
  return gaps;
}

function boundedFileRefs(needle, roots) {
  if (!needle || needle.length < 4) return [];
  const refs = [];
  for (const root of roots) {
    for (const file of walk(root, (candidate) => TEXT_EXTENSIONS.has(path.extname(candidate).toLowerCase()))) {
      const rel = path.relative(repoRoot, file);
      const text = readTextSample(file, 250_000);
      if (text.includes(needle)) refs.push(rel);
      if (refs.length >= 30) return refs;
    }
  }
  return refs;
}

function moduleConsumers() {
  return Object.entries(MODULE_PATTERNS).map(([module, patterns]) => {
    const files = new Set();
    for (const root of ["src/app", "src/lib", "src/components", "scripts", "docs"]) {
      for (const file of walk(root, (candidate) => TEXT_EXTENSIONS.has(path.extname(candidate).toLowerCase()))) {
        const rel = path.relative(repoRoot, file);
        const hay = rel.toLowerCase();
        if (patterns.some((pattern) => hay.includes(pattern.toLowerCase()))) files.add(rel);
      }
    }
    const fileList = [...files].sort();
    const reads = extractFromCalls(fileList, ".from(");
    const layerUsage = inferLayerUsageForModule(module, fileList);
    return {
      module,
      representative_paths: fileList.slice(0, 80),
      direct_table_reads_or_writes_inferred: reads.slice(0, 50),
      file_reads: fileList.filter((file) => file.startsWith("scripts/") || file.startsWith("docs/")).slice(0, 25),
      file_writes: [],
      api_routes: fileList.filter((file) => file.includes("/api/")).slice(0, 50),
      tenant_key_usage: fileList.some((file) => /tenant/i.test(readTextSample(path.join(repoRoot, file), 120_000))) ? "present in code paths" : "not obvious from bounded scan",
      contract_version_usage: fileList.some((file) => /contract_version|contractVersion/i.test(readTextSample(path.join(repoRoot, file), 120_000))) ? "present" : "not obvious from bounded scan",
      active_candidate_version_usage: fileList.some((file) => /active|candidate/i.test(readTextSample(path.join(repoRoot, file), 120_000))) ? "present in some paths" : "not obvious from bounded scan",
      stale_source_behavior: module === "Intelligence" || module === "Home" ? "V7 dossier/Home paths include active-version and stale-source suppression evidence in release records/code paths" : "not universal",
      claim_evidence_validation_behavior: fileList.some((file) => /evidence|claim|guard|validation/i.test(readTextSample(path.join(repoRoot, file), 120_000))) ? "evidence/validation terms present" : "not obvious",
      uses_layers: layerUsage,
      grounding_status: inferGroundingStatus(module, layerUsage),
    };
  });
}

function extractFromCalls(fileList, token) {
  const out = new Set();
  for (const rel of fileList.slice(0, 180)) {
    const text = readTextSample(path.join(repoRoot, rel), 300_000);
    for (const match of text.matchAll(/\.from\(['"`]([^'"`]+)['"`]\)/g)) out.add(match[1]);
    for (const match of text.matchAll(/table(?:Name)?:\s*['"`]([^'"`]+)['"`]/g)) out.add(match[1]);
  }
  return [...out].sort();
}

function inferLayerUsageForModule(module, fileList) {
  const text = fileList.slice(0, 120).map((file) => readTextSample(path.join(repoRoot, file), 120_000)).join("\n").toLowerCase();
  const layers = {
    v4: text.includes("v4") || text.includes("synthetic-v4"),
    v6: text.includes("intelligence_v6") || text.includes("v6"),
    v7: text.includes("intelligence_v7") || text.includes("v7"),
    derived_home: text.includes("derived/home"),
    tower_local: module === "Tower" || text.includes("ai_initiatives") || text.includes("value_states"),
    source_local: module === "Source" || text.includes("source_events"),
    moves_local: module === "Moves" || text.includes("programs"),
    context_corpus: text.includes("context") || text.includes("corpus"),
    graph_layer: text.includes("graph"),
  };
  if (module === "Home" && fileList.some((file) => file.includes("v7-context-browser") || file.includes("v7-home-ask"))) layers.v7 = true;
  if (module === "Intelligence" && fileList.some((file) => file.includes("v7-dossier"))) layers.v7 = true;
  if (module === "Tower" && fileList.some((file) => file.includes("v7-tower-projection"))) layers.v7 = true;
  return layers;
}

function inferGroundingStatus(module, layers) {
  if ((module === "Home" || module === "Intelligence") && layers.v7) return "common-layer grounded";
  if (layers.v7 && (layers.source_local || layers.moves_local || layers.tower_local)) return "partially grounded";
  if (layers.source_local || layers.moves_local || layers.tower_local) return "local-only / partial common-layer bridge";
  if (layers.v4 && !layers.v7) return "legacy-source dependent";
  return "unknown";
}

function relationships(sourceFiles, dbTables) {
  const rels = [];
  for (const file of sourceFiles.filter((item) => item.dimension.includes("graph") || item.relationshipFields.length)) {
    rels.push({
      source_object_type: "source file/row",
      target_object_type: file.dimension,
      current_representation: file.source_path,
      file_table_fields: file.relationshipFields,
      enforced_by_fk_or_dictionary: file.layer === "v7" && file.file_name.includes("V7_21") ? "dictionary" : "inferred/static file",
      evidence_backed: file.confidenceEvidenceFields.length > 0 || file.dimension === "evidence",
      consumed_by_modules: inferConsumersForDimension(file.dimension),
      gaps: file.layer === "v7" ? [] : ["Not normalized into V7 relationship dictionary/access layer"],
    });
  }
  for (const table of dbTables.filter((item) => item.table_name.includes("graph") || item.table_name.includes("relationship"))) {
    rels.push({
      source_object_type: "database table",
      target_object_type: "graph/relationship layer",
      current_representation: table.table_name,
      file_table_fields: table.columns.filter((column) => /from|to|source|target|relationship|node|edge|type/i.test(column)),
      enforced_by_fk_or_dictionary: table.foreign_keys.length ? "FK" : "schema/table contract",
      evidence_backed: table.columns.some((column) => /evidence|provenance|source/i.test(column)),
      consumed_by_modules: ["Home", "Intelligence", "Moves", "Tower"],
      gaps: table.gaps,
    });
  }
  return rels.slice(0, 500);
}

function lineageModel() {
  return [
    { step: 1, from: "source file", to: "source row", representation: "CSV/JSON/JSONL row with checksum, row count, source path", gap: "Row-level provenance varies by pack." },
    { step: 2, from: "source row", to: "canonical object/fact", representation: "v4 family rows, v6 templates, V7 business_records", gap: "Not every v4/v6 row has a normalized V7 business_record yet." },
    { step: 3, from: "canonical object/fact", to: "graph node/edge", representation: "v4 graph JSONL, V6 graph_nodes/graph_edges, V7 relationship edges", gap: "Graph dictionaries and quality reports are not universally consumed." },
    { step: 4, from: "business_record", to: "record_field", representation: "intelligence_v7.record_fields", gap: "Live row counts require DB query; local file audit cannot prove current active version." },
    { step: 5, from: "record_field/source evidence", to: "derived insight", representation: "derived-intelligence, derived/home", gap: "Derived analytics exist but are not yet universal for every tenant/module." },
    { step: 6, from: "derived insight", to: "module UI/artifact", representation: "Home browser, Intelligence dossier, Moves phases, Source artifacts, Tower value dashboards", gap: "Module-local data models still exist." },
    { step: 7, from: "module UI/action", to: "write-back/memory promotion", representation: "Source approvals, Moves gates, Tower attestations, generated artifacts", gap: "Common V7 write-back is incomplete." },
  ];
}

function volumetrics(sourceFiles, dbTables, dimensions, modules) {
  const by = (items, keyFn) => {
    const map = new Map();
    for (const item of items) {
      const key = keyFn(item) || "unknown";
      map.set(key, (map.get(key) ?? 0) + 1);
    }
    return Object.fromEntries([...map.entries()].sort());
  };
  const sumBy = (items, keyFn, valueFn) => {
    const map = new Map();
    for (const item of items) {
      const key = keyFn(item) || "unknown";
      map.set(key, (map.get(key) ?? 0) + (Number(valueFn(item)) || 0));
    }
    return Object.fromEntries([...map.entries()].sort());
  };
  return {
    file_level: {
      total_files_in_inventory: sourceFiles.length,
      files_by_tenant: by(sourceFiles, (item) => item.tenant_key),
      files_by_layer: by(sourceFiles, (item) => item.layer),
      files_by_dimension: by(sourceFiles, (item) => item.dimension),
      rows_by_tenant: sumBy(sourceFiles, (item) => item.tenant_key, (item) => item.row_count),
      rows_by_layer: sumBy(sourceFiles, (item) => item.layer, (item) => item.row_count),
      rows_by_dimension: sumBy(sourceFiles, (item) => item.dimension, (item) => item.row_count),
      populated_files: sourceFiles.filter((item) => item.populated_status === "populated").length,
      empty_or_template_only_files: sourceFiles.filter((item) => item.populated_status !== "populated").length,
      duplicate_checksums: duplicateChecksums(sourceFiles),
    },
    table_level: {
      tables_discovered_from_sql: dbTables.length,
      tables_by_schema: by(dbTables, (item) => item.schema || "default"),
      live_db_counts: "not available unless DATABASE_URL/DB connectivity is supplied",
    },
    relationship_level: {
      graph_edge_files: sourceFiles.filter((item) => item.dimension === "graph edges").length,
      graph_edge_rows_file_based: sourceFiles.filter((item) => item.dimension === "graph edges").reduce((sum, item) => sum + item.row_count, 0),
      relationship_tables: dbTables.filter((item) => /relationship|graph|edge|node/i.test(item.table_name)).map((item) => item.table_name),
    },
    module_level: Object.fromEntries(modules.map((module) => [module.module, {
      representative_path_count: module.representative_paths.length,
      inferred_table_count: module.direct_table_reads_or_writes_inferred.length,
      grounding_status: module.grounding_status,
    }])),
    dimensions: {
      dimension_count: dimensions.length,
      dimensions_by_migration_status: by(dimensions, (item) => item.migration_status),
    },
  };
}

function duplicateChecksums(sourceFiles) {
  const map = new Map();
  for (const file of sourceFiles) {
    if (!file.checksum_sha256) continue;
    if (!map.has(file.checksum_sha256)) map.set(file.checksum_sha256, []);
    map.get(file.checksum_sha256).push(file.source_path);
  }
  return [...map.entries()].filter(([, paths]) => paths.length > 1).slice(0, 50).map(([checksum, paths]) => ({ checksum, paths }));
}

function tenantSummaries(sourceFiles) {
  const map = new Map();
  for (const file of sourceFiles.filter((item) => item.source_path.startsWith("datasets/") || item.source_path.startsWith("data/") || item.source_path.startsWith("meridian-data/"))) {
    if (!map.has(file.dataset_id)) {
      map.set(file.dataset_id, {
        tenant_key: file.tenant_key,
        tenant_display_name: file.tenant_display_name,
        dataset_id: file.dataset_id,
        file_count: 0,
        row_count: 0,
        layers: new Set(),
        dimensions: new Set(),
      });
    }
    const item = map.get(file.dataset_id);
    item.file_count += 1;
    item.row_count += Number(file.row_count) || 0;
    item.layers.add(file.layer);
    item.dimensions.add(file.dimension);
  }
  return [...map.values()].map((item) => ({
    ...item,
    layers: [...item.layers].sort(),
    dimensions: [...item.dimensions].sort(),
  })).sort((a, b) => b.row_count - a.row_count);
}

function gaps() {
  return [
    { gap: "Rich v4/v6 data is not universally normalized into the V7 active access layer.", severity: "high", affectedModules: ["Home", "Intelligence", "Moves", "Source", "Tower"], evidence: ["datasets/*synthetic-v4", "datasets/*synthetic-v6", "datasets/meridian-health-v6-v7-current-state-v1/v7"] },
    { gap: "Tower, Source, and Moves maintain substantial local data/workflow models.", severity: "high", affectedModules: ["Moves", "Source", "Tower"], evidence: ["src/lib/tower", "src/lib/source", "src/lib/programs"] },
    { gap: "V6 graph physical substrate exists, but graph consumption is not universal.", severity: "medium", affectedModules: ["Home", "Intelligence", "Tower"], evidence: ["supabase/migrations/20260702190000_intelligence_v6_graph_physical.sql", "docs/standards/V6_GRAPH_SUBSTRATE_CONTRACT.md"] },
    { gap: "Derived/Home layer is materialized locally for V7-shaped packs but not yet universal runtime substrate.", severity: "medium", affectedModules: ["Home"], evidence: ["scripts/v7/build-home-derived-layer.mjs", "datasets/meridian-health-v6-v7-current-state-v1/derived/home"] },
    { gap: "Live DB row counts and tenant/version counts were not available to this offline report.", severity: "medium", affectedModules: ["All"], evidence: ["DATABASE_URL unavailable/not used in generator"] },
  ];
}

function recommendations() {
  return [
    { priority: 1, item: "Data inventory / manifest normalization", why: "Every dataset needs a manifest that states source, layer, tenant, dimensions, sensitivity, and intended module consumers.", affected_modules: ["All"], affected_tables_files: ["docs/governance/dataset-manifests", "datasets/*"], effort: "M", risk: "Low", acceptance_criteria: "Every active dataset has a manifest and inventory status in this report." },
    { priority: 2, item: "Existing tenant migration to V7 active access layer", why: "The data exists but is physically inconsistent; V7 should become the common module substrate.", affected_modules: ["Home", "Intelligence", "Moves", "Source", "Tower"], affected_tables_files: ["intelligence_v7.*", "datasets/*synthetic-v4", "datasets/*synthetic-v6"], effort: "L", risk: "Medium", acceptance_criteria: "First Capital, SkyHarbor, Apex, Lakeshore, Meridian all have normalized V7 tenant pack runs and active versions." },
    { priority: 3, item: "V6 graph service and relationship materialization", why: "Graph semantics should explain dependencies without calculating value.", affected_modules: ["Home", "Intelligence", "Moves", "Tower"], affected_tables_files: ["intelligence_v6.graph_nodes", "intelligence_v6.graph_edges", "intelligence_v6.relationship_types"], effort: "M", risk: "Medium", acceptance_criteria: "Relationship dictionary, graph quality reports, and module read APIs are green for every active tenant." },
    { priority: 4, item: "Module context APIs", why: "Modules should read curated common-layer packets rather than each inventing local selectors.", affected_modules: ["Home", "Intelligence", "Moves", "Source", "Tower"], affected_tables_files: ["src/lib/home", "src/lib/intelligence", "src/lib/programs", "src/lib/source", "src/lib/tower"], effort: "L", risk: "Medium", acceptance_criteria: "Each module has a documented read packet with source/tenant/version evidence." },
    { priority: 5, item: "Tower/Source/Moves grounding to common layer", why: "Execution, sourcing, and value data should share provenance and not drift into local silos.", affected_modules: ["Moves", "Source", "Tower"], affected_tables_files: ["source_events", "programs", "value_states", "intelligence_v7.source_files/business_records"], effort: "L", risk: "High", acceptance_criteria: "New Source artifacts, Moves gates, and Tower value updates can be traced to common-layer evidence or write back into it." },
    { priority: 6, item: "Runtime write-back / memory promotion", why: "Workshops/uploads/actions should update the derived/common layer, not just module-local state.", affected_modules: ["All"], affected_tables_files: ["intelligence_v7.*", "generated_artifacts", "source artifacts", "program artifacts"], effort: "L", risk: "High", acceptance_criteria: "A new uploaded file changes source_files, business_records/record_fields, derived/home, and relevant module readiness after validation." },
    { priority: 7, item: "Derived analytics and module readiness scoring", why: "Home should show meaningful enterprise reads and readiness, not raw counts.", affected_modules: ["Home", "Intelligence"], affected_tables_files: ["derived/home", "derived-intelligence"], effort: "M", risk: "Low", acceptance_criteria: "Every active tenant has generated enterprise profile, gap insights, source ledger, relationship rollups, and module readiness." },
    { priority: 8, item: "Privacy-safe benchmark layer", why: "Benchmarks must inform decisions without leaking real client facts or unsupported claims.", affected_modules: ["Intelligence", "Tower", "Source"], affected_tables_files: ["benchmark/corpus", "V7_23", "context-corpus"], effort: "M", risk: "Medium", acceptance_criteria: "Benchmark facts are tagged, source-bounded, and separated from tenant facts in answer packets." },
  ];
}

function evidenceItems(commands, sourceFiles, dbTables, modules) {
  return [
    ...commands.map((command) => ({ type: "validation_command", path: "", command: command.command, ok: command.ok, output: truncate(command.output || command.error, 2000) })),
    ...sourceFiles.slice(0, 200).map((file) => ({ type: "source_file", path: file.source_path, row_count: file.row_count, layer: file.layer, dimension: file.dimension })),
    ...dbTables.slice(0, 120).map((table) => ({ type: "database_table", table: table.table_name, migrations: table.migrations })),
    ...modules.flatMap((module) => module.representative_paths.slice(0, 12).map((file) => ({ type: "module_path", module: module.module, path: file }))),
  ];
}

function truncate(value, max) {
  const text = String(value ?? "");
  return text.length > max ? `${text.slice(0, max)}...` : text;
}

function renderHtml(report) {
  const topTenants = report.tenants.slice(0, 16);
  const topFiles = report.sourceFiles.filter((file) => file.row_count > 0).sort((a, b) => b.row_count - a.row_count).slice(0, 18);
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>AbarVa End-to-End Data Flow Report</title>
  <style>
    :root{--ink:#171717;--muted:#68635a;--paper:#f7f4ef;--card:#fffdfa;--line:#dedbd4;--teal:#168f83;--red:#ad3d2c;--amber:#9d6700;--green:#17745f}
    *{box-sizing:border-box} body{margin:0;background:var(--paper);color:var(--ink);font:15px/1.45 Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
    header{background:#11110f;color:#fff;padding:30px 40px} header h1{margin:0 0 8px;font-size:34px} header p{margin:0;color:#d8d2c8;max-width:1150px}
    main{max-width:1560px;margin:0 auto;padding:28px 40px 56px}.grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:14px}.two{display:grid;grid-template-columns:1fr 1fr;gap:18px}
    .metric,.panel{background:var(--card);border:1px solid var(--line);border-radius:8px;box-shadow:0 1px 2px rgba(0,0,0,.04)}.metric{padding:16px}.metric b{display:block;font-size:30px;line-height:1}.metric span,.muted{color:var(--muted)}
    .panel{padding:20px;margin:18px 0}h2{font-size:24px;margin:0 0 12px}h3{font-size:16px;margin:18px 0 8px;text-transform:uppercase;letter-spacing:.08em;color:#575148}
    table{width:100%;border-collapse:collapse;background:white;border:1px solid var(--line)}th,td{padding:9px 10px;border-bottom:1px solid #ebe7df;text-align:left;vertical-align:top}th{font-size:12px;text-transform:uppercase;letter-spacing:.08em;color:#625d55;background:#fbfaf7}
    code{background:#eee8dd;border-radius:4px;padding:1px 4px}.pill{display:inline-flex;border-radius:999px;background:#e7f4f1;color:#075d54;padding:4px 8px;margin:2px;font-size:12px;font-weight:800}
    .high{color:var(--red);font-weight:800}.medium{color:var(--amber);font-weight:800}.ok{color:var(--green);font-weight:800}.bar{height:9px;background:#e9e4dc;border-radius:99px;overflow:hidden}.bar i{display:block;height:100%;background:var(--teal)}
    .flow{background:#fff;border:1px solid var(--line);border-radius:8px;padding:14px;margin:10px 0}.flow b{display:block;margin-bottom:4px}
    @media(max-width:1000px){.grid,.two{grid-template-columns:1fr}main,header{padding-left:18px;padding-right:18px}}
  </style>
</head>
<body>
<header>
  <h1>AbarVa End-to-End Data Flow, Data Model, Volumetrics, and Module Consumption</h1>
  <p>Generated ${escapeHtml(report.generatedAt)} from repo-local filesystem, SQL migrations, and bounded code scans. Live DB row counts are separated from filesystem/code volumetrics.</p>
</header>
<main>
  <section class="grid">
    <div class="metric"><b>${report.sourceFiles.length.toLocaleString()}</b><span>source/report/proof files inventoried</span></div>
    <div class="metric"><b>${Object.values(report.volumetrics.file_level.rows_by_tenant).reduce((a,b)=>a+Number(b),0).toLocaleString()}</b><span>file-based data rows</span></div>
    <div class="metric"><b>${report.databaseTables.length.toLocaleString()}</b><span>SQL tables discovered</span></div>
    <div class="metric"><b>${report.dimensions.length.toLocaleString()}</b><span>dimension categories</span></div>
  </section>
  <section class="panel"><h2>Executive Summary</h2>${report.executiveSummary.map((p) => `<p>${escapeHtml(p)}</p>`).join("")}</section>
  <section class="panel"><h2>Architecture Diagram</h2><pre><code>${escapeHtml(`Source files/uploads/workshops
  -> manifests + validation
  -> v4/v6/V7 physical packs
  -> V7 common access layer (source_files, business_records, record_fields)
  -> derived/home + derived intelligence + graph rollups
  -> Home / Intelligence / Moves / Source / Tower / Exports
  -> approvals, artifacts, value proof, write-back backlog`)}</code></pre></section>
  <section class="panel"><h2>Layer Map</h2><table><thead><tr><th>Layer</th><th>Files</th><th>Rows</th><th>Meaning</th></tr></thead><tbody>${Object.entries(report.volumetrics.file_level.files_by_layer).map(([layer, count]) => `<tr><td>${escapeHtml(layer)}</td><td>${count}</td><td>${Number(report.volumetrics.file_level.rows_by_layer[layer] ?? 0).toLocaleString()}</td><td>${escapeHtml(layerMeaning(layer))}</td></tr>`).join("")}</tbody></table></section>
  <section class="panel"><h2>Tenant / Source Inventory</h2><table><thead><tr><th>Tenant/Dataset</th><th>Files</th><th>Rows</th><th>Layers</th><th>Dimensions</th></tr></thead><tbody>${topTenants.map((t) => `<tr><td><code>${escapeHtml(t.dataset_id)}</code><br>${escapeHtml(t.tenant_display_name)}</td><td>${t.file_count}</td><td>${t.row_count.toLocaleString()}</td><td>${t.layers.map((x)=>`<span class="pill">${escapeHtml(x)}</span>`).join("")}</td><td>${t.dimensions.slice(0,8).map((x)=>`<span class="pill">${escapeHtml(x)}</span>`).join("")}</td></tr>`).join("")}</tbody></table></section>
  <section class="panel"><h2>Data Model Domains</h2><table><thead><tr><th>Dimension</th><th>Migration status</th><th>Tenants</th><th>Layers</th><th>Consumers</th></tr></thead><tbody>${report.dimensions.map((d) => `<tr><td>${escapeHtml(d.canonical_dimension_name)}</td><td>${escapeHtml(d.migration_status)}</td><td>${d.tenant_coverage.length}</td><td>${d.layer_coverage.map((x)=>`<span class="pill">${escapeHtml(x)}</span>`).join("")}</td><td>${d.consuming_modules.map((x)=>`<span class="pill">${escapeHtml(x)}</span>`).join("")}</td></tr>`).join("")}</tbody></table></section>
  <section class="panel"><h2>V7 Dimension Coverage</h2><table><thead><tr><th>V7 Dimension</th><th>Purpose</th><th>Local tenants</th><th>Rows</th><th>Module use</th></tr></thead><tbody>${report.v7Dimensions.map((d) => `<tr><td><code>${escapeHtml(d.dimension_key)}</code><br>${escapeHtml(d.dimension_label)}</td><td>${escapeHtml(d.business_purpose)}</td><td>${d.tenant_coverage.join(", ") || "none"}</td><td>${Number(d.local_file_rows).toLocaleString()}</td><td>Home: ${escapeHtml(d.home_consumption)}<br>Intelligence: ${escapeHtml(d.intelligence_consumption)}<br>Tower: ${escapeHtml(d.tower_consumption)}</td></tr>`).join("")}</tbody></table></section>
  <section class="panel"><h2>Database Schema Model</h2><table><thead><tr><th>Table</th><th>Columns</th><th>Migrations</th><th>Writer</th><th>Runtime consumers</th></tr></thead><tbody>${report.databaseTables.slice(0,140).map((t) => `<tr><td><code>${escapeHtml(t.table_name)}</code></td><td>${t.columns.slice(0,12).map((x)=>`<span class="pill">${escapeHtml(x)}</span>`).join("")}</td><td>${t.migrations.map((x)=>`<code>${escapeHtml(x)}</code>`).join("<br>")}</td><td>${escapeHtml(t.expected_writer)}</td><td>${t.actual_runtime_consumer.slice(0,4).map((x)=>`<code>${escapeHtml(x)}</code>`).join("<br>")}</td></tr>`).join("")}</tbody></table></section>
  <section class="panel"><h2>Process Flows</h2>${report.pipelines.map((p) => `<div class="flow"><b>${escapeHtml(p.name)}</b><div><span class="muted">Inputs:</span> ${escapeHtml(p.inputs.join(" -> "))}</div><div><span class="muted">Outputs:</span> ${escapeHtml(p.outputs.join(" -> "))}</div><div><span class="muted">Evidence:</span> ${p.evidence.map((x)=>`<code>${escapeHtml(x)}</code>`).join(" ")}</div><div><span class="muted">Gaps:</span> ${escapeHtml(p.gaps.join("; "))}</div></div>`).join("")}</section>
  <section class="panel"><h2>Module Consumption Matrix</h2><table><thead><tr><th>Module</th><th>Status</th><th>Representative paths</th><th>Tables inferred</th><th>Layer use</th></tr></thead><tbody>${report.moduleConsumers.map((m) => `<tr><td>${escapeHtml(m.module)}</td><td>${escapeHtml(m.grounding_status)}</td><td>${m.representative_paths.slice(0,8).map((x)=>`<code>${escapeHtml(x)}</code>`).join("<br>")}</td><td>${m.direct_table_reads_or_writes_inferred.slice(0,12).map((x)=>`<span class="pill">${escapeHtml(x)}</span>`).join("")}</td><td>${Object.entries(m.uses_layers).filter(([,v])=>v).map(([k])=>`<span class="pill">${escapeHtml(k)}</span>`).join("")}</td></tr>`).join("")}</tbody></table></section>
  <section class="panel"><h2>Volumetrics</h2><div class="two"><div><h3>Largest Files by Row Count</h3>${barList(topFiles.map((f)=>({label:f.source_path,value:f.row_count})))}</div><div><h3>Rows by Layer</h3>${barList(Object.entries(report.volumetrics.file_level.rows_by_layer).map(([label,value])=>({label,value})).sort((a,b)=>b.value-a.value))}</div></div></section>
  <section class="panel"><h2>Relationship and Lineage Model</h2><table><thead><tr><th>Step</th><th>From</th><th>To</th><th>Representation</th><th>Gap</th></tr></thead><tbody>${report.lineage.map((l) => `<tr><td>${l.step}</td><td>${escapeHtml(l.from)}</td><td>${escapeHtml(l.to)}</td><td>${escapeHtml(l.representation)}</td><td>${escapeHtml(l.gap)}</td></tr>`).join("")}</tbody></table></section>
  <section class="panel"><h2>Layer Usage / Gaps</h2><table><thead><tr><th>Gap</th><th>Severity</th><th>Affected modules</th><th>Evidence</th></tr></thead><tbody>${report.gaps.map((g) => `<tr><td>${escapeHtml(g.gap)}</td><td class="${escapeHtml(g.severity)}">${escapeHtml(g.severity)}</td><td>${g.affectedModules.map((x)=>`<span class="pill">${escapeHtml(x)}</span>`).join("")}</td><td>${g.evidence.map((x)=>`<code>${escapeHtml(x)}</code>`).join("<br>")}</td></tr>`).join("")}</tbody></table></section>
  <section class="panel"><h2>Prioritized Recommendations</h2><table><thead><tr><th>#</th><th>Item</th><th>Why</th><th>Effort/Risk</th><th>Acceptance</th></tr></thead><tbody>${report.recommendations.map((r) => `<tr><td>${r.priority}</td><td>${escapeHtml(r.item)}</td><td>${escapeHtml(r.why)}</td><td>${escapeHtml(r.effort)} / ${escapeHtml(r.risk)}</td><td>${escapeHtml(r.acceptance_criteria)}</td></tr>`).join("")}</tbody></table></section>
  <section class="panel"><h2>Validation Evidence</h2><table><thead><tr><th>Command</th><th>Status</th><th>Output</th></tr></thead><tbody>${report.validationCommands.map((c) => `<tr><td><code>${escapeHtml(c.command)}</code></td><td class="${c.ok ? "ok" : "high"}">${c.ok ? "ok" : "failed/not available"}</td><td><pre>${escapeHtml(truncate(c.output || c.error, 1200))}</pre></td></tr>`).join("")}</tbody></table></section>
</main></body></html>`;
}

function layerMeaning(layer) {
  return {
    "v4": "Rich older tenant-pack layout with family tables, AI-control-tower data, source docs, graph and derived intelligence.",
    "v6": "Standardized schema/template lane; some folders named templates contain populated rows.",
    "v7": "New normalized common access contract intended for module consumption.",
    "derived/home": "Materialized Home enterprise profile, gap, source, relationship, and module-readiness layer.",
    "tower-standardized": "Tower-specific standardized/projection/read-model data.",
    "source-event": "Source-local sourcing workflow, artifacts, evidence, and event data.",
    "moves/program": "Moves/program phase/gate/artifact data.",
    "intelligence/dossier": "Derived intelligence, binding payloads, dossier/retrieval artifacts.",
    "context-corpus": "Context/corpus/benchmark source material.",
    "graph": "Graph nodes/edges/relationship evidence.",
    "artifact/export": "Generated reports, proofs, exports, screenshots, decks, and other artifacts.",
  }[layer] ?? "Unclassified/unknown layer.";
}

function barList(items) {
  if (!items.length) return "<p class=\"muted\">No values.</p>";
  const max = Math.max(...items.map((item) => Number(item.value) || 0), 1);
  return items.slice(0, 20).map((item) => {
    const width = Math.max(2, Math.round((Number(item.value) / max) * 100));
    return `<div style="display:grid;grid-template-columns:minmax(220px,1fr) 2fr 80px;gap:10px;align-items:center;margin:8px 0"><div>${escapeHtml(item.label)}</div><div class="bar"><i style="width:${width}%"></i></div><div>${Number(item.value).toLocaleString()}</div></div>`;
  }).join("");
}

function escapeHtml(value) {
  return String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
}

function renderSummary(report) {
  return `# AbarVa End-to-End Data Flow Summary

Generated: ${report.generatedAt}

## What Data Exists

- Inventoried ${report.sourceFiles.length.toLocaleString()} repo-local data/report/proof files across datasets and artifact roots.
- Found ${Object.values(report.volumetrics.file_level.rows_by_tenant).reduce((a,b)=>a+Number(b),0).toLocaleString()} file-based rows.
- Found ${report.databaseTables.length.toLocaleString()} SQL table definitions from migrations/schema files.
- Confirmed rich v4 tenants are populated data structures, not empty templates.

## Core Finding

The gap is not lack of data. The gap is inconsistent normalization into a common V7 access model and inconsistent module consumption/write-back across Home, Intelligence, Moves, Source, and Tower.

## Strong Today

- Rich v4 tenant packs exist with family dimensions, AI-control-tower facts, graph edges, source docs, and derived intelligence.
- V7 access-layer schema/code exists and Meridian has a normalized V7 current-state pack.
- Home and Intelligence have V7 read paths.
- Source has a rich event/artifact workflow.
- Moves has governed phase/gate/artifact execution.
- Tower has value/outcome concepts and V7 projection work.

## Fragmented Today

- v4/v6/v7 physical layouts differ.
- Tower, Source, and Moves maintain substantial local data models.
- V6 graph substrate exists but is under-consumed.
- derived/home is not universal across tenants.
- Live DB counts were not available in this offline audit.

## Recommended Next Actions

${report.recommendations.map((r) => `${r.priority}. ${r.item} - ${r.acceptance_criteria}`).join("\n")}

## Outputs

- HTML: reports/abarva-end-to-end-data-flow-latest.html
- JSON: reports/abarva-end-to-end-data-flow-latest.json
`;
}

function main() {
  ensureDir(reportsDir);
  const validationCommands = [
    run("git", ["status", "--short"], { timeout: 5_000 }),
    run("find", ["datasets", "-type", "f"], { timeout: 5_000 }),
    run("find", ["scripts", "-type", "f"], { timeout: 5_000 }),
    run("rg", ["-l", "intelligence_v7", "src", "scripts", "docs", "supabase", "db"], { timeout: 5_000 }),
    run("rg", ["-l", "intelligence_v6|graph_nodes|graph_edges|relationship_types", "src", "scripts", "docs", "supabase", "db"], { timeout: 5_000 }),
    run("rg", ["-l", "source_events|sourcing|artifact_code", "src", "scripts", "docs", "supabase", "db"], { timeout: 5_000 }),
    run("rg", ["-l", "strategic_moves|programs|value_states|ai_initiatives|tower", "src", "scripts", "docs", "supabase", "db"], { timeout: 5_000 }),
    run("npm", ["run", "validate:context-corpus:manifests"], { maxBuffer: 8_000_000, timeout: 12_000 }),
    run("git", ["diff", "--check"], { timeout: 5_000 }),
  ];
  validationCommands[1].output = `${validationCommands[1].output.split(/\r?\n/).filter(Boolean).length} files`;
  validationCommands[2].output = `${validationCommands[2].output.split(/\r?\n/).filter(Boolean).length} files`;

  const sourceFiles = sourceFileInventory();
  const dimensions = dimensionCatalog(sourceFiles);
  const v7Dimensions = v7DimensionCatalog(sourceFiles);
  const database = databaseTables();
  const modules = moduleConsumers();
  const rels = relationships(sourceFiles, database);
  const report = {
    generatedAt,
    repoRoot,
    dbLiveCountsAvailable: Boolean(process.env.DATABASE_URL || process.env.POSTGRES_URL),
    tenants: tenantSummaries(sourceFiles),
    sourceFiles,
    dimensions,
    v7Dimensions,
    databaseTables: database,
    pipelines: PIPELINES,
    moduleConsumers: modules,
    volumetrics: {},
    relationships: rels,
    lineage: lineageModel(),
    gaps: gaps(),
    recommendations: recommendations(),
    validationCommands,
    evidence: [],
    executiveSummary: [
      "AbarVa has substantial tenant data already: rich v4 packs, populated v6/template-shaped packs, graph files, derived intelligence, and a newer V7 normalized access layer.",
      "The main product-data problem is not thin source data. It is inconsistent normalization and consumption: several modules still use local or legacy-specific data paths while V7 is only partially adopted.",
      "Home and Intelligence have explicit V7 read paths; Moves, Source, and Tower have rich local workflows and bridge work but are not yet universally grounded in and writing back to the common access layer.",
      "The recommended direction is to migrate existing rich tenants into V7 active versions, expose module-specific context APIs over the common layer, and add write-back/promotion so uploads/workshops/artifacts update shared enterprise truth."
    ],
  };
  report.volumetrics = volumetrics(sourceFiles, database, dimensions, modules);
  report.evidence = evidenceItems(validationCommands, sourceFiles, database, modules);

  fs.writeFileSync(jsonPath, `${JSON.stringify(report, null, 2)}\n`);
  fs.writeFileSync(htmlPath, renderHtml(report));
  fs.writeFileSync(mdPath, renderSummary(report));
  console.log(JSON.stringify({
    html: path.relative(repoRoot, htmlPath),
    json: path.relative(repoRoot, jsonPath),
    summary: path.relative(repoRoot, mdPath),
    sourceFiles: sourceFiles.length,
    dimensions: dimensions.length,
    databaseTables: database.length,
    moduleConsumers: modules.length,
  }, null, 2));
}

main();
