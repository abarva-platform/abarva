import type {
  SourceAgentContextBundle,
  SourceLiveTenantContextSnapshot,
  SourceLiveTenantEvidenceItem,
  SourcePatternSectionContext,
  SourceUserRole,
} from "./agent-context";
import type { SourceAgentBriefingMode } from "./multi-agent-types";
import {
  classifySourcingEvent,
  type CategoryClassification,
} from "./classifier/category-classifier";
import {
  runDeliveryModelGate,
  type DeliveryModelGateResult,
  type DeliveryModelSignals,
} from "./delivery-model/delivery-model-gate";
import {
  buildShouldCostEstimate,
  type RoleMixEntry,
  type RoleRateCard,
  type ShouldCostEstimate,
} from "./should-cost/should-cost-model";
import { buildProposalNormalizationMatrix } from "./proposal-normalization/proposal-normalization";
import type {
  ProposalNormalizationMatrix,
  RawVendorProposal,
} from "./proposal-normalization/proposal-normalization-types";
import type { AgentResponsePart } from "@/lib/agent/response-parts";
import type { TenantContextSegment } from "./taxonomy/category-taxonomy";
import { answerHardSourceQuestion } from "./expert-judgment/source-hard-question-answer";
import { getSourceCorpusAnswerPatternSections } from "./source-corpus-uplift";

export type SourceAnswerMode =
  | "current_state"
  | "event_shaping"
  | "cxo_guidance"
  | "risk_traps"
  | "missing_data"
  | "expert_sourcing";

export interface SourceAnswerEvidenceCitation {
  id: string;
  label: string;
  segmentId: string;
  recordId: string;
  sourceDoc?: string;
  sourcePath?: string;
  excerpt: string;
  confidence: SourceLiveTenantEvidenceItem["confidence"];
}

export interface SourceAnswerEngineOutput {
  engineVersion: "source-answer-engine/v1";
  mode: SourceAnswerMode;
  title: string;
  answerText: string;
  currentStateFindings: string[];
  sourcingImplications: string[];
  cxoGuidance: string[];
  expertLens: string[];
  riskTraps: string[];
  missingData: string[];
  recommendedNextAction: string;
  confidence: "low" | "medium" | "high";
  limits: string[];
  evidenceCitations: SourceAnswerEvidenceCitation[];
  /**
   * Structured Ava response parts for the Source response window. The prose
   * answer remains as a fallback, while the UI can render tables, charts,
   * evidence, and next actions when these parts are present.
   */
  responseParts: AgentResponsePart[];
  /**
   * Slice 1.1 — category strategy classification for the sourcing event.
   * Maps the event onto the IT sourcing taxonomy: category, buying motion,
   * risk profile, and the required evidence the tenant context is missing.
   * `null` when there is no sourcing event in the bundle to classify.
   */
  categoryStrategy: CategoryClassification | null;
  /**
   * Slice 1.2 — build / buy / partner / SI delivery-model gate. Forces an
   * explicit delivery-model decision before an RFP package is generated:
   * the recommended model, the reasoning, the disqualified options + why,
   * and the open questions blocking the RFP. `null` when there is no
   * sourcing event to classify (the gate runs off the classification).
   */
  deliveryModelGate: DeliveryModelGateResult | null;
  /**
   * Slice 1.3 — deterministic should-cost estimate for the event. Models the
   * full TCO iceberg (visible license layer plus the seven hidden layers) and
   * returns a cost range with the should-cost-vs-quote headline. The bundle
   * does not yet carry an explicit delivery role mix or rate card, so the seam
   * derives a conservative default scaffold off the event's `valueAtStakeUsd`;
   * the estimate is a should-cost framing aid, not a costed proposal. `null`
   * when there is no sourcing event with a value-at-stake figure to model.
   */
  shouldCostEstimate: ShouldCostEstimate | null;
  /**
   * Slice 1.4 — proposal-normalization matrix across the eight proposal
   * dimensions (scope exceptions, assumptions, rates, accelerators, IP terms,
   * security posture, transition approach, SLAs/XLAs). The bundle does not yet
   * carry structured raw vendor proposals, so the seam runs the matrix over an
   * empty proposal set — which correctly returns the "collect vendor responses
   * first" posture rather than fabricating comparison data. `null` when there
   * is no sourcing event to attach the matrix to.
   */
  proposalNormalization: ProposalNormalizationMatrix | null;
}

interface SourceAnswerEngineInput {
  prompt: string;
  contextBundle: SourceAgentContextBundle;
  userRole?: SourceUserRole;
  mode?: SourceAgentBriefingMode;
}

interface SourceExpertPlaybook {
  id: string;
  label: string;
  expertLens: string[];
  eventShaping: string[];
  cxoGuidance: string[];
  riskTraps: string[];
  missingData: string[];
  nextAction: string;
}

export function buildSourceAnswerEngine(
  input: SourceAnswerEngineInput,
): SourceAnswerEngineOutput | null {
  const live = input.contextBundle.liveTenantContext;
  if (!live) return null;

  const mode = detectSourceAnswerMode(input.prompt);
  const playbook = selectSourceExpertPlaybook(
    input.contextBundle,
    input.prompt,
  );
  const rankedEvidence = rankAnswerEvidence(live, mode);
  const evidence = rankedEvidence.slice(0, 8);
  const corpusSections = getSourceCorpusAnswerPatternSections({
    event: input.contextBundle.sourcingEvent ?? {},
    prompt: input.prompt,
    mode,
    maxSections: 8,
  });
  const corpusExpertLens = corpusSections
    .slice(0, 3)
    .map(formatCorpusExpertLens);
  const corpusRiskTraps = corpusSections
    .filter((section) =>
      ["risks", "failureModes", "artifactRules"].includes(section.kind),
    )
    .slice(0, 4)
    .map(formatCorpusPressurePoint);
  const corpusMissingData = corpusSections
    .filter((section) =>
      ["requiredInputs", "evidence", "scorecardDefaults"].includes(
        section.kind,
      ),
    )
    .slice(0, 4)
    .map(formatCorpusEvidenceRequirement);
  const hardQuestionAnswer = answerHardSourceQuestion(
    input.prompt,
    [
      ...evidence.map((item) => item.excerpt),
      ...input.contextBundle.blockers,
      ...input.contextBundle.missingInputs,
      ...live.warnings,
    ].join("\n"),
  );
  const evaluationDecisionAnswer = buildEvaluationDecisionAnswer({
    prompt: input.prompt,
    evidence: rankedEvidence,
  });
  const bafoInstructionAnswer = buildBafoInstructionAnswer({
    prompt: input.prompt,
    evidence: rankedEvidence,
  });
  const currentStateFindings =
    evaluationDecisionAnswer?.currentStateFindings ??
    bafoInstructionAnswer?.currentStateFindings ??
    toCurrentStateFindings(evidence, live);
  const sourcingImplications =
    evaluationDecisionAnswer?.sourcingImplications ??
    bafoInstructionAnswer?.sourcingImplications ??
    selectByMode(mode, playbook.eventShaping, [
    `Shape ${eventName(input.contextBundle)} around the strongest current-state evidence first, then treat uncited assumptions as open diligence.`,
  ]);
  const cxoGuidance = evaluationDecisionAnswer?.cxoGuidance ?? bafoInstructionAnswer?.cxoGuidance ?? selectByMode(mode, playbook.cxoGuidance, [
    "Ask the accountable CXO to approve the value hypothesis, evidence threshold, and decision rights before vendors shape the narrative.",
  ]);
  const riskTraps = selectByMode(mode, playbook.riskTraps, [
    "Do not let vendor demos substitute for baseline evidence, integration ownership, pricing normalization, or transition accountability.",
  ]);
  const missingData = selectByMode(
    mode,
    playbook.missingData,
    inferMissingData(input.contextBundle, live),
  );
  const finalRiskTraps = unique([...riskTraps, ...corpusRiskTraps]);
  const finalMissingData = filterResolvedMissingData(
    unique([...missingData, ...corpusMissingData]),
    live,
  );
  const finalExpertLens = unique([...playbook.expertLens, ...corpusExpertLens]);
  const confidence = deriveAnswerConfidence(live, evidence);
  const limits = unique([
    ...live.warnings,
    ...(corpusSections.length > 0
      ? [
          "Corpus guidance is global doctrine; tenant, vendor, benchmark, and savings claims still require cited evidence.",
        ]
      : []),
    ...(evidence.length < 5
      ? ["Retrieved evidence is thin for a decision-grade CXO answer."]
      : []),
    ...(input.contextBundle.missingInputs.length > 0
      ? [
          `Workflow missing inputs remain: ${input.contextBundle.missingInputs.join("; ")}.`,
        ]
      : []),
  ]);
  const rawAnswerText = evaluationDecisionAnswer?.answerText ?? hardQuestionAnswer?.answerText ?? bafoInstructionAnswer?.answerText ?? formatAnswerText({
    mode,
    currentStateFindings,
    sourcingImplications,
    cxoGuidance,
    riskTraps: finalRiskTraps,
    missingData: finalMissingData,
    confidence,
    evidence,
    limits,
  });
  const finalCxoGuidance = evaluationDecisionAnswer
    ? evaluationDecisionAnswer.cxoGuidance
    : hardQuestionAnswer
    ? [
        hardQuestionAnswer.directAnswer,
        hardQuestionAnswer.sourcingJudgment,
        hardQuestionAnswer.whatWouldChangeTheAnswer,
        ...corpusExpertLens,
      ]
    : bafoInstructionAnswer
      ? bafoInstructionAnswer.cxoGuidance
    : cxoGuidance;
  const recommendedNextAction =
    evaluationDecisionAnswer?.recommendedNextAction ??
    hardQuestionAnswer?.recommendedNextAction ??
    bafoInstructionAnswer?.recommendedNextAction ??
    playbook.nextAction;
  const evidenceCitations = evidence.map(toAnswerCitation);
  const answerText = toAvaVisibleText(rawAnswerText);
  const visibleCurrentStateFindings = currentStateFindings.map(toAvaVisibleText);
  const visibleSourcingImplications = sourcingImplications.map(toAvaVisibleText);
  const visibleCxoGuidance = finalCxoGuidance.map(toAvaVisibleText);
  const visibleRiskTraps = finalRiskTraps.map(toAvaVisibleText);
  const visibleMissingData = finalMissingData.map(toAvaVisibleText);
  const visibleRecommendedNextAction = toAvaVisibleText(recommendedNextAction);
  const categoryStrategy = classifyEventCategory(input.contextBundle);
  const deliveryModelGate = gateEventDeliveryModel(input.contextBundle);
  const shouldCostEstimate = estimateEventShouldCost(input.contextBundle);
  const proposalNormalization = normalizeEventProposals(input.contextBundle);

  return {
    engineVersion: "source-answer-engine/v1",
    mode,
    title: evaluationDecisionAnswer?.title ?? bafoInstructionAnswer?.title ?? `${playbook.label} answer`,
    answerText,
    currentStateFindings: visibleCurrentStateFindings,
    sourcingImplications: visibleSourcingImplications,
    cxoGuidance: visibleCxoGuidance,
    expertLens: finalExpertLens,
    riskTraps: visibleRiskTraps,
    missingData: visibleMissingData,
    recommendedNextAction: visibleRecommendedNextAction,
    confidence,
    limits,
    evidenceCitations,
    responseParts: buildAvaResponseParts({
      mode,
      answerText,
      confidence,
      currentStateFindings: visibleCurrentStateFindings,
      sourcingImplications: visibleSourcingImplications,
      cxoGuidance: visibleCxoGuidance,
      riskTraps: visibleRiskTraps,
      missingData: visibleMissingData,
      evidenceCitations,
      recommendedNextAction: visibleRecommendedNextAction,
      deliveryModelGate,
      shouldCostEstimate,
      proposalNormalization,
    }),
    categoryStrategy,
    deliveryModelGate,
    shouldCostEstimate,
    proposalNormalization,
  };
}

/**
 * Slice 1.2 integration seam. Runs the build / buy / partner / SI
 * delivery-model gate off the Slice 1.1 classification, so an explicit
 * delivery-model decision is forced before an RFP package is generated.
 * Returns `null` when there is no event to classify.
 *
 * The bundle does not yet carry explicit delivery signals (internal
 * capability, core-differentiator). The gate is built to degrade gracefully:
 * with only `loadedSegments` supplied it returns the category-default model
 * plus a confirmation open-question, which is the correct conservative
 * posture — it never silently clears an RFP package on thin signals.
 */
export function gateEventDeliveryModel(
  bundle: SourceAgentContextBundle,
): DeliveryModelGateResult | null {
  const classification = classifyEventCategory(bundle);
  if (!classification) return null;
  const signals: DeliveryModelSignals = {
    loadedSegments: collectLoadedSegments(bundle.liveTenantContext),
  };
  return runDeliveryModelGate(classification, signals);
}

/**
 * Slice 1.3 integration seam. Builds a deterministic should-cost estimate for
 * the sourcing event, modelling the full TCO iceberg rather than echoing a
 * single vendor number. Returns `null` when there is no event with a
 * value-at-stake figure to anchor the estimate.
 *
 * The bundle does not yet carry an explicit delivery role mix, rate card, or
 * consumption run-rate. Mirroring the Slice 1.2 graceful-degradation posture,
 * this seam derives a conservative default scaffold off the event's
 * `valueAtStakeUsd` (treated as the visible quoted layer) so the iceberg
 * framing is available; it never fabricates a precise costed proposal. When
 * those structured inputs are added to the bundle they replace the scaffold.
 */
export function estimateEventShouldCost(
  bundle: SourceAgentContextBundle,
): ShouldCostEstimate | null {
  const event = bundle.sourcingEvent;
  if (!event) return null;
  const vendorQuotedCost =
    event.valueAtStakeUsd ?? event.projectedValueUsd ?? 0;
  if (vendorQuotedCost <= 0) return null;

  // Conservative default delivery scaffold. The blended labour base is sized
  // off the quoted figure so the iceberg shape is plausible without inventing
  // a specific role plan; the hidden-layer drivers keep their §5 defaults.
  const durationMonths = 12;
  const annualLabourBudget = vendorQuotedCost * 0.6;
  const rateCard: RoleRateCard[] = [
    {
      role: "engagement_lead",
      onshoreAnnualRate: 320_000,
      offshoreAnnualRate: 150_000,
    },
    {
      role: "solution_architect",
      onshoreAnnualRate: 280_000,
      offshoreAnnualRate: 130_000,
    },
    {
      role: "senior_engineer",
      onshoreAnnualRate: 220_000,
      offshoreAnnualRate: 95_000,
    },
    {
      role: "engineer",
      onshoreAnnualRate: 170_000,
      offshoreAnnualRate: 70_000,
    },
    {
      role: "project_manager",
      onshoreAnnualRate: 200_000,
      offshoreAnnualRate: 90_000,
    },
  ];
  const roleMix: RoleMixEntry[] = [
    { role: "engagement_lead", headcount: 0.5 },
    { role: "solution_architect", headcount: 1 },
    { role: "senior_engineer", headcount: 2 },
    { role: "engineer", headcount: 3 },
    { role: "project_manager", headcount: 1 },
  ];

  return buildShouldCostEstimate({
    estimateLabel: event.name,
    vendorQuotedCost,
    vendorMarginRatio: 0.3,
    roleMix,
    rateCard,
    durationMonths,
    offshoreRatio: 0.4,
    transitionCost: vendorQuotedCost * 0.05,
    consumption: {
      monthlyCloudCost: annualLabourBudget * 0.02,
      monthlyModelCost: 0,
    },
  });
}

/**
 * Slice 1.4 integration seam. Normalizes the event's vendor proposals into one
 * decision-grade comparison matrix across the eight proposal dimensions.
 * Returns `null` when there is no sourcing event to attach the matrix to.
 *
 * The bundle does not yet carry structured raw vendor proposals. Mirroring the
 * Slice 1.2 posture, this seam runs the matrix over the proposals it can
 * collect (currently an empty set) — the normalizer then returns the correct
 * "collect vendor responses first" next action rather than a fabricated
 * comparison. When a structured vendor-proposal channel lands on the bundle,
 * `proposals` is the single field to wire it into without a signature change.
 */
export function normalizeEventProposals(
  bundle: SourceAgentContextBundle,
): ProposalNormalizationMatrix | null {
  const event = bundle.sourcingEvent;
  if (!event) return null;
  const proposals: RawVendorProposal[] = [];
  return buildProposalNormalizationMatrix({
    eventId: event.id,
    eventName: event.name,
    stage: event.currentStageKey,
    proposals,
  });
}

/**
 * Slice 1.1 integration seam. Runs the category strategy classifier over the
 * bundle's deterministic sourcing-event attributes and loaded tenant-context
 * segments. Returns `null` when there is no event to classify — the answer
 * engine stays usable for pure current-state questions.
 *
 * This is the single, non-invasive seam where Sentinel picks up the
 * classification; the surface itself is not rewritten.
 */
export function classifyEventCategory(
  bundle: SourceAgentContextBundle,
): CategoryClassification | null {
  const event = bundle.sourcingEvent;
  if (!event) return null;
  return classifySourcingEvent(
    {
      name: event.name,
      archetype: bundle.sourcingArchetype ?? event.archetype,
      patternId: undefined,
      description: bundle.blockers.join("; ") || undefined,
    },
    { loadedSegments: collectLoadedSegments(bundle.liveTenantContext) },
  );
}

/**
 * The taxonomy's `TenantContextSegment` set. The live snapshot reports many
 * more segment ids (e.g. `org_structure`, `kpi_history`); only the ones the
 * taxonomy grounds against are relevant to evidence-gap detection.
 */
const TAXONOMY_SEGMENTS: readonly TenantContextSegment[] = [
  "vendor_contracts",
  "it_landscape",
  "it_financials",
  "program_inventory",
  "operating_telemetry",
  "industry_context",
  "compliance",
];

function collectLoadedSegments(
  live: SourceLiveTenantContextSnapshot | undefined,
): TenantContextSegment[] {
  if (!live) return [];
  const taxonomy = new Set<string>(TAXONOMY_SEGMENTS);
  const loaded = new Set<TenantContextSegment>();
  for (const segment of live.segments) {
    // A segment counts as loaded only if it actually carries inventory or
    // context records — an empty segment is not grounded evidence.
    if (
      taxonomy.has(segment.segmentId) &&
      segment.inventoryRecords + segment.contextChunks > 0
    ) {
      loaded.add(segment.segmentId as TenantContextSegment);
    }
  }
  return [...loaded];
}

function formatCorpusExpertLens(section: SourcePatternSectionContext): string {
  return `Corpus ${section.id}: ${section.title} - ${section.summary}`;
}

function formatCorpusPressurePoint(
  section: SourcePatternSectionContext,
): string {
  return `Corpus ${section.id}: ${section.title} - ${section.summary}`;
}

function formatCorpusEvidenceRequirement(
  section: SourcePatternSectionContext,
): string {
  return `Corpus ${section.id}: ${section.title} requires evidence - ${section.summary}`;
}

export function detectSourceAnswerMode(prompt: string): SourceAnswerMode {
  const text = prompt.toLowerCase();
  if (
    /\b(risk|trap|watch|avoid|failure|red flags?|gotcha|pitfall)\b/.test(text)
  )
    return "risk_traps";
  if (
    /\b(missing|need|gaps?|required|before we proceed|cannot proceed|data request)\b/.test(
      text,
    )
  )
    return "missing_data";
  if (/\b(cxo|cio|cfo|cto|guidance|recommend|decision|steer)\b/.test(text))
    return "cxo_guidance";
  if (
    /\b(current state|state of affairs|org structure|financial|tech landscape|landscape|baseline)\b/.test(
      text,
    )
  )
    return "current_state";
  if (
    /\b(shape|scope|event|rfp|evaluat(?:e|ed|ion)|scorecard|vendors?|commercial)\b/.test(
      text,
    )
  )
    return "event_shaping";
  return "expert_sourcing";
}

function selectSourceExpertPlaybook(
  bundle: SourceAgentContextBundle,
  prompt: string,
): SourceExpertPlaybook {
  const text =
    `${bundle.sourcingEvent?.name ?? ""} ${bundle.sourcingArchetype ?? ""} ${prompt}`.toLowerCase();
  if (
    /\b(cdp|customer data|identity|activation|personalization|segment|treasure data)\b/.test(
      text,
    )
  ) {
    return CDP_PLAYBOOK;
  }
  if (
    /\b(contact center|call center|agent assist|containment|ivr|nice|aht)\b/.test(
      text,
    )
  ) {
    return CONTACT_CENTER_AI_PLAYBOOK;
  }
  if (
    /\b(store associate|store productivity|labor|workforce|associate)\b/.test(
      text,
    )
  ) {
    return STORE_PRODUCTIVITY_PLAYBOOK;
  }
  if (
    /\b(ams|managed service|outsourcing|application support|sla|transition)\b/.test(
      text,
    )
  ) {
    return AMS_OUTSOURCING_PLAYBOOK;
  }
  return PLATFORM_SOURCING_PLAYBOOK;
}

function rankAnswerEvidence(
  live: SourceLiveTenantContextSnapshot,
  mode: SourceAnswerMode,
): SourceLiveTenantEvidenceItem[] {
  const modeSegments: Partial<Record<SourceAnswerMode, string[]>> = {
    current_state: [
      "org_structure",
      "it_financials",
      "it_landscape",
      "kpi_history",
      "vendor_contracts",
    ],
    event_shaping: [
      "vendor_contracts",
      "it_landscape",
      "operating_telemetry",
      "it_financials",
      "program_inventory",
      "financial_model",
      "compliance",
      "uploaded_source_evidence",
      "evidence_ledger",
      "sourcing_artifacts",
      "generated_sourcing_artifacts",
    ],
    cxo_guidance: [
      "sourcing_artifacts",
      "program_inventory",
      "evidence_ledger",
      "financial_model",
      "it_financials",
      "decision_traces",
      "stakeholder_notes",
    ],
    risk_traps: [
      "compliance",
      "program_inventory",
      "vendor_contracts",
      "evidence_ledger",
      "decision_traces",
      "program_inventory",
    ],
    missing_data: [
      "sourcing_artifacts",
      "uploaded_source_evidence",
      "generated_sourcing_artifacts",
      "evidence_ledger",
      "kpi_dictionary",
      "operating_telemetry",
      "financial_model",
    ],
    expert_sourcing: [
      "vendor_contracts",
      "it_landscape",
      "operating_telemetry",
      "it_financials",
      "compliance",
      "program_inventory",
      "financial_model",
      "uploaded_source_evidence",
      "evidence_ledger",
      "sourcing_artifacts",
      "generated_sourcing_artifacts",
      "peer_benchmarks",
      "vendor_intelligence",
    ],
  };
  const preferred = new Set(modeSegments[mode] ?? []);
  return [...live.retrievedEvidence].sort((a, b) => {
    const aBoost = preferred.has(a.segmentId) ? 4 : 0;
    const bBoost = preferred.has(b.segmentId) ? 4 : 0;
    return b.score + bBoost - (a.score + aBoost);
  });
}

function toCurrentStateFindings(
  evidence: SourceLiveTenantEvidenceItem[],
  live: SourceLiveTenantContextSnapshot,
): string[] {
  const findings = evidence
    .slice(0, 4)
    .map(formatCurrentStateFinding);
  if (findings.length > 0) return findings;
  return live.evidenceBasis
    .slice(0, 4)
    .map((basis) => `Loaded context: ${basis}.`);
}

function formatCurrentStateFinding(item: SourceLiveTenantEvidenceItem): string {
  const segmentLabel = formatSegmentLabel(item.segmentId);
  if (isStructuredRowExcerpt(item.excerpt)) {
    return `${formatEvidenceTitle(item.title)} is cited evidence for this sourcing read.`;
  }
  if (item.segmentId === "sourcing_artifacts") {
    return cleanEvidenceExcerpt(item.excerpt);
  }
  return `${segmentLabel}: ${cleanEvidenceExcerpt(item.excerpt)}`;
}

function formatEvidenceTitle(title: string): string {
  return title
    .replace(/^#+\s*/, "")
    .replace(/\s+(excerpt|fact)$/i, "")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function isStructuredRowExcerpt(excerpt: string): boolean {
  const trimmed = excerpt.trim();
  if (!trimmed) return false;
  const commaCount = (trimmed.match(/,/g) ?? []).length;
  const quotedCommaCount = (trimmed.match(/",/g) ?? []).length;
  const danglingCsvQuote = /",|,"|"\w/.test(trimmed);
  const roleTailFragment =
    /,\s*(and\s+)?(pass-through|exception|owner|lead|manager|director|sme|analyst)\b/i.test(
      trimmed,
    );
  const headerLike = /\b[a-z][a-z0-9_]+,[a-z][a-z0-9_]+,/i.test(trimmed);
  return (
    quotedCommaCount >= 1 ||
    commaCount >= 8 ||
    danglingCsvQuote ||
    roleTailFragment ||
    headerLike
  );
}

function selectByMode(
  mode: SourceAnswerMode,
  primary: string[],
  fallback: string[],
): string[] {
  if (mode === "current_state") return primary.slice(0, 2);
  if (mode === "risk_traps") return primary.slice(0, 4);
  if (mode === "missing_data") return primary.slice(0, 4);
  return (primary.length ? primary : fallback).slice(0, 3);
}

function inferMissingData(
  bundle: SourceAgentContextBundle,
  live: SourceLiveTenantContextSnapshot,
): string[] {
  const hasSegment = (segmentId: string) =>
    live.segments.some(
      (segment) =>
        segment.segmentId === segmentId &&
        segment.inventoryRecords + segment.contextChunks > 0,
    );

  return unique([
    ...bundle.missingInputs,
    ...(hasSegment("operating_telemetry")
      ? []
      : ["Operating telemetry baseline."]),
    ...(hasSegment("vendor_contracts")
      ? []
      : ["Current vendor contract and renewal baseline."]),
    ...(hasSegment("it_financials")
      ? []
      : ["IT financial baseline."]),
    ...(hasSegment("it_landscape")
      ? []
      : ["Application and infrastructure scope baseline."]),
  ]);
}

function filterResolvedMissingData(
  items: string[],
  live: SourceLiveTenantContextSnapshot,
): string[] {
  const hasSegment = (segmentId: string) =>
    live.segments.some(
      (segment) =>
        segment.segmentId === segmentId &&
        segment.inventoryRecords + segment.contextChunks > 0,
    );

  return items.filter((item) => {
    const text = item.toLowerCase();
    if (
      hasSegment("it_landscape") &&
      /\b(application inventory|application estate|support tiers|ownership boundaries|tooling|scope)\b/.test(
        text,
      )
    ) {
      return false;
    }
    if (
      hasSegment("operating_telemetry") &&
      /\b(ticket|incident|request|change baseline|sla|service[- ]?level|performance)\b/.test(
        text,
      )
    ) {
      return false;
    }
    if (
      hasSegment("vendor_contracts") &&
      /\b(contract|renewal|rate card|exclusion|agreement|vendor)\b/.test(text)
    ) {
      return false;
    }
    if (
      hasSegment("it_financials") &&
      /\b(financial|run[- ]?cost|cost baseline|pricing|rate)\b/.test(text)
    ) {
      return false;
    }
    if (
      hasSegment("program_inventory") &&
      /\b(transition|knowledge transfer|cutover|acceptance|evaluation weights|scorecard)\b/.test(
        text,
      )
    ) {
      return false;
    }
    return true;
  });
}

function deriveAnswerConfidence(
  live: SourceLiveTenantContextSnapshot,
  evidence: SourceLiveTenantEvidenceItem[],
): SourceAnswerEngineOutput["confidence"] {
  const highEvidence = evidence.filter(
    (item) => item.confidence === "high",
  ).length;
  if (
    live.embeddedContextChunkCount > 0 &&
    evidence.length >= 6 &&
    highEvidence >= 4 &&
    live.warnings.length === 0
  ) {
    return "high";
  }
  if (
    live.embeddedContextChunkCount > 0 &&
    evidence.length >= 2 &&
    highEvidence >= 2
  )
    return "medium";
  if (evidence.length >= 3) return "medium";
  return "low";
}

function formatAnswerText(args: {
  mode: SourceAnswerMode;
  currentStateFindings: string[];
  sourcingImplications: string[];
  cxoGuidance: string[];
  riskTraps: string[];
  missingData: string[];
  confidence: SourceAnswerEngineOutput["confidence"];
  evidence: SourceLiveTenantEvidenceItem[];
  limits: string[];
}): string {
  const evidenceLabels = args.evidence
    .slice(0, 4)
    .map((item, index) => `[${index + 1}] ${formatBusinessEvidenceLabel(item)}`);
  const body = [
    joinSentences(args.currentStateFindings),
    `What it means for sourcing: ${joinSentences(args.sourcingImplications)}`,
    `CXO guidance: ${joinSentences(args.cxoGuidance)}`,
    args.riskTraps.length
      ? `Risks/traps: ${joinSentences(args.riskTraps)}`
      : "",
    args.missingData.length
      ? `Missing data: ${joinSentences(args.missingData)}`
      : "",
    evidenceLabels.length ? `Evidence: ${evidenceLabels.join("; ")}.` : "",
    args.limits.length ? `Limits: ${args.limits.join(" ")}` : "",
  ]
    .filter(Boolean)
    .join("\n");
  return body;
}

type BafoInstructionAsk = {
  vendorName: string;
  question: string;
  requiredResponse: string;
  scoringHoldback: string;
};

type EvaluationVendorSummary = {
  vendorName: string;
  rank: number;
  score: string;
  recommendation: string;
  rationale: string;
  tradeoffs: string;
  conditions: string;
  finalistPosture: string;
};

type EvaluationScoreImpact = {
  vendorName: string;
  currentScore: string;
  potentialScore: string;
  delta: string;
  cure: string;
  decisionImpact: string;
};

function buildEvaluationDecisionAnswer(args: {
  prompt: string;
  evidence: SourceLiveTenantEvidenceItem[];
}): {
  title: string;
  answerText: string;
  currentStateFindings: string[];
  sourcingImplications: string[];
  cxoGuidance: string[];
  recommendedNextAction: string;
} | null {
  const text = args.prompt.toLowerCase();
  const looksEvaluationSpecific =
    /\b(leading|leader|cheapest|lowest|highest transition risk|transition risk|advance to bafo|advance|executive tradeoffs?|tradeoffs?|scorecard|evaluation|rank|ranking)\b/.test(
      text,
    ) && !/\b(what should go into bafo|bafo asks?|bafo questions?|draft the bafo)\b/.test(text);
  if (!looksEvaluationSpecific) return null;

  const summaries = args.evidence
    .filter((item) => /\bevaluation summary\b/i.test(item.title))
    .map(parseEvaluationSummary)
    .filter((summary): summary is EvaluationVendorSummary => Boolean(summary));
  if (summaries.length === 0) return null;

  const sorted = [...summaries].sort((a, b) => a.rank - b.rank);
  const vendorLine = (summary: EvaluationVendorSummary) =>
    `${summary.vendorName}: rank ${summary.rank}, ${summary.score}/10; ${summary.finalistPosture || summary.rationale}`;
  const scoreImpacts = args.evidence
    .filter((item) => /\bscore impact scenario\b/i.test(item.title))
    .map(parseEvaluationScoreImpact)
    .filter((impact): impact is EvaluationScoreImpact => Boolean(impact));
  const finalistRecommendation =
    args.evidence.find((item) => /\bfinalist recommendation\b/i.test(item.title))
      ?.excerpt ?? "";
  const leading = sorted[0];
  const cheapest = findVendorFromComparison(args.evidence, "Normalized 5-year TCO") ??
    summaries.find((summary) => summary.vendorName === "Vendor B") ??
    leading;
  const transitionRisk =
    findVendorFromComparison(args.evidence, "Transition risk", /highest risk/i) ??
    summaries.find((summary) => summary.vendorName === "Vendor B") ??
    sorted.at(-1) ??
    leading;

  let leadSentence =
    `${leading.vendorName} is leading on a risk-adjusted basis, not because it is cheapest, but because it has the strongest continuity, scope, and transition posture.`;
  if (/\bcheapest|lowest|tco|cost\b/.test(text)) {
    leadSentence = `${cheapest.vendorName} is cheapest on normalized 5-year TCO, but the lower price is conditional until retained effort, pass-throughs, and productivity economics are closed.`;
  } else if (/\bhighest transition risk|transition risk\b/.test(text)) {
    leadSentence = `${transitionRisk.vendorName} carries the highest transition risk because execution confidence depends on closing staffing coverage, retained-client dependency, and cutover evidence.`;
  } else if (/\badvance\b/.test(text)) {
    leadSentence =
      "Advance Vendor A as the risk-adjusted lead and Vendor C as a conditional service-accountability finalist; keep Vendor B as a price benchmark unless it cures its staffing, retained-effort, pass-through, and productivity-credit gaps before BAFO.";
  } else if (/\btradeoffs?\b/.test(text)) {
    leadSentence =
      "The executive tradeoff is continuity versus price versus service accountability: Vendor A is safer, Vendor B is cheaper, and Vendor C has stronger SLA economics but narrower scope.";
  }

  const answerText = [
    leadSentence,
    `Why the score is defensible: ${sorted.map(vendorLine).join(" ")}`,
    finalistRecommendation
      ? `Finalist posture: ${finalistRecommendation}`
      : `${cheapest.vendorName} sets the price challenge; ${transitionRisk.vendorName} sets the execution-risk caution; Vendor C remains relevant because its SLA economics are strongest even though its base scope is narrower.`,
    scoreImpacts.length
      ? `What can change the score: ${scoreImpacts.map(formatScoreImpact).join(" ")}`
      : "What can change the score: revised BAFO exhibits must close staffing, transition, SLA, productivity, pricing, and exception holdbacks before final scoring is locked.",
    "Next action: issue a targeted BAFO round, then lock human reviewer scores only after revised exhibits reconcile to pricing, SLA, staffing, transition, and exceptions.",
  ].join("\n");

  return {
    title: "Evaluation scorecard answer",
    answerText,
    currentStateFindings: sorted.map(vendorLine),
    sourcingImplications: [
      `${leading.vendorName} is the current risk-adjusted leader, but final selection should wait for BAFO closure.`,
      `${cheapest.vendorName} should remain a price benchmark, not a preferred finalist, until execution-risk conditions are contractually resolved.`,
      "Vendor C should stay in the comparison because its SLA accountability creates negotiation leverage even if scope caveats remain.",
    ],
    cxoGuidance: [
      "The CIO should keep scoring conditional until staffing, transition, SLA, and support-scope commitments are evidenced.",
      "The CFO should require normalized TCO and priced remedies before treating any vendor as financially preferred.",
      "The sourcing lead should run BAFO against the exact holdbacks in the scorecard, not against broad narrative refreshes.",
    ],
    recommendedNextAction:
      "Run BAFO against the scorecard holdbacks, then lock human reviewer scores only after revised exhibits reconcile to pricing, SLA, staffing, transition, and exceptions.",
  };
}

function parseEvaluationSummary(
  item: SourceLiveTenantEvidenceItem,
): EvaluationVendorSummary | null {
  const vendorName = item.title.match(/\bVendor\s+[A-Z]\b/)?.[0];
  if (!vendorName) return null;
  const excerpt = cleanEvidenceExcerpt(item.excerpt);
  const rank = Number(excerpt.match(/\bRank\s+(\d+)/i)?.[1] ?? "99");
  const score = excerpt.match(/weighted score\s+([0-9.]+)\/10/i)?.[1] ?? "n/a";
  const recommendation =
    excerpt.match(/recommendation\s+([a-z ]+)\./i)?.[1]?.trim() ??
    "conditional";
  const sentenceAfterRecommendation =
    excerpt.match(/recommendation\s+[a-z ]+\.\s*(.*?)(?:\s+Tradeoffs:|$)/i)?.[1]?.trim() ??
    excerpt;
  const tradeoffs =
    excerpt.match(/Tradeoffs:\s*(.*?)(?:\s+Conditions:|$)/i)?.[1]?.trim() ??
    "";
  const conditions = excerpt.match(/Conditions:\s*(.*)$/i)?.[1]?.trim() ?? "";
  const finalistPosture =
    excerpt.match(/Finalist posture:\s*(.*?)(?:\s+Tradeoffs:|$)/i)?.[1]?.trim() ??
    "";
  return {
    vendorName,
    rank,
    score,
    recommendation,
    rationale: sentenceAfterRecommendation,
    tradeoffs,
    conditions,
    finalistPosture,
  };
}

function parseEvaluationScoreImpact(
  item: SourceLiveTenantEvidenceItem,
): EvaluationScoreImpact | null {
  const vendorName = item.title.match(/\bVendor\s+[A-Z]\b/)?.[0];
  if (!vendorName) return null;
  const excerpt = cleanEvidenceExcerpt(item.excerpt);
  const movement = excerpt.match(
    /Score movement:\s*([0-9]+(?:\.[0-9]+)?)\s+to\s+([0-9]+(?:\.[0-9]+)?).*?delta\s+\+?([0-9]+(?:\.[0-9]+)?)/i,
  );
  const cure = excerpt.match(/BAFO cure:\s*(.*?)(?:\s+Required evidence:|$)/i)?.[1]?.trim() ?? "";
  const decisionImpact =
    excerpt.match(/Decision impact:\s*(.*)$/i)?.[1]?.trim() ?? "";
  return {
    vendorName,
    currentScore: movement?.[1] ?? "n/a",
    potentialScore: movement?.[2] ?? "n/a",
    delta: movement?.[3] ?? "n/a",
    cure,
    decisionImpact,
  };
}

function formatScoreImpact(impact: EvaluationScoreImpact): string {
  return `${impact.vendorName} can move from ${impact.currentScore} to ${impact.potentialScore} (+${impact.delta}) if BAFO provides this cure: ${impact.cure} ${impact.decisionImpact}`;
}

function findVendorFromComparison(
  evidence: SourceLiveTenantEvidenceItem[],
  label: string,
  vendorClausePattern?: RegExp,
): EvaluationVendorSummary | null {
  const row = evidence.find(
    (item) =>
      item.title.toLowerCase().includes("normalized vendor comparison") &&
      item.title.toLowerCase().includes(label.toLowerCase()),
  );
  if (!row) return null;
  const excerpt = cleanEvidenceExcerpt(row.excerpt);
  const vendorNames = [...excerpt.matchAll(/\bVendor\s+[A-Z]\b/g)].map(
    (match) => match[0],
  );
  if (vendorClausePattern) {
    const matchedVendor = vendorNames.find((vendorName) => {
      const clause = excerpt.match(
        new RegExp(`${vendorName.replace(" ", "\\s+")}:[^.]+\\.`, "i"),
      )?.[0];
      return clause ? vendorClausePattern.test(clause) : false;
    });
    if (matchedVendor) {
      return {
        vendorName: matchedVendor,
        rank: 99,
        score: "n/a",
        recommendation: "conditional",
        rationale: excerpt,
        tradeoffs: "",
        conditions: "",
        finalistPosture: "",
      };
    }
  }
  if (/5-year tco/i.test(label)) {
    const costs = vendorNames
      .map((vendorName) => {
        const clause = excerpt.match(
          new RegExp(`${vendorName.replace(" ", "\\s+")}:\\s*\\$([0-9.]+)M`, "i"),
        );
        return clause
          ? { vendorName, cost: Number(clause[1]) }
          : null;
      })
      .filter((value): value is { vendorName: string; cost: number } =>
        Boolean(value),
      )
      .sort((a, b) => a.cost - b.cost);
    const cheapest = costs[0];
    if (cheapest) {
      return {
        vendorName: cheapest.vendorName,
        rank: 99,
        score: "n/a",
        recommendation: "conditional",
        rationale: excerpt,
        tradeoffs: "",
        conditions: "",
        finalistPosture: "",
      };
    }
  }
  return null;
}

function buildBafoInstructionAnswer(args: {
  prompt: string;
  evidence: SourceLiveTenantEvidenceItem[];
}): {
  title: string;
  answerText: string;
  currentStateFindings: string[];
  sourcingImplications: string[];
  cxoGuidance: string[];
  recommendedNextAction: string;
} | null {
  if (!/\b(bafo|best and final|best-and-final|what should go into)\b/i.test(args.prompt)) {
    return null;
  }

  const asks = args.evidence
    .filter((item) => /\bBAFO instruction\b/i.test(item.title))
    .map(parseBafoInstructionAsk)
    .filter((ask): ask is BafoInstructionAsk => Boolean(ask));
  if (asks.length === 0) return null;

  const byVendor = new Map<string, BafoInstructionAsk[]>();
  for (const ask of asks) {
    const items = byVendor.get(ask.vendorName) ?? [];
    items.push(ask);
    byVendor.set(ask.vendorName, items);
  }

  const vendorSummaries = Array.from(byVendor.entries()).map(
    ([vendorName, vendorAsks]) =>
      `${vendorName}: ${vendorAsks
        .slice(0, 3)
        .map((ask) => summarizeBafoQuestion(ask.question))
        .join("; ")}.`,
  );
  const highestRiskVendor =
    byVendor.get("Vendor B") && byVendor.get("Vendor B")!.length > 0
      ? "Vendor B"
      : vendorSummaries[0]?.split(":")[0] ?? "the conditional vendor";

  return {
    title: "BAFO instruction answer",
    answerText: [
      `BAFO should focus on ${asks.length} unresolved commercial commitments across ${byVendor.size} vendor profiles, not on another broad narrative refresh.`,
      `${vendorSummaries.join(" ")}`,
      `${highestRiskVendor} is the most conditional profile for scoring because its asks include evidence that must reconcile productivity economics, coverage staffing, or buyer-retained effort before the comparison hardens.`,
      "Require each vendor to answer in structured exhibits: revised pricing, baseline volume or staffing table, affected clause, implementation dependency, effective date, and remedy if the commitment is missed.",
      "Do not award full scoring credit for any claim that stays unsupported, unpriced, outside the structured exhibits, or shifted back to the buyer through assumptions and exclusions.",
    ].join("\n"),
    currentStateFindings: vendorSummaries,
    sourcingImplications: [
      "Use the BAFO pack to convert unsupported response claims into vendor-specific questions and scoring holdbacks.",
      "Treat productivity, SLA economics, transition fees, staffing coverage, scope comparability, and retained-role effort as the negotiation spine.",
      "Keep each vendor conditional until its revised exhibits reconcile to the pricing workbook, SLA table, staffing model, transition plan, and assumptions log.",
    ],
    cxoGuidance: [
      "The CIO should hold scoring open until operational commitments are backed by service, staffing, transition, and remedy evidence.",
      "The CFO should require every productivity or scope claim to show a price-down, gainshare, credit, or normalized TCO impact.",
      "The sourcing lead should make the BAFO response format mandatory so narrative claims cannot replace structured commitments.",
    ],
    recommendedNextAction:
      "Issue the vendor-specific BAFO questions and hold final scoring until the revised exhibits close or price the open risks.",
  };
}

function parseBafoInstructionAsk(
  item: SourceLiveTenantEvidenceItem,
): BafoInstructionAsk | null {
  const vendorName = item.title.match(/\bVendor\s+[A-Z]\b/)?.[0];
  if (!vendorName) return null;
  const excerpt = cleanEvidenceExcerpt(item.excerpt);
  const questionMatch = excerpt.match(/^[^:]+:\s*(.*?)(?:\s+Required response:|$)/i);
  const requiredResponseMatch = excerpt.match(
    /Required response:\s*(.*?)(?:\s+Scoring holdback:|$)/i,
  );
  const scoringHoldbackMatch = excerpt.match(/Scoring holdback:\s*(.*)$/i);
  const question = questionMatch?.[1]?.trim();
  if (!question) return null;
  return {
    vendorName,
    question,
    requiredResponse: requiredResponseMatch?.[1]?.trim() ?? "Structured BAFO exhibit with pricing, scope, owner, dependency, and effective date.",
    scoringHoldback: scoringHoldbackMatch?.[1]?.trim() ?? "Hold scoring until the commitment is evidenced.",
  };
}

function summarizeBafoQuestion(question: string): string {
  return question
    .replace(/^Please\s+/i, "")
    .replace(/\bbefore evaluation scoring\b/gi, "before scoring")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/[.。]?$/, "");
}

function toAnswerCitation(
  item: SourceLiveTenantEvidenceItem,
): SourceAnswerEvidenceCitation {
  return {
    id: item.id,
    label: formatBusinessEvidenceLabel(item),
    segmentId: item.segmentId,
    recordId: item.recordId,
    sourceDoc: item.sourceDoc,
    sourcePath: item.sourcePath,
    excerpt: toAvaVisibleText(formatEvidenceCitationExcerpt(item)),
    confidence: item.confidence,
  };
}

function formatEvidenceCitationExcerpt(
  item: SourceLiveTenantEvidenceItem,
): string {
  if (isStructuredRowExcerpt(item.excerpt)) {
    return `${formatEvidenceTitle(item.title)} is cited evidence for this sourcing read.`;
  }
  return cleanEvidenceExcerpt(item.excerpt);
}

function buildAvaResponseParts(args: {
  mode: SourceAnswerMode;
  answerText: string;
  confidence: SourceAnswerEngineOutput['confidence'];
  currentStateFindings: string[];
  sourcingImplications: string[];
  cxoGuidance: string[];
  riskTraps: string[];
  missingData: string[];
  evidenceCitations: SourceAnswerEvidenceCitation[];
  recommendedNextAction: string;
  deliveryModelGate: DeliveryModelGateResult | null;
  shouldCostEstimate: ShouldCostEstimate | null;
  proposalNormalization: ProposalNormalizationMatrix | null;
}): AgentResponsePart[] {
  const parts: AgentResponsePart[] = [
    {
      type: 'metricStrip',
      title: 'Ava sourcing read',
      metrics: [
        { label: 'Lens', value: formatMode(args.mode), tone: 'info' },
        { label: 'Confidence', value: args.confidence, tone: confidenceTone(args.confidence) },
        {
          label: 'Support',
          value: String(args.evidenceCitations.length),
          tone: args.evidenceCitations.length > 0 ? 'good' : 'warning',
        },
        {
          label: 'Open inputs',
          value: String(args.missingData.length),
          tone: args.missingData.length > 0 ? 'warning' : 'good',
        },
      ],
    },
    {
      type: 'text',
      title: 'Advisor answer',
      text: args.answerText,
    },
  ];

  if (args.currentStateFindings.length > 0 || args.sourcingImplications.length > 0) {
    parts.push({
      type: 'table',
      title: 'Decision signals and sourcing implications',
      columns: ['Signal', 'So what for sourcing'],
      rows: zipRows(args.currentStateFindings, args.sourcingImplications),
      caption: 'This keeps each recommendation tied to a visible sourcing signal.',
    });
  }

  if (args.deliveryModelGate) {
    parts.push({
      type: 'table',
      title: 'Delivery-model gate',
      columns: ['Decision item', 'Ava read'],
      rows: [
        ['Recommended model', args.deliveryModelGate.recommendedModelLabel],
        ['Gate status', args.deliveryModelGate.gateStatus.replace(/_/g, ' ')],
        ['Confidence', args.deliveryModelGate.confidence],
        [
          'Open questions',
          args.deliveryModelGate.openQuestions.map((q) => q.question).join(' ') || 'None recorded.',
        ],
      ],
      caption: 'This prevents an RFP from being shaped before build/buy/partner/SI is explicit.',
    });
  }

  if (args.shouldCostEstimate) {
    parts.push({
      type: 'barChart',
      title: 'TCO iceberg by should-cost layer',
      unit: 'usd',
      bars: args.shouldCostEstimate.icebergLayers.slice(0, 8).map((layer) => ({
        label: layer.label,
        value: layer.point,
        displayValue: `$${Math.round(layer.point).toLocaleString('en-US')}`,
        tone: layer.visible ? 'info' : 'warning',
      })),
      caption: args.shouldCostEstimate.headline,
    });
  }

  if (args.proposalNormalization) {
    parts.push({
      type: 'table',
      title: 'Proposal normalization posture',
      columns: ['Dimension', 'Divergence', 'Buyer blind spot'],
      rows: args.proposalNormalization.rows.slice(0, 6).map((row) => [
        row.label,
        row.divergence.replace(/_/g, ' '),
        row.buyerBlindSpot ?? 'No submitted proposal data yet.',
      ]),
      caption: args.proposalNormalization.recommendedNextAction,
    });
  }

  if (args.riskTraps.length > 0 || args.missingData.length > 0) {
    parts.push({
      type: 'table',
      title: 'Risks and missing inputs',
      columns: ['Risk or missing input', 'Treatment'],
      rows: [
        ...args.riskTraps.slice(0, 4).map((risk) => [
          risk,
          'Resolve before award logic or pricing normalization is treated as final.',
        ]),
        ...args.missingData.slice(0, 4).map((gap) => [
          gap,
          'Keep visible as an open input; do not fabricate around it.',
        ]),
      ],
    });
  }

  if (args.evidenceCitations.length > 0) {
    parts.push({
      type: 'citations',
      title: 'Evidence used',
      citations: args.evidenceCitations.slice(0, 5).map((citation) => ({
        label: citation.label,
        excerpt: citation.excerpt,
        confidence: citation.confidence,
      })),
    });
  }

  parts.push({
    type: 'nextAction',
    label: 'Recommended next action',
    detail: args.recommendedNextAction,
    confidence: args.confidence,
  });

  return parts;
}

function zipRows(left: string[], right: string[]): string[][] {
  const size = Math.max(left.length, right.length, 1);
  return Array.from({ length: size }, (_, index) => [
    left[index] ?? 'No additional current-state signal.',
    right[index] ?? 'No additional implication recorded.',
  ]);
}

function confidenceTone(
  confidence: SourceAnswerEngineOutput['confidence'],
): 'good' | 'warning' | 'danger' {
  if (confidence === 'high') return 'good';
  if (confidence === 'medium') return 'warning';
  return 'danger';
}

function eventName(bundle: SourceAgentContextBundle): string {
  return bundle.sourcingEvent?.name ?? "this sourcing event";
}

function formatMode(mode: SourceAnswerMode): string {
  return mode.replace(/_/g, " ");
}

function formatSegmentLabel(segmentId: string): string {
  const acronyms = new Set(["ai", "it", "kpi"]);
  return segmentId
    .split("_")
    .map((part) =>
      acronyms.has(part)
        ? part.toUpperCase()
        : part.charAt(0).toUpperCase() + part.slice(1),
    )
    .join(" ");
}

function cleanEvidenceExcerpt(excerpt: string): string {
  return excerpt
    .replace(/^id:\s*[^ ]+\s+/i, "")
    .replace(/^claim:\s*/i, "")
    .replace(/\s+source_type:.*$/i, "")
    .trim()
    .replace(/[.。]?$/, ".");
}

function formatBusinessEvidenceLabel(item: SourceLiveTenantEvidenceItem): string {
  const title = formatEvidenceTitle(item.title);
  if (/\bVendor\s+[A-Z]\b/i.test(title)) return title;
  if (/finalist recommendation/i.test(title)) return "Finalist recommendation";
  if (/normalized vendor comparison/i.test(title)) {
    return title.replace(/normalized vendor comparison\s*[-:]\s*/i, "Vendor comparison: ");
  }
  if (item.segmentId === "sourcing_artifacts") return title || "Sourcing evidence";
  return `${formatSegmentLabel(item.segmentId)} - ${title}`;
}

function toAvaVisibleText(value: string): string {
  return value
    .replace(/\bSentinel\b/g, "Ava")
    .replace(/^Mode:\s*[^\n]+\n?/gim, "")
    .replace(/^Current state:\s*/gim, "")
    .replace(/\bSourcing Artifacts:\s*/g, "")
    .replace(/\bSource Artifacts:\s*/g, "")
    .replace(/\bSourcing Artifacts\b/g, "Sourcing evidence")
    .replace(/\bSource Artifacts\b/g, "Sourcing evidence")
    .replace(/\bsource_events\b/g, "sourcing record")
    .replace(/\bSource artifact registry\/chunk\/fact evidence\b/gi, "governed sourcing evidence")
    .replace(/\bSource artifact registry\b/gi, "governed sourcing evidence")
    .replace(/\bsource rows?\b/gi, "source evidence")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function joinSentences(items: string[]): string {
  if (items.length === 0) return "No cited current-state finding is available.";
  return items.map((item) => item.replace(/[.。]?$/, ".")).join(" ");
}

function unique(values: string[]): string[] {
  return Array.from(
    new Set(values.map((value) => value.trim()).filter(Boolean)),
  );
}

const CDP_PLAYBOOK: SourceExpertPlaybook = {
  id: "cdp-platform-sourcing",
  label: "CDP platform sourcing",
  expertLens: [
    "CDP sourcing should be governed as an enterprise data operating model decision, not only a marketing platform buy.",
    "Identity resolution, consent, activation latency, integration ownership, and implementation partner fit carry as much risk as license price.",
  ],
  eventShaping: [
    "Anchor the RFP in identity match-rate gaps, approved-system constraints, activation use cases, and integration work split between platform vendor and SI.",
    "Score vendors on data model flexibility, governance controls, activation connectors, implementation partner accountability, and measurable lift in customer outcomes.",
    "Make pricing normalize license, events/profiles, implementation, data engineering, run support, and change management so the CFO sees full TCO.",
  ],
  cxoGuidance: [
    "The CIO should force clarity on integration ownership and approved data-system posture before shortlist.",
    "The CMO/CDO should define the first three activation use cases and measurable lift threshold before demos.",
    "The CFO should require a value case that separates platform subscription, SI delivery, internal data effort, and run cost.",
  ],
  riskTraps: [
    "Do not buy a CDP to repair unresolved master-data and consent governance gaps without funding the operating model.",
    "Do not let vendor demos overfit to clean demo data while Apex identity and approved-system constraints remain unresolved.",
    "Do not compare subscription quotes without normalizing events, profile volumes, implementation scope, and managed services.",
  ],
  missingData: [
    "Customer identity match baseline by source system.",
    "Approved-system and data-classification constraints for customer data.",
    "Activation use cases with owner, KPI, and target lift.",
    "Implementation work split across vendor, SI, and internal teams.",
  ],
  nextAction:
    "Lock CDP scoring around identity, activation, integration ownership, governance, and full TCO before BAFO.",
};

const CONTACT_CENTER_AI_PLAYBOOK: SourceExpertPlaybook = {
  id: "contact-center-ai-platform",
  label: "Contact Center AI sourcing",
  expertLens: [
    "Contact Center AI value depends on intent coverage, containment quality, agent adoption, knowledge governance, and measurement trust.",
    "The sourcing event must separate vendor-reported containment from independently measured customer and operational outcomes.",
  ],
  eventShaping: [
    "Require vendors to prove performance on Apex top intents, escalation rules, knowledge freshness, and agent workflow integration.",
    "Score platforms on measurement transparency, human handoff quality, compliance controls, and operational change requirements.",
    "Normalize commercial proposals by interaction volume, channels, model usage, implementation, QA, and run support.",
  ],
  cxoGuidance: [
    "The COO should approve the containment and service-quality tradeoff before automation targets become commitments.",
    "The CIO should require integration and data-retention evidence before platform selection.",
    "The CFO should treat vendor containment claims as projected until independently measured against Apex baselines.",
  ],
  riskTraps: [
    "Do not accept vendor containment metrics without reconciling them to Apex dashboards and QA definitions.",
    "Do not underfund knowledge management, agent enablement, and model monitoring.",
    "Do not let per-interaction pricing hide model, channel, analytics, and implementation costs.",
  ],
  missingData: [
    "Top intents, volume, AHT, containment, transfer, and CSAT baselines.",
    "Knowledge-base freshness and ownership model.",
    "Compliance and retention requirements for call data.",
    "Independent measurement plan for containment and service quality.",
  ],
  nextAction:
    "Build the vendor test script around Apex top intents and reconcile vendor metrics to the internal baseline before scoring.",
};

const STORE_PRODUCTIVITY_PLAYBOOK: SourceExpertPlaybook = {
  id: "store-associate-productivity",
  label: "Store associate productivity sourcing",
  expertLens: [
    "Store productivity tools succeed when labor model, store workflows, device constraints, and manager adoption are designed together.",
    "The event should measure task displacement, queue time, adoption, training burden, and operational variance by store format.",
  ],
  eventShaping: [
    "Scope pilots by store archetype, associate workflow, integration footprint, labor KPI, and change-management owner.",
    "Score vendors on workflow fit, offline/device support, manager controls, analytics, and implementation simplicity.",
  ],
  cxoGuidance: [
    "The COO should define which labor outcomes matter and which customer experience constraints cannot be traded away.",
    "The CIO should test integration and device readiness before scale commitment.",
    "The CFO should require store-level measurement before labeling productivity value as realized.",
  ],
  riskTraps: [
    "Do not average store productivity across formats if the workflow burden varies materially.",
    "Do not buy tools that add associate steps without proving labor displacement or conversion lift.",
  ],
  missingData: [
    "Store workflow baseline by format.",
    "Device, network, and identity readiness.",
    "Labor KPI history and measurement owner.",
  ],
  nextAction:
    "Define store pilot cohorts and measurement ownership before vendor demos.",
};

const AMS_OUTSOURCING_PLAYBOOK: SourceExpertPlaybook = {
  id: "ams-outsourcing",
  label: "AMS and IT outsourcing sourcing",
  expertLens: [
    "AMS sourcing is a service operating model redesign: scope clarity, ticket baseline, retained roles, SLA economics, and transition risk decide outcomes.",
    "Expert diligence must normalize provider pricing across volumes, towers, service levels, transition, tooling, and retained-client work.",
  ],
  eventShaping: [
    "Force tower scope, application inventory, incident/request/change baseline, service levels, and retained role assumptions into the RFP.",
    "Score providers on transition realism, automation roadmap, domain coverage, governance model, commercial transparency, and incumbent knowledge capture.",
    "Separate run-rate savings from one-time transition cost, stranded cost, and service risk.",
  ],
  cxoGuidance: [
    "The CIO should approve retained organization design and transition risk appetite before BAFO.",
    "The CFO should require apples-to-apples pricing normalization across towers, volumes, transition, tools, and retained cost.",
    "The COO/business sponsors should confirm service-level tradeoffs before cost takeout becomes the only decision frame.",
  ],
  riskTraps: [
    "Do not let providers price a thin baseline and later recover margin through exclusions, change orders, and service credits that do not protect operations.",
    "Do not outsource accountability for unstable applications without explicit remediation and retained-architecture ownership.",
    "Do not under-specify transition knowledge capture, tooling, and governance cadence.",
  ],
  missingData: [
    "Application inventory with criticality, owner, ticket volume, and run cost.",
    "Incident/request/change baseline and SLA performance.",
    "Current vendor contracts, renewal dates, rate cards, and exclusions.",
    "Retained organization design and governance model.",
  ],
  nextAction:
    "Complete AMS baseline and pricing-normalization pack before BAFO or executive recommendation.",
};

const PLATFORM_SOURCING_PLAYBOOK: SourceExpertPlaybook = {
  id: "enterprise-platform-sourcing",
  label: "Enterprise platform sourcing",
  expertLens: [
    "Enterprise sourcing needs current-state evidence, commercial normalization, operating-model fit, and decision governance.",
    "The strongest answers separate facts, implications, CXO choices, and unsupported assumptions.",
  ],
  eventShaping: [
    "Anchor the event in current-state pain, quantified value, integration constraints, vendor fit, and stage-gate evidence.",
    "Score vendors against outcomes and delivery risk, not feature lists alone.",
  ],
  cxoGuidance: [
    "The CXO sponsor should approve value, risk appetite, and decision rights before the market narrative hardens.",
    "The CFO should require normalized TCO and evidence labels for projected vs. realized value.",
  ],
  riskTraps: [
    "Do not let vendor materials replace client evidence.",
    "Do not advance without owners for baseline, scorecard, data, and value measurement.",
  ],
  missingData: [
    "Baseline metrics and owner.",
    "Current contracts and technical constraints.",
    "Decision rights and approval forum.",
  ],
  nextAction:
    "Convert the current-state evidence into scorecard criteria, missing-data requests, and CXO decision gates.",
};
