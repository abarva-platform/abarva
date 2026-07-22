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
    "Word budgets (hard limits, do not exceed):",
    "- narratives.enterprise_brief, narratives.operating_model, narratives.relationship_map, narratives.use_cases, narratives.evidence_boundary: 75-130 words each.",
    "- use_cases[].client_context_signal, why_now, operating_model_change, change_strategy, readiness_barrier, evidence_gate, priority_rationale: 22-45 words each.",
    "- use_cases[].industry_pattern, value_thesis: 22-42 words each.",
    "- use_cases[].module_next_step: a short executive-readable fragment, under 15 words.",
    "",
    `You must call the ${CLAUDE_NARRATIVE_TOOL_NAME} tool exactly once with your complete output. Echo each use case's "name" field back verbatim (character-for-character) from the input context so it can be matched to its source record.`,
  ].join("\n");
}

function claudeNarrativeTool() {
  const strategyFieldNames = [
    "industry_pattern", "client_context_signal", "why_now", "operating_model_change",
    "change_strategy", "value_thesis", "readiness_barrier", "evidence_gate",
    "priority_rationale", "module_next_step",
  ];
  const strategyFields = Object.fromEntries(strategyFieldNames.map((key) => [key, { type: "string" }]));
  return {
    name: CLAUDE_NARRATIVE_TOOL_NAME,
    description: "Submit the CXO strategy narratives and use-case strategy enrichment for this tenant's Home Knowledge Pack v2.",
    input_schema: {
      type: "object",
      required: ["narratives", "use_cases"],
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
        max_tokens: Number(process.env.HOME_KNOWLEDGE_CLAUDE_MAX_TOKENS || 8000),
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
  if (!claudeResult) return { matched: 0, total: (pack.design_slots?.USE_CASES ?? []).length };
  pack.narrative_sections = { ...(pack.narrative_sections ?? {}), ...(claudeResult.narratives ?? {}) };
  pack.generated_model = `${pack.generated_model ?? "approved-json-pack"} + claude:${model}`;
  const useCaseItems = pack.design_slots?.USE_CASES ?? [];
  const byName = new Map(
    useCaseItems.map((item) => [
      firstText(item, ["name", "use_case_name", "ai_use_case", "business_name"]).toLowerCase().trim(),
      item,
    ]),
  );
  let matched = 0;
  for (const entry of asArray(claudeResult.use_cases)) {
    const target = byName.get(asText(entry.name).toLowerCase().trim());
    if (!target) continue;
    matched += 1;
    for (const key of [
      "industry_pattern", "client_context_signal", "why_now", "operating_model_change",
      "change_strategy", "value_thesis", "readiness_barrier", "evidence_gate",
      "priority_rationale", "module_next_step",
    ]) {
      if (asText(entry[key]).trim()) target[key] = entry[key];
    }
  }
  return { matched, total: useCaseItems.length };
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
  const quality = {
    source_file: path.relative(repoRoot, sourceFile),
    prompt_file: `reports/home-knowledge-pack-v2/${pack.tenant_key}/claude-strategy-prompt.json`,
    dimensions: dimensions.length,
    dimension_rows: dimensionRows.length,
    use_cases: useCases.length,
    evidence_sources: evidence.length,
    relationship_nodes: graph.nodes.length,
    relationship_edges: graph.edges.length,
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
    claude_prompt: promptPacket,
  };
  normalized.pack.content_hash = sha256(JSON.stringify({
    dimensions,
    dimensionRows,
    useCases,
    evidence,
    graph,
    narratives,
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
