const sendEmailMock = jest.fn();
jest.mock("@/lib/email/send", () => ({ sendEmail: (...args: unknown[]) => sendEmailMock(...args) }));

import { sendSponsorDelegationNotice } from "../notifications/sponsor-delegation-notice";

const input = {
  sponsorEmail: "sponsor@example.test",
  sponsorName: "Sam Sponsor",
  delegateName: "Alex Delegate",
  eventName: "Test event",
  reviewUrl: "https://app.example.test/source/events/1?stage=scope",
  eventId: "event-1",
};

beforeEach(() => sendEmailMock.mockReset());

it("names the delegate and says the sponsor did not personally sign", async () => {
  sendEmailMock.mockResolvedValue({ ok: true, id: "provider-1" });
  expect(await sendSponsorDelegationNotice(input)).toEqual({ channel: "email_sent", providerMessageId: "provider-1" });
  expect(sendEmailMock).toHaveBeenCalledWith(expect.objectContaining({
    to: input.sponsorEmail,
    text: expect.stringContaining("not your signature or personal approval"),
  }));
  expect(sendEmailMock.mock.calls[0][0].text).toContain("Alex Delegate");
});

it("does not count console-only fallback or provider failure as delivery", async () => {
  sendEmailMock.mockResolvedValueOnce({ ok: true, id: "console-1" });
  expect(await sendSponsorDelegationNotice(input)).toEqual({ channel: "logged_fallback", providerMessageId: null });
  sendEmailMock.mockResolvedValueOnce({ ok: false, error: "down" });
  expect(await sendSponsorDelegationNotice(input)).toEqual({ channel: "error", providerMessageId: null });
});

it("escapes tenant-controlled fields in HTML", async () => {
  sendEmailMock.mockResolvedValue({ ok: true, id: "provider-1" });
  await sendSponsorDelegationNotice({ ...input, eventName: "<img src=x onerror=alert(1)>" });
  expect(sendEmailMock.mock.calls[0][0].html).toContain("&lt;img");
  expect(sendEmailMock.mock.calls[0][0].html).not.toContain("<img");
});
