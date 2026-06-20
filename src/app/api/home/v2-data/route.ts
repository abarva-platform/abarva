import { NextResponse } from 'next/server';

import { getActiveClientRow } from '@/lib/active-client';
import { canonicalClientDisplayName } from '@/lib/client-config';
import { buildHomeV2DataScript } from '@/lib/home-v2/data';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function javascriptResponse(source: string): NextResponse {
  return new NextResponse(source, {
    headers: {
      'Cache-Control': 'no-store',
      'Content-Type': 'application/javascript; charset=utf-8',
    },
  });
}

export async function GET(): Promise<NextResponse> {
  const client = await getActiveClientRow();
  const tenantName =
    canonicalClientDisplayName({ key: client?.key, name: client?.name }) ??
    client?.name ??
    null;
  const { script } = await buildHomeV2DataScript({
    clientKey: client?.key ?? null,
    tenantName,
  });

  return javascriptResponse(script);
}
