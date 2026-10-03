import "server-only";

import { clerkClient } from "@clerk/nextjs/server";
import { getAzureReadFluentClient } from "@/lib/data-plane/postgresCompat";
import { sendEmail } from "@/lib/email/send";
import type { TenancyCtx } from "@/lib/programs/types.db";

interface MoveParticipantNotificationRow {
  user_id: string | null;
  role: string | null;
  notify_on: string[] | null;
}

export function selectMoveProgressRecipients(
  rows: MoveParticipantNotificationRow[],
): string[] {
  const recipients = new Set<string>();
  for (const row of rows) {
    const userId = row.user_id?.trim();
    if (
      !userId ||
      !/^(co[- ]?)?sponsor$/i.test(row.role?.trim() ?? "") ||
      !row.notify_on?.includes("phase_gate")
    ) {
      continue;
    }
    recipients.add(userId);
  }
  return [...recipients];
}

export function buildMoveProgressMessage(input: {
  moveName: string;
  fromPhase: number;
  toPhase: number;
  workspaceUrl: string;
}): { subject: string; text: string } {
  return {
    subject: `Move progress: P${input.fromPhase} approved`,
    text: [
      `${input.moveName} has advanced from P${input.fromPhase} to P${input.toPhase}.`,
      "This is a progress update only. An authorized workspace user recorded the approval; no sponsor approval or signature is requested.",
      "View the Move:",
      input.workspaceUrl,
    ].join("\n"),
  };
}

async function participantEmail(userId: string): Promise<string | null> {
  const clerkId = userId.startsWith("clerk:") ? userId.slice(6) : userId;
  if (clerkId.startsWith("user_")) {
    const user = await (await clerkClient()).users.getUser(clerkId);
    return user.primaryEmailAddress?.emailAddress?.trim() || null;
  }
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId)) {
    return null;
  }
  const { data, error } = await getAzureReadFluentClient()
    .from("persons")
    .select("email")
    .eq("id", userId)
    .maybeSingle();
  if (error) throw error;
  return data?.email?.trim() || null;
}

export async function sendMoveProgressUpdate(input: {
  ctx: TenancyCtx;
  programId: string;
  moveName: string;
  fromPhase: number;
  toPhase: number;
}): Promise<void> {
  try {
    const { data, error } = await getAzureReadFluentClient()
      .from("engagement_participants")
      .select(
        "user_id, role, notify_on, engagement:engagements!inner(client_id, archived_at, deleted_at)",
      )
      .eq("engagement_id", input.programId)
      .eq("engagement.client_id", input.ctx.clientId)
      .is("engagement.archived_at", null)
      .is("engagement.deleted_at", null);
    if (error) throw error;

    const recipientIds = selectMoveProgressRecipients(
      (data ?? []) as MoveParticipantNotificationRow[],
    );
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://app.abarva.ai";
    const message = buildMoveProgressMessage({
      moveName: input.moveName,
      fromPhase: input.fromPhase,
      toPhase: input.toPhase,
      workspaceUrl: `${baseUrl}/strategic-moves/${encodeURIComponent(input.programId)}/phase/${input.toPhase}`,
    });
    const seen = new Set<string>();

    for (const userId of recipientIds) {
      try {
        const email = await participantEmail(userId);
        const normalizedEmail = email?.trim().toLowerCase();
        if (!normalizedEmail || seen.has(normalizedEmail)) continue;
        seen.add(normalizedEmail);
        const result = await sendEmail({
          from: process.env.MOVES_PROGRESS_FROM_EMAIL?.trim() || "support@send.abarva.ai",
          to: normalizedEmail,
          subject: message.subject,
          text: message.text,
          html: `<div style="font-family:Arial,sans-serif;white-space:pre-wrap">${escapeHtml(message.text)}</div>`,
          metadata: {
            Event: "moves.phase_gate.progress",
            ProgramId: input.programId,
            FromPhase: String(input.fromPhase),
            ToPhase: String(input.toPhase),
          },
        });
        if (!result.ok) {
          console.warn("[moves progress update] email delivery failed", {
            programId: input.programId,
            recipientUserId: userId,
            error: result.error,
          });
        }
      } catch (deliveryError) {
        console.warn("[moves progress update] recipient delivery failed", {
          programId: input.programId,
          recipientUserId: userId,
          error:
            deliveryError instanceof Error
              ? deliveryError.message
              : String(deliveryError),
        });
      }
    }
  } catch (error) {
    console.warn("[moves progress update] recipient lookup failed", {
      programId: input.programId,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
