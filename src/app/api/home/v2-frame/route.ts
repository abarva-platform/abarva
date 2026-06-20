import { readFile } from 'node:fs/promises';
import path from 'node:path';

import { NextResponse } from 'next/server';

import { getActiveClientRow } from '@/lib/active-client';
import { canonicalClientDisplayName } from '@/lib/client-config';
import { buildHomeV2DataScript } from '@/lib/home-v2/data';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const EMBED_CSS = `
<style id="abarva-home-v2-embed-css">
  .topbar { display: none !important; }
  .rail { top: 0 !important; height: 100vh !important; }
  .askbar { top: 0 !important; }
  .canvas { min-height: 100vh !important; }
</style>`;

export async function GET(): Promise<NextResponse> {
  const client = await getActiveClientRow();
  const activeTenantName =
    canonicalClientDisplayName({ key: client?.key, name: client?.name }) ??
    client?.name ??
    null;
  const { script } = await buildHomeV2DataScript({
    clientKey: client?.key ?? null,
    tenantName: activeTenantName,
  });
  const htmlPath = path.join(process.cwd(), 'public', 'home-v2', 'index.html');
  const template = await readFile(htmlPath, 'utf8');
  const safeScript = script.replace(/<\/script/gi, '<\\/script');
  const html = template
    .replace('</head>', `${EMBED_CSS}</head>`)
    .replace('<!-- ABARVA_HOME_V2_DATA -->', `<script>${safeScript}</script>`);

  return new NextResponse(html, {
    headers: {
      'Cache-Control': 'no-store',
      'Content-Type': 'text/html; charset=utf-8',
    },
  });
}
