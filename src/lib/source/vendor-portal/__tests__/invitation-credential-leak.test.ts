const sendEmail = jest.fn().mockResolvedValue({ ok: true });

jest.mock('server-only', () => ({}));
jest.mock('@/lib/email/send', () => ({
  sendEmail: (...args: unknown[]) => sendEmail(...args),
}));

import { sendVendorInvitation } from '../invitation-email';

/**
 * Where the credential plaintext may and may not go.
 *
 * `issueCredential` returns a password whose own doc comment says "Send it,
 * then drop it. Never persist or log this." The invitation email body is the
 * one place it belongs.
 *
 * The constraint that makes this worth a test: `src/lib/email/send.ts` has a
 * no-API-key fallback that logs a structured record of every send — `to`,
 * `from`, `subject`, `hasHtml` and `metadata`, but deliberately NOT the body.
 * So a password that reached `subject` or `metadata` would be written to logs
 * on every developer machine and in any environment without a mail key, while
 * the same password in the body would not. That asymmetry is invisible from
 * the call site, which is exactly why it is pinned here.
 */

const PASSWORD = 'PASSWORD23456789';

const input = {
  vendorDisplayName: 'Northwind Systems',
  contactName: 'A. Contact',
  contactEmail: 'contact@example.invalid',
  eventName: 'Data Platform Build and Rollout',
  buyerDisplayName: 'Example Health',
  portalUrl: 'https://app.example.invalid/rfp/evt-1',
  username: 'abc23xyz',
  password: PASSWORD,
  acceptBy: new Date('2026-10-15T01:00:00Z'),
  respondBy: new Date('2026-10-29T01:00:00Z'),
  procurementContactName: 'P. Lead',
  procurementContactEmail: 'lead@example.invalid',
};

describe('vendor invitation credential handling', () => {
  beforeEach(() => sendEmail.mockClear());

  it('puts the credential in the body and nowhere the dev fallback logs', async () => {
    await sendVendorInvitation(input);

    expect(sendEmail).toHaveBeenCalledTimes(1);
    const [message] = sendEmail.mock.calls[0] as [Record<string, unknown>];

    // The body carries it — otherwise the supplier cannot sign in.
    expect(String(message.html)).toContain(PASSWORD);
    expect(String(message.text)).toContain(PASSWORD);

    // The logged fields must not.
    expect(String(message.subject)).not.toContain(PASSWORD);
    expect(JSON.stringify(message.metadata ?? null)).not.toContain(PASSWORD);
    expect(String(message.to)).not.toContain(PASSWORD);
  });

  it('carries no credential field outside html and text', async () => {
    await sendVendorInvitation(input);
    const [message] = sendEmail.mock.calls[0] as [Record<string, unknown>];

    /*
     * Asserted by sweeping every field rather than naming the three known
     * ones, so a field added to the message later cannot carry the password
     * past this test.
     */
    const leaked = Object.entries(message)
      .filter(([key]) => key !== 'html' && key !== 'text')
      .filter(([, value]) => JSON.stringify(value ?? null).includes(PASSWORD))
      .map(([key]) => key);

    expect(leaked).toEqual([]);
  });

  it('addresses the supplier contact and replies to the named buyer', async () => {
    await sendVendorInvitation(input);
    const [message] = sendEmail.mock.calls[0] as [Record<string, unknown>];

    expect(message.to).toBe('contact@example.invalid');
    expect(message.replyTo).toBe('lead@example.invalid');
  });
});
