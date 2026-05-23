import { NextRequest } from 'next/server';
import { submitInstrumentTemplate } from '@/lib/instruments/authoring';
import { errorResponse, mutationCtx, ok, requireInstrumentCtx } from '../../_route-utils';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const ctx = await requireInstrumentCtx();
  if (ctx instanceof Response) return ctx;
  const { id } = await params;
  try {
    const template = await submitInstrumentTemplate(id, mutationCtx(ctx));
    return ok({ template });
  } catch (error) {
    return errorResponse(error);
  }
}
