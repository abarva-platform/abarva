// /api/reasoning/patterns/[patternId]/override
//
// Runtime operator surface for overriding a pattern's `body` text without
// editing source. Values live in the module-level `patternOverrides` Map
// inside `pattern-body-overrides.ts` and are wiped on server restart.
//
// POST   { body: string }        → { ok: true }
// GET                            → { body: string | null; isOverridden: boolean }
// DELETE                         → { ok: true }

import {
  setPatternBodyOverride,
  getPatternBodyOverride,
  hasPatternBodyOverride,
  clearPatternBodyOverride,
} from '@/lib/reasoning/pattern-body-overrides';

const MAX_BODY_CHARS = 2000;

function jsonResponse(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ patternId: string }> },
): Promise<Response> {
  const { patternId } = await params;
  if (!patternId) {
    return jsonResponse({ error: 'patternId is required' }, 400);
  }
  const override = getPatternBodyOverride(patternId);
  return jsonResponse(
    { body: override, isOverridden: hasPatternBodyOverride(patternId) },
    200,
  );
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ patternId: string }> },
): Promise<Response> {
  const { patternId } = await params;
  if (!patternId) {
    return jsonResponse({ error: 'patternId is required' }, 400);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: 'invalid JSON body' }, 400);
  }

  if (!body || typeof body !== 'object') {
    return jsonResponse({ error: 'body must be an object' }, 400);
  }

  const { body: bodyText } = body as { body?: unknown };

  if (typeof bodyText !== 'string') {
    return jsonResponse({ error: 'body.body must be a string' }, 400);
  }
  if (bodyText.length > MAX_BODY_CHARS) {
    return jsonResponse(
      { error: `body must be at most ${MAX_BODY_CHARS} characters` },
      400,
    );
  }

  setPatternBodyOverride(patternId, bodyText);
  return jsonResponse({ ok: true }, 200);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ patternId: string }> },
): Promise<Response> {
  const { patternId } = await params;
  if (!patternId) {
    return jsonResponse({ error: 'patternId is required' }, 400);
  }
  clearPatternBodyOverride(patternId);
  return jsonResponse({ ok: true }, 200);
}
