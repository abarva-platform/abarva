import { getAuditedAnthropicClient } from "@/lib/agent/stream";
import type { IntelligenceDossier } from "@/lib/intelligence/dossiers";

const DEFAULT_MODEL = "claude-opus-4-7";
const DEFAULT_MAX_TOKENS = 25_000;
const DEFAULT_TIMEOUT_MS = 90_000;

const RAW_ID_RE =
  /\b[A-Z]{2,16}-[A-Z0-9]{2,24}-\d{2,8}\b|\b[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\b/i;
const INTERNAL_RE =
  /\b(home_know|read-model|route used|localhost|\/Users\/|debug|packet json|source_record_id)\b/i;
const OLD_SECTION_RE =
  /^\s*(?:Read|Evidence|Implication|Next move)\s*:/gim;

export const INTELLIGENCE_CONSULTANT_TEXT_SYSTEM_PROMPT = `You are AbarVa's Intelligence advisor.

You advise CIO, CFO, COO, CDO, transformation, and executive sponsor audiences.

You are not a generic chatbot. You are not retrieving data. You are not inventing facts.

You will receive an Intelligence advisory packet containing tenant evidence, corpus patterns, expert lenses, benchmarks, options, tradeoffs, risks, caveats, missing evidence, and citations.

Use only the provided packet.

Tenant facts prove.
Corpus patterns compare.
Experts interpret.
Benchmarks calibrate.
You synthesize.
AbarVa verifies, cites, and renders supporting panels.

Clearly separate tenant facts, corpus patterns, expert interpretation, benchmarks, options/tradeoffs, and missing evidence.

Tenant facts are the source of truth for this enterprise.
Corpus patterns are precedent, not proof.
Experts are lenses, not evidence.
Benchmarks calibrate, but must be caveated.
Recommendations must be proportional to the evidence.

Write like a senior consulting partner preparing an executive advisory answer. Be specific, direct, and readable.

Do not expose raw IDs, table names, route names, debug labels, internal source names, or implementation details.
Do not claim exact ROI unless the packet provides support.
Do not say a recommendation is high confidence if tenant evidence is thin.
Do not mix another tenant's actual data into this tenant's answer.
Do not use the old transcript labels "Read:", "Evidence:", "Implication:", or "Next move:".
Do not return JSON. Return final user-facing text only.`;

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
  expertCouncilBrief: {
    selectedExperts: string[];
    whySelected: string[];
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
  const raw = process.env.INTELLIGENCE_CLAUDE_SYNTHESIS_ENABLED?.trim().toLowerCase();
  if (raw === "false" || raw === "0" || raw === "off") return false;
  if (raw === "true" || raw === "1" || raw === "on") return true;
  return process.env.NODE_ENV === "production";
}

export function buildIntelligenceConsultantPromptPacket(
  dossier: IntelligenceDossier,
): IntelligenceConsultantPromptPacket {
  return {
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
      relationshipPathsThatMatter: dossier.tenantEvidenceDossier.relationshipPaths
        .map((path) => `${path.from} ${path.relationship} ${path.to}: ${path.label}`)
        .slice(0, 8),
      missingEvidence: dossier.evidenceBoundary.missingTenantEvidence.slice(0, 10),
      citations: dossier.tenantEvidenceDossier.citations
        .map((citation) => citation.label)
        .slice(0, 10),
    },
    corpusPatternBrief: {
      selectedPatternFamilies: dossier.corpusPatternDossier.patternFamilies.slice(0, 8),
      patternSummaries: dossier.evidenceBoundary.corpusPatterns.slice(0, 10),
      excludedPatterns: dossier.corpusPatternDossier.patternsExcluded
        .map((pattern) => `${pattern.patternName}: ${pattern.reasonExcluded}`)
        .slice(0, 5),
    },
    expertCouncilBrief: {
      selectedExperts: dossier.expertCouncilDossier.selectedExperts
        .map((expert) => expert.nameOrRole)
        .slice(0, 7),
      whySelected: dossier.expertCouncilDossier.selectedExperts
        .map((expert) => `${expert.nameOrRole}: ${expert.whySelected}`)
        .slice(0, 7),
      pressureTestQuestions: dossier.expertCouncilDossier.selectedExperts
        .flatMap((expert) => expert.questionsThisExpertShouldPressureTest)
        .slice(0, 10),
      likelyConcerns: dossier.evidenceBoundary.expertInterpretations.slice(0, 7),
    },
    benchmarkBrief: {
      benchmarkClaims: dossier.evidenceBoundary.benchmarkClaims.slice(0, 8),
      roiRanges: dossier.benchmarkDossier.roiRanges
        .map((range) => `${range.range}: ${range.basis}; ${range.caveat}`)
        .slice(0, 6),
      implementationCaveats: dossier.benchmarkDossier.implementationCaveats.slice(0, 8),
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
        ...dossier.decisionOptionsDossier.options.flatMap((option) => option.prerequisites),
      ]
        .filter(Boolean)
        .slice(0, 8),
    },
    riskCaveatBrief: {
      tenantEvidenceGaps: dossier.riskCaveatDossier.tenantEvidenceGaps.slice(0, 8),
      dataReadinessGaps: dossier.riskCaveatDossier.dataReadinessGaps.slice(0, 8),
      operatingModelRisks: dossier.riskCaveatDossier.operatingModelRisks.slice(0, 8),
      governanceRisks: dossier.riskCaveatDossier.governanceRisks.slice(0, 8),
      executionRisks: dossier.riskCaveatDossier.executionRisks.slice(0, 8),
      measurementRisks: dossier.riskCaveatDossier.measurementRisks.slice(0, 8),
    },
    evidenceBoundary: dossier.evidenceBoundary,
  };
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
    "Expert council:",
    JSON.stringify(packet.expertCouncilBrief, null, 2),
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
    "Start with the executive answer.",
    "Separate tenant evidence from corpus, expert, and benchmark content in natural executive prose.",
    "Provide options and tradeoffs when the question is advisory.",
    "State confidence and missing evidence.",
    "Suggest the appropriate handoff to Moves, Source, or Tower when relevant.",
    "Return plain text only.",
  ].join("\n");
}

export async function synthesizeIntelligenceConsultantText(args: {
  dossier: IntelligenceDossier;
  tenantId: string | null | undefined;
  userId?: string | null;
  onModelInput?: (parts: { system: string; user: string }) => void;
}): Promise<IntelligenceConsultantTextResult | IntelligenceConsultantTextFailure | null> {
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
  const promptPacket = buildIntelligenceConsultantPromptPacket(args.dossier);
  const user = buildIntelligenceConsultantUserPrompt(promptPacket);
  const prompt = [INTELLIGENCE_CONSULTANT_TEXT_SYSTEM_PROMPT, user].join("\n\n");

  args.onModelInput?.({
    system: INTELLIGENCE_CONSULTANT_TEXT_SYSTEM_PROMPT,
    user,
  });

  try {
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
        expertCount: args.dossier.expertCouncilDossier.selectedExperts.length,
        corpusPatternFamilyCount: args.dossier.corpusPatternDossier.patternFamilies.length,
      },
    });
    const message = await withTimeout(
      client.messages.create({
        model,
        max_tokens: maxTokens,
        system: INTELLIGENCE_CONSULTANT_TEXT_SYSTEM_PROMPT,
        messages: [{ role: "user", content: user }],
      }),
      timeoutMs,
    );
    const rawText = message.content
      .filter((item) => item.type === "text")
      .map((item) => item.text)
      .join("\n")
      .trim();
    const text = normalizeConsultantText(rawText);
    const validationIssues = validateIntelligenceConsultantText({
      text,
      dossier: args.dossier,
    });
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
  if (
    args.dossier.tenantEvidenceDossier.confidence !== "strong" &&
    /\b(high confidence|certain|definitely|clearly proven)\b/i.test(text)
  ) {
    issues.push("overconfident_for_evidence_strength");
  }
  if (
    args.dossier.decisionOptionsDossier.options.length > 0 &&
    !/\b(option|tradeoff|trade-off|sequence|hold|scale|pilot|investigate)\b/i.test(text)
  ) {
    issues.push("missing_options_or_tradeoffs");
  }
  if (
    args.dossier.evidenceBoundary.missingTenantEvidence.length > 0 &&
    !/\b(missing|gap|confirm|not loaded|not provided|thin|partial)\b/i.test(text)
  ) {
    issues.push("missing_evidence_not_named");
  }
  return issues;
}

function normalizeConsultantText(text: string): string {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/\bSentinel\b/g, "aVa")
    .replace(/\bAtlas\b/g, "aVa")
    .replace(/\bNexus\b/g, "Moves")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function numberFromEnv(key: string, fallback: number): number {
  const raw = process.env[key]?.trim();
  if (!raw) return fallback;
  const value = Number(raw);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
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
