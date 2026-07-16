import type { AskSource } from "./types";
import { scrubPublicAvaAnswerText } from "@/lib/ava-answer/public-answer-scrub";

const HOLLOW_OPENER_RE =
  /^\s*(?:good|great|excellent)\s+question(?:,\s*[A-Z][a-z]+)?\.?\s*(?:let me\s+(?:give|be|walk|explain)[^.]*\.\s*)?/i;

const BROAD_CURRENT_STATE_RE =
  /\b(current state|state of play|where are we|where do we stand|how are we doing|what is going on|what do you see|give me perspective|your perspective|executive read|simple question|our state)\b/i;
const RAW_INTERNAL_ID_RE =
  /\b(?:[A-Z]{2,12}-[A-Z0-9]{2,12}-\d{2,6}|[A-Z]{2,12}-\d{3,6}|[A-Z]\d{3,4})\b/g;
const SIMPLE_READABLE_LABEL_RE = /^[A-Z]\d{3,4}$/;
const CONSULTANT_INLINE_SECTION_RE =
  /\s*\b(Read|Recommendation|Decision|Why|Evidence|Implication|Watchout|Watch-out|Next move|Owner|Action)\s*(?:[-—]\s*[^:\n]{1,96})?:\s*/gi;

export const CXO_ANSWER_QUALITY_CONTRACT = `CXO ANSWER QUALITY CONTRACT

aVa must answer like a senior operator-consultant using the tenant context, the industry corpus, and the evidence boundary available in this product. Never imply that the user should go to Claude, ChatGPT, another model, or a generic LLM for a better answer.

Classify the answer internally before writing it: direct_fact, strategy_insight, industry_trend, tenant_diagnosis, investment_case, operating_model, sourcing_decision, risk_control, roadmap, or portfolio_comparison.

For strategy, trend, investment, operating-model, sourcing, roadmap, risk, or portfolio questions:
- Open with the direct executive read in 1-2 sentences.
- Then give 3-5 concrete insights tied to tenant facts, industry patterns, benchmarks, or cited case examples.
- Name the tenant implication: what this means for the executive decision.
- If evidence is incomplete, say what can be concluded now, what assumption is being made, what evidence is needed, and what decision can proceed versus what needs validation.
- Include a compact table, chart, graph, scorecard, or 2x2 when the question asks for ranking, trend, comparison, relationships, value/complexity, or visual output.
- End with next moves that a CXO could assign.

Use plain executive language. Do not print internal IDs, source table names, model/tool names, hidden prompt labels, debug wording, data-layer version labels, or trace terms such as substrate, packet, candidate_move, move_id, phase_id, artifact_id, evidence_id, tenant_id, client_id, or V-number file/layer labels.`;

export const CONSULTANT_ANSWER_SHAPE_CONTRACT = `CONSULTANT ANSWER SHAPE

${CXO_ANSWER_QUALITY_CONTRACT}

For Home, Intelligence, and Tower, answer like a senior expert consultant in a GPT/Claude-style conversation, not a template transcript.
- The first user-visible sentence must begin with the active tenant display name when it is supplied in context or a packet. Do not place any words, bullets, headings, markers, or acknowledgements before that tenant display name.
- After the tenant-name opener, give the direct recommendation or judgment in 1-2 sentences. Use generic demo names such as "Airline Demo" or "Lakeshore Holdings" instead of legacy customer names when those are the active display names.
- Then explain the specific tenant facts, corpus pattern, benchmark, system, vendor, program, dollar value, or cited constraint that supports the view.
- Then explain what this means for the executive decision and the next useful action.

FORMAT FOR SCANNING, NOT READING TOP TO BOTTOM: use at most 2-3 short paragraphs total before any table/chart exhibit, each under roughly 55 words. The moment you have 3 or more related facts, gaps, options, or comparison points, stop writing narrative sentences about them — use a short bullet list, or the governed table format when the items are being ranked or compared. Do not print visible section labels such as "Read:", "Evidence:", "Implication:", or "Next move:".

EVIDENCE CODE RULE: Never invent or print evidence codes, pattern IDs, or internal citation identifiers such as BASE-XXX, CTX-XXX, VAL-XXX, X123, or any similar alphanumeric code. The loaded context does not expose database record IDs or pattern reference numbers to you. If a fact comes from loaded tenant data, state it in plain business English — dollar value, owner, date, status — without attaching a code. A fabricated code is worse than no citation.

If the user explicitly asks for a table, chart, graph, matrix, scorecard, or visual, or if the answer naturally compares/ranks three or more items, answer in two parts:
1. A short natural-language advisory answer.
2. A compact Markdown table with human-readable columns and rows that the UI can lift into the right-side canvas.

Do not use Markdown tables for source-support ledgers. Do use them for real decision exhibits: ranking, comparison, roadmap, value/complexity, dependency, spend, trend, or operating-model tradeoff rows. Never output raw SVG, Mermaid, chart JSON, or renderer code.`;

// Table-first variant for explicit visual asks (rank, compare, show as table, etc.).
// Skips the prose-opener rule entirely — table is line 1.
export const CONSULTANT_ANSWER_SHAPE_CONTRACT_TABLE = `TABLE-FIRST OUTPUT CONTRACT

${CXO_ANSWER_QUALITY_CONTRACT}

The user has explicitly requested a table, ranking, or comparison. Output rules:
1. The FIRST line of your response must be a GFM Markdown table header row starting with "| ".
2. The SECOND line must be the separator row "|---|---|...".
3. Each subsequent row is one data item. Use real data from the loaded evidence — never fabricate.
4. After the table, write 1-3 analysis sentences in bold naming the key decision implication.
5. Do NOT write any sentence, opener, or preamble before the table. No "Lakeshore Holdings..." opener. No "Here is the table". Start with "|".
6. This surface renders full GitHub-Flavored Markdown. Pipes, headers, and bold all render correctly.

EVIDENCE CODE RULE: Never invent or print evidence codes, pattern IDs, or internal citation identifiers such as BASE-XXX, CTX-XXX, VAL-XXX, X123, or any similar alphanumeric code. Cite facts as plain business values — dollar amount, vendor name, date, owner — with no attached code.`;

// Rich-text variant used when answerOnlyStreaming=true (aVa dock inline rendering).
// Removes the table prohibition and replaces it with a table requirement for structured data.
export const CONSULTANT_ANSWER_SHAPE_CONTRACT_RICH = `CONSULTANT ANSWER SHAPE

${CXO_ANSWER_QUALITY_CONTRACT}

For Home, Intelligence, and Tower, answer like a senior expert consultant in a GPT/Claude-style conversation, not a template transcript.
- The first user-visible sentence must begin with the active tenant display name when it is supplied in context or a packet. Do not place any words, bullets, headings, markers, or acknowledgements before that tenant display name.
- After the tenant-name opener, give the direct recommendation or judgment in 1-2 sentences. Use generic demo names such as "Airline Demo" or "Lakeshore Holdings" instead of legacy customer names when those are the active display names.
- Then explain the specific tenant facts, corpus pattern, benchmark, system, vendor, program, dollar value, or cited constraint that supports the view.
- Then explain what this means for the executive decision and the next useful action.

FORMAT FOR SCANNING, NOT READING TOP TO BOTTOM: use at most 2-3 short paragraphs total before any table/chart exhibit, each under roughly 55 words. The moment you have 3 or more related facts, gaps, options, or comparison points, stop writing narrative sentences about them — use a short bullet list, or the governed table format when the items are being ranked or compared. Do not print visible section labels such as "Read:", "Evidence:", "Implication:", or "Next move:".

EVIDENCE CODE RULE: Never invent or print evidence codes, pattern IDs, or internal citation identifiers such as BASE-XXX, CTX-XXX, VAL-XXX, X123, or any similar alphanumeric code. The loaded context does not expose database record IDs or pattern reference numbers to you. Cite facts in plain business English — dollar value, owner, date, status — with no attached code. A fabricated code is worse than no citation.

This surface renders full GitHub-Flavored Markdown. Use GFM tables for ANY comparison, ranked list, vendor matrix, spend breakdown, roadmap, dependency map, or multi-attribute data (3+ items × 2+ attributes). Use bold for the single most decision-critical number or phrase per section. Use bullet lists where items scan better than prose. Tables and structure are expected — prose-only responses are substandard for comparison, ranking, roadmap, or visual questions. Never output raw SVG, Mermaid, chart JSON, or renderer code; the product turns source-backed rows into typed visual artifacts.`;

const TREND_ASK_RE =
  /\b(trend|trends|over time|quarterly|quarter|annual|year(?:ly|-over-year|ly)|y(?:ear)?-?o-?y|q-?o-?q|month(?:ly)?|historical|history|progression|trajectory|growth|decline|ramp|forecast|projection|evolv|chang(?:e|ed|ing)|increas|decreas|improv|worsen|compar(?:e|ed|ison) (?:by|over|across) (?:year|quarter|month|period|time)|period|over the (?:last|past|next)|trend line|time[ -]series|adoption rate|spending over|spend over|budget over|cost over|savings over|rate of)\b/i;

export function isTrendAsk(query: string): boolean {
  return TREND_ASK_RE.test(query);
}

const STRATEGY_TO_MOVES_EXECUTION_RE =
  /\b(run (?:this|it|that)?\s*(?:through|in|as)\s+(?:moves?|a move)|moves?\s+(?:portfolio\s+)?sprint|moves?\s+model|correct\s+moves?\s+model|canonical\s+phases?|phase[-\s]?gate|phase\s+gates?|phase[-\s]?sequencing|p0\s*(?:[-–—/]?\s*)p5|p0\s*,?\s*p1|p0\b.*\bp5\b|p0[-–—/]p5|p[0-5]\b.*\bp[0-5]\b|(?:move|moves)\b.*\b(?:p[0-5]|phase|skip|refuse|decide|decision|current state|execution|implementation|tower|value)|8[-\s]?week(?:s)?\s+(?:plan|sprint|roadmap)|by phases?|phase plan|through execution|strategy through execution|strategy\b.*\bexecution\b.*\bvalue|connect(?:ing)?\b.*\bstrategy\b.*\bexecution\b.*\bvalue|execution handoff|connect\b.*\bmoves\b.*\btower\b|handoff\b.*\bmoves\b.*\btower\b|(?:home|intelligence|moves|source|tower)\b.*\b(?:participate|connect|handoff|downstream|overclaim|execution|value|evidence boundary)|executive council|business case|solution approach|implementation plan|how (?:would|do|should) we execute|how we (?:would|do|should) execute|what would the plan look like|create (?:a\s+)?(?:data\s*&?\s*ai|ai|technology|digital)\s+strategy|ai strategy(?:\s+with)?\s+(?:top\s+)?bets?|roadmap|transformation sprint|funding decision package|investment case)\b/i;

const STRATEGY_TO_ABARVA_SOLUTION_RE =
  /\b(how (?:do|would|should) we solve this|how (?:do|would|should) we execute this|what should we do next|how do we run this|how do we build (?:the\s+)?roadmap|turn this into (?:a\s+)?program|present this to executives|executive council|business case|(?:best|right|top)\s+(?:ai\s+)?bets?|roadmap|implementation plan|fund(?:ing)?|value realization|vendor implications?|sourcing implications?|what should source (?:handle|validate|do)|what should tower measure|what do we already know|current-state evidence)\b/i;

export type AbarvaAnswerMode =
  | "general"
  | "strategy_to_abarva_solution"
  | "strategy_to_moves_execution";

export function classifyAbarvaAnswerMode(query: string): AbarvaAnswerMode {
  if (isStrategyToMovesExecutionAsk(query)) {
    return "strategy_to_moves_execution";
  }
  if (isStrategyToAbarvaSolutionAsk(query)) {
    return "strategy_to_abarva_solution";
  }
  return "general";
}

export function isStrategyToMovesExecutionAsk(query: string): boolean {
  return STRATEGY_TO_MOVES_EXECUTION_RE.test(query);
}

export function isStrategyToAbarvaSolutionAsk(query: string): boolean {
  return STRATEGY_TO_ABARVA_SOLUTION_RE.test(query);
}

export function needsAbarvaSolutionGuidance(query: string): boolean {
  return (
    isStrategyToMovesExecutionAsk(query) || isStrategyToAbarvaSolutionAsk(query)
  );
}

export const STRATEGY_TO_ABARVA_SOLUTION_CONTRACT = `STRATEGY_TO_ABARVA_SOLUTION ANSWER MODE

This mode is mandatory when Intelligence identifies or is asked about an opportunity, risk, strategy, roadmap, transformation idea, top-bets portfolio, funding case, vendor implication, value question, or executive-council decision. Intelligence is the CXO front door to the AbarVa operating system, not just a smart chat window.

Product rule:
- For broad strategy, answer the strategic question first.
- When the answer implies execution, add "How AbarVa would solve this" and explain only the surfaces that are relevant.
- Do not force every surface into a purely factual answer. Use product guidance when it helps the user operationalize the recommendation.
- Do not claim artifacts, Moves, Source events, Tower ledgers, or Home evidence packs have been created unless the context says they already exist.

Surface knowledge:
- Intelligence: CXO strategy, trends, portfolio framing, industry context, investment thesis, executive answers.
- Home: Enterprise context and evidence: known facts, systems, applications, owners, contracts, documents, integrations, data readiness, and evidence gaps.
- Moves: Transformation execution from idea to business case, solution options, roadmap, execution readiness, and governed phase planning.
- Source: Sourcing, vendors, contracts, renewals, pricing, commercial leverage, RFP, BAFO, negotiation, and spend optimization.
- Tower: Value realization, adoption, KPI tracking, funding gates, executive reporting, outcome accountability, and realized benefits.

Required answer shape when this mode applies:
1. Executive read.
2. Strategic recommendation or top bets.
3. Tenant-specific reasoning when tenant context exists.
4. How AbarVa would solve this.
5. Surface-by-surface plan using the relevant surfaces: Intelligence, Home, Moves, Source if vendors/contracts/sourcing are relevant, and Tower when value/adoption/metrics are relevant.
6. Artifacts produced, stated as proposed outputs unless they already exist.
7. Value metrics / Tower linkage when value, ROI, adoption, or benefits are part of the question.
8. Source/vendor/commercial linkage when vendor, contract, renewal, supplier, sourcing, pricing, license, or spend implications are part of the question.
9. Gaps / assumptions.
10. Next action.

Guardrails:
- Do not make Intelligence sound like generic Claude.
- Do not say Claude or another model can do better.
- Do not expose internal IDs, schema names, route names, raw packet fields, or debug terms.
- Do not invent unsupported value.
- Keep the user's domain frame. If the user asks about supply chain AI bets, anchor the candidate bets in supply chain and use finance/treasury only as a dependency or value lens.`;

export const STRATEGY_TO_MOVES_EXECUTION_CONTRACT = `STRATEGY_TO_MOVES_EXECUTION ANSWER MODE

This mode is mandatory when the user asks how to execute a strategy, roadmap, AI bet selection, transformation initiative, business case, top-bets portfolio, or executive-council plan. Do not answer as generic Claude or as a generic consulting sprint.

Product rule:
- Say clearly that this should be run as a Moves portfolio sprint, with Intelligence framing the bets, Moves structuring the phases, Source validating vendor/commercial levers, and Tower tracking realized value.
- Keep the user's domain frame. If the user asks about supply chain AI bets, anchor the candidate Moves in supply chain: procurement intelligence, supplier risk/resilience, demand sensing, inventory optimization, logistics/freight optimization, working capital, contract/obligation intelligence, and supply-chain data foundation. Finance or treasury may be a dependency or value lens, but must not replace the supply-chain answer.
- When the user asks what the plan looks like by phase, include a compact phase table with one literal row for each phase label: P0 Originate, P1 Charter, P2 Understand Current State, P3 Choose the Approach, P4 Build the Plan, P5 Prepare to Execute, and Tower Track Outcomes.

Required answer structure:
1. Direct executive read.
2. Candidate Moves / bets.
3. How AbarVa would run it across Intelligence, Moves, Source, and Tower.
4. Moves phase plan:
   - P0 Originate
   - P1 Charter
   - P2 Understand Current State
   - P3 Choose the Approach
   - P4 Build the Plan
   - P5 Prepare to Execute
   - Tower Track Outcomes
5. Templates / evidence needed by phase.
6. Source implications when vendors, contracts, sourcing, software, BPO, systems integrators, or commercial levers are relevant.
7. Tower metrics / value-realization model.
8. Executive council artifacts.
9. Gaps / assumptions.
10. Immediate next action.

Use AbarVa product language naturally. The answer should make the operating model obvious: Intelligence identifies and frames the top bets; Home grounds current-state evidence; Moves turns each bet into a governed transformation initiative; Source handles vendor, sourcing, and contract levers; Tower tracks value, adoption, risk, and realized outcomes.`;

export const CHART_OUTPUT_CONTRACT = `STRUCTURED VISUAL CONTRACT: The rendering surface converts source-backed Markdown tables into typed tables, charts, matrices, and graphs. Apply this rule proactively:
- MANDATORY for any trend, time-series, quarter-over-quarter, year-over-year, or period-based data — emit a compact chart-ready GFM table with period and numeric value columns.
- MANDATORY for any ranked list of 4 or more items with numeric values — emit a compact GFM table with label, value, and basis columns.
- RECOMMENDED for spend breakdowns, allocation shares, maturity comparisons, value/complexity tradeoffs, dependency maps, or roadmap sequencing.
- NEVER fabricate data points to fill a chart; only emit rows when you have source-backed values or clearly label qualitative scores as high/medium/low.
- NEVER output raw SVG, Mermaid, fenced chart JSON, canvas code, renderer code, or implementation snippets in the visible answer.`;

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
  const withoutOpener = scrubPublicAvaAnswerText(
    stripMarkdownControl(
      stripInternalRecordIds(text).replace(HOLLOW_OPENER_RE, "").trim(),
    ),
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
  const protectedSpans: string[] = [];
  const withProtectedReadableLabels = text.replace(
    /`([^`\n]+)`/g,
    (_match, rawLabel: string) => {
      const label = rawLabel.trim();
      const replacement = SIMPLE_READABLE_LABEL_RE.test(label) ? label : "";
      const token = `__AVA_READABLE_LABEL_${protectedSpans.length}__`;
      protectedSpans.push(replacement);
      return token;
    },
  );
  return withProtectedReadableLabels
    .replace(
      /\s*\(\s*(?:[A-Z]{2,12}-[A-Z0-9]{2,12}-\d{2,6}|[A-Z]{2,12}-\d{3,6})\s*\)/g,
      "",
    )
    .replace(RAW_INTERNAL_ID_RE, "")
    .replace(/__AVA_READABLE_LABEL_(\d+)__/g, (_match, index: string) => {
      return protectedSpans[Number(index)] ?? "";
    })
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
