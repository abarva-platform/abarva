// /api/programs/origination-draft · Surface 1 PR3 conversation persistence
//
// GET  ?surface=/programs/new  → returns the open draft for the
//      signed-in user on the given surface, or null. Hydrates the
//      workspace on page mount.
// POST { surface, state }      → upsert the open draft. The chat
//      writes after each completed turn so refresh recovers the
//      latest state.
//
// Closes Crawl Obs #4. Per kickoff §5 acceptance: "Steward conversation
// lost on reload — closed via engagement-keyed conversation persistence
// (Surface 1 scope)."

import { NextRequest } from 'next/server';
import { requireTenancy, tenancyErrorResponse } from '@/app/api/v1/programs/_auth';
import {
  getOpenDraft,
  saveDraft,
  type OriginationDraftState,
} from '@/lib/programs/origination-drafts';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ALLOWED_SURFACES = new Set(['/programs/new', '/demo/programs/new', '/strategic-moves/new']);

function badRequest(detail: string): Response {
  return Response.json({ error: 'bad_request', detail }, { status: 400 });
}

export async function GET(req: NextRequest) {
  const surface = req.nextUrl.searchParams.get('surface');
  if (!surface || !ALLOWED_SURFACES.has(surface)) {
    return badRequest('surface query param required and must be a recognized origination surface');
  }
  let ctx;
  try {
    ctx = await requireTenancy();
  } catch (err) {
    try {
      return tenancyErrorResponse(err);
    } catch {
      // fall through
    }
    return Response.json({ error: 'internal_error' }, { status: 500 });
  }
  const draft = await getOpenDraft(ctx, surface);
  return Response.json({ draft });
}

export async function POST(req: NextRequest) {
  let body: { surface?: string; state?: OriginationDraftState };
  try {
    body = (await req.json()) as { surface?: string; state?: OriginationDraftState };
  } catch {
    return badRequest('malformed JSON');
  }
  const surface = body.surface;
  const state = body.state;
  if (!surface || !ALLOWED_SURFACES.has(surface)) {
    return badRequest('surface required');
  }
  if (!state || typeof state !== 'object') {
    return badRequest('state required (object)');
  }
  let ctx;
  try {
    ctx = await requireTenancy();
  } catch (err) {
    try {
      return tenancyErrorResponse(err);
    } catch {
      // fall through
    }
    return Response.json({ error: 'internal_error' }, { status: 500 });
  }
  await saveDraft(ctx, surface, state);
  return Response.json({ ok: true });
}
