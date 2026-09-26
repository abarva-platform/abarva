// POST /api/v1/source/events
//
// Form/API path for creating a persisted Source event without going through
// the chat tool. The chat tool and this route intentionally write the same
// `source_events` shape so approval and detail-canvas behavior stays unified.

import { requireTenancy, tenancyErrorResponse } from "@/lib/auth/tenancy";
import { getActiveClientRow } from "@/lib/active-client";
import { loadUserSourceAccessPolicy } from "@/lib/auth/source-access-policy";
import { createSourcingEvent } from "@/lib/source/queries";
import { buildSourceScopeDescription } from "@/lib/source/intake-summary";
import { selectSourceWriteAdapter } from "@/lib/data-plane/write-adapters/sourceWriteAdapter";
import type { SourceSourcingMotion } from "@/lib/source/sourcing-motion-journeys";
import {
  SOURCE_CATEGORY_IDS,
  type SourceCategoryId,
} from "@/lib/source/taxonomy/category-taxonomy";
import { readSourceIntakeRequestQueue } from "@/lib/source/intake/servicenow-sourcing-request-repository";
import { buildServiceNowRequestEventHandoffFromPersistedDecision } from "@/lib/source/intake/servicenow-request-event-handoff";
import { linkServiceNowRequestToEvent } from "@/lib/source/intake/servicenow-request-event-authority";
import { persistSourceAuthorityVersion } from "@/lib/source/new-workspace/authority-version-store";
import { buildSourceRequestAuthorityPayload } from "@/lib/source/new-workspace/source-version-authority";

interface CreateSourceEventBody {
  eventName?: string;
  eventType?:
    | "managed_service"
    | "software"
    | "staffing"
    | "infrastructure"
    | "consulting"
    | "other";
  triggerDescription?: string;
  decisionOwner?: string;
  scopeDescription?: string;
  valueTargetDescription?: string;
  baselineOwnerDescription?: string;
  categoryId?: string;
  categoryLabel?: string;
  sourcingMotion?: SourceSourcingMotion;
  creationRequestId?: string;
  linkedProgramId?: string;
  estimatedValueUsd?: number;
  sourceRequest?: {
    requestId?: string;
    sourceVersion?: string;
  };
}

function parseSourcingMotion(value: unknown): SourceSourcingMotion | undefined {
  if (value === "competitive_rfp" || value === "contract_optimization") {
    return value;
  }
  return undefined;
}

function parseEventType(
  value: unknown,
): NonNullable<CreateSourceEventBody["eventType"]> {
  if (
    value === "managed_service" ||
    value === "software" ||
    value === "staffing" ||
    value === "infrastructure" ||
    value === "consulting" ||
    value === "other"
  ) {
    return value;
  }
  return "other";
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

function parseOptionalNumber(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim().length > 0) {
    const normalized = Number(value.replace(/[$,]/g, ""));
    return Number.isFinite(normalized) ? normalized : undefined;
  }
  return undefined;
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
        detail: "No active client for Source event creation",
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
        detail: "Source create access is required to create sourcing events.",
      },
      { status: 403 },
    );
  }

  if (!tenancy.userId) {
    return Response.json(
      { error: "named_source_event_creator_required" },
      { status: 403 },
    );
  }

  let body: CreateSourceEventBody;
  try {
    body = (await request.json()) as CreateSourceEventBody;
  } catch {
    return Response.json({ error: "invalid_json" }, { status: 400 });
  }

  const sourceRequestInput = body.sourceRequest;
  const eventName = parseOptionalString(body.eventName);
  const triggerDescription = parseOptionalString(body.triggerDescription);
  if (!sourceRequestInput && (!eventName || !triggerDescription)) {
    return Response.json(
      {
        error: "missing_required_fields",
        detail: "eventName and triggerDescription are required.",
      },
      { status: 400 },
    );
  }

  try {
    let sourceHandoff: ReturnType<
      typeof buildServiceNowRequestEventHandoffFromPersistedDecision
    > | null = null;
    if (sourceRequestInput) {
      const requestId = parseOptionalString(sourceRequestInput.requestId);
      const sourceVersion = parseOptionalString(
        sourceRequestInput.sourceVersion,
      );
      if (!requestId || !sourceVersion) {
        return Response.json(
          {
            error: "invalid_source_request_review",
            detail: "requestId and sourceVersion are required.",
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
              "The request authority could not be read. No event was created.",
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
      if (importedRequest.eventLink) {
        if (importedRequest.eventLink.sourceVersion !== sourceVersion) {
          return Response.json(
            {
              error: "source_request_event_link_version_changed",
              detail:
                "This request is already linked from a different source version.",
            },
            { status: 409 },
          );
        }
        return Response.json({
          ok: true,
          event: { id: importedRequest.eventLink.eventId },
          approvalAuthority:
            "The Event Owner is the default decision authority; governed evidence is still required.",
          approvalUrl: `/source/events/${importedRequest.eventLink.eventId}/approval`,
          eventUrl: `/source/events/${importedRequest.eventLink.eventId}?stage=strategy`,
        });
      }
      try {
        sourceHandoff = buildServiceNowRequestEventHandoffFromPersistedDecision(
          {
            request: importedRequest,
          },
        );
      } catch (error) {
        return Response.json(
          {
            error: "source_request_mapping_decision_required",
            detail:
              error instanceof Error
                ? error.message
                : "Request review is incomplete.",
          },
          { status: 409 },
        );
      }
    }

    const rawScopeDescription = parseOptionalString(body.scopeDescription);
    const valueTargetDescription = parseOptionalString(
      body.valueTargetDescription,
    );
    const baselineOwnerDescription = parseOptionalString(
      body.baselineOwnerDescription,
    );
    const categoryLabel = parseOptionalString(body.categoryLabel);
    const scopeDescription =
      valueTargetDescription || baselineOwnerDescription || categoryLabel
        ? buildSourceScopeDescription({
            scopeBoundary: rawScopeDescription,
            valueTarget: valueTargetDescription,
            baselineOwner: baselineOwnerDescription,
            category: categoryLabel,
          })
        : rawScopeDescription;

    const event = await createSourcingEvent(
      sourceHandoff
        ? {
            clientKey: activeClient.key,
            ...sourceHandoff.eventInput,
            createdByUserId: tenancy.userId,
          }
        : {
            clientKey: activeClient.key,
            eventName: eventName!,
            eventType: parseEventType(body.eventType),
            triggerDescription: triggerDescription!,
            decisionOwner: parseOptionalString(body.decisionOwner),
            scopeDescription,
            linkedProgramId: parseOptionalString(body.linkedProgramId),
            estimatedValueUsd: parseOptionalNumber(body.estimatedValueUsd),
            createdByUserId: tenancy.userId,
            creationRequestId: parseOptionalString(body.creationRequestId),
            sourcingMotion: parseSourcingMotion(body.sourcingMotion),
            categoryId: parseCategoryId(body.categoryId),
          },
    );

    const requestAuthority = await persistSourceAuthorityVersion({
      eventId: event.id,
      clientKey: activeClient.key,
      authorityKind: "request",
      payload: buildSourceRequestAuthorityPayload({
        eventName: event.event_name,
        eventType: event.event_type,
        triggerDescription: event.trigger_description ?? "",
        decisionOwner: event.decision_owner,
        scopeDescription: event.scope_description,
        estimatedValueUsd: event.estimated_value_usd,
        sourcingMotion: event.sourcing_motion,
        classifiedCategory: event.classified_category,
      }),
      createdByUserId: tenancy.userId,
    });

    // A durable owner assignment is required before reporting creation.
    const participantWrite = await selectSourceWriteAdapter(
      undefined,
      activeClient.key,
    ).insertParticipant({
      clientKey: activeClient.key,
      sourceEventId: event.id,
      userId: tenancy.userId,
    });
    if (!participantWrite.ok) {
      throw new Error(
        participantWrite.error ?? "source participant assignment failed",
      );
    }

    if (sourceHandoff && sourceRequestInput?.requestId) {
      await linkServiceNowRequestToEvent({
        tenantKey: activeClient.key,
        requestId: sourceRequestInput.requestId,
        sourceVersion: sourceHandoff.mappingDecision.sourceVersion,
        sourceEventId: event.id,
        linkedByUserId: sourceHandoff.mappingDecision.decidedByUserId,
        linkedByName: sourceHandoff.mappingDecision.decidedByName,
        linkedAt: new Date().toISOString(),
        rationale: sourceHandoff.linkRationale,
      });
    }

    return Response.json({
      ok: true,
      event,
      requestAuthorityVersionId: requestAuthority.versionId,
      approvalAuthority:
        "The Event Owner is the default decision authority; governed evidence is still required.",
      approvalUrl: `/source/events/${event.id}/approval`,
      eventUrl: `/source/events/${event.id}?stage=strategy`,
    });
  } catch (error) {
    return Response.json(
      {
        error: "db_write_failed",
        detail:
          error instanceof Error
            ? error.message
            : "failed to create Source event",
      },
      { status: 500 },
    );
  }
}
