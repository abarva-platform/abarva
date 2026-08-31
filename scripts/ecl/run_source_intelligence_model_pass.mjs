#!/usr/bin/env node

import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const CONTRACT_VERSION = "source-derived-intelligence-model-pass/v1";
const ARTIFACT_VERSION = "source-derived-intelligence/v1";
const DEFAULT_MODEL = process.env.SOURCE_INTELLIGENCE_CLAUDE_MODEL || "claude-sonnet-5";
const DEFAULT_INVENTORY_DIR = path.join("outputs", "source-intelligence", "meridian-health", "current");
const DEFAULT_OUT_DIR = path.join("outputs", "source-intelligence", "meridian-health", "model-pass");
const REQUIRED_HOME_KEYS = [
  "executive_brief",
  "our_business",
  "strategy_value_creation",
  "how_we_operate",
  "technology_data",
  "performance_value",
  "leadership_perspective",
  "what_needs_attention",
  "current_state_architecture",
  "current_state_data_flow",
  "what_has_been_loaded",
  "browse_the_record",
  "applications_systems",
  "vendor_contracts",
  "infrastructure_platforms",
  "data_assets_integrations",
  "ai_value_governance",
];
const ARRAY_FIELDS = [
  "facts",
  "reading",
  "observed_facts",
  "calculated_observations",
  "model_derived_observations",
  "advisory_inferences",
  "do_not_claim",
  "citations",
];

function parseArgs(argv) {
  const options = {
    inventoryDir: DEFAULT_INVENTORY_DIR,
    outDir: DEFAULT_OUT_DIR,
    model: DEFAULT_MODEL,
    maxTokens: Number(process.env.SOURCE_INTELLIGENCE_MAX_TOKENS || 2400),
    limit: null,
    mode: "real",
    requireSourceContent: true,
    plantUnsupportedFact: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const next = () => {
      index += 1;
      if (index >= argv.length) throw new Error(`${arg} requires a value`);
      return argv[index];
    };

    if (arg === "--inventory-dir") options.inventoryDir = next();
    else if (arg === "--out-dir") options.outDir = next();
    else if (arg === "--model") options.model = next();
    else if (arg === "--max-tokens") options.maxTokens = Number(next());
    else if (arg === "--limit") options.limit = Number(next());
    else if (arg === "--mock") options.mode = "mock";
    else if (arg === "--allow-omitted-source-content") options.requireSourceContent = false;
    else if (arg === "--plant-unsupported-fact") options.plantUnsupportedFact = true;
    else if (arg === "--help") {
      console.log(`Usage: node scripts/ecl/run_source_intelligence_model_pass.mjs [options]

Runs one source-intelligence model pass over prompt envelopes produced by
scripts/ecl/build_source_intelligence_inventory.mjs.

Options:
  --inventory-dir <dir>              Directory containing manifest.json and prompts/*.prompt.json.
  --out-dir <dir>                    Output directory for raw responses, accepted artifacts, and ledgers.
  --model <name>                     Anthropic model name. Default: SOURCE_INTELLIGENCE_CLAUDE_MODEL or ${DEFAULT_MODEL}.
  --max-tokens <n>                   Max output tokens per source file. Default: 2400.
  --limit <n>                        Process only the first n prompt files.
  --mock                             Deterministic local proof; no model call and no API key required.
  --plant-unsupported-fact           Mock-mode planted failure: emit an unsupported fact number.
  --allow-omitted-source-content     Permit prompts that carry inventory only. Default refuses them.`);
      process.exit(0);
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }

  if (!Number.isFinite(options.maxTokens) || options.maxTokens <= 0) {
    throw new Error("--max-tokens must be a positive number");
  }
  if (options.limit !== null && (!Number.isFinite(options.limit) || options.limit <= 0)) {
    throw new Error("--limit must be a positive number");
  }
  return options;
}

function sha256(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function writeJson(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`);
}

function listPromptFiles(inventoryDir) {
  const promptDir = path.join(inventoryDir, "prompts");
  if (!fs.existsSync(promptDir)) throw new Error(`Prompt directory not found: ${promptDir}`);
  return fs
    .readdirSync(promptDir)
    .filter((file) => file.endsWith(".prompt.json"))
    .sort()
    .map((file) => path.join(promptDir, file));
}

function extractText(response) {
  return response.content
    .filter((block) => block.type === "text")
    .map((block) => block.text)
    .join("\n")
    .trim();
}

function parseJsonObject(text) {
  try {
    return JSON.parse(text);
  } catch {
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
    if (start >= 0 && end > start) return JSON.parse(text.slice(start, end + 1));
    throw new Error("model response did not contain a JSON object");
  }
}

function sourceContentState(prompt) {
  const content = prompt?.user?.source_content;
  if (typeof content !== "string" || content.trim() === "") return "omitted";
  return "included";
}

function buildModelUserPrompt(prompt) {
  return [
    "Return JSON only. Do not use markdown.",
    "The JSON object must follow this shape:",
    JSON.stringify(
      {
        what_this_source_represents: "string",
        grain: "string",
        authority: "string",
        observed_facts: [
          {
            statement: "directly supported fact",
            basis: "source_recorded",
            citations: [{ file: "source path", row: 2, column: "column_name" }],
          },
        ],
        calculated_observations: [
          {
            statement: "computed observation",
            basis: "calculated",
            formula: "short formula",
            citations: [{ file: "source path", row: null, column: "column_name" }],
          },
        ],
        model_derived_observations: [
          {
            statement: "interpretation connecting supported facts",
            basis: "model_derived_observation",
            citations: [{ file: "source path", row: 2, column: "column_name" }],
          },
        ],
        advisory_inferences: [
          {
            statement: "review-required implication",
            basis: "advisory_inference",
            citations: [{ file: "source path", row: 2, column: "column_name" }],
          },
        ],
        business_implications: ["string"],
        technology_implications: ["string"],
        risk_signals: ["string"],
        value_signals: ["string"],
        ownership_signals: ["string"],
        relationships_observed: ["string"],
        gaps: ["string"],
        contradictions: ["string"],
        suspected_data_quality_issues: ["string"],
        home_relevance: Object.fromEntries(REQUIRED_HOME_KEYS.map((key) => [key, ["string"]])),
        do_not_claim: ["string"],
        citations: [{ file: "source path", row: 2, column: "column_name" }],
      },
      null,
      2,
    ),
    "",
    "Rules:",
    "- Use only the supplied source_content and deterministic inventory.",
    "- Do not invent counts, money, dates, owners, systems, vendors, or relationships.",
    "- If a source file is only a guide, summarize how it governs collection and mark product relevance as context only.",
    "- Put literal facts from the file in observed_facts with basis source_recorded.",
    "- Put row counts, distributions, fill-rate observations, and simple aggregations in calculated_observations.",
    "- Put consulting interpretation in model_derived_observations or advisory_inferences, never in observed_facts.",
    "- Include citations with file, row, and column whenever the statement depends on row data.",
    "- Add do_not_claim warnings for anything the source cannot support.",
    "",
    "Prompt envelope:",
    JSON.stringify(prompt.user, null, 2),
  ].join("\n");
}

function normalizeArray(value) {
  if (!Array.isArray(value)) return [];
  return value.filter((entry) => entry !== null && entry !== undefined);
}

function normalizeHomeRelevance(value) {
  const out = {};
  const source = value && typeof value === "object" ? value : {};
  for (const key of REQUIRED_HOME_KEYS) out[key] = normalizeArray(source[key]);
  return out;
}

function statementOf(entry) {
  if (typeof entry === "string") return entry;
  if (entry && typeof entry.statement === "string") return entry.statement;
  return "";
}

function normalizeClaim(entry, basisFallback) {
  if (typeof entry === "string") return { statement: entry, basis: basisFallback, citations: [] };
  if (!entry || typeof entry !== "object") return { statement: String(entry ?? ""), basis: basisFallback, citations: [] };
  return {
    ...entry,
    statement: typeof entry.statement === "string" ? entry.statement : JSON.stringify(entry),
    basis: typeof entry.basis === "string" ? entry.basis : basisFallback,
    citations: Array.isArray(entry.citations) ? entry.citations : [],
  };
}

function extractNumbers(text) {
  return String(text ?? "").match(/-?\$?\d[\d,]*(?:\.\d+)?%?/g) ?? [];
}

function normalizeNumber(value) {
  return String(value).replace(/[$,%]/g, "").replace(/\.0+$/, "");
}

function addNumbers(target, value) {
  for (const number of extractNumbers(value)) target.add(normalizeNumber(number));
}

function addPercent(target, value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return;
  addNumbers(target, (n * 100).toFixed(1));
  addNumbers(target, (n * 100).toFixed(2));
}

function sourceAllowedNumbers(prompt) {
  const numbers = new Set();
  addNumbers(numbers, prompt?.user?.source_content ?? "");
  addNumbers(numbers, prompt?.source_file?.path);
  addNumbers(numbers, prompt?.source_file?.row_count);
  addNumbers(numbers, prompt?.source_file?.rows_read);
  addNumbers(numbers, prompt?.source_file?.column_count);
  const inventory = prompt?.user?.source_inventory ?? {};
  addNumbers(numbers, inventory.fill_rate);
  addPercent(numbers, inventory.fill_rate);
  for (const dimension of inventory.key_dimensions ?? []) addNumbers(numbers, dimension.distinct_count);
  for (const profile of inventory.column_profiles ?? []) {
    addNumbers(numbers, profile.populated_count);
    addNumbers(numbers, profile.distinct_count);
    addNumbers(numbers, profile.top_value_count);
    addNumbers(numbers, profile.top_value_share);
    addNumbers(numbers, profile.fill_rate);
    addPercent(numbers, profile.top_value_share);
    addPercent(numbers, profile.fill_rate);
  }
  return numbers;
}

function numberSupported(number, allowedNumbers) {
  const normalized = normalizeNumber(number);
  if (allowedNumbers.has(normalized)) return true;
  if (/^\d{1,2}$/.test(normalized)) return true;
  return false;
}

function normalizeArtifact(parsed, prompt, rawText, options) {
  const source = prompt.source_file;
  const classification = {
    observed_facts: normalizeArray(parsed.observed_facts),
    calculated_observations: normalizeArray(parsed.calculated_observations),
    model_derived_observations: normalizeArray(parsed.model_derived_observations),
    advisory_inferences: normalizeArray(parsed.advisory_inferences),
    do_not_claim: normalizeArray(parsed.do_not_claim),
  };
  classification.facts = [
    ...classification.observed_facts.map((entry) => normalizeClaim(entry, "source_recorded")),
    ...classification.calculated_observations.map((entry) => normalizeClaim(entry, "calculated")),
  ];
  classification.reading = [
    ...classification.model_derived_observations.map((entry) => normalizeClaim(entry, "model_derived_observation")),
    ...classification.advisory_inferences.map((entry) => normalizeClaim(entry, "advisory_inference")),
  ];
  const artifact = {
    contract_version: ARTIFACT_VERSION,
    tenant_key: prompt.tenant_key,
    assessment_id: prompt.assessment_id,
    source_file: {
      path: source.path,
      sha256: source.sha256,
      content_sha256: source.content_sha256 ?? source.sha256,
      schema_fingerprint: source.schema_fingerprint,
      row_count: source.row_count,
      rows_read: source.rows_read ?? source.row_count,
      column_count: source.column_count,
      grain: typeof parsed.grain === "string" && parsed.grain.trim() ? parsed.grain.trim() : "not_declared",
      source_family: source.source_family,
      page_mapping: source.page_mapping ?? prompt.user.source_inventory?.page_mapping ?? [],
    },
    deterministic_inventory: {
      fill_rate: prompt.user.source_inventory.fill_rate,
      columns: prompt.user.source_inventory.columns,
      column_profiles: prompt.user.source_inventory.column_profiles ?? [],
      constant_columns: prompt.user.source_inventory.constant_columns ?? [],
      near_constant_columns: prompt.user.source_inventory.near_constant_columns ?? [],
      columns_collapsed: prompt.user.source_inventory.columns_collapsed ?? [],
      columns_to_model: prompt.user.source_inventory.columns_to_model ?? [],
      narrative_columns: prompt.user.source_inventory.narrative_columns ?? [],
      structured_columns: prompt.user.source_inventory.structured_columns ?? [],
      key_dimensions: prompt.user.source_inventory.key_dimensions,
      sample_entities: prompt.user.source_inventory.sample_entities,
      read: prompt.user.source_inventory.read ?? {
        source_rows: source.row_count,
        rows_read: source.rows_read ?? source.row_count,
        strategy: "single_pass",
      },
    },
    model_input: {
      prompt_version: prompt.prompt_version,
      model: options.mode === "mock" ? "mock-source-intelligence-model" : options.model,
      context_hash: sha256(JSON.stringify(prompt.user)),
      source_content_hash: source.sha256,
      prompt_hash: sha256(JSON.stringify(prompt)),
      raw_response_hash: sha256(rawText),
      source_content_state: sourceContentState(prompt),
    },
    summary: {
      what_this_source_represents:
        typeof parsed.what_this_source_represents === "string" ? parsed.what_this_source_represents.trim() : "",
      authority: typeof parsed.authority === "string" ? parsed.authority.trim() : "",
      business_implications: normalizeArray(parsed.business_implications),
      technology_implications: normalizeArray(parsed.technology_implications),
      risk_signals: normalizeArray(parsed.risk_signals),
      value_signals: normalizeArray(parsed.value_signals),
      ownership_signals: normalizeArray(parsed.ownership_signals),
      relationships_observed: normalizeArray(parsed.relationships_observed),
      gaps: normalizeArray(parsed.gaps),
      contradictions: normalizeArray(parsed.contradictions),
      suspected_data_quality_issues: normalizeArray(parsed.suspected_data_quality_issues),
    },
    classification,
    home_relevance: normalizeHomeRelevance(parsed.home_relevance),
    facts: classification.facts,
    reading: classification.reading,
    do_not_claim: classification.do_not_claim,
    page_mapping: source.page_mapping ?? prompt.user.source_inventory?.page_mapping ?? [],
    verification: {
      state: "accepted",
      accepted_count:
        classification.observed_facts.length +
        classification.calculated_observations.length +
        classification.model_derived_observations.length,
      repaired_count: 0,
      rejected_count: 0,
      deferred_count: 0,
    },
    citations: normalizeArray(parsed.citations),
  };
  return artifact;
}

function validateArtifact(artifact, prompt) {
  const issues = [];
  if (artifact.contract_version !== ARTIFACT_VERSION) issues.push("wrong_contract_version");
  if (artifact.tenant_key !== prompt.tenant_key) issues.push("tenant_mismatch");
  if (artifact.assessment_id !== prompt.assessment_id) issues.push("assessment_mismatch");
  if (artifact.source_file.sha256 !== prompt.source_file.sha256) issues.push("source_hash_mismatch");
  if (artifact.source_file.rows_read !== artifact.source_file.row_count) issues.push("rows_read_mismatch");
  if (artifact.deterministic_inventory.read?.rows_read !== artifact.deterministic_inventory.read?.source_rows) {
    issues.push("inventory_rows_read_mismatch");
  }
  if (artifact.model_input.source_content_hash !== prompt.source_file.sha256) {
    issues.push("source_content_hash_mismatch");
  }
  for (const field of ARRAY_FIELDS) {
    const value = field === "citations" ? artifact.citations : artifact.classification[field];
    if (!Array.isArray(value)) issues.push(`${field}_not_array`);
  }
  for (const key of REQUIRED_HOME_KEYS) {
    if (!Array.isArray(artifact.home_relevance[key])) issues.push(`home_relevance_${key}_missing`);
  }
  if (!Array.isArray(artifact.facts)) issues.push("facts_not_array");
  if (!Array.isArray(artifact.reading)) issues.push("reading_not_array");
  if (!Array.isArray(artifact.page_mapping)) issues.push("page_mapping_not_array");
  const allowedFactNumbers = sourceAllowedNumbers(prompt);
  for (const fact of artifact.facts ?? []) {
    for (const number of extractNumbers(statementOf(fact))) {
      if (!numberSupported(number, allowedFactNumbers)) issues.push(`fact_number_not_supported:${number}`);
    }
  }
  const factNumbers = new Set();
  for (const fact of artifact.facts ?? []) {
    for (const number of extractNumbers(statementOf(fact))) factNumbers.add(normalizeNumber(number));
  }
  for (const reading of artifact.reading ?? []) {
    for (const number of extractNumbers(statementOf(reading))) {
      if (!numberSupported(number, factNumbers)) issues.push(`reading_number_not_supported_by_fact:${number}`);
    }
  }
  if (!artifact.summary.what_this_source_represents) issues.push("missing_source_summary");
  return issues;
}

function mockResponseForPrompt(prompt) {
  const source = prompt.source_file;
  const inventory = prompt.user.source_inventory;
  const topDimensions = inventory.key_dimensions
    .slice(0, 4)
    .map((dimension) => `${dimension.column} has ${dimension.distinct_count} distinct populated values`);
  const firstColumns = inventory.columns.slice(0, 6).join(", ");
  const response = {
    what_this_source_represents: `${source.source_family} source file with ${source.row_count} rows and ${source.column_count} columns.`,
    grain: `One source row from ${path.basename(source.path)}; exact grain requires the named source columns.`,
    authority: "Synthetic source package record; suitable for demo-source intelligence, not real-client attestation.",
    observed_facts: [
      {
        statement: `${path.basename(source.path)} contains ${source.row_count} data rows.`,
        basis: "source_recorded",
        citations: [{ file: source.path, row: null, column: "__row_count" }],
      },
      {
        statement: `The file schema begins with: ${firstColumns}.`,
        basis: "source_recorded",
        citations: [{ file: source.path, row: 1, column: "__header" }],
      },
    ],
    calculated_observations: [
      {
        statement: `The profiled fill rate is ${(inventory.fill_rate * 100).toFixed(1)}%.`,
        basis: "calculated",
        formula: "non_blank_cells / total_profiled_cells",
        citations: [{ file: source.path, row: null, column: "__fill_rate" }],
      },
      ...topDimensions.map((statement) => ({
        statement,
        basis: "calculated",
        formula: "distinct populated values by column",
        citations: [{ file: source.path, row: null, column: statement.split(" has ")[0] }],
      })),
    ],
    model_derived_observations: [
      {
        statement: `${source.source_family} should be summarized before Home narrative generation so the page writer sees file-level context, not only downstream product rows.`,
        basis: "model_derived_observation",
        citations: [{ file: source.path, row: null, column: "__file" }],
      },
    ],
    advisory_inferences: [
      {
        statement: "Review this source intelligence before CXO publication; mock mode proves the artifact path but does not substitute for Claude analysis.",
        basis: "advisory_inference",
        citations: [{ file: source.path, row: null, column: "__artifact" }],
      },
    ],
    business_implications: [`${source.source_family} contributes to the enterprise readout when cited by accepted facts.`],
    technology_implications: [`Columns and key dimensions should be available to technology and architecture lenses when relevant.`],
    risk_signals: inventory.fill_rate < 0.9 ? ["Fill rate is below 90%; route as a coverage gap."] : [],
    value_signals: [],
    ownership_signals: [],
    relationships_observed: [],
    gaps: [],
    contradictions: [],
    suspected_data_quality_issues: [],
    home_relevance: Object.fromEntries(REQUIRED_HOME_KEYS.map((key) => [key, []])),
    do_not_claim: ["Do not treat mock output as Claude-authored source intelligence."],
    citations: [{ file: source.path, row: null, column: "__file" }],
  };
  if (prompt.__plant_unsupported_fact) {
    response.observed_facts.push({
      statement: `${path.basename(source.path)} proves 987654321 unsupported records.`,
      basis: "source_recorded",
      citations: [{ file: source.path, row: null, column: "__planted_failure" }],
    });
  }
  return response;
}

async function callClaude(prompt, options) {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error("ANTHROPIC_API_KEY is required unless --mock is used");
  }
  const { default: Anthropic } = await import("@anthropic-ai/sdk");
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const response = await anthropic.messages.create({
    model: options.model,
    max_tokens: options.maxTokens,
    system: prompt.system,
    messages: [{ role: "user", content: buildModelUserPrompt(prompt) }],
  });
  return {
    text: extractText(response),
    response,
  };
}

async function processPromptFile(promptFile, options) {
  const prompt = readJson(promptFile);
  if (options.plantUnsupportedFact) prompt.__plant_unsupported_fact = true;
  const stem = path.basename(promptFile).replace(/\.prompt\.json$/, "");
  const promptHash = sha256(JSON.stringify(prompt));
  const sourceState = sourceContentState(prompt);
  const ledger = {
    contract_version: CONTRACT_VERSION,
    stem,
    prompt_file: promptFile,
    source_file: prompt.source_file?.path,
    source_sha256: prompt.source_file?.sha256,
    prompt_hash: promptHash,
    source_content_state: sourceState,
    model: options.mode === "mock" ? "mock-source-intelligence-model" : options.model,
    mode: options.mode,
    generated_at: new Date().toISOString(),
    accepted: false,
    issues: [],
  };

  if (options.requireSourceContent && sourceState !== "included") {
    ledger.issues.push("source_content_missing");
    ledger.verification_state = "refused";
    return { stem, prompt, ledger, artifact: null, raw: null };
  }

  try {
    let raw;
    if (options.mode === "mock") {
      const mock = mockResponseForPrompt(prompt);
      const text = JSON.stringify(mock, null, 2);
      raw = {
        mode: "mock",
        model: "mock-source-intelligence-model",
        text,
        usage: null,
        raw_response_hash: sha256(text),
      };
    } else {
      const result = await callClaude(prompt, options);
      raw = {
        mode: "real",
        model: result.response.model,
        text: result.text,
        usage: result.response.usage ?? null,
        raw_response_hash: sha256(result.text),
      };
    }

    const parsed = parseJsonObject(raw.text);
    const artifact = normalizeArtifact(parsed, prompt, raw.text, options);
    const issues = validateArtifact(artifact, prompt);
    ledger.raw_response_hash = raw.raw_response_hash;
    ledger.verification_state = issues.length === 0 ? "accepted" : "rejected";
    ledger.accepted = issues.length === 0;
    ledger.issues.push(...issues);
    ledger.counts = {
      observed_facts: artifact.classification.observed_facts.length,
      calculated_observations: artifact.classification.calculated_observations.length,
      model_derived_observations: artifact.classification.model_derived_observations.length,
      advisory_inferences: artifact.classification.advisory_inferences.length,
      do_not_claim: artifact.classification.do_not_claim.length,
      citations: artifact.citations.length,
    };
    artifact.verification.state = ledger.verification_state;
    artifact.verification.rejected_count = issues.length;
    return { stem, prompt, ledger, artifact: ledger.accepted ? artifact : null, raw };
  } catch (error) {
    ledger.verification_state = "rejected";
    ledger.issues.push(error instanceof Error ? error.message : String(error));
    return { stem, prompt, ledger, artifact: null, raw: null };
  }
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const manifestPath = path.join(options.inventoryDir, "manifest.json");
  const inventoryManifest = readJson(manifestPath);
  const allPromptFiles = listPromptFiles(options.inventoryDir);
  const promptFiles = options.limit === null ? allPromptFiles : allPromptFiles.slice(0, options.limit);
  fs.mkdirSync(options.outDir, { recursive: true });
  for (const dir of ["raw-responses", "accepted", "verification", "rejected"]) {
    fs.mkdirSync(path.join(options.outDir, dir), { recursive: true });
  }

  const results = [];
  for (const promptFile of promptFiles) {
    const result = await processPromptFile(promptFile, options);
    results.push(result);
    writeJson(path.join(options.outDir, "verification", `${result.stem}.verification-ledger.json`), result.ledger);
    if (result.raw) {
      writeJson(path.join(options.outDir, "raw-responses", `${result.stem}.raw-response.json`), result.raw);
    }
    if (result.artifact) {
      writeJson(path.join(options.outDir, "accepted", `${result.stem}.source-intelligence.json`), result.artifact);
    } else {
      writeJson(path.join(options.outDir, "rejected", `${result.stem}.rejected.json`), {
        prompt_file: promptFile,
        ledger: result.ledger,
      });
    }
  }

  const accepted = results.filter((result) => result.ledger.accepted).length;
  const rejected = results.length - accepted;
  const summary = {
    contract_version: CONTRACT_VERSION,
    artifact_contract_version: ARTIFACT_VERSION,
    source_inventory_contract_version: inventoryManifest.contract_version,
    tenant_key: inventoryManifest.tenant_key,
    assessment_id: inventoryManifest.assessment_id,
    source_ref: inventoryManifest.source_ref,
    source_root: inventoryManifest.source_root,
    mode: options.mode,
    model: options.mode === "mock" ? "mock-source-intelligence-model" : options.model,
    prompt_count: promptFiles.length,
    accepted_count: accepted,
    rejected_count: rejected,
    source_content_required: options.requireSourceContent,
    all_source_content_included: results.every((result) => result.ledger.source_content_state === "included"),
    output_directories: {
      raw_responses: path.join(options.outDir, "raw-responses"),
      accepted: path.join(options.outDir, "accepted"),
      verification: path.join(options.outDir, "verification"),
      rejected: path.join(options.outDir, "rejected"),
    },
    generated_at: new Date().toISOString(),
    issues: results
      .filter((result) => result.ledger.issues.length > 0)
      .map((result) => ({ stem: result.stem, issues: result.ledger.issues })),
  };
  writeJson(path.join(options.outDir, "run-manifest.json"), summary);
  console.log(JSON.stringify(summary, null, 2));
  if (rejected > 0) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack || error.message : String(error));
  process.exit(1);
});
