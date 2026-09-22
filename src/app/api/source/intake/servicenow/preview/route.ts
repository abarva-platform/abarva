import { NextResponse } from "next/server";
import { requireTenancy, TenancyError } from "@/lib/auth/tenancy";
import {
  adaptServiceNowSourcingRequest,
  type ServiceNowSourcingRequestRow,
} from "@/lib/source/intake/servicenow-sourcing-request-adapter";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type PreviewBody = {
  sourceRow?: unknown;
  row?: unknown;
};

/**
 * Deterministic, read-only preview for one native-shaped ServiceNow request.
 * It proposes routing but never persists a request, accepts a mapping, creates
 * an event, or contacts a supplier.
 */
export async function POST(request: Request) {
  let tenancy;
  try {
    tenancy = await requireTenancy();
  } catch (error) {
    if (error instanceof TenancyError && error.code === "unauthenticated") {
      return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
    }
    return NextResponse.json({ error: "tenancy_unavailable" }, { status: 503 });
  }

  let body: PreviewBody;
  try {
    body = (await request.json()) as PreviewBody;
  } catch {
    return NextResponse.json({ error: "invalid_json_body" }, { status: 400 });
  }
  if (
    !Number.isInteger(body.sourceRow) ||
    !body.row ||
    typeof body.row !== "object" ||
    Array.isArray(body.row)
  ) {
    return NextResponse.json({ error: "invalid_servicenow_request" }, { status: 400 });
  }

  const tenantKey = tenancy.clientKey?.trim();
  if (!tenantKey) {
    return NextResponse.json({ error: "tenancy_unavailable" }, { status: 503 });
  }

  try {
    const canonical = adaptServiceNowSourcingRequest({
      tenantKey,
      sourceRow: body.sourceRow as number,
      row: body.row as ServiceNowSourcingRequestRow,
      loadedSegments: [],
    });
    const preview = Object.fromEntries(
      Object.entries(canonical).filter(([key]) => key !== "rawSource"),
    );
    return NextResponse.json({
      request: preview,
      authority: {
        persisted: false,
        mappingAccepted: false,
        eventCreated: false,
        supplierContactAuthorized: false,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "invalid_servicenow_request",
        message: error instanceof Error ? error.message : "Request is invalid",
      },
      { status: 400 },
    );
  }
}
