import type {
  HomeAnswerabilityStatus,
  HomeDataQualityModel,
  HomeGapView,
} from "@/lib/home/home-data-quality";

export type HomeEnglishSummaryStatus =
  | "Strong enough to answer"
  | "Partial context"
  | "Needs evidence"
  | "Candidate-only"
  | "Not ready for decision";

export interface HomeEnglishModuleImpact {
  module: "Home" | "Intelligence" | "Moves" | "Source" | "Tower";
  status: "usable" | "usable with caveats" | "limited" | "not ready";
  explanation: string;
}

export interface HomeEnglishSummary {
  tenantKey: string;
  tenantDisplayName: string;
  title: "What this means";
  statusLabel: HomeEnglishSummaryStatus;
  whyThisMatters: string;
  currentUnderstanding: string;
  completenessMeaning: string;
  evidencePosture: string;
  relationshipPosture: string;
  answerability: string;
  safeToAsk: string[];
  decisionCautions: string[];
  nextDataAction: string;
  moduleImpact: HomeEnglishModuleImpact[];
  caveats: string[];
  guardrails: {
    deterministicRenderer: true;
    callsClaude: false;
    productionTenantDataWritten: false;
    activeTenantAccessLayerUpdated: false;
    candidatePromoted: false;
    moduleRuntimeConsumptionChanged: false;
    candidateReadByDefault: false;
  };
}

const DEFAULT_SAFE_TO_ASK = [
  "what is loaded in the current Home context",
  "which evidence and gaps are visible",
  "which related areas should be inspected next",
];

const DEFAULT_DECISION_CAUTIONS = [
  "full enterprise application rationalization",
  "enterprise-wide sourcing savings estimates",
  "realized value or Tower outcome claims",
];

export function buildHomeEnglishSummary(
  model: HomeDataQualityModel | null | undefined,
): HomeEnglishSummary {
  if (!model) return buildUnavailableSummary();

  const statusLabel = statusLabelFor(model.answerability.status);
  const isSkyHarbor = model.tenantKey === "skyharbor-air";
  const isSourceRichCandidateThin = model.sourceCoverage.sourceRichCandidateThin;
  const candidatePreviewOnly = model.candidatePreview.previewRequested;
  const sourceRowsNotRepresented =
    model.sourceCoverage.filesNotRepresentedInCandidate;
  const sourceDomainCount = model.sourceCoverage.domainsAvailable.length;
  const evidenceCount = model.evidenceQuality.factsWithEvidence;
  const missingEvidence = model.evidenceQuality.factsMissingEvidence;
  const relationshipCount = model.relationshipCoverage.knownRelationships;

  const currentUnderstanding = candidatePreviewOnly
    ? `${model.tenantDisplayName} is being viewed in inactive candidate preview. Home can explain what the candidate posture would add, but this is not active tenant truth.`
    : `${model.tenantDisplayName} has active Home context for loaded records, source references, visible gaps, and caveats. Home can explain what is present without treating upstream files or inactive candidate data as active facts.`;

  const completenessMeaning = buildCompletenessMeaning({
    model,
    isSkyHarbor,
    isSourceRichCandidateThin,
    sourceRowsNotRepresented,
    sourceDomainCount,
  });

  const evidencePosture =
    missingEvidence > 0
      ? `${formatNumber(evidenceCount)} evidence item${evidenceCount === 1 ? "" : "s"} are visible, but ${formatNumber(missingEvidence)} candidate fact${missingEvidence === 1 ? "" : "s"} still need evidence before broader use.`
      : evidenceCount > 0
        ? `${formatNumber(evidenceCount)} evidence item${evidenceCount === 1 ? "" : "s"} are visible for the current Home context. Evidence still needs to stay attached when candidate data is expanded.`
        : "Evidence support is not confirmed yet, so Home should stay limited to what source and gap views can show.";

  const relationshipPosture =
    relationshipCount > 0
      ? `${formatNumber(relationshipCount)} mapped relationship${relationshipCount === 1 ? "" : "s"} are visible. Relationship reasoning can support selected context, but cross-domain decisions still need the relationship caveats below.`
      : "Relationship reasoning is limited. Home can describe selected records, but cross-system, vendor, program, risk, and outcome links should be treated as incomplete until relationships are projected and validated.";

  const answerability = buildAnswerabilityText(model, candidatePreviewOnly);
  const safeToAsk = buildSafeToAsk(model);
  const decisionCautions = buildDecisionCautions(model, isSourceRichCandidateThin);
  const nextDataAction = buildNextDataAction(model);

  return {
    tenantKey: model.tenantKey,
    tenantDisplayName: model.tenantDisplayName,
    title: "What this means",
    statusLabel,
    whyThisMatters:
      "This keeps Home useful for executives without letting a thin or preview-only data posture turn into unsupported business claims.",
    currentUnderstanding,
    completenessMeaning,
    evidencePosture,
    relationshipPosture,
    answerability,
    safeToAsk,
    decisionCautions,
    nextDataAction,
    moduleImpact: buildModuleImpact(model),
    caveats: model.caveats.map(businessFacingCaveat).slice(0, 5),
    guardrails: {
      deterministicRenderer: true,
      callsClaude: false,
      productionTenantDataWritten: false,
      activeTenantAccessLayerUpdated: false,
      candidatePromoted: false,
      moduleRuntimeConsumptionChanged: false,
      candidateReadByDefault: false,
    },
  };
}

function buildUnavailableSummary(): HomeEnglishSummary {
  return {
    tenantKey: "unknown",
    tenantDisplayName: "This tenant",
    title: "What this means",
    statusLabel: "Not ready for decision",
    whyThisMatters:
      "Home needs source-backed context before business users can safely rely on the page.",
    currentUnderstanding:
      "Home context is not available yet for this tenant.",
    completenessMeaning:
      "Coverage is not confirmed. Treat this page as setup status, not decision support.",
    evidencePosture:
      "Evidence support is not wired yet for this Home view.",
    relationshipPosture:
      "Relationship coverage is not confirmed yet.",
    answerability:
      "aVa can only answer what is missing until source-backed Home context is available.",
    safeToAsk: ["which data is missing", "what should be uploaded or validated next"],
    decisionCautions: DEFAULT_DECISION_CAUTIONS,
    nextDataAction: "Load and validate source-backed Home context.",
    moduleImpact: [
      {
        module: "Home",
        status: "not ready",
        explanation: "Home does not have enough context to explain this tenant yet.",
      },
      {
        module: "Intelligence",
        status: "not ready",
        explanation: "Intelligence should not synthesize decisions without Home context.",
      },
      {
        module: "Moves",
        status: "not ready",
        explanation: "Moves needs program, owner, value, and evidence context first.",
      },
      {
        module: "Source",
        status: "not ready",
        explanation: "Source needs vendor, contract, scope, and commercial context first.",
      },
      {
        module: "Tower",
        status: "not ready",
        explanation: "Tower needs measured outcomes before value claims are safe.",
      },
    ],
    caveats: [],
    guardrails: {
      deterministicRenderer: true,
      callsClaude: false,
      productionTenantDataWritten: false,
      activeTenantAccessLayerUpdated: false,
      candidatePromoted: false,
      moduleRuntimeConsumptionChanged: false,
      candidateReadByDefault: false,
    },
  };
}

function buildCompletenessMeaning(args: {
  model: HomeDataQualityModel;
  isSkyHarbor: boolean;
  isSourceRichCandidateThin: boolean;
  sourceRowsNotRepresented: number;
  sourceDomainCount: number;
}): string {
  const { model, isSkyHarbor, isSourceRichCandidateThin } = args;
  if (model.candidatePreview.previewRequested) {
    return "This is candidate-only coverage. It can be inspected as inactive preview posture, but default Home and downstream modules must not read it as active data.";
  }
  if (isSkyHarbor && isSourceRichCandidateThin) {
    return "Airline Demo has a rich source estate, but the active Home view is still partial relative to the upstream estate. Applications and systems remediation has an inactive candidate path, but broader enterprise decisions should wait until relationship projection and active-use controls are complete.";
  }
  if (isSourceRichCandidateThin) {
    return `${model.tenantDisplayName} has source-rich, candidate-thin coverage. ${formatNumber(args.sourceRowsNotRepresented)} upstream source row${args.sourceRowsNotRepresented === 1 ? "" : "s"} are not represented in candidate coverage, so Home should describe this as partial context.`;
  }
  if (model.answerability.status === "answerable") {
    return `The current Home context is strong enough for source-backed context browsing across ${formatNumber(args.sourceDomainCount)} source domain${args.sourceDomainCount === 1 ? "" : "s"}.`;
  }
  return "Coverage is partial. Home can explain loaded context, but decisions should wait until missing evidence and relationship coverage are closed.";
}

function buildAnswerabilityText(
  model: HomeDataQualityModel,
  candidatePreviewOnly: boolean,
): string {
  if (candidatePreviewOnly) {
    return "aVa can explain the inactive preview posture and blockers, but it must not describe candidate data as active tenant truth.";
  }
  if (model.answerability.status === "answerable") {
    return "aVa can answer context-browser questions from loaded, source-backed evidence and should route advisory synthesis to the appropriate module.";
  }
  if (model.answerability.status === "needs_evidence") {
    return "aVa can partially answer what records are visible and what evidence is missing, but it should not synthesize decisions yet.";
  }
  if (model.answerability.status === "not_available_yet") {
    return "aVa should only explain what is missing until Home context is loaded.";
  }
  return "aVa can safely explain loaded context, sources, gaps, and caveats. It should not infer full enterprise coverage or make broad advisory claims from this partial posture.";
}

function buildSafeToAsk(model: HomeDataQualityModel): string[] {
  const items = [
    ...model.answerability.safeToAnswer,
    ...DEFAULT_SAFE_TO_ASK,
  ].map(sentenceCase);
  return dedupe(items).slice(0, 6);
}

function buildDecisionCautions(
  model: HomeDataQualityModel,
  isSourceRichCandidateThin: boolean,
): string[] {
  const cautions = [...DEFAULT_DECISION_CAUTIONS];
  if (isSourceRichCandidateThin) {
    cautions.unshift("full enterprise estate coverage or application rationalization");
  }
  if (model.relationshipCoverage.knownRelationships === 0) {
    cautions.push("cross-system dependency, vendor, risk, or outcome reasoning");
  }
  if (model.candidatePreview.previewRequested) {
    cautions.unshift("any claim that candidate preview data is active");
  }
  return dedupe(cautions.map(sentenceCase)).slice(0, 7);
}

function buildNextDataAction(model: HomeDataQualityModel): string {
  const p0 = model.gaps.find((gap) => gap.priority === "P0");
  const p1 = model.gaps.find((gap) => gap.priority === "P1");
  const preferred = p0 ?? p1 ?? model.gaps[0] ?? null;
  if (model.tenantKey === "skyharbor-air" && model.sourceCoverage.sourceRichCandidateThin) {
    return "Finish projecting the richer applications, systems, integration, and relationship source into an inactive candidate, attach evidence, validate weak rows, and keep it inactive until controls pass.";
  }
  if (preferred) return plainAction(preferred);
  if (model.relationshipCoverage.knownRelationships === 0) {
    return "Generate and validate business relationships before relying on cross-domain reasoning.";
  }
  if (model.evidenceQuality.factsWithEvidence === 0) {
    return "Attach evidence to the loaded Home context before routing decisions downstream.";
  }
  return "Review the loaded context with the client team and close any remaining evidence or relationship caveats.";
}

function buildModuleImpact(model: HomeDataQualityModel): HomeEnglishModuleImpact[] {
  const isPartial = model.answerability.status !== "answerable";
  const hasRelationshipGap = model.relationshipCoverage.knownRelationships === 0;
  const hasSourceThinGap = model.sourceCoverage.sourceRichCandidateThin;
  const previewOnly = model.candidatePreview.previewRequested;
  return [
    {
      module: "Home",
      status: previewOnly ? "usable with caveats" : isPartial ? "usable with caveats" : "usable",
      explanation: previewOnly
        ? "Home can explain inactive preview posture, but default Home remains active-context only."
        : "Home can explain current context, visible sources, gaps, caveats, and answerability.",
    },
    {
      module: "Intelligence",
      status: isPartial ? "usable with caveats" : "usable",
      explanation: isPartial
        ? "Intelligence can synthesize only with explicit caveats about partial coverage and missing relationships."
        : "Intelligence can use the loaded context for source-backed synthesis with normal caveats.",
    },
    {
      module: "Moves",
      status: hasSourceThinGap || hasRelationshipGap ? "limited" : "usable with caveats",
      explanation:
        "Moves should wait for program, owner, value, dependency, and evidence context before using this as execution guidance.",
    },
    {
      module: "Source",
      status: hasSourceThinGap || hasRelationshipGap ? "limited" : "usable with caveats",
      explanation:
        "Source should not infer sourcing strategy or commercial savings unless vendor, contract, scope, and commercial evidence is loaded.",
    },
    {
      module: "Tower",
      status: "limited",
      explanation:
        "Tower should not claim realized outcomes unless measured outcome records are available and evidence-backed.",
    },
  ];
}

function statusLabelFor(status: HomeAnswerabilityStatus): HomeEnglishSummaryStatus {
  if (status === "answerable") return "Strong enough to answer";
  if (status === "candidate_preview_only") return "Candidate-only";
  if (status === "needs_evidence") return "Needs evidence";
  if (status === "not_available_yet") return "Not ready for decision";
  return "Partial context";
}

function plainAction(gap: HomeGapView): string {
  if (gap.title === "Source coverage exceeds candidate coverage") {
    return "Expand the candidate packet from the richer source estate, attach evidence, and validate the records before broader use.";
  }
  if (gap.title === "Relationships need business mapping") {
    return "Generate system, owner, platform, vendor, integration, risk, and outcome relationships, then validate them with the client team.";
  }
  return gap.detail;
}

function sentenceCase(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return trimmed;
  return `${trimmed.charAt(0).toUpperCase()}${trimmed.slice(1)}`;
}

function businessFacingCaveat(value: string): string {
  return value
    .replace(phrasePattern("graph", "operations"), "relationship projection")
    .replace(phrasePattern("canonical", "fact", "store"), "known fact layer")
    .replace(phrasePattern("evidence", "registry"), "evidence layer")
    .replace(phrasePattern("target", "writer"), "data write plan")
    .replace(phrasePattern("promotion", "gate"), "approval control");
}

function phrasePattern(...words: string[]): RegExp {
  return new RegExp(`\\b${words.join("\\s+")}\\b`, "gi");
}

function dedupe(values: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const value of values) {
    const normalized = value.trim().toLowerCase();
    if (!normalized || seen.has(normalized)) continue;
    seen.add(normalized);
    result.push(value.trim());
  }
  return result;
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 }).format(value);
}
