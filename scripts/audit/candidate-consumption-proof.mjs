#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const repoRoot = process.cwd();
const tenants = ["first-capital-financial", "skyharbor-air"];
const moduleModes = new Set(["home", "tower", "intelligence", "moves", "source"]);

function arg(name, fallback = "") {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : fallback;
}

function selectedTenant() {
  const tenant = arg("--tenant");
  if (!tenants.includes(tenant)) throw new Error(`--tenant must be one of ${tenants.join(", ")}`);
  return tenant;
}

function mode() {
  const value = arg("--mode", "home");
  if (!moduleModes.has(value)) throw new Error(`--mode must be one of ${[...moduleModes].join(", ")}`);
  return value;
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(repoRoot, relativePath), "utf8"));
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

function proofRowsFor(tenantKey, selectedMode) {
  const root = `datasets/tenant-inputs/generated/${tenantKey}/rich-synthetic-2026-07-v3`;
  const manifest = readJson(`${root}/tenant-generation-manifest.json`);
  const rows = [];
  function add(check, status, detail) {
    rows.push({ tenant_key: tenantKey, mode: selectedMode, check, status, detail });
  }
  if (selectedMode === "home") {
    const home = readJson(`${root}/home-context-view.json`);
    const renderPack = readJson(`${root}/render-pack.json`);
    add("19 Home dimensions load", home.length === 19 ? "pass" : "fail", `${home.length} dimensions`);
    add("Data tabs deterministic", home.every((row) => row.generation_method.includes("deterministic")) ? "pass" : "fail", "generation_method checked");
    add("Evidence refs resolve", home.every((row) => Array.isArray(row.evidence_refs) && row.evidence_refs.length > 0) ? "pass" : "fail", "dimension evidence refs checked");
    add("Candidate preview only", renderPack.default_runtime_visible === false ? "pass" : "fail", "render pack default visibility checked");
  }
  if (selectedMode === "tower") {
    const tower = readJson(`${root}/tower-dashboard-view.json`);
    add("Executive Command context exists", tower.budget_posture && tower.decision_lanes ? "pass" : "fail", "budget posture and lanes checked");
    add("Approved programs count", tower.approved_programs.length === 12 ? "pass" : "fail", `${tower.approved_programs.length} programs`);
    add("Candidate AI count", tower.candidate_ai_opportunities.length === 12 ? "pass" : "fail", `${tower.candidate_ai_opportunities.length} AI opportunities`);
    add("Value proof ladder blocks realized claims", tower.value_proof_ladder.includes("not realized") ? "pass" : "fail", tower.value_proof_ladder.join("; "));
  }
  if (selectedMode === "intelligence") {
    const chunks = readJson(`${root}/retrieval-chunks.json`);
    add("Candidate chunks exist", chunks.length >= 4000 ? "pass" : "fail", `${chunks.length} chunks`);
    add("Candidate retrieval scope only", chunks.every((row) => row.retrieval_scope === "candidate_preview_only") ? "pass" : "fail", "retrieval_scope checked");
    add("Default active retrieval excluded", chunks.every((row) => row.default_runtime_visible === false) ? "pass" : "fail", "default_runtime_visible checked");
    add("Chunk lineage exists", chunks.every((row) => row.fact_key && row.evidence_id) ? "pass" : "fail", "fact/evidence lineage checked");
  }
  if (selectedMode === "moves") {
    const moves = readJson(`${root}/moves-context-view.json`);
    add("Moves candidate opportunities exist", moves.length === 12 ? "pass" : "fail", `${moves.length} moves`);
    add("No active execution commitments", moves.every((row) => row.active_execution_commitment === false) ? "pass" : "fail", "active_execution_commitment checked");
    add("Phase gates reflect gaps", moves.every((row) => row.evidence_requirements) ? "pass" : "fail", "evidence requirements checked");
  }
  if (selectedMode === "source") {
    const source = readJson(`${root}/source-context-view.json`);
    add("Source vendor contexts exist", source.length === 12 ? "pass" : "fail", `${source.length} source contexts`);
    add("No savings claim allowed", source.every((row) => row.savings_claim_allowed === false) ? "pass" : "fail", "savings claim boundary checked");
    add("Contract/SLA/invoice evidence requested", source.every((row) => /contract, SLA, invoice/i.test(row.evidence_required)) ? "pass" : "fail", "evidence_required checked");
  }
  add("Azure/Postgres not mutated", manifest.boundaries.azure_postgres_mutated === false ? "pass" : "fail", "manifest boundary checked");
  return rows;
}

function run() {
  const tenantKey = selectedTenant();
  const selectedMode = mode();
  const rows = proofRowsFor(tenantKey, selectedMode);
  const outDir = path.join(repoRoot, "reports", `${tenantKey}-azure-persistence`);
  writeCsv(path.join(outDir, `${selectedMode}-candidate-consumption.csv`), Object.keys(rows[0]), rows);
  const failures = rows.filter((row) => row.status !== "pass");
  if (failures.length > 0) {
    console.error(`${selectedMode} candidate consumption proof failed`);
    for (const failure of failures) console.error(`- ${failure.check}: ${failure.detail}`);
    process.exit(1);
  }
  console.log(JSON.stringify({ status: "pass", tenant_key: tenantKey, mode: selectedMode, checks: rows.length }, null, 2));
}

run();
