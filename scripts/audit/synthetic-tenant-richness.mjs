#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const repoRoot = process.cwd();
const tenants = ["first-capital-financial", "skyharbor-air"];
const forbiddenUserFacing = /\b(V6|V7|dossier|projection|substrate|realized savings|realized ROI|production-ready)\b/i;
const thresholds = {
  source_template_files: 19,
  source_template_rows: 4000,
  canonical_facts: 4000,
  entity_profiles: 1000,
  graph_nodes: 1500,
  graph_edges: 2500,
  interview_rows: 200,
  context_gaps: 2000,
  evidence_references: 100,
  approved_programs: 12,
  candidate_ai_opportunities: 12,
  budget_rows_min: 60,
  budget_rows_max: 80,
};

function arg(name, fallback = "") {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : fallback;
}

function selectedTenants() {
  const tenant = arg("--tenant");
  if (!tenant || tenant === "all") return tenants;
  if (!tenants.includes(tenant)) throw new Error(`Unknown tenant ${tenant}`);
  return [tenant];
}

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(repoRoot, relativePath), "utf8"));
}

function readCsv(filePath) {
  const text = fs.readFileSync(filePath, "utf8").trim();
  if (!text) return [];
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
      row = [];
      value = "";
    } else if (char !== "\r") {
      value += char;
    }
  }
  if (row.length || value) {
    row.push(value);
    rows.push(row);
  }
  const [headers, ...dataRows] = rows;
  return dataRows.map((cells, index) => ({
    __row: index + 2,
    ...Object.fromEntries(headers.map((header, column) => [header, cells[column] ?? ""])),
  }));
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function csvEscape(value) {
  const text = String(value ?? "");
  if (/[",\n\r]/.test(text)) return `"${text.replaceAll('"', '""')}"`;
  return text;
}

function writeCsv(filePath, headers, rows) {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, `${[headers.join(","), ...rows.map((row) => headers.map((header) => csvEscape(row[header])).join(","))].join("\n")}\n`);
}

function writeMd(filePath, lines) {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, `${lines.join("\n")}\n`);
}

function scanUserFacing(tenant) {
  const files = [
    `datasets/tenant-inputs/generated/${tenant}/rich-synthetic-2026-07-v3/render-pack.json`,
    `datasets/tenant-inputs/generated/${tenant}/rich-synthetic-2026-07-v3/approved-candidate-story-blocks.json`,
    `datasets/tenant-inputs/generated/${tenant}/rich-synthetic-2026-07-v3/approved-candidate-visual-specs.json`,
    `reports/${tenant}-synthetic-context-generation/summary.md`,
    `reports/${tenant}-synthetic-context-generation/proof.html`,
  ];
  const failures = [];
  for (const file of files) {
    const absolute = path.join(repoRoot, file);
    if (!fs.existsSync(absolute)) {
      failures.push({ file, issue: "missing_user_facing_artifact" });
      continue;
    }
    const text = fs.readFileSync(absolute, "utf8");
    const matches = text.match(forbiddenUserFacing);
    if (matches) failures.push({ file, issue: `forbidden user-facing term: ${matches[0]}` });
  }
  return failures;
}

function auditTenant(tenant) {
  const manifestPath = `datasets/tenant-inputs/generated/${tenant}/rich-synthetic-2026-07-v3/tenant-generation-manifest.json`;
  const manifest = readJson(manifestPath);
  const failures = [];
  for (const [metric, minimum] of Object.entries(thresholds)) {
    if (metric === "budget_rows_min" || metric === "budget_rows_max") continue;
    if ((manifest.counts[metric] ?? 0) < minimum) failures.push(`${metric} expected >= ${minimum}, observed ${manifest.counts[metric] ?? 0}`);
  }
  if (manifest.counts.budget_rows < thresholds.budget_rows_min || manifest.counts.budget_rows > thresholds.budget_rows_max) {
    failures.push(`budget_rows expected ${thresholds.budget_rows_min}-${thresholds.budget_rows_max}, observed ${manifest.counts.budget_rows}`);
  }
  if (manifest.boundaries.azure_postgres_mutated !== false) failures.push("manifest claims Azure/Postgres mutation");
  if (manifest.boundaries.active_pointer_updated !== false) failures.push("manifest claims active pointer update");
  if (manifest.boundaries.default_runtime_visible !== false) failures.push("manifest claims default runtime visibility");
  const evidenceRegistry = readJson(`datasets/tenant-inputs/generated/${tenant}/rich-synthetic-2026-07-v3/evidence-registry.json`);
  const evidenceIds = new Set(evidenceRegistry.map((row) => row.evidence_id));
  const factSample = readJson(`datasets/tenant-inputs/generated/${tenant}/rich-synthetic-2026-07-v3/canonical-facts.json`).slice(0, 500);
  for (const fact of factSample) {
    if (!fact.evidence_id) failures.push(`fact ${fact.fact_key} missing evidence_id`);
  }
  const budgetRows = readCsv(path.join(repoRoot, `datasets/tenant-inputs/candidates/${tenant}/rich-synthetic-2026-07-v3/08_spend_value.csv`));
  if (budgetRows.some((row) => Number(row.savings_opportunity_usd) !== 0)) failures.push("budget rows include non-zero savings opportunity");
  const aiRows = readCsv(path.join(repoRoot, `datasets/tenant-inputs/candidates/${tenant}/rich-synthetic-2026-07-v3/10_ai_automation_use_cases.csv`));
  if (aiRows.some((row) => row.current_status !== "candidate_not_approved")) failures.push("AI opportunity row is not candidate_not_approved");
  const storyBlocks = readJson(`datasets/tenant-inputs/generated/${tenant}/rich-synthetic-2026-07-v3/approved-candidate-story-blocks.json`);
  if (storyBlocks.length < 19) failures.push("story blocks missing 19 dimensions");
  if (storyBlocks.some((block) => block.approved_for_default_runtime !== false)) failures.push("story block visible by default");
  const labelText = JSON.stringify(storyBlocks);
  if (tenant === "first-capital-financial" && !labelText.includes("FS Demo")) failures.push("FS Demo label missing from story blocks");
  if (tenant === "skyharbor-air" && !labelText.includes("Airline Demo")) failures.push("Airline Demo label missing from story blocks");
  failures.push(...scanUserFacing(tenant).map((failure) => `${failure.file}: ${failure.issue}`));
  return {
    tenant_key: tenant,
    status: failures.length === 0 ? "pass" : "fail",
    failures,
    counts: manifest.counts,
    unresolved_evidence_refs: [...evidenceIds].length < manifest.counts.evidence_references ? 1 : 0,
  };
}

function run() {
  const results = selectedTenants().map(auditTenant);
  const outDir = path.join(repoRoot, "reports/multi-tenant-synthetic-context-generation");
  ensureDir(outDir);
  writeCsv(path.join(outDir, "richness-audit.csv"), ["tenant_key", "status", "source_template_rows", "interview_rows", "canonical_facts", "entity_profiles", "graph_nodes", "graph_edges", "context_gaps", "evidence_references", "failure_count"], results.map((result) => ({
    tenant_key: result.tenant_key,
    status: result.status,
    source_template_rows: result.counts.source_template_rows,
    interview_rows: result.counts.interview_rows,
    canonical_facts: result.counts.canonical_facts,
    entity_profiles: result.counts.entity_profiles,
    graph_nodes: result.counts.graph_nodes,
    graph_edges: result.counts.graph_edges,
    context_gaps: result.counts.context_gaps,
    evidence_references: result.counts.evidence_references,
    failure_count: result.failures.length,
  })));
  const auditMdLines = [
    "# Synthetic Tenant Richness Audit",
    "",
    ...results.map((result) => `- ${result.tenant_key}: ${result.status.toUpperCase()} (${result.failures.length} failures)`),
  ];
  const failureSections = results.flatMap((result) => result.failures.length ? [`## ${result.tenant_key}`, "", ...result.failures.map((failure) => `- ${failure}`)] : []);
  if (failureSections.length > 0) auditMdLines.push("", ...failureSections);
  writeMd(path.join(outDir, "richness-audit.md"), auditMdLines);
  const failures = results.flatMap((result) => result.failures);
  if (failures.length > 0) {
    console.error(`Synthetic richness audit failed with ${failures.length} failure(s)`);
    for (const failure of failures) console.error(`- ${failure}`);
    process.exit(1);
  }
  console.log(JSON.stringify({ status: "pass", tenants: results.map((result) => result.tenant_key) }, null, 2));
}

run();
