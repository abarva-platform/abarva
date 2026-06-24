import { NextRequest } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';

import {
  answerEnterpriseSemanticQuestionFromAzure,
  type SemanticRuntimeModule,
} from '@/lib/enterprise-context/semantic-answer-runtime';
import { resolveTenant } from '@/lib/tenant/resolveTenant';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

interface SemanticAskPayload {
  question?: unknown;
  q?: unknown;
  module?: unknown;
  clientKey?: unknown;
  tenantKey?: unknown;
  activeClient?: unknown;
}

const VALID_MODULES = new Set<SemanticRuntimeModule>([
  'home',
  'moves',
  'source',
  'control_tower',
  'tower',
  'ava',
  'intelligence',
  'context_layer_admin',
]);

function stringOrNull(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function moduleOrDefault(value: unknown): SemanticRuntimeModule {
  const raw = stringOrNull(value);
  return raw && VALID_MODULES.has(raw as SemanticRuntimeModule) ? raw as SemanticRuntimeModule : 'ava';
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  return handleAsk({
    question: url.searchParams.get('q') ?? url.searchParams.get('question'),
    module: url.searchParams.get('module'),
    clientKey: url.searchParams.get('clientKey'),
    tenantKey: url.searchParams.get('tenantKey'),
    activeClient: url.searchParams.get('activeClient'),
  });
}

export async function POST(req: NextRequest) {
  let payload: SemanticAskPayload;
  try {
    payload = await req.json() as SemanticAskPayload;
  } catch {
    return Response.json({ ok: false, error: 'bad_request', detail: 'Request body must be valid JSON.' }, { status: 400 });
  }
  return handleAsk(payload);
}

async function handleAsk(payload: SemanticAskPayload) {
  const question = stringOrNull(payload.question) ?? stringOrNull(payload.q);
  if (!question) {
    return Response.json({ ok: false, error: 'bad_request', detail: 'question or q is required.' }, { status: 400 });
  }

  const requestedClient = stringOrNull(payload.clientKey) ?? stringOrNull(payload.tenantKey);
  const surfaceActiveClient = stringOrNull(payload.activeClient);
  let tenant;
  try {
    tenant = await resolveTenant({
      requestedClient,
      surfaceActiveClient,
      allowFallback: false,
    });
  } catch (error) {
    return Response.json(
      {
        ok: false,
        error: 'tenant_resolution_failed',
        detail: error instanceof Error ? error.message : 'Unable to resolve tenant.',
      },
      { status: 400 },
    );
  }

  const user = await currentUser().catch(() => null);
  const answer = await answerEnterpriseSemanticQuestionFromAzure({
    tenantKey: tenant.canonicalKey,
    question,
    module: moduleOrDefault(payload.module),
    userId: user?.id ?? null,
  });

  return Response.json({
    ok: true,
    tenant: {
      appClientKey: tenant.appClientKey,
      canonicalKey: tenant.canonicalKey,
      displayName: tenant.displayName,
      source: tenant.source,
    },
    answer,
  });
}
