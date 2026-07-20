import { getActiveClientRow } from '@/lib/active-client';
import { requireTenancy, tenancyErrorResponse } from '@/lib/auth/tenancy';
import { answerCioTowerQuestion, canonicalCioTowerTenantKey } from '@/lib/cio-tower/answer';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type TowerChatResult = Awaited<ReturnType<typeof answerCioTowerQuestion>>;

function buildTowerChatPayload(result: TowerChatResult) {
  return {
    response: result.response,
    modelOutput: result.modelOutput,
    modelOutputRaw: result.modelOutputRaw,
    promptPackageKey: result.promptPackageKey,
    traceKey: result.traceKey,
    promptHash: result.promptHash,
    model: result.model,
    validationStatus: result.validationStatus,
    validationErrors: result.validationErrors,
    latencyMs: result.latencyMs,
    metricCards: result.metricCards,
    gaps: result.gaps,
    rendererPolicy: {
      purePlacementOnly: true,
      proseRewritten: false,
      labelsReplaced: false,
      summaryGenerated: false,
      scrubbed: false,
    },
  };
}

function towerChatFailurePayload(message: string) {
  return {
    error: 'tower_cio_chat_failed',
    detail: message,
    response:
      'aVa could not complete the Tower advisory synthesis. Use the visible dashboard measures as the governed read and try again.',
    modelOutput: {
      version: 'cio_tower_visible_answer_v1',
      answer:
        'aVa could not complete the Tower advisory synthesis. Use the visible dashboard measures as the governed read and try again.',
      tables: [],
      tabs: [],
      followUpQuestion: null,
    },
    rendererPolicy: {
      purePlacementOnly: true,
      fallbackAnswerGenerated: true,
    },
  };
}

function ndjsonEvent(type: string, payload: Record<string, unknown> = {}) {
  return JSON.stringify({ type, ...payload }) + '\n';
}

export async function POST(request: Request) {
  let tenancy;
  try {
    tenancy = await requireTenancy();
  } catch (error) {
    return tenancyErrorResponse(error);
  }

  const body = (await request.json().catch(() => ({}))) as {
    message?: string;
  };
  const question = body.message?.trim();
  if (!question) {
    return Response.json({ error: 'bad_request', detail: 'message required' }, { status: 400 });
  }

  const activeClient = await getActiveClientRow().catch(() => null);
  const tenantKey = canonicalCioTowerTenantKey(tenancy.clientKey ?? activeClient?.key ?? tenancy.clientId);
  const tenantName = activeClient?.name ?? tenantKey;
  const wantsStream =
    request.headers.get('accept')?.includes('application/x-ndjson') ||
    request.headers.get('accept')?.includes('text/event-stream') ||
    Boolean((body as { stream?: boolean }).stream);

  if (wantsStream) {
    const encoder = new TextEncoder();
    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        const emit = (type: string, payload: Record<string, unknown> = {}) => {
          controller.enqueue(encoder.encode(ndjsonEvent(type, payload)));
        };
        try {
          emit('status', {
            phase: 'tenant-context',
            label: 'Grounding Tower context',
          });
          emit('status', {
            phase: 'evidence',
            label: 'Checking governed Tower evidence',
          });
          const result = await answerCioTowerQuestion({
            tenantId: tenancy.clientId,
            userId: tenancy.userId,
            tenantKey,
            tenantName,
            question,
          });
          emit('status', {
            phase: 'validation',
            label: 'Validating answer and visual artifacts',
          });
          emit('tower-answer', buildTowerChatPayload(result));
          emit('done', {
            traceKey: result.traceKey,
            latencyMs: result.latencyMs,
          });
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          emit('error', towerChatFailurePayload(message));
        } finally {
          controller.close();
        }
      },
    });
    return new Response(stream, {
      headers: {
        'Content-Type': 'application/x-ndjson; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        'X-Accel-Buffering': 'no',
      },
    });
  }

  try {
    const result = await answerCioTowerQuestion({
      tenantId: tenancy.clientId,
      userId: tenancy.userId,
      tenantKey,
      tenantName,
      question,
    });
    return Response.json(buildTowerChatPayload(result));
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return Response.json(
      towerChatFailurePayload(message),
      { status: 502 },
    );
  }
}
