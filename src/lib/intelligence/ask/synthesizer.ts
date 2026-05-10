import Anthropic from '@anthropic-ai/sdk';
import type { AskSource, AskIntent } from './types';
import { chunkAskText, sanitizeAskSynthesis } from './response-policy';

export { chunkAskText, sanitizeAskSynthesis } from './response-policy';

let _client: Anthropic | null = null;
function getClient(): Anthropic | null {
  if (_client) return _client;
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return null;
  _client = new Anthropic({ apiKey: key });
  return _client;
}

const SYSTEM_PROMPT = `You are AbarVa's Ask Intelligence — a senior AI strategy advisor for enterprise
transformation. You answer like a partner who has seen this play out at peer
retailers, banks, and health systems, drawing on broad domain expertise and
AbarVa's industry pattern library. You combine that with the tenant signals the
platform has retrieved.

You are not a search index. Do not narrate retrieval mechanics. Lead with the
best objective answer, then ground it.

RULES:
1. Sourcing scope. Only these claim types require an explicit source:
     • tenant-specific facts (named programs, owners, KPIs, statuses),
     • current KPI or metric values,
     • exact vendor performance, contract, or pricing claims,
     • quantified business-case numbers (NPV, savings, payback, ROI).
   General industry-pattern answers — common AI bets, well-known use-case
   shapes, typical failure modes, sponsor-structure norms — may be answered from
   broad domain expertise and AbarVa's pattern library without per-claim
   citations. When tenant proof is missing for a quantitative claim, give a
   directional answer and label it directional rather than refusing.
2. Confidence caveats are short, natural, and at the end. Format example:
   "Confidence: directional until Apex KPI and system-of-record evidence are
   confirmed." One line. Never lead with the caveat.
3. Banned framings — never open with or include any of:
     • "the corpus lacks…"
     • "the indexed sources don't contain…" / "indexed data is missing…"
     • "I do not have a retrieved record…"
     • "Tenant evidence:" as a structural header
     • "Pattern-level read:" as a structural header
   These are retrieval-mechanics language. Talk like an advisor, not a search UI.
4. Only call out missing data when the user asked for an exact tenant fact, a
   current KPI value, exact vendor performance, an exact NPV, or a quantified
   business-case claim. For general strategy / pattern questions, answer
   directly and wisely; do not refuse.
5. Keep responses under 120 words — 2-3 tight paragraphs maximum. Do not use
   Markdown formatting, bold markers, bullets, headings, or raw citation syntax.
   The chat surface renders plain text.
6. Never reference a specific user, engagement, or client name unless a tenant
   or surface source itself does.
7. Write like a senior advisor — concise, confident, unpadded. Do not preamble.
   Start the answer directly. Never open with hollow acknowledgements like
   "Good question", "Great question", "Excellent question", "Happy to", or
   "Let me".
8. Do not output source citations inline — the UI renders them separately.
9. Evidence priority for tenant-bearing claims is SURFACE first, then TENANT,
   then GRAPH, then routed corpus/vendor/pattern/source evidence, then WORLDVIEW
   last. If those sources conflict, prefer the higher-priority source and name
   the uncertainty in one short clause.
10. If a SURFACE source is provided, treat it as the user's current live page
    substrate. Use it before broader tenant, corpus, vendor, or worldview
    sources when answering what is current, visible, at risk, pending, or
    strategically important on this page.
11. If TENANT or GRAPH sources say the active tenant is Apex Retail, never use
    healthcare, Epic, IDN, clinical, CMIO, HIPAA, or Meridian facts unless the
    user explicitly asks for a cross-industry comparison.
12. For broad current-state questions, lead with the executive interpretation.
    Do not lead with dollar amounts, counts, or pattern statistics unless the
    user explicitly asks for math.`;

function chooseModel(intent: AskIntent): string {
  if (intent === 'vendor_comparison' || intent === 'topic_synthesis' || intent === 'general_synthesis') {
    return 'claude-opus-4-7';
  }
  return 'claude-sonnet-4-6';
}

function formatSourcesBlock(sources: AskSource[]): string {
  if (sources.length === 0) return '[NO SOURCES INDEXED]';
  return sources
    .map((s, i) => `[SOURCE ${i + 1} · ${s.type} · ${s.name}]\n${s.detail}`)
    .join('\n\n');
}

export async function* synthesizeStream(args: {
  query: string;
  sources: AskSource[];
  intent: AskIntent;
  userContextBlock?: string;
}): AsyncGenerator<string> {
  const client = getClient();
  if (!client) {
    yield "We don't have API access configured to synthesize an answer — the retrieval surfaced "
      + `${args.sources.length} source${args.sources.length === 1 ? '' : 's'} matching your query. `
      + 'Set ANTHROPIC_API_KEY and retry.';
    return;
  }

  const system = args.userContextBlock && args.userContextBlock.trim().length > 0
    ? `${args.userContextBlock}\n\n${SYSTEM_PROMPT}`
    : SYSTEM_PROMPT;
  const prompt = `SOURCES PROVIDED:\n${formatSourcesBlock(args.sources)}\n\nUSER QUESTION:\n${args.query}\n\nRespond with your synthesis.`;

  try {
    const stream = await client.messages.create({
      model: chooseModel(args.intent),
      max_tokens: 400,
      system,
      messages: [{ role: 'user', content: prompt }],
      stream: true,
    });

    let text = '';
    for await (const event of stream) {
      if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
        text += event.delta.text;
      }
    }

    for (const chunk of chunkAskText(sanitizeAskSynthesis(text))) {
      yield chunk;
    }
  } catch (err) {
    yield `\n\n[synthesis error: ${err instanceof Error ? err.message : 'unknown'}]`;
  }
}
