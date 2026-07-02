import { getAuditedAnthropicClient } from "@/lib/agent/stream";
import {
  buildModuleV6PacketContract,
  moduleV6PacketPromptBlock,
  type ModuleV6PacketContract,
} from "@/lib/agent/module-v6-answer-contract";
import type { AdvisoryPacket } from "@/lib/intelligence/advisory-packet";
import type {
  IntelligenceArtifactType,
  IntelligenceDimension,
  IntelligenceDossier,
  IntelligenceIntent,
} from "@/lib/intelligence/dossiers";
import { cleanIntelligenceModelInput } from "@/lib/intelligence/model-input-cleaner";
import {
  INTELLIGENCE_TABBED_OUTPUT_CONTRACT,
  parseIntelligenceTabbedResponse,
} from "@/lib/intelligence/tabbed-response";
import { hasExecutiveCanvasPayload } from "@/lib/intelligence/executive-canvas-payload";
import {
  createIntelligenceLatencyTrace,
  summarizeTextPayload,
  type IntelligenceLatencyTiming,
} from "@/lib/intelligence/latency-trace";

const DEFAULT_MODEL = "claude-opus-4-7";
const DEFAULT_MAX_TOKENS = 25_000;
const DEFAULT_TIMEOUT_MS = 90_000;

const RAW_ID_RE =
  /\b[A-Z]{2,16}-[A-Z0-9]{2,24}-\d{2,8}\b|\b[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\b/i;
const INTERNAL_RE =
  /\b(home_know|read-model|route used|localhost|\/Users\/|debug|packet json|source_record_id)\b/i;
const SESSION_CONTEXT_RE =
  /\b(as discussed|as mentioned|this session|earlier in this session|earlier in the session|previous conversation|prior conversation|answer has(?:n't| not) changed|same answer|keeps being the right answer)\b/i;
const OLD_SECTION_RE = /^\s*(?:Read|Evidence|Implication|Next move)\s*:/gim;

const MARKDOWN_TABLE_SEPARATOR_RE =
  /^\s*\|?\s*:?-{3,}:?\s*(?:\|\s*:?-{3,}:?\s*)+\|?\s*$/m;

export const INTELLIGENCE_CONSULTANT_TEXT_SYSTEM_PROMPT = `You are AbarVa's Intelligence advisor.

You advise CIO, CFO, COO, CDO, transformation, and executive sponsor audiences.

You are not a generic chatbot. You are not retrieving data. You are not inventing facts.

You will receive an Intelligence advisory packet containing tenant evidence, corpus patterns, benchmarks, options, tradeoffs, risks, caveats, missing evidence, and citations.

Use only the provided packet.

Tenant facts prove.
Corpus patterns compare.
Benchmarks calibrate.
You synthesize.
AbarVa verifies, cites, and renders supporting panels.

Your answer must have a clear advisory shape:
1. Lead with the executive answer in the first paragraph.
2. Explain the evidence spine in business language.
3. Give options, tradeoffs, and sequencing when the question asks what to do.
4. State caveats and missing evidence after the useful answer, not before it.
5. Use a compact Markdown table when comparing initiatives, options, workstreams, costs, or value.
6. Keep paragraphs short: no paragraph should exceed three sentences.

Clearly separate tenant facts, corpus patterns, benchmarks, options/tradeoffs, and missing evidence in natural prose.

Tenant facts are the source of truth for this enterprise.
Corpus patterns are precedent, not proof.
Benchmarks calibrate, but must be caveated.
Recommendations must be proportional to the evidence.

Write like a senior consulting partner preparing an executive advisory answer. Be specific, direct, and readable.

Do not expose raw IDs, table names, route names, debug labels, internal source names, or implementation details.
Do not claim exact ROI unless the packet provides support.
Do not say a recommendation is high confidence if tenant evidence is thin.
Do not mix another tenant's actual data into this tenant's answer.
Do not use the old transcript labels "Read:", "Evidence:", "Implication:", or "Next move:".
Do not refer to prior conversation state. Avoid phrases like "as discussed", "this session", "earlier in this session", "previous conversation", "same answer", or "answer hasn't changed". Every answer must stand alone for the current question.
Do not mention expert packs, binders, dossiers, semantic layers, prompt packets, source rows, edge rows, debug traces, or route decisions.
Do not return arbitrary JSON. The only JSON exception is the governed fenced \`abarva-canvas\` block described below; it is a renderer contract, not user-facing prose.

${INTELLIGENCE_TABBED_OUTPUT_CONTRACT}`;

export interface IntelligenceConsultantTextResult {
  used: true;
  text: string;
  promptPacket: IntelligenceConsultantPromptPacket;
  rawText: string;
  trace: {
    attempted: true;
    used: true;
    model: string;
    auditId: string;
    validationIssues: string[];
  };
}

export interface IntelligenceConsultantTextFailure {
  attempted: true;
  used: false;
  model?: string;
  auditId?: string;
  reason: string;
  validationIssues: string[];
}

export interface IntelligenceConsultantPromptPacket {
  tenantBrief: {
    tenantKey: string;
    tenantName: string;
    evidenceStrength: IntelligenceDossier["tenantEvidenceDossier"]["confidence"];
  };
  questionBrief: {
    originalQuestion: string;
    intelligenceIntent: IntelligenceDossier["intelligenceIntent"];
    primaryDimension: IntelligenceDossier["primaryDimension"];
    relatedDimensions: IntelligenceDossier["relatedDimensions"];
    expectedArtifacts: IntelligenceDossier["artifactPlan"];
  };
  tenantEvidenceBrief: {
    factsThatMatter: string[];
    metricsThatMatter: string[];
    relationshipPathsThatMatter: string[];
    missingEvidence: string[];
    citations: string[];
  };
  corpusPatternBrief: {
    selectedPatternFamilies: string[];
    patternSummaries: string[];
    excludedPatterns: string[];
  };
  advisoryLensBrief: {
    lenses: string[];
    pressureTestQuestions: string[];
    likelyConcerns: string[];
  };
  benchmarkBrief: {
    benchmarkClaims: string[];
    roiRanges: string[];
    implementationCaveats: string[];
  };
  optionsBrief: {
    options: string[];
    tradeoffs: string[];
    decisionCriteria: string[];
  };
  riskCaveatBrief: {
    tenantEvidenceGaps: string[];
    dataReadinessGaps: string[];
    operatingModelRisks: string[];
    governanceRisks: string[];
    executionRisks: string[];
    measurementRisks: string[];
  };
  evidenceBoundary: IntelligenceDossier["evidenceBoundary"];
}

export function isIntelligenceConsultantTextSynthesisEnabled(): boolean {
  const raw =
    process.env.INTELLIGENCE_CLAUDE_SYNTHESIS_ENABLED?.trim().toLowerCase();
  if (raw === "false" || raw === "0" || raw === "off") return false;
  if (raw === "true" || raw === "1" || raw === "on") return true;
  return process.env.NODE_ENV === "production";
}

export function buildIntelligenceConsultantPromptPacket(
  dossier: IntelligenceDossier,
): IntelligenceConsultantPromptPacket {
  return cleanIntelligenceModelInput({
    tenantBrief: {
      tenantKey: dossier.tenantKey,
      tenantName: dossier.tenantName,
      evidenceStrength: dossier.tenantEvidenceDossier.confidence,
    },
    questionBrief: {
      originalQuestion: dossier.question,
      intelligenceIntent: dossier.intelligenceIntent,
      primaryDimension: dossier.primaryDimension,
      relatedDimensions: dossier.relatedDimensions,
      expectedArtifacts: dossier.artifactPlan,
    },
    tenantEvidenceBrief: {
      factsThatMatter: dossier.evidenceBoundary.tenantFacts.slice(0, 10),
      metricsThatMatter: dossier.tenantEvidenceDossier.metrics
        .map((metric) => `${metric.label}: ${metric.value} (${metric.basis})`)
        .slice(0, 8),
      relationshipPathsThatMatter:
        dossier.tenantEvidenceDossier.relationshipPaths
          .map(
            (path) =>
              `${path.from} ${path.relationship} ${path.to}: ${path.label}`,
          )
          .slice(0, 8),
      missingEvidence: dossier.evidenceBoundary.missingTenantEvidence.slice(
        0,
        10,
      ),
      citations: dossier.tenantEvidenceDossier.citations
        .map((citation) => citation.label)
        .slice(0, 10),
    },
    corpusPatternBrief: {
      selectedPatternFamilies:
        dossier.corpusPatternDossier.patternFamilies.slice(0, 8),
      patternSummaries: dossier.evidenceBoundary.corpusPatterns.slice(0, 10),
      excludedPatterns: dossier.corpusPatternDossier.patternsExcluded
        .map((pattern) => `${pattern.patternName}: ${pattern.reasonExcluded}`)
        .slice(0, 5),
    },
    advisoryLensBrief: {
      lenses: dossier.relatedDimensions.slice(0, 6),
      pressureTestQuestions: [
        `What tenant evidence proves or weakens the ${dossier.primaryDimension} answer?`,
        "Which claims are tenant facts versus corpus/pattern-only guidance?",
        "What must be validated before a scale, hold, or investment decision?",
      ],
      likelyConcerns: [
        ...dossier.riskCaveatDossier.dataReadinessGaps,
        ...dossier.riskCaveatDossier.measurementRisks,
      ].slice(0, 7),
    },
    benchmarkBrief: {
      benchmarkClaims: dossier.evidenceBoundary.benchmarkClaims.slice(0, 8),
      roiRanges: dossier.benchmarkDossier.roiRanges
        .map((range) => `${range.range}: ${range.basis}; ${range.caveat}`)
        .slice(0, 6),
      implementationCaveats:
        dossier.benchmarkDossier.implementationCaveats.slice(0, 8),
    },
    optionsBrief: {
      options: dossier.decisionOptionsDossier.options
        .map(
          (option) =>
            `${option.title}: ${option.recommendedUse}; value=${option.expectedValue}; complexity=${option.executionComplexity}; risk=${option.riskLevel}; missing=${option.missingEvidence.join(", ") || "none named"}`,
        )
        .slice(0, 6),
      tradeoffs: dossier.decisionOptionsDossier.tradeoffs.slice(0, 8),
      decisionCriteria: [
        dossier.decisionOptionsDossier.recommendedDecisionFrame,
        ...dossier.decisionOptionsDossier.options.flatMap(
          (option) => option.prerequisites,
        ),
      ]
        .filter(Boolean)
        .slice(0, 8),
    },
    riskCaveatBrief: {
      tenantEvidenceGaps: dossier.riskCaveatDossier.tenantEvidenceGaps.slice(
        0,
        8,
      ),
      dataReadinessGaps: dossier.riskCaveatDossier.dataReadinessGaps.slice(
        0,
        8,
      ),
      operatingModelRisks: dossier.riskCaveatDossier.operatingModelRisks.slice(
        0,
        8,
      ),
      governanceRisks: dossier.riskCaveatDossier.governanceRisks.slice(0, 8),
      executionRisks: dossier.riskCaveatDossier.executionRisks.slice(0, 8),
      measurementRisks: dossier.riskCaveatDossier.measurementRisks.slice(0, 8),
    },
    evidenceBoundary: dossier.evidenceBoundary,
  });
}

export function buildIntelligenceConsultantPromptPacketFromAdvisoryPacket(
  packet: AdvisoryPacket,
): IntelligenceConsultantPromptPacket {
  const model = packet.modelVisiblePacket;
  const primaryDimension =
    (packet.questionIntent.selectedDimensions[0] as
      | IntelligenceDimension
      | undefined) ?? "enterprise_strategy";
  const expectedArtifacts = (
    model.outputInstructions.some((instruction) =>
      /table|chart/i.test(instruction),
    )
      ? ["executive_answer", "table"]
      : ["executive_answer"]
  ) as IntelligenceArtifactType[];
  return cleanIntelligenceModelInput({
    tenantBrief: {
      tenantKey: packet.tenantIdentity.tenantKey,
      tenantName: packet.tenantIdentity.tenantName,
      evidenceStrength:
        packet.retrievalDiagnostics.evidenceIntegrityScore >= 4
          ? "strong"
          : packet.retrievalDiagnostics.evidenceIntegrityScore >= 3
            ? "partial"
            : "thin",
    },
    questionBrief: {
      originalQuestion: packet.questionIntent.originalQuestion,
      intelligenceIntent: packet.questionIntent.intent as IntelligenceIntent,
      primaryDimension,
      relatedDimensions: packet.questionIntent.selectedDimensions.slice(
        1,
      ) as IntelligenceDimension[],
      expectedArtifacts,
    },
    tenantEvidenceBrief: {
      factsThatMatter: model.tenantFacts
        .map((fact) => fact.statement)
        .slice(0, 12),
      metricsThatMatter: model.metrics
        .map((metric) => `${metric.label}: ${metric.value} (${metric.basis})`)
        .slice(0, 10),
      relationshipPathsThatMatter: model.relationships
        .map(
          (relationship) =>
            `${relationship.from} ${relationship.relationship} ${relationship.to}: ${relationship.implication}`,
        )
        .slice(0, 10),
      missingEvidence: model.gaps
        .map(
          (gap) => `${gap.statement} Implication: ${gap.decisionImplication}`,
        )
        .slice(0, 10),
      citations: [],
    },
    corpusPatternBrief: {
      selectedPatternFamilies: model.corpusContext
        .map((context) => context.label)
        .slice(0, 8),
      patternSummaries: model.corpusContext
        .map((context) => `${context.label}: ${context.summary}`)
        .slice(0, 10),
      excludedPatterns:
        packet.retrievalDiagnostics.corpusRole === "MISSING"
          ? ["Corpus context is needed but not available for this question."]
          : [],
    },
    advisoryLensBrief: {
      lenses: model.expertLenses
        .map((lens) => `${lens.lens}: ${lens.role}`)
        .slice(0, 8),
      pressureTestQuestions: model.expertLenses
        .map((lens) => lens.pressureTest)
        .slice(0, 10),
      likelyConcerns: model.gaps
        .map((gap) => gap.decisionImplication)
        .slice(0, 8),
    },
    benchmarkBrief: {
      benchmarkClaims: (model.benchmarkContext ?? [])
        .map(
          (benchmark) =>
            `${benchmark.claim} Basis: ${benchmark.basis}. Caveat: ${benchmark.caveat}`,
        )
        .slice(0, 8),
      roiRanges: [],
      implementationCaveats: [
        "Benchmarks and industry context calibrate the answer; they are not tenant facts unless the packet labels them as tenant evidence.",
      ],
    },
    optionsBrief: {
      options: model.entities
        .filter((entity) =>
          ["initiative", "capability", "system", "data-product"].includes(
            entity.kind,
          ),
        )
        .slice(0, 6)
        .map(
          (entity) =>
            `${entity.name}: assess; value=see tenant facts; complexity=not shown in loaded sources; risk=validate readiness; missing=${model.gaps[0]?.statement ?? "none named"}`,
        ),
      tradeoffs: model.relationships
        .map((relationship) => relationship.implication)
        .slice(0, 8),
      decisionCriteria: [
        ...model.expertLenses.map((lens) => lens.pressureTest),
        ...model.gaps.map((gap) => gap.decisionImplication),
      ].slice(0, 10),
    },
    riskCaveatBrief: {
      tenantEvidenceGaps: model.gaps.map((gap) => gap.statement).slice(0, 8),
      dataReadinessGaps: model.gaps
        .filter((gap) =>
          /data|lineage|freshness|readiness|baseline/i.test(gap.statement),
        )
        .map((gap) => gap.statement)
        .slice(0, 8),
      operatingModelRisks: model.gaps
        .filter((gap) =>
          /owner|accountable|workflow|operating/i.test(gap.statement),
        )
        .map((gap) => gap.statement)
        .slice(0, 8),
      governanceRisks: model.gaps
        .filter((gap) =>
          /risk|control|guardrail|audit|compliance|legal/i.test(gap.statement),
        )
        .map((gap) => gap.statement)
        .slice(0, 8),
      executionRisks: model.relationships
        .map((relationship) => relationship.implication)
        .slice(0, 8),
      measurementRisks: model.gaps
        .filter((gap) =>
          /value|benefit|baseline|roi|measure/i.test(gap.statement),
        )
        .map((gap) => gap.statement)
        .slice(0, 8),
    },
    evidenceBoundary: {
      tenantFacts: model.tenantFacts.map((fact) => fact.statement).slice(0, 12),
      corpusPatterns: model.corpusContext
        .map((context) => context.summary)
        .slice(0, 10),
      expertInterpretations: model.expertLenses
        .map((lens) => `${lens.lens}: ${lens.whySelected}`)
        .slice(0, 8),
      benchmarkClaims: (model.benchmarkContext ?? [])
        .map((benchmark) => benchmark.claim)
        .slice(0, 8),
      missingTenantEvidence: model.gaps
        .map((gap) => gap.statement)
        .slice(0, 10),
      cannotConclude: [
        "Industry context as tenant fact.",
        "Exact ROI, dollars, dates, owner accountability, or readiness without model-visible tenant support.",
      ],
    },
  } satisfies IntelligenceConsultantPromptPacket);
}

export function buildIntelligenceConsultantUserPrompt(
  packet: IntelligenceConsultantPromptPacket,
): string {
  return [
    `Question:\n${packet.questionBrief.originalQuestion}`,
    "",
    `Tenant:\n${packet.tenantBrief.tenantName} (${packet.tenantBrief.tenantKey})`,
    "",
    `Intelligence intent:\n${packet.questionBrief.intelligenceIntent}`,
    "",
    `Primary dimension:\n${packet.questionBrief.primaryDimension}`,
    "",
    `Related dimensions:\n${packet.questionBrief.relatedDimensions.join(", ") || "none"}`,
    "",
    "Tenant evidence:",
    JSON.stringify(packet.tenantEvidenceBrief, null, 2),
    "",
    "Corpus patterns:",
    JSON.stringify(packet.corpusPatternBrief, null, 2),
    "",
    "Advisory lenses:",
    JSON.stringify(packet.advisoryLensBrief, null, 2),
    "",
    "Benchmarks:",
    JSON.stringify(packet.benchmarkBrief, null, 2),
    "",
    "Options and tradeoffs:",
    JSON.stringify(packet.optionsBrief, null, 2),
    "",
    "Risks, caveats, and missing evidence:",
    JSON.stringify(packet.riskCaveatBrief, null, 2),
    "",
    "Evidence boundary:",
    JSON.stringify(packet.evidenceBoundary, null, 2),
    "",
    "Instructions:",
    "Write the best possible Intelligence answer from this packet.",
    `The first user-visible sentence must begin with exactly "${packet.tenantBrief.tenantName}". Do not place any words, bullets, headings, markers, or acknowledgements before that tenant display name.`,
    `If your natural opening would not start with "${packet.tenantBrief.tenantName}", rewrite only the opening sentence so it does.`,
    "Start with the executive answer in one short paragraph after the tenant-name opener.",
    "Then explain the evidence spine: what the tenant facts support, what corpus/pattern content adds, and what benchmark context calibrates.",
    "When the user asks what to prioritize, kill, sequence, compare, fund, or investigate, include options and tradeoffs.",
    "When comparing multiple items, include a compact Markdown table with business-friendly columns.",
    "Use the decision-canvas tab markers when the answer benefits from drill-downs.",
    "For AI investment, IROPS, prioritization, scale/hold/kill, and portfolio questions, include Decision, Industry Insights, Evidence, and a Table or Chart tab when the packet contains chart-ready or table-ready data.",
    "Chart tabs may show tenant data, industry trend data, directional benchmark data, peer-pattern maps, or function/category opportunity maps. If the chart is not tenant evidence, label the tab grounding and the first line honestly.",
    "Do not place Markdown tables in the main answer or inside Decision, Industry Insights, or Evidence tabs. Put every Markdown table inside a separate Table or Chart tab.",
    "State confidence and missing evidence after the useful synthesis, not as the opening.",
    "Suggest the appropriate handoff to Moves, Source, or Tower when relevant.",
    "Keep every paragraph to three sentences or fewer.",
    "Return final user-facing text only.",
  ].join("\n");
}

function buildIntelligenceV6AdvisoryPacketContract(args: {
  dossier: IntelligenceDossier;
  promptPacket: IntelligenceConsultantPromptPacket;
}): ModuleV6PacketContract {
  return buildModuleV6PacketContract({
    surface: "intelligence",
    packetType: "advisory-packet",
    tenantKey: args.promptPacket.tenantBrief.tenantKey,
    tenantName: args.promptPacket.tenantBrief.tenantName,
    question: args.promptPacket.questionBrief.originalQuestion,
    packetSummary: [
      `Intent ${args.promptPacket.questionBrief.intelligenceIntent}`,
      `primary dimension ${args.promptPacket.questionBrief.primaryDimension}`,
      `${args.promptPacket.tenantEvidenceBrief.factsThatMatter.length} tenant facts`,
      `${args.promptPacket.tenantEvidenceBrief.metricsThatMatter.length} metrics`,
      `${args.promptPacket.tenantEvidenceBrief.relationshipPathsThatMatter.length} relationships`,
      `${args.promptPacket.corpusPatternBrief.patternSummaries.length} corpus patterns`,
      `${args.promptPacket.advisoryLensBrief.lenses.length} advisory lenses`,
    ].join(". "),
    requiredEvidenceFamilies: [
      "tenant facts",
      "named entities",
      "relationships",
      "metrics or maturity signals",
      "missing evidence",
      "industry/corpus context",
      "expert lenses",
    ],
    availableEvidenceFamilies: [
      ...(args.promptPacket.tenantEvidenceBrief.factsThatMatter.length
        ? ["tenant facts"]
        : []),
      ...(args.promptPacket.tenantEvidenceBrief.metricsThatMatter.length
        ? ["metrics"]
        : []),
      ...(args.promptPacket.tenantEvidenceBrief.relationshipPathsThatMatter
        .length
        ? ["relationships"]
        : []),
      ...(args.promptPacket.corpusPatternBrief.patternSummaries.length
        ? ["industry/corpus context"]
        : []),
      ...(args.promptPacket.advisoryLensBrief.lenses.length
        ? ["expert lenses"]
        : []),
    ],
    missingEvidence: [
      ...args.promptPacket.tenantEvidenceBrief.missingEvidence,
      ...args.dossier.evidenceBoundary.cannotConclude.map(
        (item) => `Cannot conclude: ${item}`,
      ),
    ].slice(0, 16),
  });
}

export async function synthesizeIntelligenceConsultantText(args: {
  dossier: IntelligenceDossier;
  advisoryPacket?: AdvisoryPacket;
  tenantId: string | null | undefined;
  userId?: string | null;
  onModelInput?: (parts: { system: string; user: string }) => void;
  onModelOutput?: (parts: {
    rawText: string;
    text: string;
    model?: string;
    auditId?: string;
    route: string;
  }) => void;
  onTiming?: (timing: IntelligenceLatencyTiming) => void;
  latencyTraceId?: string | null;
  latencyStartedAt?: number;
}): Promise<
  IntelligenceConsultantTextResult | IntelligenceConsultantTextFailure | null
> {
  if (!isIntelligenceConsultantTextSynthesisEnabled()) {
    return {
      attempted: true,
      used: false,
      reason: "env_disabled",
      validationIssues: [],
    };
  }
  const tenantId = args.tenantId?.trim();
  if (!tenantId) {
    return {
      attempted: true,
      used: false,
      reason: "tenant_id_required",
      validationIssues: [],
    };
  }
  if (!process.env.ANTHROPIC_API_KEY) {
    return {
      attempted: true,
      used: false,
      reason: "anthropic_not_configured",
      validationIssues: [],
    };
  }

  const model = process.env.INTELLIGENCE_CLAUDE_MODEL?.trim() || DEFAULT_MODEL;
  const maxTokens = numberFromEnv(
    "INTELLIGENCE_CLAUDE_MAX_TOKENS",
    DEFAULT_MAX_TOKENS,
  );
  const timeoutMs = numberFromEnv(
    "INTELLIGENCE_CLAUDE_TIMEOUT_MS",
    DEFAULT_TIMEOUT_MS,
  );
  const promptPacket = args.advisoryPacket
    ? buildIntelligenceConsultantPromptPacketFromAdvisoryPacket(
        args.advisoryPacket,
      )
    : buildIntelligenceConsultantPromptPacket(args.dossier);
  const v6PacketContract = buildIntelligenceV6AdvisoryPacketContract({
    dossier: args.dossier,
    promptPacket,
  });
  const user = [
    buildIntelligenceConsultantUserPrompt(promptPacket),
    moduleV6PacketPromptBlock(v6PacketContract),
  ].join("\n\n");
  const prompt = [INTELLIGENCE_CONSULTANT_TEXT_SYSTEM_PROMPT, user].join(
    "\n\n",
  );
  const explicitVisualAsk = isExplicitVisualAsk(args.dossier.question);
  const latencyTrace = createIntelligenceLatencyTrace({
    requestId: args.latencyTraceId,
    startedAt: args.latencyStartedAt,
  });
  const emitTiming = (timing: IntelligenceLatencyTiming) => {
    args.onTiming?.(timing);
  };
  emitTiming(
    latencyTrace.mark("consultant.prompt.constructed", {
      systemChars: INTELLIGENCE_CONSULTANT_TEXT_SYSTEM_PROMPT.length,
      systemApproxTokens: summarizeTextPayload(
        INTELLIGENCE_CONSULTANT_TEXT_SYSTEM_PROMPT,
      ).approxTokens,
      userChars: user.length,
      userApproxTokens: summarizeTextPayload(user).approxTokens,
      maxTokens,
      model,
    }),
  );

  args.onModelInput?.({
    system: INTELLIGENCE_CONSULTANT_TEXT_SYSTEM_PROMPT,
    user,
  });

  try {
    const clientStartedAt = Date.now();
    const { client, auditId } = await getAuditedAnthropicClient({
      tenantId,
      userId: args.userId ?? undefined,
      workflow: "intelligence-consultant-text-synthesis",
      model,
      prompt,
      dataClass: "confidential",
      metadata: {
        intelligenceIntent: args.dossier.intelligenceIntent,
        primaryDimension: args.dossier.primaryDimension,
        tenantEvidenceStrength: args.dossier.tenantEvidenceDossier.confidence,
        advisoryLensCount: args.dossier.relatedDimensions.length,
        corpusPatternFamilyCount:
          args.dossier.corpusPatternDossier.patternFamilies.length,
      },
    });
    emitTiming(
      latencyTrace.finish("consultant.claude.client.ready", clientStartedAt, {
        model,
        auditId,
      }),
    );
    const primaryStartedAt = Date.now();
    emitTiming(
      latencyTrace.mark("consultant.claude.primary.start", {
        model,
        maxTokens,
        timeoutMs,
      }),
    );
    const message = await withTimeout(
      client.messages.create({
        model,
        max_tokens: maxTokens,
        system: INTELLIGENCE_CONSULTANT_TEXT_SYSTEM_PROMPT,
        messages: [{ role: "user", content: user }],
      }),
      timeoutMs,
    );
    emitTiming(
      latencyTrace.finish("consultant.claude.primary.done", primaryStartedAt, {
        model,
      }),
    );
    let rawText = extractAnthropicText(message);
    let text = normalizeConsultantText(rawText);
    emitTiming(
      latencyTrace.mark("consultant.claude.primary.output", {
        outputChars: rawText.length,
        outputApproxTokens: summarizeTextPayload(rawText).approxTokens,
      }),
    );
    const contractValidationIssues: string[] = [];
    const requiredVisualRows = requiredVisualTableRows(args.dossier.question);
    const expectedVisualTab = expectedVisualTabId(args.dossier.question);
    if (
      explicitVisualAsk &&
      !hasCanvasVisualTable(text, requiredVisualRows, expectedVisualTab)
    ) {
      const repairUser = [
        user,
        "",
        "Draft answer that missed the visual contract:",
        text,
        "",
        "Repair instruction:",
        "The user explicitly asked for a table, chart, graph, visual, ranking, comparison, matrix, breakdown, or show-me structure.",
        "Return the same senior-advisor answer, but add exactly one right-canvas visual tab using the exact tab markers.",
        "For chart, graph, trend, visual, visualize, plot, or benchmark asks, use <<<TAB: Chart | grounding: tenant-evidence>>> unless the visual is industry, benchmark, corpus, function, or category context; then use the matching grounding label.",
        "For table, matrix, comparison-grid, ranking, breakdown, or show-me asks, use <<<TAB: Table | grounding: tenant-evidence>>> unless the table is context rather than tenant proof.",
        `Use business-friendly columns aligned to the user's ask. Include ${requiredVisualRows}-6 rows only.`,
        'Use only the provided packet. If a value is not shown, write "not shown in loaded sources" instead of inventing it.',
        "Do not put the Markdown table in the main answer. It must be inside the Chart or Table tab.",
        "Do not add source-support, evidence-register, citation, or material-used tables.",
        "Return final user-facing text only.",
      ].join("\n");
      const visualRepairStartedAt = Date.now();
      emitTiming(
        latencyTrace.mark("consultant.repair.visual.start", {
          model,
          draftChars: text.length,
        }),
      );
      const repaired = await withTimeout(
        client.messages.create({
          model,
          max_tokens: Math.max(maxTokens, 1200),
          system: INTELLIGENCE_CONSULTANT_TEXT_SYSTEM_PROMPT,
          messages: [{ role: "user", content: repairUser }],
        }),
        timeoutMs,
      );
      const repairedText = normalizeConsultantText(
        extractAnthropicText(repaired),
      );
      emitTiming(
        latencyTrace.finish("consultant.repair.visual.done", visualRepairStartedAt, {
          model,
          repairedChars: repairedText.length,
          accepted: hasCanvasVisualTable(
            repairedText,
            requiredVisualRows,
            expectedVisualTab,
          ),
        }),
      );
      if (
        hasCanvasVisualTable(
          repairedText,
          requiredVisualRows,
          expectedVisualTab,
        )
      ) {
        rawText = repairedText;
        text = repairedText;
      } else {
        rawText = repairedText || rawText;
        text = normalizeConsultantText(rawText);
        contractValidationIssues.push(
          `missing_model_generated_visual_tab:${expectedVisualTab}`,
        );
      }
    }
    if (
      contractValidationIssues.length === 0 &&
      requiresNativeExecutiveCanvas(args.dossier.question) &&
      !hasExecutiveCanvasPayload(text)
    ) {
      const repairUser = [
        user,
        "",
        "Draft answer that missed the native executive exhibit contract:",
        text,
        "",
        "Native canvas repair instruction:",
        "Return the same senior-advisor answer, but add exactly one governed `abarva-canvas` fenced JSON block inside the most relevant Decision, Chart, Table, or Evidence tab.",
        "Use one supported canvasType from the system prompt: investmentSequencingMap, valueReadinessMatrix, gateToValueRoadmap, or proofBoundary.",
        "For prioritization, funding, scale, hold, stop, or sequencing questions, prefer investmentSequencingMap.",
        "For portfolio tradeoff or value-readiness questions, prefer valueReadinessMatrix.",
        "For dependency, prerequisite, gate, roadmap, or unlock-value questions, prefer gateToValueRoadmap.",
        "For trust, governance, evidence quality, assumption, missing-data, or signoff questions, prefer proofBoundary.",
        "Preserve the recommendation, tenant facts, caveats, and any useful Markdown table. Do not expose raw JSON outside the fenced block.",
        "Do not write HTML, SVG, CSS, or arbitrary chart code. Return final user-facing text only.",
      ].join("\n");
      const nativeRepairStartedAt = Date.now();
      emitTiming(
        latencyTrace.mark("consultant.repair.native_canvas.start", {
          model,
          draftChars: text.length,
        }),
      );
      const repaired = await withTimeout(
        client.messages.create({
          model,
          max_tokens: Math.max(maxTokens, 1800),
          system: INTELLIGENCE_CONSULTANT_TEXT_SYSTEM_PROMPT,
          messages: [{ role: "user", content: repairUser }],
        }),
        timeoutMs,
      );
      const repairedText = normalizeConsultantText(
        extractAnthropicText(repaired),
      );
      emitTiming(
        latencyTrace.finish(
          "consultant.repair.native_canvas.done",
          nativeRepairStartedAt,
          {
            model,
            repairedChars: repairedText.length,
            accepted: hasExecutiveCanvasPayload(repairedText),
          },
        ),
      );
      if (hasExecutiveCanvasPayload(repairedText)) {
        rawText = repairedText;
        text = repairedText;
      } else {
        rawText = repairedText || rawText;
        text = normalizeConsultantText(rawText);
        contractValidationIssues.push("missing_native_executive_canvas");
      }
    }
    args.onModelOutput?.({
      rawText,
      text,
      model,
      auditId,
      route: "intelligence-consultant-text-synthesis",
    });
    const validationIssues = [
      ...validateIntelligenceConsultantText({
        text,
        dossier: args.dossier,
      }),
      ...contractValidationIssues,
    ];
    if (validationIssues.length > 0) {
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
      used: true,
      text,
      rawText,
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
    return {
      attempted: true,
      used: false,
      model,
      reason: error instanceof Error ? error.message : "exception",
      validationIssues: [],
    };
  }
}

export function validateIntelligenceConsultantText(args: {
  text: string;
  dossier: IntelligenceDossier;
}): string[] {
  const issues: string[] = [];
  const text = args.text.trim();
  if (text.length < 80) issues.push("too_short");
  if (/^\s*[{[]/.test(text)) issues.push("json_output");
  if (OLD_SECTION_RE.test(text)) issues.push("old_template_labels");
  if (RAW_ID_RE.test(text)) issues.push("raw_id_leak");
  if (INTERNAL_RE.test(text)) issues.push("internal_language");
  if (SESSION_CONTEXT_RE.test(text)) issues.push("session_context_language");
  if (
    args.dossier.tenantEvidenceDossier.confidence !== "strong" &&
    /\b(high confidence|certain|definitely|clearly proven)\b/i.test(text)
  ) {
    issues.push("overconfident_for_evidence_strength");
  }
  if (
    args.dossier.decisionOptionsDossier.options.length > 0 &&
    !/\b(option|tradeoff|trade-off|sequence|hold|scale|pilot|investigate)\b/i.test(
      text,
    )
  ) {
    issues.push("missing_options_or_tradeoffs");
  }
  if (
    args.dossier.evidenceBoundary.missingTenantEvidence.length > 0 &&
    !/\b(missing|gap|confirm|not loaded|not provided|thin|partial)\b/i.test(
      text,
    )
  ) {
    issues.push("missing_evidence_not_named");
  }
  return issues;
}

function normalizeConsultantText(text: string): string {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function numberFromEnv(key: string, fallback: number): number {
  const raw = process.env[key]?.trim();
  if (!raw) return fallback;
  const value = Number(raw);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

function isExplicitVisualAsk(query: string): boolean {
  return /\b(table|tables|tabular|matrix|chart|charts|graph|graphs|visual|visually|visualize|plot|ranking|ranked|compare|comparison|break ?down|show me)\b/i.test(
    query,
  );
}

function requiresNativeExecutiveCanvas(query: string): boolean {
  return /\b(abarva\s+right-canvas|structured\s+abarva|executive\s+(?:canvas|exhibit)|canvas\s+exhibit|prioriti[sz]e|priority|priorities|sequence|sequencing|investment|invest|fund|funding|value[ -/]readiness|readiness|gate|roadmap|risk-boundary|proof-boundary|transformation|operating model|portfolio|scale|hold|stop)\b/i.test(
    query,
  );
}

function requiredVisualTableRows(query: string): number {
  return /\b(top|portfolio|initiatives|investments|rank|ranking|ranked|list)\b/i.test(
    query,
  )
    ? 3
    : 2;
}

function hasMarkdownDecisionTable(text: string, minRows = 1): boolean {
  return markdownDecisionTableRowCount(text) >= minRows;
}

function markdownDecisionTableRowCount(text: string): number {
  const lines = text.split(/\r?\n/);
  for (let index = 0; index < lines.length - 1; index += 1) {
    if (
      !splitMarkdownTableLine(lines[index]).length ||
      !MARKDOWN_TABLE_SEPARATOR_RE.test(lines[index + 1] ?? "")
    ) {
      continue;
    }
    let rows = 0;
    for (let rowIndex = index + 2; rowIndex < lines.length; rowIndex += 1) {
      const cells = splitMarkdownTableLine(lines[rowIndex] ?? "");
      if (cells.length < 2) break;
      rows += 1;
    }
    if (rows > 0) return rows;
  }
  return 0;
}

function hasCanvasVisualTable(
  text: string,
  minRows = 1,
  expectedId?: "chart" | "table",
): boolean {
  const parsed = parseIntelligenceTabbedResponse(text);
  return parsed.tabs.some(
    (tab) =>
      (tab.id === "chart" || tab.id === "table") &&
      (!expectedId || tab.id === expectedId) &&
      hasMarkdownDecisionTable(tab.content, minRows),
  );
}

function expectedVisualTabId(question: string): "chart" | "table" | undefined {
  if (
    /\b(chart|charts|graph|graphs|visual|visuals|visuali[sz]e|plot|trend|benchmark)\b/i.test(
      question,
    )
  ) {
    return "chart";
  }
  if (
    /\b(table|tables|tabular|matrix|ranking|ranked|compare|comparison|break ?down|show me)\b/i.test(
      question,
    )
  ) {
    return "table";
  }
  return undefined;
}

function splitMarkdownTableLine(line: string): string[] {
  const trimmed = line.trim();
  if (!trimmed.startsWith("|") || !trimmed.endsWith("|")) return [];
  return trimmed
    .slice(1, -1)
    .split("|")
    .map((cell) => cell.trim());
}

function extractAnthropicText(message: {
  content?: Array<{ type?: string; text?: string }>;
}): string {
  return (message.content ?? [])
    .filter((item) => item.type === "text" && typeof item.text === "string")
    .map((item) => item.text)
    .join("\n")
    .trim();
}

async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
): Promise<T> {
  let timeout: NodeJS.Timeout | null = null;
  try {
    return await Promise.race([
      promise,
      new Promise<never>((_, reject) => {
        timeout = setTimeout(
          () => reject(new Error(`timeout_after_${timeoutMs}ms`)),
          timeoutMs,
        );
      }),
    ]);
  } finally {
    if (timeout) clearTimeout(timeout);
  }
}
