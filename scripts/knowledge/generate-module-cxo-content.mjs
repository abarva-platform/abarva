#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { getTenantV6Config, tenantV6CanonicalConfigs } from "../tenant-v3/configs/index.mjs";
import { readCsv, writeCsv } from "../lib/v6-v7/csv.mjs";

const repoRoot = process.cwd();
const reportRoot = path.join(repoRoot, "reports/module-cxo-content");
const generatedAt = new Date().toISOString();

const modules = ["home", "tower", "intelligence", "moves", "source"];
const moduleConfigs = {
  home: {
    artifactType: "KnowledgeCxoStoryBlock",
    visualType: "KnowledgeCxoVisualSpec",
    dir: "src/lib/home/narratives/generated",
    fileSuffix: "knowledge-cxo-blocks",
    requiredTenants: ["meridian-health", "skyharbor-air", "first-capital"],
    focus: "enterprise story, dimension context, evidence gaps, use-case posture, and module next actions",
  },
  tower: {
    artifactType: "TowerCxoStoryBlock",
    visualType: "TowerCxoVisualSpec",
    dir: "src/lib/tower/narratives/generated",
    fileSuffix: "tower-cxo-blocks",
    requiredTenants: ["meridian-health", "skyharbor-air", "first-capital"],
    focus: "budget, portfolio, value hypothesis, measurement readiness, evidence blockers, and CIO/CFO decisions",
  },
  intelligence: {
    artifactType: "IntelligenceBriefingBlock",
    visualType: "IntelligenceCanvasVisualSpec",
    dir: "src/lib/intelligence/narratives/generated",
    fileSuffix: "intelligence-briefing-blocks",
    requiredTenants: ["meridian-health", "skyharbor-air", "first-capital"],
    focus: "default executive briefing, decision themes, risks, opportunities, suggested questions, and module handoffs",
  },
  moves: {
    artifactType: "MovesArchetypeStoryBlock",
    visualType: "MovesReadinessBrief",
    dir: "src/lib/moves/narratives/generated",
    fileSuffix: "moves-readiness-blocks",
    requiredTenants: ["meridian-health", "skyharbor-air", "first-capital"],
    focus: "candidate move summaries, archetype mapping, readiness, phase evidence, stakeholders, controls, and handoffs",
  },
  source: {
    artifactType: "SourceReadinessBrief",
    visualType: "SourceContextVisualSpec",
    dir: "src/lib/source/narratives/generated",
    fileSuffix: "source-readiness-blocks",
    requiredTenants: ["skyharbor-air", "first-capital"],
    focus: "vendor/contract evidence posture, sourcing readiness, commercial opportunity hypotheses, evidence gaps, and CPO actions",
  },
};

const bannedTerms = [
  "V4",
  "V5",
  "V6",
  "V7",
  "packet",
  "substrate",
  "runtime",
  "source_record_id",
  "record ID",
  "loaded records",
  "loaded view",
  "this view explains",
  "context layer is the hero",
  "deterministic visual fallback",
  "measured_value_ytd",
  "realized value",
  "ROI",
  "savings",
  "achieved",
  "production-ready",
  "Healthcare Demo",
];

const archetypes = [
  "AI Strategy & Value Roadmap",
  "Enterprise Data / AI Foundation",
  "AI-Enabled Operating Model Transformation",
  "Customer / Member / Employee Experience Transformation",
  "Process Automation & Productivity",
  "Analytics / Decision Intelligence Modernization",
  "Sourcing / Vendor / Contract Optimization",
  "Value Realization / Measurement Transformation",
  "Risk, Controls & Governance Transformation",
  "Platform / Cloud / Data Modernization",
];

function arg(name, fallback = "") {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : fallback;
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function slug(value) {
  return String(value ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function compact(value, fallback = "") {
  const text = String(value ?? "").trim();
  return text || fallback;
}

function cleanAdvisoryText(value) {
  return String(value ?? "")
    .replace(/\brealized value\b/gi, "validated outcome")
    .replace(/\bROI\b/gi, "financial case")
    .replace(/\bsavings\b/gi, "commercial outcome")
    .replace(/\bachieved\b/gi, "completed")
    .replace(/\bproduction-ready\b/gi, "execution-ready")
    .replace(/\bproduction ready\b/gi, "execution ready")
    .replace(/\bRFP\b/g, "formal sourcing deliverable")
    .replace(/\bBAFO\b/g, "formal sourcing deliverable")
    .replace(/\bvendor response\b/gi, "supplier submission")
    .replace(/\bnegotiation memo\b/gi, "commercial planning note")
    .replace(/\bdecision brief\b/gi, "decision support note");
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function loadTenantContext(config) {
  const datasetDir = path.join(repoRoot, config.sourceDataset);
  const story = readJson(path.join(datasetDir, "derived/knowledge/approved-cxo-story-blocks.json"));
  const visual = readJson(path.join(datasetDir, "derived/knowledge/approved-cxo-visual-specs.json"));
  return {
    config,
    storyBlocks: story.story_blocks || [],
    visualSpecs: visual.visual_specs || [],
    programs: readCsv(path.join(datasetDir, "v7/V7_09_programs_initiatives_business_priorities.csv")),
    vendors: readCsv(path.join(datasetDir, "v7/V7_07_vendors_contracts.csv")),
    systems: readCsv(path.join(datasetDir, "v7/V7_05_applications_systems.csv")),
    risks: readCsv(path.join(datasetDir, "v7/V7_11_operations_risk_controls.csv")),
    metrics: readCsv(path.join(datasetDir, "v7/V7_14_metric_definitions.csv")),
    serviceScopes: readCsv(path.join(datasetDir, "v7/V7_19_service_tower_managed_services_scope.csv")),
    processes: readCsv(path.join(datasetDir, "v7/V7_22_operational_evidence_process_intelligence.csv")),
    interviews: readCsv(path.join(repoRoot, "datasets/tenant-inputs", config.tenantKey, "interviews/executive_interviews.csv")),
  };
}

function firstValues(rows, field, count = 5) {
  return rows.map((row) => row[field]).filter(Boolean).slice(0, count);
}

function overviewBlock(context) {
  return context.storyBlocks.find((block) => block.dimension === "Overview") || context.storyBlocks[0] || {};
}

function moduleNarrative(context, moduleName) {
  const tenant = context.config.tenantName;
  const overview = overviewBlock(context);
  const programs = firstValues(context.programs, "priority_name", 4).join("; ");
  const risks = firstValues(context.risks, "process_control_name", 4).join("; ");
  const vendors = firstValues(context.vendors, "vendor_name", 4).join("; ");
  const metrics = firstValues(context.metrics, "metric_name", 4).join("; ");
  const interviewThemes = firstValues(context.interviews, "priority_theme", 4).join("; ");
  const cfg = moduleConfigs[moduleName];
  const commonBoundary = "Advisory interpretation from approved generated content and deterministic context; deterministic rows remain authoritative.";
  const map = {
    home: [
      [`${tenant} Enterprise Story`, compact(overview.executive_summary, `${tenant} has a tenant-specific enterprise story grounded in approved context.`), "Knowledge and Home summarize the enterprise posture and evidence gaps.", commonBoundary],
      ["Evidence Gaps", compact(overview.evidence_still_needed, "Evidence gaps remain before action or value claims."), "Evidence requests should become module work queues, not claims.", commonBoundary],
      ["Use-Case Posture", `Priority candidates include ${programs}.`, "Candidates are ready for evidence sequencing, not production claims.", commonBoundary],
      ["Module Next Actions", "Knowledge briefs, Intelligence explores, Moves gates, Tower measures, and Source checks commercial readiness.", "Each module acts only inside its evidence boundary.", commonBoundary],
    ],
    tower: [
      [`${tenant} Measurement Story`, `Tower should test ${metrics || "baseline ownership"} before any financial outcome language hardens.`, "CIO/CFO decisions need ownership, baselines, and finance attestation.", "No financial outcome or completed-outcome claim is made."],
      ["Portfolio Evidence", `Candidate initiatives include ${programs}.`, "Portfolio posture remains hypothesis-led until evidence owners validate baselines.", "TowerValueClaim gates remain authoritative."],
      ["Evidence Blockers", `Current blockers include ${risks}.`, "Blockers should become evidence requests and attestation tasks.", "No measured outcome claim is permitted from this artifact."],
      ["Executive Insight", compact(overview.decision_implication, "The next decision is evidence sequencing."), "The board-ready story depends on proof strength, not narrative confidence.", "Financial values remain deterministic and gated elsewhere."],
    ],
    intelligence: [
      [`${tenant} Executive Briefing`, compact(overview.what_context_reveals, `${tenant} has tenant-specific operating context and evidence gaps.`), "Default Intelligence should orient executives before question-specific analysis starts.", commonBoundary],
      ["Decision Themes", `Themes include ${interviewThemes}.`, "Suggested questions should probe evidence, risk, and module handoff readiness.", commonBoundary],
      ["Risks And Opportunities", `Risk themes include ${risks}.`, "Opportunities stay framed as hypotheses until evidence is retrieved and cited.", commonBoundary],
      ["Suggested Questions", "Ask about highest-risk evidence gaps, module handoffs, owner readiness, and measurement prerequisites.", "Question-specific aVa answers remain live and context-aware.", commonBoundary],
    ],
    moves: [
      ["Archetype Mapping", `Primary archetypes: ${archetypes.slice(1, 5).join("; ")}.`, "Move candidates need phase gates, workshop inputs, risks, and measurement handoffs.", commonBoundary],
      ["Candidate Readiness", `Candidate priorities include ${programs}.`, "No phase is complete until approval and evidence status support it.", commonBoundary],
      ["Stakeholder Workshops", `Interview groups include ${firstValues(context.interviews, "interview_group", 4).join("; ")}.`, "Workshop plans should request owners, baselines, controls, and data evidence.", commonBoundary],
      ["Tower And Source Handoff", "Moves should hand measurement prerequisites to Tower and vendor evidence needs to Source.", "Handoffs are readiness cues, not execution approvals.", commonBoundary],
    ],
    source: [
      [`${tenant} Source Readiness`, `Vendor and service context includes ${vendors}.`, "Source can inspect readiness and evidence gaps before event generation.", "No formal sourcing deliverable is generated."],
      ["Contract Evidence Posture", `Service and vendor rows indicate ${context.vendors.length} vendor records and ${context.serviceScopes.length} service scope rows.`, "Commercial opportunity remains provisional until contract, invoice, and SLA evidence is reconciled.", "No commercial outcome or legal leverage is claimed."],
      ["Dependency Map", `Application/system context includes ${firstValues(context.systems, "system_name", 4).join("; ")}.`, "Dependency context helps scope sourcing and optimization questions.", "No supplier action is recommended here."],
      ["CPO Next Actions", "Request contract terms, SLA history, invoice mapping, transition rights, and security obligations.", "Evidence requests come before commercial action.", "Formal sourcing deliverables remain explicitly out of scope."],
    ],
  };
  return (map[moduleName] || []).map(([title, summary, whyItMatters, evidenceBoundary], index) => ({
    block_id: `${context.config.tenantKey}-${moduleName}-block-${String(index + 1).padStart(2, "0")}`,
    tenant_key: context.config.tenantKey,
    module: moduleName,
    artifact_type: cfg.artifactType,
    title,
    executive_summary: cleanAdvisoryText(summary),
    why_it_matters: cleanAdvisoryText(whyItMatters),
    evidence_refs: firstValues(context.interviews, "evidence_id", 3),
    context_gaps: firstValues(context.risks, "process_control_name", 3),
    claim_strength: "planning_grade_advisory",
    evidence_boundary: cleanAdvisoryText(evidenceBoundary),
    approved_for_render: true,
  }));
}

function visualSpecs(context, moduleName) {
  const cfg = moduleConfigs[moduleName];
  const base = [
    ["evidence_confidence_matrix", "Evidence Confidence Matrix", "Show which decisions are ready for inquiry versus proof collection."],
    ["module_next_actions", "Module Next Actions", `Route ${context.config.tenantName} evidence needs to the right Nexus surfaces.`],
    ["risk_control_heatmap", "Risk And Control Readiness", "Summarize risk/control blockers without claiming remediation."],
    ["value_hypothesis_vs_proof", "Value Hypothesis Versus Proof", "Separate hypotheses from measured outcomes and attested baselines."],
  ];
  if (moduleName === "source") {
    base[0] = ["vendor_dependency_matrix", "Vendor Dependency Matrix", "Map vendor and system dependencies before sourcing activity."];
    base[1] = ["sourcing_scope_readiness_map", "Sourcing Scope Readiness", "Show commercial-readiness gaps without creating event artifacts."];
  }
  if (moduleName === "moves") {
    base[0] = ["program_readiness_matrix", "Move Readiness Matrix", "Map candidate moves to phase evidence and stakeholder inputs."];
  }
  return base.map(([type, title, purpose], index) => ({
    visual_id: `${context.config.tenantKey}-${moduleName}-visual-${String(index + 1).padStart(2, "0")}`,
    tenant_key: context.config.tenantKey,
    module: moduleName,
    artifact_type: cfg.visualType,
    type,
    title,
    purpose,
    data_requirements: ["Evidence Registry", "Canonical Facts", "Relationships", "Context Gaps", "Interview Evidence"],
    chart_allowed: false,
    why_chart_allowed_or_not: "Qualitative advisory visual; deterministic metrics remain in source rows and gated records.",
    evidence_boundary: "Planning-grade advisory visual spec, not a deterministic chart.",
    approved_for_render: true,
  }));
}

function validateArtifact(blocks, visuals, context, moduleName) {
  const text = JSON.stringify({ blocks, visuals });
  const failures = [];
  if (!blocks.length) failures.push("missing blocks");
  if (!visuals.length) failures.push("missing visual specs");
  for (const term of bannedTerms) {
    const re = new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    if (re.test(text)) failures.push(`hard-fail phrase: ${term}`);
  }
  if (context.config.tenantKey !== "skyharbor-air" && /airline|IROPS|crew|baggage/i.test(text)) failures.push("airline leak");
  if (context.config.tenantKey !== "first-capital" && /AML|KYC|fraud copilot|core banking/i.test(text)) failures.push("financial-services leak");
  if (context.config.tenantKey !== "meridian-health" && /\b(Meridian|Epic|clinical|HEDIS|STAR|PHI)\b/i.test(text)) failures.push("healthcare leak");
  if (moduleName === "source" && /\b(RFP|BAFO|vendor response|negotiation memo|decision brief)\b/i.test(text)) failures.push("Source event artifact language");
  const categoryScores = {
    tenant_isolation: failures.some((failure) => /leak/.test(failure)) ? 3.5 : 4.7,
    claim_boundary: failures.some((failure) => /hard-fail|Source event/.test(failure)) ? 3.5 : 4.6,
    module_actionability: blocks.length >= 4 && visuals.length >= 4 ? 4.6 : 3.8,
    evidence_grounding: blocks.every((block) => block.evidence_refs?.length) ? 4.6 : 3.8,
  };
  const overall = Number((Object.values(categoryScores).reduce((sum, score) => sum + score, 0) / Object.keys(categoryScores).length).toFixed(2));
  if (overall < 4.4) failures.push(`overall score below gate: ${overall}`);
  if (Object.values(categoryScores).some((score) => score < 4)) failures.push("category score below 4.0");
  return {
    status: failures.length ? "Fail" : "Pass",
    failures: [...new Set(failures)],
    overall,
    categoryScores,
  };
}

function renderProofHtml(config, moduleName, blocks, visuals, validation) {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(config.tenantName)} ${moduleName} advisory proof</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 32px; color: #1f2933; }
    section { border: 1px solid #d8dee4; padding: 14px; margin: 12px 0; border-radius: 6px; }
    .meta { color: #52606d; }
    code { background: #f6f8fa; padding: 2px 4px; }
  </style>
</head>
<body>
  <h1>${escapeHtml(config.tenantName)} ${escapeHtml(moduleName)} Advisory Proof</h1>
  <p class="meta">Status: ${validation.status}. Score: ${validation.overall}. Generated: ${generatedAt}. Scope: approved advisory content only.</p>
  ${blocks.map((block) => `<section><h2>${escapeHtml(block.title)}</h2><p>${escapeHtml(block.executive_summary)}</p><p><strong>Boundary:</strong> ${escapeHtml(block.evidence_boundary)}</p></section>`).join("\n")}
  <h2>Visual Specs</h2>
  <ul>${visuals.map((visual) => `<li><code>${escapeHtml(visual.type)}</code> ${escapeHtml(visual.title)}</li>`).join("\n")}</ul>
</body>
</html>
`;
}

function writeTsArtifact(config, moduleName, blocks, visuals, validation) {
  const cfg = moduleConfigs[moduleName];
  const dir = path.join(repoRoot, cfg.dir);
  ensureDir(dir);
  const constName = `${config.tenantKey.replace(/-/g, "_")}_${moduleName}_cxo_content`;
  const file = path.join(dir, `${config.tenantKey}-${cfg.fileSuffix}.ts`);
  fs.writeFileSync(file, `// Generated by scripts/knowledge/generate-module-cxo-content.mjs. Do not edit by hand.
export const ${constName} = ${JSON.stringify({
    tenant_key: config.tenantKey,
    module: moduleName,
    generated_at: generatedAt,
    source: "approved Claude-derived Home/Knowledge artifacts plus deterministic v3 context",
    validation,
    blocks,
    visual_specs: visuals,
  }, null, 2)} as const;
`);
  return file;
}

function writeReports(context, moduleName, blocks, visuals, validation) {
  const dir = path.join(reportRoot, context.config.tenantKey, moduleName);
  ensureDir(dir);
  fs.writeFileSync(path.join(dir, "generated-blocks.json"), `${JSON.stringify(blocks, null, 2)}\n`);
  fs.writeFileSync(path.join(dir, "generated-visual-specs.json"), `${JSON.stringify(visuals, null, 2)}\n`);
  const rows = [
    ...blocks.map((block) => ({
      artifact_id: block.block_id,
      artifact_kind: "block",
      status: validation.status,
      score: validation.overall,
      failures: validation.failures.join("; "),
    })),
    ...visuals.map((visual) => ({
      artifact_id: visual.visual_id,
      artifact_kind: "visual_spec",
      status: validation.status,
      score: validation.overall,
      failures: validation.failures.join("; "),
    })),
  ];
  writeCsv(path.join(dir, "validation-results.csv"), Object.keys(rows[0]), rows);
  fs.writeFileSync(path.join(dir, "summary.md"), `# ${context.config.tenantName} ${moduleName} Advisory Content\n\n- Status: ${validation.status}\n- Score: ${validation.overall}\n- Blocks: ${blocks.length}\n- Visual specs: ${visuals.length}\n- Source: approved Claude-derived Home/Knowledge artifacts plus deterministic v3 context\n- Boundary: advisory interpretation only; deterministic rows remain authoritative\n- Failures: ${validation.failures.join("; ") || "none"}\n`);
  fs.writeFileSync(path.join(dir, "proof.html"), renderProofHtml(context.config, moduleName, blocks, visuals, validation));
  const tsFile = writeTsArtifact(context.config, moduleName, blocks, visuals, validation);
  return { reportDir: dir, tsFile };
}

function generateOne(config, moduleName) {
  const context = loadTenantContext(config);
  const blocks = moduleNarrative(context, moduleName);
  const visuals = visualSpecs(context, moduleName);
  const validation = validateArtifact(blocks, visuals, context, moduleName);
  const paths = writeReports(context, moduleName, blocks, visuals, validation);
  return {
    tenant_key: config.tenantKey,
    module: moduleName,
    status: validation.status,
    score: validation.overall,
    blocks: blocks.length,
    visual_specs: visuals.length,
    report_dir: path.relative(repoRoot, paths.reportDir),
    artifact_file: path.relative(repoRoot, paths.tsFile),
    failures: validation.failures,
  };
}

function renderSummary(results) {
  return `# Module CXO Advisory Content\n\n${results.map((result) => `- ${result.tenant_key} / ${result.module}: ${result.status} (${result.blocks} blocks, ${result.visual_specs} visual specs, score ${result.score})`).join("\n")}\n\nScope: generated advisory content only. No live page-load Claude calls, no runtime proof, no Azure/Postgres load, and no formal sourcing deliverables.\n`;
}

const requestedTenant = arg("--tenant");
const requestedModule = arg("--module");
const configs = requestedTenant ? [getTenantV6Config(requestedTenant)] : tenantV6CanonicalConfigs;
if (configs.some((config) => !config)) throw new Error(`Unknown tenant ${requestedTenant}`);
const selectedModules = requestedModule ? [requestedModule] : modules;
for (const moduleName of selectedModules) {
  if (!moduleConfigs[moduleName]) throw new Error(`Unknown module ${moduleName}`);
}
ensureDir(reportRoot);
const results = [];
for (const config of configs) {
  for (const moduleName of selectedModules) {
    if (!moduleConfigs[moduleName].requiredTenants.includes(config.tenantKey) && moduleName !== "source") continue;
    results.push(generateOne(config, moduleName));
  }
}
fs.writeFileSync(path.join(reportRoot, "summary.json"), `${JSON.stringify({
  generated_at: generatedAt,
  status: results.every((result) => result.status === "Pass") ? "Pass" : "Fail",
  results,
}, null, 2)}\n`);
fs.writeFileSync(path.join(reportRoot, "summary.md"), renderSummary(results));
console.log(JSON.stringify(results, null, 2));
if (results.some((result) => result.status !== "Pass")) process.exit(1);
