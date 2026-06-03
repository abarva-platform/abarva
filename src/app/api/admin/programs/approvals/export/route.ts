// T217 · Client-exportable approval audit log.
//
// Authenticated active-client users can export the approval audit trail for
// their current tenant. The route never accepts a tenant key from the caller;
// tenancy is resolved by the shared admin approvals auth helper.

import { NextRequest, NextResponse } from "next/server";
import {
  buildClientApprovalAuditExportPackage,
  buildClientApprovalAuditExportRecord,
  renderClientApprovalAuditCsv,
  renderClientApprovalAuditJson,
} from "@/lib/ai-liability/approval-audit-export";
import {
  listApprovalAuditForTenant,
  type ApprovalRequestStatus,
} from "@/lib/programs/approval";
import { adminAuthErrorResponse, requireAdminAuth } from "../_auth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const VALID_STATUSES = new Set<ApprovalRequestStatus>([
  "pending",
  "approved",
  "rejected",
  "withdrawn",
]);

function parseIsoDate(value: string | null): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = Date.parse(trimmed);
  if (!Number.isFinite(parsed)) return "invalid";
  return new Date(parsed).toISOString();
}

function safeFilenamePart(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-|-$/g, "");
}

export async function GET(request: NextRequest): Promise<Response> {
  let auth;
  try {
    auth = await requireAdminAuth();
  } catch (err) {
    return adminAuthErrorResponse(err);
  }

  const params = request.nextUrl.searchParams;
  const format = params.get("format") === "csv" ? "csv" : "json";
  const fromIso = parseIsoDate(params.get("from"));
  const toIso = parseIsoDate(params.get("to"));
  if (fromIso === "invalid" || toIso === "invalid") {
    return NextResponse.json(
      {
        error: "invalid_date",
        detail: "from/to must be valid ISO date strings.",
      },
      { status: 400 },
    );
  }

  const rawStatus = params.get("status")?.trim() ?? "all";
  const status =
    rawStatus === "all"
      ? "all"
      : VALID_STATUSES.has(rawStatus as ApprovalRequestStatus)
        ? (rawStatus as ApprovalRequestStatus)
        : null;
  if (!status) {
    return NextResponse.json(
      {
        error: "invalid_status",
        detail:
          "status must be one of all, pending, approved, rejected, withdrawn.",
      },
      { status: 400 },
    );
  }

  const limitParam = params.get("limit");
  const parsedLimit = limitParam ? Number(limitParam) : null;
  if (
    limitParam &&
    (!Number.isFinite(parsedLimit) || parsedLimit === null || parsedLimit <= 0)
  ) {
    return NextResponse.json(
      { error: "invalid_limit", detail: "limit must be a positive number." },
      { status: 400 },
    );
  }

  try {
    const requests = await listApprovalAuditForTenant({
      tenantKey: auth.tenantKey,
      fromIso,
      toIso,
      status,
      limit: parsedLimit,
    });
    const records = requests.map(buildClientApprovalAuditExportRecord);
    const auditPackage = buildClientApprovalAuditExportPackage({
      tenantKey: auth.tenantKey,
      records,
    });
    const datePart = new Date().toISOString().slice(0, 10);
    const filename = `approval-audit-${safeFilenamePart(auth.tenantKey)}-${datePart}.${format}`;

    if (format === "csv") {
      return new Response(renderClientApprovalAuditCsv(records), {
        status: 200,
        headers: {
          "content-type": "text/csv; charset=utf-8",
          "content-disposition": `attachment; filename="${filename}"`,
          "cache-control": "no-store",
          "x-abarva-audit-export": "client-approval-audit",
          "x-abarva-audit-record-count": String(records.length),
        },
      });
    }

    return new Response(renderClientApprovalAuditJson(auditPackage), {
      status: 200,
      headers: {
        "content-type": "application/json; charset=utf-8",
        "content-disposition": `attachment; filename="${filename}"`,
        "cache-control": "no-store",
        "x-abarva-audit-export": "client-approval-audit",
        "x-abarva-audit-record-count": String(records.length),
      },
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "approval_audit_export_failed";
    return NextResponse.json(
      { error: "approval_audit_export_failed", detail: message },
      { status: 500 },
    );
  }
}
