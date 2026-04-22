import { requireAtlasTenancy, tenancyErrorResponse } from '@/app/api/v1/atlas/_auth';
import {
  getAtlasPortfolioSummary,
  listAtlasObservations,
  listAtlasSignals,
} from '@/lib/atlas/repository';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const clientId = new URL(req.url).searchParams.get('clientId');
    const ctx = await requireAtlasTenancy(clientId);
    const [portfolio, observations, signals] = await Promise.all([
      getAtlasPortfolioSummary(ctx),
      listAtlasObservations(ctx, 5),
      listAtlasSignals(ctx, 4),
    ]);

    return Response.json({
      portfolio,
      observations,
      signals,
    });
  } catch (err) {
    try {
      return tenancyErrorResponse(err);
    } catch {
      return Response.json({ error: 'internal_error', message: (err as Error).message }, { status: 500 });
    }
  }
}
