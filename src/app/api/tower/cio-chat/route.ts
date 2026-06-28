import { getActiveClientRow } from '@/lib/active-client';
import { requireTenancy, tenancyErrorResponse } from '@/lib/auth/tenancy';
import { answerCioTowerQuestion, canonicalCioTowerTenantKey } from '@/lib/cio-tower/answer';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

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

  try {
    const result = await answerCioTowerQuestion({
      tenantId: tenancy.clientId,
      userId: tenancy.userId,
      tenantKey,
      tenantName,
      question,
    });
    return Response.json({
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
      rendererPolicy: {
        purePlacementOnly: true,
        proseRewritten: false,
        labelsReplaced: false,
        summaryGenerated: false,
        scrubbed: false,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return Response.json(
      {
        error: 'tower_cio_chat_failed',
        detail: message,
        rendererPolicy: {
          purePlacementOnly: true,
          fallbackAnswerGenerated: false,
        },
      },
      { status: 502 },
    );
  }
}
