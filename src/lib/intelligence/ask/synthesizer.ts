import Anthropic from '@anthropic-ai/sdk';
import type { AskSource, AskIntent } from './types';
import { assembleIntelligenceSystemPrompt } from '@/lib/agent/prompts/intelligence';

let _client: Anthropic | null = null;
function getClient(): Anthropic | null {
  if (_client) return _client;
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return null;
  _client = new Anthropic({ apiKey: key });
  return _client;
}

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

const HOLLOW_OPENER_RE =
  /^\s*(?:good|great|excellent)\s+question(?:,\s*[A-Z][a-z]+)?\.?\s*(?:let me\s+(?:give|be|walk|explain)[^.]*\.\s*)?/i;

export function sanitizeAskSynthesis(text: string, maxWords = 120): string {
  const withoutOpener = text.replace(HOLLOW_OPENER_RE, '').trim();
  const words = withoutOpener.split(/\s+/).filter(Boolean);
  if (words.length <= maxWords) return withoutOpener;

  const capped = words.slice(0, maxWords).join(' ');
  const lastSentenceEnd = Math.max(
    capped.lastIndexOf('.'),
    capped.lastIndexOf('?'),
    capped.lastIndexOf('!'),
  );
  if (lastSentenceEnd > 80) return capped.slice(0, lastSentenceEnd + 1);
  return `${capped.replace(/[,\s;:]+$/, '')}…`;
}

function chunkText(text: string): string[] {
  return text.match(/.{1,80}(?:\s|$)/g)?.map((chunk) => chunk.trimEnd()) ?? [text];
}

export async function* synthesizeStream(args: {
  query: string;
  sources: AskSource[];
  intent: AskIntent;
  userContextBlock?: string;
  tenantName?: string | null;
}): AsyncGenerator<string> {
  const client = getClient();
  if (!client) {
    yield "We don't have API access configured to synthesize an answer — the retrieval surfaced "
      + `${args.sources.length} source${args.sources.length === 1 ? '' : 's'} matching your query. `
      + 'Set ANTHROPIC_API_KEY and retry.';
    return;
  }

  const system = assembleIntelligenceSystemPrompt({
    intent: args.intent,
    userContextBlock: args.userContextBlock,
    tenantName: args.tenantName,
  });
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

    for (const chunk of chunkText(sanitizeAskSynthesis(text))) {
      yield chunk;
    }
  } catch (err) {
    yield `\n\n[synthesis error: ${err instanceof Error ? err.message : 'unknown'}]`;
  }
}
