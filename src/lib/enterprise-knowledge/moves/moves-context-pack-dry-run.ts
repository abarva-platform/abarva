import type {
  ContextPackMode,
  EntityProfile,
  ModuleContextRequest,
  ModuleContextResponse,
  ModuleContextScope,
  MovesContextPack,
  RequestedKnowledgeDomain,
} from "../contracts";
import {
  assembleModuleContext,
  classifyContextIntent,
  resolveContextAssemblyInput,
  type ContextSourceCatalogEntry,
  type IntentClassification,
} from "../assembler";

export interface MovesContextPackDryRunInput {
  tenantKey: string;
  question: string;
  phase: NonNullable<ModuleContextScope["phase"]>;
  moveId?: string;
  mode?: ContextPackMode;
  knownEntities?: string[];
}

export interface MovesPhasePackSections {
  phase: MovesContextPack["phase"];
  phasePurpose: string;
  impactedFunctions: string[];
  relevantSystems: string[];
  dataDomains: string[];
  ownersAndParticipants: string[];
  baselineCandidates: string[];
  risksAndControls: string[];
  vendorAndSpendContext: string[];
  evidenceRefs: string[];
  requiredUploads: string[];
  safeToUse: string[];
  notSafeToClaim: string[];
  nextEvidence: string[];
}

export interface MovesContextPackDryRunResult {
  request: ModuleContextRequest;
  intent: IntentClassification;
  selectedCatalogKey: string;
  resolutionScore: number;
  matchedTokens: string[];
  fallbackBehavior: {
    usedFallbackEntityExtraction: boolean;
    reason: string;
    entityCandidates: string[];
  };
  response: ModuleContextResponse;
  movesContextPack: MovesContextPack;
  phaseSections: MovesPhasePackSections;
}

const MOVES_DOMAINS: RequestedKnowledgeDomain[] = [
  "enterprise_profile",
  "functions",
  "processes",
  "applications_systems",
  "data_domains",
  "infrastructure",
  "vendors_contracts",
  "programs",
  "risks_controls",
  "metrics_outcomes",
  "use_cases",
  "relationships",
  "evidence",
];

export function buildMovesContextPackDryRun(params: {
  input: MovesContextPackDryRunInput;
  catalog: ContextSourceCatalogEntry[];
  generatedAt: string;
}): MovesContextPackDryRunResult {
  const request = buildMovesRequest(params.input);
  const intent = classifyContextIntent(request);
  const resolved = resolveContextAssemblyInput({
    request,
    intent,
    catalog: params.catalog,
    generatedAt: params.generatedAt,
  });
  const response = assembleModuleContext(resolved);
  const movesContextPack = response.contextPack as MovesContextPack;
  const fallbackBehavior = buildFallbackBehavior(
    params.input.question,
    intent,
    resolved.resolution.matchedTokens,
  );
  return {
    request,
    intent,
    selectedCatalogKey: resolved.resolution.selectedCatalogKey,
    resolutionScore: resolved.resolution.score,
    matchedTokens: resolved.resolution.matchedTokens,
    fallbackBehavior,
    response,
    movesContextPack,
    phaseSections: buildMovesPhaseSections(movesContextPack, params.input.phase),
  };
}

function buildMovesRequest(input: MovesContextPackDryRunInput): ModuleContextRequest {
  return {
    tenantKey: input.tenantKey,
    moduleKey: "moves",
    purpose: "phase_readiness",
    mode: input.mode ?? "active",
    requestedDomains: MOVES_DOMAINS,
    scope: {
      moveId: input.moveId,
      phase: input.phase,
      question: input.question,
      useCase: input.question,
      requiredEvidenceFamilies: input.knownEntities,
    },
    evidencePolicy: "lineage_required",
    relationshipPolicy: "validated_and_candidate",
    actorKey: "moves-context-pack-dry-run",
  };
}

function buildFallbackBehavior(
  question: string,
  intent: IntentClassification,
  matchedTokens: string[],
): MovesContextPackDryRunResult["fallbackBehavior"] {
  const ignored = new Set([
    "should",
    "want",
    "explore",
    "help",
    "with",
    "what",
    "when",
    "where",
    "which",
    "this",
    "that",
    "from",
    "into",
    "using",
  ]);
  const matched = new Set([...matchedTokens, ...intent.matchedSignals]);
  const entityCandidates = question
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length > 3)
    .filter((token) => !ignored.has(token))
    .filter((token) => !matched.has(token))
    .slice(0, 8);
  const usedFallbackEntityExtraction = entityCandidates.length > 0;
  return {
    usedFallbackEntityExtraction,
    reason: usedFallbackEntityExtraction
      ? "The question included useful entity terms outside the resolved catalog match; they are preserved as candidate discovery terms."
      : "The request resolved directly through archetype and catalog signals.",
    entityCandidates,
  };
}

export function buildMovesPhaseSections(
  pack: MovesContextPack,
  phase: NonNullable<ModuleContextScope["phase"]>,
): MovesPhasePackSections {
  const profiles = pack.relevantEntityProfiles;
  const systems = namesByType(profiles, "system");
  const functions = namesByType(profiles, "function");
  const dataDomains = namesByType(profiles, "data_domain");
  const vendors = namesByType(profiles, "vendor");
  const metrics = namesByType(profiles, "metric");
  const risks = namesByType(profiles, "risk");
  const programs = namesByType(profiles, "program");
  const uploads = requiredUploadsForPhase(phase, pack);

  return {
    phase: pack.phase,
    phasePurpose: phasePurpose(phase),
    impactedFunctions: functions,
    relevantSystems: systems,
    dataDomains,
    ownersAndParticipants: participantCandidates(phase, functions, vendors),
    baselineCandidates: phase === "P0" ? [] : metrics,
    risksAndControls: risks,
    vendorAndSpendContext: [...vendors, ...namesByType(profiles, "contract")],
    evidenceRefs: pack.evidence.map((evidence) => evidence.evidenceId),
    requiredUploads: uploads,
    safeToUse: [
      "source-backed entity profiles",
      "synthetic-review evidence references",
      "relationship candidates with caveats",
      "known gaps and unsupported claims",
      ...programs.map((program) => `program context: ${program}`),
    ],
    notSafeToClaim: pack.unsupportedClaims.map((claim) => claim.description),
    nextEvidence: Array.from(new Set([...pack.recommendedNextEvidence, ...uploads])),
  };
}

function namesByType(
  profiles: EntityProfile[],
  entityType: EntityProfile["entityType"],
): string[] {
  return profiles
    .filter((profile) => profile.entityType === entityType)
    .map((profile) => profile.entityName);
}

function participantCandidates(
  phase: NonNullable<ModuleContextScope["phase"]>,
  functions: string[],
  vendors: string[],
): string[] {
  const base = [
    "business sponsor",
    "product owner",
    "architecture lead",
    "data owner",
    "risk/control owner",
  ];
  if (phase === "P0" || phase === "P1") {
    return Array.from(new Set([...base, ...functions.map((item) => `${item} owner`)]));
  }
  return Array.from(new Set([...base, "finance partner", "implementation lead", ...vendors]));
}

function phasePurpose(phase: NonNullable<ModuleContextScope["phase"]>): string {
  switch (phase) {
    case "P0":
      return "Frame the decision, identify impacted domains, and name the first evidence gaps.";
    case "P1":
      return "Shape charter scope, baseline candidates, owners, and missing baseline evidence.";
    case "P2":
      return "Pressure-test current state across process, systems, data, roles, metrics, risks, and uploads.";
    case "P3":
      return "Compare option dependencies, architecture implications, vendor/spend context, and evidence caveats.";
    case "P4":
      return "Prepare executive decision context with safe claims, unsupported claims, risks, metrics, and confidence.";
    case "P5":
      return "Prepare execution handoff context for owners, roadmap, vendors, Tower/Source, metrics, risks, and gaps.";
  }
}

function requiredUploadsForPhase(
  phase: NonNullable<ModuleContextScope["phase"]>,
  pack: MovesContextPack,
): string[] {
  const shared = ["source-owner attestation", "relationship validation notes"];
  const phaseUploads: Record<NonNullable<ModuleContextScope["phase"]>, string[]> = {
    P0: ["decision framing note", "impacted function owner list"],
    P1: ["charter draft", "baseline metric extract", "scope boundary notes"],
    P2: ["current-state process map", "system/data lineage export", "risk/control review notes"],
    P3: ["option comparison", "architecture dependency map", "vendor/spend extract"],
    P4: ["decision memo", "budget/value baseline", "unsupported-claim review"],
    P5: ["execution roadmap", "handoff owner map", "Tower/Source measurement plan"],
  };
  return Array.from(new Set([...shared, ...phaseUploads[phase], ...pack.gaps.flatMap((gap) => gap.requiredEvidence)]));
}
