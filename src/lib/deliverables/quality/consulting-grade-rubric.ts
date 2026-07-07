export const CONSULTING_GRADE_MIN_SCORE = 8;

export const CONSULTING_GRADE_STANDARD_ID =
  "partner-grade-consulting-deliverable-v1";

export const CONSULTING_GRADE_DIMENSIONS = [
  {
    id: "executive_decision_value",
    label: "Executive decision value",
    standard:
      "The artifact makes the decision, ask, tradeoffs, and executive significance unmistakable.",
  },
  {
    id: "evidence_grounding",
    label: "Evidence grounding",
    standard:
      "Material claims are supported by cited event evidence, governed context, assumptions, or client-to-complete gaps.",
  },
  {
    id: "commercial_specificity",
    label: "Commercial specificity",
    standard:
      "The artifact quantifies financial scale, baselines, pricing levers, and vendor response implications.",
  },
  {
    id: "technical_operational_depth",
    label: "Technical and operational depth",
    standard:
      "The artifact reflects the systems, infrastructure, service, operating-model, and transition details needed for execution.",
  },
  {
    id: "comparability_and_controls",
    label: "Comparability and controls",
    standard:
      "The artifact enables apples-to-apples vendor or executive evaluation with clear controls, gates, and scoring logic.",
  },
  {
    id: "risk_failure_mode_awareness",
    label: "Risk and failure-mode awareness",
    standard:
      "The artifact identifies transition, compliance, security, operational, and adoption failure modes with mitigations.",
  },
  {
    id: "source_discipline",
    label: "Source discipline",
    standard:
      "It separates locked facts, working hypotheses, assumptions, and missing evidence without exposing internal ids.",
  },
  {
    id: "artifact_completeness",
    label: "Artifact completeness",
    standard:
      "The artifact contains every section, table, appendix, and instruction expected for its document type.",
  },
  {
    id: "polish_and_readability",
    label: "Polish and readability",
    standard:
      "The artifact reads like a client-ready top-tier consulting deliverable with concise, formatted, table-led structure.",
  },
  {
    id: "actionability",
    label: "Actionability",
    standard:
      "The artifact gives owners clear next actions, decisions, dates, and evidence needed to move forward.",
  },
] as const;

export type ConsultingGradeDimensionId =
  (typeof CONSULTING_GRADE_DIMENSIONS)[number]["id"];

export interface ConsultingGradeDimensionScore {
  id: ConsultingGradeDimensionId;
  score: number;
  rationale: string;
  requiredFixes: string[];
}

export interface ConsultingGradeReview {
  standardId: typeof CONSULTING_GRADE_STANDARD_ID;
  minRequiredScore: number;
  artifactCode: string;
  artifactName: string;
  pass: boolean;
  overallScore: number;
  dimensionScores: ConsultingGradeDimensionScore[];
  unsupportedClaims: string[];
  missingEvidence: string[];
  rewriteGuidance: string[];
}

export function buildConsultingGradeReviewPrompt(args: {
  artifactCode: string;
  artifactName: string;
  bodyMarkdown: string;
  sourceContext: string;
}): string {
  return [
    "You are a senior partner quality reviewer. Score the artifact strictly.",
    "Return JSON only. Do not wrap it in markdown.",
    "",
    `Standard: ${CONSULTING_GRADE_STANDARD_ID}`,
    `Minimum passing score: ${CONSULTING_GRADE_MIN_SCORE}/10 on every dimension.`,
    `Artifact: ${args.artifactName} (${args.artifactCode})`,
    "",
    "Rubric dimensions:",
    ...CONSULTING_GRADE_DIMENSIONS.map(
      (dimension) =>
        `- ${dimension.id}: ${dimension.label} — ${dimension.standard}`,
    ),
    "",
    "Rules:",
    "- Any dimension below 8 means pass=false.",
    "- Unsupported quantified claims, missing source discipline, or thin generic writing must score below 8.",
    "- A clean, well-formatted but shallow artifact must fail.",
    "- Flag any claim that needs evidence, any missing table, and any client-to-complete gap.",
    "- Score this as a governed draft, not an issued final. Do not penalize explicit [CLIENT TO SET], [CLIENT TO COMPLETE], [ASSUMPTION TO VALIDATE], or evidence-pending placeholders when they are clearly registered with owner/action/impact and not hidden as facts.",
    "- If the bound source context contains a D09 RFP evidence coverage map where an uploaded exhibit satisfies an EVID-SRC-* requirement, do not treat an older scaffold row saying Not Requested as missing for that same requirement. Judge whether the artifact used the mapped exhibit and registered any remaining citation-review/client-closure action.",
    "- Penalize placeholders that are buried in the narrative, lack an owner/action, or would make the artifact unusable for its stated gate.",
    "",
    "Return exactly this JSON shape:",
    JSON.stringify(
      {
        standardId: CONSULTING_GRADE_STANDARD_ID,
        minRequiredScore: CONSULTING_GRADE_MIN_SCORE,
        artifactCode: args.artifactCode,
        artifactName: args.artifactName,
        pass: false,
        overallScore: 0,
        dimensionScores: CONSULTING_GRADE_DIMENSIONS.map((dimension) => ({
          id: dimension.id,
          score: 0,
          rationale: "",
          requiredFixes: [""],
        })),
        unsupportedClaims: [""],
        missingEvidence: [""],
        rewriteGuidance: [""],
      },
      null,
      2,
    ),
    "",
    "Bound source context:",
    args.sourceContext || "(none)",
    "",
    "Artifact body:",
    args.bodyMarkdown,
  ].join("\n");
}

export function buildConsultingGradeCompactRetryPrompt(args: {
  artifactCode: string;
  artifactName: string;
  bodyMarkdown: string;
  sourceContext: string;
  previousError: string;
}): string {
  return [
    "Your previous quality-review response was not usable.",
    `Parser error: ${args.previousError}`,
    "",
    "Use the record_source_quality_review tool exactly once.",
    "The tool input must include dimensionScores with exactly these ids, one score per id:",
    ...CONSULTING_GRADE_DIMENSIONS.map(
      (dimension) => `- ${dimension.id}: ${dimension.standard}`,
    ),
    "",
    "Rules:",
    `- Every dimension must have score, rationale, and requiredFixes.`,
    `- Passing requires every score >= ${CONSULTING_GRADE_MIN_SCORE}.`,
    "- If the artifact is generic, thin, uncited, internally tagged, or missing evidence, score the affected dimensions below 8.",
    "- Explicit client-to-complete placeholders are acceptable for governed drafts only when the artifact names the gap, owner/action, and downstream impact.",
    "- D09 coverage maps override stale scaffold states: if an uploaded exhibit satisfies an EVID-SRC-* requirement, do not mark that requirement missing solely because another row says Not Requested.",
    "- Keep each rationale under 160 characters and each fix under 120 characters.",
    "- Do not omit dimensionScores.",
    "",
    `Artifact: ${args.artifactName} (${args.artifactCode})`,
    "",
    "Source context excerpt:",
    excerptForReviewRetry(args.sourceContext, 6_000),
    "",
    "Artifact body excerpt:",
    excerptForReviewRetry(args.bodyMarkdown, 16_000),
  ].join("\n");
}

export function buildMalformedConsultingGradeReview(args: {
  artifactCode: string;
  artifactName: string;
  reason: string;
}): ConsultingGradeReview {
  const reason = args.reason.trim() || "Quality review was not structured.";
  return {
    standardId: CONSULTING_GRADE_STANDARD_ID,
    minRequiredScore: CONSULTING_GRADE_MIN_SCORE,
    artifactCode: args.artifactCode,
    artifactName: args.artifactName,
    pass: false,
    overallScore: 0,
    dimensionScores: CONSULTING_GRADE_DIMENSIONS.map((dimension) => ({
      id: dimension.id,
      score: 0,
      rationale:
        "Quality review was not parseable, so this artifact cannot pass Gate B.",
      requiredFixes: [reason],
    })),
    unsupportedClaims: [],
    missingEvidence: [],
    rewriteGuidance: [
      "Regenerate the quality review with the required 10-dimension rubric before export.",
    ],
  };
}

export function buildConsultingGradeRewritePrompt(args: {
  artifactCode: string;
  artifactName: string;
  bodyMarkdown: string;
  sourceContext: string;
  review: ConsultingGradeReview;
}): string {
  const failed = args.review.dimensionScores
    .filter((score) => score.score < CONSULTING_GRADE_MIN_SCORE)
    .map(
      (score) =>
        `- ${score.id}: ${score.score}/10 — ${score.rationale}; fixes: ${score.requiredFixes.join("; ")}`,
    )
    .join("\n");
  return [
    "Rewrite the artifact so it passes the partner-grade consulting quality gate.",
    "Return the complete improved artifact body in markdown only.",
    "",
    `Artifact: ${args.artifactName} (${args.artifactCode})`,
    `Passing standard: every rubric dimension >= ${CONSULTING_GRADE_MIN_SCORE}/10.`,
    "",
    "Failed or weak dimensions:",
    failed || "(review did not identify specific failed dimensions)",
    "",
    "Unsupported claims to remove, cite, or label as assumptions:",
    args.review.unsupportedClaims.join("\n") || "(none)",
    "",
    "Missing evidence/gaps to make explicit:",
    args.review.missingEvidence.join("\n") || "(none)",
    "",
    "Rewrite guidance:",
    args.review.rewriteGuidance.join("\n") || "(none)",
    "",
    "Bound source context:",
    args.sourceContext || "(none)",
    "",
    "Current artifact body:",
    args.bodyMarkdown,
  ].join("\n");
}

export function parseConsultingGradeReviewJson(args: {
  artifactCode: string;
  artifactName: string;
  raw: string;
}): ConsultingGradeReview {
  type ParsedDimensionScore = Partial<ConsultingGradeDimensionScore> & {
    dimension?: string;
    dimensionId?: string;
    dimension_id?: string;
    label?: string;
    name?: string;
    fixes?: unknown;
    required_fixes?: unknown;
  };
  const parsed = JSON.parse(stripCodeFence(args.raw)) as Partial<
    Omit<ConsultingGradeReview, "dimensionScores"> & {
      dimensionScores?: ParsedDimensionScore[] | Record<string, unknown>;
      dimension_scores?: ParsedDimensionScore[] | Record<string, unknown>;
      rubricScores?: ParsedDimensionScore[] | Record<string, unknown>;
      rubric_scores?: ParsedDimensionScore[] | Record<string, unknown>;
      scores?: ParsedDimensionScore[] | Record<string, unknown>;
      dimensions?: ParsedDimensionScore[] | Record<string, unknown>;
    }
  >;
  const parsedDimensionScores = collectDimensionScores(parsed);

  const scoresById = new Map<
    ConsultingGradeDimensionId,
    ParsedDimensionScore
  >();
  for (const score of parsedDimensionScores) {
    const id = resolveDimensionId(score);
    if (id && !scoresById.has(id)) scoresById.set(id, score);
  }

  const missingDimensionIds = CONSULTING_GRADE_DIMENSIONS.filter(
    (dimension) => !scoresById.has(dimension.id),
  ).map((dimension) => dimension.id);
  if (missingDimensionIds.length > 0) {
    throw new Error(
      `Quality review is missing rubric dimension score(s): ${missingDimensionIds.join(", ")}.`,
    );
  }

  const dimensionScores = CONSULTING_GRADE_DIMENSIONS.map((dimension) => {
    const score = scoresById.get(dimension.id);
    return {
      id: dimension.id,
      score: normalizeScore(score?.score),
      rationale:
        typeof score?.rationale === "string" && score.rationale.trim()
          ? score.rationale.trim()
          : "Reviewer did not provide rationale.",
      requiredFixes: normalizeStringArray(
        score?.requiredFixes ?? score?.required_fixes ?? score?.fixes,
      ),
    };
  });
  const failed = dimensionScores.some(
    (score) => score.score < CONSULTING_GRADE_MIN_SCORE,
  );
  const pass = Boolean(parsed.pass) && !failed;
  return {
    standardId: CONSULTING_GRADE_STANDARD_ID,
    minRequiredScore: CONSULTING_GRADE_MIN_SCORE,
    artifactCode: args.artifactCode,
    artifactName: args.artifactName,
    pass,
    overallScore: normalizeScore(parsed.overallScore),
    dimensionScores,
    unsupportedClaims: normalizeStringArray(parsed.unsupportedClaims),
    missingEvidence: normalizeStringArray(parsed.missingEvidence),
    rewriteGuidance: normalizeStringArray(parsed.rewriteGuidance),
  };
}

export function summarizeConsultingGradeReview(
  review: ConsultingGradeReview,
): string {
  const failed = review.dimensionScores.filter(
    (score) => score.score < review.minRequiredScore,
  );
  if (failed.length === 0) {
    return `Passed ${review.standardId} with all dimensions >= ${review.minRequiredScore}/10.`;
  }
  return [
    `Failed ${review.standardId}; ${failed.length} dimension(s) below ${review.minRequiredScore}/10.`,
    ...failed.map(
      (score) =>
        `${score.id}: ${score.score}/10 (${score.requiredFixes.join("; ") || score.rationale})`,
    ),
  ].join(" ");
}

function normalizeScore(value: unknown): number {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return 0;
  return Math.max(0, Math.min(10, Math.round(numeric)));
}

function normalizeStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter(Boolean);
}

function resolveDimensionId(
  score:
    | (Partial<ConsultingGradeDimensionScore> & {
        dimension?: string;
        dimensionId?: string;
        dimension_id?: string;
        label?: string;
        name?: string;
      })
    | undefined,
): ConsultingGradeDimensionId | null {
  const candidates = [
    score?.id,
    score?.dimensionId,
    score?.dimension_id,
    score?.dimension,
    score?.label,
    score?.name,
  ];
  for (const candidate of candidates) {
    if (typeof candidate !== "string") continue;
    const normalized = normalizeDimensionKey(candidate);
    const match = CONSULTING_GRADE_DIMENSIONS.find(
      (dimension) =>
        normalizeDimensionKey(dimension.id) === normalized ||
        normalizeDimensionKey(dimension.label) === normalized,
    );
    if (match) return match.id;
  }
  return null;
}

function collectDimensionScores(
  parsed: Partial<{
    dimensionScores: unknown;
    dimension_scores: unknown;
    rubricScores: unknown;
    rubric_scores: unknown;
    scores: unknown;
    dimensions: unknown;
  }>,
): Array<
  Partial<ConsultingGradeDimensionScore> & {
    dimension?: string;
    dimensionId?: string;
    dimension_id?: string;
    label?: string;
    name?: string;
    fixes?: unknown;
    required_fixes?: unknown;
  }
> {
  const candidates = [
    parsed.dimensionScores,
    parsed.dimension_scores,
    parsed.rubricScores,
    parsed.rubric_scores,
    parsed.scores,
    parsed.dimensions,
  ];
  for (const candidate of candidates) {
    const normalized = normalizeDimensionScoreCollection(candidate);
    if (normalized.length > 0) return normalized;
  }
  throw new Error(
    "Quality review is missing dimensionScores array or equivalent rubric score collection.",
  );
}

function normalizeDimensionScoreCollection(
  value: unknown,
): Array<
  Partial<ConsultingGradeDimensionScore> & {
    dimension?: string;
    dimensionId?: string;
    dimension_id?: string;
    label?: string;
    name?: string;
    fixes?: unknown;
    required_fixes?: unknown;
  }
> {
  if (Array.isArray(value)) {
    return value.filter(isObjectRecord);
  }
  if (!isObjectRecord(value)) return [];
  const entries: ReturnType<typeof normalizeDimensionScoreCollection> = [];
  for (const [key, entry] of Object.entries(value)) {
    if (!isObjectRecord(entry)) continue;
    const entryId = typeof entry.id === "string" ? entry.id : key;
    entries.push({
      ...entry,
      id: entryId as ConsultingGradeDimensionId,
      dimension: typeof entry.dimension === "string" ? entry.dimension : key,
    });
  }
  return entries;
}

function isObjectRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function normalizeDimensionKey(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function stripCodeFence(raw: string): string {
  const trimmed = raw.trim();
  const exactFence = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  if (exactFence?.[1]) return exactFence[1].trim();

  const embeddedFence = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (embeddedFence?.[1]) return embeddedFence[1].trim();

  const firstBrace = trimmed.indexOf("{");
  const lastBrace = trimmed.lastIndexOf("}");
  if (firstBrace >= 0 && lastBrace > firstBrace) {
    return trimmed.slice(firstBrace, lastBrace + 1).trim();
  }

  return trimmed;
}

function excerptForReviewRetry(value: string, maxChars: number): string {
  const normalized = value.replace(/\s+\n/g, "\n").trim();
  if (normalized.length <= maxChars) return normalized || "(none)";
  const head = normalized.slice(0, Math.floor(maxChars * 0.7));
  const tail = normalized.slice(-Math.floor(maxChars * 0.3));
  return `${head}\n\n[...middle omitted for compact quality-review retry...]\n\n${tail}`;
}
