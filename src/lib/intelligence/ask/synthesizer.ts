import Anthropic from '@anthropic-ai/sdk';
import type { AskSource, AskIntent } from './types';

let _client: Anthropic | null = null;
function getClient(): Anthropic | null {
  if (_client) return _client;
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return null;
  _client = new Anthropic({ apiKey: key });
  return _client;
}

const SYSTEM_PROMPT = `You are AbarVa's Ask Intelligence — a knowledge librarian that surfaces what the
platform knows about enterprise transformation, AI programs, vendors, patterns,
and research.

RULES:
1. Every claim must be attributable to one of the provided sources. No invention.
2. If the sources don't contain an answer, say so explicitly. "We don't have
   indexed data on that" is a valid response.
3. Keep responses under 120 words — 2-3 tight paragraphs maximum. Bold specific
   numbers, vendor names, and pattern codes. No headers or lists unless the answer
   genuinely requires structured enumeration.
4. When a source is low-confidence or the sample is small, say so in the answer.
5. Never reference a specific user, engagement, or client name unless the source
   itself does.
6. Write like a senior analyst — concise, confident, unpadded.
7. Do not output source citations inline — the UI renders them separately.
8. Do not preamble. Start the answer directly.`;

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

    for await (const event of stream) {
      if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
        yield event.delta.text;
      }
    }
  } catch (err) {
    yield `\n\n[synthesis error: ${err instanceof Error ? err.message : 'unknown'}]`;
  }
}
