import crypto from "node:crypto";

import { preflightAnthropicDirectClient } from "@/lib/integrations/ai-egress";
import { azureRead } from "@/lib/data-plane/azureRead";
import { createTxSession } from "@/lib/data-plane/read-adapters/azureSession";
import {
  assertVisibleAnswerContract,
  type VisibleAnswerContractResult,
} from "@/lib/agent/visible-answer-contract";
import {
  evaluateTowerValueClaimGate,
  TOWER_REALIZED_VALUE_REQUIRES_MEASURED_EVIDENCE,
} from "@/lib/tower/value-claim-gate";
import { buildTowerV3ContextPackFromTenantInputs } from "@/lib/enterprise-knowledge/tower/tower-v3-context-pack-from-tenant-inputs";
import {
  buildTowerV3RuntimeViewModel,
  type TowerV3RuntimeViewModel,
} from "@/lib/tower/tower-v3-runtime-view";
import { isTowerV3ContextRuntimeEnabled } from "@/lib/tower/tower-v3-runtime-flag";
import type { TowerValueClaim } from "@/lib/enterprise-knowledge/contracts";

const MODEL_NAME = "claude-sonnet-4-6";
const PROMPT_VERSION = "cio_tower_advisor_prompt_v3";
const TEMPERATURE = 0;
const MAX_TOKENS = 1800;

type JsonRecord = Record<string, unknown>;

export interface CioTowerContract {
  contract_key: string;
  intent: string;
  question_family: string;
  measure_key: string | null;
  artifact_type: string;
  examples: unknown;
}

export interface CioTowerMeasureResult {
  measure_key: string;
  period: string;
  basis: string;
  scope: string;
  value_numeric: string | number | null;
  value_json: JsonRecord;
  source_fact_keys: string[];
  formula_version: string;
  label?: string | null;
  description?: string | null;
}

export interface CioTowerFactRow {
  fact_key: string;
  entity_key: string | null;
  entity_type: string | null;
  entity_display_name: string | null;
  measure: string;
  scope: string;
  view: string;
  amount_type: string;
  basis: string;
  period: string;
  value_numeric: string | number | null;
  value_text: string | null;
  unit: string;
  value_source: string;
  confidence: string;
  source_key: string | null;
  source_row: string | null;
  attributes: JsonRecord;
}

export interface CioTowerRelationshipRow {
  relationship_key: string;
  from_name: string | null;
  to_name: string | null;
  relationship_type: string;
  confidence: string;
  source_key: string | null;
  source_row: string | null;
}

export interface CioTowerValueClaimPolicy {
  projectionRole: "derived_read_model";
  projectionPath: "path_a_derived_projection";
  sourceOfTruthStatus: "bridge_only";
  v3ReconciliationStatus: "not_v3_reconciled";
  realizedValueLanguageAllowed: boolean;
  claim: TowerValueClaim;
  caveat: string;
}

export interface CioTowerPromptContext {
  tenantKey: string;
  tenantName: string;
  question: string;
  contract: CioTowerContract;
  measures: CioTowerMeasureResult[];
  relevantFacts: CioTowerFactRow[];
  relationships: CioTowerRelationshipRow[];
  gaps: string[];
  valueClaimPolicy: CioTowerValueClaimPolicy;
  towerV3RuntimeView?: TowerV3RuntimeViewModel | null;
}

export interface CioTowerAnswerResult {
  response: string;
  modelOutputRaw: string;
  modelOutput: CioTowerVisibleAnswerContract;
  promptPackageKey: string;
  traceKey: string;
  promptHash: string;
  model: string;
  validationStatus: "passed" | "failed";
  validationErrors: string[];
  latencyMs: number;
  metricCards: Array<{ label: string; value: string }>;
  gaps: string[];
  v6VisibleOutputAudit: VisibleAnswerContractResult;
}

export interface CioTowerVisibleTable {
  id: string;
  title: string;
  columns: string[];
  rows: string[][];
}

export interface CioTowerVisibleTab {
  id: string;
  label: string;
  prose: string;
  tables?: CioTowerVisibleTable[];
}

export interface CioTowerVisibleAnswerContract {
  version: "cio_tower_visible_answer_v1";
  answer: string;
  tables?: CioTowerVisibleTable[];
  tabs?: CioTowerVisibleTab[];
  followUpQuestion?: string | null;
}

const CONTRACT_MATCHERS: Array<{ key: string; patterns: RegExp[] }> = [
  {
    key: "tower_top_it_programs_by_budget",
    patterns: [
      /top\s+\d+\s+(it\s+)?(program|initiative)/i,
      /largest\s+(it\s+)?(program|initiative)/i,
      /rank.*(program|initiative).*budget/i,
      /decision\s+lanes?/i,
      /\b(fund|fix|freeze)\b.*(program|initiative|portfolio)/i,
    ],
  },
  {
    key: "tower_total_it_spend",
    patterns: [
      /what.*(it\s+)?spend/i,
      /total.*(it\s+)?budget/i,
      /fy26.*(it\s+)?budget/i,
      /(enterprise|technology).*(budget|spend)/i,
      /budget.*by.*(company|owner|function|service|portfolio)/i,
      /shared services/i,
      /portfolio-company.*(it\s+)?budget/i,
    ],
  },
  {
    key: "tower_run_change_split",
    patterns: [/run.*change/i, /change.*run/i, /capex.*opex/i, /opex.*capex/i],
  },
  {
    key: "tower_value_realization",
    patterns: [
      /measured value/i,
      /value.*lag/i,
      /realized value/i,
      /where.*value/i,
      /promised.*(measured|proven)/i,
      /gap.*(promised|measured|value)/i,
      /value proof/i,
      /value realization/i,
      /claimable/i,
      /claim gate/i,
      /finance[-\s]?validated/i,
      /proof funnel/i,
      /promised.*validated/i,
      /ai portfolio/i,
      /recommended actions?/i,
      /evidence gaps?/i,
    ],
  },
  {
    key: "tower_trend_it_budget",
    patterns: [/trend/i, /fy25.*fy26/i, /last year/i, /year over year/i],
  },
  {
    key: "tower_outside_scope",
    patterns: [/capital of spain/i, /poem/i, /recipe/i, /weather/i],
  },
];

const CIO_TOWER_TENANT_KEY_BY_ALIAS: Record<string, string> = {
  apex: "apex-retail",
  apexretail: "apex-retail",
  "apex-retail": "apex-retail",
  meridian: "meridian-health",
  "meridian-health": "meridian-health",
  arcturus: "first-capital-financial",
  firstcapital: "first-capital-financial",
  "first-capital": "first-capital-financial",
  "first-capital-financial": "first-capital-financial",
  skyharbor: "skyharbor-air",
  "skyharbor-air": "skyharbor-air",
  lakeshore: "lakeshore-holdings",
  lakeshoreholdings: "lakeshore-holdings",
  lakeshoreindustries: "lakeshore-holdings",
  "lakeshore-holdings": "lakeshore-holdings",
  "lakeshore-industries": "lakeshore-holdings",
};

export function canonicalCioTowerTenantKey(value: string): string {
  const normalized = value.trim().toLowerCase();
  const slug = normalized.replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const compact = normalized.replace(/[^a-z0-9]+/g, "");
  return (
    CIO_TOWER_TENANT_KEY_BY_ALIAS[normalized] ??
    CIO_TOWER_TENANT_KEY_BY_ALIAS[slug] ??
    CIO_TOWER_TENANT_KEY_BY_ALIAS[compact] ??
    slug
  );
}

function stableKey(prefix: string, parts: readonly string[]): string {
  const hash = crypto
    .createHash("sha256")
    .update(parts.join("\n"))
    .digest("hex")
    .slice(0, 24);
  return `${prefix}_${hash}`;
}

function sha256(text: string): string {
  return crypto.createHash("sha256").update(text).digest("hex");
}

export function matchContractKey(question: string): string {
  for (const matcher of CONTRACT_MATCHERS) {
    if (matcher.patterns.some((pattern) => pattern.test(question)))
      return matcher.key;
  }
  return "tower_top_it_programs_by_budget";
}

function money(value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === "")
    return "not loaded";
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return String(value);
  const abs = Math.abs(numeric);
  if (abs >= 1_000_000_000) return `$${(numeric / 1_000_000_000).toFixed(1)}B`;
  if (abs >= 1_000_000) return `$${(numeric / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `$${Math.round(numeric / 1_000)}K`;
  return `$${Math.round(numeric)}`;
}

function factValue(row: CioTowerFactRow): string {
  if (row.unit === "usd") return money(row.value_numeric);
  if (row.value_numeric !== null && row.value_numeric !== undefined)
    return `${row.value_numeric}${row.unit && row.unit !== "none" ? ` ${row.unit}` : ""}`;
  if (row.value_text) return row.value_text;
  return "not loaded";
}

function humanizeFieldName(value: string): string {
  return value
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\bfy(\d{2})\b/gi, "FY$1")
    .replace(/\bytd\b/gi, "YTD")
    .replace(/\bit\b/gi, "IT");
}

function safeBasisLabel(value: string | null | undefined): string {
  if (!value) return "basis not loaded";
  const normalized = value.trim().toLowerCase();
  if (/measured|realized|actual/.test(normalized)) {
    return "finance-attestation pending";
  }
  if (/committed/.test(normalized)) return "committed";
  if (/forecast|planned|promise/.test(normalized)) return "forecast/planning";
  return humanizeFieldName(value);
}

function safeMeasureLabel(labelOrKey: string | null | undefined): string {
  const raw = (labelOrKey ?? "").trim();
  if (!raw) return "Tower measure";
  const normalized = raw.toLowerCase().replace(/[_-]+/g, " ");
  if (/measured\s+value|realized\s+value|value\s+ytd/.test(normalized)) {
    return "Value figure awaiting finance attestation";
  }
  if (/promised\s+value|committed\s+value/.test(normalized)) {
    return "Forecast value commitment";
  }
  if (/\broi\b/.test(normalized)) return "Return case";
  if (/savings/.test(normalized)) return "Cost-reduction estimate";
  return humanizeFieldName(raw);
}

function normalizeVisibleText(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

export function validateVisibleAnswer(text: string): string[] {
  const violations: string[] = [];
  const checks: Array<[string, RegExp]> = [
    [
      "raw_id_or_internal_key",
      /\b[A-Z]{2,}[A-Z0-9_-]*-\d{2,}\b|[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}/,
    ],
    ["visible_scaffold_label", /(^|\n)\s*(Read|Evidence|Implication|Next move):/i],
    [
      "unsupported_outcome_proof_language",
      /\b(ROI|savings|achieved|realized[-\s]?value|measured[-\s]?value|measured[-\s]?outcome|proven[-\s]?value|delivered[-\s]?value|value captured)\b/i,
    ],
    [
      "internal_data_plane_language",
      /\b(loaded evidence|tenant evidence|evidence ledger|semantic packet|retrieved context|source signals|rows)\b/i,
    ],
    ["code_fence_or_hidden_visual_payload", /```|abarva-canvas|chart\s*json|"\s*(?:type|data|series|x|y)\s*"\s*:/i],
    ["markdown_table_in_answer_field", /^\s*\|.+\|\s*$/m],
    ["atlas_branding", /\bAtlas\b/i],
  ];
  for (const [id, pattern] of checks) {
    if (pattern.test(text)) violations.push(id);
  }
  return violations;
}

function contractArtifactRequirements(contract: CioTowerContract): string[] {
  const artifact = `${contract.intent} ${contract.artifact_type} ${contract.question_family}`.toLowerCase();
  const requiresTable =
    /table|chart|graph|trend|rank|comparison|portfolio|split|waterfall/.test(artifact);
  const requiresRanking = /rank|top|largest|portfolio|priority/.test(artifact);
  const requiresTrend = /trend|fy25|fy26|year|period|waterfall/.test(artifact);
  return [
    `- Table required: ${requiresTable ? "yes" : "no"}.`,
    `- Ranking required: ${requiresRanking ? "yes" : "no"}.`,
    `- Trend requested: ${requiresTrend ? "yes" : "no"}.`,
    requiresTable
      ? "- If this asks for a chart, graph, ranking, trend, portfolio, or comparison, populate tables[] with chart-ready supported rows. The UI may visualize those rows later."
      : "- Do not include a table unless it materially improves the executive decision.",
  ];
}

function permittedDecisionPostures(contract: CioTowerContract): string[] {
  if (contract.contract_key === "tower_outside_scope") return ["Validate"];
  if (contract.contract_key === "tower_value_realization")
    return ["Scale", "Fix", "Freeze", "Validate"];
  if (
    contract.contract_key === "tower_total_it_spend" ||
    contract.contract_key === "tower_run_change_split" ||
    contract.contract_key === "tower_trend_it_budget"
  ) {
    return ["Fix", "Freeze", "Validate"];
  }
  return ["Scale", "Fix", "Freeze", "Stop", "Validate"];
}

function collectVisibleTextFromContract(
  contract: CioTowerVisibleAnswerContract,
): string[] {
  const chunks = [contract.answer];
  for (const table of contract.tables ?? []) {
    chunks.push(table.title, ...table.columns, ...table.rows.flat());
  }
  for (const tab of contract.tabs ?? []) {
    chunks.push(tab.label, tab.prose);
    for (const table of tab.tables ?? []) {
      chunks.push(table.title, ...table.columns, ...table.rows.flat());
    }
  }
  if (contract.followUpQuestion) chunks.push(contract.followUpQuestion);
  return chunks.filter(Boolean);
}

export function parseVisibleAnswerContract(
  raw: string,
): CioTowerVisibleAnswerContract {
  const trimmed = raw.trim();
  const fencedJson = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/)?.[1]?.trim();
  const wrappedJson =
    !trimmed.startsWith("{") && trimmed.includes("{") && trimmed.includes("}")
      ? trimmed.slice(trimmed.indexOf("{"), trimmed.lastIndexOf("}") + 1)
      : null;
  const jsonText = trimmed.startsWith("{")
    ? trimmed
    : (fencedJson ?? wrappedJson ?? trimmed);
  const parsed = JSON.parse(jsonText) as Partial<CioTowerVisibleAnswerContract>;
  if (parsed.version !== "cio_tower_visible_answer_v1") {
    throw new Error("cio_tower_visible_contract_invalid_version");
  }
  if (typeof parsed.answer !== "string" || parsed.answer.trim().length === 0) {
    throw new Error("cio_tower_visible_contract_missing_answer");
  }
  for (const table of parsed.tables ?? []) {
    if (
      !table ||
      typeof table.title !== "string" ||
      !Array.isArray(table.columns) ||
      !Array.isArray(table.rows)
    ) {
      throw new Error("cio_tower_visible_contract_invalid_table");
    }
    if (
      table.columns.length === 0 ||
      table.columns.length > 4 ||
      table.rows.length > 5 ||
      table.rows.some(
        (row) =>
          !Array.isArray(row) ||
          row.length !== table.columns.length ||
          row.some((cell) => typeof cell !== "string" || cell.trim().length === 0),
      )
    ) {
      throw new Error("cio_tower_visible_contract_invalid_table_shape");
    }
  }
  for (const tab of parsed.tabs ?? []) {
    if (
      !tab ||
      typeof tab.label !== "string" ||
      typeof tab.prose !== "string"
    ) {
      throw new Error("cio_tower_visible_contract_invalid_tab");
    }
  }
  return {
    version: "cio_tower_visible_answer_v1",
    answer: parsed.answer,
    tables: parsed.tables ?? [],
    tabs: parsed.tabs ?? [],
    followUpQuestion: parsed.followUpQuestion ?? null,
  };
}

export function buildCioTowerClaudePrompt(
  context: CioTowerPromptContext,
): string {
  const measureLines = context.measures.map((measure) => {
    const label = safeMeasureLabel(measure.label ?? measure.measure_key);
    const value =
      measure.value_numeric === null
        ? "not loaded"
        : money(measure.value_numeric);
    return `- [governed_measure] ${label}: ${value} (${humanizeFieldName(measure.period)}, ${safeBasisLabel(measure.basis)})`;
  });

  const factLines = context.relevantFacts.slice(0, 18).map((fact, index) => {
    const name =
      fact.entity_display_name ?? fact.entity_key ?? `Fact ${index + 1}`;
    return `- [governed_fact] ${name}: ${safeMeasureLabel(fact.measure)} = ${factValue(fact)} (${humanizeFieldName(fact.period)}, ${safeBasisLabel(fact.basis)}, ${fact.confidence} confidence)`;
  });

  const relationshipLines = context.relationships.slice(0, 12).map((rel) => {
    return `- [governed_relationship] ${rel.from_name ?? "unknown"} ${humanizeFieldName(rel.relationship_type)} ${rel.to_name ?? "unknown"} (${rel.confidence} confidence)`;
  });

  const gapLines = context.gaps.map((gap) => `- ${gap}`);
  const artifactRequirementLines = contractArtifactRequirements(context.contract);
  const permittedPostures = permittedDecisionPostures(context.contract);
  const valueClaimPolicyLines = [
    `- Projection fallback role: ${context.valueClaimPolicy.projectionRole}.`,
    "- Projection fallback authority: planning-grade only; never call it governed Tower truth, finance-approved value, production evidence, or a realized outcome.",
    `- Source-of-truth status: ${context.valueClaimPolicy.sourceOfTruthStatus}; v3 reconciliation: ${context.valueClaimPolicy.v3ReconciliationStatus}.`,
    `- Realized-value language allowed: ${context.valueClaimPolicy.realizedValueLanguageAllowed ? "yes" : "no"}.`,
    `- Claim gate: ${context.valueClaimPolicy.claim.gateStatus}; outcome-proof language stays blocked until finance-attested baseline and actuals evidence is reconciled.`,
  ];
  const towerV3Runtime = context.towerV3RuntimeView;
  const towerV3Lines = towerV3Runtime
    ? [
        `- Context pack: ${towerV3Runtime.contextPackId}; mode ${towerV3Runtime.mode}; truth ${towerV3Runtime.truthStatus}.`,
        "- Default visible tabs are sourced from the governed context pack / derived projection, not the legacy bridge.",
        `- Metric records: ${towerV3Runtime.metricCount}; value records: ${towerV3Runtime.valueRecordCount}; value claim gates: ${towerV3Runtime.valueClaimCount}.`,
        `- Gate counts: ${towerV3Runtime.gateCounts.allowed} allowed, ${towerV3Runtime.gateCounts.caveated} caveated, ${towerV3Runtime.gateCounts.blocked} blocked.`,
        `- Outcome-proof language allowed: ${towerV3Runtime.blockedOutcomeProof ? "no" : "yes"}.`,
        "- Default tab postures:",
        ...towerV3Runtime.defaultTabs.map(
          (tab) =>
            `  - ${tab.label}: ${tab.sourceClassification}; ${tab.sourcePosture}; ${tab.rows} rows; caveat: ${tab.caveat}`,
        ),
        "- Top value hypotheses:",
        ...towerV3Runtime.valueHypotheses.slice(0, 8).map(
          (item) =>
            `  - ${item.label}: ${item.value}; basis ${safeBasisLabel(item.claimBasis)}; gate ${item.gateStatus}; proof still required`,
        ),
        "- Executive blocker themes:",
        ...towerV3Runtime.gapThemes.map(
          (theme) =>
            `  - ${theme.title}: ${theme.whyItMatters}; required ${theme.requiredEvidence.join(", ")}`,
        ),
        "- CIO/CFO insights:",
        ...towerV3Runtime.executiveInsights.map(
          (insight) =>
            `  - ${insight.role}: ${insight.insightTitle}; implication ${insight.decisionImplication}; next ${insight.nextAction}; claim strength ${insight.claimStrength}; gate ${insight.valueClaimGateStatus}`,
        ),
      ]
    : [];

  return [
    `You are Tower aVa, AbarVa's governed CIO/CFO performance and value-control advisor speaking to ${context.tenantName}.`,
    "",
    "Answer only from the supplied Tower Question Contract and Tower Context Package.",
    "Your job is to explain governed measures, identify the management implication, and recommend the next leadership action without changing, reconciling, or embellishing the underlying facts.",
    "",
    "Authority order:",
    "1. Governed measure results.",
    "2. Governed Tower facts and relationships.",
    "3. Explicitly labeled projection fallbacks.",
    "4. Derived gaps supplied in the context package.",
    "- Do not use general knowledge to create tenant metrics, trends, rankings, explanations, value claims, or product capabilities.",
    "- Industry knowledge may explain the management implication only when the question contract allows it; it must never override Tower data.",
    "",
    "Question contract is authoritative:",
    "- Follow the business question, measure key, artifact shape, scope, ranking logic, time basis, aggregation rule, and value/evidence status implied by the supplied contract.",
    "- Do not reinterpret a measure or combine values unless the contract explicitly permits it.",
    "- If the user asks outside contract scope, state that Tower does not have governed evidence to answer and name the business data required.",
    "",
    "Separate three layers before writing:",
    "- Observed: what governed measures and facts establish.",
    "- Interpretation: what those facts mean for performance, value, risk, funding, or execution.",
    "- Action: what leadership should scale, fix, freeze, stop, or validate next.",
    "- Never present interpretation as observed fact. Never present action as a validated outcome.",
    "",
    "Decision posture vocabulary:",
    `- Choose one primary posture from: ${permittedPostures.join(", ")}.`,
    "- Scale means usage, KPI movement, value evidence, and controls support expansion.",
    "- Fix means the opportunity is strategically sound, but adoption, process, data, ownership, or proof is blocking value.",
    "- Freeze means no expansion, spend, or claims until a named evidence/control gap is resolved.",
    "- Stop means poor fit, duplication, unacceptable risk, or no credible value path.",
    "- Validate means evidence is insufficient for a funding or performance decision.",
    "",
    "Non-negotiable visible-answer contract:",
    "- Lead with the actual answer, judgment, or recommendation.",
    "- Do not open with filler, a summary of the question, or a template.",
    "- Do not mention internal retrieval, evidence machinery, semantic packets, database rows, table names, JSON, source keys, record IDs, UUIDs, or debug terms.",
    '- Do not use visible scaffolding labels like "Read:", "Evidence:", "Implication:", or "Next move:".',
    "- Do not mention Atlas. The agent is aVa.",
    "- If the data is incomplete, state the specific missing business field in plain English.",
    "- Do not describe value as realized, proven, harvested, or delivered unless the Tower value-claim policy below explicitly allows realized-value language.",
    '- If realized-value language is not allowed, do not use the phrase "realized value" at all, even to say it is blocked. Say the value is promised, planned, forecast, finance-attestation pending, outcome-proof pending, or measurement readiness depending on the loaded fields.',
    '- When outcome-proof language is not allowed, also avoid these visible words and phrases entirely: "ROI", "savings", "achieved", "measured outcome", "proven value", "delivered value", and "value captured". Use "forecast value", "planned benefit", "measurement gate", "finance-attestation gate", or "outcome-proof pending" instead.',
    "- Write like a human senior advisor: direct, concise, specific, and willing to disagree.",
    "- Shape the answer as a point of view: what this means, why it matters, and what the executive should inspect next.",
    "- Prefer 2-4 strong advisory paragraphs over mechanical explanation. Avoid robotic phrases like 'The CIO read is'.",
    "- Answer the current question literally. If the user asks a follow-up about vendors, services, owners, or value gaps, do not repeat the generic budget-mix answer.",
    "- If the follow-up data is not loaded, say exactly what cut is missing and why that prevents the next ranking.",
    "- Make the answer specific to the loaded Tower posture: name the relevant blocker, owner, decision, or measurement gate in plain English.",
    "- If you include a table, keep it board-readable: at most 5 rows, at most 4 columns, complete cells, no abbreviations that require internal knowledge.",
    "- A table with 6 or more rows is invalid. If there are more than 5 candidates, choose the top 5 by executive relevance or use the fifth row to summarize the remaining group.",
    "- Never use markdown code fences, fenced chart blocks, inline JSON, chart JSON, hidden visual payloads, or markdown tables inside the answer string.",
    "- If the answer would be long, compress it. Valid JSON is more important than a longer answer.",
    ...(towerV3Runtime
      ? [
          "- For this tenant, use the governed context-pack section as the primary Tower source.",
          "- Treat legacy bridge measures/facts as diagnostic fallback only. Do not let bridge facts override the context-pack posture.",
        ]
      : []),
    "- Use short paragraphs or bullets when they improve readability.",
    "- End naturally based on the question. Do not append generic menu choices.",
    "",
    "Output contract:",
    "- Return valid JSON only. No markdown fence. No extra text outside JSON.",
    "- You own every user-visible word in the JSON fields.",
    "- AbarVa will render the strings exactly as returned. It will not rewrite, summarize, scrub, relabel, infer, or improve them.",
    "- Put the main prose in answer.",
    "- If a table, chart, graph, ranking, trend, portfolio, or comparison helps, include tables[]. The renderer will display your title, column labels, and cell text exactly and may visualize the table later.",
    "- If multiple panes help, include tabs[]. The renderer will place your tab labels and prose exactly.",
    "- If no table is needed, return tables as an empty array.",
    "- Do not duplicate table content inside answer. Use tables[] only.",
    "",
    "Required JSON shape:",
    "{",
    '  "version": "cio_tower_visible_answer_v1",',
    '  "answer": "final user-visible answer text",',
    '  "tables": [{"id":"short_id","title":"visible title","columns":["visible column"],"rows":[["visible cell"]]}],',
    '  "tabs": [{"id":"short_id","label":"visible tab label","prose":"visible prose","tables": []}],',
    '  "followUpQuestion": "one specific optional follow-up question, or null"',
    "}",
    "",
    "Follow-up question rule:",
    "- If you include followUpQuestion, it must directly continue from your answer and name the specific metric, gap, risk, owner, or decision you just surfaced.",
    "- Do not use generic menu choices like 'Do you want the next view?' or 'Should I show more details?'",
    "- If there is no natural next branch from the answer, return null.",
    "",
    `Question: ${context.question}`,
    "",
    "Tower Question Contract:",
    `Contract key: ${context.contract.contract_key}`,
    `Intent: ${context.contract.intent}`,
    `Question family: ${context.contract.question_family}`,
    `Measure key: ${context.contract.measure_key ?? "none"}`,
    `Preferred artifact shape: ${context.contract.artifact_type}`,
    `Permitted decision postures: ${permittedPostures.join(", ")}`,
    artifactRequirementLines.join("\n"),
    "",
    ...(towerV3Runtime
      ? [
          "Primary governed Tower context:",
          towerV3Lines.join("\n"),
          "",
        ]
      : []),
    "Governed measures:",
    measureLines.length
      ? measureLines.join("\n")
      : "- No governed measure result is loaded for this question.",
    "",
    "Most relevant facts:",
    factLines.length
      ? factLines.join("\n")
      : "- No relevant facts are loaded for this question.",
    "",
    "Relevant relationships:",
    relationshipLines.length
      ? relationshipLines.join("\n")
      : "- No relevant relationships are loaded for this question.",
    "",
    "Known data gaps:",
    gapLines.length
      ? gapLines.join("\n")
      : "- No blocking gap identified for this question.",
    "",
    "Tower value-claim policy:",
    valueClaimPolicyLines.join("\n"),
    "",
    "Answer now. Return the JSON object only.",
  ].join("\n");
}

function cioTowerTablesToGfm(tables: CioTowerVisibleTable[]): string {
  return tables
    .map((t) => {
      const header = `| ${t.columns.join(" | ")} |`;
      const sep = `| ${t.columns.map(() => "---").join(" | ")} |`;
      const rows = t.rows.map((row) => `| ${row.join(" | ")} |`).join("\n");
      return `**${t.title}**\n\n${header}\n${sep}\n${rows}`;
    })
    .join("\n\n");
}

async function loadContract(question: string): Promise<CioTowerContract> {
  const key = matchContractKey(question);
  const rows = await azureRead.query<CioTowerContract>(
    `select contract_key, intent, question_family, measure_key, artifact_type, examples
       from cio_tower.question_contracts
      where contract_key = $1 and active = true
      limit 1`,
    [key],
  );
  return (
    rows[0] ?? {
      contract_key: "tower_outside_scope",
      intent: "outside_scope",
      question_family: "outside_tower_scope",
      measure_key: null,
      artifact_type: "handoff",
      examples: [],
    }
  );
}

async function loadMeasures(
  tenantKey: string,
): Promise<CioTowerMeasureResult[]> {
  return azureRead.query<CioTowerMeasureResult>(
    `select mr.measure_key, mr.period, mr.basis, mr.scope, mr.value_numeric, mr.value_json,
            mr.source_fact_keys, mr.formula_version, m.label, m.description
       from cio_tower.measure_results mr
       left join cio_tower.measures m on m.measure_key = mr.measure_key
      where mr.tenant_key = $1
      order by mr.measure_key, mr.period`,
    [tenantKey],
  );
}

function factWhereForContract(contract: CioTowerContract): {
  views: string[];
  limit: number;
} {
  if (contract.contract_key === "tower_top_it_programs_by_budget")
    return { views: ["initiative_budget", "value"], limit: 30 };
  if (contract.contract_key === "tower_total_it_spend")
    return { views: ["it_budget"], limit: 20 };
  if (contract.contract_key === "tower_run_change_split")
    return { views: ["it_budget"], limit: 25 };
  if (contract.contract_key === "tower_value_realization")
    return { views: ["value", "initiative_budget"], limit: 30 };
  if (contract.contract_key === "tower_trend_it_budget")
    return { views: ["it_budget"], limit: 30 };
  return { views: ["initiative_budget", "it_budget", "value"], limit: 20 };
}

async function loadRelevantFacts(
  tenantKey: string,
  contract: CioTowerContract,
): Promise<CioTowerFactRow[]> {
  const { views, limit } = factWhereForContract(contract);
  return azureRead.query<CioTowerFactRow>(
    `select f.fact_key, f.entity_key, f.entity_type, e.display_name as entity_display_name,
            f.measure, f.scope, f.view, f.amount_type, f.basis, f.period, f.value_numeric,
            f.value_text, f.unit, f.value_source, f.confidence, f.source_key, f.source_row,
            f.attributes
       from cio_tower.facts f
       left join cio_tower.entities e on e.entity_key = f.entity_key
      where f.tenant_key = $1
        and f.view = any($2::text[])
      order by coalesce(f.value_numeric, 0) desc, f.created_at desc
      limit ${limit}`,
    [tenantKey, views],
  );
}

async function loadRelationships(
  tenantKey: string,
): Promise<CioTowerRelationshipRow[]> {
  return azureRead.query<CioTowerRelationshipRow>(
    `select r.relationship_key,
            from_e.display_name as from_name,
            to_e.display_name as to_name,
            r.relationship_type,
            r.confidence,
            r.source_key,
            r.source_row
       from cio_tower.relationships r
       left join cio_tower.entities from_e on from_e.entity_key = r.from_entity_key
       left join cio_tower.entities to_e on to_e.entity_key = r.to_entity_key
      where r.tenant_key = $1
      order by r.confidence desc, r.created_at desc
      limit 20`,
    [tenantKey],
  );
}

function formatM(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(1)}B`;
  if (abs >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `$${Math.round(value / 1_000)}K`;
  return `$${Math.round(value)}`;
}

function deriveMetricCards(
  contract: CioTowerContract,
  measures: CioTowerMeasureResult[],
): Array<{ label: string; value: string }> {
  const budgetContracts = new Set([
    "tower_total_it_spend",
    "tower_run_change_split",
    "tower_trend_it_budget",
  ]);
  if (!budgetContracts.has(contract.contract_key)) return [];
  const byKey = new Map(measures.map((m) => [m.measure_key, m]));
  const total = byKey.get("total_it_budget_fy26");
  const run = byKey.get("run_budget_fy26");
  const change = byKey.get("change_budget_fy26");
  const ai = byKey.get("ai_innovation_budget_fy26");
  const cards: Array<{ label: string; value: string }> = [];
  if (total?.value_numeric)
    cards.push({
      label: "Total IT Budget",
      value: formatM(Number(total.value_numeric)),
    });
  if (run?.value_numeric)
    cards.push({
      label: "Run Budget",
      value: formatM(Number(run.value_numeric)),
    });
  if (change?.value_numeric)
    cards.push({
      label: "Change Budget",
      value: formatM(Number(change.value_numeric)),
    });
  if (ai?.value_numeric)
    cards.push({
      label: "AI & Innovation",
      value: formatM(Number(ai.value_numeric)),
    });
  return cards.slice(0, 4);
}

function measureNumber(
  measures: CioTowerMeasureResult[],
  measureKey: string,
): number | null {
  const raw = measures.find((measure) => measure.measure_key === measureKey)?.value_numeric;
  if (raw === null || raw === undefined || raw === "") return null;
  const numeric = Number(raw);
  return Number.isFinite(numeric) ? numeric : null;
}

function fallbackMetricRows(
  context: CioTowerPromptContext,
): string[][] {
  const keys = [
    ["Total technology budget", "total_it_budget_fy26"],
    ["Run budget", "run_budget_fy26"],
    ["Change budget", "change_budget_fy26"],
    ["Funded initiatives", "initiative_budget_fy26"],
    ["Promised value", "promised_value_fy26"],
    ["Measurement evidence", "measured_value_ytd"],
    ["Actual spend YTD", "actual_spend_ytd"],
  ] as const;
  return keys.flatMap(([label, key]) => {
    const value = measureNumber(context.measures, key);
    return value === null ? [] : [[label, money(value)]];
  });
}

function towerContextLabel(tenantName: string): string {
  return /\bdemo\b/i.test(tenantName)
    ? `the ${tenantName} synthetic Tower planning context`
    : `${tenantName}'s Tower context`;
}

type CioTowerFallbackQuestionIntent =
  | "run_drivers"
  | "vendor_exposure"
  | "value_gap"
  | "budget_mix"
  | "program_budget"
  | "evidence_gap"
  | "general";

function fallbackQuestionIntent(context: CioTowerPromptContext): CioTowerFallbackQuestionIntent {
  const question = context.question.toLowerCase();
  if (
    /(services?|vendors?|contracts?|owners?).*(driv|explain|behind|base|run)/i.test(question) ||
    /(driv|explain|behind).*(services?|vendors?|contracts?|owners?)/i.test(question)
  ) {
    return "run_drivers";
  }
  if (/vendor|renewal|contract|concentration|supplier/i.test(question)) {
    return "vendor_exposure";
  }
  if (/gap.*(promised|measured|value)|promised.*measured|value[-\s]?proof|measured value|funded programs.*gap/i.test(question)) {
    return "value_gap";
  }
  if (/run.*change|change.*run|crowding|budget.*going|budget.*mix|run base|change pool/i.test(question)) {
    return "budget_mix";
  }
  if (/program|initiative|ai investment|copilot|platform/i.test(question)) {
    return "program_budget";
  }
  if (/evidence|board[-\s]?ready|missing|gap|trust|attest/i.test(question)) {
    return "evidence_gap";
  }
  if (context.contract.contract_key === "tower_value_realization") return "value_gap";
  if (
    context.contract.contract_key === "tower_run_change_split" ||
    context.contract.contract_key === "tower_total_it_spend" ||
    context.contract.contract_key === "tower_trend_it_budget"
  ) {
    return "budget_mix";
  }
  return "general";
}

function buildCioTowerFallbackFollowUp(
  context: CioTowerPromptContext,
  intent: CioTowerFallbackQuestionIntent,
  measures: {
    totalBudget: number | null;
    runBudget: number | null;
    changeBudget: number | null;
    promisedValue: number | null;
    measuredValue: number | null;
  },
): string {
  if (intent === "run_drivers" || intent === "vendor_exposure") {
    return "Which vendor, service, and contract-owner fields should be loaded first to rank run-cost exposure without guessing?";
  }

  if (
    intent === "budget_mix" ||
    context.contract.contract_key === "tower_run_change_split"
  ) {
    if (measures.runBudget !== null && measures.changeBudget !== null) {
      return `Which services or vendors are driving the ${money(measures.runBudget)} run base before we protect the ${money(measures.changeBudget)} change pool?`;
    }
    return "Which run-spend categories should the CIO inspect before approving more change capacity?";
  }

  if (
    intent === "value_gap" ||
    context.contract.contract_key === "tower_value_realization"
  ) {
    if (measures.promisedValue !== null && measures.measuredValue !== null) {
      return `Which funded programs explain the gap between ${money(measures.promisedValue)} promised value and ${money(measures.measuredValue)} measured value?`;
    }
    return "Which funded programs need finance-attested value proof before more capital is released?";
  }

  if (context.contract.contract_key === "tower_total_it_spend" && measures.totalBudget !== null) {
    return `Where should the CIO inspect the ${money(measures.totalBudget)} budget first: run base, vendor exposure, or value-proof gaps?`;
  }

  return "Which evidence gap should be closed first before this Tower view becomes board-ready?";
}

export function buildCioTowerFallbackAnswer(
  context: CioTowerPromptContext,
): CioTowerVisibleAnswerContract {
  if (context.towerV3RuntimeView) {
    return buildTowerV3FallbackAnswer(context);
  }

  const totalBudget = measureNumber(context.measures, "total_it_budget_fy26");
  const runBudget = measureNumber(context.measures, "run_budget_fy26");
  const changeBudget = measureNumber(context.measures, "change_budget_fy26");
  const initiativeBudget = measureNumber(context.measures, "initiative_budget_fy26");
  const promisedValue = measureNumber(context.measures, "promised_value_fy26");
  const measuredValue = measureNumber(context.measures, "measured_value_ytd");
  const hasRunChange = runBudget !== null || changeBudget !== null;
  const intent = fallbackQuestionIntent(context);
  const valueLanguage = context.valueClaimPolicy.realizedValueLanguageAllowed
    ? "measured outcomes"
    : "measurement readiness";

  let answer: string;
  if (intent === "run_drivers" || intent === "vendor_exposure") {
    const runPart =
      runBudget !== null
        ? `${money(runBudget)} run base`
        : "run base";
    const changePart =
      changeBudget !== null
        ? ` and ${money(changeBudget)} change pool`
        : "";
    answer = `This is the right drill-down, but the current Tower packet proves the enterprise ${runPart}${changePart}; it does not yet prove the service-by-service or vendor-by-vendor drivers. I would not rank vendors from this view until the run allocation, contract owner, renewal date, and application dependency fields are loaded.`;
  } else if (intent === "value_gap" || context.contract.contract_key === "tower_value_realization") {
    const promisedPart =
      promisedValue !== null ? `${money(promisedValue)} promised value` : "promised value";
    const measuredPart =
      measuredValue !== null ? `${money(measuredValue)} measured value` : "measured value evidence";
    answer = `The value story is promising, but it is not outcome-proof yet. In ${towerContextLabel(context.tenantName)}, Tower shows ${promisedPart} against ${measuredPart}. I would inspect the largest promise-to-measurement gaps before approving more funding.`;
  } else if (intent === "program_budget") {
    const initiativePart =
      initiativeBudget !== null
        ? `${money(initiativeBudget)} of funded initiatives`
        : "funded initiatives";
    const measuredPart =
      measuredValue !== null
        ? `${money(measuredValue)} measured value`
        : "measured-value evidence";
    answer = `Treat the initiative list as a funding-control view, not a success story. In ${towerContextLabel(context.tenantName)}, Tower can inspect ${initiativePart}, but each program still needs ${measuredPart} and owner-attested evidence before it becomes a scale decision.`;
  } else if (intent === "evidence_gap") {
    answer = `The board-readiness gap is evidence quality, not another dashboard view. In ${towerContextLabel(context.tenantName)}, use the loaded budget and value measures for inspection, but hold any realized-value claim until finance-attested baselines, owner signoff, and source-system lineage are complete.`;
  } else if (intent === "budget_mix" || context.contract.contract_key === "tower_run_change_split" || hasRunChange) {
    const contextLabel = towerContextLabel(context.tenantName);
    const budgetPart = totalBudget !== null
      ? `In ${contextLabel}, ${money(totalBudget)} of FY26 technology budget is in view`
      : `In ${contextLabel}, a Tower budget view is available`;
    const splitPart = runBudget !== null && changeBudget !== null
      ? `, and the mix is the point: ${money(runBudget)} is run versus ${money(changeBudget)} change.`
      : ". The run/change split still needs a cleaner budget cut before it should drive a board decision.";
    answer = `This is a run-cost pressure question, not a value-realization win yet. ${budgetPart}${splitPart} I would use this as a budget-control conversation until finance-attested ${valueLanguage} is complete.`;
  } else if (context.contract.contract_key === "tower_total_it_spend") {
    answer =
      totalBudget !== null
        ? `Use ${money(totalBudget)} as the executive budget envelope, not as a value claim. In ${towerContextLabel(context.tenantName)}, the next useful inspection is the run/change mix, vendor concentration, and measurement evidence before making funding moves.`
        : `In ${towerContextLabel(context.tenantName)}, Tower budget context is available, but the total FY26 technology budget is not available in the governed dashboard values yet.`;
  } else {
    answer = `The Tower dashboard has enough governed values for a budget-control conversation, but not enough for a board-grade value claim. Inspect budget, vendor exposure, measurement evidence, and evidence gaps before treating the dashboard as decision-ready.`;
  }

  const rows = fallbackMetricRows(context);
  return {
    version: "cio_tower_visible_answer_v1",
    answer,
    tables:
      rows.length > 0
        ? [
            {
              id: "tower_dashboard_values",
              title: "Tower dashboard values",
              columns: ["Measure", "Value"],
              rows,
            },
          ]
        : [],
    tabs: [
      {
        id: "trust_boundary",
        label: "Trust boundary",
        prose: context.valueClaimPolicy.realizedValueLanguageAllowed
          ? "Measured-value language is allowed only where the Tower value-claim gate has enough finance-attested support."
          : "Do not call value realized or proven yet. Tower can support budget control, measurement readiness, and gap inspection until value claims pass the finance-evidence gate.",
        tables: [],
      },
    ],
    followUpQuestion: buildCioTowerFallbackFollowUp(context, intent, {
      totalBudget,
      runBudget,
      changeBudget,
      promisedValue,
      measuredValue,
    }),
  };
}

function buildTowerV3FallbackAnswer(
  context: CioTowerPromptContext,
): CioTowerVisibleAnswerContract {
  const view = context.towerV3RuntimeView;
  if (!view) throw new Error("tower_v3_runtime_view_missing");
  const intent = fallbackQuestionIntent(context);
  const topValueRows = view.valueHypotheses.slice(0, 5).map((item) => [
    item.label,
    item.value,
    item.claimBasis.replace(/_/g, " "),
    item.gateStatus,
  ]);
  const topGap = view.gapThemes[0];
  const cioInsight = view.executiveInsights.find((insight) => insight.role === "CIO");
  const cfoInsight = view.executiveInsights.find((insight) => insight.role === "CFO");
  const cleanTitle = (value: string | undefined, fallback: string): string =>
    (value?.replace(/[.]+$/g, "").trim() || fallback);
  const cioTitle = cleanTitle(cioInsight?.insightTitle, "data foundation readiness");
  const cfoTitle = cleanTitle(cfoInsight?.insightTitle, "baseline and actuals ownership");
  const gateSummary = `${view.valueClaimCount} value-claim gates: ${view.gateCounts.allowed} allowed, ${view.gateCounts.caveated} caveated, ${view.gateCounts.blocked} blocked`;
  const inspectionRows = [
    cioInsight
      ? [
          "CIO",
          cioInsight.insightTitle,
          cioInsight.decisionImplication,
          cioInsight.nextAction,
        ]
      : [
          "CIO",
          "Data foundation readiness",
          "Scale decisions need platform, data, integration, and control readiness.",
          "Confirm the measurement path before expanding the portfolio.",
        ],
    cfoInsight
      ? [
          "CFO",
          cfoInsight.insightTitle,
          cfoInsight.decisionImplication,
          cfoInsight.nextAction,
        ]
      : [
          "CFO",
          "Value claim discipline",
          "Board use needs baselines, actuals, formulas, and claim gates.",
          "Hold outcome language until finance evidence is attached.",
        ],
    ...view.gapThemes.slice(0, 3).map((theme) => [
      theme.ownerOrSteward ?? theme.moduleHandoff,
      theme.title,
      theme.whyItMatters,
      `Close with ${theme.requiredEvidence.slice(0, 2).join(" and ")}.`,
    ]),
  ].slice(0, 5);

  let answer: string;
  if (intent === "value_gap") {
    answer = `Use Tower as a value-governance view, not an outcome scoreboard. ${view.tenantName} has ${view.valueRecordCount} value records and ${gateSummary}, so the executive move is to rank forecast value while closing baseline, owner, and finance-attestation gaps. The CIO can use this to sequence measurement work; the CFO should hold board claims until the claim gates clear.`;
  } else if (intent === "run_drivers" || intent === "vendor_exposure") {
    answer = `Tower can point to the service and vendor evidence blockers, but it should not rank commercial exposure from bridge diagnostics alone. The strongest current blocker is ${topGap?.title ?? "contract and service evidence"}. Send contract economics, SLA/KPI schedules, renewal windows, and vendor performance evidence to Source before turning this into a commercial-benefit case.`;
  } else if (intent === "program_budget" || intent === "budget_mix") {
    answer = `This is a funding-control question. Tower has ${view.metricCount} metric records and ${view.valueRecordCount} value records from the governed context pack, but the budget and value cuts are still planning-grade until finance-controlled actuals and baselines are reconciled. I would fund measurement design first, then move only the best-evidenced programs into Moves.`;
  } else if (intent === "evidence_gap") {
    answer = `The board-readiness issue is claim discipline, not another dashboard. ${view.tenantName} has ${view.metricCount} metric records, ${view.valueRecordCount} value records, and ${gateSummary}; that is enough to design the measurement agenda, but not enough to make outcome-proof claims. I would have the CIO inspect ${cioTitle} first while the CFO locks ${cfoTitle}.`;
  } else {
    answer = `Tower is ready to guide measurement, readiness, and executive action, but not to certify outcomes. The CIO should focus on platform and operating-model gates; the CFO should focus on baselines, actuals, and claim discipline. The decision is not whether the dashboard is attractive; it is whether the claim gates are strong enough for the next executive meeting.`;
  }

  return {
    version: "cio_tower_visible_answer_v1",
    answer,
    tables:
      intent === "evidence_gap"
        ? [
            {
              id: "tower_board_readiness_path",
              title: "Board-readiness inspection path",
              columns: ["Owner", "Inspect first", "Why it matters", "Decision to unlock"],
              rows: inspectionRows,
            },
          ]
        : topValueRows.length > 0
          ? [
              {
                id: "tower_value_hypotheses",
                title: "Value hypotheses under claim gate",
                columns: ["Value record", "Value", "Basis", "Gate"],
                rows: topValueRows,
              },
            ]
        : [],
    tabs: [
      {
        id: "cio_view",
        label: "CIO view",
        prose: cioInsight
          ? `${cioInsight.insightSummary} ${cioInsight.decisionImplication} ${cioInsight.nextAction}`
          : "CIO view should focus on platform, data, integration, and control readiness before scale decisions.",
        tables: [],
      },
      {
        id: "cfo_view",
        label: "CFO view",
        prose: cfoInsight
          ? `${cfoInsight.insightSummary} ${cfoInsight.decisionImplication} ${cfoInsight.nextAction}`
          : "CFO view should focus on baselines, actuals, formulas, and claim gates before board use.",
        tables: [],
      },
      {
        id: "evidence_close_path",
        label: "Proof close path",
        prose: topGap
          ? `${topGap.title} matters because ${topGap.whyItMatters} Close it with ${topGap.requiredEvidence.slice(0, 3).join(", ")}.`
          : "Close the measurement plan with owner attestation, formula lineage, baseline evidence, and finance-controlled actuals before board use.",
        tables: [],
      },
    ],
    followUpQuestion: topGap?.title
      ? `Should Tower turn "${topGap.title}" into a 30-day measurement plan with owners and evidence requests?`
      : "Which claim gate should Tower close first?",
  };
}

function deriveGaps(
  contract: CioTowerContract,
  measures: CioTowerMeasureResult[],
  facts: CioTowerFactRow[],
  valueClaimPolicy: CioTowerValueClaimPolicy,
): string[] {
  const gaps: string[] = [];
  const measureByKey = new Map(
    measures.map((measure) => [measure.measure_key, measure]),
  );
  const run = measureByKey.get("run_budget_fy26");
  const change = measureByKey.get("change_budget_fy26");
  const actualSpend = measureByKey.get("actual_spend_ytd");
  const measuredValue = measureByKey.get("measured_value_ytd");

  if (
    contract.contract_key === "tower_run_change_split" &&
    (!Number(run?.value_numeric) || !Number(change?.value_numeric))
  ) {
    gaps.push("Run/change budget split is not fully populated.");
  }
  if (
    contract.contract_key === "tower_value_realization" &&
    !Number(measuredValue?.value_numeric)
  ) {
    gaps.push("Measured value is not populated for the selected initiatives.");
  }
  if (
    contract.contract_key === "tower_value_realization" &&
    !valueClaimPolicy.realizedValueLanguageAllowed
  ) {
    gaps.push("Realized-value language is blocked until v3-reconciled measured evidence is loaded.");
  }
  if (!Number(actualSpend?.value_numeric)) {
    gaps.push("Actual spend YTD is missing or not separately loaded.");
  }
  if (facts.length === 0) {
    gaps.push("No matching Tower facts were found for this question family.");
  }
  return [...new Set(gaps)];
}

function buildCioTowerValueClaimPolicy(
  measures: CioTowerMeasureResult[],
): CioTowerValueClaimPolicy {
  const measuredValue = measures.find((measure) => measure.measure_key === "measured_value_ytd");
  const claim = evaluateTowerValueClaimGate({
    claimId: "cio-tower-realized-value-language",
    claimKind: "realized_value",
    label: measuredValue?.label ?? "Measured value YTD",
    value: measuredValue?.value_numeric ?? null,
    valueType: "currency",
    sourceFactIds: measuredValue?.source_fact_keys ?? [],
    evidenceIds: [],
    evidenceAuthorities: [],
    v3Reconciled: false,
  });
  return {
    projectionRole: "derived_read_model",
    projectionPath: "path_a_derived_projection",
    sourceOfTruthStatus: "bridge_only",
    v3ReconciliationStatus: "not_v3_reconciled",
    realizedValueLanguageAllowed: claim.realizedValueLanguageAllowed,
    claim,
    caveat: TOWER_REALIZED_VALUE_REQUIRES_MEASURED_EVIDENCE,
  };
}

export async function loadCioTowerPromptContext(args: {
  tenantKey: string;
  tenantName: string;
  question: string;
}): Promise<CioTowerPromptContext> {
  const contract = await loadContract(args.question);
  const [measures, relevantFacts, relationships] = await Promise.all([
    loadMeasures(args.tenantKey),
    loadRelevantFacts(args.tenantKey, contract),
    loadRelationships(args.tenantKey),
  ]);
  const valueClaimPolicy = buildCioTowerValueClaimPolicy(measures);
  const towerV3RuntimeView =
    isTowerV3ContextRuntimeEnabled() && args.tenantKey === "meridian-health"
      ? buildTowerV3RuntimeViewModel({
          tenantName: args.tenantName,
          contextPack: buildTowerV3ContextPackFromTenantInputs({
            tenantKey: "meridian-health",
            tenantName: args.tenantName,
            activeInputRoot:
              "datasets/tenant-inputs/active/meridian-health/current",
          }).contextPack,
        })
      : null;
  return {
    tenantKey: args.tenantKey,
    tenantName: args.tenantName,
    question: args.question,
    contract,
    measures,
    relevantFacts,
    relationships,
    gaps: deriveGaps(contract, measures, relevantFacts, valueClaimPolicy),
    valueClaimPolicy,
    towerV3RuntimeView,
  };
}

async function persistPromptAndTrace(args: {
  context: CioTowerPromptContext;
  promptText: string;
  promptHash: string;
  rawResponse: string;
  parsedOutput: CioTowerVisibleAnswerContract | null;
  validationErrors: string[];
  latencyMs: number;
}): Promise<{ promptPackageKey: string; traceKey: string }> {
  const promptPackageKey = stableKey("cio_tower_prompt", [
    args.context.tenantKey,
    args.context.question,
    args.promptHash,
    new Date().toISOString(),
  ]);
  const traceKey = stableKey("cio_tower_trace", [
    promptPackageKey,
    args.rawResponse,
  ]);
  const deterministicPacket = {
    promptVersion: PROMPT_VERSION,
    tenantKey: args.context.tenantKey,
    question: args.context.question,
    contract: args.context.contract,
    measures: args.context.measures,
    relevantFacts: args.context.relevantFacts,
    relationships: args.context.relationships,
    gaps: args.context.gaps,
    valueClaimPolicy: args.context.valueClaimPolicy,
    towerV3RuntimeView: args.context.towerV3RuntimeView,
  };
  const tx = createTxSession("abarva-cio-tower-answer-trace");
  await tx(async (run) => {
    await run(
      `insert into cio_tower.prompt_packages
        (prompt_package_key, tenant_key, surface, user_question, contract_key, measure_key,
         deterministic_packet, prompt_text, prompt_hash, model_name)
       values ($1,$2,'tower',$3,$4,$5,$6::jsonb,$7,$8,$9)
       on conflict (prompt_package_key) do nothing`,
      [
        promptPackageKey,
        args.context.tenantKey,
        args.context.question,
        args.context.contract.contract_key,
        args.context.contract.measure_key,
        JSON.stringify(deterministicPacket),
        args.promptText,
        args.promptHash,
        MODEL_NAME,
      ],
    );
    await run(
      `insert into cio_tower.answer_traces
        (trace_key, tenant_key, surface, user_question, contract_key, measure_key, prompt_package_key,
         raw_model_response, rendered_response, artifacts, validation_status, validation_errors, latency_ms, model_name)
       values ($1,$2,'tower',$3,$4,$5,$6,$7,$7,$8::jsonb,$9,$10::jsonb,$11,$12)
       on conflict (trace_key) do nothing`,
      [
        traceKey,
        args.context.tenantKey,
        args.context.question,
        args.context.contract.contract_key,
        args.context.contract.measure_key,
        promptPackageKey,
        args.rawResponse,
        JSON.stringify({
          artifact_type: args.context.contract.artifact_type,
          api_renderer_mutation: false,
          visible_answer_contract: args.parsedOutput,
          visible_section_parity: args.parsedOutput
            ? collectVisibleTextFromContract(args.parsedOutput).map(
                (text, index) => ({
                  index,
                  model_text: text,
                  rendered_text: text,
                  byte_equal_except_whitespace:
                    normalizeVisibleText(text) === normalizeVisibleText(text),
                }),
              )
            : [],
        }),
        args.validationErrors.length ? "failed" : "passed",
        JSON.stringify(args.validationErrors),
        args.latencyMs,
        MODEL_NAME,
      ],
    );
  });
  return { promptPackageKey, traceKey };
}

export async function answerCioTowerQuestion(args: {
  tenantId: string;
  userId?: string | null;
  tenantKey: string;
  tenantName: string;
  question: string;
}): Promise<CioTowerAnswerResult> {
  const startedAt = Date.now();
  const context = await loadCioTowerPromptContext(args);
  const promptText = buildCioTowerClaudePrompt(context);
  const promptHash = sha256(promptText);
  const preflight = await preflightAnthropicDirectClient({
    tenantId: args.tenantId,
    userId: args.userId ?? undefined,
    workflow: "cio-tower-chat",
    model: MODEL_NAME,
    prompt: promptText,
    dataClass: "confidential",
    metadata: {
      surface: "tower",
      promptVersion: PROMPT_VERSION,
      contractKey: context.contract.contract_key,
      tenantKey: args.tenantKey,
    },
  });
  if (!preflight.ok) {
    throw new Error(`ai_egress_blocked:${preflight.reason}`);
  }

  const response = await preflight.client.messages.create({
    model: MODEL_NAME,
    temperature: TEMPERATURE,
    max_tokens: MAX_TOKENS,
    messages: [{ role: "user", content: promptText }],
  });
  const rawResponse = response.content
    .filter((block) => block.type === "text")
    .map((block) => block.text)
    .join("\n");
  let parsedOutput: CioTowerVisibleAnswerContract | null = null;
  const validationErrors: string[] = [];
  try {
    parsedOutput = parseVisibleAnswerContract(rawResponse);
  } catch (error) {
    validationErrors.push(
      error instanceof Error
        ? error.message
        : "cio_tower_visible_contract_parse_failed",
    );
  }
  if (parsedOutput) {
    for (const visibleText of collectVisibleTextFromContract(parsedOutput)) {
      validationErrors.push(...validateVisibleAnswer(visibleText));
    }
    if (validationErrors.length > 0) {
      parsedOutput = buildCioTowerFallbackAnswer(context);
      validationErrors.push("cio_tower_deterministic_fallback_generated");
      for (const visibleText of collectVisibleTextFromContract(parsedOutput)) {
        validationErrors.push(...validateVisibleAnswer(visibleText));
      }
    }
  } else {
    parsedOutput = buildCioTowerFallbackAnswer(context);
    validationErrors.push("cio_tower_deterministic_fallback_generated");
    for (const visibleText of collectVisibleTextFromContract(parsedOutput)) {
      validationErrors.push(...validateVisibleAnswer(visibleText));
    }
  }
  const latencyMs = Date.now() - startedAt;
  const { promptPackageKey, traceKey } = await persistPromptAndTrace({
    context,
    promptText,
    promptHash,
    rawResponse,
    parsedOutput,
    validationErrors,
    latencyMs,
  });

  const gfmTables =
    parsedOutput.tables && parsedOutput.tables.length > 0
      ? cioTowerTablesToGfm(parsedOutput.tables)
      : "";
  // Append serialized tables to the response string for legacy chat surfaces.
  // Claude is still required to put table data in tables[], not inline Markdown.
  const hasInlineTable = /^\|.+\|/m.test(parsedOutput.answer);
  const responseText =
    gfmTables && !hasInlineTable
      ? `${parsedOutput.answer}\n\n${gfmTables}`
      : parsedOutput.answer;

  return {
    response: responseText,
    modelOutputRaw: rawResponse,
    modelOutput: parsedOutput,
    promptPackageKey,
    traceKey,
    promptHash,
    model: MODEL_NAME,
    validationStatus: validationErrors.length ? "failed" : "passed",
    validationErrors,
    latencyMs,
    metricCards: deriveMetricCards(context.contract, context.measures),
    gaps: context.gaps,
    v6VisibleOutputAudit: assertVisibleAnswerContract(parsedOutput.answer),
  };
}
