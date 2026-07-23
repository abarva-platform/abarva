import type { PostgresCompatClient as SupabaseClient } from "@/lib/data-plane/postgresCompat";

export type DeliverableLifecycleState =
  | "ai_draft"
  | "in_review"
  | "changes_requested"
  | "human_approved"
  | "client_final"
  | "superseded";

export type LifecycleGateState = "human_approved" | "client_final";

export type DeliverableVersionOrigin =
  | "ai_generated"
  | "client_uploaded"
  | "abarva_uploaded"
  | "system_extract";

export type DeliverableLifecycleEventType =
  | "version_created"
  | "submitted_for_review"
  | "review_assigned"
  | "comment_added"
  | "changes_requested"
  | "approval_granted"
  | "approval_revoked"
  | "marked_authoritative"
  | "authority_replaced"
  | "superseded";

export type ReviewerRoleCode =
  | "artifact_owner"
  | "workstream_lead"
  | "business_owner"
  | "technology_owner"
  | "architecture"
  | "data"
  | "security"
  | "risk"
  | "legal"
  | "compliance"
  | "procurement"
  | "finance"
  | "executive_sponsor"
  | "client_authority"
  | "abarva_quality"
  | "other";

export interface DeliverableLifecycleEventInput {
  deliverableId: string;
  version: number;
  workflowRunId?: string | null;
  eventType: DeliverableLifecycleEventType;
  origin?: DeliverableVersionOrigin | null;
  reviewerRoleCode?: ReviewerRoleCode | null;
  reviewerRoleLabel?: string | null;
  reviewerName?: string | null;
  reviewerOrganization?: string | null;
  approvalScope?: string | null;
  decision?: string | null;
  comments?: string | null;
  requestedRevisions?: string | null;
  sourceFileChecksum?: string | null;
  exceptionFlag?: boolean;
  exceptionBasis?: string | null;
  relatedVersion?: number | null;
  backfill?: boolean;
  decidedAt?: string | null;
}

export interface LifecycleEventProjectionRow {
  event_type: DeliverableLifecycleEventType;
  origin: DeliverableVersionOrigin | null;
  decision: string | null;
  exception_flag: boolean | null;
  source_file_checksum: string | null;
  created_at: string | null;
}

export interface AuthoritativeVersion {
  version: number;
  lifecycleCurrentState: LifecycleGateState;
  authoritativeFlagSource:
    | "normal_flow"
    | "upload_as_approved_final_exception"
    | "legacy_backfill";
  checksum: string | null;
  requiresRevalidation: boolean;
}

function normalizeMarkedState(decision: string | null): LifecycleGateState {
  return decision === "client_final" ? "client_final" : "human_approved";
}

export function projectLifecycleState(
  events: LifecycleEventProjectionRow[],
): DeliverableLifecycleState | null {
  let state: DeliverableLifecycleState | null = null;
  for (const event of events) {
    switch (event.event_type) {
      case "version_created":
        state = event.origin === "ai_generated" ? "ai_draft" : "in_review";
        break;
      case "submitted_for_review":
      case "review_assigned":
      case "comment_added":
        if (state !== "superseded") state = "in_review";
        break;
      case "changes_requested":
        if (state !== "superseded") state = "changes_requested";
        break;
      case "approval_granted":
        if (state !== "superseded") state = "human_approved";
        break;
      case "marked_authoritative":
        if (state !== "superseded") state = normalizeMarkedState(event.decision);
        break;
      case "approval_revoked":
        if (state !== "superseded") state = "in_review";
        break;
      case "authority_replaced":
      case "superseded":
        state = "superseded";
        break;
      default:
        break;
    }
  }
  return state;
}

export function assertValidLifecycleTransition(
  current: DeliverableLifecycleState | null,
  event: Pick<
    DeliverableLifecycleEventInput,
    "eventType" | "origin" | "decision" | "exceptionFlag"
  >,
): DeliverableLifecycleState {
  if (current === "superseded") {
    throw new Error("invalid_lifecycle_transition:superseded_terminal");
  }
  if (event.eventType === "version_created") {
    if (current !== null) throw new Error("invalid_lifecycle_transition:duplicate_version_created");
    if (!event.origin) throw new Error("invalid_lifecycle_transition:missing_origin");
    return event.origin === "ai_generated" ? "ai_draft" : "in_review";
  }
  if (current === null) {
    if (
      event.eventType === "marked_authoritative" &&
      event.origin === "client_uploaded" &&
      event.decision === "client_final" &&
      event.exceptionFlag === true
    ) {
      return "client_final";
    }
    throw new Error("invalid_lifecycle_transition:missing_version_created");
  }
  if (event.eventType === "submitted_for_review" && current === "ai_draft") return "in_review";
  if (event.eventType === "changes_requested" && current === "in_review") return "changes_requested";
  if (event.eventType === "approval_granted" && current === "in_review") return "human_approved";
  if (
    event.eventType === "marked_authoritative" &&
    current === "human_approved" &&
    event.decision === "client_final"
  ) {
    return "client_final";
  }
  if (
    event.eventType === "marked_authoritative" &&
    current === "human_approved" &&
    event.decision === "human_approved"
  ) {
    return "human_approved";
  }
  if (
    event.eventType === "approval_revoked" &&
    (current === "human_approved" || current === "client_final")
  ) {
    return "in_review";
  }
  if (
    (event.eventType === "authority_replaced" || event.eventType === "superseded") &&
    (current === "human_approved" || current === "client_final")
  ) {
    return "superseded";
  }
  throw new Error(`invalid_lifecycle_transition:${current}_to_${event.eventType}`);
}

export async function appendDeliverableLifecycleEvent(
  sb: SupabaseClient,
  input: DeliverableLifecycleEventInput,
): Promise<void> {
  const { error } = await sb.from("deliverable_lifecycle_events").insert({
    deliverable_id: input.deliverableId,
    version: input.version,
    workflow_run_id: input.workflowRunId ?? null,
    event_type: input.eventType,
    origin: input.origin ?? null,
    reviewer_role_code: input.reviewerRoleCode ?? null,
    reviewer_role_label: input.reviewerRoleLabel ?? null,
    reviewer_name: input.reviewerName ?? null,
    reviewer_organization: input.reviewerOrganization ?? null,
    approval_scope: input.approvalScope ?? null,
    decision: input.decision ?? null,
    comments: input.comments ?? null,
    requested_revisions: input.requestedRevisions ?? null,
    source_file_checksum: input.sourceFileChecksum ?? null,
    exception_flag: input.exceptionFlag ?? false,
    exception_basis: input.exceptionBasis ?? null,
    related_version: input.relatedVersion ?? null,
    backfill: input.backfill ?? false,
    decided_at: input.decidedAt ?? null,
  });
  if (error) throw error;
}

async function readLifecycleEvents(
  sb: SupabaseClient,
  deliverableId: string,
  version: number,
): Promise<LifecycleEventProjectionRow[]> {
  const { data, error } = await sb
    .from("deliverable_lifecycle_events")
    .select("event_type, origin, decision, exception_flag, source_file_checksum, created_at")
    .eq("deliverable_id", deliverableId)
    .eq("version", version)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as LifecycleEventProjectionRow[];
}

export async function getAuthoritativeVersion(
  sb: SupabaseClient,
  deliverableId: string,
): Promise<AuthoritativeVersion | null> {
  const { data: deliverable, error: deliverableError } = await sb
    .from("deliverables_v2")
    .select(
      "signed_off_version, authoritative_lifecycle_state, authoritative_flag_source, approved_artifact_id, requires_revalidation",
    )
    .eq("id", deliverableId)
    .maybeSingle();
  if (deliverableError) throw deliverableError;
  if (!deliverable) return null;

  const pointer = deliverable as {
    signed_off_version: number | null;
    authoritative_lifecycle_state: LifecycleGateState | null;
    authoritative_flag_source: AuthoritativeVersion["authoritativeFlagSource"] | null;
    approved_artifact_id: string | null;
    requires_revalidation: boolean | null;
  };
  if (
    !pointer.signed_off_version ||
    !pointer.authoritative_lifecycle_state ||
    !pointer.authoritative_flag_source
  ) {
    return null;
  }

  const events = await readLifecycleEvents(sb, deliverableId, pointer.signed_off_version);
  const projected = projectLifecycleState(events);
  if (projected !== pointer.authoritative_lifecycle_state) return null;

  const checksum =
    events
      .slice()
      .reverse()
      .find((event) => Boolean(event.source_file_checksum))
      ?.source_file_checksum ?? null;

  return {
    version: pointer.signed_off_version,
    lifecycleCurrentState: pointer.authoritative_lifecycle_state,
    authoritativeFlagSource: pointer.authoritative_flag_source,
    checksum,
    requiresRevalidation: Boolean(pointer.requires_revalidation),
  };
}
