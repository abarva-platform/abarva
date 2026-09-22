import { getActiveClientRow } from "@/lib/active-client";
import { getCurrentUser } from "@/lib/auth/current-user";
import { loadUserSourceAccessPolicy } from "@/lib/auth/source-access-policy";
import { requireTenancy, tenancyErrorResponse } from "@/lib/auth/tenancy";
import { recordServiceNowRequestMappingDecision } from "@/lib/source/intake/servicenow-request-event-authority";
import { buildServiceNowRequestEventHandoff } from "@/lib/source/intake/servicenow-request-event-handoff";
import { readSourceIntakeRequestQueue } from "@/lib/source/intake/servicenow-sourcing-request-repository";
import {
  SOURCE_CATEGORY_IDS,
  type SourceCategoryId,
} from "@/lib/source/taxonomy/category-taxonomy";

interface ReviewServiceNowRequestBody {
  requestId?: string;
  sourceVersion?: string;
  decisionState?: "accepted" | "overridden";
  categoryId?: string;
  rationale?: string;
}

function parseOptionalString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : undefined;
}

function parseCategoryId(value: unknown): SourceCategoryId | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return (SOURCE_CATEGORY_IDS as readonly string[]).includes(trimmed)
    ? (trimmed as SourceCategoryId)
    : undefined;
}

export async function POST(request: Request) {
  let tenancy;
  try {
    tenancy = await requireTenancy();
  } catch (error) {
    return tenancyErrorResponse(error);
  }

  const activeClient = await getActiveClientRow();
  if (!activeClient) {
    return Response.json(
      {
        error: "no_client",
        detail: "No active client for Source request review.",
      },
      { status: 403 },
    );
  }

  const accessPolicy = await loadUserSourceAccessPolicy(tenancy, {
    activeClientKey: activeClient.key,
  }).catch(() => null);
  if (!accessPolicy?.canCreateSourceEvents) {
    return Response.json(
      {
        error: "forbidden_source_create_required",
        detail: "Source create access is required to review request routing.",
      },
      { status: 403 },
    );
  }

  let body: ReviewServiceNowRequestBody;
  try {
    body = (await request.json()) as ReviewServiceNowRequestBody;
  } catch {
    return Response.json({ error: "invalid_json" }, { status: 400 });
  }

  const requestId = parseOptionalString(body.requestId);
  const sourceVersion = parseOptionalString(body.sourceVersion);
  const rationale = parseOptionalString(body.rationale);
  if (!requestId || !sourceVersion || !rationale) {
    return Response.json(
      {
        error: "invalid_source_request_review",
        detail: "requestId, sourceVersion, and rationale are required.",
      },
      { status: 400 },
    );
  }

  const queue = await readSourceIntakeRequestQueue(activeClient.key);
  if (!queue.registryAvailable) {
    return Response.json(
      {
        error: "source_request_registry_unavailable",
        detail:
          "The request authority could not be read. No review was recorded.",
      },
      { status: 503 },
    );
  }

  const importedRequest = queue.requests.find(
    (candidate) => candidate.requestId === requestId,
  );
  if (!importedRequest) {
    return Response.json(
      { error: "source_request_not_found" },
      { status: 404 },
    );
  }
  if (importedRequest.sourceVersion !== sourceVersion) {
    return Response.json(
      {
        error: "source_request_version_changed",
        detail:
          "The imported request changed. Review the latest version before creating an event.",
      },
      { status: 409 },
    );
  }

  const user = await getCurrentUser();
  if (!user?.personId) {
    return Response.json(
      {
        error: "reviewer_identity_required",
        detail:
          "A named canonical person is required to review request routing.",
      },
      { status: 409 },
    );
  }

  const decision =
    body.decisionState === "overridden"
      ? {
          state: "overridden" as const,
          categoryId: parseCategoryId(body.categoryId),
          rationale,
        }
      : body.decisionState === "accepted"
        ? { state: "accepted" as const, rationale }
        : null;
  if (!decision || (decision.state === "overridden" && !decision.categoryId)) {
    return Response.json(
      {
        error: "invalid_mapping_decision",
        detail: "Accept the proposal or choose a supported override category.",
      },
      { status: 400 },
    );
  }

  try {
    const handoff = buildServiceNowRequestEventHandoff({
      request: importedRequest,
      decision:
        decision.state === "overridden"
          ? { ...decision, categoryId: decision.categoryId! }
          : decision,
      reviewer: { userId: user.personId, name: user.name },
      decidedAt: new Date().toISOString(),
    });
    await recordServiceNowRequestMappingDecision({
      tenantKey: activeClient.key,
      requestId: importedRequest.requestId,
      decision: handoff.mappingDecision,
    });
    return Response.json({
      ok: true,
      mappingDecision: handoff.mappingDecision,
    });
  } catch (error) {
    return Response.json(
      {
        error: "source_request_review_blocked",
        detail:
          error instanceof Error
            ? error.message
            : "Request review is incomplete.",
      },
      { status: 409 },
    );
  }
}
