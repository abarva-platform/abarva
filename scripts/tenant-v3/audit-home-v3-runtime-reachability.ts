import fs from "node:fs";
import path from "node:path";

import { getLocalCxoRuntimeBrowser } from "@/lib/home/local-cxo-runtime";

const repoRoot = process.cwd();
const reportDir = path.join(repoRoot, "reports/meridian-v3-runtime-reachability");
const failures: string[] = [];

function fail(message: string) {
  failures.push(message);
}

function writeCsv(
  filePath: string,
  rows: Array<Record<string, unknown>>,
  columns: string[],
) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  const escape = (value: unknown) => {
    const s = value == null ? "" : String(value);
    return /[",\n]/.test(s) ? `"${s.replaceAll('"', '""')}"` : s;
  };
  fs.writeFileSync(
    filePath,
    `${[columns.join(","), ...rows.map((row) => columns.map((column) => escape(row[column])).join(","))].join("\n")}\n`,
  );
}

function readText(relativePath: string): string {
  return fs.readFileSync(path.join(repoRoot, relativePath), "utf8");
}

function exists(relativePath: string): boolean {
  return fs.existsSync(path.join(repoRoot, relativePath));
}

function dimensionColumns(label: string): string[] {
  const browser = getLocalCxoRuntimeBrowser("meridian-health");
  return browser?.dimensions[label]?.columns.map((column) => column.key) ?? [];
}

const canonicalHomeDir =
  "datasets/tenant-inputs/meridian-health/approved-content/home";
const canonicalTowerDir =
  "datasets/tenant-inputs/meridian-health/approved-content/tower";
const legacyHomeDir =
  "datasets/context-artifacts/approved/meridian-health/home-knowledge";
const legacyKnowledgeDir =
  "datasets/meridian-health-v6-v7-current-state-v1/derived/knowledge";

const browser = getLocalCxoRuntimeBrowser("meridian-health");
if (!browser) fail("getLocalCxoRuntimeBrowser returned null for meridian-health");
if (browser?.cxoContentSource !== "canonical-v3-approved-content") {
  fail(`Expected canonical-v3-approved-content, found ${browser?.cxoContentSource ?? "missing"}`);
}
if (browser?.runtimeSource !== "local-v3-standard") {
  fail(`Expected local-v3-standard runtimeSource, found ${browser?.runtimeSource ?? "missing"}`);
}
if (!browser?.cxoStoryBlocks?.length) fail("No Home story blocks loaded from canonical V3 approved content");
if (!browser?.cxoVisualSpecs?.length) fail("No Home visual specs loaded from canonical V3 approved content");

const pageSource = readText("src/app/(maestro)/home/page.tsx");
const runtimeSelectionStart = pageSource.indexOf("const localBrowser = getLocalCxoRuntimeBrowser");
const runtimeSelectionEnd = pageSource.indexOf("const [inventorySnapshot", runtimeSelectionStart);
const runtimeSelectionSource =
  runtimeSelectionStart >= 0 && runtimeSelectionEnd > runtimeSelectionStart
    ? pageSource.slice(runtimeSelectionStart, runtimeSelectionEnd)
    : "";
const localFirst =
  runtimeSelectionSource.includes("const canonicalLocalBrowser") &&
  runtimeSelectionSource.indexOf("const localBrowser") <
    runtimeSelectionSource.indexOf("const v7Browser") &&
  runtimeSelectionSource.indexOf("canonicalLocalBrowser ??") >
    runtimeSelectionSource.indexOf("const browser =");
if (!localFirst) fail("Home page does not check canonical local browser before V7 browser");

const runtimeSource = readText("src/lib/home/local-cxo-runtime.ts");
if (!runtimeSource.includes("canonicalApprovedDir")) fail("local-cxo-runtime lacks canonicalApprovedDir");
if (!runtimeSource.includes("legacyArtifactStoreDir")) fail("local-cxo-runtime lacks legacyArtifactStoreDir fallback");
if (runtimeSource.indexOf("readCanonicalApprovedHomeContent") > runtimeSource.indexOf("readLegacyApprovedHomeContent")) {
  fail("Canonical approved content reader is declared after legacy fallback in a way that may obscure source priority");
}

const storyText = exists(`${canonicalHomeDir}/story-blocks.json`)
  ? readText(`${canonicalHomeDir}/story-blocks.json`)
  : "";
const staleFindings = [
  "IT Spend Baseline and Value Proof Are Not Yet Evidenced",
  "$1.1B",
  "$1.7B",
  "1100000000",
  "1700000000",
  "dossier",
  "projection",
].filter((needle) => storyText.includes(needle));
for (const finding of staleFindings) fail(`Canonical Home story block contains stale content: ${finding}`);
if (!storyText.includes("650") && !storyText.includes("$650M")) {
  fail("Canonical Home story blocks do not mention or preserve the $650M budget posture where budget context is discussed");
}
if (!/candidate ai opportunity portfolio/i.test(storyText)) {
  fail("Canonical Home story blocks do not preserve candidate AI opportunity portfolio posture");
}
if (/\brealized value\b/i.test(storyText) && !/not to claim|not realized|not imply|No production|must not|without/i.test(storyText)) {
  fail("Canonical Home story blocks may imply realized value");
}

const budgetColumns = dimensionColumns("IT Budget, Spend & Value");
const programColumns = dimensionColumns("Programs & Initiatives");
const aiColumns = dimensionColumns("AI & Automation Use Cases");
const requiredBudgetColumns = [
  "business_name",
  "financial_fact_type",
  "fiscal_year",
  "budget_amount_usd",
  "run_budget_usd",
  "change_budget_usd",
];
const requiredProgramColumns = [
  "business_name",
  "program_code",
  "initiative_status",
  "funding_status",
  "approved_funding_usd",
  "requested_funding_usd",
];
const requiredAiColumns = [
  "business_name",
  "data_domain",
  "affected_process",
  "use_case_status",
  "funding_status",
  "readiness_status",
];
for (const column of requiredBudgetColumns) if (!budgetColumns.includes(column)) fail(`08 preview missing ${column}`);
for (const column of requiredProgramColumns) if (!programColumns.includes(column)) fail(`09 preview missing ${column}`);
for (const column of requiredAiColumns) if (!aiColumns.includes(column)) fail(`10 preview missing ${column}`);
for (const oldColumn of ["value_hypothesis", "amount_usd", "realized_value_usd", "run_change_flag"]) {
  if (budgetColumns.includes(oldColumn)) fail(`08 preview still prioritizes old/phantom column ${oldColumn}`);
}
if (aiColumns.includes("business_unit")) {
  fail("10 preview includes business_unit even though raw 10_ai_automation_use_cases.csv does not contain it");
}

const approvedPaths = [
  {
    path: canonicalHomeDir,
    current_reader: "getLocalCxoRuntimeBrowser/readCanonicalApprovedHomeContent",
    current_writer: "generate:meridian-v3-derived-layer and generate:meridian-v3-approved-claude-content",
    status: exists(`${canonicalHomeDir}/story-blocks.json`) ? "present" : "missing",
    canonical_yes_no: "yes",
    stale_risk: "low",
    recommended_action: "primary Home approved-content path",
  },
  {
    path: canonicalTowerDir,
    current_reader: "none in Tower runtime today",
    current_writer: "generate:meridian-v3-derived-layer and generate:meridian-v3-approved-claude-content",
    status: exists(`${canonicalTowerDir}/story-blocks.json`) ? "present" : "missing",
    canonical_yes_no: "yes",
    stale_risk: "low",
    recommended_action: "load through governed data-plane before Tower runtime use",
  },
  {
    path: legacyHomeDir,
    current_reader: "legacy fallback only after canonical Home approved content is absent",
    current_writer: "legacy knowledge generators",
    status: exists(`${legacyHomeDir}/approved-cxo-story-blocks.json`) ? "present" : "missing",
    canonical_yes_no: "no",
    stale_risk: "high",
    recommended_action: "keep only as backward-compatible fallback",
  },
  {
    path: legacyKnowledgeDir,
    current_reader: "legacy V6/V7 paths only",
    current_writer: "legacy V6/V7 generators",
    status: exists(legacyKnowledgeDir) ? "present" : "missing",
    canonical_yes_no: "no",
    stale_risk: "high",
    recommended_action: "do not use as Meridian V3 approved-content source",
  },
];

const contentAudit = [
  {
    check: "canonical_home_story_blocks_present",
    status: exists(`${canonicalHomeDir}/story-blocks.json`) ? "pass" : "fail",
    detail: `${canonicalHomeDir}/story-blocks.json`,
  },
  {
    check: "canonical_home_visual_specs_present",
    status: exists(`${canonicalHomeDir}/visual-specs.json`) ? "pass" : "fail",
    detail: `${canonicalHomeDir}/visual-specs.json`,
  },
  {
    check: "runtime_uses_canonical_content_source",
    status: browser?.cxoContentSource === "canonical-v3-approved-content" ? "pass" : "fail",
    detail: browser?.cxoContentSource ?? "missing",
  },
  {
    check: "stale_content_absent",
    status: staleFindings.length ? "fail" : "pass",
    detail: staleFindings.join("; ") || "none",
  },
];

const previewAudit = [
  ...budgetColumns.map((column, index) => ({ dimension: "08_it_budget_spend_value", column, priority: index + 1 })),
  ...programColumns.map((column, index) => ({ dimension: "09_programs_initiatives", column, priority: index + 1 })),
  ...aiColumns.map((column, index) => ({ dimension: "10_ai_automation_use_cases", column, priority: index + 1 })),
];

fs.mkdirSync(reportDir, { recursive: true });
writeCsv(path.join(reportDir, "approved-content-paths.csv"), approvedPaths, [
  "path",
  "current_reader",
  "current_writer",
  "status",
  "canonical_yes_no",
  "stale_risk",
  "recommended_action",
]);
writeCsv(path.join(reportDir, "home-approved-content-audit.csv"), contentAudit, ["check", "status", "detail"]);
writeCsv(path.join(reportDir, "home-preview-column-audit.csv"), previewAudit, ["dimension", "column", "priority"]);
writeCsv(
  path.join(reportDir, "stale-content-findings.csv"),
  staleFindings.map((finding) => ({ finding, source: `${canonicalHomeDir}/story-blocks.json` })),
  ["finding", "source"],
);

const summary = `# Meridian V3 Runtime Reachability

Status: ${failures.length ? "Fail" : "Pass"}

Generated at: ${new Date().toISOString()}

## Boundary

- No Azure/Postgres mutation.
- No Active Tenant Access update.
- No candidate promotion.
- No deploy.
- Tower runtime is not changed.

## Home Result

- Home local fallback content source: \`${browser?.cxoContentSource ?? "missing"}\`
- Home runtime source: \`${browser?.runtimeSource ?? "missing"}\`
- Canonical Home story blocks: ${browser?.cxoStoryBlocks?.length ?? 0}
- Canonical Home visual specs: ${browser?.cxoVisualSpecs?.length ?? 0}

## Tower Result

Tower remains Postgres/runtime-data backed and will not reflect repo file artifacts until a governed data-plane load, candidate preview, promotion, and signed-in proof sequence occurs.

## Failures

${failures.map((failure) => `- ${failure}`).join("\n") || "None"}
`;
fs.writeFileSync(path.join(reportDir, "summary.md"), summary);
fs.writeFileSync(
  path.join(reportDir, "home-runtime-source-priority.md"),
  `# Home Runtime Source Priority\n\n1. Canonical V3 approved content under \`${canonicalHomeDir}\` when present and valid.\n2. Legacy approved content under \`${legacyHomeDir}\` only as fallback.\n3. Deterministic local V3 standard CSV preview when story blocks are absent.\n4. Legacy V7/V6 are not preferred when canonical V3 approved content exists.\n`,
);
fs.writeFileSync(
  path.join(reportDir, "tower-runtime-readiness.md"),
  `# Tower Runtime Readiness\n\nTower runtime currently reads Postgres/runtime data through \`loadCioTowerCxoView\` and \`listTowerBudgetRollupsForClient\`. It does not read \`datasets/tenant-inputs/meridian-health/approved-content/tower/\` or \`derived/module-context/tower-dashboard-view.json\` directly.\n\n## Why Repo Artifacts Are Not Visible Yet\n\nThe Meridian V3 files are source and derived artifacts only. They are not loaded into Azure/Postgres, not indexed, not promoted to Active Tenant Access, and not live-proven in Tower.\n\n## Required Future Sequence\n\n1. Governed ACA data-build job for candidate load.\n2. Candidate preview proof.\n3. Human review and promotion gate.\n4. Active Tenant Access update.\n5. Signed-in Tower proof.\n\n## Current Decision\n\nDo not claim Tower runtime reflects #4909/#4915/#4917 artifacts yet.\n`,
);
fs.writeFileSync(
  path.join(reportDir, "proof.html"),
  `<!doctype html><meta charset="utf-8"><title>Meridian V3 Runtime Reachability</title><style>body{font-family:Inter,Arial,sans-serif;max-width:1100px;margin:40px auto;color:#0b1633}table{border-collapse:collapse;width:100%;margin:16px 0}td,th{border:1px solid #d8dee9;padding:8px}th{background:#f5f7fb}.ok{color:#087f5b;font-weight:700}.fail{color:#c92a2a;font-weight:700}</style><h1>Meridian V3 Runtime Reachability</h1><p class="${failures.length ? "fail" : "ok"}">${failures.length ? "Fail" : "Pass"}</p><table><tr><th>Check</th><th>Value</th></tr><tr><td>Home content source</td><td>${browser?.cxoContentSource ?? "missing"}</td></tr><tr><td>Home runtime source</td><td>${browser?.runtimeSource ?? "missing"}</td></tr><tr><td>Story blocks</td><td>${browser?.cxoStoryBlocks?.length ?? 0}</td></tr><tr><td>Visual specs</td><td>${browser?.cxoVisualSpecs?.length ?? 0}</td></tr><tr><td>Tower repo artifact live?</td><td>No</td></tr></table>`,
);

const result = {
  status: failures.length ? "Fail" : "Pass",
  failures,
  home_content_source: browser?.cxoContentSource ?? null,
  home_runtime_source: browser?.runtimeSource ?? null,
  story_blocks: browser?.cxoStoryBlocks?.length ?? 0,
  visual_specs: browser?.cxoVisualSpecs?.length ?? 0,
  budget_preview_columns: budgetColumns,
  program_preview_columns: programColumns,
  ai_preview_columns: aiColumns,
};
fs.writeFileSync(path.join(reportDir, "summary.json"), `${JSON.stringify(result, null, 2)}\n`);

if (failures.length) {
  console.error(JSON.stringify(result, null, 2));
  process.exit(1);
}

console.log(JSON.stringify(result, null, 2));
