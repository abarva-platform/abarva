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

function relativeExists(base, relativePath) {
  return fs.existsSync(path.join(root, base, relativePath));
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

function parseHomeClientPacks(homeSource) {
  const packs = [];
  const regex =
    /key:\s*'([^']+)'[\s\S]*?datasetDir:\s*'([^']+)'[\s\S]*?tenantName:\s*'([^']+)'[\s\S]*?format:\s*'([^']+)'/g;
  for (const match of homeSource.matchAll(regex)) {
    packs.push({
      key: match[1],
      datasetDir: match[2],
      tenantName: match[3],
      format: match[4],
    });
  }
  return packs;
}

function parseHomeSections(homeSource) {
  const sections = [];
  const regex = /id:\s*'([^']+)'[\s\S]*?nav:\s*'([^']+)'[\s\S]*?v4File:\s*'([^']+)'/g;
  for (const match of homeSource.matchAll(regex)) {
    sections.push({
      id: match[1],
      nav: match[2],
      v4File: match[3],
    });
  }
  return sections;
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

const homePath = "src/lib/home-v2/data.ts";
if (!exists(homePath)) {
  critical("home_v2_binding_missing", `${homePath} is missing.`);
} else {
  const homeSource = read(homePath);
  const packs = parseHomeClientPacks(homeSource);
  const sections = parseHomeSections(homeSource);

  if (packs.length === 0) {
    critical("home_v2_client_packs_empty", "No Home v2 client packs were parsed.");
  } else {
    pass("home_v2_client_packs_present", `Parsed ${packs.length} Home v2 client packs.`);
  }

  if (sections.length < contract.currentHomeDimensionCount) {
    critical(
      "home_v2_dimension_contract_short",
      `Parsed ${sections.length} Home v2 dimensions, expected at least ${contract.currentHomeDimensionCount}.`,
    );
  } else {
    pass("home_v2_dimension_contract_present", `Parsed ${sections.length} Home v2 dimensions.`);
  }

  warn(
    "home_v2_dimension_registry_not_durable",
    "Home v2 dimensions are still hardcoded in src/lib/home-v2/data.ts; the 20th dimension requires registry pushdown before it is data-plane-native.",
    [homePath],
  );

  const v4Packs = packs.filter((pack) => pack.format === "v4");
  const requiredPackFiles = contract.v4DatasetRequirements?.requiredFiles ?? [];
  const requiredTowerFiles =
    contract.v4DatasetRequirements?.requiredAiControlTowerFiles ?? [];

  for (const pack of v4Packs) {
    const datasetRoot = path.join("datasets", pack.datasetDir);
    if (!exists(datasetRoot)) {
      critical("v4_dataset_missing", `${pack.key} dataset root is missing: ${datasetRoot}.`);
      continue;
    }

    const missingPackFiles = requiredPackFiles.filter(
      (file) => !relativeExists(datasetRoot, file),
    );
    if (missingPackFiles.length > 0) {
      critical(
        "v4_dataset_required_file_missing",
        `${pack.key} is missing required dataset files: ${missingPackFiles.join(", ")}.`,
        [datasetRoot],
      );
    } else {
      pass("v4_dataset_required_files_ok", `${pack.key} has manifest, row-count receipt, and graph file.`, [
        datasetRoot,
      ]);
    }

    const missingDimensionFiles = sections
      .map((section) => section.v4File)
      .filter((file) => !relativeExists(datasetRoot, file));
    if (missingDimensionFiles.length > 0) {
      critical(
        "v4_dataset_dimension_file_missing",
        `${pack.key} is missing Home dimension files: ${missingDimensionFiles.join(", ")}.`,
        [datasetRoot],
      );
    } else {
      pass(
        "v4_dataset_dimension_files_ok",
        `${pack.key} has all ${sections.length} Home v2 dimension files.`,
        [datasetRoot],
      );
    }

    const missingTowerFiles = requiredTowerFiles.filter(
      (file) => !relativeExists(datasetRoot, file),
    );
    if (missingTowerFiles.length > 0) {
      warn(
        "v4_dataset_tower_depth_partial",
        `${pack.key} is missing AI Control Tower depth files: ${missingTowerFiles.join(", ")}.`,
        [datasetRoot],
      );
    } else {
      pass(
        "v4_dataset_tower_depth_ok",
        `${pack.key} has the full T00-T13 AI Control Tower file set.`,
        [datasetRoot],
      );
    }

    const edgeCount = countJsonlLines(path.join(datasetRoot, "graph/context-relationships.jsonl"));
    if (edgeCount === 0) {
      critical(
        "v4_dataset_relationship_graph_empty",
        `${pack.key} has no relationship edges in graph/context-relationships.jsonl.`,
        [datasetRoot],
      );
    } else {
      pass("v4_dataset_relationship_graph_ok", `${pack.key} has ${edgeCount} relationship edges.`);
    }
  }
}

const browserPath = "public/home-v2/app.js";
if (!exists(browserPath)) {
  critical("home_v2_browser_bundle_missing", `${browserPath} is missing.`);
} else {
  const browserSource = read(browserPath);
  const browserOwnsAnswerLogic =
    browserSource.includes("function answerForAsk") ||
    browserSource.includes("function bestAskFacts") ||
    browserSource.includes("const WEIGHTS");
  const browserOwnsDatasetTruth =
    /datasets\/|datasetDir|manifest\.yaml|expected-row-counts/.test(browserSource);

  if (browserOwnsDatasetTruth) {
    critical(
      "browser_dataset_truth_detected",
      "Browser JS contains dataset/source truth references. Dataset truth must stay server/repo-side.",
      [browserPath],
    );
  } else {
    pass("browser_dataset_truth_absent", "Browser JS does not contain dataset-root or manifest truth.");
  }

  if (browserOwnsAnswerLogic) {
    warn(
      "browser_answer_logic_pushdown_required",
      "Home v2 browser JS still owns ask routing, ranking, weighting, or answer assembly. Push this behind a server/database-owned answer endpoint before claiming agent-grade answers.",
      [browserPath],
    );
  } else {
    pass("browser_answer_logic_pushed_down", "Home v2 browser JS does not own answer-ranking logic.");
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
