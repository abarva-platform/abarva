import { readFile } from 'node:fs/promises';
import path from 'node:path';

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

import { getActiveClientRow } from '@/lib/active-client';
import { canonicalClientDisplayName } from '@/lib/client-config';
import { buildTowerV2V4DataScript } from '@/lib/tower-v2/v4-data';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const LOGO_SRC = '/brand/abarva-option2-hq-logo-assets/abarva-option2-hq-nav-dark-standard.svg';

function towerAssetUrl(relativeAsset: string): string {
  return `/tower-v2/${relativeAsset}`;
}

function rewriteRelativeTowerAssets(html: string): string {
  return html
    .replace(/\burl\("([^"/][^"]+\.bin)"\)/g, (_match, asset: string) => {
      return `url("${towerAssetUrl(asset)}")`;
    })
    .replace(
      /src="(?:681265c3-e232-440d-93fb-8ebf5caac7f7\.svg|\/brand\/abarva-logo-inverse\.svg)"/g,
      `src="${LOGO_SRC}"`,
    );
}

function rewriteTenantShell(html: string, tenantName: string, root: string): string {
  return html
    .replace(
      '<title>AbarVa · IT Investment Tower · First Capital Financial</title>',
      `<title>AbarVa · IT Investment Tower · ${tenantName}</title>`,
    )
    .replace(
      '<span class="tb-tenant">First Capital Financial</span>',
      `<span class="tb-tenant">${tenantName}</span>`,
    )
    .replace(
      'Synthetic reference dataset · First Capital Financial Corporation · not a real customer · $342M FY26 IT budget · generated 2026-06-17',
      `Synthetic reference dataset · ${tenantName} · not a real customer · data pack ${root} · generated 2026-06-17`,
    );
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const requestedClient = request.nextUrl.searchParams.get('client');
  const client = await getActiveClientRow(requestedClient);
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
  const html = rewriteTenantShell(rewriteRelativeTowerAssets(template), tenantName, root)
    .replace(
      '<script src="/tower-v2/default-data.js"></script>',
      `<script>${safeScript}</script>`,
    );

  return new NextResponse(html, {
    headers: {
      'Cache-Control': 'no-store',
      'Content-Type': 'text/html; charset=utf-8',
    },
  });
}
