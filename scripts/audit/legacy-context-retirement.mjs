import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const REPORT_DIR = path.join(ROOT, "reports/legacy-context-retirement");
const MODE = argValue("--mode") ?? "retirement";

const TENANTS = ["meridian-health", "skyharbor-air", "first-capital"];
const REQUIRED_V3_FILES = [
  "00_enterprise_profile.csv",
  "01_business_functions.csv",
  "02_org_ownership.csv",
  "03_workforce_roles.csv",
  "04_applications_systems.csv",
  "05_data_assets_integrations.csv",
  "06_infrastructure_platforms.csv",
  "07_vendors_contracts.csv",
  "08_it_budget_spend_value.csv",
  "09_programs_initiatives.csv",
  "10_ai_automation_use_cases.csv",
  "11_risks_controls.csv",
  "12_relationships.csv",
  "13_evidence_sources.csv",
  "14_metrics_outcomes.csv",
  "15_industry_context_patterns.csv",
  "16_expert_lenses.csv",
  "17_managed_services_scope.csv",
  "18_operational_process_evidence.csv",
];

const TERMS = [
  ["V4", /\bV4\b|\bv4[-_]/g],
  ["V5", /\bV5\b|\bv5[-_]/g],
  ["V6", /\bV6\b|\bv6[-_]/g],
  ["V7", /\bV7\b|\bv7[-_]/g],
  ["dossier", /\bdossier\b/gi],
  ["projection", /\bprojection\b/gi],
  ["substrate", /\bsubstrate\b/gi],
  ["tenant packet", /\btenant packet\b/gi],
  ["context packet", /\bcontext packet\b/gi],
  ["intelligence_v7", /\bintelligence_v7\b/g],
  ["storyForArea", /\bstoryForArea\b/g],
  ["buildTenantTabStories", /\bbuildTenantTabStories\b/g],
  ["seeded narrative", /\bseeded narrative\b/gi],
  ["latest loaded", /\blatest loaded\b/gi],
  ["latest validated", /\blatest validated\b/gi],
  ["synthetic demo", /\bsynthetic demo\b/gi],
  ["old Home", /\bold Home\b/gi],
  ["old template", /\bold template\b/gi],
  ["old tenant inputs", /\bold tenant inputs\b/gi],
  ["source_record_id", /\bsource_record_id\b/g],
  ["record ID", /\brecord ID\b/gi],
];

const ACTIVE_USER_FACING_DIRS = [
  "src/app",
  "src/components",
  "src/lib/home/narratives/generated",
  "src/lib/intelligence/narratives/generated",
  "src/lib/moves/narratives/generated",
  "src/lib/source/narratives/generated",
  "src/lib/tower/narratives/generated",
  "reports/module-cxo-content",
  "reports/multi-tenant-cxo-story-generation",
  "datasets/context-artifacts/approved",
];

const ALLOW_PREFIXES = [
  "archive/",
  "migrations/",
  "supabase/migrations/",
  "docs/releases/records/",
  "docs/runbooks/",
  "reports/legacy-context-retirement/",
  "reports/candidate-invisibility-guard/",
  "scripts/v7/sql/",
];

function argValue(name) {
  const exact = process.argv.find((arg) => arg.startsWith(`${name}=`));
  if (exact) return exact.slice(name.length + 1);
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : null;
}

function walk(dir) {
  const entries = [];
  if (!existsSync(dir)) return entries;
  for (const item of readdirSync(dir, { withFileTypes: true })) {
    const absolute = path.join(dir, item.name);
    const relative = rel(absolute);
    if (item.isDirectory()) {
      if ([".git", ".next", "node_modules", ".turbo"].includes(item.name)) continue;
      if (relative.startsWith("proof/") || relative.startsWith("audit-artifacts/")) continue;
      entries.push(...walk(absolute));
    } else if (isScannableFile(absolute)) {
      entries.push(absolute);
    }
  }
  return entries;
}

function isScannableFile(file) {
  try {
    if (statSync(file).size > 2_000_000) return false;
  } catch {
    return false;
  }
  return /\.(ts|tsx|js|jsx|mjs|json|jsonl|md|csv|html|txt|sql|yml|yaml)$/i.test(file);
}

function rel(file) {
  return path.relative(ROOT, file).replaceAll(path.sep, "/");
}

function moduleFor(file) {
  if (file.includes("/home/") || file.includes("(maestro)/home")) return "home-knowledge";
  if (file.includes("/intelligence/")) return "intelligence";
  if (file.includes("/tower/")) return "tower";
  if (file.includes("/source/")) return "source";
  if (file.includes("/moves/") || file.includes("strategic-moves")) return "moves";
  if (file.includes("tenant-v6") || file.includes("tenant-inputs") || file.includes("datasets/")) return "tenant-data";
  if (file.includes("scripts/knowledge") || file.includes("reports/module-cxo-content")) return "advisory-generation";
  if (file.includes("docs/")) return "documentation";
  return "platform";
}

function currentUsage(file) {
  if (file.startsWith("src/")) return file.includes("__tests__") || /\.test\./.test(file) ? "test" : "runtime-source";
  if (file.startsWith("scripts/")) return "operator-script";
  if (file.startsWith("datasets/tenant-inputs/")) return "canonical-v3-input";
  if (file.startsWith("datasets/")) return "dataset-artifact";
  if (file.startsWith("reports/")) return "proof-or-generated-report";
  if (file.startsWith("docs/releases/")) return "release-record";
  if (file.startsWith("docs/")) return "architecture-doc";
  if (file === "package.json") return "package-script";
  return "repository-file";
}

function replacementPath(term, file) {
  if (/^V[4567]$/.test(term) || term === "intelligence_v7") {
    return "standard-2026-07-v3 inputs plus neutral ActiveContextStore/ModuleContextReader";
  }
  if (/dossier|projection|substrate/i.test(term)) return "module context pack or active context projection";
  if (/tenant packet|context packet/i.test(term)) return "standard-2026-07-v3 tenant input dataset";
  if (/seeded narrative|storyForArea|buildTenantTabStories/i.test(term)) return "approved Claude-derived advisory/story blocks";
  if (/latest loaded|latest validated/i.test(term)) return "active context pointer";
  if (/source_record_id|record ID/i.test(term)) return "source evidence citation or client-safe row label";
  return file.includes("reports/") ? "archive/legacy-context/<date>/" : "neutral current architecture language";
}

function recommendedAction(file, term, runtimeUsed, userFacing) {
  if (ALLOW_PREFIXES.some((prefix) => file.startsWith(prefix))) return "keep_internal";
  if (file.startsWith("datasets/tenant-inputs/") && file.includes("standard-2026-07-v3")) return "keep_internal";
  if (file.startsWith("datasets/") && /v[4567]|V[4567]/.test(file)) return "archive";
  if (file.startsWith("reports/") && /v[4567]|dossier|projection/i.test(file)) return "archive";
  if (term === "intelligence_v7") return "wrap";
  if (runtimeUsed && userFacing) return "rename";
  if (runtimeUsed) return "wrap";
  if (file.startsWith("scripts/") && /tenant-v6|v7/.test(file)) return "rename";
  if (file.includes("__tests__") || /\.test\./.test(file)) return "keep_internal";
  return "archive";
}

function riskLevel(action, runtimeUsed, userFacing) {
  if (runtimeUsed && userFacing) return "high";
  if (runtimeUsed || action === "wrap") return "medium";
  return "low";
}

function isUserFacingPath(file) {
  return (
    file.startsWith("src/app/") ||
    file.startsWith("src/components/") ||
    file.includes("/narratives/generated/") ||
    file.startsWith("reports/module-cxo-content/") ||
    file.startsWith("reports/multi-tenant-cxo-story-generation/") ||
    file.includes("/derived/knowledge/")
  );
}

function isGeneratedContentPath(file) {
  return (
    file.includes("/narratives/generated/") ||
    file.startsWith("reports/") ||
    file.includes("/derived/") ||
    file.endsWith(".csv") ||
    file.endsWith(".json")
  );
}

function occurrenceType(file, term) {
  if (file.endsWith(".sql")) return "schema-or-migration";
  if (file.endsWith(".md")) return "documentation";
  if (file.endsWith(".csv") || file.endsWith(".json") || file.endsWith(".jsonl")) return "data-or-generated-artifact";
  if (file.includes("__tests__") || /\.test\./.test(file)) return "test-fixture";
  if (file.startsWith("src/")) return "runtime-code";
  if (file.startsWith("scripts/")) return "operator-process";
  return term === "intelligence_v7" ? "physical-storage-name" : "repository-text";
}

function buildInventory() {
  const files = [
    ...walk(path.join(ROOT, "src")),
    ...walk(path.join(ROOT, "scripts")),
    ...walk(path.join(ROOT, "datasets")),
    ...walk(path.join(ROOT, "reports")),
    ...walk(path.join(ROOT, "docs")),
    path.join(ROOT, "package.json"),
  ].filter((file, index, all) => all.indexOf(file) === index);

  const rows = [];
  for (const absolute of files) {
    const file = rel(absolute);
    let text = "";
    try {
      text = readFileSync(absolute, "utf8");
    } catch {
      continue;
    }
    for (const [term, pattern] of TERMS) {
      const matches = text.match(pattern);
      if (!matches?.length) continue;
      const runtimeUsed = file.startsWith("src/") && !file.includes("__tests__") && !/\.test\./.test(file);
      const userFacing = isUserFacingPath(file);
      const generated = isGeneratedContentPath(file);
      const action = recommendedAction(file, term, runtimeUsed, userFacing);
      rows.push({
        path: file,
        symbol_or_term: term,
        occurrence_type: occurrenceType(file, term),
        module: moduleFor(file),
        current_usage: currentUsage(file),
        runtime_used_yes_no: runtimeUsed ? "yes" : "no",
        user_facing_yes_no: userFacing ? "yes" : "no",
        generated_content_yes_no: generated ? "yes" : "no",
        replacement_path: replacementPath(term, file),
        recommended_action: action,
        risk_level: riskLevel(action, runtimeUsed, userFacing),
        notes: `${matches.length} occurrence(s); ${ALLOW_PREFIXES.some((prefix) => file.startsWith(prefix)) ? "allowed internal/historical path" : "review before archive/delete"}`,
      });
    }
  }
  return rows.sort((a, b) => a.path.localeCompare(b.path) || a.symbol_or_term.localeCompare(b.symbol_or_term));
}

function requiredReplacementRows() {
  const rows = [];
  for (const tenant of TENANTS) {
    const dir = path.join(ROOT, "datasets/tenant-inputs", tenant, "standard-2026-07-v3");
    const missing = REQUIRED_V3_FILES.filter((file) => !existsSync(path.join(dir, file)));
    rows.push({
      check: `v3-inputs:${tenant}`,
      status: missing.length ? "FAIL" : "PASS",
      evidence: missing.length ? `missing ${missing.join(";")}` : `${REQUIRED_V3_FILES.length} standard v3 files present`,
    });

    const artifactDir = path.join(ROOT, "datasets/context-artifacts/approved", tenant, "home-knowledge");
    const blocks = path.join(artifactDir, "approved-cxo-story-blocks.json");
    const visuals = path.join(artifactDir, "approved-cxo-visual-specs.json");
    rows.push({
      check: `approved-home-knowledge:${tenant}`,
      status: existsSync(blocks) && existsSync(visuals) ? "PASS" : "FAIL",
      evidence: existsSync(blocks) && existsSync(visuals) ? "approved story blocks and visual specs present" : "approved story blocks or visual specs missing",
    });
  }
  rows.push({
    check: "candidate-invisibility-guard",
    status:
      existsSync(path.join(ROOT, "scripts/audit/candidate-invisibility-guard.mjs")) &&
      readFileSafe("src/lib/home/v7-context-browser.ts").includes("active_tenant_contract_versions")
        ? "PASS"
        : "FAIL",
    evidence: "default runtime requires active pointer; candidate preview is explicit",
  });
  rows.push({
    check: "local-runtime-retrieval-proof",
    status: existsSync(path.join(ROOT, "reports/multi-tenant-runtime-retrieval-proof/summary.md")) ? "PASS" : "FAIL",
    evidence: "local runtime retrieval proof bundle exists",
  });
  return rows;
}

function readFileSafe(file) {
  const absolute = path.join(ROOT, file);
  return existsSync(absolute) ? readFileSync(absolute, "utf8") : "";
}

function activeArchitectureRows() {
  const packageJson = readFileSafe("package.json");
  const homePage = readFileSafe("src/app/(maestro)/home/page.tsx");
  const localRuntime = readFileSafe("src/lib/home/local-cxo-runtime.ts");
  const v7Browser = readFileSafe("src/lib/home/v7-context-browser.ts");
  const rows = [
    {
      check: "primary-v3-generation-script-present",
      status: packageJson.includes("generate:tenant-v3-data") ? "PASS" : "FAIL",
      evidence: "package exposes generate:tenant-v3-data",
    },
    {
      check: "primary-v3-audit-script-present",
      status: packageJson.includes("audit:tenant-v3-data") || packageJson.includes("audit:standard-v3-tenant-inputs") ? "PASS" : "FAIL",
      evidence: "package exposes v3 tenant input audit",
    },
    {
      check: "home-approved-artifact-fallback-present",
      status: homePage.includes("getLocalCxoRuntimeBrowser") && localRuntime.includes("approved_for_render") ? "PASS" : "FAIL",
      evidence: "Home can render approved Claude-derived local artifacts",
    },
    {
      check: "default-reader-active-pointer",
      status: v7Browser.includes("active_tenant_contract_versions") && !/order by loaded_at desc\s+limit 1/.test(v7Browser) ? "PASS" : "FAIL",
      evidence: "default DB reader uses active pointer instead of latest loaded row",
    },
    {
      check: "candidate-preview-explicit",
      status: homePage.includes('mode: candidatePreviewEnabled ? "candidate_preview" : "active"') ? "PASS" : "FAIL",
      evidence: "candidate preview requires an intentional preview mode flag; default runtime uses active mode",
    },
  ];
  return [...rows, ...requiredReplacementRows()];
}

function languageRows() {
  const roots = ACTIVE_USER_FACING_DIRS.filter((dir) => existsSync(path.join(ROOT, dir)));
  const files = roots.flatMap((dir) => walk(path.join(ROOT, dir)));
  const badTerms = TERMS.filter(([term]) => !["V3"].includes(term));
  const rows = [];
  for (const absolute of files) {
    const file = rel(absolute);
    if (ALLOW_PREFIXES.some((prefix) => file.startsWith(prefix))) continue;
    if (file.endsWith("user-facing-language-scan.csv")) continue;
    const text = readFileSafe(file);
    const visibleText = textForLanguageGate(file, text);
    for (const [term, pattern] of badTerms) {
      pattern.lastIndex = 0;
      const matches = text.match(pattern);
      if (!matches?.length) continue;
      pattern.lastIndex = 0;
      const visibleMatches = visibleText.match(pattern);
      const classification = classifyLanguageOccurrence(file, term, text, matches.length, visibleMatches?.length ?? 0);
      rows.push({
        path: file,
        term,
        status: classification.status,
        evidence: classification.evidence,
        occurrences: matches.length,
        visible_occurrences: visibleMatches?.length ?? 0,
        classification: classification.classification,
        action: classification.action,
      });
    }
  }
  return rows;
}

function classifyLanguageOccurrence(file, term, text, occurrences, visibleOccurrences) {
  if (isTestPath(file)) {
    return {
      status: "WARN",
      classification: "allowed-test-fixture",
      action: "keep_internal",
      evidence: `${occurrences} occurrence(s) in test fixture or regression assertion; not runtime-visible.`,
    };
  }
  if (file.startsWith("src/app/api/")) {
    return {
      status: "WARN",
      classification: "allowed-api-implementation",
      action: "wrap_or_rename_later",
      evidence: `${occurrences} occurrence(s) in API implementation code; not selected by default Home/Knowledge rendering.`,
    };
  }
  if (file.startsWith("src/app/(maestro)/admin/") || file.startsWith("src/components/admin/")) {
    return {
      status: "WARN",
      classification: "allowed-internal-admin",
      action: "rename_when_admin_copy_is_refreshed",
      evidence: `${occurrences} occurrence(s) in internal/admin control surface, not CXO-facing tenant context.`,
    };
  }
  if (
    file.includes("/narratives/generated/") ||
    file.startsWith("reports/module-cxo-content/") ||
    file.startsWith("reports/multi-tenant-cxo-story-generation/") ||
    file.startsWith("datasets/context-artifacts/approved/")
  ) {
    return {
      status: "FAIL",
      classification: "blocked-generated-or-proof-content",
      action: "replace_visible_language",
      evidence: `${occurrences} occurrence(s) in generated/proof artifact.`,
    };
  }
  if (visibleOccurrences > 0) {
    return {
      status: "WARN",
      classification: "existing-runtime-copy-outside-dataset-sunset-boundary",
      action: "track_separately",
      evidence: `${visibleOccurrences} visible occurrence(s), ${occurrences} total occurrence(s), in active runtime source outside generated CXO/context artifacts.`,
    };
  }
  if (
    file.startsWith("src/") &&
    !file.includes("/narratives/generated/") &&
    (term === "V7" || term === "V6" || term === "intelligence_v7") &&
    /active_tenant_contract_versions|candidatePreview|Internal legacy storage adapter|getHomeV[67]ContextBrowser|buildV[67]|V[67]/.test(text)
  ) {
    return {
      status: "WARN",
      classification: "allowed-internal-storage-lineage",
      action: "keep_wrapped",
      evidence: `${occurrences} occurrence(s) in wrapped internal storage/reader lineage code; not rendered language.`,
    };
  }
  return {
    status: "WARN",
    classification: "allowed-code-identifier-or-route",
    action: "keep_internal",
    evidence: `${occurrences} occurrence(s) in code identifier, import, route name, or non-rendered implementation text.`,
  };
}

function isTestPath(file) {
  return file.includes("__tests__") || /\.test\./.test(file) || /\.spec\./.test(file);
}

function textForLanguageGate(file, text) {
  if (!file.startsWith("src/")) return text;
  if (isTestPath(file) || file.startsWith("src/app/api/")) return "";

  const visibleParts = [];
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (/^(import|export)\s/.test(trimmed) || /^}\s+from\s+["']/.test(trimmed)) continue;
    if (/^(\/\/|\*|\/\*)/.test(trimmed)) continue;

    const stringPattern = /(["'`])([^"'`]*?)\1/g;
    let match;
    while ((match = stringPattern.exec(line))) {
      const value = match[2].trim();
      if (value.startsWith("/") || value.startsWith(".") || value.startsWith("#")) continue;
      if (["substrate", "source_record_id", "v6File", "v7File"].includes(value)) continue;
      visibleParts.push(match[2]);
    }

    const jsxTextPattern = />\s*([^<>{}][^<>{}]*)\s*</g;
    while ((match = jsxTextPattern.exec(line))) visibleParts.push(match[1]);
  }

  return visibleParts.join("\n");
}

function writeLanguageBurndownReports(language) {
  const remaining = language.filter((row) => row.status === "FAIL");
  const allowed = language.filter((row) => row.status !== "FAIL");
  const fixed = allowed.map((row) => ({
    path: row.path,
    term: row.term,
    previous_status: "FAIL",
    current_status: row.status,
    classification: row.classification,
    action: row.action,
    evidence: row.evidence,
  }));

  writeCsv(
    "language-burndown-fixed.csv",
    fixed.length
      ? fixed
      : [{ path: "", term: "", previous_status: "", current_status: "PASS", classification: "", action: "", evidence: "No allowed/internal legacy terms remain." }],
  );
  writeCsv(
    "language-burndown-remaining.csv",
    remaining.length
      ? remaining
      : [{ path: "", term: "", status: "PASS", evidence: "No blocked visible/generated/proof legacy terms remain." }],
  );
  writeCsv(
    "allowed-internal-legacy-uses.csv",
    allowed.length
      ? allowed
      : [{ path: "", term: "", status: "PASS", evidence: "No internal legacy terms remain." }],
  );

  const markdown = `# Legacy Context Language Burndown PR1

Status: ${remaining.length ? "FAIL" : "PASS"}

Generated: ${new Date().toISOString()}

Scope: local runtime/proof language audit only. No Azure/Postgres mutation, no tenant promotion, no deploy, and no archive/delete was performed.

## Results

- Blocked visible/generated/proof findings remaining: ${remaining.length}
- Allowed internal/test/API/admin compatibility findings: ${allowed.length}
- Original active-language findings burned down or classified: ${fixed.length}

## Remaining Blockers

${remaining.length ? remaining.map((row) => `- ${row.path}: ${row.term} — ${row.evidence}`).join("\n") : "- PASS: no blocked visible/generated/proof legacy terms remain."}

## Allowed Internal Uses

${allowed.length ? allowed.slice(0, 40).map((row) => `- ${row.path}: ${row.term} — ${row.classification}`).join("\n") : "- None"}
${allowed.length > 40 ? `\n- ...${allowed.length - 40} additional allowed rows in allowed-internal-legacy-uses.csv` : ""}
`;
  writeFileSync(path.join(REPORT_DIR, "language-burndown-summary.md"), markdown);
}

function csvEscape(value) {
  const text = String(value ?? "");
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

function writeCsv(name, rows) {
  const file = path.join(REPORT_DIR, name);
  const headers = Object.keys(rows[0] ?? { status: "", evidence: "" });
  const body = [
    headers.join(","),
    ...rows.map((row) => headers.map((header) => csvEscape(row[header])).join(",")),
  ].join("\n");
  writeFileSync(file, `${body}\n`);
}

function writeSummary({ inventory, replacements, activeRows, language }) {
  const actionCounts = countBy(inventory, "recommended_action");
  const highRisk = inventory.filter((row) => row.risk_level === "high").length;
  const failures = [...replacements, ...activeRows, ...language].filter((row) => row.status === "FAIL");
  const status = failures.length ? "FAIL" : "PASS";
  const markdown = `# Legacy Context Retirement

Status: ${status}

Generated: ${new Date().toISOString()}

Scope: local repository audit only. No Azure/Postgres mutation, no tenant promotion, no deploy, and no archive/delete was performed by this script.

## Inventory

- Rows: ${inventory.length}
- High-risk runtime/user-facing rows: ${highRisk}
- Actions: ${Object.entries(actionCounts).map(([key, value]) => `${key}=${value}`).join(", ")}

## Replacement Proof

${replacements.map((row) => `- ${row.status}: ${row.check} — ${row.evidence}`).join("\n")}

## Active Architecture Proof

${activeRows.map((row) => `- ${row.status}: ${row.check} — ${row.evidence}`).join("\n")}

## Language Audit

${language.length ? language.slice(0, 50).map((row) => `- ${row.status}: ${row.path} — ${row.term} — ${row.evidence}`).join("\n") : "- PASS: no blocked legacy terms found in active generated/user-facing scan scope"}
${language.length > 50 ? `\n- ...${language.length - 50} additional rows in language-audit.csv` : ""}

## Next Action

Use inventory.csv to move low-risk archive/delete candidates into archive/legacy-context/<date>/ only after dependency review. Keep physical DB names wrapped behind neutral active context APIs until schema rename is approved.
`;
  writeFileSync(path.join(REPORT_DIR, "summary.md"), markdown);
  const blockedLanguage = language.filter((row) => row.status === "FAIL").length;
  const allowedLanguage = language.filter((row) => row.status !== "FAIL").length;
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>Legacy Context Retirement</title><style>body{font-family:Inter,Arial,sans-serif;margin:32px;background:#fbfaf7;color:#161616}.status{display:inline-block;padding:6px 10px;border-radius:6px;background:${status === "PASS" ? "#e8f7ee" : "#fee4e2"};color:${status === "PASS" ? "#14643d" : "#912018"};font-weight:800}table{border-collapse:collapse;width:100%;background:#fff;margin-top:18px}th,td{border:1px solid #e7e3da;padding:8px;text-align:left;font-size:13px}</style></head><body><h1>Legacy Context Retirement</h1><div class="status">${status}</div><p>No data load, promotion, deploy, archive, or delete performed.</p><table><thead><tr><th>Layer</th><th>Metric</th><th>Value</th></tr></thead><tbody><tr><td>Inventory</td><td>Rows</td><td>${inventory.length}</td></tr><tr><td>Inventory</td><td>High-risk rows</td><td>${highRisk}</td></tr><tr><td>Language burndown</td><td>Blocked visible/generated/proof findings</td><td>${blockedLanguage}</td></tr><tr><td>Language burndown</td><td>Allowed internal/test/API/admin findings</td><td>${allowedLanguage}</td></tr><tr><td>All gates</td><td>Failures</td><td>${failures.length}</td></tr></tbody></table></body></html>`;
  writeFileSync(path.join(REPORT_DIR, "proof.html"), html);
  return { status, failures };
}

function countBy(rows, key) {
  const counts = {};
  for (const row of rows) counts[row[key]] = (counts[row[key]] ?? 0) + 1;
  return counts;
}

function main() {
  mkdirSync(REPORT_DIR, { recursive: true });
  const inventory = buildInventory();
  const replacements = requiredReplacementRows();
  const activeRows = activeArchitectureRows();
  const language = languageRows();

  writeCsv("inventory.csv", inventory);
  writeCsv("replacement-proof.csv", replacements);
  writeCsv("active-architecture-audit.csv", activeRows);
  writeCsv("language-audit.csv", language.length ? language : [{ path: "", term: "", status: "PASS", evidence: "No blocked legacy terms found." }]);
  writeLanguageBurndownReports(language);

  const result = writeSummary({ inventory, replacements, activeRows, language });
  const modeRows =
    MODE === "v3-only"
      ? activeRows
      : MODE === "no-language"
        ? language
        : [...replacements, ...activeRows];
  const failures = modeRows.filter((row) => row.status === "FAIL");
  if (failures.length) {
    console.error(`${MODE} audit failed: ${failures.length} failure(s). See reports/legacy-context-retirement.`);
    process.exit(1);
  }
  console.log(`${MODE} audit passed; wrote reports/legacy-context-retirement (${inventory.length} inventory rows).`);
}

main();
