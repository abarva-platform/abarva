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
  const evidence = rankAnswerEvidence(live, mode).slice(0, 8);
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
  const currentStateFindings = toCurrentStateFindings(evidence, live);
  const sourcingImplications = selectByMode(mode, playbook.eventShaping, [
    `Shape ${eventName(input.contextBundle)} around the strongest current-state evidence first, then treat uncited assumptions as open diligence.`,
  ]);
  const cxoGuidance = selectByMode(mode, playbook.cxoGuidance, [
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
  const rawAnswerText = hardQuestionAnswer?.answerText ?? formatAnswerText({
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
  const finalCxoGuidance = hardQuestionAnswer
    ? [
        hardQuestionAnswer.directAnswer,
        hardQuestionAnswer.sourcingJudgment,
        hardQuestionAnswer.whatWouldChangeTheAnswer,
        ...corpusExpertLens,
      ]
    : cxoGuidance;
  const recommendedNextAction =
    hardQuestionAnswer?.recommendedNextAction ?? playbook.nextAction;
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
    title: `${playbook.label} answer`,
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
    return `${segmentLabel}: ${formatEvidenceTitle(item.title)} is loaded as cited sourcing evidence for this answer.`;
  }
  return `${segmentLabel}: ${cleanEvidenceExcerpt(item.excerpt)}`;
}

function formatEvidenceTitle(title: string): string {
  return title
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
  const headerLike = /\b[a-z][a-z0-9_]+,[a-z][a-z0-9_]+,/i.test(trimmed);
  return quotedCommaCount >= 2 || commaCount >= 8 || headerLike;
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
    .map(
      (item, index) =>
        `[${index + 1}] ${formatSegmentLabel(item.segmentId)} - ${item.sourceDoc ?? item.recordId}`,
    );
  const body = [
    `Mode: ${formatMode(args.mode)}. Confidence: ${args.confidence}.`,
    `Current state: ${joinSentences(args.currentStateFindings)}`,
    `Sourcing implication: ${joinSentences(args.sourcingImplications)}`,
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

function toAnswerCitation(
  item: SourceLiveTenantEvidenceItem,
): SourceAnswerEvidenceCitation {
  return {
    id: item.id,
    label: `${formatSegmentLabel(item.segmentId)} - ${item.title}`,
    segmentId: item.segmentId,
    recordId: item.recordId,
    sourceDoc: item.sourceDoc,
    sourcePath: item.sourcePath,
    excerpt: toAvaVisibleText(cleanEvidenceExcerpt(item.excerpt)),
    confidence: item.confidence,
  };
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
        { label: 'Mode', value: formatMode(args.mode), tone: 'info' },
        { label: 'Confidence', value: args.confidence, tone: confidenceTone(args.confidence) },
        {
          label: 'Evidence',
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
      title: 'Current state to sourcing implication',
      columns: ['Current-state signal', 'So what for sourcing'],
      rows: zipRows(args.currentStateFindings, args.sourcingImplications),
      caption: 'This preserves the advisory chain: evidence observed, then the sourcing implication.',
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
        sourceDoc: citation.sourceDoc,
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

function toAvaVisibleText(value: string): string {
  return value.replace(/\bSentinel\b/g, "Ava");
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
