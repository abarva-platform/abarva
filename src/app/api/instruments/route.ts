import { NextRequest } from 'next/server';
import { createInstrumentTemplate, listInstrumentTemplates } from '@/lib/instruments/authoring';
import type { InstrumentTemplateInput } from '@/lib/instruments/types';
import { errorResponse, fail, mutationCtx, ok, requireInstrumentCtx } from './_route-utils';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const ctx = await requireInstrumentCtx();
  if (ctx instanceof Response) return ctx;
  const url = new URL(request.url);
  try {
    const templates = await listInstrumentTemplates({
      status: url.searchParams.get('status') ?? undefined,
      category: url.searchParams.get('category') ?? undefined,
      clientId: ctx.clientId,
      limit: Number(url.searchParams.get('limit') ?? 50),
    });
    return ok({ templates });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  const ctx = await requireInstrumentCtx();
  if (ctx instanceof Response) return ctx;
  const body = (await request.json().catch(() => null)) as InstrumentTemplateInput | null;
  if (!body) return fail('bad_request', 'Expected JSON instrument template payload.', 400);

  try {
    const template = await createInstrumentTemplate(
      { ...body, clientId: body.clientId === undefined ? null : body.clientId },
      mutationCtx(ctx),
    );
    return ok({ template }, 201);
  } catch (error) {
    return errorResponse(error);
  }
}
