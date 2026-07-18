#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const repoRoot = process.cwd();
const allowedTenants = ["first-capital-financial", "skyharbor-air"];

function arg(name, fallback = "") {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : fallback;
}

function tenant() {
  const value = arg("--tenant");
  if (!allowedTenants.includes(value)) throw new Error(`--tenant must be one of ${allowedTenants.join(", ")}`);
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

function writeText(filePath, text) {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, text);
}

function check(condition, name, expected, observed, detail = "") {
  return { check: name, expected, observed, status: condition ? "pass" : "fail", detail };
}

function run() {
  const tenantKey = tenant();
  const manifest = readJson(`datasets/tenant-inputs/generated/${tenantKey}/rich-synthetic-2026-07-v3/tenant-generation-manifest.json`);
  const derivedRoot = `datasets/tenant-inputs/generated/${tenantKey}/rich-synthetic-2026-07-v3`;
  const sourceRoot = `datasets/tenant-inputs/candidates/${tenantKey}/rich-synthetic-2026-07-v3`;
  const canonicalRecords = readJson(`${derivedRoot}/canonical-records.json`);
  const canonicalFacts = readJson(`${derivedRoot}/canonical-facts.json`);
  const evidence = readJson(`${derivedRoot}/evidence-registry.json`);
  const graphNodes = readJson(`${derivedRoot}/graph-nodes.json`);
  const graphEdges = readJson(`${derivedRoot}/graph-edges.json`);
  const gaps = readJson(`${derivedRoot}/context-gaps.json`);
  const chunks = readJson(`${derivedRoot}/retrieval-chunks.json`);
  const home = readJson(`${derivedRoot}/home-context-view.json`);
  const tower = readJson(`${derivedRoot}/tower-dashboard-view.json`);
  const moves = readJson(`${derivedRoot}/moves-context-view.json`);
  const source = readJson(`${derivedRoot}/source-context-view.json`);
  const records = new Set(canonicalRecords.map((row) => row.record_key));
  const nodes = new Set(graphNodes.map((row) => row.node_key));
  const factEvidenceMissing = canonicalFacts.filter((row) => !row.evidence_id);
  const orphanFacts = canonicalFacts.filter((row) => !records.has(row.record_key));
  const orphanEdges = graphEdges.filter((row) => !nodes.has(row.from_node_key) || !nodes.has(row.to_node_key));
  const defaultVisibleChunks = chunks.filter((row) => row.default_runtime_visible !== false || row.retrieval_scope !== "candidate_preview_only");
  const sourceFiles = fs.readdirSync(path.join(repoRoot, sourceRoot)).filter((file) => file.endsWith(".csv"));
  const checks = [
    check(sourceFiles.length === 19, "source template file count", 19, sourceFiles.length),
    check(manifest.counts.source_template_rows >= 4000, "source row threshold", ">=4000", manifest.counts.source_template_rows),
    check(canonicalRecords.length === manifest.counts.canonical_records, "canonical records manifest match", manifest.counts.canonical_records, canonicalRecords.length),
    check(canonicalFacts.length === manifest.counts.canonical_facts, "canonical facts manifest match", manifest.counts.canonical_facts, canonicalFacts.length),
    check(factEvidenceMissing.length === 0, "facts have evidence ids", 0, factEvidenceMissing.length),
    check(orphanFacts.length === 0, "no orphan canonical facts", 0, orphanFacts.length),
    check(evidence.length === manifest.counts.evidence_references, "evidence registry count", manifest.counts.evidence_references, evidence.length),
    check(graphNodes.length >= 1500, "graph node threshold", ">=1500", graphNodes.length),
    check(graphEdges.length >= 2500, "graph edge threshold", ">=2500", graphEdges.length),
    check(orphanEdges.length === 0, "no orphan graph edges", 0, orphanEdges.length),
    check(gaps.length >= 2000, "gap threshold", ">=2000", gaps.length),
    check(chunks.length >= 4000, "retrieval chunk threshold", ">=4000", chunks.length),
    check(defaultVisibleChunks.length === 0, "retrieval chunks candidate-preview only", 0, defaultVisibleChunks.length),
    check(home.length === 19, "Home dimensions", 19, home.length),
    check(tower.approved_programs.length === 12, "Tower approved programs", 12, tower.approved_programs.length),
    check(tower.candidate_ai_opportunities.length === 12, "Tower candidate AI opportunities", 12, tower.candidate_ai_opportunities.length),
    check(moves.length === 12, "Moves candidate opportunities", 12, moves.length),
    check(source.length === 12, "Source vendor contexts", 12, source.length),
    check(manifest.boundaries.azure_postgres_mutated === false, "no Azure/Postgres mutation", false, manifest.boundaries.azure_postgres_mutated),
    check(manifest.boundaries.active_pointer_updated === false, "no active pointer update", false, manifest.boundaries.active_pointer_updated),
  ];
  const outDir = path.join(repoRoot, "reports", `${tenantKey}-azure-persistence`);
  ensureDir(outDir);
  writeCsv(path.join(outDir, "local-reconciliation-checks.csv"), ["tenant_key", "check", "expected", "observed", "status", "detail"], checks.map((row) => ({ tenant_key: tenantKey, ...row })));
  writeText(path.join(outDir, "reconciliation-summary.md"), `# ${tenantKey} Local Data-Plane Reconciliation

Status: ${checks.every((row) => row.status === "pass") ? "PASS" : "FAIL"}

This reconciles generated local candidate artifacts before any Azure/Postgres write. It does not prove persisted database rows or page/API consumption from the data plane.

${checks.map((row) => `- ${row.check}: ${row.status} (${row.observed} observed, ${row.expected} expected)`).join("\n")}
`);
  const failures = checks.filter((row) => row.status !== "pass");
  if (failures.length > 0) {
    console.error(`Reconciliation failed with ${failures.length} failure(s)`);
    for (const failure of failures) console.error(`- ${failure.check}: expected ${failure.expected}, observed ${failure.observed}`);
    process.exit(1);
  }
  console.log(JSON.stringify({ status: "pass", tenant_key: tenantKey, checks: checks.length }, null, 2));
}

run();
