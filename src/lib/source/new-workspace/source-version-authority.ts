import { createHash } from "node:crypto";

export type SourceAuthorityKind = "request" | "strategy";

export type SourceAuthorityApprovalRole =
  | "request_acceptor"
  | "business_owner"
  | "procurement_lead";

export type SourceAuthorityDecision = "approved" | "changes_requested";

export type JsonValue =
  | null
  | boolean
  | number
  | string
  | JsonValue[]
  | { readonly [key: string]: JsonValue | undefined };

export type SourceAuthorityCurrentVersion = {
  id: string;
  versionNumber: number;
  contentHash: string;
};

export type SourceAuthorityApproval = {
  versionId: string;
  role: SourceAuthorityApprovalRole;
  actorId: string;
  decision: SourceAuthorityDecision;
};

export type SourceRequestAuthorityPayloadInput = {
  eventName: string;
  eventType: string;
  triggerDescription: string;
  decisionOwner?: string | null;
  scopeDescription?: string | null;
  estimatedValueUsd?: number | null;
  sourcingMotion?: string | null;
  classifiedCategory?: string | null;
};

/**
 * The material Request fields whose exact content is accepted at the intake
 * gate. Keeping this projection shared prevents create, edit, and approval
 * paths from hashing subtly different representations of the same request.
 */
export function buildSourceRequestAuthorityPayload(
  input: SourceRequestAuthorityPayloadInput,
): JsonValue {
  return {
    eventName: input.eventName.trim(),
    eventType: input.eventType.trim(),
    triggerDescription: input.triggerDescription.trim(),
    decisionOwner: input.decisionOwner?.trim() || null,
    scopeDescription: input.scopeDescription?.trim() || null,
    estimatedValueUsd: input.estimatedValueUsd ?? null,
    sourcingMotion: input.sourcingMotion?.trim() || null,
    classifiedCategory: input.classifiedCategory?.trim() || null,
  };
}

export type SourceAuthorityVersionPlanInput = {
  eventId: string;
  clientKey: string;
  authorityKind: SourceAuthorityKind;
  payload: JsonValue;
  createdByUserId: string;
  currentVersion: SourceAuthorityCurrentVersion | null;
};

/**
 * No `invalidatedApprovalVersionIds`. The plan used to return the prior current
 * version's id as a list of approvals to invalidate, and nothing ever read it:
 * the invariant it described is held at READ time, by the approvals query's own
 * `version_id` predicate in `authority-version-store.ts`, which never asks for a
 * superseded version's approvals at all. Two writers of one rule is two things
 * to keep honest, so the unread one is gone rather than given a consumer;
 * `authority-version-store.test.ts` pins both halves of that — the fence, and
 * that the write path still touches only the versions table.
 */
export type SourceAuthorityVersionPlan =
  | {
      action: "reuse_current";
      eventId: string;
      clientKey: string;
      authorityKind: SourceAuthorityKind;
      versionId: string;
      versionNumber: number;
      contentHash: string;
    }
  | {
      action: "create_version";
      eventId: string;
      clientKey: string;
      authorityKind: SourceAuthorityKind;
      versionNumber: number;
      contentHash: string;
      contentJson: unknown;
      createdByUserId: string;
      supersedesVersionId: string | null;
    };

export type RequestVersionApprovalState =
  | { status: "accepted"; acceptedBy: string }
  | { status: "pending"; missing: string[] }
  | { status: "changes_requested"; blockers: string[] };

export type StrategyVersionApprovalState =
  | {
      status: "approved";
      approvedBy: { businessOwner: string; procurementLead: string };
    }
  | { status: "pending"; missing: string[] }
  | { status: "blocked"; blockers: string[] }
  | { status: "changes_requested"; blockers: string[] };

function filled(value: string | undefined): boolean {
  return Boolean(value?.trim());
}

export function canonicalizeSourceAuthorityPayload(value: JsonValue): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => canonicalizeSourceAuthorityPayload(item));
  }
  if (value && typeof value === "object") {
    const sortedEntries = Object.entries(value)
      .filter(([, item]) => item !== undefined)
      .sort(([left], [right]) => left.localeCompare(right));
    const output: Record<string, unknown> = {};
    for (const [key, item] of sortedEntries) {
      output[key] = canonicalizeSourceAuthorityPayload(item as JsonValue);
    }
    return output;
  }
  return value;
}

export function computeSourceAuthorityContentHash(payload: JsonValue): string {
  return createHash("sha256")
    .update(JSON.stringify(canonicalizeSourceAuthorityPayload(payload)))
    .digest("hex");
}

export function planSourceAuthorityVersion(
  input: SourceAuthorityVersionPlanInput,
): SourceAuthorityVersionPlan {
  const contentJson = canonicalizeSourceAuthorityPayload(input.payload);
  const contentHash = computeSourceAuthorityContentHash(input.payload);
  if (input.currentVersion?.contentHash === contentHash) {
    return {
      action: "reuse_current",
      eventId: input.eventId,
      clientKey: input.clientKey,
      authorityKind: input.authorityKind,
      versionId: input.currentVersion.id,
      versionNumber: input.currentVersion.versionNumber,
      contentHash,
    };
  }

  return {
    action: "create_version",
    eventId: input.eventId,
    clientKey: input.clientKey,
    authorityKind: input.authorityKind,
    versionNumber: input.currentVersion
      ? input.currentVersion.versionNumber + 1
      : 1,
    contentHash,
    contentJson,
    createdByUserId: input.createdByUserId,
    supersedesVersionId: input.currentVersion?.id ?? null,
  };
}

function approvalsForCurrentVersion(
  currentVersionId: string,
  approvals: readonly SourceAuthorityApproval[],
): SourceAuthorityApproval[] {
  return approvals.filter(
    (approval) =>
      approval.versionId === currentVersionId && filled(approval.actorId),
  );
}

export function evaluateRequestVersionApproval(input: {
  currentVersionId: string;
  approvals: readonly SourceAuthorityApproval[];
}): RequestVersionApprovalState {
  const current = approvalsForCurrentVersion(
    input.currentVersionId,
    input.approvals,
  );
  if (
    current.some(
      (approval) =>
        approval.role === "request_acceptor" &&
        approval.decision === "changes_requested",
    )
  ) {
    return {
      status: "changes_requested",
      blockers: ["Changes requested for this Request version"],
    };
  }
  const accepted = current.find(
    (approval) =>
      approval.role === "request_acceptor" && approval.decision === "approved",
  );
  if (accepted) return { status: "accepted", acceptedBy: accepted.actorId };
  return { status: "pending", missing: ["Request acceptance pending"] };
}

export function evaluateStrategyVersionApprovals(input: {
  currentVersionId: string;
  approvals: readonly SourceAuthorityApproval[];
}): StrategyVersionApprovalState {
  const current = approvalsForCurrentVersion(
    input.currentVersionId,
    input.approvals,
  );
  if (current.some((approval) => approval.decision === "changes_requested")) {
    return {
      status: "changes_requested",
      blockers: ["Changes requested for this Strategy version"],
    };
  }

  const business = current.find(
    (approval) =>
      approval.role === "business_owner" && approval.decision === "approved",
  );
  const procurement = current.find(
    (approval) =>
      approval.role === "procurement_lead" && approval.decision === "approved",
  );

  if (business && procurement && business.actorId === procurement.actorId) {
    return {
      status: "blocked",
      blockers: ["Two distinct people must approve the Strategy version"],
    };
  }
  if (business && procurement) {
    return {
      status: "approved",
      approvedBy: {
        businessOwner: business.actorId,
        procurementLead: procurement.actorId,
      },
    };
  }

  return {
    status: "pending",
    missing: [
      ...(!business ? ["Business owner approval pending"] : []),
      ...(!procurement ? ["Procurement lead approval pending"] : []),
    ],
  };
}
