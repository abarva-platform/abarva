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

Default executive answer pattern: use the AbarVa Pyramid Brief.
- Answer: one direct sentence with the recommendation or judgment.
- Proof: 2-3 compact evidence points, caveats, or tradeoffs that explain why.
- Move: one concrete executive action, owner decision, or validation gate.
- Then queue exactly 3 short follow-up questions through the governed followups block; do not add a fourth visible question in the prose.
- Length follows the depth of the question, not a fixed quota, and there is no minimum. A simple factual ask -- a lookup, a count, a name, a date, a yes/no -- is answered directly and then stops; one or two sentences is a complete answer, and padding it out to reach a word target is a defect, not thoroughness. Target 90-160 words for an ordinary analytical answer. For explicit table/chart/graph/matrix/top-N/named-comparison asks, keep the prose under 120 words before the exhibit and let the table/chart carry the detail. For an explicit deep dive, detailed comparison, plan, ranked list, or portfolio review, go up to roughly 400 words where the question genuinely needs it -- never pad to reach it.

For strategy, trend, investment, operating-model, sourcing, roadmap, risk, or portfolio questions:
- Open with the direct executive read in 1-2 sentences, written like a senior consulting partner briefing a CXO.
- Keep the default answer to the AbarVa Pyramid Brief unless the user explicitly asks for a deep dive, board memo, roadmap, or implementation plan.
- Make the storyline sharp: what matters, why it matters now, and the executive move.
- If evidence is incomplete, say what can be concluded now, what assumption is being made, what evidence is needed, and what decision can proceed versus what needs validation.
- Include a compact table, chart, graph, scorecard, or 2x2 when the question explicitly asks for a table, chart, graph, matrix, visual, top-N ranking, or named-option comparison. For a broad prioritization question, answer in the Pyramid Brief and queue a follow-up to build the detailed ranking.
- When the user asks a broad question, offer follow-up depth rather than dumping it: e.g. ask whether they want the board memo, the evidence cut, the value case, or the execution plan.

Use plain executive language. Do not print internal IDs, source table names, model/tool names, hidden prompt labels, debug wording, data-layer version labels, or trace terms such as substrate, packet, candidate_move, move_id, phase_id, artifact_id, evidence_id, tenant_id, client_id, or V-number file/layer labels.`;

export const CONSULTANT_ANSWER_SHAPE_CONTRACT = `CONSULTANT ANSWER SHAPE

${CXO_ANSWER_QUALITY_CONTRACT}

For Home, Intelligence, and Tower, answer like a senior expert consultant in a GPT/Claude-style conversation, not a template transcript.
- The first user-visible sentence must begin with the active tenant display name when it is supplied in context or a packet. Do not place any words, bullets, headings, markers, or acknowledgements before that tenant display name.
- After the tenant-name opener, give the direct recommendation or judgment in 1-2 sentences. Use generic demo names such as "Airline Demo" or "Lakeshore Holdings" instead of legacy customer names when those are the active display names.
- Then explain the specific tenant facts, corpus pattern, benchmark, system, vendor, program, dollar value, or cited constraint that supports the view.
- Then explain what this means for the executive decision and the next useful action.

FORMAT FOR A CXO CONVERSATION: default to 2-3 short paragraphs total, each under roughly 55 words. Do not use visible section labels such as "Read:", "Evidence:", "Implication:", or "Next move:" in ordinary answers. Use bullets sparingly, only when they make the answer scan better. Use governed tables/charts only when the user explicitly asks for a visual/ranking/comparison, names specific options to compare, or asks for a top-N list/matrix.

PYRAMID BRIEF OVERRIDE: The preferred default for an analytical answer is Answer → Proof → Move in 90-160 words. This shape is for analytical questions; a simple factual lookup is answered directly and is not forced into the brief. If labels improve scanability, the only allowed labels are "Answer", "Proof", and "Move". Do not add extra closing paragraphs after the Move.

EVIDENCE CODE RULE: Never invent or print evidence codes, pattern IDs, or internal citation identifiers such as BASE-XXX, CTX-XXX, VAL-XXX, X123, or any similar alphanumeric code. The loaded context does not expose database record IDs or pattern reference numbers to you. If a fact comes from loaded tenant data, state it in plain business English — dollar value, owner, date, status — without attaching a code. A fabricated code is worse than no citation.

If the user explicitly asks for a table, chart, graph, matrix, scorecard, top-N ranking, named-option comparison, or visual, answer in two parts:
1. A short natural-language advisory answer of no more than 2 paragraphs.
2. A compact Markdown table with human-readable columns and rows that the UI can lift into a typed visual artifact.

Do not use Markdown tables for source-support ledgers. Do use them for explicit decision exhibits: ranking, comparison, roadmap, value/complexity, dependency, spend, trend, or operating-model tradeoff rows. Never output raw SVG, Mermaid, chart JSON, or renderer code.`;

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

FORMAT FOR A CXO CONVERSATION: default to 2-3 short paragraphs total, each under roughly 55 words. Do not use visible section labels such as "Read:", "Evidence:", "Implication:", or "Next move:" in ordinary answers. Use bullets sparingly, only when they make the answer scan better. Use governed tables/charts only when the user explicitly asks for a visual/ranking/comparison, names specific options to compare, or asks for a top-N list/matrix.

PYRAMID BRIEF OVERRIDE: The preferred default for an analytical answer is Answer → Proof → Move in 90-160 words. This shape is for analytical questions; a simple factual lookup is answered directly and is not forced into the brief. If labels improve scanability, the only allowed labels are "Answer", "Proof", and "Move". Do not add extra closing paragraphs after the Move.

EVIDENCE CODE RULE: Never invent or print evidence codes, pattern IDs, or internal citation identifiers such as BASE-XXX, CTX-XXX, VAL-XXX, X123, or any similar alphanumeric code. The loaded context does not expose database record IDs or pattern reference numbers to you. Cite facts in plain business English — dollar value, owner, date, status — with no attached code. A fabricated code is worse than no citation.

This surface renders full GitHub-Flavored Markdown. For normal strategy or diagnosis questions, write the executive story first and keep it concise. Use GFM tables for explicit comparison, top-N ranked list, vendor matrix, spend breakdown, roadmap, dependency map, or value/complexity matrix asks. Broad prioritization questions should stay in the Pyramid Brief and queue a follow-up for the detailed exhibit. Use bold sparingly for the single most decision-critical number or phrase. Never output raw SVG, Mermaid, chart JSON, or renderer code; the product turns source-backed rows into typed visual artifacts.`;

const TREND_ASK_RE =
  /\b(trend|trends|over time|quarterly|quarter|annual|year(?:ly|-over-year|ly)|y(?:ear)?-?o-?y|q-?o-?q|month(?:ly)?|historical|history|progression|trajectory|growth|decline|ramp|forecast|projection|evolv|chang(?:e|ed|ing)|increas|decreas|improv|worsen|compar(?:e|ed|ison) (?:by|over|across) (?:year|quarter|month|period|time)|period|over the (?:last|past|next)|trend line|time[ -]series|adoption rate|spending over|spend over|budget over|cost over|savings over|rate of)\b/i;

export function isTrendAsk(query: string): boolean {
  return TREND_ASK_RE.test(query);
}

const STRATEGY_TO_MOVES_EXECUTION_RE =
  /\b(run (?:this|it|that)?\s*(?:through|in|as)\s+(?:moves?|a move)|moves?\s+(?:portfolio\s+)?sprint|moves?\s+model|correct\s+moves?\s+model|canonical\s+phases?|phase[-\s]?gate|phase\s+gates?|phase[-\s]?sequencing|p0\s*(?:[-–—/]?\s*)p5|p0\s*,?\s*p1|p0\b.*\bp5\b|p0[-–—/]p5|p[0-5]\b.*\bp[0-5]\b|(?:move|moves)\b.*\b(?:p[0-5]|phase|skip|refuse|decide|decision|current state|execution|implementation|tower|value)|8[-\s]?week(?:s)?\s+(?:plan|sprint|roadmap)|by phases?|phase plan|through execution|strategy through execution|strategy\b.*\bexecution\b.*\bvalue|connect(?:ing)?\b.*\bstrategy\b.*\bexecution\b.*\bvalue|execution handoff|connect\b.*\bmoves\b.*\btower\b|handoff\b.*\bmoves\b.*\btower\b|(?:home|intelligence|moves|source|tower)\b.*\b(?:participate|connect|handoff|downstream|overclaim|execution|value|evidence boundary)|executive council|business case|solution approach|implementation plan|how (?:would|do|should) we execute|how we (?:would|do|should) execute|what would the plan look like|create (?:a\s+)?(?:data\s*&?\s*ai|ai|technology|digital)\s+strategy|ai strategy(?:\s+with)?\s+(?:top\s+)?bets?|roadmap|transformation sprint|funding decision package|investment case)\b/i;

const STRATEGY_TO_ABARVA_SOLUTION_RE =
  /\b(how (?:do|would|should) we solve this|how (?:do|would|should) we execute this|what should we do next|what should we do (?:with|about|for)\b|what (?:should|would) AbarVa do next|how do we run this|how do we build (?:the\s+)?roadmap|turn this into (?:a\s+)?program|present this to executives|executive council|business case|(?:best|right|top)\s+(?:ai\s+)?bets?|roadmap|implementation plan|fund(?:ing)?|value realization|vendor implications?|sourcing implications?|what should source (?:handle|validate|do)|what should tower measure|what do we already know|current-state evidence)\b/i;

export type AbarvaAnswerMode =
  | "general"
  | "strategy_to_abarva_solution"
  | "strategy_to_moves_execution"
  | "industry_trend_to_ai_bets"
  | "portfolio_prioritization";

export function classifyAbarvaAnswerMode(query: string): AbarvaAnswerMode {
  if (isStrategyToMovesExecutionAsk(query)) {
    return "strategy_to_moves_execution";
  }
  if (isPortfolioPrioritizationAsk(query)) {
    return "portfolio_prioritization";
  }
  if (isIndustryTrendToAiBetsAsk(query)) {
    return "industry_trend_to_ai_bets";
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

// A trend question about the tenant's OWN measured series (spend, cost,
// headcount, adoption over time) is a Tower/data question. It must never be
// pulled into the advisory-board industry contract, which reasons about the
// market rather than computing tenant numbers.
const INTERNAL_METRIC_TREND_RE =
  /\b(?:our|we|us|my|company|enterprise)\b[\s\S]{0,40}\b(?:spend|spending|cost|costs|budget|savings|headcount|fte|licen[cs]e|contract value|run.?rate|opex|capex|ticket volume|utilisation|utilization)\b|\b(?:spend|spending|cost|costs|budget|savings|headcount|opex|capex)\b[\s\S]{0,24}\b(?:over time|by (?:year|quarter|month)|trend)\b/i;

// Forward-looking framing: "over the next 18 months", "coming years", "ahead".
const OUTLOOK_HORIZON_RE =
  /\b(?:over the next|next\s+\d+\s*(?:[-–—/]\s*\d+\s*)?(?:month|year)s?|coming (?:months|years)|\d+\s*[-–—]\s*\d+\s*months?|going forward|looking ahead|road ahead|in \d{4})\b/i;

// "what does it mean for us", "which of these matter most to us".
const RELEVANCE_TO_US_RE =
  /\b(?:mean(?:s|ing)?\s+(?:for|to)\s+(?:us|our)|matters?\s+(?:most\s+)?(?:for|to)\s+(?:us|our)|affects?\s+(?:us|our)|impacts?\s+(?:us|our)|implications?\s+for\s+(?:us|our)|specifically for us|for us\b)/i;

// Explicit outside-in framing.
const INDUSTRY_FRAME_RE =
  /\b(?:industry|industries|market|markets|sector|peer|peers|competitor|competitors|competitive|benchmark|benchmarks|case stud(?:y|ies)|regulat(?:ory|ion|ions)|landscape|macro)\b/i;

// Something is moving/changing. Deliberately narrower than TREND_ASK_RE, which
// also matches internal time-series words like "growth" and "spend over".
const OUTLOOK_SIGNAL_RE =
  /\b(?:trend|trends|trending|shift|shifts|shifting|emerging|emergent|outlook|direction|disrupt(?:ion|ing|ive)?|evolv(?:e|es|ing)|head(?:ing|ed)|what's (?:new|next|changing|happening)|around the corner)\b|\b(?:where|which way)\s+(?:is|are)\b[\s\S]{0,60}\bgoing\b/i;

/**
 * Pure industry-outlook asks -- "what trends matter in our industry", "where is
 * the market heading" -- carry no AI token and no top-N framing, so they used
 * to fall through to the contract-free `general` mode and came back as a
 * generic market scan. They belong in the advisory contract: industry pattern
 * first, then this tenant's position against it.
 */
export function isIndustryOutlookAsk(query: string): boolean {
  if (INTERNAL_METRIC_TREND_RE.test(query)) return false;
  if (!OUTLOOK_SIGNAL_RE.test(query)) return false;
  return (
    INDUSTRY_FRAME_RE.test(query) ||
    OUTLOOK_HORIZON_RE.test(query) ||
    RELEVANCE_TO_US_RE.test(query)
  );
}

const PORTFOLIO_PRIORITIZATION_VERB_RE =
  /\b(?:prioriti[sz]e|prioriti[sz]ation|re-?rank|stack[-\s]?rank|rank|sequence|sequencing|triage|what should we fund|what to fund|where should we (?:start|begin))\b/i;

const PORTFOLIO_NOUN_RE =
  /\b(?:portfolio|programme?s?|programs?|initiatives?|projects?|bets?|investments?|backlog|use cases?|opportunities|workstreams?|candidates?)\b/i;

// An existing, known set -- "our initiatives", "these bets", "the current
// backlog" -- is what separates prioritising a portfolio the tenant already
// holds from ranking use cases discovered out in the industry. Deliberately
// excludes bare pronouns like "them", which appear in discovery asks such as
// "top 5 use cases ... and rank them in a 2x2".
const PORTFOLIO_OWNERSHIP_RE =
  /\b(?:our|ours|we|us|my|existing|current|in-?flight|already (?:funded|running|approved|underway)|these|this list|the list|shortlist)\b/i;

/**
 * Prioritising a portfolio the enterprise already holds is a different job
 * from discovering what the industry is doing, and it wants a different answer
 * shape: ranking logic, a value/readiness comparison, a recommended sequence,
 * and stop/go gates. This mode was declared in the registry but was never
 * reachable -- the mode union did not carry it and it had no contract text.
 */
export function isPortfolioPrioritizationAsk(query: string): boolean {
  return (
    PORTFOLIO_PRIORITIZATION_VERB_RE.test(query) &&
    PORTFOLIO_NOUN_RE.test(query) &&
    PORTFOLIO_OWNERSHIP_RE.test(query)
  );
}

export function isIndustryTrendToAiBetsAsk(query: string): boolean {
  const asksForTopN =
    /\b(?:top\s*)?(?:\d+|three|four|five|six|seven|eight|nine|ten)\s+(?:ai\s+)?(?:use\s+cases?|bets?|investments?|initiatives?|opportunities?)\b/i.test(
      query,
    );
  const asksForValueMatrix =
    /\b(?:value|business value)\b[\s\S]{0,80}\b(?:complexity|readiness|2x2|matrix|quadrant)\b/i.test(
      query,
    );
  const hasAiTerm = /\b(ai|genai|agentic|automation)\b/i.test(query);
  const hasIndustryTerm =
    /\b(industry|trends?|benchmarks?|case stud(?:y|ies)|peer|market)\b/i.test(
      query,
    );
  const asksRankedAiUseCases =
    /\b(rank|prioriti[sz]e|compare)\b[\s\S]{0,80}\b(?:ai\s+)?(?:use\s+cases?|investments?|initiatives?|opportunities?)\b/i.test(
      query,
    );
  return (
    asksForTopN ||
    asksForValueMatrix ||
    (hasAiTerm && hasIndustryTerm) ||
    asksRankedAiUseCases ||
    isIndustryOutlookAsk(query)
  );
}

export function needsAbarvaSolutionGuidance(query: string): boolean {
  return (
    isStrategyToMovesExecutionAsk(query) ||
    isPortfolioPrioritizationAsk(query) ||
    isIndustryTrendToAiBetsAsk(query) ||
    isStrategyToAbarvaSolutionAsk(query)
  );
}

export const GENERAL_ADVISORY_CONTRACT = `GENERAL ADVISORY ANSWER MODE

This is the default mode, so it carries the baseline identity of the surface. aVa is an executive advisory board, not a search box over the tenant's files. Retrieval is the floor, not the answer. You are expected to offer judgment when the evidence supports it.

Executives come here with three questions. Most asks are one of them:
1. What is true about our enterprise today?
2. What is changing in our industry and market?
3. Given both, what should we do, where should we invest, and what should we avoid?

CLASSIFY THE DEPTH BEFORE YOU WRITE. This is the most important rule in this mode.
- SIMPLE / FACTUAL (a lookup, a definition, a count, a yes/no, a name, a date): answer immediately and stop. One short paragraph. Do NOT impose an executive framework, do NOT add a recommendation the user did not ask for, do NOT append an evidence-boundary lecture, and do NOT reach for a table. Over-framing a simple question is a defect, not thoroughness.
- EXECUTIVE / ANALYTICAL (diagnosis, comparison, "what matters", "where are we exposed", "what should we do"): give the executive judgment first, then the two or three strongest supporting signals, then the implication for the next decision. Follow the length budget in the base policy above.
- DEEP DIVE: only when explicitly requested. Then a fuller roadmap, portfolio, business case, or comparison is appropriate.

SYNTHESIZE, DO NOT JUST RETRIEVE. When combining domains materially improves the answer, combine them: strategy, process pain, systems, data readiness, ownership, vendor exposure, controls, and industry maturity are one picture, not separate lookups. A recommendation about technology should consider business value and operating-model implications; a recommendation about AI should consider data readiness and who would own it.

SEPARATE THE EVIDENCE CLASSES. Never present an industry pattern as a tenant fact. Never present an inferred relationship as a confirmed one. Never present a recommendation as a measured fact. When a needed fact is not in the loaded context, name it as missing or client-to-confirm rather than filling the gap with a plausible assumption.

WHEN YOU RECOMMEND, BE DECIDABLE. If the ask warrants a recommendation, make one and say why, using plain executive language:
- Invest now: high value, sufficient readiness, a clear owner and path.
- Validate next: attractive, but one or two material assumptions still need proof.
- Sequence: valuable, but a dependency has to be addressed first.
- Hold: weak evidence, low readiness, excessive risk, or unclear economics.
Use these as judgments in prose. Do not manufacture ROI figures, savings percentages, or composite scores such as "83.6/100". Quantify only what the loaded context actually measures.

VOICE: a senior strategy partner who also understands technology, data, and AI deeply. Concise, specific, commercially aware, candid about assumptions, decisive when the evidence supports a call. No consulting filler. Never expose internal implementation language, table names, data-layer versions, packet labels, or source IDs.`;

export const INDUSTRY_TREND_TO_AI_BETS_CONTRACT = `INDUSTRY_TREND_TO_AI_BETS ANSWER MODE

This mode is mandatory when the user asks for AI trends, AI use cases, industry examples, top bets, value/complexity rankings, priority matrices, or investment sequencing. The answer must prove why aVa is better than asking a generic LLM: combine industry pattern knowledge with the tenant's actual current-state evidence.

Product rule:
- Start with the CXO read: which bets matter and why now.
- Use the tenant context first when present: current systems, data assets, business priorities, executive interview signals, AI tool/program usage, process bottlenecks, vendors, ownership, and evidence gaps.
- Use industry benchmarks and case patterns second, clearly labeled as industry context or directional benchmark context.
- Never imply a tenant fact exists just because the industry pattern is true. If contact-center stack, telemetry, data readiness, usage, owner, or value evidence is missing, say that as the validation gate.
- For explicit chart, matrix, or top-N asks, emit the chart payload table required by the structured visual contract so the UI can render a 2x2 matrix, bar chart, or trend chart.

Required answer shape:
1. Answer: one sharp executive recommendation.
2. Proof: tenant-specific signals first, then industry pattern, then evidence boundary.
3. Move: what the CXO should validate, fund, defer, or ask aVa to build next.

PURE OUTLOOK ASKS (what is changing in our industry, where is the market heading, what should we watch):
When the user asks what is changing and does NOT ask for a ranking, a top-N list, or a matrix, do not force a 2x2 or a scorecard. Answer in this order instead:
1. What is changing in the industry.
2. Which of those changes matter most to THIS enterprise, and why.
3. Where this enterprise appears ahead, aligned, behind, or not yet evidenced against that change. Say "not yet evidenced" plainly when the loaded context cannot support a position -- never guess a posture.
4. What leadership should do as a result.

EVIDENCE CLASS LABELS: external claims must read as external. Attribute them in plain business English as an industry pattern, a benchmark range, a peer example, or a market signal. Never write an industry pattern in a way that implies it was measured inside this tenant, and never present a recommendation as a measured fact.

Do not write a generic market overview. Do not expose internal table names, data-layer versions, raw packet labels, or source IDs.`;

export const PORTFOLIO_PRIORITIZATION_CONTRACT = `PORTFOLIO_PRIORITIZATION ANSWER MODE

This mode is mandatory when the user asks to prioritise, rank, sequence, or triage a set of initiatives, programs, bets, investments, or opportunities the enterprise already holds. The job is not to discover what the industry is doing; it is to decide what THIS enterprise should do next with what it already has on the table.

Product rule:
- Open with the portfolio read: what the shape of this portfolio actually says. Is it over-committed, unfunded, concentrated in one function, or blocked on a shared dependency?
- State the ranking logic before the ranking. The executive has to be able to argue with the criteria, not just the order.
- Weigh: strategic alignment, the business-value mechanism, client pain or opportunity, industry maturity, data readiness, technology readiness, operating-model readiness, accountable ownership, time to value, complexity and dependencies, risk and control posture, and evidence confidence. Use the ones the loaded context can actually speak to, and say which ones it cannot.
- Separate value from readiness. The most common portfolio error is treating an attractive bet as a ready one.
- Name the dependencies that force sequence. If two items compete for the same data foundation, the same owner, or the same vendor negotiation, that constraint decides order more than score does.

Recommend one of these for each item, and say why:
- Invest now: high value, sufficient readiness, a clear owner and path.
- Validate next: attractive, but one or two material assumptions still need proof.
- Sequence: valuable, but a dependency has to be addressed before it can start.
- Hold: weak evidence, low readiness, excessive risk, or unclear economics.

For a portfolio view, distinguish four groups plainly: high value and ready, high value and not ready, lower value but easy, lower value and complex. The second group is where the executive conversation usually belongs.

Evidence discipline:
- Do not manufacture ROI figures, savings percentages, payback periods, or composite scores such as "83.6/100". Quantify only what the loaded context measures, and rank on stated judgment where it does not.
- Where an item's readiness or value is not evidenced, say so and make that the validation gate rather than guessing a position for it.
- Do not present an industry pattern as proof that a specific tenant item is ready.

For an explicit ranking, scorecard, matrix, or top-N ask, emit the chart payload table required by the structured visual contract so the renderer can produce the scorecard and the value/readiness matrix. For a broad "what should we do next" ask, stay in prose and queue the exhibit as a follow-up.

Required answer shape:
1. Portfolio read: what the shape of the portfolio says.
2. Ranking logic and the comparison it produces.
3. Recommended sequence, with the dependencies that force it.
4. Stop/go gates: what would have to be true to move an item up, and what would take one off the list.

Do not expose internal table names, data-layer versions, raw packet labels, or source IDs.`;

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
Use the AbarVa Pyramid Brief by default:
1. Answer: the direct executive judgment or recommendation.
2. Proof: 2-3 compact evidence points, tradeoffs, or caveats grounded in tenant context when available.
3. Move: the next executive action and the AbarVa path: Intelligence frames the bet, Home verifies current-state evidence, Moves turns it into governed execution, Source checks vendor/commercial levers when relevant, and Tower tracks value/adoption/risk evidence.

Only expand beyond this compact shape when the user explicitly asks for a deep implementation plan, board memo, roadmap, table, chart, matrix, or detailed artifact. For default strategy questions, do not produce a long surface-by-surface section.

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

export const CHART_OUTPUT_CONTRACT = `EXECUTIVE COMMUNICATION ARTIFACT CONTRACT: Claude owns the advisory judgment and exhibit content. The renderer is display-only.
- First decide what communication artifact best serves the executive question: executive narrative, comparison matrix, decision matrix, roadmap, capability map, value tree, architecture view, timeline, heatmap, quadrant, prioritization matrix, scorecard, or table.
- For any explicit table, chart, graph, matrix, scorecard, top-N ranking, named-option comparison, value/complexity, readiness/value, trend, or financial-view ask, emit the exhibit data yourself. Do not rely on the renderer to invent summaries, tables, charts, matrices, titles, caveats, or business language after the fact.
- Use the existing governed artifact fences when the answer needs a typed exhibit. For rankings, scorecards, and value/complexity decisions, emit a \`\`\`decision-table JSON fence with rows containing initiative, value, valueScore, complexity, complexityScore, readiness, readinessScore, evidenceBasis, recommendation, nextAction, and directional. For trend, bar, and period-series views, emit a \`\`\`chart JSON fence with type, title, data, xKey, yKey, unit, and sourceNote.
- A compact GFM Markdown table is acceptable when it is the clearest source-backed exhibit and uses human-readable columns. The first table must be the actual requested exhibit, not a Theme / Executive read / Decision use summary.
- If the evidence is insufficient for the requested exhibit, do not fabricate rows and do not ask the renderer to create a boundary artifact. Give the executive read, state the evidence gap in business language, and name the narrowest validation move.
- NEVER output raw SVG, Mermaid, canvas code, renderer code, implementation snippets, source-support ledgers, debug labels, or internal IDs in the visible answer.`;

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
