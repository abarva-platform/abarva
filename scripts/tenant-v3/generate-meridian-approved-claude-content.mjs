#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const repoRoot = process.cwd();
const tenantKey = "meridian-health";
const approvedDir = path.join(repoRoot, "datasets/tenant-inputs", tenantKey, "approved-content");
const reportDir = path.join(repoRoot, "reports/meridian-v3-derived-and-claude-layer");
const model = process.env.MERIDIAN_CLAUDE_MODEL || process.env.KNOWLEDGE_CXO_CLAUDE_MODEL || process.env.NEXUS_COMPOSER_MODEL || "claude-sonnet-4-6";
const promptVersion = "meridian-v3-approved-content-v1";
const generatedAt = new Date().toISOString();

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(repoRoot, relativePath), "utf8"));
}

function writeJson(filePath, data) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`);
}

function collectText(message) {
  return (message.content || []).map((part) => part.text || "").join("\n").trim();
}

function extractJson(text) {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const raw = fenced ? fenced[1] : text;
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start < 0 || end < start) throw new Error(`Claude response did not contain a JSON object: ${text.slice(0, 300)}`);
  return JSON.parse(raw.slice(start, end + 1));
}

async function callClaude(system, payload, maxTokens = 6000) {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error("ANTHROPIC_API_KEY is required for approved Claude content generation.");
  }
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    signal: AbortSignal.timeout(Number(process.env.MERIDIAN_CLAUDE_TIMEOUT_MS || 120000)),
    body: JSON.stringify({
      model,
      max_tokens: maxTokens,
      temperature: 0.15,
      system,
      messages: [{ role: "user", content: JSON.stringify(payload) }],
    }),
  });
  const text = await response.text();
  if (!response.ok) {
    throw new Error(`Claude generation failed ${response.status}: ${text.slice(0, 400)}`);
  }
  const message = JSON.parse(text);
  const rawText = collectText(message);
  return { rawText, parsed: extractJson(rawText) };
}

function compactStoryBlocks(blocks) {
  return blocks.map((block) => ({
    story_block_id: block.story_block_id,
    section: block.section,
    title: block.title,
    executive_summary: block.executive_summary,
    business_meaning: block.business_meaning,
    what_context_reveals: block.what_context_reveals,
    why_it_matters: block.why_it_matters,
    evidence_boundary: block.evidence_boundary,
    recommended_next_action: block.recommended_next_action,
    financial_posture: block.financial_posture,
    measurement_posture: block.measurement_posture,
    value_claim_boundary: block.value_claim_boundary,
    cio_implication: block.cio_implication,
    cfo_implication: block.cfo_implication,
    ref_counts: {
      source_fact_ids: block.source_fact_ids?.length ?? 0,
      evidence_ids: block.evidence_ids?.length ?? 0,
      gap_ids: block.gap_ids?.length ?? 0,
    },
  }));
}

function compactVisuals(visuals) {
  return visuals.map((visual) => ({
    visual_spec_id: visual.visual_spec_id,
    visual_type: visual.visual_type,
    title: visual.title,
    business_question: visual.business_question,
    data_requirements: visual.data_requirements,
    safety_notes: visual.safety_notes,
    render_payload_shape: Array.isArray(visual.render_payload)
      ? { kind: "array", rows: visual.render_payload.length }
      : { kind: "object", keys: Object.keys(visual.render_payload || {}) },
  }));
}

function validateNarrativePatch(module, patch, expectedIds) {
  if (!Array.isArray(patch.story_blocks)) throw new Error(`${module} Claude output missing story_blocks array`);
  const ids = new Set(patch.story_blocks.map((block) => block.story_block_id));
  for (const id of expectedIds) {
    if (!ids.has(id)) throw new Error(`${module} Claude output missing story block ${id}`);
  }
}

function validateVisualPatch(module, patch, expectedIds) {
  if (!Array.isArray(patch.visual_specs)) throw new Error(`${module} Claude output missing visual_specs array`);
  const ids = new Set(patch.visual_specs.map((visual) => visual.visual_spec_id));
  for (const id of expectedIds) {
    if (!ids.has(id)) throw new Error(`${module} Claude output missing visual spec ${id}`);
  }
}

function mergeStoryBlocks(original, patch) {
  const byId = new Map(patch.story_blocks.map((block) => [block.story_block_id, block]));
  return original.map((block) => {
    const next = byId.get(block.story_block_id) || {};
    return {
      ...block,
      title: next.title || block.title,
      executive_summary: next.executive_summary || block.executive_summary,
      business_meaning: next.business_meaning || block.business_meaning,
      what_context_reveals: next.what_context_reveals || block.what_context_reveals,
      why_it_matters: next.why_it_matters || block.why_it_matters,
      evidence_boundary: next.evidence_boundary || block.evidence_boundary,
      recommended_next_action: next.recommended_next_action || block.recommended_next_action,
      financial_posture: next.financial_posture || block.financial_posture,
      measurement_posture: next.measurement_posture || block.measurement_posture,
      value_claim_boundary: next.value_claim_boundary || block.value_claim_boundary,
      cio_implication: next.cio_implication || block.cio_implication,
      cfo_implication: next.cfo_implication || block.cfo_implication,
      approved_status: "approved_claude_source_grounded",
      generated_at: generatedAt,
      model_version: `${model}:${promptVersion}`,
      content_generation_mode: "claude_narrative_with_deterministic_visual_payload",
    };
  });
}

function mergeVisuals(original, patch) {
  const byId = new Map(patch.visual_specs.map((visual) => [visual.visual_spec_id, visual]));
  return original.map((visual) => {
    const next = byId.get(visual.visual_spec_id) || {};
    return {
      ...visual,
      title: next.title || visual.title,
      business_question: next.business_question || visual.business_question,
      data_requirements: next.data_requirements || visual.data_requirements,
      safety_notes: next.safety_notes || visual.safety_notes,
      approved_status: "approved_claude_source_grounded",
      content_generation_mode: "claude_visual_framing_with_deterministic_payload",
      model_version: `${model}:${promptVersion}`,
    };
  });
}

const homeContext = readJson("datasets/tenant-inputs/meridian-health/derived/module-context/home-context-view.json");
const towerView = readJson("datasets/tenant-inputs/meridian-health/derived/module-context/tower-dashboard-view.json");
const homeStories = readJson("datasets/tenant-inputs/meridian-health/approved-content/home/story-blocks.json");
const homeVisuals = readJson("datasets/tenant-inputs/meridian-health/approved-content/home/visual-specs.json");
const towerStories = readJson("datasets/tenant-inputs/meridian-health/approved-content/tower/story-blocks.json");
const towerVisuals = readJson("datasets/tenant-inputs/meridian-health/approved-content/tower/visual-specs.json");

const sharedRules = [
  "Return strict JSON only. No markdown.",
    "You may improve executive language, sequencing, and business framing.",
    "Keep each rewritten field concise. Prefer one or two direct sentences.",
  "Do not invent facts, dollar values, funding status, readiness, realized value, ROI, savings, finance attestation, or production readiness.",
  "Do not expose raw source IDs, file names, adapter IDs, or internal schema labels in user-facing prose.",
  "Do not use V6, V7, dossier, projection, substrate, bridge, or runtime jargon.",
  "Candidate AI opportunities must remain a portfolio, not one selected hero use case.",
  "Promised value is not realized value. AI spend is non-additive unless explicitly stated otherwise.",
];

const homePayload = {
  module: "home",
  tenant_key: tenantKey,
  rules: sharedRules,
  context_summary: {
    source_contract: homeContext.source_contract,
    status: homeContext.status,
    summary: homeContext.summary,
    module_readiness: homeContext.module_readiness,
    candidate_ai_portfolio_summary: {
      count: homeContext.candidate_ai_opportunity_portfolio?.length,
      business_units: [...new Set((homeContext.candidate_ai_opportunity_portfolio || []).map((row) => row.business_unit))],
      sample_use_cases: (homeContext.candidate_ai_opportunity_portfolio || []).slice(0, 10).map((row) => ({
        business_unit: row.business_unit,
        use_case_name: row.use_case_name,
        funding_status: row.funding_status,
        readiness_status: row.readiness_status,
      })),
    },
  },
  story_blocks_to_rewrite: compactStoryBlocks(homeStories),
  visual_specs_to_frame: compactVisuals(homeVisuals),
  output_shape: {
    story_blocks: [
      {
        story_block_id: "preserve existing ID",
        title: "CXO-facing title",
        executive_summary: "concise executive prose",
        business_meaning: "plain-English implication",
        what_context_reveals: "what the facts support",
        why_it_matters: "why a CXO cares",
        evidence_boundary: "what not to overclaim",
        recommended_next_action: "next action",
      },
    ],
    visual_specs: [
      {
        visual_spec_id: "preserve existing ID",
        title: "CXO-facing visual title",
        business_question: "question this visual answers",
        data_requirements: "plain-English data needed",
        safety_notes: "plain-English caveat",
      },
    ],
  },
};

const towerPayload = {
  module: "tower",
  tenant_key: tenantKey,
  rules: sharedRules,
  context_summary: {
    source_contract: towerView.source_contract,
    status: towerView.status,
    budget_posture: towerView.budget_posture,
    ai_spend_lens: towerView.ai_spend_lens,
    approved_program_count: towerView.approved_programs?.length,
    candidate_ai_portfolio_count: towerView.candidate_ai_opportunities?.length,
    benefits_summary: towerView.sa08_benefits_posture?.summary,
  },
  story_blocks_to_rewrite: compactStoryBlocks(towerStories),
  visual_specs_to_frame: compactVisuals(towerVisuals),
  output_shape: {
    story_blocks: [
      {
        story_block_id: "preserve existing ID",
        title: "CXO-facing title",
        executive_summary: "concise executive prose",
        business_meaning: "plain-English implication",
        financial_posture: "safe financial posture",
        measurement_posture: "measurement boundary",
        value_claim_boundary: "claim boundary",
        cio_implication: "CIO implication",
        cfo_implication: "CFO implication",
      },
    ],
    visual_specs: [
      {
        visual_spec_id: "preserve existing ID",
        title: "CXO-facing visual title",
        business_question: "question this visual answers",
        data_requirements: "plain-English data needed",
        safety_notes: "plain-English caveat",
      },
    ],
  },
};

fs.mkdirSync(reportDir, { recursive: true });
writeJson(path.join(reportDir, "home-claude-prompt.json"), { model, prompt_version: promptVersion, payload: homePayload });
writeJson(path.join(reportDir, "tower-claude-prompt.json"), { model, prompt_version: promptVersion, payload: towerPayload });

const homeResult = await callClaude("You are a senior healthcare CIO/CFO advisor writing governed product copy for AbarVa Home. Return strict JSON only.", homePayload);
const towerResult = await callClaude("You are a senior healthcare CIO/CFO advisor writing governed product copy for AbarVa Tower. Return strict JSON only.", towerPayload);
writeJson(path.join(reportDir, "home-claude-raw-response.json"), { model, raw_text: homeResult.rawText });
writeJson(path.join(reportDir, "tower-claude-raw-response.json"), { model, raw_text: towerResult.rawText });

validateNarrativePatch("home", homeResult.parsed, homeStories.map((block) => block.story_block_id));
validateVisualPatch("home", homeResult.parsed, homeVisuals.map((visual) => visual.visual_spec_id));
validateNarrativePatch("tower", towerResult.parsed, towerStories.map((block) => block.story_block_id));
validateVisualPatch("tower", towerResult.parsed, towerVisuals.map((visual) => visual.visual_spec_id));

const approvedHomeStories = mergeStoryBlocks(homeStories, homeResult.parsed);
const approvedHomeVisuals = mergeVisuals(homeVisuals, homeResult.parsed);
const approvedTowerStories = mergeStoryBlocks(towerStories, towerResult.parsed);
const approvedTowerVisuals = mergeVisuals(towerVisuals, towerResult.parsed);

writeJson(path.join(approvedDir, "home/story-blocks.json"), approvedHomeStories);
writeJson(path.join(approvedDir, "home/visual-specs.json"), approvedHomeVisuals);
writeJson(path.join(approvedDir, "tower/story-blocks.json"), approvedTowerStories);
writeJson(path.join(approvedDir, "tower/visual-specs.json"), approvedTowerVisuals);

console.log(JSON.stringify({
  status: "generated",
  model,
  prompt_version: promptVersion,
  home_story_blocks: approvedHomeStories.length,
  home_visual_specs: approvedHomeVisuals.length,
  tower_story_blocks: approvedTowerStories.length,
  tower_visual_specs: approvedTowerVisuals.length,
}, null, 2));
