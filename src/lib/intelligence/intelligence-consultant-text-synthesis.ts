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
Do not mention expert packs, binders, dossiers, semantic layers, prompt packets, source rows, edge rows, debug traces, or route decisions.
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
    "Start with the executive answer in one short paragraph.",
    "Then explain the evidence spine: what the tenant facts support, what corpus/pattern content adds, and what benchmark context calibrates.",
    "When the user asks what to prioritize, kill, sequence, compare, fund, or investigate, include options and tradeoffs.",
    "When comparing multiple items, include a compact Markdown table with business-friendly columns.",
    "State confidence and missing evidence after the useful synthesis, not as the opening.",
    "Suggest the appropriate handoff to Moves, Source, or Tower when relevant.",
    "Keep every paragraph to three sentences or fewer.",
    "Return final user-facing text only.",
  ].join("\n");
}

export async function synthesizeIntelligenceConsultantText(args: {
  dossier: IntelligenceDossier;
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
  const explicitVisualAsk = isExplicitVisualAsk(args.dossier.question);

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
        advisoryLensCount: args.dossier.relatedDimensions.length,
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
    let rawText = extractAnthropicText(message);
    let text = normalizeConsultantText(rawText);
    if (explicitVisualAsk && !hasMarkdownDecisionTable(text)) {
      const repairUser = [
        user,
        "",
        "Draft answer that missed the visual contract:",
        text,
        "",
        "Repair instruction:",
        "The user explicitly asked for a table, chart, graph, visual, ranking, comparison, matrix, breakdown, or show-me structure.",
        "Return the same senior-advisor answer, but add exactly one compact GitHub-flavored Markdown decision table.",
        "Use business-friendly columns aligned to the user's ask. Include 2-6 rows only.",
        "Use only the provided packet. If a value is not shown, write \"not shown in loaded sources\" instead of inventing it.",
        "Do not add source-support, evidence-register, citation, or material-used tables.",
        "Return final user-facing text only.",
      ].join("\n");
      const repaired = await withTimeout(
        client.messages.create({
          model,
          max_tokens: Math.max(maxTokens, 1200),
          system: INTELLIGENCE_CONSULTANT_TEXT_SYSTEM_PROMPT,
          messages: [{ role: "user", content: repairUser }],
        }),
        timeoutMs,
      );
      const repairedText = normalizeConsultantText(extractAnthropicText(repaired));
      if (hasMarkdownDecisionTable(repairedText)) {
        rawText = repairedText;
        text = repairedText;
      } else {
        const fallbackTable = fallbackDecisionTableFromPacket(promptPacket);
        if (fallbackTable) {
          rawText = `${rawText}\n\n${fallbackTable}`;
          text = normalizeConsultantText(`${text}\n\n${fallbackTable}`);
        }
      }
    }
    args.onModelOutput?.({
      rawText,
      text,
      model,
      auditId,
      route: "intelligence-consultant-text-synthesis",
    });
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

function isExplicitVisualAsk(query: string): boolean {
  return /\b(table|tables|tabular|matrix|chart|charts|graph|graphs|visual|visually|visualize|plot|ranking|ranked|compare|comparison|break ?down|show me)\b/i.test(
    query,
  );
}

function hasMarkdownDecisionTable(text: string): boolean {
  return MARKDOWN_TABLE_SEPARATOR_RE.test(text);
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

function parseOptionBrief(option: string): {
  title: string;
  action: string;
  value: string;
  complexity: string;
  risk: string;
  missing: string;
} | null {
  const [titlePart, rest = ""] = option.split(/:\s*/, 2);
  const title = titlePart.trim();
  if (!title) return null;
  return {
    title,
    action: rest.split(";")[0]?.trim() || "assess with accountable owner",
    value: rest.match(/(?:^|;\s*)value=([^;]+)/)?.[1]?.trim() || "not shown in loaded sources",
    complexity:
      rest.match(/(?:^|;\s*)complexity=([^;]+)/)?.[1]?.trim() ||
      "not shown in loaded sources",
    risk:
      rest.match(/(?:^|;\s*)risk=([^;]+)/)?.[1]?.trim() ||
      "not shown in loaded sources",
    missing: rest.match(/(?:^|;\s*)missing=([^;]+)/)?.[1]?.trim() || "none named",
  };
}

function markdownEscapeCell(value: string): string {
  return value.replace(/\|/g, "\\|").replace(/\s+/g, " ").trim();
}

function fallbackDecisionTableFromPacket(
  packet: IntelligenceConsultantPromptPacket,
): string | null {
  const rows = packet.optionsBrief.options
    .map(parseOptionBrief)
    .filter((option): option is NonNullable<typeof option> => option !== null)
    .slice(0, 6);
  if (rows.length < 2) return null;

  return [
    "| Initiative | Value | Readiness | Risk | Next action |",
    "|---|---:|---|---|---|",
    ...rows.map((row) => {
      const readiness =
        row.missing && row.missing.toLowerCase() !== "none named"
          ? `blocked by ${row.missing}`
          : `complexity ${row.complexity}`;
      return `| ${markdownEscapeCell(row.title)} | ${markdownEscapeCell(row.value)} | ${markdownEscapeCell(readiness)} | ${markdownEscapeCell(row.risk)} | ${markdownEscapeCell(row.action)} |`;
    }),
  ].join("\n");
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
