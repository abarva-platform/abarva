import "server-only";
import { p5Hash } from "@/lib/data-plane/write-adapters/p5OutcomeHandoffAdapter";

export interface ReviewedDeliverableVersion {
  version: number;
  versionId: string | null;
  contentHash: string;
  planBindingHash: string | null;
  planHash: string | null;
}

export class DeliverableReviewChanged extends Error {
  readonly code = "deliverable_review_changed";
  readonly status = 409;
  constructor() {
    super(
      "The document version or review basis changed before approval. No sign-off was recorded. Reload and review the current version before approving it.",
    );
  }
}

export class DeliverableReviewUnavailable extends Error {
  readonly code = "deliverable_review_unavailable";
  readonly status = 503;
  constructor() {
    super(
      "The reviewed document version could not be verified. No sign-off state is claimed; retry the read before approving it.",
    );
  }
}

export function captureReviewedDeliverableVersion(
  version: number,
  row: { id?: unknown; content?: unknown; structured_data?: unknown },
  includeCurrentPlan = false,
): ReviewedDeliverableVersion {
  const metadata = row.structured_data as Record<string, unknown> | null;
  const binding = metadata?.p5MeasurementContractPlan;
  const planHash = (binding as Record<string, unknown> | null)?.planHash;
  return {
    version,
    versionId: typeof row.id === "string" ? row.id : null,
    contentHash: p5Hash(row.content ?? null),
    planBindingHash: binding ? p5Hash(binding) : null,
    planHash:
      includeCurrentPlan && typeof planHash === "string" ? planHash : null,
  };
}
