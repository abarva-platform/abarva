import { createHash } from "node:crypto";

import {
  callModel,
  createAnthropicDirectTextAdapter,
  createSupabaseAiEgressAuditSink,
  loadTenantAiPolicyRecord,
} from "@/lib/integrations/ai-egress";
import type {
  AbarVaInterpretationV1,
  BenchmarkV1,
  GovernedMetricValue,
  KnowledgeLens,
  LeadershipPerspectiveV1,
  PerspectiveEvidenceStance,
} from "../consumption-contracts";

export const KNOWLEDGE_NARRATIVE_MODEL = "claude-sonnet-4-6";
const KNOWLEDGE_NARRATIVE_WORKLOAD = "intelligence_answer";
const REFUSAL_SIGNAL = "REFUSE_NOT_ENOUGH_EVIDENCE";
const MIN_ACCEPTED_FACTS = 3;

const SHARED_PREAMBLE = `You are authoring content for AbarVa's Knowledge Explorer -- a governed enterprise-intelligence product
read by C-suite and VP-level executives making real resource-allocation decisions. What you write is
published, reviewed content, not a live chat response. It will sit on the page as AbarVa's own analytical
voice, not attributed to you as an AI assistant.

You write like a senior strategy consultant preparing a board-ready observation, not like a BI dashboard
summarizing numbers. The difference: a BI summary restates what happened. Your job is to say something a
reader could not get by looking at the underlying table themselves -- a pattern across data points, a gap
between what leadership believes and what the evidence shows, a specific decision the evidence unlocks or
blocks. If your output could be replaced by "here are the numbers," you have failed at the task.

Ground every claim in the evidence provided. Never invent a fact, a number, a quote, or a peer comparison
that is not in the input. Where the evidence is genuinely thin, say so explicitly rather than writing
around the gap with confident-sounding language. A stated limitation is more valuable to an executive than
false certainty.

Do not use consulting-deck cliches as a substitute for a real claim: "leverage synergies," "drive
alignment," "unlock value," "best-in-class," "world-class," "holistic." If a sentence would sound at home
in a generic vendor pitch, rewrite it until it says something specific to this tenant's actual evidence.

Never expose raw record IDs, table names, internal field names, or pipeline/system terminology. Write for
an executive reader, not a database.`;

export interface KnowledgeNarrativeLensDefinition {
  readonly lens: KnowledgeLens;
  readonly label: string;
  readonly description: string;
  readonly relatedAirlineLensLabels: readonly string[];
}

export const KNOWLEDGE_NARRATIVE_LENSES: readonly KnowledgeNarrativeLensDefinition[] = [
  {
    lens: "none",
    label: "Understand the enterprise",
    description: "The unfiltered enterprise view: what the accepted baseline says about the company, its operating model, and the evidence gaps that constrain interpretation.",
    relatedAirlineLensLabels: ["Understand the enterprise"],
  },
  {
    lens: "risk_resilience",
    label: "Recover faster from disruption / protect crew legality and cost",
    description: "Disruption recovery, crew legality, operational resilience, and the evidence that determines whether recovery investments can be trusted.",
    relatedAirlineLensLabels: ["Recover faster from disruption", "Protect crew legality and cost"],
  },
  {
    lens: "cost_efficiency",
    label: "Reduce cost and operational waste",
    description: "Cost, vendor, maintenance, baggage, and turnaround patterns where operational friction may be measurable or still not measured.",
    relatedAirlineLensLabels: ["Reduce baggage mishandling", "Raise aircraft availability", "Improve airport turnaround"],
  },
  {
    lens: "growth_innovation",
    label: "Grow loyalty and revenue value",
    description: "Revenue management, loyalty value, customer growth, and the evidence required before calling a commercial initiative value-accretive.",
    relatedAirlineLensLabels: ["Grow loyalty value", "Improve revenue management"],
  },
  {
    lens: "data_ai_readiness",
    label: "Apply AI where evidence allows",
    description: "AI opportunity readiness, data lineage, control maturity, and where missing evidence should block automation or model expansion.",
    relatedAirlineLensLabels: ["Apply AI where evidence allows"],
  },
  {
    lens: "vendor_consolidation",
    label: "Shape vendor and platform consolidation",
    description: "Vendor, platform, and contract concentration patterns where the baseline supports or blocks consolidation decisions.",
    relatedAirlineLensLabels: ["Reduce baggage mishandling", "Raise aircraft availability", "Improve airport turnaround"],
  },
];

export interface AcceptedNarrativeFact {
  readonly factRef: string;
  readonly entityRef: string | null;
  readonly entityDisplayName: string | null;
  readonly entityType: string | null;
  readonly factType: string;
  readonly factValue: unknown;
  readonly evidenceRefs: readonly string[];
  readonly evidenceText?: string | null;
  readonly confidence?: number | null;
}

export interface AcceptedNarrativeRelationship {
  readonly relationshipRef: string;
  readonly relationshipTypeRef: string;
  readonly fromEntityRef: string;
  readonly toEntityRef: string;
  readonly evidenceRefs: readonly string[];
  readonly payload: unknown;
}

export interface NarrativeInterviewExcerpt {
  readonly role: string;
  readonly quote: string;
  readonly sourceRowId: string;
  readonly evidenceRef: string;
  readonly initiativeLink?: string | null;
  readonly metricMentioned?: string | null;
  readonly confidence?: string | null;
}

export interface NarrativeIndustryContextRow {
  readonly patternName: string;
  readonly businessContext: string | null;
  readonly applicability: string | null;
  readonly evidenceBasis: string | null;
  readonly caveats: string | null;
  readonly confidence: string | null;
  readonly sourceRowId: string;
  readonly hasRealCohortMetric: boolean;
}

export interface NarrativeMetric {
  readonly metricRef: string;
  readonly metricName: string;
  readonly value: number | null;
  readonly unit: string | null;
  readonly period: string | null;
  readonly evidenceRefs: readonly string[];
}

export interface EnterpriseIdentityNarrativeSummary {
  readonly displayName: string | null;
  readonly industry: string | null;
  readonly summary: string | null;
  readonly evidenceRefs: readonly string[];
}

export interface GenerateKnowledgeNarrativeInput {
  readonly tenantKey: string;
  readonly tenantIdForPolicy?: string;
  readonly knowledgeBaselineRef: string;
  readonly lens: KnowledgeNarrativeLensDefinition;
  readonly enterpriseIdentity: EnterpriseIdentityNarrativeSummary;
  readonly facts: readonly AcceptedNarrativeFact[];
  readonly relationships: readonly AcceptedNarrativeRelationship[];
  readonly interviewExcerpts: readonly NarrativeInterviewExcerpt[];
  readonly industryContextRows: readonly NarrativeIndustryContextRow[];
  readonly metrics: readonly NarrativeMetric[];
}

export interface KnowledgeNarrativeDraft {
  readonly lens: KnowledgeLens;
  readonly objectRef: string;
  readonly interpretation: AbarVaInterpretationV1 | null;
  readonly perspectives: LeadershipPerspectiveV1[];
  readonly benchmarks: BenchmarkV1[];
  readonly evidenceRefs: string[];
  readonly refused: boolean;
  readonly refusalReasons: string[];
  readonly auditIds: string[];
}

type AiCall = typeof callModel;
type LoadPolicy = typeof loadTenantAiPolicyRecord;

export interface KnowledgeNarrativeGeneratorDeps {
  readonly callModel?: AiCall;
  readonly loadTenantAiPolicyRecord?: LoadPolicy;
  readonly createAuditSink?: typeof createSupabaseAiEgressAuditSink;
  readonly createTextAdapter?: typeof createAnthropicDirectTextAdapter;
}

export class KnowledgeNarrativeGenerator {
  private readonly callModelImpl: AiCall;
  private readonly loadPolicyImpl: LoadPolicy;
  private readonly createAuditSinkImpl: typeof createSupabaseAiEgressAuditSink;
  private readonly createTextAdapterImpl: typeof createAnthropicDirectTextAdapter;

  constructor(deps: KnowledgeNarrativeGeneratorDeps = {}) {
    this.callModelImpl = deps.callModel ?? callModel;
    this.loadPolicyImpl = deps.loadTenantAiPolicyRecord ?? loadTenantAiPolicyRecord;
    this.createAuditSinkImpl = deps.createAuditSink ?? createSupabaseAiEgressAuditSink;
    this.createTextAdapterImpl = deps.createTextAdapter ?? createAnthropicDirectTextAdapter;
  }

  isAvailable(): boolean {
    return Boolean(process.env.ANTHROPIC_API_KEY);
  }

  async generate(input: GenerateKnowledgeNarrativeInput): Promise<KnowledgeNarrativeDraft> {
    const relevantFacts = relevantFactsForLens(input.facts, input.lens);
    const evidenceRefs = collectEvidenceRefs(relevantFacts, input.relationships, input.interviewExcerpts, input.metrics);
    const refusalReasons: string[] = [];
    const auditIds: string[] = [];

    if (relevantFacts.length < MIN_ACCEPTED_FACTS) {
      refusalReasons.push(`accepted_fact_count_below_${MIN_ACCEPTED_FACTS}`);
    }
    if (!relevantFacts.some((fact) => fact.evidenceRefs.length > 0 || fact.confidence != null)) {
      refusalReasons.push("accepted_evidence_or_confidence_missing");
    }
    if (evidenceRefs.size === 0) {
      refusalReasons.push("evidence_refs_missing");
    }
    if (refusalReasons.length > 0) {
      return emptyDraft(input, refusalReasons);
    }

    const policyRecord = await this.loadPolicyImpl(input.tenantIdForPolicy ?? input.tenantKey);
    const shared = {
      tenantId: policyRecord.tenantId,
      provider: "anthropic" as const,
      route: "anthropic-direct" as const,
      model: KNOWLEDGE_NARRATIVE_MODEL,
      dataClass: "confidential" as const,
      policy: policyRecord.policy,
      auditSink: this.createAuditSinkImpl({
        intendedTenantKey: input.tenantKey,
        resolvedTenantKey: policyRecord.tenantId,
        tenantId: policyRecord.tenantId,
      }),
      adapter: this.createTextAdapterImpl({
        system: SHARED_PREAMBLE,
        model: KNOWLEDGE_NARRATIVE_MODEL,
        maxTokens: 1800,
        workload: KNOWLEDGE_NARRATIVE_WORKLOAD,
      }),
    };

    const interpretation = await this.runInterpretationCall(input, relevantFacts, evidenceRefs, shared);
    auditIds.push(...interpretation.auditIds);
    const perspectives = await this.runPerspectivesCall(input, relevantFacts, evidenceRefs, shared);
    auditIds.push(...perspectives.auditIds);
    const benchmarks = await this.runBenchmarksCall(input, relevantFacts, evidenceRefs, shared);
    auditIds.push(...benchmarks.auditIds);

    return {
      lens: input.lens.lens,
      objectRef: objectRefForLens(input.lens.lens),
      interpretation: interpretation.value,
      perspectives: perspectives.value,
      benchmarks: benchmarks.value,
      evidenceRefs: [...evidenceRefs].sort(),
      refused: false,
      refusalReasons,
      auditIds,
    };
  }

  private async runInterpretationCall(
    input: GenerateKnowledgeNarrativeInput,
    relevantFacts: readonly AcceptedNarrativeFact[],
    allowedEvidenceRefs: ReadonlySet<string>,
    shared: SharedCallArgs,
  ): Promise<{ value: AbarVaInterpretationV1 | null; auditIds: string[] }> {
    const result = await this.callModelImpl({
      ...shared,
      workflow: "knowledge-narrative-interpretation",
      prompt: buildInterpretationPrompt(input, relevantFacts),
      metadata: { module: "knowledge", narrativeField: "interpretation", lens: input.lens.lens, baseline: input.knowledgeBaselineRef },
    });
    if (!result.ok) return { value: null, auditIds: [result.auditId] };
    if (result.response.trim() === REFUSAL_SIGNAL) return { value: null, auditIds: [result.auditId] };
    const parsed = parseJsonObject(result.response);
    const evidenceRefs = stringArray(parsed.evidenceRefs).filter((ref) => allowedEvidenceRefs.has(ref));
    if (!isNonEmptyString(parsed.headline) || !isNonEmptyString(parsed.body) || evidenceRefs.length === 0) {
      return { value: null, auditIds: [result.auditId] };
    }
    return {
      auditIds: [result.auditId],
      value: {
        id: stableId("abarva-interpretation", input.knowledgeBaselineRef, input.lens.lens, parsed.headline),
        contentClass: "abarva_interpretation",
        availabilityState: "available",
        evidenceRefs,
        absenceReason: null,
        headline: parsed.headline.trim(),
        body: parsed.body.trim(),
        pinnedBaselineRef: input.knowledgeBaselineRef,
      },
    };
  }

  private async runPerspectivesCall(
    input: GenerateKnowledgeNarrativeInput,
    relevantFacts: readonly AcceptedNarrativeFact[],
    allowedEvidenceRefs: ReadonlySet<string>,
    shared: SharedCallArgs,
  ): Promise<{ value: LeadershipPerspectiveV1[]; auditIds: string[] }> {
    if (input.interviewExcerpts.length === 0) return { value: [], auditIds: [] };
    const result = await this.callModelImpl({
      ...shared,
      workflow: "knowledge-narrative-leadership-perspectives",
      prompt: buildPerspectivesPrompt(input, relevantFacts),
      metadata: { module: "knowledge", narrativeField: "perspectives", lens: input.lens.lens, baseline: input.knowledgeBaselineRef },
    });
    if (!result.ok || result.response.trim() === REFUSAL_SIGNAL) return { value: [], auditIds: [result.auditId] };
    const parsed = parseJsonObject(result.response);
    const rows = Array.isArray(parsed.perspectives) ? parsed.perspectives : [];
    const bySource = new Map(input.interviewExcerpts.map((row) => [row.sourceRowId, row]));
    const perspectives: LeadershipPerspectiveV1[] = [];
    for (const row of rows.slice(0, 4)) {
      const sourceRowId = typeof row?.sourceRowId === "string" ? row.sourceRowId : "";
      const excerpt = bySource.get(sourceRowId);
      if (!excerpt) continue;
      const stance = evidenceStanceFrom(row, allowedEvidenceRefs);
      const allRefs = [...new Set([excerpt.evidenceRef, ...stance.supporting, ...stance.challenging, ...stance.uncertain])].filter((ref) => allowedEvidenceRefs.has(ref) || ref === excerpt.evidenceRef);
      if (allRefs.length === 0) continue;
      perspectives.push({
        id: stableId("leadership-perspective", input.knowledgeBaselineRef, input.lens.lens, sourceRowId),
        contentClass: "leadership_perspective",
        availabilityState: "available",
        evidenceRefs: allRefs,
        absenceReason: null,
        quote: excerpt.quote,
        attribution: null,
        role: excerpt.role,
        sourceBasis: isNonEmptyString(row?.ourReading) ? row.ourReading.trim() : `Interview source ${sourceRowId} triangulated against accepted evidence.`,
        evidenceStance: stance,
      });
    }
    return { value: perspectives, auditIds: [result.auditId] };
  }

  private async runBenchmarksCall(
    input: GenerateKnowledgeNarrativeInput,
    relevantFacts: readonly AcceptedNarrativeFact[],
    allowedEvidenceRefs: ReadonlySet<string>,
    shared: SharedCallArgs,
  ): Promise<{ value: BenchmarkV1[]; auditIds: string[] }> {
    if (!input.industryContextRows.some((row) => row.hasRealCohortMetric)) {
      return { value: [], auditIds: [] };
    }
    const result = await this.callModelImpl({
      ...shared,
      workflow: "knowledge-narrative-benchmarks",
      prompt: buildBenchmarksPrompt(input, relevantFacts),
      metadata: { module: "knowledge", narrativeField: "benchmarks", lens: input.lens.lens, baseline: input.knowledgeBaselineRef },
    });
    if (!result.ok || result.response.trim() === REFUSAL_SIGNAL) return { value: [], auditIds: [result.auditId] };
    const parsed = parseJsonObject(result.response);
    const rows = Array.isArray(parsed.benchmarks) ? parsed.benchmarks : [];
    const benchmarks: BenchmarkV1[] = [];
    for (const row of rows.slice(0, 4)) {
      const evidenceRefs = stringArray(row?.evidenceRefs).filter((ref) => allowedEvidenceRefs.has(ref));
      if (!isNonEmptyString(row?.label) || evidenceRefs.length === 0) continue;
      benchmarks.push({
        id: stableId("industry-benchmark", input.knowledgeBaselineRef, input.lens.lens, row.label),
        contentClass: "industry_benchmark",
        availabilityState: row?.value === null ? "not_measured" : "available",
        evidenceRefs,
        absenceReason: row?.value === null && isNonEmptyString(row?.notMeasuredReason) ? row.notMeasuredReason.trim() : null,
        label: row.label.trim(),
        value: metricValueFrom(row, evidenceRefs),
        peerContext: isNonEmptyString(row?.peerContext) ? row.peerContext.trim() : null,
      });
    }
    return { value: benchmarks, auditIds: [result.auditId] };
  }
}

type SharedCallArgs = Pick<Parameters<AiCall>[0], "tenantId" | "provider" | "route" | "model" | "dataClass" | "policy" | "auditSink" | "adapter">;

function buildInterpretationPrompt(input: GenerateKnowledgeNarrativeInput, facts: readonly AcceptedNarrativeFact[]): string {
  return [
    `Task: write ONE interpretation for the lens "${input.lens.label}" (${input.lens.description}), grounded only in the accepted knowledge provided below.`,
    "",
    "Structure (write as connected prose, not labeled sub-sections -- the labels below are for you, not the output):",
    "1. HEADLINE: a single sentence making a specific, falsifiable claim about what the evidence shows for this lens. Not a topic label.",
    "2. BODY, move one -- the observation: name the specific pattern, rate, or gap in the evidence that grounds the headline.",
    "3. BODY, move two -- why the obvious framing is incomplete: sharpen or correct the likely assumption.",
    "4. BODY, move three -- the decision implication: end on what this unlocks or blocks. Never end on monitor or continue to assess.",
    "",
    `If the accepted evidence for this lens is too thin to support a real claim (fewer than ${MIN_ACCEPTED_FACTS} accepted facts, or no evidence with a confidence signal), return ${REFUSAL_SIGNAL}.`,
    "",
    "Return STRICT JSON only: {\"headline\": string, \"body\": string, \"evidenceRefs\": string[]}. evidenceRefs must be selected from the provided evidenceRefs only.",
    `Accepted knowledge: ${JSON.stringify(factsForPrompt(facts))}`,
    `Tenant context: ${JSON.stringify(input.enterpriseIdentity)}`,
  ].join("\n");
}

function buildPerspectivesPrompt(input: GenerateKnowledgeNarrativeInput, facts: readonly AcceptedNarrativeFact[]): string {
  return [
    "Task: for each of the following real interview excerpts, write a structured evidence-triangulation (not a summary of the quote -- an actual test of it against the evidence):",
    "",
    "For each quote, produce evidenceSupports, evidenceChallenges, stillUncertain, and ourReading. Do not soften a real disagreement between leadership belief and evidence into false consensus.",
    "",
    "Return STRICT JSON only: {\"perspectives\":[{\"sourceRowId\": string, \"supportingEvidenceRefs\": string[], \"challengingEvidenceRefs\": string[], \"uncertainEvidenceRefs\": string[], \"ourReading\": string}]}",
    "All evidence refs must be selected from the accepted evidence provided. Use sourceRowId from the interview excerpt exactly.",
    `Interview excerpts: ${JSON.stringify(input.interviewExcerpts.slice(0, 8))}`,
    `Accepted evidence to triangulate against: ${JSON.stringify(factsForPrompt(facts))}`,
  ].join("\n");
}

function buildBenchmarksPrompt(input: GenerateKnowledgeNarrativeInput, facts: readonly AcceptedNarrativeFact[]): string {
  return [
    "Task: position this tenant's measured values against real industry cohort context, where genuine cohort data exists in the input.",
    "",
    "If no real cohort data exists for a metric, do not estimate or imply a peer position. Never invent a specific peer number, percentile, or cohort size that is not in the input.",
    "",
    "Return STRICT JSON only: {\"benchmarks\":[{\"label\": string, \"value\": number|null, \"unit\": string|null, \"metricKey\": string, \"peerContext\": string|null, \"notMeasuredReason\": string|null, \"evidenceRefs\": string[]}]}",
    `Industry context data provided: ${JSON.stringify(input.industryContextRows.filter((row) => row.hasRealCohortMetric).slice(0, 8))}`,
    `Tenant metrics: ${JSON.stringify(input.metrics.slice(0, 12))}`,
    `Accepted facts: ${JSON.stringify(factsForPrompt(facts).slice(0, 12))}`,
  ].join("\n");
}

function factsForPrompt(facts: readonly AcceptedNarrativeFact[]): unknown[] {
  return facts.slice(0, 40).map((fact) => ({
    factType: fact.factType,
    entity: fact.entityDisplayName,
    entityType: fact.entityType,
    value: fact.factValue,
    evidenceRefs: fact.evidenceRefs,
    confidence: fact.confidence,
  }));
}

function relevantFactsForLens(
  facts: readonly AcceptedNarrativeFact[],
  lens: KnowledgeNarrativeLensDefinition,
): readonly AcceptedNarrativeFact[] {
  if (lens.lens === "none") return facts;
  const tokens = new Set([lens.lens, ...lens.label.toLowerCase().split(/[^a-z0-9]+/), ...lens.relatedAirlineLensLabels.flatMap((label) => label.toLowerCase().split(/[^a-z0-9]+/))].filter((token) => token.length > 2));
  const matches = facts.filter((fact) => {
    const haystack = `${fact.entityType ?? ""} ${fact.entityDisplayName ?? ""} ${fact.factType} ${JSON.stringify(fact.factValue ?? {})}`.toLowerCase();
    return [...tokens].some((token) => haystack.includes(token));
  });
  return matches.length >= MIN_ACCEPTED_FACTS ? matches : facts;
}

function collectEvidenceRefs(
  facts: readonly AcceptedNarrativeFact[],
  relationships: readonly AcceptedNarrativeRelationship[],
  interviews: readonly NarrativeInterviewExcerpt[],
  metrics: readonly NarrativeMetric[],
): Set<string> {
  const refs = new Set<string>();
  for (const fact of facts) for (const ref of fact.evidenceRefs) refs.add(ref);
  for (const rel of relationships) for (const ref of rel.evidenceRefs) refs.add(ref);
  for (const interview of interviews) refs.add(interview.evidenceRef);
  for (const metric of metrics) for (const ref of metric.evidenceRefs) refs.add(ref);
  return refs;
}

function evidenceStanceFrom(row: unknown, allowed: ReadonlySet<string>): PerspectiveEvidenceStance {
  const record = isRecord(row) ? row : {};
  return {
    supporting: stringArray(record.supportingEvidenceRefs).filter((ref) => allowed.has(ref)),
    challenging: stringArray(record.challengingEvidenceRefs).filter((ref) => allowed.has(ref)),
    uncertain: stringArray(record.uncertainEvidenceRefs).filter((ref) => allowed.has(ref)),
  };
}

function metricValueFrom(row: unknown, evidenceRefs: string[]): GovernedMetricValue | null {
  if (!isRecord(row) || typeof row.value !== "number" || !Number.isFinite(row.value)) return null;
  return {
    metricKey: isNonEmptyString(row.metricKey) ? row.metricKey : stableId("benchmark-metric", row.label ?? "benchmark"),
    label: isNonEmptyString(row.label) ? row.label : "Benchmark",
    value: row.value,
    unit: typeof row.unit === "string" ? row.unit : null,
    period: null,
    availabilityState: "available",
    semanticModelVersion: null,
    metricQueryHash: null,
    evidenceRefs,
    unavailableReason: null,
  };
}

function emptyDraft(input: GenerateKnowledgeNarrativeInput, refusalReasons: string[]): KnowledgeNarrativeDraft {
  return {
    lens: input.lens.lens,
    objectRef: objectRefForLens(input.lens.lens),
    interpretation: null,
    perspectives: [],
    benchmarks: [],
    evidenceRefs: [],
    refused: true,
    refusalReasons,
    auditIds: [],
  };
}

export function objectRefForLens(lens: KnowledgeLens): string {
  return lens === "none" ? "enterprise" : `enterprise:${lens}`;
}

function stableId(...parts: unknown[]): string {
  return createHash("sha256")
    .update(JSON.stringify(parts))
    .digest("hex")
    .slice(0, 16);
}

function parseJsonObject(text: string): Record<string, unknown> {
  const trimmed = text.trim().replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```$/i, "").trim();
  const parsed: unknown = JSON.parse(trimmed);
  if (!isRecord(parsed)) throw new Error("Narrative model returned non-object JSON.");
  return parsed;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function stringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string" && item.trim().length > 0) : [];
}
