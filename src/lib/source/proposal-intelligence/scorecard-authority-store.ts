import { getAzureReadFluentClient } from "@/lib/data-plane/postgresCompat";
import type {
  ScorecardAuthorityCriterionRecord,
  ScorecardAuthorityScoreRecord,
} from "./scorecard-authority";

export type SourceScorecardAuthorityRecordsResult =
  | {
      kind: "available";
      criteria: ScorecardAuthorityCriterionRecord[];
      scores: ScorecardAuthorityScoreRecord[];
    }
  | { kind: "unavailable" };

function requiredText(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function optionalText(value: unknown): string | null | undefined {
  return value === null ? null : (requiredText(value) ?? undefined);
}

function record(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function finiteDecimal(value: unknown): number | null {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value !== "string" || !/^-?\d+(?:\.\d+)?$/.test(value)) {
    return null;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function criterionFromRow(
  value: unknown,
  eventId: string,
  clientKey: string,
): ScorecardAuthorityCriterionRecord | null {
  const row = record(value);
  if (!row || row.event_id !== eventId || row.client_key !== clientKey)
    return null;
  const criterionId = requiredText(row.criterion_id);
  const criterionVersion = requiredText(row.criterion_version);
  const label = requiredText(row.label);
  const approvedCriterionVersion = optionalText(row.approved_criterion_version);
  const approvedBy = optionalText(row.approved_by);
  const approvedAt = optionalText(row.approved_at);
  const weight = finiteDecimal(row.weight);
  if (
    !criterionId ||
    !criterionVersion ||
    !label ||
    weight === null ||
    typeof row.weights_frozen !== "boolean" ||
    approvedCriterionVersion === undefined ||
    approvedBy === undefined ||
    approvedAt === undefined
  )
    return null;
  return {
    tenantKey: clientKey,
    sourceEventId: eventId,
    criterionId,
    criterionVersion,
    label,
    weight,
    weightsFrozen: row.weights_frozen,
    approvedCriterionVersion,
    approvedBy,
    approvedAt,
  };
}

function scoreFromRow(
  value: unknown,
  eventId: string,
  clientKey: string,
): ScorecardAuthorityScoreRecord | null {
  const row = record(value);
  if (!row || row.event_id !== eventId || row.client_key !== clientKey)
    return null;
  const vendorId = requiredText(row.vendor_id);
  const vendorName = requiredText(row.vendor_name);
  const criterionId = requiredText(row.criterion_id);
  const criterionVersion = requiredText(row.criterion_version);
  const evaluatorId = optionalText(row.evaluator_id);
  const evaluatorName = optionalText(row.evaluator_name);
  const evidenceReference = optionalText(row.evidence_reference);
  const overrideReason = optionalText(row.override_reason);
  const lockedBy = optionalText(row.locked_by);
  const lockedAt = optionalText(row.locked_at);
  const evaluatorScore =
    row.evaluator_score === null ? null : finiteDecimal(row.evaluator_score);
  if (
    !vendorId ||
    !vendorName ||
    !criterionId ||
    !criterionVersion ||
    evaluatorId === undefined ||
    evaluatorName === undefined ||
    evidenceReference === undefined ||
    overrideReason === undefined ||
    lockedBy === undefined ||
    lockedAt === undefined ||
    (row.evaluator_score !== null && evaluatorScore === null) ||
    typeof row.override_reason_required !== "boolean" ||
    (row.lock_state !== "locked" && row.lock_state !== "unlocked")
  )
    return null;
  return {
    tenantKey: clientKey,
    sourceEventId: eventId,
    vendorId,
    vendorName,
    criterionId,
    criterionVersion,
    evaluatorId,
    evaluatorName,
    evaluatorScore,
    evidenceReference,
    overrideReason,
    overrideReasonRequired: row.override_reason_required,
    lockState: row.lock_state,
    lockedBy,
    lockedAt,
  };
}

export async function readSourceScorecardAuthorityRecords(
  eventId: string,
  clientKey: string,
): Promise<SourceScorecardAuthorityRecordsResult> {
  if (!requiredText(eventId) || !requiredText(clientKey)) {
    return { kind: "unavailable" };
  }
  try {
    const client = getAzureReadFluentClient();
    const [criteriaResult, scoresResult] = await Promise.all([
      client
        .from("source_scorecard_criteria")
        .select(
          "client_key,event_id,criterion_id,criterion_version,label,weight,weights_frozen,approved_criterion_version,approved_by,approved_at",
        )
        .eq("event_id", eventId)
        .eq("client_key", clientKey)
        .is("superseded_at", null),
      client
        .from("source_scorecard_scores")
        .select(
          "client_key,event_id,vendor_id,vendor_name,criterion_id,criterion_version,evaluator_id,evaluator_name,evaluator_score,evidence_reference,override_reason,override_reason_required,lock_state,locked_by,locked_at",
        )
        .eq("event_id", eventId)
        .eq("client_key", clientKey)
        .is("superseded_at", null),
    ]);
    if (
      criteriaResult.error ||
      scoresResult.error ||
      !Array.isArray(criteriaResult.data) ||
      !Array.isArray(scoresResult.data)
    )
      return { kind: "unavailable" };
    const criteria = criteriaResult.data.map((row) =>
      criterionFromRow(row, eventId, clientKey),
    );
    const scores = scoresResult.data.map((row) =>
      scoreFromRow(row, eventId, clientKey),
    );
    if (criteria.some((row) => !row) || scores.some((row) => !row)) {
      return { kind: "unavailable" };
    }
    return {
      kind: "available",
      criteria: criteria as ScorecardAuthorityCriterionRecord[],
      scores: scores as ScorecardAuthorityScoreRecord[],
    };
  } catch {
    return { kind: "unavailable" };
  }
}
