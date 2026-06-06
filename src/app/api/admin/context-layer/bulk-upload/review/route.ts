import { NextRequest, NextResponse } from "next/server";

import { requireTenancy, tenancyErrorResponse } from "@/lib/auth/tenancy";
import {
  commitApprovedBulkDocumentReviewArtifact,
  readBulkDocumentReviewArtifact,
} from "@/lib/context-ingestion/bulk-document-review";
import {
  markBulkContextUploadJobCommittedAfterReview,
  readBulkContextUploadJobStatus,
} from "@/lib/context-ingestion/bulk-context-upload-status";
import { canonicalTenantKey } from "@/lib/tenant/aliases";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ApprovalRequest = {
  clientId?: unknown;
  jobId?: unknown;
  approveAll?: unknown;
  approvals?: unknown;
};

type ArtifactApproval = {
  path: string;
  approvedCandidateIds?: string[];
  rejectedCandidateIds?: string[];
};

function queryString(request: NextRequest, key: string): string | null {
  const value = request.nextUrl.searchParams.get(key)?.trim();
  return value ? value : null;
}

function jsonString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function isValidJobId(jobId: string | null): jobId is string {
  return Boolean(jobId && /^bulk-[a-f0-9]{16}$/.test(jobId));
}

async function requireScopedStatus(args: {
  clientId: string | null;
  jobId: string | null;
}) {
  let tenancy;
  try {
    tenancy = await requireTenancy();
  } catch (error) {
    return {
      response: tenancyErrorResponse(error) as NextResponse,
      status: null,
      tenantKey: null,
      userId: null,
    };
  }

  if (!args.clientId) {
    return {
      response: NextResponse.json(
        { error: "clientId required" },
        { status: 400 },
      ),
      status: null,
      tenantKey: null,
      userId: null,
    };
  }
  if (args.clientId !== tenancy.clientId) {
    return {
      response: NextResponse.json(
        { error: "forbidden_cross_tenant" },
        { status: 403 },
      ),
      status: null,
      tenantKey: null,
      userId: null,
    };
  }
  if (!tenancy.clientKey) {
    return {
      response: NextResponse.json(
        { error: "tenant_key_required" },
        { status: 403 },
      ),
      status: null,
      tenantKey: null,
      userId: null,
    };
  }
  if (!isValidJobId(args.jobId)) {
    return {
      response: NextResponse.json({ error: "invalid_job_id" }, { status: 400 }),
      status: null,
      tenantKey: null,
      userId: null,
    };
  }

  const tenantKey = canonicalTenantKey(tenancy.clientKey);
  try {
    const status = await readBulkContextUploadJobStatus({
      clientId: tenancy.clientId,
      tenantKey,
      jobId: args.jobId,
    });
    return {
      response: null,
      status,
      tenantKey,
      userId: tenancy.userId,
    };
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    return {
      response: NextResponse.json(
        { ok: false, error: "bulk_upload_status_failed", detail },
        { status: 500 },
      ),
      status: null,
      tenantKey: null,
      userId: null,
    };
  }
}

function parseApprovals(body: ApprovalRequest): ArtifactApproval[] {
  if (body.approveAll === true) return [];
  if (!Array.isArray(body.approvals)) {
    throw new Error("approvals required unless approveAll is true");
  }
  return body.approvals.map((item): ArtifactApproval => {
    if (!item || typeof item !== "object") {
      throw new Error("approval item must be an object");
    }
    const record = item as Record<string, unknown>;
    const path = jsonString(record.path);
    if (!path) throw new Error("approval path required");
    const approvedCandidateIds = Array.isArray(record.approvedCandidateIds)
      ? record.approvedCandidateIds.filter(
          (value): value is string =>
            typeof value === "string" && value.trim() !== "",
        )
      : undefined;
    const rejectedCandidateIds = Array.isArray(record.rejectedCandidateIds)
      ? record.rejectedCandidateIds.filter(
          (value): value is string =>
            typeof value === "string" && value.trim() !== "",
        )
      : undefined;
    return { path, approvedCandidateIds, rejectedCandidateIds };
  });
}

export async function GET(request: NextRequest) {
  const scoped = await requireScopedStatus({
    clientId: queryString(request, "clientId"),
    jobId: queryString(request, "jobId"),
  });
  if (scoped.response) return scoped.response;
  const status = scoped.status!;
  const tenantKey = scoped.tenantKey!;

  try {
    const artifacts = await Promise.all(
      (status.reviewArtifacts ?? []).map((artifact) =>
        readBulkDocumentReviewArtifact({
          clientId: status.clientId,
          tenantKey,
          bucket: artifact.bucket,
          path: artifact.path,
        }),
      ),
    );
    return NextResponse.json({ ok: true, status, artifacts }, { status: 200 });
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { ok: false, error: "bulk_document_review_read_failed", detail },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  let body: ApprovalRequest;
  try {
    body = (await request.json()) as ApprovalRequest;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const scoped = await requireScopedStatus({
    clientId: jsonString(body.clientId),
    jobId: jsonString(body.jobId),
  });
  if (scoped.response) return scoped.response;
  const status = scoped.status!;
  const tenantKey = scoped.tenantKey!;
  const userId = scoped.userId!;

  try {
    const approvals = parseApprovals(body);
    const artifactRefs = status.reviewArtifacts ?? [];
    const selectedRefs =
      body.approveAll === true
        ? artifactRefs
        : artifactRefs.filter((artifact) =>
            approvals.some((approval) => approval.path === artifact.path),
          );
    if (selectedRefs.length === 0) {
      return NextResponse.json(
        { ok: false, error: "bulk_document_review_artifacts_required" },
        { status: 409 },
      );
    }

    const results = [];
    for (const artifactRef of selectedRefs) {
      const approval = approvals.find((item) => item.path === artifactRef.path);
      const artifact = await readBulkDocumentReviewArtifact({
        clientId: status.clientId,
        tenantKey,
        bucket: artifactRef.bucket,
        path: artifactRef.path,
      });
      results.push(
        await commitApprovedBulkDocumentReviewArtifact({
          artifact,
          approvedBy: userId,
          approvedCandidateIds: approval?.approvedCandidateIds,
          rejectedCandidateIds: approval?.rejectedCandidateIds,
        }),
      );
    }

    const chunksInserted = results.reduce(
      (sum, item) => sum + item.result.chunksInserted,
      0,
    );
    let updatedStatus = status;
    if (chunksInserted > 0) {
      updatedStatus = await markBulkContextUploadJobCommittedAfterReview({
        clientId: status.clientId,
        tenantKey,
        jobId: status.jobId,
        committedArtifactPaths: selectedRefs.map((artifact) => artifact.path),
        chunksQueued: chunksInserted,
      });
    }

    return NextResponse.json(
      {
        ok: true,
        status: updatedStatus,
        results: results.map((item) => item.result),
      },
      { status: 200 },
    );
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { ok: false, error: "bulk_document_review_commit_failed", detail },
      { status: 400 },
    );
  }
}
