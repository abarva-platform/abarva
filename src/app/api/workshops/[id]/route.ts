import { NextRequest } from 'next/server';
import { getWorkshopTemplate, updateWorkshopTemplate } from '@/lib/workshops/authoring';
import type { WorkshopTemplateInput } from '@/lib/workshops/types';
import { errorResponse, fail, mutationCtx, ok, requireWorkshopCtx } from '../_route-utils';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const ctx = await requireWorkshopCtx();
  if (ctx instanceof Response) return ctx;
  const { id } = await params;
  const url = new URL(request.url);
  const version = url.searchParams.has('version') ? Number(url.searchParams.get('version')) : undefined;
  try {
    const template = await getWorkshopTemplate(id, version);
    return ok({ template });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const ctx = await requireWorkshopCtx();
  if (ctx instanceof Response) return ctx;
  const body = (await request.json().catch(() => null)) as Partial<WorkshopTemplateInput> | null;
  if (!body) return fail('bad_request', 'Expected JSON workshop template patch.', 400);
  const { id } = await params;
  try {
    const template = await updateWorkshopTemplate(id, body, mutationCtx(ctx));
    return ok({ template });
  } catch (error) {
    return errorResponse(error);
  }
}
