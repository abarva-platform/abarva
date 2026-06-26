export interface SharedResponseLabel {
  id: string;
  label: string;
}

export interface SharedResponseShapeIssue {
  code:
    | "raw_id_leak"
    | "banned_brand_leak"
    | "length_over_target"
    | "missing_next_step";
  detail: string;
}

export interface SharedResponseShapeResult {
  text: string;
  issues: SharedResponseShapeIssue[];
  replacements: Array<{ from: string; to: string }>;
}

export interface SharedResponseShapeInput {
  text: string;
  labels?: ReadonlyArray<SharedResponseLabel>;
  targetChars?: number;
  hardMaxChars?: number;
  maxParagraphs?: number;
  requireNextStep?: boolean;
  nextStepFallback?: string;
}

const BANNED_BRAND_RE = /\b(?:Atlas|Sentinel|Nexus)\b/g;
const UUID_RE =
  /\b[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\b/gi;
const RAW_ID_RE =
  /\b(?:[A-Z]{2,}(?:-[A-Z0-9]+)+-\d{2,}|[A-Z]{2,}-[A-Z0-9]+-\d{3,}|signal:[a-z0-9:_-]{6,}|TWR-[A-Z0-9-]+)\b/gi;

function normalizeWhitespace(text: string): string {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function sentenceSplit(text: string): string[] {
  return text
    .replace(/\bvs\./gi, "vs")
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);
}

function paragraphSplit(text: string): string[] {
  return text
    .split(/\n\s*\n|\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
}

function trimWords(text: string, maxWords: number): string {
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (words.length <= maxWords) return text.trim();
  return `${words
    .slice(0, maxWords)
    .join(" ")
    .replace(/[,;:—-]+$/, "")}.`;
}

function hasNextStep(text: string): boolean {
  return /\b(next|ask|inspect|open|review|validate|challenge|compare|decide|pause|fund|shape|assign)\b/i.test(
    text,
  );
}

function tableToCompactLines(text: string): string[] {
  const rows = text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => /^\|.+\|$/.test(line));
  if (rows.length < 3) return [];
  const bodyRows = rows
    .slice(2, 6)
    .map((line) =>
      line
        .replace(/^\|/, "")
        .replace(/\|$/, "")
        .split("|")
        .map((cell) => cell.trim())
        .filter(Boolean),
    )
    .filter((cells) => cells.length >= 2);
  return bodyRows.map((cells) => `- ${cells.slice(0, 3).join(" — ")}`);
}

function removeMarkdownTables(text: string): string {
  return text
    .split("\n")
    .filter((line) => !/^\s*\|.+\|\s*$/.test(line))
    .join("\n");
}

function cleanLeadLine(text: string): string {
  return text
    .replace(
      /^(?:My read|Read|Answer|Evidence|Implication|Why|What I would do next)\s*:\s*/i,
      "",
    )
    .replace(/^[-·]\s*/, "")
    .trim();
}

function isUsefulSupport(sentence: string): boolean {
  return /\$|\d|value|budget|vendor|renewal|run|change|proof|gap|risk|owner|portfolio|program|spend|CIO|board/i.test(
    sentence,
  );
}

function compactForChat(
  text: string,
  targetChars: number,
  maxParagraphs: number,
  nextStepFallback: string,
): string {
  const normalized = normalizeWhitespace(text);
  if (
    normalized.length <= targetChars &&
    paragraphSplit(normalized).length <= maxParagraphs
  ) {
    return normalized;
  }

  const proseOnly = removeMarkdownTables(normalized);
  const sentences = sentenceSplit(proseOnly);
  const paragraphs = paragraphSplit(proseOnly);
  const lead = trimWords(
    cleanLeadLine(
      sentences.find((sentence) =>
        /\b(read|answer|recommend|pause|inspect|compare|outlier|risk|value|budget|vendor|renewal|proof)\b/i.test(
          sentence,
        ),
      ) ??
        paragraphs.find(
          (paragraph) =>
            !/^(?:Inspect in this order|Spend comparison|Outliers worth flagging|Evidence gaps)\b/i.test(
              paragraph,
            ),
        ) ??
        sentences[0] ??
        normalized,
    ),
    34,
  );
  const tableLines = tableToCompactLines(normalized);
  const support = sentences
    .filter((sentence) => cleanLeadLine(sentence) !== lead)
    .filter(isUsefulSupport)
    .slice(0, tableLines.length > 0 ? 1 : 3)
    .map((sentence) => `- ${trimWords(cleanLeadLine(sentence), 24)}`);
  const next =
    sentences.find((sentence) =>
      /\b(next|ask|inspect|open|review|validate|challenge|compare|decide|pause|fund|assign)\b/i.test(
        sentence,
      ),
    ) ?? nextStepFallback;
  const lines = [
    lead,
    ...tableLines.slice(0, 3),
    ...support,
    `Next: ${trimWords(next.replace(/^[-·]?\s*Next:\s*/i, ""), 22)}`,
  ].filter(Boolean);
  let compact = normalizeWhitespace(lines.slice(0, maxParagraphs).join("\n"));
  if (compact.length <= targetChars) return compact;

  compact = normalizeWhitespace(
    [
      lead,
      ...support.slice(0, Math.max(1, maxParagraphs - 2)),
      `Next: ${trimWords(nextStepFallback, 18)}`,
    ]
      .filter(Boolean)
      .join("\n"),
  );
  if (compact.length <= targetChars) return compact;

  return normalizeWhitespace(
    [trimWords(lead, 26), `Next: ${trimWords(nextStepFallback, 18)}`].join(
      "\n",
    ),
  );
}

function buildLabelMap(
  labels: ReadonlyArray<SharedResponseLabel> = [],
): Map<string, string> {
  const map = new Map<string, string>();
  for (const item of labels) {
    const id = item.id.trim();
    const label = item.label.trim();
    if (!id || !label || id === label) continue;
    map.set(id, label);
  }
  return map;
}

function replaceLabels(
  text: string,
  labels: ReadonlyArray<SharedResponseLabel>,
): { text: string; replacements: Array<{ from: string; to: string }> } {
  let output = text;
  const replacements: Array<{ from: string; to: string }> = [];
  for (const [id, label] of buildLabelMap(labels)) {
    const next = output.replace(
      new RegExp(`\\b${escapeRegExp(id)}\\b`, "g"),
      label,
    );
    if (next !== output) replacements.push({ from: id, to: label });
    output = next;
  }
  return { text: output, replacements };
}

function stripUnmappedRawIds(text: string): string {
  return text
    .replace(UUID_RE, "the referenced item")
    .replace(RAW_ID_RE, "the referenced item")
    .replace(/\((?:\s*the referenced item\s*)\)/gi, "")
    .replace(/\s+—\s+the referenced item\b/gi, "")
    .replace(/\bthe referenced item\s+—\s+/gi, "");
}

export function findSharedResponseShapeIssues(
  text: string,
  args: {
    hardMaxChars?: number;
    maxParagraphs?: number;
    requireNextStep?: boolean;
  } = {},
): SharedResponseShapeIssue[] {
  const issues: SharedResponseShapeIssue[] = [];
  const rawIds = [...text.matchAll(UUID_RE), ...text.matchAll(RAW_ID_RE)].map(
    (match) => match[0],
  );
  if (rawIds.length > 0) {
    issues.push({
      code: "raw_id_leak",
      detail: [...new Set(rawIds)].slice(0, 8).join(", "),
    });
  }
  const brands = [...text.matchAll(BANNED_BRAND_RE)].map((match) => match[0]);
  if (brands.length > 0) {
    issues.push({
      code: "banned_brand_leak",
      detail: [...new Set(brands)].join(", "),
    });
  }
  const maxChars = args.hardMaxChars ?? 1100;
  if (
    text.length > maxChars ||
    paragraphSplit(text).length > (args.maxParagraphs ?? 5)
  ) {
    issues.push({
      code: "length_over_target",
      detail: `${text.length} chars, ${paragraphSplit(text).length} paragraphs`,
    });
  }
  if (args.requireNextStep && !hasNextStep(text)) {
    issues.push({
      code: "missing_next_step",
      detail: "No next-step affordance found.",
    });
  }
  return issues;
}

export function shapeSharedAdvisorResponse(
  input: SharedResponseShapeInput,
): SharedResponseShapeResult {
  const targetChars = input.targetChars ?? 900;
  const hardMaxChars = input.hardMaxChars ?? 1100;
  const maxParagraphs = input.maxParagraphs ?? 5;
  const nextStepFallback =
    input.nextStepFallback ??
    "ask aVa to inspect the supporting evidence, compare options, or shape the next action.";
  const labeled = replaceLabels(
    normalizeWhitespace(input.text),
    input.labels ?? [],
  );
  const brandClean = labeled.text.replace(BANNED_BRAND_RE, "aVa");
  const idClean = stripUnmappedRawIds(brandClean);
  const compacted = compactForChat(
    idClean,
    targetChars,
    maxParagraphs,
    nextStepFallback,
  );
  const withNext =
    input.requireNextStep && !hasNextStep(compacted)
      ? normalizeWhitespace(`${compacted}\n\nNext: ${nextStepFallback}`)
      : compacted;
  const finalText = normalizeWhitespace(
    stripUnmappedRawIds(withNext).replace(BANNED_BRAND_RE, "aVa"),
  );
  return {
    text: finalText,
    replacements: labeled.replacements,
    issues: findSharedResponseShapeIssues(finalText, {
      hardMaxChars,
      maxParagraphs,
      requireNextStep: input.requireNextStep,
    }),
  };
}
