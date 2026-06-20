import { readFile } from 'node:fs/promises';
import path from 'node:path';

import { NextResponse } from 'next/server';

import { getActiveClientRow } from '@/lib/active-client';
import { canonicalClientDisplayName } from '@/lib/client-config';
import { buildTowerV2V4DataScript } from '@/lib/tower-v2/v4-data';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(): Promise<NextResponse> {
  const client = await getActiveClientRow();
  const activeTenantName =
    canonicalClientDisplayName({ key: client?.key, name: client?.name }) ??
    client?.name ??
    null;
  const { script, root, tenantName } = await buildTowerV2V4DataScript({
    clientKey: client?.key ?? null,
    tenantName: activeTenantName,
  });
  const htmlPath = path.join(process.cwd(), 'public', 'tower-v2', 'index.html');
  const template = await readFile(htmlPath, 'utf8');
  const safeScript = script.replace(/<\/script/gi, '<\\/script');
  const html = template
    .replace('src="681265c3-e232-440d-93fb-8ebf5caac7f7.svg"', 'src="/brand/abarva-logo-inverse.svg"')
    .replace(
      '<script src="/tower-v2/default-data.js"></script>',
      `<script>${safeScript}</script>`,
    )
    .replace(
      'Synthetic reference dataset · First Capital Financial Corporation · not a real customer · $342M FY26 IT budget · generated 2026-06-17',
      `Synthetic reference dataset · ${tenantName} · not a real customer · data pack ${root} · generated 2026-06-17`,
    );

  return new NextResponse(html, {
    headers: {
      'Cache-Control': 'no-store',
      'Content-Type': 'text/html; charset=utf-8',
    },
  });
}
