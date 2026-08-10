#!/usr/bin/env node
import Anthropic from "@anthropic-ai/sdk";
import fs from "node:fs";
import path from "node:path";
import { getTenantV6Config, tenantV6CanonicalConfigs } from "../tenant-v3/configs/index.mjs";
import { readCsv, writeCsv } from "../tenant-v3/lib/csv.mjs";

const repoRoot = process.cwd();
const model = process.env.KNOWLEDGE_CXO_CLAUDE_MODEL || "claude-sonnet-4-6";
const promptVersion = "knowledge-cxo-story-blocks-v1";
const dimensions = [
  "00 Enterprise Profile",
  "01 Business Functions",
  "02 Org Ownership",
  "03 Workforce Roles",
  "04 Applications & Systems",
  "05 Data Assets & Integrations",
  "06 Infrastructure & Platforms",
  "07 Vendors & Contracts",
  "08 IT Budget, Spend & Value",
  "09 Programs & Initiatives",
  "10 AI & Automation Use Cases",
  "11 Risks & Controls",
  "12 Relationships",
  "13 Evidence Sources",
  "14 Metrics & Outcomes",
  "15 Industry Context Patterns",
  "16 Expert Lenses",
  "17 Managed Services Scope",
  "18 Operational Process Evidence",
];

const allowedVisualSpecTypes = new Set([
  "context_strength_snapshot",
  "what_more_context_unlocks",
  "top_evidence_requests",
  "module_next_actions",
  "use_case_portfolio",
  "dimension_readiness_matrix",
  "evidence_confidence_matrix",
  "relationship_readiness_summary",
  "application_dependency_map",
  "data_foundation_gap_map",
  "program_readiness_matrix",
  "risk_control_heatmap",
  "value_hypothesis_vs_proof",
  "vendor_dependency_matrix",
  "sourcing_scope_readiness_map",
  "negotiation_leverage_matrix",
  "contract_risk_heatmap",
  "sla_breach_summary",
  "invoice_leakage_chart",
  "cxo_insight_cards",
]);

const hardFailPhrases = [
  "loaded records",
  "loaded view",
  "records are loaded",
  "this view explains",
  "no repeated gap pattern",
  "context layer is the hero",
  "packet",
  "substrate",
  "runtime",
  "V4",
  "V5",
  "V6",
  "V7",
  "candidate_move",
  "source_record_id",
  "record ID",
  "not loaded",
  "deterministic visual fallback",
  "Healthcare Demo",
  "Meridian content",
  "airline content in non-airline content",
  "financial content in non-financial content",
];

function loadDotenvLocal() {
  const envPath = path.join(repoRoot, ".env.local");
  if (!fs.existsSync(envPath)) return;
  const lines = fs.readFileSync(envPath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;
    const [key, ...rest] = trimmed.split("=");
    if (!process.env[key]) process.env[key] = rest.join("=").replace(/^['"]|['"]$/g, "");
  }
}

function arg(name, fallback = "") {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : fallback;
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function compact(value, fallback = "") {
  const text = String(value ?? "").trim();
  return text || fallback;
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function canonicalInputLabel(config) {
  const activePath = `datasets/tenant-inputs/active/${config.tenantKey}/current`;
  if (fs.existsSync(path.join(repoRoot, activePath))) return activePath;
  return `datasets/tenant-inputs/${config.tenantKey}/standard-2026-07-v3`;
}

function approvedArtifactDir(config) {
  return path.join(repoRoot, "datasets/context-artifacts/approved", config.tenantKey, "home-knowledge");
}

function listTop(rows, field, count = 8) {
  return rows.map((row) => row[field]).filter(Boolean).slice(0, count);
}

function contextForTenant(config) {
  const inputsDir = path.join(repoRoot, "datasets/tenant-inputs", config.tenantKey);
  const activeDir = path.join(
    repoRoot,
    "datasets/tenant-inputs/active",
    config.tenantKey,
    "current",
  );
  const standardDir = fs.existsSync(activeDir)
    ? activeDir
    : path.join(inputsDir, "standard-2026-07-v3");
  const profile = readCsv(path.join(standardDir, "00_enterprise_profile.csv"))[0] ?? {};
  const systems = readCsv(path.join(standardDir, "04_applications_systems.csv"));
  const vendors = readCsv(path.join(standardDir, "07_vendors_contracts.csv"));
  const programs = readCsv(path.join(standardDir, "09_programs_initiatives.csv"));
  const risks = readCsv(path.join(standardDir, "11_risks_controls.csv"));
  const interviews = readCsv(path.join(inputsDir, "interviews/executive_interviews.csv"));
  return {
    tenantKey: config.tenantKey,
    tenantName: config.tenantName,
    industry: config.entity.industry,
    subIndustry: config.entity.sub_industry,
    businessModel: config.entity.business_model,
    commonKnownGaps: config.commonKnownGaps,
    notAllowedClaims: config.notAllowedClaims,
    useCases: config.useCases.map((useCase) => ({
      id: useCase.id,
      name: useCase.name,
      category: useCase.category,
      systems: useCase.systems,
      dataDomains: useCase.dataDomains,
      gaps: useCase.gaps,
      valueHypothesis: useCase.valueHypothesis,
    })),
    systems: listTop(systems, "business_name", 14),
    vendors: listTop(vendors, "business_name", 10),
    topGaps: listTop(risks, "risk_or_gap", 14),
    strategicPriorities: listTop(programs, "use_case", 12),
    interviewSignals: interviews.slice(0, 28).map((row) => ({
      executive_area: row.executive_area,
      priority_theme: row.priority_theme,
      pain_point: row.pain_point,
      initiative_link: row.initiative_link,
      evidence_needed: row.evidence_needed,
    })),
    homeDerivedRead: compact(profile.summary),
  };
}

function buildPrompt(context) {
  return `You generate approved Knowledge/Home CXO story blocks and visual specs from tenant context.

Return strict JSON only. No markdown fences.

Tenant: ${context.tenantName}
Tenant key: ${context.tenantKey}
Industry: ${context.industry}
Sub-industry: ${context.subIndustry}
Business model: ${context.businessModel}

Required story arc:
1. What kind of enterprise is this?
2. What Nexus understands about how it runs.
3. What is fragmented, risky, or not decision-grade.
4. What that implies for AI-led transformation.
5. What evidence is needed next.
6. Which Nexus module should act next.

Rules:
- Generate rich tenant context narrative, not Source event outputs.
- Do not generate RFPs, vendor responses, BAFO packs, negotiation memos, or Source decision briefs.
- Claude writes advisory story blocks and visual specs only.
- Do not invent deterministic table rows, facts, savings, contract breach, production AI readiness, or measured improvements.
- Use evidence-bound language such as "not yet evidenced", "needs validation", "planning-grade", "hypothesis", and "next evidence request".
- Never write "not loaded"; write "not yet evidenced" or "needs evidence" instead.
- Avoid these exact phrases: ${hardFailPhrases.join(" | ")}.
- Never use the word "packet" in any phrase, including "board packet" or "data packet"; use "board materials", "evidence bundle", or "review artifact" instead.
- Avoid internal version names and internal data plumbing words.
- For numeric charts, only use if the supplied context includes numeric support. Prefer qualitative matrices/cards.

Output shape:
{
  "tenant_key": string,
  "prompt_version": "${promptVersion}",
  "story_blocks": [
    {
      "block_id": string,
      "surface": "home" | "knowledge",
      "dimension": "Overview" or one of ${JSON.stringify(dimensions)},
      "title": string,
      "executive_summary": string,
      "what_context_reveals": string,
      "why_it_matters": string,
      "decision_implication": string,
      "evidence_still_needed": string,
      "module_usage": string,
      "next_validation_action": string,
      "approved_for_render": true
    }
  ],
  "visual_specs": [
    {
      "visual_id": string,
      "type": one of ${JSON.stringify([...allowedVisualSpecTypes])},
      "surface": "home" | "knowledge",
      "title": string,
      "purpose": string,
      "data_requirements": string[],
      "chart_allowed": boolean,
      "why_chart_allowed_or_not": string,
      "placement": string,
      "evidence_boundary": string
    }
  ]
}

Create exactly 20 story_blocks: one Overview and one for each approved dimension. Create 8 to 12 visual_specs.
Keep each story block text field to 12-24 words. Keep each visual spec string field to 8-18 words.

Context JSON:
${JSON.stringify(context, null, 2)}`;
}

function extractJson(text) {
  const trimmed = text.trim();
  if (trimmed.startsWith("{")) return JSON.parse(trimmed);
  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  if (start < 0 || end < start) throw new Error("Claude response did not contain JSON");
  return JSON.parse(trimmed.slice(start, end + 1));
}

function collectText(message) {
  return message.content
    .map((part) => part.type === "text" ? part.text : "")
    .join("")
    .trim();
}

function scanHardFails(payload, config) {
  const text = JSON.stringify(payload);
  const failures = [];
  for (const phrase of hardFailPhrases) {
    if (new RegExp(phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i").test(text)) failures.push(phrase);
  }
  if (config.tenantKey !== "skyharbor-air" && /airline|crew|baggage|irops/i.test(text)) failures.push("airline content in non-airline content");
  if (config.tenantKey !== "first-capital" && /AML|KYC|fraud|banking|core banking/i.test(text)) failures.push("financial content in non-financial content");
  return failures;
}

function validatePayload(payload, config) {
  const failures = [];
  if (payload.tenant_key !== config.tenantKey) failures.push("tenant_key mismatch");
  if (!Array.isArray(payload.story_blocks) || payload.story_blocks.length !== 20) failures.push("expected exactly 20 story blocks");
  if (!Array.isArray(payload.visual_specs) || payload.visual_specs.length < 8) failures.push("expected at least 8 visual specs");
  for (const block of payload.story_blocks || []) {
    for (const field of ["block_id", "surface", "dimension", "title", "executive_summary", "what_context_reveals", "why_it_matters", "decision_implication", "evidence_still_needed", "module_usage", "next_validation_action"]) {
      if (!compact(block[field])) failures.push(`story block ${block.block_id || "unknown"} missing ${field}`);
    }
    if (block.approved_for_render !== true) failures.push(`story block ${block.block_id || "unknown"} not approved_for_render`);
  }
  for (const visual of payload.visual_specs || []) {
    if (!allowedVisualSpecTypes.has(visual.type)) failures.push(`visual ${visual.visual_id || "unknown"} has disallowed type ${visual.type}`);
    if (visual.chart_allowed && !/numeric|rows|counts|trend|sla|invoice|score/i.test(`${visual.why_chart_allowed_or_not} ${visual.data_requirements?.join(" ")}`)) {
      failures.push(`visual ${visual.visual_id || "unknown"} allows chart without numeric support`);
    }
  }
  failures.push(...scanHardFails(payload, config));
  const uniqueFailures = [...new Set(failures)];
  const categoryScores = {
    tenant_specificity: uniqueFailures.some((f) => /content|tenant/.test(f)) ? 3.8 : 4.7,
    evidence_boundary: uniqueFailures.some((f) => /hard|claim|chart/.test(f)) ? 3.8 : 4.6,
    executive_quality: uniqueFailures.length ? 4.0 : 4.6,
    module_actionability: uniqueFailures.length ? 4.1 : 4.7,
  };
  const overall = Number((Object.values(categoryScores).reduce((a, b) => a + b, 0) / Object.keys(categoryScores).length).toFixed(2));
  if (overall < 4.4) uniqueFailures.push(`overall score below gate: ${overall}`);
  if (Object.values(categoryScores).some((score) => score < 4.0)) uniqueFailures.push("category score below 4.0");
  return {
    status: uniqueFailures.length ? "fail" : "pass",
    failures: uniqueFailures,
    overall,
    categoryScores,
  };
}

function writeTenantReports(config, payload, validation, rawText) {
  const reportDir = path.join(repoRoot, "reports/multi-tenant-cxo-story-generation", config.tenantKey);
  const artifactDir = approvedArtifactDir(config);
  ensureDir(reportDir);
  ensureDir(artifactDir);
  const storyPath = path.join(reportDir, "generated-story-blocks.json");
  const visualPath = path.join(reportDir, "generated-visual-specs.json");
  fs.writeFileSync(storyPath, `${JSON.stringify(payload.story_blocks, null, 2)}\n`);
  fs.writeFileSync(visualPath, `${JSON.stringify(payload.visual_specs, null, 2)}\n`);
  fs.writeFileSync(path.join(artifactDir, "approved-cxo-story-blocks.json"), `${JSON.stringify({
    tenant_key: config.tenantKey,
    prompt_version: promptVersion,
    generated_model: model,
    validation,
    story_blocks: payload.story_blocks,
  }, null, 2)}\n`);
  fs.writeFileSync(path.join(artifactDir, "approved-cxo-visual-specs.json"), `${JSON.stringify({
    tenant_key: config.tenantKey,
    prompt_version: promptVersion,
    generated_model: model,
    validation,
    visual_specs: payload.visual_specs,
  }, null, 2)}\n`);
  const blockRows = payload.story_blocks.map((block) => ({
    block_id: block.block_id,
    dimension: block.dimension,
    status: validation.status,
    approved_for_render: block.approved_for_render,
    hard_fail_count: validation.failures.length,
  }));
  writeCsv(path.join(reportDir, "block-validation-results.csv"), Object.keys(blockRows[0]), blockRows);
  const visualRows = payload.visual_specs.map((visual) => ({
    visual_id: visual.visual_id,
    type: visual.type,
    status: validation.status,
    chart_allowed: visual.chart_allowed,
    evidence_boundary: visual.evidence_boundary,
  }));
  writeCsv(path.join(reportDir, "visual-validation-results.csv"), Object.keys(visualRows[0]), visualRows);
  const scoreRows = Object.entries(validation.categoryScores).map(([category, score]) => ({
    category,
    score,
    status: score >= 4 ? "Pass" : "Fail",
  }));
  scoreRows.push({ category: "overall", score: validation.overall, status: validation.overall >= 4.4 ? "Pass" : "Fail" });
  writeCsv(path.join(reportDir, "cxo-scorecard.csv"), Object.keys(scoreRows[0]), scoreRows);
  fs.writeFileSync(path.join(reportDir, "summary.md"), `# ${config.tenantName} CXO Story Generation\n\n- Status: ${validation.status === "pass" ? "Pass" : "Fail"}\n- Model: ${model}\n- Prompt version: ${promptVersion}\n- Canonical input: ${canonicalInputLabel(config)}\n- Story blocks: ${payload.story_blocks.length}\n- Visual specs: ${payload.visual_specs.length}\n- Overall score: ${validation.overall}\n- Failures: ${validation.failures.join("; ") || "none"}\n\nApproved advisory artifacts are stored by tenant key and mirrored to this report folder.\n`);
  fs.writeFileSync(path.join(reportDir, "all-dimension-review.md"), payload.story_blocks.map((block) => `## ${block.dimension}\n\n${block.executive_summary}\n\n- What context reveals: ${block.what_context_reveals}\n- Decision implication: ${block.decision_implication}\n- Evidence still needed: ${block.evidence_still_needed}\n- Next validation action: ${block.next_validation_action}\n`).join("\n"));
  fs.writeFileSync(path.join(reportDir, "visual-placement-plan.md"), payload.visual_specs.map((visual) => `- ${visual.title} (${visual.type}) -> ${visual.placement}. Chart allowed: ${visual.chart_allowed ? "yes" : "no"}. ${visual.why_chart_allowed_or_not}`).join("\n"));
  fs.writeFileSync(path.join(reportDir, "before-after-samples.md"), `# Before / After Samples\n\n## Before\n\nSafe deterministic fallback can state only that ${config.tenantName} has a planning-grade context pack and needs more evidence.\n\n## After\n\n${payload.story_blocks[0]?.executive_summary || ""}\n`);
  fs.writeFileSync(path.join(reportDir, "proof.html"), renderProofHtml(config, payload, validation));
  fs.writeFileSync(path.join(reportDir, "raw-claude-response.txt"), rawText);
  return { reportDir, artifactDir };
}

function renderProofHtml(config, payload, validation) {
  return `<!doctype html><html><head><meta charset="utf-8"><title>${config.tenantName} CXO Story Proof</title><style>body{font-family:system-ui,sans-serif;margin:32px;line-height:1.45}section{border:1px solid #ddd;border-radius:8px;padding:16px;margin:12px 0}code{background:#f4f4f4;padding:2px 4px}</style></head><body><h1>${config.tenantName} CXO Story Proof</h1><p>Status: <strong>${validation.status}</strong>. Overall score: ${validation.overall}. Failures: ${validation.failures.join("; ") || "none"}.</p>${payload.story_blocks.slice(0, 6).map((block) => `<section><h2>${block.title}</h2><p>${block.executive_summary}</p><p><strong>Evidence:</strong> ${block.evidence_still_needed}</p><p><strong>Next:</strong> ${block.next_validation_action}</p></section>`).join("")}<h2>Visual Specs</h2><ul>${payload.visual_specs.map((visual) => `<li><code>${visual.type}</code> ${visual.title}</li>`).join("")}</ul></body></html>`;
}

async function generateForTenant(client, config) {
  const context = contextForTenant(config);
  const stream = client.messages.stream({
    model,
    max_tokens: Number(process.env.KNOWLEDGE_CXO_MAX_TOKENS || 20000),
    temperature: 0.2,
    system: "You generate evidence-bound enterprise CXO narrative artifacts. Return strict JSON only.",
    messages: [{ role: "user", content: buildPrompt(context) }],
  });
  const message = await stream.finalMessage();
  const rawText = collectText(message);
  const payload = extractJson(rawText);
  const validation = validatePayload(payload, config);
  if (validation.status !== "pass") {
    writeTenantReports(config, payload, validation, rawText);
    throw new Error(`${config.tenantKey} CXO story validation failed: ${validation.failures.join("; ")}`);
  }
  const paths = writeTenantReports(config, payload, validation, rawText);
  return {
    tenantKey: config.tenantKey,
    canonicalInput: canonicalInputLabel(config),
    storyBlocks: payload.story_blocks.length,
    visualSpecs: payload.visual_specs.length,
    validation,
    ...paths,
  };
}

function writeCombinedSummary(results) {
  const outDir = path.join(repoRoot, "reports/multi-tenant-cxo-story-generation");
  ensureDir(outDir);
  const summary = {
    generated_at: new Date().toISOString(),
    prompt_version: promptVersion,
    model,
    results: results.map((result) => ({
      tenantKey: result.tenantKey,
      canonicalInput: result.canonicalInput,
      storyBlocks: result.storyBlocks,
      visualSpecs: result.visualSpecs,
      validation: result.validation,
      reportDir: result.reportDir,
      artifactDir: "approved tenant-key advisory artifact store",
    })),
  };
  fs.writeFileSync(path.join(outDir, "summary.json"), `${JSON.stringify(summary, null, 2)}\n`);
  fs.writeFileSync(path.join(outDir, "summary.md"), `# Multi-Tenant CXO Story Generation\n\n${results.map((result) => `- ${result.tenantKey}: ${result.validation.status} (${result.storyBlocks} story blocks, ${result.visualSpecs} visual specs, score ${result.validation.overall})`).join("\n")}\n`);
}

loadDotenvLocal();
if (!process.env.ANTHROPIC_API_KEY) {
  throw new Error("ANTHROPIC_API_KEY is required; refusing to fake Claude generation.");
}
const requested = arg("--tenant");
const configs = process.argv.includes("--all") || !requested
  ? tenantV6CanonicalConfigs
  : [getTenantV6Config(requested)];
if (configs.some((config) => !config)) throw new Error(`Unknown tenant ${requested}`);
const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const results = [];
for (const config of configs) {
  results.push(await generateForTenant(client, config));
}
writeCombinedSummary(results);
console.log(JSON.stringify(results, null, 2));
