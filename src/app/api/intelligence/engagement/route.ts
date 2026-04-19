import { NextRequest, NextResponse } from 'next/server';
import {
  getPeerDecisionsForPhase,
  getActivePatterns,
  getChainedPatterns,
  getSimilarEngagements,
  getSponsorContext,
} from '@/lib/graph/retrieval';

export async function GET(req: NextRequest) {
  const engagementId = req.nextUrl.searchParams.get('engagementId');
  const phase = parseInt(req.nextUrl.searchParams.get('phase') ?? '2', 10);
  if (!engagementId) {
    return NextResponse.json({ error: 'engagementId required' }, { status: 400 });
  }
  try {
    const [peer_decisions, active_patterns, chained_patterns, similar_engagements, sponsor] =
      await Promise.all([
        getPeerDecisionsForPhase(engagementId, phase),
        getActivePatterns(engagementId),
        getChainedPatterns(engagementId),
        getSimilarEngagements(engagementId),
        getSponsorContext(engagementId),
      ]);
    return NextResponse.json({
      engagement_id: engagementId, phase,
      peer_decisions, active_patterns, chained_patterns, similar_engagements, sponsor,
    });
  } catch (err: unknown) {
    console.error('graph intelligence error:', err);
    const msg = err instanceof Error ? err.message : 'unknown';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
