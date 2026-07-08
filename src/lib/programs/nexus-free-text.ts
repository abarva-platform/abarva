import { getAuditedAnthropicClient } from "@/lib/agent/stream";
import { isExplicitVisualAsk } from "@/lib/intelligence/ask/synthesizer";
import {
  CHART_OUTPUT_CONTRACT,
  CONSULTANT_ANSWER_SHAPE_CONTRACT_TABLE,
  CONSULTANT_ANSWER_SHAPE_CONTRACT_RICH,
  isTrendAsk,
} from "@/lib/intelligence/ask/response-policy";
import {
  buildAgentGroundingDisclosure,
  formatUnsupportedClaimFlag,
  type AgentGroundingDisclosure,
} from "@/lib/intelligence/canonical/agent-grounding-disclosure";
import type {
  CanonicalConfidenceLevel,
  CanonicalIndustry,
  CanonicalSourceBasis,
  CanonicalStrategicMovePhase,
  CanonicalUnsupportedClaimFlag,
} from "@/lib/intelligence/canonical/industry-ai-pattern";
import type {
  CANONICAL_PATTERN_INDEX_SOURCE,
  CanonicalPatternIndexHit,
  CanonicalPatternIndexQuery,
  CanonicalPatternIndexResult,
  CanonicalPatternIndexStatus,
} from "@/lib/intelligence/canonical/runtime-pattern-index";
import type {
  PatternApplicableProgram,
  PatternManifestEntry,
} from "@/lib/intelligence/pattern-manifest";
import {
  getPatternApplicableProgramsForTenant,
  getPatternManifestEntriesWithMetrics,
  patternMatchesIndustry,
} from "@/lib/intelligence/pattern-manifest";
import type { NexusConfidence, Source } from "@/lib/intelligence/types";
import type { ProgramContextBundle } from "@/lib/programs/nexus";
import { AGENT_DEMO_SYSTEM_BLOCK } from "@/lib/agent/demo-context";

const STOPWORDS = new Set([
  "the",
  "and",
  "for",
  "with",
  "that",
  "this",
  "from",
  "what",
  "when",
  "where",
  "which",
  "will",
  "would",
  "could",
  "should",
  "into",
  "about",
  "there",
  "their",
  "have",
  "has",
  "your",
  "program",
  "plain",
  "english",
  "stop",
  "structured",
  "output",
  "need",
  "just",
  "show",
  "tell",
  "does",
  "than",
  "them",
  "walk",
  "through",
  "main",
  "risk",
]);

export interface ProgramsNexusTenantCtx {
  clientKey: string;
  clientName: string;
  industryCode: string | null;
  userId: string | null;
}

export interface ProgramsNexusCitation {
  slug: string;
  label: string;
  href: string;
  evidenceCount: number;
  observationCount: number;
  deliverableCount: number;
  freshnessLabel: string;
  confidence: number;
  confidenceBand: NexusConfidence;
  matchReason: string;
  sourceKind?: "canonical_pattern" | "manifest_pattern";
  canonicalId?: string;
  sourceBasis?: CanonicalSourceBasis;
  canonicalConfidenceLevel?: CanonicalConfidenceLevel;
  missingRequiredFields?: string[];
  missingProvenance?: boolean;
  unsupportedClaimFlags?: CanonicalUnsupportedClaimFlag[];
}

export interface ProgramsNexusTurnResponse {
  response: string;
  routeType: "llm" | "manifest_fallback";
  confidence: NexusConfidence;
  sparseEvidence: boolean;
  citations: ProgramsNexusCitation[];
  sources: Source[];
  suggestions: string[];
  activePatternSlug: string | null;
  patternEvidence: ProgramsNexusPatternEvidence;
  groundingDisclosure: AgentGroundingDisclosure;
}

export interface ProgramsNexusPatternEvidencePattern {
  canonicalId: string;
  title: string;
  summary: string;
  sourceBasis: CanonicalSourceBasis;
  confidenceLevel: CanonicalConfidenceLevel;
  confidenceRationale: string;
  missingRequiredFields: string[];
  missingProvenance: boolean;
  unsupportedClaimFlags: CanonicalUnsupportedClaimFlag[];
  sourceReferenceCount: number;
  matchReasons: string[];
}

export interface ProgramsNexusPatternEvidence {
  source: typeof CANONICAL_PATTERN_INDEX_SOURCE | null;
  status: CanonicalPatternIndexStatus | "not_requested";
  retrievedCount: number;
  warnings: string[];
  noMatch: boolean;
  missingEvidence: boolean;
  query: CanonicalPatternIndexQuery | null;
  patterns: ProgramsNexusPatternEvidencePattern[];
}

interface RankedPattern {
  pattern: PatternManifestEntry;
  score: number;
  confidence: number;
  confidenceBand: NexusConfidence;
  applicablePrograms: PatternApplicableProgram[];
  matchReason: string;
}

function normalizePatternKey(value: string | null | undefined): string | null {
  if (!value) return null;
  return value
    .trim()
    .toLowerCase()
    .replace(/^pattern[-_]/, "")
    .replace(/_/g, "-");
}

function formatFreshness(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "unknown";
  const days = Math.max(
    0,
    Math.round((Date.now() - date.getTime()) / 86_400_000),
  );
  if (days === 0) return "today";
  if (days === 1) return "1d";
  if (days < 30) return `${days}d`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function tokenize(value: string): string[] {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .map((token) => token.trim())
    .filter((token) => token.length >= 3 && !STOPWORDS.has(token));
}

function readStringList(value: unknown): string[] {
  if (typeof value === "string") return value.trim() ? [value.trim()] : [];
  if (!Array.isArray(value)) return [];

  return value.flatMap((entry) => {
    if (typeof entry === "string") return entry.trim() ? [entry.trim()] : [];
    if (!entry || typeof entry !== "object") return [];
    const record = entry as Record<string, unknown>;
    const title = typeof record.title === "string" ? record.title.trim() : "";
    const body = typeof record.body === "string" ? record.body.trim() : "";
    const text = [title, body].filter(Boolean).join(": ");
    return text ? [text] : [];
  });
}

function renderCitation(citation: ProgramsNexusCitation): string {
  return `[${citation.label}](${citation.href})`;
}

function programContextSource(context: ProgramContextBundle): Source {
  return {
    id: `program:${context.programId}`,
    type: "engagement",
    name: context.program.name,
    detail: [
      context.program.currentPhase === null
        ? "Phase unassigned"
        : `Phase ${context.program.currentPhase}`,
      `${context.deliverables.length} deliverables`,
      `${context.flags.length} open flags`,
    ].join(" · "),
    confidence: "high",
  };
}

function buildSource(citation: ProgramsNexusCitation): Source {
  const provenance =
    citation.sourceKind === "canonical_pattern"
      ? [
          `canonical confidence ${citation.canonicalConfidenceLevel ?? citation.confidenceBand}`,
          citation.sourceBasis ? `source basis ${citation.sourceBasis}` : null,
          citation.missingProvenance ? "missing provenance" : null,
          citation.missingRequiredFields?.length
            ? `missing ${citation.missingRequiredFields.join(", ")}`
            : null,
          citation.unsupportedClaimFlags?.length
            ? `${citation.unsupportedClaimFlags.length} unsupported claim flags`
            : null,
        ]
          .filter(Boolean)
          .join(" · ")
      : null;

  return {
    id: `pattern:${citation.slug}`,
    type: "pattern",
    name: citation.label,
    detail: [
      `${citation.evidenceCount} evidence sources`,
      `${citation.observationCount} observations`,
      `${citation.deliverableCount} tenant deliverables`,
      citation.matchReason,
      provenance,
    ]
      .filter(Boolean)
      .join(" · "),
    confidence: citation.confidenceBand,
    url: citation.href,
    asOf: citation.freshnessLabel,
  };
}

function matchProgramByName(
  applicablePrograms: PatternApplicableProgram[],
  programName: string,
): boolean {
  const normalizedProgram = programName.trim().toLowerCase();
  return applicablePrograms.some(
    (program) => program.name.trim().toLowerCase() === normalizedProgram,
  );
}

function estimateConfidence(
  score: number,
  floor: number | null,
  anchored: boolean,
): number {
  const retrievalScore = Math.min(1, score / (anchored ? 95 : 70));
  const floorScore = floor ?? 0.55;
  return Math.max(
    0.22,
    Math.min(0.95, floorScore * 0.55 + retrievalScore * 0.45),
  );
}

function confidenceBand(score: number): NexusConfidence {
  if (score >= 0.8) return "high";
  if (score >= 0.6) return "medium";
  return "low";
}

function buildCitation(ranked: RankedPattern): ProgramsNexusCitation {
  const deliverableCount = ranked.applicablePrograms.reduce(
    (sum, program) => sum + program.deliverables.length,
    0,
  );

  return {
    slug: ranked.pattern.slug,
    label: ranked.pattern.name,
    href: `/preview/intelligence/patterns/${encodeURIComponent(ranked.pattern.slug)}`,
    evidenceCount: ranked.pattern.evidenceCount,
    observationCount:
      ranked.pattern.observationCount || ranked.pattern.observations.length,
    deliverableCount,
    freshnessLabel: formatFreshness(ranked.pattern.lastUpdatedAt),
    confidence: ranked.confidence,
    confidenceBand: ranked.confidenceBand,
    matchReason: ranked.matchReason,
    sourceKind: "manifest_pattern",
  };
}

function canonicalConfidenceBand(
  value: CanonicalConfidenceLevel,
): NexusConfidence {
  switch (value) {
    case "validated":
    case "high":
      return "high";
    case "medium":
      return "medium";
    case "low":
      return "low";
  }
}

function canonicalConfidenceScore(
  value: CanonicalConfidenceLevel,
  retrievalScore: number,
): number {
  const base =
    value === "validated"
      ? 0.92
      : value === "high"
        ? 0.82
        : value === "medium"
          ? 0.66
          : 0.42;
  return Math.max(
    0.2,
    Math.min(0.97, Number((base * 0.75 + retrievalScore * 0.25).toFixed(2))),
  );
}

function canonicalHref(canonicalId: string): string {
  return `/intelligence/patterns?canonicalId=${encodeURIComponent(canonicalId)}`;
}

function buildCanonicalCitation(
  hit: CanonicalPatternIndexHit,
): ProgramsNexusCitation {
  const missingRequiredFields = hit.missing_required_fields.map(String);
  return {
    slug: hit.canonical_id,
    label: hit.title,
    href: canonicalHref(hit.canonical_id),
    evidenceCount: hit.source_references.length,
    observationCount: 0,
    deliverableCount: 0,
    freshnessLabel: "canonical corpus",
    confidence: canonicalConfidenceScore(hit.confidence_level, hit.score),
    confidenceBand: canonicalConfidenceBand(hit.confidence_level),
    matchReason: `canonical corpus match · ${hit.match_reasons.join(", ")}`,
    sourceKind: "canonical_pattern",
    canonicalId: hit.canonical_id,
    sourceBasis: hit.source_basis,
    canonicalConfidenceLevel: hit.confidence_level,
    missingRequiredFields,
    missingProvenance: hit.missing_provenance,
    unsupportedClaimFlags: hit.unsupported_claim_flags,
  };
}

function buildPatternEvidence(
  canonicalPatternIndex: CanonicalPatternIndexResult | null | undefined,
): ProgramsNexusPatternEvidence {
  if (!canonicalPatternIndex) {
    return {
      source: null,
      status: "not_requested",
      retrievedCount: 0,
      warnings: [],
      noMatch: false,
      missingEvidence: false,
      query: null,
      patterns: [],
    };
  }

  const patterns = canonicalPatternIndex.patterns.map((pattern) => ({
    canonicalId: pattern.canonical_id,
    title: pattern.title,
    summary: pattern.summary,
    sourceBasis: pattern.source_basis,
    confidenceLevel: pattern.confidence_level,
    confidenceRationale: pattern.confidence_rationale,
    missingRequiredFields: pattern.missing_required_fields.map(String),
    missingProvenance: pattern.missing_provenance,
    unsupportedClaimFlags: pattern.unsupported_claim_flags,
    sourceReferenceCount: pattern.source_references.length,
    matchReasons: pattern.match_reasons,
  }));

  return {
    source: canonicalPatternIndex.source,
    status: canonicalPatternIndex.status,
    retrievedCount: patterns.length,
    warnings: canonicalPatternIndex.warnings,
    noMatch:
      canonicalPatternIndex.status === "empty" ||
      canonicalPatternIndex.status === "no_match" ||
      canonicalPatternIndex.status === "error",
    missingEvidence: patterns.some(
      (pattern) =>
        pattern.missingProvenance ||
        pattern.missingRequiredFields.length > 0 ||
        pattern.unsupportedClaimFlags.length > 0,
    ),
    query: canonicalPatternIndex.filters_applied,
    patterns,
  };
}

function buildNexusGroundingDisclosure(
  patternEvidence: ProgramsNexusPatternEvidence,
): AgentGroundingDisclosure {
  return buildAgentGroundingDisclosure({
    source: patternEvidence.source,
    status: patternEvidence.status,
    warnings: patternEvidence.warnings,
    patterns: patternEvidence.patterns.map((pattern) => ({
      canonicalId: pattern.canonicalId,
      title: pattern.title,
      sourceBasis: pattern.sourceBasis,
      confidenceLevel: pattern.confidenceLevel,
      confidenceRationale: pattern.confidenceRationale,
      sourceReferenceCount: pattern.sourceReferenceCount,
      missingRequiredFields: pattern.missingRequiredFields,
      missingProvenance: pattern.missingProvenance,
      unsupportedClaimFlags: pattern.unsupportedClaimFlags.map(
        formatUnsupportedClaimFlag,
      ),
      matchReasons: pattern.matchReasons,
    })),
  });
}

function missingEvidenceLine(
  patternEvidence: ProgramsNexusPatternEvidence,
): string | null {
  if (patternEvidence.noMatch) {
    const status =
      patternEvidence.status === "error"
        ? "read failed"
        : patternEvidence.status.replace(/_/g, " ");
    return `Canonical pattern evidence status: ${status}. I will not infer a canonical pattern where the index did not return one.`;
  }

  const missing = patternEvidence.patterns
    .filter(
      (pattern) =>
        pattern.missingProvenance ||
        pattern.missingRequiredFields.length > 0 ||
        pattern.unsupportedClaimFlags.length > 0,
    )
    .map((pattern) => {
      const gaps = [
        pattern.missingProvenance ? "missing provenance" : null,
        pattern.missingRequiredFields.length
          ? `missing fields: ${pattern.missingRequiredFields.join(", ")}`
          : null,
        pattern.unsupportedClaimFlags.length
          ? `${pattern.unsupportedClaimFlags.length} unsupported claim flags`
          : null,
      ]
        .filter(Boolean)
        .join("; ");
      return `${pattern.title} (${gaps})`;
    });

  return missing.length > 0
    ? `Canonical pattern evidence has gaps: ${missing.join(" · ")}. I will keep those claims directional.`
    : null;
}

function scorePattern(args: {
  pattern: PatternManifestEntry;
  message: string;
  context: ProgramContextBundle;
  clientKey: string;
  anchorKey: string | null;
}): RankedPattern {
  const normalizedMessage = args.message.toLowerCase();
  const queryTokens = tokenize(args.message);
  const applicablePrograms = getPatternApplicableProgramsForTenant(
    args.pattern.slug,
    args.clientKey,
  );
  const hasProgramMatch = matchProgramByName(
    applicablePrograms,
    args.context.program.name,
  );
  const patternAnchorKey = normalizePatternKey(
    (args.context.patternPreload?.topic_key as string | undefined) ?? null,
  );
  const isAnchored =
    args.anchorKey !== null &&
    normalizePatternKey(args.pattern.slug) === args.anchorKey;
  const isPreloadedAnchor =
    patternAnchorKey !== null &&
    normalizePatternKey(args.pattern.slug) === patternAnchorKey;

  const patternText = [
    args.pattern.name,
    args.pattern.slug,
    args.pattern.category ?? "",
    args.pattern.shortDescription ?? "",
    args.pattern.longDescription ?? "",
    args.pattern.triggerSymptoms.join(" "),
    args.pattern.detectionSignals.join(" "),
    args.pattern.diagnosticQuestions.join(" "),
    args.pattern.interventions.join(" "),
    args.pattern.observations.join(" "),
    args.pattern.sections
      .map((section) => `${section.title} ${section.body}`)
      .join(" "),
  ]
    .join(" ")
    .toLowerCase();

  const preloadSignals = [
    ...readStringList(args.context.patternPreload?.failure_modes),
    ...readStringList(args.context.patternPreload?.diagnostic_questions),
    ...readStringList(args.context.patternPreload?.success_signals),
  ]
    .join(" ")
    .toLowerCase();

  const flagText = args.context.flags
    .map((flag) => `${flag.headline} ${flag.severity}`)
    .join(" ")
    .toLowerCase();

  const deliverableText = args.context.deliverables
    .map(
      (deliverable) =>
        `${deliverable.title} ${deliverable.typeKey} ${deliverable.status}`,
    )
    .join(" ")
    .toLowerCase();

  let score = 0;
  let matchReason = "semantic proximity to the current program ask";

  if (isAnchored || isPreloadedAnchor) {
    score += 48;
    matchReason = "active program pattern anchor";
  }

  if (
    normalizedMessage.includes(args.pattern.slug.toLowerCase()) ||
    normalizedMessage.includes(args.pattern.name.toLowerCase())
  ) {
    score += 28;
    matchReason = "pattern named directly in the user query";
  }

  for (const token of queryTokens) {
    if (patternText.includes(token)) score += 7;
    if (preloadSignals.includes(token)) score += 5;
    if (flagText.includes(token) && patternText.includes(token)) score += 6;
    if (deliverableText.includes(token) && patternText.includes(token))
      score += 4;
  }

  if (
    /(assumption|assumptions|confidence|interval|derive|derivation|range|estimate|math)/i.test(
      args.message,
    )
  ) {
    score += args.pattern.evidenceCount > 0 ? 12 : -4;
  }

  if (
    /(risk|blocker|pressure|concern|stall|slip|contradiction|red flag|why)/i.test(
      args.message,
    )
  ) {
    score += args.pattern.triggerSymptoms.length > 0 ? 10 : 0;
  }

  if (
    /(next step|what should|move next|recommend|do now|how do we proceed|what now)/i.test(
      args.message,
    )
  ) {
    score += args.pattern.interventions.length > 0 ? 8 : 0;
  }

  if (
    args.context.flags.length > 0 &&
    args.pattern.detectionSignals.length > 0
  ) {
    score += 6;
  }

  if ((score > 0 || isAnchored || isPreloadedAnchor) && hasProgramMatch) {
    score += 12;
    matchReason =
      isAnchored || isPreloadedAnchor
        ? matchReason
        : "tenant program precedent for this exact program family";
  } else if (score > 0 && applicablePrograms.length > 0) {
    score += 6;
  }

  if (score > 0 && args.pattern.demoCritical) {
    score += 3;
  }

  const confidence = estimateConfidence(
    score,
    args.pattern.confidenceFloor,
    isAnchored || isPreloadedAnchor,
  );

  return {
    pattern: args.pattern,
    score,
    confidence,
    confidenceBand: confidenceBand(confidence),
    applicablePrograms,
    matchReason,
  };
}

function buildSparseResponse(args: {
  context: ProgramContextBundle;
  citations: ProgramsNexusCitation[];
  patternEvidence: ProgramsNexusPatternEvidence;
}): string {
  const primary = args.citations[0];
  const programPhase =
    args.context.program.currentPhase === null
      ? "an unassigned phase"
      : `Phase ${args.context.program.currentPhase}`;
  const evidenceLine = missingEvidenceLine(args.patternEvidence);

  if (!primary) {
    return [
      `Evidence is thin for this question inside ${args.context.program.name}. I can see the program is sitting in ${programPhase} with ${args.context.deliverables.length} deliverables and ${args.context.flags.length} open flags, but the current retrieval pass did not return a pattern I can cite honestly.`,
      evidenceLine,
      `Next step: point me at the exact deliverable, estimate, or decision you want pressure-tested and I will stay explicit about what is evidence versus what is still an assumption.`,
    ]
      .filter(Boolean)
      .join("\n\n");
  }

  return [
    `Evidence is thin beyond ${renderCitation(primary)}. That pattern is the best available anchor for ${args.context.program.name}, but the live program context still looks lighter than a measured-outcomes case.`,
    evidenceLine,
    `Next step: give me the specific assumption chain or deliverable you want to interrogate, and I will tell you what supports it versus what still needs proof.`,
  ]
    .filter(Boolean)
    .join("\n\n");
}

function buildFollowUps(
  citations: ProgramsNexusCitation[],
  query: string,
): string[] {
  const primary = citations[0];
  const secondary = citations[1];
  if (!primary) {
    return [
      "Show me the assumption stack you want pressure-tested first",
      "Point me at the deliverable or estimate behind this question",
    ];
  }

  if (
    /(assumption|assumptions|confidence|interval|range|estimate)/i.test(query)
  ) {
    return [
      `Pressure-test the assumptions behind ${primary.label}`,
      `Show me what would change confidence on ${primary.label}`,
    ];
  }

  if (/(risk|blocker|pressure|concern|stall|slip|red flag)/i.test(query)) {
    return [
      `Show me the biggest failure mode inside ${primary.label}`,
      secondary
        ? `Compare ${primary.label} with ${secondary.label}`
        : `Show me the next-best pattern after ${primary.label}`,
    ];
  }

  return [
    `Tell me what to challenge next in ${primary.label}`,
    secondary
      ? `Open the adjacent pattern: ${secondary.label}`
      : `Show me the evidence behind ${primary.label}`,
  ];
}

function buildStructuredResponse(args: {
  message: string;
  context: ProgramContextBundle;
  citations: ProgramsNexusCitation[];
  sparseEvidence: boolean;
  patternEvidence: ProgramsNexusPatternEvidence;
}): string {
  const [primary, secondary] = args.citations;
  if (!primary) return buildSparseResponse(args);
  const evidenceLine = missingEvidenceLine(args.patternEvidence);

  const leadSignal =
    readStringList(args.context.patternPreload?.failure_modes)[0] ??
    readStringList(args.context.patternPreload?.diagnostic_questions)[0] ??
    "the unresolved operating assumption stack";
  const diagnosticQuestion =
    readStringList(args.context.patternPreload?.diagnostic_questions)[0] ??
    "Which assumption, if wrong, would collapse the current plan fastest?";
  const nextPattern = secondary
    ? `${renderCitation(secondary)} is the adjacent pattern I would keep open if the problem spills beyond one workstream.`
    : "I would stay anchored on the first pattern until the evidence forces a second explanation.";

  if (
    /(plain english|stop the structured output|just tell me|plainly)/i.test(
      args.message,
    )
  ) {
    return [
      `Plain English: I would anchor this on ${renderCitation(primary)}. The load-bearing issue is ${leadSignal.toLowerCase()}, and I would not pretend the current program context proves more than it does.`,
      evidenceLine,
      `${args.sparseEvidence ? "Evidence is thin beyond that anchor." : `The evidence base behind that anchor is ${primary.evidenceCount} sources and ${primary.observationCount} observations.`} The next question that will move the answer most is "${diagnosticQuestion}"`,
    ]
      .filter(Boolean)
      .join("\n\n");
  }

  if (
    /(assumption|assumptions|confidence|interval|derive|derivation|range|estimate|math)/i.test(
      args.message,
    )
  ) {
    return [
      `1. Best anchor: ${renderCitation(primary)} is the closest pattern I can cite for ${args.context.program.name}. Confidence is ${primary.confidenceBand} because the live program context shows ${args.context.deliverables.length} deliverables and ${args.context.flags.length} open flags, but not a fully exposed derivation chain.`,
      `2. What underpins the range: the pattern says the pressure usually sits in ${leadSignal.toLowerCase()}. I have ${primary.evidenceCount} sources and ${primary.observationCount} observations behind that anchor, which is enough to frame the assumption stack but not enough to call it measured customer-outcome evidence.${evidenceLine ? ` ${evidenceLine}` : ""}`,
      `3. What I would test next: answer "${diagnosticQuestion}" before treating the range as board-ready. ${nextPattern}`,
    ].join("\n\n");
  }

  if (
    /(risk|blocker|pressure|concern|stall|slip|contradiction|red flag|why)/i.test(
      args.message,
    )
  ) {
    return [
      `1. Load-bearing risk: ${renderCitation(primary)} is the pattern that best explains the pressure here. The first signal I would hold onto is ${leadSignal.toLowerCase()}.`,
      `2. What that means: ${args.sparseEvidence ? "evidence is still thin, so I would treat this as a pressure-tested hypothesis, not settled fact." : `this is grounded in ${primary.evidenceCount} sources and ${primary.observationCount} observations, but it is still authored/composite evidence rather than measured customer outcomes.`}${evidenceLine ? ` ${evidenceLine}` : ""}`,
      `3. Next move: put "${diagnosticQuestion}" in front of the sponsor or workstream lead this turn. ${nextPattern}`,
    ].join("\n\n");
  }

  return [
    `1. Best anchor: ${renderCitation(primary)} is the most relevant pattern for this ask in ${args.context.program.name}.`,
    `2. What I would pressure-test: ${leadSignal}. ${args.sparseEvidence ? "Evidence is thin beyond this anchor, so I would keep the claim directional." : `The support behind it is ${primary.evidenceCount} sources and ${primary.observationCount} observations, still mostly authored/composite rather than measured outcomes.`}${evidenceLine ? ` ${evidenceLine}` : ""}`,
    `3. Concrete next step: force an answer to "${diagnosticQuestion}" before you lock scope, funding, or delivery commitments. ${nextPattern}`,
  ].join("\n\n");
}

async function synthesizeWithClaude(args: {
  message: string;
  ctx: ProgramsNexusTenantCtx;
  context: ProgramContextBundle;
  citations: ProgramsNexusCitation[];
  sparseEvidence: boolean;
  patternEvidence: ProgramsNexusPatternEvidence;
}): Promise<string | null> {
  if (
    process.env.NODE_ENV === "test" ||
    !process.env.ANTHROPIC_API_KEY ||
    args.citations.length === 0
  ) {
    return null;
  }

  const userPayload = JSON.stringify(
    {
      tenant: args.ctx.clientName,
      program: args.context.program,
      modules: args.context.modules,
      deliverables: args.context.deliverables,
      flags: args.context.flags,
      sparseEvidence: args.sparseEvidence,
      canonicalPatternEvidence: args.patternEvidence,
      question: args.message,
      citationRegistry: args.citations.map((citation) => ({
        label: citation.label,
        markdown: renderCitation(citation),
        evidenceCount: citation.evidenceCount,
        observationCount: citation.observationCount,
        matchReason: citation.matchReason,
        sourceKind: citation.sourceKind,
        sourceBasis: citation.sourceBasis,
        confidenceLevel: citation.canonicalConfidenceLevel,
        missingRequiredFields: citation.missingRequiredFields,
        missingProvenance: citation.missingProvenance,
        unsupportedClaimFlags: citation.unsupportedClaimFlags,
      })),
    },
    null,
    2,
  );
  const visualAsk = isExplicitVisualAsk(args.message);
  const trendAsk = isTrendAsk(args.message);
  const shapeContract = visualAsk
    ? CONSULTANT_ANSWER_SHAPE_CONTRACT_TABLE
    : CONSULTANT_ANSWER_SHAPE_CONTRACT_RICH;
  const system = [
    "You are Ava, the Programs-zone orchestration agent for the AbarVa platform.",
    "Use only the provided composition and context. Do not invent program state, evidence, or gate decisions.",
    "Stay direct, structured, and specific. Never flatter the user.",
    "Use the provided markdown citations verbatim.",
    'If sparseEvidence is true, say "Evidence is thin" in the first sentence.',
    "If canonicalPatternEvidence.noMatch or missingEvidence is true, surface that limitation explicitly and do not fill gaps with invented pattern evidence.",
    "Be explicit that most support here is authored/composite unless the composition says otherwise.",
    "Close with one concrete next step.",
    shapeContract,
    CHART_OUTPUT_CONTRACT,
    AGENT_DEMO_SYSTEM_BLOCK,
  ].join("\n");
  const { client } = await getAuditedAnthropicClient({
    tenantId: args.ctx.clientKey,
    userId: args.ctx.userId ?? undefined,
    workflow: "programs-nexus-free-text",
    model: process.env.NEXUS_COMPOSER_MODEL ?? "claude-opus-4-7",
    prompt: [system, userPayload].join("\n\n"),
    dataClass: "confidential",
    metadata: { clientKey: args.ctx.clientKey },
  });
  const result = await client.messages.create({
    model: process.env.NEXUS_COMPOSER_MODEL ?? "claude-opus-4-7",
    max_tokens: visualAsk ? 700 : trendAsk ? 600 : 380,
    system,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: userPayload,
          },
        ],
      },
    ],
  });

  const response = result.content
    .filter((item) => item.type === "text")
    .map((item) => item.text)
    .join("\n")
    .trim();

  if (!response) return null;
  const hasKnownCitation = args.citations.some(
    (citation) =>
      response.includes(citation.href) || response.includes(citation.label),
  );
  return hasKnownCitation ? response : null;
}

export async function runProgramsNexusTurn(args: {
  ctx: ProgramsNexusTenantCtx;
  message: string;
  context: ProgramContextBundle;
  canonicalPatternIndex?: CanonicalPatternIndexResult | null;
}): Promise<ProgramsNexusTurnResponse> {
  const patternEvidence = buildPatternEvidence(args.canonicalPatternIndex);
  const groundingDisclosure = buildNexusGroundingDisclosure(patternEvidence);
  const canonicalCitations =
    args.canonicalPatternIndex?.status === "ready"
      ? args.canonicalPatternIndex.patterns
          .slice(0, 3)
          .map(buildCanonicalCitation)
      : [];
  const patterns = getPatternManifestEntriesWithMetrics(
    args.ctx.clientKey,
  ).filter((pattern) => patternMatchesIndustry(pattern, args.ctx.industryCode));
  const anchorKey = normalizePatternKey(
    (args.context.patternPreload?.topic_key as string | undefined) ?? null,
  );

  const rankedPatterns = patterns
    .map((pattern) =>
      scorePattern({
        pattern,
        message: args.message,
        context: args.context,
        clientKey: args.ctx.clientKey,
        anchorKey,
      }),
    )
    .filter(
      (entry) =>
        entry.score > 0 ||
        normalizePatternKey(entry.pattern.slug) === anchorKey,
    )
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);

  const canonicalLabels = new Set(
    canonicalCitations.map((citation) => citation.label.trim().toLowerCase()),
  );
  const citations = [
    ...canonicalCitations,
    ...rankedPatterns
      .map((entry) => buildCitation(entry))
      .filter(
        (citation) => !canonicalLabels.has(citation.label.trim().toLowerCase()),
      ),
  ].slice(0, 3);
  const sparseEvidence =
    citations.filter((citation) => citation.confidence >= 0.6).length < 3 ||
    patternEvidence.noMatch ||
    patternEvidence.missingEvidence;
  const fallback = buildStructuredResponse({
    message: args.message,
    context: args.context,
    citations,
    sparseEvidence,
    patternEvidence,
  });

  const llmText = await synthesizeWithClaude({
    message: args.message,
    ctx: args.ctx,
    context: args.context,
    citations,
    sparseEvidence,
    patternEvidence,
  }).catch(() => null);

  const response = llmText ?? fallback;
  const routeType = llmText ? "llm" : "manifest_fallback";
  const confidence = citations[0]?.confidenceBand ?? "low";
  const sources = [
    programContextSource(args.context),
    ...citations.map(buildSource),
  ];

  return {
    response,
    routeType,
    confidence,
    sparseEvidence,
    citations,
    sources,
    suggestions: buildFollowUps(citations, args.message),
    activePatternSlug: citations[0]?.slug ?? anchorKey,
    patternEvidence,
    groundingDisclosure,
  };
}

export function normalizeProgramsNexusCanonicalIndustry(
  value: string | null | undefined,
): CanonicalIndustry | undefined {
  const normalized = value
    ?.trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
  if (!normalized) return undefined;
  if (normalized.includes("retail")) return "retail";
  if (
    normalized.includes("medtech") ||
    normalized.includes("medical_device") ||
    normalized.includes("clinical_technolog")
  ) {
    return "healthcare_medtech";
  }
  if (
    normalized.includes("health") ||
    normalized === "hc" ||
    normalized.includes("provider")
  )
    return "healthcare_provider";
  if (normalized.includes("fin") || normalized.includes("bank"))
    return "financial_services_banking";
  if (
    normalized.includes("airline") ||
    normalized.includes("aviation") ||
    normalized.includes("skyharbor")
  )
    return "airline";
  if (normalized.includes("energy")) return "energy";
  if (normalized.includes("public") || normalized.includes("government"))
    return "public_sector";
  return undefined;
}

export function mapProgramPhaseToCanonicalMovePhase(
  phase: number | null | undefined,
): CanonicalStrategicMovePhase | undefined {
  switch (phase) {
    case 0:
      return "originate";
    case 1:
      return "charter";
    case 2:
      return "diagnose_discover";
    case 3:
      return "design";
    case 4:
      return "roadmap_business_case_change_value_plan";
    case 5:
      return "mobilize_handoff";
    default:
      return undefined;
  }
}

export function buildProgramsNexusCanonicalPatternQuery(args: {
  ctx: ProgramsNexusTenantCtx;
  context: ProgramContextBundle;
  message: string;
  clientId?: string | null;
}): CanonicalPatternIndexQuery {
  const patternPreloadTitle =
    typeof args.context.patternPreload?.title === "string"
      ? args.context.patternPreload.title
      : "";
  const patternPreloadKey =
    typeof args.context.patternPreload?.topic_key === "string"
      ? args.context.patternPreload.topic_key
      : "";
  const evidenceTerms = [
    args.message,
    args.context.program.name,
    args.context.program.archetype ?? "",
    patternPreloadTitle,
    patternPreloadKey,
    ...args.context.flags.map((flag) => flag.headline),
    ...args.context.deliverables.map(
      (deliverable) => `${deliverable.title} ${deliverable.typeKey}`,
    ),
  ]
    .join(" ")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return {
    tenant_key: args.ctx.clientKey,
    client_id: args.clientId ?? undefined,
    industry: normalizeProgramsNexusCanonicalIndustry(args.ctx.industryCode),
    strategic_move_phase: mapProgramPhaseToCanonicalMovePhase(
      args.context.program.currentPhase,
    ),
    query: evidenceTerms || args.message,
    limit: 3,
  };
}
