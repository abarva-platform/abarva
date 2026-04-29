// /api/reasoning/contradiction-templates/override
//
// In-memory operator surface for tweaking ContradictionTemplate detection
// hints (and other fields) without editing source. Persistence is out of
// scope — values live in the local `contradiction-template-overrides`
// store and are wiped on server restart.
//
// POST   { patternId, templateId, override: ContradictionTemplate }
// DELETE { patternId, templateId }
// GET    ?patternId=...   → { templates: ContradictionTemplate[] }

import type { ContradictionTemplate } from '@/lib/intelligence/seed-types';
import {
  clearTemplateOverride,
  getOverridesForPattern,
  setTemplateOverride,
} from '@/lib/reasoning/contradiction-template-overrides';
import { findLifecyclePattern } from '@/lib/reasoning/lifecycle-pattern-lookup';

function jsonResponse(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function isContradictionTemplate(value: unknown): value is ContradictionTemplate {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;
  if (typeof v.label !== 'string') return false;
  if (v.severity !== 'low' && v.severity !== 'medium' && v.severity !== 'high') return false;
  if (typeof v.partyA !== 'string') return false;
  if (typeof v.partyB !== 'string') return false;
  if (typeof v.detectionHint !== 'string') return false;
  if (typeof v.resolutionPath !== 'string') return false;
  // `id` is optional on input — the store forces it to match `templateId`.
  if (v.id !== undefined && typeof v.id !== 'string') return false;
  return true;
}

export async function POST(request: Request): Promise<Response> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: 'invalid JSON body' }, 400);
  }

  if (!body || typeof body !== 'object') {
    return jsonResponse({ error: 'body must be an object' }, 400);
  }

  const { patternId, templateId, override } = body as {
    patternId?: unknown;
    templateId?: unknown;
    override?: unknown;
  };

  if (typeof patternId !== 'string' || patternId.length === 0) {
    return jsonResponse({ error: 'patternId is required' }, 400);
  }
  if (typeof templateId !== 'string' || templateId.length === 0) {
    return jsonResponse({ error: 'templateId is required' }, 400);
  }
  if (!isContradictionTemplate(override)) {
    return jsonResponse({ error: 'override must be a ContradictionTemplate' }, 400);
  }

  const pattern = findLifecyclePattern(patternId);
  if (!pattern) {
    return jsonResponse({ error: `unknown patternId: ${patternId}` }, 404);
  }
  const baseline = pattern.contradictionTemplates.find((t) => t.id === templateId);
  if (!baseline) {
    return jsonResponse(
      { error: `unknown templateId ${templateId} for pattern ${patternId}` },
      404,
    );
  }

  setTemplateOverride(patternId, templateId, { ...override, id: templateId });

  return jsonResponse({ ok: true }, 200);
}

export async function DELETE(request: Request): Promise<Response> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: 'invalid JSON body' }, 400);
  }

  if (!body || typeof body !== 'object') {
    return jsonResponse({ error: 'body must be an object' }, 400);
  }

  const { patternId, templateId } = body as {
    patternId?: unknown;
    templateId?: unknown;
  };

  if (typeof patternId !== 'string' || patternId.length === 0) {
    return jsonResponse({ error: 'patternId is required' }, 400);
  }
  if (typeof templateId !== 'string' || templateId.length === 0) {
    return jsonResponse({ error: 'templateId is required' }, 400);
  }

  clearTemplateOverride(patternId, templateId);
  return jsonResponse({ ok: true }, 200);
}

export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const patternId = url.searchParams.get('patternId');
  if (!patternId) {
    return jsonResponse({ error: 'patternId query parameter is required' }, 400);
  }
  const pattern = findLifecyclePattern(patternId);
  if (!pattern) {
    return jsonResponse({ error: `unknown patternId: ${patternId}` }, 404);
  }
  return jsonResponse({ templates: getOverridesForPattern(patternId) }, 200);
}
