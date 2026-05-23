import { NextRequest } from 'next/server';
import { renderWorkshopPack } from '@/lib/workshops/render';
import { errorResponse, ok, requireWorkshopCtx } from '../../_route-utils';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const ctx = await requireWorkshopCtx();
  if (ctx instanceof Response) return ctx;
  const { id } = await params;
  const body = (await request.json().catch(() => ({}))) as {
    version?: number;
    moveInstanceId?: string | null;
    format?: 'pdf' | 'zip';
  };

  try {
    const pack = await renderWorkshopPack(
      id,
      body.version ?? 1,
      body.moveInstanceId ?? null,
      {
        format: body.format ?? 'zip',
        context: { userId: ctx.userId, clientId: ctx.clientId },
      },
    );
    return ok({
      workshopId: pack.workshopId,
      version: pack.version,
      moveInstanceId: pack.moveInstanceId,
      format: pack.format,
      blobRef: pack.blobRef,
      byteLength: pack.byteLength,
      sha256: pack.sha256,
      contentType: pack.contentType,
    });
  } catch (error) {
    return errorResponse(error);
  }
}
