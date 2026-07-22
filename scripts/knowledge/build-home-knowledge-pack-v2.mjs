#!/usr/bin/env node
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
const repoRoot = process.cwd();
const reportDir = path.join(repoRoot, "reports/home-knowledge-pack-v2");
const promptVersion = "home-knowledge-pack-v2-cxo-strategy-20260721";
const generatorVersion = "home-pack-v2-builder-20260721";
const artifactType = "NexusHomeKnowledgePackV2";

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

const requestedTenant = getArg("--tenant", "all");
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
  if (!fs.existsSync(root)) return [];
  return fs.readdirSync(root)
    .map((tenant) => ({
      tenant,
      file: path.join(root, tenant, "approved-content/home/design-contract-pack.json"),
    }))
    .filter((item) => fs.existsSync(item.file))
    .filter((item) => requestedTenant === "all" || item.tenant === requestedTenant)
    .sort((a, b) => a.tenant.localeCompare(b.tenant));
}

function buildPromptPacket(pack) {
  const slots = pack.design_slots ?? {};
  const dimensions = slots.DIMS ?? [];
  return {
    role: "senior strategy consultant creating the Nexus Home CXO context cockpit",
    prompt_version: promptVersion,
    tenant: {
      key: pack.tenant_key,
      name: pack.tenant_name,
      boundary: pack.source_context?.boundary,
    },
    objective:
      "Combine tenant-loaded context with industry movement to explain how the business should run differently, what AI/change bets matter most, and what evidence gates must clear before scale.",
    required_output_contract: {
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
      "Do not rank by row order. Rank by strategic value, industry urgency, client fit, data/system readiness, risk/control maturity, sponsorship evidence, and dependency leverage.",
    style:
      "Boardroom-ready strategy language. No product jargon, no raw IDs, no generic AI hype, no unsupported realized value claims.",
    context: {
      narrative_sections: pack.narrative_sections ?? {},
      dimensions: dimensions.map((dimension) => ({
        key: dimension.key,
        name: dimension.name,
        count: dimension.count,
        status: dimension.status,
        summary: dimension.summary,
        covers: dimension.covers,
      })),
      existing_use_cases: slots.USE_CASES ?? [],
      industry_rows: slots.DATA?.industry?.rows?.slice(0, 30) ?? [],
      ai_rows: slots.DATA?.ai?.rows?.slice(0, 30) ?? [],
      system_rows: slots.DATA?.apps?.rows?.slice(0, 30) ?? [],
      data_rows: slots.DATA?.data?.rows?.slice(0, 30) ?? [],
      risk_rows: slots.DATA?.risks?.rows?.slice(0, 30) ?? [],
      relationship_rows: slots.DATA?.rel?.rows?.slice(0, 50) ?? [],
      evidence_rows: slots.EVIDENCE ?? [],
      gaps: slots.GAPS ?? [],
    },
  };
}

const CLAUDE_NARRATIVE_TOOL_NAME = "submit_home_knowledge_pack_v2_narratives";

function claudeSystemPrompt() {
  return [
    "You are a senior strategy consultant writing the CXO-facing narrative layer for the Nexus Home Knowledge Pack.",
    "Audience: CXO / EVP / CIO / CDAO. Write like a top-tier strategy consultant synthesizing an enterprise context review, not product documentation.",
    "",
    "Data boundary:",
    "- Every fact in the supplied context is synthetic, PHI-free, planning-grade demo context. Do not claim real production data, audited realized savings, achieved ROI, production AI readiness, or a completed platform build.",
    "- AWS and Databricks (where present) are future/target foundation direction unless the context explicitly says otherwise.",
    "- Never invent a fact, number, owner, or system that is not present in the supplied context. If a claim would outrun the evidence, replace it with a caveat or a lower-grain supported statement.",
    "",
    "Language rules:",
    "- Product name is Nexus. Never use \"AbarVa\", \"guidebook\", \"definition\", \"not loaded\", \"runtime\", \"packet\", \"substrate\", or raw record/evidence IDs in prose.",
    "- Do not define dimensions generically. Every sentence must say what this tenant's context implies.",
    "- Executive grain: issue, implication, decision, evidence gate. No product help copy.",
    "- Short, scannable sentences. No giant paragraphs.",
    "",
    "Overclaim ban (this context is a synthetic demo scenario -- claims must not read as validated real-client production assertions):",
    "- Never write \"proven\", \"value is real\", \"fully loaded\", \"realized savings\", \"achieved ROI\", or \"production-ready\" as an assertion of fact.",
    "- A strength shows something WORKING IN THE LOADED SCENARIO, not a validated outcome. Phrase strengths as \"source-backed within the loaded context\" / \"adoption indicated in the loaded scenario\", not \"proven and adopted\".",
    "- Distinguish four truth levels every time it matters: a loaded fact, a derived measure, an industry pattern, and a strategic inference. A mature capability is only \"better positioned to convert a value hypothesis into a measurable outcome\" -- realized value still requires operational and finance validation. Never say value \"is real\".",
    "- Confidence describes breadth of loaded context, not verified outcomes. 'Rich' may describe breadth; it never means every required dimension is complete.",
    "",
    "Word budgets (hard limits, do not exceed):",
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
    "Load tier (tier) -- lets one template serve rich and thin tenants honestly:",
    "- tier: 'thin' | 'partial' | 'rich' based on evidence depth across dimensions. tier_label: a short human label. tier_title + tier_body: what this tier means for the reader. tier_conditions[]: ordered { text } list of what evidence would move it to the next tier. tier_basis: one sentence on why this tier was assigned. Be honest -- a thin tenant must read as thin, not be dressed up as rich.",
    "",
    "AI readiness (ai_readiness) -- ONLY emit a score you can defend:",
    "- 3-6 entries, each { readiness_dimension, score_pct (0-100), tone: 'red'|'amber'|'green', label, basis, evidence_refs }. basis is REQUIRED and must name the specific loaded evidence the score rests on. If you cannot ground a score, omit that dimension entirely. Never fabricate a percentage.",
    "",
    "Per-dimension module implications (dimension_module_implications):",
    "- For material dimensions, 1-3 entries each { dimension_key (echo verbatim from the input dimensions), module: 'intelligence'|'moves'|'source'|'tower', implication (one sentence tying THIS dimension's context to what that module can do), evidence_refs }.",
    "",
    `You must call the ${CLAUDE_NARRATIVE_TOOL_NAME} tool exactly once with your complete output. Echo each use case's "name" field and each dimension's "key" back verbatim (character-for-character) from the input context so they can be matched to their source records.`,
  ].join("\n");
}

function claudeNarrativeTool() {
  const strategyFieldNames = [
    "industry_pattern", "client_context_signal", "why_now", "operating_model_change",
    "change_strategy", "value_thesis", "readiness_barrier", "evidence_gate",
    "priority_rationale", "module_next_step",
  ];
  const strategyFields = Object.fromEntries(strategyFieldNames.map((key) => [key, { type: "string" }]));
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
    description: "Submit the CXO strategy narratives, use-case enrichment, executive-read block, load tier, AI readiness, and per-dimension module implications for this tenant's Home Knowledge Pack.",
    input_schema: {
      type: "object",
      required: ["narratives", "use_cases", "executive_read"],
      properties: {
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
        use_cases: {
          type: "array",
          items: {
            type: "object",
            required: ["name", ...strategyFieldNames],
            properties: { name: { type: "string" }, ...strategyFields },
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

async function callClaudeForPack(promptPacket) {
  if (!useClaude) return null;
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error("ANTHROPIC_API_KEY is required for --use-claude; refusing to fabricate narrative content.");
  }
  const Anthropic = (await import("@anthropic-ai/sdk")).default;
  const client = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
    timeout: Number(process.env.HOME_KNOWLEDGE_CLAUDE_TIMEOUT_MS || 180000),
  });
  const tool = claudeNarrativeTool();
  const maxAttempts = 3;
  let lastError = null;
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
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
      return toolUse.input;
    } catch (error) {
      lastError = error;
      const retryable = error?.status === 429 || (typeof error?.status === "number" && error.status >= 500);
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
    tier: claudeResult.tier ?? null,
    ai_readiness: asArray(claudeResult.ai_readiness),
    dimension_module_implications: asArray(claudeResult.dimension_module_implications),
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
    "industry_pattern", "client_context_signal", "why_now", "operating_model_change",
    "change_strategy", "value_thesis", "readiness_barrier", "evidence_gate",
    "priority_rationale", "module_next_step",
  ];
  let matched = 0;
  let matchMode = "name";
  claudeUseCases.forEach((entry, index) => {
    let target = byUniqueName.get(asText(entry.name).toLowerCase().trim());
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
      use_case_key: stableKey(firstText(item, ["name", "use_case_name", "ai_use_case"]) || `use-case-${index + 1}`),
      name: firstText(item, ["name", "use_case_name", "ai_use_case", "business_name"]) || `Use case ${index + 1}`,
      business_function: fn || "Owner to confirm",
      owner_hint: firstText(item, ["owner", "owner_hint", "business_owner", "technology_owner"]) || "Owner to confirm",
      stage: firstText(item, ["stage", "current_status", "use_case_status", "readiness_status"]) || "Planning-grade",
      industry_pattern: asText(item.industry_pattern) || industryPatternFor(item, pack),
      client_context_signal: asText(item.client_context_signal) || `${fn || "The relevant business area"} appears in the loaded context; confirm source-owner evidence before scaling.`,
      why_now: asText(item.why_now) || "Industry adoption pressure is rising, but the tenant evidence gate determines whether this is a near-term move or a staged dependency.",
      operating_model_change: asText(item.operating_model_change) || "Shift from isolated pilots to governed workflow ownership, data accountability, and measurable adoption gates.",
      change_strategy: asText(item.change_strategy) || "Start with a bounded pilot only where data, owner, control, and metric evidence can be certified; route the scale plan through Moves.",
      value_thesis: valueText || "Value hypothesis needs validation.",
      readiness_barrier: asText(item.readiness_barrier) || gate || "Evidence gate must be confirmed before scale.",
      evidence_gate: gate || "Confirm data, systems, controls, owners, and value evidence.",
      value_score: Number(valueScore.toFixed(2)),
      readiness_score: Number(readinessScore.toFixed(2)),
      evidence_score: Number(evidenceScore.toFixed(2)),
      dependency_risk_score: Number(dependencyRiskScore.toFixed(2)),
      total_priority_score: total,
      priority_rationale: asText(item.priority_rationale || item.why_this_is_top_5) ||
        "Ranked by combined value signal, industry urgency, tenant fit, readiness, evidence depth, and dependency leverage.",
      module_next_step: asText(item.module_next_step) || moduleForUseCase(item),
      supporting_dimensions: ["ai", "industry", "apps", "data", "risks", "evidence"],
      required_context: { gate },
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
function buildNextEvidenceRequests(pack) {
  const rows = [];
  let order = 0;
  for (const item of pack.design_slots?.NEXT_EVIDENCE ?? []) {
    const title = firstText(item, ["item", "title", "missing"]);
    if (!title) continue;
    order += 1;
    rows.push({
      title,
      narrative: firstText(item, ["narrative", "blocks"]) || null,
      requesting_dimension_key: null,
      unlocks_narrative: firstText(item, ["unlocks", "unlocks_narrative"]) || null,
      requesting_role_hint: firstText(item, ["owner_hint", "handoff", "owner"]) || null,
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
        title,
        narrative: firstText(entry, ["needed", "blocks", "narrative"]) || null,
        requesting_dimension_key: dimensionKey,
        unlocks_narrative: firstText(entry, ["unlocks", "blocks"]) || null,
        requesting_role_hint: firstText(entry, ["handoff", "owner_hint", "owner"]) || null,
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
  const promptPacket = buildPromptPacket(pack);
  const promptText = [
    "HOME KNOWLEDGE PACK V2 CLAUDE STRATEGY PROMPT",
    JSON.stringify(promptPacket, null, 2),
  ].join("\n\n");
  const claudeResult = await callClaudeForPack(promptPacket);
  const claudeMatch = mergeClaudeNarrativesIntoPack(pack, claudeResult);
  const useCases = enrichUseCases(pack);
  const graph = buildNodesAndEdges(pack);
  const renderPack = {
    ...pack,
    prompt_version: promptVersion,
    generated_model: `${pack.generated_model ?? "approved-json-pack"} + ${generatorVersion}`,
    design_slots: {
      ...(pack.design_slots ?? {}),
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
      ...(pack.narrative_sections ?? {}),
      use_cases_portfolio_view:
        pack.narrative_sections?.use_cases_portfolio_view ??
        "Prioritization combines tenant-specific current state, industry pressure, evidence readiness, and dependency risk. Each use case remains planning-grade until its source-owner evidence gate clears.",
    },
  };
  const packVersion = `home-pack-v2-${pack.tenant_key}-20260721-${sourceHash.slice(0, 8)}`;
  const generatedAt = new Date().toISOString();
  const dimensions = (pack.design_slots?.DIMS ?? []).map((dimension, index) => ({
    dimension_key: dimension.key,
    display_name: dimension.name,
    record_count: Number(dimension.count ?? 0),
    evidence_count: Number(dimension.evCount ?? 0),
    confidence_status: asText(dimension.status) || "directional",
    pct: asText(dimension.pct),
    executive_summary: asText(dimension.summary),
    cxo_meaning: asText(pack.design_slots?.STORY?.[dimension.key]?.meaning ?? dimension.summary),
    why_it_matters: asText(pack.design_slots?.STORY?.[dimension.key]?.matters),
    visual_type: asText(pack.design_slots?.VISUAL_BLOCKS?.[dimension.key]?.[0]?.type) || "context_snapshot",
    covers: dimension.covers ?? [],
    sources: dimension.sources ?? [],
    metadata: dimension,
    sort_order: index + 1,
  }));
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
  const narratives = Object.entries(pack.narrative_sections ?? {})
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
  const brief = pack.brief_model ?? {};
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
  const nextEvidenceRequestRows = buildNextEvidenceRequests(pack);
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
    tier: packTierRows[0]?.tier ?? null,
    warnings: [],
  };
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
  const normalized = {
    pack: {
      tenant_key: pack.tenant_key,
      tenant_name: pack.tenant_name,
      pack_version: packVersion,
      status: approve ? "approved" : "candidate",
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
      approved_by: approve ? "home-pack-v2-builder" : null,
      approved_at: approve ? generatedAt : null,
      effective_from: approve ? generatedAt : null,
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
    claude_prompt: promptPacket,
  };
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
  }));
  return normalized;
}

function writeArtifacts(normalized) {
  const tenantDir = path.join(reportDir, normalized.pack.tenant_key);
  fs.mkdirSync(tenantDir, { recursive: true });
  fs.writeFileSync(path.join(tenantDir, "home-knowledge-pack-v2.json"), JSON.stringify(normalized));
  fs.writeFileSync(path.join(tenantDir, "claude-strategy-prompt.json"), JSON.stringify(normalized.claude_prompt, null, 2));
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
