// POST /api/v1/moves/board-grade-discover-brief/gamma
//
// Generate a polished Gamma deck for the Apex reference Discover Brief and
// return the Gamma-hosted URL + the signed `.pptx` export URL.
//
// REFERENCE deck only — the shared handler refuses any `?moveId=` parameter.
// See `src/lib/integrations/gamma/route-handler.ts` for the full contract.

import type { NextRequest } from 'next/server';
import { handleGammaExport } from '@/lib/integrations/gamma/route-handler';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300;

export async function POST(req: NextRequest): Promise<Response> {
  return handleGammaExport(
    req,
    'discover-brief',
    'POST /api/v1/moves/board-grade-discover-brief/gamma',
  );
}
