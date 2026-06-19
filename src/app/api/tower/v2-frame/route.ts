import { readFile } from 'node:fs/promises';
import path from 'node:path';

import { NextResponse } from 'next/server';

import { getActiveClientRow } from '@/lib/active-client';
import { canonicalClientDisplayName } from '@/lib/client-config';
import { resolveTowerV2V4Dataset } from '@/lib/tower-v2/v4-data';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function stripStandaloneNavigation(html: string): string {
  const topbarStart = html.indexOf('<nav class="topbar">');
  const appStart = topbarStart >= 0 ? html.indexOf('<div class="app">', topbarStart) : -1;
  const withoutTopbar =
    topbarStart >= 0 && appStart > topbarStart
      ? `${html.slice(0, topbarStart)}${html.slice(appStart)}`
      : html;

  return withoutTopbar
    .replaceAll('top: 56px', 'top: 0')
    .replaceAll('top:56px', 'top:0');
}

export async function GET(): Promise<NextResponse> {
  const client = await getActiveClientRow().catch(() => null);
  const tenantName =
    canonicalClientDisplayName({ key: client?.key, name: client?.name }) ??
    client?.name ??
    'First Capital Financial';
  const { root } = resolveTowerV2V4Dataset({
    clientKey: client?.key ?? null,
    tenantName,
  });
  const htmlPath = path.join(process.cwd(), 'public', 'tower-v2', 'index.html');
  const template = await readFile(htmlPath, 'utf8');
  const html = stripStandaloneNavigation(template)
    .replace('src="681265c3-e232-440d-93fb-8ebf5caac7f7.svg"', 'src="/brand/abarva-logo-inverse.svg"')
    .replace(
      '<span class="tb-tenant">First Capital Financial</span>',
      `<span class="tb-tenant">${escapeHtml(tenantName)}</span>`,
    )
    .replace(
      '<script src="/tower-v2/default-data.js"></script>',
      '<script src="/api/tower/v2-data"></script>',
    )
    .replace(
      'Synthetic reference dataset · First Capital Financial Corporation · not a real customer · $342M FY26 IT budget · generated 2026-06-17',
      `Synthetic reference dataset · ${tenantName} · not a real customer · v4 pack ${root} · generated 2026-06-17`,
    );

  return new NextResponse(html, {
    headers: {
      'Cache-Control': 'no-store',
      'Content-Type': 'text/html; charset=utf-8',
    },
  });
}
