export interface SharedResponseLabel {
  id: string;
  label: string;
}

export interface SharedResponseShapeIssue {
  code: "raw_id_leak" | "banned_brand_leak" | "length_over_target";
  detail: string;
}

export interface SharedResponseShapeResult {
  text: string;
  issues: SharedResponseShapeIssue[];
  replacements: Array<{ from: string; to: string }>;
}

// Backlog item 41 — `requireNextStep` and `nextStepFallback` were removed from
// this input. #4038 deleted the manufactured "- Next: …" closing they existed to
// configure, along with `hasNextStep` and the `missing_next_step` issue code,
// and recorded that removal in
// `docs/releases/records/2026-06-27-tower-stock-closing-contract.md`. The two
// options survived the deletion and read as a guarantee while doing nothing:
// `requireNextStep` was threaded into `findSharedResponseShapeIssues`, which
// never read it, and `nextStepFallback` was read nowhere at all. A caller
// setting either got silence.
//
// Do not re-add them here. A next step belongs to whatever produced the answer
// — see #7809, which puts an intent-specific next action in Tower's own answer
// assembly path — not to a shaper that would have to invent one. The behaviour
// is pinned by
// `src/__tests__/behaviors/shared-shaper-no-manufactured-next-step.test.ts`.
export interface SharedResponseShapeInput {
  text: string;
  preserveStructure?: boolean;
  labels?: ReadonlyArray<SharedResponseLabel>;
  targetChars?: number;
  hardMaxChars?: number;
  maxParagraphs?: number;
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

// Backlog item C-503 — this splits on a BLANK line only.
//
// It used to split on `/\n\s*\n|\n/`, so a soft line break inside a
// paragraph started a new "paragraph" and spent a slot of `maxParagraphs`.
// An answer inside both declared limits — under the character target, at or
// under the paragraph budget — was compacted anyway, for a reason that was
// not the stated one. Measured on the fixture the `C-009` comment in
// `src/__tests__/integration/intelligence-chat-shape.test.ts` names: 861
// characters (under the 900-char target) in 5 paragraphs (at the
// 5-paragraph budget) but 6 lines.
//
// Not every count in this module wants paragraphs — see `lineSplit` below,
// which is what the two line-shaped readers use. The distinction is the
// whole of the fix: a budget called `maxParagraphs` is measured in
// paragraphs, and a rebuild whose parts are joined by single newlines is
// measured in lines.
function paragraphSplit(text: string): string[] {
  return text
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
}

// The line-shaped counterpart, carrying the behaviour `paragraphSplit` used
// to provide to its two line-shaped readers. Kept separate rather than
// folded back in: both readers below would be WRONG on paragraphs, and one
// of them would be silently unfailable.
function lineSplit(text: string): string[] {
  return text
    .split(/\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function trimWords(text: string, maxWords: number): string {
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (words.length <= maxWords) return text.trim();
  return `${stripDanglingTrimTail(words.slice(0, maxWords).join(" "))}.`;
}

function stripDanglingTrimTail(text: string): string {
  const original = text.trim();
  let cleaned = original.replace(/[,:;.\s—-]+$/, "").trim();

  const lastOpenParen = cleaned.lastIndexOf("(");
  const lastCloseParen = cleaned.lastIndexOf(")");
  if (lastOpenParen > lastCloseParen) {
    cleaned = cleaned.slice(0, lastOpenParen).trim();
  }

  cleaned = cleaned
    .replace(
      /\s+\b(?:and|or|but|with|to|of|for|from|against|into|about|on|at|by|as|than|while|because|before|after|if|then)\b$/i,
      "",
    )
    .replace(
      /\s+(?:ask|open|inspect|review|validate|compare|shape|assign|fund|pause|decide|route)\s+(?:the|a|an|this|that|first|next|cited|supporting){0,2}$/i,
      "",
    )
    .trim();

  return cleaned || original.replace(/[,:;.\s—-]+$/, "").trim();
}

function isStockInstruction(text: string): boolean {
  return /(?:ask (?:me|aVa) to inspect .*?(?:compare options|shape this|shape the next)|supporting (?:material|evidence),\s*compare options,\s*or shape|evidence,\s*risks?,\s*or\s*next actions?)/i.test(
    text,
  );
}

// Counts LINES, and must. Its only caller checks the rebuilt compact answer
// below, which is assembled as `lines.slice(0, maxParagraphs).join("\n")` —
// single newlines, no blank lines. Counting paragraphs there would return 1
// for every input the rebuild can produce.
//
// C-505 CORRECTED, BY MEASUREMENT: this is NOT a redundant guard, and the
// claim that stood here — that its caller's second operand "has no reachable
// FALSE case" — was wrong. C-503 measured the em-dash form of the
// `normalizeAssemblyArtifacts` " — Breakdown:" rewrite against the PROSE
// path, where it is genuinely consumed: `proseOnly` is re-run through
// `normalizeAssemblyArtifacts` inside `compactForChat`, so the lead, the
// support bullets and the next line cannot carry it. Two things that
// measurement did not cover:
//
//  - `tableToCompactLines` reads `normalized`, which is the ONE text feeding
//    the rebuild that is not re-run through `normalizeAssemblyArtifacts`
//    after `replaceLabels` has substituted caller-supplied label text into
//    the answer.
//  - The table branch neutralises the em dash only (`/\s+—\s+/g` to ": "),
//    while the artifact rule matches a hyphen, an en dash AND an em dash.
//
// So a label carrying `" - Breakdown: "` reaches the rebuild live and breaks
// one entry across two lines. Measured through the public entry point: a
// first rebuild of 534 characters against a 900-character target — the
// character half passes it — at six visible lines against a five-line
// budget, so this half rejects it and the harsher second rebuild answers
// instead. Pinned by
// `src/__tests__/behaviors/shared-shaper-compact-line-gate.test.ts`, which
// also kills the paragraph-count mutation that survived the C-503 suite.
//
// Do not delete the operand beside this, and do not widen this function to
// count paragraphs — the suite turns red on both. Closing the path by
// widening the table branch to `[-–—]` is a real option and a real behaviour
// change on table answers; it belongs to its own reviewed item.
function countCompactLines(text: string): number {
  return lineSplit(text).length;
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
    .replace(/\n+/g, " ")
    .replace(
      /^(?:My read|Read|Answer|Evidence|Implication|Why|What I would do next)\s*:\s*/i,
      "",
    )
    .replace(/^(?:Next|Next move)\s*:\s*/i, "")
    .replace(/^[-·]\s*/, "")
    .trim();
}

function isBulletLine(text: string): boolean {
  return /^\s*[-·]\s+/.test(text);
}

function compactBulletLines(lines: string[]): string | null {
  const bulletLines = lines
    .filter(isBulletLine)
    .map((line) => cleanLeadLine(line).replace(/\s+—\s+/g, ": "));
  if (bulletLines.length === 0) return null;
  return bulletLines.slice(0, 4).join("; ");
}

function removeSectionHeadings(text: string): string {
  return text
    .split("\n")
    .filter(
      (line) =>
        !/^\s*(?:My read|Why|Evidence|Evidence gaps|Decision fork|What I would do next|Spend comparison|Inspect in this order|Outliers worth flagging|Top concentrations by contract value|Two patterns worth flagging)\s*:?\s*$/i.test(
          line,
        ),
    )
    .join("\n");
}

function segmentKey(value: string): string {
  return value
    .toLowerCase()
    .replace(/^[-·]\s*/, "")
    .replace(/^(?:breakdown|evidence|read|implication|next(?: move)?):\s*/i, "")
    .replace(/[—–-]/g, " ")
    .replace(/[$,.:;()[\]]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function dedupeSemicolonSegments(line: string): string {
  const segments = line
    .split(/\s*;\s*/)
    .map((segment) => segment.trim())
    .filter(Boolean);
  if (segments.length < 3) return line;

  const seen = new Set<string>();
  const deduped: string[] = [];
  for (const segment of segments) {
    const key = segmentKey(segment);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    deduped.push(segment);
  }
  return deduped.join("; ");
}

function dedupeVisibleLines(text: string): string {
  const seen = new Set<string>();
  const lines: string[] = [];
  for (const rawLine of text.split("\n")) {
    const line = dedupeSemicolonSegments(rawLine.trim());
    if (!line) {
      if (lines.at(-1) !== "") lines.push("");
      continue;
    }
    const key = segmentKey(line);
    if (key && seen.has(key)) continue;
    if (key) seen.add(key);
    lines.push(line);
  }
  return lines.join("\n");
}

function normalizeAssemblyArtifacts(text: string): string {
  return dedupeVisibleLines(
    text
      .replace(/\b(supporting)\s+\1\b/gi, "$1")
      .replace(
        /\b(Read|Evidence|Implication|Next(?: move)?)\s*:\s*\1\s*:/gi,
        "$1:",
      )
      .replace(/\bNext\s*:\s*Next(?: move)?\s*:/gi, "Next:")
      .replace(/\bNext\s*:\s*-\s*Next\s*:/gi, "Next:")
      .replace(/\bBreakdown\s*:\s*;\s*/gi, "Breakdown: ")
      .replace(/\s*;\s*[-–—]\s*/g, "; ")
      .replace(/\s+[-–—]\s+Breakdown\s*:\s*[-–—]?\s*/gi, "\nBreakdown: ")
      // A connector stranded at the end of a line used to be treated as
      // proof that the sentence had been cut, and the connector plus its
      // period were deleted. That is only true for a coordinating
      // conjunction: English strands prepositions freely ("the comparison
      // you asked for.", "the baseline we measured against.") and uses
      // several subordinators adverbially ("paused for a while.", "nobody
      // has raised this before."). The old list carried all of them, so
      // finished prose was delivered with its last word missing. A
      // sentence never legitimately ends in "and", "or" or "but", so those
      // stay — and the cut sentence is closed with a period rather than
      // left hanging on a comma.
      .replace(/(?:\s*,)?\s*\b(?:and|or|but)\.(?=\s*(?:\n|$))/gi, ".")
      .replace(/\s+([,.;:!?])/g, "$1"),
  );
}

function isUsefulSupport(sentence: string): boolean {
  if (
    /^\s*(?:why|evidence|my read|next|what i would do next)\s*:?\s*$/i.test(
      sentence,
    )
  ) {
    return false;
  }
  return /\$|\d|value|budget|vendor|renewal|run|change|proof|gap|risk|owner|portfolio|program|spend|CIO|board/i.test(
    sentence,
  );
}

function compactForChat(
  text: string,
  targetChars: number,
  maxParagraphs: number,
): string {
  const normalized = normalizeWhitespace(text);
  if (
    normalized.length <= targetChars &&
    paragraphSplit(normalized).length <= maxParagraphs
  ) {
    return normalized;
  }

  const proseOnly = removeSectionHeadings(
    removeMarkdownTables(normalizeAssemblyArtifacts(normalized)),
  );
  const sentences = sentenceSplit(proseOnly.replace(/\n+/g, " "));
  // Lead candidates, not paragraphs: this list feeds a `.find()` for the
  // first non-heading LINE to promote into the opening sentence, and it is
  // then word-trimmed to 34 words. A blank-line paragraph here would hand
  // `trimWords` a multi-line block. C-503 kept this reader on lines
  // deliberately rather than sweeping it along with the budget fix.
  const leadCandidateLines = lineSplit(proseOnly);
  const lead = trimWords(
    cleanLeadLine(
      sentences.find((sentence) =>
        /\b(read|answer|recommend|pause|inspect|compare|outlier|risk|value|budget|vendor|renewal|proof)\b/i.test(
          sentence,
        ),
      ) ??
        leadCandidateLines.find(
          (line) =>
            !/^(?:Inspect in this order|Spend comparison|Outliers worth flagging|Evidence gaps)\b/i.test(
              line,
            ),
        ) ??
        sentences[0] ??
        normalized,
    ),
    34,
  );
  const tableLines = tableToCompactLines(normalized);
  const sourceLines = proseOnly
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  const bulletSummary = compactBulletLines(sourceLines);
  const support = sentences
    .filter((sentence) => cleanLeadLine(sentence) !== lead)
    .filter(isUsefulSupport)
    .filter((sentence) => !isStockInstruction(sentence))
    .filter((sentence) => !isBulletLine(sentence))
    .slice(0, tableLines.length > 0 || bulletSummary ? 1 : 3)
    .map((sentence) => `- ${trimWords(cleanLeadLine(sentence), 24)}`);
  const next =
    sentences.find(
      (sentence) =>
        /^\s*(?:next|what i would do next)\b/i.test(sentence) &&
        !isStockInstruction(sentence),
    ) ?? null;
  const lines = [
    lead,
    tableLines.length > 0
      ? tableLines
          .slice(0, 3)
          .map((line) => cleanLeadLine(line).replace(/\s+—\s+/g, ": "))
          .join("; ")
      : bulletSummary,
    ...support,
    next ? trimWords(cleanLeadLine(next), 22) : null,
  ].filter(Boolean);
  let compact = normalizeWhitespace(
    normalizeAssemblyArtifacts(lines.slice(0, maxParagraphs).join("\n")),
  );
  if (
    compact.length <= targetChars &&
    countCompactLines(compact) <= maxParagraphs
  ) {
    return compact;
  }

  compact = normalizeWhitespace(
    normalizeAssemblyArtifacts(
      [
        lead,
        bulletSummary ?? support[0],
        next ? trimWords(cleanLeadLine(next), 18) : null,
      ]
        .filter(Boolean)
        .join("\n"),
    ),
  );
  if (compact.length <= targetChars) return compact;

  return normalizeWhitespace(
    normalizeAssemblyArtifacts(
      [trimWords(lead, 26), next ? trimWords(cleanLeadLine(next), 18) : null]
        .filter(Boolean)
        .join("\n"),
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

/**
 * What a visible identifier is replaced with when no label maps it.
 *
 * Exported because a second pass scrubs the same text: an agent answer is
 * shaped once as it streams (`shapeStreamingAgentTextForSurface`) and again
 * once it settles (`shapeAgentResponseForSurface`). This shaper is authoritative
 * for the stored/settled answer; the streaming repair is independently
 * authoritative for transient chunks that can be visible before settlement.
 * The redundancy is intentional because neither user-visible path can rely on
 * the other having run. The streaming pass rewrites the same identifier classes in
 * `src/lib/agent/output-discipline/response-contract.ts`, which imports this
 * constant so the two cannot answer differently. They did: a bare UUID read as
 * "the referenced item" once settled and "the referenced record" while
 * streaming, so the sentence a reader watched arrive was not the sentence they
 * were left with. Pinned by
 * `src/__tests__/behaviors/agent-identifier-placeholder-consistency.test.ts`,
 * which compares the two passes rather than either literal.
 */
export const UNMAPPED_IDENTIFIER_PLACEHOLDER = "the referenced item";

const PLACEHOLDER_RE = escapeRegExp(UNMAPPED_IDENTIFIER_PLACEHOLDER);

function stripUnmappedRawIds(text: string): string {
  return text
    .replace(UUID_RE, UNMAPPED_IDENTIFIER_PLACEHOLDER)
    .replace(RAW_ID_RE, UNMAPPED_IDENTIFIER_PLACEHOLDER)
    .replace(new RegExp(`\\((?:\\s*${PLACEHOLDER_RE}\\s*)\\)`, "gi"), "")
    .replace(new RegExp(`\\s+—\\s+${PLACEHOLDER_RE}\\b`, "gi"), "")
    .replace(new RegExp(`\\b${PLACEHOLDER_RE}\\s+—\\s+`, "gi"), "");
}

function findSharedResponseShapeIssues(
  text: string,
  args: {
    hardMaxChars?: number;
    maxParagraphs?: number;
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
  return issues;
}

export function shapeSharedAdvisorResponse(
  input: SharedResponseShapeInput,
): SharedResponseShapeResult {
  const targetChars = input.targetChars ?? 900;
  const hardMaxChars = input.hardMaxChars ?? 1100;
  const maxParagraphs = input.maxParagraphs ?? 5;
  const labeled = replaceLabels(
    normalizeWhitespace(normalizeAssemblyArtifacts(input.text)),
    input.labels ?? [],
  );
  const brandClean = labeled.text.replace(BANNED_BRAND_RE, "aVa");
  const idClean = stripUnmappedRawIds(brandClean);
  const compacted = input.preserveStructure
    ? idClean
    : compactForChat(idClean, targetChars, maxParagraphs);
  const finalText = normalizeWhitespace(
    normalizeAssemblyArtifacts(
      stripUnmappedRawIds(compacted).replace(BANNED_BRAND_RE, "aVa"),
    ),
  );
  return {
    text: finalText,
    replacements: labeled.replacements,
    issues: findSharedResponseShapeIssues(finalText, {
      hardMaxChars,
      maxParagraphs,
    }),
  };
}
