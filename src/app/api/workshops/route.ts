import { NextRequest } from 'next/server';
import { createWorkshopTemplate, listWorkshopTemplates } from '@/lib/workshops/authoring';
import type { WorkshopTemplateInput } from '@/lib/workshops/types';
import { errorResponse, fail, mutationCtx, ok, requireWorkshopCtx } from './_route-utils';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const ctx = await requireWorkshopCtx();
  if (ctx instanceof Response) return ctx;
  const url = new URL(request.url);
  try {
    const templates = await listWorkshopTemplates({
      status: url.searchParams.get('status') ?? undefined,
      clientId: ctx.clientId,
      gateId: url.searchParams.get('gateId') ?? undefined,
      limit: Number(url.searchParams.get('limit') ?? 50),
    });
    return ok({ templates });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  const ctx = await requireWorkshopCtx();
  if (ctx instanceof Response) return ctx;
  const body = (await request.json().catch(() => null)) as WorkshopTemplateInput | null;
  if (!body) return fail('bad_request', 'Expected JSON workshop template payload.', 400);

  try {
    const template = await createWorkshopTemplate(body, mutationCtx(ctx));
    return ok({ template }, 201);
  } catch (error) {
    return errorResponse(error);
  }
}
