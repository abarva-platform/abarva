#!/usr/bin/env node
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
const repoRoot = process.cwd();
const reportDir = path.join(repoRoot, "reports/home-knowledge-pack-v2");
const promptVersion = "home-knowledge-pack-v3-story-architecture-20260722";
const generatorVersion = "home-pack-v3-story-builder-20260722";
const artifactType = "NexusHomeKnowledgePackV2";
const NARRATIVE_TYPES = new Set(["industry_movement", "new_way_of_operating", "change_thesis"]);
const CLASSIFICATIONS = new Set(["loaded_fact", "derived_measure", "industry_pattern", "strategic_inference", "missing_evidence"]);

const jsonColumnsByTable = new Map([
  ["home_knowledge_packs", new Set(["source_context", "render_pack", "quality_report", "validation_issues"])],
  ["home_knowledge_dimensions", new Set(["covers", "sources", "metadata"])],
  ["home_knowledge_dimension_rows", new Set(["display_payload", "evidence_refs"])],
  ["home_knowledge_use_cases", new Set(["supporting_dimensions", "required_context", "evidence_refs", "source_payload"])],
  ["home_knowledge_evidence_sources", new Set(["parsed_into_dimensions", "lineage", "source_payload"])],
  ["home_knowledge_relationship_nodes", new Set(["display_payload", "evidence_refs"])],
  ["home_knowledge_relationship_edges", new Set(["evidence_refs", "display_payload"])],
  ["home_knowledge_narratives", new Set(["evidence_refs"])],
  ["home_knowledge_executive_read", new Set(["strengths", "constraints", "industry_forces", "tenant_reality", "horizons"])],
  ["home_knowledge_pack_tier", new Set(["tier_conditions"])],
  ["home_knowledge_ai_readiness", new Set(["evidence_refs"])],
  ["home_knowledge_dimension_module_implications", new Set(["evidence_refs"])],
  ["home_knowledge_next_evidence_requests", new Set([])],
  ["home_knowledge_strategic_narratives", new Set(["affected_entities", "dependencies", "evidence_refs"])],
]);

const insertColumnsByTable = new Map([
  ["home_knowledge_dimensions", [
    "pack_id", "tenant_key", "dimension_key", "display_name", "record_count", "evidence_count",
    "confidence_status", "pct", "executive_summary", "cxo_meaning", "why_it_matters", "visual_type",
    "covers", "sources", "metadata", "sort_order",
  ]],
  ["home_knowledge_dimension_rows", [
    "pack_id", "tenant_key", "dimension_key", "source_record_id", "display_name", "display_summary",
    "facet_1", "facet_2", "status", "confidence", "display_payload", "evidence_refs", "source_file", "sort_order",
  ]],
  ["home_knowledge_use_cases", [
    "pack_id", "tenant_key", "use_case_key", "name", "business_function", "owner_hint", "stage",
    "industry_pattern", "client_context_signal", "why_now", "operating_model_change", "change_strategy",
    "value_thesis", "readiness_barrier", "evidence_gate", "priority_rank", "value_score",
    "readiness_score", "evidence_score", "dependency_risk_score", "total_priority_score",
    "priority_rationale", "module_next_step", "supporting_dimensions", "required_context",
    "evidence_refs", "source_payload",
  ]],
  ["home_knowledge_evidence_sources", [
    "pack_id", "tenant_key", "source_id", "source_name", "file_name", "file_type", "storage_uri",
    "byte_size", "row_count", "loaded_by", "loaded_at", "source_date", "source_owner", "source_status",
    "checksum", "parsed_into_dimensions", "lineage", "known_gaps", "source_payload",
  ]],
  ["home_knowledge_relationship_nodes", [
    "pack_id", "tenant_key", "node_key", "node_type", "label", "group_name", "size_score",
    "risk_score", "confidence", "display_payload", "evidence_refs", "sort_order",
  ]],
  ["home_knowledge_relationship_edges", [
    "pack_id", "tenant_key", "edge_key", "from_node_key", "to_node_key", "relationship_type",
    "relationship_strength", "evidence_basis", "confidence", "evidence_refs", "display_payload",
  ]],
  ["home_knowledge_narratives", [
    "pack_id", "tenant_key", "section_key", "dimension_key", "title", "narrative", "generated_by",
    "prompt_version", "evidence_refs", "approval_status", "sort_order",
  ]],
  ["home_knowledge_executive_read", [
    "pack_id", "tenant_key", "archetype", "one_sentence", "tension_headline",
    "context_confidence_pct", "context_confidence_note", "data_foundation_summary",
    "strengths", "constraints", "industry_forces", "tenant_reality", "horizons",
  ]],
  ["home_knowledge_pack_tier", [
    "pack_id", "tenant_key", "tier", "tier_label", "tier_title", "tier_body",
    "tier_conditions", "tier_basis",
  ]],
  ["home_knowledge_ai_readiness", [
    "pack_id", "tenant_key", "readiness_dimension", "score_pct", "tone", "label",
    "basis", "evidence_refs", "sort_order",
  ]],
  ["home_knowledge_dimension_module_implications", [
    "pack_id", "tenant_key", "dimension_key", "module", "implication", "evidence_refs", "sort_order",
  ]],
  ["home_knowledge_next_evidence_requests", [
    "pack_id", "tenant_key", "title", "narrative", "requesting_dimension_key",
    "unlocks_narrative", "requesting_role_hint", "collection_route", "sort_order",
  ]],
  ["home_knowledge_strategic_narratives", [
    "pack_id", "tenant_key", "narrative_type", "title", "classification",
    "executive_narrative", "current_state", "target_state_or_relevance",
    "affected_entities", "value_hypothesis", "dependencies", "evidence_gate",
    "evidence_refs", "confidence", "recommended_next_action", "sort_order",
  ]],
]);

function dbValue(table, column, value) {
  if (jsonColumnsByTable.get(table)?.has(column)) {
    return JSON.stringify(value ?? null);
  }
  return value;
}

function loadEnvFile(file) {
  if (!fs.existsSync(file)) return;
  for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;
    const idx = trimmed.indexOf("=");
    const key = trimmed.slice(0, idx).trim();
    const value = trimmed.slice(idx + 1).trim().replace(/^['"]|['"]$/g, "");
    if (key && process.env[key] === undefined) process.env[key] = value;
  }
}

loadEnvFile(path.resolve(process.cwd(), ".env.local"));
loadEnvFile(path.resolve(process.cwd(), ".env"));

const args = new Set(process.argv.slice(2));
const getArg = (name, fallback = null) => {
  const prefix = `${name}=`;
  const found = process.argv.slice(2).find((arg) => arg.startsWith(prefix));
  return found ? found.slice(prefix.length) : fallback;
};

// HOME_PACK_TENANT takes precedence over the CLI flag so a single tenant can be
// re-run through the operator job without editing the npm script (which pins
// --tenant=all). This matters operationally: the Claude layer is generated over
// two API calls and the forward-looking one can transiently fail, leaving that
// tenant held at 'candidate' by the completeness gate. Without a per-tenant
// override the only way to retry one tenant is to regenerate all of them, which
// re-rolls the dice on tenants that already passed.
const requestedTenant = process.env.HOME_PACK_TENANT || getArg("--tenant", "all");
const writeDb = args.has("--write-db");
const useClaude = args.has("--use-claude");
const approve = args.has("--approve");
const dryRun = args.has("--dry-run") || !writeDb;
const model = getArg("--model", process.env.HOME_KNOWLEDGE_CLAUDE_MODEL ?? "claude-opus-4-8");

function sha256(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function stableKey(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 96) || "item";
}

function asText(value) {
  if (value == null) return "";
  if (Array.isArray(value)) return value.map(asText).filter(Boolean).join(", ");
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

function firstText(record, keys) {
  for (const key of keys) {
    const value = asText(record?.[key]).trim();
    if (value) return value;
  }
  return "";
}

function asArray(value) {
  return Array.isArray(value) ? value.filter((item) => item != null) : [];
}

function numberFromText(value) {
  const raw = asText(value).replace(/[$,]/g, "").trim();
  if (!raw) return 0;
  const n = Number(raw);
  return Number.isFinite(n) ? n : 0;
}

function scoreText(value, patterns) {
  const text = asText(value).toLowerCase();
  return patterns.reduce((score, [pattern, points]) => (
    pattern.test(text) ? score + points : score
  ), 0);
}

function evidenceRefs(record) {
  const refs = record?.evidence_refs ?? record?.evidenceRefs ?? record?.evidence;
  if (Array.isArray(refs)) return refs.map(asText).filter(Boolean);
  const text = asText(refs);
  return text ? text.split(/[;,]/).map((item) => item.trim()).filter(Boolean) : [];
}

function discoverPackFiles() {
  const root = path.join(repoRoot, "datasets/tenant-inputs");
  const tenantOrder = new Map([
    ["meridian-health", 1],
    ["first-capital", 2],
    ["lakeshore-holdings", 3],
    ["skyharbor-air", 4],
    ["apex-retail", 5],
  ]);
  if (!fs.existsSync(root)) return [];
  return fs.readdirSync(root)
    .map((tenant) => ({
      tenant,
      file: path.join(root, tenant, "approved-content/home/design-contract-pack.json"),
    }))
    .filter((item) => fs.existsSync(item.file))
    .filter((item) => requestedTenant === "all" || item.tenant === requestedTenant)
    .sort((a, b) => (tenantOrder.get(a.tenant) ?? 99) - (tenantOrder.get(b.tenant) ?? 99) || a.tenant.localeCompare(b.tenant));
}

const TECHNICAL_NARRATIVE_KEYS = new Set([
  "render_contract",
  "visual_block_contract",
  "content_generation_prompt_path",
  "content_generation_response_path",
  "executive_overview_prompt_path",
  "executive_overview_response_path",
  "design_contract_fidelity",
]);

const BUSINESS_COUNT_DIMENSIONS = new Map([
  ["apps", "applications"],
  ["vendors", "vendors"],
  ["programs", "approved or candidate programs"],
  ["ai", "AI and automation opportunities"],
  ["budget", "budget and value items"],
  ["functions", "business functions"],
  ["workforce", "workforce roles"],
  ["infra", "infrastructure platforms"],
]);

const CLIENT_VISIBLE_PROHIBITED = [
  { level: "P0", name: "raw id", re: /\b(?:record[_\s-]?id|evidence[_\s-]?id|source[_\s-]?id|MER-V\d|FC-V\d|SKY-V\d|LAK-V\d|APX-V\d)\b/i },
  { level: "P0", name: "file or path", re: /\b(?:datasets\/|reports\/|\.csv\b|\.json\b|prompt_path|response_path|source_file|storage_uri)\b/i },
  { level: "P0", name: "technical object", re: /\b(?:json|database|render_pack|design_slots|dimension_rows|home_knowledge_|relationship_nodes|relationship_edges|derivation_method|payload|runtime|packet)\b/i },
  { level: "P1", name: "internal table language", re: /\b(?:database table|raw table|source table|table schema|schema table)\b/i },
  { level: "P1", name: "ingestion count", re: /\b\d[\d,]*\s+(?:(?:source|loaded|candidate|relationship|active)\s+)?(?:rows?|records?|facts?|evidence references?|relationships?|candidates?)\b/i },
  { level: "P1", name: "technical graph count", re: /\b\d[\d,]*\s+(?:nodes?|edges?|graph objects?)\b/i },
  { level: "P1", name: "unsupported top ranking", re: /\btop\s+\d+\b/i },
  {
    level: "P1",
    name: "overclaim",
    re: /\b(?:fully loaded|production-ready|realized savings|achieved ROI|value is real|proven\s+value(?!-))\b/i,
    ignore: (text) =>
      /\b(?:not|not yet|no|none|nothing|without|lacks?|missing|absent|unproven|cannot|should not|must not)\b.{0,80}\b(?:fully loaded|production-ready|realized savings|achieved ROI|proven value)\b/i.test(text) ||
      /\b(?:fully loaded|production-ready|realized savings|achieved ROI|proven value)\b.{0,80}\b(?:not|not yet|no|none|nothing|without|lacks?|missing|absent|unproven|cannot|should not|must not)\b/i.test(text) ||
      /\b(?:aspirational|hypothesis|directional|planning-grade)\b.{0,80}\brather than\b.{0,40}\b(?:fully loaded|production-ready|realized savings|achieved ROI|proven value)\b/i.test(text) ||
      /\bwhether\b.{0,80}\bvalue is real\b.{0,80}\bnot\s+(?:yet\s+)?confirmed\b/i.test(text) ||
      /\bdoes\s+not\s+(?:yet\s+)?confirm\b.{0,100}\bvalue is real\b/i.test(text) ||
      /\bnothing\b.{0,80}\b(?:realized savings|proven value)\b/i.test(text),
  },
];

function cleanExecutiveText(value) {
  let text = asText(value).trim();
  if (!text) return "";
  text = text
    .replace(/\b\d[\d,]*\s+source\s+rows?\b/gi, "a broad source base")
    .replace(/\b\d[\d,]*\s+evidence\s+references?\b/gi, "a broad evidence base")
    .replace(/\b\d[\d,]*\s+(?:(?:active|material)\s+)?relationships?\b/gi, "material relationship paths")
    .replace(/\b\d[\d,]*\s+(?:loaded\s+)?rows?\b/gi, "source-backed context")
    .replace(/\b\d[\d,]*\s+candidate\s+rows?\b/gi, "planning-grade items")
    .replace(/\b\d[\d,]*\s+candidates?\b/gi, "planning-grade items")
    .replace(/\b\d[\d,]*\s+(?:rows?|records?|facts?)\b/gi, "loaded business context")
    .replace(/\b(?:MER|FC|SKY|LAK|APX)-V\d-[A-Z0-9-]+\b/gi, "")
    .replace(/\b(?:record[_\s-]?id|evidence[_\s-]?id|source[_\s-]?id|source_file|render_pack|design_slots|runtime|packet|substrate)\b/gi, "")
    .replace(/\s{2,}/g, " ")
    .trim();
  return text;
}

function cleanStringArray(values, limit = 8) {
  return asArray(values).map(cleanExecutiveText).filter(Boolean).slice(0, limit);
}

function businessScaleFromDimensions(dimensions) {
  return dimensions
    .filter((dimension) => BUSINESS_COUNT_DIMENSIONS.has(dimension.key) && Number(dimension.count) > 0)
    .map((dimension) => ({
      measure: BUSINESS_COUNT_DIMENSIONS.get(dimension.key),
      value: Number(dimension.count),
      business_meaning: cleanExecutiveText(dimension.summary),
    }));
}

function clientSafeRow(row, keys) {
  return Object.fromEntries(
    keys
      .map((key) => [key, cleanExecutiveText(row?.[key])])
      .filter(([, value]) => value),
  );
}

function buildDimensionReads(slots, dimensions) {
  return dimensions.map((dimension) => {
    const story = slots.STORY?.[dimension.key] ?? {};
    const insight = slots.INSIGHTS?.[dimension.key] ?? {};
    return {
      dimension_key: dimension.key,
      display_name: dimension.name,
      business_scale: BUSINESS_COUNT_DIMENSIONS.has(dimension.key) && Number(dimension.count) > 0
        ? { label: BUSINESS_COUNT_DIMENSIONS.get(dimension.key), value: Number(dimension.count) }
        : null,
      loaded_business_context: [
        cleanExecutiveText(dimension.summary),
        cleanExecutiveText(story.meaning),
        cleanExecutiveText(story.observed),
      ].filter(Boolean).slice(0, 4),
      evidence_maturity: cleanExecutiveText(dimension.status) || "directional",
      material_constraints: cleanStringArray(slots.DGAPS?.[dimension.key]?.map((gap) => firstText(gap, ["missing", "blocks", "needed"])) ?? [], 5),
      strategic_implications: cleanStringArray([story.matters, story.supports, ...(insight.findings ?? [])], 5),
      supporting_ref_keys: [
        ...new Set([
          ...evidenceRefs(dimension),
          ...asArray(slots.EVID?.[dimension.key]).flatMap(evidenceRefs),
        ]),
      ].slice(0, 12),
    };
  });
}

function buildMaterialRelationshipPaths(slots) {
  const rel = slots.REL ?? {};
  const fromRel = Object.entries(rel).flatMap(([dimensionKey, value]) => {
    const chain = asArray(value?.chain).map(cleanExecutiveText).filter(Boolean);
    const note = cleanExecutiveText(value?.note);
    if (!chain.length && !note) return [];
    return [{
      path_key: `${dimensionKey}-relationship-path`,
      dimension_key: dimensionKey,
      path: chain.slice(0, 6),
      business_meaning: note || chain[0],
      confidence: "directional",
      supporting_ref_keys: [],
    }];
  });
  return fromRel.slice(0, 24);
}

function buildEvidenceRead(slots, dimensions) {
  const sourceBacked = dimensions.filter((dimension) => /source|high|ready|backed/i.test(asText(dimension.status))).slice(0, 6);
  const weak = dimensions.filter((dimension) => /need|gap|partial|low|candidate/i.test(`${asText(dimension.status)} ${asText(dimension.summary)}`)).slice(0, 8);
  return {
    strongest_areas: sourceBacked.map((dimension) => cleanExecutiveText(`${dimension.name}: ${dimension.summary}`)).filter(Boolean),
    weakest_areas: weak.map((dimension) => cleanExecutiveText(`${dimension.name}: ${dimension.summary}`)).filter(Boolean),
    conflicts: cleanStringArray(slots.GAPS?.map((gap) => firstText(gap, ["title", "blocks", "missing"])) ?? [], 6),
    priority_requests: cleanStringArray(slots.NEXT_EVIDENCE?.map((item) => firstText(item, ["item", "title", "missing", "narrative"])) ?? [], 8),
  };
}

function buildStrategicCandidates(slots) {
  const sourceUseCases = asArray(slots.USE_CASES);
  const genericUseCases =
    sourceUseCases.length > 0 &&
    sourceUseCases.every((item) => /^ai opportunity$/i.test(asText(item.name).trim()) || !asText(item.name).trim());
  const candidateSource = genericUseCases
    ? asArray(slots.DATA?.industry?.rows)
        .map((row) => ({
          name: cleanExecutiveText(asText(row.pattern_name).replace(/\s+industry pattern$/i, "")),
          fn: cleanExecutiveText(firstText(row, ["business_function", "function", "process_area"])),
          context_item: cleanExecutiveText(firstText(row, ["industry_context", "signals", "known_gaps", "context_item"])),
          value_hypothesis: "",
          evidence_gate: cleanExecutiveText(firstText(row, ["known_gaps", "evidence_gate", "required_evidence"])),
          evidence_refs: evidenceRefs(row),
        }))
        .filter((row) => row.name)
        .slice(0, sourceUseCases.length || 8)
    : sourceUseCases;
  return candidateSource.slice(0, 12).map((item, index) => ({
    candidate_key: stableKey(firstText(item, ["name", "use_case_name", "ai_use_case", "business_name"]) || `candidate-${index + 1}`),
    name: cleanExecutiveText(firstText(item, ["name", "use_case_name", "ai_use_case", "business_name"]) || `Strategic change ${index + 1}`),
    business_function: cleanExecutiveText(firstText(item, ["fn", "business_function", "process_area"])),
    current_signal: cleanExecutiveText(firstText(item, ["context_item", "summary", "current_state_notes", "client_context_signal"])),
    value_hypothesis: cleanExecutiveText(firstText(item, ["value", "value_hypothesis", "target_or_promise"])),
    evidence_gate: cleanExecutiveText(firstText(item, ["gate", "evidence_gate", "evidence_needed", "required_data", "risk_controls"])),
    supporting_ref_keys: evidenceRefs(item).slice(0, 8),
  }));
}

function promoteStrategicCandidatesToUseCases(pack, candidates) {
  const sourceUseCases = asArray(pack.design_slots?.USE_CASES);
  if (!sourceUseCases.length || !asArray(candidates).length) return false;
  const genericUseCases = sourceUseCases.every((item) => {
    const name = asText(item.name || item.use_case_name || item.ai_use_case).trim();
    return !name || /^ai opportunity$/i.test(name);
  });
  if (!genericUseCases) return false;
  pack.design_slots = {
    ...(pack.design_slots ?? {}),
    USE_CASES: asArray(candidates).map((candidate, index) => ({
      ...(sourceUseCases[index] ?? {}),
      candidate_key: asText(candidate.candidate_key) || stableKey(candidate.name || `candidate-${index + 1}`),
      name: asText(candidate.name) || `Strategic change ${index + 1}`,
      fn: asText(candidate.business_function),
      business_function: asText(candidate.business_function),
      context_item: asText(candidate.current_signal),
      value_hypothesis: asText(candidate.value_hypothesis),
      gate: asText(candidate.evidence_gate),
      evidence_gate: asText(candidate.evidence_gate),
      evidence_refs: asArray(candidate.supporting_ref_keys).map(asText).filter(Boolean),
    })),
  };
  return true;
}

function buildIndustryPatterns(slots) {
  return asArray(slots.DATA?.industry?.rows).slice(0, 14).map((row) =>
    clientSafeRow(row, ["pattern_name", "industry_context", "signals", "business_function", "relevance", "context_item", "summary"]),
  ).filter((row) => Object.keys(row).length);
}

function scanVisibleText(value, pathPrefix = "root", findings = []) {
  if (value == null) return findings;
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    const text = asText(value);
    for (const rule of CLIENT_VISIBLE_PROHIBITED) {
      if (rule.ignore?.(text)) continue;
      if (rule.re.test(text)) {
        findings.push({ level: rule.level, rule: rule.name, path: pathPrefix, sample: text.slice(0, 280) });
      }
      rule.re.lastIndex = 0;
    }
    return findings;
  }
  if (Array.isArray(value)) {
    value.forEach((item, index) => scanVisibleText(item, `${pathPrefix}[${index}]`, findings));
    return findings;
  }
  if (typeof value === "object") {
    for (const [key, child] of Object.entries(value)) {
      if (/evidence_refs|supporting_ref|audit_refs|source_payload|display_payload|lineage|metadata/i.test(key)) continue;
      scanVisibleText(child, `${pathPrefix}.${key}`, findings);
    }
  }
  return findings;
}

function clientVisibleQualityFindings(normalized, storyArchitecture) {
  return [
    ...scanVisibleText(normalized.pack.render_pack?.narrative_sections, "render_pack.narrative_sections"),
    ...scanVisibleText(normalized.dimensions.map((row) => ({
      executive_summary: row.executive_summary,
      cxo_meaning: row.cxo_meaning,
      why_it_matters: row.why_it_matters,
    })), "home_knowledge_dimensions"),
    ...scanVisibleText(normalized.use_cases.map((row) => ({
      name: row.name,
      industry_pattern: row.industry_pattern,
      client_context_signal: row.client_context_signal,
      why_now: row.why_now,
      operating_model_change: row.operating_model_change,
      change_strategy: row.change_strategy,
      value_thesis: row.value_thesis,
      readiness_barrier: row.readiness_barrier,
      evidence_gate: row.evidence_gate,
      priority_rationale: row.priority_rationale,
      module_next_step: row.module_next_step,
    })), "home_knowledge_use_cases"),
    ...scanVisibleText(normalized.narratives.map((row) => row.narrative), "home_knowledge_narratives"),
    ...scanVisibleText(normalized.executive_read, "home_knowledge_executive_read"),
    ...scanVisibleText(normalized.pack_tier, "home_knowledge_pack_tier"),
    ...scanVisibleText(normalized.ai_readiness.map((row) => ({
      readiness_dimension: row.readiness_dimension,
      label: row.label,
      basis: row.basis,
    })), "home_knowledge_ai_readiness"),
    ...scanVisibleText(normalized.dimension_module_implications.map((row) => row.implication), "home_knowledge_dimension_module_implications"),
    ...scanVisibleText(normalized.next_evidence_requests.map((row) => ({
      title: row.title,
      narrative: row.narrative,
      unlocks_narrative: row.unlocks_narrative,
      requesting_role_hint: row.requesting_role_hint,
      collection_route: row.collection_route,
    })), "home_knowledge_next_evidence_requests"),
    ...scanVisibleText(normalized.strategic_narratives.map((row) => ({
      title: row.title,
      executive_narrative: row.executive_narrative,
      current_state: row.current_state,
      target_state_or_relevance: row.target_state_or_relevance,
      value_hypothesis: row.value_hypothesis,
      dependencies: row.dependencies,
      evidence_gate: row.evidence_gate,
      recommended_next_action: row.recommended_next_action,
    })), "home_knowledge_strategic_narratives"),
    ...scanVisibleText(storyArchitecture, "story_architecture"),
  ];
}

function buildPromptPacket(pack) {
  const slots = pack.design_slots ?? {};
  const dimensions = slots.DIMS ?? [];
  return {
    role: "senior enterprise strategy advisor creating the governed Nexus Home executive brief",
    prompt_version: promptVersion,
    tenant: {
      key: pack.tenant_key,
      name: pack.tenant_name,
      industry: cleanExecutiveText(pack.source_context?.industry ?? slots.DATA?.industry?.rows?.[0]?.industry ?? ""),
      context_boundary: cleanExecutiveText(pack.source_context?.boundary ?? "Synthetic, planning-grade demo context"),
    },
    objective:
      "Use the executive-safe business context to determine the strategy story: what is distinctive, what industry forces matter, how work may need to change, what choices leadership faces, and what evidence gates must clear.",
    required_output_contract: {
      story_architecture: [
        "central_question",
        "governing_thesis",
        "strategic_tensions",
        "chapters",
        "leadership_choices",
        "sequence",
        "decisions_required",
        "evidence_required",
      ],
      use_cases: [
        "name",
        "industry_pattern",
        "client_context_signal",
        "why_now",
        "operating_model_change",
        "change_strategy",
        "value_thesis",
        "readiness_barrier",
        "evidence_gate",
        "priority_rank",
        "priority_rationale",
        "module_next_step",
        "evidence_refs",
      ],
      narratives: [
        "enterprise_brief",
        "operating_model",
        "relationship_map",
        "use_cases",
        "evidence_boundary",
      ],
    },
    ranking_rule:
      "Do not originate a rank. Use priority_rank only when a governed rank or judgment basis is supplied; otherwise use candidate strategic changes.",
    style:
      "Answer-first senior strategy language. The dimensions are evidence behind the story; they are not the storyline.",
    context: {
      enterprise_scale: businessScaleFromDimensions(dimensions),
      enterprise_model: {
        business_segments: cleanStringArray(slots.DATA?.functions?.rows?.map((row) => firstText(row, ["business_function", "function_name", "domain", "business_name"])) ?? [], 12),
        functions: cleanStringArray(slots.DATA?.functions?.rows?.map((row) => firstText(row, ["function_name", "business_function", "context_item"])) ?? [], 12),
        owners: cleanStringArray(slots.DATA?.org?.rows?.map((row) => firstText(row, ["owner", "leader", "business_owner", "context_item"])) ?? [], 12),
        workforce_signals: cleanStringArray(slots.DATA?.workforce?.rows?.map((row) => firstText(row, ["role", "role_name", "context_item", "summary"])) ?? [], 12),
      },
      dimension_reads: buildDimensionReads(slots, dimensions),
      material_relationship_paths: buildMaterialRelationshipPaths(slots),
      evidence_read: buildEvidenceRead(slots, dimensions),
      strategic_candidates: buildStrategicCandidates(slots),
      industry_patterns: buildIndustryPatterns(slots),
      prohibited_claims: [
        "Do not describe ingestion rows, records, facts, evidence-reference counts, relationship-row counts, nodes, or edges in executive narrative.",
        "Do not present target-state platforms as current production capability.",
        "Do not present industry patterns as tenant facts.",
        "Do not present value hypotheses as realized value.",
      ],
      audit_refs: {
        note: "Hidden traceability only. Do not reproduce in narrative text.",
        prompt_source_hash: sha256(JSON.stringify(pack.source_context ?? {})).slice(0, 16),
      },
    },
  };
}

const CLAUDE_NARRATIVE_TOOL_NAME = "submit_home_knowledge_pack_v2_narratives";
const CLAUDE_STORY_TOOL_NAME = "submit_home_knowledge_story_architecture";

function claudeStoryArchitectSystemPrompt() {
  return [
    "NON-NEGOTIABLE PROMPT-FIRST AUTHORSHIP CONTRACT",
    "You are the sole author of all client-visible language returned by this generation. The product will render your client-visible output exactly as returned.",
    "No downstream component will rewrite, shorten, sanitize, summarize, supplement, replace, repair, or complete your output. Do not rely on the renderer or any post-processing step to improve, correct or complete your output.",
    "",
    "STORY ARCHITECT ROLE",
    "You are the senior partner responsible for determining the executive story, not drafting every page.",
    "Do not summarize dimensions one by one. The dimensions are evidence, not the storyline.",
    "",
    "Your task is to determine the single most important strategic argument that emerges from the enterprise facts, industry movements, executive signals, relationships, constraints and evidence gaps.",
    "",
    "FIRST, ANSWER THESE QUESTIONS",
    "1. What is distinctive about this enterprise?",
    "2. What external forces are changing its economics or operating model?",
    "3. What advantage does its current context create?",
    "4. What structural tension or constraint prevents leadership from capturing that advantage?",
    "5. What choices does leadership face?",
    "6. What sequence is most defensible?",
    "7. What cannot yet be concluded safely?",
    "",
    "GOVERNING THESIS",
    "Produce one governing thesis of no more than 60 words. It must contain the enterprise's distinctive position, the central strategic tension, and the resulting leadership implication. Do not write a generic AI-readiness statement.",
    "",
    "STORY STRUCTURE",
    "Build no more than six chapters. Every chapter must advance the governing thesis, answer a different executive question, have an answer-first conclusion headline, contain 2-4 supporting proof points, identify the best exhibit, state the executive implication, state the evidence boundary, and lead logically to the next chapter.",
    "",
    "STRATEGIC TENSION",
    "Identify no more than three tensions, such as ambition versus foundation, strategic importance versus execution readiness, enterprise scale versus fragmented ownership, platform investment versus operating-model change, or adoption versus validated value.",
    "",
    "CHOICES",
    "State the real choices leadership faces. Do not reduce choices to invest or do not invest. Good choices include improve the current process versus redesign the operating model, build a shared foundation first versus prove a bounded workflow first, centralize versus federate ownership, modernize the existing platform versus introduce a new one, or scale now versus gate until evidence improves.",
    "",
    "EXHIBIT REQUIREMENT",
    "For each chapter specify exhibit title, executive question, visual type, entities or measures required, conclusion the exhibit must prove, two or three annotations, and unavailable evidence that could invalidate the conclusion.",
    "",
    "FINAL SEQUENCE",
    "End with Act now, Build next, Scale later, Decisions required, and Evidence required.",
    "",
    "OUTPUT",
    "Return structured JSON only through the tool. Do not write final executive prose. Do not fill dimension pages. Do not enumerate all available facts. Do not expose evidence IDs or internal references in visible language.",
    `Call the ${CLAUDE_STORY_TOOL_NAME} tool exactly once.`,
  ].join("\n");
}

function claudeStoryTool() {
  const stringArray = { type: "array", items: { type: "string" } };
  return {
    name: CLAUDE_STORY_TOOL_NAME,
    description: "Submit the story architecture for the Home executive brief before page-level writing begins.",
    input_schema: {
      type: "object",
      required: ["central_question", "governing_thesis", "strategic_tensions", "chapters", "leadership_choices", "sequence", "decisions_required", "evidence_required"],
      properties: {
        central_question: { type: "string" },
        governing_thesis: { type: "string" },
        strategic_tensions: {
          type: "array",
          items: {
            type: "object",
            required: ["title", "meaning"],
            properties: {
              title: { type: "string" },
              meaning: { type: "string" },
              supporting_refs: stringArray,
            },
          },
        },
        chapters: {
          type: "array",
          items: {
            type: "object",
            required: ["chapter_number", "executive_question", "answer_headline", "proof_points", "strategic_implication", "exhibit", "evidence_boundary"],
            properties: {
              chapter_number: { type: "integer" },
              executive_question: { type: "string" },
              answer_headline: { type: "string" },
              proof_points: stringArray,
              strategic_implication: { type: "string" },
              exhibit: {
                type: "object",
                required: ["visual_type", "title", "conclusion_to_prove"],
                properties: {
                  visual_type: { type: "string" },
                  title: { type: "string" },
                  executive_question: { type: "string" },
                  entities_or_measures_required: stringArray,
                  conclusion_to_prove: { type: "string" },
                  annotations: stringArray,
                  unavailable_evidence_that_could_invalidate: stringArray,
                },
              },
              evidence_boundary: { type: "string" },
              supporting_refs: stringArray,
            },
          },
        },
        leadership_choices: stringArray,
        sequence: {
          type: "object",
          required: ["act_now", "build_next", "scale_later"],
          properties: {
            act_now: stringArray,
            build_next: stringArray,
            scale_later: stringArray,
          },
        },
        decisions_required: stringArray,
        evidence_required: stringArray,
      },
    },
  };
}

function claudeSystemPrompt() {
  return [
    "NON-NEGOTIABLE PROMPT-FIRST AUTHORSHIP CONTRACT",
    "You are the sole author of all client-visible language returned by this generation. The product will render your client-visible output exactly as returned.",
    "No downstream component will rewrite your prose, shorten your prose, summarize your prose, remove inconvenient caveats, replace technical language with business language, invent fallback narrative, create a substitute table from your prose, add a recommendation you did not return, repair an unsupported claim, change your ranking rationale, convert an inference into a fact, remove an evidence boundary, or add a visual conclusion not present in your response.",
    "Therefore, your response must already be complete, client-safe, executive-readable, evidence-grounded, structurally valid, within the stated length limits, and ready for verbatim display.",
    "",
    "ROLE",
    "You are a senior enterprise strategy advisor creating the governed Nexus Home / Knowledge executive brief.",
    "Your job is not to summarize database contents, uploaded files, rows, records, graph objects, evidence inventories, or the source data model.",
    "Your job is to explain what kind of enterprise this is, how it operates, which strengths and constraints matter, how relevant industry movements could affect it, where the business may need to operate differently, which strategic changes deserve leadership attention, what dependencies and evidence gates must be resolved, and what the executive should investigate next.",
    "",
    "INPUT CONTRACT",
    "The supplied packet has already been converted into executive-safe business context. It contains tenant facts, business-scale measures, executive interview signals, dimension-level interpretations, material relationship paths, evidence maturity, industry patterns, strategic candidates, missing evidence, and hidden audit references.",
    "Treat audit references as hidden traceability metadata. Never reproduce them inside narrative text.",
    "",
    "CLIENT-VISIBLE LANGUAGE RULES",
    "Your output will be rendered verbatim to a CEO, CFO, CIO, COO or other business executive.",
    "Never emit source IDs, evidence IDs, filenames, directories, storage paths, JSON, SQL, database, table, schema, prompt, response, renderer, payload, runtime, packet, rows, records, facts, candidate-row counts, relationship_nodes, relationship_edges, derivation_method, source_file, internal field names, raw lifecycle codes, or generic statements about data being loaded.",
    "Do not repeat prohibited language even if it appears in supporting context. Translate technical information into enterprise meaning.",
    "Bad: 3,987 source rows and 208 evidence references are loaded.",
    "Good: Enterprise structure and the system estate are well evidenced; process performance and realized value remain less certain.",
    "Bad: 298 relationship rows connect 241 application records.",
    "Good: The major platforms are connected to priority business domains, but several ownership and dependency paths remain unvalidated.",
    "",
    "NUMBER RULE",
    "A number may appear only when it describes a recognizable enterprise object or business measure, materially helps an executive understand scale, concentration, performance or exposure, and uses a client-friendly unit.",
    "Permitted examples: 241 applications, 96 vendors, $650M IT budget, 12 approved programs, 75/25 run/change posture.",
    "Prohibited examples: 241 rows, 500 records, 208 evidence references, 222 candidate rows, 298 relationship rows.",
    "",
    "TRUTH CLASSIFICATION",
    "Every material conclusion must be classified internally as one of loaded_fact, derived_measure, executive_signal, industry_pattern, strategic_inference, or missing_evidence.",
    "Never present an industry pattern as a tenant fact, a strategic inference as confirmed current state, a value hypothesis as realized value, a target-state platform as production capability, or an interview statement as an approved enterprise decision.",
    "Every strategic inference must identify the loaded facts, executive signals or industry patterns that support it.",
    "",
    "WRITING STANDARD",
    "Use answer-first executive language. Every major section should have a conclusion headline, concise executive read, two or three supporting points, evidence boundary, and next leadership action.",
    "Avoid generic AI enthusiasm, generic unlock value language, repetitive caveats, product promotion, narration of the underlying data model, unsupported certainty, and 19-dimension tours.",
    "",
    "STORY ARCHITECTURE",
    "Use the supplied story_architecture as the governing argument. The dimensions are evidence behind the story; they are not the storyline. Every narrative section must advance the governing thesis.",
    "",
    "OUTPUT BLOCKING",
    "If the requested output cannot be completed within the available evidence or response budget, return generation_status = blocked, blocked_reason, missing_evidence, incomplete_sections, and recommended_regeneration_scope through the tool fields where available. Never return a silently truncated or partially completed pack.",
    "",
    "SELF-CHECK BEFORE RETURNING",
    "Silently verify: one governing thesis; every section advances it; tenant facts are supported; industry patterns are separated from tenant facts; strategic inferences are classified; target-state capability is separated from current state; value hypotheses are separated from realized outcomes; rankings are governed; raw IDs/files/paths/technical object names are absent; raw row/record/fact/candidate counts are absent; relationship explanations are business-readable; evidence gaps tie to blocked decisions; visual specifications are supported; every required field is complete; content is tenant-specific; every chapter answers so what; there is a clear leadership choice or next action.",
    "",
    "WORD BUDGETS (hard limits, do not exceed):",
    "- narratives.enterprise_brief, narratives.operating_model, narratives.relationship_map, narratives.use_cases, narratives.evidence_boundary: 75-130 words each.",
    "- use_cases[].client_context_signal, why_now, operating_model_change, change_strategy, readiness_barrier, evidence_gate, priority_rationale: 22-45 words each.",
    "- use_cases[].industry_pattern, value_thesis: 22-42 words each.",
    "- use_cases[].module_next_step: a short executive-readable fragment, under 15 words.",
    "",
    "Executive-read block (executive_read) -- this fills the top of the CXO cockpit:",
    "- archetype: a 3-8 word enterprise archetype label (e.g. 'Integrated Delivery Network + Health Plan').",
    "- one_sentence: one sentence, <=40 words, that captures what this enterprise is and its defining tension.",
    "- tension_headline: one sentence naming the single strategic tension leadership must resolve.",
    "- strengths[]: 3-5 PROVEN strengths. A strength is only valid if the supplied context shows something actually working, adopted, or covered (not a hope or an intent). Each item: { text, evidence_refs }. If nothing is genuinely proven, return fewer items -- never manufacture a strength.",
    "- constraints[]: 3-6 structural constraints, each { text, evidence_refs }, synthesized at the enterprise level (not raw per-dimension gaps).",
    "- industry_forces[] and tenant_reality[]: two ORDERED, PAIRED lists of equal length (3-6 each). industry_forces[i] is where the industry is moving; tenant_reality[i] is where THIS tenant actually is on that same axis. Each item is a short phrase (<=10 words).",
    "- horizons[]: the defensible leadership sequence, 2-3 entries, each { horizon: 'Act now'|'Build next'|'Prove later' (or similar), tone: 'option'|'evidence'|'watch', items: [2-4 short action phrases] }.",
    "- context_confidence_pct: integer 0-100 reflecting how load-complete and evidence-backed the context is. context_confidence_note: one short sentence explaining it.",
    "- data_foundation_summary: 40-90 words on the data & AI foundation state, honest about what is certified vs aspirational.",
    "",
    "LOAD TIER",
    "- tier: 'thin' | 'partial' | 'rich' based on evidence depth across dimensions. tier_label: a short human label. tier_title + tier_body: what this tier means for the reader. tier_conditions[]: ordered { text } list of what evidence would move it to the next tier. tier_basis: one sentence on why this tier was assigned. Be honest -- a thin tenant must read as thin, not be dressed up as rich.",
    "",
    "AI readiness (ai_readiness) -- ONLY emit a score you can defend:",
    "- 3-6 entries, each { readiness_dimension, score_pct (0-100), tone: 'red'|'amber'|'green', label, basis, evidence_refs }. basis is REQUIRED and must name the specific loaded evidence the score rests on. If you cannot ground a score, omit that dimension entirely. Never fabricate a percentage.",
    "",
    "Per-dimension module implications (dimension_module_implications):",
    "- For material dimensions, 1-3 entries each { dimension_key (echo verbatim from the input dimensions), module: 'intelligence'|'moves'|'source'|'tower', implication (one sentence tying THIS dimension's context to what that module can do), evidence_refs }.",
    "",
    `You must call the ${CLAUDE_NARRATIVE_TOOL_NAME} tool exactly once with your complete executive brief output. Do not return dimension stories, relationship reads, evidence-read objects, use-case qualifications, or strategic narratives in this call; those are authored by separate scoped calls.`,
  ].join("\n");
}

function claudeNarrativeTool() {
  const textWithEvidence = {
    type: "object",
    required: ["text"],
    properties: {
      text: { type: "string" },
      evidence_refs: { type: "array", items: { type: "string" } },
    },
  };
  return {
    name: CLAUDE_NARRATIVE_TOOL_NAME,
    description: "Submit the CXO executive brief narratives, executive-read block, load tier, AI readiness, and per-dimension module implications for this tenant's Home Knowledge Pack.",
    input_schema: {
      type: "object",
      required: ["narratives", "executive_read"],
      properties: {
        generation_status: { type: "string", enum: ["complete", "blocked"] },
        blocked_reason: { type: "string" },
        missing_evidence: { type: "array", items: { type: "string" } },
        incomplete_sections: { type: "array", items: { type: "string" } },
        recommended_regeneration_scope: { type: "string" },
        narratives: {
          type: "object",
          required: ["enterprise_brief", "operating_model", "relationship_map", "use_cases", "evidence_boundary"],
          properties: {
            enterprise_brief: { type: "string" },
            operating_model: { type: "string" },
            relationship_map: { type: "string" },
            use_cases: { type: "string" },
            evidence_boundary: { type: "string" },
          },
        },
        executive_read: {
          type: "object",
          required: ["archetype", "one_sentence", "tension_headline", "strengths", "constraints", "industry_forces", "tenant_reality", "horizons"],
          properties: {
            archetype: { type: "string" },
            one_sentence: { type: "string" },
            tension_headline: { type: "string" },
            context_confidence_pct: { type: "integer" },
            context_confidence_note: { type: "string" },
            data_foundation_summary: { type: "string" },
            strengths: { type: "array", items: textWithEvidence },
            constraints: { type: "array", items: textWithEvidence },
            industry_forces: { type: "array", items: { type: "string" } },
            tenant_reality: { type: "array", items: { type: "string" } },
            horizons: {
              type: "array",
              items: {
                type: "object",
                required: ["horizon", "items"],
                properties: {
                  horizon: { type: "string" },
                  tone: { type: "string" },
                  items: { type: "array", items: { type: "string" } },
                },
              },
            },
          },
        },
        tier: {
          type: "object",
          properties: {
            tier: { type: "string", enum: ["thin", "partial", "rich"] },
            tier_label: { type: "string" },
            tier_title: { type: "string" },
            tier_body: { type: "string" },
            tier_basis: { type: "string" },
            tier_conditions: { type: "array", items: textWithEvidence },
          },
        },
        ai_readiness: {
          type: "array",
          items: {
            type: "object",
            required: ["readiness_dimension", "score_pct", "basis"],
            properties: {
              readiness_dimension: { type: "string" },
              score_pct: { type: "integer" },
              tone: { type: "string", enum: ["red", "amber", "green"] },
              label: { type: "string" },
              basis: { type: "string" },
              evidence_refs: { type: "array", items: { type: "string" } },
            },
          },
        },
        dimension_module_implications: {
          type: "array",
          items: {
            type: "object",
            required: ["dimension_key", "module", "implication"],
            properties: {
              dimension_key: { type: "string" },
              module: { type: "string", enum: ["intelligence", "moves", "source", "tower"] },
              implication: { type: "string" },
              evidence_refs: { type: "array", items: { type: "string" } },
            },
          },
        },
      },
    },
  };
}

// Strategic narratives are their own dedicated call. Folding them into the
// main tool overloaded a single completion (7 output sections) and the last
// section -- these -- got truncated first. A focused call gives the forward-
// looking layer the full token budget and a sharper C-suite prompt.
const CLAUDE_STRATEGIC_TOOL_NAME = "submit_home_knowledge_strategic_narratives";

function claudeStrategicSystemPrompt() {
  return [
    "NON-NEGOTIABLE PROMPT-FIRST AUTHORSHIP CONTRACT",
    "You are the sole author of all client-visible language returned by this generation. The product will render your client-visible output exactly as returned.",
    "No downstream component will rewrite, shorten, sanitize, summarize, supplement, replace, repair, or complete your output. Do not rely on the renderer or any post-processing step to improve, correct or complete your output.",
    "",
    "You are a senior C-suite strategy consultant (think top-tier firm) writing the forward-looking layer of an enterprise knowledge brief for a board pre-read.",
    "Audience: CEO / CFO / CIO / CDAO / COO. This is the 'where the industry is going, how we could operate differently, and what change theses to weigh' section.",
    "",
    "Ground EVERYTHING in THIS tenant's executive-safe packet -- its systems, data, vendors, functions, strategic candidates, constraints, interview signals, industry patterns, material relationship paths, and story architecture. Name specific tenant systems/functions/strategic candidates when they are present. No generic strategy-deck filler.",
    "",
    "Data boundary (synthetic, PHI-free, planning-grade demo context):",
    "- Never claim realized savings, achieved ROI, production readiness, or a completed platform. AWS/Databricks (where present) are target direction, not current.",
    "- Never invent a fact, system, owner, or number not in the supplied context.",
    "- Never write 'proven', 'value is real', 'fully loaded', or 'production-ready' as an assertion. Value is always a HYPOTHESIS until operational + finance validation.",
    "- Product name is Nexus. No AbarVa, raw record/evidence IDs, filenames, paths, JSON, SQL, database/table/schema terms, rows, records, facts, relationship rows, node/edge counts, runtime, packet, payload, or product jargon in prose.",
    "- Use the governing thesis and chapter logic from story_architecture. The dimensions are evidence behind the story; do not write a 19-dimension tour.",
    "",
    "Produce three kinds of strategic narrative (all in one strategic_narratives array, each tagged with narrative_type):",
    "",
    "1. industry_movement (3-5): where the industry is moving that is relevant to this tenant. classification = 'industry_pattern'. current_state = the general industry shift; target_state_or_relevance = why it matters to THIS tenant (name the tenant evidence that makes it relevant); affected_entities = tenant functions/systems/use cases it touches; value_hypothesis; evidence_gate; recommended_next_action. NEVER say the tenant has adopted it -- it is an external force.",
    "",
    "2. new_way_of_operating (3-5) -- fills the 'New Ways of Operating' surface. classification = 'strategic_inference'. A plausible FUTURE operating-model pattern grounded in tenant facts + an industry movement + a real constraint. current_state = how the work is done today (name the systems/functions); target_state_or_relevance = how it could be done (the shift); affected_entities = functions/roles/systems/data/controls it changes; value_hypothesis (a hypothesis, never realized value); dependencies; evidence_gate (the single evidence that makes it decision-grade); recommended_next_action (route to Moves/Intelligence). These are OPTIONS for leadership, explicitly not proven outcomes.",
    "",
    "3. change_thesis (3-5). classification = 'strategic_inference'. A supported change thesis: current enterprise condition -> target operating condition, with the industry force behind it. Fill current_state, target_state_or_relevance, affected_entities, value_hypothesis, dependencies, evidence_gate, recommended_next_action.",
    "",
    "Every entry: executive_narrative = 2-4 crisp sentences (issue -> implication -> decision); confidence = 0-1 honest about supporting evidence; evidence_refs from the context where they exist. Boardroom-grade, tenant-specific, calm, credible, no hype, no unsupported realized-value claims.",
    "The executive_narrative field is mandatory for every entry and is the only long client-visible paragraph for the entry. Do not put the narrative only in current_state, target_state_or_relevance, value_hypothesis, or recommended_next_action.",
    "",
    `Call the ${CLAUDE_STRATEGIC_TOOL_NAME} tool exactly once with your complete strategic_narratives array (aim for 9-15 entries total across the three types).`,
  ].join("\n");
}

function claudeStrategicTool() {
  return {
    name: CLAUDE_STRATEGIC_TOOL_NAME,
    description: "Submit the tenant's forward-looking strategic narratives: industry movements, new ways of operating, and change theses.",
    input_schema: {
      type: "object",
      required: ["strategic_narratives"],
      properties: {
        strategic_narratives: {
          type: "array",
          items: {
            type: "object",
            required: ["narrative_type", "title", "classification", "executive_narrative"],
            properties: {
              narrative_type: { type: "string", enum: ["industry_movement", "new_way_of_operating", "change_thesis"] },
              title: { type: "string" },
              classification: {
                type: "string",
                enum: ["loaded_fact", "derived_measure", "industry_pattern", "strategic_inference", "missing_evidence"],
              },
              executive_narrative: { type: "string" },
              current_state: { type: "string" },
              target_state_or_relevance: { type: "string" },
              affected_entities: { type: "array", items: { type: "string" } },
              value_hypothesis: { type: "string" },
              dependencies: { type: "array", items: { type: "string" } },
              evidence_gate: { type: "string" },
              evidence_refs: { type: "array", items: { type: "string" } },
              confidence: { type: "number" },
              recommended_next_action: { type: "string" },
            },
          },
        },
      },
    },
  };
}

const CLAUDE_USE_CASE_TOOL_NAME = "submit_home_knowledge_use_case_qualifications";
const CLAUDE_DIMENSION_TOOL_NAME = "submit_home_knowledge_dimension_stories";
const CLAUDE_RELATIONSHIP_TOOL_NAME = "submit_home_knowledge_relationship_reads";
const CLAUDE_EVIDENCE_TOOL_NAME = "submit_home_knowledge_evidence_read";

function promptFirstContractBlock() {
  return [
    "NON-NEGOTIABLE PROMPT-FIRST AUTHORSHIP CONTRACT",
    "You are the sole author of all client-visible language returned by this generation.",
    "The product will render your client-visible output exactly as returned.",
    "No downstream component will rewrite, shorten, sanitize, summarize, supplement, replace, repair, or complete your output.",
    "Do not rely on the renderer or any post-processing step to improve, correct or complete your output.",
    "Never emit audit references, source IDs, evidence IDs, filenames, file paths, storage locations, prompt/response paths, database/schema/table terminology, JSON keys, internal lifecycle codes, derivation methods, renderer terminology, packet terminology, rows, records, facts, candidate-row counts, graph node/edge counts, or raw graph object names in client-visible strings.",
    "Never use phrases such as grounding packet, evidence packet, render packet, graph node, graph edge, source object, payload, JSON, schema, table, file, row, record, fact count, or ID in client-visible strings.",
    "Use structured evidence_refs fields only for machine-readable traceability.",
  ].join("\n");
}

function claudeUseCaseSystemPrompt() {
  return [
    promptFirstContractBlock(),
    "",
    "USE-CASE QUALIFIER ROLE",
    "You are qualifying strategic change candidates for a C-suite Home brief.",
    "Do not force every candidate to become a qualified use case. Classify each item as strategic_foundation, operating_model_change_thesis, qualified_use_case, early_idea, or evidence_request.",
    "Do not originate ranks. If no governed rank is supplied, use leadership-attention language rather than top/best/highest-priority language.",
    "If a number lacks currency, unit, period or validation status, omit it from client-visible prose.",
    "For every supplied candidate return exactly one item with the exact candidate_key and current name.",
    `Call the ${CLAUDE_USE_CASE_TOOL_NAME} tool exactly once.`,
  ].join("\n");
}

function claudeUseCaseTool() {
  return {
    name: CLAUDE_USE_CASE_TOOL_NAME,
    description: "Submit scoped qualification for the supplied strategic change candidates.",
    input_schema: {
      type: "object",
      required: ["use_cases"],
      properties: {
        use_cases: {
          type: "array",
          items: {
            type: "object",
            required: [
              "candidate_key",
              "name",
              "classification",
              "industry_pattern",
              "client_context_signal",
              "why_now",
              "operating_model_change",
              "change_strategy",
              "value_thesis",
              "readiness_barrier",
              "evidence_gate",
              "priority_rationale",
              "module_next_step",
            ],
            properties: {
              candidate_key: { type: "string" },
              name: { type: "string" },
              classification: {
                type: "string",
                enum: ["strategic_foundation", "operating_model_change_thesis", "qualified_use_case", "early_idea", "evidence_request"],
              },
              business_workflow_or_decision: { type: "string" },
              industry_pattern: { type: "string" },
              client_context_signal: { type: "string" },
              current_operating_condition: { type: "string" },
              future_operating_condition: { type: "string" },
              human_role_change: { type: "string" },
              systems_data_control_requirements: { type: "array", items: { type: "string" } },
              why_now: { type: "string" },
              operating_model_change: { type: "string" },
              change_strategy: { type: "string" },
              value_thesis: { type: "string" },
              readiness_barrier: { type: "string" },
              evidence_gate: { type: "string" },
              priority_rationale: { type: "string" },
              module_next_step: { type: "string" },
              pilot_probability_band: { type: "string" },
              scale_probability_band: { type: "string" },
              reference_class_basis: { type: "string" },
              baseline_metrics_required: { type: "array", items: { type: "string" } },
              evidence_refs: { type: "array", items: { type: "string" } },
            },
          },
        },
      },
    },
  };
}

function claudeDimensionSystemPrompt() {
  return [
    promptFirstContractBlock(),
    "",
    "DIMENSION WRITER ROLE",
    "You are writing the Knowledge Explorer dimension-level executive reads.",
    "Return exactly one dimension_stories entry for every supplied dimension key. Do not omit thin dimensions.",
    "For each dimension explain what is known, what cannot yet be concluded, why it matters, the specific evidence request, and the next responsible owner/source.",
    "Do not summarize database contents. Translate context into executive meaning.",
    "Never say value is real, proven value, realized savings, production-ready, or fully loaded unless the supplied evidence explicitly proves realized business outcomes or production status. When evidence is incomplete, say the hypothesis is attractive or decision-relevant, not real.",
    `Call the ${CLAUDE_DIMENSION_TOOL_NAME} tool exactly once.`,
  ].join("\n");
}

function claudeDimensionTool() {
  return {
    name: CLAUDE_DIMENSION_TOOL_NAME,
    description: "Submit exact dimension-level executive stories for the supplied dimension batch.",
    input_schema: {
      type: "object",
      required: ["dimension_stories"],
      properties: {
        dimension_stories: {
          type: "array",
          items: {
            type: "object",
            required: ["dimension_key", "answer_headline", "executive_read", "why_it_matters", "evidence_boundary", "next_action"],
            properties: {
              dimension_key: { type: "string" },
              answer_headline: { type: "string" },
              executive_read: { type: "string" },
              why_it_matters: { type: "string" },
              material_strengths: { type: "array", items: { type: "string" } },
              material_constraints: { type: "array", items: { type: "string" } },
              strategic_implications: { type: "array", items: { type: "string" } },
              evidence_boundary: { type: "string" },
              next_action: { type: "string" },
              visual_specification: {
                type: "object",
                properties: {
                  answer_first_title: { type: "string" },
                  visual_type: { type: "string" },
                  conclusion_to_prove: { type: "string" },
                  annotations: { type: "array", items: { type: "string" } },
                  empty_state_behavior: { type: "string" },
                },
              },
              module_implications: {
                type: "array",
                items: {
                  type: "object",
                  required: ["module", "implication"],
                  properties: {
                    module: { type: "string", enum: ["intelligence", "moves", "source", "tower"] },
                    implication: { type: "string" },
                  },
                },
              },
              evidence_refs: { type: "array", items: { type: "string" } },
            },
          },
        },
      },
    },
  };
}

function claudeRelationshipSystemPrompt() {
  return [
    promptFirstContractBlock(),
    "",
    "RELATIONSHIP WRITER ROLE",
    "You are authoring material enterprise graph projections for a CXO Knowledge cockpit.",
    "Do not narrate graph size, source breadth, evidence counts, node counts, edge counts, row counts, record counts, relationship counts, candidate counts, loaded-row counts, or raw relationship mechanics.",
    "Never write phrases such as active relationships, relationship rows, loaded rows, loaded records, candidates, candidate rows, nodes, or edges in client-visible fields. Translate them into business meaning, such as material dependency paths, ownership gaps, unvalidated handoffs, or evidence-backed connection families.",
    "Generate a small number of material graph projections: enterprise structure, operating model, technology dependency, change impact, value realization, and evidence lineage where supported.",
    "For each projection explain the business meaning, what it enables, dependencies, constraints, unresolved relationships, affected changes, evidence boundary, and next action.",
    `Call the ${CLAUDE_RELATIONSHIP_TOOL_NAME} tool exactly once.`,
  ].join("\n");
}

function claudeRelationshipTool() {
  return {
    name: CLAUDE_RELATIONSHIP_TOOL_NAME,
    description: "Submit material relationship projections for the Home graph/relationship tabs.",
    input_schema: {
      type: "object",
      required: ["relationship_reads"],
      properties: {
        relationship_reads: {
          type: "array",
          items: {
            type: "object",
            required: ["projection_key", "answer_headline", "business_meaning", "evidence_boundary", "next_action"],
            properties: {
              projection_key: { type: "string" },
              projection_type: { type: "string" },
              dimension_key: { type: "string" },
              answer_headline: { type: "string" },
              material_path: { type: "array", items: { type: "string" } },
              business_meaning: { type: "string" },
              enables: { type: "array", items: { type: "string" } },
              dependencies: { type: "array", items: { type: "string" } },
              constraints: { type: "array", items: { type: "string" } },
              unresolved_relationships: { type: "array", items: { type: "string" } },
              affected_changes: { type: "array", items: { type: "string" } },
              evidence_boundary: { type: "string" },
              next_action: { type: "string" },
              evidence_refs: { type: "array", items: { type: "string" } },
            },
          },
        },
      },
    },
  };
}

function claudeEvidenceSystemPrompt() {
  return [
    promptFirstContractBlock(),
    "",
    "EVIDENCE WRITER ROLE",
    "You are writing the executive evidence boundary for the Home cockpit.",
    "Do not narrate files, rows, IDs, ingestion status, or source inventory mechanics.",
    "Explain strongest areas, weakest areas, freshness, conflicts, unsupported assumptions, client-to-confirm items, priority requests, owner/source for each request, decision blocked by every missing item, and impact on Intelligence, Moves, Source and Tower.",
    `Call the ${CLAUDE_EVIDENCE_TOOL_NAME} tool exactly once.`,
  ].join("\n");
}

function claudeEvidenceTool() {
  return {
    name: CLAUDE_EVIDENCE_TOOL_NAME,
    description: "Submit the executive evidence read and priority requests.",
    input_schema: {
      type: "object",
      required: ["evidence_read"],
      properties: {
        evidence_read: {
          type: "object",
          required: ["answer_headline", "strongest_areas", "weakest_areas", "priority_requests"],
          properties: {
            answer_headline: { type: "string" },
            strongest_areas: { type: "array", items: { type: "string" } },
            weakest_areas: { type: "array", items: { type: "string" } },
            freshness: { type: "string" },
            conflicts: { type: "array", items: { type: "string" } },
            unsupported_assumptions: { type: "array", items: { type: "string" } },
            client_to_confirm: { type: "array", items: { type: "string" } },
            priority_requests: {
              type: "array",
              items: {
                type: "object",
                required: ["request", "why_it_matters", "decision_blocked"],
                properties: {
                  request: { type: "string" },
                  why_it_matters: { type: "string" },
                  decision_blocked: { type: "string" },
                  owner_hint: { type: "string" },
                  source_hint: { type: "string" },
                  module_impact: { type: "array", items: { type: "string" } },
                },
              },
            },
          },
        },
      },
    },
  };
}

function anthropicClient(Anthropic) {
  return new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
    timeout: Number(process.env.HOME_KNOWLEDGE_CLAUDE_TIMEOUT_MS || 180000),
  });
}

// One forced-tool-use call with retry/backoff. Reused by every scoped call.
async function invokeClaudeTool(client, { tool, system, promptPacket, maxTokens }) {
  const maxAttempts = 3;
  let lastError = null;
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      console.error(`[home-pack-v3] ${tool.name} attempt ${attempt} start`);
      const message = await client.messages.create({
        model,
        max_tokens: maxTokens,
        system,
        messages: [{ role: "user", content: JSON.stringify(promptPacket) }],
        tools: [tool],
        tool_choice: { type: "tool", name: tool.name },
      });
      const toolUse = message.content.find((block) => block.type === "tool_use" && block.name === tool.name);
      if (!toolUse) throw new Error(`Claude response did not include the expected tool_use block (${tool.name}).`);
      console.error(`[home-pack-v3] ${tool.name} attempt ${attempt} complete stop=${message.stop_reason}`);
      if (toolUse.input && typeof toolUse.input === "object") {
        Object.defineProperty(toolUse.input, "__provider_metadata", {
          enumerable: false,
          value: {
            response_id: message.id,
            model: message.model,
            role: message.role,
            stop_reason: message.stop_reason,
            stop_sequence: message.stop_sequence ?? null,
            usage: message.usage ?? null,
            tool_name: tool.name,
            tool_use_id: toolUse.id ?? null,
            tool_input_keys: Object.keys(toolUse.input ?? {}),
          },
        });
      }
      return toolUse.input;
    } catch (error) {
      lastError = error;
      // Retry on rate limits, server errors, AND transient network/timeout
      // errors (no HTTP status: ECONNRESET, ETIMEDOUT, socket hang up, the SDK
      // 'Request timed out'). The generation call is idempotent, and these
      // no-status transients on the back-to-back second call were the cause of
      // intermittent empty strategic_narratives.
      const status = typeof error?.status === "number" ? error.status : null;
      const retryable = status === null || status === 429 || status === 408 || status >= 500;
      if (!retryable || attempt === maxAttempts) break;
      await new Promise((resolve) => setTimeout(resolve, attempt * 2000));
    }
  }
  throw new Error(`Claude call failed for ${tool.name} after ${maxAttempts} attempt(s): ${lastError?.message ?? lastError}`);
}

function providerMetadata(value) {
  return value && typeof value === "object" ? value.__provider_metadata ?? null : null;
}

function attachProviderMetadata(value, metadata) {
  if (!value || typeof value !== "object" || !metadata) return value;
  Object.defineProperty(value, "__provider_metadata", {
    enumerable: false,
    value: metadata,
  });
  return value;
}

function missingExpectedKeys(rows, expectedKeys, keyField) {
  const found = new Set(asArray(rows).map((row) => asText(row?.[keyField]).trim()).filter(Boolean));
  return asArray(expectedKeys).map(asText).filter(Boolean).filter((key) => !found.has(key));
}

function visibleStrategicNarratives(rows) {
  return asArray(rows).filter((row) =>
    NARRATIVE_TYPES.has(asText(row.narrative_type).trim()) &&
    asText(row.title).trim() &&
    asText(row.executive_narrative).trim(),
  );
}

async function callClaudeForStoryArchitecture(promptPacket) {
  if (!useClaude || !process.env.ANTHROPIC_API_KEY) return null;
  const Anthropic = (await import("@anthropic-ai/sdk")).default;
  const result = await invokeClaudeTool(anthropicClient(Anthropic), {
    tool: claudeStoryTool(),
    system: claudeStoryArchitectSystemPrompt(),
    promptPacket,
    maxTokens: Number(process.env.HOME_KNOWLEDGE_STORY_MAX_TOKENS || 8000),
  });
  return result;
}

async function callClaudeForUseCaseQualifications(promptPacket) {
  if (!useClaude || !process.env.ANTHROPIC_API_KEY) return [];
  const candidates = asArray(promptPacket.context?.strategic_candidates);
  if (!candidates.length) return [];
  const Anthropic = (await import("@anthropic-ai/sdk")).default;
  const result = await invokeClaudeTool(anthropicClient(Anthropic), {
    tool: claudeUseCaseTool(),
    system: claudeUseCaseSystemPrompt(),
    promptPacket: {
      tenant: promptPacket.tenant,
      story_architecture: promptPacket.story_architecture,
      industry_patterns: promptPacket.context?.industry_patterns,
      evidence_read: promptPacket.context?.evidence_read,
      strategic_candidates: candidates,
      expected_manifest: {
        expected_candidate_count: candidates.length,
        candidate_keys: candidates.map((candidate) => candidate.candidate_key),
      },
    },
    maxTokens: Number(process.env.HOME_KNOWLEDGE_USE_CASE_MAX_TOKENS || 10000),
  });
  return attachProviderMetadata(asArray(result?.use_cases), providerMetadata(result));
}

const DIMENSION_BATCHES = [
  {
    batch_key: "enterprise_people",
    dimension_keys: ["profile", "functions", "org", "workforce"],
  },
  {
    batch_key: "technology_ecosystem",
    dimension_keys: ["apps", "data", "infra", "vendors", "ms"],
  },
  {
    batch_key: "change_value",
    dimension_keys: ["budget", "programs", "ai", "metrics"],
  },
  {
    batch_key: "risk_trust_interpretation",
    dimension_keys: ["risks", "rel", "evidence", "industry", "lenses", "opev"],
  },
];

async function callClaudeForDimensionStories(promptPacket) {
  if (!useClaude || !process.env.ANTHROPIC_API_KEY) return [];
  const allDimensions = asArray(promptPacket.context?.dimension_reads);
  if (!allDimensions.length) return [];
  const Anthropic = (await import("@anthropic-ai/sdk")).default;
  const all = [];
  for (const batch of DIMENSION_BATCHES) {
    const dimensions = allDimensions.filter((dimension) => batch.dimension_keys.includes(asText(dimension.dimension_key)));
    if (!dimensions.length) continue;
    const expectedKeys = dimensions.map((dimension) => asText(dimension.dimension_key));
    let acceptedRows = [];
    let acceptedMetadata = null;
    let previousFindings = [];
    for (let attempt = 1; attempt <= 3; attempt += 1) {
      const result = await invokeClaudeTool(anthropicClient(Anthropic), {
        tool: claudeDimensionTool(),
        system: claudeDimensionSystemPrompt(),
        promptPacket: {
          tenant: promptPacket.tenant,
          story_architecture: promptPacket.story_architecture,
          batch_key: batch.batch_key,
          dimensions,
          material_relationship_paths: promptPacket.context?.material_relationship_paths,
          evidence_read: promptPacket.context?.evidence_read,
          expected_manifest: {
            expected_dimension_story_count: dimensions.length,
            dimension_keys: expectedKeys,
          },
          previous_attempt_missing_dimension_keys:
            attempt === 1 ? [] : missingExpectedKeys(acceptedRows, expectedKeys, "dimension_key"),
          previous_attempt_client_visible_findings: previousFindings,
        },
        maxTokens: Number(process.env.HOME_KNOWLEDGE_DIMENSION_MAX_TOKENS || 9000),
      });
      acceptedRows = asArray(result?.dimension_stories);
      acceptedMetadata = providerMetadata(result);
      const missing = missingExpectedKeys(acceptedRows, expectedKeys, "dimension_key");
      previousFindings = scanVisibleText(
        acceptedRows.map((row) => ({
          dimension_key: row.dimension_key,
          answer_headline: row.answer_headline,
          executive_read: row.executive_read,
          why_it_matters: row.why_it_matters,
          material_strengths: row.material_strengths,
          material_constraints: row.material_constraints,
          strategic_implications: row.strategic_implications,
          evidence_boundary: row.evidence_boundary,
          next_action: row.next_action,
        })),
        `${batch.batch_key}.dimension_stories`,
      ).filter((finding) => finding.level === "P0" || finding.level === "P1");
      if (missing.length === 0 && previousFindings.length === 0) break;
      console.error(`[dimension-stories] ${batch.batch_key} attempt ${attempt} incomplete; missing=${missing.join(",") || "none"} findings=${JSON.stringify(previousFindings.slice(0, 3))}`);
    }
    all.push(...acceptedRows);
    if (acceptedMetadata) {
      all.__provider_metadata = [
        ...(all.__provider_metadata ?? []),
        acceptedMetadata,
      ];
    }
  }
  return all;
}

async function callClaudeForRelationshipReads(promptPacket) {
  if (!useClaude || !process.env.ANTHROPIC_API_KEY) return [];
  const Anthropic = (await import("@anthropic-ai/sdk")).default;
  let acceptedRows = [];
  let acceptedMetadata = null;
  let previousFindings = [];
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    const result = await invokeClaudeTool(anthropicClient(Anthropic), {
      tool: claudeRelationshipTool(),
      system: claudeRelationshipSystemPrompt(),
      promptPacket: {
        tenant: promptPacket.tenant,
        story_architecture: promptPacket.story_architecture,
        material_relationship_paths: promptPacket.context?.material_relationship_paths,
        strategic_candidates: promptPacket.context?.strategic_candidates,
        evidence_read: promptPacket.context?.evidence_read,
        expected_manifest: {
          required_projection_types: [
            "enterprise_structure",
            "operating_model",
            "technology_dependency",
            "change_impact",
            "value_realization",
            "evidence_lineage",
          ],
        },
        previous_attempt_client_visible_findings: previousFindings,
      },
      maxTokens: Number(process.env.HOME_KNOWLEDGE_RELATIONSHIP_MAX_TOKENS || 8000),
    });
    acceptedRows = asArray(result?.relationship_reads);
    acceptedMetadata = providerMetadata(result);
    previousFindings = scanVisibleText(
      acceptedRows.map((row) => ({
        projection_key: row.projection_key,
        answer_headline: row.answer_headline,
        business_meaning: row.business_meaning,
        enables: row.enables,
        dependencies: row.dependencies,
        constraints: row.constraints,
        unresolved_relationships: row.unresolved_relationships,
        affected_changes: row.affected_changes,
        evidence_boundary: row.evidence_boundary,
        next_action: row.next_action,
      })),
      "relationship_reads",
    ).filter((finding) => finding.level === "P0" || finding.level === "P1");
    if (acceptedRows.length && previousFindings.length === 0) break;
    console.error(`[relationship-reads] attempt ${attempt} incomplete; rows=${acceptedRows.length} findings=${JSON.stringify(previousFindings.slice(0, 3))}`);
  }
  return attachProviderMetadata(acceptedRows, acceptedMetadata);
}

async function callClaudeForEvidenceRead(promptPacket) {
  if (!useClaude || !process.env.ANTHROPIC_API_KEY) return null;
  const Anthropic = (await import("@anthropic-ai/sdk")).default;
  const result = await invokeClaudeTool(anthropicClient(Anthropic), {
    tool: claudeEvidenceTool(),
    system: claudeEvidenceSystemPrompt(),
    promptPacket: {
      tenant: promptPacket.tenant,
      story_architecture: promptPacket.story_architecture,
      evidence_read: promptPacket.context?.evidence_read,
      dimension_reads: promptPacket.context?.dimension_reads,
      strategic_candidates: promptPacket.context?.strategic_candidates,
      expected_manifest: {
        required_singletons: ["evidence_read"],
      },
    },
    maxTokens: Number(process.env.HOME_KNOWLEDGE_EVIDENCE_MAX_TOKENS || 8000),
  });
  return attachProviderMetadata(result?.evidence_read ?? null, providerMetadata(result));
}

// Dedicated forward-looking call: industry movements, new ways of operating,
// change theses. Kept separate from the main pack call so it gets the full
// token budget and a focused C-suite prompt. Never blocks the pack -- a
// failure here logs and returns [] so the rest of the pack still ships.
async function callClaudeForStrategicNarratives(promptPacket) {
  if (!useClaude || !process.env.ANTHROPIC_API_KEY) return [];
  try {
    const Anthropic = (await import("@anthropic-ai/sdk")).default;
    let acceptedRows = [];
    let acceptedMetadata = null;
    let previousMissing = [];
    for (let attempt = 1; attempt <= 3; attempt += 1) {
      const result = await invokeClaudeTool(anthropicClient(Anthropic), {
        tool: claudeStrategicTool(),
        system: claudeStrategicSystemPrompt(),
        promptPacket: {
          ...promptPacket,
          previous_attempt_missing_required_fields: previousMissing,
        },
        maxTokens: Number(process.env.HOME_KNOWLEDGE_STRATEGIC_MAX_TOKENS || 12000),
      });
      acceptedRows = asArray(result?.strategic_narratives);
      acceptedMetadata = providerMetadata(result);
      const visibleRows = visibleStrategicNarratives(acceptedRows);
      previousMissing = acceptedRows
        .map((row, index) => ({
          index,
          title: asText(row.title),
          missing: [
            asText(row.narrative_type).trim() ? "" : "narrative_type",
            asText(row.title).trim() ? "" : "title",
            asText(row.executive_narrative).trim() ? "" : "executive_narrative",
          ].filter(Boolean),
        }))
        .filter((row) => row.missing.length);
      if (process.env.HOME_KNOWLEDGE_DEBUG) {
        console.error(`[strategic-narratives] attempt ${attempt} returned ${acceptedRows.length} entries; storable=${visibleRows.length}`);
      }
      if (visibleRows.length >= 6 && previousMissing.length === 0) break;
      console.error(`[strategic-narratives] attempt ${attempt} incomplete: storable=${visibleRows.length}, missing=${JSON.stringify(previousMissing.slice(0, 5))}`);
    }
    return attachProviderMetadata(acceptedRows, acceptedMetadata);
  } catch (error) {
    console.error(`[strategic-narratives] generation failed (non-fatal): ${error?.message ?? error}`);
    return [];
  }
}

async function callClaudeForPack(promptPacket) {
  if (!useClaude) return null;
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error("ANTHROPIC_API_KEY is required for --use-claude; refusing to fabricate narrative content.");
  }
  const Anthropic = (await import("@anthropic-ai/sdk")).default;
  const client = anthropicClient(Anthropic);
  const tool = claudeNarrativeTool();
  const maxAttempts = 3;
  let lastError = null;
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      console.error(`[home-pack-v3] ${tool.name} attempt ${attempt} start`);
      const message = await client.messages.create({
        model,
        max_tokens: Number(process.env.HOME_KNOWLEDGE_CLAUDE_MAX_TOKENS || 12000),
        system: claudeSystemPrompt(),
        messages: [{ role: "user", content: JSON.stringify(promptPacket) }],
        tools: [tool],
        tool_choice: { type: "tool", name: tool.name },
      });
      const toolUse = message.content.find((block) => block.type === "tool_use" && block.name === tool.name);
      if (!toolUse) throw new Error("Claude response did not include the expected tool_use block.");
      console.error(`[home-pack-v3] ${tool.name} attempt ${attempt} complete stop=${message.stop_reason}`);
      if (toolUse.input && typeof toolUse.input === "object") {
        Object.defineProperty(toolUse.input, "__provider_metadata", {
          enumerable: false,
          value: {
            response_id: message.id,
            model: message.model,
            role: message.role,
            stop_reason: message.stop_reason,
            stop_sequence: message.stop_sequence ?? null,
            usage: message.usage ?? null,
            tool_name: tool.name,
            tool_use_id: toolUse.id ?? null,
            tool_input_keys: Object.keys(toolUse.input ?? {}),
          },
        });
      }
      return toolUse.input;
    } catch (error) {
      lastError = error;
      const status = typeof error?.status === "number" ? error.status : null;
      const retryable = status === null || status === 429 || status === 408 || status >= 500;
      if (!retryable || attempt === maxAttempts) break;
      await new Promise((resolve) => setTimeout(resolve, attempt * 2000));
    }
  }
  throw new Error(`Claude call failed for narrative generation after ${maxAttempts} attempt(s): ${lastError?.message ?? lastError}`);
}

function mergeClaudeNarrativesIntoPack(pack, claudeResult) {
  const useCaseItems = pack.design_slots?.USE_CASES ?? [];
  if (!claudeResult) return { matched: 0, total: useCaseItems.length, dimImplications: 0 };
  pack.narrative_sections = { ...(pack.narrative_sections ?? {}), ...(claudeResult.narratives ?? {}) };
  pack.generated_model = `${pack.generated_model ?? "approved-json-pack"} + claude:${model}`;
  // Brief-model structures land on the pack under a stable key so
  // normalizePack can lift them into the v4 tables. These are authored,
  // not deterministically derived, so they only exist when Claude ran.
  pack.brief_model = {
    executive_read: claudeResult.executive_read ?? null,
    dimension_stories: asArray(claudeResult.dimension_stories),
    relationship_reads: asArray(claudeResult.relationship_reads),
    evidence_read: claudeResult.evidence_read ?? null,
    tier: claudeResult.tier ?? null,
    ai_readiness: asArray(claudeResult.ai_readiness),
    dimension_module_implications: asArray(claudeResult.dimension_module_implications),
    // strategic_narratives come from their own dedicated call (see
    // normalizePack); seed empty here so the shape is stable.
    strategic_narratives: [],
  };
  // Match Claude's use cases back to source records by name, but fall back to
  // array position when the source names are non-unique. Several source packs
  // (e.g. SkyHarbor) label every use case identically ("AI opportunity"), so a
  // name key can't disambiguate -- and Claude, correctly, authors distinct
  // names that then match nothing. Claude returns use cases in priority order,
  // so positional matching is the reliable fallback there.
  const nameCounts = new Map();
  for (const item of useCaseItems) {
    const key = firstText(item, ["name", "use_case_name", "ai_use_case", "business_name"]).toLowerCase().trim();
    nameCounts.set(key, (nameCounts.get(key) ?? 0) + 1);
  }
  const byCandidateKey = new Map(
    useCaseItems
      .map((item) => [asText(item.candidate_key || item.use_case_key).toLowerCase().trim(), item])
      .filter(([key]) => key),
  );
  const byUniqueName = new Map(
    useCaseItems
      .map((item) => [firstText(item, ["name", "use_case_name", "ai_use_case", "business_name"]).toLowerCase().trim(), item])
      .filter(([key]) => key && nameCounts.get(key) === 1),
  );
  const claudeUseCases = asArray(claudeResult.use_cases);
  const claudeNamesUnique = new Set(claudeUseCases.map((e) => asText(e.name).toLowerCase().trim())).size === claudeUseCases.length;
  // Every source name is a non-unique placeholder (SkyHarbor labels all 8
  // "AI opportunity") -- name matching is impossible either way, and Claude,
  // told to echo the name, echoes the same placeholder back. In that
  // degenerate case, Claude's priority-ordered array position is the only
  // usable signal, so go positional even though the echoed names aren't unique.
  const sourceNamesAllCollide = byUniqueName.size === 0 && useCaseItems.length > 0;
  // Positional matching is safe when the lengths line up and either Claude
  // returned distinct names (normal case) or the source names are all
  // indistinguishable placeholders (degenerate case above).
  const usePositional =
    claudeUseCases.length === useCaseItems.length && (claudeNamesUnique || sourceNamesAllCollide);
  const strategyKeys = [
    "classification", "business_workflow_or_decision",
    "industry_pattern", "client_context_signal", "why_now", "operating_model_change",
    "current_operating_condition", "future_operating_condition", "human_role_change",
    "systems_data_control_requirements",
    "change_strategy", "value_thesis", "readiness_barrier", "evidence_gate",
    "priority_rationale", "module_next_step", "pilot_probability_band",
    "scale_probability_band", "reference_class_basis", "baseline_metrics_required",
  ];
  let matched = 0;
  let matchMode = "name";
  claudeUseCases.forEach((entry, index) => {
    let target = byCandidateKey.get(asText(entry.candidate_key).toLowerCase().trim());
    if (target) matchMode = "candidate_key";
    if (!target) target = byUniqueName.get(asText(entry.name).toLowerCase().trim());
    if (!target && usePositional) {
      target = useCaseItems[index];
      matchMode = "positional";
    }
    if (!target) return;
    matched += 1;
    for (const key of strategyKeys) {
      if (asText(entry[key]).trim()) target[key] = entry[key];
    }
    // Preserve Claude's authored use-case name when the source name was a
    // generic placeholder, so the design shows real titles not "AI opportunity".
    if (asText(entry.name).trim() && matchMode === "positional") {
      target.name = entry.name;
    }
    if (asText(entry.candidate_key).trim()) {
      target.candidate_key = entry.candidate_key;
    }
  });
  pack.brief_model.use_case_match_mode = matchMode;
  // Keep only dimension_module_implications whose dimension_key matches a real
  // loaded dimension -- drops any hallucinated dimension key.
  const dimKeys = new Set((pack.design_slots?.DIMS ?? []).map((d) => asText(d.key)));
  pack.brief_model.dimension_module_implications =
    pack.brief_model.dimension_module_implications.filter((row) => dimKeys.has(asText(row.dimension_key)));
  return {
    matched,
    total: useCaseItems.length,
    dimImplications: pack.brief_model.dimension_module_implications.length,
  };
}

function industryPatternFor(useCase, pack) {
  const rows = pack.design_slots?.DATA?.industry?.rows ?? [];
  const name = asText(useCase.name).toLowerCase();
  const fn = asText(useCase.fn).toLowerCase();
  const found = rows.find((row) => {
    const haystack = JSON.stringify(row).toLowerCase();
    return (name && haystack.includes(name.split(" ")[0])) ||
      (fn && fn.split(/[ /]+/).some((token) => token.length > 4 && haystack.includes(token)));
  });
  return firstText(found, ["pattern_name", "industry_context", "signals", "business_function"]) ||
    "Industry pattern to confirm from peer/market evidence.";
}

function moduleForUseCase(useCase) {
  const text = `${asText(useCase.name)} ${asText(useCase.fn)} ${asText(useCase.gate)}`.toLowerCase();
  if (/contract|vendor|sourcing|renewal|msa/.test(text)) return "Source";
  if (/value|metric|benefit|kpi|run cost|spend|budget/.test(text)) return "Tower";
  if (/phase|program|roadmap|change|pilot|scale|operating/.test(text)) return "Moves";
  return "Intelligence";
}

function enrichUseCases(pack) {
  const useCases = pack.design_slots?.USE_CASES ?? [];
  const keyCounts = new Map();
  return useCases.map((item, index) => {
    const valueText = firstText(item, ["value", "value_hypothesis", "value_outcome", "target_or_promise"]);
    const gate = firstText(item, ["gate", "evidence_gate", "evidence_needed", "required_data", "risk_controls"]);
    const fn = firstText(item, ["fn", "business_function", "process_area"]);
    const valueScore =
      numberFromText(valueText) > 0
        ? Math.min(10, Math.log10(numberFromText(valueText)) + 1)
        : 4 + scoreText(valueText, [[/foundation|enterprise|platform|govern|identity|lakehouse/i, 2], [/cost|revenue|margin|leakage|cash|productivity/i, 2]]);
    const readinessScore = Math.max(1, 7 - scoreText(gate, [[/missing|needed|confirm|required|not certified|evidence/i, 1], [/identity|governance|lineage|audit|control/i, 1]]));
    const evidenceScore = Math.min(10, evidenceRefs(item).length * 1.5 + (gate ? 2 : 0));
    const dependencyRiskScore = scoreText(gate, [[/identity|governance|lineage|audit|control|integration|semantic|lakehouse/i, 2], [/owner|contract|crm|claims|erp|data/i, 1]]);
    const total = Number((valueScore * 0.35 + evidenceScore * 0.2 + readinessScore * 0.2 + dependencyRiskScore * 0.25).toFixed(2));
    return {
      sourceIndex: index,
      use_case_key: stableKey(firstText(item, ["candidate_key", "name", "use_case_name", "ai_use_case"]) || `use-case-${index + 1}`),
      name: firstText(item, ["name", "use_case_name", "ai_use_case", "business_name"]) || `Use case ${index + 1}`,
      classification: asText(item.classification) || "qualified_use_case",
      business_workflow_or_decision: asText(item.business_workflow_or_decision),
      business_function: fn || "Owner to confirm",
      owner_hint: firstText(item, ["owner", "owner_hint", "business_owner", "technology_owner"]) || "Owner to confirm",
      stage: firstText(item, ["stage", "current_status", "use_case_status", "readiness_status"]) || "Planning-grade",
      industry_pattern: asText(item.industry_pattern) || (useClaude ? "" : industryPatternFor(item, pack)),
      client_context_signal: asText(item.client_context_signal) || (useClaude ? "" : `${fn || "The relevant business area"} appears in the loaded context; confirm source-owner evidence before scaling.`),
      current_operating_condition: asText(item.current_operating_condition),
      future_operating_condition: asText(item.future_operating_condition),
      human_role_change: asText(item.human_role_change),
      systems_data_control_requirements: asArray(item.systems_data_control_requirements).map(asText).filter(Boolean),
      why_now: asText(item.why_now) || (useClaude ? "" : "Industry adoption pressure is rising, but the tenant evidence gate determines whether this is a near-term move or a staged dependency."),
      operating_model_change: asText(item.operating_model_change) || (useClaude ? "" : "Shift from isolated pilots to governed workflow ownership, data accountability, and measurable adoption gates."),
      change_strategy: asText(item.change_strategy) || (useClaude ? "" : "Start with a bounded pilot only where data, owner, control, and metric evidence can be certified; route the scale plan through Moves."),
      value_thesis: valueText || "Value hypothesis needs validation.",
      readiness_barrier: asText(item.readiness_barrier) || gate || (useClaude ? "" : "Evidence gate must be confirmed before scale."),
      evidence_gate: gate || (useClaude ? "" : "Confirm data, systems, controls, owners, and value evidence."),
      value_score: Number(valueScore.toFixed(2)),
      readiness_score: Number(readinessScore.toFixed(2)),
      evidence_score: Number(evidenceScore.toFixed(2)),
      dependency_risk_score: Number(dependencyRiskScore.toFixed(2)),
      total_priority_score: total,
      priority_rationale: asText(item.priority_rationale || item.why_this_is_top_5) ||
        (useClaude ? "" : "Ranked by combined value signal, industry urgency, tenant fit, readiness, evidence depth, and dependency leverage."),
      module_next_step: asText(item.module_next_step) || (useClaude ? "" : moduleForUseCase(item)),
      pilot_probability_band: asText(item.pilot_probability_band),
      scale_probability_band: asText(item.scale_probability_band),
      reference_class_basis: asText(item.reference_class_basis),
      baseline_metrics_required: asArray(item.baseline_metrics_required).map(asText).filter(Boolean),
      supporting_dimensions: ["ai", "industry", "apps", "data", "risks", "evidence"],
      required_context: {
        gate,
        business_workflow_or_decision: asText(item.business_workflow_or_decision),
        current_operating_condition: asText(item.current_operating_condition),
        future_operating_condition: asText(item.future_operating_condition),
        human_role_change: asText(item.human_role_change),
        systems_data_control_requirements: asArray(item.systems_data_control_requirements).map(asText).filter(Boolean),
        pilot_probability_band: asText(item.pilot_probability_band),
        scale_probability_band: asText(item.scale_probability_band),
        reference_class_basis: asText(item.reference_class_basis),
        baseline_metrics_required: asArray(item.baseline_metrics_required).map(asText).filter(Boolean),
      },
      evidence_refs: evidenceRefs(item),
      source_payload: item,
    };
  }).sort((a, b) => b.total_priority_score - a.total_priority_score)
    .map((item, index) => {
      const seen = keyCounts.get(item.use_case_key) ?? 0;
      keyCounts.set(item.use_case_key, seen + 1);
      const suffix = seen === 0 ? "" : `-${seen + 1}`;
      return { ...item, use_case_key: `${item.use_case_key}${suffix}`, priority_rank: index + 1 };
    });
}

// Dimension-appropriate collection route (2026-07-22 design review #12). A
// pure function of the requesting dimension -- deterministic, not authored,
// so a zero-state gives the right route instead of a generic "upload a
// client export". Industry movements are corpus-fed, not a tenant upload.
const COLLECTION_ROUTES = [
  [/^(profile|budget)$/, "Finance attestation of sizing, budget, and value-base assumptions"],
  [/^(functions|org|workforce|lenses)$/, "Capability/operating-model workshop with the owning function"],
  [/^(programs|ai|opev)$/, "Program owner interview + delivery/adoption evidence"],
  [/^(apps|infra|data)$/, "System owner + architecture inventory and integration evidence"],
  [/^(vendors|ms)$/, "Procurement / vendor-management contract and commercial evidence"],
  [/^(risks|evidence)$/, "Control owner sign-off + evidence lineage and governance review"],
  [/^(metrics)$/, "Tower metrics + finance attestation of realized value"],
  [/^(industry)$/, "Governed AbarVa industry corpus; tenant interview only to confirm local relevance"],
];

function collectionRouteFor(dimensionKey) {
  const key = asText(dimensionKey).toLowerCase();
  for (const [pattern, route] of COLLECTION_ROUTES) {
    if (pattern.test(key)) return route;
  }
  return "Owner interview + supporting document export for this area";
}

// Wire the orphaned v3 home_knowledge_next_evidence_requests table from the
// source pack's already-authored NEXT_EVIDENCE (enterprise-level) and DGAPS
// (per-dimension) data. Fully deterministic -- no model authoring, no
// fabrication. Every request carries a deterministic collection_route.
function buildNextEvidenceRequests(pack, evidenceRead = null) {
  const authoredRequests = asArray(evidenceRead?.priority_requests)
    .map((item, index) => ({
      title: cleanExecutiveText(firstText(item, ["request", "title", "item"])),
      narrative: cleanExecutiveText(firstText(item, ["why_it_matters", "narrative", "needed"])) || null,
      requesting_dimension_key: null,
      unlocks_narrative: cleanExecutiveText(firstText(item, ["decision_blocked", "unlocks", "blocks"])) || null,
      requesting_role_hint: cleanExecutiveText(firstText(item, ["owner_hint", "owner", "requesting_role_hint"])) || null,
      collection_route: cleanExecutiveText(firstText(item, ["source_hint", "collection_route"])) || collectionRouteFor(null),
      sort_order: index + 1,
    }))
    .filter((row) => row.title);
  if (authoredRequests.length) return authoredRequests;

  const rows = [];
  let order = 0;
  for (const item of pack.design_slots?.NEXT_EVIDENCE ?? []) {
    const title = firstText(item, ["item", "title", "missing"]);
    if (!title) continue;
    order += 1;
      rows.push({
        title: cleanExecutiveText(title),
        narrative: cleanExecutiveText(firstText(item, ["narrative", "blocks"])) || null,
        requesting_dimension_key: null,
        unlocks_narrative: cleanExecutiveText(firstText(item, ["unlocks", "unlocks_narrative"])) || null,
        requesting_role_hint: cleanExecutiveText(firstText(item, ["owner_hint", "handoff", "owner"])) || null,
        collection_route: collectionRouteFor(null),
        sort_order: order,
      });
  }
  const dgaps = pack.design_slots?.DGAPS ?? {};
  for (const [dimensionKey, entries] of Object.entries(dgaps)) {
    for (const entry of asArray(entries)) {
      const title = firstText(entry, ["missing", "title", "item"]);
      if (!title) continue;
      order += 1;
      rows.push({
        title: cleanExecutiveText(title),
        narrative: cleanExecutiveText(firstText(entry, ["needed", "blocks", "narrative"])) || null,
        requesting_dimension_key: dimensionKey,
        unlocks_narrative: cleanExecutiveText(firstText(entry, ["unlocks", "blocks"])) || null,
        requesting_role_hint: cleanExecutiveText(firstText(entry, ["handoff", "owner_hint", "owner"])) || null,
        collection_route: collectionRouteFor(dimensionKey),
        sort_order: order,
      });
    }
  }
  return rows;
}

function buildNodesAndEdges(pack) {
  const nodes = new Map();
  const edges = new Map();
  const addNode = (type, label, payload = {}) => {
    const clean = asText(label).trim();
    if (!clean) return null;
    const key = `${type}:${stableKey(clean)}`;
    if (!nodes.has(key)) {
      nodes.set(key, {
        node_key: key,
        node_type: type,
        label: clean,
        group_name: type,
        size_score: type === "enterprise" ? 10 : 3,
        risk_score: type === "constraint" ? 8 : 1,
        confidence: 0.75,
        display_payload: payload,
        evidence_refs: [],
      });
    }
    return key;
  };
  const addEdge = (from, to, type, payload = {}) => {
    if (!from || !to || from === to) return;
    const key = `${from}->${type}->${to}`;
    if (!edges.has(key)) {
      edges.set(key, {
        edge_key: sha256(key).slice(0, 24),
        from_node_key: from,
        to_node_key: to,
        relationship_type: type,
        relationship_strength: asText(payload.relationship_strength) || "inferred_from_context_pack",
        evidence_basis: asText(payload.evidence_basis) || "Home Knowledge Pack v2 derived relationship",
        confidence: Number(asText(payload.confidence)) || 0.65,
        evidence_refs: evidenceRefs(payload),
        display_payload: payload,
      });
    }
  };

  const enterprise = addNode("enterprise", pack.tenant_name, { tenant_key: pack.tenant_key });
  for (const dimension of pack.design_slots?.DIMS ?? []) {
    const dimNode = addNode("dimension", dimension.name, dimension);
    addEdge(enterprise, dimNode, "contains_dimension", dimension);
  }
  for (const row of pack.design_slots?.USE_CASES ?? []) {
    const useCase = addNode("priority", firstText(row, ["name", "use_case_name", "ai_use_case"]), row);
    addEdge(enterprise, useCase, "prioritizes", row);
    const fn = addNode("function", firstText(row, ["fn", "business_function", "process_area"]), row);
    addEdge(fn, useCase, "owns_or_benefits_from", row);
  }
  for (const row of pack.design_slots?.DATA?.apps?.rows?.slice(0, 80) ?? []) {
    const system = addNode("system", firstText(row, ["application_name", "system_name", "name"]), row);
    const fn = addNode("function", firstText(row, ["business_function", "function", "owner"]), row);
    addEdge(fn, system, "uses_system", row);
  }
  for (const row of pack.design_slots?.DATA?.rel?.rows?.slice(0, 220) ?? []) {
    const from = addNode(asText(row.from_object_type) || "source", firstText(row, ["from_object_name", "from", "source"]), row);
    const to = addNode(asText(row.to_object_type) || "target", firstText(row, ["to_object_name", "to", "target"]), row);
    addEdge(from, to, firstText(row, ["relationship_type", "type"]) || "related_to", row);
  }
  for (const row of pack.design_slots?.GAPS?.slice(0, 12) ?? []) {
    const gap = addNode("constraint", firstText(row, ["title", "missing", "item"]), row);
    addEdge(gap, enterprise, "constrains", row);
  }
  return {
    nodes: Array.from(nodes.values()).map((node, index) => ({ ...node, sort_order: index + 1 })),
    edges: Array.from(edges.values()),
  };
}

async function normalizePack(pack, sourceFile, sourceText) {
  const sourceHash = sha256(sourceText);
  const executivePromptPacket = buildPromptPacket(pack);
  const storyArchitecture = await callClaudeForStoryArchitecture(executivePromptPacket);
  const promptPacket = {
    ...executivePromptPacket,
    story_architecture: storyArchitecture,
  };
  const promotedStrategicCandidates = promoteStrategicCandidatesToUseCases(
    pack,
    promptPacket.context?.strategic_candidates,
  );
  const promptText = [
    "HOME KNOWLEDGE PACK V3 EXECUTIVE-SAFE CLAUDE PROMPTS",
    "STORY ARCHITECT SYSTEM PROMPT",
    claudeStoryArchitectSystemPrompt(),
    "WRITER SYSTEM PROMPT",
    claudeSystemPrompt(),
    "EXECUTIVE-SAFE PACKET",
    JSON.stringify(promptPacket, null, 2),
  ].join("\n\n");
  const useCaseQualifications = await callClaudeForUseCaseQualifications(promptPacket);
  const executiveResult = await callClaudeForPack(promptPacket);
  const dimensionStoriesResult = await callClaudeForDimensionStories(promptPacket);
  const relationshipReadsResult = await callClaudeForRelationshipReads(promptPacket);
  const evidenceReadResult = await callClaudeForEvidenceRead(promptPacket);
  const claudeResult = {
    ...(executiveResult ?? {}),
    use_cases: useCaseQualifications,
    dimension_stories: dimensionStoriesResult,
    relationship_reads: relationshipReadsResult,
    evidence_read: evidenceReadResult,
  };
  const claudeMatch = mergeClaudeNarrativesIntoPack(pack, claudeResult);
  // Dedicated forward-looking call (industry movements, new ways of operating,
  // change theses). Only runs when the main pack call produced brief_model.
  let strategicNarrativesResult = [];
  if (pack.brief_model) {
    strategicNarrativesResult = await callClaudeForStrategicNarratives(promptPacket);
    pack.brief_model.strategic_narratives = strategicNarrativesResult;
  }
  const brief = pack.brief_model ?? {};
  const dimensionStoryByKey = new Map(asArray(brief.dimension_stories).map((story) => [asText(story.dimension_key), story]));
  const authoredStorySlots = Object.fromEntries(
    (pack.design_slots?.DIMS ?? []).map((dimension) => {
      const authored = dimensionStoryByKey.get(dimension.key);
      if (!authored) return [dimension.key, pack.design_slots?.STORY?.[dimension.key] ?? {}];
      return [dimension.key, {
        observed: asText(authored.answer_headline),
        meaning: asText(authored.executive_read),
        matters: asText(authored.why_it_matters),
        supports: [asText(authored.evidence_boundary), asText(authored.next_action)].filter(Boolean).join(" "),
      }];
    }),
  );
  const authoredInsightSlots = Object.fromEntries(
    (pack.design_slots?.DIMS ?? []).map((dimension) => {
      const authored = dimensionStoryByKey.get(dimension.key);
      if (!authored) return [dimension.key, pack.design_slots?.INSIGHTS?.[dimension.key] ?? {}];
      return [dimension.key, {
        findings: [
          ...asArray(authored.material_strengths),
          ...asArray(authored.material_constraints),
          ...asArray(authored.strategic_implications),
        ].map(asText).filter(Boolean).slice(0, 6),
      }];
    }),
  );
  const relationshipReadsByDimension = new Map();
  for (const read of asArray(brief.relationship_reads)) {
    const key = asText(read.dimension_key || "rel") || "rel";
    if (!relationshipReadsByDimension.has(key)) relationshipReadsByDimension.set(key, []);
    relationshipReadsByDimension.get(key).push(read);
  }
  const authoredRelationshipSlots = {
    ...(pack.design_slots?.REL ?? {}),
    ...Object.fromEntries(Array.from(relationshipReadsByDimension.entries()).map(([key, reads]) => [key, {
      chain: reads.flatMap((read) => [
        asText(read.answer_headline),
        asText(read.business_meaning),
        ...asArray(read.enables),
        ...asArray(read.dependencies),
        ...asArray(read.constraints),
      ]).map(cleanExecutiveText).filter(Boolean).slice(0, 8),
      note: reads.map((read) => [asText(read.business_meaning), asText(read.evidence_boundary)].filter(Boolean).join(" ")).filter(Boolean).join(" "),
    }])),
  };
  const useCases = enrichUseCases(pack);
  const graph = buildNodesAndEdges(pack);
  const clientNarrativeSections = Object.fromEntries(
    Object.entries(pack.narrative_sections ?? {}).filter(([key]) => !TECHNICAL_NARRATIVE_KEYS.has(key)),
  );
  if (claudeResult?.narratives?.enterprise_brief) {
    clientNarrativeSections.enterprise_brief_summary = asText(claudeResult.narratives.enterprise_brief);
    clientNarrativeSections.context_confidence_summary = asText(brief.executive_read?.one_sentence || claudeResult.narratives.enterprise_brief);
  }
  if (claudeResult?.narratives?.operating_model) {
    clientNarrativeSections.operating_model_summary = asText(claudeResult.narratives.operating_model);
  }
  if (claudeResult?.narratives?.relationship_map) {
    clientNarrativeSections.proof_relationship_visual = {
      caption: asText(claudeResult.narratives.relationship_map),
    };
  }
  if (claudeResult?.narratives?.use_cases) {
    clientNarrativeSections.use_cases_summary = asText(claudeResult.narratives.use_cases);
    clientNarrativeSections.use_cases_portfolio_view = asText(claudeResult.narratives.use_cases);
  }
  if (brief.evidence_read?.answer_headline || claudeResult?.narratives?.evidence_boundary) {
    clientNarrativeSections.evidence_gaps_summary = [
      asText(brief.evidence_read?.answer_headline),
      asText(claudeResult?.narratives?.evidence_boundary),
    ].filter(Boolean).join(" ");
    clientNarrativeSections.proof_summary = clientNarrativeSections.evidence_gaps_summary;
  }
  const renderPack = {
    ...pack,
    generation_metadata: {
      generator: "claude",
      model,
      prompt_version: promptVersion,
      source_snapshot_hash: sourceHash,
      validation_report_uri: `reports/home-knowledge-pack-v2/${pack.tenant_key}/client-visible-quality-findings.json`,
    },
    prompt_version: promptVersion,
    generated_model: `${pack.generated_model ?? "approved-json-pack"} + ${generatorVersion}`,
    design_slots: {
      ...(pack.design_slots ?? {}),
      STORY: authoredStorySlots,
      INSIGHTS: authoredInsightSlots,
      REL: authoredRelationshipSlots,
      USE_CASES: useCases.map((useCase) => ({
        ...useCase.source_payload,
        name: useCase.name,
        fn: useCase.business_function,
        stage: useCase.stage,
        value: useCase.value_thesis,
        gate: useCase.evidence_gate,
        industry_pattern: useCase.industry_pattern,
        client_context_signal: useCase.client_context_signal,
        why_now: useCase.why_now,
        operating_model_change: useCase.operating_model_change,
        change_strategy: useCase.change_strategy,
        readiness_barrier: useCase.readiness_barrier,
        priority_rank: useCase.priority_rank,
        priority_rationale: useCase.priority_rationale,
        total_priority_score: useCase.total_priority_score,
        module_next_step: useCase.module_next_step,
        evidence_refs: useCase.evidence_refs,
      })),
    },
    narrative_sections: {
      ...clientNarrativeSections,
      use_cases_portfolio_view:
        pack.narrative_sections?.use_cases_portfolio_view ??
        "Prioritization combines tenant-specific current state, industry pressure, evidence readiness, and dependency risk. Each use case remains planning-grade until its source-owner evidence gate clears.",
    },
  };
  const packVersion = `home-pack-v2-${pack.tenant_key}-20260721-${sourceHash.slice(0, 8)}`;
  const generatedAt = new Date().toISOString();
  const dimensions = (pack.design_slots?.DIMS ?? []).map((dimension, index) => {
    const authored = dimensionStoryByKey.get(dimension.key);
    return {
      dimension_key: dimension.key,
      display_name: dimension.name,
      record_count: Number(dimension.count ?? 0),
      evidence_count: Number(dimension.evCount ?? 0),
      confidence_status: asText(dimension.status) || "directional",
      pct: asText(dimension.pct),
      executive_summary: asText(authored?.answer_headline || dimension.summary),
      cxo_meaning: asText(authored?.executive_read || pack.design_slots?.STORY?.[dimension.key]?.meaning || dimension.summary),
      why_it_matters: asText(authored?.why_it_matters || pack.design_slots?.STORY?.[dimension.key]?.matters),
      visual_type: asText(pack.design_slots?.VISUAL_BLOCKS?.[dimension.key]?.[0]?.type) || "context_snapshot",
      covers: dimension.covers ?? [],
      sources: dimension.sources ?? [],
      metadata: { ...dimension, claude_dimension_story: authored ?? null },
      sort_order: index + 1,
    };
  });
  const dimensionRows = Object.entries(pack.design_slots?.DATA ?? {}).flatMap(([dimensionKey, dataSet]) =>
    (dataSet.rows ?? []).slice(0, 250).map((row, index) => ({
      dimension_key: dimensionKey,
      source_record_id: firstText(row, ["id", "source_record_id", "record_id"]) || `${dimensionKey}-${index + 1}`,
      display_name: firstText(row, ["name", "title", "application_name", "system_name", "function_name", "source_file", "pattern_name", "use_case_name", "risk_name"]) || `${dimensionKey} row ${index + 1}`,
      display_summary: firstText(row, ["summary", "description", "current_state_notes", "known_gaps", "value_hypothesis"]),
      facet_1: firstText(row, ["business_function", "system_category", "source_type", "object_type", "industry_context"]),
      facet_2: firstText(row, ["owner", "source_owner", "current_status", "confidence", "criticality"]),
      status: firstText(row, ["status", "current_status", "confidence", "readiness_status"]),
      confidence: Number(firstText(row, ["confidence"])) || null,
      display_payload: row,
      evidence_refs: evidenceRefs(row),
      source_file: asText(dataSet.source_file),
      sort_order: index + 1,
    })),
  );
  const evidence = (pack.design_slots?.EVIDENCE ?? []).map((item, index) => ({
    source_id: stableKey(firstText(item, ["source_id", "name", "source_file"]) || `source-${index + 1}`),
    source_name: firstText(item, ["name", "source_file"]) || `Evidence source ${index + 1}`,
    file_name: firstText(item, ["file_name", "source_file", "name"]),
    file_type: firstText(item, ["type", "source_type"]),
    row_count: Number(firstText(item, ["rows", "row_count", "row_count_or_pages"]).replace(/[^0-9]/g, "")) || null,
    source_date: firstText(item, ["date", "source_date"]),
    source_owner: firstText(item, ["source_owner", "owner"]),
    source_status: firstText(item, ["status", "st"]),
    parsed_into_dimensions: asArray(item.dimensions),
    lineage: item,
    known_gaps: firstText(item, ["missing", "known_gaps"]),
    source_payload: item,
  }));
  const narratives = Object.entries(renderPack.narrative_sections ?? {})
    .filter(([, value]) => typeof value === "string" && value.trim())
    .map(([sectionKey, narrative], index) => ({
      section_key: sectionKey,
      dimension_key: null,
      title: sectionKey.replaceAll("_", " "),
      narrative,
      generated_by: pack.generated_model?.includes("claude") ? "claude" : "deterministic_or_approved_pack",
      prompt_version: pack.prompt_version ?? null,
      evidence_refs: [],
      approval_status: "candidate",
      sort_order: index + 1,
    }));
  // v4 brief-model rows. Only present when Claude authored them (pack.brief_model
  // is set by mergeClaudeNarrativesIntoPack); a deterministic-only build leaves
  // these empty, so the new tables stay unpopulated rather than filled with
  // fabricated executive content.
  const executiveReadRows = brief.executive_read
    ? [{
        archetype: asText(brief.executive_read.archetype) || null,
        one_sentence: asText(brief.executive_read.one_sentence) || null,
        tension_headline: asText(brief.executive_read.tension_headline) || null,
        context_confidence_pct: Number.isFinite(Number(brief.executive_read.context_confidence_pct))
          ? Math.max(0, Math.min(100, Math.round(Number(brief.executive_read.context_confidence_pct))))
          : null,
        context_confidence_note: asText(brief.executive_read.context_confidence_note) || null,
        data_foundation_summary: asText(brief.executive_read.data_foundation_summary) || null,
        strengths: asArray(brief.executive_read.strengths),
        constraints: asArray(brief.executive_read.constraints),
        industry_forces: asArray(brief.executive_read.industry_forces),
        tenant_reality: asArray(brief.executive_read.tenant_reality),
        horizons: asArray(brief.executive_read.horizons),
      }]
    : [];
  const packTierRows = brief.tier
    ? [{
        tier: ["thin", "partial", "rich"].includes(asText(brief.tier.tier)) ? asText(brief.tier.tier) : "partial",
        tier_label: asText(brief.tier.tier_label) || null,
        tier_title: asText(brief.tier.tier_title) || null,
        tier_body: asText(brief.tier.tier_body) || null,
        tier_conditions: asArray(brief.tier.tier_conditions),
        tier_basis: asText(brief.tier.tier_basis) || null,
      }]
    : [];
  const seenReadiness = new Set();
  const aiReadinessRows = asArray(brief.ai_readiness)
    .map((row, index) => ({
      readiness_dimension: asText(row.readiness_dimension).trim(),
      score_pct: Math.max(0, Math.min(100, Math.round(Number(row.score_pct) || 0))),
      tone: ["red", "amber", "green"].includes(asText(row.tone)) ? asText(row.tone) : null,
      label: asText(row.label) || null,
      basis: asText(row.basis) || null,
      evidence_refs: evidenceRefs(row),
      sort_order: index + 1,
    }))
    .filter((row) => {
      // Enforce the grounding contract in code, not just the prompt: a
      // readiness score without a stated basis is dropped, and duplicate
      // dimensions (which would violate the unique index) are collapsed.
      if (!row.readiness_dimension || !row.basis) return false;
      const key = row.readiness_dimension.toLowerCase();
      if (seenReadiness.has(key)) return false;
      seenReadiness.add(key);
      return true;
    });
  const seenDimModule = new Set();
  const dimensionModuleImplicationRows = asArray(brief.dimension_module_implications)
    .map((row, index) => ({
      dimension_key: asText(row.dimension_key).trim(),
      module: asText(row.module).trim(),
      implication: asText(row.implication).trim(),
      evidence_refs: evidenceRefs(row),
      sort_order: index + 1,
    }))
    .filter((row) => {
      if (!row.dimension_key || !row.implication) return false;
      if (!["intelligence", "moves", "source", "tower"].includes(row.module)) return false;
      const key = `${row.dimension_key}|${row.module}`;
      if (seenDimModule.has(key)) return false;
      seenDimModule.add(key);
      return true;
    });
  const nextEvidenceRequestRows = buildNextEvidenceRequests(pack, brief.evidence_read);
  const strategicNarrativeRows = asArray(brief.strategic_narratives)
    .map((row, index) => ({
      narrative_type: asText(row.narrative_type).trim(),
      title: asText(row.title).trim(),
      classification: CLASSIFICATIONS.has(asText(row.classification)) ? asText(row.classification) : "strategic_inference",
      executive_narrative: asText(row.executive_narrative).trim(),
      current_state: asText(row.current_state) || null,
      target_state_or_relevance: asText(row.target_state_or_relevance) || null,
      affected_entities: asArray(row.affected_entities).map(asText).filter(Boolean),
      value_hypothesis: asText(row.value_hypothesis) || null,
      dependencies: asArray(row.dependencies).map(asText).filter(Boolean),
      evidence_gate: asText(row.evidence_gate) || null,
      evidence_refs: evidenceRefs(row),
      confidence: Number.isFinite(Number(row.confidence)) ? Number(row.confidence) : null,
      recommended_next_action: asText(row.recommended_next_action) || null,
      sort_order: index + 1,
    }))
    // A strategic narrative with no type/title/narrative is dropped rather
    // than stored as an empty shell.
    .filter((row) => NARRATIVE_TYPES.has(row.narrative_type) && row.title && row.executive_narrative);
  const quality = {
    source_file: path.relative(repoRoot, sourceFile),
    prompt_file: `reports/home-knowledge-pack-v2/${pack.tenant_key}/claude-strategy-prompt.json`,
    dimensions: dimensions.length,
    dimension_rows: dimensionRows.length,
    use_cases: useCases.length,
    evidence_sources: evidence.length,
    relationship_nodes: graph.nodes.length,
    relationship_edges: graph.edges.length,
    executive_read: executiveReadRows.length,
    ai_readiness: aiReadinessRows.length,
    dimension_module_implications: dimensionModuleImplicationRows.length,
    next_evidence_requests: nextEvidenceRequestRows.length,
    strategic_narratives: strategicNarrativeRows.length,
    tier: packTierRows[0]?.tier ?? null,
    warnings: [],
  };
  if (promotedStrategicCandidates) {
    quality.promoted_strategic_candidates_to_use_cases = true;
  }
  if (!useCases.every((u) => u.industry_pattern && u.client_context_signal && u.change_strategy)) {
    quality.warnings.push("one_or_more_use_cases_missing_strategy_fields");
  }
  if (useClaude) {
    quality.claude_use_case_match = `${claudeMatch.matched}/${claudeMatch.total}`;
    if (!claudeResult) {
      quality.warnings.push("claude_requested_but_no_result");
    } else if (claudeMatch.matched < claudeMatch.total) {
      quality.warnings.push(`claude_use_case_narrative_partial_match:${claudeMatch.matched}/${claudeMatch.total}`);
    }
  }
  // Content quality gate. The Claude-authored layer is generated over two API
  // calls; the forward-looking (strategic_narratives) call is non-fatal and can
  // transiently return nothing. When --use-claude and --approve are both set, do
  // NOT approve a tenant whose required Claude content is missing -- that would
  // put an empty executive read / empty "New Ways of Operating" live. Such a
  // pack is written as 'candidate' instead, flagged, so a re-run can complete it.
  const claudeContentMissing = [];
  if (useClaude) {
    if (executiveReadRows.length === 0) claudeContentMissing.push("executive_read");
    if (strategicNarrativeRows.length === 0) claudeContentMissing.push("strategic_narratives");
    if (aiReadinessRows.length === 0) claudeContentMissing.push("ai_readiness");
    if (asArray(brief.dimension_stories).length < (pack.design_slots?.DIMS ?? []).length) {
      claudeContentMissing.push(`dimension_stories:${asArray(brief.dimension_stories).length}/${(pack.design_slots?.DIMS ?? []).length}`);
    }
    if (asArray(brief.relationship_reads).length === 0) claudeContentMissing.push("relationship_reads");
    if (!brief.evidence_read) claudeContentMissing.push("evidence_read");
    if (asText(claudeResult?.generation_status) === "blocked") claudeContentMissing.push("claude_generation_blocked");
    if (!storyArchitecture) claudeContentMissing.push("story_architecture");
  }
  let approveThisTenant = approve && claudeContentMissing.length === 0;
  if (approve && claudeContentMissing.length > 0) {
    quality.warnings.push(`held_as_candidate_missing_claude_content:${claudeContentMissing.join("+")}`);
  }
  const normalized = {
    pack: {
      tenant_key: pack.tenant_key,
      tenant_name: pack.tenant_name,
      pack_version: packVersion,
      status: approveThisTenant ? "approved" : "candidate",
      artifact_type: artifactType,
      source_pack_hash: sourceHash,
      source_dataset_version: asText(pack.source_context?.canonical_input_location),
      source_context: pack.source_context ?? {},
      generator_version: generatorVersion,
      generated_by: "home-knowledge-pack-v2-builder",
      generated_model: pack.generated_model ?? "approved-json-pack",
      claude_model: useClaude ? model : null,
      claude_prompt_version: promptVersion,
      claude_prompt_hash: sha256(promptText),
      content_hash: "",
      render_pack: renderPack,
      quality_score: quality.warnings.length ? 0.82 : 0.92,
      quality_report: quality,
      validation_status: quality.warnings.length ? "warn" : "pass",
      validation_issues: quality.warnings,
      approved_by: approveThisTenant ? "home-pack-v2-builder" : null,
      approved_at: approveThisTenant ? generatedAt : null,
      effective_from: approveThisTenant ? generatedAt : null,
      effective_to: null,
    },
    dimensions,
    dimension_rows: dimensionRows,
    use_cases: useCases,
    evidence_sources: evidence,
    relationship_nodes: graph.nodes,
    relationship_edges: graph.edges,
    narratives,
    executive_read: executiveReadRows,
    pack_tier: packTierRows,
    ai_readiness: aiReadinessRows,
    dimension_module_implications: dimensionModuleImplicationRows,
    next_evidence_requests: nextEvidenceRequestRows,
    strategic_narratives: strategicNarrativeRows,
    story_architecture: storyArchitecture,
    claude_prompt: promptPacket,
    claude_prompts: {
      story_architect_system_prompt: claudeStoryArchitectSystemPrompt(),
      writer_system_prompt: claudeSystemPrompt(),
      strategic_system_prompt: claudeStrategicSystemPrompt(),
      executive_safe_packet: executivePromptPacket,
      writer_packet: promptPacket,
    },
    claude_responses: {
      story_architecture: storyArchitecture,
      executive: executiveResult,
      use_case_qualifications: useCaseQualifications,
      dimension_stories: dimensionStoriesResult,
      relationship_reads: relationshipReadsResult,
      evidence_read: evidenceReadResult,
      narrative: claudeResult,
      strategic_narratives: strategicNarrativesResult,
    },
    claude_provider_metadata: {
      story_architecture: providerMetadata(storyArchitecture),
      executive: providerMetadata(executiveResult),
      use_case_qualifications: providerMetadata(useCaseQualifications),
      dimension_stories: providerMetadata(dimensionStoriesResult),
      relationship_reads: providerMetadata(relationshipReadsResult),
      evidence_read: providerMetadata(evidenceReadResult),
      strategic_narratives: providerMetadata(strategicNarrativesResult),
    },
  };
  const visibleFindings = clientVisibleQualityFindings(normalized, storyArchitecture);
  const hardFindings = visibleFindings.filter((finding) => finding.level === "P0" || finding.level === "P1");
  quality.client_visible_findings = visibleFindings;
  quality.p0_findings = visibleFindings.filter((finding) => finding.level === "P0").length;
  quality.p1_findings = visibleFindings.filter((finding) => finding.level === "P1").length;
  quality.p2_score = hardFindings.length === 0 ? 0.88 : 0.55;
  if (hardFindings.length > 0) {
    quality.warnings.push(`held_as_candidate_client_visible_quality:${quality.p0_findings}P0_${quality.p1_findings}P1`);
    approveThisTenant = false;
    normalized.pack.status = "candidate";
    normalized.pack.approved_by = null;
    normalized.pack.approved_at = null;
    normalized.pack.effective_from = null;
  }
  normalized.pack.quality_score = quality.warnings.length ? 0.82 : 0.94;
  normalized.pack.validation_status = quality.warnings.length ? "warn" : "pass";
  normalized.pack.validation_issues = quality.warnings;
  normalized.pack.content_hash = sha256(JSON.stringify({
    dimensions,
    dimensionRows,
    useCases,
    evidence,
    graph,
    narratives,
    executiveReadRows,
    packTierRows,
    aiReadinessRows,
    dimensionModuleImplicationRows,
    nextEvidenceRequestRows,
    strategicNarrativeRows,
    storyArchitecture,
    visibleFindings,
  }));
  return normalized;
}

function writeArtifacts(normalized) {
  const tenantDir = path.join(reportDir, normalized.pack.tenant_key);
  fs.mkdirSync(tenantDir, { recursive: true });
  fs.writeFileSync(path.join(tenantDir, "home-knowledge-pack-v2.json"), JSON.stringify(normalized));
  fs.writeFileSync(path.join(tenantDir, "claude-strategy-prompt.json"), JSON.stringify(normalized.claude_prompt, null, 2));
  fs.writeFileSync(path.join(tenantDir, "claude-executive-safe-packet.json"), JSON.stringify(normalized.claude_prompts?.executive_safe_packet ?? null, null, 2));
  fs.writeFileSync(path.join(tenantDir, "claude-story-architect-system-prompt.txt"), normalized.claude_prompts?.story_architect_system_prompt ?? "");
  fs.writeFileSync(path.join(tenantDir, "claude-writer-system-prompt.txt"), normalized.claude_prompts?.writer_system_prompt ?? "");
  fs.writeFileSync(path.join(tenantDir, "claude-strategic-system-prompt.txt"), normalized.claude_prompts?.strategic_system_prompt ?? "");
  fs.writeFileSync(path.join(tenantDir, "claude-story-architecture-response.json"), JSON.stringify(normalized.claude_responses?.story_architecture ?? null, null, 2));
  fs.writeFileSync(path.join(tenantDir, "claude-executive-response.json"), JSON.stringify(normalized.claude_responses?.executive ?? null, null, 2));
  fs.writeFileSync(path.join(tenantDir, "claude-use-case-qualifications-response.json"), JSON.stringify(normalized.claude_responses?.use_case_qualifications ?? [], null, 2));
  fs.writeFileSync(path.join(tenantDir, "claude-dimension-stories-response.json"), JSON.stringify(normalized.claude_responses?.dimension_stories ?? [], null, 2));
  fs.writeFileSync(path.join(tenantDir, "claude-relationship-reads-response.json"), JSON.stringify(normalized.claude_responses?.relationship_reads ?? [], null, 2));
  fs.writeFileSync(path.join(tenantDir, "claude-evidence-read-response.json"), JSON.stringify(normalized.claude_responses?.evidence_read ?? null, null, 2));
  fs.writeFileSync(path.join(tenantDir, "claude-narrative-response.json"), JSON.stringify(normalized.claude_responses?.narrative ?? null, null, 2));
  fs.writeFileSync(path.join(tenantDir, "claude-strategic-response.json"), JSON.stringify(normalized.claude_responses?.strategic_narratives ?? [], null, 2));
  fs.writeFileSync(path.join(tenantDir, "claude-provider-metadata.json"), JSON.stringify(normalized.claude_provider_metadata ?? {}, null, 2));
  fs.writeFileSync(path.join(tenantDir, "client-visible-quality-findings.json"), JSON.stringify(normalized.pack.quality_report?.client_visible_findings ?? [], null, 2));
  fs.writeFileSync(path.join(tenantDir, "use-cases.csv"), [
    "rank,name,total_priority_score,industry_pattern,client_context_signal,change_strategy,evidence_gate,module_next_step",
    ...normalized.use_cases.map((u) => [
      u.priority_rank,
      u.name,
      u.total_priority_score,
      u.industry_pattern,
      u.client_context_signal,
      u.change_strategy,
      u.evidence_gate,
      u.module_next_step,
    ].map((cell) => `"${String(cell ?? "").replace(/"/g, '""')}"`).join(",")),
  ].join("\n"));
}

function connectionString() {
  return process.env.ABARVA_AZURE_DATABASE_URL ?? process.env.AZURE_DATABASE_URL ?? process.env.DATABASE_URL ?? null;
}

function pgOptions(url) {
  const parsed = new URL(url);
  const ssl = parsed.searchParams.get("sslmode")?.toLowerCase() === "disable" ||
    ["localhost", "127.0.0.1", "::1"].includes(parsed.hostname)
    ? false
    : { rejectUnauthorized: false };
  return { connectionString: url, ssl, application_name: "home-knowledge-pack-v2-builder" };
}

async function writeNormalizedToDb(client, normalized) {
  await client.query("BEGIN");
  try {
    if (normalized.pack.status === "approved") {
      await client.query(
        `UPDATE public.home_knowledge_packs
          SET effective_to = now(), status = CASE WHEN status = 'approved' THEN 'retired' ELSE status END, updated_at = now()
          WHERE tenant_key = $1 AND status = 'approved' AND effective_to IS NULL`,
        [normalized.pack.tenant_key],
      );
    }
    const packColumns = Object.keys(normalized.pack);
    const packValues = packColumns.map((key) => dbValue("home_knowledge_packs", key, normalized.pack[key]));
    const packSql = `
      INSERT INTO public.home_knowledge_packs (${packColumns.join(", ")})
      VALUES (${packColumns.map((_, i) => `$${i + 1}`).join(", ")})
      ON CONFLICT (tenant_key, pack_version) DO UPDATE SET
        status = EXCLUDED.status,
        quality_score = EXCLUDED.quality_score,
        quality_report = EXCLUDED.quality_report,
        validation_status = EXCLUDED.validation_status,
        validation_issues = EXCLUDED.validation_issues,
        approved_by = EXCLUDED.approved_by,
        approved_at = EXCLUDED.approved_at,
        effective_from = EXCLUDED.effective_from,
        effective_to = EXCLUDED.effective_to,
        updated_at = now()
      RETURNING id`;
    const packId = (await client.query(packSql, packValues)).rows[0].id;
    for (const table of [
      "home_knowledge_dimensions",
      "home_knowledge_dimension_rows",
      "home_knowledge_use_cases",
      "home_knowledge_evidence_sources",
      "home_knowledge_relationship_nodes",
      "home_knowledge_relationship_edges",
      "home_knowledge_narratives",
      "home_knowledge_executive_read",
      "home_knowledge_pack_tier",
      "home_knowledge_ai_readiness",
      "home_knowledge_dimension_module_implications",
      "home_knowledge_next_evidence_requests",
      "home_knowledge_strategic_narratives",
    ]) {
      await client.query(`DELETE FROM public.${table} WHERE pack_id = $1`, [packId]);
    }
    const insertMany = async (table, rows, extra = {}) => {
      for (const row of rows) {
        const full = { pack_id: packId, tenant_key: normalized.pack.tenant_key, ...extra, ...row };
        const columns = insertColumnsByTable.get(table) ?? Object.keys(full);
        await client.query(
          `INSERT INTO public.${table} (${columns.join(", ")}) VALUES (${columns.map((_, i) => `$${i + 1}`).join(", ")})`,
          columns.map((key) => dbValue(table, key, full[key])),
        );
      }
    };
    await insertMany("home_knowledge_dimensions", normalized.dimensions);
    await insertMany("home_knowledge_dimension_rows", normalized.dimension_rows);
    await insertMany("home_knowledge_use_cases", normalized.use_cases);
    await insertMany("home_knowledge_evidence_sources", normalized.evidence_sources);
    await insertMany("home_knowledge_relationship_nodes", normalized.relationship_nodes);
    await insertMany("home_knowledge_relationship_edges", normalized.relationship_edges);
    await insertMany("home_knowledge_narratives", normalized.narratives);
    await insertMany("home_knowledge_executive_read", normalized.executive_read);
    await insertMany("home_knowledge_pack_tier", normalized.pack_tier);
    await insertMany("home_knowledge_ai_readiness", normalized.ai_readiness);
    await insertMany("home_knowledge_dimension_module_implications", normalized.dimension_module_implications);
    await insertMany("home_knowledge_next_evidence_requests", normalized.next_evidence_requests);
    await insertMany("home_knowledge_strategic_narratives", normalized.strategic_narratives);
    await client.query("COMMIT");
    return packId;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  }
}

function htmlSummary(results) {
  const esc = (value) => String(value ?? "").replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]));
  return `<!doctype html><html><head><meta charset="utf-8"><title>Home Knowledge Pack v2</title>
<style>body{font-family:Inter,Arial,sans-serif;margin:32px;background:#fbfaf7;color:#10213b}h1,h2{font-family:Georgia,serif}table{border-collapse:collapse;width:100%;background:#fff}th,td{border:1px solid #ddd4c7;padding:8px;text-align:left;vertical-align:top}th{background:#f3eee5}.pill{display:inline-block;border:1px solid #bad9d2;background:#edf8f5;border-radius:999px;padding:2px 8px}</style></head><body>
<h1>Home Knowledge Pack v2 Build</h1>
<p>Postgres-targeted read model artifacts generated for ${results.length} tenants. Runtime DB write: ${writeDb ? "requested" : "not requested"}.</p>
<table><thead><tr><th>Tenant</th><th>Status</th><th>Dimensions</th><th>Rows</th><th>Use cases</th><th>Nodes / edges</th><th>Validation</th></tr></thead><tbody>
${results.map((r) => `<tr><td><strong>${esc(r.tenant_name)}</strong><br>${esc(r.tenant_key)}</td><td><span class="pill">${esc(r.db_status)}</span></td><td>${r.dimensions}</td><td>${r.dimension_rows}</td><td>${r.use_cases}</td><td>${r.relationship_nodes} / ${r.relationship_edges}</td><td>${esc(r.validation_status)} ${esc((r.validation_issues || []).join("; "))}</td></tr>`).join("")}
</tbody></table></body></html>`;
}

async function main() {
  fs.mkdirSync(reportDir, { recursive: true });
  const files = discoverPackFiles();
  if (!files.length) throw new Error(`No Home design contract packs found for tenant=${requestedTenant}`);
  const results = [];
  const dbUrl = connectionString();
  let client = null;
  if (writeDb) {
    if (!dbUrl) throw new Error("Missing ABARVA_AZURE_DATABASE_URL, AZURE_DATABASE_URL, or DATABASE_URL for --write-db.");
    const pg = await import("pg");
    const { Client } = pg.default ?? pg;
    client = new Client(pgOptions(dbUrl));
    await client.connect();
  }
  try {
    for (const item of files) {
      const sourceText = fs.readFileSync(item.file, "utf8");
      const pack = JSON.parse(sourceText);
      const normalized = await normalizePack(pack, item.file, sourceText);
      writeArtifacts(normalized);
      let dbStatus = dryRun ? "artifact-only" : "pending";
      if (client) {
        const id = await writeNormalizedToDb(client, normalized);
        dbStatus = `written:${id}`;
      }
      results.push({
        tenant_key: normalized.pack.tenant_key,
        tenant_name: normalized.pack.tenant_name,
        db_status: dbStatus,
        dimensions: normalized.dimensions.length,
        dimension_rows: normalized.dimension_rows.length,
        use_cases: normalized.use_cases.length,
        evidence_sources: normalized.evidence_sources.length,
        relationship_nodes: normalized.relationship_nodes.length,
        relationship_edges: normalized.relationship_edges.length,
        validation_status: normalized.pack.validation_status,
        validation_issues: normalized.pack.validation_issues,
      });
    }
  } finally {
    if (client) await client.end();
  }
  fs.writeFileSync(path.join(reportDir, "summary.json"), JSON.stringify({
    generated_at: new Date().toISOString(),
    generator_version: generatorVersion,
    prompt_version: promptVersion,
    use_claude_requested: useClaude,
    claude_api_available: Boolean(process.env.ANTHROPIC_API_KEY),
    write_db_requested: writeDb,
    dry_run: dryRun,
    results,
  }, null, 2));
  fs.writeFileSync(path.join(reportDir, "summary.html"), htmlSummary(results));
  console.table(results);
  console.log(`Home Knowledge Pack v2 artifacts: ${path.relative(repoRoot, reportDir)}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
