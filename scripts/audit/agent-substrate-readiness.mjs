#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const args = new Set(process.argv.slice(2));
const strict = args.has("--strict");
const json = args.has("--json");

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

function exists(relativePath) {
  return fs.existsSync(path.join(root, relativePath));
}

const findings = [];

function finding(severity, id, detail, evidence = []) {
  findings.push({ severity, id, detail, evidence });
}

function pass(id, detail, evidence = []) {
  finding("pass", id, detail, evidence);
}

function warn(id, detail, evidence = []) {
  finding("warn", id, detail, evidence);
}

function critical(id, detail, evidence = []) {
  finding("critical", id, detail, evidence);
}

function countJsonlLines(relativePath) {
  if (!exists(relativePath)) return 0;
  return read(relativePath)
    .split(/\r?\n/)
    .filter((line) => line.trim()).length;
}

const contractPath = "docs/architecture/agent-substrate-contract.json";
if (!exists(contractPath)) {
  critical("contract_missing", `${contractPath} is missing.`);
} else {
  pass("contract_present", `${contractPath} is present.`);
}

const contract = exists(contractPath)
  ? JSON.parse(read(contractPath))
  : { requiredMigrations: [], v4DatasetRequirements: {} };

for (const migration of contract.requiredMigrations ?? []) {
  if (!exists(migration.path)) {
    critical("migration_missing", `${migration.path} is missing.`);
    continue;
  }
  const body = read(migration.path);
  const missingTerms = (migration.mustContain ?? []).filter(
    (term) => !body.includes(term),
  );
  if (missingTerms.length > 0) {
    critical(
      "migration_contract_drift",
      `${migration.path} is missing required substrate terms: ${missingTerms.join(", ")}.`,
      [migration.path],
    );
  } else {
    pass("migration_contract_ok", `${migration.path} contains required substrate terms.`, [
      migration.path,
    ]);
  }
}

const homePagePath = "src/app/(maestro)/home/page.tsx";
const homeSurfacePath = "src/components/home/HomeSurface.tsx";
const homeAskPath = "src/components/home/know/HomeKnowAsk.tsx";
const homeContractPath = "src/lib/home/know/home-know-contract.ts";
const homeEnginePath = "src/lib/home/know/home-know-engine.ts";
const retiredHomeV2Paths = [
  "src/app/api/home/v2-frame/route.ts",
  "src/app/api/home/v2-data/route.ts",
  "src/lib/home-v2/data.ts",
  "public/home-v2",
];

for (const retiredPath of retiredHomeV2Paths) {
  if (exists(retiredPath)) {
    critical(
      "legacy_home_v2_runtime_present",
      `${retiredPath} still exists. Home KNOW must not have a static Home v2 fallback path.`,
      [retiredPath],
    );
  }
}
if (retiredHomeV2Paths.every((retiredPath) => !exists(retiredPath))) {
  pass("legacy_home_v2_runtime_retired", "Static Home v2 frame/data/assets are absent from runtime.");
}

for (const requiredPath of [homePagePath, homeSurfacePath, homeAskPath, homeContractPath, homeEnginePath]) {
  if (!exists(requiredPath)) {
    critical("home_know_file_missing", `${requiredPath} is missing.`);
  }
}

if (exists(homePagePath)) {
  const pageSource = read(homePagePath);
  if (pageSource.includes("v2-frame") || pageSource.includes("<iframe")) {
    critical("home_page_legacy_frame_reference", "/home still references the legacy frame route or iframe.", [
      homePagePath,
    ]);
  } else if (pageSource.includes("<HomeSurface")) {
    pass("home_page_uses_react_home_surface", "/home mounts the React HomeSurface directly.");
  }
}

if (exists(homeAskPath)) {
  const askSource = read(homeAskPath);
  if (askSource.includes("/api/home/know/ask") && !askSource.includes("/api/intelligence/ask")) {
    pass("home_ask_uses_home_know_endpoint", "Home ask uses the Home KNOW endpoint, not Intelligence ask.");
  } else {
    critical("home_ask_endpoint_drift", "Home ask must post to /api/home/know/ask only.", [homeAskPath]);
  }
  if (askSource.includes("answerForAsk") || askSource.includes("bestAskFacts")) {
    critical("home_browser_answer_logic_detected", "Browser-side Home answer assembly has returned.", [
      homeAskPath,
    ]);
  } else {
    pass("home_browser_answer_logic_absent", "Home browser code does not own answer assembly.");
  }
}

if (exists(homeContractPath) && exists(homeEnginePath)) {
  const contractSource = read(homeContractPath);
  const engineSource = read(homeEnginePath);
  const contractTerms = [
    "HomeKnowResponse",
    "tables",
    "charts",
    "graphs",
    "citations",
    "gaps",
    "safety",
  ];
  const missingTerms = contractTerms.filter((term) => !contractSource.includes(term));
  if (missingTerms.length > 0) {
    critical("home_know_contract_incomplete", `HomeKnowResponse contract missing: ${missingTerms.join(", ")}.`, [
      homeContractPath,
    ]);
  } else {
    pass("home_know_contract_present", "HomeKnowResponse owns tables, charts, graphs, citations, gaps, and safety.");
  }
  if (engineSource.includes("templatePrefix") && !engineSource.includes("Read: I can't give that exact value")) {
    pass("home_know_prose_template_guard", "Home KNOW strips mechanical Read/Evidence template prefixes.");
  } else {
    warn("home_know_prose_template_guard_missing", "Home KNOW should strip mechanical prose prefixes.", [
      homeEnginePath,
    ]);
  }
}

const evalRoot = "datasets/evals";
if (!exists(evalRoot)) {
  warn("agent_eval_root_missing", `${evalRoot} is missing.`);
} else {
  const evalDirs = fs
    .readdirSync(path.join(root, evalRoot), { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => path.join(evalRoot, entry.name));
  const evalCases = evalDirs
    .map((dir) => ({
      dir,
      cases: countJsonlLines(path.join(dir, "expert-eval-cases.jsonl")),
    }))
    .filter((entry) => entry.cases > 0);
  if (evalCases.length === 0) {
    warn("agent_eval_cases_missing", "No expert eval cases were found under datasets/evals.");
  } else {
    pass(
      "agent_eval_cases_present",
      `Found expert eval cases for ${evalCases.length} eval dataset(s): ${evalCases.map((entry) => `${entry.dir}=${entry.cases}`).join(", ")}.`,
      evalCases.map((entry) => entry.dir),
    );
  }
  warn(
    "agent_eval_all_client_gate_incomplete",
    "Expert evals are present, but this audit does not yet prove all Home clients and all dimensions have signed-in answer eval coverage.",
    [evalRoot],
  );
}

warn(
  "live_database_and_signed_in_proof_not_run",
  "This audit is repo-local. It does not prove Azure/Postgres committed rows, search index freshness, or signed-in browser answer quality.",
);

const totals = findings.reduce(
  (acc, item) => {
    acc[item.severity] = (acc[item.severity] ?? 0) + 1;
    return acc;
  },
  { pass: 0, warn: 0, critical: 0 },
);

if (json) {
  console.log(JSON.stringify({ totals, findings }, null, 2));
} else {
  console.log("Agent substrate readiness audit");
  console.log(`pass=${totals.pass} warn=${totals.warn} critical=${totals.critical}`);
  for (const item of findings) {
    const label = item.severity.toUpperCase().padEnd(8);
    console.log(`${label} ${item.id}: ${item.detail}`);
  }
}

if (totals.critical > 0 || (strict && totals.warn > 0)) {
  process.exit(1);
}
