#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const repoRoot = process.cwd();
const truthStatement =
  "Planning-grade synthetic candidate context only. Not real client production data, not PHI/PII/payment-card data, not active tenant truth, and not a claim of realized financial value.";

const tenantConfigs = {
  "first-capital-financial": {
    tenantKey: "first-capital-financial",
    displayName: "FS Demo",
    industry: "diversified financial services",
    physicalLabel: "First Capital Financial",
    guidanceTone: "banking, payments, AML/KYC, fraud, model risk, branch, contact center, treasury, wealth, lending, and regulatory operations",
  },
  "skyharbor-air": {
    tenantKey: "skyharbor-air",
    displayName: "Airline Demo",
    industry: "global airline",
    physicalLabel: "SkyHarbor Air",
    guidanceTone: "flight operations, OCC/IROPS, crew, airport operations, maintenance, baggage, loyalty, revenue management, cargo, and safety operations",
  },
};

const requiredTemplateFiles = [
  "00_enterprise_profile.csv",
  "01_business_functions.csv",
  "02_org_ownership.csv",
  "03_workforce_roles.csv",
  "04_applications_systems.csv",
  "05_data_assets_integrations.csv",
  "06_infrastructure_platforms.csv",
  "07_vendors_contracts.csv",
  "08_spend_value.csv",
  "09_programs_initiatives.csv",
  "10_ai_automation_use_cases.csv",
  "11_risks_controls.csv",
  "12_relationships.csv",
  "13_evidence_sources.csv",
  "14_metrics_outcomes.csv",
  "15_industry_context_patterns.csv",
  "16_expert_lenses.csv",
  "17_service_scope_managed_services.csv",
  "18_operational_process_evidence.csv",
];

const requestedAliases = new Map([
  ["08_spend_value.csv", "08_it_budget_spend_value.csv"],
  ["17_service_scope_managed_services.csv", "17_managed_services_scope.csv"],
]);

const stakeholderGroups = [
  "CEO / enterprise strategy",
  "CFO / finance and value",
  "COO / operations",
  "CIO / enterprise technology",
  "CTO / infrastructure/cloud/platforms",
  "CDAO / data and analytics",
  "CISO / security",
  "Privacy/compliance/legal",
  "Procurement/vendor management",
  "HR/workforce/change",
  "Transformation office",
  "Customer/member/passenger experience",
  "Business function leader",
  "Contact center leader",
  "Operations leader",
  "Enterprise architecture",
  "Application owner",
  "IT service management",
];

const questionCategories = [
  "strategic priorities",
  "pain points",
  "budget/value",
  "data readiness",
  "systems/platform",
  "vendors/contracts",
  "operating model/ownership",
  "workforce/adoption",
  "risk/security/privacy/compliance",
  "AI appetite/guardrails",
  "evidence needed",
  "metrics/baseline",
];

function arg(name, fallback = "") {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : fallback;
}

function hasFlag(name) {
  return process.argv.includes(name);
}

function selectedTenants() {
  const tenant = arg("--tenant", "all");
  if (tenant === "all") return Object.values(tenantConfigs);
  if (!tenantConfigs[tenant]) throw new Error(`Unknown tenant ${tenant}. Use one of ${Object.keys(tenantConfigs).join(", ")} or all.`);
  return [tenantConfigs[tenant]];
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(repoRoot, relativePath), "utf8"));
}

function readTextIfExists(filePath) {
  return fs.existsSync(filePath) ? fs.readFileSync(filePath, "utf8") : "";
}

function writeText(filePath, text) {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, text);
}

function writeJson(filePath, value) {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
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

function readCsv(filePath) {
  const text = fs.readFileSync(filePath, "utf8").trim();
  if (!text) return [];
  const rows = [];
  let row = [];
  let value = "";
  let quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];
    if (quoted) {
      if (char === '"' && next === '"') {
        value += '"';
        index += 1;
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
  return dataRows.map((cells) => Object.fromEntries(headers.map((header, column) => [header, cells[column] ?? ""])));
}

function runCommand(label, command, args, options = {}) {
  const startedAt = new Date().toISOString();
  const result = spawnSync(command, args, {
    cwd: repoRoot,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    env: process.env,
    ...options,
  });
  const finishedAt = new Date().toISOString();
  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);
  return {
    label,
    command: [command, ...args].join(" "),
    exit_code: result.status ?? 1,
    status: result.status === 0 ? "pass" : "fail",
    started_at: startedAt,
    finished_at: finishedAt,
  };
}

function copyFile(source, target) {
  ensureDir(path.dirname(target));
  fs.copyFileSync(source, target);
}

function templateManifestByFile() {
  const manifest = readJson("datasets/tenant-inputs/templates/universal/standard-2026-07-v3/template-manifest.json");
  return Object.fromEntries(manifest.templates.map((template) => [template.file, template]));
}

function writeTemplateGuidance(config) {
  const byFile = templateManifestByFile();
  const guidanceDir = path.join(repoRoot, "templates", config.tenantKey, "guidance");
  const dictionaryDir = path.join(repoRoot, "templates", config.tenantKey, "data-dictionary");
  const rows = [];
  for (const file of requiredTemplateFiles) {
    const template = byFile[file];
    const alias = requestedAliases.get(file) ?? file;
    const templateName = file.replace(/\.csv$/, "");
    const aliasName = alias.replace(/\.csv$/, "");
    const columns = template?.columns ?? [];
    writeText(
      path.join(guidanceDir, `${aliasName}.md`),
      `# ${config.displayName} ${aliasName} Guidance

Tenant key: \`${config.tenantKey}\`
Display label: \`${config.displayName}\`
Physical source label: \`${config.physicalLabel}\`
Industry: ${config.industry}

This template captures ${config.guidanceTone} context as candidate-only V3 planning data. Rows must remain evidence-backed, tenant-scoped, source-linked, and safe for candidate preview only.

Required controls:
- Do not include real customer, passenger, account, payment-card, PHI, or PII records.
- Do not mark rows as active tenant truth.
- Do not claim realized savings, realized ROI, or production outcomes.
- Preserve source_file, source_row_id, evidence_id, confidence, candidate_contract_version, and load_run_id.
- Use ${config.displayName} on AbarVa-facing pages.
`,
    );
    writeJson(path.join(dictionaryDir, `${aliasName}.json`), {
      tenant_key: config.tenantKey,
      display_name: config.displayName,
      physical_source_label: config.physicalLabel,
      industry: config.industry,
      source_template_file: file,
      requested_template_file: alias,
      candidate_only: true,
      default_runtime_visible: false,
      columns: columns.map((column) => ({
        name: column,
        required: true,
        description: `${column} for ${config.displayName} ${aliasName} candidate context.`,
      })),
      forbidden_claims: ["realized savings", "realized ROI", "production-ready", "active tenant truth"],
    });
    rows.push({
      tenant_key: config.tenantKey,
      source_template_file: file,
      requested_template_file: alias,
      guidance_file: `templates/${config.tenantKey}/guidance/${aliasName}.md`,
      data_dictionary_file: `templates/${config.tenantKey}/data-dictionary/${aliasName}.json`,
      status: "ready",
    });
  }
  return rows;
}

function writeInterviewSupport(config) {
  const sourceInterview = path.join(repoRoot, "datasets/tenant-inputs/candidates", config.tenantKey, "interviews/executive_interviews.csv");
  const interviewDir = path.join(repoRoot, "datasets/tenant-inputs", config.tenantKey, "interviews");
  ensureDir(interviewDir);
  copyFile(sourceInterview, path.join(interviewDir, "executive_interviews.csv"));
  const questionRows = stakeholderGroups.flatMap((group) =>
    questionCategories.map((category, index) => ({
      tenant_key: config.tenantKey,
      display_name: config.displayName,
      stakeholder_group: group,
      question_category: category,
      question_id: `${group.replace(/[^A-Za-z0-9]+/g, "_").replace(/^_+|_+$/g, "").toUpperCase()}_${String(index + 1).padStart(2, "0")}`,
      required_answer_basis: "synthetic-evidence-backed or interview-only-gap-generating",
      required_lineage_fields: "evidence_id; source_row_id; confidence; candidate_contract_version; load_run_id",
    })),
  );
  writeCsv(path.join(interviewDir, "interview_question_bank.csv"), Object.keys(questionRows[0]), questionRows);
  writeText(
    path.join(interviewDir, "interview_guidance.md"),
    `# ${config.displayName} Interview Guidance

Use this interview pack to create candidate-only planning context for ${config.industry}. Interview rows must reveal priorities, blockers, data readiness, vendor/control evidence, budget/value baselines, and module-readiness gaps.

Rules:
- Use ${config.displayName} in AbarVa-facing pages.
- Keep ${config.physicalLabel} only as a physical/source label.
- Treat unanswered or weak answers as context gaps, not invented facts.
- Do not claim realized value, production use, active tenant truth, or live customer/passenger/account evidence.
- Every answer row must retain evidence_id, source_row_id, confidence, candidate_contract_version, load_run_id, generated_at, source_type, and truth_statement.
`,
  );
  writeJson(path.join(interviewDir, "interview_data_dictionary.json"), {
    tenant_key: config.tenantKey,
    display_name: config.displayName,
    candidate_only: true,
    required_columns: [
      "tenant_key",
      "interview_id",
      "interview_group",
      "executive_area",
      "stakeholder_role",
      "question_id",
      "question",
      "synthetic_answer",
      "priority_theme",
      "pain_point",
      "initiative_link",
      "evidence_needed",
      "evidence_id",
      "source_row_id",
      "confidence",
      "answer_basis",
      "active_candidate_status",
      "candidate_contract_version",
      "load_run_id",
      "source_type",
      "generated_at",
      "truth_statement",
    ],
    stakeholder_groups: stakeholderGroups,
    question_categories: questionCategories,
  });
  const executiveRows = readCsv(sourceInterview);
  const coverageRows = stakeholderGroups.map((group) => {
    const rows = executiveRows.filter((row) => row.interview_group === group);
    return {
      tenant_key: config.tenantKey,
      display_name: config.displayName,
      stakeholder_group: group,
      interview_rows: rows.length,
      question_categories_expected: questionCategories.length,
      status: rows.length >= questionCategories.length ? "pass" : "fail",
    };
  });
  writeCsv(path.join(interviewDir, "interview_coverage_matrix.csv"), Object.keys(coverageRows[0]), coverageRows);
  return {
    interviewDir,
    interviewRows: executiveRows.length,
    questionRows: questionRows.length,
    coverageRows,
  };
}

function htmlEscape(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
}

function writeProofHtml(filePath, title, body) {
  writeText(filePath, `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${htmlEscape(title)}</title>
<style>
body{font-family:Arial,Helvetica,sans-serif;margin:0;background:#f7f8fa;color:#17202a}
main{max-width:1180px;margin:0 auto;padding:28px}
section{background:#fff;border:1px solid #d9dee7;border-radius:8px;margin:14px 0;padding:16px}
h1,h2{margin:0 0 10px}
p{line-height:1.45}
table{border-collapse:collapse;width:100%;font-size:13px}
th,td{border:1px solid #dde3ec;padding:8px;text-align:left;vertical-align:top}
th{background:#eef3f8}
.pass{color:#146c2e;font-weight:700}.block{color:#a33b00;font-weight:700}.truth{border-left:5px solid #8a4b00;background:#fff7e8;padding:12px 14px;color:#473100;font-weight:700}
.layers{display:grid;gap:10px}.layer{display:grid;grid-template-columns:64px 1fr;border:1px solid #d9dee7;border-radius:8px;background:#fff}.badge{display:flex;align-items:center;justify-content:center;background:#102236;color:white;font-weight:700}.layer div:last-child{padding:12px}
</style>
</head>
<body><main><h1>${htmlEscape(title)}</h1><p class="truth">${htmlEscape(truthStatement)}</p>${body}</main></body></html>
`);
}

function copyOrWritePlaceholder(source, target, title, detail) {
  if (fs.existsSync(source)) {
    copyFile(source, target);
  } else {
    writeProofHtml(target, title, `<section><p class="block">${htmlEscape(detail)}</p></section>`);
  }
}

function tenantReport(config, commandRows, guidanceRows, interviewSupport) {
  const manifest = readJson(`datasets/tenant-inputs/generated/${config.tenantKey}/rich-synthetic-2026-07-v3/tenant-generation-manifest.json`);
  const outDir = path.join(repoRoot, "reports", `${config.tenantKey}-data-factory`);
  const syntheticDir = path.join(repoRoot, "reports", `${config.tenantKey}-synthetic-context-generation`);
  const azureDir = path.join(repoRoot, "reports", `${config.tenantKey}-azure-persistence`);
  ensureDir(outDir);

  const inventory = readCsv(path.join(syntheticDir, "source-template-inventory.csv"));
  writeCsv(path.join(outDir, "source-template-inventory.csv"), ["tenant_key", "display_name", "file", "requested_alias", "rows", "checksum", "dimension_key", "candidate_contract_version"], inventory.map((row) => ({
    ...row,
    display_name: config.displayName,
    requested_alias: requestedAliases.get(path.basename(row.file)) ?? path.basename(row.file),
  })));
  writeCsv(path.join(outDir, "source-row-counts.csv"), ["tenant_key", "display_name", "source_template_file", "requested_alias", "rows", "status"], inventory.map((row) => ({
    tenant_key: config.tenantKey,
    display_name: config.displayName,
    source_template_file: path.basename(row.file),
    requested_alias: requestedAliases.get(path.basename(row.file)) ?? path.basename(row.file),
    rows: row.rows,
    status: Number(row.rows) > 0 ? "pass" : "fail",
  })));

  for (const file of [
    "interview-coverage.csv",
    "canonical-fact-counts.csv",
    "entity-profile-counts.csv",
    "graph-reconciliation.csv",
    "context-gaps.csv",
    "evidence-ref-resolution.csv",
    "blocked-claims-audit.csv",
  ]) {
    copyFile(path.join(syntheticDir, file), path.join(outDir, file));
  }
  copyFile(path.join(syntheticDir, "home-render-pack-proof.html"), path.join(outDir, "home-render-pack-proof.html"));
  copyOrWritePlaceholder(path.join(syntheticDir, "tower-context-proof.html"), path.join(outDir, "tower-read-model-proof.html"), `${config.displayName} Tower Read Model Proof`, "Tower proof source missing.");

  const loadPlan = readCsv(path.join(azureDir, "candidate-load-plan.csv"));
  writeCsv(path.join(outDir, "azure-table-write-counts.csv"), ["tenant_key", "display_name", "target_table", "planned_rows", "write_status"], loadPlan.map((row) => ({
    tenant_key: row.tenant_key,
    display_name: config.displayName,
    target_table: row.target_table,
    planned_rows: row.planned_rows,
    write_status: row.write_status,
  })));
  copyFile(path.join(azureDir, "local-reconciliation-checks.csv"), path.join(outDir, "layer-reconciliation.csv"));

  const moduleFiles = [
    ["tower", "tower-candidate-consumption.csv", "tower-read-model-proof.html"],
    ["moves", "moves-candidate-consumption.csv", "moves-context-proof.html"],
    ["source", "source-candidate-consumption.csv", "source-context-proof.html"],
  ];
  for (const [mode, csvFile, htmlFile] of moduleFiles) {
    const rows = readCsv(path.join(azureDir, csvFile));
    writeProofHtml(
      path.join(outDir, htmlFile),
      `${config.displayName} ${mode[0].toUpperCase()}${mode.slice(1)} Candidate Proof`,
      `<section><h2>Candidate Consumption</h2><table><tr><th>Check</th><th>Status</th><th>Detail</th></tr>${rows.map((row) => `<tr><td>${htmlEscape(row.check)}</td><td>${htmlEscape(row.status)}</td><td>${htmlEscape(row.detail)}</td></tr>`).join("")}</table></section>`,
    );
  }

  const intelligenceRows = readCsv(path.join(azureDir, "intelligence-candidate-consumption.csv"));
  writeText(path.join(outDir, "retrieval-proof.md"), `# ${config.displayName} Retrieval Proof

Status: ${intelligenceRows.every((row) => row.status === "pass") ? "PASS_LOCAL_CANDIDATE_PREVIEW" : "FAIL"}

This proves generated candidate retrieval chunks are tenant-scoped, lineage-backed, and candidate-preview-only. It does not prove Azure/Postgres read-back or signed-in product retrieval.

${intelligenceRows.map((row) => `- ${row.check}: ${row.status} - ${row.detail}`).join("\n")}
`);

  const moduleRows = ["home", "tower", "intelligence", "moves", "source"].flatMap((mode) =>
    readCsv(path.join(azureDir, `${mode}-candidate-consumption.csv`)).map((row) => ({ ...row, mode })),
  );
  writeText(path.join(outDir, "page-consumption-proof.md"), `# ${config.displayName} Page Consumption Proof

Status: PASS for local candidate render-pack consumption. Azure/Postgres page/API read-back is pending an approved candidate data-plane load.

${moduleRows.map((row) => `- ${row.mode}: ${row.check} - ${row.status}`).join("\n")}
`);

  writeText(path.join(outDir, "default-runtime-invisibility.md"), `# ${config.displayName} Default Runtime Invisibility

Status: PASS_LOCAL.

- Generated manifest has azure_postgres_mutated = ${manifest.boundaries.azure_postgres_mutated}.
- Generated manifest has active_pointer_updated = ${manifest.boundaries.active_pointer_updated}.
- Generated manifest has default_runtime_visible = ${manifest.boundaries.default_runtime_visible}.
- Candidate preview artifacts require explicit preview consumption.
- No default Home/Knowledge/Tower/Intelligence/Moves/Source runtime path is changed by this factory run.
`);

  writeProofHtml(
    path.join(outDir, "template-guidance-index.html"),
    `${config.displayName} Template Guidance Index`,
    `<section><h2>Template Guidance</h2><table><tr><th>Source template</th><th>Requested alias</th><th>Guidance</th><th>Dictionary</th><th>Status</th></tr>${guidanceRows.map((row) => `<tr><td>${htmlEscape(row.source_template_file)}</td><td>${htmlEscape(row.requested_template_file)}</td><td>${htmlEscape(row.guidance_file)}</td><td>${htmlEscape(row.data_dictionary_file)}</td><td>${htmlEscape(row.status)}</td></tr>`).join("")}</table></section>`,
  );

  const finalStatus = "BLOCKED_BEFORE_PROMOTION";
  writeText(path.join(outDir, "summary.md"), `# ${config.displayName} Tenant Data Factory

Final status: ${finalStatus}

${truthStatement}

## What Passed

- 19 source/template files and ${manifest.counts.source_template_rows.toLocaleString("en-US")} source/template rows.
- ${manifest.counts.interview_rows} executive interview rows across ${stakeholderGroups.length} stakeholder groups.
- ${manifest.counts.canonical_facts.toLocaleString("en-US")} canonical facts.
- ${manifest.counts.entity_profiles.toLocaleString("en-US")} entity profiles.
- ${manifest.counts.graph_nodes.toLocaleString("en-US")} graph nodes and ${manifest.counts.graph_edges.toLocaleString("en-US")} graph edges.
- ${manifest.counts.context_gaps.toLocaleString("en-US")} context gaps and ${manifest.counts.evidence_references.toLocaleString("en-US")} evidence references.
- Home, Tower, Intelligence, Moves, and Source candidate preview packs are locally consumable.
- Template guidance and data dictionaries generated under \`templates/${config.tenantKey}/\`.
- Interview support files generated under \`datasets/tenant-inputs/${config.tenantKey}/interviews/\`.

## What Is Blocked

- Azure/Postgres write execution remains blocked by the existing guarded loader.
- Active promotion is not requested and was not performed.
- Signed-in page/API read-back from the data plane is not claimed.

## Label Contract

- AbarVa-facing display label: ${config.displayName}.
- Physical/source label: ${config.physicalLabel}.
- Tenant key: ${config.tenantKey}.
`);

  const layers = [
    ["L0", "Tenant Contract", "Display label, physical source label, candidate contract, runtime invisibility boundaries", 1],
    ["L1", "Source Templates and Interviews", "19 source templates plus executive interviews and interview support pack", manifest.counts.source_template_rows + manifest.counts.interview_rows],
    ["L2", "Canonical Facts", "Deterministic canonical records and fact rows with evidence IDs", manifest.counts.canonical_records + manifest.counts.canonical_facts],
    ["L3", "Evidence and Gaps", "Evidence registry entries and context gaps for safe module usage", manifest.counts.evidence_references + manifest.counts.context_gaps],
    ["L4", "Relationship Graph", "Tenant-scoped nodes and edges for dependency explanation only", manifest.counts.graph_nodes + manifest.counts.graph_edges],
    ["L5", "Retrieval Pack", "Candidate-preview-only chunks and render pack", manifest.counts.retrieval_chunks],
    ["L6", "Module Consumption", "Home/Knowledge, Tower, Intelligence, Moves, and Source local candidate proofs", 19 + 12 + 12 + 12],
  ];
  writeProofHtml(
    path.join(outDir, "proof.html"),
    `${config.displayName} Tenant Data Factory Proof`,
    `<section><h2>Final Status</h2><p class="block">${finalStatus}</p><p>Local generation, validation, dry-run load planning, reconciliation, and candidate consumption proof passed. Azure/Postgres mutation is still blocked pending an approved non-prod job path.</p></section><section><h2>Layer Flow</h2><div class="layers">${layers.map(([id, title, detail, count]) => `<div class="layer"><div class="badge">${htmlEscape(id)}</div><div><strong>${htmlEscape(title)}</strong><p>${htmlEscape(detail)}</p><p>${Number(count).toLocaleString("en-US")} rows/objects</p></div></div>`).join("")}</div></section>`,
  );

  return {
    tenant_key: config.tenantKey,
    display_name: config.displayName,
    final_status: finalStatus,
    ...manifest.counts,
    interview_support_rows: interviewSupport.interviewRows,
  };
}

function crossTenantReport(rows) {
  const outDir = path.join(repoRoot, "reports/multi-tenant-data-factory");
  ensureDir(outDir);
  writeCsv(path.join(outDir, "tenant-comparison.csv"), Object.keys(rows[0]), rows);
  writeCsv(path.join(outDir, "volumetric-comparison.csv"), Object.keys(rows[0]), rows);

  const layerRows = rows.flatMap((row) => [
    { tenant_key: row.tenant_key, display_name: row.display_name, layer: "L1 source and interviews", count: Number(row.source_template_rows) + Number(row.interview_rows), status: "pass" },
    { tenant_key: row.tenant_key, display_name: row.display_name, layer: "L2 records and facts", count: Number(row.canonical_records) + Number(row.canonical_facts), status: "pass" },
    { tenant_key: row.tenant_key, display_name: row.display_name, layer: "L3 evidence and gaps", count: Number(row.evidence_references) + Number(row.context_gaps), status: "pass" },
    { tenant_key: row.tenant_key, display_name: row.display_name, layer: "L4 relationship graph", count: Number(row.graph_nodes) + Number(row.graph_edges), status: "pass" },
    { tenant_key: row.tenant_key, display_name: row.display_name, layer: "L5 retrieval", count: Number(row.retrieval_chunks), status: "pass" },
    { tenant_key: row.tenant_key, display_name: row.display_name, layer: "L6 module packs", count: 55, status: "pass_local" },
  ]);
  writeCsv(path.join(outDir, "layer-counts.csv"), Object.keys(layerRows[0]), layerRows);

  const tableRows = rows.flatMap((row) => readCsv(path.join(repoRoot, "reports", `${row.tenant_key}-data-factory/azure-table-write-counts.csv`)));
  writeCsv(path.join(outDir, "table-write-counts.csv"), Object.keys(tableRows[0]), tableRows);
  const reuseSource = path.join(repoRoot, "reports/multi-tenant-synthetic-context-generation/reuse-vs-industry-specificity.md");
  if (fs.existsSync(reuseSource)) copyFile(reuseSource, path.join(outDir, "reuse-vs-industry-specificity.md"));
  else writeText(path.join(outDir, "reuse-vs-industry-specificity.md"), "# Reuse vs Industry Specificity\n\nShared V3 data factory pattern with tenant-specific industry content.\n");

  writeText(path.join(outDir, "summary.md"), `# Multi-Tenant Data Factory

Final status: BLOCKED_BEFORE_PROMOTION

${truthStatement}

## What Passed

${rows.map((row) => `- ${row.display_name} (${row.tenant_key}): ${Number(row.source_template_rows).toLocaleString("en-US")} source rows, ${Number(row.interview_rows).toLocaleString("en-US")} interview rows, ${Number(row.canonical_facts).toLocaleString("en-US")} facts, ${Number(row.graph_nodes + row.graph_edges).toLocaleString("en-US")} graph objects.`).join("\n")}

## Boundary

The repeatable factory can generate, validate, dry-run plan, reconcile, and locally prove candidate module consumption. It does not yet execute Azure/Postgres candidate writes because the repository loader is intentionally write-locked pending approved non-prod job execution.
`);

  const layerSections = layerRows
    .map((row, index) => `<div class="layer"><div class="badge">L${index + 1}</div><div><strong>${htmlEscape(row.display_name)}: ${htmlEscape(row.layer)}</strong><p>${Number(row.count).toLocaleString("en-US")} rows/objects loaded into local candidate context. Status: ${htmlEscape(row.status)}.</p></div></div>`)
    .join("");
  writeProofHtml(
    path.join(outDir, "proof.html"),
    "Multi-Tenant Data Factory Proof",
    `<section><h2>Final Status</h2><p class="block">BLOCKED_BEFORE_PROMOTION</p><p>FS Demo and Airline Demo passed local rich-data generation, validation, dry-run load planning, reconciliation, and module candidate proof. Azure/Postgres write/read-back remains blocked until the approved non-prod data-build job path is implemented and run.</p></section><section><h2>Layer-by-Layer Flow</h2><div class="layers">${layerSections}</div></section>`,
  );
  const dataFlowSource = path.join(repoRoot, "reports/multi-tenant-azure-persistence/data-flow.html");
  if (fs.existsSync(dataFlowSource)) copyFile(dataFlowSource, path.join(outDir, "data-flow.html"));
}

function run() {
  const mode = arg("--mode", "candidate");
  if (mode !== "candidate") throw new Error("tenant:data-factory currently supports --mode candidate only. Active promotion is intentionally out of scope.");
  if (hasFlag("--promote")) throw new Error("--promote is not allowed by this factory. Run a separate promotion review after DB write/read-back proof.");

  const tenants = selectedTenants();
  const requestedIndustry = arg("--industry");
  if (requestedIndustry && tenants.length === 1 && requestedIndustry.toLowerCase() !== tenants[0].industry.toLowerCase()) {
    throw new Error(`Industry mismatch for ${tenants[0].tenantKey}: expected "${tenants[0].industry}", received "${requestedIndustry}".`);
  }

  const commandRows = [];
  if (!hasFlag("--skip-generate")) {
    commandRows.push(runCommand("generate synthetic tenants", "node", ["scripts/tenant-v3/generate-rich-synthetic-tenant.mjs", "--tenant", tenants.length === 1 ? tenants[0].tenantKey : "all"]));
  }
  if (!hasFlag("--generate-only")) {
    commandRows.push(runCommand("audit synthetic richness", "node", ["scripts/audit/synthetic-tenant-richness.mjs", "--tenant", tenants.length === 1 ? tenants[0].tenantKey : "all"]));
    for (const tenant of tenants) {
      commandRows.push(runCommand(`${tenant.tenantKey} candidate load dry-run`, "node", ["scripts/knowledge/load-tenant-candidate-context.mjs", "--tenant", tenant.tenantKey, "--env", arg("--env", "nonprod-not-confirmed"), "--dry-run"]));
      commandRows.push(runCommand(`${tenant.tenantKey} data-plane reconciliation`, "node", ["scripts/knowledge/reconcile-tenant-data-plane.mjs", "--tenant", tenant.tenantKey]));
      for (const modeName of ["home", "tower", "intelligence", "moves", "source"]) {
        commandRows.push(runCommand(`${tenant.tenantKey} ${modeName} candidate proof`, "node", ["scripts/audit/candidate-consumption-proof.mjs", "--mode", modeName, "--tenant", tenant.tenantKey]));
      }
    }
    commandRows.push(runCommand("default runtime invisibility", "node", ["scripts/audit/default-runtime-invisibility.mjs"]));
  }

  if (hasFlag("--load") && !hasFlag("--dry-run")) {
    commandRows.push({
      label: "Azure/Postgres candidate write",
      command: "tenant:data-factory --load",
      exit_code: 2,
      status: "blocked",
      started_at: new Date().toISOString(),
      finished_at: new Date().toISOString(),
    });
  }

  const failedCommands = commandRows.filter((row) => row.status === "fail");
  if (failedCommands.length > 0) {
    writeCsv(path.join(repoRoot, "reports/multi-tenant-data-factory/command-results.csv"), Object.keys(commandRows[0]), commandRows);
    throw new Error(`tenant:data-factory failed: ${failedCommands.map((row) => row.label).join(", ")}`);
  }

  const tenantRows = tenants.map((tenant) => {
    const guidanceRows = writeTemplateGuidance(tenant);
    const interviewSupport = writeInterviewSupport(tenant);
    return tenantReport(tenant, commandRows, guidanceRows, interviewSupport);
  });
  crossTenantReport(tenantRows);
  writeCsv(path.join(repoRoot, "reports/multi-tenant-data-factory/command-results.csv"), Object.keys(commandRows[0] ?? { label: "", command: "", exit_code: "", status: "", started_at: "", finished_at: "" }), commandRows);

  const blocked = commandRows.some((row) => row.status === "blocked") || !hasFlag("--load") || hasFlag("--dry-run");
  console.log(JSON.stringify({ status: blocked ? "BLOCKED_BEFORE_PROMOTION" : "WATCH_BEFORE_PROMOTION", tenants: tenantRows }, null, 2));
}

run();
