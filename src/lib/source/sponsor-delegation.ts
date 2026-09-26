import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";

export interface SponsorDelegationApprovalRow {
  id: string;
  event_id: string;
  action: string;
  approved_by_user_id: string;
  from_state: string | null;
  to_state: string | null;
  stage_key: string | null;
  notes: string | null;
}

export interface ExpectedSponsorDelegation {
  eventId: string;
  sponsorUserId: string;
  scopeArtifactId: string;
  scopeArtifactSha256: string;
}

export const SPONSOR_DELEGATE_STATEMENT =
  "I acknowledge the scope and resourcing as authorized delegate.";

interface AcknowledgementNotes {
  version: 1;
  sponsorUserId: string;
  scopeArtifactId: string;
  scopeArtifactSha256: string;
  statement: string;
  nonce: string;
  signature: string;
}

interface NoticeNotes {
  version: 1;
  sponsorUserId: string;
  providerMessageId: string;
  signature: string;
}

function signature(payload: Record<string, unknown>, key: string): string {
  return createHmac("sha256", key).update(JSON.stringify(payload)).digest("hex");
}

function validSignature(value: unknown, payload: Record<string, unknown>, key: string): boolean {
  if (typeof value !== "string" || !/^[a-f0-9]{64}$/i.test(value)) return false;
  const actual = Buffer.from(value, "hex");
  const expected = Buffer.from(signature(payload, key), "hex");
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

function notesObject(value: string | null): Record<string, unknown> | null {
  if (!value) return null;
  try {
    const parsed: unknown = JSON.parse(value);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? parsed as Record<string, unknown>
      : null;
  } catch {
    return null;
  }
}

export function acknowledgementNotes(input: {
  eventId: string;
  actorUserId: string;
  sponsorUserId: string;
  scopeArtifactId: string;
  scopeArtifactSha256: string;
}, key: string): string {
  if (!key) throw new Error("sponsor_delegation_signing_key_required");
  const { eventId, actorUserId, ...stored } = input;
  const nonce = randomUUID();
  const payload = { version: 1, eventId, actorUserId, ...stored,
    statement: SPONSOR_DELEGATE_STATEMENT, nonce };
  return JSON.stringify({
    version: 1,
    ...stored,
    statement: SPONSOR_DELEGATE_STATEMENT,
    nonce,
    signature: signature(payload, key),
  } satisfies AcknowledgementNotes);
}

export function noticeNotes(input: {
  eventId: string;
  actorUserId: string;
  acknowledgementId: string;
  sponsorUserId: string;
  providerMessageId: string;
}, key: string): string {
  if (!key) throw new Error("sponsor_delegation_signing_key_required");
  const { eventId, actorUserId, acknowledgementId, ...stored } = input;
  return JSON.stringify({
    version: 1,
    ...stored,
    signature: signature({ version: 1, eventId, actorUserId, acknowledgementId, ...stored }, key),
  } satisfies NoticeNotes);
}

export function verifiedDelegatedSponsorAcknowledgement(
  rows: readonly SponsorDelegationApprovalRow[],
  expected: ExpectedSponsorDelegation,
  signingKey: string,
): boolean {
  if (!signingKey) return false;
  return rows.some((ack) => {
    if (
      ack.event_id !== expected.eventId ||
      ack.action !== "sponsor_delegate_acknowledgement" ||
      ack.stage_key !== "scope" ||
      ack.to_state !== "attested" ||
      !ack.approved_by_user_id
    ) return false;
    const details = notesObject(ack.notes);
    if (
      details?.version !== 1 ||
      details.sponsorUserId !== expected.sponsorUserId ||
      details.scopeArtifactId !== expected.scopeArtifactId ||
      details.scopeArtifactSha256 !== expected.scopeArtifactSha256 ||
      details.statement !== SPONSOR_DELEGATE_STATEMENT
    ) return false;
    if (typeof details.nonce !== "string" || !validSignature(details.signature, {
      version: 1,
      eventId: ack.event_id,
      actorUserId: ack.approved_by_user_id,
      sponsorUserId: details.sponsorUserId,
      scopeArtifactId: details.scopeArtifactId,
      scopeArtifactSha256: details.scopeArtifactSha256,
      statement: details.statement,
      nonce: details.nonce,
    }, signingKey)) return false;

    return rows.some((notice) => {
      if (
        notice.event_id !== expected.eventId ||
        notice.action !== "sponsor_delegate_notice" ||
        notice.stage_key !== "scope" ||
        notice.from_state !== ack.id ||
        notice.to_state !== "email_sent" ||
        notice.approved_by_user_id !== ack.approved_by_user_id
      ) return false;
      const delivery = notesObject(notice.notes);
      return (
        delivery?.version === 1 &&
        delivery.sponsorUserId === expected.sponsorUserId &&
        typeof delivery.providerMessageId === "string" &&
        delivery.providerMessageId.length > 0 &&
        !delivery.providerMessageId.startsWith("console-") &&
        validSignature(delivery.signature, {
          version: 1,
          eventId: notice.event_id,
          actorUserId: notice.approved_by_user_id,
          acknowledgementId: notice.from_state,
          sponsorUserId: delivery.sponsorUserId,
          providerMessageId: delivery.providerMessageId,
        }, signingKey)
      );
    });
  });
}
