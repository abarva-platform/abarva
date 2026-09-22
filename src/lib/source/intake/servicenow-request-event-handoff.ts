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
    throw new Error("A named reviewer identity is required before event creation.");
  }
  return { userId, name };
}

function stableId(parts: readonly string[]): string {
  return createHash("sha256").update(parts.join("\u001f"), "utf8").digest("hex");
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
  if (input.request.requiredFactGaps.length > 0) {
    throw new Error(
      `The request is missing governed facts: ${input.request.requiredFactGaps.join(", ")}.`,
    );
  }
  const actor = reviewer(input.reviewer);
  const rationale = input.decision.rationale.trim();
  if (rationale.length < 12) {
    throw new Error("A review rationale of at least 12 characters is required.");
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
    throw new Error("The accepted category has no registered Source archetype.");
  }
  if (
    input.decision.state === "accepted" &&
    input.request.mappingProposal.archetypeId !== resolution.archetypeId
  ) {
    throw new Error("The proposal no longer matches the registered archetype.");
  }
  if (!input.request.trigger || !input.request.decisionOwner || !input.request.scopeIncluded) {
    throw new Error("The request is missing event-creation facts despite an empty gap list.");
  }

  const category = SOURCE_CATEGORIES.find((item) => item.id === acceptedCategory);
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
    eventInput: {
      eventName: input.request.title,
      eventType: EVENT_TYPE_BY_CATEGORY[acceptedCategory],
      triggerDescription: input.request.trigger,
      decisionOwner: input.request.decisionOwner,
      scopeDescription: buildSourceScopeDescription({
        scopeBoundary: [
          input.request.scopeIncluded,
          input.request.scopeExcluded
            ? `Out of scope: ${input.request.scopeExcluded}`
            : null,
        ]
          .filter(Boolean)
          .join("\n"),
        valueTarget: input.request.requestedOutcome ?? undefined,
        baselineOwner: input.request.baselineOwner ?? undefined,
        category: category?.label ?? acceptedCategory,
      }),
      estimatedValueUsd: input.request.value?.amount,
      createdByUserId: actor.userId,
      creationRequestId: input.request.requestId,
      sourcingMotion: "competitive_rfp",
      categoryId: acceptedCategory,
    },
    linkRationale: `Created from ${input.request.sourceSystem} request ${input.request.requestNumber} after named mapping review.`,
  };
}
