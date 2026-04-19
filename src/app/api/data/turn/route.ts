import { NextRequest } from 'next/server';
import { assembleDataSystemPrompt } from '@/lib/agent/prompts/data';
import { streamAgentTurn } from '@/lib/agent/stream';
import { parseChoicesFromText } from '@/lib/agent/parse-choices';
import { assembleMaestroContextBlock } from '@/lib/agent/prompts/_shared/maestro-context';
import { updateMaestroProfile } from '@/lib/agent/maestro-extractor';
import { getCurrentMaestro } from '@/lib/auth/maestro';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ABARVA_DIMENSIONS: Record<string, { dimension: string; summary: string }[]> = {
  healthcare_idn: [
    { dimension: 'Industry benchmarks', summary: 'HFMA denial rates, CMS Star ratings, MA operational metrics' },
    { dimension: 'Regulatory context', summary: 'HIPAA, CMS, state-level compliance frameworks' },
    { dimension: 'Genome patterns', summary: 'F002 / F007 / F008 / F012 failure patterns' },
  ],
  finserv: [
    { dimension: 'Industry benchmarks', summary: 'Cost-to-income, capital ratios, IT spend ratios' },
    { dimension: 'Regulatory context', summary: 'Basel, SOX, CCAR, consumer-protection frameworks' },
    { dimension: 'Genome patterns', summary: 'F002 / F007 / F008 failure patterns' },
  ],
  retail: [
    { dimension: 'Industry benchmarks', summary: 'Same-store sales, inventory turns, margin pressure' },
    { dimension: 'Regulatory context', summary: 'PCI, data privacy, supply-chain transparency' },
    { dimension: 'Genome patterns', summary: 'F002 / F008 failure patterns' },
  ],
};

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => ({}))) as {
    clientId?: string;
    clientName?: string;
    industry?: string;
    messages?: Array<{ role: 'user' | 'assistant'; content: string }>;
    filesProcessedThisSession?: Array<{ filename: string; chunks: number }>;
  };

  const clientName = body.clientName?.trim();
  const industry = (body.industry ?? '').trim().toLowerCase();
  const messages = Array.isArray(body.messages) ? body.messages : [];
  const files = Array.isArray(body.filesProcessedThisSession) ? body.filesProcessedThisSession : [];

  if (!clientName || !industry) {
    return new Response(
      JSON.stringify({ error: 'clientName and industry required' }),
      { status: 400 },
    );
  }

  const maestro = await getCurrentMaestro();

  const maestroContextBlock = maestro
    ? await assembleMaestroContextBlock({ personId: maestro.id, personName: maestro.name })
    : '';

  const system = assembleDataSystemPrompt({
    clientName,
    industry,
    alreadyLoadedByAbarva: ABARVA_DIMENSIONS[industry] ?? [],
    filesProcessedThisSession: files,
    maestro,
    maestroContextBlock,
  });

  const lastUserMessage = [...messages].reverse().find((m) => m?.role === 'user');
  const lastUserText = typeof lastUserMessage?.content === 'string' ? lastUserMessage.content : '';

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        let full = '';
        for await (const delta of streamAgentTurn({ system, messages })) {
          full += delta;
          controller.enqueue(encoder.encode(JSON.stringify({ type: 'delta', text: delta }) + '\n'));
        }

        const { choices: turnChoices } = parseChoicesFromText(full);
        if (turnChoices.length > 0) {
          controller.enqueue(encoder.encode(JSON.stringify({ type: 'choices', choices: turnChoices }) + '\n'));
        }

        if (maestro && lastUserText.trim().length > 0) {
          void (async () => {
            try {
              await updateMaestroProfile({
                maestroPersonId: maestro.id,
                turnId: `data-${Date.now()}`,
                turnText: lastUserText,
                engagementId: null,
                engagementIndustry: industry,
              });
            } catch (err) {
              console.error('[maestro-extractor-data]', err);
            }
          })();
        }

        controller.enqueue(encoder.encode(JSON.stringify({ type: 'done' }) + '\n'));
        controller.close();
      } catch (err) {
        const message = err instanceof Error ? err.message : 'unknown error';
        controller.enqueue(encoder.encode(JSON.stringify({ type: 'error', error: message }) + '\n'));
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: { 'Content-Type': 'application/x-ndjson', 'Cache-Control': 'no-cache' },
  });
}
