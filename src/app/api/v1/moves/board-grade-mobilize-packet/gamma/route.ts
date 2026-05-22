// POST /api/v1/moves/board-grade-mobilize-packet/gamma
//
// Generate a polished Gamma deck for the Apex reference Mobilize & Go-Decision
// Packet. REFERENCE deck only — `?moveId=` is refused. See route-handler for
// the full contract.

import type { NextRequest } from 'next/server';
import { handleGammaExport } from '@/lib/integrations/gamma/route-handler';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300;

export async function POST(req: NextRequest): Promise<Response> {
  return handleGammaExport(
    req,
    'mobilize-packet',
    'POST /api/v1/moves/board-grade-mobilize-packet/gamma',
  );
}
