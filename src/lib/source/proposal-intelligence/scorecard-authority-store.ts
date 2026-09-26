import {
  getAzureReadFluentClient,
  getAzureWriteFluentClient,
} from "@/lib/data-plane/postgresCompat";
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

function optionalTimestamp(value: unknown): string | null | undefined {
  if (value instanceof Date) {
    return Number.isFinite(value.getTime()) ? value.toISOString() : undefined;
  }
  return optionalText(value);
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
  const approvedAt = optionalTimestamp(row.approved_at);
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
  const lockedAt = optionalTimestamp(row.locked_at);
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

export type ScorecardWriteResult =
  | { ok: true }
  | {
      ok: false;
      code:
        | "authority_unavailable"
        | "criteria_frozen"
        | "criterion_not_current"
        | "criterion_not_approved"
        | "weights_not_100"
        | "evaluator_score_missing"
        | "evidence_not_approved"
        | "score_locked"
        | "invalid_input"
        | "write_failed";
    };

type CriterionRef = {
  clientKey: string;
  eventId: string;
  criterionId: string;
  criterionVersion: string;
};

type NamedActor = { actorId: string; actorName: string };

function validRef(input: CriterionRef): boolean {
  return Boolean(
    requiredText(input.clientKey) &&
      requiredText(input.eventId) &&
      requiredText(input.criterionId) &&
      requiredText(input.criterionVersion),
  );
}

function currentCriterion(
  criteria: readonly ScorecardAuthorityCriterionRecord[],
  input: CriterionRef,
): ScorecardAuthorityCriterionRecord | null {
  return (
    criteria.find(
      (row) =>
        row.criterionId === input.criterionId &&
        row.criterionVersion === input.criterionVersion,
    ) ?? null
  );
}

function approvedCriterion(
  criteria: readonly ScorecardAuthorityCriterionRecord[],
  input: CriterionRef,
): boolean {
  const criterion = currentCriterion(criteria, input);
  return Boolean(
    criterion?.weightsFrozen &&
      criterion.approvedCriterionVersion === input.criterionVersion &&
      criterion.approvedBy?.trim() &&
      criterion.approvedAt?.trim(),
  );
}

function wroteExactlyOne(result: { data: unknown; error: unknown }): boolean {
  return !result.error && Array.isArray(result.data) && result.data.length === 1;
}

export async function createScorecardCriterion(
  input: CriterionRef & { label: string; weight: number },
): Promise<ScorecardWriteResult> {
  if (
    !validRef(input) ||
    !requiredText(input.label) ||
    !Number.isFinite(input.weight) ||
    input.weight <= 0 ||
    input.weight > 100
  ) {
    return { ok: false, code: "invalid_input" };
  }
  const records = await readSourceScorecardAuthorityRecords(
    input.eventId,
    input.clientKey,
  );
  if (records.kind === "unavailable") {
    return { ok: false, code: "authority_unavailable" };
  }
  if (records.criteria.some((row) => row.approvedAt || row.weightsFrozen)) {
    return { ok: false, code: "criteria_frozen" };
  }
  const existing = records.criteria.find((row) => row.criterionId === input.criterionId);
  if (existing && existing.criterionVersion !== input.criterionVersion) {
    return { ok: false, code: "criterion_not_current" };
  }
  try {
    const db = getAzureWriteFluentClient();
    const result = existing
      ? await db
          .from("source_scorecard_criteria")
          .update({ label: input.label.trim(), weight: input.weight })
          .eq("client_key", input.clientKey)
          .eq("event_id", input.eventId)
          .eq("criterion_id", input.criterionId)
          .eq("criterion_version", input.criterionVersion)
          .is("approved_at", null)
          .is("superseded_at", null)
          .select("id")
      : await db
          .from("source_scorecard_criteria")
          .insert({
            client_key: input.clientKey,
            event_id: input.eventId,
            criterion_id: input.criterionId,
            criterion_version: input.criterionVersion,
            label: input.label.trim(),
            weight: input.weight,
            weights_frozen: false,
            approved_criterion_version: null,
            approved_by: null,
            approved_at: null,
          })
          .select("id");
    return wroteExactlyOne(result)
      ? { ok: true }
      : { ok: false, code: "write_failed" };
  } catch {
    return { ok: false, code: "write_failed" };
  }
}

export async function retireDraftCriterion(
  input: CriterionRef,
): Promise<ScorecardWriteResult> {
  if (!validRef(input)) return { ok: false, code: "invalid_input" };
  const records = await readSourceScorecardAuthorityRecords(input.eventId, input.clientKey);
  if (records.kind === "unavailable") {
    return { ok: false, code: "authority_unavailable" };
  }
  if (records.criteria.some((row) => row.approvedAt || row.weightsFrozen)) {
    return { ok: false, code: "criteria_frozen" };
  }
  if (!currentCriterion(records.criteria, input)) {
    return { ok: false, code: "criterion_not_current" };
  }
  try {
    const result = await getAzureWriteFluentClient()
      .from("source_scorecard_criteria")
      .update({ superseded_at: new Date().toISOString() })
      .eq("client_key", input.clientKey)
      .eq("event_id", input.eventId)
      .eq("criterion_id", input.criterionId)
      .eq("criterion_version", input.criterionVersion)
      .is("approved_at", null)
      .is("superseded_at", null)
      .select("id");
    return wroteExactlyOne(result)
      ? { ok: true }
      : { ok: false, code: "write_failed" };
  } catch {
    return { ok: false, code: "write_failed" };
  }
}

export async function approveScorecardCriterion(
  input: CriterionRef & NamedActor,
): Promise<ScorecardWriteResult> {
  if (!validRef(input) || !requiredText(input.actorId) || !requiredText(input.actorName)) {
    return { ok: false, code: "invalid_input" };
  }
  const records = await readSourceScorecardAuthorityRecords(input.eventId, input.clientKey);
  if (records.kind === "unavailable") {
    return { ok: false, code: "authority_unavailable" };
  }
  const criterion = currentCriterion(records.criteria, input);
  if (!criterion || criterion.approvedAt) {
    return { ok: false, code: "criterion_not_current" };
  }
  const weightTotal = records.criteria.reduce((total, row) => total + row.weight, 0);
  if (Math.abs(weightTotal - 100) > 0.0001) {
    return { ok: false, code: "weights_not_100" };
  }
  try {
    const result = await getAzureWriteFluentClient()
      .from("source_scorecard_criteria")
      .update({
        weights_frozen: true,
        approved_criterion_version: input.criterionVersion,
        approved_by: input.actorId.trim(),
        approved_at: new Date().toISOString(),
      })
      .eq("client_key", input.clientKey)
      .eq("event_id", input.eventId)
      .eq("criterion_id", input.criterionId)
      .eq("criterion_version", input.criterionVersion)
      .is("approved_at", null)
      .is("superseded_at", null)
      .select("id");
    return wroteExactlyOne(result)
      ? { ok: true }
      : { ok: false, code: "write_failed" };
  } catch {
    return { ok: false, code: "write_failed" };
  }
}

export async function recordEvaluatorScore(
  input: CriterionRef & NamedActor & {
    vendorId: string;
    vendorName: string;
    score: number;
    evidenceReference: string;
    overrideReason: string | null;
  },
): Promise<ScorecardWriteResult> {
  if (
    !validRef(input) ||
    !requiredText(input.actorId) ||
    !requiredText(input.actorName) ||
    !requiredText(input.vendorId) ||
    !requiredText(input.vendorName) ||
    !requiredText(input.evidenceReference) ||
    !Number.isFinite(input.score) ||
    input.score < 0 ||
    input.score > 10
  ) {
    return { ok: false, code: "invalid_input" };
  }
  const records = await readSourceScorecardAuthorityRecords(input.eventId, input.clientKey);
  if (records.kind === "unavailable") {
    return { ok: false, code: "authority_unavailable" };
  }
  if (!approvedCriterion(records.criteria, input)) {
    return { ok: false, code: "criterion_not_approved" };
  }
  const existing = records.scores.find(
    (row) =>
      row.vendorId === input.vendorId &&
      row.criterionId === input.criterionId &&
      row.evaluatorId === input.actorId,
  );
  if (existing?.lockState === "locked") {
    return { ok: false, code: "score_locked" };
  }
  try {
    const db = getAzureWriteFluentClient();
    const values = {
      vendor_name: input.vendorName.trim(),
      evaluator_name: input.actorName.trim(),
      evaluator_score: input.score,
      evidence_reference: input.evidenceReference.trim(),
      override_reason: requiredText(input.overrideReason),
      override_reason_required: false,
    };
    const result = existing
      ? await db
          .from("source_scorecard_scores")
          .update(values)
          .eq("client_key", input.clientKey)
          .eq("event_id", input.eventId)
          .eq("vendor_id", input.vendorId)
          .eq("criterion_id", input.criterionId)
          .eq("criterion_version", input.criterionVersion)
          .eq("evaluator_id", input.actorId)
          .eq("lock_state", "unlocked")
          .is("superseded_at", null)
          .select("id")
      : await db
          .from("source_scorecard_scores")
          .insert({
            ...values,
            client_key: input.clientKey,
            event_id: input.eventId,
            vendor_id: input.vendorId,
            criterion_id: input.criterionId,
            criterion_version: input.criterionVersion,
            evaluator_id: input.actorId.trim(),
            lock_state: "unlocked",
          })
          .select("id");
    return wroteExactlyOne(result)
      ? { ok: true }
      : { ok: false, code: "write_failed" };
  } catch {
    return { ok: false, code: "write_failed" };
  }
}

export async function lockEvaluatorScore(
  input: CriterionRef & NamedActor & { vendorId: string },
): Promise<ScorecardWriteResult> {
  if (
    !validRef(input) ||
    !requiredText(input.actorId) ||
    !requiredText(input.actorName) ||
    !requiredText(input.vendorId)
  ) {
    return { ok: false, code: "invalid_input" };
  }
  const records = await readSourceScorecardAuthorityRecords(input.eventId, input.clientKey);
  if (records.kind === "unavailable") {
    return { ok: false, code: "authority_unavailable" };
  }
  if (!approvedCriterion(records.criteria, input)) {
    return { ok: false, code: "criterion_not_approved" };
  }
  const score = records.scores.find(
    (row) =>
      row.vendorId === input.vendorId &&
      row.criterionId === input.criterionId &&
      row.criterionVersion === input.criterionVersion &&
      row.evaluatorId === input.actorId,
  );
  if (!score) return { ok: false, code: "evaluator_score_missing" };
  if (score.lockState === "locked") return { ok: false, code: "score_locked" };
  if (
    score.evaluatorScore === null ||
    !requiredText(score.evidenceReference) ||
    (score.overrideReasonRequired && !requiredText(score.overrideReason))
  ) {
    return { ok: false, code: "evaluator_score_missing" };
  }
  const evidenceId = score.evidenceReference?.trim() ?? "";
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(evidenceId)) {
    return { ok: false, code: "evidence_not_approved" };
  }
  try {
    const evidenceResult = await getAzureReadFluentClient()
      .from("source_artifacts")
      .select("id,tenant_key,source_event_id,status,lifecycle_state,blob_sha256,sha256")
      .eq("id", evidenceId)
      .eq("tenant_key", input.clientKey)
      .eq("source_event_id", input.eventId)
      .eq("status", "approved")
      .eq("lifecycle_state", "current")
      .is("deleted_at", null);
    if (evidenceResult.error || !Array.isArray(evidenceResult.data)) {
      return { ok: false, code: "authority_unavailable" };
    }
    const evidence = evidenceResult.data.length === 1
      ? record(evidenceResult.data[0])
      : null;
    if (
      evidence?.id !== evidenceId ||
      evidence.tenant_key !== input.clientKey ||
      evidence.source_event_id !== input.eventId ||
      evidence.status !== "approved" ||
      evidence.lifecycle_state !== "current" ||
      !/^[0-9a-f]{64}$/i.test(
        typeof evidence.blob_sha256 === "string"
          ? evidence.blob_sha256
          : typeof evidence.sha256 === "string"
            ? evidence.sha256
            : "",
      )
    ) {
      return { ok: false, code: "evidence_not_approved" };
    }
  } catch {
    return { ok: false, code: "authority_unavailable" };
  }
  try {
    const result = await getAzureWriteFluentClient()
      .from("source_scorecard_scores")
      .update({
        lock_state: "locked",
        locked_by: input.actorName.trim(),
        locked_at: new Date().toISOString(),
      })
      .eq("client_key", input.clientKey)
      .eq("event_id", input.eventId)
      .eq("vendor_id", input.vendorId)
      .eq("criterion_id", input.criterionId)
      .eq("criterion_version", input.criterionVersion)
      .eq("evaluator_id", input.actorId)
      .eq("lock_state", "unlocked")
      .is("superseded_at", null)
      .select("id");
    return wroteExactlyOne(result)
      ? { ok: true }
      : { ok: false, code: "write_failed" };
  } catch {
    return { ok: false, code: "write_failed" };
  }
}
