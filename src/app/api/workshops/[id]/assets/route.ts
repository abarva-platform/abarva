import { NextRequest } from 'next/server';
import { addWorkshopAsset } from '@/lib/workshops/authoring';
import type { WorkshopAssetInput } from '@/lib/workshops/types';
import { errorResponse, fail, mutationCtx, ok, requireWorkshopCtx } from '../../_route-utils';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const ctx = await requireWorkshopCtx();
  if (ctx instanceof Response) return ctx;
  const body = (await request.json().catch(() => null)) as WorkshopAssetInput | null;
  if (!body) return fail('bad_request', 'Expected JSON workshop asset payload.', 400);
  const { id } = await params;
  try {
    const template = await addWorkshopAsset(id, body, mutationCtx(ctx));
    return ok({ template }, 201);
  } catch (error) {
    return errorResponse(error);
  }
}
