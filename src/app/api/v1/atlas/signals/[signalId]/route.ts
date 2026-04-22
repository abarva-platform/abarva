import { requireAtlasTenancy, tenancyErrorResponse } from '@/app/api/v1/atlas/_auth';
import { getAtlasSignalDetail } from '@/lib/atlas/repository';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: Request, { params }: { params: Promise<{ signalId: string }> }) {
  try {
    const clientId = new URL(req.url).searchParams.get('clientId');
    const ctx = await requireAtlasTenancy(clientId);
    const { signalId } = await params;
    const detail = await getAtlasSignalDetail(ctx, signalId);
    if (!detail) {
      return Response.json({ error: 'not_found' }, { status: 404 });
    }
    return Response.json({ signal: detail });
  } catch (err) {
    try {
      return tenancyErrorResponse(err);
    } catch {
      return Response.json({ error: 'internal_error', message: (err as Error).message }, { status: 500 });
    }
  }
}
