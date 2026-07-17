#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const repoRoot = process.cwd();
const tenantKey = "meridian-health";
const tenantDir = path.join(repoRoot, "datasets/tenant-inputs", tenantKey);
const derivedDir = path.join(tenantDir, "derived");
const approvedDir = path.join(tenantDir, "approved-content");
const reportDir = path.join(repoRoot, "reports/meridian-v3-derived-and-claude-layer");
const scope = process.argv.includes("--scope") ? process.argv[process.argv.indexOf("--scope") + 1] : "all";
const failures = [];
const warnings = [];

function fail(message) {
  failures.push(message);
}

function warn(message) {
  warnings.push(message);
}

function readJson(relativePath) {
  const full = path.join(repoRoot, relativePath);
  if (!fs.existsSync(full)) {
    fail(`Missing required JSON artifact: ${relativePath}`);
    return null;
  }
  try {
    return JSON.parse(fs.readFileSync(full, "utf8"));
  } catch (error) {
    fail(`Invalid JSON in ${relativePath}: ${error.message}`);
    return null;
  }
}

function listFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  return entries.flatMap((entry) => {
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? listFiles(full) : [full];
  });
}

function collectTextFields(value, out = []) {
  if (Array.isArray(value)) {
    for (const item of value) collectTextFields(item, out);
  } else if (value && typeof value === "object") {
    for (const [key, item] of Object.entries(value)) {
      if (
        [
          "title",
          "executive_summary",
          "business_meaning",
          "what_context_reveals",
          "why_it_matters",
          "evidence_boundary",
          "recommended_next_action",
          "financial_posture",
          "measurement_posture",
          "value_claim_boundary",
          "cio_implication",
          "cfo_implication",
          "business_question",
          "data_requirements",
          "safety_notes",
        ].includes(key) &&
        typeof item === "string"
      ) {
        out.push({ key, text: item });
      } else {
        collectTextFields(item, out);
      }
    }
  }
  return out;
}

function approx(actual, expected, label) {
  if (Math.abs(Number(actual) - expected) > 0.01) {
    fail(`${label} expected ${expected} but found ${actual}`);
  }
}

function requireFields(object, fields, label) {
  for (const field of fields) {
    if (!(field in object)) fail(`${label} missing required field ${field}`);
  }
}

const artifacts = {
  evidenceRegistry: readJson("datasets/tenant-inputs/meridian-health/derived/evidence-registry.json") ?? [],
  canonicalFacts: readJson("datasets/tenant-inputs/meridian-health/derived/canonical-facts.json") ?? [],
  entityProfiles: readJson("datasets/tenant-inputs/meridian-health/derived/entity-profiles.json") ?? [],
  relationshipGraph: readJson("datasets/tenant-inputs/meridian-health/derived/relationship-graph.json") ?? { nodes: [], edges: [] },
  contextGaps: readJson("datasets/tenant-inputs/meridian-health/derived/context-gaps.json") ?? [],
  businessUnitMap: readJson("datasets/tenant-inputs/meridian-health/derived/ai-use-case-business-unit-map.json") ?? [],
  homeContext: readJson("datasets/tenant-inputs/meridian-health/derived/module-context/home-context-view.json") ?? {},
  towerView: readJson("datasets/tenant-inputs/meridian-health/derived/module-context/tower-dashboard-view.json") ?? {},
  sa08Posture: readJson("datasets/tenant-inputs/meridian-health/derived/module-context/sa08-benefits-posture.json") ?? {},
  homeStories: readJson("datasets/tenant-inputs/meridian-health/approved-content/home/story-blocks.json") ?? [],
  homeVisuals: readJson("datasets/tenant-inputs/meridian-health/approved-content/home/visual-specs.json") ?? [],
  towerStories: readJson("datasets/tenant-inputs/meridian-health/approved-content/tower/story-blocks.json") ?? [],
  towerVisuals: readJson("datasets/tenant-inputs/meridian-health/approved-content/tower/visual-specs.json") ?? [],
};

const factIds = new Set(artifacts.canonicalFacts.map((fact) => fact.fact_id));
const evidenceIds = new Set(artifacts.evidenceRegistry.map((entry) => entry.evidence_id));
const gapIds = new Set(artifacts.contextGaps.map((gap) => gap.gap_id));

if (scope === "all" || scope === "derived") {
  for (const entry of artifacts.evidenceRegistry) {
    if (entry.tenant_key !== tenantKey) fail(`Evidence registry entry has wrong tenant: ${entry.registry_id}`);
    if (!entry.resolved) fail(`Unresolved evidence id: ${entry.evidence_id} from ${entry.source_file}`);
  }

  for (const fact of artifacts.canonicalFacts) {
    requireFields(
      fact.governed_object ?? {},
      ["id", "tenant_id", "client_key", "object_type", "source_layer", "source_basis", "provenance", "agent_readiness_status", "retrievability", "confidence_level"],
      `GovernedObject ${fact.fact_id}`,
    );
    if (fact.tenant_key !== tenantKey || fact.governed_object?.tenant_id !== tenantKey) {
      fail(`Fact tenant mismatch: ${fact.fact_id}`);
    }
    if (fact.evidence_id && !evidenceIds.has(fact.evidence_id)) {
      fail(`Fact ${fact.fact_id} references missing evidence ${fact.evidence_id}`);
    }
  }

  if (!artifacts.businessUnitMap.length) fail("AI use-case business-unit mapping is empty");
  for (const row of artifacts.businessUnitMap) {
    if (!row.derived_business_unit) fail(`AI use-case ${row.record_id} missing derived_business_unit`);
    if (row.review_status !== "derived_mapping_reviewable") fail(`AI use-case ${row.record_id} mapping is not reviewable`);
  }
}

if (scope === "all" || scope === "tower") {
  approx(artifacts.towerView.budget_posture?.total_budget_usd, 650_000_000, "Tower total FY26 budget");
  approx(artifacts.towerView.budget_posture?.run_budget_usd, 487_500_000, "Tower run budget");
  approx(artifacts.towerView.budget_posture?.change_budget_usd, 162_500_000, "Tower change budget");
  approx(artifacts.towerView.ai_spend_lens?.ai_tagged_spend_usd, 53_700_000, "AI-tagged spend lens");
  if (artifacts.towerView.ai_spend_lens?.additive_status !== "non_additive_lens") {
    fail("AI-tagged spend lens is not marked non_additive_lens");
  }
  if (!/not loaded/i.test(String(artifacts.towerView.caveat ?? ""))) {
    fail("TowerDashboardView caveat must state the artifact is not loaded to runtime");
  }
}

if (scope === "all" || scope === "sa08") {
  if (!artifacts.sa08Posture.claims?.length) fail("SA08 claims are missing");
  for (const claim of artifacts.sa08Posture.claims ?? []) {
    for (const field of ["usage_validation_status", "kpi_validation_status", "finance_validation_status", "value_claim_status"]) {
      if (!claim[field]) fail(`SA08 claim ${claim.claim_id} missing derived ${field}`);
    }
    if (claim.promised_value_usd > 0 && claim.claimable && claim.finance_validated_value_usd <= 0) {
      fail(`SA08 claim ${claim.claim_id} is claimable without finance validation`);
    }
  }
}

function validateRefs(collection, label) {
  for (const item of collection) {
    for (const factId of item.source_fact_ids ?? []) {
      if (!factIds.has(factId)) fail(`${label} ${item.story_block_id ?? item.visual_spec_id} references missing fact ${factId}`);
    }
    for (const factId of item.tower_fact_ids ?? []) {
      if (!factIds.has(factId)) fail(`${label} ${item.visual_spec_id} references missing tower fact ${factId}`);
    }
    for (const factId of item.tower_budget_fact_ids ?? []) {
      if (!factIds.has(factId)) fail(`${label} ${item.story_block_id} references missing tower budget fact ${factId}`);
    }
    for (const factId of item.tower_program_fact_ids ?? []) {
      if (!factIds.has(factId)) fail(`${label} ${item.story_block_id} references missing tower program fact ${factId}`);
    }
    for (const factId of item.tower_metric_fact_ids ?? []) {
      if (!factIds.has(factId)) fail(`${label} ${item.story_block_id} references missing tower metric fact ${factId}`);
    }
    for (const evidenceId of item.evidence_ids ?? []) {
      if (!evidenceIds.has(evidenceId)) fail(`${label} ${item.story_block_id ?? item.visual_spec_id} references missing evidence ${evidenceId}`);
    }
    for (const gapId of item.gap_ids ?? []) {
      if (!gapIds.has(gapId)) fail(`${label} ${item.story_block_id} references missing gap ${gapId}`);
    }
  }
}

if (scope === "all" || scope === "approved-content" || scope === "home") {
  const requiredHomeSections = new Set([
    "Enterprise Brief",
    "Context Strength",
    "What Nexus Knows",
    "Candidate AI Opportunity Portfolio",
    "What More Context Unlocks",
    "Evidence Gaps",
    "Module Readiness",
    "Next Evidence Requests",
  ]);
  const seen = new Set(artifacts.homeStories.map((block) => block.section));
  for (const section of requiredHomeSections) if (!seen.has(section)) fail(`Missing Home story section ${section}`);
  validateRefs(artifacts.homeStories, "Home story");
  validateRefs(artifacts.homeVisuals, "Home visual");
}

if (scope === "all" || scope === "approved-content" || scope === "tower") {
  const requiredTowerSections = new Set([
    "Budget Posture",
    "Run vs Change",
    "AI Spend Lens",
    "Program Portfolio",
    "Candidate AI Opportunity Portfolio",
    "Measurement Readiness",
    "Value Claim Status",
    "CIO/CFO Insights",
    "Evidence and Gaps",
  ]);
  const seen = new Set(artifacts.towerStories.map((block) => block.section));
  for (const section of requiredTowerSections) if (!seen.has(section)) fail(`Missing Tower story section ${section}`);
  validateRefs(artifacts.towerStories, "Tower story");
  validateRefs(artifacts.towerVisuals, "Tower visual");
}

if (scope === "all" || scope === "candidate-ai") {
  const candidates = artifacts.homeContext.candidate_ai_opportunity_portfolio ?? [];
  if (candidates.length < 8) fail(`Expected candidate AI portfolio breadth, found only ${candidates.length} rows`);
  const useCaseNames = new Set(candidates.map((row) => row.use_case_name));
  const units = new Set(candidates.map((row) => row.business_unit));
  if (useCaseNames.size < 8) fail(`Candidate AI portfolio names are too narrow: ${useCaseNames.size}`);
  if (units.size < 4) fail(`Candidate AI portfolio business-unit mapping is too narrow: ${units.size}`);
  const text = collectTextFields([artifacts.homeStories, artifacts.towerStories]).map((t) => t.text).join("\n");
  const appearances = [...useCaseNames].map((name) => ({
    name,
    count: (text.match(new RegExp(name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi")) ?? []).length,
  }));
  const max = Math.max(0, ...appearances.map((a) => a.count));
  const total = appearances.reduce((sum, a) => sum + a.count, 0);
  if (total > 5 && max / total > 0.35) {
    fail(`Single AI use case dominates narrative references: ${JSON.stringify(appearances.sort((a, b) => b.count - a.count).slice(0, 3))}`);
  }
  for (const row of candidates) {
    if (row.funding_status === "approved") fail(`Candidate AI opportunity ${row.record_id} is marked approved`);
  }
}

const scannedFiles = [...listFiles(derivedDir), ...listFiles(approvedDir), ...listFiles(reportDir)].filter((file) => /\.(json|md|html|csv)$/.test(file));
for (const file of scannedFiles) {
  const text = fs.readFileSync(file, "utf8");
  const rel = path.relative(repoRoot, file);
  for (const forbidden of ["$1.1B", "$1.7B", "1100000000", "1700000000", "$49.8M", "$53.3M", "49800000", "53300000", "src/data/meridian.ts", "cio_tower"]) {
    if (text.includes(forbidden)) fail(`${rel} contains forbidden stale value or legacy source reference: ${forbidden}`);
  }
  if (/datasets\/.*(?:v6|v7|dossier|projection)/i.test(text)) {
    fail(`${rel} contains forbidden legacy dataset path language`);
  }
}

const userText = collectTextFields([artifacts.homeStories, artifacts.towerStories, artifacts.homeVisuals, artifacts.towerVisuals]);
for (const { key, text } of userText) {
  if (/\b(?:fact:|MER-[A-Z0-9-]+|SA0[0-9]|source_record_id|record_id)\b/.test(text)) {
    fail(`User-facing field ${key} leaks raw source ID syntax: ${text.slice(0, 120)}`);
  }
  if (/\b(?:realized value|ROI|savings|achieved|measured outcome)\b/i.test(text) && !/not|without|no |before|unless|required|must not|blocked|claim|prerequisite|neither|distinguished/i.test(text)) {
    fail(`User-facing field ${key} may overclaim outcomes: ${text.slice(0, 160)}`);
  }
}

fs.mkdirSync(reportDir, { recursive: true });
const result = {
  status: failures.length ? "Fail" : "Pass",
  scope,
  checked_at: new Date().toISOString(),
  failures,
  warnings,
  counts: {
    evidence_registry: artifacts.evidenceRegistry.length,
    canonical_facts: artifacts.canonicalFacts.length,
    entity_profiles: artifacts.entityProfiles.length,
    graph_edges: artifacts.relationshipGraph.edges?.length ?? 0,
    context_gaps: artifacts.contextGaps.length,
    ai_business_unit_mappings: artifacts.businessUnitMap.length,
    home_story_blocks: artifacts.homeStories.length,
    home_visual_specs: artifacts.homeVisuals.length,
    tower_story_blocks: artifacts.towerStories.length,
    tower_visual_specs: artifacts.towerVisuals.length,
  },
};
fs.writeFileSync(path.join(reportDir, `audit-${scope}.json`), `${JSON.stringify(result, null, 2)}\n`);
fs.writeFileSync(path.join(reportDir, `audit-${scope}.md`), `# Meridian V3 Derived Layer Audit\n\nStatus: ${result.status}\n\nScope: ${scope}\n\n## Failures\n\n${failures.map((f) => `- ${f}`).join("\n") || "None"}\n\n## Warnings\n\n${warnings.map((w) => `- ${w}`).join("\n") || "None"}\n`);

if (failures.length) {
  console.error(JSON.stringify(result, null, 2));
  process.exit(1);
}

console.log(JSON.stringify(result, null, 2));
