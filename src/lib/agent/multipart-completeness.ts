export interface MultipartCompletenessRequest {
  question: string;
  answer: string;
}

export interface MultipartCompletenessResult {
  requiredCount: number | null;
  requestedSubject: string | null;
  observedParts: number[];
  missingParts: number[];
  complete: boolean;
  reason: string;
}

const NUMBER_WORDS: Record<string, number> = {
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,
};

const ORDINAL_WORDS: Record<string, number> = {
  first: 1,
  second: 2,
  third: 3,
  fourth: 4,
  fifth: 5,
  sixth: 6,
  seventh: 7,
  eighth: 8,
  ninth: 9,
  tenth: 10,
};

const FIXED_COUNT_SUBJECT =
  "(?:move|step|option|recommendation|priority|priorities|lever|action|bet|sequence|phase|path|part|reason)";

const SUBJECT_ALIASES: Record<string, string[]> = {
  sequence: ["sequence", "step", "move", "phase", "action"],
  path: ["path", "step", "move", "phase", "action"],
  priority: ["priority", "priorities"],
  priorities: ["priority", "priorities"],
};

function numberFromToken(value: string | undefined): number | null {
  if (!value) return null;
  const normalized = value.trim().toLowerCase();
  const parsed = Number(normalized);
  if (Number.isInteger(parsed) && parsed > 0 && parsed <= 10) return parsed;
  return NUMBER_WORDS[normalized] ?? null;
}

function uniqSorted(values: number[]): number[] {
  return Array.from(new Set(values)).sort((a, b) => a - b);
}

function detectFixedCount(text: string): { count: number; subject: string } | null {
  const normalized = text.replace(/[“”]/g, '"');
  const patterns = [
    new RegExp(
      `\\b(\\d+|one|two|three|four|five|six|seven|eight|nine|ten)[-\\s]+(${FIXED_COUNT_SUBJECT})s?\\b`,
      "i",
    ),
    new RegExp(
      `\\btop\\s+(\\d+|one|two|three|four|five|six|seven|eight|nine|ten)\\s+(${FIXED_COUNT_SUBJECT})s?\\b`,
      "i",
    ),
    new RegExp(
      `\\b(?:here(?:'s| is)|build|give|show|create|recommend)\\s+(?:us\\s+)?(?:a\\s+)?(\\d+|one|two|three|four|five|six|seven|eight|nine|ten)[-\\s]+(${FIXED_COUNT_SUBJECT})s?\\b`,
      "i",
    ),
  ];

  for (const pattern of patterns) {
    const match = normalized.match(pattern);
    const count = numberFromToken(match?.[1]);
    const subject = match?.[2]?.toLowerCase().replace(/ies$/, "y") ?? null;
    if (count && subject) return { count, subject };
  }

  return null;
}

function observeExplicitParts(
  answer: string,
  expectedCount: number,
  subject: string | null,
): number[] {
  const observed: number[] = [];
  const subjectCandidates = subject
    ? SUBJECT_ALIASES[subject] ?? [subject]
    : [];
  const escapedSubject =
    subjectCandidates.length > 0
      ? subjectCandidates
          .map((candidate) => candidate.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
          .join("|")
      : FIXED_COUNT_SUBJECT;
  const subjectPattern =
    subjectCandidates.length > 0 ? `(?:${escapedSubject})` : FIXED_COUNT_SUBJECT;

  const numericLabel = new RegExp(
    `\\b${subjectPattern}\\s*(\\d{1,2})(?=\\s*(?:[:.\\-)—–]|\\b))`,
    "gi",
  );
  for (const match of answer.matchAll(numericLabel)) {
    const value = Number(match[1]);
    if (value >= 1 && value <= expectedCount) observed.push(value);
  }

  const parentheticalLabel = new RegExp(
    `\\b${subjectPattern}\\s*\\((?:[^)]*)\\)\\s*:\\s*`,
    "gi",
  );
  const parentheticalCount = Array.from(answer.matchAll(parentheticalLabel)).length;
  for (
    let parentheticalIndex = 1;
    parentheticalIndex <= parentheticalCount;
    parentheticalIndex += 1
  ) {
    if (parentheticalIndex <= expectedCount) observed.push(parentheticalIndex);
  }

  for (const match of answer.matchAll(/(?:^|\n)\s*(\d{1,2})[.)]\s+\S/g)) {
    const value = Number(match[1]);
    if (value >= 1 && value <= expectedCount) observed.push(value);
  }

  for (const [word, value] of Object.entries(ORDINAL_WORDS)) {
    if (value <= expectedCount && new RegExp(`\\b${word}\\b`, "i").test(answer)) {
      observed.push(value);
    }
  }

  return uniqSorted(observed);
}

export function validateMultipartCompleteness({
  question,
  answer,
}: MultipartCompletenessRequest): MultipartCompletenessResult {
  const requested = detectFixedCount(question) ?? detectFixedCount(answer);
  if (!requested) {
    return {
      requiredCount: null,
      requestedSubject: null,
      observedParts: [],
      missingParts: [],
      complete: true,
      reason: "no_fixed_count_requested",
    };
  }

  const observedParts = observeExplicitParts(
    answer,
    requested.count,
    requested.subject,
  );
  const missingParts = Array.from(
    { length: requested.count },
    (_unused, index) => index + 1,
  ).filter((part) => !observedParts.includes(part));

  return {
    requiredCount: requested.count,
    requestedSubject: requested.subject,
    observedParts,
    missingParts,
    complete: missingParts.length === 0,
    reason:
      missingParts.length === 0
        ? "all_promised_parts_present"
        : "missing_promised_parts",
  };
}

export function formatCompletenessRepairInstruction(
  result: MultipartCompletenessResult,
): string {
  if (result.complete || !result.requiredCount) return "";
  const subject = result.requestedSubject ?? "part";
  return [
    `The previous draft promised ${result.requiredCount} ${subject}s but only rendered ${result.observedParts.length}.`,
    `Rewrite the answer so it includes every ${subject}: ${Array.from(
      { length: result.requiredCount },
      (_unused, index) => `${subject} ${index + 1}`,
    ).join(", ")}.`,
    "Keep the same recommendation and evidence posture; do not add generic boilerplate.",
  ].join(" ");
}
