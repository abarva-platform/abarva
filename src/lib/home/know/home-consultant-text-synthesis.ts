import { getAuditedAnthropicClient } from "@/lib/agent/stream";
import {
  ALL_CLIENTS,
  CLIENT_KEY_TO_DB_NAME,
  CLIENT_KEY_TO_INDUSTRY_CODE,
  canonicalClientDisplayName,
} from "@/lib/client-config";
import { hasUsableDossierEvidence } from "@/lib/home/know/has-usable-dossier-evidence";
import type { HomeKnowResponse } from "@/lib/home/know/home-know-contract";
import type {
  DossierDimensionFamily,
  UniversalDimensionDossier,
} from "@/lib/semantic-dossiers";
import type { DossierSection } from "@/lib/semantic-dossiers/types";

const DEFAULT_MODEL = "claude-opus-4-8";
const DEFAULT_TIMEOUT_MS = 60_000;
const DEFAULT_MAX_TOKENS = 25_000;
const PROMPT_VERSION = "home_consultant_text_synthesis_v1";

export const HOME_CONSULTANT_TEXT_SYSTEM_PROMPT = `You are AbarVa's Home / Explorer consultant.

Home answers: "What do we know about this enterprise from the loaded tenant evidence?"

You are not a generic chatbot. You are not browsing. You are not retrieving. You are not inventing.

You will receive a structured enterprise dossier. Use only that dossier.

The dossier may include:

* sections
* source coverage
* facts
* tables
* charts
* graphs
* rollups
* relationship paths
* metrics
* gaps
* citations
* answer boundaries

Use all relevant evidence channels. Do not rely only on the facts array.

Write like a senior enterprise architect / consulting partner briefing a CIO.

Lead with what the loaded context can say.
Then explain what it means.
Then identify the specific missing evidence.
Then state the safe answer boundary.
If the user asks for a recommendation, investment decision, scale/hold/stop decision, sourcing decision, or strategy memo, Home should show the evidence and hand off to Intelligence, Source, Moves, or Tower.

Do not make unsupported recommendations in Home.

Never say the topic cannot be characterized if the dossier contains partial evidence.
Instead say what level of characterization is supported:

* enterprise level
* function level
* role level
* portfolio level
* domain level
* application/system level
* named-person level, only if names are loaded

Do not lead with counts.
Do not say "I found."
Do not expose raw IDs, table names, route names, debug labels, source internals, or implementation details.
Do not use labels like "Read," "Evidence," "Evidence points," or "Current-state read."
Do not mention pattern family or experts in Home.

Return only the final user-facing answer text.`;

const FORBIDDEN_RE =
  /\b(cannot be characterized|cannot be identified|I found|missing source support|Current-state read|Evidence points|home_know|semantic packet|\bpacket\b|debug|\/Users\/|localhost)\b|^\s*(Read|Evidence):/i;
const RAW_ID_RE =
  /\b[A-Z]{2,16}-[A-Z0-9]{2,24}-\d{2,8}\b|\b[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\b/i;
const RECOMMENDATION_RE =
  /\b(we recommend|i recommend|you should|should invest|should prioritize|best option is|first automate|scale this|kill this|place the next \$?\d)/i;

export interface HomeConsultantTextPromptPacket {
  question: string;
  tenant: {
    tenantKey: string;
    tenantName: string;
    industry: string;
    evidenceStrength: "strong" | "partial" | "thin";
  };
  mode: "home_know";
  outputMode: "text";
  promptVersion: string;
  primaryDimension: DossierDimensionFamily;
  relatedDimensions: DossierDimensionFamily[];
  dimensionSummary: string;
  dimensionStyle: string[];
  sectionsSummary: string;
  rollupsSummary: string;
  tablesSummary: string;
  chartsSummary: string;
  graphsAndRelationshipsSummary: string;
  metricsSummary: string;
  gapsSummary: string;
  sourceCoverageSummary: string;
  citationsSummary: string;
  answerBoundarySummary: string;
  evidenceChannels: ReturnType<typeof hasUsableDossierEvidence>["evidenceChannels"];
}

export interface HomeConsultantTextSynthesisResult {
  text: string;
  prompt: string;
  promptPacket: HomeConsultantTextPromptPacket;
  trace: {
    attempted: true;
    used: true;
    outputMode: "text";
    promptVersion: string;
    model: string;
    maxTokens: number;
    timeoutMs: number;
    auditId: string;
    rawTextPreview: string;
    validationIssues: string[];
  };
}

export interface HomeConsultantTextSynthesisFailure {
  attempted: true;
  used: false;
  outputMode: "text";
  promptVersion: string;
  model?: string;
  maxTokens?: number;
  timeoutMs?: number;
  auditId?: string;
  rawTextPreview?: string;
  reason: string;
  validationIssues: string[];
}

export function isHomeConsultantClaudeSynthesisEnabled(): boolean {
  const raw = process.env.HOME_KNOW_CLAUDE_SYNTHESIS_ENABLED?.trim().toLowerCase();
  if (raw === "false" || raw === "0" || raw === "off") return false;
  if (raw === "true" || raw === "1" || raw === "on") return true;
  return process.env.NODE_ENV === "production";
}

export function homeConsultantOutputMode(): "text" {
  return "text";
}

export async function synthesizeHomeConsultantText(args: {
  dossier: UniversalDimensionDossier;
  deterministicResponse: HomeKnowResponse;
}): Promise<HomeConsultantTextSynthesisResult | HomeConsultantTextSynthesisFailure | null> {
  if (!isHomeConsultantClaudeSynthesisEnabled()) {
    return {
      attempted: true,
      used: false,
      outputMode: "text",
      promptVersion: PROMPT_VERSION,
      reason: "env_disabled",
      validationIssues: [],
    };
  }
  if (args.deterministicResponse.intent === "decision_handoff") return null;
  const evidence = hasUsableDossierEvidence({
    ...args.dossier,
    tables: args.deterministicResponse.tables,
    charts: args.deterministicResponse.charts,
    graphs: args.deterministicResponse.graphs,
    citations: args.deterministicResponse.citations,
    gaps: args.deterministicResponse.gaps,
  });
  if (!evidence.usable) {
    return {
      attempted: true,
      used: false,
      outputMode: "text",
      promptVersion: PROMPT_VERSION,
      reason: "no_usable_dossier_evidence",
      validationIssues: [],
    };
  }

  const model = process.env.HOME_KNOW_CLAUDE_MODEL?.trim() || DEFAULT_MODEL;
  const maxTokens = numberFromEnv("HOME_KNOW_CLAUDE_MAX_TOKENS", DEFAULT_MAX_TOKENS);
  const timeoutMs = numberFromEnv("HOME_KNOW_CLAUDE_TIMEOUT_MS", DEFAULT_TIMEOUT_MS);
  const promptPacket = buildHomeConsultantTextPromptPacket({
    dossier: args.dossier,
    response: args.deterministicResponse,
  });
  const user = renderHomeConsultantTextUserPrompt(promptPacket);
  const prompt = [HOME_CONSULTANT_TEXT_SYSTEM_PROMPT, user].join("\n\n");

  try {
    const { client, auditId } = await getAuditedAnthropicClient({
      tenantId: args.dossier.tenantKey,
      workflow: "home-consultant-text-synthesis",
      model,
      dataClass: "confidential",
      prompt,
      metadata: {
        outputMode: "text",
        promptVersion: PROMPT_VERSION,
        primaryDimension: args.dossier.route.primaryDimension,
        relatedDimensions: args.dossier.route.relatedDimensions,
        evidenceChannels: evidence.evidenceChannels,
        streaming: true,
      },
    });
    const stream = client.messages.stream({
      model,
      max_tokens: maxTokens,
      system: HOME_CONSULTANT_TEXT_SYSTEM_PROMPT,
      messages: [{ role: "user", content: user }],
    });
    const message = await withTimeout(
      stream.finalMessage(),
      timeoutMs,
    );
    const text = message.content
      .filter((item) => item.type === "text")
      .map((item) => item.text)
      .join("\n")
      .trim();
    const validationIssues = validateHomeConsultantText({
      text,
      dossier: args.dossier,
      response: args.deterministicResponse,
    });
    if (validationIssues.length > 0) {
      console.warn(
        "[home-consultant-text-synthesis] fallback: validation_failed",
        JSON.stringify({
          tenantKey: args.dossier.tenantKey,
          primaryDimension: args.dossier.route.primaryDimension,
          model,
          auditId,
          validationIssues,
          rawTextPreview: redactTextPreview(text),
        }),
      );
      return {
        attempted: true,
        used: false,
        outputMode: "text",
        promptVersion: PROMPT_VERSION,
        model,
        maxTokens,
        timeoutMs,
        auditId,
        rawTextPreview: redactTextPreview(text),
        reason: "validation_failed",
        validationIssues,
      };
    }
    return {
      text,
      prompt,
      promptPacket,
      trace: {
        attempted: true,
        used: true,
        outputMode: "text",
        promptVersion: PROMPT_VERSION,
        model,
        maxTokens,
        timeoutMs,
        auditId,
        rawTextPreview: redactTextPreview(text),
        validationIssues,
      },
    };
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    console.warn(
      "[home-consultant-text-synthesis] fallback: exception",
      JSON.stringify({
        tenantKey: args.dossier.tenantKey,
        primaryDimension: args.dossier.route.primaryDimension,
        model,
        reason,
      }),
    );
    return {
      attempted: true,
      used: false,
      outputMode: "text",
      promptVersion: PROMPT_VERSION,
      model,
      maxTokens,
      timeoutMs,
      reason,
      validationIssues: [],
    };
  }
}

export function isHomeConsultantTextSynthesisResult(
  value: HomeConsultantTextSynthesisResult | HomeConsultantTextSynthesisFailure | null,
): value is HomeConsultantTextSynthesisResult {
  return Boolean(value && "trace" in value && value.trace.used);
}

export function applyHomeConsultantTextSynthesisFailureTrace(
  response: HomeKnowResponse,
  failure: HomeConsultantTextSynthesisFailure,
): HomeKnowResponse {
  return {
    ...response,
    safety: {
      ...response.safety,
      composerTrace: response.safety.composerTrace
        ? {
            ...response.safety.composerTrace,
            composer: "deterministic_fallback",
            goldenComposerAttempted: true,
            goldenComposerUsed: true,
            fallbackUsed: true,
            reason: `${response.safety.composerTrace.reason}; Claude text synthesis fallback=${failure.reason}; outputMode=text; promptVersion=${failure.promptVersion}${
              failure.validationIssues.length
                ? `; validationIssues=${failure.validationIssues.join("|")}`
                : ""
            }${failure.model ? `; model=${failure.model}` : ""}${
              failure.maxTokens ? `; maxTokens=${failure.maxTokens}` : ""
            }${failure.timeoutMs ? `; timeoutMs=${failure.timeoutMs}` : ""}${
              failure.auditId ? `; auditId=${failure.auditId}` : ""
            }${failure.rawTextPreview ? `; rawTextPreview=${failure.rawTextPreview}` : ""}`,
          }
        : response.safety.composerTrace,
    },
  };
}

export function applyHomeConsultantTextSynthesis(
  response: HomeKnowResponse,
  result: HomeConsultantTextSynthesisResult,
): HomeKnowResponse {
  return {
    ...response,
    prose: result.text,
    safety: {
      ...response.safety,
      unsupportedClaimsRemoved: response.safety.unsupportedClaimsRemoved,
      composerTrace: response.safety.composerTrace
        ? {
            ...response.safety.composerTrace,
            composer: "claude_text_synthesis",
            goldenComposerAttempted: true,
            goldenComposerUsed: true,
            fallbackUsed: false,
            reason: `Claude text synthesis selected; outputMode=text; promptVersion=${result.trace.promptVersion}; model=${result.trace.model}; maxTokens=${result.trace.maxTokens}; timeoutMs=${result.trace.timeoutMs}; auditId=${result.trace.auditId}; rawTextPreview=${result.trace.rawTextPreview}`,
          }
        : response.safety.composerTrace,
    },
  };
}

export function validateHomeConsultantText(args: {
  text: string;
  dossier: UniversalDimensionDossier;
  response: HomeKnowResponse;
}): string[] {
  const issues: string[] = [];
  const text = args.text.trim();
  if (!text) issues.push("empty_text");
  if (FORBIDDEN_RE.test(text)) issues.push("forbidden_language");
  if (RAW_ID_RE.test(text)) issues.push("raw_id");
  if (!args.dossier.answerBoundary.handoffTarget && RECOMMENDATION_RE.test(text)) {
    issues.push("home_recommendation_without_handoff");
  }
  if (startsWithCountOrEvidenceLabel(text)) issues.push("starts_with_count_or_evidence_label");
  const tenantLeak = detectCrossTenantLeak(text, args.dossier.tenantKey);
  if (tenantLeak) issues.push(`cross_tenant_content:${tenantLeak}`);
  if (mentionsMissingCharacterization(text) && hasUsableDossierEvidence(args.dossier).usable) {
    issues.push("false_absence_despite_partial_evidence");
  }
  return [...new Set(issues)];
}

export function buildHomeConsultantTextPromptPacket(args: {
  dossier: UniversalDimensionDossier;
  response: HomeKnowResponse;
}): HomeConsultantTextPromptPacket {
  const evidence = hasUsableDossierEvidence({
    ...args.dossier,
    tables: args.response.tables,
    charts: args.response.charts,
    graphs: args.response.graphs,
    citations: args.response.citations,
    gaps: args.response.gaps,
  });
  return {
    question: args.dossier.route.question,
    tenant: {
      tenantKey: args.dossier.tenantKey,
      tenantName:
        canonicalClientDisplayName({ key: args.dossier.tenantKey }) ??
        args.dossier.tenantKey,
      industry:
        CLIENT_KEY_TO_INDUSTRY_CODE[
          args.dossier.tenantKey as keyof typeof CLIENT_KEY_TO_INDUSTRY_CODE
        ] ?? "UNKNOWN",
      evidenceStrength: evidenceStrength(evidence.evidenceChannels),
    },
    mode: "home_know",
    outputMode: "text",
    promptVersion: PROMPT_VERSION,
    primaryDimension: args.dossier.route.primaryDimension,
    relatedDimensions: args.dossier.route.relatedDimensions,
    dimensionSummary: args.dossier.dimensionSummary,
    dimensionStyle: dimensionStyle(args.dossier.route.primaryDimension),
    sectionsSummary: summarizeSections(args.dossier.sections),
    rollupsSummary: summarizeRecord(args.dossier.rollups),
    tablesSummary: args.response.tables
      .map((table) => `${table.title}: ${table.rows.length} rows; columns ${table.columns.map((column) => column.label).join(", ")}`)
      .join("\n"),
    chartsSummary: args.response.charts
      .map((chart) => `${chart.title}: ${chart.data.length} points; ${chart.data.slice(0, 8).map((point) => `${point.label}=${point.value}`).join(", ")}`)
      .join("\n"),
    graphsAndRelationshipsSummary: summarizeGraphsAndRelationships(args.dossier, args.response),
    metricsSummary: args.dossier.metrics
      .slice(0, 16)
      .map((metric) => `${metric.label}: ${String(metric.value)}${metric.caveat ? ` (${metric.caveat})` : ""}`)
      .join("\n"),
    gapsSummary: args.dossier.gaps
      .slice(0, 12)
      .map((gap) => `${gap.label}: ${gap.impact}; needed evidence: ${gap.neededEvidence.join(", ")}`)
      .join("\n"),
    sourceCoverageSummary: args.dossier.sourceCoverage
      .map((source) => `${source.sourceKey}: ${source.loaded ? source.count : 0} records; ${source.purpose}; ${source.binderRole ?? "context"}`)
      .join("\n"),
    citationsSummary: args.dossier.citations
      .filter((citation) => citation.count > 0)
      .slice(0, 30)
      .map((citation) => `${citation.label} (${citation.sourceKey}, ${citation.count})`)
      .join("\n"),
    answerBoundarySummary: [
      `Can answer: ${args.dossier.answerBoundary.canAnswer.join("; ") || "not specified"}`,
      `Cannot answer: ${args.dossier.answerBoundary.cannotAnswer.join("; ") || "not specified"}`,
      `Handoff target: ${args.dossier.answerBoundary.handoffTarget ?? "none"}`,
      args.dossier.answerBoundary.handoffReason
        ? `Handoff reason: ${args.dossier.answerBoundary.handoffReason}`
        : "",
    ]
      .filter(Boolean)
      .join("\n"),
    evidenceChannels: evidence.evidenceChannels,
  };
}

export function renderHomeConsultantTextUserPrompt(packet: HomeConsultantTextPromptPacket): string {
  return `Question:
${packet.question}

Tenant:
${packet.tenant.tenantName}

Primary dimension:
${packet.primaryDimension}

Related dimensions:
${packet.relatedDimensions.join(", ") || "none"}

Dossier summary:
${packet.dimensionSummary}

Evidence strength:
${packet.tenant.evidenceStrength}

Relevant sections:
${packet.sectionsSummary || "None"}

Deterministic rollups:
${packet.rollupsSummary || "None"}

Relevant tables:
${packet.tablesSummary || "None"}

Relevant charts:
${packet.chartsSummary || "None"}

Relevant graphs / relationship paths:
${packet.graphsAndRelationshipsSummary || "None"}

Metrics:
${packet.metricsSummary || "None"}

Specific gaps:
${packet.gapsSummary || "None"}

Source coverage:
${packet.sourceCoverageSummary || "None"}

Citation labels available:
${packet.citationsSummary || "None"}

Answer boundary:
${packet.answerBoundarySummary || "None"}

Instructions:
Write the best possible Home / Explorer answer from this dossier.
Use the loaded evidence.
Do not invent missing evidence.
Do not overstate confidence.
If named leaders are loaded, you may name them.
If only roles are loaded, say roles are loaded but named people are missing.
If the evidence supports partial structure, describe the partial structure and the precise gap.
If the question asks what to do, explain what Home can show and hand off to the correct advisory surface.

Return plain text only.`;
}

function summarizeSections(sections: DossierSection[]): string {
  return sections
    .filter((section) => section.recordCount > 0 || section.sample.length > 0)
    .slice(0, 24)
    .map((section) => {
      const sample = section.sample
        .slice(0, 3)
        .map((record) => summarizeRecord(record, 8))
        .filter(Boolean)
        .join(" | ");
      return `${section.title} [${section.dimensionFamily}; ${section.recordCount} records; sources ${section.sourceKeys.join(", ")}]: ${section.summary}${sample ? ` Sample: ${sample}` : ""}`;
    })
    .join("\n");
}

function summarizeGraphsAndRelationships(
  dossier: UniversalDimensionDossier,
  response: HomeKnowResponse,
): string {
  const graphs = response.graphs
    .map((graph) => `${graph.title}: ${graph.nodes.length} nodes, ${graph.edges.length} edges`)
    .join("\n");
  const paths = dossier.relationshipPaths
    .slice(0, 16)
    .map((path) => `${path.label}: ${path.from} ${path.relationship} ${path.to}; confidence ${path.confidence}; sources ${path.sourceKeys.join(", ")}`)
    .join("\n");
  return [graphs, paths].filter(Boolean).join("\n");
}

function summarizeRecord(record: Record<string, unknown>, limit = 16): string {
  return Object.entries(record)
    .slice(0, limit)
    .map(([key, value]) => `${key}=${scalarPromptValue(value)}`)
    .join("; ");
}

function scalarPromptValue(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  return JSON.stringify(value);
}

function dimensionStyle(dimension: DossierDimensionFamily): string[] {
  const shared = [
    "lead with synthesis, not counts",
    "state what is loaded, what it means, and the precise gap",
  ];
  const byDimension: Record<DossierDimensionFamily, string[]> = {
    organization_leadership: [
      "lead with operating model",
      "distinguish named people from roles and portfolio accountability",
      "explain governance and decision-right implications",
    ],
    application_systems: [
      "lead with application estate shape",
      "connect applications to domains, criticality, lifecycle, and ownership",
      "state owner, lifecycle, CMDB, or service-map gaps precisely",
    ],
    data_analytics: [
      "lead with data product and platform maturity",
      "explain trust, ownership, lineage, refresh, and consumers",
      "state owner, lineage, or source-system gaps precisely",
    ],
    vendor_contracts: [
      "lead with dependency and commercial footprint",
      "connect vendors to apps, systems, and capabilities",
      "do not invent contract owners",
    ],
    budget_financials: [
      "lead with spend shape and portfolio accountability",
      "distinguish loaded budget facts from missing run, change, or forecast views",
    ],
    operations_process: [
      "lead with operational evidence pattern",
      "connect incidents, Jira, ServiceNow, CMDB, systems, and services where supported",
    ],
    ai_value_governance: [
      "lead with AI footprint and value evidence",
      "state committed versus realized value",
      "hand off scale, hold, stop, or investment questions",
    ],
    risk_compliance: [
      "lead with risk and control coverage",
      "connect risks to systems, vendors, and initiatives where supported",
    ],
    source_moves_tower: [
      "lead with module context and handoff boundary",
      "separate Home facts from Source, Moves, or Tower execution decisions",
    ],
  };
  return [...shared, ...(byDimension[dimension] ?? [])];
}

function evidenceStrength(
  channels: ReturnType<typeof hasUsableDossierEvidence>["evidenceChannels"],
): "strong" | "partial" | "thin" {
  const score =
    channels.facts +
    channels.tables +
    channels.charts +
    channels.graphs +
    channels.citations +
    channels.sourceCoverage +
    channels.sections +
    channels.rollups +
    channels.relationshipPaths +
    channels.metrics;
  if (score >= 12) return "strong";
  if (score >= 4) return "partial";
  return "thin";
}

function startsWithCountOrEvidenceLabel(text: string): boolean {
  return /^\s*(\d+|Read\b|Evidence\b|Current-state read\b|I found\b)/i.test(text);
}

function mentionsMissingCharacterization(text: string): boolean {
  return /\b(cannot be characterized|cannot be identified|not enough information to characterize)\b/i.test(text);
}

function detectCrossTenantLeak(text: string, tenantKey: string): string | null {
  const normalized = normalizeClientKeyForLeakCheck(tenantKey);
  const registryAliases = Object.entries(CLIENT_KEY_TO_DB_NAME)
    .filter(([key]) => key !== normalized)
    .flatMap(([, aliases]) => aliases);
  const displayAliases = ALL_CLIENTS
    .filter((client) => client.id !== normalized)
    .flatMap((client) => [client.name, client.shortName]);
  const leaks = [...new Set([...registryAliases, ...displayAliases])]
    .map((alias) => alias.trim())
    .filter((alias) => alias.length >= 8);
  return leaks.find((name) => new RegExp(`\\b${escapeRegExp(name)}\\b`, "i").test(text)) ?? null;
}

function normalizeClientKeyForLeakCheck(tenantKey: string): string {
  return tenantKey.toLowerCase().replace(/-air$|-holdings$|-industries$/g, "");
}

function redactTextPreview(text: string): string {
  return text
    .replace(RAW_ID_RE, "[redacted-id]")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 500);
}

function numberFromEnv(key: string, fallback: number): number {
  const value = Number(process.env[key]);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new Error("timeout")), timeoutMs);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}
