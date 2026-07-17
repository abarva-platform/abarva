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
  interviewInsights: readJson("datasets/tenant-inputs/meridian-health/derived/interview-insights.json") ?? [],
  businessUnitMap: readJson("datasets/tenant-inputs/meridian-health/derived/ai-use-case-business-unit-map.json") ?? [],
  homeContext: readJson("datasets/tenant-inputs/meridian-health/derived/module-context/home-context-view.json") ?? {},
  movesContext: readJson("datasets/tenant-inputs/meridian-health/derived/module-context/moves-context-view.json") ?? {},
  towerView: readJson("datasets/tenant-inputs/meridian-health/derived/module-context/tower-dashboard-view.json") ?? {},
  sa08Posture: readJson("datasets/tenant-inputs/meridian-health/derived/module-context/sa08-benefits-posture.json") ?? {},
  homeStories: readJson("datasets/tenant-inputs/meridian-health/approved-content/home/story-blocks.json") ?? [],
  homeVisuals: readJson("datasets/tenant-inputs/meridian-health/approved-content/home/visual-specs.json") ?? [],
  towerStories: readJson("datasets/tenant-inputs/meridian-health/approved-content/tower/story-blocks.json") ?? [],
  towerVisuals: readJson("datasets/tenant-inputs/meridian-health/approved-content/tower/visual-specs.json") ?? [],
};

const factIds = new Set(artifacts.canonicalFacts.map((fact) => fact.fact_id));
const factsByType = artifacts.canonicalFacts.reduce((acc, fact) => {
  acc[fact.fact_type] ??= [];
  acc[fact.fact_type].push(fact);
  return acc;
}, {});
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

if (scope === "all" || scope === "interview-insights" || scope === "moves" || scope === "interview-graph") {
  const interviewFacts = factsByType.interview_context_fact ?? [];
  if (artifacts.interviewInsights.length !== 221) fail(`Expected 221 interview insights, found ${artifacts.interviewInsights.length}`);
  if (interviewFacts.length !== 221) fail(`Expected 221 interview_context_fact records, found ${interviewFacts.length}`);
  if (new Set(interviewFacts.map((fact) => fact.fact_id)).size !== interviewFacts.length) fail("Interview context fact IDs are not unique at row level");

  for (const insight of artifacts.interviewInsights) {
    for (const field of ["insight_id", "source_record_id", "source_fact_id", "source_fact_type", "stakeholder_role", "interview_group", "evidence_id", "confidence", "allowed_use", "blocked_use", "caveat"]) {
      if (!insight[field]) fail(`Interview insight ${insight.insight_id ?? "unknown"} missing ${field}`);
    }
    if (insight.source_fact_type !== "interview_context_fact") fail(`Interview insight ${insight.insight_id} has wrong source_fact_type ${insight.source_fact_type}`);
    if (!factIds.has(insight.source_fact_id)) fail(`Interview insight ${insight.insight_id} references missing fact ${insight.source_fact_id}`);
    if (!evidenceIds.has(insight.evidence_id)) fail(`Interview insight ${insight.insight_id} references missing evidence ${insight.evidence_id}`);
    if (/funding|realized/i.test(String(insight.allowed_use)) && !/not|blocked|without/i.test(String(insight.allowed_use))) {
      fail(`Interview insight ${insight.insight_id} allowed_use may imply funding/value creation`);
    }
    if (!/funding|realized/i.test(String(insight.blocked_use))) fail(`Interview insight ${insight.insight_id} blocked_use must block funding/value creation`);
  }

  const interviewEdges = (artifacts.relationshipGraph.edges ?? []).filter((edge) => edge.source_fact_type === "interview_context_fact");
  const requiredEdgeTypes = new Set(["supports_gate", "identifies_gap", "supports_priority", "informs_metric", "reinforces_risk", "supports_business_outcome", "constrains_scale", "requires_evidence"]);
  const seenEdgeTypes = new Set(interviewEdges.map((edge) => edge.edge_type || edge.relationship_type));
  for (const type of requiredEdgeTypes) {
    if (!seenEdgeTypes.has(type)) fail(`Missing interview graph edge type ${type}`);
  }

  const candidateUseCaseIds = new Set((artifacts.homeContext.candidate_ai_opportunity_portfolio ?? []).map((row) => row.record_id));
  const moveCandidateIds = new Set((artifacts.movesContext.candidate_move_opportunities ?? []).map((row) => row.move_candidate_id));
  const validTarget = (edge) => {
    const type = edge.target_type || edge.to_object_type;
    const id = edge.target_id || edge.to_object_id;
    if (type === "candidate_use_case") return candidateUseCaseIds.has(id);
    if (type === "move_candidate") return moveCandidateIds.has(id);
    if (type === "context_gap") return gapIds.has(id);
    if (type === "evidence_gap") return Boolean(id);
    if (["metric_fact", "risk_control_fact", "outcome_fact"].includes(type)) return factIds.has(id);
    return false;
  };

  for (const edge of interviewEdges) {
    const edgeType = edge.edge_type || edge.relationship_type;
    const sourceFactId = edge.source_fact_ids?.[0] || edge.from_object_id;
    if (!requiredEdgeTypes.has(edgeType)) fail(`Unexpected interview edge type ${edgeType}`);
    if (!factIds.has(sourceFactId)) fail(`Interview edge ${edge.edge_id} references missing source fact ${sourceFactId}`);
    if (!validTarget(edge)) fail(`Interview edge ${edge.edge_id} has missing/unresolved target ${edge.target_type}:${edge.target_id}`);
    if (!evidenceIds.has(edge.evidence_id)) fail(`Interview edge ${edge.edge_id} references missing evidence ${edge.evidence_id}`);
    for (const field of ["stakeholder_role", "interview_group", "confidence", "rationale", "module_usage", "active_candidate_status", "caveat"]) {
      if (!edge[field]) fail(`Interview edge ${edge.edge_id} missing ${field}`);
    }
    if (/\b(?:approved funding|realized value|funded program)\b/i.test(String(edge.rationale)) && !/not|without|does not|cannot|until/i.test(String(edge.rationale))) {
      fail(`Interview edge ${edge.edge_id} rationale may create funding/value: ${edge.rationale}`);
    }
  }

  if (!artifacts.homeContext.interview_supported_enterprise_priorities?.length) fail("HomeContextView missing interview-supported enterprise priorities");
  if (!artifacts.homeContext.interview_supported_evidence_gaps?.length) fail("HomeContextView missing interview-supported evidence gaps");
  if (!artifacts.homeContext.interview_supported_candidate_gates?.length) fail("HomeContextView missing interview-supported candidate gates");
  if (!artifacts.homeContext.stakeholder_signal_summary?.length) fail("HomeContextView missing stakeholder signal summary");
  if (!artifacts.homeContext.what_leadership_is_asking_nexus_to_prove_next?.length) fail("HomeContextView missing leadership proof asks");

  if (!artifacts.movesContext.candidate_move_opportunities?.length) fail("MovesContextView missing candidate move opportunities");
  if (!/not loaded/i.test(String(artifacts.movesContext.caveat ?? ""))) fail("MovesContextView caveat must say artifact is not loaded to runtime");
  if (!/do not create approved funding|cannot create approved funding/i.test((artifacts.movesContext.rules ?? []).join(" "))) fail("MovesContextView rules must block interview-created funding");
  for (const candidate of artifacts.movesContext.candidate_move_opportunities ?? []) {
    if (candidate.status !== "candidate_opportunity_not_funded_program") fail(`Move candidate ${candidate.move_candidate_id} has unsafe status ${candidate.status}`);
    if (!/does not create approved funding|does not create.*realized value|does not create approved funding, realized value/i.test(String(candidate.boundary))) {
      fail(`Move candidate ${candidate.move_candidate_id} boundary does not block funding/value creation`);
    }
    for (const factId of candidate.source_fact_ids ?? []) if (!factIds.has(factId)) fail(`Move candidate ${candidate.move_candidate_id} references missing source fact ${factId}`);
    for (const evidenceId of candidate.evidence_ids ?? []) if (!evidenceIds.has(evidenceId)) fail(`Move candidate ${candidate.move_candidate_id} references missing evidence ${evidenceId}`);
    for (const gapId of candidate.gap_ids ?? []) if (!gapIds.has(gapId)) fail(`Move candidate ${candidate.move_candidate_id} references missing gap ${gapId}`);
  }

  const supportRows = artifacts.movesContext.candidate_ai_portfolio_interview_support ?? [];
  const dominantSupport = supportRows.reduce((max, row) => Math.max(max, Number(row.interview_support_count ?? 0)), 0);
  const totalSupport = supportRows.reduce((sum, row) => sum + Number(row.interview_support_count ?? 0), 0);
  if (totalSupport > 0 && dominantSupport / totalSupport > 0.45) fail("Single AI use case dominates interview support above 45% threshold");
  for (const row of supportRows) {
    if (row.funding_status === "approved" && row.interview_support_count > 0 && !/does not convert candidate funding status/i.test(String(row.boundary))) {
      fail(`Candidate support row ${row.candidate_use_case_id} does not preserve funding boundary`);
    }
  }
}

const scannedFiles = [...listFiles(derivedDir), ...listFiles(approvedDir), ...listFiles(reportDir), ...listFiles(path.join(repoRoot, "reports/meridian-interview-insight-projection"))].filter((file) => /\.(json|md|html|csv)$/.test(file));
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
    interview_insights: artifacts.interviewInsights.length,
    interview_edges: (artifacts.relationshipGraph.edges ?? []).filter((edge) => edge.source_fact_type === "interview_context_fact").length,
    context_gaps: artifacts.contextGaps.length,
    moves_candidates: artifacts.movesContext.candidate_move_opportunities?.length ?? 0,
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
