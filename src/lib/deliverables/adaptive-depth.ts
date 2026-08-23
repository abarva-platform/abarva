import type {
  DeliverableArtifactBrief,
  DeliverableIntelligenceRequest,
  ExpectedExhibit,
  BriefSection,
} from "@/lib/deliverables/orchestrator/types";

export type ComplexityTier = "straightforward" | "standard" | "complex";

export type ArtifactApplicability =
  | "required"
  | "lightweight"
  | "merge_into_parent"
  | "not_applicable";

export type StoryBeatApplicability =
  | "required"
  | "triggered"
  | "not_applicable";

export type AdaptiveDepthSignalBasis =
  | "structured"
  | "mixed"
  | "prose_inferred"
  | "default_only";

export type AdaptiveDepthResolutionConfidence = "high" | "medium" | "low";

export interface AdaptiveDepthSignals {
  businessProcessCount: number;
  dataSourceCount: number;
  identityResolutionNeeded: boolean;
  platformNovelty: boolean;
  workflowChange: boolean;
  clinicalRegulatorySensitivity: boolean;
  modelAiComplexity: boolean;
  aiAgentComponent: boolean;
  realTimeRequirement: boolean;
  vendorSourcingDecision: boolean;
  integrationPointCount: number;
  operatingModelImpact: boolean;
  humanDecisionImpact: boolean;
  uncertaintyEvidenceGapCount: number;
  deploymentTopologyMature: boolean;
  securityBoundariesKnown: boolean;
  missingRequiredDimensions: string[];
  declaredStraightforward: boolean;
}

export interface ArtifactApplicabilityDecision {
  applicability: ArtifactApplicability;
  reason: string;
  mergeInto?: string;
}

export interface StoryBeatDecision {
  applicability: StoryBeatApplicability;
  reason: string;
  evidenceState?: "sufficient" | "insufficient_evidence";
}

export interface AdaptiveDepthDecision {
  complexityTier: ComplexityTier;
  score: number;
  reasons: string[];
  signals: AdaptiveDepthSignals;
  signalBasis: AdaptiveDepthSignalBasis;
  resolutionConfidence: AdaptiveDepthResolutionConfidence;
  resolutionConfidenceReasons: string[];
  artifactApplicability: Record<string, ArtifactApplicabilityDecision>;
  storyBeatApplicability: Record<string, StoryBeatDecision>;
  guidance: string[];
}

const DEFAULT_SIGNALS: AdaptiveDepthSignals = {
  businessProcessCount: 1,
  dataSourceCount: 1,
  identityResolutionNeeded: false,
  platformNovelty: false,
  workflowChange: false,
  clinicalRegulatorySensitivity: false,
  modelAiComplexity: false,
  aiAgentComponent: false,
  realTimeRequirement: false,
  vendorSourcingDecision: false,
  integrationPointCount: 0,
  operatingModelImpact: false,
  humanDecisionImpact: false,
  uncertaintyEvidenceGapCount: 0,
  deploymentTopologyMature: false,
  securityBoundariesKnown: false,
  missingRequiredDimensions: [],
  declaredStraightforward: false,
};

function hasAny(text: string, patterns: readonly RegExp[]): boolean {
  return patterns.some((pattern) => pattern.test(text));
}

function hasPositiveSignal(
  text: string,
  patterns: readonly RegExp[],
  negatedPatterns: readonly RegExp[] = [],
): boolean {
  return hasAny(text, patterns) && !hasAny(text, negatedPatterns);
}

function countMatches(text: string, patterns: readonly RegExp[]): number {
  return patterns.reduce(
    (total, pattern) => total + (pattern.test(text) ? 1 : 0),
    0,
  );
}

export function signalsFromMoveText(
  text: string,
  overrides: Partial<AdaptiveDepthSignals> = {},
): AdaptiveDepthSignals {
  const lower = text.toLowerCase();
  const inferred: AdaptiveDepthSignals = {
    ...DEFAULT_SIGNALS,
    businessProcessCount: hasAny(lower, [
      /multi[- ]process/,
      /end[- ]to[- ]end/,
      /cross[- ]functional/,
    ])
      ? 3
      : 1,
    dataSourceCount: hasAny(lower, [
      /multiple data sources/,
      /many data sources/,
      /system of record/,
      /warehouse/,
      /lakehouse/,
    ])
      ? 3
      : 1,
    identityResolutionNeeded: hasPositiveSignal(
      lower,
      [
        /identity resolution/,
        /entity resolution/,
        /matching/,
        /duplicate/,
        /master data/,
      ],
      [/no identity resolution/, /without identity resolution/],
    ),
    platformNovelty: hasPositiveSignal(
      lower,
      [
        /new platform/,
        /platform modernization/,
        /new cloud/,
        /data platform/,
        /lakehouse/,
      ],
      [/no new platform/, /without a new platform/, /no platform change/],
    ),
    workflowChange: hasPositiveSignal(
      lower,
      [
        /workflow change/,
        /process redesign/,
        /operating procedure/,
        /human workflow/,
        /handoff/,
      ],
      [/no workflow change/, /without workflow change/, /no process redesign/],
    ),
    clinicalRegulatorySensitivity: hasAny(lower, [
      /clinical/,
      /patient/,
      /hipaa/,
      /regulated/,
      /sox/,
      /fda/,
      /safety/,
    ]),
    modelAiComplexity: hasPositiveSignal(
      lower,
      [
        /llm/,
        /model risk/,
        /machine learning/,
        /predictive model/,
        /clinical ai/,
        /regulated ai/,
      ],
      [
        /no model risk/,
        /no ai/,
        /without ai/,
        /without model risk/,
        /not an ai/,
      ],
    ),
    aiAgentComponent: hasPositiveSignal(
      lower,
      [/\bai\b/, /agentic/, /\bagent\b/, /copilot/, /llm/],
      [
        /no ai/,
        /without ai/,
        /no agent/,
        /no ai agent/,
        /without an agent/,
        /not an ai/,
      ],
    ),
    realTimeRequirement: hasPositiveSignal(
      lower,
      [
        /real[- ]time/,
        /sub[- ]second/,
        /latency/,
        /streaming/,
        /event[- ]driven/,
      ],
      [
        /no real[- ]time/,
        /without real[- ]time/,
        /no latency requirement/,
        /no streaming/,
        /not real[- ]time/,
      ],
    ),
    vendorSourcingDecision: hasPositiveSignal(
      lower,
      [
        /vendor/,
        /sourcing/,
        /rfp/,
        /partner/,
        /build\/buy/,
        /build buy/,
        /procurement/,
        /outsourcing/,
        /\bams\b/,
      ],
      [
        /no vendor/,
        /without vendor/,
        /no sourcing/,
        /without sourcing/,
        /no build\/buy/,
        /no build buy/,
        /no procurement/,
        /no partner/,
      ],
    ),
    integrationPointCount: hasAny(lower, [
      /integration/,
      /interface/,
      /api/,
      /event bus/,
      /message queue/,
    ])
      ? Math.max(
          2,
          countMatches(lower, [
            /integration/,
            /interface/,
            /api/,
            /event bus/,
            /message queue/,
          ]),
        )
      : 0,
    operatingModelImpact: hasPositiveSignal(
      lower,
      [
        /operating model/,
        /raci/,
        /decision rights/,
        /new role/,
        /service management/,
        /run cadence/,
      ],
      [
        /no operating model/,
        /without operating model/,
        /no decision rights change/,
        /no new role/,
      ],
    ),
    humanDecisionImpact: hasPositiveSignal(
      lower,
      [
        /human approval/,
        /human[- ]in[- ]the[- ]loop/,
        /manual approval/,
        /regulated action/,
        /decision rights/,
      ],
      [
        /no human approval/,
        /without human approval/,
        /no human[- ]in[- ]the[- ]loop/,
        /no regulated action/,
      ],
    ),
    uncertaintyEvidenceGapCount: hasAny(lower, [
      /missing evidence/,
      /evidence gap/,
      /unknown/,
      /to validate/,
      /insufficient evidence/,
    ])
      ? 1
      : 0,
    deploymentTopologyMature: hasPositiveSignal(
      lower,
      [
        /deployment topology/,
        /private endpoint/,
        /region/,
        /subscription/,
        /vnet/,
        /network boundary/,
      ],
      [
        /deployment topology (?:is )?not/,
        /no deployment topology/,
        /deployment topology .*not yet/,
        /topology .*not established/,
      ],
    ),
    securityBoundariesKnown: hasPositiveSignal(
      lower,
      [
        /security boundary/,
        /trust boundary/,
        /private endpoint/,
        /identity provider/,
        /rbac/,
      ],
      [
        /security boundar(?:y|ies) (?:is |are )?not/,
        /no security boundar(?:y|ies)/,
        /security boundar(?:y|ies) .*not yet/,
      ],
    ),
    missingRequiredDimensions: [],
    declaredStraightforward: hasAny(lower, [
      /straightforward/,
      /simple approved pattern/,
      /reusable pattern/,
      /dashboard/,
      /scorecard/,
      /reporting view/,
    ]),
  };
  return { ...inferred, ...overrides };
}

function complexityScore(signals: AdaptiveDepthSignals): number {
  return [
    signals.businessProcessCount > 2
      ? 2
      : signals.businessProcessCount > 1
        ? 1
        : 0,
    signals.dataSourceCount > 3 ? 2 : signals.dataSourceCount > 1 ? 1 : 0,
    signals.identityResolutionNeeded ? 2 : 0,
    signals.platformNovelty ? 1 : 0,
    signals.workflowChange ? 1 : 0,
    signals.clinicalRegulatorySensitivity ? 3 : 0,
    signals.modelAiComplexity ? 2 : 0,
    signals.realTimeRequirement ? 2 : 0,
    signals.vendorSourcingDecision ? 1 : 0,
    signals.integrationPointCount > 4
      ? 2
      : signals.integrationPointCount > 1
        ? 1
        : 0,
    signals.operatingModelImpact ? 1 : 0,
    signals.uncertaintyEvidenceGapCount > 3
      ? 2
      : signals.uncertaintyEvidenceGapCount > 0
        ? 1
        : 0,
  ].reduce((sum, value) => sum + value, 0);
}

function tierFor(score: number, signals: AdaptiveDepthSignals): ComplexityTier {
  if (
    (signals.clinicalRegulatorySensitivity && signals.modelAiComplexity) ||
    score >= 8
  ) {
    return "complex";
  }
  if (score >= 3) return "standard";
  return signals.declaredStraightforward ? "straightforward" : "standard";
}

function reasonList(signals: AdaptiveDepthSignals, score: number): string[] {
  const reasons: string[] = [`complexity score ${score}`];
  if (signals.businessProcessCount > 1)
    reasons.push(`${signals.businessProcessCount} business processes`);
  if (signals.dataSourceCount > 1)
    reasons.push(`${signals.dataSourceCount} data sources`);
  if (signals.identityResolutionNeeded)
    reasons.push("identity resolution required");
  if (signals.platformNovelty) reasons.push("platform novelty");
  if (signals.workflowChange) reasons.push("workflow change");
  if (signals.clinicalRegulatorySensitivity)
    reasons.push("clinical/regulatory sensitivity");
  if (signals.modelAiComplexity) reasons.push("model/AI complexity");
  if (signals.realTimeRequirement) reasons.push("real-time requirement");
  if (signals.vendorSourcingDecision) reasons.push("vendor/sourcing decision");
  if (signals.integrationPointCount > 0)
    reasons.push(`${signals.integrationPointCount} integration point(s)`);
  if (signals.operatingModelImpact) reasons.push("operating-model impact");
  if (signals.uncertaintyEvidenceGapCount > 0)
    reasons.push(`${signals.uncertaintyEvidenceGapCount} evidence gap(s)`);
  return reasons;
}

function signalBasisFor(args: {
  text?: string;
  explicitSignalCount: number;
}): AdaptiveDepthSignalBasis {
  const hasText = (args.text ?? "").trim().length > 0;
  if (args.explicitSignalCount > 0 && hasText) return "mixed";
  if (args.explicitSignalCount > 0) return "structured";
  if (hasText) return "prose_inferred";
  return "default_only";
}

function confidenceFor(args: {
  basis: AdaptiveDepthSignalBasis;
  explicitSignalCount: number;
  score: number;
  signals: AdaptiveDepthSignals;
}): {
  confidence: AdaptiveDepthResolutionConfidence;
  reasons: string[];
} {
  const reasons: string[] = [];
  if (args.explicitSignalCount > 0) {
    reasons.push(`${args.explicitSignalCount} structured signal override(s)`);
  }
  if (args.basis === "prose_inferred") {
    reasons.push("tier inferred from Move/context prose");
  }
  if (args.basis === "default_only") {
    reasons.push("no structured signals or descriptive context supplied");
  }
  if (
    args.signals.clinicalRegulatorySensitivity &&
    args.signals.modelAiComplexity
  ) {
    reasons.push("complex regulated AI override from deterministic signals");
  }
  if (args.score >= 8) reasons.push("high complexity score");
  if (args.signals.declaredStraightforward && args.score < 3) {
    reasons.push("straightforward signal with low complexity score");
  }

  if (args.basis === "structured" && args.explicitSignalCount >= 5) {
    return { confidence: "high", reasons };
  }
  if (args.basis === "mixed" && args.explicitSignalCount >= 3) {
    return { confidence: "high", reasons };
  }
  if (args.basis === "default_only") {
    return { confidence: "low", reasons };
  }
  if (args.basis === "prose_inferred" && args.score < 3) {
    return {
      confidence: "medium",
      reasons: [
        ...reasons,
        "low score; keep lightweight decisions conservative",
      ],
    };
  }
  return { confidence: "medium", reasons };
}

function requiredDimensionMissing(
  signals: AdaptiveDepthSignals,
  key: string,
): boolean {
  return signals.missingRequiredDimensions.includes(key);
}

function artifactDecision(
  artifactKey: string,
  tier: ComplexityTier,
  signals: AdaptiveDepthSignals,
): ArtifactApplicabilityDecision {
  if (artifactKey === "sourcing_strategy" && !signals.vendorSourcingDecision) {
    return {
      applicability: "not_applicable",
      reason: "No deterministic build/buy/vendor/partner decision is present.",
    };
  }
  if (
    (artifactKey === "operating_model_design" ||
      artifactKey === "operating_model") &&
    !signals.operatingModelImpact &&
    tier === "straightforward"
  ) {
    return {
      applicability: "merge_into_parent",
      mergeInto: "solution_design",
      reason:
        "Operating responsibilities do not materially change; include a compact operating note in Solution Design.",
    };
  }
  if (artifactKey === "root_cause_worksheet" && tier === "straightforward") {
    return {
      applicability: "merge_into_parent",
      mergeInto: "discovery_report",
      reason:
        "Root-cause analysis is simple enough to embed in the Current-State Assessment.",
    };
  }
  if (
    (artifactKey === "requirements_traceability" ||
      artifactKey === "target_state_architecture" ||
      artifactKey === "solution_approach_options") &&
    tier === "straightforward"
  ) {
    return {
      applicability: "lightweight",
      reason: "Straightforward Move; use compact decision-grade depth.",
    };
  }
  return {
    applicability: "required",
    reason:
      tier === "complex"
        ? "Complexity signals require full-depth treatment."
        : "Standard artifact depth applies.",
  };
}

function storyBeatDecisions(
  signals: AdaptiveDepthSignals,
): Record<string, StoryBeatDecision> {
  return {
    physical_architecture: requiredDimensionMissing(
      signals,
      "physical_architecture",
    )
      ? {
          applicability: "required",
          evidenceState: "insufficient_evidence",
          reason:
            "Deployment topology/security boundary evidence is required but missing; render Insufficient Evidence, not Not Applicable.",
        }
      : signals.deploymentTopologyMature &&
          (signals.platformNovelty ||
            signals.integrationPointCount > 0 ||
            signals.securityBoundariesKnown)
        ? {
            applicability: "triggered",
            evidenceState: "sufficient",
            reason:
              "Deployment topology, integration pattern, or security boundary is established.",
          }
        : {
            applicability: "not_applicable",
            reason:
              "Deployment topology, integration pattern, and security boundaries are not mature enough for a physical view.",
          },
    ai_orchestration: signals.aiAgentComponent
      ? {
          applicability: "triggered",
          evidenceState: "sufficient",
          reason: "AI/agent component is present.",
        }
      : {
          applicability: "not_applicable",
          reason: "No AI/agent component is present.",
        },
    human_in_loop_design:
      signals.humanDecisionImpact || signals.clinicalRegulatorySensitivity
        ? {
            applicability: "triggered",
            evidenceState: "sufficient",
            reason:
              "The solution influences a human decision or regulated action.",
          }
        : {
            applicability: "not_applicable",
            reason:
              "No governed human decision or regulated action is present.",
          },
    sourcing_analysis: signals.vendorSourcingDecision
      ? {
          applicability: "triggered",
          evidenceState: "sufficient",
          reason: "A genuine vendor/build-buy/partner decision is present.",
        }
      : {
          applicability: "not_applicable",
          reason: "No vendor/build-buy/partner decision is present.",
        },
    real_time_flow: signals.realTimeRequirement
      ? {
          applicability: "triggered",
          evidenceState: "sufficient",
          reason: "Evidence establishes a latency or real-time mechanism.",
        }
      : {
          applicability: "not_applicable",
          reason: "No latency or real-time mechanism is evidenced.",
        },
  };
}

export function resolveAdaptiveDepth(args: {
  text?: string;
  signals?: Partial<AdaptiveDepthSignals>;
  artifactKeys?: readonly string[];
}): AdaptiveDepthDecision {
  const signals = signalsFromMoveText(args.text ?? "", args.signals);
  const explicitSignalCount = Object.keys(args.signals ?? {}).length;
  const signalBasis = signalBasisFor({
    text: args.text,
    explicitSignalCount,
  });
  const confidence = confidenceFor({
    basis: signalBasis,
    explicitSignalCount,
    score: complexityScore(signals),
    signals,
  });
  const score = complexityScore(signals);
  const complexityTier = tierFor(score, signals);
  const artifactKeys = args.artifactKeys?.length
    ? args.artifactKeys
    : [
        "target_state_architecture",
        "solution_design",
        "operating_model_design",
        "requirements_traceability",
        "sourcing_strategy",
      ];
  const artifactApplicability = Object.fromEntries(
    artifactKeys.map((key) => [
      key,
      artifactDecision(key, complexityTier, signals),
    ]),
  );
  return {
    complexityTier,
    score,
    reasons: reasonList(signals, score),
    signals,
    signalBasis,
    resolutionConfidence: confidence.confidence,
    resolutionConfidenceReasons: confidence.reasons,
    artifactApplicability,
    storyBeatApplicability: storyBeatDecisions(signals),
    guidance:
      complexityTier === "straightforward"
        ? [
            "Prefer executive answer -> concise current-state issue -> relevant data/process readiness -> confirmed reusable solution pattern -> architecture on a page -> deterministic estimate -> risks/conditions -> next decision.",
            "Do not invent three options when only one credible pattern exists.",
            "Do not include framework, architecture layer, control, or section solely to appear complete.",
            "Do not pad the artifact to a deep-artifact word target.",
          ]
        : [
            "Use the resolved tier; do not let the model reclassify complexity.",
            "Missing evidence for a required dimension becomes Insufficient Evidence with a closure path, not Not Applicable.",
          ],
  };
}

function applicabilityFor(
  req: DeliverableIntelligenceRequest,
): ArtifactApplicabilityDecision | null {
  const adaptive = req.adaptiveDepth;
  if (!adaptive) return null;
  const direct =
    adaptive.artifactApplicability[req.deliverableType] ??
    adaptive.artifactApplicability[req.deliverableType.replace(/_/g, "-")];
  return direct ?? null;
}

function beat(
  req: DeliverableIntelligenceRequest,
  key: string,
): StoryBeatDecision | null {
  return req.adaptiveDepth?.storyBeatApplicability[key] ?? null;
}

function keepSection(
  req: DeliverableIntelligenceRequest,
  section: BriefSection,
): boolean {
  const adaptive = req.adaptiveDepth;
  const applicability = applicabilityFor(req);
  if (!adaptive || applicability?.applicability === "required") return true;
  const key = section.key;
  if (
    key === "physical_architecture" &&
    beat(req, "physical_architecture")?.applicability === "not_applicable"
  ) {
    return false;
  }
  if (
    key === "agent_orchestration" &&
    beat(req, "ai_orchestration")?.applicability === "not_applicable"
  ) {
    return false;
  }
  if (
    key === "options_considered" &&
    adaptive.complexityTier === "straightforward"
  ) {
    return false;
  }
  return true;
}

function keepExhibit(
  req: DeliverableIntelligenceRequest,
  exhibit: ExpectedExhibit,
): boolean {
  const applicability = applicabilityFor(req);
  if (!req.adaptiveDepth || applicability?.applicability === "required") {
    return true;
  }
  if (
    exhibit.key === "physical_architecture" &&
    beat(req, "physical_architecture")?.applicability === "not_applicable"
  ) {
    return false;
  }
  if (
    exhibit.key === "agent_orchestration" &&
    beat(req, "ai_orchestration")?.applicability === "not_applicable"
  ) {
    return false;
  }
  return true;
}

export function adaptArtifactBriefForDepth(
  req: DeliverableIntelligenceRequest,
  brief: DeliverableArtifactBrief,
): DeliverableArtifactBrief {
  if (!req.adaptiveDepth) return brief;
  const sections = brief.recommendedStructure.filter((section) =>
    keepSection(req, section),
  );
  const expectedExhibits = brief.expectedExhibits.filter((exhibit) =>
    keepExhibit(req, exhibit),
  );
  return {
    ...brief,
    recommendedStructure: sections,
    requiredSections: brief.requiredSections.filter((key) =>
      sections.some((section) => section.key === key),
    ),
    optionalSections: brief.optionalSections.filter((key) =>
      sections.some((section) => section.key === key),
    ),
    expectedExhibits,
  };
}

export function renderAdaptiveDepthPrompt(
  decision?: AdaptiveDepthDecision,
  artifactKey?: string,
): string {
  if (!decision) return "";
  const applicability = artifactKey
    ? decision.artifactApplicability[artifactKey]
    : null;
  const beats = Object.entries(decision.storyBeatApplicability)
    .map(
      ([key, value]) =>
        `- ${key}: ${value.applicability}${value.evidenceState === "insufficient_evidence" ? " / Insufficient Evidence" : ""} - ${value.reason}`,
    )
    .join("\n");
  const artifactLine = applicability
    ? `ARTIFACT APPLICABILITY: ${applicability.applicability}. ${applicability.reason}${applicability.mergeInto ? ` Merge into ${applicability.mergeInto}.` : ""}`
    : "";
  return [
    "ADAPTIVE DEPTH - DETERMINISTIC RESOLUTION:",
    `Resolved complexity tier: ${decision.complexityTier}. Claude must use this tier and must not assign or change it.`,
    `Resolution confidence: ${decision.resolutionConfidence}. Signal basis: ${decision.signalBasis}. ${decision.resolutionConfidenceReasons.join("; ") || "No additional confidence notes."}`,
    `Resolution basis: ${decision.reasons.join("; ")}.`,
    artifactLine,
    "Story-beat applicability:",
    beats,
    "Depth guidance:",
    ...decision.guidance.map((line) => `- ${line}`),
    "Hard adaptive-depth rules:",
    "- Do not generate a separate artifact merely to state that it is not applicable.",
    "- Do not add empty Not Applicable sections.",
    "- Do not invent Basic / Intermediate / Advanced options when the evidence supports one reusable pattern.",
    "- Do not include AI/model-risk, human-in-the-loop, physical architecture, sourcing, real-time, or operating-model content unless triggered above or marked required with Insufficient Evidence.",
    "- A missing required dimension must be rendered as Insufficient Evidence with closure path, never hidden as Not Applicable.",
  ]
    .filter(Boolean)
    .join("\n");
}

export function shouldGenerateArtifact(
  decision: AdaptiveDepthDecision,
  artifactKey: string,
): boolean {
  const applicability = decision.artifactApplicability[artifactKey];
  return !(
    applicability?.applicability === "not_applicable" ||
    applicability?.applicability === "merge_into_parent"
  );
}
