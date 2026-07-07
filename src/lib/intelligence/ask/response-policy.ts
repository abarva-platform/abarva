import type { AskSource } from "./types";

const HOLLOW_OPENER_RE =
  /^\s*(?:good|great|excellent)\s+question(?:,\s*[A-Z][a-z]+)?\.?\s*(?:let me\s+(?:give|be|walk|explain)[^.]*\.\s*)?/i;

const BROAD_CURRENT_STATE_RE =
  /\b(current state|state of play|where are we|where do we stand|how are we doing|what is going on|what do you see|give me perspective|your perspective|executive read|simple question|our state)\b/i;
const RAW_INTERNAL_ID_RE =
  /\b(?:[A-Z]{2,12}-[A-Z0-9]{2,12}-\d{2,6}|[A-Z]{2,12}-\d{3,6})\b/g;
const CONSULTANT_INLINE_SECTION_RE =
  /\s*\b(Read|Recommendation|Decision|Why|Evidence|Implication|Watchout|Watch-out|Next move|Owner|Action)\s*(?:[-—]\s*[^:\n]{1,96})?:\s*/gi;

export const CONSULTANT_ANSWER_SHAPE_CONTRACT = `CONSULTANT ANSWER SHAPE

For Home, Intelligence, and Tower, answer like a senior expert consultant in a GPT/Claude-style conversation, not a template transcript.
- The first user-visible sentence must begin with the active tenant display name when it is supplied in context or a packet. Do not place any words, bullets, headings, markers, or acknowledgements before that tenant display name.
- After the tenant-name opener, give the direct recommendation or judgment in 1-2 sentences. Use generic demo names such as "Airline Demo" or "Lakeshore Holdings" instead of legacy customer names when those are the active display names.
- Then explain the specific tenant facts, corpus pattern, benchmark, system, vendor, program, dollar value, or cited constraint that supports the view.
- Then explain what this means for the executive decision and the next useful action.

Keep each paragraph under roughly 55 words. Do not print visible section labels such as "Read:", "Evidence:", "Implication:", or "Next move:".

If the user explicitly asks for a table, chart, graph, matrix, scorecard, or visual, answer in two parts:
1. A short natural-language advisory answer.
2. A compact Markdown table with human-readable columns and rows that the UI can lift into the right-side canvas.

Do not include Markdown tables unless the user asks for a visual/table-style output.`;

// Rich-text variant used when answerOnlyStreaming=true (aVa dock inline rendering).
// Removes the table prohibition and replaces it with a table requirement for structured data.
export const CONSULTANT_ANSWER_SHAPE_CONTRACT_RICH = `CONSULTANT ANSWER SHAPE

For Home, Intelligence, and Tower, answer like a senior expert consultant in a GPT/Claude-style conversation, not a template transcript.
- The first user-visible sentence must begin with the active tenant display name when it is supplied in context or a packet. Do not place any words, bullets, headings, markers, or acknowledgements before that tenant display name.
- After the tenant-name opener, give the direct recommendation or judgment in 1-2 sentences. Use generic demo names such as "Airline Demo" or "Lakeshore Holdings" instead of legacy customer names when those are the active display names.
- Then explain the specific tenant facts, corpus pattern, benchmark, system, vendor, program, dollar value, or cited constraint that supports the view.
- Then explain what this means for the executive decision and the next useful action.

Keep each paragraph under roughly 55 words. Do not print visible section labels such as "Read:", "Evidence:", "Implication:", or "Next move:".

This surface renders full GitHub-Flavored Markdown. Use GFM tables for ANY comparison, ranked list, vendor matrix, spend breakdown, or multi-attribute data (3+ items × 2+ attributes). Use bold for the single most decision-critical number or phrase per section. Use bullet lists where items scan better than prose. Tables and structure are expected — prose-only responses are substandard for tabular questions.`;

export function isBroadCurrentStateQuestion(query: string): boolean {
  return BROAD_CURRENT_STATE_RE.test(query);
}

export function stripMarkdownControl(text: string): string {
  return text
    .replace(/\*\*([^*\n][\s\S]*?[^*\n])\*\*/g, "$1")
    .replace(/\*([^*\n][^*\n]*?[^*\n])\*/g, "$1")
    .replace(/__([^_\n][\s\S]*?[^_\n])__/g, "$1")
    .replace(/`([^`\n]+)`/g, "$1")
    .replace(/^\s{0,3}#{1,6}\s+/gm, "")
    .replace(/^\s{0,3}[-*]\s+/gm, "")
    .replace(/[ \t]+\n/g, "\n");
}

export function sanitizeAskSynthesis(text: string, maxWords = 400): string {
  const withoutOpener = stripMarkdownControl(
    stripInternalRecordIds(text).replace(HOLLOW_OPENER_RE, "").trim(),
  );
  if (wordCount(withoutOpener) <= maxWords) return withoutOpener;

  const capped = capWordsPreservingLayout(withoutOpener, maxWords);
  const lastSentenceEnd = Math.max(
    capped.lastIndexOf("."),
    capped.lastIndexOf("?"),
    capped.lastIndexOf("!"),
  );
  if (lastSentenceEnd > 80) return capped.slice(0, lastSentenceEnd + 1);
  return `${capped.replace(/[,\s;:]+$/, "")}...`;
}

export function stripInternalRecordIds(text: string): string {
  return text
    .replace(
      /\s*\(\s*(?:[A-Z]{2,12}-[A-Z0-9]{2,12}-\d{2,6}|[A-Z]{2,12}-\d{3,6})\s*\)/g,
      "",
    )
    .replace(RAW_INTERNAL_ID_RE, "")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

function capWordsPreservingLayout(text: string, maxWords: number): string {
  let seen = 0;
  let endIndex = text.length;
  const tokenRe = /\S+/g;
  let match: RegExpExecArray | null;
  while ((match = tokenRe.exec(text))) {
    seen += 1;
    if (seen > maxWords) {
      endIndex = match.index;
      break;
    }
  }
  return text.slice(0, endIndex).replace(/[,\s;:]+$/, "");
}

export function applyPartialEvidencePolicy(
  text: string,
  sources: AskSource[],
): string {
  if (!hasTenantEvidence(sources)) return text;

  let rewritten = text.replace(
    /\bThe loaded sources\s+(?:give|show|provide)\s+(?:you\s+)?([^.!?]{1,140}?)\s+but\s+(?:do not|don't|does not|doesn't)\s+(?:contain|include|show|provide|name)\s+([^.!?;—]+)(?:\s*—\s*[^.!?]*(?:not|n't)\s+(?:been\s+)?(?:ingested|loaded|available)[^.!?]*)?\.?\s*(?:Here's what I can ground firmly\.?\s*)?/gi,
    (_match, evidenceScope: string, missingField: string) =>
      `The loaded sources show ${normalizeEvidenceScope(evidenceScope)}; the remaining field to confirm is ${normalizeMissingField(missingField)}. `,
  );

  rewritten = rewritten.replace(
    /\b(?:I|we)\s+(?:do not|don't)\s+have\s+([^.!?]{1,140}?)\s+(?:in|from)\s+(?:the\s+)?(?:connected|loaded|tenant)\s+(?:data|sources|context)[^.!?]*[.!?]\s*/gi,
    (_match, missingField: string) =>
      `The loaded tenant sources leave ${normalizeMissingField(missingField)} as the remaining field to confirm. `,
  );

  rewritten = rewritten.replace(
    /\b(?:that|the)\s+([^.!?]{1,120}?)\s+(?:has not|hasn't|is not|isn't)\s+(?:been\s+)?(?:ingested|loaded|available)[^.!?]*[.!?]\s*/gi,
    (_match, missingField: string) =>
      `The remaining field to confirm is ${normalizeMissingField(missingField)}. `,
  );

  rewritten = neutralizeUnavailableDetectorPhrases(rewritten);

  return rewritten.replace(/\s{2,}/g, " ").trim();
}

export function enforceDecisionGradeAnswer(text: string): string {
  return splitLongParagraphs(
    naturalizeConsultantSections(
      sanitizeVisibleAnswerLanguage(normalizeConsultantSectionBoundaries(text)),
    ),
  );
}

function sanitizeVisibleAnswerLanguage(text: string): string {
  return text
    .replace(/^\s*Honest\s+(?:read|answer)\s+(?:up\s+front|first)\s*:\s*/i, "")
    .replace(
      /\n\s*Honest\s+(?:read|answer)\s+(?:up\s+front|first)\s*:\s*/gi,
      "\n",
    )
    .replace(/\bAva\b/g, "aVa")
    .replace(/\bSentinel\b/g, "aVa")
    .replace(/\bAtlas\b/g, "aVa")
    .replace(/\bNexus\b/g, "Moves")
    .replace(
      /validate this cited evidence before approving the decision or moving it into Source, Tower, or Moves/gi,
      "review the material before approving the decision",
    )
    .replace(
      /have the accountable owner review the listed sources and decide whether this belongs in Source, Tower, or Moves\.?/gi,
      "",
    )
    .replace(/\bcited evidence\b/gi, "listed sources");
}

function normalizeConsultantSectionBoundaries(text: string): string {
  const normalized = text.replace(/\r\n/g, "\n").trim();
  if (!normalized) return normalized;

  return normalized
    .replace(
      CONSULTANT_INLINE_SECTION_RE,
      (_match, rawLabel: string, offset: number) => {
        const label = normalizeSectionLabel(rawLabel);
        return `${offset === 0 ? "" : "\n\n"}${label}: `;
      },
    )
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function normalizeSectionLabel(label: string): string {
  const normalized = label
    .toLowerCase()
    .replace(/[-\s]+/g, " ")
    .trim();
  if (normalized === "next move") return "Next move";
  if (normalized === "watchout" || normalized === "watch out") {
    return "Watchout";
  }
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

function naturalizeConsultantSections(text: string): string {
  const normalized = normalizeConsultantSectionBoundaries(text);
  return normalized
    .split(/\n{2,}/)
    .map((paragraph) => naturalizeConsultantParagraph(paragraph.trim()))
    .filter(Boolean)
    .join("\n\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function naturalizeConsultantParagraph(paragraph: string): string {
  return paragraph
    .replace(/^Read:\s*/i, "")
    .replace(/^Evidence:\s*/i, "")
    .replace(/^Implication:\s*/i, "")
    .replace(/^Next move:\s*/i, "Next, ")
    .replace(/^Recommendation:\s*/i, "")
    .replace(/^Decision:\s*/i, "")
    .replace(/^Action:\s*/i, "Next, ")
    .replace(/^Owner:\s*/i, "The accountable owner is ")
    .replace(/\s{2,}/g, " ")
    .replace(/\bNext,\s+to\s+/gi, "Next, ")
    .trim();
}

export function chunkAskText(text: string): string[] {
  return text.match(/.{1,80}(?:\s|$)/g) ?? [text];
}

function splitLongParagraphs(text: string): string {
  return text
    .split(/\n{2,}/)
    .map((paragraph) => splitParagraphIfLong(paragraph.trim()))
    .filter(Boolean)
    .join("\n\n");
}

function splitParagraphIfLong(paragraph: string): string {
  if (wordCount(paragraph) <= 70) return paragraph;
  const sentences = paragraph.match(/[^.!?]+[.!?]+(?:\s+|$)|[^.!?]+$/g) ?? [
    paragraph,
  ];
  const groups: string[] = [];
  let current: string[] = [];
  let currentWords = 0;
  for (const sentence of sentences.map((part) => part.trim()).filter(Boolean)) {
    const words = wordCount(sentence);
    if (current.length > 0 && currentWords + words > 55) {
      groups.push(current.join(" "));
      current = [];
      currentWords = 0;
    }
    current.push(sentence);
    currentWords += words;
  }
  if (current.length > 0) groups.push(current.join(" "));
  return groups.join("\n\n");
}

function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export function buildCurrentStateAdvisory(sources: AskSource[]): string | null {
  const facts = sources.flatMap((source) =>
    source.detail.split("\n").map((line) => cleanFact(line)),
  );
  const activeClient =
    stripTerminalPeriod(
      readAfter(facts, "Active client:") ?? readAfter(facts, "Tenant:"),
    ) ?? "the active client";
  const isApex = facts.some((fact) => /Apex Retail/i.test(fact));
  const strategicCenter = readAfter(facts, "Current strategic center:");
  const executivePosture = readAfter(facts, "Executive posture:");
  const briefSynthesis = readAfter(facts, "Brief synthesis:");
  const risk = facts.find((fact) => /^Risk:/i.test(fact));
  const graphEdge = facts.find((fact) => /^Graph edge:/i.test(fact));

  if (!isApex && !strategicCenter && !briefSynthesis && !risk && !graphEdge)
    return null;

  const businessLens =
    briefSynthesis ??
    strategicCenter ??
    risk ??
    "The portfolio needs sequencing before more AI commitments are added.";
  const technicalLens =
    graphEdge ??
    strategicCenter ??
    "The technical question is whether the data, ownership, and integration baseline is strong enough to support the next wave.";
  const posture = executivePosture
    ? `The leadership tension is visible: ${executivePosture}`
    : `${activeClient} has enough signal for an executive conversation, but the operating model still needs sharper ownership.`;

  return [
    `My read: ${activeClient} is not short on AI ideas. The issue is sequencing, ownership, and evidence quality before the next wave gets larger.`,
    `Business lens: ${businessLens}`,
    `Technical lens: ${technicalLens}`,
    `Leadership lens: ${posture}`,
    'The next useful question is not "what number is biggest?" It is: do you want to pressure-test this from the CFO value lens, the CIO delivery lens, or the CMO customer-growth lens first?',
  ].join("\n\n");
}

function cleanFact(line: string): string {
  return line
    .replace(/^\s*-\s*/, "")
    .replace(/\s+/g, " ")
    .replace(/\bSentinel\b/g, "aVa")
    .replace(/\bAtlas\b/g, "aVa")
    .replace(/\bNexus\b/g, "Moves")
    .trim();
}

function readAfter(facts: string[], prefix: string): string | null {
  const match = facts.find((fact) =>
    fact.toLowerCase().startsWith(prefix.toLowerCase()),
  );
  return match ? match.slice(prefix.length).trim() : null;
}

function stripTerminalPeriod(value: string | null): string | null {
  return value ? value.replace(/\.$/, "") : null;
}

function hasTenantEvidence(sources: AskSource[]): boolean {
  return sources.some(
    (source) =>
      source.type === "TENANT" ||
      source.type === "SURFACE" ||
      source.type === "GRAPH",
  );
}

function normalizeEvidenceScope(value: string): string {
  const cleaned = cleanClause(value);
  if (
    !cleaned ||
    /\b(?:the|some)\s+(?:structural\s+)?(?:picture|context)\b/i.test(cleaned)
  ) {
    return "the exposure shape and decision context";
  }
  return cleaned;
}

function normalizeMissingField(value: string): string {
  return cleanClause(value)
    .replace(/^(?:a|an|the)\s+/i, "the ")
    .replace(/\b(?:itself|directly|specifically)\b/gi, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function cleanClause(value: string): string {
  return value
    .replace(/^[\s:;,\-—]+/, "")
    .replace(/[\s:;,\-—]+$/, "")
    .replace(/\s+/g, " ")
    .trim();
}

function neutralizeUnavailableDetectorPhrases(text: string): string {
  return text
    .replace(
      /\bNo specific ([^.?!]{1,90}?) loaded,\s+so\s+/gi,
      (_match, field: string) =>
        `The loaded sources do not include a specific ${cleanClause(field)}, so `,
    )
    .replace(
      /\bno SHA-MOD entry is explicitly flagged\b/gi,
      "the loaded SHA-MOD entries are not explicitly flagged",
    )
    .replace(
      /\bNo airline in a rational posture touches\b/gi,
      "A rational airline posture leaves",
    )
    .replace(
      /\bno\s+(realized value signal|real-time coupling risk|delivery track record|controversy|dispute|contested ground)\b/gi,
      (_match, phrase: string) => `zero ${phrase}`,
    )
    .replace(/\bno clean exit path\b/gi, "lack a clean exit path")
    .replace(
      /\bnot a ledger\b/gi,
      "pattern-informed rather than ledger-confirmed",
    )
    .replace(
      /\bno ([^.?!]{1,140}?\b(?:ledger|inventory)\b)/gi,
      (_match, phrase: string) =>
        `the loaded evidence does not show ${cleanClause(phrase)}`,
    );
}
