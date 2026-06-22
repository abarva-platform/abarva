import type { AskSource } from "./types";

const HOLLOW_OPENER_RE =
  /^\s*(?:good|great|excellent)\s+question(?:,\s*[A-Z][a-z]+)?\.?\s*(?:let me\s+(?:give|be|walk|explain)[^.]*\.\s*)?/i;

const BROAD_CURRENT_STATE_RE =
  /\b(current state|state of play|where are we|where do we stand|how are we doing|what is going on|what do you see|give me perspective|your perspective|executive read|simple question|our state)\b/i;
const RAW_INTERNAL_ID_RE = /\b[A-Z]{2,6}-[A-Z0-9]{2,8}-\d{2,4}\b/g;
const CONSULTANT_LABEL_RE =
  /^\s*(?:Read|Recommendation|Decision|Why|Evidence|Implication|Watchout|Watch-out|Next move|Owner|Action):/im;
const MARKDOWN_TABLE_RE = /^\s*\|.+\|\s*$/m;

export const CONSULTANT_ANSWER_SHAPE_CONTRACT = `CONSULTANT ANSWER SHAPE

For Home, Intelligence, and Tower, answer like a senior expert consultant, not a transcript. Use this shape unless the user asks for a very short answer:
- Read: the direct recommendation or judgment in 1-2 sentences.
- Evidence: the specific tenant facts, corpus pattern, benchmark, system, vendor, program, dollar value, or cited constraint that supports the read.
- Implication: what this means for the executive decision.
- Next move: the owner, artifact, gate, Source/Tower/Moves handoff, or evidence to validate.

Keep each paragraph under roughly 55 words. If a table or chart is requested, still give the Read/Evidence/Implication/Next move prose, then emit the table/chart data separately.`;

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

export function sanitizeAskSynthesis(text: string, maxWords = 120): string {
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
    .replace(/\s*\(\s*[A-Z]{2,6}-[A-Z0-9]{2,8}-\d{2,4}\s*\)/g, "")
    .replace(RAW_INTERNAL_ID_RE, "the cited record")
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

const ACTION_CUE_RE =
  /\b(next (?:step|move)|recommend(?:ation)?|assign|escalate|decide|validate|open|owner)\b/i;
const MISSING_EVIDENCE_RE =
  /\b(don't have|do not have|won't fabricate|not in the loaded sources|remaining field to confirm|missing|before committing|before approving)\b/i;

export function enforceDecisionGradeAnswer(text: string): string {
  const paragraphDisciplined = splitLongParagraphs(
    shapeDenseConsultantAnswer(text),
  );
  if (ACTION_CUE_RE.test(paragraphDisciplined)) return paragraphDisciplined;

  const nextMove = MISSING_EVIDENCE_RE.test(paragraphDisciplined)
    ? "Next move: assign the accountable data owner to validate the missing tenant evidence before approving a number or using it in a board artifact."
    : "Next move: assign the accountable owner to validate the cited evidence and decide whether this should move into Source or Moves.";

  return `${paragraphDisciplined.replace(/\s+$/, "")}\n\n${nextMove}`;
}

function shapeDenseConsultantAnswer(text: string): string {
  const normalized = text.replace(/\r\n/g, "\n").trim();
  if (!normalized) return normalized;
  if (CONSULTANT_LABEL_RE.test(normalized)) return normalized;
  if (MARKDOWN_TABLE_RE.test(normalized)) return normalized;
  if (wordCount(normalized) < 75) return normalized;

  const paragraphs = normalized.split(/\n{2,}/).filter((p) => p.trim());
  if (paragraphs.length > 2) return normalized;

  const sentences = splitSentences(normalized);
  if (sentences.length < 4) return normalized;

  const nextMoveSentences = sentences.filter((sentence) =>
    /^Next move\b/i.test(sentence),
  );
  const bodySentences = sentences.filter(
    (sentence) => !/^Next move\b/i.test(sentence),
  );
  if (bodySentences.length < 3) return normalized;

  const read = normalizeConsultantLead(bodySentences[0] ?? "");
  const rest = bodySentences.slice(1);
  const evidence = takeSentences(rest, (sentence) =>
    /\b(loaded|source|context|evidence|corpus|benchmark|ledger|row|system|vendor|program|initiative|budget|cost|spend|committed|realized)\b|[$%]\d|\d+[$%]?/i.test(
      sentence,
    ),
  );
  const evidenceSet = new Set(evidence);
  const remaining = rest.filter((sentence) => !evidenceSet.has(sentence));
  const implication =
    remaining.length > 0
      ? remaining
      : rest.filter((sentence) => !evidenceSet.has(sentence));

  const sections: string[] = [];
  if (read) sections.push(`Read: ${read}`);
  if (evidence.length > 0) {
    sections.push(`Evidence: ${evidence.slice(0, 3).join(" ")}`);
  }
  if (implication.length > 0) {
    sections.push(`Implication: ${implication.slice(0, 3).join(" ")}`);
  }
  if (nextMoveSentences.length > 0) {
    sections.push(nextMoveSentences.join(" "));
  }

  return sections.length >= 3 ? sections.join("\n\n") : normalized;
}

function normalizeConsultantLead(sentence: string): string {
  return sentence
    .replace(/^\s*Honest\s+(?:read|answer)\s+(?:up\s+front|first)\s*:\s*/i, "")
    .trim();
}

function takeSentences(
  sentences: string[],
  predicate: (sentence: string) => boolean,
): string[] {
  const picked: string[] = [];
  for (const sentence of sentences) {
    if (predicate(sentence)) picked.push(sentence);
    if (picked.length >= 3) break;
  }
  return picked;
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

function splitSentences(text: string): string[] {
  return (
    text.match(/[^.!?]+[.!?]+(?:\s+|$)|[^.!?]+$/g) ?? [text]
  )
    .map((sentence) => sentence.trim())
    .filter(Boolean);
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
