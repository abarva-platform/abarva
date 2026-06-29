import { currentUser } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

import { answerHomeKnowFromV6 } from "@/lib/home/know/v6-home-ask";
import { resolveTenant } from "@/lib/tenant/resolveTenant";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

interface HomeKnowPayload {
  question?: unknown;
  q?: unknown;
  client?: unknown;
  clientKey?: unknown;
  tenantKey?: unknown;
  activeClient?: unknown;
  includeTrace?: unknown;
}

function stringOrNull(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

export async function POST(req: NextRequest) {
  let payload: HomeKnowPayload;
  try {
    payload = (await req.json()) as HomeKnowPayload;
  } catch {
    return NextResponse.json(
      { ok: false, error: "bad_request", detail: "Request body must be valid JSON." },
      { status: 400 },
    );
  }
  return handleAsk(req, payload);
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  return handleAsk(req, {
    question: url.searchParams.get("question"),
    q: url.searchParams.get("q"),
    client: url.searchParams.get("client"),
    clientKey: url.searchParams.get("clientKey"),
    tenantKey: url.searchParams.get("tenantKey"),
    activeClient: url.searchParams.get("activeClient"),
    includeTrace: url.searchParams.get("includeTrace"),
  });
}

async function handleAsk(req: NextRequest, payload: HomeKnowPayload) {
  const question = stringOrNull(payload.question) ?? stringOrNull(payload.q);
  if (!question) {
    return NextResponse.json(
      { ok: false, error: "bad_request", detail: "question or q is required." },
      { status: 400 },
    );
  }

  const requestedClient =
    stringOrNull(payload.clientKey) ??
    stringOrNull(payload.tenantKey) ??
    stringOrNull(payload.client);
  const surfaceClientKey =
    stringOrNull(payload.client) ??
    stringOrNull(payload.tenantKey) ??
    stringOrNull(payload.activeClient);
  const tenant = await resolveTenant({
    requestedClient,
    surfaceClientKey,
    surfaceActiveClient: stringOrNull(payload.activeClient),
    allowFallback: false,
  }).catch((error: unknown) => {
    const detail = error instanceof Error ? error.message : "Unable to resolve tenant.";
    return NextResponse.json(
      { ok: false, error: "tenant_resolution_failed", detail },
      { status: 400 },
    );
  });
  if (tenant instanceof Response) return tenant;

  const user = await currentUser().catch(() => null);
  const includeTrace = payload.includeTrace === true || payload.includeTrace === "true";

  try {
    const response = answerHomeKnowFromV6({
      tenantKey: tenant.appClientKey,
      tenantDisplayName: tenant.displayName,
      question,
      includeTrace,
      userId: user?.id ?? null,
    });
    return NextResponse.json(response);
  } catch (error) {
    const detail = error instanceof Error ? error.message : "V6 Home context pack is not available.";
    return NextResponse.json(
      {
        ok: false,
        error: "v6_context_unavailable",
        detail,
        tenant: {
          appClientKey: tenant.appClientKey,
          canonicalKey: tenant.canonicalKey,
          displayName: tenant.displayName,
          source: tenant.source,
        },
        proof: {
          source: "v6_dataset_pack",
          oldSemanticLayersSunset: true,
          semantic2Loaded: false,
        },
      },
      { status: 424 },
    );
  }
}
