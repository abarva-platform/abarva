import "server-only";

import { getAzureWriteFluentClient } from "@/lib/data-plane/postgresCompat";
import {
  acknowledgementNotes,
  configuredSponsorDelegationSigningKey,
  noticeNotes,
  verifiedDelegatedSponsorAcknowledgement,
  type SponsorDelegationApprovalRow,
} from "./sponsor-delegation";
import { soleSponsorApprovalParticipant, type ApprovalParticipant } from "./notifications/approval-recipient-policy";

export interface ScopeArtifactVersion {
  id: string;
  sha256: string;
}

export async function readCurrentScopeArtifactVersion(
  eventId: string,
  tenantKey: string,
): Promise<ScopeArtifactVersion | null> {
  const db = getAzureWriteFluentClient();
  const { data: state, error: stateError } = await db
    .from("source_event_artifact_states")
    .select("id, status, linked_artifact_id")
    .eq("source_event_id", eventId)
    .eq("tenant_key", tenantKey)
    .eq("stage_key", "scope")
    .eq("artifact_code", "d05_scope_memo")
    .maybeSingle();
  if (stateError) throw stateError;
  if (!state || !["approved", "locked"].includes(state.status) || !state.linked_artifact_id) {
    return null;
  }
  const { data: artifact, error: artifactError } = await db
    .from("source_artifacts")
    .select("id, blob_sha256, sha256")
    .eq("id", state.linked_artifact_id)
    .eq("source_event_id", eventId)
    .eq("tenant_key", tenantKey)
    .maybeSingle();
  if (artifactError) throw artifactError;
  const digest = artifact?.blob_sha256 || artifact?.sha256;
  if (!artifact || typeof digest !== "string" || !/^[a-f0-9]{64}$/i.test(digest)) return null;
  return { id: artifact.id, sha256: digest.toLowerCase() };
}

export async function readAssignedSponsorUserId(
  eventId: string,
  tenantKey: string,
): Promise<string | null> {
  const { data, error } = await getAzureWriteFluentClient()
    .from("source_event_participants")
    .select("user_id, role, approval_authority, can_approve_source_stages")
    .eq("source_event_id", eventId)
    .eq("client_key", tenantKey);
  if (error) throw error;
  return soleSponsorApprovalParticipant((data ?? []) as ApprovalParticipant[])?.user_id ?? null;
}

export async function isAssignedSponsorDelegate(
  eventId: string,
  tenantKey: string,
  actorUserIds: readonly string[],
): Promise<boolean> {
  const identities = [...new Set(actorUserIds.map((id) => id.trim()).filter(Boolean))];
  if (identities.length === 0) return false;
  const { data, error } = await getAzureWriteFluentClient()
    .from("source_event_participants")
    .select("user_id, role, can_approve_source_stages")
    .eq("source_event_id", eventId)
    .eq("client_key", tenantKey)
    .in("user_id", identities);
  if (error) throw error;
  return (data ?? []).some((row) =>
    row.role?.trim().toLowerCase() === "sponsor_delegate" &&
    row.can_approve_source_stages === true,
  );
}

export async function readSponsorDelegationReceipts(
  eventId: string,
): Promise<SponsorDelegationApprovalRow[]> {
  const { data, error } = await getAzureWriteFluentClient()
    .from("source_event_approvals")
    .select("id, event_id, action, approved_by_user_id, from_state, to_state, stage_key, notes")
    .eq("event_id", eventId)
    .eq("stage_key", "scope")
    .in("action", ["sponsor_delegate_acknowledgement", "sponsor_delegate_notice"]);
  if (error) throw error;
  return (data ?? []) as SponsorDelegationApprovalRow[];
}

export async function hasVerifiedSponsorDelegation(input: {
  eventId: string;
  tenantKey: string;
}): Promise<boolean> {
  const signingKey = configuredSponsorDelegationSigningKey();
  if (!signingKey) return false;
  const [sponsorUserId, scopeArtifact] = await Promise.all([
    readAssignedSponsorUserId(input.eventId, input.tenantKey),
    readCurrentScopeArtifactVersion(input.eventId, input.tenantKey),
  ]);
  if (!sponsorUserId || !scopeArtifact) return false;
  return verifiedDelegatedSponsorAcknowledgement(
    await readSponsorDelegationReceipts(input.eventId),
    {
      eventId: input.eventId,
      sponsorUserId,
      scopeArtifactId: scopeArtifact.id,
      scopeArtifactSha256: scopeArtifact.sha256,
    },
    signingKey,
  );
}

export async function appendSponsorDelegationAcknowledgement(input: {
  eventId: string;
  actorUserId: string;
  sponsorUserId: string;
  scopeArtifact: ScopeArtifactVersion;
}): Promise<string> {
  const signingKey = configuredSponsorDelegationSigningKey();
  if (!signingKey) throw new Error("sponsor_delegation_signing_key_required");
  const { data, error } = await getAzureWriteFluentClient()
    .from("source_event_approvals")
    .insert({
      event_id: input.eventId,
      action: "sponsor_delegate_acknowledgement",
      approved_by_user_id: input.actorUserId,
      from_state: null,
      to_state: "attested",
      stage_key: "scope",
      notes: acknowledgementNotes({
        eventId: input.eventId,
        actorUserId: input.actorUserId,
        sponsorUserId: input.sponsorUserId,
        scopeArtifactId: input.scopeArtifact.id,
        scopeArtifactSha256: input.scopeArtifact.sha256,
      }, signingKey),
    })
    .select("id")
    .single();
  if (error || !data?.id) throw error ?? new Error("sponsor_acknowledgement_not_persisted");
  return data.id;
}

export async function appendSponsorDelegationNotice(input: {
  eventId: string;
  actorUserId: string;
  sponsorUserId: string;
  acknowledgementId: string;
  providerMessageId: string;
}): Promise<void> {
  const signingKey = configuredSponsorDelegationSigningKey();
  if (!signingKey) throw new Error("sponsor_delegation_signing_key_required");
  if (!input.providerMessageId || input.providerMessageId.startsWith("console-")) {
    throw new Error("confirmed_email_delivery_required");
  }
  const { error } = await getAzureWriteFluentClient()
    .from("source_event_approvals")
    .insert({
      event_id: input.eventId,
      action: "sponsor_delegate_notice",
      approved_by_user_id: input.actorUserId,
      from_state: input.acknowledgementId,
      to_state: "email_sent",
      stage_key: "scope",
      notes: noticeNotes({
        eventId: input.eventId,
        actorUserId: input.actorUserId,
        acknowledgementId: input.acknowledgementId,
        sponsorUserId: input.sponsorUserId,
        providerMessageId: input.providerMessageId,
      }, signingKey),
    });
  if (error) throw error;
}
