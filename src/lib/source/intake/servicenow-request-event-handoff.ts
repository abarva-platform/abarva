import { createHash } from "node:crypto";
import { resolveArchetypeForEvent } from "@/lib/source/archetypes/event-archetype-resolver";
import { buildSourceScopeDescription } from "@/lib/source/intake-summary";
import {
  SOURCE_CATEGORIES,
  SOURCE_CATEGORY_IDS,
  type SourceCategoryId,
} from "@/lib/source/taxonomy/category-taxonomy";
import type { CreateSourcingEventInput } from "@/lib/source/queries";
import type { SourceIntakeRequestSummary } from "./servicenow-sourcing-request-repository";

type MappingDecisionInput =
  | { state: "accepted"; rationale: string }
  | { state: "overridden"; categoryId: SourceCategoryId; rationale: string };

type PersistedMappingDecision = NonNullable<
  SourceIntakeRequestSummary["mappingDecision"]
>;

export type ServiceNowRequestEventHandoff = {
  mappingDecision: {
    decisionId: string;
    state: "accepted" | "overridden";
    categoryId: SourceCategoryId;
    archetypeId: string;
    decidedByUserId: string;
    decidedByName: string;
    decidedAt: string;
    rationale: string;
    sourceVersion: string;
  };
  eventInput: Omit<CreateSourcingEventInput, "clientKey">;
  linkRationale: string;
};

const GENERIC_REVIEWER_NAMES = new Set([
  "admin",
  "administrator",
  "unknown",
  "unknown user",
  "user",
]);

const EVENT_TYPE_BY_CATEGORY: Record<
  SourceCategoryId,
  CreateSourcingEventInput["eventType"]
> = {
  ams: "managed_service",
  erp_si_implementation: "software",
  data_ai_platform: "software",
  ai_engineering_partner: "consulting",
  saas_renewal: "software",
  cloud_finops: "infrastructure",
  bpo_contact_centre: "managed_service",
  bpo_shared_services: "managed_service",
  cyber_grc: "managed_service",
  staff_aug_vs_managed_service: "staffing",
};

function categoryId(value: string | null): SourceCategoryId {
  if (!value || !(SOURCE_CATEGORY_IDS as readonly string[]).includes(value)) {
    throw new Error("The request has no supported category proposal.");
  }
  return value as SourceCategoryId;
}

function reviewer(input: { userId: string; name: string }) {
  const userId = input.userId.trim();
  const name = input.name.trim();
  if (!userId || !name || GENERIC_REVIEWER_NAMES.has(name.toLowerCase())) {
    throw new Error(
      "A named reviewer identity is required before event creation.",
    );
  }
  return { userId, name };
}

function stableId(parts: readonly string[]): string {
  return createHash("sha256")
    .update(parts.join("\u001f"), "utf8")
    .digest("hex");
}

function assertEventCreationFacts(request: SourceIntakeRequestSummary): void {
  if (request.requiredFactGaps.length > 0) {
    throw new Error(
      `The request is missing governed facts: ${request.requiredFactGaps.join(", ")}.`,
    );
  }
  if (!request.trigger || !request.decisionOwner || !request.scopeIncluded) {
    throw new Error(
      "The request is missing event-creation facts despite an empty gap list.",
    );
  }
}

function buildEventInputFromDecision(
  request: SourceIntakeRequestSummary,
  mappingDecision: PersistedMappingDecision & {
    state: "accepted" | "overridden";
    categoryId: SourceCategoryId;
    archetypeId: string;
  },
): Omit<CreateSourcingEventInput, "clientKey"> {
  assertEventCreationFacts(request);
  const category = SOURCE_CATEGORIES.find(
    (item) => item.id === mappingDecision.categoryId,
  );
  return {
    eventName: request.title,
    eventType: EVENT_TYPE_BY_CATEGORY[mappingDecision.categoryId],
    triggerDescription: request.trigger!,
    decisionOwner: request.decisionOwner ?? undefined,
    scopeDescription: buildSourceScopeDescription({
      scopeBoundary: [
        request.scopeIncluded,
        request.scopeExcluded ? `Out of scope: ${request.scopeExcluded}` : null,
      ]
        .filter(Boolean)
        .join("\n"),
      valueTarget: request.requestedOutcome ?? undefined,
      baselineOwner: request.baselineOwner ?? undefined,
      category: category?.label ?? mappingDecision.categoryId,
    }),
    estimatedValueUsd: request.value?.amount,
    createdByUserId: mappingDecision.decidedByUserId,
    creationRequestId: request.requestId,
    sourcingMotion: "competitive_rfp",
    categoryId: mappingDecision.categoryId,
  };
}

function assertPersistedMappingDecision(
  request: SourceIntakeRequestSummary,
): PersistedMappingDecision & {
  state: "accepted" | "overridden";
  categoryId: SourceCategoryId;
  archetypeId: string;
} {
  const decision = request.mappingDecision;
  if (!decision) {
    throw new Error(
      "A persisted mapping review is required before event creation.",
    );
  }
  if (decision.sourceVersion !== request.sourceVersion) {
    throw new Error(
      "The persisted mapping review is not for the current request version.",
    );
  }
  if (decision.state !== "accepted" && decision.state !== "overridden") {
    throw new Error(
      "The current request version was not accepted for event creation.",
    );
  }
  const acceptedCategory = categoryId(decision.categoryId);
  const resolution = resolveArchetypeForEvent({ categoryId: acceptedCategory });
  if (!resolution.archetypeId) {
    throw new Error(
      "The accepted category has no registered Source archetype.",
    );
  }
  if (decision.archetypeId !== resolution.archetypeId) {
    throw new Error(
      "The persisted mapping review no longer matches the registered archetype.",
    );
  }
  if (!decision.decidedByUserId.trim() || !decision.decidedByName.trim()) {
    throw new Error(
      "A named reviewer identity is required before event creation.",
    );
  }
  return {
    ...decision,
    state: decision.state,
    categoryId: acceptedCategory,
    archetypeId: resolution.archetypeId,
  };
}

export function buildServiceNowRequestEventHandoff(input: {
  request: SourceIntakeRequestSummary;
  decision: MappingDecisionInput;
  reviewer: { userId: string; name: string };
  decidedAt: string;
}): ServiceNowRequestEventHandoff {
  if (input.request.eventLink) {
    throw new Error("This request is already linked to a Source event.");
  }
  assertEventCreationFacts(input.request);
  const actor = reviewer(input.reviewer);
  const rationale = input.decision.rationale.trim();
  if (rationale.length < 12) {
    throw new Error(
      "A review rationale of at least 12 characters is required.",
    );
  }
  const decidedAt = new Date(input.decidedAt);
  if (Number.isNaN(decidedAt.valueOf())) {
    throw new Error("A valid review timestamp is required.");
  }

  const acceptedCategory =
    input.decision.state === "accepted"
      ? categoryId(input.request.mappingProposal.categoryId)
      : categoryId(input.decision.categoryId);
  const resolution = resolveArchetypeForEvent({ categoryId: acceptedCategory });
  if (!resolution.archetypeId) {
    throw new Error(
      "The accepted category has no registered Source archetype.",
    );
  }
  if (
    input.decision.state === "accepted" &&
    input.request.mappingProposal.archetypeId !== resolution.archetypeId
  ) {
    throw new Error("The proposal no longer matches the registered archetype.");
  }
  const sourceVersion = input.request.sourceVersion;
  const decisionId = `mapping-${stableId([
    input.request.requestId,
    sourceVersion,
    input.decision.state,
    acceptedCategory,
    resolution.archetypeId,
    actor.userId,
  ]).slice(0, 32)}`;

  return {
    mappingDecision: {
      decisionId,
      state: input.decision.state,
      categoryId: acceptedCategory,
      archetypeId: resolution.archetypeId,
      decidedByUserId: actor.userId,
      decidedByName: actor.name,
      decidedAt: decidedAt.toISOString(),
      rationale,
      sourceVersion,
    },
    eventInput: buildEventInputFromDecision(input.request, {
      decisionId,
      state: input.decision.state,
      categoryId: acceptedCategory,
      archetypeId: resolution.archetypeId,
      decidedByUserId: actor.userId,
      decidedByName: actor.name,
      decidedAt: decidedAt.toISOString(),
      rationale,
      sourceVersion,
    }),
    linkRationale: `Created from ${input.request.sourceSystem} request ${input.request.requestNumber} after named mapping review.`,
  };
}

export function buildServiceNowRequestEventHandoffFromPersistedDecision(input: {
  request: SourceIntakeRequestSummary;
}): ServiceNowRequestEventHandoff {
  if (input.request.eventLink) {
    throw new Error("This request is already linked to a Source event.");
  }
  const mappingDecision = assertPersistedMappingDecision(input.request);
  return {
    mappingDecision,
    eventInput: buildEventInputFromDecision(input.request, mappingDecision),
    linkRationale: `Created from ${input.request.sourceSystem} request ${input.request.requestNumber} after persisted mapping review ${mappingDecision.decisionId}.`,
  };
}
