import { NextResponse, type NextRequest } from 'next/server';

import {
  deliverQuarterlyBoardPacks,
  resolveQuarterlyDeliveryConfig,
} from '@/lib/programs/expert-kernel/exports/board-pack/quarterly-delivery';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function expectedCronSecret(): string | null {
  const value = process.env.CRON_SECRET?.trim();
  return value && value.length > 0 ? value : null;
}

function bearerToken(req: NextRequest): string | null {
  const header = req.headers.get('authorization');
  if (!header) return null;
  const match = /^Bearer\s+(.+)$/i.exec(header.trim());
  return match?.[1]?.trim() ?? null;
}

function authorized(req: NextRequest): boolean {
  const expected = expectedCronSecret();
  if (!expected) return false;
  return bearerToken(req) === expected;
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  if (!authorized(req)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const result = await deliverQuarterlyBoardPacks(resolveQuarterlyDeliveryConfig());
  console.log(
    JSON.stringify({
      event: 'quarterly_board_pack_cron',
      generated: result.generated,
      attempted: result.attempted,
      sent: result.sent,
      failed: result.failed,
      skipped: result.skipped,
      durationMs: result.durationMs,
    }),
  );
  return NextResponse.json(result, { status: result.ok ? 200 : 207 });
}
