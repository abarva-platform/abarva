import { NextRequest } from 'next/server';
import { isInt } from 'neo4j-driver';
import { getAnthropicClient } from '@/lib/agent/stream';
import { assembleGenomeQueryPrompt } from '@/lib/agent/prompts/genome-query';
import { getGraphDriver } from '@/lib/graph/driver';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

const WRITE_OPS = /\b(CREATE|MERGE|SET|DELETE|REMOVE|DROP|DETACH)\b/i;

function unwrap(val: unknown): unknown {
  if (val == null) return val;
  if (isInt(val)) return (val as unknown as { toNumber: () => number }).toNumber();
  if (Array.isArray(val)) return val.map(unwrap);
  if (typeof val === 'object' && val !== null) {
    const obj = val as Record<string, unknown>;
    if ('properties' in obj) return obj.properties;
    if ('low' in obj && 'high' in obj && typeof (obj as { toNumber?: unknown }).toNumber === 'function') {
      return (obj as unknown as { toNumber: () => number }).toNumber();
    }
  }
  return val;
}

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => ({}))) as { query?: string };
  const query = typeof body.query === 'string' ? body.query.trim() : '';
  if (!query) {
    return new Response(JSON.stringify({ error: 'query required' }), { status: 400 });
  }

  // Translate NL → Cypher
  let translated: { cypher?: string | null; result_shape?: string; explanation?: string };
  try {
    const translation = await getAnthropicClient().messages.create({
      model: 'claude-opus-4-7',
      max_tokens: 1024,
      messages: [{ role: 'user', content: assembleGenomeQueryPrompt(query) }],
    });
    const text = translation.content
      .filter((b) => b.type === 'text')
      .map((b) => (b as { text: string }).text)
      .join('');
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) {
      return new Response(JSON.stringify({ error: 'could not parse translation' }), { status: 500 });
    }
    translated = JSON.parse(match[0]);
  } catch (err) {
    console.error('[genome-query-translate]', err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : 'translation failed' }),
      { status: 500 },
    );
  }

  if (!translated.cypher) {
    return new Response(
      JSON.stringify({
        cypher: null,
        rows: [],
        explanation: translated.explanation ?? "Can't answer with current schema",
      }),
    );
  }

  // Safety gate
  if (WRITE_OPS.test(translated.cypher)) {
    console.warn('[genome-query-unsafe]', { cypher: translated.cypher });
    return new Response(
      JSON.stringify({ error: 'write operations not permitted', cypher: translated.cypher }),
      { status: 400 },
    );
  }

  const driver = getGraphDriver();
  const session = driver.session({ defaultAccessMode: 'READ' });
  try {
    const result = await session.run(translated.cypher);
    const rows = result.records.map((r) => {
      const obj: Record<string, unknown> = {};
      for (const key of r.keys) {
        obj[key as string] = unwrap(r.get(key));
      }
      return obj;
    });
    return new Response(
      JSON.stringify({
        cypher: translated.cypher,
        explanation: translated.explanation,
        result_shape: translated.result_shape,
        rows,
      }),
      { headers: { 'Content-Type': 'application/json' } },
    );
  } catch (err) {
    console.error('[genome-query-exec]', err);
    return new Response(
      JSON.stringify({
        error: err instanceof Error ? err.message : 'unknown error',
        cypher: translated.cypher,
      }),
      { status: 500 },
    );
  } finally {
    await session.close();
  }
}
