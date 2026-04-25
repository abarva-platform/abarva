import type { NextRequest } from 'next/server';

import { requireTenancy, tenancyErrorResponse } from '../../../../_intel-auth';
import {
  createSourceNexusApiStubResponse,
  normalizeSourceNexusApiRequestBody,
} from '@/lib/source/nexus-api';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type SourceNexusRouteContext = {
  params: Promise<{ eventId?: string }>;
};

export async function POST(
  request: NextRequest,
  { params }: SourceNexusRouteContext,
) {
  try {
    const tenancy = await requireTenancy();
    const { eventId } = await params;
    const bodyResult = await parseSourceNexusRequestBody(request);

    if (!bodyResult.ok) {
      return Response.json(bodyResult.body, { status: bodyResult.status });
    }

    const normalizedBody = normalizeSourceNexusApiRequestBody(bodyResult.body);
    const response = createSourceNexusApiStubResponse({
      ...normalizedBody,
      eventId,
      tenant: {
        tenantId: tenancy.clientId,
        activeClientId: tenancy.clientId,
      },
      user: {
        id: tenancy.userId,
      },
    });

    return Response.json(response, { status: response.httpStatus });
  } catch (error) {
    try {
      return tenancyErrorResponse(error);
    } catch {
      return Response.json(
        {
          ok: false,
          error: 'internal_error',
          detail: error instanceof Error ? error.message : 'Unknown Source Nexus API stub error',
          noModel: true,
        },
        { status: 500 },
      );
    }
  }
}

async function parseSourceNexusRequestBody(
  request: NextRequest,
): Promise<
  | { ok: true; body: unknown }
  | { ok: false; status: number; body: { ok: false; error: string; detail: string; noModel: true } }
> {
  const raw = await request.text();
  if (!raw.trim()) {
    return { ok: true, body: {} };
  }

  try {
    return { ok: true, body: JSON.parse(raw) as unknown };
  } catch {
    return {
      ok: false,
      status: 400,
      body: {
        ok: false,
        error: 'bad_request',
        detail: 'Malformed JSON request body.',
        noModel: true,
      },
    };
  }
}
