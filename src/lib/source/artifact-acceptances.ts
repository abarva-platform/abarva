import "server-only";

// Repository for source_artifact_acceptances — the explicit, auditable
// "accept this artifact as authoritative" action (SOURCE-SHELL-004),
// distinct from the stage gate (approval-ledger.ts / source_event_approvals).
// Append-only: this module never updates or deletes a row. The current
// acceptance for an artifact is always the latest row by accepted_at.

import {
  getAzureReadFluentClient,
  getAzureWriteFluentClient,
} from "@/lib/data-plane/postgresCompat";
import type { SourceArtifactGovernanceStage } from "./artifact-governance";

export type ArtifactAcceptanceRole = "authoritative" | "evidence";
export type ArtifactContentDriftStatus = "current" | "stale" | "unknown";
export type ArtifactGatePreconditionStatus = "not_ready" | "ready" | "waived";
export type ArtifactDownstreamContextPolicy =
  | "include"
  | "exclude"
  | "restricted";

export interface ArtifactAcceptanceRecord {
  id: string;
  artifactId: string;
  eventId: string;
  stageKey: string;
  artifactState: SourceArtifactGovernanceStage;
  authoritativeVersionId: string;
  artifactRole: ArtifactAcceptanceRole;
  contentDriftStatus: ArtifactContentDriftStatus;
  gatePreconditionStatus: ArtifactGatePreconditionStatus;
  downstreamContextPolicy: ArtifactDownstreamContextPolicy;
  diffSummary: string | null;
  approvalRationale: string;
  acceptedBy: string;
  acceptedAt: string;
  createdAt: string;
}

interface ArtifactAcceptanceRow {
  id: string;
  artifact_id: string;
  event_id: string;
  stage_key: string;
  artifact_state: string;
  authoritative_version_id: string;
  artifact_role: string;
  content_drift_status: string;
  gate_precondition_status: string;
  downstream_context_policy: string;
  diff_summary: string | null;
  approval_rationale: string;
  accepted_by: string;
  accepted_at: string;
  created_at: string;
}

function rowToRecord(row: ArtifactAcceptanceRow): ArtifactAcceptanceRecord {
  return {
    id: row.id,
    artifactId: row.artifact_id,
    eventId: row.event_id,
    stageKey: row.stage_key,
    artifactState: row.artifact_state as SourceArtifactGovernanceStage,
    authoritativeVersionId: row.authoritative_version_id,
    artifactRole: row.artifact_role as ArtifactAcceptanceRole,
    contentDriftStatus: row.content_drift_status as ArtifactContentDriftStatus,
    gatePreconditionStatus:
      row.gate_precondition_status as ArtifactGatePreconditionStatus,
    downstreamContextPolicy:
      row.downstream_context_policy as ArtifactDownstreamContextPolicy,
    diffSummary: row.diff_summary,
    approvalRationale: row.approval_rationale,
    acceptedBy: row.accepted_by,
    acceptedAt: row.accepted_at,
    createdAt: row.created_at,
  };
}

const ACCEPTANCE_COLUMNS =
  "id, artifact_id, event_id, stage_key, artifact_state, authoritative_version_id, " +
  "artifact_role, content_drift_status, gate_precondition_status, " +
  "downstream_context_policy, diff_summary, approval_rationale, accepted_by, " +
  "accepted_at, created_at";

export interface InsertArtifactAcceptanceInput {
  artifactId: string;
  eventId: string;
  stageKey: string;
  artifactState: SourceArtifactGovernanceStage;
  authoritativeVersionId: string;
  artifactRole: ArtifactAcceptanceRole;
  contentDriftStatus: ArtifactContentDriftStatus;
  gatePreconditionStatus: ArtifactGatePreconditionStatus;
  downstreamContextPolicy: ArtifactDownstreamContextPolicy;
  diffSummary?: string | null;
  approvalRationale: string;
  acceptedBy: string;
}

/** Insert one acceptance record. Never updates an existing row — append-only. */
export async function insertArtifactAcceptance(
  input: InsertArtifactAcceptanceInput,
  db = getAzureWriteFluentClient(),
): Promise<
  { ok: true; record: ArtifactAcceptanceRecord } | { ok: false; error: string }
> {
  const { data, error } = await db
    .from("source_artifact_acceptances")
    .insert({
      artifact_id: input.artifactId,
      event_id: input.eventId,
      stage_key: input.stageKey,
      artifact_state: input.artifactState,
      authoritative_version_id: input.authoritativeVersionId,
      artifact_role: input.artifactRole,
      content_drift_status: input.contentDriftStatus,
      gate_precondition_status: input.gatePreconditionStatus,
      downstream_context_policy: input.downstreamContextPolicy,
      diff_summary: input.diffSummary ?? null,
      approval_rationale: input.approvalRationale,
      accepted_by: input.acceptedBy,
    })
    .select(ACCEPTANCE_COLUMNS)
    .single<ArtifactAcceptanceRow>();

  if (error || !data) {
    return { ok: false, error: error?.message ?? "insert_failed" };
  }
  return { ok: true, record: rowToRecord(data) };
}

/** All acceptance records for one artifact, latest first. */
export async function listArtifactAcceptances(
  artifactId: string,
  db = getAzureReadFluentClient(),
): Promise<ArtifactAcceptanceRecord[]> {
  const { data, error } = await db
    .from("source_artifact_acceptances")
    .select(ACCEPTANCE_COLUMNS)
    .eq("artifact_id", artifactId)
    .order("accepted_at", { ascending: false });

  if (error || !Array.isArray(data)) return [];
  return (data as ArtifactAcceptanceRow[]).map(rowToRecord);
}

/** The current (latest) acceptance record for an artifact, or null if never accepted. */
export async function getLatestArtifactAcceptance(
  artifactId: string,
  db = getAzureReadFluentClient(),
): Promise<ArtifactAcceptanceRecord | null> {
  const { data, error } = await db
    .from("source_artifact_acceptances")
    .select(ACCEPTANCE_COLUMNS)
    .eq("artifact_id", artifactId)
    .order("accepted_at", { ascending: false })
    .limit(1)
    .maybeSingle<ArtifactAcceptanceRow>();

  if (error || !data) return null;
  return rowToRecord(data);
}

/**
 * The latest acceptance for each of several artifacts in one query —
 * avoids N+1 lookups when rendering a File Cabinet list. Returns a map keyed
 * by artifactId; artifacts with no acceptance are simply absent from the map.
 */
export async function getLatestArtifactAcceptancesByArtifactIds(
  artifactIds: readonly string[],
  db = getAzureReadFluentClient(),
): Promise<Map<string, ArtifactAcceptanceRecord>> {
  const result = new Map<string, ArtifactAcceptanceRecord>();
  if (artifactIds.length === 0) return result;

  const { data, error } = await db
    .from("source_artifact_acceptances")
    .select(ACCEPTANCE_COLUMNS)
    .in("artifact_id", Array.from(new Set(artifactIds)))
    .order("accepted_at", { ascending: false });

  if (error || !Array.isArray(data)) return result;
  for (const row of data as ArtifactAcceptanceRow[]) {
    // Rows arrive latest-first; keep only the first (latest) per artifact_id.
    if (!result.has(row.artifact_id)) {
      result.set(row.artifact_id, rowToRecord(row));
    }
  }
  return result;
}
