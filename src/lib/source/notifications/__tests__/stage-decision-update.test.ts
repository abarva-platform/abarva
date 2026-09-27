const sendEmailMock = jest.fn<Promise<{ ok: boolean; id: string }>, [unknown]>(
  async () => ({ ok: true, id: "provider-message-1" }),
);
const insertActivityLogMock = jest.fn<Promise<{ ok: boolean }>, [unknown]>(async () => ({ ok: true }));
const rows = [
  { user_id: "user_sponsor", role: "sponsor", notify_on: [] },
  { user_id: "user_reviewer", role: "reviewer", notify_on: ["source_event_update"] },
  { user_id: "user_observer", role: "observer", notify_on: [] },
];
let recordedSponsorContext: unknown = null;
const activityFilters: Record<string, unknown> = {};

jest.mock("@/lib/email/send", () => ({ sendEmail: (input: unknown) => sendEmailMock(input) }));
jest.mock("@/lib/data-plane/write-adapters/sourceWriteAdapter", () => ({
  selectSourceWriteAdapter: () => ({ insertActivityLog: (input: unknown) => insertActivityLogMock(input) }),
}));
jest.mock("@clerk/nextjs/server", () => ({
  clerkClient: async () => ({ users: { getUser: async (id: string) => ({
    primaryEmailAddress: { emailAddress: `${id}@example.test` },
  }) } }),
}));
jest.mock("@/lib/data-plane/postgresCompat", () => ({
  getAzureReadFluentClient: () => ({ from: (table: string) => {
    const chain: Record<string, unknown> = {
      select: () => chain,
      eq: (key: string, value: unknown) => {
        if (table === "source_event_activity") activityFilters[key] = value;
        return chain;
      },
      order: () => chain,
      limit: () => chain,
      maybeSingle: async () => ({ data: recordedSponsorContext ? { metadata: { sponsorContext: recordedSponsorContext } } : null, error: null }),
    };
    chain.then = (resolve: (value: unknown) => unknown) => resolve({ data: table === "source_event_participants" ? rows : [], error: null });
    return chain;
  } }),
}));

import {
  buildStageDecisionUpdate,
  sendSourceStageDecisionUpdates,
  selectStageDecisionUpdateParticipants,
} from "../stage-decision-update";

const participants = [
  { user_id: "user-actor", role: "event owner", notify_on: ["source_event_update"] },
  { user_id: "user-sponsor", role: "sponsor", notify_on: [] },
  { user_id: "user-reviewer", role: "reviewer", notify_on: ["source_event_update"] },
  { user_id: "user-observer", role: "observer", notify_on: [] },
  { user_id: "user-sponsor", role: "sponsor", notify_on: [] },
];

describe("Source stage decision updates", () => {
  beforeEach(() => {
    recordedSponsorContext = null;
    for (const key of Object.keys(activityFilters)) delete activityFilters[key];
  });
  it("notifies the named sponsor and opted-in stakeholders, not the approving actor or everyone", () => {
    expect(selectStageDecisionUpdateParticipants(participants, "user-actor")).toEqual([
      { userId: "user-sponsor", role: "sponsor" },
      { userId: "user-reviewer", role: "reviewer" },
    ]);
  });

  it("reports the user's approval and gives a review link without asking the recipient to approve", () => {
    const message = buildStageDecisionUpdate({
      eventName: "Synthetic sourcing event",
      stageLabel: "Scope",
      actorName: "Casey Rivera",
      reviewUrl: "https://app.abarva.ai/source/events/event-1?stage=scope",
    });
    expect(message.subject).toContain("Scope approved");
    expect(message.text).toContain("Casey Rivera approved the Scope stage");
    expect(message.text).toContain("for information only");
    expect(message.text).not.toMatch(/please approve|your signature|sign off/i);
  });

  it("sends only to approved event recipients and audits provider acceptance separately", async () => {
    process.env.SOURCE_APPROVAL_TEST_RECIPIENT_ALLOWLIST = "user_sponsor@example.test";
    sendEmailMock.mockClear();
    insertActivityLogMock.mockClear();
    await sendSourceStageDecisionUpdates({
      eventId: "event-1", clientKey: "synthetic-client", eventName: "Synthetic sourcing event",
      stageKey: "scope", stageLabel: "Scope", actorUserId: "user_actor", actorName: "Casey Rivera",
    });
    expect(sendEmailMock).toHaveBeenCalledTimes(1);
    expect(sendEmailMock).toHaveBeenCalledWith(expect.objectContaining({ to: "user_sponsor@example.test" }));
    expect(insertActivityLogMock).toHaveBeenCalledWith(expect.objectContaining({
      metadata: expect.objectContaining({ recipientUserId: "user_sponsor", channel: "email_sent", providerMessageId: "provider-message-1" }),
    }));
    expect(insertActivityLogMock).toHaveBeenCalledWith(expect.objectContaining({
      metadata: expect.objectContaining({ recipientUserId: "user_reviewer", channel: "not_allowed" }),
    }));
    delete process.env.SOURCE_APPROVAL_TEST_RECIPIENT_ALLOWLIST;
  });

  it("includes a recorded sponsor address once even without a participant account", async () => {
    process.env.SOURCE_APPROVAL_TEST_RECIPIENT_ALLOWLIST = "morgan@example.test";
    sendEmailMock.mockReset();
    sendEmailMock.mockResolvedValue({ ok: true, id: "provider-message-2" });
    insertActivityLogMock.mockClear();
    await sendSourceStageDecisionUpdates({
      eventId: "event-1", clientKey: "synthetic-client", eventName: "Synthetic sourcing event",
      stageKey: "scope", stageLabel: "Scope", actorUserId: "user_actor", actorName: "Casey Rivera",
      sponsorEmail: "morgan@example.test",
    });
    expect(sendEmailMock).toHaveBeenCalledTimes(1);
    expect(sendEmailMock).toHaveBeenCalledWith(expect.objectContaining({ to: "morgan@example.test" }));
    expect(insertActivityLogMock).toHaveBeenCalledWith(expect.objectContaining({
      metadata: expect.objectContaining({ channel: "email_sent", recipientRole: "sponsor" }),
    }));
    delete process.env.SOURCE_APPROVAL_TEST_RECIPIENT_ALLOWLIST;
  });

  it("reuses the tenant-scoped approved Scope sponsor address for later stage updates", async () => {
    recordedSponsorContext = {
      name: "Morgan Lee", title: "Chief Technology Officer", role: "Executive sponsor",
      email: "morgan@example.test", ownerAcknowledged: true,
    };
    process.env.SOURCE_APPROVAL_TEST_RECIPIENT_ALLOWLIST = "morgan@example.test";
    sendEmailMock.mockReset();
    sendEmailMock.mockResolvedValue({ ok: true, id: "provider-message-3" });
    await sendSourceStageDecisionUpdates({
      eventId: "event-1", clientKey: "synthetic-client", eventName: "Synthetic sourcing event",
      stageKey: "rfp", stageLabel: "RFx", actorUserId: "user_actor", actorName: "Casey Rivera",
    });
    expect(sendEmailMock).toHaveBeenCalledTimes(1);
    expect(sendEmailMock).toHaveBeenCalledWith(expect.objectContaining({ to: "morgan@example.test" }));
    expect(activityFilters).toMatchObject({
      event_id: "event-1", client_key: "synthetic-client",
      action_type: "source_event_approved", stage_key: "scope",
    });
    delete process.env.SOURCE_APPROVAL_TEST_RECIPIENT_ALLOWLIST;
  });

  it("does not claim email delivery when the provider falls back to a console record", async () => {
    process.env.SOURCE_APPROVAL_TEST_RECIPIENT_ALLOWLIST = "user_sponsor@example.test";
    sendEmailMock.mockReset();
    sendEmailMock.mockResolvedValue({ ok: true, id: "console-1" });
    insertActivityLogMock.mockClear();
    await sendSourceStageDecisionUpdates({
      eventId: "event-1", clientKey: "synthetic-client", eventName: "Synthetic sourcing event",
      stageKey: "scope", stageLabel: "Scope", actorUserId: "user_actor", actorName: "Casey Rivera",
    });
    expect(insertActivityLogMock).toHaveBeenCalledWith(expect.objectContaining({
      metadata: expect.objectContaining({ recipientUserId: "user_sponsor", channel: "logged_fallback", providerMessageId: null }),
    }));
    delete process.env.SOURCE_APPROVAL_TEST_RECIPIENT_ALLOWLIST;
  });
});
