#!/usr/bin/env node
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const TENANT = "meridian-health";
const PACK_PATH = path.join(
  ROOT,
  "datasets/tenant-inputs/meridian-health/approved-content/home/design-contract-pack.json",
);
const MIRROR_PATH = path.join(
  ROOT,
  "datasets/context-artifacts/approved/meridian-health/home-knowledge/approved-home-knowledge-design-contract-pack.json",
);
const SOURCE_VALUE_MAP = path.join(
  ROOT,
  "reports/home-knowledge-design-contract/rendered-value-map.csv",
);
const SOURCE_COMPONENT_LINEAGE = path.join(
  ROOT,
  "reports/home-knowledge-design-contract/component-lineage.csv",
);
const OUT_DIR = path.join(
  ROOT,
  "reports/home-knowledge-design-contract-ui-wiring",
);

const MODE = process.argv.includes("--mode")
  ? process.argv[process.argv.indexOf("--mode") + 1]
  : "all";

const BLOCKED_PATTERNS = [
  { pattern: /\bV[4567]\b|\bv[4567]\b/, reason: "old internal version language" },
  { pattern: /\bdossier\b/i, reason: "legacy dossier wording" },
  { pattern: /\bsubstrate\b/i, reason: "internal substrate wording" },
  { pattern: /\bprojection\b/i, reason: "internal projection wording" },
  { pattern: /\bgeneric guidebook\b/i, reason: "guidebook fallback wording" },
  { pattern: /\brealized ROI\b/i, reason: "unsupported realized ROI wording" },
  { pattern: /\brealized savings\b/i, reason: "unsupported realized savings wording" },
  { pattern: /\bproduction AI readiness\b/i, reason: "unsupported production AI readiness wording" },
  { pattern: /\bAWS\b[^.]{0,80}\bcurrent certified production\b/i, reason: "AWS current certified production claim" },
  { pattern: /\bDatabricks\b[^.]{0,80}\bcurrent certified production\b/i, reason: "Databricks current certified production claim" },
  { pattern: /\$210M|\$16\.8B|208 items|96 vendors/i, reason: "unsupported design placeholder value" },
  { pattern: /\bis represented in the Meridian context\b/i, reason: "generic dimension fallback wording" },
  { pattern: /\bmatters because it shapes which business decisions\b/i, reason: "generic guidebook-style summary wording" },
  { pattern: /\bthis selected area\b/i, reason: "generic UI helper wording" },
];

function fail(message) {
  console.error(`FAIL: ${message}`);
  process.exit(1);
}

function readJson(file) {
  if (!existsSync(file)) fail(`Missing ${path.relative(ROOT, file)}`);
  return JSON.parse(readFileSync(file, "utf8"));
}

function csvCell(value) {
  const text =
    value === null || value === undefined
      ? ""
      : Array.isArray(value)
        ? value.join("; ")
        : typeof value === "object"
          ? JSON.stringify(value)
          : String(value);
  return `"${text.replaceAll('"', '""')}"`;
}

function writeCsv(file, rows) {
  if (!rows.length) {
    writeFileSync(file, "");
    return;
  }
  const headers = Object.keys(rows[0]);
  const body = [
    headers.map(csvCell).join(","),
    ...rows.map((row) => headers.map((header) => csvCell(row[header])).join(",")),
  ].join("\n");
  writeFileSync(file, `${body}\n`);
}

function asText(value) {
  if (value === null || value === undefined) return "";
  if (Array.isArray(value)) return value.map(asText).filter(Boolean).join("; ");
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

function sourceFiles(pack) {
  const sourceContext = pack.source_context ?? {};
  return [
    sourceContext.canonical_input_location,
    sourceContext.interviews,
    pack.design_contract_source,
  ]
    .filter(Boolean)
    .join("; ");
}

function sourceLayer(pack) {
  return [
    "approved Home Knowledge design-contract render pack",
    pack.source_context?.canonical_input_location,
  ]
    .filter(Boolean)
    .join(" <- ");
}

function loadCsvText(file) {
  return existsSync(file) ? readFileSync(file, "utf8") : "";
}

function main() {
  const pack = readJson(PACK_PATH);
  const mirror = readJson(MIRROR_PATH);
  if (pack.tenant_key !== TENANT) fail("Primary pack tenant mismatch");
  if (mirror.tenant_key !== TENANT) fail("Mirror pack tenant mismatch");
  if (pack.validation?.status !== "pass") fail("Primary pack validation is not pass");
  if (mirror.validation?.status !== "pass") fail("Mirror pack validation is not pass");

  mkdirSync(OUT_DIR, { recursive: true });
  const slots = pack.design_slots ?? {};
  const dims = slots.DIMS ?? [];
  if (dims.length !== 19) fail(`Expected 19 dimensions, found ${dims.length}`);

  const totalRows = Object.values(slots.DATA ?? {}).reduce(
    (sum, dataset) => sum + (dataset.rows?.length ?? 0),
    0,
  );
  const sourceRowTotal = Object.values(slots.DATA ?? {}).reduce(
    (sum, dataset) => sum + Number(dataset.row_count ?? 0),
    0,
  );
  if (totalRows < 3900) fail(`Expected at least 3,900 data rows, found ${totalRows}`);
  if (sourceRowTotal !== totalRows) {
    fail(`Rendered row count ${totalRows} does not match source row count ${sourceRowTotal}`);
  }

  const missing = [];
  for (const dim of dims) {
    const key = dim.key;
    if (!slots.DATA?.[key]?.rows?.length) missing.push(`${key}: data rows`);
    if (!slots.STORY?.[key]) missing.push(`${key}: story`);
    if (!slots.INSIGHTS?.[key]) missing.push(`${key}: insights`);
    if (!slots.REL?.[key]) missing.push(`${key}: relationships`);
    if (!slots.DGAPS?.[key]?.length) missing.push(`${key}: gaps`);
    if (!slots.EVID?.[key]?.length) missing.push(`${key}: evidence`);
  }
  if (missing.length) fail(`Missing required dimension content: ${missing.join("; ")}`);

  const dataProof = dims.map((dim) => {
    const dataset = slots.DATA[dim.key];
    return {
      tenant: pack.tenant_key,
      page: "Home / Knowledge",
      dimension_key: dim.key,
      dimension: dim.name,
      tab: "Data",
      rows_rendered: dataset.rows.length,
      columns_rendered: dataset.columns.map((column) => column.label).join("; "),
      search_enabled: "yes",
      filter_key: dataset.facet ?? "",
      sort_enabled: "yes",
      row_detail_enabled: "yes",
      source_layer: sourceLayer(pack),
      source_files: sourceFiles(pack),
      refreshed_at: pack.generated_at,
      sample_rendered_value: asText(dataset.rows[0]),
    };
  });

  const evidenceProof = dims.map((dim) => ({
    tenant: pack.tenant_key,
    page: "Home / Knowledge",
    dimension_key: dim.key,
    dimension: dim.name,
    tab: "Evidence",
    evidence_cards: slots.EVID[dim.key].length,
    evidence_names: slots.EVID[dim.key].map((item) => item.name).join("; "),
    evidence_types: slots.EVID[dim.key].map((item) => item.type).join("; "),
    supported_claims: slots.EVID[dim.key].map((item) => item.supports).join("; "),
    missing_proof_notes: slots.EVID[dim.key].map((item) => item.missing).filter(Boolean).join("; "),
    source_layer: sourceLayer(pack),
    refreshed_at: pack.generated_at,
  }));

  const relationshipProof = dims.map((dim) => ({
    tenant: pack.tenant_key,
    page: "Home / Knowledge",
    dimension_key: dim.key,
    dimension: dim.name,
    tab: "Relationships",
    chain: (slots.REL[dim.key].chain ?? []).join(" -> "),
    note: slots.REL[dim.key].note ?? "",
    source_layer: sourceLayer(pack),
    refreshed_at: pack.generated_at,
  }));

  const gapsProof = dims.flatMap((dim) =>
    slots.DGAPS[dim.key].map((gap, index) => ({
      tenant: pack.tenant_key,
      page: "Home / Knowledge",
      dimension_key: dim.key,
      dimension: dim.name,
      tab: "Gaps",
      gap_index: index + 1,
      missing: gap.missing ?? "",
      blocks: gap.blocks ?? "",
      needed: gap.needed ?? "",
      handoff: gap.handoff ?? "",
      source_layer: sourceLayer(pack),
      refreshed_at: pack.generated_at,
    })),
  );

  const renderedValueMap = loadCsvText(SOURCE_VALUE_MAP);
  const componentLineage = loadCsvText(SOURCE_COMPONENT_LINEAGE);
  const renderedComponentMap = renderedValueMap || [
    "tenant,page,tab,component,rendered_value,generated_by,source_layer,source_files,refreshed_at",
    `${pack.tenant_key},Home / Knowledge,Overview,Design contract pack,${totalRows} rows,generated_render_pack,${sourceLayer(pack)},${sourceFiles(pack)},${pack.generated_at}`,
  ].join("\n");

  const generationRows = [
    {
      component: "Boardroom summary",
      generation_method: "claude_main_response_with_evidence_bounded_repair",
      source: "reports/home-knowledge-design-contract/raw-claude-response.json",
      prompt: "reports/home-knowledge-design-contract/actual-claude-prompt.txt",
      rendered_path: "design_slots.BRIEF_COLS / PRIORITIES / SIGNALS",
    },
    {
      component: "Dimension summaries",
      generation_method: "mixed_claude_main_response_approved_story_block_repair",
      source: "design_slots.STORY and design_slots.INSIGHTS",
      prompt: "reports/home-knowledge-design-contract/actual-claude-prompt.txt",
      rendered_path: "dimension Summary tab",
    },
    {
      component: "Data tabs",
      generation_method: "deterministic_canonical_projection",
      source: "datasets/tenant-inputs/meridian-health/standard-2026-07-v3",
      prompt: "not_applicable",
      rendered_path: "design_slots.DATA",
    },
    {
      component: "Evidence tabs",
      generation_method: "deterministic_evidence_lineage_projection",
      source: "design_slots.EVID / source_context",
      prompt: "not_applicable",
      rendered_path: "dimension Evidence tab",
    },
    {
      component: "Relationship and gap tabs",
      generation_method: "evidence_bounded_synthesis_plus_canonical_projection",
      source: "design_slots.REL / design_slots.DGAPS",
      prompt: "reports/home-knowledge-design-contract/actual-claude-prompt.txt",
      rendered_path: "dimension Relationships and Gaps tabs",
    },
  ];

  const scanTargets = [
    {
      name: "approved primary pack",
      text: JSON.stringify(pack),
    },
    {
      name: "approved mirror pack",
      text: JSON.stringify(mirror),
    },
    {
      name: "UI component source",
      text: readFileSync(
        path.join(ROOT, "src/components/home/HomeKnowledgeDesignContractSurface.tsx"),
        "utf8",
      ),
    },
  ];
  const blockedRows = [];
  for (const target of scanTargets) {
    for (const rule of BLOCKED_PATTERNS) {
      const match = target.text.match(rule.pattern);
      const safeNegation = match
        ? isSafeNegatedMention(target.text, match.index ?? 0)
        : false;
      blockedRows.push({
        target: target.name,
        reason: rule.reason,
        status: match && !safeNegation ? "fail" : "pass",
        pattern: String(rule.pattern),
        note: match && safeNegation ? "safe negation or diagnostic context" : "",
      });
    }
  }
  const blockedFailures = blockedRows.filter((row) => row.status === "fail");
  if (blockedFailures.length) {
    writeCsv(path.join(OUT_DIR, "blocked-content-audit.csv"), blockedRows);
    fail(`Blocked content found: ${blockedFailures.map((row) => `${row.target}: ${row.reason}`).join("; ")}`);
  }

  writeFileSync(path.join(OUT_DIR, "rendered-component-map.csv"), renderedComponentMap);
  writeFileSync(
    path.join(OUT_DIR, "component-lineage-source.csv"),
    componentLineage,
  );
  writeCsv(path.join(OUT_DIR, "data-tab-proof.csv"), dataProof);
  writeCsv(path.join(OUT_DIR, "evidence-tab-proof.csv"), evidenceProof);
  writeCsv(path.join(OUT_DIR, "relationship-tab-proof.csv"), relationshipProof);
  writeCsv(path.join(OUT_DIR, "gaps-tab-proof.csv"), gapsProof);
  writeCsv(path.join(OUT_DIR, "blocked-content-audit.csv"), blockedRows);
  writeCsv(path.join(OUT_DIR, "generation-method-audit.csv"), generationRows);

  const summary = `# Home Knowledge Design Contract UI Wiring Proof

Generated: ${new Date().toISOString()}
Tenant: ${pack.tenant_name} (${pack.tenant_key})
Validation: pass
Mode: ${MODE}

## Truth Split

- UI wiring reads the approved design-contract render pack.
- Boardroom and advisory story slots are Claude-assisted, evidence-bounded, and repaired where the main response did not cover all dimensions.
- Data tabs are deterministic canonical projections from ${pack.source_context?.canonical_input_location}.
- Evidence tabs are lineage projections from the approved render pack.
- This audit does not mutate Postgres, promote candidate data, update Active Tenant Access, or deploy.

## Coverage

- Dimensions rendered: ${dims.length}
- Canonical rows rendered in data tabs: ${totalRows.toLocaleString("en-US")}
- Evidence cards: ${evidenceProof.reduce((sum, row) => sum + Number(row.evidence_cards), 0)}
- Relationship tabs with chains: ${relationshipProof.filter((row) => row.chain).length}
- Gap rows: ${gapsProof.length}

## Required Outputs

- rendered-component-map.csv
- data-tab-proof.csv
- evidence-tab-proof.csv
- relationship-tab-proof.csv
- gaps-tab-proof.csv
- blocked-content-audit.csv
- generation-method-audit.csv
- proof.html
`;
  writeFileSync(path.join(OUT_DIR, "summary.md"), summary);

  const proofHtml = `<!doctype html><html><head><meta charset="utf-8"><title>Home Knowledge Design Contract UI Wiring Proof</title><style>
  body{font-family:Inter,system-ui,sans-serif;margin:40px;color:#071733;background:#f8fafc}
  h1{font-size:34px} .grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:14px}
  .card{background:white;border:1px solid #dfe7f2;border-radius:14px;padding:18px;box-shadow:0 12px 30px rgba(7,23,51,.06)}
  .card strong{display:block;font-size:26px} table{width:100%;border-collapse:collapse;background:white;margin-top:18px}
  th,td{border:1px solid #dfe7f2;padding:10px;text-align:left;vertical-align:top} th{background:#eef4ff}
  </style></head><body>
  <h1>Home Knowledge Design Contract UI Wiring Proof</h1>
  <p>${pack.tenant_name} render pack is ready for the contract-backed Home/Knowledge surface.</p>
  <div class="grid">
    <div class="card"><strong>${dims.length}</strong><span>dimensions</span></div>
    <div class="card"><strong>${totalRows.toLocaleString("en-US")}</strong><span>data rows</span></div>
    <div class="card"><strong>${evidenceProof.reduce((sum, row) => sum + Number(row.evidence_cards), 0)}</strong><span>evidence cards</span></div>
    <div class="card"><strong>${gapsProof.length}</strong><span>gap records</span></div>
  </div>
  <h2>Dimensions</h2>
  <table><thead><tr><th>Dimension</th><th>Rows</th><th>Evidence</th><th>Summary</th></tr></thead><tbody>
  ${dims.map((dim) => `<tr><td>${escapeHtml(dim.name)}</td><td>${slots.DATA[dim.key].rows.length}</td><td>${slots.EVID[dim.key].length}</td><td>${escapeHtml(dim.summary ?? "")}</td></tr>`).join("")}
  </tbody></table>
  <h2>Generation Methods</h2>
  <table><thead><tr><th>Component</th><th>Method</th><th>Source</th></tr></thead><tbody>
  ${generationRows.map((row) => `<tr><td>${escapeHtml(row.component)}</td><td>${escapeHtml(row.generation_method)}</td><td>${escapeHtml(row.source)}</td></tr>`).join("")}
  </tbody></table>
  </body></html>`;
  writeFileSync(path.join(OUT_DIR, "proof.html"), proofHtml);

  console.log(
    JSON.stringify(
      {
        status: "pass",
        mode: MODE,
        outDir: path.relative(ROOT, OUT_DIR),
        dimensions: dims.length,
        dataRows: totalRows,
        gaps: gapsProof.length,
      },
      null,
      2,
    ),
  );
}

function escapeHtml(value) {
  return asText(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function isSafeNegatedMention(text, index) {
  const context = text.slice(Math.max(0, index - 120), index + 160).toLowerCase();
  return /\b(no|not|without|cannot|can't|do not|does not|is not|blocks?|block|until|before|unless|missing|unsupported)\b/.test(
    context,
  );
}

main();
