import {
  ACTION_PATTERNS,
  ANSWER_QUALITY_DIMENSIONS,
  ANSWER_QUALITY_PASS_THRESHOLD,
  type AnswerQualityContext,
  type AnswerQualityDimension,
  type AnswerQualityScore,
  type AnswerQualityViolation,
  EXECUTIVE_LEXICON,
  FAKE_PRECISION_PATTERN,
  RAW_ID_PATTERNS,
  SOURCE_CUE_PATTERN,
  VAGUE_ACTION_PATTERNS,
} from "./rubric";

export type { AnswerQualityContext, AnswerQualityScore } from "./rubric";

const DIMENSION_WEIGHT = 100 / ANSWER_QUALITY_DIMENSIONS.length;

export function scoreAnswer(
  answer: string,
  context: AnswerQualityContext,
): AnswerQualityScore {
  const normalized = normalize(answer);
  const violations: AnswerQualityViolation[] = [];
  const dimensions = Object.fromEntries(
    ANSWER_QUALITY_DIMENSIONS.map((dimension) => [dimension, 100]),
  ) as Record<AnswerQualityDimension, number>;

  if (!normalized) {
    return failAll(
      "clarity",
      "Empty answer.",
      "Return a concise, decision-grade answer.",
      dimensions,
    );
  }

  const longParagraph = normalized
    .split(/\n{2,}/)
    .map((part) => part.trim())
    .find((part) => wordCount(part) > 90);
  if (longParagraph) {
    penalize(
      dimensions,
      violations,
      "clarity",
      45,
      trimWords(longParagraph, 18),
      "Split long prose into scannable decision bullets.",
    );
  }

  if (!/[.!?]$/.test(normalized)) {
    penalize(
      dimensions,
      violations,
      "clarity",
      15,
      trimWords(normalized, 12),
      "End the answer with a complete sentence.",
    );
  }

  for (const pattern of RAW_ID_PATTERNS) {
    const excerpt = firstMatch(normalized, pattern.re);
    if (excerpt) {
      penalize(
        dimensions,
        violations,
        "noRawIds",
        100,
        excerpt,
        `Replace the raw ${pattern.name} with a human-readable label.`,
      );
    }
  }

  const unexplainedAcronyms = findUnexplainedAcronyms(normalized);
  if (unexplainedAcronyms.length > 0) {
    penalize(
      dimensions,
      violations,
      "noUnexplainedJargon",
      Math.min(100, unexplainedAcronyms.length * 25),
      unexplainedAcronyms.join(", "),
      "Define acronyms or use executive-language equivalents.",
    );
  }

  const fakePrecision = firstMatch(normalized, FAKE_PRECISION_PATTERN);
  if (fakePrecision && !SOURCE_CUE_PATTERN.test(normalized)) {
    penalize(
      dimensions,
      violations,
      "noFakePrecision",
      100,
      fakePrecision,
      "Attach a source, freshness date, or evidence-ledger basis to precise numbers.",
    );
  }

  const hasAction = ACTION_PATTERNS.some((pattern) => pattern.test(normalized));
  if (!hasAction) {
    penalize(
      dimensions,
      violations,
      "actionability",
      70,
      context.questionId,
      "Name the next decision, owner, or validation step.",
    );
  }

  const vagueAction = VAGUE_ACTION_PATTERNS.map((pattern) =>
    firstMatch(normalized, pattern),
  ).find(Boolean);
  if (vagueAction) {
    penalize(
      dimensions,
      violations,
      "realNextMove",
      65,
      vagueAction,
      "Replace vague follow-up language with an executable next move.",
    );
  }

  if (
    hasAction &&
    !/\b(?:by|owner|open|assign|approve|decide|validate|escalate|pause|route)\b/i.test(
      normalized,
    )
  ) {
    penalize(
      dimensions,
      violations,
      "realNextMove",
      35,
      trimWords(normalized, 14),
      "Tie the next move to an owner, artifact, route, or decision.",
    );
  }

  const overall = Math.round(
    ANSWER_QUALITY_DIMENSIONS.reduce(
      (sum, dimension) => sum + dimensions[dimension] * DIMENSION_WEIGHT,
      0,
    ) / 100,
  );

  return {
    overall,
    dimensions,
    violations,
    gatePassed:
      overall >= ANSWER_QUALITY_PASS_THRESHOLD && violations.length === 0,
  };
}

function failAll(
  dimension: AnswerQualityDimension,
  excerpt: string,
  remediation: string,
  dimensions: Record<AnswerQualityDimension, number>,
): AnswerQualityScore {
  for (const key of ANSWER_QUALITY_DIMENSIONS) dimensions[key] = 0;
  return {
    overall: 0,
    dimensions,
    violations: [{ dimension, excerpt, remediation }],
    gatePassed: false,
  };
}

function penalize(
  dimensions: Record<AnswerQualityDimension, number>,
  violations: AnswerQualityViolation[],
  dimension: AnswerQualityDimension,
  amount: number,
  excerpt: string,
  remediation: string,
): void {
  dimensions[dimension] = Math.max(0, dimensions[dimension] - amount);
  violations.push({ dimension, excerpt, remediation });
}

function findUnexplainedAcronyms(text: string): string[] {
  const acronyms = new Set(text.match(/\b[A-Z]{2,6}\b/g) ?? []);
  return [...acronyms].filter((token) => !EXECUTIVE_LEXICON.has(token));
}

function firstMatch(text: string, re: RegExp): string | null {
  return text.match(re)?.[0] ?? null;
}

function normalize(text: string): string {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+/g, " ")
    .trim();
}

function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function trimWords(text: string, maxWords: number): string {
  const words = text.trim().split(/\s+/).filter(Boolean);
  return words.length <= maxWords
    ? text
    : `${words.slice(0, maxWords).join(" ")}...`;
}
