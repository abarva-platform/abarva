import {
  acknowledgementNotes,
  noticeNotes,
  verifiedDelegatedSponsorAcknowledgement,
  type SponsorDelegationApprovalRow,
} from "../sponsor-delegation";

const eventId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const artifactId = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const digest = "a".repeat(64);
const sponsorUserId = "sponsor-user";
const delegateUserId = "delegate-user";
const acknowledgementId = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";
const key = "test-only-sponsor-delegation-key";

function receipts(): SponsorDelegationApprovalRow[] {
  return [
    {
      id: acknowledgementId,
      event_id: eventId,
      action: "sponsor_delegate_acknowledgement",
      approved_by_user_id: delegateUserId,
      from_state: null,
      to_state: "attested",
      stage_key: "scope",
      notes: acknowledgementNotes({
        eventId,
        actorUserId: delegateUserId,
        sponsorUserId,
        scopeArtifactId: artifactId,
        scopeArtifactSha256: digest,
      }, key),
    },
    {
      id: "dddddddd-dddd-4ddd-8ddd-dddddddddddd",
      event_id: eventId,
      action: "sponsor_delegate_notice",
      approved_by_user_id: delegateUserId,
      from_state: acknowledgementId,
      to_state: "email_sent",
      stage_key: "scope",
      notes: noticeNotes({ eventId, actorUserId: delegateUserId, acknowledgementId, sponsorUserId, providerMessageId: "msg-1" }, key),
    },
  ];
}

const expected = { eventId, sponsorUserId, scopeArtifactId: artifactId, scopeArtifactSha256: digest };

it("accepts only a delegate acknowledgement paired with a confirmed sponsor notice", () => {
  expect(verifiedDelegatedSponsorAcknowledgement(receipts(), expected, key)).toBe(true);
  expect(verifiedDelegatedSponsorAcknowledgement(receipts().slice(0, 1), expected, key)).toBe(false);
});

it("does not accept a logged fallback as sponsor notification", () => {
  const rows = receipts();
  rows[1].to_state = "logged_fallback";
  expect(verifiedDelegatedSponsorAcknowledgement(rows, expected, key)).toBe(false);
});

it("rejects another sponsor or a changed Scope artifact", () => {
  expect(verifiedDelegatedSponsorAcknowledgement(receipts(), { ...expected, sponsorUserId: "other" }, key)).toBe(false);
  expect(verifiedDelegatedSponsorAcknowledgement(receipts(), { ...expected, scopeArtifactId: "other" }, key)).toBe(false);
  expect(verifiedDelegatedSponsorAcknowledgement(receipts(), { ...expected, scopeArtifactSha256: "b".repeat(64) }, key)).toBe(false);
});

it("rejects receipts from another event or a notice for another acknowledgement", () => {
  expect(verifiedDelegatedSponsorAcknowledgement(receipts(), { ...expected, eventId: "other" }, key)).toBe(false);
  const rows = receipts();
  rows[1].from_state = "another-acknowledgement";
  expect(verifiedDelegatedSponsorAcknowledgement(rows, expected, key)).toBe(false);
});

it("rejects malformed metadata, forged actors, and missing delivery proof", () => {
  const malformed = receipts();
  malformed[0].notes = "not JSON";
  expect(verifiedDelegatedSponsorAcknowledgement(malformed, expected, key)).toBe(false);
  const actorMismatch = receipts();
  actorMismatch[1].approved_by_user_id = "someone-else";
  expect(verifiedDelegatedSponsorAcknowledgement(actorMismatch, expected, key)).toBe(false);
  const missingProviderId = receipts();
  missingProviderId[1].notes = JSON.stringify({ version: 1, sponsorUserId });
  expect(verifiedDelegatedSponsorAcknowledgement(missingProviderId, expected, key)).toBe(false);
});

it("rejects unsigned or altered database receipts and an unconfigured verifier", () => {
  const rows = receipts();
  expect(verifiedDelegatedSponsorAcknowledgement(rows, expected, "")).toBe(false);
  rows[0].notes = JSON.stringify({ ...JSON.parse(rows[0].notes!), sponsorUserId: "other" });
  expect(verifiedDelegatedSponsorAcknowledgement(rows, { ...expected, sponsorUserId: "other" }, key)).toBe(false);
  const noticeRows = receipts();
  noticeRows[1].notes = JSON.stringify({ ...JSON.parse(noticeRows[1].notes!), providerMessageId: "forged" });
  expect(verifiedDelegatedSponsorAcknowledgement(noticeRows, expected, key)).toBe(false);
});
