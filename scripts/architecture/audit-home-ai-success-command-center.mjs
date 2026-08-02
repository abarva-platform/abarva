import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { execFileSync, spawnSync } from "node:child_process";
import Papa from "papaparse";

const repoRoot = process.cwd();
const packageRoot = path.join(repoRoot, "out/skyharbor-global-synthetic-current-state-v3");
const downloadsDir = "/Users/anand/Downloads";
const stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\..+$/, "");
const auditRoot = path.join(repoRoot, "reports/home-ai-success-command-center-quality", stamp);
const zipPath = path.join(downloadsDir, `Abarva_Home_AI_Success_Command_Center_Full_Audit_${stamp}.zip`);

const sourceFiles = [
  "src/app/(maestro)/home/page.tsx",
  "src/lib/home/readSkyHarborAiSuccessHome.ts",
  "src/components/home/ai-success-command-center/AiSuccessCommandCenter.tsx",
  "src/components/home/ai-success-command-center/AiSuccessCommandCenter.module.css",
  "src/components/architecture/CurrentStateArchitectureMap.tsx",
];

fs.mkdirSync(auditRoot, { recursive: true });
fs.mkdirSync(downloadsDir, { recursive: true });

const findings = [];
const gates = [];

function main() {
  const manifest = readJson("metadata/dataset_manifest.json");
  const validation = readJson("validation/validation_report.json");
  const loadReport = readJson("validation/postgres_raw_load_report.json");
  const allowed = readJson("reports/ABARVA_HOME_ALLOWED_VALUES.json");
  const packet = readJson("reports/ABARVA_HOME_DATA_CAPABILITY_PACKET.json");
  const graph = readJson("reports/ENTERPRISE_LANDSCAPE_ARCHITECTURE_GRAPH.json");
  const architectureAdvisory = readJson("reports/ENTERPRISE_LANDSCAPE_CLAUDE_ADVISORY_RESULT.json");
  const towerClaude = readJson("reports/TOWER_CLAUDE_LAYER_RESULT.json");
  const homeSource = sourceFiles.map((file) => [file, fs.readFileSync(path.join(repoRoot, file), "utf8")]);

  const packageValidation = runPackageValidation();
  const csvAudit = auditCsvManifest(manifest);
  const workbookAudit = auditWorkbooks();
  const claimAudit = auditVisibleClaims(allowed, packet, graph);
  const narrativeAudit = auditNarrativeSources(architectureAdvisory, towerClaude, homeSource);
  const codeAudit = auditSourceContract(homeSource);
  const retirementAudit = auditLegacyHomeRetirement();
  const envAudit = auditEnvironment();
  const loadAudit = auditStoredLoadReport(loadReport);
  const qualityAudit = auditKnownDataQuality(validation, packet);

  pushGate("package_validator", packageValidation.status === "pass", packageValidation);
  pushGate("manifest_csv_reconciliation", csvAudit.failures.length === 0, csvAudit.summary);
  pushGate("workbook_csv_reconciliation", workbookAudit.failures.length === 0, workbookAudit.summary);
  pushGate("visible_claim_recalculation", claimAudit.failures.length === 0, claimAudit.summary);
  pushGate("source_contract_static_checks", codeAudit.failures.length === 0, codeAudit.summary);
  pushGate("legacy_home_runtime_retired", retirementAudit.failures.length === 0, retirementAudit.summary);
  pushGate("approved_narrative_sources_only", narrativeAudit.failures.length === 0, narrativeAudit.summary);
  pushGate("stored_raw_load_report", loadAudit.failures.length === 0, loadAudit.summary);
  pushGate("known_data_quality_controls", qualityAudit.failures.length === 0, qualityAudit.summary);
  pushGate("live_postgres_available", envAudit.databaseUrlPresent, envAudit);
  pushGate("cube_environment_available", envAudit.cubeEnvPresent, envAudit);

  const overall = gates.every((gate) => gate.required_for_local_release ? gate.passed : true)
    ? "local_release_candidate"
    : "not_release_ready";

  const audit = {
    audit_id: `home_ai_success_command_center_full_audit_${stamp}`,
    generated_at: new Date().toISOString(),
    overall,
    gates,
    findings,
    package_validation: packageValidation,
    csv_manifest_reconciliation: csvAudit,
    workbook_reconciliation: workbookAudit,
    visible_claim_recalculation: claimAudit,
    narrative_sources: narrativeAudit,
    source_contract: codeAudit,
    legacy_home_retirement: retirementAudit,
    environment: envAudit,
    stored_load_report: loadAudit,
    known_data_quality: qualityAudit,
  };

  writeJson(path.join(auditRoot, "home-ai-success-full-audit.json"), audit);
  fs.writeFileSync(path.join(auditRoot, "home-ai-success-full-audit.md"), markdown(audit));
  copySourceFiles(auditRoot);
  copyVisualProof(auditRoot);
  writeJson(path.join(auditRoot, "source-file-sha256.json"), Object.fromEntries(sourceFiles.map((file) => [file, sha256(fs.readFileSync(path.join(repoRoot, file)))])));

  execFileSync("zip", ["-r", "-X", zipPath, path.basename(auditRoot)], {
    cwd: path.dirname(auditRoot),
    stdio: "ignore",
  });
  execFileSync("unzip", ["-t", zipPath], { stdio: "ignore" });

  console.log(JSON.stringify({
    status: overall,
    audit_dir: auditRoot,
    zip_path: zipPath,
    zip_sha256: sha256(fs.readFileSync(zipPath)),
    gates_failed: gates.filter((gate) => !gate.passed).map((gate) => gate.id),
    findings: findings.length,
  }, null, 2));
}

function runPackageValidation() {
  const result = spawnSync("python3", ["scripts/validate_package.py"], {
    cwd: packageRoot,
    encoding: "utf8",
  });
  const output = `${result.stdout ?? ""}${result.stderr ?? ""}`.trim();
  try {
    return JSON.parse(output);
  } catch {
    return { status: "failed", exit_status: result.status, output };
  }
}

function auditCsvManifest(manifest) {
  const rows = [];
  const failures = [];
  for (const workbook of manifest.workbooks ?? []) {
    for (const sheet of workbook.sheets ?? []) {
      const csvPath = path.join(packageRoot, sheet.csv);
      const parsed = parseCsv(csvPath);
      const actual = parsed.length;
      const expected = Number(sheet.row_count);
      const row = {
        workbook: workbook.file,
        sheet: sheet.sheet,
        csv: sheet.csv,
        expected_rows: expected,
        actual_rows: actual,
        column_count: parsed.meta.fields?.length ?? 0,
        sha256: sha256(fs.readFileSync(csvPath)),
        status: actual === expected ? "pass" : "fail",
      };
      rows.push(row);
      if (row.status !== "pass") failures.push(row);
    }
  }
  return {
    summary: {
      expected_tables: 28,
      actual_tables: rows.length,
      expected_rows: sum(rows.map((row) => row.expected_rows)),
      actual_rows: sum(rows.map((row) => row.actual_rows)),
      failures: failures.length,
    },
    rows,
    failures,
  };
}

function auditWorkbooks() {
  const failures = [];
  const rows = [];
  let openpyxlAvailable = true;
  const py = `
import json, pathlib, openpyxl
root=pathlib.Path(${JSON.stringify(packageRoot)})
manifest=json.loads((root/'metadata/dataset_manifest.json').read_text())
rows=[]
for wb in manifest['workbooks']:
  workbook=openpyxl.load_workbook(root/'workbooks'/wb['file'], read_only=True, data_only=True)
  for sheet in wb['sheets']:
    ws=workbook[sheet['sheet']]
    count=0
    for index, row in enumerate(ws.iter_rows(values_only=True)):
      if index == 0:
        continue
      if any(cell is not None and str(cell).strip() != '' for cell in row):
        count += 1
    rows.append({'workbook': wb['file'], 'sheet': sheet['sheet'], 'expected_rows': sheet['row_count'], 'workbook_rows': count, 'status': 'pass' if count == sheet['row_count'] else 'fail'})
print(json.dumps(rows))
`;
  const result = spawnSync("python3", ["-c", py], { encoding: "utf8" });
  if (result.status !== 0) {
    openpyxlAvailable = false;
    addFinding("DQ-WB-001", "medium", "Workbook reconciliation not executable", String(result.stderr || result.stdout || "openpyxl execution failed"));
    return { summary: { openpyxl_available: false, failures: 1 }, rows: [], failures: [{ error: result.stderr || result.stdout }] };
  }
  const parsed = JSON.parse(result.stdout);
  for (const row of parsed) {
    rows.push(row);
    if (row.status !== "pass") failures.push(row);
  }
  return {
    summary: { openpyxl_available: openpyxlAvailable, workbook_sheets: rows.length, failures: failures.length },
    rows,
    failures,
  };
}

function auditLegacyHomeRetirement() {
  const legacyPaths = [
    "src/app/(maestro)/home/v4-preview",
    "src/components/home/v4",
  ];
  const failures = [];
  const checked = legacyPaths.map((relativePath) => {
    const absolutePath = path.join(repoRoot, relativePath);
    const exists = fs.existsSync(absolutePath);
    if (exists) failures.push({ check: "legacy path still exists", path: relativePath });
    return { path: relativePath, exists };
  });
  const runtimeHits = grepRuntimeLegacyReferences();
  for (const hit of runtimeHits) failures.push({ check: "legacy runtime reference remains", hit });
  return {
    summary: {
      checked,
      runtime_reference_hits: runtimeHits.length,
    },
    failures,
  };
}

function auditVisibleClaims(allowed, packet, graph) {
  const failures = [];
  const aiRows = parseCsv(path.join(packageRoot, "csv/enterprise_it/10_ai_adoption_usage.csv"));
  const budgetRows = parseCsv(path.join(packageRoot, "csv/enterprise_it/5_it_budget_allocations.csv"));
  const contractRows = parseCsv(path.join(packageRoot, "csv/enterprise_it/11_vendors_contracts.csv"));
  const allowedValues = Object.fromEntries((allowed.values ?? []).map((value) => [value.key, value]));
  const claimSummary = packet.towerValueProof?.claim_summary ?? [];
  const aiSummary = packet.aiPortfolio?.summary ?? {};

  const calculated = {
    fy2027_budget: sum(budgetRows.filter((row) => String(row["Fiscal Year *"]) === "2027").map((row) => moneyNumber(row["Budget Amount *"]))),
    fy2026_actual: sum(budgetRows.filter((row) => String(row["Fiscal Year *"]) === "2026").map((row) => moneyNumber(row["Actual Amount"]))),
    annual_contract_value: sum(contractRows.map((row) => moneyNumber(row.annual_value))),
    ai_estimated_use_cost: sum(aiRows.map((row) => moneyNumber(row["Estimated Use Cost"]))),
    ai_active_user_observations: sum(aiRows.map((row) => moneyNumber(row["Active Users"]))),
    ai_rows: aiRows.length,
    distinct_ai_tools: new Set(aiRows.map((row) => row["Tool / Agent / Product *"])).size,
    periods: [...new Set(aiRows.map((row) => row["Reporting Period *"]))].sort(),
    claim_count: sum(claimSummary.map((row) => moneyNumber(row.claim_count))),
    claimable_claim_count: moneyNumber(claimSummary.find((row) => row.claim_state === "claimable")?.claim_count),
    funded_no_baseline: moneyNumber(claimSummary.find((row) => row.claim_state === "funded_no_baseline")?.claim_count),
    usage_supported: moneyNumber(claimSummary.find((row) => row.claim_state === "usage_supported")?.claim_count),
    graph_nodes: graph.nodes?.length ?? 0,
    graph_edges: graph.edges?.length ?? 0,
  };

  expectEqual(failures, "FY2027 budget recalculation", calculated.fy2027_budget, 2350000000);
  expectEqual(failures, "FY2026 actual recalculation", calculated.fy2026_actual, 2180000000);
  expectEqual(failures, "Annual contract value recalculation", calculated.annual_contract_value, 1480500000);
  expectNear(failures, "AI estimated use cost recalculation", calculated.ai_estimated_use_cost, 170200000, 100000);
  expectEqual(failures, "AI active-user observation recalculation", calculated.ai_active_user_observations, 705878);
  expectEqual(failures, "AI row count", calculated.ai_rows, 480);
  expectEqual(failures, "Tower governed claim count", calculated.claim_count, allowedValues.tower_value_claim_count?.exact_value);
  expectEqual(failures, "Tower claimable claim count", calculated.claimable_claim_count, 0);
  expectEqual(failures, "Architecture graph nodes", calculated.graph_nodes, allowedValues.architecture_graph_nodes?.exact_value);
  expectEqual(failures, "Architecture graph edges", calculated.graph_edges, allowedValues.architecture_graph_edges?.exact_value);

  if (allowedValues.fy2027_technology_budget?.exact_value === 0 && allowedValues.fy2027_technology_budget?.display_formatted_value === "$2.35B") {
    addFinding("DQ-HOME-001", "medium", "Allowed-value exact value for FY2027 budget is zero while display is $2.35B", "The Home adapter compensates with recalculated/hardcoded numeric bar value. Regenerate allowed values with exact numeric budget to avoid future misuse.");
  }
  if (aiSummary.active_users === calculated.ai_active_user_observations) {
    addFinding("DQ-HOME-002", "info", "AI active users are summed observations, not deduplicated people", "The page must label 705,878 as active-user observations unless identity-level deduplication is added.");
  }

  return { summary: calculated, failures };
}

function auditNarrativeSources(architectureAdvisory, towerClaude, homeSource) {
  const failures = [];
  if (architectureAdvisory.status !== "passed" || architectureAdvisory.validation?.valid !== true) {
    failures.push({ check: "Architecture advisory validation", status: architectureAdvisory.status, validation: architectureAdvisory.validation });
  }
  if (towerClaude.status !== "failed") {
    addFinding("DQ-NAR-001", "medium", "Tower Claude layer did not show expected failed status", "Audit expected the previously rejected Tower narrative to remain rejected.");
  }
  const pageText = homeSource.map(([, text]) => text).join("\n");
  if (pageText.includes("TOWER_CLAUDE_LAYER_RESULT") || pageText.includes("TOWER_AI_SUCCESS_ADVISORY_RESULT")) {
    failures.push({ check: "Rejected Tower Claude result not imported by Home", status: "fail" });
  }
  if (towerClaude.validation_issues?.length) {
    addFinding("DQ-NAR-002", "high", "Tower Claude narrative remains rejected", towerClaude.validation_issues.join("; "));
  }
  return {
    summary: {
      architecture_advisory_status: architectureAdvisory.status,
      architecture_validation_issues: architectureAdvisory.validation?.issues?.length ?? 0,
      tower_claude_status: towerClaude.status,
      tower_claude_validation_issues: towerClaude.validation_issues ?? [],
    },
    failures,
  };
}

function auditSourceContract(homeSource) {
  const text = homeSource.map(([, contents]) => contents).join("\n");
  const failures = [];
  const forbidden = [
    ["unsafe hero overclaim", "None of it is claimable yet"],
    ["visible debug binding control", "Show bindings"],
    ["old limits label", "What Home cannot show"],
    ["deduplicated active users wording", "active users`"],
    ["deduplicated active users copy", "active users"],
    ["overbroad contract rhetoric", "before a single choice is made"],
  ];
  for (const [label, needle] of forbidden) {
    if (text.includes(needle)) failures.push({ check: label, needle });
  }
  const required = [
    "AI is scaling across SkyHarbor. Value proof has not caught up.",
    "Of 162 governed value claims",
    "active-user observations",
    "annual value equals 63% of FY2027 budget",
    "Evidence required next",
  ];
  for (const needle of required) {
    if (!text.includes(needle)) failures.push({ check: "required copy missing", needle });
  }
  return { summary: { checked_files: homeSource.map(([file]) => file), required_terms: required.length, forbidden_terms: forbidden.length }, failures };
}

function auditEnvironment() {
  const envFiles = [".env.local", ".env"].filter((file) => fs.existsSync(path.join(repoRoot, file)));
  const envText = envFiles.map((file) => fs.readFileSync(path.join(repoRoot, file), "utf8")).join("\n");
  const hasEnv = (key) => new RegExp(`^${key}\\s*=`, "m").test(envText) || Boolean(process.env[key]);
  return {
    databaseUrlPresent: hasEnv("DATABASE_URL") || hasEnv("POSTGRES_URL") || hasEnv("SKYHARBOR_TOWER_DATABASE_URL"),
    cubeEnvPresent: hasEnv("CUBEJS_API_SECRET") || hasEnv("CUBEJS_DB_TYPE"),
    anthropicPresent: hasEnv("ANTHROPIC_API_KEY"),
    clerkPresent: hasEnv("CLERK_SECRET_KEY") && hasEnv("NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY"),
    note: "Live Postgres/Cube queries are not executed when credentials are absent. Stored load reports are audited separately.",
  };
}

function auditStoredLoadReport(loadReport) {
  const failures = [];
  const expected = {
    status: "pass",
    tables_expected: 28,
    tables_created: 28,
    rows_expected: 9656,
    rows_inserted: 9656,
    business_rows_rejected: 0,
    csv_hashes_verified: 28,
    row_hash_tables_matched: 28,
    workbook_sheet_count_matches: 28,
    fy2027_budget: 2350000000,
    fy2026_actual: 2180000000,
    contract_value: 1480500000,
    ai_seat_violations: 0,
  };
  for (const [key, value] of Object.entries(expected)) {
    expectEqual(failures, `Stored load report ${key}`, loadReport[key], value);
  }
  return {
    summary: {
      status: loadReport.status,
      database: loadReport.database,
      load_run_id: loadReport.load_run_id,
      package_sha256: loadReport.package_sha256,
      table_results: loadReport.table_results?.length ?? 0,
    },
    failures,
  };
}

function auditKnownDataQuality(validation, packet) {
  const failures = [];
  const mention = validation.mention_distribution ?? {};
  const quality = {
    mention_distribution: mention,
    interview_statement_rows: validation.interview_statement_rows,
    vendor_contract_rows: validation.vendor_contract_rows,
    risk_control_rows: validation.risk_control_rows,
    tower_claim_summary: packet.towerValueProof?.claim_summary ?? [],
    metric_quality_summary: packet.towerValueProof?.metric_quality_summary ?? [],
  };
  if (validation.status !== "pass") failures.push({ check: "validation_report status", status: validation.status });
  if (validation.interview_statement_rows < 960) failures.push({ check: "interview statement minimum", value: validation.interview_statement_rows });
  if (validation.vendor_contract_rows !== 119) failures.push({ check: "vendor contract count", value: validation.vendor_contract_rows });
  if (quality.tower_claim_summary.some((row) => row.claim_state === "claimable" && moneyNumber(row.claim_count) > 0)) {
    failures.push({ check: "claimable claims must remain zero", claim_summary: quality.tower_claim_summary });
  }
  return { summary: quality, failures };
}

function pushGate(id, passed, detail) {
  const nonBlocking = ["live_postgres_available", "cube_environment_available"];
  gates.push({
    id,
    passed: Boolean(passed),
    required_for_local_release: !nonBlocking.includes(id),
    detail,
  });
}

function addFinding(id, severity, finding, impact) {
  findings.push({ id, severity, finding, impact });
}

function expectEqual(failures, check, actual, expected) {
  if (String(actual) !== String(expected)) failures.push({ check, actual, expected });
}

function expectNear(failures, check, actual, expected, tolerance) {
  if (Math.abs(Number(actual) - Number(expected)) > tolerance) failures.push({ check, actual, expected, tolerance });
}

function parseCsv(filePath) {
  const text = fs.readFileSync(filePath, "utf8");
  const parsed = Papa.parse(text, { header: true, skipEmptyLines: true });
  if (parsed.errors.length) {
    throw new Error(`CSV parse failed for ${filePath}: ${JSON.stringify(parsed.errors.slice(0, 3))}`);
  }
  const data = parsed.data;
  data.meta = { fields: parsed.meta.fields };
  return data;
}

function readJson(rel) {
  return JSON.parse(fs.readFileSync(path.join(packageRoot, rel), "utf8"));
}

function moneyNumber(value) {
  const n = Number(String(value ?? "0").replace(/[^0-9.-]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

function sum(values) {
  return values.reduce((total, value) => total + Number(value || 0), 0);
}

function sha256(buffer) {
  return crypto.createHash("sha256").update(buffer).digest("hex");
}

function writeJson(filePath, value) {
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

function copySourceFiles(root) {
  const sourceRoot = path.join(root, "changed-source-files");
  for (const file of sourceFiles) {
    const dest = path.join(sourceRoot, `${file}.txt`);
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.copyFileSync(path.join(repoRoot, file), dest);
  }
}

function copyVisualProof(root) {
  const visualRoot = path.join(root, "visual-proof");
  const proofFiles = [
    "Abarva_Home_AI_Success_Command_Center_desktop.png",
    "Abarva_Home_AI_Success_Command_Center_architecture.png",
    "Abarva_Home_AI_Success_Command_Center_mobile.png",
  ];
  const copied = [];
  for (const file of proofFiles) {
    const source = path.join(downloadsDir, file);
    if (!fs.existsSync(source)) continue;
    fs.mkdirSync(visualRoot, { recursive: true });
    const dest = path.join(visualRoot, file);
    fs.copyFileSync(source, dest);
    copied.push({ file, sha256: sha256(fs.readFileSync(source)) });
  }
  writeJson(path.join(root, "visual-proof-manifest.json"), {
    copied,
    note: copied.length ? "Screenshots captured outside this audit script and bundled for review." : "No visual screenshots were present at audit time.",
  });
}

function grepRuntimeLegacyReferences() {
  const roots = ["src", "scripts"].map((relativePath) => path.join(repoRoot, relativePath));
  const hits = [];
  for (const root of roots) walk(root, (file) => {
    const rel = path.relative(repoRoot, file);
    if (rel === "scripts/architecture/audit-home-ai-success-command-center.mjs") return;
    const text = fs.readFileSync(file, "utf8");
    if (text.includes("home/v4-preview") || text.includes("src/components/home/v4")) hits.push(rel);
  });
  return hits;
}

function walk(root, visit) {
  if (!fs.existsSync(root)) return;
  for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
    if (entry.name === "node_modules" || entry.name === ".next") continue;
    const fullPath = path.join(root, entry.name);
    if (entry.isDirectory()) walk(fullPath, visit);
    if (entry.isFile()) visit(fullPath);
  }
}

function markdown(audit) {
  const gateRows = audit.gates
    .map((gate) => `| ${gate.id} | ${gate.passed ? "PASS" : gate.required_for_local_release ? "FAIL" : "OPEN"} | ${gate.required_for_local_release ? "yes" : "no"} |`)
    .join("\n");
  const findingRows = audit.findings.length
    ? audit.findings.map((finding) => `| ${finding.id} | ${finding.severity} | ${finding.finding} | ${finding.impact} |`).join("\n")
    : "| none | n/a | No findings recorded | n/a |";

  return `# Home AI Success Command Center Full Audit

Generated: ${audit.generated_at}

Overall status: **${audit.overall}**

## Gates

| Gate | Result | Required for local release |
|---|---|---|
${gateRows}

## Visible Claim Recalculation

| Claim | Recalculated value |
|---|---:|
| FY2027 technology budget | $${audit.visible_claim_recalculation.summary.fy2027_budget.toLocaleString("en-US")} |
| FY2026 actual | $${audit.visible_claim_recalculation.summary.fy2026_actual.toLocaleString("en-US")} |
| Annual contract value | $${audit.visible_claim_recalculation.summary.annual_contract_value.toLocaleString("en-US")} |
| AI estimated use cost | $${audit.visible_claim_recalculation.summary.ai_estimated_use_cost.toLocaleString("en-US")} |
| AI active-user observations | ${audit.visible_claim_recalculation.summary.ai_active_user_observations.toLocaleString("en-US")} |
| AI rows | ${audit.visible_claim_recalculation.summary.ai_rows.toLocaleString("en-US")} |
| Distinct AI tools | ${audit.visible_claim_recalculation.summary.distinct_ai_tools.toLocaleString("en-US")} |
| Architecture nodes | ${audit.visible_claim_recalculation.summary.graph_nodes.toLocaleString("en-US")} |
| Architecture edges | ${audit.visible_claim_recalculation.summary.graph_edges.toLocaleString("en-US")} |

## Findings

| ID | Severity | Finding | Impact |
|---|---|---|---|
${findingRows}

## Release Notes

- Live Postgres and Cube verification are open when local credentials are absent.
- The stored Postgres load report is reconciled separately, but it is not live database proof.
- Changed source files are included in this ZIP under changed-source-files/.
- Legacy Home V4 runtime route and renderer checks are recorded under legacy_home_retirement.
`;
}

main();
