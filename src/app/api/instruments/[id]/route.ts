import { NextRequest } from 'next/server';
import { getInstrumentTemplate, updateInstrumentTemplate } from '@/lib/instruments/authoring';
import type { InstrumentTemplateInput } from '@/lib/instruments/types';
import { errorResponse, fail, mutationCtx, ok, requireInstrumentCtx } from '../_route-utils';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const ctx = await requireInstrumentCtx();
  if (ctx instanceof Response) return ctx;
  const { id } = await params;
  const version = Number(new URL(request.url).searchParams.get('version') ?? 0) || undefined;
  try {
    const template = await getInstrumentTemplate(id, version);
    return ok({ template });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const ctx = await requireInstrumentCtx();
  if (ctx instanceof Response) return ctx;
  const body = (await request.json().catch(() => null)) as Partial<InstrumentTemplateInput> | null;
  if (!body) return fail('bad_request', 'Expected JSON instrument template patch.', 400);
  const { id } = await params;
  try {
    const template = await updateInstrumentTemplate(id, body, mutationCtx(ctx));
    return ok({ template });
  } catch (error) {
    return errorResponse(error);
  }
}
