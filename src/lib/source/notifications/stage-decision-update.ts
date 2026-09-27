import "server-only";

import { clerkClient } from "@clerk/nextjs/server";
import { getAzureReadFluentClient } from "@/lib/data-plane/postgresCompat";
import { selectSourceWriteAdapter } from "@/lib/data-plane/write-adapters/sourceWriteAdapter";
import { sendEmail } from "@/lib/email/send";
import { parseSourceSponsorContext } from "@/lib/source/sponsor-context";
import { isApprovedTestRecipient } from "./approval-recipient-policy";

export interface StageUpdateParticipant {
  user_id: string | null;
  role: string | null;
  notify_on: string[] | null;
}

export function selectStageDecisionUpdateParticipants(
  rows: StageUpdateParticipant[],
  actorUserId: string,
): Array<{ userId: string; role: string }> {
  const seen = new Set<string>();
  return rows.flatMap((row) => {
    const userId = row.user_id?.trim();
    const role = row.role?.trim() || "stakeholder";
    if (!userId || userId === actorUserId || seen.has(userId)) return [];
    if (role.toLowerCase() !== "sponsor" && !row.notify_on?.includes("source_event_update")) return [];
    seen.add(userId);
    return [{ userId, role }];
  });
}

export function buildStageDecisionUpdate(input: {
  eventName: string;
  stageLabel: string;
  actorName: string;
  reviewUrl: string;
}): { subject: string; text: string } {
  return {
    subject: `${input.stageLabel} approved: ${input.eventName}`,
    text: [
      `${input.actorName} approved the ${input.stageLabel} stage for ${input.eventName}.`,
      "This update is for information only. The signed-in approver made the decision; no approval or signature is requested from you.",
      "Review the current event and its decision record:",
      input.reviewUrl,
      "",
      "This message does not authorize supplier contact, an RFx release, an award, or a contract.",
    ].join("\n"),
  };
}

async function participantEmail(userId: string): Promise<string | null> {
  const clerkId = userId.startsWith("clerk:") ? userId.slice(6) : userId;
  if (clerkId.startsWith("user_")) {
    const user = await (await clerkClient()).users.getUser(clerkId);
    return user.primaryEmailAddress?.emailAddress?.trim() || null;
  }
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId)) return null;
  const { data, error } = await getAzureReadFluentClient()
    .from("persons").select("email").eq("id", userId).maybeSingle();
  if (error) throw error;
  return data?.email?.trim() || null;
}

async function recordedScopeSponsorEmail(eventId: string, clientKey: string): Promise<string | null> {
  const { data, error } = await getAzureReadFluentClient()
    .from("source_event_activity")
    .select("metadata")
    .eq("event_id", eventId)
    .eq("client_key", clientKey)
    .eq("action_type", "source_event_approved")
    .eq("stage_key", "scope")
    .order("occurred_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return parseSourceSponsorContext(data?.metadata?.sponsorContext)?.email ?? null;
}

export async function sendSourceStageDecisionUpdates(input: {
  eventId: string;
  clientKey: string;
  eventName: string;
  stageKey: string;
  stageLabel: string;
  actorUserId: string;
  actorName: string;
  sponsorEmail?: string;
}): Promise<void> {
  const { data, error } = await getAzureReadFluentClient()
    .from("source_event_participants")
    .select("user_id, role, notify_on")
    .eq("source_event_id", input.eventId)
    .eq("client_key", input.clientKey);
  if (error) throw error;
  const participants = selectStageDecisionUpdateParticipants(
    (data ?? []) as StageUpdateParticipant[], input.actorUserId,
  );
  let sponsorEmail = input.sponsorEmail ?? null;
  if (!sponsorEmail) {
    try {
      sponsorEmail = await recordedScopeSponsorEmail(input.eventId, input.clientKey);
    } catch (error) {
      console.warn("[source stage decision update] sponsor context read failed", error);
    }
  }
  const recipients: Array<{ userId: string | null; role: string; email?: string }> = [
    ...(sponsorEmail ? [{ userId: null, role: "sponsor", email: sponsorEmail }] : []),
    ...participants,
  ];
  const base = process.env.NEXT_PUBLIC_APP_URL || "https://app.abarva.ai";
  const message = buildStageDecisionUpdate({
    eventName: input.eventName,
    stageLabel: input.stageLabel,
    actorName: input.actorName,
    reviewUrl: `${base}/source/events/${encodeURIComponent(input.eventId)}?stage=${encodeURIComponent(input.stageKey)}`,
  });
  const seenEmails = new Set<string>();
  for (const recipient of recipients) {
    let channel: "email_sent" | "logged_fallback" | "not_allowed" | "error" = "error";
    let providerMessageId: string | null = null;
    let email: string | null = null;
    try {
      email = recipient.email ?? (recipient.userId ? await participantEmail(recipient.userId) : null);
      if (email) {
        email = email.trim().toLowerCase();
        if (seenEmails.has(email)) continue;
        seenEmails.add(email);
      }
      if (!email || !isApprovedTestRecipient(email, process.env.SOURCE_APPROVAL_TEST_RECIPIENT_ALLOWLIST)) {
        channel = "not_allowed";
      } else {
        const delivery = await sendEmail({
          from: process.env.SOURCE_APPROVAL_FROM_EMAIL?.trim() || "support@send.abarva.ai",
          to: email,
          subject: message.subject,
          text: message.text,
          html: `<div style="font-family:Arial,sans-serif;white-space:pre-wrap">${escapeHtml(message.text)}</div>`,
          metadata: { eventId: input.eventId, kind: "source_stage_decision_update" },
        });
        if (delivery.ok && delivery.id && !delivery.id.startsWith("console-")) {
          channel = "email_sent";
          providerMessageId = delivery.id;
        } else {
          channel = delivery.ok ? "logged_fallback" : "error";
        }
      }
    } catch (error) {
      console.warn("[source stage decision update] recipient delivery failed", error);
    }
    const audit = await selectSourceWriteAdapter(undefined, input.clientKey).insertActivityLog({
      eventId: input.eventId,
      clientKey: input.clientKey,
      actorUserId: input.actorUserId,
      actorDisplayName: input.actorName,
      actorRole: "source_stage_approver",
      actionType: "source_stage_decision_notification",
      actionLabel: "Stage decision update processed",
      stageKey: input.stageKey,
      reason: null,
      metadata: { recipientUserId: recipient.userId, recipientEmail: email, recipientRole: recipient.role, channel, providerMessageId },
      occurredAtIso: new Date().toISOString(),
    });
    if (!audit.ok) console.error("[source stage decision update] notification audit failed", audit.error);
  }
}

function escapeHtml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}
