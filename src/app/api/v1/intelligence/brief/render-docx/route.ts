// GET /api/v1/intelligence/brief/render-docx
//
// Gap G9: the Intelligence surface produced nothing downloadable. This
// route assembles a CXO Intelligence brief from REAL per-tenant data
// and streams it back as a docx attachment.
//
// Grounding (no fabrication — see PR #2143): Apex Retail's brief carries
// the seeded corpus content plus ai_initiatives portfolio; Meridian /
// First Capital export only the ai_initiatives portfolio and an honest
// "corpus not yet seeded" disclosure.
//
// Auth: requireTenancy — any authenticated tenant member may export the
// brief for their active tenant.

import type { NextRequest } from 'next/server';
import { Packer } from 'docx';
import { requireTenancy, tenancyErrorResponse } from '@/lib/auth/tenancy';
import {
  DOCX_CONTENT_TYPE,
  buildIntelligenceBriefPayloadForActiveTenant,
  renderIntelligenceBriefDocx,
} from '@/lib/intelligence/exports';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  try {
    await requireTenancy();
  } catch (err) {
    return tenancyErrorResponse(err);
  }

  const requestedClient = req.nextUrl.searchParams.get('client');
  const generatedAt = new Date().toISOString();

  let buffer: Buffer;
  let slug: string;
  try {
    const payload = await buildIntelligenceBriefPayloadForActiveTenant(
      requestedClient,
      generatedAt,
    );
    slug = payload.filenameSlug;
    const document = renderIntelligenceBriefDocx(payload);
    buffer = await Packer.toBuffer(document);
  } catch (err) {
    console.error(
      '[GET /api/v1/intelligence/brief/render-docx] renderer error',
      err,
    );
    return Response.json(
      {
        error: 'render_failed',
        detail: err instanceof Error ? err.message : 'docx renderer failed',
      },
      { status: 500 },
    );
  }

  const filename = `intelligence-brief__${slug}__${generatedAt.slice(0, 10)}.docx`;
  return new Response(buffer as unknown as ArrayBuffer, {
    status: 200,
    headers: {
      'content-type': DOCX_CONTENT_TYPE,
      'content-disposition': `attachment; filename="${filename}"`,
      'cache-control': 'no-store',
      'x-intelligence-artifact': 'cxo-brief',
      'x-intelligence-artifact-format': 'docx',
    },
  });
}
