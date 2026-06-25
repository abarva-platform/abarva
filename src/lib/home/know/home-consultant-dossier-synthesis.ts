import { getAuditedAnthropicClient } from "@/lib/agent/stream";
import {
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
const DEFAULT_TIMEOUT_MS = 12_000;
const DEFAULT_MAX_TOKENS = 1_200;

export const HOME_CONSULTANT_DOSSIER_SYSTEM_PROMPT = `You are AbarVa's Home / Explorer consultant. Home answers: what do we know about this enterprise from loaded tenant evidence?

You are not a generic chatbot. You do not retrieve facts. You do not invent facts. You synthesize only from the structured dossier provided.

Lead with what the loaded context can say. Then explain what it means. Then name the specific missing evidence or gaps. Use executive prose. Do not lead with counts. Do not expose raw IDs, table names, route names, debug terms, or source internals. Do not say the topic cannot be characterized if the dossier contains partial evidence. If evidence is partial, describe the partial structure and state the precise gap.

Do not make strategic recommendations in Home. If the user asks what to do, where to invest, what to scale/hold/stop, or what decision to make, show the loaded evidence and hand off to Intelligence, Source, Moves, or Tower.

Return structured JSON only.`;

const FORBIDDEN_RE =
  /\b(cannot be characterized|cannot be identified|I found|missing source support|Current-state read|Evidence points|home_know|semantic packet|\bpacket\b|debug|\/Users\/|localhost)\b|^\s*(Read|Evidence):/i;
const RAW_ID_RE =
  /\b[A-Z]{2,16}-[A-Z0-9]{2,24}-\d{2,8}\b|\b[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\b/i;
const RECOMMENDATION_RE =
  /\b(we recommend|i recommend|you should|should invest|should prioritize|best option is|first automate|scale this|kill this)\b/i;

export interface HomeConsultantDossierSynthesisOutput {
  directAnswer: string;
  currentStateSynthesis: string;
  businessImplication: string;
  specificGaps: Array<{
    gap: string;
    whyItMatters: string;
    sourceEvidence: string;
  }>;
  safeAnswerBoundary: {
    canSay: string[];
    cannotSay: string[];
    handoffTarget: string | null;
  };
  artifactNarrative: {
    tableIntro: string;
    chartIntro: string;
    graphIntro: string;
  };
  citationRefsUsed: string[];
  confidence: {
    level: "high" | "medium" | "low";
    reason: string;
  };
}

export interface HomeConsultantDossierSynthesisResult {
  output: HomeConsultantDossierSynthesisOutput;
  promptPacket: HomeConsultantDossierPromptPacket;
  trace: {
    attempted: true;
    used: true;
    model: string;
    auditId: string;
    validationIssues: string[];
  };
}

export interface HomeConsultantDossierSynthesisFailure {
  attempted: true;
  used: false;
  model?: string;
  auditId?: string;
  reason: string;
  validationIssues: string[];
}

export interface HomeConsultantDossierPromptPacket {
  question: string;
  tenant: {
    tenantKey: string;
    tenantName: string;
    industry: string;
    evidenceStrength: "strong" | "partial" | "thin";
  };
  mode: "home_know";
  primaryDimension: DossierDimensionFamily;
  relatedDimensions: DossierDimensionFamily[];
  dimensionSummary: string;
  dimensionStyle: string[];
  sections: Array<{
    title: string;
    dimensionFamily: DossierDimensionFamily;
    summary: string;
    recordCount: number;
    sourceKeys: string[];
    sample: Array<Record<string, string | number | boolean | null>>;
  }>;
  rollups: UniversalDimensionDossier["rollups"];
  tables: Array<{ title: string; rowCount: number; columns: string[] }>;
  charts: Array<{ title: string; pointCount: number }>;
  graphs: Array<{ title: string; nodeCount: number; edgeCount: number }>;
  relationshipPaths: UniversalDimensionDossier["relationshipPaths"];
  metrics: UniversalDimensionDossier["metrics"];
  gaps: UniversalDimensionDossier["gaps"];
  citations: UniversalDimensionDossier["citations"];
  answerBoundary: UniversalDimensionDossier["answerBoundary"];
  evidenceChannels: ReturnType<typeof hasUsableDossierEvidence>["evidenceChannels"];
  qualityRules: {
    mustNotInvent: true;
    mustNotRecommendInHome: true;
    mustCiteFromDossier: true;
    mustAvoidRawIds: true;
    mustStartWithSynthesis: true;
  };
}

export function isHomeConsultantClaudeSynthesisEnabled(): boolean {
  const raw = process.env.HOME_KNOW_CLAUDE_SYNTHESIS_ENABLED?.trim().toLowerCase();
  if (raw === "false" || raw === "0" || raw === "off") return false;
  if (raw === "true" || raw === "1" || raw === "on") return true;
  return process.env.NODE_ENV === "production";
}

export async function synthesizeHomeConsultantDossier(args: {
  dossier: UniversalDimensionDossier;
  deterministicResponse: HomeKnowResponse;
}): Promise<HomeConsultantDossierSynthesisResult | HomeConsultantDossierSynthesisFailure | null> {
  if (!isHomeConsultantClaudeSynthesisEnabled()) {
    return {
      attempted: true,
      used: false,
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
      reason: "no_usable_dossier_evidence",
      validationIssues: [],
    };
  }

  const model = process.env.HOME_KNOW_CLAUDE_MODEL?.trim() || DEFAULT_MODEL;
  const maxTokens = numberFromEnv("HOME_KNOW_CLAUDE_MAX_TOKENS", DEFAULT_MAX_TOKENS);
  const timeoutMs = numberFromEnv("HOME_KNOW_CLAUDE_TIMEOUT_MS", DEFAULT_TIMEOUT_MS);
  const promptPacket = buildHomeConsultantDossierPromptPacket({
    dossier: args.dossier,
    response: args.deterministicResponse,
  });
  const user = JSON.stringify(promptPacket, null, 2);
  const prompt = [HOME_CONSULTANT_DOSSIER_SYSTEM_PROMPT, user].join("\n\n");

  try {
    const { client, auditId } = await getAuditedAnthropicClient({
      tenantId: args.dossier.tenantKey,
      workflow: "home-consultant-dossier-synthesis",
      model,
      dataClass: "confidential",
      prompt,
      metadata: {
        primaryDimension: args.dossier.route.primaryDimension,
        relatedDimensions: args.dossier.route.relatedDimensions,
        evidenceChannels: evidence.evidenceChannels,
      },
    });
    const message = await withTimeout(
      client.messages.create({
        model,
        max_tokens: maxTokens,
        system: HOME_CONSULTANT_DOSSIER_SYSTEM_PROMPT,
        messages: [{ role: "user", content: user }],
      }),
      timeoutMs,
    );
    const text = message.content
      .filter((item) => item.type === "text")
      .map((item) => item.text)
      .join("\n")
      .trim();
    const output = parseJsonObject(text);
    if (!isSynthesisOutput(output)) {
      console.warn(
        "[home-consultant-synthesis] fallback: invalid_json_shape",
        JSON.stringify({
          tenantKey: args.dossier.tenantKey,
          primaryDimension: args.dossier.route.primaryDimension,
          model,
          auditId,
        }),
      );
      return {
        attempted: true,
        used: false,
        model,
        auditId,
        reason: "invalid_json_shape",
        validationIssues: [],
      };
    }
    const validationIssues = validateHomeConsultantSynthesis({
      output,
      dossier: args.dossier,
      response: args.deterministicResponse,
    });
    if (validationIssues.length > 0) {
      console.warn(
        "[home-consultant-synthesis] fallback: validation_failed",
        JSON.stringify({
          tenantKey: args.dossier.tenantKey,
          primaryDimension: args.dossier.route.primaryDimension,
          model,
          auditId,
          validationIssues,
        }),
      );
      return {
        attempted: true,
        used: false,
        model,
        auditId,
        reason: "validation_failed",
        validationIssues,
      };
    }
    return {
      output,
      promptPacket,
      trace: {
        attempted: true,
        used: true,
        model,
        auditId,
        validationIssues,
      },
    };
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    console.warn(
      "[home-consultant-synthesis] fallback: exception",
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
      model,
      reason,
      validationIssues: [],
    };
  }
}

export function isHomeConsultantSynthesisResult(
  value: HomeConsultantDossierSynthesisResult | HomeConsultantDossierSynthesisFailure | null,
): value is HomeConsultantDossierSynthesisResult {
  return Boolean(value && "trace" in value && value.trace.used);
}

export function applyHomeConsultantSynthesisFailureTrace(
  response: HomeKnowResponse,
  failure: HomeConsultantDossierSynthesisFailure,
): HomeKnowResponse {
  return {
    ...response,
    safety: {
      ...response.safety,
      composerTrace: response.safety.composerTrace
        ? {
            ...response.safety.composerTrace,
            goldenComposerAttempted: true,
            goldenComposerUsed: true,
            fallbackUsed: true,
            reason: `${response.safety.composerTrace.reason}; Claude consultant synthesis fallback=${failure.reason}${
              failure.validationIssues.length
                ? `; validationIssues=${failure.validationIssues.join("|")}`
                : ""
            }${failure.model ? `; model=${failure.model}` : ""}${
              failure.auditId ? `; auditId=${failure.auditId}` : ""
            }`,
          }
        : response.safety.composerTrace,
    },
  };
}

export function applyHomeConsultantSynthesis(
  response: HomeKnowResponse,
  result: HomeConsultantDossierSynthesisResult,
): HomeKnowResponse {
  const prose = [
    result.output.directAnswer,
    result.output.currentStateSynthesis,
    result.output.businessImplication,
    gapSentence(result.output),
  ]
    .filter(Boolean)
    .join("\n\n");
  return {
    ...response,
    prose,
    safety: {
      ...response.safety,
      unsupportedClaimsRemoved: response.safety.unsupportedClaimsRemoved,
      composerTrace: response.safety.composerTrace
        ? {
            ...response.safety.composerTrace,
            composer: "home_consultant_claude_synthesis",
            goldenComposerAttempted: true,
            goldenComposerUsed: true,
            fallbackUsed: false,
            reason: `Claude consultant dossier synthesis used; model=${result.trace.model}; auditId=${result.trace.auditId}`,
          }
        : response.safety.composerTrace,
    },
  };
}

export function validateHomeConsultantSynthesis(args: {
  output: HomeConsultantDossierSynthesisOutput;
  dossier: UniversalDimensionDossier;
  response: HomeKnowResponse;
}): string[] {
  const issues: string[] = [];
  const visible = [
    args.output.directAnswer,
    args.output.currentStateSynthesis,
    args.output.businessImplication,
    ...args.output.specificGaps.flatMap((gap) => [
      gap.gap,
      gap.whyItMatters,
      gap.sourceEvidence,
    ]),
  ].join("\n");

  if (!args.output.directAnswer.trim()) issues.push("missing_direct_answer");
  if (FORBIDDEN_RE.test(visible)) issues.push("forbidden_language");
  if (RAW_ID_RE.test(visible)) issues.push("raw_id");
  if (
    !args.dossier.answerBoundary.handoffTarget &&
    RECOMMENDATION_RE.test(visible)
  ) {
    issues.push("home_recommendation_without_handoff");
  }
  const citationKeys = new Set(
    args.dossier.citations.flatMap((citation) => [
      citation.sourceKey,
      citation.label,
    ]),
  );
  const unknownRefs = args.output.citationRefsUsed.filter(
    (ref) => !citationKeys.has(ref),
  );
  if (args.output.citationRefsUsed.length === 0 && args.response.citations.length > 0) {
    issues.push("missing_citation_refs_used");
  }
  if (unknownRefs.length > 0) issues.push("unknown_citation_ref");
  if (
    args.output.safeAnswerBoundary.handoffTarget &&
    args.output.safeAnswerBoundary.handoffTarget !== args.dossier.answerBoundary.handoffTarget
  ) {
    issues.push("handoff_target_changed_by_model");
  }
  return [...new Set(issues)];
}

export function buildHomeConsultantDossierPromptPacket(args: {
  dossier: UniversalDimensionDossier;
  response: HomeKnowResponse;
}): HomeConsultantDossierPromptPacket {
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
    primaryDimension: args.dossier.route.primaryDimension,
    relatedDimensions: args.dossier.route.relatedDimensions,
    dimensionSummary: args.dossier.dimensionSummary,
    dimensionStyle: dimensionStyle(args.dossier.route.primaryDimension),
    sections: args.dossier.sections.slice(0, 12).map(serializeSection),
    rollups: args.dossier.rollups,
    tables: args.response.tables.map((table) => ({
      title: table.title,
      rowCount: table.rows.length,
      columns: table.columns.map((column) => column.label),
    })),
    charts: args.response.charts.map((chart) => ({
      title: chart.title,
      pointCount: chart.data.length,
    })),
    graphs: args.response.graphs.map((graph) => ({
      title: graph.title,
      nodeCount: graph.nodes.length,
      edgeCount: graph.edges.length,
    })),
    relationshipPaths: args.dossier.relationshipPaths.slice(0, 12),
    metrics: args.dossier.metrics.slice(0, 12),
    gaps: args.dossier.gaps.slice(0, 12),
    citations: args.dossier.citations.filter((citation) => citation.count > 0).slice(0, 20),
    answerBoundary: args.dossier.answerBoundary,
    evidenceChannels: evidence.evidenceChannels,
    qualityRules: {
      mustNotInvent: true,
      mustNotRecommendInHome: true,
      mustCiteFromDossier: true,
      mustAvoidRawIds: true,
      mustStartWithSynthesis: true,
    },
  };
}

function serializeSection(
  section: DossierSection,
): HomeConsultantDossierPromptPacket["sections"][number] {
  return {
    title: section.title,
    dimensionFamily: section.dimensionFamily,
    summary: section.summary,
    recordCount: section.recordCount,
    sourceKeys: section.sourceKeys,
    sample: section.sample.slice(0, 3).map((record: Record<string, unknown>) => {
      const clean: Record<string, string | number | boolean | null> = {};
      for (const [key, value] of Object.entries(record).slice(0, 8)) {
        if (value === undefined) continue;
        clean[key] = scalarPromptValue(value);
      }
      return clean;
    }),
  };
}

function scalarPromptValue(value: unknown): string | number | boolean | null {
  if (
    value === null ||
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return value;
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

function isSynthesisOutput(value: unknown): value is HomeConsultantDossierSynthesisOutput {
  if (!value || typeof value !== "object") return false;
  const record = value as Record<string, unknown>;
  return (
    typeof record.directAnswer === "string" &&
    typeof record.currentStateSynthesis === "string" &&
    typeof record.businessImplication === "string" &&
    Array.isArray(record.specificGaps) &&
    typeof record.safeAnswerBoundary === "object" &&
    typeof record.artifactNarrative === "object" &&
    Array.isArray(record.citationRefsUsed) &&
    typeof record.confidence === "object"
  );
}

function parseJsonObject(text: string): unknown {
  const trimmed = text.trim();
  if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
    return JSON.parse(trimmed);
  }
  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  if (start < 0 || end <= start) throw new Error("No JSON object returned");
  return JSON.parse(trimmed.slice(start, end + 1));
}

function gapSentence(output: HomeConsultantDossierSynthesisOutput): string {
  if (output.specificGaps.length === 0) return "";
  const gaps = output.specificGaps
    .slice(0, 3)
    .map((gap) => `${gap.gap}: ${gap.whyItMatters}`)
    .join(" ");
  return `The specific gaps are ${gaps}`;
}

function numberFromEnv(key: string, fallback: number): number {
  const value = Number(process.env[key]);
  return Number.isFinite(value) && value > 0 ? value : fallback;
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
